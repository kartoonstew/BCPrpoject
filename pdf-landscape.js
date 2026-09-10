/** Landscape composition. Field identities and calculations are shared with portrait. */
export function drawLandscapeSheet(ctx){
 const {c,blank,level,auto,addPage,field,check,draw,wrap,select,abilities,skills,skillAbilities,conditionalGroups,fighterFeatures,weaponRows,db,font,bold,serif,red,gray,credit}=ctx;
 const row=(items,top,height=26,x=36,width=720)=>{const w=(width-10*(items.length-1))/items.length;items.forEach(([key,label,value],i)=>field(key,label,value,x+i*(w+10),top,w,height));};
 const note=(text,x,top,width=720)=>wrap(text,width,8).forEach((line,i)=>draw(line,x,top+i*11,8,font,gray));
 addPage('Ready for the field','COMBAT / LANDSCAPE SERVICE RECORD');
 row([['name','Company name',c.name],['player','Player',c.player],['subclass','Subclass',c.subclass],['level','Fighter level',c.level],['ticks','Ticks',c.ticks],['unit','Unit',c.companyUnit],['penisSize','Penis size (%)',c.penisSize],['ballSize','Ball size (%)',c.ballSize]],111);
 row([['hpMax','Maximum HP',c.hpMax],['hpCurrent','Current HP',c.hpCurrent],['hpTemp','Temporary HP',c.hpTemp],['armorClass','Armor class *',auto('armorClass')],['initiative','Initiative *',auto('initiative')],['speed','Speed *',auto('speed')]],163);
 draw('ATTACKS & RESOURCES',36,213,10,bold,red);draw('WEAPONS',308,213,10,bold,red);
 row([['strAttack','STR attack *',auto('strAttack')],['dexAttack','DEX attack *',auto('dexAttack')]],231,22,36,252);
 row([['attacksPerAction','Attacks / action *',auto('attacksPerAction')],['saveDC','Subclass DC *',auto('saveDC')]],278,22,36,252);
 row([['hitDie','HP die *',auto('hitDie')],['hitDice','Hit dice left',c.hitDice]],325,22,36,252);
 const resources=[['secondWind','Second Wind','secondWindMax',1],['actionSurge','Action Surge','actionSurgeMax',2],['indomitable','Indomitable','indomitableMax',9]].filter(r=>blank||level>=r[3]);
 resources.forEach(([key,label,max],i)=>{const x=36+i*86;draw(label,x,378,9,bold);field(key,'Left',c[key],x,393,35,22);field(max,'Max *',auto(max),x+39,393,35,22);});
 draw('DEATH CHECKS',36,444,9,bold,red);
 draw('Success',36,466,8,font,gray);draw('Failure',170,466,8,font,gray);
 for(let i=0;i<3;i++){check('death_success_'+(i+1),'',Number(c.deathSuccesses)>i,78+i*20,466);check('death_failure_'+(i+1),'',Number(c.deathFailures)>i,210+i*20,466);}
 row([['deathPenalty','Death adj. *',auto('deathPenalty')],['luck','Session Luck',c.luck],['chips','Chips',c.chips]],497,22,36,252);
 note('Track uses left; recharge rules are in the Fighter reference.',36,541,252);
 weaponRows(c).forEach((values,i)=>{
  const t=231+i*108,n=i+1;
  field('attack'+n+'Name','Weapon '+n,values[0],308,t,228,18,false,10,true);
  field('attack'+n+'Mastery','Mastery / notes',values[3],544,t,212,18,false,9,true);
  field('weapon'+n+'ToHit','To hit *',auto('weapon'+n+'ToHit'),308,t+35,66,18);
  field('weapon'+n+'Damage','Damage *',auto('weapon'+n+'Damage'),382,t+35,230,18,false,10,true);
  field('weapon'+n+'Roll','Roll *',auto('weapon'+n+'Roll'),620,t+35,136,18,false,9);
  check('weapon'+n+'Custom','Use custom',c['weapon'+n+'Custom']==='Yes',308,t+81);
  field('attack'+n+'Bonus','Custom hit',c['attack'+n+'Bonus'],424,t+70,66,18,false,10,true);
  field('attack'+n+'Damage','Custom damage / e.g. 1d8+3 slashing',c['attack'+n+'Damage'],498,t+70,258,18,false,10,true);
 });

 addPage('Training & instincts','ABILITY SCORES / SAVES / SKILLS');
 abilities.forEach((a,i)=>{const x=36+i*102;draw(a.toUpperCase(),x,115,7,bold,red);field(a.toLowerCase(),'Score',c[a.toLowerCase()],x,134,44,28,false,16);field(a.toLowerCase()+'_mod','Mod *',auto(a.toLowerCase()+'_mod'),x+49,134,43,28,false,12);});
 field('proficiency','Proficiency *',auto('proficiency'),656,134,100,28,false,16);
 draw('SAVING THROWS',36,186,10,bold,red);draw('Tick proficiency. ADJ adds other modifiers.',170,188,8,font,gray);
 abilities.forEach((a,i)=>{const x=36+i*122,extra=String(c.extraSaves||'').toLowerCase().match(/[a-z]+/g)||[];
  check('save_'+a+'_trained',a.slice(0,3),c.save1===a||c.save2===a||extra.includes(a.toLowerCase())||extra.includes(a.slice(0,3).toLowerCase()),x,211);
  field('save_'+a+'_bonus','Total *',auto('save_'+a+'_bonus'),x,231,57,22,false,12);field('save_'+a+'_misc','Adj.',c['save_'+a+'_misc']||'',x+62,231,46,22);
 });
 draw('SKILLS',36,279,10,bold,red);draw('P = proficiency / E = expertise / ADJ = other modifiers',120,281,8,font,gray);
 for(let col=0;col<2;col++){const x=36+col*370;draw('P',x,302,7,bold,gray);draw('E',x+218,302,7,bold,gray);draw('ADJ',x+253,302,7,bold,gray);draw('TOTAL',x+305,302,7,bold,gray);}
 skills.forEach((s,i)=>{const x=36+(i<9?0:370),t=321+(i%9)*23;
  check('skill_'+s,s+' ('+abilities[skillAbilities[i]][0].toLowerCase()+')',c.skills.includes(s),x,t);
  check('skill_'+s+'_expert','',(c.expertise||[]).includes(s),x+217,t);
  field('skill_'+s+'_misc','',c['skill_'+s+'_misc']||'',x+249,t-17,40,21,false,10,true);
  field('skill_'+s+'_bonus','',auto('skill_'+s+'_bonus'),x+300,t-17,50,21,false,10,true);
 });
 row([['stealthRoll','Stealth roll *',auto('stealthRoll')],['passivePerception','Passive Perception *',auto('passivePerception')],['lingerHpBonus','Lingerer HP / add to HP',auto('lingerHpBonus')],['luckPenalty','Solo Luck adj. *',auto('luckPenalty')]],532,20);

 let refTitle='',refSubtitle='',tops=[119,119];
 function referencePage(title,subtitle){refTitle=title;refSubtitle=subtitle;addPage(title,subtitle);tops=[119,119];}
 function referenceBlock(key,title,meta,body){
  const lines=wrap(body,330,10),chunks=[];for(let i=0;i<lines.length;i+=29)chunks.push(lines.slice(i,i+29));
  chunks.forEach((lines,i)=>{const h=lines.length*12+16;let column=tops[0]<=tops[1]?0:1;if(tops[column]+h+48>560){referencePage(refTitle.replace(' / continued','')+' / continued',refSubtitle);column=0;}const top=tops[column];
   const x=36+column*370;draw(title+(i?' / continued':''),x,top,13,serif,red);draw(meta,x,top+21,7,bold,gray);
   field(i?key+'_continued_'+i:key,'',lines.join('\n'),x,top+25,350,h,true,10);
   tops[column]=top+h+48;
  });
 }
 referencePage("The Fighter's craft",'CORE FIGHTER FEATURES / UNLOCKED AT YOUR LEVEL');
 field('fightingStyleReference','Fighting Style / at export',[c.styleRule==='None / custom'?'':c.styleRule,c.fightingStyle].filter(Boolean).join(' - '),36,119,350,42,true,8);
 field('masteryMax','Mastery choices / max *',auto('masteryMax'),406,119,170,42);
 field('secondWindHealing','Second Wind healing *',auto('secondWindHealing'),586,119,170,42);
 field('masteries','Chosen mastery weapons / properties',c.masteries,36,188,350,62,true);
 field('feats','Chosen feats / ASIs / benefits',c.feats,406,188,350,62,true);
 tops=[291,291];
 if(blank)field('fighter_reference_notes','Fighter ability descriptions / manual notes','',36,291,720,230,true);
 for(const r of blank?[]:fighterFeatures({...c,masteries:''}))referenceBlock(r.id,r.title,`FIGHTER / LEVEL ${r.level} / SRD 5.2.1, PP. 47-48`,r.body);
 const features=blank?[]:db.records.filter(r=>(r.subclass===c.subclass&&r.level&&r.level<=level)||(['Traits','Quirks'].includes(r.category)&&[c.trait,c.trait2,c.quirk].includes(r.title)));
 if(features.length){referencePage(c.subclass+' / gifts & scars','SUBCLASS FEATURES / TRAITS / QUIRKS');for(const r of [...features.filter(r=>r.level),...features.filter(r=>!r.level)])referenceBlock('reference_'+r.id,r.title,`${r.level?'LEVEL '+r.level:r.category.toUpperCase()} / CAMPAIGN PHB P. ${r.page}${r.note?.startsWith('Campaign update')?' / CAMPAIGN UPDATE':''}`,r.body);}
 function config(group,x,width,columns=2){draw(group.title,x,119,13,serif,red);const w=(width-10*(columns-1))/columns;group.fields.forEach((f,i)=>{const left=x+(i%columns)*(w+10),t=145+Math.floor(i/columns)*47;if(f.options)select(f,left,t,w);else field(f.key,f.label,c[f.key]??f.value,left,t,w,25,false,9,true);});return 145+Math.ceil(group.fields.length/columns)*47;}
 addPage('Equipment rules','ARMOR / STYLE / EXHAUSTION / HOUSE RULE OVERRIDES');
 const configEnd=config(conditionalGroups[0],36,350);config(conditionalGroups[4],406,350);
 field('equipmentSummary','Active effects *',blank?'':auto('equipmentSummary'),36,configEnd+12,350,550-configEnd-26,true,9);
 addPage('Weapon configuration','WEAPON TYPES / DICE / PROPERTIES');
 conditionalGroups.slice(1,4).forEach((g,i)=>config({...g,fields:g.fields.filter(f=>!/^attack[123](Bonus|Damage)$|^weapon[123]Custom$/.test(f.key))},36+i*244,232,1));
 note('Versatile dice: 1d8/1d10 slashing. Properties: finesse, heavy, light, loading, thrown, two-handed, versatile.',36,515);
 note('Fill Custom hit / damage on the combat page and tick Use custom. Blank values keep the configured result.',36,532);
 note('Custom entries replace final totals, including any penalties. Change level on the website to refresh feature descriptions.',36,549);
 addPage('Equipment & supplies','GEAR / LANGUAGES / GIFTS / RESOURCES');
 row([['trait','First Trait',c.trait],['trait2','Second Trait',c.trait2],['quirk','Quirk',c.quirk]],111,24);
 row([['tools','Tool proficiencies',c.tools],['languages','Languages',c.languages]],160,26);
 field('armorTraining','Armor & weapon training',blank?'':'Simple & Martial weapons; Light & Medium armor; Shields'+(['Sawbones','Bump','Deacon','Salt'].includes(c.subclass)?'; Heavy armor.':'.'),36,211,720,25,true,10);
 row([['armor','Armor / shield / alternate AC',c.armor],['magicItems','Magic items / attunement / charges',c.magicItems]],260,36);
 field('equipment','Equipment & supplies',c.equipment,36,328,350,80,true,10);field('resources','Subclass resources / current & max',c.resources,406,328,350,80,true,10);
 field('weapons','Weapon notes / original loadout',c.weapons,36,445,350,45,true,10);field('traitChoices','Trait choices / resistances / penalties',c.traitChoices,406,445,350,45,true,10);
 row([['gold','Gold remaining',c.gold],['baseSpeed','Base speed / before traits',c.speed],['initiativeMisc','Initiative / extra modifier',c.initiativeMisc||''],['initiativeOverride','Initiative / override total',c.initiative]],528,20);
 addPage('The Annals','HISTORY / BONDS / CONDITIONS / HOUSE RULES');
 const entries=[['pronouns','Pronouns / description',c.pronouns],['history','Before the Company',c.history],['allies','Brothers, bonds & enemies',c.allies],['notes','Field notes / conditions / wounds',c.notes],['featureNotes','Additional features / house rules',c.featureNotes],['attunedItems','Attuned items / slots used',c.attunedItems]];
 entries.forEach(([k,l,v],i)=>field(k,l,v,36+(i%2)*370,119+Math.floor(i/2)*135,350,96,true,10));
 wrap(credit,720,7).forEach((line,i)=>draw(line,36,529+i*10,7,font,gray));
}
