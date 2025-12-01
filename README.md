# DataCatalog UI V2

Enterprise Data Catalog Management Interface - A modern, performant web application for managing industrial data catalogs.

## Overview

DataCatalog UI V2 is a complete redesign of the data catalog management interface, built with:

- **Angular 20** - Latest framework with Signals and standalone components
- **Carbon Design System** - IBM's enterprise design system
- **TypeScript 5.8** - Strict mode enabled
- **Spec-Driven Development** - Using GitHub Spec-Kit methodology

## Features

### Current (Phase 1)
- Dashboard with KPIs and activity feed
- Explorer page with view mode toggles
- Sources and Labels management placeholders
- Settings with theme/density preferences
- Dark/Light theme support
- Responsive layout

### Planned
- Virtual scrolling for 10,000+ entries
- Advanced filtering and saved filters
- Bulk operations
- Graph view for relationship visualization
- XLSX export
- Keyboard shortcuts

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Project Structure

```
src/
├── app/
│   ├── core/           # Singleton services, guards, interceptors
│   ├── shared/         # Shared components, directives, pipes
│   ├── features/       # Feature modules (lazy-loaded)
│   │   ├── dashboard/
│   │   ├── explorer/
│   │   ├── sources/
│   │   ├── labels/
│   │   └── settings/
│   ├── store/          # Global state management
│   └── layout/         # App shell components
├── assets/
└── styles/
```

## Specifications

All project specifications are in the `.spec/` directory:

- `constitution.md` - Project principles and constraints
- `requirements.md` - Functional and non-functional requirements
- `architecture.md` - Technical architecture and patterns
- `implementation-plan.md` - Phased implementation plan

## Development

### Prerequisites
- Node.js 20+
- npm 10+

### Commands
```bash
npm start          # Start dev server at http://localhost:4200
npm run build      # Production build
npm run test       # Run unit tests
npm run lint       # Run ESLint
```

### Claude Code Integration

Slash commands are available in `.claude/commands/`:
- `/implement` - Implement a feature following specs
- `/review` - Code review checklist

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Angular 20 |
| UI | Carbon Design System |
| State | Angular Signals + RxJS |
| Styling | SCSS + CSS Custom Properties |
| Icons | Material Symbols |
| Build | Vite |

## License

Copyright © 2025 Industream. All rights reserved.
