import { Request, Response, NextFunction } from 'express';
import { requireAdmin } from '../../middleware/auth';
import { User } from '../../models/User';

// Mock the User model
jest.mock('../../models/User');

describe('Admin Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('requireAdmin', () => {
    it('should call next() for admin user', async () => {
      const mockUser = {
        id: 1,
        basalam_user_id: 'admin123',
        vendor_id: 12345,
        username: 'admin',
        is_admin: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockRequest.user = mockUser;

      // Mock the checkAdminStatus function to return true
      // Since it's a private function, we'll mock the environment variables
      process.env.ADMIN_USER_IDS = '1';

      await requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not admin', async () => {
      const mockUser = {
        id: 2,
        basalam_user_id: 'user123',
        vendor_id: 12345,
        username: 'regularuser',
        is_admin: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockRequest.user = mockUser;

      // Clear admin environment variables
      delete process.env.ADMIN_USER_IDS;
      delete process.env.ADMIN_BASALAM_USER_IDS;

      await requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Admin access required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should check admin status by basalam user ID', async () => {
      const mockUser = {
        id: 2,
        basalam_user_id: 'admin_basalam_123',
        vendor_id: 12345,
        username: 'admin',
        is_admin: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockRequest.user = mockUser;

      // Set admin basalam user IDs
      process.env.ADMIN_BASALAM_USER_IDS = 'admin_basalam_123,admin_basalam_456';

      await requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const mockUser = {
        id: 1,
        basalam_user_id: 'user123',
        vendor_id: 12345,
        username: 'user',
        is_admin: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockRequest.user = mockUser;

      // Clear admin environment variables to simulate non-admin user
      delete process.env.ADMIN_USER_IDS;
      delete process.env.ADMIN_BASALAM_USER_IDS;

      await requireAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Admin access required' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.ADMIN_USER_IDS;
    delete process.env.ADMIN_BASALAM_USER_IDS;
  });
});