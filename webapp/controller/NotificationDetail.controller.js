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
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/Sorter',
    'sap/m/MessageToast',
    'sap/m/MessageBox',
    'sap/m/Button',
    'sap/m/Dialog',
    'sap/m/TextArea',
    'sap/m/Label',
    'sap/m/VBox',
    'sap/ui/core/routing/History',
    'sap/base/Log',
    'com/gsp26/sap17/notificationcenter/util/NotificationFormatter',
    'com/gsp26/sap17/notificationcenter/util/NotificationActionHelper',
    'com/gsp26/sap17/notificationcenter/util/BooleanHelper',
    'com/gsp26/sap17/notificationcenter/util/CrossAppNavigation',
    'com/gsp26/sap17/notificationcenter/util/LeaveRequestActionHelper'
], function (Controller, Fragment, JSONModel, Filter, FilterOperator, Sorter, MessageToast, MessageBox, MButton,
             MDialog, MTextArea, MLabel, MVBox, History, Log,
             Formatter, ActionHelper, BooleanHelper, CrossAppNav, LeaveRequestHelper) {
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
        formatReadStatusState: Formatter.formatReadStatusState,
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
        formatNavigationCounter: function (iCurrentIndex, aNotifications) {
            if (!aNotifications || aNotifications.length === 0) { return ''; }
            var iDisplayIndex = (iCurrentIndex || 0) + 1;
            return iDisplayIndex + ' of ' + aNotifications.length;
        },

        onInit: function () {
            this.getView().setModel(new JSONModel({ busy: false, hasActions: false }), 'view');
            this.getOwnerComponent().getRouter().getRoute('detail').attachPatternMatched(this._onRouteMatched, this);
            this._oRejectDialog = null;
            this._sCurrentRequestId = null;
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

        onPreviousPress: function () {
            this._navigateToAdjacentNotification(-1);
        },

        onNextPress: function () {
            this._navigateToAdjacentNotification(1);
        },

        _navigateToAdjacentNotification: function (iDirection) {
            var oAppModel = this.getOwnerComponent().getModel('app');
            var aNotifications = oAppModel.getProperty('/navigationContext/notifications') || [];
            var iCurrentIndex = oAppModel.getProperty('/navigationContext/currentIndex') || 0;
            var iNewIndex = iCurrentIndex + iDirection;

            if (iNewIndex < 0 || iNewIndex >= aNotifications.length) { return; }

            var oNextNotification = aNotifications[iNewIndex];
            oAppModel.setProperty('/navigationContext/currentIndex', iNewIndex);

            // Fire-and-forget mark as read so detail page loads with IsRead=true (no flicker)
            ActionHelper.executeAction(this.getView().getModel(), oNextNotification.notificationId, 'MarkAsRead')
                .catch(function () {});

            this.getOwnerComponent().getRouter().navTo('detail', {
                notificationId: oNextNotification.notificationId,
                recipientId: oNextNotification.recipientId,
                '?query': { tab: this._sCurrentTab || 'all' }
            });
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

        _handleArchiveNavigation: function () {
            var oAppModel = this.getOwnerComponent().getModel('app');
            var aNotifications = oAppModel.getProperty('/navigationContext/notifications') || [];
            var iCurrentIndex = oAppModel.getProperty('/navigationContext/currentIndex') || 0;

            if (aNotifications.length <= 1) {
                this.onButtonNavBackPress();
                return;
            }

            var aNewNotifications = aNotifications.slice();
            aNewNotifications.splice(iCurrentIndex, 1);

            if (iCurrentIndex >= aNewNotifications.length) {
                iCurrentIndex = aNewNotifications.length - 1;
            }

            var oNavContext = {
                notifications: aNewNotifications,
                currentIndex: iCurrentIndex
            };
            oAppModel.setProperty('/navigationContext', oNavContext);

            var oNextNotification = aNewNotifications[iCurrentIndex];
            
            this.getOwnerComponent().getRouter().navTo('detail', {
                notificationId: oNextNotification.notificationId,
                recipientId: oNextNotification.recipientId,
                '?query': { tab: this._sCurrentTab || 'all' }
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
                                MessageToast.show(that._getBundle().getText('notificationDeleted'));
                                that.getOwnerComponent().refreshUnreadCount();
                                // Lưu ID để list ẩn item ngay (optimistic UI)
                                that.getOwnerComponent().getModel('app').setProperty('/deletedNotificationId', oCtx.getProperty('NotificationId'));
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
                that.getView().getModel('view').setProperty('/hasActions', aActions.length > 0);

                aActions.forEach(function (oAct, index) {
                    Log.info('[Actions] Action ' + index + ':', JSON.stringify(oAct));
                    var sIcon = that._getActionIcon(oAct.SematicObject, oAct.ActionLabel);
                    var sSematicActionLower = (oAct.SematicAction || '').toLowerCase();
                    var sType;
                    if (sSematicActionLower === 'approve') {
                        sType = 'Accept';
                    } else if (sSematicActionLower === 'reject') {
                        sType = 'Reject';
                    } else {
                        sType = index === 0 ? 'Emphasized' : 'Default';
                    }
                    var oBtn = new MButton({
                        text: oAct.ActionLabel,
                        type: sType,
                        icon: sIcon,
                        tooltip: oAct.ActionLabel
                    });
                    var aInlineKeywords = ['approve', 'reject'];
                    var sSematicLower = (oAct.SematicAction || '').toLowerCase();
                    if (aInlineKeywords.indexOf(sSematicLower) !== -1) {
                        oBtn.attachPress((function (oAction) {
                            return function () {
                                that._executeInlineAction(oAction.SematicAction, oAction.ActionLabel, oAction.Params);
                            };
                        })(oAct));
                    } else {
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
                    }
                    oBtn.addStyleClass('sapUiTinyMarginEnd sapUiTinyMarginBottom');
                    oHBox.addItem(oBtn);
                });
            });
        },

        _disableInlineActionButtons: function () {
            var oHBox = this.byId('idActionsHBox');
            if (!oHBox) { return; }
            oHBox.getItems().forEach(function (oBtn) {
                var sType = oBtn.getType ? oBtn.getType() : '';
                if (sType === 'Accept' || sType === 'Reject') {
                    oBtn.setEnabled(false);
                }
            });
        },

        _executeInlineAction: function (sSematicAction, sActionLabel, sRawParams) {
            var that = this;
            var oBundle = this._getBundle();

            var oParams = {};
            var sP = sRawParams || '';
            try { oParams = JSON.parse(sP); } catch (e) {
                sP.split('&').forEach(function (pair) {
                    var kv = pair.split('=');
                    if (kv.length === 2) { oParams[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]); }
                });
            }
            var sRequestId = oParams.RequestID || oParams.RequestId || '';

            if (sSematicAction.toLowerCase() === 'approve') {
                MessageBox.confirm(
                    oBundle.getText('confirmApproveLeaveRequest'),
                    {
                        onClose: function (sAction) {
                            if (sAction === MessageBox.Action.OK) {
                                var oVM = that.getView().getModel('view');
                                oVM.setProperty('/busy', true);
                                LeaveRequestHelper.approve(sRequestId)
                                    .then(function () {
                                        oVM.setProperty('/busy', false);
                                        MessageToast.show(oBundle.getText('approveSuccess'));
                                        that._disableInlineActionButtons();
                                        var oCtx = that.getView().getBindingContext();
                                        if (oCtx) { oCtx.refresh(); }
                                        that.getOwnerComponent().refreshUnreadCount();
                                        that._publishRefresh({
                                            source: 'action',
                                            notificationId: oCtx ? oCtx.getProperty('NotificationId') : ''
                                        });
                                    })
                                    .catch(function (oErr) {
                                        oVM.setProperty('/busy', false);
                                        var sMsg = oErr && oErr.message || '';
                                        if (sMsg.toLowerCase().indexOf('operation is not enabled') !== -1) {
                                            MessageBox.error(oBundle.getText('actionNotAvailable'));
                                        } else {
                                            MessageBox.error(sMsg);
                                        }
                                    });
                            }
                        }
                    }
                );
            } else if (sSematicAction.toLowerCase() === 'reject') {
                this._openRejectDialog(sRequestId);
            }
        },

        _getActionIcon: function (sSemanticObject, sActionLabel) {
            if (sActionLabel) {
                var sLabelLower = sActionLabel.toLowerCase();
                if (sLabelLower.indexOf('approve') !== -1) { return 'sap-icon://accept'; }
                if (sLabelLower.indexOf('reject') !== -1) { return 'sap-icon://decline'; }
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

        _openRejectDialog: function (sRequestId) {
            var that = this;
            this._sCurrentRequestId = sRequestId;

            if (!this._oRejectDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: 'com.gsp26.sap17.notificationcenter.fragment.RejectDialog',
                    controller: this
                }).then(function (oDialog) {
                    that._oRejectDialog = oDialog;
                    that.getView().addDependent(oDialog);
                    that._oRejectDialog.open();
                });
            } else {
                this._oRejectDialog.open();
            }
        },

        onRejectDialogBeforeOpen: function () {
            var oTextArea = this.getView().byId('idRejectReasonTextArea');
            if (oTextArea) {
                oTextArea.setValue('');
            }
        },

        onRejectDialogAfterClose: function () {
            this._sCurrentRequestId = null;
        },

        onRejectDialogSubmit: function () {
            var that = this;
            var oBundle = this._getBundle();
            var oTextArea = this.getView().byId('idRejectReasonTextArea');
            var sReason = oTextArea.getValue().trim();

            if (!sReason) {
                MessageBox.warning(oBundle.getText('rejectReasonRequired'));
                return;
            }

            this._oRejectDialog.close();
            var oVM = this.getView().getModel('view');
            oVM.setProperty('/busy', true);

            LeaveRequestHelper.reject(this._sCurrentRequestId, sReason)
                .then(function () {
                    oVM.setProperty('/busy', false);
                    MessageToast.show(oBundle.getText('rejectSuccess'));
                    that._disableInlineActionButtons();
                    var oCtx = that.getView().getBindingContext();
                    if (oCtx) { oCtx.refresh(); }
                    that.getOwnerComponent().refreshUnreadCount();
                    that._publishRefresh({
                        source: 'action',
                        notificationId: oCtx ? oCtx.getProperty('NotificationId') : ''
                    });
                })
                .catch(function (oErr) {
                    oVM.setProperty('/busy', false);
                    var sMsg = oErr && oErr.message || '';
                    if (sMsg.toLowerCase().indexOf('operation is not enabled') !== -1) {
                        MessageBox.error(oBundle.getText('actionNotAvailable'));
                    } else {
                        MessageBox.error(sMsg);
                    }
                });
        },

        onRejectDialogCancel: function () {
            if (this._oRejectDialog) {
                this._oRejectDialog.close();
            }
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
