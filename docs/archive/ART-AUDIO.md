# Art Direction & Audio Plan

## Art Style: Fake OS — "PromptOS"

### The Concept
The entire game is presented as a fictional operating system. You're not looking at a character at a desk — you're looking at **their screen**. The game IS the OS. Windows, terminals, notifications, taskbar, desktop wallpaper. Everything is UI.

This is distinctive because:
- **Nobody else at the jam will do this.** Pixel art is a sea. A fake OS is immediately recognizable.
- **Incredibly fast to produce.** UI elements are rectangles, text, icons. No sprite animation needed.
- **Deeply thematic.** The game is about working with AI on a computer. You ARE the computer.
- **Naturally scalable.** OS UIs work at any resolution. No pixel-scaling headaches.
- **Events live on the screen natively.** Popups, notifications, error dialogs — they're part of the OS. Not overlays on a game, they're windows in the OS.
- **The humor writes itself.** Fake app names, desktop icons, system notifications, taskbar clock.

### Visual Language

**Base aesthetic:** Modern-ish dark-mode OS. Think macOS/Linux desktop but slightly off. Not a parody of one specific OS — its own thing. Clean, flat, with subtle personality.

**The Desktop:**
- Wallpaper changes per class (Tech Bro: AI-generated art. Indie Hacker: mountain landscape. Student: anime. Corporate: company logo on gray.)
- Desktop icons: "PromptOS Terminal," "Token Wallet," "Agent Manager," "Bug Bounty," "Trash" (labeled "Deprecated Code")
- Taskbar at bottom: clock (shows in-game time), budget indicator, hardware health icon, notification tray
- The whole frame says "this is someone's actual computer"

**Main Gameplay (Execution Phase):**
```
┌─ PromptOS ────────────────────────────────┐
│ ☰ File  Edit  View  Help          $2,340  │
│ ┌─ Terminal ─────────────────────────┐     │
│ │ > Building: Email Automator v0.1   │     │
│ │ > agent: installing dependencies...│     │
│ │ > ██████████░░░░░░ 62%             │     │
│ │ >                                  │     │
│ │ > TYPE: git push --force_          │     │
│ │                                    │     │
│ └────────────────────────────────────┘     │
│                                            │
│  ┌─ ⚠️ System Alert ──────────────┐       │
│  │ Your AI replied-all to your     │       │
│  │ entire contact list.            │       │
│  │                                 │       │
│  │ [Undo $50] [Let it ride] [Blame]│       │
│  └─────────────────────────────────┘       │
│                                            │
│ ┌─ Agents ──┐  ┌─ Resources ────────┐     │
│ │ 🤖 Turbo  │  │ 💰 $2,340          │     │
│ │ ⚡ Active  │  │ ⏱️ 7/10 time       │     │
│ │ 🤖 Oracle │  │ 🖥️ Hardware: 85%   │     │
│ │ 📝 Writing│  │ ⭐ Rep: 340        │     │
│ └───────────┘  └────────────────────┘     │
│ [🔋 CPU: 78%] [📡 API: Connected] [⏰ 2PM]│
└────────────────────────────────────────────┘
```

Everything is a "window." Events are dialog boxes. The typing happens in the terminal. Agent status is a sidebar widget. Resources are a system monitor panel. It all belongs.

**Event Popups — Native OS Dialogs:**
- Minor events: macOS-style notification banners (slide in from top-right of the "screen")
- Major events: Modal dialog boxes that dim the background (like a real OS "are you sure?" prompt)
- Rare events: Full-screen "CRITICAL SYSTEM ERROR" style with scanlines and glitch effects

**Morning Briefing:**
A "Daily Digest" app opens — looks like a news reader/RSS feed. Project for the day is the headline. AI news ticker is the sidebar feed.

**Planning Phase:**
Three "apps" open: Strategy Picker (dropdown menu style), Model Manager (looks like a package manager / app store), Agent Dashboard (drag agents into "active" slots).

**Night Phase — Token Market:**
An "App Store" or "Package Manager" UI. Items are "apps" or "hardware drivers" you install. Shopkeeper is a chatbot window in the corner.

**Bug Bounty:**
A "Debug Console" app opens. The code grid is a syntax-highlighted editor. Bugs are error indicators (red squiggles, warning icons) that move around. Cursor becomes a magnifying glass. Visual language shifts from "OS" to "IDE" — still fits.

**Class Selection:**
A "User Profile Setup" screen. Like creating an account on a new OS. Pick your avatar, pick your "plan tier" (the class), see your starting specs.

**Final Score:**
A "System Report" or "Annual Review" document. Clean, official-looking. Your stats formatted like a performance review.

### Color Theming by Class
Each class gets a different OS theme (accent color + wallpaper + UI details):
- 🤑 Tech Bro: Dark theme, neon green/cyan accents, RGB-style. Taskbar has "GPU Temp" widget.
- 🔧 Indie Hacker: Warm dark theme, orange/amber accents. Clean, minimal. One monitor feel.
- 📚 College Student: Light theme (controversial). Blue accents. Cluttered desktop with random files.
- 🏢 Corporate Dev: Gray theme with blue accents. "Company Approved" badge on everything. Slack widget permanently in taskbar.

### What We Need to Create
| Asset | Type | Difficulty |
|-------|------|-----------|
| Window chrome (title bar, borders, buttons) | UI components | Easy — rectangles + text |
| Desktop wallpapers (4, one per class) | Static images | Easy — generate or flat color + pattern |
| App icons (8-10) | Small graphics | Medium — simple flat icons |
| Notification/dialog templates | UI components | Easy — rectangles + text + buttons |
| Terminal font + typing cursor | Typography | Easy — monospace font + blinking cursor |
| Bug sprites (5 types) | Small animated | Medium — can be simple icons with movement |
| Glitch/error effects | Shader/overlay | Medium — CRT scanlines, screen shake |
| Character portraits (4 classes) | For class select | Medium — generate, doesn't need to be pixel |
| Agent avatars (6) | Small portraits/icons | Easy — simple robot/avatar icons |

### Key Advantage
This style means **most of our "art" is actually UI code.** Phaser can render rectangles, text, and panels natively. We need very few actual image assets. The aesthetic comes from layout, typography, and color — not from hand-drawn sprites.

---

## Audio

### Music (4-5 tracks)
| Track | Vibe | Loop Length | Notes |
|-------|------|------------|-------|
| Title Screen | Catchy, electronic, slightly retro | ~20 sec | First impression. Needs to hook. |
| Main Gameplay | Lo-fi electronic, light urgency | ~90 sec | "Focus playlist" energy. Background hum of productivity. |
| Late Game (Days 11-13) | Same melody, faster/more layers | ~90 sec | Raises tension through the same theme. |
| Night Phase / Shop | Chill ambient, relaxed | ~60 sec | Wind-down. Like closing your laptop. |
| Bug Bounty | Upbeat electronic, arcade feel | ~45 sec | Shift to action. Different energy. |

Style note: Electronic/synth fits the OS aesthetic better than chiptune. Not retro — modern, clean, slightly moody.

### Sound Effects
| SFX | Description |
|-----|-------------|
| Typing (correct) | Satisfying mechanical key click |
| Typing (wrong) | Dull/off-pitch keystroke |
| Notification popup | macOS-style chime — distinct but not annoying |
| Error dialog | Heavier alert tone |
| Critical event | Alarm/klaxon (brief) |
| Choice select | UI click |
| Progress bar ambient | Subtle hum, rises in pitch |
| Bug squash | Per type — splat, zap, crunch |
| Bug miss | Whiff / error beep |
| Cash register | Cha-ching |
| Day complete | Short fanfare (~2 sec) |
| Reputation gain | Level-up chime |
| Reputation loss | Descending tone |
| Hardware damage | Electrical crackle/spark + screen flicker |
| OS boot sound | For game start — like a startup chime |

### Voice (Stretch Goal)
TTS narrator for key moments:
- Class intros ("You chose Tech Bro. Bold. Expensive. Zero self-awareness.")
- Day intros ("Day 7. Your budget is thin. Let's ship an app.")
- Rare event announcements
- End-game summary

Delivered as "system announcements" through a "Text-to-Speech" app on the OS. Meta.
