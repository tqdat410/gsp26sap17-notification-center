sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/core/routing/History'
], function (Controller, History) {
    'use strict';
    return Controller.extend('com.gsp26.sap17.notificationcenter.controller.Settings', {
        onInit: function () {},
        onNavBack: function () {
            var oHistory = History.getInstance();
            if (oHistory.getPreviousHash() !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo('main', {}, true);
            }
        }
    });
});
