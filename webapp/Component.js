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

    return UIComponent.extend('com.gsp26.sap17.notificationcenter.Component', {
        metadata: {
            manifest: 'json'
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            var oDeviceModel = new JSONModel(Device);
            oDeviceModel.setDefaultBindingMode('OneWay');
            this.setModel(oDeviceModel, 'device');

            var oAppModel = new JSONModel({
                UnreadCount: 0,
                busy: false,
                lastRefresh: null
            });
            this.setModel(oAppModel, 'app');

            this.getRouter().initialize();
            this._loadUnreadCount();
            this._loadCategoryValueHelp();

            // Connect WebSocket for real-time notifications
            // Pass backend URL for local dev (UI5 proxy can't forward WebSocket)
            var sBackendUrl = window.location.hostname === 'localhost' ? 'https://s40lp1.ucc.cit.tum.de' : null;
            WebSocketManager.connect(this.getEventBus(), sBackendUrl);
        },

        _loadUnreadCount: function () {
            var oModel = this.getModel();
            var oAppModel = this.getModel('app');

            if (!oModel) {
                return;
            }

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
            });
        },

        _loadCategoryValueHelp: function () {
            var oModel = this.getModel();
            var that = this;
            if (!oModel) { return; }

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

        refreshUnreadCount: function () {
            this._loadUnreadCount();
        },

        destroy: function () {
            WebSocketManager.disconnect();
            UIComponent.prototype.destroy.apply(this, arguments);
        }
    });
});
