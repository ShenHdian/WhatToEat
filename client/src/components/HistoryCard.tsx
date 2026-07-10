import { List, Typography, Empty, Tag, Button, Popconfirm } from "antd";
import { ClockCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import type { HistoryRecord } from "../api/dishes";

const { Text } = Typography;

interface HistoryCardProps {
  records: HistoryRecord[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export default function HistoryCard({ records, loading, onDelete }: HistoryCardProps) {
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Text strong style={{ fontSize: 15 }}>
          📋 摇菜记录
        </Text>
        <Tag icon={<ClockCircleOutlined />} color="default" style={{ fontSize: 11 }}>
          每晚 4:00 自动清空
        </Tag>
      </div>

      {!loading && records.length === 0 ? (
        <Empty
          description="还没有摇过菜，快去试试手气 🎲"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: "16px 0" }}
        />
      ) : (
        <List
          loading={loading}
          dataSource={records}
          renderItem={(record) => {
            const time = new Date(record.createdAt);
            const timeStr = `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;
            return (
              <List.Item
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #f5f5f5",
                }}
                actions={[
                  <Popconfirm
                    title="确定删除这条记录？"
                    onConfirm={() => onDelete(record.id)}
                    key="delete"
                    placement="left"
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                    />
                  </Popconfirm>,
                ]}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: "100%",
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12, minWidth: 40 }}>
                    {timeStr}
                  </Text>
                  <Text style={{ fontSize: 15 }}>
                    🍽️ {record.dishName}
                  </Text>
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );
}
