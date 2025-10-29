import express from 'express';
import { authService } from '../services/AuthService';
import { authenticateToken } from '../middleware/auth';
import { SessionManager } from '../utils/session';

const router = express.Router();

// SSO login with Basalam
router.get('/login', (req, res) => {
  try {
    const state = req.query.state as string;
    const authUrl = authService.generateAuthUrl(state);
    
    // Redirect to Basalam OAuth
    res.redirect(authUrl);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Failed to initiate login',
      message: 'Unable to redirect to Basalam authentication'
    });
  }
});

// SSO callback from Basalam
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Handle OAuth error
    if (error) {
      console.error('OAuth error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=${encodeURIComponent(error as string)}`);
    }

    // Validate required parameters
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=missing_code`);
    }

    // Exchange code for tokens
    const tokens = await authService.exchangeCodeForToken(code as string);
    
    // Validate required scopes
    const requiredScopes = ['vendor.product.read', 'vendor.product.write'];
    if (!authService.validateScopes(tokens.scope, requiredScopes)) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=insufficient_permissions`);
    }

    // Get user information
    const userInfo = await authService.getUserInfo(tokens.access_token);
    
    // Create or update user
    const user = await authService.createOrUpdateUser(userInfo, tokens, req.ip);
    
    // Generate internal JWT tokens
    const jwtPayload = {
      userId: user.id!,
      basalamUserId: user.basalam_user_id,
      vendorId: user.vendor_id,
      username: user.username,
    };
    
    const accessToken = authService.generateJWT(jwtPayload);
    const refreshToken = authService.generateRefreshJWT(jwtPayload);
    
    // Set secure HTTP-only cookies using SessionManager
    SessionManager.setAuthTokens(res, accessToken, refreshToken);

    // Redirect to dashboard
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    
  } catch (error) {
    console.error('Callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=authentication_failed`);
  }
});

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Return user info without sensitive data
    const userInfo = {
      id: req.user.id,
      username: req.user.username,
      name: req.user.name,
      email: req.user.email,
      vendor_id: req.user.vendor_id,
      created_at: req.user.created_at,
    };

    res.json({ user: userInfo });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    if (req.user) {
      // Log the logout activity
      await authService.logActivity(
        req.user.id!,
        'user_logout',
        { method: 'manual' },
        req.ip
      );
    }

    // Clear cookies using SessionManager
    SessionManager.clearAuthTokens(res);
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Token refresh
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = SessionManager.extractRefreshToken(req);
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const payload = authService.verifyRefreshJWT(refreshToken);
    
    // Get user by ID
    const userModel = await import('../models/User');
    const currentUser = await userModel.User.findById(payload.userId);
    
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new access token
    const newJwtPayload = {
      userId: currentUser.id!,
      basalamUserId: currentUser.basalam_user_id,
      vendorId: currentUser.vendor_id,
      username: currentUser.username,
    };
    
    const newAccessToken = authService.generateJWT(newJwtPayload);
    
    // Set new access token cookie using SessionManager
    SessionManager.setCookie(res, 'access_token', newAccessToken, {
      maxAge: 60 * 60, // 1 hour
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
    });

    // Log the token refresh
    await authService.logActivity(
      currentUser.id!,
      'token_refresh',
      { method: 'manual' },
      req.ip
    );

    res.json({ 
      message: 'Token refreshed successfully',
      access_token: newAccessToken 
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// Check authentication status
router.get('/status', authenticateToken, (req, res) => {
  res.json({ 
    authenticated: true,
    user: {
      id: req.user?.id,
      username: req.user?.username,
      name: req.user?.name,
      vendor_id: req.user?.vendor_id,
    }
  });
});

export default router;