import * as T from './three.module.js';

export function createObstacles(world) {
  const group = new T.Group();
  world.add(group);

  // Construction barricade
  const bGeo = new T.BoxGeometry(2.0, 0.6, 0.2);
  const bMat = new T.MeshStandardMaterial({color: 0xffaa00, roughness: 0.7});
  const barricade = new T.Mesh(bGeo, bMat);
  barricade.position.set(1.5, 0.3, 0);
  
  // Reflector stripes
  for(let i=-0.8; i<=0.8; i+=0.4) {
     const stripe = new T.Mesh(new T.PlaneGeometry(0.2, 0.6), new T.MeshBasicMaterial({color: 0xffffff}));
     stripe.position.set(i, 0, 0.11);
     stripe.rotation.z = 0.3;
     barricade.add(stripe);
  }
  group.add(barricade);

  // Stalled box truck
  const truck = new T.Group();
  const tBody = new T.Mesh(new T.BoxGeometry(2.2, 1.8, 5.0), new T.MeshStandardMaterial({color: 0xffffff, roughness: 0.6}));
  tBody.position.set(0, 0.9, 0);
  truck.add(tBody);
  const tCab = new T.Mesh(new T.BoxGeometry(2.2, 1.4, 1.5), new T.MeshStandardMaterial({color: 0x334455, roughness: 0.5}));
  tCab.position.set(0, 0.7, -3.25);
  truck.add(tCab);
  truck.position.set(1.5, 0, -4);
  group.add(truck);

  // 3D Skill: Use InstancedMesh for traffic cones
  const coneCount = Math.ceil((12-4)/1.5) + Math.ceil((2 - -8)/2) + Math.ceil((-10 - -16)/1.5) + 3; // buffer
  const coneGeo = new T.ConeGeometry(0.15, 0.6, 16);
  const coneMat = new T.MeshStandardMaterial({color: 0xff4400, roughness: 0.5});
  const stripeGeo = new T.CylinderGeometry(0.13, 0.14, 0.12, 16);
  const stripeMat = new T.MeshStandardMaterial({color: 0xffffff, roughness: 0.2});

  const coneInst = new T.InstancedMesh(coneGeo, coneMat, coneCount);
  const stripeInst = new T.InstancedMesh(stripeGeo, stripeMat, coneCount);
  
  let cIdx = 0;
  const dummy = new T.Object3D();
  
  const placeCone = (x, z) => {
    if (cIdx >= coneCount) return;
    dummy.position.set(x, 0.3, z);
    dummy.updateMatrix();
    coneInst.setMatrixAt(cIdx, dummy.matrix);
    
    dummy.position.set(x, 0.35, z);
    dummy.updateMatrix();
    stripeInst.setMatrixAt(cIdx, dummy.matrix);
    cIdx++;
  };

  for(let z=12; z>=4; z-=1.5) {
     const t = (12 - z) / 8;
     placeCone(3.0 - t * 3.0, z);
  }
  for(let z=2; z>=-8; z-=2) {
     placeCone(0.0, z);
  }
  for(let z=-10; z>=-16; z-=1.5) {
     const t = (-10 - z) / 6;
     placeCone(0.0 + t * 3.0, z);
  }

  coneInst.count = cIdx;
  stripeInst.count = cIdx;
  coneInst.instanceMatrix.needsUpdate = true;
  stripeInst.instanceMatrix.needsUpdate = true;
  
  group.add(coneInst);
  group.add(stripeInst);

  return group;
}