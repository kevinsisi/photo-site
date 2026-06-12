# site-appearance

## ADDED Requirements

### Requirement: 外觀設定的儲存與驗證
系統 SHALL 在 settings 儲存三個外觀設定：`theme`（`museum-white` | `dark-gallery` | `sage` | `film-warm` | `mono` | `ink-blue`，預設 `museum-white`）、`layout`（`masonry` | `editorial` | `justified`，預設 `masonry`）、`animation`（`off` | `subtle` | `curated` | `dramatic`，預設 `curated`）。`PUT /api/admin/settings` MUST 以白名單驗證值，拒絕未知值並回 400。

#### Scenario: 儲存合法外觀設定
- **WHEN** 管理員 PUT `/api/admin/settings` 帶 `{"theme":"dark-gallery","layout":"editorial","animation":"subtle"}`
- **THEN** 系統儲存三值並回 200，後續 `GET /api/settings` 回傳更新後的值

#### Scenario: 拒絕非法值
- **WHEN** 管理員 PUT `/api/admin/settings` 帶 `{"theme":"neon-pink"}`
- **THEN** 系統回 400 且不變更任何設定

#### Scenario: 缺值走預設
- **WHEN** settings 表中不存在 `theme` / `layout` / `animation` 任一 key
- **THEN** `GET /api/settings` 對缺少的 key 回傳預設值（`museum-white` / `masonry` / `curated`）

### Requirement: 公開 API 曝露外觀設定
`GET /api/settings` SHALL 回傳 `siteDisplayName`、`theme`、`layout`、`animation` 四個欄位，無需認證。

#### Scenario: 公開讀取
- **WHEN** 未登入訪客 GET `/api/settings`
- **THEN** 回應包含四個欄位且皆為合法 enum 值或站名字串

### Requirement: Token 化主題套用
前台 SHALL 於應用載入時將 `theme` / `layout` / `animation` 以 `data-theme` / `data-layout` / `data-anim` 屬性掛載於根元素；全部公開頁面的顏色 MUST 透過 8 個 CSS token（`--bg` `--surface` `--text` `--text-muted` `--accent` `--accent-contrast` `--border` `--overlay`）取得，不得硬編碼色值。

#### Scenario: 切換配色立即生效
- **WHEN** 管理員將 theme 從 `museum-white` 改為 `dark-gallery` 並儲存，訪客重新載入前台
- **THEN** 前台所有頁面（含導覽列、按鈕、卡片、Lightbox 遮罩）呈現深色畫廊配色，無殘留舊色

### Requirement: 後台外觀設定與即時 preview
後台設定頁 SHALL 提供配色、版型、動畫三項選擇器，並在同頁 preview 面板即時反映未儲存的選擇；preview MUST 使用與前台相同的 CSS token 與版型 class，並以真實已發布照片渲染。選擇變更在按下儲存前 MUST NOT 影響線上設定。

#### Scenario: 即時預覽不寫入
- **WHEN** 管理員在設定頁點選 `mono` 配色但未按儲存
- **THEN** preview 面板立即變為黑白配色，且 `GET /api/settings` 的 `theme` 維持原值

#### Scenario: 儲存後生效
- **WHEN** 管理員選好配色與版型並按儲存
- **THEN** 系統 PUT 成功並顯示成功訊息，前台下次載入採用新設定
