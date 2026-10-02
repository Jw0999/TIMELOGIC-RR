# Brand Identity & Design System Guide
### OFFICIAL SPECIFICATION · RELEASE 2.4 (ENTERPRISE)
*The definitive architectural standards, cryptographic brand tokens, visual language, and hardware installation guidelines for TimeLogic Enterprise Workforce Systems.*

`TimeLogic — Brand Identity & Design System Guide | 01`

---

## 01 — BRAND ESSENCE & THE 3-LAYER TRUST MODEL

TimeLogic was engineered to resolve the structural vulnerabilities of modern workforce tracking. Traditional attendance systems—paper registers, standalone fingerprint punch clocks, and generic mobile punch apps—suffer from pervasive buddy punching, proxy check-ins, and unverified work hours. TimeLogic establishes an immutable, zero-trust attendance architecture where every punch is cryptographically validated across three independent physical layers:

### Layer 01: Hardware-Bound Network Validation
Validates that the check-in originates exclusively from within the authenticated physical facility. The client device must be connected to the organization's designated Wi-Fi BSSID or enterprise static public IP. Remote attempts outside the network perimeter are rejected instantly.

### Layer 02: Device & Biometric Identity Lock
Enforces single-device hardware binding. Each employee account is permanently mapped to one approved smartphone or physical kiosk station. Integrated 512-dimensional facial recognition with interactive alignment frames ensures the enrolled worker is physically present.

### Layer 03: Time & Cryptographic QR Ephemerality
Employs ephemeral, 30-second rotating cryptographic QR tokens generated on hardware kiosks. Check-ins must fall within authorized operating shift windows and grace thresholds. Dynamic tokens prevent screen recordings, photos, and replay attacks.

---

## 02 — BRAND PILLARS & LOGO GOVERNANCE

A visual emblem designed for enterprise clarity, institutional trust, and high-velocity recognition.

### Four Brand Pillars
1. **Absolute Truth:** No estimated hours or buddy punches. Attendance records you can stand behind in court, union arbitrations, or statutory payroll audits.
2. **Frictionless Velocity:** Rapid check-in throughput under 800 milliseconds per employee, eliminating entry bottlenecks at busy factory gates.
3. **Immutable Auditability:** An append-only ledger logs every punch event, confidence score, station UUID, and geolocation coordinate permanently.
4. **Zero-Downtime Resilience:** Local IndexedDB/SQLite outbox guarantees attendance survival even during total ISP, power grid, or cloud server blackouts.

### Logo Clear Space & Minimum Sizing
The TimeLogic emblem must always be surrounded by clear space equal to the height of the central plus/clock nexus (`1.5x`). For digital display on station kiosks, the emblem must never appear below `32px` in height; for print and hardware engraving, minimum height is `12mm`.

---

## 03 — COLOR SYSTEM & CONTRAST MATRIX

The 60-30-10 palette architecture balances deep enterprise stability with electric high-contrast focus. The TimeLogic color architecture is grounded in an enterprise-grade B2B palette meeting WCAG AAA accessibility standards across desktop terminals, tablets, and sunlight-exposed factory gates.

| Color Token | HEX Code | Distribution | Usage Role |
| :--- | :--- | :--- | :--- |
| **TimeLogic Navy** | `#0A1638` | 60% Foundation | Primary dark surface, navigation headers, and kiosk backgrounds. |
| **Electric Blue** | `#2563EB` | 10% High-Contrast | Primary action buttons, active reticle borders, and accents. |
| **Pure Light Canvas** | `#F8FAFC` | 30% Structural | Base background for printable reports, tables, and admin UI. |
| **Emerald Verified** | `#10B981` | Semantic Success | Approved clock-in confirmation banners, online heartbeats, on-time indicators. |
| **Amber Warning** | `#F59E0B` | Semantic Notice | Offline queued outbox badge, grace period alerts, extended break warnings. |
| **Crimson Alert** | `#EF4444` | Semantic Alert | Biometric spoof rejection, late arrival penalty deductions, revoked terminals. |

---

## 04 — TYPOGRAPHIC MATRIX & DIGITAL UI TOKENS

High-legibility typography paired with ergonomic biometric feedback components.

### Typographic Hierarchy
* **Display Serif (`Instrument Serif` / `Georgia`):** Executive reporting titles, policy headlines, and brand editorial voice. Conveys legal authority, permanence, and institutional gravity.
* **Primary Sans (`Inter`):** All functional UI components, employee roster names, buttons, modal dialogs, and body text. Engineered for supreme legibility on low-cost LCD kiosk screens.
* **Monospace (`JetBrains Mono`):** Cryptographic token hashes, station UUIDs, ISO 8601 timestamps, GPS coordinates, and mathematical late-deduction figures.

### Core Digital Interface Tokens
* **Biometric Reticle:** Circular targeting frame with dynamic pulse animation. Flashes electric blue during face acquisition, green (`#10B981`) upon verification, and red (`#EF4444`) upon spoof detection.
* **Acoustic Chime:** Two-tone rising major third (C5 to E5, 120ms duration) indicates approval; low double flat fifth buzz indicates retry.
* **Automatic Queue Reset:** The kiosk confirmation modal resets after exactly 7 seconds to maintain rapid shift turnover.

---

## 05 — HARDWARE INSTALLATION & TOKEN GOVERNANCE

Physical deployment specifications to ensure flawless computer vision and security.

### 1. Kiosk Camera Height & Angle
The primary camera sensor must be mounted between 140cm and 150cm from finished floor level, angled upward by 5° to 8°. This accommodates 99% of workers (heights 150cm to 195cm) without requiring uncomfortable crouching or neck craning.

### 2. Ambient Lighting & Backlight Mitigation
Maintain ambient facial illumination between 300 and 600 Lux. Stations must never face open exterior doorways or unshaded windows directly to prevent extreme backlighting silhouetting that degrades computer vision confidence scores.

### 3. Station Token Rotation & Anti-Replay TTL
Kiosks receive 30-day Station JWT access tokens backed by 90-day Refresh Tokens stored exclusively in secure on-device storage. Dynamic QR attendance codes rotate on a strict 30-second TTL with single-use nonce destruction.

### 4. Tamper-Proof Kiosk Shells & Port Lockdown
Physical tablet enclosures must feature Kensington security lock slots and conceal physical USB and power ports. Kiosk software must run in single-app pinned mode with OS gesture bars and shortcuts disabled.

---
`TimeLogic — Brand Identity & Design System Guide | End of Guide`
