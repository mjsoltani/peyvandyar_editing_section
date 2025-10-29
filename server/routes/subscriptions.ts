import express from 'express';
import { SubscriptionService } from '../services/SubscriptionService';
import { authenticateToken } from '../middleware/auth';
import pool from '../config/database';

const router = express.Router();

// Get subscription plans
router.get('/plans', (req, res) => {
  try {
    const subscriptionService = new SubscriptionService(pool);
    const plans = subscriptionService.getSubscriptionPlans();
    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Create payment request
router.post('/payment-request', authenticateToken, async (req, res) => {
  try {
    const { subscription_plan, transaction_reference } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (!subscription_plan) {
      return res.status(400).json({ success: false, error: 'Subscription plan is required' });
    }

    const subscriptionService = new SubscriptionService(pool);
    const plans = subscriptionService.getSubscriptionPlans();
    
    if (!(subscription_plan in plans)) {
      return res.status(400).json({ success: false, error: 'Invalid subscription plan' });
    }

    const planDetails = plans[subscription_plan as keyof typeof plans];
    const adminCardNumber = process.env.ADMIN_CARD_NUMBER || '6037-9977-0000-0000';

    const paymentRequest = await subscriptionService.createPaymentRequest({
      user_id: userId,
      subscription_plan,
      amount: planDetails.price,
      admin_card_number: adminCardNumber,
      transaction_reference
    });

    // Schedule auto-approval for MVP
    const jobId = subscriptionService.scheduleAutoApproval(paymentRequest.id);

    res.json({ 
      success: true, 
      data: {
        ...paymentRequest,
        plan_details: planDetails,
        auto_approval_job_id: jobId
      }
    });
  } catch (error) {
    console.error('Error creating payment request:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get user subscription status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const subscriptionService = new SubscriptionService(pool);
    const activeSubscription = await subscriptionService.getUserActiveSubscription(userId);
    const expiryWarning = await subscriptionService.getExpiryWarning(userId);
    const paymentRequests = await subscriptionService.getPaymentRequestsByUser(userId);

    res.json({ 
      success: true, 
      data: {
        active_subscription: activeSubscription,
        expiry_warning: expiryWarning,
        recent_payments: paymentRequests.slice(0, 5) // Last 5 payment requests
      }
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get payment request details
router.get('/payment-request/:id', authenticateToken, async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const subscriptionService = new SubscriptionService(pool);
    const paymentRequest = await subscriptionService.getPaymentRequestById(paymentId);

    if (!paymentRequest) {
      return res.status(404).json({ success: false, error: 'Payment request not found' });
    }

    // Check if payment request belongs to the user
    if (paymentRequest.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const plans = subscriptionService.getSubscriptionPlans();
    const planDetails = plans[paymentRequest.subscription_plan as keyof typeof plans];

    res.json({ 
      success: true, 
      data: {
        ...paymentRequest,
        plan_details: planDetails
      }
    });
  } catch (error) {
    console.error('Error getting payment request:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;