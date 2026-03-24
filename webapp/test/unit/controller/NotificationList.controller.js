/*global QUnit, sinon*/

sap.ui.define([
	"com/gsp26/sap17/notificationcenter/controller/NotificationList.controller",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"com/gsp26/sap17/notificationcenter/util/NotificationActionHelper"
], function (Controller, MessageBox, MessageToast, ActionHelper) {
	"use strict";

	function createBundle() {
		var mTexts = {
			archive: "Archive",
			unarchive: "Unarchive",
			delete: "Delete",
			deleteAll: "Delete All",
			confirmDeleteSelected: "Delete selected?",
			confirmDeleteAll: "Delete all?",
			confirmArchiveSelected: "Archive selected?",
			confirmUnarchiveSelected: "Unarchive selected?",
			confirmArchiveAll: "Archive all?"
		};

		return {
			getText: function (sKey) {
				return mTexts[sKey] || sKey;
			}
		};
	}

	function createItem(sNotificationId) {
		return {
			getBindingContext: function () {
				return {
					getProperty: function (sPath) {
						if (sPath === "NotificationId") {
							return sNotificationId;
						}
						return null;
					}
				};
			}
		};
	}

	QUnit.module("NotificationList Controller", {
		beforeEach: function () {
			var that = this;

			this.oController = new Controller();
			this.aStubs = [];
			this.oBundle = createBundle();
			this.oMainModel = {};
			this.oViewModel = {
				getProperty: function () {
					return that.oBundle.getText("archive");
				}
			};
			this.oTable = {
				getSelectedItems: function () {
					return [];
				},
				getItems: function () {
					return [];
				},
				removeSelections: sinon.spy()
			};
			this.bRefreshed = false;

			this.oController.byId = function () {
				return that.oTable;
			};
			this.oController.getView = function () {
				return {
					getModel: function (sName) {
						return sName === "view" ? that.oViewModel : that.oMainModel;
					}
				};
			};
			this.oController._getBundle = function () {
				return that.oBundle;
			};
			this.oController._refreshAfterAction = function () {
				that.bRefreshed = true;
			};
		},

		afterEach: function () {
			this.aStubs.forEach(function (oStub) {
				oStub.restore();
			});
		}
	});

	QUnit.test("confirms before deleting selected notifications", function (assert) {
		var aSelectedItems = [createItem("1001")];

		this.oTable.getSelectedItems = function () {
			return aSelectedItems;
		};

		var oExecuteBatchActionStub = sinon.stub(ActionHelper, "executeBatchAction").returns(Promise.resolve());
		var oExecuteCollectionActionStub = sinon.stub(ActionHelper, "executeCollectionAction");
		var oToastStub = sinon.stub(MessageToast, "show");
		this.aStubs.push(oExecuteBatchActionStub, oExecuteCollectionActionStub, oToastStub);

		this.aStubs.push(sinon.stub(MessageBox, "confirm").callsFake(function (sMessage, mOptions) {
			assert.strictEqual(sMessage, "Delete selected?", "selected delete confirmation text is used");
			mOptions.onClose(MessageBox.Action.OK);
		}));

		this.oController.onDeleteAction();

		return Promise.resolve().then(function () {
			assert.ok(oExecuteBatchActionStub.calledOnce, "selected delete action is executed after confirmation");
			assert.ok(oExecuteBatchActionStub.calledWith(this.oMainModel, aSelectedItems, "MarkAsDeleted"), "selected delete uses batch MarkAsDeleted");
			assert.ok(oExecuteCollectionActionStub.notCalled, "delete-all action is not used");
			assert.ok(this.oTable.removeSelections.calledOnceWithExactly(true), "table selection is cleared");
			assert.ok(oToastStub.calledOnceWithExactly("Delete"), "delete toast is shown");
			assert.ok(this.bRefreshed, "list is refreshed");
		}.bind(this));
	});

	QUnit.test("does nothing when selected delete is cancelled", function (assert) {
		this.oTable.getSelectedItems = function () {
			return [createItem("1002")];
		};

		var oExecuteBatchActionStub = sinon.stub(ActionHelper, "executeBatchAction");
		var oToastStub = sinon.stub(MessageToast, "show");
		this.aStubs.push(oExecuteBatchActionStub, oToastStub);

		this.aStubs.push(sinon.stub(MessageBox, "confirm").callsFake(function (sMessage, mOptions) {
			assert.strictEqual(sMessage, "Delete selected?", "selected delete confirmation text is used");
			mOptions.onClose(MessageBox.Action.CANCEL);
		}));

		this.oController.onDeleteAction();

		assert.ok(oExecuteBatchActionStub.notCalled, "no delete action runs when confirmation is cancelled");
		assert.ok(oToastStub.notCalled, "no toast is shown");
		assert.notOk(this.bRefreshed, "list is not refreshed");
	});

	QUnit.test("confirms before deleting all notifications", function (assert) {
		var oExecuteCollectionActionStub = sinon.stub(ActionHelper, "executeCollectionAction").returns(Promise.resolve());
		var oToastStub = sinon.stub(MessageToast, "show");
		this.aStubs.push(oExecuteCollectionActionStub, oToastStub);

		this.aStubs.push(sinon.stub(MessageBox, "confirm").callsFake(function (sMessage, mOptions) {
			assert.strictEqual(sMessage, "Delete all?", "delete-all confirmation text is used");
			mOptions.onClose(MessageBox.Action.OK);
		}));

		this.oController.onDeleteAction();

		return Promise.resolve().then(function () {
			assert.ok(oExecuteCollectionActionStub.calledOnceWithExactly(this.oMainModel, "MarkAllAsDeleted"), "delete-all action is executed after confirmation");
			assert.ok(oToastStub.calledOnceWithExactly("Delete All"), "delete-all toast is shown");
			assert.ok(this.bRefreshed, "list is refreshed");
		}.bind(this));
	});

	QUnit.test("confirms before archiving selected notifications", function (assert) {
		var aSelectedItems = [createItem("1003")];

		this.oTable.getSelectedItems = function () {
			return aSelectedItems;
		};

		var oExecuteBatchActionStub = sinon.stub(ActionHelper, "executeBatchAction").returns(Promise.resolve());
		var oToastStub = sinon.stub(MessageToast, "show");
		this.aStubs.push(oExecuteBatchActionStub, oToastStub);

		this.aStubs.push(sinon.stub(MessageBox, "confirm").callsFake(function (sMessage, mOptions) {
			assert.strictEqual(sMessage, "Archive selected?", "archive confirmation text is used");
			mOptions.onClose(MessageBox.Action.OK);
		}));

		this.oController.onArchiveAction();

		return Promise.resolve().then(function () {
			assert.ok(oExecuteBatchActionStub.calledOnceWithExactly(this.oMainModel, aSelectedItems, "Archive"), "archive action runs after confirmation");
			assert.ok(this.oTable.removeSelections.calledOnceWithExactly(true), "table selection is cleared");
			assert.ok(oToastStub.calledOnceWithExactly("Archive"), "archive toast is shown");
			assert.ok(this.bRefreshed, "list is refreshed");
		}.bind(this));
	});

	QUnit.test("confirms before unarchiving selected notifications", function (assert) {
		var aSelectedItems = [createItem("1004")];

		this.oViewModel.getProperty = function () {
			return "Unarchive";
		};
		this.oTable.getSelectedItems = function () {
			return aSelectedItems;
		};

		var oExecuteBatchActionStub = sinon.stub(ActionHelper, "executeBatchAction").returns(Promise.resolve());
		var oToastStub = sinon.stub(MessageToast, "show");
		this.aStubs.push(oExecuteBatchActionStub, oToastStub);

		this.aStubs.push(sinon.stub(MessageBox, "confirm").callsFake(function (sMessage, mOptions) {
			assert.strictEqual(sMessage, "Unarchive selected?", "unarchive confirmation text is used");
			mOptions.onClose(MessageBox.Action.OK);
		}));

		this.oController.onArchiveAction();

		return Promise.resolve().then(function () {
			assert.ok(oExecuteBatchActionStub.calledOnceWithExactly(this.oMainModel, aSelectedItems, "Unarchive"), "unarchive action runs after confirmation");
			assert.ok(this.oTable.removeSelections.calledOnceWithExactly(true), "table selection is cleared");
			assert.ok(oToastStub.calledOnceWithExactly("Unarchive"), "unarchive toast is shown");
			assert.ok(this.bRefreshed, "list is refreshed");
		}.bind(this));
	});

	QUnit.test("confirms before archiving all notifications", function (assert) {
		var aItems = [createItem("1005"), createItem("1006")];

		this.oTable.getItems = function () {
			return aItems;
		};

		var oExecuteBatchActionStub = sinon.stub(ActionHelper, "executeBatchAction").returns(Promise.resolve());
		this.aStubs.push(oExecuteBatchActionStub);

		this.aStubs.push(sinon.stub(MessageBox, "confirm").callsFake(function (sMessage, mOptions) {
			assert.strictEqual(sMessage, "Archive all?", "archive-all confirmation text is used");
			mOptions.onClose(MessageBox.Action.OK);
		}));

		this.oController.onArchiveAll();

		return Promise.resolve().then(function () {
			assert.ok(oExecuteBatchActionStub.calledOnceWithExactly(this.oMainModel, aItems, "Archive"), "archive-all action runs after confirmation");
			assert.ok(this.bRefreshed, "list is refreshed");
		}.bind(this));
	});
});
