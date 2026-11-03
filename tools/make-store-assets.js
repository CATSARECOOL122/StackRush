#!/usr/bin/env node
/* Google Play listing graphics, rendered from the real game (no mock-ups): the game runs on a virtual clock,
   a bot plays it into each moment, and the screenshot is framed with a caption.

     store/screenshots/<lang>/01-gameplay.jpg ... 08-menu.jpg     1080x1920 phone screenshots
     store/feature-graphic/<lang>.jpg                             1024x500

   Usage: node tools/make-store-assets.js [--lang en,es | all] [--only gameplay,menu] [--out dir]
   Captions are in COPY below (machine-written; have a native speaker check them before publishing).
   Needs fonts for every script: on Linux install fonts-noto-cjk and fonts-noto-core (Hindi/Korean/Japanese/Chinese). */
const fs=require('fs'), path=require('path');
const {chromium}=require('playwright');
const {serve}=require('./serve');
const vt=require('./lib/vtime');
const root=path.join(__dirname,'..');

const args=process.argv.slice(2);
const opt=(k,d)=>{ const i=args.indexOf('--'+k); return i<0?d:(args[i+1]&&!args[i+1].startsWith('--')?args[i+1]:true); };
const RENDERABLE=['en','es','pt','fr','de','it','id','tr','ru','hi','ja','ko','zh'];
const langs=String(opt('lang','en,es'))==='all'?RENDERABLE:String(opt('lang','en,es')).split(',').map(s=>s.trim()).filter(Boolean);
const only=opt('only',null)?String(opt('only')).split(','):null;
const OUT=path.resolve(opt('out',path.join(root,'store')));

/* caption text, one set per language ("\n" = line break) */
const COPY={
 en:{gameplay:'Tap. Stack. Rush.',speed:'Faster the\nhigher you climb.',hazard:'Dodge the bombs.',themes:'15 themes to unlock.',campaign:'24 stages.\n4 worlds.',modes:'7 ways to play.',results:'Beat your best.\nShare it.',menu:'No ads.\nWorks offline.',feature:'Tap. Stack. Rush.'},
 es:{gameplay:'Toca. Apila. Sube.',speed:'Cada vez más\nrápido al subir.',hazard:'Esquiva las bombas.',themes:'15 temas por desbloquear.',campaign:'24 niveles.\n4 mundos.',modes:'7 formas de jugar.',results:'Supera tu récord.\nCompártelo.',menu:'Sin anuncios.\nSin conexión también.',feature:'Toca. Apila. Sube.'},
 pt:{gameplay:'Toque. Empilhe. Suba.',speed:'Mais rápido\nquanto mais alto.',hazard:'Desvie das bombas.',themes:'15 temas para liberar.',campaign:'24 fases.\n4 mundos.',modes:'7 modos de jogo.',results:'Supere seu recorde.\nCompartilhe.',menu:'Sem anúncios.\nFunciona offline.',feature:'Toque. Empilhe. Suba.'},
 fr:{gameplay:'Touche. Empile. Grimpe.',speed:'De plus en plus\nrapide en montant.',hazard:'Esquive les bombes.',themes:'15 thèmes à débloquer.',campaign:'24 niveaux.\n4 mondes.',modes:'7 façons de jouer.',results:'Bats ton record.\nPartage-le.',menu:'Sans pub.\nJouable hors ligne.',feature:'Touche. Empile. Grimpe.'},
 de:{gameplay:'Tippen. Stapeln.\nHoch hinaus.',speed:'Je höher,\ndesto schneller.',hazard:'Weich den\nBomben aus.',themes:'15 Designs zum\nFreischalten.',campaign:'24 Level.\n4 Welten.',modes:'7 Spielmodi.',results:'Schlag deinen\nRekord. Teile ihn.',menu:'Keine Werbung.\nAuch offline.',feature:'Tippen. Stapeln.\nHoch hinaus.'},
 it:{gameplay:'Tocca. Impila. Sali.',speed:'Sempre più veloce\nmentre sali.',hazard:'Schiva le bombe.',themes:'15 temi da sbloccare.',campaign:'24 livelli.\n4 mondi.',modes:'7 modi di giocare.',results:'Batti il tuo record.\nCondividilo.',menu:'Niente pubblicità.\nFunziona offline.',feature:'Tocca. Impila. Sali.'},
 id:{gameplay:'Ketuk. Tumpuk. Naik.',speed:'Makin tinggi,\nmakin cepat.',hazard:'Hindari bom.',themes:'15 tema untuk dibuka.',campaign:'24 level.\n4 dunia.',modes:'7 cara bermain.',results:'Pecahkan rekormu.\nBagikan.',menu:'Tanpa iklan.\nBisa main offline.',feature:'Ketuk. Tumpuk. Naik.'},
 tr:{gameplay:'Dokun. İstifle.\nYüksel.',speed:'Yükseldikçe\nhızlanır.',hazard:'Bombalardan kaç.',themes:'Açılacak 15 tema.',campaign:'24 bölüm.\n4 dünya.',modes:'7 oyun modu.',results:'Rekorunu kır.\nPaylaş.',menu:'Reklamsız.\nÇevrimdışı çalışır.',feature:'Dokun. İstifle. Yüksel.'},
 ru:{gameplay:'Касайся. Строй.\nПодымайся.',speed:'Чем выше,\nтем быстрее.',hazard:'Уворачивайся\nот бомб.',themes:'15 тем для\nоткрытия.',campaign:'24 этапа.\n4 мира.',modes:'7 режимов игры.',results:'Побей свой рекорд.\nПоделись им.',menu:'Без рекламы.\nРаботает офлайн.',feature:'Касайся. Строй. Подымайся.'},
 hi:{gameplay:'टैप करें, ब्लॉक जमाएं,\nऊपर चढ़ें।',speed:'जितना ऊपर,\nउतनी तेज़ रफ़्तार।',hazard:'बमों से बचें।',themes:'15 थीम अनलॉक करें।',campaign:'4 दुनिया,\n24 स्तर।',modes:'खेलने के 7 तरीके।',results:'अपना रिकॉर्ड तोड़ें।\nदोस्तों को दिखाएं।',menu:'कोई विज्ञापन नहीं।\nऑफ़लाइन भी चलता है।',feature:'टैप करें, जमाएं, ऊपर चढ़ें।'},
 ko:{gameplay:'탭하고, 쌓고,\n올라가요.',speed:'높이 올라갈수록\n더 빨라져요.',hazard:'폭탄을 피하세요.',themes:'15가지 테마를\n해금하세요.',campaign:'4개 월드\n24개 스테이지.',modes:'7가지 플레이 모드.',results:'최고 기록을 깨고\n친구에게 공유하세요.',menu:'광고 없음.\n오프라인에서도 OK.',feature:'탭하고, 쌓고, 올라가요.'},
 ja:{gameplay:'タップして、積んで、\n駆け上がれ。',speed:'高くなるほど\nスピードアップ。',hazard:'爆弾をよけよう。',themes:'15種類のテーマを解放。',campaign:'4つのワールドに\n24ステージ。',modes:'7つの遊び方。',results:'ベストを更新して\nシェアしよう。',menu:'広告なし。\nオフラインでも遊べる。',feature:'タップして、積んで、駆け上がれ。'},
 zh:{gameplay:'点一下，叠起来，\n冲上去。',speed:'越高越快。',hazard:'躲开炸弹。',themes:'15 款主题等你解锁。',campaign:'4 个世界\n24 个关卡。',modes:'7 种玩法。',results:'刷新纪录\n分享给朋友。',menu:'无广告，\n离线也能玩。',feature:'点一下，叠起来，冲上去。'}
};

/* ----- the saved game each screenshot starts from ----- */
const pad=n=>String(n).padStart(2,'0'), day=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const dToday=day(new Date()), dYest=day(new Date(Date.now()-864e5));
const ghost={score:63,blocks:Array.from({length:64},(_,i)=>({x:+(.28+Math.sin(i*.55)*.05).toFixed(3),w:+Math.max(.2,.5-i*.004).toFixed(3)})),scores:Array.from({length:64},(_,i)=>i+Math.floor(i*i/14))};
const save=(o={})=>JSON.stringify(Object.assign({
  coins:1240,blocks:420,perfects:310,played:30,bestCombo:14,maxHeight:41,tutSeen:true,seenTip:true,assist:'off',
  tips:{classic:1,timed:1,lives:1,hazard:1,zen:1},bests:{classic:63,timed:48,lives:55,hazard:37},ghosts:{classic:ghost},
  streak:3,lastClaim:dYest,daily:{day:dToday,perfects:5,done:false},twist:{day:dToday,done:false,best:0},
  owned:['sunset','neon','ocean','forest','desert'],theme:'sunset',lastMode:'classic',
  ach:{first:1,p10:1,h10:1},camp:{1:3,2:3,3:2,4:3,5:3,6:3,7:2,8:1,9:2},worldDone:{0:1}
},o));

/* ----- the scenes: each plays the real game into one moment ----- */
const DAILY_DONE={daily:{day:dToday,perfects:12,done:true}};
const classic=async(p)=>{ await p.evaluate(()=>__sr.startMode('classic')); await p.evaluate(vt.installBot); };
const SCENES=[
 {id:'gameplay',file:'01-gameplay',theme:'neon',save:DAILY_DONE,async go(p){
    await classic(p); await vt.until(p,'()=>__sr.state==="playing"&&__sr.combo>=10',3000); await vt.step(p,7); }},
 {id:'speed',file:'02-speed',theme:'ocean',save:DAILY_DONE,async go(p){
    await classic(p); await vt.until(p,'()=>__sr.stackLen>=11',3000); await vt.until(p,'()=>!!__sr.speedCue',1500); await vt.step(p,13); }},
 {id:'hazard',file:'03-hazard',theme:'lava',save:DAILY_DONE,async go(p){
    await p.evaluate(()=>__sr.startMode('hazard')); await p.evaluate(vt.installBot);
    await vt.until(p,'()=>__sr.stackLen>=7',3000);
    await vt.until(p,'()=>{const c=__sr.cur;return !!(c&&c.bomb&&c.ttl<1.5&&c.x>__sr.W*.25&&c.x<__sr.W*.6)}',3000); }},
 {id:'themes',file:'04-themes',theme:'sunset',save:{blocks:900,coins:640},async go(p){
    await p.evaluate(()=>__sr.openThemes('menu')); await vt.seconds(p,1.4); }},
 {id:'campaign',file:'05-campaign',theme:'forest',async go(p){
    await p.evaluate(()=>__sr.showStages()); await vt.seconds(p,1.4); }},
 {id:'modes',file:'06-modes',theme:'sunset',async go(p){
    await p.evaluate(()=>__sr.showModes()); await vt.seconds(p,1.4); }},
 {id:'results',file:'07-results',theme:'candy',save:Object.assign({blocks:185,bests:{classic:20,timed:48,lives:55,hazard:37},ghosts:{}},DAILY_DONE),async go(p){
    await classic(p); await vt.until(p,'()=>__sr.stackLen>=28',4000);
    await p.evaluate(()=>{ __bot.on=false; });
    for(let k=0;k<3 && await p.evaluate(()=>__sr.state)==='playing';k++){                 // a shield absorbs the first miss
      await p.evaluate(()=>__sr.forceNarrow());
      await vt.until(p,'()=>{const c=__sr.cur;return !c||Math.abs(c.x-__sr.top.x)>150}',900);
      await p.evaluate(()=>document.getElementById('c').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})));
      await vt.seconds(p,.3);
    }
    await vt.seconds(p,3.2); }},
 {id:'menu',file:'08-menu',theme:'sunset',save:{owned:['sunset','neon','ocean','forest','desert','ice','candy','lava','sakura','retro','deepsea','winter']},async go(p){ await vt.seconds(p,3.4); }}
];

/* ----- framing ----- */
const FONT='ui-rounded,"SF Pro Rounded",Nunito,"Segoe UI",system-ui,sans-serif';
const cjk=l=>l==='ja'||l==='zh'||l==='ko';                      // square glyphs: size by character count
const noTrack=l=>cjk(l)||l==='hi';                              // no letter-spacing (it breaks Devanagari conjuncts)
function capSize(lang,text){
  const longest=Math.max(...text.split('\n').map(s=>[...s].length));
  const sz=cjk(lang)?940/longest:lang==='hi'?1000/(longest*.5):1000/(longest*.58);
  return Math.round(Math.max(66,Math.min(112,sz)));
}
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const BG='radial-gradient(ellipse at 50% 0%,#40288a 0,#1b1044 46%,#09051d 100%)';
function frameHtml(lang,caption,img,halo){
  return `<!doctype html><html lang="${lang}"><meta charset="utf-8"><style>
  html,body{margin:0;width:1080px;height:1920px;overflow:hidden}
  body{font-family:${FONT};background:${BG};position:relative}
  .halo{position:absolute;left:50%;top:1140px;width:1500px;height:1500px;margin:-750px 0 0 -750px;background:radial-gradient(circle,${halo}77 0,${halo}00 62%)}
  .cap{position:absolute;left:50px;right:50px;top:70px;height:330px;display:flex;align-items:center;justify-content:center;text-align:center;color:#fff;font-weight:900;font-size:${capSize(lang,caption)}px;line-height:1.1;letter-spacing:${noTrack(lang)?0:-1}px;white-space:pre-line;text-shadow:0 6px 30px rgba(0,0,0,.4)}
  .ph{position:absolute;left:190px;top:440px;width:700px;height:1400px;border-radius:64px;overflow:hidden;box-shadow:0 0 0 14px #0b0720,0 0 0 17px rgba(255,255,255,.2),0 50px 100px rgba(0,0,0,.6)}
  .ph img{display:block;width:100%;height:100%}
  </style><div class="halo"></div><div class="cap">${esc(caption)}</div><div class="ph"><img src="${img}"></div>`;
}
function featureHtml(lang,tagline,img,halo){
  return `<!doctype html><html lang="${lang}"><meta charset="utf-8"><style>
  html,body{margin:0;width:1024px;height:500px;overflow:hidden}
  body{font-family:${FONT};background:${BG};position:relative}
  .halo{position:absolute;left:760px;top:260px;width:900px;height:900px;margin:-450px 0 0 -450px;background:radial-gradient(circle,${halo}88 0,${halo}00 62%)}
  .logo{position:absolute;left:60px;top:70px;display:flex;flex-direction:column;line-height:.84;font-size:150px;font-weight:900;letter-spacing:-5px;filter:drop-shadow(0 8px 22px #0008)}
  .logo span:first-child{background:linear-gradient(180deg,#fff,#ffd36b);-webkit-background-clip:text;background-clip:text;color:transparent}
  .logo span:last-child{background:linear-gradient(180deg,#ff8ad0,#7c5cff);-webkit-background-clip:text;background-clip:text;color:transparent}
  .tag{position:absolute;left:64px;top:392px;width:540px;color:#fff;font-weight:800;font-size:${cjk(lang)?34:38}px;opacity:.92;text-shadow:0 3px 14px #0007;line-height:1.15}
  .ph{position:absolute;left:650px;top:40px;width:290px;height:580px;border-radius:32px;overflow:hidden;transform:rotate(7deg);box-shadow:0 0 0 7px #0b0720,0 0 0 9px rgba(255,255,255,.22),0 30px 60px rgba(0,0,0,.6)}
  .ph img{display:block;width:100%;height:100%}
  </style><div class="halo"></div><div class="logo"><span>STACK</span><span>RUSH</span></div><div class="tag">${esc(tagline.replace(/\n/g,' '))}</div><div class="ph"><img src="${img}"></div>`;
}

(async()=>{
  const srv=await serve(0); const browser=await chromium.launch();
  const url=`http://127.0.0.1:${srv.port}/index.html#debug`;
  const todo=SCENES.filter(s=>!only||only.includes(s.id));
  let n=0;
  for(const lang of langs){
    if(!COPY[lang]){ console.log(`- ${lang}: no captions or fonts for this language here, skipped`); continue; }
    fs.mkdirSync(path.join(OUT,'screenshots',lang),{recursive:true}); fs.mkdirSync(path.join(OUT,'feature-graphic'),{recursive:true});
    let heroPng=null, heroHalo='#7c5cff';
    const frameCtx=await browser.newContext({viewport:{width:1080,height:1920},deviceScaleFactor:1,locale:lang==='zh'?'zh-CN':lang});
    for(const sc of todo){
      const ctx=await browser.newContext({viewport:{width:360,height:720},deviceScaleFactor:3,locale:lang==='zh'?'zh-CN':lang,serviceWorkers:'block'});
      const [vtFn,vtArg]=vt.initScript({seed:11}); await ctx.addInitScript(vtFn,vtArg);
      await ctx.addInitScript(s=>localStorage.setItem('stackrush.v2',s),save(Object.assign({theme:sc.theme,owned:['sunset','neon','ocean','forest','desert','candy','lava']},sc.save||{})));
      const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
      await p.goto(url); await p.waitForFunction(()=>document.body.classList.contains('ready'));
      await p.evaluate(()=>{ __sr.CFG.maxDpr=3; __sr.resize(); __sr.ACH.forEach(a=>{ __sr.S.ach[a.id]=1; }); }); await vt.seconds(p,.4);
      await sc.go(p); await p.evaluate(()=>{ document.getElementById('toast').style.display='none'; }); await vt.step(p,1);   // toasts are ephemeral: keep them out of the pictures
      const raw=await p.screenshot({type:'png'});
      const hex=await p.evaluate(()=>{                                   // the theme's main colour, for the glow behind the phone
        const th=__sr.THEMES[__sr.S.theme], h=th.h0, sa=th.s/100, l=th.l/100, a=sa*Math.min(l,1-l);
        const f=n=>{ const k=(n+h/30)%12; return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0'); };
        return '#'+f(0)+f(8)+f(4); });
      if(sc.id==='gameplay'){ heroPng=raw; heroHalo=hex; }
      const shot=await frameCtx.newPage();
      await shot.setContent(frameHtml(lang,COPY[lang][sc.id],'data:image/png;base64,'+raw.toString('base64'),hex));
      await shot.screenshot({path:path.join(OUT,'screenshots',lang,sc.file+'.jpg'),type:'jpeg',quality:90}); await shot.close();
      if(errs.length) console.log(`  ! ${lang}/${sc.id}: ${errs.join('; ')}`);
      await ctx.close(); n++;
    }
    await frameCtx.close();
    if(heroPng){
      const ctx=await browser.newContext({viewport:{width:1024,height:500},locale:lang==='zh'?'zh-CN':lang}); const f=await ctx.newPage();
      await f.setContent(featureHtml(lang,COPY[lang].feature,'data:image/png;base64,'+heroPng.toString('base64'),heroHalo));
      await f.screenshot({path:path.join(OUT,'feature-graphic',lang+'.jpg'),type:'jpeg',quality:92}); await ctx.close();
    }
    console.log(`✓ ${lang}`);
  }
  await browser.close(); srv.close();
  console.log(`${n} screenshots written to ${path.relative(process.cwd(),OUT)||'.'}`);
})();
