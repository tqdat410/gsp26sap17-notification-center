/*global QUnit*/

sap.ui.define([
	"com/gsp26/sap17/notificationcenter/controller/NotificationList.controller"
], function (Controller) {
	"use strict";

	QUnit.module("NotificationList Controller");

	QUnit.test("I should test the NotificationList controller", function (assert) {
		assert.ok(Controller, "Controller module loaded");
	});

});
