import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/auth';
import { authService } from '../../services/AuthService';
import { User } from '../../models/User';

// Mock dependencies
jest.mock('../../services/AuthService', () => ({
  authService: {
    generateAuthUrl: jest.fn(),
    exchangeCodeForToken: jest.fn(),
    validateScopes: jest.fn(),
    getUserInfo: jest.fn(),
    createOrUpdateUser: jest.fn(),
    generateJWT: jest.fn(),
    generateRefreshJWT: jest.fn(),
    verifyJWT: jest.fn(),
    verifyRefreshJWT: jest.fn(),
    logActivity: jest.fn(),
  },
}));

jest.mock('../../models/User', () => ({
  User: {
    findById: jest.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Add cookie parsing middleware for tests
app.use((req, res, next) => {
  const cookies: Record<string, string> = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(cookie => {
      const parts = cookie.trim().split('=');
      if (parts.length === 2) {
        cookies[parts[0]] = decodeURIComponent(parts[1]);
      }
    });
  }
  req.cookies = cookies;
  next();
});

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/auth/login', () => {
    it('should redirect to Basalam OAuth URL', async () => {
      const mockAuthUrl = 'https://api.basalam.com/oauth/authorize?client_id=test&redirect_uri=callback&response_type=code&scope=vendor.product.read%20vendor.product.write&state=test-state';
      
      (authService.generateAuthUrl as jest.Mock).mockReturnValue(mockAuthUrl);

      const response = await request(app)
        .get('/api/auth/login?state=test-state')
        .expect(302);

      expect(response.headers.location).toBe(mockAuthUrl);
      expect(authService.generateAuthUrl).toHaveBeenCalledWith('test-state');
    });

    it('should handle errors gracefully', async () => {
      (authService.generateAuthUrl as jest.Mock).mockImplementation(() => {
        throw new Error('OAuth configuration error');
      });

      const response = await request(app)
        .get('/api/auth/login')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to initiate login',
        message: 'Unable to redirect to Basalam authentication'
      });
    });
  });

  describe('GET /api/auth/callback', () => {
    it('should handle successful OAuth callback', async () => {
      const mockTokens = {
        access_token: 'basalam-access-token',
        refresh_token: 'basalam-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'vendor.product.read vendor.product.write',
      };

      const mockUserInfo = {
        id: 'basalam-123',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        vendor_id: 456,
      };

      const mockUser = {
        id: 1,
        basalam_user_id: 'basalam-123',
        vendor_id: 456,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
      };

      (authService.exchangeCodeForToken as jest.Mock).mockResolvedValue(mockTokens);
      (authService.validateScopes as jest.Mock).mockReturnValue(true);
      (authService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (authService.createOrUpdateUser as jest.Mock).mockResolvedValue(mockUser);
      (authService.generateJWT as jest.Mock).mockReturnValue('jwt-access-token');
      (authService.generateRefreshJWT as jest.Mock).mockReturnValue('jwt-refresh-token');

      const response = await request(app)
        .get('/api/auth/callback?code=auth-code&state=test-state')
        .expect(302);

      expect(response.headers.location).toBe(`${process.env.FRONTEND_URL}/dashboard`);
      expect(authService.exchangeCodeForToken).toHaveBeenCalledWith('auth-code');
      expect(authService.validateScopes).toHaveBeenCalledWith(mockTokens.scope, ['vendor.product.read', 'vendor.product.write']);
      expect(authService.getUserInfo).toHaveBeenCalledWith(mockTokens.access_token);
      expect(authService.createOrUpdateUser).toHaveBeenCalledWith(mockUserInfo, mockTokens, expect.any(String));
    });

    it('should handle OAuth error', async () => {
      const response = await request(app)
        .get('/api/auth/callback?error=access_denied&error_description=User%20denied%20access')
        .expect(302);

      expect(response.headers.location).toContain('/auth/error?error=access_denied');
    });

    it('should handle missing code', async () => {
      const response = await request(app)
        .get('/api/auth/callback')
        .expect(302);

      expect(response.headers.location).toContain('/auth/error?error=missing_code');
    });

    it('should handle insufficient permissions', async () => {
      const mockTokens = {
        access_token: 'basalam-access-token',
        refresh_token: 'basalam-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'vendor.product.read', // Missing write permission
      };

      (authService.exchangeCodeForToken as jest.Mock).mockResolvedValue(mockTokens);
      (authService.validateScopes as jest.Mock).mockReturnValue(false);

      const response = await request(app)
        .get('/api/auth/callback?code=auth-code')
        .expect(302);

      expect(response.headers.location).toContain('/auth/error?error=insufficient_permissions');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info for authenticated user', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        vendor_id: 456,
        created_at: new Date(),
      };

      const mockPayload = { userId: 1, username: 'testuser' };

      (authService.verifyJWT as jest.Mock).mockReturnValue(mockPayload);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.user).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        name: mockUser.name,
        email: mockUser.email,
        vendor_id: mockUser.vendor_id,
        created_at: mockUser.created_at.toISOString(),
      });
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toEqual({ error: 'Access token required' });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout authenticated user', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockPayload = { userId: 1, username: 'testuser' };

      (authService.verifyJWT as jest.Mock).mockReturnValue(mockPayload);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (authService.logActivity as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({ message: 'Logged out successfully' });
      expect(authService.logActivity).toHaveBeenCalledWith(
        1,
        'user_logout',
        { method: 'manual' },
        expect.any(String)
      );
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const mockUser = {
        id: 1,
        basalam_user_id: 'basalam-123',
        vendor_id: 456,
        username: 'testuser',
      };

      const mockPayload = { userId: 1, username: 'testuser' };

      (authService.verifyRefreshJWT as jest.Mock).mockReturnValue(mockPayload);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (authService.generateJWT as jest.Mock).mockReturnValue('new-access-token');
      (authService.logActivity as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'valid-refresh-token' })
        .expect(200);

      expect(response.body).toEqual({
        message: 'Token refreshed successfully',
        access_token: 'new-access-token'
      });
      expect(authService.verifyRefreshJWT).toHaveBeenCalledWith('valid-refresh-token');
      expect(authService.generateJWT).toHaveBeenCalled();
    });

    it('should return 401 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body).toEqual({ error: 'Refresh token required' });
    });

    it('should return 401 for invalid refresh token', async () => {
      (authService.verifyRefreshJWT as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'invalid-refresh-token' })
        .expect(401);

      expect(response.body).toEqual({ error: 'Invalid or expired refresh token' });
    });
  });

  describe('GET /api/auth/status', () => {
    it('should return authentication status for authenticated user', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        vendor_id: 456,
      };

      const mockPayload = { userId: 1, username: 'testuser' };

      (authService.verifyJWT as jest.Mock).mockReturnValue(mockPayload);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/status')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        authenticated: true,
        user: {
          id: mockUser.id,
          username: mockUser.username,
          name: mockUser.name,
          vendor_id: mockUser.vendor_id,
        }
      });
    });
  });
});