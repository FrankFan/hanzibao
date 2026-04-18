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
