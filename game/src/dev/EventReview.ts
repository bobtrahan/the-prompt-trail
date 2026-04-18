import { EVENTS } from '../data/events';
import type { EventDef, EventChoice } from '../data/events';
import { buildOutcomeLine, outcomeLineColor } from '../utils/outcomeFormatting';

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

function buildChoicesHTML(choices: EventChoice[]): string {
  return choices.map((choice, i) => {
    const outcomeLine = buildOutcomeLine(choice.effects);
    const color = outcomeLineColor(choice.effects);
    return `<div class="choice">
      <div class="choice-action">[${i + 1}] ${escapeHtml(choice.text)}</div>
      <div class="choice-outcome" style="color:${color}">${escapeHtml(outcomeLine)}</div>
    </div>`;
  }).join('');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

    // Choices panels — one per variant + default
    const defaultPanel = document.createElement('div');
    defaultPanel.className = 'card-choices';
    defaultPanel.dataset.panel = 'default';
    defaultPanel.innerHTML = buildChoicesHTML(event.choices);
    card.appendChild(defaultPanel);

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
        if (el.dataset.panel === variant) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      });
    });
  } else {
    // No variants — single choices panel
    const choicesPanel = document.createElement('div');
    choicesPanel.className = 'card-choices';
    choicesPanel.innerHTML = buildChoicesHTML(event.choices);
    card.appendChild(choicesPanel);
  }

  return card;
}

function applyFilter(): void {
  const cards = document.querySelectorAll<HTMLElement>('.event-card');
  cards.forEach(card => {
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

  // Filter buttons
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

  app.appendChild(header);

  // Grid
  const grid = document.createElement('div');
  grid.id = 'grid';

  for (const event of EVENTS) {
    grid.appendChild(buildCard(event));
  }

  app.appendChild(grid);
}

init();
