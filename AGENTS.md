# AGENTS.md

Guidance for AI coding agents (and humans) working in this repository.

This is a small, single-page Next.js app: a timetable browser for a course that
alternates between **Week A / Week B** ("Settimana A / Settimana B") across three
terms ("T1", "T2", "T3"). Almost all behaviour lives in three files, so read those
before changing anything:

| File | Role |
| --- | --- |
| `src/app/page.jsx` | The whole UI: filter state (term + week), day grid, class cards |
| `src/components/CurrentWeek.jsx` | Week badge + the date-picker calendar popup |
| `src/lib/academicWeeks.js` | The one shared function that resolves a date to a week |

---

## 1. Commands

```bash
npm run dev     # dev server (Turbopack)  -> http://localhost:3000
npm run build   # production build + static prerender
npm run start    # serve the production build
npm run lint     # eslint (flat config, eslint-config-next/core-web-vitals)
```

There is **no test framework installed**. Verification is `lint` + `build` + a
headless-browser walkthrough — see [§7 Verification workflow](#7-verification-workflow-no-test-framework).

## 2. Stack & conventions

- **Next.js 16.2.9**, App Router, **React 19.2.4**.
- **Plain JavaScript / JSX.** No TypeScript (`jsconfig.json` only, no `tsconfig`).
- Path alias `@/*` → `./src/*` (declared in `jsconfig.json`, so plain Node cannot
  resolve those imports — see §7.2).
- **Tailwind CSS v4** (`@tailwindcss/postcss`, `src/app/globals.css`). Utility
  classes only, no `tailwind.config.*` file — custom values are used inline.
- `reactCompiler: true` in `next.config.mjs` (React Compiler auto-memoizes), but
  callbacks passed into effects are still memoized explicitly with `useCallback`
  (see `handleInfoChange` in `page.jsx`) so effects with the callback in their
  dependency list don't re-fire on every render.
- ESLint flat config (`eslint.config.mjs`). `npm run lint` must stay clean.
- **Comments and UI labels are Italian**; `dayOfWeek` values in data are English.
- Windows + PowerShell environment. Git is configured `core.autocrlf=true`, so
  "LF will be replaced by CRLF" warnings are normal and harmless.

## 3. File map

```
src/
├─ app/
│  ├─ layout.jsx          Root layout: Geist fonts, <html lang="en">, metadata
│  │                      (title "Orari GD Biennio"), body flex column
│  ├─ page.jsx            THE app. "use client". Holds activeTerm/activeWeek
│  │                      state, filters db.json, renders the day grid.
│  │                      Also defines the ClassCard sub-component.
│  ├─ globals.css         Tailwind entry (488 bytes)
│  └─ favicon.ico
├─ components/
│  └─ CurrentWeek.jsx     CurrentWeekIndicator (default export): week badge,
│                          📅 date button, CalendarPopup (mobile modal + desktop
│                          dropdown), CalendarGrid (month view). Owns the
│                          `selected` date state.
└─ lib/
   ├─ academicWeeks.js    getWeekInfo(date) — shared week resolver (ESM module)
   ├─ weeks.json          The academic calendar (38 entries, 2026-09-28..2027-06-20)
   └─ db.json             The classes (16 entries)
```

Everything renders on the single route `/`. The layout has no nav; the only
"pages" are the term/week filters and the date picker.

---

## 4. Core logic

### 4.1 The academic calendar (`src/lib/weeks.json`)

A flat array of **contiguous, non-overlapping 7-day ranges** (Mon → Sun), in
chronological order, with no gaps:

```json
{ "start": "2026-10-05", "end": "2026-10-11", "week": 2, "term": "T1" }
```

- `start` / `end` are `YYYY-MM-DD`, inclusive. Every range is exactly 7 days.
- `week` is a **continuous 1..30 counter across the whole year** (it does *not*
  restart per term): 1–10 in T1, 11–20 in T2, 21–30 in T3.
- `term` is `"T1" | "T2" | "T3" | "Break"`.
- Holiday blocks are `week: 0` + `term: "Break"`. There are 8 such entries
  (Christmas/Easter), each of them a *range* of whole weeks.
- Span: `2026-09-28` → `2027-06-20`. Anything outside returns "no week".

### 4.2 The A/B rule (the important invariant)

> **Odd `week` number → Settimana A. Even `week` number → Settimana B.**
> `week: 0` (Break) or a date outside the calendar → **no week** → the UI falls
> back to **Settimana A**.

This is the only place week parity is decided: `src/lib/academicWeeks.js`.

```js
const isA = active.week % 2 !== 0;
return { term, week, type: isA ? "A" : "B", colorClass: ... };  // null if Break/out of range
```

Because the counter is continuous across terms, a term change never flips parity
by itself — but if you ever **insert, delete or renumber weeks**, keep parity
consistent with the classes in `db.json`, which are authored per specific week
number of a given term.

### 4.3 `getWeekInfo(date)` — `src/lib/academicWeeks.js`

The single source of truth for "what week is this date?".

1. Truncates `date` to local midnight (`new Date(y, m, d)`).
2. Finds the range where `start <= today <= end` (end is set to `23:59:59.999`).
3. Returns `null` if no range matched **or** `term === "Break"`.
4. Otherwise returns `{ term, week, type: "A"|"B", colorClass }`.

All comparisons are **local time** (no UTC, no timezone math).

### 4.4 State flow: date → filters

`page.jsx` owns the two filter values; `CurrentWeek.jsx` owns the date. The date
is the source of truth and is pushed **up** through a callback:

```
CurrentWeekIndicator                     Schedule (page.jsx)
─────────────────────                    ───────────────────
selected  ──useMemo──▶ info              activeTerm   (useState "T1")
            ──useEffect──▶ onInfoChange(info) ──▶  activeWeek  (useState "A")
                                                  handleInfoChange = useCallback(...)
```

`handleInfoChange` (`page.jsx`):

```js
if (!info) { setActiveWeek("A"); return; }   // Break / fuori calendario → default A
setActiveTerm(info.term);                    // sync term too
setActiveWeek(info.type);                    // sync A/B
```

Consequences, all intentional:

- **On page load** the toggle lands on the real week/term (not hardcoded A).
- **Changing the date** in the calendar re-derives both filters.
- **Manual clicks** on the term/week buttons are *not* fought: the callback only
  fires when `info` changes (i.e. when the date changes), so a manual choice
  sticks until you move the date again.
- During a **Break** the week resets to A while the term you already selected is
  left alone (documented decision).

`info` is derived (`useMemo(getWeekInfo(selected))`), so there is exactly one
piece of date state in the tree.

### 4.5 Hydration rule — never compute dates during render

`page.jsx` is a client component but it is still **prerendered** (the build
output is `○ (Static) prerendered as static content`). Therefore:

- Initial states are static literals: `useState("T1")` / `useState("A")`.
- The "real week" correction happens in a **`useEffect` on mount** (which is what
  `onInfoChange` does), *not* in a lazy `useState(() => getWeekInfo(new Date()))`.

If you compute `new Date()` during render you get (a) a hydration mismatch when
server/client clocks straddle a day/week boundary, and (b) a value frozen at
build time for the static HTML. Do not "simplify" the effect away.

### 4.6 Rendering the grid (`page.jsx`)

```js
const filteredData = data.filter((item) =>
  item.term.includes(activeTerm) && item.week.includes(activeWeek));
```

- The grid is `DAYS = [Monday … Saturday]` — **there is no Sunday column**, and
  the values must match `dayOfWeek` in `db.json` exactly (English, capitalised).
  A `dayOfWeek` outside that list renders nothing.
- Each day is split into an **AM** (09:00–13:00) and **PM** (14:00–18:00) block by
  `item.period.includes("AM" / "PM")`.
- Because every filter uses `.includes()`, multi-valued fields work as an OR:
  `"week": ["A", "B"]` shows in both weeks, `"term": ["T1","T2"]` in both terms.
- Card keys are `${cls.id}-am` / `${cls.id}-pm` — `id` must be unique in `db.json`.
- `ClassCard` shows the "Sett A" / "Sett B" chips (red for A, blue for B) and
  "Aula {classe}".

Colour convention used everywhere: **A = red (`*-red-*`), B = blue (`*-blue-*`)**.

---

## 5. Data model reference

### `src/lib/db.json` (the classes)

Array of objects, all 8 fields always present:

| Field | Type | Values | Notes |
| --- | --- | --- | --- |
| `id` | string | e.g. `"brand-design-1"` | unique; used as React key base |
| `subject` | string | free text | long Italian titles are normal |
| `professor` | string | `"Surname Name"` | e.g. `"Senia Antonio"` |
| `dayOfWeek` | string | `Monday, Tuesday, Wednesday, Thursday, Friday, Saturday` | English; must match `DAYS` in `page.jsx` |
| `term` | array | `["T1"]`, `["T2"]`, `["T3"]` (combinations allowed) | OR-matched |
| `week` | array | `["A"]`, `["B"]`, `["A","B"]` | OR-matched |
| `period` | array | `["AM"]`, `["PM"]` | drives the AM/PM split |
| `classe` | string | `"11"`, `"12"`, `"15"`, `"16"`, `"27"` | room, shown as "Aula …" |

Adding a class = append one object. Nothing else needs to change.

### `src/lib/weeks.json` (the calendar) — invariants

1. Entries are **sorted by `start`** and **contiguous** (`next.start === prev.end + 1 day`).
2. Every range is exactly 7 days (`end` = `start` + 6).
3. `week` runs continuously 1..30; breaks are `week: 0, term: "Break"`.
4. Parity: odd → A, even → B (§4.2).
5. If you extend the calendar past `2027-06-20`, remember: dates outside the
   range resolve to `null` → the UI shows "Break / Nessuna lezione" and defaults
   to Settimana A. That is the designed fallback, not a bug.

---

## 6. Edge-case matrix (expected behaviour)

Use this as an acceptance checklist when touching week/term logic.

| Date | From `weeks.json` | Expected UI |
| --- | --- | --- |
| `2026-10-06` (today-ish) | week 2, T1 | **Settimana B**, term T1 |
| `2026-09-28` (first day) | week 1, T1 | Settimana A, T1 |
| `2026-10-01` | week 1, T1 | Settimana A (even though the month is October) |
| `2026-10-28` | week 5, T1 | Settimana A |
| `2027-01-11` | week 11, T2 | Settimana A, term flips **T2** |
| `2027-01-18` | week 12, T2 | Settimana B, T2 |
| `2027-04-15` | week 21, T3 | Settimana A, T3 |
| `2026-12-15` (Break) | — | badge `Break / Nessuna lezione`, **Settimana A**, term unchanged |
| `2026-09-27` (before range) | — | same as Break |
| `2027-06-21` (after range) | — | same as Break |

Card count sanity (from `db.json`): **7 cards with week B / 5 cards with week A**
for the T1 default view.

---

## 7. Verification workflow (no test framework)

Three layers, cheapest first. Run all three before claiming a change works.

```bash
npm run lint    # 1. static: eslint must print nothing
npm run build   # 2. static: compile + prerender must succeed
```

### 7.1 Layer 3 — drive the real UI in headless Chrome

The UI behaviour (effects, hydration, click handling) can only be checked by
running a browser. The pattern below was used successfully on this repo:
**headless Chrome + DevTools Protocol, scripted from Node 22's built-in
`WebSocket`** (no npm packages needed).

**Step 1 — start the app**

```bash
npm run dev
```

**Step 2 — launch headless Chrome with a throwaway profile** (PowerShell):

```powershell
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"   # or Edge
$prof  = "C:\Users\<you>\AppData\Local\Temp\ui-test\profile"
$p = Start-Process -FilePath $chrome -ArgumentList `
  '--headless=new','--remote-debugging-port=9222','--remote-allow-origins=*', `
  "--user-data-dir=$prof",'--no-first-run','--no-default-browser-check', `
  '--no-sandbox','--hide-scrollbars','http://localhost:3000' -PassThru -NoNewWindow
# wait until http://127.0.0.1:9222/json/list returns a target
```

A throwaway `--user-data-dir` is mandatory: otherwise Chrome attaches to an
already-running instance and `--remote-debugging-port` is ignored.

**Step 3 — the harness script** (save as `ui-test.mjs`, run with `node ui-test.mjs`):

```js
const list = await fetch("http://127.0.0.1:9222/json/list").then((r) => r.json());
const target = list.find((t) => t.type === "page" && t.url.includes("localhost:3000"));
if (!target) throw new Error("page target not found");

const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    const p = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? p.reject(new Error(JSON.stringify(msg.error))) : p.resolve(msg.result);
  }
};
await new Promise((r) => (ws.onopen = r));
await send("Runtime.enable");
await send("Page.enable");
await send("Page.reload", { ignoreCache: true });
await new Promise((r) => setTimeout(r, 2500));   // let hydration + mount effects finish

// ---- everything below runs INSIDE the page ----
const script = `
(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const btns = () => [...document.querySelectorAll("button")];

  // assertion helpers (see the "assertion map" below)
  const weekState = () => (btns().some((b) => b.textContent.trim() === "Settimana B" && b.className.includes("bg-blue-100")) ? "B" : "A");
  const termState = () => ["T1","T2","T3"].find((t) => btns().some((b) => b.textContent.trim() === t && b.getAttribute("aria-pressed") === "true"));
  const badge = () => document.querySelector(".inline-flex.items-center.gap-2.px-4")?.textContent.replace(/\\s+/g, " ").trim();
  const dateLabel = () => btns().find((b) => b.textContent.includes("📅"))?.textContent.trim();
  const cards = () => document.querySelectorAll('li[class*="bg-white"]').length;

  // interaction helpers
  const click = async (label) => { btns().find((b) => b.textContent.trim() === label)?.click(); await wait(350); };
  const openCal = async () => { btns().find((b) => b.textContent.includes("📅"))?.click(); await wait(400); };
  const pickDay = async (n) => {
    btns().filter((b) => b.textContent.trim() === String(n) && b.closest(".rounded-xl")).forEach((c) => c.click());
    await wait(450);
  };
  const monthStep = async (dir) => { btns().filter((b) => b.textContent.trim() === dir).forEach((b) => b.click()); await wait(350); };

  const snap = (l) => \`[\${l}] week=\${weekState()} term=\${termState()} badge=\${badge()} date="\${dateLabel()}" cards=\${cards()}\`;

  const out = [snap("on load")];
  await openCal(); await pickDay(1);  out.push(snap("picked day 1 of current view"));
  await click("Settimana A");         out.push(snap("manual toggle A"));
  await monthStep("›"); await monthStep("›"); await pickDay(15); out.push(snap("two months ahead, day 15"));
  return out;
})()`;

const res = await send("Runtime.evaluate", { expression: script, awaitPromise: true, returnByValue: true });
if (res.exceptionDetails) console.log("ERR", JSON.stringify(res.exceptionDetails, null, 2));
else console.log(res.result.value.join("\n"));
ws.close();
```

**Assertion map** — how to read UI state from the DOM:

| What | Selector / signal |
| --- | --- |
| Active week | the `Settimana B` button has `bg-blue-100` (inactive = `bg-slate-200/50`); symmetric for `Settimana A` + `bg-red-100` |
| Active term | `<button aria-pressed="true">T2</button>` inside `role="group" aria-label="Selettore trimestre"` |
| Week badge | `.inline-flex.items-center.gap-2.px-4` → text like `T1•2B`, or `Break / Nessuna lezione` |
| Selected date | button whose text contains `📅` → `📅 06/10/2026` |
| Rendered classes | `document.querySelectorAll('li[class*="bg-white"]').length` |
| Calendar open | presence of `.rounded-xl` wrapper |

**Pitfalls discovered the hard way (do not rediscover them):**

1. **The calendar renders twice** — `CalendarPopup` emits a mobile full-screen
   modal *and* a desktop dropdown, each with its own `CalendarGrid`. So every day
   cell, `‹` and `›` matches **2** buttons. Clicking both is safe: each grid keeps
   its own `viewMonth` state, and after the first day-click the popup unmounts so
   the second click lands on a detached node (harmless). But `cells.length === 2`
   is the normal result — don't assert `1`.
2. **Wait after every click** (350–450 ms) so React flushes before you read the
   DOM. Reading too early shows the previous state and will send you chasing a
   non-existent bug.
3. **Reload before testing**, and wait ~2.5 s: the assertion values come from the
   mount effect (§4.5).
4. **Week numbers ≠ calendar day numbers.** A `weeks.json` range spans whole
   weeks, so e.g. 28/10 is *week 5*, and 12/01/2027 is still *week 11*
   (range 11–17 Jan). Always look the date up in `weeks.json` before writing an
   expectation — this caused one false "bug" report during development.
5. Keep scratch files and Chrome profiles **outside the repo** (e.g.
   `%TEMP%\opencode\...` or `C:\Users\<you>\AppData\Local\Temp\ui-test`).

**Teardown:** `Stop-Process -Id $p.Id -Force`, then kill the process listening on
port 3000 (`Get-NetTCPConnection -LocalPort 3000 -State Listen`).

### 7.2 Testing the pure date/week logic without a browser

`src/lib/academicWeeks.js` uses a bare JSON import (`import ... from "./weeks.json"`),
which plain Node rejects (no import attribute) and `@/*`-style aliases wouldn't
resolve either. To execute the *real* function body in Node, copy it to a temp
folder and swap the import line for `readFileSync`:

```powershell
$tmp = "$env:TEMP\week-test"; New-Item -ItemType Directory -Force -Path $tmp | Out-Null
Copy-Item src\lib\weeks.json "$tmp\weeks.json"
$src = Get-Content -Raw src\lib\academicWeeks.js
$imp = 'import { readFileSync } from "node:fs";' + "`n" +
       'const academicWeeks = JSON.parse(readFileSync(new URL("./weeks.json", import.meta.url), "utf8"));'
Set-Content "$tmp\academicWeeks.mjs" ($src.Replace('import academicWeeks from "./weeks.json";', $imp)) -Encoding utf8
node "$tmp\check.mjs"   # imports { getWeekInfo } and prints a table of date -> week
```

This is the fastest way to sanity-check calendar edits (§6 table) with zero
rendering involved.

---

## 8. Gotchas checklist

- [ ] `dayOfWeek` must be one of `Monday…Saturday` (English) or the class disappears.
- [ ] `weeks.json` must stay contiguous and 7-day-aligned; renumbering shifts A/B parity for every later week.
- [ ] Don't compute `new Date()` during render — effects only (§4.5).
- [ ] Don't remove `useCallback` from `handleInfoChange` — it's in the child effect's deps.
- [ ] There is no Sunday and no "weeks 31+"; out-of-range dates intentionally fall back to Settimana A.
- [ ] A = red, B = blue, in every badge/chip/toggle.
- [ ] `npm run lint` output must stay empty.
- [ ] The prerendered HTML always boots as **T1 / Settimana A**; only the hydrated DOM shows the real week. If you inspect HTML source and see A, that's expected.
