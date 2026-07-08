/* =========================================================
   PROJECT DATA
   Add, remove, or edit projects here. Every field is
   required except `tags` (which can be any length).
   Tags automatically become filter chips — no extra
   wiring needed when you add a new tag.
   `c1` / `c2` are two hex colors used to tint the
   placeholder thumbnail gradient (used as a fallback
   behind the video/iframe, and as the whole background
   if there's no video).
========================================================= */
const projects = [
  {
    title: "Italiano: Scuola Leonardo da Vinci - Roma",
    date: "2026",
    description: "Video di 3 minuti per presentarmi alla scuola e fare domande sul loro insegnamento.",
    tags: ["Video"],
    c1: "#6E7F5C", c2: "#D6DEC6",
    video: "https://www.youtube.com/embed/VIDEO_ID"
  },
  {
    title: "RETAKES L3 CAM épreuve 2",
    date: "2026",
    description: "Présentation du contenu des modules CAM, suivi d'une réflexion personnelle sur son intérêt.",
    tags: ["Video"],
    c1: "#A6B493", c2: "#EDF0E5",
    video: "https://www.youtube.com/embed/VIDEO_ID"
  }
];

/* =========================================================
   DOM REFERENCES
   Grab the elements we'll need to read from / write to.
========================================================= */
const piecesContainer = document.getElementById('piecesContainer');
const tagFiltersEl     = document.getElementById('tagFilters');
const searchInput      = document.getElementById('searchInput');
const viewGalleryBtn   = document.getElementById('viewGallery');
const viewListBtn      = document.getElementById('viewList');

/* =========================================================
   APPLICATION STATE
   - activeTags: which tag chips are currently toggled on
   - query: current text typed into the search box
   - view: 'gallery' or 'list'
========================================================= */
const state = { activeTags: new Set(), query: '', view: 'gallery' };

/* Collect every unique tag across all projects, sorted A-Z.
   This is what powers the filter chip row. */
function allTags(){
  const set = new Set();
  projects.forEach(p => p.tags.forEach(t => set.add(t)));
  return Array.from(set).sort((a,b) => a.localeCompare(b));
}

/* Draw the "All" chip plus one chip per tag.
   Clicking "All" clears every active tag filter.
   Clicking a tag toggles it on/off in state.activeTags. */
function renderChips(){
  const tags = allTags();
  tagFiltersEl.innerHTML = '';

  const allChip = document.createElement('button');
  allChip.className = 'chip all';
  allChip.textContent = 'All';
  allChip.setAttribute('aria-pressed', state.activeTags.size === 0);
  allChip.addEventListener('click', () => { state.activeTags.clear(); renderChips(); renderProjects(); });
  tagFiltersEl.appendChild(allChip);

  tags.forEach(tag => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = tag;
    chip.setAttribute('aria-pressed', state.activeTags.has(tag));
    chip.addEventListener('click', () => {
      state.activeTags.has(tag) ? state.activeTags.delete(tag) : state.activeTags.add(tag);
      renderChips();
      renderProjects();
    });
    tagFiltersEl.appendChild(chip);
  });
}

/* A project "matches" if:
   - no tags are active OR the project has at least one active tag, AND
   - the search query is empty OR found in the title/description/tags text */
function matchesFilters(project){
  const tagOk = state.activeTags.size === 0 ||
    project.tags.some(t => state.activeTags.has(t));
  const haystack = (project.title + ' ' + project.description + ' ' + project.tags.join(' ')).toLowerCase();
  const queryOk = state.query.trim() === '' || haystack.includes(state.query.trim().toLowerCase());
  return tagOk && queryOk;
}

/* Rebuild the project grid/list from scratch based on
   current filters, search query, and view mode. */
function renderProjects(){
  const filtered = projects
    .map((p, i) => ({ ...p, index: i + 1 })) // keep original numbering (No. 01, 02...) even after filtering
    .filter(matchesFilters);

  piecesContainer.className = `pieces view-${state.view}`;

  if (filtered.length === 0){
    piecesContainer.innerHTML = `<div class="empty-state">No pieces match — try clearing a filter or the search.</div>`;
    return;
  }

  piecesContainer.innerHTML = filtered.map(p => `
    <article class="piece">
      <div class="art" style="--c1:${p.c1}; --c2:${p.c2};">
        ${p.video
          ? (p.video.includes('youtube.com') || p.video.includes('youtu.be')
              ? `<iframe src="${p.video}" allowfullscreen loading="lazy"></iframe>`
              : `<video controls preload="metadata"><source src="${p.video}" type="video/mp4"></video>`)
          : `<span class="art-mark">${p.title.charAt(0)}</span>`}
      </div>
      <div class="placard">
        <p class="placard-no">No. ${String(p.index).padStart(2,'0')}</p>
        <h3 class="piece-title">${p.title} <span class="piece-date">— ${p.date}</span></h3>
        <p class="piece-desc">${p.description}</p>
        <ul class="piece-tags">
          ${p.tags.map(t => `<li>${t}</li>`).join('')}
        </ul>
      </div>
    </article>
  `).join('');
}

/* =========================================================
   EVENT LISTENERS
========================================================= */

// Live search: re-render on every keystroke
searchInput.addEventListener('input', e => {
  state.query = e.target.value;
  renderProjects();
});

// Gallery / List view toggle buttons
viewGalleryBtn.addEventListener('click', () => {
  state.view = 'gallery';
  viewGalleryBtn.setAttribute('aria-pressed', 'true');
  viewListBtn.setAttribute('aria-pressed', 'false');
  renderProjects();
});
viewListBtn.addEventListener('click', () => {
  state.view = 'list';
  viewListBtn.setAttribute('aria-pressed', 'true');
  viewGalleryBtn.setAttribute('aria-pressed', 'false');
  renderProjects();
});

/* =========================================================
   PAGE NAVIGATION (CV <-> Portfolio tabs)
   Only one <section data-page="..."> is shown at a time.
   The current page is also reflected in the URL hash
   (e.g. #portfolio) so links/bookmarks/back-button work.
========================================================= */
const navButtons = document.querySelectorAll('.tab-btn');
const pages = document.querySelectorAll('section[data-page]');

function showPage(name){
  pages.forEach(s => s.classList.toggle('is-active', s.dataset.page === name));
  navButtons.forEach(b => b.setAttribute('aria-selected', b.dataset.page === name));
  history.replaceState(null, '', '#' + name);
}

navButtons.forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.page)));

/* =========================================================
   INITIALIZATION
   Runs once when the script loads: figure out which page
   to show based on the URL hash, then do the first render
   of the filter chips and the project list.
========================================================= */
const initial = location.hash.replace('#','');
showPage(initial === 'portfolio' ? 'portfolio' : 'cv');

renderChips();
renderProjects();
