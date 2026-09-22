import * as T from './three.module.js';
import { vehicle } from './vehicle.js';
import { RoomEnvironment } from './addons/environments/RoomEnvironment.js';

const canvas = document.querySelector('#experience-canvas');
const experience = document.querySelector('#experience');
const loader = document.querySelector('#experience-loader');
if (!canvas || !experience) throw new Error('Experience canvas is missing');

const isMobile = matchMedia('(max-width: 760px)').matches;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const renderer = new T.WebGLRenderer({canvas, antialias: !isMobile, powerPreference:'high-performance'});
renderer.setPixelRatio(isMobile ? 1 : Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight, false);
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.shadowMap.enabled = !isMobile;
renderer.shadowMap.type = T.PCFSoftShadowMap;

const scene = new T.Scene();
scene.background = new T.Color(0x264b55);
scene.fog = new T.FogExp2(0x264b55, .012);
const camera = new T.PerspectiveCamera(isMobile ? 54 : 44, innerWidth/innerHeight, .08, 170);

const room = new RoomEnvironment();
const pmrem = new T.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(room, .04).texture;
room.dispose(); pmrem.dispose();
scene.add(new T.HemisphereLight(0xd8f4ee, 0x17343c, .95));
const moon = new T.DirectionalLight(0xffefd0, 3.15);
moon.position.set(-9,17,12); moon.castShadow=!isMobile; scene.add(moon);
const cyanLight = new T.PointLight(0x45eaff, 10, 24, 2);
scene.add(cyanLight);

const world = new T.Group(); scene.add(world);
const roadLength = 520;
const ground = new T.Mesh(new T.PlaneGeometry(130,roadLength),new T.MeshStandardMaterial({color:0x31565a,roughness:.98}));
ground.rotation.x=-Math.PI/2; ground.position.set(0,-.13,-190); ground.receiveShadow=true; world.add(ground);
const road = new T.Mesh(new T.PlaneGeometry(10.5,roadLength),new T.MeshStandardMaterial({color:0x17353f,roughness:.88,metalness:.14}));
road.rotation.x=-Math.PI/2; road.position.set(0,-.1,-190); road.receiveShadow=true; world.add(road);

const edgeMat = new T.MeshBasicMaterial({color:0x8fdbe6,transparent:true,opacity:.26});
[-5.1,5.1].forEach(x=>{const edge=new T.Mesh(new T.BoxGeometry(.055,.025,roadLength),edgeMat);edge.position.set(x,-.055,-190);world.add(edge)});
const dashGeo=new T.BoxGeometry(.08,.028,1.85), dashMat=new T.MeshBasicMaterial({color:0xe7fbff,transparent:true,opacity:.62});
const dashCount=130, dashes=new T.InstancedMesh(dashGeo,dashMat,dashCount), dummy=new T.Object3D();
for(let i=0;i<dashCount;i++){dummy.position.set(0,-.05,65-i*4);dummy.updateMatrix();dashes.setMatrixAt(i,dummy.matrix)} world.add(dashes);

const car=vehicle(); car.scale.setScalar(1.02); car.position.set(0,0,34); world.add(car);
const underglow=new T.PointLight(0x31dfff,4.5,9,2); underglow.position.set(0,.35,1); car.add(underglow);

const nodeGroup=new T.Group(), rfGroup=new T.Group(), architecture=new T.Group(), radarArchitecture=new T.Group(); world.add(nodeGroup,rfGroup,architecture,radarArchitecture);
const radarLineMat=new T.LineBasicMaterial({color:0x6ef4ff,transparent:true,opacity:.24,blending:T.AdditiveBlending,depthWrite:false});
radarArchitecture.visible=false;
const postMat=new T.MeshStandardMaterial({color:0x365965,emissive:0x0b5363,emissiveIntensity:.65,metalness:.82,roughness:.26});
const beaconMat=new T.MeshBasicMaterial({color:0x7af6ff,transparent:true,opacity:.86});
const waveMat=new T.MeshBasicMaterial({color:0x55eaff,transparent:true,opacity:0,side:T.DoubleSide,blending:T.AdditiveBlending,depthWrite:false});
for(let i=0;i<14;i++){
  const z=20-i*32, side=i%2?1:-1, x=side*6.9;
  const post=new T.Mesh(new T.CylinderGeometry(.045,.075,4.7,9),postMat);post.position.set(x,2.2,z);nodeGroup.add(post);
  const arm=new T.Mesh(new T.BoxGeometry(1.25,.055,.055),postMat);arm.position.set(x-side*.57,4.25,z);nodeGroup.add(arm);
  const beacon=new T.Mesh(new T.SphereGeometry(.2,16,16),beaconMat.clone());beacon.position.set(x-side*1.15,4.22,z);nodeGroup.add(beacon);
  for(let j=0;j<3;j++){const ring=new T.Mesh(new T.RingGeometry(2.4+j*2.1,2.43+j*2.1,52),waveMat.clone());ring.rotation.x=-Math.PI/2;ring.position.set(x-side*1.1,.04+j*.025,z);ring.userData={phase:i*.47+j*.8};rfGroup.add(ring)}
}

const buildingMat=new T.MeshStandardMaterial({color:0x294b52,roughness:.92,metalness:.08});
for(let i=0;i<56;i++){
  const side=i%2?1:-1,h=3+((i*17)%12),w=3+((i*11)%5),depth=4+((i*7)%7);
  const geometry=new T.BoxGeometry(w,h,depth);
  const box=new T.Mesh(geometry,buildingMat);box.position.set(side*(10+((i*13)%18)),h/2-.1,52-i*9.1);architecture.add(box);
  const outline=new T.LineSegments(new T.EdgesGeometry(geometry),radarLineMat);outline.position.copy(box.position);radarArchitecture.add(outline);
}

const sceneActors=new T.Group(),radarActors=new T.Group();world.add(sceneActors,radarActors);radarActors.visible=false;
const actorMat=new T.MeshStandardMaterial({color:0x9a7655,roughness:.9}),trafficMat=new T.MeshStandardMaterial({color:0x283f49,metalness:.35,roughness:.55}),personMat=new T.MeshStandardMaterial({color:0xaab8bd,roughness:.8});
function addBox(parent,size,position,material){const mesh=new T.Mesh(new T.BoxGeometry(...size),material);mesh.position.set(...position);parent.add(mesh);return mesh}
function addRadarBox(size,position,color=0x79f4ff){const geometry=new T.BoxGeometry(...size);const line=new T.LineSegments(new T.EdgesGeometry(geometry),new T.LineBasicMaterial({color,transparent:true,opacity:.88,blending:T.AdditiveBlending}));line.position.set(...position);radarActors.add(line)}
function addDog(x,z,flip=1){addBox(sceneActors,[1.15,.48,.42],[x,.42,z],actorMat);addBox(sceneActors,[.42,.43,.4],[x+.62*flip,.66,z],actorMat);for(const dx of [-.38,.35])for(const dz of [-.13,.13])addBox(sceneActors,[.11,.42,.11],[x+dx,.2,z+dz],actorMat);addRadarBox([1.15,.48,.42],[x,.42,z],0xffce75);addRadarBox([.42,.43,.4],[x+.62*flip,.66,z],0xffce75)}
function addTraffic(x,z,color=0x294a59){const material=trafficMat.clone();material.color.setHex(color);addBox(sceneActors,[2.15,.62,4.1],[x,.42,z],material);addBox(sceneActors,[1.75,.52,1.85],[x,.96,z-.25],material);addRadarBox([2.15,.62,4.1],[x,.42,z]);addRadarBox([1.75,.52,1.85],[x,.96,z-.25])}
function addPedestrian(x,z){const body=new T.Mesh(new T.CylinderGeometry(.17,.21,1.25,8),personMat);body.position.set(x,.78,z);sceneActors.add(body);const head=new T.Mesh(new T.SphereGeometry(.22,10,8),personMat);head.position.set(x,1.58,z);sceneActors.add(head);const outline=new T.LineSegments(new T.EdgesGeometry(body.geometry),new T.LineBasicMaterial({color:0xffe1a3,transparent:true,opacity:.9}));outline.position.copy(body.position);radarActors.add(outline)}
addDog(-4.35,-173,1);addDog(5.7,-196,-1);addTraffic(2.55,-187,0x415b67);addTraffic(-2.45,-215,0x6c3437);addTraffic(2.45,-248,0x334455);addPedestrian(5.8,-181);addPedestrian(-6.1,-226);for(let i=0;i<4;i++){addBox(sceneActors,[.7,.75,.32],[-4.7+i*.8,.35,-205],new T.MeshStandardMaterial({color:0xe38d2d,roughness:.8}));addRadarBox([.7,.75,.32],[-4.7+i*.8,.35,-205],0xffb763)}
const vehicleScan=new T.Group();world.add(vehicleScan);vehicleScan.visible=false;for(let i=0;i<5;i++){const ring=new T.Mesh(new T.RingGeometry(1.8+i*1.55,1.835+i*1.55,84),new T.MeshBasicMaterial({color:i===4?0xffcf86:0x7af5ff,side:T.DoubleSide,transparent:true,opacity:.35,blending:T.AdditiveBlending,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.07+i*.018;ring.userData.phase=i*.23;vehicleScan.add(ring)}
const pointCount=isMobile?480:1100, pts=new Float32Array(pointCount*3);
for(let i=0;i<pointCount;i++){pts[i*3]=(Math.random()-.5)*25;pts[i*3+1]=Math.random()*7;pts[i*3+2]=45-Math.random()*450}
const pointsGeo=new T.BufferGeometry();pointsGeo.setAttribute('position',new T.BufferAttribute(pts,3));
const pointsMat=new T.PointsMaterial({color:0x80efff,size:.045,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false});
const fieldPoints=new T.Points(pointsGeo,pointsMat);world.add(fieldPoints);

const grid=new T.GridHelper(520,130,0x42e7ff,0x153e49);grid.rotation.z=0;grid.position.set(0,.02,-190);grid.material.transparent=true;grid.material.opacity=0;world.add(grid);
const opticalFadeMaterials=new Map(),radarFadeMaterials=new Map();
function registerFade(root,map){root.traverse(object=>{if(!object.material)return;const materials=Array.isArray(object.material)?object.material:[object.material];materials.filter(Boolean).forEach(material=>{if(!map.has(material)){map.set(material,material.opacity);material.transparent=true}})})}
[ground,road,dashes,architecture,nodeGroup,sceneActors].forEach(root=>registerFade(root,opticalFadeMaterials));
[radarArchitecture,radarActors,vehicleScan].forEach(root=>registerFade(root,radarFadeMaterials));
function applyFade(map,alpha){map.forEach((base,material)=>{material.opacity=base*alpha;material.visible=alpha>.006})}
const radarCarMat=new T.LineBasicMaterial({color:0xa5f9ff,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false});
const carSolidMaterials=new Set();
let radarCarPrepared=false;
function prepareRadarCar(){
  if(radarCarPrepared)return;
  radarCarPrepared=true;
  car.traverse(object=>{
    if(!object.isMesh||!object.geometry)return;
    const materials=Array.isArray(object.material)?object.material:[object.material];
    materials.filter(Boolean).forEach(material=>carSolidMaterials.add(material));
    if(object.geometry.type==='PlaneGeometry')return;
    const outline=new T.LineSegments(new T.EdgesGeometry(object.geometry,24),radarCarMat);
    outline.renderOrder=8;
    object.add(outline);
  });
}

let target=0, progress=0, previousCarZ=34, previousTime=0;
const railProgress=document.querySelector('#rail-progress'),railIndex=document.querySelector('#rail-index'),mode=document.querySelector('#telemetry-mode'),distance=document.querySelector('#telemetry-distance'),viewIndex=document.querySelector('#view-sequence-index'),viewLabel=document.querySelector('#view-sequence-label');
const chapters=[...document.querySelectorAll('[data-scene-step]')];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,t)=>a+(b-a)*(t*t*t*(t*(t*6-15)+10));
function updateScroll(){const intro=document.querySelector(".brand-intro")?.offsetHeight||0;const total=document.documentElement.scrollHeight-innerHeight-intro;target=total>0?clamp((scrollY-intro)/total):0} addEventListener('scroll',updateScroll,{passive:true});updateScroll();
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=isMobile?54:44;camera.updateProjectionMatrix()} addEventListener('resize',()=>{resize();updateScroll()},{passive:true});

function frame(now){const dt=Math.min((now-previousTime)/1000,.05)||.016;previousTime=now;progress+= (target-progress)*(reducedMotion?1:1-Math.exp(-dt*7));
  const carZ=34-progress*414, laneDrift=Math.sin(progress*Math.PI*3.1)*.5; car.position.set(laneDrift,0,carZ);car.rotation.y=Math.sin(progress*Math.PI*3.1)*-.035; if(car.updateVehicle)car.updateVehicle(carZ-previousCarZ,car.rotation.y);previousCarZ=carZ;underglow.intensity=3+Math.sin(now*.004)*.7;
  const zoom=smooth(0,1,clamp((progress-.2)/.22)),pov=smooth(0,1,clamp((progress-.36)/.22)),aerial=smooth(0,1,clamp((progress-.82)/.15));
  const cockpitReveal=smooth(0,1,clamp((progress-.455)/.125))*(1-smooth(0,1,clamp((progress-.81)/.11)));
  const chase=new T.Vector3(laneDrift-(isMobile?3.2:5.8),isMobile?4.1:3.35,carZ+(isMobile?13.5:10.5)),closeView=new T.Vector3(laneDrift-2.65,1.95,carZ+6.2),cockpit=new T.Vector3(laneDrift,1.08,carZ-1.15),drone=new T.Vector3(laneDrift+10,13.5,carZ+13);
  const camPos=new T.Vector3().lerpVectors(chase,closeView,zoom).lerp(cockpit,pov).lerp(drone,aerial);
  camera.position.copy(camPos); // Progress is damped once; camera and car stay in the same moving frame.
  const exteriorLook=new T.Vector3(laneDrift,.85,carZ-(isMobile?1.5:5.8)),povLook=new T.Vector3(laneDrift,.72,carZ-22),droneLook=new T.Vector3(laneDrift,0,carZ-9);const look=new T.Vector3().lerpVectors(exteriorLook,povLook,pov).lerp(droneLook,aerial);camera.lookAt(look);
  cyanLight.position.set(laneDrift,3,carZ-4);
  const radarMix=smooth(0,1,clamp((progress-.46)/.18));
  const opticalMix=1-radarMix;
  const cockpitActive=cockpitReveal>.025;
  applyFade(opticalFadeMaterials,opticalMix);
  applyFade(radarFadeMaterials,radarMix);
  radarArchitecture.visible=radarActors.visible=vehicleScan.visible=radarMix>.006;
  sceneActors.visible=architecture.visible=nodeGroup.visible=road.visible=ground.visible=dashes.visible=opticalMix>.006;
  vehicleScan.position.set(laneDrift,0,carZ);
  vehicleScan.children.forEach((ring,index)=>{const pulse=1+Math.sin(now*.0018-index*.52)*.035;ring.scale.setScalar(pulse)});
  underglow.visible=opticalMix*(1-cockpitReveal)>.02;
  underglow.intensity=(3+Math.sin(now*.004)*.7)*opticalMix*(1-cockpitReveal);
  carSolidMaterials.forEach(material=>{if(material.userData.cosmicBaseOpacity===undefined)material.userData.cosmicBaseOpacity=material.opacity;material.transparent=true;const alpha=(1-smooth(0,1,clamp((progress-.405)/.075)))*(1-radarMix)+aerial*radarMix*.08;material.opacity=material.userData.cosmicBaseOpacity*alpha;material.visible=alpha>.008});
  radarCarMat.opacity=radarMix*aerial*.94;
  edgeMat.opacity=.26+radarMix*.46;
  document.documentElement.style.setProperty('--radar-reveal',cockpitReveal.toFixed(3));
  document.documentElement.style.setProperty('--radar-y','0px');
  document.documentElement.style.setProperty('--radar-scale',(.54+cockpitReveal*.46).toFixed(4));
  document.documentElement.style.setProperty('--radar-bottom','5vh');
  document.documentElement.style.setProperty('--radar-y',(-(1-cockpitReveal)*innerHeight*.22).toFixed(2)+'px');
  document.documentElement.style.setProperty('--rf-mix',radarMix.toFixed(3));
  rfGroup.children.forEach(ring=>{
    ring.material.opacity=(.075+radarMix*.125)+(.025+radarMix*.075)*Math.sin(now*.0025+ring.userData.phase);
    const pulse=1+(.5-.5*Math.cos(now*.0011+ring.userData.phase))*.22;
    ring.scale.setScalar(pulse);
  });
  pointsMat.opacity=radarMix*.38;
  grid.material.opacity=radarMix*.2;
  document.body.classList.toggle('rf-only',radarMix>.5);
  document.body.classList.toggle('cockpit-view',cockpitActive);
  document.body.classList.toggle('final-view',progress>=.88);
  const viewStage=progress<.24?['01','NORMAL VIEW']:progress<.43?['02','ZOOM / VEHICLE PERSPECTIVE']:progress<.88?['03','IN-CAR 360° RF SCREEN']:['',''];
  if(viewIndex)viewIndex.textContent=viewStage[0];if(viewLabel)viewLabel.textContent=viewStage[1];
  const current=Math.min(5,Math.floor(progress*6));chapters.forEach((el,i)=>el.classList.toggle('is-current',i===current));if(railProgress)railProgress.style.height=`${progress*100}%`;if(railIndex)railIndex.textContent=String(current+1).padStart(2,'0');if(distance)distance.textContent=`${Math.round(progress*414).toString().padStart(3,'0')} M`;if(mode)mode.textContent=aerial>.45?'NETWORK / LIVE':pov>.5?'VEHICLE / RF POV':'CHASE / OPTICAL';
  renderer.render(scene,camera);requestAnimationFrame(frame)}

const readyTimer=setInterval(()=>{if(car.userData.loaded){clearInterval(readyTimer);prepareRadarCar();loader?.classList.add('is-ready')}},80);setTimeout(()=>loader?.classList.add('is-ready'),4200);requestAnimationFrame(frame);




















