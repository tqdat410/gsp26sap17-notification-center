/**
 * WebSocketManager.js
 *
 * Manages SAP APC WebSocket connection for real-time notifications.
 * Uses sap.ui.core.ws.SapPcpWebSocket (SAP standard PCP protocol).
 * - Connects to /sap/bc/apc/sap/z17_apc_notification via relative URL
 * - Parses incoming PCP messages and fires UI5 EventBus events
 * - Auto-reconnects with exponential backoff (2s to 30s cap)
 * - Skips connection on localhost (UI5 dev proxy can't forward WebSocket)
 */
sap.ui.define([
    'sap/ui/core/ws/SapPcpWebSocket',
    'sap/base/Log'
], function (SapPcpWebSocket, Log) {
    'use strict';

    var APC_PATH = '/sap/bc/apc/sap/z17_apc_notification';
    var SAP_CLIENT = '324';
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
        return APC_PATH + '?sap-client=' + SAP_CLIENT;
    }

    function _onOpen() {
        Log.info('APC WebSocket connected', _buildUrl(), LOG_COMPONENT);
        _iReconnectDelay = RECONNECT_BASE_MS;
    }

    function _onMessage(oEvent) {
        if (!_oEventBus) { return; }
        try {
            var sData = oEvent.getParameter('data');
            var oData = JSON.parse(sData);
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

    function _onClose() {
        Log.info('APC WebSocket closed', null, LOG_COMPONENT);
        _oWebSocket = null;
        if (!_bIntentionalClose) {
            _scheduleReconnect();
        }
    }

    function _onError(oEvent) {
        Log.warning('APC WebSocket error', oEvent, LOG_COMPONENT);
    }

    function _scheduleReconnect() {
        if (_iReconnectTimer) { return; }
        Log.info('APC WebSocket reconnecting in ' + _iReconnectDelay + 'ms', null, LOG_COMPONENT);

        _iReconnectTimer = setTimeout(function () {
            _iReconnectTimer = null;
            _doConnect();
        }, _iReconnectDelay);

        _iReconnectDelay = Math.min(_iReconnectDelay * 2, RECONNECT_MAX_MS);
    }

    function _doConnect() {
        if (_oWebSocket) { return; }

        // Skip WebSocket on localhost — UI5 dev proxy can't forward WebSocket
        if (window.location.hostname === 'localhost') {
            Log.info('Skipping APC WebSocket on localhost (dev proxy limitation)', null, LOG_COMPONENT);
            return;
        }

        try {
            var sUrl = _buildUrl();
            _oWebSocket = new SapPcpWebSocket(sUrl, SapPcpWebSocket.SUPPORTED_PROTOCOLS.v10);
            _oWebSocket.attachOpen(_onOpen);
            _oWebSocket.attachMessage(_onMessage);
            _oWebSocket.attachClose(_onClose);
            _oWebSocket.attachError(_onError);
        } catch (e) {
            Log.warning('APC WebSocket connection failed: ' + e.message, null, LOG_COMPONENT);
            _oWebSocket = null;
            _scheduleReconnect();
        }
    }

    return {
        /**
         * Open APC WebSocket connection and subscribe to notification events.
         * Automatically skips on localhost (dev proxy can't forward WebSocket).
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
            return _oWebSocket !== null && _oWebSocket.getReadyState() === SapPcpWebSocket.ReadyState.OPEN;
        }
    };
});
