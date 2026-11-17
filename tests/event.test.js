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
  assert.ok(await p.isVisible('#evBody .evneed'),'the sheet itself says why, right away (not hidden behind it)'); assert.match(await p.textContent('#evBody .evneed'),/19,999 of 20,000 coins. 1 more to go/);
  await p.click('#evBody [data-ev=coins]'); await p.waitForTimeout(300); assert.ok(await p.isVisible('#coinsSheet'),'Get coins opens the coins sheet'); await p.click('#csDone'); await p.click('#evCard');
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
  await p.click('#evBody [data-ev=more]'); assert.equal(await p.evaluate(()=>__sr.S.ev.more||0),0,'the first tap only warns about the bonus'); assert.match(await p.textContent('#evBody'),/gives up the 50,000 coin bonus/);
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

['event: hatching within the first 100 attempts (no extra attempts bought) pays a 50,000 coin bonus, and the player is told; buying more gives it up', async(e,L)=>{
  const p=await L.open(e); await base(p); await p.evaluate(()=>{ __sr.S.coins=20000; __sr.enterEvent(); __sr.openEvent(); });
  assert.match(await p.textContent('#evBody'),/50,000 coins if you hatch it within your first 100 attempts/);
  await p.evaluate(()=>{ __sr.startEvent(); }); await p.waitForTimeout(150);
  await p.evaluate(()=>{ __sr.S.ev.best=0; }); await p.evaluate(()=>{ const st=__sr.S.ev; st.attempts=63; }); 
  await p.evaluate(()=>{ __sr.forceScore && __sr.forceScore(1000); });
  await p.evaluate(()=>{ __sr.endNow && __sr.endNow(); }); await p.waitForTimeout(1500);
  assert.deepEqual(await p.evaluate(()=>[__sr.S.ev.best>=1000,__sr.S.ev.fast]),[true,1],'reached 1,000 in attempt 63 with nothing bought');
  await p.evaluate(()=>{ __sr.showMenu(); __sr.openEvent(); }); assert.match(await p.textContent('#evBody'),/50,000 coins secured/);
  const c0=await p.evaluate(()=>__sr.S.coins);
  await p.evaluate(()=>{ __sr.openHatch(); __sr.hat.p=.999; __sr.hat.hold=true; }); await p.waitForSelector('#hatchOk:not(.hidden)',{timeout:25000});
  const c1=await p.evaluate(()=>__sr.S.coins); assert.ok(c1-c0>=55000,'5,000 + the 50,000 bonus ('+(c1-c0)+')'); assert.match(await p.textContent('#hatchRw'),/WITHIN 100 ATTEMPTS/);
  /* a second player who bought more: no bonus */
  await p.evaluate(()=>{ __sr.S.ev={id:'aurora26',attempts:150,more:1,best:0,hatched:0,chestOk:[]}; __sr.startEvent(); __sr.forceScore(1000); __sr.endNow(); }); await p.waitForTimeout(1500);
  assert.equal(await p.evaluate(()=>__sr.S.ev.fast),0,'bought more: no bonus');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],


['event: the map is hard (no speed cap) until you have 25 attempts left or fewer; then the speed is capped at x2', async(e,L)=>{
  const p=await L.open(e); await base(p); await p.evaluate(()=>{ __sr.S.coins=30000; __sr.enterEvent(); __sr.CFG.rampMax=9; __sr.CFG.rampStart=0; __sr.CFG.rampTau=1; __sr.startEvent(); }); await p.waitForTimeout(250);
  const ratio=()=>p.evaluate(()=>{ const w=document.getElementById('stage').clientWidth; return __sr.sp/(__sr.CFG.baseSpeed*w); });
  assert.equal(await p.evaluate(()=>__sr.evMercy),false); assert.ok(await ratio()>2.5,'with attempts to spare the speed is not capped: x'+(await ratio()).toFixed(2));
  await p.evaluate(()=>{ __sr.showMenu(); __sr.S.ev.attempts=75; __sr.startEvent(); }); await p.waitForTimeout(250);
  assert.equal(await p.evaluate(()=>__sr.evMercy),true,'attempt 76 leaves 24: the gentler map'); assert.ok(await ratio()<=2.0001 && await ratio()>1.5,'capped at x2 with 25 or fewer left: x'+(await ratio()).toFixed(2));
  await p.evaluate(()=>{ __sr.showMenu(); __sr.S.ev.attempts=74; __sr.startEvent(); }); await p.waitForTimeout(250); assert.equal(await p.evaluate(()=>__sr.evMercy),true,'exactly 25 left is gentler'); 
  await p.evaluate(()=>{ __sr.showMenu(); __sr.S.ev.attempts=73; __sr.startEvent(); }); await p.waitForTimeout(250); assert.equal(await p.evaluate(()=>__sr.evMercy),false,'26 left is not');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['event: Continue from where you fell costs 1,500 coins and one attempt, restores the tower and score on the same map, needs the coins, and is not offered in other modes or with no attempts left', async(e,L)=>{
  const p=await L.open(e); await base(p); await p.evaluate(()=>{ __sr.S.coins=30000; __sr.enterEvent(); __sr.startEvent(); }); await p.waitForTimeout(250);
  await L.perfects(p,3); await p.evaluate(()=>{ __sr.S.coins=1499; }); await L.miss(p); await p.waitForTimeout(300); for(let i=0;i<4 && await p.evaluate(()=>__sr.state)==='playing';i++){ await L.miss(p); await p.waitForTimeout(250); } await p.waitForTimeout(1500);
  assert.equal(await p.evaluate(()=>__sr.state),'over'); assert.ok(await p.isVisible('#evCont'),'the Continue button is on the event end screen'); assert.match(await p.textContent('#evCont'),/Continue from block \d+ · 1,500/);
  const o=await p.evaluate(()=>({n:__sr.evCont.blocks.length,score:__sr.evCont.score,att:__sr.S.ev.attempts})); assert.ok(o.n>=2,'a tower worth continuing: '+o.n);
  await p.evaluate(()=>{ __sr.S.coins=1499; }); await p.click('#evCont'); await p.waitForTimeout(200); assert.equal(await p.evaluate(()=>__sr.state),'over','1,499 coins is not enough'); assert.equal(await p.evaluate(()=>__sr.S.coins),1499); assert.equal(await p.evaluate(()=>__sr.S.ev.attempts),o.att);
  await p.evaluate(()=>{ __sr.S.coins=2000; }); await p.click('#evCont'); await p.waitForTimeout(400);
  const a=await p.evaluate(()=>({st:__sr.state,coins:__sr.S.coins,att:__sr.S.ev.attempts,n:__sr.stackLen,score:document.getElementById('score').textContent,mode:__sr.mode,cur:!!__sr.cur}));
  assert.deepEqual([a.st,a.coins,a.att,a.n,a.mode,a.cur],['playing',500,o.att+1,o.n,'event',true],'paid 1,500, used one attempt, same tower'); assert.equal(+a.score,o.score,'and the same score');
  assert.ok(await L.perfects(p,2)>=1); assert.ok(await p.evaluate(()=>__sr.stackLen)>o.n,'and it keeps going from there');
  /* AGAIN is a fresh start (no leftover tower), and other modes never show the button */
  await endIt(p,L); await p.click('#again'); await p.waitForTimeout(300); assert.equal(await p.evaluate(()=>__sr.stackLen),1,'AGAIN starts from the bottom');
  await p.evaluate(()=>{ __sr.showMenu(); __sr.startMode('classic'); }); await p.waitForTimeout(150); await L.miss(p); await p.waitForTimeout(1500); assert.equal(await p.isVisible('#evCont'),false,'not in Classic');
  await p.evaluate(()=>{ __sr.showMenu(); __sr.S.ev.attempts=99; __sr.S.coins=9000; __sr.startEvent(); }); await p.waitForTimeout(250); await L.perfects(p,3); await endIt(p,L); assert.equal(await p.evaluate(()=>__sr.S.ev.attempts),100); assert.equal(await p.isVisible('#evCont'),false,'no attempts left, no Continue');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['event: with 25 attempts or fewer left a continued attempt has a full-width top block and runs 0.5x slower (not before); leaving the event (to other modes, a reload) keeps the tower, and it can be continued later for 2,500 coins from the event screen', async(e,L)=>{
  const p=await L.open(e); await base(p); await p.evaluate(()=>{ __sr.S.coins=30000; __sr.enterEvent(); __sr.S.ev.attempts=74; __sr.CFG.rampStart=0; __sr.CFG.rampTau=1; __sr.startEvent(); }); await p.waitForTimeout(250);
  const fresh=await p.evaluate(()=>__sr.sp); await L.perfects(p,3); for(let i=0;i<5 && await p.evaluate(()=>__sr.state)==='playing';i++){ await L.miss(p); await p.waitForTimeout(250); } await p.waitForTimeout(1500);
  const before=await p.evaluate(()=>({n:__sr.evCont.blocks.length,topW:__sr.evCont.blocks[__sr.evCont.blocks.length-1][1],sv:__sr.S.evSave&&__sr.S.evSave.blocks.length}));
  assert.equal(before.sv,before.n,'the tower is saved when the attempt ends');
  /* continue straight away (1,500): full-width top block, slower */
  await p.evaluate(()=>{ __sr.S.coins=3000; }); await p.click('#evCont'); await p.waitForTimeout(400);
  const c=await p.evaluate(()=>{ const w=document.getElementById('stage').clientWidth; return {topW:__sr.stackTopW/w,sp:__sr.sp/(__sr.CFG.baseSpeed*w),evEase:__sr.evEase,n:__sr.stackLen,sv:__sr.S.evSave}; });
  assert.ok(c.topW>=before.topW-0.001,'the top block is resized to the full width ('+c.topW.toFixed(2)+' vs '+before.topW.toFixed(2)+')'); assert.ok(c.sp<=1.5001 && c.sp>=1,'speed is x0.5 less than the x2 limit: x'+c.sp.toFixed(2)); assert.equal(c.n,before.n); assert.equal(c.sv,null,'the saved tower is in the run now');
  /* leave mid-run: the tower is saved; other modes work; the event screen offers the 2,500 coin continue */
  await L.perfects(p,2); const n1=await p.evaluate(()=>__sr.stackLen); await p.evaluate(()=>{ __sr.showMenu(); }); await p.waitForTimeout(200);
  assert.equal(await p.evaluate(()=>__sr.S.evSave&&__sr.S.evSave.blocks.length),n1,'leaving the event mid-run saves the tower'); assert.equal(await p.evaluate(()=>__sr.S.evSave.id),'aurora26');
  await p.evaluate(()=>{ __sr.startMode('classic'); }); await p.waitForTimeout(200); await L.perfects(p,2); await p.evaluate(()=>{ __sr.showMenu(); });
  assert.equal(await p.evaluate(()=>__sr.S.evSave.blocks.length),n1,'other modes do not touch the saved tower');
  await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('ready')); await base(p); assert.equal(await p.evaluate(()=>__sr.S.evSave.blocks.length),n1,'still saved after a reload');
  await p.evaluate(()=>{ __sr.showMenu(); __sr.S.coins=2499; }); await p.click('#evCard'); await p.waitForTimeout(300); assert.ok(await p.isVisible('#evBody [data-ev=resume]'),'Continue where you left off is on the event screen'); assert.match(await p.textContent('#evBody'),/Continue where you left off/); assert.match(await p.textContent('#evBody [data-ev=resume]'),/2,500/);
  const att=await p.evaluate(()=>__sr.S.ev.attempts); await p.evaluate(()=>document.querySelector('#evBody [data-ev=resume]').click()); await p.waitForTimeout(250); assert.equal(await p.evaluate(()=>__sr.S.ev.attempts),att,'2,499 coins is not enough: nothing changes'); assert.equal(await p.evaluate(()=>__sr.S.coins),2499);
  await p.evaluate(()=>{ __sr.S.coins=2600; }); await p.evaluate(()=>document.querySelector('#evBody [data-ev=resume]').click()); await p.waitForTimeout(500);
  const r=await p.evaluate(()=>({st:__sr.state,mode:__sr.mode,n:__sr.stackLen,coins:__sr.S.coins,att:__sr.S.ev.attempts,sv:__sr.S.evSave,ease:__sr.evEase}));
  assert.deepEqual([r.st,r.mode,r.n,r.coins,r.att,r.sv,r.ease],['playing','event',n1,100,att+1,null,true],'paid 2,500, one attempt, same tower, slower'); 
  /* a shallow attempt never replaces a deeper saved tower; the save is checked on load */
  await endIt(p,L); await p.evaluate(()=>{ __sr.S.evSave={id:'aurora26',score:1,runBlocks:1,perfects:0,blocks:Array.from({length:40},()=>[.3,.4])}; __sr.showMenu(); __sr.S.ev.attempts=10; __sr.startEvent(); }); await p.waitForTimeout(250); await L.perfects(p,2); await endIt(p,L);
  assert.equal(await p.evaluate(()=>__sr.S.evSave.blocks.length),40,'a shallower attempt keeps the deeper saved tower');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['event: while playing, the number of attempts left is shown under the score and counts down with each attempt (a continue uses one too)', async(e,L)=>{
  const p=await L.open(e); await base(p); await p.evaluate(()=>{ __sr.S.coins=30000; __sr.enterEvent(); __sr.startEvent(); }); await p.waitForTimeout(250);
  assert.match(await p.textContent('#ghostD'),/99 attempts left/,'attempt 1 of 100 leaves 99'); assert.equal(await p.isVisible('#ghostD'),true);
  await p.evaluate(()=>{ __sr.showMenu(); __sr.S.ev.attempts=41; __sr.startEvent(); }); await p.waitForTimeout(250); assert.match(await p.textContent('#ghostD'),/58 attempts left/);
  await L.perfects(p,3); await endIt(p,L); await p.evaluate(()=>{ __sr.S.coins=5000; }); await p.click('#evCont'); await p.waitForTimeout(300); assert.match(await p.textContent('#ghostD'),/57 attempts left/,'a continue is an attempt too');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['event: reaching 150 blocks adds 3 Resizes to the power-ups with a message, once; each restores the full width and is used up; they are not in the shop or the saved boosts; a continued tower past 150 has them too', async(e,L)=>{
  const p=await L.open(e); await base(p); await p.evaluate(()=>{ __sr.S.coins=30000; __sr.S.seenTip=true; __sr.S.hintPow=9; __sr.enterEvent(); __sr.startEvent(); }); await p.waitForTimeout(250);
  await p.evaluate(()=>{ Object.assign(__sr.mod,{bombMul:1e-9,hz:{lava:1e9,ice:1e9,glue:1e9,wind:1e9},chance:{lava:0,ice:0,glue:0,gust:0}}); __sr.CFG.rampStart=1e9; });
  assert.equal(await p.evaluate(()=>__sr.evResizes),0); assert.ok(!(await p.evaluate(()=>__sr.held)).includes('resize'),'none before 150');
  await p.evaluate(()=>{ __sr.fillTower(147); }); assert.equal(await p.evaluate(()=>__sr.stackLen),148,'147 blocks on the tower');
  await L.perfects(p,2); assert.equal(await p.evaluate(()=>__sr.evResizes),0,'149 blocks: not yet');
  assert.equal(await L.perfects(p,1),1); await p.waitForTimeout(250);
  assert.equal(await p.evaluate(()=>__sr.evResizes),3,'150 blocks: three Resizes'); assert.ok((await p.evaluate(()=>__sr.held)).includes('resize'));
  await p.waitForFunction(()=>/150 blocks! You now have 3 Resizes/.test(document.getElementById('toast').textContent),null,{timeout:9000}); assert.ok(true,'the player is told'); assert.ok(await p.isVisible('#powerBtn'),'the power-up button is there');
  assert.equal(await p.evaluate(()=>Object.keys(__sr.S.shop.boosts).includes('resize')),false,'not an inventory boost');
  assert.equal(await L.perfects(p,2),2); assert.equal(await p.evaluate(()=>__sr.evResizes),3,'given once');
  /* use them from the power-up menu */
  for(let k=0;k<3;k++){
    await p.evaluate(()=>{ __sr.top.w=__sr.baseW*0.3; if(__sr.cur) __sr.cur.w=__sr.top.w; });
    await p.evaluate(()=>{ document.getElementById('powerBtn').click(); }); await p.waitForFunction(()=>__sr.powerPhase==='open',null,{timeout:4000});
    assert.match(await p.textContent('#powerList [data-power=resize]'),new RegExp('×'+(3-k)),'the count shows');
    await p.evaluate(()=>{ document.querySelector('#powerList [data-power=resize]').click(); }); await p.waitForTimeout(500);
    assert.equal(await p.evaluate(()=>__sr.evResizes),2-k); assert.ok(await p.evaluate(()=>Math.abs(__sr.top.w-__sr.baseW)<1.5),'width restored to the full width');
  }
  assert.ok(!(await p.evaluate(()=>__sr.held)).includes('resize'),'used up'); 
  /* not in the shop, not given to everyone */
  await p.evaluate(()=>{ __sr.showMenu(); }); await p.click('#openThemes'); await p.evaluate(()=>__sr.setTab('boosts')); assert.doesNotMatch(await p.textContent('#tGrid'),/Resize/,'not sold in the shop');
  /* a continued tower that is already past 150 has them from the start */
  await p.evaluate(()=>{ __sr.showMenu(); __sr.S.coins=9000; __sr.S.evSave={id:'aurora26',score:160,runBlocks:160,perfects:10,blocks:Array.from({length:161},()=>[.3,.4])}; });
  await p.evaluate(()=>__sr.evResumeSaved()); await p.waitForTimeout(400); assert.deepEqual(await p.evaluate(()=>[__sr.state,__sr.evResizes,__sr.held.includes('resize')]),['playing',3,true]);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['event: with more than 25 attempts left a continue gives the tower back as it was (no resize, no slowdown)', async(e,L)=>{
  const p=await L.open(e); await base(p); await p.evaluate(()=>{ __sr.S.coins=30000; __sr.enterEvent(); __sr.startEvent(); }); await p.waitForTimeout(250);
  await L.perfects(p,3); await endIt(p,L); const before=await p.evaluate(()=>__sr.evCont.blocks[__sr.evCont.blocks.length-1][1]);
  await p.evaluate(()=>{ __sr.S.coins=5000; }); await p.click('#evCont'); await p.waitForTimeout(400);
  const a=await p.evaluate(()=>({ease:__sr.evEase,mercy:__sr.evMercy,w:__sr.stackTopW/document.getElementById('stage').clientWidth}));
  assert.deepEqual([a.ease,a.mercy],[false,false]); assert.ok(Math.abs(a.w-before)<0.002,'the top block keeps its width: '+a.w.toFixed(3)+' vs '+before.toFixed(3));
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['event TRIPLE OR NOTHING: after hatching, with more than 30,000 coins; pays 85% to enter (confirm tap), 24 attempts of its own on the regular hard map, no continues; reaching the goal pays 3x the coins you had; running out loses the stake', async(e,L)=>{
  const p=await L.open(e); await base(p); await p.evaluate(()=>{ __sr.S.coins=20500; __sr.enterEvent(); const st=__sr.S.ev; st.hatched=1; st.best=1000; st.easy=1; if(!__sr.S.eggs.includes('aurora26')) __sr.S.eggs.push('aurora26'); __sr.S.coins=30000; });
  await p.evaluate(()=>{ __sr.showMenu(); }); await p.click('#evCard'); await p.waitForTimeout(300); assert.equal(await p.locator('#evBody [data-ev=tri]').count(),0,'30,000 coins exactly: no offer');
  await p.evaluate(()=>{ __sr.S.coins=100000; __sr.openEvent(); }); await p.waitForTimeout(300); assert.equal(await p.locator('#evBody [data-ev=tri]').count(),1,'over 30,000: the offer'); assert.match(await p.textContent('#evBody .evtri'),/TRIPLE YOUR COINS OR NOTHING/); assert.match(await p.textContent('#evBody .evtri'),/300,000/); assert.match(await p.textContent('#evBody .evtri'),/85,000/);
  await p.evaluate(()=>document.querySelector('#evBody [data-ev=tri]').click()); await p.waitForTimeout(200); assert.equal(await p.evaluate(()=>__sr.S.coins),100000,'the first tap only asks'); assert.match(await p.textContent('#evBody .evtri'),/Tap again/);
  await p.evaluate(()=>document.querySelector('#evBody [data-ev=tri]').click()); await p.waitForTimeout(250);
  assert.deepEqual(await p.evaluate(()=>{ const t=__sr.S.ev.tri; return [__sr.S.coins,t.c0,t.stake,t.att,t.done]; }),[15000,100000,85000,0,0],'paid 85% of 100,000');
  const ev0=await p.evaluate(()=>__sr.S.ev.attempts);
  await p.evaluate(()=>document.querySelector('#evBody [data-ev=triplay]').click()); await p.waitForTimeout(300);
  assert.deepEqual(await p.evaluate(()=>[__sr.state,__sr.mode,__sr.evTri,__sr.evMercy,__sr.S.ev.tri.att,__sr.S.ev.attempts]),['playing','event',true,false,1,ev0],'a TRIPLE attempt: no gentler map even with the easier map bought, its own counter, event attempts untouched');
  assert.match(await p.textContent('#ghostD'),/TRIPLE · 23 attempts left/);
  await L.perfects(p,2); await endIt(p,L); assert.equal(await p.isVisible('#evCont'),false,'no continue in a TRIPLE attempt'); assert.match(await p.textContent('#oNext'),/TRIPLE OR NOTHING/);
  /* winning: reach the goal in a TRIPLE attempt */
  await p.evaluate(()=>{ __sr.showMenu(); __sr.openEvent(); }); await p.waitForTimeout(200); await p.evaluate(()=>document.querySelector('#evBody [data-ev=triplay]').click()); await p.waitForTimeout(300);
  const c1=await p.evaluate(()=>__sr.S.coins); await p.evaluate(()=>{ __sr.forceScore(1000); __sr.evTriCheck(); }); await p.waitForTimeout(1500);
  assert.deepEqual(await p.evaluate(()=>[__sr.S.ev.tri.done,__sr.S.ev.tri.won]),[1,300000],'3x the coins you had (100,000)'); { const c2=await p.evaluate(()=>__sr.S.coins); assert.ok(c2>=c1+300000 && c2<c1+305000,'+300,000 on top of what you had left: '+c1+' -> '+c2); } assert.match(await p.textContent('#oNext'),/TRIPLE! \+300,000/);
  await p.evaluate(()=>{ __sr.showMenu(); __sr.openEvent(); }); await p.waitForTimeout(200); assert.match(await p.textContent('#evBody'),/TRIPLE! \+300,000/); assert.equal(await p.locator('#evBody [data-ev=triplay]').count(),0,'one go only'); assert.equal(await p.locator('#evBody [data-ev=tri]').count(),0);
  assert.deepEqual(p.errs,[]); await L.close(p);
  /* losing: the 24th attempt ends below the goal */
  const q=await L.open(e); await base(q); await q.evaluate(()=>{ __sr.S.coins=20500; __sr.enterEvent(); const st=__sr.S.ev; st.hatched=1; st.best=1000; __sr.S.coins=50000; st.tri={c0:50000,stake:42500,att:23,done:0,won:0}; __sr.S.coins=7500; __sr.showMenu(); });
  await q.evaluate(()=>{ __sr.openEvent(); }); await q.waitForTimeout(200); await q.evaluate(()=>document.querySelector('#evBody [data-ev=triplay]').click()); await q.waitForTimeout(300); await L.perfects(q,2); await endIt(q,L);
  assert.deepEqual(await q.evaluate(()=>[__sr.S.ev.tri.att,__sr.S.ev.tri.done]),[24,2],'24 attempts and no win: lost'); { const c=await q.evaluate(()=>__sr.S.coins); assert.ok(c>=7500 && c<15000,'the stake stays gone: '+c); } assert.match(await q.textContent('#oNext'),/lost/);
  assert.deepEqual(q.errs,[]); await L.close(q);
}],

['next event (Ember Throne): entry costs 35% of your coins (at least 20,000), the goal doubles only if you hatched the last egg, the map is harder, and the prizes include 100 Mystery Boxes', async(e,L)=>{
  const p=await L.open(e,{now:new Date(2027,0,20,12).getTime()}); await p.evaluate(()=>{ __sr.S.tutSeen=true; __sr.S.coins=100000; });
  const r=await p.evaluate(()=>{ const ev=__sr.activeEvent(), a=__sr.EVENTS[0]; return {id:ev&&ev.id,cost:__sr.evEntryCost(ev),goal:__sr.evGoalOf(ev,null),spd:ev.mod.speed,aspd:a.mod.speed,boxes:ev.reward.boxes,coins:ev.reward.coins,ch:ev.chests.map(c=>c.boxes)}; });
  assert.equal(r.id,'ember27'); assert.equal(r.cost,35000,'35% of 100,000'); assert.equal(r.goal,1000,'did not hatch the last egg: still 1,000'); assert.ok(r.spd>=1.9 && r.spd>r.aspd,'harder than the last map'); assert.equal(r.boxes,100); assert.deepEqual(r.ch,[10,20,30]);
  assert.equal(await p.evaluate(()=>{ __sr.S.coins=25000; return __sr.evEntryCost(__sr.activeEvent()); }),20000,'never less than 20,000');
  await p.evaluate(()=>{ __sr.S.eggs.push('aurora26'); __sr.S.coins=200000; }); assert.equal(await p.evaluate(()=>__sr.evGoalOf(__sr.activeEvent(),null)),2000,'hatched the last egg: 2,000'); assert.equal(await p.evaluate(()=>__sr.evEntryCost(__sr.activeEvent())),70000);
  await p.evaluate(()=>{ __sr.openEvent(); }); await p.waitForTimeout(300); const rules=await p.textContent('#evBody'); assert.match(rules,/2,000/); assert.match(rules,/500, 1,000 and 1,500/,'chests move with the goal'); assert.match(rules,/35% of your coins/); assert.match(rules,/Mystery Box ×100/);
  await p.evaluate(()=>document.querySelector('#evBody [data-ev=enter]').click()); await p.waitForTimeout(300);
  assert.deepEqual(await p.evaluate(()=>[__sr.S.ev.id,__sr.S.ev.gm]),['ember27',2],'the doubled goal is locked in'); { const c=await p.evaluate(()=>__sr.S.coins); assert.ok(c>=130000 && c<140000,'paid 35% (70,000) of 200,000: '+c); }
  /* a chest pays Mystery Boxes too (chest at 250 x2 = 500) */
  await p.evaluate(()=>{ __sr.S.boxes=0; __sr.S.ev.best=520; __sr.claimChest(0); }); assert.deepEqual(await p.evaluate(()=>[__sr.S.boxes,__sr.S.ev.chestOk.join()]),[10,'0']);
  /* a player who did not hatch the last egg keeps 1,000 */
  const q=await L.open(e,{now:new Date(2027,0,20,12).getTime()}); await q.evaluate(()=>{ __sr.S.coins=60000; __sr.S.tutSeen=true; }); assert.equal(await q.evaluate(()=>__sr.evGoalOf(__sr.activeEvent(),null)),1000); await L.close(q);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['next event: hatching the Ember Throne egg pays 15,000 coins and 100 Mystery Boxes', async(e,L)=>{
  const p=await L.open(e,{now:new Date(2027,0,20,12).getTime()}); await p.evaluate(()=>{ const S=__sr.S; S.tutSeen=true; S.coins=200000; __sr.enterEvent(); S.ev.best=1000; S.boxes=0; S.coins=0; __sr.openEvent(); });
  await p.waitForTimeout(300); await p.click('#evBody [data-ev=hatch]'); await p.waitForTimeout(300);
  await p.evaluate(()=>{ __sr.hat.p=.985; __sr.hat.hold=true; }); await p.waitForFunction(()=>__sr.hat.phase!=='hold',null,{timeout:8000}); await p.evaluate(()=>{ __sr.hat.hold=false; });
  await p.waitForSelector('#hatchOk:not(.hidden)',{timeout:25000});
  const r=await p.evaluate(()=>({boxes:__sr.S.boxes,coins:__sr.S.coins,txt:document.getElementById('hatchRw').textContent}));
  assert.equal(r.boxes,100,'100 Mystery Boxes'); assert.ok(r.coins>=15000,'15,000 coins: '+r.coins); assert.match(r.txt,/MYSTERY BOXES/);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],
];
