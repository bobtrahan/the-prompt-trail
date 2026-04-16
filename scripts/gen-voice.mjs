#!/usr/bin/env node
/**
 * Generate all narrator voice clips via MiniMax TTS (speech-2.8-hd).
 * Usage: node scripts/gen-voice.mjs
 * Requires: MINIMAX_API_KEY env var
 */

import fs from 'fs';
import path from 'path';

const API_KEY = process.env.MINIMAX_API_KEY;
if (!API_KEY) { console.error('MINIMAX_API_KEY not set'); process.exit(1); }

const VOICE_ID = 'ttv-voice-2026041610350026-yuc8Gt1F';
const MODEL = 'speech-2.8-hd';
const OUTPUT_DIR = path.resolve('game/public/assets/audio/voice');

const SCRIPTS = [
  // Class intros
  { id: 'class-techbro', text: "Unlimited budget. Zero taste. You'll throw money at every problem and somehow still ship late." },
  { id: 'class-indie', text: "Ramen budget, big dreams. You'll do more with less and mass-tweet about it the whole time." },
  { id: 'class-student', text: "No money. No experience. No sleep. Just vibes, energy drinks, and a dangerous amount of confidence." },
  { id: 'class-corporate', text: "Meetings about meetings. Your budget is someone else's budget. At least the snacks are free." },

  // Day intros
  { id: 'day-1', text: "Day one. Email automation. How hard could it be?" },
  { id: 'day-2', text: "Day two. A Twitter reply bot. What could possibly go wrong?" },
  { id: 'day-3', text: "Day three. Résumé optimization. You're teaching an AI to lie on your behalf." },
  { id: 'day-4', text: "Day four. AI meal planning. The fridge is empty. The algorithm is optimistic." },
  { id: 'day-5', text: "Day five. Smart home dashboard. Your toaster now has an IP address. Congratulations." },
  { id: 'day-6', text: "Day six. Code review agent. It has opinions. You won't like them." },
  { id: 'day-7', text: "Day seven. The investors want a pitch deck. The AI wants a raise." },
  { id: 'day-8', text: "Day eight. Legal contract scanner. You're about to find out what you've already agreed to." },
  { id: 'day-9', text: "Day nine. AI dungeon master. The rules are made up and the dragon has a LinkedIn." },
  { id: 'day-10', text: "Day ten. Self-driving grocery cart. It has learned to want things." },
  { id: 'day-11', text: "Day eleven. Sentient spreadsheet. It's judging your purchases. It's right to." },
  { id: 'day-12', text: "Day twelve. AGI prototype. It's not conscious yet but it is disappointed in you." },
  { id: 'day-13', text: "Day thirteen. Final deploy. Everything is broken and nothing matters. Ship it." },

  // Rare event commentary
  { id: 'event-bankruptcy', text: "You're broke. The AI is still running. It doesn't care about your finances." },
  { id: 'event-low-hp', text: "Your hardware is making sounds that aren't in the manual. This is concerning." },
  { id: 'event-day13', text: "This is it. Everything you've built comes down to this one decision." },
  { id: 'event-rate-limit', text: "Four twenty-nine. Too many requests. Even the cloud has boundaries." },
  { id: 'event-clash', text: "Your agents are arguing. This is what collaboration looks like, apparently." },
  { id: 'event-bug-bounty', text: "Impressive. You squashed bugs faster than you wrote them. A rare achievement." },

  // End-game narration
  { id: 'rank-s', text: "Perfect. You did what no human could. Mainly because you weren't really doing it." },
  { id: 'rank-ab', text: "Solid work. The machines did most of it, but someone had to press the buttons." },
  { id: 'rank-c', text: "Mediocre. The AI carried you and it wants you to know that." },
  { id: 'rank-df', text: "Well. The machines tried. You also tried. That counts for something, probably." },
];

async function generateClip(script) {
  const url = 'https://api.minimaxi.chat/v1/t2a_v2';
  const body = {
    model: MODEL,
    text: script.text,
    stream: false,
    voice_setting: {
      voice_id: VOICE_ID,
      speed: 0.95,
      vol: 1.0,
      pitch: 0,
    },
    audio_setting: {
      sample_rate: 32000,
      bitrate: 128000,
      format: 'mp3',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API error ${res.status}: ${errText}`);
  }

  const data = await res.json();

  if (data.base_resp?.status_code !== 0) {
    throw new Error(`MiniMax error: ${data.base_resp?.status_msg || JSON.stringify(data.base_resp)}`);
  }

  const audioHex = data.data?.audio;
  if (!audioHex) throw new Error('No audio data in response');

  const audioBuffer = Buffer.from(audioHex, 'hex');
  const outPath = path.join(OUTPUT_DIR, `${script.id}.mp3`);
  fs.writeFileSync(outPath, audioBuffer);
  return outPath;
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Generating ${SCRIPTS.length} voice clips...`);
  console.log(`Voice: ${VOICE_ID}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  let success = 0;
  let failed = 0;

  for (const script of SCRIPTS) {
    try {
      const outPath = await generateClip(script);
      const size = fs.statSync(outPath).size;
      console.log(`✅ ${script.id} (${(size / 1024).toFixed(1)}KB)`);
      success++;
      // Rate limit: 200ms between requests
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`❌ ${script.id}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} success, ${failed} failed out of ${SCRIPTS.length} total.`);
}

main();
