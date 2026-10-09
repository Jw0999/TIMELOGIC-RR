# Tenant Isolation Model

## Ownership rule

Every organization-owned resource must be reached through an ownership path that is checked before reading or mutating it:

```text
authenticated user
  -> authorized organization target
  -> resource ownership
  -> operation permission
```

For normal administrators, the target organization is the authenticated user's `orgId`. For Super Admin operations, an explicit target organization is allowed only after verifying the role and the target organization exists.

## Audit matrix

| Surface | Organization source | Required authorization | Resource ownership |
| --- | --- | --- | --- |
| Phone attendance | Employee token and session office | Employee | Employee, session, and office share organization |
| Manual attendance | Admin token and authorized target | Admin | Employee and session belong to target organization |
| Attendance records | Authenticated org or authorized Super Admin target | Admin for other employees | Record employee/session ownership |
| Payroll and penalties | Authenticated org or authorized Super Admin target | Admin/Super Admin | Employee and payroll object belong to target organization |
| Reports | Authenticated org or authorized Super Admin target | Admin/Super Admin | Every included relation is organization-scoped |
| Face enrollment/release | Authenticated org or authorized Super Admin target | Admin/Super Admin | Employee belongs to target organization |

## Invariant

No request parameter, header, or query value can widen a non-Super-Admin user's organization scope. A target organization selected by a Super Admin must be applied consistently to every related query in the operation.