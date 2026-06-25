const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// API路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));

// API健康检查
app.get('/api/health', (req, res) => {
  res.json({ message: '博客服务器运行中', status: 'healthy' });
});

// 所有其他路由返回前端应用（处理SPA路由）
app.use((req, res, next) => {
  // 排除API请求
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器已启动: http://localhost:${PORT}`);
  console.log(`前端访问: http://localhost:${PORT}`);
  console.log(`API文档:`);
  console.log(`  POST   /api/auth/register - 用户注册`);
  console.log(`  POST   /api/auth/login    - 用户登录`);
  console.log(`  GET    /api/posts         - 获取所有文章`);
  console.log(`  POST   /api/posts         - 创建文章（需要登录）`);
  console.log(`  GET    /api/posts/:id     - 获取单篇文章`);
  console.log(`  PUT    /api/posts/:id     - 更新文章（需要登录）`);
  console.log(`  DELETE /api/posts/:id     - 删除文章（需要登录）`);
});
