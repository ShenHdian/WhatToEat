import { Button, Card, Typography } from "antd";
import { GiftOutlined } from "@ant-design/icons";
import { useState, useRef, useEffect, useCallback } from "react";
import type { Dish } from "../types/dish";

const { Text, Title } = Typography;

interface RandomPickerProps {
  dishes: Dish[];
  onPick: () => Promise<Dish>;
}

export default function RandomPicker({ dishes, onPick }: RandomPickerProps) {
  const [state, setState] = useState<"idle" | "rolling" | "result">("idle");
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [rollingName, setRollingName] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const handlePick = async () => {
    if (dishes.length === 0) return;
    cleanup();
    setShowConfetti(false);
    setState("rolling");

    let count = 0;
    const maxRolls = 20;

    timerRef.current = setInterval(() => {
      const randomDish = dishes[Math.floor(Math.random() * dishes.length)];
      setRollingName(randomDish.name);
      count++;

      if (count >= maxRolls) {
        cleanup();
        onPick().then((dish) => {
          setSelectedDish(dish);
          setRollingName(dish.name);
          setState("result");
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2500);
        }).catch(() => {
          setState("idle");
          setRollingName("");
        });
      }
    }, 80);
  };

  const isDisabled = dishes.length === 0 || state === "rolling";

  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <Button
        type="primary"
        size="large"
        shape="round"
        icon={<GiftOutlined />}
        disabled={isDisabled}
        onClick={handlePick}
        style={{
          height: 60,
          fontSize: 20,
          padding: "0 40px",
          background: state === "rolling" ? undefined : "linear-gradient(135deg, #ff6b35, #ff8c5a)",
          borderColor: "transparent",
          boxShadow: state === "rolling"
            ? "0 0 0 8px rgba(255, 107, 53, 0.2)"
            : "0 4px 15px rgba(255, 107, 53, 0.3)",
          transition: "all 0.3s ease",
          animation: state === "rolling" ? "pulse 0.8s infinite" : "none",
        }}
      >
        {state === "idle" ? "🎲 随机选一个！" : state === "rolling" ? "🎰 正在摇..." : "🎲 再摇一次"}
      </Button>

      <div style={{ marginTop: 30, minHeight: 120 }}>
        {state === "rolling" && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            <Text
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#ff6b35",
                display: "inline-block",
                minWidth: 200,
              }}
            >
              {rollingName}
            </Text>
          </div>
        )}

        {state === "result" && selectedDish && (
          <div style={{ animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
            <Card
              style={{
                display: "inline-block",
                borderRadius: 16,
                boxShadow: "0 8px 30px rgba(255, 107, 53, 0.2)",
                border: "2px solid #ff6b35",
                minWidth: 280,
              }}
            >
              <Title level={4} style={{ margin: 0, color: "#666" }}>
                今天就吃
              </Title>
              <Title
                level={2}
                style={{
                  margin: "12px 0 4px",
                  color: "#ff6b35",
                  fontSize: 36,
                }}
              >
                🍽️ {selectedDish.name}
              </Title>
            </Card>
          </div>
        )}

        {state === "idle" && dishes.length > 0 && (
          <Text type="secondary" style={{ fontSize: 16 }}>
            点击上方按钮，随机选取一道菜
          </Text>
        )}

        {dishes.length === 0 && (
          <Text type="secondary" style={{ fontSize: 16 }}>
            还没有菜品，先去添加吧 😋
          </Text>
        )}
      </div>

      {showConfetti && <ConfettiOverlay />}
    </div>
  );
}

function ConfettiOverlay() {
  const colors = ["#ff6b35", "#ffd700", "#ff4757", "#2ed573", "#1e90ff", "#ff6b9d", "#a29bfe"];
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 1.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 6 + Math.random() * 10,
  }));

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: -10,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : 2,
            animation: `confetti ${p.duration}s ease-out ${p.delay}s both`,
          }}
        />
      ))}
    </div>
  );
}
