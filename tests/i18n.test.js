const assert=require('assert');
const fs=require('fs'), path=require('path'), {execFileSync}=require('child_process');
const root=path.join(__dirname,'..');
const CODES=['en','es','pt','fr','de','it','id','tr','ru','hi','ja','ko','zh'];
const keys=JSON.parse(fs.readFileSync(path.join(root,'tools/i18n-keys.json'),'utf8'));
const run=(...a)=>execFileSync('node',a,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});

/* elements whose text is wider than their box (clipped), or a page that scrolls sideways */
const overflow=p=>p.evaluate(()=>{
  const bad=[];
  for(const el of document.querySelectorAll('#stage button,#stage .pill,#stage .nb,#stage .mode,#stage .set,#stage .ibtn,#stage h2,#stage .stg,#stage .th,#stage .card,#stage .lead,#stage .sub,#stage .lang')){
    const r=el.getBoundingClientRect(); if(!r.width||!r.height) continue;
    const cs=getComputedStyle(el);
    if(el.scrollWidth>el.clientWidth+2 && (cs.overflowX!=='visible'||cs.whiteSpace==='nowrap')) bad.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0,18)} "${(el.textContent||'').trim().slice(0,28)}"`);
  }
  if(document.documentElement.scrollWidth>innerWidth+1) bad.push('PAGE scrolls horizontally');
  return bad;
});

module.exports=[

['translation files: every language has exactly the game\'s strings, is built from its source, and the game has no untracked strings', async()=>{
  run('tools/build-lang.js','--check');                                       // placeholders / tags / completeness of the sources
  run('tools/i18n-keys.js','--check');                                        // game strings == tools/i18n-keys.json
  for(const code of CODES.filter(c=>c!=='en')){
    const json=JSON.parse(fs.readFileSync(path.join(root,`lang/${code}.json`),'utf8'));
    assert.deepEqual(Object.keys(json).sort(),[...keys].sort(),`${code}: lang file has the same keys as the game`);
    const built={}; for(const line of fs.readFileSync(path.join(root,`tools/i18n-src/${code}.txt`),'utf8').split('\n')){ if(!line.trim()) continue; const i=line.indexOf('|'); built[keys[+line.slice(0,i)-1]]=line.slice(i+1); }
    assert.deepEqual(json,built,`${code}.json is stale: run npm run lang`);
    const same=keys.filter(k=>json[k]===k && /[a-z]{4,}/i.test(k) && !/^(Stack Rush|STACK RUSH)$/.test(k));
    if(!['id','de','tr','fr','es','pt','it'].includes(code)) assert.ok(same.length<3,`${code}: ${same.length} strings left in English: ${same.slice(0,5).join(' | ')}`);
  }
}],

['all 13 languages: menu, modes, settings, awards, themes, campaign, practice offer, pause and game over render with no errors and no clipped text', async(e,L)=>{
  const problems=[];
  for(const code of CODES){
    const p=await L.open(e,{seen:false,ctx:{locale:code==='zh'?'zh-CN':code},init:()=>{ Object.defineProperty(navigator,'audioSession',{value:{type:'auto'},configurable:true}); }});   // (as on an iPhone: shows the silent-mode row too)
    const got=await p.evaluate(()=>({lang:__sr.lang,html:document.documentElement.lang,play:document.querySelector('#play span').textContent.trim()}));
    if(got.lang!==code||got.html!==code) problems.push(`${code}: expected lang ${code}, got ${got.lang}/${got.html}`);
    if(code!=='en' && got.play==='PLAY') problems.push(`${code}: PLAY button not translated`);
    const check=async tag=>{ for(const x of await overflow(p)) problems.push(`${code} ${tag}: ${x}`); };
    await p.waitForTimeout(450); await check('menu');
    for(const [tag,open,close] of [['modes','#openModes','#closeModes'],['settings','#openSettings','#closeSettings'],['awards','#openAwards','#closeAwards'],['themes','#openThemes','#closeThemes'],['campaign','#openCampaign','#closeStages']]){
      await p.click(open); await p.waitForTimeout(450); await check(tag); await p.click(close);
    }
    await p.click('#play',{force:true}); await p.waitForTimeout(400); await check('practice offer');
    await p.click('#tutSkip'); await p.waitForTimeout(400);
    await p.evaluate(()=>__sr.pause()); await p.waitForTimeout(250); await check('pause'); await p.click('#quit');
    await p.evaluate(()=>__sr.startMode('classic')); await p.waitForTimeout(150);                         // one miss ends a Classic run
    await p.evaluate(()=>__sr.forceNarrow()); await L.act(p,L.FAR); await p.waitForTimeout(1400); await check('game over'); await p.click('#toMenu');
    for(const x of p.errs) problems.push(`${code}: page error: ${x}`);
    await L.close(p);
  }
  assert.deepEqual(problems,[]);
}],

['language picker: Automatic follows the phone, a choice sticks across reloads, Automatic goes back', async(e,L)=>{
  const p=await L.open(e,{ctx:{locale:'fr-FR'}});
  assert.equal(await p.evaluate(()=>__sr.lang),'fr','phone language is detected'); assert.equal((await p.textContent('#play span')).trim(),'JOUER');
  await p.click('#openSettings'); await p.click('[data-set=language]'); await p.waitForTimeout(300);
  assert.equal(await p.locator('.lang').count(),14,'Automatic + 13 languages');
  assert.ok(await p.locator('.lang[data-lang=auto]').evaluate(el=>el.classList.contains('on')),'Automatic is the current choice');
  assert.equal(await p.locator('.lang[data-lang=ja] span').textContent(),'日本語','each language is shown in its own language');
  await p.click('.lang[data-lang=ja]'); await p.waitForTimeout(500);
  assert.deepEqual(await p.evaluate(()=>({lang:__sr.lang,saved:__sr.S.lang,html:document.documentElement.lang})),{lang:'ja',saved:'ja',html:'ja'});
  await p.click('#closeLangs'); await p.click('#closeSettings'); assert.equal((await p.textContent('#play span')).trim(),'プレイ');
  await p.reload(); await p.waitForFunction(()=>document.body.classList.contains('ready')); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(()=>__sr.lang),'ja','choice persists across a reload');
  await p.click('#openSettings'); await p.click('[data-set=language]'); await p.click('.lang[data-lang=auto]'); await p.waitForTimeout(500);
  assert.equal(await p.evaluate(()=>__sr.lang),'fr','Automatic goes back to the phone language');
  await p.click('.lang[data-lang=en]'); await p.waitForTimeout(400);
  assert.equal((await p.textContent('#openModes')).trim(),'More game modes','English can be picked explicitly');
  assert.deepEqual(p.errs,[]); await L.close(p);
}],

['phone language matching: regional variants map to the base language, the first supported language wins, unsupported falls back to English', async(e,L)=>{
  const want={'pt-BR':'pt','es-MX':'es','zh-TW':'zh','de-AT':'de','id-ID':'id','ko-KR':'ko','sw-KE':'en','ar-EG':'en'};
  for(const [loc,code] of Object.entries(want)){
    const p=await L.open(e,{ctx:{locale:loc}});
    assert.equal(await p.evaluate(()=>__sr.lang),code,`${loc} -> ${code}`); await L.close(p);
  }
  const p=await L.open(e,{init:()=>{ Object.defineProperty(navigator,'languages',{get:()=>['sw-KE','it-IT','fr-FR']}); }});
  assert.equal(await p.evaluate(()=>__sr.lang),'it','skips unsupported languages, takes the first supported one'); await L.close(p);
}],

['a missing or corrupt language file never breaks the game: it falls back to English', async(e,L)=>{
  for(const mode of ['404','garbage','html']){
    const p=await L.open(e,{ctx:{locale:'es-ES'},setup:async pg=>{
      await pg.route('**/lang/es.json',r=>mode==='404'?r.fulfill({status:404,body:'nope'}):r.fulfill({status:200,contentType:'application/json',body:mode==='garbage'?'{not json':'<html>captive portal</html>'}));
    }});
    assert.equal(await p.evaluate(()=>__sr.lang),'en',`${mode}: fell back to English`); assert.equal((await p.textContent('#play span')).trim(),'PLAY');
    await p.click('#play',{force:true}); await p.waitForTimeout(400);
    assert.equal(await p.evaluate(()=>__sr.state),'playing',`${mode}: still playable`);
    assert.deepEqual(p.errs.filter(x=>!/Failed to load resource|SyntaxError|Unexpected token|JSON/i.test(x)),[],`${mode}: no page errors`);
    await L.close(p);
  }
}],

['a play-through in Spanish, Russian and Japanese never shows an untranslated string', async(e,L)=>{
  for(const code of ['es','ru','ja']){
    const p=await L.open(e,{seen:false,ctx:{locale:code},init:()=>{ window.__trMiss=[]; }});
    const miss=async()=>p.evaluate(()=>[...new Set(window.__trMiss)]);
    const narrow=async()=>{ await p.evaluate(()=>__sr.forceNarrow()); await L.act(p,L.FAR); await p.waitForTimeout(150); };
    for(const [open,close] of [['#openModes','#closeModes'],['#openThemes','#closeThemes'],['#openAwards','#closeAwards'],['#openSettings','#closeSettings'],['#openCampaign','#closeStages']]){ await p.click(open); await p.waitForTimeout(250); await p.click(close); }
    await p.click('#openSettings'); await p.click('[data-set=language]'); await p.click('#closeLangs'); await p.click('#closeSettings');
    await p.click('#play',{force:true}); await p.click('#tutGo'); await p.waitForTimeout(250);
    await L.perfects(p,3); await p.waitForTimeout(1600);
    await p.evaluate(()=>{ __sr.S.tips={}; __sr.S.coins=300; });
    for(const m of ['classic','timed','lives','hazard','zen','daily']){
      await p.evaluate(m2=>__sr.startMode(m2),m); await p.waitForTimeout(200);
      for(let i=0;i<9;i++){ if(await L.perfect(p)==='over') break; await p.waitForTimeout(30); }
      if(m==='timed'){ await p.evaluate(()=>__sr.setTime(0.3)); await p.waitForTimeout(1400); }
      else if(m==='zen'){ await p.click('#endZen'); await p.waitForTimeout(1200); }
      else { for(let k=0;k<4;k++){ if(await p.evaluate(()=>__sr.state)!=='playing') break; await narrow(); } await p.waitForTimeout(1300); }
      if(['classic','lives','hazard'].includes(m)){ if(await p.isVisible('#revive')) await p.click('#revive'); await p.waitForTimeout(200); await narrow(); await narrow(); await narrow(); await p.waitForTimeout(1200); }
      if(await p.isVisible('#toMenu')) await p.click('#toMenu'); await p.waitForTimeout(200);
    }
    await p.evaluate(()=>__sr.startStage(1)); for(let i=0;i<9;i++){ if(await L.perfect(p)==='over') break; } await p.waitForTimeout(1200); await p.click('#toMenu');
    await p.evaluate(()=>__sr.startStage(2)); await narrow(); await narrow(); await narrow(); await p.waitForTimeout(1200); await p.click('#toMenu');
    await p.click('#openThemes'); await p.click('.sw[data-id=lava]'); await p.click('#peekClose'); await p.click('.sw[data-id=gold]'); await p.click('#peekAct'); await p.click('#peekClose'); await p.click('#closeThemes');
    const left=(await miss()).filter(k=>!/^[\d\s·\-+x×/%.,:;!?()<>]+$/.test(k) && !['STACK','RUSH'].includes(k));   // numbers and the brand stay as they are
    assert.ok(left.length===0,`${code}: strings that reached the game untranslated: ${JSON.stringify(left)}`);
    assert.deepEqual(p.errs,[],`${code}: page errors`); await L.close(p);
  }
}],

];
