import { Request, Response, NextFunction } from 'express';
import { authenticateToken, requireActiveSubscription, optionalAuth } from '../../middleware/auth';
import { authService } from '../../services/AuthService';
import { User } from '../../models/User';
import { Subscription } from '../../models/Subscription';
import { SessionManager } from '../../utils/session';

// Mock dependencies
jest.mock('../../services/AuthService', () => ({
  authService: {
    verifyJWT: jest.fn(),
    verifyRefreshJWT: jest.fn(),
  },
}));

jest.mock('../../models/User', () => ({
  User: {
    findById: jest.fn(),
  },
}));

jest.mock('../../models/Subscription', () => ({
  Subscription: {
    findActiveByUserId: jest.fn(),
  },
}));

jest.mock('../../utils/session', () => ({
  SessionManager: {
    extractAccessToken: jest.fn(),
    extractRefreshToken: jest.fn(),
  },
}));

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      cookies: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token successfully', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockPayload = { userId: 1, username: 'testuser' };

      (SessionManager.extractAccessToken as jest.Mock).mockReturnValue('valid-token');
      (authService.verifyJWT as jest.Mock).mockReturnValue(mockPayload);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(SessionManager.extractAccessToken).toHaveBeenCalledWith(mockRequest);
      expect(authService.verifyJWT).toHaveBeenCalledWith('valid-token');
      expect(User.findById).toHaveBeenCalledWith(1);
      expect(mockRequest.user).toBe(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no token provided', async () => {
      (SessionManager.extractAccessToken as jest.Mock).mockReturnValue(null);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      (SessionManager.extractAccessToken as jest.Mock).mockReturnValue('invalid-token');
      (authService.verifyJWT as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user not found', async () => {
      const mockPayload = { userId: 1, username: 'testuser' };

      (SessionManager.extractAccessToken as jest.Mock).mockReturnValue('valid-token');
      (authService.verifyJWT as jest.Mock).mockReturnValue(mockPayload);
      (User.findById as jest.Mock).mockResolvedValue(null);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireActiveSubscription', () => {
    beforeEach(() => {
      mockRequest.user = { id: 1, username: 'testuser' } as any;
    });

    it('should allow access with active subscription', async () => {
      const mockSubscription = {
        id: 1,
        user_id: 1,
        end_date: new Date(Date.now() + 86400000), // Tomorrow
        status: 'active',
      };

      (Subscription.findActiveByUserId as jest.Mock).mockResolvedValue(mockSubscription);

      await requireActiveSubscription(mockRequest as Request, mockResponse as Response, mockNext);

      expect(Subscription.findActiveByUserId).toHaveBeenCalledWith(1);
      expect(mockRequest.subscription).toBe(mockSubscription);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when user not authenticated', async () => {
      mockRequest.user = undefined;

      await requireActiveSubscription(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when no active subscription', async () => {
      (Subscription.findActiveByUserId as jest.Mock).mockResolvedValue(null);

      await requireActiveSubscription(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Active subscription required',
        message: 'Please subscribe to access this feature'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when subscription is expired', async () => {
      const mockSubscription = {
        id: 1,
        user_id: 1,
        end_date: new Date(Date.now() - 86400000), // Yesterday
        status: 'active',
      };

      (Subscription.findActiveByUserId as jest.Mock).mockResolvedValue(mockSubscription);

      await requireActiveSubscription(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Subscription expired',
        message: 'Your subscription has expired. Please renew to continue.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should set user when valid token provided', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockPayload = { userId: 1, username: 'testuser' };

      (SessionManager.extractAccessToken as jest.Mock).mockReturnValue('valid-token');
      (authService.verifyJWT as jest.Mock).mockReturnValue(mockPayload);
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBe(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when no token provided', async () => {
      (SessionManager.extractAccessToken as jest.Mock).mockReturnValue(null);

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when token is invalid', async () => {
      (SessionManager.extractAccessToken as jest.Mock).mockReturnValue('invalid-token');
      (authService.verifyJWT as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when user not found', async () => {
      const mockPayload = { userId: 1, username: 'testuser' };

      (SessionManager.extractAccessToken as jest.Mock).mockReturnValue('valid-token');
      (authService.verifyJWT as jest.Mock).mockReturnValue(mockPayload);
      (User.findById as jest.Mock).mockResolvedValue(null);

      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});