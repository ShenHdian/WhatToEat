const API = "https://whattoeat.shenhdou.asia";

export async function request<T>(path: string, options?: any): Promise<T> {
  const token = Taro.getStorageSync("token");
  const header: any = { "Content-Type": "application/json" };
  if (token) header.Authorization = "Bearer " + token;
  const res = await Taro.request({ url: API + path, header, ...options });
  if (res.statusCode >= 400) throw new Error(res.data.error || "请求失败");
  return res.data;
}

export interface Dish { id: string; name: string; createdAt: string; }
export interface CalendarDay { dishes: string[]; commentCount: number; }
export interface Comment { id: string; content: string; createdAt: string; }

export const api = {
  dishes: {
    list: () => request<Dish[]>("/api/dishes"),
    add: (name: string) => request<Dish>("/api/dishes", { method: "POST", data: { name } }),
    del: (id: string) => request<any>("/api/dishes/" + id, { method: "DELETE" }),
    random: () => request<Dish>("/api/dishes/random"),
  },
  history: {
    add: (dishName: string) => request<string[]>("/api/history", { method: "POST", data: { dishName } }),
  },
  comments: {
    add: (content: string) => request<Comment>("/api/comments", { method: "POST", data: { content } }),
    list: (date: string) => request<Comment[]>("/api/comments?date=" + date),
    del: (id: string) => request<any>("/api/comments/" + id, { method: "DELETE" }),
  },
  calendar: {
    get: (month: string) => request<Record<string, CalendarDay>>("/api/calendar?month=" + month),
  },
  auth: {
    login: (code: string) => request<{ token: string; user: any }>("/api/auth/wx-login", { method: "POST", data: { code } }),
  },
};
