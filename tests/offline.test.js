const assert=require('assert');
module.exports=[

['the service worker precaches the app and all 12 language packs; the game reloads offline', async(e,L)=>{
  const p=await L.open(e,{ctx:{locale:'es-ES'}});
  await p.evaluate(async()=>{ await navigator.serviceWorker.ready; }); await p.waitForTimeout(1500);
  const c=await p.evaluate(async()=>{ const ks=await caches.keys(); const cache=await caches.open(ks[0]); const reqs=await cache.keys(); return {n:reqs.length,langs:reqs.filter(r=>r.url.includes('/lang/')).length}; });
  assert.equal(c.langs,12,'12 language packs cached'); assert.ok(c.n>=20);
  await p.ctx.setOffline(true); await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(()=>__sr.lang),'es'); assert.equal((await p.textContent('#play span')).trim(),'JUGAR');
  // switching language still works offline
  await p.click('#openSettings'); await p.click('[data-set=language]'); await p.click('.lang[data-lang=ja]'); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(()=>__sr.lang),'ja');
  await p.goto(e.url().replace('index.html#debug','privacy.html')); assert.match(await p.title(),/Privacy/);
  await L.close(p);
}],

];
