/**
 * Settings.controller.js — Notification preference settings
 */
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

        /** Initialize settings model and route listener */
        onInit: function () {
            var oSettingsModel = new JSONModel({
                masterEnabled: true,
                isDirty: false,
                busy: false,
                categories: []
            });
            this.getView().setModel(oSettingsModel, 'settingsModel');

            this._aAllCategories = null;          // full unfiltered category list
            this._sSearchQuery = '';               // current search text
            this._sStatusFilter = 'all';           // enabled/disabled filter
            this._sRequiredFilter = 'all';         // required/optional filter
            this._bGuardInHistory = false;         // pushState guard entry active
            this._fnPopstateHandler = null;        // browser back listener ref

            this.getOwnerComponent()
                .getRouter()
                .getRoute('settings')
                .attachPatternMatched(this._onRouteMatched, this);
        },

        /** Reset state and reload on each route match */
        _onRouteMatched: function () {
            var oModel = this.getView().getModel('settingsModel');
            oModel.setProperty('/masterEnabled', true);
            oModel.setProperty('/isDirty', false);
            this._aAllCategories = null;
            this._sSearchQuery = '';
            this._sStatusFilter = 'all';
            this._sRequiredFilter = 'all';
            this._registerNavigationGuard();
            this._attachBrowserBackGuard();
            this._loadSettings();
        },

        /** Load category settings from OData /Setting entity */
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

        /** Master toggle changed — re-evaluate dirty state */
        onSwitchMasterChange: function () {
            this._checkDirty();
        },

        /** Live search by category name/description */
        onSearchFieldCategoryLiveChange: function (oEvent) {
            this._sSearchQuery = (oEvent.getParameter('newValue') || '').toLowerCase();
            this._applyFilters();
        },

        /** Status or Required filter changed */
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

        /** Apply search + status + required filters to category list */
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

        /** In-app toggle; turning off also disables email */
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

        /** Email toggle changed */
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
            this.onButtonNavBackPress();
        },

        /** Fetch defaults from /SettingDefault, compare, confirm, then apply locally */
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

        /** Persist changed items via OData Upsert action */
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

        // --- Unsaved-changes navigation guard ---
        // Guards: UI back button, in-app nav (Component.guardedNavTo), browser back (pushState/popstate)
        // _bGuardInHistory tracks whether the pushState entry is still in the history stack

        /** UI back button — confirm if dirty, then navigate back */
        onButtonNavBackPress: function () {
            this._confirmIfDirty(this._cleanUpAndNavigateBack.bind(this));
        },

        /** Show confirm dialog if dirty; otherwise proceed immediately */
        _confirmIfDirty: function (fnProceed) {
            var oModel = this.getView().getModel('settingsModel');
            if (oModel.getProperty('/isDirty')) {
                MessageBox.confirm(this._getBundle().getText('confirmCancelDirty'), {
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            fnProceed();
                        }
                    }
                });
            } else {
                fnProceed();
            }
        },

        /** Remove guards and go back; skip guard entry if still in history */
        _cleanUpAndNavigateBack: function () {
            var bGuardInHistory = this._bGuardInHistory;
            this._removeAllGuards();
            var oHistory = History.getInstance();
            if (oHistory.getPreviousHash() !== undefined) {
                // go(-2) to skip guard entry + settings, go(-1) if guard already popped
                window.history.go(bGuardInHistory ? -2 : -1);
            } else {
                this.getOwnerComponent().getRouter().navTo('main', {}, {replace: true});
            }
        },

        /** Register Component-level guard to intercept in-app navigation */
        _registerNavigationGuard: function () {
            var that = this;
            this.getOwnerComponent().setNavigationGuard(function (fnProceed, sRoute) {
                if (sRoute === 'settings') {
                    return;
                }
                that._confirmIfDirty(function () {
                    var bGuardInHistory = that._bGuardInHistory;
                    that._removeAllGuards();
                    if (bGuardInHistory) {
                        // Pop the guard entry first, then navigate to new route
                        var fnOnPop = function () {
                            window.removeEventListener('popstate', fnOnPop);
                            fnProceed();
                        };
                        window.addEventListener('popstate', fnOnPop);
                        window.history.go(-1);
                    } else {
                        fnProceed();
                    }
                });
            });
        },

        /** Push a guard entry into browser history to intercept back button */
        _attachBrowserBackGuard: function () {
            this._detachBrowserBackGuard();
            this._fnPopstateHandler = this._onBrowserBack.bind(this);
            window.addEventListener('popstate', this._fnPopstateHandler);
            window.history.pushState({ settingsGuard: true }, '');
            this._bGuardInHistory = true;
        },

        /** Remove popstate listener */
        _detachBrowserBackGuard: function () {
            if (this._fnPopstateHandler) {
                window.removeEventListener('popstate', this._fnPopstateHandler);
                this._fnPopstateHandler = null;
            }
        },

        /** Handle browser back: confirm if dirty, re-push guard on cancel */
        _onBrowserBack: function () {
            // Browser already popped the guard entry
            this._bGuardInHistory = false;
            var oModel = this.getView().getModel('settingsModel');
            if (oModel.getProperty('/isDirty')) {
                var that = this;
                MessageBox.confirm(this._getBundle().getText('confirmCancelDirty'), {
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            that._removeAllGuards();
                            window.history.go(-1);
                        } else {
                            window.history.pushState({ settingsGuard: true }, '');
                            that._bGuardInHistory = true;
                        }
                    }
                });
            } else {
                this._removeAllGuards();
                window.history.go(-1);
            }
        },

        /** Clear all navigation guards and listeners */
        _removeAllGuards: function () {
            this._bGuardInHistory = false;
            this.getOwnerComponent().clearNavigationGuard();
            this._detachBrowserBackGuard();
        },

        /** Lifecycle cleanup — remove guards to prevent memory leaks */
        onExit: function () {
            this._removeAllGuards();
        },

        /** Compare current vs original values to set isDirty flag */
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
