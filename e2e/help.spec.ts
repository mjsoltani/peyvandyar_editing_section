import { test, expect } from '@playwright/test';

test.describe('Help System', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-token', 'mock-token');
    });
  });

  test('should display help page with navigation', async ({ page }) => {
    await page.goto('/fa/help');
    
    // Check help page loads
    await expect(page.locator('h1')).toContainText('راهنما');
    await expect(page.locator('text=راهنمای کامل استفاده از سیستم مدیریت محصولات باسلام')).toBeVisible();
    
    // Check sidebar navigation
    await expect(page.locator('text=فهرست مطالب')).toBeVisible();
    await expect(page.locator('text=شروع کار')).toBeVisible();
    await expect(page.locator('text=مدیریت محصولات')).toBeVisible();
    await expect(page.locator('text=ویرایش دسته‌ای')).toBeVisible();
    await expect(page.locator('text=استفاده از الگوها')).toBeVisible();
    await expect(page.locator('text=مدیریت اشتراک')).toBeVisible();
    await expect(page.locator('text=عیب‌یابی')).toBeVisible();
    await expect(page.locator('text=سوالات متداول')).toBeVisible();
  });

  test('should navigate between help sections', async ({ page }) => {
    await page.goto('/fa/help');
    
    // Default section should be "Getting Started"
    await expect(page.locator('text=شروع کار')).toHaveClass(/bg-blue-100/);
    await expect(page.locator('text=برای شروع کار با سیستم مدیریت محصولات باسلام')).toBeVisible();
    
    // Click on Product Management section
    await page.click('text=مدیریت محصولات');
    await expect(page.locator('text=مدیریت محصولات')).toHaveClass(/bg-blue-100/);
    await expect(page.locator('text=در صفحه محصولات می‌توانید تمام محصولات خود را مشاهده کنید')).toBeVisible();
    
    // Click on Batch Editing section
    await page.click('text=ویرایش دسته‌ای');
    await expect(page.locator('text=ویرایش دسته‌ای')).toHaveClass(/bg-blue-100/);
    await expect(page.locator('text=برای ویرایش دسته‌ای، ابتدا محصولات مورد نظر را انتخاب کنید')).toBeVisible();
    
    // Click on Templates section
    await page.click('text=استفاده از الگوها');
    await expect(page.locator('text=استفاده از الگوها')).toHaveClass(/bg-blue-100/);
    await expect(page.locator('text=الگوها به شما کمک می‌کنند تا داده‌های یک محصول را')).toBeVisible();
  });

  test('should display FAQ section', async ({ page }) => {
    await page.goto('/fa/help');
    
    // Click on FAQ section
    await page.click('text=سوالات متداول');
    
    // Check FAQ content
    await expect(page.locator('h2')).toContainText('سوالات متداول');
    
    // Check FAQ items
    await expect(page.locator('text=چند محصول می‌توانم مدیریت کنم؟')).toBeVisible();
    await expect(page.locator('text=محدودیتی برای تعداد محصولات وجود ندارد')).toBeVisible();
    
    await expect(page.locator('text=آیا تغییرات مستقیماً در باسلام اعمال می‌شود؟')).toBeVisible();
    await expect(page.locator('text=بله، تمام تغییرات مستقیماً از طریق API باسلام اعمال می‌شود')).toBeVisible();
    
    await expect(page.locator('text=چقدر طول می‌کشد تا ویرایش دسته‌ای انجام شود؟')).toBeVisible();
    await expect(page.locator('text=بسته به تعداد محصولات، ممکن است چند دقیقه تا چند ساعت طول بکشد')).toBeVisible();
  });

  test('should display contact support section', async ({ page }) => {
    await page.goto('/fa/help');
    
    // Check contact support section
    await expect(page.locator('text=تماس با پشتیبانی')).toBeVisible();
    await expect(page.locator('text=اگر سوال یا مشکلی دارید که در این راهنما پوشش داده نشده')).toBeVisible();
    
    // Check contact options
    await expect(page.locator('text=ارسال ایمیل')).toBeVisible();
    await expect(page.locator('text=تماس تلفنی')).toBeVisible();
    
    // Check contact links
    await expect(page.locator('a[href="mailto:support@example.com"]')).toBeVisible();
    await expect(page.locator('a[href="tel:+989123456789"]')).toBeVisible();
  });

  test('should be accessible from dashboard navigation', async ({ page }) => {
    await page.goto('/fa/dashboard');
    
    // Check help link in navigation
    await expect(page.locator('text=راهنما')).toBeVisible();
    
    // Click help link
    await page.click('text=راهنما');
    
    // Should navigate to help page
    await expect(page).toHaveURL(/.*\/fa\/help/);
    await expect(page.locator('h1')).toContainText('راهنما');
  });

  test('should support responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/fa/help');
    
    // Check mobile layout
    await expect(page.locator('.lg\\:col-span-1')).not.toBeVisible(); // Sidebar should be hidden on mobile
    
    // Check content is still accessible
    await expect(page.locator('h1')).toContainText('راهنما');
    await expect(page.locator('text=شروع کار')).toBeVisible();
  });

  test('should support language switching in help', async ({ page }) => {
    await page.goto('/fa/help');
    
    // Check Persian content
    await expect(page.locator('text=راهنما')).toBeVisible();
    await expect(page.locator('text=شروع کار')).toBeVisible();
    
    // Switch to English
    await page.click('text=English');
    
    // Should navigate to English help page
    await expect(page).toHaveURL(/.*\/en\/help/);
    await expect(page.locator('text=Help')).toBeVisible();
    await expect(page.locator('text=Getting Started')).toBeVisible();
  });

  test('should handle help content search', async ({ page }) => {
    await page.goto('/fa/help');
    
    // If search functionality exists, test it
    const searchInput = page.locator('input[placeholder*="جستجو"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('محصول');
      
      // Should highlight relevant sections
      await expect(page.locator('text=مدیریت محصولات')).toBeVisible();
    }
  });

  test('should provide contextual help tooltips', async ({ page }) => {
    await page.goto('/fa/dashboard/products');
    
    // Check if help tooltips are available
    const helpIcon = page.locator('.info-tooltip').first();
    if (await helpIcon.isVisible()) {
      await helpIcon.hover();
      
      // Check tooltip appears with helpful information
      await expect(page.locator('.tooltip')).toBeVisible();
      await expect(page.locator('.tooltip')).toContainText(/می‌توانید|برای|استفاده/);
    }
  });
});