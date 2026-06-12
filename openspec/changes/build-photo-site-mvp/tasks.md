# Tasks: build-photo-site-mvp

## 1. Monorepo 與基礎建設

- [x] 1.1 建立 npm workspaces 根結構（`package.json`、`packages/server`、`packages/client`、共用 tsconfig、.gitignore）
- [x] 1.2 初始化 server（Express + TS + better-sqlite3，含 dev/build/start scripts）
- [x] 1.3 初始化 client（Vite + React + TS + Tailwind + React Router，含品牌色 design tokens）
- [x] 1.4 建立 SQLite schema 與 migration/init（categories、photos、plans 資料表）與啟動時環境變數檢查

## 2. 後端 API

- [x] 2.1 公開 API：作品列表（含分類篩選）、分類列表、上架價目方案列表；靜態提供照片檔案
- [x] 2.2 admin-auth：登入/登出/session 檢查 endpoint（bcrypt 驗證、HTTP-only cookie、登入 rate limit、管理 API 驗證 middleware）
- [x] 2.3 作品管理 API：multer 上傳（型別/大小限制）→ sharp 產生縮圖與中圖 → 寫 DB，失敗整筆回滾；編輯/刪除（連檔案）/排序
- [x] 2.4 分類管理 API：CRUD + 排序，刪除非空分類阻擋
- [x] 2.5 價目方案管理 API：CRUD + 上下架 + 排序

## 3. 前台頁面

- [x] 3.1 全站 layout：導覽、footer、繁中 UI、白底極簡 + 鼠尾草綠視覺系統、RWD
- [x] 3.2 首頁：品牌識別、精選作品視覺、服務入口
- [x] 3.3 作品集頁：分類導覽 + 格狀作品牆 + lightbox 大圖
- [x] 3.4 價目表頁：上架方案卡片（名稱/說明/內容/價格）
- [x] 3.5 聯絡區塊：IG / Email / LINE 連結

## 4. 管理後台

- [ ] 4.1 登入頁與 auth 狀態管理（未登入導向登入頁）
- [ ] 4.2 作品管理頁：上傳（含進度）、列表、編輯標題/分類、發布切換、刪除、排序
- [ ] 4.3 分類管理頁：CRUD + 排序
- [ ] 4.4 價目方案管理頁：CRUD + 上下架 + 排序

## 5. 部署與驗證

- [ ] 5.1 multi-stage Dockerfile（arm64 相容）+ docker-compose（`/data` volume、環境變數）
- [ ] 5.2 反向代理相容：trust proxy、cookie secure 設定、README 部署說明（Caddy site 範例）
- [ ] 5.3 本機端對端驗證：build → compose up → 走過上傳/編輯/刪除/前台瀏覽全流程，確認容器重建後資料保留
- [ ] 5.4 種子資料：預設分類與範例價目方案
- [ ] 5.5 完成檢查：依 completion-checklist 跑 build 驗證、更新 spec、commit + push
