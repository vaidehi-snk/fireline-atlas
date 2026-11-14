/* Coordinates come directly from NASA's experimental table. Filters follow NASA Evidence. */
window.renderOutcomeMap = function (records, numeric, oxygenField, inspect) {
  const svg = document.querySelector('#outcome-map');
  const picker = document.querySelector('#map-test');
  const ns = 'http://www.w3.org/2000/svg';
  const colors = {
    'camera loss with radiometer drop': '#80d8cc',
    'visible near observation end': '#ffa967',
    'inconclusive': '#c79bf4',
    'unmeasured': '#98a4ac'
  };
  const points = records.map(record => {
    const raw = record.raw;
    const result = window.FIRELINE_VIDEO.tests[raw['Test #'].trim()];
    return { record, oxygen: numeric(raw[oxygenField]), air: numeric(raw['Air display']),
      status: result?.trace ? result.status : 'unmeasured' };
  }).filter(p => p.oxygen !== null && p.air !== null);
  svg.replaceChildren();
  picker.replaceChildren(new Option('Choose a plotted test', ''));
  picker.disabled = !points.length;
  const byId = new Map();
  for (const p of points) {
    const id = p.record.raw['Test #'];
    byId.set(id, p);
    picker.add(new Option(`${id} · ${p.oxygen}% O₂ · ${p.air} cm/s · ${p.status}`, id));
  }
  function select(id) {
    picker.value = id;
    if (byId.has(id)) inspect(byId.get(id).record);
  }
  picker.onchange = () => select(picker.value);
  function draw(tag, attrs, text) {
    const el = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (text !== undefined) el.textContent = text;
    svg.append(el);
    return el;
  }
  const x = oxygen => 45 + (oxygen - 12) * 30;
  const y = air => 205 - air * 10;
  for (const air of [0, 5, 10, 15]) {
    draw('line', {x1:45, x2:600, y1:y(air), y2:y(air), stroke:'#34494d'});
    draw('text', {x:35,y:y(air)+4,'text-anchor':'end'},air);
  }
  for (const oxygen of [12,15,18,21,24,27,30]) draw('text',{x:x(oxygen),y:227,'text-anchor':'middle'},oxygen);
  draw('text',{x:45,y:19},'Duct air display (cm/s)');
  draw('text',{x:322,y:249,'text-anchor':'middle'},'Calibrated initial oxygen (% by volume)');
  draw('line',{x1:x(30),x2:x(30),y1:32,y2:207,stroke:'#f8d58d','stroke-dasharray':'4 4'});
  draw('text',{x:x(30)-7,y:42,'text-anchor':'end',fill:'#f8d58d'},'30% lunar scenario');
  // Concentric rings keep coincident tests at their true coordinates.
  const groups = new Map();
  for (const p of points) {
    const key = [p.oxygen,p.air].join('/');
    if (!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(p);
  }
  for (const group of groups.values()) {
    group.forEach((p,i) => {
      const id = p.record.raw['Test #'];
      const dot = draw('circle',{cx:x(p.oxygen),cy:y(p.air),r:4+(group.length-1-i)*3,
        fill:colors[p.status] || colors.inconclusive,stroke:'#122326','stroke-width':1});
      const title = document.createElementNS(ns,'title');
      title.textContent = `${id} · ${p.oxygen}% · ${p.air} cm/s · ${p.status}`;
      dot.append(title);
      dot.onclick = () => select(id);
    });
  }
  document.querySelector('#map-count').textContent =
    `${points.length} of ${records.length} selected records plotted. ${records.length-points.length} lack a single numeric oxygen or airflow value. Rings share the same coordinates.`;
};
