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
			markRead: "Mark as Read",
			markUnread: "Mark as Unread",
			markAllRead: "Mark All as Read",
			confirmDeleteSelected: "Are you sure you want to delete the selected notifications?",
			confirmDeleteAll: "Are you sure you want to delete all notifications?",
			confirmArchiveSelected: "Are you sure you want to archive the selected notifications?",
			confirmUnarchiveSelected: "Are you sure you want to unarchive the selected notifications?",
			confirmArchiveAll: "Are you sure you want to archive all notifications?",
			selectedNotificationsDeleted: "Selected notifications deleted.",
			allNotificationsDeleted: "All notifications deleted.",
			selectedNotificationsArchived: "Selected notifications archived.",
			selectedNotificationsUnarchived: "Selected notifications unarchived.",
			allNotificationsArchived: "All notifications archived.",
			selectedNotificationsMarkedRead: "Selected notifications marked as read.",
			selectedNotificationsMarkedUnread: "Selected notifications marked as unread.",
			allNotificationsMarkedRead: "All notifications marked as read.",
			allNotificationsMarkedUnread: "All notifications marked as unread."
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
			this.mViewProps = {
				archiveButtonText: that.oBundle.getText("archive")
			};
			this.oViewModel = {
				getProperty: function (sPath) {
					return that.mViewProps[sPath.replace(/^\//, "")];
				},
				setProperty: function (sPath, vValue) {
					that.mViewProps[sPath.replace(/^\//, "")] = vValue;
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
			assert.strictEqual(sMessage, "Are you sure you want to delete the selected notifications?", "selected delete confirmation text is used");
			mOptions.onClose(MessageBox.Action.OK);
		}));

		this.oController.onDeleteAction();

		return Promise.resolve().then(function () {
			assert.ok(oExecuteBatchActionStub.calledOnce, "selected delete action is executed after confirmation");
			assert.ok(oExecuteBatchActionStub.calledWith(this.oMainModel, aSelectedItems, "MarkAsDeleted"), "selected delete uses batch MarkAsDeleted");
			assert.ok(oExecuteCollectionActionStub.notCalled, "delete-all action is not used");
			assert.ok(this.oTable.removeSelections.calledOnceWithExactly(true), "table selection is cleared");
			assert.ok(oToastStub.calledOnceWithExactly("Selected notifications deleted."), "delete toast is shown");
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
			assert.strictEqual(sMessage, "Are you sure you want to delete the selected notifications?", "selected delete confirmation text is used");
			mOptions.onClose(MessageBox.Action.CANCEL);
		}));

		this.oController.onDeleteAction();

		assert.ok(oExecuteBatchActionStub.notCalled, "no delete action runs when confirmation is cancelled");
		assert.ok(oToastStub.notCalled, "no toast is shown");
		assert.notOk(this.bRefreshed, "list is not refreshed");
	});

	QUnit.test("confirms before deleting all notifications", function (assert) {
		this.oTable.getItems = function () {
			return [createItem("1000")];
		};

		var oExecuteCollectionActionStub = sinon.stub(ActionHelper, "executeCollectionAction").returns(Promise.resolve());
		var oToastStub = sinon.stub(MessageToast, "show");
		this.aStubs.push(oExecuteCollectionActionStub, oToastStub);

		this.aStubs.push(sinon.stub(MessageBox, "confirm").callsFake(function (sMessage, mOptions) {
			assert.strictEqual(sMessage, "Are you sure you want to delete all notifications?", "delete-all confirmation text is used");
			mOptions.onClose(MessageBox.Action.OK);
		}));

		this.oController.onDeleteAction();

		return Promise.resolve().then(function () {
			assert.ok(oExecuteCollectionActionStub.calledOnceWithExactly(this.oMainModel, "MarkAllAsDeleted"), "delete-all action is executed after confirmation");
			assert.ok(oToastStub.calledOnceWithExactly("All notifications deleted."), "delete-all toast is shown");
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
			assert.strictEqual(sMessage, "Are you sure you want to archive the selected notifications?", "archive confirmation text is used");
			mOptions.onClose(MessageBox.Action.OK);
		}));

		this.oController.onArchiveAction();

		return Promise.resolve().then(function () {
			assert.ok(oExecuteBatchActionStub.calledOnceWithExactly(this.oMainModel, aSelectedItems, "Archive"), "archive action runs after confirmation");
			assert.ok(this.oTable.removeSelections.calledOnceWithExactly(true), "table selection is cleared");
			assert.ok(oToastStub.calledOnceWithExactly("Selected notifications archived."), "archive toast is shown");
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
			assert.strictEqual(sMessage, "Are you sure you want to unarchive the selected notifications?", "unarchive confirmation text is used");
			mOptions.onClose(MessageBox.Action.OK);
		}));

		this.oController.onArchiveAction();

		return Promise.resolve().then(function () {
			assert.ok(oExecuteBatchActionStub.calledOnceWithExactly(this.oMainModel, aSelectedItems, "Unarchive"), "unarchive action runs after confirmation");
			assert.ok(this.oTable.removeSelections.calledOnceWithExactly(true), "table selection is cleared");
			assert.ok(oToastStub.calledOnceWithExactly("Selected notifications unarchived."), "unarchive toast is shown");
			assert.ok(this.bRefreshed, "list is refreshed");
		}.bind(this));
	});

	QUnit.test("confirms before archiving all notifications", function (assert) {
		var aItems = [createItem("1005"), createItem("1006")];

		this.oTable.getItems = function () {
			return aItems;
		};

		var oExecuteBatchActionStub = sinon.stub(ActionHelper, "executeBatchAction").returns(Promise.resolve());
		var oToastStub = sinon.stub(MessageToast, "show");
		this.aStubs.push(oExecuteBatchActionStub, oToastStub);

		this.aStubs.push(sinon.stub(MessageBox, "confirm").callsFake(function (sMessage, mOptions) {
			assert.strictEqual(sMessage, "Are you sure you want to archive all notifications?", "archive-all confirmation text is used");
			mOptions.onClose(MessageBox.Action.OK);
		}));

		this.oController.onArchiveAll();

		return Promise.resolve().then(function () {
			assert.ok(oExecuteBatchActionStub.calledOnceWithExactly(this.oMainModel, aItems, "Archive"), "archive-all action runs after confirmation");
			assert.ok(oToastStub.calledOnceWithExactly("All notifications archived."), "archive-all toast is shown");
			assert.ok(this.bRefreshed, "list is refreshed");
		}.bind(this));
	});

	QUnit.test("marks selected notifications as read and shows a clear toast", function (assert) {
		var aSelectedItems = [createItem("1007")];

		this.oViewModel.getProperty = function () {
			return "Mark as Read";
		};
		this.oTable.getSelectedItems = function () {
			return aSelectedItems;
		};

		var oExecuteBatchActionStub = sinon.stub(ActionHelper, "executeBatchAction").returns(Promise.resolve());
		var oToastStub = sinon.stub(MessageToast, "show");
		this.aStubs.push(oExecuteBatchActionStub, oToastStub);

		this.oController.onMarkReadAction();

		return Promise.resolve().then(function () {
			assert.ok(oExecuteBatchActionStub.calledOnceWithExactly(this.oMainModel, aSelectedItems, "MarkAsRead"), "selected items are marked as read");
			assert.ok(this.oTable.removeSelections.calledOnceWithExactly(true), "table selection is cleared");
			assert.ok(oToastStub.calledOnceWithExactly("Selected notifications marked as read."), "read toast is shown");
			assert.ok(this.bRefreshed, "list is refreshed");
		}.bind(this));
	});

	QUnit.test("marks all notifications as unread and shows a clear toast", function (assert) {
		this.oViewModel.getProperty = function () {
			return "Mark as Unread";
		};
		this.oTable.getItems = function () {
			return [createItem("1008")];
		};

		var oExecuteCollectionActionStub = sinon.stub(ActionHelper, "executeCollectionAction").returns(Promise.resolve());
		var oToastStub = sinon.stub(MessageToast, "show");
		this.aStubs.push(oExecuteCollectionActionStub, oToastStub);

		this.oController.onMarkReadAction();

		return Promise.resolve().then(function () {
			assert.ok(oExecuteCollectionActionStub.calledOnceWithExactly(this.oMainModel, "MarkAllAsUnread"), "all notifications are marked as unread");
			assert.ok(oToastStub.calledOnceWithExactly("All notifications marked as unread."), "unread toast is shown");
			assert.ok(this.bRefreshed, "list is refreshed");
		}.bind(this));
	});

	QUnit.test("tracks whether the current list has visible items", function (assert) {
		this.oController._updateToolbarButtons();

		assert.strictEqual(this.oViewModel.getProperty("/hasItems"), false, "empty table sets hasItems=false");

		this.oTable.getItems = function () {
			return [createItem("1010")];
		};

		this.oController._updateToolbarButtons();

		assert.strictEqual(this.oViewModel.getProperty("/hasItems"), true, "non-empty table sets hasItems=true");
	});

	QUnit.test("does nothing when delete is triggered with an empty list", function (assert) {
		var oExecuteCollectionActionStub = sinon.stub(ActionHelper, "executeCollectionAction");
		var oExecuteBatchActionStub = sinon.stub(ActionHelper, "executeBatchAction");
		var oConfirmStub = sinon.stub(MessageBox, "confirm");
		this.aStubs.push(oExecuteCollectionActionStub, oExecuteBatchActionStub, oConfirmStub);

		this.oController.onDeleteAction();

		assert.ok(oConfirmStub.notCalled, "no confirmation dialog is shown");
		assert.ok(oExecuteCollectionActionStub.notCalled, "no collection delete action is executed");
		assert.ok(oExecuteBatchActionStub.notCalled, "no batch delete action is executed");
		assert.notOk(this.bRefreshed, "list is not refreshed");
	});

	QUnit.test("does nothing when mark-read action is triggered with an empty list", function (assert) {
		var oExecuteCollectionActionStub = sinon.stub(ActionHelper, "executeCollectionAction");
		var oExecuteBatchActionStub = sinon.stub(ActionHelper, "executeBatchAction");
		this.aStubs.push(oExecuteCollectionActionStub, oExecuteBatchActionStub);

		this.oController.onMarkReadAction();

		assert.ok(oExecuteCollectionActionStub.notCalled, "no collection mark action is executed");
		assert.ok(oExecuteBatchActionStub.notCalled, "no batch mark action is executed");
		assert.notOk(this.bRefreshed, "list is not refreshed");
	});

	QUnit.test("does nothing when mark-all-as-read is triggered with an empty list", function (assert) {
		var oExecuteCollectionActionStub = sinon.stub(ActionHelper, "executeCollectionAction");
		this.aStubs.push(oExecuteCollectionActionStub);

		this.oController.onMarkAllAsRead();

		assert.ok(oExecuteCollectionActionStub.notCalled, "mark-all-as-read is skipped for an empty list");
		assert.notOk(this.bRefreshed, "list is not refreshed");
	});
});
