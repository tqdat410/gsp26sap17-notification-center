# Codebase Summary

## Overview
The **Notification Center** is an SAP Fiori application built with SAPUI5 (v1.136.0+) using the MVC pattern. It provides a real-time notification management interface, integrating with SAP ABAP backends via OData V4 and WebSockets (SAP APC).

## Project Structure
```text
.
├── docs/                   # Project documentation
├── webapp/                 # Application source code
│   ├── controller/         # MVC Controllers
│   ├── css/               # Application styles
│   ├── fragment/          # Reusable UI fragments
│   ├── i18n/              # Translation files
│   ├── localService/      # OData metadata and mock data
│   ├── model/             # Data models
│   ├── test/              # Unit and OPA5 integration tests
│   ├── util/              # Utility classes and helpers
│   └── view/              # XML Views
├── ui5.yaml               # UI5 CLI configuration
├── manifest.json          # App descriptor (Routing, DataSources, Models)
└── package.json           # Node.js dependencies and scripts
```

## Key Components

### Controllers
- **App.controller.js**: Root controller managing the application shell and global event bus subscriptions.
- **NotificationList.controller.js**: Main view controller. Handles filtering, searching, tab switching (All/Unread/Archived), and bulk actions.
- **NotificationDetail.controller.js**: Detailed view for a single notification, displaying metadata and available actions.
- **Settings.controller.js**: User preferences and notification settings.

### Utilities
- **WebSocketManager.js**: Manages the life cycle of the WebSocket connection to `/sap/bc/apc/sap/z17_apc_notification`. Includes exponential backoff reconnection logic.
- **NotificationActionHelper.js**: Simplifies execution of OData V4 actions (MarkAsRead, Archive, etc.) for single items, batches, and collections.
- **NotificationFormatter.js**: Handles UI-side formatting of dates, priorities, and subjects using HTML templates.
- **ToolbarStateHelper.js**: Controls the enablement and text of toolbar buttons based on table selection.
- **BooleanHelper.js**: Formatting boolean values for the UI.
- **CrossAppNavigation.js**: Handles navigation to other Fiori apps.

### Models
- **Default (OData V4)**: Connects to `/sap/opu/odata4/iwbep/all/srvd/sap/y17_sd_notification/0001/`.
- **i18n**: Resource bundle for localizable texts.
- **app**: JSON model for application-wide state (e.g., `UnreadCount`, `busy`).
- **device**: JSON model for device-specific information (phone, tablet, desktop).

## Data Flow
1. **Initial Load**: App fetches unread count via OData `$count`.
2. **Real-time**: `WebSocketManager` listens for incoming messages. On `NOTIFICATION` type message, it publishes an event via `EventBus`.
3. **UI Update**: `App` or `NotificationList` controller reacts to `EventBus` events to refresh the OData binding or increment the badge count.
4. **Actions**: User actions (e.g., "Mark as Read") are sent as OData V4 bound actions via `NotificationActionHelper`.

## Codebase Stats (via repomix)
- **Total Files**: 41
- **Total Tokens**: ~32k
- **Main Service**: OData V4 (metadata.xml ~10k tokens)
- **Top Files**: `NotificationList.controller.js`, `NotificationDetail.controller.js`, `NotificationList.view.xml`.
