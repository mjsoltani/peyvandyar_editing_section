#!/bin/bash

# 🚀 اسکریپت دیپلویمنت سریع Heroku

echo "🚀 شروع دیپلویمنت روی Heroku..."

# بررسی وجود Heroku CLI
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI نصب نیست. لطفاً ابتدا آن را نصب کنید:"
    echo "   macOS: brew tap heroku/brew && brew install heroku"
    echo "   یا از https://devcenter.heroku.com/articles/heroku-cli دانلود کنید"
    exit 1
fi

# دریافت نام اپلیکیشن
read -p "📝 نام اپلیکیشن Heroku را وارد کنید (یا Enter برای نام تصادفی): " APP_NAME

# ایجاد اپلیکیشن
if [ -z "$APP_NAME" ]; then
    echo "🎲 ایجاد اپلیکیشن با نام تصادفی..."
    heroku create
else
    echo "📱 ایجاد اپلیکیشن با نام: $APP_NAME"
    heroku create $APP_NAME
fi

# دریافت URL اپلیکیشن
APP_URL=$(heroku info -s | grep web_url | cut -d= -f2)
echo "🌐 URL اپلیکیشن: $APP_URL"

# اضافه کردن PostgreSQL
echo "🗄️ اضافه کردن دیتابیس PostgreSQL..."
heroku addons:create heroku-postgresql:essential-0

# تنظیم متغیرهای محیطی اصلی
echo "⚙️ تنظیم متغیرهای محیطی..."
heroku config:set NODE_ENV=production
heroku config:set NEXT_PUBLIC_APP_URL=$APP_URL
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set JWT_REFRESH_SECRET=$(openssl rand -base64 32)
heroku config:set NEXTAUTH_SECRET=$(openssl rand -base64 32)
heroku config:set SESSION_SECRET=$(openssl rand -base64 32)
heroku config:set NEXTAUTH_URL=$APP_URL

# دریافت اطلاعات باسلام
echo ""
echo "🔑 لطفاً اطلاعات باسلام را وارد کنید:"
read -p "BASALAM_CLIENT_ID: " BASALAM_CLIENT_ID
read -p "BASALAM_CLIENT_SECRET: " BASALAM_CLIENT_SECRET
read -p "ADMIN_CARD_NUMBER: " ADMIN_CARD_NUMBER

# تنظیم اطلاعات باسلام
heroku config:set BASALAM_CLIENT_ID=$BASALAM_CLIENT_ID
heroku config:set BASALAM_CLIENT_SECRET=$BASALAM_CLIENT_SECRET
heroku config:set BASALAM_REDIRECT_URI="${APP_URL}api/auth/callback"
heroku config:set BASALAM_API_BASE_URL=https://api.basalam.com
heroku config:set ADMIN_CARD_NUMBER=$ADMIN_CARD_NUMBER

# Commit و Push
echo "📦 آماده‌سازی کد برای دیپلوی..."
git add .
git commit -m "Deploy to Heroku: $(date)"

echo "🚀 دیپلوی کردن..."
git push heroku main 2>/dev/null || git push heroku master

# بررسی وضعیت
echo "🔍 بررسی وضعیت دیپلویمنت..."
heroku ps

# نمایش اطلاعات نهایی
echo ""
echo "✅ دیپلویمنت تکمیل شد!"
echo "🌐 URL اپلیکیشن: $APP_URL"
echo "🔗 Redirect URI برای باسلام: ${APP_URL}api/auth/callback"
echo ""
echo "📋 مراحل بعدی:"
echo "1. وارد پنل باسلام شوید"
echo "2. Redirect URI را به ${APP_URL}api/auth/callback تغییر دهید"
echo "3. اپلیکیشن را تست کنید: $APP_URL"
echo ""
echo "📊 مشاهده لاگ‌ها: heroku logs --tail"
echo "🔧 مدیریت اپلیکیشن: heroku dashboard"

# باز کردن اپلیکیشن
read -p "🌐 آیا می‌خواهید اپلیکیشن را در مرورگر باز کنید؟ (y/n): " OPEN_APP
if [ "$OPEN_APP" = "y" ] || [ "$OPEN_APP" = "Y" ]; then
    heroku open
fi

echo "🎉 موفق باشید!"