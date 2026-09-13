# 轮盘人生 · Wheel of Life

> **转动命运的齿轮，重启一段充满未知的随机人生。**

[简体中文](README.md) | [English](README.en.md) · [🎮 立即在线试玩](https://rowanjove.github.io/wheel-of-life/) · [版本发布](https://github.com/rowanjove/wheel-of-life/releases) · [报告问题](https://github.com/rowanjove/wheel-of-life/issues)

[![CI](https://github.com/rowanjove/wheel-of-life/actions/workflows/ci.yml/badge.svg)](https://github.com/rowanjove/wheel-of-life/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

轮盘人生是一款中文轻度随机人生模拟网页游戏。在浏览器中转动命运轮盘，从时代、种族、容貌、天赋到伴生神器，一切皆由概率抉择。历经学院磨砺、突发事件、宗门大比与漫长岁月，探寻数十种截然不同的人生终局。

![轮盘人生桌面端角色创建界面](docs/images/02-identity-desktop.png)

---

## 游戏特色

* 🎡 **命运转盘**：告别千篇一律的开局！随手一拨，生成专属的容貌、时代、家境、命器与隐藏天赋。
* 📜 **多分支奇遇**：从年少入学到踏入红尘，丰富的主线剧情、分支抉择与突发随机事件，每次转生都是全新体验。
* 💾 **本地即时存档**：自动保存人生进度至浏览器本地存储，无须注册账号，关闭页面随时重连归来。
* 🎲 **可复现种子**：支持随机种子机制，可以把绝世天骄（或极度倒霉）的开局种子分享给好友一决高下。
* 📦 **开放内容包生态**：游戏支持通过导入 ZIP 内容包，随时加载社区自制的故事线、词库与专属转盘。
* 📱 **全平台响应式**：深度适配桌面与手机触屏，随时随地在掌中开启一段新人生。

![命运转盘界面](docs/images/01-web-wheel.png)

---

## 5 秒开始游玩

1. 直接点击打开 **[在线试玩地址](https://rowanjove.github.io/wheel-of-life/)**。
2. 输入名字，选择性别，点击“开始命运转盘”。
3. 迎接属于你的宿命历程！

---

## 本地运行与开发

如果你想在本地开发、修改事件或自定义转盘内容：

```bash
# 克隆仓库
git clone https://github.com/rowanjove/wheel-of-life.git
cd wheel-of-life

# 安装依赖并启动本地服务
npm ci
npm run dev
```

启动后浏览器访问终端输出的本地地址（默认 `http://localhost:5173`）即可。Windows 用户也可以双击运行根目录的 `start-game.bat`。

---

## 项目结构

```text
src/
├── content/          # 内容包校验与动态载入逻辑
├── data/             # 内置默认剧情、词库与转盘选项
├── rewrite/engine/   # 核心事件流转规则与随机数引擎
├── rewrite/storage/  # 本地存档快照与数据恢复
├── rewrite/store/    # 基于 Zustand 的全局状态管理
└── rewrite/ui/       # React 游戏主界面与转盘动画交互
```

---

## 开源协议

本项目代码遵循 [MIT License](LICENSE) 开源。欢迎提交 PR 扩充奇遇事件与剧情！
