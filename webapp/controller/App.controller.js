/**
 * App.controller.js
 *
 * Application shell controller
 * - ShellBar with notification bell and menu
 * - Polling for unread count refresh
 * - Notification popover (lazy loaded)
 * - Navigation menu
 */
sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/core/Fragment',
    'sap/m/Menu',
    'sap/m/MenuItem',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/Sorter',
    'sap/m/MessageToast',
    'sap/m/MessageBox',
    'sap/m/NotificationListItem',
    'sap/base/Log',
    'com/gsp26/sap17/notificationcenter/util/NotificationFormatter',
    'com/gsp26/sap17/notificationcenter/util/NotificationActionHelper'
], function (Controller, Fragment, Menu, MenuItem, Filter, FilterOperator, Sorter,
             MessageToast, MessageBox, NotificationListItem, Log, Formatter, ActionHelper) {
    'use strict';

    var EVENT_CHANNEL = 'notification.center';
    var EVENT_REFRESH = 'refreshList';
    var POPOVER_REFRESH_DELAY_MS = 250;
    var LOG_COMPONENT = 'notification.AppController';

    return Controller.extend('com.gsp26.sap17.notificationcenter.controller.App', {

        onInit: function () {
            this._oNotificationPopover = null;
            this._oMainMenu = null;
            this._iPopoverRefreshTimer = null;
            if (!this.byId('app')) {
                Log.error('Root container "app" not found in App view', null, LOG_COMPONENT);
            }
            if (!this.getOwnerComponent() || !this.getOwnerComponent().getRouter()) {
                Log.error('Router unavailable in App controller init', null, LOG_COMPONENT);
            }

            // Subscribe to WebSocket notification events
            this.getOwnerComponent().getEventBus().subscribe(
                'notification.websocket', 'newNotification',
                this._onWebSocketMessage, this
            );
        },

        _onWebSocketMessage: function (sChannel, sEvent, oData) {
            var oPayload = oData || {};
            var oComponent = this.getOwnerComponent();

            // Optimistically update badge, then reconcile async
            oComponent.incrementUnreadCount();
            oComponent.refreshUnreadCount();

            // Show toast with notification title
            if (oPayload.title) {
                MessageToast.show(oPayload.title);
            }

            // Refresh popover if it exists and is open
            if (this._oNotificationPopover && this._oNotificationPopover.isOpen()) {
                this._schedulePopoverRefresh();
            }

            // Notify list controller to refresh
            this.getOwnerComponent().getEventBus().publish(EVENT_CHANNEL, EVENT_REFRESH, {
                source: 'websocket',
                notificationId: oPayload.notificationId || ''
            });
        },

        onHomePress: function () {
            var oRouter = this.getOwnerComponent() && this.getOwnerComponent().getRouter();
            if (!oRouter) {
                Log.error('Cannot navigate to main: router unavailable', null, LOG_COMPONENT);
                return;
            }
            oRouter.navTo('main');
        },

        onSettingsPress: function () {
            var oRouter = this.getOwnerComponent() && this.getOwnerComponent().getRouter();
            if (!oRouter) {
                Log.error('Cannot navigate to settings: router unavailable', null, LOG_COMPONENT);
                return;
            }
            oRouter.navTo('settings');
        },

        onMenuPress: function (oEvent) {
            var oButton = oEvent.getParameter("button") || this.byId("shellBar");
            var oBundle = this.getView().getModel('i18n').getResourceBundle();
            var that = this;

            if (!this._oMainMenu) {
                this._oMainMenu = new Menu({
                    itemSelected: function (oEvt) {
                        var sKey = oEvt.getParameter('item').getKey();
                        if (sKey === 'main') {
                            that.getOwnerComponent().getRouter().navTo('main');
                        } else if (sKey === 'settings') {
                            that.getOwnerComponent().getRouter().navTo('settings');
                        }
                    },
                    items: [
                        new MenuItem({
                            key: 'main',
                            text: oBundle.getText('allNotifications'),
                            icon: 'sap-icon://list'
                        }),
                        new MenuItem({
                            key: 'settings',
                            text: oBundle.getText('notificationSettings'),
                            icon: 'sap-icon://action-settings'
                        })
                    ]
                });
                this.getView().addDependent(this._oMainMenu);
            }
            this._oMainMenu.openBy(oButton);
        },

        onNotificationPress: function (oEvent) {
            var oSource = oEvent.getParameter('button') || oEvent.getSource();
            var that = this;

            if (!this._oNotificationPopover) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: 'com.gsp26.sap17.notificationcenter.fragment.NotificationPopover',
                    controller: this
                }).then(function (oPopover) {
                    that._oNotificationPopover = oPopover;
                    that.getView().addDependent(oPopover);
                    that._bindPopoverList();
                    oPopover.openBy(oSource);
                }).catch(function (oError) {
                    Log.error('Failed to load NotificationPopover fragment: ' + oError.message, null, LOG_COMPONENT);
                    MessageBox.error('Cannot open notification popover right now.');
                });
            } else {
                this._schedulePopoverRefresh();
                this._oNotificationPopover.openBy(oSource);
            }
        },

        _schedulePopoverRefresh: function () {
            var that = this;

            if (this._iPopoverRefreshTimer) {
                return;
            }

            this._iPopoverRefreshTimer = setTimeout(function () {
                that._iPopoverRefreshTimer = null;
                that._refreshPopoverData();
            }, POPOVER_REFRESH_DELAY_MS);
        },

        _bindPopoverList: function () {
            var oList = Fragment.byId(this.getView().getId(), 'popoverNotificationList');
            if (oList) {
                oList.bindItems({
                    path: '/Recipient',
                    sorter: new Sorter('_Notification/SentAt', true),
                    filters: [
                        new Filter('IsArchived', FilterOperator.EQ, false),
                        new Filter('IsDeleted', FilterOperator.EQ, false)
                    ],
                    template: this._getNotificationItemTemplate()
                });
            }
        },

        _getNotificationItemTemplate: function () {
            var that = this;
            var oBundle = this.getView().getModel('i18n').getResourceBundle();
            return new NotificationListItem({
                title: '{_Notification/Title}',
                description: { path: '_Notification/Body', formatter: Formatter.formatPlainBody },
                authorName: {
                    path: '_Notification/Priority',
                    formatter: function (vPriority) {
                        var sPriority = Formatter.formatPriorityText(vPriority, oBundle);
                        return sPriority ? (oBundle.getText('priorityLabel') + ': ' + sPriority) : '';
                    }
                },
                unread: '{= !${IsRead}}',
                showButtons: false,
                hideShowMoreButton: true,
                showCloseButton: false,
                press: that.onNotificationItemPress.bind(that)
            });
        },

        _refreshPopoverData: function () {
            var oList = Fragment.byId(this.getView().getId(), 'popoverNotificationList');
            if (oList) {
                var oBinding = oList.getBinding('items');
                if (oBinding) { oBinding.refresh(); }
            }
        },

        onNotificationItemPress: function (oEvent) {
            var oItem = oEvent.getSource();
            var oCtx = oItem.getBindingContext();
            var bIsUnread;

            if (!oCtx) { return; }

            bIsUnread = !oCtx.getProperty('IsRead');

            if (bIsUnread) {
                this._markAsReadThenNavigate(oCtx, true);
                return;
            }

            this._navigateToDetail(oCtx, false);
        },

        _markAsReadThenNavigate: function (oCtx, bFromPopover) {
            var that = this;
            var sNotificationId;

            if (!oCtx) { return; }

            sNotificationId = oCtx.getProperty('NotificationId');

            ActionHelper.executeAction(oCtx.getModel(), sNotificationId, 'MarkAsRead')
                .then(function () {
                    that.getOwnerComponent().decrementUnreadCount();
                    that.getOwnerComponent().getEventBus().publish(EVENT_CHANNEL, EVENT_REFRESH, {
                        source: 'action',
                        type: 'notification_read',
                        notificationId: sNotificationId
                    });
                    that._navigateToDetail(oCtx, bFromPopover);
                }).catch(function (oError) {
                    Log.error('Failed to mark as read: ' + oError.message);
                    that._navigateToDetail(oCtx, bFromPopover);
                });
        },

        _navigateToDetail: function (oCtx, bPreMarked) {
            var sRecipientId;
            var sNotificationId;

            if (!oCtx) { return; }

            sRecipientId = oCtx.getProperty('UserId');
            sNotificationId = oCtx.getProperty('NotificationId');

            if (this._oNotificationPopover) { this._oNotificationPopover.close(); }

            // Popover always shows unread notifications, so pass tab=unread
            this.getOwnerComponent().getRouter().navTo('detail', {
                notificationId: sNotificationId,
                recipientId: sRecipientId,
                '?query': {
                    tab: 'unread',
                    preMarked: bPreMarked ? '1' : '0',
                    search: '',
                    priority: 'all',
                    category: 'all'
                }
            });
        },

        onMarkAllAsRead: function () {
            var oModel = this.getView().getModel();
            var that = this;

            ActionHelper.executeCollectionAction(oModel, 'MarkAllAsRead')
                .then(function () {
                    MessageToast.show(that.getView().getModel('i18n').getResourceBundle().getText('markAllRead'));
                    that.getOwnerComponent().refreshUnreadCount();
                    that._schedulePopoverRefresh();
                    that.getOwnerComponent().getEventBus().publish(EVENT_CHANNEL, EVENT_REFRESH, {
                        source: 'action',
                        notificationId: ''
                    });
                }).catch(function (oError) {
                    MessageBox.error('Failed to mark all as read: ' + oError.message);
                });
        },

        onExit: function () {
            this.getOwnerComponent().getEventBus().unsubscribe(
                'notification.websocket', 'newNotification',
                this._onWebSocketMessage, this
            );
            if (this._iPopoverRefreshTimer) {
                clearTimeout(this._iPopoverRefreshTimer);
                this._iPopoverRefreshTimer = null;
            }
            if (this._oNotificationPopover) { this._oNotificationPopover.destroy(); }
            if (this._oMainMenu) { this._oMainMenu.destroy(); }
        }
    });
});
