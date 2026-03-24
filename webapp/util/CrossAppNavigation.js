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

    function getText(oBundle, sKey, aArgs, sFallback) {
        return oBundle ? oBundle.getText(sKey, aArgs || []) : sFallback;
    }

    return {
        navigateWithAction: function (sSematicObject, sSematicAction, oParams, oBundle) {
            var oContainer;
            var oCrossAppNav;
            var oService;

            oContainer = sap.ushell && sap.ushell.Container;
            if (!oContainer) {
                MessageToast.show(getText(oBundle, 'crossAppNavigationUnavailable', [], 'Cannot open the target application here.'));
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
                MessageToast.show(getText(oBundle, 'crossAppNavigationUnavailable', [], 'Cannot open the target application here.'));
                return;
            }
            if (oCrossAppNav) {
                oCrossAppNav.then(function (oService) {
                    if (!oService) {
                        MessageBox.error(getText(oBundle, 'navigationServiceUnavailable', [], 'Navigation service is not available.'));
                        return;
                    }
                    oService.toExternal({
                        target: { semanticObject: sSematicObject, action: sSematicAction },
                        params: oParams || {}
                    });
                }).catch(function (oError) {
                    MessageBox.error(getText(oBundle, 'navigationFailed', [oError && oError.message ? oError.message : String(oError)], 'Navigation failed.'));
                });
            } else {
                MessageToast.show(getText(oBundle, 'crossAppNavigationUnavailable', [], 'Cannot open the target application here.'));
            }
        }
    };
});
