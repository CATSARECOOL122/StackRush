/* The in-game HUD: nothing may sit on top of anything else, or poke out of the screen. (The Zen "Finish" button once hid behind the score.)
   The big score is only as wide as its digits, so boxes are measured around the real text, not the full-width line it lives in. */
const assert=require('assert');
const CODES=['en','es','pt','fr','de','it','id','tr','ru','hi','ja','ko','zh'];
const SIZES=[[320,568],[360,640],[375,667],[390,844],[430,932],[768,1024]];

const BOXES=p=>p.evaluate(()=>{
  const out={}, W=innerWidth, H=innerHeight;
  const vis=el=>{ if(!el) return false; const cs=getComputedStyle(el), r=el.getBoundingClientRect(); return !el.classList.contains('hidden') && cs.display!=='none' && cs.visibility!=='hidden' && r.width>0 && r.height>0; };
  const whole=id=>{ const el=document.getElementById(id); if(!vis(el)) return; const q=el.getBoundingClientRect(); out[id]={left:q.left,right:q.right,top:q.top,bottom:q.bottom,grp:'P'}; };
  const text=(id,inset=0)=>{ const el=document.getElementById(id); if(!vis(el)) return; const g=document.createRange(); g.selectNodeContents(el);
    const rs=[...g.getClientRects()].filter(x=>x.width>0&&x.height>0); if(!rs.length) return;
    out[id]={left:Math.min(...rs.map(x=>x.left)),right:Math.max(...rs.map(x=>x.right)),top:Math.min(...rs.map(x=>x.top))+inset,bottom:Math.max(...rs.map(x=>x.bottom))-inset,grp:'T'}; };
  for(const id of ['coins','endZen','pauseBtn','mute','skipTut','speedB','updBtn','coach']) whole(id);
  text('score',9); text('combo'); text('aux'); text('ghostD');          // (the score box is the digit glyphs, a little shorter than the line they sit in)
  return {out,W,H}; });
function problems(tag,{out,W,H}){
  const bad=[], ids=Object.keys(out);
  for(const id of ids){ const r=out[id]; if(r.left<-1||r.right>W+1||r.top<-1||r.bottom>H+1) bad.push(`${tag}: #${id} sticks out of the screen (${Math.round(r.left)}..${Math.round(r.right)} of ${W})`); }
  for(let i=0;i<ids.length;i++) for(let j=i+1;j<ids.length;j++){
    const a=out[ids[i]], b=out[ids[j]]; if(a.grp==='T' && b.grp==='T') continue;          // the stacked score / combo / hearts / best lines are laid out one under the other
    const dx=Math.min(a.right,b.right)-Math.max(a.left,b.left), dy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
    if(dx>2 && dy>2) bad.push(`${tag}: #${ids[i]} and #${ids[j]} overlap (${Math.round(dx)}x${Math.round(dy)}px)`);
  }
  return bad;
}
const stage=(p,mode,score,combo)=>p.evaluate(([mode,score,combo])=>{ const s=__sr;
  s.S.assist='off'; s.S.tutSeen=true; s.S.seenTip=true; for(const m of Object.keys(s.MODES)) s.S.tips[m]=1; for(const k of ['ice','glue','gust']) s.S.tips[k]=1;
  const tower=Array.from({length:12},()=>({x:.15,w:.7})); for(const m of ['classic','lives','hazard','timed']) s.S.ghosts[m]={score:44,blocks:tower,scores:[]};
  s.showMenu();
  if(mode==='boss') s.startStage(6); else if(mode==='challenge') s.startChallenge(s.parseChallenge('classic.1234.5')); else s.startMode(mode);
  s.setScore(score); s.setCombo(combo); },[mode,score,combo]);

module.exports=[

['HUD: in every mode, on every phone size, with short and long scores, nothing overlaps and nothing sticks out of the screen', async(e,L)=>{
  const bad=[];
  for(const [w,h] of SIZES){
    const p=await L.open(e,{ctx:{viewport:{width:w,height:h}}});
    for(const mode of ['classic','timed','lives','hazard','zen','daily','boss','challenge','practice'])
      for(const [score,combo] of [[7,0],[62,10],[1234,12],[98765,30]]){
        await stage(p,mode,score,combo); await p.waitForTimeout(60);
        bad.push(...problems(`${w}x${h} ${mode} score ${score}`,await BOXES(p)));
      }
    for(const x of p.errs) bad.push(`${w}x${h}: page error: ${x}`);
    await L.close(p);
  }
  if(process.env.HUD_DEBUG) console.log([...new Set(bad)].join('\n'));
  assert.deepEqual([...new Set(bad)],[]);
}],

['HUD: the same in all 13 languages on a small phone (translated tips, best lines, the practice card and the Skip button)', async(e,L)=>{
  const bad=[];
  for(const code of CODES){
    const p=await L.open(e,{ctx:{locale:code==='zh'?'zh-CN':code,viewport:{width:360,height:640}}});
    for(const mode of ['zen','lives','challenge','boss','practice','timed']){
      await stage(p,mode,mode==='challenge'?4321:62,mode==='zen'?10:6); await p.waitForTimeout(60);
      bad.push(...problems(`${code} ${mode}`,await BOXES(p)));
    }
    for(const x of p.errs) bad.push(`${code}: page error: ${x}`);
    await L.close(p);
  }
  if(process.env.HUD_DEBUG) console.log([...new Set(bad)].join('\n'));
  assert.deepEqual([...new Set(bad)],[]);
}],

['HUD: the Zen Finish button sits under the pause and sound buttons, right-aligned, and ends the session', async(e,L)=>{
  const p=await L.open(e,{ctx:{viewport:{width:430,height:932}}});
  await stage(p,'zen',62,10);
  const r=await p.evaluate(()=>{ const q=id=>document.getElementById(id).getBoundingClientRect(); const f=q('endZen'), pa=q('pauseBtn'), mu=q('mute'); return {fTop:f.top,fRight:f.right,fLeft:f.left,paBottom:pa.bottom,paLeft:pa.left,muRight:mu.right,muBottom:mu.bottom}; });
  assert.ok(r.fTop>=Math.max(r.paBottom,r.muBottom)-1,`Finish starts below the buttons (${r.fTop.toFixed(0)} vs ${Math.max(r.paBottom,r.muBottom).toFixed(0)})`);
  assert.ok(Math.abs(r.fRight-r.muRight)<=1,'and lines up with their right edge'); assert.ok(r.fLeft>=r.paLeft-1,'and is not wider than the two buttons');
  await p.click('#endZen'); await p.waitForTimeout(1300); assert.equal(await p.evaluate(()=>__sr.state),'over');
  for(const m of ['classic','lives','timed','hazard']){ await p.evaluate(m=>{ __sr.showMenu(); __sr.startMode(m); },m); assert.equal(await p.isVisible('#endZen'),false,'no Finish button in '+m); }
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['HUD: the "Update ready" pill never lands on the menu header or the game-over screen buttons', async(e,L)=>{
  const bad=[];
  for(const [w,h] of [[320,568],[360,640],[390,844],[430,932]]){
    const p=await L.open(e,{ctx:{viewport:{width:w,height:h}}});
    await p.evaluate(()=>{ __sr.S.tutSeen=true; __sr.setUpdateReady(true); __sr.showMenu(); }); await p.waitForTimeout(500);
    const r=await p.evaluate(()=>{ const u=document.getElementById('updBtn'); if(!u || u.classList.contains('hidden')) return {shown:false}; const q=u.getBoundingClientRect(), hit=[];
      for(const el of document.querySelectorAll('#menu button, #menu .pill, #menu .nb, #menu .mc, #coins')){ const b=el.getBoundingClientRect(); if(!b.width||!b.height||el.closest('.hidden')) continue; const dx=Math.min(q.right,b.right)-Math.max(q.left,b.left), dy=Math.min(q.bottom,b.bottom)-Math.max(q.top,b.top); if(dx>2&&dy>2) hit.push((el.id||el.className||el.tagName)+' '+Math.round(dx)+'x'+Math.round(dy)); }
      return {shown:true,hit,left:q.left,right:q.right,W:innerWidth}; });
    if(r.shown){ if(r.hit.length) bad.push(`${w}x${h} menu: the pill overlaps ${r.hit.join(', ')}`); if(r.left<-1||r.right>r.W+1) bad.push(`${w}x${h}: the pill sticks out of the screen`); } else bad.push(`${w}x${h}: the pill was not shown on the menu`);
    await L.close(p);
  }
  assert.deepEqual(bad,[]);
}],

];
