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
