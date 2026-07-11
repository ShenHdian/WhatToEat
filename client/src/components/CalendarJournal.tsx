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

  // Default: select today if in current month, otherwise select first day with data
  useEffect(() => {
    if (!selectedDate && !loading && Object.keys(calendarData).length > 0) {
      if (calendarData[todayStr]) {
        setSelectedDate(todayStr);
      } else {
        const firstWithData = Object.entries(calendarData).find(([, v]) => v.dishName || v.commentCount > 0);
        if (firstWithData) setSelectedDate(firstWithData[0]);
      }
    }
  }, [loading, calendarData, todayStr, selectedDate]);

  // Load calendar data
  useEffect(() => {
    setLoading(true);
    setSelectedDate(null);
    setShowAll(false);
    fetchCalendar(monthKey)
      .then((data) => {
        setCalendarData(data);
        // Default select today
        if (data[todayStr]) setSelectedDate(todayStr);
        else {
          const first = Object.entries(data).find(([, v]) => v.dishName || v.commentCount > 0);
          if (first) setSelectedDate(first[0]);
        }
      })
      .catch(() => message.error("加载日历失败"))
      .finally(() => setLoading(false));
  }, [monthKey, todayStr]);

  // Load comments when date changes
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
    const dateStr = `${monthKey}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    setSending(true);
    try {
      await addComment(text);
      setInputText("");
      // Reload comments and calendar
      const [newComments, newCalendar] = await Promise.all([
        fetchCommentsByDate(selectedDate!),
        fetchCalendar(monthKey),
      ]);
      setComments(newComments);
      setCalendarData(newCalendar);
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
      const [newComments, newCalendar] = await Promise.all([
        fetchCommentsByDate(selectedDate!),
        fetchCalendar(monthKey),
      ]);
      setComments(newComments);
      setCalendarData(newCalendar);
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
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "16px",
        marginBottom: 16,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Button type="text" icon={<LeftOutlined />} onClick={prevMonth} />
        <Text strong style={{ fontSize: 17 }}>
          📅 {year}年{month}月
        </Text>
        <Button type="text" icon={<RightOutlined />} onClick={nextMonth} />
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 30 }}><Spin /></div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 4,
              marginBottom: 12,
            }}
          >
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  color: "#999",
                  padding: "4px 0",
                  fontWeight: 500,
                }}
              >
                {d}
              </div>
            ))}
            {Array.from({ length: firstDayIndex }, (_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${monthKey}-${String(day).padStart(2, "0")}`;
              const data = calendarData[dateStr];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const hasDish = data?.dishName;
              const hasComment = (data?.commentCount || 0) > 0;

              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  style={{
                    position: "relative",
                    padding: "6px 4px",
                    textAlign: "center",
                    cursor: "pointer",
                    borderRadius: 10,
                    background: isSelected
                      ? "linear-gradient(135deg, #ff6b35, #ff8c5a)"
                      : isToday && !isSelected
                        ? "#fff3ed"
                        : "transparent",
                    color: isSelected ? "#fff" : isToday ? "#ff6b35" : "#333",
                    fontWeight: isSelected || isToday ? 700 : 400,
                    fontSize: 14,
                    transition: "all 0.2s",
                    minHeight: 52,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                  }}
                >
                  <span>{day}</span>
                  {hasDish && (
                    <span style={{ fontSize: 10, lineHeight: 1 }}>
                      {getEmoji(data.dishName!)}
                    </span>
                  )}
                  {hasComment && (
                    <span
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 6,
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: isSelected ? "#fff" : "#ff6b35",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          {selectedDate && selectedDay && (
            <div
              style={{
                background: "#fafafa",
                borderRadius: 12,
                padding: "12px",
                marginTop: 4,
                animation: "fadeIn 0.2s ease",
              }}
            >
              {/* Date header */}
              <Text strong style={{ fontSize: 14, display: "block", marginBottom: 8 }}>
                📅 {selectedDate}
              </Text>

              {/* Dish of the day */}
              {selectedDay.dishName ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    background: "#fff",
                    borderRadius: 10,
                    marginBottom: 10,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  <span style={{ fontSize: 20 }}>{getEmoji(selectedDay.dishName)}</span>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>摇到的菜</Text>
                    <Text style={{ fontSize: 15, fontWeight: 600, display: "block" }}>
                      {selectedDay.dishName}
                    </Text>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "8px 12px",
                    marginBottom: 10,
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    这天没有摇菜记录 🎲
                  </Text>
                </div>
              )}

              {/* Comments section */}
              <Text strong style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                📝 评论 {comments.length > 0 && `(${comments.length})`}
              </Text>

              {commentsLoading ? (
                <div style={{ textAlign: "center", padding: 12 }}><Spin size="small" /></div>
              ) : displayComments.length === 0 ? (
                <Text type="secondary" style={{ fontSize: 13, display: "block", margin: "4px 0 8px" }}>
                  还没有评论
                </Text>
              ) : (
                <div style={{ marginBottom: 8 }}>
                  {displayComments.map((c) => {
                    const t = new Date(c.createdAt);
                    const ts = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
                    return (
                      <div
                        key={c.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          padding: "5px 0",
                          borderBottom: "1px solid #f0f0f0",
                          gap: 8,
                        }}
                      >
                        <Text style={{ fontSize: 13, flex: 1 }}>
                          <Tag style={{ fontSize: 10, marginRight: 4 }}>{ts}</Tag>
                          {c.content}
                        </Text>
                        <Popconfirm title="删除？" onConfirm={() => handleDeleteComment(c.id)} placement="left">
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </div>
                    );
                  })}
                  {hasMoreComments && (
                    <div
                      style={{ textAlign: "center", padding: "6px 0", cursor: "pointer" }}
                      onClick={() => setShowAll(!showAll)}
                    >
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
                <Input
                  placeholder="写点什么..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  size="small"
                  style={{ flex: 1, borderRadius: 8 }}
                />
                <Button
                  type="primary"
                  size="small"
                  icon={<SendOutlined />}
                  loading={sending}
                  disabled={!inputText.trim()}
                  onClick={handleSend}
                  style={{ background: "#ff6b35", borderColor: "#ff6b35", borderRadius: 8 }}
                >
                  发送
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
