# Feature Specification & User Flows
### SUPER ADMINS · COMPANY ADMINS · KIOSK OPERATORS · EMPLOYEES · SYSTEM ENGINES
*Core features, how each works, and the step-by-step flow for every user type involved.*

`TimeLogic — Feature Specification & User Flows | 01`

---

## 01 — STATION KIOSK CHECK-IN & BIOMETRIC FACE VERIFICATION

Workers clock in or out directly at a dedicated station kiosk terminal using contactless facial biometrics. The kiosk captures the employee's face, executes real-time anti-spoof liveness verification, matches the 512-dimensional facial embedding vector against the organization's enrolled workforce, and registers attendance in under 800 milliseconds.

### EMPLOYEE
1. Step in front of the Station Kiosk camera frame.
2. In Privacy Mode: Type the first few characters of your employee name or work email into the lookup bar (or allow instant camera auto-detection).
3. Align face within the on-screen targeting reticle.
4. The system executes an automatic anti-spoof liveness check (head tilt / eye blink / 3D texture validation).
5. Receive immediate visual confirmation: Green checkmark, employee name, profile avatar, and verified timestamp.
6. The terminal displays current shift status and plays an audible success chime ("Approved - Clocked In").
7. Interface automatically resets after 7 seconds for the next worker in queue.

### KIOSK OPERATOR / SHIFT SUPERVISOR
1. Authenticate and unlock the Station Kiosk using Station Credentials or NFC Master Key.
2. Monitor the active check-in queue during peak shift transitions (morning rush / shift changeovers).
3. If an employee has biometric scanning difficulties (e.g., facial injury, heavy PPE, lighting issue), initiate Assisted Check-In to allow manual PIN or password verification.
4. Review flagged low-confidence scans and authorize supervisor overrides when necessary.

### COMPANY ADMIN / HR MANAGER
1. Navigate to Employee Management in the Admin Console and initiate Biometric Enrollment.
2. Capture three reference facial frames (front, slight left, slight right) to generate a high-precision 512-dimensional embedding vector.
3. Configure Station Matching Thresholds (e.g., strict 0.60 cosine similarity for high-security zones, 0.70 standard).
4. Assign authorized stations and physical gates where the employee is permitted to clock in.

### SYSTEM / BIOMETRIC ENGINE
1. Receive webcam/video stream frame at 1080p/720p.
2. Crop and normalize face bounding box via lightweight client-side or local edge model.
3. Execute DeepFace 512-dimensional vector embedding inference.
4. Perform cosine similarity vector search against locally cached active employee embeddings.
5. If cosine similarity meets threshold:
   - Create attendance record with timestamp, confidence score, and station ID.
   - Broadcast live attendance event over secure WebSocket (`ws://` / `wss://`) to desktop and admin dashboards.
6. If match is below threshold: Prompt employee to adjust lighting, remove dark glasses, or use PIN fallback.

---

## 02 — ZERO-DOWNTIME OFFLINE ATTENDANCE & BACKGROUND OUTBOX SYNC

The Station Kiosk operates with complete autonomy during internet outages, network jitter, or local grid failures. Clock-ins are cryptographically signed, stored in a local persistent IndexedDB / SQLite outbox, and reflected immediately in real-time kiosk headcount statistics (e.g., 7/7 present). The moment connectivity is restored, the kiosk silently batch-syncs the outbox with the central server with zero duplicate punches or data loss.

### EMPLOYEE
1. Step up to the Station Kiosk during an internet connectivity outage.
2. Look at the camera or enter your standard PIN.
3. The kiosk matches your credentials against the locally encrypted on-device employee cache.
4. Receive immediate visual confirmation: "Approved (Offline Queued)", along with personal shift status.
5. The on-screen active headcount counter increments immediately (e.g., 6/7 updates to 7/7 present), guaranteeing proof of presence.
6. Step away with full confidence that your shift start time is locked to the exact second.

### KIOSK OPERATOR / STATION SUPERVISOR
1. Observe the Station Kiosk status bar displaying the yellow "Offline Mode — Running Locally" badge.
2. Inspect the Offline Outbox widget showing the number of queued pending punches (e.g., "14 records pending sync").
3. Continue shift operations completely uninterrupted; no worker is held back or turned away.
4. Upon network restoration, observe the status badge turn green ("Online") and the outbox count flush automatically to zero.

### COMPANY ADMIN / HR MANAGER
1. Open the Live Dashboard on Desktop or Web Admin.
2. View station health indicators showing the last synced heartbeat timestamp for each terminal.
3. Once a disconnected kiosk reconnects, observe the automated audit log reconciliation: all offline punches populate chronologically without overriding or corrupting existing live records.
4. Review the "Offline Verified" badge on attendance timestamps for complete statutory transparency.

### SYSTEM / BACKGROUND SYNC ENGINE
1. The Kiosk network monitor (`navigator.onLine` and lightweight `/api/health` pings) detects network failure.
2. Switch network state to `OFFLINE` and route all subsequent attendance actions to the local `attendance_outbox` table in IndexedDB.
3. Update local state stores optimistically so headcount counters and recent logs reflect queued transactions immediately.
4. Maintain a persistent 15-second reconnection poll loop with exponential backoff.
5. Upon detecting active network:
   - Read all pending outbox records ordered by timestamp.
   - Dispatch an atomic payload to `POST /api/station/attendance/batch-sync` containing station authorization headers.
   - The backend server processes each record idempotently using unique client transaction IDs (`local_id` + timestamp deduplication).
   - Backend commits records to PostgreSQL, updates live shifts, and returns synced IDs.
   - Kiosk marks records as synced, clears the outbox, and emits real-time WebSocket notifications across all connected admin clients.

---

## 03 — ROTATING 30-SECOND DYNAMIC QR CODE ATTENDANCE

For hybrid teams, field staff, or mobile-first sites, the Station Kiosk or office wall-mount displays a high-security cryptographic QR code that regenerates every 30 seconds. Employees scan the dynamic code using their authorized TimeLogic Mobile App, which cross-references GPS geofencing and Wi-Fi BSSID parameters to eliminate buddy punching and proxy scanning.

### EMPLOYEE (MOBILE APP)
1. Open the TimeLogic Mobile App upon arriving at the workplace.
2. Tap "Scan Station QR" on the home screen.
3. Point phone camera at the dynamic QR code displayed on the office kiosk or wall terminal.
4. App captures the QR payload, packages it with device GPS coordinates and connected Wi-Fi BSSID, and transmits it to the server.
5. Receive instant haptic buzz and on-screen confirmation: "Clock-In Verified — Shift Started".

### KIOSK DISPLAY / STATION TERMINAL
1. Display the Dynamic QR screen mode with an animated 30-second circular countdown timer.
2. Regenerate a new cryptographic TOTP hash every 30 seconds.
3. When an employee scans successfully, briefly flash a discreet confirmation banner ("Employee Verified") without interrupting the QR rotation cycle.

### COMPANY ADMIN / HR MANAGER
1. Enable "Dynamic QR Mode" for specific branches, meeting rooms, or project job sites.
2. Define acceptable Geofence Radius (e.g., 50 meters) and Authorized Office Wi-Fi MAC/BSSID addresses.
3. View mobile punch logs flagged with precision coordinates and map pins for field-service verification.

### SYSTEM / CRYPTOGRAPHIC ENGINE
1. Backend or Station Terminal generates a short-lived HMAC-SHA256 encrypted payload containing `{ stationId, companyId, timestamp, nonce, secretKey }`.
2. Set hard Time-To-Live (TTL) of 30 seconds for each token.
3. Upon receiving a mobile scan request:
   - Validate token signature and confirm token age is `< 30s`.
   - Ensure the `nonce` has not been previously consumed (prevents replay attacks).
   - Cross-check device GPS latitude/longitude against authorized branch geofence boundary using the Haversine formula.
   - If Wi-Fi BSSID enforcement is active, verify matching router identity.
4. Commit verified attendance record and invalidate the token immediately.

---

## 04 — BREAK ROOM & SHIFT LIFECYCLE MANAGEMENT

Employees seamlessly transition between active work hours, paid meal breaks, and unpaid rest pauses. The system maintains accurate net-hours tracking, alerts supervisors to abandoned shifts or excessive breaks, and automatically calculates shift differentials.

### EMPLOYEE
1. Step up to the Station Kiosk or open the Mobile App during shift hours.
2. Authenticate via Face, PIN, or QR.
3. Select "Start Break" (Meal / Rest / Personal).
4. Shift timer pauses billable hours; kiosk displays a blue "On Break" badge next to your profile.
5. Upon returning, scan again and tap "Resume Work".
6. At shift conclusion, scan and tap "Clock Out" to receive a shift summary (Total Hours, Break Time, Net Work Duration).

### KIOSK OPERATOR / SHIFT SUPERVISOR
1. Monitor the live station floor status: distinct columns for "Active On Shift", "On Break", and "Clocked Out".
2. Identify employees who have exceeded scheduled break durations (e.g., break time > 45 minutes) via yellow visual alerts.
3. Assist employees who forgot to resume break or clock out through the Supervisor Action Console.

### COMPANY ADMIN / HR MANAGER
1. Define shift policies in the Admin Settings: Shift Start/End times, Paid vs. Unpaid Break allocations (e.g., 30-minute unpaid lunch, two 15-minute paid breaks).
2. Configure Auto-Clockout rules for abandoned shifts (e.g., automatically clock out worker after 14 hours if exit punch was missed).
3. Review department break compliance and labor utilization reports.

### SYSTEM / AUTOMATION ENGINE
1. Record exact ISO 8601 timestamps for `SHIFT_START`, `BREAK_START`, `BREAK_END`, and `SHIFT_END`.
2. Compute net active working hours: `Net Hours = (Shift Duration) - (Unpaid Break Time)`.
3. If an employee remains on break past the policy threshold, dispatch an automated notification to their mobile app and the shift supervisor.
4. Execute nightly cron reconciliation to close open shifts exceeding the maximum threshold, flagging them with `AUTO_CLOCKED_OUT` for manager review.

---

## 05 — AUTOMATED PENALTY, LATE TIERS & OVERTIME ENGINE

An automated rules engine that eliminates subjective attendance policing. Late arrivals are categorized into customizable grace periods and penalty tiers, calculating automatic salary deductions and overtime credits while providing a transparent dispute and waiver workflow.

### EMPLOYEE
1. Clock in past the scheduled shift start time.
2. The kiosk or mobile app displays a polite, transparent notification: "Clocked in at 08:18 (18 mins late — Tier 1 Late Arrival applied)".
3. View the breakdown of accumulated late minutes and potential salary impact on your Personal Portal dashboard.
4. If the delay was caused by an approved company errand or emergency, tap "Request Late Waiver", attach supporting reason/notes, and submit to HR.
5. Receive real-time push notification once HR approves or denies the waiver.

### COMPANY ADMIN / HR MANAGER
1. Configure Shift Grace Periods (e.g., 5-minute standard grace where no penalty applies).
2. Establish Tiered Late Penalty Rules:
   - *Tier 1 (6–15 mins late):* Warning flag / $0 deduction.
   - *Tier 2 (16–30 mins late):* Deduction of 30 minutes billable pay.
   - *Tier 3 (>30 mins late):* Deduction of 1 hour pay or half-day flag.
3. Open the "Attendance Disputes & Waivers" queue to review pending employee waiver submissions.
4. Approve with note (waives penalty immediately) or reject with explanation.

### PAYROLL OFFICER / FINANCE
1. Navigate to Payroll Integration at the end of the pay cycle.
2. Generate the Consolidated Attendance Ledger: base hours, verified overtime, unexcused tardiness deductions, and approved waivers.
3. Review flagged edge cases before finalizing.
4. Export finalized figures directly to CSV/Excel or sync via API to integrated payroll software (Gusto, QuickBooks, Paystack, ADP).

### SYSTEM / RULES ENGINE
1. On each clock-in event, compare actual punch timestamp against assigned shift start time.
2. If `Punch Time <= Scheduled Start + Grace Period`: Mark status as `ON_TIME`.
3. If `Punch Time > Scheduled Start + Grace Period`: Calculate `Late Minutes` and match against the active company penalty policy matrix.
4. Assign penalty tier and attach calculated financial deduction record.
5. If an admin approves a waiver, set `waiver_status = 'APPROVED'` and deduct penalty delta from payroll ledger dynamically.

---

## 06 — HARDWARE DEVICE BINDING & FLEET TERMINAL MANAGEMENT

Protect the enterprise against unauthorized terminal spoofing. Hardware kiosks and mobile stations are enrolled through cryptographic handshakes, hardware fingerprinting, and remote seat allocation, allowing centralized IT teams to manage fleets across hundreds of sites.

### KIOSK OPERATOR / IT INSTALLER
1. Power on the hardware tablet or kiosk machine and launch the TimeLogic Station App (Electron / PWA).
2. Select "Register New Terminal" and enter the one-time Station Setup Key provided by the company administrator.
3. Name the terminal (e.g., "Factory Gate North — Tablet 02") and grant camera and storage permissions.
4. App binds the physical device to the tenant and enters dedicated Kiosk Lock mode.

### COMPANY ADMIN / IT ADMINISTRATOR
1. Log in to the Admin Dashboard and open "Terminal & Fleet Management".
2. View all active registered terminals, their assigned branch locations, IP addresses, app versions, and last heartbeat timestamps.
3. Allocate available Station Terminal Seats based on subscription quota.
4. If a device is lost, damaged, or reassigned: Tap "Revoke Device" to immediately sever session tokens and remotely wipe cached biometric credentials.

### SUPER ADMIN (PLATFORM LEVEL)
1. Monitor global terminal fleet metrics across all client organizations.
2. Deploy over-the-air client updates and firmware compatibility patches.
3. Track station connection health and API latency across geographic regions.

### SYSTEM / AUTHENTICATION SERVICE
1. During station activation, collect hardware fingerprint hashes (WebCrypto device key, platform UUID, screen architecture).
2. Generate a dedicated Station Identity record in PostgreSQL and issue a long-lived 30-day Station JWT and 90-day Refresh Token.
3. On every API interaction, validate station token authenticity, active license status, and hardware signature.
4. Maintain automated token rotation every 30 days during live heartbeat checks.
5. If revocation is triggered, add station ID to the active Redis/memory token blacklist to block requests instantaneously.

---

## 07 — EXECUTIVE AUDIT LOGS, LIVE WEBSOCKET FEEDS & FRAUD ALERTS

High-level visibility for executives and compliance officers. Real-time WebSocket attendance wallboards provide instant headcounts, while an immutable, tamper-evident audit ledger flags biometric spoof attempts, impossible travel velocities, and ghost worker fraud.

### COMPANY ADMIN / HR EXECUTIVE
1. Open the "Executive Live Feed" on office TV monitors or desktop browser.
2. Watch the real-time stream of clock-ins across all corporate branches with zero refresh delay.
3. Filter by department, branch location, or exception status (late arrivals, absences, overrides).
4. Receive immediate desktop alerts if high-severity anomalies occur (e.g., same worker clocked in at two branches 50 miles apart within 10 minutes).
5. Generate signed PDF / CSV Statutory Audit Reports for labor union or government compliance reviews.

### SUPER ADMIN (PLATFORM OWNER)
1. Access the global platform security and threat intelligence wallboard.
2. Track facial anti-spoof rejection rates (e.g., photo-on-screen or printed mask attempts).
3. Investigate tenant security anomalies, suspicious API traffic spikes, or unauthorized token replay attempts.

### SYSTEM / SECURITY ENGINE
1. When an attendance event occurs, dispatch an event payload to the central WebSocket server.
2. WebSocket gateway fans out the event in `<50ms` to all authenticated supervisor dashboards subscribed to that company channel.
3. Execute automated fraud heuristics:
   - *Duplicate Punch Guard:* Block multiple punches by the same user within 60 seconds.
   - *Impossible Velocity:* Compare distance between successive punches; flag if speed exceeds 120 km/h.
   - *Spoof Detection:* Log all DeepFace anti-spoof liveness failures with captured evidence frame.
4. Append every administrative action (waivers, profile updates, manual clock-ins) to an immutable, append-only audit trail with admin user ID, timestamp, and IP address.

---

## PROPOSED FEATURE: AI-DRIVEN PREDICTIVE ROSTERING & FATIGUE/ANOMALY DETECTION
### UNDER EXPLORATION — NOT YET SCOPED FOR BUILD

A natural extension of TimeLogic’s existing biometric attendance telemetry and shift tracking engine. The system analyzes historical attendance patterns, peak workplace rush hours, employee absenteeism trends, and overtime accumulation to automatically generate optimized, fatigue-safe shift schedules while proactively warning managers of burnout and labor law violations.

### WHY THIS FITS TIMELOGIC
TimeLogic already captures the exact, indisputable operational truth — precisely when workers arrive, how long they work, how many breaks they take, and when operations experience labor shortages. Instead of forcing HR managers to manually plan schedules in external spreadsheets, Predictive Rostering turns historical attendance data into proactive, automated workforce scheduling inside the exact same platform.

### EMPLOYEE
1. Open the Mobile App to view upcoming AI-recommended shift rosters two weeks in advance.
2. Receive proactive fatigue alerts: "You have completed 48 hours this week across 5 consecutive shifts; system recommends a 24-hour rest period."
3. Request shift swaps directly in the app; the AI engine automatically validates that the swap candidate has matching skill qualifications and will not exceed overtime limits.
4. Confirm or request adjustments to scheduled shifts with one tap.

### HR PLANNER / OPERATIONS MANAGER
1. Open the "AI Rostering Studio" in the Admin Dashboard.
2. Select scheduling parameters: target shift coverage, required skill certifications, peak operational hours, and budget cap.
3. Click "Generate Optimized Schedule"; the engine creates a complete draft roster in seconds, balancing worker preferences against business requirements.
4. Review proactive anomaly flags: Highlight employees at risk of chronic absenteeism, excessive overtime penalties, or fatigue violations.
5. Publish finalized roster with one click, automatically notifying all affected employees.

### SYSTEM / MACHINE LEARNING ENGINE
1. Ingest historical punch logs, seasonal demand patterns, leave requests, and overtime metrics.
2. Run combinatorial optimization models to solve shift assignment constraints (labor law maximums, mandatory rest intervals, minimum staffing requirements).
3. Compute an "Anomaly & Burnout Risk Score" for each employee based on consecutive shift duration, short break frequency, and irregular clock-in trends.
4. Automatically adjust shift suggestions to distribute overtime equitably across qualified team members.

### OPEN QUESTIONS TO RESOLVE BEFORE BUILDING
1. **Jurisdictional Labor Law Compliance:** Labor standards and overtime ceilings vary drastically across operating regions (e.g., Nigerian Labor Act, US FLSA, EU Working Time Directive). The engine must support customizable, modular rule sets that can be hard-locked per jurisdiction.
2. **Employee Sentiment & Privacy:** Biometric fatigue estimation or burnout scoring must never feel like intrusive surveillance. Recommendations must be framed constructively as employee wellness safeguards and supervisor workload limits, with transparent explanation algorithms.
3. **Shift Fairness & Bias Prevention:** Automated scheduling algorithms must be audited to ensure unbiased shift distribution, preventing preferential allocation of premium overtime hours to specific worker subsets.
4. **Offline Roster Synchronization:** Rosters must be pre-cached on Station Kiosks and mobile devices so shift assignments remain fully accessible during offline network disconnects.

---
`TimeLogic — Feature Specification & User Flows | End of Specification`
