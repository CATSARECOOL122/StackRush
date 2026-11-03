/* Shared helpers for the browser tests: a static server, a Chromium page per test, and a "bot" that plays
   the game through the #debug hook (only available on localhost, never on the public site). */
const {chromium}=require('playwright');
const {serve}=require('../tools/serve');

const PERFECT='s=>s.cur&&Math.abs(s.cur.x-s.top.x)<Math.max(3,s.sp*0.014)';   // speed-aware alignment window
const FAR='s=>s.cur&&Math.abs(s.cur.x-s.top.x)>150';
const BOMB='s=>s.cur&&s.cur.bomb';

async function env(){
  const srv=await serve(0,undefined,'0.0.0.0');
  const browser=await chromium.launch();
  return {srv,browser,port:srv.port,url:(host='127.0.0.1')=>`http://${host}:${srv.port}/index.html#debug`,
          close:async()=>{ await browser.close(); srv.close(); }};
}
/* open a fresh game page (new browser context = empty storage). */
async function open(e,o={}){
  const ctx=await e.browser.newContext(Object.assign({viewport:{width:390,height:844},deviceScaleFactor:1,locale:'en-US'},o.ctx||{}));
  if(o.init) await ctx.addInitScript(o.init);                       // runs before the game's own scripts
  const p=await ctx.newPage(); p.errs=[]; p.ctx=ctx;
  p.on('pageerror',x=>p.errs.push(x.message)); p.on('console',m=>{ if(m.type()==='error') p.errs.push(m.text()); });
  if(o.setup) await o.setup(p);                                     // e.g. page.route() before navigation
  await p.goto(e.url(o.host)); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(300);
  if(o.seen!==false) await p.evaluate(()=>{ __sr.S.tutSeen=true; });
  return p;
}
/* wait (inside the page, frame-accurate) until cond(__sr) is true, then tap the canvas */
const act=(p,src,ms=9000)=>p.evaluate(([src,ms])=>new Promise(res=>{
  const f=eval(src), t0=performance.now();
  const loop=()=>{ const s=window.__sr; if(s.state!=='playing') return res('over');
    if(f(s)){ document.getElementById('c').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); return res('ok'); }
    if(performance.now()-t0>ms) return res('timeout'); requestAnimationFrame(loop); }; loop(); }),[src,ms]);
const perfect=p=>act(p,PERFECT);
const miss=async p=>{ await p.evaluate(()=>__sr.forceNarrow()); await act(p,FAR); await p.waitForTimeout(120); };
const sr=(p,fn,arg)=>p.evaluate(fn,arg);
async function perfects(p,n){ let ok=0; for(let i=0;i<n;i++){ if(await perfect(p)!=='ok') break; ok++; await p.waitForTimeout(25); } return ok; }
const close=p=>p.ctx.close();
module.exports={env,open,act,perfect,miss,perfects,sr,close,PERFECT,FAR,BOMB};
