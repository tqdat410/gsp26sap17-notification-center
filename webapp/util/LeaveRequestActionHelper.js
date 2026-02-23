/**
 * LeaveRequestActionHelper.js
 *
 * Stub for Leave Request inline actions (Approve / Reject).
 * TODO: Replace MessageToast stubs with real OData calls when backend service is ready.
 */
sap.ui.define([
    'sap/m/MessageToast'
], function (MessageToast) {
    'use strict';

    // TODO: Fill in when backend Leave Request OData service is available
    // var SERVICE_URL = '/sap/opu/odata4/.../';
    // var NAMESPACE   = 'com.sap...LeaveRequest';

    return {

        approve: function (sRequestId) {
            // TODO: Replace with real OData call
            // var oModel = new ODataModel({ serviceUrl: SERVICE_URL });
            // var oOp = oModel.bindContext('/LeaveRequest(' + sRequestId + ')/' + NAMESPACE + '.Approve(...)');
            // return oOp.execute();
            MessageToast.show('[DEV] Approve RequestId: ' + sRequestId);
            return Promise.resolve();
        },

        reject: function (sRequestId, sRejectReason) {
            // TODO: Replace with real OData call
            // var oModel = new ODataModel({ serviceUrl: SERVICE_URL });
            // var oOp = oModel.bindContext('/LeaveRequest(' + sRequestId + ')/' + NAMESPACE + '.Reject(...)');
            // oOp.setParameter('RejectReason', sRejectReason);
            // return oOp.execute();
            MessageToast.show('[DEV] Reject RequestId: ' + sRequestId + ' | Reason: ' + sRejectReason);
            return Promise.resolve();
        }

    };
});
