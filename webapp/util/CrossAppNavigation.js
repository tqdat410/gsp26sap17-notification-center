/**
 * CrossAppNavigation.js
 *
 * Cross-application navigation helper for SAP Fiori Launchpad
 * Handles navigation to source objects (e.g., Leave Request)
 */
sap.ui.define([
    'sap/m/MessageToast',
    'sap/ushell/Container'
], function (MessageToast, Container) {
    'use strict';

    return {
        navigateToSource: function (sObject, sKey) {
            var oCrossAppNav = Container && Container.getServiceAsync('CrossApplicationNavigation');

            if (oCrossAppNav) {
                oCrossAppNav.then(function (oService) {
                    switch (sObject) {
                        case 'LEAVE_REQUEST':
                            oService.toExternal({
                                target: { semanticObject: 'Y17LeaveRequest', action: 'display' },
                                params: { RequestId: sKey }
                            });
                            break;
                        default:
                            MessageToast.show('Navigate to: ' + sObject + ' - ' + sKey);
                    }
                });
            } else {
                MessageToast.show('Source: ' + sObject + ' - ' + sKey);
            }
        }
    };
});
