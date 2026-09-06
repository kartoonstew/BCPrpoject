import {cp,mkdir} from 'node:fs/promises';
const out=new URL('../dist/',import.meta.url);
await mkdir(out,{recursive:true});
for(const path of ['index.html','styles.css','app.js','field-desk.js','field-desk.css','character.js','pdf-generator.js','sheet-math.js','conditional-rules.js','fighter-features.js','pdf-wear.js','assets','vendor','data','docs','output/pdf','BC PHB 1.14.pdf'])await cp(new URL('../'+path,import.meta.url),new URL(path,out),{recursive:true});
console.log('Static site prepared in dist/.');
