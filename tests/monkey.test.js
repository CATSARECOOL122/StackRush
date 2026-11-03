/* A random "monkey" plays the whole app on the virtual clock: taps, buttons, keys, tab switches, resizes, language and theme changes,
   modes and stages, with a bot that sometimes plays properly so runs really finish. After every few actions it checks that nothing
   threw, the save is sane, the UI never shows NaN/undefined, and the tower stays inside the stage. */
const assert=require('assert');
const vt=require('../tools/lib/vtime');
const SCALE=+process.env.MONKEY_SCALE||1;                       // MONKEY_SCALE=5 node tests/run.js monkey  for a long hunt
const IPAD_UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

async function monkey(e,{seed,actions,viewport,resize=.0,tablet=false}){
  const ctx=await e.browser.newContext(Object.assign({viewport,deviceScaleFactor:1,hasTouch:true,serviceWorkers:'block',locale:'en-US'},tablet?{isMobile:true,userAgent:IPAD_UA,screen:viewport}:{}));
  const [fn,arg]=vt.initScript({seed,audioSeconds:0}); await ctx.addInitScript(fn,arg);
  await ctx.addInitScript(r=>{
    window.__errs=[]; window.__RESIZE=r;
    addEventListener('error',x=>window.__errs.push('error: '+x.message)); addEventListener('unhandledrejection',x=>window.__errs.push('rejection: '+(x.reason&&x.reason.message||x.reason)));
    console.error=(...a)=>{ window.__errs.push('console.error: '+a.map(String).join(' ').slice(0,200)); };
    window.prompt=()=>null; window.confirm=()=>false; window.alert=()=>{}; HTMLAnchorElement.prototype.click=function(){};
    Object.defineProperty(document,'hidden',{get:()=>!!window.__hidden,configurable:true});
    if(/Macintosh/.test(navigator.userAgent)){ Object.defineProperty(navigator,'maxTouchPoints',{get:()=>5}); Object.defineProperty(navigator,'platform',{get:()=>'MacIntel'}); }
  },resize);
  const p=await ctx.newPage(); const pageErrors=[]; p.on('pageerror',x=>pageErrors.push(x.message)); p.on('dialog',d=>d.dismiss().catch(()=>{}));
  await p.goto(e.url()); await p.waitForFunction(()=>document.body.classList.contains('ready'));
  await p.evaluate(vt.installBot); await p.evaluate(()=>{ __bot.on=false; });
  const trace=[], issues=[];
  for(let i=0;i<actions;i++){
    const act=await p.evaluate(()=>{
      const R=Math.random, pick=a=>a[Math.floor(R()*a.length)], sr=window.__sr, rz=window.__RESIZE;
      const vis=[...document.querySelectorAll('button,[role=button],.sw')].filter(b=>{ const q=b.getBoundingClientRect(); return q.width>0&&q.height>0&&!b.closest('.hidden')&&!['crashBtn','updBtn'].includes(b.id); });
      const roll=R(); let act='';
      if(roll<.30){ act='tap'; const c=document.getElementById('c'), x=R()*innerWidth, y=R()*innerHeight; c.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:x,clientY:y})); c.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:x,clientY:y})); }
      else if(roll<.62 && vis.length){ const b=pick(vis), q=b.getBoundingClientRect(); act='click '+(b.id||b.dataset.mode||b.dataset.set||b.dataset.stage||b.dataset.lang||b.dataset.id||String(b.className).slice(0,18)); b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:q.left+q.width/2,clientY:q.top+q.height/2})); b.click(); }
      else if(roll<.70){ const k=pick(['Space','Enter','Escape','KeyP','Tab','KeyX']); act='key '+k; window.dispatchEvent(new KeyboardEvent('keydown',{code:k,bubbles:true})); }
      else if(roll<.74){ act='hidden'; window.__hidden=!window.__hidden; document.dispatchEvent(new Event('visibilitychange')); }
      else if(roll<.76){ act='startMode'; sr.startMode(pick(['classic','timed','lives','hazard','zen','daily'])); }
      else if(roll<.77){ act='startStage'; sr.startStage(1+Math.floor(R()*24)); }
      else if(roll<.78){ act='practice'; sr.startPractice(); }
      else if(roll<.79){ act='lang'; sr.setLanguage(pick(['auto','en','es','ja','ru','hi','de'])); }
      else if(roll<.80){ act='theme'; sr.setTheme(pick(Object.keys(sr.THEMES))); }
      else if(roll<.81){ act='coins'; sr.S.coins=Math.floor(R()*3000); }
      else if(roll<.815){ act='bot'; __bot.on=R()<.7; __bot.perfects=R()<.75; __bot.tapBomb=R()<.3; }
      else if(roll<.82){ act='miss'; if(sr.state==='playing'&&sr.cur&&sr.top) sr.forceNarrow(); }
      else if(roll<.83){ act='shield+bomb'; sr.giveShield(); sr.bombNext(); }
      else if(roll<.83+rz){ act='resize'; }
      else act='wait';
      return act;
    });
    trace.push(act);
    if(act==='resize'){
      await p.evaluate(()=>{ const sr=window.__sr; if(sr.state!=='playing'){ sr.startMode('classic'); __bot.on=true; __bot.perfects=true; __vt.steps(150); } });   // resize with a tower on the stage
      const w=Math.max(300,viewport.width+Math.floor((Math.random()-.5)*300)), h=Math.max(520,viewport.height+Math.floor((Math.random()-.5)*300)); await p.setViewportSize({width:w,height:h}); }
    await p.evaluate(()=>{ const n=1+Math.floor(Math.random()*(window.__bot&&window.__bot.on?80:24)); __vt.steps(n); });
    if(i%25===0||i===actions-1||act==='resize'){
      const bad=await p.evaluate(()=>{
        const sr=window.__sr, S=sr.S, out=[], txt=document.body.innerText;
        const m=txt.match(/.{0,20}(NaN|undefined|\[object|\bnull\b).{0,20}/); if(m) out.push('bad text in the UI: '+m[0].replace(/\s+/g,' '));
        for(const k of ['coins','blocks','perfects','played','best']) if(!Number.isFinite(S[k])||S[k]<0) out.push(`${k} is ${S[k]}`);
        if(!S.owned.includes(S.theme)) out.push('equipped theme is not owned: '+S.theme);
        if(sr.state==='playing'){ const c=sr.cur, t=sr.top;
          if(c&&!(Number.isFinite(c.x)&&Number.isFinite(c.w)&&c.w>0)) out.push('moving block '+JSON.stringify(c));
          if(!t||!(t.w>0)||!Number.isFinite(t.x)) out.push('top block '+JSON.stringify(t));
          else if(t.x<-2||t.x+t.w>sr.W+2) out.push(`top block outside the stage (x=${t.x.toFixed(1)}, w=${t.w.toFixed(1)}, stage ${sr.W})`); }
        out.push(...window.__errs.splice(0).map(x=>'JS '+x)); return out; });
      for(const b of bad) issues.push(`action #${i}: ${b}   [last: ${trace.slice(-6).join(' > ')}]`);
    }
  }
  const cov=await p.evaluate(()=>({played:__sr.S.played,ach:Object.keys(__sr.S.ach).length}));
  await ctx.close();
  return {issues:[...issues,...pageErrors.map(x=>'pageerror '+x)],cov};
}

module.exports=[
['monkey, phone 390x844: random taps, buttons, keys, tab switches, languages, themes, modes (bot finishes runs)', async(e)=>{
  const r=await monkey(e,{seed:31,actions:Math.round(600*SCALE),viewport:{width:390,height:844}});
  assert.deepEqual(r.issues.slice(0,3),[],'issues'); assert.ok(r.cov.played>=2,`the monkey finished only ${r.cov.played} runs`);
}],
['monkey, small phone 360x640 with constant window resizing', async(e)=>{
  const r=await monkey(e,{seed:32,actions:Math.round(450*SCALE),viewport:{width:360,height:640},resize:.1});
  assert.deepEqual(r.issues.slice(0,3),[],'issues');
}],
['monkey, iPad 768x1024 with resizing (rotation, Split View)', async(e)=>{
  const r=await monkey(e,{seed:33,actions:Math.round(450*SCALE),viewport:{width:768,height:1024},resize:.06,tablet:true});
  assert.deepEqual(r.issues.slice(0,3),[],'issues');
}],
];
