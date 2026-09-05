import {readFile,writeFile,mkdir} from 'node:fs/promises';
import vm from 'node:vm';
import {createCharacterPDF} from '../pdf-generator.js';
import {defaults} from '../character.js';
vm.runInThisContext(await readFile(new URL('../vendor/pdf-lib.min.js',import.meta.url),'utf8'));
const texture=await readFile(new URL('../assets/art/rulebook-parchment.jpg',import.meta.url));
globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>texture});
const db=JSON.parse(await readFile(new URL('../data/rules.json',import.meta.url),'utf8'));
await mkdir('tmp/qa',{recursive:true});
const snake={...defaults(),name:'Rook',subclass:'Snake',level:7,strength:16,dexterity:18,constitution:14,intelligence:12,wisdom:14,charisma:9,trait:'Fast',trait2:'Lingerer',quirk:'Star-Crossed',skills:['Stealth','Perception','Athletics','Survival','Insight'],save1:'Strength',save2:'Dexterity',hpMax:'68',ac:'15',tools:'Leatherworker’s tools',weapons:'Longbow / +7 to hit / 1d8+4 piercing\nShortsword / +7 to hit / 1d6+4 piercing',armor:'Studded leather',resources:'Slayer: +1d8 once per turn against a wounded target.',history:'The name in the Annals is Rook. The name before that stays buried.',notes:'First round: initiative advantage; speed +20 ft. against the battlefield. Check Ambusher in the attached reference.'};
for(const [file,c,options] of [
 ['output/pdf/black-company-universal-editable.pdf',defaults(),{blank:true}],
 ['tmp/qa/rook-final.pdf',snake,{}],
 ['tmp/qa/rook-final-variant.pdf',snake,{}],
]){await writeFile(file,await createCharacterPDF(c,db,options));console.log(file);}
