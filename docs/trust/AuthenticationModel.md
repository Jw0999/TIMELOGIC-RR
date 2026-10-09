# Authentication Model

## Current implementation

`AuthenticationService` issues JWT access tokens and database-backed refresh tokens. `auth` middleware verifies the access token, checks Redis revocation state, reloads the user, and rejects inactive accounts. Passwords use bcrypt. Failed login tracking and account lockout use Redis.

## Trust rules

- Access tokens are short-lived operational credentials.
- Refresh tokens are high-value credentials and must be rotated on refresh.
- Logout, password changes, termination, and security actions must revoke refresh capability.
- The authenticated user must be reloaded from the database before organization and role decisions.
- Client-provided organization IDs are selectors only; they are never proof of access.

## Audit requirements

Login, refresh, logout/revocation, password reset, device registration, face enrollment, face release, failed verification, and administrative attendance actions must have an actor, organization context where applicable, server timestamp, outcome, and request metadata without storing secrets or biometric payloads.