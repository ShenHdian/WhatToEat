const path = require("path");
const DB_PATH = path.join(__dirname, "data.db");

const knex = require("knex")({
  client: "better-sqlite3",
  connection: { filename: DB_PATH },
  useNullAsDefault: true,
});

// 建表（如果不存在）
async function initDB() {
  const hasHistory = await knex.schema.hasTable("history");
  if (!hasHistory) {
    await knex.schema.createTable("history", (t) => {
      t.increments("id").primary();
      t.string("dish_name").notNullable();
      t.string("date", 10).notNullable().index(); // YYYY-MM-DD
      t.timestamp("created_at").defaultTo(knex.fn.now());
    });
    console.log("Created table: history");
  }

  const hasComments = await knex.schema.hasTable("comments");
  if (!hasComments) {
    await knex.schema.createTable("comments", (t) => {
      t.increments("id").primary();
      t.text("content").notNullable();
      t.string("date", 10).notNullable().index(); // YYYY-MM-DD
      t.timestamp("created_at").defaultTo(knex.fn.now());
    });
    console.log("Created table: comments");
  const hasUsers = await knex.schema.hasTable("users");
  if (!hasUsers) {
    await knex.schema.createTable("users", (t) => {
      t.increments("id").primary();
      t.string("openid", 64).notNullable().unique();
      t.string("nickname", 64);
      t.string("avatar", 256);
      t.timestamp("created_at").defaultTo(knex.fn.now());
      t.timestamp("last_login").defaultTo(knex.fn.now());
    });
    console.log("Created table: users");
  }
  }

  // 迁移旧 JSON 数据
  await migrateFromJSON(knex);
}

// 从旧 JSON 文件迁移数据
async function migrateFromJSON(knex) {
  const fs = require("fs");

  // 迁移 history.json（旧数组格式或新对象格式）
  if (fs.existsSync(path.join(__dirname, "history.json"))) {
    const raw = fs.readFileSync(path.join(__dirname, "history.json"), "utf-8");
    if (raw && raw !== "{}" && raw !== "[]") {
      try {
        const data = JSON.parse(raw);
        const count = await knex("history").count("id as c").first();
        if (count && count.c === 0) {
          // 旧数组格式: [{ dishName, createdAt, bizDate }]
          if (Array.isArray(data)) {
            const rows = data
              .filter((r) => r.dishName && r.bizDate)
              .map((r) => ({
                dish_name: r.dishName,
                date: r.bizDate,
                created_at: r.createdAt,
              }));
            if (rows.length > 0) {
              await knex("history").insert(rows);
              console.log(`Migrated ${rows.length} history records`);
            }
          }
          // 新对象格式: { "2026-07-12": ["菜1", "菜2"] }
          if (!Array.isArray(data)) {
            const rows = [];
            Object.entries(data).forEach(([date, dishes]) => {
              if (Array.isArray(dishes)) {
                dishes.forEach((dishName, idx) => {
                  rows.push({
                    dish_name: dishName,
                    date: date,
                    created_at: `${date}T${String(8 + idx).padStart(2, "0")}:00:00.000Z`,
                  });
                });
              }
            });
            if (rows.length > 0) {
              await knex("history").insert(rows);
              console.log(`Migrated ${rows.length} history records from object`);
            }
          }
        }
      } catch (e) {
        console.error("History migration error:", e.message);
      }
    }
  }

  // 迁移 comments.json
  if (fs.existsSync(path.join(__dirname, "comments.json"))) {
    const raw = fs.readFileSync(path.join(__dirname, "comments.json"), "utf-8");
    if (raw && raw !== "[]" && raw !== "{}") {
      try {
        const data = JSON.parse(raw);
        const count = await knex("comments").count("id as c").first();
        if (count && count.c === 0 && Array.isArray(data) && data.length > 0) {
          const rows = data
            .filter((r) => r.content && r.bizDate)
            .map((r) => ({
              content: r.content,
              date: r.bizDate || r.createdAt?.slice(0, 10),
              created_at: r.createdAt,
            }));
          if (rows.length > 0) {
            await knex("comments").insert(rows);
            console.log(`Migrated ${rows.length} comment records`);
          }
        }
      } catch (e) {
        console.error("Comments migration error:", e.message);
      }
    }
  }
}

// 获取业务日期（北京时间，中午12点前归前一天）
function getBizDate() {
  const now = new Date();
  const cst = new Date(now.getTime() + 8 * 3600000);
  const d = new Date(cst);
  if (d.getHours() < 12) {
    d.setDate(d.getDate() - 1);
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

module.exports = { knex, initDB, getBizDate };
