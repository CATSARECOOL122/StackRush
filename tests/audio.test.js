/* Sound: the phone-specific traps (iOS silent switch, interrupted/suspended/closed contexts) and the music scheduler. */
const assert=require('assert');
const vt=require('../tools/lib/vtime');

/* A stand-in for the browser's AudioContext that behaves like iOS Safari: a context can be "interrupted" (by a call, Siri, the
   lock screen...) and resume() only works inside a real user gesture (pointerup/touchend/click/keydown, NOT pointerdown). */
const FAKE=()=>{
  const Real=window.AudioContext, st=window.__ac={made:0,resumes:0,rejected:0,forced:null,oscs:0,last:null,gesture:false};
  for(const t of ['pointerup','touchend','click','keydown']) addEventListener(t,()=>{ st.gesture=true; queueMicrotask(()=>{ st.gesture=false; }); },true);   // registered first, so it runs before the game's own listeners
  class FakeAC extends Real{
    constructor(...a){ super(...a); st.made++; st.last=this; }
    get state(){ return this.__closed ? 'closed' : (st.forced || super.state); }
    resume(){ st.resumes++; if(st.forced==='interrupted'||st.forced==='suspended'){ if(!st.gesture){ st.rejected++; return Promise.reject(new DOMException('needs a user gesture','NotAllowedError')); } st.forced=null; } return super.resume(); }
    createOscillator(){ st.oscs++; return super.createOscillator(); }
  }
  window.AudioContext=FakeAC; window.webkitAudioContext=FakeAC;
};
const osc=p=>p.evaluate(()=>window.__ac.oscs);
const drop=p=>p.evaluate(()=>document.getElementById('c').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})));      // what a game tap is: pointerdown only
const up=p=>p.evaluate(()=>document.getElementById('c').dispatchEvent(new PointerEvent('pointerup',{bubbles:true})));

module.exports=[

['an interrupted or suspended context stays quiet (nothing queued), and is woken by the next real tap, not by pointerdown alone', async(e,L)=>{
  for(const kind of ['interrupted','suspended']){
    const p=await L.open(e,{init:FAKE}); await p.click('#play',{force:true}); await p.waitForTimeout(700);
    assert.equal(await p.evaluate(()=>window.__ac.last.state),'running','audio started from the first click');
    assert.ok(await p.evaluate(()=>__sr.musicOn),'music is on');
    await p.evaluate(k=>{ window.__ac.forced=k; },kind); await p.waitForTimeout(400);
    const before=await osc(p);
    await drop(p); await drop(p); await p.waitForTimeout(500);                       // taps that only fire pointerdown: iOS refuses to resume from these
    assert.equal(await p.evaluate(()=>window.__ac.last.state),kind,`${kind}: pointerdown alone cannot wake it`);
    assert.ok((await osc(p))-before<=1,`${kind}: nothing is queued while the context is stopped (${before} -> ${await osc(p)})`);
    await up(p); await p.waitForTimeout(2000);                                        // the finger lifts: a real gesture
    assert.equal(await p.evaluate(()=>window.__ac.last.state),'running',`${kind}: the tap woke it`);
    assert.ok((await osc(p))-before>=4,`${kind}: music is playing again`);
    assert.deepEqual(p.errs,[]); await L.close(p);
  }
}],

['a context the browser closed is replaced by a new one and the music carries on', async(e,L)=>{
  const p=await L.open(e,{init:FAKE}); await p.click('#play',{force:true}); await p.waitForTimeout(500);
  await p.evaluate(()=>{ window.__ac.last.__closed=true; }); await p.waitForTimeout(300);      // this one object is now closed for good
  await drop(p); await p.waitForTimeout(100);
  const made=await p.evaluate(()=>window.__ac.made); assert.equal(made,2,'exactly one new context was created');
  await p.waitForTimeout(300); const a=await osc(p); await p.waitForTimeout(2600);
  assert.ok((await osc(p))-a>=4,'music plays on the new context'); assert.deepEqual(p.errs,[]); await L.close(p);
}],

['iPhone silent switch: with the Audio Session API the game plays like media (ignores the switch) and Settings can turn that off; other browsers do not show the row', async(e,L)=>{
  const ios=await L.open(e,{init:()=>{ window.__session={type:'auto'}; Object.defineProperty(navigator,'audioSession',{value:window.__session,configurable:true}); }});
  assert.equal(await ios.evaluate(()=>__sr.HAS_AUDIO_SESSION),true);
  await ios.click('#play',{force:true}); await ios.waitForTimeout(300);
  assert.equal(await ios.evaluate(()=>window.__session.type),'playback','sound ignores the silent switch');
  await ios.evaluate(()=>__sr.pause()); await ios.click('#quit'); await ios.click('#openSettings');
  const btn=ios.locator('[data-set=silent]'); assert.ok(await btn.isVisible(),'the row is shown on iOS'); assert.equal((await btn.textContent()).trim(),'ON');
  await btn.click(); assert.equal((await btn.textContent()).trim(),'OFF'); assert.equal(await ios.evaluate(()=>window.__session.type),'auto','back to respecting the switch');
  await btn.click(); assert.equal(await ios.evaluate(()=>window.__session.type),'playback');
  assert.deepEqual(ios.errs,[]); await L.close(ios);
  const other=await L.open(e,{init:()=>{ Object.defineProperty(navigator,'audioSession',{value:undefined,configurable:true}); }});
  await other.click('#openSettings'); await other.waitForTimeout(300);
  assert.equal(await other.isVisible('[data-set=silent]'),false,'no silent-switch row where there is no silent switch'); assert.ok(await other.isVisible('[data-set=music]'));
  await L.close(other);
}],

['the music scheduler never stalls: it plays through pauses, hidden tabs, mute and music toggles and starts again every time (120 s of game time)', async(e,L)=>{
  const SEC=120;
  const p=await L.open(e,{setup:async pg=>{
    const [fn,arg]=vt.initScript({seed:3,audioSeconds:SEC+10}); await pg.context().addInitScript(fn,arg);
    await pg.context().addInitScript(()=>{
      window.__oscs=0; window.__hidden=false; Object.defineProperty(document,'hidden',{get:()=>window.__hidden,configurable:true});
      const o=OfflineAudioContext.prototype.createOscillator; OfflineAudioContext.prototype.createOscillator=function(){ window.__oscs++; return o.call(this); };
    });
  }});
  await p.evaluate(()=>{ document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); });
  const n=()=>p.evaluate(()=>window.__oscs), run=async s=>{ const a=await n(); await vt.seconds(p,s); return (await n())-a; };
  const plays=async(label,s=6,min=5)=>{ const d=await run(s); assert.ok(d>=min,`${label}: expected music, only ${d} notes in ${s}s`); };
  const quiet=async(label,s=6,max=3)=>{ const d=await run(s); assert.ok(d<=max,`${label}: expected silence, got ${d} notes in ${s}s`); };
  await plays('menu');
  await p.evaluate(()=>{ __sr.startMode('classic'); }); await plays('playing');
  for(let i=0;i<4;i++){                                                                // pause <-> resume four times
    await p.evaluate(()=>__sr.pause()); await quiet(`paused #${i+1}`,4);
    await p.evaluate(()=>__sr.resume()); await vt.seconds(p,2); await plays(`resumed #${i+1}`,5);
  }
  await p.evaluate(()=>{ window.__hidden=true; document.dispatchEvent(new Event('visibilitychange')); }); await quiet('tab hidden',5);
  await p.evaluate(()=>{ window.__hidden=false; document.dispatchEvent(new Event('visibilitychange')); __sr.resume(); }); await vt.seconds(p,2); await plays('tab visible again');
  await p.evaluate(()=>{ __sr.S.music=false; }); await vt.seconds(p,1); await quiet('music off',5);
  await p.evaluate(()=>{ __sr.S.music=true; }); await plays('music on again');
  await p.evaluate(()=>{ __sr.S.mute=true; }); await vt.seconds(p,1); await quiet('muted',5);
  await p.evaluate(()=>{ __sr.S.mute=false; document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); }); await plays('unmuted');
  await p.evaluate(()=>{ __sr.pause(); }); await p.click('#quit'); await plays('back in the menu');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

];
