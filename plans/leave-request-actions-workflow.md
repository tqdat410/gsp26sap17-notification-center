# Workflow: Implement Notification Details – Approve / Reject / Display

> **Project:** `c:\Users\Admin\projects\project1\backend\ZGSP26SAP17\gsp26sap17-notification-center`
> **Framework:** SAP UI5 + OData V4 (`sap.ui.model.odata.v4.ODataModel`)
>
> **Tình trạng hiện tại:**
> - UI đã có đầy đủ: `NotificationDetail.view.xml`, `NotificationDetail.controller.js`
> - Controller đã implement: `_renderActions()`, `_executeInlineAction()`, `_openRejectDialog()`
> - `NotificationActionHelper.js` đã hoạt động (MarkAsRead, Archive, Delete...)
> - `CrossAppNavigation.js` đã hoạt động (FLP navigation cho Display/View)
> - **`LeaveRequestActionHelper.js` là STUB — chỉ có `MessageToast`, chưa gọi OData thực**
>
> **Việc cần làm:** Implement `LeaveRequestActionHelper.js` — thay stub bằng OData V4 calls thực

---

## 1. Luồng hoạt động tổng quan

```
NotificationDetail.controller.js
│
├── _renderActions()
│     Đọc _Actions[] từ _Notification expand
│     Tạo dynamic buttons theo ActionSeq
│     Nếu SematicAction = 'approve'/'reject' → bind _executeInlineAction()
│     Nếu SematicAction khác (vd: 'display') → bind CrossAppNav.navigateWithAction()
│
└── _executeInlineAction(sSematicAction, sActionLabel, sRawParams)
      Parse Params: 'RequestID=<UUID>' hoặc '{"RequestID":"..."}' → { RequestID: '<UUID>' }
      Lấy sRequestId = oParams.RequestID || oParams.RequestId || ''
      │
      ├── [Approve] → MessageBox.confirm() → LeaveRequestHelper.approve(sRequestId)
      │
      └── [Reject]  → _openRejectDialog(sRequestId)
                           → nhập lý do
                           → validate không để trống
                           → LeaveRequestHelper.reject(sRequestId, sReason)
```

---

## 2. OData Service & Action Reference

**Leave Request service URL:**
```
/sap/opu/odata4/sap/z17_ui_leaverequest_o4/srvd/sap/z17_sd_leaverequest/0001/
```

**Action namespace** (theo pattern của `NotificationActionHelper.js`):
```
com.sap.gateway.srvd.z17_sd_leaverequest.v0001
```

**OData V4 bound action paths:**
```
Approve:
  /LeaveRequest(RequestId=<UUID>)/com.sap.gateway.srvd.z17_sd_leaverequest.v0001.Approve(...)
  Body: {}

Reject:
  /LeaveRequest(RequestId=<UUID>)/com.sap.gateway.srvd.z17_sd_leaverequest.v0001.Reject(...)
  Body: { "RejectReason": "<string>" }   ← BẮT BUỘC
```

**UUID format trong OData V4:**
```javascript
// OData V4 không cần guid'' wrapper (khác V2)
"/LeaveRequest(RequestId=" + sRequestId + ")/..."
// Ví dụ: "/LeaveRequest(RequestId=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)/..."
```

**Backend behavior:**
- `Approve`: Set `Status = 'A'`, `ApprovedBy = sy-uname`, `ApprovedAt = utclong_current()`
- `Reject`: Set `Status = 'R'`, `RejectReason = input`, `ApprovedBy = sy-uname`
- Feature control: Reject bị backend disable khi `Status ≠ 'N'` — trả 422 nếu gọi sai trạng thái

---

## 3. Implement `LeaveRequestActionHelper.js`

**File cần sửa:** `webapp/util/LeaveRequestActionHelper.js`

**Thay toàn bộ nội dung stub (hiện tại dùng `MessageToast`) bằng:**

```javascript
/**
 * LeaveRequestActionHelper.js
 * OData V4 action helper for Leave Request Approve / Reject
 */
sap.ui.define([
    'sap/ui/model/odata/v4/ODataModel',
    'sap/base/Log'
], function (ODataModel, Log) {
    'use strict';

    var SERVICE_URL = '/sap/opu/odata4/sap/z17_ui_leaverequest_o4/srvd/sap/z17_sd_leaverequest/0001/';
    var ACTION_NS   = 'com.sap.gateway.srvd.z17_sd_leaverequest.v0001';

    // Lazy singleton ODataModel — tạo một lần, tái sử dụng
    var _oModel = null;

    function _getModel() {
        if (!_oModel) {
            _oModel = new ODataModel({
                serviceUrl: SERVICE_URL,
                synchronizationMode: 'None',
                operationMode: 'Server',
                autoExpandSelect: true
            });
        }
        return _oModel;
    }

    return {

        /**
         * Approve a leave request
         * @param {string} sRequestId - UUID của leave request (từ Action.Params hoặc Notification.ObjectKey)
         * @returns {Promise}
         */
        approve: function (sRequestId) {
            var sPath = '/LeaveRequest(RequestId=' + sRequestId + ')/'
                      + ACTION_NS + '.Approve(...)';
            var oOp = _getModel().bindContext(sPath);
            return oOp.execute();
        },

        /**
         * Reject a leave request
         * @param {string} sRequestId    - UUID của leave request
         * @param {string} sRejectReason - Lý do từ chối (bắt buộc)
         * @returns {Promise}
         */
        reject: function (sRequestId, sRejectReason) {
            var sPath = '/LeaveRequest(RequestId=' + sRequestId + ')/'
                      + ACTION_NS + '.Reject(...)';
            var oOp = _getModel().bindContext(sPath);
            oOp.setParameter('RejectReason', sRejectReason);
            return oOp.execute();
        }

    };
});
```

---

## 4. Cách controller gọi helper (KHÔNG cần sửa controller)

Trong `NotificationDetail.controller.js`, controller đã implement đúng:

```javascript
// Approve — line ~379
LeaveRequestHelper.approve(sRequestId)
    .then(function () {
        MessageToast.show(oBundle.getText('approveSuccess'));
        oCtx.refresh();
        that.getOwnerComponent().refreshUnreadCount();
        that._publishRefresh({ source: 'action', notificationId: ... });
    })
    .catch(function (oErr) { MessageBox.error(oErr.message); });

// Reject — line ~448
LeaveRequestHelper.reject(sRequestId, sReason)
    .then(function () {
        MessageToast.show(oBundle.getText('rejectSuccess'));
        oCtx.refresh();
        that.getOwnerComponent().refreshUnreadCount();
        that._publishRefresh({ source: 'action', notificationId: ... });
    })
    .catch(function (oErr) { MessageBox.error(oErr.message); });
```

**Import đã có sẵn trong controller:**
```javascript
'com/gsp26/sap17/notificationcenter/util/LeaveRequestActionHelper'
// alias: LeaveRequestHelper
```

---

## 5. Luồng parse RequestId từ Action.Params

**Nguồn dữ liệu:** `Action.Params` trong notification (từ `Z17_ACTION.params` trong DB)

**Format trong production:** Backend ghi `RequestID=<UUID>` hoặc `{"RequestID":"<UUID>"}`

**Cách controller parse (đã có sẵn trong `_executeInlineAction`):**
```javascript
var oParams = {};
try { oParams = JSON.parse(sRawParams); }         // thử parse JSON
catch (e) {
    sRawParams.split('&').forEach(function(pair) { // fallback: key=value
        var kv = pair.split('=');
        if (kv.length === 2) {
            oParams[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
        }
    });
}
var sRequestId = oParams.RequestID || oParams.RequestId || '';
// → sRequestId chứa UUID của leave request
// → được pass vào LeaveRequestHelper.approve(sRequestId)
```

**Lưu ý:** Seed data hiện tại có `params = 'RequestID=1'` (placeholder).
Trong production, backend sẽ set giá trị UUID thực của leave request.

---

## 6. i18n keys cần có trong `webapp/i18n/i18n.properties`

Kiểm tra và thêm nếu chưa có:
```properties
confirmApprove=Are you sure you want to approve this leave request?
approveSuccess=Leave request approved successfully.
rejectDialogTitle=Reject Leave Request
rejectReasonLabel=Rejection Reason
rejectReasonPlaceholder=Enter reason for rejection...
rejectReasonRequired=Rejection reason is required.
rejectSuccess=Leave request rejected successfully.
submit=Submit
cancel=Cancel
```

---

## 7. Sequence diagrams

### Approve flow
```
Manager          NotificationDetail          LeaveRequestActionHelper        Backend OData
   │                    │                              │                           │
   │── click [Approve] ─►                              │                           │
   │                    │── MessageBox.confirm()       │                           │
   │── click [OK] ──────►                              │                           │
   │                    │── .approve(sRequestId) ──────►                           │
   │                    │                              │── POST /LeaveRequest(...) ►│
   │                    │                              │   /...Approve(...)        │
   │                    │                              │   body: {}                │
   │                    │                              │◄── 200 OK (Status='A') ───│
   │                    │◄── Promise.resolve ──────────│                           │
   │                    │── Toast "Approved"           │                           │
   │                    │── oCtx.refresh()             │                           │
   │                    │── refreshUnreadCount()       │                           │
   │                    │── publishRefresh event       │                           │
```

### Reject flow
```
Manager          NotificationDetail          LeaveRequestActionHelper        Backend OData
   │                    │                              │                           │
   │── click [Reject] ──►                              │                           │
   │                    │── _openRejectDialog()        │                           │
   │── nhập lý do ──────►                              │                           │
   │── click [Submit] ──►                              │                           │
   │                    │── validate (không empty)     │                           │
   │                    │── .reject(sId, sReason) ─────►                           │
   │                    │                              │── POST /LeaveRequest(...) ►│
   │                    │                              │   /...Reject(...)         │
   │                    │                              │   {RejectReason: "..."}   │
   │                    │                              │◄── 200 OK (Status='R') ───│
   │                    │◄── Promise.resolve ──────────│                           │
   │                    │── oDialog.close()            │                           │
   │                    │── Toast "Rejected"           │                           │
   │                    │── oCtx.refresh()             │                           │
```

### Display/View flow (đã implement — không cần thay đổi)
```
Manager          NotificationDetail          CrossAppNavigation             FLP
   │                    │                              │                      │
   │── click [View] ────►                              │                      │
   │                    │── CrossAppNav               │                      │
   │                    │   .navigateWithAction(       │                      │
   │                    │     SematicObject,           │                      │
   │                    │     SematicAction,           │                      │
   │                    │     {RequestID: ...})        │                      │
   │                    │──────────────────────────────►                      │
   │                    │                              │── toExternal() ──────►│
   │                    │                              │                      │── Navigate to LR App
```

---

## 8. Tóm tắt thay đổi

| File | Thay đổi | Mức độ |
|------|---------|--------|
| `webapp/util/LeaveRequestActionHelper.js` | **SỬA** — thay stub bằng OData V4 thực | **Bắt buộc** |
| `webapp/i18n/i18n.properties` | **SỬA** — thêm keys nếu thiếu | **Bắt buộc** |
| `webapp/manifest.json` | Không cần sửa — helper tự tạo ODataModel | — |
| `webapp/controller/NotificationDetail.controller.js` | Không cần sửa — đã đúng | — |
| `webapp/util/CrossAppNavigation.js` | Không cần sửa — đã đúng | — |
| `webapp/util/NotificationActionHelper.js` | Không cần sửa — đã đúng | — |

---

## 9. Kiểm tra sau khi implement

1. **Approve thành công:**
   - Notification có action Approve (SematicAction='Approve') → button hiển thị màu xanh
   - Click Approve → confirm dialog xuất hiện
   - Click OK → Toast "approved", view refresh, leave request Status = `'A'`

2. **Reject thành công:**
   - Click Reject → dialog nhập lý do
   - Submit mà không nhập → warning, không gọi API
   - Nhập lý do → Submit → Toast "rejected", dialog đóng, Status = `'R'`

3. **Error case (request đã xử lý):**
   - Approve/Reject trên request có Status ≠ `'N'`
   - Backend trả 422 → `MessageBox.error(oErr.message)` hiển thị

4. **Display/View:**
   - Click "View" → navigate đến Leave Request app (FLP) hoặc fallback toast
