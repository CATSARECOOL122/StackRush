/* Boss stages: the last stage of each campaign world (6, 12, 18, 24) has a signature hazard from early on, a crown in the stage picker, a BOSS STAGE banner, a title and a one-time bonus. */
const assert=require('assert');

const quiet=p=>p.evaluate(()=>{ const s=__sr; s.S.tutSeen=true; s.S.assist='off'; s.S.seenTip=true; for(const m of Object.keys(s.MODES)) s.S.tips[m]=1; for(const k of ['ice','glue','gust']) s.S.tips[k]=1; });

module.exports=[

['boss stages: stages 6, 12, 18 and 24 are the bosses, each with its own hazard from an early height; no other stage has any', async(e,L)=>{
  const p=await L.open(e); await quiet(p);
  const r=await p.evaluate(()=>{ const s=__sr, out={bosses:[],others:[]};
    for(let n=1;n<=s.STAGES.length;n++){
      let ice=0,glue=0,gusts=0,N=0; const first={ice:99,glue:99,wind:99};
      for(let rep=0;rep<20;rep++){ s.startStage(n); let last=-99;                      // twenty rounds of the stage, each with its own seed
        for(let h=0;h<60;h++){ N++; const k=s.specialAt(h); if(k==='ice'){ ice++; first.ice=Math.min(first.ice,h); } if(k==='glue'){ glue++; first.glue=Math.min(first.glue,h); }
          if(s.gustDue(h,last)){ gusts++; first.wind=Math.min(first.wind,h); last=h; } } }
      const from=JSON.parse(JSON.stringify({ice:s.hzFrom('ice'),glue:s.hzFrom('glue'),wind:s.hzFrom('wind')})), m=s.STAGES[n-1][2];
      (m.boss?out.bosses:out.others).push({n,from,ice:ice/N,glue:glue/N,gusts:gusts/20,first,bombs:!!m.bombs}); }
    return out; });
  assert.deepEqual(r.bosses.map(b=>b.n),[6,12,18,24,30]); assert.equal(r.others.length,25);
  for(const o of r.others.filter(o=>o.n<=24)){ assert.deepEqual(o.from,{},`stage ${o.n} is an ordinary stage`); assert.deepEqual([o.ice,o.glue,o.gusts],[0,0,0],`stage ${o.n} has no hazards`); }
  const by=n=>r.bosses.find(b=>b.n===n);
  assert.deepEqual(by(6).from,{wind:3},'world 1 boss: gusts'); assert.ok(by(6).gusts>=5,`many gusts (${by(6).gusts} in 60 blocks)`); assert.deepEqual([by(6).ice,by(6).glue],[0,0]); assert.ok(by(6).first.wind>=3);
  assert.deepEqual(by(12).from,{ice:3},'world 2 boss: ice'); assert.ok(by(12).ice>.3,'ice is common ('+by(12).ice.toFixed(2)+')'); assert.equal(by(12).gusts,0); assert.ok(by(12).first.ice>=3);
  assert.deepEqual(by(18).from,{glue:3},'world 3 boss: glue, with the bombs of its world'); assert.equal(by(18).bombs,true); assert.ok(by(18).glue>.3,'glue is common ('+by(18).glue.toFixed(2)+')'); assert.ok(by(18).first.glue>=3);
  assert.deepEqual(by(30).from,{wind:5},'world 5 boss: tremors (the lava is checked below)'); assert.deepEqual(by(24).from,{ice:5,glue:8,wind:6},'world 4 boss: everything'); assert.ok(by(24).ice>.1 && by(24).glue>.1 && by(24).gusts>=3); assert.ok(by(24).first.ice>=5 && by(24).first.glue>=8 && by(24).first.wind>=6);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['boss stages: the stage picker shows a crown on each boss and the screen-reader label says boss; ordinary stages have neither', async(e,L)=>{
  const p=await L.open(e); await quiet(p);
  await p.evaluate(()=>{ for(let n=1;n<=5;n++) __sr.S.camp[n]=3; __sr.showStages(); }); await p.waitForTimeout(500);
  assert.deepEqual(await p.locator('#sGrid .stg.boss').evaluateAll(a=>a.map(x=>+x.dataset.stage)),[6,12,18,24,30]);
  assert.equal(await p.locator('#sGrid .stg.boss .crown svg').count(),5); assert.equal(await p.locator('#sGrid .stg:not(.boss) .crown').count(),0);
  assert.match(await p.getAttribute('#sGrid .stg[data-stage="6"]','aria-label'),/^Boss stage 6, Reach 20 blocks$/,'unlocked boss'); assert.match(await p.getAttribute('#sGrid .stg[data-stage="5"]','aria-label'),/^Stage 5, /);
  assert.match(await p.getAttribute('#sGrid .stg[data-stage="12"]','aria-label'),/^Stage 12, .*, locked$/,'a locked boss is just locked');
  await p.click('#sGrid .stg[data-stage="6"]'); await p.waitForTimeout(300); assert.equal(await p.evaluate(()=>[__sr.state,__sr.mode]).then(x=>x.join()),'playing,campaign','tapping the boss starts it');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['boss stages: starting one shows the BOSS STAGE banner (a normal stage does not); the first win pays a bonus and says BOSS DEFEATED, a replay pays nothing more', async(e,L)=>{
  const p=await L.open(e); await quiet(p);
  await p.evaluate(()=>__sr.startStage(2)); await p.waitForTimeout(100); assert.equal(await p.evaluate(()=>__sr.banner),null,'no banner on an ordinary stage');
  await p.evaluate(()=>{ for(let n=1;n<=5;n++) __sr.S.camp[n]=3; __sr.startStage(6); }); await p.waitForTimeout(100);
  assert.equal(await p.evaluate(()=>__sr.banner&&__sr.banner.text),'BOSS STAGE');
  const run=await L.climb(p,21,90000); assert.equal(await p.evaluate(()=>__sr.state),'over','the boss was beaten (height 20 reached), got to '+(await p.evaluate(()=>__sr.stackLen-1)));
  await p.waitForTimeout(1200);
  const st=await p.evaluate(()=>__sr.S.camp[6]); assert.ok(st>=1);
  assert.match(await p.textContent('#oLabel'),/BOSS DEFEATED!/); assert.equal(await p.evaluate(()=>[...document.querySelectorAll('#oScore svg')].length),3,'three star slots');
  const earned=+await p.textContent('#oCoins b'); assert.equal(earned,20+st*5+60,`first clear: the usual ${20+st*5} plus the 60 boss bonus (got ${earned}, ${st} stars)`);
  await p.click('#again'); await p.waitForTimeout(300); assert.equal(await p.evaluate(()=>__sr.banner&&__sr.banner.text),'BOSS STAGE','REPLAY brings the banner again');
  await L.climb(p,21,90000); await p.waitForTimeout(1200); assert.match(await p.textContent('#oLabel'),/BOSS DEFEATED!/);
  const again=+await p.textContent('#oCoins b'); assert.ok(again<=(Math.max(0,3-st)*10),`a replay pays only star upgrades (got ${again})`);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['boss stages: the ice boss, the glue boss and the gust boss can each be played for a while without breaking anything (bot, hazards, sway)', async(e,L)=>{
  const p=await L.open(e); await quiet(p);
  for(const n of [6,12,18,24,30]){
    await p.evaluate(n=>{ __sr.showMenu(); __sr.startStage(n); },n); await p.waitForTimeout(150);
    const run=await L.climb(p,10,60000); const info=await p.evaluate(()=>({n:__sr.stackLen,state:__sr.state,gusts:__sr.lastGustH}));
    assert.ok(info.n>=(n===30?3:6) || run.over,`stage ${n}: climbed (${info.n} blocks, state ${info.state})`);
  }
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['lava: a lava block melts the 2 blocks under it (never the base), the lava block sinks onto what is left and glows, and the caves are dark', async(e,L)=>{
  const p=await L.open(e); await quiet(p);
  await p.evaluate(()=>{ for(let n=1;n<=24;n++) __sr.S.camp[n]=3; __sr.startStage(25); }); await p.waitForTimeout(200);
  assert.equal(await p.evaluate(()=>!!__sr.mod.dark),true,'a cave stage is dark');
  await L.perfects(p,4); const before=await p.evaluate(()=>__sr.stackLen);
  await p.evaluate(()=>{ __sr.cur.mat='lava'; });
  await L.perfect(p); await p.waitForTimeout(150);
  const a=await p.evaluate(()=>({n:__sr.stackLen,melt:__sr.pieces.filter(q=>q.melt).length,hot:__sr.top.hot,dy:__sr.top.dy,mat:__sr.top.mat}));
  assert.equal(a.n,before-1,'lava placed, 2 melted: one block lower than before ('+before+' -> '+a.n+')'); assert.equal(a.melt,2,'two melting pieces'); assert.ok(a.hot>0,'glowing'); assert.ok(a.dy>0,'sinking'); assert.equal(a.mat,undefined,'it is a plain block afterwards');
  await p.waitForTimeout(1500); assert.equal(await p.evaluate(()=>__sr.top.dy||0),0,'settled');
  await p.evaluate(()=>{ __sr.showMenu(); __sr.startStage(25); }); await p.waitForTimeout(150);
  await p.evaluate(()=>{ __sr.cur.mat='lava'; }); await L.perfect(p); await p.waitForTimeout(100);
  assert.equal(await p.evaluate(()=>__sr.stackLen),2,'with only the base and one block, the base is never melted');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

];
