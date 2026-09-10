import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createCharacterPDF} from '../pdf-generator.js';
import {fighterFeatures} from '../fighter-features.js';
import {defaults} from '../character.js';
vm.runInThisContext(await readFile(new URL('../vendor/pdf-lib.min.js',import.meta.url),'utf8'));
const texture=await readFile(new URL('../assets/art/rulebook-parchment.jpg',import.meta.url));
globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>texture});
const db=JSON.parse(await readFile(new URL('../data/rules.json',import.meta.url),'utf8'));
for(const c of db.classes)for(const level of [1,3,7,10])for(const orientation of ['portrait','landscape']){
 const bytes=await createCharacterPDF({...defaults(),subclass:c.name,level,trait:'Fast'},db,{wearSeed:1,orientation});
 const pdf=await PDFLib.PDFDocument.load(bytes),fields=pdf.getForm().getFields().map(f=>f.getName());
 // Manual inputs are editable, canonical, and located on the combat page exactly once.
 for(const i of [1,2,3])for(const key of ['attack'+i+'Bonus','attack'+i+'Damage','weapon'+i+'Custom']){
  const f=pdf.getForm().getField(key);assert(!f.isReadOnly(),key);assert.equal(f.acroField.getWidgets().length,1,key);
  const w=f.acroField.getWidgets()[0];assert.equal(w.P().toString(),pdf.getPages()[0].ref.toString(),key);
  assert(w.getAppearances()?.normal,key);
 }
 for(const f of pdf.getForm().getFields())for(const w of f.acroField.getWidgets()){const p=pdf.getPages().find(p=>p.ref.toString()===w.P().toString()),r=w.getRectangle();assert(r.x>=20&&r.y>=35&&r.x+r.width<=p.getWidth()-20&&r.y+r.height<=p.getHeight()-85,`${orientation} ${c.name} ${level} ${f.getName()} outside page`);}
 for(const key of ['penisSize','ballSize','ticks']){const f=pdf.getForm().getTextField(key);assert(!f.isReadOnly());assert.equal(f.acroField.getWidgets()[0].P().toString(),pdf.getPages()[0].ref.toString());}
 for(const page of pdf.getPages()){assert.equal(page.getWidth(),orientation==='landscape'?792:612);assert.equal(page.getHeight(),orientation==='landscape'?612:792);}
 const expected=db.records.filter(r=>r.subclass===c.name&&r.level&&r.level<=level).map(r=>'reference_'+r.id);
 assert.deepEqual(fields.filter(n=>n.startsWith('reference_')&&n!=='reference_fast'),expected,`${c.name} level ${level}`);
 const core=fighterFeatures({...defaults(),level});
 assert.deepEqual(fields.filter(n=>n.startsWith('fighter_')),core.map(r=>r.id));
 assert.equal(fields.includes('actionSurgeMax'),level>=2);assert.equal(fields.includes('indomitableMax'),level>=9);
 for(const key of [...expected,...core.map(r=>r.id)]){const f=pdf.getForm().getTextField(key);assert(f.getText().length>20);assert(!f.isReadOnly());for(const w of f.acroField.getWidgets())assert.equal(w.getFlags(),4);}
}
console.log('All 72 portrait/landscape subclass/milestone exports include exactly the unlocked, visible, editable feature descriptions.');
