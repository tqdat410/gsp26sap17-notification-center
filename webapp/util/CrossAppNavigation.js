/**
 * CrossAppNavigation.js
 *
 * Cross-application navigation helper for SAP Fiori Launchpad
 * Handles navigation to source objects (e.g., Leave Request)
 */
sap.ui.define([
    'sap/m/MessageToast',
    'sap/m/MessageBox'
], function (MessageToast, MessageBox) {
    'use strict';

    return {
        navigateWithAction: function (sSematicObject, sSematicAction, oParams) {
            var oContainer;
            var oCrossAppNav;
            var oService;

            oContainer = sap.ushell && sap.ushell.Container;
            if (!oContainer) {
                MessageToast.show('Navigate: ' + sSematicObject + '#' + sSematicAction);
                return;
            }

            try {
                if (typeof oContainer.getServiceAsync === 'function') {
                    oCrossAppNav = oContainer.getServiceAsync('CrossApplicationNavigation');
                } else if (typeof oContainer.getService === 'function') {
                    oService = oContainer.getService('CrossApplicationNavigation');
                    oCrossAppNav = Promise.resolve(oService);
                }
            } catch (e) {
                MessageToast.show('Navigate: ' + sSematicObject + '#' + sSematicAction);
                return;
            }
            if (oCrossAppNav) {
                oCrossAppNav.then(function (oService) {
                    if (!oService) {
                        MessageBox.error('Navigation service is not available.');
                        return;
                    }
                    oService.toExternal({
                        target: { semanticObject: sSematicObject, action: sSematicAction },
                        params: oParams || {}
                    });
                }).catch(function (oError) {
                    MessageBox.error('Navigation failed: ' + (oError && oError.message ? oError.message : String(oError)));
                });
            } else {
                MessageToast.show('Navigate: ' + sSematicObject + '#' + sSematicAction);
            }
        }
    };
});
