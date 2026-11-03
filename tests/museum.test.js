/* The tower museum: the best tower of each mode, drawn again the way it looked (theme, block style, colours, scenery, topper), shareable as a picture. */
const assert=require('assert');

const quiet=p=>p.evaluate(()=>{ const s=__sr; s.S.tutSeen=true; s.S.assist='off'; s.S.seenTip=true; for(const m of Object.keys(s.MODES)) s.S.tips[m]=1; });
const toastHas=(p,txt,ms=10000)=>p.waitForFunction(t=>{ const el=document.getElementById('toast'); return el.classList.contains('show') && el.textContent.includes(t); },txt,{timeout:ms});
/* a saved best tower with n blocks on top of the base */
const tower=(n,extra={})=>Object.assign({score:n*4,blocks:Array.from({length:n+1},(_,i)=>({x:.12+(i%4)*.03,w:.7-(i%3)*.04})),scores:Array.from({length:n+1},(_,i)=>i*4)},extra);
const put=(p,g)=>p.evaluate(g=>{ for(const [m,v] of Object.entries(g)) __sr.S.ghosts[m]=v; },g);
/* how many different colours a picture (data URL or canvas) really has: a blank picture has one or two */
const colours=(p,src)=>p.evaluate(src=>new Promise(res=>{ const im=new Image(); im.onload=()=>{ const c=document.createElement('canvas'); c.width=im.naturalWidth; c.height=im.naturalHeight; const g=c.getContext('2d'); g.drawImage(im,0,0); const d=g.getImageData(0,0,c.width,c.height).data, set=new Set(); for(let i=0;i<d.length;i+=28) set.add((d[i]>>4)<<8|(d[i+1]>>4)<<4|(d[i+2]>>4)); res({w:c.width,h:c.height,n:set.size}); }; im.onerror=()=>res(null); im.src=src; }),src);
const SHARE=()=>{ window.__shared=null; navigator.canShare=()=>true; navigator.share=async d=>{ if(window.__cancel) throw Object.assign(new Error('cancel'),{name:'AbortError'}); if(window.__fail) throw new Error('boom'); window.__shared={url:d.url,text:d.text,name:d.files[0].name,type:d.files[0].type,size:d.files[0].size}; }; };

module.exports=[

['museum: reached from Awards; with nothing saved it says so; Back returns to Awards', async(e,L)=>{
  const p=await L.open(e); await quiet(p);
  await p.click('#openAwards'); await p.waitForTimeout(450); assert.ok(await p.isVisible('#openMuseum'),'a Tower museum button on Awards'); assert.match(await p.textContent('#openMuseum'),/Tower museum/);
  await p.click('#openMuseum'); await p.waitForTimeout(450);
  assert.ok(await p.isVisible('#museum')); assert.equal(await p.isVisible('#awards'),false); assert.equal(await p.locator('#mList .mu').count(),0);
  assert.match(await p.textContent('#mList'),/Play a round to put a tower on display\./);
  await p.click('#closeMuseum'); await p.waitForTimeout(450); assert.ok(await p.isVisible('#awards')); assert.equal(await p.isVisible('#museum'),false);
  await p.click('#closeAwards'); await p.waitForTimeout(300); assert.ok(await p.isVisible('#menu'));
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['museum: a real round puts its tower on display with its score, height and date', async(e,L)=>{
  const p=await L.open(e); await quiet(p);
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(150); await L.perfects(p,5); await L.miss(p); await p.waitForTimeout(1400);
  const gh=await p.evaluate(()=>{ const g=__sr.S.ghosts.classic; return {score:g.score,n:g.blocks.length,th:g.th,ts:g.ts,tp:g.tp,st:g.st}; });
  assert.equal(gh.n,6); assert.equal(gh.th,await p.evaluate(()=>__sr.S.theme),'it remembers the theme it was built in'); assert.ok(Math.abs(gh.ts-Date.now())<60000,'and when'); assert.equal(gh.tp,'none'); assert.equal(gh.st,'auto');
  await p.click('#toMenu'); await p.click('#openAwards'); await p.click('#openMuseum'); await p.waitForTimeout(500);
  assert.equal(await p.locator('#mList .mu').count(),1);
  const card=await p.textContent('#mList .mu'); assert.match(card,/Classic/); assert.ok(card.includes(String(gh.score)),'the score'); assert.match(card,/\b5\b/,'5 layers on top of the base'); assert.match(card,/\d{4}/,'a date with a year');
  const src=await p.getAttribute('#mList .mu img','src'); assert.match(src,/^data:image\/png/); const c=await colours(p,src); assert.ok(c.w>=300 && c.h>=300 && c.n>=8,`a real picture ${c.w}x${c.h} with ${c.n} colours`);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['museum: one card per mode that has a tower (Classic, Timed Rush, Lives, Hazard), the others are not shown, and every picture is different', async(e,L)=>{
  const p=await L.open(e); await quiet(p);
  await put(p,{classic:tower(9),timed:tower(14,{th:'neon'}),lives:tower(20,{th:'ocean'}),hazard:tower(6,{th:'sunset'}),zen:tower(30),daily:tower(30),campaign:tower(30),practice:tower(30)});
  await p.evaluate(()=>__sr.showMuseum()); await p.waitForTimeout(500);
  assert.deepEqual(await p.locator('#mList .mu b').allTextContents(),['Classic','Timed Rush','Lives','Hazard'],'in this order, nothing else');
  const srcs=await p.locator('#mList .mu img').evaluateAll(a=>a.map(i=>i.src)); assert.equal(new Set(srcs).size,4,'four different pictures');
  assert.deepEqual((await p.locator('#mList .mu span').allTextContents()).map(x=>x.split('·').slice(0,2).map(y=>y.trim()).join('|')),['36|9','56|14','80|20','24|6'],'score and layers on each card');
  assert.equal(await p.locator('#mList .mu .btn').count(),4,'each has a Share button');
  await put(p,{classic:{score:3,blocks:[{x:.1,w:.5},{x:.1,w:.5}],scores:[0,3]}}); await p.evaluate(()=>__sr.renderMuseum());
  assert.equal(await p.locator('#mList .mu b').filter({hasText:'Classic'}).count(),0,'a tower of one or two blocks is not worth a card');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['museum: the picture shows the tower the way it looked: the theme, a block style, a colour set, the scenery and a topper each change it', async(e,L)=>{
  const p=await L.open(e); await quiet(p);
  const shot=async x=>{ await put(p,{classic:tower(12,x)}); await p.evaluate(()=>{ __sr.renderMuseum(); }); return p.getAttribute('#mList .mu img','src'); };
  const plain=await shot({th:'sunset'}), pics=new Set([plain]);
  for(const x of [{th:'neon'},{th:'sunset',st:'glass'},{th:'sunset',st:'pixel'},{th:'sunset',pl:'mono'},{th:'sunset',pl:'frost'},{th:'sunset',sc:'neon'},{th:'sunset',tp:'black'},{th:'sunset',tp:'flag'},{th:'sunset',tp:'star'}]){
    const ids=await p.evaluate(x=>({st:x.st&&!!__sr.SHOP.style[x.st],pl:x.pl&&!!__sr.SHOP.palette[x.pl],sc:x.sc&&!!__sr.THEMES[x.sc],tp:x.tp&&!!__sr.SHOP.topper[x.tp]}),x);
    for(const k of Object.keys(ids)) if(x[k]!==undefined) assert.ok(ids[k],`${JSON.stringify(x)} names something that exists`);
    const src=await shot(x); assert.ok(!pics.has(src),JSON.stringify(x)+' draws a picture of its own'); pics.add(src);
  }
  const c=await colours(p,await shot({th:'sunset',tp:'star'})); assert.ok(c.n>=8);
  const cur=await p.evaluate(()=>__sr.S.theme); assert.equal(await shot({}),await shot({th:cur}),'a tower saved before looks were recorded is drawn in the current theme');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['museum: Share sends a 1080x1350 picture with the score; without a share sheet the picture is saved; cancelling is quiet, a failure says so', async(e,L)=>{
  const p=await L.open(e,{init:SHARE}); await quiet(p);
  await put(p,{classic:tower(11,{th:'neon',tp:'orange'}),lives:tower(7)});
  const dims=await p.evaluate(()=>{ const c=__sr.makeTowerCanvas('classic'); return {w:c.width,h:c.height,url:c.toDataURL()}; }); assert.deepEqual([dims.w,dims.h],[1080,1350]);
  const col=await colours(p,dims.url); assert.ok(col.n>=12,`a full picture (${col.n} colours)`);
  await p.evaluate(()=>__sr.showMuseum()); await p.waitForTimeout(500);
  await p.click('#mList .mu:nth-child(1) .btn'); await p.waitForFunction(()=>window.__shared,null,{timeout:8000});
  let sh=await p.evaluate(()=>window.__shared); assert.equal(sh.name,'stack-rush-tower.png'); assert.equal(sh.type,'image/png'); assert.ok(sh.size>8000,'a real image ('+sh.size+' bytes)');
  assert.match(sh.text,/I scored 44 in Stack Rush \(Classic\)! Can you beat it\?/,'the score of THAT tower'); assert.equal(sh.url,`http://127.0.0.1:${e.port}/index.html`);
  await p.evaluate(()=>{ window.__shared=null; }); await p.click('#mList .mu:nth-child(2) .btn'); await p.waitForFunction(()=>window.__shared,null,{timeout:8000});
  assert.match(await p.evaluate(()=>window.__shared.text),/I scored 28 in Stack Rush \(Lives\)!/,'the second card shares the second tower');
  await p.evaluate(()=>{ window.__cancel=true; window.__shared=null; }); await p.click('#mList .mu:nth-child(1) .btn'); await p.waitForTimeout(700);
  assert.equal(await p.evaluate(()=>/Could not/.test(document.getElementById('toast').textContent)&&document.getElementById('toast').classList.contains('show')),false,'cancelling the share sheet is not an error');
  await p.evaluate(()=>{ window.__cancel=false; window.__fail=true; }); await p.click('#mList .mu:nth-child(1) .btn'); await toastHas(p,'Could not share');
  await p.evaluate(()=>{ window.__fail=false; navigator.canShare=undefined; });
  const dl=p.waitForEvent('download'); await p.click('#mList .mu:nth-child(1) .btn'); const d=await dl; assert.equal(d.suggestedFilename(),'stack-rush-tower.png'); await toastHas(p,'Image saved');
  assert.deepEqual(p.errs.filter(x=>!/boom/.test(x)),[]); await L.close(p);
}],

['museum: a hostile save cannot inject anything (look names are checked against the real ones, the date is a number)', async(e,L)=>{
  const evil=JSON.stringify({ghosts:{classic:{score:5,blocks:Array.from({length:8},()=>({x:.2,w:.6})),scores:[0,1,2,3,4,5,6,7],th:'<img src=x onerror=alert(1)>',st:'__proto__',pl:{a:1},sc:'constructor',tp:['black'],ts:'yesterday'},
    lives:{score:9,blocks:Array.from({length:8},()=>({x:.2,w:.6})),scores:[0,1,2,3,4,5,6,7],th:'neon',st:'glass',pl:'frost',sc:'neon',tp:'star',ts:1.7e12},zen:{score:1}}});
  const p=await L.open(e,{setup:async pg=>{ await pg.addInitScript(raw=>{ if(!localStorage.getItem('stackrush.v2')) localStorage.setItem('stackrush.v2',raw); },evil); }});
  const got=await p.evaluate(()=>{ const g=__sr.S.ghosts; return {classic:{th:g.classic.th,st:g.classic.st,pl:g.classic.pl,sc:g.classic.sc,tp:g.classic.tp,ts:g.classic.ts},lives:{th:g.lives.th,st:g.lives.st,pl:g.lives.pl,sc:g.lives.sc,tp:g.lives.tp,ts:g.lives.ts},zen:!!g.zen}; });
  assert.deepEqual(got.classic,{th:'',st:'',pl:'',sc:'',tp:'',ts:0},'junk names become "nothing recorded", junk dates 0'); assert.deepEqual(got.lives,{th:'neon',st:'glass',pl:'frost',sc:'neon',tp:'star',ts:1.7e12},'real ones are kept'); assert.equal(got.zen,false);
  await p.evaluate(()=>__sr.showMuseum()); await p.waitForTimeout(500);
  assert.equal(await p.locator('#mList .mu').count(),2); assert.equal(await p.locator('#mList img[src^="data:image/png"]').count(),2); assert.equal(await p.locator('#mList img[onerror], #mList script').count(),0);
  assert.ok(!/yesterday|NaN|Invalid/.test(await p.textContent('#mList')),'no strange date text');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

];
