import { EVENTS } from '../data/events';
import type { EventDef, EventChoice } from '../data/events';
import { ROLL_RESOLUTIONS } from '../data/rollResolutions';
import { buildOutcomeParts } from '../utils/outcomeFormatting';
import type { OutcomePart } from '../utils/outcomeFormatting';

interface EventPatch {
  id: string;
  body?: string;
  bodyNote?: string;                              // free-text comment on the event body
  choiceTexts?: Record<number, string>;           // default choices
  choiceNotes?: Record<number, string>;           // free-text comments on default choices
  variantChoiceTexts?: Record<string, Record<number, string>>;
  variantChoiceNotes?: Record<string, Record<number, string>>;
}

type FlagStatus = 'wired' | 'engine' | 'chains' | 'direct' | 'removed';

interface FlagInfo {
  status: FlagStatus;
  note: string;
}

const FLAG_GLOSSARY: Record<string, FlagInfo> = {
  'cloud-access-frozen': { status: 'wired', note: 'Blocks requiresCloud events from firing' },
  'broke': { status: 'wired', note: 'Triggers story branch in ExecutionScene' },
  'cloud-autosave': { status: 'wired', note: 'Sets hasBackupProtection = true; skips all loss effects for one hit' },
  'liquid-nitrogen': { status: 'wired', note: 'Suppresses hardware-overheating from event selection pool' },
  'ups-installed': { status: 'wired', note: 'Suppresses power-flickered from event selection pool' },
  'model-cost-triple': { status: 'wired', note: 'Multiplies daily model cost ×3 in EconomySystem.applyDayCosts' },
  'lose-progress-all': { status: 'wired', note: 'Sets loseProgressSignal = "all"; blocked by hasBackupProtection' },
  'lose-progress-chunk': { status: 'wired', note: 'Sets loseProgressSignal = 0.25; blocked by hasBackupProtection' },
  'agent-reset': { status: 'wired', note: 'Resets state.model to "free" (base tier)' },
  'email-nuke-let-ride': { status: 'chains', note: 'Will chain → "The Replies Keep Coming"' },
  'crypto-investigate': { status: 'chains', note: 'Will chain → "What the Logs Revealed"' },
  'check-logs-reveal': { status: 'chains', note: 'Will chain → "Logs Don\'t Lie"' },
  'cto-remembers': { status: 'chains', note: 'Will chain → "The CTO Reaches Out"' },
  'consulting-client': { status: 'chains', note: 'Will chain → "Client Wants More"' },
  'quality-boost-5pct': { status: 'direct', note: 'Becoming reputation: +5' },
  'quality-boost-20pct': { status: 'direct', note: 'Becoming reputation: +10' },
  'quality-boost-30pct': { status: 'direct', note: 'Becoming reputation: +15' },
  'quality-drop': { status: 'direct', note: 'Becoming reputation: -10' },
  'quality-drop-10pct': { status: 'direct', note: 'Becoming reputation: -10' },
  'quality-drop-15pct': { status: 'direct', note: 'Becoming reputation: -15' },
  'manual-progress-10pct': { status: 'direct', note: 'Becoming reputation: +5' },
  'manual-progress-25pct': { status: 'direct', note: 'Becoming reputation: +10' },
  'morale-up': { status: 'direct', note: 'Becoming reputation: +5' },
  'morale-down': { status: 'direct', note: 'Becoming reputation: -5' },
  'advisor-quality-boost': { status: 'direct', note: 'Becoming reputation: +10' },
  'fomo-sad': { status: 'direct', note: 'Becoming tomorrowTimer: -9s' },
  'informed-model-choice': { status: 'direct', note: 'Becoming tomorrowTimer: +9s' },
  'soft-launch': { status: 'direct', note: 'Becoming reputation: +5' },
  'art-wallpaper': { status: 'direct', note: 'Becoming reputation: +3' },
  'art-merch': { status: 'direct', note: 'Becoming nightBonus: +$50' },
  'branded-hoodie': { status: 'direct', note: 'Becoming reputation: +5' },
  'bird-mascot': { status: 'direct', note: 'Becoming tomorrowTimer: +6s' },
  'web3-token': { status: 'direct', note: 'Becoming nightBonus: +$25' },
  'celebration-morale': { status: 'direct', note: 'Becoming tomorrowTimer: +9s' },
  'unhinged-mode': { status: 'direct', note: 'Becoming reputation: -5' },
  'boss-watching': { status: 'direct', note: 'Becoming tomorrowTimer: -6s' },
  'work-offline': { status: 'direct', note: 'Redundant with agentSpeed — dropping flag' },
  'local-model': { status: 'direct', note: 'Redundant with modelSwitch — dropping flag' },
  'agent-a-slower': { status: 'removed', note: 'No per-agent speed system — dropping' },
  'agent-b-slower': { status: 'removed', note: 'No per-agent speed system — dropping' },
  'finance-meeting-pending': { status: 'removed', note: 'Replacing with tomorrowTimer: -6s' },
  'mandatory-meeting-tomorrow': { status: 'removed', note: 'Replacing with tomorrowTimer: -9s' },
  'double-events-tomorrow': { status: 'removed', note: 'Not implementable — replacing with reputation: -10' },
  'viral-notification-spam': { status: 'removed', note: 'Replacing with tomorrowTimer: -6s' },
  'update-notification-spam': { status: 'removed', note: 'Already replaced with hardware: -15' },
  'model-intel': { status: 'removed', note: 'Replacing with reputation: +5' },
  'model-unlocked-standard': { status: 'removed', note: 'Replacing with modelSwitch: standard' },
  'model-switch-cost': { status: 'removed', note: 'Redundant — budget effect already present' },
  'coworker-drama-30pct': { status: 'removed', note: 'No follow-up event — dropping' },
  'rage-refresh': { status: 'removed', note: 'No follow-up event — dropping' },
};

const FLAG_STATUS_COLORS: Record<FlagStatus, string> = {
  wired: '#3fb950',
  engine: '#58a6ff',
  chains: '#bc8cff',
  direct: '#d29922',
  removed: '#f85149',
};

const FLAG_STATUS_ICONS: Record<FlagStatus, string> = {
  wired: '✅',
  engine: '🔧',
  chains: '🔗',
  direct: '💬',
  removed: '🗑',
};

const FLAG_STATUS_LABELS: Record<FlagStatus, string> = {
  wired: '✅ Wired',
  engine: '🔧 Engine (planned)',
  chains: '🔗 Chains (planned)',
  direct: '💬 Direct (converting)',
  removed: '🗑 Removed (converting)',
};

const FLAG_STATUS_ORDER: FlagStatus[] = ['wired', 'engine', 'chains', 'direct', 'removed'];

for (const key of Object.keys(ROLL_RESOLUTIONS)) {
  if (!FLAG_GLOSSARY[key]) {
    FLAG_GLOSSARY[key] = {
      status: 'wired',
      note: `Roll: ${Math.round(ROLL_RESOLUTIONS[key].chance * 100)}% chance — see rollResolutions.ts`,
    };
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  technical: '#f85149',
  business:  '#d29922',
  agent:     '#58a6ff',
  hardware:  '#f0883e',
  social:    '#3fb950',
  meta:      '#bc8cff',
};

const CATEGORIES = ['technical', 'business', 'agent', 'hardware', 'social', 'meta'] as const;

let activeCategory = 'all';
let searchQuery = '';
let editMode = false;
const changes: Map<string, EventPatch> = new Map();

let changesBadge: HTMLSpanElement;
let copyAllBtn: HTMLButtonElement;
let editToggleBtn: HTMLButtonElement;
let flagsToggleBtn: HTMLButtonElement;
let flagPanel: HTMLDivElement;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildEffectsHTML(choice: EventChoice): string {
  if (choice.effects.length === 0) return '<em style="color:#484f58">no effects</em>';
  return choice.effects.map(e => {
    if (e.type === 'flag') {
      const flagKey = String(e.value);
      const info = FLAG_GLOSSARY[flagKey];
      const chipColor = info ? FLAG_STATUS_COLORS[info.status] : '#484f58';
      const chipIcon = info ? FLAG_STATUS_ICONS[info.status] : '❓';
      return `<span class="effect-tag flag-chip" style="border-color:${chipColor};color:${chipColor}" title="${escapeHtml(info?.note ?? 'unknown flag')}">${chipIcon} flag: ${escapeHtml(flagKey)}</span>`;
    }
    const val = typeof e.value === 'number'
      ? (e.value >= 0 ? `+${e.value}` : `${e.value}`)
      : String(e.value);
    return `<span class="effect-tag">${escapeHtml(e.type)}: ${escapeHtml(val)}</span>`;
  }).join(' ');
}

function buildChoicesHTML(choices: EventChoice[]): string {
  return choices.map((choice, i) => {
    const parts: OutcomePart[] = buildOutcomeParts(choice.effects);
    const outcomeHTML = parts.length > 0
      ? parts.map(p => `<span style="color:${p.color}">${escapeHtml(p.text)}</span>`).join('')
      : `<span style="color:#484f58">—</span>`;
    return `<div class="choice">
      <div class="choice-action"><span class="choice-idx">[${i + 1}]</span>&nbsp;<span class="choice-text" data-choice-index="${i}" data-original="${escapeHtml(choice.text)}">${escapeHtml(choice.text)}</span></div>
      <div class="choice-outcome">${outcomeHTML}</div>
      <details class="choice-effects"><summary>effects</summary><div class="effects-list">${buildEffectsHTML(choice)}</div></details>
      <textarea class="choice-note" data-choice-index="${i}" placeholder="note on choice ${i + 1}..."></textarea>
    </div>`;
  }).join('');
}

function buildPatchString(patch: EventPatch): string {
  const lines: string[] = [`EVENT: ${patch.id}`];
  if (patch.body !== undefined) lines.push(`  body: "${patch.body}"`);
  if (patch.bodyNote) lines.push(`  # ${patch.bodyNote}`);

  // Gather all touched choice indices across text + notes
  const defaultIndices = new Set([
    ...Object.keys(patch.choiceTexts ?? {}).map(Number),
    ...Object.keys(patch.choiceNotes ?? {}).map(Number),
  ]);
  for (const idx of [...defaultIndices].sort((a, b) => a - b)) {
    if (patch.choiceTexts?.[idx] !== undefined)
      lines.push(`  choice[${idx}].text: "${patch.choiceTexts[idx]}"`);
    if (patch.choiceNotes?.[idx])
      lines.push(`  choice[${idx}].# ${patch.choiceNotes[idx]}`);
  }

  if (patch.variantChoiceTexts || patch.variantChoiceNotes) {
    const variants = new Set([
      ...Object.keys(patch.variantChoiceTexts ?? {}),
      ...Object.keys(patch.variantChoiceNotes ?? {}),
    ]);
    for (const variant of variants) {
      const textMap = patch.variantChoiceTexts?.[variant] ?? {};
      const noteMap = patch.variantChoiceNotes?.[variant] ?? {};
      const indices = new Set([...Object.keys(textMap), ...Object.keys(noteMap)].map(Number));
      for (const idx of [...indices].sort((a, b) => a - b)) {
        if (textMap[idx] !== undefined)
          lines.push(`  classVariants.${variant}.choice[${idx}].text: "${textMap[idx]}"`);
        if (noteMap[idx])
          lines.push(`  classVariants.${variant}.choice[${idx}].# ${noteMap[idx]}`);
      }
    }
  }
  return lines.join('\n');
}

function hasRealChanges(patch: EventPatch): boolean {
  return patch.body !== undefined ||
    !!patch.bodyNote ||
    (patch.choiceTexts !== undefined && Object.keys(patch.choiceTexts).length > 0) ||
    (patch.choiceNotes !== undefined && Object.values(patch.choiceNotes).some(Boolean)) ||
    (patch.variantChoiceTexts !== undefined && Object.values(patch.variantChoiceTexts).some(t => Object.keys(t).length > 0)) ||
    (patch.variantChoiceNotes !== undefined && Object.values(patch.variantChoiceNotes).some(m => Object.values(m).some(Boolean)));
}

function updateCardUI(card: HTMLElement): void {
  const eventId = card.dataset.id!;
  const patch = changes.get(eventId);
  const hasPatch = !!patch && hasRealChanges(patch);

  card.classList.toggle('card-changed', hasPatch);

  const copyBtn = card.querySelector<HTMLButtonElement>('.copy-patch-btn')!;
  copyBtn.classList.toggle('hidden', !(editMode && hasPatch));
}

function updateHeader(): void {
  const total = Array.from(changes.values()).filter(hasRealChanges).length;

  if (total > 0) {
    changesBadge.textContent = `${total} change${total === 1 ? '' : 's'}`;
    changesBadge.classList.remove('hidden');
    copyAllBtn.classList.toggle('hidden', !editMode);
  } else {
    changesBadge.classList.add('hidden');
    copyAllBtn.classList.add('hidden');
  }
}

function getOrCreatePatch(eventId: string): EventPatch {
  if (!changes.has(eventId)) {
    changes.set(eventId, { id: eventId });
  }
  return changes.get(eventId)!;
}

function onBodyInput(card: HTMLElement, bodyEl: HTMLElement): void {
  const eventId = card.dataset.id!;
  const original = bodyEl.dataset.original ?? '';
  const current = bodyEl.textContent ?? '';
  const patch = getOrCreatePatch(eventId);

  if (current !== original) {
    patch.body = current;
    bodyEl.classList.add('dirty-field');
  } else {
    delete patch.body;
    bodyEl.classList.remove('dirty-field');
  }

  updateCardUI(card);
  updateHeader();
}

function onChoiceInput(card: HTMLElement, span: HTMLElement): void {
  const eventId = card.dataset.id!;
  const idx = parseInt(span.dataset.choiceIndex ?? '0', 10);
  const original = span.dataset.original ?? '';
  const current = span.textContent ?? '';
  const patch = getOrCreatePatch(eventId);
  // Which panel is this span in?
  const panel = span.closest<HTMLElement>('.card-choices');
  const panelKey = panel?.dataset.panel ?? 'default';
  const isDefault = panelKey === 'default';

  if (current !== original) {
    if (isDefault) {
      if (!patch.choiceTexts) patch.choiceTexts = {};
      patch.choiceTexts[idx] = current;
    } else {
      if (!patch.variantChoiceTexts) patch.variantChoiceTexts = {};
      if (!patch.variantChoiceTexts[panelKey]) patch.variantChoiceTexts[panelKey] = {};
      patch.variantChoiceTexts[panelKey][idx] = current;
    }
    span.classList.add('dirty-field');
  } else {
    if (isDefault) {
      if (patch.choiceTexts) {
        delete patch.choiceTexts[idx];
        if (Object.keys(patch.choiceTexts).length === 0) delete patch.choiceTexts;
      }
    } else {
      if (patch.variantChoiceTexts?.[panelKey]) {
        delete patch.variantChoiceTexts[panelKey][idx];
        if (Object.keys(patch.variantChoiceTexts[panelKey]).length === 0)
          delete patch.variantChoiceTexts[panelKey];
        if (Object.keys(patch.variantChoiceTexts).length === 0)
          delete patch.variantChoiceTexts;
      }
    }
    span.classList.remove('dirty-field');
  }

  updateCardUI(card);
  updateHeader();
}

function onChoiceNoteInput(card: HTMLElement, textarea: HTMLTextAreaElement): void {
  const eventId = card.dataset.id!;
  const idx = parseInt(textarea.dataset.choiceIndex ?? '0', 10);
  const note = textarea.value.trim();
  const patch = getOrCreatePatch(eventId);
  const panel = textarea.closest<HTMLElement>('.card-choices');
  const panelKey = panel?.dataset.panel ?? 'default';
  const isDefault = panelKey === 'default';

  if (isDefault) {
    if (note) {
      if (!patch.choiceNotes) patch.choiceNotes = {};
      patch.choiceNotes[idx] = note;
    } else {
      if (patch.choiceNotes) {
        delete patch.choiceNotes[idx];
        if (Object.keys(patch.choiceNotes).length === 0) delete patch.choiceNotes;
      }
    }
  } else {
    if (note) {
      if (!patch.variantChoiceNotes) patch.variantChoiceNotes = {};
      if (!patch.variantChoiceNotes[panelKey]) patch.variantChoiceNotes[panelKey] = {};
      patch.variantChoiceNotes[panelKey][idx] = note;
    } else {
      if (patch.variantChoiceNotes?.[panelKey]) {
        delete patch.variantChoiceNotes[panelKey][idx];
        if (Object.keys(patch.variantChoiceNotes[panelKey]).length === 0)
          delete patch.variantChoiceNotes[panelKey];
        if (Object.keys(patch.variantChoiceNotes).length === 0)
          delete patch.variantChoiceNotes;
      }
    }
  }

  updateCardUI(card);
  updateHeader();
}

function enableEditMode(): void {
  document.querySelectorAll<HTMLElement>('.event-card').forEach(card => {
    const body = card.querySelector<HTMLElement>('.card-body');
    if (body) body.contentEditable = 'true';
    // Enable ALL panels, not just default
    card.querySelectorAll<HTMLElement>('.choice-text').forEach(span => {
      span.contentEditable = 'true';
    });
    updateCardUI(card);
  });
}

function disableEditMode(): void {
  document.querySelectorAll<HTMLElement>('.event-card').forEach(card => {
    const body = card.querySelector<HTMLElement>('.card-body');
    if (body) body.contentEditable = 'false';

    card.querySelectorAll<HTMLElement>('.choice-text').forEach(span => {
      span.contentEditable = 'false';
    });

    updateCardUI(card);
  });
  copyAllBtn.classList.add('hidden');
}

function toggleEditMode(): void {
  editMode = !editMode;
  editToggleBtn.textContent = editMode ? '👁 View Mode' : '✏️ Edit Mode';

  if (editMode) {
    enableEditMode();
  } else {
    disableEditMode();
  }
  updateHeader();
}

async function copyToClipboard(text: string, btn: HTMLButtonElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    const original = btn.textContent ?? '';
    btn.textContent = '✓ Copied!';
    setTimeout(() => { btn.textContent = original; }, 1500);
  } catch {
    // clipboard not available
  }
}

function buildCard(event: EventDef): HTMLElement {
  const card = document.createElement('div');
  card.className = 'event-card';
  card.dataset.id = event.id;
  card.dataset.title = event.title.toLowerCase();
  card.dataset.body = event.body.toLowerCase();
  card.dataset.category = event.category;

  const accentColor = CATEGORY_COLORS[event.category] ?? '#30363d';

  // Titlebar
  const titlebar = document.createElement('div');
  titlebar.className = 'card-titlebar';
  titlebar.style.borderBottomColor = accentColor;
  titlebar.innerHTML = `<span class="card-category">${escapeHtml(event.category)}</span><span class="card-title">${escapeHtml(event.title)}</span>`;
  card.appendChild(titlebar);

  // Body
  const body = document.createElement('div');
  body.className = 'card-body';
  body.textContent = event.body;
  body.dataset.original = event.body;
  card.appendChild(body);

  const hasVariants = event.classVariants && Object.keys(event.classVariants).length > 0;

  if (hasVariants && event.classVariants) {
    const variantKeys = Object.keys(event.classVariants) as string[];

    // Variant tabs
    const tabs = document.createElement('div');
    tabs.className = 'variant-tabs';

    const defaultTab = document.createElement('button');
    defaultTab.className = 'variant-tab active';
    defaultTab.textContent = 'default';
    defaultTab.dataset.variant = 'default';
    tabs.appendChild(defaultTab);

    for (const key of variantKeys) {
      const tab = document.createElement('button');
      tab.className = 'variant-tab';
      tab.textContent = key;
      tab.dataset.variant = key;
      tabs.appendChild(tab);
    }
    card.appendChild(tabs);

    // Default choices panel
    const defaultPanel = document.createElement('div');
    defaultPanel.className = 'card-choices';
    defaultPanel.dataset.panel = 'default';
    defaultPanel.innerHTML = buildChoicesHTML(event.choices);
    card.appendChild(defaultPanel);

    // Variant choices panels
    for (const key of variantKeys) {
      const variantChoices = event.classVariants[key as keyof typeof event.classVariants];
      const mergedChoices = variantChoices?.choices
        ? [...event.choices.slice(0, event.choices.length), ...variantChoices.choices]
        : event.choices;
      // Spec: variant.choices overrides default choices
      const finalChoices = variantChoices?.choices ?? event.choices;

      const panel = document.createElement('div');
      panel.className = 'card-choices hidden';
      panel.dataset.panel = key;
      panel.innerHTML = buildChoicesHTML(finalChoices);
      card.appendChild(panel);
      void mergedChoices; // unused, variant fully replaces
    }

    // Tab click handler
    tabs.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const variant = target.dataset.variant;
      if (!variant) return;
      tabs.querySelectorAll('.variant-tab').forEach(t => t.classList.remove('active'));
      target.classList.add('active');
      card.querySelectorAll('.card-choices').forEach(p => {
        const el = p as HTMLElement;
        el.classList.toggle('hidden', el.dataset.panel !== variant);
      });
    });
  } else {
    // No variants — single default panel
    const choicesPanel = document.createElement('div');
    choicesPanel.className = 'card-choices';
    choicesPanel.dataset.panel = 'default';
    choicesPanel.innerHTML = buildChoicesHTML(event.choices);
    card.appendChild(choicesPanel);
  }

  // Copy Patch button — hidden until this card has changes in edit mode
  const copyPatchBtn = document.createElement('button');
  copyPatchBtn.className = 'copy-patch-btn hidden';
  copyPatchBtn.textContent = '📋 Copy Patch';
  copyPatchBtn.addEventListener('click', () => {
    const patch = changes.get(event.id);
    if (!patch || !hasRealChanges(patch)) return;
    void copyToClipboard(buildPatchString(patch), copyPatchBtn);
  });
  card.appendChild(copyPatchBtn);

  return card;
}

function applyFilter(): void {
  document.querySelectorAll<HTMLElement>('.event-card').forEach(card => {
    const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query
      || (card.dataset.id ?? '').includes(query)
      || (card.dataset.title ?? '').includes(query)
      || (card.dataset.body ?? '').includes(query);
    card.classList.toggle('hidden', !(matchesCategory && matchesSearch));
  });
}

function buildFlagPanelHTML(): string {
  const entries = Object.entries(FLAG_GLOSSARY).sort(([a], [b]) => a.localeCompare(b));

  return FLAG_STATUS_ORDER.map((status) => {
    const flags = entries.filter(([, info]) => info.status === status);
    if (flags.length === 0) return '';

    const rows = flags.map(([flag, info]) => {
      const color = FLAG_STATUS_COLORS[info.status];
      const icon = FLAG_STATUS_ICONS[info.status];
      return `<div class="flag-panel-row"><span class="flag-panel-name" style="color:${color}">${icon} ${escapeHtml(flag)}</span><span class="flag-panel-note"> — ${escapeHtml(info.note)}</span></div>`;
    }).join('');

    return `<div class="flag-panel-group">
      <div class="flag-panel-group-title">${FLAG_STATUS_LABELS[status]}</div>
      <div class="flag-panel-grid">${rows}</div>
    </div>`;
  }).join('');
}

function toggleFlagPanel(): void {
  const isHidden = flagPanel.classList.toggle('hidden');
  flagsToggleBtn.classList.toggle('active', !isHidden);
}

function init(): void {
  const app = document.getElementById('app')!;

  // Header
  const header = document.createElement('div');
  header.id = 'header';

  const title = document.createElement('h1');
  title.textContent = `Event Reviewer — The Prompt Trail (${EVENTS.length} events)`;
  header.appendChild(title);

  const search = document.createElement('input');
  search.id = 'search';
  search.type = 'text';
  search.placeholder = 'Search title, body...';
  search.addEventListener('input', () => {
    searchQuery = search.value;
    applyFilter();
  });
  header.appendChild(search);

  // Category filter buttons
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn category-filter-btn active';
  allBtn.textContent = 'All';
  allBtn.addEventListener('click', () => {
    activeCategory = 'all';
    header.querySelectorAll('.category-filter-btn').forEach(b => b.classList.remove('active'));
    allBtn.classList.add('active');
    applyFilter();
  });
  header.appendChild(allBtn);

  for (const cat of CATEGORIES) {
    const btn = document.createElement('button');
    btn.className = 'filter-btn category-filter-btn';
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      activeCategory = cat;
      header.querySelectorAll('.category-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter();
    });
    header.appendChild(btn);
  }

  // Edit mode toggle
  editToggleBtn = document.createElement('button');
  editToggleBtn.className = 'filter-btn edit-toggle-btn';
  editToggleBtn.textContent = '✏️ Edit Mode';
  editToggleBtn.addEventListener('click', toggleEditMode);
  header.appendChild(editToggleBtn);

  flagsToggleBtn = document.createElement('button');
  flagsToggleBtn.className = 'filter-btn flags-toggle-btn';
  flagsToggleBtn.textContent = '📖 Flags';
  flagsToggleBtn.addEventListener('click', toggleFlagPanel);
  header.appendChild(flagsToggleBtn);

  // Changes badge (amber, hidden until edits exist)
  changesBadge = document.createElement('span');
  changesBadge.className = 'changes-badge hidden';
  header.appendChild(changesBadge);

  // Copy All Changes (hidden until edits exist and in edit mode)
  copyAllBtn = document.createElement('button');
  copyAllBtn.className = 'filter-btn copy-all-btn hidden';
  copyAllBtn.textContent = '📋 Copy All Changes';
  copyAllBtn.addEventListener('click', () => {
    const patches = Array.from(changes.values()).filter(hasRealChanges);
    const text = patches.map(buildPatchString).join('\n\n');
    void copyToClipboard(text, copyAllBtn);
  });
  header.appendChild(copyAllBtn);

  app.appendChild(header);

  flagPanel = document.createElement('div');
  flagPanel.id = 'flag-panel';
  flagPanel.className = 'hidden';
  flagPanel.innerHTML = buildFlagPanelHTML();
  app.appendChild(flagPanel);

  // Input event delegation for all contenteditable fields and note textareas
  // Notes are always active (no edit mode gate) so you can annotate without toggling edit mode
  document.addEventListener('input', (e) => {
    const target = e.target as HTMLElement;
    const card = target.closest<HTMLElement>('.event-card');
    if (!card) return;

    if (target.classList.contains('choice-note')) {
      // Notes work regardless of edit mode
      onChoiceNoteInput(card, target as HTMLTextAreaElement);
    } else if (!editMode) {
      return;
    } else if (target.classList.contains('card-body')) {
      onBodyInput(card, target);
    } else if (target.classList.contains('choice-text')) {
      onChoiceInput(card, target);
    }
  });

  // Grid
  const grid = document.createElement('div');
  grid.id = 'grid';

  for (const event of EVENTS) {
    grid.appendChild(buildCard(event));
  }

  app.appendChild(grid);
}

init();
