// فقط برای اجرای محلی (npm run dev). روی Vercel از api/index.js استفاده می‌شه.
const app = require('./app.cjs');
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
