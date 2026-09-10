/** 2024 SRD equipment plus the campaign's explicit exceptions. */
export const armors={
  Manual:null,Unarmored:[10,99,0,false,'none'],Padded:[11,99,0,true,'light'],Leather:[11,99,0,false,'light'],'Studded leather':[12,99,0,false,'light'],
  Hide:[12,2,0,false,'medium'],'Chain shirt':[13,2,0,false,'medium'],'Scale mail':[14,2,0,true,'medium'],Breastplate:[14,2,0,false,'medium'],'Half plate':[15,2,0,true,'medium'],
  'Ring mail':[14,0,0,true,'heavy'],'Chain mail':[16,0,13,true,'heavy'],Splint:[17,0,15,true,'heavy'],Plate:[18,0,15,true,'heavy']
};
const select=(key,label,options,value=options[0])=>({key,label,options,value});
const text=(key,label,value='')=>({key,label,value});
const yes=['No','Yes'];
export const conditionalGroups=[
 {title:'Armor, style & exhaustion',fields:[select('armorType','Worn armor',Object.keys(armors)),select('shieldEquipped','Shield equipped',yes),select('mithralArmor','Mithral armor',yes),text('armorMagic','Armor magic bonus','0'),text('shieldMagic','Shield magic bonus','0'),select('styleRule','Automatic Fighting Style',['None / custom','Defense','Archery','Great Weapon Fighting','Two-Weapon Fighting']),select('exhaustion','Exhaustion (2024)',['0','1','2','3','4','5','6']),text('ac','Manual AC'),text('fightingStyle','Additional style notes')]},
 ...[1,2,3].map(i=>({title:'Weapon '+i+' configuration',fields:[select('weapon'+i+'Mode','Weapon rules',['Manual','Melee','Ranged','Thrown melee']),select('weapon'+i+'Ability','Attack ability',['Auto','Strength','Dexterity']),text('weapon'+i+'Dice','Base damage dice / type'),text('weapon'+i+'Properties','Properties (comma separated)'),select('weapon'+i+'Hands','Hands used',['One','Two']),select('weapon'+i+'Extra','Light extra attack',yes),text('weapon'+i+'Magic','Magic attack & damage bonus','0'),select('weapon'+i+'Custom','Use custom totals',yes),text('attack'+i+'Bonus','Custom / manual to hit'),text('attack'+i+'Damage','Custom / manual damage')]})),
 {title:'House rules / conditional override',fields:[select('houseRules','Enable house rules',['Off','On']),text('overrideAC','Replace final AC'),text('overrideSpeed','Replace final speed'),select('overrideTraining','Armor training',['Auto','Trained','Untrained']),select('overrideStealth','Stealth roll',['Auto','Normal','Advantage','Disadvantage']),select('ignoreArmorStealth','Ignore armor Stealth penalty',yes),select('ignoreArmorStrength','Ignore armor Strength limit',yes),select('ignoreExhaustion','Ignore exhaustion penalties',yes),...[1,2,3].map(i=>select('weapon'+i+'RollOverride','Weapon '+i+' roll override',['Auto','Normal','Advantage','Disadvantage'])),text('overrideReason','House-rule explanation')]}
];
export const conditionalDefaults=Object.fromEntries(conditionalGroups.flatMap(g=>g.fields.map(f=>[f.key,f.value])));
export const conditionalInputNames=Object.keys(conditionalDefaults);
export const conditionalOutputNames=['armorClass','stealthRoll','equipmentSummary',...[1,2,3].flatMap(i=>['weapon'+i+'ToHit','weapon'+i+'Damage','weapon'+i+'Roll'])];

/** ES5: also embedded into exported PDFs. Read inputs only, never earlier outputs. */
export function applyConditionals(c,out,armorTable){
 function n(x){return x!==undefined&&x!==null&&String(x).replace(/\s/g,'')!==''&&isFinite(Number(x))?Number(x):null;}
 function num(x){return n(x)===null?0:n(x);}
 function yes(x){return x==='Yes';}
 function signed(x){return x>=0?'+'+x:String(x);}
 var notes=[],custom=c.houseRules==='On',a=armorTable[c.armorType],category=a?a[4]:'manual',heavy=category==='heavy',worn=a&&category!=='none',shield=yes(c.shieldEquipped),mithral=yes(c.mithralArmor),level=num(c.level),pb=out.proficiency;
 var trained=!heavy||['Sawbones','Bump','Deacon','Salt'].indexOf(c.subclass)!==-1;
 if(custom&&c.overrideTraining==='Trained')trained=true;
 if(custom&&c.overrideTraining==='Untrained')trained=false;
 var untrained=worn&&!trained;
 var ex=Math.max(0,Math.min(6,Math.floor(num(c.exhaustion)))),pen=custom&&yes(c.ignoreExhaustion)?0:ex*2;
 // Exhaustion affects D20 tests, not ability scores, proficiency, damage, or DCs.
 for(var k in out)if((/^save_.*_bonus$|^skill_.*_bonus$/.test(k)||['strAttack','dexAttack','deathPenalty'].indexOf(k)!==-1)&&out[k]!=='')out[k]-=pen;
 if(out.initiative!==''&&n(c.initiativeOverride!==undefined?c.initiativeOverride:c.initiative)===null)out.initiative-=pen;
 if(c.subclass==='Salt'&&level>=3&&pb!=='')out.deathPenalty+=pb;
 var armorDis=Boolean(worn&&a[3]&&!mithral&&!(custom&&yes(c.ignoreArmorStealth)));
 out.stealthRoll=armorDis||untrained?'Disadvantage':'Normal';
 if(custom&&['Normal','Advantage','Disadvantage'].indexOf(c.overrideStealth)!==-1)out.stealthRoll=c.overrideStealth;
 var weak=Boolean(worn&&a[2]>num(c.strength)&&!mithral&&!(custom&&yes(c.ignoreArmorStrength)));
 if(out.speed!=='')out.speed=Math.max(0,out.speed-(weak?10:0)-(pen?5*ex:0));
 out.armorClass=c.ac===undefined?'':c.ac;
 if(a){out.armorClass=out.dexterity_mod===''&&category!=='heavy'?'':a[0]+(heavy?0:Math.min(a[1],out.dexterity_mod))+(worn?num(c.armorMagic):0)+(shield?2+num(c.shieldMagic):0)+(worn&&c.styleRule==='Defense'?1:0)-(c.quirk==='Bird Bones'&&(heavy||category==='medium')?1:0)+(c.subclass==='Bump'&&level>=7&&shield?1:0);}
 if(custom&&n(c.overrideAC)!==null)out.armorClass=n(c.overrideAC);
 if(custom&&n(c.overrideSpeed)!==null)out.speed=n(c.overrideSpeed);
 if(category==='manual')notes.push('Manual AC: equipment AC effects are not added. Choose worn armor for automatic AC.');
 if(armorDis)notes.push('Armor: disadvantage on Stealth; the numerical skill bonus is unchanged.');
 if(untrained)notes.push('Untrained armor: disadvantage on all Strength / Dexterity D20 tests; cannot cast spells.');
 if(weak)notes.push('Armor Strength requirement unmet: speed -10 ft.');
 if(pen)notes.push('Manual weapon totals and initiative overrides are final: include exhaustion yourself.');
 if(ex)notes.push(ex===6?'Exhaustion 6: dead.':('Exhaustion '+ex+': '+(pen?'D20 tests -'+pen+', speed -'+(5*ex)+' ft.':'penalties overridden.')));
 if(c.subclass==='Bump'&&heavy&&pb!=='')notes.push('Iron Cocoon: reduce B/P/S attack damage by '+(2*pb)+'.'+(level>=3?' Soak is eligible; activate and track separately.':''));
 if(c.subclass==='Bump'&&level>=7&&shield)notes.push('Shieldwall: self +1 AC included with automatic armor; adjacent allies +1 AC, non-stacking.');
 if(c.subclass==='Payday')notes.push(heavy?'Fury unavailable in heavy armor.':'Fury must be activated separately; its benefits are not added.');
 if(c.subclass==='Salt'&&level>=3)notes.push('Survivor: proficiency included in death-check adjustment.');
 var legacy=String(c.weapons||'').split('\n').filter(function(s){return s.replace(/\s/g,'')!=='';});
 for(var i=1;i<=3;i++){
  var prefix='weapon'+i,manual=c[prefix+'Mode']===undefined||c[prefix+'Mode']==='Manual',mode=c[prefix+'Mode'],props=String(c[prefix+'Properties']||'').toLowerCase().split(/\s*,\s*/),has=function(p){return props.indexOf(p)!==-1;};
  var hand=c[prefix+'Hands']==='Two',extra=yes(c[prefix+'Extra']),finesse=has('finesse')||(c.subclass==='Scrapper'&&(mode==='Melee'||mode==='Thrown melee')&&!has('heavy'));
  var ability=c[prefix+'Ability'];if(ability!=='Strength'&&ability!=='Dexterity')ability=finesse?(out.dexterity_mod>out.strength_mod?'Dexterity':'Strength'):mode==='Ranged'?'Dexterity':'Strength';
  var mod=out[ability.toLowerCase()+'_mod'],damageMod=mod===''?'':(extra&&c.styleRule!=='Two-Weapon Fighting'?Math.min(0,mod):mod)+num(c[prefix+'Magic']);
  var dis=Boolean(untrained||has('heavy')&&(mode==='Ranged'?num(c.dexterity)<13:num(c.strength)<13));
  var roll=dis?'Disadvantage':'Normal';
  if(custom&&['Normal','Advantage','Disadvantage'].indexOf(c[prefix+'RollOverride'])!==-1)roll=c[prefix+'RollOverride'];
  var explicit=c['attack'+i+'Name']||c['attack'+i+'Bonus']||c['attack'+i+'Damage']||c['attack'+i+'Mastery'],parts=String(legacy[i-1]||'').split(/\s*\/\s*/);
  out[prefix+'ToHit']=manual?(explicit?c['attack'+i+'Bonus']||'':parts.length>=3?parts[1]:''):mod===''||pb===''?'':signed(mod+pb+num(c[prefix+'Magic'])+(c.styleRule==='Archery'&&mode==='Ranged'?2:0)-pen);
  var dice=String(c[prefix+'Dice']||''),versatile=dice.match(/^(\d+d\d+|\d+)\/(\d+d\d+|\d+)(.*)$/);
  if(versatile)dice=(hand&&mode==='Melee'&&has('versatile')?versatile[2]:versatile[1])+versatile[3];
  out[prefix+'Damage']=manual?(explicit?c['attack'+i+'Damage']||'':parts.length>=3?parts[2]:''):damageMod===''||!dice?'':dice+' '+signed(damageMod);
  out[prefix+'Roll']=manual?'Manual':roll;
  var customWeapon=custom||yes(c[prefix+'Custom']);
  if(customWeapon&&n(c['attack'+i+'Bonus'])!==null)out[prefix+'ToHit']=signed(n(c['attack'+i+'Bonus']));
  if(customWeapon&&c['attack'+i+'Damage'])out[prefix+'Damage']=c['attack'+i+'Damage'];
  if(yes(c[prefix+'Custom']))notes.push('Weapon '+i+': custom totals enabled; filled values replace final totals, including any penalties.');
  if(manual)continue;
  if(!dice)notes.push('Weapon '+i+': enter base damage dice / type.');
  if(hand&&shield)notes.push('Weapon '+i+': two hands conflict with the equipped shield.');
  if(has('two-handed')&&!hand)notes.push('Weapon '+i+': requires two hands.');
  if(has('heavy')&&dis&&!untrained)notes.push('Weapon '+i+': Heavy ability requirement unmet; disadvantage.');
  if(has('loading'))notes.push('Weapon '+i+': Loading limits shots to one per action / bonus action / reaction unless a feature overrides it.');
  if(extra&&!has('light'))notes.push('Weapon '+i+': confirm eligibility for the Light extra attack.');
  if(c.styleRule==='Great Weapon Fighting'&&mode==='Melee'&&hand&&(has('two-handed')||has('versatile')))notes.push('Weapon '+i+': Great Weapon Fighting treats damage-die rolls of 1 or 2 as 3.');
 }
 if(custom){
  var replacements=[];
  if(n(c.overrideAC)!==null)replacements.push('AC '+out.armorClass);
  if(n(c.overrideSpeed)!==null)replacements.push('speed '+out.speed);
  if(c.overrideStealth&&c.overrideStealth!=='Auto')replacements.push('Stealth '+out.stealthRoll);
  if(c.overrideTraining&&c.overrideTraining!=='Auto')replacements.push('armor '+c.overrideTraining);
  for(var z=1;z<=3;z++)if(n(c['attack'+z+'Bonus'])!==null||c['attack'+z+'Damage']||(c['weapon'+z+'RollOverride']&&c['weapon'+z+'RollOverride']!=='Auto'))replacements.push('weapon '+z+' final overrides');
  if(replacements.length)notes.unshift('Replacements: '+replacements.join('; ')+'.');
 }
 if(custom)notes.unshift('HOUSE RULES ON. Overrides replace final totals / roll states. '+String(c.overrideReason||'No explanation recorded.'));
 out.equipmentSummary=notes.join('\n')||'No equipment penalties active.';
 return out;
}

// [mode, base dice/type, properties, hands, mastery]; user selection only.
export const weaponPresets={
 'Dagger':['Melee','1d4 piercing','finesse, light, thrown','One','Nick'],
 'Handaxe':['Melee','1d6 slashing','light, thrown','One','Vex'],
 'Javelin':['Thrown melee','1d6 piercing','thrown','One','Slow'],
 'Mace':['Melee','1d6 bludgeoning','','One','Sap'],
 'Quarterstaff':['Melee','1d6/1d8 bludgeoning','versatile','One','Topple'],
 'Spear':['Melee','1d6/1d8 piercing','thrown, versatile','One','Sap'],
 'Dart':['Ranged','1d4 piercing','finesse, thrown','One','Vex'],
 'Light crossbow':['Ranged','1d8 piercing','ammunition, loading, two-handed','Two','Slow'],
 'Shortbow':['Ranged','1d6 piercing','ammunition, two-handed','Two','Vex'],
 'Battleaxe':['Melee','1d8/1d10 slashing','versatile','One','Topple'],
 'Glaive':['Melee','1d10 slashing','heavy, reach, two-handed','Two','Graze'],
 'Greataxe':['Melee','1d12 slashing','heavy, two-handed','Two','Cleave'],
 'Greatsword':['Melee','2d6 slashing','heavy, two-handed','Two','Graze'],
 'Halberd':['Melee','1d10 slashing','heavy, reach, two-handed','Two','Cleave'],
 'Longsword':['Melee','1d8/1d10 slashing','versatile','One','Sap'],
 'Maul':['Melee','2d6 bludgeoning','heavy, two-handed','Two','Topple'],
 'Rapier':['Melee','1d8 piercing','finesse','One','Vex'],
 'Scimitar':['Melee','1d6 slashing','finesse, light','One','Nick'],
 'Shortsword':['Melee','1d6 piercing','finesse, light','One','Vex'],
 'Warhammer':['Melee','1d8/1d10 bludgeoning','versatile','One','Push'],
 'Hand crossbow':['Ranged','1d6 piercing','ammunition, light, loading','One','Vex'],
 'Heavy crossbow':['Ranged','1d10 piercing','ammunition, heavy, loading, two-handed','Two','Push'],
 'Longbow':['Ranged','1d8 piercing','ammunition, heavy, two-handed','Two','Slow']
};
