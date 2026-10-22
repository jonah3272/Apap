'use strict';
(() => {
  document.documentElement.classList.add('js');
  const basePath = document.documentElement.dataset.basePath || '';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
  const toggle = $('[data-menu-toggle]');
  const menu = $('#mobile-navigation');
  const closeMenu = () => {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    menu.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.classList.toggle('is-open', open);
    // Mobile menu is a nonmodal disclosure; background remains scrollable.
  });
  menu?.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') { closeMenu(); toggle.focus(); } });
  window.matchMedia('(min-width: 901px)').addEventListener('change', (event) => { if (event.matches) closeMenu(); });

  const searchDialog = $('#site-search');
  const searchInput = $('#site-search-input');
  const searchResults = $('#site-search-results');
  const searchStatus = $('#search-status');
  let searchOpener = null;
  const pages = JSON.parse($('#search-data')?.textContent || '[]');
  const renderResults = () => {
    const query = normalize(searchInput.value).slice(0, 160);
    const terms = query.split(/\s+/).filter(Boolean);
    const score = page => terms.reduce((total, term) => total + (normalize(page.title).includes(term) ? 5 : 0) + (normalize(page.keywords).includes(term) ? 2 : 0), 0);
    const results = pages.filter(page => terms.every(term => normalize(page.title + ' ' + page.description + ' ' + page.keywords).includes(term))).sort((a,b) => score(b)-score(a));
    searchResults.replaceChildren();
    for (const page of results) {
      const li = document.createElement('li');
      const a = document.createElement('a'); a.href = page.url;
      if (page.url.startsWith('https://')) { a.target='_blank'; a.rel='noopener noreferrer'; }
      if (page.kind) { const kind=document.createElement('span');kind.className='search-kind';kind.textContent=page.kind+(page.url.startsWith('https://')?' · Nueva pestaña':'');a.append(kind); }
      const title = document.createElement('strong'); title.textContent = page.title;
      const desc = document.createElement('span'); desc.textContent = page.description;
      if (page.url.startsWith('https://')) { const note=document.createElement('span');note.className='visually-hidden';note.textContent=' (abre en una pestaña nueva)';title.append(note); }
      a.append(title, desc); li.append(a); searchResults.append(li);
    }
    searchStatus.textContent = query ? (results.length ? `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'} para “${searchInput.value.trim()}”.` : 'No hay resultados. Prueba con “ética”, “glosario” o “asociación”.') : 'Explora las páginas del sitio o escribe para buscar.';
  };
  const openSearch = () => {
    if (!searchDialog || typeof searchDialog.showModal !== 'function') { window.location.href = basePath + '/recursos/'; return; }
    closeMenu();
    searchOpener = document.activeElement;
    if (!searchDialog.open) searchDialog.showModal();
    document.body.classList.add('modal-open');
    renderResults(); searchInput.focus();
  };
  $$('[data-open-search]').forEach(button => button.addEventListener('click', openSearch));
  $('[data-close-search]')?.addEventListener('click', () => searchDialog.close());
  searchDialog?.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    searchOpener?.focus();
  });
  searchDialog?.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopPropagation(); searchDialog.close();
    }
  }, true);
  searchDialog?.addEventListener('click', event => { if (event.target === searchDialog) { const rect=searchDialog.getBoundingClientRect(); if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)searchDialog.close(); } });
  searchInput?.addEventListener('input', renderResults);
  $$('[data-search-term]').forEach(button=>button.addEventListener('click',()=>{searchInput.value=button.dataset.searchTerm;renderResults();searchInput.focus();}));
  document.addEventListener('keydown', event => {
    if (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey) && !event.altKey && !event.target.closest('input,textarea,[contenteditable]') && !searchDialog?.open) { event.preventDefault(); openSearch(); }
  });

  const cards = $$('[data-filter-card]');
  const filters = $$('[data-filter]');
  const filterInput = $('#filter-search');
  const filterCount = $('#filter-count');
  const filterEmpty = $('#filter-empty');
  let activeFilter = 'all';
  const filterSlugs = {all:'todos',guides:'guias',official:'institucionales',academic:'academicos',basics:'fundamentos',practice:'practica-forense',ethics:'etica-y-limites'};
  const cardText = new Map(cards.map(card => [card, normalize(card.textContent)]));
  const updateFilter = () => {
    const terms = normalize(filterInput?.value || '').split(/\s+/).filter(Boolean);
    const matchesQuery = card => terms.every(term => cardText.get(card).includes(term));
    let count = 0;
    cards.forEach(card => { const visible = (activeFilter === 'all' || card.dataset.category === activeFilter) && matchesQuery(card); card.hidden = !visible; if (visible) count++; });
    filters.forEach(button => {
      const total = cards.filter(card => matchesQuery(card) && (button.dataset.filter === 'all' || card.dataset.category === button.dataset.filter)).length;
      $('.filter-tally', button).textContent = total;
      button.setAttribute('aria-label', `${button.dataset.filterLabel}: ${total} ${total === 1 ? 'resultado' : 'resultados'}`);
      button.setAttribute('aria-pressed', String(button.dataset.filter === activeFilter));
    });
    if (filterCount) filterCount.textContent = `${count} ${count === 1 ? 'resultado' : 'resultados'}`;
    if (filterEmpty) filterEmpty.hidden = count !== 0;
  };
  const readFilterAddress = () => {
    const params = new URL(window.location.href).searchParams;
    activeFilter = filters.find(button => filterSlugs[button.dataset.filter] === params.get('categoria'))?.dataset.filter || 'all';
    if (filterInput) filterInput.value = (params.get('buscar') || '').slice(0, 160);
    updateFilter();
  };
  const writeFilterAddress = (mode = 'replaceState') => {
    const url = new URL(window.location.href);
    url.searchParams.delete('categoria'); url.searchParams.delete('buscar');
    if (activeFilter !== 'all') url.searchParams.set('categoria', filterSlugs[activeFilter]);
    const query = filterInput?.value.trim();
    if (query) url.searchParams.set('buscar', query);
    const next = url.pathname + url.search + url.hash;
    if (next !== window.location.pathname + window.location.search + window.location.hash) history[mode](null, '', next);
    const feedback = $('#copy-message'); if (feedback) feedback.textContent = '';
  };
  filters.forEach(button => button.addEventListener('click', () => { activeFilter = button.dataset.filter; updateFilter(); writeFilterAddress('pushState'); }));
  filterInput?.addEventListener('input', () => { updateFilter(); writeFilterAddress(); });
  $$('[data-reset-filter]').forEach(button => button.addEventListener('click', () => {
    activeFilter = 'all';
    if (filterInput) filterInput.value = '';
    updateFilter(); writeFilterAddress('pushState'); filterInput?.focus();
  }));
  if (cards.length) {
    readFilterAddress();
    window.addEventListener('popstate', readFilterAddress);
    window.addEventListener('pageshow', readFilterAddress);
  }

  $$('[data-copy-link]').forEach(button => button.addEventListener('click', async () => {
    const output = $('#copy-message');
    try { await navigator.clipboard.writeText(window.location.href); output.textContent = 'Enlace copiado.'; }
    catch { output.textContent = 'No se pudo copiar automáticamente. Puedes copiar el enlace desde la barra de direcciones.'; }
  }));
  $$('[data-print]').forEach(button => button.addEventListener('click', () => window.print()));

  const faqToggle=$('[data-toggle-faq]');
  const updateFaqToggle=()=>{if(faqToggle)faqToggle.textContent=$$('.faq-item').every(item=>item.open)?'Cerrar todas las respuestas':'Mostrar todas las respuestas';};
  faqToggle?.addEventListener('click',()=>{const open=!$$('.faq-item').every(item=>item.open);$$('.faq-item').forEach(item=>{item.open=open;});updateFaqToggle();});
  $$('.faq-item').forEach(item=>item.addEventListener('toggle',updateFaqToggle));
  const sectionLinks=$$('.side-nav a');
  if (sectionLinks.length && 'IntersectionObserver' in window) {
    const visibleSections=new Set();
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>entry.isIntersecting?visibleSections.add(entry.target.id):visibleSections.delete(entry.target.id));
      const active=sectionLinks.find(link=>visibleSections.has(link.hash.slice(1)));
      if(active)sectionLinks.forEach(link=>link===active?link.setAttribute('aria-current','location'):link.removeAttribute('aria-current'));
    },{rootMargin:'-110px 0px -45% 0px',threshold:0});
    sectionLinks.forEach(link=>{const section=document.getElementById(link.hash.slice(1));if(section)observer.observe(section);});
  }
  const progress = $('.reading-progress');
  if (progress && document.body.dataset.article) {
    const updateProgress = () => { const max = document.documentElement.scrollHeight-window.innerHeight; progress.style.width = (max>0?Math.min(100,Math.max(0,window.scrollY/max*100)):0)+'%'; };
    window.addEventListener('scroll', updateProgress, {passive:true}); window.addEventListener('resize', updateProgress); updateProgress();
  }
})();

// Copying a public contact address never sends a message or collects form data.
document.querySelector('[data-copy-email]')?.addEventListener('click', async () => {
  const output = document.querySelector('#email-copy-status');
  const address = document.querySelector('.contact-email')?.textContent;
  if (!output || !address) return;
  try {
    await navigator.clipboard.writeText(address);
    output.textContent = 'Correo copiado.';
  } catch {
    output.textContent = 'Selecciona y copia la dirección de correo que aparece arriba.';
  }
});
