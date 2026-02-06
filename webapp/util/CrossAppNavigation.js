/**
 * CrossAppNavigation.js
 *
 * Cross-application navigation helper for SAP Fiori Launchpad
 * Handles navigation to source objects (e.g., Leave Request)
 */
sap.ui.define([
    'sap/m/MessageToast'
], function (MessageToast) {
    'use strict';

    return {
        navigateToSource: function (sObject, sKey) {
            var oCrossAppNav = sap.ushell && sap.ushell.Container &&
                sap.ushell.Container.getService('CrossApplicationNavigation');

            if (oCrossAppNav) {
                switch (sObject) {
                    case 'LEAVE_REQUEST':
                        oCrossAppNav.toExternal({
                            target: { semanticObject: 'Y17LeaveRequest', action: 'display' },
                            params: { RequestId: sKey }
                        });
                        break;
                    default:
                        MessageToast.show('Navigate to: ' + sObject + ' - ' + sKey);
                }
            } else {
                MessageToast.show('Source: ' + sObject + ' - ' + sKey);
            }
        }
    };
});
