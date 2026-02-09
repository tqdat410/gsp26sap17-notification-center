sap.ui.define(function () {
	"use strict";

	return {
		name: "QUnit test suite for com.gsp26.sap17.notificationcenter",
		defaults: {
			page: "ui5://test-resources/com/gsp26/sap17/notificationcenter/test/{name}.qunit.html",
			qunit: {
				version: 2
			},
			sinon: {
				version: 4
			},
			ui5: {
				language: "EN",
				theme: "sap_horizon"
			},
			loader: {
				paths: {
					"com/gsp26/sap17/notificationcenter": "../"
				}
			}
		},
		tests: {
			"unit/unitTests": {
				title: "Unit Tests for com.gsp26.sap17.notificationcenter"
			},
			"integration/opaTests": {
				title: "Integration Tests for com.gsp26.sap17.notificationcenter"
			}
		}
	};
});
