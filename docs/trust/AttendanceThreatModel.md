# Attendance Threat Model

## Assets

- Attendance records used for payroll and compliance.
- Employee passwords and access tokens.
- Enrolled face representations and capture images.
- Organization and office ownership data.
- Attendance correction history.

## Threats and controls

| Threat | Required control | Baseline status |
| --- | --- | --- |
| Cross-organization access | Authenticated organization plus resource ownership checks | Application checks exist but are inconsistent across controllers |
| Duplicate retry | Durable organization-scoped idempotency key | Required in Phase 0 |
| Client clock manipulation | Server receipt timestamp | Online phone path does this; manual path needs correction |
| Password or token exposure | Minimize offline storage and clear on logout | PWA queue currently stores sensitive values |
| Face photograph replay | Active or passive liveness result separate from identity match | Not implemented in current service |
| Face mismatch | Distinguish mismatch from liveness and quality failures | Partially implemented |
| Record tampering | Append-only event and correction history | Existing audit log is incomplete for attendance |
| Replayed refresh token | Rotation and revocation checks | Existing lifecycle requires audit and tests |
| Public biometric access | Authenticated or private object storage | Requires verification of upload serving |
| Provider failure | Fail closed for required verification; observable service errors | Service errors exist; verification result currently over-trusted |

## Abuse cases for testing

Org A credentials must not access Org B resources. Changing `employeeId`, `sessionId`, `recordId`, or organization selectors must fail. Replaying the same idempotency key must return one outcome. Revoked refresh tokens must fail. Photos, screens, and recorded video must not pass the supported liveness checks.