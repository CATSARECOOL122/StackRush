/* Phones, tall iPhones (15 Pro Max), iPads and desktops: geometry, "no white bars", detection, orientation. */
const assert=require('assert'), fs=require('fs'), path=require('path');
const IPAD_UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';   // iPadOS reports itself as a Mac
const IPHONE_UA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
/* what iOS Safari looks like to a page: no vibration API; an iPad has 5 touch points and platform MacIntel */
const iosInit=()=>{
  try{ delete Navigator.prototype.vibrate; }catch(e){}
  if(/Macintosh/.test(navigator.userAgent)){ Object.defineProperty(navigator,'maxTouchPoints',{get:()=>5}); Object.defineProperty(navigator,'platform',{get:()=>'MacIntel'}); }
};
const dev=(w,h,dsf,ua)=>({viewport:{width:w,height:h},screen:{width:w,height:h},deviceScaleFactor:dsf,hasTouch:true,isMobile:true,userAgent:ua});
const PHONES=[['iPhone SE',375,667,2],['iPhone 15 Pro',393,852,3],['iPhone 15 Pro Max',430,932,3],['Android 360x800',360,800,3]];
const TABLETS=[['iPad portrait',768,1024,2],['iPad landscape',1024,768,2],['iPad Pro 11 portrait',834,1194,2],['iPad Pro 13 landscape',1366,1024,1]];

/* "whitest" pixel in the outer few pixels of a PNG screenshot (the highest of min(r,g,b)): a white bar reads ~255,
   while an orange or pink sky does not */
async function edgeMax(e,png){
  const ctx=await e.browser.newContext(); const q=await ctx.newPage();
  const v=await q.evaluate(async b64=>{
    const img=new Image(); img.src='data:image/png;base64,'+b64; await img.decode();
    const c=document.createElement('canvas'); c.width=img.width; c.height=img.height; const g=c.getContext('2d'); g.drawImage(img,0,0);
    const w=img.width,h=img.height,t=6; let m=0;
    const scan=(x,y,ww,hh)=>{ const d=g.getImageData(x,y,ww,hh).data; for(let i=0;i<d.length;i+=4) m=Math.max(m,Math.min(d[i],d[i+1],d[i+2])); };
    scan(0,0,w,t); scan(0,h-t,w,t); scan(0,0,t,h); scan(w-t,0,t,h); return m; },png.toString('base64'));
  await ctx.close(); return v;
}
const stageRect=p=>p.evaluate(()=>{ const r=document.getElementById('stage').getBoundingClientRect(); return {l:r.left,t:r.top,w:r.width,h:r.height}; });
const near=(a,b,tol=1.5)=>Math.abs(a-b)<=tol;

module.exports=[

['tall iPhones and Android phones: the game fills the whole screen, the page behind it is solid dark (never white), no sideways scroll', async(e,L)=>{
  for(const [name,w,h,dsf] of PHONES){
    const p=await L.open(e,{ctx:dev(w,h,dsf,IPHONE_UA),init:iosInit}); await p.waitForTimeout(400);
    const r=await stageRect(p), info=await p.evaluate(()=>({tablet:__sr.tablet,ios:__sr.IS_IOS,z:__sr.uiZ,
      bg:getComputedStyle(document.documentElement).backgroundColor,bodyBg:getComputedStyle(document.body).backgroundColor,scheme:getComputedStyle(document.documentElement).colorScheme,
      sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight}));
    assert.deepEqual([r.l,r.t,r.w,r.h].map(Math.round),[0,0,w,h],`${name}: the stage covers the whole screen`);
    assert.equal(info.tablet,false,`${name}: a phone is not a tablet`); assert.equal(info.ios,true); assert.equal(info.z,1);
    assert.equal(info.bg,'rgb(20, 16, 43)',`${name}: html has a solid dark background colour`); assert.equal(info.bodyBg,'rgb(20, 16, 43)');
    assert.equal(info.scheme,'dark',`${name}: color-scheme is dark`);
    assert.ok(info.sw<=w && info.sh<=h,`${name}: nothing scrolls`);
    assert.ok(await edgeMax(e,await p.screenshot())<200,`${name}: no white/bright bars along the screen edges`);
    assert.deepEqual(p.errs,[],name); await L.close(p);
  }
}],

['a phone turned sideways is asked to rotate back (the game is portrait)', async(e,L)=>{
  const p=await L.open(e,{ctx:dev(932,430,3,IPHONE_UA),init:iosInit}); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(()=>getComputedStyle(document.getElementById('rotate')).display),'flex');
  assert.equal(await p.evaluate(()=>__sr.tablet),false); await L.close(p);
}],

['iPad and other tablets: detected (iPadOS says "Mac" but has touch), centred column no wider than 3:4, UI scaled up, edges never white', async(e,L)=>{
  for(const [name,w,h,dsf] of TABLETS){
    const p=await L.open(e,{ctx:dev(w,h,dsf,IPAD_UA),init:iosInit}); await p.waitForTimeout(400);
    const r=await stageRect(p), info=await p.evaluate(()=>({tablet:__sr.tablet,ipad:__sr.IS_IPAD,z:__sr.uiZ,u:__sr.u,W:__sr.W,cls:document.body.className,rot:getComputedStyle(document.getElementById('rotate')).display,
      sw:document.documentElement.scrollWidth,bg:getComputedStyle(document.documentElement).backgroundColor}));
    const sw=Math.min(w,.75*h);
    assert.equal(info.tablet,true,`${name}: detected as a tablet`); assert.equal(info.ipad,true,`${name}: detected as an iPad`); assert.match(info.cls,/tablet/); assert.match(info.cls,/ios/);
    assert.ok(near(r.w,sw)&&near(r.l,(w-sw)/2)&&near(r.t,0)&&near(r.h,h),`${name}: stage ${JSON.stringify(r)} should be a ${sw}px column centred on the screen`);
    assert.ok(info.z>=1&&info.z<=1.5,`${name}: UI scale ${info.z}`); assert.ok(info.u>1.25,`${name}: blocks are scaled up (u=${info.u})`);
    assert.notEqual(info.rot,'flex',`${name}: tablets are never asked to rotate`); assert.ok(info.sw<=w,`${name}: no sideways scroll`);
    assert.equal(info.bg,'rgb(20, 16, 43)');
    assert.ok(await edgeMax(e,await p.screenshot())<200,`${name}: no white/bright bars along the screen edges`);
    assert.deepEqual(p.errs,[],name); await L.close(p);
  }
}],

['iPad: the whole game is playable at tablet size (menu, a run with perfects, a miss, settings) and buttons stay comfortably large', async(e,L)=>{
  for(const [name,w,h,dsf] of [TABLETS[0],TABLETS[1]]){
    const p=await L.open(e,{ctx:dev(w,h,dsf,IPAD_UA),init:iosInit});
    await p.evaluate(()=>{ __sr.S.coins=300; __sr.S.assist='off'; __sr.startMode('classic'); }); await p.waitForTimeout(200);
    assert.equal(await L.perfects(p,8),8,`${name}: 8 perfects`);
    assert.equal(await p.evaluate(()=>__sr.shield),true);
    const hud=await p.evaluate(()=>{ const r=document.getElementById('pauseBtn').getBoundingClientRect(); return {w:r.width,h:r.height}; });
    assert.ok(hud.w>=48&&hud.h>=48,`${name}: pause button is ${hud.w}x${hud.h}`);
    await L.miss(p); await L.miss(p); await p.waitForTimeout(1400);
    assert.equal(await p.evaluate(()=>__sr.state),'over');
    await p.click('#toMenu'); await p.click('#openSettings'); await p.waitForTimeout(400);
    assert.ok(await p.isVisible('[data-set=language]'));
    assert.deepEqual(p.errs,[],name); await L.close(p);
  }
}],

['button ripples land under the finger on the scaled tablet UI', async(e,L)=>{
  const p=await L.open(e,{ctx:dev(768,1024,2,IPAD_UA),init:iosInit}); await p.waitForTimeout(400);
  assert.ok(await p.evaluate(()=>__sr.uiZ)>1.2,'UI is scaled');
  const r=await p.evaluate(()=>{ const b=document.getElementById('openSettings'), q=b.getBoundingClientRect();
    b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:q.left+q.width/2,clientY:q.top+q.height/2}));
    const rip=b.querySelector('.rip'); return {x:parseFloat(rip.style.left),y:parseFloat(rip.style.top),w:b.offsetWidth,h:b.offsetHeight}; });
  assert.ok(near(r.x,r.w/2,3)&&near(r.y,r.h/2,3),`ripple at ${r.x},${r.y} in a ${r.w}x${r.h} button`); await L.close(p);
}],

['iPhone and iPad have no vibration, so the Vibration setting is hidden there (and shown where it works)', async(e,L)=>{
  const ios=await L.open(e,{ctx:dev(430,932,3,IPHONE_UA),init:iosInit});
  assert.equal(await ios.evaluate(()=>__sr.HAS_VIBRATE),false); await ios.click('#openSettings'); await ios.waitForTimeout(300);
  assert.equal(await ios.isVisible('[data-set=haptics]'),false,'no Vibration row on iOS'); assert.ok(await ios.isVisible('[data-set=sound]'));
  await L.close(ios);
  const droid=await L.open(e,{ctx:{viewport:{width:360,height:800},hasTouch:true,isMobile:true}});
  assert.equal(await droid.evaluate(()=>__sr.HAS_VIBRATE),true); await droid.click('#openSettings'); await droid.waitForTimeout(300);
  assert.ok(await droid.isVisible('[data-set=haptics]'),'Vibration row on Android'); await L.close(droid);
}],

['notch and home-indicator safe areas: HUD and nav bar stay clear of them while the stage still covers the whole screen', async(e,L)=>{
  const p=await L.open(e,{ctx:dev(430,932,3,IPHONE_UA),init:iosInit});
  const cdp=await p.context().newCDPSession(p);
  try{ await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top:59,bottom:34,left:0,right:0}}); }
  catch(err){ console.log('      (safe-area emulation not available in this Chromium, skipped)'); await L.close(p); return; }
  await p.waitForTimeout(300);
  const nav=await p.evaluate(()=>{ const n=document.querySelector('.navbar'), q=n.getBoundingClientRect(); return {bottom:q.bottom,pad:parseFloat(getComputedStyle(n).paddingBottom)}; });
  assert.ok(nav.pad>=34+8-1,`nav bar bottom padding ${nav.pad} clears the 34px home indicator`);
  const head=await p.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('.mhead')).paddingTop)); assert.ok(head>=59+12-1,`menu header top padding ${head} clears the 59px notch`);
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(200);
  const top=await p.evaluate(()=>document.getElementById('hud').getBoundingClientRect().top); assert.ok(top>=59,`in-game HUD starts at ${top}, below the notch`);
  const r=await stageRect(p); assert.deepEqual([r.l,r.t,r.w,r.h].map(Math.round),[0,0,430,932],'the stage still reaches every edge');
  assert.ok(await edgeMax(e,await p.screenshot())<200,'no bright bars at the edges with safe areas on'); await L.close(p);
}],

['iOS launch images: every iPhone/iPad size has a dark startup image of exactly the right pixel size (no white launch screen)', async()=>{
  const root=path.join(__dirname,'..'), html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const links=[...html.matchAll(/<link rel="apple-touch-startup-image" href="([^"]+)" media="\(device-width: (\d+)px\) and \(device-height: (\d+)px\) and \(-webkit-device-pixel-ratio: (\d)\) and \(orientation: (portrait|landscape)\)">/g)];
  assert.ok(links.length>=30,`${links.length} startup image links`);
  const have=new Set(links.map(m=>`${m[2]}x${m[3]}@${m[4]}/${m[5]}`));
  for(const want of ['430x932@3/portrait','393x852@3/portrait','440x956@3/portrait','768x1024@2/portrait','768x1024@2/landscape','1024x1366@2/landscape']) assert.ok(have.has(want),`missing ${want}`);
  for(const [,href,w,h,r,o] of links){
    const buf=fs.readFileSync(path.join(root,href)); assert.equal(buf.toString('latin1',1,4),'PNG',href);
    const exp=o==='portrait'?[w*r,h*r]:[h*r,w*r]; assert.deepEqual([buf.readUInt32BE(16),buf.readUInt32BE(20)],exp,`${href} has the wrong pixel size`);
  }
}],

['desktop browsers keep the centred phone-sized window (not treated as a tablet)', async(e,L)=>{
  const p=await L.open(e,{ctx:{viewport:{width:1280,height:800}}}); await p.waitForTimeout(300);
  const r=await stageRect(p), info=await p.evaluate(()=>({tablet:__sr.tablet,z:__sr.uiZ,rot:getComputedStyle(document.getElementById('rotate')).display}));
  assert.equal(info.tablet,false); assert.equal(info.z,1); assert.ok(near(r.w,520)&&near(r.l,380),`desktop stage ${JSON.stringify(r)}`);
  assert.equal(await edgeMax(e,await p.screenshot())<200,true); assert.deepEqual(p.errs,[]); await L.close(p);
}],

];
