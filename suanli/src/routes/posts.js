const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 获取所有文章（公开）
router.get('/', (req, res) => {
  const posts = db.prepare(`
    SELECT posts.*, users.username as author_name
    FROM posts
    JOIN users ON posts.author_id = users.id
    ORDER BY posts.created_at DESC
  `).all();
  res.json(posts);
});

// 获取单篇文章（公开）
router.get('/:id', (req, res) => {
  const post = db.prepare(`
    SELECT posts.*, users.username as author_name
    FROM posts
    JOIN users ON posts.author_id = users.id
    WHERE posts.id = ?
  `).get(req.params.id);

  if (!post) {
    return res.status(404).json({ error: '文章不存在' });
  }
  res.json(post);
});

// 创建文章（需要登录）
router.post('/', authMiddleware, (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: '标题和内容不能为空' });
  }

  const result = db.prepare(
    'INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)'
  ).run(title, content, req.userId);

  res.status(201).json({
    message: '文章创建成功',
    postId: result.lastInsertRowid
  });
});

// 更新文章（需要登录，只能修改自己的文章）
router.put('/:id', authMiddleware, (req, res) => {
  const { title, content } = req.body;

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) {
    return res.status(404).json({ error: '文章不存在' });
  }
  if (post.author_id !== req.userId) {
    return res.status(403).json({ error: '无权修改他人的文章' });
  }

  db.prepare(
    'UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(title || post.title, content || post.content, req.params.id);

  res.json({ message: '文章更新成功' });
});

// 删除文章（需要登录，只能删除自己的文章）
router.delete('/:id', authMiddleware, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) {
    return res.status(404).json({ error: '文章不存在' });
  }
  if (post.author_id !== req.userId) {
    return res.status(403).json({ error: '无权删除他人的文章' });
  }

  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ message: '文章删除成功' });
});

module.exports = router;
