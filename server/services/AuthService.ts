const jwt = require('jsonwebtoken');
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
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    this.basalamClientId = process.env.BASALAM_CLIENT_ID!;
    this.basalamClientSecret = process.env.BASALAM_CLIENT_SECRET!;
    this.basalamRedirectUri = process.env.BASALAM_REDIRECT_URI!;
    this.basalamApiBaseUrl = process.env.BASALAM_API_BASE_URL!;

    if (!this.jwtSecret || !this.jwtRefreshSecret) {
      throw new Error('JWT secrets are required');
    }
  }

  /**
   * Generate authorization URL for Basalam OAuth
   */
  generateAuthUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.basalamClientId,
      redirect_uri: this.basalamRedirectUri,
      scope: 'read write',
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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: this.basalamClientId,
        client_secret: this.basalamClientSecret,
        redirect_uri: this.basalamRedirectUri,
        code,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get user info from Basalam API
   */
  async getUserInfo(accessToken: string): Promise<BasalamUserInfo> {
    const response = await fetch(`${this.basalamApiBaseUrl}/api/user`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Get user info failed:', errorText);
      throw new Error(`Get user info failed: ${response.status}`);
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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: this.basalamClientId,
        client_secret: this.basalamClientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', errorText);
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Generate JWT token for internal authentication
   */
  generateJWT(payload: any): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
  }

  /**
   * Generate JWT refresh token
   */
  generateRefreshJWT(payload: any): string {
    return jwt.sign(payload, this.jwtRefreshSecret, { expiresIn: this.jwtRefreshExpiresIn });
  }

  /**
   * Verify JWT token
   */
  verifyJWT(token: string): JWTPayload {
    return jwt.verify(token, this.jwtSecret) as JWTPayload;
  }

  /**
   * Verify JWT refresh token
   */
  verifyRefreshJWT(token: string): JWTPayload {
    return jwt.verify(token, this.jwtRefreshSecret) as JWTPayload;
  }

  /**
   * Validate scopes
   */
  validateScopes(grantedScopes: string, requiredScopes: string[]): boolean {
    const scopes = grantedScopes.split(' ');
    return requiredScopes.every(scope => scopes.includes(scope));
  }

  /**
   * Log activity
   */
  async logActivity(userId: number, action: string, details: any, ipAddress?: string): Promise<void> {
    try {
      await ActivityLog.create({
        user_id: userId,
        action,
        details,
        ip_address: ipAddress || '127.0.0.1',
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<User | null> {
    return await User.findById(userId);
  }

  /**
   * Create or update user from Basalam user info
   */
  async createOrUpdateUser(
    basalamUserInfo: BasalamUserInfo,
    tokens: BasalamTokenResponse
  ): Promise<User> {
    try {
      // Check if user already exists
      let user = await User.findByBasalamUserId(basalamUserInfo.id);

      if (user) {
        // Update existing user
        user = await User.update(user.id!, {
          username: basalamUserInfo.username,
          name: basalamUserInfo.name,
          email: basalamUserInfo.email,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });
      } else {
        // Create new user
        user = await User.create({
          basalam_user_id: basalamUserInfo.id,
          vendor_id: basalamUserInfo.vendor_id,
          username: basalamUserInfo.username,
          name: basalamUserInfo.name,
          email: basalamUserInfo.email,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });
      }

      // Log authentication activity
      if (user && user.id) {
        await ActivityLog.create({
          user_id: user.id,
          action: 'user_login',
          details: {
            login_method: 'basalam_oauth',
            user_agent: 'system',
          },
          ip_address: '127.0.0.1',
        });
      }

      return user!;
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();