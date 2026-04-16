# Voice Narrator Scripts

Deadpan narrator — Stanley Parable meets Hitchhiker's Guide. Amused, observant, never mean. Short clips (3-8 seconds each).

## Class Intros (4 clips)
Triggered on class selection in ClassSelect scene.

| ID | Script |
|----|--------|
| class-techbro | "Unlimited budget. Zero taste. You'll throw money at every problem and somehow still ship late." |
| class-indie | "Ramen budget, big dreams. You'll do more with less and mass-tweet about it the whole time." |
| class-student | "No money. No experience. No sleep. Just vibes, energy drinks, and a dangerous amount of confidence." |
| class-corporate | "Meetings about meetings. Your budget is someone else's budget. At least the snacks are free." |

## Day Intros (13 clips)
Triggered at start of Briefing scene.

| ID | Script |
|----|--------|
| day-1 | "Day one. Email automation. How hard could it be?" |
| day-2 | "Day two. A Twitter reply bot. What could possibly go wrong?" |
| day-3 | "Day three. Resume optimization. You're teaching an AI to lie on your behalf." |
| day-4 | "Day four. AI meal planning. The fridge is empty. The algorithm is optimistic." |
| day-5 | "Day five. Smart home dashboard. Your toaster now has an IP address. Congratulations." |
| day-6 | "Day six. Code review agent. It has opinions. You won't like them." |
| day-7 | "Day seven. The investors want a pitch deck. The AI wants a raise." |
| day-8 | "Day eight. Legal contract scanner. You're about to find out what you've already agreed to." |
| day-9 | "Day nine. AI dungeon master. The rules are made up and the dragon has a LinkedIn." |
| day-10 | "Day ten. Self-driving grocery cart. It has learned to want things." |
| day-11 | "Day eleven. Sentient spreadsheet. It's judging your purchases. It's right to." |
| day-12 | "Day twelve. AGI prototype. It's not conscious yet but it is disappointed in you." |
| day-13 | "Day thirteen. Final deploy. Everything is broken and nothing matters. Ship it." |

## Rare Event Commentary (6 clips)
Triggered during specific game events.

| ID | Trigger | Script |
|----|---------|--------|
| event-bankruptcy | Budget hits 0 | "You're broke. The AI is still running. It doesn't care about your finances." |
| event-low-hp | HP ≤ 20 | "Your hardware is making sounds that aren't in the manual. This is concerning." |
| event-day13 | Any event on day 13 | "This is it. Everything you've built comes down to this one decision." |
| event-rate-limit | Rate limited event | "Four twenty-nine. Too many requests. Even the cloud has boundaries." |
| event-clash | Agent clash fires | "Your agents are arguing. This is what collaboration looks like, apparently." |
| event-bug-bounty | 15+ bugs in Bug Bounty | "Impressive. You squashed bugs faster than you wrote them. A rare achievement." |

## End-Game Narration (4 clips)
Triggered in FinalScene based on rank.

| ID | Trigger | Script |
|----|---------|--------|
| rank-s | S rank | "Perfect. You did what no human could. Mainly because you weren't really doing it." |
| rank-ab | A or B rank | "Solid work. The machines did most of it, but someone had to press the buttons." |
| rank-c | C rank | "Mediocre. The AI carried you and it wants you to know that." |
| rank-df | D or F rank | "Well. The machines tried. You also tried. That counts for something, probably." |

## Technical Notes
- Generate via MiniMax TTS (speech-2.8-hd)
- Output: `public/assets/audio/voice/{id}.mp3`
- AudioManager: add `playVoice()` with music ducking (lower music to 30% while voice plays, restore after)
- Total: 27 clips
