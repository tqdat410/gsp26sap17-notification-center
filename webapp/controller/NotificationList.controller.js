/**
 * NotificationList.controller.js
 *
 * Notification list with tabs, filters, table, and bulk actions
 */
sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/Sorter',
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageToast',
    'sap/m/MessageBox',
    'sap/base/Log',
    'com/gsp26/sap17/notificationcenter/util/NotificationFormatter',
    'com/gsp26/sap17/notificationcenter/util/NotificationActionHelper',
    'com/gsp26/sap17/notificationcenter/util/ToolbarStateHelper'
], function (Controller, Filter, FilterOperator, Sorter, JSONModel, MessageToast,
             MessageBox, Log, Formatter, ActionHelper, ToolbarHelper) {
    'use strict';

    var EVENT_CHANNEL = 'notification.center';
    var EVENT_REFRESH = 'refreshList';

    return Controller.extend('com.gsp26.sap17.notificationcenter.controller.NotificationList', {

        // Formatters on prototype so XML template processor finds them at parse time
        formatSubjectHtml: Formatter.formatSubjectHtml,
        formatPriorityHtml: Formatter.formatPriorityHtml,
        formatDateHtml: Formatter.formatDateHtml.bind(Formatter),
        // oCategoryMap is bound from categoryVH>/map model (pre-loaded with localized names from backend CategoryValueHelp)
        formatCategoryHtml: function (vIsRead, sCategory, oCategoryMap) {
            return Formatter.formatCategoryHtml.call(Formatter, vIsRead, sCategory, oCategoryMap);
        },

        onInit: function () {
            this.getView().setModel(new JSONModel({
                selectedTab: 'all', hasSelection: false,
                deleteButtonText: 'Delete', archiveButtonText: 'Archive',
                archiveButtonIcon: 'sap-icon://folder',
                markReadButtonText: 'Mark All as Read', markReadButtonIcon: 'sap-icon://email-read'
            }), 'view');
            this._sCurrentTab = 'all';
            this._sSearchQuery = '';
            this._sPriorityFilter = 'all';
            this._sCategoryFilter = 'all';
            this._dDateFrom = null;
            this._dDateTo = null;
            this.getOwnerComponent().getRouter().getRoute('main').attachPatternMatched(this._onRouteMatched, this);
            this.getOwnerComponent().getEventBus().subscribe(EVENT_CHANNEL, EVENT_REFRESH, this._onRefreshList, this);
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
            if (this._sCategoryFilter !== 'all') { a.push(new Filter('_Notification/CategoryCode', FilterOperator.EQ, this._sCategoryFilter)); }
            if (this._dDateFrom && this._dDateTo) {
                var dF = new Date(this._dDateFrom); dF.setHours(0,0,0,0);
                var dT = new Date(this._dDateTo); dT.setHours(23,59,59,999);
                a.push(new Filter('_Notification/SentAt', FilterOperator.BT, dF.toISOString(), dT.toISOString()));
            } else if (this._dDateFrom) {
                var d = new Date(this._dDateFrom); d.setHours(0,0,0,0);
                a.push(new Filter('_Notification/SentAt', FilterOperator.GE, d.toISOString()));
            } else if (this._dDateTo) {
                var t = new Date(this._dDateTo); t.setHours(23,59,59,999);
                a.push(new Filter('_Notification/SentAt', FilterOperator.LE, t.toISOString()));
            }
            if (this._sSearchQuery) { a.push(new Filter({ filters: [new Filter('_Notification/Title', FilterOperator.Contains, this._sSearchQuery), new Filter('_Notification/Body', FilterOperator.Contains, this._sSearchQuery)], and: false })); }
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
            var that = this, sR = oCtx.getProperty('UserId'), sN = oCtx.getProperty('NotificationId');
            
            // Fetch and save FULL navigation context for current tab (without search/filters)
            this._fetchAndSaveNavigationContext(sN, function() {
                // Fire-and-forget mark as read so detail page loads with IsRead=true (no flicker)
                if (!oCtx.getProperty('IsRead')) {
                    ActionHelper.executeAction(oCtx.getModel(), sN, 'MarkAsRead').catch(function (e) { Log.error('Mark read failed: ' + e.message); });
                }
                // Navigate with only tab parameter (detail page handles list refresh via _publishRefresh)
                that.getOwnerComponent().getRouter().navTo('detail', {
                    notificationId: sN,
                    recipientId: sR,
                    '?query': { tab: that._sCurrentTab || 'all' }
                });
            });
        },

        _fetchAndSaveNavigationContext: function (sNotificationId, fnCallback) {
            var oModel = this.getView().getModel();
            if (!oModel) {
                if (fnCallback) { fnCallback(); }
                return;
            }
            
            // Build filters for FULL tab (no search, no priority, no category, no date)
            var aFilters = [new Filter('IsDeleted', FilterOperator.EQ, false)];
            var sTab = this._sCurrentTab || 'all';
            
            switch (sTab) {
                case 'unread':
                    aFilters.push(new Filter('IsRead', FilterOperator.EQ, false));
                    aFilters.push(new Filter('IsArchived', FilterOperator.EQ, false));
                    break;
                case 'archived':
                    aFilters.push(new Filter('IsArchived', FilterOperator.EQ, true));
                    break;
                default:
                    aFilters.push(new Filter('IsArchived', FilterOperator.EQ, false));
            }
            
            var oSorter = new Sorter('_Notification/SentAt', true);
            var that = this;
            
            var oBinding = oModel.bindList('/Recipient', null, oSorter, aFilters);
            oBinding.requestContexts(0, 1000).then(function (aContexts) {
                var aNotifications = [];
                var iCurrentIndex = -1;
                
                if (aContexts) {
                    aContexts.forEach(function (oCtx, index) {
                        var sNId = oCtx.getProperty('NotificationId');
                        var sRId = oCtx.getProperty('UserId');
                        aNotifications.push({
                            notificationId: sNId,
                            recipientId: sRId
                        });
                        if (sNId === sNotificationId) {
                            iCurrentIndex = index;
                        }
                    });
                }
                
                var oAppModel = that.getOwnerComponent().getModel('app');
                oAppModel.setProperty('/navigationContext', {
                    notifications: aNotifications,
                    currentIndex: iCurrentIndex >= 0 ? iCurrentIndex : 0
                });
                
                if (fnCallback) { fnCallback(); }
            }).catch(function (oError) {
                Log.error('Failed to fetch navigation context: ' + oError.message);
                if (fnCallback) { fnCallback(); }
            });
        },

        onSelectionChange: function () { this._updateToolbarButtons(); },
        onUpdateFinished: function () {
            this._updateToolbarButtons();
            this._updateTableTitleCount();
        },
        _updateToolbarButtons: function () { ToolbarHelper.updateToolbarButtons(this.byId('notificationTable'), this.getView().getModel('view'), this._getBundle()); },

        onDeleteAction: function () {
            var oT = this.byId('notificationTable'), aS = oT.getSelectedItems(), oM = this.getView().getModel(), that = this;
            if (aS.length > 0) { ActionHelper.executeBatchAction(oM, aS, 'MarkAsDeleted').then(function () { MessageToast.show(that._getBundle().getText('delete')); oT.removeSelections(true); that._refreshAfterAction(); }).catch(function (e) { MessageBox.error(e.message); }); }
            else { MessageBox.confirm(this._getBundle().getText('deleteAll') + '?', { onClose: function (a) { if (a === MessageBox.Action.OK) { ActionHelper.executeCollectionAction(oM, 'MarkAllAsDeleted').then(function () { MessageToast.show(that._getBundle().getText('deleteAll')); that._refreshAfterAction(); }).catch(function (e) { MessageBox.error(e.message); }); } } }); }
        },

        onArchiveAction: function () {
            var oT = this.byId('notificationTable'), aS = oT.getSelectedItems(), oB = this._getBundle(), bU = this.getView().getModel('view').getProperty('/archiveButtonText') === oB.getText('unarchive'), sA = bU ? 'Unarchive' : 'Archive', that = this;
            if (aS.length > 0) { ActionHelper.executeBatchAction(this.getView().getModel(), aS, sA).then(function () { MessageToast.show(oB.getText(bU ? 'unarchive' : 'archive')); oT.removeSelections(true); that._refreshAfterAction(); }).catch(function (e) { MessageBox.error(e.message); }); }
        },

        onMarkReadAction: function () {
            var oT = this.byId('notificationTable'), aS = oT.getSelectedItems(), oB = this._getBundle(), sT = this.getView().getModel('view').getProperty('/markReadButtonText');
            var bMR = (sT === oB.getText('markRead') || sT === oB.getText('markAllRead')), sA = bMR ? 'MarkAsRead' : 'MarkAsUnread', oM = this.getView().getModel(), that = this;
            if (aS.length > 0) {
                ActionHelper.executeBatchAction(oM, aS, sA).then(function () {
                    oT.removeSelections(true);
                    that._refreshAfterAction();
                }).catch(function (e) {
                    MessageBox.error(e.message);
                });
            }
            else if (bMR) {
                this.onMarkAllAsRead();
            }
            else {
                ActionHelper.executeCollectionAction(oM, 'MarkAllAsUnread').then(function () {
                    MessageToast.show(that._getBundle().getText('markAllUnread'));
                    that._refreshAfterAction();
                }).catch(function (e) {
                    MessageBox.error(e.message);
                });
            }
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
