import Link from 'next/link';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 persian-text" dir="rtl">
      {/* Header */}
      <header className="relative overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-black opacity-20"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white opacity-5 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-yellow-300 opacity-10 rounded-full animate-bounce"></div>
          <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-blue-300 opacity-8 rounded-full animate-pulse"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32 z-10">
          <div className="text-center">
            {/* Logo/Icon */}
            <div className="mb-12">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl shadow-2xl mb-8 border border-white/20">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
              <span className="block">مدیریت</span>
              <span className="block gradient-text bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent">
                هوشمند
              </span>
              <span className="block text-4xl md:text-5xl mt-4 font-warm">محصولات باسلام</span>
            </h1>
            
            <p className="font-body text-xl md:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
              سیستم پیشرفته و کاربرپسند برای مدیریت محصولات، ویرایش دسته‌جمعی و بهینه‌سازی فروش در باسلام
              <br />
              <span className="text-yellow-200 font-medium">با رابط کاربری مدرن و امکانات حرفه‌ای</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link 
                href={`/${locale}/auth/login`}
                className="group bg-gradient-to-r from-white to-gray-100 text-gray-900 px-10 py-5 rounded-2xl font-bold text-lg hover:from-yellow-300 hover:to-orange-300 transition-all duration-500 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 hover:scale-105 border-2 border-white/20"
              >
                <span className="flex items-center gap-3">
                  🚀 شروع کنید
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </span>
              </Link>
              <Link 
                href={`/${locale}/help`}
                className="group border-3 border-white/30 backdrop-blur-sm bg-white/10 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white hover:text-gray-900 transition-all duration-500 shadow-xl"
              >
                <span className="flex items-center gap-3">
                  📖 راهنمای کامل
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </span>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-3xl font-black text-yellow-300 mb-2">۱۰۰۰+</div>
                <div className="text-white/80 font-body">محصول مدیریت شده</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-3xl font-black text-green-300 mb-2">۹۸٪</div>
                <div className="text-white/80 font-body">رضایت کاربران</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-3xl font-black text-blue-300 mb-2">۲۴/۷</div>
                <div className="text-white/80 font-body">پشتیبانی آنلاین</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold mb-6">
              ✨ امکانات ویژه
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              قدرت مدیریت در
              <span className="gradient-text bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> دستان شما</span>
            </h2>
            <p className="font-body text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              تمام ابزارهای مورد نیاز برای مدیریت حرفه‌ای محصولات باسلام در یک پلتفرم یکپارچه و هوشمند
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-blue-300 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-bold text-gray-900 mb-4">مدیریت محصولات</h3>
                <p className="font-body text-gray-600 leading-relaxed">
                  مشاهده، ویرایش و مدیریت کامل محصولات با رابط کاربری ساده و قدرتمند
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-green-300 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1v-1a2 2 0 114 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-bold text-gray-900 mb-4">ویرایش دسته‌جمعی</h3>
                <p className="font-body text-gray-600 leading-relaxed">
                  ویرایش همزمان صدها محصول با یک کلیک و صرفه‌جویی در زمان
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-purple-300 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-bold text-gray-900 mb-4">الگوهای هوشمند</h3>
                <p className="font-body text-gray-600 leading-relaxed">
                  استفاده از الگوهای آماده برای تسریع فرآیند ایجاد و ویرایش محصولات
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-orange-300 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-bold text-gray-900 mb-4">گزارش‌گیری پیشرفته</h3>
                <p className="font-body text-gray-600 leading-relaxed">
                  آمار و گزارش‌های تفصیلی از عملکرد محصولات و فروش
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-rose-300 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-bold text-gray-900 mb-4">مدیریت قیمت</h3>
                <p className="font-body text-gray-600 leading-relaxed">
                  تنظیم قیمت، تخفیف و مدیریت موجودی به صورت هوشمند
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-indigo-300 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-bold text-gray-900 mb-4">پشتیبانی ۲۴/۷</h3>
                <p className="font-body text-gray-600 leading-relaxed">
                  راهنمای کامل و پشتیبانی فنی در تمام ساعات شبانه‌روز
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto text-center px-4">
          <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-6 py-2 rounded-full text-sm font-bold mb-8">
            🚀 شروع رایگان
          </div>
          
          <h2 className="font-display text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
            آماده شروع
            <span className="gradient-text bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent"> انقلاب</span>
            <br />
            در مدیریت محصولات هستید؟
          </h2>
          
          <p className="font-body text-xl md:text-2xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
            همین حالا وارد سیستم شوید و تجربه مدیریت حرفه‌ای محصولات را آغاز کنید
            <br />
            <span className="text-yellow-300 font-medium">بدون هیچ هزینه‌ای و در کمتر از ۳۰ ثانیه</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              href={`/${locale}/auth/login`}
              className="group bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-12 py-5 rounded-2xl font-black text-xl hover:from-yellow-300 hover:to-orange-400 transition-all duration-500 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 hover:scale-105"
            >
              <span className="flex items-center gap-3">
                🎯 شروع رایگان
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
              </span>
            </Link>
            
            <Link 
              href={`/${locale}/help`}
              className="group border-2 border-white/30 backdrop-blur-sm bg-white/10 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white hover:text-gray-900 transition-all duration-500"
            >
              <span className="flex items-center gap-3">
                📞 تماس با ما
                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
            </Link>
          </div>
          
          <div className="mt-12 text-gray-400 text-sm">
            ✅ بدون نیاز به کارت اعتباری  •  ✅ پشتیبانی ۲۴/۷  •  ✅ راه‌اندازی فوری
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-50 to-white py-16 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-bold text-gray-900">باسلام منیجر</h3>
              </div>
              <p className="font-body text-gray-600 leading-relaxed mb-6 max-w-md">
                ابزار پیشرفته و کاربرپسند برای مدیریت محصولات در فروشگاه باسلام. 
                با امکانات حرفه‌ای و رابط کاربری مدرن.
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors cursor-pointer">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors cursor-pointer">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.106"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-display font-bold text-gray-900 mb-6">دسترسی سریع</h4>
              <ul className="space-y-3">
                <li><Link href={`/${locale}/auth/login`} className="font-body text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2">
                  <span>🔐</span> ورود به سیستم
                </Link></li>
                <li><Link href={`/${locale}/help`} className="font-body text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2">
                  <span>📚</span> راهنمای استفاده
                </Link></li>
                <li><Link href={`/${locale}/dashboard`} className="font-body text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2">
                  <span>📊</span> داشبورد
                </Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-display font-bold text-gray-900 mb-6">پشتیبانی</h4>
              <div className="space-y-3">
                <p className="font-body text-gray-600 flex items-center gap-2">
                  <span>📞</span> ۰۲۱-۱۲۳۴۵۶۷۸
                </p>
                <p className="font-body text-gray-600 flex items-center gap-2">
                  <span>✉️</span> support@basalam.com
                </p>
                <p className="font-body text-gray-600 flex items-center gap-2">
                  <span>🕐</span> ۲۴/۷ آنلاین
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="font-body text-gray-500 text-center md:text-right">
                © ۱۴۰۳ سیستم مدیریت محصولات باسلام. تمام حقوق محفوظ است.
              </p>
              <div className="flex gap-6 text-sm">
                <Link href="#" className="font-body text-gray-500 hover:text-gray-700 transition-colors">حریم خصوصی</Link>
                <Link href="#" className="font-body text-gray-500 hover:text-gray-700 transition-colors">شرایط استفاده</Link>
                <Link href="#" className="font-body text-gray-500 hover:text-gray-700 transition-colors">تماس با ما</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}