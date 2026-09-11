import {drawLandscapeSheet} from './pdf-landscape.js?v=dossier1';
import {conditionalGroups,conditionalInputNames} from './conditional-rules.js?v=weaponinputs1';
import {fighterFeatures,weaponRows} from './fighter-features.js?v=dossier1';
import {abilities, skills, skillAbilities} from './character.js?v=dossier1';
import {calculateBonuses,calculatedFieldNames,formatBonus,signedField,pdfCalculationScript} from './sheet-math.js?v=weaponinputs1';
import {drawWear,randomSeed,seededRandom} from './pdf-wear.js?v=dossier1';

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
  function addPage(title,subtitle,configuration=['Equipment rules','Weapon configuration'].includes(title)){
    page=pdf.addPage([pageWidth,pageHeight]);sections.push({title,page,configuration});page.drawRectangle({x:0,y:0,width:pageWidth,height:pageHeight,color:paper});
    page.drawImage(texture,{x:0,y:0,width:pageWidth,height:pageHeight,opacity:.34});drawWear(page,globalThis.PDFLib,random);
    page.drawRectangle({x:28,y:pageHeight-86,width:pageWidth-56,height:64,color:ink});
    page.drawLine({start:{x:36,y:pageHeight-79},end:{x:pageWidth-36,y:pageHeight-79},color:gold,thickness:.6});
    draw('THE BLACK COMPANY  /  COMPANY ARCHIVES',40,30,7,bold,gold);draw(title,40,44,Math.min(24,(pageWidth-135)/serif.widthOfTextAtSize(text(title),1)),serif,paper);
    page.drawCircle({x:pageWidth-57,y:pageHeight-49,size:16,borderColor:gold,borderWidth:.7});
    draw(subtitle,36,96,7.5,bold,red);
    draw('PHB 1.14  /  KEEP WITH YOUR KIT',36,pageHeight-26,6.5,bold,gray);
    draw('PREVIEW / LIBREOFFICE: RECALCULATE ON THE WEBSITE',232,pageHeight-26,6,font,gray);
    page.drawLine({start:{x:36,y:39},end:{x:pageWidth-36,y:39},color:line,thickness:.5});return page;
  }
  function wrap(value,width,size=10){const result=[];for(const para of text(value).split('\n')){let current='';for(let word of para.split(/ +/)){while(font.widthOfTextAtSize(word,size)>width){if(current){result.push(current);current='';}let count=1;while(count<word.length&&font.widthOfTextAtSize(word.slice(0,count+1),size)<=width)count++;result.push(word.slice(0,count));word=word.slice(count);}const candidate=current?`${current} ${word}`:word;if(font.widthOfTextAtSize(candidate,size)>width){result.push(current);current=word;}else current=candidate;}result.push(current);}return result;}
  function field(key,label,value,x,top,width,height=28,multiline=false,size=10,preserve=false,appearance={}){
    draw(label.toUpperCase(),x,top,7,bold,gray);
    const f=form.createTextField(key);let v=blank&&!calculatedFieldNames.includes(key)?'':text(value);
    if(!preserve&&(multiline || (!calculatedFieldNames.includes(key)&&font.widthOfTextAtSize(v.replace(/\n/g,' '),size)>width-12))){f.enableMultiline();const rows=wrap(v,width-20,size),max=Math.max(1,Math.floor((height-12)/(size*1.2)));if(rows.length>max)overflow.push({label,key,lines:rows.slice(max),size,configuration:sections.at(-1).configuration});v=rows.slice(0,max).join('\n');}
    if(preserve&&v)size=Math.min(size,Math.max(6,(width-12)/font.widthOfTextAtSize(v.replace(/\n/g," "),1)));
    f.setText(v);f.addToPage(page,{x,y:pageHeight-top-14-height,width,height,borderWidth:appearance.borderWidth??.5,borderColor:line,backgroundColor:appearance.backgroundColor||(calculatedFieldNames.includes(key)?paper:white),textColor:ink,font});f.setFontSize(size);f.acroField.dict.set(PDFName.of('TU'),PDFHexString.fromText((label||key.replaceAll('_',' '))+(calculatedFieldNames.includes(key)?' - calculated automatically':' - editable')));
    return f;
  }
  // Vector seals remain crisp at tablet zoom and retain ordinary editable form fields.
  const symbols={
    heart:'M32 10 C12 -6 0 5 3 19 C6 30 21 42 32 49 C43 42 58 30 61 19 C64 5 52 -6 32 10 Z',
    shield:'M3 2 L61 2 L59 25 C56 35 43 44 32 49 C21 44 8 35 5 25 Z',
    bolt:'M13 0 L2 16 L10 16 L6 30 L23 10 L14 10 L19 0 Z',
    boot:'M3 0 L17 0 L17 14 L24 19 L31 20 L31 27 L2 27 L2 19 L6 16 Z',
    swords:'M2 0 L8 3 L25 23 L29 21 L31 24 L27 28 L30 31 L27 34 L23 30 L19 33 L16 30 L19 27 L3 8 Z M30 0 L24 3 L7 23 L3 21 L1 24 L5 28 L2 31 L5 34 L9 30 L13 33 L16 30 L13 27 L29 8 Z',
    flame:'M16 0 C22 12 30 14 29 23 C29 37 3 37 3 23 C3 16 10 11 10 6 L14 18 C19 13 18 7 16 0 Z',
    fist:'M3 14 L3 7 L8 7 L8 2 L13 2 L13 0 L18 0 L18 2 L23 2 L23 5 L28 5 L28 19 L23 29 L9 29 L4 22 L0 17 Z',
    feather:'M3 30 L11 13 L23 0 L31 0 L30 10 L21 19 L13 19 L8 26 Z',
    book:'M0 3 L13 3 L16 6 L19 3 L32 3 L32 28 L19 28 L16 31 L13 28 L0 28 Z',
    eye:'M0 16 C10 0 22 0 32 16 C22 32 10 32 0 16 Z',
    mask:'M2 2 Q16 9 30 2 L28 19 Q16 38 4 19 Z',
    skull:'M3 12 C3 -3 29 -3 29 12 L27 23 L22 24 L22 30 L10 30 L10 24 L5 23 Z'
  };
  function emblem(kind,x,top,scale,color=red){
    page.drawSvgPath(symbols[kind],{x,y:pageHeight-top,scale,color});
    if(kind==='eye'){page.drawCircle({x:x+16*scale,y:pageHeight-top-16*scale,size:7*scale,color:paper});page.drawCircle({x:x+16*scale,y:pageHeight-top-16*scale,size:3*scale,color});}
    if(kind==='mask')for(const dx of [10,22])page.drawCircle({x:x+dx*scale,y:pageHeight-top-13*scale,size:3*scale,color:paper});
    if(kind==='book')page.drawLine({start:{x:x+16*scale,y:pageHeight-top-8*scale},end:{x:x+16*scale,y:pageHeight-top-26*scale},thickness:scale,color:paper});
  }
  function combatHeading(label,x,top,kind,size=9){
    emblem(kind,x,top,kind==='shield'?.2:.38);draw(label,x+18,top,size,bold,red);
    if(kind==='skull')for(const dx of [4,8])page.drawCircle({x:x+dx,y:pageHeight-top-5,size:1.1,color:paper});
  }
  function vitalRow(top,width){
    const entries=[['hpMax','MAXIMUM HP',c.hpMax,'heart'],['hpCurrent','CURRENT HP',c.hpCurrent,'heart'],['hpTemp','TEMPORARY HP',c.hpTemp,'heart'],['armorClass','ARMOR / AC *',auto('armorClass'),'shield'],['initiative','INITIATIVE *',auto('initiative'),'bolt'],['speed','SPEED *',auto('speed'),'boot']];
    const w=(width-50)/6;
    entries.forEach(([key,label,value,kind],i)=>{
      const x=36+i*(w+10),cx=x+w/2,health=kind==='heart';
      draw(label,cx-bold.widthOfTextAtSize(label,6.5)/2,top,6.5,bold,health?red:gray);
      const fill=health?rgb(.965,.915,.86):paper;
      if(health||kind==='shield')page.drawSvgPath(symbols[kind],{x:cx-28,y:pageHeight-top-12,scale:.875,color:fill,borderColor:health?red:ink,borderWidth:1.1});
      else{
        page.drawRectangle({x:cx-34,y:pageHeight-top-50,width:68,height:37,color:paper,borderColor:line,borderWidth:.6});
        emblem(kind,cx-28,top+20,kind==='bolt'?.65:.6,ink);
      }
      const f=form.createTextField(key),fw=health||kind==='shield'?34:38,fx=health||kind==='shield'?cx-fw/2:cx-5;
      f.setText(blank?'':text(value));f.setAlignment(1);
      f.addToPage(page,{x:fx,y:pageHeight-top-40,width:fw,height:18,borderWidth:0,backgroundColor:fill,font,textColor:ink});f.setFontSize(16);
      f.acroField.dict.set(PDFName.of('TU'),PDFHexString.fromText(label.replace(' *','')+(calculatedFieldNames.includes(key)?' - calculated automatically':' - editable')));
    });
  }
  function abilityCard(a,x,top,width){
    const kind={Strength:'fist',Dexterity:'feather',Constitution:'heart',Intelligence:'book',Wisdom:'eye',Charisma:'mask'}[a];
    page.drawSvgPath(`M0 0 L${width-7} 0 L${width} 7 L${width} 67 L0 67 Z`,{x,y:pageHeight-top,color:paper,borderColor:line,borderWidth:.7});
    emblem(kind,x+5,top+4,kind==='heart'?.22:.35);
    draw(a.toUpperCase(),x+19,top+5,6.4,bold,red);
    page.drawLine({start:{x:x+5,y:pageHeight-top-19},end:{x:x+width-5,y:pageHeight-top-19},thickness:.5,color:line});
    draw('SCORE',x+6,top+24,6,bold,gray);draw('MOD *',x+width-32,top+24,6,bold,gray);
    page.drawCircle({x:x+width-20,y:pageHeight-top-49,size:15.5,borderColor:line,borderWidth:.7,color:paper});
    for(const [key,value,left,w,size] of [[a.toLowerCase(),c[a.toLowerCase()],x+4,width-43,18],[a.toLowerCase()+'_mod',auto(a.toLowerCase()+'_mod'),x+width-32,24,12]]){
      const f=field(key,'',value,left,top+(key.endsWith('_mod')?26:23),w,key.endsWith('_mod')?18:24,false,size,false,{borderWidth:0,backgroundColor:paper});f.setAlignment(1);
      f.acroField.dict.set(PDFName.of('TU'),PDFHexString.fromText(a+(key.endsWith('_mod')?' modifier - calculated automatically':' score - editable')));
    }
  }
  function skillBand(x,top,width,index,height=25){
    if(index%2===0)page.drawRectangle({x:x-4,y:pageHeight-top-height+5,width:width+8,height,color:rgb(.91,.875,.79),opacity:.48});
    page.drawLine({start:{x:x-4,y:pageHeight-top-height+5},end:{x:x+width+4,y:pageHeight-top-height+5},thickness:.25,color:line});
  }
  function referenceDossier(){
    const width=pageWidth-72,gap=16,cw=(width-gap)/2,bottom=pageHeight-52,size=9.5,lineHeight=size*1.2;
    let tops;
    const newPage=(first=false)=>{addPage(first?'Field abilities':'Field abilities / continued','FIGHTER / '+(blank?'SUBCLASS':c.subclass.toUpperCase())+' / GIFTS & SCARS');tops=[115,115];};
    newPage(true);
    const choiceWidth=landscape?350:280,small=(width-choiceWidth-20)/2;
    field('fightingStyleReference','Chosen Fighting Style',[c.styleRule==='None / custom'?'':c.styleRule,c.fightingStyle].filter(Boolean).join(' - '),36,115,choiceWidth,40,true,8);
    field('masteryMax','Mastery choices / max *',auto('masteryMax'),36+choiceWidth+10,115,small,40);
    field('secondWindHealing','Second Wind healing *',auto('secondWindHealing'),36+choiceWidth+20+small,115,small,40);
    field('masteries','Chosen mastery weapons / properties',c.masteries,36,180,cw,48,true,9);
    field('feats','Chosen feats / ASIs / benefits',c.feats,36+cw+gap,180,cw,48,true,9);
    tops=[257,257];
    if(blank){field('fighter_reference_notes','Fighter / subclass descriptions and manual notes','',36,257,width,bottom-271,true);return;}
    const features=db.records.filter(r=>(r.subclass===c.subclass&&r.level&&r.level<=level)||(['Traits','Quirks'].includes(r.category)&&[c.trait,c.trait2,c.quirk].includes(r.title)));
    const cards=[...fighterFeatures({...c,masteries:''}).map(r=>({...r,key:r.id,meta:`FIGHTER / LV ${r.level} / SRD 5.2.1, PP. 47-48`,kind:'swords',color:ink})),...features.filter(r=>r.level).concat(features.filter(r=>!r.level)).map(r=>({...r,key:'reference_'+r.id,meta:`${r.level?c.subclass.toUpperCase()+' / LV '+r.level:r.category.toUpperCase()} / PHB P. ${r.page}${r.note?.startsWith('Campaign update')?' / UPDATED':''}`,kind:r.level?'flame':'feather',color:r.level?red:gray}))];
    for(const card of cards){
      const titleLines=wrap(card.title,cw-38,11),metaLines=wrap(card.meta,cw-16,6.2),header=12+titleLines.length*13+metaLines.length*8;
      const lines=wrap(card.body,cw-36,size),maxLines=Math.max(1,Math.floor((bottom-115-header-25)/lineHeight));
      for(let start=0,part=0;start<lines.length;start+=maxLines,part++){
        const chunk=lines.slice(start,start+maxLines),h=Math.ceil(chunk.length*lineHeight)+13,total=header+h+10;
        let col=tops[0]<=tops[1]?0:1;
        if(tops[col]+total>bottom){newPage();col=0;}
        const top=tops[col],x=36+col*(cw+gap);
        page.drawSvgPath(`M0 0 L${cw-7} 0 L${cw} 7 L${cw} ${total-6} L7 ${total-6} L0 ${total-13} Z`,{x,y:pageHeight-top,color:paper,borderColor:line,borderWidth:.6});
        page.drawSvgPath(`M0 0 L${cw-7} 0 L${cw} 7 L${cw} ${header} L0 ${header} Z`,{x,y:pageHeight-top,color:card.color});
        emblem(card.kind,x+7,top+7,.32,paper);
        titleLines.forEach((line,i)=>draw(line,x+24,top+5+i*13,11,serif,paper));
        metaLines.forEach((line,i)=>draw(line+(part?' / CONT.':''),x+8,top+8+titleLines.length*13+i*8,6.2,font,paper));
        const key=part?card.key+'_continued_'+part:card.key;
        const f=field(key,'',chunk.join('\n'),x+8,top+header-12,cw-16,h,true,size,false,{borderWidth:0,backgroundColor:paper});
        f.acroField.dict.set(PDFName.of('TU'),PDFHexString.fromText(card.title+' - '+card.meta+' - editable description'));
        tops[col]=top+total+8;
      }
    }
  }
  function row(items,top,height=30){const gap=10,w=(540-gap*(items.length-1))/items.length;items.forEach(([key,label,value],i)=>field(key,label,value,36+i*(w+gap),top,w,height));}
  function check(key,label,checked,x,top){const f=form.createCheckBox(key);f.addToPage(page,{x,y:pageHeight-top-11,width:11,height:11,borderWidth:.6,borderColor:line,backgroundColor:white});if(!blank&&checked)f.check();draw(label,x+18,top,9);}
  const credit='This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.';
  function select(spec,x,t,width){draw(spec.label.toUpperCase(),x,t,7,bold,gray);const f=form.createDropdown(spec.key);f.addOptions(spec.options);f.select(blank?spec.value:String(c[spec.key]??spec.value));f.addToPage(page,{x,y:pageHeight-t-14-25,width,height:25,font,textColor:ink,backgroundColor:white,borderColor:line,borderWidth:.5});f.setFontSize(8);f.acroField.dict.set(PDFName.of('TU'),PDFHexString.fromText(spec.label+' - editable selection'));}
  if(landscape){drawLandscapeSheet({c,blank,level,auto,addPage,field,check,draw,wrap,select,vitalRow,combatHeading,abilityCard,skillBand,referenceDossier,abilities,skills,skillAbilities,conditionalGroups,fighterFeatures,weaponRows,db,font,bold,serif,red,gray,credit});}else{
  // Combat stays together. Descriptions and training have their own pages.
  addPage('Ready for the field','COMBAT / ATTACKS, DEFENSES & RESOURCES');
  row([['name','Company name',c.name],['player','Player',c.player],['penisSize','Penis size (%)',c.penisSize],['ballSize','Ball size (%)',c.ballSize]],115);
  row([['subclass','Subclass',c.subclass],['level','Fighter level',c.level],['ticks','Ticks',c.ticks],['unit','Fist / Finger / Knuckle',c.companyUnit]],162);
  vitalRow(219,540);
  row([['strAttack','STR attack *',auto('strAttack')],['dexAttack','DEX attack *',auto('dexAttack')],['attacksPerAction','Attacks / action *',auto('attacksPerAction')],['saveDC','Subclass DC *',auto('saveDC')],['hitDie','HP die *',auto('hitDie')],['hitDice','Hit dice left',c.hitDice]],283,26);
  combatHeading('DEATH CHECKS',36,338,'skull');
  draw('Success',36,359,8,font,gray);draw('Failure',166,359,8,font,gray);
  for(let i=0;i<3;i++){check(`death_success_${i+1}`,'',Number(c.deathSuccesses)>i,87+i*21,359);check(`death_failure_${i+1}`,'',Number(c.deathFailures)>i,213+i*21,359);}
  field('deathPenalty','Death adj. *',auto('deathPenalty'),290,341,76,24);
  field('luck','Session Luck',c.luck,376,341,95,24);field('chips','Chips',c.chips,481,341,95,24);
  combatHeading('FIGHTER RESOURCES',36,396,'flame');draw('Track remaining uses; a new export does not spend or restore them.',197,398,7,font,gray);
  const resources=[['secondWind','Second Wind','secondWindMax','Short Rest: +1 / Long Rest: all',1],['actionSurge','Action Surge','actionSurgeMax','Short or Long Rest: all',2],['indomitable','Indomitable','indomitableMax','Long Rest: all',9]].filter(r=>blank||level>=r[4]);
  resources.forEach(([key,label,max,recharge],i)=>{const x=36+i*184;draw(label,x,420,11,bold);field(key,'Left',c[key],x,439,65,24);field(max,'Max *',auto(max),x+74,439,65,24);draw(recharge,x,482,7,font,gray);});
  combatHeading('WEAPONS',36,500,'swords');
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
  abilities.forEach((a,i)=>abilityCard(a,36+i*92,115,82));
  field('proficiency','Proficiency *',auto('proficiency'),36,211,100,26);
  combatHeading('SAVING THROWS',157,211,'shield');draw('Tick proficiency. ADJ adds other modifiers.',157,233,9,font,gray);
  abilities.forEach((a,i)=>{const extra=String(c.extraSaves||'').toLowerCase().match(/[a-z]+/g)||[];const trained=c.save1===a||c.save2===a||extra.includes(a.toLowerCase())||extra.includes(a.slice(0,3).toLowerCase());const x=36+i*92;check(`save_${a}_trained`,a.slice(0,3),trained,x,272);field(`save_${a}_bonus`,'Total *',auto(`save_${a}_bonus`),x,298,45,25,false,12);field(`save_${a}_misc`,'Adj.',c[`save_${a}_misc`]||'',x+50,298,32,25,false,9);});
  combatHeading('SKILLS',36,361,'feather',11);draw('P = proficiency / E = expertise / ADJ = other modifiers',111,364,8,font,gray);
  for(let col=0;col<2;col++){const x=36+col*278;draw('P',x+2,391,7,bold,gray);draw('E',x+149,391,7,bold,gray);draw('ADJ',x+174,391,7,bold,gray);draw('TOTAL',x+216,391,7,bold,gray);}
  skills.forEach((s,i)=>{const col=i<9?0:1,n=i%9,x=36+col*278,t=414+n*28;skillBand(x,t,255,n);check(`skill_${s}`,s,c.skills.includes(s),x,t);draw('('+abilities[skillAbilities[i]][0].toLowerCase()+')',x+22+font.widthOfTextAtSize(s,9),t+1,7,font,gray);check(`skill_${s}_expert`,'',(c.expertise||[]).includes(s),x+147,t);for(const [key,value,offset,width] of [[`skill_${s}_misc`,c[`skill_${s}_misc`]||'',173,28],[`skill_${s}_bonus`,auto(`skill_${s}_bonus`),213,42]]){const f=form.createTextField(key);f.setText(blank&&!calculatedFieldNames.includes(key)?'':String(value));f.addToPage(page,{x:x+offset,y:pageHeight-t-16,width,height:21,borderWidth:.4,borderColor:line,backgroundColor:calculatedFieldNames.includes(key)?paper:white,font,textColor:ink});f.setFontSize(10);f.acroField.dict.set(PDFName.of('TU'),PDFHexString.fromText(s+' ('+abilities[skillAbilities[i]]+')'+(key.endsWith('_misc')?' - extra modifier':' - calculated total')));}});
  draw('(s) Strength / (d) Dexterity / (i) Intelligence / (w) Wisdom / (c) Charisma',36,670,8,font,gray);
  row([['stealthRoll','Stealth roll *',auto('stealthRoll')],['passivePerception','Passive Perception *',auto('passivePerception')],['lingerHpBonus','Lingerer HP / add to HP',auto('lingerHpBonus')],['luckPenalty','Solo Luck adj. *',auto('luckPenalty')]],698,24);

  referenceDossier();

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
  while(index<overflow.length){const item=overflow[index++];const all=item.lines.join('\n');const rows=wrap(all,pageWidth-92,10),chunkSize=Math.floor((pageHeight-276)/12);for(let start=0,part=1;start<rows.length;start+=chunkSize,part++){addPage('Continued field notes',`${item.label.toUpperCase()} / CONTINUATION ${part}`,item.configuration);field(`${item.key}_continued_${part}`,`${item.label} (continued)`,rows.slice(start,start+chunkSize).join('\n'),36,120,pageWidth-72,pageHeight-242,true,10);}}
  // Move existing page objects, preserving form-widget and bookmark references.
  sections.sort((a,b)=>Number(a.configuration)-Number(b.configuration));
  sections.forEach(({page:target},i)=>{const current=pdf.getPages().indexOf(target);if(current!==i){pdf.removePage(current);pdf.insertPage(i,target);}});
  pdf.getPages().forEach((p,i)=>{
    p.drawText(String(i+1).padStart(2,'0'),{x:pageWidth-66,y:pageHeight-55,size:15,font:serif,color:gold});
    p.drawText(`${i+1} / ${pdf.getPageCount()}`,{x:pageWidth-68,y:19,size:7,font,color:gray});
  });
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
  for(const f of form.getFields()){const da=f.acroField.dict.get(PDFName.of('DA'));if(da)for(const widget of f.acroField.getWidgets()){widget.dict.set(PDFName.of('DA'),da);widget.dict.set(PDFName.of('Q'),f.acroField.dict.get(PDFName.of('Q'))||pdf.context.obj(0));}}
  // Native PDF bookmarks make long ability sections easy to reach on a tablet.
  const outline=pdf.context.obj({Type:'Outlines',Count:sections.length});
  const outlineRef=pdf.context.register(outline);
  const entries=sections.map(({title,page})=>pdf.context.obj({Title:PDFHexString.fromText(title),Parent:outlineRef,Dest:[page.ref,'Fit']}));
  const refs=entries.map(e=>pdf.context.register(e));
  entries.forEach((e,i)=>{if(i)e.set(PDFName.of('Prev'),refs[i-1]);if(i+1<refs.length)e.set(PDFName.of('Next'),refs[i+1]);});
  outline.set(PDFName.of('First'),refs[0]);outline.set(PDFName.of('Last'),refs.at(-1));pdf.catalog.set(PDFName.of('Outlines'),outlineRef);
  return pdf.save();
}
