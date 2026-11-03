/* Virtual time for deterministic rendering (store screenshots, promo video).
   The page's clock, timers, requestAnimationFrame, Math.random, CSS animations and (optionally) its WebAudio
   output are all driven from Node, one 1/60 s step at a time, so a frame always looks the same and the
   soundtrack lines up with the picture. Nothing here ships with the game: the page just runs unmodified. */

/* runs inside the page before any of the game's own scripts */
function install(opts){
  const RealDate=Date, T0=RealDate.now();
  let now=0, seq=0, rseq=0, seed=(opts.seed>>>0)||1;
  const timers=new Map(), raf=new Map();

  Math.random=()=>{ seed=(seed+0x6D2B79F5)>>>0; let t=seed; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
  performance.now=()=>now;
  class VDate extends RealDate{ constructor(...a){ if(a.length===0) super(T0+now); else super(...a); } static now(){ return T0+now; } }
  window.Date=VDate;
  window.setTimeout=(fn,ms=0,...a)=>{ const id=++seq; timers.set(id,{t:now+Math.max(0,+ms||0),fn,a,every:0,n:id}); return id; };
  window.setInterval=(fn,ms=0,...a)=>{ const id=++seq, e=Math.max(1,+ms||1); timers.set(id,{t:now+e,fn,a,every:e,n:id}); return id; };
  window.clearTimeout=window.clearInterval=id=>{ timers.delete(id); };
  window.requestAnimationFrame=cb=>{ const id=++rseq; raf.set(id,cb); return id; };
  window.cancelAnimationFrame=id=>{ raf.delete(id); };

  /* CSS transitions/animations and element.animate(): freeze them and set their clock by hand */
  function syncAnims(){
    let list=[]; try{ list=document.getAnimations(); }catch(e){}
    for(const a of list){
      if(a.__vt===undefined){ a.__vt=now; try{ a.pause(); }catch(e){} }
      try{ a.currentTime=now-a.__vt; }catch(e){}
    }
  }

  const vt=window.__vt={
    pre:null,                                   // optional callback run at the start of every step (the bot)
    get now(){ return now; },
    step(ms=1000/60){
      if(vt.pre){ try{ vt.pre(); }catch(e){ console.error(e); } }
      const target=now+ms;
      for(;;){                                  // fire due timers in time order
        let pick=null;
        for(const tm of timers.values()) if(tm.t<=target && (!pick || tm.t<pick.t || (tm.t===pick.t && tm.n<pick.n))) pick=tm;
        if(!pick) break;
        now=Math.max(now,pick.t);
        if(pick.every){ pick.t+=pick.every; pick.n=++seq; } else timers.delete(pick.n);
        try{ pick.fn(...pick.a); }catch(e){ console.error(e); }
      }
      now=target;
      const cbs=[...raf.values()]; raf.clear();
      for(const cb of cbs){ try{ cb(now); }catch(e){ console.error(e); } }
      syncAnims();
    },
    steps(n){ for(let i=0;i<n;i++) vt.step(); },
    until(src,max){ const f=(0,eval)(src); let i=0; while(i<max && !f()){ vt.step(); i++; } return i; }
  };

  /* soundtrack: give the game an offline AudioContext whose clock is the virtual clock, then render it at the end */
  if(opts.audioSeconds){
    const rate=44100;
    class VAudio extends OfflineAudioContext{
      constructor(){ super(2,Math.ceil(rate*opts.audioSeconds),rate); window.__vtAc=this; }
      get currentTime(){ return now/1000; }
      get state(){ return 'running'; }
      resume(){ return Promise.resolve(); }
    }
    window.AudioContext=VAudio; window.webkitAudioContext=VAudio;
    vt.renderAudio=async()=>{
      const buf=await window.__vtAc.startRendering(), n=buf.length, ch=buf.numberOfChannels;
      const data=[...Array(ch).keys()].map(i=>buf.getChannelData(i)), out=new Int16Array(n*ch);
      for(let i=0;i<n;i++) for(let c=0;c<ch;c++){ const v=Math.max(-1,Math.min(1,data[c][i])); out[i*ch+c]=v<0?v*32768:v*32767; }
      const bytes=new Uint8Array(out.buffer); let bin='';
      for(let i=0;i<bytes.length;i+=0x8000) bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));
      return {rate:buf.sampleRate,channels:ch,b64:btoa(bin)};
    };
  }
}

/* Node side */
const initScript=(opts={})=>[install,{seed:1,audioSeconds:0,...opts}];
const step=(page,n=1)=>page.evaluate(n=>__vt.steps(n),n);
const seconds=(page,s)=>step(page,Math.round(s*60));
const until=(page,src,max=600)=>page.evaluate(([s,m])=>__vt.until(s,m),[src,max]);
async function audioWav(page){
  const r=await page.evaluate(()=>__vt.renderAudio());
  return {rate:r.rate,channels:r.channels,pcm:Buffer.from(r.b64,'base64')};     // raw signed 16-bit little-endian
}

/* The autoplayer the tools use. It runs inside the page before every step, like a very steady human. */
function installBot(){
  const bot=window.__bot={on:true,bombs:'dodge',aim:.45,taps:0,perfects:true,prev:null,tapBomb:false};
  const cv=document.getElementById('c');
  const tap=()=>{ bot.taps++; cv.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:200,clientY:400})); };
  __vt.pre=()=>{
    const s=window.__sr; if(!bot.on||s.state!=='playing'||s.paused||!s.cur){ bot.prev=null; return; }
    const cur=s.cur, top=s.top;
    if(cur.bomb){                                                                  // by default bombs just slide by
      if(bot.tapBomb){ const cx=cur.x+cur.w/2; if(cx>top.x+top.w*.25 && cx<top.x+top.w*.75 && cur.ttl<2.3){ tap(); bot.tapBomb=false; } }
      return; }
    const tol=s.CFG.perfectPx*s.u*s.tolFactor(), dx=cur.x-top.x;
    if(!bot.perfects){ if(Math.abs(dx)>tol*3 && bot.prev!==null && Math.abs(bot.prev)<=Math.abs(dx)) tap(); bot.prev=dx; return; }
    if(Math.abs(dx)<=tol*bot.aim){ tap(); bot.prev=null; return; }
    bot.prev=dx;
  };
}
module.exports={initScript,step,seconds,until,audioWav,installBot};
