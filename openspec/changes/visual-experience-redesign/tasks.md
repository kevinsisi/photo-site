# Tasks: visual-experience-redesign

## 1. Server — settings 與照片尺寸

- [x] 1.1 `db/index.ts`：photos 表新增 width/height 欄位（PRAGMA 防重複）、啟動回填缺尺寸照片（sharp 讀 original，單張失敗記 log 不擋啟動）
- [x] 1.2 `adminPhotos.ts`：上傳時寫入 width/height；GET 回應含 width/height
- [x] 1.3 `adminSettings.ts` + `public.ts`：theme/layout/animation 三 key 的白名單驗證、預設值、GET/PUT 支援；photos 公開 API 回應含 width/height

## 2. Client — 主題 token 系統

- [x] 2.1 `index.css`：定義 8 token × 6 配色（`[data-theme]`），現有 sage 色整理為其中一組；移除元件中硬編碼色改用 token
- [x] 2.2 `useSiteSettings` 擴充 theme/layout/animation；App 載入時掛 `data-theme/data-layout/data-anim` 至 `<html>`
- [x] 2.3 四檔進場動畫 CSS（`[data-anim]` 區分）+ `prefers-reduced-motion` 降級

## 3. Client — 前台 gallery 重寫

- [x] 3.1 版型演算法 util（justified 貪婪分列、masonry 最短欄分配）+ resize debounce 重算
- [x] 3.2 `useReveal` hook（IntersectionObserver，首次入畫加 class 後 unobserve）
- [x] 3.3 `WorksPage` 重寫：三版型渲染（含 editorial 節奏模板與圖說）、分類切換 crossfade、缺尺寸 3:2 fallback
- [x] 3.4 `Lightbox` 重寫：前後導航、鍵盤、圖說與序號、wrap around、開合動畫跟隨檔位

## 4. Client — 上傳佇列與進度面板

- [x] 4.1 `UploadManager` context（AdminLayout 層）：佇列 state、並行 2、XHR 進度、120s 逾時、自動重試 1 次 + 手動重試、beforeunload 警告
- [x] 4.2 左下角進度面板元件：總進度、收合、逐項縮圖/進度條/狀態、失敗重試鈕、清除完成
- [x] 4.3 `PhotosPage` 上傳區改多選 + 拖放 dropzone（含檔型過濾與既有「新增分類」流程）、完成自動刷新列表

## 5. Client — 後台翻新

- [x] 5.1 `PhotosPage` 列表改縮圖卡片牆（發布 toggle、編輯、刪除、排序沿用既有 API）
- [x] 5.2 `SettingsPage` 外觀區：配色色票、版型示意、動畫檔位 + 即時 preview 面板（共用 token 與 class、真實已發布照片、儲存才 PUT）
- [x] 5.3 後台整體樣式翻新（固定中性設計、質感對齊新設計系統）

## 6. 驗證與收尾

- [x] 6.1 `npm run build` 全綠；grep 驗收無殘留硬編碼舊色值
- [x] 6.2 實際跑起來以 Playwright 驗證：六配色 × 三版型切換、進場動畫、Lightbox 導航、多檔上傳佇列與重試、設定 preview
- [x] 6.3 更新 memory、commit、push
