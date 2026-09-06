import {buildScenes,groupSceneRecords} from './campaign-scenes.js?v=scenes1';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=(s,options={})=>new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'numeric',month:'short',year:'numeric',...options}).format(new Date(s));
const clock=s=>new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(s));
const link=(params={})=>'#campaign'+(Object.keys(params).length?'?'+new URLSearchParams(params):'');
const sceneLink=(id,params={})=>'#campaign/scene/'+encodeURIComponent(id)+(Object.keys(params).length?'?'+new URLSearchParams(params):'');
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
  else if(path.startsWith('campaign/scene/'))renderScene(main,db,decodeURIComponent(path.slice(15)),params);
  else renderTimeline(main,db,params);
 }catch(error){cached=null;main.innerHTML='<div class="page-wrap empty"><h1>The archive could not be opened.</h1><p>Please reload to try again.</p><a class="button" href="#home">Return to the field manual</a></div>';console.error(error);}
}
function renderTimeline(main,db,params){
 const entries=db.entries,scenes=buildScenes(entries),docs=entries.filter(e=>e.kind==='document'),latest=docs.at(-1),authors=[...new Set(entries.filter(e=>e.kind==='ic').map(e=>e.author))].sort(),months=[...new Set(entries.map(e=>e.published.slice(0,7)))];
 const initial={kind:params.get('kind')||'all',q:params.get('q')||'',author:params.get('author')||'',month:params.get('month')||''};
 main.innerHTML=`<div class="campaign-wrap"><header class="campaign-intro"><div><div class="eyebrow">The Annals / Campaign records</div><h1>The Company<br><em>remembers.</em></h1><p>The written record and the voices between the lines.<br>Orders, accounts, and words passed among Brothers.</p><div class="archive-tally"><span><b>${docs.length}</b> writings</span><span><b>${entries.filter(e=>e.kind==='ic').length}</b> posts</span><span><b>${authors.length}</b> contributors</span></div></div><a class="latest-writing" href="${docLink(latest.id)}"><span class="eyebrow">Latest writing / ${date(latest.published)}</span><h2>${escape(latest.title)}</h2><p>${escape(latest.description)}</p><span class="text-link">Open the record ↗</span></a></header>
 <div class="archive-view" role="group" aria-label="Archive view"><button data-view="scenes" type="button">Scene overview</button><button data-view="feed" type="button">Full chronological feed</button></div>
 <section class="archive-controls" aria-label="Filter the campaign archive"><div class="archive-tabs" role="group" aria-label="Record type">${[['all','Everything'],['documents','Writings & maps'],['ic','In-character posts']].map(([v,l])=>`<button type="button" data-kind="${v}" aria-pressed="${v===initial.kind}">${l}</button>`).join('')}</div><div class="archive-search-row"><label class="archive-search"><span>Search the archive</span><input id="archive-search" type="search" value="${escape(initial.q)}" placeholder="A Brother, a place, a remembered phrase…"></label><label><span>Contributor</span><select id="archive-author"><option value="">Everyone</option>${authors.map(a=>`<option ${a===initial.author?'selected':''}>${escape(a)}</option>`).join('')}</select></label><label><span>Posted in</span><select id="archive-month"><option value="">Every month</option>${months.map(m=>`<option value="${m}" ${m===initial.month?'selected':''}>${date(m+'-01T00:00:00Z',{day:undefined,month:'long'})}</option>`).join('')}</select></label></div></section>
 <div class="archive-meta"><div><p id="archive-count" role="status"></p><label class="table-talk-control" id="feed-talk-control"><input type="checkbox" id="feed-talk" checked> Show table talk</label></div><p>Oldest first · Posted dates in UTC<br><span id="archive-date-note"></span></p></div>
 <div class="archive-layout"><section id="campaign-stream" class="campaign-stream" aria-label="Chronological campaign record"></section><aside class="archive-shelf"><details open><summary>On the record <span>${docs.length} volumes</span></summary><nav aria-label="Formal writings">${docs.map((e,i)=>`<a href="${docLink(e.id)}"><span class="shelf-number">${String(i+1).padStart(2,'0')}</span><span>${escape(e.title)}<small>${escape(e.label)} · ${date(e.published)}</small></span></a>`).join('')}</nav></details><p class="shelf-note">Scene titles and summaries are editorial guides. Open a scene to read the contributors’ original words, with optional table talk. Original documents accompany each writing.</p></aside></div></div>`;
 if(matchMedia('(max-width:760px)').matches)main.querySelector('.archive-shelf details').removeAttribute('open');
 let state={...initial},limit=40,view=params.get('view')==='feed'||params.has('entry')?'feed':'scenes';
 const feedTalk=main.querySelector('#feed-talk');feedTalk.checked=params.get('talk')!=='hide';
 const assigned=new Set(scenes.flatMap(s=>s.posts.map(p=>p.id)));
 let target=params.get('entry');
 function draw(){
  const opened=new Set([...main.querySelectorAll('.archive-entry details[open]')].map(d=>d.closest('.archive-entry').id));
  const matches=filterCampaign(entries,state),matchedIds=new Set(matches.map(e=>e.id));
  const filtered=view==='feed'?matches.filter(e=>feedTalk.checked||!e.aside):[
   ...matches.filter(e=>e.kind!=='ic'||!assigned.has(e.id)),
   ...(state.kind==='documents'?[]:scenes.filter(scene=>scene.posts.some(p=>matchedIds.has(p.id))||(
    state.q.trim()&&state.q.toLowerCase().trim().split(/\s+/).every(t=>(scene.title+' '+scene.summary).toLowerCase().includes(t))&&filterCampaign(scene.posts,{...state,q:''}).length
   )))
  ].sort((a,b)=>new Date(a.published)-new Date(b.published)||a.id.localeCompare(b.id));
  const targetIndex=target?filtered.findIndex(e=>e.id===target):-1;if(targetIndex>=limit)limit=targetIndex+1;
  const shown=filtered.slice(0,limit);let day='';
  main.querySelector('#archive-count').textContent=view==='scenes'?`${filtered.filter(e=>e.kind==='scene').length} scenes · ${filtered.filter(e=>e.kind!=='scene').length} records`:`${filtered.length} records${shown.length<filtered.length?' · '+shown.length+' shown':''}`;
  main.querySelector('#feed-talk-control').hidden=view!=='feed';
  main.querySelector('#archive-date-note').textContent=view==='scenes'?'Scenes are placed by their first post and may span later filings. Open one for the exact sequence.':'Story dates remain in the writings. Recaps may describe earlier events.';
  main.querySelector('#campaign-stream').classList.toggle('scene-overview',view==='scenes');
  main.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
  main.querySelector('#campaign-stream').innerHTML=(shown.length?shown.map(e=>{const d=e.published.slice(0,view==='scenes'?7:10),heading=d!==day?`<h2 class="archive-day"><time datetime="${d}">${date(e.published,view==='scenes'?{day:undefined,month:'long'}:{})}</time></h2>`:'';day=d;return heading+(e.kind==='scene'?renderSceneCard(e,state,matches):renderEntry(e,entries,state.q));}).join(''):'<div class="archive-empty"><h2>No records match.</h2><p>Try another name, phrase, or date.</p><button class="button" data-clear>Clear filters</button></div>')+(shown.length<filtered.length?`<button class="button archive-more" data-more>Read the next ${Math.min(40,filtered.length-shown.length)} records <span>↓</span></button>`:'<p class="archive-end">— End of this record —</p>');
  for(const id of opened)document.getElementById(id)?.querySelector('details')?.setAttribute('open','');
  main.querySelectorAll('[data-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===state.kind)));
  main.querySelector('[data-more]')?.addEventListener('click',()=>{const old=shown.length;limit+=40;draw();const first=main.querySelectorAll('.archive-entry')[old];first?.setAttribute('tabindex','-1');first?.focus({preventScroll:true});});
  main.querySelector('[data-clear]')?.addEventListener('click',()=>{state={kind:'all',q:'',author:'',month:''};main.querySelector('#archive-search').value='';main.querySelector('#archive-author').value='';main.querySelector('#archive-month').value='';update();});
 }
 function update(){target=null;limit=40;const query=Object.fromEntries(Object.entries(state).filter(([k,v])=>v&&(k!=='kind'||v!=='all')));if(view==='feed')query.view='feed';if(!feedTalk.checked)query.talk='hide';history.replaceState(null,'',link(query));draw();}
 main.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;update();}));
 feedTalk.addEventListener('change',update);
 main.querySelectorAll('[data-kind]').forEach(b=>b.addEventListener('click',()=>{state.kind=b.dataset.kind;update();}));
 let timer;main.querySelector('#archive-search').addEventListener('input',e=>{state.q=e.target.value;clearTimeout(timer);timer=setTimeout(update,120);});
 for(const key of ['author','month'])main.querySelector('#archive-'+key).addEventListener('change',e=>{state[key]=e.target.value;update();});
 draw();const sceneTarget=params.get('scene');if(sceneTarget)requestAnimationFrame(()=>document.getElementById('record-'+sceneTarget)?.scrollIntoView({block:'start'}));if(target){const element=document.getElementById('record-'+target);if(element){element.querySelector('details')?.setAttribute('open','');requestAnimationFrame(()=>element.scrollIntoView({block:'start'}));}}
 document.title='Campaign records — The Black Company';
}
function renderSceneCard(scene,state,matches){
 const ids=new Set(scene.posts.map(p=>p.id)),hits=state.q.trim()?matches.filter(p=>ids.has(p.id)):[];
 return `<article class="archive-entry scene-card" id="record-${scene.id}"><div class="scene-card-meta"><span>Scene ${String(scene.number).padStart(2,'0')}</span><span>${date(scene.published,{year:undefined})} – ${date(scene.ended)}</span></div><h3><a href="${sceneLink(scene.id)}">${escape(scene.title)} <span aria-hidden="true">↗</span></a></h3><p class="scene-summary"><small>Editorial summary</small>${escape(scene.summary)}</p><div class="scene-participants">${scene.voices.map(escape).join(' · ')}</div><footer><span>${scene.posts.length} posts · ${Math.ceil(scene.words/220)} min read${scene.posts.some(p=>p.aside)?' · Includes table talk':''}</span><a href="${sceneLink(scene.id)}">Read conversation →</a></footer>${hits.length?`<details class="scene-matches" open><summary>${hits.length} matching ${hits.length===1?'post':'posts'} — open in context</summary><div>${hits.map(p=>`<a href="${sceneLink(scene.id,{entry:p.id,q:state.q})}"><strong>${escape(p.voice)}${p.aside?' · Table talk':''}</strong><time datetime="${p.published}">${date(p.published,{year:undefined})}</time><span>${escape(excerpt(p,state.q))}</span></a>`).join('')}</div></details>`:''}</article>`;
}
function renderScene(main,db,id,params){
 const scenes=buildScenes(db.entries),scene=scenes.find(s=>s.id===id);
 if(!scene){main.innerHTML='<div class="page-wrap empty"><h1>This scene is not in the archive.</h1><a class="button" href="#campaign">Return to the records</a></div>';return;}
 const ids=new Set(scene.posts.map(p=>p.id)),records=db.entries.filter(e=>ids.has(e.id)||(e.kind!=='ic'&&e.published>=scene.published&&e.published<=scene.ended));
 const groups=groupSceneRecords(records),asideCount=scene.posts.filter(p=>p.aside).length,target=params.get('entry'),selected=scene.posts.find(p=>p.id===target),q=params.get('q')||'';
 const adjacent=(where)=>`<nav class="scene-adjacent" aria-label="${where} scene navigation">${scenes[scene.number-2]?`<a href="${sceneLink(scenes[scene.number-2].id)}"><small>← Previous scene</small>${escape(scenes[scene.number-2].title)}</a>`:'<span></span>'}${scenes[scene.number]?`<a href="${sceneLink(scenes[scene.number].id)}"><small>Next scene →</small>${escape(scenes[scene.number].title)}</a>`:'<span></span>'}</nav>`;
 main.innerHTML=`<div class="campaign-wrap scene-reader"><nav class="archive-breadcrumb" aria-label="Breadcrumb"><a href="${link({scene:id})}">← Scene overview</a><a href="${link({entry:scene.first})}">View in full feed ↗</a></nav><header class="scene-heading"><div class="eyebrow">The voices / Scene ${String(scene.number).padStart(2,'0')} of ${scenes.length}</div><h1>${escape(scene.title)}</h1><p class="scene-summary"><small>Editorial summary</small>${escape(scene.summary)}</p><div class="scene-reader-meta">${date(scene.published)} – ${date(scene.ended)} · ${scene.posts.length} posts · ${Math.ceil(scene.words/220)} min read<br>Original wording · Posted dates in UTC</div></header>${adjacent('Top')}<div class="scene-toolbar"><label class="table-talk-control"><input id="scene-talk" type="checkbox" ${selected?.aside?'checked':''}> Show table talk (${asideCount})</label><label class="scene-jump">Jump to scene <select id="scene-jump">${scenes.map(s=>`<option value="${s.id}" ${s.id===id?'selected':''}>${String(s.number).padStart(2,'0')} / ${escape(s.title)}</option>`).join('')}</select></label></div><p class="scene-visible-count" role="status"></p><section id="scene-conversation" aria-label="Original conversation"></section>${adjacent('Bottom')}<a class="scene-return" href="${link({scene:id})}">↑ Return to the scene overview</a></div>`;
 const talk=main.querySelector('#scene-talk');
 function postLink(post){const owner=scenes.find(s=>s.posts.some(p=>p.id===post.id));return owner?sceneLink(owner.id,{entry:post.id}):link({entry:post.id});}
 function draw(){
  main.querySelector('.scene-visible-count').textContent=`${scene.posts.length-(talk.checked?0:asideCount)} of ${scene.posts.length} posts shown${!talk.checked&&asideCount?' · '+asideCount+' table-talk posts hidden':''}`;
  main.querySelector('#scene-conversation').innerHTML=groups.map(group=>{
   if(group.kind==='record')return `<div class="scene-filing"><p class="eyebrow">Filed during this conversation · ${date(group.record.published)}</p>${renderEntry(group.record,db.entries,'')}</div>`;
   if(group.aside&&!talk.checked)return '';
   const first=group.posts[0];
   return `<div class="dispatch scene-dispatch ${first.author==='smalls'?'dispatch-narrator':''} ${first.aside?'dispatch-aside':''}"><div class="dispatch-seal" aria-hidden="true">${escape(first.author==='smalls'?'BC':first.voice.slice(0,2).toUpperCase())}</div><div class="dispatch-content"><header><div><strong>${escape(first.voice)}</strong><span>${escape(first.author)} · ${first.aside?'Table talk':first.author==='smalls'?'Narration':'In character'}</span></div></header>${group.posts.map(p=>{
    const reply=db.entries.find(e=>e.id===p.replyTo);
    return `<article class="scene-post ${p.id===target?'selected-post':''}" id="record-${p.id}" tabindex="-1">${p.id===target?`<p class="post-location">${q?'Search match · Shown in conversation':'Linked post'}</p>`:''}<a class="entry-time" href="${postLink(p)}"><time datetime="${p.published}">${date(p.published)} · ${clock(p.published)} UTC</time>${p.edited?' · Edited':''} ↗</a>${reply?`<a class="dispatch-reply" href="${postLink(reply)}">↳ Reply to ${escape(reply.author)}: ${escape(excerpt(reply).slice(0,90))}</a>`:''}<div class="dispatch-body">${messageMarkup(p.body)}</div>${(p.images||[]).map(im=>`<a class="dispatch-image" href="${escape(im.src)}" target="_blank" rel="noopener"><img src="${escape(im.src)}" alt="${escape(im.alt)}" loading="lazy"><span>View attached illustration ↗</span></a>`).join('')}</article>`;
   }).join('')}</div></div>`;
  }).join('');
 }
 talk.addEventListener('change',draw);main.querySelector('#scene-jump').addEventListener('change',e=>{location.hash=sceneLink(e.target.value);});draw();
 if(target)requestAnimationFrame(()=>{const element=document.getElementById('record-'+target);element?.scrollIntoView({block:'start'});element?.focus({preventScroll:true});});
 document.title=scene.title+' — The Black Company';
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
