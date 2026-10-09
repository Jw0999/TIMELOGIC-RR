# Phase 1: Trusted Workforce Record

## Purpose

Phase 1 adds a unified historical layer without replacing the existing attendance, break, leave, penalty, or payroll tables.

`WorkEvent` is the timeline projection. Existing domain records remain authoritative for their operational workflows; each meaningful accepted action can now be represented as one provenance-rich work event.

## WorkEvent contract

- `orgId`, `employeeId`, and optional `actorId` establish ownership and provenance.
- `type` identifies the work activity, such as `CHECK_IN`, `CHECK_OUT`, `BREAK_START`, `BREAK_END`, `LEAVE_APPROVED`, `LEAVE_CANCELLED`, `PENALTY_APPLIED`, `PENALTY_WAIVED`, or `PAYROLL_CALCULATED`.
- `occurredAt` is when the work event happened; `recordedAt` is when TimeLogic recorded it.
- `source`, `sessionId`, `deviceId`, and `verificationId` describe how it was produced.
- `ruleVersion` identifies the calculation policy snapshot used by the source workflow.
- `sourceType` and `sourceId` link back to the original domain record without replacing it.
- `metadata` stores a structured, non-secret evidence and calculation snapshot.
- `dedupeKey` prevents duplicate projection when a request is retried.
- `status` supports lifecycle states such as `FINALIZED` and `CORRECTED`.

## Read API

`GET /api/work-history` returns the authenticated employee's own history.

`GET /api/work-history/:employeeId` returns an employee history for an authorized administrator. Super Admin requests must provide an explicit organization target.

Supported filters: `from`, `to`, `type`, `page`, and `limit`.

## Current projections

- Accepted phone/manual attendance events project transactionally from `AttendanceEvent`.
- Attendance flag, approval, and penalty-waive actions project correction events.
- Break start and end project work events.
- Leave request, approval, rejection, and cancellation project lifecycle events.
- Manual penalties project application events.
- Generated payslips project payroll calculation events with work-hour, deduction, and net-pay snapshots.

## Historical rule

Existing source records are not overwritten by the timeline projection. Corrections create additional `WorkEvent` history with the acting administrator and before/after metadata, preserving the original operational record and its audit chain.
