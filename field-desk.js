const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize = value => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const chapterGroups = [
  {title:'The Brother', categories:['Character creation','Subclasses','Traits','Quirks']},
  {title:'In the field', categories:['Black Banner','Morale','Commissary']},
  {title:'The Annals', categories:['Company lore','Brothers']},
];
const quickRules = ['morale-checks-outcomes','subclass-saving-throw-dc','aura-radius','bannerman','weapon','armor-training','starting-money'];
const searchIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>';
const safeDecode = value => {try{return decodeURIComponent(value);}catch{return value;}};

export function isDeskPath(path) {return ['home','rules'].includes(path) || path.startsWith('rule/');}

export function findEntries(records, {query='', category='', saved=false, sort='relevance'}={}, bookmarks=new Set()) {
  const normalized = normalize(query).replace(/death saves?/g,'death checks');
  const tokens = normalized.split(' ').filter(Boolean);
  return records.filter(r => (!category || r.category===category) && (!saved || bookmarks.has(r.id)))
    .map(r => {
      const title=normalize(r.title), haystack=normalize(`${r.title} ${r.category} ${r.subclass||''} ${r.body}`);
      if(!tokens.every(t=>haystack.includes(t))) return null;
      let score=tokens.filter(t=>title.includes(t)).length*10;
      if(normalized && title===normalized) score+=100;
      else if(normalized && title.includes(normalized)) score+=40;
      if(!normalized && quickRules.includes(r.id)) score+=50-quickRules.indexOf(r.id);
      return {r,score};
    }).filter(Boolean)
    .sort((a,b)=>sort==='az'?a.r.title.localeCompare(b.r.title):sort==='page'?a.r.page-b.r.page:b.score-a.score||a.r.title.localeCompare(b.r.title))
    .map(({r})=>r);
}

function highlight(value, query) {
  const words=query.trim().split(/\s+/).filter(w=>w.length>1);
  if(!words.length) return escapeHTML(value);
  const pattern=new RegExp(`(${words.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})`,'gi');
  return String(value).split(pattern).map((part,i)=>i%2?`<mark>${escapeHTML(part)}</mark>`:escapeHTML(part)).join('');
}

export function createFieldDesk({main, db, bookmarks, toast}) {
  const record=id=>db.records.find(r=>r.id===id);
  let state, results=[], selected, signature='', previousContext='', previousSelection='', recent=[], focusReading=false, focusResults=false;
  try {const value=JSON.parse(localStorage.getItem('bc-recent-rules')||'[]');if(Array.isArray(value))recent=value.filter(id=>record(id)).slice(0,3);} catch {}

  function readState() {
    const [path, query='']=(location.hash.slice(1)||'home').split('?');
    const params=new URLSearchParams(query);
    return {query:params.get('q')||'', category:params.get('category')||'', saved:params.has('saved'),
      sort:['az','page'].includes(params.get('sort'))?params.get('sort'):'relevance',
      entry:path.startsWith('rule/')?safeDecode(path.slice(5)):params.get('entry')||'',
      list:params.get('view')==='list', params};
  }

  function makeURL(changes={}) {
    const p=new URLSearchParams(state.params);
    if(state.entry) p.set('entry',state.entry);
    for(const [key,value] of Object.entries(changes)) {if(value===''||value===null||value===false)p.delete(key);else p.set(key,String(value));}
    return `#rules${p.size?'?'+p.toString():''}`;
  }

  function remember(id) {
    recent=[id,...recent.filter(x=>x!==id)].slice(0,3);
    try{localStorage.setItem('bc-recent-rules',JSON.stringify(recent));}catch{}
  }

  function renderRecent() {
    const area=main.querySelector('#desk-recent');
    if(!area) return;
    area.innerHTML=recent.length?`<h3>Recently opened</h3>${recent.map(id=>`<a href="${makeURL({entry:id,view:null})}" data-open="${id}">${escapeHTML(record(id).title)}<span>↗</span></a>`).join('')}`:'';
  }

  function sidebar() {
    return `<aside class="desk-topics" aria-label="Rule topics">
      <div class="desk-library-label">THE LIBRARY <span>1.14</span></div>
      <nav class="desk-collections" aria-label="Rule collections">
        <button data-collection="all">All entries <span>${db.records.length}</span></button>
        <button data-collection="saved"><span class="desk-save-icon">☆</span> Saved rules <span id="desk-saved-count">${bookmarks.size}</span></button>
      </nav>
      <nav aria-label="Filter by topic">${chapterGroups.map(group=>`<div class="desk-topic-group"><h3>${group.title}</h3>${group.categories.map(category=>`<button data-topic="${category}">${category}<span>${db.records.filter(r=>r.category===category).length}</span></button>`).join('')}</div>`).join('')}</nav>
      <div class="desk-recent" id="desk-recent"></div>
      <a class="desk-source-link" href="BC%20PHB%201.14.pdf" target="_blank" rel="noopener">Original rulebook <span>↗</span><small>Player’s Handbook 1.14 · PDF</small></a>
    </aside>`;
  }

  function mount() {
    signature='';previousContext='';previousSelection='';
    main.innerHTML=`<div class="field-desk">
      <section class="desk-masthead" aria-labelledby="desk-title">
        <img src="assets/art/last-of-the-free.webp" alt="Mercenaries holding the Black Banner on a smoke-filled battlefield" fetchpriority="high">
        <div class="desk-masthead-copy"><div class="eyebrow">The Black Company / Field reference</div><h1 id="desk-title">Know the rule.<br><em>Hold the line.</em></h1><p>The Company’s knowledge, close at hand.</p></div>
        <span class="desk-folio">KHATOVAR’S LAST / VOL. 1.14</span>
      </section>
      <div class="desk-workspace">
        ${sidebar()}
        <section class="desk-browser" aria-label="Search and read rules">
          <div class="desk-searchbar">${searchIcon}<label class="visually-hidden" for="rules-search">Search rules</label><input id="rules-search" type="search" placeholder="Search all ${db.records.length} entries…" autocomplete="off"><button id="desk-reset" title="Clear search and filters">Reset</button><kbd>/</kbd></div>
          <div class="desk-mobile-controls"><label>Topic <select id="desk-mobile-topic"><option value="">All entries</option><option value="saved">Saved rules</option>${chapterGroups.map(g=>`<optgroup label="${g.title}">${g.categories.map(c=>`<option>${c}</option>`).join('')}</optgroup>`).join('')}</select></label><span id="desk-mobile-count"></span></div>
          <div class="desk-panes">
            <section class="desk-results-pane" aria-label="Matching entries">
              <div class="desk-results-heading"><span id="result-count" role="status" aria-live="polite"></span><label class="visually-hidden" for="sort">Sort entries</label><select id="sort"><option value="relevance">Recommended</option><option value="az">A–Z</option><option value="page">Page order</option></select></div>
              <nav class="desk-results" id="results" aria-label="Rule results"></nav>
              <div class="desk-list-foot"><span>↑ ↓ to move</span><span>Enter to read</span></div>
            </section>
            <section class="desk-reading-pane" aria-label="Selected rule"><div id="desk-reader"></div></section>
          </div>
        </section>
      </div>
      <div class="desk-bottom-note"><span>Every rule leads back to the book.</span><a href="#about">Source notes & what’s included ↗</a></div>
    </div>`;

    main.querySelector('#rules-search').addEventListener('input', event=> {
      const url=makeURL({q:event.target.value,entry:null,view:'list'});
      history.replaceState(null,'',url);render();
    });
    main.querySelector('#sort').addEventListener('change',event=>{history.replaceState(null,'',makeURL({sort:event.target.value,entry:null}));render();});
    main.querySelector('#desk-reset').addEventListener('click',()=>{location.hash='rules';main.querySelector('#rules-search').focus();});
    main.querySelector('#desk-mobile-topic').addEventListener('change',event=>location.hash=makeURL({category:event.target.value==='saved'?'':event.target.value,saved:event.target.value==='saved'?'1':null,entry:null,view:'list'}));
    main.querySelector('.desk-workspace').addEventListener('click', event=> {
      const topic=event.target.closest('[data-topic]');
      if(topic) location.hash=makeURL({category:topic.dataset.topic,saved:null,entry:null,view:'list'});
      const collection=event.target.closest('[data-collection]');
      if(collection) location.hash=makeURL({category:null,saved:collection.dataset.collection==='saved'?'1':null,entry:null,view:'list'});
      const opening=event.target.closest('[data-open]');
      if(opening) {
        remember(opening.dataset.open);
        if(opening.hash===location.hash)main.querySelector('#desk-rule-title')?.focus({preventScroll:true});
        else focusReading=true;
      }
    });
    main.querySelector('#results').addEventListener('keydown', event=> {
      if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
      const links=[...main.querySelectorAll('.desk-result')];
      let index=links.indexOf(document.activeElement);
      if(index<0)return;
      event.preventDefault();
      index=event.key==='Home'?0:event.key==='End'?links.length-1:Math.max(0,Math.min(links.length-1,index+(event.key==='ArrowDown'?1:-1)));
      links[index]?.focus();
    });
    main.querySelector('#rules-search').addEventListener('keydown',event=>{
      if(event.key==='ArrowDown'){event.preventDefault();main.querySelector('.desk-result')?.focus();}
      if(event.key==='Escape'&&event.target.value){event.target.value='';event.target.dispatchEvent(new Event('input'));}
    });
    main.querySelector('#desk-reader').addEventListener('click',async event=> {
      if(event.target.closest('#bookmark')) {
        if(!selected)return;
        const id=selected.id;bookmarks.has(id)?bookmarks.delete(id):bookmarks.add(id);
        try{localStorage.setItem('bc-saved-rules',JSON.stringify([...bookmarks]));}catch{toast('Browser storage is unavailable; saved for this visit.');}
        if(state.saved&&!bookmarks.has(id))history.replaceState(null,'',makeURL({entry:null}));
        signature='';render();
      }
      if(event.target.closest('#copy-link')) {
        try{await navigator.clipboard.writeText(new URL(makeURL({entry:selected.id,view:null}),location.href).href);toast('Rule link copied.');}catch{toast('Copy the link from your browser’s address bar.');}
      }
      if(event.target.closest('#desk-back')){focusResults=true;location.hash=makeURL({view:'list'});}
    });
  }

  function reader() {
    if(!selected) return `<div class="desk-reader-empty"><span class="desk-empty-mark">✳</span><h2>${state.entry?'That rule could not be found.':state.saved?'Keep the rules you reach for.':'Nothing on this page of the Annals.'}</h2><p>${state.entry?'The link may be incomplete. Choose an entry from the results or return to the full index.':state.saved?'Open any entry and save it. Your collection will be waiting here next session.':'Try another name or remove a filter to search more of the book.'}</p><a class="button light" href="#rules">Browse all entries <span>→</span></a></div>`;
    const r=selected,index=results.findIndex(x=>x.id===r.id);
    const related=db.records.filter(x=>x.id!==r.id&&(r.subclass?x.subclass===r.subclass&&!x.overview:x.category===r.category)).slice(0,3);
    return `<div class="desk-reader-toolbar"><button id="desk-back" class="desk-back">← Results</button><span>${index>=0?`${String(index+1).padStart(2,'0')} / ${results.length} ENTRIES`:'LINKED ENTRY'}</span><div><button id="bookmark" aria-pressed="${bookmarks.has(r.id)}">${bookmarks.has(r.id)?'★ Saved':'☆ Save rule'}</button><button id="copy-link">Copy link <span>↗</span></button></div></div>
      <article class="desk-paper"><div class="desk-rule-location"><span>${escapeHTML(r.subclass||r.category)}${r.level?' / Level '+r.level:''}</span><a href="BC%20PHB%201.14.pdf#page=${r.page}" target="_blank" rel="noopener">PHB ${r.page===r.endPage?'p. '+r.page:'pp. '+r.page+'–'+r.endPage} ↗</a></div>
      <h2 tabindex="-1" id="desk-rule-title">${escapeHTML(r.title)}</h2>
      <div class="desk-rule-copy"><p>${escapeHTML(r.body.replace(/ (\d\. )/g,'\n\n$1'))}</p></div>
      ${r.note?`<aside class="source-note">${escapeHTML(r.note)}</aside>`:''}
      <div class="desk-rule-source"><span>From the Player’s Handbook, v1.14</span><a href="BC%20PHB%201.14.pdf#page=${r.page}" target="_blank" rel="noopener">View original page ↗</a></div>
      ${related.length?`<section class="desk-related" aria-label="Related rules"><h3>Keep it in context</h3>${related.map(x=>`<a href="${makeURL({entry:x.id,view:null})}" data-open="${x.id}"><span>${escapeHTML(x.title)}</span><small>${x.level?'LV. '+x.level:'P. '+x.page} <b>→</b></small></a>`).join('')}</section>`:''}
      </article>`;
  }

  function render() {
    if(!main.querySelector('.field-desk'))mount();
    state=readState();
    results=findEntries(db.records,state,bookmarks);
    // Explicit deep links and recent entries may be outside the current filter;
    // retain the user's results and let the separate reading pane show the rule.
    selected=state.entry?record(state.entry):results[0];
    const input=main.querySelector('#rules-search');
    if(input.value!==state.query)input.value=state.query;
    input.placeholder=state.category?`Search ${state.category.toLowerCase()}…`:`Search all ${db.records.length} entries…`;
    main.querySelector('#sort').value=state.sort;
    main.querySelector('#desk-mobile-topic').value=state.saved?'saved':state.category;
    main.querySelector('#desk-mobile-count').textContent=`${results.length} entries`;
    main.querySelector('#result-count').textContent=`${results.length} ${results.length===1?'entry':'entries'}`;
    main.querySelector('#desk-saved-count').textContent=bookmarks.size;
    main.querySelectorAll('[data-topic]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.topic===state.category)));
    main.querySelectorAll('[data-collection]').forEach(button=>button.setAttribute('aria-pressed',String(!state.category&&(button.dataset.collection==='saved'?state.saved:!state.saved))));
    const nextSignature=JSON.stringify([state.query,state.category,state.saved,state.sort,[...bookmarks]]);
    const context=JSON.stringify([state.query,state.category,state.saved,state.sort]);
    if(nextSignature!==signature) {
      const container=main.querySelector('#results');
      const scroll=container.scrollTop;
      container.innerHTML=results.length?results.map(r=>`<a class="desk-result" href="${makeURL({entry:r.id,view:null})}" data-open="${r.id}"><div class="desk-result-top"><span>${escapeHTML(r.subclass||r.category)}${r.level?' / LV. '+r.level:''}</span><small>${bookmarks.has(r.id)?'★':''}</small></div><h3>${highlight(r.title,state.query)}</h3><p>${highlight(r.body,state.query)}</p><span class="desk-result-page">P. ${r.page}<b>↗</b></span></a>`).join(''):`<div class="desk-no-results"><h3>${state.saved?'No saved rules yet.':'No entries found.'}</h3><p>${state.saved?'Save a rule from its reading pane to add it here.':'Try a shorter term or clear your filters.'}</p><a href="#rules">Browse all entries →</a></div>`;
      container.scrollTop=context===previousContext?scroll:0;signature=nextSignature;previousContext=context;
    }
    main.querySelectorAll('.desk-result').forEach(link=>{
      link.href=makeURL({entry:link.dataset.open,view:null});
      const active=link.dataset.open===selected?.id;
      if(active)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');
    });
    const readerPane=main.querySelector('.desk-reading-pane');
    const focused=document.activeElement?.id;
    main.querySelector('#desk-reader').innerHTML=reader();
    if(previousSelection!==selected?.id)readerPane.scrollTop=0;
    if(['bookmark','copy-link'].includes(focused))main.querySelector('#'+focused)?.focus({preventScroll:true});
    main.querySelector('.desk-panes').dataset.mobile=state.entry&&!state.list?'reader':'list';
    if(focusReading && selected) {
      if(matchMedia('(max-width: 620px)').matches)main.querySelector('.desk-browser').scrollIntoView({block:'start'});
      main.querySelector('#desk-rule-title')?.focus({preventScroll:true});
      focusReading=false;
    }
    if(focusResults){main.querySelector('.desk-result[aria-current=true]')?.focus({preventScroll:true});focusResults=false;}
    previousSelection=selected?.id;
    renderRecent();
    document.title=`${state.entry&&selected?selected.title:'Field manual'} — The Black Company`;
  }
  return {render};
}

export function renderRoster({main,db}) {
  main.innerHTML=`<div class="roster-page"><div class="roster-intro"><div><div class="eyebrow">The muster roll / Nine callings</div><h1>Find your place<br><em>in the line.</em></h1><p>Every Brother is a Fighter. What you bring to the Company is another matter.</p></div><div class="roster-note"><span>ONE COMPANY.<br>NINE WAYS TO SERVE.</span><p>Choose a subclass at level 1.<br>New features at 3, 7, and 10.</p><a href="#sheet">Build a Brother ↗</a></div></div>
    <div class="roster-heading"><span>CALLING / ROLE</span><span>ARMOR TRAINING</span><span>FEATURES BY LEVEL</span></div>
    <div class="roster-list">${db.classes.map((c,i)=>{const heavy=['Sawbones','Bump','Deacon','Salt'].includes(c.name);return `<a class="roster-row" href="#class/${c.name}"><div class="roster-identity"><span class="roster-number">${String(i+1).padStart(2,'0')}</span><div><h2>${c.name}</h2><p>${escapeHTML(c.description)}</p></div></div><div class="roster-training"><span>${heavy?'Heavy armor':'Light & medium'}</span><small>${heavy?'Also light, medium & shields':'Also shields'}</small></div><div class="roster-features">${db.records.filter(r=>r.subclass===c.name&&r.level).map(r=>`<span><small>${String(r.level).padStart(2,'0')}</small>${escapeHTML(r.title)}</span>`).join('')}</div><span class="roster-arrow">↗</span></a>`;}).join('')}</div>
    <div class="roster-bottom"><div><h2>A name is a story.</h2><p>Meet the men already wearing the Black.</p></div><a href="#rules?category=Brothers">75 Brothers in the Annals →</a><a href="#rules?category=Company+lore">Company leadership →</a></div></div>`;
}

export function renderDossier({main,db,name,onChoose}) {
  const c=db.classes.find(c=>c.name===name);if(!c)return false;
  const features=db.records.filter(r=>r.subclass===name&&r.level);
  main.innerHTML=`<div class="dossier-page"><a class="breadcrumb" href="#subclasses">← The Company roster</a><div class="dossier-layout"><aside class="dossier-profile"><div class="eyebrow">Fighter / ${name}</div><h1>${name}.</h1><p>${escapeHTML(c.description)}</p><button id="choose-class" class="button primary">Create a ${name} <span>↗</span></button><dl><dt>Armor training</dt><dd>${['Sawbones','Bump','Deacon','Salt'].includes(name)?'Light, medium, heavy & shields':'Light, medium & shields'}</dd><dt>Subclass save DC</dt><dd>9 + 2 × proficiency bonus</dd></dl><nav aria-label="Subclass progression">${features.map(r=>`<button data-feature="${r.id}"><small>${String(r.level).padStart(2,'0')}</small>${escapeHTML(r.title)}<span>↓</span></button>`).join('')}</nav></aside><div class="dossier-progression">${features.map(r=>`<article id="feature-${r.id}" class="dossier-feature"><div class="dossier-level"><span>LEVEL</span><b>${String(r.level).padStart(2,'0')}</b></div><div><h2 tabindex="-1">${escapeHTML(r.title)}</h2><p>${escapeHTML(r.body)}</p><a href="#rule/${r.id}">Open in the field manual <span>↗</span></a></div></article>`).join('')}</div></div></div>`;
  main.querySelector('#choose-class').addEventListener('click',()=>onChoose(name));
  main.querySelectorAll('[data-feature]').forEach(button=>button.addEventListener('click',()=>{const feature=main.querySelector('#feature-'+button.dataset.feature);feature.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});feature.querySelector('h2').focus({preventScroll:true});}));
  return true;
}
