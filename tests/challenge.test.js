/* Friend challenges: a link carries the mode, the score, the round's seed and the friend's tower. The friend plays the same bombs at the same heights,
   without boosts and timing assist, and is told who won. Links come from strangers, so parsing is strict. */
const assert=require('assert');

const quiet=p=>p.evaluate(()=>{ const s=__sr; s.S.tutSeen=true; s.S.assist='off'; s.S.seenTip=true; for(const m of Object.keys(s.MODES)) s.S.tips[m]=1; });
const parse=(p,c)=>p.evaluate(c=>__sr.parseChallenge(c),c);
const toastHas=(p,txt,ms=14000)=>p.waitForFunction(t=>{ const el=document.getElementById('toast'); return el.classList.contains('show') && el.textContent.includes(t); },txt,{timeout:ms});
/* opens the game the way a friend's link does: .../index.html?c=...#debug */
async function viaLink(e,L,c,o={}){
  const p=await L.open(e,Object.assign({seen:false},o)); await p.goto(`http://127.0.0.1:${e.port}/index.html?c=${c}#debug`); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(400);
  return p;
}
/* what the round showed first at every height: 1 = a bomb, 0 = anything else */
const bombs=async(L,p,upTo)=>{ const r=await L.climb(p,upTo); return Object.fromEntries(Object.entries(r.seen).map(([h,k])=>[h,k==='bomb'?1:0])); };

module.exports=[

['challenge: a good link is read; every odd, hostile or oversized one is refused', async(e,L)=>{
  const p=await L.open(e);
  assert.deepEqual(await parse(p,'classic.42.1234567'),{mode:'classic',score:42,seed:1234567,ghost:null,times:null,incs:null});
  assert.deepEqual((await parse(p,'hazard.00042.0')),{mode:'hazard',score:42,seed:0,ghost:null,times:null,incs:null},'leading zeros are fine');
  assert.equal((await parse(p,'timed.99999.2147483647')).seed,2147483647,'the largest seed and score');
  const code=Buffer.from([0,5,255,255,128,51]).toString('base64url');
  assert.deepEqual((await parse(p,'lives.7.5.'+code)).ghost,[{x:0,w:.02},{x:1,w:1},{x:128/255,w:.2}],'a tower: pairs of bytes, 0..255 -> 0..1 (a width is never below .02)');
  const bad=['','classic','classic.42','classic.42.1.2.3','zen.42.1','daily.42.1','campaign.42.1','practice.4.1','constructor.4.1','__proto__.4.1','toString.4.1','CLASSIC.4.1',
    'classic.0.1','classic.100000.1','classic.-4.1','classic.4.-1','classic.4.2147483648','classic.4.99999999999','classic.1e3.1','classic.4.1e3','classic.0x10.1','classic.4.0x10','classic. 4.1','classic.4. 1','classic.4.1 ','classic.NaN.1','classic.4.Infinity','classic.4.1.5','classic.4.1.!!!!','classic.4.1.abc','classic.4.1.abcd','classic.4.1.a_b-','classic.4.1.<script>alert(1)</script>',
    'classic.4.1.'+'A'.repeat(901),'classic.4.1.'+'A'.repeat(804),'classic.4.1.'+'A'.repeat(7),'classic.4.1.%41%41%41%41','javascript:alert(1)','http://evil.example/x.y.z','<img src=x onerror=alert(1)>.4.1'];
  for(const b of bad) assert.equal(await parse(p,b),null,JSON.stringify(b.slice(0,40))+' is refused');
  for(const junk of [null,undefined,0,5,{},[],true]) assert.equal(await p.evaluate(j=>__sr.parseChallenge(j),junk),null,'non-text input: '+JSON.stringify(junk));
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['challenge: a friend\'s link on a fresh install shows the challenge card, the address is cleaned, Accept plays that mode with that seed; Not now leaves it all alone', async(e,L)=>{
  const p=await viaLink(e,L,'classic.42.1234567');
  assert.ok(await p.isVisible('#chal'),'the card is shown'); assert.equal(await p.textContent('#chScore'),'42'); assert.match(await p.textContent('#chText'),/A friend scored 42 in Classic/);
  assert.match(await p.textContent('#chNote'),/Boosts and timing assist are off/);
  assert.equal(await p.evaluate(()=>location.search),'','the ?c=... is removed from the address (a reload does not open it again)'); assert.equal(await p.evaluate(()=>location.hash),'#debug');
  assert.equal(await p.isVisible('#menu'),false,'the menu is hidden behind the card');
  await p.click('#chNo'); await p.waitForTimeout(300); assert.ok(await p.isVisible('#menu')); assert.equal(await p.evaluate(()=>__sr.challenge),null);
  await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(300); assert.equal(await p.isVisible('#chal'),false,'a reload does not bring it back');
  await L.close(p);
  const q=await viaLink(e,L,'classic.42.1234567'); await q.click('#chGo'); await q.waitForTimeout(300);
  assert.deepEqual(await q.evaluate(()=>({state:__sr.state,mode:__sr.mode,seed:__sr.runSeed,ch:__sr.challenge.score})),{state:'playing',mode:'classic',seed:1234567,ch:42},'the friend\'s round: same mode, same seed');
  assert.match(await q.textContent('#ghostD'),/Beat 42/,'the HUD says what to beat'); assert.equal(await q.isVisible('#chal'),false);
  assert.deepEqual(q.errs,[]); await L.close(q);
}],

['challenge: a hostile link is ignored without a trace (no card, no error, address cleaned)', async(e,L)=>{
  for(const c of ['<script>alert(1)</script>.4.1','zen.4.1','classic.4.1.AAAAAAA','classic.0.0','%00','..','classic.4.1.'+'A'.repeat(2000)]){
    const p=await viaLink(e,L,encodeURIComponent(c)); assert.equal(await p.isVisible('#chal'),false,c.slice(0,30)+': no card'); assert.ok(await p.isVisible('#menu'),'the menu is there'); assert.equal(await p.evaluate(()=>location.search),'');
    assert.equal(await p.evaluate(()=>__sr.challenge),null); assert.deepEqual(p.errs,[],c.slice(0,30)); await L.close(p);
  }
}],

['challenge: a friend\'s round has no boosts and no timing assist, and says the same on the card; your own rounds keep both', async(e,L)=>{
  const p=await L.open(e); await quiet(p);
  await p.evaluate(()=>{ const S=__sr.S; S.assist='on'; S.played=0; S.boostAuto=true; Object.assign(S.shop.boosts,{shield:3,slow:3,regrow:3,time:3}); S.shop.pick=['shield','slow']; });     // (automatic boosts: the Shield is up from the start)
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(150);
  assert.deepEqual(await p.evaluate(()=>({assist:__sr.assistOn(),assisted:__sr.assisted,shield:!!__sr.armed.shield})),{assist:true,assisted:true,shield:true},'your own round: assist and the armed Shield');
  await p.evaluate(()=>{ __sr.showMenu(); __sr.startChallenge(__sr.parseChallenge('classic.30.5')); }); await p.waitForTimeout(150);
  assert.deepEqual(await p.evaluate(()=>({assist:__sr.assistOn(),assisted:__sr.assisted,armed:Object.keys(__sr.armed),held:__sr.held,boosted:__sr.boosted,shield:__sr.shield,tol:__sr.tolFactor()})),{assist:false,assisted:false,armed:[],held:[],boosted:false,shield:false,tol:1},'a challenge: strict timing, nothing armed, nothing in hand');
  const base=await p.evaluate(()=>__sr.W*0.42), sp=await p.evaluate(()=>__sr.sp); assert.ok(Math.abs(sp/base-1)<.02,`full speed (x${(sp/base).toFixed(2)})`);
  assert.deepEqual(await p.evaluate(()=>__sr.S.shop.boosts),{shield:3,slow:3,regrow:3,time:3},'and none of the boosts was touched');
  await p.evaluate(()=>{ __sr.pause(); }); await p.click('#quit'); await p.waitForTimeout(250); assert.equal(await p.evaluate(()=>__sr.challenge),null,'back at the menu: the challenge is over');
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(150); assert.equal(await p.evaluate(()=>__sr.assistOn()),true,'and your own rounds have their assist again');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['challenge: the luck of a round is a function of the seed and the height: the same bombs at the same heights, whatever you tapped on the way', async(e,L)=>{
  const p=await L.open(e); await quiet(p);
  const roll=(seed)=>p.evaluate(seed=>{ __sr.startChallenge({mode:'hazard',score:10,seed,ghost:null,times:null,incs:null}); return Array.from({length:3000},(_,h)=>__sr.rollAt(h)); },seed);
  const a=await roll(777), b=await roll(777), c=await roll(778);
  assert.deepEqual(a,b,'same seed, same luck'); assert.notDeepEqual(a,c,'another seed, another luck');
  assert.ok(a.every(x=>x>=0&&x<1),'always in [0,1)'); const mean=a.reduce((s,x)=>s+x,0)/a.length; assert.ok(Math.abs(mean-.5)<.03,`evenly spread (mean ${mean.toFixed(3)})`);
  const chance=await p.evaluate(()=>__sr.CFG.bombChance); const rate=a.filter(x=>x<chance).length/a.length; assert.ok(Math.abs(rate-chance)<.03,`bomb rate ${rate.toFixed(3)} ~ ${chance}`);
  let maxRun=0,run=0; for(const x of a){ run=x<chance?run+1:0; maxRun=Math.max(maxRun,run); } assert.ok(maxRun<=9,'no strange streaks');
  const corr=(()=>{ let s=0; for(let i=1;i<a.length;i++) s+=(a[i]-.5)*(a[i-1]-.5); return s/a.length/(1/12); })(); assert.ok(Math.abs(corr)<.06,`neighbouring heights are independent (r=${corr.toFixed(3)})`);
  // a seed with bombs early, then the real game: what the round shows at each height is exactly what the roll says
  const seed=await p.evaluate(chance=>{ for(let s=1;s<500;s++){ __sr.startChallenge({mode:'hazard',score:10,seed:s,ghost:null,times:null,incs:null}); const h=[]; for(let i=4;i<18;i++) if(__sr.rollAt(i)<chance) h.push(i); if(h.length>=2 && h.every((x,i)=>!i||x-h[i-1]>1)) return s; } return 0; },chance);
  assert.ok(seed>0,'found a seed with a couple of bombs below height 18');
  const want=await p.evaluate(([seed,chance])=>{ __sr.startChallenge({mode:'hazard',score:10,seed,ghost:null,times:null,incs:null}); return Array.from({length:18},(_,h)=>h>=4 && __sr.rollAt(h)<chance?1:0); },[seed,chance]);
  const run1=await bombs(L,p,18); await p.waitForTimeout(100);
  for(let h=1;h<18;h++) if(h in run1) assert.equal(run1[h],want[h],`height ${h}: first run`);
  assert.ok(Object.values(run1).includes(1),'bombs really came up'); assert.ok(Object.keys(run1).length>=12,`the bot got up to height ${Math.max(...Object.keys(run1))}`);
  // another path: same seed, but the player misses a few times on the way (lives mode round, so it goes on)
  await p.evaluate(seed=>{ __sr.showMenu(); __sr.startChallenge({mode:'hazard',score:10,seed,ghost:null,times:null,incs:null}); },seed); await p.waitForTimeout(150);
  await L.perfects(p,2); await L.miss(p); await p.waitForTimeout(200); const run2=await bombs(L,p,18);
  for(let h=3;h<18;h++) if(h in run2) assert.equal(run2[h],want[h],`height ${h}: a different path, the same bombs`);
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['challenge: your finished round turns into a link that reads back as exactly your round; boosted, assisted and soft rounds make no link', async(e,L)=>{
  const p=await L.open(e); await quiet(p);
  await p.evaluate(()=>{ __sr.startMode('classic'); }); await p.waitForTimeout(150);
  await L.perfects(p,5); await L.miss(p); await p.waitForTimeout(1400); assert.equal(await p.evaluate(()=>__sr.state),'over');
  const run=await p.evaluate(()=>({link:__sr.challengeLink(),code:__sr.challengeCode(),ok:__sr.challengeOk(),score:__sr.S.bests.classic,seed:__sr.runSeed,ghost:__sr.S.ghosts.classic}));
  assert.equal(run.ok,true); assert.ok(run.link.startsWith(`http://127.0.0.1:${e.port}/index.html?c=classic.${run.score}.${run.seed}.`),run.link.slice(0,90)); assert.ok(run.link.length<600,'short enough to paste anywhere ('+run.link.length+')');
  const back=await parse(p,new URL(run.link).searchParams.get('c')); assert.equal(back.mode,'classic'); assert.equal(back.score,run.score); assert.equal(back.seed,run.seed);
  assert.equal(back.ghost.length,run.ghost.blocks.length,'every block of the tower is in the link');
  back.ghost.forEach((b,i)=>{ assert.ok(Math.abs(b.x-run.ghost.blocks[i].x)<=.005 && Math.abs(b.w-run.ghost.blocks[i].w)<=.005,`block ${i} survives the round trip (${b.x.toFixed(3)},${b.w.toFixed(3)} vs ${run.ghost.blocks[i].x},${run.ghost.blocks[i].w})`); });
  // not for these
  const can=(f)=>p.evaluate(f);
  await p.evaluate(()=>{ __sr.S.assist='on'; __sr.startMode('classic'); }); await p.waitForTimeout(100); await L.perfects(p,2); await L.miss(p); await p.waitForTimeout(1400);
  assert.equal(await can(()=>__sr.challengeOk()),false,'a round played with timing assist cannot be a challenge');
  await p.evaluate(()=>{ __sr.S.assist='off'; __sr.S.boostAuto=true; Object.assign(__sr.S.shop.boosts,{shield:2}); __sr.S.shop.pick=['shield']; __sr.startMode('classic'); }); await p.waitForTimeout(100); assert.equal(await can(()=>__sr.boosted),false);
  await L.perfects(p,2); await L.miss(p); await p.waitForTimeout(300); await L.miss(p); await p.waitForTimeout(1400);
  assert.equal(await can(()=>({b:__sr.boosted,ok:__sr.challengeOk()})).then(x=>x.b),true,'the Shield was used'); assert.equal(await can(()=>__sr.challengeOk()),false,'a boosted round cannot be a challenge');
  for(const m of ['zen','daily']){ await p.evaluate(m=>{ __sr.showMenu(); __sr.startMode(m); },m); await p.waitForTimeout(100); assert.equal(await can(()=>__sr.challengeOk()),false,m+' is not shareable as a challenge'); }
  await p.evaluate(()=>{ __sr.showMenu(); __sr.startStage(1); }); await p.waitForTimeout(100); assert.equal(await can(()=>__sr.challengeOk()),false,'nor is a campaign stage');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['challenge: sharing sends the challenge link; without the share sheet the link is copied; a plain share is just the website', async(e,L)=>{
  const p=await L.open(e,{ctx:{permissions:['clipboard-read','clipboard-write']}}); await quiet(p);
  await p.evaluate(()=>{ window.__shared=null; navigator.canShare=()=>true; navigator.share=async d=>{ window.__shared={url:d.url,text:d.text,files:d.files.length,type:d.files[0].type}; }; });
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(150); await L.perfects(p,4); await L.miss(p); await p.waitForTimeout(1400);
  const link=await p.evaluate(()=>__sr.challengeLink()); await p.click('#share'); await p.waitForFunction(()=>window.__shared,null,{timeout:8000});
  const sh=await p.evaluate(()=>window.__shared); assert.equal(sh.url,link,'the share carries the challenge link'); assert.equal(sh.files,1); assert.equal(sh.type,'image/png'); assert.match(sh.text,/I scored \d+ in Stack Rush \(Classic\)! Can you beat it\?/);
  await p.evaluate(()=>{ window.__shared=null; delete navigator.canShare; navigator.canShare=undefined; });
  const dl=p.waitForEvent('download'); await p.click('#share'); await dl; await toastHas(p,'Challenge link copied'); assert.equal(await p.evaluate(()=>navigator.clipboard.readText()),link,'no share sheet: the link is on the clipboard');
  await p.evaluate(()=>{ navigator.canShare=()=>true; });
  await p.evaluate(()=>{ __sr.showMenu(); __sr.startMode('zen'); }); await p.waitForTimeout(100); await L.perfects(p,2); await p.click('#endZen'); await p.waitForTimeout(1200);
  await p.click('#share'); await p.waitForFunction(()=>window.__shared,null,{timeout:8000});
  assert.equal(await p.evaluate(()=>window.__shared.url),`http://127.0.0.1:${e.port}/index.html`,'Zen: just the website, no challenge');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['challenge: the result says who won; AGAIN replays the same seed; the menu ends the challenge; their tower is the outline to beat', async(e,L)=>{
  const p=await L.open(e); await quiet(p);
  const play=async(friend,n)=>{ await p.evaluate(f=>{ __sr.showMenu(); __sr.startChallenge(__sr.parseChallenge(f)); },friend); await p.waitForTimeout(150); await L.perfects(p,n); await L.miss(p); await p.waitForTimeout(1500); assert.equal(await p.evaluate(()=>__sr.state),'over'); return p.textContent('#oNext'); };
  const mine=await (async()=>{ await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(150); await L.perfects(p,3); await L.miss(p); await p.waitForTimeout(1400); return p.evaluate(()=>__sr.S.bests.classic); })();
  assert.equal(mine,9,'3 perfect drops are 2+3+4 points');
  assert.match(await play('classic.5.11',3),/You beat your friend! \(9 – 5\)/);
  assert.match(await play('classic.9.11',3),/A tie!/);
  assert.match(await play('classic.40.11',3),/Your friend wins 40 to 9\./);
  assert.equal(await p.evaluate(()=>__sr.S.bests.classic),9,'a challenge round is an ordinary round for your own best');
  // AGAIN: same seed and challenge, and the HUD shows the target
  const seed=await p.evaluate(()=>__sr.runSeed); await p.click('#again'); await p.waitForTimeout(250);
  assert.deepEqual(await p.evaluate(()=>({state:__sr.state,seed:__sr.runSeed,ch:__sr.challenge&&__sr.challenge.score})),{state:'playing',seed,ch:40},'AGAIN is another try at the same challenge');
  assert.match(await p.textContent('#ghostD'),/Beat 40/);
  await L.perfects(p,2); await p.evaluate(()=>{ __sr.pause(); }); await p.click('#quit'); await p.waitForTimeout(250);
  assert.equal(await p.evaluate(()=>__sr.challenge),null); await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(150); assert.doesNotMatch(await p.textContent('#ghostD'),/Beat 40|friend/i,'a normal round has no friend target');
  // a link with a tower: it is the outline the round shows (the best-run outline setting still decides whether it is drawn)
  const tower=await p.evaluate(()=>{ const bl=Array.from({length:6},(_,i)=>({x:.12,w:.76})); const b=bl.flatMap(x=>[Math.round(x.x*255),Math.round(x.w*255)]); return 'classic.60.3.'+btoa(String.fromCharCode(...b)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); });
  await p.evaluate(c=>{ __sr.showMenu(); __sr.startChallenge(__sr.parseChallenge(c)); },tower); await p.waitForTimeout(150);
  assert.deepEqual(await p.evaluate(()=>({n:__sr.ghost&&__sr.ghost.blocks.length,score:__sr.ghost&&__sr.ghost.score})),{n:6,score:60},'the friend\'s tower is the ghost');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

];
