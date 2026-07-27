const EPS=1e-9;

function transformAtScale(anchorX,anchorY,worldX,worldY,scale){
  return {
    s:scale,
    x:anchorX-worldX*scale,
    y:anchorY-worldY*scale,
  };
}

const start={s:1.0,x:180,y:90};
const anchor={x:500,y:350};
const world={
  x:(anchor.x-start.x)/start.s,
  y:(anchor.y-start.y)/start.s,
};

for(const scale of [0.55,0.8,1.2,1.6,2.0,2.7]){
  const t=transformAtScale(anchor.x,anchor.y,world.x,world.y,scale);
  const screenX=t.x+world.x*t.s;
  const screenY=t.y+world.y*t.s;
  if(Math.abs(screenX-anchor.x)>EPS || Math.abs(screenY-anchor.y)>EPS){
    throw new Error(`pinch anchor drift: scale=${scale} screen=(${screenX},${screenY})`);
  }
}

console.log("pinch anchor PASS | zoom changes scale without moving the anchored point");
