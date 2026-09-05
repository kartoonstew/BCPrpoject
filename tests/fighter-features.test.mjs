import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateBonuses} from '../sheet-math.js';
import {fighterFeatures,weaponRows} from '../fighter-features.js';
import {defaults,sanitizeCharacter} from '../character.js';

test('2024 Fighter resources and attack counts match every level of the reference table',()=>{
  // Level, attacks per Attack action, Second Wind, Action Surge, Indomitable, masteries.
  const table=[
    [1,1,2,0,0,3],[2,1,2,1,0,3],[3,1,2,1,0,3],[4,1,3,1,0,4],
    [5,2,3,1,0,4],[6,2,3,1,0,4],[7,2,3,1,0,4],[8,2,3,1,0,4],
    [9,2,3,1,1,4],[10,2,4,1,1,5],[11,3,4,1,1,5],[12,3,4,1,1,5],
    [13,3,4,1,2,5],[14,3,4,1,2,5],[15,3,4,1,2,5],[16,3,4,1,2,6],
    [17,3,4,2,3,6],[18,3,4,2,3,6],[19,3,4,2,3,6],[20,4,4,2,3,6],
  ];
  for(const [level,...expected] of table){
    const v=calculateBonuses({...defaults(),level});
    assert.deepEqual([v.attacksPerAction,v.secondWindMax,v.actionSurgeMax,v.indomitableMax,v.masteryMax],expected);
    assert.equal(v.secondWindHealing,`1d10+${level}`);
  }
  for(const key of ['attacksPerAction','secondWindMax','actionSurgeMax','indomitableMax','masteryMax','secondWindHealing'])assert.equal(calculateBonuses({})[key],'');
});

test('Fighter descriptions unlock at their levels without adding core subclass features',()=>{
  const one=fighterFeatures({...defaults(),level:1});
  assert.deepEqual(one.map(r=>r.title),['Fighting Style','Second Wind','Weapon Mastery']);
  const seven=fighterFeatures({...defaults(),level:7});
  assert.equal(seven.length,8);
  assert(!seven.some(r=>r.title==='Indomitable'));
  assert(seven.find(r=>r.id==='fighter_ability_score_improvement').body.includes('levels 4, 6,'));
  const twenty=fighterFeatures({...defaults(),level:20});
  assert.equal(twenty.filter(r=>r.id==='fighter_extra_attack').length,1);
  assert.equal(twenty.find(r=>r.id==='fighter_extra_attack').title,'Three Extra Attacks');
  assert(twenty.find(r=>r.id==='fighter_indomitable').body.includes('(+20)'));
  assert(twenty.find(r=>r.id==='fighter_action_surge').body.includes('only once on a turn'));
  assert(twenty.some(r=>r.title==='Epic Boon'));
  assert(!twenty.some(r=>/subclass/i.test(r.title)));
  for(let level=1;level<=20;level++)assert(fighterFeatures({...defaults(),level}).every(r=>r.level<=level));
});

test('existing loadouts are preserved while explicit weapon rows take precedence',()=>{
  const c={...defaults(),weapons:'Longbow / +7 / 1d8+4 piercing / Slow\nAn unusual blade; ask the DM'};
  assert.deepEqual(weaponRows(c)[0],['Longbow','+7','1d8+4 piercing','Slow']);
  assert.deepEqual(weaponRows(c)[1],['','','','']);
  assert.equal(c.weapons,'Longbow / +7 / 1d8+4 piercing / Slow\nAn unusual blade; ask the DM');
  assert.deepEqual(weaponRows({...c,attack1Name:'Dagger'})[0],['Dagger','','','']);
  const next=sanitizeCharacter({...c,fightingStyle:'Defense',masteries:'Longbow / Slow',feats:'Level 4: Tough',attack1Name:'Dagger',secondWind:'0'},['Sawbones'],[],[]);
  assert.equal(next.fightingStyle,'Defense');assert.equal(next.masteries,'Longbow / Slow');
  assert.equal(next.feats,'Level 4: Tough');assert.equal(next.attack1Name,'Dagger');assert.equal(next.secondWind,'0');
});
