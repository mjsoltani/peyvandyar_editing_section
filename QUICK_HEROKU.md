# 🚀 راهنمای سریع دیپلویمنت Heroku

## مرحله 1: نصب Heroku CLI

### macOS
```bash
brew tap heroku/brew && brew install heroku
```

### Windows/Linux
دانلود از: https://devcenter.heroku.com/articles/heroku-cli

## مرحله 2: دیپلویمنت خودکار

```bash
# اجرای اسکریپت خودکار
./deploy-heroku.sh
```

**یا دستی:**

## مرحله 3: دیپلویمنت دستی

```bash
# 1. ورود به Heroku
heroku login

# 2. ایجاد اپلیکیشن
heroku create your-app-name

# 3. اضافه کردن دیتابیس
heroku addons:create heroku-postgresql:essential-0

# 4. تنظیم متغیرهای محیطی
heroku config:set NODE_ENV=production
heroku config:set NEXT_PUBLIC_APP_URL=https://your-app-name.herokuapp.com
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set NEXTAUTH_SECRET=$(openssl rand -base64 32)
heroku config:set BASALAM_CLIENT_ID=your-client-id
heroku config:set BASALAM_CLIENT_SECRET=your-client-secret
heroku config:set BASALAM_REDIRECT_URI=https://your-app-name.herokuapp.com/api/auth/callback
heroku config:set ADMIN_CARD_NUMBER=1234567890123456

# 5. دیپلوی
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# 6. باز کردن اپلیکیشن
heroku open
```

## مرحله 4: تنظیم باسلام

1. وارد پنل باسلام شوید
2. Redirect URI را تنظیم کنید:
   ```
   https://your-app-name.herokuapp.com/api/auth/callback
   ```

## دستورات مفید

```bash
# مشاهده لاگ‌ها
heroku logs --tail

# وضعیت اپلیکیشن
heroku ps

# مشاهده متغیرها
heroku config

# restart
heroku restart
```

## ✅ تست نهایی

- صفحه اصلی: `https://your-app-name.herokuapp.com`
- Health check: `https://your-app-name.herokuapp.com/api/health`
- لاگین: کلیک روی "ورود به سیستم"

---

🎉 **آماده است!** اپلیکیشن شما روی Heroku در دسترس است.