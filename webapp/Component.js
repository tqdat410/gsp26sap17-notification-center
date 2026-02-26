/**
 * Component.js
 *
 * Notification Center application component
 * - Initializes device and app models
 * - Loads initial unread count for bell badge
 * - Provides refreshUnreadCount method for controllers
 */
sap.ui.define([
    'sap/ui/core/UIComponent',
    'sap/ui/Device',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/base/Log',
    'com/gsp26/sap17/notificationcenter/util/WebSocketManager'
], function (UIComponent, Device, JSONModel, Filter, FilterOperator, Log, WebSocketManager) {
    'use strict';
    var LOG_COMPONENT = 'notification.Component';

    return UIComponent.extend('com.gsp26.sap17.notificationcenter.Component', {
        metadata: {
            manifest: 'json'
        },

        init: function () {
            Log.info('Component init start', null, LOG_COMPONENT);
            UIComponent.prototype.init.apply(this, arguments);
            this._iUnreadRefreshTimer = null;
            this._bUnreadRefreshInFlight = false;
            this._bUnreadRefreshPending = false;

            var oDeviceModel = new JSONModel(Device);
            oDeviceModel.setDefaultBindingMode('OneWay');
            this.setModel(oDeviceModel, 'device');

            var oAppModel = new JSONModel({
                UnreadCount: 0,
                busy: false,
                lastRefresh: null,
                deletedNotificationId: null,
                navigationContext: {
                    notifications: [],
                    currentIndex: -1
                }
            });
            this.setModel(oAppModel, 'app');

            if (this.getRouter()) {
                this.getRouter().initialize();
                Log.info('Router initialized', null, LOG_COMPONENT);
            } else {
                Log.error('Router unavailable during component init', null, LOG_COMPONENT);
            }
            this._loadUnreadCount();
            this._loadCategoryValueHelp();

            // Connect APC WebSocket for real-time notifications (auto-skips on localhost)
            WebSocketManager.connect(this.getEventBus());
            Log.info('Component init completed', null, LOG_COMPONENT);
        },

        _loadUnreadCount: function () {
            var oModel = this.getModel();
            var oAppModel = this.getModel('app');
            var that = this;

            if (!oModel) {
                Log.warning('Default model unavailable while loading unread count', null, LOG_COMPONENT);
                return;
            }

            if (this._bUnreadRefreshInFlight) {
                this._bUnreadRefreshPending = true;
                return;
            }

            this._bUnreadRefreshInFlight = true;

            var oListBinding = oModel.bindList('/Recipient', null, null, [
                new Filter({ path: 'IsRead', operator: FilterOperator.EQ, value1: false }),
                new Filter({ path: 'IsArchived', operator: FilterOperator.EQ, value1: false })
            ], { $count: true });

            oListBinding.requestContexts(0, 1).then(function () {
                var iCount = oListBinding.getCount();
                oAppModel.setProperty('/UnreadCount', iCount || 0);
                oAppModel.setProperty('/lastRefresh', new Date());
            }).catch(function (oError) {
                Log.error('Error loading unread count: ' + oError.message);
                oAppModel.setProperty('/UnreadCount', 0);
            }).finally(function () {
                that._bUnreadRefreshInFlight = false;
                if (that._bUnreadRefreshPending) {
                    that._bUnreadRefreshPending = false;
                    that._loadUnreadCount();
                }
            });
        },

        _loadCategoryValueHelp: function () {
            var oModel = this.getModel();
            var that = this;
            if (!oModel) {
                Log.warning('Default model unavailable while loading category value help', null, LOG_COMPONENT);
                return;
            }

            // Set empty model immediately so bindings don't fail before data loads
            this.setModel(new JSONModel({ items: [], map: {} }), 'categoryVH');

            var oListBinding = oModel.bindList('/CategoryValueHelp');
            oListBinding.requestContexts(0, 100).then(function (aContexts) {
                var oBundle = that.getModel('i18n').getResourceBundle();
                var aItems = [{ key: 'all', text: oBundle.getText('allCategories') }];
                var oMap = {};
                aContexts.forEach(function (oCtx) {
                    var sCode = oCtx.getProperty('CategoryCode');
                    var sName = oCtx.getProperty('CategoryName');
                    aItems.push({ key: sCode, text: sName });
                    oMap[sCode] = sName;
                });
                that.getModel('categoryVH').setData({ items: aItems, map: oMap });
            }).catch(function (oError) {
                Log.error('Error loading CategoryValueHelp: ' + oError.message);
            });
        },

        refreshUnreadCount: function (bImmediate) {
            var that = this;

            if (bImmediate === true) {
                if (this._iUnreadRefreshTimer) {
                    clearTimeout(this._iUnreadRefreshTimer);
                    this._iUnreadRefreshTimer = null;
                }
                this._loadUnreadCount();
                return;
            }

            if (this._iUnreadRefreshTimer) {
                return;
            }

            this._iUnreadRefreshTimer = setTimeout(function () {
                that._iUnreadRefreshTimer = null;
                that._loadUnreadCount();
            }, 500);
        },

        adjustUnreadCount: function (iDelta) {
            var oAppModel = this.getModel('app');
            var iCurrent;
            var iNext;

            if (!oAppModel || !iDelta) {
                return;
            }

            iCurrent = parseInt(oAppModel.getProperty('/UnreadCount'), 10);
            if (isNaN(iCurrent)) {
                iCurrent = 0;
            }

            iNext = iCurrent + iDelta;
            if (iNext < 0) {
                iNext = 0;
            }

            oAppModel.setProperty('/UnreadCount', iNext);
        },

        decrementUnreadCount: function () {
            this.adjustUnreadCount(-1);
        },

        incrementUnreadCount: function () {
            this.adjustUnreadCount(1);
        },

        destroy: function () {
            if (this._iUnreadRefreshTimer) {
                clearTimeout(this._iUnreadRefreshTimer);
                this._iUnreadRefreshTimer = null;
            }
            WebSocketManager.disconnect();
            UIComponent.prototype.destroy.apply(this, arguments);
        }
    });
});
