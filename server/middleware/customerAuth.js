const jwt = require('jsonwebtoken');

function requireCustomerAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'برای این بخش باید وارد حساب کاربری‌ات بشی.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.customerId) {
      return res.status(401).json({ message: 'نشست نامعتبر است.' });
    }
    req.customerId = payload.customerId;
    req.customerPhone = payload.phone;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'نشست شما منقضی شده، دوباره وارد شو.' });
  }
}

module.exports = { requireCustomerAuth };
