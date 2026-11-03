/* Weekly missions: three goals a week (a mix of long hauls and skill goals), a chest when all three are done, a fresh set every Monday.
   The page's clock is pinned (page.clock) so the week, and with it the missions, are known:
   2026-03-04 is in ISO week 2026-W10 -> blocks (250), perfects (100), height (25); the chest holds 400 coins and 2 Shields. */
const assert=require('assert');

const WATCH=()=>{ window.__t=[]; let was=false, last=''; setInterval(()=>{ const el=document.getElementById('toast'); if(!el) return; const on=el.classList.contains('show'), x=el.textContent; if(on && (!was || x!==last)) window.__t.push(x); was=on; last=x; },30); };   // every toast the player sees (each time one appears)
const toasts=(p,txt)=>p.evaluate(t=>window.__t.filter(x=>x.includes(t)).length,txt);
const toastHas=(p,txt,ms=14000)=>p.waitForFunction(t=>{ const el=document.getElementById('toast'); return el.classList.contains('show') && el.textContent.includes(t); },txt,{timeout:ms});
const W10='2026-03-04T12:00:00', quiet=p=>p.evaluate(()=>{ const s=__sr; s.S.tutSeen=true; s.S.assist='off'; s.S.seenTip=true; for(const m of Object.keys(s.MODES)) s.S.tips[m]=1; });
const prog=p=>p.evaluate(()=>({week:__sr.S.weekly.week,p:__sr.S.weekly.p.slice(),claimed:__sr.S.weekly.claimed,ids:__sr.weekMissions().map(m=>m.id)}));
async function week10(e,L,o={}){ const p=await L.open(e,Object.assign({init:WATCH},o)); await p.clock.setFixedTime(new Date(W10)); await quiet(p); await p.evaluate(()=>{ __sr.ensureWeek(); __sr.startMode('classic'); }); return p; }

module.exports=[

['weekly: ISO week numbers are right around New Year, on Mondays and on Sundays', async(e,L)=>{
  const p=await L.open(e);
  const cases=[['2026-01-01','2026-W01'],['2025-12-29','2026-W01'],['2025-12-28','2025-W52'],['2021-01-03','2020-W53'],['2021-01-04','2021-W01'],['2024-12-30','2025-W01'],['2024-12-29','2024-W52'],
               ['2018-12-31','2019-W01'],['2016-01-03','2015-W53'],['2020-12-31','2020-W53'],['2026-03-02','2026-W10'],['2026-03-04','2026-W10'],['2026-03-08','2026-W10'],['2026-03-09','2026-W11'],['2026-11-03','2026-W45']];
  for(const [d,want] of cases){ const [y,m,dd]=d.split('-').map(Number); assert.equal(await p.evaluate(([y,m,d])=>__sr.weekKey(new Date(y,m-1,d,12)),[y,m,dd]),want,d); }
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['weekly: every week has three different missions, a mix of long hauls and skill goals; the next week is different; all six goals come up', async(e,L)=>{
  const p=await L.open(e);
  const table=await p.evaluate(()=>__sr.WEEKLY.map(m=>({id:m.id,n:m.n,kind:m.kind,stat:m.stat,hasN:m.text.includes('{n}')})));
  assert.equal(table.length,6); for(const m of table){ assert.ok(m.n>=1 && m.hasN,m.id+' has a goal and says it'); assert.ok(['sum','max'].includes(m.kind),m.id); assert.ok(['blocks','perfects','runs','height','combo','score'].includes(m.stat),m.id); }
  const weeks=await p.evaluate(()=>{ const s=__sr, old=s.S.weekly.week, out=[]; for(let i=1;i<=53;i++){ s.S.weekly.week='2026-W'+String(i).padStart(2,'0'); out.push(s.weekMissions().map(m=>m.id+':'+m.kind)); } s.S.weekly.week=old; return out; });
  const seen=new Set();
  weeks.forEach((w,i)=>{ const ids=w.map(x=>x.split(':')[0]), kinds=new Set(w.map(x=>x.split(':')[1])); ids.forEach(x=>seen.add(x));
    assert.equal(new Set(ids).size,3,`week ${i+1}: three different missions (${ids})`); assert.equal(kinds.size,2,`week ${i+1} mixes sums and bests (${w})`);
    if(i) assert.notEqual(w.join(),weeks[i-1].join(),`week ${i+1} differs from the week before`); });
  assert.equal(seen.size,6,'every goal comes up'); assert.deepEqual(p.errs,[]); await L.close(p);
}],

['weekly: sums add up, the others keep your best; Zen and Practice do not count; one toast per finished mission and one for the chest; the chest opens once', async(e,L)=>{
  const p=await week10(e,L);
  assert.deepEqual(await prog(p),{week:'2026-W10',p:[0,0,0],claimed:false,ids:['blocks','perfects','height']});
  await p.evaluate(()=>__sr.weeklyRecord({blocks:100,perfects:40,height:12,combo:5,score:30}));
  assert.deepEqual((await prog(p)).p,[100,40,12]);
  await p.evaluate(()=>__sr.weeklyRecord({blocks:100,perfects:30,height:8,combo:9,score:99}));
  assert.deepEqual((await prog(p)).p,[200,70,12],'blocks and perfects add up; height keeps the best round');
  await p.waitForTimeout(300); assert.equal(await toasts(p,'Weekly mission complete'),0,'nothing finished yet, nothing announced');
  for(const m of ['zen','practice']){ await p.evaluate(m=>{ __sr.startMode(m); __sr.weeklyRecord({blocks:999,perfects:999,height:99,combo:50,score:900}); },m); assert.deepEqual((await prog(p)).p,[200,70,12],m+' does not count'); }
  await p.evaluate(()=>{ __sr.startMode('classic'); __sr.weeklyRecord({blocks:60,perfects:35,height:26,combo:6,score:70}); });            // finishes all three at once
  assert.deepEqual(await prog(p),{week:'2026-W10',p:[260,105,26],claimed:false,ids:['blocks','perfects','height']});
  assert.equal(await p.evaluate(()=>__sr.weeklyReady()),true);
  await toastHas(p,'Weekly chest ready',16000);
  assert.equal(await toasts(p,'Weekly mission complete'),3,'one toast for each of the three missions'); assert.equal(await toasts(p,'Weekly chest ready'),1);
  await p.evaluate(()=>__sr.weeklyRecord({blocks:10,perfects:10,height:30,combo:6,score:70})); await p.waitForTimeout(900);
  assert.equal(await toasts(p,'Weekly mission complete'),3,'a mission is announced once'); assert.equal(await toasts(p,'Weekly chest ready'),1,'and so is the chest');
  const before=await p.evaluate(()=>({coins:__sr.S.coins,shield:__sr.S.shop.boosts.shield}));
  assert.equal(await p.evaluate(()=>__sr.claimWeekly()),true);
  const after=await p.evaluate(()=>({coins:__sr.S.coins,shield:__sr.S.shop.boosts.shield,claimed:__sr.S.weekly.claimed,ready:__sr.weeklyReady()}));
  assert.deepEqual(after,{coins:before.coins+400,shield:before.shield+2,claimed:true,ready:false},'400 coins and 2 of this week\'s boost (Shield), once');
  assert.equal(await p.evaluate(()=>__sr.claimWeekly()),false,'a second try does nothing'); assert.equal(await p.evaluate(()=>__sr.S.coins),before.coins+400);
  await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(300);
  assert.deepEqual((await prog(p)).p.map(x=>x>0),[true,true,true],'saved across a reload'); assert.equal(await p.evaluate(()=>__sr.S.weekly.claimed),true,'and so is the claimed chest');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['weekly: Sunday night is still the old week, Monday starts a new set with nothing done and the chest closed again', async(e,L)=>{
  const p=await week10(e,L);
  await p.clock.setFixedTime(new Date('2026-03-08T23:59:00')); await p.evaluate(()=>{ __sr.ensureWeek(); __sr.weeklyRecord({blocks:300,perfects:120,height:30,combo:6,score:70}); __sr.claimWeekly(); });
  let s=await prog(p); assert.equal(s.week,'2026-W10'); assert.equal(s.claimed,true); assert.deepEqual(s.ids,['blocks','perfects','height']);
  await p.clock.setFixedTime(new Date('2026-03-09T00:01:00')); await p.evaluate(()=>__sr.ensureWeek());
  s=await prog(p); assert.deepEqual(s,{week:'2026-W11',p:[0,0,0],claimed:false,ids:['perfects','runs','combo']},'a fresh week with a new set');
  await p.evaluate(()=>{ __sr.showMenu(); }); await p.waitForTimeout(200);
  assert.equal(await p.evaluate(()=>__sr.S.weekly.week),'2026-W11','coming back to the menu after midnight rolls the week over too');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['weekly: Awards shows the missions and the chest; a ready chest puts a dot on Awards and a line on the menu; opening it pays and clears both', async(e,L)=>{
  const p=await week10(e,L); await p.evaluate(()=>{ __sr.S.coins=10; __sr.S.played=1; __sr.S.shop.gift=true; __sr.showMenu(); });
  await p.evaluate(()=>{ __sr.S.weekly.p=[125,40,5]; __sr.renderMenu(); });
  assert.equal(await p.locator('#openAwards.dot').count(),0,'no dot while the chest is shut'); assert.equal(await p.locator('.wkline').count(),0);
  await p.click('#openAwards'); await p.waitForTimeout(450);
  assert.equal(await p.locator('#wkBox .wk').count(),4,'three missions and the chest'); assert.equal(await p.locator('#wkBox .wk.on').count(),0);
  const texts=await p.locator('#wkBox .wk > div > b').allTextContents(); assert.deepEqual(texts.slice(0,3),['Stack 250 blocks this week','Land 100 perfect drops this week','Reach 25 blocks high in one round']);
  assert.deepEqual(await p.locator('#wkBox .wk em').allTextContents(),['125/250','40/100','5/25']);
  assert.deepEqual(await p.locator('#wkBox .bar i').evaluateAll(a=>a.map(x=>Math.round(parseFloat(x.style.width)))),[50,40,20],'the bars show the share done');
  assert.equal(await p.locator('#wkBox [data-act=wk]').isDisabled(),true,'the chest button is off until all three are done'); assert.match(await p.textContent('#wkBox .chest'),/Complete all 3 missions/);
  await p.click('#closeAwards');
  await p.evaluate(()=>{ __sr.S.weekly.p=[250,100,25]; __sr.renderMenu(); });
  assert.equal(await p.locator('#openAwards.dot').count(),1,'a dot on Awards when the chest is ready'); assert.equal(await p.locator('.wkline').count(),1); assert.match(await p.textContent('.wkline'),/Weekly chest ready/);
  await p.click('.wkline'); await p.waitForTimeout(450); assert.ok(await p.isVisible('#awards'),'the menu line takes you to Awards');
  assert.equal(await p.locator('#wkBox .wk.on').count(),4,'all done'); assert.equal(await p.locator('#wkBox [data-act=wk]').isEnabled(),true);
  const c0=await p.evaluate(()=>__sr.S.coins); await p.click('#wkBox [data-act=wk]'); await toastHas(p,'Chest opened');
  assert.equal(await p.evaluate(()=>__sr.S.coins),c0+400); assert.match(await p.textContent('#wkBox .chest'),/Claimed/); assert.equal(await p.locator('#wkBox [data-act=wk]').isDisabled(),true,'cannot be opened twice');
  await p.click('#closeAwards'); await p.waitForTimeout(200); assert.equal(await p.locator('#openAwards.dot').count(),0,'the dot is gone'); assert.equal(await p.locator('.wkline').count(),0,'and so is the menu line');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['weekly: a real round counts (blocks, perfects, height); Revive takes the round back and the finished round counts exactly once', async(e,L)=>{
  const p=await week10(e,L); await p.evaluate(()=>{ __sr.S.coins=500; __sr.startMode('classic'); }); await p.waitForTimeout(150);
  assert.equal(await L.perfects(p,6),6); await L.miss(p); await p.waitForTimeout(1400); assert.equal(await p.evaluate(()=>__sr.state),'over');
  let s=await prog(p); assert.deepEqual(s.p,[6,6,6],'6 blocks, 6 perfects, 6 high');
  await p.click('#revive'); await p.waitForTimeout(250); assert.equal(await p.evaluate(()=>__sr.state),'playing');
  assert.deepEqual((await prog(p)).p,[0,0,0],'Revive undoes the round\'s share');
  assert.equal(await L.perfects(p,2),2); await L.miss(p); await p.waitForTimeout(1400); assert.equal(await p.evaluate(()=>__sr.state),'over');
  s=await prog(p); assert.deepEqual(s.p,[8,8,8],'one round of 8: counted once');
  assert.deepEqual(await p.evaluate(()=>({b:__sr.S.blocks,pf:__sr.S.perfects})),{b:8,pf:8},'the same numbers as the lifetime stats');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['weekly: a hostile or corrupt save never breaks it (junk week, junk numbers, a claimed chest from another week)', async(e,L)=>{
  const p=await L.open(e); const key=await p.evaluate(()=>__sr.weekKey());
  const load=async raw=>{ await p.evaluate(raw=>localStorage.setItem('stackrush.v2',raw),raw); await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(250); return p.evaluate(()=>({week:__sr.S.weekly.week,p:__sr.S.weekly.p,claimed:__sr.S.weekly.claimed,ids:__sr.weekMissions().length})); };
  let g=await load('{"weekly":{"week":"<img src=x onerror=alert(1)>","p":["x",-5,1e12],"claimed":"yes"}}');
  assert.deepEqual(g,{week:key,p:[0,0,0],claimed:false,ids:3},'a junk week starts the current week from zero');
  g=await load(JSON.stringify({weekly:{week:key,p:['x',-5,1e12],claimed:'yes'}}));
  assert.deepEqual(g,{week:key,p:[0,0,1e6],claimed:true,ids:3},'this week\'s numbers are clamped to 0..1,000,000');
  g=await load(JSON.stringify({weekly:{week:'2001-W07',p:[999,999,999],claimed:true}}));
  assert.deepEqual(g,{week:key,p:[0,0,0],claimed:false,ids:3},'an old week is replaced by a fresh one');
  for(const junk of ['null','"x"','[]','7','{"p":"no"}']){ g=await load('{"weekly":'+junk+'}'); assert.deepEqual([g.week,g.p,g.claimed,g.ids],[key,[0,0,0],false,3],junk); }
  await p.click('#openAwards'); await p.waitForTimeout(450); assert.equal(await p.locator('#wkBox .wk').count(),4,'and Awards still draws');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

];
