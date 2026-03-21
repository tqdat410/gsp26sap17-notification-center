# Plan: Strip HTML from Body & Single-line Truncation

**Branch:** `feat/notification-websocket-service-update`
**Status:** Ready for implementation
**Priority:** High
**Effort:** Small (4 files, ~20 lines changed)

## Problem

1. `_Notification/Body` contains HTML markup (e.g. `<p>`, `<br>`, `<b>`). Currently displayed raw — tags visible as encoded text in table and popover.
2. Notification list table rows wrap to multiple lines when body text is long. User wants single-line with `...` truncation.

## Phase 1: Strip HTML from Body Text

**Files:** `webapp/util/NotificationFormatter.js`, `webapp/controller/App.controller.js`

### Steps

1. Add `stripHtml` helper (module-scoped) in `NotificationFormatter.js` using DOM-based approach to handle HTML entities (`&nbsp;`, `&amp;`, etc.) correctly:
   ```js
   function stripHtml(sHtml) {
       var oTmp = document.createElement('div');
       oTmp.innerHTML = sHtml || '';
       return (oTmp.textContent || oTmp.innerText || '').replace(/\s+/g, ' ').trim();
   }
   ```

2. Update `formatSubjectHtml` (line 62) — call `stripHtml(sMessage)` before `encodeXML`:
   ```js
   var sM = encodeXML(stripHtml(sMessage || ''));
   ```

3. Add `formatPlainBody` formatter for popover description:
   ```js
   formatPlainBody: function(sBody) { return stripHtml(sBody || ''); }
   ```

4. Update `_getNotificationItemTemplate` in `App.controller.js` (line 144):
   ```js
   description: { path: '_Notification/Body', formatter: Formatter.formatPlainBody }
   ```

**Note:** Detail page (`NotificationDetail.view.xml:72`) intentionally keeps `FormattedText htmlText="{_Notification/Body}"` — the full detail view should render rich HTML.

## Phase 2: Single-line Truncation in Table

**Files:** `webapp/view/NotificationList.view.xml`, `webapp/css/style.css`

### Steps

1. Set `width="50%"` on the subject `<Column>` in `NotificationList.view.xml` (line 129) so the table layout constrains cell width.

2. Add CSS class `notificationSubjectCell` to subject `FormattedText` in `NotificationList.view.xml` (line 151).

3. Add truncation CSS in `style.css`:
   ```css
   .notificationSubjectCell {
       white-space: nowrap;
       overflow: hidden;
       text-overflow: ellipsis;
       display: block;
       max-width: 100%;
   }
   ```

## Files to Modify

| File | Change |
|------|--------|
| `webapp/util/NotificationFormatter.js` | Add `stripHtml` (DOM-based), `formatPlainBody`; update `formatSubjectHtml` |
| `webapp/controller/App.controller.js` | Use `formatPlainBody` for popover description |
| `webapp/view/NotificationList.view.xml` | Add Column width, CSS class to subject `FormattedText` |
| `webapp/css/style.css` | Add truncation styles |

## Success Criteria

- [ ] No HTML tags visible in notification list body text
- [ ] No HTML tags visible in bell popover body text
- [ ] HTML entities (`&nbsp;`, `&amp;`) decoded correctly as plain text
- [ ] Each notification row in list stays on single line
- [ ] Long body text truncated with ellipsis
- [ ] Truncation is responsive (no hardcoded pixel width)
- [ ] Bold/unbold styling for read/unread still works
- [ ] Detail page still renders Body as rich HTML
