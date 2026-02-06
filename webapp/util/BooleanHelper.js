/**
 * BooleanHelper.js
 *
 * Boolean type safety helper for handling various boolean representations
 * - Native boolean
 * - String "true"/"false"/"yes"/"no"/"x"
 * - ABAP "X"/""
 */
sap.ui.define([], function () {
    'use strict';

    return {
        /**
         * Converts various boolean representations to native boolean
         * @param {*} vValue Value to check
         * @returns {boolean} true if value represents true
         */
        isTrue: function (vValue) {
            if (typeof vValue === 'boolean') {
                return vValue;
            }
            if (typeof vValue === 'string') {
                var sLower = vValue.toLowerCase();
                return sLower === 'true' || sLower === 'yes' || sLower === 'x';
            }
            return false;
        }
    };
});
