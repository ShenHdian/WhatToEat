export default defineAppConfig({
  pages: ["pages/index/index", "pages/calendar/index", "pages/mine/index"],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#ff6b35",
    navigationBarTitleText: "今天吃什么",
    navigationBarTextStyle: "white",
  },
  tabBar: {
    color: "#999",
    selectedColor: "#ff6b35",
    backgroundColor: "#fff",
    borderStyle: "white",
    list: [
      { pagePath: "pages/index/index", text: "首页", iconPath: "assets/home.svg", selectedIconPath: "assets/home-active.svg" },
      { pagePath: "pages/calendar/index", text: "日历", iconPath: "assets/calendar.svg", selectedIconPath: "assets/calendar-active.svg" },
      { pagePath: "pages/mine/index", text: "我的", iconPath: "assets/mine.svg", selectedIconPath: "assets/mine-active.svg" },
    ],
  },
});
