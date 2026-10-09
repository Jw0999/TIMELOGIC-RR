# Attendance Trust Model

## Trusted boundary

The trusted decision boundary is the backend API plus its PostgreSQL database. Clients provide claims and evidence; they do not define the authoritative timestamp, organization, employee identity, or verification result.

## Decision sequence

```text
authenticate request
  -> resolve organization from authenticated identity and authorized target
  -> resolve employee and session through organization ownership
  -> validate employee status and attendance policy
  -> validate device/network evidence where required
  -> run liveness, then identity verification when policy requires face
  -> obtain server receipt time
  -> enforce idempotency
  -> persist attendance event and attendance record
  -> write audit history
  -> emit Socket.IO notification
```

## Evidence classes

- Authentication: valid active account and access token.
- Authorization: role and organization scope.
- Workplace: office session, office assignment, Wi-Fi SSID or public IP.
- Device: registered employee device where the policy requires it.
- Identity: employee password and/or face match.
- Liveness: presentation-attack result from the authorized face service.
- Time: backend receipt time; any client time is contextual only.

## Outcome rules

An event is accepted only when required evidence passes and the idempotency key has not already produced an outcome. Failed attempts remain distinguishable from accepted attendance. A retry of an accepted event returns the original outcome instead of creating another attendance record.