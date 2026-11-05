/* Speed-ups: +10 / +20 / +100 free blocks (and score) in a quick burst; a friend race lets you equip only these. */
const assert=require('assert');
const BASE=(p,boosts,pick)=>p.evaluate(([b,pk])=>{ const s=__sr, S=s.S; S.assist='off'; S.boostAuto=false; S.hintPow=9; S.seenTip=true; S.tutSeen=true; for(const m of Object.keys(s.MODES)) S.tips[m]=1;
  Object.assign(S.shop.boosts,{shield:0,slow:0,regrow:0,time:0,up10:0,up20:0,up100:0},b); S.shop.pick=pk; },[boosts,pick]);
const openP=async p=>{ await p.click('#powerBtn'); await p.waitForFunction(()=>__sr.powerPhase==='open',null,{timeout:4000}); };
module.exports=[

['speed-up: +10 adds ten free blocks and ten points in a quick burst, uses one up, marks the round boosted, and the game carries on', async(e,L)=>{
  const p=await L.open(e); await BASE(p,{up10:2},['up10']); await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(150);
  await L.perfects(p,3); const b=await p.evaluate(()=>({h:__sr.stackLen,s:__sr.score}));
  const sp0=await p.evaluate(()=>__sr.speed());
  await openP(p); await p.click('#powerList [data-power=up10]');
  await p.waitForFunction(()=>!__sr.lift,null,{timeout:5000});
  assert.equal(await p.evaluate(()=>__sr.speed()),sp0,'free blocks do not speed the game up');
  const a=await p.evaluate(()=>({h:__sr.stackLen,s:__sr.score,inv:__sr.S.shop.boosts.up10,boosted:__sr.boosted,state:__sr.state,cur:!!__sr.cur}));
  assert.equal(a.h,b.h+10,'ten blocks higher'); assert.equal(a.s,b.s+10,'ten points more'); assert.equal(a.inv,1); assert.equal(a.boosted,true); assert.equal(a.state,'playing'); assert.equal(a.cur,true,'the moving block is back');
  await L.perfects(p,2); assert.equal(await p.evaluate(()=>__sr.stackLen),b.h+12,'play continues on top');
  assert.equal(await p.evaluate(()=>__sr.placedN()),b.h+2,'only the blocks you placed count for the speed');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['speed-up: +100 works too; not in campaign stages (the card says why); a Speed-up is not given in the welcome gift', async(e,L)=>{
  const p=await L.open(e); await BASE(p,{up100:1,up20:1},['up100','up20']); await p.evaluate(()=>__sr.startMode('lives')); await p.waitForTimeout(150);
  await L.perfects(p,1); const h0=await p.evaluate(()=>__sr.stackLen);
  await openP(p); await p.click('#powerList [data-power=up100]'); await p.waitForFunction(()=>!__sr.lift,null,{timeout:8000});
  assert.equal(await p.evaluate(()=>__sr.stackLen),h0+100); assert.equal(await p.evaluate(()=>__sr.state),'playing');
  await p.evaluate(()=>{ __sr.showMenu(); __sr.startStage(1); }); await p.waitForTimeout(150);
  assert.deepEqual(await p.evaluate(()=>__sr.held.slice()),[],'no Speed-up in hand in a campaign stage');
  await p.evaluate(()=>{ const S=__sr.S; S.shop.gift=false; S.played=3; S.shop.boosts.up10=0; __sr.showMenu(); });
  assert.equal(await p.evaluate(()=>__sr.S.shop.boosts.up10),0,'the gift has no Speed-ups'); assert.ok(await p.evaluate(()=>__sr.S.shop.boosts.shield>=1));
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['speed-up: a friend race card lets you equip only Speed-ups, + buys one with coins when you have none spare, and the result says you used them', async(e,L)=>{
  const p=await L.open(e); await BASE(p,{shield:3,up10:1},['shield']);
  await p.evaluate(()=>{ __sr.S.coins=1500; __sr.openChallenge(__sr.parseChallenge('classic.20.5')); });
  assert.equal(await p.locator('#chCatch .cu').count(),3);
  await p.click('#chCatch [data-cu=up10][data-d="1"]'); assert.deepEqual(await p.evaluate(()=>[__sr.catchUp.up10,__sr.S.shop.boosts.up10,__sr.S.coins]),[1,1,1500],'uses the one you have');
  await p.click('#chCatch [data-cu=up10][data-d="1"]'); assert.deepEqual(await p.evaluate(()=>[__sr.catchUp.up10,__sr.S.shop.boosts.up10,__sr.S.coins]),[2,2,500],'+ buys one for 1000 coins');
  await p.click('#chCatch [data-cu=up10][data-d="1"]'); assert.deepEqual(await p.evaluate(()=>[__sr.catchUp.up10,__sr.S.coins]),[2,500],'not enough coins: nothing happens');
  await p.click('#chGo'); await p.waitForTimeout(200);
  assert.deepEqual(await p.evaluate(()=>__sr.held.slice()),['up10'],'only the Speed-up is in hand (not the Shield)');
  await openP(p); await p.click('#powerList [data-power=up10]'); await p.waitForFunction(()=>!__sr.lift,null,{timeout:5000});
  assert.deepEqual(await p.evaluate(()=>[__sr.cuLeft.up10,__sr.held.slice()]),[1,['up10']],'one equipped Speed-up left');
  await L.miss(p); await p.waitForTimeout(1500);
  assert.match(await p.textContent('#oNext'),/boosted/);
  assert.equal(await p.evaluate(()=>__sr.challengeOk()),false,'a boosted round cannot be raced again');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['awards: beating a friend counts once per win and unlocks Friendly Rivalry; the boss and bomb awards unlock from the save', async(e,L)=>{
  const p=await L.open(e); await BASE(p,{},[]);
  await p.evaluate(()=>{ __sr.startChallenge(__sr.parseChallenge('classic.2.5')); }); await p.waitForTimeout(150);
  await L.perfects(p,3); await L.miss(p); await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>({w:__sr.S.friendWins,a:!!__sr.S.ach.friend}));
  assert.deepEqual(r,{w:1,a:true},'one win, award unlocked');
  const k=await p.evaluate(()=>{ const S=__sr.S; S.camp[6]=3; S.dodged=100; S.shields=10; S.played=100; __sr.showMenu(); __sr.checkAch(); return ['boss1','bomb100','shield10','plays100','boss4','stars72'].map(id=>!!S.ach[id]); });
  assert.deepEqual(k,[true,true,true,true,false,false],'the right ones, and not the all-bosses or all-stars awards');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

];
