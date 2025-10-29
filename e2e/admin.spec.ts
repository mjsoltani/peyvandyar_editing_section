import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-token', 'admin-token');
      window.localStorage.setItem('user-role', 'admin');
    });

    // Mock admin API responses
    await page.route('**/api/admin/**', async route => {
      const url = route.request().url();
      
      if (url.includes('/users')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            users: [
              {
                id: 1,
                username: 'user1',
                name: 'کاربر تست 1',
                email: 'user1@test.com',
                vendor_id: 12345,
                subscription_status: 'active',
                created_at: '2024-01-01T00:00:00Z'
              },
              {
                id: 2,
                username: 'user2',
                name: 'کاربر تست 2',
                email: 'user2@test.com',
                vendor_id: 12346,
                subscription_status: 'expired',
                created_at: '2024-01-02T00:00:00Z'
              }
            ],
            total: 2
          })
        });
      } else if (url.includes('/payments')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            payments: [
              {
                id: 1,
                user_id: 1,
                amount: 150000,
                plan: 'monthly',
                status: 'pending',
                created_at: '2024-01-01T00:00:00Z'
              }
            ],
            total: 1
          })
        });
      } else if (url.includes('/analytics')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalUsers: 150,
            activeSubscriptions: 120,
            totalRevenue: 18000000,
            pendingPayments: 5
          })
        });
      }
    });
  });

  test('should display admin dashboard with analytics', async ({ page }) => {
    await page.goto('/fa/admin');
    
    // Check admin dashboard loads
    await expect(page.locator('h1')).toContainText('داشبورد مدیریت');
    
    // Check analytics cards
    await expect(page.locator('text=کل کاربران')).toBeVisible();
    await expect(page.locator('text=150')).toBeVisible(); // Total users
    
    await expect(page.locator('text=اشتراک‌های فعال')).toBeVisible();
    await expect(page.locator('text=120')).toBeVisible(); // Active subscriptions
    
    await expect(page.locator('text=کل درآمد')).toBeVisible();
    await expect(page.locator('text=18,000,000')).toBeVisible(); // Total revenue
    
    await expect(page.locator('text=پرداخت‌های در انتظار')).toBeVisible();
    await expect(page.locator('text=5')).toBeVisible(); // Pending payments
  });

  test('should display and manage users', async ({ page }) => {
    await page.goto('/fa/admin/users');
    
    // Check users page loads
    await expect(page.locator('h1')).toContainText('مدیریت کاربران');
    
    // Check user list
    await expect(page.locator('text=کاربر تست 1')).toBeVisible();
    await expect(page.locator('text=کاربر تست 2')).toBeVisible();
    
    // Check user details
    await expect(page.locator('text=user1@test.com')).toBeVisible();
    await expect(page.locator('text=12345')).toBeVisible(); // Vendor ID
    
    // Check subscription status
    await expect(page.locator('text=فعال')).toBeVisible();
    await expect(page.locator('text=منقضی')).toBeVisible();
    
    // Test user actions
    await expect(page.locator('text=مشاهده فعالیت')).toBeVisible();
    await expect(page.locator('text=غیرفعال‌سازی')).toBeVisible();
  });

  test('should display and manage payment requests', async ({ page }) => {
    await page.goto('/fa/admin/payments');
    
    // Check payments page loads
    await expect(page.locator('h1')).toContainText('درخواست‌های پرداخت');
    
    // Check payment list
    await expect(page.locator('text=150,000')).toBeVisible(); // Amount
    await expect(page.locator('text=یک ماهه')).toBeVisible(); // Plan
    await expect(page.locator('text=در انتظار')).toBeVisible(); // Status
    
    // Check payment actions
    await expect(page.locator('text=تایید')).toBeVisible();
    await expect(page.locator('text=رد')).toBeVisible();
  });

  test('should complete payment approval workflow', async ({ page }) => {
    await page.goto('/fa/admin/payments');
    
    // Mock payment approval API
    await page.route('**/api/admin/payments/*/approve', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true,
          subscription_activated: true,
          user_id: 1
        })
      });
    });

    // Mock subscription activation API
    await page.route('**/api/admin/subscriptions', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          user_id: 1,
          plan: 'monthly',
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      });
    });
    
    // Step 1: Review payment details
    await expect(page.locator('text=درخواست‌های پرداخت')).toBeVisible();
    
    // Check payment information
    await expect(page.locator('text=150,000 تومان')).toBeVisible();
    await expect(page.locator('text=یک ماهه')).toBeVisible();
    await expect(page.locator('text=در انتظار')).toBeVisible();
    
    // View payment details
    await page.click('text=جزئیات >> nth=0');
    
    await expect(page.locator('text=شماره تراکنش:')).toBeVisible();
    await expect(page.locator('text=توضیحات پرداخت:')).toBeVisible();
    await expect(page.locator('text=تاریخ درخواست:')).toBeVisible();
    
    // Step 2: Approve payment
    await page.click('text=تایید');
    
    // Check confirmation dialog
    await expect(page.locator('text=تایید پرداخت')).toBeVisible();
    await expect(page.locator('text=آیا از تایید این پرداخت اطمینان دارید؟')).toBeVisible();
    await expect(page.locator('text=پس از تایید، اشتراک کاربر فعال خواهد شد')).toBeVisible();
    
    // Confirm approval
    await page.click('text=تایید پرداخت >> nth=1');
    
    // Step 3: Verify approval success
    await expect(page.locator('text=پرداخت با موفقیت تایید شد')).toBeVisible();
    await expect(page.locator('text=اشتراک کاربر فعال شد')).toBeVisible();
    
    // Payment status should update
    await expect(page.locator('text=تایید شده')).toBeVisible();
    
    // Step 4: Verify subscription was created
    await page.click('text=اشتراک‌ها');
    
    await expect(page.locator('text=اشتراک‌های فعال')).toBeVisible();
    await expect(page.locator('text=یک ماهه')).toBeVisible();
    await expect(page.locator('text=فعال')).toBeVisible();
  });

  test('should handle payment rejection workflow', async ({ page }) => {
    await page.goto('/fa/admin/payments');
    
    // Mock payment rejection API
    await page.route('**/api/admin/payments/*/reject', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true,
          reason: 'مبلغ واریزی صحیح نیست'
        })
      });
    });
    
    // Click reject button
    await page.click('text=رد >> nth=0');
    
    // Check rejection dialog
    await expect(page.locator('text=رد پرداخت')).toBeVisible();
    await expect(page.locator('text=دلیل رد پرداخت را وارد کنید')).toBeVisible();
    
    // Fill rejection reason
    await page.fill('textarea[name="rejectionReason"]', 'مبلغ واریزی صحیح نیست');
    
    // Confirm rejection
    await page.click('text=رد پرداخت >> nth=1');
    
    // Check success message
    await expect(page.locator('text=پرداخت رد شد')).toBeVisible();
    
    // Payment status should update
    await expect(page.locator('text=رد شده')).toBeVisible();
  });

  test('should manage user subscriptions', async ({ page }) => {
    // Mock subscription management APIs
    await page.route('**/api/admin/subscriptions**', async route => {
      const url = route.request().url();
      const method = route.request().method();
      
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            subscriptions: [
              {
                id: 1,
                user_id: 1,
                user_name: 'کاربر تست 1',
                plan: 'monthly',
                status: 'active',
                start_date: '2024-01-01T00:00:00Z',
                end_date: '2024-02-01T00:00:00Z',
                auto_renew: true
              },
              {
                id: 2,
                user_id: 2,
                user_name: 'کاربر تست 2',
                plan: 'quarterly',
                status: 'expired',
                start_date: '2023-10-01T00:00:00Z',
                end_date: '2024-01-01T00:00:00Z',
                auto_renew: false
              }
            ]
          })
        });
      } else if (method === 'PATCH' && url.includes('/extend')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            new_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
        });
      }
    });

    await page.goto('/fa/admin/subscriptions');
    
    // Check subscriptions list
    await expect(page.locator('text=مدیریت اشتراک‌ها')).toBeVisible();
    
    // Check subscription details
    await expect(page.locator('text=کاربر تست 1')).toBeVisible();
    await expect(page.locator('text=یک ماهه')).toBeVisible();
    await expect(page.locator('text=فعال')).toBeVisible();
    
    await expect(page.locator('text=کاربر تست 2')).toBeVisible();
    await expect(page.locator('text=سه ماهه')).toBeVisible();
    await expect(page.locator('text=منقضی')).toBeVisible();
    
    // Test subscription extension
    await page.click('text=تمدید >> nth=1'); // Extend expired subscription
    
    // Check extension dialog
    await expect(page.locator('text=تمدید اشتراک')).toBeVisible();
    await expect(page.locator('text=مدت تمدید (روز):')).toBeVisible();
    
    // Fill extension period
    await page.fill('input[name="extensionDays"]', '30');
    
    // Confirm extension
    await page.click('text=تمدید اشتراک >> nth=1');
    
    // Check success message
    await expect(page.locator('text=اشتراک با موفقیت تمدید شد')).toBeVisible();
  });

  test('should display comprehensive analytics and reports', async ({ page }) => {
    // Mock enhanced analytics API
    await page.route('**/api/admin/analytics**', async route => {
      const url = route.request().url();
      
      if (url.includes('/overview')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalUsers: 150,
            activeSubscriptions: 120,
            expiredSubscriptions: 25,
            pendingPayments: 5,
            totalRevenue: 18000000,
            monthlyRevenue: 2500000,
            averageSubscriptionLength: 2.5,
            topPlan: 'monthly'
          })
        });
      } else if (url.includes('/revenue-chart')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            labels: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'],
            data: [1200000, 1500000, 1800000, 2100000, 2300000, 2500000]
          })
        });
      } else if (url.includes('/user-activity')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalLogins: 1250,
            totalProductUpdates: 15000,
            averageSessionTime: 45,
            mostActiveUsers: [
              { name: 'کاربر 1', updates: 500 },
              { name: 'کاربر 2', updates: 350 },
              { name: 'کاربر 3', updates: 280 }
            ]
          })
        });
      }
    });

    await page.goto('/fa/admin/analytics');
    
    // Check analytics dashboard
    await expect(page.locator('text=آمار و گزارشات')).toBeVisible();
    
    // Check overview metrics
    await expect(page.locator('text=کل کاربران')).toBeVisible();
    await expect(page.locator('text=150')).toBeVisible();
    
    await expect(page.locator('text=اشتراک‌های فعال')).toBeVisible();
    await expect(page.locator('text=120')).toBeVisible();
    
    await expect(page.locator('text=کل درآمد')).toBeVisible();
    await expect(page.locator('text=18,000,000 تومان')).toBeVisible();
    
    await expect(page.locator('text=درآمد ماهانه')).toBeVisible();
    await expect(page.locator('text=2,500,000 تومان')).toBeVisible();
    
    // Check revenue chart
    await expect(page.locator('text=نمودار درآمد')).toBeVisible();
    await expect(page.locator('.chart-container')).toBeVisible();
    
    // Check user activity metrics
    await expect(page.locator('text=فعالیت کاربران')).toBeVisible();
    await expect(page.locator('text=1,250 ورود')).toBeVisible();
    await expect(page.locator('text=15,000 به‌روزرسانی محصول')).toBeVisible();
    await expect(page.locator('text=45 دقیقه متوسط زمان جلسه')).toBeVisible();
    
    // Check most active users
    await expect(page.locator('text=فعال‌ترین کاربران')).toBeVisible();
    await expect(page.locator('text=کاربر 1')).toBeVisible();
    await expect(page.locator('text=500 به‌روزرسانی')).toBeVisible();
  });

  test('should export reports and data', async ({ page }) => {
    await page.goto('/fa/admin/analytics');
    
    // Mock export APIs
    await page.route('**/api/admin/export/**', async route => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="report.xlsx"'
        },
        body: 'mock-excel-data'
      });
    });
    
    // Test user export
    await page.click('text=خروجی کاربران');
    
    // Check export options
    await expect(page.locator('text=انتخاب فرمت خروجی')).toBeVisible();
    await expect(page.locator('text=Excel')).toBeVisible();
    await expect(page.locator('text=CSV')).toBeVisible();
    
    // Select Excel format
    await page.click('text=Excel');
    
    // Check download starts
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=دانلود');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('users');
    
    // Test payment export
    await page.click('text=خروجی پرداخت‌ها');
    await page.click('text=CSV');
    
    const paymentDownloadPromise = page.waitForEvent('download');
    await page.click('text=دانلود');
    const paymentDownload = await paymentDownloadPromise;
    
    expect(paymentDownload.suggestedFilename()).toContain('payments');
  });

  test('should display user activity log', async ({ page }) => {
    // Mock activity log API
    await page.route('**/api/admin/users/1/activity', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          activities: [
            {
              id: 1,
              action: 'login',
              details: { ip: '192.168.1.1' },
              created_at: '2024-01-01T10:00:00Z'
            },
            {
              id: 2,
              action: 'product_update',
              details: { product_id: 123, count: 5 },
              created_at: '2024-01-01T11:00:00Z'
            }
          ]
        })
      });
    });

    await page.goto('/fa/admin/users/1/activity');
    
    // Check activity page loads
    await expect(page.locator('h1')).toContainText('فعالیت کاربر');
    
    // Check activity entries
    await expect(page.locator('text=ورود')).toBeVisible();
    await expect(page.locator('text=به‌روزرسانی محصول')).toBeVisible();
    await expect(page.locator('text=192.168.1.1')).toBeVisible();
  });

  test('should support admin navigation', async ({ page }) => {
    await page.goto('/fa/admin');
    
    // Check admin navigation menu
    await expect(page.locator('text=داشبورد مدیریت')).toBeVisible();
    await expect(page.locator('text=کاربران')).toBeVisible();
    await expect(page.locator('text=پرداخت‌ها')).toBeVisible();
    await expect(page.locator('text=اشتراک‌ها')).toBeVisible();
    await expect(page.locator('text=آمار و گزارشات')).toBeVisible();
    
    // Test navigation
    await page.click('text=کاربران');
    await expect(page).toHaveURL(/.*\/fa\/admin\/users/);
    
    await page.click('text=پرداخت‌ها');
    await expect(page).toHaveURL(/.*\/fa\/admin\/payments/);
  });

  test('should restrict access to non-admin users', async ({ page }) => {
    // Mock non-admin user
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-token', 'user-token');
      window.localStorage.setItem('user-role', 'user');
    });

    await page.goto('/fa/admin');
    
    // Should redirect to unauthorized page or dashboard
    await expect(page).not.toHaveURL(/.*\/fa\/admin/);
    await expect(page.locator('text=دسترسی غیرمجاز')).toBeVisible();
  });
});