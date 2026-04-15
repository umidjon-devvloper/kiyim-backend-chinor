# 👗 Kiyim Dizayn Patronlari — Backend API

Node.js + Express.js + MongoDB asosida qurilgan to'liq REST API. Google OAuth, Payme to'lov tizimi, va UploadThing fayl yuklash qo'llab-quvvatlanadi.

---

## 🚀 Ishga tushirish

### Local (development)

```bash
# 1. Dependencylarni o'rnatish
npm install

# 2. .env faylini yaratish
cp .env.example .env
# .env ni to'ldiring

# 3. Serverni ishga tushirish
npm run dev
```

### Docker

```bash
# Build va ishga tushirish
docker-compose up --build

# Background da
docker-compose up -d --build

# To'xtatish
docker-compose down
```

---

## 📁 Papka tuzilmasi

```
src/
├── config/
│   ├── db.js              # MongoDB ulanish
│   ├── firebase.js        # Firebase Admin SDK
│   └── uploadthing.js     # UploadThing router
├── models/
│   ├── User.js
│   ├── Pattern.js
│   ├── Category.js
│   ├── Purchase.js
│   └── Favorite.js
├── controllers/
│   ├── authController.js
│   ├── patternController.js
│   ├── categoryController.js
│   ├── paymeController.js
│   ├── userController.js
│   └── adminController.js
├── routes/
│   ├── auth.js
│   ├── patterns.js
│   ├── categories.js
│   ├── payme.js
│   ├── user.js
│   ├── admin.js
│   └── uploadthing.js
├── middleware/
│   ├── auth.js            # JWT Bearer tekshirish
│   ├── admin.js           # Admin role tekshirish
│   ├── paymeAuth.js       # Payme Basic Auth
│   └── errorHandler.js    # Global error handler
├── services/
│   ├── paymeService.js    # Payme JSON-RPC logic
│   └── uploadthingService.js
├── utils/
│   ├── jwt.js
│   ├── response.js        # Standart javob formati
│   └── errors.js          # AppError + PaymeError
├── app.js
└── server.js
```

---

## 🔐 Autentifikatsiya

Barcha himoyalangan endpointlar uchun:
```
Authorization: Bearer <jwt_token>
```

---

## 📡 API Endpointlar

### 🔑 AUTH

#### Google bilan kirish
```bash
POST /api/auth/google

curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "firebase_id_token_here"}'

# Response
{
  "success": true,
  "message": "Muvaffaqiyatli kirish",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "665f1a2b3c4d5e6f7a8b9c0d",
      "email": "user@gmail.com",
      "name": "Ali Valiyev",
      "avatar": "https://lh3.googleusercontent.com/...",
      "role": "user"
    }
  }
}
```

---

### 🎨 PATTERNS

#### Barcha patternlarni olish
```bash
GET /api/patterns?category=ID&type=FREE&size=M&height=160&page=1&limit=12

curl http://localhost:5000/api/patterns
curl "http://localhost:5000/api/patterns?type=FREE&page=1&limit=6"
curl "http://localhost:5000/api/patterns?category=665f1a2b3c4d5e6f7a8b9c0d&type=PAID"

# Response
{
  "success": true,
  "data": {
    "patterns": [...],
    "pagination": {
      "total": 48,
      "page": 1,
      "limit": 12,
      "pages": 4
    }
  }
}
```

#### Bitta pattern (token ixtiyoriy)
```bash
GET /api/patterns/:id

curl http://localhost:5000/api/patterns/665f1a2b3c4d5e6f7a8b9c0d

# Token bilan (isPurchased, isFavorite qaytaradi)
curl http://localhost:5000/api/patterns/665f1a2b3c4d5e6f7a8b9c0d \
  -H "Authorization: Bearer <token>"
```

#### Pattern fayllarini yuklab olish (auth required)
```bash
GET /api/patterns/:id/download

curl http://localhost:5000/api/patterns/665f1a2b3c4d5e6f7a8b9c0d/download \
  -H "Authorization: Bearer <token>"

# Response
{
  "success": true,
  "data": {
    "files": [
      { "name": "pattern_a4.pdf", "url": "https://utfs.io/f/key123" },
      { "name": "pattern_files.zip", "url": "https://utfs.io/f/key456" }
    ]
  }
}
```

#### Pattern yaratish (admin)
```bash
POST /api/patterns

curl -X POST http://localhost:5000/api/patterns \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Yoz ko'\''ylagi patroni",
    "description": "Oddiy yoz ko'\''ylagi uchun patron",
    "category": "665f1a2b3c4d5e6f7a8b9c0d",
    "type": "PAID",
    "price": 15000,
    "sizes": ["XS","S","M","L","XL"],
    "heights": ["155-160","160-165","165-170"],
    "tags": ["koylak","yoz","oddiy"],
    "previewImage": "https://utfs.io/f/preview_key",
    "files": [
      { "name": "pattern.pdf", "url": "https://utfs.io/f/file_key1", "key": "file_key1" }
    ]
  }'
```

#### Pattern yangilash (admin)
```bash
PUT /api/patterns/:id

curl -X PUT http://localhost:5000/api/patterns/665f1a2b3c4d5e6f7a8b9c0d \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Yangi nom", "price": 20000}'
```

#### Pattern o'chirish (admin)
```bash
DELETE /api/patterns/:id

curl -X DELETE http://localhost:5000/api/patterns/665f1a2b3c4d5e6f7a8b9c0d \
  -H "Authorization: Bearer <admin_token>"
```

---

### 📂 CATEGORIES

#### Barcha kategoriyalar
```bash
GET /api/categories

curl http://localhost:5000/api/categories
```

#### Kategoriya yaratish (admin)
```bash
POST /api/categories

curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Ko'\''ylaklar", "slug": "koylaklar", "icon": "👗"}'
```

#### Kategoriya yangilash (admin)
```bash
PUT /api/categories/:id

curl -X PUT http://localhost:5000/api/categories/665f1a2b3c4d5e6f7a8b9c0d \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Yangi nom", "icon": "🥻"}'
```

#### Kategoriya o'chirish (admin)
```bash
DELETE /api/categories/:id

curl -X DELETE http://localhost:5000/api/categories/665f1a2b3c4d5e6f7a8b9c0d \
  -H "Authorization: Bearer <admin_token>"
```

---

### 💳 PAYME (JSON-RPC 2.0)

Barcha so'rovlar `POST /api/payme` ga yuboriladi.

**Header:** `Authorization: Basic base64(Paycom:password)`

#### CheckPerformTransaction
```bash
curl -X POST http://localhost:5000/api/payme \
  -H "Authorization: Basic UGF5Y29tOnRlc3RfcGFzc3dvcmQ=" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "method": "CheckPerformTransaction",
    "params": {
      "amount": 15000,
      "account": { "pattern_id": "665f1a2b3c4d5e6f7a8b9c0d" }
    }
  }'

# Response
{ "id": 1, "result": { "allow": true } }
```

#### CreateTransaction
```bash
curl -X POST http://localhost:5000/api/payme \
  -H "Authorization: Basic UGF5Y29tOnRlc3RfcGFzc3dvcmQ=" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 2,
    "method": "CreateTransaction",
    "params": {
      "id": "payme_txn_unique_id_123",
      "time": 1718000000000,
      "amount": 15000,
      "account": { "pattern_id": "665f1a2b3c4d5e6f7a8b9c0d" }
    }
  }'
```

#### PerformTransaction
```bash
curl -X POST http://localhost:5000/api/payme \
  -H "Authorization: Basic UGF5Y29tOnRlc3RfcGFzc3dvcmQ=" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 3,
    "method": "PerformTransaction",
    "params": { "id": "payme_txn_unique_id_123" }
  }'
```

#### CancelTransaction
```bash
curl -X POST http://localhost:5000/api/payme \
  -H "Authorization: Basic UGF5Y29tOnRlc3RfcGFzc3dvcmQ=" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 4,
    "method": "CancelTransaction",
    "params": { "id": "payme_txn_unique_id_123", "reason": 1 }
  }'
```

#### CheckTransaction
```bash
curl -X POST http://localhost:5000/api/payme \
  -H "Authorization: Basic UGF5Y29tOnRlc3RfcGFzc3dvcmQ=" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 5,
    "method": "CheckTransaction",
    "params": { "id": "payme_txn_unique_id_123" }
  }'
```

#### GetStatement
```bash
curl -X POST http://localhost:5000/api/payme \
  -H "Authorization: Basic UGF5Y29tOnRlc3RfcGFzc3dvcmQ=" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 6,
    "method": "GetStatement",
    "params": {
      "from": 1717200000000,
      "to": 1718000000000
    }
  }'
```

**Payme xatolik kodlari:**

| Kod | Ma'no |
|-----|-------|
| -32700 | Parse error |
| -32601 | Method not found |
| -31050 | Order not found |
| -31001 | Wrong amount |
| -31003 | Transaction not found |
| -31052 | Transaction already exists |
| -31008 | Transaction cancelled |
| -31099 | Could not perform |
| -32603 | Internal error |

---

### 👤 USER

#### Profil
```bash
GET /api/user/profile

curl http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer <token>"
```

#### Profil yangilash
```bash
PUT /api/user/profile

curl -X PUT http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Yangi Ism"}'
```

#### Sotib olingan patternlar
```bash
GET /api/user/purchases?page=1&limit=10

curl http://localhost:5000/api/user/purchases \
  -H "Authorization: Bearer <token>"
```

#### Sevimlilar ro'yxati
```bash
GET /api/user/favorites?page=1&limit=12

curl http://localhost:5000/api/user/favorites \
  -H "Authorization: Bearer <token>"
```

#### Sevimlilarga qo'shish
```bash
POST /api/user/favorites/:patternId

curl -X POST http://localhost:5000/api/user/favorites/665f1a2b3c4d5e6f7a8b9c0d \
  -H "Authorization: Bearer <token>"
```

#### Sevimlilardan o'chirish
```bash
DELETE /api/user/favorites/:patternId

curl -X DELETE http://localhost:5000/api/user/favorites/665f1a2b3c4d5e6f7a8b9c0d \
  -H "Authorization: Bearer <token>"
```

---

### 🛠 ADMIN

#### Statistika
```bash
GET /api/admin/stats

curl http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer <admin_token>"

# Response
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalPatterns": 48,
    "freePatterns": 20,
    "paidPatterns": 28,
    "totalPurchases": 320,
    "totalRevenue": 4800000,
    "recentPurchases": [...]
  }
}
```

#### Foydalanuvchilar ro'yxati
```bash
GET /api/admin/users?role=user&page=1&limit=20

curl "http://localhost:5000/api/admin/users?page=1&limit=20" \
  -H "Authorization: Bearer <admin_token>"
```

#### Foydalanuvchi rolini o'zgartirish
```bash
PUT /api/admin/users/:id/role

curl -X PUT http://localhost:5000/api/admin/users/665f1a2b3c4d5e6f7a8b9c0d/role \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

#### Barcha purchaselar
```bash
GET /api/admin/purchases?state=2&from=2024-01-01&to=2024-12-31&page=1&limit=20

curl "http://localhost:5000/api/admin/purchases?state=2" \
  -H "Authorization: Bearer <admin_token>"
```

---

### 📤 UPLOADTHING

UploadThing endpoint — frontend dan to'g'ridan-to'g'ri fayl yuklash uchun.

```
POST /api/uploadthing  — fayl yuklash (admin only)
GET  /api/uploadthing  — UploadThing metadata
```

**Frontend misoli (React):**
```javascript
import { generateUploadButton } from "@uploadthing/react";

const UploadButton = generateUploadButton({
  url: "http://localhost:5000/api/uploadthing",
});

// Pattern rasm yuklash
<UploadButton
  endpoint="patternImage"
  headers={{ Authorization: `Bearer ${token}` }}
  onClientUploadComplete={(res) => {
    console.log(res[0].url); // UploadThing URL
  }}
/>
```

---

## 🏗️ UploadThing Workflow

1. **Admin** frontend da rasm/fayllarni UploadThing ga yuklaydi
2. UploadThing `url` va `key` qaytaradi
3. Admin bu `url`/`key`larni `POST /api/patterns` ga yuboradi
4. Backend faqat metadata (URL, key) ni MongoDB da saqlaydi
5. Pattern o'chirilganda: `utapi.deleteFiles(key)` bilan UploadThing dan ham o'chiriladi

---

## 🔄 Payme Workflow

```
Frontend → Payme SDK → POST /api/payme (CheckPerformTransaction)
                     → POST /api/payme (CreateTransaction)
                     → POST /api/payme (PerformTransaction)
                     → Purchase.paymeState = 2 → Pattern yuklab olish imkoniyati
```

---

## 🌍 Environment Variables

| Kalit | Tavsif |
|-------|--------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT imzolash uchun maxfiy kalit |
| `JWT_EXPIRES` | Token muddati (masalan: `7d`) |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase private key |
| `UPLOADTHING_SECRET` | UploadThing secret key |
| `UPLOADTHING_APP_ID` | UploadThing app ID |
| `PAYME_MERCHANT_ID` | Payme merchant ID |
| `PAYME_LOGIN` | Payme login (odatda: `Paycom`) |
| `PAYME_TEST_PASSWORD` | Test muhit paroli |
| `PAYME_PROD_PASSWORD` | Ishlab chiqarish muhiti paroli |
| `PAYME_MIN_AMOUNT` | Minimal to'lov summasi (tiyin) |
| `PAYME_MAX_AMOUNT` | Maksimal to'lov summasi (tiyin) |
| `NODE_ENV` | `development` yoki `production` |
| `ADMIN_EMAIL` | Birinchi admin yaratiladi shu email bilan |

---

## 📊 Standart Response Formati

```json
// Muvaffaqiyatli
{
  "success": true,
  "message": "...",
  "data": { ... }
}

// Xato
{
  "success": false,
  "message": "Xato tavsifi"
}

// Pagination bilan
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

---

## 🐳 Docker

```bash
# Faqat MongoDB
docker-compose up mongo -d

# Hammasi
docker-compose up --build

# Log ko'rish
docker-compose logs -f app

# To'xtatish va o'chirish
docker-compose down -v
```
