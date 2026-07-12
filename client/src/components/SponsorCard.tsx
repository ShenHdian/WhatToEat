import { useState } from "react";
import { Modal, Typography } from "antd";
import { CoffeeOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function SponsorCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        style={{
          background: "linear-gradient(135deg, #fef9f4, #fff5eb)",
          borderRadius: 16,
          padding: "16px",
          marginTop: 16,
          border: "1px solid #f5ebe0",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 14, color: "#8B7355" }}>
            今天的早餐很好吃，请一杯咖啡喝 <CoffeeOutlined />
          </Text>
        </div>
        <img
          src="/wechat-qr.jpg"
          alt="微信打赏"
          onClick={() => setOpen(true)}
          style={{
            width: 100,
            height: 100,
            borderRadius: 10,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = "scale(1.05)"; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
        />
        <div style={{ marginTop: 6 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            点击二维码放大
          </Text>
        </div>
      </div>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={360}
        centered
        closable={false}
      >
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <Text strong style={{ fontSize: 16, display: "block", marginBottom: 12 }}>
            请我喝杯咖啡 ☕
          </Text>
          <img
            src="/wechat-qr.jpg"
            alt="微信打赏"
            style={{
              width: 260,
              height: 260,
              borderRadius: 12,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          />
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 10 }}>
            微信扫码
          </Text>
        </div>
      </Modal>
    </>
  );
}
