import { JobScheduler } from '../../utils/jobScheduler';

// Mock the SubscriptionService and database
jest.mock('../../services/SubscriptionService', () => ({
  SubscriptionService: jest.fn().mockImplementation(() => ({
    autoApprovePayment: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../config/database', () => ({
  default: {},
}));

describe('JobScheduler', () => {
  let jobScheduler: JobScheduler;

  beforeEach(() => {
    jobScheduler = new JobScheduler();
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jobScheduler.clearAllJobs();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('scheduleAutoApproval', () => {
    it('should schedule auto-approval job with default delay', () => {
      const paymentId = 1;
      const jobId = jobScheduler.scheduleAutoApproval(paymentId);

      expect(jobId).toMatch(/^auto_approve_1_\d+$/);
      expect(jobScheduler.getJobsCount()).toBe(1);

      const job = jobScheduler.getJob(jobId);
      expect(job).toBeDefined();
      expect(job?.type).toBe('auto_approve_payment');
      expect(job?.data.paymentId).toBe(paymentId);
    });

    it('should schedule auto-approval job with custom delay', () => {
      const paymentId = 2;
      const customDelay = 30000; // 30 seconds
      const jobId = jobScheduler.scheduleAutoApproval(paymentId, customDelay);

      expect(jobId).toMatch(/^auto_approve_2_\d+$/);
      expect(jobScheduler.getJobsCount()).toBe(1);

      const job = jobScheduler.getJob(jobId);
      expect(job).toBeDefined();
      expect(job?.data.paymentId).toBe(paymentId);
    });

    it('should execute auto-approval after delay', async () => {
      const { SubscriptionService } = require('../../services/SubscriptionService');
      const mockAutoApprove = jest.fn().mockResolvedValue(undefined);
      SubscriptionService.mockImplementation(() => ({
        autoApprovePayment: mockAutoApprove,
      }));

      const paymentId = 3;
      const jobId = jobScheduler.scheduleAutoApproval(paymentId, 1000); // 1 second

      expect(jobScheduler.getJobsCount()).toBe(1);

      // Fast-forward time
      jest.advanceTimersByTime(1000);

      // Wait for async operations with proper promise handling
      await jest.runAllTimersAsync();

      expect(mockAutoApprove).toHaveBeenCalledWith(paymentId);
      expect(jobScheduler.getJobsCount()).toBe(0); // Job should be removed after execution
    }, 15000);

    it('should handle auto-approval errors gracefully', async () => {
      const { SubscriptionService } = require('../../services/SubscriptionService');
      const mockAutoApprove = jest.fn().mockRejectedValue(new Error('Database error'));
      SubscriptionService.mockImplementation(() => ({
        autoApprovePayment: mockAutoApprove,
      }));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const paymentId = 4;
      const jobId = jobScheduler.scheduleAutoApproval(paymentId, 1000);

      expect(jobScheduler.getJobsCount()).toBe(1);

      // Fast-forward time
      jest.advanceTimersByTime(1000);

      // Wait for async operations with proper promise handling
      await jest.runAllTimersAsync();

      expect(mockAutoApprove).toHaveBeenCalledWith(paymentId);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to auto-approve payment 4:'),
        expect.any(Error)
      );
      expect(jobScheduler.getJobsCount()).toBe(0); // Job should be removed even after error

      consoleSpy.mockRestore();
    }, 15000);
  });

  describe('cancelJob', () => {
    it('should cancel scheduled job successfully', () => {
      const paymentId = 5;
      const jobId = jobScheduler.scheduleAutoApproval(paymentId);

      expect(jobScheduler.getJobsCount()).toBe(1);

      const cancelled = jobScheduler.cancelJob(jobId);

      expect(cancelled).toBe(true);
      expect(jobScheduler.getJobsCount()).toBe(0);
    });

    it('should return false for non-existent job', () => {
      const cancelled = jobScheduler.cancelJob('non-existent-job');

      expect(cancelled).toBe(false);
    });

    it('should prevent cancelled job from executing', async () => {
      const { SubscriptionService } = require('../../services/SubscriptionService');
      const mockAutoApprove = jest.fn().mockResolvedValue(undefined);
      SubscriptionService.mockImplementation(() => ({
        autoApprovePayment: mockAutoApprove,
      }));

      const paymentId = 6;
      const jobId = jobScheduler.scheduleAutoApproval(paymentId, 1000);

      // Cancel the job before it executes
      jobScheduler.cancelJob(jobId);

      // Fast-forward time
      jest.advanceTimersByTime(1000);

      // Wait for any potential async operations
      await jest.runAllTimersAsync();

      expect(mockAutoApprove).not.toHaveBeenCalled();
    }, 15000);
  });

  describe('getScheduledJobs', () => {
    it('should return all scheduled jobs', () => {
      const paymentId1 = 7;
      const paymentId2 = 8;
      
      const jobId1 = jobScheduler.scheduleAutoApproval(paymentId1);
      const jobId2 = jobScheduler.scheduleAutoApproval(paymentId2);

      const jobs = jobScheduler.getScheduledJobs();

      expect(jobs).toHaveLength(2);
      expect(jobs.map(job => job.id)).toContain(jobId1);
      expect(jobs.map(job => job.id)).toContain(jobId2);
      expect(jobs.every(job => job.type === 'auto_approve_payment')).toBe(true);
    });

    it('should not expose timeout objects', () => {
      const paymentId = 9;
      jobScheduler.scheduleAutoApproval(paymentId);

      const jobs = jobScheduler.getScheduledJobs();

      expect(jobs[0].timeout).toBeUndefined();
    });
  });

  describe('getJob', () => {
    it('should return specific job by ID', () => {
      const paymentId = 10;
      const jobId = jobScheduler.scheduleAutoApproval(paymentId);

      const job = jobScheduler.getJob(jobId);

      expect(job).toBeDefined();
      expect(job?.id).toBe(jobId);
      expect(job?.data.paymentId).toBe(paymentId);
      expect(job?.timeout).toBeUndefined();
    });

    it('should return undefined for non-existent job', () => {
      const job = jobScheduler.getJob('non-existent-job');

      expect(job).toBeUndefined();
    });
  });

  describe('clearAllJobs', () => {
    it('should clear all scheduled jobs', () => {
      const paymentId1 = 11;
      const paymentId2 = 12;
      
      jobScheduler.scheduleAutoApproval(paymentId1);
      jobScheduler.scheduleAutoApproval(paymentId2);

      expect(jobScheduler.getJobsCount()).toBe(2);

      jobScheduler.clearAllJobs();

      expect(jobScheduler.getJobsCount()).toBe(0);
    });

    it('should prevent cleared jobs from executing', async () => {
      const { SubscriptionService } = require('../../services/SubscriptionService');
      const mockAutoApprove = jest.fn().mockResolvedValue(undefined);
      SubscriptionService.mockImplementation(() => ({
        autoApprovePayment: mockAutoApprove,
      }));

      const paymentId = 13;
      jobScheduler.scheduleAutoApproval(paymentId, 1000);

      // Clear all jobs before they execute
      jobScheduler.clearAllJobs();

      // Fast-forward time
      jest.advanceTimersByTime(1000);

      // Wait for any potential async operations
      await jest.runAllTimersAsync();

      expect(mockAutoApprove).not.toHaveBeenCalled();
    }, 15000);
  });

  describe('getJobsByType', () => {
    it('should return jobs filtered by type', () => {
      const paymentId1 = 14;
      const paymentId2 = 15;
      
      jobScheduler.scheduleAutoApproval(paymentId1);
      jobScheduler.scheduleAutoApproval(paymentId2);

      const autoApprovalJobs = jobScheduler.getJobsByType('auto_approve_payment');
      const otherJobs = jobScheduler.getJobsByType('other_type');

      expect(autoApprovalJobs).toHaveLength(2);
      expect(otherJobs).toHaveLength(0);
      expect(autoApprovalJobs.every(job => job.type === 'auto_approve_payment')).toBe(true);
    });
  });

  describe('getJobsCount', () => {
    it('should return correct count of scheduled jobs', () => {
      expect(jobScheduler.getJobsCount()).toBe(0);

      jobScheduler.scheduleAutoApproval(16);
      expect(jobScheduler.getJobsCount()).toBe(1);

      jobScheduler.scheduleAutoApproval(17);
      expect(jobScheduler.getJobsCount()).toBe(2);

      jobScheduler.clearAllJobs();
      expect(jobScheduler.getJobsCount()).toBe(0);
    });
  });
});