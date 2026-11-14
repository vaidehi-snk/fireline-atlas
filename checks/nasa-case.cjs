const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'nasa-case.js'),'utf8'),context);
const data=context.window.FIRELINE_NASA_CASE,hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(data.frames.length,11);assert.equal(data.meta.test,'B3');assert.equal(data.meta.doi,'10.60555/4qc4-de67');
assert.equal(hash(fs.readFileSync(path.join(root,'data/BASS-II_B3_ProofSheet.pdf'))),data.meta.sourceSha256);
assert.deepEqual(Array.from(data.frames,f=>f.time),[0,2,4,7,9,11,13,15,18,20,21]);
for(const frame of data.frames){const png=Buffer.from(frame.image.split(',')[1],'base64');assert.equal(hash(png),frame.sha256);assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),314);assert.equal(png.readUInt32BE(20),209);}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/B3-case-manifest.json'),'utf8'));
assert.equal(manifest.frames.length,11);assert.equal(manifest.frames[0].clock,'12:20:37');assert.equal(manifest.frames.at(-1).clock,'12:20:58');
const {fit}=require('../flame-lab.js');assert.equal(fit([0,2,4,7].map(t=>({t,x:10+3*t}))).slope,3);
console.log('PASS: NASA source PDF hash, 11 PNG hashes/dimensions, original timestamps, manifest, and regression with unequal time gaps.');
