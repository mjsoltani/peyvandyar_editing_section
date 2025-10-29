interface ScheduledJob {
  id: string;
  type: 'auto_approve_payment';
  data: any;
  scheduledAt: Date;
  timeout: NodeJS.Timeout;
}

class JobScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();

  // Schedule auto-approval for payment
  scheduleAutoApproval(paymentId: number, delayMs: number = 60000): string {
    const jobId = `auto_approve_${paymentId}_${Date.now()}`;
    const scheduledAt = new Date(Date.now() + delayMs);

    const timeout = setTimeout(async () => {
      try {
        // Import here to avoid circular dependencies
        const { SubscriptionService } = await import('../services/SubscriptionService');
        const pool = (await import('../config/database')).default;
        
        const subscriptionService = new SubscriptionService(pool);
        await subscriptionService.autoApprovePayment(paymentId);
        
        console.log(`✅ Auto-approved payment request ${paymentId} at ${new Date().toISOString()}`);
        
        // Remove job from scheduler
        this.jobs.delete(jobId);
      } catch (error) {
        console.error(`❌ Failed to auto-approve payment ${paymentId}:`, error);
        // Remove job from scheduler even if it failed
        this.jobs.delete(jobId);
      }
    }, delayMs);

    const job: ScheduledJob = {
      id: jobId,
      type: 'auto_approve_payment',
      data: { paymentId },
      scheduledAt,
      timeout
    };

    this.jobs.set(jobId, job);
    
    console.log(`📅 Scheduled auto-approval for payment ${paymentId} at ${scheduledAt.toISOString()}`);
    
    return jobId;
  }

  // Cancel a scheduled job
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job) {
      clearTimeout(job.timeout);
      this.jobs.delete(jobId);
      console.log(`🚫 Cancelled job ${jobId}`);
      return true;
    }
    return false;
  }

  // Get all scheduled jobs
  getScheduledJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values()).map(job => ({
      ...job,
      timeout: undefined as any // Don't expose timeout object
    }));
  }

  // Get job by ID
  getJob(jobId: string): ScheduledJob | undefined {
    const job = this.jobs.get(jobId);
    if (job) {
      return {
        ...job,
        timeout: undefined as any // Don't expose timeout object
      };
    }
    return undefined;
  }

  // Clear all jobs (useful for testing or shutdown)
  clearAllJobs(): void {
    for (const job of this.jobs.values()) {
      clearTimeout(job.timeout);
    }
    this.jobs.clear();
    console.log('🧹 Cleared all scheduled jobs');
  }

  // Get jobs count
  getJobsCount(): number {
    return this.jobs.size;
  }

  // Get jobs by type
  getJobsByType(type: string): ScheduledJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.type === type)
      .map(job => ({
        ...job,
        timeout: undefined as any
      }));
  }
}

// Singleton instance
const jobScheduler = new JobScheduler();

export { JobScheduler, jobScheduler };
export type { ScheduledJob };