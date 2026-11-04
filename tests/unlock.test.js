/* Square return address and the unlock code (the iPhone Home Screen app has its own storage, so a purchase made in Safari is carried over by a code). */
const assert=require('assert');
module.exports=[
['unlock: the return address unlocks the item and the address is cleaned; the code carries owned premium items to another device; junk codes do nothing', async(e,L)=>{
  const p=await L.open(e); await p.goto(`http://127.0.0.1:${e.port}/index.html?unlock=style:foil#debug`); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(()=>location.search),''); assert.ok(await p.evaluate(()=>__sr.S.shop.owned.includes('style:foil')));
  assert.ok(await p.isVisible('#settings'),'lands on Settings with the hint');
  await p.goto(`http://127.0.0.1:${e.port}/index.html?unlock=gold#debug`); await p.waitForFunction(()=>document.body.classList.contains('ready'));
  const code=await p.evaluate(()=>__sr.unlockCode()); assert.match(code,/^SR-[0-9A-Z]{4}$/);
  const q=await L.open(e); assert.equal(await q.evaluate(()=>__sr.S.owned.includes('gold')),false);
  assert.equal(await q.evaluate(c=>__sr.redeemCode(c),code),2,'both items unlock'); assert.ok(await q.evaluate(()=>__sr.S.owned.includes('gold')&&__sr.S.shop.owned.includes('style:foil')));
  assert.equal(await q.evaluate(c=>__sr.redeemCode(c),code),0,'again: nothing new');
  for(const bad of ['','SR-0000','SR-ZZZZ','sr-1','<b>','SR-01XX','SR-0099']) assert.equal(await q.evaluate(c=>__sr.redeemCode(c),bad),-1,bad);
  assert.deepEqual(p.errs,[]); await L.close(p); await L.close(q);
}],
];
