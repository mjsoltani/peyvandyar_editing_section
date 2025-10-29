import { query } from '../config/database';

export interface User {
  id?: number;
  basalam_user_id: string;
  vendor_id: number;
  username?: string;
  name?: string;
  email?: string;
  access_token?: string;
  refresh_token?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  basalam_user_id: string;
  vendor_id: number;
  username?: string;
  name?: string;
  email?: string;
  access_token?: string;
  refresh_token?: string;
  is_admin?: boolean;
}

export interface UpdateUserData {
  username?: string;
  name?: string;
  email?: string;
  access_token?: string;
  refresh_token?: string;
  is_active?: boolean;
}

export interface UserWithSubscription extends User {
  subscription_status?: 'active' | 'expired' | 'no_subscription';
  subscription_end_date?: Date;
  subscription_plan?: string;
}

export interface PaginatedUsers {
  users: UserWithSubscription[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class User {
  static async findById(id: number): Promise<User | null> {
    try {
      const result = await query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  static async findByBasalamUserId(basalamUserId: string): Promise<User | null> {
    try {
      const result = await query(
        'SELECT * FROM users WHERE basalam_user_id = $1',
        [basalamUserId]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error finding user by Basalam user ID:', error);
      throw error;
    }
  }

  static async create(userData: CreateUserData): Promise<User> {
    try {
      const result = await query(
        `INSERT INTO users (
          basalam_user_id, vendor_id, username, name, email, 
          access_token, refresh_token, is_admin, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *`,
        [
          userData.basalam_user_id,
          userData.vendor_id,
          userData.username,
          userData.name,
          userData.email,
          userData.access_token,
          userData.refresh_token,
          userData.is_admin || false,
          true // is_active defaults to true
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async update(id: number, userData: UpdateUserData): Promise<User | null> {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.entries(userData).forEach(([key, value]) => {
        if (value !== undefined) {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      });

      if (fields.length === 0) {
        return await this.findById(id);
      }

      fields.push(`updated_at = $${paramCount}`);
      values.push(new Date());
      values.push(id);

      const result = await query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`,
        values
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async count(): Promise<number> {
    try {
      const result = await query('SELECT COUNT(*) as count FROM users');
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error counting users:', error);
      throw error;
    }
  }

  static async findAllWithSubscriptions(options: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }): Promise<PaginatedUsers> {
    try {
      const { page, limit, search, status } = options;
      const offset = (page - 1) * limit;

      let whereClause = '';
      let params: any[] = [];
      let paramCount = 1;

      const conditions = [];

      if (search) {
        conditions.push(`(u.username ILIKE $${paramCount} OR u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`);
        params.push(`%${search}%`);
        paramCount++;
      }

      if (status) {
        if (status === 'active') {
          conditions.push(`s.status = 'active' AND s.end_date > NOW()`);
        } else if (status === 'expired') {
          conditions.push(`(s.status = 'expired' OR s.end_date <= NOW())`);
        } else if (status === 'no_subscription') {
          conditions.push(`s.id IS NULL`);
        }
      }

      if (conditions.length > 0) {
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }

      const query_text = `
        SELECT 
          u.*,
          s.status as subscription_status,
          s.end_date as subscription_end_date,
          s.plan_type as subscription_plan
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      params.push(limit, offset);

      const result = await query(query_text, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
        ${whereClause}
      `;

      const countResult = await query(countQuery, params.slice(0, -2)); // Remove limit and offset
      const total = parseInt(countResult.rows[0].count);

      return {
        users: result.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error finding users with subscriptions:', error);
      throw error;
    }
  }

  static async toggleActiveStatus(id: number): Promise<User | null> {
    try {
      const result = await query(
        `UPDATE users 
         SET is_active = NOT is_active, updated_at = NOW() 
         WHERE id = $1 
         RETURNING *`,
        [id]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error toggling user active status:', error);
      throw error;
    }
  }
}