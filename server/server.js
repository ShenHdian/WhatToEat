const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, "dishes.json");

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
