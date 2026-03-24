sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/core/routing/History',
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageToast',
    'sap/m/MessageBox',
    'sap/base/Log',
    'com/gsp26/sap17/notificationcenter/util/SettingsUtil'
], function (Controller, History, JSONModel, MessageToast, MessageBox, Log, SettingsUtil) {
    'use strict';

    return Controller.extend('com.gsp26.sap17.notificationcenter.controller.Settings', {

        onInit: function () {
            var oSettingsModel = new JSONModel({
                masterEnabled: true,
                isDirty: false,
                busy: false,
                categories: []
            });
            this.getView().setModel(oSettingsModel, 'settingsModel');

            this._aAllCategories = null;
            this._sSearchQuery = '';
            this._sStatusFilter = 'all';
            this._sRequiredFilter = 'all';

            this.getOwnerComponent()
                .getRouter()
                .getRoute('settings')
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            var oModel = this.getView().getModel('settingsModel');
            oModel.setProperty('/masterEnabled', true);
            oModel.setProperty('/isDirty', false);
            this._aAllCategories = null;
            this._sSearchQuery = '';
            this._sStatusFilter = 'all';
            this._sRequiredFilter = 'all';
            this._loadSettings();
        },

        _loadSettings: function () {
            var oModel = this.getView().getModel('settingsModel');
            var oODataModel = this.getView().getModel();
            var that = this;

            if (!oODataModel) {
                Log.error('Settings: OData model not available');
                return;
            }

            oModel.setProperty('/busy', true);

            var oSettingBinding = oODataModel.bindList('/Setting');

            oSettingBinding.requestContexts(0, 500).then(function (aSettingContexts) {
                var aCategories = SettingsUtil.mapSettings(aSettingContexts);

                that._aAllCategories = aCategories;
                oModel.setProperty('/categories', aCategories.slice());
                oModel.setProperty('/busy', false);
            }).catch(function (oError) {
                Log.error('Settings: Failed to load - ' + oError.message);
                oModel.setProperty('/busy', false);
                MessageBox.error(that._getBundle().getText('loadError'));
            });
        },

        onSwitchMasterChange: function () {
            this._checkDirty();
        },

        onSearchFieldCategoryLiveChange: function (oEvent) {
            this._sSearchQuery = (oEvent.getParameter('newValue') || '').toLowerCase();
            this._applyFilters();
        },

        onFilterChange: function (oEvent) {
            var oSource = oEvent.getSource();
            var sKey = oEvent.getParameter('selectedItem').getKey();

            if (oSource.getId().includes('StatusFilter')) {
                this._sStatusFilter = sKey;
            } else if (oSource.getId().includes('RequiredFilter')) {
                this._sRequiredFilter = sKey;
            }

            this._applyFilters();
        },

        _applyFilters: function () {
            var oModel = this.getView().getModel('settingsModel');
            var aAll = this._aAllCategories || [];
            var sSearch = this._sSearchQuery || '';
            var sStatus = this._sStatusFilter || 'all';
            var sRequired = this._sRequiredFilter || 'all';

            var aFiltered = aAll.filter(function (oItem) {
                var bMatchSearch = true;
                if (sSearch) {
                    var sName = (oItem.categoryName || '').toLowerCase();
                    var sDesc = (oItem.categoryDesc || '').toLowerCase();
                    bMatchSearch = sName.indexOf(sSearch) !== -1 || sDesc.indexOf(sSearch) !== -1;
                }

                var bMatchStatus = true;
                if (sStatus === 'enabled') {
                    bMatchStatus = oItem.isEnabled === true || oItem.emailEnabled === true;
                } else if (sStatus === 'disabled') {
                    bMatchStatus = oItem.isEnabled === false && oItem.emailEnabled === false;
                }

                var bMatchRequired = true;
                if (sRequired === 'required') {
                    bMatchRequired = oItem.obligatory === true;
                } else if (sRequired === 'optional') {
                    bMatchRequired = oItem.obligatory === false;
                }

                return bMatchSearch && bMatchStatus && bMatchRequired;
            });

            oModel.setProperty('/categories', aFiltered);
        },

        onSwitchInAppChange: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext('settingsModel');
            var sPath = oCtx.getPath();
            var bState = oEvent.getParameter('state');
            var oModel = this.getView().getModel('settingsModel');

            oModel.setProperty(sPath + '/isEnabled', bState);

            if (!bState) {
                oModel.setProperty(sPath + '/emailEnabled', false);
            }

            this._checkDirty();
        },

        onSwitchEmailChange: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext('settingsModel');
            var sPath = oCtx.getPath();
            var bState = oEvent.getParameter('state');
            var oModel = this.getView().getModel('settingsModel');

            oModel.setProperty(sPath + '/emailEnabled', bState);
            this._checkDirty();
        },

        onSave: function () {
            this._saveSettings();
        },

        onCancel: function () {
            var oModel = this.getView().getModel('settingsModel');
            if (oModel.getProperty('/isDirty')) {
                var that = this;
                MessageBox.confirm(this._getBundle().getText('confirmCancelDirty'), {
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            that.onButtonNavBackPress();
                        }
                    }
                });
            } else {
                this.onButtonNavBackPress();
            }
        },

        // onResetToDefault: function () {
        //     var that = this;
        //     var aCategories = this._aAllCategories;

        //     if (!aCategories) return;

        //     var aNonDefault = aCategories.filter(function (oItem) {
        //         return oItem.isEnabled !== oItem.defaultEnabled || oItem.emailEnabled !== false;
        //     });

        //     if (aNonDefault.length === 0) {
        //         MessageToast.show(this._getBundle().getText('alreadyDefault'));
        //         return;
        //     }

        //     MessageBox.confirm(this._getBundle().getText('confirmResetDefault'), {
        //         onClose: function (sAction) {
        //             if (sAction === MessageBox.Action.OK) {
        //                 var oModel = that.getView().getModel('settingsModel');
        //                 var oODataModel = that.getView().getModel();

        //                 oModel.setProperty('/busy', true);
        //                 SettingsUtil.resetToDefaultViaAction(oODataModel)
        //                     .then(function () {
        //                         oModel.setProperty('/isDirty', false);
        //                         oModel.setProperty('/busy', false);
        //                         MessageToast.show(that._getBundle().getText('settingsSaved'));
        //                         that._loadSettings();
        //                     })
        //                     .catch(function (oError) {
        //                         oModel.setProperty('/busy', false);
        //                         Log.error('Settings: Reset to default failed - ' + oError.message);
        //                         MessageBox.error(that._getBundle().getText('saveError'));
        //                     });
        //             }
        //         }
        //     });
        // },

        onResetToDefault: function () {
            var that = this;
            var oODataModel = this.getView().getModel();
            var oSettingsModel = this.getView().getModel('settingsModel');

            if (!oODataModel) {
                Log.error('Settings: OData model not available');
                return;
            }

            oSettingsModel.setProperty('/busy', true);
            
            SettingsUtil.getDefaultSettings(oODataModel)
                .then(function (aDefaults) {
                    var aNonDefault = (that._aAllCategories || []).filter(function (oItem) {
                        var oDefault = aDefaults.find(function (d) { 
                            return d.categoryCode === oItem.categoryCode; 
                        });
                        if (!oDefault) return false;
                        return oItem.isEnabled !== oDefault.isEnabled || 
                               oItem.emailEnabled !== oDefault.emailEnabled;
                    });

                    if (aNonDefault.length === 0) {
                        oSettingsModel.setProperty('/busy', false);
                        MessageToast.show(that._getBundle().getText('alreadyDefault'));
                        return;
                    }

                    MessageBox.confirm(that._getBundle().getText('confirmResetDefault'), {
                        onClose: function (sAction) {
                            if (sAction === MessageBox.Action.OK) {
                                (that._aAllCategories || []).forEach(function (oItem) {
                                    var oDefault = aDefaults.find(function (d) { 
                                        return d.categoryCode === oItem.categoryCode; 
                                    });
                                    if (oDefault) {
                                        oItem.isEnabled = oDefault.isEnabled;
                                        oItem.emailEnabled = oDefault.emailEnabled;
                                    }
                                });

                                that._applyFilters();
                                that._checkDirty();

                                oSettingsModel.setProperty('/busy', false);
                                MessageToast.show(that._getBundle().getText('resetToDefaultSuccess'));
                            } else {
                                oSettingsModel.setProperty('/busy', false);
                            }
                        }
                    });
                })
                .catch(function (oError) {
                    oSettingsModel.setProperty('/busy', false);
                    Log.error('Settings: Get default settings failed - ' + oError.message);
                    MessageBox.error(that._getBundle().getText('loadError'));
                });
        },

        _saveSettings: function () {
            var oModel = this.getView().getModel('settingsModel');
            var aAll = this._aAllCategories || oModel.getProperty('/categories') || [];
            var aChanged = SettingsUtil.getChangedItems(aAll);

            if (aChanged.length === 0) {
                oModel.setProperty('/isDirty', false);
                return;
            }

            var oODataModel = this.getView().getModel();
            var that = this;
            oModel.setProperty('/busy', true);

            SettingsUtil.saveSettings(oODataModel, aChanged)
                .then(function () {
                    SettingsUtil.commitOriginals(aAll);
                    oModel.setProperty('/isDirty', false);
                    oModel.setProperty('/busy', false);
                    MessageToast.show(that._getBundle().getText('settingsSaved'));
                })
                .catch(function (oError) {
                    oModel.setProperty('/busy', false);
                    Log.error('Settings: Save failed - ' + oError.message);
                    MessageBox.error(that._getBundle().getText('saveError'));
                });
        },

        onButtonNavBackPress: function () {
            var oHistory = History.getInstance();
            if (oHistory.getPreviousHash() !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo('main', {}, {replace: true});
            }
        },

        _checkDirty: function () {
            var aAll = this._aAllCategories || [];
            var aChanged = SettingsUtil.getChangedItems(aAll);
            this.getView().getModel('settingsModel').setProperty('/isDirty', aChanged.length > 0);
        },

        _getBundle: function () {
            return this.getView().getModel('i18n').getResourceBundle();
        }
    });
});
