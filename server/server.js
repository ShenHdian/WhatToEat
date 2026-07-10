const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, "dishes.json");
const HISTORY_FILE = path.join(__dirname, "history.json");

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
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Error reading history.json:", e.message);
  }
  return [];
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
}

// 获取 cutoff 时间：今天凌晨 4:00（若当前<4点则用昨天凌晨4点）
function getCutoffTime() {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(4, 0, 0, 0);
  if (now < cutoff) {
    // 还没到今早4点，回退一天
    cutoff.setDate(cutoff.getDate() - 1);
  }
  return cutoff;
}

// 过滤历史：只保留 cutoff 之后的记录
function getFilteredHistory() {
  const cutoff = getCutoffTime();
  return loadHistory().filter((h) => new Date(h.createdAt) >= cutoff);
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
  const record = {
    id: uuidv4(),
    dishName: dishName.trim(),
    createdAt: new Date().toISOString(),
  };
  history.push(record);
  saveHistory(history);
  // 返回过滤后的列表（前端直接更新）
  res.status(201).json(getFilteredHistory());
});


// DELETE /api/history/:id — 删除一条摇菜记录
app.delete("/api/history/:id", (req, res) => {
  const history = loadHistory();
  const index = history.findIndex((h) => h.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "记录不存在" });
  }
  history.splice(index, 1);
  saveHistory(history);
  res.json(getFilteredHistory());
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

app.listen(PORT, () => {
  console.log(`🍳 后端服务已启动: http://localhost:${PORT}`);
});
