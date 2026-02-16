# Development Roadmap

## Phase 1: Foundation (Current State)
- [x] Initial UI5 project setup with OData V4 integration.
- [x] Implementation of `NotificationList` and `NotificationDetail` views.
- [x] WebSocket integration via `WebSocketManager` for real-time updates.
- [x] Core OData actions (MarkAsRead, Archive, Delete).
- [x] Multi-select and bulk action support.
- [x] Responsive layout with `sap_horizon` theme.
- [x] Initial project documentation.

## Phase 2: Enhanced User Experience
- [ ] **Advanced Settings**: Allow users to toggle specific notification categories.
- [ ] **Search Persistence**: Remember search and filter settings across sessions.
- [ ] **Deep Linking**: Improve navigation to source business objects from notifications.
- [ ] **Accessibility (A11y)**: Full ARIA support and keyboard navigation audit.
- [ ] **Skeleton Screens**: Improve perceived performance during initial OData fetch.

## Phase 3: Reliability & Performance
- [ ] **Offline Support**: Basic read-only support using Service Workers.
- [ ] **Performance Benchmarking**: Optimize OData `$expand` and `$select` queries.
- [ ] **Automated Testing**:
  - [ ] Increase Unit Test coverage for Utilities.
  - [ ] Implement OPA5 Integration tests for key user journeys.
- [ ] **Error Handling**: Enhanced UI feedback for failed OData actions.

## Phase 4: Enterprise Ready
- [ ] **Localization**: Complete translation into major languages.
- [ ] **Analytics**: Integrate usage tracking for notification engagement.
- [ ] **Security Audit**: Review data exposure and WebSocket security.
- [ ] **Deployment**: CI/CD pipeline for automated builds and deployment to SAP BTP/ABAP.
