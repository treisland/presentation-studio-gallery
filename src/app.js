const $ = id => document.getElementById(id);
const theme = $('theme');
theme.value = window.galleryTheme.get();
theme.addEventListener('change', () => window.galleryTheme.set(theme.value));
let catalog, category = 'all', slideIndex = 0, activeItem;
const text = (tag, value, className) => { const el = document.createElement(tag); el.textContent = value; if (className) el.className = className; return el; };
const asset = (item, file) => `./presentations/${encodeURIComponent(item.id)}/${encodeURIComponent(file)}`;
const detailUrl = item => `#presentation/${item.id}`;
const capitalize = value => value[0].toUpperCase() + value.slice(1);

function card(item) {
  const article = document.createElement('article'); article.className = 'card';
  const link = document.createElement('a'); link.href = detailUrl(item);
  const img = document.createElement('img'); img.src = asset(item, item.cover); img.alt = `${item.title} cover`; img.className = 'cover'; img.loading = 'lazy'; img.width = 960; img.height = 540;
  const body = document.createElement('div'); body.className = 'card-body';
  const meta = document.createElement('div'); meta.className = 'card-meta'; meta.append(text('span', item.category), text('span', capitalize(item.type), 'badge'));
  const bottom = document.createElement('div'); bottom.className = 'card-bottom';
  const author = document.createElement('span'); author.className = 'author'; author.append(text('span', item.author.name.slice(0, 1), 'avatar'), text('span', item.author.name));
  const count = text('span', `${item.slideCount} slides`); const arrow = text('span', '↗', 'arrow'); arrow.setAttribute('aria-hidden', 'true'); count.append(arrow); bottom.append(author, count);
  body.append(meta, text('h3', item.title), text('p', item.description, 'card-description'), bottom); link.append(img, body); article.append(link); return article;
}
function filtersFromUrl() {
  const params = new URLSearchParams(location.search);
  $('search').value = params.get('q') || '';
  category = catalog.config.categories.includes(params.get('category')) ? params.get('category') : 'all';
  $('type').value = ['template','showcase'].includes(params.get('type')) ? params.get('type') : 'all';
  $('sort').value = params.get('sort') === 'title' ? 'title' : 'newest';
}
function updateUrl() {
  const url = new URL(location.href); url.search = '';
  if ($('search').value.trim()) url.searchParams.set('q', $('search').value.trim());
  if (category !== 'all') url.searchParams.set('category', category);
  if ($('type').value !== 'all') url.searchParams.set('type', $('type').value);
  if ($('sort').value !== 'newest') url.searchParams.set('sort', $('sort').value);
  history.replaceState(null, '', url);
}
function renderCards() {
  if (!catalog) return;
  const terms = $('search').value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const list = catalog.items.filter(item => {
    const searchable = [item.title,item.description,item.author.name,item.category,...item.tags].join(' ').toLocaleLowerCase();
    return terms.every(term => searchable.includes(term)) && (category === 'all' || item.category === category) && ($('type').value === 'all' || item.type === $('type').value);
  }).sort((a,b) => $('sort').value === 'title' ? a.title.localeCompare(b.title) : b.added.localeCompare(a.added) || a.title.localeCompare(b.title));
  $('cards').replaceChildren(...list.map(card)); $('empty').hidden = list.length !== 0;
  $('result-count').textContent = `${list.length} presentation${list.length === 1 ? '' : 's'}${category !== 'all' ? ` in ${category}` : ''}`;
  for (const button of $('categories').children) button.setAttribute('aria-pressed', String(button.dataset.category === category));
}
function preview() {
  const img = $('slide-preview'); img.src = asset(activeItem, activeItem.previews[slideIndex]); img.alt = `${activeItem.title}, slide ${slideIndex + 1} preview`;
  $('slide-status').textContent = `Slide ${slideIndex + 1} of ${activeItem.slideCount}`;
  $('previous').disabled = slideIndex === 0; $('next').disabled = slideIndex === activeItem.slideCount - 1;
}
function route(focus = false) {
  if (!catalog) return;
  const isDetail = location.hash.startsWith('#presentation/');
  $('gallery').hidden = isDetail; $('detail').hidden = !isDetail; activeItem = undefined;
  if (!isDetail) { document.title = 'Gallery · Presentation Studio'; if (focus) { $('browse-heading').tabIndex = -1; $('browse-heading').focus(); } return; }
  const item = catalog.items.find(i => detailUrl(i) === location.hash);
  const detail = $('detail'); detail.replaceChildren();
  const back = text('a', '← Back to the collection', 'back'); back.href = '#'; detail.append(back);
  if (!item) { const error = text('h1', 'Presentation not found.', 'detail-error'); detail.append(error); document.title = 'Not found · Presentation Studio Gallery'; return; }
  activeItem = item; slideIndex = 0;
  document.title = `${item.title} · Presentation Studio Gallery`;
  const header = document.createElement('div'); header.className = 'detail-header';
  const intro = document.createElement('div'); intro.append(text('span', `${item.category.toUpperCase()} · ${capitalize(item.type)}`, 'eyebrow'));
  const h1 = text('h1', item.title); h1.id = 'detail-title'; h1.tabIndex = -1; intro.append(h1, text('p', item.description, 'detail-description'));
  const actions = document.createElement('div'); actions.className = 'detail-actions';
  const download = text('a', 'Download Studio JSON ↓', 'button'); download.href = asset(item, item.deck); download.download = item.deck;
  const share = text('button', 'Copy link', 'button secondary'); share.type = 'button';
  share.addEventListener('click', async () => { try { await navigator.clipboard.writeText(location.href); share.textContent = 'Link copied'; } catch { share.textContent = 'Copy the URL from your address bar'; } });
  actions.append(download, share); header.append(intro, actions); detail.append(header);
  const viewer = document.createElement('div'); viewer.className = 'viewer'; const img = document.createElement('img'); img.id = 'slide-preview'; img.width = 960; img.height = 540; viewer.append(img);
  const controls = document.createElement('div'); controls.className = 'viewer-controls';
  const prev = text('button', '← Previous'); prev.id = 'previous'; prev.type = 'button'; prev.addEventListener('click', () => { if (slideIndex > 0) { slideIndex--; preview(); } });
  const next = text('button', 'Next →'); next.id = 'next'; next.type = 'button'; next.addEventListener('click', () => { if (slideIndex < item.slideCount - 1) { slideIndex++; preview(); } });
  const status = text('span', ''); status.id = 'slide-status'; status.setAttribute('aria-live', 'polite'); controls.append(prev,status,next); viewer.append(controls); detail.append(viewer);
  const info = document.createElement('div'); info.className = 'detail-info';
  const about = document.createElement('div'); about.append(text('h2', 'Make it your own.'));
  about.append(text('p', 'Download the editable JSON, then use Presentations → Open ZIP / JSON in Presentation Studio. Save your own editable ZIP after making changes.'));
  const doc = text('a', 'Read the Presentation Studio documentation ↗'); doc.href = catalog.config.docs; about.append(doc);
  if (item.previewNote) about.append(text('p', item.previewNote, 'notice'));
  const tags = document.createElement('p'); for (const tag of item.tags) tags.append(text('span', tag, 'tag')); about.append(tags);
  const credits = document.createElement('div'); credits.append(text('h2', 'About this deck'));
  const dl = document.createElement('dl');
  for (const [key,value] of [['Author',item.author.name],['License',item.license],['Added',item.added],['Slides',String(item.slideCount)]]) { const dd = text('dd',value); if (key === 'Author' && item.author.url) { const a = text('a',value); a.href = item.author.url; dd.replaceChildren(a); } dl.append(text('dt',key),dd); }
  credits.append(dl); info.append(about, credits); detail.append(info); preview();
  if (focus) { h1.focus(); window.scrollTo(0,0); }
}
$('search-form').addEventListener('submit', e => e.preventDefault());
document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  $('main').focus({ preventScroll: true });
  $('main').scrollIntoView({ block: 'start' });
});
for (const id of ['search','type','sort']) $(id).addEventListener(id === 'search' ? 'input' : 'change', () => { updateUrl(); renderCards(); });
$('reset').addEventListener('click', () => { category = 'all'; $('search').value = ''; $('type').value = 'all'; $('sort').value = 'newest'; updateUrl(); renderCards(); $('search').focus(); });
$('reload').addEventListener('click', () => location.reload());
addEventListener('hashchange', () => route(true));
addEventListener('popstate', () => { if (catalog) { filtersFromUrl(); renderCards(); route(); } });
addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || ['INPUT','TEXTAREA','SELECT','BUTTON'].includes(document.activeElement.tagName)) return;
  if (e.key === '/' && !activeItem) { e.preventDefault(); $('search').focus(); }
  if (activeItem && e.key === 'ArrowRight') $('next').click();
  if (activeItem && e.key === 'ArrowLeft') $('previous').click();
});
try {
  const response = await fetch('./catalog.json'); if (!response.ok) throw new Error(`Catalog HTTP ${response.status}`); catalog = await response.json();
  for (const cat of ['all', ...catalog.config.categories]) { const button = text('button', cat === 'all' ? 'All presentations' : cat, 'chip'); button.type = 'button'; button.dataset.category = cat; button.addEventListener('click', () => { category = cat; updateUrl(); renderCards(); }); $('categories').append(button); }
  filtersFromUrl(); renderCards(); route();
} catch (error) { $('result-count').textContent = 'Collection unavailable'; $('load-error').hidden = false; console.error(error); }
