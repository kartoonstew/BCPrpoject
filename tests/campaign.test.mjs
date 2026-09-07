import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {filterCampaign,messageMarkup} from '../campaign.js';
const {entries}=JSON.parse(await readFile(new URL('../data/campaign.json',import.meta.url),'utf8'));
test('campaign corpus contains approved writings and every IC post, with valid chronology and local attachments',async()=>{
 assert.equal(entries.length,206);assert.equal(entries.filter(e=>e.kind==='document').length,7);assert.equal(entries.filter(e=>e.kind==='ic').length,197);
 assert.equal(new Set(entries.map(e=>e.id)).size,206);
 assert.deepEqual(filterCampaign(entries).map(e=>e.id),entries.map(e=>e.id));
 for(const e of entries){assert(Number.isFinite(Date.parse(e.published)));assert(!('author_id' in e));for(const file of [e.download,e.image,...(e.images||[]).map(i=>i.src)].filter(Boolean)){assert(file.startsWith('assets/campaign/'));await access(new URL('../'+file,import.meta.url));}if(e.replyTo)assert(entries.some(r=>r.id===e.replyTo));}
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
 assert.equal(filterCampaign(entries,{q:'zzzz-no-such-record'}).length,0);assert.equal(filterCampaign(entries,{kind:'documents'}).length,9);
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
 const {sceneRecaps,recapText,campaignBriefing}=await import('../campaign-recaps.js');
 const scenes=buildScenes(entries),docIds=new Set(entries.filter(e=>e.kind==='document').map(e=>e.id)),sceneIds=new Set(scenes.map(s=>s.id));
 assert.deepEqual(new Set(Object.keys(sceneRecaps)),sceneIds);
 for(const scene of scenes){const r=scene.recap;assert(r.context&&r.outcome&&r.events.length>=2);const words=recapText(r).split(/\s+/).length;assert(words>=90&&words<scene.words/2,scene.id+' is a substantial but shorter recap');for(const id of r.sources)assert(docIds.has(id));}
 assert(campaignBriefing.beats.length>=10);assert(campaignBriefing.threads.length>=3);
 assert.equal(campaignBriefing.through,entries.at(-1).published.slice(0,10));
 for(const beat of campaignBriefing.beats){assert(beat.title&&beat.text);assert((beat.sources?.length||0)+(beat.scenes?.length||0)>0);for(const id of beat.sources||[])assert(docIds.has(id));for(const id of beat.scenes||[])assert(sceneIds.has(id));}
});
