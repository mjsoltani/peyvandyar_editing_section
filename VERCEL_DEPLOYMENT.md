# راهنمای دیپلویمنت روی Vercel

## مراحل دیپلویمنت

### 1. آماده‌سازی پروژه

```bash
# نصب Vercel CLI
npm i -g vercel

# ورود به حساب Vercel
vercel login
```

### 2. تنظیم متغیرهای محیطی

در پنل Vercel، متغیرهای زیر را تنظیم کنید:

#### متغیرهای ضروری:
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
DATABASE_URL=postgresql://username:password@hostname:port/database
JWT_SECRET=your-super-secure-jwt-secret
JWT_REFRESH_SECRET=your-super-secure-refresh-secret
BASALAM_CLIENT_ID=your-basalam-client-id
BASALAM_CLIENT_SECRET=your-basalam-client-secret
BASALAM_REDIRECT_URI=https://your-app-name.vercel.app/api/auth/callback
ADMIN_CARD_NUMBER=1234567890123456
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-app-name.vercel.app
```

### 3. دیپلوی کردن

```bash
# دیپلوی اولیه
vercel

# دیپلوی production
vercel --prod
```

### 4. تنظیم دامنه سفارشی (اختیاری)

```bash
# اضافه کردن دامنه سفارشی
vercel domains add your-domain.com
```

## تنظیم دیتابیس

### گزینه 1: Vercel Postgres
```bash
# ایجاد دیتابیس Vercel Postgres
vercel postgres create
```

### گزینه 2: دیتابیس خارجی
- Supabase
- PlanetScale
- Railway
- Neon

## تنظیم Redirect URI برای باسلام

پس از دیپلوی، URL زیر را به عنوان Redirect URI در پنل باسلام تنظیم کنید:

```
https://your-app-name.vercel.app/api/auth/callback
```

## مراحل تکمیل تنظیمات

### 1. دریافت URL نهایی
پس از دیپلوی موفق، Vercel یک URL به شما می‌دهد:
```
https://your-app-name.vercel.app
```

### 2. تنظیم در پنل باسلام
1. وارد پنل توسعه‌دهندگان باسلام شوید
2. به بخش OAuth Applications بروید
3. Redirect URI را به آدرس زیر تغییر دهید:
   ```
   https://your-app-name.vercel.app/api/auth/callback
   ```

### 3. بروزرسانی متغیرهای محیطی
در پنل Vercel، متغیرهای زیر را بروزرسانی کنید:
```
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
BASALAM_REDIRECT_URI=https://your-app-name.vercel.app/api/auth/callback
NEXTAUTH_URL=https://your-app-name.vercel.app
CORS_ORIGIN=https://your-app-name.vercel.app
```

## تست عملکرد

### 1. بررسی سلامت اپلیکیشن
```
GET https://your-app-name.vercel.app/api/health
```

### 2. تست لاگین
1. به آدرس اصلی بروید
2. روی "ورود به سیستم" کلیک کنید
3. فرآیند OAuth باسلام را تکمیل کنید

## نکات مهم

### امنیت
- همیشه از HTTPS استفاده کنید
- کلیدهای JWT را قوی انتخاب کنید
- متغیرهای محیطی را محرمانه نگه دارید

### عملکرد
- از CDN Vercel برای فایل‌های استاتیک استفاده می‌شود
- Edge Functions برای بهبود سرعت
- Automatic scaling

### مانیتورینگ
- لاگ‌ها در پنل Vercel قابل مشاهده است
- Analytics و Performance metrics
- Error tracking

## عیب‌یابی

### مشکلات رایج

#### 1. خطای دیتابیس
```
Error: connect ECONNREFUSED
```
**راه‌حل**: بررسی DATABASE_URL و اتصال دیتابیس

#### 2. خطای OAuth
```
Error: invalid_redirect_uri
```
**راه‌حل**: بررسی BASALAM_REDIRECT_URI در متغیرهای محیطی

#### 3. خطای JWT
```
Error: jwt malformed
```
**راه‌حل**: بررسی JWT_SECRET و NEXTAUTH_SECRET

### مشاهده لاگ‌ها
```bash
# مشاهده لاگ‌های realtime
vercel logs

# مشاهده لاگ‌های function خاص
vercel logs --function=api/auth/callback
```

## بروزرسانی

### دیپلوی نسخه جدید
```bash
# push کردن تغییرات
git add .
git commit -m "Update application"
git push origin main

# Vercel به صورت خودکار دیپلوی می‌کند
```

### Rollback
```bash
# بازگشت به نسخه قبلی
vercel rollback
```

## پشتیبانی

در صورت بروز مشکل:
1. لاگ‌های Vercel را بررسی کنید
2. متغیرهای محیطی را چک کنید
3. اتصال دیتابیس را تست کنید
4. تنظیمات OAuth باسلام را بررسی کنید

## لینک‌های مفید

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)