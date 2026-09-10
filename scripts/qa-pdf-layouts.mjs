import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try{
 const page=await browser.newPage({viewport:{width:1180,height:820},acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/#sheet');await page.locator('#name').fill('Layout check');
 await page.locator('#penisSize').fill('37');await page.locator('#ballSize').fill('64');
 await page.locator('#ticks').fill('4');await page.locator('#level').fill('5');await page.locator('#strength').fill('18');
 for(const orientation of ['portrait','landscape']){
  await page.locator('#pdf-orientation').selectOption(orientation);
  const pending=page.waitForEvent('download');await page.locator('#download-pdf').click();const d=await pending;
  const file='tmp/qa/browser-'+orientation+'.pdf';await d.saveAs(file);
  const result=await page.evaluate(async bytes=>{const pdf=await PDFLib.PDFDocument.load(new Uint8Array(bytes)),form=pdf.getForm();return {ticks:form.getTextField('ticks').getText(),sizes:pdf.getPages().map(p=>p.getSize()),penis:form.getTextField('penisSize').getText(),balls:form.getTextField('ballSize').getText(),str:form.getTextField('strength_mod').getText()};},[...await readFile(file)]);
  assert(result.sizes.every(s=>s.width===(orientation==='landscape'?792:612)&&s.height===(orientation==='landscape'?612:792)));
  assert.equal(result.ticks,'4');assert.equal(result.penis,'37');assert.equal(result.balls,'64');assert.equal(result.str,'+4');
  assert.equal(d.suggestedFilename().includes('-landscape-'),orientation==='landscape');
 }
 await page.reload();assert.equal(await page.locator('#ticks').inputValue(),'4');assert.equal(await page.locator('#penisSize').inputValue(),'37');assert.equal(await page.locator('#ballSize').inputValue(),'64');
 await page.locator('#pdf-orientation').selectOption('landscape');
 const pending=page.waitForEvent('download');await page.locator('#blank-pdf').click();const d=await pending;await d.saveAs('tmp/qa/browser-blank-landscape.pdf');assert.match(d.suggestedFilename(),/landscape/);
 for(const size of [{width:820,height:1180},{width:1180,height:820},{width:390,height:844}]){await page.setViewportSize(size);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('.pdf-orientation').screenshot({path:`tmp/qa/pdf-choice-${size.width}.png`});}
 assert.deepEqual(errors,[]);console.log('Browser passed: both orientations, editable ticks and percentage values, saved draft, blank landscape and responsive download selector.');
}finally{await browser.close();}
