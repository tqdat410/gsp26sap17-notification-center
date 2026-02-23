/**
 * CrossAppNavigation.js
 *
 * Cross-application navigation helper for SAP Fiori Launchpad
 * Handles navigation to source objects (e.g., Leave Request)
 */
sap.ui.define([
    'sap/m/MessageToast',
    'sap/m/MessageBox',
    'sap/ushell/Container'
], function (MessageToast, MessageBox, Container) {
    'use strict';

    return {
        navigateWithAction: function (sSematicObject, sSematicAction, oParams) {
            var oCrossAppNav;
            try {
                oCrossAppNav = Container && Container.getServiceAsync('CrossApplicationNavigation');
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
