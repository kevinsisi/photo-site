# deployment

## ADDED Requirements

### Requirement: 單一容器部署
專案 SHALL 提供 multi-stage Dockerfile：build 階段編譯 client 與 server，runtime 階段由 server 同時提供 API 與前端靜態檔；映像 MUST 支援 arm64（RPi）。

#### Scenario: 建置並啟動容器
- **WHEN** 執行 docker compose up 啟動服務
- **THEN** 單一容器同時回應前台頁面與 API 請求

### Requirement: 資料持久化 volume
docker-compose 設定 MUST 將 SQLite DB 檔與照片目錄掛載於 `/data` volume，容器重建後資料 MUST 完整保留。

#### Scenario: 容器重建後資料保留
- **WHEN** 容器被刪除並以同一 volume 重新啟動
- **THEN** 作品照片、分類與價目方案資料完整保留

### Requirement: 環境變數設定
服務 MUST 透過環境變數設定管理員帳號、密碼 hash、session secret 與監聽 port；缺少必要變數時 MUST 啟動失敗並輸出明確錯誤。

#### Scenario: 缺少必要環境變數
- **WHEN** 未設定管理員密碼 hash 即啟動服務
- **THEN** 服務啟動失敗並輸出指出缺少哪個變數的錯誤訊息

### Requirement: 反向代理相容
服務 SHALL 在 Caddy 反向代理之後正常運作：正確處理 `X-Forwarded-*` headers，cookie 在 HTTPS 終結於 Caddy 的情境下 MUST 正常運作。

#### Scenario: 經 Caddy 存取
- **WHEN** 訪客透過 Caddy 的 HTTPS hostname 存取網站
- **THEN** 前台、後台登入與上傳功能皆正常運作
