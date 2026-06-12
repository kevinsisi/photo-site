# Proposal: visual-experience-redesign

## Why

目前網站功能完整但毫無美感：前台作品集是死板的等寬方格、沒有任何進場動效；後台一次只能同步上傳一張照片、失敗無法重試；設定頁只有一個網站名稱欄位。作為攝影師的個人展示網站，視覺呈現本身就是產品力，需要「逛展」等級的前台體驗與理想的後台工作流。

## What Changes

- 新增主題系統：6 組配色（米白美術館、深色畫廊、鼠尾草綠、暖棕底片、極簡黑白、墨藍夜展）× 3 種版型（masonry / editorial / justified）× 4 檔動畫強度（off / subtle / curated / dramatic），全部 token 化（CSS variables），由後台設定、存於 settings 表
- 前台作品集重寫：照片保留原始比例，依設定切換三種版型；進場動畫（IntersectionObserver，僅首次入畫播放）；分類切換 crossfade；Lightbox 升級（左右切換、鍵盤導航、圖說、張數）
- 照片資料補充：`photos` 表新增 `width`/`height` 欄位，上傳時由 sharp 寫入，既有照片啟動時回填
- 後台上傳重寫：多選 + 拖放、背景上傳佇列（射後不理、換頁不中斷）、左下角 Google Drive 式進度面板、自動重試 1 次 + 手動重試、每檔逾時保護、並行上限 2
- 後台 UI 翻新：PhotosPage 由表格改為縮圖卡片牆；SettingsPage 新增「外觀」區，配色 × 版型 × 動畫即時 preview（與前台共用同一套 token 與 class）
- 零新依賴：不引入動畫庫或 gallery 庫，純 CSS + 自寫 hook/演算法

## Capabilities

### New Capabilities

（註：`build-photo-site-mvp` change 尚未 archive，`openspec/specs/` 尚無主 spec，因此本次相關行為以新 capability 定義）

- `site-appearance`: 主題系統 — 配色 / 版型 / 動畫設定的儲存、公開 API 曝露、token 化套用、後台外觀設定與即時 preview
- `gallery-presentation`: 前台作品集呈現 — 三種版型演算法、進場動畫、分類切換過渡、Lightbox 導航
- `photo-upload-queue`: 後台多檔背景上傳 — 佇列、進度面板、重試、逾時、並行控制、照片尺寸記錄

### Modified Capabilities

（無 — 主 specs 尚不存在；對既有行為的調整一併寫入上述新 capability spec）

## Impact

- **Client**：`WorksPage.tsx` 重寫；`Lightbox.tsx` 重寫；`PhotosPage.tsx` 重寫（上傳區 + 卡片牆）；`SettingsPage.tsx` 擴充外觀區與 preview；新增 `UploadManager` context、`useReveal` hook、版型演算法 util；`index.css` 全面 token 化；`AdminLayout` 掛上傳面板
- **Server**：`adminSettings.ts` 擴充三個 setting key 與驗證；`public.ts` settings 回應擴充；`adminPhotos.ts` 上傳時寫入 width/height；`db/index.ts` schema 遷移 + 既有照片尺寸回填
- **API**：`GET /api/settings` 回應新增 `theme` / `layout` / `animation` 欄位（向後相容）；`PUT /api/admin/settings` 接受新欄位；照片回應新增 `width` / `height`
- **依賴**：無新增
