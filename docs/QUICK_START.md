# 🚀 CopyFlow Health Dashboard - Швидкий Старт

## ⚡ 5-хвилинний запуск

### **Крок 1: Встановлення**
```bash
cd "E:\Claude control\CopyFlow\admin-dashboard"
npm install
```

### **Крок 2: База даних**
```bash
# Налаштуй .env (скопіюй з .env.example)
cp .env.example .env

# Генеруй Prisma client
npm run db:generate

# Створи таблиці
npm run db:push
```

### **Крок 3: Запуск**
```bash
npm run dev
```

✅ **Dashboard доступний:** http://localhost:3001

---

## 🎯 Швидка конфігурація

### **Мінімальний .env:**
```env
# База даних (локальна PostgreSQL)
MONITORING_DATABASE_URL="postgresql://postgres:password@localhost:5432/copyflow_monitoring"

# Основний проект
MAIN_PROJECT_API_URL="http://localhost:3000"

# Алерти (опціонально)
MONITORING_ENABLED="true"
```

### **З Gmail алертами:**
```env
# Додай до .env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
ALERT_EMAIL_TO="admin@copyflow.com.ua"
```

### **З Telegram алертами:**
```env
# Додай до .env
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"
```

---

## 🔧 Інтеграція з основним проектом

### **1. Скопіюй файл моніторингу:**
```bash
# З admin-dashboard в основний проект
cp INTEGRATION_FOR_MAIN_PROJECT.ts "../project/lib/monitoring-client.ts"
```

### **2. Додай в основний проект .env:**
```env
MONITORING_ENABLED="true"
MONITORING_DASHBOARD_URL="http://localhost:3001"
```

### **3. Оновлення API route (приклад):**
```typescript
// В app/api/generate/route.ts
import { logGeneration } from '@/lib/monitoring-client'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // ... existing logic ...
    
    // Логування метрики
    await logGeneration(
      Date.now() - startTime,
      'elite-assistant',
      true,
      { userId: session?.user?.id }
    )
    
    return NextResponse.json(result)
  } catch (error) {
    await logGeneration(
      Date.now() - startTime,
      'elite-assistant',
      false,
      { error: error.message }
    )
    throw error
  }
}
```

---

## 🧪 Тестування

### **Тест dashboard:**
```bash
curl http://localhost:3001/api/health
```

### **Тест алертів:**
```bash
# В директорії dashboard
node -e "
const { alertService } = require('./lib/alerts');
alertService.testAllChannels().then(console.log);
"
```

### **Тест метрик:**
```bash
curl -X POST http://localhost:3001/api/metrics \
  -H 'Content-Type: application/json' \
  -d '{"metric":"test","value":123}'
```

---

## 📊 Що бачиш в Dashboard

### **Status Overview:**
- 🟢 CopyFlow API Gateway: Operational
- 🟡 Content Generation: Degraded (3.2s avg)
- 🟢 Authentication: Operational
- 🟢 Database: Operational
- 🟢 Payment Processing: Operational

### **Real-time Metrics:**
- ⚡ Response Time: 2.8s avg
- ✅ Success Rate: 98.5%
- 👥 Active Users: 24
- 🚀 Generations/Hour: 142

### **Performance Charts:**
- 📈 Response time trends
- 📊 Success rate over time
- 🔍 Historical analysis

---

## 🚨 Налаштування алертів

### **Automatic alerts при:**
- Response time > 2 секунди (warning)
- Response time > 5 секунд (critical)
- Success rate < 95% (warning)
- Success rate < 90% (critical)
- Будь-який сервіс недоступний (critical)

### **Канали сповіщень:**
- 📧 Email з HTML template
- 📱 Telegram з форматованими повідомленнями
- 📊 Incident logs в dashboard

---

## 🎯 Наступні кроки

1. ✅ Запустити dashboard локально
2. 🔧 Інтегрувати з основним проектом
3. 📧 Налаштувати email alerts
4. 📱 Додати Telegram бота
5. 🚀 Deploy на Railway
6. 📊 Налаштувати custom domain

---

## ❓ Потрібна допомога?

### **Поширені проблеми:**
- **Dashboard не запускається**: Перевір PostgreSQL
- **Алерти не працюють**: Перевір SMTP налаштування
- **Метрики не надходять**: Перевір інтеграцію з основним проектом

### **Корисні команди:**
```bash
# Перезапуск БД
npm run db:push --force-reset

# Перегляд БД
npm run db:studio

# Логи в реальному часі
npm run dev
```

---

**🎉 Готово! Тепер у тебе професійний моніторинг як у великих компаній!**

*Dashboard створений за 1 день - готовий до production використання*
