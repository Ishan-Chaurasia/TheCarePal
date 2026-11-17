# TheCarePal · Family Care Dashboard & Daily Care History (Task FS-03)

> **Submission for TheCarePal Technical Evaluation (Task FS-03)**  
> **Author:** Ishan Chaurasia (`@Ishan`) · **Date:** November 17, 2026  
> **Product in one line:** *The nurse records the day once, on a phone, in about three minutes. The family opens one screen and understands the day in about ten seconds.*

---

## 📑 Table of Contents
1. [Overview & Problem Statement](#overview--problem-statement)
2. [Demo Accounts & Quickstart](#demo-accounts--quickstart)
3. [Core Must-Haves (6 of 6 Shipped)](#core-must-haves-6-of-6-shipped)
4. [Good-to-Haves Implemented (P1)](#good-to-haves-implemented-p1)
5. [Design System & UI/UX Pro Max Skill](#design-system--uiux-pro-max-skill)
6. [Architecture & Technical Stack](#architecture--technical-stack)
7. [Security, Privacy & Accessibility](#security-privacy--accessibility)
8. [AI Tools Used & Workflow Documentation](#ai-tools-used--workflow-documentation)
9. [What We Would Build Next](#what-we-would-build-next)
10. [Medical Disclaimer](#medical-disclaimer)

---

## 1. Overview & Problem Statement

Families caring for aging parents across distance—such as a daughter living in Bengaluru with an elderly mother living in Bhopal—frequently face a profound information gap. They need to know whether their parent ate well, took their prescribed medicines on time, stayed physically active, and was in good spirits, not merely what their morning blood pressure was. Today, that vital context is locked in handwritten paper charts that family members never get to see.

**TheCarePal (FS-03)** replaces that paper trail with an accessible, high-contrast, dual-role web application:
- **For visiting nurses:** An ultra-fast, mobile-first daily logging sheet designed for one-handed operation on a 360px phone screen, with instant out-of-range visual feedback, independent auto-saving, and offline queuing.
- **For families:** An editorial masthead and porcelain day sheet that conveys the entire day's care status in under 10 seconds, featuring a deterministic plain-English summary, 7/30-day vital charts with shaded normal bands, weekly adherence trends, and a downloadable, printer-friendly 30-day clinical PDF report for doctor consultations.

---

## 2. Demo Accounts & Quickstart

The repository comes pre-loaded with **45 days of rich, synthetic clinical history** (720+ entries from October 4, 2026 to November 17, 2026) for patient **Kamla Sharma (78)**, featuring realistic physiological fluctuations (hypertension drifts, post-meal glucose spikes, mood variations, and documented missed doses).

### Demo Credentials
| Role | Name | Email | Password | Access Scope |
|---|---|---|---|---|
| **Nurse** | Rekha Yadav | `nurse@thecarepal.com` | `NursePass123!` | Assigned Patient: Kamla Sharma (Full logging, same-day edit/delete) |
| **Family** | Neha Sharma | `family@thecarepal.com` | `FamilyPass123!` | Linked Patient: Kamla Sharma (Read-only timeline, charts, PDF download) |

### Setup & Run in 60 Seconds

```bash
# 1. Clone repository
git clone https://github.com/nextlevelbuilder/CarePal.git
cd CarePal

# 2. Install all dependencies (root, server, and client)
npm install
npm install --prefix server
npm install --prefix client

# 3. Seed synthetic demo database (creates demo users, patient, & 45 days of care history)
npm run seed

# 4. Start full-stack application (runs both backend API on :5000 and Vite frontend on :5173)
npm run dev
```

Open your browser to: **`http://localhost:5173`** (or **`http://localhost:5000`** in production).

> [!NOTE]
> **Zero-Config Storage:** The backend features an intelligent dual-mode database engine. If a `MONGO_URI` is supplied in `.env`, it connects to MongoDB via Mongoose. If no external MongoDB daemon is running locally, it seamlessly falls back to a built-in file-persisted JSON database (`server/data/store.json`). It works 100% out-of-the-box on any machine without installing database software.

---

## 3. Core Must-Haves (6 of 6 Shipped)

All six P0 requirements from PRD FS-03 are demonstrably implemented and tested:

### A1–A3: Authentication & Role-Based Access Control
- **Dual-role authentication:** Nurse and family logins with secure bcrypt password hashing and session tokens delivered via `httpOnly`, `sameSite: 'lax'` cookies.
- **Server-side authorization enforcement:** Authorization is enforced at the API route layer by patient assignment. A family token attempting to call a write endpoint receives a hard `403 Forbidden`; a nurse token targeting an unlinked patient receives `403 Forbidden`.
- **Zero secrets committed:** All credentials and secrets are managed via `.env`, with a comprehensive `.env.example` committed.

### N1–N9: Nurse Daily Log
- **Vitals logging (N1):** Blood pressure (systolic/diastolic in mmHg), pulse (bpm), oxygen SpO2 (%), blood sugar (mg/dL with fasting, before-meal, and after-meal tags), temperature (°F), and weight (kg). Includes **live out-of-range feedback** that alerts the nurse before saving.
- **Meals & hydration (N2):** Meal category (breakfast, lunch, dinner, snack), free-text meal items, 5-step portion control (none, 1/4, 1/2, most, all), and quick-add water intake buttons (+100ml sip, +250ml glass) with a running daily hydration counter.
- **Medicines & adherence (N3):** Patient's scheduled doses displayed with scheduled times. One-tap "Mark given" or "Mark missed" with mandatory reason capture (e.g., "Refused", "Unavailable", "Nauseous", "Sleeping").
- **Activity & mood (N4, N5):** Walk, exercise, physiotherapy, or outing with minutes duration and notes. 5-step mood scale (Low, Down, Steady, Good, Cheerful) with optional contextual notes.
- **Clinical observations (N6):** Nurse's free-text notes displayed verbatim in the family timeline.
- **Customizable care time (N7):** Time defaults to the current clock time but can be adjusted to an earlier time today so rounds written up at the end of a shift retain their true clinical sequence.
- **Same-day audit trail (N8):** Entries can only be edited or deleted by their author on the calendar day of care. Every edit or deletion logs an immutable audit trail (`before`, `after`, `editor`, timestamp) accessible to family and clinicians.
- **Independent entry saving (N9):** Each section saves independently with explicit visual state feedback ("Saving…", "Saved", or "Failed"). A network failure never clears typed data.

### F1: Day Care Timeline
- Chronological timeline displaying all vitals, meals, medicines, activities, moods, and notes in clock sequence.

### F2: Deterministic Day Summary
- Two-sentence summary generated by **fixed deterministic business logic** (strictly no AI hallucinations), e.g.:
  > *"Kamla had 3 of 4 doses. She ate breakfast and lunch fully, walked 25 minutes and had one high reading."*

### F3: Persistent Week Strip & Jump-to-Date Calendar
- Always-visible week strip (Mon–Sun) with red indicator ticks for days with out-of-range vitals or missed doses. Includes a month calendar modal to jump across the 45-day clinical history in one tap.

### F4: Vital Trend Charts
- Interactive Recharts small multiples over 7-day and 30-day windows.
- Features shaded normal target bands (`#D3ECF0` Aqua Tint).
- Out-of-range readings are marked with **distinct red geometric diamonds (`#B3261E`) with values printed directly beside them**, never relying on color alone.
- Blood pressure plots systolic and diastolic series simultaneously on a shared axis.

### F5: Weekly Summary & Adherence Trends
- Evaluates the 4 core weekly measures:
  1. **Medicine adherence %:** Doses given divided by doses scheduled.
  2. **Main meals completed:** Main meals eaten most or fully out of the 21-meal weekly target.
  3. **Activity minutes:** Cumulative duration of physical exercise and physiotherapy.
  4. **Mood trajectory:** 7-point line chart with weekly calculated average.
- Automatically computes and displays deltas from the preceding week (+5% adherence, -1 meal, etc.).

### F6: Doctor's 30-Day Clinical PDF Report
- Generates a clinical-grade PDF report using PDFKit.
- Designed specifically for **black-and-white printing** on clinic printers: uses high contrast, geometric symbols (`[!]`, `[x]`), and explicit text tags so no diagnostic data is lost without color.
- Includes patient demographics, known conditions, vitals min/max/average tables, full out-of-range incident log, weekly medication adherence, and nurse clinical observation excerpts.
- Mandatory legal footer on every page: *"Recorded by care staff. Not a diagnosis. Reference ranges are demo defaults."*

---

## 4. Good-to-Haves Implemented (P1)

- **Email Alerts for Out-of-Range Readings & Missed Doses (F7):** The backend automatically dispatches alerts when a vital exceeds safe thresholds or a medicine is missed, storing alert receipts in the database to prevent duplicate notifications.
- **Photo Attachments in Timeline (N11, F8):** Nurses can attach photos (meals, walking sessions, recovery progress) with instant thumbnail rendering in the family timeline and a full-size modal preview.
- **Offline Resilience & Queue (N10):** The nurse logging form functions seamlessly without an active connection. Entries are queued locally in browser storage with unique client IDs and automatically synchronized when connectivity returns, avoiding duplicate records.

---

## 5. Design System & Healthcare Accessibility

The user experience and visual language follows a bespoke senior-healthcare design system ([design-system/carepal](file:///design-system/carepal/MASTER.md)), enforcing strict healthcare accessibility criteria:

### Color Palette Architecture
| Token Name | Hex Code | Contrast Ratio | Role & Application |
|---|---|---|---|
| **Porcelain** | `#F1F3F2` | Base Canvas | Page background, day sheet canvas, text on dark stone |
| **Stone Light** | `#D9D3CA` | Structural | Hairlines, week-strip borders, quiet card edges |
| **Warm Stone** | `#A89E91` | Secondary | Icons, chart gridlines, neutral badge borders |
| **Dark Stone** | `#3A342D` | **11:1 on Porcelain** | Body typography, masthead band, photograph scrim |
| **Aqua Blue** | `#46B3C6` | Marks Only | Chart lines, activity duration bars. **Never used for text** |
| **Deep Aqua** | `#17707F` | **5:1 on Porcelain** | Buttons, links, focus rings, prominent headings |
| **Aqua Tint** | `#D3ECF0` | Shading | Normal range band on vital charts and range micro-rulers |
| **Correction Red** | `#B3261E` | **5.8:1 on Porcelain** | Out-of-range readings and missed doses only |

### Typography
- **Hero & Day Masthead:** `Libre Caslon Text` / `Libre Caslon Condensed` with tight letter spacing (`-0.01em`) and line height (`0.95`–`1.0`).
- **Body & Data:** `Atkinson Hyperlegible` (developed by the Braille Institute for low vision, ensuring legibility for seniors and family members checking on phones).
- **Tabular Figures:** Numbers formatted with `font-variant-numeric: tabular-nums` for aligned vital comparisons.

### Strict Anti-Patterns Avoided
1. ❌ **No emojis as icons** (crisp SVG icons via Lucide).
2. ❌ **No aqua gradients, glows, or glassmorphism** (flat aqua tones only).
3. ❌ **No big numbers with tiny labels and background gradients**.
4. ❌ **No rows of identical rounded cards with floating drop shadows**.
5. ❌ **No scroll-triggered fade animations** (motion answers user taps only).
6. ❌ **No color-only status indicators** (every alert couples color with geometric symbols and textual descriptors).

---

## 6. Architecture & Technical Stack

```
┌────────────────────────────────────────────────────────┐
│               Browser: React 19 (Vite)                 │
│  - Hero Sign-In (Family/Nurse Role Switcher)           │
│  - Family Care Timeline & Deterministic Summary        │
│  - Recharts Vitals with Shaded Aqua Tint Normal Bands  │
│  - Nurse Daily Round Sheet with Live Validation        │
│  - Offline Queue (IndexedDB / LocalStorage)            │
└───────────────▲────────────────────────▲───────────────┘
                │ writes                 │ reads / PDF
┌───────────────▼────────────────────────▼───────────────┐
│               Server: Node.js & Express API            │
│  - Cookie Session Auth & Patient-Link RBAC             │
│  - Zod Request Schema Validation                       │
│  - PDFKit Doctor 30-Day Clinical Vector Report         │
│  - Event Alert Dispatcher                              │
└───────────────▲────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────┐
│               Database Layer                           │
│  - MongoDB Atlas (Mongoose) when MONGO_URI is set      │
│  - Zero-Config Embedded JSON Store fallback            │
└────────────────────────────────────────────────────────┘
```

---

## 7. Security, Privacy & Accessibility

- **Input Sanitization:** All incoming payloads are strictly validated using Zod schemas with physiological bounds checks (rejecting biologically impossible values).
- **Transport Security:** Passwords hashed with bcrypt (salt rounds = 10); sessions stored in encrypted JWTs within `httpOnly`, `sameSite` cookies.
- **Accessibility Floor:**
  - 44×44px minimum touch targets across all controls, buttons, and meal portion selectors.
  - 2px solid Deep Aqua (`#17707F`) focus rings visible for full keyboard navigation.
  - WCAG AAA contrast ratios (Dark Stone on Porcelain exceeds 11:1).

---

## 8. AI Tools Used & Workflow Documentation

In accordance with TheCarePal evaluation criteria, AI tooling was leveraged methodically:

1. **Antigravity AI (Google DeepMind):** Used as an architectural pair programmer to coordinate requirements extraction, API route implementation, React component authoring, and test automation.
2. **Design System & Contrast Architecture:** Formulated custom semantic tokens (Porcelain, Dark Stone, Deep Aqua, Aqua Tint) enforcing WCAG AAA contrast ratios (11:1 for body copy), 44px minimum touch targets, and specialized typography (Libre Caslon Text & Atkinson Hyperlegible by the Braille Institute).
3. **No Unaudited Code:** Every single component, schema, and API route was reviewed, tested against automated test scripts (`test-routes.js`), and verified in the browser.

---

## 9. What We Would Build Next

1. **Devanagari Localization:** Incorporate `Noto Sans Devanagari` strings for Hindi-speaking caregivers and grandparents.
2. **WebRTC Video Check-in:** A secure, one-tap morning video greeting between family and parent embedded in the timeline.
3. **Operations & Roster Management:** Clinic-side shift scheduling, nurse attendance tracking, and family subscription billing.
4. **Push Notifications:** Native Web Push / SMS alerts via Twilio for critical out-of-range vital escalations.

---

## 10. Medical Disclaimer

> **IMPORTANT DISCLAIMER:**  
> TheCarePal is an observational care tracking and family communication platform. It records and visualizes observations logged by visiting care staff and does **not** provide medical diagnosis, clinical advice, or drug prescription recommendations. Reference ranges shown in the application are synthetic demonstration defaults. Families must consult licensed medical practitioners for clinical treatment.
