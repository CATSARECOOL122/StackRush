/* Regression tests for bugs found by the monkey test and by review. Each one failed before it was fixed. */
const assert=require('assert');
const pad=n=>String(n).padStart(2,'0'), ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const IPAD_UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

module.exports=[

['revive undoes only the run\'s payout: a theme bought or equipped on the game-over screen is not lost', async(e,L)=>{
  const p=await L.open(e);
  await p.evaluate(()=>{ __sr.S.coins=1000; __sr.S.assist='off'; __sr.startMode('classic'); }); await p.waitForTimeout(150);
  await L.perfects(p,6); await L.miss(p); await p.waitForTimeout(1500);
  assert.equal(await p.evaluate(()=>__sr.state),'over'); assert.ok(await p.isVisible('#revive'),'revive is offered');
  const gained=await p.evaluate(()=>__sr.S.coins)-1000; assert.ok(gained>0,'the run paid out coins');
  await p.click('#overThemes'); await p.waitForTimeout(300);
  await p.click('.sw[data-id=desert]'); await p.waitForTimeout(150); await p.click('#peekAct'); await p.waitForTimeout(250);     // buy + equip a 250-coin theme
  assert.deepEqual(await p.evaluate(()=>({t:__sr.S.theme,o:__sr.S.owned.includes('desert')})),{t:'desert',o:true});
  await p.click('#closeThemes'); await p.waitForTimeout(250); assert.ok(await p.isVisible('#revive'));
  await p.click('#revive'); await p.waitForTimeout(300);
  const r=await p.evaluate(()=>({state:__sr.state,theme:__sr.S.theme,owned:__sr.S.owned.includes('desert'),coins:__sr.S.coins,best:__sr.S.bests.classic,played:__sr.S.played}));
  assert.equal(r.state,'playing'); assert.equal(r.theme,'desert','the equipped theme survived'); assert.equal(r.owned,true,'the purchase survived');
  const awards=await p.evaluate(()=>Object.keys(__sr.S.ach).reduce((n,id)=>n+__sr.ACH.find(a=>a.id===id).coins,0));            // awards (e.g. "Second Wind") are paid again when earned again
  assert.equal(r.coins,1000-250-40+awards,'coins: the run\'s payout is taken back, the purchase and the revive fee are paid'); assert.equal(r.played,0,'the run does not count as finished yet');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['a game left open past midnight starts the new day with a fresh daily challenge and twist', async(e,L)=>{
  const p=await L.open(e);
  await p.evaluate(()=>{ __sr.S.daily={day:'2000-01-01',perfects:11,done:false}; __sr.S.twist={day:'2000-01-01',done:true,best:99}; });
  await p.evaluate(()=>__sr.startMode('classic'));
  const today=ymd(new Date()), r=await p.evaluate(()=>({d:__sr.S.daily,t:__sr.S.twist}));
  assert.deepEqual(r.d,{day:today,perfects:0,done:false}); assert.deepEqual(r.t,{day:today,done:false,best:0});
  await p.evaluate(()=>{ __sr.pause(); }); await p.click('#quit');
  await p.evaluate(()=>{ __sr.S.daily={day:'2000-01-01',perfects:5,done:true}; __sr.showMenu(); });             // back at the menu after midnight
  assert.deepEqual(await p.evaluate(()=>__sr.S.daily),{day:today,perfects:0,done:false}); await L.close(p);
}],

['resizing the stage mid-run (Split View, desktop window) rescales the tower instead of leaving it half off-screen', async(e,L)=>{
  const p=await L.open(e,{ctx:{viewport:{width:390,height:844}}});
  await p.evaluate(()=>{ __sr.S.assist='off'; __sr.startMode('classic'); }); await p.waitForTimeout(150); await L.perfects(p,6);
  const inside=()=>p.evaluate(()=>{ const t=__sr.top, W=__sr.W; return {ok:t.x>=-1&&t.x+t.w<=W+1,W,x:t.x,w:t.w,n:__sr.stackLen}; });
  const w0=(await inside()).w, W0=(await inside()).W;
  for(const [w,h] of [[300,700],[520,820],[390,844]]){
    await p.setViewportSize({width:w,height:h}); await p.waitForTimeout(400);
    const r=await inside(); assert.ok(r.ok,`${w}x${h}: the top block (x=${r.x.toFixed(0)}, w=${r.w.toFixed(0)}) is inside the ${r.W}px stage`); assert.equal(r.n,7,'no blocks were lost');
  }
  const r=await inside(); assert.ok(Math.abs(r.w/r.W-w0/W0)<.02,'the block keeps its share of the width'); assert.equal(await p.evaluate(()=>__sr.state),'playing');
  assert.equal(await L.perfects(p,3),3,'and the run plays on after the resizes');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['iPad rotation mid-run keeps the tower on screen', async(e,L)=>{
  const dev=(w,h)=>({viewport:{width:w,height:h},screen:{width:w,height:h},deviceScaleFactor:1,hasTouch:true,isMobile:true,userAgent:IPAD_UA});
  const p=await L.open(e,{ctx:dev(768,1024),init:()=>{ Object.defineProperty(navigator,'maxTouchPoints',{get:()=>5}); Object.defineProperty(navigator,'platform',{get:()=>'MacIntel'}); }});
  await p.evaluate(()=>{ __sr.S.assist='off'; __sr.startMode('classic'); }); await p.waitForTimeout(150); await L.perfects(p,5);
  const W1=await p.evaluate(()=>__sr.W); await p.setViewportSize({width:1024,height:768}); await p.waitForTimeout(500);       // rotate to landscape: the column gets narrower
  const r=await p.evaluate(()=>{ const t=__sr.top; return {W:__sr.W,ok:t.x>=-1&&t.x+t.w<=__sr.W+1,state:__sr.state}; });
  assert.ok(r.W<W1,'the stage is narrower in landscape'); assert.ok(r.ok,'the tower fits the new stage'); assert.equal(r.state,'playing');
  assert.equal(await L.perfects(p,3),3); assert.deepEqual(p.errs,[]); await L.close(p);
}],

['the service worker never keeps an error response (a 404 or 500 must not stick until the next release)', async(e,L)=>{
  const p=await L.open(e);
  await p.waitForFunction(()=>navigator.serviceWorker&&navigator.serviceWorker.controller,null,{timeout:15000}).catch(async()=>{ await p.reload(); await p.waitForFunction(()=>navigator.serviceWorker.controller,null,{timeout:15000}); });
  const status=await p.evaluate(()=>fetch('lang/zz-missing.json').then(r=>r.status)); assert.equal(status,404);
  const cached=await p.evaluate(async()=>{ for(const k of await caches.keys()){ if(await (await caches.open(k)).match('lang/zz-missing.json')) return true; } return false; });
  assert.equal(cached,false,'the 404 was not cached'); await L.close(p);
}],

];
