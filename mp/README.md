# WhatToEat 微信小程序

## 初始化

cd mp
pnpm install
pnpm run dev:weapp

然后用微信开发者工具打开 mp 目录

## 目录结构

src/
├── api/index.ts        # API 封装层
├── pages/index/        # 首页（随机选菜 + 菜品管理 + 打赏）
├── pages/calendar/     # 日历食记本
├── pages/mine/         # 个人中心（微信登录 + 打赏）
├── assets/             # tabbar 图标
├── app.config.ts       # 全局配置
└── app.ts              # 入口
