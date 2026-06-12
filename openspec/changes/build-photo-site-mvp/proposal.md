# Proposal: build-photo-site-mvp

## Why

攝影師需要一個對外的官方網站來銷售攝影服務：訪客可以瀏覽作品集、查看固定價目表並透過聯絡資訊洽詢；攝影師本人需要一個簡單的管理後台上傳與管理作品照片。目前 repo 只有 template 骨架，沒有任何產品程式碼，需要從零建立 MVP。

## What Changes

- 建立 npm workspaces monorepo（`packages/server` + `packages/client`）
- 前台官網（React + TS + Vite + Tailwind，風格參考 agatha.studio：白底極簡、鼠尾草綠品牌色、作品格狀排列）
  - 首頁：品牌形象 + 服務項目入口
  - 作品集頁：依服務分類瀏覽作品照片
  - 價目表頁：固定方案價目（方案名稱、內容、價格）
  - 聯絡方式（社群連結 / Email / 表單擇一，MVP 先用靜態聯絡資訊）
- 管理後台（單一管理員）
  - 登入（帳密 + session/JWT）
  - 上傳作品照片（自動產生縮圖）、編輯標題/分類、刪除、排序
  - 管理服務分類與價目方案
- 後端 API（Node + Express + TS）
  - 公開 API：作品列表、分類、價目方案
  - 管理 API：登入、照片上傳/管理、分類與方案 CRUD
  - SQLite（better-sqlite3）儲存 metadata，照片存檔案系統 volume
- 部署：Dockerfile + docker-compose，homelab Caddy 反向代理

## Capabilities

### New Capabilities

- `public-site`: 前台官網頁面 — 首頁、作品集瀏覽、固定價目表、聯絡資訊，繁體中文 UI
- `portfolio-management`: 管理員作品管理 — 照片上傳（含縮圖產生）、編輯、刪除、排序與分類管理
- `pricing-management`: 價目方案管理 — 固定價目方案的 CRUD 與前台展示資料來源
- `admin-auth`: 單一管理員驗證 — 登入、session 維持、管理 API 保護
- `deployment`: Docker 化與 homelab 部署 — Dockerfile、compose、照片 volume、Caddy 反向代理相容

### Modified Capabilities

（無 — 全新專案，沒有既有 spec）

## Impact

- 全新程式碼：`packages/server`、`packages/client`、根 `package.json`（npm workspaces）
- 新相依：express、better-sqlite3、sharp（縮圖）、multer（上傳）、react、vite、tailwindcss 等
- 新增 Dockerfile / docker-compose.yml；homelab Caddy 需新增一條 site 設定（部署時處理）
- 照片檔案儲存於 Docker volume，DB 僅存 metadata
