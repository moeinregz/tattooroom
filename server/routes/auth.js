const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Single hardcoded admin account, credentials come from .env.
// Good enough for a one-person dashboard; swap for a real user table later if needed.
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'نام کاربری و رمز عبور را وارد کنید.' });
  }

  const validUser = username === process.env.ADMIN_USERNAME;
  const validPass = password === process.env.ADMIN_PASSWORD;

  if (!validUser || !validPass) {
    return res.status(401).json({ message: 'نام کاربری یا رمز عبور اشتباه است.' });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, username });
});

module.exports = router;
