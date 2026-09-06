// Concise adaptations of SRD 5.2.1, pp. 47–48 (CC BY 4.0).
// Campaign creation rules and subclass milestones override the core Fighter.
import {calculateBonuses} from './sheet-math.js?v=conditions1';

export function fighterFeatures(c) {
  const level=Number(c.level);
  if(!Number.isInteger(level)||level<1||level>20)return [];
  const v=calculateBonuses(c),features=[];
  const add=(id,title,unlock,body)=>{if(level>=unlock)features.push({id:'fighter_'+id,title,level:unlock,body});};
  add('fighting_style','Fighting Style',1,'Choose a Fighting Style feat. You may replace that choice whenever you gain a Fighter level. Record its benefits and apply any equipment bonuses yourself.'+(c.fightingStyle?'\nChosen style: '+c.fightingStyle:''));
  add('second_wind','Second Wind',1,`As a Bonus Action, regain 1d10 + your Fighter level hit points (${v.secondWindHealing} at this level). You have ${v.secondWindMax} uses. A Short Rest restores one expended use; a Long Rest restores all uses.`);
  add('weapon_mastery','Weapon Mastery',1,`You can use the mastery properties of ${v.masteryMax} chosen kinds of Simple or Martial weapons. After a Long Rest, you may replace one of those weapon choices.`+(c.masteries?'\nChosen weapons / properties: '+c.masteries:''));
  add('action_surge','Action Surge',2,`On your turn, take one additional action, other than the Magic action. You have ${v.actionSurgeMax} ${v.actionSurgeMax===1?'use':'uses'}, restored by a Short or Long Rest.${level>=17?' You may use Action Surge only once on a turn.':''}`);
  add('tactical_mind','Tactical Mind',2,'After failing an ability check, you may spend one Second Wind use to add 1d10 to the check instead of healing. If the check still fails, that use is not spent.');
  const asi=[4,6,8,12,14,16].filter(n=>n<=level);
  add('ability_score_improvement','Ability Score Improvement / Feats',4,`At each of Fighter levels ${asi.join(', ')}, gain the Ability Score Improvement feat or another feat for which you qualify. These are separate choices; enter the resulting scores on the website before exporting.`);
  add('extra_attack',level>=20?'Three Extra Attacks':level>=11?'Two Extra Attacks':'Extra Attack',level>=20?20:level>=11?11:5,`When you take the Attack action on your turn, you can make ${v.attacksPerAction} attacks instead of one. This does not add attacks to a Bonus Action or Reaction.`);
  add('tactical_shift','Tactical Shift',5,'When you activate Second Wind as a Bonus Action, you may also move up to half your Speed without provoking Opportunity Attacks.');
  add('indomitable','Indomitable',9,`After failing a saving throw, you may reroll it and add your Fighter level (+${level}) to the new roll. You must use the new result. You have ${v.indomitableMax} ${v.indomitableMax===1?'use':'uses'}, restored by a Long Rest.`);
  add('tactical_master','Tactical Master',9,'For an attack with a weapon whose mastery property you can use, you may replace that property with Push, Sap, or Slow for that attack.');
  add('studied_attacks','Studied Attacks',13,'After you miss a creature with an attack roll, you have Advantage on your next attack roll against that creature before the end of your next turn.');
  add('epic_boon','Epic Boon',19,'Choose an Epic Boon feat, or another feat for which you qualify. Record the chosen feat and its benefits with your other feat choices.');
  return features.sort((a,b)=>a.level-b.level);
}

/** Existing free-text loadouts remain intact; only explicit slash-separated rows migrate. */
export function weaponRows(c) {
  const legacy=String(c.weapons||'').split('\n').filter(s=>s.trim());
  return Array.from({length:3},(_,i)=>{
    const prefix='attack'+(i+1),parts=(legacy[i]||'').split(/\s*\/\s*/);
    if(['Name','Bonus','Damage','Mastery'].some(k=>c[prefix+k]))return ['Name','Bonus','Damage','Mastery'].map(k=>c[prefix+k]||'');
    return parts.length>=3?[parts[0],parts[1],parts[2],parts.slice(3).join(' / ')]:['','','',''];
  });
}
