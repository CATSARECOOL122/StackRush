/* Split screen: two players at once. Each half is a separate copy of the game in an iframe; the page around them runs the rounds. */
const assert=require('assert');
const UA='Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const kids=p=>p.frames().filter(f=>/split=1/.test(f.url()));
const kid=(p,n)=>p.frames().find(f=>new RegExp('split=1&p='+n).test(f.url()));
async function begin(e,L,o){ const p=await L.open(e,o||{ctx:{viewport:{width:390,height:844},hasTouch:true}}); await p.evaluate(()=>{ __sr.startSplit(); }); await p.waitForFunction(()=>__sr.SPL&&__sr.SPL.phase==='play',null,{timeout:12000}); await p.waitForTimeout(120); return p; }
const ph=p=>p.evaluate(()=>__sr.SPL?__sr.SPL.phase:'none');
const st=p=>p.evaluate(()=>({phase:__sr.SPL.phase,wins:__sr.SPL.wins.slice(),rn:__sr.SPL.rn,sc:__sr.SPL.sc.slice(),out:__sr.SPL.out.slice()}));
module.exports=[
['split screen: a one-time introduction pops up on the menu, explains the mode, never comes back, and Try it now opens the setup', async(e,L)=>{
  const p=await L.open(e,{intro:true}); await p.evaluate(()=>{ __sr.S.splitIntro=0; __sr.showMenu(); });
  await p.waitForSelector('#splitIntro:not(.hidden)',{timeout:4000});
  const t=await p.textContent('#splitIntro'); assert.match(t,/INTRODUCING/); assert.match(t,/2 PLAYER/); assert.match(t,/SPLIT SCREEN/); assert.match(t,/upside down/); assert.match(t,/iPad/);
  assert.equal(await p.evaluate(()=>__sr.S.splitIntro),1,'marked as seen the moment it shows');
  await p.click('#splitIntroGo'); await p.waitForTimeout(200); assert.equal(await p.isVisible('#splitIntro'),false); assert.equal(await p.isVisible('#splitSetup'),true,'Try it now opens the setup');
  await p.evaluate(()=>history.back()).catch(()=>{}); await p.waitForTimeout(250);
  await p.evaluate(()=>{ __sr.showMenu(); }); await p.waitForTimeout(2300); assert.equal(await p.isVisible('#splitIntro'),false,'it does not come back');
  await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(2500); assert.equal(await p.isVisible('#splitIntro'),false,'not after a reload either');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],
['split screen: the intro waits for the plain menu (not over the practice offer or another sheet) and shows Maybe later / Back correctly', async(e,L)=>{
  const p=await L.open(e,{intro:true}); await p.evaluate(()=>{ __sr.S.splitIntro=0; __sr.showMenu(); document.getElementById('openThemes').click(); }); await p.waitForTimeout(2400);
  assert.equal(await p.isVisible('#splitIntro'),false,'not over the Shop');
  await p.evaluate(()=>{ document.getElementById('closeThemes').click(); }); await p.waitForTimeout(300); await p.evaluate(()=>{ __sr.splitIntroCheck(); });
  assert.equal(await p.isVisible('#splitIntro'),true); await p.click('#splitIntroNo'); assert.equal(await p.isVisible('#splitIntro'),false); assert.equal(await p.evaluate(()=>__sr.S.splitIntro),1);
  await p.evaluate(()=>__sr.openSplitIntro()); assert.equal(await p.isVisible('#splitIntro'),true); await p.evaluate(()=>history.back()).catch(()=>{}); await p.waitForTimeout(300); assert.equal(await p.isVisible('#splitIntro'),false,'Back closes it');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],
['split screen: setup sheet: the tile is in the modes list; iPhone offers only face to face, a tablet also side by side; rounds 1/3/5 are remembered', async(e,L)=>{
  let p=await L.open(e); await p.click('#openModes'); assert.equal(await p.locator('#mGrid [data-mode=split]').count(),1,'the Split screen tile'); await p.click('#mGrid [data-mode=split]'); await p.waitForTimeout(200);
  assert.equal(await p.locator('#spBody [data-lay]').count(),1,'iPhone: only face to face'); assert.equal(await p.locator('#spBody [data-rounds]').count(),3);
  await p.click('#spBody [data-rounds="5"]'); assert.equal(await p.evaluate(()=>__sr.spCfg().rounds),5); await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('ready')); assert.equal(await p.evaluate(()=>__sr.spCfg().rounds),5,'remembered after a reload');
  await L.close(p);
  p=await L.open(e,{ctx:{viewport:{width:820,height:1000},hasTouch:true,userAgent:UA}}); await p.click('#openModes'); await p.click('#mGrid [data-mode=split]'); await p.waitForTimeout(200);
  assert.equal(await p.locator('#spBody [data-lay]').count(),2,'iPad: face to face and side by side'); await p.click('#spBody [data-lay=lr]'); assert.equal(await p.evaluate(()=>__sr.spCfg().layout),'lr');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],
['split screen on iPhone: two games stacked, the top one upside down, both ready, a countdown, then both play; nothing is saved', async(e,L)=>{
  const p=await L.open(e,{ctx:{viewport:{width:390,height:844},hasTouch:true}}); await p.evaluate(()=>{ __sr.S.coins=123; __sr.S.played=5; });
  const before=await p.evaluate(()=>localStorage.getItem('stackrush.v2')); await p.evaluate(()=>{ __sr.startSplit(); });
  await p.waitForFunction(()=>__sr.SPL&&__sr.SPL.phase==='count',null,{timeout:12000}); assert.equal(await p.locator('#split iframe').count(),2);
  const g=await p.evaluate(()=>{ const r=n=>document.querySelector('#split .sph[data-p="'+n+'"]').getBoundingClientRect(), f=n=>document.querySelector('#split .sph[data-p="'+n+'"] iframe').getBoundingClientRect();
    return {top:[r(2).top,r(2).height],bot:[r(1).top,r(1).height],rot:getComputedStyle(document.querySelector('#split .sph[data-p="2"]')).transform,rot1:getComputedStyle(document.querySelector('#split .sph[data-p="1"]')).transform,fh:[f(1).height,f(2).height],w:innerWidth,h:innerHeight}; });
  assert.ok(Math.abs(g.top[1]-g.h/2)<2 && Math.abs(g.bot[1]-g.h/2)<2,'two equal halves'); assert.ok(g.top[0]<1 && Math.abs(g.bot[0]-g.h/2)<2);
  assert.match(g.rot,/matrix\(-1, ?[^,]*, ?[^,]*, ?-1/,'the top half is turned 180 degrees'); assert.equal(g.rot1,'none','the bottom half is upright');
  await p.waitForSelector('#split .spcd',{timeout:3000}); assert.equal(await p.isDisabled('#spPause'),true,'no pausing during the countdown');
  assert.equal(await p.locator('#split .spov .spcd').count(),2,'the countdown is in both halves');
  await p.waitForFunction(()=>__sr.SPL.phase==='play',null,{timeout:8000});
  const kidsInfo=await Promise.all([1,2].map(n=>kid(p,n).evaluate(()=>({st:__sr.state,paused:document.documentElement.className,tag:document.getElementById('spTag').textContent,score:document.getElementById('score').textContent}))));
  assert.deepEqual(kidsInfo.map(k=>k.st),['playing','playing']); assert.match(kidsInfo[0].tag,/PLAYER 1/); assert.match(kidsInfo[1].tag,/PLAYER 2/);
  assert.equal(await p.evaluate(()=>localStorage.getItem('stackrush.v2').replace(/"splitCfg":[^}]*}/,'')),before.replace(/"splitCfg":[^}]*}/,''),'the children saved nothing (coins, best scores, awards are untouched)');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],
['split screen: each player taps in their own half; scores reach the other half live; a perfect drop scores in the right half only', async(e,L)=>{
  const p=await begin(e,L); const k1=kid(p,1), k2=kid(p,2);
  assert.equal(await L.perfects(k1,3),3); await p.waitForTimeout(150);
  const s=await st(p); assert.ok(s.sc[0]>=3 && s.sc[1]===0,'P1 scored, P2 did not: '+s.sc);
  assert.match(await k2.textContent('#spOpp'),/OPP [3-9]/,'P2 sees P1\'s live score'); assert.equal(await k1.evaluate(()=>document.getElementById('score').textContent!=='0'),true); assert.equal(await k2.evaluate(()=>document.getElementById('score').textContent),'0');
  assert.equal(await L.perfects(k2,2),2); await p.waitForTimeout(150); const s2=await st(p); assert.ok(s2.sc[1]>=2); assert.match(await k1.textContent('#spOpp'),/OPP [2-9]/);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],
['split screen rounds: the player still going wins the moment they pass the one who is out; best of 3 ends after two wins; each half reads its own result; Rematch and Menu work', async(e,L)=>{
  const p=await begin(e,L); const k1=kid(p,1), k2=kid(p,2);
  await k2.evaluate(()=>{ __sr.forceScore(4); }); await k2.evaluate(()=>{ __sr.endNow(); }); await p.waitForTimeout(150);
  let s=await st(p); assert.equal(s.phase,'play','P2 is out with 4 but P1 has 0: the round goes on'); assert.deepEqual(s.out,[false,true]);
  assert.match(await k1.textContent('#spOpp'),/OPP 4 · OUT/,'P1 is told P2 is out'); assert.equal(await p.locator('#spPause').isDisabled(),false);
  await k1.evaluate(()=>{ __sr.forceScore(4); }); await p.waitForTimeout(120); assert.equal((await st(p)).phase,'play','a tie keeps going'); await k1.evaluate(()=>{ __sr.forceScore(5); }); await p.waitForTimeout(150);
  s=await st(p); assert.equal(s.phase,'result'); assert.deepEqual(s.wins,[1,0]); const txt=await p.evaluate(()=>[1,2].map(n=>document.querySelector('#split .spov[data-p="'+n+'"]').textContent));
  assert.match(txt[0],/YOU WIN!/); assert.match(txt[1],/YOU LOSE/); assert.match(txt[0],/5 – 4/); assert.match(txt[1],/4 – 5/,'each half shows its own score first');
  await p.waitForFunction(()=>__sr.SPL.phase==='play'&&__sr.SPL.rn===2,null,{timeout:9000}); assert.equal(await k1.evaluate(()=>document.getElementById('score').textContent),'0','a fresh round');
  await k1.evaluate(()=>{ __sr.forceScore(9); __sr.endNow(); }); await k2.evaluate(()=>{ __sr.forceScore(3); __sr.endNow(); }); await p.waitForFunction(()=>__sr.SPL.phase==='match',null,{timeout:9000});
  const m=await p.evaluate(()=>[1,2].map(n=>document.querySelector('#split .spov[data-p="'+n+'"]').textContent)); assert.match(m[0],/PLAYER 1 WINS THE MATCH/); assert.match(m[0],/YOU WIN!/); assert.match(m[1],/YOU LOSE/); assert.match(m[0],/REMATCH/); assert.match(m[1],/MENU/);
  assert.equal(await p.evaluate(()=>__sr.SPL.wins.join('-')),'2-0');
  await p.click('#split .spov[data-p="2"] [data-sp=again]'); await p.waitForFunction(()=>__sr.SPL.phase==='play'&&__sr.SPL.wins.join('-')==='0-0'&&__sr.SPL.rn===1,null,{timeout:9000});
  await k1.evaluate(()=>{ __sr.forceScore(2); __sr.endNow(); }); await k2.evaluate(()=>{ __sr.forceScore(8); }); await p.waitForTimeout(200); assert.deepEqual((await st(p)).wins,[0,1],'P2 wins a round by outlasting P1');
  await p.waitForFunction(()=>__sr.SPL.phase==='play',null,{timeout:9000}); await p.evaluate(()=>{ __sr.splitPause(); }); await p.click('#split .spov[data-p="1"] [data-sp=menu]'); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(()=>__sr.SPL),null,'Quit leaves the split screen'); assert.equal(await p.isVisible('#menu'),true); assert.equal(await p.locator('#split iframe').count(),0);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],
['split screen: both out decides by score; a draw is played again without counting; a single round ends the match', async(e,L)=>{
  const p=await begin(e,L); const k1=kid(p,1), k2=kid(p,2);
  await k1.evaluate(()=>{ __sr.forceScore(6); __sr.endNow(); }); await k2.evaluate(()=>{ __sr.forceScore(6); __sr.endNow(); }); await p.waitForFunction(()=>__sr.SPL.phase==='result',null,{timeout:3000});
  assert.deepEqual((await st(p)).wins,[0,0],'a draw counts for nobody'); assert.match(await p.textContent('#split .spov[data-p="1"]'),/DRAW/); assert.match(await p.textContent('#split .spov[data-p="1"]'),/again/i);
  await p.waitForFunction(()=>__sr.SPL.phase==='play',null,{timeout:9000}); assert.equal(await p.evaluate(()=>__sr.SPL.rn),1,'the same round number is replayed');
  await k1.evaluate(()=>{ __sr.forceScore(3); __sr.endNow(); }); await k2.evaluate(()=>{ __sr.forceScore(5); __sr.endNow(); }); await p.waitForFunction(()=>__sr.SPL.phase==='result',null,{timeout:3000}); assert.deepEqual((await st(p)).wins,[0,1]);
  await p.evaluate(()=>{ __sr.splitQuit(); __sr.S.splitCfg={layout:'tb',rounds:1}; __sr.startSplit(); }); await p.waitForFunction(()=>__sr.SPL&&__sr.SPL.phase==='play',null,{timeout:12000});
  await kid(p,1).evaluate(()=>{ __sr.forceScore(1); __sr.endNow(); }); await kid(p,2).evaluate(()=>{ __sr.forceScore(2); __sr.endNow(); }); await p.waitForFunction(()=>__sr.SPL.phase==='match',null,{timeout:9000});
  assert.match(await p.textContent('#split .spov[data-p="2"]'),/PLAYER 2 WINS THE MATCH/);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],
['split screen: pause freezes both games, Resume counts 3-2-1 and carries on, Back pauses during play; a player who goes quiet cannot stall the round', async(e,L)=>{
  const p=await begin(e,L); const k1=kid(p,1);
  const x0=await k1.evaluate(()=>__sr.cur.x); await p.waitForTimeout(250); const x1=await k1.evaluate(()=>__sr.cur.x); assert.notEqual(x0,x1,'the block moves while playing');
  await p.click('#spPause'); await p.waitForTimeout(200); assert.equal(await p.evaluate(()=>__sr.SPL.paused),true); const a=await k1.evaluate(()=>__sr.cur.x); await p.waitForTimeout(300); assert.equal(await k1.evaluate(()=>__sr.cur.x),a,'frozen');
  assert.match(await p.textContent('#split .spov[data-p="2"]'),/PAUSED/); assert.match(await p.textContent('#split .spov[data-p="2"]'),/Resume/);
  await k1.evaluate(()=>document.getElementById('c').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))); await p.waitForTimeout(100); assert.equal(await k1.evaluate(()=>__sr.stackLen),1,'taps do nothing while paused');
  await p.click('#split .spov[data-p="1"] [data-sp=resume]'); await p.waitForTimeout(300); assert.ok(await p.isVisible('.spcd')); await p.waitForFunction(()=>__sr.SPL.phase==='play'&&!__sr.SPL.paused,null,{timeout:6000});
  const b=await k1.evaluate(()=>__sr.cur.x); await p.waitForTimeout(250); assert.notEqual(await k1.evaluate(()=>__sr.cur.x),b,'moving again');
  await p.evaluate(()=>history.back()).catch(()=>{}); await p.waitForTimeout(300); assert.equal(await p.evaluate(()=>__sr.SPL&&__sr.SPL.paused),true,'Back pauses during play');
  await p.click('#split .spov[data-p="1"] [data-sp=resume]'); await p.waitForFunction(()=>__sr.SPL.phase==='play'&&!__sr.SPL.paused,null,{timeout:6000});
  /* quiet players: P2 is out, P1 does nothing, so P1 loses after the idle time */
  await p.evaluate(()=>{ __sr.SPLIT_T.afk=1200; __sr.SPLIT_T.idle=1200; }); await kid(p,2).evaluate(()=>{ __sr.forceScore(2); __sr.endNow(); });
  await p.waitForFunction(()=>__sr.SPL.phase!=='play',null,{timeout:6000}); assert.deepEqual((await st(p)).wins,[0,1],'P1 went quiet while P2 was out: P2 wins');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],
['split screen on iPad: face to face (top half upside down) and side by side (both upright, left and right), tablet-sized halves, both playable', async(e,L)=>{
  for(const [lay,vw,vh] of [['tb',820,1000],['lr',1180,720],['lr',744,950]]){
    const p=await L.open(e,{ctx:{viewport:{width:vw,height:vh},hasTouch:true,userAgent:UA}}); await p.evaluate(l=>{ __sr.S.splitCfg={layout:l,rounds:3}; __sr.startSplit(); },lay);
    await p.waitForFunction(()=>__sr.SPL&&__sr.SPL.phase==='play',null,{timeout:12000}); await p.waitForTimeout(150);
    const g=await p.evaluate(()=>{ const r=n=>document.querySelector('#split .sph[data-p="'+n+'"]').getBoundingClientRect(); return {p1:[r(1).left,r(1).top,r(1).width,r(1).height],p2:[r(2).left,r(2).top,r(2).width,r(2).height],rot2:getComputedStyle(document.querySelector('#split .sph[data-p="2"]')).transform,w:innerWidth,h:innerHeight,cls:document.getElementById('split').className}; });
    if(lay==='tb'){ assert.ok(/lay-tb/.test(g.cls)); assert.match(g.rot2,/matrix\(-1/); assert.ok(Math.abs(g.p1[3]-vh/2)<2 && Math.abs(g.p2[3]-vh/2)<2); }
    else { assert.ok(/lay-lr/.test(g.cls)); assert.equal(g.rot2,'none','side by side: both upright'); assert.ok(g.p1[0]<1 && Math.abs(g.p2[0]-vw/2)<2 && Math.abs(g.p1[2]-vw/2)<2,vw+'x'+vh+': left and right halves'); }
    assert.equal(await L.perfects(kid(p,1),2),2); assert.equal(await L.perfects(kid(p,2),2),2);
    const clipped=await Promise.all([1,2].map(n=>kid(p,n).evaluate(()=>{ const t=document.getElementById('spTag').getBoundingClientRect(), sc=document.getElementById('score').getBoundingClientRect(); const cx=(sc.left+sc.right)/2; return [t.left>=0&&t.right<=innerWidth, cx>innerWidth*.4&&cx<innerWidth*.6, innerHeight>200]; })));
    assert.deepEqual(clipped,[[true,true,true],[true,true,true]],vw+'x'+vh+': tags and score inside each half');
    assert.deepEqual(p.errs,[]); await L.close(p);
  }
}],
['split screen: the screen behind is quiet, taps on the dividing pause button never reach a game, and the app does not break after quitting (menu plays, Classic works)', async(e,L)=>{
  const p=await begin(e,L); await p.click('#spPause'); await p.evaluate(()=>{ __sr.splitQuit(); }); await p.waitForTimeout(300);
  await p.evaluate(()=>document.getElementById('play').click()); await p.waitForTimeout(300); assert.equal(await p.evaluate(()=>__sr.state),'playing','Classic still starts after a split match'); assert.equal(await L.perfects(p,2),2);
  assert.equal(await p.evaluate(()=>document.body.classList.contains('splitting')),false); assert.equal(await p.evaluate(()=>document.documentElement.classList.contains('splitchild')),false,'the normal game is not in split-child mode');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],
['split screen: turning the iPad or resizing mid-match keeps both halves playing; 3D mode and one-handed mode in your settings do not leak into the halves; a half never shows a stray Back button', async(e,L)=>{
  const p=await L.open(e,{ctx:{viewport:{width:820,height:1180},hasTouch:true,userAgent:UA}}); await p.evaluate(()=>{ __sr.S.shop.owned.push('view:deep'); __sr.S.shop.equip.view='deep'; __sr.S.oneHand=true; __sr.S.splitCfg={layout:'tb',rounds:3}; __sr.startSplit(); });
  await p.waitForFunction(()=>__sr.SPL&&__sr.SPL.phase==='play',null,{timeout:12000}); const k1=kid(p,1), k2=kid(p,2);
  assert.deepEqual(await Promise.all([k1,k2].map(k=>k.evaluate(()=>[__sr.view3On(),document.getElementById('reachBack').classList.contains('hidden')]))),[[false,true],[false,true]],'flat view and no reach button in the halves');
  await L.perfects(k1,2); await p.setViewportSize({width:1180,height:820}); await p.waitForTimeout(500);
  const g=await p.evaluate(()=>[...document.querySelectorAll('#split iframe')].map(f=>{ const r=f.getBoundingClientRect(); return [Math.round(r.width),Math.round(r.height),f.contentWindow.innerWidth,f.contentWindow.innerHeight]; }));
  assert.deepEqual(g.map(x=>[x[0]===x[2],x[1]===x[3]]),[[true,true],[true,true]],'the halves resized with the screen'); assert.equal(await L.perfects(k1,2),2,'still playable after turning'); assert.equal(await L.perfects(k2,2),2);
  /* a finished half shows no Back button or menu of its own */
  await k2.evaluate(()=>{ __sr.forceScore(2); __sr.endNow(); }); await p.waitForTimeout(400);
  assert.deepEqual(await k2.evaluate(()=>({reach:!document.getElementById('reachBack').classList.contains('hidden'),over:!document.getElementById('over').classList.contains('hidden'),menu:!document.getElementById('menu').classList.contains('hidden')})),{reach:false,over:false,menu:false},'no game-over screen, menu or Back button inside a half');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],
['split screen: two fingers at the same moment, one in each half, both register (real multi-touch); a finger only drops its own half; pause button and overlays do not drop; the halves play their sounds through the page around them', async(e,L)=>{
  for(const [name,vw,vh,ua,lay] of [['iPhone',390,844,undefined,'tb'],['iPad face to face',820,1180,UA,'tb'],['iPad side by side',1180,820,UA,'lr']]){
    const p=await L.open(e,{ctx:{viewport:{width:vw,height:vh},hasTouch:true,userAgent:ua}}); await p.evaluate(l=>{ __sr.S.splitCfg={layout:l,rounds:3}; __sr.startSplit(); },lay);
    await p.waitForFunction(()=>__sr.SPL&&__sr.SPL.phase==='play',null,{timeout:12000}); await p.waitForTimeout(250);
    const cdp=await p.context().newCDPSession(p);
    const pt=await p.evaluate(()=>{ const c=n=>{ const r=document.querySelector('#split .sph[data-p="'+n+'"]').getBoundingClientRect(); return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height*0.55)}; }; const f=document.elementFromPoint(c(1).x,c(1).y); return {p1:c(1),p2:c(2),tag:f&&f.tagName}; });
    assert.notEqual(pt.tag,'IFRAME',name+': the halves never take the touch themselves');
    const state=async()=>Promise.all([1,2].map(n=>kid(p,n).evaluate(()=>({n:__sr.stackLen,over:__sr.state!=='playing'}))));
    const before=await state(); const sfx0=await p.evaluate(()=>__sr.SPL.sfxN||0);
    /* both fingers down in the very same instant */
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pt.p1.x,y:pt.p1.y,id:1},{x:pt.p2.x,y:pt.p2.y,id:2}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await p.waitForTimeout(400);
    const after=await state(); const dropped=after.map((a,i)=>a.n>before[i].n||a.over);
    assert.deepEqual(dropped,[true,true],name+': both players dropped from one two-finger tap: '+JSON.stringify([before,after]));
    assert.ok(await p.evaluate(()=>__sr.SPL.sfxN||0)>sfx0,name+': the drop sounds were played by the page around the halves');
    /* a finger in one half drops only that half */
    await p.waitForFunction(()=>__sr.SPL.phase==='play'||__sr.SPL.phase==='result'||__sr.SPL.phase==='match',null,{timeout:4000});
    if(await ph(p)==='play'){ const b2=await state(); await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pt.p2.x,y:pt.p2.y,id:5}]}); await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]}); await p.waitForTimeout(300); const a2=await state();
      assert.ok(a2[0].n===b2[0].n && a2[0].over===b2[0].over,name+': P1 did not drop from a tap in P2\'s half'); assert.ok(a2[1].n>b2[1].n||a2[1].over,name+': P2 dropped'); }
    assert.deepEqual(p.errs,[]); await L.close(p);
  }
}],
];
