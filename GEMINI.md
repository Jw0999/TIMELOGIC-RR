# TimeLogic Project Memory & Operational Guide

This document persists the architectural state, infrastructure endpoints, and critical configurations for TimeLogic.

---

## 1. Core Repositories & Credentials Context
- **GitHub Repository**: [Jw0999/TIMELOGIC-RR](https://github.com/Jw0999/TIMELOGIC-RR.git)
- **Active Collaborator / Owner**: `Jw0999`
- **Previous Repository (Access Lost)**: `arikytsya76-bit/TIMELOGIC`

---

## 2. Infrastructure & Production Endpoints

### Backend API (Render)
- **Service Name**: `timelogic-backend`
- **Region**: Oregon (US West)
- **Live Base URL**: `https://timelogic-backend.onrender.com`
- **API URL**: `https://timelogic-backend.onrender.com/api`
- **Health Check**: `https://timelogic-backend.onrender.com/health` (Returns `{"status":"ok"}`)

### Database (Render PostgreSQL)
- **Database Name**: `timelogic_db`
- **User**: `timelogic_db_user`
- **Region**: Oregon (US West)
- **Data Status**: 100% production data restored from offline backup (3 organizations, 13 users with exact password hashes, 24 attendance sessions, 126 employee attendance records, 27 breaks, 21 leave balances, 12 students, 48 student attendance records).

### Cache / Redis (Render Key Value)
- **Service Name**: `timelogic-redis`
- **Region**: Oregon (US West)
- **Environment Variable**: `REDIS_URL` pointing to the internal connection string.
- **Role**: Manages 30-second rotating QR tokens, station locks, and real-time socket events.

---

## 3. Frontend Deployments (Cloudflare Pages)

| App Name | Directory | Framework / Build | Output Dir | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `web` | Vite (`npm run build`) | `dist` | Central multi-tenant admin console |
| **Employee PWA** | `pwa` | Vite (`npm run build`) | `dist` | Employee mobile attendance & leave app |
| **Admin Station PWA** | `PWA2.0` | Vite (`npm run build`) | `dist` | Kiosk & manual check-in station (`https://timelogic-desktopadmin.pages.dev`) |
| **Marketing Website** | `website` | Next.js (`npm run build`) | `out` | Public landing website (`output: export`) |
| **Public Form** | `FILL FORM` | Vite (`npm run build`) | `dist` | Self-service employee registration form |

---

## 4. Desktop Client (Electron)

- **Version**: `1.0.17`
- **Config**: Configured to default to `https://timelogic-backend.onrender.com/api` in `desktop/src/config.ts` and `desktop/.env`.
- **Windows Updater Executable**:
  - Location: `desktop/release/TimeLogic-Admin-Updater.exe` (6.6 MB)
  - Purpose: Standalone 64-bit Windows GUI updater. Double-clicking updates an existing company installation by swapping in the new `app.asar` and restarting the application.
- **Linux Package**:
  - Location: `desktop/release/TimeLogic-Admin-1.0.17-amd64.deb` (75 MB native Debian package)
  - Portable Linux Binary: `./desktop/release/linux-unpacked/timelogic-admin`

---

## 5. Critical Configurations & Architectural Rules

1. **CORS Policy (`backend/src/config/app.js` & `backend/src/config/env.js`)**:
   - All origins ending in `*.pages.dev` and `*.onrender.com` are permitted.
   - `allowedHeaders` MUST include `['Content-Type', 'Authorization', 'Accept', 'Cache-Control', 'Pragma', 'X-Requested-With']` to allow `PWA2.0`'s `Cache-Control: no-cache` header.
2. **Prisma Migrations (`backend/package.json`)**:
   - `build` and `start` scripts MUST execute `node scripts/clear-failed-migrations.js` before `prisma migrate deploy` to ensure Render deployments never get blocked by failed migration locks.
3. **Database Maintenance (`backend/prisma/clear.js` & `backend/prisma/reset.js`)**:
   - Do NOT reference `selfieVerification` (table removed in migration `20260604000000`).
4. **Offline Backups (`backups/`)**:
   - `timelogic_production_backup_latest.json` (230 KB) contains the complete snapshot of all organizations, users, hashed credentials, attendance logs, and student rosters.
   - Restoration script: `backend/scripts/restore-to-new-database.js`.
