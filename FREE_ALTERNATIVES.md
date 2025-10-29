# 🆓 جایگزین‌های رایگان برای دیپلویمنت

## 1. 🚂 Railway (توصیه اول)
- ✅ **$5 اعتبار رایگان ماهانه**
- ✅ **بدون کارت اعتباری**
- ✅ **PostgreSQL رایگان**
- ✅ **Custom domain**
- 📍 **راه‌اندازی**: `./deploy-railway.sh`

## 2. 🎯 Render
- ✅ **Free tier خوب**
- ❌ **کارت اعتباری می‌خواهد** (ولی charge نمی‌کند)
- ✅ **PostgreSQL رایگان**
- ✅ **Auto-deploy از GitHub**

### راه‌اندازی Render:
```bash
# 1. به render.com بروید
# 2. "New Web Service" کلیک کنید
# 3. GitHub repository را متصل کنید
# 4. تنظیمات:
#    Build Command: npm run build
#    Start Command: npm start
```

## 3. ☁️ Fly.io
- ✅ **Free tier محدود**
- ❌ **کارت اعتباری می‌خواهد**
- ✅ **PostgreSQL رایگان**
- ✅ **Performance بالا**

### راه‌اندازی Fly.io:
```bash
# نصب CLI
curl -L https://fly.io/install.sh | sh

# ورود
flyctl auth login

# راه‌اندازی
flyctl launch

# دیپلوی
flyctl deploy
```

## 4. 🌐 Netlify (فقط Frontend)
- ✅ **کاملاً رایگان**
- ✅ **بدون کارت اعتباری**
- ❌ **فقط static sites**
- ❌ **بدون database**

### برای Static Export:
```bash
# تغییر next.config.ts
export default {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true }
}

# build
npm run build
# فولدر out/ را به Netlify آپلود کنید
```

## 5. 🔥 Firebase Hosting + Functions
- ✅ **Free tier خوب**
- ✅ **بدون کارت اعتباری**
- ✅ **Firestore database**
- ⚠️ **پیچیده‌تر**

## 6. 🐙 GitHub Pages (Static فقط)
- ✅ **کاملاً رایگان**
- ✅ **بدون کارت اعتباری**
- ❌ **فقط static**
- ❌ **بدون backend**

## 7. 📦 Surge.sh (Static فقط)
- ✅ **کاملاً رایگان**
- ✅ **بدون کارت اعتباری**
- ❌ **فقط static**

```bash
npm install -g surge
npm run build
surge ./out
```

## 8. 🌊 Deta Space
- ✅ **کاملاً رایگان**
- ✅ **بدون کارت اعتباری**
- ✅ **Database رایگان**
- ⚠️ **محدودیت‌های performance**

## مقایسه کامل

| پلتفرم | رایگان | کارت اعتباری | Database | Backend | توصیه |
|---------|---------|---------------|----------|---------|-------|
| **Railway** | $5/ماه | ❌ | ✅ PostgreSQL | ✅ | ⭐⭐⭐⭐⭐ |
| **Render** | محدود | ✅ | ✅ PostgreSQL | ✅ | ⭐⭐⭐⭐ |
| **Fly.io** | محدود | ✅ | ✅ PostgreSQL | ✅ | ⭐⭐⭐ |
| **Netlify** | ✅ | ❌ | ❌ | ❌ | ⭐⭐ |
| **Vercel** | محدود | ❌ | ❌ | محدود | ⭐⭐⭐ |
| **Firebase** | خوب | ❌ | ✅ Firestore | ✅ | ⭐⭐⭐ |

## راهنمای انتخاب

### برای پروژه کامل (Backend + Database):
1. **Railway** - بهترین گزینه
2. **Render** - اگر کارت اعتباری دارید
3. **Firebase** - اگر NoSQL مناسب است

### برای Static Site فقط:
1. **Netlify**
2. **GitHub Pages**
3. **Surge.sh**

### برای تست سریع:
1. **Railway** - سریع‌ترین راه‌اندازی
2. **Netlify** - برای static

## نکات مهم

### Railway (توصیه ما):
- **مزایا**: ساده، سریع، PostgreSQL رایگان
- **معایب**: محدودیت $5 ماهانه
- **مناسب برای**: پروژه‌های کوچک تا متوسط

### اگر Railway تمام شد:
1. **Render**: گزینه دوم
2. **Firebase**: برای scale بالا
3. **ترکیب**: Netlify (Frontend) + Railway (Backend)

## راه‌اندازی سریع Railway

```bash
# فقط یک دستور!
./deploy-railway.sh
```

یا دستی:
1. [railway.app](https://railway.app) → ثبت‌نام
2. "Deploy from GitHub" → انتخاب repository
3. "New Service" → "PostgreSQL"
4. تنظیم متغیرهای محیطی
5. تنظیم Redirect URI در باسلام

---

## 🎯 توصیه نهایی

**Railway** بهترین گزینه برای شماست چون:
- کارت اعتباری نمی‌خواهد
- PostgreSQL رایگان دارد
- راه‌اندازی خیلی ساده است
- $5 ماهانه برای پروژه‌های کوچک کافی است

🚂 **شروع کنید**: `./deploy-railway.sh`