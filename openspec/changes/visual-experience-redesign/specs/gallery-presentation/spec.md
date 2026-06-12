# gallery-presentation

## ADDED Requirements

### Requirement: 照片保留原始比例呈現
前台作品集 SHALL 依照片實際寬高比排版，不得裁切為固定方格。照片缺少尺寸資料時 SHALL 以 3:2 預設比例排版且不阻擋頁面渲染。

#### Scenario: 直幅與橫幅混排
- **WHEN** 作品集包含直幅（2:3）與橫幅（3:2）照片
- **THEN** 兩者皆以原始比例完整顯示，無裁切變形

### Requirement: 三種版型依設定切換
前台作品集 SHALL 支援三種版型並依 `layout` 設定渲染：`masonry`（依最短欄分配 2–4 欄，欄數隨視窗寬度）、`justified`（每列等高、寬度按比例分配、左右切齊，最後一列不放大）、`editorial`（全幅大圖與錯落雙圖交替、附圖說、大留白）。

#### Scenario: 切換為 justified
- **WHEN** `layout` 設定為 `justified` 且訪客開啟作品頁
- **THEN** 照片以等高列呈現且每列左右切齊

#### Scenario: 視窗縮放重排
- **WHEN** 訪客將瀏覽器視窗由桌面寬度縮至行動寬度
- **THEN** 版面在 debounce 後重新計算（masonry 欄數減少 / justified 列高調整），無重疊或空洞

### Requirement: 進場動畫依檔位播放
照片進入視窗時 SHALL 依 `animation` 設定播放進場動畫，且每張僅於首次入畫播放一次：`off` 無動畫、`subtle` 淡入上移、`curated` 慢速浮現加亮度過渡與圖說跟進、`dramatic` clip-path 揭幕加內縮 zoom。使用者系統偏好 `prefers-reduced-motion` 時 MUST 一律不播放動畫。

#### Scenario: 只播一次
- **WHEN** 訪客捲動使某照片入畫後再捲離、再捲回
- **THEN** 進場動畫僅於第一次入畫播放

#### Scenario: 尊重 reduced motion
- **WHEN** 訪客作業系統啟用減少動態效果且 `animation` 為 `dramatic`
- **THEN** 照片直接顯示，無任何進場動畫

### Requirement: 分類切換過渡
作品頁分類篩選切換時 SHALL 以 crossfade 過渡（舊內容淡出、新內容以進場動畫進入），不得瞬間硬切。

#### Scenario: 切換分類
- **WHEN** 訪客點選另一個分類
- **THEN** 畫面以淡出淡入過渡至新分類照片

### Requirement: Lightbox 導航
Lightbox SHALL 支援：左右按鈕與鍵盤方向鍵切換上一張/下一張、Escape 關閉、顯示照片標題與「第 n / 共 m 張」、開合動畫強度跟隨 `animation` 檔位。

#### Scenario: 鍵盤導航
- **WHEN** Lightbox 開啟且訪客按下右方向鍵
- **THEN** 顯示下一張照片與其標題、序號

#### Scenario: 邊界行為
- **WHEN** 顯示最後一張時按下右方向鍵
- **THEN** 循環至第一張（wrap around）
