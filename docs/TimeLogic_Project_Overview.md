# Project Overview & System Architecture
### MULTI-PLATFORM BIOMETRIC WORKFORCE & ATTENDANCE ECOSYSTEM
*A comprehensive technical blueprint and architectural specification of TimeLogic — encompassing DeepFace computer vision, zero-downtime offline kiosks, cryptographic dynamic QR tokens, automated penalty engines, and enterprise cloud infrastructure.*

`TimeLogic — Project Overview & System Architecture | 01`

---

## 01 — EXECUTIVE OVERVIEW & PLATFORM MAP

A unified workforce platform engineered to eradicate proxy attendance and payroll fraud. TimeLogic bridges the gap between physical workplace presence and digital payroll automation. By unifying specialized edge hardware terminals with a high-availability cloud backend, TimeLogic delivers instantaneous, tamper-proof workforce tracking across five interconnected applications:

### 1. Kiosk Station PWA 2.0 (Contactless Facial Kiosk)
React 18 / Vite PWA running on wall-mounted tablets and all-in-one PCs. Features 800ms biometric matching, privacy search mode, audio pings, and complete offline outbox autonomy.

### 2. Desktop Admin App (Station & Supervisor Console)
Electron-powered cross-platform desktop application (Windows .exe, Arch Linux/Pacman, Debian .deb). Enables on-site supervisor manual overrides, student tracking, and live audit wallboards.

### 3. Mobile Employee App (Hybrid & Field Worker Client)
React Native / Expo Android application. Features dynamic 30-second rotating QR scanning, GPS geofencing perimeter validation, shift requests, and personal attendance ledgers.

### 4. Super Admin & Web Portal (Enterprise Control Center)
Next.js / React management portal for company HR directors and multi-tenant platform administrators. Governs shift policies, late penalty tiers, biometric enrollment, and payroll sync.

### 5. Centralized Cloud API & DeepFace Biometric Cluster
Node.js Express application running on Heroku (v23 release) with PostgreSQL 16, Redis 7, and dedicated Python DeepFace microservices.

---

## 02 — END-TO-END SYSTEM TOPOLOGY & PIPELINES

Distributed edge-to-cloud architecture designed for high concurrency and sub-50ms live updates.

```
[ Client Layer: Kiosks, Electron Desktops, Mobile Apps, Web Dashboards ]
                              │ HTTPS (TLS 1.3) / WebSockets (WSS)
                              ▼
[ Cloudflare Edge: Global CDN, SSL Termination, Anti-DDoS, Static PWA Caching ]
                              │ Authenticated REST API & WS Stream
                              ▼
[ Heroku Cloud API: Node.js / Express 4.x Application Cluster (v23) ]
       ├── Biometric Vector Query ──▶ [ DeepFace Python AI Service (OpenCV / PyTorch) ]
       ├── Persistent Storage ──────▶ [ PostgreSQL 16: Multi-Tenant Database ]
       └── Cache & Pub/Sub ─────────▶ [ Redis 7: Dynamic QR Nonces & Token Blacklist ]
```

### Real-Time Event Propagation via WebSocket
Every confirmed punch, manual override, or security flag is immediately broadcast through a centralized WebSocket hub in `<50ms`, updating supervisor live wallboards across branches instantaneously without polling overhead.

### Multi-Tenant Data Isolation
All database queries strictly enforce organization-level tenant partitioning (`company_id` scoping), preventing data leakage between corporate clients across shared cloud infrastructure.

---

## 03 — COMPUTER VISION & DEEPFACE INFERENCE

High-speed facial verification driven by 512-dimensional embedding vectors and live anti-spoofing.

* **512-d Mathematical Signatures:** During onboarding, 3 reference facial frames are transformed into a normalized 512-float vector. Only irreversible numerical representations are stored in PostgreSQL, ensuring total privacy.
* **Passive Texture & Depth Analysis:** Neural network heuristics detect micro-motion, spectral frequency distributions, and moiré screen patterns, immediately rejecting printed photos, tablet screens, and silicone masks.
* **Cosine Similarity Vector Search:** Vector distance is evaluated via cosine similarity: `sim = (A · B) / (||A|| ||B||)`. High-security gates enforce strict thresholds (>0.65), while standard kiosks operate at 0.60.
* **Sub-800ms Latency Budget:** Client-side lightweight Haar/SSD cascades detect face bounding boxes before frame transmission, slashing payload size and achieving total matching throughput under 800 milliseconds.

---

## 04 — ZERO-DOWNTIME OFFLINE KIOSK ENGINE

Autonomous local persistence guarantees attendance tracking during total network blackouts.

### 1. IndexedDB & SQLite Local Outbox Storage
All check-in transactions occurring during an outage are cryptographically timestamped and queued locally in the browser's persistent IndexedDB or Electron's SQLite database under the `attendance_outbox` table.

### 2. Optimistic Real-Time Headcount Integrity
The kiosk UI maintains optimistic local headcount counters (e.g. 7/7 present) by overlaying queued outbox punches on top of the cached employee roster. Workers and floor supervisors receive immediate, verified confirmation without delay.

### 3. Idempotent Batch Synchronization Protocol
A background reconnection daemon polls the server every 15 seconds. Upon network restoration, all queued punches are dispatched to `POST /api/station/attendance/batch-sync`. The backend verifies client UUIDs, prevents duplicate punches, updates PostgreSQL, and clears the outbox.

### 4. Extended Token Longevity & Auto-Rotation
Station terminals are issued 30-day Station JWT access tokens backed by 90-day Refresh Tokens, ensuring kiosks remain operational and authenticated even through extended multi-week site disconnects.

---

## 05 — DYNAMIC ROTATING QR & PENALTY ENGINE

Cryptographic mobile clock-in combined with automated tardiness and payroll deduction logic.

* **30-Second HMAC TOTP Tokens:** The kiosk screen renders a rotating cryptographic QR code regenerating every 30 seconds. Encrypted payloads contain station UUID, UNIX epoch, and single-use nonces to defeat photo/video relay attacks.
* **Haversine GPS & Wi-Fi BSSID Validation:** When a mobile worker scans the code, device GPS coordinates are validated against the branch boundary (<50m radius) alongside authenticated enterprise Wi-Fi router BSSIDs.
* **Multi-Tier Penalty Deductions:** Arrivals past the shift grace period trigger automated tiered deductions: Tier 1 (warning), Tier 2 (30-min pay deduction), Tier 3 (1-hour pay deduction), calculated directly against hourly pay rates.
* **One-Click ERP Synchronization:** Pre-built connectors synchronize finalized hours, overtime multipliers, and late penalties into Gusto, QuickBooks, Paystack, and ADP, eliminating hundreds of manual HR calculation hours.

---

## 06 — HARDWARE FLEET CONTROL & AUDIT WALLBOARDS

Centralized terminal enrollment, remote seat governance, and real-time fraud telemetry.

* **Cryptographic Hardware Device Binding:** Kiosk machines are enrolled using single-use Station Setup Keys. The backend extracts hardware fingerprints (WebCrypto platform UUIDs, screen architecture) to bind the physical device to the tenant. Devices cannot be cloned or moved without administrative re-authorization.
* **Instant Remote Station Revocation:** If a tablet or kiosk is lost, damaged, or decommissioned, an administrator taps "Revoke Device" in the web dashboard. The station ID is immediately pushed to the Redis distributed token blacklist, severing session access across the cluster in <1 second.
* **Tamper-Evident Append-Only Audit Trail:** Every administrative action (manual punches, shift modifications, waiver approvals, threshold adjustments) is written to an immutable audit ledger containing operator ID, ISO timestamp, IP address, and previous/new state values for full compliance reviews.
* **Automated Fraud Heuristics:** The security engine continuously evaluates real-time punch feeds, automatically flagging impossible travel velocities (punches at distant branches within minutes), repeated failed biometric liveness attempts, and duplicate punch bursts.

---

## 07 — PRODUCTION INFRASTRUCTURE & SLA GOVERNANCE

Enterprise cloud infrastructure engineered for 99.99% operational continuity.

### 1. High-Availability Container Topology
Deployed across redundant Heroku Eco-Dynos and managed PostgreSQL clusters (v23 release). Traffic is routed through Cloudflare Enterprise CDN with automatic edge SSL termination, Brotli compression, and DDoS protection.

### 2. Zero-Downtime Rolling Releases
GitHub Actions CI/CD pipeline triggers automated unit tests, linting, and database migration checks before executing rolling container replacements, guaranteeing uninterrupted attendance tracking during updates.

### 3. Automated Continuous Snapshots & WAL Archiving
PostgreSQL Write-Ahead Logging (WAL) and automated point-in-time recovery enable immediate database restoration with zero data loss. Encrypted multi-region cold backups run daily.

### 4. 99.99% Availability & Priority Support
Enterprise contracts guarantee 99.99% cloud API uptime, 24/7 dedicated solutions engineering response within 15 minutes for critical incidents, and scheduled quarterly security audits.

---
`TimeLogic — Project Overview & System Architecture | End of Blueprint`
