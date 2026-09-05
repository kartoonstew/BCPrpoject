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

export function isDeskPath(path) {return path==='rules' || path.startsWith('rule/');}

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

const topicNotes = {
  'Character creation':'Start here: the Fighter foundation, ability scores, training, languages, and your first choices.',
  'Subclasses':'All nine callings, grouped by subclass. Features follow their level progression.',
  'Traits':'Choose one Trait, or choose a second and take a Quirk.',
  'Quirks':'The cost of a second Trait. Open an entry to see the complete rule.',
  'Black Banner':'Using the Company relic, carrying it into battle, and choosing an aura.',
  'Morale':'When enemies check morale, how checks resolve, and how circumstances change the DC.',
  'Commissary':'Magic equipment, durability, charges, and the spoils of the Company.',
  'Company lore':'The Annals, the Company’s organization, and its leadership.',
  'Brothers':'The names and stories of 75 men already wearing the Black.',
};
const topicNames=chapterGroups.flatMap(group=>group.categories);
export const chapterURL=category=>category?`#rules?category=${encodeURIComponent(category)}`:'#rules';

export function createFieldDesk({main, db, bookmarks, toast}) {
  const record=id=>db.records.find(r=>r.id===id);
  let state, recent=[], focusChapter=false;
  try{const value=JSON.parse(localStorage.getItem('bc-recent-rules')||'[]');if(Array.isArray(value))recent=value.filter(id=>record(id)).slice(0,3);}catch{}

  function readState(){
    const [path,query='']=(location.hash.slice(1)||'home').split('?'),params=new URLSearchParams(query);
    const entry=path.startsWith('rule/')?safeDecode(path.slice(5)):params.get('entry')||'';
    const q=params.get('q')||'';
    let category=topicNames.includes(params.get('category'))?params.get('category'):'';
    // A source link opens the entry's real chapter; global search never has a hidden topic filter.
    if(!q&&entry&&record(entry)&&!params.has('saved'))category=record(entry).category;
    if(q)category='';
    return {query:q,category,saved:!q&&params.has('saved'),entry,sort:params.get('sort')==='az'?'az':'page'};
  }
  function entryURL(id){const r=record(id);return `${chapterURL(r.category)}&entry=${encodeURIComponent(id)}`;}
  function currentURL(entry=''){
    const p=new URLSearchParams();
    if(state.query)p.set('q',state.query);else if(state.saved)p.set('saved','1');else if(state.category)p.set('category',state.category);
    if(state.sort==='az')p.set('sort','az');if(entry)p.set('entry',entry);
    return '#rules'+(p.size?'?'+p:'');
  }
  function sourceLink(r){return `BC%20PHB%201.14.pdf#page=${r.page}`;}
  function entryMarkup(r){return `<details class="manual-entry" id="entry-${r.id}" data-entry="${r.id}" ${state.entry===r.id?'open':''}>
    <summary><span class="manual-chevron" aria-hidden="true">›</span><span class="manual-entry-heading"><span class="manual-entry-title">${highlight(r.title,state.query)}</span>${state.query?`<small>${escapeHTML(r.subclass||r.category)}${r.level?' · Level '+r.level:''}</small>`:''}</span><span class="manual-entry-meta">${r.level?'LV. '+r.level+' · ':''}P. ${r.page}</span></summary>
    <div class="manual-entry-body"><div class="manual-rule-text"><p>${escapeHTML(r.body.replace(/ (\d\. )/g,'\n\n$1'))}</p></div>${r.note?`<aside class="source-note">${escapeHTML(r.note)}</aside>`:''}
    <div class="manual-entry-actions"><button data-save="${r.id}" aria-pressed="${bookmarks.has(r.id)}">${bookmarks.has(r.id)?'★ Saved':'☆ Save rule'}</button><button data-copy="${r.id}">Copy link</button><a href="${sourceLink(r)}" target="_blank" rel="noopener">Original · p. ${r.page} ↗</a></div></div></details>`;}

  function mount(){
    main.innerHTML=`<div class="field-desk manual-layout"><section class="desk-masthead" aria-labelledby="desk-title"><img src="assets/art/last-of-the-free.webp" alt="Mercenaries holding the Black Banner" fetchpriority="high"><div class="desk-masthead-copy"><div class="eyebrow">The Black Company / Field reference</div><h1 id="desk-title">Know the rule.<br><em>Hold the line.</em></h1><p>The Company’s knowledge, close at hand.</p></div></section>
    <div class="desk-workspace"><aside class="desk-topics" aria-label="Rule topics"><div class="desk-library-label">CONTENTS <span>1.14</span></div><nav class="desk-collections" aria-label="Rule collections"><a data-collection="all" href="#rules">All chapters <span>9</span></a><a data-collection="saved" href="#rules?saved=1">☆ Saved rules <span id="desk-saved-count">${bookmarks.size}</span></a></nav><nav aria-label="Chapters">${chapterGroups.map(group=>`<div class="desk-topic-group"><h3>${group.title}</h3>${group.categories.map(c=>`<a data-topic="${c}" href="${chapterURL(c)}">${c}<span>${db.records.filter(r=>r.category===c).length}</span></a>`).join('')}</div>`).join('')}</nav><div class="desk-recent" id="desk-recent"></div><a class="desk-source-link" href="BC%20PHB%201.14.pdf" target="_blank" rel="noopener">Original rulebook ↗<small>Player’s Handbook 1.14 · PDF</small></a></aside>
    <section class="desk-browser manual-browser" aria-label="Rules index"><div class="desk-searchbar">${searchIcon}<label class="visually-hidden" for="rules-search">Search the whole rulebook</label><input id="rules-search" type="search" placeholder="Search the whole rulebook…" autocomplete="off"><button id="desk-reset">Clear</button><kbd>/</kbd></div><div class="desk-mobile-controls"><label>Chapter <select id="desk-mobile-topic"><option value="">All chapters</option><option value="saved">Saved rules</option>${topicNames.map(c=>`<option>${c}</option>`).join('')}</select></label></div><div id="manual-content"></div></section></div><div class="desk-bottom-note"><span>Player’s Handbook 1.14 · Campaign rules & Annals</span><a href="#about">Source & edition notes ↗</a></div></div>`;
    main.querySelector('#rules-search').addEventListener('input',event=>{const q=event.target.value;history.replaceState(null,'',q?'#rules?q='+encodeURIComponent(q):'#rules');render();});
    main.querySelector('#rules-search').addEventListener('keydown',event=>{if(event.key==='Escape'){event.target.value='';event.target.dispatchEvent(new Event('input'));}});
    main.querySelector('#desk-reset').addEventListener('click',()=>{history.replaceState(null,'','#rules');render();main.querySelector('#rules-search').focus();});
    main.querySelector('#desk-mobile-topic').addEventListener('change',e=>{focusChapter=true;location.hash=e.target.value==='saved'?'rules?saved=1':chapterURL(e.target.value);});
    main.querySelector('.desk-workspace').addEventListener('click',async event=>{
      const chapter=event.target.closest('[data-topic],[data-collection],[data-chapter]');
      if(chapter){focusChapter=true;}
      const save=event.target.closest('[data-save]');
      if(save){const id=save.dataset.save;bookmarks.has(id)?bookmarks.delete(id):bookmarks.add(id);try{localStorage.setItem('bc-saved-rules',JSON.stringify([...bookmarks]));}catch{toast('Saved for this visit; browser storage is unavailable.');}save.textContent=bookmarks.has(id)?'★ Saved':'☆ Save rule';save.setAttribute('aria-pressed',bookmarks.has(id));main.querySelector('#desk-saved-count').textContent=bookmarks.size;if(state.saved&&!bookmarks.has(id)){history.replaceState(null,'',currentURL());render();}}
      const copy=event.target.closest('[data-copy]');
      if(copy){try{await navigator.clipboard.writeText(new URL(entryURL(copy.dataset.copy),location.href).href);toast('Rule link copied.');}catch{toast('Copy the current address from your browser.');}}
      const all=event.target.closest('[data-expand]');
      if(all){main.querySelectorAll('.manual-entry').forEach(detail=>{if(detail.open!==(all.dataset.expand==='all')){detail.dataset.bulk='true';detail.open=all.dataset.expand==='all';}});state.entry='';history.replaceState(null,'',currentURL());}
    });
    main.querySelector('#manual-content').addEventListener('toggle',event=>{
      const detail=event.target;if(!detail.matches?.('.manual-entry'))return;if(detail.dataset.bulk){delete detail.dataset.bulk;return;}
      const id=detail.dataset.entry;
      if(!detail.open){if(state.entry===id){state.entry='';history.replaceState(null,'',currentURL());}return;}
      if(state.entry!==id){state.entry=id;history.replaceState(null,'',currentURL(id));}
      recent=[id,...recent.filter(x=>x!==id)].slice(0,3);try{localStorage.setItem('bc-recent-rules',JSON.stringify(recent));}catch{}
      renderRecent();
    },true);
  }
  function renderRecent(){main.querySelector('#desk-recent').innerHTML=recent.length?`<h3>Recently opened</h3>${recent.map(id=>`<a href="${entryURL(id)}">${escapeHTML(record(id).title)}<span>↗</span></a>`).join('')}`:'';}
  function directory(){return `<header class="manual-heading"><div class="eyebrow">The field manual</div><h2 tabindex="-1" id="manual-title">What do you need to know?</h2><p>Choose a chapter to browse its rules, or search the whole book above.</p></header><nav class="manual-directory" aria-label="Browse chapters">${topicNames.map((c,i)=>`<a data-chapter href="${chapterURL(c)}"><span class="manual-chapter-number">${String(i+1).padStart(2,'0')}</span><span><h3>${c}</h3><p>${topicNotes[c]}</p></span><small>${db.records.filter(r=>r.category===c).length} entries <b>→</b></small></a>`).join('')}</nav>`;}
  function render(){
    if(!main.querySelector('.manual-layout'))mount();state=readState();
    main.querySelector('#rules-search').value=state.query;
    main.querySelector('#desk-reset').hidden=!state.query;
    main.querySelector('#desk-mobile-topic').value=state.saved?'saved':state.category;
    main.querySelectorAll('[data-topic]').forEach(a=>{if(a.dataset.topic===state.category)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    main.querySelectorAll('[data-collection]').forEach(a=>{if(!state.category&&!state.query&&(a.dataset.collection==='saved'?state.saved:!state.saved))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    let html;
    const invalid=state.entry&&!record(state.entry);
    if(invalid)html=`<div class="manual-heading"><h2 id="manual-title">That rule could not be found.</h2><p>Choose a chapter from the contents or search by name.</p><a href="#rules">Browse all chapters →</a></div>`;
    else if(!state.category&&!state.query&&!state.saved)html=directory();
    else{
      const results=findEntries(db.records,{...state,sort:state.query?'relevance':state.sort},bookmarks);
      const title=state.query?`Search results`:state.saved?'Saved rules':state.category;
      html=`<header class="manual-heading"><div class="eyebrow">${state.query?'Searching the whole rulebook':state.saved?'Your collection':'Chapter '+String(topicNames.indexOf(state.category)+1).padStart(2,'0')}</div><h2 tabindex="-1" id="manual-title">${title}</h2><p>${state.query?`${results.length} matches for “${escapeHTML(state.query)}” across all chapters.`:state.saved?'The rules you’ve saved for quick reference.':topicNotes[state.category]}</p></header><div class="manual-controls"><span id="result-count" role="status">${state.category==='Subclasses'?'9 subclasses · 36 features':results.length+' '+(results.length===1?'entry':'entries')} · Click a rule to read it</span><div><button data-expand="all">Expand all</button><button data-expand="none">Collapse all</button></div></div>`;
      if(!results.length)html+=`<div class="manual-empty"><h3>${state.saved?'No saved rules yet.':'No entries found.'}</h3><p>${state.saved?'Open a rule and select Save rule.':'Try another word, a feature name, or a Brother’s name.'}</p><a href="#rules">Browse all chapters →</a></div>`;
      else if(state.category==='Subclasses'&&!state.query&&!state.saved){
        html+=db.classes.map(c=>`<section class="manual-class-group" id="entry-${db.records.find(r=>r.overview&&r.subclass===c.name).id}" data-selected="${record(state.entry)?.overview&&record(state.entry)?.subclass===c.name}"><header><h3>${c.name}</h3><a href="#class/${c.name}">Full subclass profile ↗</a></header><p>${escapeHTML(c.description)}</p>${results.filter(r=>r.subclass===c.name&&!r.overview).map(entryMarkup).join('')}</section>`).join('');
      }else html+=`<div class="manual-entries">${results.map(entryMarkup).join('')}</div>`;
    }
    main.querySelector('#manual-content').innerHTML=html;renderRecent();
    if(state.entry&&!invalid){requestAnimationFrame(()=>{const detail=main.querySelector('#entry-'+state.entry);detail?.scrollIntoView({block:detail.matches('.manual-class-group')?'start':'nearest'});});}
    else if(focusChapter){const title=main.querySelector('#manual-title');title?.focus({preventScroll:true});main.querySelector('.desk-browser')?.scrollIntoView({block:'start'});focusChapter=false;}
    document.title=`${state.category||'Rules index'} — The Black Company`;
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

export function renderHome({main}) {
  main.innerHTML=`<div class="company-home"><section class="home-arrival" aria-labelledby="arrival-title"><div class="home-scene"><img src="assets/art/last-of-the-free.webp" alt="The Company holds its banner above a battered battlefield" fetchpriority="high"><div class="home-scene-copy"><div class="eyebrow">The Black Company / Player’s Handbook 1.14</div><h1 id="arrival-title">The last of<br><em>the free.</em></h1><p>Four centuries of brotherhood.<br>Your place in the Annals starts here.</p></div><span class="home-art-caption">STAND WITH THE COMPANY.</span></div><nav class="home-destinations" aria-label="Explore the field manual"><div class="home-nav-label">THE FIELD MANUAL <span>01—03</span></div><a href="#rules"><small>01 / AT THE TABLE</small><h2>Know the rules.<span>↗</span></h2><p>Browse the chapters or find a rule in seconds.</p></a><a href="#subclasses"><small>02 / THE MUSTER ROLL</small><h2>Meet the brothers.<span>↗</span></h2><p>Nine callings. Find your place in the line.</p></a><a href="#sheet"><small>03 / YOUR SERVICE RECORD</small><h2>Build a Brother.<span>↗</span></h2><p>Create your character and take an editable sheet to the table.</p></a></nav></section><section class="home-field-notes" aria-label="Quick reference"><div class="home-quick"><div class="eyebrow">Keep these close</div><nav aria-label="Frequently needed rules"><a href="#rules?category=Character%20creation">Creating a Brother ↗</a><a href="#rules?category=Morale">Morale ↗</a><a href="#rules?category=Black%20Banner">The Black Banner ↗</a></nav></div><form class="home-search" role="search"><label for="home-search">Already know what you need?</label><div>${searchIcon}<input id="home-search" type="search" placeholder="Search the rulebook…" autocomplete="off"><button type="submit" aria-label="Search rules">→</button></div></form></section></div>`;
  main.querySelector('.home-search').addEventListener('submit',event=>{event.preventDefault();const query=main.querySelector('#home-search').value.trim();location.hash=query?'rules?q='+encodeURIComponent(query):'rules';});
}
