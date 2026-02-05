# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # TypeScript check + Vite production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Tech Stack

- **React 19** with TypeScript (Vite bundler)
- **Tailwind CSS v4** with custom theme in `src/index.css`
- **TanStack Query** for server state management
- **Supabase** for authentication and database
- **react-router-dom v7** for routing
- **TipTap** for rich text editing
- **dnd-kit** for drag-and-drop functionality
- **lucide-react** for icons

## Architecture

### Routing & Auth Flow
Routes are defined in `src/App.tsx`. The app uses:
- `ProtectedRoute` wrapper for auth-required pages
- `OnboardingCheck` wrapper that redirects staff to `/profile/setup` if onboarding isn't complete
- Public routes: `/login`, `/events/:slug`, `/onboarding/:slug`
- Layout-wrapped routes use `src/components/layout/Layout.tsx` (Sidebar + TopBar + Outlet)

### Data Fetching Pattern
All data fetching uses TanStack Query hooks in `src/hooks/`:
- `useCurrentStaffProfile()` - Current authenticated staff member
- `useEngagement()`, `useB2B()`, etc. - Domain-specific hooks
- Mutations use `useMutation` with `queryClient.invalidateQueries()` for cache updates

### External API
Admin operations (staff creation, password reset, Telegram sync) call a FastAPI backend via `VITE_API_URL`.

## Environment Variables

```
VITE_SUPABASE_URL=<supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<supabase-anon-key>
VITE_API_URL=<fastapi-backend-url>
```

## Styling

Custom Tailwind theme uses `cave-` prefix for all custom colors:
- Backgrounds: `cave-bg-primary`, `cave-bg-secondary`, `cave-bg-card`, `cave-bg-elevated`
- Text: `cave-text-primary`, `cave-text-secondary`, `cave-text-muted`
- Accent: `cave-gold`, `cave-gold-dark`
- Status: `cave-status-success`, `cave-status-warning`, `cave-status-error`, `cave-status-info`

Utility classes defined in `src/index.css`:
- Buttons: `.btn-primary`, `.btn-secondary`, `.btn-ghost`
- Form elements: `.input`, `.input-label`
- Layout: `.card`, `.table`
- Badges: `.badge-gold`, `.badge-success`, `.badge-warning`, `.badge-error`, `.badge-info`, `.badge-b2b`, etc.

## Type Definitions

Database types are in `src/types/database.ts` including `Member`, `Staff`, `Event`, `Connection`, `ThirdParty` and their related enums.
