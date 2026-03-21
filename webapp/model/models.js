/**
 * models.js
 *
 * Model factory functions for Notification Center
 */
sap.ui.define([
    'sap/ui/model/json/JSONModel',
    'sap/ui/Device'
], function (JSONModel, Device) {
    'use strict';

    return {
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode('OneWay');
            return oModel;
        },

        createAppModel: function () {
            return new JSONModel({
                UnreadCount: 0,
                busy: false,
                lastRefresh: null
            });
        }
    };
});
