/** Shared rules engine. ES5 syntax intentionally supports Acrobat's JavaScript runtime. */
export function calculateBonuses(c) {
  var names=['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'];
  var skills=['Acrobatics','Animal Handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival'];
  var mapping=[1,4,3,0,5,3,4,5,3,4,3,4,5,5,3,1,1,4];
  function number(value,min,max,integer){if(value===null||value===undefined||String(value).replace(/\s/g,'')==='')return null;var n=Number(value);return isFinite(n)&&n>=min&&n<=max&&(!integer||Math.floor(n)===n)?n:null;}
  function optional(value){var n=number(value,-1000,1000,false);return n===null?0:n;}
  function same(a,b){return String(a||'').toLowerCase().replace(/^\s+|\s+$/g,'')===b.toLowerCase();}
  function trait(name){return same(c.trait,name)||same(c.trait2,name);}
  function contains(list,name){return (list||[]).indexOf(name)!==-1;}
  var level=number(c.level,1,20,true),pb=level===null?null:2+Math.floor((level-1)/4);
  var penalty=same(c.quirk,'Star-Crossed')?-1:0;
  var out={proficiency:pb===null?'':pb,saveDC:pb===null?'':9+2*pb,hitDie:same(c.quirk,'Brittle')?'d8':'d10',deathPenalty:same(c.quirk,'Borrowed Time')?-2:0,luckPenalty:same(c.quirk,'Unfortunate')?-2:0,lingerHpBonus:trait('Lingerer')?(level===null?'':level+1):0};
  out.attacksPerAction=level===null?'':level>=20?4:level>=11?3:level>=5?2:1;
  out.secondWindMax=level===null?'':level>=10?4:level>=4?3:2;
  out.actionSurgeMax=level===null?'':level>=17?2:level>=2?1:0;
  out.indomitableMax=level===null?'':level>=17?3:level>=13?2:level>=9?1:0;
  out.masteryMax=level===null?'':level>=16?6:level>=10?5:level>=4?4:3;
  out.secondWindHealing=level===null?'':'1d10+'+level;
  var extra=String(c.extraSaves||'').toLowerCase().match(/[a-z]+/g)||[];
  for(var i=0;i<names.length;i++){
    var a=names[i],key=a.toLowerCase(),score=number(c[key],1,30,true),mod=score===null?null:Math.floor((score-10)/2);
    out[key+'_mod']=mod===null?'':mod;
    var trained=c.trainedSaves?contains(c.trainedSaves,a):same(c.save1,a)||same(c.save2,a)||contains(extra,key)||contains(extra,key.slice(0,3));
    out['save_'+a+'_bonus']=mod===null||(trained&&pb===null)?'':mod+(trained?pb:0)+penalty+optional(c['save_'+a+'_misc']);
  }
  for(var j=0;j<skills.length;j++){
    var skill=skills[j],expert=contains(c.expertise,skill),prof=expert||contains(c.skills,skill),m=out[names[mapping[j]].toLowerCase()+'_mod'];
    out['skill_'+skill+'_bonus']=m===''||(prof&&pb===null)?'':m+(prof?pb*(expert?2:1):0)+optional(c['skill_'+skill+'_misc']);
  }
  var dex=out.dexterity_mod,override=number(c.initiativeOverride!==undefined?c.initiativeOverride:c.initiative,-1000,1000,false),snake=same(c.subclass,'Snake');
  out.initiative=override!==null?override:dex===''||(snake&&pb===null)?'':dex+(snake?pb:0)+optional(c.initiativeMisc);
  var base=number(c.baseSpeed!==undefined?c.baseSpeed:c.speed,0,200,false),slow=same(c.quirk,'Slow');
  out.speed=base===null?'':Math.max(slow?10:0,base+(trait('Fast')?15:0)-(slow?15:0));
  out.passivePerception=out.skill_Perception_bonus===''?'':10+out.skill_Perception_bonus;
  out.strAttack=out.strength_mod===''||pb===null?'':out.strength_mod+pb;
  out.dexAttack=dex===''||pb===null?'':dex+pb;
  return out;
}

export const calculatedFieldNames = [
  'attacksPerAction','secondWindMax','actionSurgeMax','indomitableMax','masteryMax','secondWindHealing',
  'proficiency','saveDC','hitDie','initiative','speed','passivePerception','lingerHpBonus','deathPenalty','luckPenalty','strAttack','dexAttack',
  ...['strength','dexterity','constitution','intelligence','wisdom','charisma'].map(a=>a+'_mod'),
  ...['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'].map(a=>'save_'+a+'_bonus'),
  ...['Acrobatics','Animal Handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival'].map(s=>'skill_'+s+'_bonus'),
];
export const signedField = name => /_mod$|_bonus$|Attack$/.test(name)||['proficiency','initiative','deathPenalty','luckPenalty'].includes(name);
export function formatBonus(value,signed=false){return value===''?'':typeof value==='number'&&signed&&value>=0?'+'+value:String(value);}

/** Document-level script: field inputs only; no network, files, or privileged APIs. */
export function pdfCalculationScript(inputNames){return 'var BCCalculate = '+calculateBonuses.toString()+';\nvar BCInputs = '+JSON.stringify(inputNames)+';\n'+`
function BCValue(doc,key) {
  var c={},names=['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'];
  for(var i=0;i<BCInputs.length;i++){var f=doc.getField(BCInputs[i]);c[BCInputs[i]]=f?f.value:'';}
  c.trainedSaves=[];c.skills=[];c.expertise=[];
  for(var j=0;j<names.length;j++){if(c['save_'+names[j]+'_trained']&&c['save_'+names[j]+'_trained']!=='Off')c.trainedSaves.push(names[j]);}
  for(var k=0;k<BCInputs.length;k++){var n=BCInputs[k];if(n.indexOf('skill_')===0&&n.indexOf('_bonus')<0&&n.indexOf('_misc')<0&&n.indexOf('_expert')<0&&c[n]&&c[n]!=='Off')c.skills.push(n.slice(6));if(n.indexOf('skill_')===0&&n.slice(-7)==='_expert'&&c[n]&&c[n]!=='Off')c.expertise.push(n.slice(6,-7));}
  var value=BCCalculate(c)[key];
  var signed=/_mod$|_bonus$|Attack$/.test(key)||['proficiency','initiative','deathPenalty','luckPenalty'].indexOf(key)!==-1;
  return value===''?'':typeof value==='number'&&signed&&value>=0?'+'+value:String(value);
}
`;}
