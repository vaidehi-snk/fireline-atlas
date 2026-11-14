/* Independent image-processing prototype. No NASA observations are bundled here. */
(() => {
  'use strict';
  function boundary(profile, threshold, side) {
    let x = side === 'left' ? 0 : profile.length - 1;
    const step = side === 'left' ? 1 : -1;
    for (; x >= 0 && x < profile.length; x += step) {
      if (profile[x] >= threshold) {
        const outside = x - step;
        if (outside < 0 || outside >= profile.length) return {x, clipped:true};
        const fraction = (threshold - profile[outside]) / (profile[x] - profile[outside]);
        return {x:outside + step * fraction, clipped:false};
      }
    }
    return null;
  }
  function profileFromPixels(data, width, height, center, band) {
    const y0 = Math.max(0, Math.floor(height * (center - band / 2) / 100));
    const y1 = Math.min(height, Math.max(y0 + 1, Math.ceil(height * (center + band / 2) / 100)));
    const profile = new Float64Array(width);
    for (let y=y0; y<y1; y++) for (let x=0; x<width; x++) {
      const i=(y*width+x)*4;
      profile[x]+=(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2])/(y1-y0);
    }
    return {profile,y0,y1};
  }
  function fit(points) {
    if(points.length<2) return null;
    const n=points.length,mt=points.reduce((s,p)=>s+p.t,0)/n,mx=points.reduce((s,p)=>s+p.x,0)/n;
    const denom=points.reduce((s,p)=>s+(p.t-mt)**2,0);
    if(!denom)return null;
    const slope=points.reduce((s,p)=>s+(p.t-mt)*(p.x-mx),0)/denom;
    const intercept=mx-slope*mt,total=points.reduce((s,p)=>s+(p.x-mx)**2,0);
    const error=points.reduce((s,p)=>s+(p.x-intercept-slope*p.t)**2,0);
    return {slope,intercept,r2:total>0?Math.max(0,1-error/total):null,n};
  }
  if(typeof module!=='undefined')module.exports={boundary,profileFromPixels,fit};
  if(typeof document==='undefined')return;
  const $=id=>document.getElementById(id);
  const form=$('lab-form');if(!form)return;
  form.insertBefore($('lab-demo'),form.firstChild);
  const empty=document.createElement('div');empty.className='lab-empty';
  empty.innerHTML='<div class="lab-empty-mark" aria-hidden="true">⌁</div><h3>Your next measurement starts here.</h3><p>Try the synthetic method demo to see the workflow, or load a sequence from an experiment.</p><span>IMAGES → BOUNDARIES → MOTION → CSV</span>';
  document.querySelector('.lab-results').insertBefore(empty,$('lab-metrics'));
  let frames=[],demo=false,results=[],settings=null,busy=false,previewSerial=0;
  const status=message=>{$('lab-status').textContent=message;};
  function synthetic(index){
    const c=document.createElement('canvas');c.width=640;c.height=260;const ctx=c.getContext('2d');
    ctx.fillStyle='#05090d';ctx.fillRect(0,0,640,260);
    const glow=ctx.createRadialGradient(120+index*6,130,5,120+index*6,130,75);
    glow.addColorStop(0,'#fff3ae');glow.addColorStop(.35,'#ffae43');glow.addColorStop(.7,'#2378a9');glow.addColorStop(1,'#05090d');ctx.fillStyle=glow;ctx.fillRect(0,0,640,260);return c;
  }
  async function imageAt(i){return demo?synthetic(i):createImageBitmap(frames[i]);}
  function readSettings(){return {dt:Number($('lab-dt').value),scale:$('lab-scale').value?Number($('lab-scale').value):null,center:Number($('lab-center').value),band:Number($('lab-band').value),threshold:Number($('lab-threshold').value),side:$('lab-edge').value,source:$('lab-source').value.trim()||'Not supplied',synthetic:demo};}
  function stale(){if(busy)return;$('lab-export').disabled=true;status('Inputs changed. Extract again to refresh measurements and exports.');}
  form.addEventListener('input',event=>{if(event.target.id!=='lab-files')stale();});
  $('lab-files').addEventListener('change',()=>{
    document.querySelector('.lab-results').classList.remove('has-measurements');
    $('lab-export').disabled=true;results=[];$('lab-frame').disabled=true;
    const selected=[...$('lab-files').files];
    if(selected.length<2||selected.length>60){status('Choose between 2 and 60 images.');frames=[];return;}
    if(selected.some(f=>!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>10*1024*1024)){status('Use PNG, JPEG, or WEBP files, each under 10 MB.');frames=[];return;}
    frames=selected.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));demo=false;results=[];$('lab-export').disabled=true;$('lab-frame').disabled=true;status(`${frames.length} images ready, ordered by filename. Confirm timing, band, calibration and source, then extract.`);
  });
  $('lab-demo').addEventListener('click',()=>{demo=true;frames=Array.from({length:12},(_,i)=>({name:`synthetic-${String(i).padStart(2,'0')}`}));$('lab-files').value='';$('lab-source').value='SYNTHETIC METHOD DEMO — not NASA experimental data';$('lab-dt').value='1';$('lab-scale').value='';$('lab-center').value='50';$('lab-band').value='40';$('lab-threshold').value='30';$('lab-edge').value='right';form.requestSubmit();});
  async function preview(index){
    if(!results.length)return;const serial=++previewSerial;const image=await imageAt(index);
    if(serial!==previewSerial){image.close?.();return;}
    const c=$('lab-preview');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);image.close?.();
    const row=results[index];ctx.fillStyle='#80d8cc22';ctx.fillRect(0,row.y0,c.width,row.y1-row.y0);ctx.strokeStyle='#80d8cc';ctx.lineWidth=Math.max(1,c.width/500);ctx.strokeRect(0,row.y0,c.width,row.y1-row.y0);
    [row.low,row.front,row.high].forEach((edge,i)=>{if(!edge)return;ctx.strokeStyle=i===1?'#ffbd68':'#ffbd6877';ctx.beginPath();ctx.moveTo(edge.x,0);ctx.lineTo(edge.x,c.height);ctx.stroke();});
    $('lab-frame-name').textContent=`${frames[index].name} · ${row.t.toFixed(3)} s${row.front?'':' · NO DETECTION'}`;
  }
  function chart(){
    const svg=$('lab-chart'),ns='http://www.w3.org/2000/svg';svg.replaceChildren();
    const add=(tag,attrs,text)=>{const node=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,v));if(text)node.textContent=text;svg.append(node);return node;};
    const valid=results.filter(r=>r.front);if(!valid.length)return;
    const ys=results.flatMap(r=>[r.low?.x,r.front?.x,r.high?.x]).filter(Number.isFinite),min=Math.min(...ys),max=Math.max(...ys),span=max-min||1;
    const x=t=>48+t/(results.at(-1).t||1)*565,y=v=>170-(v-min)/span*140;
    add('path',{d:'M48 20V170H620',fill:'none',stroke:'#586b66'});
    ['low','front','high'].forEach((key,i)=>{let path='',connected=false;results.forEach(r=>{if(!r[key]){connected=false;return;}path+=`${connected?'L':'M'}${x(r.t)} ${y(r[key].x)} `;connected=true;});add('path',{d:path,fill:'none',stroke:i===1?'#ffbd68':'#80d8cc','stroke-width':i===1?'2':'1','stroke-dasharray':i===1?'none':'4 4'});});
    valid.forEach(r=>add('circle',{cx:x(r.t),cy:y(r.front.x),r:'3',fill:'#ffbd68'}));
    add('text',{x:48,y:15,fill:'#b5c0b9','font-size':10},'Image boundary (px) · gold = threshold, dashed = threshold ±10');
    add('text',{x:48,y:191,fill:'#b5c0b9','font-size':10},`0 s → ${results.at(-1).t.toFixed(2)} s · position range ${min.toFixed(1)}–${max.toFixed(1)} px`);
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;if(frames.length<2){status('Load at least two experiment frames, or try the synthetic method demo.');return;}
    settings=readSettings();if(!form.reportValidity())return;busy=true;results=[];document.querySelector('.lab-results').classList.remove('has-measurements');$('lab-export').disabled=true;[...form.elements].forEach(el=>el.disabled=true);
    try{
      let width=null,height=null;
      for(let i=0;i<frames.length;i++){
        status(`Analyzing frame ${i+1}/${frames.length} locally…`);const img=await imageAt(i);
        if(img.width>4096||img.height>4096||img.width*img.height>12000000){img.close?.();throw new Error('Images must be ≤4096 px per side and ≤12 megapixels.');}
        if(width!==null&&(img.width!==width||img.height!==height)){img.close?.();throw new Error('All frames must have identical dimensions.');}
        width=img.width;height=img.height;const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);img.close?.();
        const {profile,y0,y1}=profileFromPixels(ctx.getImageData(0,0,width,height).data,width,height,settings.center,settings.band);
        results.push({t:i*settings.dt,front:boundary(profile,settings.threshold,settings.side),low:boundary(profile,Math.max(1,settings.threshold-10),settings.side),high:boundary(profile,Math.min(255,settings.threshold+10),settings.side),y0,y1,width,height});
        await new Promise(resolve=>setTimeout(resolve,0));
      }
      const fitted=fit(results.filter(r=>r.front&&!r.front.clipped).map(r=>({t:r.t,x:r.front.x}))),divisor=settings.scale||1,unit=settings.scale?'mm/s':'px/s';
      const sensitivities=['low','high'].map(key=>fit(results.filter(r=>r[key]&&!r[key].clipped).map(r=>({t:r.t,x:r[key].x})))).filter(Boolean);
      const metric=(title,value)=>{const d=document.createElement('div');const strong=document.createElement('strong');strong.textContent=value;const span=document.createElement('span');span.textContent=title;d.append(strong,span);return d;};
      $('lab-metrics').replaceChildren(metric('IMAGE-BOUNDARY VELOCITY',fitted?`${(fitted.slope/divisor).toFixed(3)} ${unit}`:'Insufficient data'),metric('USABLE / TOTAL FRAMES',`${fitted?.n||0} / ${frames.length}`),metric('LINEAR FIT R²',fitted?.r2!==null&&fitted?fitted.r2.toFixed(3):'Undefined'));
      const spread=sensitivities.length===2?`Threshold sensitivity: fitted velocities ${sensitivities.map(f=>(f.slope/divisor).toFixed(3)).join(' to ')} ${unit}. `:'Threshold sensitivity could not be fitted at both levels. ';
      $('lab-interpretation').textContent=spread+'The two threshold variants are processing sensitivity, not statistical uncertainty. Missing and image-border-clipped detections are excluded from velocity fits. Signed velocity follows the image x axis. Camera motion, exposure changes, and bright hardware may bias this extraction.';
      $('lab-frame').max=String(frames.length-1);$('lab-frame').value='0';$('lab-frame').disabled=false;document.querySelector('.lab-results').classList.add('has-measurements');chart();await preview(0);
      $('lab-export').disabled=false;status(`${demo?'SYNTHETIC DEMO — no NASA observations. ':''}${frames.length} frames analyzed. ${results.filter(r=>!r.front).length} missing and ${results.filter(r=>r.front?.clipped).length} border-clipped detections. ${settings.scale?'User-supplied spatial calibration.':'Uncalibrated: pixel units.'}`);
    }catch(error){results=[];document.querySelector('.lab-results').classList.remove('has-measurements');$('lab-metrics').replaceChildren();$('lab-chart').replaceChildren();$('lab-frame').disabled=true;status(`Analysis stopped: ${error.message}`);}
    finally{busy=false;[...form.elements].forEach(el=>el.disabled=false);}
  });
  $('lab-frame').addEventListener('input',()=>preview(Number($('lab-frame').value)).catch(error=>status(error.message)));
  $('lab-export').addEventListener('click',()=>{
      const headers=['frame','time_s','boundary_px','boundary_mm_image_origin','threshold_low_boundary_px','threshold_high_boundary_px','clipped','source','synthetic','seconds_per_frame','pixels_per_mm','threshold','threshold_low','threshold_high','band_center_percent','band_height_percent','edge','image_width_px','image_height_px','method'];
      const rows=results.map((r,i)=>[frames[i].name,r.t,r.front?.x??'',r.front&&settings.scale?r.front.x/settings.scale:'',r.low?.x??'',r.high?.x??'',r.front?.clipped??'',settings.source,settings.synthetic,settings.dt,settings.scale??'',settings.threshold,Math.max(1,settings.threshold-10),Math.min(255,settings.threshold+10),settings.center,settings.band,settings.side,r.width,r.height,'band-mean luminance; outermost threshold crossing; independent prototype']);
    const quote=value=>{let v=String(value);if(/^[=+@\-]/.test(v)&&!Number.isFinite(Number(v)))v="'"+v;return '"'+v.replaceAll('"','""')+'"';};
    const csv=[headers,...rows].map(row=>row.map(quote).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='fireline-image-measurements.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
})();
