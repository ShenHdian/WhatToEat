import { Modal, Input, Form, message } from "antd";
import { useEffect } from "react";
import type { Dish } from "../types/dish";

interface AddDishModalProps {
  open: boolean;
  editingDish: Dish | null;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}

export default function AddDishModal({ open, editingDish, onClose, onSave }: AddDishModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({ name: editingDish?.name || "" });
    }
  }, [open, editingDish, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSave(values.name.trim());
      form.resetFields();
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) {
        // form validation error, skip
      } else {
        message.error(err instanceof Error ? err.message : "操作失败");
      }
    }
  };

  return (
    <Modal
      title={
        <span style={{ fontSize: 18 }}>
          {editingDish ? "✏️ 编辑菜品" : "➕ 添加菜品"}
        </span>
      }
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText={editingDish ? "保存" : "添加"}
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="菜品名称"
          rules={[
            { required: true, message: "请输入菜品名称" },
            { max: 30, message: "名称不能超过30个字符" },
          ]}
        >
          <Input
            placeholder="例如：番茄炒蛋"
            autoFocus
            size="large"
            onPressEnter={handleOk}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
