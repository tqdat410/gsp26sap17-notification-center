/**
 * NotificationFormatter.js
 *
 * Shared formatters for notification display
 * - Date/time formatting
 * - Category/priority display
 * - HTML formatters for bold-on-unread effect
 * - Status text and icon formatters
 */
sap.ui.define([
    'sap/ui/core/format/DateFormat',
    'sap/ui/core/Locale',
    'com/gsp26/sap17/notificationcenter/util/BooleanHelper',
    'sap/ui/core/library',
    'sap/base/security/encodeXML',
    'sap/base/security/sanitizeHTML'
], function (DateFormat, Locale, BooleanHelper, coreLibrary, encodeXML, sanitizeHTML) {
    'use strict';

    var Priority = coreLibrary.Priority;
    var oEnLocale = new Locale('en');

    var oDateTimeFormat = DateFormat.getDateTimeInstance({ pattern: 'dd.MM.yy HH:mm:ss' }, oEnLocale);
    var oRelativeFormat = DateFormat.getDateTimeInstance({ relative: true, relativeScale: 'auto' }, oEnLocale);

    /**
     * Extracts plain text from HTML body content.
     * Uses SAPUI5 sanitizeHTML first, then jQuery to safely extract text content.
     * Output is always passed through encodeXML before rendering.
     */
    function stripHtml(sHtml) {
        if (!sHtml) { return ''; }
        var sSafe = sanitizeHTML(sHtml);
        var sText = jQuery('<span>').html(sSafe).text();
        return sText.replace(/\s+/g, ' ').trim();
    }

    var oIsoParser = DateFormat.getDateTimeInstance({ pattern: "yyyy-MM-dd'T'HH:mm:ss" });
    var oLocalParser = DateFormat.getDateTimeInstance({ pattern: 'dd.MM.yyyy, HH:mm:ss' });
    var rIsoDateTime = /^\d{4}-\d{2}-\d{2}T/;
    var rODataDate = /^\/Date\((\d+)(?:[+-]\d+)?\)\/$/;

    function normalizeYear(iYear) {
        return iYear < 100 ? 2000 + iYear : iYear;
    }

    function createLocalDate(iYear, iMonth, iDay, iHour, iMinute, iSecond) {
        var oDate = new Date(iYear, iMonth - 1, iDay, iHour, iMinute, iSecond, 0);
        if (
            oDate.getFullYear() !== iYear ||
            oDate.getMonth() !== iMonth - 1 ||
            oDate.getDate() !== iDay
        ) {
            return null;
        }
        return oDate;
    }

    function parseDottedDateTime(sDateTime) {
        var aMatch = String(sDateTime || '').trim().match(
            /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
        );
        if (!aMatch) { return null; }

        var iPart1 = parseInt(aMatch[1], 10);
        var iPart2 = parseInt(aMatch[2], 10);
        var iYear = normalizeYear(parseInt(aMatch[3], 10));
        var iHour = parseInt(aMatch[4] || '0', 10);
        var iMinute = parseInt(aMatch[5] || '0', 10);
        var iSecond = parseInt(aMatch[6] || '0', 10);

        if (iHour > 23 || iMinute > 59 || iSecond > 59) { return null; }

        var oDayFirst = createLocalDate(iYear, iPart2, iPart1, iHour, iMinute, iSecond);
        var oMonthFirst = createLocalDate(iYear, iPart1, iPart2, iHour, iMinute, iSecond);

        if (oDayFirst && !oMonthFirst) { return oDayFirst; }
        if (oMonthFirst && !oDayFirst) { return oMonthFirst; }
        if (!oDayFirst && !oMonthFirst) { return null; }

        var iNow = Date.now();
        var iFutureThreshold = 24 * 60 * 60 * 1000;
        var iDayFirstDelta = oDayFirst.getTime() - iNow;
        var iMonthFirstDelta = oMonthFirst.getTime() - iNow;
        var bDayFirstFarFuture = iDayFirstDelta > iFutureThreshold;
        var bMonthFirstFarFuture = iMonthFirstDelta > iFutureThreshold;

        if (bDayFirstFarFuture !== bMonthFirstFarFuture) {
            return bDayFirstFarFuture ? oMonthFirst : oDayFirst;
        }
        return Math.abs(iDayFirstDelta) <= Math.abs(iMonthFirstDelta) ? oDayFirst : oMonthFirst;
    }

    function toDate(vDateTime) {
        if (!vDateTime) { return null; }
        if (vDateTime instanceof Date) { return vDateTime; }
        var s = String(vDateTime).trim();
        if (!s) { return null; }

        var oMatch = s.match(rODataDate);
        if (oMatch) {
            var iTimestamp = parseInt(oMatch[1], 10);
            if (!isNaN(iTimestamp)) {
                return new Date(iTimestamp);
            }
        }

        // Parse ISO-like values deterministically (with or without timezone suffix)
        var oDate;
        if (rIsoDateTime.test(s)) {
            oDate = new Date(s);
            if (!isNaN(oDate.getTime())) { return oDate; }
        }

        // Handle ambiguous dotted values from FLP/local runtime (dd.MM vs MM.dd)
        oDate = parseDottedDateTime(s);
        if (oDate) { return oDate; }

        // Fallback for explicit UI5 dd.MM.yyyy format
        oDate = oLocalParser.parse(s);
        if (oDate) { return oDate; }
        // Try UI5 ISO parse as fallback
        oDate = oIsoParser.parse(s);
        if (oDate) { return oDate; }

        // Last resort (kept at the end to avoid locale-dependent swaps)
        oDate = new Date(s);
        return !isNaN(oDate.getTime()) ? oDate : null;
    }

    return {
        formatDateTime: function (sDateTime) {
            var oDate = toDate(sDateTime);
            return oDate ? oRelativeFormat.format(oDate) : '';
        },

        formatFullDateTime: function (sDateTime) {
            var oDate = toDate(sDateTime);
            return oDate ? oDateTimeFormat.format(oDate) : '';
        },

        formatDateTimeWithRelative: function (sDateTime) {
            var oDate = toDate(sDateTime);
            if (!oDate) { return ''; }
            var sRelative = oRelativeFormat.format(oDate);
            var sFull = oDateTimeFormat.format(oDate);
            return sRelative + ' (' + sFull + ')';
        },

        formatCategory: function (sCategory, oCategoryMap) {
            if (!sCategory) { return ''; }
            return oCategoryMap && oCategoryMap[sCategory] ? oCategoryMap[sCategory] : sCategory;
        },

        formatPriority: function (vPriority) {
            var s = String(vPriority || '');
            return { '1': Priority.High, '2': Priority.Medium, '3': Priority.Low, 'H': Priority.High, 'M': Priority.Medium, 'L': Priority.Low }[s] || Priority.None;
        },

        formatPriorityState: function (vPriority) {
            var s = String(vPriority || '');
            return { '1': 'Error', '2': 'Warning', '3': 'Success', 'H': 'Error', 'M': 'Warning', 'L': 'Success' }[s] || 'None';
        },

        formatPriorityText: function (vPriority, oBundle) {
            var s = String(vPriority || '');
            var sKey = { '1': 'priorityHigh', '2': 'priorityMedium', '3': 'priorityLow', 'H': 'priorityHigh', 'M': 'priorityMedium', 'L': 'priorityLow' }[s];
            return sKey && oBundle ? oBundle.getText(sKey) : s || '';
        },

        formatSubjectHtml: function (vIsRead, sTitle, sMessage) {
            var sT = encodeXML(sTitle || '');
            var sM = encodeXML(stripHtml(sMessage || ''));
            var bRead = BooleanHelper.isTrue(vIsRead);
            return bRead ? sT + ' - <em>' + sM + '</em>' : '<strong>' + sT + '</strong> - <em>' + sM + '</em>';
        },

        formatPlainBody: function (sBody) {
            return stripHtml(sBody || '');
        },

        formatPopoverDescriptionWithPrioritySuffix: function (sBody, vPriority, oBundle) {
            var sBodyText = stripHtml(sBody || '');
            var s = String(vPriority || '');
            var sPriorityKey = { '1': 'priorityHigh', '2': 'priorityMedium', '3': 'priorityLow', 'H': 'priorityHigh', 'M': 'priorityMedium', 'L': 'priorityLow' }[s];
            var sPriorityText = sPriorityKey && oBundle ? oBundle.getText(sPriorityKey) : '';
            var sPriorityLabel = oBundle ? oBundle.getText('priorityLabel') : 'Priority';

            if (!sBodyText && !sPriorityText) { return ''; }
            if (!sBodyText) { return sPriorityLabel + ': ' + sPriorityText; }
            if (!sPriorityText) { return sBodyText; }
            return sBodyText + ' - ' + sPriorityLabel + ': ' + sPriorityText;
        },

        formatCategoryHtml: function (vIsRead, sCategory, oCategoryMap) {
            var sText = encodeXML(this.formatCategory(sCategory, oCategoryMap));
            return BooleanHelper.isTrue(vIsRead) ? sText : '<strong>' + sText + '</strong>';
        },

        formatDateHtml: function (vIsRead, sDateTime) {
            var sText = encodeXML(this.formatFullDateTime(sDateTime));
            return BooleanHelper.isTrue(vIsRead) ? sText : '<strong>' + sText + '</strong>';
        },

        formatPriorityHtml: function (vIsRead, vPriority) {
            var s = String(vPriority || '');
            var sText = { '1': 'High', '2': 'Medium', '3': 'Low', 'H': 'High', 'M': 'Medium', 'L': 'Low' }[s] || s;
            var sColor = { '1': '#bb0000', '2': '#e9730c', '3': '#107e3e', 'H': '#bb0000', 'M': '#e9730c', 'L': '#107e3e' }[s] || '#6a6d70';
            var sEsc = encodeXML(sText);
            var sSpan = '<span style="color:' + sColor + '">' + sEsc + '</span>';
            return BooleanHelper.isTrue(vIsRead) ? sSpan : '<strong>' + sSpan + '</strong>';
        },

        formatReadStatusCombined: function (vIsRead, vIsArchived, oBundle) {
            if (BooleanHelper.isTrue(vIsArchived)) {
                var sArchived = oBundle ? oBundle.getText('archived') : 'Archived';
                return sArchived;
            }
            var sKey = BooleanHelper.isTrue(vIsRead) ? 'read' : 'unreadStatus';
            return oBundle ? oBundle.getText(sKey) : (BooleanHelper.isTrue(vIsRead) ? 'Read' : 'Unread');
        },

        formatReadStatusState: function (vIsRead) {
            return BooleanHelper.isTrue(vIsRead) ? 'Success' : 'Warning';
        },

        formatReadStatusCombinedState: function (vIsRead, vIsArchived) {
            if (BooleanHelper.isTrue(vIsArchived)) { return 'Warning'; }
            return BooleanHelper.isTrue(vIsRead) ? 'Success' : 'Warning';
        },

        formatArchivedStatusVisible: function (vIsArchived) {
            return BooleanHelper.isTrue(vIsArchived);
        },

        formatReadStatusText: function (vIsRead, oBundle) {
            var sKey = BooleanHelper.isTrue(vIsRead) ? 'read' : 'unreadStatus';
            return oBundle ? oBundle.getText(sKey) : (BooleanHelper.isTrue(vIsRead) ? 'Read' : 'Unread');
        },

        formatArchivedStatusText: function (vIsArchived, oBundle) {
            if (!BooleanHelper.isTrue(vIsArchived)) { return ''; }
            var sArchived = oBundle ? oBundle.getText('archived') : 'Archived';
            return sArchived;
        },

        formatArchivedState: function (vIsArchived) {
            return BooleanHelper.isTrue(vIsArchived) ? 'Warning' : 'None';
        },

        formatMarkReadText: function (vIsRead, oBundle) {
            var sKey = BooleanHelper.isTrue(vIsRead) ? 'markUnread' : 'markRead';
            return oBundle ? oBundle.getText(sKey) : (BooleanHelper.isTrue(vIsRead) ? 'Mark as Unread' : 'Mark as Read');
        },

        formatMarkReadIcon: function (vIsRead) {
            return BooleanHelper.isTrue(vIsRead) ? 'sap-icon://email' : 'sap-icon://email-read';
        },

        formatArchiveText: function (vIsArchived, oBundle) {
            var sKey = BooleanHelper.isTrue(vIsArchived) ? 'unarchive' : 'archive';
            return oBundle ? oBundle.getText(sKey) : (BooleanHelper.isTrue(vIsArchived) ? 'Unarchive' : 'Archive');
        },

        formatArchiveIcon: function (vIsArchived) {
            return BooleanHelper.isTrue(vIsArchived) ? 'sap-icon://folder-blank' : 'sap-icon://folder';
        },

        formatBodyHtml: function (sBody) {
            if (!sBody) { return '<p></p>'; }
            return /<[a-z][\s\S]*>/i.test(sBody) ? sBody : '<p>' + encodeXML(sBody) + '</p>';
        }
    };
});
