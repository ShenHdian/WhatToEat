import { Component } from "react";
import { View, Text, Button, Image, Modal } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { api } from "../../api";
import "./index.less";

export default class Mine extends Component {
  state = { user: null as any, loading: false, sponsorOpen: false };

  async componentDidMount() {
    const token = Taro.getStorageSync("token");
    if (token) {
      // Check if token is still valid (simplified - just show logged in)
      this.setState({ user: { nickname: "微信用户" } });
    }
  }

  handleLogin = async () => {
    this.setState({ loading: true });
    try {
      const { code } = await Taro.login();
      const res = await api.auth.login(code);
      Taro.setStorageSync("token", res.token);
      this.setState({ user: res.user });
      Taro.showToast({ title: "登录成功", icon: "success" });
    } catch (e: any) {
      Taro.showToast({ title: e.message || "登录失败", icon: "none" });
    }
    this.setState({ loading: false });
  };

  render() {
    const { user, loading, sponsorOpen } = this.state;
    return (
      <View className="mine">
        <View className="card" style={{ textAlign: "center", padding: "30px 16px" }}>
          {user ? (
            <View>
              <View className="avatar">{user.nickname[0]}</View>
              <Text className="nickname">{user.nickname}</Text>
            </View>
          ) : (
            <Button className="login-btn" loading={loading} onClick={this.handleLogin}>
              微信登录
            </Button>
          )}
        </View>

        <View className="card" style={{ marginTop: 12, textAlign: "center" }} onClick={() => this.setState({ sponsorOpen: true })}>
          <Text className="sponsor-text">今天的早餐很好吃，请一杯咖啡喝 ☕</Text>
          <Image className="sponsor-qr" src="https://whattoeat.shenhdou.asia/wechat-qr.jpg" mode="aspectFit" />
        </View>

        <View className="footer">
          <Text className="footer-text">WhatToEat v1.0</Text>
          <Text className="footer-text">基于 Taro + React 开发</Text>
        </View>

        {sponsorOpen && (
          <Modal isOpened={true} onClose={() => this.setState({ sponsorOpen: false })}>
            <View className="sponsor-modal">
              <Text className="sponsor-modal-title">请我喝杯咖啡 ☕</Text>
              <Image className="sponsor-modal-qr" src="https://whattoeat.shenhdou.asia/wechat-qr.jpg" mode="aspectFit" />
            </View>
          </Modal>
        )}
      </View>
    );
  }
}
