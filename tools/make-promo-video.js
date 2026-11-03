#!/usr/bin/env node
/* A ~32 second portrait promo video (1080x1920, 30 fps, with sound), rendered from the real game: a bot plays it on a
   virtual clock (see lib/vtime.js), every frame is captured, and the soundtrack is the game's own sound effects and
   music, recorded through an offline audio context. Needs ffmpeg on the PATH.

   Usage: node tools/make-promo-video.js [--out store/promo/stack-rush-promo.mp4] [--lang en|es]
                                          [--dry]     fast low-resolution preview (no sound), prints the timeline
                                          [--keep]    keep the frame images
                                          [--frames dir] where to write frames (default: system temp dir) */
const fs=require('fs'), os=require('os'), path=require('path'), {execFileSync}=require('child_process');
const {chromium}=require('playwright');
const {serve}=require('./serve');
const vt=require('./lib/vtime');
const seed=require('./lib/seed');
const root=path.join(__dirname,'..');

const args=process.argv.slice(2);
const flag=k=>args.includes('--'+k);
const opt=(k,d)=>{ const i=args.indexOf('--'+k); return i<0?d:(args[i+1]&&!args[i+1].startsWith('--')?args[i+1]:true); };
const DRY=flag('dry'), FPS=30, SECONDS=32, TOTAL=FPS*SECONDS, DSF=DRY?1:3;
const LANG=['en','es'].includes(opt('lang','en'))?opt('lang','en'):'en';
const OUT=path.resolve(opt('out',path.join(root,'store/promo/stack-rush-promo'+(LANG==='en'?'':'-'+LANG)+'.mp4')));
const FRAMES=path.resolve(opt('frames',path.join(os.tmpdir(),'stackrush-frames-'+process.pid)));

const CAP={
  en:{tap:'Tap to stack.',perfect:'Land it perfect.\nBuild combos.',speed:'It gets faster\nas you climb.',themes:'15 themes to unlock.',hazard:'Dodge the bombs.',campaign:'24 stages. 4 worlds.',tag:'Tap. Stack. Rush.',foot:'Free to play · No ads · Works offline'},
  es:{tap:'Toca para apilar.',perfect:'Cae perfecto.\nCrea combos.',speed:'Cada vez más rápido\nal subir.',themes:'15 temas por desbloquear.',hazard:'Esquiva las bombas.',campaign:'24 niveles. 4 mundos.',tag:'Toca. Apila. Sube.',foot:'Gratis · Sin anuncios · Sin conexión también'}
}[LANG];

/* ---- runs inside the page: captions, tap rings, flash and the end card ---- */
function installOverlay(cfg){
  const st=document.createElement('style');
  st.textContent=`
  #pv{position:fixed;inset:0;pointer-events:none;z-index:60;font-family:ui-rounded,"SF Pro Rounded",Nunito,system-ui,sans-serif}
  #pvCap{position:absolute;left:50%;bottom:92px;width:max-content;max-width:calc(100% - 40px);transform:translate(-50%,16px) scale(.94);opacity:0;white-space:pre-line;text-align:center;font-weight:900;font-size:25px;line-height:1.15;color:#fff;
    background:rgba(10,6,32,.74);border:1px solid rgba(255,255,255,.2);padding:12px 24px;border-radius:24px;backdrop-filter:blur(8px);box-shadow:0 10px 30px rgba(0,0,0,.4);
    transition:opacity .28s,transform .42s cubic-bezier(.34,1.56,.64,1)}
  #pvCap.on{opacity:1;transform:translate(-50%,0) scale(1)}
  #pvFlash{position:absolute;inset:0;background:#fff;opacity:0}
  .pvTap{position:absolute;left:50%;top:67%;width:78px;height:78px;margin:-39px 0 0 -39px;border-radius:50%;border:4px solid rgba(255,255,255,.9);background:rgba(255,255,255,.2);animation:pvtap .42s ease-out forwards}
  @keyframes pvtap{from{transform:scale(.35);opacity:1}to{transform:scale(1.3);opacity:0}}
  #toast{display:none!important}
  #play.demo-press{transform:translateY(4px) scale(.985)!important;filter:brightness(.92)}
  #pvEnd{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;opacity:0;transition:opacity .5s;
    background:radial-gradient(ellipse at 50% 18%,#3b2480 0,#1b1044 48%,#09051d 100%)}
  #pvEnd.on{opacity:1}
  #pvEnd img{width:118px;height:118px;border-radius:26px;box-shadow:0 14px 34px rgba(0,0,0,.5);transform:scale(.6);transition:transform .7s cubic-bezier(.34,1.56,.64,1) .1s}
  #pvEnd.on img{transform:scale(1)}
  .pvlogo{display:flex;flex-direction:column;align-items:center;line-height:.86;font-size:62px;font-weight:900;letter-spacing:-2px;filter:drop-shadow(0 6px 18px #0008)}
  .pvlogo span:first-child{background:linear-gradient(180deg,#fff,#ffd36b);-webkit-background-clip:text;background-clip:text;color:transparent}
  .pvlogo span:last-child{background:linear-gradient(180deg,#ff8ad0,#7c5cff);-webkit-background-clip:text;background-clip:text;color:transparent}
  .pvtag{font-weight:900;font-size:24px;color:#fff;margin-top:6px}
  .pvfoot{font-weight:800;font-size:14px;color:rgba(255,255,255,.7);letter-spacing:.3px;text-align:center;max-width:300px}`;
  document.head.appendChild(st);
  const pv=document.createElement('div'); pv.id='pv';
  pv.innerHTML=`<div id="pvFlash"></div><div id="pvCap"></div><div id="pvEnd"><img src="${cfg.icon}" alt=""><div class="pvlogo"><span>STACK</span><span>RUSH</span></div><div class="pvtag"></div><div class="pvfoot"></div></div>`;
  document.body.appendChild(pv);
  const cap=document.getElementById('pvCap'), flash=document.getElementById('pvFlash'), end=document.getElementById('pvEnd');
  window.__pv={
    cap(text){ cap.style.transition='none'; cap.classList.remove('on'); void cap.offsetWidth; cap.style.transition='';
               if(text){ cap.textContent=text; cap.classList.add('on'); } },
    flash(on,ms){ flash.style.transition=`opacity ${ms}ms`; flash.style.opacity=on?1:0; },
    end(tag,foot){ end.querySelector('.pvtag').textContent=tag; end.querySelector('.pvfoot').textContent=foot; end.classList.add('on'); },
    press(sel,on){ const b=document.querySelector(sel); b.classList.toggle('demo-press',on); if(on){ const r=b.getBoundingClientRect(); b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2})); } }
  };
  document.getElementById('c').addEventListener('pointerdown',()=>{ const r=document.createElement('i'); r.className='pvTap'; pv.appendChild(r); setTimeout(()=>r.remove(),480); });   // a ring under the "thumb" on every tap
}

(async()=>{
  try{ execFileSync('ffmpeg',['-version'],{stdio:'ignore'}); }catch(e){ console.error('ffmpeg is needed (apt install ffmpeg / brew install ffmpeg)'); process.exit(1); }
  fs.rmSync(FRAMES,{recursive:true,force:true}); fs.mkdirSync(FRAMES,{recursive:true}); fs.mkdirSync(path.dirname(OUT),{recursive:true});
  const srv=await serve(0), browser=await chromium.launch();
  const ctx=await browser.newContext({viewport:{width:360,height:640},deviceScaleFactor:DSF,locale:LANG,serviceWorkers:'block'});
  const [vtFn,vtArg]=vt.initScript({seed:5,audioSeconds:DRY?0:SECONDS+18}); await ctx.addInitScript(vtFn,vtArg);
  await ctx.addInitScript(s=>localStorage.setItem('stackrush.v2',s),seed.save({owned:seed.FREE,lastClaim:seed.dToday,streak:3,daily:{day:seed.dToday,perfects:12,done:true},camp:{},worldDone:{}}));   // stage 1 is not cleared yet, so the clear screen shows its coin reward
  const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://127.0.0.1:${srv.port}/index.html#debug`); await p.waitForFunction(()=>document.body.classList.contains('ready'));
  await p.evaluate(()=>{ __sr.CFG.maxDpr=3; __sr.resize(); __sr.ACH.forEach(a=>{ __sr.S.ach[a.id]=1; }); });
  const icon='data:image/png;base64,'+fs.readFileSync(path.join(root,'icons/icon-512.png')).toString('base64');
  await p.evaluate(installOverlay,{icon}); await p.evaluate(vt.installBot); await p.evaluate(()=>{ __bot.on=false; });

  /* ---- the storyboard: [video second, what happens] ---- */
  const cuts=[];                                                       // stretches of game time skipped (their sound is cut too)
  const log=(t,msg)=>{ if(DRY) console.log(`  ${t.toFixed(2).padStart(6)}s  ${msg}`); };
  const cap=text=>p.evaluate(t=>__pv.cap(t),text);
  const theme=id=>p.evaluate(id=>__sr.setTheme(id),id);
  const THEMES_MONTAGE=['neon','ocean','candy','sakura','cyber','galaxy','gold'];
  const beats=[
    [0.0,'first tap anywhere starts the music',()=>p.evaluate(()=>document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})))],
    [2.2,'press PLAY',()=>p.evaluate(()=>__pv.press('#play',true))],
    [2.37,'-> Classic starts',()=>p.evaluate(()=>{ __pv.press('#play',false); document.getElementById('play').click(); __bot.on=true; })],
    [3.0,'caption: tap',()=>cap(CAP.tap)],
    [5.3,'caption: perfect',()=>cap(CAP.perfect)],
    [7.9,'caption: speed',()=>cap(CAP.speed)],
    [10.6,'caption off',()=>cap('')],
    [11.2,'caption: themes',()=>cap(CAP.themes)],
    ...THEMES_MONTAGE.map((id,i)=>[11.3+i*0.72,'theme '+id,()=>theme(id)]),
    [16.5,'-> Hazard',()=>p.evaluate(()=>{ __pv.cap(''); __pv.flash(true,110); })],
    [16.67,'hazard run begins',()=>p.evaluate(()=>{ __sr.setTheme('lava'); __sr.startMode('hazard'); __pv.flash(false,260); })],
    [17.1,'caption: hazard',()=>cap(CAP.hazard)],
    [18.3,'a shield, and the next block is a bomb that we tap (defused)',()=>p.evaluate(()=>{ __sr.CFG.bombTtl=1.3; __sr.giveShield(); __bot.tapBomb=true; __sr.bombNext(); })],   // (a shorter fuse keeps the dodge snappy)
    [20.6,'the next bomb is let through (dodged)',()=>p.evaluate(()=>{ __sr.bombNext(); })],
    [23.1,'-> Campaign',()=>p.evaluate(()=>{ __pv.cap(''); __pv.flash(true,110); })],
    [23.27,'campaign stage 1',()=>p.evaluate(()=>{ __sr.setTheme('forest'); __sr.startStage(1); __pv.flash(false,260); })],
    [23.7,'caption: campaign',()=>cap(CAP.campaign)],
    [26.2,'caption off (the stage-clear screen comes next)',()=>cap('')],
    [29.6,'end card',()=>p.evaluate(([t,f])=>{ __pv.cap(''); __pv.end(t,f); },[CAP.tag,CAP.foot])]
  ].sort((a,b)=>a[0]-b[0]);
  console.log(`rendering ${TOTAL} frames (${DRY?'dry run, low resolution':'1080x1920'}) to ${FRAMES} ...`);
  let lastState='', t00=Date.now();
  for(let f=0;f<TOTAL;f++){
    const t=f/FPS;
    while(beats.length && beats[0][0]<=t+1e-9){ const [bt,msg,fn]=beats.shift(); log(t,msg); await fn(); }
    await vt.step(p,2);                                                  // two 1/60 s steps = one 1/30 s frame
    const st=await p.evaluate(()=>({s:__sr.state,n:__sr.stackLen,sp:+__sr.sp.toFixed(0),m:__sr.mode}));
    if(DRY && st.s!==lastState){ log(t,`state -> ${st.s} (${st.m}, ${st.n} blocks)`); lastState=st.s; }
    const buf=await p.screenshot({type:'jpeg',quality:DRY?72:93});
    fs.writeFileSync(path.join(FRAMES,String(f+1).padStart(4,'0')+'.jpg'),buf);
    if(!DRY && f%90===89) console.log(`  ${f+1}/${TOTAL} frames, ${((Date.now()-t00)/1000).toFixed(0)}s`);
  }
  if(errs.length) console.log('page errors:',errs.slice(0,5));

  let audioFile=null;
  if(!DRY){
    console.log('recording the soundtrack ...');
    const a=await vt.audioWav(p), rate=a.rate, ch=a.channels;
    const pcm=new Int16Array(a.pcm.buffer,a.pcm.byteOffset,a.pcm.length/2), frames=pcm.length/ch;
    const segs=[]; let pos=0;
    for(const [c0,c1] of cuts){ segs.push([pos,Math.round(c0*rate)]); pos=Math.round(c1*rate); }
    segs.push([pos,frames]);
    const keep=segs.reduce((n,[s,e])=>n+Math.max(0,e-s),0), out=new Int16Array(keep*ch), fade=Math.round(rate*.015); let o=0;
    segs.forEach(([s,e],k)=>{ for(let i=s;i<e;i++){ let g=1; if(k>0&&i-s<fade) g=(i-s)/fade; if(k<segs.length-1&&e-i<=fade) g=Math.min(g,(e-i)/fade);
      for(let c=0;c<ch;c++) out[o++]=Math.round(pcm[i*ch+c]*g); } });
    audioFile=path.join(FRAMES,'audio.s16le'); fs.writeFileSync(audioFile,Buffer.from(out.buffer));
    console.log(`  ${(keep/rate).toFixed(1)}s of sound kept (${cuts.length} cut${cuts.length===1?'':'s'})`);
  }
  await browser.close(); srv.close();

  console.log('encoding ...');
  const vf='scale=in_range=full:out_range=limited:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p';
  const ff=['-y','-loglevel','error','-framerate',String(FPS),'-i',path.join(FRAMES,'%04d.jpg')];
  if(audioFile) ff.push('-f','s16le','-ar',String(44100),'-ac','2','-i',audioFile,'-af',`afade=t=in:d=0.05,afade=t=out:st=${SECONDS-1.2}:d=1.2,loudnorm=I=-15:TP=-1.5:LRA=11`);
  ff.push('-vf',vf,'-c:v','libx264','-preset',DRY?'veryfast':'slow','-crf',DRY?'30':'27','-maxrate','4M','-bufsize','8M','-profile:v','high','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart');
  if(audioFile) ff.push('-c:a','aac','-b:a','128k','-ar','44100');
  ff.push('-t',String(SECONDS),OUT);
  execFileSync('ffmpeg',ff,{stdio:'inherit'});
  if(!flag('keep') && !DRY) fs.rmSync(FRAMES,{recursive:true,force:true});
  console.log(`✓ ${path.relative(process.cwd(),OUT)}  ${(fs.statSync(OUT).size/1024/1024).toFixed(1)} MB`+(DRY?`   (frames kept in ${FRAMES})`:''));
})();
