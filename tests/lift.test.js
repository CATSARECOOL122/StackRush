/* Speed-ups: +10 / +20 / +100 free blocks (and score) in a quick burst; a friend race lets you equip only these. */
const assert=require('assert');
const BASE=(p,boosts,pick)=>p.evaluate(([b,pk])=>{ const s=__sr, S=s.S; S.assist='off'; S.boostAuto=false; S.hintPow=9; S.seenTip=true; S.tutSeen=true; for(const m of Object.keys(s.MODES)) S.tips[m]=1;
  Object.assign(S.shop.boosts,{shield:0,slow:0,regrow:0,time:0,up10:0,up20:0,up100:0},b); S.shop.pick=pk; },[boosts,pick]);
const endIt=async(p)=>{ for(let i=0;i<6 && await p.evaluate(()=>__sr.state)==='playing';i++){ await require('./lib.js').miss(p); await p.waitForTimeout(200); } await p.waitForTimeout(1300); };
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
  assert.equal(await p.evaluate(()=>__sr.challengeOk()),true,'a friend-race round (Speed-ups only) can be shared on');
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

['friend race: start it from the Friend race sheet (mode + Speed-ups), play, then Share; only Speed-ups work, and the shared link replays your tower', async(e,L)=>{
  const p=await L.open(e); await BASE(p,{shield:3,up10:2},['shield']);
  await p.evaluate(()=>{ __sr.S.coins=0; __sr.showModes(); }); await p.click('#mGrid [data-mode=friend]');
  assert.equal(await p.locator('#fsModes button').count(),4); assert.equal(await p.locator('#fsCatch .cu').count(),3);
  await p.click('#fsModes [data-fm=lives]'); await p.click('#fsCatch [data-cu=up10][data-d="1"]');
  await p.click('#fsStart'); await p.waitForTimeout(250);
  const i=await p.evaluate(()=>({m:__sr.mode,f:__sr.friendRun,held:__sr.held.slice(),c:__sr.challenge}));
  assert.deepEqual(i,{m:'lives',f:true,held:['up10'],c:null},'a friend-race round: only the equipped Speed-up');
  await L.perfects(p,2); await openP(p); await p.click('#powerList [data-power=up10]'); await p.waitForFunction(()=>!__sr.lift,null,{timeout:5000});
  await L.perfects(p,1); await L.miss(p); await L.miss(p); await L.miss(p); await p.waitForTimeout(1600);
  assert.equal(await p.evaluate(()=>__sr.state),'over'); assert.match(await p.textContent('#oNext'),/Share/);
  const ch=await p.evaluate(()=>{ const ok=__sr.challengeOk(); const c=__sr.parseChallenge(__sr.challengeCode()); return {ok,n:c&&c.ghost.length,score:c&&c.score}; });
  assert.equal(ch.ok,true); assert.ok(ch.n>=13,'the link carries the tower with the free blocks ('+ch.n+')'); assert.ok(ch.score>=10);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['shop: the tab strip stays just under the top bar while scrolling (never above it, under the notch)', async(e,L)=>{
  const p=await L.open(e,{}); await p.click('#openThemes'); await p.evaluate(()=>__sr.setTab('extras')); await p.waitForTimeout(150);
  await p.evaluate(()=>{ document.getElementById('themes').scrollTop=900; }); await p.waitForTimeout(200);
  const r=await p.evaluate(()=>{ const tb=document.querySelector('#themes .topbar').getBoundingClientRect(), t=document.getElementById('tTabs').getBoundingClientRect(); return {tb:tb.bottom,t:t.top,sc:document.getElementById('themes').scrollTop}; });
  assert.ok(r.sc>100,'it scrolled'); assert.ok(r.t>=r.tb-2,`tabs (${r.t}) are not above the top bar bottom (${r.tb})`);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['friend race: the last raceable round survives a reload (an update), and results go in a history; beating a friend with 100+ and no boosts pays once per challenge', async(e,L)=>{
  const p=await L.open(e); await BASE(p,{},[]);
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(150); await L.perfects(p,4); await L.miss(p); await p.waitForTimeout(1500);
  assert.ok(await p.evaluate(()=>!!__sr.S.lastChal),'remembered');
  await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(300);
  await p.evaluate(()=>{ __sr.showModes(); }); await p.click('#mGrid [data-mode=friend]'); assert.ok(await p.isVisible('#fsShare'),'still there after a reload: no "no round to send"'); await p.click('#fsClose');
  await p.evaluate(()=>{ __sr.S.coins=0; __sr.startChallenge(__sr.parseChallenge('classic.30.5')); }); await p.waitForTimeout(200);
  await L.climb(p,20,60000); await endIt(p);
  let r=await p.evaluate(()=>({d:__sr.S.duels.length,w:__sr.S.friendWins,big:__sr.S.friendBig,c:__sr.S.coins,ach:!!__sr.S.ach.duel100,last:__sr.S.duels[__sr.S.duels.length-1]}));
  assert.equal(r.d,1); assert.equal(r.w,1); assert.equal(r.big,1); assert.ok(r.ach,'Century Rival unlocked'); assert.ok(r.c>=60,'the bonus was paid ('+r.c+')'); assert.ok(r.last.a>=100&&r.last.b===30);
  const c1=r.c; await p.click('#again'); await p.waitForTimeout(300); await L.climb(p,20,60000); await endIt(p);
  r=await p.evaluate(()=>({d:__sr.S.duels.length,big:__sr.S.friendBig,c:__sr.S.coins})); assert.equal(r.d,2,'the replay is in the history'); assert.equal(r.big,1,'but pays no second bonus'); assert.ok(r.c-c1<60,'coins: only the normal round pay');
  await p.evaluate(()=>{ __sr.showMenu(); __sr.showModes(); }); await p.click('#mGrid [data-mode=friend]'); assert.equal(await p.locator('#fsHist .frow').count(),2); assert.match(await p.textContent('#fsHist'),/Won 2/);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['campaign power-ups: Titan, Magnet, Freeze and Second Wind are only in campaign stages, never make the round boosted, and do what they say; relics pay coins and every third gives a power-up', async(e,L)=>{
  const p=await L.open(e); await BASE(p,{},[]);
  await p.evaluate(()=>{ Object.assign(__sr.S.shop.boosts,{titan:1,magnet:1,freeze:1,windp:1}); __sr.startMode('classic'); }); await p.waitForTimeout(150);
  assert.deepEqual(await p.evaluate(()=>__sr.held.slice()),[],'none outside the campaign');
  await p.evaluate(()=>{ __sr.showMenu(); __sr.S.tips.relic=1; __sr.startStage(1); }); await p.waitForTimeout(200);
  assert.deepEqual(await p.evaluate(()=>__sr.held.slice().sort()),['freeze','magnet','titan','windp']);
  const near='s=>s.cur&&Math.abs(s.cur.x-s.topX)>28&&Math.abs(s.cur.x-s.topX)<70';
  await openP(p); await p.click('#powerList [data-power=titan]'); await p.waitForTimeout(200);
  const w0=await p.evaluate(()=>__sr.top.w); await L.act(p,near); await p.waitForTimeout(100);
  assert.ok(Math.abs(await p.evaluate(()=>__sr.top.w)-w0)<1,'Titan: the block kept its width'); assert.equal(await p.evaluate(()=>__sr.titanLeft),9);
  assert.equal(await p.evaluate(()=>__sr.boosted),false,'a campaign power-up does not make the round boosted');
  await openP(p); await p.click('#powerList [data-power=magnet]'); await p.waitForTimeout(150); const c0=await p.evaluate(()=>__sr.S.perfects+__sr.perfectsRun);
  await L.act(p,near); await p.waitForTimeout(100); assert.equal(await p.evaluate(()=>__sr.magnetLeft),4,'Magnet used a drop'); assert.ok(await p.evaluate(()=>__sr.combo)>=1,'the near drop snapped on: a perfect');
  await openP(p); await p.click('#powerList [data-power=freeze]'); await p.waitForTimeout(100); const x1=await p.evaluate(()=>__sr.cur.x); await p.waitForTimeout(600); assert.equal(await p.evaluate(()=>__sr.cur.x),x1,'Freeze: the block stands still');
  const l0=await p.evaluate(()=>__sr.lives); await openP(p); await p.click('#powerList [data-power=windp]'); assert.equal(await p.evaluate(()=>__sr.lives),l0+1,'Second Wind: a life');
  assert.deepEqual(await p.evaluate(()=>[__sr.S.shop.boosts.titan,__sr.S.shop.boosts.magnet,__sr.S.shop.boosts.freeze,__sr.S.shop.boosts.windp]),[0,0,0,0],'used up');
  /* relics */
  await p.waitForTimeout(2200); const r0=await p.evaluate(()=>[__sr.S.relics,__sr.S.coins]);
  await p.evaluate(()=>{ __sr.cur.relic=1; }); await L.perfect(p); await p.waitForTimeout(100);
  const r1=await p.evaluate(()=>[__sr.S.relics,__sr.S.coins]); assert.equal(r1[0],r0[0]+1,'a relic'); assert.ok(r1[1]>=r0[1]+6,'and its coins');
  await p.evaluate(()=>{ __sr.S.relics=2; __sr.cur.relic=1; }); await L.perfect(p); await p.waitForTimeout(100);
  assert.equal(await p.evaluate(()=>__sr.S.shop.boosts.titan),1,'the third relic earns a power-up');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['rare awards: clearing World 5 pays 300 coins and unlocks the Crystal Cavern theme; locked campaign themes say which award they need; rare awards are marked in the list', async(e,L)=>{
  const p=await L.open(e); await BASE(p,{},[]);
  const r0=await p.evaluate(()=>({c:__sr.S.coins,own:__sr.S.owned.includes('crystal')})); assert.equal(r0.own,false);
  await p.click('#openThemes'); await p.evaluate(()=>__sr.setTab('themes')); const sub=await p.evaluate(()=>__sr.themeActOf('crystal').sub); assert.match(sub,/Cave Diver/);
  await p.evaluate(()=>{ __sr.closeThemesNow(); for(let n=1;n<=30;n++) __sr.S.camp[n]=3; __sr.checkAch(); });
  const r1=await p.evaluate(()=>({c:__sr.S.coins,own:__sr.S.owned.includes('crystal'),a:!!__sr.S.ach.r_cave,f:!!__sr.S.ach.r_flaw5,g:__sr.S.owned.includes('glowworm'),fx:__sr.S.shop.owned.includes('fx:stars')}));
  assert.deepEqual([r1.own,r1.a,r1.f,r1.g,r1.fx],[true,true,true,true,true],'Cave Diver, Glowworm Guide and Flawless Start (with its free item)'); assert.ok(r1.c>=r0.c+300+500+400);
  await p.evaluate(()=>__sr.showMenu()); await p.click('#openAwards'); await p.waitForTimeout(250);
  assert.ok(await p.locator('#aList .aw.rare').count()>=9,'rare awards are marked'); assert.match(await p.textContent('#aList .aw.rare'),/RARE/); await p.click('#closeAwards');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['friend race: a code can be copied (no link needed) from the sheet and the game-over screen, and pasting it starts the challenge; the link share is unchanged', async(e,L)=>{
  const p=await L.open(e,{ctx:{permissions:['clipboard-read','clipboard-write']}}); await BASE(p,{},[]);
  await p.evaluate(()=>{ __sr.startFriend(); }); await p.waitForTimeout(200); await L.perfects(p,4); await L.miss(p); await endIt(p);
  assert.ok(await p.isVisible('#copyCode'),'Copy code on the game-over screen of a friend round'); assert.ok(await p.isVisible('#share'),'the normal Share is still there');
  await p.click('#copyCode'); const clip=await p.evaluate(()=>navigator.clipboard.readText());
  assert.ok(!/^https?:/.test(clip) && clip.split('.').length>=6,'a bare code, not a link ('+clip.slice(0,30)+')');
  await p.evaluate(()=>{ __sr.showMenu(); __sr.showModes(); }); await p.click('#mGrid [data-mode=friend]'); assert.ok(await p.isVisible('#fsCode')); await p.click('#fsCode'); assert.equal(await p.evaluate(()=>navigator.clipboard.readText()),clip);
  await p.click('#fsPaste'); await p.fill('#udInput',clip); await p.click('#udOk'); await p.waitForTimeout(200); assert.ok(await p.isVisible('#chal'),'pasting the code opens the challenge');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

];
