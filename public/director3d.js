let THREE;
let OrbitControls;
let TransformControls;
let GLTFLoader;
let scene;
let camera;
let renderer;
let orbit;
let transform;
let loader;
let clock;
let mixer;
let selectedObject;
let animationFrame = 0;
let initialized = false;
let initializing = null;
let worldGroup;
let actorGroup;
let sceneGroup;
let labelGroup;

const objects = new Map();
const presetModels = {
  '商务男': {
    url: 'https://threejs.org/examples/models/gltf/Xbot.glb',
    scale: 1.08,
    color: 0x2e5fb8,
  },
  '年轻女性': {
    url: 'https://threejs.org/examples/models/gltf/Xbot.glb',
    scale: 1.0,
    color: 0xb86cff,
  },
  '中年角色': {
    url: 'https://threejs.org/examples/models/gltf/Xbot.glb',
    scale: 1.03,
    color: 0x4f8ef7,
  },
  '机器人': {
    url: 'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
    scale: 0.42,
    color: 0x8fb3ff,
  },
};

async function loadThree() {
  if (THREE) return;
  const threeMod = await import('three');
  const orbitMod = await import('three/addons/controls/OrbitControls.js');
  const transformMod = await import('three/addons/controls/TransformControls.js');
  const gltfMod = await import('three/addons/loaders/GLTFLoader.js');
  THREE = threeMod;
  OrbitControls = orbitMod.OrbitControls;
  TransformControls = transformMod.TransformControls;
  GLTFLoader = gltfMod.GLTFLoader;
}

function host() {
  return document.querySelector('#director3dCanvasHost');
}

function setLoading(text = '') {
  const el = document.querySelector('.director-3d-loading');
  if (el) el.textContent = text;
}

function initRenderer() {
  const container = host();
  if (!container) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070b);
  scene.fog = new THREE.Fog(0x05070b, 12, 42);

  camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 100);
  camera.position.set(6, 4.2, 7.2);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.08;
  orbit.target.set(0, 1.1, 0);
  orbit.maxPolarAngle = Math.PI * 0.48;
  orbit.minDistance = 3;
  orbit.maxDistance = 18;

  transform = new TransformControls(camera, renderer.domElement);
  transform.setSize(0.85);
  transform.addEventListener('dragging-changed', event => {
    orbit.enabled = !event.value;
  });
  scene.add(transform);

  clock = new THREE.Clock();
  loader = new GLTFLoader();
  worldGroup = new THREE.Group();
  actorGroup = new THREE.Group();
  sceneGroup = new THREE.Group();
  labelGroup = new THREE.Group();
  scene.add(worldGroup, sceneGroup, actorGroup, labelGroup);

  buildBaseStage();
  createScene('摄影棚');
  resize();
  window.addEventListener('resize', resize);
}

function buildBaseStage() {
  const hemi = new THREE.HemisphereLight(0xaedcff, 0x151719, 1.7);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 2.8);
  key.position.set(5, 8, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x50a7ff, 1.2);
  fill.position.set(-5, 4, -3);
  scene.add(fill);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(42, 42),
    new THREE.MeshStandardMaterial({ color: 0x171c24, roughness: 0.82, metalness: 0.08 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  worldGroup.add(floor);

  const grid = new THREE.GridHelper(42, 42, 0x1d9bd8, 0x17405a);
  grid.position.y = 0.006;
  worldGroup.add(grid);

  const cameraFrame = makeCameraFrame();
  cameraFrame.position.set(0, 2.4, -3.8);
  worldGroup.add(cameraFrame);
}

function makeCameraFrame() {
  const shape = new THREE.BufferGeometry();
  const verts = new Float32Array([
    -2.8, -1.55, 0, 2.8, -1.55, 0,
    2.8, -1.55, 0, 2.8, 1.55, 0,
    2.8, 1.55, 0, -2.8, 1.55, 0,
    -2.8, 1.55, 0, -2.8, -1.55, 0,
  ]);
  shape.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  return new THREE.LineSegments(
    shape,
    new THREE.LineBasicMaterial({ color: 0x47d9ff, transparent: true, opacity: 0.7 })
  );
}

function makeLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,.58)';
  ctx.roundRect?.(0, 0, 256, 64, 16);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(1.7, 0.42, 1);
  return sprite;
}

function actorPosition() {
  const count = actorGroup.children.length;
  const row = Math.floor(count / 3);
  const col = count % 3;
  return new THREE.Vector3((col - 1) * 1.45, 0, row * 1.25);
}

function tintModel(root, color) {
  root.traverse(child => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    if (!child.material) return;
    child.material = child.material.clone();
    if (child.material.color) child.material.color.lerp(new THREE.Color(color), 0.18);
  });
}

function registerObject(name, object, meta = '角色') {
  object.name = name;
  object.userData.directorName = name;
  object.userData.directorMeta = meta;
  objects.set(name, object);
  select(name);
}

function attachLabel(object, name) {
  const label = makeLabel(name);
  label.position.set(0, 2.35, 0);
  object.add(label);
}

function createFallbackHuman(name, color = 0x4f8ef7) {
  const group = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xf0c4a8, roughness: 0.72 });
  const cloth = new THREE.MeshStandardMaterial({ color, roughness: 0.68, metalness: 0.04 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x10141b, roughness: 0.7 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 24), skin);
  head.position.y = 1.82;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.235, 32, 16), dark);
  hair.position.set(0, 1.9, -0.03);
  hair.scale.set(1, 0.62, 1);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.76, 10, 28), cloth);
  body.position.y = 1.12;
  const hip = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.28), cloth);
  hip.position.y = 0.62;

  const limbMat = new THREE.MeshStandardMaterial({ color: 0x202a36, roughness: 0.72 });
  const armGeo = new THREE.CapsuleGeometry(0.075, 0.62, 8, 16);
  const legGeo = new THREE.CapsuleGeometry(0.09, 0.74, 8, 16);
  const leftArm = new THREE.Mesh(armGeo, limbMat);
  leftArm.position.set(-0.42, 1.08, 0);
  leftArm.rotation.z = -0.18;
  const rightArm = new THREE.Mesh(armGeo, limbMat);
  rightArm.position.set(0.42, 1.08, 0);
  rightArm.rotation.z = 0.18;
  const leftLeg = new THREE.Mesh(legGeo, limbMat);
  leftLeg.position.set(-0.15, 0.12, 0);
  const rightLeg = new THREE.Mesh(legGeo, limbMat);
  rightLeg.position.set(0.15, 0.12, 0);

  [head, hair, body, hip, leftArm, rightArm, leftLeg, rightLeg].forEach(mesh => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  });
  group.userData.proceduralPose = { leftArm, rightArm, leftLeg, rightLeg, body };
  attachLabel(group, name);
  return group;
}

function playClip(root, pose) {
  if (!root.userData.clips?.length) return false;
  const query = {
    '站立': ['idle', 'stand'],
    '行走': ['walk'],
    '奔跑': ['run'],
    '武打': ['kick', 'punch', 'dance'],
    '坐姿': ['idle'],
    '指向镜头': ['wave', 'idle'],
  }[pose] || ['idle'];
  const clip = root.userData.clips.find(item => {
    const name = item.name.toLowerCase();
    return query.some(key => name.includes(key));
  }) || root.userData.clips[0];
  if (!clip) return false;
  mixer?.stopAllAction();
  mixer = new THREE.AnimationMixer(root);
  mixer.clipAction(clip).reset().fadeIn(0.18).play();
  return true;
}

function setProceduralPose(root, pose) {
  const parts = root.userData.proceduralPose;
  if (!parts) return;
  const { leftArm, rightArm, leftLeg, rightLeg, body } = parts;
  [leftArm, rightArm, leftLeg, rightLeg, body].forEach(part => part.rotation.set(0, 0, 0));
  if (pose === '行走') {
    leftArm.rotation.z = -0.42; rightArm.rotation.z = 0.42;
    leftLeg.rotation.x = 0.28; rightLeg.rotation.x = -0.22;
  } else if (pose === '奔跑') {
    leftArm.rotation.z = -0.8; rightArm.rotation.z = 0.72;
    leftLeg.rotation.x = 0.55; rightLeg.rotation.x = -0.44;
    body.rotation.x = -0.12;
  } else if (pose === '武打') {
    leftArm.rotation.z = -1.05; rightArm.rotation.z = -0.62;
    leftLeg.rotation.x = -0.15; rightLeg.rotation.x = 0.92;
    body.rotation.z = 0.12;
  } else if (pose === '指向镜头') {
    rightArm.rotation.x = -1.05;
    rightArm.rotation.z = -0.15;
  } else if (pose === '坐姿') {
    leftLeg.rotation.x = 1.18;
    rightLeg.rotation.x = 1.18;
    body.position.y = -0.12;
  }
}

async function loadPreset(name) {
  await init();
  const preset = presetModels[name] || presetModels['商务男'];
  setLoading(`正在加载 ${name} 三维角色...`);
  return new Promise(resolve => {
    loader.load(
      preset.url,
      gltf => {
        const root = gltf.scene;
        root.scale.setScalar(preset.scale);
        root.position.copy(actorPosition());
        root.rotation.y = Math.PI;
        root.userData.clips = gltf.animations || [];
        tintModel(root, preset.color);
        attachLabel(root, name);
        actorGroup.add(root);
        registerObject(name, root, '角色预设');
        setPose(document.querySelector('#directorPose')?.value || '站立');
        setLoading('');
        renderOnce();
        resolve(root);
      },
      undefined,
      () => {
        const fallback = createFallbackHuman(name, preset.color);
        fallback.position.copy(actorPosition());
        actorGroup.add(fallback);
        registerObject(name, fallback, '角色预设');
        setPose(document.querySelector('#directorPose')?.value || '站立');
        setLoading('远程模型未载入，已使用本地三维人体占位');
        renderOnce();
        resolve(fallback);
      }
    );
  });
}

function addActor(name = '角色') {
  const actor = createFallbackHuman(name, 0x4f8ef7);
  actor.position.copy(actorPosition());
  actorGroup.add(actor);
  registerObject(name, actor, '角色');
  renderOnce();
}

function addModel(name = '常用模型') {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x9ba7b8, metalness: 0.18, roughness: 0.55 });
  let mesh;
  if (name === '手机') {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.64, 0.035), mat);
  } else if (name === '灯架') {
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.8, 12), mat);
    stand.position.y = 0.9;
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.42, 0.12), new THREE.MeshBasicMaterial({ color: 0xdff8ff }));
    lamp.position.y = 1.78;
    group.add(stand, lamp);
  } else if (name === '办公桌') {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 0.85), new THREE.MeshStandardMaterial({ color: 0x5a3520, roughness: 0.55 }));
  } else {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.7), mat);
  }
  if (mesh) {
    mesh.position.y = name === '办公桌' ? 0.72 : 0.28;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  attachLabel(group, name);
  group.position.set(-2.1 + objects.size * 0.25, 0, 1.4);
  sceneGroup.add(group);
  registerObject(name, group, '模型');
  renderOnce();
}

function clearSceneProps() {
  for (let i = sceneGroup.children.length - 1; i >= 0; i -= 1) {
    sceneGroup.remove(sceneGroup.children[i]);
  }
}

function createScene(name = '摄影棚') {
  if (!THREE || !sceneGroup) return;
  clearSceneProps();
  const wallMat = new THREE.MeshStandardMaterial({
    color: name === '竹林' ? 0x153126 : name === '城市街道' ? 0x222934 : 0x1c222d,
    roughness: 0.85,
    metalness: 0.03,
  });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.8), wallMat);
  wall.position.set(0, 1.9, -4.2);
  wall.receiveShadow = true;
  sceneGroup.add(wall);

  if (name === '办公室') {
    addDesk();
  } else if (name === '城市街道') {
    addCityBlocks();
  } else if (name === '竹林') {
    addBamboo();
  } else {
    addStudioSoftboxes();
  }
  registerObject(name, wall, '场景');
  renderOnce();
}

function addDesk() {
  const mat = new THREE.MeshStandardMaterial({ color: 0x4a2b18, roughness: 0.52 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.9), mat);
  desk.position.set(0, 0.7, -1.7);
  desk.castShadow = true;
  sceneGroup.add(desk);
}

function addCityBlocks() {
  const mat = new THREE.MeshStandardMaterial({ color: 0x2d3846, roughness: 0.62 });
  for (let i = 0; i < 7; i += 1) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2 + Math.random() * 1.4, 0.6), mat);
    box.position.set(-3 + i, box.geometry.parameters.height / 2, -3.4);
    box.castShadow = true;
    sceneGroup.add(box);
  }
}

function addBamboo() {
  const mat = new THREE.MeshStandardMaterial({ color: 0x2f7d4a, roughness: 0.7 });
  for (let i = 0; i < 12; i += 1) {
    const bamboo = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 3.4, 12), mat);
    bamboo.position.set(-3.6 + i * 0.65, 1.7, -3.2 - (i % 2) * 0.5);
    bamboo.rotation.z = (i % 3 - 1) * 0.06;
    sceneGroup.add(bamboo);
  }
}

function addStudioSoftboxes() {
  const mat = new THREE.MeshBasicMaterial({ color: 0xdff8ff });
  const left = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.6), mat);
  left.position.set(-3.0, 2.2, -1.8);
  left.rotation.y = Math.PI * 0.28;
  const right = left.clone();
  right.position.x = 3.0;
  right.rotation.y = -Math.PI * 0.28;
  sceneGroup.add(left, right);
}

function select(name) {
  selectedObject = objects.get(name) || selectedObject;
  if (selectedObject) transform?.attach(selectedObject);
  renderOnce();
}

function setTool(tool = 'select') {
  if (!transform) return;
  transform.enabled = tool !== 'select';
  transform.visible = tool !== 'select';
  if (tool === 'move') transform.setMode('translate');
  if (tool === 'rotate') transform.setMode('rotate');
  if (tool === 'scale') transform.setMode('scale');
  renderOnce();
}

function setView(view = 'third') {
  if (!camera || !orbit) return;
  if (view === 'camera') {
    camera.position.set(0, 2.2, 6.2);
    camera.fov = 36;
    orbit.target.set(0, 1.3, 0);
  } else {
    camera.position.set(6, 4.2, 7.2);
    camera.fov = 42;
    orbit.target.set(0, 1.1, 0);
  }
  camera.updateProjectionMatrix();
  orbit.update();
  renderOnce();
}

function setPose(pose = '站立') {
  if (!selectedObject) return;
  if (!playClip(selectedObject, pose)) setProceduralPose(selectedObject, pose);
  renderOnce();
}

function setObjectTransform(path, rawValue) {
  if (!selectedObject || !path) return;
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return;
  const [group, axis] = path.split('.');
  if (!selectedObject[group] || !axis) return;
  selectedObject[group][axis] = group === 'rotation' ? THREE.MathUtils.degToRad(value) : value;
  renderOnce();
}

function setUniformScale(rawValue) {
  if (!selectedObject) return;
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return;
  selectedObject.scale.setScalar(Math.max(0.05, value));
  renderOnce();
}

function setObjectColor(value) {
  if (!selectedObject || !value) return;
  const color = new THREE.Color(value);
  selectedObject.traverse(child => {
    if (!child.isMesh || !child.material?.color) return;
    child.material = child.material.clone();
    child.material.color.copy(color);
  });
  renderOnce();
}

function setPoseControl(name, rawValue) {
  if (!selectedObject || !name) return;
  const value = THREE.MathUtils.degToRad(Number(rawValue) || 0);
  const parts = selectedObject.userData.proceduralPose;
  if (!parts) {
    if (name === 'bodyTurn') selectedObject.rotation.y = value;
    if (name === 'bodyTilt') selectedObject.rotation.x = value;
    if (name === 'bodySide') selectedObject.rotation.z = value;
    renderOnce();
    return;
  }
  if (name === 'bodyTilt') parts.body.rotation.x = value;
  if (name === 'bodyTurn') selectedObject.rotation.y = value;
  if (name === 'bodySide') parts.body.rotation.z = value;
  if (name === 'headNod') selectedObject.children.find(child => child.geometry?.type === 'SphereGeometry')?.rotation.set(value, 0, 0);
  if (name === 'leftArm') parts.leftArm.rotation.z = value;
  if (name === 'rightArm') parts.rightArm.rotation.z = value;
  if (name === 'leftLeg') parts.leftLeg.rotation.x = value;
  if (name === 'rightLeg') parts.rightLeg.rotation.x = value;
  renderOnce();
}

function resize() {
  const container = host();
  if (!container || !renderer || !camera) return;
  const rect = container.getBoundingClientRect();
  const width = Math.max(320, rect.width);
  const height = Math.max(240, rect.height);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderOnce();
}

function renderOnce() {
  if (!renderer || !scene || !camera) return;
  renderer.render(scene, camera);
}

function animate() {
  animationFrame = requestAnimationFrame(animate);
  const delta = clock?.getDelta?.() || 0;
  mixer?.update(delta);
  orbit?.update();
  renderer?.render(scene, camera);
}

async function init() {
  if (initialized) return;
  if (initializing) return initializing;
  initializing = (async () => {
    try {
      await loadThree();
      initRenderer();
      initialized = true;
      await loadPreset('商务男');
      setTool('move');
      if (!animationFrame) animate();
    } catch (error) {
      console.error(error);
      setLoading('3D 模块加载失败，请检查网络或本地 Three.js 资源');
    }
  })();
  return initializing;
}

async function open() {
  await init();
  resize();
}

function snapshotDataUrl() {
  if (!renderer) return '';
  renderOnce();
  try {
    return renderer.domElement.toDataURL('image/png');
  } catch {
    return '';
  }
}

window.Director3D = {
  open,
  loadPreset,
  addActor,
  addModel,
  createScene,
  select,
  setTool,
  setView,
  setPose,
  setObjectTransform,
  setUniformScale,
  setObjectColor,
  setPoseControl,
  snapshotDataUrl,
};
