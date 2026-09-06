const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=(s,options={})=>new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'numeric',month:'short',year:'numeric',...options}).format(new Date(s));
const clock=s=>new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(s));
const link=(params={})=>'#campaign'+(Object.keys(params).length?'?'+new URLSearchParams(params):'');
const docLink=id=>'#campaign/read/'+encodeURIComponent(id);
const plain=e=>[e.title,e.description,e.period,e.author,e.voice,e.body,...(e.blocks||[]).map(b=>b.text)].filter(Boolean).join(' ');
export function filterCampaign(entries,{kind='all',q='',author='',month=''}={}){
 const terms=q.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
 return entries.filter(e=>(kind==='all'||(kind==='documents'?e.kind!=='ic':e.kind==='ic'))&&(!author||e.author===author)&&(!month||e.published.startsWith(month))&&terms.every(t=>plain(e).toLocaleLowerCase().includes(t))).sort((a,b)=>new Date(a.published)-new Date(b.published)||a.id.localeCompare(b.id));
}
export function messageMarkup(text){return String(text).split(/\n\s*\n/).map(p=>'<p>'+escape(p).replace(/\*\*\*([^*]+)\*\*\*/g,'<strong><em>$1</em></strong>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>').replace(/\n/g,'<br>')+'</p>').join('');}
function excerpt(e,q=''){
 const body=e.body||e.description||'',needle=q.trim().split(/\s+/)[0]||'',found=needle?plain(e).toLowerCase().indexOf(needle.toLowerCase()):-1;
 if(found>=0){const all=plain(e),start=Math.max(0,found-65);return (start?'…':'')+all.slice(start,start+220)+(start+220<all.length?'…':'');}
 return body.length>240?body.slice(0,240).replace(/\s+\S*$/,'')+'…':body;
}
let cached;
export async function renderCampaign({main,path,params}){
 const requestedHash=location.hash;
 main.innerHTML='<div class="page-wrap loading" role="status">Unbinding the Annals…</div>';
 try{cached ||= fetch('data/campaign.json?v=annals1').then(r=>{if(!r.ok)throw Error('Archive unavailable');return r.json();});const db=await cached;
  if(location.hash!==requestedHash)return;
  if(path.startsWith('campaign/read/'))renderDocument(main,db,decodeURIComponent(path.slice(14)));
  else renderTimeline(main,db,params);
 }catch(error){cached=null;main.innerHTML='<div class="page-wrap empty"><h1>The archive could not be opened.</h1><p>Please reload to try again.</p><a class="button" href="#home">Return to the field manual</a></div>';console.error(error);}
}
function renderTimeline(main,db,params){
 const entries=db.entries,docs=entries.filter(e=>e.kind==='document'),latest=docs.at(-1),authors=[...new Set(entries.filter(e=>e.kind==='ic').map(e=>e.author))].sort(),months=[...new Set(entries.map(e=>e.published.slice(0,7)))];
 const initial={kind:params.get('kind')||'all',q:params.get('q')||'',author:params.get('author')||'',month:params.get('month')||''};
 main.innerHTML=`<div class="campaign-wrap"><header class="campaign-intro"><div><div class="eyebrow">The Annals / Campaign records</div><h1>The Company<br><em>remembers.</em></h1><p>The written record and the voices between the lines.<br>Orders, accounts, and words passed among Brothers.</p><div class="archive-tally"><span><b>${docs.length}</b> writings</span><span><b>${entries.filter(e=>e.kind==='ic').length}</b> posts</span><span><b>${authors.length}</b> contributors</span></div></div><a class="latest-writing" href="${docLink(latest.id)}"><span class="eyebrow">Latest writing / ${date(latest.published)}</span><h2>${escape(latest.title)}</h2><p>${escape(latest.description)}</p><span class="text-link">Open the record ↗</span></a></header>
 <section class="archive-controls" aria-label="Filter the campaign archive"><div class="archive-tabs" role="group" aria-label="Record type">${[['all','Everything'],['documents','Writings & maps'],['ic','In-character posts']].map(([v,l])=>`<button type="button" data-kind="${v}" aria-pressed="${v===initial.kind}">${l}</button>`).join('')}</div><div class="archive-search-row"><label class="archive-search"><span>Search the archive</span><input id="archive-search" type="search" value="${escape(initial.q)}" placeholder="A Brother, a place, a remembered phrase…"></label><label><span>Contributor</span><select id="archive-author"><option value="">Everyone</option>${authors.map(a=>`<option ${a===initial.author?'selected':''}>${escape(a)}</option>`).join('')}</select></label><label><span>Posted in</span><select id="archive-month"><option value="">Every month</option>${months.map(m=>`<option value="${m}" ${m===initial.month?'selected':''}>${date(m+'-01T00:00:00Z',{day:undefined,month:'long'})}</option>`).join('')}</select></label></div></section>
 <div class="archive-meta"><p id="archive-count" role="status"></p><p>Oldest first · Posted dates in UTC<br><span>Story dates remain in the writings. Recaps may describe earlier events.</span></p></div>
 <div class="archive-layout"><section id="campaign-stream" class="campaign-stream" aria-label="Chronological campaign record"></section><aside class="archive-shelf"><details open><summary>On the record <span>${docs.length} volumes</span></summary><nav aria-label="Formal writings">${docs.map((e,i)=>`<a href="${docLink(e.id)}"><span class="shelf-number">${String(i+1).padStart(2,'0')}</span><span>${escape(e.title)}<small>${escape(e.label)} · ${date(e.published)}</small></span></a>`).join('')}</nav></details><p class="shelf-note">The words are the contributors’ own. Long posts open inline; out-of-character asides are folded away. Original documents are available with each writing.</p></aside></div></div>`;
 if(matchMedia('(max-width:760px)').matches)main.querySelector('.archive-shelf details').removeAttribute('open');
 let state={...initial},limit=40;
 let target=params.get('entry');
 function draw(){
  const opened=new Set([...main.querySelectorAll('.archive-entry details[open]')].map(d=>d.closest('.archive-entry').id));
  const filtered=filterCampaign(entries,state),targetIndex=target?filtered.findIndex(e=>e.id===target):-1;if(targetIndex>=limit)limit=targetIndex+1;
  const shown=filtered.slice(0,limit);let day='';
  main.querySelector('#archive-count').textContent=`${filtered.length} ${filtered.length===1?'record':'records'}${shown.length<filtered.length?' · '+shown.length+' shown':''}`;
  main.querySelector('#campaign-stream').innerHTML=(shown.length?shown.map(e=>{const d=e.published.slice(0,10),heading=d!==day?`<h2 class="archive-day"><time datetime="${d}">${date(e.published)}</time></h2>`:'';day=d;return heading+renderEntry(e,entries,state.q);}).join(''):'<div class="archive-empty"><h2>No records match.</h2><p>Try another name, phrase, or date.</p><button class="button" data-clear>Clear filters</button></div>')+(shown.length<filtered.length?`<button class="button archive-more" data-more>Read the next ${Math.min(40,filtered.length-shown.length)} records <span>↓</span></button>`:'<p class="archive-end">— End of this record —</p>');
  for(const id of opened)document.getElementById(id)?.querySelector('details')?.setAttribute('open','');
  main.querySelectorAll('[data-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===state.kind)));
  main.querySelector('[data-more]')?.addEventListener('click',()=>{const old=shown.length;limit+=40;draw();const first=main.querySelectorAll('.archive-entry')[old];first?.setAttribute('tabindex','-1');first?.focus({preventScroll:true});});
  main.querySelector('[data-clear]')?.addEventListener('click',()=>{state={kind:'all',q:'',author:'',month:''};main.querySelector('#archive-search').value='';main.querySelector('#archive-author').value='';main.querySelector('#archive-month').value='';update();});
 }
 function update(){target=null;limit=40;const query=Object.fromEntries(Object.entries(state).filter(([k,v])=>v&&(k!=='kind'||v!=='all')));history.replaceState(null,'',link(query));draw();}
 main.querySelectorAll('[data-kind]').forEach(b=>b.addEventListener('click',()=>{state.kind=b.dataset.kind;update();}));
 let timer;main.querySelector('#archive-search').addEventListener('input',e=>{state.q=e.target.value;clearTimeout(timer);timer=setTimeout(update,120);});
 for(const key of ['author','month'])main.querySelector('#archive-'+key).addEventListener('change',e=>{state[key]=e.target.value;update();});
 draw();if(target){const element=document.getElementById('record-'+target);if(element){element.querySelector('details')?.setAttribute('open','');requestAnimationFrame(()=>element.scrollIntoView({block:'start'}));}}
 document.title='Campaign records — The Black Company';
}
function renderEntry(e,entries,q){
 const stamp=`<a class="entry-time" href="${link({entry:e.id})}" aria-label="Link to record posted ${date(e.published)} at ${clock(e.published)} UTC"><time datetime="${escape(e.published)}">${clock(e.published)}</time> ↗</a>`;
 if(e.kind==='ic'){
  const reply=entries.find(r=>r.id===e.replyTo),replyHtml=reply?`<a class="dispatch-reply" href="${link({entry:reply.id})}">↳ Reply to ${escape(reply.author)}: ${escape(excerpt(reply).slice(0,90))}</a>`:'';
  const content=(e.body?`<div class="dispatch-body">${messageMarkup(e.body)}</div>`:'')+(e.images||[]).map(im=>`<a class="dispatch-image" href="${escape(im.src)}" target="_blank" rel="noopener"><img src="${escape(im.src)}" alt="${escape(im.alt)}" loading="lazy"><span>View attached illustration ↗</span></a>`).join('');
  const folded=e.aside||e.body.length>650;
  return `<article id="record-${e.id}" class="archive-entry dispatch ${e.author==='smalls'?'dispatch-narrator':''} ${e.aside?'dispatch-aside':''}"><div class="dispatch-seal" aria-hidden="true">${escape(e.voice==='Narrator & NPCs'?'BC':e.voice.slice(0,2).toUpperCase())}</div><div class="dispatch-content"><header><div><strong>${escape(e.voice)}</strong><span>${escape(e.author)}${e.aside?' · Table talk':e.author==='smalls'?' · Narration':' · In character'}${e.edited?' · Edited':''}</span></div>${stamp}</header>${replyHtml}${folded?`<details class="dispatch-long" ${q&&!e.aside?'open':''}><summary><span>${escape(excerpt(e,q))}</span><b>${e.aside?'Read table aside':'Read full post'} ↓</b></summary>${content}</details>`:content}</div></article>`;
 }
 return `<article id="record-${e.id}" class="archive-entry annals-entry"><div class="annals-entry-top"><span>${escape(e.label)}</span>${stamp}</div><h3><a href="${e.kind==='document'?docLink(e.id):escape(e.download)}" ${e.kind==='attachment'?'target="_blank" rel="noopener"':''}>${escape(e.title)}</a></h3><p class="story-period">${escape(e.period)}</p><p>${escape(q?excerpt(e,q):e.description)}</p>${e.image?`<a class="archive-attachment" href="${escape(e.download)}" target="_blank" rel="noopener"><img src="${escape(e.image)}" alt="${escape(e.title)}" loading="lazy"></a>`:''}<div class="annals-entry-bottom"><span>Filed by ${escape(e.author)}${e.words?' · '+Math.ceil(e.words/220)+' min read':''}</span><a href="${e.kind==='document'?docLink(e.id):escape(e.download)}" ${e.kind==='attachment'?'target="_blank" rel="noopener"':''}>${e.kind==='document'?'Read the writing':'Open '+(e.id==='campaign-image-gallery'?'44-page gallery':'map')} ↗</a></div></article>`;
}
function renderDocument(main,db,id){
 const docs=db.entries.filter(e=>e.kind==='document'),record=docs.find(e=>e.id===id);
 if(!record){main.innerHTML='<div class="page-wrap empty"><h1>This writing is not in the archive.</h1><a class="button" href="#campaign">Return to the records</a></div>';return;}
 const index=docs.indexOf(record),headings=record.blocks.map((b,i)=>({...b,index:i})).filter(b=>b.type==='heading');
 const body=record.blocks.map((b,i)=>{if(b.type==='divider')return '<hr>';const content=b.runs.map(r=>{let s=escape(r.text).replace(/\n/g,'<br>');if(r.italic)s='<em>'+s+'</em>';if(r.bold&&b.type!=='heading')s='<strong>'+s+'</strong>';return s;}).join('');return b.type==='heading'?`<h2 id="passage-${i}">${content}</h2>`:`<p>${content}</p>`;}).join('');
 main.innerHTML=`<div class="campaign-wrap archive-reader"><nav class="archive-breadcrumb" aria-label="Breadcrumb"><a href="${link({entry:id})}">← Back to the campaign record</a><span>${escape(record.label)}</span></nav><div class="archive-reading-layout"><article class="archive-manuscript"><header><div class="eyebrow">${escape(record.label)}</div><h1>${escape(record.title)}</h1><p class="manuscript-period">${escape(record.period)}</p><div class="manuscript-byline">Filed by ${escape(record.author)} · ${date(record.published)} · ${clock(record.published)} UTC<br>${Math.ceil(record.words/220)} min read · Original wording</div></header><div class="manuscript-body">${body}</div><footer><a href="${escape(record.download)}" download>Download original DOCX ↓</a><a href="${link({entry:id})}">See this writing in the timeline ↗</a></footer></article><aside class="reading-rail"><a class="button" href="${escape(record.download)}" download>Original document ↓</a><p>${escape(record.description)}</p>${headings.length>2?`<details open><summary>Within this volume</summary><nav aria-label="Contents">${headings.map(b=>`<a href="${docLink(id)}?section=${b.index}" data-passage="${b.index}">${escape(b.text)}</a>`).join('')}</nav></details>`:''}<div class="adjacent-writings">${docs[index-1]?`<a href="${docLink(docs[index-1].id)}"><small>Previous writing</small>${escape(docs[index-1].title)}</a>`:''}${docs[index+1]?`<a href="${docLink(docs[index+1].id)}"><small>Next writing</small>${escape(docs[index+1].title)}</a>`:''}</div></aside></div></div>`;
 if(matchMedia('(max-width:760px)').matches)main.querySelector('.reading-rail details')?.removeAttribute('open');
 main.querySelectorAll('[data-passage]').forEach(a=>a.addEventListener('click',event=>{event.preventDefault();history.replaceState(null,'',a.getAttribute('href'));document.getElementById('passage-'+a.dataset.passage)?.scrollIntoView({block:'start'});}));
 const section=new URLSearchParams(location.hash.split('?')[1]||'').get('section');if(section&&/^\d+$/.test(section))requestAnimationFrame(()=>document.getElementById('passage-'+section)?.scrollIntoView({block:'start'}));
 document.title=record.title+' — The Black Company';
}
