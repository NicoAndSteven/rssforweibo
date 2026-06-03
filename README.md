# RSSHub Cloudflare

基于 Cloudflare Pages 部署的 RSSHub 服务，提供微博等平台的 RSS 订阅功能。

## 功能

- 微博关键词搜索订阅
- 自动生成标准 RSS/XML 格式
- 支持 HTTPS 和全球 CDN
- 无需维护服务器
- 支持访问控制（可选）

## 快速部署

### 前置条件

1. 注册 [Cloudflare](https://dash.cloudflare.com/sign-up) 账号
2. 安装 [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### 方式一：命令行部署

1. **克隆项目**
   ```bash
   git clone <your-repo-url>
   cd rsshub
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **登录 Cloudflare**
   ```bash
   npx wrangler login
   ```

4. **本地开发**
   ```bash
   npm run dev
   ```
   服务将在 `http://localhost:8788` 启动。

5. **部署到生产**
   ```bash
   npm run deploy
   ```

### 方式二：Dashboard 部署

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Workers & Pages → Create → Pages → Connect to Git
3. 选择你的仓库
4. 配置：
   - Build command: `echo "No build needed"`
   - Build output directory: `public`
5. 点击 Save and Deploy

## 环境变量配置

在 Cloudflare Dashboard → Pages → 你的项目 → Settings → Environment variables 中配置：

| 变量名 | 必填 | 说明 | 默认值 |
|--------|------|------|--------|
| `AUTH_CODE` | 否 | 访问密码，设置后需要在请求时携带 | 空（公开访问） |
| `WEIBO_COOKIE` | 否 | 微博 Cookie（可选，不设置则自动生成访客 Cookie） | 空 |
| `REQUEST_TIMEOUT` | 否 | 请求超时时间（毫秒） | `8000` |
| `MAX_ITEMS` | 否 | 单次返回最大条数 | `20` |
| `USER_AGENT` | 否 | 请求 User-Agent | iPhone UA |

### 配置示例

```
AUTH_CODE=mysecretcode123
REQUEST_TIMEOUT=8000
MAX_ITEMS=15
```

### 访问控制

如果设置了 `AUTH_CODE`，请求时需要携带认证信息：

**方式一：Authorization Header**
```
Authorization: Bearer mysecretcode123
```

**方式二：Query Parameter**
```
https://你的域名.pages.dev/weibo/keyword/王一博?code=mysecretcode123
```

## API 路由

| 路由 | 说明 | 示例 |
|------|------|------|
| `/` | API 信息 | `/` |
| `/weibo/keyword/:keyword` | 微博关键词搜索 | `/weibo/keyword/王一博` |

## 使用示例

### 微博关键词订阅

获取王一博相关微博的 RSS 订阅：

```
https://你的域名.pages.dev/weibo/keyword/王一博
```

### 在 RSS 阅读器中添加

将上述 URL 添加到任意 RSS 阅读器即可订阅，支持 Feedly、Inoreader、Reeder 等。

## 本地开发

```bash
npm install
npm run dev
```

服务将在 `http://localhost:8788` 启动。

## 项目结构

```
├── functions/
│   ├── index.ts              # API 首页
│   └── weibo/keyword/
│       └── [keyword].ts      # 微博关键词路由
├── lib/
│   ├── config.ts             # 环境变量配置 + 权限校验
│   ├── rss.ts                # RSS 生成工具
│   └── weibo.ts              # 微博数据抓取
├── public/                   # 静态资源目录
├── wrangler.toml             # Cloudflare 配置
├── package.json
└── tsconfig.json
```

## Cloudflare 部署注意事项

### 1. 运行时限制

- Cloudflare Workers 使用 V8 引擎，不支持 Node.js 原生 API
- 本项目已适配：使用 `fetch()` 替代 `axios`，手写 XML 替代 `rss` 包
- 免费计划 CPU 时间限制为 10ms/请求（网络 I/O 不计入）

### 2. 环境变量

- 敏感变量（`AUTH_CODE`）建议使用 `wrangler secret put` 或 Dashboard 加密存储
- `WEIBO_COOKIE` 可选 — 不设置时自动生成访客 Cookie（缓存 3 小时，自动刷新）
- 非敏感变量直接在 Dashboard 的 Environment variables 中配置

### 3. 自定义域名

在 Cloudflare Dashboard → Pages → 你的项目 → Custom domains 中添加自定义域名。

## 扩展开发

### 添加新的路由

1. 在 `functions/` 目录下创建新的路由文件
2. 在 `lib/` 目录下添加对应的数据抓取逻辑
3. 导出 `onRequestGet: PagesFunction<Env>` 处理函数

### 示例：添加 Bilibili 路由

```typescript
// functions/bilibili/user/[uid].ts
import { createConfig, validateAuth, createAuthError } from '../../../lib/config';

interface Env {
  AUTH_CODE?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const cfg = createConfig(context.env);
  const authHeader = context.request.headers.get('Authorization') || undefined;
  const url = new URL(context.request.url);
  const queryCode = url.searchParams.get('code') || undefined;

  if (!validateAuth(authHeader || queryCode, cfg)) {
    return Response.json(createAuthError(), { status: 401 });
  }

  const uid = context.params.uid as string;
  // 实现逻辑...
};
```

## License

MIT
