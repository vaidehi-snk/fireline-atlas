(() => {
  'use strict';
  const fields={o2:'Calibrated  initial O2 % by vol ',finalO2:'Calibrated final O2 % by vol',co:'Final CO (ppm)',initialCO:'Initial CO (ppm)'};
  function numeric(value){const text=String(value??'').trim();return /^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(text)&&Number.isFinite(Number(text))?Number(text):null;}
  function kind(value){const text=String(value??'').trim();if(!text||/^none$/i.test(text))return 'missing';if(/^[<>]/.test(text)||text==='OR')return 'censored';return numeric(text)===null?'status':'numeric';}
  if(typeof module!=='undefined')module.exports={numeric,kind};
  if(typeof document==='undefined')return;
  const dataset=window.FIRELINE_DATA;if(!dataset)return;
  const $=id=>document.getElementById(id),make=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
  const records=dataset.records.map((raw,index)=>({raw,index:index+1}));let visible=records,selected=1;
  [...new Set(records.map(record=>record.raw.PI))].sort().forEach(pi=>{const option=make('option',pi);option.value=pi;$('data-pi').append(option);});
  function detail(record){
    selected=record.index;const panel=$('data-detail');panel.replaceChildren(make('span',`SOURCE RECORD ${record.index} / ${records.length}`,'data-kicker'),make('h3',`${record.raw['Test #']} · ${record.raw.PI}`));
    window.FIRELINE_VIDEO_PANEL?.(record.raw,panel);
    const dl=make('dl');Object.entries(record.raw).forEach(([key,value])=>{dl.append(make('dt',key.trim()),make('dd',String(value).trim()||'— (blank in source)'));});panel.append(dl);
    const cite=make('a','NASA PSI-25 · source record ↗');cite.href=dataset.meta.source;cite.target='_blank';cite.rel='noreferrer';panel.append(cite);
  }
  function plot(){
    const svg=$('data-plot'),ns='http://www.w3.org/2000/svg';svg.replaceChildren();
    const add=(tag,attributes,text)=>{const e=document.createElementNS(ns,tag);Object.entries(attributes).forEach(([k,v])=>e.setAttribute(k,v));if(text)e.textContent=text;svg.append(e);return e;};
    const points=visible.map(record=>({record,x:numeric(record.raw[fields.o2]),y:numeric(record.raw[fields.co])})).filter(p=>p.x!==null&&p.y!==null);
    if(!points.length){add('text',{x:40,y:130,fill:'#b7c9bc','font-size':14},'No exact numeric CO observations in this selection.');return;}
    const xmin=Math.min(...points.map(p=>p.x)),xmax=Math.max(...points.map(p=>p.x)),ymin=Math.min(0,...points.map(p=>p.y)),ymax=Math.max(1,...points.map(p=>p.y));
    const px=x=>62+(x-xmin)/(xmax-xmin||1)*548,py=y=>248-(y-ymin)/(ymax-ymin)*216;
    for(let i=0;i<=4;i++){const y=ymin+(ymax-ymin)*i/4;add('line',{x1:62,y1:py(y),x2:610,y2:py(y),stroke:'#2a3c40'});add('text',{x:54,y:py(y)+4,'text-anchor':'end',fill:'#8fa99d','font-size':11},y.toFixed(0));}
    add('text',{x:65,y:17,fill:'#b6d0c1','font-size':11},'Final CO (ppm)');add('text',{x:62,y:270,fill:'#8fa99d','font-size':11},xmin.toFixed(1));add('text',{x:610,y:270,'text-anchor':'end',fill:'#8fa99d','font-size':11},xmax.toFixed(1));add('text',{x:330,y:292,'text-anchor':'middle',fill:'#b6d0c1','font-size':11},'Calibrated initial O₂ (% by volume)');
    points.forEach(({record,x,y})=>{const dot=add('circle',{cx:px(x),cy:py(y),r:5,fill:'#80d8cc','fill-opacity':.65,tabindex:0,role:'button','aria-label':`${record.raw.PI} ${record.raw['Test #']}: initial oxygen ${x}%, final CO ${y} ppm; inspect record`});const title=document.createElementNS(ns,'title');title.textContent=`${record.raw.PI} / ${record.raw['Test #']}: ${x}% O₂, ${y} ppm CO`;dot.append(title);dot.addEventListener('click',()=>detail(record));dot.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();detail(record);}});});
  }
  function render(){
    const min=numeric($('data-min').value),max=numeric($('data-max').value),pi=$('data-pi').value,query=$('data-query').value.trim().toLowerCase();
    if(min!==null&&max!==null&&min>max){$('data-summary').textContent='Minimum oxygen must be no greater than maximum oxygen.';$('data-export').disabled=true;return;}
    visible=records.filter(({raw})=>{const oxygen=numeric(raw[fields.o2]);return (pi==='all'||raw.PI===pi)&&(!query||`${raw['Test #']} ${raw['Fuel Sample Material']} ${raw['Sample #']}`.toLowerCase().includes(query))&&(min===null||oxygen!==null&&oxygen>=min)&&(max===null||oxygen!==null&&oxygen<=max);});
    const quality={numeric:0,missing:0,censored:0,status:0};visible.forEach(({raw})=>quality[kind(raw[fields.co])]++);
    $('data-summary').replaceChildren(...[[visible.length,'SOURCE RECORDS'],[quality.numeric,'EXACT FINAL CO'],[quality.censored,'CENSORED FINAL CO'],[quality.missing+quality.status,'MISSING / STATUS CO']].map(([value,label])=>{const box=make('div');box.append(make('strong',String(value)),make('span',label));return box;}));
    $('data-quality').textContent=`${quality.numeric} plotted; ${quality.censored} censored (>500 or OR, documented by NASA's readme as >1000 ppm), ${quality.status} other status, and ${quality.missing} blank/none final CO records remain in the table and are excluded from the plot. No missing reading is replaced with zero.`;
    $('data-rows').replaceChildren(...visible.map(record=>{const raw=record.raw,tr=make('tr'),cell=make('td'),button=make('button',raw['Test #']);button.type='button';button.addEventListener('click',()=>detail(record));cell.append(button);tr.append(cell);const category=kind(raw[fields.co]);let note=category==='numeric'?'Exact CO entry':category==='censored'?'Censored; not an exact value':category==='missing'?'Missing / none in source':'Status entry retained';if(numeric(raw[fields.initialCO])<0&&numeric(raw[fields.initialCO])!==null)note+=' · negative initial CO recorded';[raw.PI,raw['Fuel Sample Material'],raw[fields.o2],raw[fields.finalO2],raw[fields.initialCO],raw[fields.co],note,window.FIRELINE_VIDEO_SHORT?.(raw)??'—'].forEach(value=>tr.append(make('td',String(value).trim()||'—')));return tr;}));
    if(!visible.length){const tr=make('tr'),td=make('td','No records match these filters. Reset or widen the selection.');td.colSpan=9;tr.append(td);$('data-rows').append(tr);$('data-detail').replaceChildren(make('h3','No matching record'));}else detail(visible.find(record=>record.index===selected)||visible[0]);
    $('data-export').disabled=!visible.length;plot();
  }
  $('data-filters').addEventListener('submit',event=>event.preventDefault());$('data-filters').addEventListener('input',render);$('data-filters').addEventListener('change',render);
  $('data-reset').addEventListener('click',()=>{$('data-pi').value='all';$('data-query').value='';$('data-min').value=dataset.meta.oxygenRange[0];$('data-max').value=dataset.meta.oxygenRange[1];render();});
  $('data-export').addEventListener('click',()=>{
    const headers=['source_record',...Object.keys(records[0].raw),'source_doi','source_file','source_file_version','source_sha256','retrieved_on'];
    const rows=visible.map(({index,raw})=>[index,...Object.values(raw),dataset.meta.doi,dataset.meta.fileName,dataset.meta.fileVersion,dataset.meta.sha256,dataset.meta.retrievedOn]);
    const quote=value=>{let s=String(value);if(/^[=+@\-]/.test(s)&&numeric(s)===null)s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
    const csv=[headers,...rows].map(row=>row.map(quote).join(',')).join('\r\n'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),link=make('a');link.href=url;link.download='fireline-filtered-nasa-records.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  render();
})();
