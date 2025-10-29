# 🚂 راهنمای سریع Railway

## چرا Railway؟
- ✅ **رایگان**: $5 اعتبار ماهانه
- ✅ **بدون کارت اعتباری**
- ✅ **PostgreSQL رایگان**
- ✅ **دیپلویمنت آسان**
- ✅ **Custom domain رایگان**

## مرحله 1: آماده‌سازی (2 دقیقه)

```bash
# 1. Push به GitHub (اگر نکرده‌اید)
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/basalam-product-manager.git
git push -u origin main

# 2. اجرای اسکریپت خودکار
./deploy-railway.sh
```

## مرحله 2: ثبت‌نام Railway (1 دقیقه)

1. به [railway.app](https://railway.app) بروید
2. "Start a New Project" کلیک کنید
3. با GitHub وارد شوید
4. $5 اعتبار رایگان دریافت کنید

## مرحله 3: دیپلوی از GitHub (2 دقیقه)

1. "Deploy from GitHub repo" کلیک کنید
2. Repository خود را انتخاب کنید
3. Railway شروع به build می‌کند
4. منتظر بمانید تا دیپلوی تمام شود

## مرحله 4: اضافه کردن PostgreSQL (30 ثانیه)

1. "New Service" کلیک کنید
2. "Database" → "PostgreSQL" انتخاب کنید
3. Railway خودکار راه‌اندازی می‌کند

## مرحله 5: تنظیم متغیرها (3 دقیقه)

در تب "Variables" این متغیرها را اضافه کنید:

### اصلی:
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.up.railway.app
NEXTAUTH_URL=https://your-app.up.railway.app
```

### باسلام:
```
BASALAM_CLIENT_ID=your-client-id
BASALAM_CLIENT_SECRET=your-client-secret
BASALAM_REDIRECT_URI=https://your-app.up.railway.app/api/auth/callback
BASALAM_API_BASE_URL=https://api.basalam.com
ADMIN_CARD_NUMBER=1234567890123456
```

### امنیت (کلیدهای تصادفی):
```bash
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
```

## مرحله 6: تنظیم باسلام (1 دقیقه)

1. وارد پنل باسلام شوید
2. Redirect URI تنظیم کنید:
   ```
   https://your-app.up.railway.app/api/auth/callback
   ```

## ✅ تست نهایی

- **صفحه اصلی**: https://your-app.up.railway.app
- **Health**: https://your-app.up.railway.app/api/health
- **لاگین**: کلیک "ورود به سیستم"

## دستورات مفید

```bash
# نصب CLI
npm install -g @railway/cli

# ورود
railway login

# مشاهده لاگ‌ها
railway logs

# وضعیت پروژه
railway status

# باز کردن داشبورد
railway dashboard
```

## مقایسه هزینه‌ها

| پلتفرم | Free Tier | کارت اعتباری | Database |
|---------|-----------|---------------|----------|
| **Railway** | $5/ماه | ❌ | ✅ PostgreSQL |
| Vercel | محدود | ❌ | ❌ |
| Netlify | محدود | ❌ | ❌ |
| Heroku | 550h/ماه | ✅ | ✅ |
| Render | محدود | ✅ | ✅ |

## عیب‌یابی سریع

### Build Failed
```bash
railway logs --deployment
```

### Database Error
```bash
railway variables | grep DATABASE_URL
```

### Environment Variables
```bash
railway variables
```

---

## 🎯 خلاصه: 10 دقیقه تا دیپلوی!

1. **GitHub** (2 دقیقه): Push کد
2. **Railway** (1 دقیقه): ثبت‌نام
3. **Deploy** (2 دقیقه): اتصال repository
4. **Database** (30 ثانیه): اضافه کردن PostgreSQL
5. **Variables** (3 دقیقه): تنظیم متغیرها
6. **Basalam** (1 دقیقه): تنظیم Redirect URI
7. **Test** (30 ثانیه): بررسی عملکرد

🎉 **آماده است!**