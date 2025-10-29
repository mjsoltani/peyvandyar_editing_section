export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">راهنما</h1>
          <p className="text-gray-600">راهنمای کامل استفاده از سیستم مدیریت محصولات باسلام</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Getting Started */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🚀 شروع کار</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• ابتدا از طریق حساب کاربری باسلام وارد شوید</li>
              <li>• محصولات خود را مشاهده و مدیریت کنید</li>
              <li>• برای استفاده کامل، اشتراک تهیه کنید</li>
            </ul>
          </div>

          {/* Product Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📦 مدیریت محصولات</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• مشاهده تمام محصولات در یک صفحه</li>
              <li>• جستجو و فیلتر محصولات</li>
              <li>• ویرایش سریع اطلاعات محصول</li>
              <li>• تغییرات مستقیم در باسلام</li>
            </ul>
          </div>

          {/* Batch Editing */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ ویرایش دسته‌ای</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• انتخاب چندین محصول همزمان</li>
              <li>• ویرایش فیلدهای مشترک</li>
              <li>• صرفه‌جویی در زمان</li>
              <li>• قابلیت توقف عملیات</li>
            </ul>
          </div>

          {/* Templates */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📋 الگوها</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• کپی اطلاعات بین محصولات</li>
              <li>• ذخیره الگوهای پرکاربرد</li>
              <li>• شامل قیمت، تنوع و موجودی</li>
              <li>• تسریع فرآیند ویرایش</li>
            </ul>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">❓ سوالات متداول</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">چند محصول می‌توانم مدیریت کنم؟</h3>
              <p className="text-gray-600">محدودیتی برای تعداد محصولات وجود ندارد.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">آیا تغییرات مستقیماً اعمال می‌شود؟</h3>
              <p className="text-gray-600">بله، تمام تغییرات مستقیماً از طریق API باسلام اعمال می‌شود.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">چقدر طول می‌کشد ویرایش دسته‌ای؟</h3>
              <p className="text-gray-600">بسته به تعداد محصولات، چند دقیقه تا چند ساعت.</p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">📞 پشتیبانی</h3>
          <p className="text-blue-700 mb-4">
            برای سوالات بیشتر با تیم پشتیبانی تماس بگیرید.
          </p>
          <div className="flex gap-4">
            <a href="mailto:support@example.com" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              ارسال ایمیل
            </a>
            <a href="tel:+989123456789" className="border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50">
              تماس تلفنی
            </a>
          </div>
        </div>

        <div className="mt-6">
          <a 
            href="/fa" 
            className="text-blue-600 hover:text-blue-800"
          >
            ← بازگشت به صفحه اصلی
          </a>
        </div>
      </div>
    </div>
  );
}