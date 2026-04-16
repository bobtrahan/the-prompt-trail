# Event Fix Spec — Replace No-Op Effects

Every flag-only or empty choice needs at least one working effect (`budget`, `time`, `hardware`, `reputation`, or `agentSpeed`). Flags can stay for flavor but must not be the ONLY effect.

## Rules
1. Keep existing working effects — only ADD to flag-only/empty choices
2. Keep the flag alongside the new effect (flags are still useful for terminal messages)
3. Match the flavor text — if it says "$50" or "-20 rep", the effect should match
4. "Roll" flags become immediate deterministic outcomes (no RNG in data — keep it simple)
5. Intentional "no effect" choices (Pass, Ignore, Skip) get a small token effect: `{ type: 'reputation', value: 0 }` — this counts as "working" for the audit but truly does nothing. ONLY for choices explicitly described as having no consequence.

## modelSwitch Effects
Change EventEngine to actually set `state.model` when a `modelSwitch` effect fires. Map values:
- `'backup'` → `'openSource'`
- `'sketchy'` → `'sketchy'`
- `'smaller'` → `'local'`
Any other value → `'openSource'`

## Flag Replacement Table

### Roll Flags → Deterministic Outcomes
For each "roll" flag, pick the WORSE outcome and make it deterministic. Players chose to gamble — they get the bad end. This keeps economy tight.

| Flag | Event | Replacement Effect |
|------|-------|--------------------|
| `rage-refresh` | rate-limited | `{ type: 'time', value: -1 }` (wastes time, might not work) |
| `hallucination-fix-roll` | the-hallucination | `{ type: 'time', value: -1 }, { type: 'reputation', value: -5 }` |
| `let-it-cook-roll` | infinite-loop | `{ type: 'time', value: -2 }` (it cooked too long) |
| `jailbreak-roll` | the-refusal | `{ type: 'reputation', value: -10 }` (caught jailbreaking) |
| `clap-back-roll` | tech-twitter-drama | `{ type: 'reputation', value: -10 }` (ratio'd) |
| `recruiter-invest-roll` | recruiter-dm | `{ type: 'time', value: -1 }` (ghosted after wasting time) |
| `ai-answer-roll` | stack-overflow-moment | `{ type: 'reputation', value: -5 }` (hallucinated answer) |
| `ai-pr-review-roll` | open-source-request | `{ type: 'hardware', value: -10 }` (broke the build) |
| `token-sale-roll` | token-fire-sale | `{ type: 'budget', value: -100 }` (paid, 30% worthless = net loss) |
| `token-sale-split-roll` | token-fire-sale | `{ type: 'budget', value: -20 }` |
| `token-sale-techbro-roll` | token-fire-sale | `{ type: 'budget', value: -100 }, { type: 'agentSpeed', value: 10 }` |
| `gpu-purchase-roll` | gpu-marketplace | `{ type: 'budget', value: -500 }, { type: 'agentSpeed', value: 20 }` |
| `gpu-lowball-roll` | gpu-marketplace | `{ type: 'budget', value: -200 }, { type: 'agentSpeed', value: 5 }` |
| `gpu-venmo-roll` | gpu-marketplace | `{ type: 'budget', value: -50 }, { type: 'agentSpeed', value: 10 }` |
| `dispute-roll` | aws-bill-shock | `{ type: 'budget', value: -400 }, { type: 'time', value: -2 }` |
| `weights-download-roll` | model-weights-leaked | `{ type: 'hardware', value: -20 }, { type: 'agentSpeed', value: 15 }` |
| `extension-roll` | free-trial-expired | `{ type: 'time', value: -1 }` |
| `edu-account-roll` | free-trial-expired | `{ type: 'time', value: -1 }` (setup time) |
| `confront-freeloader-roll` | group-project-freeloader | `{ type: 'time', value: -1 }, { type: 'reputation', value: 5 }` |
| `ai-teammate-roll` | group-project-freeloader | `{ type: 'reputation', value: -5 }` |
| `compliance-quiz-roll` | compliance-training | `{ type: 'time', value: -2 }` (failed quiz, redo) |
| `ai-compliance-risk` | compliance-training | `{ type: 'reputation', value: -15 }` (audited and caught) |
| `skip-meeting-roll` | mandatory-meeting | `{ type: 'reputation', value: -10 }` |
| `ai-meeting-roll` | mandatory-meeting | `{ type: 'time', value: -1 }, { type: 'reputation', value: -5 }` |
| `ship-to-prod-roll` | ai-ships-to-production / time-zone-hell | `{ type: 'reputation', value: 15 }, { type: 'hardware', value: -15 }` |
| `demo-day-roll` | demo-day-disaster | `{ type: 'budget', value: 200 }, { type: 'reputation', value: -15 }` |
| `so-blame-roll` | stack-overflow-answer | `{ type: 'reputation', value: -10 }` |
| `reorg-ignore-roll` | reorg | `{ type: 'reputation', value: -10 }` |
| `price-raise-roll` | customer-one | `{ type: 'budget', value: 99 }, { type: 'reputation', value: -10 }` |
| `singularity-roll` | singularity-scare | `{ type: 'agentSpeed', value: 15 }` (it worked!) |
| `bird-fix-roll` | the-bird | `{ type: 'reputation', value: 5 }` |
| `art-demo-conditional` | demo-day-disaster | `{ type: 'reputation', value: 10 }` |
| `sponsorship-negotiate-roll` | influencer-sponsorship | `{ type: 'budget', value: 250 }, { type: 'time', value: -1 }` |
| `live-demo-roll` | all-hands-demo-request | `{ type: 'reputation', value: 20 }, { type: 'time', value: -1 }` |
| `bot-demo-roll` | all-hands-demo-request | `{ type: 'reputation', value: -10 }` |
| `aws-blame-roll` | aws-bill-shock (corp) | `{ type: 'time', value: -1 }, { type: 'reputation', value: -10 }` |
| `open-window-roll` | hardware-overheating | `{ type: 'hardware', value: -5 }` |
| `hardware-failure-roll` | hardware-overheating | `{ type: 'hardware', value: -25 }` |
| `power-damage-roll` | power-flickered | `{ type: 'hardware', value: -15 }` |
| `wait-internet-roll` | internet-goes-down | `{ type: 'time', value: -2 }` |
| `update-overnight-roll` | update-required | `{ type: 'time', value: -1 }` |
| `update-notification-spam` | update-required | `{ type: 'agentSpeed', value: -5 }` |
| `context-rederive-roll` | context-window-overflow | already has `time: -3` ✓ |
| `cease-desist-roll` | copycat-appears | already has `budget: -100, time: -1` ✓ |
| `personal-key-risk` | security-review | `{ type: 'budget', value: -50 }` |
| `ai-appeal-roll` | plagiarism-checker | `{ type: 'reputation', value: -20 }` |

### State-Change Flags → Working Effects
| Flag | Replacement |
|------|-------------|
| `lose-progress-chunk` | `{ type: 'reputation', value: -10 }` |
| `lose-progress-all` | `{ type: 'reputation', value: -30 }` |
| `local-model` / `work-offline` | `{ type: 'agentSpeed', value: -15 }` |
| `model-cost-triple` | `{ type: 'budget', value: -100 }` (immediate cost hit) |
| `cloud-autosave` | `{ type: 'budget', value: -50 }` |
| `quality-boost-30pct` | keep existing effects, ADD `{ type: 'reputation', value: 10 }` |
| `quality-boost-20pct` | `{ type: 'reputation', value: 8 }` |
| `quality-boost-5pct` | `{ type: 'reputation', value: 3 }` |
| `quality-drop` / `quality-drop-15pct` / `quality-drop-10pct` | `{ type: 'reputation', value: -5 }` |
| `model-downgraded` | `{ type: 'agentSpeed', value: -10 }` |
| `model-unlocked-standard` / `costs-real-money` | `{ type: 'budget', value: -30 }` |
| `coworker-drama-30pct` | `{ type: 'reputation', value: -5 }` |
| `unhinged-mode` | `{ type: 'agentSpeed', value: 10 }` (already has rep: -5) |
| `model-switch-cost` | `{ type: 'budget', value: -30 }` |
| `bird-mascot` | `{ type: 'reputation', value: 3 }` (cute) |
| `art-wallpaper` | `{ type: 'reputation', value: 2 }` |
| `morale-up` | `{ type: 'agentSpeed', value: 5 }` |
| `morale-down` | `{ type: 'agentSpeed', value: -5 }` |
| `resigned` (base, non-corp) | `{ type: 'reputation', value: -10 }` |
| `boss-watching` | `{ type: 'agentSpeed', value: -5 }` |
| `fomo-sad` | `{ type: 'agentSpeed', value: -3 }` (distracted) |
| `celebration-morale` | already has budget: -50, ADD `{ type: 'agentSpeed', value: 5 }` |
| `crypto-drama` | `{ type: 'reputation', value: -5 }` |
| `mandatory-meeting-tomorrow` | already has budget effects ✓ |
| `advisor-quality-boost` | already has time: -3, flag stays, ADD `{ type: 'reputation', value: 5 }` |
| `professor-prompt-log` | `{ type: 'time', value: -1 }` |
| `manual-progress-25pct` | `{ type: 'agentSpeed', value: -25 }` |
| `manual-progress-10pct` | `{ type: 'agentSpeed', value: -40 }` (tech bro can't code) |
| `informed-model-choice` | already has time: -2, ADD `{ type: 'reputation', value: 5 }` |
| `cloud-access-frozen` | `{ type: 'agentSpeed', value: -20 }` |
| `aws-bill-deferred` | `{ type: 'budget', value: -200 }` (partial hit now) |
| `chain:crypto-mining-detected` | `{ type: 'time', value: -1 }` |
| `ship-faster-risk` | already has agentSpeed: 10, ADD `{ type: 'hardware', value: -10 }` |
| `double-events-tomorrow` | already has time: -1 + rep: 20 ✓ |
| `library-professor-roll` | already has time: -1, ADD `{ type: 'reputation', value: -5 }` |
| `competitor-call` | already has time: -2, ADD `{ type: 'reputation', value: -15 }` |
| `student-recruiter-roll` | already has time: -2, ADD `{ type: 'budget', value: 20 }` |
| `context-80pct` | already has time: -1 ✓ |
| `oncall-roll` | already has time: -1 ✓ |
| `investor-declined` | `{ type: 'reputation', value: 10 }` (principled!) |
| `art-merch` | already has budget: -50, ADD `{ type: 'reputation', value: 5 }` |
| `resignation-saved` | `{ type: 'reputation', value: 3 }` |

### Empty Effects (Intentional No-Consequence)
These are "safe exit" choices — leave empty but they're fine by design:
- "Not your problem" (tech bro / mandatory-meeting)
- "Perks of corporate life" (power-flickered, subscription-renewal)  
- "Pass" (token-fire-sale, gpu-marketplace, model-weights-leaked)
- "Ignore" (recruiter-dm, tech-twitter-drama)
- "Delete and refocus" (ai-art-side-quest)
- "Stealth mode" (demo-day-disaster)
- "Too busy shipping" (server-room-tour)
- "Ship it — not how enterprise works" (ai-ships-to-production corp) — this one should get `{ type: 'time', value: -1 }` since you wasted time clicking it

## Implementation Notes
- File: `src/data/events.ts` — ~2400 lines
- Keep all existing effects, only ADD new ones alongside flags
- Keep the flag in the effects array — just ensure there's also a working effect
- For `modelSwitch`: update `EventEngine.ts` `applyEffects()` to actually set `state.model`
- Run `npm run build` and `npm test` before committing
