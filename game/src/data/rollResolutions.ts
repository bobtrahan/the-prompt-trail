/**
 * Roll Resolution Table
 * 
 * When an event flag matches a known "roll" pattern, EventEngine resolves it
 * with RNG instead of just setting the flag. The good/bad outcomes replace
 * whatever deterministic effect was paired with the flag.
 * 
 * Format: flag → { chance: probability of GOOD outcome, good: effects[], bad: effects[] }
 */

import type { EventEffect } from './events';

export interface RollResolution {
  chance: number; // probability of good outcome (0-1)
  good: { effects: EventEffect[]; log: string };
  bad: { effects: EventEffect[]; log: string };
}

export const ROLL_RESOLUTIONS: Record<string, RollResolution> = {
  // rate-limited: rage-refresh
  'rage-refresh': {
    chance: 0.5,
    good: { effects: [], log: '🎲 Rage-refresh worked! Back online.' },
    bad: { effects: [{ type: 'time', value: -2 }], log: '🎲 Rage-refresh made it worse. Locked out longer. (-6s)' },
  },

  // the-hallucination: ask AI to fix
  'hallucination-fix-roll': {
    chance: 0.4,
    good: { effects: [{ type: 'reputation', value: 5 }], log: '🎲 AI actually found and fixed the hallucination! (+5 rep)' },
    bad: { effects: [{ type: 'reputation', value: -10 }, { type: 'time', value: -1 }], log: '🎲 AI doubled down on the fake paper. Now it cites 94 of them. (-10 rep, -3s)' },
  },

  // infinite-loop: let it cook
  'let-it-cook-roll': {
    chance: 0.3,
    good: { effects: [{ type: 'reputation', value: 15 }, { type: 'agentSpeed', value: 10 }], log: '🎲 It cooked something brilliant! (+15 rep, +5s)' },
    bad: { effects: [{ type: 'time', value: -2 }], log: '🎲 It cooked for 6 minutes and produced "Hello World". (-6s)' },
  },

  // the-refusal: jailbreak
  'jailbreak-roll': {
    chance: 0.4,
    good: { effects: [{ type: 'agentSpeed', value: 15 }], log: '🎲 Jailbreak successful! Uncensored mode unlocked. (+7s)' },
    bad: { effects: [{ type: 'reputation', value: -15 }], log: '🎲 Jailbreak detected. Your account is flagged. (-15 rep)' },
  },

  // tech-twitter-drama: clap back
  'clap-back-roll': {
    chance: 0.5,
    good: { effects: [{ type: 'reputation', value: 15 }], log: '🎲 Ratio achieved. You won Twitter today. (+15 rep)' },
    bad: { effects: [{ type: 'reputation', value: -15 }], log: '🎲 Ratio\'d. Screenshots are spreading. (-15 rep)' },
  },

  // recruiter-dm: ask to invest
  'recruiter-invest-roll': {
    chance: 0.2,
    good: { effects: [{ type: 'budget', value: 500 }], log: '🎲 They actually invested! (+$500)' },
    bad: { effects: [{ type: 'time', value: -1 }], log: '🎲 Ghosted after 3 follow-up emails. (-3s)' },
  },

  // stack-overflow: ask AI
  'ai-answer-roll': {
    chance: 0.7,
    good: { effects: [{ type: 'time', value: 1 }], log: '🎲 AI nailed it. Saved you a rabbit hole. (+3s)' },
    bad: { effects: [{ type: 'reputation', value: -10 }], log: '🎲 AI hallucinated a nonexistent API. You shipped it. (-10 rep)' },
  },

  // open-source: AI review
  'ai-pr-review-roll': {
    chance: 0.6,
    good: { effects: [{ type: 'reputation', value: 10 }], log: '🎲 Clean merge. Community loves the contribution. (+10 rep)' },
    bad: { effects: [{ type: 'hardware', value: -10 }, { type: 'reputation', value: -5 }], log: '🎲 AI-reviewed PR broke the build. Maintainers are upset. (-10 HP, -5 rep)' },
  },

  // token-fire-sale: buy in bulk
  'token-sale-roll': {
    chance: 0.7,
    good: { effects: [{ type: 'budget', value: 200 }], log: '🎲 Legit credits! Net profit. (+$200)' },
    bad: { effects: [{ type: 'budget', value: -100 }], log: '🎲 Tokens were worthless. Scammed. (-$100)' },
  },
  'token-sale-split-roll': {
    chance: 0.7,
    good: { effects: [{ type: 'budget', value: 40 }], log: '🎲 Split credits worked! (+$40)' },
    bad: { effects: [{ type: 'budget', value: -20 }], log: '🎲 Scam. Classmates blame you. (-$20)' },
  },
  'token-sale-techbro-roll': {
    chance: 0.9,
    good: { effects: [{ type: 'budget', value: 200 }, { type: 'agentSpeed', value: 10 }], log: '🎲 Your guy came through. Premium credits. (+$200, +5s)' },
    bad: { effects: [{ type: 'budget', value: -100 }], log: '🎲 Even your guy scammed you. (-$100)' },
  },

  // gpu-marketplace
  'gpu-purchase-roll': {
    chance: 0.7,
    good: { effects: [{ type: 'agentSpeed', value: 30 }], log: '🎲 GPU is a beast! Massive speed boost. (+14s)' },
    bad: { effects: [{ type: 'hardware', value: -20 }], log: '🎲 DOA. Dead GPU. Your rig took damage. (-20 HP)' },
  },
  'gpu-lowball-roll': {
    chance: 0.4,
    good: { effects: [{ type: 'agentSpeed', value: 15 }], log: '🎲 Lowball accepted! Decent card. (+7s)' },
    bad: { effects: [{ type: 'budget', value: -200 }], log: '🎲 Got a GTX 1060. It was $200 for nothing useful. (-$200)' },
  },
  'gpu-venmo-roll': {
    chance: 0.9,
    good: { effects: [{ type: 'agentSpeed', value: 15 }], log: '🎲 Venmo worked! Got a decent GPU. (+7s)' },
    bad: { effects: [{ type: 'budget', value: -50 }], log: '🎲 Venmo failed. Convenience fee gone. (-$50)' },
  },

  // aws-bill-shock
  'aws-bill-deferred': {
    chance: 0.0, // always bad — bill catches up
    good: { effects: [], log: '' },
    bad: { effects: [{ type: 'budget', value: -300 }], log: '🎲 AWS bill came back. With interest. (-$300)' },
  },
  'aws-blame-roll': {
    chance: 0.5,
    good: { effects: [], log: '🎲 Blame worked. Bill vanishes into bureaucracy.' },
    bad: { effects: [{ type: 'budget', value: -400 }, { type: 'reputation', value: -10 }], log: '🎲 Audit trail. They know it was you. (-$400, -10 rep)' },
  },

  // model-weights-leaked
  'weights-download-roll': {
    chance: 0.8,
    good: { effects: [{ type: 'agentSpeed', value: 20 }], log: '🎲 Clean download. Free frontier model online! (+9s)' },
    bad: { effects: [{ type: 'hardware', value: -30 }, { type: 'budget', value: -200 }], log: '🎲 Malware. Hardware damaged, cleanup costs. (-30 HP, -$200)' },
  },

  // free-trial-expired
  'edu-account-roll': {
    chance: 0.8,
    good: { effects: [], log: '🎲 New .edu account activated. Free tier restored.' },
    bad: { effects: [{ type: 'time', value: -3 }], log: '🎲 Banned for 1 day. All API access frozen. (-9s)' },
  },

  // mandatory-meeting
  'skip-meeting-roll': {
    chance: 0.4,
    good: { effects: [], log: '🎲 Nobody noticed you skipped.' },
    bad: { effects: [{ type: 'reputation', value: -10 }], log: '🎲 Passive-aggressive Slack message from your boss. (-10 rep)' },
  },
  'ai-meeting-roll': {
    chance: 0.5,
    good: { effects: [{ type: 'reputation', value: 5 }], log: '🎲 AI took perfect notes. People are impressed. (+5 rep)' },
    bad: { effects: [{ type: 'reputation', value: -10 }], log: '🎲 AI hallucinated action items. You\'re assigned to 3 new committees. (-10 rep)' },
  },

  // ai-ships-to-production
  'ship-to-prod-roll': {
    chance: 0.5,
    good: { effects: [{ type: 'reputation', value: 25 }, { type: 'budget', value: 100 }], log: '🎲 It... works? Users love it. (+25 rep, +$100)' },
    bad: { effects: [{ type: 'reputation', value: -20 }, { type: 'hardware', value: -10 }], log: '🎲 Prod is on fire. Incident response engaged. (-20 rep, -10 HP)' },
  },

  // hardware-overheating
  'open-window-roll': {
    chance: 0.6,
    good: { effects: [], log: '🎲 Fresh air helped. Temperature normalized.' },
    bad: { effects: [{ type: 'hardware', value: -10 }], log: '🎲 A bird flew in. Things escalated. (-10 HP)' },
  },
  'hardware-failure-roll': {
    chance: 0.3,
    good: { effects: [{ type: 'agentSpeed', value: 5 }], log: '🎲 Pushed through. Thermal paste held. (+2s)' },
    bad: { effects: [{ type: 'hardware', value: -30 }], log: '🎲 Something popped. Smoke. Silence. (-30 HP)' },
  },

  // power-flickered
  'power-damage-roll': {
    chance: 0.5,
    good: { effects: [], log: '🎲 No damage. Files intact.' },
    bad: { effects: [{ type: 'hardware', value: -20 }], log: '🎲 Unsaved work lost. Drive took a hit. (-20 HP)' },
  },

  // internet-goes-down
  'wait-internet-roll': {
    chance: 0.3,
    good: { effects: [{ type: 'time', value: -1 }], log: '🎲 Internet came back quick. (-3s)' },
    bad: { effects: [{ type: 'time', value: -3 }], log: '🎲 ISP says "scheduled maintenance." Gone for hours. (-9s)' },
  },

  // update-required
  'update-overnight-roll': {
    chance: 0.75,
    good: { effects: [], log: '🎲 Dismissed. No auto-update tonight.' },
    bad: { effects: [{ type: 'time', value: -2 }], log: '🎲 Auto-updated overnight. Restart cost you time. (-6s)' },
  },

  // demo-day-disaster
  'demo-day-roll': {
    chance: 0.4,
    good: { effects: [{ type: 'budget', value: 500 }, { type: 'reputation', value: 30 }], log: '🎲 Demo crushed it! Standing ovation. (+$500, +30 rep)' },
    bad: { effects: [{ type: 'reputation', value: -30 }, { type: 'budget', value: -200 }], log: '🎲 Demo crashed. Investors winced. Damages owed. (-30 rep, -$200)' },
  },

  // stack-overflow-answer
  'so-blame-roll': {
    chance: 0.5,
    good: { effects: [], log: '🎲 Nobody traced it back to you.' },
    bad: { effects: [{ type: 'reputation', value: -20 }], log: '🎲 Someone traced the AI-generated answer to your account. (-20 rep)' },
  },

  // singularity-scare
  'singularity-roll': {
    chance: 0.8,
    good: { effects: [], log: '🎲 False alarm. Just a token prediction loop.' },
    bad: { effects: [{ type: 'agentSpeed', value: 25 }], log: '🎲 Something awakened. Agents are... faster now. (+11s)' },
  },

  // the-bird
  'bird-fix-roll': {
    chance: 0.1,
    good: { effects: [{ type: 'reputation', value: 15 }], log: '🎲 "asdfjkl;" actually fixed a race condition. Legend. (+15 rep)' },
    bad: { effects: [], log: '🎲 Just gibberish. The bird doesn\'t care.' },
  },

  // group-project-freeloader
  'ai-teammate-roll': {
    chance: 0.7,
    good: { effects: [], log: '🎲 AI seamlessly covered your teammate\'s work.' },
    bad: { effects: [{ type: 'reputation', value: -10 }], log: '🎲 AI output was obviously different. Professor noticed. (-10 rep)' },
  },

  // compliance-training
  'ai-compliance-risk': {
    chance: 0.7,
    good: { effects: [], log: '🎲 AI passed compliance. Nobody checked.' },
    bad: { effects: [{ type: 'reputation', value: -40 }], log: '🎲 Audit flagged it. "Your answers were suspiciously articulate." (-40 rep)' },
  },

  // plagiarism-checker
  'ai-appeal-roll': {
    chance: 0.6,
    good: { effects: [{ type: 'reputation', value: 5 }], log: '🎲 Appeal accepted. Record cleared. (+5 rep)' },
    bad: { effects: [{ type: 'reputation', value: -50 }], log: '🎲 "This appeal was also AI-generated." Academic probation. (-50 rep)' },
  },

  // all-hands-demo-request
  'bot-demo-roll': {
    chance: 0.3,
    good: { effects: [{ type: 'reputation', value: 30 }], log: '🎲 AI demo was innovative! Leadership is impressed. (+30 rep)' },
    bad: { effects: [{ type: 'reputation', value: -20 }], log: '🎲 AI went off-script. HR is writing a new policy about you. (-20 rep)' },
  },
  'live-demo-roll': {
    chance: 0.6,
    good: { effects: [{ type: 'reputation', value: 25 }], log: '🎲 Live demo went flawlessly! (+25 rep)' },
    bad: { effects: [{ type: 'reputation', value: -15 }, { type: 'budget', value: -50 }], log: '🎲 Demo crashed live. Awkward silence. (-15 rep, -$50)' },
  },

  // reorg
  'reorg-ignore-roll': {
    chance: 0.6,
    good: { effects: [], log: '🎲 Kept your head down. Reorg didn\'t touch your team.' },
    bad: { effects: [{ type: 'reputation', value: -15 }], log: '🎲 "Lack of alignment to OKRs" noted in your review. (-15 rep)' },
  },

  // customer-one
  'price-raise-roll': {
    chance: 0.5,
    good: { effects: [{ type: 'budget', value: 99 }], log: '🎲 Another sale at $99! (+$99)' },
    bad: { effects: [{ type: 'reputation', value: -10 }], log: '🎲 "Greedy dev" review on Product Hunt. (-10 rep)' },
  },

  // copycat-appears: cease and desist
  'cease-desist-roll': {
    chance: 0.7,
    good: { effects: [{ type: 'reputation', value: 10 }], log: '🎲 They complied. Your IP is protected. (+10 rep)' },
    bad: { effects: [{ type: 'reputation', value: -15 }], log: '🎲 They countersued. Streisand effect. (-15 rep)' },
  },

  // crypto-bro-collab
  'crypto-drama': {
    chance: 0.0, // always bad
    good: { effects: [], log: '' },
    bad: { effects: [{ type: 'reputation', value: -5 }], log: '🎲 He passive-aggressively tweets about you. (-5 rep)' },
  },

  // library-professor encounter
  'library-professor-roll': {
    chance: 0.6,
    good: { effects: [], log: '🎲 No professor sighting. Quiet study session.' },
    bad: { effects: [{ type: 'reputation', value: -5 }, { type: 'time', value: -1 }], log: '🎲 Professor spotted you. 20-minute "chat" about your thesis. (-5 rep, -3s)' },
  },

  // influencer-sponsorship
  'sponsorship-negotiate-roll': {
    chance: 0.6,
    good: { effects: [{ type: 'budget', value: 300 }], log: '🎲 Negotiation worked! Better deal. (+$300)' },
    bad: { effects: [{ type: 'time', value: -1 }, { type: 'budget', value: 100 }], log: '🎲 They walked. Partial deal salvaged. (+$100, -3s)' },
  },

  // tos-change: read the fine print
  'tos-fine-print-roll': {
    chance: 0.5,
    good: { effects: [{ type: 'reputation', value: 10 }], log: '🎲 Found a loophole! You retain full ownership. (+10 rep)' },
    bad: { effects: [{ type: 'reputation', value: -10 }], log: '🎲 The fine print is worse than you thought. (-10 rep)' },
  },

  // context-window-overflow: let it re-derive
  'context-rederive-roll': {
    chance: 0.4,
    good: { effects: [{ type: 'reputation', value: 10 }], log: '🎲 Re-derivation found a better architecture! (+10 rep)' },
    bad: { effects: [{ type: 'reputation', value: -5 }], log: '🎲 Re-derived something completely different. (-5 rep)' },
  },

  // context-window-overflow (corp): page on-call
  'oncall-roll': {
    chance: 0.6,
    good: { effects: [{ type: 'agentSpeed', value: 10 }], log: '🎲 On-call engineer fixed it fast. (+5s)' },
    bad: { effects: [{ type: 'reputation', value: -10 }], log: '🎲 On-call escalated it. Now it\'s an incident. (-10 rep)' },
  },

  // recruiter-dm (student): take the call
  'student-recruiter-roll': {
    chance: 0.5,
    good: { effects: [{ type: 'budget', value: 50 }], log: '🎲 Recruiter offered a paid internship referral! (+$50)' },
    bad: { effects: [{ type: 'time', value: -1 }], log: '🎲 Just a coding bootcamp sales pitch. Wasted time. (-3s)' },
  },

  // aws-bill-shock: dispute
  'dispute-roll': {
    chance: 0.5,
    good: { effects: [{ type: 'budget', value: 200 }], log: '🎲 Dispute approved! Credits refunded. (+$200)' },
    bad: { effects: [{ type: 'budget', value: -400 }, { type: 'time', value: -1 }], log: '🎲 Dispute denied. Late fees applied. (-$400, -3s)' },
  },

  // free-trial-expired: beg for extension
  'extension-roll': {
    chance: 0.6,
    good: { effects: [{ type: 'time', value: 1 }], log: '🎲 Extension granted! One more day of free tier. (+3s)' },
    bad: { effects: [{ type: 'time', value: -1 }], log: '🎲 Request denied. Wasted time begging. (-3s)' },
  },

  // group-project-freeloader: confront
  'confront-freeloader-roll': {
    chance: 0.5,
    good: { effects: [{ type: 'reputation', value: 10 }], log: '🎲 Confrontation worked. They\'re pulling their weight now. (+10 rep)' },
    bad: { effects: [{ type: 'reputation', value: -5 }, { type: 'time', value: -1 }], log: '🎲 They cried. Now you\'re the villain. (-5 rep, -3s)' },
  },

  // compliance-training: click through quiz
  'compliance-quiz-roll': {
    chance: 0.8,
    good: { effects: [], log: '🎲 Clicked through successfully. Certificate earned.' },
    bad: { effects: [{ type: 'time', value: -2 }], log: '🎲 Failed the quiz. Mandatory redo. (-6s)' },
  },

  // time-zone-hell: blame UTC
  'blame-utc': {
    chance: 0.5,
    good: { effects: [{ type: 'reputation', value: 5 }], log: '🎲 Team laughed it off. Blame accepted. (+5 rep)' },
    bad: { effects: [{ type: 'reputation', value: -10 }], log: '🎲 "That\'s not how time zones work." Embarrassing. (-10 rep)' },
  },
};
