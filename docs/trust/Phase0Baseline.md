# Phase 0 Baseline

Status: baseline captured 2026-10-07.

## Scope

Phase 0 freezes feature expansion and focuses on the trustworthiness of an attendance event. The backend is the source of truth; Desktop, Mobile, Web, and PWA2.0 are clients of the API.

## Current attendance paths

| Path | Authentication | Evidence | Timestamp | Persistence | Current limitation |
| --- | --- | --- | --- | --- | --- |
| Phone check-in | Employee JWT | Challenge, device binding, Wi-Fi SSID or public IP | Backend network clock | `AttendanceRecord` | No durable idempotency key or attendance event record |
| Phone check-out | Employee JWT | Device binding, Wi-Fi/IP | Backend network clock | Updates `AttendanceRecord` | No durable idempotency key or event history |
| Manual check-in | Admin JWT plus employee password | Optional enrolled-face image plus active frame sequence when face is enrolled | Server receipt time; client time is contextual | `AttendanceEvent` plus `AttendanceRecord` | Face liveness is a bounded active-motion baseline, not a specialist PAD provider |
| Manual check-out | Admin JWT plus employee password | Password; face is not required | Server receipt time; client time is contextual | `AttendanceEvent` plus `AttendanceRecord` | Existing queued legacy actions require cleanup |
| PWA batch sync | Admin JWT plus queued credentials | Same manual checks after reconnect | Server receipt time; queued time is contextual | `AttendanceEvent` plus `AttendanceRecord` | New actions are online-only; legacy queue data remains a migration concern |

## Current verification order

Phone: authentication -> session and organization checks -> one-time challenge -> device and network checks -> attendance rules -> record write.

Manual: admin authentication -> employee password -> optional image comparison -> session and organization checks -> attendance rules -> record write.

Facial verification now runs a separate active-motion liveness request over three frames before comparing the final frame against the enrolled image. This is a Phase 0 baseline control, not a claim of full presentation-attack detection.

## Current audit behavior

`AuditService` and `AuditLog` exist for selected administrative actions. Attendance creation and mutation now have an organization-scoped `AttendanceEvent` with actor, employee, server time, evidence metadata, result, and idempotency key. Flag and approve operations preserve before/after audit details; penalty waiver still needs the same correction-history treatment.

## Current offline behavior

PWA2.0 caches station data and queues manual actions in IndexedDB. A queued action is not a verified attendance event until the backend accepts it. The queue currently contains sensitive credentials and client timestamps and has no durable server-side idempotency record.

## Canonical environments

The source-level production target is `https://timelogic-backend.onrender.com` as declared by `render.yaml`. Local development uses PostgreSQL, Redis, the Node API on port 5000, and the local face service on port 5001. Staging and production must provide the same four dependencies through environment configuration; clients must use the canonical API URL or the Cloudflare `/api` proxy, never a legacy Heroku hostname.

## Phase 0 success criteria

- Server receipt time is authoritative for every attendance mutation.
- Repeated submissions return one stored result.
- Attendance attempts and accepted events are traceable.
- Corrections preserve the original state and reason.
- Organization ownership is checked at the authenticated-user and resource boundaries.
- Liveness and identity are separate trusted-service results.
- Biometric files are not publicly exposed or placed in offline queues.
- Documentation and marketing claims match the implementation.