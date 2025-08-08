#!/bin/bash
# Railway build script для CopyFlow Health Dashboard

echo "🚀 Starting Railway build process..."

# Встановлення залежностей
echo "📦 Installing dependencies..."
npm ci --only=production

# Генерація Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Створення production build
echo "⚡ Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
