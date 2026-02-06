/**
 * NotificationDetail.controller.js
 *
 * Notification detail page with actions
 * - ObjectHeader with priority/category/read status
 * - Message panel with HTML rendering
 * - Source object navigation
 * - Footer: delete, toggle read, toggle archive
 * - Auto-marks as read on first load
 */
sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageToast',
    'sap/m/MessageBox',
    'com/gsp26/sap17/notificationcenter/util/NotificationFormatter',
    'com/gsp26/sap17/notificationcenter/util/NotificationActionHelper',
    'com/gsp26/sap17/notificationcenter/util/BooleanHelper',
    'com/gsp26/sap17/notificationcenter/util/CrossAppNavigation'
], function (Controller, JSONModel, MessageToast, MessageBox,
             Formatter, ActionHelper, BooleanHelper, CrossAppNav) {
    'use strict';

    var EVENT_CHANNEL = 'notification.center';
    var EVENT_REFRESH = 'refreshList';

    return Controller.extend('com.gsp26.sap17.notificationcenter.controller.NotificationDetail', {

        onInit: function () {
            this.getView().setModel(new JSONModel({ busy: false }), 'view');
            this._bindFormatters();
            this.getOwnerComponent().getRouter().getRoute('detail').attachPatternMatched(this._onRouteMatched, this);
        },

        _bindFormatters: function () {
            var oBundle = this.getView().getModel('i18n').getResourceBundle();
            this.formatPriorityText = function (s) { return Formatter.formatPriorityText(s, oBundle); };
            this.formatPriorityState = Formatter.formatPriorityState;
            this.formatCategory = function (s) { return Formatter.formatCategory(s, oBundle); };
            this.formatReadStatusText = function (v) { return Formatter.formatReadStatusText(v, oBundle); };
            this.formatReadStatusState = Formatter.formatReadStatusState;
            this.formatArchivedStatusVisible = Formatter.formatArchivedStatusVisible;
            this.formatFullDateTime = Formatter.formatFullDateTime;
            this.formatMarkReadText = function (v) { return Formatter.formatMarkReadText(v, oBundle); };
            this.formatMarkReadIcon = Formatter.formatMarkReadIcon;
            this.formatArchiveText = function (v) { return Formatter.formatArchiveText(v, oBundle); };
            this.formatArchiveIcon = Formatter.formatArchiveIcon;
            this.formatSourceObjectType = function (s) { return Formatter.formatSourceObjectType(s, oBundle); };
        },

        _onRouteMatched: function (oEvent) {
            var oArgs = oEvent.getParameter('arguments');
            this._sRecipientId = oArgs.recipientId;
            this._sNotificationId = oArgs.notificationId;
            this._bAutoMarkReadDone = false;
            this._bindView(this._sRecipientId, this._sNotificationId);
        },

        _bindView: function (sRecipientId, sNotificationId) {
            var oView = this.getView();
            var oVM = oView.getModel('view');
            var that = this;
            oVM.setProperty('/busy', true);

            var sPath = '/Recipient(RecipientID=' + sRecipientId + ',NotificationID=' + sNotificationId + ')';

            oView.bindElement({
                path: sPath,
                parameters: { $expand: '_Notification($expand=_Actions)' },
                events: {
                    dataRequested: function () { oVM.setProperty('/busy', true); },
                    dataReceived: function () {
                        oVM.setProperty('/busy', false);
                        that._autoMarkAsRead();
                    }
                }
            });
        },

        _autoMarkAsRead: function () {
            if (this._bAutoMarkReadDone) { return; }
            this._bAutoMarkReadDone = true;

            var oCtx = this.getView().getBindingContext();
            var that = this;
            if (!oCtx) { return; }

            oCtx.requestObject().then(function (oData) {
                if (!oData || BooleanHelper.isTrue(oData.IsRead)) { return; }
                var sId = oData.NotificationID;
                if (!sId) { return; }

                ActionHelper.executeAction(oCtx.getModel(), sId, 'MarkAsRead')
                    .then(function () {
                        that.getOwnerComponent().refreshUnreadCount();
                        oCtx.refresh();
                        that._publishRefresh();
                    }).catch(function (oErr) {
                        jQuery.sap.log.error('Auto mark-as-read failed: ' + oErr.message);
                    });
            });
        },

        onNavBack: function () {
            var oHistory = sap.ui.core.routing.History.getInstance();
            if (oHistory.getPreviousHash() !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo('main', {}, true);
            }
        },

        onNavigateToSource: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var sSrc = oCtx.getProperty('_Notification/SourceObject');
            var sKey = oCtx.getProperty('_Notification/SourceKey');
            if (sSrc && sKey) {
                CrossAppNav.navigateToSource(sSrc, sKey);
            } else {
                MessageToast.show(this._getBundle().getText('noNotifications'));
            }
        },

        onToggleRead: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var that = this;
            var bIsRead = oCtx.getProperty('IsRead');
            var sAction = bIsRead ? 'MarkAsUnRead' : 'MarkAsRead';

            ActionHelper.executeAction(oCtx.getModel(), oCtx.getProperty('NotificationID'), sAction)
                .then(function () {
                    MessageToast.show(that._getBundle().getText(bIsRead ? 'markUnread' : 'markRead'));
                    that.getOwnerComponent().refreshUnreadCount();
                    oCtx.refresh();
                    that._publishRefresh();
                }).catch(function (oErr) { MessageBox.error(oErr.message); });
        },

        onArchive: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var that = this;
            var bArchived = oCtx.getProperty('IsArchived');
            var sAction = bArchived ? 'UnArchive' : 'Archive';

            ActionHelper.executeAction(oCtx.getModel(), oCtx.getProperty('NotificationID'), sAction)
                .then(function () {
                    MessageToast.show(that._getBundle().getText(bArchived ? 'unarchive' : 'archive'));
                    that.getOwnerComponent().refreshUnreadCount();
                    oCtx.refresh();
                    that._publishRefresh();
                }).catch(function (oErr) { MessageBox.error(oErr.message); });
        },

        onDelete: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var that = this;

            MessageBox.confirm(this._getBundle().getText('delete') + '?', {
                onClose: function (sBtn) {
                    if (sBtn === MessageBox.Action.OK) {
                        ActionHelper.executeAction(oCtx.getModel(), oCtx.getProperty('NotificationID'), 'MarkAsDeleted')
                            .then(function () {
                                MessageToast.show(that._getBundle().getText('delete'));
                                that.getOwnerComponent().refreshUnreadCount();
                                that._publishRefresh();
                                that.onNavBack();
                            }).catch(function (oErr) { MessageBox.error(oErr.message); });
                    }
                }
            });
        },

        _getBundle: function () { return this.getView().getModel('i18n').getResourceBundle(); },
        _publishRefresh: function () { this.getOwnerComponent().getEventBus().publish(EVENT_CHANNEL, EVENT_REFRESH); }
    });
});
