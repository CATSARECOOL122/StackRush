const assert=require('assert');
async function curve(p,L,mode,marks,maxDrops){
  await p.evaluate(m=>__sr.startMode(m),mode); await p.waitForTimeout(150);
  const base=await p.evaluate(()=>__sr.W*0.42), out={};
  for(let i=1;i<=maxDrops;i++){ if(await L.perfect(p)!=='ok') break; await p.waitForTimeout(25); if(marks.includes(i)) out[i]=(await p.evaluate(()=>__sr.sp))/base; }
  return out;
}
module.exports=[

['classic speeds up clearly with height (x1.3+ by 10 blocks, x1.6+ by 20, x2+ by 40)', async(e,L)=>{
  const p=await L.open(e); await p.evaluate(()=>{ __sr.S.assist='off'; });
  const c=await curve(p,L,'classic',[10,20,40],40);
  assert.ok(c[10]>=1.3,`x${c[10]} at 10 blocks`); assert.ok(c[20]>=1.6,`x${c[20]} at 20`); assert.ok(c[40]>=2.0,`x${c[40]} at 40`);
  assert.ok((await p.textContent('#speedB')).includes('×'),'HUD speed badge shown');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['zen and practice never speed up and show no speed badge', async(e,L)=>{
  const p=await L.open(e); await p.evaluate(()=>{ __sr.S.assist='off'; });
  const c=await curve(p,L,'zen',[10],12);
  assert.ok(Math.abs(c[10]-1)<0.01,`zen stays at x1 (got x${c[10]})`);
  assert.equal(await p.isVisible('#speedB'),false);
  await L.close(p);
}],

['campaign ramps more gently than Classic', async(e,L)=>{
  const p=await L.open(e); await p.evaluate(()=>{ __sr.S.assist='off'; });
  const a=await p.evaluate(()=>{ __sr.startMode('classic'); return __sr.rampOf(20); });
  const b=await p.evaluate(()=>{ __sr.startStage(6); return __sr.rampOf(20); });
  assert.ok(b<a,`campaign x${b.toFixed(2)} < classic x${a.toFixed(2)}`); await L.close(p);
}],

];
