const assert=require('assert');
module.exports=[

['classic: a shield is earned at 8 perfects, absorbs a miss, then death saves best + ghost', async(e,L)=>{
  const p=await L.open(e);
  await p.evaluate(()=>{ __sr.S.coins=300; __sr.startMode('classic'); }); await p.waitForTimeout(150);
  assert.equal(await L.perfects(p,8),8,'8 perfect drops');
  assert.equal(await p.evaluate(()=>__sr.shield),true,'shield earned');
  await L.miss(p);
  assert.equal(await p.evaluate(()=>__sr.state),'playing','shield absorbed the miss');
  assert.equal(await p.evaluate(()=>__sr.shield),false,'shield consumed');
  await L.miss(p); await p.waitForTimeout(1400);
  assert.equal(await p.evaluate(()=>__sr.state),'over');
  assert.ok(await p.evaluate(()=>__sr.S.bests.classic)>=30,'best score saved');
  assert.ok(await p.evaluate(()=>!!__sr.S.ghosts.classic),'ghost run saved');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['revive: costs coins, resumes the run, and can only be used once', async(e,L)=>{
  const p=await L.open(e);
  await p.evaluate(()=>{ __sr.S.coins=300; __sr.startMode('classic'); }); await p.waitForTimeout(150);
  await L.perfects(p,6); await L.miss(p); await p.waitForTimeout(1400);
  assert.equal(await p.evaluate(()=>__sr.state),'over');
  assert.ok(await p.isVisible('#revive'),'revive offered');
  await p.click('#revive'); await p.waitForTimeout(250);
  assert.equal(await p.evaluate(()=>__sr.state),'playing');
  assert.equal(await p.evaluate(()=>__sr.S.revives),1);
  await L.miss(p); await p.waitForTimeout(1400);
  assert.equal(await p.isVisible('#revive'),false,'no second revive');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['timed: the clock waits for the first tap, perfects add time, time-up ends the run', async(e,L)=>{
  const p=await L.open(e);
  await p.evaluate(()=>__sr.startMode('timed')); await p.waitForTimeout(200);
  const t0=await p.evaluate(()=>__sr.timeLeft); assert.equal(t0,30,'Timed Rush starts at 30 seconds'); await p.waitForTimeout(700);
  assert.equal(await p.evaluate(()=>__sr.timeLeft),t0,'clock not running before the first tap');
  await L.perfects(p,5);
  assert.ok(await p.evaluate(()=>__sr.timeLeft)>32,'time was added');
  await p.evaluate(()=>__sr.setTime(0.3)); await p.waitForTimeout(1400);
  assert.equal(await p.evaluate(()=>__sr.state),'over');
  assert.equal((await p.textContent('#oLabel')).trim(),"TIME'S UP");
  assert.equal(await p.isVisible('#revive'),false,'no revive in Timed Rush');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['lives: only a full miss costs a life; losing all three ends the run', async(e,L)=>{
  const p=await L.open(e);
  await p.evaluate(()=>__sr.startMode('lives')); await p.waitForTimeout(150);
  assert.equal(await p.evaluate(()=>__sr.lives),3);
  await L.perfects(p,3); await L.miss(p);
  assert.equal(await p.evaluate(()=>__sr.lives),2);
  await L.miss(p); await L.miss(p); await p.waitForTimeout(1400);
  assert.equal(await p.evaluate(()=>__sr.state),'over');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['hazard: bombs appear and can be dodged for points', async(e,L)=>{
  const p=await L.open(e);
  await p.evaluate(()=>__sr.startMode('hazard')); await p.waitForTimeout(150);
  let seen=false;
  for(let i=0;i<50 && !seen;i++){
    const r=await L.act(p,'s=>s.cur&&(s.cur.bomb||Math.abs(s.cur.x-s.topX)<Math.max(3,s.sp*0.014))',6000);
    if(r==='over') break; seen=await p.evaluate(()=>!!(__sr.cur&&__sr.cur.bomb)); if(!seen) await p.waitForTimeout(30);
  }
  assert.ok(seen,'a bomb block appeared');
  const d0=await p.evaluate(()=>__sr.dodgedRun); await p.waitForTimeout(3400);
  assert.equal((await p.evaluate(()=>__sr.dodgedRun))-d0,1,'letting it pass counts as a dodge');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['zen: a full miss never ends the run; Finish ends it without coins', async(e,L)=>{
  const p=await L.open(e);
  await p.evaluate(()=>{ __sr.S.ach.first=1; __sr.startMode('zen'); }); await p.waitForTimeout(150);   // (one-time award coins are a separate thing)
  await L.perfects(p,3); await L.miss(p);
  assert.equal(await p.evaluate(()=>__sr.state),'playing');
  const c0=await p.evaluate(()=>__sr.S.coins);
  await p.click('#endZen'); await p.waitForTimeout(1300);
  assert.equal(await p.evaluate(()=>__sr.state),'over');
  assert.equal(await p.evaluate(()=>__sr.S.coins),c0,'Zen pays no coins');
  assert.match(await p.textContent('#oCoins'),/no coins/i);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['daily twist: 3 lives, a rule of the day, and the score goal pays out once', async(e,L)=>{
  const p=await L.open(e);
  await p.evaluate(()=>{ __sr.S.twist.done=false; __sr.startMode('daily'); }); await p.waitForTimeout(200);
  assert.equal(await p.evaluate(()=>__sr.lives),3);
  assert.ok((await p.evaluate(()=>__sr.twist().name)).length>2);
  const c0=await p.evaluate(()=>__sr.S.coins);
  await L.climb(p,12,40000);
  assert.equal(await p.evaluate(()=>__sr.S.twist.done),true,'goal reached');
  assert.ok(await p.evaluate(()=>__sr.S.coins)>=c0+60,'reward paid');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['campaign: stage 1 clears with 3 stars and unlocks stage 2; a failed stage 2 keeps stage 3 locked', async(e,L)=>{
  const p=await L.open(e);
  await p.click('#openCampaign'); await p.waitForTimeout(250);
  assert.equal(await p.locator('.stg').count(),42);
  assert.equal(await p.locator('.stg.lock').count(),41);
  await p.click('[data-stage="1"]'); await p.waitForTimeout(250);
  await L.perfects(p,8); await p.waitForTimeout(1300);
  assert.match((await p.textContent('#oLabel')),/1/);
  assert.equal(await p.evaluate(()=>__sr.S.camp[1]),3,'3 stars with no lives lost');
  assert.ok(await p.isVisible('#next'));
  await p.click('#next'); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(()=>__sr.stage),2);
  await L.miss(p); await L.miss(p); await L.miss(p); await p.waitForTimeout(1400);
  await p.click('#overModes'); await p.click('[data-mode=campaign]'); await p.waitForTimeout(200);
  assert.equal(await p.evaluate(()=>document.querySelector('[data-stage="3"]').classList.contains('lock')),true);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['pause: freezes the block and clock, 3-2-1 countdown, taps ignored until it ends', async(e,L)=>{
  const p=await L.open(e);
  await p.evaluate(()=>__sr.startMode('timed')); await p.waitForTimeout(200);
  await p.evaluate(()=>document.getElementById('c').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))); await p.waitForTimeout(200);
  await p.evaluate(()=>__sr.pause()); await p.waitForTimeout(100);
  const a=await p.evaluate(()=>({x:__sr.cur.x,t:__sr.timeLeft})); await p.waitForTimeout(700);
  const b=await p.evaluate(()=>({x:__sr.cur.x,t:__sr.timeLeft}));
  assert.deepEqual(b,a,'frozen while paused');
  await p.click('#resume',{force:true}); await p.waitForTimeout(250);
  assert.equal((await p.textContent('#count')).trim(),'3');
  const n0=await p.evaluate(()=>__sr.stackLen); await p.mouse.click(195,300); await p.waitForTimeout(100);
  assert.equal(await p.evaluate(()=>__sr.stackLen),n0,'tap ignored during the countdown');
  await p.waitForTimeout(1500);
  assert.equal(await p.isVisible('#count'),false);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['screens: modes (7 + the Friend race tile), awards (39 + 6 stats), share card (1080x1350)', async(e,L)=>{
  const p=await L.open(e);
  await p.click('#openModes'); await p.waitForTimeout(250); assert.equal(await p.locator('.mode').count(),8); await p.click('#closeModes');
  await p.click('#openAwards'); await p.waitForTimeout(250); assert.equal(await p.locator('.aw').count(),39); assert.equal(await p.locator('#aStats div').count(),6); await p.click('#closeAwards');
  const s=await p.evaluate(()=>{ const r=__sr.shareInfo(); return {w:r.w,h:r.h}; });
  assert.deepEqual(s,{w:1080,h:1350});
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

];
