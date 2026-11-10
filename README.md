# AuraPlan — Calming Dark-Mode Day Flow & Task Scheduler

**AuraPlan** is a soothing, active dark-mode daily planner and real-time guidance web application. It takes your tasks and estimated times, intelligently balances them throughout the day with healthy restorative breaks, and actively tells you what to focus on at every single moment of your day.

---

## ✨ Key Highlights & Features

1. **Active Real-Time Guidance ("What to do Right Now")**:
   - **Live Clock & Present-Moment Engine**: Automatically detects the exact scheduled task or break for the current time.
   - **Live Progress & Countdown**: Shows exact time remaining in minutes and seconds, with an animated progress bar.
   - **Mindful Rest & Breathing Widget**: Whenever a break begins, a gentle expanding/contracting breathing ring guides you through restorative box breathing.
   - **Instant Actions**: Mark the current task complete with 1 click, add an instant +5-minute pause, or skip forward.

2. **Smart Task Input & Duration Tracking**:
   - Add tasks with custom titles, notes, and duration (quick pills for `15m`, `30m`, `45m`, `1h`, `1.5h` or custom minutes).
   - Categorize with peaceful visual badges:
     - 🎯 **Deep Work / Focus**
     - 🌱 **Routine & Habit**
     - 🎨 **Creative / Thinking**
     - 🏃 **Health & Fitness**
     - 💬 **Communication / Meetings**
     - ☕ **Rest & Recharge**
   - Energy levels: High, Medium, Low.
   - Optional fixed preferred start times or automatic optimal placement.

3. **Intelligent Day Allocation & Break Weaving**:
   - Automatically distributes your tasks smoothly across waking hours.
   - **Automatic Restorative Breaks**: Inserts 10-minute mindful breaks after deep work sessions (≥ 45 mins), plus a 45-minute lunch/meal break around midday.
   - **Start from Now** option: Instantly aligns the routine with your current local time so you can begin working immediately.

4. **Interactive Completion & Deletion**:
   - Check off tasks with smooth strikethrough animation, instant statistics update, and a calm celebration chime.
   - Delete tasks with immediate undo or update.
   - Edit any task's duration, title, category, or notes at any time.

5. **Calm, Pleasing Dark Aesthetic**:
   - Deep obsidian/midnight slate tones (`#07090e`, `#0f1422`).
   - Frosted glass cards with soft bioluminescent accents (calm cyan, emerald, lavender, amber).
   - Synthesized meditation bell / singing bowl audio using the native **Web Audio API** (100% offline, zero network assets).

---

## 🚀 How to Run the App

### Option 1: Open Directly in Your Browser
Simply double-click `index.html` or open it with macOS terminal:
```bash
open index.html
```

### Option 2: Run with Local HTTP Server
Run the built-in Python web server from this directory:
```bash
python3 -m http.server 3000
```
Then visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 File Structure
- `index.html` — Accessible, semantic HTML5 structure with modals, hero view, and timeline.
- `styles.css` — Modern, dark-mode CSS with glassmorphism, animations, and responsive layout.
- `app.js` — Self-contained ES6 application logic, smart scheduler, Web Audio bell synthesizer, and localStorage persistence.
- `README.md` — Documentation and guide.