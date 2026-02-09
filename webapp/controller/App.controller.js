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
    'com/gsp26/sap17/notificationcenter/util/NotificationFormatter',
    'com/gsp26/sap17/notificationcenter/util/NotificationActionHelper'
], function (Controller, Fragment, Menu, MenuItem, Filter, FilterOperator, Sorter,
             MessageToast, MessageBox, NotificationListItem, Formatter, ActionHelper) {
    'use strict';

    var EVENT_CHANNEL = 'notification.center';
    var EVENT_REFRESH = 'refreshList';

    return Controller.extend('com.gsp26.sap17.notificationcenter.controller.App', {

        onInit: function () {
            this._oNotificationPopover = null;
            this._oMainMenu = null;
            this._startPolling();
        },

        _startPolling: function () {
            var that = this;
            this._pollInterval = setInterval(function () {
                that.getOwnerComponent().refreshUnreadCount();
            }, 60000);
        },

        onHomePress: function () {
            this.getOwnerComponent().getRouter().navTo('main');
        },

        onSettingsPress: function () {
            this.getOwnerComponent().getRouter().navTo('settings');
        },

        onMenuPress: function (oEvent) {
            var oButton = oEvent.getSource();
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
                });
            } else {
                this._refreshPopoverData();
                this._oNotificationPopover.openBy(oSource);
            }
        },

        _bindPopoverList: function () {
            var oList = Fragment.byId(this.getView().getId(), 'popoverNotificationList');
            if (oList) {
                oList.bindItems({
                    path: '/Recipient',
                    parameters: { $expand: '_Notification($expand=_Actions)' },
                    sorter: new Sorter('_Notification/CreatedAt', true),
                    filters: [new Filter('IsArchived', FilterOperator.EQ, false)],
                    template: this._getNotificationItemTemplate()
                });
            }
        },

        _getNotificationItemTemplate: function () {
            var that = this;
            return new NotificationListItem({
                title: '{_Notification/Title}',
                description: '{_Notification/Message}',
                datetime: { path: '_Notification/CreatedAt', formatter: Formatter.formatDateTime },
                unread: '{= !${IsRead}}',
                priority: { path: '_Notification/Priority', formatter: Formatter.formatPriority },
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
            var that = this;

            if (!oCtx) { return; }

            var sRecipientId = oCtx.getProperty('RecipientID');
            var sNotificationId = oCtx.getProperty('NotificationID');

            if (!oCtx.getProperty('IsRead')) {
                ActionHelper.executeAction(oCtx.getModel(), sNotificationId, 'MarkAsRead')
                    .then(function () {
                        that.getOwnerComponent().refreshUnreadCount();
                        that._refreshPopoverData();
                        that.getOwnerComponent().getEventBus().publish(EVENT_CHANNEL, EVENT_REFRESH);
                    }).catch(function (oError) {
                        jQuery.sap.log.error('Failed to mark as read: ' + oError.message);
                    });
            }

            if (this._oNotificationPopover) { this._oNotificationPopover.close(); }
            this.getOwnerComponent().getRouter().navTo('detail', {
                recipientId: sRecipientId,
                notificationId: sNotificationId
            });
        },

        onMarkAllAsRead: function () {
            var oModel = this.getView().getModel();
            var that = this;

            ActionHelper.executeCollectionAction(oModel, 'MarkAllAsRead')
                .then(function () {
                    MessageToast.show(that.getView().getModel('i18n').getResourceBundle().getText('markAllRead'));
                    that.getOwnerComponent().refreshUnreadCount();
                    that._refreshPopoverData();
                    that.getOwnerComponent().getEventBus().publish(EVENT_CHANNEL, EVENT_REFRESH);
                }).catch(function (oError) {
                    MessageBox.error('Failed to mark all as read: ' + oError.message);
                });
        },

        onExit: function () {
            if (this._pollInterval) { clearInterval(this._pollInterval); }
            if (this._oNotificationPopover) { this._oNotificationPopover.destroy(); }
            if (this._oMainMenu) { this._oMainMenu.destroy(); }
        }
    });
});
