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
  c.globalAlpha=0.55;
  px(c,x-4,y-4,w+8,h+8,COLORS.windowFrame);px(c,x-2,y-2,w+4,h+4,COLORS.windowFrameLight);
  px(c,x,y,w,h,COLORS.sky);px(c,x,y,w,Math.floor(h/3),COLORS.skyLight);
  const o=(tick*0.15)%(w+40),c1=x+o-20,c2=x+((o+60)%(w+40))-20;
  c.globalAlpha=0.4;px(c,c1,y+12,24,P*2,COLORS.cloud);px(c,c1-4,y+16,32,P,COLORS.cloud);
  px(c,c2,y+28,20,P*2,COLORS.cloud);px(c,c2-4,y+32,28,P,COLORS.cloud);
  c.globalAlpha=0.55;
  px(c,x+Math.floor(w/2)-2,y,P,h,COLORS.windowFrame);px(c,x,y+Math.floor(h/2)-2,w,P,COLORS.windowFrame);
  px(c,x-8,y+h+4,w+16,P*2,COLORS.sill);px(c,x-6,y+h+4,w+12,P,COLORS.windowFrameLight);
  c.globalAlpha=1;
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
function drawPointer(c,x,y,col) {const cc=col||COLORS.dark;pxLine(c,x-14,y,x+14,y,cc,P);pxLine(c,x,y-10,x,y+10,cc,P);}
function drawTargetZone(c,x,y,hitTol,tick,aimY,isAiming) {
  const pulse=0.5+Math.sin(tick*0.08)*0.35;
  const inZone=isAiming&&Math.abs(aimY-y)<hitTol;
  const zt=Math.floor((y-hitTol)/P)*P,zh=Math.floor((hitTol*2)/P)*P;
  c.globalAlpha=inZone?0.28:0.1*pulse;
  px(c,x-20,zt,40,zh,COLORS.glowSoft);
  c.globalAlpha=inZone?0.9:0.3+0.15*pulse;
  const mc=inZone?COLORS.glow:COLORS.light;
  px(c,x-20,zt,8,P,mc);px(c,x+16,zt,8,P,mc);
  px(c,x-20,zt+zh-P,8,P,mc);px(c,x+16,zt+zh-P,8,P,mc);
  c.globalAlpha=1;
}
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

function drawCoatRack(c,x,y) {
  // wall bracket backing
  px(c,x-96,y,196,P*2,COLORS.shelf);px(c,x-96,y+P*2,196,P,"#6b5030");
  // hooks (4 pegs)
  const hookXs=[-72,-30,20,72];
  for(const hx of hookXs){
    px(c,x+hx-P,y-P*2,P*2,P*3,COLORS.dark);
    px(c,x+hx,y-P*5,P*2,P*4,"#5a3e22");
  }
  // green jacket (hangs from hook at +20)
  px(c,x+4,y+4,36,48,"#3a5e2a");px(c,x+8,y+8,28,36,"#4a7038");
  px(c,x+4,y+4,16,16,"#3a5e2a");px(c,x+24,y+4,16,16,"#3a5e2a");
  px(c,x+8,y+4,24,8,"#2e4a22");
  // red bag (hangs from hook at -30)
  px(c,x-42,y+8,24,28,"#c03030");px(c,x-40,y+10,20,22,"#d04040");
  px(c,x-36,y+4,12,8,"#8a2020");px(c,x-34,y+2,8,P*2,"#6a1818");
  // scarf/white coat (hangs from hook at -72)
  px(c,x-80,y+6,16,36,COLORS.wall);px(c,x-78,y+8,12,28,COLORS.white);
}

function drawCuckooClock(c,x,y,pendulumLen) {
  const clk="#7a4e28",clkD="#5a3818",clkL="#9a6840",face=COLORS.white;
  // clock body
  px(c,x-16,y,32,40,clk);px(c,x-14,y+2,28,36,clkD);
  // roof/top triangle (stepped)
  px(c,x-16,y-8,32,8,clk);px(c,x-12,y-14,24,6,clk);px(c,x-8,y-20,16,6,clk);px(c,x-4,y-24,8,4,clk);
  // clock face circle
  px(c,x-10,y+4,20,20,face);px(c,x-8,y+6,16,16,"#e8e4d9");
  // bird head in clock face
  px(c,x-4,y+8,8,8,"#c86820");px(c,x-2,y+10,4,4,"#e88830");
  px(c,x+2,y+8,P,P,COLORS.dark);px(c,x-6,y+7,P,P,COLORS.dark);
  px(c,x-2,y+8,P*2,P,"#e88830");
  // door below face
  px(c,x-6,y+26,12,12,clk);px(c,x-4,y+28,8,8,clkD);
  // side details
  px(c,x-16,y,P,40,clkL);px(c,x+16-P,y,P,40,clkD);
  // pendulum rod
  if(pendulumLen>0){
    pxLine(c,x,y+42,x,y+42+pendulumLen,clk,P);
    // pendulum bob
    px(c,x-6,y+40+pendulumLen,12,12,clkL);px(c,x-4,y+42+pendulumLen,8,8,clk);
  }
}

function drawFireplace(c,x,y,flameH) {
  const brick="#8b3a1a",brickL="#a04a28",brickD="#6a2a10",box="#1a0e08";
  const cEmber="#a02808",cHot="#c83c10",cWarm="#e06018",cOrange="#ee8820",cYellow="#f8c030",cTip="#fce860";
  // mantel top
  px(c,x-56,y-72,112,12,brickL);px(c,x-52,y-68,104,8,brick);
  // side columns
  px(c,x-56,y-60,16,60,brick);px(c,x+40,y-60,16,60,brick);
  // brick rows on columns
  for(let r=0;r<3;r++){px(c,x-56,y-52+r*20,14,P,brickD);px(c,x+42,y-48+r*20,14,P,brickD);}
  // firebox (dark interior)
  px(c,x-40,y-60,80,60,box);
  // floor/base
  px(c,x-60,y,120,P*2,brickD);px(c,x-56,y+P*2,112,P,brick);
  // embers at base
  px(c,x-20,y-P*3,8,P*2,cEmber);px(c,x-4,y-P*4,12,P*2,cEmber);px(c,x+10,y-P*3,8,P*2,cEmber);
  // flames — tapered horizontal bands, wide at base → narrow at tip
  if(flameH>0){
    const fh=Math.floor(flameH);
    const by=y-8; // base y (just above embers)
    // Each band: [fractionOfHeight, halfWidth, color]
    // Wide hot base tapers to a thin bright tip — fire shape, not tree
    const bands=[
      [0.00,32,cHot ],[0.08,28,cHot ],[0.14,26,cWarm],
      [0.20,24,cWarm],[0.28,22,cOrange],[0.35,18,cOrange],
      [0.43,14,cOrange],[0.50,12,cYellow],[0.58,10,cYellow],
      [0.65, 8,cYellow],[0.72, 6,cTip ],[0.79, 4,cTip ],
      [0.86, 4,cTip ],[0.92, P,cTip ],[0.97, P,cTip ],
    ];
    for(let i=0;i<bands.length-1;i++){
      const[f0,hw0,col]=bands[i];
      const[f1,,]=bands[i+1];
      const sliceY=Math.floor(by-f1*fh);
      const sliceH=Math.max(P,Math.floor((f1-f0)*fh));
      // slight left/right jitter per row for organic waviness
      const jit=(i%3===0?-P:i%3===1?0:P);
      px(c,x-hw0+jit,sliceY,hw0*2,sliceH,col);
    }
    // Left side tongue (shorter, left-shifted)
    px(c,x-28,by,12,P,cHot);
    if(fh>24)px(c,x-26,by-Math.floor(fh*0.22),8,Math.floor(fh*0.22),cWarm);
    if(fh>44)px(c,x-24,by-Math.floor(fh*0.44),4,Math.floor(fh*0.16),cOrange);
    if(fh>64)px(c,x-24,by-Math.floor(fh*0.60),P,Math.floor(fh*0.10),cYellow);
    // Right side tongue
    px(c,x+16,by,12,P,cHot);
    if(fh>24)px(c,x+16,by-Math.floor(fh*0.22),8,Math.floor(fh*0.22),cWarm);
    if(fh>44)px(c,x+16,by-Math.floor(fh*0.44),4,Math.floor(fh*0.16),cOrange);
    if(fh>64)px(c,x+16,by-Math.floor(fh*0.60),P,Math.floor(fh*0.10),cYellow);
    // smoke
    if(fh>60){c.globalAlpha=0.15*(fh-60)/60;px(c,x-14,by-fh-16,28,16,"#888");c.globalAlpha=1;}
  }
}

function drawGrowingPlant(c,x,y,gh) {
  // Fixed pot — never moves
  px(c,x-10,y-20,20,20,COLORS.pot);px(c,x-12,y-22,24,P,COLORS.pot);
  px(c,x-8,y-18,16,4,COLORS.potDark);px(c,x-8,y-22,16,P,"#6a5a40");
  if(gh<=0) return;
  const stemTop=y-22-Math.floor(gh);
  // Stem grows upward
  pxLine(c,x,y-22,x,stemTop,COLORS.plantDark,P);
  // Leaf nodes appear at fixed intervals along the stem (every 28px)
  const NODE_GAP=28;
  const numNodes=Math.floor(gh/NODE_GAP);
  for(let i=0;i<numNodes;i++){
    const ny=y-22-(i+1)*NODE_GAP;
    // alternate left/right to give branching look
    const flip=(i%2===0)?1:-1;
    px(c,x-P*4,ny-P,P*4,P*2,COLORS.plant);
    px(c,x,ny-P,P*4,P*2,COLORS.plant);
    px(c,x-P*3+flip*P*2,ny-P*3,P*3,P*2,COLORS.plantDark);
    px(c,x+flip*P,ny-P*2,P*2,P*2,COLORS.plant);
  }
  // Top leaf cluster always at the growing tip
  px(c,x-P*2,stemTop-P*2,P*4,P*2,COLORS.plant);
  px(c,x-P,stemTop-P*4,P*2,P*3,COLORS.plant);
  px(c,x-P*3,stemTop-P*3,P*2,P,COLORS.plantDark);
}

function drawFan(c,x,y,angle) {
  const hub="#555",blade="#666",bladeL="#888";
  c.save();c.translate(x,y);c.rotate(angle);
  // 4 blades at 0, 90, 180, 270 degrees
  for(let i=0;i<4;i++){
    c.save();c.rotate(i*Math.PI/2);
    // blade as tapered rectangle
    c.fillStyle=blade;c.fillRect(-6,4,12,46);
    c.fillStyle=bladeL;c.fillRect(-4,6,8,14);
    c.fillStyle=bladeL;c.fillRect(-4,46,4,4);
    c.restore();
  }
  c.restore();
  // center hub (drawn without rotation)
  px(c,x-8,y-8,16,16,hub);px(c,x-4,y-4,8,8,COLORS.dark);px(c,x-2,y-2,4,4,bladeL);
}

const LEVELS = [
  { name:"LEVEL 1", desc:"plug the lamp into the wall!", outletX:580, outletY:200, aimSpeed:1.8, hitTol:32, accelNear:2.5, obstacles:[], windowLarge:true },
  { name:"LEVEL 2", desc:"mind the coat rack!", outletX:580, outletY:240, aimSpeed:2.0, hitTol:30, accelNear:3.2,
    obstacles:[
      {type:"coatrack", x:356, y:102, hitbox:{x:258,y:100,w:200,h:52}},
    ]},
  { name:"LEVEL 3", desc:"hope you don't get burned!", outletX:580, outletY:200, aimSpeed:2.2, hitTol:28, accelNear:3.8,
    obstacles:[
      {type:"shelf",x:504,y:120,w:56,hitbox:{x:498,y:80,w:68,h:48}},
      {type:"cat",x:520,y:290,hitbox:{x:508,y:258,w:36,h:34},bounce:true,bounceMaxAmp:70,bounceSpeed:0.035},
      {type:"fireplace",x:296,y:290,grow:true,growMin:0,growMax:140,growSpeed:0.55,hitbox:{x:256,y:290,w:84,h:0}},
    ]},
  { name:"LEVEL 4", desc:"watch the clock!", outletX:580, outletY:180, aimSpeed:2.4, hitTol:26, accelNear:4.2,
    obstacles:[
      {type:"shelf",x:504,y:120,w:56,hitbox:{x:498,y:80,w:68,h:48}},
      {type:"cat",x:400,y:290,hitbox:{x:388,y:258,w:36,h:34},bounce:true,bounceMaxAmp:160,bounceSpeed:0.04},
      {type:"plant",x:360,y:290,hitbox:{x:346,y:244,w:32,h:48}},
      {type:"clock",x:476,y:74,grow:true,growDown:true,growMin:28,growMax:120,growSpeed:0.4,hitbox:{x:468,y:116,w:16,h:0}},
    ]},
  { name:"LEVEL 5", desc:"plants just keep growing!", outletX:580, outletY:160, aimSpeed:2.6, hitTol:24, accelNear:4.6,
    obstacles:[
      {type:"plant-grow",x:355,y:290,grow:true,growMin:44,growMax:180,growSpeed:0.45,hitbox:{x:341,y:290,w:28,h:0}},
      {type:"plant-grow",x:535,y:290,grow:true,growMin:44,growMax:130,growSpeed:0.55,hitbox:{x:521,y:290,w:28,h:0}},
    ]},
  { name:"LEVEL 6", desc:"things are getting breezy!", outletX:580, outletY:230, aimSpeed:2.8, hitTol:20, accelNear:5.0,
    obstacles:[
      {type:"shelf",x:504,y:120,w:56,hitbox:{x:498,y:80,w:68,h:48}},
      {type:"plant",x:360,y:290,hitbox:{x:346,y:244,w:32,h:48}},
      {type:"fan",x:490,y:170,rotate:true,rotateSpeed:Math.PI/60,fanParams:{cx:490,cy:170,bladeLen:50,bladeW:14},hitbox:{x:440,y:120,w:100,h:100}},
    ]},
];

const TABLE1={x:40,y:238,w:140,h:12};
const LAMP_POS={x:116,y:230};
const CORD_START={x:120,y:220};
const OUTLET_X=580;
const AIM_TOP=20,AIM_BOTTOM=278;

const ST={START:0,LEVEL_INTRO:1,AIM:2,THROW:3,HIT:4,WIN:5,MISS:6,LOSE:7,BLOCKED:8,COMPLETE:9};

function updateObs(obs,tick){
  for(const o of obs){
    // bounce (cat)
    if(o.bounce){
      const sinVal=Math.sin(tick*o.bounceSpeed);
      if(o._prevSin!==undefined&&Math.sign(o._prevSin)!==Math.sign(sinVal)){
        o._amp=Math.random()*o.bounceMaxAmp;
      }
      if(o._amp===undefined) o._amp=Math.random()*o.bounceMaxAmp;
      o._prevSin=sinVal;
      o._dy=Math.abs(sinVal)*o._amp;
    }
    // grow (fireplace flames, cuckoo pendulum, plants)
    if(o.grow){
      if(o._growH===undefined) o._growH=o.growMin;
      if(o._growDir===undefined) o._growDir=1;
      o._growH+=o.growSpeed*o._growDir;
      if(o._growH>=o.growMax){o._growH=o.growMax;o._growDir=-1;}
      if(o._growH<=o.growMin){o._growH=o.growMin;o._growDir=1;}
    }
    // rotate (fan)
    if(o.rotate){
      if(o._angle===undefined) o._angle=0;
      o._angle-=o.rotateSpeed; // anti-clockwise
    }
  }
}
function cordHitsObstacle(pts,obs){
  for(const o of obs){
    // bounce obstacle (cat) — hitbox shifts up by _dy
    if(o.bounce){
      const dy=o._dy||0;
      const h=o.hitbox;
      for(const[cx,cy]of pts){if(cx>=h.x&&cx<=h.x+h.w&&cy>=h.y-dy&&cy<=h.y-dy+h.h)return o;}
      continue;
    }
    // grow obstacle — grows upward (fireplace/plants) or downward (clock pendulum)
    if(o.grow){
      const gh=o._growH||0;
      const h=o.hitbox;
      if(o.growDown){
        // pendulum: h.y is the top, hitbox extends downward by gh
        for(const[cx,cy]of pts){if(cx>=h.x&&cx<=h.x+h.w&&cy>=h.y&&cy<=h.y+gh)return o;}
      } else {
        // flames/plants: h.y is the base (bottom), hitbox extends upward by gh
        for(const[cx,cy]of pts){if(cx>=h.x&&cx<=h.x+h.w&&cy>=h.y-gh&&cy<=h.y)return o;}
      }
      continue;
    }
    // rotate obstacle (fan) — check each cord point against 4 rotated blade rects
    if(o.rotate){
      const angle=o._angle||0;
      const {cx:fx,cy:fy,bladeLen,bladeW}=o.fanParams;
      for(const[px2,py2]of pts){
        // translate to fan-local coords then un-rotate
        const dx=px2-fx,dy=py2-fy;
        const cos=Math.cos(-angle),sin=Math.sin(-angle);
        const lx=dx*cos-dy*sin,ly=dx*sin+dy*cos;
        // check all 4 blade orientations (every 90°)
        for(let i=0;i<4;i++){
          const a=i*Math.PI/2;
          const bcos=Math.cos(-a),bsin=Math.sin(-a);
          const bx=lx*bcos-ly*bsin,by=lx*bsin+ly*bcos;
          if(Math.abs(bx)<=bladeW/2&&by>=-4&&by<=bladeLen)return o;
        }
      }
      continue;
    }
    // static obstacle (coatrack, shelf, plant, boxes)
    const h=o.hitbox;
    for(const[cx,cy]of pts){if(cx>=h.x&&cx<=h.x+h.w&&cy>=h.y&&cy<=h.y+h.h)return o;}
  }
  return null;
}

export default function LampGame() {
  const canvasRef=useRef(null);
  const settingsBtnRef=useRef(null);
  const settingsPanelRef=useRef(null);
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

    const threshold=Math.max(avg*1.8, 15);

    if(m.cooldown>0){m.cooldown--;return {level:rms,threshold,triggered:false};}

    if(rms>threshold+12) {
      m.cooldown=25;
      return {level:rms,threshold,triggered:true};
    }
    return {level:rms,threshold,triggered:false};
  },[]);

  const g=useRef({
    state:ST.START,level:0,aimY:AIM_TOP,aimDir:1,tries:3,
    throwProg:0,throwTargetY:0,missTimer:0,missDistance:0,tick:0,
    introTimer:0,hitObs:null,cordStopProg:0,litTimer:0,
    micLevel:0,micThreshold:0,
  });
  const anim=useRef(null);
  const [,kick]=useState(0);

  const AUTO_RESET=55,LIT_DELAY=80;

  const resetLevel=useCallback(()=>{
    const s=g.current;
    s.aimY=AIM_TOP;s.aimDir=1;s.tries=3;s.throwProg=0;s.missTimer=0;s.missDistance=0;
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
      const gh=o._growH||0;
      const angle=o._angle||0;
      if(o.type==="shelf")drawShelf(c,o.x,o.y,o.w);
      if(o.type==="plant")drawPlant(c,o.x,o.y);
      if(o.type==="boxes")drawBoxes(c,o.x,o.y);
      if(o.type==="cat")drawCat(c,o.x,o.y-dy,tick);
      if(o.type==="coatrack")drawCoatRack(c,o.x,o.y);
      if(o.type==="clock")drawCuckooClock(c,o.x,o.y,gh);
      if(o.type==="fireplace")drawFireplace(c,o.x,o.y,gh);
      if(o.type==="plant-grow")drawGrowingPlant(c,o.x,o.y,gh);
      if(o.type==="fan")drawFan(c,o.x,o.y,angle);
    }
  },[]);

  const draw=useCallback(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");const s=g.current;s.tick++;
    const lvl=LEVELS[s.level],st=s.state,lit=st===ST.WIN||st===ST.HIT;
    updateObs(lvl.obstacles,s.tick);
    const oY=lvl.outletY,oX=lvl.outletX,csx=CORD_START.x;
    const isAudio=inputMode==="audio";

    ctx.fillStyle=COLORS.bg;ctx.fillRect(0,0,W,H);
    px(ctx,0,290,W,P,COLORS.light);
    if(lvl.windowLarge)drawWindow(ctx,265,84,246,196,s.tick);
    else drawWindow(ctx,104,72,132,96,s.tick);
    // Level 1: static cat + plant on window sill
    if(s.level===0){drawPlant(ctx,362,284);drawCat(ctx,464,284,s.tick);}
    drawWall(ctx);
    if(st===ST.AIM||st===ST.THROW)drawTargetZone(ctx,oX,oY,lvl.hitTol,s.tick,s.aimY,st===ST.AIM);
    drawOutlet(ctx,oX,oY);
    drawObs(ctx,lvl.obstacles,s.tick);
    drawTable(ctx,TABLE1.x,TABLE1.y,TABLE1.w,TABLE1.h);
    drawLamp(ctx,LAMP_POS.x,LAMP_POS.y,lit);

    if(st===ST.AIM||st===ST.LEVEL_INTRO||st===ST.START){
      const d=cordCurve(csx,CORD_START.y,csx+16,CORD_START.y+18,8,6);
      drawCord(ctx,d);drawPlug(ctx,csx+14,CORD_START.y+18);
    }
    if(st===ST.AIM){
      const inZone=Math.abs(s.aimY-oY)<lvl.hitTol;
      drawPointer(ctx,oX,s.aimY,inZone?COLORS.glow:null);
    }

    if(st===ST.THROW){
      const t=s.throwProg,tipX=csx+16+(oX-csx-16)*t,tipY=CORD_START.y+18+(s.throwTargetY-CORD_START.y-18)*t;
      drawCord(ctx,cordCurve(csx,CORD_START.y,tipX,tipY,Math.sin(t*Math.PI)*-45,18));
      drawPlug(ctx,tipX,tipY-2);
    }
    if(st===ST.BLOCKED){
      const t=s.cordStopProg,tipX=csx+16+(oX-csx-16)*t,tipY=CORD_START.y+18+(s.throwTargetY-CORD_START.y-18)*t;
      drawCord(ctx,cordCurve(csx,CORD_START.y,tipX,tipY+15,Math.sin(t*Math.PI)*-45+20,18),COLORS.mid);
      drawPlug(ctx,tipX,tipY+12,COLORS.mid);
      if(s.missTimer>AUTO_RESET-25){ctx.globalAlpha=Math.min(1,(s.missTimer-(AUTO_RESET-25))/12);ctx.fillStyle=COLORS.dark;ctx.font="bold 16px monospace";ctx.textAlign="center";ctx.fillText("BLOCKED!",W/2-40,50);ctx.globalAlpha=1;}
    }
    if(st===ST.HIT||st===ST.WIN){
      drawCord(ctx,cordCurve(csx,CORD_START.y,oX,oY,-15,18));px(ctx,oX-4,oY-4,8,8,COLORS.dark);
    }
    if(st===ST.MISS){
      drawCord(ctx,cordCurve(csx,CORD_START.y,oX+10,s.throwTargetY+45,30,16),COLORS.mid);
      drawPlug(ctx,oX+10,s.throwTargetY+43,COLORS.mid);
      if(s.missTimer>AUTO_RESET-25){ctx.globalAlpha=Math.min(1,(s.missTimer-(AUTO_RESET-25))/12);ctx.fillStyle=COLORS.dark;ctx.font="bold 20px monospace";ctx.textAlign="center";const nearMiss=s.missDistance<lvl.hitTol*2;ctx.fillText(nearMiss?"SO CLOSE!":"MISS!",W/2-40,50);ctx.globalAlpha=1;}
    }

    if(isAudio&&micRef.current.active) drawMicMeter(ctx,s.micLevel,s.micThreshold);

    const cx=W/2-40;ctx.fillStyle=COLORS.dark;ctx.textAlign="center";
    const act=isAudio?"SOUND":"SPACE";

    if(st!==ST.START&&st!==ST.LEVEL_INTRO){ctx.font="bold 12px monospace";ctx.fillStyle=COLORS.dark;ctx.fillText(lvl.name,40,16);}

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
      ctx.font="bold 12px monospace";ctx.fillStyle=COLORS.dark;ctx.fillText("tries: "+"o".repeat(s.tries)+"x".repeat(3-s.tries),cx,24);
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
      ctx.font="14px monospace";ctx.fillStyle=COLORS.mid;ctx.fillText("all 6 levels complete",cx,124);
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
      const dist=Math.abs(s.aimY-lvl.outletY);
      const maxDist=(AIM_BOTTOM-AIM_TOP)/2;
      const proximity=1-Math.min(dist/maxDist,1);
      const speed=lvl.aimSpeed+proximity*proximity*(lvl.accelNear||2.5);
      s.aimY+=speed*s.aimDir;
      if(s.aimY>=AIM_BOTTOM){s.aimY=AIM_BOTTOM;s.aimDir=-1;}
      if(s.aimY<=AIM_TOP){s.aimY=AIM_TOP;s.aimDir=1;}
    }
    if(s.state===ST.THROW){
      s.throwProg+=0.045;
      if(lvl.obstacles.length>0){
        const t=s.throwProg,tipX=CORD_START.x+16+(lvl.outletX-CORD_START.x-16)*t;
        const tipY=CORD_START.y+18+(s.throwTargetY-CORD_START.y-18)*t;
        const pts=cordCurve(CORD_START.x,CORD_START.y,tipX,tipY,Math.sin(t*Math.PI)*-45,18);
        const hit=cordHitsObstacle(pts,lvl.obstacles);
        if(hit){s.hitObs=hit;s.cordStopProg=s.throwProg;s.tries--;s.missTimer=AUTO_RESET;s.state=ST.BLOCKED;}
      }
      if(s.state===ST.THROW&&s.throwProg>=1){
        const dist=Math.abs(s.throwTargetY-lvl.outletY);
        if(dist<lvl.hitTol){s.state=ST.HIT;s.litTimer=0;}
        else{s.missDistance=dist;s.tries--;s.missTimer=AUTO_RESET;s.state=ST.MISS;}
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

  useEffect(()=>{
    if(!settingsOpen)return;
    const h=e=>{
      if(settingsPanelRef.current&&!settingsPanelRef.current.contains(e.target)&&
        settingsBtnRef.current&&!settingsBtnRef.current.contains(e.target))setSettingsOpen(false);
    };
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[settingsOpen]);

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#d4d0c6",fontFamily:"monospace",padding:16,userSelect:"none"}}>
      <div style={{position:"relative",transform:"scale(1.2)",transformOrigin:"center center"}}>
        <div style={{border:`${P}px solid ${COLORS.dark}`,imageRendering:"pixelated",boxShadow:`${P*2}px ${P*2}px 0 ${COLORS.mid}`}}>
          <canvas ref={canvasRef} width={W} height={H} style={{display:"block",imageRendering:"pixelated",width:W,height:H}} tabIndex={0}/>
        </div>

        <button ref={settingsBtnRef} onClick={()=>setSettingsOpen(!settingsOpen)} style={{
          position:"absolute",top:-20,right:-20,width:48,height:48,borderRadius:"50%",
          background:COLORS.white,border:`2px solid ${COLORS.mid}`,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:COLORS.dark,
          boxShadow:`2px 2px 0 ${COLORS.mid}`,zIndex:10,
        }} aria-label="Settings">⚙</button>

        {settingsOpen&&(
          <div ref={settingsPanelRef} style={{
            position:"absolute",top:32,right:-20,background:COLORS.white,border:`2px solid ${COLORS.mid}`,
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
                Say "Go" to throw the plug.<br/>
                Mic level shown bottom-left.
              </div>
            )}
          </div>
        )}
      </div>

      <p style={{color:"#1E1E1E",fontSize:12,marginTop:14,fontFamily:"monospace",letterSpacing:2.5,wordSpacing:4}}>
        {inputMode==="audio"?"SOUND = throw  |  aim for the outlet  |  3 tries per level":"SPACE = throw  |  aim for the outlet  |  3 tries per level"}
      </p>
    </div>
  );
}
