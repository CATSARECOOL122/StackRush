/* The in-game boost menu: you choose when to use the boosts you picked. A bolt handle at the bottom (tap or swipe up) eases the game to a stop and shows only the boosts picked for
   this round; using one applies it now. Settings > Auto-use boosts keeps the old automatic way (those tests are in shop.test.js). */
const assert=require('assert');

const BASE=(p,o={})=>p.evaluate(o=>{ const s=__sr, S=s.S; S.assist='off'; S.boostAuto=false; S.hintPow=o.hint===undefined?9:o.hint; S.seenTip=true; S.tutSeen=true; for(const m of Object.keys(s.MODES)) S.tips[m]=1;
  Object.assign(S.shop.boosts,{shield:0,slow:0,regrow:0,time:0},o.boosts||{}); S.shop.pick=o.pick||[]; },o);
async function go(e,L,mode,o){ const p=await L.open(e); await BASE(p,o); await p.evaluate(m=>{ if(m.startsWith('stage')) __sr.startStage(+m.slice(5)); else __sr.startMode(m); },mode); await p.waitForTimeout(200); return p; }
const info=p=>p.evaluate(()=>({phase:__sr.powerPhase,tsc:__sr.tsc,held:__sr.held.slice(),shield:__sr.shield,slow:__sr.slowLeft,boosted:__sr.boosted,t:__sr.timeLeft,sheet:!document.getElementById('power').classList.contains('hidden'),
  handle:!document.getElementById('powerBtn').classList.contains('hidden'),n:document.getElementById('powerN').textContent,inv:Object.assign({},__sr.S.shop.boosts)}));
const open=async p=>{ await p.click('#powerBtn'); await p.waitForFunction(()=>__sr.powerPhase==='open',null,{timeout:4000}); };
const card=(p,id)=>p.evaluate(id=>{ const b=document.querySelector(`#powerList [data-power="${id}"]`); return b?{off:b.getAttribute('aria-disabled')==='true',text:b.textContent.replace(/\s+/g,' ').trim()}:null; },id);
const settle=(p,st)=>p.waitForFunction(st=>__sr.backState===st,st,{timeout:5000});

module.exports=[

['power: the handle shows only when boosts are picked and the round allows them, with how many are in hand; never in Zen, Practice, Daily Twist, a friend\'s challenge, the menu or game over', async(e,L)=>{
  let p=await go(e,L,'classic',{boosts:{shield:2,slow:1,regrow:1,time:1},pick:['shield','time']});
  let i=await info(p); assert.deepEqual([i.handle,i.n,i.held],[true,'1',['shield']],'Extra Time is Timed Rush only, so one boost is in hand in Classic');
  for(const m of ['lives','hazard','stage1']){ await p.evaluate(m=>{ __sr.showMenu(); m.startsWith('stage')?__sr.startStage(1):__sr.startMode(m); },m==='stage1'?'stage1':m); await p.waitForTimeout(100); i=await info(p); assert.equal(i.handle,true,m+': a handle'); }
  await p.evaluate(()=>{ __sr.showMenu(); __sr.startMode('timed'); }); await p.waitForTimeout(100); i=await info(p); assert.deepEqual([i.handle,i.n,i.held],[true,'2',['shield','time']],'Timed Rush: both in hand');
  for(const m of ['zen','practice','daily']){ await p.evaluate(m=>{ __sr.showMenu(); __sr.startMode(m); },m); await p.waitForTimeout(100); i=await info(p); assert.deepEqual([i.handle,i.held],[false,[]],m+': no boosts, no handle'); }
  await p.evaluate(()=>{ __sr.showMenu(); __sr.startChallenge(__sr.parseChallenge('classic.30.5')); }); await p.waitForTimeout(100); i=await info(p); assert.deepEqual([i.handle,i.held],[false,[]],'a friend\'s challenge has no boosts');
  await p.evaluate(()=>{ __sr.showMenu(); }); i=await info(p); assert.equal(i.handle,false,'not on the menu');
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(100); await L.perfects(p,2); await L.miss(p); await p.waitForTimeout(1500); assert.equal(await p.evaluate(()=>__sr.state),'over'); assert.equal((await info(p)).handle,false,'not on the game-over screen');
  await p.evaluate(()=>{ __sr.S.coins=500; }); await p.click('#revive'); await p.waitForTimeout(200); assert.equal((await info(p)).handle,true,'back after a Revive');
  assert.deepEqual(p.errs,[]); await L.close(p);
  p=await go(e,L,'classic',{boosts:{shield:0,slow:3},pick:['shield','slow']}); i=await info(p); assert.deepEqual([i.handle,i.held],[true,['slow']],'a boost you have none of is not in hand');
  await p.evaluate(()=>{ __sr.S.shop.pick=[]; __sr.startMode('classic'); }); await p.waitForTimeout(100); assert.equal((await info(p)).handle,false,'nothing picked: no handle'); assert.deepEqual(p.errs,[]); await L.close(p);
}],

['power: tapping the handle eases the game to a stop and opens a menu with ONLY the picked boosts; nothing moves or drops until Keep playing, which eases back', async(e,L)=>{
  const p=await go(e,L,'classic',{boosts:{shield:2,slow:3,regrow:1,time:1},pick:['shield','regrow']}); await L.perfects(p,3);
  const run=await p.evaluate(()=>new Promise(res=>{ const out=[]; document.getElementById('powerBtn').click(); const t0=performance.now(); const f=()=>{ out.push([Math.round(performance.now()-t0),+__sr.tsc.toFixed(3),__sr.powerPhase]); if(performance.now()-t0<700) requestAnimationFrame(f); else res(out); }; f(); }));
  assert.ok(run[0][1]>.5,'it starts slowing from full speed'); for(let k=1;k<run.length;k++) assert.ok(run[k][1]<=run[k-1][1]+1e-9,'only ever slower'); assert.deepEqual([run[run.length-1][1],run[run.length-1][2]],[0,'open'],'a full stop, then the menu');
  const cross=run.find(r=>r[1]<.5); assert.ok(cross && cross[0]<450,`half speed within ${cross&&cross[0]}ms (a quick ease, not a jump)`);
  let i=await info(p); assert.equal(i.sheet,true); assert.deepEqual(await p.locator('#powerList [data-power]').evaluateAll(a=>a.map(x=>x.dataset.power)),['shield','regrow'],'only what you picked (Slow-Mo and Extra Time are owned but not picked)');
  assert.match((await card(p,'shield')).text,/Shield.*Blocks your next miss or bomb\..*×2/); assert.equal((await card(p,'shield')).off,false);
  assert.match((await card(p,'regrow')).text,/Your tower is already full width/); assert.equal((await card(p,'regrow')).off,true);
  const before=await p.evaluate(()=>({x:__sr.cur.x,n:__sr.stackLen,t:__sr.tut&&0})); await p.waitForTimeout(450);
  await p.evaluate(()=>document.getElementById('c').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))); await p.keyboard.press('Space'); await p.waitForTimeout(150);
  const after=await p.evaluate(()=>({x:__sr.cur.x,n:__sr.stackLen})); assert.deepEqual(after,{x:before.x,n:before.n},'the field is frozen: no movement, and taps and Space do not drop');
  assert.equal(await p.evaluate(()=>document.elementFromPoint(innerWidth/2,innerHeight*.4).closest('#power')!==null),true,'the menu covers the field');
  await p.click('#powerDone'); assert.equal((await info(p)).sheet,false); await p.waitForFunction(()=>__sr.powerPhase==='off',null,{timeout:3000}); assert.equal(await p.evaluate(()=>__sr.tsc),1);
  const x1=await p.evaluate(()=>__sr.cur.x); await p.waitForTimeout(200); assert.notEqual(await p.evaluate(()=>__sr.cur.x),x1,'it moves again'); assert.equal(await L.perfects(p,1),1,'and drops work'); assert.equal((await info(p)).inv.shield,2,'closing the menu used nothing up');
  await open(p); await p.mouse.click(200,200); await p.waitForFunction(()=>__sr.powerPhase==='off',null,{timeout:3000}); assert.equal((await info(p)).sheet,false,'a tap outside the card closes it too');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['power: a swipe up from the handle opens the menu as well; the first four rounds say so on the handle, and it stops after you have used it', async(e,L)=>{
  const p=await go(e,L,'classic',{boosts:{shield:2},pick:['shield'],hint:0});
  assert.equal(await p.isVisible('#powerLab'),true); assert.equal(await p.textContent('#powerLab'),'Swipe up for boosts'); assert.equal(await p.evaluate(()=>__sr.S.hintPow),1);
  for(let k=2;k<=4;k++){ await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(80); assert.equal(await p.isVisible('#powerLab'),true,'round '+k+' still says it'); }
  assert.equal(await p.evaluate(()=>__sr.S.hintPow),4); await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(80); assert.equal(await p.isVisible('#powerLab'),false,'the fifth round: just the bolt and the count');
  await p.evaluate(()=>{ __sr.S.hintPow=0; __sr.startMode('classic'); }); await p.waitForTimeout(80);
  const down=await p.evaluate(()=>{ const b=document.getElementById('powerBtn'), r=b.getBoundingClientRect(), x=r.left+r.width/2, y=r.top+r.height/2; const ev=(t,dy)=>b.dispatchEvent(new PointerEvent(t,{bubbles:true,pointerId:7,clientX:x,clientY:y+dy})); ev('pointerdown',0); ev('pointermove',-8); const early=__sr.powerPhase; ev('pointermove',-40); return {early,phase:__sr.powerPhase}; });
  assert.deepEqual(down,{early:'off',phase:'slowing'},'a small wobble does nothing, a real swipe up opens it (before any click)');
  await p.waitForFunction(()=>__sr.powerPhase==='open',null,{timeout:3000}); assert.equal(await p.evaluate(()=>__sr.S.hintPow),9,'it has been used: the hint is done'); await p.click('#powerDone'); await p.waitForTimeout(500);
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(80); assert.equal(await p.isVisible('#powerLab'),false);
  // with the mouse, the way a person does it
  const b=await p.locator('#powerBtn').boundingBox(); await p.mouse.move(b.x+b.width/2,b.y+b.height/2); await p.mouse.down(); await p.mouse.move(b.x+b.width/2,b.y-50,{steps:6}); await p.mouse.up();
  await p.waitForFunction(()=>__sr.powerPhase==='open',null,{timeout:3000}); assert.deepEqual(p.errs,[]); await L.close(p);
}],

['power: Shield from the menu is up at once and is used up only when it saves you; Slow-Mo slows 6 drops now; each card says why it cannot be used', async(e,L)=>{
  const p=await go(e,L,'classic',{boosts:{shield:2,slow:2},pick:['shield','slow']}); await L.perfects(p,2);
  await open(p); await p.click('[data-power=shield]'); await p.waitForFunction(()=>__sr.powerPhase==='off',null,{timeout:3000});
  let i=await info(p); assert.deepEqual([i.shield,i.inv.shield,i.boosted],[true,2,false],'the shield is up, nothing is used up yet, the round is not a boosted one yet');
  await open(p); assert.match((await card(p,'shield')).text,/A shield is already up/); assert.equal((await card(p,'shield')).off,true); await p.click('[data-power=shield]',{force:true}); assert.equal((await info(p)).phase,'open','a disabled card does nothing'); await p.click('#powerDone'); await p.waitForFunction(()=>__sr.powerPhase==='off',null,{timeout:3000});
  await L.miss(p); await p.waitForTimeout(400); i=await info(p); assert.equal(await p.evaluate(()=>__sr.state),'playing','the shield saved the miss'); assert.deepEqual([i.shield,i.inv.shield,i.boosted],[false,1,true],'and now one is used up');
  const sp0=await p.evaluate(()=>__sr.sp); await open(p); await p.click('[data-power=slow]'); await p.waitForFunction(()=>__sr.powerPhase==='off',null,{timeout:3000}); i=await info(p);
  assert.deepEqual([i.slow,i.inv.slow],[6,1],'Slow-Mo: 6 drops, one used up'); const sp1=await p.evaluate(()=>__sr.sp); assert.ok(Math.abs(sp1/sp0-.6)<.03,`the blocks are x0.6 (${(sp1/sp0).toFixed(2)})`);
  await open(p); assert.match((await card(p,'slow')).text,/Active for 6 more drops/); assert.equal((await card(p,'slow')).off,true); await p.click('#powerDone');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['power: Regrow from the menu restores the full width of the top block now (only when thin, twice a round at most); Extra Time adds 30 s in Timed Rush once the clock runs', async(e,L)=>{
  let p=await go(e,L,'classic',{boosts:{regrow:3},pick:['regrow']}); await L.perfects(p,2);
  await p.evaluate(()=>__sr.forceNarrow()); const w0=await p.evaluate(()=>({w:__sr.top.w,base:__sr.baseW})); assert.ok(w0.w<w0.base*.2);
  await open(p); assert.equal((await card(p,'regrow')).off,false); await p.click('[data-power=regrow]'); await p.waitForFunction(()=>__sr.powerPhase==='off',null,{timeout:3000});
  let r=await p.evaluate(()=>({w:__sr.top.w,cw:__sr.cur.w,base:__sr.baseW,inv:__sr.S.shop.boosts.regrow,used:__sr.regrowUsed,boosted:__sr.boosted,x:__sr.top.x,W:__sr.W}));
  assert.ok(Math.abs(r.w-r.base)<.01 && Math.abs(r.cw-r.base)<.01,'the top block and the one in your hand are full width again'); assert.deepEqual([r.inv,r.used,r.boosted],[2,1,true]); assert.ok(r.x>=0 && r.x+r.w<=r.W+.5,'and it fits on the screen');
  assert.equal(await L.perfects(p,1),1,'you can go on stacking');
  await p.evaluate(()=>__sr.forceNarrow()); await open(p); await p.click('[data-power=regrow]'); await p.waitForFunction(()=>__sr.powerPhase==='off',null,{timeout:3000}); assert.equal(await p.evaluate(()=>__sr.regrowUsed),2);
  await p.evaluate(()=>__sr.forceNarrow()); await open(p); assert.match((await card(p,'regrow')).text,/Two Regrows a round is the limit/); assert.equal((await card(p,'regrow')).off,true); await p.click('#powerDone');
  assert.deepEqual(p.errs,[]); await L.close(p);
  p=await go(e,L,'timed',{boosts:{time:2},pick:['time']});
  await open(p); assert.match((await card(p,'time')).text,/The clock starts on your first tap/); assert.equal((await card(p,'time')).off,true); await p.click('#powerDone'); await p.waitForFunction(()=>__sr.powerPhase==='off',null,{timeout:3000});
  await L.perfects(p,1); const t0=await p.evaluate(()=>__sr.timeLeft); await open(p); assert.equal((await card(p,'time')).off,false); await p.click('[data-power=time]'); await p.waitForFunction(()=>__sr.powerPhase==='off',null,{timeout:3000});
  const t1=await p.evaluate(()=>({t:__sr.timeLeft,inv:__sr.S.shop.boosts.time,boosted:__sr.boosted})); assert.ok(t1.t>t0+27 && t1.t<=t0+30.5,`30 seconds more (${t0.toFixed(1)} -> ${t1.t.toFixed(1)})`); assert.deepEqual([t1.inv,t1.boosted],[1,true]);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['power: using the last one of a boost takes it out of the menu and off the handle; the handle glows when the clock is low and Extra Time is in hand', async(e,L)=>{
  let p=await go(e,L,'classic',{boosts:{slow:1,shield:1},pick:['slow','shield']}); await open(p); await p.click('[data-power=slow]'); await p.waitForFunction(()=>__sr.powerPhase==='off',null,{timeout:3000});
  let i=await info(p); assert.deepEqual([i.held,i.n,i.inv.slow],[['shield'],'1',0],'Slow-Mo is gone, Shield is still in hand');
  await open(p); assert.deepEqual(await p.locator('#powerList [data-power]').evaluateAll(a=>a.map(x=>x.dataset.power)),['shield']); await p.click('[data-power=shield]'); await p.waitForFunction(()=>__sr.powerPhase==='off',null,{timeout:3000});
  await L.miss(p); await p.waitForTimeout(400); i=await info(p); assert.deepEqual([i.held,i.handle,i.inv.shield],[[],false,0],'the Shield saved the miss and was the last: no boosts, no handle');
  assert.deepEqual(p.errs,[]); await L.close(p);
  p=await go(e,L,'timed',{boosts:{time:1},pick:['time']}); await L.perfects(p,1); assert.equal(await p.evaluate(()=>document.getElementById('powerBtn').classList.contains('glow')),false,'plenty of time: no glow');
  await p.evaluate(()=>__sr.setTime(5)); await p.waitForTimeout(250); assert.equal(await p.evaluate(()=>document.getElementById('powerBtn').classList.contains('glow')),true,'5 seconds left: the handle glows');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['power: Back, Escape, B, Pause and starting a new round all close the menu cleanly and leave the game at full speed', async(e,L)=>{
  const p=await go(e,L,'classic',{boosts:{shield:2},pick:['shield']}); await settle(p,'armed'); await L.perfects(p,1);
  await open(p); await p.evaluate(()=>history.back()); await p.waitForFunction(()=>__sr.powerPhase==='off' || __sr.powerPhase==='resuming',null,{timeout:3000}); assert.equal((await info(p)).sheet,false,'Back closes the menu'); assert.equal(await p.evaluate(()=>__sr.paused),false,'and does not pause the game');
  await p.waitForFunction(()=>__sr.powerPhase==='off',null,{timeout:3000}); await settle(p,'armed');
  await p.evaluate(()=>history.back()); await p.waitForFunction(()=>__sr.paused,null,{timeout:3000}); assert.equal((await info(p)).phase,'off','the next Back pauses the run as before'); await p.click('#resume'); await p.waitForFunction(()=>!__sr.paused,null,{timeout:3000}); await p.waitForTimeout(1700);
  await open(p); await p.keyboard.press('Escape'); await p.waitForFunction(()=>!document.getElementById('power').classList.contains('hidden')===false,null,{timeout:3000}); assert.equal(await p.evaluate(()=>__sr.paused),false,'Escape closes the menu first');
  await p.waitForFunction(()=>__sr.powerPhase==='off',null,{timeout:3000});
  await p.keyboard.press('KeyB'); await p.waitForFunction(()=>__sr.powerPhase==='open',null,{timeout:3000}); await p.keyboard.press('KeyB'); await p.waitForFunction(()=>__sr.powerPhase==='off',null,{timeout:3000}); assert.equal(await p.evaluate(()=>__sr.tsc),1,'B opens and closes it');
  await open(p); await p.evaluate(()=>__sr.pause()); let i=await info(p); assert.deepEqual([i.sheet,i.phase,i.tsc],[false,'off',1],'pausing closes the menu at once, then the pause screen is the pause screen'); assert.equal(await p.evaluate(()=>__sr.paused),true); await p.click('#resume'); await p.waitForTimeout(1700);
  await open(p); await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(100); i=await info(p); assert.deepEqual([i.sheet,i.phase,i.tsc,i.handle],[false,'off',1,true],'a new round starts at full speed with the handle');
  await open(p); await p.evaluate(()=>{ __sr.showMenu(); }); i=await info(p); assert.deepEqual([i.sheet,i.phase,i.tsc,i.handle],[false,'off',1,false],'the menu clears everything');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['power: Settings > Auto-use boosts (off by default) turns the old automatic way back on: nothing in hand, no handle, the Shield is up from the start; the Boosts sheet says which way it is', async(e,L)=>{
  const p=await L.open(e); await BASE(p,{boosts:{shield:2,slow:2},pick:['shield','slow']}); await p.evaluate(()=>{ delete __sr.S.boostAuto; });
  assert.equal(await p.evaluate(()=>__sr.manualOn()),true,'by default you choose'); await p.click('#openBoosts'); assert.match(await p.textContent('#boostNote'),/swipe up from the bolt/); await p.click('#boostDone');
  await p.click('#openSettings'); assert.equal((await p.textContent('[data-set=boostauto]')).trim(),'OFF'); await p.click('[data-set=boostauto]'); assert.equal((await p.textContent('[data-set=boostauto]')).trim(),'ON'); assert.equal(await p.evaluate(()=>__sr.S.boostAuto),true);
  await p.click('#closeSettings'); await p.click('#openBoosts'); assert.match(await p.textContent('#boostNote'),/only used up when it actually helps/); await p.click('#boostDone');
  await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(300); assert.equal(await p.evaluate(()=>__sr.S.boostAuto),true,'saved');
  await p.evaluate(()=>{ __sr.S.tutSeen=true; __sr.S.assist='off'; for(const m of Object.keys(__sr.MODES)) __sr.S.tips[m]=1; __sr.startMode('classic'); }); await p.waitForTimeout(200);
  const i=await info(p); assert.deepEqual([i.held,i.handle,i.shield],[[],false,true],'automatic: nothing in hand, no handle, the shield is already up'); assert.equal(await p.evaluate(()=>!!__sr.armed.slow),true,'and Slow-Mo waits for the speed to pick up');
  await p.evaluate(()=>{ __sr.showMenu(); }); await p.click('#openSettings'); await p.click('[data-set=boostauto]'); assert.equal((await p.textContent('[data-set=boostauto]')).trim(),'OFF'); assert.deepEqual(p.errs,[]); await L.close(p);
}],

['power: a hostile save cannot break the new settings (junk becomes false / 0, the hint counter is clamped)', async(e,L)=>{
  for(const [raw,want] of [['{"boostAuto":"yes","hintPow":99,"held":["x"],"powerPhase":"open"}',{boostAuto:true,hintPow:9}],['{"boostAuto":0,"hintPow":"abc"}',{boostAuto:false,hintPow:0}],['{"boostAuto":[],"hintPow":-5}',{boostAuto:true,hintPow:0}],['{"hintPow":2.7}',{boostAuto:false,hintPow:2}]]){
    const p=await L.open(e,{setup:async pg=>{ await pg.addInitScript(r=>{ localStorage.setItem('stackrush.v2',r); },raw); }});
    const got=await p.evaluate(()=>({boostAuto:__sr.S.boostAuto,hintPow:__sr.S.hintPow,keys:Object.keys(__sr.S).filter(k=>/held|powerPhase/.test(k))}));
    assert.equal(got.boostAuto,want.boostAuto,raw); assert.ok(Math.abs(got.hintPow-want.hintPow)<1e-9,raw+' -> '+got.hintPow); assert.deepEqual(got.keys,[],'nothing invented'); assert.deepEqual(p.errs,[]); await L.close(p);
  }
}],

];
