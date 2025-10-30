'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  name: string;
  email: string;
  basalam_user_id: string;
  vendor?: string;
  vendor_id?: string;
  access_token?: string;
}

interface ProductStats {
  total: number;
  active: number;
  inactive: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [productStats, setProductStats] = useState<ProductStats>({ total: 0, active: 0, inactive: 0 });
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    // Check URL params first (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const loginSuccess = urlParams.get('login');
    const userName = urlParams.get('user');
    const vendorName = urlParams.get('vendor');

    if (loginSuccess === 'success' && userName) {
      const vendorId = urlParams.get('vendor_id');
      const userId = urlParams.get('user_id');
      const accessToken = urlParams.get('access_token');
      
      // Create user object from URL params
      const userFromUrl = {
        id: parseInt(userId || '0') || Date.now(),
        name: decodeURIComponent(userName),
        email: `${userName.toLowerCase().replace(/\s+/g, '.')}@basalam.com`,
        basalam_user_id: userId || 'temp_id',
        vendor: vendorName ? decodeURIComponent(vendorName) : 'نامشخص',
        vendor_id: vendorId || '0',
        access_token: accessToken || ''
      };
      
      console.log('User created from URL:', { 
        hasToken: !!accessToken, 
        tokenLength: accessToken?.length,
        vendorId 
      });
      
      // Save to localStorage for future visits
      localStorage.setItem('user', JSON.stringify(userFromUrl));
      setUser(userFromUrl);
      
      // Clean URL (remove sensitive token from URL)
      window.history.replaceState({}, '', '/fa/dashboard');
    } else {
      // Check localStorage for existing user
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        router.push('/fa/auth/login');
        return;
      }
    }
    setLoading(false);
  }, [router]);

  // Load product stats after user is set
  useEffect(() => {
    if (user && user.vendor_id && user.vendor_id !== '0') {
      loadProductStats();
    }
  }, [user]);

  const loadProductStats = async () => {
    if (!user?.access_token || !user?.vendor_id) {
      console.log('Missing access_token or vendor_id:', { 
        hasToken: !!user?.access_token, 
        vendorId: user?.vendor_id 
      });
      return;
    }
    
    setLoadingStats(true);
    try {
      console.log('Loading products for vendor:', user.vendor_id);
      
      // Try to get products from Basalam API
      const response = await fetch(`/api/basalam/products?vendor_id=${user.vendor_id}&token=${user.access_token}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Products API response:', data);
        
        if (data.success && data.data) {
          const products = Array.isArray(data.data) ? data.data : data.data.data || [];
          const total = products.length;
          const active = products.filter((p: any) => p.status === 'active' || p.is_active).length;
          
          setProductStats({
            total,
            active,
            inactive: total - active
          });
          
          console.log('Product stats updated:', { total, active, inactive: total - active });
        } else {
          console.log('No products data in response:', data);
        }
      } else {
        const errorData = await response.json();
        console.error('Products API error:', errorData);
      }
    } catch (error) {
      console.error('Error loading product stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/fa');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">داشبورد مدیریت محصولات</h1>
              <p className="text-gray-600">خوش آمدید، {user.name}</p>
              {user.vendor && user.vendor !== 'نامشخص' && (
                <p className="text-sm text-blue-600">غرفه: {user.vendor}</p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">خوش آمدید به سیستم مدیریت محصولات باسلام</h2>
          <p className="text-gray-600 mb-4">
            از این داشبورد می‌توانید تمام محصولات خود را مدیریت کنید، ویرایش دسته‌جمعی انجام دهید و از الگوهای آماده استفاده کنید.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">
              ✅ شما با حساب <strong>{user.name}</strong> وارد شده‌اید.
              {user.vendor && user.vendor !== 'نامشخص' && (
                <span className="block mt-1">🏪 غرفه: <strong>{user.vendor}</strong></span>
              )}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">کل محصولات</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">محصولات فعال</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">الگوهای ذخیره شده</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Products Card */}
          <Link href="/fa/dashboard/products" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <div className="mr-4">
                  <h3 className="text-lg font-semibold text-gray-900">مدیریت محصولات</h3>
                  <p className="text-gray-600">مشاهده، ویرایش و مدیریت محصولات</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Templates Card */}
          <Link href="/fa/dashboard/templates" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="mr-4">
                  <h3 className="text-lg font-semibold text-gray-900">الگوهای محصول</h3>
                  <p className="text-gray-600">ایجاد و استفاده از الگوهای آماده</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Help Card */}
          <Link href="/fa/help" className="block">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="mr-4">
                  <h3 className="text-lg font-semibold text-gray-900">راهنما و پشتیبانی</h3>
                  <p className="text-gray-600">راهنمای استفاده و تماس با پشتیبانی</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">فعالیت‌های اخیر</h3>
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-2 text-gray-500">هنوز فعالیتی انجام نشده است</p>
            <p className="text-sm text-gray-400">با شروع کار با محصولات، فعالیت‌های شما اینجا نمایش داده می‌شود</p>
          </div>
        </div>
      </main>
    </div>
  );
}