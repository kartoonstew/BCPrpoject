import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {defaults,derived,modifier,proficiency,validate,sanitizeCharacter} from '../character.js';
const db=JSON.parse(readFileSync(new URL('../data/rules.json',import.meta.url)));
const find=id=>db.records.find(r=>r.id===id);
test('complete v1.14 index with stable source references',()=>{
 assert.equal(db.records.length,196);assert.equal(new Set(db.records.map(r=>r.id)).size,196);
 assert.equal(db.records.filter(r=>r.category==='Brothers').length,75);
 assert.equal(db.classes.length,9);
 for(const c of db.classes)assert.deepEqual(db.records.filter(r=>r.subclass===c.name&&r.level).map(r=>r.level),[1,3,7,10]);
 assert.equal(db.records.filter(r=>r.category==='Traits').length,9);
 assert.equal(db.records.filter(r=>r.category==='Quirks').length,9);
 assert.equal(db.records.filter(r=>r.category==='Black Banner'&&r.level).length,5);
 for(const r of db.records){assert(r.body.length>4);assert(r.page>=1&&r.endPage<=8);assert(!r.body.includes('Homebrewery'));}
});
test('new edition mechanics and cross-page features survive extraction',()=>{
 assert.match(find('languages').body,/Khato, Black Cant/);
 assert.match(find('deacon-deacon-s-inspiration').body,/2X your proficiency/);
 assert.match(find('salt-been-here-done-this').body,/only once per turn/);
 assert.equal(find('slenderman-uncanny-dodge').page,4);
 assert.match(find('aura-of-brotherhood').body,/1 hit point/);
 assert.match(find('armor-shield').note,/base DC/);
 assert(!find('thunk-killing-calm').body.includes('The Black Banner'));
});
test('Fighter scaling, subclass overrides, traits and quirks',()=>{
 assert.deepEqual([1,4,5,8,9,12,13,16,17,20].map(proficiency),[2,2,3,3,4,4,5,5,6,6]);
 assert.equal(modifier(9),-1);assert.equal(modifier(16),3);
 const c={...defaults(),subclass:'Snake',level:7,dexterity:16,trait:'Fast',quirk:'Slow'};
 assert.deepEqual(derived(c),{pb:3,dc:15,hitDie:'d10',heavy:false,initiative:6,speed:30});
 assert.equal(derived({...c,quirk:'Brittle'}).hitDie,'d8');
 assert.equal(derived({...c,subclass:'Bump'}).heavy,true);
 assert(validate({...c,trait2:'Lingerer',quirk:''}).some(x=>x.includes('requires a Quirk')));
});
test('backup import bounds and removes unsupported fields',()=>{
 const c=sanitizeCharacter({name:'<script>alert(1)</script>',level:900,strength:-99,subclass:'Mage',skills:['Arcana','Arcana','Nonsense'],__proto__:{injected:true}},db.classes.map(c=>c.name),['Fast'],['Slow']);
 assert.equal(c.level,20);assert.equal(c.strength,1);assert.equal(c.subclass,'Sawbones');assert.deepEqual(c.skills,['Arcana']);assert.equal(c.injected,undefined);
});
