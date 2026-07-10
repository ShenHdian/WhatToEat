import { useState } from "react";
import { Typography, Button, Input, Popconfirm, Tag, message } from "antd";
import { DeleteOutlined, DownOutlined, RightOutlined, SendOutlined, CalendarOutlined, UpOutlined } from "@ant-design/icons";
import type { CommentsByDay, CommentRecord } from "../api/comments";
import CommentCalendar from "./CommentCalendar";

const { Text } = Typography;

interface DailyCommentsProps {
  data: CommentsByDay;
  loading: boolean;
  onAdd: (content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const ymd = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  if (ymd(d) === ymd(today)) return "今天";
  if (ymd(d) === ymd(yesterday)) return "昨天";
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function DailyComments({ data, loading, onAdd, onDelete, onRefresh }: DailyCommentsProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showAllMap, setShowAllMap] = useState<Record<string, boolean>>({});
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const days = Object.keys(data).sort().reverse();
  const hasMultipleMonths = (() => {
    if (days.length < 2) return false;
    const months = new Set(days.map((d) => d.slice(0, 7)));
    return months.size > 1;
  })();

  const toggleDay = (day: string) => {
    setCollapsed((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const toggleShowAll = (day: string) => {
    setShowAllMap((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    setSending(true);
    try {
      await onAdd(text);
      setInputText("");
      onRefresh();
    } catch {
      message.error("发送失败");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!loading && days.length === 0) {
    return null;
  }

  return (
    <>
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "16px",
          marginBottom: 16,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text strong style={{ fontSize: 15 }}>
            📝 每日食评
          </Text>
          {hasMultipleMonths && (
            <Button
              type="text"
              size="small"
              icon={<CalendarOutlined />}
              onClick={() => setCalendarOpen(true)}
            >
              月度视图
            </Button>
          )}
        </div>

        {days.map((day) => {
          const comments: CommentRecord[] = data[day] || [];
          const isCollapsed = collapsed[day] ?? (day !== days[0]);
          const showAll = showAllMap[day] || false;
          const displayComments = isCollapsed ? [] : (showAll ? comments : comments.slice(0, 5));
          const hasMore = comments.length > 5;

          return (
            <div key={day} style={{ marginBottom: 8 }}>
              {/* Day header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  padding: "8px 0",
                  userSelect: "none",
                }}
                onClick={() => toggleDay(day)}
              >
                {isCollapsed ? <RightOutlined style={{ fontSize: 12 }} /> : <DownOutlined style={{ fontSize: 12 }} />}
                <Text strong style={{ fontSize: 14 }}>
                  {formatDate(day)}
                </Text>
                <Tag style={{ fontSize: 11, marginLeft: 4 }}>
                  {comments.length} 条
                </Tag>
              </div>

              {/* Comments */}
              {!isCollapsed && (
                <div style={{ paddingLeft: 20 }}>
                  {displayComments.map((c) => {
                    const time = new Date(c.createdAt);
                    const timeStr = `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;
                    return (
                      <div
                        key={c.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          padding: "6px 0",
                          borderBottom: "1px solid #f5f5f5",
                          gap: 8,
                        }}
                      >
                        <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <Text type="secondary" style={{ fontSize: 11, minWidth: 36, marginTop: 2 }}>
                            {timeStr}
                          </Text>
                          <Text style={{ fontSize: 14, lineHeight: 1.5 }}>{c.content}</Text>
                        </div>
                        <Popconfirm title="删除这条评论？" onConfirm={() => onDelete(c.id)} placement="left">
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </div>
                    );
                  })}

                  {hasMore && (
                    <div
                      style={{ textAlign: "center", padding: "8px 0", cursor: "pointer" }}
                      onClick={(e) => { e.stopPropagation(); toggleShowAll(day); }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#ff6b35",
                          fontWeight: 500,
                        }}
                      >
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
            </div>
          );
        })}

        {/* Input area */}
        <div style={{ display: "flex", gap: 8, marginTop: 8, paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
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

      <CommentCalendar
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        onSelectDate={(date) => {
          setCalendarOpen(false);
          setCollapsed((prev) => ({ ...prev, [date]: false }));
        }}
      />
    </>
  );
}
