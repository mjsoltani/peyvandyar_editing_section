import { AuthService } from '../../services/AuthService';
import jwt from 'jsonwebtoken';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.BASALAM_CLIENT_ID = 'test-client-id';
process.env.BASALAM_CLIENT_SECRET = 'test-client-secret';
process.env.BASALAM_REDIRECT_URI = 'http://localhost:3001/api/auth/callback';
process.env.BASALAM_API_BASE_URL = 'https://api.basalam.com';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('generateAuthUrl', () => {
    it('should generate valid OAuth authorization URL', () => {
      const authUrl = authService.generateAuthUrl('test-state');
      
      expect(authUrl).toContain('https://api.basalam.com/oauth/authorize');
      expect(authUrl).toContain('client_id=test-client-id');
      expect(authUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fcallback');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('scope=vendor.product.read+vendor.product.write');
      expect(authUrl).toContain('state=test-state');
    });

    it('should generate random state when not provided', () => {
      const authUrl1 = authService.generateAuthUrl();
      const authUrl2 = authService.generateAuthUrl();
      
      // Extract state from URLs
      const state1 = new URL(authUrl1).searchParams.get('state');
      const state2 = new URL(authUrl2).searchParams.get('state');
      
      expect(state1).toBeTruthy();
      expect(state2).toBeTruthy();
      expect(state1).not.toBe(state2);
    });
  });

  describe('JWT Token Management', () => {
    const testPayload = {
      userId: 1,
      basalamUserId: 'basalam-123',
      vendorId: 456,
      username: 'testuser',
    };

    it('should generate and verify JWT token', () => {
      const token = authService.generateJWT(testPayload);
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      
      const decoded = authService.verifyJWT(token);
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.basalamUserId).toBe(testPayload.basalamUserId);
      expect(decoded.vendorId).toBe(testPayload.vendorId);
      expect(decoded.username).toBe(testPayload.username);
    });

    it('should generate and verify refresh JWT token', () => {
      const refreshToken = authService.generateRefreshJWT(testPayload);
      
      expect(refreshToken).toBeTruthy();
      expect(typeof refreshToken).toBe('string');
      
      const decoded = authService.verifyRefreshJWT(refreshToken);
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.basalamUserId).toBe(testPayload.basalamUserId);
      expect(decoded.vendorId).toBe(testPayload.vendorId);
      expect(decoded.username).toBe(testPayload.username);
    });

    it('should throw error for invalid JWT token', () => {
      expect(() => {
        authService.verifyJWT('invalid-token');
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => {
        authService.verifyRefreshJWT('invalid-refresh-token');
      }).toThrow('Invalid or expired refresh token');
    });

    it('should throw error for expired token', () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { ...testPayload, exp: Math.floor(Date.now() / 1000) - 60 }, // Expired 1 minute ago
        process.env.JWT_SECRET!
      );
      
      expect(() => {
        authService.verifyJWT(expiredToken);
      }).toThrow('Invalid or expired token');
    });
  });

  describe('validateScopes', () => {
    it('should validate required scopes correctly', () => {
      const receivedScopes = 'vendor.product.read vendor.product.write user.profile';
      const requiredScopes = ['vendor.product.read', 'vendor.product.write'];
      
      const isValid = authService.validateScopes(receivedScopes, requiredScopes);
      expect(isValid).toBe(true);
    });

    it('should return false for missing scopes', () => {
      const receivedScopes = 'vendor.product.read';
      const requiredScopes = ['vendor.product.read', 'vendor.product.write'];
      
      const isValid = authService.validateScopes(receivedScopes, requiredScopes);
      expect(isValid).toBe(false);
    });

    it('should return false for empty scopes', () => {
      const receivedScopes = '';
      const requiredScopes = ['vendor.product.read'];
      
      const isValid = authService.validateScopes(receivedScopes, requiredScopes);
      expect(isValid).toBe(false);
    });
  });

  describe('Constructor validation', () => {
    it('should throw error for missing JWT secrets', () => {
      const originalJwtSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      expect(() => {
        new AuthService();
      }).toThrow('JWT secrets are required');
      
      process.env.JWT_SECRET = originalJwtSecret;
    });

    it('should throw error for missing Basalam credentials', () => {
      const originalClientId = process.env.BASALAM_CLIENT_ID;
      delete process.env.BASALAM_CLIENT_ID;
      
      expect(() => {
        new AuthService();
      }).toThrow('Basalam OAuth credentials are required');
      
      process.env.BASALAM_CLIENT_ID = originalClientId;
    });
  });
});