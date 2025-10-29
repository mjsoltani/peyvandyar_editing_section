'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TemplatesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/fa/auth/login');
      return;
    }
    setLoading(false);
  }, [router]);

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
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <a href="/fa/dashboard" className="text-blue-600 hover:text-blue-800">
                ← داشبورد
              </a>
              <span className="text-gray-300">|</span>
              <span className="text-gray-900">الگوهای محصول</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">الگوهای محصول</h1>
          <p className="text-gray-600">مدیریت و ایجاد الگوهای محصول</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📋 الگوهای موجود</h2>
          <p className="text-gray-600 mb-6">
            الگوها به شما کمک می‌کنند تا اطلاعات یک محصول را به سرعت به محصولات دیگر کپی کنید.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-dashed border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">الگو جدید</h3>
              <p className="text-blue-700 text-sm mb-4">
                الگوی جدید ایجاد کنید
              </p>
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm">
                + ایجاد الگو
              </button>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">الگوی قیمت‌گذاری</h3>
              <p className="text-green-700 text-sm mb-2">
                شامل: قیمت، تخفیف، موجودی
              </p>
              <p className="text-xs text-green-600 mb-4">
                آخرین استفاده: 2 روز پیش
              </p>
              <div className="flex gap-2">
                <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">
                  استفاده
                </button>
                <button className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 text-sm">
                  ویرایش
                </button>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">الگوی توضیحات</h3>
              <p className="text-purple-700 text-sm mb-2">
                شامل: عنوان، توضیحات، کلمات کلیدی
              </p>
              <p className="text-xs text-purple-600 mb-4">
                آخرین استفاده: 1 هفته پیش
              </p>
              <div className="flex gap-2">
                <button className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 text-sm">
                  استفاده
                </button>
                <button className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 text-sm">
                  ویرایش
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">💡 نکته</h3>
            <p className="text-yellow-800 text-sm">
              برای استفاده از الگوها، ابتدا محصولات مورد نظر را در صفحه محصولات انتخاب کنید، 
              سپس از گزینه "اعمال الگو" استفاده کنید.
            </p>
          </div>
        </div>


      </div>
    </div>
  );
}