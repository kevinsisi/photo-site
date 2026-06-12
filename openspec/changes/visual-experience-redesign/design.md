# Design: visual-experience-redesign

## Context

現有站台：React 18 + React Router v6 + Tailwind v4（Vite）、Express + better-sqlite3 + sharp。前台 `WorksPage` 是等寬 grid + 簡單 Lightbox；後台 `PhotosPage` 單檔同步上傳；`settings` 表為 key-value，只存 `siteDisplayName`。無動畫庫、無狀態管理庫。設計討論已與使用者確認：三種版型、6 組配色、4 檔動畫全做且後台可切換，實作走零新依賴路線（純 CSS + 自寫 hook）。

## Goals / Non-Goals

**Goals:**
- 前台具備「逛展」級的視覺呈現，照片保留原始比例
- 外觀（配色 / 版型 / 動畫）後台可調、即時 preview、所見即所得
- 上傳射後不理：多檔佇列、進度可視、失敗可重試
- 零新 runtime 依賴

**Non-Goals:**
- 後台外觀不跟隨前台主題（後台固定中性設計）
- 不做 EXIF 顯示、多語、訪客互動
- 不改部署架構與既有 API 的破壞性變更

## Decisions

### D1: 主題以 CSS variables token + html data attributes 實作
`<html data-theme data-layout data-anim>` 三屬性驅動。`index.css` 為每組配色在 `[data-theme="…"]` 下定義 8 個 token：`--bg / --surface / --text / --text-muted / --accent / --accent-contrast / --border / --overlay`。元件一律使用 token。
- 替代方案：Tailwind theme 切換（需 build-time 多份 theme，否決）；styled-components（新依賴，否決）。
- Preview 即時性：設定頁 preview 容器自帶 `data-theme` 等屬性即可局部套用，與前台共用 class，天然所見即所得。

### D2: settings 沿用 key-value 表，新增三 key
`theme`（enum 6 值，預設 `museum-white`）、`layout`（enum 3 值，預設 `masonry`）、`animation`（enum 4 值，預設 `curated`）。server 端以白名單驗證。`GET /api/settings` 一次回傳全部，client 在 app 載入時套到 `<html>`；admin preview 不寫入、僅本地 state。

### D3: 照片尺寸入庫 + 啟動回填
`photos` 表 `ALTER TABLE ADD COLUMN width/height INTEGER`（以 PRAGMA 檢查防重複）。上傳時 sharp metadata 寫入。啟動時對 `width IS NULL` 的照片讀 original 檔回填；單張失敗記 log 不擋啟動，前端對缺尺寸照片以 3:2 預設比例排版。
- 理由：justified/masonry 必須在圖片載入前知道比例，否則版面跳動。

### D4: 版型演算法自寫，皆為純函式 util
- **justified**：給定容器寬、目標列高（依視窗寬 220–320px）、gap，貪婪分列後按比例縮放填滿；最後一列不放大。
- **masonry**：依「累計高度最短欄」分配至 2–4 欄（視窗寬決定欄數），保持由上而下視覺順序。
- **editorial**：固定節奏模板（全幅 → 錯落雙圖 → 全幅 循環），不需演算法。
皆輸出帶定位/尺寸資訊的資料結構，由 React 渲染；resize 以 debounce 重算。

### D5: 進場動畫 = useReveal hook + CSS class
單一 IntersectionObserver（rootMargin 預載），元素首次入畫加 `.revealed` 後 unobserve（只播一次）。四檔動畫全在 CSS 內以 `[data-anim="…"] .reveal-item` 區分：off（無）、subtle（fade+14px 上移）、curated（slow reveal + brightness + 圖說跟進，錯開延遲）、dramatic（clip-path 揭幕 + 內縮 zoom）。`prefers-reduced-motion` 時一律降為 off。分類切換：容器 crossfade（舊內容 fade-out → 新內容以進場動畫進）。

### D6: 上傳佇列 = React context（AdminLayout 層）+ XHR
`UploadManagerProvider` 持有佇列 state；每項 `{id, file, previewUrl, title, categoryId, status, progress, error, attempts}`。
- 並行上限 2；每檔逾時 120s（XHR timeout）；失敗自動重試 1 次（2s 退避），再失敗 `status=error` 等手動重試。
- 用 XHR 而非 fetch：需要 `upload.onprogress` 真實進度。
- 沿用既有 `POST /api/admin/photos` 單檔 API，每檔一請求 — 重試粒度即單檔，server 不需改介面。
- 佇列有進行中項目時掛 `beforeunload` 警告。
- 完成項觸發 PhotosPage 列表刷新（context 曝露 `lastCompletedAt`，頁面訂閱後 refetch）。

### D7: 進度面板（左下角）
固定定位浮動卡片，標題列顯示總進度（n/m 與彙總百分比）、可收合；逐項顯示縮圖（objectURL）、檔名、進度條、狀態 icon；error 項有重試鈕；全部完成可一鍵清除。佇列空時不渲染。

### D8: 後台翻新範圍
- PhotosPage：表格 → 縮圖卡片牆（responsive grid）；卡片上直接操作發布 toggle、編輯（title/分類）、刪除、排序（上下移沿用既有 API）。上傳區改為拖放 dropzone + 多選。
- SettingsPage：新增「外觀」區 — 配色色票列、版型示意 icon、動畫檔位 radio；右側 preview 面板以真實已發布照片（取前 9 張）渲染迷你前台。儲存才 PUT。

## Risks / Trade-offs

- [既有照片回填失敗（檔案遺失）] → 記 log、前端 3:2 fallback，不擋啟動與排版
- [自寫 justified 演算法邊界（單張、超寬全景）] → 最後一列不放大、單列比例上限 clamp；以多比例測資驗證
- [關瀏覽器佇列即斷] → beforeunload 警告；明確屬已知限制（不做 service worker）
- [crossfade 而非 FLIP] → 已與使用者確認接受（選項 A 的明示代價）
- [token 化重構漏網（殘留硬編碼色）] → 全域 grep 舊色值清單驗收

## Migration Plan

1. DB schema 遷移與回填屬冪等啟動邏輯，部署即生效
2. settings 新 key 缺值時走預設值，舊資料相容
3. 回滾 = 還原前一版 image；新欄位對舊版程式無害

## Open Questions

（無 — 設計決策已在 brainstorming 與使用者確認）
