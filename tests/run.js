#!/usr/bin/env node
/* Runs every tests/*.test.js. Each file exports an array of [name, async (env, lib) => {}] and throws on failure.
   Usage: node tests/run.js [file-filter] [test-name-filter]      e.g.  node tests/run.js speed
                                                                        node tests/run.js i18n "play-through" */
const fs=require('fs'), path=require('path');
const lib=require('./lib');
(async()=>{
  const only=process.argv[2], pick=process.argv[3]; const e=await lib.env(); let pass=0, fail=0; const t00=Date.now();
  for(const f of fs.readdirSync(__dirname).filter(f=>f.endsWith('.test.js') && (!only||f.includes(only))).sort()){
    for(const [name,fn] of require('./'+f).filter(([n])=>!pick||n.includes(pick))){
      const t0=Date.now();
      try{ await fn(e,lib); console.log(`  ✓ ${f.replace('.test.js','')}: ${name} (${((Date.now()-t0)/1000).toFixed(1)}s)`); pass++; }
      catch(err){ console.log(`  ✗ ${f.replace('.test.js','')}: ${name}\n      ${String(err.message||err).split('\n').join('\n      ')}`); fail++; }
    }
  }
  await e.close();
  console.log(`\n${pass} passed, ${fail} failed in ${((Date.now()-t00)/1000).toFixed(0)}s`);
  process.exit(fail?1:0);
})();
