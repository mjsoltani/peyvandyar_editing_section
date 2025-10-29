import { authService } from '../services/AuthService';
import { User } from '../models/User';

export interface TokenValidationResult {
  isValid: boolean;
  user?: User;
  error?: string;
  needsRefresh?: boolean;
}

export class TokenValidator {
  /**
   * Validate access token and return user if valid
   */
  static async validateAccessToken(token: string): Promise<TokenValidationResult> {
    try {
      // Verify JWT token
      const payload = authService.verifyJWT(token);
      
      // Get user from database
      const user = await User.findById(payload.userId);
      if (!user) {
        return {
          isValid: false,
          error: 'User not found',
        };
      }

      return {
        isValid: true,
        user,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid token';
      
      // Check if token is expired
      if (errorMessage.includes('expired')) {
        return {
          isValid: false,
          error: 'Token expired',
          needsRefresh: true,
        };
      }

      return {
        isValid: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Validate refresh token
   */
  static async validateRefreshToken(token: string): Promise<TokenValidationResult> {
    try {
      // Verify refresh JWT token
      const payload = authService.verifyRefreshJWT(token);
      
      // Get user from database
      const user = await User.findById(payload.userId);
      if (!user) {
        return {
          isValid: false,
          error: 'User not found',
        };
      }

      return {
        isValid: true,
        user,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid refresh token';
      
      return {
        isValid: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if Basalam access token is still valid
   */
  static async validateBasalamToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.BASALAM_API_BASE_URL}/api/v1/user/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Basalam token validation error:', error);
      return false;
    }
  }

  /**
   * Refresh Basalam tokens if needed
   */
  static async refreshBasalamTokenIfNeeded(user: User): Promise<boolean> {
    try {
      if (!user.access_token || !user.refresh_token) {
        return false;
      }

      // Check if current token is valid
      const isValid = await this.validateBasalamToken(user.access_token);
      
      if (isValid) {
        return true; // Token is still valid
      }

      // Try to refresh the token
      const newTokens = await authService.refreshAccessToken(user.refresh_token);
      
      // Update user tokens
      await User.update(user.id!, {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
      });

      // Log the token refresh
      await authService.logActivity(
        user.id!,
        'basalam_token_refresh',
        { method: 'automatic' }
      );

      return true;
    } catch (error) {
      console.error('Basalam token refresh failed:', error);
      return false;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const payload = authService.verifyJWT(token);
      if (payload.exp) {
        return new Date(payload.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token will expire soon (within specified minutes)
   */
  static willExpireSoon(token: string, minutesThreshold: number = 5): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) {
      return false;
    }

    const now = new Date();
    const thresholdTime = new Date(now.getTime() + (minutesThreshold * 60 * 1000));
    
    return expiration <= thresholdTime;
  }
}