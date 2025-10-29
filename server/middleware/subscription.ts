import { Request, Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/SubscriptionService';
import pool from '../config/database';

// Extend Request interface to include subscription info
declare global {
  namespace Express {
    interface Request {
      subscriptionInfo?: {
        hasActive: boolean;
        subscription: any;
        expiryWarning: any;
      };
    }
  }
}

// Middleware to check if user has active subscription
export const requireActiveSubscription = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    const subscriptionService = new SubscriptionService(pool);
    const hasActive = await subscriptionService.hasActiveSubscription(userId);

    if (!hasActive) {
      return res.status(403).json({ 
        success: false, 
        error: 'Active subscription required',
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'برای استفاده از این قابلیت نیاز به اشتراک فعال دارید'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

// Middleware to add subscription info to request (non-blocking)
export const addSubscriptionInfo = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      const subscriptionService = new SubscriptionService(pool);
      const activeSubscription = await subscriptionService.getUserActiveSubscription(userId);
      const expiryWarning = await subscriptionService.getExpiryWarning(userId);

      req.subscriptionInfo = {
        hasActive: activeSubscription !== null,
        subscription: activeSubscription,
        expiryWarning
      };
    }

    next();
  } catch (error) {
    console.error('Error adding subscription info:', error);
    // Don't block the request, just continue without subscription info
    next();
  }
};

// Middleware to check subscription expiry and send warnings
export const checkSubscriptionExpiry = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      const subscriptionService = new SubscriptionService(pool);
      const expiryWarning = await subscriptionService.getExpiryWarning(userId);

      if (expiryWarning?.warning) {
        // Add warning to response headers
        res.setHeader('X-Subscription-Warning', 'true');
        res.setHeader('X-Subscription-Days-Left', expiryWarning.daysLeft.toString());
      }
    }

    next();
  } catch (error) {
    console.error('Error checking subscription expiry:', error);
    // Don't block the request
    next();
  }
};