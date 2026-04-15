#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.MINIMAX_API_KEY;
const API = 'https://api.minimax.io/v1/music_generation';
const OUT = path.resolve(import.meta.dirname, '../game/public/assets/audio/music');
const LOG = path.resolve(import.meta.dirname, '../gen-music.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}

async function gen(body, file) {
  log(`Generating ${file} with ${body.model}...`);
  const start = Date.now();
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify(body),
  });
  log(`Response: ${res.status} after ${((Date.now()-start)/1000).toFixed(1)}s`);
  const json = await res.json();
  if (json.base_resp?.status_code && json.base_resp.status_code !== 0) {
    throw new Error(`API: ${json.base_resp.status_msg}`);
  }
  const hex = json.data?.audio;
  if (!hex) throw new Error('No audio hex in response');
  const buf = Buffer.from(hex, 'hex');
  fs.mkdirSync(OUT, { recursive: true });
  const outPath = path.join(OUT, file);
  fs.writeFileSync(outPath, buf);
  log(`Saved ${file} (${buf.length} bytes, ${json.extra_info?.music_duration}ms)`);
  return outPath;
}

try {
  fs.writeFileSync(LOG, '');  // clear log

  // Step 1: execution
  const execPath = await gen({
    model: 'music-2.6',
    prompt: 'Lo-fi ambient electronic, warm synthesizer pads, soft muted kick drum, gentle hi-hats, plucky arpeggio melody like data processing. Calm with forward momentum, flow state coding energy. Synthetic and warm, modern production. Not chill-hop, no jazz piano. Think C418 meets Tycho.',
    is_instrumental: true,
    audio_setting: { sample_rate: 44100, bitrate: 256000, format: 'mp3' },
  }, 'execution.mp3');

  log('Waiting 5s before cover...');
  await new Promise(r => setTimeout(r, 5000));

  // Step 2: execution-late via cover
  const execBase64 = fs.readFileSync(execPath).toString('base64');
  await gen({
    model: 'music-cover',
    prompt: 'Same melody but more urgent and intense. Faster tempo, distorted bass, busier hi-hats, alarm synth pulsing, glitchy digital artifacts. Deadline panic energy. Electronic, synthetic, no vocals.',
    audio_base64: execBase64,
    audio_setting: { sample_rate: 44100, bitrate: 256000, format: 'mp3' },
  }, 'execution-late.mp3');

  log('DONE - both tracks generated');
} catch (err) {
  log(`FAILED: ${err.message}`);
  process.exit(1);
}
