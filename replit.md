# Restaurant Hub - Food Ordering PWA

## Overview

Restaurant Hub is a Progressive Web Application (PWA) designed for ordering food from local restaurants. The application features a client-side React frontend with Google Sheets integration for restaurant data and menu management. It's built with modern web technologies and optimized for mobile devices.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state and local storage for persistence
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Server**: Express.js with minimal API endpoints
- **Runtime**: Node.js 20 with ES modules
- **Development**: TSX for TypeScript execution in development
- **Production**: ESBuild for server bundling

### Data Architecture
- **Primary Data Source**: Google Sheets API (CSV export)
- **Local Storage**: Browser localStorage for caching and order persistence
- **Database Schema**: Drizzle ORM with PostgreSQL (configured but not actively used)
- **Validation**: Zod schemas for runtime type checking

## Key Components

### Restaurant Management
- Restaurant profiles with contact information, hours, and delivery options
- Profile pictures and business registration document storage
- Dynamic pricing and menu configuration

### Menu System
- Category-based menu organization (main, drinks, combos, etc.)
- Time-based menu availability (breakfast/lunch periods)
- Special options, sides, vegetables, and gravy selections
- Mix food combinations with custom pricing

### Order Processing
- Multi-item cart functionality with customizations
- Delivery vs pickup options
- Customer information collection
- Order persistence across sessions

### PWA Features
- Offline-capable with service worker (manifest configured)
- Mobile-optimized responsive design
- App-like experience with proper meta tags
- Touch-friendly interface

## Data Flow

1. **Restaurant Data**: Fetched from Google Sheets, cached locally for 30 minutes
2. **Menu Data**: Retrieved per restaurant from individual sheet URLs, cached locally
3. **Order Data**: Stored in localStorage, persists across browser sessions
4. **Customer Data**: Saved locally for convenience in future orders

The application prioritizes client-side functionality with Google Sheets serving as a simple backend-as-a-service solution.

## External Dependencies

### Core Dependencies
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight React router
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **drizzle-orm**: SQL ORM for PostgreSQL
- **zod**: Schema validation

### Development Dependencies
- **vite**: Build tool and dev server
- **tsx**: TypeScript execution for development
- **esbuild**: Production server bundling
- **@replit/vite-plugin-***: Replit-specific development tools

### External Services
- **Google Sheets API**: Restaurant and menu data storage
- **Neon Database**: PostgreSQL hosting (configured via @neondatabase/serverless)

## Deployment Strategy

### Development
- Runs on port 5000 with Vite dev server
- Hot module replacement for fast development
- TypeScript checking and auto-restart on file changes

### Production
- Client build: Vite bundles React app to static files
- Server build: ESBuild bundles Express server
- Deployment target: Autoscale platform (Replit)
- Environment: Node.js 20 with PostgreSQL 16 support

### Build Process
1. `npm run build`: Builds both client and server
2. Client assets output to `dist/public`
3. Server bundle output to `dist/index.js`
4. Static file serving in production mode

## Changelog

```
Changelog:
- June 19, 2025. Initial setup
- June 19, 2025. Implemented comprehensive order functionality matching Flutter app:
  * Mix meal support with second main dish selection
  * Special selection with "choose one" logic and caps
  * Size restrictions for mix meals (Med/Lrg only)
  * Sides, vegetables, and gravy selections
  * Detailed order summary with pricing
  * Customer information form with delivery/pickup
  * WhatsApp order integration
  * Order persistence in localStorage
- June 19, 2025. Updated branding and fixed image display:
  * Changed app title to "Restaurant Link, Food connection"
  * Fixed profile image fetching from column #12 (Google Drive links)
  * Removed placeholder image icons, show only actual images
  * Fixed mix toggle button visibility with flexible category matching
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```