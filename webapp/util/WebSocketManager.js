/**
 * WebSocketManager.js
 *
 * Manages SAP APC WebSocket connection for real-time notifications.
 * - Always connects to SAP server host (no localhost fallback)
 * - Parses JSON messages and publishes UI5 EventBus events
 * - Auto-reconnects with exponential backoff + jitter (max 5 attempts)
 */
sap.ui.define([
    'sap/base/Log'
], function (Log) {
    'use strict';

    var WS_URL = 'wss://s40lp1.ucc.cit.tum.de/sap/bc/apc/sap/z17_apc_notification';
    var EVENT_CHANNEL = 'notification.websocket';
    var EVENT_MESSAGE = 'newNotification';
    var RECONNECT_BASE_MS = 500;
    var RECONNECT_MAX_MS = 30000;
    var RECONNECT_MAX_ATTEMPTS = 5;
    var LOG_COMPONENT = 'notification.WebSocketManager';

    var _oWebSocket = null;
    var _oEventBus = null;
    var _iReconnectAttempt = 0;
    var _iReconnectTimer = null;
    var _bIntentionalClose = false;

    function _onOpen() {
        Log.info('APC WebSocket connected', WS_URL, LOG_COMPONENT);
        _iReconnectAttempt = 0;
        try {
            _oWebSocket.send(JSON.stringify({
                action: 'subscribe',
                channels: ['NOTIFICATION']
            }));
        } catch (e) {
            Log.warning('APC subscribe handshake failed: ' + e.message, null, LOG_COMPONENT);
        }
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
            Log.warning('APC message parse error: ' + e.message, null, LOG_COMPONENT);
        }
    }

    function _onClose(oEvent) {
        var iCode = oEvent && oEvent.code;
        var sReason = oEvent && oEvent.reason;

        Log.info('APC WebSocket closed', 'code=' + iCode + ', reason=' + sReason, LOG_COMPONENT);
        _oWebSocket = null;

        if (_bIntentionalClose || iCode === 1000) {
            return;
        }

        _attemptReconnect();
    }

    function _onError(oError) {
        Log.warning('APC WebSocket error', oError, LOG_COMPONENT);
    }

    function _attemptReconnect() {
        var iDelay;
        var iJitter;
        var iFinalDelay;

        _iReconnectAttempt++;

        if (_iReconnectAttempt > RECONNECT_MAX_ATTEMPTS) {
            Log.warning('APC reconnect stopped after max attempts: ' + RECONNECT_MAX_ATTEMPTS, null, LOG_COMPONENT);
            return;
        }

        iDelay = RECONNECT_BASE_MS * Math.pow(2, _iReconnectAttempt - 1);
        iJitter = Math.floor(Math.random() * 1000);
        iFinalDelay = Math.min(RECONNECT_MAX_MS, iDelay + iJitter);

        Log.info('APC reconnect in ' + iFinalDelay + 'ms (attempt ' + _iReconnectAttempt + ')', null, LOG_COMPONENT);

        if (_iReconnectTimer) {
            clearTimeout(_iReconnectTimer);
        }
        _iReconnectTimer = setTimeout(function () {
            _iReconnectTimer = null;
            _doConnect();
        }, iFinalDelay);
    }

    function _doConnect() {
        if (_oWebSocket) { return; }

        try {
            Log.info('APC WebSocket connecting', WS_URL, LOG_COMPONENT);
            _oWebSocket = new WebSocket(WS_URL);
            _oWebSocket.onopen = _onOpen;
            _oWebSocket.onmessage = _onMessage;
            _oWebSocket.onclose = _onClose;
            _oWebSocket.onerror = _onError;
        } catch (e) {
            Log.warning('APC WebSocket connection failed: ' + e.message, null, LOG_COMPONENT);
            _oWebSocket = null;
            _attemptReconnect();
        }
    }

    return {
        /**
         * Open APC WebSocket connection and subscribe to notification events.
         * @param {sap.ui.core.EventBus} oEventBus - UI5 EventBus for publishing events
         */
        connect: function (oEventBus) {
            _oEventBus = oEventBus;
            _bIntentionalClose = false;
            _iReconnectAttempt = 0;
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
                _oWebSocket.close(1000, 'App closing');
                _oWebSocket = null;
            }
            _iReconnectAttempt = 0;
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
