import {sceneRecaps} from './campaign-recaps.js?v=recaps1';
/** Editorial scene boundaries. Original records remain unchanged in data/campaign.json. */
export const sceneDefinitions = [
  {
    "id": "crossing-caras",
    "title": "Crossing into Caras",
    "summary": "The Knuckle weighs the bridge, disguises, scouting, and the merits of walking into the city openly.",
    "first": "ic-1473411767206940895",
    "last": "ic-1478033699164524554"
  },
  {
    "id": "after-telembor",
    "title": "After the fight at Telembor",
    "summary": "Among the fallen ancient Brothers, the survivors question the seal, the strange Annals, and the price of getting answers.",
    "first": "ic-1480367445389738096",
    "last": "ic-1484153045335019610"
  },
  {
    "id": "road-orders",
    "title": "Back on the road",
    "summary": "The Knuckle leaves Telembor, rests, and receives new orders when Pussy catches up with them.",
    "first": "ic-1485770864581542008",
    "last": "ic-1491215168544444530"
  },
  {
    "id": "four-towers",
    "title": "Arrival at the Four Towers",
    "summary": "Muirthemne swallows the newcomers. From their lodgings, the Brothers plan how to find quarters and contacts for the Company.",
    "first": "ic-1491215358978166835",
    "last": "ic-1491903066172297277"
  },
  {
    "id": "qasims-courtyard",
    "title": "In Qasim’s courtyard",
    "summary": "The moneylender offers hospitality and help with quarters. His request for a small favor draws the Brothers into an arrangement.",
    "first": "ic-1492590279465898315",
    "last": "ic-1494452835025420329"
  },
  {
    "id": "unopened-letter",
    "title": "The unopened letter",
    "summary": "The Brothers work out how to make a discreet delivery without breaking Qasim’s instructions. Twitch makes the drop.",
    "first": "ic-1494464581798723664",
    "last": "ic-1494887060941570310"
  },
  {
    "id": "hooded-man",
    "title": "The hooded man",
    "summary": "A second favor tests the Knuckle’s appetite for uncertainty. Bumble takes the escort job and reports what he found.",
    "first": "ic-1494887207272710164",
    "last": "ic-1501268610549813407"
  },
  {
    "id": "bassams-walk",
    "title": "A walk with Bassam",
    "summary": "The olive-oil merchant invites the Brothers to accompany him. Their stroll through the Rhish quarter becomes a public display of his influence.",
    "first": "ic-1502433616355917885",
    "last": "ic-1518243600113205368"
  },
  {
    "id": "woman-bridge",
    "title": "The woman on the bridge",
    "summary": "Bassam leads the Knuckle to a woman whose words mix Tonk, serpents, and warnings. Gallows asks how she knew to call for them.",
    "first": "ic-1518243712147128341",
    "last": "ic-1518801275817558168"
  },
  {
    "id": "tadpoles-tent",
    "title": "Questions in Tadpole’s tent",
    "summary": "Gallows and Prancer question the path laid out by the recovered Annals, the Collector’s remains, and the Captain’s intentions.",
    "first": "ic-1522027976454307862",
    "last": "ic-1523463938501775483"
  },
  {
    "id": "captains-coin",
    "title": "The Captain and the coin",
    "summary": "The Old Man answers the questions himself. A coin, an old campaign, and a hard lesson in Company loyalty leave Gallows shaken.",
    "first": "ic-1526343747401679008",
    "last": "ic-1527330330682593452"
  },
  {
    "id": "reading-chalk",
    "title": "Reading Chalk by the fire",
    "summary": "After weeks of reflection, Gallows listens as the older Annals are read aloud. The words land differently now.",
    "first": "ic-1541930604516475030",
    "last": "ic-1541931078476894350"
  }
];
export function buildScenes(entries){
 const posts=entries.filter(e=>e.kind==='ic');
 return sceneDefinitions.map((s,i)=>{
  const start=posts.findIndex(p=>p.id===s.first),end=posts.findIndex(p=>p.id===s.last);
  if(start<0||end<start)throw new Error('Missing scene boundary: '+s.id);
  const messages=posts.slice(start,end+1);
  return {...s,recap:sceneRecaps[s.id],kind:'scene',number:i+1,published:messages[0].published,ended:messages.at(-1).published,posts:messages,authors:[...new Set(messages.map(p=>p.author))],voices:[...new Set(messages.filter(p=>!p.aside).map(p=>p.voice))],words:messages.reduce((n,p)=>n+p.body.split(/\s+/).filter(Boolean).length,0)};
 });
}
/** Keep groups faithful to adjacency, including hidden asides and filing boundaries. */
export function groupSceneRecords(records){
 const groups=[];
 for(const record of records){const previous=groups.at(-1);
  if(record.kind==='ic'&&previous?.kind==='messages'&&previous.author===record.author&&previous.aside===record.aside)previous.posts.push(record);
  else groups.push(record.kind==='ic'?{kind:'messages',author:record.author,aside:record.aside,posts:[record]}:{kind:'record',record});
 }
 return groups;
}
