#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.MINIMAX_API_KEY;
if (!API_KEY) { console.error('Missing MINIMAX_API_KEY'); process.exit(1); }

const API = 'https://api.minimax.io/v1/music_generation';
const MUSIC_DIR = path.resolve(import.meta.dirname, '../game/public/assets/audio/music');
const OUT = path.join(MUSIC_DIR, 'candidates');
const LOG = path.resolve(import.meta.dirname, '../gen-music-batch2.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}

async function gen(body, file) {
  log(`START ${file} (model: ${body.model})`);
  const start = Date.now();
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  log(`Response: ${res.status} after ${elapsed}s`);
  const json = await res.json();
  if (json.base_resp?.status_code && json.base_resp.status_code !== 0) {
    throw new Error(`API error for ${file}: ${json.base_resp.status_msg}`);
  }
  const hex = json.data?.audio;
  if (!hex) throw new Error(`No audio hex for ${file}`);
  const buf = Buffer.from(hex, 'hex');
  const outPath = path.join(OUT, file);
  fs.writeFileSync(outPath, buf);
  log(`SAVED ${file} (${(buf.length / 1024 / 1024).toFixed(1)}MB, ${json.extra_info?.music_duration}ms)`);
  return outPath;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(LOG, '');

  // 1) execution-late-v2 (cover of execution.mp3, no glitchy artifacts)
  const execPath = path.join(MUSIC_DIR, 'execution.mp3');
  const execBase64 = fs.readFileSync(execPath).toString('base64');
  await gen({
    model: 'music-cover',
    prompt: 'Same melody but more urgent and intense. Faster tempo, distorted bass, alarm synth pulsing underneath. Deadline panic energy. Electronic, synthetic, no vocals.',
    audio_base64: execBase64,
    audio_setting: { sample_rate: 44100, bitrate: 256000, format: 'mp3' },
  }, 'execution-late-v2.mp3');

  log('Cooling down 10s...');
  await new Promise(r => setTimeout(r, 10000));

  // 2) title-v2
  await gen({
    model: 'music-2.6',
    prompt: 'Dark moody electronic instrumental for a video game title screen. Confident, slightly ominous. Deep synth chord swell into a punchy four-on-the-floor beat. Crisp hi-hats, catchy reverbed synth lead. Cool and futuristic, neon-lit computer system. Minor key, 120 BPM.',
    is_instrumental: true,
    audio_setting: { sample_rate: 44100, bitrate: 256000, format: 'mp3' },
  }, 'title-v2.mp3');

  log('Cooling down 10s...');
  await new Promise(r => setTimeout(r, 10000));

  // 3) night-v2
  await gen({
    model: 'music-2.6',
    prompt: 'Relaxing ambient electronic instrumental for a video game rest screen. Very slow tempo, 70 BPM. Warm pad synthesizers with long sustain, spacious reverb. Gentle electric piano playing soft chords. Peaceful, like closing your laptop after a long day. Minimal drums, mostly atmosphere.',
    is_instrumental: true,
    audio_setting: { sample_rate: 44100, bitrate: 256000, format: 'mp3' },
  }, 'night-v2.mp3');

  log('Cooling down 10s...');
  await new Promise(r => setTimeout(r, 10000));

  // 4) bugbounty-v2
  await gen({
    model: 'music-2.6',
    prompt: 'Upbeat punchy electronic arcade instrumental for a bug-hunting mini-game. Fast tempo 150 BPM, tight drums, wobbly bass, playful and urgent. Modern production, 8-bit-adjacent but not chiptune. Energetic, makes you click faster.',
    is_instrumental: true,
    audio_setting: { sample_rate: 44100, bitrate: 256000, format: 'mp3' },
  }, 'bugbounty-v2.mp3');

  log('ALL DONE - 4 tracks generated');
}

main().catch(err => {
  log(`FAILED: ${err.message}`);
  process.exit(1);
});
