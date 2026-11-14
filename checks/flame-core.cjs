const assert=require('node:assert/strict');
const {boundary,profileFromPixels,fit}=require('../flame-lab.js');
const profile=Float64Array.from([0,0,20,60,100,60,20,0]);
assert.equal(boundary(profile,40,'left').x,2.5);
assert.equal(boundary(profile,40,'right').x,5.5);
assert.equal(boundary(profile,200,'right'),null);
assert.equal(boundary(Float64Array.from([60,60]),40,'right').clipped,true);
assert.equal(fit([{t:0,x:1}]),null);
assert.equal(fit([{t:0,x:3},{t:1,x:3}]).r2,null);
const measurements=[];
for(let t=0;t<10;t++){
 const width=100,height=10,data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=10+t*3;x<20+t*3;x++){
  const i=(y*width+x)*4;data[i]=data[i+1]=data[i+2]=200;data[i+3]=255;
 }
 const extracted=profileFromPixels(data,width,height,50,40);
 assert.equal(extracted.y0,3);assert.equal(extracted.y1,7);
 measurements.push({t,x:boundary(extracted.profile,30,'right').x});
}
const fitted=fit(measurements);assert.ok(Math.abs(fitted.slope-3)<1e-10);assert.equal(fitted.r2,1);
console.log('PASS: interpolated edges, missing/clipped boundaries, band averaging, insufficient/constant fits, known 3 px/s image sequence.');

