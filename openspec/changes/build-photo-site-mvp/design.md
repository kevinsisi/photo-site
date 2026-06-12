# Design: build-photo-site-mvp

## Context

全新專案，repo 目前只有 template 骨架。目標是攝影師個人的服務銷售官網：前台展示作品與固定價目，後台單一管理員上傳/管理作品。部署在 homelab（RPi/Docker + Caddy 反向代理）。風格參考 agatha.studio：白底極簡、鼠尾草綠（sage green）品牌色、作品格狀排列、繁體中文 UI。

## Goals / Non-Goals

**Goals:**

- 前台：首頁、作品集（依分類）、固定價目表、聯絡資訊
- 後台：單一管理員登入，上傳/編輯/刪除/排序作品照片，管理分類與價目方案
- 照片上傳自動產生縮圖（列表用）與保留原圖（lightbox/詳情用）
- 單一 Docker image 部署（server 同時 serve API 與前端靜態檔），照片與 DB 放 volume

**Non-Goals:**

- 線上付款、購物車、訂單系統
- 詢價表單/報價計算器（MVP 用靜態聯絡資訊）
- 多使用者、權限角色
- 多語系（僅繁體中文）
- CDN / 外部物件儲存（照片直接存本機 volume）

## Decisions

1. **Monorepo：npm workspaces，`packages/server` + `packages/client`**
   — 依 `project-stack-standard` 預設。production 時 server 直接 serve client build 產物，單一容器即可部署。

2. **後端 Express + TypeScript、SQLite（better-sqlite3）**
   — 依 stack 標準。資料量小（單一攝影師的作品與方案），SQLite 足夠且零維運。DB 檔放 `/data` volume。

3. **照片儲存：檔案系統 volume（`/data/photos`），DB 只存 metadata**
   — 原圖存 `original/`，上傳時用 `sharp` 產生 WebP 縮圖（列表約 800px）與中圖（lightbox 約 1600px）。避免把 binary 塞進 SQLite，備份也簡單（整個 `/data` 目錄）。

4. **驗證：單一管理員，帳密存環境變數（bcrypt hash），HTTP-only cookie session**
   — 只有一個使用者，不需要 user table。選 cookie session（`express-session` + SQLite store 或 signed cookie）而非 JWT：同源部署下 cookie 更簡單安全（HttpOnly、SameSite=Lax），不用處理 token 存放。

5. **上傳：`multer` 接收 multipart，限制檔案型別（jpeg/png/webp）與大小（上限 25MB）**
   — 上傳後由 sharp 轉檔；轉檔失敗則整筆 rollback（刪暫存檔、不寫 DB）。

6. **前台路由：React Router，頁面 = 首頁 / 作品集 `/works/:category?` / 價目 `/pricing` / 聯絡（首頁區塊或獨立頁）；後台 `/admin/*`**
   — SPA 即可，SEO 需求低（個人官網靠 IG 導流）；`index.html` 加好 meta/OG tags。

7. **視覺系統：Tailwind，品牌色 sage green（約 `#8A9A7B` 系列）+ 白底 + 深灰文字**
   — 對齊 agatha.studio 參考：大量留白、細字級導覽、作品卡片配品牌色標籤條。實作時套用 `skills/frontend-design/SKILL.md`。

8. **部署：multi-stage Dockerfile（build client → build server → runtime），docker-compose 掛 `/data` volume**
   — Caddy 已在 homelab 運作，只需 reverse_proxy 到容器 port。映像需支援 arm64（RPi）。

## Risks / Trade-offs

- [RPi 上 sharp 轉檔較慢] → 上傳是低頻管理操作，可接受；轉檔放在請求內同步處理，逾時設寬鬆。
- [SPA SEO 較弱] → MVP 接受；之後若要 SEO 可加 prerender 或換 SSR。
- [照片存本機 volume，無異地備援] → 依 homelab 既有備份流程備份 `/data`；非本變更範圍。
- [帳密放環境變數] → 單一管理員下最簡方案；洩漏風險靠 homelab 網路邊界與 HTTPS 控制。

## Migration Plan

全新專案無遷移。部署步驟：build image → compose up → Caddy 加 site 設定。回滾 = 退回前一個 image tag；`/data` volume 與程式碼版本無耦合。

## Open Questions

- 網域名稱與 Caddy hostname（部署時再定）
- 服務分類初始清單與價目內容（可先放種子資料，由管理後台修改）
