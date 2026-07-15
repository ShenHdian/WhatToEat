import { Component } from "react";
import { View, Text, ScrollView, Input, Button } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { api } from "../../api";
import "./index.less";

export default class Calendar extends Component {
  state = {
    year: 2026, month: 7, calendarData: {} as any,
    selectedDate: "", comments: [] as any[], commentInput: "",
    loading: false,
  };

  componentDidMount() {
    const now = new Date();
    this.setState({ year: now.getFullYear(), month: now.getMonth() + 1 }, () => this.load());
  }

  load = async () => {
    const { year, month } = this.state;
    const mk = year + "-" + String(month).padStart(2, "0");
    this.setState({ loading: true });
    try {
      const data = await api.calendar.get(mk);
      this.setState({ calendarData: data });
      const today = new Date();
      const ts = today.getFullYear() + "-" + String(today.getMonth()+1).padStart(2,"0") + "-" + String(today.getDate()).padStart(2,"0");
      this.selectDate(ts);
    } catch (e) { console.error(e); }
    this.setState({ loading: false });
  };

  selectDate = async (date: string) => {
    this.setState({ selectedDate: date, commentInput: "" });
    try { const c = await api.comments.list(date); this.setState({ comments: c }); }
    catch { this.setState({ comments: [] }); }
  };

  handleDayClick = (day: number) => {
    const { year, month } = this.state;
    this.selectDate(year + "-" + String(month).padStart(2,"0") + "-" + String(day).padStart(2,"0"));
  };

  handleSend = async () => {
    const text = this.state.commentInput.trim();
    if (!text) return;
    try {
      await api.comments.add(text);
      this.setState({ commentInput: "" });
      await this.selectDate(this.state.selectedDate);
      await this.load();
    } catch { Taro.showToast({ title: "发送失败", icon: "none" }); }
  };

  handleDeleteComment = async (id: string) => {
    try { await api.comments.del(id); await this.selectDate(this.state.selectedDate); }
    catch { Taro.showToast({ title: "删除失败", icon: "none" }); }
  };

  prevMonth = () => {
    const { year, month } = this.state;
    if (month === 1) this.setState({ year: year-1, month: 12 }, () => this.load());
    else this.setState({ month: month-1 }, () => this.load());
  };
  nextMonth = () => {
    const { year, month } = this.state;
    if (month === 12) this.setState({ year: year+1, month: 1 }, () => this.load());
    else this.setState({ month: month+1 }, () => this.load());
  };

  render() {
    const { year, month, calendarData, selectedDate, comments, commentInput, loading } = this.state;
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month-1, 1).getDay();
    const firstIdx = firstDay === 0 ? 6 : firstDay - 1;
    const today = new Date();
    const todayStr = today.getFullYear()+"-"+String(today.getMonth()+1).padStart(2,"0")+"-"+String(today.getDate()).padStart(2,"0");
    const emojis = ["🥟","🍜","🍛","🥘","🍝","🥗","🌮","🍣","🥩","🍗","🥓","🧆","🍲"];
    const getEmoji = (s: string) => emojis[Math.abs(s.split("").reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0))%emojis.length];

    return (
      <View className="cal">
        <View className="cal-header">
          <Text className="cal-nav" onClick={this.prevMonth}>‹</Text>
          <Text className="cal-title">{year}年{month}月</Text>
          <Text className="cal-nav" onClick={this.nextMonth}>›</Text>
        </View>

        <View className="cal-grid">
          {["一","二","三","四","五","六","日"].map(d => <Text key={d} className="cal-weekday">{d}</Text>)}
          {Array.from({length: firstIdx}, (_,i) => <View key={"e"+i} className="cal-empty" />)}
          {Array.from({length: daysInMonth}, (_,i) => {
            const day = i+1;
            const ds = year+"-"+String(month).padStart(2,"0")+"-"+String(day).padStart(2,"0");
            const data = calendarData[ds];
            const dishes = data?.dishes || [];
            const hasComment = (data?.commentCount||0) > 0;
            const isSel = ds === selectedDate;
            const isToday = ds === todayStr;
            return (
              <View key={day} className={"cal-day"+(isSel?" selected":"")+(isToday?" today":"")}
                onClick={() => this.handleDayClick(day)}>
                <Text className="cal-day-num">{day}</Text>
                {dishes.length > 0 && <Text className="cal-day-dish">{getEmoji(dishes[0])}{dishes.length>1?"+"+(dishes.length-1):""}</Text>}
                {hasComment && <View className="cal-dot" />}
              </View>
            );
          })}
        </View>

        {selectedDate && (
          <View className="detail">
            <Text className="detail-date">{selectedDate}</Text>
            {calendarData[selectedDate]?.dishes?.map((d: string, i: number) => (
              <View key={i} className="detail-dish"><Text>{getEmoji(d)} {d}</Text></View>
            ))}
            <View className="comment-area">
              <ScrollView className="comment-list" scrollY>
                {comments.map((c) => (
                  <View key={c.id} className="comment-item">
                    <Text className="comment-time">{c.createdAt.slice(11,16)}</Text>
                    <Text className="comment-text">{c.content}</Text>
                    <Text className="comment-del" onClick={() => this.handleDeleteComment(c.id)}>✕</Text>
                  </View>
                ))}
              </ScrollView>
              <View className="comment-input-row">
                <Input className="comment-input" placeholder="写点什么..." value={commentInput}
                  onInput={(e) => this.setState({ commentInput: e.detail.value })} />
                <Button className="comment-send" onClick={this.handleSend}>发送</Button>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }
}
