# 变更总结（汉字宝 WebApp）

本文记录从空目录到当前版本的主要实现与配置变更，便于回顾、部署与后续迭代。

## 1. 项目工程化

- 初始化前端工程：Vite 8 + React 19 + TypeScript + Tailwind CSS v4
- 包管理：pnpm
- 路由：React Router（SPA）
- 测试：Vitest（含 jsdom + setup）
- 产物分析：rollup-plugin-visualizer（生成 dist/stats.html）

相关文件：
- [package.json](file:///Users/harden.gao/workspace/github/hanzibao/package.json)
- [vite.config.ts](file:///Users/harden.gao/workspace/github/hanzibao/vite.config.ts)
- [tsconfig.json](file:///Users/harden.gao/workspace/github/hanzibao/tsconfig.json)
- [vitest.config.ts](file:///Users/harden.gao/workspace/github/hanzibao/vitest.config.ts)

常用命令：
- `pnpm dev`
- `pnpm build`
- `pnpm preview`
- `pnpm test`
- `pnpm analyze`（生成 `dist/stats.html`）

## 2. 核心功能（PRD / TRD P1 对齐）

### 2.1 搜索与页面结构

- 首页输入框（单字校验）→ 跳转 `/char/:char`
- 详情页展示：拼音/发音、田字格笔顺动画、播放控制、释义与词组

相关文件：
- [Home.tsx](file:///Users/harden.gao/workspace/github/hanzibao/src/pages/Home.tsx)
- [Character.tsx](file:///Users/harden.gao/workspace/github/hanzibao/src/pages/Character.tsx)
- [SearchBar.tsx](file:///Users/harden.gao/workspace/github/hanzibao/src/components/SearchBar/SearchBar.tsx)
- [router.tsx](file:///Users/harden.gao/workspace/github/hanzibao/src/router.tsx)

### 2.2 田字格 / 米字格展示

- 田字格（四边框 + 横竖中线）
- 增强为米字格（新增两条对角线）
- 修复线层遮挡汉字问题（明确 z-index：字层在上、线层在下）

相关文件：
- [CharacterGrid.tsx](file:///Users/harden.gao/workspace/github/hanzibao/src/components/CharacterGrid/CharacterGrid.tsx)

### 2.3 Hanzi Writer 笔顺动画

- 使用 hanzi-writer 动态 import（页面懒加载友好）
- 自动播放：进入详情页后自动执行笔顺动画
- 播放控制：播放/暂停/重播 + 速度切换
- 容器自适应：基于容器尺寸计算 width/height/padding，并使用 ResizeObserver 调整尺寸
- 修复：旧实现误用不存在的 cancelAnimation API
- 修复：ResizeObserver 清理更稳（effect 开头主动断开旧 observer + cleanup 兜底）

相关文件：
- [useHanziWriter.ts](file:///Users/harden.gao/workspace/github/hanzibao/src/hooks/useHanziWriter.ts)
- [StrokeControls.tsx](file:///Users/harden.gao/workspace/github/hanzibao/src/components/StrokeControls/StrokeControls.tsx)

### 2.4 拼音 / 释义 / 词组（离线分片 + 按需加载）

- CC-CEDICT 分片 JSON：按 `Math.floor(codePoint / 500)` 分片，按需 fetch
- 分片缺失时不再误报“加载失败”（例如返回 HTML / 404）
- 增加“重试”能力，并对典型网络瞬断在前端自动重试一次
- 优化生成策略：单字多条候选时打分选择更“常用释义”，并过滤例词（只保留纯汉字、2-4 字）

相关文件：
- [useDictionary.ts](file:///Users/harden.gao/workspace/github/hanzibao/src/hooks/useDictionary.ts)
- [DefinitionCard.tsx](file:///Users/harden.gao/workspace/github/hanzibao/src/components/DefinitionCard/DefinitionCard.tsx)
- [PinyinBadge.tsx](file:///Users/harden.gao/workspace/github/hanzibao/src/components/PinyinBadge/PinyinBadge.tsx)
- [cedict.ts](file:///Users/harden.gao/workspace/github/hanzibao/src/utils/cedict.ts)
- [build-cedict.mjs](file:///Users/harden.gao/workspace/github/hanzibao/scripts/build-cedict.mjs)
- 数据目录：`public/data/cedict-*.json`

常用命令：
- `pnpm data:cedict`（下载并生成全量分片）

### 2.5 TTS 发音

- 优先 Web Speech API（`speechSynthesis`）
- 不支持时降级为静态音频路径 `/data/audio/<字>.mp3`（占位能力）

相关文件：
- [useTTS.ts](file:///Users/harden.gao/workspace/github/hanzibao/src/hooks/useTTS.ts)

## 3. 性能与可用性优化

- 手动分包：react-vendor、hanzi-writer 独立 chunk（便于缓存）
- 产物体积可视化：`pnpm analyze` 输出 `dist/stats.html`
- 页面错误兜底：路由级 errorElement，避免 “Unexpected Application Error”

相关文件：
- [ErrorPage.tsx](file:///Users/harden.gao/workspace/github/hanzibao/src/pages/ErrorPage.tsx)

## 4. Cloudflare Pages 相关（部署与加速）

### 4.1 SPA 路由与缓存策略

- SPA 刷新子路由：`public/_redirects`
- 缓存头：`public/_headers`
  - `/assets/*`：一年 immutable
  - `/data/cedict-*.json`：7 天 + stale-while-revalidate
  - `/hw-data/*`：一年 immutable

相关文件：
- [_redirects](file:///Users/harden.gao/workspace/github/hanzibao/public/_redirects)
- [_headers](file:///Users/harden.gao/workspace/github/hanzibao/public/_headers)

### 4.2 Hanzi Writer 数据加速（避免国内直连 jsDelivr 慢）

- 生产环境笔顺数据优先从同域 `/hw-data/<字>.json` 获取
- 由 Cloudflare Pages Function 代理到 jsDelivr，并做边缘缓存

相关文件：
- [functions/hw-data/[char].js](file:///Users/harden.gao/workspace/github/hanzibao/functions/hw-data/%5Bchar%5D.js)
- [useHanziWriter.ts](file:///Users/harden.gao/workspace/github/hanzibao/src/hooks/useHanziWriter.ts)

### 4.3 Cloudflare Web Analytics（生产环境）

- 通过环境变量 `VITE_CF_WEB_ANALYTICS_TOKEN` 在生产环境注入 beacon

相关文件：
- [cfWebAnalytics.ts](file:///Users/harden.gao/workspace/github/hanzibao/src/utils/cfWebAnalytics.ts)
- [main.tsx](file:///Users/harden.gao/workspace/github/hanzibao/src/main.tsx)

## 5. SEO 基础项

- 增强 title/description/keywords/OG/Twitter meta
- 修复 robots.txt（确保爬虫可访问且文件有效）

相关文件：
- [index.html](file:///Users/harden.gao/workspace/github/hanzibao/index.html)
- [robots.txt](file:///Users/harden.gao/workspace/github/hanzibao/public/robots.txt)

## 6. PWA（添加到桌面）

- manifest：`/manifest.webmanifest`
- service worker：`/sw.js`（生产环境注册）
- 安装引导：
  - Android/Chrome：支持 `beforeinstallprompt` 一键安装
  - iOS/Safari：提示“分享 → 添加到主屏幕”
- 图标：补齐 PNG（192/512 + iOS 180）

相关文件：
- [manifest.webmanifest](file:///Users/harden.gao/workspace/github/hanzibao/public/manifest.webmanifest)
- [sw.js](file:///Users/harden.gao/workspace/github/hanzibao/public/sw.js)
- [InstallBanner.tsx](file:///Users/harden.gao/workspace/github/hanzibao/src/components/InstallBanner/InstallBanner.tsx)
- 图标目录：`public/icons/`
- 图标生成脚本：[generate-pwa-icons.mjs](file:///Users/harden.gao/workspace/github/hanzibao/scripts/generate-pwa-icons.mjs)

## 7. 其他

- .gitignore：忽略 node_modules、dist、日志、测试输出等
- Node 版本：增加 `.node-version` / `.nvmrc` + package.json engines

相关文件：
- [.gitignore](file:///Users/harden.gao/workspace/github/hanzibao/.gitignore)
- [.node-version](file:///Users/harden.gao/workspace/github/hanzibao/.node-version)
- [.nvmrc](file:///Users/harden.gao/workspace/github/hanzibao/.nvmrc)

