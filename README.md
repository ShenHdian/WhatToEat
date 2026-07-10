# 🍳 今天吃什么 - 随机菜品选取器

一个简单实用的网页应用，帮你解决"今天吃什么"的世纪难题。

## 功能

- **随机选取** — 老虎机滚动动画，随机从你的菜品列表中选一道菜
- **添加菜品** — 随时添加你想吃的菜
- **编辑菜品** — 修改菜品名称
- **删除菜品** — 移除不想吃的菜
- **数据云端存储** — 数据保存在服务器，换设备也不丢失

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite |
| 组件库 | Ant Design 5 |
| 后端 | Node.js + Express |
| 存储 | JSON 文件（dishes.json） |
| 动画 | CSS @keyframes |

## 快速开始

### 开发模式

```bash
# 安装依赖
cd server && npm install
cd ../client && npm install

# 启动后端（终端1）
cd server && npm start

# 启动前端（终端2）
cd client && npm run dev
```

前端默认运行在 `http://localhost:5173`，后端在 `http://localhost:3001`。
Vite 会自动将 `/api` 请求代理到后端。

### 生产模式

```bash
# 一键构建并启动
.\start.bat
```

或手动：

```bash
cd client && npm run build
cd ../server && npm start
```

访问 `http://localhost:3001` 即可使用。

## 部署到云服务器

### 方案一：直接启动（适合轻量使用）

```bash
# 上传项目到服务器，然后
cd /path/to/breakfastRandom
.\start.bat
```

### 方案二：PM2 守护进程（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动
pm2 start server/server.js --name breakfast-random

# 开机自启
pm2 startup
pm2 save
```

### 方案三：Nginx 反代（配合域名）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 修改端口

设置环境变量：

```bash
# Windows
set PORT=8080 && npm start

# Linux/Mac
PORT=8080 npm start
```

## 项目结构

```
breakfastRandom/
├── start.bat              # 一键启动脚本
├── package.json           # 根配置
├── server/
│   ├── server.js          # Express 后端
│   ├── dishes.json        # 菜品数据文件
│   └── package.json
├── client/
│   ├── vite.config.ts     # Vite 配置（含代理）
│   ├── src/
│   │   ├── App.tsx        # 主应用
│   │   ├── App.css        # 全局样式 + 动画
│   │   ├── types/dish.ts  # 类型定义
│   │   ├── api/dishes.ts  # API 封装
│   │   └── components/
│   │       ├── DishList.tsx       # 菜品列表
│   │       ├── AddDishModal.tsx   # 添加/编辑弹窗
│   │       └── RandomPicker.tsx   # 随机选取器
│   └── package.json
└── README.md
```

## API 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /api/dishes | 获取所有菜品 |
| POST | /api/dishes | 添加菜品 |
| PUT | /api/dishes/:id | 编辑菜品 |
| DELETE | /api/dishes/:id | 删除菜品 |
| GET | /api/dishes/random | 随机选取一道菜 |
| GET | /api/health | 健康检查 |

## License

MIT
