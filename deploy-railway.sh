#!/bin/bash

# 🚂 اسکریپت دیپلویمنت سریع Railway

echo "🚂 شروع دیپلویمنت روی Railway..."

# بررسی وجود Railway CLI
if ! command -v railway &> /dev/null; then
    echo "📦 نصب Railway CLI..."
    npm install -g @railway/cli
fi

# بررسی وجود Git
if ! command -v git &> /dev/null; then
    echo "❌ Git نصب نیست. لطفاً ابتدا Git را نصب کنید."
    exit 1
fi

# بررسی وجود remote origin
if ! git remote get-url origin &> /dev/null; then
    echo "📝 لطفاً ابتدا repository GitHub خود را تنظیم کنید:"
    read -p "URL repository GitHub: " GITHUB_URL
    git remote add origin $GITHUB_URL
fi

# Push کردن کد به GitHub
echo "📤 Push کردن کد به GitHub..."
git add .
git commit -m "Deploy to Railway: $(date)" || echo "No changes to commit"
git push origin main 2>/dev/null || git push origin master 2>/dev/null || {
    echo "❌ خطا در push کردن به GitHub. لطفاً دستی push کنید:"
    echo "   git push origin main"
    exit 1
}

# ورود به Railway
echo "🔐 ورود به Railway..."
railway login

# ایجاد پروژه جدید
echo "🚂 ایجاد پروژه Railway..."
railway init

# دیپلوی کردن
echo "🚀 دیپلوی کردن..."
railway up

# دریافت URL پروژه
echo "🌐 دریافت URL پروژه..."
PROJECT_URL=$(railway status --json | grep -o '"url":"[^"]*' | cut -d'"' -f4)

if [ -z "$PROJECT_URL" ]; then
    echo "⚠️ نتوانستیم URL را به صورت خودکار دریافت کنیم."
    echo "لطفاً از داشبورد Railway URL را کپی کنید."
    read -p "URL پروژه را وارد کنید: " PROJECT_URL
fi

echo "🌐 URL پروژه: $PROJECT_URL"

# راهنمای تنظیم متغیرهای محیطی
echo ""
echo "⚙️ حالا باید متغیرهای محیطی را در داشبورد Railway تنظیم کنید:"
echo "1. به $PROJECT_URL بروید"
echo "2. روی تب 'Variables' کلیک کنید"
echo "3. این متغیرها را اضافه کنید:"
echo ""
echo "NODE_ENV=production"
echo "NEXT_PUBLIC_APP_URL=$PROJECT_URL"
echo "NEXTAUTH_URL=$PROJECT_URL"
echo "BASALAM_REDIRECT_URI=${PROJECT_URL}/api/auth/callback"
echo "BASALAM_API_BASE_URL=https://api.basalam.com"
echo ""

# دریافت اطلاعات باسلام
echo "🔑 اطلاعات باسلام:"
read -p "BASALAM_CLIENT_ID: " BASALAM_CLIENT_ID
read -p "BASALAM_CLIENT_SECRET: " BASALAM_CLIENT_SECRET
read -p "ADMIN_CARD_NUMBER: " ADMIN_CARD_NUMBER

echo ""
echo "📋 متغیرهای باسلام برای کپی:"
echo "BASALAM_CLIENT_ID=$BASALAM_CLIENT_ID"
echo "BASALAM_CLIENT_SECRET=$BASALAM_CLIENT_SECRET"
echo "ADMIN_CARD_NUMBER=$ADMIN_CARD_NUMBER"

# تولید کلیدهای امنیتی
echo ""
echo "🔐 کلیدهای امنیتی (کپی کنید):"
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "SESSION_SECRET=$(openssl rand -base64 32)"

# راهنمای اضافه کردن PostgreSQL
echo ""
echo "🗄️ برای اضافه کردن PostgreSQL:"
echo "1. در داشبورد Railway روی 'New Service' کلیک کنید"
echo "2. 'Database' → 'PostgreSQL' را انتخاب کنید"
echo "3. متغیر DATABASE_URL به صورت خودکار اضافه می‌شود"

# نمایش اطلاعات نهایی
echo ""
echo "✅ دیپلویمنت اولیه تکمیل شد!"
echo "🌐 URL اپلیکیشن: $PROJECT_URL"
echo "🔗 Redirect URI برای باسلام: ${PROJECT_URL}/api/auth/callback"
echo ""
echo "📋 مراحل بعدی:"
echo "1. متغیرهای محیطی را در داشبورد Railway تنظیم کنید"
echo "2. PostgreSQL را اضافه کنید"
echo "3. وارد پنل باسلام شوید و Redirect URI را تنظیم کنید"
echo "4. اپلیکیشن را تست کنید"
echo ""
echo "📊 مشاهده لاگ‌ها: railway logs"
echo "🔧 مدیریت پروژه: railway dashboard"

# باز کردن داشبورد
read -p "🌐 آیا می‌خواهید داشبورد Railway را باز کنید؟ (y/n): " OPEN_DASHBOARD
if [ "$OPEN_DASHBOARD" = "y" ] || [ "$OPEN_DASHBOARD" = "Y" ]; then
    railway dashboard
fi

echo "🎉 موفق باشید!"