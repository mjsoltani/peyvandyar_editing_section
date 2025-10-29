import { query } from '../config/database';

export type SubscriptionPlan = '1_month' | '3_month' | '6_month';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface Subscription {
  id?: number;
  user_id: number;
  plan_type: SubscriptionPlan;
  price: number;
  start_date: Date;
  end_date: Date;
  status: SubscriptionStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSubscriptionData {
  user_id: number;
  plan_type: SubscriptionPlan;
  price: number;
  start_date: Date;
  end_date: Date;
}

export interface UpdateSubscriptionData {
  status?: SubscriptionStatus;
  end_date?: Date;
}

export interface SubscriptionWithUser extends Subscription {
  username?: string;
  name?: string;
  email?: string;
}

export interface PaginatedSubscriptions {
  subscriptions: SubscriptionWithUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SubscriptionStats {
  plan_type: SubscriptionPlan;
  count: number;
  total_revenue: number;
}

export const SUBSCRIPTION_PLANS = {
  '1_month': {
    name: 'یک ماهه',
    price: 150000, // 150 تومان
    duration_days: 30,
  },
  '3_month': {
    name: 'سه ماهه',
    price: 450000, // 450 تومان
    duration_days: 90,
  },
  '6_month': {
    name: 'شش ماهه',
    price: 690000, // 690 تومان
    duration_days: 180,
  },
} as const;

export class Subscription {
  static async findById(id: number): Promise<Subscription | null> {
    try {
      const result = await query(
        'SELECT * FROM subscriptions WHERE id = $1',
        [id]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding subscription by ID:', error);
      throw error;
    }
  }

  static async findActiveByUserId(userId: number): Promise<Subscription | null> {
    try {
      const result = await query(
        `SELECT * FROM subscriptions 
         WHERE user_id = $1 AND status = 'active' AND end_date > NOW()
         ORDER BY end_date DESC LIMIT 1`,
        [userId]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding active subscription:', error);
      throw error;
    }
  }

  static async create(subscriptionData: CreateSubscriptionData): Promise<Subscription> {
    try {
      const result = await query(
        `INSERT INTO subscriptions (
          user_id, plan_type, price, start_date, end_date, status
        ) VALUES ($1, $2, $3, $4, $5, 'active') 
        RETURNING *`,
        [
          subscriptionData.user_id,
          subscriptionData.plan_type,
          subscriptionData.price,
          subscriptionData.start_date,
          subscriptionData.end_date
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  static async countActive(): Promise<number> {
    try {
      const result = await query(
        `SELECT COUNT(*) as count FROM subscriptions 
         WHERE status = 'active' AND end_date > NOW()`
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error counting active subscriptions:', error);
      throw error;
    }
  }

  static async getStatsByPlan(): Promise<SubscriptionStats[]> {
    try {
      const result = await query(
        `SELECT 
          plan_type,
          COUNT(*) as count,
          SUM(price) as total_revenue
         FROM subscriptions 
         WHERE status = 'active'
         GROUP BY plan_type
         ORDER BY plan_type`
      );
      
      return result.rows.map((row: any) => ({
        plan_type: row.plan_type,
        count: parseInt(row.count),
        total_revenue: parseInt(row.total_revenue)
      }));
    } catch (error) {
      console.error('Error getting subscription stats by plan:', error);
      throw error;
    }
  }

  static async findAllWithUserDetails(options: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<PaginatedSubscriptions> {
    try {
      const { page, limit, status } = options;
      const offset = (page - 1) * limit;

      let whereClause = '';
      let params: any[] = [];
      let paramCount = 1;

      if (status) {
        if (status === 'active') {
          whereClause = `WHERE s.status = 'active' AND s.end_date > NOW()`;
        } else if (status === 'expired') {
          whereClause = `WHERE (s.status = 'expired' OR s.end_date <= NOW())`;
        } else {
          whereClause = `WHERE s.status = $${paramCount}`;
          params.push(status);
          paramCount++;
        }
      }

      const query_text = `
        SELECT 
          s.*,
          u.username,
          u.name,
          u.email
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      params.push(limit, offset);

      const result = await query(query_text, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as count
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        ${whereClause}
      `;

      const countResult = await query(countQuery, params.slice(0, -2)); // Remove limit and offset
      const total = parseInt(countResult.rows[0].count);

      return {
        subscriptions: result.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error finding subscriptions with user details:', error);
      throw error;
    }
  }

  static async createFromPayment(payment: any): Promise<Subscription> {
    try {
      const plan = SUBSCRIPTION_PLANS[payment.subscription_plan as SubscriptionPlan];
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + plan.duration_days);

      return await this.create({
        user_id: payment.user_id,
        plan_type: payment.subscription_plan,
        price: payment.amount,
        start_date: startDate,
        end_date: endDate
      });
    } catch (error) {
      console.error('Error creating subscription from payment:', error);
      throw error;
    }
  }

  static async extendSubscription(id: number, durationDays: number): Promise<Subscription | null> {
    try {
      const result = await query(
        `UPDATE subscriptions 
         SET end_date = end_date + INTERVAL '${durationDays} days',
             updated_at = NOW()
         WHERE id = $1 
         RETURNING *`,
        [id]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error extending subscription:', error);
      throw error;
    }
  }

  static async cancelSubscription(id: number): Promise<Subscription | null> {
    try {
      const result = await query(
        `UPDATE subscriptions 
         SET status = 'cancelled', updated_at = NOW()
         WHERE id = $1 
         RETURNING *`,
        [id]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }
}