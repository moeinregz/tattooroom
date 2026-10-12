const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const {
  identifyCustomer,
  findCustomer,
  findCustomerById,
  toProfile,
  registerCustomer,
  loginCustomer,
} = require('../utils/customers');
const { readCustomers, writeCustomers, readProducts } = require('../utils/db');
const { requireCustomerAuth } = require('../middleware/customerAuth');

const router = express.Router();

function signCustomerToken(customer) {
  return jwt.sign({ customerId: customer.id, phone: customer.phone }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// ---- public: find-or-create a lightweight profile by phone (anonymous loyalty flow) ----
router.post('/identify', (req, res) => {
  const { phone, name } = req.body || {};
  if (!phone || phone.trim().length < 6) {
    return res.status(400).json({ message: 'شماره تماس معتبر وارد کنید.' });
  }
  const profile = identifyCustomer(phone, name);
  res.json(profile);
});

// ---- public: register a real account (phone + password) ----
router.post('/register', (req, res) => {
  const { phone, name, password } = req.body || {};
  if (!phone || phone.trim().length < 6) {
    return res.status(400).json({ message: 'شماره تماس معتبر وارد کنید.' });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'نام خود را وارد کنید.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' });
  }

  try {
    const customer = registerCustomer({ phone, name, password });
    const token = signCustomerToken(customer);
    res.status(201).json({ token, profile: toProfile(customer) });
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message });
  }
});

// ---- public: login ----
router.post('/login', (req, res) => {
  const { phone, password } = req.body || {};
  if (!phone || !password) {
    return res.status(400).json({ message: 'شماره تماس و رمز عبور را وارد کنید.' });
  }
  try {
    const customer = loginCustomer(phone, password);
    const token = signCustomerToken(customer);
    res.json({ token, profile: toProfile(customer) });
  } catch (err) {
    res.status(err.status || 400).json({ message: err.message });
  }
});

// ---- protected: current account ----
router.get('/me', requireCustomerAuth, (req, res) => {
  const customer = findCustomerById(req.customerId);
  if (!customer) return res.status(404).json({ message: 'حساب کاربری پیدا نشد.' });
  res.json(toProfile(customer));
});

router.put('/me', requireCustomerAuth, (req, res) => {
  const customers = readCustomers();
  const idx = customers.findIndex((c) => c.id === req.customerId);
  if (idx === -1) return res.status(404).json({ message: 'حساب کاربری پیدا نشد.' });

  const { name, email } = req.body || {};
  customers[idx] = {
    ...customers[idx],
    name: name !== undefined ? String(name).trim() || customers[idx].name : customers[idx].name,
    email: email !== undefined ? String(email).trim() : customers[idx].email || '',
  };

  writeCustomers(customers);
  res.json(toProfile(customers[idx]));
});

// ---- protected: addresses ----
router.post('/me/addresses', requireCustomerAuth, (req, res) => {
  const { title, province, city, address, postalCode, receiverPhone } = req.body || {};
  if (!address || !city) {
    return res.status(400).json({ message: 'شهر و آدرس الزامی است.' });
  }

  const customers = readCustomers();
  const idx = customers.findIndex((c) => c.id === req.customerId);
  if (idx === -1) return res.status(404).json({ message: 'حساب کاربری پیدا نشد.' });

  const newAddress = {
    id: `addr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    title: title || 'آدرس',
    province: province || '',
    city,
    address,
    postalCode: postalCode || '',
    receiverPhone: receiverPhone || customers[idx].phone,
  };

  customers[idx].addresses = [...(customers[idx].addresses || []), newAddress];
  writeCustomers(customers);
  res.status(201).json(toProfile(customers[idx]));
});

router.delete('/me/addresses/:addressId', requireCustomerAuth, (req, res) => {
  const customers = readCustomers();
  const idx = customers.findIndex((c) => c.id === req.customerId);
  if (idx === -1) return res.status(404).json({ message: 'حساب کاربری پیدا نشد.' });

  customers[idx].addresses = (customers[idx].addresses || []).filter((a) => a.id !== req.params.addressId);
  writeCustomers(customers);
  res.json(toProfile(customers[idx]));
});

// ---- protected: wishlist (reuses the existing product like/likedBy system) ----
router.get('/me/wishlist', requireCustomerAuth, (req, res) => {
  const products = readProducts();
  const liked = products.filter((p) => (p.likedBy || []).includes(req.customerId));
  res.json(
    liked.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      category: p.category,
      shortDescription: p.shortDescription,
      stock: p.stock,
      likedBy: p.likedBy || [],
    }))
  );
});

// ---- public: fetch an existing (anonymous loyalty) profile by phone — used to restore session ----
router.get('/:phone', (req, res) => {
  const customer = findCustomer(req.params.phone);
  if (!customer) return res.status(404).json({ message: 'کاربری با این شماره پیدا نشد.' });
  res.json(toProfile(customer));
});

module.exports = router;
