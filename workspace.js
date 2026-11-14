(() => {
  const groups={lab:['#flame-lab'],mission:['#workbench','#transfer'],evidence:['#ask','.compare-section','.evidence-section','#method','.sources-strip']};
  const buttons=[...document.querySelectorAll('[data-workspace]')];
  const primary=document.querySelector('.hero-actions .button');primary.href='#flame-lab';primary.textContent='Open Flame Lab →';
  const secondary=document.querySelector('.hero-actions .text-button');secondary.href='#ask';secondary.textContent='Browse NASA evidence →';
  const descriptions={lab:'Start with a method demo, or import experiment images with confirmed timing and calibration.',mission:'Build a scenario, inspect its evidence gaps, and export a review brief or proposed study matrix.',evidence:'Ask a research question, inspect the ranked findings, and follow each claim back to its NASA source.'};
  function select(view,move=false){
    if(!groups[view])view='lab';
    Object.entries(groups).forEach(([name,selectors])=>selectors.forEach(selector=>{const section=document.querySelector(selector);if(section)section.hidden=name!==view;}));
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.workspace===view)));
    document.getElementById('workspace-description').textContent=descriptions[view];
    if(move)requestAnimationFrame(()=>window.scrollTo({left:0,top:document.querySelector('.stat-row').getBoundingClientRect().bottom+window.scrollY,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
  }
  function route(){const hash=location.hash;const view=hash==='#workbench'||hash==='#transfer'?'mission':['#ask','#method','#evidence'].includes(hash)?'evidence':'lab';select(view);}
  buttons.forEach((button,index)=>{button.addEventListener('click',()=>{const view=button.dataset.workspace;history.pushState(null,'',groups[view][0]);select(view,true);});button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%buttons.length;else if(event.key==='ArrowLeft')next=(index+buttons.length-1)%buttons.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=buttons.length-1;else return;event.preventDefault();buttons[next].focus();buttons[next].click();});});
  document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',()=>{const hash=link.getAttribute('href');if(['#ask','#method'].includes(hash))select('evidence');else if(['#workbench','#transfer'].includes(hash))select('mission');else if(hash==='#flame-lab')select('lab');}));
  addEventListener('hashchange',route);addEventListener('popstate',route);route();
})();
