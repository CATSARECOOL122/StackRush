/* The Coins sheet (tap the coin counter on the menu) and the shop's scrolling tab strip. */
const assert=require('assert');
module.exports=[
['coins: the counter opens a sheet with the ways to earn and where you stand; the daily reward can be claimed there once; rows lead to the right screens; Back closes it', async(e,L)=>{
  const p=await L.open(e); await p.evaluate(()=>{ __sr.S.coins=77; __sr.S.lastClaim=''; __sr.showMenu(); });
  await p.click('#openCoins'); assert.ok(await p.isVisible('#coinsSheet')); assert.equal(await p.textContent('#csBal'),'77');
  assert.equal(await p.locator('#csEarn [data-go]').count(),7,'seven ways to earn'); assert.match(await p.textContent('#csEarn'),/Daily reward[\s\S]*Weekly missions[\s\S]*Campaign/);
  assert.equal(await p.locator('#csBuy [data-pack]').count(),5,'the Starter pack and four coin packs, as in the Shop'); assert.doesNotMatch(await p.textContent('#csBuy'),/Android/); assert.match(await p.textContent('#csBuy'),/\$0\.99[\s\S]*\$9\.99/);
  await p.click('#csBuy [data-pack=coins_m]'); assert.match(await p.textContent('#toast'),/not connected/,'pressing one does what the Shop does'); assert.equal(await p.evaluate(()=>__sr.S.coins),77);
  await p.click('#csEarn [data-go=claim]'); assert.equal(await p.evaluate(()=>__sr.S.coins),97,'+20 on day one'); assert.equal(await p.textContent('#csBal'),'97');
  await p.click('#csEarn [data-go=claim]'); assert.equal(await p.evaluate(()=>__sr.S.coins),97,'only once a day'); assert.ok(await p.locator('#csEarn .ok').count()>=1);
  await p.click('#csEarn [data-go=awards]'); assert.ok(await p.isVisible('#awards')); assert.equal(await p.isVisible('#coinsSheet'),false);
  await p.click('#closeAwards'); await p.click('#openCoins'); await p.evaluate(()=>history.back()); await p.waitForTimeout(300); assert.equal(await p.isVisible('#coinsSheet'),false,'Back closes it'); assert.ok(await p.isVisible('#menu'));
  await p.click('#openCoins'); await p.click('#csDone'); assert.equal(await p.isVisible('#coinsSheet'),false);
  await p.evaluate(()=>{ __sr.S.tutSeen=true; __sr.S.assist='off'; }); await p.click('#openCoins'); await p.click('#csEarn [data-go=play]'); await p.waitForTimeout(300); assert.equal(await p.evaluate(()=>__sr.state),'playing','Play rounds starts a round');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],
['shop tabs: one scrolling strip with an icon on each tab, the active one gold and scrolled into view, on every phone width', async(e,L)=>{
  for(const w of [320,390,430]){
    const p=await L.open(e,{ctx:{viewport:{width:w,height:800}}}); await p.click('#openThemes');
    for(const tab of ['themes','music','boosts']){
      await p.evaluate(t=>__sr.setTab(t),tab); await p.waitForTimeout(80);
      const r=await p.evaluate(()=>{ const t=document.getElementById('tTabs'), ts=[...t.querySelectorAll('.tab')], on=t.querySelector('.on'), a=on.getBoundingClientRect(), b=t.getBoundingClientRect();
        return {n:ts.length,rows:(Math.max(...ts.map(x=>x.getBoundingClientRect().top))-Math.min(...ts.map(x=>x.getBoundingClientRect().top))<3?1:2),icons:ts.every(x=>x.querySelector('svg')),onVisible:a.left>=b.left-1&&a.right<=b.right+1,h:Math.min(...ts.map(x=>x.getBoundingClientRect().height)),on:on.dataset.tab,page:document.documentElement.scrollWidth<=innerWidth+1}; });
      assert.deepEqual([r.n,r.rows,r.icons,r.onVisible,r.on,r.page],[9,1,true,true,tab,true],`${w}px ${tab} ${JSON.stringify(r)}`); assert.ok(r.h>=44,'big enough to tap');
    }
    await L.close(p);
  }
}],
];
