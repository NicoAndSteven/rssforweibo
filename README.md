# RSSHub Vercel

基于 Vercel 平台部署的 RSSHub 服务，提供微博等平台的 RSS 订阅功能。

## 功能

- 微博关键词搜索订阅
- 自动生成标准 RSS/XML 格式
- 支持 HTTPS 和全球 CDN
- 无需维护服务器
- 支持访问控制（可选）

## 快速部署

### 方式一：一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### 方式二：手动部署

1. **克隆项目**
   ```bash
   git clone <your-repo-url>
   cd rsshub
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **部署到 Vercel**
   ```bash
   npx vercel
   ```

## 环境变量配置

在 Vercel 部署时，点击 **Environment Variables** 展开配置区域：

| 变量名 | 必填 | 说明 | 默认值 |
|--------|------|------|--------|
| `AUTH_CODE` | 否 | 访问密码，设置后需要在请求时携带 | 空（公开访问） |
| `WEIBO_COOKIE` | 否 | 微博 Cookie，用于获取更多数据 | 空 |
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
https://你的域名.vercel.app/weibo/keyword/王一博?code=mysecretcode123
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
https://你的域名.vercel.app/weibo/keyword/王一博
```

获取肖战相关微博的 RSS 订阅：

```
https://你的域名.vercel.app/weibo/keyword/肖战
```

### 在 RSS 阅读器中添加

将上述 URL 添加到任意 RSS 阅读器即可订阅，支持：
- Feedly
- Inoreader
- Reeder
- 以及其他标准 RSS 阅读器

## 本地开发

```bash
npm install
npx vercel dev
```

服务将在 `http://localhost:3000` 启动。

## 项目结构

```
├── api/
│   ├── index.ts              # API 首页
│   └── weibo/keyword/
│       └── [keyword].ts      # 微博关键词路由
├── lib/
│   ├── config.ts             # 环境变量配置
│   ├── rss.ts                # RSS 生成工具
│   └── weibo.ts              # 微博数据抓取
├── package.json
├── tsconfig.json
├── vercel.json               # Vercel 配置
└── .env.example              # 环境变量示例
```

## Vercel 部署注意事项

### 1. 构建与输出设置

- 项目类型识别为 **Other**，这是正常的
- 无需手动配置 Build Command
- Vercel 会自动识别 `api/` 目录下的 Serverless Functions

### 2. 超时限制

Vercel Hobby（免费）账户的 Serverless Functions 超时限制为 **10 秒**。

**已优化措施：**
- 请求超时默认设为 8 秒（留出缓冲时间）
- 单次返回条数限制为 20 条
- 如遇超时，可减小 `MAX_ITEMS` 或 `REQUEST_TIMEOUT`

### 3. 根目录

确保 `package.json` 在仓库根目录下。当前配置已正确。

### 4. 冷启动

Serverless Functions 有冷启动现象，首次请求可能较慢。后续请求会更快。

## 注意事项

- 微博数据来源于移动端接口，可能有访问限制
- RSS 缓存时间为 10 分钟
- 如遇频繁限制，可配置 `WEIBO_COOKIE` 提高访问权限
- 建议设置 `AUTH_CODE` 防止接口被滥用

## 扩展开发

### 添加新的路由

1. 在 `api/` 目录下创建新的路由文件
2. 在 `lib/` 目录下添加对应的数据抓取逻辑
3. 在 `vercel.json` 中添加路由规则

### 示例：添加 Bilibili 路由

```typescript
// api/bilibili/user/[uid].ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAuth, createAuthError } from '../../../lib/config';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!validateAuth(req.headers.authorization)) {
    res.status(401).json(createAuthError());
    return;
  }
  
  const { uid } = req.query;
  // 实现逻辑...
}
```

## License

MIT
