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
