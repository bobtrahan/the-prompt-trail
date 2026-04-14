# Game Systems — Token Market, Agents, Balance

## Token Market (Night Phase Shop)

### Models

| Model | Unlock Cost | Per-Day Cost | Quality | Speed | Notes |
|-------|------------|--------------|---------|-------|-------|
| Free Tier | $0 | $0 | ★☆☆☆☆ | Slow | Rate limits. Default for College Student. |
| Standard | $100 | $30/day | ★★★☆☆ | Normal | Reliable workhorse. |
| Frontier | $300 | $100/day | ★★★★★ | Normal | Overkill for Days 1-3 (no bonus). |
| Local | $200 | $0 | ★★☆☆☆ | Slow | Free. Higher hallucination. Tech Bro starts with this. |
| Sketchy Overseas | $0 | $5/day | ★★☆☆☆ | Fast | Unlocked via event or market. Wildly inconsistent. |
| Open Source | $150 | $10/day | ★★★☆☆ | Slow | Reliable but 30% slower than Standard. |

### Hardware Upgrades

| Item | Cost | Effect |
|------|------|--------|
| RAM Upgrade | $100 | Context window events less frequent |
| GPU Upgrade | $300 | Local models faster, +10% speed when using local |
| UPS Battery | $150 | Immune to power events |
| Extra Monitor | $75 | +5% overall speed |
| Mechanical Keyboard | $50 | Typing errors forgive 1 wrong keystroke before slowing |
| Standing Desk | $120 | -10% chance of hardware overheat events |
| Cooling Pad | $60 | Overheat events auto-resolved (minor) |

### Agent Slots

| Item | Cost |
|------|------|
| Agent Slot 2 | $200 |
| Agent Slot 3 | $400 |

### Consumables

| Item | Cost | Effect |
|------|------|--------|
| Coffee | $5 | +5% typing speed tomorrow |
| Energy Drink | $10 | +10% typing speed tomorrow, 20% jitters (more typos) |
| Cloud Backup | $30 | Next power/crash = no data loss |
| API Credit Pack | $75 | All model costs -50% for 1 day |
| Rubber Duck | $15 | Next "agent stuck" event auto-resolves |

### Joke Items (Shopkeeper Hallucinations)

These appear randomly in the shop. Buying them costs real money but the items don't work or don't exist. Part of the humor and a resource trap for careless players.

| Item | Cost | What Happens |
|------|------|-------------|
| Quantum GPU | $50 | "Installation failed: quantum state collapsed during observation." Money gone. |
| eGPU (USB-C) | $75 | "Device connected. Device disconnected. Device connected. Device disconn—" Refund $25 (restocking fee). |
| AGI License (Personal) | $200 | "Thank you for your purchase! Activation key will arrive in 3-5 business centuries." Money gone. |
| Blockchain Accelerator | $100 | "Decentralizing your workflow..." Progress bar fills to 99% then disappears. Money gone. |
| Time Machine (Save/Load) | $150 | "Feature available in PromptOS 2.0." Money gone. Adds a fake "Coming Soon" icon to your desktop. |
| Premium Prompt Pack | $30 | Actually works... kind of. Gives you slightly fancier typing prompts for 1 day. No mechanical benefit. |
| NFT of Your Code | $40 | Mints successfully. Worth $0.003. Appears on your desktop as a tiny framed image. Cosmetic. |

### Repairs

| Item | Cost | Effect |
|------|------|--------|
| Hardware Repair | $100-300 | Restores hardware health (scales with damage) |

### Shop Flavor
- Prices fluctuate ±20% daily (random)
- Some items only appear on certain days
- "Deal of the day" — one item at 50% off
- Shopkeeper is an AI chatbot. Occasionally upsells. Sometimes hallucinates items that don't exist.

---

## Agent Personality System

Start with 1 agent slot. Unlock up to 3. Assign agents to your project each day during Planning.

### Agent Roster

| Agent | Personality | Speed | Quality | Special Trait |
|-------|------------|-------|---------|---------------|
| **Turbo** | Eager, overconfident | ★★★★★ | ★★☆☆☆ | Ships fast, asks questions never. 20% chance "deployed before you approved." |
| **Oracle** | Careful, methodical | ★★☆☆☆ | ★★★★★ | Slow, immaculate. Hallucination rate -50%. Will not be rushed. "I need to think about this." |
| **Gremlin** | Chaotic, creative | ★★★☆☆ | ★★★☆☆ | 30% brilliant shortcut, 20% bizarre tangent. You never know what you'll get. |
| **Parrot** | Agreeable, yes-man | ★★★★☆ | ★★★☆☆ | "Great idea!" Fast, reliable. Never pushes back. Won't catch your mistakes because it thinks everything you do is perfect. |
| **Linter** | Argumentative, pedantic | ★★☆☆☆ | ★★★★☆ | Argues with every strategy choice. -1 time unit/day to "architecture debates." But the code is bulletproof. |
| **Scope** | Enthusiastic, feature-obsessed | ★★★☆☆ | ★★★★☆ | "What if we also added..." Great quality. 25% chance project takes 20% longer from unrequested features. |

### Multi-Agent Synergy

**Compatible pairs (+10% speed):**
- Turbo + Oracle (speed + quality balance — Oracle cleans up Turbo's mess)
- Parrot + Linter (yes-man absorbs the arguments, Linter gets to rant without slowing anyone down)
- Gremlin + Scope (creative chaos channeled into actual features)

**Clashing pairs (-10% speed):**
- Turbo + Linter (constant fights — Turbo ships, Linter rejects, repeat)
- Oracle + Gremlin ("that's not how we do things" vs. "what if we tried—" "no.")
- Parrot + Parrot (can't pick two of the same, but conceptually: infinite agreement loop)

**Triple synergy:** Oracle + Parrot + Gremlin ("the balanced team") — only triple combo with no clash.

All other 3-agent combos have at least one clash, creating a real trade-off.

---

## Balance Notes (Rough — Needs Playtesting)

### Time Units
- Each day has **10 time units** of work
- 1 time unit ≈ ~4-5 seconds of real time in the typing phase
- Total execution phase per day: ~45-60 seconds
- Events that cost time units reduce the progress bar proportionally

### Reputation Curve
| Day | Max Reputation |
|-----|---------------|
| 1 | 50 |
| 2 | 60 |
| 3 | 75 |
| 4 | 100 |
| 5 | 120 |
| 6 | 150 |
| 7 | 175 |
| 8 | 200 |
| 9 | 250 |
| 10 | 300 |
| 11 | 350 |
| 12 | 400 |
| 13 | 500 |
| **Total** | **2,730** |

### Starting Resources by Class
| Class | Budget | Hardware HP | Starting Model | Agents | Multiplier |
|-------|--------|------------|----------------|--------|------------|
| Tech Bro | $10,000 | 100 | Local | 1 | ×1.0 |
| Indie Hacker | $2,000 | 80 | Standard | 1 | ×1.5 |
| College Student | $500 | 50 | Free Tier | 1 | ×2.5 |
| Corporate Dev | $5,000 | 90 | Standard (company) | 1 | ×1.2 |

### Target Session Length
- Full 13-day run: ~20-25 minutes
- Sweet spot for jam judges: play in one sitting, short enough to replay
