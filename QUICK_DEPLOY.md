# 🚀 راهنمای دیپلویمنت سریع

## دیپلویمنت روی Vercel (توصیه شده)

### مرحله 1: آماده‌سازی
```bash
# کلون پروژه
git clone <repository-url>
cd basalam-product-manager

# نصب dependencies
npm install

# نصب Vercel CLI
npm i -g vercel
```

### مرحله 2: دیپلوی
```bash
# ورود به Vercel
vercel login

# دیپلوی (اولین بار)
vercel

# دیپلوی production
vercel --prod
```

### مرحله 3: تنظیم متغیرها
در پنل Vercel این متغیرها را اضافه کنید:

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-jwt-secret
BASALAM_CLIENT_ID=your-client-id
BASALAM_CLIENT_SECRET=your-client-secret
BASALAM_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
ADMIN_CARD_NUMBER=1234567890123456
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-app.vercel.app
```

### مرحله 4: تنظیم باسلام
1. وارد پنل توسعه‌دهندگان باسلام شوید
2. Redirect URI را تنظیم کنید:
   ```
   https://your-app.vercel.app/api/auth/callback
   ```

## دیپلویمنت روی Netlify

### مرحله 1: اتصال Repository
1. وارد Netlify شوید
2. "New site from Git" را انتخاب کنید
3. Repository را متصل کنید

### مرحله 2: تنظیمات Build
```
Build command: npm run build
Publish directory: .next
```

### مرحله 3: متغیرهای محیطی
همان متغیرهای Vercel را در Netlify تنظیم کنید.

## دیپلویمنت روی Railway

### مرحله 1: اتصال
```bash
# نصب Railway CLI
npm install -g @railway/cli

# ورود
railway login

# ایجاد پروژه
railway init
```

### مرحله 2: دیپلوی
```bash
# دیپلوی
railway up
```

## دیپلویمنت روی Heroku

### مرحله 1: آماده‌سازی
```bash
# نصب Heroku CLI
# ورود
heroku login

# ایجاد app
heroku create your-app-name
```

### مرحله 2: تنظیم متغیرها
```bash
heroku config:set NODE_ENV=production
heroku config:set NEXT_PUBLIC_APP_URL=https://your-app.herokuapp.com
# سایر متغیرها...
```

### مرحله 3: دیپلوی
```bash
git push heroku main
```

## تست نهایی

پس از دیپلوی، این موارد را تست کنید:

1. **صفحه اصلی**: `https://your-app.domain.com`
2. **Health Check**: `https://your-app.domain.com/api/health`
3. **لاگین**: کلیک روی "ورود به سیستم"

## عیب‌یابی سریع

### خطای دیتابیس
```bash
# بررسی اتصال
curl https://your-app.domain.com/api/health
```

### خطای OAuth
- بررسی BASALAM_REDIRECT_URI
- بررسی تنظیمات پنل باسلام

### خطای Build
```bash
# تست local
npm run build
npm run start
```

## پشتیبانی

در صورت مشکل:
1. لاگ‌های platform را بررسی کنید
2. متغیرهای محیطی را چک کنید
3. فایل `VERCEL_DEPLOYMENT.md` را مطالعه کنید

---

✅ **نکته**: پس از دیپلوی موفق، حتماً URL نهایی را به عنوان Redirect URI در پنل باسلام تنظیم کنید!