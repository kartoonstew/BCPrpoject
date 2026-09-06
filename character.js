import {conditionalDefaults,conditionalGroups} from './conditional-rules.js?v=conditions1';
import {calculateBonuses} from './sheet-math.js?v=conditions1';
export const abilities = ['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'];
export const skills = ['Acrobatics','Animal Handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival'];
export const skillAbilities = [1,4,3,0,5,3,4,5,3,4,3,4,5,5,3,1,1,4];
export const defaults = () => ({...conditionalDefaults,name:'',player:'',subclass:'Sawbones',level:1,companyUnit:'',pronouns:'',trait:'',trait2:'',quirk:'',traitChoices:'',save1:'Strength',save2:'Constitution',extraSaves:'',skills:[],tools:'',languages:'Khato, Black Cant',strength:10,dexterity:10,constitution:10,intelligence:10,wisdom:10,charisma:10,hpMax:'',hpCurrent:'',hpTemp:'',ac:'',speed:30,initiative:'',hitDice:'',luck:'',chips:'',gold:200,secondWind:'',actionSurge:'',indomitable:'',resources:'',weapons:'',armor:'',equipment:'',magicItems:'',notes:'',history:'',allies:'',featureNotes:'',fightingStyle:'',masteries:'',feats:'',attunedItems:'',attack1Name:'',attack1Bonus:'',attack1Damage:'',attack1Mastery:'',attack2Name:'',attack2Bonus:'',attack2Damage:'',attack2Mastery:'',attack3Name:'',attack3Bonus:'',attack3Damage:'',attack3Mastery:'',deathSuccesses:0,deathFailures:0});
export const modifier = score => Math.floor((Number(score)-10)/2);
export const signed = value => value>=0?`+${value}`:`${value}`;
export const proficiency = level => 2+Math.floor((Number(level)-1)/4);
export function derived(c){const v=calculateBonuses(c);return {pb:v.proficiency,dc:v.saveDC,hitDie:v.hitDie,heavy:['Sawbones','Bump','Deacon','Salt'].includes(c.subclass),initiative:v.initiative,speed:v.speed};}
export function validate(c){const messages=[];if(!c.trait)messages.push('Choose one Trait.');if(c.trait2&&!c.quirk)messages.push('A second Trait requires a Quirk.');if(c.trait2&&c.trait2===c.trait)messages.push('Choose two different Traits.');if(Number(c.level)===1&&abilities.some(a=>Number(c[a.toLowerCase()])>16))messages.push('At level 1, the book’s ability-score increases cannot raise a score above 16. Confirm higher scores with your DM.');const expected=5+(c.trait==='Skill Monkey'||c.trait2==='Skill Monkey'?2:0);if(c.skills.length!==expected)messages.push(`Choose ${expected} skill proficiencies (${c.skills.length} selected).`);if(!c.tools.trim())messages.push('Record one tool proficiency.');return messages;}
export function sanitizeCharacter(input,classes,traits,quirks){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('This is not a character file.');
  const out=defaults();
  for(const key of Object.keys(out)){if(key==='skills'){out.skills=Array.isArray(input.skills)?[...new Set(input.skills.filter(s=>skills.includes(s)))]:[];continue;}if(typeof out[key]==='number'){const n=Number(input[key]);if(Number.isFinite(n))out[key]=n;}else if(typeof input[key]==='string'||typeof input[key]==='number')out[key]=String(input[key]).slice(0,12000);}
  if(!classes.includes(out.subclass))out.subclass=classes[0];
  for(const key of ['trait','trait2'])if(!traits.includes(out[key]))out[key]='';
  if(!quirks.includes(out.quirk))out.quirk='';
  out.level=Math.max(1,Math.min(20,Math.floor(out.level)));
  for(const a of abilities){const k=a.toLowerCase();out[k]=Math.max(1,Math.min(30,Math.floor(out[k])));}
  if(!['Strength','Intelligence','Charisma'].includes(out.save1))out.save1='Strength';
  if(!['Constitution','Dexterity','Wisdom'].includes(out.save2))out.save2='Constitution';
  out.speed=Math.max(0,Math.min(200,out.speed));
  for(const k of ['deathSuccesses','deathFailures'])out[k]=Math.max(0,Math.min(3,Math.floor(out[k])));
  for(const g of conditionalGroups)for(const f of g.fields)if(f.options&&!f.options.includes(String(out[f.key])))out[f.key]=f.value;
  return out;
}
