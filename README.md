# TattooRoom

یک پروژه‌ی واحد (فرانت + API) آماده‌ی دیپلوی روی Vercel.

```
src/, public/, index.html   ← سایت (React + Vite)
server/                     ← کد API (Express)
api/index.cjs               ← ورودی Serverless Function در Vercel
data/                       ← فایل‌های JSON
public/uploads/             ← تصاویر محصولات
```

## اجرای محلی
```
npm install
npm run dev
```
سایت: http://localhost:5173  (API خودکار proxy می‌شه)

## دیپلوی روی Vercel
1. پروژه رو توی GitHub بذار و import کن (Framework: Vite، بقیه‌ش خودکار از vercel.json).
2. توی Settings → Environment Variables اینا رو بذار: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, `SITE_URL`
