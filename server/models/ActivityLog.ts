import { query } from '../config/database';

export interface ActivityLog {
  id?: number;
  user_id?: number;
  action: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface CreateActivityLogData {
  user_id?: number;
  action: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export interface ActivityLogWithUser extends ActivityLog {
  username?: string;
  name?: string;
}

export interface PaginatedActivityLogs {
  activities: ActivityLogWithUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserBehaviorAnalytics {
  period: string;
  data: Array<{
    date: string;
    logins: number;
    product_updates: number;
    batch_updates: number;
  }>;
  total_users: number;
  active_users: number;
}

// Common activity types
export const ACTIVITY_TYPES = {
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  PRODUCT_UPDATE: 'product_update',
  BATCH_UPDATE: 'batch_update',
  PAYMENT_REQUEST: 'payment_request',
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  ADMIN_ACTION: 'admin_action',
} as const;

export class ActivityLog {
  static async create(logData: CreateActivityLogData): Promise<ActivityLog> {
    try {
      const result = await query(
        `INSERT INTO activity_logs (
          user_id, action, details, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5) 
        RETURNING *`,
        [
          logData.user_id,
          logData.action,
          JSON.stringify(logData.details || {}),
          logData.ip_address,
          logData.user_agent
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating activity log:', error);
      throw error;
    }
  }

  static async getRecent(limit: number = 10): Promise<ActivityLogWithUser[]> {
    try {
      const result = await query(
        `SELECT 
          a.*,
          u.username,
          u.name
         FROM activity_logs a
         LEFT JOIN users u ON a.user_id = u.id
         ORDER BY a.created_at DESC
         LIMIT $1`,
        [limit]
      );
      
      return result.rows;
    } catch (error) {
      console.error('Error getting recent activity logs:', error);
      throw error;
    }
  }

  static async findByUserId(userId: number, options: {
    page: number;
    limit: number;
  }): Promise<PaginatedActivityLogs> {
    try {
      const { page, limit } = options;
      const offset = (page - 1) * limit;

      const result = await query(
        `SELECT 
          a.*,
          u.username,
          u.name
         FROM activity_logs a
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.user_id = $1
         ORDER BY a.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      // Get total count
      const countResult = await query(
        'SELECT COUNT(*) as count FROM activity_logs WHERE user_id = $1',
        [userId]
      );
      const total = parseInt(countResult.rows[0].count);

      return {
        activities: result.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error finding activity logs by user ID:', error);
      throw error;
    }
  }

  static async getUserBehaviorAnalytics(period: string = 'monthly'): Promise<UserBehaviorAnalytics> {
    try {
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

      const result = await query(
        `SELECT 
          TO_CHAR(created_at, '${dateFormat}') as date,
          COUNT(CASE WHEN action = 'user_login' THEN 1 END) as logins,
          COUNT(CASE WHEN action = 'product_update' THEN 1 END) as product_updates,
          COUNT(CASE WHEN action = 'batch_update' THEN 1 END) as batch_updates
         FROM activity_logs 
         WHERE created_at >= NOW() - INTERVAL '${dateInterval}'
         GROUP BY TO_CHAR(created_at, '${dateFormat}')
         ORDER BY date DESC`
      );

      // Get total and active users
      const userStatsResult = await query(
        `SELECT 
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT CASE WHEN a.created_at >= NOW() - INTERVAL '30 days' THEN a.user_id END) as active_users
         FROM users u
         LEFT JOIN activity_logs a ON u.id = a.user_id`
      );

      return {
        period,
        data: result.rows.map((row: any) => ({
          date: row.date,
          logins: parseInt(row.logins),
          product_updates: parseInt(row.product_updates),
          batch_updates: parseInt(row.batch_updates)
        })),
        total_users: parseInt(userStatsResult.rows[0].total_users),
        active_users: parseInt(userStatsResult.rows[0].active_users)
      };
    } catch (error) {
      console.error('Error getting user behavior analytics:', error);
      throw error;
    }
  }
}