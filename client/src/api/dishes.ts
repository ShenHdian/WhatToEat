import type { Dish } from "../types/dish";

const API_BASE = "/api";

export async function fetchDishes(): Promise<Dish[]> {
  const res = await fetch(`${API_BASE}/dishes`);
  if (!res.ok) throw new Error("获取菜品列表失败");
  return res.json();
}

export async function addDish(name: string): Promise<Dish> {
  const res = await fetch(`${API_BASE}/dishes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "添加失败");
  }
  return res.json();
}

export async function updateDish(id: string, name: string): Promise<Dish> {
  const res = await fetch(`${API_BASE}/dishes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "更新失败");
  }
  return res.json();
}

export async function deleteDish(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/dishes/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "删除失败");
  }
}

export async function getRandomDish(): Promise<Dish> {
  const res = await fetch(`${API_BASE}/dishes/random`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "还没有菜品");
  }
  return res.json();
}
