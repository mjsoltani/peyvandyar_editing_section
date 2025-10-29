import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';

export interface BasalamTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface BasalamUserInfo {
  id: string;
  username: string;
  name: string;
  email: string;
  vendor_id: number;
}

export interface JWTPayload {
  userId: number;
  basalamUserId: string;
  vendorId: number;
  username: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly jwtRefreshExpiresIn: string;
  private readonly basalamClientId: string;
  private readonly basalamClientSecret: string;
  private readonly basalamRedirectUri: string;
  private readonly basalamApiBaseUrl: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET!;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    this.basalamClientId = process.env.BASALAM_CLIENT_ID!;
    this.basalamClientSecret = process.env.BASALAM_CLIENT_SECRET!;
    this.basalamRedirectUri = process.env.BASALAM_REDIRECT_URI!;
    this.basalamApiBaseUrl = process.env.BASALAM_API_BASE_URL!;

    if (!this.jwtSecret || !this.jwtRefreshSecret) {
      throw new Error('JWT secrets are required');
    }
    if (!this.basalamClientId || !this.basalamClientSecret) {
      throw new Error('Basalam OAuth credentials are required');
    }
  }

  /**
   * Generate OAuth 2.0 authorization URL for Basalam SSO
   */
  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.basalamClientId,
      redirect_uri: this.basalamRedirectUri,
      response_type: 'code',
      scope: 'vendor.product.read vendor.product.write',
      state: state || this.generateRandomState(),
    });

    return `${this.basalamApiBaseUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<BasalamTokenResponse> {
    const response = await fetch(`${this.basalamApiBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.basalamClientId,
        client_secret: this.basalamClientSecret,
        code,
        redirect_uri: this.basalamRedirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    return response.json();
  }

  /**
   * Get user information from Basalam API
   */
  async getUserInfo(accessToken: string): Promise<BasalamUserInfo> {
    const response = await fetch(`${this.basalamApiBaseUrl}/api/v1/user/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get user info: ${error}`);
    }

    return response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<BasalamTokenResponse> {
    const response = await fetch(`${this.basalamApiBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.basalamClientId,
        client_secret: this.basalamClientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    return response.json();
  }

  /**
   * Generate JWT token for internal authentication
   */
  generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });
  }

  /**
   * Generate JWT refresh token
   */
  generateRefreshJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.jwtRefreshExpiresIn,
    });
  }

  /**
   * Verify JWT token
   */
  verifyJWT(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Verify JWT refresh token
   */
  verifyRefreshJWT(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.jwtRefreshSecret) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Create or update user after successful OAuth
   */
  async createOrUpdateUser(
    userInfo: BasalamUserInfo,
    tokens: BasalamTokenResponse,
    ipAddress?: string
  ): Promise<User> {
    try {
      // Try to find existing user
      let user = await User.findByBasalamUserId(userInfo.id);

      if (user) {
        // Update existing user
        user.username = userInfo.username;
        user.name = userInfo.name;
        user.email = userInfo.email;
        user.vendor_id = userInfo.vendor_id;
        user.access_token = tokens.access_token;
        user.refresh_token = tokens.refresh_token;
        user.updated_at = new Date();
        
        await user.save();
      } else {
        // Create new user
        user = new User({
          basalam_user_id: userInfo.id,
          vendor_id: userInfo.vendor_id,
          username: userInfo.username,
          name: userInfo.name,
          email: userInfo.email,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });
        
        await user.save();
      }

      // Log the authentication activity
      await ActivityLog.create({
        user_id: user.id!,
        action: 'user_login',
        details: {
          method: 'basalam_sso',
          vendor_id: userInfo.vendor_id,
          scope: tokens.scope,
        },
        ip_address: ipAddress,
      });

      return user;
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw new Error('Failed to create or update user');
    }
  }

  /**
   * Generate random state for OAuth security
   */
  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Validate required scopes
   */
  validateScopes(receivedScopes: string, requiredScopes: string[]): boolean {
    const scopes = receivedScopes.split(' ');
    return requiredScopes.every(scope => scopes.includes(scope));
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<User | null> {
    try {
      return await User.findById(userId);
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }

  /**
   * Log user activity
   */
  async logActivity(
    userId: number,
    action: string,
    details: any = {},
    ipAddress?: string
  ): Promise<void> {
    try {
      await ActivityLog.create({
        user_id: userId,
        action,
        details,
        ip_address: ipAddress,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw error for logging failures
    }
  }
}

export const authService = new AuthService();