import { test, expect } from '@playwright/test';

test.describe('Product Management', () => {
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

    // Mock API responses
    await page.route('**/api/products**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: [
            {
              id: 1,
              title: 'محصول تست 1',
              price: 100000,
              discount_price: 80000,
              stock: 10,
              status: 'active',
              category: 'دسته 1'
            },
            {
              id: 2,
              title: 'محصول تست 2',
              price: 200000,
              stock: 5,
              status: 'active',
              category: 'دسته 2'
            }
          ],
          total: 2,
          page: 1,
          limit: 20
        })
      });
    });
  });

  test('should display products list', async ({ page }) => {
    await page.goto('/fa/dashboard/products');
    
    // Check if products page loads
    await expect(page.locator('h1')).toContainText('محصولات');
    
    // Check if products are displayed
    await expect(page.locator('text=محصول تست 1')).toBeVisible();
    await expect(page.locator('text=محصول تست 2')).toBeVisible();
    
    // Check product details
    await expect(page.locator('text=100,000')).toBeVisible(); // Price
    await expect(page.locator('text=80,000')).toBeVisible();  // Discount price
    await expect(page.locator('text=10')).toBeVisible();      // Stock
  });

  test('should support product search and filtering', async ({ page }) => {
    await page.goto('/fa/dashboard/products');
    
    // Test search functionality
    await page.fill('input[placeholder*="جستجو"]', 'محصول تست 1');
    await page.press('input[placeholder*="جستجو"]', 'Enter');
    
    // Should show filtered results
    await expect(page.locator('text=محصول تست 1')).toBeVisible();
    
    // Test category filter
    await page.selectOption('select[name="category"]', 'دسته 1');
    await expect(page.locator('text=محصول تست 1')).toBeVisible();
  });

  test('should support product selection for batch operations', async ({ page }) => {
    await page.goto('/fa/dashboard/products');
    
    // Check product selection functionality
    await expect(page.locator('text=انتخاب محصولات')).toBeVisible();
    
    // Select individual products
    await page.check('input[type="checkbox"] >> nth=1'); // First product
    await page.check('input[type="checkbox"] >> nth=2'); // Second product
    
    // Check selection count
    await expect(page.locator('text=2 انتخاب شده')).toBeVisible();
    
    // Test select all functionality
    await page.click('text=انتخاب همه صفحه');
    await expect(page.locator('text=2 انتخاب شده')).toBeVisible();
    
    // Test batch edit button appears
    await expect(page.locator('text=ویرایش دسته‌ای')).toBeVisible();
  });

  test('should complete single product editing workflow', async ({ page }) => {
    // Mock product details API
    await page.route('**/api/products/1', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            title: 'محصول تست 1',
            description: 'توضیحات محصول تست',
            price: 100000,
            discount_price: 80000,
            stock: 10,
            status: 'active',
            category: 'دسته 1',
            variants: [
              { id: 1, name: 'رنگ', value: 'قرمز', price: 100000, stock: 5 },
              { id: 2, name: 'رنگ', value: 'آبی', price: 100000, stock: 5 }
            ]
          })
        });
      } else if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'محصول با موفقیت به‌روزرسانی شد'
          })
        });
      }
    });

    await page.goto('/fa/dashboard/products');
    
    // Step 1: Navigate to product edit
    await page.click('text=ویرایش >> nth=0');
    
    // Should navigate to product edit page
    await expect(page).toHaveURL(/.*\/fa\/dashboard\/products\/1\/edit/);
    
    // Step 2: Check product edit form loads with current data
    await expect(page.locator('h1')).toContainText('ویرایش محصول');
    
    await expect(page.locator('input[name="title"]')).toHaveValue('محصول تست 1');
    await expect(page.locator('textarea[name="description"]')).toHaveValue('توضیحات محصول تست');
    await expect(page.locator('input[name="price"]')).toHaveValue('100000');
    await expect(page.locator('input[name="discount_price"]')).toHaveValue('80000');
    await expect(page.locator('input[name="stock"]')).toHaveValue('10');
    
    // Step 3: Edit product fields
    await page.fill('input[name="title"]', 'محصول تست ویرایش شده');
    await page.fill('textarea[name="description"]', 'توضیحات جدید محصول');
    await page.fill('input[name="price"]', '120000');
    await page.fill('input[name="discount_price"]', '100000');
    await page.fill('input[name="stock"]', '15');
    
    // Step 4: Edit variants
    await expect(page.locator('text=تنوع‌ها')).toBeVisible();
    
    // Edit first variant
    await page.fill('input[name="variants[0].price"]', '120000');
    await page.fill('input[name="variants[0].stock"]', '8');
    
    // Edit second variant
    await page.fill('input[name="variants[1].price"]', '120000');
    await page.fill('input[name="variants[1].stock"]', '7');
    
    // Step 5: Preview changes
    await page.click('text=پیش‌نمایش تغییرات');
    
    await expect(page.locator('text=پیش‌نمایش')).toBeVisible();
    await expect(page.locator('text=محصول تست ویرایش شده')).toBeVisible();
    await expect(page.locator('text=120,000 تومان')).toBeVisible();
    await expect(page.locator('text=100,000 تومان')).toBeVisible();
    await expect(page.locator('text=15 عدد')).toBeVisible();
    
    // Step 6: Save changes
    await page.click('text=ذخیره تغییرات');
    
    // Step 7: Verify success
    await expect(page.locator('text=محصول با موفقیت به‌روزرسانی شد')).toBeVisible();
    
    // Should redirect back to products list
    await expect(page).toHaveURL(/.*\/fa\/dashboard\/products/);
    
    // Check updated product appears in list
    await expect(page.locator('text=محصول تست ویرایش شده')).toBeVisible();
    await expect(page.locator('text=120,000')).toBeVisible();
  });

  test('should validate single product edit form', async ({ page }) => {
    await page.goto('/fa/dashboard/products/1/edit');
    
    // Clear required fields
    await page.fill('input[name="title"]', '');
    await page.fill('input[name="price"]', '');
    
    // Try to save
    await page.click('text=ذخیره تغییرات');
    
    // Check validation errors
    await expect(page.locator('text=عنوان محصول الزامی است')).toBeVisible();
    await expect(page.locator('text=قیمت محصول الزامی است')).toBeVisible();
    
    // Test invalid price
    await page.fill('input[name="price"]', '-100');
    await page.click('text=ذخیره تغییرات');
    
    await expect(page.locator('text=قیمت باید مثبت باشد')).toBeVisible();
    
    // Test invalid stock
    await page.fill('input[name="stock"]', '-5');
    await page.click('text=ذخیره تغییرات');
    
    await expect(page.locator('text=موجودی نمی‌تواند منفی باشد')).toBeVisible();
  });

  test('should handle product edit cancellation', async ({ page }) => {
    await page.goto('/fa/dashboard/products/1/edit');
    
    // Make some changes
    await page.fill('input[name="title"]', 'تغییر تست');
    await page.fill('input[name="price"]', '200000');
    
    // Click cancel
    await page.click('text=لغو');
    
    // Should show confirmation dialog
    await expect(page.locator('text=آیا از لغو تغییرات اطمینان دارید؟')).toBeVisible();
    await expect(page.locator('text=تغییرات ذخیره نشده از بین خواهد رفت')).toBeVisible();
    
    // Confirm cancellation
    await page.click('text=بله، لغو کن');
    
    // Should redirect to products list
    await expect(page).toHaveURL(/.*\/fa\/dashboard\/products/);
    
    // Original product should still be there unchanged
    await expect(page.locator('text=محصول تست 1')).toBeVisible();
    await expect(page.locator('text=100,000')).toBeVisible();
  });

  test('should complete full batch editing workflow', async ({ page }) => {
    // Mock batch update API
    await page.route('**/api/products/batch', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobId: 'batch-job-123',
          status: 'started',
          totalProducts: 2
        })
      });
    });

    // Mock batch job status API
    await page.route('**/api/jobs/batch-job-123/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'completed',
          progress: 100,
          successful: 2,
          failed: 0,
          results: [
            { productId: 1, status: 'success', message: 'محصول با موفقیت به‌روزرسانی شد' },
            { productId: 2, status: 'success', message: 'محصول با موفقیت به‌روزرسانی شد' }
          ]
        })
      });
    });

    await page.goto('/fa/dashboard/products');
    
    // Step 1: Select products for batch editing
    await page.check('input[type="checkbox"] >> nth=1');
    await page.check('input[type="checkbox"] >> nth=2');
    
    // Verify selection count
    await expect(page.locator('text=2 محصول انتخاب شده')).toBeVisible();
    
    // Step 2: Start batch edit
    await page.click('text=ویرایش دسته‌ای');
    
    // Should navigate to batch edit page
    await expect(page).toHaveURL(/.*\/fa\/dashboard\/batch-edit/);
    
    // Step 3: Configure batch edit options
    await expect(page.locator('text=ویرایش دسته‌ای محصولات')).toBeVisible();
    await expect(page.locator('text=2 محصول انتخاب شده')).toBeVisible();
    
    // Check available fields for editing
    await expect(page.locator('text=انتخاب فیلدهای قابل ویرایش')).toBeVisible();
    await expect(page.locator('input[name="price"]')).toBeVisible();
    await expect(page.locator('input[name="discount_price"]')).toBeVisible();
    await expect(page.locator('input[name="stock"]')).toBeVisible();
    await expect(page.locator('input[name="status"]')).toBeVisible();
    
    // Step 4: Select fields and set values
    await page.check('input[name="price"]');
    await page.fill('input[name="newPrice"]', '150000');
    
    await page.check('input[name="discount_price"]');
    await page.fill('input[name="newDiscountPrice"]', '120000');
    
    await page.check('input[name="stock"]');
    await page.fill('input[name="newStock"]', '25');
    
    // Step 5: Preview changes
    await page.click('text=پیش‌نمایش تغییرات');
    
    await expect(page.locator('text=پیش‌نمایش')).toBeVisible();
    await expect(page.locator('text=قیمت: 150,000 تومان')).toBeVisible();
    await expect(page.locator('text=قیمت با تخفیف: 120,000 تومان')).toBeVisible();
    await expect(page.locator('text=موجودی: 25')).toBeVisible();
    
    // Step 6: Start batch update
    await page.click('text=شروع به‌روزرسانی');
    
    // Step 7: Monitor progress
    await expect(page.locator('text=در حال پردازش')).toBeVisible();
    await expect(page.locator('.progress-bar')).toBeVisible();
    await expect(page.locator('text=0 از 2 محصول پردازش شد')).toBeVisible();
    
    // Wait for completion
    await page.waitForTimeout(2000);
    
    // Step 8: View results
    await expect(page.locator('text=پردازش کامل شد')).toBeVisible();
    await expect(page.locator('text=2 محصول با موفقیت به‌روزرسانی شد')).toBeVisible();
    await expect(page.locator('text=0 محصول با خطا')).toBeVisible();
    
    // Check detailed results
    await expect(page.locator('text=جزئیات نتایج')).toBeVisible();
    await expect(page.locator('text=محصول با موفقیت به‌روزرسانی شد')).toBeVisible();
    
    // Step 9: Download report
    await expect(page.locator('text=دانلود گزارش')).toBeVisible();
    
    // Step 10: Return to products list
    await page.click('text=بازگشت به لیست محصولات');
    await expect(page).toHaveURL(/.*\/fa\/dashboard\/products/);
  });

  test('should handle batch edit with partial failures', async ({ page }) => {
    // Mock batch update with some failures
    await page.route('**/api/products/batch', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobId: 'batch-job-456',
          status: 'started',
          totalProducts: 3
        })
      });
    });

    await page.route('**/api/jobs/batch-job-456/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'completed',
          progress: 100,
          successful: 2,
          failed: 1,
          results: [
            { productId: 1, status: 'success', message: 'محصول با موفقیت به‌روزرسانی شد' },
            { productId: 2, status: 'success', message: 'محصول با موفقیت به‌روزرسانی شد' },
            { productId: 3, status: 'error', message: 'خطا: قیمت نامعتبر است' }
          ]
        })
      });
    });

    await page.goto('/fa/dashboard/products');
    
    // Select 3 products
    await page.check('input[type="checkbox"] >> nth=1');
    await page.check('input[type="checkbox"] >> nth=2');
    await page.check('input[type="checkbox"] >> nth=3');
    
    await page.click('text=ویرایش دسته‌ای');
    
    // Configure batch edit
    await page.check('input[name="price"]');
    await page.fill('input[name="newPrice"]', '0'); // Invalid price to cause error
    
    await page.click('text=شروع به‌روزرسانی');
    
    // Wait for completion
    await page.waitForTimeout(2000);
    
    // Check partial success results
    await expect(page.locator('text=پردازش کامل شد')).toBeVisible();
    await expect(page.locator('text=2 محصول با موفقیت به‌روزرسانی شد')).toBeVisible();
    await expect(page.locator('text=1 محصول با خطا')).toBeVisible();
    
    // Check error details
    await expect(page.locator('text=خطا: قیمت نامعتبر است')).toBeVisible();
    
    // Should show retry option for failed items
    await expect(page.locator('text=تلاش مجدد برای موارد ناموفق')).toBeVisible();
  });

  test('should support stopping batch operation', async ({ page }) => {
    // Mock long-running batch job
    await page.route('**/api/products/batch', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jobId: 'batch-job-789',
          status: 'started',
          totalProducts: 100
        })
      });
    });

    await page.route('**/api/jobs/batch-job-789/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'running',
          progress: 30,
          successful: 30,
          failed: 0
        })
      });
    });

    await page.route('**/api/jobs/batch-job-789/cancel', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'cancelled',
          message: 'عملیات متوقف شد'
        })
      });
    });

    await page.goto('/fa/dashboard/batch-edit');
    
    // Start batch operation
    await page.check('input[name="price"]');
    await page.fill('input[name="newPrice"]', '100000');
    await page.click('text=شروع به‌روزرسانی');
    
    // Check progress is shown
    await expect(page.locator('text=در حال پردازش')).toBeVisible();
    await expect(page.locator('text=30%')).toBeVisible();
    
    // Stop the operation
    await page.click('text=توقف عملیات');
    
    // Confirm stop
    await page.click('text=بله، متوقف کن');
    
    // Check operation stopped
    await expect(page.locator('text=عملیات متوقف شد')).toBeVisible();
    await expect(page.locator('text=30 محصول پردازش شد')).toBeVisible();
  });

  test('should display tooltips for complex operations', async ({ page }) => {
    await page.goto('/fa/dashboard/products');
    
    // Hover over info icon to show tooltip
    await page.hover('.info-tooltip >> nth=0');
    
    // Check tooltip appears
    await expect(page.locator('.tooltip')).toBeVisible();
    await expect(page.locator('.tooltip')).toContainText('می‌توانید محصولات را');
  });

  test('should handle loading states properly', async ({ page }) => {
    // Delay API response to test loading state
    await page.route('**/api/products**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ products: [], total: 0 })
      });
    });

    await page.goto('/fa/dashboard/products');
    
    // Check loading indicator appears
    await expect(page.locator('text=در حال بارگذاری محصولات')).toBeVisible();
    
    // Wait for loading to complete
    await expect(page.locator('text=در حال بارگذاری محصولات')).not.toBeVisible({ timeout: 2000 });
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/products**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    await page.goto('/fa/dashboard/products');
    
    // Check error message appears
    await expect(page.locator('text=خطا در بارگذاری محصولات')).toBeVisible();
    
    // Check retry button
    await expect(page.locator('text=تلاش مجدد')).toBeVisible();
  });
});