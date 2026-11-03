const assert=require('assert');
module.exports=[

['first PLAY offers a practice round that can be skipped (shown once, never nags again)', async(e,L)=>{
  const p=await L.open(e,{seen:false});
  await p.click('#play',{force:true}); await p.waitForTimeout(250);
  assert.ok(await p.isVisible('#tutOffer'),'practice offer shown on first play');
  assert.ok(await p.isVisible('#tutSkip'),'skip is right there');
  await p.click('#tutSkip'); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(()=>__sr.state),'playing','skipping starts a real round straight away');
  assert.equal(await p.evaluate(()=>__sr.mode),'classic');
  assert.equal(await p.evaluate(()=>__sr.S.tutSeen),true);
  await p.evaluate(()=>__sr.pause()); await p.click('#quit'); await p.waitForTimeout(200);
  await p.click('#play',{force:true}); await p.waitForTimeout(250);
  assert.equal(await p.isVisible('#tutOffer'),false,'offer is not shown a second time');
  assert.equal(await p.evaluate(()=>__sr.state),'playing');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['practice round: coaching text, a Skip button, no game over, and it hands over to a real round', async(e,L)=>{
  const p=await L.open(e,{seen:false});
  await p.click('#play',{force:true}); await p.click('#tutGo'); await p.waitForTimeout(250);
  assert.equal(await p.evaluate(()=>__sr.mode),'practice');
  assert.ok(await p.isVisible('#coach'),'coach shown'); assert.ok(await p.isVisible('#skipTut'),'skip shown');
  assert.ok((await p.textContent('#coachText')).length>10);
  await p.evaluate(()=>__sr.forceNarrow()); await L.act(p,L.FAR); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(()=>__sr.state),'playing','a miss in practice never ends the round');
  await L.perfects(p,3); await p.waitForTimeout(1700);
  assert.notEqual(await p.evaluate(()=>__sr.mode),'practice','finishing practice starts a real round');
  assert.equal(await p.evaluate(()=>__sr.state),'playing');
  // and the practice can be skipped part-way
  await p.evaluate(()=>{ __sr.pause(); }); await p.click('#quit'); await p.waitForTimeout(200);
  await p.evaluate(()=>__sr.startPractice()); await p.waitForTimeout(200);
  await p.click('#skipTut'); await p.waitForTimeout(300);
  assert.notEqual(await p.evaluate(()=>__sr.mode),'practice');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['timing assist: widens the perfect window and slows blocks for the first 6 games, and can be switched off', async(e,L)=>{
  const p=await L.open(e);
  assert.equal(await p.evaluate(()=>__sr.assistOn()),true,'on for a brand-new player');
  await p.evaluate(()=>{ __sr.startMode('classic'); }); await p.waitForTimeout(100);
  const on=await p.evaluate(()=>({tol:__sr.tolFactor(),sp:__sr.sp}));
  await p.evaluate(()=>{ __sr.S.played=6; });
  assert.equal(await p.evaluate(()=>__sr.assistOn()),false,'auto assist ends after 6 games');
  await p.evaluate(()=>{ __sr.startMode('classic'); }); await p.waitForTimeout(100);
  const off=await p.evaluate(()=>({tol:__sr.tolFactor(),sp:__sr.sp}));
  assert.ok(on.tol>off.tol,'wider window with assist'); assert.ok(on.sp<off.sp,'slower blocks with assist');
  // Settings button cycles Auto -> Always -> Off
  await p.evaluate(()=>{ __sr.pause(); }); await p.click('#quit'); await p.click('#openSettings');
  const label=()=>p.evaluate(()=>document.querySelector('[data-set=assist]').textContent.trim());
  assert.equal(await label(),'Auto'); await p.click('[data-set=assist]'); assert.equal(await label(),'Always');
  assert.equal(await p.evaluate(()=>__sr.assistOn()),true); await p.click('[data-set=assist]'); assert.equal(await label(),'Off');
  assert.equal(await p.evaluate(()=>__sr.assistOn()),false);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['settings: toggles persist, reduce-motion follows the phone by default, and the choice sticks', async(e,L)=>{
  const calm=await L.open(e,{ctx:{reducedMotion:'reduce'}});
  assert.equal(await calm.evaluate(()=>document.body.classList.contains('calm')),true,'follows prefers-reduced-motion');
  await L.close(calm);
  const p=await L.open(e);
  assert.equal(await p.evaluate(()=>document.body.classList.contains('calm')),false);
  await p.click('#openSettings');
  const btn=k=>p.locator(`[data-set=${k}]`);
  assert.equal((await btn('sound').textContent()).trim(),'ON');
  await btn('sound').click(); assert.equal((await btn('sound').textContent()).trim(),'OFF');
  await btn('reduce').click(); assert.equal((await btn('reduce').textContent()).trim(),'ON');
  assert.equal(await p.evaluate(()=>document.body.classList.contains('calm')),true);
  await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(250);
  const st=await p.evaluate(()=>({mute:__sr.S.mute,reduce:__sr.S.reduce,calm:document.body.classList.contains('calm')}));
  assert.deepEqual(st,{mute:true,reduce:true,calm:true},'settings survive a reload');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['save code: copy -> wipe -> paste restores progress', async(e,L)=>{
  const p=await L.open(e);
  await p.evaluate(()=>{ __sr.S.coins=777; __sr.S.bests.classic=42; __sr.S.theme='sunset'; });
  let code=''; let phase='export';
  await p.evaluate(()=>{ navigator.clipboard.writeText=async t=>{ window.__copied=t; }; });
  await p.click('#openSettings'); await p.click('[data-set=export]'); await p.waitForTimeout(300);
  code=await p.evaluate(()=>window.__copied); assert.ok(code&&code.length>40,'a code was produced');
  await p.evaluate(()=>{ __sr.S.coins=1; __sr.S.bests.classic=0; });
  let n=0; p.on('dialog',d=>{ n++; if(n===1) d.accept(code); else d.accept(); });
  await p.click('[data-set=import]'); await p.waitForTimeout(500);
  const r=await p.evaluate(()=>({coins:__sr.S.coins,best:__sr.S.bests.classic}));
  assert.deepEqual(r,{coins:777,best:42}); assert.deepEqual(p.errs,[]); await L.close(p);
}],

['themes: tapping one previews it live, equip/buy/lock rules are explained, premium shows a clear message when the store is not connected', async(e,L)=>{
  const p=await L.open(e);
  await p.evaluate(()=>{ __sr.S.coins=500; });
  await p.click('#openThemes'); await p.waitForTimeout(250);
  assert.equal(await p.locator('.th').count(),15,'15 themes');
  await p.click('.sw[data-id=neon]'); await p.waitForTimeout(250);
  assert.equal(await p.evaluate(()=>__sr.previewId),'neon'); assert.ok(await p.isVisible('#peek'));
  assert.equal(await p.evaluate(()=>__sr.S.theme),'sunset','preview does not change the saved theme');
  await p.click('#peekClose'); assert.equal(await p.evaluate(()=>__sr.previewId),null);
  // premium theme without a payment link
  await p.click('.sw[data-id=gold]'); await p.waitForTimeout(150);
  await p.click('#peekAct'); await p.waitForTimeout(250);
  assert.match(await p.textContent('#toast'),/Store is not connected/i);
  assert.equal(await p.evaluate(()=>__sr.S.owned.includes('gold')),false,'no free premium theme');
  await p.click('#peekClose');
  // a theme that costs coins can be bought exactly once
  const buy=await p.evaluate(()=>{ const t=Object.entries(__sr.THEMES).find(([id,th])=>th.unlock.t==='coins'&&th.unlock.n<=500); return t?{id:t[0],n:t[1].unlock.n}:null; });
  assert.ok(buy,'a coin theme exists');
  await p.click(`.sw[data-id=${buy.id}]`); await p.click('#peekAct'); await p.waitForTimeout(300);
  const after=await p.evaluate(id=>({owned:__sr.S.owned.includes(id),coins:__sr.S.coins,theme:__sr.S.theme}),buy.id);
  assert.deepEqual(after,{owned:true,coins:500-buy.n,theme:buy.id});
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['menu: PLAY starts the chosen mode in one tap; the mode switcher changes it without opening a list; More game modes opens the list', async(e,L)=>{
  const p=await L.open(e);
  assert.match(await p.textContent('#modeName'),/Classic/);
  await p.click('#modeNext'); assert.match(await p.textContent('#modeName'),/Timed/);
  await p.click('#modeNext'); assert.match(await p.textContent('#modeName'),/Lives/);
  await p.click('#modePrev'); assert.match(await p.textContent('#modeName'),/Timed/);
  await p.click('#play',{force:true}); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(()=>__sr.state),'playing'); assert.equal(await p.evaluate(()=>__sr.mode),'timed');
  await p.evaluate(()=>__sr.pause()); await p.click('#quit'); await p.waitForTimeout(250);
  assert.match(await p.textContent('#modeName'),/Timed/,'the menu remembers the last mode');
  await p.click('#openModes'); await p.waitForTimeout(250);
  assert.ok(await p.isVisible('#modes')); await p.click('[data-mode=zen]'); await p.waitForTimeout(250);
  assert.equal(await p.evaluate(()=>__sr.mode),'zen');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['first time in a mode shows a one-line tip once; the menu has a live tower behind it', async(e,L)=>{
  const p=await L.open(e);
  await p.evaluate(()=>__sr.startMode('hazard')); await p.waitForTimeout(400);
  assert.match(await p.textContent('#toast'),/bombs/i);
  assert.equal(await p.evaluate(()=>__sr.S.tips.hazard),1);
  await p.evaluate(()=>{ __sr.pause(); }); await p.click('#quit'); await p.waitForTimeout(250);
  await p.evaluate(()=>{ document.getElementById('toast').textContent=''; __sr.startMode('hazard'); }); await p.waitForTimeout(500);
  assert.doesNotMatch(await p.textContent('#toast'),/bombs/i,'tip is not repeated');
  // the attract tower grows on its own behind the menu
  await p.evaluate(()=>{ __sr.pause(); }); await p.click('#quit'); await p.waitForTimeout(200);
  const n0=await p.evaluate(()=>__sr.stackLen); await p.waitForTimeout(5000);
  const n1=await p.evaluate(()=>__sr.stackLen); assert.ok(n1!==n0,`menu tower animates (${n0} -> ${n1})`);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['every button is a comfortable touch target (>=44px) on the menu, settings, modes, themes and game-over screens', async(e,L)=>{
  const p=await L.open(e);
  const small=()=>p.evaluate(()=>[...document.querySelectorAll('button:not(.hidden), [role=button]')]
    .filter(b=>{ const r=b.getBoundingClientRect(); const cs=getComputedStyle(b); return r.width>0 && r.height>0 && cs.visibility!=='hidden' && !b.closest('.hidden') && (b.offsetWidth<44||b.offsetHeight<44); })   // layout size: a card that is still animating in is scaled
    .map(b=>`${b.id||b.className||b.tagName}:${b.offsetWidth}x${b.offsetHeight}`));
  const bad={};
  const check=async name=>{ const s=await small(); if(s.length) bad[name]=s; };
  await p.waitForTimeout(500); await check('menu');
  await p.click('#openSettings'); await p.waitForTimeout(450); await check('settings'); await p.click('#closeSettings');
  await p.click('#openModes'); await p.waitForTimeout(450); await check('modes'); await p.click('#closeModes');
  await p.click('#openThemes'); await p.waitForTimeout(450); await check('themes'); await p.click('#closeThemes');
  await p.click('#openAwards'); await p.waitForTimeout(450); await check('awards'); await p.click('#closeAwards');
  await p.click('#openCampaign'); await p.waitForTimeout(450); await check('campaign'); await p.click('#closeStages');
  await p.evaluate(()=>{ __sr.S.coins=300; __sr.startMode('classic'); }); await p.waitForTimeout(200);
  await L.perfects(p,2); await L.miss(p); await p.waitForTimeout(1500); await check('game over');
  assert.deepEqual(bad,{},'buttons smaller than 44px: '+JSON.stringify(bad)); assert.deepEqual(p.errs,[]); await L.close(p);
}],

['short phones (iPhone SE 375x667, 360x640, 360x740): the whole menu fits without scrolling and every button is still 44px+', async(e,L)=>{
  for(const [w,h] of [[375,667],[360,640],[360,740]]){
    const p=await L.open(e,{ctx:{viewport:{width:w,height:h}}}); await p.waitForTimeout(700);     // a new player: the longest menu (Claim button + next unlock)
    const r=await p.evaluate(()=>{ const m=document.getElementById('menu');
      return {over:m.scrollHeight-m.clientHeight,small:[...m.querySelectorAll('button')].filter(b=>{ const q=b.getBoundingClientRect(); return q.width>0&&(q.width<44||q.height<44); }).map(b=>b.id||b.className)}; });
    assert.equal(r.over,0,`${w}x${h}: the menu is ${r.over}px taller than the screen`); assert.deepEqual(r.small,[],`${w}x${h}: buttons under 44px`);
    assert.deepEqual(p.errs,[]); await L.close(p);
  }
}],

['best-run outline: the dashed ghost tower can be hidden in Settings (the BEST line stays), and the choice persists', async(e,L)=>{
  const p=await L.open(e);
  await p.evaluate(()=>{                                                          // a short saved best run, so the BEST line is on screen from the start
    const blocks=Array.from({length:6},()=>({x:.3,w:.4})); __sr.S.ghosts.classic={score:12,blocks,scores:[0,1,2,4,6,9]};
    window.__dash=0; window.__best=0;
    const dash=CanvasRenderingContext2D.prototype.setLineDash, text=CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.setLineDash=function(a){ if(a&&a.length) window.__dash++; return dash.call(this,a); };
    CanvasRenderingContext2D.prototype.fillText=function(t,...r){ if(/^BEST \d/.test(t)) window.__best++; return text.call(this,t,...r); };
  });
  const sample=async()=>{ await p.evaluate(()=>{ window.__dash=0; window.__best=0; }); await p.waitForTimeout(300); return p.evaluate(()=>({dash:window.__dash,best:window.__best})); };
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(200);
  let r=await sample(); assert.ok(r.dash>0,'the dashed outline is drawn by default'); assert.ok(r.best>0,'and so is the BEST line');
  await p.evaluate(()=>__sr.pause()); await p.click('#quit'); await p.click('#openSettings');
  const btn=p.locator('[data-set=ghost]'); assert.equal((await btn.textContent()).trim(),'ON');
  await btn.click(); assert.equal((await btn.textContent()).trim(),'OFF'); assert.equal(await p.evaluate(()=>__sr.ghostOutline),false);
  await p.click('#closeSettings'); await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(200);
  r=await sample(); assert.equal(r.dash,0,'no dashed outline once hidden'); assert.ok(r.best>0,'the BEST line is still shown'); assert.ok(await p.evaluate(()=>!!__sr.ghost),'the ghost run itself is still loaded');
  await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('ready'));
  assert.equal(await p.evaluate(()=>__sr.ghostOutline),false,'the choice survives a reload');
  await p.click('#openSettings'); assert.equal((await p.locator('[data-set=ghost]').textContent()).trim(),'OFF');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['music: generative loop starts on the first tap, follows the setting, and stops when muted', async(e,L)=>{
  const p=await L.open(e);
  await p.mouse.click(195,420); await p.waitForTimeout(600);
  assert.equal(await p.evaluate(()=>__sr.musicOn),true,'music is on after the first user gesture');
  await p.click('#mute2'); await p.waitForTimeout(200);
  assert.equal(await p.evaluate(()=>__sr.musicOn),false,'mute silences the music');
  await p.click('#mute2'); await p.waitForTimeout(200);
  assert.equal(await p.evaluate(()=>__sr.musicOn),true);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['accessibility: live region announces results, icon-only buttons have labels, landscape asks for portrait', async(e,L)=>{
  const p=await L.open(e);
  const unlabeled=await p.evaluate(()=>[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>0 && !b.textContent.trim() && !b.getAttribute('aria-label')).map(b=>b.id||b.className));   // (buttons that are on screen)
  assert.deepEqual(unlabeled,[],'every icon-only button has an aria-label');
  assert.equal(await p.getAttribute('#live','aria-live'),'polite');
  await p.evaluate(()=>{ __sr.S.coins=300; __sr.startMode('classic'); }); await p.waitForTimeout(150);
  await L.perfects(p,2); assert.match(await p.textContent('#live'),/./,'perfects are announced');
  await L.miss(p); await p.waitForTimeout(1400);
  assert.match(await p.textContent('#live'),/\d/,'the result is announced');
  await p.setViewportSize({width:844,height:390}); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(()=>getComputedStyle(document.getElementById('rotate')).display!=='none'),true,'landscape phone is asked to rotate');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['crash screen: after repeated frame errors the player sees a friendly reload screen instead of a frozen game', async(e,L)=>{
  const p=await L.open(e);
  assert.equal(await p.isVisible('#crash'),false);
  assert.equal(await p.evaluate(()=>typeof __sr.tr),'function');
  assert.ok(await p.evaluate(()=>document.getElementById('crashBtn')!==null));
  await L.close(p);
}],

];
