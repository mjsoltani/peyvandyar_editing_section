# 🚂 راهنمای دیپلویمنت روی Railway

Railway یک پلتفرم مدرن و رایگان برای دیپلویمنت اپلیکیشن‌ها است که:
- ✅ کارت اعتباری نمی‌خواهد
- ✅ $5 اعتبار رایگان ماهانه
- ✅ PostgreSQL رایگان
- ✅ Custom domain رایگان
- ✅ دیپلویمنت خودکار از GitHub

## مرحله 1: ثبت‌نام در Railway

1. به [railway.app](https://railway.app) بروید
2. روی "Start a New Project" کلیک کنید
3. با GitHub وارد شوید (توصیه می‌شود)
4. حساب شما با $5 اعتبار رایگان فعال می‌شود

## مرحله 2: ایجاد پروژه

### روش 1: از GitHub (توصیه شده)

1. **Push کردن کد به GitHub**:
```bash
# اگر repository ندارید
git init
git add .
git commit -m "Initial commit for Railway deployment"
git branch -M main
git remote add origin https://github.com/mjsoltani/peyvandyar_editing_section.git
git push -u origin main
```

2. **اتصال به Railway**:
   - در Railway روی "Deploy from GitHub repo" کلیک کنید
   - Repository خود را انتخاب کنید
   - Railway به صورت خودکار شروع به build می‌کند

### روش 2: Railway CLI

```bash
# نصب Railway CLI
npm install -g @railway/cli

# ورود به Railway
railway login

# ایجاد پروژه جدید
railway init

# دیپلوی
railway up
```

## مرحله 3: اضافه کردن PostgreSQL

1. در داشبورد Railway روی پروژه خود کلیک کنید
2. روی "New Service" کلیک کنید
3. "Database" → "PostgreSQL" را انتخاب کنید
4. Railway به صورت خودکار دیتابیس را راه‌اندازی می‌کند

## مرحله 4: تنظیم متغیرهای محیطی

در تب "Variables" پروژه خود، این متغیرها را اضافه کنید:

### متغیرهای اصلی:
```
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://your-app-name.up.railway.app
```

### دیتابیس:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
```
(Railway به صورت خودکار این متغیر را تنظیم می‌کند)

### امنیت:
```bash
# تولید کلیدهای تصادفی
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
```

### باسلام:
```
BASALAM_CLIENT_ID=your-basalam-client-id
BASALAM_CLIENT_SECRET=your-basalam-client-secret
BASALAM_REDIRECT_URI=https://your-app-name.up.railway.app/api/auth/callback
BASALAM_API_BASE_URL=https://api.basalam.com
ADMIN_CARD_NUMBER=1234567890123456
```

### سایر تنظیمات:
```
NEXTAUTH_URL=https://your-app-name.up.railway.app
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://your-app-name.up.railway.app
```

## مرحله 5: دریافت URL نهایی

1. پس از دیپلوی موفق، در تب "Settings" پروژه خود بروید
2. در بخش "Domains" URL اپلیکیشن را مشاهده کنید
3. معمولاً به شکل: `https://your-app-name.up.railway.app`

## مرحله 6: تنظیم Redirect URI در باسلام

1. وارد پنل توسعه‌دهندگان باسلام شوید
2. به بخش OAuth Applications بروید
3. Redirect URI را تنظیم کنید:
   ```
   https://your-app-name.up.railway.app/api/auth/callback
   ```

## مرحله 7: تست اپلیکیشن

- **صفحه اصلی**: `https://your-app-name.up.railway.app`
- **Health Check**: `https://your-app-name.up.railway.app/api/health`
- **لاگین**: کلیک روی "ورود به سیستم"

## مانیتورینگ و مدیریت

### مشاهده لاگ‌ها
```bash
# با CLI
railway logs

# یا در داشبورد Railway تب "Deployments"
```

### مشاهده متریک‌ها
- در داشبورد Railway تب "Metrics"
- CPU، Memory، Network usage
- Response times

### بروزرسانی اپلیکیشن
```bash
# اگر از GitHub استفاده می‌کنید
git add .
git commit -m "Update application"
git push origin main
# Railway به صورت خودکار دیپلوی می‌کند

# اگر از CLI استفاده می‌کنید
railway up
```

## تنظیمات پیشرفته

### Custom Domain
1. در تب "Settings" → "Domains"
2. روی "Custom Domain" کلیک کنید
3. دامنه خود را اضافه کنید
4. DNS records را تنظیم کنید

### Environment-based Deployments
```bash
# ایجاد environment جدید
railway environment

# دیپلوی در environment خاص
railway up --environment production
```

### Database Management
```bash
# اتصال به دیتابیس
railway connect postgres

# backup دیتابیس
railway run pg_dump $DATABASE_URL > backup.sql
```

## محدودیت‌های Free Plan

- **$5 اعتبار ماهانه** (معادل ~500 ساعت اجرا)
- **512MB RAM** برای هر service
- **1GB Disk** برای هر service
- **100GB Network** ماهانه

## ارتقا به Pro Plan

اگر اعتبار رایگان تمام شد:
- **$20/ماه** برای usage-based pricing
- RAM و Disk بیشتر
- Priority support

## عیب‌یابی

### مشکلات رایج

#### 1. Build Failed
```bash
# بررسی لاگ‌های build
railway logs --deployment

# بررسی package.json
# اطمینان از وجود "engines" field
```

#### 2. Database Connection Error
```bash
# بررسی متغیر DATABASE_URL
railway variables

# تست اتصال
railway run echo $DATABASE_URL
```

#### 3. Environment Variables
```bash
# مشاهده تمام متغیرها
railway variables

# اضافه کردن متغیر جدید
railway variables set KEY=value
```

### دستورات مفید

```bash
# وضعیت پروژه
railway status

# مشاهده services
railway service

# restart service
railway redeploy

# حذف پروژه
railway delete
```

## مقایسه با سایر پلتفرم‌ها

| ویژگی | Railway | Vercel | Netlify | Render |
|--------|---------|--------|---------|--------|
| Free Tier | $5/ماه | محدود | محدود | محدود |
| Database | ✅ PostgreSQL | ❌ | ❌ | ✅ |
| Custom Domain | ✅ رایگان | ✅ | ✅ | ✅ |
| کارت اعتباری | ❌ | ❌ | ❌ | ✅ |
| Auto Deploy | ✅ | ✅ | ✅ | ✅ |

## نکات بهینه‌سازی

### عملکرد
- استفاده از `railway.json` برای تنظیمات
- تنظیم health check
- بهینه‌سازی Docker image

### امنیت
- استفاده از متغیرهای محیطی برای secrets
- تنظیم CORS مناسب
- فعال‌سازی HTTPS (خودکار)

### هزینه
- مانیتورینگ usage در داشبورد
- بهینه‌سازی resource usage
- استفاده از sleep mode برای development

## پشتیبانی

- [Railway Documentation](https://docs.railway.app/)
- [Discord Community](https://discord.gg/railway)
- [GitHub Issues](https://github.com/railwayapp/railway/issues)

---

## ✅ Checklist دیپلویمنت

- [ ] حساب Railway ایجاد شده
- [ ] Repository به GitHub push شده
- [ ] پروژه در Railway ایجاد شده
- [ ] PostgreSQL اضافه شده
- [ ] متغیرهای محیطی تنظیم شده
- [ ] اپلیکیشن دیپلوی شده
- [ ] URL نهایی دریافت شده
- [ ] Redirect URI در باسلام تنظیم شده
- [ ] اپلیکیشن تست شده

🎉 **موفق باشید!**