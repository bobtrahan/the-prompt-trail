/**
 * audit-scene-reset.mjs
 * Flags Phaser scene class properties with default values that are NOT
 * explicitly reset inside create(). These carry stale state across scene.start() calls.
 *
 * Usage: node scripts/audit-scene-reset.mjs
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCENES_DIR = join(__dirname, '../game/src/scenes');

// Matches: private foo = value  OR  private foo: Type = value
// Excludes bang-typed (private foo!: Type) — those are always assigned in create()
// Add // audit-ok after the declaration to suppress a known-safe false positive
const PROP_DECL = /^\s{2}private\s+(\w+)(?::\s*[^=!]+)?\s*=\s*.+/;
const SUPPRESSED = /\/\/\s*audit-ok/;

// Matches: this.foo = ... inside create()
const RESET_IN_CREATE = /\bthis\.(\w+)\s*=/g;

function extractCreateBody(src) {
  const createIdx = src.search(/^\s{2}(?:public\s+)?create\s*\(\s*\)\s*(?::\s*void\s*)?\{/m);
  if (createIdx === -1) return '';

  let depth = 0;
  let started = false;
  let start = -1;
  let end = -1;

  for (let i = createIdx; i < src.length; i++) {
    if (src[i] === '{') {
      depth++;
      if (!started) { started = true; start = i; }
    } else if (src[i] === '}') {
      depth--;
      if (started && depth === 0) { end = i; break; }
    }
  }

  return end !== -1 ? src.slice(start, end + 1) : '';
}

const files = readdirSync(SCENES_DIR).filter(f => f.endsWith('.ts') && f !== 'index.ts');

let totalIssues = 0;

for (const file of files.sort()) {
  const src = readFileSync(join(SCENES_DIR, file), 'utf8');
  const lines = src.split('\n');

  // Collect defaulted private properties (line number + name)
  const defaulted = new Map(); // name -> line number
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(PROP_DECL);
    if (m && !SUPPRESSED.test(lines[i])) defaulted.set(m[1], i + 1);
  }

  if (defaulted.size === 0) continue;

  const createBody = extractCreateBody(src);
  if (!createBody) continue; // no create() — skip (BootScene etc.)

  // Collect everything assigned in create()
  const resetInCreate = new Set();
  let match;
  while ((match = RESET_IN_CREATE.exec(createBody)) !== null) {
    resetInCreate.add(match[1]);
  }

  // Flag properties with defaults NOT reset in create()
  const gaps = [...defaulted.entries()].filter(([name]) => !resetInCreate.has(name));

  if (gaps.length > 0) {
    console.log(`\n${file}`);
    for (const [name, line] of gaps) {
      console.log(`  line ${line}: this.${name} — has default, not reset in create()`);
      totalIssues++;
    }
  }
}

if (totalIssues === 0) {
  console.log('✅ No missing resets found.');
} else {
  console.log(`\n⚠️  ${totalIssues} propert${totalIssues === 1 ? 'y' : 'ies'} with defaults not reset in create().`);
}
