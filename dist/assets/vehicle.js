import * as T from './three.module.js';
import {GLTFLoader} from './addons/loaders/GLTFLoader.js';
import {DRACOLoader} from './addons/loaders/DRACOLoader.js';

export function vehicle() {
  const group = new T.Group();
  group.userData.loaded = false;
  const decoder = new DRACOLoader();
  decoder.setDecoderPath(new URL('./draco/', import.meta.url).href);
  decoder.setWorkerLimit(2);
  const loader = new GLTFLoader();
  loader.setDRACOLoader(decoder);

  loader.load(new URL('./ferrari.glb', import.meta.url).href, gltf => {
    const model = gltf.scene.children[0];
    const paint = new T.MeshPhysicalMaterial({color:0x307981, metalness:0.85, roughness:0.27, clearcoat:1, clearcoatRoughness:0.065});

    for (const [name, material] of [['body',paint]]) {
      const part = model.getObjectByName(name);
      if (part) part.material = material;
    }

    const malformedCabinHighlight = model.getObjectByName('interior_light');
    if (malformedCabinHighlight) malformedCabinHighlight.visible = false;

    model.traverse(object => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      if (object.material) object.material.envMapIntensity = 1.4;
    });

    const bounds = new T.Box3().setFromObject(model);
    const size = bounds.getSize(new T.Vector3());
    const center = bounds.getCenter(new T.Vector3());
    const scale = 4.55 / Math.max(size.x, size.z);
    model.scale.multiplyScalar(scale);
    model.position.set(-center.x * scale, -bounds.min.y * scale + 0.055, -center.z * scale);
    group.add(model);

    // Neutralize manufacturer branding without removing the body geometry.
    const rearBadgeMask = new T.Mesh(new T.CircleGeometry(0.105, 24), new T.MeshBasicMaterial({color:0x28777b}));
    rearBadgeMask.position.set(0, 0.96, 2.285);
    group.add(rearBadgeMask);
    model.traverse(object => { if (/^centre(?:_|$)/i.test(object.name)) object.visible = false; });

    // Use scene lighting; a rectangular baked AO plane shows against the road.
    group.userData.loaded = true;
    decoder.dispose();
  }, undefined, error => {
    console.error('Vehicle model failed to load', error);
    decoder.dispose();
  });

  // Preserve the source model's default steering and wheel transforms.
  group.updateVehicle = function() {};
  return group;
}







