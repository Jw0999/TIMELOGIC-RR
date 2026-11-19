# TimeLogic Production Environment Variables Checklist

This document provides the authoritative list of environment variables required for deploying the **Render Express Backend** and the **Heroku DeepFace Microservice**.

> [!IMPORTANT]
> Never commit actual passwords, tokens, or private secrets to version control. Set these directly in the Render and Heroku dashboard environments.

---

## 1. Render Express Backend Environment Variables

Configure these under **Render Dashboard ➔ Web Service (timelogic-backend) ➔ Environment**:

| Variable Name | Required | Example / Description |
| :--- | :---: | :--- |
| `NODE_ENV` | **Yes** | `production` |
| `PORT` | **Yes** | `10000` (Render default) or `5000` |
| `DATABASE_URL` | **Yes** | Internal connection string from Render PostgreSQL (e.g. `postgresql://user:pass@dpg-xxx-a:5432/timelogic_db`) |
| `REDIS_URL` | Optional | Internal connection string if using Render Redis (`redis://red-xxx:6379`). Leave unset to use the resilient in-memory fallback. |
| `DEEPFACE_URL` | **Yes** | HTTPS URL of your deployed Heroku DeepFace app (e.g. `https://timelogic-deepface.herokuapp.com`) |
| `INTERNAL_SERVICE_SECRET` | **Yes** | Strong random secret shared between Render Backend and Heroku DeepFace for request authentication |
| `JWT_ACCESS_SECRET` | **Yes** | Long cryptographic random string for signing 15-minute access tokens |
| `JWT_REFRESH_SECRET` | **Yes** | Long cryptographic random string for signing 7-day refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` (default) |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` (default) |
| `QR_SECRET_KEY` | **Yes** | Secret key for dynamic rotating attendance QR codes |
| `QR_DEFAULT_ROTATION_SECONDS` | No | `30` (default) |
| `BCRYPT_ROUNDS` | No | `12` (default) |
| `UPLOAD_DIR` | No | `/data/uploads` (if using Render Persistent Disk) or `uploads` |
| `MAX_FILE_SIZE_MB` | No | `5` (default) |
| `CORS_ORIGINS` | No | Comma-separated allowed frontend domains (e.g. `https://timelogic-superadmin.pages.dev,https://timelogic.pages.dev,https://timelogic-admin.pages.dev`) |
| `SMTP_HOST` | No | Custom SMTP host (e.g. `smtp-relay.brevo.com`) |
| `SMTP_PORT` | No | `587` |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password / API key |
| `SMTP_FROM` | No | `TimeLogic Notifications <noreply@timelogic.app>` |

---

## 2. Heroku DeepFace Microservice Environment Variables

Configure these under **Heroku Dashboard ➔ App (timelogic-deepface) ➔ Settings ➔ Config Vars**:

| Variable Name | Required | Description |
| :--- | :---: | :--- |
| `INTERNAL_SERVICE_SECRET` | **Yes** | Must match the exact `INTERNAL_SERVICE_SECRET` configured in Render |
| `PORT` | Auto | Set automatically by Heroku dyno runtime |
| `PYTHONUNBUFFERED` | No | `1` |
| `OMP_NUM_THREADS` | No | `1` |
