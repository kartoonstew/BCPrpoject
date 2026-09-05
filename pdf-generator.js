import {abilities, skills, skillAbilities} from './character.js';
import {calculateBonuses,calculatedFieldNames,formatBonus,signedField,pdfCalculationScript} from './sheet-math.js';
import {drawWear,randomSeed,seededRandom} from './pdf-wear.js';

/** Browser-only AcroForm generator. No network, backend, or flattened fields. */
export async function createCharacterPDF(character, db, {blank=false,wearSeed=randomSeed()}={}) {
  const {PDFDocument,StandardFonts,rgb,PDFName,PDFHexString}=globalThis.PDFLib;
  const pdf=await PDFDocument.create();
  pdf.setTitle('The Black Company - '+(blank?'Universal Service Record':character.name||'Brother Service Record'));
  pdf.setAuthor('The Black Company Field Manual');
  pdf.setSubject('Calculating character sheet - Player’s Handbook v1.14');
  pdf.setKeywords(['Black Company','AcroForm','wear-seed:'+wearSeed]);
  const random=seededRandom(wearSeed);
  const response=await fetch(new URL('assets/art/rulebook-parchment.jpg',import.meta.url));
  if(!response.ok)throw new Error('Could not load the sheet parchment.');
  const texture=await pdf.embedJpg(await response.arrayBuffer());
  const font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold),serif=await pdf.embedFont(StandardFonts.TimesRomanBold);
  const form=pdf.getForm(),c=character,v=calculateBonuses(blank?{}:c),overflow=[];
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
  const draw=(s,x,top,size=10,f=font,color=ink)=>page.drawText(text(s),{x,y:792-top-size,size,font:f,color});
  function addPage(title,subtitle){
    page=pdf.addPage([612,792]);page.drawRectangle({x:0,y:0,width:612,height:792,color:paper});
    page.drawImage(texture,{x:0,y:0,width:612,height:792,opacity:.34});drawWear(page,globalThis.PDFLib,random);
    page.drawRectangle({x:28,y:706,width:556,height:64,color:ink});
    page.drawLine({start:{x:36,y:713},end:{x:576,y:713},color:gold,thickness:.6});
    draw('THE BLACK COMPANY  /  COMPANY ARCHIVES',40,30,7,bold,gold);draw(title,40,44,25,serif,paper);
    page.drawCircle({x:555,y:743,size:16,borderColor:gold,borderWidth:.7});draw(String(pdf.getPageCount()).padStart(2,'0'),546,40,15,serif,gold);
    draw(subtitle,36,96,7.5,bold,red);
    draw('PHB 1.14  /  KEEP WITH YOUR KIT',36,766,6.5,bold,gray);
    draw('PREVIEW / LIBREOFFICE: RECALCULATE ON THE WEBSITE',232,766,6,font,gray);
    page.drawLine({start:{x:36,y:39},end:{x:576,y:39},color:line,thickness:.5});return page;
  }
  function wrap(value,width,size=10){const result=[];for(const para of text(value).split('\n')){let current='';for(let word of para.split(/ +/)){while(font.widthOfTextAtSize(word,size)>width){if(current){result.push(current);current='';}let count=1;while(count<word.length&&font.widthOfTextAtSize(word.slice(0,count+1),size)<=width)count++;result.push(word.slice(0,count));word=word.slice(count);}const candidate=current?`${current} ${word}`:word;if(font.widthOfTextAtSize(candidate,size)>width){result.push(current);current=word;}else current=candidate;}result.push(current);}return result;}
  function field(key,label,value,x,top,width,height=28,multiline=false,size=10){
    draw(label.toUpperCase(),x,top,7,bold,gray);
    const f=form.createTextField(key);let v=blank&&!calculatedFieldNames.includes(key)?'':text(value);
    if(multiline || (!calculatedFieldNames.includes(key)&&font.widthOfTextAtSize(v.replace(/\n/g,' '),size)>width-12)){f.enableMultiline();const rows=wrap(v,width-20,size),max=Math.max(1,Math.floor((height-12)/(size*1.2)));if(rows.length>max)overflow.push({label,key,lines:rows.slice(max),size});v=rows.slice(0,max).join('\n');}
    f.setText(v);f.addToPage(page,{x,y:792-top-14-height,width,height,borderWidth:.5,borderColor:line,backgroundColor:calculatedFieldNames.includes(key)?paper:white,textColor:ink,font});f.setFontSize(size);f.acroField.dict.set(PDFName.of('TU'),PDFHexString.fromText(label+(calculatedFieldNames.includes(key)?' - calculated automatically':' - editable')));
    return f;
  }
  function row(items,top,height=30){const gap=10,w=(540-gap*(items.length-1))/items.length;items.forEach(([key,label,value],i)=>field(key,label,value,36+i*(w+gap),top,w,height));}
  function check(key,label,checked,x,top){const f=form.createCheckBox(key);f.addToPage(page,{x,y:792-top-11,width:11,height:11,borderWidth:.6,borderColor:line,backgroundColor:white});if(!blank&&checked)f.check();draw(label,x+18,top,8);}
  addPage('A Brother of the Company','01 / IDENTITY, ABILITIES & FIELD READINESS');
  row([['name','Company name',c.name],['player','Player',c.player]],115);
  row([['subclass','Subclass',c.subclass],['level','Fighter level',c.level],['unit','Fist / Finger / Knuckle',c.companyUnit]],173);
  abilities.forEach((a,i)=>{const x=36+i*92;draw(a.toUpperCase(),x,233,7,bold,red);field(a.toLowerCase(),'Score',c[a.toLowerCase()],x,249,45,32,false,16);field(a.toLowerCase()+'_mod','Mod *',auto(a.toLowerCase()+'_mod'),x+49,249,33,32,false,12);});
  row([['hpMax','Maximum HP',c.hpMax],['hpCurrent','Current HP',c.hpCurrent],['hpTemp','Temporary HP',c.hpTemp],['ac','Armor / manual',c.ac],['initiative','Initiative / auto',auto('initiative')],['speed','Speed / auto',auto('speed')]],310,28);
  row([['proficiency','Prof. / auto',auto('proficiency')],['saveDC','DC / auto',auto('saveDC')],['hitDie','HP die / auto',auto('hitDie')],['hitDice','Hit dice left',c.hitDice],['luck','Session Luck',c.luck],['chips','Chips',c.chips]],368,28);
  draw('SAVING THROWS',36,425,9,bold,red);draw('Tick proficiency. Enter any extra modifier in ADJ.',215,426,7,font,gray);
  abilities.forEach((a,i)=>{const extra=String(c.extraSaves||'').toLowerCase().match(/[a-z]+/g)||[];const trained=c.save1===a||c.save2===a||extra.includes(a.toLowerCase())||extra.includes(a.slice(0,3).toLowerCase());const x=36+i*92;check(`save_${a}_trained`,a.slice(0,3),trained,x,448);field(`save_${a}_bonus`,'Total *',auto(`save_${a}_bonus`),x,472,45,24,false,12);field(`save_${a}_misc`,'Adj.',c[`save_${a}_misc`]||'',x+50,472,32,24,false,9);});
  draw('SKILLS',36,526,9,bold,red);draw('P = proficiency  /  E = expertise  /  ADJ = other modifiers',103,527,7,font,gray);
  for(let col=0;col<2;col++){const x=36+col*278;draw('P',x+2,547,6,bold,gray);draw('E',x+150,547,6,bold,gray);draw('ADJ',x+177,547,6,bold,gray);draw('TOTAL',x+218,547,6,bold,gray);}
  skills.forEach((s,i)=>{const col=i<9?0:1,n=i%9,x=36+col*278,t=562+n*18;check(`skill_${s}`,s,c.skills.includes(s),x,t);draw('('+abilities[skillAbilities[i]][0].toLowerCase()+')',x+22+font.widthOfTextAtSize(s,8),t+1,6.5,font,gray);check(`skill_${s}_expert`,'',(c.expertise||[]).includes(s),x+147,t);for(const [key,value,offset,width] of [[`skill_${s}_misc`,c[`skill_${s}_misc`]||'',173,28],[`skill_${s}_bonus`,auto(`skill_${s}_bonus`),213,42]]){const f=form.createTextField(key);f.setText(blank&&!calculatedFieldNames.includes(key)?'':String(value));f.addToPage(page,{x:x+offset,y:792-t-13,width,height:15,borderWidth:.4,borderColor:line,backgroundColor:calculatedFieldNames.includes(key)?paper:white,font,textColor:ink});f.setFontSize(8);f.acroField.dict.set(PDFName.of('TU'),PDFHexString.fromText(s+' ('+abilities[skillAbilities[i]]+')'+(key.endsWith('_misc')?' - extra modifier':' - calculated total')));}});
  draw('(s) Strength / (d) Dexterity / (i) Intelligence / (w) Wisdom / (c) Charisma. Letters show the base ability.',36,727,7,font,gray);
  draw('Values are calculated at download. In Preview/LibreOffice, change level and scores on the website, then export again.',36,740,6.5,font,gray);
  addPage('Steel, gifts & scars','02 / EQUIPMENT, TRAITS & RESOURCES');
  row([['trait','First Trait',c.trait],['trait2','Second Trait',c.trait2],['quirk','Quirk',c.quirk]],115);
  field('traitChoices','Trait choices / resistances / penalties',c.traitChoices,36,173,540,40,true);
  row([['tools','Tool proficiencies',c.tools],['languages','Languages',c.languages]],242,28);
  field('weapons','Weapons / final attack bonus / damage / mastery',c.weapons,36,300,540,58,true);
  row([['armor','Armor & shield',c.armor],['magicItems','Magic items / durability / charges',c.magicItems]],388,32);
  field('equipment','Equipment & supplies',c.equipment,36,450,540,54,true);
  field('resources','Subclass resources / current & maximum',c.resources,36,534,540,46,true);
  row([['secondWind','Second Wind',c.secondWind],['actionSurge','Action Surge',c.actionSurge],['indomitable','Indomitable',c.indomitable],['gold','Gold remaining',c.gold]],610,26);
  row([['baseSpeed','Base speed / before traits',c.speed],['initiativeMisc','Initiative / extra modifier',c.initiativeMisc||''],['initiativeOverride','Initiative / override total',c.initiative]],666,23);
  draw('HP, AC, equipment and resource totals stay manual. Bird Bones: apply -1 AC in medium/heavy armor.',36,720,7,font,gray);
  draw('Fey-Touched: tick its extra save on page 1. Star-Crossed, Fast, Slow and Brittle update automatically.',36,732,7,font,gray);
  draw('Use exact printed trait, quirk and subclass names. Expertise applies only when a rule grants it.',36,744,7,font,gray);
  addPage('A name in the Annals','03 / FIELDCRAFT, HISTORY & CONDITIONS');
  field('pronouns','Pronouns / description',c.pronouns,36,115,296,28);
  field('strAttack','STR attack / auto',auto('strAttack'),342,115,112,28);
  field('dexAttack','DEX attack / auto',auto('dexAttack'),464,115,112,28);
  draw('Attack baselines include proficiency; add weapon/magic bonuses. Damage uses the ability modifier.',36,161,7,font,gray);
  field('passivePerception','Passive Perception / auto',auto('passivePerception'),36,179,260,28);
  field('lingerHpBonus','Lingerer HP / add to manual HP',auto('lingerHpBonus'),306,179,270,28);
  field('history','Before the Company',c.history,36,240,540,63,true);
  field('allies','Brothers, bonds & enemies',c.allies,36,333,540,50,true);
  field('notes','Field notes / conditions / wounds',c.notes,36,413,540,83,true);
  field('featureNotes','Fighter features / masteries / other rules',c.featureNotes,36,526,540,92,true);
  draw('DEATH CHECKS',36,654,9,bold,red);draw('SUCCESSES',36,678,7,bold,gray);draw('FAILURES',200,678,7,bold,gray);
  for(let i=0;i<3;i++){check(`death_success_${i+1}`,'',Number(c.deathSuccesses)>i,36+i*28,696);check(`death_failure_${i+1}`,'',Number(c.deathFailures)>i,200+i*28,696);}
  field('deathPenalty','Death adj. / auto',auto('deathPenalty'),363,675,97,24);
  field('luckPenalty','Solo Luck adj. / auto',auto('luckPenalty'),475,675,101,24);
  draw('Snake: initiative advantage; +20 ft. in round 1. Jumpy/Shiftless change the rolled total, not the bonus.',36,730,7,font,gray);
  draw('Death checks and Luck follow your table’s procedures. Export again after leveling to include newly unlocked features.',36,742,7,font,gray);
  const features=blank?[]:db.records.filter(r=>(r.subclass===c.subclass&&r.level&&r.level<=Number(c.level))||(['Traits','Quirks'].includes(r.category)&&[c.trait,c.trait2,c.quirk].includes(r.title)));
  if(features.length){addPage(`${c.subclass} / Field reference`,'04 / UNLOCKED SUBCLASS FEATURES, TRAITS & QUIRKS');let top=119;for(const r of features){const rows=wrap(r.body,520,9),height=Math.ceil(rows.length*10.8)+20;if(top+height+45>742){addPage(`${c.subclass} / Field reference`,'CONTINUED / SOURCE TEXT FROM PLAYER’S HANDBOOK 1.14');top=119;}field(`reference_${r.id}`,`${r.title}${r.level?' / Level '+r.level:''} / PHB p. ${r.page}`,r.body,36,top,540,height,true,9);top+=height+40;}}
  // Print overflow on additional editable pages rather than clipping long notes.
  let index=0;
  while(index<overflow.length){const item=overflow[index++];const all=item.lines.join('\n');const rows=wrap(all,520,10);for(let start=0,part=1;start<rows.length;start+=43,part++){addPage('Continued field notes',`${item.label.toUpperCase()} / CONTINUATION ${part}`);field(`${item.key}_continued_${part}`,`${item.label} (continued)`,rows.slice(start,start+43).join('\n'),36,120,540,550,true,10);}}
  pdf.getPages().forEach((p,i)=>p.drawText(`${i+1} / ${pdf.getPageCount()}`,{x:544,y:19,size:7,font,color:gray}));
  // Every output reads original inputs, so calculation order cannot double-add proficiency.
  const inputNames=form.getFields().map(f=>f.getName()).filter(name=>
    abilities.map(a=>a.toLowerCase()).includes(name)||['level','subclass','trait','trait2','quirk','baseSpeed','initiativeOverride','initiativeMisc'].includes(name)||/^save_.*_(trained|misc)$/.test(name)||(/^skill_/.test(name)&&!name.endsWith('_bonus')));
  pdf.addJavaScript('BlackCompanyCalculations',pdfCalculationScript(inputNames));
  const order=[];
  for(const key of calculatedFieldNames){const f=form.getTextField(key);f.enableReadOnly();f.acroField.dict.set(PDFName.of('AA'),pdf.context.obj({C:{S:'JavaScript',JS:PDFHexString.fromText('event.value = BCValue(this, '+JSON.stringify(key)+');')}}));order.push(f.ref);}
  form.acroForm.dict.set(PDFName.of('CO'),pdf.context.obj(order));
  // Reject malformed scores/levels instead of treating a blank as a score of zero.
  for(const [key,min,max] of [...abilities.map(a=>[a.toLowerCase(),1,30]),['level',1,20]]){
    const f=form.getTextField(key);f.acroField.dict.set(PDFName.of('AA'),pdf.context.obj({V:{S:'JavaScript',JS:PDFHexString.fromText('if (String(event.value).replace(/\\s/g, "") !== "") { var n = Number(event.value); event.rc = isFinite(n) && Math.floor(n) === n && n >= '+min+' && n <= '+max+'; }')}}));
  }
  for(const f of form.getFields()){if(f.constructor.name==='PDFTextField'||typeof f.getText==='function'){f.acroField.dict.set(PDFName.of('DV'),PDFHexString.fromText(f.getText()||''));}}
  form.updateFieldAppearances(font);
  // PDFKit reads widget-local appearance settings when recreating editable text.
  for(const f of form.getFields()){const da=f.acroField.dict.get(PDFName.of('DA'));if(da)for(const widget of f.acroField.getWidgets()){widget.dict.set(PDFName.of('DA'),da);widget.dict.set(PDFName.of('Q'),pdf.context.obj(0));}}
  return pdf.save();
}
