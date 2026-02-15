# Notification Center

An SAP Fiori application for managing notifications in real-time.

## Overview
The Notification Center provides a centralized interface for users to view, manage, and respond to system notifications. Built with SAPUI5 and OData V4, it features real-time updates via WebSockets and a modern "Horizon" theme.

## Key Features
- **Real-time Notifications**: Instant updates via SAP APC (WebSockets) with automatic reconnection.
- **Advanced Filtering**: Filter by category (Task, System, Alert, Info), priority, and date range.
- **Bulk Actions**: Mark multiple notifications as read, archived, or deleted in one go.
- **Detailed View**: Access full notification details and context-specific actions with semantic navigation.
- **Settings & Preferences**: Customize notification behavior and visibility per category.
- **Adaptive Design**: Fully responsive layout supporting Desktop, Tablet, and Mobile.
- **Badge Integration**: Real-time unread count displayed on the notification bell icon.
- **Smart Formatting**: Context-aware formatting for dates, priorities, and categorization.

## Technical Stack
- **Framework**: SAPUI5 v1.136.0+
- **Protocol**: OData V4
- **Real-time**: SAP APC (WebSocket)
- **Theme**: sap_horizon
- **Build Tool**: UI5 CLI
- **Language**: JavaScript (ES6+)

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS version)
- [UI5 CLI](https://sap.github.io/ui5-tooling/pages/CLI/) (`npm install --global @ui5/cli`)

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App
- **Start with Sandbox**:
  ```bash
  npm start
  ```
- **Start with Mock Data**:
  ```bash
  npm run start-mock
  ```
- **Local Development (No FLP)**:
  ```bash
  npm run start-noflp
  ```

## Project Structure
- `webapp/`: Source code of the Fiori application.
  - `controller/`: Logic for views.
  - `view/`: XML views for the UI.
  - `util/`: Helper classes (WebSocket, OData Actions).
  - `manifest.json`: Application configuration.
- `docs/`: Technical documentation and architecture details.
- `ui5.yaml`: Build and development server configuration.
