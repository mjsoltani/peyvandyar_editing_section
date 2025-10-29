import { BasalamService, BasalamAPIError } from '../../services/BasalamService';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('BasalamService', () => {
  let basalamService: BasalamService;
  const mockAccessToken = 'mock-access-token';
  const mockVendorId = 12345;

  beforeEach(() => {
    basalamService = BasalamService.getInstance();
    basalamService.clearCache();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProductsList', () => {
    it('should fetch products list successfully', async () => {
      const mockResponse = {
        data: [
          { id: '1', name: 'Product 1', price: 100 },
          { id: '2', name: 'Product 2', price: 200 }
        ],
        total: 2,
        page: 1,
        per_page: 50,
        total_pages: 1
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await basalamService.getProductsList(
        mockVendorId,
        1,
        50,
        {},
        mockAccessToken
      );

      expect(result).toEqual({
        products: mockResponse.data,
        total: 2,
        page: 1,
        per_page: 50,
        total_pages: 1
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api_v2/product/list'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          })
        })
      );
    });

    it('should apply filters correctly', async () => {
      const mockResponse = { data: [], total: 0, page: 1, per_page: 50, total_pages: 0 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const filters = {
        search: 'test product',
        category: 'electronics',
        status: 'active' as const,
        min_price: 100,
        max_price: 500,
        has_stock: true
      };

      await basalamService.getProductsList(
        mockVendorId,
        1,
        50,
        filters,
        mockAccessToken
      );

      const calledUrl = (mockFetch.mock.calls[0][0] as string);
      expect(calledUrl).toContain('search=test+product');
      expect(calledUrl).toContain('category=electronics');
      expect(calledUrl).toContain('status=active');
      expect(calledUrl).toContain('min_price=100');
      expect(calledUrl).toContain('max_price=500');
      expect(calledUrl).toContain('has_stock=true');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      } as Response);

      await expect(
        basalamService.getProductsList(mockVendorId, 1, 50, {}, mockAccessToken)
      ).rejects.toThrow(BasalamAPIError);
    });
  });

  describe('getProductDetails', () => {
    const mockProductId = 'product-123';

    it('should fetch product details successfully', async () => {
      const mockProduct = {
        id: mockProductId,
        name: 'Test Product',
        price: 100,
        description: 'Test description'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockProduct }),
      } as Response);

      const result = await basalamService.getProductDetails(
        mockProductId,
        mockAccessToken
      );

      expect(result).toEqual(mockProduct);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/v4/products/${mockProductId}`),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`
          })
        })
      );
    });

    it('should use cache when available', async () => {
      const mockProduct = { id: mockProductId, name: 'Cached Product' };
      
      // First call - should fetch from API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockProduct }),
      } as Response);

      const result1 = await basalamService.getProductDetails(
        mockProductId,
        mockAccessToken
      );

      // Second call - should use cache
      const result2 = await basalamService.getProductDetails(
        mockProductId,
        mockAccessToken
      );

      expect(result1).toEqual(mockProduct);
      expect(result2).toEqual(mockProduct);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should bypass cache when requested', async () => {
      const mockProduct = { id: mockProductId, name: 'Fresh Product' };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockProduct }),
      } as Response);

      // First call with cache
      await basalamService.getProductDetails(mockProductId, mockAccessToken, true);
      
      // Second call without cache
      await basalamService.getProductDetails(mockProductId, mockAccessToken, false);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateProduct', () => {
    const mockProductId = 'product-123';
    const mockUpdateData = { price: 150, name: 'Updated Product' };

    it('should update product successfully', async () => {
      const mockResponse = { id: mockProductId, ...mockUpdateData };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockResponse }),
      } as Response);

      const result = await basalamService.updateProduct(
        mockProductId,
        mockUpdateData,
        mockAccessToken
      );

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/v4/products/${mockProductId}`),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(mockUpdateData),
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should retry on server errors', async () => {
      // First call fails with 500
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      } as Response);

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: mockProductId } }),
      } as Response);

      const result = await basalamService.updateProduct(
        mockProductId,
        mockUpdateData,
        mockAccessToken,
        2 // retryCount
      );

      expect(result).toEqual({ id: mockProductId });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on client errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      } as Response);

      await expect(
        basalamService.updateProduct(mockProductId, mockUpdateData, mockAccessToken)
      ).rejects.toThrow(BasalamAPIError);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('batchUpdateProducts', () => {
    const mockUpdates = [
      { id: 'product-1', data: { price: 100 } },
      { id: 'product-2', data: { price: 200 } }
    ];

    it('should batch update products successfully', async () => {
      const mockResponse = { updated: 2, results: [] };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockResponse }),
      } as Response);

      const result = await basalamService.batchUpdateProducts(
        mockUpdates,
        mockAccessToken
      );

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api_v2/product/batch'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            products: [
              { id: 'product-1', price: 100 },
              { id: 'product-2', price: 200 }
            ]
          }),
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      // Mock multiple successful responses
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

      // Make a single request to test rate limiting setup
      await basalamService.getProductsList(mockVendorId, 1, 50, {}, mockAccessToken);

      // Should have made the request
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should provide rate limit status', () => {
      const status = basalamService.getRateLimitStatus();
      
      expect(status).toHaveProperty('requestsInWindow');
      expect(status).toHaveProperty('maxRequests');
      expect(status).toHaveProperty('queueLength');
      expect(status).toHaveProperty('timeWindow');
      expect(typeof status.requestsInWindow).toBe('number');
      expect(typeof status.maxRequests).toBe('number');
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', () => {
      const stats = basalamService.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(Array.isArray(stats.keys)).toBe(true);
    });

    it('should clear cache correctly', async () => {
      const mockProduct = { id: 'test-product', name: 'Test' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockProduct }),
      } as Response);

      // Cache a product
      await basalamService.getProductDetails('test-product', mockAccessToken);
      
      let stats = basalamService.getCacheStats();
      expect(stats.size).toBe(1);

      // Clear specific product cache
      basalamService.clearCache('test-product');
      
      stats = basalamService.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        basalamService.getProductsList(mockVendorId, 1, 50, {}, mockAccessToken)
      ).rejects.toThrow('خطا در دریافت لیست محصولات');
    });

    it('should handle different HTTP status codes', async () => {
      const testCases = [
        { status: 401, expectedMessage: 'توکن منقضی شده - نیاز به ورود مجدد' },
        { status: 403, expectedMessage: 'دسترسی کافی ندارید' },
        { status: 404, expectedMessage: 'منبع مورد نظر یافت نشد' },
        { status: 429, expectedMessage: 'تعداد درخواست‌ها زیاد است - لطفاً صبر کنید' },
        { status: 500, expectedMessage: 'خطای سرور باسلام' },
        { status: 502, expectedMessage: 'سرور باسلام در دسترس نیست' }
      ];

      for (const testCase of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: testCase.status,
          text: async () => 'Error',
        } as Response);

        await expect(
          basalamService.getProductsList(mockVendorId, 1, 50, {}, mockAccessToken)
        ).rejects.toThrow(testCase.expectedMessage);
      }
    });
  });
});