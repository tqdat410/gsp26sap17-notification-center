/**
 * NotificationList.controller.js
 *
 * Notification list with tabs, filters, table, and bulk actions
 */
sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageToast',
    'sap/m/MessageBox',
    'sap/base/Log',
    'com/gsp26/sap17/notificationcenter/util/NotificationFormatter',
    'com/gsp26/sap17/notificationcenter/util/NotificationActionHelper',
    'com/gsp26/sap17/notificationcenter/util/ToolbarStateHelper'
], function (Controller, Filter, FilterOperator, JSONModel, MessageToast,
             MessageBox, Log, Formatter, ActionHelper, ToolbarHelper) {
    'use strict';

    var EVENT_CHANNEL = 'notification.center';
    var EVENT_REFRESH = 'refreshList';

    return Controller.extend('com.gsp26.sap17.notificationcenter.controller.NotificationList', {

        onInit: function () {
            this.getView().setModel(new JSONModel({
                selectedTab: 'unread', hasSelection: false,
                deleteButtonText: 'Delete', archiveButtonText: 'Archive',
                archiveButtonIcon: 'sap-icon://folder',
                markReadButtonText: 'Mark All as Read', markReadButtonIcon: 'sap-icon://email-read'
            }), 'view');
            this._sCurrentTab = 'unread';
            this._sSearchQuery = '';
            this._sPriorityFilter = 'all';
            this._sCategoryFilter = 'all';
            this._dDateFrom = null;
            this._dDateTo = null;
            this._bindFormatters();
            this.getOwnerComponent().getRouter().getRoute('main').attachPatternMatched(this._onRouteMatched, this);
            this.getOwnerComponent().getEventBus().subscribe(EVENT_CHANNEL, EVENT_REFRESH, this._onRefreshList, this);
        },

        _bindFormatters: function () {
            var that = this;
            this.formatSubjectHtml = Formatter.formatSubjectHtml;
            this.formatPriorityHtml = Formatter.formatPriorityHtml;
            this.formatDateHtml = Formatter.formatDateHtml;
            this.formatCategoryHtml = function (v, c) {
                var oModel = that.getView().getModel('i18n');
                var oBundle = oModel ? oModel.getResourceBundle() : null;
                return Formatter.formatCategoryHtml(v, c, oBundle);
            };
        },

        onExit: function () {
            this.getOwnerComponent().getEventBus().unsubscribe(EVENT_CHANNEL, EVENT_REFRESH, this._onRefreshList, this);
        },

        _onRefreshList: function () {
            var oBinding = this.byId('notificationTable').getBinding('items');
            if (oBinding) { oBinding.refresh(); }
            this.getOwnerComponent().refreshUnreadCount();
        },

        _onRouteMatched: function () {
            this._applyFilters();
            this._updateTableTitleCount();
        },

        onTabSelect: function (oEvent) {
            this._sCurrentTab = oEvent.getParameter('key');
            this.getView().getModel('view').setProperty('/selectedTab', this._sCurrentTab);
            this._applyFilters();
        },

        onSearch: function (oEvent) { this._sSearchQuery = oEvent.getParameter('newValue'); this._applyFilters(); },
        onCategoryFilterChange: function (oEvent) { this._sCategoryFilter = oEvent.getParameter('selectedItem').getKey(); this._applyFilters(); },
        onPriorityFilterChange: function (oEvent) { this._sPriorityFilter = oEvent.getParameter('selectedItem').getKey(); this._applyFilters(); },

        onDateFilterChange: function (oEvent) {
            var sId = oEvent.getSource().getId();
            var dDate = oEvent.getSource().getDateValue();
            if (sId.indexOf('dateFromFilter') !== -1) { this._dDateFrom = dDate; } else { this._dDateTo = dDate; }
            this._applyFilters();
        },

        _buildFilters: function () {
            var a = [new Filter('IsDeleted', FilterOperator.EQ, false)];
            switch (this._sCurrentTab) {
                case 'unread': a.push(new Filter('IsRead', FilterOperator.EQ, false)); a.push(new Filter('IsArchived', FilterOperator.EQ, false)); break;
                case 'archived': a.push(new Filter('IsArchived', FilterOperator.EQ, true)); break;
                default: a.push(new Filter('IsArchived', FilterOperator.EQ, false));
            }
            if (this._sPriorityFilter !== 'all') { a.push(new Filter('_Notification/Priority', FilterOperator.EQ, this._sPriorityFilter)); }
            if (this._sCategoryFilter !== 'all') { a.push(new Filter('_Notification/Category', FilterOperator.EQ, this._sCategoryFilter)); }
            if (this._dDateFrom) { var d = new Date(this._dDateFrom); d.setHours(0,0,0,0); a.push(new Filter('_Notification/CreatedAt', FilterOperator.GE, d)); }
            if (this._dDateTo) { var t = new Date(this._dDateTo); t.setHours(23,59,59,999); a.push(new Filter('_Notification/CreatedAt', FilterOperator.LE, t)); }
            if (this._sSearchQuery) { a.push(new Filter({ filters: [new Filter('_Notification/Title', FilterOperator.Contains, this._sSearchQuery), new Filter('_Notification/Message', FilterOperator.Contains, this._sSearchQuery)], and: false })); }
            return a;
        },

        _applyFilters: function () {
            var b = this.byId('notificationTable').getBinding('items');
            if (b) {
                b.filter(this._buildFilters(), 'Application');
                this._updateTableTitleCount();
            }
        },

        _updateTableTitleCount: function () {
            var oList = this.byId('notificationTable');
            var oBinding = oList.getBinding('items');
            var oTitle = this.byId('tableTitle');
            var oBundle = this._getBundle();

            if (oBinding && oTitle) {
                oBinding.attachEventOnce('dataReceived', function () {
                    var iCount = oBinding.getLength();
                    if (iCount === undefined) {
                        iCount = oList.getItems().length;
                    }
                    oTitle.setText(oBundle.getText('notifications') + ' (' + iCount + ')');
                });
            }
        },

        onNotificationPress: function (oEvent) { this._markAsReadAndNavigate(oEvent.getSource().getBindingContext()); },

        _markAsReadAndNavigate: function (oCtx) {
            if (!oCtx) { return; }
            var that = this, sR = oCtx.getProperty('RecipientID'), sN = oCtx.getProperty('NotificationID');
            if (!oCtx.getProperty('IsRead')) {
                ActionHelper.executeAction(oCtx.getModel(), sN, 'MarkAsRead').then(function () { that.getOwnerComponent().refreshUnreadCount(); }).catch(function (e) { Log.error('Mark read failed: ' + e.message); });
            }
            this.getOwnerComponent().getRouter().navTo('detail', { recipientId: sR, notificationId: sN });
        },

        onSelectionChange: function () { this._updateToolbarButtons(); },
        onUpdateFinished: function () {
            this._updateToolbarButtons();
            this._updateTableTitleCount();
        },
        _updateToolbarButtons: function () { ToolbarHelper.updateToolbarButtons(this.byId('notificationTable'), this.getView().getModel('view'), this._getBundle()); },

        onDeleteAction: function () {
            var oT = this.byId('notificationTable'), aS = oT.getSelectedItems(), oM = this.getView().getModel(), that = this;
            if (aS.length > 0) { ActionHelper.executeBatchAction(oM, aS, 'MarkAsDeleted').then(function () { MessageToast.show(that._getBundle().getText('delete')); oT.removeSelections(true); that._refreshAfterAction(); }); }
            else { MessageBox.confirm(this._getBundle().getText('deleteAll') + '?', { onClose: function (a) { if (a === MessageBox.Action.OK) { ActionHelper.executeCollectionAction(oM, 'MarkAllAsDeleted').then(function () { that._refreshAfterAction(); }).catch(function (e) { MessageBox.error(e.message); }); } } }); }
        },

        onArchiveAction: function () {
            var oT = this.byId('notificationTable'), aS = oT.getSelectedItems(), oB = this._getBundle(), bU = this.getView().getModel('view').getProperty('/archiveButtonText') === oB.getText('unarchive'), sA = bU ? 'UnArchive' : 'Archive', that = this;
            if (aS.length > 0) { ActionHelper.executeBatchAction(this.getView().getModel(), aS, sA).then(function () { MessageToast.show(oB.getText(bU ? 'unarchive' : 'archive')); oT.removeSelections(true); that._refreshAfterAction(); }); }
        },

        onMarkReadAction: function () {
            var oT = this.byId('notificationTable'), aS = oT.getSelectedItems(), oB = this._getBundle(), sT = this.getView().getModel('view').getProperty('/markReadButtonText');
            var bMR = (sT === oB.getText('markRead') || sT === oB.getText('markAllRead')), sA = bMR ? 'MarkAsRead' : 'MarkAsUnRead', oM = this.getView().getModel(), that = this;
            if (aS.length > 0) { ActionHelper.executeBatchAction(oM, aS, sA).then(function () { oT.removeSelections(true); that._refreshAfterAction(); }); }
            else if (bMR) { this.onMarkAllAsRead(); }
            else { ActionHelper.executeBatchAction(oM, oT.getItems(), 'MarkAsUnRead').then(function () { that._refreshAfterAction(); }); }
        },

        onMarkAllAsRead: function () {
            var that = this;
            ActionHelper.executeCollectionAction(this.getView().getModel(), 'MarkAllAsRead').then(function () { MessageToast.show(that._getBundle().getText('markAllRead')); that._refreshAfterAction(); }).catch(function (e) { MessageBox.error(e.message); });
        },

        onArchiveAll: function () {
            var that = this;
            MessageBox.confirm(this._getBundle().getText('archiveAll') + '?', { onClose: function (a) { if (a === MessageBox.Action.OK) { ActionHelper.executeBatchAction(that.getView().getModel(), that.byId('notificationTable').getItems(), 'Archive').then(function () { that._refreshAfterAction(); }).catch(function (e) { MessageBox.error(e.message); }); } } });
        },

        _getBundle: function () { return this.getView().getModel('i18n').getResourceBundle(); },
        _refreshAfterAction: function () { this.getOwnerComponent().refreshUnreadCount(); this.byId('notificationTable').getBinding('items').refresh(); }
    });
});
