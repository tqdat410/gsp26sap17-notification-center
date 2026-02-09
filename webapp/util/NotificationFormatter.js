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
    'sap/base/security/encodeXML'
], function (DateFormat, BooleanHelper, coreLibrary, encodeXML) {
    'use strict';

    var Priority = coreLibrary.Priority;

    var oDateTimeFormat = DateFormat.getDateTimeInstance({ pattern: 'dd.MM.yy HH:mm:ss' });
    var oRelativeFormat = DateFormat.getDateTimeInstance({ relative: true, relativeScale: 'auto' });

    return {
        formatDateTime: function (sDateTime) {
            if (!sDateTime) { return ''; }
            return oRelativeFormat.format(new Date(sDateTime));
        },

        formatFullDateTime: function (sDateTime) {
            if (!sDateTime) { return ''; }
            return oDateTimeFormat.format(new Date(sDateTime));
        },

        formatCategory: function (sCategory, oBundle) {
            var sKey = {
                'TASK': 'categoryTask',
                'SYTM': 'categorySystem',
                'INFO': 'categoryInfo',
                'ALRT': 'categoryAlert'
            }[sCategory];
            return sKey && oBundle ? oBundle.getText(sKey) : sCategory || '';
        },

        formatPriority: function (sPriority) {
            return { 'H': Priority.High, 'M': Priority.Medium, 'L': Priority.Low }[sPriority] || Priority.None;
        },

        formatPriorityState: function (sPriority) {
            return { 'H': 'Error', 'M': 'Warning', 'L': 'Success' }[sPriority] || 'None';
        },

        formatPriorityText: function (sPriority, oBundle) {
            var sKey = { 'H': 'priorityHigh', 'M': 'priorityMedium', 'L': 'priorityLow' }[sPriority];
            return sKey && oBundle ? oBundle.getText(sKey) : sPriority || '';
        },

        formatSubjectHtml: function (vIsRead, sTitle, sMessage) {
            var sT = encodeXML(sTitle || '');
            var sM = encodeXML(sMessage || '');
            var bRead = BooleanHelper.isTrue(vIsRead);
            return bRead ? sT + ' - <em>' + sM + '</em>' : '<strong>' + sT + '</strong> - <em>' + sM + '</em>';
        },

        formatCategoryHtml: function (vIsRead, sCategory, oBundle) {
            var sText = encodeXML(this.formatCategory(sCategory, oBundle));
            return BooleanHelper.isTrue(vIsRead) ? sText : '<strong>' + sText + '</strong>';
        },

        formatDateHtml: function (vIsRead, sDateTime) {
            var sText = encodeXML(this.formatFullDateTime(sDateTime));
            return BooleanHelper.isTrue(vIsRead) ? sText : '<strong>' + sText + '</strong>';
        },

        formatPriorityHtml: function (vIsRead, sPriority) {
            var sText = { 'H': 'High', 'M': 'Medium', 'L': 'Low' }[sPriority] || sPriority || '';
            var sColor = { 'H': '#bb0000', 'M': '#e9730c', 'L': '#107e3e' }[sPriority] || '#6a6d70';
            var sEsc = encodeXML(sText);
            var sSpan = '<span style="color:' + sColor + '">' + sEsc + '</span>';
            return BooleanHelper.isTrue(vIsRead) ? sSpan : '<strong>' + sSpan + '</strong>';
        },

        formatReadStatusText: function (vIsRead, oBundle) {
            var sKey = BooleanHelper.isTrue(vIsRead) ? 'read' : 'unreadStatus';
            return oBundle ? oBundle.getText(sKey) : (BooleanHelper.isTrue(vIsRead) ? 'Read' : 'Unread');
        },

        formatReadStatusState: function (vIsRead) {
            return BooleanHelper.isTrue(vIsRead) ? 'Success' : 'Warning';
        },

        formatArchivedStatusVisible: function (vIsArchived) {
            return BooleanHelper.isTrue(vIsArchived);
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

        formatSourceObjectType: function (sSourceObject, oBundle) {
            if (sSourceObject === 'LEAVE_REQUEST') {
                return oBundle ? oBundle.getText('sourceLeaveRequest') : 'Leave Request';
            }
            return sSourceObject || '';
        }
    };
});
