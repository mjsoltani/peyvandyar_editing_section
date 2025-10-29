import { Pool } from 'pg';
import { 
  Subscription, 
  CreateSubscriptionData, 
  UpdateSubscriptionData, 
  SubscriptionPlan, 
  SUBSCRIPTION_PLANS 
} from '../models/Subscription';
import { 
  PaymentRequest, 
  CreatePaymentRequestData, 
  UpdatePaymentRequestData, 
  PaymentStatus 
} from '../models/PaymentRequest';

export class SubscriptionService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  // Get subscription plans
  getSubscriptionPlans() {
    return SUBSCRIPTION_PLANS;
  }

  // Create payment request
  async createPaymentRequest(data: CreatePaymentRequestData): Promise<PaymentRequest> {
    const query = `
      INSERT INTO payment_requests (
        user_id, subscription_plan, amount, payment_method, admin_card_number, transaction_reference
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      data.user_id,
      data.subscription_plan,
      data.amount,
      'card_to_card',
      data.admin_card_number,
      data.transaction_reference || null
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  // Get payment request by ID
  async getPaymentRequestById(id: number): Promise<PaymentRequest | null> {
    const query = 'SELECT * FROM payment_requests WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  // Get payment requests by user
  async getPaymentRequestsByUser(userId: number): Promise<PaymentRequest[]> {
    const query = `
      SELECT * FROM payment_requests 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  // Update payment request status
  async updatePaymentRequest(id: number, data: UpdatePaymentRequestData): Promise<PaymentRequest | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${paramCount++}`);
      values.push(data.notes);
    }
    if (data.approved_by !== undefined) {
      fields.push(`approved_by = $${paramCount++}`);
      values.push(data.approved_by);
    }
    if (data.approved_at !== undefined) {
      fields.push(`approved_at = $${paramCount++}`);
      values.push(data.approved_at);
    }

    if (fields.length === 0) {
      return this.getPaymentRequestById(id);
    }

    const query = `
      UPDATE payment_requests 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;
    values.push(id);

    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  // Create subscription
  async createSubscription(data: CreateSubscriptionData): Promise<Subscription> {
    const query = `
      INSERT INTO subscriptions (
        user_id, plan_type, price, start_date, end_date
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      data.user_id,
      data.plan_type,
      data.price,
      data.start_date,
      data.end_date
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  // Get user's active subscription
  async getUserActiveSubscription(userId: number): Promise<Subscription | null> {
    const query = `
      SELECT * FROM subscriptions 
      WHERE user_id = $1 AND status = 'active' AND end_date > NOW()
      ORDER BY end_date DESC
      LIMIT 1
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows[0] || null;
  }

  // Get user's subscription history
  async getUserSubscriptionHistory(userId: number): Promise<Subscription[]> {
    const query = `
      SELECT * FROM subscriptions 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  // Update subscription status
  async updateSubscription(id: number, data: UpdateSubscriptionData): Promise<Subscription | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    if (data.end_date !== undefined) {
      fields.push(`end_date = $${paramCount++}`);
      values.push(data.end_date);
    }

    if (fields.length === 0) {
      const query = 'SELECT * FROM subscriptions WHERE id = $1';
      const result = await this.db.query(query, [id]);
      return result.rows[0] || null;
    }

    const query = `
      UPDATE subscriptions 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;
    values.push(id);

    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  // Check if user has active subscription
  async hasActiveSubscription(userId: number): Promise<boolean> {
    const subscription = await this.getUserActiveSubscription(userId);
    return subscription !== null;
  }

  // Get subscription expiry warning (7 days before expiry)
  async getExpiryWarning(userId: number): Promise<{ warning: boolean; daysLeft: number } | null> {
    const subscription = await this.getUserActiveSubscription(userId);
    if (!subscription) {
      return null;
    }

    const now = new Date();
    const endDate = new Date(subscription.end_date);
    const timeDiff = endDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return {
      warning: daysLeft <= 7 && daysLeft > 0,
      daysLeft: Math.max(0, daysLeft)
    };
  }

  // Auto-approve payment (MVP implementation)
  async autoApprovePayment(paymentId: number): Promise<void> {
    const paymentRequest = await this.getPaymentRequestById(paymentId);
    if (!paymentRequest || paymentRequest.status !== 'pending') {
      return;
    }

    // Update payment request to approved
    await this.updatePaymentRequest(paymentId, {
      status: 'approved',
      approved_at: new Date()
    });

    // Create subscription
    const plan = SUBSCRIPTION_PLANS[paymentRequest.subscription_plan];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.duration_days);

    await this.createSubscription({
      user_id: paymentRequest.user_id,
      plan_type: paymentRequest.subscription_plan,
      price: paymentRequest.amount,
      start_date: startDate,
      end_date: endDate
    });
  }

  // Schedule auto-approval (MVP - 1 minute delay)
  scheduleAutoApproval(paymentId: number): string {
    const { jobScheduler } = require('../utils/jobScheduler');
    return jobScheduler.scheduleAutoApproval(paymentId, 60000); // 1 minute delay
  }

  // Cancel scheduled auto-approval
  cancelAutoApproval(jobId: string): boolean {
    const { jobScheduler } = require('../utils/jobScheduler');
    return jobScheduler.cancelJob(jobId);
  }
}