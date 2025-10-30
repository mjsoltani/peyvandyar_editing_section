'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for error in URL params
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
      const errorMessages: { [key: string]: string } = {
        oauth_error: 'خطا در احراز هویت باسلام',
        no_code: 'کد احراز هویت دریافت نشد',
        config_error: 'خطا در تنظیمات سیستم',
        token_exchange_failed: 'خطا در دریافت توکن دسترسی',
        user_info_failed: 'خطا در دریافت اطلاعات کاربر',
        callback_error: 'خطا در فرآیند احراز هویت'
      };
      
      setError(errorMessages[errorParam] || 'خطای نامشخص در احراز هویت');
    }
  }, []);

  const handleBasalamLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Redirect to Basalam OAuth
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://basalam-product-manager.onrender.com'
        : 'http://localhost:3000';
      window.location.href = `${baseUrl}/api/auth/basalam`;
    } catch (err) {
      setError('خطا در اتصال به باسلام');
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    // For demo purposes - simulate login with fake token
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      name: 'کاربر نمونه',
      email: 'demo@basalam.com',
      basalam_user_id: 'demo123',
      vendor: 'فروشگاه نمونه',
      vendor_id: '1',
      access_token: 'demo_token_for_testing_only'
    }));
    
    router.push('/fa/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8" dir="rtl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          ورود به سیستم
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          به سیستم مدیریت محصولات باسلام خوش آمدید
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                ورود با حساب باسلام
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                برای استفاده از سیستم، با حساب کاربری باسلام خود وارد شوید
              </p>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                onClick={handleBasalamLogin}
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                )}
                {loading ? 'در حال اتصال...' : 'ورود با باسلام'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">یا</span>
                </div>
              </div>

              <button
                type="button"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                onClick={handleDemoLogin}
              >
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                ورود سریع (Demo)
              </button>
            </div>

            <div className="text-center text-xs text-gray-500">
              با ورود به سیستم، شما با{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                شرایط استفاده
              </a>{' '}
              و{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                حریم خصوصی
              </a>{' '}
              موافقت می‌کنید.
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/fa" 
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← بازگشت به صفحه اصلی
          </a>
        </div>
      </div>
    </div>
  );
}