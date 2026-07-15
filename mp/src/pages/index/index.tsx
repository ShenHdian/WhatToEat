import { Component } from "react";
import Taro from "@tarojs/taro";
import { View, Text, Button, ScrollView, Input, Image, Modal } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { api } from "../../api";
import "./index.less";

export default class Index extends Component {
  state = {
    dishes: [] as any[],
    rolling: false,
    result: "",
    dishInput: "",
    modalVisible: false,
    editingDish: null as any,
    sponsorOpen: false,
  };

  componentDidMount() { this.load(); }

  load = async () => {
    try { const d = await api.dishes.list(); this.setState({ dishes: d }); }
    catch (e) { console.error(e); }
  };

  handlePick = async () => {
    const { dishes } = this.state;
    if (dishes.length === 0) return Taro.showToast({ title: "请先添加菜品", icon: "none" });
    this.setState({ rolling: true, result: "" });
    let count = 0;
    const timer = setInterval(() => {
      const d = dishes[Math.floor(Math.random() * dishes.length)];
      this.setState({ result: d.name });
      count++;
      if (count >= 20) { clearInterval(timer); this.finishPick(); }
    }, 80);
  };

  finishPick = async () => {
    const { dishes } = this.state;
    const picked = dishes[Math.floor(Math.random() * dishes.length)];
    this.setState({ result: picked.name, rolling: false });
    try { await api.history.add(picked.name); } catch (e) { console.error(e); }
  };

  handleAdd = async () => {
    const name = this.state.dishInput.trim();
    if (!name) return;
    try {
      await api.dishes.add(name);
      this.setState({ dishInput: "" });
      await this.load();
    } catch { Taro.showToast({ title: "添加失败", icon: "none" }); }
  };

  handleDelete = async (id: string) => {
    try { await api.dishes.del(id); await this.load(); }
    catch { Taro.showToast({ title: "删除失败", icon: "none" }); }
  };

  render() {
    const { dishes, rolling, result, dishInput, sponsorOpen } = this.state;
    const emojis = ["🥟", "🍜", "🍛", "🥘", "🍝", "🥗", "🌮", "🍣", "🥩", "🍗", "🥓", "🧆", "🍲"];
    const getEmoji = (s: string) => emojis[Math.abs(s.split("").reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0)) % emojis.length];

    return (
      <View className="index">
        {/* Random picker */}
        <View className="card" style={{ marginBottom: 12 }}>
          <Button className={"pick-btn" + (rolling ? " rolling" : "")}
            disabled={dishes.length === 0 || rolling}
            onClick={this.handlePick}>
            {rolling ? "🎰 正在摇..." : "🎲 随机选一个！"}
          </Button>
          {result && (
            <View className="result-area">
              <Text className="result-label">今天就吃</Text>
              <Text className="result-text">🍽️ {result}</Text>
            </View>
          )}
        </View>

        {/* Dishes management */}
        <View className="card" style={{ marginBottom: 12 }}>
          <View className="section-header">
            <Text className="section-title">📋 我的菜品</Text>
            <Text className="dish-count">{dishes.length}</Text>
          </View>

          <View className="add-row">
            <Input className="add-input" placeholder="输入菜品名称" value={dishInput}
              onInput={(e) => this.setState({ dishInput: e.detail.value })} />
            <Button className="add-btn" onClick={this.handleAdd}>添加</Button>
          </View>

          <ScrollView className="dish-list" scrollY>
            {dishes.map((d, i) => (
              <View key={d.id} className="dish-item">
                <Text className="dish-emoji">{getEmoji(d.name)}</Text>
                <Text className="dish-name">{d.name}</Text>
                <Text className="dish-del" onClick={() => this.handleDelete(d.id)}>✕</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Sponsor */}
        <View className="sponsor-card" onClick={() => this.setState({ sponsorOpen: true })}>
          <Text className="sponsor-text">今天的早餐很好吃，请一杯咖啡喝 ☕</Text>
          <Image className="sponsor-qr" src="https://whattoeat.shenhdou.asia/wechat-qr.jpg" mode="aspectFit" />
        </View>

        {sponsorOpen && (
          <Modal isOpened={true} onClose={() => this.setState({ sponsorOpen: false })}>
            <View className="sponsor-modal">
              <Text className="sponsor-modal-title">请我喝杯咖啡 ☕</Text>
              <Image className="sponsor-modal-qr" src="https://whattoeat.shenhdou.asia/wechat-qr.jpg" mode="aspectFit" />
              <Text className="sponsor-modal-hint">微信扫码</Text>
            </View>
          </Modal>
        )}
      </View>
    );
  }
}
