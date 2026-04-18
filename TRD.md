# 汉字学习 Web App — 技术需求文档（TRD）

> 面向 C 端用户，性能优先，移动端优先
> 

| 项目 | 内容 |
| --- | --- |
| 版本 | v0.1 草稿 |
| 关联文档 | 产品需求文档 PRD v0.1 |
| 目标平台 | Web（移动端优先，兼容桌面） |
| Node.js 要求 | >= 20.19（Vite 8 最低要求） |

---

## 一、技术选型

### 核心框架

| 分类 | 技术 | 版本 | 选型理由 |
| --- | --- | --- | --- |
| 构建工具 | Vite | ^8.0 | Rolldown（Rust）统一打包，构建速度较 Vite 7 提升 10–30 倍，内置 Devtools |
| UI 框架 | React | ^19 | 生态成熟，Suspense + Concurrent 模式支持流式渲染 |
| 语言 | TypeScript | ^5.8 | 静态类型保障，与 React 19 深度集成 |
| 样式 | Tailwind CSS | ^4.0 | CSS-first 配置，零 JS 运行时，与 Vite 8 插件深度优化 |
| React 插件 | @vitejs/plugin-react | ^6.0 | Oxc 替代 Babel 做 React Refresh，安装体积更小，速度更快 |

### 汉字核心库

| 分类 | 技术 | 说明 |
| --- | --- | --- |
| 笔顺数据 + 动画 | hanzi-writer | MIT 协议，内置 SVG 路径和笔顺数据，提供完整动画 API |
| 拼音 / 释义数据 | CC-CEDICT（本地 JSON） | 离线化处理为静态 JSON，避免运行时网络请求 |
| TTS 发音 | Web Speech API | 浏览器原生，零依赖；不支持时降级为静态音频文件 |

### 工程工具链

| 分类 | 技术 | 说明 |
| --- | --- | --- |
| 包管理 | pnpm | 更快的安装速度，节省磁盘空间 |
| 测试 | Vitest ^4 | 与 Vite 同生态，支持 Browser Mode |
| 代码规范 | ESLint + Prettier（Oxfmt） | Oxfmt 格式化速度比 Prettier 快 30 倍 |
| 路由 | React Router v7 | 支持 File-based Routing，与 Vite 集成优秀 |
| 状态管理 | Zustand | 轻量，无 Provider 样板，适合此体量应用 |

---

## 二、项目结构

```
hanzi-app/
├── public/
│   ├── data/
│   │   ├── cedict.json          # CC-CEDICT 离线词典（按首字母分片）
│   │   └── audio/               # TTS 降级用静态音频文件
│   └── favicon.svg
├── src/
│   ├── assets/                  # 静态资源（图片、字体）
│   ├── components/
│   │   ├── CharacterGrid/       # 田字格 + Hanzi Writer 容器
│   │   ├── PinyinBadge/         # 拼音标注 + 发音按钮
│   │   ├── DefinitionCard/      # 释义与词组展示
│   │   ├── StrokeControls/      # 动画播放控制（播放/暂停/速度/重播）
│   │   └── SearchBar/           # 汉字输入框
│   ├── hooks/
│   │   ├── useHanziWriter.ts    # Hanzi Writer 实例管理
│   │   ├── useDictionary.ts     # 拼音 / 释义查询
│   │   └── useTTS.ts            # TTS 播放（含降级逻辑）
│   ├── stores/
│   │   └── characterStore.ts    # Zustand：当前汉字、动画状态
│   ├── pages/
│   │   ├── Home.tsx             # 首页（搜索入口）
│   │   └── Character.tsx        # 汉字详情页
│   ├── utils/
│   │   ├── pinyin.ts            # 拼音格式化工具
│   │   └── cedict.ts            # 词典查询工具函数
│   ├── types/
│   │   └── index.ts             # 全局 TypeScript 类型定义
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 三、性能策略

这是 C 端应用，以下性能要求为硬性指标。

### 加载性能目标

| 指标 | 目标值 |
| --- | --- |
| FCP（首次内容渲染） | ≤ 1.5 秒 |
| LCP（最大内容渲染） | ≤ 2.5 秒 |
| TTI（可交互时间） | ≤ 3.0 秒 |
| Lighthouse 评分 | ≥ 90（移动端） |

### 关键优化措施

**代码分割与懒加载**

```tsx
// Character 页面懒加载，首屏不打包 Hanzi Writer
const CharacterPage = lazy(() => import('./pages/Character'));
```

**词典数据分片**

CC-CEDICT 原始数据约 10MB，需在构建期预处理：

- 按汉字 Unicode 区间拆分为多个小 JSON 文件
- 用户查询时动态 `fetch` 对应分片，单次请求 ≤ 50KB
- 使用 `Cache-Control: max-age=31536000` + 文件名 hash 做长期缓存

**Hanzi Writer 资源按需加载**

```tsx
// 仅在用户进入 Character 页时加载笔顺数据
const writer = HanziWriter.create(el, char, {
  charDataLoader: (char) =>
    fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest/${char}.json`)
      .then(res => res.json()),
});
```

**资源预连接**

```html
<!-- index.html -->
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
```

**图片 / 资源优化**

- 所有图标使用内联 SVG，零网络请求
- 字体使用系统字体栈，避免加载自定义中文字体（体积过大）

---

## 四、核心模块实现

### 4.1 田字格与笔顺动画

田字格通过 CSS Grid 绘制，Hanzi Writer 实例挂载在格内 `<svg>` 元素上。

```tsx
// hooks/useHanziWriter.ts
import HanziWriter from 'hanzi-writer';

export function useHanziWriter(char: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);

  useEffect(() => {
    if (!containerRef.current || !char) return;
    writerRef.current = HanziWriter.create(containerRef.current, char, {
      width: 280,
      height: 280,
      padding: 20,
      showOutline: true,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 300,
      charDataLoader: (c) =>
        fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest/${c}.json`)
          .then(r => r.json()),
    });
    return () => writerRef.current?.cancelAnimation();
  }, [char]);

  return {
    containerRef,
    animateCharacter: () => writerRef.current?.animateCharacter(),
    pauseAnimation: () => writerRef.current?.pauseAnimation(),
    resumeAnimation: () => writerRef.current?.resumeAnimation(),
    setSpeed: (speed: number) =>
      writerRef.current?.updateColor('strokeColor', '#000'), // 通过重建实例更新速度
  };
}
```

### 4.2 拼音与释义查询

```tsx
// hooks/useDictionary.ts
export function useDictionary(char: string) {
  const [entry, setEntry] = useState<DictEntry | null>(null);

  useEffect(() => {
    if (!char) return;
    const codePoint = char.codePointAt(0)!;
    const shard = Math.floor(codePoint / 500); // 按 Unicode 分片
    fetch(`/data/cedict-${shard}.json`)
      .then(r => r.json())
      .then((data: Record<string, DictEntry>) => setEntry(data[char] ?? null));
  }, [char]);

  return entry;
}
```

### 4.3 TTS 发音（含降级）

```tsx
// hooks/useTTS.ts
export function useTTS() {
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = 'zh-CN';
      utt.rate = 0.8;
      speechSynthesis.speak(utt);
    } else {
      // 降级：播放预录制静态音频
      new Audio(`/data/audio/${encodeURIComponent(text)}.mp3`).play();
    }
  }, []);

  return { speak };
}
```

---

## 五、关键页面：汉字详情

```
┌─────────────────────────────────┐
│   搜索栏（SearchBar）            │
├─────────────────────────────────┤
│                                 │
│     拼音 + 🔊（PinyinBadge）    │
│                                 │
│   ┌─────────────────────────┐   │
│   │   田字格（CharacterGrid）│   │
│   │   Hanzi Writer SVG      │   │
│   └─────────────────────────┘   │
│                                 │
│   [播放] [暂停] [重播] 速度 ──  │
│                                 │
├─────────────────────────────────┤
│   释义 + 词组（DefinitionCard）  │
└─────────────────────────────────┘
```

---

## 六、Vite 8 配置参考

```tsx
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),           // Oxc-powered，无需 Babel
    tailwindcss(),     // Tailwind v4 官方 Vite 插件
  ],
  build: {
    rollupOptions: {
      output: {
        // 手动分包：Hanzi Writer 单独 chunk
        manualChunks: {
          'hanzi-writer': ['hanzi-writer'],
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
    // 开启 CSS 代码分割
    cssCodeSplit: true,
    // 生产环境去除 console
    minify: 'rolldown',
  },
  // 预构建优化：提前处理 CJS 依赖
  optimizeDeps: {
    include: ['hanzi-writer', 'zustand'],
  },
});
```

---

## 七、TypeScript 类型定义

```tsx
// types/index.ts

/** CC-CEDICT 词条 */
export interface DictEntry {
  traditional: string;
  simplified: string;
  pinyin: string;        // 例："hàn zì"
  definitions: string[]; // 例：["Chinese character", "Han character"]
  examples: WordExample[];
}

export interface WordExample {
  word: string;
  pinyin: string;
  meaning: string;
}

/** 动画控制状态 */
export interface AnimationState {
  isPlaying: boolean;
  speed: number;          // 0.5 | 1 | 1.5 | 2
  currentStroke: number;
  totalStrokes: number;
}

/** Zustand Store */
export interface CharacterStore {
  currentChar: string;
  animation: AnimationState;
  setChar: (char: string) => void;
  setSpeed: (speed: number) => void;
  setPlaying: (playing: boolean) => void;
}
```

---

## 八、测试策略

| 测试类型 | 工具 | 覆盖目标 |
| --- | --- | --- |
| 单元测试 | Vitest | hooks、utils 函数，覆盖率 ≥ 80% |
| 组件测试 | Vitest + @testing-library/react | 核心组件交互逻辑 |
| E2E 测试 | Playwright | 主流程：输入汉字 → 动画播放 → 查看释义 |
| 性能测试 | Lighthouse CI | 每次 PR 自动跑 Lighthouse，LCP 回归则阻断合并 |

---

## 九、部署与 CI/CD

```
代码提交 → GitHub Actions
  ├── pnpm install
  ├── ESLint + TypeScript 检查
  ├── Vitest 单元测试
  ├── vite build（Rolldown 构建）
  ├── Lighthouse CI（性能回归检测）
  └── 部署至 Vercel / Cloudflare Pages（推荐后者，边缘节点更靠近中国用户）
```

**推荐托管平台**：Cloudflare Pages

- 全球边缘 CDN，中国大陆访问延迟更低
- 静态资源无限带宽免费
- 内置 Workers 可做边缘缓存与 API 代理

---

## 十、依赖版本锁定（package.json 参考）

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.0.0",
    "hanzi-writer": "^3.5.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "vite": "^8.0.0",
    "@vitejs/plugin-react": "^6.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.8.0",
    "vitest": "^4.0.0",
    "@testing-library/react": "^16.0.0",
    "playwright": "^1.50.0"
  }
}
```

---

## 附：技术风险与应对

| 风险 | 等级 | 应对策略 |
| --- | --- | --- |
| Hanzi Writer 数据 CDN 在国内访问慢 | 高 | 将笔顺 JSON 数据自托管至国内 CDN（如阿里云 OSS）或打包进应用 |
| Web Speech API 在 iOS Safari 兼容性 | 中 | 检测支持情况，降级为预录制音频文件 |
| CC-CEDICT 释义为英文 | 中 | 一期使用英文释义 + 中文词组；二期接入中文词典 API 或自建数据集 |
| Vite 8 / plugin-react v6 生态兼容性 | 低 | 锁定版本，上线前全量跑 E2E；问题严重可回退至 Vite 7 + plugin-react v5 |