/* The saved game the store tools start from: a believable mid-game player (level 6, some themes, some stars). */
const pad=n=>String(n).padStart(2,'0');
const day=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const dToday=day(new Date()), dYest=day(new Date(Date.now()-864e5));
/* a made-up best run, so the dashed "ghost" tower and the BEST line show up while playing */
const ghost={score:63,blocks:Array.from({length:64},(_,i)=>({x:+(.28+Math.sin(i*.55)*.05).toFixed(3),w:+Math.max(.2,.5-i*.004).toFixed(3)})),scores:Array.from({length:64},(_,i)=>i+Math.floor(i*i/14))};
const FREE=['sunset','neon','ocean','forest','desert','ice','candy','lava','sakura','retro','deepsea','winter'];   // every theme that is not a paid one
const save=(o={})=>JSON.stringify(Object.assign({
  coins:1240,blocks:420,perfects:310,played:30,bestCombo:14,maxHeight:41,tutSeen:true,seenTip:true,assist:'off',
  tips:{classic:1,timed:1,lives:1,hazard:1,zen:1},bests:{classic:63,timed:48,lives:55,hazard:37},ghosts:{classic:ghost},
  streak:3,lastClaim:dYest,daily:{day:dToday,perfects:5,done:false},twist:{day:dToday,done:false,best:0},
  owned:['sunset','neon','ocean','forest','desert'],theme:'sunset',lastMode:'classic',
  ach:{first:1,p10:1,h10:1},camp:{1:3,2:3,3:2,4:3,5:3,6:3,7:2,8:1,9:2},worldDone:{0:1}
},o));
module.exports={save,dToday,dYest,ghost,FREE};
