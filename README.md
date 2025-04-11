# AI策略生成工具

一个基于AI的策略生成工具，支持文字对话和图片生成功能。

## 功能特点

- 支持手机号和邮箱验证码登录
- 文字对话功能
  - 支持deepseek和GPT-4o两种模型
  - 支持多轮对话
  - 支持重新生成回复
  - 支持复制回复内容
- 图片生成功能
  - 支持文生图和图生图
  - 使用GPT-4o模型
  - 支持查看生成历史

## 技术栈

### 前端

- React + TypeScript
- Redux Toolkit (状态管理)
- React Router (路由)
- Ant Design (UI组件库)
- Styled Components (样式)
- Vite (构建工具)

### 后端

- Node.js + TypeScript
- Express (Web框架)
- MongoDB (数据库)
- Redis (缓存)
- JWT (认证)
- Zod (数据验证)
- Winston (日志)

## 开发环境要求

- Node.js 18+
- MongoDB 4.4+
- Redis 6+

## 安装和运行

1. 克隆项目

```bash
git clone <repository-url>
cd ai-policy-generation-tool
```

2. 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

3. 配置环境变量

在backend目录下创建.env文件：

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-policy-gen
REDIS_URI=redis://localhost:6379
JWT_SECRET=your-secret-key
```

4. 启动开发服务器

```bash
# 启动后端服务器
cd backend
npm run dev

# 启动前端开发服务器
cd frontend
npm run dev
```

前端服务器将在 http://localhost:3000 运行
后端服务器将在 http://localhost:5000 运行

## 生产环境部署

1. 构建前端

```bash
cd frontend
npm run build
```

2. 构建后端

```bash
cd backend
npm run build
```

3. 启动生产服务器

```bash
cd backend
npm start
```

## API文档

### 认证相关

- POST /api/auth/send-code - 发送验证码
- POST /api/auth/login/phone - 手机号登录
- POST /api/auth/login/email - 邮箱登录

### 文字对话

- GET /api/chat - 获取对话列表
- POST /api/chat - 创建新对话
- POST /api/chat/:conversationId/messages - 发送消息
- POST /api/chat/:conversationId/regenerate/:messageId - 重新生成回复

### 图片生成

- GET /api/image-gen - 获取图片对话列表
- POST /api/image-gen - 创建新图片对话
- POST /api/image-gen/:conversationId/generate - 生成图片

## 贡献指南

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

MIT