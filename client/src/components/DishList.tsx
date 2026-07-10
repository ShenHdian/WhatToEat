import { List, Button, Popconfirm, Tag, Empty } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { Dish } from "../types/dish";

interface DishListProps {
  dishes: Dish[];
  onEdit: (dish: Dish) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

const foodEmojis = ["🥟", "🍜", "🍛", "🍘", "🍝", "🥗", "🌮", "🌯", "🍣", "🥩", "🍗", "🥓", "🧆", "🍲", "🥣", "🥙"];

function getEmoji(index: number): string {
  return foodEmojis[index % foodEmojis.length];
}

export default function DishList({ dishes, onEdit, onDelete, loading }: DishListProps) {
  if (!loading && dishes.length === 0) {
    return (
      <Empty
        description="还没有菜品，快来添加吧 🍳"
        style={{ margin: "40px 0" }}
      />
    );
  }

  return (
    <List
      loading={loading}
      dataSource={dishes}
      renderItem={(dish, index) => (
        <List.Item
          actions={[
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(dish)}
              key="edit"
            />,
            <Popconfirm
              title="确定删除这道菜？"
              onConfirm={() => onDelete(dish.id)}
              key="delete"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>,
          ]}
          style={{
            borderRadius: 12,
            marginBottom: 8,
            padding: "12px 16px",
            background: "#fff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          }}
        >
          <List.Item.Meta
            avatar={
              <span style={{ fontSize: 24, lineHeight: "40px" }}>
                {getEmoji(index)}
              </span>
            }
            title={
              <span style={{ fontSize: 16, fontWeight: 500 }}>{dish.name}</span>
            }
            description={
              <Tag color="orange" style={{ fontSize: 11 }}>
                已添加
              </Tag>
            }
          />
        </List.Item>
      )}
    />
  );
}
