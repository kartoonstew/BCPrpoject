import {abilities, skills, skillAbilities, modifier, signed, derived} from './character.js';

/** Browser-only AcroForm generator. No network, backend, or flattened fields. */
export async function createCharacterPDF(character, db, {blank=false}={}) {
  const {PDFDocument,StandardFonts,rgb}=globalThis.PDFLib;
  const pdf=await PDFDocument.create();
  pdf.setTitle('The Black Company - '+(blank?'Universal Service Record':character.name||'Brother Service Record'));
  pdf.setAuthor('The Black Company Field Manual');
  pdf.setSubject('Editable character sheet - Player’s Handbook v1.14');
  const font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold),serif=await pdf.embedFont(StandardFonts.TimesRomanBold);
  const form=pdf.getForm(),c=character,d=derived(c),overflow=[];
  const ink=rgb(.12,.14,.11),gray=rgb(.36,.38,.32),line=rgb(.65,.65,.59),paper=rgb(.975,.972,.95),white=rgb(1,1,1);
  let page;
  // Standard PDF fonts support Latin/Western European text. Fail explicitly
  // instead of silently discarding unsupported user characters.
  const text=s=>String(s??'').replace(/[‐‑–—]/g,'-').replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/\u2028|\u2029/g,'\n').replace(/\t/g,'  ');
  const draw=(s,x,top,size=10,f=font,color=ink)=>page.drawText(text(s),{x,y:792-top-size,size,font:f,color});
  function addPage(title,subtitle){page=pdf.addPage([612,792]);page.drawRectangle({x:0,y:706,width:612,height:86,color:ink});draw('THE BLACK COMPANY',36,23,10,bold,paper);draw(title,36,40,25,serif,paper);draw(subtitle,36,93,8,font,gray);draw('PLAYER’S HANDBOOK 1.14  /  EDITABLE SERVICE RECORD',36,766,7,font,gray);page.drawLine({start:{x:36,y:39},end:{x:576,y:39},color:line,thickness:.5});return page;}
  function wrap(value,width,size=10){const result=[];for(const para of text(value).split('\n')){let current='';for(let word of para.split(/ +/)){while(font.widthOfTextAtSize(word,size)>width){if(current){result.push(current);current='';}let count=1;while(count<word.length&&font.widthOfTextAtSize(word.slice(0,count+1),size)<=width)count++;result.push(word.slice(0,count));word=word.slice(count);}const candidate=current?`${current} ${word}`:word;if(font.widthOfTextAtSize(candidate,size)>width){result.push(current);current=word;}else current=candidate;}result.push(current);}return result;}
  function field(key,label,value,x,top,width,height=28,multiline=false,size=10){
    draw(label.toUpperCase(),x,top,7,bold,gray);
    const f=form.createTextField(key);let v=blank?'':text(value);
    if(multiline || font.widthOfTextAtSize(v.replace(/\n/g,' '),size)>width-20){f.enableMultiline();const rows=wrap(v,width-20,size),max=Math.max(1,Math.floor((height-12)/(size*1.2)));if(rows.length>max)overflow.push({label,key,lines:rows.slice(max),size});v=rows.slice(0,max).join('\n');}
    f.setText(v);f.addToPage(page,{x,y:792-top-14-height,width,height,borderWidth:.6,borderColor:line,backgroundColor:white,textColor:ink,font});f.setFontSize(size);
    return f;
  }
  function row(items,top,height=30){const gap=10,w=(540-gap*(items.length-1))/items.length;items.forEach(([key,label,value],i)=>field(key,label,value,36+i*(w+gap),top,w,height));}
  function check(key,label,checked,x,top){const f=form.createCheckBox(key);f.addToPage(page,{x,y:792-top-11,width:11,height:11,borderWidth:.6,borderColor:line,backgroundColor:white});if(!blank&&checked)f.check();draw(label,x+18,top,8);}
  addPage('A Brother of the Company','01 / IDENTITY, ABILITIES & FIELD READINESS');
  row([['name','Company name',c.name],['player','Player',c.player]],115);
  row([['subclass','Subclass',c.subclass],['level','Fighter level',c.level],['unit','Fist / Finger / Knuckle',c.companyUnit]],173);
  row(abilities.map(a=>[a.toLowerCase(),a,`${c[a.toLowerCase()]} (${signed(modifier(c[a.toLowerCase()]))})`]),233,36);
  row([['hpMax','Maximum HP',c.hpMax],['hpCurrent','Current HP',c.hpCurrent],['hpTemp','Temporary HP',c.hpTemp],['ac','Armor class',c.ac],['initiative','Initiative',c.initiative||signed(d.initiative)],['speed','Speed (ft)',d.speed]],303);
  row([['proficiency','Proficiency',signed(d.pb)],['saveDC','Subclass DC',d.dc],['hitDie','Hit point die',d.hitDie],['hitDice','Hit dice left',c.hitDice],['luck','Session Luck',c.luck],['chips','Chips',c.chips]],363);
  draw('SAVING THROWS',36,425,9,bold);
  abilities.forEach((a,i)=>{const trained=c.save1===a||c.save2===a||c.extraSaves.toLowerCase().split(/[,;/]+/).some(v=>v.trim()===a.toLowerCase());const x=36+i*92;check(`save_${a}_trained`,a.slice(0,3),trained,x,448);field(`save_${a}_bonus`,'Bonus',signed(modifier(c[a.toLowerCase()])+(trained?d.pb:0)),x,468,78,24);});
  draw('SKILL PROFICIENCIES',36,520,9,bold);draw('Bonuses below include proficiency. Apply situational modifiers separately.',36,537,7,font,gray);
  skills.forEach((s,i)=>{const col=i<9?0:1,n=i%9,x=36+col*278,t=558+n*18;check(`skill_${s}`,s,c.skills.includes(s),x,t);const f=form.createTextField(`skill_${s}_bonus`);f.setText(blank?'':signed(modifier(c[abilities[skillAbilities[i]].toLowerCase()])+(c.skills.includes(s)?d.pb:0)));f.addToPage(page,{x:x+205,y:792-t-13,width:40,height:15,borderWidth:.4,borderColor:line,backgroundColor:white,font,textColor:ink});f.setFontSize(8);});
  draw('Proficient saves: one of STR / INT / CHA, and one of CON / DEX / WIS.',36,730,7,font,gray);
  addPage('Steel, gifts & scars','02 / EQUIPMENT, TRAITS & RESOURCES');
  row([['trait','First Trait',c.trait],['trait2','Second Trait',c.trait2],['quirk','Quirk',c.quirk]],115);
  field('traitChoices','Trait choices, resistances & penalties',c.traitChoices,36,176,540,54,true);
  row([['tools','Tool proficiencies',c.tools],['languages','Languages',c.languages]],258);
  field('weapons','Weapons / attack bonus / damage / mastery',c.weapons,36,319,540,65,true);
  row([['armor','Armor & shield',c.armor],['magicItems','Magic items / durability / charges',c.magicItems]],417,35);
  field('equipment','Equipment & supplies',c.equipment,36,483,540,60,true);
  field('resources','Subclass resources / current & maximum',c.resources,36,574,540,49,true);
  row([['secondWind','Second Wind',c.secondWind],['actionSurge','Action Surge',c.actionSurge],['indomitable','Indomitable',c.indomitable],['gold','Gold remaining',c.gold]],666,26);
  draw('Training: simple and martial weapons; light and medium armor; shields.',36,724,7,font,gray);
  draw(blank?'Heavy armor training: Sawbones, Bump, Deacon, Salt.':`Heavy armor training: ${d.heavy?'Yes':'No'} (${c.subclass}).`,36,737,7,font,gray);
  addPage('A name in the Annals','03 / HISTORY, FIELD NOTES & ADDITIONAL FEATURES');
  field('pronouns','Pronouns / description',c.pronouns,36,115,540,28);
  field('history','Before the Company',c.history,36,174,540,90,true);
  field('allies','Brothers, bonds & enemies',c.allies,36,294,540,75,true);
  field('notes','Field notes / conditions / wounds',c.notes,36,399,540,100,true);
  field('featureNotes','Fighter features / masteries / other rules',c.featureNotes,36,529,540,100,true);
  draw('DEATH CHECKS',36,671,9,bold);
  for(let i=0;i<3;i++){check(`death_success_${i+1}`,i===0?'Successes':'',Number(c.deathSuccesses)>i,36+i*91,693);check(`death_failure_${i+1}`,i===0?'Failures':'',Number(c.deathFailures)>i,318+i*91,693);}
  draw('Use your table’s death-check procedure. The booklet does not define the full procedure.',36,731,7,font,gray);
  const features=blank?[]:db.records.filter(r=>(r.subclass===c.subclass&&r.level&&r.level<=Number(c.level))||(['Traits','Quirks'].includes(r.category)&&[c.trait,c.trait2,c.quirk].includes(r.title)));
  if(features.length){addPage(`${c.subclass} / Field reference`,'04 / UNLOCKED SUBCLASS FEATURES, TRAITS & QUIRKS');let top=119;for(const r of features){const rows=wrap(r.body,528,9),height=Math.ceil(rows.length*10.8)+20;if(top+height+45>742){addPage(`${c.subclass} / Field reference`,'CONTINUED / SOURCE TEXT FROM PLAYER’S HANDBOOK 1.14');top=119;}field(`reference_${r.id}`,`${r.title}${r.level?' / Level '+r.level:''} / PHB p. ${r.page}`,r.body,36,top,540,height,true,9);top+=height+40;}}
  // Print overflow on additional editable pages rather than clipping long notes.
  let index=0;
  while(index<overflow.length){const item=overflow[index++];const all=item.lines.join('\n');const rows=wrap(all,528,10);for(let start=0,part=1;start<rows.length;start+=43,part++){addPage('Continued field notes',`${item.label.toUpperCase()} / CONTINUATION ${part}`);field(`${item.key}_continued_${part}`,`${item.label} (continued)`,rows.slice(start,start+43).join('\n'),36,120,540,550,true,10);}}
  pdf.getPages().forEach((p,i)=>p.drawText(`${i+1} / ${pdf.getPageCount()}`,{x:544,y:19,size:7,font,color:gray}));
  form.updateFieldAppearances(font);
  return pdf.save();
}
