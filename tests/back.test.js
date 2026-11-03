/* The Back button (Android, a browser, an iPhone edge swipe): it steps out of the game the way the on-screen arrows do, and only from the plain menu does it leave.
   history.back() is exactly what the system Back button does inside the page. */
const assert=require('assert');

const quiet=p=>p.evaluate(()=>{ const s=__sr; s.S.tutSeen=true; s.S.assist='off'; s.S.seenTip=true; for(const m of Object.keys(s.MODES)) s.S.tips[m]=1; });
const back=p=>p.evaluate(()=>history.back());
const shown=(p,id)=>p.evaluate(id=>!document.getElementById(id).classList.contains('hidden'),id);
const settle=(p,st)=>p.waitForFunction(st=>__sr.backState===st,st,{timeout:5000});         // our own history bookkeeping has finished
const visible=(p,id,on=true)=>p.waitForFunction(([id,on])=>!document.getElementById(id).classList.contains('hidden')===on,[id,on],{timeout:5000});

module.exports=[

['Back: the plain menu has no extra history entry; every other screen has exactly one, and coming back to the menu by an arrow takes it away again', async(e,L)=>{
  const p=await L.open(e); await quiet(p); await p.waitForTimeout(300);
  const len0=await p.evaluate(()=>history.length); assert.equal(await p.evaluate(()=>__sr.backState),'off','nothing armed on the menu');
  for(const [open,close,tag] of [['#openAwards','#closeAwards','Awards'],['#openSettings','#closeSettings','Settings'],['#openModes','#closeModes','Modes'],['#openCampaign','#closeStages','Campaign'],['#openThemes','#closeThemes','Shop']]){
    await p.click(open); await settle(p,'armed'); assert.equal(await p.evaluate(()=>history.length),len0+1,tag+': one extra entry');
    await p.click(close); await settle(p,'off'); assert.ok(await shown(p,'menu'),tag+': back at the menu'); assert.equal(await p.evaluate(()=>history.state),null,tag+': standing on the first entry again, nothing stale');
  }
  await p.click('#openBoosts'); await settle(p,'armed'); assert.ok(await shown(p,'boosts'),'the boosts sheet is on top of the menu, so it counts'); await p.click('#boostDone'); await settle(p,'off');
  assert.equal(await p.evaluate(()=>history.length),len0+1,'the history never grew beyond that one entry'); assert.deepEqual(p.errs,[]); await L.close(p);
}],

['Back: it closes the open screen exactly like its arrow, one step at a time, from every screen', async(e,L)=>{
  const p=await L.open(e); await quiet(p); await p.waitForTimeout(300); let last='start';
  try{
  const step=async(what,expect)=>{ last=what; await settle(p,'armed'); await back(p); await visible(p,expect); assert.ok(await shown(p,expect),`${what}: Back lands on ${expect}`); };      // (the sentinel is put in a moment after a screen opens)
  await p.click('#openAwards'); await p.click('#openMuseum'); await visible(p,'museum'); await settle(p,'armed');
  await step('museum','awards'); await settle(p,'armed'); await step('awards','menu'); await settle(p,'off');
  await p.click('#openSettings'); await p.click('[data-set=language]'); await visible(p,'langs'); await step('languages','settings'); await settle(p,'armed'); await step('settings','menu'); await settle(p,'off');
  await p.click('#openModes'); await p.click('.mode[data-mode=campaign]'); await visible(p,'stages'); await step('stages (from the mode list)','modes'); await settle(p,'armed'); await step('modes','menu'); await settle(p,'off');
  await p.click('#openCampaign'); await visible(p,'stages'); await step('stages (from the menu)','menu'); await settle(p,'off');
  await p.click('#openThemes'); await visible(p,'themes'); await step('shop','menu'); await settle(p,'off');
  await p.click('#openBoosts'); await visible(p,'boosts'); await settle(p,'armed'); await back(p); await visible(p,'boosts',false); assert.ok(await shown(p,'menu'),'the boosts sheet closes and the menu stays'); await settle(p,'off');
  await p.evaluate(()=>__sr.openChallenge(__sr.parseChallenge('classic.42.7'))); await visible(p,'chal'); await settle(p,'armed'); await step('friend challenge card','menu'); assert.equal(await p.evaluate(()=>__sr.challenge),null); await settle(p,'off');
  await p.evaluate(()=>__sr.layoutInfo()); await settle(p,'armed'); assert.equal(await p.evaluate(()=>!!document.getElementById('diag')),true); await back(p); await p.waitForFunction(()=>!document.getElementById('diag'),null,{timeout:5000}); assert.ok(await shown(p,'menu')); await settle(p,'off');
  await p.evaluate(()=>{ __sr.S.tutSeen=false; }); await p.click('#play',{force:true}); await visible(p,'tutOffer'); await step('practice offer','menu'); await settle(p,'off');
  assert.deepEqual(p.errs,[]); await L.close(p);
  }catch(x){ x.message+=` [last step: ${last}]`; throw x; }
}],

['Back: in a run it pauses, the next Back resumes, and the game-over screen and the shop opened from it step back one at a time', async(e,L)=>{
  const p=await L.open(e); await quiet(p); await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(200); await settle(p,'armed');
  await L.perfects(p,2); await back(p); await visible(p,'pause');
  assert.deepEqual(await p.evaluate(()=>({state:__sr.state,paused:__sr.paused,armed:__sr.backState})),{state:'playing',paused:true,armed:'armed'},'Back pauses (and the next Back is still ours)');
  const h=await p.evaluate(()=>__sr.stackLen); await back(p); await visible(p,'pause',false); await p.waitForFunction(()=>!__sr.paused,null,{timeout:5000});
  assert.equal(await p.evaluate(()=>__sr.state),'playing','Back again resumes (with the 3-2-1)'); assert.equal(await p.evaluate(()=>__sr.stackLen),h,'nothing was lost');
  await back(p); await visible(p,'pause'); await p.click('#quit'); await visible(p,'menu'); await settle(p,'off');
  // game over -> Back = menu; the shop from the game-over screen -> Back = the game-over screen -> Back = menu
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(150); await L.perfects(p,2); await L.miss(p); await p.waitForTimeout(1400); assert.equal(await p.evaluate(()=>__sr.state),'over');
  await p.click('#overThemes'); await visible(p,'themes'); await back(p); await visible(p,'over'); assert.ok(await shown(p,'over'),'the shop opened from the game-over screen goes back to it'); await settle(p,'armed');
  await back(p); await visible(p,'menu'); await settle(p,'off'); assert.equal(await p.evaluate(()=>__sr.state),'menu');
  // practice (the tutorial) is a run too
  await p.evaluate(()=>__sr.startPractice()); await p.waitForTimeout(200); await back(p); await visible(p,'pause'); await back(p); await visible(p,'pause',false); await p.evaluate(()=>{ __sr.pause(); }); await p.click('#quit'); await visible(p,'menu');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['Back: the Update button and the crash screen take the extra entry away before they reload, so the new page is not left sitting on a stale one', async(e,L)=>{
  const p=await L.open(e); await quiet(p); await p.click('#openAwards'); await settle(p,'armed'); const len=await p.evaluate(()=>history.length);
  await Promise.all([p.waitForEvent('load'),p.evaluate(()=>__sr.reloadApp())]); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(300);
  assert.deepEqual(await p.evaluate(()=>({type:performance.getEntriesByType('navigation')[0].type,state:history.state,armed:__sr.backState,menu:!document.getElementById('menu').classList.contains('hidden')})),{type:'reload',state:null,armed:'off',menu:true},'a reload, standing on the first entry, nothing armed');
  await Promise.all([p.waitForEvent('load'),p.evaluate(()=>__sr.reloadApp())]); await p.waitForFunction(()=>document.body.classList.contains('ready'));      // on the plain menu it just reloads
  assert.equal(await p.evaluate(()=>performance.getEntriesByType('navigation')[0].type),'reload');
  await quiet(p); await p.evaluate(()=>{ __sr.S.coins=1234; }); await p.click('#openSettings'); await settle(p,'armed');
  await Promise.all([p.waitForEvent('load'),p.evaluate(()=>__sr.reloadApp())]); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(()=>__sr.S.coins),1234,'and the progress was saved first'); assert.deepEqual(p.errs.filter(x=>!/Failed to load/.test(x)),[]); await L.close(p);
}],

['Back: mashing it, and pressing it with nothing armed, is harmless', async(e,L)=>{
  const p=await L.open(e); await quiet(p); await p.waitForTimeout(300);
  await p.click('#openAwards'); await p.click('#openMuseum'); await settle(p,'armed');
  await p.evaluate(()=>history.back()); await p.waitForTimeout(40); await p.evaluate(()=>history.back()); await p.waitForTimeout(800);        // two quick presses (a thumb, not a machine gun)
  assert.ok(await shown(p,'menu'),'two steps back to the menu'); assert.equal(await p.evaluate(()=>__sr.backState),'off');
  await p.click('#openSettings'); await settle(p,'armed'); assert.ok(await shown(p,'settings'),'and the game still works after that');
  await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(150); await L.perfects(p,2); assert.equal(await p.evaluate(()=>__sr.state),'playing');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

];
