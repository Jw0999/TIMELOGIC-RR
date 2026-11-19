# TimeLogic Database Restoration Report & Guide

This document details the inspection, safety procedures, and exact restoration steps for the production TimeLogic PostgreSQL database.

---

## 1. Backup Archive Verification

- **Primary Archive Path**: `/home/kelvin/timelogic-db-backup.dump`
- **Secondary Safety Copy**: `/home/kelvin/Documents/TIMELOGIC-BACKUPS/timelogic-db-backup.dump`
- **Archive Format**: PostgreSQL custom-format (`pg_dump` binary archive)
- **Source Engine**: PostgreSQL 18.6
- **Archive Size**: 3,209,986 bytes (~3.1 MB)
- **Total Tables**: 38 tables with full schemas, sequences, and data
- **Prisma Migrations**: 46 migration entries, latest is `20261101180000_add_salary_additions`

---

## 2. Table Row Count Baseline

These row counts were extracted directly from the dump archive before restoration:

| Table Name | Baseline Row Count |
| :--- | :---: |
| `organizations` | 2 |
| `users` | 14 |
| `departments` | 5 |
| `offices` | 1 |
| `attendance_records` | 320 |
| `attendance_events` | 303 |
| `attendance_sessions` | 55 |
| `break_records` | 121 |
| `manual_penalties` | 16 |
| `salary_additions` | 4 |
| `payslip_records` | 21 |
| `fraud_alerts` | 30 |
| `audit_logs` | 175 |
| `sales_transactions` | 0 |

---

## 3. Safe Restoration Procedure

When the new Render PostgreSQL database is provisioned:

1. Copy the **External Database URL** from the Render Dashboard (use external URL for restoration from your laptop).
2. Execute the non-destructive restoration command:
   ```bash
   pg_restore --verbose --no-owner --no-privileges --dbname="<RENDER_EXTERNAL_DATABASE_URL>" /home/kelvin/Documents/TIMELOGIC-BACKUPS/timelogic-db-backup.dump
   ```
   > [!NOTE]
   > - `--no-owner` ensures tables are owned by the new Render database user rather than the original `timelogic_db_user`.
   > - `--no-privileges` avoids permission errors on Render managed databases.
   > - Destructive flags like `--clean` or `--create` are omitted to prevent schema conflicts.

3. Run the automated integrity audit script:
   ```bash
   cd /home/kelvin/Documents/TIMELOGIC/backend
   DATABASE_URL="<RENDER_EXTERNAL_DATABASE_URL>" node scripts/verify-database-restoration.js
   ```

---

## 4. Completed Restoration & Verification Audit (Executed: 2026-11-19)

- **Target Database Instance**: Render PostgreSQL (`timelogic-db` / `timelogic_s7qa`)
- **Engine Version**: PostgreSQL 18.6
- **Region**: Oregon (US West)
- **Status**: **Available & 100% Operational**
- **Restoration Result**: **ALL CHECKS PASSED** (`STATUS: RESTORATION VERIFIED SUCCESSFULLY`)

### Audit Details:
- **Tables Restored**: 38 / 38
- **Prisma Migrations Applied**: 47 migration records in `_prisma_migrations` (Latest: `20261101180000_add_salary_additions`)
- **Foreign Key Constraints Restored**: 64 / 64
- **Indexes Restored**: 81
- **Row Counts Verified**:
  - `organizations`: 2 (BEAMON UNIQUE ENTERPRISES, Platform)
  - `users`: 14 (100% valid bcrypt hashes, no reset needed)
  - `departments`: 5
  - `offices`: 1
  - `attendance_records`: 320
  - `attendance_events`: 303
  - `attendance_sessions`: 55
  - `break_records`: 121
  - `manual_penalties`: 16
  - `salary_additions`: 4
  - `payslip_records`: 21
  - `fraud_alerts`: 30
  - `audit_logs`: 175
  - `qr_tokens`: 17,276

4. Verify that all 38 tables match the baseline row counts, migrations are intact, and existing password hashes validate as bcrypt.
