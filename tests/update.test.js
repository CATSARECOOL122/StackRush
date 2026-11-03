/* New versions while the app stays open: the "Update ready" button appears after a round (never in the middle of one),
   pressing it reloads with the progress kept, and the page also notices a newer index.html on its own. */
const assert=require('assert');

/* serves the page, and a changed copy of it once `variant` is set (the "new version" that was just deployed) */
async function openWithServer(e,L,state){
  return L.open(e,{ctx:{serviceWorkers:'block'},setup:async pg=>{
    await pg.route('**/index.html',async route=>{ const r=await route.fetch(); let body=await r.text(); if(state.variant) body=body.replace('</script>',`/* newer ${state.variant} */</script>`); await route.fulfill({response:r,body}); });
  }});
}
const idle=p=>p.evaluate(()=>{ __sr.S.tutSeen=true; __sr.S.assist='off'; for(const k of Object.keys(__sr.MODES)) __sr.S.tips[k]=1; __sr.S.seenTip=true; });

module.exports=[

['update prompt: you finish a round, a newer version is on the server, the button appears on the game-over screen, pressing it reloads and keeps your progress', async(e,L)=>{
  const state={variant:0}, p=await openWithServer(e,L,state); await idle(p);
  assert.equal(await p.evaluate(()=>__sr.updateReady),false); assert.equal(await p.isVisible('#updBtn'),false,'nothing new: no button');
  await p.evaluate(()=>{ __sr.startMode('classic'); }); await p.waitForTimeout(150); await L.perfects(p,3);
  state.variant=1; await p.evaluate(()=>__sr.resetUpdateThrottle());               // a new version is deployed while the round is going on
  await p.waitForTimeout(300); assert.equal(await p.isVisible('#updBtn'),false,'nothing pops up in the middle of a run');
  await L.miss(p); await p.waitForTimeout(1400);
  assert.equal(await p.evaluate(()=>__sr.state),'over'); assert.equal(await p.evaluate(()=>__sr.updateReady),true,'the round ending is when the page looks for a new version');
  assert.ok(await p.isVisible('#updBtn'),'the update button is shown on the game-over screen'); assert.match(await p.textContent('#updBtn'),/Update ready/);
  const coins=await p.evaluate(()=>__sr.S.coins); assert.ok(coins>0,'the round earned coins');
  await p.evaluate(()=>{ __sr.S.coins+=500; });                                       // progress that is not saved yet: pressing the button must save it
  await Promise.all([p.waitForNavigation(),p.click('#updBtn')]); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(()=>__sr.S.coins),coins+500,'progress kept across the update');
  assert.ok(await p.evaluate(()=>[...document.scripts].some(s=>s.textContent.includes('newer 1'))),'the new code is what runs now');
  assert.equal(await p.isVisible('#updBtn'),false,'and the button is gone'); assert.equal(await p.evaluate(()=>__sr.checkForUpdate(true)),false,'it is up to date, no loop');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['update prompt: coming back to the app and the 5-minute limit; an up-to-date page, no network and a failing server never raise it or throw', async(e,L)=>{
  const state={variant:0}, p=await openWithServer(e,L,state); await idle(p);
  state.variant=1;
  assert.equal(await p.evaluate(()=>__sr.checkForUpdate()),false,'checked a moment ago (at start-up), so not again yet'); assert.equal(await p.evaluate(()=>__sr.updateReady),false);
  await p.evaluate(()=>__sr.resetUpdateThrottle()); await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));   // the app comes back to the front
  await p.waitForFunction(()=>__sr.updateReady,null,{timeout:5000}); assert.ok(await p.isVisible('#updBtn'),'seen on the menu');
  await L.close(p);
  const q=await openWithServer(e,L,{variant:0}); await idle(q);
  await q.context().setOffline(true); await q.evaluate(()=>__sr.resetUpdateThrottle());
  assert.equal(await q.evaluate(()=>__sr.checkForUpdate(true)),false,'offline: nothing to check'); await q.context().setOffline(false);
  await q.route('**/index.html',r=>r.fulfill({status:500,body:'oops'}),{times:1}); await q.evaluate(()=>__sr.resetUpdateThrottle());
  assert.equal(await q.evaluate(()=>__sr.checkForUpdate(true)),false,'a failing server is ignored'); assert.equal(await q.evaluate(()=>__sr.updateReady),false);
  assert.deepEqual(q.errs.filter(x=>!/500|Failed to load resource/i.test(x)),[]); await L.close(q);
}],

['update prompt: a new service worker takes over (the usual way an installed app updates): the button waits for the end of a run too', async(e,L)=>{
  const p=await L.open(e);                                                         // service worker allowed, as for a real installed app
  await p.evaluate(()=>navigator.serviceWorker.ready); await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('ready')&&!!navigator.serviceWorker.controller,null,{timeout:10000});
  await idle(p); await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(150);
  await p.evaluate(()=>navigator.serviceWorker.dispatchEvent(new Event('controllerchange')));   // what the browser fires when the new worker takes control
  assert.equal(await p.evaluate(()=>__sr.updateReady),true); assert.equal(await p.isVisible('#updBtn'),false,'hidden while the run is going');
  await L.miss(p); await p.waitForTimeout(1400); assert.ok(await p.isVisible('#updBtn'),'shown when the round is over');
  await p.click('#toMenu'); await p.waitForTimeout(300); assert.ok(await p.isVisible('#updBtn'),'and on the menu'); 
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(200); assert.equal(await p.isVisible('#updBtn'),false,'hidden again when the next run starts');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

];
