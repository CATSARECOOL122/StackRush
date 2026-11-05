/* Button text must sit in the middle of its button: no screen, sheet or phone size may squash a button (flex-shrink in a scrolling sheet did) or push its text off centre. */
const assert=require('assert');
const sizes=[[390,844],[360,640],[320,568],[375,667]];
const audit=p=>p.evaluate(()=>{
  const bad=[];
  for(const b of document.querySelectorAll('button,.btn')){
    const r=b.getBoundingClientRect(); if(r.width<2||r.height<2||getComputedStyle(b).visibility==='hidden') continue;
    let el=b, hid=false; while(el&&el!==document.body){ if(el.classList&&el.classList.contains('hidden')){ hid=true; break; } el=el.parentElement; } if(hid) continue;
    if(b.closest('.screen.hidden,.peeking') || b.matches('.mode,.bpick,.stg,.mc,.aw,.th,.nb,.ibtn,.pill,.coinpill')) continue;      // (cards with several lines of text are laid out from the top on purpose)
    const rg=document.createRange(); rg.selectNodeContents(b); const t=rg.getBoundingClientRect(); if(!t.width||!b.textContent.trim()) continue;
    const dy=(t.top+t.bottom)/2-(r.top+r.bottom)/2, dx=(t.left+t.right)/2-(r.left+r.right)/2;
    if(Math.abs(dy)>3.5 || t.top<r.top-3 || t.bottom>r.bottom+3) bad.push({id:b.id||b.className.slice(0,24),text:b.textContent.trim().slice(0,18),h:Math.round(r.height),dy:Math.round(dy*10)/10});
  }
  return bad;
});
module.exports=[
['button text is centred in every button on every screen and sheet, on four phone sizes', async(e,L)=>{
  for(const [w,h] of sizes){
    const p=await L.open(e,{ctx:{viewport:{width:w,height:h}}}); await p.evaluate(()=>{ const S=__sr.S; S.tutSeen=true; S.seenTip=true; S.coins=5000; S.shop.boosts.up10=2; S.played=3; });
    const seen=[]; const check=async name=>{ await p.waitForTimeout(350); const bad=await audit(p); if(bad.length) seen.push(name+': '+JSON.stringify(bad)); };
    await check('menu');
    await p.click('#openModes'); await check('modes'); await p.click('#mGrid [data-mode=friend]'); await check('friend sheet'); await p.evaluate(()=>{ document.querySelector('#fsheet .shcard').scrollTop=999; }); await check('friend sheet scrolled'); await p.click('#fsClose'); await p.click('#closeModes');
    await p.click('#openBoosts'); await check('boosts sheet'); await p.click('#boostDone');
    await p.click('#openCoins'); await check('coins sheet'); await p.click('#csDone');
    await p.click('#openThemes'); for(const t of await p.evaluate(()=>__sr.TABS.map(x=>x[0]))){ await p.evaluate(t=>__sr.setTab(t),t); await check('shop '+t); } await p.click('#closeThemes');
    await p.click('#openSettings'); await check('settings'); await p.click('#closeSettings');
    await p.click('#openAwards'); await check('awards'); await p.click('#closeAwards');
    await p.evaluate(()=>{ __sr.openChallenge(__sr.parseChallenge('classic.20.5')); }); await check('challenge card'); await p.click('#chNo');
    await p.evaluate(()=>__sr.openUnlockDlg('friend')); await check('paste dialog'); await p.click('#udOk').catch(()=>{}); await p.evaluate(()=>{ __sr.showMenu(); });
    await p.evaluate(()=>{ __sr.startMode('classic'); }); await p.waitForTimeout(150); await L.perfects(p,2); await L.miss(p); await p.waitForTimeout(1500); await check('game over');
    assert.ok(seen.length===0,`${w}x${h}: off-centre or squashed button text -> `+seen.join(" | ")); assert.deepEqual(p.errs,[]); await p.ctx.close();
  }
}],
];
