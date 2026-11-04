/* Square return address and the unlock code (the iPhone Home Screen app has its own storage, so a purchase made in Safari is carried over by a code). */
const assert=require('assert');
module.exports=[
['unlock: the return address unlocks the item and the address is cleaned; the code carries owned premium items to another device; junk codes do nothing', async(e,L)=>{
  const p=await L.open(e); await p.goto(`http://127.0.0.1:${e.port}/index.html?unlock=style:foil#debug`); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(()=>location.search),''); assert.ok(await p.evaluate(()=>__sr.S.shop.owned.includes('style:foil')));
  assert.ok(await p.isVisible('#udlg'),'a popup says what was unlocked'); assert.match(await p.textContent('#udTitle'),/Foil Block Style|Foil/); assert.match(await p.textContent('#udCode'),/^SR-[0-9A-Z]{4}$/,'the code is shown (browser)');
  await p.click('#udOk'); assert.equal(await p.isVisible('#udlg'),false);
  await p.goto(`http://127.0.0.1:${e.port}/index.html?unlock=gold#debug`); await p.waitForFunction(()=>document.body.classList.contains('ready'));
  const code=await p.evaluate(()=>__sr.unlockCode()); assert.match(code,/^SR-[0-9A-Z]{4}$/);
  const q=await L.open(e); assert.equal(await q.evaluate(()=>__sr.S.owned.includes('gold')),false);
  assert.equal(await q.evaluate(c=>__sr.redeemCode(c),code),2,'both items unlock'); assert.ok(await q.evaluate(()=>__sr.S.owned.includes('gold')&&__sr.S.shop.owned.includes('style:foil')));
  assert.equal(await q.evaluate(c=>__sr.redeemCode(c),code),0,'again: nothing new');
  for(const bad of ['','SR-0000','SR-ZZZZ','sr-1','<b>','SR-01XX','SR-0099']) assert.equal(await q.evaluate(c=>__sr.redeemCode(c),bad),-1,bad);
  assert.deepEqual(p.errs,[]); await L.close(p); await L.close(q);
}],

['square: the five premium items have real Square checkout links and the Buy button opens them on the web, never in the Android app', async(e,L)=>{
  const p=await L.open(e,{links:true}); const l=await p.evaluate(()=>({...__sr.SQUARE_LINKS}));
  assert.deepEqual(Object.keys(l).sort(),['cyber','galaxy','gold','style:foil','topper:gold']); for(const v of Object.values(l)) assert.match(v,/^https:\/\/square\.link\/u\/[A-Za-z0-9]+$/); assert.equal(new Set(Object.values(l)).size,5);
  assert.equal(await p.evaluate(()=>__sr.coinsTabOn()),false,'coins are not sold on the web yet'); await L.close(p);
}],

['unlock: the popup copies the code when it can; inside the Home Screen app it just says unlocked; the Shop has a paste box that redeems and rejects junk', async(e,L)=>{
  const p=await L.open(e,{ctx:{permissions:['clipboard-read','clipboard-write']}}); await p.evaluate(()=>{ __sr.S.owned.push('gold'); __sr.openUnlockDlg('done','gold'); }); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(()=>navigator.clipboard.readText()),await p.evaluate(()=>__sr.unlockCode()),'copied automatically'); assert.equal(await p.textContent('#udCopy'),'Code copied');
  await p.click('#udOk');
  await p.evaluate(()=>{ Object.defineProperty(navigator,'standalone',{value:true,configurable:true}); __sr.openUnlockDlg('done','gold'); }); assert.equal(await p.isVisible('#udCode'),false,'in the app: no code to copy'); assert.match(await p.textContent('#udText'),/saved on this device/); await p.click('#udOk');
  await p.click('#openThemes'); assert.ok(await p.isVisible('#tGrid [data-act=redeem]'),'a paste button at the bottom of the shop'); await p.click('#tGrid [data-act=redeem]'); assert.ok(await p.isVisible('#udInput'));
  await p.fill('#udInput','nonsense'); await p.click('#udOk'); assert.ok(await p.isVisible('#udlg'),'junk keeps the box open'); assert.match(await p.textContent('#udMsg'),/didn't work/);
  const q=await L.open(e); await q.evaluate(()=>{ __sr.S.owned.push('galaxy'); }); const code=await q.evaluate(()=>__sr.unlockCode());
  await p.fill('#udInput',code.toLowerCase()); await p.click('#udOk'); await p.waitForTimeout(200); assert.equal(await p.isVisible('#udlg'),false); assert.ok(await p.evaluate(()=>__sr.S.owned.includes('galaxy')),'redeemed');
  await p.click('#tGrid [data-act=redeem]'); await p.evaluate(()=>history.back()); await p.waitForTimeout(300); assert.equal(await p.isVisible('#udlg'),false,'Back closes it');
  assert.deepEqual(p.errs,[]); await L.close(p); await L.close(q);
}],
];
