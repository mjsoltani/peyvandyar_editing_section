import { SubscriptionService } from '../../services/SubscriptionService';
import { Pool } from 'pg';
import { SUBSCRIPTION_PLANS } from '../../models/Subscription';

// Mock database
const mockDb = {
  query: jest.fn(),
} as unknown as Pool;

// Mock job scheduler
jest.mock('../../utils/jobScheduler', () => ({
  jobScheduler: {
    scheduleAutoApproval: jest.fn().mockReturnValue('job-123'),
    cancelJob: jest.fn().mockReturnValue(true),
  },
}));

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;

  beforeEach(() => {
    subscriptionService = new SubscriptionService(mockDb);
    jest.clearAllMocks();
  });

  describe('getSubscriptionPlans', () => {
    it('should return all subscription plans', () => {
      const plans = subscriptionService.getSubscriptionPlans();
      
      expect(plans).toEqual(SUBSCRIPTION_PLANS);
      expect(plans['1_month']).toBeDefined();
      expect(plans['3_month']).toBeDefined();
      expect(plans['6_month']).toBeDefined();
    });

    it('should have correct plan structure', () => {
      const plans = subscriptionService.getSubscriptionPlans();
      
      Object.values(plans).forEach(plan => {
        expect(plan).toHaveProperty('name');
        expect(plan).toHaveProperty('price');
        expect(plan).toHaveProperty('duration_days');
        expect(typeof plan.price).toBe('number');
        expect(typeof plan.duration_days).toBe('number');
      });
    });
  });

  describe('createPaymentRequest', () => {
    it('should create payment request successfully', async () => {
      const mockPaymentRequest = {
        id: 1,
        user_id: 1,
        subscription_plan: '1_month',
        amount: 150000,
        status: 'pending',
        payment_method: 'card_to_card',
        admin_card_number: '6037-9977-0000-0000',
        created_at: new Date(),
      };

      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [mockPaymentRequest],
      });

      const result = await subscriptionService.createPaymentRequest({
        user_id: 1,
        subscription_plan: '1_month',
        amount: 150000,
        admin_card_number: '6037-9977-0000-0000',
      });

      expect(result).toEqual(mockPaymentRequest);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO payment_requests'),
        [1, '1_month', 150000, 'card_to_card', '6037-9977-0000-0000', null]
      );
    });
  });

  describe('getPaymentRequestById', () => {
    it('should return payment request when found', async () => {
      const mockPaymentRequest = {
        id: 1,
        user_id: 1,
        subscription_plan: '1_month',
        amount: 150000,
        status: 'pending',
      };

      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [mockPaymentRequest],
      });

      const result = await subscriptionService.getPaymentRequestById(1);

      expect(result).toEqual(mockPaymentRequest);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM payment_requests WHERE id = $1',
        [1]
      );
    });

    it('should return null when payment request not found', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const result = await subscriptionService.getPaymentRequestById(999);

      expect(result).toBeNull();
    });
  });

  describe('updatePaymentRequest', () => {
    it('should update payment request status', async () => {
      const mockUpdatedPayment = {
        id: 1,
        status: 'approved',
        approved_at: new Date(),
      };

      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [mockUpdatedPayment],
      });

      const result = await subscriptionService.updatePaymentRequest(1, {
        status: 'approved',
        approved_at: new Date(),
      });

      expect(result).toEqual(mockUpdatedPayment);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE payment_requests'),
        expect.arrayContaining(['approved', 1])
      );
    });

    it('should return existing payment when no updates provided', async () => {
      const mockPaymentRequest = { id: 1, status: 'pending' };

      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [mockPaymentRequest],
      });

      const result = await subscriptionService.updatePaymentRequest(1, {});

      expect(result).toEqual(mockPaymentRequest);
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM payment_requests WHERE id = $1',
        [1]
      );
    });
  });

  describe('createSubscription', () => {
    it('should create subscription successfully', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 30);

      const mockSubscription = {
        id: 1,
        user_id: 1,
        plan_type: '1_month',
        price: 150000,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
      };

      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [mockSubscription],
      });

      const result = await subscriptionService.createSubscription({
        user_id: 1,
        plan_type: '1_month',
        price: 150000,
        start_date: startDate,
        end_date: endDate,
      });

      expect(result).toEqual(mockSubscription);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO subscriptions'),
        [1, '1_month', 150000, startDate, endDate]
      );
    });
  });

  describe('getUserActiveSubscription', () => {
    it('should return active subscription when exists', async () => {
      const mockSubscription = {
        id: 1,
        user_id: 1,
        status: 'active',
        end_date: new Date(Date.now() + 86400000), // Tomorrow
      };

      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [mockSubscription],
      });

      const result = await subscriptionService.getUserActiveSubscription(1);

      expect(result).toEqual(mockSubscription);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1 AND status = \'active\' AND end_date > NOW()'),
        [1]
      );
    });

    it('should return null when no active subscription', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const result = await subscriptionService.getUserActiveSubscription(1);

      expect(result).toBeNull();
    });
  });

  describe('hasActiveSubscription', () => {
    it('should return true when user has active subscription', async () => {
      const mockSubscription = { id: 1, status: 'active' };

      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [mockSubscription],
      });

      const result = await subscriptionService.hasActiveSubscription(1);

      expect(result).toBe(true);
    });

    it('should return false when user has no active subscription', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const result = await subscriptionService.hasActiveSubscription(1);

      expect(result).toBe(false);
    });
  });

  describe('getExpiryWarning', () => {
    it('should return warning when subscription expires in 5 days', async () => {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 5); // 5 days from now

      const mockSubscription = {
        id: 1,
        user_id: 1,
        status: 'active',
        end_date: endDate,
      };

      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [mockSubscription],
      });

      const result = await subscriptionService.getExpiryWarning(1);

      expect(result).toEqual({
        warning: true,
        daysLeft: 5,
      });
    });

    it('should return no warning when subscription expires in 10 days', async () => {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 10); // 10 days from now

      const mockSubscription = {
        id: 1,
        user_id: 1,
        status: 'active',
        end_date: endDate,
      };

      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [mockSubscription],
      });

      const result = await subscriptionService.getExpiryWarning(1);

      expect(result).toEqual({
        warning: false,
        daysLeft: 10,
      });
    });

    it('should return null when no active subscription', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const result = await subscriptionService.getExpiryWarning(1);

      expect(result).toBeNull();
    });
  });

  describe('autoApprovePayment', () => {
    it('should auto-approve pending payment and create subscription', async () => {
      const mockPaymentRequest = {
        id: 1,
        user_id: 1,
        subscription_plan: '1_month',
        amount: 150000,
        status: 'pending',
      };

      const mockUpdatedPayment = {
        ...mockPaymentRequest,
        status: 'approved',
        approved_at: new Date(),
      };

      const mockSubscription = {
        id: 1,
        user_id: 1,
        plan_type: '1_month',
        price: 150000,
        status: 'active',
      };

      (mockDb.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockPaymentRequest] }) // getPaymentRequestById
        .mockResolvedValueOnce({ rows: [mockUpdatedPayment] }) // updatePaymentRequest
        .mockResolvedValueOnce({ rows: [mockSubscription] }); // createSubscription

      await subscriptionService.autoApprovePayment(1);

      expect(mockDb.query).toHaveBeenCalledTimes(3);
      expect(mockDb.query).toHaveBeenNthCalledWith(1, 
        'SELECT * FROM payment_requests WHERE id = $1', 
        [1]
      );
      expect(mockDb.query).toHaveBeenNthCalledWith(2, 
        expect.stringContaining('UPDATE payment_requests'), 
        expect.arrayContaining(['approved'])
      );
      expect(mockDb.query).toHaveBeenNthCalledWith(3, 
        expect.stringContaining('INSERT INTO subscriptions'), 
        expect.any(Array)
      );
    });

    it('should not process non-pending payment', async () => {
      const mockPaymentRequest = {
        id: 1,
        status: 'approved', // Already approved
      };

      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [mockPaymentRequest],
      });

      await subscriptionService.autoApprovePayment(1);

      expect(mockDb.query).toHaveBeenCalledTimes(1); // Only getPaymentRequestById
    });

    it('should not process non-existent payment', async () => {
      (mockDb.query as jest.Mock).mockResolvedValue({
        rows: [], // Payment not found
      });

      await subscriptionService.autoApprovePayment(1);

      expect(mockDb.query).toHaveBeenCalledTimes(1); // Only getPaymentRequestById
    });
  });

  describe('scheduleAutoApproval', () => {
    it('should schedule auto-approval job', () => {
      const { jobScheduler } = require('../../utils/jobScheduler');
      
      const jobId = subscriptionService.scheduleAutoApproval(1);

      expect(jobId).toBe('job-123');
      expect(jobScheduler.scheduleAutoApproval).toHaveBeenCalledWith(1, 60000);
    });
  });

  describe('cancelAutoApproval', () => {
    it('should cancel scheduled auto-approval job', () => {
      const { jobScheduler } = require('../../utils/jobScheduler');
      
      const result = subscriptionService.cancelAutoApproval('job-123');

      expect(result).toBe(true);
      expect(jobScheduler.cancelJob).toHaveBeenCalledWith('job-123');
    });
  });
});