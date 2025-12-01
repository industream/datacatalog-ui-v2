# DataCatalog UI V2 - Project Constitution

## Project Identity

**Name:** DataCatalog UI V2
**Type:** Enterprise Data Catalog Management Interface
**Version:** 2.0.0

## Mission Statement

Build a modern, performant, and user-friendly web interface for managing industrial data catalogs, source connections, and metadata. The application enables users to organize, discover, and govern data assets across multiple industrial data sources (OPC-UA, Modbus, InfluxDB, PostgreSQL, MQTT, etc.).

## Core Principles

### 1. User Experience First
- Intuitive navigation with minimal learning curve
- Responsive design for desktop and tablet
- Accessibility compliance (WCAG 2.1 AA)
- Fast interactions with optimistic UI updates

### 2. Performance at Scale
- Handle 10,000+ catalog entries without degradation
- Virtual scrolling for large datasets
- Lazy loading of components and data
- Efficient state management with minimal re-renders

### 3. Maintainability
- Clean, modular architecture
- Comprehensive TypeScript typing
- Consistent code patterns across components
- Self-documenting code with clear naming

### 4. Industrial Focus
- Support for industrial protocols (OPC-UA, Modbus-TCP, MQTT)
- Time-series data awareness
- Multi-source data federation
- Secure credential handling

## Technology Stack

### Frontend Framework
- **Angular 19** - Latest with Signals and standalone components
- **TypeScript 5.7** - Strict mode enabled
- **RxJS 7.8** - For async operations and streams

### UI Framework
- **Carbon Design System** (IBM) - Web Components v2.x
- **Material Symbols** - For iconography
- **SCSS** - With CSS custom properties for theming

### State Management
- **Angular Signals** - Primary reactive primitive
- **RxJS BehaviorSubjects** - For service-level state
- **LocalStorage** - For user preferences persistence

### Data Visualization
- **Carbon Charts** - For dashboard analytics
- **D3.js or Cytoscape.js** - For relationship graphs

### Build & Tooling
- **Vite** - Fast development server and builds
- **ESLint + Prettier** - Code quality and formatting
- **Jest or Vitest** - Unit testing

## Quality Standards

### Code Quality
- 100% TypeScript strict mode compliance
- No `any` types except in justified edge cases
- ESLint rules enforced with zero warnings
- Prettier formatting on commit

### Testing
- Unit tests for all services
- Component tests for complex interactions
- E2E tests for critical user flows
- Minimum 80% code coverage

### Performance
- Lighthouse score > 90 for all metrics
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Bundle size < 500KB gzipped

### Accessibility
- Keyboard navigation for all features
- Screen reader compatibility
- Color contrast compliance
- Focus management in modals

## Constraints

### Browser Support
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

### No Support For
- Internet Explorer (any version)
- Mobile phones (tablet minimum)

### Security
- No secrets in client-side code
- JWT token handling with secure storage
- XSS prevention with Angular's built-in sanitization
- HTTPS only in production

## Success Metrics

1. **User Adoption**: 90% of users prefer V2 over V1
2. **Performance**: 50% faster page loads than V1
3. **Productivity**: 30% reduction in time to complete common tasks
4. **Reliability**: < 0.1% error rate in production
