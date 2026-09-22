import * as T from './three.module.js';

export function createScrollAnimation(camera, car, nodes, links, cloud, buildings, fields, canvas) {
  const root = document.querySelector('#journey');
  if (!root) return null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const chapters = [
    {
      label: 'COSMIC / CHAPTER 01',
      title: 'The road has<br>never seen this clearly.',
      copy: 'Cosmic deploys roadside RF sensors that continuously observe the world — detecting vehicles, pedestrians, and obstacles the onboard system never knew were there.',
      nodeLabel: 'Cosmic RF node · active',
      carLabel: 'Autonomous vehicle',
      status: '01 — ACTIVE SENSING'
    },
    {
      label: 'COSMIC / CHAPTER 02',
      title: 'Every corner.<br>Every angle. Covered.',
      copy: 'A distributed network of nodes creates overlapping fields of observation. No dead zone. No blind spot. Just a continuous, high-resolution picture of the street.',
      nodeLabel: 'Multi-node overlap',
      carLabel: 'Inside the coverage field',
      status: '02 — OVERLAPPING COVERAGE'
    },
    {
      label: 'COSMIC / CHAPTER 03',
      title: 'One shared model<br>of reality.',
      copy: 'Node observations are fused in real time into a single spatial world model — streamed directly to vehicles, giving them a view far beyond their own sensors.',
      nodeLabel: 'Spatial data broadcast',
      carLabel: 'Receiving world model',
      status: '03 — SPATIAL FUSION'
    },
    {
      label: 'COSMIC / CHAPTER 04',
      title: 'Confidence<br>at every turn.',
      copy: 'Armed with Cosmic\'s spatial world model, autonomous vehicles can anticipate hazards, navigate complex intersections, and move with certainty.',
      nodeLabel: 'Live hazard broadcast',
      carLabel: 'Navigating with confidence',
      status: '04 — SAFE NAVIGATION'
    }
  ];

  const elLabel  = document.querySelector('#chapter-label');
  const elTitle  = document.querySelector('#chapter-title');
  const elCopy   = document.querySelector('#chapter-copy');
  const elStatus = document.querySelector('#scene-status');
  const elFill   = document.querySelector('#journey-fill');
  const elNLabel = document.querySelector('#node-label');
  const elCLabel = document.querySelector('#car-label');
  const copyBox  = elTitle && elTitle.closest('.journey-copy');

  let current = -1, progress = 0, labelAlpha = 0;

  function applyChapter(ch) {
    if (ch === current) return;
    current = ch;
    const c = chapters[ch];
    if (copyBox) {
      copyBox.classList.add('journey-copy--fade');
      setTimeout(() => {
        if (elLabel)  elLabel.textContent  = c.label;
        if (elTitle)  elTitle.innerHTML    = c.title;
        if (elCopy)   elCopy.textContent   = c.copy;
        if (elNLabel) elNLabel.textContent = c.nodeLabel;
        if (elCLabel) elCLabel.textContent = c.carLabel;
        copyBox.classList.remove('journey-copy--fade');
      }, reduced ? 0 : 200);
    } else {
      if (elLabel)  elLabel.textContent  = c.label;
      if (elTitle)  elTitle.innerHTML    = c.title;
      if (elCopy)   elCopy.textContent   = c.copy;
      if (elNLabel) elNLabel.textContent = c.nodeLabel;
      if (elCLabel) elCLabel.textContent = c.carLabel;
    }
    if (elStatus) elStatus.textContent = c.status;
  }

  function update() {
    const bounds = root.getBoundingClientRect();
    const total  = root.offsetHeight - innerHeight;
    progress     = T.MathUtils.clamp(-bounds.top / Math.max(total, 1), 0, 1);
    applyChapter(Math.min(3, Math.floor(progress * 4)));
    if (elFill) elFill.style.width = (progress * 100) + '%';
  }
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();

  const point  = new T.Vector3();
  const aim    = new T.Vector3();
  const ptNode = new T.Vector3();
  const ptCar  = new T.Vector3();
  let initial  = true;

  return () => {
    // Car moves straight along Z — no swerving
    const carZ = 14 - progress * 29;
    car.position.set(0, 0, carZ);
    car.rotation.y = 0;
    if (car.updateVehicle) car.updateVehicle(-0.3, 0);

    // TPP camera — fixed offset behind and slightly above the car
    const tppPos = new T.Vector3(0, 2.8, carZ + 9);
    if (initial || reduced) camera.position.copy(tppPos);
    else camera.position.lerp(tppPos, 0.1);
    initial = false;

    aim.set(0, 1.2, carZ - 8);
    camera.lookAt(aim);

    // RF links and cloud visibility
    const showLinks = progress > 0.25;
    const showCloud = progress > 0.72;
    nodes.forEach(n => { n.visible = true; });
    links.visible = showLinks;
    cloud.visible = showCloud;
    if (cloud.material) {
      cloud.material.opacity = showCloud ? Math.min(1, (progress - 0.72) / 0.28) * 0.82 : 0;
    }

    // RF field rings
    if (fields) {
      const rs = T.MathUtils.clamp((progress - 0.05) / 0.2, 0, 1);
      fields.forEach(({ m, offset }) => {
        const f = (Date.now() * 0.00016 + offset) % 1;
        m.scale.setScalar(1 + f * 7);
        m.material.opacity = (1 - f) * 0.35 * rs;
        m.visible = rs > 0.01;
      });
    }

    // Update link lines to follow car
    links.children.forEach(line => {
      const a = line.geometry.attributes.position;
      a.setXYZ(1, car.position.x, 1, car.position.z);
      a.needsUpdate = true;
      line.geometry.computeBoundingSphere();
    });

    // Screen-space labels
    const nearest = nodes.reduce((best, n) =>
      Math.abs(n.position.z - carZ) < Math.abs(best.position.z - carZ) ? n : best,
      nodes[0]
    );
    const targetAlpha = (progress > 0.04 && progress < 0.97) ? 1 : 0;
    labelAlpha += (targetAlpha - labelAlpha) * (reduced ? 1 : 0.07);

    ptNode.set(nearest.position.x, 4.2, nearest.position.z);
    ptCar.set(0, 1.5, carZ);

    [elNLabel, elCLabel].forEach((el, i) => {
      if (!el) return;
      point.copy(i === 0 ? ptNode : ptCar).project(camera);
      const x   = (point.x * 0.5 + 0.5) * canvas.clientWidth;
      const y   = (-point.y * 0.5 + 0.5) * canvas.clientHeight;
      const off = point.z > 1 || point.z < -1 || x < 0 || x > canvas.clientWidth || y < 0 || y > canvas.clientHeight;
      el.style.left    = x + 'px';
      el.style.top     = y + 'px';
      el.style.opacity = off ? '0' : labelAlpha.toFixed(3);
      el.hidden        = false;
    });
  };
}