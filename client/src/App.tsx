import { useState, useEffect, useCallback } from "react";
import { Layout, Typography, Button, message, Badge, Divider } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import DishList from "./components/DishList";
import AddDishModal from "./components/AddDishModal";
import RandomPicker from "./components/RandomPicker";
import CalendarJournal from "./components/CalendarJournal";
import type { Dish } from "./types/dish";
import {
  fetchDishes,
  addDish,
  updateDish,
  deleteDish,
  getRandomDish,
  addHistoryRecord,
} from "./api/dishes";
import "./App.css";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function App() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDishes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDishes();
      setDishes(data);
    } catch {
      message.error("加载菜品失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDishes();
  }, [loadDishes]);

  const handleAdd = () => { setEditingDish(null); setModalOpen(true); };
  const handleEdit = (dish: Dish) => { setEditingDish(dish); setModalOpen(true); };
  const handleModalClose = () => { setModalOpen(false); setEditingDish(null); };

  const handleSave = async (name: string) => {
    if (editingDish) { await updateDish(editingDish.id, name); message.success("已更新 ✅"); }
    else { await addDish(name); message.success("已添加 ✅"); }
    await loadDishes();
  };

  const handleDelete = async (id: string) => {
    await deleteDish(id);
    message.success("已删除");
    await loadDishes();
  };

  const handleRandomPick = async (): Promise<Dish> => {
    const dish = await getRandomDish();
    await addHistoryRecord(dish.name);
    // Trigger calendar refresh
    setRefreshKey((k) => k + 1);
    return dish;
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#fff8f0" }}>
      <Header style={{
        background: "linear-gradient(135deg, #ff6b35, #ff8c5a)",
        textAlign: "center", height: "auto", padding: "20px 16px", lineHeight: 1.5,
      }}>
        <Title level={3} style={{ margin: 0, color: "#fff", fontSize: 22 }}>
          🍳 今天吃什么
        </Title>
        <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
          纠结吃什么？让命运替你决定
        </Text>
      </Header>

      <Content style={{ maxWidth: 600, margin: "0 auto", padding: "16px", width: "100%" }}>
        <div style={{
          background: "#fff", borderRadius: 16, padding: "16px 16px 8px",
          marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}>
          <RandomPicker dishes={dishes} onPick={handleRandomPick} />
        </div>

        <CalendarJournal key={refreshKey} />

        <div style={{
          background: "#fff", borderRadius: 16, padding: "16px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Title level={5} style={{ margin: 0 }}>
              📋 我的菜品
              <Badge count={dishes.length} style={{ marginLeft: 8, backgroundColor: "#ff6b35" }} overflowCount={999} />
            </Title>
            <div style={{ display: "flex", gap: 8 }}>
              <Button icon={<ReloadOutlined />} size="small" onClick={loadDishes}>刷新</Button>
              <Button type="primary" icon={<PlusOutlined />} size="small" onClick={handleAdd}
                style={{ background: "#ff6b35", borderColor: "#ff6b35" }}>添加</Button>
            </div>
          </div>
          <Divider style={{ margin: "8px 0 12px" }} />
          <DishList dishes={dishes} onEdit={handleEdit} onDelete={handleDelete} loading={loading} />
        </div>
      </Content>

      <AddDishModal open={modalOpen} editingDish={editingDish} onClose={handleModalClose} onSave={handleSave} />
    </Layout>
  );
}
