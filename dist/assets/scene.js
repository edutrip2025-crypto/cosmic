import * as T from './three.module.js';
import {RoomEnvironment} from './addons/environments/RoomEnvironment.js';

const canvas = document.querySelector('#rf-scene');
const host = canvas.parentElement;
const mode = document.body.dataset.scene;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 900px)').matches;
const palette = { ink:0x214f44, teal:0x348a78, mint:0xb3dbb7, amber:0xc1965e };
const mat = (color,roughness=.5,metalness=.18) => new T.MeshStandardMaterial({color,roughness,metalness});
const lineMat = (color,opacity=.5) => new T.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false});
function mesh(parent,geometry,material,x=0,y=0,z=0) {
 const m=new T.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;
}
function line(parent,points,color=palette.teal,opacity=.5) {
 const l=new T.Line(new T.BufferGeometry().setFromPoints(points),lineMat(color,opacity));parent.add(l);return l;
}
function outline(parent,geometry,x,y,z,color=palette.teal,opacity=.55) {
 const l=new T.LineSegments(new T.EdgesGeometry(geometry),lineMat(color,opacity));l.position.set(x,y,z);parent.add(l);return l;
}
function ring(parent,r,x,z,color=palette.teal,opacity=.4) {
 const m=mesh(parent,new T.RingGeometry(r,r+.014,128),new T.MeshBasicMaterial({color,side:T.DoubleSide,transparent:true,opacity,depthWrite:false}),x,.035,z);
 m.rotation.x=-Math.PI/2;return m;
}

// Three separate scenes; no shared street, building or vehicle composition.
function worldModel(root) {
 const volume=new T.Group();root.add(volume);
 const bounds=new T.BoxGeometry(7.4,5.6,6.4);
 outline(volume,bounds,0,0,0,palette.ink,.3);
 const pointPositions=[],pointColors=[];
 const green=new T.Color(palette.teal),gold=new T.Color(palette.amber);
 for(let z=-2.7;z<=2.7;z+=.23)for(let x=-3.2;x<=3.2;x+=.23){
  const wave=Math.sin(x*.9)*.4+Math.cos(z*.8)*.28;
  const edge=Math.abs(x)>2.6||Math.abs(z)>2.15;
  const y=edge? .2+Math.sin(z*.8+x*.5)*1.25 : -1.6+wave;
  pointPositions.push(x,y,z);
  const c=x>1.2&&z<-.2?gold:green;pointColors.push(c.r,c.g,c.b);
 }
 const pointGeo=new T.BufferGeometry();
 pointGeo.setAttribute('position',new T.Float32BufferAttribute(pointPositions,3));
 pointGeo.setAttribute('color',new T.Float32BufferAttribute(pointColors,3));
 const cloud=new T.Points(pointGeo,new T.PointsMaterial({size:.066,vertexColors:true,transparent:true,opacity:.85}));
 volume.add(cloud);
 const surfaces=new T.Group();volume.add(surfaces);
 [[-1.4,-.65,.2,1.5,1.5,2.1],[1.3,-1.15,1.25,1.1,.5,1.35],[1.8,-.2,-1.3,.7,2.4,.8]].forEach(([x,y,z,w,h,d],i)=>{
  const geo=new T.BoxGeometry(w,h,d);
  mesh(surfaces,geo,new T.MeshStandardMaterial({color:i===2?palette.amber:palette.mint,transparent:true,opacity:.34,roughness:.3,depthWrite:false}),x,y,z);
  outline(surfaces,geo,x,y,z,i===2?palette.amber:palette.teal,.7);
 });
 // Offset hypothesis, retained as a faint candidate rather than a claimed detection.
 const candidate=outline(volume,new T.BoxGeometry(.8,2.4,.8),2.3,-.2,-1.05,palette.amber,.24);
 const scan=mesh(volume,new T.PlaneGeometry(7.3,6.3),new T.MeshBasicMaterial({color:palette.teal,side:T.DoubleSide,transparent:true,opacity:.08,depthWrite:false}));
 scan.rotation.x=-Math.PI/2;
 const scanOutline=outline(volume,new T.BoxGeometry(7.3,.015,6.3),0,0,0,palette.teal,.5);
 for(const y of [-2.82,2.82]){
  const g=new T.GridHelper(7.4,14,palette.ink,palette.teal);g.position.y=y;g.material.transparent=true;g.material.opacity=.1;g.scale.z=.865;volume.add(g);
 }
 const trace=line(volume,[new T.Vector3(-4.7,-.3,1),new T.Vector3(-3.7,-.3,1),new T.Vector3(-2.1,-.65,.2)],palette.teal,.45);
 const source=mesh(volume,new T.SphereGeometry(.09,12,12),mat(palette.teal),-4.7,-.3,1);
 const trajectory=line(volume,[new T.Vector3(1.3,-.85,1.25),new T.Vector3(2.8,-.85,2.2),new T.Vector3(4,-.85,2.2)],palette.amber,.5);
 root.rotation.y=-.28;root.rotation.z=-.035;
 return {camera:[11,8.5,13],look:[0,0,0],update(t){
  scan.position.y=scanOutline.position.y=Math.sin(t*.38)*2.65;
  cloud.material.opacity=.7+Math.sin(t*.38)*.15;
  candidate.material.opacity=.12+(Math.sin(t*.55)+1)*.09;
  root.rotation.y=-.28+Math.sin(t*.12)*.055;
 }};
}

function infrastructure(root) {
 const terrain=mesh(root,new T.CylinderGeometry(6.9,7.1,.2,6),mat(0xd0d9c7),0,-.2,0);
 terrain.rotation.y=Math.PI/6;
 const grid=new T.GridHelper(12,20,palette.ink,palette.teal);grid.position.y=-.07;grid.material.transparent=true;grid.material.opacity=.13;root.add(grid);
 const locations=[[-3.8,-2.1],[-.5,-3.7],[3.4,-2.1],[3.7,2.2],[0,3.6],[-3.8,2]];
 const nodes=[],packets=[];
 locations.forEach(([x,z],i)=>{
  mesh(root,new T.CylinderGeometry(.27,.37,.16,32),mat(palette.ink),x,.02,z);
  mesh(root,new T.CylinderGeometry(.11,.14,1.4,24),mat(0x577b69,.38,.6),x,.75,z);
  mesh(root,new T.CylinderGeometry(.27,.27,.66,32),mat(palette.ink,.3,.5),x,1.62,z);
  mesh(root,new T.CylinderGeometry(.275,.275,.035,32),new T.MeshBasicMaterial({color:0xb7e6c1}),x,1.72,z);
  const coverage=ring(root,2.5,x,z,palette.teal,.42);
  const boundary=ring(root,1.2,x,z,palette.amber,.3);nodes.push(boundary);
  const next=locations[(i+1)%locations.length];
  const curve=new T.QuadraticBezierCurve3(new T.Vector3(x,1.78,z),new T.Vector3((x+next[0])/2,2.4,(z+next[1])/2),new T.Vector3(next[0],1.78,next[1]));
  line(root,curve.getPoints(60),palette.teal,.4);
  const packet=mesh(root,new T.SphereGeometry(.055,10,10),new T.MeshBasicMaterial({color:palette.teal}));
  packets.push({curve,packet});
 });
 // Shared processing is conceptual, not a hardware specification.
 for(let i=0;i<3;i++)mesh(root,new T.CylinderGeometry(.7,.7,.14,6),mat(i===1?palette.amber:palette.ink),0,.15+i*.24,0);
 locations.filter((_,i)=>i%2===0).forEach(([x,z])=>line(root,[new T.Vector3(x,1.78,z),new T.Vector3(0,.8,0)],palette.ink,.18));
 root.rotation.y=.1;
 return {camera:[12,12,15],look:[0,.2,0],update(t){
  nodes.forEach((r,i)=>{const p=(t*.12+i*.17)%1;r.scale.setScalar(1+p*1.2);r.material.opacity=.26*(1-p)});
  packets.forEach(({curve,packet},i)=>packet.position.copy(curve.getPoint((t*.16+i*.16)%1)));
 }};
}

function automotive(root) {
 // A purpose-built, unbranded vehicle: a single application, not a second network map.
 const car=new T.Group();root.add(car);
 const bodyShape=new T.Shape();
 bodyShape.moveTo(-.82,-2.15);bodyShape.quadraticCurveTo(-1,-2.15,-1,-1.8);
 bodyShape.lineTo(-1,1.65);bodyShape.quadraticCurveTo(-.98,2.15,-.7,2.2);
 bodyShape.lineTo(.7,2.2);bodyShape.quadraticCurveTo(.98,2.15,1,1.65);
 bodyShape.lineTo(1,-1.8);bodyShape.quadraticCurveTo(1,-2.15,.82,-2.15);bodyShape.closePath();
 const shell=new T.ExtrudeGeometry(bodyShape,{depth:.38,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.1,bevelThickness:.1,curveSegments:16});
 const body=mesh(car,shell,mat(0xd6d9c7,.26,.42),0,.62,0);body.rotation.x=Math.PI/2;
 // Lofted panoramic cabin: curved shoulders and sloped windscreen/rear glass.
 const sections=[[-1.28,.61,.035],[-1.05,.71,.22],[-.62,.76,.48],[.15,.74,.5],[.74,.65,.28],[1.02,.55,.025]];
 const verts=[],indices=[],steps=24;
 sections.forEach(([z,w,h])=>{for(let j=0;j<=steps;j++){const a=j/steps*Math.PI;verts.push(Math.cos(a)*w,.64+Math.sin(a)*h,z)}});
 for(let i=0;i<sections.length-1;i++)for(let j=0;j<steps;j++){
  const a=i*(steps+1)+j,b=a+steps+1;indices.push(a,b,a+1,b,b+1,a+1);
 }
 const canopy=new T.BufferGeometry();canopy.setAttribute('position',new T.Float32BufferAttribute(verts,3));canopy.setIndex(indices);canopy.computeVertexNormals();
 const glazing=mat(0x183d39,.17,.62);glazing.side=T.DoubleSide;
 mesh(car,canopy,glazing);
 for(const index of [1,4]){
  const [z,w,h]=sections[index];const pts=[];
  for(let j=0;j<=32;j++){const a=j/32*Math.PI;pts.push(new T.Vector3(Math.cos(a)*w,.645+Math.sin(a)*h,z))}
  line(car,pts,0xaabdae,.9);
 }
 for(const side of [-1,1]){
  line(car,[new T.Vector3(side*1.02,.5,-1.6),new T.Vector3(side*1.04,.49,1.6)],0x5b7568,.45);
  mesh(car,new T.BoxGeometry(.035,.035,.25),mat(0x5c7669,.25,.7),side*1.035,.59,.25);
  const mirror=mesh(car,new T.SphereGeometry(.12,16,12),mat(0xcbd4c2,.3,.35),side*1.04,.7,-.76);mirror.scale.set(1,.48,.72);
 }
 for(const x of [-1,1])for(const z of [-1.35,1.35]){
  const tire=mesh(car,new T.CylinderGeometry(.38,.38,.23,32),mat(0x1e302b),x,.34,z);tire.rotation.z=Math.PI/2;
  const hub=mesh(car,new T.CylinderGeometry(.23,.23,.242,24),mat(0x8b9f8c,.3,.65),x,.34,z);hub.rotation.z=Math.PI/2;
 }
 for(const x of [-.62,.62]){
  mesh(car,new T.BoxGeometry(.43,.05,.035),new T.MeshBasicMaterial({color:0xfff3d6}),x,.61,-2.25);
  mesh(car,new T.BoxGeometry(.4,.05,.035),new T.MeshBasicMaterial({color:0xb78665}),x,.61,2.25);
 }
 // Architectural road study: environmental context, not a vehicle showroom.
 car.scale.setScalar(.58);car.position.set(-.8,.01,2.6);
 const ground=mesh(root,new T.BoxGeometry(16,.12,12),new T.MeshBasicMaterial({color:0xd7ddcc}),0,-.22,0);
 mesh(root,new T.BoxGeometry(4,.025,12),new T.MeshBasicMaterial({color:0x9eafa2}),0,-.14,0);
 mesh(root,new T.BoxGeometry(16,.025,3.6),new T.MeshBasicMaterial({color:0x9eafa2}),0,-.13,-1.3);
 for(let z=-5.5;z<6;z+=1.2)if(z>1||z<-3.5)mesh(root,new T.BoxGeometry(.035,.01,.55),mat(0xf0efe2),0,-.1,z);
 for(let x=-7.5;x<8;x+=1.2)if(Math.abs(x)>2.2)mesh(root,new T.BoxGeometry(.55,.01,.035),mat(0xf0efe2),x,-.1,-1.3);
 const blocks=[[-4.7,1.5,2.8,4.3,3,3.7],[4.4,1.1,3,3.8,2.2,3.4],[-4.9,.8,-4.6,4.2,1.6,2],[4.5,1.8,-4.7,3.9,3.6,2]];
 blocks.forEach(([x,y,z,w,h,d])=>{
  const g=new T.BoxGeometry(w,h,d);
  mesh(root,g,mat(0xe9e8dd,.85,0),x,y-.1,z);
  outline(root,g,x,y-.1,z,0x9aaa93,.32);
  mesh(root,new T.BoxGeometry(w+.12,.07,d+.12),mat(0xf4f1e5),x,y+h/2-.06,z);
  for(let level=.5;level<h;level+=.7)line(root,[new T.Vector3(x-w/2-.01,level,z+d/2+.01),new T.Vector3(x+w/2+.01,level,z+d/2+.01)],0xb1baa9,.38);
 });
 const context=new T.Group();root.add(context);
 const nodePositions=[[-2.3,-3.25],[2.25,.75]];
 const waves=[];
 nodePositions.forEach(([x,z])=>{
  mesh(root,new T.CylinderGeometry(.055,.075,2.5,16),mat(palette.ink),x,1.1,z);
  mesh(root,new T.BoxGeometry(.21,.36,.21),mat(palette.ink),x,2.45,z);
  mesh(root,new T.SphereGeometry(.065,12,12),new T.MeshBasicMaterial({color:0xd0f1b3}),x,2.67,z);
  [1.2,2.2,3.2].forEach(r=>waves.push(ring(context,r,x,z,palette.teal,.28)));
 });
 // Illustrative observation paths originate at the actual RF node heads.
 const signalPaths=[];
 nodePositions.slice(0,1).forEach(([x,z])=>{
  const source=new T.Vector3(x,2.45,z);
  const destination=new T.Vector3(-.8,.5,2.6);
  const curve=new T.LineCurve3(source,destination);
  line(context,curve.getPoints(2),palette.teal,.65);
  const pulse=mesh(context,new T.SphereGeometry(.065,8,6),new T.MeshBasicMaterial({color:palette.teal,wireframe:true}));
  signalPaths.push({curve,pulse});
 });
 const sight=new T.Shape();sight.moveTo(0,0);sight.lineTo(-1.5,4.1);sight.quadraticCurveTo(0,4.8,1.5,4.1);sight.closePath();
 const cone=mesh(root,new T.ShapeGeometry(sight),new T.MeshBasicMaterial({color:0xf5f6df,side:T.DoubleSide,transparent:true,opacity:.3,depthWrite:false}),-.8,.01,2.6);cone.rotation.x=-Math.PI/2;
 // Keep the optical surfaces separate from the RF reconstruction.
 const optical=[],rfEdges=[];
 root.traverse(object=>{
  let inContext=false;
  for(let parent=object;parent;parent=parent.parent)if(parent===context)inContext=true;
  if(!inContext&&(object.isMesh||object.isLine))optical.push(object);
 });
 optical.filter(o=>o.isMesh&&o!==cone&&o.parent!==car).forEach(object=>{
  const edge=new T.LineSegments(new T.EdgesGeometry(object.geometry,22),lineMat(palette.ink,.65));
  edge.position.copy(object.position);edge.rotation.copy(object.rotation);edge.scale.copy(object.scale);
  object.parent.add(edge);rfEdges.push(edge);
 });
 const reconstruction=new T.Group();root.add(reconstruction);
 const roadGrid=new T.GridHelper(16,32,palette.teal,palette.teal);
 roadGrid.scale.z=.75;roadGrid.position.y=-.12;roadGrid.material.transparent=true;roadGrid.material.opacity=.19;reconstruction.add(roadGrid);
 blocks.forEach(([x,y,z,w,h,d])=>{
  const low=y-.1-h/2,high=y-.1+h/2;
  for(let level=low+.4;level<high;level+=.4){
   line(reconstruction,[new T.Vector3(x-w/2,level,z-d/2),new T.Vector3(x+w/2,level,z-d/2),new T.Vector3(x+w/2,level,z+d/2),new T.Vector3(x-w/2,level,z+d/2),new T.Vector3(x-w/2,level,z-d/2)],palette.teal,.25);
  }
  for(let dx=-w/2+.5;dx<w/2;dx+=.5)for(const dz of [-d/2,d/2])
   line(reconstruction,[new T.Vector3(x+dx,low,z+dz),new T.Vector3(x+dx,high,z+dz)],palette.teal,.25);
  for(let dz=-d/2+.5;dz<d/2;dz+=.5)for(const dx of [-w/2,w/2])
   line(reconstruction,[new T.Vector3(x+dx,low,z+dz),new T.Vector3(x+dx,high,z+dz)],palette.teal,.25);
 });
 // Purpose-drawn vehicle contours avoid noisy bevel and triangulation edges.
 const rfCar=new T.Group();rfCar.position.copy(car.position);rfCar.scale.copy(car.scale);root.add(rfCar);
 function carLine(points,opacity=.85,closed=false){
  const vectors=points.map(p=>new T.Vector3(...p));
  if(closed)vectors.push(vectors[0].clone());
  return line(rfCar,vectors,palette.ink,opacity);
 }
 function smoothCarLine(points,closed=false,opacity=.85){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),closed,'centripetal');
  return line(rfCar,curve.getPoints(80),palette.ink,opacity);
 }
 for(const y of [.29,.61]){
  smoothCarLine([[-.75,y,-2.15],[-.97,y,-1.75],[-1,y,.8],[-.83,y,2.08],[0,y,2.2],[.83,y,2.08],[1,y,.8],[.97,y,-1.75],[.75,y,-2.15],[0,y,-2.2]],true);
 }
 for(const side of [-1,1]){
  smoothCarLine([[side*.8,.63,-1.22],[side*.7,.86,-.85],[side*.57,1.1,-.45],[side*.55,1.11,.28],[side*.7,.85,.77],[side*.8,.63,1.05]]);
  carLine([[side*.97,.58,-.65],[side*.98,.32,-.65],[side*.98,.32,.95],[side*.96,.59,.95]],.55);
  carLine([[side*.71,.83,.3],[side*.95,.6,.3]],.6);
  for(const z of [-1.35,1.35]){
   for(const radius of [.36,.2]){
    const pts=[];
    for(let j=0;j<=48;j++){const a=j/48*Math.PI*2;pts.push([side*1.045,.36+Math.sin(a)*radius,z+Math.cos(a)*radius])}
    carLine(pts,radius===.36?.95:.55);
   }
  }
 }
 for(const [z,y,w] of [[-1.22,.64,.8],[-.45,1.1,.57],[.28,1.11,.55],[1.05,.64,.8]]){
  smoothCarLine([[-w,y,z],[0,y+.045,z],[w,y,z]],false,.8);
 }
 carLine([[-.75,.62,-1.8],[.75,.62,-1.8]],.55);
 carLine([[-.75,.62,1.65],[.75,.62,1.65]],.55);
 let shared=true;
 function setView(){
  optical.forEach(object=>object.visible=!shared);
  rfEdges.forEach(object=>object.visible=shared);
  rfCar.visible=reconstruction.visible=context.visible=shared;
  canvas.dataset.view=shared?'rf-grid':'optical';
 }
 setView();
 document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
  shared=button.dataset.view==='shared';setView();
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const caption=document.querySelector('#view-caption');
  if(caption)caption.textContent=shared?'RF spatial view — geometry and observation lines.':'The vehicle observes from its own position.';
 }));
 root.rotation.y=-.12;
 return {camera:[15,15,19],look:[0,.3,0],update(t){
  waves.forEach((r,i)=>{const p=(t*.13+i*.27)%1;r.scale.setScalar(.8+p*.45);r.material.opacity=.28*(1-p)});
  signalPaths.forEach(({curve,pulse},i)=>pulse.position.copy(curve.getPoint((t*.32+i*.4)%1)));
 }};
}
try {
 const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.6));renderer.setClearColor(0,0);
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
 const scene=new T.Scene();scene.add(new T.HemisphereLight(0xfaffea,0x355949,2.4));
 const environment=new RoomEnvironment(),pmrem=new T.PMREMGenerator(renderer);
 const envTarget=pmrem.fromScene(environment,.04);scene.environment=envTarget.texture;environment.dispose();pmrem.dispose();
 const key=new T.DirectionalLight(0xfff5df,3);key.position.set(-7,12,8);scene.add(key);
 const rim=new T.DirectionalLight(0xc1e7d1,1.5);rim.position.set(6,4,-6);scene.add(rim);
 const root=new T.Group();scene.add(root);
 const design=({model:worldModel,network:infrastructure,vehicle:automotive}[mode]||worldModel)(root);
 canvas.dataset.design=mode;
 const camera=new T.PerspectiveCamera(36,1,.1,100),base=new T.Vector3(...design.camera),look=new T.Vector3(...design.look);
 let px=0,py=0,active=true,first=true,time=0,last=performance.now();
 if(!reduced)host.addEventListener('pointermove',e=>{const r=host.getBoundingClientRect();px=(e.clientX-r.left)/r.width-.5;py=(e.clientY-r.top)/r.height-.5},{passive:true});
 host.addEventListener('pointerleave',()=>{px=py=0});
 const observer=new IntersectionObserver(([entry])=>active=entry.isIntersecting,{rootMargin:'100px'});observer.observe(host);
 function size(){
  const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  root.scale.setScalar(w < 650 && mode === 'vehicle' ? .9 : (w / h < 1 ? .8 : 1));
 }
 new ResizeObserver(size).observe(host);size();
 const target=new T.Vector3();
 function frame(now){
  requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;
  if(!active||document.hidden)return;
  if(!reduced)time+=dt;
  design.update(time);
  target.copy(base);target.x+=px*.7;target.y+=py*.5;
  camera.position.lerp(target,first?1:1-Math.exp(-dt*4));first=false;camera.lookAt(look);
  renderer.render(scene,camera);canvas.dataset.ready='true';
 }
 requestAnimationFrame(frame);
 canvas.addEventListener('webglcontextlost',()=>host.classList.add('scene-fallback'));
}catch(error){canvas.hidden=true;host.classList.add('scene-fallback');console.error('Scene unavailable',error)}







