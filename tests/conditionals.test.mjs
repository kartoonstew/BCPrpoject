import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {calculateBonuses,pdfCalculationScript} from '../sheet-math.js';
import {defaults,sanitizeCharacter} from '../character.js';
const calc=(c={})=>calculateBonuses({...defaults(),level:7,strength:16,dexterity:18,...c});
test('every armor category uses correct Dexterity rules and only the relevant equipment effects',()=>{
 for(const [armorType,ac] of [['Unarmored',14],['Padded',15],['Leather',15],['Studded leather',16],['Hide',14],['Chain shirt',15],['Scale mail',16],['Breastplate',16],['Half plate',17],['Ring mail',14],['Chain mail',16],['Splint',17],['Plate',18]])assert.equal(calc({armorType}).armorClass,ac,armorType);
 assert.equal(calc({armorType:'Hide',dexterity:8}).armorClass,11);
 assert.equal(calc({armorType:'Plate',dexterity:8}).armorClass,18);
 assert.equal(calc({armorType:'Plate',shieldEquipped:'Yes',styleRule:'Defense',armorMagic:'1',shieldMagic:'2'}).armorClass,24);
 assert.equal(calc({armorType:'Unarmored',styleRule:'Defense'}).armorClass,14);
 assert.equal(calc({ac:'19',shieldEquipped:'Yes',styleRule:'Defense'}).armorClass,'19');
 assert.equal(calc({armorType:'Half plate',quirk:'Bird Bones'}).armorClass,16);
 assert.equal(calc({armorType:'Leather',quirk:'Bird Bones'}).armorClass,15);
});
test('Stealth disadvantage is separate from the skill bonus; armor training, Strength and mithral apply independently',()=>{
 const c={armorType:'Plate',subclass:'Snake',strength:12,skills:['Stealth']};
 assert.equal(calc(c).stealthRoll,'Disadvantage');assert.equal(calc(c).skill_Stealth_bonus,7);assert.equal(calc(c).speed,20);
 assert.match(calc(c).equipmentSummary,/all Strength \/ Dexterity/);
 assert.equal(calc({...c,mithralArmor:'Yes'}).speed,30);
 assert.equal(calc({...c,mithralArmor:'Yes'}).stealthRoll,'Disadvantage','mithral does not grant training');
 assert.equal(calc({...c,subclass:'Salt',mithralArmor:'Yes'}).stealthRoll,'Normal');
 assert.equal(calc({armorType:'Ring mail',strength:8}).speed,30,'ring mail has no Strength requirement');
});
test('2024 exhaustion penalizes D20 tests and speed, never score modifiers, PB, DC or damage',()=>{
 const base={skills:['Stealth'],weapon1Mode:'Melee',weapon1Dice:'1d8 slashing'};
 for(let exhaustion=0;exhaustion<=6;exhaustion++){
  const v=calc({...base,exhaustion:String(exhaustion)});
  assert.equal(v.skill_Stealth_bonus,7-2*exhaustion);assert.equal(v.save_Strength_bonus,6-2*exhaustion);assert.equal(v.initiative,4-2*exhaustion);assert.equal(v.deathPenalty,0-2*exhaustion);
  assert.equal(v.strAttack,6-2*exhaustion);assert.equal(v.speed,Math.max(0,30-5*exhaustion));
  assert.equal(v.strength_mod,3);assert.equal(v.proficiency,3);assert.equal(v.saveDC,15);assert.equal(v.weapon1Damage,'1d8 slashing +3');
 }
 assert.match(calc({exhaustion:'6'}).equipmentSummary,/dead/);
 assert.equal(calc({exhaustion:'2',initiative:'0'}).initiative,0,'an explicit initiative override is a final total');
});
test('weapons respect finesse, thrown classification, Heavy requirements, extra-attack damage and styles',()=>{
 const base={weapon1Mode:'Melee',weapon1Dice:'1d6 piercing',weapon1Properties:'finesse, light'};
 assert.equal(calc({weapon1Mode:'Melee',weapon1Dice:'1d8/1d10 slashing',weapon1Properties:'versatile',weapon1Hands:'Two'}).weapon1Damage,'1d10 slashing +3');
 assert.equal(calc({weapon1Mode:'Thrown melee',weapon1Dice:'1d6/1d8 piercing',weapon1Properties:'versatile',weapon1Hands:'Two'}).weapon1Damage,'1d6 piercing +3');
 assert.equal(calc(base).weapon1ToHit,'+7');assert.equal(calc(base).weapon1Damage,'1d6 piercing +4');
 assert.equal(calc({...base,weapon1Ability:'Strength'}).weapon1ToHit,'+6');
 assert.equal(calc({...base,weapon1Mode:'Thrown melee',styleRule:'Archery'}).weapon1ToHit,'+7');
 assert.equal(calc({...base,weapon1Mode:'Ranged',styleRule:'Archery'}).weapon1ToHit,'+9');
 assert.equal(calc({...base,weapon1Extra:'Yes'}).weapon1Damage,'1d6 piercing +0');
 assert.equal(calc({...base,weapon1Extra:'Yes',styleRule:'Two-Weapon Fighting'}).weapon1Damage,'1d6 piercing +4');
 assert.equal(calc({...base,weapon1Extra:'Yes',dexterity:8,strength:8}).weapon1Damage,'1d6 piercing -1');
 assert.equal(calc({...base,weapon1Properties:'heavy',strength:12}).weapon1Roll,'Disadvantage');
 assert.equal(calc({...base,weapon1Properties:'heavy',strength:13}).weapon1Roll,'Normal');
 assert.equal(calc({...base,weapon1Mode:'Ranged',weapon1Properties:'heavy',dexterity:12}).weapon1Roll,'Disadvantage');
 assert.equal(calc({...base,weapon1Properties:'',subclass:'Scrapper'}).weapon1ToHit,'+7');
 assert.match(calc({...base,weapon1Properties:'two-handed, loading',weapon1Hands:'Two',shieldEquipped:'Yes',styleRule:'Great Weapon Fighting'}).equipmentSummary,/damage-die rolls of 1 or 2 as 3/);
});
test('campaign equipment effects unlock at their actual levels',()=>{
 assert.match(calc({subclass:'Bump',armorType:'Plate'}).equipmentSummary,/reduce B\/P\/S attack damage by 6/);
 assert.equal(calc({subclass:'Bump',armorType:'Plate',shieldEquipped:'Yes',level:6}).armorClass,20);
 assert.equal(calc({subclass:'Bump',armorType:'Plate',shieldEquipped:'Yes',level:7}).armorClass,21);
 assert.equal(calc({subclass:'Salt',level:2}).deathPenalty,0);
 assert.equal(calc({subclass:'Salt',level:3,quirk:'Borrowed Time',exhaustion:'1'}).deathPenalty,-2);
 assert.match(calc({subclass:'Payday',armorType:'Plate'}).equipmentSummary,/Fury unavailable/);
});
test('custom overrides preserve zero, replace rather than stack, and are dormant when switched off',()=>{
 const c={armorType:'Plate',strength:8,exhaustion:'2',houseRules:'On',overrideAC:'0',overrideSpeed:'0',overrideTraining:'Trained',overrideStealth:'Advantage',weapon1Mode:'Melee',weapon1Properties:'heavy',weapon1Dice:'1d8',attack1Bonus:'0',attack1Damage:'7d6 custom',weapon1RollOverride:'Normal'};
 const v=calc(c);assert.equal(v.armorClass,0);assert.equal(v.speed,0);assert.equal(v.stealthRoll,'Advantage');assert.equal(v.weapon1ToHit,'+0');assert.equal(v.weapon1Damage,'7d6 custom');assert.equal(v.weapon1Roll,'Normal');
 const off=calc({...c,houseRules:'Off'});assert.equal(off.armorClass,18);assert.equal(off.speed,10);assert.equal(off.stealthRoll,'Disadvantage');assert.equal(off.weapon1ToHit,'-2');assert.equal(off.weapon1Roll,'Disadvantage');
 const restored=sanitizeCharacter({...defaults(),...c},['Sawbones'],[],[]);assert.equal(restored.overrideAC,'0');assert.equal(restored.attack1Damage,'7d6 custom');assert.equal(restored.houseRules,'On');
 assert.equal(calc({...c,overrideSpeed:'',ignoreArmorStrength:'Yes',ignoreExhaustion:'Yes'}).speed,30);
});
test('PDF script uses exactly the same conditional engine, including edited dropdowns and overrides',()=>{
 const c={...defaults(),armorType:'Plate',strength:12,level:7,exhaustion:'1',weapon1Mode:'Ranged',weapon1Dice:'1d8',styleRule:'Archery'};
 const context=vm.createContext({});vm.runInContext(pdfCalculationScript(Object.keys(c)),context);
 const doc={getField:k=>({value:c[k]})};
 for(const key of ['armorClass','speed','stealthRoll','weapon1ToHit','weapon1Damage','equipmentSummary'])assert.equal(context.BCValue(doc,key),String(calculateBonuses(c)[key]));
 c.houseRules='On';c.overrideAC='0';assert.equal(context.BCValue(doc,'armorClass'),'0');
});
