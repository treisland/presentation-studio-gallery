import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent, validateMetadata, validateDeck, validateSvg, readDeck } from '../scripts/content.mjs';
import { readProjectArchive } from '../scripts/project-archive.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const { config, items } = await loadContent(root);
test('all published content is valid', () => {
  assert.ok(items.length > 0);
  for (const item of items) assert.ok(config.categories.includes(item.category));
});

test('loads selected previews independently of the native slide count', async t => {
  const temp = await mkdtemp(path.join(tmpdir(),'gallery-previews-'));
  t.after(async () => {
    assert.equal(path.dirname(temp),path.resolve(tmpdir()));
    await rm(temp,{recursive:true,force:true});
  });
  const item = items[0], folder = path.join(temp,'presentations',item.id);
  await mkdir(folder,{recursive:true});
  await writeFile(path.join(temp,'config.json'),JSON.stringify(config));
  for (const file of item.files) await cp(path.join(root,'presentations',item.id,file),path.join(folder,file));
  for (const count of [1,2]) {
    await writeFile(path.join(folder,'metadata.json'),JSON.stringify({...item,previews:item.previews.slice(0,count)}));
    const {items:loaded} = await loadContent(temp);
    assert.equal(loaded[0].previews.length,count);
    assert.equal(loaded[0].slideCount,item.slideCount);
  }
  assert.throws(() => validateMetadata({...item,previews:[]},item.id,config.categories),/previews are required/);
});
test('rejects unsafe paths, URLs, unknown categories and invalid dates', () => {
  for (const patch of [{ deck:'../secret.json' },{cover:'https://example.com/a.svg'},{ category:'Unknown' },{added:'2026-02-30'},{author:{name:'Someone',url:'javascript:alert(1)'}},{type:'upload'}]) {
    assert.throws(() => validateMetadata({ ...items[0], ...patch }, items[0].id, config.categories));
  }
});
test('rejects active SVG content', () => {
  for (const svg of ['<svg><script>alert(1)</script></svg>','<svg onload="alert(1)"></svg>','<svg><image href="https://example.com"/></svg>','<svg><foreignObject/></svg>','<!DOCTYPE svg><svg></svg>']) assert.throws(() => validateSvg(svg, 'test'));
  assert.doesNotThrow(() => validateSvg('<svg><rect width="10" height="10"/><text>Safe</text></svg>', 'test'));
});
test('rejects duplicate slide IDs and unsupported project formats', async () => {
  const deck = await readDeck(path.join(root,'presentations',items[0].id,items[0].deck),items[0].id);
  const duplicate = structuredClone(deck); duplicate.state.slides[1].id = duplicate.state.slides[0].id;
  assert.throws(() => validateDeck(duplicate, 'test'));
  assert.throws(() => validateDeck({ ...deck, schemaVersion:999 }, 'test'));
  assert.doesNotThrow(() => validateDeck({ ...deck, schemaVersion:3 }, 'test'));
});

test('editable ZIPs preserve project identity, images and actual slide counts', async () => {
  for (const id of ['ember-and-salt','common-ground-realty','after-dark-city-in-light']) {
    const item=items.find(item=>item.id===id);
    assert.equal(item.slideCount,6); assert.equal(item.previews.length,3);
    const published=await readFile(path.join(root,'presentations',id,item.deck));
    assert.deepEqual(published,await readFile(path.join(root,'submissions',id,'editable-project.zip')));
    const entries=readProjectArchive(published), deck=await readDeck(path.join(root,'presentations',id,item.deck),id);
    assert.equal(deck.meta.id,`gallery-${id}-v1`);
    assert.deepEqual(deck.state.slides.map(s=>s.id),Array.from({length:6},(_,i)=>`${id}-slide-${i+1}`));
    assert.ok(entries.get('assets/art-1.svg').length);assert.ok(entries.get('assets/art-2.svg').length);
  }
});

test('rejects incomplete, unsafe, corrupted and oversized editable archives', async t => {
  const temp=await mkdtemp(path.join(tmpdir(),'gallery-zip-'));
  t.after(async()=>{assert.equal(path.dirname(temp),path.resolve(tmpdir()));await rm(temp,{recursive:true,force:true});});
  const original=await readFile(path.join(root,'presentations','ember-and-salt','editable-project.zip'));
  const rename=(from,to)=>{assert.equal(from.length,to.length);return Buffer.from(original.toString('latin1').replaceAll(from,to),'latin1');};
  const cases=[
    ['missing',rename('assets/art-1.svg','assets/art-x.svg'),/missing ZIP asset/],
    ['traversal',rename('assets/art-1.svg','../bad/art-1.svg'),/unsafe/],
    ['duplicate',rename('assets/art-2.svg','assets/art-1.svg'),/duplicate/],
    ['truncated',original.subarray(0,original.length-10),/end record/],
  ];
  const directory=original.indexOf(Buffer.from([0x50,0x4b,0x01,0x02]));
  const oversized=Buffer.from(original);oversized.writeUInt32LE(101*1024*1024,directory+24);cases.push(['oversized',oversized,/size limit/]);
  const encrypted=Buffer.from(original);encrypted.writeUInt16LE(1,directory+8);cases.push(['encrypted',encrypted,/encrypted/]);
  const corrupt=Buffer.from(original);corrupt.writeUInt32LE((corrupt.readUInt32LE(directory+16)^1)>>>0,directory+16);cases.push(['corrupt',corrupt,/checksum/]);
  const links=Buffer.from(original);links.writeUInt32LE(0xa0000000,directory+38);cases.push(['link',links,/links/]);
  for(const [name,bytes,error] of cases){const file=path.join(temp,name+'.zip');await writeFile(file,bytes);await assert.rejects(readDeck(file,name),error);}
  const deck=JSON.parse(readProjectArchive(original).get('presentation.json'));
  await writeFile(path.join(temp,'incomplete.json'),JSON.stringify(deck));
  await assert.rejects(readDeck(path.join(temp,'incomplete.json'),'test'),/complete editable ZIP/);
  deck.playbackOnly=true;
  await writeFile(path.join(temp,'playback.json'),JSON.stringify(deck));
  await assert.rejects(readDeck(path.join(temp,'playback.json'),'test'),/not a playback export/);
});
