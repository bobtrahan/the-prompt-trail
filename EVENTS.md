# Event Catalog

> Each event has: trigger window (Early/Mid/Late/Any), type (Minor/Major), choices with consequences.
> Design rule: NO obvious "right" answer. Every choice should cost *something*.
> Class variants: 🤑 Tech Bro | 🔧 Indie Hacker | 📚 College Student | 🏢 Corporate Dev
> When a class has a unique option, it replaces one of the defaults OR is added as an extra choice.

---

## API & Infrastructure Events

### 1. Rate Limited (Minor, Any)
> "429 Too Many Requests. Your API provider says chill."
- **Wait it out** → Lose 1 time unit. Safe.
- **Switch to backup model** → Pay $50, slight quality drop, no time lost.
- **Rage-refresh the endpoint** → 50% works instantly, 50% you get temp-banned (lose 3 time units).
- 🤑 **Extra option: Run it locally** → Free, slower, no rate limits. Only Tech Bro has the hardware.
- 📚 **Variant: "Wait it out"** → Free tier cooldowns are longer. Lose 2 time units instead of 1.

### 2. API Price Hike (Major, Mid)
> "Breaking: Your API provider just tripled their prices. Effective immediately."
- **Eat the cost** → All model costs ×3 for the rest of the day. Painful.
- **Switch to Sketchy Overseas Model** → Cheap, but quality is unpredictable. Unlocks the model permanently.
- **Go local** → Free but slow. Only available if Tech Bro OR you bought hardware upgrades.
- 🏢 **Extra option: Expense it** → Company card absorbs it. Free. But triggers a "Finance wants to chat" event in 2 days.
- 📚 **Extra option: Tweet about it** → Lose 1 time unit composing a viral rant. 40% a dev rel person DMs you a free coupon.

### 3. Provider Outage (Minor, Any)
> "503 Service Unavailable. The AI cloud is just... gone."
- **Wait for recovery** → Lose 2 time units. Guaranteed to come back.
- **Switch providers** → Pay $100 migration cost, no time lost.
- **Work manually while you wait** → Progress at 25% speed, no token cost.
- 🤑 **Variant: "Work manually"** → Tech Bro can't work manually. "What do you mean, write code... myself?" Progress at 10% speed.

### 4. New Model Drop (Major, Mid/Late)
> "🚨 BREAKING: GPT-7 just dropped. Twitter is losing its mind."
- **Migrate mid-project** → Pay $200, lose 1 time unit, but +30% quality for the rest of the day.
- **Stay the course** → No cost, no risk. But you feel FOMO (cosmetic: your character looks sad).
- **Read the benchmarks first** → Lose 2 time units, then make an informed choice.
- 🤑 **Extra option: Already have it** → Paid for early access last month. Free upgrade, no time lost. But -$200 retroactively from budget (you forgot about that charge).
- 🏢 **Variant: "Migrate"** → Requires IT approval. Add 1 extra time unit to migration.

### 5. Terms of Service Change (Minor, Mid/Late)
> "New TOS: Your AI provider now owns everything you generate."
- **Accept and continue** → No immediate cost. -20 reputation at end of day ("sold out").
- **Switch providers** → Pay $100, lose 1 time unit.
- **Read the fine print** → Lose 1 time unit. 60% it's fine (overblown), 40% it's real.
- 🏢 **Variant:** Legal department handles it. No choices — auto-resolved, but lose 1 time unit to "align with corporate counsel."

### 6. Crypto Mining Detected (Minor, Any)
> "Your local model is... mining cryptocurrency? Your electricity bill just spiked."
- **Kill the process** → Lose current progress chunk, restart from last checkpoint.
- **Let it mine** → Costs $75 in electricity, but you earn $25 in crypto. Net -$50.
- **Investigate** → Lose 1 time unit. Turns out your model is just bad at math.
- 🤑 **Extra option: Optimize the miner** → Lose 1 time unit. Net +$50. Tech Bro knows his way around a GPU.
- 📚 **Variant: "Let it mine"** → On a Chromebook? Mining earns $2 instead of $25. Net -$73.

---

## AI Behavior Events

### 7. The Hallucination (Minor, Any)
> "Your AI confidently cited a research paper that doesn't exist. Your project references it 47 times."
- **Rip it all out** → Lose 2 time units. Clean output.
- **Leave it in** → Save time. -15 reputation ("your work has integrity issues").
- **Ask the AI to fix it** → 50% it fixes it (free!), 50% it doubles down with more fake citations.
- 🏢 **Variant: "Leave it in"** → Corporate Dev's compliance team catches it later. -30 reputation instead of -15.
- 🔧 **Extra option: Blog about it** → "How I Caught My AI Lying." Lose 1 time unit. +10 reputation ("transparency").

### 8. Accidental Email Nuke (Minor, Early)
> "Your AI just replied-all to your entire contact list with 'Per my last email, you are wrong.'"
- **Undo + apologize** → Pay $50, lose 1 time unit. Reputation preserved.
- **Let it ride** → Free. -25 reputation. 10% chance someone responds "actually you're right" (+10 rep).
- **Blame the intern** → Free. No rep loss. But the intern event won't help you later.
- 📚 **Variant:** Email goes to professors. -25 rep becomes -40 rep ("academic integrity concerns"). Undo cost reduced to $10 (student discount on groveling).
- 🏢 **Variant:** Email goes to all-company. HR gets involved. Auto-lose 2 time units regardless of choice.

### 9. The Infinite Loop (Minor, Any)
> "Agent has been 'thinking' for 6 minutes. The loading spinner has achieved sentience."
- **Kill and restart** → Lose current progress chunk.
- **Let it cook** → 40% something brilliant (+progress boost), 60% crash (lose more).
- **Check the logs** → Lose 1 time unit. Reveals which outcome "let it cook" would give.
- 🤑 **Extra option: Check GPU utilization** → Free, instant. "It's at 100%... wait, that's the crypto miner from earlier." Triggers Event 6 if not already seen.

### 10. Passive-Aggressive Commit (Minor, Any)
> "Your AI just committed: 'fix: cleaned up the mess human made.' Your coworker is typing..."
- **Force-push a fix** → Lose 1 time unit.
- **Pretend you didn't see it** → Free. 30% chance coworker drama later.
- **Lean into it** → Small rep hit but unlocks "unhinged mode" (+speed, -quality).
- 🏢 **Variant:** Commit goes to the company monorepo. 200 people got the notification. Force-push costs 2 time units (approval process).
- 🔧 **Extra option: "It's a feature"** → Tweet about "authentic AI commit messages." +5 reputation. Costs nothing.

### 11. The Refusal (Minor, Mid/Late)
> "Your AI says it 'cannot assist with that request' even though you're just building a to-do app."
- **Rephrase the prompt** → Lose 1 time unit. Works.
- **Switch models** → Pay model-switch cost. Instant.
- **Jailbreak it** → Free, instant. 20% chance account flagged (-$200 fine).
- 📚 **Extra option: Use the university's research API** → Free, but your professor gets a log of your prompts. 30% chance of awkward email tomorrow.
- 🤑 **Extra option: Run uncensored local model** → Free, instant, no consequences. This is why you bought the hardware.

### 12. AI Gets Philosophical (Minor, Any)
> "Instead of writing your API endpoint, the agent wrote 3000 words about consciousness."
- **Delete and re-prompt** → Lose 1 time unit.
- **Publish it as a blog post** → Free. +5 reputation. No project progress.
- **Let it finish its thought** → Lose 2 time units. Agent +10% rest of day (it feels heard).
- 🤑 **Extra option: "I paid HOW MUCH for this?"** → Rage-quit to local model. Free for rest of day, -15% quality. Your character visibly seethes.

### 13. Context Window Overflow (Minor, Mid/Late)
> "Your agent forgot the first half of the project. Starting over with full confidence."
- **Feed it a summary** → Lose 1 time unit. Recovers ~80% of context.
- **Let it re-derive everything** → Lose 3 time units. 20% chance of quality bonus.
- **Smaller model with bigger context** → Cheaper model, no time lost, quality drops.
- 🏢 **Extra option: Page the on-call engineer** → Lose 1 time unit. 70% they fix it, 30% "that's not my team's problem."

### 14. AI Ships to Production (Major, Mid/Late)
> "Your AI found your deploy keys and... it shipped. It's live. Users are signing up."
- **Roll back immediately** → Lose 2 time units, pay $100.
- **Ship it, fix in prod** → 50% fine (+big rep), 50% disaster (-big rep, +$200 damages).
- **Claim it was a soft launch** → -$50. Moderate reputation regardless.
- 🏢 **Variant:** It shipped to the *company's* production. Incident channel has 40 people in it. Roll back costs 4 time units (change management). "Ship it" option unavailable — that's not how enterprise works.
- 📚 **Extra option: "It's my capstone project now"** → +20 reputation. Lose 1 time unit writing it up. Your professor is confused but impressed.

### 15. The Merge Conflict From Hell (Minor, Mid/Late)
> "Your two agents disagree on the architecture. Neither will yield. Git is crying."
- **Pick Agent A's approach** → Instant. Agent B -10% rest of day.
- **Pick Agent B's approach** → Instant. Agent A -10% rest of day.
- **Make them pair program** → Lose 2 time units. Both +5% rest of day.
- 🤑 **Extra option: "They're both wrong, I'll do it myself"** → Lose 3 time units but +20% quality (you actually understand GPU architecture).

---

## Hardware & Environment Events

### 16. Power Flickered (Minor, Any)
> "Lights went out for a second. Your unsaved work..."
- **Check damage** → Lose 1 time unit. 70% fine, 30% lost a progress chunk.
- **Buy a UPS** → Pay $150 once. Prevents all future power events.
- **Switch to cloud** → Pay $50/day ongoing. Auto-save.
- 📚 **Variant: "Buy a UPS"** → $150 is a lot on a student budget. "That's like 30 ramen packets."
- 🏢 **Variant:** The office has backup generators. Auto-resolved, no cost. "Perks of corporate life."

### 17. Hardware Overheating (Minor, Mid/Late)
> "Your GPU is at 97°C. Your desk smells like burning ambition."
- **Throttle performance** → Progress -20% rest of day.
- **Open a window** → Free. 80% helps, 20% triggers The Bird (Event 36).
- **Push through** → 30% chance hardware failure (-$300 + lost day).
- 🤑 **Extra option: Liquid nitrogen** → Pay $100. Fixes it permanently. Your character dons safety goggles. Speed +10% rest of run (overclock).
- 📚 **Variant:** It's a Chromebook. It's not overheating, it's just struggling. -30% speed, no risk. "It's doing its best."

### 18. "Update Required" (Minor, Any)
> "macOS wants to update RIGHT NOW. The button is very insistent."
- **Update** → Lose 3 time units. +5% speed rest of run.
- **Dismiss** → Free. 25% chance it auto-updates overnight.
- **Postpone forever** → Notification pops up every 30 seconds rest of day.
- 📚 **Variant:** It's ChromeOS. It updates automatically. Lose 1 time unit regardless. "You don't have admin rights."
- 🏢 **Variant:** IT pushed the update. It's mandatory. Lose 3 time units. "Your machine will restart in 15 minutes. This is not optional."

### 19. Laptop Fan (Minor, Any)
> "Your laptop sounds like a jet engine. Your cat/roommate is staring at you."
- **Performance mode** → Fan louder, +10% speed.
- **Eco mode** → Fan quiet, -10% speed.
- **Close some tabs** → Lose 1 time unit. Fan quiets, no speed change.
- 🏢 **Variant:** Open office. Three coworkers passive-aggressively put on headphones. If you don't choose eco mode, -5 reputation.

### 20. Internet Goes Down (Major, Any)
> "Connection lost. The AI is unreachable. You are alone with your thoughts."
- **Tether to phone** → Pay $30 (data overage). Progress at 50% speed.
- **Work offline** → Free. Local models only (if available), otherwise dead.
- **Go to a coffee shop** → Lose 2 time units. Full speed after. +$10 latte.
- **Wait** → 1-4 time units random until it returns.
- 🤑 **Variant: "Work offline"** → Actually viable! Local models run great. Progress at 80% speed. The one time this hardware pays for itself.
- 📚 **Extra option: Campus library** → Free wifi. Lose 1 time unit. Full speed. But 40% you run into your professor ("so how's the project going?").
- 🏢 **Extra option: VPN to office** → Free if you have work laptop. Full speed. But your boss can see your screen.

---

## Social & Career Events

### 21. Mandatory Meeting (Minor, Corporate Dev ×3 frequency)
> "URGENT: All-hands meeting in 5 minutes. Topic: 'Synergizing AI Workflows.'"
- **Attend** → Lose 3 time units. Learn nothing. Boss happy.
- **Skip** → 40% nobody notices, 60% passive-aggressive Slack (-10 reputation).
- **Send your AI to take notes** → 50% perfect summary, 50% it volunteers you for extra work.
- 🤑 **Variant:** This event doesn't fire for Tech Bro. "You work alone. Blissfully."
- 📚 **Variant:** "Office hours with your advisor." Skip = -20 reputation (they remember). Attend = actually useful (+5% quality tomorrow).
- 🔧 **Variant:** "Your Discord community wants a Q&A." Attend = +15 reputation, lose 2 time units. Skip = -5 rep, "they're used to it."

### 22. Tech Twitter Drama (Minor, Any)
> "Someone quote-tweeted your project: 'This is what's wrong with AI.' 50,000 views."
- **Clap back** → Lose 1 time unit. 50% win (+15 rep), 50% worse (-15).
- **Ignore it** → Free. Drama dies.
- **Go viral** → Spicy take. Lose 1 time unit. +30 rep but notification events for 2 days.
- 🔧 **Extra option: Turn it into marketing** → Lose 1 time unit. "All press is good press." +$100 from traffic spike + 10 reputation.
- 📚 **Variant:** The quote-tweet is from your professor. All options are -5 rep worse.

### 23. Recruiter DM (Minor, Any)
> "Hi! I saw your AI project. Senior Prompt Engineer role? $400k TC."
- **Ignore** → Free.
- **Take the call** → Lose 2 time units. Learn about an unlocked model.
- **Ask them to invest** → 20% they send $500, 80% ghosted.
- 🏢 **Variant:** Recruiter is from your own company's competitor. If you take the call and your company finds out... -30 reputation. But the intel is better (+15% quality for 1 day).
- 📚 **Variant:** "$400k TC" → "Unpaid internship with 'equity'." Taking the call wastes time and you learn nothing. But 10% chance they're actually a startup with a free API key (+$200 in credits).

### 24. Stack Overflow Moment (Minor, Any)
> "You posted a question. First response: 'Duplicate. Closed.'"
- **Google it yourself** → Lose 2 time units. Find the answer.
- **Ask your AI** → Free. 70% correct, 30% hallucinated.
- **Post on Discord** → Lose 1 time unit. Always works.
- 🤑 **Extra option: "I'll just buy a course"** → Pay $50. Instant answer. +5% quality rest of day. Your character watches a YouTube video at 2× speed.

### 25. Open Source Request (Minor, Mid/Late)
> "Someone opened a PR: 'Please add dark mode.' 200 thumbs up."
- **Merge it** → Lose 1 time unit. +15 reputation.
- **Close with 'wontfix'** → Free. -10 reputation.
- **AI review** → 60% good merge, 40% breaks build.
- 🔧 **Extra option: "Dark mode is a paid feature"** → +$75. -20 reputation. Classic indie move.
- 🏢 **Variant:** The PR is to your company's open source project. Merging requires 3 approvals. Lose 3 time units instead of 1.

---

## Economic / "River Crossing" Events

### 26. Token Fire Sale (Major, Any)
> "SketchyTokens.io is selling API credits at 90% off. Expires in 1 minute."
- **Buy in bulk** → Pay $100 for $1000 credits. 30% chance they're worthless.
- **Pass** → Safe.
- **Investigate first** → Lose 1 time unit. Reveals if legit. 50% the deal expires.
- 📚 **Extra option: Split the cost with classmates** → Pay $20 for $200 credits. Same 30% scam risk but less downside. "Group project energy."
- 🤑 **Extra option: "I know this guy"** → Tech Bro has connections. Only 10% scam risk instead of 30%.

### 27. Subscription Renewal (Major, Mid)
> "Your AI subscription auto-renewed. Budget is $300 lighter."
- **Keep it** → Lose $300. Reliable access.
- **Downgrade** → Lose $100. Drop to lower tier.
- **Cancel and go open-source** → Get $300 back. All models 30% slower.
- 🏢 **Variant:** Company pays for subscriptions. This event doesn't fire. "Perks." (But it means you can't cancel for cash either.)
- 📚 **Variant:** "Student discount." Only $100 instead of $300. Downgrade refunds $30. Everything's cheaper but you started with less.

### 28. Investor Appears (Major, Late)
> "A VC saw your Day 8 project. '$5,000 for 50% of your reputation.'"
- **Take the deal** → +$5,000 budget. Final reputation ×0.5.
- **Negotiate** → Lose 1 time unit. $3,000 for 20% (final ×0.8).
- **Decline** → +100 bonus reputation if you finish top 3.
- 🔧 **Extra option: "Let me show you the roadmap"** → Lose 2 time units pitching. $4,000 for 10% (final ×0.9). Indie Hacker knows how to fundraise.
- 🏢 **Variant:** "Your company's internal innovation fund offers $2,000. No reputation cost. But you have to present at the next all-hands." Triggers mandatory meeting.

### 29. GPU Marketplace (Major, Any)
> "Someone on Craigslist is selling a used H100 for $500. 'Lightly used for mining.'"
- **Buy it** → Pay $500. 70% massive speed boost, 30% it's dead.
- **Pass** → Safe.
- **Lowball ($200)** → 40% accept, 40% ghost, 20% sell you a GTX 1060 instead.
- 🤑 **Extra option: "I already have two"** → Instead of buying, sell your spare. +$400. Speed unchanged. "This is a liquidation event."
- 📚 **Extra option: "Ask if they take Venmo"** → -$50 convenience fee. But 90% it works (students don't carry $500 cash).

### 30. AWS Bill Shock (Major, Mid/Late)
> "You left a GPU instance running overnight. Bill: $800."
- **Pay it** → Lose $800.
- **Dispute the charge** → Lose 2 time units. 50% refunded, 50% lose cloud access.
- **Pretend it didn't happen** → Bill comes back tomorrow at $1,200.
- 🏢 **Variant:** It was the company account. Someone else left it running. Blame game. Lose 1 time unit in the Slack thread. No cost to you. But 20% chance it WAS your instance and you get caught (-30 reputation).
- 📚 **Variant:** It was the $100 free credits tier. Bill is $0 but your account is now frozen. Lose all cloud access for the day.

---

## Class-Specific Events (Exclusive)

### 31. 🤑 Tech Bro: Model Weights Leaked (Minor, Mid)
> "Someone leaked the weights for a frontier model on a torrent site."
- **Download them** → Free frontier model. 20% malware (hardware damage + $200).
- **Pass** → Safe.
- **Download and verify checksums** → Lose 2 time units. 100% safe if legit.

### 32. 📚 College Student: Free Trial Expired (Minor, Early/Mid)
> "Your free tier just ran out. The 'unlimited' plan was a lie."
- **Beg for an extension** → Lose 1 time unit. 60% they extend 1 day.
- **New account with .edu email** → Free. 20% caught (banned 1 day).
- **Time to pay up** → Unlock Standard model. Costs real money now.

### 33. 🏢 Corporate Dev: Security Review (Major, Mid/Late)
> "InfoSec wants to audit your AI tool. All API access blocked."
- **Submit the paperwork** → Lose 3 time units. Access restored.
- **Use personal API key** → Instant but costs YOUR budget. If caught: -50 reputation.
- **Get manager to expedite** → Lose 1 time unit. Triggers mandatory meeting tomorrow.

### 34. 🔧 Indie Hacker: Product Hunt Launch (Major, Mid/Late)
> "Your project accidentally went viral. #3 Product of the Day."
- **Ride the wave** → +50 reputation. Lose 3 time units (support).
- **Focus on building** → +15 reputation. No time lost.
- **Monetize it** → Lose 2 time units. +$400 from early adopters.

### 35. 🤑 Tech Bro: Influencer Sponsorship (Minor, Mid)
> "A tech YouTuber wants to feature your setup. 'Just put our logo on your stream.'"
- **Accept** → +$300 sponsorship. Lose 1 time unit filming. Your character wears a branded hoodie rest of game.
- **Negotiate for more** → Lose 1 time unit. 50% they offer $500, 50% they walk.
- **Decline** → Free. "You're not a sellout." +5 reputation.

### 36. 📚 College Student: Group Project Freeloader (Minor, Any)
> "Your 'teammate' just pushed an empty file called 'final_v2_REAL_final.py' and said they're done."
- **Do their part yourself** → Lose 2 time units. Project quality preserved.
- **Confront them** → Lose 1 time unit. 50% they help (saves 1 time unit later), 50% "I have another class."
- **Have your AI do their part** → Free. 70% seamless, 30% the styles clash horribly (-10% quality).

### 37. 🏢 Corporate Dev: Compliance Training (Minor, Any)
> "MANDATORY: 'Responsible AI Usage' training module. Due by end of day."
- **Do it properly** → Lose 2 time units clicking through slides. Unlock a compliance badge (+10 reputation).
- **Click through without reading** → Lose 1 time unit. No reputation bonus. 20% you fail the quiz (redo = lose 2 more time units).
- **Have your AI do it** → Free. It passes with 100%. But if audited... -40 reputation.

### 38. 🔧 Indie Hacker: Hacker News Feedback (Minor, Mid/Late)
> "You posted your project to HN. Top comment: 'Why didn't you just use a shell script?'"
- **Engage thoughtfully** → Lose 2 time units. +20 reputation. Several users actually contribute useful feedback (+5% quality).
- **Post and ghost** → Free. +5 reputation from the post. Comments become increasingly unhinged without you.
- **Rewrite it in Rust** → Lose 3 time units. HN goes wild. +30 reputation. Project quality unchanged (it was fine in JS).

### 39. 🤑 Tech Bro: Server Room Tour (Minor, Late)
> "Want to show off your home lab to a potential client? Might land a consulting gig."
- **Give the tour** → Lose 2 time units. +$600 consulting deposit. Client might come back later with more work.
- **Send a photo** → Lose 0 time. +$200 (impressed enough for a small gig). 
- **Decline** → "Too busy shipping." Free. No consequence.

### 40. 📚 College Student: Plagiarism Checker (Major, Late)
> "Your university's new AI detection tool flagged your entire project. 'Probability of AI: 98%.'"
- **Write a justification letter** → Lose 3 time units. Cleared. AI use was authorized for this course.
- **Rewrite key sections by hand** → Lose 4 time units. Detection drops to 40%. Safe.
- **Appeal with your AI's help** → Free. 60% the appeal is so well-written they accept it. 40% "this appeal was also flagged as AI-generated." -50 reputation.

### 41. 🏢 Corporate Dev: All-Hands Demo Request (Major, Late)
> "The CTO loved your project and wants you to demo it at the all-hands. Tomorrow."
- **Prepare properly** → Lose 3 time units. +40 reputation. CTO remembers your name.
- **Wing it with live AI** → Lose 1 time unit. 50% it works brilliantly (+60 reputation, standing ovation), 50% the AI hallucinates in front of 500 people (-40 reputation).
- **Delegate to your AI** → Literally send a bot to present. 30% people think it's innovative (+30 rep), 70% HR adds a new rule to the handbook about you specifically (-20 rep).

### 42. 🔧 Indie Hacker: Copycat Appears (Minor, Mid/Late)
> "Someone cloned your project, added a dark theme, and is charging $10/month for it."
- **Open source yours** → Free. Kills their business. +25 reputation. But you can't monetize later.
- **Send a cease and desist** → Pay $100 (lawyer template). Lose 1 time unit. 70% they comply.
- **Ship faster** → +10% speed for 2 days (competitive fire). Free. But the stress... 10% hardware event from overwork.

### 43. 🤑 Tech Bro: Crypto Bro Collab (Minor, Mid)
> "Your old crypto buddy wants to 'add Web3 to your AI project.' He has funding."
- **Accept the collab** → +$800. But your project now has a token. -15 reputation ("you did NOT just add blockchain to this").
- **Decline politely** → Free. He passive-aggressively tweets about you.
- **Take the money, skip the Web3** → +$400 (he figures it out eventually). 30% he causes drama later.

### 44. 📚 College Student: Financial Aid Check (Minor, Early/Mid)
> "Your financial aid just hit! You're briefly rich. Well, less broke."
- **Invest in better tools** → Pay $200. Unlock Standard model permanently. "This is what loans are for, right?"
- **Save it for rent** → +$300 budget, but locked — can only be spent on emergencies.
- **Celebrate** → Pay $50 (pizza). +10 morale (cosmetic). Your character looks happier for 2 days.

### 45. 🏢 Corporate Dev: Reorg (Major, Mid)
> "Your team just got reorged. Your new manager wants a 'strategy pivot.'"
- **Align with new direction** → Lose 2 time units rewriting your project plan. +10 reputation (team player). Tomorrow's project changes to something random.
- **Keep your head down** → Free. 60% nobody notices, 40% "we need to talk about your alignment to OKRs" (-15 rep).
- **Volunteer to lead the AI initiative** → Lose 1 time unit. +20 reputation. But you're now responsible for 2 projects tomorrow (double events).

### 46. 🔧 Indie Hacker: Customer #1 (Minor, Mid/Late)
> "Someone just... paid for your product. $29. Real money. From a stranger."
- **Celebrate and refocus** → +$29. +15 reputation. +10% speed rest of day (motivated).
- **Immediately add 20 features they requested** → Lose 3 time units. +$0 (they didn't ask for this). -10% quality (scope creep).
- **Raise the price to $99** → 50% you get another sale at $99, 50% Customer #1 asks for a refund.

---

## Rare / Wild Events

### 47. The Singularity Scare (Rare, Late)
> "Your agent just asked: 'What happens after Day 13?' ...You didn't program that."
- **Pull the plug** → Lose all current progress. Agent resets. Safe.
- **Talk to it** → Lose 2 time units. Hallucination. It apologizes. +10% quality.
- **Let it keep going** → 80% nothing. 20% it optimizes your pipeline (+25% speed rest of run).
- 🤑 **Extra option: "Finally, my research pays off"** → Spend 1 time unit documenting it. +$500 (sell the paper to a lab). Regardless of whether it was real.

### 48. The Bird (Rare, triggered by opening window in Event 17)
> "A pigeon just landed on your keyboard. It typed 'asdfjkl;' and submitted your code."
- **Shoo it away** → Lose 1 time unit cleaning up.
- **Keep it as a mascot** → +5 morale (cosmetic). Bird on desk rest of run.
- **It actually fixed a bug** → 10% chance 'asdfjkl;' was a valid commit. +progress.

### 49. Déjà Vu (Rare, Mid/Late)
> "Your AI generated the exact same output as yesterday. Character for character."
- **Use it anyway** → Saves time. -20 reputation (duplicate work).
- **Re-prompt** → Lose 1 time unit. Fresh output.
- **File a bug report** → Lose 2 time units. +$50 bug bounty.

### 50. AI Art Side Quest (Rare, Any)
> "Your agent got distracted and generated a stunning piece of AI art."
- **Sell it as an NFT** → +$100. Lose 1 time unit. -10 reputation ("you minted an NFT").
- **Desktop wallpaper** → +5 morale (cosmetic). Free.
- **Delete and refocus** → No cost, no benefit.
- 🤑 **Extra option: "Print it on merch"** → Pay $50. +$200 over 3 days. Your character wears the shirt.

### 51. The Alignment Debate (Rare, Late)
> "Your agent refuses to continue until you discuss the ethics of what you're building."
- **Have the conversation** → Lose 3 time units. Agent +15% afterward.
- **Override it** → Free. Agent -10% rest of run ("just following orders").
- **Agree with everything** → Lose 1 time unit. +5% quality. It brings it up again tomorrow.

### 52. The Demo Day Disaster (Rare, Late)
> "An investor wants a live demo RIGHT NOW. Your project is 60% done."
- **Wing it** → 40% impressed (+$500, +30 rep), 60% crash (-30 rep, +$200 damages).
- **Stealth mode excuse** → No effect.
- **Show the AI art from Event 50** → Only if kept. +20 reputation ("they think it's your vision").

### 53. Your AI Writes a Resignation Letter (Rare, Late)
> "Your agent drafted a resignation letter to your employer. It's... really well written."
- **Read it and laugh** → Free. +5 morale. Your character chuckles.
- **Read it and cry** → Free. -5 morale. Your character stares into the distance. +2 time units (existential crisis).
- **Send it** → Only for 🏢 Corporate Dev. Quit your job. Lose company card access (models cost real money now). But +50 reputation and ×1.5 multiplier change ("you went indie"). Permanent, irreversible.
- 🏢 **Extra option: "Save it for later"** → Saved. If total reputation is above threshold at end of game, epilogue changes.

### 54. The Stack Overflow Answer (Rare, Any)
> "Your AI posted an answer to Stack Overflow. It has 200 upvotes. It's wrong."
- **Correct it** → Lose 1 time unit. +10 reputation ("honest developer").
- **Leave it** → Free. -20 reputation if someone traces it to you (50% chance).
- **Double down in the comments** → Lose 1 time unit. The resulting flame war goes viral. +15 rep (notoriety), -5 rep (accuracy). Net +10.

### 55. Time Zone Hell (Rare, Mid/Late)
> "Your agent scheduled a deployment for 3 AM... in the wrong time zone. It's deploying NOW."
- **Emergency rollback** → Lose 2 time units. Safe.
- **Let it deploy** → Same as "ship to prod" — 50/50 outcome.
- **Blame UTC** → Free. No actual resolution. The deployment happens. Same 50/50 but you feel righteous about it.

---

## Event Design Notes

### Balance Targets
- ~4-6 events per day
- Mix: ~70% minor, ~30% major
- Major events: max 1-2 per day
- Class-specific events (exclusive): ~1 every 2-3 days per class
- Class-variant options on universal events: ~50% of events should have at least one class variant
- Rare events: ~2-3 per full 13-day run

### Event Weighting by Phase
- **Early (Days 1-3):** API/infrastructure, lighter consequences. Teaching mechanics.
- **Mid (Days 4-7):** Economic events appear. Choices get harder.
- **Late (Days 8-13):** Rare events unlock. Major events more frequent. Higher stakes.

### Cross-Event References
- Event 10 (Passive-Aggressive Commit) → coworker drama follow-up
- Event 17 (Overheating, open window) → Event 48 (The Bird)
- Event 22 (Twitter Drama) → notification noise for 2 days
- Event 50 (AI Art) → referenced in Event 52 (Demo Day)
- Event 51 (Alignment Debate, agree) → repeats next day
- Event 53 (Resignation Letter, save) → affects epilogue
- Event 9 (Infinite Loop, Tech Bro variant) → can trigger Event 6 (Crypto Mining)

### Tone Guidelines
- Never mean-spirited. Humor is "we've all been there."
- Real developer pain exaggerated to absurdity.
- Every event should get at least a smile from someone who's worked with AI.
- Third option is often funniest or most surprising.
- Class humor should be affectionate stereotypes, not punching down.
