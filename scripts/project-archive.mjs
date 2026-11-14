import { inflateRawSync } from 'node:zlib';

const limit = 100 * 1024 * 1024;
const safePath = name => name.length <= 500 && !/[\\:%?#\x00-\x1f]/.test(name) &&
  !name.split('/').some(part => !part || part === '.' || part === '..') &&
  (['presentation.json', 'index.html', 'README.txt'].includes(name) || /^assets\/[\w./ -]+$/.test(name));
const check = (ok, message) => { if (!ok) throw new Error(`Invalid editable ZIP: ${message}`); };
const crcTable = Array.from({length:256}, (_, value) => {
  for (let bit=0; bit<8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

// Inspect bounded ZIP entries in memory. Nothing is extracted or executed.
// Studio exports ordinary single-disk ZIPs using stored or deflated entries.
export function readProjectArchive(bytes) {
  check(bytes.length >= 22 && bytes.length <= 15 * 1024 * 1024, 'file size exceeds limits or is truncated');
  let end = -1;
  for (let at=bytes.length-22; at>=Math.max(0, bytes.length-65557); at--)
    if (bytes.readUInt32LE(at) === 0x06054b50 && at+22+bytes.readUInt16LE(at+20) === bytes.length) { end=at; break; }
  check(end >= 0, 'missing end record');
  const count=bytes.readUInt16LE(end+10), size=bytes.readUInt32LE(end+12), offset=bytes.readUInt32LE(end+16);
  check(bytes.readUInt16LE(end+4) === 0 && bytes.readUInt16LE(end+6) === 0 && bytes.readUInt16LE(end+8) === count,
    'split archives are unsupported');
  check(count > 0 && count <= 1000 && offset+size === end, 'unsupported directory or ZIP64 archive');
  const entries=new Map(), names=new Set(), ranges=[];
  let at=offset, expanded=0;
  for(let i=0; i<count; i++) {
    check(at+46 <= end && bytes.readUInt32LE(at) === 0x02014b50, 'invalid central directory');
    const flags=bytes.readUInt16LE(at+8), method=bytes.readUInt16LE(at+10), crc=bytes.readUInt32LE(at+16);
    const compressed=bytes.readUInt32LE(at+20), length=bytes.readUInt32LE(at+24);
    const nameLength=bytes.readUInt16LE(at+28), extra=bytes.readUInt16LE(at+30), comment=bytes.readUInt16LE(at+32);
    const local=bytes.readUInt32LE(at+42), next=at+46+nameLength+extra+comment;
    check(next <= end && bytes.readUInt16LE(at+34) === 0, 'truncated or split entry');
    const name=new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(at+46,at+46+nameLength));
    const directory=name.endsWith('/'), clean=directory ? name.slice(0,-1) : name;
    check(safePath(clean) || (directory && clean === 'assets'), 'unsafe or unsupported entry path');
    check(!names.has(clean.toLowerCase()), 'duplicate entry path'); names.add(clean.toLowerCase());
    const unixType=(bytes.readUInt32LE(at+38) >>> 16) & 0xf000;
    check(!unixType || unixType === 0x8000 || (directory && unixType === 0x4000), 'links and special files are unsupported');
    check(!(flags & ~0x080e) && !(flags & 1) && [0,8].includes(method), 'encrypted or unsupported compression');
    check(local+30 <= offset && bytes.readUInt32LE(local) === 0x04034b50, 'invalid local header');
    const localName=bytes.readUInt16LE(local+26), localExtra=bytes.readUInt16LE(local+28), start=local+30+localName+localExtra;
    check(start+compressed <= offset && bytes.readUInt16LE(local+6) === flags && bytes.readUInt16LE(local+8) === method &&
      bytes.subarray(local+30,local+30+localName).equals(bytes.subarray(at+46,at+46+nameLength)), 'inconsistent local header');
    check(!ranges.some(([a,b]) => local < b && start+compressed > a), 'overlapping entries'); ranges.push([local,start+compressed]);
    expanded+=length; check(expanded <= limit && length <= (name === 'presentation.json' ? 20*1024*1024 : limit), 'expanded size limit exceeded');
    const data=bytes.subarray(start,start+compressed);
    const content=method === 0 ? data : inflateRawSync(data,{maxOutputLength:Math.max(1,length)});
    check(content.length === length && crc32(content) === crc, 'entry size or checksum mismatch');
    if(!directory) entries.set(name,content);
    at=next;
  }
  check(at === end && entries.has('presentation.json'), 'missing presentation.json or invalid directory size');
  return entries;
}

export function projectAssetPaths(deck) {
  const paths=new Set();
  function visit(state, depth=0) {
    check(depth <= 20, 'recovery nesting exceeds limits');
    if(!state) return;
    for(const path of [state.brand?.logo,state.brand?.logoLight,state.brand?.logoDark]) if(path) paths.add(path);
    for(const media of [...Object.values(state.media || {}),...Object.values(state.mediaObjects || {}).flatMap(objects=>objects.map(object=>object.media))])
      for(const path of [media?.src,media?.poster]) if(path) paths.add(path);
    visit(state.startingState,depth+1);
  }
  visit(deck.state);
  for(const checkpoint of deck.checkpoints || []) visit(checkpoint.state);
  for(const state of [...deck.history?.past || [],...deck.history?.future || []]) visit(state);
  for(const path of paths) check(typeof path === 'string' && path.startsWith('assets/') && safePath(path), 'unsafe media reference');
  return paths;
}
