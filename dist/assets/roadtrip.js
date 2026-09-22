import * as T from './three.module.js';
import { vehicle } from './vehicle.js';

const canvas = document.querySelector('#roadtrip-scene');
const section = document.querySelector('#roadtrip');
if (!canvas || !section) throw new Error('Roadtrip scene is not mounted');
const host = canvas.parentElement;
const isMobile = matchMedia('(max-width: 720px)').matches;
const renderer = new T.WebGLRenderer({canvas, antialias: !isMobile, alpha: false});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x071119, 1);
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new T.Scene();
scene.fog = new T.Fog(0x071119, 18, 58);
const camera = new T.PerspectiveCamera(42, 1, 0.1, 120);
const world = new T.Group();
scene.add(world);
scene.add(new T.HemisphereLight(0x9fd8ff, 0x02060a, 1.1));
const key = new T.DirectionalLight(0xeaf6ff, 2.4);
key.position.set(-7, 12, 8);
scene.add(key);

const ground = new T.Mesh(new T.PlaneGeometry(100, 150), new T.MeshStandardMaterial({color:0x0a171e, roughness:1}));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.13; world.add(ground);
const road = new T.Mesh(new T.PlaneGeometry(7.4, 120), new T.MeshStandardMaterial({color:0x121f27, roughness:.94, metalness:.08}));
road.rotation.x = -Math.PI / 2; road.position.y = -0.1; world.add(road);
const laneMat = new T.MeshBasicMaterial({color:0xcdeaff});
for (let z=-58; z<62; z+=4) {
  const dash = new T.Mesh(new T.BoxGeometry(.08,.025,1.65), laneMat);
  dash.position.set(0,-.055,z); world.add(dash);
}
[-3.72,3.72].forEach(x => { const curb=new T.Mesh(new T.BoxGeometry(.15,.16,120),new T.MeshStandardMaterial({color:0x29404c})); curb.position.set(x,-.02,0); world.add(curb); });

const car = vehicle();
car.scale.setScalar(.92); world.add(car);
const carGlow = new T.Mesh(new T.PlaneGeometry(3.2,5.7),new T.MeshBasicMaterial({color:0x00b8d9,transparent:true,opacity:.055,blending:T.AdditiveBlending,depthWrite:false}));
carGlow.rotation.x=-Math.PI/2; carGlow.position.y=-.065; car.add(carGlow);

const rfGroup = new T.Group(); world.add(rfGroup);
const rfLines = [];
for (let i=0;i<9;i++) {
  const r = new T.Mesh(new T.RingGeometry(1.3+i*.58,1.31+i*.58,64),new T.MeshBasicMaterial({color:0x00d9ff,transparent:true,opacity:0,side:T.DoubleSide,blending:T.AdditiveBlending,depthWrite:false}));
  r.rotation.x=-Math.PI/2; r.position.y=.08+i*.018; rfGroup.add(r); rfLines.push(r);
}
const nodeMat = new T.MeshBasicMaterial({color:0x35e9ff,transparent:true,opacity:.0,blending:T.AdditiveBlending});
[-3.85,3.85].forEach(x=>{const post=new T.Mesh(new T.CylinderGeometry(.06,.08,3.7,12),new T.MeshStandardMaterial({color:0x3f6370,metalness:.5,roughness:.4}));post.position.set(x,1.75,-9);world.add(post);const beacon=new T.Mesh(new T.SphereGeometry(.22,16,16),nodeMat);beacon.position.set(x,3.6,-9);world.add(beacon);});
const rfLabel = document.querySelector('#roadtrip-view-label');
const status = document.querySelector('#roadtrip-status');
const readout = document.querySelector('#roadtrip-readout');
const fill = document.querySelector('#roadtrip-progress-fill');
const steps = [...document.querySelectorAll('[data-road-step]')];
let progress=0,targetProgress=0,last=0;
function clamp(n,a=0,b=1){return Math.max(a,Math.min(b,n));}
function updateScroll(){const r=section.getBoundingClientRect(); targetProgress=clamp(-r.top/Math.max(section.offsetHeight-innerHeight,1));}
addEventListener('scroll',updateScroll,{passive:true}); addEventListener('resize',updateScroll); updateScroll();
function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();} new ResizeObserver(resize).observe(host); resize();
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;progress += (targetProgress-progress)*Math.min(1,dt*7);const travel=clamp(progress/.56);const pov=clamp((progress-.48)/.27);
  car.position.set(0,0,5.0-travel*14.5); car.rotation.y=0; if(car.updateVehicle) car.updateVehicle(-dt*1.8,0);
  const vehicleView=new T.Vector3(0,3.0,12.6-travel*2.4); const rfView=new T.Vector3(0,1.65,1.7-travel*1.4); camera.position.lerpVectors(vehicleView,rfView,pov); camera.lookAt(new T.Vector3(0,.8,car.position.z-4.8));
  rfGroup.position.set(0,0,car.position.z-8); rfGroup.scale.setScalar(.65+pov*1.2); rfLines.forEach((line,i)=>{line.material.opacity=pov*(.12+Math.sin(now*.002+i)*.04);line.scale.setScalar(1+Math.sin(now*.002+i)*.025);});
  if(fill) fill.style.width=`${Math.round(progress*100)}%`; const step=progress<.28?0:progress<.58?1:2; steps.forEach((el,i)=>el.classList.toggle('is-active',i===step)); if(status)status.textContent=pov>.55?'RF perception view':step===1?'Roadside handoff':'Vehicle view'; if(rfLabel)rfLabel.textContent=pov>.55?'RF POV / SHARED WORLD MODEL':'LIVE ROAD VIEW'; if(readout)readout.textContent=`${(travel*100).toFixed(1)} m`;
  renderer.render(scene,camera); requestAnimationFrame(frame);
} requestAnimationFrame(frame);
