import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {findEntries,isDeskPath} from '../field-desk.js';
const db=JSON.parse(readFileSync(new URL('../data/rules.json',import.meta.url)));

test('reference desk searches source text and prioritizes exact feature names',()=>{
  assert.equal(findEntries(db.records,{query:'Snip & Stitch'})[0].id,'sawbones-snip-stitch');
  assert(findEntries(db.records,{query:'death saves'}).some(r=>r.id==='salt-survivor'));
  assert.equal(findEntries(db.records,{query:'Deacon’s Inspiration'})[0].id,'deacon-deacon-s-inspiration');
  assert.deepEqual(findEntries(db.records,{query:'no-rule-like-this-exists'}),[]);
});
test('search and saved collections respect active topics',()=>{
  const saved=new Set(['morale-checks-outcomes','sawbones-snip-stitch']);
  const rows=findEntries(db.records,{category:'Morale',saved:true},saved);
  assert.deepEqual(rows.map(r=>r.id),['morale-checks-outcomes']);
  assert.equal(findEntries(db.records,{saved:true},new Set()).length,0);
  assert.equal(findEntries(db.records).length,196);
});
test('source-page sorting and old deep links remain supported',()=>{
  const rows=findEntries(db.records,{sort:'page'});
  assert(rows.every((r,i)=>!i||r.page>=rows[i-1].page));
  assert(isDeskPath('home'));assert(isDeskPath('rules'));assert(isDeskPath('rule/sawbones-snip-stitch'));
  assert(!isDeskPath('sheet'));assert(!isDeskPath('subclasses'));
});
