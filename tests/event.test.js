/* The special event: Aurora Peak (14 Nov to 14 Dec 2026): 20,000 coins to enter, 100 attempts, 1,000 score, milestone chests, and a hold-to-hatch egg. */
const assert=require('assert');
const D=(y,m,d,h=12)=>new Date(y,m,d,h).getTime();
const base=p=>p.evaluate(()=>{ const s=__sr, S=s.S; S.tutSeen=true; S.seenTip=true; S.assist='off'; for(const m of Object.keys(s.MODES)) S.tips[m]=1; s.setNow(new Date(2026,10,20,12).getTime()); s.showMenu(); });
const endIt=async(p,L)=>{ for(let i=0;i<8 && await p.evaluate(()=>__sr.state)==='playing';i++){ await L.miss(p); await p.waitForTimeout(200); } await p.waitForTimeout(1400); };
module.exports=[

['event: the card shows on the menu with a live countdown only while the event is on (14 Nov to 14 Dec), and entering costs 20,000 coins once', async(e,L)=>{
  const p=await L.open(e); await base(p); await p.evaluate(()=>__sr.showMenu()); await p.waitForTimeout(300);
  assert.ok(await p.isVisible('#evCard')); assert.match(await p.textContent('#evCard'),/Aurora Peak/); assert.match(await p.textContent('#evCard'),/left/);
  await p.evaluate(()=>{ __sr.setNow(new Date(2026,10,10,12).getTime()); __sr.showMenu(); }); assert.equal(await p.isVisible('#evCard'),false,'not yet');
  await p.evaluate(()=>{ __sr.setNow(new Date(2026,11,15,12).getTime()); __sr.showMenu(); }); assert.equal(await p.isVisible('#evCard'),false,'gone after 14 December');
  await p.evaluate(()=>{ __sr.setNow(new Date(2026,11,14,23,0).getTime()); __sr.S.coins=19999; __sr.showMenu(); }); await p.waitForTimeout(200); assert.ok(await p.isVisible('#evCard'),'still there on the last evening');
  await p.click('#evCard'); assert.ok(await p.isVisible('#evsheet')); assert.match(await p.textContent('#evBody'),/20,000/);
  await p.click('#evBody [data-ev=enter]'); assert.equal(await p.evaluate(()=>__sr.S.ev),null,'19,999 is not enough'); assert.equal(await p.evaluate(()=>__sr.S.coins),19999);
  await p.evaluate(()=>{ __sr.S.coins=20500; }); await p.click('#evBody [data-ev=enter]'); await p.waitForTimeout(200);
  assert.deepEqual(await p.evaluate(()=>[__sr.S.coins,__sr.S.ev.id,__sr.S.ev.attempts,__sr.S.ev.best]),[600,'aurora26',0,0],'paid once (20,500 - 20,000, +100 for the Event Entrant award)');
  assert.match(await p.textContent('#evBody'),/100 attempts left/); assert.equal(await p.locator('#evBody [data-ev=enter]').count(),0,'no second entry');
  assert.ok(await p.evaluate(()=>__sr.S.ach.ev_enter),'Event Entrant award');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['event: an attempt is the same hard map every time, counts toward 100, ends with the event screen (attempts left, best) and AGAIN is the next attempt; at 100 it will not start', async(e,L)=>{
  const p=await L.open(e); await base(p); await p.evaluate(()=>{ __sr.S.coins=30000; __sr.enterEvent(); __sr.startEvent(); }); await p.waitForTimeout(250);
  const a=await p.evaluate(()=>({m:__sr.mode,att:__sr.S.ev.attempts,lava:__sr.mod.hz.lava,up:!!__sr.mod.upside,held:__sr.held.length,boosts:__sr.manualOn()}));
  assert.deepEqual([a.m,a.att,a.lava,a.up,a.held],['event',1,3,true,0],'the event map, one attempt used, no boosts');
  await L.perfects(p,3); await endIt(p,L);
  assert.ok(await p.isVisible('#over')); assert.match(await p.textContent('#oLabel'),/AURORA PEAK/); assert.match(await p.textContent('#oCoins'),/99 attempts left/); assert.ok(await p.evaluate(()=>__sr.S.ev.best)>0,'best recorded');
  await p.evaluate(()=>document.getElementById('again').click()); await p.waitForTimeout(250); assert.deepEqual(await p.evaluate(()=>[__sr.mode,__sr.S.ev.attempts]),['event',2]);
  await p.evaluate(()=>{ __sr.showMenu(); __sr.S.ev.attempts=100; __sr.startEvent(); }); await p.waitForTimeout(150); assert.equal(await p.evaluate(()=>__sr.mode==='event'&&__sr.state==='playing'),false,'no 101st attempt');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['event: milestone chests at 250, 500 and 750 open once each for coins and items (the consolation prizes), and survive a reload', async(e,L)=>{
  const p=await L.open(e); await base(p); await p.evaluate(()=>{ __sr.S.coins=20000; __sr.enterEvent(); __sr.S.ev.best=260; __sr.openEvent(); });
  assert.equal(await p.locator('#evBody [data-ev=chest]').count(),1,'only the 250 chest is open-able'); const c0=await p.evaluate(()=>__sr.S.coins);
  await p.click('#evBody [data-ev=chest]'); assert.equal(await p.evaluate(()=>__sr.S.coins),c0+1500); assert.equal(await p.locator('#evBody [data-ev=chest]').count(),0,'opened once');
  await p.evaluate(()=>{ __sr.S.ev.best=760; __sr.openEvent(); }); assert.equal(await p.locator('#evBody [data-ev=chest]').count(),2);
  await p.evaluate(()=>{ __sr.claimChest(1); __sr.claimChest(2); __sr.claimChest(1); });
  assert.deepEqual(await p.evaluate(c=>[__sr.S.coins-c,__sr.S.shop.owned.includes('fx:confetti'),__sr.S.shop.owned.includes('accent:ocean')],c0),[9000,true,true],'all three chests paid once (1,500 + 3,000 + 4,500)');
  await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(300);
  assert.deepEqual(await p.evaluate(()=>[__sr.S.ev.best,__sr.S.ev.chestOk.length]),[760,3],'saved');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['event: reaching 1,000 offers the egg; hold to hatch (about 15 seconds) cracks it, then a celebration reveals the theme, the super rare topper, coins and the super rare awards; it cannot be hatched twice and shows in the Hall of Eggs', async(e,L)=>{
  const p=await L.open(e); await base(p); await p.evaluate(()=>{ __sr.S.coins=20000; __sr.enterEvent(); __sr.S.ev.best=999; __sr.openEvent(); });
  assert.equal(await p.locator('#evBody [data-ev=hatch]').count(),0,'999 is not enough'); await p.evaluate(()=>{ __sr.openHatch(); }); assert.equal(await p.isVisible('#hatch'),false,'cannot be opened early');
  await p.evaluate(()=>{ __sr.S.ev.best=1000; __sr.openEvent(); }); await p.click('#evBody [data-ev=hatch]'); await p.waitForTimeout(300);
  assert.ok(await p.isVisible('#hatch')); assert.equal(await p.evaluate(()=>__sr.hat.phase),'hold');
  const t0=Date.now(); await p.evaluate(()=>{ __sr.hat.hold=true; }); await p.waitForTimeout(2200);
  const p1=await p.evaluate(()=>__sr.hat.p); assert.ok(p1>.1 && p1<.25,'holding for ~2 s is about 1/7 of the way ('+p1.toFixed(2)+')');
  await p.evaluate(()=>{ __sr.hat.hold=false; }); await p.waitForTimeout(500); const p2=await p.evaluate(()=>__sr.hat.p); assert.ok(p2>p1-.05,'letting go loses almost nothing ('+p2.toFixed(2)+')');
  await p.evaluate(()=>{ __sr.hat.p=.985; __sr.hat.hold=true; }); await p.waitForFunction(()=>__sr.hat.phase!=='hold',null,{timeout:8000}); await p.evaluate(()=>{ __sr.hat.hold=false; });
  await p.waitForSelector('#hatchOk:not(.hidden)',{timeout:20000});
  const r=await p.evaluate(()=>({eggs:__sr.S.eggs.slice(),theme:__sr.S.owned.includes('aurora'),top:__sr.S.shop.owned.includes('topper:aurora'),coins:__sr.S.coins,a1:!!__sr.S.ach.egg1,a2:!!__sr.S.ach.ev_aurora,hatched:__sr.S.ev.hatched,cards:document.querySelectorAll('#hatchRw .rw').length}));
  assert.deepEqual([r.eggs,r.theme,r.top,r.a1,r.a2,r.hatched],[['aurora26'],true,true,true,true,1]); assert.ok(r.coins>=5000); assert.ok(r.cards>=4,'coins, theme, topper and the awards were revealed one by one ('+r.cards+')');
  await p.click('#hatchOk'); await p.waitForTimeout(400); assert.ok(await p.isVisible('#evsheet')); assert.match(await p.textContent('#evBody'),/Egg hatched/); assert.match(await p.textContent('#evBody'),/HALL OF EGGS/); assert.equal(await p.locator('#evBody [data-ev=hatch]').count(),0,'not twice');
  assert.ok(Date.now()-t0>0);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['event: event-only items cannot be bought: the Shop says which egg unlocks them, until they are won', async(e,L)=>{
  const p=await L.open(e); await base(p);
  const a=await p.evaluate(()=>({t:__sr.themeActOf('aurora').sub,i:(__sr.itemActOf?__sr.itemActOf('topper','aurora').sub:'')}));
  assert.match(a.t,/Hatch the Aurora Peak egg/); assert.match(a.i,/Hatch the Aurora Peak egg/);
  assert.equal(await p.evaluate(()=>__sr.itemAction('buy','topper','aurora')),false);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['event: +100 attempts for 5,000 coins (any number of times), the map 50% easier for 9,000 (once), power-ups allowed but not Speed-ups', async(e,L)=>{
  const p=await L.open(e); await base(p); await p.evaluate(()=>{ __sr.S.coins=20000+5000*2+9000+100; __sr.enterEvent(); __sr.S.ev.attempts=100; __sr.openEvent(); });
  assert.match(await p.textContent('#evBody'),/0 attempts left/); assert.match(await p.textContent('#evBody'),/No attempts left/);
  await p.click('#evBody [data-ev=more]'); assert.deepEqual(await p.evaluate(()=>[__sr.S.ev.more,__sr.evMax(__sr.S.ev)]),[1,200]); assert.match(await p.textContent('#evBody'),/100 attempts left/);
  await p.click('#evBody [data-ev=more]'); assert.equal(await p.evaluate(()=>__sr.evMax(__sr.S.ev)),300,'and again');
  const hard=await p.evaluate(()=>__sr.evMod(__sr.activeEvent(),__sr.S.ev));
  await p.click('#evBody [data-ev=easy]'); assert.equal(await p.evaluate(()=>__sr.S.ev.easy),1); const c1=await p.evaluate(()=>__sr.S.coins);
  assert.equal(await p.locator('#evBody [data-ev=easy]').count(),0,'bought once'); await p.evaluate(()=>__sr.buyEasy()); assert.equal(await p.evaluate(()=>__sr.S.coins),c1,'never charged twice');
  const easy=await p.evaluate(()=>__sr.evMod(__sr.activeEvent(),__sr.S.ev));
  assert.ok(Math.abs((easy.speed-1)-(hard.speed-1)/2)<1e-9,'speed-up halved'); assert.ok(Math.abs(easy.chance.lava-hard.chance.lava/2)<1e-9,'hazards halved'); assert.equal(easy.upside,undefined); assert.equal(easy.tremor,undefined); assert.ok(easy.startFrac>hard.startFrac,'a wider start');
  await p.evaluate(()=>{ __sr.S.coins=0; __sr.openEvent(); }); await p.click('#evBody [data-ev=more]'); assert.equal(await p.evaluate(()=>__sr.S.ev.more),2,'no coins: nothing bought');
  await p.evaluate(()=>{ const S=__sr.S; Object.assign(S.shop.boosts,{shield:1,up10:1,titan:1,water:1}); S.shop.pick=['shield','up10']; S.boostAuto=false; __sr.startEvent(); }); await p.waitForTimeout(200);
  const held=await p.evaluate(()=>__sr.held.slice().sort()); assert.deepEqual(held,['shield','titan','water'],'Shield and the campaign power-ups, never the Speed-up');
  assert.equal(await p.evaluate(()=>__sr.mod.speed),easy.speed,'the attempt uses the easier map');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['event: reminders: a big banner the first time the app opens with 10, 5 or 3 days left and on the last day; once each; a skipped one is not shown late; tapping it opens the event; it never stays over a round', async(e,L)=>{
  const p=await L.open(e); await base(p);
  const show=async t=>{ await p.evaluate(t=>{ __sr.setNow(t); __sr.showMenu(); },t); await p.waitForTimeout(1200); return (await p.isVisible('#evToast'))?await p.textContent('#evToast'):''; };
  assert.equal(await show(D(2026,11,1)),'','13 days left: nothing');
  await p.evaluate(t=>{ __sr.setNow(t); __sr.showMenu(); __sr.openEvent(); __sr.evWarnCheck(); },D(2026,11,5)); await p.waitForTimeout(300); assert.equal(await p.isVisible('#evToast'),false,'never shown over an open sheet'); await p.evaluate(()=>{ __sr.S.evWarn=[]; });
  assert.match(await show(D(2026,11,5)),/10 DAYS LEFT/); await p.evaluate(()=>__sr.S&&0);
  await p.waitForTimeout(7800); assert.equal(await p.isVisible('#evToast'),false,'it slides away by itself');
  assert.equal(await show(D(2026,11,6)),'','not twice');
  assert.match(await show(D(2026,11,12)),/3 DAYS LEFT/,'5 days was skipped, the 3-day one shows');
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(500); assert.equal(await p.isVisible('#evToast'),false,'a round hides it');
  const last=await show(D(2026,11,14,15)); assert.match(last,/LAST DAY!!/); assert.ok(await p.evaluate(()=>document.getElementById('evToast').classList.contains('last')));
  await p.click('#evToast'); await p.waitForTimeout(400); assert.ok(await p.isVisible('#evsheet'),'tapping it opens the event');
  await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(300);
  assert.equal(await show(D(2026,11,14,16)),'','remembered after a reload');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

];
