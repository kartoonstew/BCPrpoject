import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {calculateBonuses,pdfCalculationScript} from '../sheet-math.js';
import {defaults,abilities,skills,skillAbilities} from '../character.js';
import {seededRandom} from '../pdf-wear.js';

test('all 30 legal ability scores match the D&D modifier table',()=>{
 const table=[-5,-4,-4,-3,-3,-2,-2,-1,-1,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10];
 for(const a of abilities)for(let n=1;n<=30;n++)assert.equal(calculateBonuses({...defaults(),[a.toLowerCase()]:n})[a.toLowerCase()+'_mod'],table[n-1]);
});
test('all levels, skills and saves apply proficiency exactly once and expertise twice',()=>{
 const bonuses=[2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6];
 for(let level=1;level<=20;level++){
  const c={...defaults(),level,strength:8,dexterity:18,constitution:14,intelligence:16,wisdom:12,charisma:6};
  const mods=[-1,4,2,3,1,-2],pb=bonuses[level-1];
  for(const trained of [false,true]){
   const out=calculateBonuses({...c,trainedSaves:trained?abilities:[],skills:trained?skills:[]});
   assert.equal(out.proficiency,pb);assert.equal(out.saveDC,9+2*pb);
   abilities.forEach((a,i)=>assert.equal(out['save_'+a+'_bonus'],mods[i]+(trained?pb:0)));
   skills.forEach((s,i)=>assert.equal(out['skill_'+s+'_bonus'],mods[skillAbilities[i]]+(trained?pb:0)));
  }
  const experts=calculateBonuses({...c,skills,expertise:skills});
  skills.forEach((s,i)=>assert.equal(experts['skill_'+s+'_bonus'],mods[skillAbilities[i]]+2*pb));
 }
});
test('campaign quirks, subclass effects, overrides and separate HP additions',()=>{
 const c={...defaults(),level:7,dexterity:16,subclass:'Snake',trait:'Fast',trait2:'Lingerer',quirk:'Star-Crossed',skills:['Perception']};
 const out=calculateBonuses(c);
 assert.equal(out.save_Strength_bonus,2);assert.equal(out.save_Dexterity_bonus,2);
 assert.equal(out.initiative,6);assert.equal(out.speed,45);assert.equal(out.lingerHpBonus,8);
 assert.equal(out.passivePerception,13);assert.equal(out.dexAttack,6);
 assert.equal(calculateBonuses({...c,initiative:'0'}).initiative,0);
 assert.equal(calculateBonuses({...c,initiativeMisc:2}).initiative,8);
 assert.equal(calculateBonuses({...c,quirk:'Brittle'}).hitDie,'d8');
 assert.equal(calculateBonuses({...c,quirk:'Borrowed Time'}).deathPenalty,-2);
 assert.equal(calculateBonuses({...c,quirk:'Unfortunate'}).luckPenalty,-2);
 assert.equal(calculateBonuses({...c,extraSaves:'Wisdom (Fey-Touched)'}).save_Wisdom_bonus,2);
 assert.equal(calculateBonuses({...c,save_Wisdom_misc:3}).save_Wisdom_bonus,2);
 assert.equal(calculateBonuses({...c,trait:'Lingerer',trait2:'',level:1}).lingerHpBonus,2);
 assert.equal(calculateBonuses({...c,trait:'Jumpy',trait2:'',dexterity:8,subclass:'Salt'}).initiative,-1,'Jumpy floors the roll, not the modifier');
 assert.equal(calculateBonuses({...c,quirk:'Shiftless'}).initiative,6,'Shiftless caps the roll, not the modifier');
});
test('Slow floor applies only to Slow, and blank/invalid inputs never become bogus totals',()=>{
 assert.equal(calculateBonuses({...defaults(),speed:0}).speed,0);
 assert.equal(calculateBonuses({...defaults(),speed:20,quirk:'Slow'}).speed,10);
 assert.equal(calculateBonuses({...defaults(),trait:'Fast',quirk:'Slow'}).speed,30);
 for(const value of ['',null,undefined,'abc',0,31,1.5])assert.equal(calculateBonuses({...defaults(),strength:value}).strength_mod,'');
 for(const level of ['',0,21,'abc',3.5])assert.equal(calculateBonuses({...defaults(),level}).proficiency,'');
 assert.equal(calculateBonuses({}).skill_Athletics_bonus,'');
});
test('embedded Acrobat adapter reacts to field edits and checkbox changes',()=>{
 const fields={level:{value:5},strength:{value:16},dexterity:{value:14},wisdom:{value:12},subclass:{value:'Snake'},quirk:{value:'Star-Crossed'},baseSpeed:{value:30},trait:{value:'Fast'},save_Strength_trained:{value:'Yes'},skill_Stealth:{value:'Yes'},skill_Stealth_expert:{value:'Off'},skill_Stealth_misc:{value:1}};
 const context=vm.createContext({});vm.runInContext(pdfCalculationScript(Object.keys(fields)),context);
 const doc={getField:name=>fields[name]},value=name=>context.BCValue(doc,name);
 assert.equal(value('strength_mod'),'+3');assert.equal(value('save_Strength_bonus'),'+5');assert.equal(value('skill_Stealth_bonus'),'+6');
 fields.dexterity.value=18;fields.level.value=9;fields.skill_Stealth_expert.value='Yes';
 assert.equal(value('initiative'),'+8');assert.equal(value('skill_Stealth_bonus'),'+13');assert.equal(value('saveDC'),'17');
 fields.save_Strength_trained.value='Off';assert.equal(value('save_Strength_bonus'),'+2');
 assert.equal(value('speed'),'45');
});
test('wear seeds are reproducible for QA and independent between exports',()=>{
 const a=seededRandom(42),b=seededRandom(42),c=seededRandom(43);
 const x=Array.from({length:20},a);assert.deepEqual(x,Array.from({length:20},b));assert.notDeepEqual(x,Array.from({length:20},c));assert(x.every(n=>n>=0&&n<1));
});
