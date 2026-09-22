import * as T from './three.module.js';

export function createCity(world) {
  const group = new T.Group();
  world.add(group);

  // Layout parameters similar to the WebGPU city generator
  const blocksX = 4;
  const blocksZ = 8;
  const streetW = 5;
  const blockW = 18;
  const blockD = 18;
  const lotsX = 2;
  const lotsZ = 2;

  let seed = 94;
  const random = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // Neo-Gothic terracotta color palette
  const palettes = [
    0x8b5a45, // Terracotta
    0x6b4c41, // Dark brown
    0x9c7a65, // Light clay
    0x5c6a72, // Slate grey
    0x8a9296, // Light grey
    0x3d3532, // Dark charcoal
  ];

  const cityW = blocksX * blockW + (blocksX - 1) * streetW;
  const cityD = blocksZ * blockD + (blocksZ - 1) * streetW;

  const geometries = [];
  const materials = [];

  for (let c of palettes) {
    materials.push(new T.MeshStandardMaterial({
      color: c,
      roughness: 0.8,
      metalness: 0.1,
    }));
  }
  
  // A glowing window material for the recessed windows
  const windowMat = new T.MeshStandardMaterial({
    color: 0x111111,
    emissive: 0xffddaa,
    emissiveIntensity: 0.8, // subtle glow
    roughness: 0.2,
    metalness: 0.8
  });
  materials.push(windowMat);

  // We will build the city using standard meshes but heavily optimized
  // Since we want setbacks and chamfers, we can compose each building out of a few boxes.
  const innerLotX = blockW / lotsX;
  const innerLotZ = blockD / lotsZ;

  for (let bx = 0; bx < blocksX; bx++) {
    for (let bz = 0; bz < blocksZ; bz++) {
      
      // Keep clear of the central avenue where the car is (x around 0)
      const blockCX = -cityW/2 + bx * (blockW + streetW) + blockW/2;
      const blockCZ = -cityD/2 + bz * (blockD + streetW) + blockD/2;

      // Skip the blocks that intersect the main road (x near 0)
      if (Math.abs(blockCX) < streetW/2 + blockW/2) continue;

      for (let lx = 0; lx < lotsX; lx++) {
        for (let lz = 0; lz < lotsZ; lz++) {
          
          const tall = random();
          const fw = innerLotX - (0.4 + random() * 1);
          const fd = innerLotZ - (0.4 + random() * 1);
          
          // Heights: from 10 to 60 units (scaled down slightly for our scene)
          const totalHeight = 15 + tall * tall * 60;
          
          const lotCX = blockCX - blockW/2 + lx * innerLotX + innerLotX/2;
          const lotCZ = blockCZ - blockD/2 + lz * innerLotZ + innerLotZ/2;

          const matIdx = Math.floor(random() * palettes.length);
          const baseMat = materials[matIdx];
          
          // Base tier
          const baseMesh = new T.Mesh(new T.BoxGeometry(fw, totalHeight * 0.6, fd), baseMat);
          baseMesh.position.set(lotCX, totalHeight * 0.3, lotCZ);
          group.add(baseMesh);

          // Add a window layer slightly inset
          const winMesh = new T.Mesh(new T.BoxGeometry(fw - 0.2, totalHeight * 0.55, fd - 0.2), windowMat);
          winMesh.position.set(lotCX, totalHeight * 0.3, lotCZ);
          group.add(winMesh);

          // Setback tier
          if (random() > 0.3 && totalHeight > 25) {
            const sh = totalHeight * 0.3;
            const sw = fw * 0.75;
            const sd = fd * 0.75;
            const midMesh = new T.Mesh(new T.BoxGeometry(sw, sh, sd), baseMat);
            midMesh.position.set(lotCX, totalHeight * 0.6 + sh/2, lotCZ);
            group.add(midMesh);

            const winMid = new T.Mesh(new T.BoxGeometry(sw - 0.2, sh - 1, sd - 0.2), windowMat);
            winMid.position.set(lotCX, totalHeight * 0.6 + sh/2, lotCZ);
            group.add(winMid);

            // Crown tier
            if (random() > 0.5) {
              const ch = totalHeight * 0.1;
              const cw = sw * 0.6;
              const cd = sd * 0.6;
              const crown = new T.Mesh(new T.BoxGeometry(cw, ch, cd), baseMat);
              crown.position.set(lotCX, totalHeight * 0.9 + ch/2, lotCZ);
              group.add(crown);
            }
          }
        }
      }
    }
  }

  // A function to update the glowing windows slightly if needed
  return { group, update(_t) {
      windowMat.emissiveIntensity = 0.5 + 0.1 * Math.sin(_t);
  } };
}