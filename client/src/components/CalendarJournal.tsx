import { useState, useEffect } from "react";
import { Typography, Button, Input, Popconfirm, message, Spin, Tag } from "antd";
import { LeftOutlined, RightOutlined, DeleteOutlined, SendOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";
import type { CalendarData, CommentRecord } from "../api/comments";
import { fetchCalendar, fetchCommentsByDate, deleteComment, addComment } from "../api/comments";

const { Text } = Typography;

interface CalendarJournalProps {
  onRefresh?: () => void;
}

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
const FOOD_EMOJIS = ["🥟", "🍜", "🍛", "🥘", "🍝", "🥗", "🌮", "🌯", "🍣", "🥩", "🍗", "🥓", "🧆", "🍲"];

function getEmoji(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i);
  return FOOD_EMOJIS[Math.abs(hash) % FOOD_EMOJIS.length];
}

export default function CalendarJournal({ onRefresh }: CalendarJournalProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  useEffect(() => {
    setLoading(true);
    setSelectedDate(null);
    setShowAll(false);
    fetchCalendar(monthKey)
      .then((data) => {
        setCalendarData(data);
        setSelectedDate(todayStr);
      })
      .catch(() => message.error("加载日历失败"))
      .finally(() => setLoading(false));
  }, [monthKey, todayStr]);

  useEffect(() => {
    if (!selectedDate) return;
    setCommentsLoading(true);
    setShowAll(false);
    fetchCommentsByDate(selectedDate)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [selectedDate]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const firstDayIndex = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else { setMonth(month - 1); }
  };

  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else { setMonth(month + 1); }
  };

  const handleDayClick = (day: number) => {
    setSelectedDate(`${monthKey}-${String(day).padStart(2, "0")}`);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    setSending(true);
    try {
      await addComment(text);
      setInputText("");
      const [nc, ncal] = await Promise.all([
        fetchCommentsByDate(selectedDate!),
        fetchCalendar(monthKey),
      ]);
      setComments(nc);
      setCalendarData(ncal);
      if (onRefresh) onRefresh();
    } catch {
      message.error("发送失败");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async (id: string) => {
    try {
      await deleteComment(id);
      const [nc, ncal] = await Promise.all([
        fetchCommentsByDate(selectedDate!),
        fetchCalendar(monthKey),
      ]);
      setComments(nc);
      setCalendarData(ncal);
    } catch {
      message.error("删除失败");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedDay = calendarData[selectedDate || ""];
  const displayComments = showAll ? comments : comments.slice(0, 5);
  const hasMoreComments = comments.length > 5;

  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "16px", marginBottom: 16,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16,
      }}>
        <Button type="text" icon={<LeftOutlined />} onClick={prevMonth} />
        <Text strong style={{ fontSize: 17 }}>&#x1F4C5; {year}年{month}月</Text>
        <Button type="text" icon={<RightOutlined />} onClick={nextMonth} />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 30 }}><Spin /></div>
      ) : (
        <>
          {/* Grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8,
          }}>
            {WEEKDAYS.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 12, color: "#999", padding: "4px 0", fontWeight: 500 }}>
                {d}
              </div>
            ))}
            {Array.from({ length: firstDayIndex }, (_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${monthKey}-${String(day).padStart(2, "0")}`;
              const data = calendarData[dateStr];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const dishes = data?.dishes || [];
              const hasComment = (data?.commentCount || 0) > 0;

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  style={{
                    position: "relative", padding: "4px 2px", textAlign: "center", cursor: "pointer",
                    borderRadius: 10,
                    background: isSelected ? "linear-gradient(135deg, #ff6b35, #ff8c5a)"
                      : isToday ? "#fff3ed" : "transparent",
                    color: isSelected ? "#fff" : isToday ? "#ff6b35" : "#333",
                    fontWeight: isSelected || isToday ? 700 : 400,
                    fontSize: 14, transition: "all 0.2s",
                    minHeight: 44, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 1,
                  }}
                >
                  <span style={{ lineHeight: 1.2 }}>{day}</span>
                  {dishes.length > 0 && (
                    <span style={{ fontSize: 10, lineHeight: 1, opacity: 0.85 }}>
                      {dishes.length > 1 ? getEmoji(dishes[0]) + "+" + (dishes.length - 1) : getEmoji(dishes[0])}
                    </span>
                  )}
                  {hasComment && (
                    <span style={{
                      position: "absolute", top: 3, right: 5,
                      width: 5, height: 5, borderRadius: "50%",
                      background: isSelected ? "#fff" : "#ff6b35",
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Detail panel - always visible */}
          {selectedDate && (
            <div style={{
              background: "linear-gradient(135deg, #fef9f4, #fff)", borderRadius: 14,
              padding: "14px", marginTop: 8, border: "1px solid #f5ebe0",
              animation: "fadeIn 0.25s ease",
            }}>
              {/* Date + dishes */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                <div style={{
                  background: selectedDate === todayStr ? "linear-gradient(135deg, #ff6b35, #ff8c5a)" : "#f5f5f5",
                  color: selectedDate === todayStr ? "#fff" : "#666",
                  borderRadius: 10, padding: "6px 14px", fontSize: 14, fontWeight: 600,
                }}>
                  {selectedDate}
                </div>
                {selectedDay && selectedDay.dishes.map((dish: string, i: number) => (
                  <Tag key={i} style={{ fontSize: 12, borderRadius: 6, margin: 0 }}>
                    {getEmoji(dish)} {dish}
                  </Tag>
                ))}
                {selectedDay && selectedDay.dishes.length === 0 && (
                  <Text type="secondary" style={{ fontSize: 13 }}>没有摇菜记录</Text>
                )}
              </div>

              {/* Comments */}
              <div style={{ borderTop: "1px solid #f0e8e0", paddingTop: 10 }}>
                <Text strong style={{ fontSize: 13, display: "block", marginBottom: 6, color: "#555" }}>
                  评论 {comments.length > 0 ? `(${comments.length})` : ""}
                </Text>

                {commentsLoading ? (
                  <div style={{ textAlign: "center", padding: 12 }}><Spin size="small" /></div>
                ) : displayComments.length === 0 ? (
                  <Text type="secondary" style={{ fontSize: 13, display: "block", margin: "4px 0 8px", color: "#bbb" }}>
                    还没有评论
                  </Text>
                ) : (
                  <div style={{ marginBottom: 8 }}>
                    {displayComments.map((c) => {
                      const t = new Date(c.createdAt);
                      const ts = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
                      return (
                        <div key={c.id} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                          padding: "6px 8px", marginBottom: 4, background: "#fff",
                          borderRadius: 8, border: "1px solid #f5f0eb", gap: 8,
                        }}>
                          <Text style={{ fontSize: 13, flex: 1 }}>
                            <Tag style={{ fontSize: 10, marginRight: 4, border: "none", background: "#f5f0eb" }}>{ts}</Tag>
                            {c.content}
                          </Text>
                          <Popconfirm title="删除这条评论？" onConfirm={() => handleDeleteComment(c.id)} placement="left">
                            <Button type="text" size="small" danger icon={<DeleteOutlined style={{ fontSize: 13 }} />} />
                          </Popconfirm>
                        </div>
                      );
                    })}
                    {hasMoreComments && (
                      <div style={{ textAlign: "center", padding: "6px 0", cursor: "pointer" }}
                        onClick={() => setShowAll(!showAll)}>
                        <Text style={{ fontSize: 12, color: "#ff6b35", fontWeight: 500 }}>
                          {showAll ? (
                            <><UpOutlined style={{ fontSize: 10, marginRight: 4 }} />收起</>
                          ) : (
                            <><DownOutlined style={{ fontSize: 10, marginRight: 4 }} />展开全部 {comments.length} 条</>
                          )}
                        </Text>
                      </div>
                    )}
                  </div>
                )}

                {/* Input */}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <Input placeholder="写点什么..." value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    size="small" style={{ flex: 1, borderRadius: 8, borderColor: "#e8ddd0" }} />
                  <Button type="primary" size="small" icon={<SendOutlined />}
                    loading={sending} disabled={!inputText.trim()}
                    onClick={handleSend}
                    style={{ background: "#ff6b35", borderColor: "#ff6b35", borderRadius: 8 }}>
                    发送
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
