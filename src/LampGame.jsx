import { useState, useEffect, useRef, useCallback } from "react";

const W = 640;
const H = 400;
const P = 4;

const COLORS = {
  bg: "#e8e4d9", dark: "#2a2a2a", mid: "#6b6b6b", light: "#b0aaa0",
  glow: "#d4c85a", glowSoft: "#e8dfa0",
  wall: "#ccc8bc", wallLight: "#d8d4c8", wallDark: "#b8b4a8", white: "#f0ece2",
  shelf: "#8b7355", shelfLight: "#a08868",
  plant: "#5a7a52", plantDark: "#3d5438", pot: "#b07050", potDark: "#8a5840",
  box: "#9a8a6a", boxDark: "#7a6a4a", boxLight: "#b0a080",
  cat: "#555", catLight: "#777",
  sky: "#8ab4d0", skyLight: "#a8cce0", cloud: "#d0e4f0",
  windowFrame: "#7a7060", windowFrameLight: "#968a78", sill: "#8a8070",
};

function px(c, x, y, w, h, col) {
  c.fillStyle = col;
  c.fillRect(Math.floor(x/P)*P, Math.floor(y/P)*P, Math.floor(w/P)*P, Math.floor(h/P)*P);
}
function pxLine(c, x1, y1, x2, y2, col, t=P) {
  const s = Math.max(Math.abs(x2-x1), Math.abs(y2-y1))/P;
  for (let i=0;i<=s;i++) {
    const f=s===0?0:i/s;
    c.fillStyle=col;
    c.fillRect(Math.floor((x1+(x2-x1)*f)/P)*P, Math.floor((y1+(y2-y1)*f)/P)*P, t, t);
  }
}
function drawCord(c, pts, col=COLORS.dark) {
  for (let i=0;i<pts.length-1;i++) pxLine(c,pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],col,P);
}
function cordCurve(x1,y1,x2,y2,sag,steps=20) {
  const pts=[];
  for(let i=0;i<=steps;i++){const t=i/steps;pts.push([Math.round(x1+(x2-x1)*t),Math.round(y1+(y2-y1)*t+Math.sin(t*Math.PI)*sag)]);}
  return pts;
}

function drawLamp(c,x,y,lit) {
  px(c,x-16,y,32,8,COLORS.dark); px(c,x-4,y-48,8,48,COLORS.dark);
  px(c,x-24,y-72,48,24,COLORS.dark); px(c,x-20,y-68,40,16,lit?COLORS.glow:COLORS.mid);
  if(lit){c.globalAlpha=0.15;for(let r=1;r<=4;r++){c.fillStyle=COLORS.glow;c.beginPath();c.ellipse(x,y-50,30+r*16,20+r*12,0,0,Math.PI*2);c.fill();}c.globalAlpha=0.08;c.fillStyle=COLORS.glowSoft;c.beginPath();c.moveTo(x-20,y-48);c.lineTo(x-50,y+10);c.lineTo(x+50,y+10);c.lineTo(x+20,y-48);c.closePath();c.fill();c.globalAlpha=1;}
}
function drawTable(c,x,y,w,h) {
  px(c,x,y,w,h,COLORS.dark);px(c,x+P,y+P,w-P*2,P,COLORS.mid);
  px(c,x+P*2,y+h,P*2,40,COLORS.dark);px(c,x+w-P*4,y+h,P*2,40,COLORS.dark);
}
function drawWindow(c,x,y,w,h,tick) {
  px(c,x-4,y-4,w+8,h+8,COLORS.windowFrame);px(c,x-2,y-2,w+4,h+4,COLORS.windowFrameLight);
  px(c,x,y,w,h,COLORS.sky);px(c,x,y,w,Math.floor(h/3),COLORS.skyLight);
  const o=(tick*0.15)%(w+40),c1=x+o-20,c2=x+((o+60)%(w+40))-20;
  c.globalAlpha=0.7;px(c,c1,y+12,24,P*2,COLORS.cloud);px(c,c1-4,y+16,32,P,COLORS.cloud);
  px(c,c2,y+28,20,P*2,COLORS.cloud);px(c,c2-4,y+32,28,P,COLORS.cloud);c.globalAlpha=1;
  px(c,x+Math.floor(w/2)-2,y,P,h,COLORS.windowFrame);px(c,x,y+Math.floor(h/2)-2,w,P,COLORS.windowFrame);
  px(c,x-8,y+h+4,w+16,P*2,COLORS.sill);px(c,x-6,y+h+4,w+12,P,COLORS.windowFrameLight);
}
function drawWall(c) {
  px(c,560,0,80,H,COLORS.wall);px(c,560,0,P,H,COLORS.wallLight);
  for(let i=0;i<5;i++)px(c,564+P,40+i*72,72,P,COLORS.wallDark);
  px(c,560,282,80,8,COLORS.wallDark);px(c,560,280,80,P,COLORS.mid);
}
function drawOutlet(c,x,y) {
  px(c,x-12,y-18,24,32,COLORS.dark);px(c,x-10,y-16,20,28,COLORS.white);
  px(c,x-3,y-10,P,8,COLORS.dark);px(c,x+2,y-10,P,8,COLORS.dark);
  px(c,x-3,y+4,P,8,COLORS.dark);px(c,x+2,y+4,P,8,COLORS.dark);
  px(c,x-1,y-14,2,2,COLORS.mid);px(c,x-1,y+13,2,2,COLORS.mid);
}
function drawPointer(c,x,y) {pxLine(c,x-14,y,x+14,y,COLORS.dark,P);pxLine(c,x,y-10,x,y+10,COLORS.dark,P);}
function drawPlug(c,x,y,col) {
  const cc=col||COLORS.dark,pc=cc===COLORS.dark?COLORS.mid:cc;
  px(c,x-4,y-2,8,8,cc);px(c,x-2,y+4,P,5,pc);px(c,x+1,y+4,P,5,pc);
}
function drawShelf(c,x,y,w) {
  px(c,x,y,P*2,P,COLORS.dark);px(c,x,y+P,P,P*3,COLORS.dark);
  px(c,x+w-P*2,y,P*2,P,COLORS.dark);px(c,x+w-P,y+P,P,P*3,COLORS.dark);
  px(c,x-P,y-P,w+P*2,P*2,COLORS.shelf);px(c,x,y-P,w,P,COLORS.shelfLight);
  px(c,x+P*2,y-P*5,P*2,P*4,COLORS.dark);px(c,x+P*4,y-P*6,P*2,P*5,COLORS.mid);
  px(c,x+P*6,y-P*4,P*3,P*3,"#8a6050");px(c,x+P*10,y-P*5,P*2,P*4,COLORS.dark);
}
function drawPlant(c,x,y) {
  px(c,x-10,y-20,20,20,COLORS.pot);px(c,x-12,y-22,24,P,COLORS.pot);
  px(c,x-8,y-18,16,4,COLORS.potDark);px(c,x-8,y-22,16,P,"#6a5a40");
  px(c,x-2,y-36,P,14,COLORS.plantDark);
  px(c,x-10,y-40,P*2,P*2,COLORS.plant);px(c,x-6,y-44,P*2,P*2,COLORS.plant);
  px(c,x+2,y-38,P*2,P*2,COLORS.plant);px(c,x+6,y-42,P*2,P*2,COLORS.plant);
  px(c,x-2,y-46,P*2,P*2,COLORS.plant);px(c,x+8,y-36,P*2,P,COLORS.plant);
  px(c,x-12,y-38,P*2,P,COLORS.plant);
}
function drawBoxes(c,x,y) {
  px(c,x,y-28,36,28,COLORS.box);px(c,x+P,y-26,32,P,COLORS.boxLight);px(c,x+14,y-28,P*2,28,COLORS.boxDark);
  px(c,x+4,y-48,28,20,COLORS.boxDark);px(c,x+6,y-46,24,P,COLORS.box);
  px(c,x+14,y-48,P*2,20,COLORS.mid);px(c,x+16,y-48,P,P,COLORS.light);
}
function drawCat(c,x,y,tick) {
  px(c,x-10,y-16,20,16,COLORS.cat);px(c,x-8,y-14,16,12,COLORS.catLight);
  px(c,x-8,y-28,16,12,COLORS.cat);px(c,x-6,y-26,12,8,COLORS.catLight);
  px(c,x-8,y-32,P,P,COLORS.cat);px(c,x+6,y-32,P,P,COLORS.cat);
  px(c,x-4,y-24,2,2,COLORS.glow);px(c,x+4,y-24,2,2,COLORS.glow);
  const w=Math.sin((tick||0)*0.06)*4;
  px(c,x+10,y-8,P,P,COLORS.cat);px(c,x+14,y-10+w,P,P,COLORS.cat);px(c,x+18,y-14+w*1.5,P,P,COLORS.cat);
}
function drawMicMeter(c,level,threshold) {
  const mx=18,my=370,mw=60,mh=8;
  px(c,mx-1,my-1,mw+2,mh+2,COLORS.dark);px(c,mx,my,mw,mh,COLORS.wall);
  const fill=Math.min(1,level/150)*mw;
  px(c,mx,my,fill,mh,level>threshold?COLORS.glow:COLORS.mid);
  const tx=mx+Math.min(1,threshold/150)*mw;
  px(c,tx,my-2,2,mh+4,COLORS.dark);
  c.fillStyle=COLORS.mid;c.font="7px monospace";c.textAlign="left";c.fillText("MIC",mx,my-4);
}

const LEVELS = [
  { name:"LEVEL 1", desc:"plug the lamp into the wall!", outletY:200, aimSpeed:2.0, hitTol:24, obstacles:[] },
  { name:"LEVEL 2", desc:"watch out for obstacles!", outletY:180, aimSpeed:2.5, hitTol:24,
    obstacles:[
      {type:"shelf",x:320,y:140,w:60,hitbox:{x:314,y:100,w:72,h:48}},
      {type:"plant",x:400,y:290,hitbox:{x:386,y:244,w:32,h:48}},
      {type:"boxes",x:280,y:290,hitbox:{x:278,y:242,w:40,h:50}},
    ]},
  { name:"LEVEL 3", desc:"good luck with this one!", outletY:170, aimSpeed:3.8, hitTol:16,
    obstacles:[
      {type:"shelf",x:300,y:130,w:56,hitbox:{x:294,y:90,w:68,h:48}},
      {type:"boxes",x:380,y:290,hitbox:{x:378,y:242,w:40,h:50}},
      {type:"cat",x:460,y:290,hitbox:{x:448,y:258,w:36,h:34}},
    ]},
  { name:"LEVEL 4", desc:"are you even real?!", outletY:155, aimSpeed:4.1, hitTol:14,
    obstacles:[
      {type:"shelf",x:290,y:120,w:70,hitbox:{x:284,y:80,w:82,h:48}},
      {type:"shelf",x:430,y:105,w:50,hitbox:{x:424,y:65,w:62,h:48}},
      {type:"cat",x:340,y:290,hitbox:{x:328,y:258,w:36,h:34},bounce:true,bounceMaxAmp:150,bounceSpeed:0.045},
      {type:"plant",x:410,y:290,hitbox:{x:396,y:244,w:32,h:48}},
      {type:"boxes",x:470,y:290,hitbox:{x:468,y:242,w:40,h:50}},
    ]},
];

const TABLE1={x:40,y:238,w:140,h:12};
const LAMP_POS={x:116,y:230};
const CORD_START={x:120,y:220};
const OUTLET_X=580;
const AIM_TOP=60,AIM_BOTTOM=270;

const ST={START:0,LEVEL_INTRO:1,AIM:2,THROW:3,HIT:4,WIN:5,MISS:6,LOSE:7,BLOCKED:8,COMPLETE:9};

function updateBounceObs(obs,tick){
  for(const o of obs){
    if(!o.bounce) continue;
    const sinVal=Math.sin(tick*o.bounceSpeed);
    if(o._prevSin!==undefined&&Math.sign(o._prevSin)!==Math.sign(sinVal)){
      o._amp=Math.random()*o.bounceMaxAmp;
    }
    if(o._amp===undefined) o._amp=Math.random()*o.bounceMaxAmp;
    o._prevSin=sinVal;
    o._dy=Math.abs(sinVal)*o._amp;
  }
}
function cordHitsObstacle(pts,obs){
  for(const o of obs){
    const dy=o._dy||0;
    const h=o.hitbox;
    for(const[cx,cy]of pts){if(cx>=h.x&&cx<=h.x+h.w&&cy>=h.y-dy&&cy<=h.y-dy+h.h)return o;}
  }return null;
}

export default function LampGame() {
  const canvasRef=useRef(null);
  const [inputMode,setInputMode]=useState("keyboard");
  const [settingsOpen,setSettingsOpen]=useState(false);

  const micRef=useRef({
    ctx:null, analyser:null, stream:null, active:false,
    baseline:30, samples:[], level:0, cooldown:0,
  });

  const startMic=useCallback(async()=>{
    const m=micRef.current;
    if(m.active) return;
    try {
      const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
      const ctx=new (window.AudioContext||window.webkitAudioContext)();
      if(ctx.state==="suspended") await ctx.resume();
      const src=ctx.createMediaStreamSource(stream);
      const analyser=ctx.createAnalyser();
      analyser.fftSize=512;
      analyser.smoothingTimeConstant=0.4;
      src.connect(analyser);
      m.ctx=ctx; m.analyser=analyser; m.stream=stream;
      m.active=true; m.baseline=30; m.samples=[]; m.cooldown=0;
    } catch(e) {
      console.error("Mic error:",e);
      alert("Could not access microphone. Please allow mic access and try again.");
    }
  },[]);

  const stopMic=useCallback(()=>{
    const m=micRef.current;
    if(m.stream){m.stream.getTracks().forEach(t=>t.stop());m.stream=null;}
    if(m.ctx){m.ctx.close();m.ctx=null;}
    m.analyser=null;m.active=false;m.level=0;m.baseline=30;m.samples=[];
  },[]);

  useEffect(()=>{
    if(inputMode==="audio") startMic();
    else stopMic();
    return ()=>stopMic();
  },[inputMode,startMic,stopMic]);

  const pollMic=useCallback(()=>{
    const m=micRef.current;
    if(!m.active||!m.analyser) return {level:0,threshold:0,triggered:false};

    const data=new Uint8Array(m.analyser.frequencyBinCount);
    m.analyser.getByteTimeDomainData(data);

    let sumSq=0;
    for(let i=0;i<data.length;i++){const v=(data[i]-128)/128;sumSq+=v*v;}
    const rms=Math.sqrt(sumSq/data.length)*200;
    m.level=rms;

    m.samples.push(rms);
    if(m.samples.length>90) m.samples.shift();
    const avg=m.samples.reduce((a,b)=>a+b,0)/m.samples.length;
    m.baseline=avg;

    const threshold=Math.max(avg*1.3, 8);

    if(m.cooldown>0){m.cooldown--;return {level:rms,threshold,triggered:false};}

    if(rms>threshold+5) {
      m.cooldown=25;
      return {level:rms,threshold,triggered:true};
    }
    return {level:rms,threshold,triggered:false};
  },[]);

  const g=useRef({
    state:ST.START,level:0,aimY:AIM_TOP,aimDir:1,tries:3,
    throwProg:0,throwTargetY:0,missTimer:0,tick:0,
    introTimer:0,hitObs:null,cordStopProg:0,litTimer:0,
    micLevel:0,micThreshold:0,
  });
  const anim=useRef(null);
  const [,kick]=useState(0);

  const AUTO_RESET=55,LIT_DELAY=80;

  const resetLevel=useCallback(()=>{
    const s=g.current;
    s.aimY=AIM_TOP;s.aimDir=1;s.tries=3;s.throwProg=0;s.missTimer=0;
    s.hitObs=null;s.cordStopProg=0;s.litTimer=0;
  },[]);
  const resetGame=useCallback(()=>{
    g.current.state=ST.START;g.current.level=0;resetLevel();kick(n=>n+1);
  },[resetLevel]);

  const doAction=useCallback(()=>{
    const s=g.current;
    if(s.state===ST.START){s.state=ST.LEVEL_INTRO;s.introTimer=0;}
    else if(s.state===ST.LEVEL_INTRO&&s.introTimer>30){s.state=ST.AIM;s.aimY=AIM_TOP;s.aimDir=1;}
    else if(s.state===ST.AIM){s.throwTargetY=s.aimY;s.throwProg=0;s.state=ST.THROW;}
    else if(s.state===ST.WIN){
      if(s.level<LEVELS.length-1){s.level++;resetLevel();s.state=ST.LEVEL_INTRO;s.introTimer=0;}
      else{s.state=ST.COMPLETE;}
      kick(n=>n+1);
    } else if(s.state===ST.LOSE){resetLevel();s.state=ST.LEVEL_INTRO;s.introTimer=0;kick(n=>n+1);}
    else if(s.state===ST.COMPLETE){resetGame();}
  },[resetLevel,resetGame]);

  const actionRef=useRef(doAction);
  actionRef.current=doAction;

  const drawObs=useCallback((c,obs,tick)=>{
    for(const o of obs){
      const dy=o._dy||0;
      if(o.type==="shelf")drawShelf(c,o.x,o.y,o.w);
      if(o.type==="plant")drawPlant(c,o.x,o.y);
      if(o.type==="boxes")drawBoxes(c,o.x,o.y);
      if(o.type==="cat")drawCat(c,o.x,o.y-dy,tick);
    }
  },[]);

  const draw=useCallback(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");const s=g.current;s.tick++;
    const lvl=LEVELS[s.level],st=s.state,lit=st===ST.WIN||st===ST.HIT;
    updateBounceObs(lvl.obstacles,s.tick);
    const oY=lvl.outletY,csx=CORD_START.x;
    const isAudio=inputMode==="audio";

    ctx.fillStyle=COLORS.bg;ctx.fillRect(0,0,W,H);
    px(ctx,0,290,W,P,COLORS.light);
    drawWindow(ctx,300,80,100,80,s.tick);
    drawWall(ctx);drawOutlet(ctx,OUTLET_X,oY);
    drawObs(ctx,lvl.obstacles,s.tick);
    drawTable(ctx,TABLE1.x,TABLE1.y,TABLE1.w,TABLE1.h);
    drawLamp(ctx,LAMP_POS.x,LAMP_POS.y,lit);

    if(st===ST.AIM||st===ST.LEVEL_INTRO||st===ST.START){
      const d=cordCurve(csx,CORD_START.y,csx+16,CORD_START.y+18,8,6);
      drawCord(ctx,d);drawPlug(ctx,csx+14,CORD_START.y+18);
    }
    if(st===ST.AIM)drawPointer(ctx,OUTLET_X,s.aimY);

    if(st===ST.THROW){
      const t=s.throwProg,tipX=csx+16+(OUTLET_X-csx-16)*t,tipY=CORD_START.y+18+(s.throwTargetY-CORD_START.y-18)*t;
      drawCord(ctx,cordCurve(csx,CORD_START.y,tipX,tipY,Math.sin(t*Math.PI)*-45,18));
      drawPlug(ctx,tipX,tipY-2);
    }
    if(st===ST.BLOCKED){
      const t=s.cordStopProg,tipX=csx+16+(OUTLET_X-csx-16)*t,tipY=CORD_START.y+18+(s.throwTargetY-CORD_START.y-18)*t;
      drawCord(ctx,cordCurve(csx,CORD_START.y,tipX,tipY+15,Math.sin(t*Math.PI)*-45+20,18),COLORS.mid);
      drawPlug(ctx,tipX,tipY+12,COLORS.mid);
      if(s.missTimer>AUTO_RESET-25){ctx.globalAlpha=Math.min(1,(s.missTimer-(AUTO_RESET-25))/12);ctx.fillStyle=COLORS.dark;ctx.font="bold 16px monospace";ctx.textAlign="center";ctx.fillText("BLOCKED!",W/2-40,50);ctx.globalAlpha=1;}
    }
    if(st===ST.HIT||st===ST.WIN){
      drawCord(ctx,cordCurve(csx,CORD_START.y,OUTLET_X,oY,-15,18));px(ctx,OUTLET_X-4,oY-4,8,8,COLORS.dark);
    }
    if(st===ST.MISS){
      drawCord(ctx,cordCurve(csx,CORD_START.y,OUTLET_X+10,s.throwTargetY+45,30,16),COLORS.mid);
      drawPlug(ctx,OUTLET_X+10,s.throwTargetY+43,COLORS.mid);
      if(s.missTimer>AUTO_RESET-25){ctx.globalAlpha=Math.min(1,(s.missTimer-(AUTO_RESET-25))/12);ctx.fillStyle=COLORS.dark;ctx.font="bold 20px monospace";ctx.textAlign="center";ctx.fillText("MISS!",W/2-40,50);ctx.globalAlpha=1;}
    }

    if(isAudio&&micRef.current.active) drawMicMeter(ctx,s.micLevel,s.micThreshold);

    const cx=W/2-40;ctx.fillStyle=COLORS.dark;ctx.textAlign="center";
    const act=isAudio?"SOUND":"SPACE";

    if(st!==ST.START&&st!==ST.LEVEL_INTRO){ctx.font="9px monospace";ctx.fillStyle=COLORS.light;ctx.fillText(lvl.name,40,16);}

    if(st===ST.START){
      ctx.font="bold 20px monospace";ctx.fillText("LAMP & CORD",cx,36);
      ctx.font="11px monospace";ctx.fillStyle=COLORS.mid;ctx.fillText("plug the lamp into the wall outlet!",cx,56);
      ctx.fillStyle=COLORS.dark;ctx.font="bold 14px monospace";ctx.fillText(`[ ${act} ]`,cx,380);
    }
    if(st===ST.LEVEL_INTRO){
      const a=Math.min(1,s.introTimer/20);ctx.globalAlpha=a;
      ctx.font="bold 24px monospace";ctx.fillStyle=COLORS.dark;ctx.fillText(lvl.name,cx,120);
      ctx.font="12px monospace";ctx.fillStyle=COLORS.mid;ctx.fillText(lvl.desc,cx,145);
      ctx.fillStyle=COLORS.dark;ctx.font="bold 13px monospace";
      if(s.introTimer>30)ctx.fillText(`[ ${act} to go ]`,cx,380);ctx.globalAlpha=1;
    }
    if(st===ST.AIM){
      ctx.font="12px monospace";ctx.fillStyle=COLORS.mid;ctx.fillText("tries: "+"o".repeat(s.tries)+"x".repeat(3-s.tries),cx,24);
      ctx.fillStyle=COLORS.dark;ctx.font="bold 13px monospace";ctx.fillText(`[ ${act} to throw ]`,cx,380);
    }
    if(st===ST.LOSE){
      ctx.font="bold 18px monospace";ctx.fillText("NO MORE TRIES!",cx,50);
      ctx.font="11px monospace";ctx.fillStyle=COLORS.mid;ctx.fillText("the lamp stays dark...",cx,70);
      ctx.fillStyle=COLORS.dark;ctx.font="bold 14px monospace";ctx.fillText(`[ ${act} to retry ]`,cx,380);
    }
    if(st===ST.WIN){
      ctx.font="bold 24px monospace";ctx.fillText("HURRAY YOU WON!",cx,36);
      ctx.font="12px monospace";ctx.fillStyle=COLORS.mid;
      const nx=s.level<LEVELS.length-1;ctx.fillText(nx?"ready for the next level?":"you beat all levels!",cx,56);
      ctx.fillStyle=COLORS.dark;ctx.font="bold 14px monospace";
      ctx.fillText(`[ ${act} for ${nx?"next level":"finale"} ]`,cx,380);
    }
    if(st===ST.COMPLETE){
      ctx.fillStyle=COLORS.bg;ctx.fillRect(0,0,W,H);
      // animated pixel stars
      const t=s.tick;
      const stars=[[80,60],[180,40],[420,50],[500,80],[560,35],[200,100],[460,110],[130,130],[350,30],[530,120]];
      stars.forEach(([sx,sy],i)=>{
        const phase=Math.sin(t*0.08+i*1.1);
        const size=phase>0?8:4;
        ctx.globalAlpha=0.5+Math.abs(phase)*0.5;
        px(ctx,sx,sy,size,size,COLORS.glow);
        px(ctx,sx+size,sy+size,4,4,COLORS.glowSoft);
      });
      ctx.globalAlpha=1;
      // glow backdrop behind text
      ctx.globalAlpha=0.18;ctx.fillStyle=COLORS.glow;ctx.fillRect(cx-160,55,320,120);ctx.globalAlpha=1;
      // main text
      ctx.textAlign="center";
      ctx.font="bold 32px monospace";ctx.fillStyle=COLORS.dark;ctx.fillText("YOU DID IT!",cx,100);
      ctx.font="14px monospace";ctx.fillStyle=COLORS.mid;ctx.fillText("all 4 levels complete",cx,124);
      ctx.font="11px monospace";ctx.fillStyle=COLORS.mid;ctx.fillText("the lamp is finally home  ✦",cx,148);
      // pixel cord snaking across bottom of screen
      const cordPts=cordCurve(120,220,OUTLET_X,180,-30,24);
      drawCord(ctx,cordPts,COLORS.dark);
      px(ctx,OUTLET_X-4,176,8,8,COLORS.dark);
      drawLamp(ctx,116,230,true);
      drawWall(ctx);drawOutlet(ctx,OUTLET_X,180);
      drawTable(ctx,TABLE1.x,TABLE1.y,TABLE1.w,TABLE1.h);
      // restart prompt
      ctx.fillStyle=COLORS.dark;ctx.font="bold 13px monospace";ctx.fillText(`[ ${act} to play again ]`,cx,380);
    }
  },[drawObs,inputMode]);

  const loop=useCallback(()=>{
    const s=g.current,lvl=LEVELS[s.level];

    if(inputMode==="audio"){
      const r=pollMic();
      s.micLevel=r.level;s.micThreshold=r.threshold;
      if(r.triggered) actionRef.current();
    }

    if(s.state===ST.LEVEL_INTRO)s.introTimer++;
    if(s.state===ST.AIM){
      s.aimY+=lvl.aimSpeed*s.aimDir;
      if(s.aimY>=AIM_BOTTOM){s.aimY=AIM_BOTTOM;s.aimDir=-1;}
      if(s.aimY<=AIM_TOP){s.aimY=AIM_TOP;s.aimDir=1;}
    }
    if(s.state===ST.THROW){
      s.throwProg+=0.045;
      if(lvl.obstacles.length>0){
        const t=s.throwProg,tipX=CORD_START.x+16+(OUTLET_X-CORD_START.x-16)*t;
        const tipY=CORD_START.y+18+(s.throwTargetY-CORD_START.y-18)*t;
        const pts=cordCurve(CORD_START.x,CORD_START.y,tipX,tipY,Math.sin(t*Math.PI)*-45,18);
        const hit=cordHitsObstacle(pts,lvl.obstacles);
        if(hit){s.hitObs=hit;s.cordStopProg=s.throwProg;s.tries--;s.missTimer=AUTO_RESET;s.state=ST.BLOCKED;}
      }
      if(s.state===ST.THROW&&s.throwProg>=1){
        if(Math.abs(s.throwTargetY-lvl.outletY)<lvl.hitTol){s.state=ST.HIT;s.litTimer=0;}
        else{s.tries--;s.missTimer=AUTO_RESET;s.state=ST.MISS;}
      }
    }
    if(s.state===ST.HIT){s.litTimer++;if(s.litTimer>=LIT_DELAY)s.state=ST.WIN;}
    if(s.state===ST.MISS||s.state===ST.BLOCKED){
      s.missTimer--;
      if(s.missTimer<=0){
        if(s.tries<=0)s.state=ST.LOSE;
        else{s.state=ST.AIM;s.aimY=AIM_TOP;s.aimDir=1;s.throwProg=0;s.hitObs=null;}
      }
    }
    draw();anim.current=requestAnimationFrame(loop);
  },[draw,inputMode,pollMic]);

  useEffect(()=>{anim.current=requestAnimationFrame(loop);return()=>{if(anim.current)cancelAnimationFrame(anim.current);};
  },[loop]);

  useEffect(()=>{
    const onKey=e=>{if(e.code!=="Space"||e.repeat)return;e.preventDefault();if(inputMode==="keyboard")actionRef.current();};
    window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
  },[inputMode]);

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#d4d0c6",fontFamily:"monospace",padding:16,userSelect:"none"}}>
      <div style={{position:"relative"}}>
        <div style={{border:`${P}px solid ${COLORS.dark}`,imageRendering:"pixelated",boxShadow:`${P*2}px ${P*2}px 0 ${COLORS.mid}`}}>
          <canvas ref={canvasRef} width={W} height={H} style={{display:"block",imageRendering:"pixelated",width:W,height:H}} tabIndex={0}/>
        </div>

        <button onClick={()=>setSettingsOpen(!settingsOpen)} style={{
          position:"absolute",top:-16,right:-16,width:36,height:36,borderRadius:"50%",
          background:COLORS.white,border:`2px solid ${COLORS.mid}`,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:COLORS.dark,
          boxShadow:`2px 2px 0 ${COLORS.mid}`,zIndex:10,
        }} aria-label="Settings">⚙</button>

        {settingsOpen&&(
          <div style={{
            position:"absolute",top:24,right:-16,background:COLORS.white,border:`2px solid ${COLORS.mid}`,
            padding:"12px 16px",fontFamily:"monospace",fontSize:13,boxShadow:`3px 3px 0 ${COLORS.mid}`,zIndex:20,minWidth:170,
          }}>
            <div style={{marginBottom:8,fontWeight:"bold",fontSize:11,color:COLORS.mid,letterSpacing:1}}>INPUT MODE</div>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"4px 0",color:COLORS.dark}}>
              <input type="radio" name="input" value="keyboard" checked={inputMode==="keyboard"} onChange={()=>setInputMode("keyboard")} style={{accentColor:COLORS.dark}}/>
              Keyboard
            </label>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"4px 0",color:COLORS.dark}}>
              <input type="radio" name="input" value="audio" checked={inputMode==="audio"} onChange={()=>setInputMode("audio")} style={{accentColor:COLORS.dark}}/>
              Voice / Sound
            </label>
            {inputMode==="audio"&&(
              <div style={{marginTop:8,fontSize:9,color:COLORS.mid,lineHeight:1.4,borderTop:`1px solid ${COLORS.light}`,paddingTop:8}}>
                Clap or speak loudly to play.<br/>
                Volume spike = throw action.<br/>
                Mic level shown bottom-left.
              </div>
            )}
          </div>
        )}
      </div>

      <p style={{color:COLORS.mid,fontSize:10,marginTop:10,fontFamily:"monospace",letterSpacing:1.5}}>
        {inputMode==="audio"?"SOUND = throw | aim for the outlet | 3 tries per level":"SPACE = throw | aim for the outlet | 3 tries per level"}
      </p>
    </div>
  );
}
