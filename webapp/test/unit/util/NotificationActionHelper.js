/*global QUnit, sinon*/

sap.ui.define([
    "com/gsp26/sap17/notificationcenter/util/NotificationActionHelper"
], function (ActionHelper) {
    "use strict";

    function createItem(sNotificationId) {
        return {
            getBindingContext: function () {
                return {
                    getProperty: function (sPath) {
                        return sPath === "NotificationId" ? sNotificationId : null;
                    }
                };
            }
        };
    }

    QUnit.module("NotificationActionHelper");

    QUnit.test("queues selected item actions into one OData V4 batch group", function (assert) {
        var aExecutions = [];
        var oModel = {
            bindContext: sinon.stub().callsFake(function (sPath) {
                return {
                    execute: function (sGroupId) {
                        aExecutions.push({
                            path: sPath,
                            groupId: sGroupId
                        });
                        return Promise.resolve();
                    }
                };
            }),
            submitBatch: sinon.stub().returns(Promise.resolve())
        };

        return ActionHelper.executeBatchAction(oModel, [
            createItem("1001"),
            createItem("1002")
        ], "MarkAsRead").then(function () {
            assert.strictEqual(oModel.bindContext.callCount, 2, "one operation binding is created per selected item");
            assert.strictEqual(oModel.submitBatch.callCount, 1, "all queued operations are submitted once");
            assert.strictEqual(aExecutions.length, 2, "both selected items are queued");
            assert.ok(aExecutions[0].groupId.indexOf("notificationBulkActions") === 0, "a dedicated bulk group id is used");
            assert.strictEqual(aExecutions[1].groupId, aExecutions[0].groupId, "all selected items share the same batch group");
            assert.strictEqual(oModel.submitBatch.firstCall.args[0], aExecutions[0].groupId, "the same group is submitted");
        });
    });

    QUnit.test("does not submit an empty batch", function (assert) {
        var oModel = {
            bindContext: sinon.stub(),
            submitBatch: sinon.stub()
        };

        return ActionHelper.executeBatchAction(oModel, [], "Archive").then(function (aResult) {
            assert.deepEqual(aResult, [], "empty selection resolves with an empty result");
            assert.ok(oModel.bindContext.notCalled, "no operation binding is created");
            assert.ok(oModel.submitBatch.notCalled, "no batch is submitted");
        });
    });
});
