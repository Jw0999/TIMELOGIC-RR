# TimeLogic Admin Attendance Station

A focused installable admin PWA for checking employees in and out. It uses the same administrator login and the same live backend as the desktop app.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Cloudflare Pages

Create a Pages project from this repository with:

- **Root directory:** `PWA2.0`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variable:** `VITE_API_URL=https://timelogic.onrender.com/api`

The app uses the authenticated administrator's organization when loading `/admin/manual-attendance`. The backend remains responsible for tenant isolation, active sessions, employee-password confirmation, server timestamps, and attendance persistence shared with the desktop app and other frontends.
