# pricing-management

## ADDED Requirements

### Requirement: 價目方案 CRUD
管理後台 SHALL 允許管理員建立、編輯、刪除價目方案；方案欄位 MUST 包含名稱、說明、內容項目清單、價格（新台幣整數）、上/下架狀態與排序。

#### Scenario: 建立方案
- **WHEN** 管理員建立方案（名稱「形象照基本方案」、價格 6000、含 3 個內容項目）
- **THEN** 方案儲存成功並出現在後台方案列表

#### Scenario: 編輯方案
- **WHEN** 管理員修改方案價格並儲存
- **THEN** 前台價目表立即反映新價格

#### Scenario: 刪除方案
- **WHEN** 管理員刪除一個方案
- **THEN** 方案自後台列表與前台價目表移除

### Requirement: 上下架與排序控制
管理員 SHALL 能切換方案上/下架狀態並調整顯示順序；前台價目表 MUST 只顯示上架方案並依排序呈現。

#### Scenario: 下架方案
- **WHEN** 管理員將方案設為下架
- **THEN** 方案保留在後台但不出現在前台價目表

#### Scenario: 調整排序
- **WHEN** 管理員變更方案排序
- **THEN** 前台價目表依新順序顯示

### Requirement: 公開價目 API
系統 SHALL 提供公開 API 回傳上架中方案（含名稱、說明、內容項目、價格、排序），供前台價目表頁使用；該 API MUST 不需要驗證。

#### Scenario: 前台取得價目
- **WHEN** 前台請求公開價目 API
- **THEN** 回傳所有上架方案，依排序欄位排列
