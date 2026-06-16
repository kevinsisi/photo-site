# Photo Site

攝影師個人服務官網。前台展示作品集與價目，後台管理員上傳與管理作品。

部署方式：單一 Docker 容器，照片與 DB 掛載於 `/data` volume，Caddy 反向代理終結 HTTPS。

---

## 環境變數

啟動前必須設定以下環境變數（可放在專案根目錄的 `.env` 檔）：

| 變數名稱              | 必填 | 說明                                                   | 範例                          |
|-----------------------|------|--------------------------------------------------------|-------------------------------|
| `ADMIN_USERNAME`      | 是   | 管理後台登入帳號                                       | `admin`                       |
| `ADMIN_PASSWORD_HASH` | 是   | 管理員密碼的 bcrypt hash（見下方說明）                 | `$2b$12$...`                  |
| `SESSION_SECRET`      | 是   | Express session 加密金鑰，建議至少 32 個隨機字元       | `change-me-to-a-random-string` |
| `PORT`                | 否   | 容器對外監聽 port（預設 `3000`）                       | `3000`                        |
| `DATA_DIR`            | 否   | 容器內資料目錄（預設 `/data`，通常不需更動）           | `/data`                       |

缺少任何必填變數時，容器啟動會立即失敗並輸出明確錯誤訊息，例如：

```
Missing required environment variable(s): ADMIN_PASSWORD_HASH, SESSION_SECRET
```

### 產生 bcrypt 密碼 hash

使用 Node.js 快速產生：

```bash
node -e "require('bcryptjs').hash('你的密碼', 12).then(h => console.log(h))"
```

或以 Docker 臨時容器：

```bash
docker run --rm node:22-slim \
  node -e "require('bcryptjs').hash('你的密碼', 12).then(h => console.log(h))"
```

---

## 快速部署（docker compose）

### 1. 建立 `.env` 檔

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SESSION_SECRET=a-long-random-string-at-least-32-chars
```

### 2. 啟動

```bash
# 首次 build 並啟動
docker compose up -d --build

# 查看 log
docker compose logs -f

# 停止
docker compose down

# 停止並清除 volume（⚠️ 資料會永久刪除）
docker compose down -v
```

### 3. 資料持久化

所有資料（SQLite DB、照片原圖、縮圖）存於 `./data/` 目錄（掛載至容器內的 `/data`）。

容器刪除或升級後，只要 `./data/` 目錄不動，資料即完整保留。

---

## Caddy 反向代理設定範例

在 Caddyfile 中加入對應的 site 設定：

```caddyfile
photo.example.com {
    reverse_proxy localhost:3000
}
```

服務已內建 `trust proxy 1`，正確處理 Caddy 送來的 `X-Forwarded-For` 與 `X-Forwarded-Proto` headers。

Cookie 在 `NODE_ENV=production` 時自動設為 `Secure`，配合 Caddy HTTPS 終結可正常運作。

---

## 種子資料

首次啟動（空 DB）時，server 自動植入：

- **預設分類**：形象照、商品攝影、活動拍攝、婚禮紀錄
- **範例價目方案**：基礎方案、進階方案（均為草稿/未上架狀態，不會在前台顯示）

若 DB 已有資料，種子資料不會重複植入。

---

## 本機開發

```bash
# 安裝依賴
npm ci

# 啟動 server (port 3000) 與 client dev server (port 5173)，各開一個 terminal
npm run dev --workspace=packages/server
npm run dev --workspace=packages/client
```

client 透過 Vite proxy 將 `/api` 請求轉發至 server，開發時不需設定環境變數（`.env` 可省略 `ADMIN_PASSWORD_HASH`，但 `ADMIN_USERNAME`、`SESSION_SECRET` 仍需設定）。
