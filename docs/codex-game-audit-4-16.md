The real game project is at [/Users/btrahan/Developer/gamedevjs-2026/game](/Users/btrahan/Developer/gamedevjs-2026/game), and the core files for this pass are [ExecutionScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/ExecutionScene.ts), [PlanningScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/PlanningScene.ts), [ClassSelectScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/ClassSelectScene.ts), [BugBountyScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/BugBountyScene.ts), [BugHuntScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/BugHuntScene.ts), [BugBountySelectScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/BugBountySelectScene.ts), [TypingEngine.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/systems/TypingEngine.ts), [Terminal.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/ui/Terminal.ts), [eventTriggers.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/data/eventTriggers.ts), [events.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/data/events.ts), [prompts.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/data/prompts.ts), and [constants.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/utils/constants.ts).

**Wave 1: Foundations And Fast UX Wins**
- Add a new tuning module like [src/data/tuning.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/data) to centralize day timer targets, event read windows, bug bounty durations, payout multipliers, and onboarding copy. Big picture: stop scattering balance across scenes and data files before making larger feel changes.
- In [ClassSelectScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/ClassSelectScene.ts), replace the hidden continue CTA with an always-visible disabled CTA plus helper text like “Select a profile to continue.” Keep the selected-card flourish, but make the next step obvious from first paint.
- In [PlanningScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/PlanningScene.ts), keep `updateLaunchState()` as the gatekeeper, but add stronger visible guidance near the bottom and in the agent header. The target outcome is: the player instantly understands “pick strategy + fill all agent slots.”
- In [BugBountySelectScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/BugBountySelectScene.ts), rewrite the mode subtitles so the skill tradeoff is clearer: `AI = easier/lower ceiling`, `Old School = harder/higher payout`.
- Parallelizable after the tuning file exists: class select clarity, planning CTA clarity, and bug bounty mode-copy cleanup.

**Wave 2: Make Typing The Hero**
- Rework [Terminal.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/ui/Terminal.ts) so the active prompt becomes a hero element instead of a small footer line. Recommended direction: keep the log area, but render the current prompt in a much larger dedicated band or overlay with stronger contrast, more spacing, and a more obvious cursor.
- Update [ExecutionScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/ExecutionScene.ts) layout around the terminal window and the `START TYPING` affordance so the eye lands on typing first, not on the surrounding dashboard. Shrink or visually subordinate supporting panels during normal typing.
- Extend [TypingEngine.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/systems/TypingEngine.ts) to expose richer feel data: streak length, recent accuracy, WPM-ish speed, and perfect-prompt detection. Use that to drive juice in [ExecutionScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/ExecutionScene.ts): combo flashes, clean-completion bonuses, stronger progress feedback, and more satisfying “chunk complete” moments.
- Revisit [prompts.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/data/prompts.ts) once the larger UI exists. Keep the narrative arc, but tune prompt lengths by day so early days feel breezy and later days feel like true typing tests instead of just longer jokes.
- Parallelizable after the layout direction is chosen: terminal rendering, typing-engine telemetry, and prompt-pool retuning.

**Wave 3: Make Events Matter**
- In [ExecutionScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/ExecutionScene.ts), replace the fixed `COUNTDOWN_SEC = 10` event window with day-scaled countdowns from the tuning file. Your desired shape fits well: generous on days 1-3, moderate midgame, sharper late.
- In [eventTriggers.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/data/eventTriggers.ts), retune event cadence so event count and spacing support the new typing rhythm. Goal: fewer “administrative” interruptions early, more meaningful pressure later.
- In [events.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/data/events.ts) and [EventEngine.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/systems/EventEngine.ts), rebalance effects into three buckets: flavor nudges, meaningful tactical hits, and run-shaping outcomes. Increase persistence by letting more events modify tomorrow, shop options, unlocked/locked states, or future night rewards.
- In [ExecutionScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/ExecutionScene.ts), upgrade event presentation so the player can read consequence at a glance: stronger per-choice previews, clearer “this costs time” language, and a more dramatic close/resume beat.
- Parallelizable after tuning constants are defined: cadence work in `eventTriggers`, content pass in `events`, and UI/readability pass in `ExecutionScene`.

**Wave 4: Bug Bounty Fun Pass**
- In [BugBountyScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/BugBountyScene.ts), deepen the clicker mode with more target priority and short-term decision making: rarer jackpot bugs, visible bug classes with different urgency, stronger combo incentives, and maybe one “must-click-now” pattern per round.
- In [BugHuntScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/BugHuntScene.ts), simplify onboarding and likely simplify controls. The highest-value change is to remove or soften `Enter`-to-toggle-walk and move toward more immediate motion, unless preserving that friction is a deliberate joke worth the cost.
- In [BugBountySelectScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/BugBountySelectScene.ts), add a tiny “how it plays” preview block for each mode so selection is informed instead of purely textual.
- In both [BugBountyScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/BugBountyScene.ts) and [BugHuntScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/BugHuntScene.ts), retune reward pacing so AI mode is immediately fun and readable, while Old School earns its higher payout through mastery rather than confusion.
- Parallelizable: AI-mode redesign and Old-School control simplification can happen independently; reunify payouts and selection UX afterward.

**Wave 5: Full-Balance Pass**
- Retune [constants.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/utils/constants.ts), [prompts.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/data/prompts.ts), [eventTriggers.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/data/eventTriggers.ts), and your new tuning file together. Target curve: days 1-3 forgiving, 4-7 teaching pressure, 8-13 requiring competent typing.
- In [PlanningScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/PlanningScene.ts), retune strategy and agent summary copy so it communicates the real consequences of loadout decisions in player language, not just system language.
- In [ExecutionScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/ExecutionScene.ts), make sure planning, typing skill, and event handling all contribute to survival. The desired end state is “upgrades and choices buy forgiveness, but good typing still decides the run.”
- Add a short manual balance checklist in the repo root or [README.md](/Users/btrahan/Developer/gamedevjs-2026/game/README.md): play one easy-class run, one middle run, one hard run, and record whether each reaches the intended fail-pressure band.

**Wave 6: Viewport And Polish**
- Add a desktop-minimum viewport policy in [constants.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/utils/constants.ts) or boot code. If mobile is unsupported, fail gracefully with a styled “desktop recommended” screen instead of rendering unreadably tiny UI.
- Audit [ClassSelectScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/ClassSelectScene.ts), [PlanningScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/PlanningScene.ts), and [ExecutionScene.ts](/Users/btrahan/Developer/gamedevjs-2026/game/src/scenes/ExecutionScene.ts) for shorter laptop heights. Keep all primary CTAs safely visible.
- Do a final copy pass across onboarding, event choices, and bug bounty descriptions so the game feels intentionally sharp rather than system-explanatory.

Recommended execution order: Wave 1 -> Wave 2 -> Wave 3 -> Wave 4 -> Wave 5 -> Wave 6. The key dependency is that the typing presentation should land before you do the serious event/balance pass, because once typing becomes the hero, the “right” amount of interruption and difficulty will change.

If you want, I can turn this next into a sprint-ready checklist with ticket-sized tasks, acceptance criteria, and suggested owners.
---

## Harbor Task List (generated 2026-04-16)

> Pending: harbormaster agent runtime routing + QA pipeline must be complete before creating these in Harbor.
> See Harbor infrastructure plan in Haze session notes.

### Wave 1 — Foundations & Fast UX Wins

**T01 — Create `src/data/tuning.ts`: centralize balance constants** `standard` `ready`
Create a new file `game/src/data/tuning.ts` that exports a single `TUNING` object centralizing: day timer targets (currently scattered across constants.ts and scene code), event read windows (COUNTDOWN_SEC), bug bounty durations and payout multipliers, and key onboarding copy strings. Update `constants.ts` and any scenes that reference these values to import from `tuning.ts` instead. Goal: one place to touch before any balance pass. Run `npm test` + `npm run build`.
*Deps: none | Blocks: T02, T03, T04, T10*

---

**T02 — ClassSelectScene: always-visible disabled CTA** `trivial` `low`
In `ClassSelectScene.ts`, replace the hidden "Continue" button with an always-visible but disabled button. Add helper text beneath it: "Select a profile to continue." Enable the button when a class card is selected. Keep the selected-card visual flourish. Goal: player understands the next step from first paint. Run `npm run build`.
*Deps: T01 | Blocks: T05, T06*

---

**T03 — PlanningScene: stronger launch guidance** `standard` `medium`
In `PlanningScene.ts`, keep `updateLaunchState()` as the gatekeeper. Add a visible guidance element near the launch button and in the agent header area that reads something like "Pick a strategy and fill all agent slots to launch." The text should update dynamically — e.g. "1 agent slot remaining" as slots fill. Goal: player instantly understands what's blocking launch. Run `npm test` + `npm run build`.
*Deps: T01 | Blocks: T05, T06*

---

**T04 — BugBountySelectScene: rewrite mode subtitle copy** `trivial` `low`
In `BugBountySelectScene.ts`, update the subtitle/description text for each mode so the skill tradeoff is explicit: Use AI mode → "Easier — point-and-click, lower earnings ceiling." Old School mode → "Harder — precision controls, 1.5× earnings bonus." Keep existing layout and visuals. Run `npm run build`.
*Deps: T01 | Blocks: T05, T06*

---

### Wave 2 — Make Typing The Hero

**T05 — Terminal.ts: hero prompt band** `hard` `high`
Rework `Terminal.ts` so the active typing prompt is a hero element. Recommended: render the current prompt in a large dedicated band or overlay above the log area — significantly larger font, high-contrast background, clear cursor. The log area remains but is visually subordinate. Cursor should be unmissable. This is a significant layout component change — review how `ExecutionScene.ts` instantiates Terminal before touching. Run `npm test` + `npm run build`.
*Deps: T02, T03, T04 | Blocks: T07, T09*

---

**T06 — ExecutionScene: eye lands on typing first** `hard` `high`
In `ExecutionScene.ts`, rework the scene layout so the typing area is the dominant visual focus on load. Shrink or visually subordinate the surrounding dashboard panels (agent manager, resource bars) during active typing. The `START TYPING` affordance should be impossible to miss. Coordinate with the Terminal.ts hero band from T05. Run `npm test` + `npm run build`.
*Deps: T02, T03, T04 | Blocks: T07, T09*

---

**T07 — TypingEngine: expose telemetry data** `standard` `medium`
Extend `TypingEngine.ts` to track and expose: current streak length (consecutive correct chars/prompts), recent accuracy (% over last N prompts), approximate WPM, and a perfect-prompt flag (no errors on a prompt). These should be accessible as readable properties or a `getTelemetry()` method. Add Vitest tests for streak and accuracy tracking. Run `npm test` + `npm run build`.
*Deps: T05, T06 | Blocks: T08*

---

**T08 — ExecutionScene: typing juice driven by telemetry** `hard` `high`
In `ExecutionScene.ts`, wire the TypingEngine telemetry from T07 into visual/audio feedback: combo flash on streak milestones, clean-completion bonus display on perfect prompts, stronger progress feedback, more satisfying "chunk complete" moment. Keep it readable — juice should reinforce, not distract. Run `npm test` + `npm run build`.
*Deps: T07 | Blocks: T10, T11, T12*

---

**T09 — prompts.ts: tune lengths by day** `standard` `medium`
In `game/src/data/prompts.ts`, revise the prompt pools per day so early days (1-3) have noticeably shorter, breezier prompts and late days (11-13) feel like real typing tests. The existing 4→10 prompt-count scaling can stay — this is about per-prompt length and difficulty of content. Keep the narrative arc. Run `npm test` + `npm run build`.
*Deps: T05, T06 | Blocks: T10, T11, T12*

---

### Wave 3 — Make Events Matter

**T10 — ExecutionScene: day-scaled event countdowns** `standard` `medium`
In `ExecutionScene.ts`, replace the hardcoded `COUNTDOWN_SEC = 10` event decision window with values from `tuning.ts` keyed by day. Shape: generous on days 1-3 (15s+), moderate midgame (10s), sharper late game (6-7s). The tuning values should live in the `TUNING` object from T01. Run `npm test` + `npm run build`.
*Deps: T01, T08, T09 | Blocks: T13*

---

**T11 — eventTriggers.ts: retune event cadence** `standard` `medium`
In `game/src/data/eventTriggers.ts`, revise the per-day event schedule to reduce "administrative" interruptions on days 1-3 and increase meaningful pressure in days 8-13. Fewer total events early, more weight on the late-game events. Goal: events feel like punctuation on the typing rhythm, not random noise. Run `npm test` + `npm run build`.
*Deps: T08, T09 | Blocks: T13*

---

**T12 — events.ts + EventEngine.ts: rebalance effects into 3 buckets** `hard` `high`
Audit the 55 events in `game/src/data/events.ts` and classify each as: (1) flavor nudge (minor), (2) meaningful tactical hit (moderate), or (3) run-shaping outcome (major). Rebalance effect magnitudes so the distribution is intentional. Increase persistence: where reasonable, let events modify tomorrow's timer, shop options, or future night rewards rather than just applying immediately. Update `EventEngine.ts` if new effect types are needed. Run `npm test` + `npm run build`.
*Deps: T08, T09 | Blocks: T13*

---

**T13 — ExecutionScene: upgrade event presentation** `standard` `medium`
In `ExecutionScene.ts`, improve how events are displayed: stronger per-choice consequence previews (build on the existing hover effect), clearer "this costs time" language in choice labels, and a more dramatic pause/resume beat when an event opens and closes. Goal: player reads the consequence at a glance. Run `npm run build`.
*Deps: T10, T11, T12 | Blocks: T14, T15, T16*

---

### Wave 4 — Bug Bounty Fun Pass

**T14 — BugBountyScene: deepen AI clicker mode** `standard` `medium`
In `BugBountyScene.ts`, add depth to the clicker: introduce rarer jackpot bugs with higher reward, make bug class identity more visible during play (different urgency cues per type), add stronger combo incentives, and add one "must-click-now" urgency pattern per round (e.g. a rapidly-fleeing bug). Goal: session feels like a skill expression, not a clicking treadmill. Run `npm run build`.
*Deps: T13 | Blocks: T17*

---

**T15 — BugHuntScene: simplify controls** `standard` `medium`
In `BugHuntScene.ts`, remove or soften the `Enter`-to-toggle-walk mechanic and move toward more immediate motion. Simplify the onboarding copy to match. If removing Enter-walk is not feasible without a larger refactor, at minimum make the onboarding explanation much clearer so the friction reads as intentional. Run `npm test` + `npm run build`.
*Deps: T13 | Blocks: T17*

---

**T16 — BugBountySelectScene: add mode preview blocks** `trivial` `low`
In `BugBountySelectScene.ts`, add a small "how it plays" summary beneath each mode card — 2-3 lines describing the actual mechanic (clicker vs. top-down shooter) so the player can make an informed choice. Keep the existing subtitle copy from T04. Run `npm run build`.
*Deps: T13 | Blocks: T18, T19, T21, T22, T23*

---

**T17 — BugBounty + BugHunt: retune reward pacing** `standard` `medium`
Across both `BugBountyScene.ts` and `BugHuntScene.ts`, retune reward payouts so Use AI mode is immediately fun and readable (lower skill floor, moderate ceiling), while Old School mode earns its 1.5× bonus through mastery (higher skill ceiling, not just confusion). Coordinate with any payout constants in `tuning.ts`. Run `npm run build`.
*Deps: T14, T15 | Blocks: T18, T19, T21, T22, T23*

---

### Wave 5 — Full Balance Pass

**T18 — Full balance retune across constants + tuning + triggers + prompts** `hard` `high`
Working across `constants.ts`, `prompts.ts`, `eventTriggers.ts`, and `tuning.ts`, retune the full difficulty curve: days 1-3 forgiving (generous timers, few events, short prompts), days 4-7 teaching pressure (moderate), days 8-13 requiring competent typing to survive. Values should be consistent with the balance intent documented in `CONTEXT.md` Phase 9 notes. Run `npm test` + `npm run build`.
*Deps: T16, T17 | Blocks: T20*

---

**T19 — PlanningScene: retune strategy + agent copy** `standard` `medium`
In `PlanningScene.ts`, rewrite the strategy descriptions and agent summary text so consequences are stated in player language ("One-Shot: full send, −6 seconds, no going back") rather than system language. The planning summary line already shows timer/model modifiers — make the copy above match that level of concreteness. Run `npm run build`.
*Deps: T16, T17 | Blocks: T20*

---

**T20 — Survival verification: play one run per class** `needs_human`
Manual playtesting checklist — NOT an agent task. Play one run as Tech Bro, Indie Hacker, College Student, Corporate Dev. Record whether each class reaches the intended fail-pressure band (early forgiveness, late tension). Note any balance outliers for a follow-up patch. Document results in `docs/playtest-notes.md`.
*Deps: T18, T19 | Blocks: nothing*

---

### Wave 6 — Viewport & Polish

**T21 — Desktop-minimum viewport policy** `trivial` `low`
In `constants.ts` or boot code (`main.ts`), add a check for viewport width below a minimum (e.g. < 768px). If triggered, render a styled "This game requires a desktop browser" overlay instead of the broken UI. Simple DOM or Phaser text is fine — it just needs to not render unreadably. Run `npm run build`.
*Deps: T16, T17 | Blocks: nothing*

---

**T22 — Laptop-height audit across 3 key scenes** `standard` `medium`
In `ClassSelectScene.ts`, `PlanningScene.ts`, and `ExecutionScene.ts`, audit layout at 900px and 768px viewport heights. All primary CTAs must be visible without scrolling. Adjust padding, font sizes, or element positions as needed. Run `npm run build`.
*Deps: T16, T17 | Blocks: nothing*

---

**T23 — Final copy pass: onboarding, events, bug bounty** `standard` `medium`
Do a sweep across all player-facing text strings in `ClassSelectScene.ts`, `BugBountySelectScene.ts`, and any event choice text in `events.ts` that still reads as "system-explanatory" rather than intentional game voice. The game is a satirical OS sim — the copy should feel sharp and deliberate, not placeholder. Run `npm run build`.
*Deps: T16, T17 | Blocks: nothing*
