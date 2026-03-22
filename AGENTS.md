# AGENTS.md — Project Rules (Yaqeen Dashboard)

This file is authoritative for all future work (features, refactors, fixes).

## Core Rules
- Use the PrimeNG Sakai template as the base reference. Template can be **cleaned up** and adapted as needed.
- For future features, rely on the **template** and **reference project** patterns.
- Do not add external UI libraries. Use only PrimeNG + template styles.
- If a proposed fix does not work, remove it promptly and do not keep obsolete/unused workarounds.

## Reference Paths
- Template source: `C:\Users\HP\Desktop\مشروع التخرج\project\dashbaord template\sakai-ng`
- Reference project: `C:\Users\HP\Desktop\2026 projects\Glass Shield\FE`

## Identity
- Project name: **Yaqeen**.
- Logo file: `src/assets/images/logo.png`.
- Topbar uses the logo and displays the text “Yaqeen”.
- Do not change template login page; use feature auth login instead.

## Architecture / Structure
- Keep scalable structure: `core/`, `shared/`, `features/`, `layout/`, `assets/`.
- Features live in `src/app/features/**` (no UI changes in `src/app/pages/**`).
- Routing:
  - `auth` routes load from `src/app/features/auth/auth.routes.ts`.
  - Main app routes are guarded by `authGuard` on `AppLayout`.

## Theming
- Primary color: `#056937`.
- Applied via PrimeNG config (custom preset in `src/app.config.ts`).
- Avoid editing template SCSS unless explicitly required.

## Auth / Login (API Contract)
- Base URL: `http://82.112.254.98:3000/api/v1`.
- Login endpoint: `POST /authentication/login`.
- Request body:
  - `username: string`
  - `password: string`
- Error response example:
  - `{ message: [ { property, errors: [] } ], error: "Bad Request", statusCode: 400 }`
- Success response:
  - `{ accessToken: string, actor: { id, fullName, email, phone, accountStatus, nationalId, createdAt } }`
- Auth service maps `actor` to the stored user.

## Error Handling / Toasts
- Notifications use `NotificationService` backed by PrimeNG `MessageService` with key `tst`.
- Global toasts are rendered in `src/app.component.ts` (not in template pages).
- **Only the global error interceptor** should show HTTP error toasts.
  - Components should not show toast for API errors to avoid duplicates.
- Error interceptor displays the **raw `error.message` payload** in a **single** toast (JSON string).

## Form UX (Required)
- For all submit actions: show loader on the submit button and **disable inputs** while submitting.

## Login UI (Feature)
- Use reactive forms (FormBuilder) in `src/app/features/auth/login.ts`.
- Use PrimeNG `p-button` loading state (`[loading]="submitting"`).
- Template login page remains untouched.

## Users CRUD
- **Must not change template CRUD page** (`src/app/pages/crud/crud.ts`).
- Create Users management in `src/app/features/users/**` by copying the CRUD UI into feature pages.
- Route `/users` loads the Users feature (lazy route).
- Use ref project service pattern:
  - `GET users`
  - `POST users`
  - `PUT users/:id`
  - `DELETE users/:id`

## RTL
- **Do not implement RTL** (explicitly not required).
