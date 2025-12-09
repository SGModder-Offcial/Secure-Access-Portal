# Secure Admin & Search Dashboard

## Overview

This is a secure admin dashboard application with role-based access control (Owner vs Admin) that provides search functionality against an external API. The application features dual authentication paths, admin management capabilities for owners, and various search types (mobile, email, ID, alt mobile). It's built as a full-stack TypeScript application with a React frontend and Express backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for auth state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Session Management**: express-session with MemoryStore (in-memory session storage)
- **Authentication**: Custom session-based auth with bcryptjs password hashing
- **Rate Limiting**: express-rate-limit for login endpoint protection
- **Security Middleware**: Custom VPN detection, security headers, and interception prevention

### Authentication & Authorization
- **Dual Role System**: Owner (environment-based credentials) and Admin (MongoDB-stored)
- **Session-based Auth**: HTTP-only cookies with secure flags in production
- **Middleware Guards**: `requireAuth` for authenticated routes, `requireOwner` for owner-only routes
- **Owner Credentials**: Stored in environment variables (OWNER_USERNAME, OWNER_PASSWORD)

### Data Layer
- **Primary Database**: MongoDB with Mongoose ODM for admin users and search history
- **Schema Definition**: Zod schemas in `shared/schema.ts` for validation (shared between frontend/backend)
- **Drizzle Config**: Present but configured for PostgreSQL - may be used for future features or is legacy

### API Structure
- **Base Path**: `/api`
- **Auth Endpoints**: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- **Search Endpoints**: `/api/search/mobile`, `/api/search/email`, `/api/search/id`, `/api/search/alt`
- **Admin Management**: Owner-only endpoints for CRUD operations on admin users
- **External API**: Proxies search requests to `https://numinfoapi.vercel.app`

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/  # UI components (shadcn/ui)
│       ├── pages/       # Route pages
│       ├── lib/         # Utilities, auth context, query client
│       └── hooks/       # Custom React hooks
├── server/           # Express backend
│   ├── routes.ts     # API route definitions
│   ├── middleware.ts # Auth & security middleware
│   ├── models.ts     # Mongoose schemas
│   └── db.ts         # MongoDB connection
├── shared/           # Shared types and schemas
└── migrations/       # Database migrations (Drizzle)
```

## External Dependencies

### Database
- **MongoDB**: Primary database for admin users and search history
  - Connection via `MONGODB_URL` environment variable
  - Database name: `secure_portal`

### External APIs
- **NumInfo API**: `https://numinfoapi.vercel.app` - External search data provider

### Required Environment Variables
- `MONGODB_URL` - MongoDB connection string
- `OWNER_USERNAME` - Owner account username
- `OWNER_PASSWORD` - Owner account password
- `SESSION_SECRET` - Session encryption secret
- `DATABASE_URL` - PostgreSQL URL (for Drizzle, if used)

### Key NPM Dependencies
- **UI**: @radix-ui components, shadcn/ui, Tailwind CSS, lucide-react icons
- **Backend**: express, express-session, mongoose, bcryptjs, express-rate-limit
- **Validation**: zod, @hookform/resolvers
- **Data Fetching**: @tanstack/react-query