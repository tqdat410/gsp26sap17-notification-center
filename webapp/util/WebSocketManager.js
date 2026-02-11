/**
 * WebSocketManager.js
 *
 * Manages WebSocket connection to SAP APC endpoint for real-time notifications.
 * - Connects to /sap/bc/apc/sap/z17_apc_notification
 * - Parses incoming JSON messages and fires UI5 EventBus events
 * - Auto-reconnects with exponential backoff (2s to 30s cap)
 * - Graceful disconnect on app destroy
 */
sap.ui.define(['sap/base/Log'], function (Log) {
    'use strict';

    var APC_PATH = '/sap/bc/apc/sap/z17_apc_notification';
    var EVENT_CHANNEL = 'notification.websocket';
    var EVENT_MESSAGE = 'newNotification';
    var RECONNECT_BASE_MS = 2000;
    var RECONNECT_MAX_MS = 30000;
    var LOG_COMPONENT = 'notification.WebSocketManager';

    var _oWebSocket = null;
    var _oEventBus = null;
    var _iReconnectDelay = RECONNECT_BASE_MS;
    var _iReconnectTimer = null;
    var _bIntentionalClose = false;

    function _buildUrl() {
        var oLocation = window.location;
        var sProtocol = oLocation.protocol === 'https:' ? 'wss:' : 'ws:';
        return sProtocol + '//' + oLocation.host + APC_PATH;
    }

    function _onOpen() {
        Log.info('WebSocket connected', _buildUrl(), LOG_COMPONENT);
        _iReconnectDelay = RECONNECT_BASE_MS;
    }

    function _onMessage(oEvent) {
        if (!_oEventBus) { return; }
        try {
            var oData = JSON.parse(oEvent.data);
            if (!oData || oData.type !== 'NOTIFICATION') { return; }

            _oEventBus.publish(EVENT_CHANNEL, EVENT_MESSAGE, {
                notificationId: oData.notificationId,
                title: oData.title,
                body: oData.body,
                categoryCode: oData.category,
                priority: oData.priority,
                createdAt: oData.createdAt,
                userId: oData.userId
            });
        } catch (e) {
            Log.warning('WebSocket message parse error: ' + e.message, null, LOG_COMPONENT);
        }
    }

    function _onClose() {
        Log.info('WebSocket closed', null, LOG_COMPONENT);
        _oWebSocket = null;
        if (!_bIntentionalClose) {
            _scheduleReconnect();
        }
    }

    function _onError(oError) {
        Log.warning('WebSocket error', oError, LOG_COMPONENT);
    }

    function _scheduleReconnect() {
        if (_iReconnectTimer) { return; }
        Log.info('WebSocket reconnecting in ' + _iReconnectDelay + 'ms', null, LOG_COMPONENT);

        _iReconnectTimer = setTimeout(function () {
            _iReconnectTimer = null;
            _doConnect();
        }, _iReconnectDelay);

        // Exponential backoff with cap
        _iReconnectDelay = Math.min(_iReconnectDelay * 2, RECONNECT_MAX_MS);
    }

    function _doConnect() {
        if (_oWebSocket) { return; }
        if (typeof WebSocket === 'undefined') {
            Log.warning('WebSocket not supported in this browser', null, LOG_COMPONENT);
            return;
        }

        try {
            var sUrl = _buildUrl();
            _oWebSocket = new WebSocket(sUrl);
            _oWebSocket.onopen = _onOpen;
            _oWebSocket.onmessage = _onMessage;
            _oWebSocket.onclose = _onClose;
            _oWebSocket.onerror = _onError;
        } catch (e) {
            Log.warning('WebSocket connection failed: ' + e.message, null, LOG_COMPONENT);
            _oWebSocket = null;
            _scheduleReconnect();
        }
    }

    return {
        /**
         * Open WebSocket connection and subscribe to notification events.
         * @param {sap.ui.core.EventBus} oEventBus - UI5 EventBus for publishing events
         */
        connect: function (oEventBus) {
            _oEventBus = oEventBus;
            _bIntentionalClose = false;
            _doConnect();
        },

        /**
         * Close WebSocket connection cleanly. Stops reconnect attempts.
         */
        disconnect: function () {
            _bIntentionalClose = true;
            _oEventBus = null;
            if (_iReconnectTimer) {
                clearTimeout(_iReconnectTimer);
                _iReconnectTimer = null;
            }
            if (_oWebSocket) {
                _oWebSocket.close();
                _oWebSocket = null;
            }
            _iReconnectDelay = RECONNECT_BASE_MS;
        },

        /**
         * Check if WebSocket is currently connected.
         * @returns {boolean} true if connected
         */
        isConnected: function () {
            return _oWebSocket !== null && _oWebSocket.readyState === WebSocket.OPEN;
        }
    };
});
