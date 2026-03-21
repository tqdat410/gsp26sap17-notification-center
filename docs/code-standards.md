# Code Standards

## Architectural Pattern
The project follows the standard **SAPUI5 MVC (Model-View-Controller)** pattern.

- **Views**: Defined in XML (`.view.xml`). No logic allowed in views except for formatter calls.
- **Controllers**: Implementation in JavaScript (`.controller.js`). Handles UI events and model updates.
- **Models**: Data binding via OData V4 (main), JSON (local state), and Resource (i18n).
- **Fragments**: Reusable UI parts (`.fragment.xml`) for popovers, dialogs, etc.
- **Utilities**: Standalone modules (`.js`) for complex logic, API helpers, and formatters.

## File Size Management
To maintain readability and context efficiency:
- **Maximum File Size**: 200 lines for code files.
- **Modularization Strategy**:
  - Extract complex logic into `webapp/util/`.
  - Use `Fragments` for large UI sections.
  - Split controllers if they handle multiple distinct UI regions.

## Naming Conventions
- **Folders**: kebab-case.
- **Files**: PascalCase for Views and Controllers (`NotificationList.view.xml`), camelCase for utility modules (`webSocketManager.js`).
- **Variables/Functions**: camelCase (`onTabSelect`, `oAppModel`).
- **Constants**: UPPER_SNAKE_CASE (`EVENT_CHANNEL`).
- **Private methods**: Prefixed with underscore (`_applyFilters`).
- **IDs**: camelCase (`notificationTable`).

## Best Practices
- **ES6+ Syntax**: Use `const`/`let`, arrow functions (where appropriate), and template literals.
- **Error Handling**: Use `try/catch` and `.catch()` for all async operations (OData actions, WebSocket).
- **Asynchronous Logic**: Prefer `Promises` and `async/await`.
- **Resource Cleanup**: Always unsubscribe from EventBus and disconnect WebSockets in `onExit`.
- **Formatting**: Use the provided `NotificationFormatter.js` for all UI formatting.
- **Hardcoded Strings**: NEVER use hardcoded strings in the UI; always use `i18n`.

## OData V4 Usage
- Use **Context Binding** for single objects.
- Use **List Binding** for collections with `$expand` and `$select`.
- Use **Bound Actions** for state changes (MarkRead, Delete) via the `NotificationActionHelper`.
- Always check for **Binding Refresh** after critical actions to maintain data consistency.
