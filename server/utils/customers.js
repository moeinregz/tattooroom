const crypto = require('crypto');
const { readCustomers, writeCustomers } = require('./db');

function normalizePhone(phone) {
  return String(phone || '').trim();
}

// ---- password hashing (scrypt, built into Node — no extra dependency) ----
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  try {
    const hashBuffer = Buffer.from(hash, 'hex');
    const testHash = crypto.scryptSync(String(password), salt, 64);
    return hashBuffer.length === testHash.length && crypto.timingSafeEqual(hashBuffer, testHash);
  } catch (err) {
    return false;
  }
}

function findCustomer(phone) {
  const customers = readCustomers();
  return customers.find((c) => c.phone === normalizePhone(phone));
}

function findCustomerById(id) {
  const customers = readCustomers();
  return customers.find((c) => c.id === id);
}

function toProfile(customer) {
  if (!customer) return null;
  return {
    id: customer.id,
    phone: customer.phone,
    name: customer.name,
    email: customer.email || '',
    hasAccount: !!customer.password,
    addresses: customer.addresses || [],
    points: customer.points,
    history: [...(customer.history || [])]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20),
    createdAt: customer.createdAt,
  };
}

// Finds-or-creates a customer record and grants a one-time welcome bonus on creation.
// (Lightweight, password-less — used by the anonymous like/review/buy-intent flows.)
function identifyCustomer(phone, name) {
  const p = normalizePhone(phone);
  const customers = readCustomers();
  let customer = customers.find((c) => c.phone === p);

  if (!customer) {
    customer = {
      id: `c-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      phone: p,
      name: name || 'کاربر',
      points: 20,
      addresses: [],
      cart: [],
      history: [{ amount: 20, reason: 'welcome', label: 'امتیاز خوش‌آمدگویی', date: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };
    customers.push(customer);
  } else if (name && name !== customer.name) {
    customer.name = name;
  }

  writeCustomers(customers);
  return toProfile(customer);
}

function hasReason(customer, reason) {
  return (customer.history || []).some((h) => h.reason === reason);
}

function addPoints(phone, name, amount, reason, label) {
  const p = normalizePhone(phone);
  const customers = readCustomers();
  let customer = customers.find((c) => c.phone === p);

  if (!customer) {
    customer = { phone: p, name: name || 'کاربر', points: 0, history: [], createdAt: new Date().toISOString() };
    customers.push(customer);
  }

  customer.points += amount;
  customer.history.push({ amount, reason, label: label || reason, date: new Date().toISOString() });
  writeCustomers(customers);
  return toProfile(customer);
}

// ---- real accounts (phone + password) ----

// Registers a new account, or "upgrades" an existing password-less loyalty
// record (created via identifyCustomer/buy-intent/reviews) into a full account.
function registerCustomer({ phone, name, password }) {
  const p = normalizePhone(phone);
  const customers = readCustomers();
  let customer = customers.find((c) => c.phone === p);

  if (customer && customer.password) {
    const err = new Error('حسابی با این شماره قبلاً ساخته شده. وارد شوید.');
    err.status = 409;
    throw err;
  }

  if (customer) {
    customer.password = hashPassword(password);
    customer.name = name || customer.name;
    if (!customer.id) customer.id = `c-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    if (!customer.addresses) customer.addresses = [];
    if (!customer.cart) customer.cart = [];
  } else {
    customer = {
      id: `c-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      phone: p,
      name: name || 'کاربر',
      password: hashPassword(password),
      points: 20,
      addresses: [],
      cart: [],
      history: [{ amount: 20, reason: 'welcome', label: 'امتیاز خوش‌آمدگویی', date: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
    };
    customers.push(customer);
  }

  writeCustomers(customers);
  return customer;
}

function loginCustomer(phone, password) {
  const customer = findCustomer(phone);
  if (!customer || !customer.password) {
    const err = new Error('حسابی با این شماره پیدا نشد.');
    err.status = 404;
    throw err;
  }
  if (!verifyPassword(password, customer.password)) {
    const err = new Error('رمز عبور اشتباه است.');
    err.status = 401;
    throw err;
  }
  return customer;
}

module.exports = {
  normalizePhone,
  findCustomer,
  findCustomerById,
  toProfile,
  identifyCustomer,
  addPoints,
  hasReason,
  registerCustomer,
  loginCustomer,
};
