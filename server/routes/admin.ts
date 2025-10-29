import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { PaymentRequest } from '../models/PaymentRequest';
import { ActivityLog } from '../models/ActivityLog';

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get admin dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.count();
    
    // Get active subscriptions count
    const activeSubscriptions = await Subscription.countActive();
    
    // Get pending payment requests count
    const pendingPayments = await PaymentRequest.countPending();
    
    // Get total revenue (approved payments)
    const totalRevenue = await PaymentRequest.getTotalRevenue();
    
    // Get recent activity logs
    const recentActivity = await ActivityLog.getRecent(10);
    
    // Get subscription stats by plan
    const subscriptionStats = await Subscription.getStatsByPlan();
    
    // Get monthly revenue stats
    const monthlyRevenue = await PaymentRequest.getMonthlyRevenue();

    res.json({
      stats: {
        totalUsers,
        activeSubscriptions,
        pendingPayments,
        totalRevenue,
        subscriptionStats,
        monthlyRevenue
      },
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get all users with subscription details
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string; // 'active', 'expired', 'no_subscription'

    const users = await User.findAllWithSubscriptions({
      page,
      limit,
      search,
      status
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user activity logs
router.get('/users/:id/activity', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const activities = await ActivityLog.findByUserId(userId, { page, limit });

    res.json(activities);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

// Toggle user active status
router.patch('/users/:id/toggle-status', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Toggle user status (assuming we add an 'active' field to User model)
    const updatedUser = await User.toggleActiveStatus(userId);

    // Log admin action
    await ActivityLog.create({
      user_id: req.user!.id!,
      action: `admin_toggle_user_status`,
      details: {
        target_user_id: userId,
        new_status: updatedUser?.is_active ? 'active' : 'inactive'
      },
      ip_address: req.ip
    });

    res.json({ 
      message: 'User status updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Get payment requests
router.get('/payments', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string; // 'pending', 'approved', 'rejected'

    const payments = await PaymentRequest.findAllWithUserDetails({
      page,
      limit,
      status
    });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payment requests:', error);
    res.status(500).json({ error: 'Failed to fetch payment requests' });
  }
});

// Approve/reject payment
router.patch('/payments/:id', async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    const { status, notes } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "approved" or "rejected"' });
    }

    const payment = await PaymentRequest.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Payment request is not pending' });
    }

    // Update payment status
    const updatedPayment = await PaymentRequest.updateStatus(paymentId, status, notes);

    // If approved, create/activate subscription
    if (status === 'approved') {
      await Subscription.createFromPayment(payment);
    }

    // Log admin action
    await ActivityLog.create({
      user_id: req.user!.id!,
      action: `admin_${status}_payment`,
      details: {
        payment_id: paymentId,
        target_user_id: payment.user_id,
        amount: payment.amount,
        plan: payment.subscription_plan,
        notes
      },
      ip_address: req.ip
    });

    res.json({ 
      message: `Payment ${status} successfully`,
      payment: updatedPayment
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// Get subscription management data
router.get('/subscriptions', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string; // 'active', 'expired', 'cancelled'

    const subscriptions = await Subscription.findAllWithUserDetails({
      page,
      limit,
      status
    });

    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Manually extend/cancel subscription
router.patch('/subscriptions/:id', async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.id);
    const { action, duration, notes } = req.body; // action: 'extend' or 'cancel'

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    let updatedSubscription;

    if (action === 'extend') {
      if (!duration) {
        return res.status(400).json({ error: 'Duration is required for extension' });
      }
      updatedSubscription = await Subscription.extendSubscription(subscriptionId, duration);
    } else if (action === 'cancel') {
      updatedSubscription = await Subscription.cancelSubscription(subscriptionId);
    } else {
      return res.status(400).json({ error: 'Invalid action. Must be "extend" or "cancel"' });
    }

    // Log admin action
    await ActivityLog.create({
      user_id: req.user!.id!,
      action: `admin_${action}_subscription`,
      details: {
        subscription_id: subscriptionId,
        target_user_id: subscription.user_id,
        duration: duration || null,
        notes
      },
      ip_address: req.ip
    });

    res.json({ 
      message: `Subscription ${action}ed successfully`,
      subscription: updatedSubscription
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Get analytics and reports
router.get('/analytics/revenue', async (req, res) => {
  try {
    const period = req.query.period as string || 'monthly'; // 'daily', 'weekly', 'monthly', 'yearly'
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    const revenueData = await PaymentRequest.getRevenueAnalytics({
      period,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });

    res.json(revenueData);
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// Get user behavior analytics
router.get('/analytics/users', async (req, res) => {
  try {
    const period = req.query.period as string || 'monthly';
    
    const userAnalytics = await ActivityLog.getUserBehaviorAnalytics(period);

    res.json(userAnalytics);
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

export default router;