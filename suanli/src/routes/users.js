const express = require('express');
const db = require('../db');

const router = express.Router();

// 获取所有用户（仅返回基本信息，不含密码）
router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, username, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

module.exports = router;