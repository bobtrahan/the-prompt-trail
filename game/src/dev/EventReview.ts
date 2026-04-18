import { EVENTS } from '../data/events';
import type { EventDef, EventChoice } from '../data/events';
import { buildOutcomeLine, outcomeLineColor } from '../utils/outcomeFormatting';

interface EventPatch {
  id: string;
  body?: string;
  choiceTexts?: Record<number, string>;           // default choices
  variantChoiceTexts?: Record<string, Record<number, string>>; // variant → index → text
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
    const val = typeof e.value === 'number'
      ? (e.value >= 0 ? `+${e.value}` : `${e.value}`)
      : String(e.value);
    return `<span class="effect-tag">${escapeHtml(e.type)}: ${escapeHtml(val)}</span>`;
  }).join(' ');
}

function buildChoicesHTML(choices: EventChoice[]): string {
  return choices.map((choice, i) => {
    const outcomeLine = buildOutcomeLine(choice.effects);
    const color = outcomeLineColor(choice.effects);
    const effectsId = `effects-${Math.random().toString(36).slice(2)}`;
    return `<div class="choice">
      <div class="choice-action"><span class="choice-idx">[${i + 1}]</span>&nbsp;<span class="choice-text" data-choice-index="${i}" data-original="${escapeHtml(choice.text)}">${escapeHtml(choice.text)}</span></div>
      <div class="choice-outcome" style="color:${color}">${escapeHtml(outcomeLine)}</div>
      <details class="choice-effects"><summary>effects</summary><div id="${effectsId}" class="effects-list">${buildEffectsHTML(choice)}</div></details>
    </div>`;
  }).join('');
}

function buildPatchString(patch: EventPatch): string {
  const lines: string[] = [`EVENT: ${patch.id}`];
  if (patch.body !== undefined) {
    lines.push(`  body: "${patch.body}"`);
  }
  if (patch.choiceTexts) {
    const indices = Object.keys(patch.choiceTexts).map(Number).sort((a, b) => a - b);
    for (const idx of indices) {
      lines.push(`  choice[${idx}].text: "${patch.choiceTexts[idx]}"`);
    }
  }
  if (patch.variantChoiceTexts) {
    for (const [variant, texts] of Object.entries(patch.variantChoiceTexts)) {
      const indices = Object.keys(texts).map(Number).sort((a, b) => a - b);
      for (const idx of indices) {
        lines.push(`  classVariants.${variant}.choice[${idx}].text: "${texts[idx]}"`);
      }
    }
  }
  return lines.join('\n');
}

function hasRealChanges(patch: EventPatch): boolean {
  return patch.body !== undefined ||
    (patch.choiceTexts !== undefined && Object.keys(patch.choiceTexts).length > 0) ||
    (patch.variantChoiceTexts !== undefined && Object.values(patch.variantChoiceTexts).some(t => Object.keys(t).length > 0));
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
  allBtn.className = 'filter-btn active';
  allBtn.textContent = 'All';
  allBtn.addEventListener('click', () => {
    activeCategory = 'all';
    header.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    allBtn.classList.add('active');
    applyFilter();
  });
  header.appendChild(allBtn);

  for (const cat of CATEGORIES) {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      activeCategory = cat;
      header.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
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

  // Input event delegation for all contenteditable fields
  document.addEventListener('input', (e) => {
    if (!editMode) return;
    const target = e.target as HTMLElement;
    const card = target.closest<HTMLElement>('.event-card');
    if (!card) return;

    if (target.classList.contains('card-body')) {
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
