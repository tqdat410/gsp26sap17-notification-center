/**
 * SettingsUtil.js
 *
 * Utility for the Notification Settings page:
 * - Mapping OData Setting entities (which include CategoryName, CategoryDesc, DefaultEnabled from CDS JOIN)
 * - Tracking dirty state via _original snapshots
 * - Saving changed settings via OData V4 POST (upsert)
 * - Resetting to default values
 */
sap.ui.define([
    'sap/base/Log'
], function (Log) {
    'use strict';

    return {

        /**
         * Maps Setting OData contexts to local model objects.
         * The Setting entity already includes CategoryName, CategoryDesc, DefaultEnabled
         * from the CDS JOIN-based view (Z17_I_SETTING).
         * Each item includes an _original snapshot for dirty-checking.
         *
         * @param {sap.ui.model.odata.v4.Context[]} aSettingContexts - from GET /Setting
         * @returns {Object[]} category setting objects
         */
        mapSettings: function (aSettingContexts) {
            return aSettingContexts.map(function (oCtx) {
                var sCode = oCtx.getProperty('CategoryCode');
                var bObligatory = oCtx.getProperty('Obligatory') === true;
                var bDefaultEnabled = oCtx.getProperty('DefaultEnabled') === true;
                var bIsEnabled = oCtx.getProperty('IsEnabled') === true;
                var sEmailEnabled = oCtx.getProperty('EmailEnabled');
                var bEmailEnabled = sEmailEnabled === true || sEmailEnabled === 'true';
                var sCategoryName = oCtx.getProperty('CategoryName') || sCode;
                var sCategoryDesc = oCtx.getProperty('CategoryDesc') || '';

                // Obligatory categories: in-app is always forced ON, email is still free
                if (bObligatory) {
                    bIsEnabled = true;
                }

                return {
                    categoryCode: sCode,
                    categoryName: sCategoryName,
                    categoryDesc: sCategoryDesc,
                    obligatory: bObligatory,
                    defaultEnabled: bDefaultEnabled,
                    isEnabled: bIsEnabled,
                    emailEnabled: bEmailEnabled,
                    _original: {
                        isEnabled: bIsEnabled,
                        emailEnabled: bEmailEnabled
                    }
                };
            });
        },

        /**
         * Returns items where current values differ from _original.
         *
         * @param {Object[]} aCategories - full categories array
         * @returns {Object[]} changed items only
         */
        getChangedItems: function (aCategories) {
            return (aCategories || []).filter(function (oItem) {
                return oItem.isEnabled !== oItem._original.isEnabled ||
                       oItem.emailEnabled !== oItem._original.emailEnabled;
            });
        },

        /**
         * Saves changed settings via the bound action Upsert per category.
         * POST /Setting(CategoryCode='...')/com.sap.gateway.srvd.z17_sd_notification.v0001.Upsert
         * Backend decides create vs update automatically.
         *
         * @param {sap.ui.model.odata.v4.ODataModel} oODataModel
         * @param {Object[]} aChangedItems
         * @returns {Promise}
         */
        saveSettings: function (oODataModel, aChangedItems) {
            var sNamespace = 'com.sap.gateway.srvd.z17_sd_notification.v0001';
            var aPromises = aChangedItems.map(function (oItem) {
                var sCategoryCode = oItem.categoryCode;
                var sActionPath = '/Setting(CategoryCode=\'' + sCategoryCode + '\')/'
                    + sNamespace + '.Upsert(...)';

                var oActionBinding = oODataModel.bindContext(sActionPath);
                oActionBinding.setParameter('CategoryCode', sCategoryCode);
                oActionBinding.setParameter('IsEnabled', oItem.isEnabled);
                oActionBinding.setParameter('EmailEnabled', oItem.emailEnabled === true);

                return oActionBinding.execute('$auto').then(function () {
                    Log.debug('SettingsUtil: Upsert succeeded for ' + sCategoryCode);
                }).catch(function (oError) {
                    Log.error('SettingsUtil: Upsert failed for ' + sCategoryCode + ' - ' + oError.message);
                    throw oError;
                });
            });
            return Promise.all(aPromises);
        },

        /**
         * Updates _original snapshots after a successful save.
         *
         * @param {Object[]} aCategories - mutated in place
         */
        commitOriginals: function (aCategories) {
            (aCategories || []).forEach(function (oItem) {
                oItem._original = {
                    isEnabled: oItem.isEnabled,
                    emailEnabled: oItem.emailEnabled
                };
            });
        },

        /**
         * Resets all settings to default via a single static action ResetToDefault.
         * The backend deletes all user setting records in one DELETE statement.
         *
         * @param {sap.ui.model.odata.v4.ODataModel} oODataModel
         * @returns {Promise}
         */
        // resetToDefaultViaAction: function (oODataModel) {
        //     var sNamespace = 'com.sap.gateway.srvd.z17_sd_notification.v0001';
        //     var sActionPath = '/Setting/' + sNamespace + '.ResetToDefault(...)';
        //     var oActionBinding = oODataModel.bindContext(sActionPath);
        //     return oActionBinding.execute('$auto').then(function () {
        //         Log.debug('SettingsUtil: ResetToDefault succeeded');
        //     }).catch(function (oError) {
        //         Log.error('SettingsUtil: ResetToDefault failed - ' + oError.message);
        //         throw oError;
        //     });
        // },

        /**
         * Fetches default settings from the Z17_C_SETTING_DEFAULT view.
         * Returns default values for each category (IsEnabled = DefaultEnabled, EmailEnabled = '').
         *
         * @param {sap.ui.model.odata.v4.ODataModel} oODataModel
         * @returns {Promise<Object[]>} array of {categoryCode, isEnabled, emailEnabled}
         */
        getDefaultSettings: function (oODataModel) {
            var oBinding = oODataModel.bindList('/SettingDefault');
            return oBinding.requestContexts(0, 500).then(function (aContexts) {
                return aContexts.map(function (oCtx) {
                    return {
                        categoryCode: oCtx.getProperty('CategoryCode'),
                        isEnabled: oCtx.getProperty('IsEnabled'),
                        emailEnabled: oCtx.getProperty('EmailEnabled')
                    };
                });
            });
        }
    };
});
