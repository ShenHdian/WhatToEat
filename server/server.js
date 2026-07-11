const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, "dishes.json");
const HISTORY_FILE = path.join(__dirname, "history.json");
const COMMENTS_FILE = path.join(__dirname, "comments.json");

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
const clientDist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

// ─── Data helpers ───────────────────────────────────────────
function loadDishes() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Error reading dishes.json:", e.message);
  }
  return [];
}

function saveDishes(dishes) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(dishes, null, 2), "utf-8");
}

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const raw = fs.readFileSync(HISTORY_FILE, "utf-8");
      const data = JSON.parse(raw);
      // 兼容：旧格式是数组，新格式是对象
      if (Array.isArray(data)) return {};
      return data;
    }
  } catch (e) {
    console.error("Error reading history.json:", e.message);
  }
  return {};
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
}

function loadComments() {
  try {
    if (fs.existsSync(COMMENTS_FILE)) {
      const raw = fs.readFileSync(COMMENTS_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Error reading comments.json:", e.message);
  }
  return [];
}

function saveComments(comments) {
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2), "utf-8");
}

// 中午12点前归前一天，12点后归当天
function getBizDate() {
  const now = new Date();
  const d = new Date(now);
  if (d.getHours() < 12) {
    d.setDate(d.getDate() - 1);
  }
  return d.toISOString().slice(0, 10);
}

// 过滤历史：只保留 bizDate 对应的记录
function getFilteredHistory() {
  const bizDate = getBizDate();
  return loadHistory()[bizDate] || [];
}

// ─── API Routes ─────────────────────────────────────────────

// GET /api/dishes — 获取全部菜品
app.get("/api/dishes", (req, res) => {
  const dishes = loadDishes();
  res.json(dishes);
});

// POST /api/dishes — 添加菜品
app.post("/api/dishes", (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "菜品名称不能为空" });
  }
  const dishes = loadDishes();
  const newDish = {
    id: uuidv4(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };
  dishes.push(newDish);
  saveDishes(dishes);
  res.status(201).json(newDish);
});

// PUT /api/dishes/:id — 编辑菜品
app.put("/api/dishes/:id", (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "菜品名称不能为空" });
  }
  const dishes = loadDishes();
  const index = dishes.findIndex((d) => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "菜品不存在" });
  }
  dishes[index].name = name.trim();
  dishes[index].updatedAt = new Date().toISOString();
  saveDishes(dishes);
  res.json(dishes[index]);
});

// DELETE /api/dishes/:id — 删除菜品
app.delete("/api/dishes/:id", (req, res) => {
  const dishes = loadDishes();
  const index = dishes.findIndex((d) => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "菜品不存在" });
  }
  const deleted = dishes.splice(index, 1)[0];
  saveDishes(dishes);
  res.json(deleted);
});

// GET /api/dishes/random — 随机选取一道菜
app.get("/api/dishes/random", (req, res) => {
  const dishes = loadDishes();
  if (dishes.length === 0) {
    return res.status(404).json({ error: "还没有菜品，请先添加" });
  }
  const picked = dishes[Math.floor(Math.random() * dishes.length)];
  res.json(picked);
});

// ─── History API ───────────────────────────────────────────

// GET /api/history — 获取摇菜记录（自动按4点规则过滤）
app.get("/api/history", (req, res) => {
  const history = getFilteredHistory();
  res.json(history);
});

// POST /api/history — 添加一条摇菜记录
app.post("/api/history", (req, res) => {
  const { dishName } = req.body;
  if (!dishName || !dishName.trim()) {
    return res.status(400).json({ error: "菜品名称不能为空" });
  }
  const history = loadHistory();
  const bizDate = getBizDate();

  if (!history[bizDate]) history[bizDate] = [];
  history[bizDate].push(dishName.trim());
  if (history[bizDate].length > 3) history[bizDate].shift();
  saveHistory(history);
  res.status(201).json(getFilteredHistory());
});




// ─── Calendar API ──────────────────────────────────────────

// GET /api/calendar?month=YYYY-MM — 获取某月每天的汇总数据
app.get("/api/calendar", (req, res) => {
  const { month } = req.query;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: "参数格式错误，请使用 YYYY-MM" });
  }

  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const result = {};

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = month + "-" + String(d).padStart(2, "0");
    result[dateStr] = { dishes: [], commentCount: 0 };
  }

  // 从 history 中取每天的所有菜
  const history = loadHistory();
  Object.keys(history).forEach((day) => {
    if (result[day]) {
      result[day].dishes = history[day];
    }
  });

  // 从 comments 中统计每天数量
  const comments = loadComments();
  comments.forEach((c) => {
    const day = c.bizDate || c.createdAt.slice(0, 10);
    if (result[day]) {
      result[day].commentCount++;
    }
  });

  res.json(result);
});

// ─── Comments API ──────────────────────────────────────────

// POST /api/comments — 添加一条评论
app.post("/api/comments", (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "评论内容不能为空" });
  }
  const comments = loadComments();
  const record = {
    id: uuidv4(),
    content: content.trim(),
    createdAt: new Date().toISOString(),
    bizDate: getBizDate(),
  };
  comments.push(record);
  saveComments(comments);
  res.status(201).json(record);
});

// GET /api/comments?date=YYYY-MM-DD — 获取某天的所有评论
// GET /api/comments/recent — 获取最近3天有评论的数据
// GET /api/comments/calendar?month=YYYY-MM — 获取某月有评论的天
app.get("/api/comments", (req, res) => {
  const { date, month } = req.query;

  if (month) {
    // 日历查询：返回该月有评论的天数组
    const comments = loadComments();
    const days = new Set();
    comments.forEach((c) => {
      const d = new Date(c.createdAt);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (ym === month) {
        days.add(String(d.getDate()));
      }
    });
    return res.json(Array.from(days).sort((a, b) => a - b));
  }

  if (date) {
    // 某天的评论（按 bizDate 或 createdAt 匹配）
    const comments = loadComments();
    const filtered = comments
      .filter((c) => (c.bizDate || c.createdAt.slice(0, 10)) === date)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return res.json(filtered);
  }

  // 最近3天有评论的数据（按天分组）
  const comments = loadComments().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const grouped = {};
  comments.forEach((c) => {
    const day = c.createdAt.slice(0, 10);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(c);
  });

  const sortedDays = Object.keys(grouped).sort().reverse().slice(0, 3);
  const result = {};
  sortedDays.forEach((day) => {
    result[day] = grouped[day].reverse();
  });
  res.json(result);
});

// DELETE /api/comments/:id — 删除一条评论
app.delete("/api/comments/:id", (req, res) => {
  const comments = loadComments();
  const index = comments.findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "评论不存在" });
  }
  comments.splice(index, 1);
  saveComments(comments);
  res.json({ success: true });
});


// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", dishCount: loadDishes().length });
});

// SPA fallback
app.get("*", (req, res) => {
  const indexPath = path.join(clientDist, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: "Not found" });
  }
});


// ─── Auto-init data files ──────────────────────────────
[DATA_FILE, HISTORY_FILE, COMMENTS_FILE].forEach((f) => {
  if (!fs.existsSync(f)) {
    fs.writeFileSync(f, f.endsWith("history.json") ? "{}" : "[]", "utf-8");
    console.log("Created:", path.basename(f));
  }
});

app.listen(PORT, () => {
  console.log(`🍳 后端服务已启动: http://localhost:${PORT}`);
});
