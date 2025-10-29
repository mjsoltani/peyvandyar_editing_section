import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthService';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { SessionManager } from '../utils/session';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      subscription?: Subscription;
    }
  }
}

/**
 * Middleware to authenticate JWT token
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = SessionManager.extractAccessToken(req);

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    // Verify JWT token
    const payload = authService.verifyJWT(token);
    
    // Get user from database
    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to check if user has active subscription
 */
export const requireActiveSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Get user's active subscription
    const subscription = await Subscription.findActiveByUserId(req.user.id!);
    
    if (!subscription) {
      res.status(403).json({ 
        error: 'Active subscription required',
        message: 'Please subscribe to access this feature'
      });
      return;
    }

    // Check if subscription is expired
    if (subscription.end_date < new Date()) {
      res.status(403).json({ 
        error: 'Subscription expired',
        message: 'Your subscription has expired. Please renew to continue.'
      });
      return;
    }

    // Attach subscription to request
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ error: 'Failed to verify subscription' });
  }
};

/**
 * Middleware to check admin access
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check if user is admin (you can implement this based on your admin logic)
    // For now, we'll check if the user has a specific admin flag or role
    // This should be implemented based on your admin identification logic
    const isAdmin = await checkAdminStatus(req.user);
    
    if (!isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Failed to verify admin access' });
  }
};

/**
 * Middleware to refresh token if needed
 */
export const refreshTokenIfNeeded = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      next();
      return;
    }

    // Import TokenValidator dynamically to avoid circular dependency
    const { TokenValidator } = await import('../utils/tokenValidator');
    
    // Try to refresh Basalam tokens if needed
    await TokenValidator.refreshBasalamTokenIfNeeded(req.user);

    next();
  } catch (error) {
    console.error('Token refresh middleware error:', error);
    next(); // Continue even if refresh fails
  }
};

/**
 * Helper function to check admin status
 * This implementation checks for admin user IDs in environment variables
 */
async function checkAdminStatus(user: User): Promise<boolean> {
  try {
    // Check if user ID is in the admin list from environment variables
    const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(id => parseInt(id.trim())) || [];
    
    // Also check for admin basalam user IDs
    const adminBasalamIds = process.env.ADMIN_BASALAM_USER_IDS?.split(',').map(id => id.trim()) || [];
    
    return adminIds.includes(user.id!) || adminBasalamIds.includes(user.basalam_user_id);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Optional middleware to extract user info without requiring authentication
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = SessionManager.extractAccessToken(req);

    if (token) {
      try {
        const payload = authService.verifyJWT(token);
        const user = await User.findById(payload.userId);
        if (user) {
          req.user = user;
        }
      } catch (error) {
        // Ignore authentication errors in optional auth
      }
    }

    next();
  } catch (error) {
    next(); // Continue even if optional auth fails
  }
};