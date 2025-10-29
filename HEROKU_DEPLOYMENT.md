# 🚀 راهنمای دیپلویمنت روی Heroku

## پیش‌نیازها

1. **حساب Heroku**: [ثبت‌نام در Heroku](https://signup.heroku.com/)
2. **Heroku CLI**: [نصب Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git**: برای آپلود کد

## مرحله 1: نصب Heroku CLI

### macOS
```bash
brew tap heroku/brew && brew install heroku
```

### Windows
دانلود از [heroku.com](https://devcenter.heroku.com/articles/heroku-cli)

### Linux
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

## مرحله 2: ورود به Heroku

```bash
# ورود به حساب Heroku
heroku login

# تایید ورود
heroku auth:whoami
```

## مرحله 3: ایجاد اپلیکیشن Heroku

```bash
# رفتن به پوشه پروژه
cd basalam-product-manager

# ایجاد اپلیکیشن جدید
heroku create your-app-name

# یا با نام تصادفی
heroku create
```

## مرحله 4: اضافه کردن Add-ons

### PostgreSQL Database
```bash
# اضافه کردن دیتابیس PostgreSQL
heroku addons:create heroku-postgresql:essential-0

# مشاهده اطلاعات دیتابیس
heroku pg:info
```

### Redis (اختیاری - برای cache)
```bash
heroku addons:create heroku-redis:mini
```

## مرحله 5: تنظیم متغیرهای محیطی

```bash
# تنظیم متغیرهای اصلی
heroku config:set NODE_ENV=production
heroku config:set NEXT_PUBLIC_APP_URL=https://your-app-name.herokuapp.com
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set JWT_REFRESH_SECRET=$(openssl rand -base64 32)
heroku config:set NEXTAUTH_SECRET=$(openssl rand -base64 32)
heroku config:set SESSION_SECRET=$(openssl rand -base64 32)

# تنظیم اطلاعات باسلام
heroku config:set BASALAM_CLIENT_ID=your-basalam-client-id
heroku config:set BASALAM_CLIENT_SECRET=your-basalam-client-secret
heroku config:set BASALAM_REDIRECT_URI=https://your-app-name.herokuapp.com/api/auth/callback
heroku config:set BASALAM_API_BASE_URL=https://api.basalam.com

# تنظیم ادمین
heroku config:set ADMIN_CARD_NUMBER=1234567890123456

# مشاهده تمام متغیرها
heroku config
```

## مرحله 6: دیپلوی کردن

```bash
# اضافه کردن remote
git remote add heroku https://git.heroku.com/your-app-name.git

# commit کردن تغییرات
git add .
git commit -m "Prepare for Heroku deployment"

# دیپلوی کردن
git push heroku main

# یا اگر branch شما master است
git push heroku master
```

## مرحله 7: اجرای Migration (در صورت نیاز)

```bash
# اجرای migration
heroku run npm run migrate

# یا اتصال به bash
heroku run bash
```

## مرحله 8: باز کردن اپلیکیشن

```bash
# باز کردن در مرورگر
heroku open

# یا مشاهده URL
heroku info
```

## مرحله 9: تنظیم Redirect URI در باسلام

1. وارد پنل توسعه‌دهندگان باسلام شوید
2. به بخش OAuth Applications بروید
3. Redirect URI را تنظیم کنید:
   ```
   https://your-app-name.herokuapp.com/api/auth/callback
   ```

## مانیتورینگ و لاگ‌ها

### مشاهده لاگ‌ها
```bash
# مشاهده لاگ‌های realtime
heroku logs --tail

# مشاهده لاگ‌های اخیر
heroku logs --num=100

# فیلتر کردن لاگ‌ها
heroku logs --source=app --tail
```

### مشاهده وضعیت
```bash
# وضعیت dynos
heroku ps

# وضعیت اپلیکیشن
heroku apps:info

# مشاهده متریک‌ها
heroku logs --ps=web.1 --tail
```

## اسکیل کردن

### تنظیم تعداد dynos
```bash
# اسکیل کردن به 2 dyno
heroku ps:scale web=2

# بازگشت به 1 dyno
heroku ps:scale web=1

# خاموش کردن
heroku ps:scale web=0
```

### ارتقا plan
```bash
# ارتقا به Standard-1X
heroku ps:resize web=standard-1x

# ارتقا دیتابیس
heroku addons:upgrade heroku-postgresql:standard-0
```

## بروزرسانی

### دیپلوی نسخه جدید
```bash
git add .
git commit -m "Update application"
git push heroku main
```

### Rollback
```bash
# مشاهده releases
heroku releases

# rollback به نسخه قبلی
heroku rollback v123
```

## تنظیمات امنیتی

### SSL/TLS
```bash
# فعال‌سازی SSL (رایگان)
heroku certs:auto:enable
```

### Domain سفارشی
```bash
# اضافه کردن domain
heroku domains:add www.yourdomain.com

# مشاهده domains
heroku domains
```

## Backup و Restore

### Backup دیتابیس
```bash
# ایجاد backup
heroku pg:backups:capture

# مشاهده backups
heroku pg:backups

# دانلود backup
heroku pg:backups:download
```

### Restore دیتابیس
```bash
# restore از backup
heroku pg:backups:restore b001 DATABASE_URL
```

## عیب‌یابی

### مشکلات رایج

#### 1. خطای Build
```bash
# مشاهده build logs
heroku logs --source=heroku --tail

# بررسی package.json
heroku run cat package.json
```

#### 2. خطای Database
```bash
# بررسی اتصال دیتابیس
heroku pg:psql

# مشاهده اطلاعات دیتابیس
heroku pg:info
```

#### 3. خطای Environment Variables
```bash
# بررسی متغیرها
heroku config

# تست متغیر خاص
heroku run echo $DATABASE_URL
```

### دستورات مفید

```bash
# restart اپلیکیشن
heroku restart

# اجرای دستور در سرور
heroku run node --version

# اتصال SSH
heroku run bash

# مشاهده router logs
heroku logs --source=router --tail
```

## بهینه‌سازی عملکرد

### تنظیمات Node.js
```bash
# تنظیم memory limit
heroku config:set NODE_OPTIONS="--max-old-space-size=2560"

# تنظیم timezone
heroku config:set TZ="Asia/Tehran"
```

### CDN و Cache
- استفاده از Cloudflare برای CDN
- تنظیم Redis برای cache
- بهینه‌سازی static assets

## هزینه‌ها

### Free Tier محدودیت‌ها
- 550 ساعت رایگان در ماه
- خواب رفتن پس از 30 دقیقه عدم استفاده
- محدودیت دیتابیس: 10,000 ردیف

### Paid Plans
- **Basic ($7/ماه)**: بدون خواب، SSL
- **Standard-1X ($25/ماه)**: Performance metrics
- **Standard-2X ($50/ماه)**: 2X RAM

## پشتیبانی

در صورت مشکل:
1. [Heroku Dev Center](https://devcenter.heroku.com/)
2. [Heroku Status](https://status.heroku.com/)
3. [Community Forum](https://help.heroku.com/)

---

## ✅ Checklist نهایی

- [ ] Heroku CLI نصب شده
- [ ] اپلیکیشن ایجاد شده
- [ ] PostgreSQL اضافه شده
- [ ] متغیرهای محیطی تنظیم شده
- [ ] کد دیپلوی شده
- [ ] Migration اجرا شده (در صورت نیاز)
- [ ] Redirect URI در باسلام تنظیم شده
- [ ] SSL فعال شده
- [ ] لاگ‌ها بررسی شده

🎉 **موفق باشید!**