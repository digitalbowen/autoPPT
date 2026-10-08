# EduGen · 资料驱动的教学生成工具

老师上传学习材料（PDF / Word / 纯文本）→ 勾选内容 → AI 生成教学 **PPT** + **互动练习题** → 课堂展示与自测。

参考 NotebookLM 的「资料驱动」理念，并强化：出 PPT、出互动题、可导出 `.pptx`、可溯源（每页/每题标注来源片段）。

- 纯前端（Vite + React 18 + TS）+ Vercel Serverless Function
- LLM：阿里云百炼（DashScope）OpenAI 兼容模式
- 所有课程数据保存在浏览器 IndexedDB，**API Key 只存在服务端，前端永不出现**

## 技术栈

Vite · React 18 · TypeScript(strict) · Tailwind CSS · zustand · idb(IndexedDB) · pdfjs-dist · mammoth · reveal.js · pptxgenjs

## 本地开发

```bash
npm i
npm run dev      # 启动 Vite 开发服务器
npm run build    # 类型检查 + 构建产物到 dist/
```

> 本地直接 `npm run dev` 时，`/api/generate` 由 Vercel 托管。若要在本地联调云函数，使用：
>
> ```bash
> npm i -g vercel
> vercel dev       # 同时跑前端与 api/ 函数，读取 .env.local
> ```

把 `.env.example` 复制为 `.env.local` 并填入你的 Key（见下）。

## 阿里云百炼（DashScope）配置

1. 开通并获取 API Key：登录 [阿里云百炼控制台](https://bailian.console.aliyun.com/) → 「API-KEY 管理」创建 Key（形如 `sk-xxxx`）。
2. 环境变量（三个）：

   | 变量 | 说明 | 默认/示例 |
   | --- | --- | --- |
   | `DASHSCOPE_API_KEY` | 百炼 API Key | `sk-xxxxxxxx` |
   | `DASHSCOPE_BASE_URL` | OpenAI 兼容 base_url | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
   | `DASHSCOPE_MODEL` | 默认模型 | `qwen-plus` |

3. 模型列表（可在前端下拉切换，也可改默认值）：
   - `qwen-plus`：均衡，默认
   - `qwen-max`：能力最强，适合复杂出题
   - `qwen-turbo`：最快最省，适合草稿

   如使用 `qwen3` 系列，云函数会自动在请求体加入 `enable_thinking: false`（非流式 JSON 输出需要）。

### 区域说明

- **国内站**：Key 用 `https://dashscope.aliyuncs.com/compatible-mode/v1`
- **国际站**：Key 用 `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

二者 Key 不通用，按你开通的站点填 `DASHSCOPE_BASE_URL`。

## 部署（代码在 GitHub，运行在 Vercel）

> ⚠️ **不能用 GitHub Pages 运行**：本项目需要 Serverless 函数（`api/generate.ts`）来隐藏 API Key，GitHub Pages 只能托管静态文件。代码可以托管在 GitHub，但**运行必须在 Vercel**（或其他支持 Serverless 的平台）。

1. 把代码推到 GitHub：

   ```bash
   git init && git add . && git commit -m "init edugen"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. 打开 [vercel.com](https://vercel.com) → **Add New → Project → Import** 你的 GitHub 仓库。
3. Framework 会自动识别为 Vite（`vercel.json` 已配置 build 命令与 `dist` 输出目录）。
4. 在 **Settings → Environment Variables** 填入三个变量：
   - `DASHSCOPE_API_KEY`
   - `DASHSCOPE_BASE_URL`
   - `DASHSCOPE_MODEL`
5. Deploy，之后每次 push 自动部署。

## 换模型 / 换厂商

- 换百炼模型：改环境变量 `DASHSCOPE_MODEL`，或在生成页右上角下拉切换 `qwen-plus / qwen-max / qwen-turbo`。
- 换厂商（DeepSeek / 智谱等）：云函数全程使用 **OpenAI 兼容 fetch** 写法（未引入阿里官方 SDK），只需改 `DASHSCOPE_BASE_URL` 与 `DASHSCOPE_MODEL`，鉴权仍是 `Authorization: Bearer <key>` 即可无缝切换。

## 功能流程

`[上传] → [勾选] → [生成] → [课堂]`

- **上传**：PDF 按页提取（带页码）、Word(mammoth) 提取、支持粘贴文本。
- **勾选**：左原文分页预览 / 右 chunk 列表勾选「纳入生成」；chunk 按标题（`#`、第X章/节、`1.1`）+段落切分，≤800 字/段。
- **生成**：
  - PPT：选受众/页数/风格 → reveal.js 渲染，每页标注「来源：c1,c3」，可点击文字直接编辑，导出 `.pptx`（含演讲者备注）。
  - 练习题：选题型（选择/填空/简答）、数量、难度 1–5。
- **课堂**：选择题点选即判、填空去空格比对、简答调用 AI 批改（星级+建议）；记录正确率/耗时/错题；错题本展示原题+原文片段+再练一次；「给提示」只给线索不给答案。
- 支持「导出课程 JSON」做备份。

## 数据与隐私

- 课程数据（原文、chunk、幻灯片、题目、作答）仅存浏览器 **IndexedDB**，不上传、不入库。
- 生成时仅把你**勾选的片段**发给云函数转发到百炼。
- API Key 只在 Vercel 服务端环境变量中，前端代码与网络请求都不包含 Key。

## 项目结构

```
src/
  App.tsx                步骤流 Upload → Preview → Generate → Classroom
  store/courseStore.ts   zustand + idb 持久化
  parser/                useFileParser(pdf/word/text) + chunk 切分
  components/            StepUpload/Preview/Generate/Classroom、PptView、QuizItem、Toast、Skeleton
  lib/                   api.ts(fetch /api/generate) + exportPptx.ts
  types.ts
api/generate.ts          Vercel Function，调百炼（key 仅在此）
vercel.json .env.example tailwind.config.js vite.config.ts tsconfig.json
```
