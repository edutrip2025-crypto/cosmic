import * as T from './three.module.js';

export function createRFBackground(scene) {
  const group = new T.Group();
  scene.add(group);

  // === Animated sine-wave grid ===
  const SEGS = 52, SZ = 130;
  const verts = new Float32Array((SEGS+1)*(SEGS+1)*3);
  const cols  = new Float32Array((SEGS+1)*(SEGS+1)*3);
  for (let i = 0; i <= SEGS; i++) {
    for (let j = 0; j <= SEGS; j++) {
      const idx = (i*(SEGS+1)+j)*3;
      verts[idx]   = (j/SEGS-0.5)*SZ;
      verts[idx+1] = 0;
      verts[idx+2] = (i/SEGS-0.5)*SZ;
      cols[idx] = 0.0; cols[idx+1] = 0.48; cols[idx+2] = 0.55;
    }
  }
  const wIdx = [];
  for (let i = 0; i < SEGS; i++) {
    for (let j = 0; j < SEGS; j++) {
      const a = i*(SEGS+1)+j;
      wIdx.push(a, a+1, a+SEGS+1, a+1, a+SEGS+2, a+SEGS+1);
    }
  }
  const wGeo = new T.BufferGeometry();
  wGeo.setAttribute('position', new T.BufferAttribute(verts,3));
  wGeo.setAttribute('color',    new T.BufferAttribute(cols,3));
  wGeo.setIndex(wIdx);
  const wave = new T.Mesh(wGeo, new T.MeshBasicMaterial({vertexColors:true,wireframe:true,transparent:true,opacity:0.11,depthWrite:false}));
  wave.position.set(0,-10,-50);
  wave.rotation.x = -0.13;
  group.add(wave);

  // === Spiral galaxy — 2-arm, 3000 pts ===
  const N = 3000;
  const sPos = new Float32Array(N*3), sCol = new Float32Array(N*3);
  for (let i = 0; i < N; i++) {
    const t = i/N, arm = i%2;
    const ang = t*Math.PI*14 + arm*Math.PI;
    const rad = 6 + t*48;
    const spread = (Math.random()-0.5)*rad*0.22;
    sPos[i*3]   = Math.cos(ang)*rad + spread;
    sPos[i*3+1] = (Math.random()-0.5)*7*t;
    sPos[i*3+2] = Math.sin(ang)*rad + spread;
    const c = 0.2+t*0.8;
    sCol[i*3]=0; sCol[i*3+1]=c*0.72; sCol[i*3+2]=c;
  }
  const sGeo = new T.BufferGeometry();
  sGeo.setAttribute('position', new T.BufferAttribute(sPos,3));
  sGeo.setAttribute('color',    new T.BufferAttribute(sCol,3));
  const spiral = new T.Points(sGeo, new T.PointsMaterial({vertexColors:true,size:0.11,transparent:true,opacity:0.8,sizeAttenuation:true,depthWrite:false,blending:T.AdditiveBlending}));
  spiral.position.set(0,24,-58);
  group.add(spiral);

  // === Double helix (2 arms, left and right of scene) ===
  for (let arm = 0; arm < 2; arm++) {
    const NH = 600, hPos = new Float32Array(NH*3);
    for (let i = 0; i < NH; i++) {
      const t = i/NH, a = t*Math.PI*20 + arm*Math.PI;
      hPos[i*3]   = Math.cos(a)*2.6;
      hPos[i*3+1] = t*48 - 24;
      hPos[i*3+2] = Math.sin(a)*2.6;
    }
    const hGeo = new T.BufferGeometry();
    hGeo.setAttribute('position', new T.BufferAttribute(hPos,3));
    const helix = new T.Line(hGeo, new T.LineBasicMaterial({color: arm===0 ? 0x00c8e0 : 0x0055b8, transparent:true, opacity:0.42}));
    helix.position.set(arm===0 ? -26 : 26, -6, -16);
    group.add(helix);
  }

  // === Corkscrew arches flanking road ===
  for (let arch = 0; arch < 4; arch++) {
    const NA = 350, aPos = new Float32Array(NA*3);
    const side = arch%2===0 ? -1 : 1;
    for (let i = 0; i < NA; i++) {
      const t = i/NA, a = t*Math.PI*7;
      aPos[i*3]   = side*(5.5 + Math.cos(a)*1.8);
      aPos[i*3+1] = t*14;
      aPos[i*3+2] = t*26 - 22 + Math.floor(arch/2)*14;
    }
    const aGeo = new T.BufferGeometry();
    aGeo.setAttribute('position', new T.BufferAttribute(aPos,3));
    const archLine = new T.Line(aGeo, new T.LineBasicMaterial({color:0x007888,transparent:true,opacity:0.3}));
    group.add(archLine);
  }

  // === Large propagating scene rings ===
  const rings = [];
  for (let i = 0; i < 8; i++) {
    const rm = new T.Mesh(
      new T.TorusGeometry(1,0.016,8,80),
      new T.MeshBasicMaterial({color:0x00c8d8,transparent:true,opacity:0.5,depthWrite:false,blending:T.AdditiveBlending})
    );
    rm.rotation.x = -Math.PI/2;
    rm.position.y = 0.07;
    group.add(rm);
    rings.push({m:rm, phase:i/8});
  }

  // === Vertical EM wave plane (side panel, far left) ===
  const vpSegs = 30, vpH = 40, vpW = 60;
  const vpPos = new Float32Array((vpSegs+1)*(vpSegs+1)*3);
  for (let i = 0; i <= vpSegs; i++) {
    for (let j = 0; j <= vpSegs; j++) {
      const k = (i*(vpSegs+1)+j)*3;
      vpPos[k]   = (j/vpSegs-0.5)*vpW;
      vpPos[k+1] = (i/vpSegs)*vpH;
      vpPos[k+2] = 0;
    }
  }
  const vpIdx = [];
  for (let i = 0; i < vpSegs; i++) {
    for (let j = 0; j < vpSegs; j++) {
      const a = i*(vpSegs+1)+j;
      vpIdx.push(a,a+1,a+vpSegs+1,a+1,a+vpSegs+2,a+vpSegs+1);
    }
  }
  const vpGeo = new T.BufferGeometry();
  vpGeo.setAttribute('position', new T.BufferAttribute(vpPos,3));
  vpGeo.setIndex(vpIdx);
  const vPanel = new T.Mesh(vpGeo, new T.MeshBasicMaterial({color:0x003848,wireframe:true,transparent:true,opacity:0.08,depthWrite:false}));
  vPanel.position.set(-38, 0, -15);
  vPanel.rotation.y = 0.4;
  group.add(vPanel);
  const vPanel2 = vPanel.clone();
  vPanel2.position.set(38, 0, -15);
  vPanel2.rotation.y = -0.4;
  group.add(vPanel2);

  return {
    group,
    update(t) {
      const pos = wGeo.attributes.position;
      for (let i = 0; i <= SEGS; i++) {
        for (let j = 0; j <= SEGS; j++) {
          const idx = i*(SEGS+1)+j;
          const x = (j/SEGS-0.5)*SZ, z = (i/SEGS-0.5)*SZ;
          const d = Math.sqrt(x*x+z*z);
          pos.setY(idx, 3.0*Math.sin(0.11*x+t*0.6)*Math.cos(0.09*z+t*0.45)*Math.exp(-d*0.006));
        }
      }
      pos.needsUpdate = true;
      spiral.rotation.y = t*0.032;
      rings.forEach(({m, phase}) => {
        const f = (t*0.2+phase)%1;
        m.scale.setScalar(1+f*30);
        m.material.opacity = (1-f)*0.4;
      });
      // Animate vertical panels
      const vpPos2 = vpGeo.attributes.position;
      for (let i = 0; i <= vpSegs; i++) {
        for (let j = 0; j <= vpSegs; j++) {
          const k = i*(vpSegs+1)+j;
          const y = (i/vpSegs)*vpH, x = (j/vpSegs-0.5)*vpW;
          vpPos2.setZ(k, 2.5*Math.sin(0.14*x + 0.18*y + t*0.7)*Math.cos(0.12*y - t*0.5));
        }
      }
      vpPos2.needsUpdate = true;
    }
  };
}