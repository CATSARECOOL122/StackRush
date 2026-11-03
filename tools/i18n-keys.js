#!/usr/bin/env node
/* Collects every translatable English string in the game:
     1. static HTML text + aria-labels (read from the live page),
     2. every tr('...') call in index.html,
     3. data tables (mode/theme/achievement/twist/world names and descriptions).
   Usage: node tools/i18n-keys.js [--write]    (--write saves tools/i18n-keys.json)
   Needs the dev server from tools/serve.js (started automatically). */
const fs=require('fs'), path=require('path');
const {chromium}=require('playwright');
const {serve}=require('./serve');

(async()=>{
  const root=path.join(__dirname,'..');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const script=html.slice(html.indexOf('<script>'),html.lastIndexOf('</script>'));
  const keys=new Set();

  // 2. tr('literal') calls
  const re=/\btr\(\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")/g; let m;
  while((m=re.exec(script))){ const lit=m[1]!==undefined?"'"+m[1]+"'":'"'+m[2]+'"'; try{ keys.add(new Function('return '+lit)()); }catch(e){} }
  // tip strings live in a table, not in tr() literals
  const tips=script.match(/const MODE_TIPS = \{([\s\S]*?)\};/); if(tips){ const re2=/:'((?:\\.|[^'\\])*)'/g; let t; while((t=re2.exec(tips[1]))) keys.add(new Function("return '"+t[1]+"'")()); }

  const srv=await serve(0); const b=await chromium.launch();
  const page=await (await b.newContext({locale:'en-US'})).newPage();
  await page.goto(`http://127.0.0.1:${srv.port}/index.html#debug`); await page.waitForFunction(()=>window.__sr);
  const data=await page.evaluate(()=>{
    const sr=window.__sr, out=new Set();
    for(const k of sr.staticKeys()) out.add(k);                                   // 1. static
    for(const m of Object.values(sr.MODES)){ if(m.name) out.add(m.name); if(m.desc) out.add(m.desc); }
    for(const t of sr.TWISTS){ out.add(t.name); out.add(t.desc); }
    for(const t of Object.values(sr.THEMES)) out.add(t.name);
    for(const a of sr.ACH){ out.add(a.name); out.add(a.desc); }
    for(const w of sr.WORLD_NAMES) out.add(w);
    /* the shop: item names (blocks, colours, sounds, extras), boosts, tab labels and hints */
    for(const slot of Object.values(sr.SHOP)) for(const it of Object.values(slot)) if(it.name) out.add(it.name);
    for(const b of Object.values(sr.BOOSTS)){ out.add(b.name); out.add(b.desc); }
    for(const [, name] of sr.TABS) out.add(name);
    for(const hint of Object.values(sr.TAB_HINT)) out.add(hint);
    return [...out];
  });
  await b.close(); srv.close();
  for(const k of data) keys.add(k);
  // not translated: brand, symbols, numbers
  for(const k of [...keys]) if(!k || /^[\d\s·\-+x×/%.,:;!?()<>]+$/.test(k) || k==='STACK' || k==='RUSH') keys.delete(k);
  const list=[...keys].sort((a,b)=>a.localeCompare(b));
  const file=path.join(__dirname,'i18n-keys.json');
  const old=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];
  const added=list.filter(k=>!old.includes(k)), gone=old.filter(k=>!list.includes(k));
  if(process.argv.includes('--check')){                      // CI: fail if the game has strings that are not in the key list
    if(added.length){
      console.log('✗ tools/i18n-keys.json is out of date. Run `npm run keys`, then add translations for the new strings (see README, Languages).');
      added.forEach(k=>console.log('   new:  '+k)); process.exit(1);
    }
    if(gone.length) console.log(`  (${gone.length} listed string(s) are no longer used by the game; harmless)`);
    console.log(`✓ ${list.length} translatable strings, all accounted for`); process.exit(0);
  }
  /* append-only: existing strings keep their line number, new ones go at the end (the numbers in tools/i18n-src/<lang>.txt refer to it) */
  const merged=old.concat(added);
  if(process.argv.includes('--write')){
    fs.writeFileSync(file,JSON.stringify(merged,null,1)+'\n');
    if(added.length){ console.log(`${added.length} new string(s), now lines ${old.length+1}-${merged.length}:`); added.forEach((k,i)=>console.log(`  ${old.length+1+i}|${k}`)); console.log('Add a line "N|translation" for each to tools/i18n-src/<lang>.txt in every language, then run npm run lang.'); }
  }
  console.log(merged.length+' keys');
  if(!process.argv.includes('--quiet')) console.log(JSON.stringify(merged,null,1));
})();
