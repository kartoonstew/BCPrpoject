import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {inflateRawSync} from 'node:zlib';
import {filterCampaign,messageMarkup} from '../campaign.js';
const {entries}=JSON.parse(await readFile(new URL('../data/campaign.json',import.meta.url),'utf8'));
const isSummary=e=>e.kind==='document'&&e.summary===true;
const normalize=text=>text.replace(/\s+/g,' ').trim();

/* Minimal DOCX reader: pull word/document.xml out of the ZIP and read its paragraphs the way the importer does. */
function documentXml(buffer){
 const eocd=buffer.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));
 assert(eocd>0,'word/document.xml container is a ZIP');
 let p=buffer.readUInt32LE(eocd+16);
 for(let i=0;i<buffer.readUInt16LE(eocd+10);i++){
  assert.equal(buffer.readUInt32LE(p),0x02014b50,'central directory entry');
  const method=buffer.readUInt16LE(p+10),size=buffer.readUInt32LE(p+20),nameLength=buffer.readUInt16LE(p+28),extraLength=buffer.readUInt16LE(p+30),commentLength=buffer.readUInt16LE(p+32),local=buffer.readUInt32LE(p+42);
  const name=buffer.toString('utf8',p+46,p+46+nameLength);
  if(name==='word/document.xml'){
   const start=local+30+buffer.readUInt16LE(local+26)+buffer.readUInt16LE(local+28),raw=buffer.subarray(start,start+size);
   return (method===0?raw:inflateRawSync(raw)).toString('utf8');
  }
  p+=46+nameLength+extraLength+commentLength;
 }
 throw new Error('word/document.xml is missing');
}
const decode=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#(\d+);/g,(_,d)=>String.fromCodePoint(Number(d))).replace(/&amp;/g,'&');
function docxBlocks(buffer){
 const blocks=[];
 for(const paragraph of documentXml(buffer).matchAll(/<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g)){
  const runs=[];
  for(const run of paragraph[1].matchAll(/<w:r(?:\s[^>]*)?>([\s\S]*?)<\/w:r>/g)){
   let text='';
   for(const piece of run[1].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:br\s*\/>|<w:tab\s*\/>/g))text+=piece[0].startsWith('<w:br')?'\n':piece[0].startsWith('<w:tab')?'\t':decode(piece[1]);
   if(text)runs.push({text,bold:/<w:b(?:\s[^>]*)?\/?>/.test(run[1])});
  }
  const text=runs.map(r=>r.text).join('');
  if(!text.trim())continue;
  const style=paragraph[1].match(/<w:pStyle[^>]*w:val="([^"]*)"/);
  const heading=(style&&/heading/i.test(style[1]))||(text.length<160&&runs.length>0&&runs.every(r=>r.bold));
  blocks.push({type:['*','---'].includes(text.trim())?'divider':heading?'heading':'paragraph',text});
 }
 return blocks;
}
const readDocx=async path=>docxBlocks(await readFile(new URL('../'+path,import.meta.url)));

test('campaign corpus contains approved writings and every IC post, with valid chronology and local attachments',async()=>{
 assert.equal(entries.length,207);assert.equal(entries.filter(e=>e.kind==='document').length,8);assert.equal(entries.filter(e=>e.kind==='ic').length,197);
 assert.equal(entries.filter(e=>e.kind==='attachment').length,2);
 assert.equal(new Set(entries.map(e=>e.id)).size,207);
 assert.deepEqual(filterCampaign(entries).map(e=>e.id),entries.map(e=>e.id));
 for(const e of entries){assert(Number.isFinite(Date.parse(e.published)));assert(!('author_id' in e));for(const file of [e.download,e.originalDownload,e.image,...(e.images||[]).map(i=>i.src)].filter(Boolean)){assert(file.startsWith('assets/campaign/'));await access(new URL('../'+file,import.meta.url));}if(e.replyTo)assert(entries.some(r=>r.id===e.replyTo));}
 assert(!entries.some(e=>/Herbie_OB|Fighter_Character_Sheet|BC_PHB/.test(e.originalName||'')));
 assert(entries.find(e=>e.id==='fourth-ur-annals').label.includes('historical'));
});
test('formal records interleave at their exact posting times, with UTC chronology across midnight',()=>{
 const july=filterCampaign(entries,{month:'2026-07'}),recap=july.findIndex(e=>e.id==='session-two'),ur=july.findIndex(e=>e.id==='fourth-ur-annals');
 assert.equal(july[recap+1].id,'ic-1522738687207800983');assert.equal(ur,recap+2);
 const feb=filterCampaign(entries,{month:'2026-02'});assert.equal(feb[0].id,'year-of-dust-47');assert.equal(feb[1].id,'year-47-part-two');
});
test('search spans complete writing text and combines type, contributor and month filters',()=>{
 assert(filterCampaign(entries,{kind:'documents',q:'Quillslayer'}).some(e=>e.id==='road-to-gregors-ditch'));
 const filtered=filterCampaign(entries,{kind:'ic',author:'The_Frostrune',month:'2026-08',q:'Prancer'});assert(filtered.length);assert(filtered.every(e=>e.kind==='ic'&&e.author==='The_Frostrune'&&e.published.startsWith('2026-08')));
 assert.equal(filterCampaign(entries,{q:'zzzz-no-such-record'}).length,0);assert.equal(filterCampaign(entries,{kind:'documents'}).length,10);
});
test('Discord formatting escapes executable content and preserves paragraph and line breaks',()=>{
 const html=messageMarkup('<img src=x onerror=alert(1)>\n**Orders**\n\n*Move out.*');assert(!html.includes('<img'));assert(html.includes('&lt;img'));assert(html.includes('<strong>Orders</strong>'));assert(html.includes('<em>Move out.</em>'));assert.equal((html.match(/<p>/g)||[]).length,2);
});

test('editorial scenes cover every original post exactly once in chronological order',async()=>{
 const {buildScenes}=await import('../campaign-scenes.js');const scenes=buildScenes(entries),posts=entries.filter(e=>e.kind==='ic');
 assert.equal(scenes.length,12);assert.deepEqual(scenes.flatMap(s=>s.posts.map(p=>p.id)),posts.map(p=>p.id));
 for(const s of scenes){assert.equal(s.published,s.posts[0].published);assert.equal(s.ended,s.posts.at(-1).published);assert(s.title&&s.summary);assert(s.posts.every(p=>posts.includes(p)));}
 const tent=scenes.find(s=>s.id==='tadpoles-tent');const records=entries.filter(e=>tent.posts.includes(e)||(e.kind!=='ic'&&e.published>=tent.published&&e.published<=tent.ended));
 const recap=records.findIndex(e=>e.id==='session-two');assert.equal(records[recap+1].id,'ic-1522738687207800983');assert.equal(records[recap+2].id,'fourth-ur-annals');
});
test('contributor grouping retains every original timestamp and respects asides and filing boundaries',async()=>{
 const {groupSceneRecords}=await import('../campaign-scenes.js');
 const records=[{id:'a',kind:'ic',author:'A',aside:false,published:'1'},{id:'b',kind:'ic',author:'A',aside:false,published:'2'},{id:'c',kind:'ic',author:'A',aside:true,published:'3'},{id:'d',kind:'ic',author:'A',aside:false,published:'4'},{id:'doc',kind:'document'},{id:'e',kind:'ic',author:'A',aside:false,published:'5'},{id:'f',kind:'ic',author:'B',aside:false,published:'6'}];
 const groups=groupSceneRecords(records);assert.equal(groups.length,6);assert.deepEqual(groups[0].posts,records.slice(0,2));assert.deepEqual(groups.flatMap(g=>g.kind==='record'?[g.record]:g.posts),records);
});

test('recaps cover all scenes, cut reading length, and link to retained sources',async()=>{
 const {buildScenes}=await import('../campaign-scenes.js');
 const {sceneRecaps,recapText}=await import('../campaign-recaps.js');
 const scenes=buildScenes(entries),docIds=new Set(entries.filter(e=>e.kind==='document').map(e=>e.id)),sceneIds=new Set(scenes.map(s=>s.id));
 assert.deepEqual(new Set(Object.keys(sceneRecaps)),sceneIds);
 for(const scene of scenes){const r=scene.recap;assert(r.context&&r.outcome&&r.events.length>=2);const words=recapText(r).split(/\s+/).length;assert(words>=90&&words<scene.words/2,scene.id+' is a substantial but shorter recap');for(const id of r.sources)assert(docIds.has(id));}
});

test('the rereading-scene recap tracks the expanded account instead of claiming the Ditch is unexplained',async()=>{
 const {sceneRecaps}=await import('../campaign-recaps.js');
 const r=sceneRecaps['reading-chalk'],text=[r.context,...r.events,r.outcome].join(' ');
 assert(/Sallow’s Fist/.test(text)&&/outside the wall/.test(text),'the recap points at the answered question');
 assert(!/does not yet explain/.test(text)&&!/Arrival and the next adventure are not yet recorded/.test(text),'the stale unknown-atrocity wording is gone');
});

test('every supplied DOCX source matches its imported blocks paragraph for paragraph',async()=>{
 for(const [id,file] of [['session-three','assets/campaign/session-three.docx'],['fourth-ur-annals','assets/campaign/fourth-ur-annals-s1-s3.docx']]){
  const record=entries.find(e=>e.id===id),source=await readDocx(file);
  assert.equal(source.length,record.blocks.length,id+' block count');
  assert.deepEqual(source.map(b=>b.type),record.blocks.map(b=>b.type),id+' block types');
  assert.deepEqual(source.map(b=>normalize(b.text)),record.blocks.map(b=>normalize(b.text)),id+' paragraph text');
  assert.equal(record.words,source.reduce((n,b)=>n+b.text.split(/\s+/).filter(Boolean).length,0),id+' word count');
 }
 assert.equal(entries.find(e=>e.id==='session-three').words,3341);
});

test('the expanded Fourth Ur-Annals keeps every original passage and adds the reviewed revelations',async()=>{
 const record=entries.find(e=>e.id==='fourth-ur-annals'),expanded=new Set(record.blocks.map(b=>normalize(b.text)));
 const original=await readDocx('assets/campaign/fourth-ur-annals.docx');
 assert(original.length>0);
 for(const block of original)assert(expanded.has(normalize(block.text)),'original passage retained: '+block.text.slice(0,70));
 assert(record.words>entries.find(e=>e.id==='session-two').words);
});

test('seven reviewed revelations give the Fourth Ur-Annals a working contents list',()=>{
 const record=entries.find(e=>e.id==='fourth-ur-annals');
 assert.equal(record.toc.length,7);
 const indexes=record.toc.map(t=>t.index);
 assert.equal(new Set(indexes).size,7,'every revelation link targets its own heading');
 assert.deepEqual(indexes,[...indexes].sort((a,b)=>a-b),'revelations stay in reading order');
 for(const item of record.toc){
  const block=record.blocks[item.index];
  assert.equal(block.type,'heading');
  assert(/^REVEALED WHEN /.test(block.text.trim()),'source heading is a revelation');
  assert(item.label.length>=6&&item.label!==block.text.trim(),'contents entry has a readable name');
 }
});

test('exactly three formal session summaries exist and filter in session order',()=>{
 const summaries=filterCampaign(entries,{kind:'summaries'});
 assert.deepEqual(summaries.map(e=>e.id),['captains-briefing','session-two','session-three']);
 for(const e of summaries){assert(isSummary(e));assert.equal(e.kind,'document');assert(Number.isInteger(e.summaryOrder));}
 assert.equal(entries.filter(isSummary).length,3);
 assert.equal(filterCampaign(entries,{kind:'documents'}).filter(isSummary).length,3,'documents view keeps the summaries');
 assert(!filterCampaign(entries,{kind:'ic'}).some(isSummary));
 assert.equal(entries.filter(e=>e.kind==='document'&&!isSummary(e)).length,5);
});
test('summary search composes with preview text, contributor, month and empty results',()=>{
 assert.deepEqual(filterCampaign(entries,{kind:'summaries',q:'hide a lie'}).map(e=>e.id),['session-three']);
 assert.deepEqual(filterCampaign(entries,{kind:'summaries',q:'Keshin'}).map(e=>e.id),['captains-briefing']);
 assert.deepEqual(filterCampaign(entries,{kind:'summaries',q:'Scholomance'}).map(e=>e.id),['session-two']);
 assert.deepEqual(filterCampaign(entries,{kind:'summaries',month:'2026-09'}).map(e=>e.id),['session-three']);
 assert.deepEqual(filterCampaign(entries,{kind:'summaries',month:'2026-03'}).map(e=>e.id),['captains-briefing']);
 assert.equal(filterCampaign(entries,{kind:'summaries',author:'The_Frostrune'}).length,0);
 assert.equal(filterCampaign(entries,{kind:'summaries',q:'zzzz-no-such-record'}).length,0);
});

test('each formal session summary has a shorter, source-linked preview',async()=>{
 const {summaryPreviews,recapText}=await import('../campaign-recaps.js');
 const summaries=filterCampaign(entries,{kind:'summaries'}),docIds=new Set(entries.filter(e=>e.kind==='document').map(e=>e.id));
 assert.deepEqual(Object.keys(summaryPreviews).sort(),summaries.map(e=>e.id).sort());
 for(const record of summaries){
  const preview=summaryPreviews[record.id];
  assert(preview.context&&preview.outcome&&preview.events.length>=2);
  const words=recapText(preview).split(/\s+/).filter(Boolean).length;
  assert(words>=90&&words<record.words/2,record.id+' preview is substantial but shorter than its account');
  for(const id of preview.sources)assert(docIds.has(id));
 }
});

test('supplied-session provenance is explicit and the Fourth Ur filing keeps its original date',()=>{
 const three=entries.find(e=>e.id==='session-three'),ur=entries.find(e=>e.id==='fourth-ur-annals');
 assert.equal(three.dateKind,'added');assert.equal(three.addedAt,'2026-09-21');assert(three.published.startsWith('2026-09-21T00:00:00'));
 assert.equal(three.title,'Session 3 · War in the West');assert.equal(three.label,'Session 3 · summary');assert.equal(three.source,'supplied_docs');
 assert.equal(entries.at(-1).id,'session-three','the added Session 3 summary sorts after the S3 preamble');
 assert(entries.findIndex(e=>e.id==='session-three')>entries.findIndex(e=>e.id==='road-to-gregors-ditch'),'Session 3 summary follows the S3 preamble in story order');
 assert.equal(ur.published,'2026-07-03T23:16:42.683000+00:00','original filing timestamp is preserved');
 assert.equal(ur.updatedAt,'2026-09-21');assert.equal(ur.updatedName,'The Fourth Ur Annals S1-S3.docx');
 assert.equal(ur.download,'assets/campaign/fourth-ur-annals-s1-s3.docx');assert.equal(ur.originalDownload,'assets/campaign/fourth-ur-annals.docx');
 assert.equal(entries.filter(e=>e.id==='fourth-ur-annals').length,1,'no duplicate Fourth Ur record');
 assert.equal(ur.source,'campaign_docs');
});

test('campaign briefing covers the Session 3 account, keeps Bormanz open, and never narrates the Catastrophe',async()=>{
 const {buildScenes}=await import('../campaign-scenes.js');
 const {campaignBriefing}=await import('../campaign-recaps.js');
 const docIds=new Set(entries.filter(e=>e.kind==='document').map(e=>e.id)),sceneIds=new Set(buildScenes(entries).map(s=>s.id));
 assert.equal(campaignBriefing.beats.length,18);assert.equal(campaignBriefing.threads.length,7);
 assert.equal(campaignBriefing.through,entries.at(-1).published.slice(0,10));
 assert(campaignBriefing.throughNote.includes('archive-addition'));
 for(const beat of campaignBriefing.beats){
  assert(beat.title&&beat.text);assert((beat.sources?.length||0)+(beat.scenes?.length||0)>0);
  for(const id of beat.sources||[])assert(docIds.has(id),'beat source '+id+' is a retained document');
  for(const id of beat.scenes||[])assert(sceneIds.has(id),'beat scene '+id+' is a retained scene');
 }
 const covering=campaignBriefing.beats.filter(b=>(b.sources||[]).includes('session-three'));
 assert(covering.length>=4,'the briefing adds the Session 3 developments');
 assert(campaignBriefing.threads.some(t=>t.includes('Bormanz')),'Bormanz stays unresolved');
 const everything=[campaignBriefing.current,...campaignBriefing.beats.map(b=>b.text),...campaignBriefing.threads].join(' ');
 assert(!/still in Soulblighter/i.test(everything),'the Company is not described as still serving its patron');
 assert(!/arriv/i.test(campaignBriefing.current),'the briefing does not assert the Knuckle reached the Anatomium');
 assert(/Mercy/i.test(everything)&&!/Captain’s nod/i.test(everything),'the killing follows Mercy’s nod, not the Captain’s');
 assert(!/\bCompany buried\b/i.test(everything),'the briefing does not invent who buried the Ditch dead');
 assert(!/next destination/i.test(everything),'the stale next-destination framing is gone');
 assert(!campaignBriefing.beats.some(b=>/Where the record stops/.test(b.title)),'the stale road-beat title is retired');
 assert(campaignBriefing.beats.some(b=>b.title==='The road to Gregor’s Ditch'),'the road beat is named for its record');
 const historical=campaignBriefing.beats.find(b=>/Ditch is named for/.test(b.title));
 assert(historical,'a source-grounded beat explains the Ditch name');
 assert(/Sallow’s Fist/.test(historical.text)&&/outside the wall/.test(historical.text)&&/Third Battle of Denby/.test(historical.text));
 assert(historical.sources.includes('fourth-ur-annals')&&!/still in Soulblighter/i.test(historical.text));
 assert(campaignBriefing.threads.some(t=>/Sallow/.test(t)),'the Ditch thread reflects the answered question');
 assert(campaignBriefing.threads.some(t=>/Catastrophe at Scales/.test(t)&&/separate/i.test(t)),'the Catastrophe thread is separated from the Ditch dead');
 assert(/does not (describe|narrate|narrates)/i.test(everything),'the briefing says the account stops short of narrating the Catastrophe');
 assert(!/Catastrophe at Scales[^.]{0,90}?(destroyed|burned|killed|exploded|slaughtered|drowned|levelled|razed)/i.test(everything),'no invented Catastrophe details');
  for(const scene of ['after-telembor','tadpoles-tent','captains-coin','reading-chalk'])assert(campaignBriefing.beats.some(b=>(b.scenes||[]).includes(scene)));
});

test('the Session 3 preview and briefing attribute the killing to Mercy’s nod and frame the patron break',async()=>{
 const {summaryPreviews,recapText,campaignBriefing}=await import('../campaign-recaps.js');
 const preview=recapText(summaryPreviews['session-three']);
 assert(/Mercy gave Twitch the nod/.test(preview),'the preview names Mercy’s nod');
 assert(!/Captain’s nod/i.test(preview),'the preview does not hand the nod to the Captain');
 assert(/breaks openly with the patron/i.test(preview),'the preview frames the break with the patron');
 assert(/not back to camp/.test(preview),'the preview keeps the last explicit orders');
 const beat=campaignBriefing.beats.find(b=>/night Crispus died/.test(b.title));
 assert(/Mercy gives Twitch the nod/.test(beat.text)&&!/Captain’s nod/i.test(beat.text),'the beat names Mercy’s nod');
 assert(!/arriv/i.test(preview)&&!/arriv/i.test(beat.text),'neither asserts an Anatomium arrival');
 assert(campaignBriefing.threads.some(t=>/spooks will go in the mud|put the spooks/i.test(t)||/Anatomi/i.test(t)),'the break is carried into the threads');
});

test('session summaries keep session order in every view, not posting-date order',async()=>{
 const {orderRecords}=await import('../campaign.js');
 const synthetic=[
  {id:'session-three',kind:'document',summary:true,summaryOrder:3,published:'2026-03-01T00:00:00Z'},
  {id:'captains-briefing',kind:'document',summary:true,summaryOrder:1,published:'2026-09-01T00:00:00Z'},
  {id:'session-two',kind:'document',summary:true,summaryOrder:2,published:'2026-07-01T00:00:00Z'}
 ];
 assert.deepEqual(orderRecords([...synthetic],'summaries').map(e=>e.id),['captains-briefing','session-two','session-three'],'summaries read in session order');
 assert.deepEqual(orderRecords([...synthetic],'all').map(e=>e.id),['session-three','session-two','captains-briefing'],'every other view keeps posting order');
 const mixed=orderRecords([{id:'scene',kind:'scene',published:'2026-01-01T00:00:00Z'},...synthetic],'summaries').map(e=>e.id);
 assert.deepEqual(mixed,['captains-briefing','session-two','session-three','scene'],'records without a session order sort after the summaries');
});
