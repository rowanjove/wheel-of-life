# 轮盘人生 · Wheel of Life

> **把每一次人生抉择，都交给咔哒作响的命运转盘。**

[🎮 立即在线试玩](https://rowanjove.github.io/wheel-of-life/) · [English Doc](README.en.md) · [版本发布](https://github.com/rowanjove/wheel-of-life/releases) · [提交反馈与建议](https://github.com/rowanjove/wheel-of-life/issues)

[![CI](https://github.com/rowanjove/wheel-of-life/actions/workflows/ci.yml/badge.svg)](https://github.com/rowanjove/wheel-of-life/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Play%20Online-GitHub%20Pages-success.svg)](https://rowanjove.github.io/wheel-of-life/)

---

《轮盘人生》是一款纯前端运行的轻度随机人生模拟网页游戏（也就是大家熟悉的“人生重开”，但每个命运岔路口都换成了一个真真切切在旋转的物理转盘）。

从开局的容貌、家境、命器与先天灵力，到每年的修为精进、意外奇遇、门派大比乃至最终归宿，所有概率和随机事件都展现在转盘的方寸色带之间。既能一个人消磨碎片时间，也可以把种子码发给好友，看看同一片天地里谁能活出更精彩的人生。

![角色创建与命定仪式](docs/images/02-identity-desktop.png)

---

## 🎮 游戏怎么玩

1. **确定身份**：刻下你的名号，挑选性别。
2. **转动天命**：通过大转盘依次决出容貌、出生地、种族、伴生器物、先天资质与特殊天赋。
3. **岁月流转**：从幼年入校到成年闯荡，每一年既有稳步修炼的岁进轮盘，也有突如其来的因果抉择与白金机缘。
4. **大比争锋**：在全大陆精英争霸中一路过关斩将，向最强对手发起挑战。
5. **终章回望**：根据生平属性、声望、胜负与机缘羁绊，达成数十种截然不同的人生结局。

![命运转盘旋转状态](docs/images/01-web-wheel.png)

---

## 🌟 核心特色

- 🎡 **物理动力学转盘**：采用自研蓄力推力与四次幂阻尼衰减函数，模拟真实转盘的起速飞旋与干脆咬合。高密度扇区（10+乃至20+）支持智能文字压缩排版，绝不留白，下方还配备了完整的选项详情列表。
- 🔊 **纯前端合成音效**：基于原生 Web Audio API 合成指针划过弹片的机械咔哒声与中奖金石鸣钟音，零外部音频体积负担，随开随走。
- 🌍 **双模式自由畅玩**：
  - **经典玄幻世界**：灵修境界、灵环年份自选、灵骨替换与大赛决战；
  - **2.0 多世界轮盘**：当代都市打工人、传统武侠快意恩仇、凡人求索长生路，多种舞台随意切换。
- 💾 **即时防丢存档**：基于 LocalStorage 深度容灾机制，每一步自动落盘并支持快照校验。页面误刷新、不小心关掉浏览器都能直接接上之前的对局。
- 🎲 **确定性种子重放**：每一局人生都有唯一种子，随时可以重现完全一致的命运轨迹。
- 📦 **开放扩展包**：支持通过导入 JSON / ZIP 体验社区作者自制的故事情节、词表与事件库。
- 📱 **全端触屏自适应**：不论是大屏电脑还是手机竖屏，转盘与详情界面均有针对性排版。

| 移动端转盘操控 | 命盘结果定格揭晓 |
| :---: | :---: |
| ![手机端轮盘界面](docs/images/04-wheel-mobile.png) | ![结果定格界面](docs/images/05-wheel-result.png) |

---

## ⚡ 5 秒开始游玩

- **在线试玩**：直接浏览器打开 [https://rowanjove.github.io/wheel-of-life/](https://rowanjove.github.io/wheel-of-life/) 即可开玩，无需下载或安装任何插件。
- **离线运行**：Windows 用户下载 Release 压缩包后，双击 `启动游戏.bat` 即可快速开启本地游玩环境。

---

## 🛠️ 本地运行与开发

如果你想调整事件文案、给轮盘加几个好玩的选项，或者开发自己的世界包：

```bash
# 1. 克隆本仓库
git clone https://github.com/rowanjove/wheel-of-life.git
cd wheel-of-life

# 2. 安装依赖（需 Node.js 18+）
npm ci

# 3. 启动本地开发服务
npm run dev
```

浏览器打开终端提示的地址（默认 `http://localhost:5173/`）即可实时热重载。

### 常用命令

| 命令 | 用途 |
|---|---|
| `npm run dev` | 启动本地 Vite 开发服务器 |
| `npm run build` | TypeScript 类型检查并打包生产环境资源至 `dist/` |
| `npm run typecheck` | 执行全工程严格类型检查 |
| `npm run test:ci` | 运行全量单元测试与状态机回归测试 |
| `npm run lint:ip` | 检查内容合规与敏感词过滤 |
| `npm run simulate` | 运行无头人生模拟器（自动化跑 1000 局输出平衡性报告） |

---

## 📂 代码目录概览

```text
src/
├── content/          # 内容包注册、动态载入与格式校验
├── data/             # 经典世界默认事件、词库与转盘预设
├── engine/           # 2.0 通用人生引擎（人物属性、因果裁决、事件队列、概率透视）
├── worlds/           # 2.0 多世界内容（现代都市 / 传统武侠 / 凡人修仙）
├── rewrite/          # 经典玄幻重写版核心引擎
│   ├── engine/       # 纯函数状态机 Reducer、数值流转、随机数游标
│   ├── storage/      # 本地存档与防损坏快照容灾机制
│   ├── store/        # Zustand 全局运行时
│   └── ui/           # 转盘物理渲染、状态栏、各阶段路由画面
└── scripts/          # 无头数值模拟与合规审计脚本
```

---

## 📄 开源许可与版权说明

本项目核心源代码基于 [MIT 许可证](LICENSE) 开源。

- 转盘物理渲染层参考并整合了 [spin-wheel](https://github.com/CrazyTim/spin-wheel) 优秀成果。
- 本仓库代码库中默认包含的内容包与事件文案均为原创或公有领域创作，已通过自动化合规检测。
- 欢迎提交 PR 扩充有趣的奇遇事件、世界扩展包或提出改进想法！
