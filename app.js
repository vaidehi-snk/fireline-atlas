(() => {
  const evidence = window.FIRELINE_EVIDENCE || [];
  const input = document.querySelector('#question-input');
  const askButton = document.querySelector('#ask-button');
  const filter = document.querySelector('#evidence-filter');
  const lensSelect = document.querySelector('#mission-select');
  const grid = document.querySelector('#evidence-grid');
  const answerTitle = document.querySelector('#answer-title');
  const answerText = document.querySelector('#answer-text');
  const resultCount = document.querySelector('#result-count');
  const lensText = document.querySelector('#lens-text');
  const resultsLabel = document.querySelector('#evidence-results-label');
  const empty = document.querySelector('#empty-state');
  const promptButtons = [...document.querySelectorAll('.prompt-chip')];
  const stopWords = new Set(['what','does','the','a','an','is','are','can','we','us','if','how','do','as','to','for','in','on','of','and','or','with','should','could','tell','about','when','during','alone','actually','say','fireline','please']);
  const synonyms = {
    flame:['fire','burn','combustion'], dangerous:['damage','risk','safety','hazard'], danger:['damage','risk','safety','hazard'], heat:['hrr','watt','thermal'], watts:['hrr','watt','heat'], burn:['fire','combustion','flame'], airflow:['flow','ventilation','air'], ventilation:['flow','airflow'], smoke:['co','co2','products'], toxic:['co','carbon monoxide'], crew:['monitor','monitoring','sensor','habitat'], material:['fuel','geometry'], oxygen:['o2','atmosphere'], data:['psi','repository','dataset']
  };
  const lensCopy = {
    habitat:'A short peak and a long exposure can load hardware differently. Treat duration, geometry, and heat pathways as separate decision variables.',
    suppression:'Suppression behavior depends on fuel form and flow. Use the evidence to frame a tactic question, not to prescribe a crew action.',
    materials:'Near-limit tests depend on oxygen and ventilation. Keep the test conditions attached before generalizing to a new spacecraft material.'
  };
  const termsFor = (query) => {
    const words = (query.toLowerCase().match(/[a-z0-9%]+/g) || []).filter(w => !stopWords.has(w));
    const expanded = new Set(words);
    words.forEach(word => (synonyms[word] || []).forEach(term => expanded.add(term)));
    return [...expanded];
  };
  function score(item, terms, lens) {
    const tags = item.tags.map(t => t.toLowerCase());
    let hits = 0;
    terms.forEach(term => { if (tags.some(tag => tag === term || tag.includes(term) || term.includes(tag))) hits += 1; });
    const mission = item.mission.includes(lens) ? 2 : 0;
    return {value: hits * 2 + mission + item.tier, hits, mission};
  }
  function rank(query, lens) {
    const terms = termsFor(query);
    return evidence.map(item => ({item, ...score(item, terms, lens)})).sort((a,b) => b.value - a.value || a.item.id.localeCompare(b.item.id));
  }
  function synthesis(query, ranked, lens) {
    const q = query.toLowerCase();
    if (/watt|hrr|heat release|threshold|danger|dangerous|risk|damage|hazard/.test(q)) {
      return {title:'The wattage is not the whole story.', text:'NASA’s BASS-II report describes a prolonged opposed thick-slab burn near 100 W that damaged a window corner after a leak directed heat there, while a briefer concurrent-rod burn near 110 W caused no damage. The contrast suggests duration, geometry, and heat path matter alongside heat-release rate. Two cases do not establish a universal threshold.'};
    }
    if (/oxygen|o2|atmosphere|concentration/.test(q)) {
      return {title:'Oxygen shifts the picture; flow adds scatter.', text:'In the BASS-II tests, estimated heat-release rate generally rose with initial oxygen concentration, but NASA attributes scatter to differences in duct flow. Treat oxygen as one operating variable alongside ventilation and fuel configuration, not as a stand-alone prediction.'};
    }
    if (/co2|carbon dioxide|co\b|carbon monoxide|smoke|toxic|monitor|sensor|crew/.test(q)) {
      return {title:'Track the atmosphere, not just the visible flame.', text:'BASS-II measured oxygen, carbon monoxide, and carbon dioxide around burns. NASA reports that CO behavior changed with fuel geometry and, in some cases, flow. The evidence supports a multi-signal monitoring view; it does not supply a universal alarm threshold for a future habitat.'};
    }
    if (/flow|airflow|ventilation|geometry|fuel|material/.test(q)) {
      return {title:'A finding needs its test conditions attached.', text:'NASA reports variation with duct flow and fuel geometry. Preserve those conditions when comparing burns; a result from one sample shape and flow path should not be treated as a material-wide rule.'};
    }
    const first = ranked[0]?.item;
    return {title:first?.title || 'Ask a mission question.', text:first?.implication || 'Try asking about oxygen, heat release, fuel geometry, airflow, or monitoring. Fireline will rank relevant NASA findings and show their sources.'};
  }
  function makeCard({item, value, hits}) {
    const card = document.createElement('article'); card.className = 'evidence-card';
    const meta = document.createElement('div'); meta.className = 'evidence-meta';
    const kind = document.createElement('span'); kind.className='evidence-kind'; kind.textContent=item.kind;
    const category = document.createElement('span'); category.className='evidence-category'; category.textContent=item.category.replace('-', ' ').toUpperCase();
    const relevance = document.createElement('span'); relevance.className='evidence-relevance'; relevance.textContent=hits ? `MATCH ${hits}` : `LENS +${value}`;
    meta.append(kind,category,relevance);
    const heading = document.createElement('h3'); heading.textContent=item.title;
    const body = document.createElement('p'); body.textContent=item.statement;
    const bottom = document.createElement('div'); bottom.className='evidence-bottom';
    const cite = document.createElement('small'); cite.textContent=`${item.source} · ${item.page}`;
    const link = document.createElement('a'); link.href=item.href; link.target='_blank'; link.rel='noreferrer'; link.textContent='OPEN SOURCE ↗'; link.setAttribute('aria-label',`Open source for ${item.title}`);
    bottom.append(cite,link); card.append(meta,heading,body,bottom); return card;
  }
  function render() {
    const lens = lensSelect.value;
    const ranked = rank(input.value.trim(), lens);
    const answer = synthesis(input.value.trim(), ranked, lens);
    answerTitle.textContent=answer.title; answerText.textContent=answer.text; lensText.textContent=lensCopy[lens];
    const relevant = ranked.filter(entry => entry.hits > 0 || !input.value.trim());
    const answerRanked = relevant.length ? relevant : ranked.slice(0,3);
    resultCount.textContent=`${answerRanked.length} ${answerRanked.length === 1 ? 'finding' : 'findings'} ranked for this question`;
    const category = filter.value;
    const visible = [...answerRanked].filter(entry => category === 'all' || entry.item.category === category);
    grid.replaceChildren(...visible.map(makeCard));
    resultsLabel.textContent=`${String(visible.length).padStart(2,'0')} EVIDENCE ${visible.length === 1 ? 'NOTE' : 'NOTES'}`;
    empty.hidden = visible.length !== 0;
  }
  const scenarioForm = document.querySelector('#scenario-form');
  const oxygenSlider = document.querySelector('#scenario-o2');
  const oxygenOutput = document.querySelector('#o2-output');
  const knownFuels = new Set(['opposed-thick-slab','concurrent-rod','thin-slab','fabric','sphere']);
  const fuelNames = {
    'opposed-thick-slab':'opposed-flow thick slab','concurrent-rod':'concurrent-flow rod','thin-slab':'thin slab','fabric':'cotton-fiberglass fabric','sphere':'spherical section','other':'other / not represented'
  };
  function runScenario(event) {
    if (event) event.preventDefault();
    const fuel = document.querySelector('#scenario-fuel').value;
    const oxygen = Number(oxygenSlider.value);
    const duration = document.querySelector('#scenario-duration').value;
    const flow = document.querySelector('#scenario-flow').value;
    const heatPath = document.querySelector('#scenario-heatpath').value;
    const sensors = [...document.querySelectorAll('input[name="sensor"]:checked')].map(el => el.value);
    const oxygenInBand = oxygen >= 14 && oxygen <= 21;
    const fuelCovered = knownFuels.has(fuel);
    const durationKnown = duration !== 'unknown';
    const heatPathKnown = heatPath !== 'unknown';
    const structuralMatch = fuel === 'opposed-thick-slab' && duration === 'prolonged' && heatPath === 'directed';
    const directMatch = structuralMatch && oxygenInBand;
    const coverage = [fuelCovered, oxygenInBand, durationKnown, heatPathKnown].filter(Boolean).length;
    const banner = document.querySelector('#match-banner');
    const matchTitle = document.querySelector('#match-title');
    const summary = document.querySelector('#scenario-summary');
    if (directMatch) {
      banner.className='match-banner match-direct';
      matchTitle.textContent='BASS-II structural analogue · O₂ within study band';
      summary.textContent='The selected geometry, duration, and heat path resemble NASA’s reported window-damage event. Oxygen is within the broader BASS-II test range, but the report does not identify the oxygen level for that specific event. This is a structural analogue, not a prediction that your scenario will cause damage.';
    } else if (structuralMatch) {
      banner.className='match-banner match-partial';
      matchTitle.textContent='Structural match · oxygen outside BASS-II band';
      summary.textContent='The fuel geometry, duration, and heat path resemble the reported damage case, but the selected oxygen level is outside the described BASS-II test band. Treat the result as an evidence gap; do not extrapolate the reported heat-release trend.';
    } else if (coverage >= 3) {
      banner.className='match-banner match-related';
      matchTitle.textContent='Related BASS-II conditions · no direct case match';
      summary.textContent='Some selected conditions appear in the BASS-II evidence base, but this combination does not match the reported window-damage case. Fireline cannot infer an outcome from this partial similarity.';
    } else {
      banner.className='match-banner match-partial';
      matchTitle.textContent='Evidence coverage gap';
      summary.textContent='Key conditions are outside or missing from the curated BASS-II notes. Treat this scenario as uncharacterized here and seek the underlying investigation records before drawing conclusions.';
    }
    document.querySelector('#coverage-value').textContent=`${coverage} / 4 fields represented`;
    document.querySelector('#coverage-fill').style.width=`${coverage * 25}%`;
    const o2Text = oxygenInBand
      ? `O₂ ${oxygen}% is within the report’s approximate 14–21% test band. This is evidence coverage, not a safety boundary.`
      : `O₂ ${oxygen}% is outside the report’s approximate 14–21% test band; the BASS-II trend should not be extrapolated here.`;
    const flowText = flow === 'unknown'
      ? 'Flow is unknown. NASA reported HRR scatter across duct-flow conditions; a numeric flow match is not available in this prototype.'
      : `Flow is marked “${flow}” qualitatively. This selector is not mapped to measured BASS-II velocities, so it cannot establish a test match.`;
    const missingSensors = ['O₂','CO','CO₂'].filter(channel=>!sensors.includes(channel));
    const sensorText = missingSensors.length
      ? `Not selected: ${missingSensors.join(', ')}. BASS-II reported O₂, CO, and CO₂ measurements; review whether these channels are available for the scenario.`
      : 'O₂, CO, and CO₂ are all selected, matching the three atmosphere channels discussed in the BASS-II report.';
    const nextTest = !oxygenInBand
      ? 'Highest-value next step: locate or run a matched test at this oxygen level. The curated BASS-II oxygen trend does not cover the selected value, so extrapolating it would add uncertainty.'
      : missingSensors.length
        ? `Highest-value next step: instrument the same configuration for ${missingSensors.join(', ')} alongside the selected channels. This closes a measurement gap before comparing fire behavior.`
        : flow === 'unknown'
          ? 'Highest-value next step: repeat this configuration with measured duct velocity and record it with O2, CO, and CO2. NASA reports HRR scatter across flow conditions.'
          : !fuelCovered
            ? 'Highest-value next step: characterize this fuel geometry under controlled conditions; no matching geometry is represented in this curated evidence set.'
            : structuralMatch
              ? 'Highest-value next step: recover run-level BASS-II metadata for the damage analogue—especially its specific oxygen and flow—then compare a controlled repeat with the same fuel and heat path.'
              : 'Highest-value next step: run a paired comparison that changes one condition at a time, and preserve measured flow plus O2, CO, and CO2 so the result can be compared with NASA evidence.';
    document.querySelector('#experiment-recommendation').textContent=nextTest;
    document.querySelector('#download-plan').onclick=()=>{
      const cols=['run','purpose','fuel_geometry','oxygen_percent','duration','flow_measurement','heat_path','channels_to_record','controls_and_note'];
      const rows=[
        ['A','Baseline for this scenario',fuelNames[fuel],oxygen,duration,'Measure actual velocity',heatPath,'O2; CO; CO2','Record ignition protocol, sample dimensions, replicate count, and synchronized time series.'],
        ['B','Oxygen contrast; hold other conditions constant',fuelNames[fuel],'14 (proposed exploratory level)',duration,'Match A; measure actual velocity',heatPath,'O2; CO; CO2','Within approximate BASS-II study band; proposed design level, not a NASA-reported threshold.'],
        ['C','Oxygen contrast; hold other conditions constant',fuelNames[fuel],'21 (proposed exploratory level)',duration,'Match A; measure actual velocity',heatPath,'O2; CO; CO2','Within approximate BASS-II study band; proposed design level, not a NASA-reported threshold.'],
        ['D','Flow contrast; hold other conditions constant',fuelNames[fuel],oxygen,duration,'Set measured target after facility review; match other inputs',heatPath,'O2; CO; CO2','Define safe, facility-approved velocity levels before testing; qualitative labels are not numeric test conditions.'],
        ['E','Geometry contrast; hold other conditions constant',fuel==='concurrent-rod'?'opposed-flow thick slab':'concurrent-flow rod',oxygen,duration,'Match A; measure actual velocity',heatPath,'O2; CO; CO2','Use documented sample geometry and replicates; exploratory comparison, not a prediction.']
      ];
      const esc=v=>'"'+String(v).replaceAll('"','""')+'"';
      const csv=[cols,...rows].map(row=>row.map(esc).join(',')).join('\r\n');
      const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='fireline-controlled-test-matrix.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    };
    const findings = document.querySelector('#scenario-findings');
    findings.replaceChildren();
    [["OXYGEN COVERAGE",o2Text],["FLOW CONTEXT",flowText],["MONITORING VIEW",sensorText]].forEach(([label,copy])=>{
      const row=document.createElement('div'); row.className='scenario-finding';
      const tag=document.createElement('span'); tag.textContent=label;
      const text=document.createElement('p'); text.textContent=copy;
      row.append(tag,text); findings.append(row);
    });
    const prompts=[];
    if (structuralMatch) prompts.push('Review the NASA damage analogue and record how duration, leakage, and the nearby heat path differ in this scenario.');
    else prompts.push('Document the assumptions that make this scenario comparable—or not comparable—to BASS-II tests.');
    if (!oxygenInBand) prompts.push('Find investigation evidence covering this oxygen level before using the reported HRR trend.');
    if (flow === 'unknown' || flow === 'low' || flow === 'moderate' || flow === 'high') prompts.push('Replace the qualitative airflow label with a measured ventilation value before making a condition-level comparison.');
    if (missingSensors.length) prompts.push(`Check telemetry availability for ${missingSensors.join(' and ')}; do not treat unobserved channels as normal.`);
    prompts.push('Compare against applicable spacecraft fire-safety requirements and crew procedures; this dashboard is not an operational checklist.');
    const list=document.querySelector('#review-prompts'); list.replaceChildren(...prompts.map(copy=>{const li=document.createElement('li');li.textContent=copy;return li;}));
    const query=[fuelNames[fuel], `${oxygen}% oxygen`, duration, flow, heatPath, ...sensors].join(' ');
    const scenarioRanked=rank(query,lensSelect.value).slice(0,3);
    const sourceDetails=document.createElement('details');sourceDetails.className='scenario-sources';
    const sourceSummary=document.createElement('summary');sourceSummary.textContent=`Inspect ${scenarioRanked.length} matching NASA findings`;sourceDetails.append(sourceSummary);
    scenarioRanked.forEach(({item,value,hits})=>sourceDetails.append(makeCard({item,value,hits})));findings.append(sourceDetails);
    const note = () => {
      const title=directMatch?'Structural analogue; oxygen in broad test band':structuralMatch?'Structural analogue; oxygen outside test band':coverage>=3?'Related conditions; no direct match':'Evidence coverage gap';
      const date=new Date().toISOString().slice(0,10);
      return `FIRELINE ATLAS — MISSION REVIEW NOTE\nGenerated ${date}\n\nSCENARIO\nFuel / geometry: ${fuelNames[fuel]}\nInitial oxygen: ${oxygen}%\nBurn duration: ${duration}\nVentilation label: ${flow} (qualitative only)\nHeat path: ${heatPath}\nSelected channels: ${sensors.length?sensors.join(', '):'none'}\n\nEVIDENCE MATCH\n${title}\nFields represented in curated notes: ${coverage}/4\n${summary.textContent}\n\nREVIEW PROMPTS\n${prompts.map(p=>`• ${p}`).join('\n')}\n\nLIMITATION\nThis is evidence matching, not a predictive risk score, ignition probability, fire-growth model, material qualification, or substitute for spacecraft procedures. The source does not report the specific oxygen level for the window-damage case. Qualitative flow labels are not measured NASA test values.\n\nPRIMARY SOURCE\nNASA/TM-20210011385, p. 8\nhttps://ntrs.nasa.gov/citations/20210011385\n`;
    };
    document.querySelector('#download-brief').onclick=()=>{
      const blob=new Blob([note()],{type:'text/plain;charset=utf-8'});
      const url=URL.createObjectURL(blob); const link=document.createElement('a');
      link.href=url; link.download='fireline-mission-review-note.txt'; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
    };
  }
  oxygenSlider.addEventListener('input',()=>{oxygenOutput.value=`${oxygenSlider.value}%`;oxygenOutput.textContent=`${oxygenSlider.value}%`;});
  scenarioForm.addEventListener('submit',runScenario);
  runScenario();
  askButton.addEventListener('click',render);
  input.addEventListener('keydown',event=>{if(event.key==='Enter')render();});
  filter.addEventListener('change',render);
  lensSelect.addEventListener('change',render);
  promptButtons.forEach(button=>button.addEventListener('click',()=>{input.value=button.dataset.prompt;render();input.focus();}));
  const transferForm=document.querySelector('#transfer-form');
  const transferPreset=document.querySelector('#transfer-preset');
  const transferO2=document.querySelector('#transfer-o2');
  const transferPressure=document.querySelector('#transfer-pressure');
  const transferGravity=document.querySelector('#transfer-gravity');
  const transferFamily=document.querySelector('#transfer-family');
  function assessTransfer(event){
    if(event)event.preventDefault();
    const o2=Number(transferO2.value),pressure=Number(transferPressure.value),gravity=Number(transferGravity.value),family=transferFamily.value;
    const axes=[
      ['OXYGEN',o2>=14&&o2<=21?`Within the approximate 14–21% BASS-II band (${o2}%).`:`Outside the approximate 14–21% BASS-II band (${o2}%).`,o2>=14&&o2<=21],
      ['GRAVITY',gravity===0?'Aligned with microgravity BASS-II context.':`Target is ${gravity} g; the curated BASS-II comparison does not represent this partial/normal-gravity level.`,gravity===0],
      ['PRESSURE',`Target ${pressure} psi; exact BASS-II pressure is not captured in this curated evidence note.`,false],
      ['FUEL / FLAME FAMILY',family==='solid'?'Solid-material focus aligns with BASS-II; verify actual material and geometry.':'Gaseous flame selected; BASS-II solid-fuel notes do not directly cover this family.',family==='solid']
    ];
    const gaps=axes.filter(axis=>!axis[2]);
    document.querySelector('#transfer-title').textContent=gaps.length?`${gaps.length} transfer gap${gaps.length===1?'':'s'} to resolve`:'Conditions overlap the curated BASS-II context';
    document.querySelector('#transfer-summary').textContent=gaps.length?`A result from this evidence set cannot be transferred directly to the selected mission case. Prioritize: ${gaps.map(axis=>axis[0].toLowerCase()).join(', ')}. Use a mission-matched test or source record before drawing conclusions.`:'This is a context overlap only, not proof of equivalent outcomes or a safety determination. Confirm the sample, flow, pressure, and measurement conditions against the original NASA run records.';
    const list=document.querySelector('#transfer-axes');
    list.replaceChildren(...axes.map(([label,copy,covered])=>{const row=document.createElement('div');row.className='transfer-axis';const head=document.createElement('div');const strong=document.createElement('strong');strong.textContent=label;const state=document.createElement('span');state.textContent=covered?'IN CONTEXT':'EVIDENCE GAP';state.className=covered?'axis-covered':'axis-gap';head.append(strong,state);const p=document.createElement('p');p.textContent=copy;row.append(head,p);return row;}));
    document.querySelector('#download-transfer').onclick=()=>{const brief=`FIRELINE ATLAS — MISSION EVIDENCE TRANSFER BRIEF\n\nTarget: ${transferPreset.options[transferPreset.selectedIndex].text}\nOxygen: ${o2}%\nPressure: ${pressure} psi\nGravity: ${gravity} g\nEvidence family: ${family==='solid'?'solid material':'gaseous flame'}\n\n${document.querySelector('#transfer-summary').textContent}\n\nAXIS REVIEW\n${axes.map(([label,copy,covered])=>`${label} — ${covered?'IN CONTEXT':'GAP'}: ${copy}`).join('\n')}\n\nRESEARCH PRIORITY\nFind run-level NASA metadata and/or conduct a qualified, mission-matched study that isolates the uncovered axes. Measure pressure, oxygen, gravity, flow, fuel geometry, and synchronized combustion products. Partial-gravity transfer requires validation; do not interpolate these notes into a fire prediction.\n\nSource context: NASA Space Apps 2026 Flame in Freefall challenge brief; curated BASS-II summary NASA/TM-20210011385.\nhttps://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/\nhttps://ntrs.nasa.gov/citations/20210011385\n`;
      const url=URL.createObjectURL(new Blob([brief],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='fireline-mission-transfer-gap-brief.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  }
  transferPreset.addEventListener('change',()=>{const preset=transferPreset.value;if(preset==='lunar'){transferO2.value='30';transferPressure.value='10.2';transferGravity.value='0.16';}else if(preset==='mars'){transferGravity.value='0.38';}else if(preset==='iss'){transferO2.value='21';transferGravity.value='0';}assessTransfer();});
  transferForm.addEventListener('submit',assessTransfer);
  assessTransfer();
  document.querySelector('#evidence-count').textContent=String(evidence.length).padStart(2,'0');
  render();
})();
