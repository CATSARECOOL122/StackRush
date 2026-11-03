/* Tiny static file server used by the tools and tests (no dependencies). */
const http=require('http'), fs=require('fs'), path=require('path');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.mp4':'video/mp4','.md':'text/plain; charset=utf-8'};
function serve(port=0,root=path.join(__dirname,'..'),host='127.0.0.1'){
  return new Promise(resolve=>{
    const srv=http.createServer((req,res)=>{
      let p=decodeURIComponent(req.url.split('?')[0]); if(p.endsWith('/')) p+='index.html';
      const f=path.join(root,p);
      if(!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); return res.end('not found'); }
      res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(port,host,()=>resolve({port:srv.address().port,close:()=>srv.close()}));
  });
}
module.exports={serve};
if(require.main===module) serve(+process.argv[2]||8080).then(s=>console.log('http://127.0.0.1:'+s.port));
