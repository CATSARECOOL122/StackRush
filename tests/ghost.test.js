/* Friend ghost race: a link carries WHEN each block landed and what it scored, so the friend's tower builds itself, faded, while you play the same round. */
const assert=require('assert');
const enc=a=>Buffer.from(a).toString('base64url');
const quiet=p=>p.evaluate(()=>{ const s=__sr; s.S.tutSeen=true; s.S.assist='off'; s.S.seenTip=true; for(const m of Object.keys(s.MODES)) s.S.tips[m]=1; });
module.exports=[
['ghost race: your finished round makes a link with timing that reads back exactly; old two-part links and bad timing still work or are refused', async(e,L)=>{
  const p=await L.open(e); await quiet(p); await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(150);
  await L.perfects(p,5); await L.miss(p); await p.waitForTimeout(1400);
  const r=await p.evaluate(()=>{ const c=__sr.challengeCode(), ch=__sr.parseChallenge(c); return {c,n:ch.ghost.length,times:ch.times,incs:ch.incs,score:ch.score}; });
  assert.equal(r.c.split('.').length,6); assert.equal(r.times.length,r.n); assert.equal(r.incs.length,r.n);
  assert.deepEqual(r.times.map((x,i)=>i&&x>=r.times[i-1]),r.times.map((x,i)=>!!i),'times only go forward'); assert.equal(r.incs[r.n-1],r.score,'the points add up to the score'); assert.ok(r.times[r.n-1]>1,'a few seconds long');
  const tw=enc([0,255,10,200,20,200]), ok=await p.evaluate(([a])=>__sr.parseChallenge('classic.9.5.'+a),[tw]); assert.equal(ok.times,null,'old style: no timing, still a challenge'); assert.equal(ok.ghost.length,3);
  const good=await p.evaluate(([a,b,c])=>__sr.parseChallenge(`classic.9.5.${a}.${b}.${c}`),[tw,enc([0,10,20]),enc([0,2,3])]); assert.deepEqual([good.times,good.incs],[[0,1,3],[0,2,5]]);
  for(const bad of [`classic.9.5.${tw}.${enc([0,1,1])}`,`classic.9.5.${tw}.${enc([0,1])}.${enc([0,1,1])}`,`classic.9.5.${tw}.!!.${enc([0,1,1])}`,`classic.9.5.${tw}.${enc([0,1,1])}.${enc([0,1,1])}.x`]){ const x=await p.evaluate(c=>__sr.parseChallenge(c),bad); assert.ok(x===null||x.times===null,bad); }
  assert.deepEqual(p.errs,[]); await L.close(p);
}],
['ghost race: the friend\'s tower builds as a faded ghost at their pace, their score ticks up on the HUD, and it does not change your own round', async(e,L)=>{
  const p=await L.open(e); await quiet(p);
  const code=`classic.30.5.${enc([20,150,20,150,20,150,20,150])}.${enc([0,6,6,6])}.${enc([0,3,3,4])}`;       // four blocks, landing at 0, 0.6, 1.2 and 1.8 s, scoring 0, 3, 6 and 10
  await p.evaluate(c=>{ __sr.startChallenge(__sr.parseChallenge(c)); },code);
  assert.equal(await p.evaluate(()=>!!__sr.ghost.live),true); const at=async()=>p.evaluate(()=>({txt:document.getElementById('ghostD').textContent,k:__sr.friendNow()}));
  await p.waitForTimeout(100); assert.deepEqual(await at(),{txt:'Friend 0',k:0});
  await p.waitForTimeout(700); let g=await at(); assert.deepEqual([g.k,g.txt],[1,'Friend 3']);
  await p.waitForTimeout(1500); g=await at(); assert.deepEqual([g.k,g.txt],[3,'Friend 10'],'all four blocks, 10 points');
  assert.equal(await p.evaluate(()=>__sr.score),0,'your score is your own'); assert.equal(await p.evaluate(()=>__sr.stackLen),1);
  await p.evaluate(()=>__sr.pause()); const k1=await p.evaluate(()=>__sr.friendNow()); await p.waitForTimeout(400); assert.equal(await p.evaluate(()=>__sr.friendNow()),k1,'pausing pauses the race');
  const px=await p.evaluate(()=>{ const c=document.getElementById('c'); return c.width>0; }); assert.ok(px);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],
['ghost race: Paste a friend\'s challenge (on the game modes screen) takes a whole link, a ?c= part or the bare code; junk is refused', async(e,L)=>{
  const p=await L.open(e); await quiet(p); await p.click('#openModes'); await p.click('#mGrid [data-mode=friend]'); await p.click('#fsPaste'); assert.ok(await p.isVisible('#udInput'));
  await p.fill('#udInput','nonsense'); await p.click('#udOk'); assert.ok(await p.isVisible('#udlg')); assert.match(await p.textContent('#udMsg'),/didn't work/);
  const code='lives.12.77'; for(const v of [`https://catsarecool122.github.io/StackRush/?c=${code}`,`?c=${code}`,code,`  see this: https://x.example/index.html?c=${code}&z=1  `]){
    await p.fill('#udInput',v); await p.click('#udOk'); await p.waitForTimeout(150); assert.ok(await p.isVisible('#chal'),v); assert.equal(await p.textContent('#chScore'),'12'); await p.click('#chNo'); await p.click('#openModes'); await p.click('#mGrid [data-mode=friend]'); await p.click('#fsPaste');
  }
  assert.deepEqual(p.errs,[]); await L.close(p);
}],
['friend race tile: sits beside Zen, opens a how-to sheet; Send is offered only after a raceable round; Back closes it', async(e,L)=>{
  const p=await L.open(e); await quiet(p); await p.click('#openModes');
  assert.deepEqual(await p.locator('#mGrid .tiles .mode').evaluateAll(a=>a.map(x=>x.dataset.mode).slice(-2)),['zen','friend'],'the tile pairs with Zen');
  await p.click('#mGrid [data-mode=friend]'); assert.ok(await p.isVisible('#fsheet'));
  assert.equal(await p.isVisible('#fsShare'),false,'nothing to send yet'); assert.match(await p.textContent('#fsLast'),/No round to send yet/);
  await p.evaluate(()=>history.back()); await p.waitForTimeout(300); assert.equal(await p.isVisible('#fsheet'),false,'Back closes it'); assert.ok(await p.isVisible('#modes'));
  await p.evaluate(()=>{ __sr.startMode('classic'); }); await p.waitForTimeout(100); await L.perfects(p,5); await L.miss(p); await p.waitForTimeout(1400);
  await p.evaluate(()=>{ window.__shared=null; navigator.share=async d=>{ window.__shared=d; }; });
  await p.click('#toMenu').catch(()=>{}); await p.waitForTimeout(300);
  await p.evaluate(()=>{ __sr.showModes(); }); await p.click('#mGrid [data-mode=friend]');
  assert.ok(await p.isVisible('#fsShare'),'a raceable round can be sent'); { await p.click('#fsShare'); const d=await p.evaluate(()=>window.__shared); assert.ok(d && /\?c=classic\./.test(d.url),'shares a challenge link'); assert.match(await p.textContent('#fsLast'),/Your last round/); }
  await p.click('#fsPaste'); assert.ok(await p.isVisible('#udInput')); assert.equal(await p.isVisible('#fsheet'),false);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],
];
