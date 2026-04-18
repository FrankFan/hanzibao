# 汉字宝（Web App）

移动端优先的汉字笔顺学习工具：田字格展示 + 笔顺动画 + 拼音/释义 + TTS 发音（Web Speech API）。

## 本地开发

```bash
pnpm install
pnpm dev
```

## 生产构建与预览

```bash
pnpm build
pnpm preview
```

## Cloudflare Pages 部署

- Build command: `pnpm build`
- Build output directory: `dist`

单页应用（React Router）刷新子路由不 404：已提供 `public/_redirects`

词典分片与静态资源缓存：已提供 `public/_headers`

## Cloudflare Web Analytics

项目已内置 Cloudflare Web Analytics 的 Beacon 注入（仅生产环境启用）。

- 在 Cloudflare Dashboard → Analytics & Logs → Web Analytics 创建站点，拿到 token
- 在 Cloudflare Pages 项目设置里新增环境变量：`VITE_CF_WEB_ANALYTICS_TOKEN=<你的token>`

## Hanzi Writer 数据加速（推荐）

直接请求 `https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest/<字>.json` 在国内可能非常慢。

项目已提供 Cloudflare Pages Function：`/hw-data/<字>.json`

- 线上（`import.meta.env.PROD`）会优先从同域 `/hw-data/...` 拉取，并由 Cloudflare 边缘缓存
- 本地开发仍使用 jsDelivr，避免依赖 Functions 本地模拟

## 数据说明

- 词典数据：`public/data/cedict-*.json`（按 `Math.floor(codePoint / 500)` 分片）
- 示例数据只覆盖少量汉字，用于演示流程
- 若要覆盖更多汉字：将 CC-CEDICT 预处理为上述分片 JSON，构建后作为静态资源部署即可

## 生成全量词典分片（推荐）

会自动下载 CC-CEDICT 并生成 `public/data/cedict-*.json`：

```bash
pnpm data:cedict
```

也可以指定本地 `cedict_ts.u8` 文件：

```bash
node scripts/build-cedict.mjs --input /path/to/cedict_ts.u8 --outDir public/data
```
