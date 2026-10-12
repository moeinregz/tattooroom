// لایه‌ی ذخیره‌سازی: MongoDB Atlas (اگه MONGODB_URI تنظیم شده باشه)،
// وگرنه فایل‌های JSON داخل پوشه‌ی data/ (فقط برای اجرای محلی).
//
// API قبلی (readProducts / writeProducts / ...) بدون تغییر مونده.
// قبل از هر درخواست، داده‌ها یک بار لود می‌شن (dbMiddleware) و بعد از
// اتمام هندلر، فقط تغییرات (آیتم‌های جدید/ویرایش‌شده/حذف‌شده) ذخیره می‌شن.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { AsyncLocalStorage } = require('async_hooks');

const als = new AsyncLocalStorage();

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');
const NAMES = ['products', 'reviews', 'customers', 'articles', 'orders'];

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB; // اختیاری؛ وگرنه اسم دیتابیس از داخل URI خونده می‌شه
const useMongo = () => !!process.env.MONGODB_URI;

// ---------------------------------------------------------------- Mongo

let clientPromise = null;
function getDb() {
  if (!clientPromise) {
    const { MongoClient } = require('mongodb');
    clientPromise = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000,
    })
      .connect()
      .catch((err) => {
        clientPromise = null;
        throw err;
      });
  }
  return clientPromise.then((client) => client.db(process.env.MONGODB_DB || undefined));
}

function readSeed(name) {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, `${name}.json`), 'utf-8');
    const data = JSON.parse(raw || '[]');
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

async function loadMongo() {
  const db = await getDb();
  const data = {};
  const snap = {};

  await Promise.all(
    NAMES.map(async (name) => {
      const col = db.collection(name);
      let docs = await col.find({}).sort({ _o: 1 }).toArray();

      // اولین بار که کالکشن خالیه، از فایل‌های JSON قبلی داده‌ی اولیه می‌ریزیم
      if (docs.length === 0) {
        const seed = readSeed(name);
        if (seed.length) {
          await col.bulkWrite(
            seed.map((item, i) => ({
              updateOne: {
                filter: { _id: String(item.id) },
                update: { $setOnInsert: { ...item, _o: i } },
                upsert: true,
              },
            })),
            { ordered: false }
          );
          docs = await col.find({}).sort({ _o: 1 }).toArray();
        }
      }

      const map = new Map();
      data[name] = docs.map((d) => {
        const { _id, _o, ...item } = d;
        map.set(String(_id), { o: _o, json: JSON.stringify(item) });
        return item;
      });
      snap[name] = map;
    })
  );

  return { data, snap, dirty: new Set(), mongo: true };
}

async function flushMongo(store) {
  const db = await getDb();
  for (const name of store.dirty) {
    const items = store.data[name];
    const snap = store.snap[name];
    const ops = [];
    const seen = new Set();

    let maxO = -1;
    for (const s of snap.values()) if (s.o > maxO) maxO = s.o;

    for (const item of items) {
      const id = String(item.id);
      seen.add(id);
      const json = JSON.stringify(item);
      const prev = snap.get(id);
      if (!prev) {
        maxO += 1;
        ops.push({ replaceOne: { filter: { _id: id }, replacement: { ...item, _o: maxO }, upsert: true } });
      } else if (prev.json !== json) {
        ops.push({ replaceOne: { filter: { _id: id }, replacement: { ...item, _o: prev.o }, upsert: true } });
      }
    }
    for (const id of snap.keys()) {
      if (!seen.has(id)) ops.push({ deleteOne: { filter: { _id: id } } });
    }

    if (ops.length) await db.collection(name).bulkWrite(ops, { ordered: false });
  }
}

// ---------------------------------------------------------------- Files (local dev)

function loadFiles() {
  const data = {};
  NAMES.forEach((name) => {
    data[name] = readSeed(name);
  });
  return { data, dirty: new Set(), mongo: false };
}

function flushFiles(store) {
  for (const name of store.dirty) {
    fs.writeFileSync(path.join(DATA_DIR, `${name}.json`), JSON.stringify(store.data[name], null, 2), 'utf-8');
  }
}

// ---------------------------------------------------------------- Middleware

async function dbMiddleware(req, res, next) {
  try {
    const store = useMongo() ? await loadMongo() : loadFiles();

    const origEnd = res.end.bind(res);
    let flushing = false;
    res.end = function patchedEnd(...args) {
      if (flushing || store.dirty.size === 0) return origEnd(...args);
      flushing = true;
      Promise.resolve()
        .then(() => (store.mongo ? flushMongo(store) : flushFiles(store)))
        .then(() => origEnd(...args))
        .catch((err) => {
          console.error('DB write failed:', err);
          res.statusCode = 500;
          res.removeHeader('Content-Length');
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          origEnd(JSON.stringify({ message: 'ذخیره‌سازی اطلاعات با خطا مواجه شد.' }));
        });
      return res;
    };

    als.run(store, next);
  } catch (err) {
    console.error('DB connection failed:', err);
    res.status(500).json({ message: 'اتصال به دیتابیس برقرار نشد.' });
  }
}

function currentStore() {
  const store = als.getStore();
  if (!store) throw new Error('db accessed outside of a request (dbMiddleware missing)');
  return store;
}

const read = (name) => currentStore().data[name];
const write = (name, value) => {
  const store = currentStore();
  store.data[name] = value;
  store.dirty.add(name);
};

// ---------------------------------------------------------------- Uploads

// بعد از multer.memoryStorage() صدا زده می‌شه؛ تصویر رو توی Mongo (یا در حالت محلی روی دیسک) ذخیره می‌کنه
async function persistUpload(req, res, next) {
  try {
    if (!req.file) return next();
    const ext = path.extname(req.file.originalname || '') || '.jpg';
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;

    if (useMongo()) {
      const db = await getDb();
      await db.collection('uploads').insertOne({
        _id: filename,
        contentType: req.file.mimetype,
        data: req.file.buffer,
        createdAt: new Date(),
      });
    } else {
      if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      fs.writeFileSync(path.join(UPLOADS_DIR, filename), req.file.buffer);
    }

    req.file.filename = filename;
    next();
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ message: 'ذخیره‌ی تصویر با خطا مواجه شد.' });
  }
}

// GET /uploads/:name — اول از Mongo، اگه نبود می‌ره سراغ فایل‌های public/uploads
async function serveUpload(req, res, next) {
  if (!useMongo()) return next();
  try {
    const db = await getDb();
    const doc = await db.collection('uploads').findOne({ _id: req.params.name });
    if (!doc) return next();
    const buf = doc.data && doc.data.buffer ? Buffer.from(doc.data.buffer) : Buffer.from(doc.data);
    res.setHeader('Content-Type', doc.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.end(buf);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  dbMiddleware,
  persistUpload,
  serveUpload,
  readProducts: () => read('products'),
  writeProducts: (d) => write('products', d),
  readReviews: () => read('reviews'),
  writeReviews: (d) => write('reviews', d),
  readCustomers: () => read('customers'),
  writeCustomers: (d) => write('customers', d),
  readArticles: () => read('articles'),
  writeArticles: (d) => write('articles', d),
  readOrders: () => read('orders'),
  writeOrders: (d) => write('orders', d),
};
