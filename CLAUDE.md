# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Yaqeen Dashboard — an Angular 21 admin dashboard built on the PrimeNG Sakai template, using standalone components, PrimeNG UI, Tailwind (via `tailwindcss-primeui`), and `@ngx-translate` for i18n.

## Commands

```bash
npm start            # ng serve, http://localhost:4200
npm run build        # ng build (production)
npm run watch        # ng build --watch --configuration development
npm test             # ng test (Karma/Jasmine)
npm run format       # prettier --write on ts/html
```

Run a single test file: `ng test --include='**/some-file.spec.ts'`.

## Project rules (from AGENTS.md — authoritative)

- Base UI on the PrimeNG Sakai template; do not add external UI libraries — PrimeNG + template styles only.
- Template pages under `src/app/pages/**` (crud, documentation, uikit, landing, etc.) are reference/demo scaffolding and must **not** be modified for feature work. All real features live in `src/app/features/**`, built by copying/adapting patterns from the template pages.
- Template login page stays untouched — feature auth login (`src/app/features/auth/`) is the real one.
- If a fix doesn't work, remove it — don't leave dead workarounds in place.
- Primary theme color `#056937`, applied via a custom PrimeNG preset in `src/app.config.ts`. Avoid editing template SCSS unless required.
- Logo: `src/assets/images/logo.png`; topbar shows logo + "Yaqeen" text.

## Architecture

### Path alias
`@/*` maps to `src/*` (see `tsconfig.json`). Always import with `@/app/...`, not relative `../../..` chains.

### Layered structure
- `src/app/core/` — singletons: HTTP services, guards, interceptors, cross-cutting models. Nothing feature-specific lives here.
- `src/app/shared/` — reusable dumb components (empty state, form-errors, notfound) usable across features.
- `src/app/features/<name>/` — one folder per business domain (students, teachers, courses, course-groups, events, guardians, supervisors, posts, users, roles, permissions, attendance, audit-logs, recommendations, dashboard). Each typically has `models/`, `pages/`, `services/`, and a `<name>.routes.ts` lazy-loaded route file.
- `src/app/layout/` — the authenticated app shell (topbar, sidebar, `AppLayout`).
- `src/app/pages/` — original Sakai template demo pages; treat as read-only reference, not a place for feature code.

### Routing
- Each feature exposes a default-exported `Routes` array from `<feature>.routes.ts`, lazy-loaded from the top-level app routes.
- `src/app/features/auth/auth.routes.ts` handles auth routes, with `redirectIfAuthenticated` / `allowOnlyCompleteRegistration` guard functions controlling access based on `AuthService.user()?.accountStatus` (e.g. `AccountStatus.COMPLETE_REGISTRATION_REQUIRED` forces the complete-registration flow).
- Main app routes are guarded by `authGuard` on `AppLayout`; `permission.guard.ts` / `role.guard.ts` gate specific routes by permission/role.
- Detail/sub-resource routes follow a `:id/<subresource>` convention, e.g. `teachers/:id/courses`, `teachers/:id/groups`, `supervisors/:id/courses`, `events/:id/stats`.

### HTTP layer
- All HTTP calls go through `ApiService` (`src/app/core/services/api.service.ts`), which wraps `HttpClient` with a configured `API_BASE_URL` injection token and exposes `get/post/put/patch/delete/upload/downloadBlob`. Feature services `inject(ApiService)` and call relative paths (e.g. `this.api.post('family-relations', payload)`) — never call `HttpClient` directly from a feature service.
- List endpoints follow a `{ data: T[], meta: { page, perPage, nextPage, previousPage, total } }` envelope; feature services expose typed response interfaces mirroring this shape.
- `AuthService` stores the authenticated user; `TokenService` persists the access token; `PermissionService.has/hasAny/hasAll` checks permission strings loaded from the token — permissions are only considered "loaded" after `setPermissionsLoaded(true)` is called (post-login), so `has()` returns `false` until then even if a token exists.
- `auth.interceptor.ts`, `error.interceptor.ts`, `loading.interceptor.ts` are global HTTP interceptors.

### Error handling / notifications
- Notifications go through `NotificationService` (wraps PrimeNG `MessageService`, key `'tst'`). The toast host lives in `src/app.component.ts`, not in individual pages.
- **Only** the global `error.interceptor.ts` shows toasts for HTTP errors, displaying the raw `error.message` payload as a single JSON-string toast. Feature components/services must not show their own error toasts for API failures (avoids duplicate toasts).

### Forms
- Reactive forms (`FormBuilder`) throughout. On submit, buttons must show a PrimeNG loading state (`[loading]="submitting"`) and disable inputs while the request is in flight.

### API contract reference
- Base URL: `http://82.112.254.98:3210/api/v1`.
- `api-docs.json` / `api-graduation.json` at repo root are full OpenAPI-style (Swagger) dumps of the backend API — **always check these before writing or modifying anything API-related**: new endpoints, request/response shapes, query params, enums, or when an existing feature service's assumptions look wrong. Don't guess a payload shape or field name from the frontend alone; grep `api-docs.json` for the path/schema first.
