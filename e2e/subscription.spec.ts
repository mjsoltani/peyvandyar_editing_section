import { test, expect } from '@playwright/test';

test.describe('Complete Registration and Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for these tests
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-token', 'mock-token');
    });

    // Mock payment APIs
    await page.route('**/api/payments**', async route => {
      const method = route.request().method();
      if (method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            status: 'pending',
            amount: 150000,
            plan: 'monthly',
            admin_card_number: '6037-9977-****-1234'
          })
        });
      }
    });

    // Mock subscription APIs
    await page.route('**/api/subscriptions**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'active',
          plan: 'monthly',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      });
    });
  });

  test('should complete full registration and payment flow', async ({ page }) => {
    // Step 1: User arrives without subscription
    await page.goto('/fa/dashboard');
    
    // Should redirect to subscription plans
    await expect(page).toHaveURL(/.*\/fa\/subscription\/plans/);
    
    // Step 2: Display subscription plans
    await expect(page.locator('h1')).toContainText('طرح‌های اشتراک');
    
    // Check for three subscription plans with correct pricing
    await expect(page.locator('text=یک ماهه')).toBeVisible();
    await expect(page.locator('text=150,000 تومان')).toBeVisible();
    
    await expect(page.locator('text=سه ماهه')).toBeVisible();
    await expect(page.locator('text=450,000 تومان')).toBeVisible();
    
    await expect(page.locator('text=شش ماهه')).toBeVisible();
    await expect(page.locator('text=690,000 تومان')).toBeVisible();
    
    // Check plan benefits are displayed
    await expect(page.locator('text=مدیریت نامحدود محصولات')).toBeVisible();
    await expect(page.locator('text=ویرایش دسته‌ای')).toBeVisible();
    await expect(page.locator('text=استفاده از الگوها')).toBeVisible();
    
    // Step 3: Select monthly plan
    await page.click('text=انتخاب >> nth=0');
    
    // Should navigate to payment page
    await expect(page).toHaveURL(/.*\/fa\/subscription\/payment/);
    
    // Step 4: Display payment instructions
    await expect(page.locator('text=پرداخت اشتراک')).toBeVisible();
    await expect(page.locator('text=کارت به کارت')).toBeVisible();
    
    // Check payment details are displayed
    await expect(page.locator('text=شماره کارت:')).toBeVisible();
    await expect(page.locator('text=6037-9977-****-1234')).toBeVisible();
    await expect(page.locator('text=مبلغ:')).toBeVisible();
    await expect(page.locator('text=150,000 تومان')).toBeVisible();
    
    // Check payment instructions
    await expect(page.locator('text=راهنمای پرداخت')).toBeVisible();
    await expect(page.locator('text=مبلغ را به شماره کارت فوق واریز کنید')).toBeVisible();
    
    // Step 5: Submit payment confirmation
    await page.fill('input[name="transactionId"]', '123456789');
    await page.fill('textarea[name="description"]', 'پرداخت انجام شد از کارت ****1111');
    
    await page.click('text=تایید پرداخت');
    
    // Should navigate to confirmation page
    await expect(page).toHaveURL(/.*\/fa\/subscription\/confirmation/);
    await expect(page.locator('text=پرداخت در انتظار تایید')).toBeVisible();
    await expect(page.locator('text=درخواست پرداخت شما ثبت شد')).toBeVisible();
    
    // Step 6: Simulate automatic approval after 1 minute (MVP feature)
    // Mock the auto-approval process
    await page.route('**/api/payments/*/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'approved',
          subscription_activated: true
        })
      });
    });
    
    // Wait for auto-approval simulation
    await page.waitForTimeout(2000); // Simulate waiting
    
    // Check for approval notification
    await expect(page.locator('text=پرداخت تایید شد')).toBeVisible();
    await expect(page.locator('text=اشتراک شما فعال شد')).toBeVisible();
    
    // Step 7: Navigate to dashboard with active subscription
    await page.click('text=ورود به داشبورد');
    
    await expect(page).toHaveURL(/.*\/fa\/dashboard/);
    
    // Check subscription status is displayed
    await expect(page.locator('text=اشتراک فعال')).toBeVisible();
    await expect(page.locator('text=یک ماهه')).toBeVisible();
    
    // Check user can now access product management
    await expect(page.locator('text=محصولات')).toBeVisible();
    await expect(page.locator('text=الگوها')).toBeVisible();
  });

  test('should handle payment rejection flow', async ({ page }) => {
    await page.goto('/fa/subscription/payment?plan=monthly');
    
    // Submit payment confirmation
    await page.fill('input[name="transactionId"]', '987654321');
    await page.fill('textarea[name="description"]', 'پرداخت انجام شد');
    await page.click('text=تایید پرداخت');
    
    // Mock payment rejection
    await page.route('**/api/payments/*/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'rejected',
          reason: 'مبلغ واریزی صحیح نیست'
        })
      });
    });
    
    await page.waitForTimeout(1000);
    
    // Check rejection notification
    await expect(page.locator('text=پرداخت رد شد')).toBeVisible();
    await expect(page.locator('text=مبلغ واریزی صحیح نیست')).toBeVisible();
    
    // Should provide retry option
    await expect(page.locator('text=تلاش مجدد')).toBeVisible();
  });

  test('should show subscription expiry warning', async ({ page }) => {
    // Mock subscription expiring soon
    await page.addInitScript(() => {
      const expiryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
      window.localStorage.setItem('subscription-status', JSON.stringify({
        status: 'active',
        plan: 'monthly',
        expiresAt: expiryDate.toISOString()
      }));
    });

    await page.goto('/fa/dashboard');
    
    // Check expiry warning is displayed
    await expect(page.locator('text=اشتراک شما به زودی منقضی می‌شود')).toBeVisible();
    await expect(page.locator('text=3 روز باقی مانده')).toBeVisible();
    await expect(page.locator('text=تمدید اشتراک')).toBeVisible();
  });

  test('should restrict access when subscription expires', async ({ page }) => {
    // Mock expired subscription
    await page.addInitScript(() => {
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      window.localStorage.setItem('subscription-status', JSON.stringify({
        status: 'expired',
        plan: 'monthly',
        expiresAt: expiredDate.toISOString()
      }));
    });

    await page.goto('/fa/dashboard/products');
    
    // Should redirect to subscription renewal
    await expect(page).toHaveURL(/.*\/fa\/subscription\/expired/);
    
    // Check expired subscription message
    await expect(page.locator('text=اشتراک شما منقضی شده است')).toBeVisible();
    await expect(page.locator('text=برای ادامه استفاده از سیستم، اشتراک خود را تمدید کنید')).toBeVisible();
    
    // Check renewal options
    await expect(page.locator('text=تمدید اشتراک')).toBeVisible();
  });

  test('should support plan comparison and upgrade', async ({ page }) => {
    await page.goto('/fa/subscription/plans');
    
    // Check plan comparison features
    await expect(page.locator('text=مقایسه طرح‌ها')).toBeVisible();
    
    // Check feature comparison table
    await expect(page.locator('text=تعداد محصولات')).toBeVisible();
    await expect(page.locator('text=نامحدود')).toBeVisible();
    
    await expect(page.locator('text=ویرایش دسته‌ای')).toBeVisible();
    await expect(page.locator('text=✓')).toBeVisible();
    
    await expect(page.locator('text=پشتیبانی')).toBeVisible();
    await expect(page.locator('text=ایمیل و تلفن')).toBeVisible();
    
    // Check discount information for longer plans
    await expect(page.locator('text=صرفه‌جویی 15%')).toBeVisible(); // 6-month plan discount
  });

  test('should validate payment form inputs', async ({ page }) => {
    await page.goto('/fa/subscription/payment?plan=monthly');
    
    // Try to submit without transaction ID
    await page.click('text=تایید پرداخت');
    
    // Check validation error
    await expect(page.locator('text=لطفاً شماره تراکنش را وارد کنید')).toBeVisible();
    
    // Fill invalid transaction ID (too short)
    await page.fill('input[name="transactionId"]', '123');
    await page.click('text=تایید پرداخت');
    
    // Check validation error
    await expect(page.locator('text=شماره تراکنش باید حداقل 6 رقم باشد')).toBeVisible();
    
    // Fill valid transaction ID but no description
    await page.fill('input[name="transactionId"]', '123456789');
    await page.click('text=تایید پرداخت');
    
    // Check validation error
    await expect(page.locator('text=لطفاً توضیحات پرداخت را وارد کنید')).toBeVisible();
  });

  test('should handle network errors during payment', async ({ page }) => {
    await page.goto('/fa/subscription/payment?plan=monthly');
    
    // Mock network error
    await page.route('**/api/payments', async route => {
      await route.abort('failed');
    });
    
    // Fill and submit form
    await page.fill('input[name="transactionId"]', '123456789');
    await page.fill('textarea[name="description"]', 'پرداخت انجام شد');
    await page.click('text=تایید پرداخت');
    
    // Check error handling
    await expect(page.locator('text=خطا در ارسال درخواست')).toBeVisible();
    await expect(page.locator('text=لطفاً اتصال اینترنت خود را بررسی کنید')).toBeVisible();
    await expect(page.locator('text=تلاش مجدد')).toBeVisible();
  });
});