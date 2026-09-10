import {drawLandscapeSheet} from './pdf-landscape.js?v=landscape1';
import {conditionalGroups,conditionalInputNames} from './conditional-rules.js?v=weaponinputs1';
import {fighterFeatures,weaponRows} from './fighter-features.js?v=weaponinputs1';
import {abilities, skills, skillAbilities} from './character.js?v=landscape1';
import {calculateBonuses,calculatedFieldNames,formatBonus,signedField,pdfCalculationScript} from './sheet-math.js?v=weaponinputs1';
import {drawWear,randomSeed,seededRandom} from './pdf-wear.js?v=landscape1';

/** Browser-only AcroForm generator. No network, backend, or flattened fields. */
export async function createCharacterPDF(character, db, {blank=false,wearSeed=randomSeed(),orientation='portrait'}={}) {
  if(!['portrait','landscape'].includes(orientation))throw new Error('Choose portrait or landscape.');
  const landscape=orientation==='landscape',pageWidth=landscape?792:612,pageHeight=landscape?612:792;
  const {PDFDocument,StandardFonts,rgb,PDFName,PDFHexString}=globalThis.PDFLib;
  const pdf=await PDFDocument.create();
  pdf.setTitle('The Black Company - '+(blank?'Universal Service Record':character.name||'Brother Service Record'));
  pdf.setAuthor('The Black Company Field Manual');
  pdf.setSubject('Calculating character sheet - Player’s Handbook v1.14');
  pdf.setKeywords(['Black Company','AcroForm','wear-seed:'+wearSeed,'orientation:'+orientation]);
  const random=seededRandom(wearSeed);
  const response=await fetch(new URL('assets/art/rulebook-parchment.jpg',import.meta.url));
  if(!response.ok)throw new Error('Could not load the sheet parchment.');
  const texture=await pdf.embedJpg(await response.arrayBuffer());
  const font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold),serif=await pdf.embedFont(StandardFonts.TimesRomanBold);
  const form=pdf.getForm(),c={...character},v=calculateBonuses(blank?{}:c),overflow=[],sections=[];
  weaponRows(character).forEach((r,i)=>['Name','Bonus','Damage','Mastery'].forEach((key,j)=>{if(key==='Name'||key==='Mastery'||!c['weapon'+(i+1)+'Mode']||c['weapon'+(i+1)+'Mode']==='Manual')c['attack'+(i+1)+key]=r[j];}));
  const level=blank?0:Number(c.level);
  const auto=key=>formatBonus(v[key],signedField(key));
  // Complete AcroForm defaults let viewers regenerate appearances after edits.
  form.acroForm.dict.set(PDFName.of('DR'),pdf.context.obj({Font:{Helvetica:font.ref}}));
  form.acroForm.dict.set(PDFName.of('DA'),PDFHexString.fromText('/Helvetica 10 Tf 0.12 0.14 0.11 rg'));
  form.acroForm.dict.set(PDFName.of('NeedAppearances'),pdf.context.obj(false));
  const ink=rgb(.12,.14,.11),gray=rgb(.36,.34,.28),line=rgb(.62,.57,.45),paper=rgb(.96,.94,.87),white=rgb(.985,.975,.94),red=rgb(.34,.09,.055),gold=rgb(.69,.58,.36);
  let page;
  // Standard PDF fonts support Latin/Western European text. Fail explicitly
  // instead of silently discarding unsupported user characters.
  const text=s=>String(s??'').replace(/[‐‑–—]/g,'-').replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/\u2028|\u2029/g,'\n').replace(/\t/g,'  ');
  const draw=(s,x,top,size=10,f=font,color=ink)=>page.drawText(text(s),{x,y:pageHeight-top-size,size,font:f,color});
  function addPage(title,subtitle){
    page=pdf.addPage([pageWidth,pageHeight]);sections.push({title,page});page.drawRectangle({x:0,y:0,width:pageWidth,height:pageHeight,color:paper});
    page.drawImage(texture,{x:0,y:0,width:pageWidth,height:pageHeight,opacity:.34});drawWear(page,globalThis.PDFLib,random);
    page.drawRectangle({x:28,y:pageHeight-86,width:pageWidth-56,height:64,color:ink});
    page.drawLine({start:{x:36,y:pageHeight-79},end:{x:pageWidth-36,y:pageHeight-79},color:gold,thickness:.6});
    draw('THE BLACK COMPANY  /  COMPANY ARCHIVES',40,30,7,bold,gold);draw(title,40,44,Math.min(24,(pageWidth-135)/serif.widthOfTextAtSize(text(title),1)),serif,paper);
    page.drawCircle({x:pageWidth-57,y:pageHeight-49,size:16,borderColor:gold,borderWidth:.7});draw(String(pdf.getPageCount()).padStart(2,'0'),pageWidth-66,40,15,serif,gold);
    draw(subtitle,36,96,7.5,bold,red);
    draw('PHB 1.14  /  KEEP WITH YOUR KIT',36,pageHeight-26,6.5,bold,gray);
    draw('PREVIEW / LIBREOFFICE: RECALCULATE ON THE WEBSITE',232,pageHeight-26,6,font,gray);
    page.drawLine({start:{x:36,y:39},end:{x:pageWidth-36,y:39},color:line,thickness:.5});return page;
  }
  function wrap(value,width,size=10){const result=[];for(const para of text(value).split('\n')){let current='';for(let word of para.split(/ +/)){while(font.widthOfTextAtSize(word,size)>width){if(current){result.push(current);current='';}let count=1;while(count<word.length&&font.widthOfTextAtSize(word.slice(0,count+1),size)<=width)count++;result.push(word.slice(0,count));word=word.slice(count);}const candidate=current?`${current} ${word}`:word;if(font.widthOfTextAtSize(candidate,size)>width){result.push(current);current=word;}else current=candidate;}result.push(current);}return result;}
  function field(key,label,value,x,top,width,height=28,multiline=false,size=10,preserve=false){
    draw(label.toUpperCase(),x,top,7,bold,gray);
    const f=form.createTextField(key);let v=blank&&!calculatedFieldNames.includes(key)?'':text(value);
    if(!preserve&&(multiline || (!calculatedFieldNames.includes(key)&&font.widthOfTextAtSize(v.replace(/\n/g,' '),size)>width-12))){f.enableMultiline();const rows=wrap(v,width-20,size),max=Math.max(1,Math.floor((height-12)/(size*1.2)));if(rows.length>max)overflow.push({label,key,lines:rows.slice(max),size});v=rows.slice(0,max).join('\n');}
    if(preserve&&v)size=Math.min(size,Math.max(6,(width-12)/font.widthOfTextAtSize(v.replace(/\n/g," "),1)));
    f.setText(v);f.addToPage(page,{x,y:pageHeight-top-14-height,width,height,borderWidth:.5,borderColor:line,backgroundColor:calculatedFieldNames.includes(key)?paper:white,textColor:ink,font});f.setFontSize(size);f.acroField.dict.set(PDFName.of('TU'),PDFHexString.fromText((label||key.replaceAll('_',' '))+(calculatedFieldNames.includes(key)?' - calculated automatically':' - editable')));
    return f;
  }
  function row(items,top,height=30){const gap=10,w=(540-gap*(items.length-1))/items.length;items.forEach(([key,label,value],i)=>field(key,label,value,36+i*(w+gap),top,w,height));}
  function check(key,label,checked,x,top){const f=form.createCheckBox(key);f.addToPage(page,{x,y:pageHeight-top-11,width:11,height:11,borderWidth:.6,borderColor:line,backgroundColor:white});if(!blank&&checked)f.check();draw(label,x+18,top,9);}
  const credit='This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.';
  function select(spec,x,t,width){draw(spec.label.toUpperCase(),x,t,7,bold,gray);const f=form.createDropdown(spec.key);f.addOptions(spec.options);f.select(blank?spec.value:String(c[spec.key]??spec.value));f.addToPage(page,{x,y:pageHeight-t-14-25,width,height:25,font,textColor:ink,backgroundColor:white,borderColor:line,borderWidth:.5});f.setFontSize(8);f.acroField.dict.set(PDFName.of('TU'),PDFHexString.fromText(spec.label+' - editable selection'));}
  if(landscape){drawLandscapeSheet({c,blank,level,auto,addPage,field,check,draw,wrap,select,abilities,skills,skillAbilities,conditionalGroups,fighterFeatures,weaponRows,db,font,bold,serif,red,gray,credit});}else{
  // Combat stays together. Descriptions and training have their own pages.
  addPage('Ready for the field','COMBAT / ATTACKS, DEFENSES & RESOURCES');
  row([['name','Company name',c.name],['player','Player',c.player],['penisSize','Penis size (%)',c.penisSize],['ballSize','Ball size (%)',c.ballSize]],115);
  row([['subclass','Subclass',c.subclass],['level','Fighter level',c.level],['unit','Fist / Finger / Knuckle',c.companyUnit]],170);
  row([['hpMax','Maximum HP',c.hpMax],['hpCurrent','Current HP',c.hpCurrent],['hpTemp','Temporary HP',c.hpTemp],['armorClass','Armor class *',auto('armorClass')],['initiative','Initiative / auto',auto('initiative')],['speed','Speed / auto',auto('speed')]],225,30);
  row([['strAttack','STR attack *',auto('strAttack')],['dexAttack','DEX attack *',auto('dexAttack')],['attacksPerAction','Attacks / action *',auto('attacksPerAction')],['saveDC','Subclass DC *',auto('saveDC')],['hitDie','HP die *',auto('hitDie')],['hitDice','Hit dice left',c.hitDice]],283,26);
  draw('DEATH CHECKS',36,338,9,bold,red);
  draw('Success',36,359,8,font,gray);draw('Failure',166,359,8,font,gray);
  for(let i=0;i<3;i++){check(`death_success_${i+1}`,'',Number(c.deathSuccesses)>i,87+i*21,359);check(`death_failure_${i+1}`,'',Number(c.deathFailures)>i,213+i*21,359);}
  field('deathPenalty','Death adj. *',auto('deathPenalty'),290,341,76,24);
  field('luck','Session Luck',c.luck,376,341,95,24);field('chips','Chips',c.chips,481,341,95,24);
  draw('FIGHTER RESOURCES',36,396,9,bold,red);draw('Track remaining uses; a new export does not spend or restore them.',197,398,7,font,gray);
  const resources=[['secondWind','Second Wind','secondWindMax','Short Rest: +1 / Long Rest: all',1],['actionSurge','Action Surge','actionSurgeMax','Short or Long Rest: all',2],['indomitable','Indomitable','indomitableMax','Long Rest: all',9]].filter(r=>blank||level>=r[4]);
  resources.forEach(([key,label,max,recharge],i)=>{const x=36+i*184;draw(label,x,420,11,bold);field(key,'Left',c[key],x,439,65,24);field(max,'Max *',auto(max),x+74,439,65,24);draw(recharge,x,482,7,font,gray);});
  draw('WEAPONS',36,500,9,bold,red);
  draw('Fill custom boxes, then tick Use custom. Blank boxes keep the configured result.',113,502,7,font,gray);
  weaponRows(c).forEach((values,i)=>{
    const top=519+i*72,n=i+1;
    field('attack'+n+'Name','Weapon',values[0],36,top,150,18,false,9,true);
    field('weapon'+n+'ToHit','To hit *',auto('weapon'+n+'ToHit'),196,top,55,18);
    field('weapon'+n+'Damage','Damage *',auto('weapon'+n+'Damage'),261,top,120,18,false,9,true);
    field('weapon'+n+'Roll','Roll *',auto('weapon'+n+'Roll'),391,top,80,18,false,8);
    field('attack'+n+'Mastery','Mastery / notes',values[3],481,top,95,18,false,8,true);
    check('weapon'+n+'Custom','Use custom',c['weapon'+n+'Custom']==='Yes',36,top+45);
    field('attack'+n+'Bonus','Custom hit',c['attack'+n+'Bonus'],196,top+35,55,18,false,9,true);
    field('attack'+n+'Damage','Custom damage / e.g. 1d8+3 slashing',c['attack'+n+'Damage'],261,top+35,315,18,false,9,true);
  });
  draw('Custom entries are final totals. Weapon types, dice and properties: Weapon configuration bookmark.',36,738,7,font,gray);

  addPage('Training & instincts','TRAINING / ABILITY SCORES, SAVES & SKILLS');
  abilities.forEach((a,i)=>{const x=36+i*92;draw(a.toUpperCase(),x,119,7,bold,red);field(a.toLowerCase(),'Score',c[a.toLowerCase()],x,140,45,35,false,16);field(a.toLowerCase()+'_mod','Mod *',auto(a.toLowerCase()+'_mod'),x+49,140,33,35,false,12);});
  field('proficiency','Proficiency *',auto('proficiency'),36,211,100,26);
  draw('SAVING THROWS',157,211,9,bold,red);draw('Tick proficiency. ADJ adds other modifiers.',157,233,9,font,gray);
  abilities.forEach((a,i)=>{const extra=String(c.extraSaves||'').toLowerCase().match(/[a-z]+/g)||[];const trained=c.save1===a||c.save2===a||extra.includes(a.toLowerCase())||extra.includes(a.slice(0,3).toLowerCase());const x=36+i*92;check(`save_${a}_trained`,a.slice(0,3),trained,x,272);field(`save_${a}_bonus`,'Total *',auto(`save_${a}_bonus`),x,298,45,25,false,12);field(`save_${a}_misc`,'Adj.',c[`save_${a}_misc`]||'',x+50,298,32,25,false,9);});
  draw('SKILLS',36,361,11,bold,red);draw('P = proficiency / E = expertise / ADJ = other modifiers',111,364,8,font,gray);
  for(let col=0;col<2;col++){const x=36+col*278;draw('P',x+2,391,7,bold,gray);draw('E',x+149,391,7,bold,gray);draw('ADJ',x+174,391,7,bold,gray);draw('TOTAL',x+216,391,7,bold,gray);}
  skills.forEach((s,i)=>{const col=i<9?0:1,n=i%9,x=36+col*278,t=414+n*28;check(`skill_${s}`,s,c.skills.includes(s),x,t);draw('('+abilities[skillAbilities[i]][0].toLowerCase()+')',x+22+font.widthOfTextAtSize(s,9),t+1,7,font,gray);check(`skill_${s}_expert`,'',(c.expertise||[]).includes(s),x+147,t);for(const [key,value,offset,width] of [[`skill_${s}_misc`,c[`skill_${s}_misc`]||'',173,28],[`skill_${s}_bonus`,auto(`skill_${s}_bonus`),213,42]]){const f=form.createTextField(key);f.setText(blank&&!calculatedFieldNames.includes(key)?'':String(value));f.addToPage(page,{x:x+offset,y:pageHeight-t-16,width,height:21,borderWidth:.4,borderColor:line,backgroundColor:calculatedFieldNames.includes(key)?paper:white,font,textColor:ink});f.setFontSize(10);f.acroField.dict.set(PDFName.of('TU'),PDFHexString.fromText(s+' ('+abilities[skillAbilities[i]]+')'+(key.endsWith('_misc')?' - extra modifier':' - calculated total')));}});
  draw('(s) Strength / (d) Dexterity / (i) Intelligence / (w) Wisdom / (c) Charisma',36,670,8,font,gray);
  row([['stealthRoll','Stealth roll *',auto('stealthRoll')],['passivePerception','Passive Perception *',auto('passivePerception')],['lingerHpBonus','Lingerer HP / add to HP',auto('lingerHpBonus')],['luckPenalty','Solo Luck adj. *',auto('luckPenalty')]],698,24);

  // One-column, editable ability blocks grow onto new pages, never into tiny print.
  let referenceTop=119,referenceTitle='Abilities';
  function referencePage(title,subtitle){referenceTitle=title;addPage(title,subtitle);referenceTop=119;}
  function referenceBlock(key,title,meta,body){
    const height=Math.ceil(wrap(body,520,10).length*12)+16;
    if(referenceTop+height+47>738)referencePage(referenceTitle.replace(' / continued','')+' / continued','ABILITIES / UNLOCKED AT EXPORT');
    draw(title,36,referenceTop,13,serif,red);draw(meta,36,referenceTop+21,7,bold,gray);
    const reference=field(key,'',body,36,referenceTop+25,540,height,true,10);
    reference.acroField.dict.set(PDFName.of('TU'),PDFHexString.fromText(title+' - '+meta+' - editable description'));
    referenceTop+=height+48;
  }
  referencePage("The Fighter's craft",'ABILITIES / CORE FIGHTER FEATURES AT YOUR LEVEL');
  field('fightingStyleReference','Fighting Style / at export',[c.styleRule==='None / custom'?'':c.styleRule,c.fightingStyle].filter(Boolean).join(' - '),36,119,300,40,true);
  field('masteryMax','Mastery choices / max *',auto('masteryMax'),346,119,110,40);
  field('secondWindHealing','Second Wind healing *',auto('secondWindHealing'),466,119,110,40);
  field('masteries','Chosen mastery weapons / properties',c.masteries,36,183,540,35,true);
  field('feats','Chosen feats / ASIs / benefits',c.feats,36,247,540,45,true);
  referenceTop=332;
  if(blank){field('fighter_reference_notes','Fighter ability descriptions / manual notes','',36,340,540,220,true);draw('For a sheet with unlocked rules already filled in, choose your level on the website and export.',36,602,8,font,gray);}
  for(const r of blank?[]:fighterFeatures({...c,fightingStyle:'',masteries:''}))referenceBlock(r.id,r.title,`FIGHTER / LEVEL ${r.level} / SRD 5.2.1, PP. 47-48`,r.body);
  const features=blank?[]:db.records.filter(r=>(r.subclass===c.subclass&&r.level&&r.level<=level)||(['Traits','Quirks'].includes(r.category)&&[c.trait,c.trait2,c.quirk].includes(r.title)));
  if(features.length){referencePage(`${c.subclass} / gifts & scars`,'ABILITIES / UNLOCKED SUBCLASS FEATURES, TRAITS & QUIRKS');
    for(const r of [...features.filter(r=>r.level),...features.filter(r=>!r.level)])referenceBlock(`reference_${r.id}`,r.title,`${r.level?'LEVEL '+r.level:r.category.toUpperCase()} / CAMPAIGN PHB P. ${r.page}${r.note?.startsWith('Campaign update')?' / CAMPAIGN UPDATE':''}`,r.body);
  }

  // Advanced inputs are kept off the combat page. Select fields share the website's schema.
  function configGroup(group,top){draw(group.title,36,top,11,serif,red);top+=24;group.fields.forEach((spec,i)=>{const x=36+(i%3)*184,t=top+Math.floor(i/3)*49;
    if(spec.options){draw(spec.label.toUpperCase(),x,t,7,bold,gray);const f=form.createDropdown(spec.key);f.addOptions(spec.options);f.select(blank?spec.value:String(c[spec.key]??spec.value));f.addToPage(page,{x,y:pageHeight-t-14-25,width:172,height:25,font,textColor:ink,backgroundColor:white,borderColor:line,borderWidth:.5});f.setFontSize(8);f.acroField.dict.set(PDFName.of('TU'),PDFHexString.fromText(spec.label+' - editable selection'));}
    else field(spec.key,spec.label,c[spec.key]??spec.value,x,t,172,25,false,9,true);
  });return top+Math.ceil(group.fields.length/3)*49+10;}
  addPage('Equipment rules','ARMOR / STYLE / EXHAUSTION / HOUSE RULE OVERRIDES');
  let configTop=configGroup(conditionalGroups[0],119);
  configTop=configGroup(conditionalGroups[4],configTop);
  field('equipmentSummary','Active effects *',blank?'':v.equipmentSummary,36,configTop,540,Math.min(120,724-configTop-14),true,8);
  addPage('Weapon configuration','WEAPONS / ORIGINAL INPUTS & FINAL OVERRIDES');
  configTop=119;
  for(const group of conditionalGroups.slice(1,4))configTop=configGroup({...group,fields:group.fields.filter(f=>!/^attack[123](Bonus|Damage)$|^weapon[123]Custom$/.test(f.key))},configTop);
  draw('Versatile dice (e.g. 1d8/1d10 slashing) switch with Hands used for melee attacks.',36,configTop,8,font,gray);
  draw('Properties, comma separated: finesse, heavy, light, loading, thrown, two-handed, versatile.',36,configTop+14,8,font,gray);
  draw('Combat page: fill Custom hit / damage and tick Use custom to replace weapon totals.',36,configTop+28,8,font,gray);
  draw('Preview / LibreOffice: edit the website and export again to refresh every calculation.',36,configTop+42,8,font,gray);

  addPage('Equipment & notes','EQUIPMENT / POSSESSIONS, BONDS & THE ANNALS');
  row([['trait','First Trait',c.trait],['trait2','Second Trait',c.trait2],['quirk','Quirk',c.quirk]],115,24);
  row([['tools','Tool proficiencies',c.tools],['languages','Languages',c.languages]],162,25);
  field('armorTraining','Armor & weapon training',blank?'':'Simple & Martial weapons; Light & Medium armor; Shields'+(['Sawbones','Bump','Deacon','Salt'].includes(c.subclass)?'; Heavy armor.':'.'),36,210,540,25,true,9);
  row([['armor','Armor / shield / alternate AC',c.armor],['magicItems','Magic items / attunement / charges',c.magicItems]],258,30);
  field('equipment','Equipment & supplies',c.equipment,36,311,260,48,true,9);
  field('resources','Subclass resources / current & max',c.resources,316,311,260,48,true,9);
  field('weapons','Weapon notes / original loadout',c.weapons,36,383,260,40,true,9);
  field('traitChoices','Trait choices / resistances / penalties',c.traitChoices,316,383,260,40,true,9);
  row([['gold','Gold remaining',c.gold],['baseSpeed','Base speed / before traits',c.speed],['initiativeMisc','Initiative / extra modifier',c.initiativeMisc||''],['initiativeOverride','Initiative / override total',c.initiative]],447,24);
  field('pronouns','Pronouns / description',c.pronouns,36,492,260,38,true,9);
  field('history','Before the Company',c.history,316,492,260,38,true,9);
  field('allies','Brothers, bonds & enemies',c.allies,36,550,260,36,true,9);
  field('notes','Field notes / conditions / wounds',c.notes,316,550,260,36,true,9);
  field('featureNotes','Additional features / house rules',c.featureNotes,36,610,260,36,true,9);
  field('attunedItems','Attuned items / slots used',c.attunedItems,316,610,260,36,true,9);

  wrap(credit,540,7).forEach((line,i)=>draw(line,36,683+i*10,7,font,gray));
  draw('Fighter descriptions are condensed adaptations. Campaign PHB 1.14 and noted updates override core rules.',36,730,7,font,gray);
  }
  // Print overflow on additional editable pages rather than clipping long notes.
  let index=0;
  while(index<overflow.length){const item=overflow[index++];const all=item.lines.join('\n');const rows=wrap(all,pageWidth-92,10),chunkSize=Math.floor((pageHeight-276)/12);for(let start=0,part=1;start<rows.length;start+=chunkSize,part++){addPage('Continued field notes',`${item.label.toUpperCase()} / CONTINUATION ${part}`);field(`${item.key}_continued_${part}`,`${item.label} (continued)`,rows.slice(start,start+chunkSize).join('\n'),36,120,pageWidth-72,pageHeight-242,true,10);}}
  pdf.getPages().forEach((p,i)=>p.drawText(`${i+1} / ${pdf.getPageCount()}`,{x:pageWidth-68,y:19,size:7,font,color:gray}));
  // Every output reads original inputs, so calculation order cannot double-add proficiency.
  const inputNames=form.getFields().map(f=>f.getName()).filter(name=>
    conditionalInputNames.includes(name)||['weapons','attack1Name','attack2Name','attack3Name','attack1Mastery','attack2Mastery','attack3Mastery'].includes(name)||abilities.map(a=>a.toLowerCase()).includes(name)||['level','subclass','trait','trait2','quirk','baseSpeed','initiativeOverride','initiativeMisc'].includes(name)||/^save_.*_(trained|misc)$/.test(name)||(/^skill_/.test(name)&&!name.endsWith('_bonus')));
  pdf.addJavaScript('BlackCompanyCalculations',pdfCalculationScript(inputNames));
  const order=[];
  for(const key of calculatedFieldNames){const f=form.getFields().find(f=>f.getName()===key);if(!f)continue;f.enableReadOnly();f.acroField.dict.set(PDFName.of('AA'),pdf.context.obj({C:{S:'JavaScript',JS:PDFHexString.fromText('event.value = BCValue(this, '+JSON.stringify(key)+');')}}));order.push(f.ref);}
  form.acroForm.dict.set(PDFName.of('CO'),pdf.context.obj(order));
  // Reject malformed scores/levels instead of treating a blank as a score of zero.
  for(const [key,min,max] of [...abilities.map(a=>[a.toLowerCase(),1,30]),['level',1,20]]){
    const f=form.getTextField(key);f.acroField.dict.set(PDFName.of('AA'),pdf.context.obj({V:{S:'JavaScript',JS:PDFHexString.fromText('if (String(event.value).replace(/\\s/g, "") !== "") { var n = Number(event.value); event.rc = isFinite(n) && Math.floor(n) === n && n >= '+min+' && n <= '+max+'; }')}}));
  }
  for(const f of form.getFields()){if(f.constructor.name==='PDFTextField'||typeof f.getText==='function'){f.acroField.dict.set(PDFName.of('DV'),PDFHexString.fromText(f.getText()||''));}}
  form.updateFieldAppearances(font);
  // PDFKit reads widget-local appearance settings when recreating editable text.
  for(const f of form.getFields()){const da=f.acroField.dict.get(PDFName.of('DA'));if(da)for(const widget of f.acroField.getWidgets()){widget.dict.set(PDFName.of('DA'),da);widget.dict.set(PDFName.of('Q'),pdf.context.obj(0));}}
  // Native PDF bookmarks make long ability sections easy to reach on a tablet.
  const outline=pdf.context.obj({Type:'Outlines',Count:sections.length});
  const outlineRef=pdf.context.register(outline);
  const entries=sections.map(({title,page})=>pdf.context.obj({Title:PDFHexString.fromText(title),Parent:outlineRef,Dest:[page.ref,'Fit']}));
  const refs=entries.map(e=>pdf.context.register(e));
  entries.forEach((e,i)=>{if(i)e.set(PDFName.of('Prev'),refs[i-1]);if(i+1<refs.length)e.set(PDFName.of('Next'),refs[i+1]);});
  outline.set(PDFName.of('First'),refs[0]);outline.set(PDFName.of('Last'),refs.at(-1));pdf.catalog.set(PDFName.of('Outlines'),outlineRef);
  return pdf.save();
}
