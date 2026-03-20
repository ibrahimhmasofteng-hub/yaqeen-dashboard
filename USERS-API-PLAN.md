# Users API Plan

Based on `users.txt` contract.

1. Define Users models and update Users service to match `/actors` endpoints and payload/response (including profile and pagination meta).
2. Align Users feature CRUD UI (feature copy of template CRUD) to the contract fields: list shows `username/email/phone/status`; create/edit dialog includes required fields + profile basics; add pagination (`page/perPage`).
3. Wire Users list API with pagination meta, fetch details for edit, and use `PATCH` for update; auth header already from interceptor.
4. Validate flows and error handling via global toast; keep template pages untouched.
