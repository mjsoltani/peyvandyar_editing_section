import request from 'supertest';
import express from 'express';
import adminRoutes from '../../routes/admin';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { User } from '../../models/User';
import { Subscription } from '../../models/Subscription';
import { PaymentRequest } from '../../models/PaymentRequest';
import { ActivityLog } from '../../models/ActivityLog';

// Mock the middleware
jest.mock('../../middleware/auth');
jest.mock('../../models/User');
jest.mock('../../models/Subscription');
jest.mock('../../models/PaymentRequest');
jest.mock('../../models/ActivityLog');

const app = express();
app.use(express.json());
app.use('/admin', adminRoutes);

const mockAuthenticateToken = authenticateToken as jest.MockedFunction<typeof authenticateToken>;
const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>;

describe('Admin Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock middleware to pass authentication
    mockAuthenticateToken.mockImplementation((req, res, next) => {
      req.user = {
        id: 1,
        basalam_user_id: 'admin123',
        vendor_id: 12345,
        username: 'admin',
        name: 'Admin User',
        email: 'admin@test.com',
        is_admin: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      next();
    });

    mockRequireAdmin.mockImplementation((req, res, next) => {
      next();
    });
  });

  describe('GET /admin/dashboard', () => {
    it('should return dashboard stats', async () => {
      // Mock the model methods
      (User.count as jest.Mock).mockResolvedValue(100);
      (Subscription.countActive as jest.Mock).mockResolvedValue(50);
      (PaymentRequest.countPending as jest.Mock).mockResolvedValue(5);
      (PaymentRequest.getTotalRevenue as jest.Mock).mockResolvedValue(1000000);
      (ActivityLog.getRecent as jest.Mock).mockResolvedValue([]);
      (Subscription.getStatsByPlan as jest.Mock).mockResolvedValue([]);
      (PaymentRequest.getMonthlyRevenue as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/admin/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('totalUsers', 100);
      expect(response.body.stats).toHaveProperty('activeSubscriptions', 50);
      expect(response.body.stats).toHaveProperty('pendingPayments', 5);
      expect(response.body.stats).toHaveProperty('totalRevenue', 1000000);
    });

    it('should handle errors gracefully', async () => {
      (User.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/admin/dashboard')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to fetch dashboard stats');
    });
  });

  describe('GET /admin/users', () => {
    it('should return paginated users list', async () => {
      const mockUsersData = {
        users: [
          {
            id: 1,
            username: 'testuser',
            name: 'Test User',
            email: 'test@example.com',
            vendor_id: 12345,
            is_active: true,
            created_at: new Date().toISOString(),
            subscription_status: 'active'
          }
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1
      };

      (User.findAllWithSubscriptions as jest.Mock).mockResolvedValue(mockUsersData);

      const response = await request(app)
        .get('/admin/users')
        .expect(200);

      expect(response.body).toEqual(mockUsersData);
      expect(User.findAllWithSubscriptions).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: undefined,
        status: undefined
      });
    });

    it('should handle search and filter parameters', async () => {
      const mockUsersData = {
        users: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      };

      (User.findAllWithSubscriptions as jest.Mock).mockResolvedValue(mockUsersData);

      await request(app)
        .get('/admin/users?search=test&status=active&page=2&limit=10')
        .expect(200);

      expect(User.findAllWithSubscriptions).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: 'test',
        status: 'active'
      });
    });
  });

  describe('PATCH /admin/users/:id/toggle-status', () => {
    it('should toggle user status successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        is_active: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      (User.findById as jest.Mock).mockResolvedValue({ id: 1, is_active: true });
      (User.toggleActiveStatus as jest.Mock).mockResolvedValue(mockUser);
      (ActivityLog.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .patch('/admin/users/1/toggle-status')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User status updated successfully');
      expect(response.body).toHaveProperty('user');
      expect(User.toggleActiveStatus).toHaveBeenCalledWith(1);
      expect(ActivityLog.create).toHaveBeenCalled();
    });

    it('should return 404 for non-existent user', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .patch('/admin/users/999/toggle-status')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('GET /admin/payments', () => {
    it('should return paginated payment requests', async () => {
      const mockPaymentsData = {
        payments: [
          {
            id: 1,
            user_id: 1,
            username: 'testuser',
            subscription_plan: '1_month',
            amount: 150000,
            status: 'pending',
            created_at: new Date().toISOString()
          }
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1
      };

      (PaymentRequest.findAllWithUserDetails as jest.Mock).mockResolvedValue(mockPaymentsData);

      const response = await request(app)
        .get('/admin/payments')
        .expect(200);

      expect(response.body).toEqual(mockPaymentsData);
    });
  });

  describe('PATCH /admin/payments/:id', () => {
    it('should approve payment request successfully', async () => {
      const mockPayment = {
        id: 1,
        user_id: 1,
        subscription_plan: '1_month',
        amount: 150000,
        status: 'pending'
      };

      const mockUpdatedPayment = { ...mockPayment, status: 'approved' };

      (PaymentRequest.findById as jest.Mock).mockResolvedValue(mockPayment);
      (PaymentRequest.updateStatus as jest.Mock).mockResolvedValue(mockUpdatedPayment);
      (Subscription.createFromPayment as jest.Mock).mockResolvedValue({});
      (ActivityLog.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .patch('/admin/payments/1')
        .send({ status: 'approved', notes: 'Payment verified' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Payment approved successfully');
      expect(PaymentRequest.updateStatus).toHaveBeenCalledWith(1, 'approved', 'Payment verified');
      expect(Subscription.createFromPayment).toHaveBeenCalledWith(mockPayment);
    });

    it('should reject payment request successfully', async () => {
      const mockPayment = {
        id: 1,
        user_id: 1,
        subscription_plan: '1_month',
        amount: 150000,
        status: 'pending'
      };

      const mockUpdatedPayment = { ...mockPayment, status: 'rejected' };

      (PaymentRequest.findById as jest.Mock).mockResolvedValue(mockPayment);
      (PaymentRequest.updateStatus as jest.Mock).mockResolvedValue(mockUpdatedPayment);
      (ActivityLog.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .patch('/admin/payments/1')
        .send({ status: 'rejected', notes: 'Invalid payment proof' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Payment rejected successfully');
      expect(PaymentRequest.updateStatus).toHaveBeenCalledWith(1, 'rejected', 'Invalid payment proof');
      expect(Subscription.createFromPayment).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .patch('/admin/payments/1')
        .send({ status: 'invalid' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid status. Must be "approved" or "rejected"');
    });

    it('should return 404 for non-existent payment', async () => {
      (PaymentRequest.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .patch('/admin/payments/999')
        .send({ status: 'approved' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Payment request not found');
    });

    it('should return 400 for non-pending payment', async () => {
      const mockPayment = {
        id: 1,
        status: 'approved'
      };

      (PaymentRequest.findById as jest.Mock).mockResolvedValue(mockPayment);

      const response = await request(app)
        .patch('/admin/payments/1')
        .send({ status: 'approved' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Payment request is not pending');
    });
  });

  describe('GET /admin/analytics/revenue', () => {
    it('should return revenue analytics', async () => {
      const mockRevenueData = {
        period: 'monthly',
        data: [
          { date: '2024-01', revenue: 500000, count: 5 },
          { date: '2024-02', revenue: 750000, count: 8 }
        ],
        total_revenue: 1250000,
        total_count: 13
      };

      (PaymentRequest.getRevenueAnalytics as jest.Mock).mockResolvedValue(mockRevenueData);

      const response = await request(app)
        .get('/admin/analytics/revenue?period=monthly')
        .expect(200);

      expect(response.body).toEqual(mockRevenueData);
      expect(PaymentRequest.getRevenueAnalytics).toHaveBeenCalledWith({
        period: 'monthly',
        startDate: undefined,
        endDate: undefined
      });
    });
  });

  describe('GET /admin/analytics/users', () => {
    it('should return user behavior analytics', async () => {
      const mockUserAnalytics = {
        period: 'monthly',
        data: [
          { date: '2024-01', logins: 100, product_updates: 50, batch_updates: 10 },
          { date: '2024-02', logins: 120, product_updates: 60, batch_updates: 15 }
        ],
        total_users: 100,
        active_users: 75
      };

      (ActivityLog.getUserBehaviorAnalytics as jest.Mock).mockResolvedValue(mockUserAnalytics);

      const response = await request(app)
        .get('/admin/analytics/users?period=monthly')
        .expect(200);

      expect(response.body).toEqual(mockUserAnalytics);
      expect(ActivityLog.getUserBehaviorAnalytics).toHaveBeenCalledWith('monthly');
    });
  });
});