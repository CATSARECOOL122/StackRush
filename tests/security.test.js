const assert=require('assert');
const b64=s=>Buffer.from(s,'utf8').toString('base64');
module.exports=[

['a hostile save code cannot inject HTML or pollute prototypes, and values are clamped', async(e,L)=>{
  const p=await L.open(e);
  const raw='{"coins":50,"owned":["sunset","gold","__proto__","<b>x</b>"],"theme":"<script>","bests":{"classic":"<img src=x onerror=window.__pwn=2>","timed":1e30},"camp":{"1":99,"2":"x"},"ach":{"first":1,"<i>":1},"lastMode":"<u>","assist":"<s>","lastClaim":"<x>","lang":"<svg>","__proto__":{"polluted":true},"ghosts":{"classic":{"score":"<b>","blocks":[1,2,3],"scores":["<i>"]}}}';
  const code=b64(raw); let n=0; p.on('dialog',d=>{ n++; d.accept(n===1?code:undefined); });
  await p.click('#openSettings'); await p.click('[data-set=import]'); await p.waitForTimeout(500);
  const r=await p.evaluate(()=>({coins:__sr.S.coins,owned:__sr.S.owned,theme:__sr.S.theme,classic:__sr.S.bests.classic,timed:__sr.S.bests.timed,camp:__sr.S.camp,lastMode:__sr.S.lastMode,assist:__sr.S.assist,lang:__sr.S.lang,polluted:({}).polluted,pwn:window.__pwn}));
  assert.equal(r.coins,50); assert.deepEqual(r.owned,['sunset','gold']); assert.equal(r.theme,'sunset');
  assert.equal(r.classic,0); assert.equal(r.timed,1e9); assert.deepEqual(r.camp,{1:3});
  assert.equal(r.lastMode,'classic'); assert.equal(r.assist,'auto'); assert.equal(r.lang,'auto');
  assert.equal(r.polluted,undefined,'no prototype pollution'); assert.equal(r.pwn,undefined,'nothing executed');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['the #debug hook is not exposed on a non-local host (cannot be used to cheat on the public site)', async(e,L)=>{
  const p=await L.open(e,{host:'127.0.0.2',seen:false});
  assert.equal(await p.evaluate(()=>typeof window.__sr),'undefined'); await L.close(p);
}],

];
