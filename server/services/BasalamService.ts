import { AuthService } from './AuthService';

// Rate limiting configuration
interface RateLimitConfig {
  maxRequests: number;
  timeWindow: number; // in milliseconds
  delay: number; // delay between requests in milliseconds
}

// Request queue item
interface QueuedRequest {
  url: string;
  options: RequestInit;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  timestamp: number;
}

// Product list filters
interface ProductFilters {
  search?: string;
  category?: string;
  status?: 'active' | 'inactive' | 'all';
  min_price?: number;
  max_price?: number;
  has_stock?: boolean;
}

// Product list response
interface ProductListResponse {
  products: any[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Basalam API Error
export class BasalamAPIError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'BasalamAPIError';
  }
}

export class BasalamService {
  private static instance: BasalamService;
  private baseURL = 'https://api.basalam.com';
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue = false;
  private requestHistory: number[] = [];
  
  // Rate limiting configuration
  private rateLimitConfig: RateLimitConfig = {
    maxRequests: 60, // 60 requests per minute
    timeWindow: 60000, // 1 minute
    delay: 1000 // 1 second delay between requests
  };

  // Product cache
  private productCache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): BasalamService {
    if (!BasalamService.instance) {
      BasalamService.instance = new BasalamService();
    }
    return BasalamService.instance;
  }

  /**
   * Make authenticated request to Basalam API with rate limiting
   */
  private async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    accessToken: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        url: `${this.baseURL}${endpoint}`,
        options: {
          ...options,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
          },
        },
        resolve,
        reject,
        timestamp: Date.now()
      };

      this.requestQueue.push(queuedRequest);
      this.processQueue();
    });
  }

  /**
   * Process request queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      // Check rate limit
      const now = Date.now();
      this.requestHistory = this.requestHistory.filter(
        timestamp => now - timestamp < this.rateLimitConfig.timeWindow
      );

      if (this.requestHistory.length >= this.rateLimitConfig.maxRequests) {
        // Wait until we can make another request
        const oldestRequest = Math.min(...this.requestHistory);
        const waitTime = this.rateLimitConfig.timeWindow - (now - oldestRequest);
        await this.delay(waitTime);
        continue;
      }

      const request = this.requestQueue.shift()!;
      
      try {
        // Add delay between requests
        if (this.requestHistory.length > 0) {
          await this.delay(this.rateLimitConfig.delay);
        }

        const response = await fetch(request.url, request.options);
        this.requestHistory.push(Date.now());

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = this.getErrorMessage(response.status);
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch {
            // Use default error message
          }

          throw new BasalamAPIError(response.status, errorMessage, errorText);
        }

        const data = await response.json();
        request.resolve(data);
      } catch (error) {
        request.reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Get user-friendly error message based on status code
   */
  private getErrorMessage(status: number): string {
    switch (status) {
      case 401:
        return 'توکن منقضی شده - نیاز به ورود مجدد';
      case 403:
        return 'دسترسی کافی ندارید';
      case 404:
        return 'منبع مورد نظر یافت نشد';
      case 429:
        return 'تعداد درخواست‌ها زیاد است - لطفاً صبر کنید';
      case 500:
        return 'خطای سرور باسلام';
      case 502:
      case 503:
      case 504:
        return 'سرور باسلام در دسترس نیست';
      default:
        return 'خطای ناشناخته در ارتباط با باسلام';
    }
  }

  /**
   * Delay utility function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get products list from Basalam API
   */
  async getProductsList(
    vendorId: number,
    page: number = 1,
    perPage: number = 50,
    filters: ProductFilters = {},
    accessToken: string
  ): Promise<ProductListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    // Add filters to params
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.category) {
      params.append('category', filters.category);
    }
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters.min_price) {
      params.append('min_price', filters.min_price.toString());
    }
    if (filters.max_price) {
      params.append('max_price', filters.max_price.toString());
    }
    if (filters.has_stock !== undefined) {
      params.append('has_stock', filters.has_stock.toString());
    }

    const endpoint = `/api_v2/product/list?${params.toString()}`;
    
    try {
      const response = await this.makeRequest(endpoint, { method: 'GET' }, accessToken);
      
      return {
        products: response.data || response.products || [],
        total: response.total || 0,
        page: response.page || page,
        per_page: response.per_page || perPage,
        total_pages: response.total_pages || Math.ceil((response.total || 0) / perPage)
      };
    } catch (error) {
      if (error instanceof BasalamAPIError) {
        throw error;
      }
      throw new BasalamAPIError(500, 'خطا در دریافت لیست محصولات', error);
    }
  }

  /**
   * Get single product details with caching
   */
  async getProductDetails(
    productId: string,
    accessToken: string,
    useCache: boolean = true
  ): Promise<any> {
    const cacheKey = `product_${productId}`;
    
    // Check cache first
    if (useCache && this.productCache.has(cacheKey)) {
      const cached = this.productCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      // Remove expired cache
      this.productCache.delete(cacheKey);
    }

    const endpoint = `/v4/products/${productId}`;
    
    try {
      const response = await this.makeRequest(endpoint, { method: 'GET' }, accessToken);
      const productData = response.data || response;
      
      // Cache the result
      if (useCache) {
        this.productCache.set(cacheKey, {
          data: productData,
          timestamp: Date.now()
        });
      }
      
      return productData;
    } catch (error) {
      if (error instanceof BasalamAPIError) {
        throw error;
      }
      throw new BasalamAPIError(500, 'خطا در دریافت جزئیات محصول', error);
    }
  }

  /**
   * Update single product
   */
  async updateProduct(
    productId: string,
    updateData: any,
    accessToken: string,
    retryCount: number = 3
  ): Promise<any> {
    const endpoint = `/v4/products/${productId}`;
    
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const response = await this.makeRequest(
          endpoint,
          {
            method: 'PATCH',
            body: JSON.stringify(updateData)
          },
          accessToken
        );
        
        // Clear cache for this product
        const cacheKey = `product_${productId}`;
        this.productCache.delete(cacheKey);
        
        return response.data || response;
      } catch (error) {
        if (error instanceof BasalamAPIError) {
          // Don't retry on client errors (4xx)
          if (error.status >= 400 && error.status < 500) {
            throw error;
          }
          
          // Retry on server errors (5xx) or network errors
          if (attempt === retryCount) {
            throw error;
          }
          
          // Wait before retry (exponential backoff)
          await this.delay(Math.pow(2, attempt) * 1000);
        } else {
          throw new BasalamAPIError(500, 'خطا در به‌روزرسانی محصول', error);
        }
      }
    }
  }

  /**
   * Batch update products
   */
  async batchUpdateProducts(
    updates: Array<{ id: string; data: any }>,
    accessToken: string,
    retryCount: number = 3
  ): Promise<any> {
    const endpoint = '/api_v2/product/batch';
    
    // Prepare batch update data
    const batchData = {
      products: updates.map(update => ({
        id: update.id,
        ...update.data
      }))
    };
    
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const response = await this.makeRequest(
          endpoint,
          {
            method: 'PUT',
            body: JSON.stringify(batchData)
          },
          accessToken
        );
        
        // Clear cache for updated products
        updates.forEach(update => {
          const cacheKey = `product_${update.id}`;
          this.productCache.delete(cacheKey);
        });
        
        return response.data || response;
      } catch (error) {
        if (error instanceof BasalamAPIError) {
          // Don't retry on client errors (4xx)
          if (error.status >= 400 && error.status < 500) {
            throw error;
          }
          
          // Retry on server errors (5xx) or network errors
          if (attempt === retryCount) {
            throw error;
          }
          
          // Wait before retry (exponential backoff)
          await this.delay(Math.pow(2, attempt) * 1000);
        } else {
          throw new BasalamAPIError(500, 'خطا در به‌روزرسانی دسته‌ای محصولات', error);
        }
      }
    }
  }

  /**
   * Clear product cache
   */
  clearCache(productId?: string): void {
    if (productId) {
      const cacheKey = `product_${productId}`;
      this.productCache.delete(cacheKey);
    } else {
      this.productCache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.productCache.size,
      keys: Array.from(this.productCache.keys())
    };
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(): { 
    requestsInWindow: number; 
    maxRequests: number; 
    queueLength: number;
    timeWindow: number;
  } {
    const now = Date.now();
    const requestsInWindow = this.requestHistory.filter(
      timestamp => now - timestamp < this.rateLimitConfig.timeWindow
    ).length;

    return {
      requestsInWindow,
      maxRequests: this.rateLimitConfig.maxRequests,
      queueLength: this.requestQueue.length,
      timeWindow: this.rateLimitConfig.timeWindow
    };
  }
}