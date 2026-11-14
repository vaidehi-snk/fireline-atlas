/* Optional QA: install playwright-core and use an installed Chrome, no browser download. */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.argv[2]||'playwright-core');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.argv[3]||path.join(root,'.qa-output'));
function parseCSV(text){const rows=[];let row=[],value='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(value);value='';}else if((c==='\r'||c==='\n')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);rows.push(row);row=[];value='';}else value+=c;}if(value||row.length){row.push(value);rows.push(row);}return rows;}
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.FIRELINE_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[],checks=[];
 page.on('pageerror',error=>errors.push(error.message));
 const pass=name=>checks.push(name);
 async function download(locator,name){const waiting=page.waitForEvent('download');await locator.click();const file=await waiting;const destination=path.join(out,name);await file.saveAs(destination);return fs.readFile(destination);}
 try{
  await page.goto(pathToFileURL(path.join(root,'index.html')).href);
  await page.locator('#lab-nasa').click();
  await page.waitForFunction(()=>document.getElementById('lab-status').textContent.includes('11 frames analyzed'));
  assert.equal(await page.locator('#lab-case-info').isVisible(),true);
  assert.match(await page.locator('#lab-status').innerText(),/REAL NASA CONTACT-SHEET CASE/);
  assert.equal(await page.locator('#lab-dt').getAttribute('readonly'),'');
  assert.equal(await page.locator('#lab-scale').inputValue(),'');pass('NASA B3 loads 11 real frames with explicit uncalibrated/source-time mode');
  const metrics=await page.locator('#lab-metrics').innerText();assert.doesNotMatch(metrics,/Insufficient data/);
  await page.locator('#lab-frame').fill('10');await page.locator('#lab-frame').dispatchEvent('input');
  await page.waitForFunction(()=>document.getElementById('lab-frame-name').textContent.includes('iss038e051294'));
  assert.match(await page.locator('#lab-frame-name').innerText(),/21\.000 s.*12:20:58/);pass('Frame inspection preserves original photo clock and 21-second elapsed span');
  const imageCSV=parseCSV((await download(page.locator('#lab-export'),'nasa-b3-analysis.csv')).toString('utf8'));
  assert.equal(imageCSV.length,12);const columns=imageCSV[0],idx=name=>columns.indexOf(name);
  assert.deepEqual(imageCSV.slice(1).map(row=>Number(row[idx('time_s')])),[0,2,4,7,9,11,13,15,18,20,21]);
  assert.ok(imageCSV.slice(1).every(row=>row[idx('synthetic')]==='false'&&row[idx('seconds_per_frame')]===''&&row[idx('source_sha256')].length===64));pass('Measurement export retains unequal source timestamps, real-data flag, and source hash');
  await page.screenshot({path:path.join(out,'nasa-lab-desktop.png'),fullPage:true});
  await page.locator('#lab-case-record').click();await page.waitForFunction(()=>document.querySelector('#data-rows').children.length===1);
  assert.match(await page.locator('#data-rows').innerText(),/B3.*Bhattacharjee/s);pass('Image case links to its exact B3 experimental-table record');
  await page.locator('#data-reset').click();assert.equal(await page.locator('#data-rows tr').count(),129);assert.equal(await page.locator('#data-plot circle').count(),120);pass('Original-table view renders all 129 records and 120 exact numeric plot observations');
  await page.locator('#data-query').fill('no-matching-material-xyz');assert.match(await page.locator('#data-rows').innerText(),/No records/);assert.equal(await page.locator('#data-export').isDisabled(),true);pass('Empty filters disable export and show an explicit empty state');
  await page.locator('#data-reset').click();await page.locator('#data-min').fill('23');assert.match(await page.locator('#data-summary').innerText(),/Minimum oxygen/);assert.equal(await page.locator('#data-export').isDisabled(),true);pass('Invalid oxygen filter bounds are rejected');
  await page.locator('#data-reset').click();
  const tableCSV=parseCSV((await download(page.locator('#data-export'),'filtered-nasa-records.csv')).toString('utf8'));
  assert.equal(tableCSV.length,130);assert.ok(tableCSV[0].includes('source_sha256'));assert.ok(tableCSV.some(row=>row.includes('OR')));assert.ok(tableCSV.some(row=>row.includes('>500')));pass('Filtered export preserves all original records, censor strings, and provenance columns');
  const original=await download(page.getByRole('link',{name:'Download unchanged NASA CSV'}),'original-nasa.csv');
  assert.equal(crypto.createHash('sha256').update(original).digest('hex'),'71e792bf6b5fb5ea620c5dd70fbbac05515992e12aefcf5dff47312caa48c042');pass('Original NASA CSV download is byte-identical to archived source');
  await page.locator('[data-workspace="mission"]').click();await page.locator('#transfer-preset').selectOption('lunar');assert.equal(await page.locator('#transfer-o2').inputValue(),'30');assert.equal(await page.locator('#transfer-pressure').inputValue(),'10.2');assert.match(await page.locator('#transfer-title').innerText(),/3 transfer gaps/);
  await page.locator('#transfer-preset').selectOption('iss');assert.match(await page.locator('#transfer-title').innerText(),/1 transfer gap/);
  await page.locator('#transfer-preset').selectOption('mars');assert.match(await page.locator('#transfer-title').innerText(),/2 transfer gaps/);pass('Lunar, ISS, and Mars presets recompute evidence gaps');
  await page.locator('[data-workspace="evidence"]').click();await page.getByRole('button',{name:'Oxygen & heat',exact:true}).click();assert.match(await page.locator('#answer-title').innerText(),/Oxygen/);pass('Question prompts update the deterministic evidence synthesis');
  await page.setViewportSize({width:390,height:844});
  for(const view of ['lab','mission','evidence']){await page.locator(`[data-workspace="${view}"]`).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${view} overflows mobile viewport`);}pass('All three workspaces fit the 390-pixel viewport');
  await page.screenshot({path:path.join(out,'nasa-evidence-mobile.png'),fullPage:true});
  assert.deepEqual(errors,[]);pass('No uncaught page errors');
  const result={date:new Date().toISOString(),checks,metrics,browserErrors:errors,note:'Pipeline and UI verification on reproduced NASA contact-sheet images; not validation against independent boundary annotations or physical flame-spread rates.'};
  await fs.writeFile(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
