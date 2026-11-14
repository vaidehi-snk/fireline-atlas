const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'bass-data.js'),'utf8'),context);
const data=context.window.FIRELINE_DATA,{numeric,kind}=require('../experiment-data.js');
assert.equal(data.records.length,129);assert.equal(new Set(data.records.map(r=>`${r.PI}/${r['Test #']}`)).size,129);
assert.equal(data.meta.sha256,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'data/PSI-25_Experimental-table_BASS-II.csv'))).digest('hex'));
assert.ok(data.records.every(r=>Object.keys(r).length===17));assert.equal(new Set(data.records.map(r=>r.PI)).size,6);
const oxygen=data.records.map(r=>numeric(r['Calibrated  initial O2 % by vol ']));assert.equal(Math.min(...oxygen),13.6);assert.equal(Math.max(...oxygen),22.2);
assert.equal(numeric(''),null);assert.equal(numeric('none'),null);assert.equal(numeric('OR'),null);assert.equal(numeric('>500'),null);assert.equal(numeric('-1'),-1);assert.equal(numeric('0'),0);
assert.equal(kind('>500'),'censored');assert.equal(kind('over'),'status');assert.equal(kind('none'),'missing');assert.equal(kind(''),'missing');
assert.equal(kind('OR'),'censored'); // NASA ReadMe: OR = over range (>1000 ppm).
const counts={numeric:0,censored:0,status:0,missing:0};data.records.forEach(r=>counts[kind(r['Final CO (ppm)'])]++);assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),129);assert.ok(counts.censored>0&&counts.status>0&&counts.missing>0);
console.log('PASS: source hash, 129 unique records, 17 fields, six investigators, O2 envelope, and lossless handling of censored/status/missing CO.',counts);
