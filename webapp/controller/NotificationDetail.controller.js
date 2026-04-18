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
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/Sorter',
    'sap/m/MessageToast',
    'sap/m/MessageBox',
    'sap/m/Button',
    'sap/base/Log',
    'com/gsp26/sap17/notificationcenter/util/NotificationFormatter',
    'com/gsp26/sap17/notificationcenter/util/NotificationActionHelper',
    'com/gsp26/sap17/notificationcenter/util/BooleanHelper',
    'com/gsp26/sap17/notificationcenter/util/CrossAppNavigation'
], function (Controller, JSONModel, Filter, FilterOperator, Sorter, MessageToast, MessageBox, MButton,
             Log, Formatter, ActionHelper, BooleanHelper, CrossAppNav) {
    'use strict';

    var EVENT_CHANNEL = 'notification.center';
    var EVENT_REFRESH = 'refreshList';
    var NAV_CONTEXT_WINDOW_SIZE = 100;

    return Controller.extend('com.gsp26.sap17.notificationcenter.controller.NotificationDetail', {

        // Formatters on prototype so XML template processor finds them at parse time
        formatPriorityText: function (s) {
            var oBundle = this.getView() && this.getView().getModel('i18n') ? this.getView().getModel('i18n').getResourceBundle() : null;
            return Formatter.formatPriorityText(s, oBundle);
        },
        formatPriorityState: Formatter.formatPriorityState,
        // oCategoryMap bound from categoryVH>/map (pre-loaded with localized names from backend CategoryValueHelp)
        formatCategory: function (sCategory, oCategoryMap) {
            return Formatter.formatCategory(sCategory, oCategoryMap);
        },
        formatReadStatusCombined: function (vIsRead, vIsArchived) {
            var oBundle = this.getView() && this.getView().getModel('i18n') ? this.getView().getModel('i18n').getResourceBundle() : null;
            return Formatter.formatReadStatusCombined(vIsRead, vIsArchived, oBundle);
        },
        formatReadStatusCombinedState: Formatter.formatReadStatusCombinedState,
        formatDateTimeWithRelative: Formatter.formatDateTimeWithRelative,
        formatMarkReadText: function (v) {
            var oBundle = this.getView() && this.getView().getModel('i18n') ? this.getView().getModel('i18n').getResourceBundle() : null;
            return Formatter.formatMarkReadText(v, oBundle);
        },
        formatMarkReadIcon: Formatter.formatMarkReadIcon,
        formatArchiveText: function (v) {
            var oBundle = this.getView() && this.getView().getModel('i18n') ? this.getView().getModel('i18n').getResourceBundle() : null;
            return Formatter.formatArchiveText(v, oBundle);
        },
        formatArchiveIcon: Formatter.formatArchiveIcon,
        formatBodyHtml: Formatter.formatBodyHtml,

        onInit: function () {
            this.getView().setModel(new JSONModel({ busy: false, hasActions: false }), 'view');
            this.getOwnerComponent().getRouter().getRoute('detail').attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var oArgs = oEvent.getParameter('arguments');
            this._sNotificationId = oArgs.notificationId;
            this._sRecipientId = oArgs.recipientId;
            this._bAutoMarkReadDone = false;
            
            // Parse only tab parameter
            var oQuery = oArgs['?query'] || {};
            this._sCurrentTab = oQuery.tab || 'all';
            this._bPreMarked = oQuery.preMarked === '1';
            
            // Check if navigation context already exists (from list navigation)
            var oAppModel = this.getOwnerComponent().getModel('app');
            var aNotifications = oAppModel.getProperty('/navigationContext/notifications') || [];
            var bContextExists = aNotifications.some(function(item) {
                return item.notificationId === this._sNotificationId;
            }.bind(this));
            
            // If context doesn't exist or is stale, re-fetch from backend
            if (!bContextExists || aNotifications.length === 0) {
                this._fetchNavigationContext();
            }
            
            this._bindView(this._sRecipientId, this._sNotificationId);
        },

        _bindView: function (sRecipientId, sNotificationId) {
            var oView = this.getView();
            var oVM = oView.getModel('view');
            var that = this;
            oVM.setProperty('/busy', true);

            var sPath = "/Recipient(NotificationId=" + sNotificationId + ",UserId='" + sRecipientId + "')";

            oView.bindElement({
                path: sPath,
                parameters: { $expand: '_Notification($expand=_Actions)' },
                events: {
                    dataRequested: function () { oVM.setProperty('/busy', true); },
                    dataReceived: function () {
                        oVM.setProperty('/busy', false);
                        that._autoMarkAsRead();
                        that._renderActions();
                    }
                }
            });
        },

        _autoMarkAsRead: function () {
            if (this._bAutoMarkReadDone) { return; }
            this._bAutoMarkReadDone = true;

            if (this._bPreMarked) {
                return;
            }

            var oCtx = this.getView().getBindingContext();
            var that = this;
            if (!oCtx) { return; }

            oCtx.requestObject().then(function (oData) {
                if (!oData) { return; }

                // Already read (e.g. list marked before navigation) – just refresh list
                if (BooleanHelper.isTrue(oData.IsRead)) {
                    return;
                }

                var sId = oData.NotificationId;
                if (!sId) { return; }

                ActionHelper.executeAction(oCtx.getModel(), sId, 'MarkAsRead')
                    .then(function () {
                        that.getOwnerComponent().decrementUnreadCount();
                        that.getOwnerComponent().refreshUnreadCount();
                        oCtx.refresh();
                        that._publishRefresh({
                            source: 'action',
                            notificationId: sId
                        });
                    }).catch(function (oErr) {
                        Log.error('Auto mark-as-read failed: ' + oErr.message);
                    });
            });
        },

        onButtonNavBackPress: function () {
            this.getOwnerComponent().getRouter().navTo('main', {}, {}, true);
        },

        onIsReadButtonPress: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var that = this;
            var bIsRead = oCtx.getProperty('IsRead');
            var sAction = bIsRead ? 'MarkAsUnread' : 'MarkAsRead';

            ActionHelper.executeAction(oCtx.getModel(), oCtx.getProperty('NotificationId'), sAction)
                .then(function () {
                    MessageToast.show(that._getBundle().getText(bIsRead ? 'notificationMarkedUnread' : 'notificationMarkedRead'));
                    if (bIsRead) {
                        that.getOwnerComponent().incrementUnreadCount();
                    } else {
                        that.getOwnerComponent().decrementUnreadCount();
                    }
                    that.getOwnerComponent().refreshUnreadCount();
                    oCtx.refresh();
                    that._publishRefresh({
                        source: 'action',
                        notificationId: oCtx.getProperty('NotificationId')
                    });
                }).catch(function (oErr) { MessageBox.error(oErr.message); });
        },

        onIsArchivedButtonPress: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var that = this;
            var bArchived = oCtx.getProperty('IsArchived');
            var sAction = bArchived ? 'Unarchive' : 'Archive';
            var sMessage = this._getBundle().getText(bArchived ? 'confirmUnarchiveNotification' : 'confirmArchiveNotification');

            MessageBox.confirm(sMessage, {
                onClose: function (sBtn) {
                    if (sBtn === MessageBox.Action.OK) {
                        ActionHelper.executeAction(oCtx.getModel(), oCtx.getProperty('NotificationId'), sAction)
                            .then(function () {
                                MessageToast.show(that._getBundle().getText(bArchived ? 'notificationUnarchived' : 'notificationArchived'));
                                that.getOwnerComponent().refreshUnreadCount();
                                oCtx.refresh();
                                that._publishRefresh({ source: 'action', notificationId: oCtx.getProperty('NotificationId') });
                            }).catch(function (oErr) { MessageBox.error(oErr.message); });
                    }
                }
            });
        },

        onDeleteButtonPress: function () {
            var oCtx = this.getView().getBindingContext();
            if (!oCtx) { return; }
            var that = this;

            MessageBox.confirm(this._getBundle().getText('confirmDeleteNotification'), {
                onClose: function (sBtn) {
                    if (sBtn === MessageBox.Action.OK) {
                        ActionHelper.executeAction(oCtx.getModel(), oCtx.getProperty('NotificationId'), 'MarkAsDeleted')
                            .then(function () {
                                that.getOwnerComponent().refreshUnreadCount();
                                var oAppModel = that.getOwnerComponent().getModel('app');
                                // Store ID so the list hides the item immediately (optimistic UI) and shows a toast after navigation
                                oAppModel.setProperty('/deletedNotificationId', oCtx.getProperty('NotificationId'));
                                oAppModel.setProperty('/pendingToast', 'notificationDeleted');
                                that.onButtonNavBackPress();
                            }).catch(function (oErr) { MessageBox.error(oErr.message); });
                    }
                }
            });
        },

        _renderActions: function () {
            var oCtx = this.getView().getBindingContext();
            var oHBox = this.byId('idActionsHBox');
            if (!oCtx || !oHBox) { return; }
            var that = this;
            oHBox.destroyItems();
            oCtx.requestObject().then(function (oData) {
                var aActions = (oData && oData._Notification && oData._Notification._Actions) || [];
                var aNavigableActions = aActions.filter(function (oAction) {
                    var sSematicLower = (oAction.SematicAction || '').toLowerCase();
                    return sSematicLower !== 'approve' && sSematicLower !== 'reject';
                });
                that.getView().getModel('view').setProperty('/hasActions', aNavigableActions.length > 0);

                aNavigableActions.forEach(function (oAct, index) {
                    Log.info('[Actions] Action ' + index + ':', JSON.stringify(oAct));
                    var sIcon = that._getActionIcon(oAct.SematicObject, oAct.ActionLabel);
                    var oBtn = new MButton({
                        text: oAct.ActionLabel,
                        type: index === 0 ? 'Emphasized' : 'Default',
                        icon: sIcon,
                        tooltip: oAct.ActionLabel
                    });
                    oBtn.attachPress((function (oAction) {
                        return function () {
                            var oP = {};
                            var sP = oAction.Params || '';
                            try {
                                oP = JSON.parse(sP);
                            } catch (e) {
                                sP.split('&').forEach(function (pair) {
                                    var kv = pair.split('=');
                                    if (kv.length === 2) { oP[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]); }
                                });
                            }
                            CrossAppNav.navigateWithAction(oAction.SematicObject, oAction.SematicAction, oP, that._getBundle());
                        };
                    })(oAct));
                    oBtn.addStyleClass('sapUiTinyMarginEnd sapUiTinyMarginBottom');
                    oHBox.addItem(oBtn);
                });
            });
        },

        _getActionIcon: function (sSemanticObject, sActionLabel) {
            if (sActionLabel) {
                var sLabelLower = sActionLabel.toLowerCase();
                if (sLabelLower.indexOf('view') !== -1 || sLabelLower.indexOf('display') !== -1) { return 'sap-icon://arrow-right'; }
                if (sLabelLower.indexOf('edit') !== -1) { return 'sap-icon://edit'; }
            }
            if (!sSemanticObject) { return 'sap-icon://action'; }
            var sLower = sSemanticObject.toLowerCase();
            if (sLower.indexOf('leave') !== -1 || sLower.indexOf('request') !== -1) { return 'sap-icon://request'; }
            if (sLower.indexOf('workflow') !== -1) { return 'sap-icon://workflow-tasks'; }
            if (sLower.indexOf('approval') !== -1) { return 'sap-icon://approvals'; }
            return 'sap-icon://action';
        },

        _fetchNavigationContext: function () {
            var oModel = this.getView().getModel();
            if (!oModel) { return; }
            
            var aFilters = this._buildFiltersFromState();
            var oSorter = new Sorter('_Notification/SentAt', true);
            var that = this;
            
            var oBinding = oModel.bindList('/Recipient', null, oSorter, aFilters);
            oBinding.requestContexts(0, NAV_CONTEXT_WINDOW_SIZE).then(function (aContexts) {
                if (!aContexts || aContexts.length === 0) {
                    return;
                }
                
                var aNotifications = [];
                var iCurrentIndex = -1;
                
                aContexts.forEach(function (oCtx, index) {
                    var sNId = oCtx.getProperty('NotificationId');
                    var sRId = oCtx.getProperty('UserId');
                    aNotifications.push({
                        notificationId: sNId,
                        recipientId: sRId
                    });
                    if (sNId === that._sNotificationId) {
                        iCurrentIndex = index;
                    }
                });
                
                // Handle edge case: notification not in current filtered list
                if (iCurrentIndex === -1) {
                    // Notification might have been archived/deleted or filter changed
                    // Try with "all" filter as fallback
                    if (that._sCurrentTab !== 'all') {
                        that._sCurrentTab = 'all';
                        that._fetchNavigationContext();
                        return;
                    }
                    // If still not found, just show notification without counter
                    var oAppModel = that.getOwnerComponent().getModel('app');
                    oAppModel.setProperty('/navigationContext', {
                        notifications: [{
                            notificationId: that._sNotificationId,
                            recipientId: that._sRecipientId
                        }],
                        currentIndex: 0
                    });
                    return;
                }
                
                var oNavContext = {
                    notifications: aNotifications,
                    currentIndex: iCurrentIndex
                };
                
                var oAppModel = that.getOwnerComponent().getModel('app');
                oAppModel.setProperty('/navigationContext', oNavContext);
            }).catch(function (oError) {
                Log.error('Failed to fetch navigation context: ' + oError.message);
            });
        },

        _buildFiltersFromState: function () {
            var a = [new Filter('IsDeleted', FilterOperator.EQ, false)];
            
            switch (this._sCurrentTab) {
                case 'unread':
                    a.push(new Filter('IsRead', FilterOperator.EQ, false));
                    a.push(new Filter('IsArchived', FilterOperator.EQ, false));
                    break;
                case 'archived':
                    a.push(new Filter('IsArchived', FilterOperator.EQ, true));
                    break;
                default:
                    a.push(new Filter('IsArchived', FilterOperator.EQ, false));
            }
            
            return a;
        },

        _getBundle: function () { return this.getView().getModel('i18n').getResourceBundle(); },
        _publishRefresh: function (oData) {
            this.getOwnerComponent().getEventBus().publish(EVENT_CHANNEL, EVENT_REFRESH, oData || {});
        }
    });
});
