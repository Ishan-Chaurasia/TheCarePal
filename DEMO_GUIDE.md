# TheCarePal (FS-03) · 3-Minute Demo Video Recording Script

This step-by-step playbook is designed for your **2 to 5 minute submission video** to ensure you effortlessly demonstrate all 6 must-haves and P1 bonus features.

---

## 🎬 Video Recording Structure (Target: ~3:30 mins)

| Time | Segment | What to Show on Screen | What to Say |
|---|---|---|---|
| **0:00 – 0:30** | **Product & Problem** | Full-bleed Hero Sign-in screen (`http://localhost:5000`) | *"This is TheCarePal (FS-03). Families in distant cities want to know how their aging parent ate, took their medicines, and felt each day—not just raw numbers. Today that lives on paper notes. TheCarePal connects visiting nurses with families through a mobile-first daily log and an instant porcelain day sheet."* |
| **0:30 – 1:15** | **Nurse Logging & Live Alert** | Sign in as Nurse Rekha → Go to **Log round** | 1. *"Nurse Rekha logs her round. The time defaults to now and can be adjusted back."*<br>2. Type **152/96** for BP → point out the live out-of-range flag before saving.<br>3. Tap **Save vitals entry**.<br>4. Point to the instant red banner: **"Emergency email alert sent to family"** → Click **Preview Sent Email** to show the exact formatted clinical email! |
| **1:15 – 1:45** | **Offline Airplane-Mode Test** | Network offline test | 1. Open DevTools (F12) → Network → Select **Offline** (or toggle Wi-Fi).<br>2. Note the badge: **"Offline mode · 0 queued"**.<br>3. Log a snack meal and 20 min walk. Show both save instantly into device queue (badge says **2 queued**).<br>4. Switch back to **Online** → Tap **Sync now**.<br>5. Badge shows **"Synced 2 entries to server"** with zero duplicates! |
| **1:45 – 2:30** | **Family Dashboard & Day Summary** | Click **"Switch to Family (Neha)"** button in top bar | 1. *"Now I switch to daughter Neha Sharma in Bengaluru. Notice the top masthead: in 10 seconds, she reads the deterministic 2-sentence summary: 'Kamla had 3 of 4 doses. She ate breakfast and dinner fully... and had one high reading.'"*<br>2. Show the **Week Strip** with red alert ticks, and the **Timeline** with custom Plate Glyphs, Activity bars, and Nurse Rekha's observation note.<br>3. Point to the **Notification Bell** on top: open it to show the email alert Neha received for the high BP! |
| **2:30 – 3:15** | **Charts, Weekly Summary & PDF** | Tap **Charts** → Tap **Weekly summary** → Tap **Report** | 1. **Charts:** Show 7/30-day toggle, the calm Aqua Tint normal band, and the red diamond marking the out-of-range reading.<br>2. **Weekly summary:** Show medicine adherence %, meals completed (out of 21), activity minutes, and the 7-point mood trajectory with comparisons to last week.<br>3. **Report:** Click **Download 30-day PDF** → open the downloaded PDF showing clean vector charts, tables, and the doctor disclaimer footer. |
| **3:15 – 3:45** | **Code & Design Decisions** | Switch to IDE / VS Code | 1. Mention the **UI/UX Pro Max Skill** used for contrast ratios (11:1 Dark Stone on Porcelain), typography (Libre Caslon + Atkinson Hyperlegible for low vision), and strict anti-pattern avoidance.<br>2. Highlight clean Express + Node + React architecture with server-enforced RBAC and zero secrets. |

---

## 💡 Quick Tips for the Recording
- **One-Click Switcher:** Use the top-bar button `[Switch to Family (Neha)]` / `[Switch to Nurse (Rekha)]` to switch roles smoothly without logging out.
- **Email Viewer:** You never need to leave the tab—tapping **"Preview Sent Email"** or the **Bell icon** opens the rendered email with recipient, clinical details, and time.
