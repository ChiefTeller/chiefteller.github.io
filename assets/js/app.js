(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const body = document.body;

  const saved = JSON.parse(localStorage.getItem('nadavSitePrefs') || '{}');
  if(saved.contrast) body.classList.add('high-contrast');
  if(saved.largeText) body.classList.add('large-text');
  if(saved.reduceMotion) body.classList.add('reduce-motion');
  function savePrefs(){
    localStorage.setItem('nadavSitePrefs', JSON.stringify({
      contrast: body.classList.contains('high-contrast'),
      largeText: body.classList.contains('large-text'),
      reduceMotion: body.classList.contains('reduce-motion')
    }));
  }

  const navToggle = $('[data-nav-toggle]');
  const mainNav = $('[data-main-nav]');
  if(navToggle && mainNav){
    navToggle.addEventListener('click',()=>{
      const open = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
  }

  const current = location.pathname.split('/').pop() || 'index.html';
  $$('[data-main-nav] a').forEach(a=>{
    const href = a.getAttribute('href');
    if(href === current || (current === '' && href === 'index.html')) a.setAttribute('aria-current','page');
  });

  const progress = $('.read-progress');
  if(progress){
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const ratio = max > 0 ? scrollY / max : 0;
      progress.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
    };
    addEventListener('scroll', updateProgress, {passive:true});
    updateProgress();
  }

  const accessBtn = $('[data-access-open]');
  const accessPanel = $('[data-access-panel]');
  if(accessBtn && accessPanel){
    accessBtn.addEventListener('click',()=>{
      const open = accessPanel.classList.toggle('open');
      accessBtn.setAttribute('aria-expanded', String(open));
    });
    $$('[data-pref]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const pref = btn.dataset.pref;
        if(pref === 'contrast') body.classList.toggle('high-contrast');
        if(pref === 'largeText') body.classList.toggle('large-text');
        if(pref === 'reduceMotion') body.classList.toggle('reduce-motion');
        savePrefs();
      });
    });
  }

  const searchBtn = $('[data-search-open]');
  const searchPanel = $('[data-search-panel]');
  const searchInput = $('[data-site-search]');
  const searchResults = $('[data-site-results]');
  const siteIndex = [
    {title:'Nadav Teller English', url:'index-en.html', desc:'English homepage for AI, state models, future society, books and bots'},
    {title:'מאמרים', url:'articles/index.html', desc:'מאמרים על ישראל, AI, יוקר המחיה, כלכלה, פוליטיקה ותורת המדינה הדואלית'},
    {title:'Articles', url:'articles/index-en.html', desc:'English articles about Israel, AI, economy, politics and Dual Market State'},
    {title:'תורת המדינה הדואלית', url:'dual-state.html', desc:'מודל מדינת שוק דואלי, שוק חופשי לצד רצפה אזרחית חזקה'},
    {title:'Dual Market State', url:'dual-state-en.html', desc:'English model page for AI governance, civic floor, future state and economy'},
    {title:'What is Dual Market State?', url:'articles/what-is-dual-market-state-en.html', desc:'English article about AI, democracy, housing crisis, capitalism, socialism and future governance'},
    {title:'ביבי בנט לפיד יוקר המחיה ו-AI', url:'articles/israel-political-pendulum-ai-cost-of-living.html', desc:'מאמר על ישראל, ביבי, בנט, לפיד, יוקר המחיה, מחירי הדירות, AI והמטוטלת הפוליטית'},
    {title:'Netanyahu Bennett Lapid cost of living and AI', url:'articles/israel-political-pendulum-ai-cost-of-living-en.html', desc:'English article about Israel political pendulum, cost of living, housing crisis and AI'},
    {title:'מחירי הדירות בישראל ומשבר הדיור', url:'articles/israel-housing-crisis-ai-economy.html', desc:'מאמר על מחירי הדירות בישראל, משכנתא, שכר דירה, יוקר המחיה, AI, בנקים ואי שוויון'},
    {title:'Housing prices in Israel and AI economy', url:'articles/israel-housing-crisis-ai-economy-en.html', desc:'English article about Israel housing crisis, mortgages, rent, cost of living, AI economy and inequality'},
    {title:'ספרים', url:'books.html', desc:'כל הספרים של נדב טלר באמזון ובעברית'},
    {title:'Books by Nadav Teller', url:'books-en.html', desc:'English books page for Dual Market State, health, Tao and witness consciousness'},
    {title:'בוטים בטלגרם', url:'bots.html', desc:'Dual_State_bot ו-TheWitnessNDV_bot'},
    {title:'Nadav Teller Bots', url:'bots-en.html', desc:'English bot page for AI, books, Israel, economy, democracy and Future of Work'},
    {title:'Israeli Merkava', url:'merkava-israelit-en.html', desc:'English participation page for translation, tools, AI education and civic action'},
    {title:'סולם העדות הציוויליזציונית', url:'books.html#witness-book', desc:'מודל פילוסופי למדידת כוח לפי עומק העדות'},
    {title:'אוצרות הטאו וספר יסוד', url:'books.html#tao-books', desc:'ספרי ילדים, נשימה, במבוק, גוף ותנועה'},
    {title:'הרשמה ועדכונים', url:'https://forms.gle/Pm6Scd9xNanFKUUW9', desc:'טופס הצטרפות ועדכונים'},
    {title:'מודל מדינת שוק דואלי', url:'dual-state.html#model', desc:'קונצרן לאומי, קרן ריבונית, בנק ציבורי ורצפה אזרחית'},
    {title:'העד', url:'bots.html#witness-bot', desc:'בוט פילוסופי אישי להחזיר את האדם לעדות ולנוכחות'},
    {title:'ספר יסוד', url:'books.html#sefer-yesod-book', desc:'יציבה, תנועה, נשימה ותודעת העד'},
    {title:'במבוק', url:'books.html#tao-books', desc:'סיפור טאואיסטי על סבלנות, שורשים וצמיחה'}
  ];
  function renderSearch(q=''){
    if(!searchResults) return;
    const query = q.trim().toLowerCase();
    const results = siteIndex.filter(item => !query || (item.title+' '+item.desc).toLowerCase().includes(query)).slice(0,7);
    searchResults.innerHTML = results.map(item=>`<a href="${item.url}"><strong>${item.title}</strong><br><span class="small">${item.desc}</span></a>`).join('') || '<p class="small">לא נמצאו תוצאות. נסו מילת חיפוש אחרת.</p>';
  }
  if(searchBtn && searchPanel){
    searchBtn.addEventListener('click',()=>{
      searchPanel.classList.add('open');
      searchBtn.setAttribute('aria-expanded','true');
      renderSearch('');
      setTimeout(()=>searchInput && searchInput.focus(),40);
    });
    searchPanel.addEventListener('click',e=>{ if(e.target === searchPanel) closeSearch(); });
    document.addEventListener('keydown',e=>{ if(e.key === 'Escape') closeSearch(); });
    $$('[data-search-close]').forEach(btn=>btn.addEventListener('click',closeSearch));
    if(searchInput) searchInput.addEventListener('input', e=>renderSearch(e.target.value));
  }
  function closeSearch(){
    if(searchPanel){ searchPanel.classList.remove('open'); searchBtn && searchBtn.setAttribute('aria-expanded','false'); }
  }

  const bookSearch = $('[data-book-search]');
  const bookFilter = $('[data-book-filter]');
  const countEl = $('[data-book-count]');
  function filterBooks(){
    const q = (bookSearch?.value || '').trim().toLowerCase();
    const cat = bookFilter?.value || 'all';
    let shown = 0;
    $$('[data-book-card]').forEach(card=>{
      const text = card.textContent.toLowerCase();
      const cats = (card.dataset.category || '').split(' ');
      const ok = (!q || text.includes(q)) && (cat === 'all' || cats.includes(cat));
      card.hidden = !ok;
      if(ok) shown++;
    });
    if(countEl) countEl.textContent = shown;
  }
  if(bookSearch) bookSearch.addEventListener('input', filterBooks);
  if(bookFilter) bookFilter.addEventListener('change', filterBooks);
  filterBooks();

  $$('[data-copy]').forEach(btn=>{
    btn.addEventListener('click', async()=>{
      const value = btn.dataset.copy;
      try{ await navigator.clipboard.writeText(value); toast('הועתק: '+value); }
      catch{ toast('לא הצלחתי להעתיק אוטומטית'); }
    });
  });
  function toast(msg){
    let el = $('.toast');
    if(!el){ el = document.createElement('div'); el.className='toast'; el.setAttribute('role','status'); document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(()=>el.classList.remove('show'),2200);
  }

  const tabs = $$('[data-tab]');
  tabs.forEach(tab=>{
    tab.addEventListener('click',()=>{
      const group = tab.dataset.tabGroup || 'default';
      $$(`[data-tab-group="${group}"]`).forEach(t=>t.classList.remove('active'));
      $$(`[data-tab-panel-group="${group}"]`).forEach(panel=>panel.classList.remove('active'));
      tab.classList.add('active');
      const panel = $(`[data-tab-panel="${tab.dataset.tab}"]`);
      if(panel) panel.classList.add('active');
    });
  });

  const lightbox = $('.lightbox');
  const lightboxImg = $('.lightbox img');
  $$('[data-lightbox]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const img = $('img', btn);
      if(!lightbox || !lightboxImg || !img) return;
      lightboxImg.src = img.dataset.full || img.src;
      lightboxImg.alt = img.alt || '';
      lightbox.classList.add('open');
      lightbox.querySelector('button')?.focus();
    });
  });
  if(lightbox){
    lightbox.addEventListener('click',e=>{ if(e.target === lightbox) lightbox.classList.remove('open'); });
    lightbox.querySelector('button')?.addEventListener('click',()=>lightbox.classList.remove('open'));
  }

  const animated = $$('[data-animate]');
  if('IntersectionObserver' in window && animated.length){
    const io = new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){ entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, {threshold:.12});
    animated.forEach(el=>io.observe(el));
  }
})();
