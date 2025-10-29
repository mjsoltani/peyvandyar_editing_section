import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect to login page when not authenticated', async ({ page }) => {
    await page.goto('/fa/dashboard');
    await expect(page).toHaveURL(/.*\/fa\/auth\/login/);
  });

  test('should display login page with Basalam SSO option', async ({ page }) => {
    await page.goto('/fa/auth/login');
    
    // Check if login page loads
    await expect(page.locator('h1')).toContainText('ورود');
    
    // Check for Basalam login button
    await expect(page.locator('text=ورود با باسلام')).toBeVisible();
  });

  test('should handle login error gracefully', async ({ page }) => {
    await page.goto('/fa/auth/error');
    
    // Check error page displays
    await expect(page.locator('text=خطا در ورود')).toBeVisible();
    
    // Check for retry option
    await expect(page.locator('text=تلاش مجدد')).toBeVisible();
  });

  test('should support language switching on login page', async ({ page }) => {
    await page.goto('/fa/auth/login');
    
    // Check Persian is active
    await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    
    // Switch to English
    await page.click('text=English');
    await expect(page).toHaveURL(/.*\/en\/auth\/login/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('should complete full authentication flow with Basalam SSO', async ({ page }) => {
    // Mock Basalam OAuth flow
    await page.route('**/api/auth/basalam**', async route => {
      const url = route.request().url();
      if (url.includes('/authorize')) {
        // Redirect to callback with mock code
        await route.fulfill({
          status: 302,
          headers: {
            'Location': '/fa/auth/callback?code=mock_auth_code&state=mock_state'
          }
        });
      } else if (url.includes('/callback')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              id: 1,
              username: 'testuser',
              name: 'کاربر تست',
              vendor_id: 12345
            },
            token: 'mock-jwt-token'
          })
        });
      }
    });

    await page.goto('/fa/auth/login');
    
    // Click Basalam login button
    await page.click('text=ورود با باسلام');
    
    // Should redirect to Basalam (mocked)
    await expect(page).toHaveURL(/.*\/fa\/auth\/callback/);
    
    // Should complete authentication and redirect to dashboard
    await expect(page).toHaveURL(/.*\/fa\/dashboard/);
    
    // Check user is authenticated
    await expect(page.locator('text=کاربر تست')).toBeVisible();
  });

  test('should handle OAuth callback errors', async ({ page }) => {
    await page.goto('/fa/auth/callback?error=access_denied');
    
    // Should show error message
    await expect(page.locator('text=خطا در احراز هویت')).toBeVisible();
    await expect(page.locator('text=دسترسی رد شد')).toBeVisible();
    
    // Should provide retry option
    await expect(page.locator('text=تلاش مجدد')).toBeVisible();
  });

  test('should validate required OAuth scopes', async ({ page }) => {
    // Mock insufficient scopes response
    await page.route('**/api/auth/basalam/callback', async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'insufficient_scope',
          message: 'Required scopes: vendor.product.read, vendor.product.write'
        })
      });
    });

    await page.goto('/fa/auth/callback?code=mock_code');
    
    // Should show scope error
    await expect(page.locator('text=دسترسی کافی ندارید')).toBeVisible();
    await expect(page.locator('text=vendor.product.read')).toBeVisible();
    await expect(page.locator('text=vendor.product.write')).toBeVisible();
  });

  test('should handle token refresh automatically', async ({ page }) => {
    // Mock expired token scenario
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-token', 'expired-token');
      window.localStorage.setItem('refresh-token', 'valid-refresh-token');
    });

    // Mock token refresh API
    await page.route('**/api/auth/refresh', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'new-access-token',
          refreshToken: 'new-refresh-token'
        })
      });
    });

    await page.goto('/fa/dashboard');
    
    // Should automatically refresh token and load dashboard
    await expect(page.locator('text=داشبورد')).toBeVisible();
  });

  test('should logout user and clear session', async ({ page }) => {
    // Mock authenticated user
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-token', 'valid-token');
      window.localStorage.setItem('user-data', JSON.stringify({
        name: 'کاربر تست',
        username: 'testuser'
      }));
    });

    await page.goto('/fa/dashboard');
    
    // Click logout button
    await page.click('text=خروج');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*\/fa\/auth\/login/);
    
    // Check session is cleared
    const token = await page.evaluate(() => localStorage.getItem('auth-token'));
    expect(token).toBeNull();
  });
});