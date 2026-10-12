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


## متغیرهای محیطی (Vercel → Settings → Environment Variables)
`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, `MONGODB_URI`
(برای تتو‌روم: `SITE_URL` هم)

## دیتابیس
داده‌ها توی MongoDB Atlas ذخیره می‌شن. بار اول که سایت بالا میاد، محتوای فایل‌های `data/*.json` خودکار توی دیتابیس ریخته می‌شه.
تصاویر آپلودشده از داشبورد هم توی همون دیتابیس (کالکشن `uploads`) نگه داشته می‌شن.
