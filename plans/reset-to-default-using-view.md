# Plan: Reset to Default using Z17_C_SETTING_DEFAULT

## Flow Mới

```
1. User bấm "Reset to Default" button
2. Dialog xác nhận hiện ra
3. User bấm OK → Settings reset về default (CHỈ local model, CHƯA lưu)
4. User bấm Save → Gọi API Upsert để lưu vào database
```

## Điểm Khác Biệt

| | **Current** | **New** |
|---|---|---|
| Sau khi OK dialog | Gọi action ResetToDefault (DELETE) | Update local model với default values |
| Trạng thái | Đã lưu vào DB | isDirty = true, chờ Save |
| Save button | Optional | Bắt buộc phải bấm |

---

## Implementation Steps

### Step 1: Update SettingsUtil.js

**File:** `webapp/util/SettingsUtil.js`

Thêm function `getDefaultSettings()`:

```javascript
getDefaultSettings: function (oODataModel) {
    var oBinding = oODataModel.bindList('/SettingDefault');
    return oBinding.requestContexts(0, 500).then(function (aContexts) {
        return aContexts.map(function (oCtx) {
            return {
                categoryCode: oCtx.getProperty('CategoryCode'),
                isEnabled: oCtx.getProperty('IsEnabled'),
                emailEnabled: oCtx.getProperty('EmailEnabled')
            };
        });
    });
}
```

---

### Step 2: Update Settings.controller.js

**File:** `webapp/controller/Settings.controller.js`

Sửa `onResetToDefault()` (line 201-238):

```javascript
onResetToDefault: function () {
    var that = this;
    var oODataModel = this.getView().getModel();

    if (!oODataModel) {
        Log.error('Settings: OData model not available');
        return;
    }

    oODataModel.setProperty('/busy', true);
    
    SettingsUtil.getDefaultSettings(oODataModel)
        .then(function (aDefaults) {
            var aNonDefault = (that._aAllCategories || []).filter(function (oItem) {
                var oDefault = aDefaults.find(function (d) { 
                    return d.categoryCode === oItem.categoryCode; 
                });
                return oItem.isEnabled !== oDefault.isEnabled || 
                       oItem.emailEnabled !== oDefault.emailEnabled;
            });

            if (aNonDefault.length === 0) {
                oODataModel.setProperty('/busy', false);
                MessageToast.show(that._getBundle().getText('alreadyDefault'));
                return;
            }

            MessageBox.confirm(that._getBundle().getText('confirmResetDefault'), {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        // Update local model với default values
                        (that._aAllCategories || []).forEach(function (oItem) {
                            var oDefault = aDefaults.find(function (d) { 
                                return d.categoryCode === oItem.categoryCode; 
                            });
                            if (oDefault) {
                                oItem.isEnabled = oDefault.isEnabled;
                                oItem.emailEnabled = oDefault.emailEnabled;
                            }
                        });

                        // Refresh UI
                        that._applyFilters();
                        that._computeAllEnabled();
                        that._checkDirty(); // isDirty = true

                        oODataModel.setProperty('/busy', false);
                        MessageToast.show(that._getBundle().getText('resetToDefaultSuccess'));
                    } else {
                        oODataModel.setProperty('/busy', false);
                    }
                }
            });
        })
        .catch(function (oError) {
            oODataModel.setProperty('/busy', false);
            Log.error('Settings: Get default settings failed - ' + oError.message);
            MessageBox.error(that._getBundle().getText('loadError'));
        });
}
```

---

### Step 3: Update i18n (nếu cần)

Thêm text key mới:
- `resetToDefaultSuccess`: "Settings reset to default. Please save your changes."

---

## API Reference

### GET /SettingDefault
- Trả về danh sách categories với IsEnabled/EmailEnabled = giá trị mặc định
- Logic giống I_SETTING: IsEnabled = DefaultEnabled, EmailEnabled = ''

### POST /Setting (Upsert)
- Sử dụng `SettingsUtil.saveSettings()` hiện có để lưu vào DB
- Chỉ được gọi khi user bấm Save

---

## Test Cases

1. **Reset khi đã có settings:** Bấm Reset → OK → Verify local model đã reset → Bấm Save → Verify DB
2. **Reset khi chưa có settings:** Bấm Reset → OK → Bấm Save → Verify rows được tạo trong DB
3. **Reset khi đã là default:** Bấm Reset → Hiển thị "alreadyDefault" message
4. **Cancel dialog:** Bấm Reset → Cancel → Verify model không thay đổi
