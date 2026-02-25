# Workflow: Notification Center Settings UI (SAP Fiori UI5)

## Context

Xây dựng Settings UI cho Notification Center dạng Separate Page. Backend ABAP RAP + OData V4.

---

## 1. Backend (Đã Fix)

### DB Tables
```
z17_setting:  key (client, user_id, category_code) → is_enabled, email_enabled
z17_category: key (client, category_code) → category_name, category_desc, obligatory, default_enabled, ...
```

### CDS Layer

**Z17_R_SETTING** (Base View)
- Key: `(UserId, CategoryCode)`
- Fields: `IsEnabled`, `EmailEnabled`, assoc `_Category`

**Z17_I_SETTING** (Interface View) — JOIN-based merge
```sql
select from Z17_I_CATEGORY as Category
  left outer join Z17_R_SETTING as Settings
    on Category.CategoryCode = Settings.CategoryCode
    and Settings.UserId = $session.user    -- user isolation
{
  key Category.CategoryCode,
      $session.user as UserId,             -- ✅ added (Option A best practice)
      Category.CategoryName,               -- ✅ added
      Category.CategoryDesc,               -- ✅ added
      Category.Obligatory,
      Category.DefaultEnabled,             -- ✅ added
      -- IsEnabled:    fallback → Category.DefaultEnabled
      -- EmailEnabled: fallback → Category.DefaultEnabled  ✅ fixed (was '')
}
```

**Z17_C_SETTING** (Consumption View)
```sql
projection on Z17_I_SETTING {
  key CategoryCode,
      UserId,            -- ✅ added (exposed for OData transparency)
      CategoryName,      -- ✅ added
      CategoryDesc,      -- ✅ added
      Obligatory,
      DefaultEnabled,    -- ✅ added
      IsEnabled,
      EmailEnabled
}
```

### Behavior (Z17_I_SETTING)
- `unmanaged`, `authorization master (instance)`
- Operations: không expose `create`/`update` ra ngoài — chỉ dùng **action `Upsert`**
- Key field: `CategoryCode` (readonly)
- Fields: `UserId` (readonly — always `$session.user`)
- Mapping: `CategoryCode`, `UserId = user_id`, `IsEnabled`, `EmailEnabled`
- Action: `Upsert(parameter Z17_A_SETTING_UPSERT) result [1] $self`

### Behavior Handler (ZBP_17_I_SETTING) — Fixed
- ✅ `get_instance_authorizations`: check `%update` → `auth-allowed` (view đã filter `$session.user`)
- ✅ `upsert` action: READ existing → MODIFY (UPDATE nếu có, CREATE nếu chưa có), `UserId = sy-uname` trong lt_create
- ✅ `Z17_I_CATEGORY` đã thêm `InAppObl`, `EmailObl`; `Z17_C_CATEGORY` expose các field này

### Abstract Entity (Z17_A_SETTING_UPSERT) — Cần tạo
Input parameter cho action `Upsert`:
```
define abstract entity Z17_A_SETTING_UPSERT {
  CategoryCode : z17_de_ccode;
  IsEnabled    : z17_de_enblfl;
  EmailEnabled : z17_de_enblfl;
}
```

### Service Definition (Z17_SD_NOTIFICATION)
```
expose Z17_C_NOTIFICATION as Notification
expose Z17_C_RECIPIENT as Recipient
expose Z17_C_ACTION as Action
expose Z17_C_SETTING as Setting   -- ✅ added
```

### Business Rules
- Setting trống → `default_enabled` từ category (handled in CDS view CASE)
- `obligatory=true` → UI locks both InApp + Email (user cannot disable)
- No `z17_setting_sub` — flat `z17_setting` table only

### OData Endpoints (sau khi expose)
```
GET  /Setting                                 → list tất cả categories + user preferences (merged via JOIN)
POST /Setting(CategoryCode='...')/Upsert      → create hoặc update preference cho 1 category
     Body: { "IsEnabled": true, "EmailEnabled": false }
```
**Không dùng POST/PATCH entity set trực tiếp** — UI chỉ gọi action `Upsert` cho từng category.

---

## 2. UI Design

```
┌──────────────────────────────────────────────┐
│  ←  Notification Settings                    │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Enable Notifications           [ON]  │  │
│  │  Turn off to mute all notifications   │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ── Category Preferences ────────────────    │
│  [ Search categories...              🔍 ]   │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Leave Management         🔒 Required │  │
│  │  Notifications about leave requests   │  │
│  │                                       │  │
│  │  In-App   [ON] (locked)               │  │
│  │  Email    [ON] (locked)               │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  System Alerts                        │  │
│  │  System maintenance & updates         │  │
│  │                                       │  │
│  │  In-App   [ON/OFF]                    │  │
│  │  Email    [ON/OFF]                    │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Reports & Analytics                  │  │
│  │  Scheduled report notifications       │  │
│  │                                       │  │
│  │  In-App   [ON/OFF]                    │  │
│  │  Email    [ON/OFF]                    │  │
│  └────────────────────────────────────────┘  │
│                                              │
├──────────────────────────────────────────────┤
│  [Reset Default]        [Cancel]    [Save]   │
└──────────────────────────────────────────────┘
```

### Controls
| Vùng | Control |
|------|---------|
| Page | `sap.m.Page` (`showNavButton`, footer) |
| Master Switch | `sap.m.CustomListItem` + `sap.m.Switch` |
| Search | `sap.m.SearchField` (client-side filter) |
| Category list | `sap.m.List` + `sap.m.CustomListItem` |
| Category item | Fragment `SettingsCategoryItem.fragment.xml` |
| Required badge | `sap.m.ObjectStatus` + `sap-icon://locked` |
| Channel toggles | `sap.m.Switch` (disabled nếu obligatory hoặc master OFF) |
| Footer | `sap.m.OverflowToolbar`: Reset Default, Cancel, **Save** |

**Reset Default**: Reset local model về `DefaultEnabled` values + re-fetch. Không cần backend action.

---

## 3. UI Implementation Workflow

### Phase 1: Frontend Setup (`manifest.json`)

**DataSource:**
```json
"dataSources": {
  "notificationService": {
    "uri": "/sap/opu/odata4/sap/z17_ui_notification_o4/srvd_a2x/sap/z17_sd_notification/0001/",
    "type": "OData",
    "settings": { "odataVersion": "4.0" }
  }
}
```

**Model:**
```json
"notif": {
  "dataSource": "notificationService",
  "type": "sap.ui.model.odata.v4.ODataModel"
}
```

**Route + Target:**
```json
Route: { "name": "Settings", "pattern": "Settings", "target": "TargetSettings" }
Target: { "id": "Settings", "name": "Settings" }
```

**i18n labels:**
```
settingsTitle, masterSwitchLabel, masterSwitchDesc,
categoryHeader, searchPlaceholder, inAppLabel, emailLabel,
requiredLabel, saveBtn, cancelBtn, resetDefaultBtn,
settingsSavedMsg, resetConfirmMsg, discardMsg, loadErrorMsg, allDisabledWarning
```

---

### Phase 2: Local Mock Data

**`webapp/localService/metadata.xml`** — OData V4 metadata for Setting entity

**`webapp/localService/mockdata/Setting.json`** — Sample data:
```json
[
  { "CategoryCode": "LEAVE", "CategoryName": "Leave Management", "CategoryDesc": "...",
    "Obligatory": true, "DefaultEnabled": true, "IsEnabled": true, "EmailEnabled": true },
  { "CategoryCode": "SYSTEM", "CategoryName": "System Alerts", "CategoryDesc": "...",
    "Obligatory": false, "DefaultEnabled": true, "IsEnabled": true, "EmailEnabled": false },
  { "CategoryCode": "REPORT", "CategoryName": "Reports", "CategoryDesc": "...",
    "Obligatory": false, "DefaultEnabled": false, "IsEnabled": false, "EmailEnabled": false }
]
```

---

### Phase 3: View + Fragment

**`webapp/view/Settings.view.xml`**
```
Page (title, showNavButton, footer)
├── VBox "masterSwitchSection"
│   └── HBox → Title + Description + Switch
│
├── Toolbar → Title "Category Preferences" + SearchField
│
├── MessageStrip (warning, visible when master OFF)
│
├── List id="categoryList"
│   items="{settingsModel>/categories}"
│   └── CustomListItem → Fragment SettingsCategoryItem
│
└── footer: OverflowToolbar
    ├── Button "Reset Default" (Transparent)
    ├── ToolbarSpacer
    ├── Button "Cancel" (Transparent)
    └── Button "Save" (Emphasized, enabled="{settingsModel>/isDirty}")
```

**`webapp/fragment/SettingsCategoryItem.fragment.xml`**
```
VBox
├── HBox → Title (categoryName) + ObjectStatus "Required" (visible if obligatory)
├── Text (categoryDesc)
├── HBox → Label "In-App" + Switch (isEnabled, disabled if obligatory || !masterEnabled)
└── HBox → Label "Email" + Switch (emailEnabled, disabled if obligatory || !masterEnabled)
```

---

### Phase 4: Controller + Utility

**`webapp/controller/Settings.controller.js`**
```
onInit()
  → Create JSONModel "settingsModel": { masterEnabled, isDirty, categories: [] }
  → _loadSettings()

_loadSettings()
  → GET /Setting (returns all categories with merged user preferences)
  → Map to local model with _original copy for dirty check
  → Force obligatory categories: isEnabled=true, emailEnabled=true

onMasterSwitchChange() → update model, _checkDirty()
onChannelSwitchChange() → _checkDirty()
onSearchCategory() → client-side filter by name

onSave()
  → Collect changed items (diff vs _original)
  → Với mỗi changed item:
      POST /Setting(CategoryCode='...')/Upsert
      Body: { IsEnabled, EmailEnabled }
      (Backend tự quyết create/update — UI không cần phân biệt)
  → Success: MessageToast, update _original, isDirty=false

onCancel()
  → If dirty: confirm dialog → restore _original / navBack

onResetDefault()
  → Confirm dialog
  → Reset local model: isEnabled=DefaultEnabled, emailEnabled=DefaultEnabled for each category
  → Mark dirty (so user can Save the reset)

_checkDirty()
  → Compare current vs _original → set isDirty
```

**`webapp/util/SettingsUtil.js`**
```
fetchSettings(oDataModel)
  → GET /Setting → returns merged categories + user preferences
  → View Z17_I_SETTING đã JOIN + CASE defaults → UI đọc trực tiếp
  → Map: categoryCode, categoryName, categoryDesc, obligatory,
          isEnabled, emailEnabled, defaultEnabled
  → Lưu _original copy cho dirty check

getChangedItems(categories)
  → Filter items where current !== _original

saveItem(oDataModel, categoryCode, isEnabled, emailEnabled)
  → POST /Setting(CategoryCode='...')/Upsert
  → Body: { IsEnabled, EmailEnabled }
  → Không cần phân biệt create/update — backend upsert tự xử lý
```

---

### Phase 5: UX Enhancements (all frontend-only)

| Feature | Implementation |
|---------|---------------|
| Dirty state | Save button `enabled="{settingsModel>/isDirty}"` |
| Search filter | Client-side filter on JSONModel |
| Master switch dim | Expression binding: switches `enabled="{= !${settingsModel>obligatory} && ${settingsModel>/masterEnabled}}"` |
| Warning strip | `MessageStrip` visible when master OFF |
| Obligatory lock | Switches disabled + "Required" `ObjectStatus` + lock icon |
| Loading | `BusyIndicator` on Page during load/save |
| Unsaved guard | Confirm dialog on Cancel/NavBack if dirty |

---

### Phase 6: Testing

| # | Test | Expected |
|---|------|----------|
| 1 | Open Settings, no user settings exist | All values = `DefaultEnabled` from category |
| 2 | Category `obligatory=true` | Both switches ON + disabled + "Required" badge |
| 3 | Toggle a switch | Save button enabled (isDirty) |
| 4 | Toggle back to original | Save button disabled |
| 5 | Master switch OFF | All switches disabled, warning strip shown |
| 6 | Master switch ON again | Restore previous states |
| 7 | Save | OData call, MessageToast, isDirty reset |
| 8 | Cancel with changes | Confirm dialog |
| 9 | Reset Default | Values reset to DefaultEnabled, isDirty=true |
| 10 | Search | Filter categories in real-time |

---

## 4. Files Summary

| File | Action |
|------|--------|
| **Backend (DONE)** | |
| `ZBP_17_I_SETTING/Local_Types.txt` | ✅ Fixed: auth handler, upsert action, `UserId = sy-uname` trong lt_create |
| `Z17_I_SETTING` interface view | ✅ Fixed: added UserId (`$session.user`), EmailEnabled fallback, CategoryName/Desc/DefaultEnabled |
| `Z17_C_SETTING` consumption view | ✅ Fixed: added UserId, CategoryName, CategoryDesc, DefaultEnabled |
| `Z17_I_SETTING` behavior definition | ✅ Fixed: `UserId` readonly, mapping `UserId = user_id` |
| `Z17_SD_NOTIFICATION` service def | ✅ Fixed: expose Setting |
| **Frontend (TODO)** | |
| `webapp/manifest.json` | Edit: datasource, model, route |
| `webapp/view/Settings.view.xml` | **Create** |
| `webapp/fragment/SettingsCategoryItem.fragment.xml` | **Create** |
| `webapp/controller/Settings.controller.js` | **Create** |
| `webapp/util/SettingsUtil.js` | **Create** |
| `webapp/i18n/i18n.properties` | Edit: add labels |
| `webapp/localService/metadata.xml` | **Create** |
| `webapp/localService/mockdata/Setting.json` | **Create** |
| `webapp/css/style.css` | Edit (optional) |
