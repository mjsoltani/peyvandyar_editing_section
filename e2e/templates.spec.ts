import { test, expect } from '@playwright/test';

test.describe('Template System', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication and active subscription
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-token', 'mock-token');
      window.localStorage.setItem('subscription-status', JSON.stringify({
        status: 'active',
        plan: 'monthly',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }));
    });

    // Mock templates API
    await page.route('**/api/templates**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          templates: [
            {
              id: 1,
              name: 'الگوی قیمت‌گذاری',
              description: 'الگو برای به‌روزرسانی قیمت محصولات',
              fields: ['price', 'discount_price'],
              created_at: '2024-01-01T00:00:00Z'
            },
            {
              id: 2,
              name: 'الگوی موجودی',
              description: 'الگو برای مدیریت موجودی',
              fields: ['stock'],
              created_at: '2024-01-02T00:00:00Z'
            }
          ]
        })
      });
    });

    // Mock products API for template selection
    await page.route('**/api/products**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: [
            {
              id: 1,
              title: 'محصول الگو',
              price: 100000,
              discount_price: 80000,
              stock: 50,
              status: 'active',
              category: 'دسته 1'
            }
          ]
        })
      });
    });
  });

  test('should display templates list', async ({ page }) => {
    await page.goto('/fa/dashboard/templates');
    
    // Check templates page loads
    await expect(page.locator('h1')).toContainText('الگوها');
    
    // Check template list
    await expect(page.locator('text=الگوی قیمت‌گذاری')).toBeVisible();
    await expect(page.locator('text=الگوی موجودی')).toBeVisible();
    
    // Check template descriptions
    await expect(page.locator('text=الگو برای به‌روزرسانی قیمت محصولات')).toBeVisible();
    await expect(page.locator('text=الگو برای مدیریت موجودی')).toBeVisible();
    
    // Check template actions
    await expect(page.locator('text=اعمال الگو')).toBeVisible();
    await expect(page.locator('text=ویرایش')).toBeVisible();
  });

  test('should create new template', async ({ page }) => {
    await page.goto('/fa/dashboard/templates');
    
    // Click create template button
    await page.click('text=ایجاد الگو');
    
    // Check template creation form
    await expect(page.locator('text=انتخاب محصول الگو')).toBeVisible();
    
    // Select template product
    await page.click('text=محصول الگو');
    
    // Check field selection interface
    await expect(page.locator('text=انتخاب فیلدها')).toBeVisible();
    
    // Select fields to include in template
    await page.check('input[name="price"]');
    await page.check('input[name="discount_price"]');
    await page.check('input[name="stock"]');
    
    // Check preview
    await expect(page.locator('text=پیش‌نمایش')).toBeVisible();
    await expect(page.locator('text=100,000')).toBeVisible(); // Price preview
    await expect(page.locator('text=80,000')).toBeVisible();  // Discount price preview
    await expect(page.locator('text=50')).toBeVisible();      // Stock preview
    
    // Fill template details
    await page.fill('input[name="templateName"]', 'الگوی جدید');
    await page.fill('textarea[name="templateDescription"]', 'توضیحات الگوی جدید');
    
    // Save template
    await page.click('text=ذخیره الگو');
    
    // Check success message
    await expect(page.locator('text=الگو با موفقیت ایجاد شد')).toBeVisible();
  });

  test('should apply template to selected products', async ({ page }) => {
    await page.goto('/fa/dashboard/products');
    
    // Select products for template application
    await page.check('input[type="checkbox"] >> nth=1');
    
    // Click apply template button
    await page.click('text=اعمال الگو');
    
    // Check template selection dialog
    await expect(page.locator('text=انتخاب الگو')).toBeVisible();
    
    // Select a template
    await page.click('text=الگوی قیمت‌گذاری');
    
    // Check template preview
    await expect(page.locator('text=پیش‌نمایش داده‌های الگو')).toBeVisible();
    
    // Confirm template application
    await page.click('text=اعمال الگو >> nth=1');
    
    // Check progress indicator
    await expect(page.locator('.progress-bar')).toBeVisible();
    
    // Check success message
    await expect(page.locator('text=الگو با موفقیت اعمال شد')).toBeVisible();
  });

  test('should show template field tooltips', async ({ page }) => {
    await page.goto('/fa/dashboard/templates');
    
    // Click create template
    await page.click('text=ایجاد الگو');
    
    // Select a product
    await page.click('text=محصول الگو');
    
    // Hover over field info icons to show tooltips
    await page.hover('.info-tooltip[data-field="price"]');
    await expect(page.locator('.tooltip')).toContainText('قیمت اصلی محصول');
    
    await page.hover('.info-tooltip[data-field="discount_price"]');
    await expect(page.locator('.tooltip')).toContainText('قیمت با تخفیف');
    
    await page.hover('.info-tooltip[data-field="stock"]');
    await expect(page.locator('.tooltip')).toContainText('تعداد موجودی');
  });

  test('should handle template errors gracefully', async ({ page }) => {
    // Mock template creation error
    await page.route('**/api/templates', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Template validation failed' })
        });
      }
    });

    await page.goto('/fa/dashboard/templates');
    
    // Try to create template
    await page.click('text=ایجاد الگو');
    await page.click('text=محصول الگو');
    await page.check('input[name="price"]');
    await page.fill('input[name="templateName"]', 'الگوی خطا');
    await page.click('text=ذخیره الگو');
    
    // Check error message
    await expect(page.locator('text=خطا در ایجاد الگو')).toBeVisible();
  });

  test('should support template search and filtering', async ({ page }) => {
    await page.goto('/fa/dashboard/templates');
    
    // Test search functionality
    await page.fill('input[placeholder*="جستجو"]', 'قیمت');
    
    // Should show filtered results
    await expect(page.locator('text=الگوی قیمت‌گذاری')).toBeVisible();
    await expect(page.locator('text=الگوی موجودی')).not.toBeVisible();
    
    // Clear search
    await page.fill('input[placeholder*="جستجو"]', '');
    
    // Both templates should be visible again
    await expect(page.locator('text=الگوی قیمت‌گذاری')).toBeVisible();
    await expect(page.locator('text=الگوی موجودی')).toBeVisible();
  });

  test('should validate template fields before saving', async ({ page }) => {
    await page.goto('/fa/dashboard/templates');
    
    // Click create template
    await page.click('text=ایجاد الگو');
    
    // Try to save without selecting product
    await page.click('text=ذخیره الگو');
    
    // Check validation error
    await expect(page.locator('text=لطفاً محصول الگو را انتخاب کنید')).toBeVisible();
    
    // Select product but no fields
    await page.click('text=محصول الگو');
    await page.click('text=ذخیره الگو');
    
    // Check field validation error
    await expect(page.locator('text=لطفاً حداقل یک فیلد را انتخاب کنید')).toBeVisible();
    
    // Select fields but no name
    await page.check('input[name="price"]');
    await page.click('text=ذخیره الگو');
    
    // Check name validation error
    await expect(page.locator('text=لطفاً نام الگو را وارد کنید')).toBeVisible();
  });
});