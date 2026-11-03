/* The extra hazards of Hazard mode (and the boss stages): ICE blocks slide on after the tap, GLUE blocks are pulled back, GUSTS sway the whole tower.
   Like the bombs they depend only on the seed and the height. */
const assert=require('assert');

const quiet=p=>p.evaluate(()=>{ const s=__sr; s.S.tutSeen=true; s.S.assist='off'; s.S.seenTip=true; for(const m of Object.keys(s.MODES)) s.S.tips[m]=1; });
const toastHas=(p,txt,ms=10000)=>p.waitForFunction(t=>{ const el=document.getElementById('toast'); return el.classList.contains('show') && el.textContent.includes(t); },txt,{timeout:ms});
const tap=p=>p.evaluate(()=>document.getElementById('c').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})));
/* a seed whose rolls give what a climb test needs: no bombs between 4 and 16 (the bot never taps one, which would only slow the test down), ice at 6, glue at 10 and a gust at 14.
   Found in the page with the game's own roll function. */
const findSeed=p=>p.evaluate(()=>{ const s=__sr, C=s.CFG;
  for(let seed=1;seed<400000;seed++){
    let ok=s.rollOf(seed,6,1)<C.iceChance && s.rollOf(seed,10,1)>=C.iceChance && s.rollOf(seed,10,2)<C.glueChance && s.rollOf(seed,14,3)<C.gustChance;
    for(let h=4;h<=16 && ok;h++) ok=s.rollOf(seed,h)>=C.bombChance;
    if(ok) return seed; }
  return 0; });

/* counts the sounds the game makes (oscillators and noise buffers) */
const SOUNDS=()=>{ const Real=window.AudioContext; window.__n=0; window.__noise=0;
  class AC extends Real{ createOscillator(){ window.__n++; return super.createOscillator(); } createBufferSource(){ window.__n++; window.__noise++; return super.createBufferSource(); } }
  window.AudioContext=AC; window.webkitAudioContext=AC; };

module.exports=[

['hazards: ice, glue and gusts come from their heights up in Hazard mode only; the same seed always gives the same ones, and each kind shows up at about its chance', async(e,L)=>{
  const p=await L.open(e); await quiet(p);
  const r=await p.evaluate(()=>{ const s=__sr, C=s.CFG, out={};
    s.startChallenge({mode:'hazard',score:10,seed:4242,ghost:null});
    out.from={ice:s.hzFrom('ice'),glue:s.hzFrom('glue'),wind:s.hzFrom('wind'),bomb:s.MODES.hazard.bombs};
    const list=seed=>{ s.startChallenge({mode:'hazard',score:10,seed,ghost:null}); return Array.from({length:80},(_,h)=>s.specialAt(h)||''); };
    out.a=list(4242); out.b=list(4242); out.c=list(4243);
    let ice=0,glue=0,n=0,early=0,gusts=0,gap=99,minGap=99,firstGust=999;
    for(let seed=1;seed<=400;seed++){ const l=list(seed); l.forEach((k,h)=>{ if(h<6 && k) early++; if(h<10 && k==='glue') early++; if(h>=10){ n++; if(k==='ice') ice++; if(k==='glue') glue++; } });
      let last=-99; for(let h=0;h<80;h++) if(s.gustDue(h,last)){ if(h<14) early++; gusts++; minGap=Math.min(minGap,h-last); firstGust=Math.min(firstGust,h); last=h; } }
    out.stats={ice:ice/n,glue:glue/n,early,gusts:gusts/400,minGap,firstGust,chance:{ice:C.iceChance,glue:C.glueChance*(1-C.iceChance),gust:C.gustChance}};
    out.other={}; for(const m of ['classic','timed','lives','zen','practice','daily']){ s.startMode(m); out.other[m]={any:Array.from({length:80},(_,h)=>s.specialAt(h)).some(Boolean),wind:String(s.hzFrom('wind'))}; }
    s.startStage(1); out.other.stage1=Array.from({length:80},(_,h)=>s.specialAt(h)).some(Boolean);
    return out; });
  assert.deepEqual(r.from,{ice:6,glue:10,wind:14,bomb:true},'ice from 6, glue from 10, gusts from 14, on top of the bombs');
  assert.deepEqual(r.a,r.b,'the same seed, the same ice and glue'); assert.notDeepEqual(r.a,r.c,'another seed, other ones');
  assert.equal(r.stats.early,0,'nothing before its height'); assert.ok(r.stats.minGap>=8,'gusts are at least 8 blocks apart (smallest gap '+r.stats.minGap+')'); assert.ok(r.stats.firstGust>=14);
  assert.ok(Math.abs(r.stats.ice-r.stats.chance.ice)<.025,`ice at ${r.stats.ice.toFixed(3)} of the heights from 10 up`); assert.ok(Math.abs(r.stats.glue-r.stats.chance.glue)<.025,`glue at ${r.stats.glue.toFixed(3)}`);
  assert.ok(r.stats.gusts>=2 && r.stats.gusts<=4.5,`${r.stats.gusts.toFixed(1)} gusts in the first 80 blocks on average`);
  for(const [m,v] of Object.entries(r.other)){ if(m==='stage1') assert.equal(v,false,'campaign stage 1 has none'); else assert.deepEqual(v,{any:false,wind:'undefined'},m+' has none'); }
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['hazards: an ice block slides on after the tap and a glue block is pulled back, by the same short while of travel; a plain block does not', async(e,L)=>{
  const p=await L.open(e); await quiet(p);
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(150);        // (the slide and the drag do not depend on the mode; Hazard mode has bombs from height 4, which would explode instead of landing)
  /* aim: where the block is when you tap, as a multiple of "one ice slide" ahead of the target (1 = aimed as for ice, -1 = as for glue, 0 = straight). All in one go, no frame in between. */
  const aim=(mat,mult)=>p.evaluate(([mat,mult])=>{ const s=__sr, c=s.cur; if(mat) c.mat=mat;
    const sp=s.sp, dir=s.dir, topX=s.topX, slide=dir*sp*s.CFG.iceSlide, sh=mat?(mat==='ice'?1:-1)*dir*sp*(mat==='ice'?s.CFG.iceSlide:s.CFG.glueDrag):0;
    c.x=topX-mult*slide; const n0=s.stackLen, c0=s.combo; document.getElementById('c').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
    const t=s.top; return {dropped:s.stackLen-n0,perfect:s.combo===c0+1,fx:t.fx||0,mat:t.mat||'',sh,slide,sp,dir}; },[mat,mult]);
  const ice=await aim('ice',1);
  assert.equal(ice.dropped,1); assert.equal(ice.perfect,true,'aimed early by the slide: the ice block lands dead on the tower (perfect)'); assert.equal(ice.mat,'ice','and the landed block stays icy');
  assert.ok(Math.abs(ice.sh-ice.slide)<1e-6 && Math.abs(ice.sh/ice.sp/ice.dir-.12)<1e-6,'it slides on 0.12 s of travel, in its direction'); assert.ok(Math.abs(ice.fx+ice.sh)<1e-6,'and it is drawn settling from where you tapped (fx='+ice.fx.toFixed(1)+')'); assert.ok(Math.abs(ice.sh)>=12,'a distance you can see ('+ice.sh.toFixed(1)+'px)');
  await p.waitForTimeout(80);
  assert.equal((await aim('',1)).perfect,false,'the same aim with a plain block is NOT perfect (the slide is real)');
  await p.waitForTimeout(80); assert.equal((await aim('',0)).perfect,true,'a plain block is perfect when aimed straight');
  await p.waitForTimeout(80); const glue=await aim('glue',-1);
  assert.equal(glue.perfect,true,'aimed late by the drag: the glue block lands dead on the tower'); assert.equal(glue.mat,'glue'); assert.ok(Math.abs(glue.sh+glue.slide)<1e-6,'it is pulled back by the same 0.12 s, the other way'); assert.ok(Math.abs(glue.fx+glue.sh)<1e-6);
  await p.waitForTimeout(80); assert.equal((await aim('ice',0)).perfect,false,'an ice block tapped straight misses the perfect window');
  await p.waitForTimeout(80); assert.equal((await aim('glue',0)).perfect,false,'so does a glue block');
  await p.waitForTimeout(80); assert.equal((await aim('glue',1)).perfect,false,'and a glue block aimed the ice way is twice as far off');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['hazards: a round meets exactly the ice, glue and gust its seed says, the game explains each the first time, and it can all be played through', async(e,L)=>{
  const p=await L.open(e); await quiet(p);
    const seed=await findSeed(p); assert.ok(seed>0,'found a seed ('+seed+')');
  await p.evaluate(seed=>{ __sr.S.tips.ice=0; __sr.S.tips.glue=0; __sr.S.tips.gust=0; __sr.startChallenge({mode:'hazard',score:10,seed,ghost:null}); },seed); await p.waitForTimeout(150);
  const want=await p.evaluate(()=>Array.from({length:17},(_,h)=>__sr.specialAt(h)||'')); assert.equal(want[6],'ice'); assert.equal(want[10],'glue');
  const run=await L.climb(p,17); assert.equal(run.over,false,'the round went on (no life lost to ice, glue or the wind)');
  for(let h=1;h<17;h++) assert.equal(run.seen[h],want[h],`height ${h}: ${want[h]||'a plain block'}`);
  assert.ok(await p.evaluate(()=>__sr.lastGustH)===14,'a gust started when the tower reached 14'); assert.ok(run.maxWind>8,`the tower swayed (${run.maxWind.toFixed(1)}px)`);
  assert.deepEqual(await p.evaluate(()=>({ice:__sr.S.tips.ice,glue:__sr.S.tips.glue,gust:__sr.S.tips.gust})),{ice:1,glue:1,gust:1},'each is explained once');
  assert.deepEqual(await p.evaluate(()=>__sr.S.tips.__proto__===Object.prototype),true);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['hazards: a gust leans and sways the whole tower and settles to exactly zero; a block is judged against where the top block is now, and rides with the tower', async(e,L)=>{
  const p=await L.open(e); await quiet(p);
  await p.evaluate(()=>{ __sr.startMode('classic'); }); await p.waitForTimeout(150);
  const W=await p.evaluate(()=>__sr.W), A=await p.evaluate(()=>__sr.CFG.gustAmp)*W;
  await p.evaluate(()=>__sr.startGust(20));
  const samples=await p.evaluate(()=>new Promise(res=>{ const out=[], t0=performance.now(); const f=()=>{ out.push({t:performance.now()-t0,w:__sr.windOff,g:!!__sr.gust,sign:__sr.gust?__sr.gust.gd:0}); if(performance.now()-t0<5200) setTimeout(f,40); else res(out); }; f(); }));
  const mx=Math.max(...samples.map(s=>Math.abs(s.w))); assert.ok(mx>.5*A && mx<=A+.6,`it sways up to ${mx.toFixed(1)}px (limit ${A.toFixed(1)})`);
  assert.equal(samples[0].g,true); assert.equal(samples[samples.length-1].g,false,'the gust ends'); assert.equal(samples[samples.length-1].w,0,'and the tower is straight again, exactly');
  assert.ok(Math.abs(samples[0].w)<2,'it starts gently (no jump)');
  const gd=samples[0].sign, mean=samples.filter(s=>s.g).reduce((a,s)=>a+s.w,0)/samples.filter(s=>s.g).length; assert.ok(mean*gd>0,`it leans one way (${gd>0?'right':'left'}), mean ${mean.toFixed(1)}`);
  for(let i=1;i<samples.length;i++) assert.ok(Math.abs(samples[i].w-samples[i-1].w)<A*.6,'never jumps ('+(samples[i].w-samples[i-1].w).toFixed(1)+'px in one step)');
  // landing: aim at where the top block is NOW
  await p.evaluate(()=>__sr.startGust(26)); await p.waitForFunction(()=>Math.abs(__sr.windOff)>12,null,{timeout:6000});
  const hit=await p.evaluate(()=>{ const s=__sr, c=s.cur, topX=s.topX, frame=s.top.x, off=s.windOff; c.x=topX; document.getElementById('c').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
    const t=s.top; return {combo:s.combo,off,topX,frame,rode:t.x+s.windOff}; });
  assert.equal(hit.combo,1,`aimed at the swaying top block (${hit.topX.toFixed(0)}, not ${hit.frame.toFixed(0)}): perfect`); assert.ok(Math.abs(hit.rode-hit.topX)<.6,'the new block sits where it was dropped, and moves with the tower');
  await p.evaluate(()=>__sr.startGust(40)); await p.waitForFunction(()=>Math.abs(__sr.windOff)>14,null,{timeout:6000});
  const miss=await p.evaluate(()=>{ const s=__sr, c=s.cur; c.x=s.top.x; document.getElementById('c').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); return {combo:s.combo,off:s.windOff}; });
  assert.equal(miss.combo,0,`aiming at the top block's resting place is not perfect while the tower sways ${miss.off.toFixed(0)}px`);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['hazards: pause freezes a gust; the tower stands straight in the menu, after a game over and in the next round; other modes never sway', async(e,L)=>{
  const p=await L.open(e); await quiet(p);
  await p.evaluate(()=>{ __sr.startMode('hazard'); __sr.startGust(20); }); await p.waitForFunction(()=>Math.abs(__sr.windOff)>5,null,{timeout:6000});
  await p.evaluate(()=>__sr.pause()); const a=await p.evaluate(()=>__sr.windOff); await p.waitForTimeout(500); assert.equal(await p.evaluate(()=>__sr.windOff),a,'paused: the gust holds still');
  await p.click('#quit'); await p.waitForTimeout(300); assert.deepEqual(await p.evaluate(()=>[__sr.windOff,__sr.gust]),[0,null],'back at the menu: straight');
  await p.evaluate(()=>{ __sr.startMode('hazard'); __sr.startGust(20); }); await p.waitForFunction(()=>Math.abs(__sr.windOff)>5,null,{timeout:6000});
  await p.evaluate(()=>__sr.startMode('classic')); assert.deepEqual(await p.evaluate(()=>[__sr.windOff,__sr.gust]),[0,null],'a new round starts straight');
  await p.evaluate(()=>{ __sr.startMode('hazard'); __sr.startGust(20); }); await p.waitForFunction(()=>Math.abs(__sr.windOff)>5,null,{timeout:6000});
  await L.miss(p); await L.miss(p); await L.miss(p); await p.waitForTimeout(1600);
  assert.equal(await p.evaluate(()=>__sr.state),'over'); assert.equal(await p.evaluate(()=>__sr.gust),null); assert.equal(await p.evaluate(()=>__sr.windOff),0,'the game over screen has a straight tower');
  for(const m of ['classic','zen','timed','practice']){ await p.evaluate(m=>__sr.startMode(m),m); await p.waitForTimeout(80); await L.perfects(p,m==='practice'?1:3); assert.deepEqual(await p.evaluate(()=>[__sr.windOff,__sr.gust,__sr.lastGustH]),[0,null,-99],m+': no gust'); }
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['hazards: the new sounds (ice chime, glue squelch, gust whoosh) really play in every sound pack', async(e,L)=>{
  const p=await L.open(e,{init:SOUNDS}); await quiet(p);
  await p.mouse.click(200,400); await p.waitForTimeout(300);                                   // a real tap wakes the audio engine
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(200);
  for(const pack of ['classic','retro','soft']){
    await p.evaluate(pack=>{ __sr.S.shop.equip.sfx=pack; },pack);
    const n0=await p.evaluate(()=>[window.__n,window.__noise]);
    await p.evaluate(()=>__sr.startGust(30)); await p.waitForTimeout(150);
    const n1=await p.evaluate(()=>[window.__n,window.__noise]); assert.ok(n1[1]>n0[1],`${pack}: the gust makes a whoosh (noise buffer)`);
    for(const mat of ['ice','glue']){
      const before=await p.evaluate(()=>window.__n);
      await p.evaluate(mat=>{ const s=__sr; s.cur.mat=mat; s.cur.x=s.topX; document.getElementById('c').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); },mat); await p.waitForTimeout(80);
      assert.ok(await p.evaluate(()=>window.__n)>before+1,`${pack}: a ${mat} block lands with its own sound`);
    }
  }
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['hazards: a hostile save cannot set the tip flags to anything but "seen", and cannot invent new ones', async(e,L)=>{
  const evil='{"tips":{"ice":1,"glue":"yes","gust":{},"__proto__":{"x":1},"constructor":1,"fire":1,"classic":1,"hz":1}}';
  const p=await L.open(e,{setup:async pg=>{ await pg.addInitScript(raw=>{ localStorage.setItem('stackrush.v2',raw); },evil); }});
  assert.deepEqual(await p.evaluate(()=>Object.assign({},__sr.S.tips)),{ice:1,glue:1,gust:1,classic:1},'only real tip names, each simply "seen"'); assert.equal(await p.evaluate(()=>({}).x),undefined,'nothing leaked into Object');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

];
