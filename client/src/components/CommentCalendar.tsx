import { useState, useEffect } from "react";
import { Modal, Button, Typography, Spin, List, Tag } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { fetchCalendarDays, fetchCommentsByDate, deleteComment, type CommentRecord } from "../api/comments";

const { Text } = Typography;

interface CommentCalendarProps {
  open: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
}

export default function CommentCalendar({ open, onClose, onSelectDate }: CommentCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [activeDays, setActiveDays] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayComments, setDayComments] = useState<CommentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  useEffect(() => {
    if (!open) return;
    setSelectedDay(null);
    setDayComments([]);
    setLoading(true);
    fetchCalendarDays(monthKey)
      .then(setActiveDays)
      .catch(() => setActiveDays([]))
      .finally(() => setLoading(false));
  }, [open, monthKey]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

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
    if (!activeDays.includes(String(day))) return;
    setSelectedDay(dateStr);
    setCommentsLoading(true);
    fetchCommentsByDate(dateStr)
      .then(setDayComments)
      .catch(() => setDayComments([]))
      .finally(() => setCommentsLoading(false));
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteComment(id);
      setDayComments((prev) => prev.filter((c) => c.id !== id));
      // If no comments left, deactivate the day
      if (dayComments.length <= 1) {
        setActiveDays((prev) => prev.filter((d) => d !== String(selectedDay?.split("-")[2])));
        setSelectedDay(null);
        setDayComments([]);
      }
    } catch {
      // silent
    }
  };

  const handleViewDay = () => {
    if (selectedDay) {
      onSelectDate(selectedDay);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Button type="text" icon={<LeftOutlined />} onClick={prevMonth} />
          <Text strong style={{ fontSize: 16 }}>
            {year}年{month}月
          </Text>
          <Button type="text" icon={<RightOutlined />} onClick={nextMonth} />
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={380}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 20 }}><Spin /></div>
      ) : (
        <>
          {/* Calendar grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 4,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
              <div key={d} style={{ padding: "4px 0", fontSize: 12, color: "#999" }}>{d}</div>
            ))}
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dayStr = String(day);
              const isActive = activeDays.includes(dayStr);
              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  style={{
                    padding: "6px 0",
                    cursor: isActive ? "pointer" : "default",
                    borderRadius: 8,
                    background: isActive
                      ? (selectedDay === `${monthKey}-${dayStr}` ? "#ff6b35" : "#fff3ed")
                      : "transparent",
                    color: isActive
                      ? (selectedDay === `${monthKey}-${dayStr}` ? "#fff" : "#ff6b35")
                      : "#d9d9d9",
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 14,
                    transition: "all 0.2s",
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Selected day comments */}
          {selectedDay && (
            <div
              style={{
                background: "#fafafa",
                borderRadius: 12,
                padding: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text strong style={{ fontSize: 14 }}>
                  📝 {selectedDay}
                </Text>
                <Button size="small" type="link" onClick={handleViewDay}>
                  查看当天
                </Button>
              </div>
              {commentsLoading ? (
                <div style={{ textAlign: "center", padding: 12 }}><Spin size="small" /></div>
              ) : dayComments.length === 0 ? (
                <Text type="secondary" style={{ fontSize: 13 }}>暂无评论</Text>
              ) : (
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {dayComments.map((c) => {
                    const t = new Date(c.createdAt);
                    const ts = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
                    return (
                      <div
                        key={c.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          padding: "4px 0",
                          gap: 8,
                        }}
                      >
                        <Text style={{ fontSize: 13, flex: 1 }}>
                          <Tag style={{ fontSize: 10 }}>{ts}</Tag>
                          {c.content}
                        </Text>
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<span style={{ fontSize: 12 }}>✕</span>}
                          onClick={() => handleDelete(c.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
