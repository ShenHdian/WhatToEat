const API_BASE = "/api";

export interface CommentRecord {
  id: string;
  content: string;
  createdAt: string;
}

export interface CommentsByDay {
  [date: string]: CommentRecord[];
}

export async function addComment(content: string): Promise<CommentRecord> {
  const res = await fetch(`${API_BASE}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("添加评论失败");
  return res.json();
}

export async function fetchRecentComments(): Promise<CommentsByDay> {
  const res = await fetch(`${API_BASE}/comments`);
  if (!res.ok) throw new Error("获取评论失败");
  return res.json();
}

export async function fetchCommentsByDate(date: string): Promise<CommentRecord[]> {
  const res = await fetch(`${API_BASE}/comments?date=${date}`);
  if (!res.ok) throw new Error("获取评论失败");
  return res.json();
}

export async function fetchCalendarDays(month: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/comments?month=${month}`);
  if (!res.ok) throw new Error("获取日历失败");
  return res.json();
}

export async function deleteComment(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/comments/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("删除评论失败");
}
