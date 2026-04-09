/**
 * LeaveRequestActionHelper.js
 *
 * OData V4 action helper for Leave Request Approve / Reject.
 * Calls bound actions on the Leave Request RAP service.
 *
 * Status lifecycle: SUBMITTED → APPROVED | REJECTED | CANCELLED
 * - Approve: sets Status='APPROVED', ApprovedBy, ApprovedAt (no params)
 * - Reject:  sets Status='REJECTED', RejectReason (required), ApprovedBy, ApprovedAt
 * - Backend get_instance_features disables Reject when Status ≠ 'SUBMITTED'
 */
sap.ui.define([
    'sap/ui/model/odata/v4/ODataModel',
    'sap/base/Log'
], function (ODataModel, Log) {
    'use strict';

    var SERVICE_URL   = '/sap/opu/odata4/sap/z17_ui_leaverequest_o4/srvd/sap/z17_sd_leaverequest/0001/';
    var ACTION_NS     = 'com.sap.gateway.srvd.z17_sd_leaverequest.v0001';
    var LOG_COMPONENT = 'notification.LeaveRequestActionHelper';

    // Lazy singleton — created once, reused across calls
    var _oModel = null;

    function _getModel() {
        if (!_oModel) {
            _oModel = new ODataModel({
                serviceUrl: SERVICE_URL,
                synchronizationMode: 'None',
                operationMode: 'Server',
                autoExpandSelect: true
            });
        }
        return _oModel;
    }

    /**
     * Normalize a leave request UUID to canonical GUID format for OData URI usage.
     * Accepts:
     * - C32 uppercase/lowercase without hyphens
     * - C36 uppercase/lowercase with hyphens
     * Returns:
     * - lowercase C36 with hyphens
     *
     * @param {string} sRequestId - UUID from notification Action.Params
     * @returns {string}
     */
    function _normalizeRequestId(sRequestId) {
        var sValue = String(sRequestId || '').trim();

        if (!sValue) {
            throw new Error('RequestID is missing.');
        }

        if (/^[0-9a-fA-F]{32}$/.test(sValue)) {
            sValue = sValue.slice(0, 8) + '-'
                + sValue.slice(8, 12) + '-'
                + sValue.slice(12, 16) + '-'
                + sValue.slice(16, 20) + '-'
                + sValue.slice(20, 32);
        }

        if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(sValue)) {
            throw new Error('Invalid RequestID format: ' + sRequestId);
        }

        return sValue.toLowerCase();
    }

    /**
     * Build the canonical OData V4 entity path for a leave request bound action.
     * Uses the single-key shortcut form:
     * /LeaveRequest(<guid>)/
     *
     * @param {string} sRequestId - UUID of the leave request
     * @returns {string}
     */
    function _buildLeaveRequestPath(sRequestId) {
        var sNormalizedRequestId = _normalizeRequestId(sRequestId);
        return '/LeaveRequest(' + sNormalizedRequestId + ')/';
    }

    return {

        /**
         * Approve a leave request via OData V4 bound action.
         * Maps to ABAP: METHOD Approve FOR MODIFY IMPORTING keys FOR ACTION LeaveRequest~Approve
         * No parameters — backend reads sy-uname and utclong_current() directly.
         *
         * @param {string} sRequestId - UUID of the leave request (from Action.Params)
         * @returns {Promise}
         */
        approve: function (sRequestId) {
            var sPath = _buildLeaveRequestPath(sRequestId)
                      + ACTION_NS + '.Approve(...)';
            Log.debug('LeaveRequestActionHelper: Approve ' + sRequestId, null, LOG_COMPONENT);
            var oOp = _getModel().bindContext(sPath);
            return oOp.execute();
        },

        /**
         * Reject a leave request via OData V4 bound action.
         * Maps to ABAP: METHOD Reject FOR MODIFY IMPORTING keys FOR ACTION LeaveRequest~Reject
         * RejectReason is mandatory — validated in controller before this is called.
         *
         * @param {string} sRequestId    - UUID of the leave request
         * @param {string} sRejectReason - Reason for rejection (maps to %param-RejectReason)
         * @returns {Promise}
         */
        reject: function (sRequestId, sRejectReason) {
            var sPath = _buildLeaveRequestPath(sRequestId)
                      + ACTION_NS + '.Reject(...)';
            Log.debug('LeaveRequestActionHelper: Reject ' + sRequestId, null, LOG_COMPONENT);
            var oOp = _getModel().bindContext(sPath);
            oOp.setParameter('RejectReason', sRejectReason);
            return oOp.execute();
        }

    };
});
