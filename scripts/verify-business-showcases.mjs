import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {validateMetadata,validateDeck} from './content.mjs';
const studio=resolve('..','dist','presentation-studio.html');
const browser=await chromium.launch({headless:true});
try{for(const id of ['ember-and-salt','common-ground-realty','after-dark-city-in-light']){
 const dir=resolve('submissions',id),file=resolve(dir,'presentation.json');
 const raw=JSON.parse(await readFile(file,'utf8')),meta=JSON.parse(await readFile(resolve(dir,'metadata.json'),'utf8'));
 validateMetadata(meta,id,JSON.parse(await readFile('config.json','utf8')).categories);validateDeck(raw,id);
 const context=await browser.newContext({viewport:{width:1920,height:1080}});await context.setOffline(true);
 const page=await context.newPage();page.setDefaultTimeout(15000);
 await page.goto('file:///'+studio.replaceAll('\\','/'));await page.locator('#open-full-editor').click();
 const bytes=await page.evaluate(async raw=>{const z=new JSZip();z.file('presentation.json',JSON.stringify(raw.pack));for(const [path,source] of raw.assets)z.file(path,source);return [...await z.generateAsync({type:'uint8array'})];},{pack:raw,assets:await Promise.all([1,2].map(async j=>[`assets/art-${j}.svg`,await readFile(resolve(dir,`assets/art-${j}.svg`),'utf8')]))});
 await page.locator('#fe-import-file').setInputFiles({name:'illustrated-project.zip',mimeType:'application/zip',buffer:Buffer.from(bytes)});
 await page.waitForFunction(id=>window.presentationStudioEditing.read().projectId===id,raw.meta.id).catch(async e=>{console.log((await page.locator('body').innerText()).slice(-12000));throw e;});
 const results=[];
 for(let i=0;i<raw.state.slides.length;i++){
  await page.locator(`.fe-slide-button[data-slide-id="${raw.state.slides[i].id}"]`).click();
  await page.waitForTimeout(120);
  const issues=await page.locator('#fe-preview').evaluate(el=>[...el.querySelectorAll('img')].filter(x=>!x.complete||!x.naturalWidth).map(x=>x.alt));
  if(issues.length)throw Error('Missing images: '+issues);
  await page.locator('#fe-show').dispatchEvent('click');await page.waitForTimeout(100);
  await page.locator('#stage').screenshot({path:resolve(dir,`slide-${String(i+1).padStart(2,'0')}.png`),style:'#controls { visibility:hidden !important; }'});
  await page.locator('#open-full-editor').click();
  results.push({slide:i+1,imagesLoaded:true});
 }
 // Export the importer-normalized native project and confirm a fresh offline import.
 const download=page.waitForEvent('download');await page.locator('#fe-export-json').dispatchEvent('click');
 const saved=await download;await saved.saveAs(file);
 const normalized=JSON.parse(await readFile(file,'utf8'));validateDeck(normalized,id);
 if(normalized.state.slides.length!==6)throw Error('Slide count changed');
 const zipDownload=page.waitForEvent('download');await page.locator('#fe-export').dispatchEvent('click');await (await zipDownload).saveAs(resolve(dir,'editable-project.zip'));
 const freshContext=await browser.newContext();await freshContext.setOffline(true);const fresh=await freshContext.newPage();await fresh.goto('file:///'+studio.replaceAll('\\','/'));await fresh.locator('#open-full-editor').click();await fresh.locator('#fe-import-file').setInputFiles(resolve(dir,'editable-project.zip'));await fresh.waitForFunction(id=>window.presentationStudioEditing.read().projectId===id,raw.meta.id);await freshContext.close();
 await writeFile(resolve(dir,'verification.json'),JSON.stringify({studioImport:true,freshOfflineZIPReimport:true,slideCount:6,slides:results,previews:'Studio editor slide canvas, with no selected object',limitations:['JSON alone does not include image bytes: use editable-project.zip. Current gallery JSON-only download cannot publish these illustrated versions intact.','Exported playback ZIP was not tested.','Gallery public deployment and maintainer acceptance are pending.']},null,2)+'\n');
 console.log(id+': imported, rendered 6 slides, exported and reopened offline');await context.close();
}}finally{await browser.close();}
