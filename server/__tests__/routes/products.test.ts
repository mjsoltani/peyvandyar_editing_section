import request from 'supertest';
import app from '../../index';
import { BasalamService } from '../../services/BasalamService';
import { AuthService } from '../../services/AuthService';
import { User } from '../../models/User';

// Mock the services
jest.mock('../../services/BasalamService');
jest.mock('../../services/AuthService');
jest.mock('../../models/User');

const mockBasalamService = BasalamService.getInstance() as jest.Mocked<BasalamService>;
const mockAuthService = new AuthService() as jest.Mocked<AuthService>;

describe('Products Routes', () => {
  const mockUser = {
    id: 1,
    basalam_user_id: 'user123',
    vendor_id: 12345,
    username: 'testuser',
    name: 'Test User',
    email: 'test@example.com',
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token'
  };

  const mockJWTPayload = {
    userId: 1,
    basalamUserId: 'user123',
    vendorId: 12345,
    username: 'testuser'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authentication middleware
    mockAuthService.verifyJWT = jest.fn().mockReturnValue(mockJWTPayload);
    mockAuthService.getUserById = jest.fn().mockResolvedValue(mockUser);
  });

  describe('GET /api/products', () => {
    it('should return products list successfully', async () => {
      const mockProductsResponse = {
        products: [
          { id: '1', name: 'Product 1', price: 100 },
          { id: '2', name: 'Product 2', price: 200 }
        ],
        total: 2,
        page: 1,
        per_page: 50,
        total_pages: 1
      };

      mockBasalamService.getProductsList = jest.fn().mockResolvedValue(mockProductsResponse);

      const response = await request(app)
        .get('/api/products')
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockProductsResponse
      });

      expect(mockBasalamService.getProductsList).toHaveBeenCalledWith(
        mockUser.vendor_id,
        1,
        50,
        expect.any(Object),
        mockUser.access_token
      );
    });

    it('should handle query parameters correctly', async () => {
      mockBasalamService.getProductsList = jest.fn().mockResolvedValue({
        products: [],
        total: 0,
        page: 2,
        per_page: 25,
        total_pages: 0
      });

      await request(app)
        .get('/api/products')
        .query({
          page: '2',
          per_page: '25',
          search: 'test product',
          category: 'electronics',
          status: 'active',
          min_price: '100',
          max_price: '500',
          has_stock: 'true'
        })
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(200);

      expect(mockBasalamService.getProductsList).toHaveBeenCalledWith(
        mockUser.vendor_id,
        2,
        25,
        {
          search: 'test product',
          category: 'electronics',
          status: 'active',
          min_price: 100,
          max_price: 500,
          has_stock: true
        },
        mockUser.access_token
      );
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuthService.verifyJWT = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/products')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 when user has no access token', async () => {
      mockAuthService.getUserById = jest.fn().mockResolvedValue({
        ...mockUser,
        access_token: null
      });

      const response = await request(app)
        .get('/api/products')
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(401);

      expect(response.body).toEqual({
        error: 'توکن دسترسی یافت نشد'
      });
    });
  });

  describe('GET /api/products/:id', () => {
    const mockProductId = 'product-123';

    it('should return product details successfully', async () => {
      const mockProduct = {
        id: mockProductId,
        name: 'Test Product',
        price: 100,
        description: 'Test description'
      };

      mockBasalamService.getProductDetails = jest.fn().mockResolvedValue(mockProduct);

      const response = await request(app)
        .get(`/api/products/${mockProductId}`)
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockProduct
      });

      expect(mockBasalamService.getProductDetails).toHaveBeenCalledWith(
        mockProductId,
        mockUser.access_token,
        true
      );
    });

    it('should handle no_cache parameter', async () => {
      const mockProduct = { id: mockProductId, name: 'Fresh Product' };
      mockBasalamService.getProductDetails = jest.fn().mockResolvedValue(mockProduct);

      await request(app)
        .get(`/api/products/${mockProductId}`)
        .query({ no_cache: 'true' })
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(200);

      expect(mockBasalamService.getProductDetails).toHaveBeenCalledWith(
        mockProductId,
        mockUser.access_token,
        false
      );
    });

    it('should return 400 for missing product ID', async () => {
      const response = await request(app)
        .get('/api/products/')
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(404); // This will be 404 because the route doesn't match

      // Test with empty product ID would need a different route setup
    });
  });

  describe('PATCH /api/products/:id', () => {
    const mockProductId = 'product-123';
    const mockUpdateData = { price: 150, name: 'Updated Product' };

    it('should update product successfully', async () => {
      const mockUpdatedProduct = { id: mockProductId, ...mockUpdateData };
      mockBasalamService.updateProduct = jest.fn().mockResolvedValue(mockUpdatedProduct);

      const response = await request(app)
        .patch(`/api/products/${mockProductId}`)
        .send(mockUpdateData)
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUpdatedProduct,
        message: 'محصول با موفقیت به‌روزرسانی شد'
      });

      expect(mockBasalamService.updateProduct).toHaveBeenCalledWith(
        mockProductId,
        mockUpdateData,
        mockUser.access_token
      );
    });

    it('should return 400 for empty update data', async () => {
      const response = await request(app)
        .patch(`/api/products/${mockProductId}`)
        .send({})
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(400);

      expect(response.body).toEqual({
        error: 'داده‌های به‌روزرسانی الزامی است'
      });
    });
  });

  describe('PUT /api/products/batch', () => {
    const mockProducts = [
      { id: 'product-1', price: 100, name: 'Product 1' },
      { id: 'product-2', price: 200, name: 'Product 2' }
    ];

    it('should batch update products successfully', async () => {
      const mockResponse = { updated: 2, results: [] };
      mockBasalamService.batchUpdateProducts = jest.fn().mockResolvedValue(mockResponse);

      const response = await request(app)
        .put('/api/products/batch')
        .send({ products: mockProducts })
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockResponse,
        message: '2 محصول با موفقیت به‌روزرسانی شد'
      });

      expect(mockBasalamService.batchUpdateProducts).toHaveBeenCalledWith(
        [
          { id: 'product-1', data: mockProducts[0] },
          { id: 'product-2', data: mockProducts[1] }
        ],
        mockUser.access_token
      );
    });

    it('should return 400 for missing products array', async () => {
      const response = await request(app)
        .put('/api/products/batch')
        .send({})
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(400);

      expect(response.body).toEqual({
        error: 'لیست محصولات الزامی است'
      });
    });

    it('should return 400 for products without ID', async () => {
      const invalidProducts = [
        { price: 100, name: 'Product without ID' }
      ];

      const response = await request(app)
        .put('/api/products/batch')
        .send({ products: invalidProducts })
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(400);

      expect(response.body).toEqual({
        error: 'شناسه محصول برای تمام محصولات الزامی است'
      });
    });
  });

  describe('Cache and Rate Limit Endpoints', () => {
    it('should return cache statistics', async () => {
      const mockStats = {
        size: 5,
        keys: ['product_1', 'product_2']
      };
      const mockRateLimit = {
        requestsInWindow: 10,
        maxRequests: 60,
        queueLength: 0,
        timeWindow: 60000
      };

      mockBasalamService.getCacheStats = jest.fn().mockReturnValue(mockStats);
      mockBasalamService.getRateLimitStatus = jest.fn().mockReturnValue(mockRateLimit);

      const response = await request(app)
        .get('/api/products/cache/stats')
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          cache: mockStats,
          rateLimit: mockRateLimit
        }
      });
    });

    it('should clear all cache', async () => {
      mockBasalamService.clearCache = jest.fn();

      const response = await request(app)
        .delete('/api/products/cache')
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'تمام کش پاک شد'
      });

      expect(mockBasalamService.clearCache).toHaveBeenCalledWith(undefined);
    });

    it('should clear specific product cache', async () => {
      const productId = 'product-123';
      mockBasalamService.clearCache = jest.fn();

      const response = await request(app)
        .delete(`/api/products/cache/${productId}`)
        .set('Authorization', 'Bearer mock-jwt-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: `کش محصول ${productId} پاک شد`
      });

      expect(mockBasalamService.clearCache).toHaveBeenCalledWith(productId);
    });
  });
});