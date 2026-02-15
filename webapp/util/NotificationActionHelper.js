/**
 * NotificationActionHelper.js
 *
 * OData V4 action execution helper for notification operations
 * - Single item actions (MarkAsRead, MarkAsDeleted, Archive, etc.)
 * - Batch actions on multiple items
 * - Collection actions (MarkAllAsRead, MarkAllAsDeleted)
 */
sap.ui.define([], function () {
    'use strict';

    var ACTION_PREFIX = 'com.sap.gateway.srvd.z17_sd_notification.v0001';

    return {
        buildActionPath: function (sNotificationId, sAction) {
            return '/Notification(NotificationId=' + sNotificationId + ')/' + ACTION_PREFIX + '.' + sAction + '(...)';
        },

        buildCollectionActionPath: function (sAction) {
            return '/Notification/' + ACTION_PREFIX + '.' + sAction + '(...)';
        },

        executeAction: function (oModel, sNotificationId, sAction) {
            var sPath = this.buildActionPath(sNotificationId, sAction);
            var oOperation = oModel.bindContext(sPath);
            return oOperation.execute();
        },

        executeBatchAction: function (oModel, aItems, sAction) {
            var aPromises = [];
            var that = this;
            aItems.forEach(function (oItem) {
                var oCtx = oItem.getBindingContext();
                if (oCtx) {
                    var sId = oCtx.getProperty('NotificationId');
                    if (sId) {
                        aPromises.push(that.executeAction(oModel, sId, sAction));
                    }
                }
            });
            return Promise.all(aPromises);
        },

        executeCollectionAction: function (oModel, sAction) {
            var sPath = this.buildCollectionActionPath(sAction);
            var oOperation = oModel.bindContext(sPath);
            return oOperation.execute();
        }
    };
});
