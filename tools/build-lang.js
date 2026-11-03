#!/usr/bin/env node
/* Builds lang/<code>.json from tools/i18n-src/<code>.txt (lines of "N|translation", N = 1-based index into
   tools/i18n-keys.json) and validates them:
     - every key is translated exactly once,
     - the set of {placeholders} matches the English string (repeats may be dropped) and <b> tags are balanced,
     - nothing is empty.
   Usage: node tools/build-lang.js            (build + validate all languages)
          node tools/build-lang.js --check    (validate only, do not write) */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..');
const keys=JSON.parse(fs.readFileSync(path.join(__dirname,'i18n-keys.json'),'utf8'));
const srcDir=path.join(__dirname,'i18n-src'), outDir=path.join(root,'lang');
const checkOnly=process.argv.includes('--check');
const holders=s=>[...new Set([...s.matchAll(/\{(\w+)\}/g)].map(m=>m[1]))].sort().join(' ');
const tagsOk=s=>{ const open=(s.match(/<b>/g)||[]).length, close=(s.match(/<\/b>/g)||[]).length; const other=s.replace(/<\/?b>|<br>/g,'').match(/[<>]/g); return open===close && !other; };
let bad=0, built=[];
if(!checkOnly) fs.mkdirSync(outDir,{recursive:true});
for(const f of fs.readdirSync(srcDir).filter(f=>f.endsWith('.txt')).sort()){
  const code=f.replace('.txt',''), problems=[], out={}, seen=new Set();
  for(const [ln,line] of fs.readFileSync(path.join(srcDir,f),'utf8').split('\n').entries()){
    if(!line.trim()) continue;
    const i=line.indexOf('|'); const n=+line.slice(0,i); const val=line.slice(i+1);
    if(!(n>=1 && n<=keys.length)){ problems.push(`line ${ln+1}: bad index "${line.slice(0,i)}"`); continue; }
    if(seen.has(n)) problems.push(`#${n} duplicated`); seen.add(n);
    const en=keys[n-1];
    if(!val.trim()) problems.push(`#${n} empty (${en})`);
    if(holders(en)!==holders(val)) problems.push(`#${n} placeholders differ:\n      en: ${en}\n      ${code}: ${val}`);
    if(!tagsOk(val)) problems.push(`#${n} unbalanced or unexpected tags: ${val}`);
    out[en]=val;
  }
  for(let n=1;n<=keys.length;n++) if(!seen.has(n)) problems.push(`#${n} missing (${keys[n-1]})`);
  if(problems.length){ bad+=problems.length; console.log(`✗ ${code}: ${problems.length} problem(s)`); problems.slice(0,25).forEach(p=>console.log('   '+p)); }
  else { built.push(code); if(!checkOnly) fs.writeFileSync(path.join(outDir,code+'.json'),JSON.stringify(out,null,0)+'\n'); console.log(`✓ ${code}: ${Object.keys(out).length} strings`); }
}
process.exit(bad?1:0);
