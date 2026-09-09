(() => {
  'use strict';
  let scheduled=false;
  const isHubRoute=()=>/^#\/employer\/[^/]+\/cohort\/[^/]+$/.test(String(location.hash||'').split('?')[0].replace(/\/$/,''));
  function repair(){
    const main=document.querySelector('#app main#main');
    if(!main)return;
    if(!isHubRoute()){
      main.removeAttribute('data-cm-cohort-hub');
      return;
    }
    if(main.dataset.cmCohortHub && !main.querySelector('.cm-cohort-hub')) main.removeAttribute('data-cm-cohort-hub');
  }
  function schedule(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;repair();},0);}
  window.addEventListener('hashchange',schedule,true);
  const app=document.getElementById('app');
  if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  schedule();
})();