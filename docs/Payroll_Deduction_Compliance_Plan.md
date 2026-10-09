# TimeLogic — Payroll Deduction Compliance & Legal Safety Plan

## Executive Summary
In Nigeria (and most common-law jurisdictions), deductions from an employee's wages are strictly governed by statutory law (**Section 5 of the Nigerian Labour Act, Cap L1 LFN 2004**). Employers cannot arbitrarily levy punitive monetary fines or unilateral wage cuts without explicit contractual terms, statutory authorization, and due process.

Marketing and executing "automatic unreviewable salary deductions" creates legal exposure for both TimeLogic and its client organizations. 

This plan details how to transform TimeLogic's penalty and deduction features from a potential legal liability into a major enterprise selling point: **Audit-Ready Policy Compliance with Mandatory HR Pre-Payroll Review**.

---

## Phase 1: Marketing & Positioning De-Risking (Immediate)

### 1. Shift the Vocabulary
| ❌ High-Risk Terminology | ✅ Compliant & Enterprise Terminology |
| :--- | :--- |
| "Automatic salary deductions" | "Automated policy tracking & deduction proposals" |
| "Automatic punitive fines" | "Configurable policy violation flagging" |
| "Instantly cuts worker pay" | "Pre-payroll dispute & verification workflow" |
| "Enforced penalties" | "Audit-ready attendance & punctuality reconciliation" |

### 2. Marketing Positioning
Position TimeLogic as an **objective source of truth**, not an automated judge:
> *"TimeLogic accurately records every second of latency, absence, and overextended breaks. It generates structured, reviewable deduction proposals that HR administrators can inspect, adjust, or waive before payroll is finalized."*

### 3. Legal Software Disclaimer (Website & App Terms)
Add a clear disclaimer in the pricing, features, and footer legal terms:
> *"TimeLogic provides workforce presence recording and administrative tracking tools. All suggested adjustments, deductions, or policy flags must be reviewed and authorized by designated employer administrators in compliance with applicable local labor legislation and individual employment contracts."*

---

## Phase 2: Product Workflow & UI Architecture (The Review Gate)

To ensure clients never accidentally execute unlawful deductions, TimeLogic will implement a **3-Stage Pre-Payroll Review Gate**:

```
[Attendance Events Recorded]
             │
             ▼
[Staged Deduction Proposals] ── (Lateness, Extended Break, Unexcused Absence)
             │
             ▼
┌──────────────────────────────────────────────┐
│       HR Review & Adjudication Dashboard     │
│  - Review flagged incident timestamp         │
│  - Option to: [APPROVE] [ADJUST] [WAIVE]     │
│  - Add rationale (e.g., "Traffic waiver",    │
│    "Medical notice submitted")               │
└──────────────────────────────────────────────┘
             │
             ▼
[Final Approved Payroll Lock & Export]
```

### Specific Feature Specifications:
1. **Staged (Draft) vs. Finalized Payroll:**
   - Payroll calculations remain in a `Draft / Pending Review` state until an authorized HR Admin explicitly reviews and locks them.
2. **One-Click Deduction Waiver:**
   - Admins can waive any proposed deduction with a single tap and attach a pre-set reason (*"Excused by Supervisor"*, *"Approved Medical Absence"*, *"Facility Commute Delay"*).
3. **Statutory Deduction Cap Warning:**
   - In many labor codes, total deductions cannot exceed a certain percentage (e.g., 33.3% or one-third) of an employee's monthly basic wage. The system should display a visual alert if total cumulative deductions approach statutory ceilings.
4. **Transparent Employee Breakdown:**
   - Ensure the generated payslip itemizes base pay and distinct line items for unworked hours or approved deductions, giving employees clear visibility and reducing labor tribunal disputes.

---

## Phase 3: Legal & Regulatory Consultation Checklist (Nigerian Labour Act)

When presenting TimeLogic's deduction engine to a Nigerian employment lawyer or HR compliance specialist, ask these specific questions:

### 1. Pro-Rata Pay vs. Disciplinary Fines
* **The Legal Question:** Under Section 5 of the Labour Act, arbitrary fines are generally unlawful. Does calculating pay based strictly on *actual hours worked* (pro-rata reduction for late arrival or early departure) qualify as lawful non-payment of unearned wages, provided it is reflected in the employment contract?
* **Goal:** Ensure TimeLogic structures lateness calculations as *pro-rata unworked time adjustments* rather than *punitive fines*.

### 2. Contractual Consent & Employee Handbooks
* **The Legal Question:** What specific wording must an employer include in an employee's offer letter, contract of employment, or staff handbook to legally permit automated attendance-based deductions?
* **TimeLogic Value-Add:** Provide client organizations with a free, lawyer-approved **"Attendance & Payroll Policy Template"** they can adopt when deploying TimeLogic.

### 3. Notice and Dispute Window
* **The Legal Question:** Does the law require employers to provide a mandatory dispute window (e.g., 48 hours for an employee to contest a flagged absence or missed clock-out) before deductions are locked?
* **Software Alignment:** If required, TimeLogic can automatically give employees a 24–48 hour window to request an admin review of flagged events.

### 4. Overtime Offset Rules
* **The Legal Question:** Can an employee's authorized overtime hours legally offset lateness deductions within the same pay cycle?

---

## Phase 4: Implementation Milestones

| Milestone | Action Items | Target Timeline |
| :--- | :--- | :--- |
| **Step 1: Website Copy Audit** | Review and adjust marketing copy on `timelogics.tech` to highlight *"HR Review Gate"* and *"Audit Compliance"* instead of *"Automatic Penalties"*. | Week 1 |
| **Step 2: Legal Checklist Consultation** | Discuss the 4 questions above with a Nigerian labor law counsel or certified HR consultant. | Week 2 |
| **Step 3: UI Review Screen** | Ensure the admin dashboard has an explicit `Review & Confirm Deductions` step before final Excel/CSV payroll export. | Week 3 |
| **Step 4: Compliance Pack for Clients** | Release a 1-page *"TimeLogic Legal & HR Deployment Guide"* for onboarding businesses. | Week 4 |
