# System Architecture

## Overview
The Notification Center follows a decoupled architecture where the UI5 frontend communicates with a SAP ABAP backend via two distinct channels: **OData V4** for state/actions and **WebSockets (APC)** for real-time events.

## Component Diagram
```text
+-------------------------+
|    SAP Fiori Launchpad  |
|  +-------------------+  |
|  | Notification Bell |  | (Unread Count Badge)
|  +---------^---------+  |
+------------|------------+
             |
+------------v-------------+          +-------------------------+
|   SAPUI5 Frontend App    |          |    SAP ABAP Backend     |
|                          |          |                         |
|  +--------------------+  |  HTTPS   |  +-------------------+  |
|  |   OData V4 Model   +-------------->  OData Service      |  |
|  | (State & Actions)  |  | (REST)   |  | (Y17_SD_NOTIF)    |  |
|  +---------^----------+  |          |  +---------^---------+  |
|            |             |          |            |            |
|  +---------v----------+  |          |  +---------v---------+  |
|  |  WebSocket Manager |  |  WSS     |  |   ABAP Push       |  |
|  |   (SAP APC)        +-------------->   Channel (APC)     |  |
|  +---------^----------+  |          |  | (Z17_APC_NOTIF)   |  |
|            |             |          |  +-------------------+  |
|  +---------v----------+  |          |                         |
|  |     Event Bus      |  |          |  +-------------------+  |
|  | (Internal Pub/Sub) |  |          |  |  Business Events  |  |
|  +--------------------+  |          |  |  (CDS/Trigger)    |  |
+--------------------------+          +-------------------------+
```

## Communication Flows

### 1. State Synchronization (OData V4)
- **Read**: The app fetches notification lists and unread counts using OData V4 list bindings.
- **Write**: User actions like `MarkAsRead`, `Archive`, or `Delete` are executed as **bound actions** on the notification entities.
- **Efficiency**: OData V4 automatically handles batching and delta updates for the UI bindings.

### 2. Real-time Events (WebSockets/APC)
- **Connection**: `WebSocketManager` establishes a persistent WSS connection to the ABAP Push Channel.
- **Reception**: When a new notification is generated in the backend, the APC pushes a JSON message to all connected clients.
- **Processing**: The frontend parses the message and uses the UI5 `EventBus` to notify active controllers.
- **Update**: Controllers respond by refreshing the OData binding or manually incrementing local JSON models (like `app>/UnreadCount`).

### 3. Reconnection Strategy
- The `WebSocketManager` implements an **exponential backoff** algorithm.
- If the connection drops, it attempts to reconnect after 2s, 4s, 8s, up to a maximum of 30s.
- This ensures the UI stays "live" even after network fluctuations or backend restarts.

## Data Schema (Conceptual)
- **Notification**: Core entity (ID, Title, Body, Category, Priority, CreatedAt).
- **Recipient**: Link between notification and user (RecipientID, IsRead, IsArchived, IsDeleted).
- **Action**: Bound actions available for a specific notification state.
