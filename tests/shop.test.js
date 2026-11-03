/* The shop (cosmetics, boosts, coin packs), the boosters inside a round, and the purchase plumbing.
   No real money is involved anywhere: the Google Play side runs against a fake store that follows how the Digital Goods API is
   documented. That proves OUR logic (grant once, consume / acknowledge, restore, prices); it does not prove the real store works. */
const assert=require('assert');
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..');

const toastHas=(p,txt,ms=14000)=>p.waitForFunction(t=>{ const el=document.getElementById('toast'); return el.classList.contains('show') && el.textContent.includes(t); },txt,{timeout:ms});
const stock=(p,boosts,pick)=>p.evaluate(([b,k])=>{ const S=__sr.S; Object.assign(S.shop.boosts,b); S.shop.pick=k; S.assist='off'; for(const m of Object.keys(__sr.MODES)) S.tips[m]=1; },[boosts,pick]);   // (first-time mode tips are marked as seen so their toasts do not queue up)
const inv=(p,id)=>p.evaluate(id=>__sr.S.shop.boosts[id],id);
const yest=()=>{ const d=new Date(); d.setDate(d.getDate()-1); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const ownAll=p=>p.evaluate(()=>{ const S=__sr.S; for(const sl of Object.keys(__sr.SHOP)) if(sl!=='scene') for(const id of Object.keys(__sr.SHOP[sl])) if(!__sr.SHOP[sl][id].free && !S.shop.owned.includes(sl+':'+id)) S.shop.owned.push(sl+':'+id); for(const id of Object.keys(__sr.THEMES)) if(!S.owned.includes(id)) S.owned.push(id); });

/* counts the sounds the game makes (oscillators and noise buffers) */
const SOUNDS=()=>{ const Real=window.AudioContext; window.__n=0;
  class AC extends Real{ createOscillator(){ window.__n++; return super.createOscillator(); } createBufferSource(){ window.__n++; return super.createBufferSource(); } }
  window.AudioContext=AC; window.webkitAudioContext=AC; };

/* A stand-in for Google Play inside the Android app: document.referrer says so, getDigitalGoodsService() returns a store with a
   list of purchases, PaymentRequest "buys" and records everything the game does with it. */
const PLAY=()=>{
  const st=window.__play={bought:[],consumed:[],acked:[],completed:[],shown:0,fail:null,owned:null,n:0};
  const ensure=()=>{ if(!st.owned) st.owned=(window.__preowned||[]).map(x=>Object.assign({},x)); };
  Object.defineProperty(document,'referrer',{get:()=>'android-app://com.example.stackrush',configurable:true});
  window.getDigitalGoodsService=async url=>{
    if(url!=='https://play.google.com/billing') throw new Error('unknown provider');
    const svc={
      getDetails:async ids=>ids.map(id=>({itemId:id,title:id,price:{currency:'EUR',value:'1.19'}})),
      listPurchases:async()=>{ ensure(); if(st.fail==='list') throw new Error('offline'); return st.owned.map(x=>({itemId:x.itemId,purchaseToken:x.purchaseToken})); },
      consume:async tok=>{ if(st.fail==='consume') throw new Error('network'); st.consumed.push(tok); ensure(); st.owned=st.owned.filter(x=>x.purchaseToken!==tok); },
      acknowledge:async(tok,type)=>{ st.acked.push([tok,type]); }
    };
    if(window.__noAck) delete svc.acknowledge;
    return svc;
  };
  window.PaymentRequest=class{
    constructor(methods){ this.sku=methods[0].data.sku; }
    async show(){
      ensure(); if(st.fail==='cancel') throw new DOMException('cancelled','AbortError');
      st.shown++; await new Promise(r=>setTimeout(r,20)); const tok='tok'+(++st.n); st.owned.push({itemId:this.sku,purchaseToken:tok}); st.bought.push(this.sku);
      return {details:{purchaseToken:tok},complete:async r=>{ st.completed.push(r); }};
    }
  };
};
const play=p=>p.evaluate(()=>JSON.parse(JSON.stringify(window.__play)));

module.exports=[

/* ---------------------------------------------------------------- the shop */

['shop: every tab shows the right cards with names and buttons; the Coins tab is a preview until a web store exists', async(e,L)=>{
  const p=await L.open(e);
  await p.evaluate(()=>{ __sr.S.coins=500; });
  await p.click('#openThemes');
  const want=await p.evaluate(()=>{ const n=o=>Object.keys(o).length, sr=__sr; return {
    themes:[n(sr.THEMES),0], blocks:[n(sr.SHOP.style),0], colors:[n(sr.SHOP.palette),0], scenes:[sr.S.owned.length+1,0],
    sounds:[n(sr.SHOP.sfx)+n(sr.SHOP.music),0], extras:[n(sr.SHOP.fx)+n(sr.SHOP.topper)+n(sr.SHOP.accent),0], boosts:[0,n(sr.BOOSTS)], coins:[4,2] }; });
  const tabs=await p.evaluate(()=>__sr.TABS.map(t=>t[0]));
  assert.deepEqual(tabs,Object.keys(want),'the test knows every tab');
  for(const id of tabs){
    await p.evaluate(id=>__sr.setTab(id),id); await p.waitForTimeout(60);
    const got=await p.evaluate(()=>({th:document.querySelectorAll('#tGrid .th').length,bst:document.querySelectorAll('#tGrid .bst').length,
      on:(document.querySelector('#tTabs .tab.on')||{dataset:{}}).dataset.tab,
      noName:[...document.querySelectorAll('#tGrid .th b,#tGrid .bst b')].filter(b=>!b.textContent.trim()||/^(auto|none|undefined|null)$/i.test(b.textContent.trim())).length,
      noLabel:[...document.querySelectorAll('#tGrid button')].filter(b=>!b.textContent.trim()&&!b.querySelector('svg')).length,
      raw:/undefined|NaN|\[object/.test(document.getElementById('tGrid').textContent)}));
    assert.deepEqual([got.th,got.bst],want[id],`${id}: cards (.th, .bst)`);
    assert.equal(got.on,id,`${id}: the tab is highlighted`); assert.equal(got.noName,0,`${id}: every card has a name`);
    assert.equal(got.noLabel,0,`${id}: every button has a label`); assert.ok(!got.raw,`${id}: no undefined / NaN on the screen`);
  }
  assert.ok(await p.isVisible('#tTabs [data-tab=coins]'),'with no store set up the Coins tab is shown (as a preview)');
  await p.evaluate(()=>{ __sr.SQUARE_LINKS.gold='https://example.com/pay'; __sr.setTab('coins'); });
  assert.equal(await p.locator('#tTabs [data-tab=coins]').count(),0,'coins are Android-only: the tab goes away once a web store exists');
  assert.equal(await p.evaluate(()=>__sr.tab),'themes','and the screen falls back to Themes');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['shop: buying with coins spends exactly the price, equips the item, cannot be repeated and survives a reload; too few coins and premium items change nothing', async(e,L)=>{
  const p=await L.open(e);
  await p.evaluate(()=>{ __sr.S.coins=1000; });
  await p.click('#openThemes'); await p.evaluate(()=>__sr.setTab('blocks'));
  const flat=p.locator('#tGrid [data-act=buy][data-slot=style][data-id=flat]');
  assert.match((await flat.textContent()).trim(),/300/,'the price is on the button');
  await flat.click(); await p.waitForTimeout(150);
  const state=()=>p.evaluate(()=>({c:__sr.S.coins,own:__sr.S.shop.owned.slice(),eq:__sr.S.shop.equip.style}));
  assert.deepEqual(await state(),{c:700,own:['style:flat'],eq:'flat'});
  assert.equal(await p.locator('#tGrid [data-act=buy][data-id=flat]').count(),0,'a bought item has no buy button');
  assert.equal(await p.evaluate(()=>__sr.itemAction('buy','style','flat')),false,'buying it twice is refused');
  assert.equal((await state()).c,700,'and costs nothing');
  await p.evaluate(()=>{ __sr.S.coins=10; });
  assert.equal(await p.evaluate(()=>__sr.itemAction('buy','style','glass')),false); await toastHas(p,'Need');
  assert.deepEqual(await state(),{c:10,own:['style:flat'],eq:'flat'},'too few coins: nothing changes');
  await p.evaluate(()=>__sr.setTab('blocks'));
  const foil=p.locator('#tGrid [data-act=iap][data-slot=style][data-id=foil]');
  assert.match((await foil.textContent()).trim(),/\$0\.99/); await foil.click(); await toastHas(p,'not connected');
  assert.deepEqual(await state(),{c:10,own:['style:flat'],eq:'flat'},'a premium item without a connected store changes nothing');
  await p.locator('#tGrid [data-act=equip][data-slot=style][data-id=classic]').click();
  assert.equal((await state()).eq,'classic','free items equip any time');
  await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('ready'));
  assert.deepEqual(await state(),{c:10,own:['style:flat'],eq:'classic'},'all of it survives a reload');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['shop: previewing never spends, buys or equips anything, and closing the preview puts the look back', async(e,L)=>{
  const p=await L.open(e);
  await p.evaluate(()=>{ __sr.S.coins=900; });
  await p.click('#openThemes'); await p.evaluate(()=>__sr.setTab('blocks'));
  const snap=()=>p.evaluate(()=>JSON.stringify(__sr.S));
  const before=await snap(), style0=await p.evaluate(()=>__sr.look.style);
  await p.click('#tGrid .sw[data-slot=style][data-id=neon]'); await p.waitForTimeout(150);
  assert.equal(await p.evaluate(()=>__sr.previewId),'neon'); assert.equal(await p.evaluate(()=>__sr.look.style),'neon','the game draws the previewed style');
  assert.ok(await p.isVisible('#peek'),'the preview bar is shown'); assert.match(await p.textContent('#peekName'),/Neon/);
  await p.click('#peekClose'); await p.waitForTimeout(100);
  assert.equal(await p.evaluate(()=>__sr.previewId),null); assert.equal(await p.evaluate(()=>__sr.look.style),style0,'the look is back');
  assert.equal(await snap(),before,'nothing in the save changed');
  await p.evaluate(()=>__sr.setTab('themes')); await p.click('#tGrid .sw[data-id=lava]'); await p.waitForTimeout(150);
  assert.deepEqual(await p.evaluate(()=>__sr.look.bg),await p.evaluate(()=>__sr.THEMES.lava.bg),'a previewed theme shows its scenery');
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  assert.equal(await p.evaluate(()=>__sr.previewId),null,'Escape closes the preview'); assert.equal(await snap(),before);
  // buying from inside the preview
  await p.evaluate(()=>__sr.setTab('colors')); await p.click('#tGrid .sw[data-slot=palette][data-id=rainbow]'); await p.waitForTimeout(100);
  await p.click('#peekAct'); await p.waitForTimeout(150);
  assert.deepEqual(await p.evaluate(()=>({c:__sr.S.coins,eq:__sr.S.shop.equip.palette,open:__sr.previewId})),{c:500,eq:'rainbow',open:null},'the preview bar buys and equips, then closes');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['shop: a hostile or corrupt save never breaks the game (junk dropped, numbers clamped, the Starter pack stays owned)', async(e,L)=>{
  const evil='{"coins":"NaN","shop":{"owned":["style:foil","__proto__:hasOwnProperty","constructor:x",5,null,"style:flat","product:starter","scene:sunset","topper:gold:extra","style:"],'
   +'"equip":{"style":"foil","palette":"__proto__","scene":"nope","sfx":{},"music":"chiptune","fx":null,"topper":"gold","accent":"ocean"},'
   +'"boosts":{"shield":"9999999","slow":-4,"regrow":"x"},"pick":["shield","shield","slow","regrow","__proto__"],"gift":"yes","tokens":["ok",5,"'+'x'.repeat(500)+'","two"]},'
   +'"boostBests":{"classic":"12","zen":-1,"__proto__":{"x":1}}}';
  const p=await L.open(e,{setup:async pg=>{ await pg.addInitScript(raw=>{ localStorage.setItem('stackrush.v2',raw); },evil); }});
  const got=await p.evaluate(()=>{ const S=__sr.S; return {coins:S.coins,owned:S.shop.owned,equip:S.shop.equip,boosts:S.shop.boosts,pick:S.shop.pick,gift:S.shop.gift,tokens:S.shop.tokens,bb:S.boostBests}; });
  assert.equal(got.coins,0,'garbage coins become 0');
  assert.deepEqual(got.owned,['style:foil','style:flat','product:starter'],'only real item keys survive ("product:starter" is the Starter pack marker)');
  assert.deepEqual(got.equip,{style:'foil',palette:'auto',scene:'auto',sfx:'classic',music:'classic',fx:'sparkle',topper:'none',accent:'sunset'},'unowned or invalid choices fall back to the defaults');
  assert.deepEqual(got.boosts,{shield:999,slow:0,regrow:0,time:0},'counts are clamped to 0..999');
  assert.deepEqual(got.pick,['shield','slow'],'at most two real boosts, no repeats'); assert.equal(got.gift,true);
  assert.deepEqual(got.tokens,['ok','two'],'only reasonable purchase tokens are kept'); assert.deepEqual(got.bb,{classic:12,zen:0});
  await p.click('#openThemes');
  for(const id of await p.evaluate(()=>__sr.TABS.map(t=>t[0]))){ await p.evaluate(id=>__sr.setTab(id),id); }
  await p.click('#closeThemes'); await p.click('#play',{force:true}); await p.waitForTimeout(300);
  await L.perfects(p,2); assert.equal(await p.evaluate(()=>__sr.state),'playing','and the game plays on');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['shop: every block style, color set, scenery, landing effect, tower topper and app color draws in a live round', async(e,L)=>{
  const p=await L.open(e); await ownAll(p);
  await p.evaluate(()=>{ __sr.S.assist='off'; __sr.startMode('zen'); }); await p.waitForTimeout(150);          // Zen: nothing can end the round
  await L.perfects(p,2);
  const lists=await p.evaluate(()=>({style:Object.keys(__sr.SHOP.style),palette:Object.keys(__sr.SHOP.palette),scene:['auto',...Object.keys(__sr.THEMES)],topper:Object.keys(__sr.SHOP.topper),accent:Object.keys(__sr.SHOP.accent),fx:Object.keys(__sr.SHOP.fx)}));
  const inkOk=()=>p.evaluate(()=>{ const c=document.getElementById('c'), g=c.getContext('2d'), seen=new Set();
    for(let y=0;y<c.height;y+=Math.max(1,c.height>>5)) for(let x=0;x<c.width;x+=Math.max(1,c.width>>5)){ const d=g.getImageData(x,y,1,1).data; seen.add((d[0]>>4)+','+(d[1]>>4)+','+(d[2]>>4)); }
    return seen.size; });
  for(const sl of ['style','palette','scene','topper','accent']) for(const id of lists[sl]){
    assert.equal(await p.evaluate(([sl,id])=>__sr.itemAction('equip',sl,id),[sl,id]),true,`${sl}:${id} equips`);
    await p.waitForTimeout(60);
    const look=await p.evaluate(()=>({style:__sr.look.style,h0:__sr.look.h0,bg:__sr.look.bg}));
    if(sl==='style' && id!=='auto') assert.equal(look.style,id,`style ${id} reaches the painter`);
    if(sl==='palette' && id!=='auto') assert.equal(look.h0,await p.evaluate(id=>__sr.SHOP.palette[id].h0,id),`palette ${id} reaches the painter`);
    if(sl==='scene' && id!=='auto') assert.deepEqual(look.bg,await p.evaluate(id=>__sr.THEMES[id].bg,id),`scene ${id} reaches the painter`);
    assert.ok(await inkOk()>3,`${sl}:${id}: the canvas is not blank`);
  }
  for(const id of lists.fx){ await p.evaluate(id=>__sr.itemAction('equip','fx',id),id); await L.perfects(p,1); }
  assert.equal(await p.evaluate(()=>__sr.state),'playing');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['shop: every sound pack and music style makes sound', async(e,L)=>{
  const p=await L.open(e,{init:SOUNDS}); await ownAll(p);
  const n=()=>p.evaluate(()=>window.__n);
  await p.click('#openThemes'); await p.evaluate(()=>__sr.setTab('sounds'));
  for(const id of ['classic','retro','soft']){
    const a=await n(); await p.click(`#tGrid .sw[data-slot=sfx][data-id=${id}]`); await p.waitForTimeout(750);
    assert.ok((await n())-a>=3,`sound pack ${id}: previewing it plays the land + perfect sounds (${a} -> ${await n()})`); await p.click('#peekClose');
  }
  await p.click('#closeThemes'); await p.waitForTimeout(200);
  assert.ok(await p.evaluate(()=>__sr.musicOn),'music is on');
  for(const id of ['classic','chill','chiptune']){
    await p.evaluate(id=>__sr.itemAction('equip','music',id),id); await p.waitForTimeout(150);
    const a=await n(); await p.waitForTimeout(4200);
    assert.ok((await n())-a>=3,`music style ${id} plays notes (${a} -> ${await n()})`);
  }
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

/* ---------------------------------------------------------------- boosters in a round */

['boosts: Shield starts the round armed, is used up only when it really saves you (miss or bomb), and quitting costs nothing', async(e,L)=>{
  const p=await L.open(e); await stock(p,{shield:2},['shield']);
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(150);
  assert.deepEqual(await p.evaluate(()=>({shield:__sr.shield,armed:!!__sr.armed.shield,boosted:__sr.boosted})),{shield:true,armed:true,boosted:false},'armed at the start');
  assert.equal(await inv(p,'shield'),2,'nothing used up yet');
  assert.match(await p.evaluate(()=>document.getElementById('aux').innerHTML),/i-shield/,'the HUD shows the shield');
  await p.evaluate(()=>__sr.pause()); await p.click('#quit');
  assert.equal(await inv(p,'shield'),2,'quitting a round with an unused boost keeps it');
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(150);
  await L.perfects(p,2); await L.miss(p);
  assert.deepEqual(await p.evaluate(()=>({shield:__sr.shield,boosted:__sr.boosted,state:__sr.state})),{shield:false,boosted:true,state:'playing'},'the shield saved the miss');
  assert.equal(await inv(p,'shield'),1,'exactly one shield was used up');
  await L.perfects(p,1); await L.miss(p);
  assert.equal(await p.evaluate(()=>__sr.state),'over','the next miss ends the run');
  assert.equal(await inv(p,'shield'),1,'and nothing more is used up');
  const r=await p.evaluate(()=>({real:__sr.S.bests.classic||0,best:__sr.S.best,boost:__sr.S.boostBests.classic||0,ghost:!!__sr.S.ghosts.classic,mh:__sr.S.maxHeight,score:__sr.score}));
  assert.ok(r.score>0 && r.boost===r.score,'the boosted run keeps its own record'); assert.deepEqual([r.real,r.best,r.ghost,r.mh],[0,0,false,0],'and leaves the real best, ghost and height record alone');
  await p.waitForTimeout(1100); assert.match(await p.textContent('#oBest'),/Boosted run/);
  // a bomb
  await p.click('#toMenu'); await stock(p,{shield:1},['shield']);                    // (returning to the menu after the first game also brings the one-time welcome gift)
  await p.evaluate(()=>__sr.startMode('hazard')); await p.waitForTimeout(150);
  await L.perfects(p,1); await p.evaluate(()=>__sr.bombNext()); await L.perfects(p,1);
  const bomb=await L.act(p,L.BOMB,6000); assert.equal(bomb,'ok','a bomb arrived'); await p.waitForTimeout(200);
  assert.deepEqual(await p.evaluate(()=>({lives:__sr.lives,shield:__sr.shield,state:__sr.state})),{lives:3,shield:false,state:'playing'},'the shield defused the bomb: no life lost');
  assert.equal(await inv(p,'shield'),0);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['boosts: Slow-Mo waits until the speed has picked up, then slows 6 drops to ×0.6 and uses exactly one', async(e,L)=>{
  const p=await L.open(e); await stock(p,{slow:2},['slow']);
  const first=await p.evaluate(()=>{ __sr.startMode('classic'); for(let n=1;n<200;n++) if(__sr.rampOf(n)>=1.5) return n; return -1; });
  assert.ok(first>=10 && first<=20,`with the real settings Slow-Mo starts at block ${first}, about where the speed passes x1.5`);
  await p.evaluate(()=>{ __sr.CFG.rampStart=0; __sr.CFG.rampTau=3; __sr.startMode('classic'); }); await p.waitForTimeout(150);   // (make the ramp quick so the test is fast)
  assert.deepEqual(await p.evaluate(()=>({armed:!!__sr.armed.slow,left:__sr.slowLeft})),{armed:true,left:0});
  assert.match(await p.evaluate(()=>document.getElementById('aux').innerHTML),/i-hourglass/,'the HUD shows the armed boost');
  await L.perfects(p,1);
  assert.deepEqual(await p.evaluate(()=>({left:__sr.slowLeft,boosted:__sr.boosted,armed:!!__sr.armed.slow})),{left:6,boosted:true,armed:false},'it kicked in');
  assert.equal(await inv(p,'slow'),1,'one used up');
  const a=await p.evaluate(()=>({sp:__sr.sp,n:__sr.stackLen}));
  for(let i=0;i<6;i++) await L.perfects(p,1);
  const b=await p.evaluate(()=>({sp:__sr.sp,n:__sr.stackLen,left:__sr.slowLeft}));
  assert.equal(b.left,0,'6 drops later it is over');
  const ramp=await p.evaluate(([x,y])=>__sr.rampOf(y)/__sr.rampOf(x),[a.n,b.n]);
  assert.ok(Math.abs((b.sp/a.sp)/ramp-1/0.6)<0.08,`speed jumped back by ~1/0.6 (measured ${((b.sp/a.sp)/ramp).toFixed(2)})`);
  await L.perfects(p,2); assert.deepEqual(await p.evaluate(()=>({left:__sr.slowLeft,inv:__sr.S.shop.boosts.slow})),{left:0,inv:1},'it does not trigger twice in one round');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['boosts: Regrow restores the full width when the tower is thin, at most twice a round, one boost each time', async(e,L)=>{
  const p=await L.open(e); await stock(p,{regrow:3},['regrow']);
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(150);
  await L.perfects(p,1); assert.equal(await inv(p,'regrow'),3,'a healthy tower does not use it');
  const width=()=>p.evaluate(()=>({w:__sr.top.w,base:__sr.baseW}));
  for(const [n,left] of [[1,2],[2,1]]){
    await p.evaluate(()=>__sr.forceNarrow()); await L.perfects(p,1);
    const w=await width(); assert.ok(Math.abs(w.w-w.base)<0.6,`regrow #${n}: back to full width (${w.w.toFixed(1)} / ${w.base.toFixed(1)})`);
    assert.equal(await inv(p,'regrow'),left,`regrow #${n}: one used up`); assert.equal(await p.evaluate(()=>__sr.regrowUsed),n);
  }
  await p.evaluate(()=>__sr.forceNarrow()); await L.perfects(p,1);
  const w=await width(); assert.ok(w.w<w.base*0.55,'a third time in one round does not'); assert.equal(await inv(p,'regrow'),1);
  assert.equal(await p.evaluate(()=>__sr.state),'playing'); assert.deepEqual(p.errs,[]); await L.close(p);
}],

['boosts: they are off in Daily Twist, Zen and Practice; the Boosts sheet picks at most two and says why when it is off', async(e,L)=>{
  const p=await L.open(e); await stock(p,{shield:2,slow:2,regrow:2},['shield','slow']);
  for(const m of ['daily','zen','practice']){
    await p.evaluate(m=>__sr.startMode(m),m); await p.waitForTimeout(120);
    assert.deepEqual(await p.evaluate(()=>({armed:Object.keys(__sr.armed).length,shield:__sr.shield})),{armed:0,shield:false},`${m}: no boost is armed`);
    await p.evaluate(()=>__sr.pause()); await p.click('#quit');
  }
  for(const m of ['classic','timed','lives','hazard']){
    await p.evaluate(m=>__sr.startMode(m),m); await p.waitForTimeout(100);
    assert.equal(await p.evaluate(()=>!!__sr.armed.shield&&!!__sr.armed.slow),true,`${m}: both picked boosts are armed`);
    await p.evaluate(()=>__sr.pause()); await p.click('#quit');
  }
  await p.evaluate(()=>__sr.startStage(1)); await p.waitForTimeout(100);
  assert.equal(await p.evaluate(()=>!!__sr.armed.shield),true,'campaign stages allow boosts'); await p.evaluate(()=>__sr.pause()); await p.click('#quit');
  assert.equal(await inv(p,'shield'),2,'none of this used anything up');
  // the sheet
  await p.evaluate(()=>{ __sr.S.shop.pick=[]; __sr.S.lastMode='classic'; __sr.renderMenu(); });
  assert.equal((await p.textContent('#boostN')).trim(),'0');
  await p.click('#openBoosts'); await p.waitForTimeout(250);
  assert.equal(await p.locator('#boostList .bpick').count(),4);
  await p.click('#boostList [data-boost=shield]'); await p.click('#boostList [data-boost=slow]');
  assert.deepEqual(await p.evaluate(()=>__sr.S.shop.pick),['shield','slow']); assert.equal((await p.textContent('#boostN')).trim(),'2');
  await p.click('#boostList [data-boost=regrow]'); await toastHas(p,'Pick up to 2');
  assert.deepEqual(await p.evaluate(()=>__sr.S.shop.pick),['shield','slow'],'a third pick is refused');
  await p.click('#boostList [data-boost=shield]'); assert.deepEqual(await p.evaluate(()=>__sr.S.shop.pick),['slow'],'tapping a picked boost drops it');
  await p.keyboard.press('Escape'); await p.waitForTimeout(150); assert.equal(await p.isVisible('#boosts'),false,'Escape closes the sheet');
  await p.evaluate(()=>{ __sr.S.lastMode='zen'; }); await p.click('#openBoosts'); await p.waitForTimeout(200);
  assert.match(await p.textContent('#boostNote'),/Daily Twist or Zen/,'the sheet explains when boosts do not work');
  await p.click('#boostDone'); assert.deepEqual(p.errs,[]); await L.close(p);
}],

['boosts: a boosted run has its own best; it leaves the ghost, height/combo records and height/combo awards alone; Revive undoes it with the rest', async(e,L)=>{
  // control: the same 5-perfect streak WITHOUT a boost earns the "In the Zone" award
  const c=await L.open(e); await c.evaluate(()=>{ __sr.S.assist='off'; __sr.startMode('classic'); }); await c.waitForTimeout(100);
  await L.perfects(c,12); assert.equal(await c.evaluate(()=>__sr.S.ach.c5),1,'control: an unboosted 5-streak earns the award'); await L.close(c);
  const p=await L.open(e); await p.evaluate(()=>{ __sr.S.coins=500; });
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(100);
  await L.perfects(p,3); await L.miss(p); await p.waitForTimeout(1000);
  const real=await p.evaluate(()=>({best:__sr.S.bests.classic,ghost:__sr.S.ghosts.classic&&__sr.S.ghosts.classic.score,mh:__sr.S.maxHeight,bc:__sr.S.bestCombo}));
  assert.ok(real.best>0 && real.ghost===real.best && real.mh===3,'the normal run set the real records');
  await stock(p,{shield:1},['shield']); await p.click('#toMenu'); await p.evaluate(()=>{ __sr.S.ach={}; __sr.S.coins=500; __sr.startMode('classic'); }); await p.waitForTimeout(100);
  await L.perfects(p,1); await L.miss(p); await L.perfects(p,5);                          // the shield is used on the miss; then a 5-streak
  assert.equal(await p.evaluate(()=>__sr.boosted),true);
  assert.equal(await p.evaluate(()=>__sr.S.ach.c5||0),0,'a boosted run does not earn combo awards');
  await L.miss(p); await p.waitForTimeout(1000);
  const after=await p.evaluate(()=>({best:__sr.S.bests.classic,ghost:__sr.S.ghosts.classic.score,mh:__sr.S.maxHeight,bc:__sr.S.bestCombo,boost:__sr.S.boostBests.classic,score:__sr.score}));
  assert.deepEqual([after.best,after.ghost,after.mh,after.bc],[real.best,real.ghost,real.mh,real.bc],'real best, ghost, max height and best combo are untouched');
  assert.ok(after.boost>after.best && after.boost===after.score,`the boosted record is separate and higher (${after.boost} vs ${after.best})`);
  assert.ok(await p.isVisible('#revive'),'Revive is offered'); await p.click('#revive'); await p.waitForTimeout(250);
  assert.equal(await p.evaluate(()=>__sr.state),'playing');
  assert.equal(await p.evaluate(()=>__sr.S.boostBests.classic||0),0,'Revive takes the boosted record back too');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['boosts: the welcome gift comes once, and streak days 3, 5 and 7 each bring one boost', async(e,L)=>{
  const p=await L.open(e);
  await p.evaluate(()=>__sr.showMenu());
  assert.deepEqual(await p.evaluate(()=>__sr.S.shop.boosts),{shield:0,slow:0,regrow:0,time:0},'no gift before the first game');
  await p.evaluate(()=>{ __sr.S.played=1; __sr.showMenu(); });
  assert.deepEqual(await p.evaluate(()=>__sr.S.shop.boosts),{shield:1,slow:1,regrow:1,time:1},'one of each after the first game'); await toastHas(p,'Welcome gift');
  await p.evaluate(()=>__sr.showMenu()); assert.deepEqual(await p.evaluate(()=>__sr.S.shop.boosts),{shield:1,slow:1,regrow:1,time:1},'only once');
  await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(300);
  assert.deepEqual(await p.evaluate(()=>__sr.S.shop.boosts),{shield:1,slow:1,regrow:1,time:1},'and not again after a reload');
  const y=yest(), got={};
  for(let day=1;day<=10;day++){
    await p.evaluate(([d,y])=>{ const S=__sr.S; S.streak=d-1; S.lastClaim=d===1?'':y; S.shop.boosts={shield:0,slow:0,regrow:0,time:0}; __sr.renderMenu(); },[day,y]);
    await p.click('#dailyCard [data-act=claim]'); await p.waitForTimeout(80);
    const b=await p.evaluate(()=>__sr.S.shop.boosts), s=await p.evaluate(()=>__sr.S.streak);
    assert.equal(s,day,`streak day ${day}`); got[day]=Object.entries(b).filter(([,n])=>n).map(([k,n])=>k+n).join('');
  }
  assert.deepEqual(got,{1:'',2:'',3:'shield1',4:'',5:'slow1',6:'',7:'regrow1',8:'',9:'',10:'shield1'},'3 -> Shield, 5 -> Slow-Mo, 7 -> Regrow, then the week repeats');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['boosts: coins buy them in ones and threes, and a boost is never bought without enough coins', async(e,L)=>{
  const p=await L.open(e); await p.evaluate(()=>{ __sr.S.coins=700; });
  const st=()=>p.evaluate(()=>({c:__sr.S.coins,b:Object.assign({},__sr.S.shop.boosts)}));
  assert.equal(await p.evaluate(()=>__sr.boostAction('shield',1)),true); assert.deepEqual(await st(),{c:580,b:{shield:1,slow:0,regrow:0,time:0}});
  assert.equal(await p.evaluate(()=>__sr.boostAction('slow',3)),true); assert.deepEqual(await st(),{c:180,b:{shield:1,slow:3,regrow:0,time:0}});
  assert.equal(await p.evaluate(()=>__sr.boostAction('regrow',1)),false); await toastHas(p,'Need'); assert.deepEqual(await st(),{c:180,b:{shield:1,slow:3,regrow:0,time:0}},'too few coins: nothing happens');
  assert.equal(await p.evaluate(()=>__sr.boostAction('nope',1)),false);
  await p.click('#openThemes'); await p.evaluate(()=>__sr.setTab('boosts'));
  assert.match(await p.textContent('#tGrid'),/You have 3/); assert.deepEqual(p.errs,[]); await L.close(p);
}],

/* ---------------------------------------------------------------- purchases */

['store: with no store connected a purchase says so and changes nothing; a Square link is followed for cosmetics only', async(e,L)=>{
  const p=await L.open(e); const snap=()=>p.evaluate(()=>JSON.stringify(__sr.S));
  const before=await snap();
  for(const key of ['style:foil','topper:gold','gold','galaxy','cyber','coins_s','starter']){
    assert.equal(await p.evaluate(k=>__sr.buyIap(k),key),false,`${key}`); await toastHas(p,'not connected');
  }
  assert.equal(await snap(),before,'nothing changed');
  await p.evaluate(origin=>{ __sr.SQUARE_LINKS['style:foil']=origin+'/privacy.html'; },`http://127.0.0.1:${e.port}`);
  await p.click('#openThemes'); await p.evaluate(()=>__sr.setTab('blocks'));
  await Promise.all([p.waitForURL('**/privacy.html'),p.click('#tGrid [data-act=iap][data-slot=style][data-id=foil]')]);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['store: every product has a legal, unique Google Play id, and android/README.md lists them all', async(e,L)=>{
  const p=await L.open(e); const keys=await p.evaluate(()=>__sr.iapKeys().map(k=>[k,__sr.skuOf(k)]));
  assert.equal(keys.length,10,`${keys.length} products: 4 coin packs, the Starter pack, 3 premium themes, 2 premium cosmetics`);
  const skus=keys.map(k=>k[1]); assert.equal(new Set(skus).size,skus.length,'ids are unique');
  for(const s of skus) assert.match(s,/^[a-z][a-z0-9_]{2,39}$/,`${s} is a legal Play product id`);
  const doc=fs.readFileSync(path.join(root,'android/README.md'),'utf8');
  for(const [k,s] of keys) assert.ok(doc.includes('`'+s+'`'),`android/README.md lists ${s} (${k})`);
  for(const k of ['coins_s','coins_m','coins_l','coins_xl']) assert.equal(await p.evaluate(k=>__sr.isCoinPack(k),k),true,`${k} is a consumable coin pack`);
  for(const k of ['starter','gold','style:foil','topper:gold']) assert.equal(await p.evaluate(k=>__sr.isCoinPack(k),k),false,`${k} is bought once`);
  await L.close(p);
}],

['store: granting a product gives exactly what it promises (and nothing for unknown or coin-priced keys); the Starter pack can be bought once and stays owned', async(e,L)=>{
  const p=await L.open(e); const S=()=>p.evaluate(()=>JSON.parse(JSON.stringify({c:__sr.S.coins,b:__sr.S.shop.boosts,own:__sr.S.shop.owned,eq:__sr.S.shop.equip,th:__sr.S.owned,theme:__sr.S.theme})));
  const c0=(await S()).c;
  assert.equal(await p.evaluate(()=>__sr.grantProduct('coins_l')),true); assert.equal((await S()).c,c0+4000);
  assert.equal(await p.evaluate(()=>__sr.grantProduct('starter')),true);
  let s=await S(); assert.equal(s.c,c0+5000); assert.deepEqual(s.b,{shield:2,slow:2,regrow:2,time:2}); assert.deepEqual(s.own.sort(),['product:starter','style:neon','topper:black']);
  await p.click('#openThemes'); await p.evaluate(()=>__sr.setTab('coins'));
  assert.match(await p.textContent('#tGrid [data-act=pack][data-id=starter]'),/Owned/); assert.ok(await p.locator('#tGrid [data-act=pack][data-id=starter]').isDisabled(),'the Starter pack button is off once owned');
  await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('ready'));
  await p.click('#openThemes'); await p.evaluate(()=>__sr.setTab('coins'));
  assert.ok(await p.locator('#tGrid [data-act=pack][data-id=starter]').isDisabled(),'still owned after a reload');
  assert.equal(await p.evaluate(()=>__sr.grantProduct('gold')),true); s=await S(); assert.ok(s.th.includes('gold')&&s.theme==='gold','a premium theme is owned and worn');
  assert.equal(await p.evaluate(()=>__sr.grantProduct('topper:gold')),true); s=await S(); assert.ok(s.own.includes('topper:gold')&&s.eq.topper==='gold');
  const snap=JSON.stringify(await S());
  for(const k of ['style:neon','style:classic','scene:lava','nope','constructor','__proto__','toString','style:','',null,undefined,7]) assert.equal(await p.evaluate(k=>__sr.grantProduct(k),k),false,`grantProduct(${String(k)}) is refused`);
  assert.equal(JSON.stringify(await S()),snap,'and changed nothing'); assert.deepEqual(p.errs,[]); await L.close(p);
}],

['store: a Google Play purchase grants once, consumes coin packs, acknowledges the rest; a double tap buys once; a cancel or an app that closed early cannot double-grant', async(e,L)=>{
  const p=await L.open(e,{init:PLAY});
  assert.equal(await p.evaluate(()=>__sr.inPlayApp()),true,'the page knows it runs inside the Android app');
  const c0=await p.evaluate(()=>__sr.S.coins);
  await p.evaluate(()=>__sr.buyIap('coins_m')); await p.waitForFunction(()=>window.__play.completed.length===1);
  let r=await p.evaluate(()=>({coins:__sr.S.coins,tokens:__sr.S.shop.tokens.slice()})), pl=await play(p);
  assert.equal(r.coins,c0+1800); assert.deepEqual(pl.consumed,r.tokens,'the coin pack was consumed'); assert.deepEqual(pl.completed,['success']);
  await p.evaluate(()=>__sr.buyIap('style:foil')); await p.waitForFunction(()=>window.__play.completed.length===2);
  r=await p.evaluate(()=>({own:__sr.S.shop.owned.includes('style:foil'),eq:__sr.S.shop.equip.style})); pl=await play(p);
  assert.deepEqual(r,{own:true,eq:'foil'}); assert.equal(pl.acked.length,1,'a one-time item is acknowledged'); assert.equal(pl.acked[0][1],'onetime'); assert.deepEqual(pl.bought,['item_coins_m','item_style_foil']);
  // double tap
  const shown=pl.shown; await p.evaluate(()=>{ __sr.buyIap('coins_s'); __sr.buyIap('coins_s'); }); await p.waitForFunction(()=>window.__play.completed.length===3);
  assert.equal((await play(p)).shown,shown+1,'two quick taps start one purchase');
  // cancel
  await p.evaluate(()=>{ window.__play.fail='cancel'; }); const c1=await p.evaluate(()=>__sr.S.coins);
  await p.evaluate(()=>__sr.buyIap('coins_l')); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(()=>__sr.S.coins),c1,'a cancelled purchase grants nothing');
  // consume fails (offline): granted once, still listed by Google; the next start-up sync consumes it WITHOUT granting again
  await p.evaluate(()=>{ window.__play.fail='consume'; });
  await p.evaluate(()=>__sr.buyIap('coins_s')); await p.waitForFunction(()=>window.__play.completed.length===4);
  assert.equal(await p.evaluate(()=>__sr.S.coins),c1+600); const consumedBefore=(await play(p)).consumed.length;
  await p.evaluate(()=>{ window.__play.fail=null; return __sr.syncPurchases(false); });
  pl=await play(p); assert.equal(await p.evaluate(()=>__sr.S.coins),c1+600,'no second grant'); assert.equal(pl.consumed.length,consumedBefore+1,'but it is consumed now');
  assert.deepEqual(pl.owned.filter(x=>x.itemId.startsWith('item_coins')),[],'Google no longer lists any unconsumed coin pack');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['store: restoring gives back what Google lists without changing what you wear, adds an unconsumed coin pack once, and a failing store only shows a message', async(e,L)=>{
  const p=await L.open(e,{init:PLAY,setup:pg=>pg.context().addInitScript(()=>{ window.__preowned=[{itemId:'item_style_foil',purchaseToken:'t1'},{itemId:'item_gold',purchaseToken:'t2'},{itemId:'item_coins_s',purchaseToken:'t3'},{itemId:'item_unknown_thing',purchaseToken:'t4'}]; })});
  await p.waitForTimeout(500);          // the start-up sync ran by itself
  const r=await p.evaluate(()=>({own:__sr.S.shop.owned.slice(),eq:__sr.S.shop.equip.style,th:__sr.S.owned.includes('gold'),theme:__sr.S.theme,coins:__sr.S.coins,tokens:__sr.S.shop.tokens.slice()}));
  assert.ok(r.own.includes('style:foil')&&r.th,'the cosmetic and the theme are back'); assert.equal(r.eq,'auto','but the player keeps what they wear'); assert.equal(r.theme,'sunset');
  assert.equal(r.coins,600,'the paid-for, unconsumed coin pack arrives once'); assert.deepEqual(r.tokens.sort(),['t1','t2','t3']);
  assert.deepEqual((await play(p)).consumed,['t3'],'and is consumed');
  await p.click('#openThemes'); await p.evaluate(()=>__sr.setTab('coins')); await p.click('#tGrid [data-act=restore]'); await toastHas(p,'Nothing to restore');
  assert.equal(await p.evaluate(()=>__sr.S.coins),600,'restoring again grants nothing more');
  await p.evaluate(()=>{ window.__play.fail='list'; }); await p.click('#tGrid [data-act=restore]'); await toastHas(p,'Could not restore');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['store: prices come from Google Play in the player\'s currency, the Coins tab works inside the app even with a web store, and an app without acknowledge() still works', async(e,L)=>{
  const p=await L.open(e,{init:PLAY}); await p.waitForTimeout(400);
  await p.evaluate(()=>{ __sr.SQUARE_LINKS.gold='https://example.com/pay'; });
  await p.click('#openThemes'); await p.evaluate(()=>__sr.setTab('coins'));
  assert.equal(await p.evaluate(()=>__sr.tab),'coins','inside the app the Coins tab stays');
  const labels=await p.evaluate(()=>[...document.querySelectorAll('#tGrid [data-act=pack]')].map(b=>b.textContent.trim()));
  assert.equal(labels.length,5); for(const l of labels) assert.match(l,/€1\.19/,'every pack shows the price Google reported');
  await p.evaluate(()=>__sr.setTab('themes')); assert.match(await p.textContent('#tGrid [data-act=iap][data-id=gold]'),/€1\.19/);
  assert.deepEqual(p.errs,[]); await L.close(p);
  const q=await L.open(e,{init:PLAY,setup:pg=>pg.context().addInitScript(()=>{ window.__noAck=true; })});          // a Digital Goods service without acknowledge()
  await q.evaluate(()=>__sr.buyIap('topper:gold')); await q.waitForFunction(()=>window.__play.completed.length===1);
  assert.deepEqual(await q.evaluate(()=>({own:__sr.S.shop.owned.includes('topper:gold'),acked:window.__play.acked.length,done:window.__play.completed})),{own:true,acked:0,done:['success']},'still granted and completed, no crash, when acknowledge() does not exist');
  assert.deepEqual(q.errs,[]); await L.close(q);
}],

['store: inside the Android app without Play Billing nothing ever opens an outside checkout', async(e,L)=>{
  const p=await L.open(e,{init:()=>{ Object.defineProperty(document,'referrer',{get:()=>'android-app://com.example.stackrush',configurable:true}); }});
  assert.deepEqual(await p.evaluate(()=>[__sr.inAndroidApp(),__sr.inPlayApp(),__sr.coinsTabOn()]),[true,false,false],'in the app, but no Play Billing: no Coins tab');
  await p.evaluate(()=>{ __sr.SQUARE_LINKS['style:foil']=location.origin+'/privacy.html'; });
  assert.equal(await p.evaluate(()=>__sr.buyIap('style:foil')),false); await toastHas(p,'not connected'); await p.waitForTimeout(400);
  assert.ok(!p.url().includes('privacy.html'),'the page did not navigate to the web checkout'); assert.deepEqual(p.errs,[]); await L.close(p);
}],

['store: a Square return address unlocks premium cosmetics (honour system) and nothing else', async(e,L)=>{
  const tryKey=async key=>{ const p=await L.open(e); await p.goto(`http://127.0.0.1:${e.port}/index.html?unlock=${encodeURIComponent(key)}#debug`); await p.waitForFunction(()=>document.body.classList.contains('ready'));
    const r=await p.evaluate(()=>({own:__sr.S.shop.owned.slice(),th:__sr.S.owned.slice(),theme:__sr.S.theme,eq:__sr.S.shop.equip.style+'/'+__sr.S.shop.equip.topper})); assert.deepEqual(p.errs,[]); await L.close(p); return r; };
  let r=await tryKey('style:foil'); assert.deepEqual(r.own,['style:foil']); assert.match(r.eq,/^foil/);
  r=await tryKey('gold'); assert.ok(r.th.includes('gold')&&r.theme==='gold');
  for(const k of ['style:flat','style:neon','coins_s','starter','constructor','__proto__','scene:lava','topper:orange']){ r=await tryKey(k); assert.deepEqual(r.own,[],`?unlock=${k} unlocks nothing`); assert.equal(r.theme,'sunset'); }
}],

['boosts: Extra Time gives 30 more seconds when the clock runs out in Timed Rush, only there, one boost each, and only when it really saves the run', async(e,L)=>{
  const p=await L.open(e); await stock(p,{time:2},['time']);
  for(const m of ['classic','lives','hazard','daily','zen']){ await p.evaluate(m=>__sr.startMode(m),m); await p.waitForTimeout(80); assert.equal(await p.evaluate(()=>!!__sr.armed.time),false,`${m}: Extra Time is a Timed Rush boost`); await p.evaluate(()=>__sr.pause()); await p.click('#quit'); }
  assert.equal(await inv(p,'time'),2,'nothing was used up');
  await p.evaluate(()=>__sr.startMode('timed')); await p.waitForTimeout(150);
  assert.deepEqual(await p.evaluate(()=>({armed:!!__sr.armed.time,t:__sr.timeLeft,cfg:__sr.CFG.timedExtra})),{armed:true,t:30,cfg:30},'armed at the start of Timed Rush, which starts at 30 seconds');
  assert.match(await p.evaluate(()=>document.getElementById('aux').textContent),/\+30s/,'the HUD shows it is armed');
  await L.perfects(p,1);                                                                  // starts the clock
  await p.evaluate(()=>__sr.setTime(0.15)); await p.waitForTimeout(700);
  assert.deepEqual(await p.evaluate(()=>({state:__sr.state,boosted:__sr.boosted,armed:!!__sr.armed.time})),{state:'playing',boosted:true,armed:false},'the clock ran out and the run carries on');
  const t=await p.evaluate(()=>__sr.timeLeft); assert.ok(t>28 && t<=30,`about 30 seconds on the clock again (${t})`); assert.equal(await inv(p,'time'),1,'one used up');
  await p.evaluate(()=>__sr.setTime(0.15)); await p.waitForTimeout(1500);
  assert.equal(await p.evaluate(()=>__sr.state),'over','without another armed boost the next time-out ends the run'); assert.equal((await p.textContent('#oLabel')).trim(),"TIME'S UP"); assert.equal(await inv(p,'time'),1,'and uses nothing');
  assert.match(await p.textContent('#oBest'),/Boosted run/);
  // a miss that empties the clock is rescued the same way
  await p.click('#toMenu'); await stock(p,{time:1},['time']); await p.evaluate(()=>__sr.startMode('timed')); await p.waitForTimeout(150);
  await L.perfects(p,1); await p.evaluate(()=>__sr.setTime(2)); await L.miss(p);
  assert.deepEqual(await p.evaluate(()=>({state:__sr.state,t:Math.round(__sr.timeLeft)})),{state:'playing',t:30},'a -3s miss on an almost empty clock is rescued too'); assert.equal(await inv(p,'time'),0);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['economy: a round pays floor(score/5) + floor(perfects/2) coins, and the prices are the ones in the table', async(e,L)=>{
  const p=await L.open(e);
  await p.evaluate(()=>{ for(const a of __sr.ACH) __sr.S.ach[a.id]=1; __sr.S.assist='off'; __sr.S.coins=0; __sr.S.tutSeen=true; for(const k of Object.keys(__sr.MODES)) __sr.S.tips[k]=1; __sr.startMode('classic'); });
  await p.waitForTimeout(150); await L.perfects(p,6); await L.miss(p); await p.waitForTimeout(1200);
  const r=await p.evaluate(()=>({coins:__sr.S.coins,score:__sr.score})); const perfects=6;
  assert.equal(r.coins,Math.floor(r.score/5)+Math.floor(perfects/2),`score ${r.score} and ${perfects} perfects pay ${r.coins} coins`);
  const price=await p.evaluate(()=>({flat:__sr.SHOP.style.flat.coins,glass:__sr.SHOP.style.glass.coins,neon:__sr.SHOP.style.neon.coins,pixel:__sr.SHOP.style.pixel.coins,rainbow:__sr.SHOP.palette.rainbow.coins,retro:__sr.SHOP.sfx.retro.coins,chill:__sr.SHOP.music.chill.coins,confetti:__sr.SHOP.fx.confetti.coins,black:__sr.SHOP.topper.black.coins,flag:__sr.SHOP.topper.flag.coins,star:__sr.SHOP.topper.star.coins,ocean:__sr.SHOP.accent.ocean.coins,
    candy:__sr.THEMES.candy.unlock.n,desert:__sr.THEMES.desert.unlock.n,lava:__sr.THEMES.lava.unlock.n,sakura:__sr.THEMES.sakura.unlock.n,winter:__sr.THEMES.winter.unlock.n,flower:__sr.THEMES.flower.unlock.n,
    shield:__sr.BOOSTS.shield.price,slow:__sr.BOOSTS.slow.price,regrow:__sr.BOOSTS.regrow.price,time:__sr.BOOSTS.time.price,revive:__sr.CFG.reviveCost}));
  assert.deepEqual(price,{flat:300,glass:800,neon:1000,pixel:600,rainbow:400,retro:300,chill:400,confetti:400,black:600,flag:800,star:1000,ocean:300,candy:300,desert:500,lava:600,sakura:700,winter:800,flower:1400,shield:[120,300],slow:[160,400],regrow:[200,500],time:[180,450],revive:60});
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['music builds with the combo: the level climbs with a perfect streak, adds notes, and falls back after a miss', async(e,L)=>{
  const p=await L.open(e,{init:SOUNDS}); const n=()=>p.evaluate(()=>window.__n);
  await p.click('#play',{force:true}); await p.evaluate(()=>{ __sr.S.assist='off'; }); await p.waitForTimeout(500);
  assert.equal(await p.evaluate(()=>__sr.musicLevel),0,'no streak, plain music'); const a0=await n(); await p.waitForTimeout(3000); const calm=(await n())-a0;
  await L.perfects(p,17); await p.waitForTimeout(700);
  const lvl=await p.evaluate(()=>__sr.musicLevel); assert.ok(lvl>.6,`a long streak lifts the level (${lvl.toFixed(2)})`);
  const a1=await n(); await p.waitForTimeout(3000); const busy=(await n())-a1;
  assert.ok(busy>=calm+8,`the busy music has many more notes in 3 s (${calm} -> ${busy})`);
  await L.miss(p); await p.waitForTimeout(3500);
  assert.ok(await p.evaluate(()=>__sr.musicLevel)<.15,'after a miss the music settles back down');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],


['boosts: a boost that runs out leaves the pick list, so the two-boost limit holds and a reload never drops the wrong pick (found by the monkey in CI)', async(e,L)=>{
  const p=await L.open(e); await stock(p,{shield:1,slow:1,regrow:1,time:0},['shield','slow']);
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(150); await L.perfects(p,2); await L.miss(p); await p.waitForTimeout(500);   // the Shield saves the miss and is used up
  assert.equal(await inv(p,'shield'),0); assert.deepEqual(await p.evaluate(()=>__sr.S.shop.pick),['slow'],'the used-up Shield is no longer picked');
  await p.evaluate(()=>{ __sr.pause(); }); await p.click('#quit'); await p.waitForTimeout(300);
  await p.click('#openBoosts'); await p.click('#boostList [data-boost=regrow]'); assert.deepEqual(await p.evaluate(()=>__sr.S.shop.pick),['slow','regrow'],'two picks again');
  await p.evaluate(()=>{ __sr.S.shop.pick=['shield','slow']; });                                                         // a stale pick of something you no longer have (an old save, or any other way in)
  await p.click('#boostList [data-boost=regrow]'); assert.deepEqual(await p.evaluate(()=>__sr.S.shop.pick),['slow','regrow'],'the stale one is cleaned out first, so the pick fits');
  await p.click('#boostDone'); await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(300);
  assert.deepEqual(await p.evaluate(()=>__sr.S.shop.pick),['slow','regrow'],'and a reload keeps exactly what you picked');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

];
