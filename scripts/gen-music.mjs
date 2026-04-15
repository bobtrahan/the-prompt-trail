#!/usr/bin/env node
/**
 * Generate execution + execution-late (cover) via MiniMax Music 2.6 API.
 * Usage: node scripts/gen-music.mjs
 * Requires: MINIMAX_API_KEY env var
 */

import fs from 'fs';
import path from 'path';

const API_KEY = process.env.MINIMAX_API_KEY;
if (!API_KEY) { console.error('Missing MINIMAX_API_KEY'); process.exit(1); }

const API = 'https://api.minimax.io/v1/music_generation';
const OUT_DIR = path.resolve(import.meta.dirname, '../game/public/assets/audio/music');

async function generate(body, outFile) {
  console.log(`\n🎵 Generating: ${outFile}`);
  console.log(`   Model: ${body.model}`);
  console.log(`   Prompt: ${body.prompt.slice(0, 80)}...`);

  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }

  const json = await res.json();

  if (json.base_resp?.status_code && json.base_resp.status_code !== 0) {
    throw new Error(`API error: ${json.base_resp.status_msg || JSON.stringify(json.base_resp)}`);
  }

  const audioHex = json.data?.audio;
  if (!audioHex) {
    // Check if we got a URL instead
    if (json.data?.audio_url) {
      console.log(`   Downloading from URL...`);
      const audioRes = await fetch(json.data.audio_url);
      const buf = Buffer.from(await audioRes.arrayBuffer());
      const outPath = path.join(OUT_DIR, outFile);
      fs.writeFileSync(outPath, buf);
      const dur = json.extra_info?.music_duration;
      console.log(`   ✅ Saved: ${outPath} (${dur ? (dur/1000).toFixed(1) + 's' : 'unknown duration'})`);
      return outPath;
    }
    throw new Error(`No audio in response: ${JSON.stringify(json).slice(0, 500)}`);
  }

  const buf = Buffer.from(audioHex, 'hex');
  const outPath = path.join(OUT_DIR, outFile);
  fs.writeFileSync(outPath, buf);
  const dur = json.extra_info?.music_duration;
  console.log(`   ✅ Saved: ${outPath} (${dur ? (dur/1000).toFixed(1) + 's' : 'unknown duration'})`);
  return outPath;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Step 1: Generate execution track
  const execPath = await generate({
    model: 'music-2.6',
    prompt: 'Lo-fi ambient electronic, warm synthesizer pads, soft muted kick drum, gentle hi-hats, plucky arpeggio melody like data processing. Calm with forward momentum, flow state coding energy. Synthetic and warm, modern production. Not chill-hop, no jazz piano. Think C418 meets Tycho.',
    is_instrumental: true,
    audio_setting: {
      sample_rate: 44100,
      bitrate: 256000,
      format: 'mp3',
    },
  }, 'execution.mp3');

  console.log('\n⏳ Waiting 5s before cover request...');
  await new Promise(r => setTimeout(r, 5000));

  // Step 2: Cover it for execution-late
  const execAudio = fs.readFileSync(execPath);
  const execBase64 = execAudio.toString('base64');

  await generate({
    model: 'music-cover',
    prompt: 'Same melody but more urgent and intense. Tempo up 15-20%, add distorted bass layer, busier hi-hats, subtle alarm synth pulsing underneath, glitchy digital artifacts. The calm flow state has become deadline panic. Electronic, synthetic, no vocals.',
    audio_base64: execBase64,
    audio_setting: {
      sample_rate: 44100,
      bitrate: 256000,
      format: 'mp3',
    },
  }, 'execution-late.mp3');

  console.log('\n🎉 Done! Both tracks in:', OUT_DIR);
}

main().catch(err => {
  console.error('\n❌ Failed:', err.message);
  process.exit(1);
});
