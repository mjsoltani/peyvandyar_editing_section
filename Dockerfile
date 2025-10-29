# استفاده از Node.js 20 Alpine
FROM node:20-alpine AS base

# نصب dependencies مورد نیاز برای Alpine
RUN apk add --no-cache libc6-compat

WORKDIR /app

# کپی فایل‌های package
COPY package*.json ./

# نصب تمام dependencies (شامل devDependencies برای build)
RUN npm ci && npm cache clean --force

# کپی کد منبع
COPY . .

# Build اپلیکیشن
RUN npm run build

# تنظیم متغیر محیطی
ENV NODE_ENV=production
ENV PORT=3000

# باز کردن پورت
EXPOSE 3000

# اجرای اپلیکیشن
CMD ["npm", "start"]