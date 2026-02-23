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
    'com/gsp26/sap17/notificationcenter/util/BooleanHelper',
    'sap/ui/core/library',
    'sap/base/security/encodeXML',
    'sap/base/security/sanitizeHTML'
], function (DateFormat, BooleanHelper, coreLibrary, encodeXML, sanitizeHTML) {
    'use strict';

    var Priority = coreLibrary.Priority;

    var oDateTimeFormat = DateFormat.getDateTimeInstance({ pattern: 'dd.MM.yy HH:mm:ss' });
    var oRelativeFormat = DateFormat.getDateTimeInstance({ relative: true, relativeScale: 'auto' });

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

    return {
        formatDateTime: function (sDateTime) {
            if (!sDateTime) { return ''; }
            return oRelativeFormat.format(new Date(sDateTime));
        },

        formatFullDateTime: function (sDateTime) {
            if (!sDateTime) { return ''; }
            return oDateTimeFormat.format(new Date(sDateTime));
        },

        formatDateTimeWithRelative: function (sDateTime) {
            if (!sDateTime) { return ''; }
            var sRelative = oRelativeFormat.format(new Date(sDateTime));
            var sFull = oDateTimeFormat.format(new Date(sDateTime));
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

        formatReadStatusText: function (vIsRead, oBundle) {
            var sKey = BooleanHelper.isTrue(vIsRead) ? 'read' : 'unreadStatus';
            return oBundle ? oBundle.getText(sKey) : (BooleanHelper.isTrue(vIsRead) ? 'Read' : 'Unread');
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
