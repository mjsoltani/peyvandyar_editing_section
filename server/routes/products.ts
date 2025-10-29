import express from 'express';
import { BasalamService, BasalamAPIError } from '../services/BasalamService';
import { AuthService } from '../services/AuthService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const basalamService = BasalamService.getInstance();
const authService = new AuthService();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get products list
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده' });
    }

    // Get user's access token
    const user = await authService.getUserById(userId);
    if (!user || !user.access_token) {
      return res.status(401).json({ error: 'توکن دسترسی یافت نشد' });
    }

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.per_page as string) || 50, 100);
    
    const filters = {
      search: req.query.search as string,
      category: req.query.category as string,
      status: req.query.status as 'active' | 'inactive' | 'all',
      min_price: req.query.min_price ? parseFloat(req.query.min_price as string) : undefined,
      max_price: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
      has_stock: req.query.has_stock ? req.query.has_stock === 'true' : undefined,
    };

    const result = await basalamService.getProductsList(
      user.vendor_id,
      page,
      perPage,
      filters,
      user.access_token
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching products list:', error);
    
    if (error instanceof BasalamAPIError) {
      return res.status(error.status === 401 ? 401 : 400).json({
        error: error.message,
        details: error.details
      });
    }
    
    res.status(500).json({
      error: 'خطا در دریافت لیست محصولات'
    });
  }
});

// Get single product details
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده' });
    }

    const productId = req.params.id;
    if (!productId) {
      return res.status(400).json({ error: 'شناسه محصول الزامی است' });
    }

    // Get user's access token
    const user = await authService.getUserById(userId);
    if (!user || !user.access_token) {
      return res.status(401).json({ error: 'توکن دسترسی یافت نشد' });
    }

    const useCache = req.query.no_cache !== 'true';
    const product = await basalamService.getProductDetails(
      productId,
      user.access_token,
      useCache
    );

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    
    if (error instanceof BasalamAPIError) {
      return res.status(error.status === 401 ? 401 : 400).json({
        error: error.message,
        details: error.details
      });
    }
    
    res.status(500).json({
      error: 'خطا در دریافت جزئیات محصول'
    });
  }
});

// Update single product
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده' });
    }

    const productId = req.params.id;
    if (!productId) {
      return res.status(400).json({ error: 'شناسه محصول الزامی است' });
    }

    const updateData = req.body;
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'داده‌های به‌روزرسانی الزامی است' });
    }

    // Get user's access token
    const user = await authService.getUserById(userId);
    if (!user || !user.access_token) {
      return res.status(401).json({ error: 'توکن دسترسی یافت نشد' });
    }

    const result = await basalamService.updateProduct(
      productId,
      updateData,
      user.access_token
    );

    res.json({
      success: true,
      data: result,
      message: 'محصول با موفقیت به‌روزرسانی شد'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error instanceof BasalamAPIError) {
      return res.status(error.status === 401 ? 401 : 400).json({
        error: error.message,
        details: error.details
      });
    }
    
    res.status(500).json({
      error: 'خطا در به‌روزرسانی محصول'
    });
  }
});

// Batch update products
router.put('/batch', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'کاربر احراز هویت نشده' });
    }

    const { products } = req.body;
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'لیست محصولات الزامی است' });
    }

    // Validate products data
    for (const product of products) {
      if (!product.id) {
        return res.status(400).json({ error: 'شناسه محصول برای تمام محصولات الزامی است' });
      }
    }

    // Get user's access token
    const user = await authService.getUserById(userId);
    if (!user || !user.access_token) {
      return res.status(401).json({ error: 'توکن دسترسی یافت نشد' });
    }

    // Prepare updates array
    const updates = products.map((product: any) => ({
      id: product.id,
      data: { ...product }
    }));

    const result = await basalamService.batchUpdateProducts(
      updates,
      user.access_token
    );

    res.json({
      success: true,
      data: result,
      message: `${products.length} محصول با موفقیت به‌روزرسانی شد`
    });
  } catch (error) {
    console.error('Error batch updating products:', error);
    
    if (error instanceof BasalamAPIError) {
      return res.status(error.status === 401 ? 401 : 400).json({
        error: error.message,
        details: error.details
      });
    }
    
    res.status(500).json({
      error: 'خطا در به‌روزرسانی دسته‌ای محصولات'
    });
  }
});

// Get cache statistics (for debugging)
router.get('/cache/stats', (req, res) => {
  const stats = basalamService.getCacheStats();
  const rateLimitStatus = basalamService.getRateLimitStatus();
  
  res.json({
    success: true,
    data: {
      cache: stats,
      rateLimit: rateLimitStatus
    }
  });
});

// Clear all cache
router.delete('/cache', (req, res) => {
  basalamService.clearCache();
  
  res.json({
    success: true,
    message: 'تمام کش پاک شد'
  });
});

// Clear specific product cache
router.delete('/cache/:productId', (req, res) => {
  const productId = req.params.productId;
  basalamService.clearCache(productId);
  
  res.json({
    success: true,
    message: `کش محصول ${productId} پاک شد`
  });
});

export default router;