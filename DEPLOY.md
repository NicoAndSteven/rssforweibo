# GitHub 免费部署方案

## 方案对比

| 方案 | 平台 | 费用 | 适合场景 |
|------|------|------|----------|
| **Vercel** | Vercel | 免费 | 动态服务（RSSHub） |
| **GitHub Actions** | GitHub | 免费 | 定时抓取生成静态数据 |
| **GitHub Pages** | GitHub | 免费 | 静态文件托管 |
| **Netlify** | Netlify | 免费 | 动态服务 |

---

## 方案 1：Vercel 部署 RSSHub（推荐）

### 步骤

1. **Fork RSSHub 仓库**
   - 访问 https://github.com/DIYgod/RSSHub
   - 点击 Fork

2. **导入 Vercel**
   - 访问 https://vercel.com/new
   - 选择你 Fork 的 RSSHub 仓库
   - 点击 Deploy

3. **获取地址**
   - 部署完成后获得：`https://你的项目名.vercel.app`

4. **更新 App 配置**
   ```kotlin
   private const val RSSHUB_BASE = "https://你的项目名.vercel.app"
   ```

### 优势

- ✅ 完全免费
- ✅ 自动 HTTPS
- ✅ 全球 CDN
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
          
          # 王一博
          curl -s "https://rsshub.app/weibo/keyword/王一博" > data/wangyibo.xml
          
          # 肖战
          curl -s "https://rsshub.app/weibo/keyword/肖战" > data/xiaozhan.xml
          
          # 王一博工作室
          curl -s "https://rsshub.app/weibo/keyword/王一博工作室" > data/wangyibo_studio.xml
          
          # 肖战工作室
          curl -s "https://rsshub.app/weibo/keyword/肖战工作室" > data/xiaozhan_studio.xml
          
          # 生成时间戳
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

4. **数据地址**
   ```
   https://你的用户名.github.io/仓库名/wangyibo.xml
   https://你的用户名.github.io/仓库名/xiaozhan.xml
   ```

5. **修改 App 读取静态数据**

```kotlin
object IdolSources {
    private const val PAGES_BASE = "https://你的用户名.github.io/仓库名"
    
    val TRACKING_LIST = listOf(
        IdolSource(
            id = "wyb_personal",
            name = "王一博",
            avatarUrl = "https://tvax2.sinaimg.cn/crop.0.0.750.750.180/1614532723.jpg",
            rssUrl = "$PAGES_BASE/wangyibo.xml",
            category = "wang_yibo"
        ),
        // ...
    )
}
```

### 优势

- ✅ 完全免费
- ✅ 无需服务器
- ✅ 数据可缓存
- ✅ 支持 CDN 加速

### 劣势

- ⚠️ 数据有延迟（最多2小时）
- ⚠️ 依赖公共 RSSHub 实例

---

## 方案 3：自建 RSSHub + ngrok 内网穿透

### 适用场景

- 有本地电脑可运行 RSSHub
- 不想部署到云平台

### 步骤

1. **启动本地 RSSHub**
   ```bash
   cd rsshub && pnpm dev
   ```

2. **安装 ngrok**
   - 访问 https://ngrok.com 注册
   - 下载并安装

3. **启动内网穿透**
   ```bash
   ngrok http 1200
   ```

4. **获取公网地址**
   ```
   Forwarding: https://xxxx-xx-xx-xxx-xx.ngrok-free.app -> http://localhost:1200
   ```

5. **更新 App 配置**
   ```kotlin
   private const val RSSHUB_BASE = "https://xxxx-xx-xx-xxx-xx.ngrok-free.app"
   ```

### 优势

- ✅ 免费
- ✅ 无需云服务器

### 劣势

- ⚠️ 需要电脑一直开机
- ⚠️ ngrok 地址会变化（免费版）

---

## 推荐方案

| 使用场景 | 推荐方案 |
|----------|----------|
| **长期稳定使用** | Vercel 部署 RSSHub |
| **偶尔使用** | GitHub Actions + Pages |
| **开发测试** | 本地 RSSHub |
| **无公网需求** | 本地 RSSHub + 模拟器 |

---

## 快速开始：Vercel 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/DIYgod/RSSHub)

1. 点击上方按钮
2. 登录 Vercel
3. 点击 Deploy
4. 等待部署完成
5. 获取你的 RSSHub 地址

---

## App 配置更新

部署完成后，修改 `IdolSource.kt`：

```kotlin
object IdolSources {
    // 选择一个地址
    private const val RSSHUB_BASE = "https://你的项目.vercel.app"  // Vercel
    // private const val RSSHUB_BASE = "http://10.0.2.2:1200"      // 本地模拟器
    // private const val RSSHUB_BASE = "https://你的用户名.github.io/仓库名"  // Pages
    
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
