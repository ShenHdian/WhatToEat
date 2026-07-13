const express = require("express");
require("express-async-errors");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { knex, initDB, getBizDate } = require("./db");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: __dirname + "/.env" });

const app = express();
const PORT = process.env.PORT || 3001;
const clientDist = path.join(__dirname, "..", "client", "dist");

app.use(cors());
app.use(express.json());

// Serve static files in production
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

// ─── Dishes API (keep JSON) ──────────────────────────────
const DATA_FILE = path.join(__dirname, "dishes.json");

function loadDishes() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Error reading dishes.json:", e.message);
  }
  return [];
}

function saveDishes(dishes) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(dishes, null, 2), "utf-8");
}

app.get("/api/dishes", (req, res) => res.json(loadDishes()));

app.post("/api/dishes", (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "菜品名称不能为空" });
  const dishes = loadDishes();
  const newDish = { id: require("uuid").v4(), name: name.trim(), createdAt: new Date().toISOString() };
  dishes.push(newDish);
  saveDishes(dishes);
  res.status(201).json(newDish);
});

app.put("/api/dishes/:id", (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "菜品名称不能为空" });
  const dishes = loadDishes();
  const idx = dishes.findIndex((d) => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "菜品不存在" });
  dishes[idx].name = name.trim();
  dishes[idx].updatedAt = new Date().toISOString();
  saveDishes(dishes);
  res.json(dishes[idx]);
});

app.delete("/api/dishes/:id", (req, res) => {
  const dishes = loadDishes();
  const idx = dishes.findIndex((d) => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "菜品不存在" });
  const deleted = dishes.splice(idx, 1)[0];
  saveDishes(dishes);
  res.json(deleted);
});

app.get("/api/dishes/random", (req, res) => {
  const dishes = loadDishes();
  if (dishes.length === 0) return res.status(404).json({ error: "还没有菜品，请先添加" });
  res.json(dishes[Math.floor(Math.random() * dishes.length)]);
});

// ─── History API (Knex) ─────────────────────────────────

// GET /api/history — 获取今天的摇菜记录（最新3条）
app.get("/api/history", async (req, res) => {
  const rows = await knex("history")
    .where({ date: getBizDate() })
    .orderBy("created_at", "desc")
    .limit(3);
  res.json(rows.map((r) => r.dish_name));
});

// POST /api/history — 添加一条摇菜记录（每天最多保留3条）
app.post("/api/history", async (req, res) => {
  const { dishName } = req.body;
  if (!dishName || !dishName.trim()) return res.status(400).json({ error: "菜品名称不能为空" });
  const bizDate = getBizDate();

  await knex("history").insert({
    dish_name: dishName.trim(),
    date: bizDate,
    created_at: new Date().toISOString(),
  });

  // 删除该天超出3条的旧记录
  const rows = await knex("history").where({ date: bizDate }).orderBy("created_at", "asc");
  if (rows.length > 3) {
    const idsToDelete = rows.slice(0, rows.length - 3).map((r) => r.id);
    await knex("history").whereIn("id", idsToDelete).del();
  }

  const recent = await knex("history")
    .where({ date: bizDate })
    .orderBy("created_at", "desc")
    .limit(3);
  res.status(201).json(recent.map((r) => r.dish_name));
});

// ─── Calendar API ────────────────────────────────────────

app.get("/api/calendar", async (req, res) => {
  const { month } = req.query;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "参数格式错误，请使用 YYYY-MM" });
  }

  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const result = {};
  for (let d = 1; d <= daysInMonth; d++) {
    result[`${month}-${String(d).padStart(2, "0")}`] = { dishes: [], commentCount: 0 };
  }

  // 从数据库取该月所有历史记录
  const startDate = `${month}-01`;
  const endDate = `${month}-${String(daysInMonth).padStart(2, "0")}`;
  const historyRows = await knex("history")
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .orderBy("created_at", "desc");

  historyRows.forEach((r) => {
    if (result[r.date] && result[r.date].dishes.length < 3) {
      result[r.date].dishes.push(r.dish_name);
    }
  });

  // 评论计数
  const commentRows = await knex("comments")
    .where("date", ">=", startDate)
    .where("date", "<=", endDate);

  commentRows.forEach((r) => {
    if (result[r.date]) {
      result[r.date].commentCount++;
    }
  });

  res.json(result);
});

// ─── Comments API (Knex) ─────────────────────────────────

app.post("/api/comments", async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: "评论内容不能为空" });

  await knex("comments").insert({
    content: content.trim(),
    date: getBizDate(),
    created_at: new Date().toISOString(),
  });

  const record = await knex("comments").orderBy("created_at", "desc").first();
  res.status(201).json({
    id: String(record.id),
    content: record.content,
    createdAt: record.created_at,
  });
});

app.get("/api/comments", async (req, res) => {
  const { date, month } = req.query;

  if (month) {
    const rows = await knex("comments")
      .where("date", "like", `${month}%`)
      .select(knex.raw("DISTINCT substr(date, 9, 2) as day"));
    const days = rows.map((r) => String(parseInt(r.day))).filter(Boolean).sort((a, b) => a - b);
    return res.json(days);
  }

  if (date) {
    const rows = await knex("comments")
      .where({ date })
      .orderBy("created_at", "asc");
    return res.json(
      rows.map((r) => ({ id: String(r.id), content: r.content, createdAt: r.created_at }))
    );
  }

  // 最近3天 grouped
  const rows = await knex("comments").orderBy("created_at", "desc");
  const grouped = {};
  rows.forEach((r) => {
    if (!grouped[r.date]) grouped[r.date] = [];
    grouped[r.date].push({ id: String(r.id), content: r.content, createdAt: r.created_at });
  });
  const sorted = Object.keys(grouped).sort().reverse().slice(0, 3);
  const result = {};
  sorted.forEach((d) => {
    result[d] = grouped[d].reverse();
  });
  res.json(result);
});

app.delete("/api/comments/:id", async (req, res) => {
  await knex("comments").where({ id: parseInt(req.params.id) }).del();
  res.json({ success: true });
});


// ─── Auth API ─────────────────────────────────────────────

app.post("/api/auth/wx-login", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "缺少 code" });

  const appid = process.env.WX_APPID;
  const secret = process.env.WX_SECRET;
  if (!appid || !secret) return res.status(500).json({ error: "未配置微信登录" });

  // 向微信服务器换取 openid
  const wxRes = await fetch(`https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`);
  const wxData = await wxRes.json();

  if (wxData.errcode) {
    console.error("微信登录失败:", wxData);
    return res.status(400).json({ error: "微信登录失败" });
  }

  const { openid, session_key } = wxData;

  // 查找或创建用户
  let user = await knex("users").where({ openid }).first();
  if (!user) {
    const [id] = await knex("users").insert({
      openid,
      nickname: "微信用户",
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    });
    user = await knex("users").where({ id }).first();
  } else {
    await knex("users").where({ openid }).update({ last_login: new Date().toISOString() });
  }

  // 生成 JWT
  const token = jwt.sign(
    { id: user.id, openid: user.openid },
    process.env.JWT_SECRET || "whattoeat-secret-key",
    { expiresIn: "30d" }
  );

  res.json({
    token,
    user: { id: user.id, nickname: user.nickname, avatar: user.avatar },
  });
});

// ─── Health ──────────────────────────────────────────────

app.get("/api/health", async (req, res) => {
  const dishCount = loadDishes().length;
  res.json({ status: "ok", dishCount });
});

// ─── SPA fallback ───────────────────────────────────────

app.get("*", (req, res) => {
  const indexPath = path.join(clientDist, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

// ─── Global Error Handler ──────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "服务器内部错误" });
});

initDB().then(() => {
  app.listen(PORT, () => {
  console.log(`🍳 后端服务已启动: http://localhost:${PORT}`);
  });
}).catch((e) => console.error("DB init error:", e));
