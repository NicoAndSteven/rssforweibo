# 部署方案

## 方案对比

| 方案 | 平台 | 费用 | 适合场景 |
|------|------|------|----------|
| **Cloudflare Pages** | Cloudflare | 免费 | 动态服务（推荐） |
| **GitHub Actions** | GitHub | 免费 | 定时抓取生成静态数据 |
| **GitHub Pages** | GitHub | 免费 | 静态文件托管 |

---

## 方案 1：Cloudflare Pages 部署（推荐）

### 前置条件

1. 注册 [Cloudflare](https://dash.cloudflare.com/sign-up) 账号
2. 安装 Node.js 18+

### 命令行部署

```bash
# 克隆项目
git clone <your-repo-url>
cd rsshub

# 安装依赖
npm install

# 登录 Cloudflare
npx wrangler login

# 本地开发
npm run dev

# 部署到生产
npm run deploy
```

### Dashboard 部署

1. Fork 本仓库
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. Workers & Pages → Create → Pages → Connect to Git
4. 选择仓库，配置：
   - Build command: `echo "No build needed"`
   - Build output directory: `public`
5. 部署完成后获得：`https://你的项目名.pages.dev`

### 环境变量

在 Dashboard → Pages → Settings → Environment variables 配置：

```
AUTH_CODE=mysecretcode123
WEIBO_COOKIE=你的微博cookie
REQUEST_TIMEOUT=8000
MAX_ITEMS=20
```

或使用 CLI：
```bash
npx wrangler secret put AUTH_CODE
npx wrangler secret put WEIBO_COOKIE
```

### 优势

- ✅ 完全免费
- ✅ 自动 HTTPS
- ✅ 全球 CDN（边缘计算）
- ✅ 无需维护服务器
- ✅ 自动部署更新

---

## 方案 2：GitHub Actions + 静态 JSON

### 原理

```
GitHub Actions (定时) → 抓取 RSS → 生成 JSON → GitHub Pages (托管)
                                              ↓
                                        App 读取静态文件
```

### 步骤

1. **创建仓库**

2. **添加 Workflow 文件**

创建 `.github/workflows/fetch-rss.yml`：

```yaml
name: Fetch RSS Data

on:
  schedule:
    - cron: '0 */2 * * *'  # 每2小时执行一次
  workflow_dispatch:        # 支持手动触发

permissions:
  contents: write

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Fetch RSS Data
        run: |
          mkdir -p data
          
          # 替换为你的 Cloudflare Pages 域名
          CF_BASE="https://你的项目名.pages.dev"
          
          curl -s "$CF_BASE/weibo/keyword/王一博" > data/wangyibo.xml
          curl -s "$CF_BASE/weibo/keyword/肖战" > data/xiaozhan.xml
          
          echo "{\"updated_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > data/meta.json
      
      - name: Commit Changes
        run: |
          git config user.name "RSS Bot"
          git config user.email "bot@example.com"
          git add data/
          git diff --staged --quiet || git commit -m "Update RSS data - $(date -u +%Y-%m-%d_%H:%M)"
          git push

      - name: Deploy to Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./data
```

3. **启用 GitHub Pages**
   - 仓库 → Settings → Pages
   - Source: `gh-pages` 分支

### 优势

- ✅ 完全免费
- ✅ 无需服务器
- ✅ 数据可缓存

### 劣势

- ⚠️ 数据有延迟（最多2小时）
- ⚠️ 依赖 Cloudflare Pages 实例

---

## 快速开始：Cloudflare Pages 部署

1. Fork 本仓库
2. 登录 Cloudflare Dashboard
3. Workers & Pages → Create → Pages → Connect to Git
4. 选择仓库，Deploy
5. 配置环境变量
6. 获取你的 RSSHub 地址

---

## App 配置更新

部署完成后，修改 `IdolSource.kt`：

```kotlin
object IdolSources {
    private const val RSSHUB_BASE = "https://你的项目名.pages.dev"
    
    val TRACKING_LIST = listOf(
        IdolSource(
            id = "wyb_personal",
            name = "王一博",
            avatarUrl = "https://tvax2.sinaimg.cn/crop.0.0.750.750.180/1614532723.jpg",
            rssUrl = "$RSSHUB_BASE/weibo/keyword/王一博",
            category = "wang_yibo"
        ),
        // ... 其他配置
    )
}
```
