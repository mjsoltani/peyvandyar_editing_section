import { query } from '../config/database';
import { SubscriptionPlan } from './Subscription';

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentRequest {
  id?: number;
  user_id: number;
  subscription_plan: SubscriptionPlan;
  amount: number;
  status: PaymentStatus;
  payment_method: string;
  admin_card_number?: string;
  transaction_reference?: string;
  notes?: string;
  created_at: Date;
  approved_at?: Date;
  approved_by?: number;
}

export interface CreatePaymentRequestData {
  user_id: number;
  subscription_plan: SubscriptionPlan;
  amount: number;
  admin_card_number: string;
  transaction_reference?: string;
}

export interface UpdatePaymentRequestData {
  status?: PaymentStatus;
  notes?: string;
  approved_by?: number;
  approved_at?: Date;
}

export interface PaymentRequestWithUser extends PaymentRequest {
  username?: string;
  name?: string;
  email?: string;
}

export interface PaginatedPaymentRequests {
  payments: PaymentRequestWithUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RevenueAnalytics {
  period: string;
  data: Array<{
    date: string;
    revenue: number;
    count: number;
  }>;
  total_revenue: number;
  total_count: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  count: number;
}

export class PaymentRequest {
  static async findById(id: number): Promise<PaymentRequest | null> {
    try {
      const result = await query(
        'SELECT * FROM payment_requests WHERE id = $1',
        [id]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding payment request by ID:', error);
      throw error;
    }
  }

  static async create(paymentData: CreatePaymentRequestData): Promise<PaymentRequest> {
    try {
      const result = await query(
        `INSERT INTO payment_requests (
          user_id, subscription_plan, amount, payment_method, 
          admin_card_number, transaction_reference, status
        ) VALUES ($1, $2, $3, 'card_to_card', $4, $5, 'pending') 
        RETURNING *`,
        [
          paymentData.user_id,
          paymentData.subscription_plan,
          paymentData.amount,
          paymentData.admin_card_number,
          paymentData.transaction_reference
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating payment request:', error);
      throw error;
    }
  }

  static async countPending(): Promise<number> {
    try {
      const result = await query(
        `SELECT COUNT(*) as count FROM payment_requests WHERE status = 'pending'`
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error counting pending payments:', error);
      throw error;
    }
  }

  static async getTotalRevenue(): Promise<number> {
    try {
      const result = await query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM payment_requests WHERE status = 'approved'`
      );
      return parseInt(result.rows[0].total);
    } catch (error) {
      console.error('Error getting total revenue:', error);
      throw error;
    }
  }

  static async getMonthlyRevenue(): Promise<MonthlyRevenue[]> {
    try {
      const result = await query(
        `SELECT 
          TO_CHAR(approved_at, 'YYYY-MM') as month,
          SUM(amount) as revenue,
          COUNT(*) as count
         FROM payment_requests 
         WHERE status = 'approved' AND approved_at >= NOW() - INTERVAL '12 months'
         GROUP BY TO_CHAR(approved_at, 'YYYY-MM')
         ORDER BY month DESC`
      );
      
      return result.rows.map((row: any) => ({
        month: row.month,
        revenue: parseInt(row.revenue),
        count: parseInt(row.count)
      }));
    } catch (error) {
      console.error('Error getting monthly revenue:', error);
      throw error;
    }
  }

  static async findAllWithUserDetails(options: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<PaginatedPaymentRequests> {
    try {
      const { page, limit, status } = options;
      const offset = (page - 1) * limit;

      let whereClause = '';
      let params: any[] = [];
      let paramCount = 1;

      if (status) {
        whereClause = `WHERE p.status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      const query_text = `
        SELECT 
          p.*,
          u.username,
          u.name,
          u.email
        FROM payment_requests p
        JOIN users u ON p.user_id = u.id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      params.push(limit, offset);

      const result = await query(query_text, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as count
        FROM payment_requests p
        JOIN users u ON p.user_id = u.id
        ${whereClause}
      `;

      const countResult = await query(countQuery, params.slice(0, -2)); // Remove limit and offset
      const total = parseInt(countResult.rows[0].count);

      return {
        payments: result.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error finding payment requests with user details:', error);
      throw error;
    }
  }

  static async updateStatus(id: number, status: PaymentStatus, notes?: string): Promise<PaymentRequest | null> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date()
      };

      if (notes) {
        updateData.notes = notes;
      }

      if (status === 'approved') {
        updateData.approved_at = new Date();
      }

      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      Object.entries(updateData).forEach(([key, value]) => {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      });

      values.push(id);

      const result = await query(
        `UPDATE payment_requests SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  static async getRevenueAnalytics(options: {
    period: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<RevenueAnalytics> {
    try {
      const { period, startDate, endDate } = options;
      
      let dateFormat: string;
      let dateInterval: string;
      
      switch (period) {
        case 'daily':
          dateFormat = 'YYYY-MM-DD';
          dateInterval = '30 days';
          break;
        case 'weekly':
          dateFormat = 'YYYY-"W"WW';
          dateInterval = '12 weeks';
          break;
        case 'monthly':
          dateFormat = 'YYYY-MM';
          dateInterval = '12 months';
          break;
        case 'yearly':
          dateFormat = 'YYYY';
          dateInterval = '5 years';
          break;
        default:
          dateFormat = 'YYYY-MM';
          dateInterval = '12 months';
      }

      let whereClause = `WHERE status = 'approved'`;
      const params: any[] = [];
      let paramCount = 1;

      if (startDate) {
        whereClause += ` AND approved_at >= $${paramCount}`;
        params.push(startDate);
        paramCount++;
      } else {
        whereClause += ` AND approved_at >= NOW() - INTERVAL '${dateInterval}'`;
      }

      if (endDate) {
        whereClause += ` AND approved_at <= $${paramCount}`;
        params.push(endDate);
        paramCount++;
      }

      const result = await query(
        `SELECT 
          TO_CHAR(approved_at, '${dateFormat}') as date,
          SUM(amount) as revenue,
          COUNT(*) as count
         FROM payment_requests 
         ${whereClause}
         GROUP BY TO_CHAR(approved_at, '${dateFormat}')
         ORDER BY date DESC`,
        params
      );

      // Get total revenue and count
      const totalResult = await query(
        `SELECT 
          COALESCE(SUM(amount), 0) as total_revenue,
          COUNT(*) as total_count
         FROM payment_requests 
         ${whereClause}`,
        params
      );

      return {
        period,
        data: result.rows.map((row: any) => ({
          date: row.date,
          revenue: parseInt(row.revenue),
          count: parseInt(row.count)
        })),
        total_revenue: parseInt(totalResult.rows[0].total_revenue),
        total_count: parseInt(totalResult.rows[0].total_count)
      };
    } catch (error) {
      console.error('Error getting revenue analytics:', error);
      throw error;
    }
  }
}