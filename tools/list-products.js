#!/usr/bin/env node
/* Prints every in-app product the game can sell, with the exact Google Play product id the code uses, as a Markdown table.
   Use it when you create the products in the Play Console (android/README.md has the same list; a test keeps them in sync).
   Usage: node tools/list-products.js [--json] */
const {chromium}=require('playwright');
const {serve}=require('./serve');
(async()=>{
  const srv=await serve(0), browser=await chromium.launch();
  const page=await (await browser.newContext({locale:'en-US'})).newPage();
  await page.goto(`http://127.0.0.1:${srv.port}/index.html#debug`); await page.waitForFunction(()=>window.__sr);
  const rows=await page.evaluate(()=>__sr.iapKeys().map(key=>{
    const prod=__sr.PRODUCTS[key], th=__sr.THEMES[key], [sl,id]=key.split(':'), it=(!prod&&!th&&__sr.SHOP[sl])?__sr.SHOP[sl][id]:null;
    return {sku:__sr.skuOf(key),key,type:prod?(__sr.isCoinPack(key)?'consumable':'one-time'):'one-time',
            price:prod?prod.price:th?th.unlock.price:it.iap,
            title:prod?(key==='starter'?'Starter pack':prod.coins+' coins'):th?th.name+' theme':it.name+(sl==='topper'?' tower topper':' block style')};
  }));
  await browser.close(); srv.close();
  if(process.argv.includes('--json')){ console.log(JSON.stringify(rows,null,1)); return; }
  console.log('| Product id | Type | Price (USD) | Title |\n|---|---|---|---|');
  for(const r of rows) console.log(`| \`${r.sku}\` | ${r.type} | ${r.price} | ${r.title} |`);
})();
