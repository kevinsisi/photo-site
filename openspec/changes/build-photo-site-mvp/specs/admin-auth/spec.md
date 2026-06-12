# admin-auth

## ADDED Requirements

### Requirement: 單一管理員登入
系統 SHALL 提供管理員登入頁，驗證帳號與密碼；密碼 MUST 以 bcrypt hash 形式存於環境變數設定，系統 MUST NOT 以明文儲存密碼。

#### Scenario: 登入成功
- **WHEN** 管理員輸入正確帳密
- **THEN** 系統建立 session 並導向後台管理頁

#### Scenario: 登入失敗
- **WHEN** 帳號或密碼錯誤
- **THEN** 系統回傳統一的錯誤訊息（不洩漏是帳號還是密碼錯誤），不建立 session

### Requirement: Session 維持與登出
登入後系統 SHALL 以 HTTP-only、SameSite=Lax 的 cookie 維持 session；管理員 SHALL 能登出使 session 失效。

#### Scenario: 維持登入狀態
- **WHEN** 已登入管理員重新整理後台頁面
- **THEN** 不需重新登入即可繼續操作

#### Scenario: 登出
- **WHEN** 管理員點擊登出
- **THEN** session 失效，再次存取後台會被導向登入頁

### Requirement: 管理 API 保護
所有管理 API（作品、分類、價目方案的寫入操作）MUST 驗證有效 session，未通過驗證時 MUST 回傳 401 且不執行任何操作。

#### Scenario: 未登入存取管理 API
- **WHEN** 未帶有效 session 的請求呼叫任一管理 API
- **THEN** 回傳 401，資料無任何變更

#### Scenario: 未登入開啟後台頁面
- **WHEN** 未登入的瀏覽器開啟 `/admin` 下任一頁面
- **THEN** 被導向登入頁

### Requirement: 登入暴力嘗試防護
登入端點 SHALL 實作速率限制，同一來源短時間內多次失敗後 MUST 暫時拒絕嘗試。

#### Scenario: 連續失敗被限制
- **WHEN** 同一 IP 在短時間內連續多次登入失敗
- **THEN** 後續登入嘗試被暫時拒絕並回傳 429
