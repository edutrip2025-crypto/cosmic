import * as T from './three.module.js';

export function createPremiumNode(nx, nz, idx) {
  const group = new T.Group();
  group.position.set(nx, 0, nz);

  const poleMat = new T.MeshStandardMaterial({color:0x1a2228, metalness:0.85, roughness:0.25});
  const glassMat = new T.MeshPhysicalMaterial({color:0x050505, metalness:0.9, roughness:0.1, clearcoat:1.0, transparent:true, opacity:0.85});
  const ledMat = new T.MeshStandardMaterial({color:0x00aaff, emissive:0x00ccff, emissiveIntensity:1.5});

  // Sleek pole
  const pole = new T.Mesh(new T.CylinderGeometry(0.08, 0.12, 4.0, 24), poleMat);
  pole.position.y = 2.0;
  group.add(pole);

  // Sensor enclosure base
  const base = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 0.25, 24), poleMat);
  base.position.y = 4.125;
  group.add(base);

  // Rotating inner sensor (radar/lidar head)
  const radar = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 0.2, 16), new T.MeshStandardMaterial({color:0x444444, roughness:0.4}));
  radar.position.y = 4.35;
  group.add(radar);
  
  // A slight detail on the radar so rotation is visible
  const lens = new T.Mesh(new T.BoxGeometry(0.12, 0.12, 0.12), new T.MeshStandardMaterial({color:0x050505, roughness:0.1}));
  lens.position.set(0, 0, 0.06);
  radar.add(lens);

  // Tinted glass radome over the sensor
  const dome = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 0.35, 24), glassMat);
  dome.position.y = 4.425;
  group.add(dome);
  
  const cap = new T.Mesh(new T.SphereGeometry(0.14, 24, 16, 0, Math.PI*2, 0, Math.PI/2), poleMat);
  cap.position.y = 4.6;
  group.add(cap);

  // Subtle LED status ring
  const ring = new T.Mesh(new T.CylinderGeometry(0.141, 0.141, 0.04, 24), ledMat);
  ring.position.y = 4.22;
  group.add(ring);

  // Ground rings for the RF visual (subtle)
  const rings = [];
  for (let j = 0; j < 4; j++) {
    const rm = new T.Mesh(
      new T.TorusGeometry(1, 0.015, 4, 64),
      new T.MeshBasicMaterial({color:0x00aaff, transparent:true, opacity:0.15, depthWrite:false, blending:T.AdditiveBlending})
    );
    rm.rotation.x = -Math.PI/2;
    rm.position.set(nx, 0.02, nz);
    rings.push({m:rm, offset:idx*0.25 + j*0.25});
  }

  return {
    group,
    rings,
    update(t, visible) {
      if (!visible) { rings.forEach(({m})=>m.visible=false); return; }
      
      // Natural radar rotation (fast)
      radar.rotation.y = t * 4.0;
      
      // Pulse LED ring gently
      const pulse = 1.0 + 0.5 * Math.sin(t * 1.5 + idx);
      ledMat.emissiveIntensity = pulse;
      
      // Propagating rings
      rings.forEach(({m,offset}) => {
        const f = (t*0.25 + offset) % 1;
        m.scale.setScalar(1 + f*12);
        m.material.opacity = (1 - f) * 0.25;
        m.visible = true;
      });
    }
  };
}