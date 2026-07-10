const state = {
  nodes: [],
  links: [],
  selectedId: null,
  selectedIds: [],
  generationHistory: [],
  assets: [],
  projects: [],
  currentProjectId: '',
  projectView: false,
  materialView: false,
  materialFilter: 'all',
  materialUploadType: '',
  promptPresets: [],
  promptPresetFilter: 'all',
  selectedPromptPresetId: '',
  assetFilter: 'all',
  assetDraftNodeId: null,
  selectedLinkId: null,
  linking: null,
  pendingLink: null,
  scissors: false,
  spacePan: false,
  selecting: null,
  activeParamNodeId: null,
  mode: 't2i',
  scale: 1,
  pan: { x: -49800, y: -49800 },
  menuPoint: { x: 0, y: 0 },
  menuNodeId: null,
  config: null,
  undoStack: [],
  lastSnapshot: '',
  restoring: false,
  hoverVideoNodeId: null,
  grid: { spacing: 20, dot: 1, linkWidth: 3 },
  agentRefs: [],
};

const els = {
  stage: document.querySelector('#stage'),
  world: document.querySelector('#world'),
  links: document.querySelector('#links'),
  menu: document.querySelector('#menu'),
  fileInput: document.querySelector('#fileInput'),
  imageInput: document.querySelector('#imageInput'),
  videoInput: document.querySelector('#videoInput'),
  audioInput: document.querySelector('#audioInput'),
  selectionBox: document.querySelector('#selectionBox'),
  assetList: document.querySelector('#assetList'),
  historyList: document.querySelector('#historyList'),
  projectBoard: document.querySelector('#projectBoard'),
  materialBoard: document.querySelector('#materialBoard'),
  projectTitleBar: document.querySelector('#projectTitleBar'),
  imageBalance: document.querySelector('#imageBalance'),
  videoBalance: document.querySelector('#videoBalance'),
  menuTitle: document.querySelector('#menuTitle'),
  assetDialog: document.querySelector('#assetDialog'),
  assetDialogPreview: document.querySelector('#assetDialogPreview'),
  assetName: document.querySelector('#assetName'),
  assetCategory: document.querySelector('#assetCategory'),
  status: document.querySelector('#status'),
  prompt: document.querySelector('#prompt'),
  agentDock: document.querySelector('#agentDock'),
  closeAgentDock: document.querySelector('#closeAgentDock'),
  agentFloat: document.querySelector('#agentFloat'),
  directorStage: document.querySelector('#directorStage'),
  closeDirectorStage: document.querySelector('#closeDirectorStage'),
  agentUploadButton: document.querySelector('#agentUploadButton'),
  agentRefInput: document.querySelector('#agentRefInput'),
  agentRefs: document.querySelector('#agentRefs'),
  gridSettingsToggle: document.querySelector('#gridSettingsToggle'),
  gridSettingsPanel: document.querySelector('#gridSettingsPanel'),
  gridSpacing: document.querySelector('#gridSpacing'),
  gridDot: document.querySelector('#gridDot'),
  linkWidth: document.querySelector('#linkWidth'),
  gridSpacingValue: document.querySelector('#gridSpacingValue'),
  gridDotValue: document.querySelector('#gridDotValue'),
  linkWidthValue: document.querySelector('#linkWidthValue'),
  model: document.querySelector('#model'),
  ratio: document.querySelector('#ratio'),
  duration: document.querySelector('#duration'),
  generateAudio: document.querySelector('#generateAudio'),
  watermark: document.querySelector('#watermark'),
  nodeInfo: document.querySelector('#nodeInfo'),
  tasks: document.querySelector('#tasks'),
  settings: document.querySelector('#settings'),
};

const typeNames = {
  text: '文本',
  image: '图片',
  video: '视频',
  audio: '音频',
  world: '3D 世界',
  script: '脚本',
  prompt: '提示词',
  result: '结果',
  group: 'Group',
  t2i: '文生图',
  i2i: '图生图',
  t2v: '文生视频',
  i2v: '图生视频',
  director: '导演台',
  compare: '对比节点',
};

const IMAGE_UTILITY_PROMPTS = {
  characterSheet: '提取原图角色，制作标准角色设定图，画面分区排版，完整呈现人物正面、侧面、背面三视图、脸部高清特写、服饰细节特写；人体结构标准精准，五官清晰，服饰纹理、版型、配饰细节完整，构图工整规整，高清画质，专业角色原画，画面干净无杂物',
  nineGrid: '保持主体人物面部，服装特征或者场景细节特征，光影不变，生成九个角度不同景别各异的九宫格',
  paintNote: '在原图基础上添加专业绘画注释，保留原图主体身份、五官、服饰和构图，在画面周围加入清晰的绘画分析标注、结构线、光影说明、色彩说明、服装材质说明和关键细节箭头，排版干净专业，像角色设计讲解稿',
};

const PROMPT_PRESET_CATEGORIES = [
  ['all', '全部'],
  ['view', '视角'],
  ['shot', '分镜'],
  ['character', '角色'],
  ['product', '产品'],
  ['light', '光影'],
  ['mine', '我的'],
];

const DEFAULT_PROMPT_PRESETS = [
  {
    id: 'preset_360_panorama',
    title: '360全景图',
    category: 'view',
    tag: '内置',
    desc: '用于生成360全景、VR全景、可左右循环拼接的空间视角，适合室内空间、展厅、场景视角。',
    positive: '生成一张720度的全景VR图，左右边缘100%像素级无缝衔接，可无限循环拼接；上下极点自然过渡，无明显断层或拉伸，场景一致性强，空间结构完整，细节丰富，真实摄影质感，高清画质。',
    negative: 'seam, visible seam, hard seam, broken panorama, discontinuous edge, mismatched left and right edges, distorted poles, stretched ceiling, stretched floor, warped horizon, inconsistent scene logic, impossible space, no exit in closed room, text, letters, labels, watermark, logo, blurry, low quality',
  },
  {
    id: 'preset_character_keep',
    title: '角色一致性',
    category: 'character',
    tag: '内置',
    desc: '用于人物图生图、图生视频时保持同一张脸、服装和气质。',
    positive: '严格参考原图人物身份，保持五官比例、脸型、年龄感、发型、肤色、服饰版型和核心气质不变；只改变用户指定的场景、镜头、动作或光影，真实摄影质感，面部清晰自然。',
    negative: 'different person, face changed, identity shift, wrong age, wrong hairstyle, changed clothing, extra fingers, deformed hands, distorted face, watermark, text, logo, blurry, low quality',
  },
  {
    id: 'preset_product_clean',
    title: '产品棚拍',
    category: 'product',
    tag: '内置',
    desc: '用于产品主图、详情图、干净商业展示。',
    positive: '商业产品摄影，主体居中，产品边缘清晰，材质纹理真实，柔和棚拍灯光，干净背景，轻微反射，构图稳定，高清细节，适合电商主图和宣传海报。',
    negative: 'messy background, wrong logo, text error, distorted product, extra object, low quality, blurry, watermark, overexposure',
  },
  {
    id: 'preset_cinematic_light',
    title: '电影光影',
    category: 'light',
    tag: '内置',
    desc: '用于增强画面的电影感、层次和光影氛围。',
    positive: '电影摄影质感，真实镜头语言，主光与轮廓光层次清晰，柔和环境光，浅景深，细腻胶片颗粒，高动态范围，真实材质反射，画面有空间纵深。',
    negative: 'flat lighting, over saturated, plastic skin, fake render, low contrast, watermark, text, logo, blurry',
  },
  {
    id: 'preset_15s_storyboard',
    title: '15秒视频分镜',
    category: 'shot',
    tag: '内置',
    desc: '用于把一个主题扩成短视频时间轴提示词。',
    positive: '15秒，连续电影镜头，按0-3秒、3-6秒、6-10秒、10-15秒拆分；每段包含镜头运动、主体动作、物体运动、场景变化、光影色彩和真实材质细节；使用自然转场，不要硬切。',
    negative: 'split screen, grid layout, static zoom, PPT style, subtitle, watermark, cartoon, face changing, low quality',
  },
];

function uid(prefix = 'node') {
  return `${prefix}_${Math.random().toString(16).slice(2, 10)}`;
}

function setStatus(text) {
  els.status.textContent = text;
}

function loadGridSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('ai_canvas_grid_settings') || '{}');
    state.grid = {
      spacing: Number(saved.spacing) || 20,
      dot: Number(saved.dot) || 1,
      linkWidth: Number(saved.linkWidth) || 3,
    };
  } catch {
    state.grid = { spacing: 20, dot: 1, linkWidth: 3 };
  }
  applyGridSettings({ skipRender: true });
}

function saveGridSettings() {
  localStorage.setItem('ai_canvas_grid_settings', JSON.stringify(state.grid));
}

function applyGridSettings(options = {}) {
  const spacing = Math.max(8, Math.min(40, Number(state.grid.spacing) || 20));
  const dot = Math.max(1, Math.min(6, Number(state.grid.dot) || 1));
  const linkWidth = Math.max(1, Math.min(8, Number(state.grid.linkWidth) || 3));
  state.grid = { spacing, dot, linkWidth };
  document.documentElement.style.setProperty('--grid-spacing', `${spacing}px`);
  document.documentElement.style.setProperty('--grid-dot', `${dot}px`);
  document.documentElement.style.setProperty('--link-width', `${linkWidth}`);
  if (els.gridSpacing) els.gridSpacing.value = spacing;
  if (els.gridDot) els.gridDot.value = dot;
  if (els.linkWidth) els.linkWidth.value = linkWidth;
  if (els.gridSpacingValue) els.gridSpacingValue.textContent = `${spacing} px`;
  if (els.gridDotValue) els.gridDotValue.textContent = `${dot} px`;
  if (els.linkWidthValue) els.linkWidthValue.textContent = `${linkWidth} px`;
  if (!options.skipRender && typeof renderLinks === 'function') renderLinks();
}

function renderAgentRefs() {
  if (!els.agentRefs) return;
  els.agentRefs.innerHTML = state.agentRefs.map((ref, index) => `
    <div class="agent-ref-item">
      <img class="agent-ref-thumb" src="${escapeAttr(ref.url)}" alt="参考图${index + 1}">
      <button type="button" data-agent-ref-remove="${index}" title="移除参考图">×</button>
    </div>
  `).join('');
}

function addAgentRefFiles(files) {
  const imageFiles = [...files].filter(file => file.type?.startsWith('image/'));
  if (!imageFiles.length) return;
  imageFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      state.agentRefs.push({ name: file.name, url: String(reader.result || '') });
      renderAgentRefs();
    };
    reader.readAsDataURL(file);
  });
}

function mergeConfig(base, patch) {
  const merged = JSON.parse(JSON.stringify(base || {}));
  if (!patch || typeof patch !== 'object') return merged;
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && merged[key] && typeof merged[key] === 'object') {
      merged[key] = mergeConfig(merged[key], value);
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

function localUserConfig() {
  try {
    return JSON.parse(localStorage.getItem('ai_canvas_user_config') || '{}');
  } catch {
    return {};
  }
}

function persistUserConfig(config) {
  localStorage.setItem('ai_canvas_user_config', JSON.stringify(config));
}

function normalizeConfigShape(config) {
  const cfg = config || {};
  cfg.apis ||= {};
  cfg.apis.maas ||= {};
  cfg.apis.ark ||= {};
  cfg.apis.banana ||= {};
  cfg.apis.image2 ||= {};
  cfg.apis.i2i ||= {};
  cfg.apis.multimodal ||= {};
  cfg.models ||= {};
  cfg.models.video ||= ['doubao-seedance-2-0-260'];
  cfg.models.image ||= ['banana', 'image2'];
  cfg.defaults ||= {};
  cfg.defaults.videoProvider = 'ark';
  cfg.defaults.imageSettingsMode ||= 'standard';
  cfg.defaults.videoModel = cfg.apis.ark.modelName || 'doubao-seedance-2-0-260';
  cfg.defaults.imageModel ||= cfg.models.image[0] || 'banana';
  cfg.apis.ark.baseUrl ||= 'https://ark.cn-beijing.volces.com/api/v3';
  cfg.apis.ark.website ||= 'https://ark.cn-beijing.volces.com';
  cfg.apis.ark.modelName ||= 'doubao-seedance-2-0-260';
  cfg.models.video = [cfg.apis.ark.modelName];
  cfg.apis.i2i.endpointType ||= 'openai-edits';
  cfg.apis.i2i.referenceField ||= 'image';
  cfg.apis.i2i.modelName ||= '';
  cfg.apis.i2i.identityPrompt ||= 'Use the provided reference image as the strict identity and visual anchor. Preserve the original person or subject, face, age, hairstyle, body shape, clothing identity, and core visual features. Do not replace the referenced subject with a different person or object. Only change the scene, camera, lighting, pose, layout, or style requested by the user.';
  cfg.apis.multimodal.baseUrl ||= 'https://www.dmxapi.cn/v1/responses';
  cfg.apis.multimodal.website ||= 'https://www.dmxapi.cn';
  cfg.apis.multimodal.submitModel ||= 'doubao-seedance-2-0-260128';
  cfg.apis.multimodal.queryModel ||= 'seedance-2-0-get';
  cfg.apis.multimodal.requestFormat ||= 'responses-json';
  cfg.apis.multimodal.authMode ||= 'bearer';
  cfg.apis.multimodal.resolution ||= '4K';
  cfg.apis.multimodal.ratio ||= '16:9';
  cfg.apis.multimodal.duration ||= 8;
  cfg.apis.multimodal.watermark ||= false;
  cfg.apis.multimodal.returnLastFrame ||= false;
  cfg.apis.multimodal.webSearch ||= false;
  return cfg;
}

function screenToWorld(clientX, clientY) {
  const rect = els.stage.getBoundingClientRect();
  return {
    x: (clientX - rect.left - state.pan.x) / state.scale,
    y: (clientY - rect.top - state.pan.y) / state.scale,
  };
}

function applyTransform() {
  const transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.scale})`;
  els.world.style.transform = transform;
  els.links.style.transform = transform;
}

function canvasSnapshot() {
  const compactNodes = state.nodes.map(node => {
    const copy = { ...node };
    for (const key of ['url', 'resultUrl']) {
      if (typeof copy[key] === 'string' && copy[key].startsWith('data:image/') && copy[key].length > 120000) {
        copy[key] = '';
        copy.progressText = '图片数据过大未保存，请重新生成';
        copy.taskStatus = 'failed';
      }
    }
    return copy;
  });
  return JSON.stringify({
    nodes: compactNodes,
    links: state.links,
    pan: state.pan,
    scale: state.scale,
    generationHistory: state.generationHistory,
    assets: state.assets,
  });
}

function blankCanvasSnapshot() {
  return JSON.stringify({
    nodes: [],
    links: [],
    pan: { x: -49800, y: -49800 },
    scale: 1,
    generationHistory: [],
    assets: [],
  });
}

function loadProjectStore() {
  try {
    return JSON.parse(localStorage.getItem('ai_canvas_projects') || '{}');
  } catch {
    return {};
  }
}

function saveProjectStore() {
  localStorage.setItem('ai_canvas_projects', JSON.stringify({
    currentProjectId: state.currentProjectId,
    projects: state.projects,
  }));
}

function loadPromptPresets() {
  try {
    const saved = JSON.parse(localStorage.getItem('ai_canvas_prompt_presets') || '[]');
    const hiddenDefaults = JSON.parse(localStorage.getItem('ai_canvas_hidden_default_presets') || '[]');
    const merged = [...DEFAULT_PROMPT_PRESETS];
    for (let i = merged.length - 1; i >= 0; i -= 1) {
      if (hiddenDefaults.includes(merged[i].id)) merged.splice(i, 1);
    }
    for (const item of Array.isArray(saved) ? saved : []) {
      if (!merged.some(base => base.id === item.id)) merged.push(item);
    }
    state.promptPresets = merged;
  } catch {
    state.promptPresets = [...DEFAULT_PROMPT_PRESETS];
  }
  state.selectedPromptPresetId ||= state.promptPresets[0]?.id || '';
}

function savePromptPresets() {
  const custom = state.promptPresets.filter(item => !DEFAULT_PROMPT_PRESETS.some(base => base.id === item.id));
  localStorage.setItem('ai_canvas_prompt_presets', JSON.stringify(custom));
}

function hideDefaultPromptPreset(id) {
  const hidden = JSON.parse(localStorage.getItem('ai_canvas_hidden_default_presets') || '[]');
  if (!hidden.includes(id)) hidden.push(id);
  localStorage.setItem('ai_canvas_hidden_default_presets', JSON.stringify(hidden));
}

function projectCoverFromSnapshot(snapshot) {
  try {
    const data = JSON.parse(snapshot || '{}');
    const image = (data.nodes || []).find(n => ['image', 't2i', 'i2i'].includes(n.type) && (n.resultUrl || n.url));
    return image?.resultUrl || image?.url || '';
  } catch {
    return '';
  }
}

function projectCountFromSnapshot(snapshot) {
  try {
    const data = JSON.parse(snapshot || '{}');
    return (data.nodes || []).filter(n => n.type !== 'group').length;
  } catch {
    return 0;
  }
}

function ensureProjectStoreFromCurrent(snapshot) {
  const store = loadProjectStore();
  if (Array.isArray(store.projects) && store.projects.length) {
    state.projects = store.projects;
    state.currentProjectId = store.currentProjectId || store.projects[0].id;
    return true;
  }
  const first = {
    id: uid('project'),
    name: localStorage.getItem('ai_canvas_project_name') || '目前画布',
    snapshot,
    cover: projectCoverFromSnapshot(snapshot),
    count: projectCountFromSnapshot(snapshot),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  state.projects = [first];
  state.currentProjectId = first.id;
  saveProjectStore();
  return false;
}

function currentProject() {
  return state.projects.find(project => project.id === state.currentProjectId) || state.projects[0] || null;
}

function updateProjectTitleBar() {
  if (!els.projectTitleBar) return;
  const project = currentProject();
  const visible = !!project && !state.projectView && !state.materialView;
  els.projectTitleBar.classList.toggle('hidden', !visible);
  els.projectTitleBar.textContent = project?.name || '默认项目';
}

function persistCurrentProjectSnapshot(snapshot = canvasSnapshot()) {
  const project = currentProject();
  if (!project) return;
  project.snapshot = snapshot;
  project.cover = projectCoverFromSnapshot(snapshot);
  project.count = projectCountFromSnapshot(snapshot);
  project.updatedAt = Date.now();
  saveProjectStore();
}

function restoreSnapshot(snapshot) {
  const data = JSON.parse(snapshot);
  state.nodes = (data.nodes || []).map(normalizeNode);
  state.links = data.links || [];
  state.pan = data.pan || state.pan;
  state.scale = data.scale || state.scale;
  state.generationHistory = data.generationHistory || [];
  state.assets = data.assets || [];
  state.selectedId = null;
  state.selectedIds = [];
  state.selectedLinkId = null;
  state.activeParamNodeId = null;
  state.lastSnapshot = snapshot;
  localStorage.setItem('ai-canvas-studio', snapshot);
  applyTransform();
  render();
}

function undoLast() {
  const snapshot = state.undoStack.pop();
  if (!snapshot) {
    setStatus('没有可撤销的操作');
    return;
  }
  state.restoring = true;
  restoreSnapshot(snapshot);
  state.restoring = false;
  setStatus('已撤销上一步');
}

function saveCanvas() {
  const snapshot = canvasSnapshot();
  if (!state.restoring && state.lastSnapshot && snapshot !== state.lastSnapshot) {
    state.undoStack.push(state.lastSnapshot);
    state.undoStack = state.undoStack.slice(-80);
  }
  state.lastSnapshot = snapshot;
  try {
    localStorage.setItem('ai-canvas-studio', snapshot);
    persistCurrentProjectSnapshot(snapshot);
    setStatus('画布已保存');
  } catch (err) {
    setStatus('画布太大，已跳过本次自动保存');
  }
}

function loadCanvas() {
  const store = loadProjectStore();
  if (Array.isArray(store.projects) && store.projects.length) {
    state.projects = store.projects;
    state.currentProjectId = store.currentProjectId || store.projects[0].id;
    const project = currentProject();
    if (project?.snapshot) {
      const data = JSON.parse(project.snapshot);
      state.nodes = (data.nodes || []).map(normalizeNode);
      state.links = data.links || [];
      state.pan = data.pan || state.pan;
      state.scale = data.scale || state.scale;
      state.generationHistory = data.generationHistory || [];
      state.assets = data.assets || [];
      state.lastSnapshot = canvasSnapshot();
      render();
      applyTransform();
      return;
    }
  }
  const saved = localStorage.getItem('ai-canvas-studio');
  if (!saved) {
    addNode('prompt', 50000, 50000, {
      title: '主提示词',
      text: '在这里写提示词，也可以连接到生成节点。',
    });
    addNode('image', 50280, 50000, {
      title: '常用参考图',
      text: '右键上传图片后，可作为图生图/图生视频参考。',
    });
    ensureProjectStoreFromCurrent(canvasSnapshot());
    return;
  }
  try {
    const data = JSON.parse(saved);
    state.nodes = (data.nodes || []).map(normalizeNode);
    state.links = data.links || [];
    state.pan = data.pan || state.pan;
    state.scale = data.scale || state.scale;
    state.generationHistory = data.generationHistory || [];
    state.assets = data.assets || [];
    state.lastSnapshot = canvasSnapshot();
    ensureProjectStoreFromCurrent(state.lastSnapshot);
    render();
    applyTransform();
  } catch {
    localStorage.removeItem('ai-canvas-studio');
  }
}

function defaultModelForType(type) {
  return ['t2i', 'i2i'].includes(type) ? 'image2' : 'doubao-seedance-2.0';
}

function isGeneratorType(type) {
  return ['t2i', 'i2i', 't2v', 'i2v'].includes(type);
}

function ratioNumber(value = '16:9') {
  const [w, h] = String(value || '16:9').split(':').map(Number);
  return w && h ? w / h : 16 / 9;
}

function previewRatioForNode(node) {
  return ratioNumber(node.aspect || node.ratio || '16:9');
}

function previewHeightForNode(node) {
  return 32 + Math.max(90, Math.round((node.w || 260) / previewRatioForNode(node)));
}

function imageRatioForNode(node) {
  const ratio = Number(node.imageRatio || node.naturalRatio || 0);
  return Number.isFinite(ratio) && ratio > 0 ? ratio : 16 / 9;
}

function shouldKeepImageRatio(node) {
  return node?.type === 'image' && Number(node.imageRatio || node.naturalRatio || 0) > 0;
}

function imageNodeHeight(node) {
  const headerH = 32;
  const bodyPaddingX = 20;
  const bodyPaddingY = 20;
  const pillH = node.role ? 30 : 0;
  const imageW = Math.max(80, (node.w || 220) - bodyPaddingX);
  return headerH + bodyPaddingY + Math.max(70, Math.round(imageW / imageRatioForNode(node))) + pillH;
}

function normalizeNode(node) {
  if (!node) return node;
  if (!Array.isArray(node.annotations)) node.annotations = [];
  node.annotationMode = !!node.annotationMode;
  node.annotationTool ||= 'brush';
  if (node.type === 'image' && node.imageRatio) {
    node.imageRatio = imageRatioForNode(node);
  }
  if (node.type === 't2i' && !['banana', 'image2'].includes(node.model)) {
    node.model = 'image2';
  }
  if (node.type === 'i2i' && !['banana', 'image2'].includes(node.model)) {
    node.model = 'image2';
  }
  if (['t2i', 'i2i'].includes(node.type) && (!node.quality || (node.quality === '4k' && !node.qualityMigrated))) {
    node.quality = '2k';
    node.qualityMigrated = true;
  }
  if (['t2v', 'i2v'].includes(node.type)) {
    node.videoProvider ||= 'ark';
    node.model ||= videoModelName();
  }
  if (['t2i', 'i2i'].includes(node.type) && (node.resultUrl || node.url) && node.taskStatus === 'succeeded') {
    node.taskStatus = '';
    node.progressPercent = 0;
    node.progressText = '';
  }
  if (['t2i', 'i2i'].includes(node.type) && ['queued', 'running', 'creating'].includes(node.taskStatus) && !node.taskId) {
    node.taskStatus = 'failed';
    node.progressPercent = 100;
    node.progressText = '刷新后已中断，请重新点击生成';
  }
  return node;
}

function addNode(type, x, y, data = {}) {
  const node = {
    id: uid(type),
    type,
    x,
    y,
    w: data.w || (type === 'director' ? 720 : type === 'compare' ? 520 : ['t2v', 'i2v'].includes(type) ? 300 : ['t2i', 'i2i'].includes(type) ? 520 : 220),
    h: data.h || (type === 'director' ? 420 : type === 'compare' ? 300 : 120),
    title: data.title || typeNames[type] || '节点',
    text: data.text || '',
    url: data.url || '',
    mime: data.mime || '',
    kind: data.kind || type,
    role: data.role || roleForType(type),
    ratio: data.ratio || '16:9',
    duration: data.duration || 5,
    model: data.model || defaultModelForType(type),
    videoProvider: data.videoProvider || 'ark',
    generateAudio: data.generateAudio || false,
    watermark: data.watermark || false,
    aspect: data.aspect || '16:9',
    quality: data.quality || '2k',
    resolution: data.resolution || '4K',
    imageCount: data.imageCount || 1,
    directors: data.directors || [],
    annotations: Array.isArray(data.annotations) ? data.annotations : [],
    annotationMode: data.annotationMode || false,
    annotationTool: data.annotationTool || 'brush',
    preset: data.preset || '',
    panelW: data.panelW || 680,
    panelH: data.panelH || 180,
    refOrder: data.refOrder || [],
    expanded: data.expanded || false,
    taskId: data.taskId || '',
    taskStatus: data.taskStatus || '',
    progressText: data.progressText || '',
    progressPercent: data.progressPercent || 0,
    resultUrl: data.resultUrl || '',
    imageRatio: data.imageRatio || data.naturalRatio || 0,
    naturalWidth: data.naturalWidth || 0,
    naturalHeight: data.naturalHeight || 0,
    createdAt: Date.now(),
  };
  if (node.type === 'image' && node.imageRatio) {
    node.imageRatio = imageRatioForNode(node);
    if (!data.w) node.w = Math.min(420, Math.max(220, Math.round(180 * node.imageRatio)));
    if (!data.h) node.h = imageNodeHeight(node);
  }
  state.nodes.push(node);
  state.selectedId = node.id;
  state.selectedLinkId = null;
  render();
  saveCanvas();
  renderAssets();
  renderHistory();
  return node;
}

function roleForType(type) {
  if (type === 'image') return 'reference_image';
  if (type === 'video') return 'reference_video';
  if (type === 'audio') return 'reference_audio';
  return '';
}

function render() {
  els.world.innerHTML = '';
  const renderNodes = [...state.nodes].sort((a, b) => (a.type === 'group' ? -1 : 0) - (b.type === 'group' ? -1 : 0));
  for (const node of renderNodes) {
    const div = document.createElement('div');
    const selectedClass = node.id === state.selectedId ? ' selected' : state.selectedIds.includes(node.id) ? ' multi-selected' : '';
    const fullscreenClass = node.fullscreenPreview ? ' fullscreen-preview' : '';
    div.className = `node ${node.type}${selectedClass}${fullscreenClass}`;
    div.style.left = `${node.x}px`;
    div.style.top = `${node.y}px`;
    div.style.width = `${node.w}px`;
    div.style.setProperty('--preview-ratio', previewRatioForNode(node));
    if (node.fullscreenPreview) {
      div.style.height = `${node.h}px`;
    } else if (isGeneratorType(node.type)) {
      node.h = previewHeightForNode(node);
      div.style.height = `${node.h}px`;
    } else if (shouldKeepImageRatio(node)) {
      node.h = imageNodeHeight(node);
      div.style.height = `${node.h}px`;
    } else if (node.h) {
      div.style.height = `${node.h}px`;
    }
    div.dataset.id = node.id;
    div.innerHTML = nodeHTML(node);
    els.world.appendChild(div);
    attachImageRatioCapture(div, node);
  }
  renderParamPanel();
  renderLinks();
  updateNodeInfo();
  renderAssets();
  renderHistory();
  if (state.projectView) renderProjectBoard();
  if (state.materialView) renderMaterialBoard();
  updateProjectTitleBar();
}

function attachImageRatioCapture(div, node) {
  if (node.type !== 'image') return;
  const img = div.querySelector('img[data-capture-ratio]');
  if (!img) return;
  const capture = () => {
    if (!img.naturalWidth || !img.naturalHeight) return;
    const ratio = img.naturalWidth / img.naturalHeight;
    if (!Number.isFinite(ratio) || ratio <= 0) return;
    if (Math.abs(Number(node.imageRatio || 0) - ratio) < 0.01) return;
    node.imageRatio = ratio;
    node.naturalWidth = img.naturalWidth;
    node.naturalHeight = img.naturalHeight;
    node.h = imageNodeHeight(node);
    div.style.height = `${node.h}px`;
    scheduleRenderLinks();
    saveCanvas();
  };
  if (img.complete) {
    capture();
  } else {
    img.addEventListener('load', capture, { once: true });
  }
}

let canvasSaveTimer = 0;

function scheduleCanvasSave(delay = 450) {
  window.clearTimeout(canvasSaveTimer);
  canvasSaveTimer = window.setTimeout(saveCanvas, delay);
}

function nodeHTML(node) {
  const title = escapeHtml(node.title || typeNames[node.type] || '节点');
  const head = `<div class="node-head"><span>${title}</span><button class="node-delete" data-delete-node title="删除">×</button></div>`;
  let body = '';
  let floatingTools = '';
  if (node.type === 'group') {
    body = `<div class="group-label">${escapeHtml(node.members?.length || 0)} nodes</div>`;
  } else if (node.type === 'image' && node.url) {
    floatingTools = imageUtilityToolbarHTML(node);
    body = `
      <div class="image-node-preview" draggable="false" data-drag-asset-node="${node.id}">
        <img class="image-output" src="${node.url}" alt="" draggable="false" data-capture-ratio>
        ${annotationOverlayHTML(node)}
      </div>
      <div class="pill">${escapeHtml(node.role || 'reference_image')}</div>
    `;
  } else if (node.type === 'video' && node.url) {
    body = `<video src="${node.url}" controls></video><div class="pill">${escapeHtml(node.role || 'reference_video')}</div>`;
  } else if (node.type === 'audio' && node.url) {
    body = `<audio src="${node.url}" controls></audio><div class="pill">${escapeHtml(node.role || 'reference_audio')}</div>`;
  } else if (node.type === 'result' && node.url) {
    body = node.mime.startsWith('video/')
      ? `<video src="${node.url}" controls></video>`
      : `<img src="${node.url}" alt="" draggable="false">`;
  } else if (node.type === 'prompt') {
    body = `
      <label class="node-label">提示词</label>
      <textarea data-field="text" placeholder="输入视频/图片提示词...">${escapeHtml(node.text)}</textarea>
    `;
  } else if (node.type === 't2v' || node.type === 'i2v') {
    body = videoGeneratorHTML(node);
  } else if (node.type === 't2i' || node.type === 'i2i') {
    floatingTools = imageUtilityToolbarHTML(node);
    body = imageGeneratorHTML(node);
  } else if (node.type === 'compare') {
    body = compareNodeHTML(node);
  } else if (node.type === 'director') {
    body = directorNodeHTML(node);
  } else if (node.type === 'text' || node.type === 'script') {
    const placeholder = node.type === 'script' ? '写脚本或请求草稿...' : '输入提示词或文本...';
    body = `<textarea data-field="text" placeholder="${placeholder}">${escapeHtml(node.text)}</textarea>`;
  } else {
    body = `<div>${escapeHtml(node.text || '空节点')}</div>`;
  }
  const input = canInput(node.type) ? '<div class="port in" data-port="in" title="输入"></div>' : '';
  const output = canOutput(node.type) ? '<div class="port out" data-port="out" title="输出"></div>' : '';
  return `${input}${output}${head}${floatingTools}<div class="node-body">${body}</div><div class="resize-handle" title="拖动调整大小"></div>`;
}

function compareNodeHTML(node) {
  const refs = referencesForNode(node.id).filter(ref => ref.kind === 'image').slice(0, 2);
  const a = refs[0]?.url || '';
  const b = refs[1]?.url || '';
  const split = Math.max(3, Math.min(97, Number(node.compareSplit || 50)));
  return `
    <div class="compare-node">
      <div class="compare-toolbar">
        <span>连接两张图片，拖动画面中间的线进行对比</span>
      </div>
      <div class="compare-stage" style="--split:${split}%" data-compare-stage>
        <div class="compare-layer compare-base">
          ${a ? `<img class="compare-img" src="${escapeAttr(a)}" alt="">` : '<div class="compare-empty">图片 A</div>'}
        </div>
        <div class="compare-layer compare-top">
          ${b ? `<img class="compare-img" src="${escapeAttr(b)}" alt="">` : '<div class="compare-empty">图片 B</div>'}
        </div>
        <div class="compare-divider" data-compare-divider><i></i></div>
      </div>
    </div>
  `;
}

function directorNodeHTML(node) {
  const actors = node.directors?.length ? node.directors : ['角色1'];
  return `
    <div class="director-node">
      <div class="director-top">
        <strong>Director 导演台</strong>
        <button type="button" data-open-director-stage>打开3D导演台</button>
        <button type="button" data-director-add>添加角色</button>
        <button type="button" data-director-import>从图库导入</button>
        <span>3D模式</span>
      </div>
      <div class="director-space">
        <div class="director-horizon"></div>
        <div class="director-grid"></div>
        ${actors.map((actor, index) => `
          <div class="director-actor" style="left:${22 + index * 16}%; top:${58 - (index % 3) * 8}%">
            <i></i><span>${escapeHtml(actor)}</span>
          </div>
        `).join('')}
      </div>
      <div class="director-bottom">
        <span>FOV 39.6</span>
        <span>镜头距离 8.0</span>
        <span>网格</span>
        <span>1080p</span>
        <span>截屏</span>
      </div>
    </div>
  `;
}

function imageGeneratorHTML(node) {
  const output = node.resultUrl
    ? `<img class="image-output" src="${node.resultUrl}" alt="" draggable="false">`
    : '<div class="image-output-empty">Image</div>';
  const download = node.resultUrl ? `<button class="node-download" data-download-image title="下载图片">下载</button>` : '';
  const status = node.taskStatus && node.taskStatus !== 'succeeded'
    ? `<div class="preview-status ${node.taskStatus}">${escapeHtml(node.progressText || node.taskStatus)}${progressBarHTML(node)}</div>`
    : '';
  return `<div class="image-node-preview" draggable="false" data-drag-asset-node="${node.id}">${output}${download}${status}${annotationOverlayHTML(node)}</div>`;
}

function imageUtilityToolbarHTML(node) {
  return `
    <div class="image-tool-strip">
      <button data-image-tool="characterSheet" title="生成人物三视图">人物三视图</button>
      <button data-image-tool="nineGrid" title="生成九宫格">九宫格</button>
      <button data-image-tool="paintNote" title="打开绘画标注工具">绘画注释</button>
      <div class="image-tool-menu">
        <button type="button" title="宫格裁切">宫格裁切</button>
        <div class="image-tool-dropdown">
          <button data-image-grid="9">9宫格裁切<span>3×3 网格</span></button>
          <button data-image-grid="16">16宫格裁切<span>4×4 网格</span></button>
          <button data-image-grid="25">25宫格裁切<span>5×5 网格</span></button>
        </div>
      </div>
    </div>
  `;
}

function annotationOverlayHTML(node) {
  const annotations = Array.isArray(node.annotations) ? node.annotations : [];
  const shapes = annotations.map(item => {
    if (item.type === 'text') {
      return `<text x="${Number(item.x || 0)}" y="${Number(item.y || 0)}" fill="${escapeAttr(item.color || '#ccff00')}" font-size="4.5" font-weight="800">${escapeHtml(item.text || '')}</text>`;
    }
    const d = (item.points || []).map((point, index) => `${index ? 'L' : 'M'} ${Number(point.x || 0).toFixed(2)} ${Number(point.y || 0).toFixed(2)}`).join(' ');
    return `<path d="${d}" fill="none" stroke="${escapeAttr(item.color || '#ccff00')}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path>`;
  }).join('');
  return `
    <svg class="annotation-layer ${node.annotationMode ? 'active' : ''}" viewBox="0 0 100 100" preserveAspectRatio="none" data-annotation-layer>
      ${shapes}
    </svg>
    ${node.annotationMode ? `
      <div class="annotation-toolbar">
        <button type="button" class="${node.annotationTool !== 'text' ? 'active' : ''}" data-annotation-tool="brush">画笔</button>
        <button type="button" class="${node.annotationTool === 'text' ? 'active' : ''}" data-annotation-tool="text">文字</button>
        <button type="button" data-annotation-clear>清空</button>
        <button type="button" data-annotation-done>完成</button>
      </div>
    ` : ''}
  `;
}

function imageParamPanelHTML(node) {
  const status = node.taskStatus && node.taskStatus !== 'succeeded'
    ? `<div class="node-progress ${node.taskStatus}">${escapeHtml(node.progressText || node.taskStatus)}${progressBarHTML(node, true)}</div>`
    : '';
  return `
    <div class="image-params">
      ${node.type === 'i2i' ? referenceImageStripHTML(node) : ''}
      ${node.type === 'i2i' ? `
        <label class="node-label">提示词</label>
        <textarea class="param-prompt" data-field="text" placeholder="描述这组参考图要怎么变化...">${escapeHtml(node.text || '')}</textarea>
        ${referenceMentionMenuHTML(node)}
      ` : ''}
      <div class="image-param-row">
        ${node.type === 'i2i'
          ? '<div class="model-badge">DMXAPI 图生图通道<span>设置里配置模型</span></div>'
          : `<select data-field="model">
              ${['banana', 'image2'].map(v => `<option ${node.model === v ? 'selected' : ''}>${v}</option>`).join('')}
            </select>`}
        <select data-field="aspect">
          ${['16:9', '9:16', '1:1', '4:3', '3:4'].map(v => `<option ${node.aspect === v ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
        <select data-field="quality">
          ${['1k', '2k', '4k'].map(v => `<option ${node.quality === v ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
        <select data-field="imageCount">
          ${[1, 2, 4].map(v => `<option value="${v}" ${Number(node.imageCount) === v ? 'selected' : ''}>${v}x</option>`).join('')}
        </select>
      </div>
      <button class="image-generate" data-generate-image>开始生成</button>
      ${status}
    </div>
  `;
}
function progressPercentForNode(node) {
  if (Number(node.progressPercent)) return Math.max(0, Math.min(100, Number(node.progressPercent)));
  if (node.taskStatus === 'queued') return 12;
  if (node.taskStatus === 'creating') return 28;
  if (node.taskStatus === 'running') return 68;
  if (node.taskStatus === 'succeeded' || node.taskStatus === 'failed') return 100;
  return 0;
}

function progressBarHTML(node, showPercent = false) {
  const percent = progressPercentForNode(node);
  return `
    <div class="progress-meter ${node.taskStatus || ''}">
      <div class="progress-fill" style="width:${percent}%"></div>
    </div>
    ${showPercent ? `<div class="progress-percent">${percent}%</div>` : ''}
  `;
}

function startSoftProgress(nodeId, from = 18, to = 88) {
  let percent = from;
  return window.setInterval(() => {
    const node = state.nodes.find(n => n.id === nodeId);
    if (!node || !['queued', 'running', 'creating'].includes(node.taskStatus)) return;
    percent = Math.min(to, percent + Math.max(1, Math.round((to - percent) * 0.12)));
    node.progressPercent = percent;
    updateNodeProgressDom(node);
  }, 1200);
}

function updateNodeProgressDom(node) {
  const wrappers = [
    document.querySelector(`.node[data-id="${node.id}"]`),
    document.querySelector(`.param-panel[data-id="${node.id}"]`),
  ].filter(Boolean);
  for (const wrapper of wrappers) {
    wrapper.querySelectorAll('.progress-fill').forEach(fill => {
      fill.style.width = `${progressPercentForNode(node)}%`;
    });
    wrapper.querySelectorAll('.progress-percent').forEach(label => {
      label.textContent = `${progressPercentForNode(node)}%`;
    });
  }
}

function videoGeneratorHTML(node) {
  const src = node.resultUrl || '';
  const preview = src
    ? `<video class="node-video-output" src="${src}" preload="metadata"></video>
      <div class="video-control-bar">
        <button class="video-icon-button" data-video-toggle title="播放/暂停" aria-label="播放/暂停">▶</button>
        <span class="video-time" data-video-time>0:00 / 0:00</span>
        <input class="video-scrubber" data-video-scrubber type="range" min="0" max="1000" value="0" step="1" aria-label="视频进度">
        <span class="video-rate">1×</span>
        <span class="video-volume">▰</span>
        <button class="video-icon-button video-download-button" data-download-video title="下载视频" aria-label="下载视频">↓</button>
      </div>
      ${node.taskStatus === 'succeeded' ? '<div class="video-success-badge">生成成功</div>' : ''}`
    : '<div class="node-video-empty">视频预览</div>';
  const status = node.taskStatus && node.taskStatus !== 'succeeded'
    ? `<div class="preview-status ${node.taskStatus}">
        <div>${escapeHtml(node.progressText || node.taskStatus)}</div>
        ${progressBarHTML(node, true)}
      </div>`
    : '';
  return `<div class="node-preview-shell">${preview}${status}</div>`;
}

function videoParamPanelHTML(node) {
  const durationOptions = Array.from({ length: 12 }, (_, index) => index + 4);
  const arkModel = state.config?.apis?.ark?.modelName || 'doubao-seedance-2-0-260';
  const multiModel = state.config?.apis?.multimodal?.submitModel || 'doubao-seedance-2-0-260128';
  const modelOptions = [
    { value: 'ark', label: `火山算力 · ${arkModel}` },
    { value: 'multimodal', label: `多参模块 · ${multiModel}` },
  ];
  const status = node.taskStatus ? `<div class="node-progress ${node.taskStatus}">
    <div>${escapeHtml(node.progressText || node.taskStatus)}</div>
    ${progressBarHTML(node, true)}
  </div>` : '';
  return `
    ${node.type === 'i2v' ? referenceImageStripHTML(node) : ''}
    ${node.type === 'i2v' ? `
      <label class="node-label">提示词</label>
      <textarea class="param-prompt" data-field="text" placeholder="描述参考图如何运动、镜头和动作...">${escapeHtml(node.text || '')}</textarea>
    ` : ''}
    <div class="video-control-grid">
      <div class="video-model-cell">
        <label class="node-label">模型</label>
        <select data-field="videoProvider">
          ${modelOptions.map(item => `<option value="${item.value}" ${(node.videoProvider || 'ark') === item.value ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="node-label">比例</label>
        <select data-field="ratio">
          ${['16:9', '9:16', '1:1', '4:3', '3:4'].map(v => `<option ${node.ratio === v ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="node-label">时长</label>
        <select data-field="duration">
          ${durationOptions.map(v => `<option value="${v}" ${Number(node.duration || 5) === v ? 'selected' : ''}>${v} 秒</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="node-label">分辨率</label>
        <select data-field="resolution">
          ${['4K'].map(v => `<option ${String(node.resolution || '4K').toUpperCase() === v.toUpperCase() ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="node-checks">
      <label><input data-field="generateAudio" type="checkbox" ${node.generateAudio ? 'checked' : ''}> 生成音频</label>
      <label><input data-field="watermark" type="checkbox" ${node.watermark ? 'checked' : ''}> 水印</label>
    </div>
    <button class="node-generate" data-generate-node>开始生成</button>
    ${status}
  `;
}

function renderParamPanel() {
  const node = state.nodes.find(n => n.id === state.activeParamNodeId && isGeneratorType(n.type));
  if (!node) return;
  const panel = document.createElement('div');
  panel.className = `param-panel ${node.type}`;
  panel.dataset.id = node.id;
  panel.style.left = `${node.x}px`;
  panel.style.top = `${node.y + (node.h || previewHeightForNode(node)) + 12}px`;
  panel.style.width = `${node.panelW || Math.max(520, node.w)}px`;
  panel.style.minHeight = `${node.panelH || 180}px`;
  panel.innerHTML = `
    <div class="param-panel-body">
      ${['t2i', 'i2i'].includes(node.type) ? imageParamPanelHTML(node) : videoParamPanelHTML(node)}
    </div>
    <div class="panel-resize-handle" title="拖动调整参数面板"></div>
  `;
  els.world.appendChild(panel);
}
function referenceImageStripHTML(node) {
  const refs = referencesForNode(node.id).filter(r => r.kind === 'image');
  const refStrip = refs.map((ref, index) => `
    <div class="image-ref-card" draggable="true" data-ref-index="${index}" data-ref-node-id="${escapeHtml(ref.nodeId || '')}">
      <img class="image-ref-thumb" src="${ref.url}" alt="">
      <button class="image-ref-delete" data-delete-ref title="移除参考图">×</button>
      <span>图片${index + 1}</span>
    </div>
  `).join('');
  return `
    <div class="image-ref-row">
      ${refStrip}
      <button class="image-add-ref" data-add-ref>+<span>添加</span></button>
    </div>
    ${refs.length ? '<div class="ref-mention-hint">提示词里写 @1、@2 可只调用对应参考图；不写 @ 默认使用全部参考图。</div>' : ''}
  `;
}

function formatMediaTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = String(total % 60).padStart(2, '0');
  return `${minutes}:${rest}`;
}

function syncVideoControls(shell) {
  const video = shell?.querySelector('video');
  if (!video) return;
  const toggle = shell.querySelector('[data-video-toggle]');
  const scrubber = shell.querySelector('[data-video-scrubber]');
  const time = shell.querySelector('[data-video-time]');
  if (toggle) {
    toggle.textContent = video.paused ? '▶' : 'Ⅱ';
    toggle.classList.toggle('playing', !video.paused);
  }
  if (scrubber && Number.isFinite(video.duration) && video.duration > 0 && !scrubber.matches(':active')) {
    scrubber.value = String(Math.round((video.currentTime / video.duration) * 1000));
  }
  if (time) {
    time.textContent = `${formatMediaTime(video.currentTime)} / ${formatMediaTime(video.duration)}`;
  }
}

function toggleVideoInShell(shell) {
  const video = shell?.querySelector('video');
  if (!video) return false;
  if (video.paused) {
    video.play()
      .then(() => syncVideoControls(shell))
      .catch(err => setStatus(`播放失败：${err.message}`));
  } else {
    video.pause();
    syncVideoControls(shell);
  }
  return true;
}

function activeVideoShell() {
  const id = state.hoverVideoNodeId || state.selectedId;
  if (!id) return null;
  return document.querySelector(`.node[data-id="${id}"] .node-preview-shell`);
}

function referenceMentionMenuHTML(node) {
  const refs = referencesForNode(node.id).filter(r => r.kind === 'image');
  if (!refs.length) return '';
  return `
    <div class="ref-mention-menu hidden">
      ${refs.map((ref, index) => `
        <button type="button" data-insert-ref-mention="@${index + 1}">
          <img src="${ref.url}" alt="">
          <span>@${index + 1}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function renderAssets() {
  if (!els.assetList) return;
  const assets = (state.assets || [])
    .filter(asset => state.assetFilter === 'all' || asset.category === state.assetFilter);
  els.assetList.innerHTML = assets.length
    ? assets.map(assetCardHTML).join('')
    : '<div class="asset-item">暂无资产，把画布图片右键加入资产，或拖到上方分类</div>';
}

function assetCardHTML(asset) {
  const media = asset.type === 'image'
    ? `<img src="${escapeAttr(asset.url)}" alt="">`
    : asset.type === 'video'
      ? `<video src="${escapeAttr(asset.url)}" muted></video>`
      : '<div class="asset-audio">音频</div>';
  return `
    <div class="asset-card" data-asset="${asset.id}">
      <div class="asset-thumb">${media}</div>
      <div class="asset-name">${escapeHtml(asset.name || asset.title || '未命名资产')}</div>
      <div class="asset-kind">${assetCategoryName(asset.category)}</div>
    </div>
  `;
}

function assetCategory(n) {
  const text = `${n.title || ''} ${n.role || ''}`.toLowerCase();
  if (/人物|角色|人像|美女|face|person|character|model/.test(text)) return 'person';
  if (/场景|背景|城市|竹林|海|room|scene|bg/.test(text)) return 'scene';
  if (/风格|style|色彩|调色|美学/.test(text)) return 'style';
  if (n.type === 'image') return 'object';
  return 'other';
}

function assetCategoryName(category) {
  return { person: '人物', scene: '场景', object: '物品', style: '风格', other: '其他' }[category] || '其他';
}

function showProjectBoard() {
  persistCurrentProjectSnapshot();
  state.projectView = true;
  state.materialView = false;
  els.materialBoard?.classList.add('hidden');
  els.projectBoard?.classList.remove('hidden');
  updateProjectTitleBar();
  renderProjectBoard();
}

function hideProjectBoard() {
  state.projectView = false;
  els.projectBoard?.classList.add('hidden');
  updateProjectTitleBar();
}

function showMaterialBoard(kind = 'materials') {
  persistCurrentProjectSnapshot();
  state.projectView = false;
  state.materialView = kind;
  els.projectBoard?.classList.add('hidden');
  els.materialBoard?.classList.remove('hidden');
  updateProjectTitleBar();
  renderMaterialBoard();
}

function hideMaterialBoard() {
  state.materialView = false;
  els.materialBoard?.classList.add('hidden');
  updateProjectTitleBar();
}

function markTopSection(mode = 't2i') {
  document.querySelectorAll('.segmented button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

function activateCanvasMode(mode = state.mode || 'i2i') {
  const nextMode = mode === 't2i' ? 'i2i' : mode;
  state.mode = nextMode;
  state.projectView = false;
  state.materialView = false;
  els.projectBoard?.classList.add('hidden');
  els.materialBoard?.classList.add('hidden');
  markTopSection('t2i');
  fillModelSelect();
}

function renderMaterialBoard() {
  if (!els.materialBoard || !state.materialView) return;
  if (state.materialView === 'prompts') {
    renderPromptPresetBoard();
    return;
  }
  if (state.materialView === 'clone') {
    renderCloneBoard();
    return;
  }
  renderLocalMaterialBoard();
}

function materialAssetsForFilter() {
  const type = state.materialFilter || 'all';
  return (state.assets || []).filter(asset => {
    if (type === 'all') return true;
    if (type === 'image') return asset.type === 'image';
    if (type === 'video') return asset.type === 'video';
    if (type === 'audio') return asset.type === 'audio';
    return asset.category === type;
  });
}

function renderLocalMaterialBoard() {
  const tabs = [
    ['all', '全部'],
    ['image', '图片'],
    ['video', '视频'],
    ['audio', '音频'],
  ];
  const assets = materialAssetsForFilter();
  els.materialBoard.innerHTML = `
    <div class="workspace-board material-drop-zone">
      <div class="workspace-head">
        <div>
          <h2>本地素材 <span>(${state.assets.length})</span></h2>
        </div>
        <div class="workspace-actions">
          <button type="button" data-material-upload="image">上传图片</button>
          <button type="button" data-material-upload="video">上传视频</button>
          <button type="button" data-material-upload="audio">上传音频</button>
        </div>
      </div>
      <div class="preset-tabs">
        ${tabs.map(([id, label]) => `<button type="button" class="${state.materialFilter === id ? 'active' : ''}" data-material-filter="${id}">${label}</button>`).join('')}
      </div>
      <div class="material-grid">
        ${assets.length ? assets.map(asset => `
          <div class="material-card" data-asset="${asset.id}" draggable="true">
            <div class="material-thumb">${assetMediaHTML(asset)}</div>
            <button type="button" class="material-rename" data-material-rename="${asset.id}" title="改名">✎</button>
            <button type="button" class="material-delete" data-material-delete="${asset.id}" title="删除">×</button>
            <strong>${escapeHtml(asset.name || asset.title || '未命名素材')}</strong>
            <span>${asset.type === 'image' ? '图片' : asset.type === 'video' ? '视频' : '音频'} · ${assetCategoryName(asset.category)}</span>
          </div>
        `).join('') : '<div class="empty-board">暂无素材，点击上传，或把本地文件/文件夹拖进来。</div>'}
      </div>
    </div>
  `;
}

function assetsCountForMaterial(type) {
  if (type === 'all') return state.assets.length;
  return (state.assets || []).filter(asset => type === asset.type || type === asset.category).length;
}

function assetMediaHTML(asset) {
  if (asset.type === 'image') return `<img src="${escapeAttr(asset.url)}" alt="">`;
  if (asset.type === 'video') return `<video src="${escapeAttr(asset.url)}" muted preload="metadata"></video>`;
  return '<div class="asset-audio big">音频</div>';
}

function presetCategoryCount(category) {
  if (category === 'all') return state.promptPresets.length;
  return state.promptPresets.filter(item => item.category === category).length;
}

function filteredPromptPresets() {
  return state.promptPresets.filter(item => state.promptPresetFilter === 'all' || item.category === state.promptPresetFilter);
}

function selectedPromptPreset() {
  const list = filteredPromptPresets();
  let preset = state.promptPresets.find(item => item.id === state.selectedPromptPresetId);
  if (!preset || !list.some(item => item.id === preset.id)) preset = list[0] || state.promptPresets[0] || null;
  if (preset) state.selectedPromptPresetId = preset.id;
  return preset;
}

function renderPromptPresetBoard() {
  if (!state.promptPresets.length) loadPromptPresets();
  const list = filteredPromptPresets();
  const selected = selectedPromptPreset();
  els.materialBoard.innerHTML = `
    <div class="workspace-board prompt-board">
      <div class="preset-tabs">
        ${PROMPT_PRESET_CATEGORIES.map(([id, label]) => `<button type="button" class="${state.promptPresetFilter === id ? 'active' : ''}" data-preset-filter="${id}">${label}</button>`).join('')}
        <button type="button" class="manage-btn" data-preset-new>+ 新增</button>
      </div>
      <div class="prompt-layout">
        <aside class="prompt-list">
          <div class="prompt-list-actions">
            <button type="button" data-preset-new>新增</button>
          </div>
          ${list.length ? list.map(item => `
            <button type="button" class="prompt-card ${item.id === selected?.id ? 'active' : ''}" data-preset-id="${item.id}">
              <strong>${escapeHtml(item.title || '未命名模板')}</strong>
              <span data-preset-card-delete="${item.id}">删除</span>
              <p>${escapeHtml(item.desc || '')}</p>
            </button>
          `).join('') : '<div class="empty-board">当前分类没有模板</div>'}
        </aside>
        <section class="prompt-detail">
          ${selected ? promptPresetDetailHTML(selected) : '<div class="empty-board">请选择一个模板</div>'}
        </section>
      </div>
    </div>
  `;
}

function categoryNameForPreset(category) {
  return PROMPT_PRESET_CATEGORIES.find(item => item[0] === category)?.[1] || '我的';
}

function promptPresetDetailHTML(item) {
  return `
    <div class="prompt-detail-head" data-preset-editor="${item.id}">
      <div>
        <input class="preset-title-input" data-preset-field="title" value="${escapeAttr(item.title || '')}" placeholder="提示词名字">
      </div>
      <div class="workspace-actions">
        <button type="button" data-preset-insert="${item.id}">插入到画布</button>
        <button type="button" data-preset-copy="${item.id}">复制提示词</button>
        <button type="button" data-preset-save="${item.id}">保存</button>
      </div>
    </div>
    <h3>正向提示词</h3>
    <textarea class="preset-textarea" data-preset-field="positive" placeholder="填写正向提示词...">${escapeHtml(item.positive || '')}</textarea>
    <h3>负向提示词</h3>
    <textarea class="preset-textarea" data-preset-field="negative" placeholder="填写负向提示词...">${escapeHtml(item.negative || '')}</textarea>
  `;
}

function renderCloneBoard() {
  els.materialBoard.innerHTML = `
    <div class="workspace-board">
      <div class="workspace-head">
        <div>
          <h2>爆款克隆</h2>
          <p>这里后续放视频链接、爆款结构拆解、镜头复刻和提示词生成。该页面不启用画布功能。</p>
        </div>
      </div>
      <div class="empty-board large">爆款克隆工作台已预留，后续可接入链接解析、脚本拆解和一键生成节点。</div>
    </div>
  `;
}

function upsertPromptPreset(existing = null) {
  const item = {
    id: existing?.id || uid('preset'),
    title: existing?.title || '新提示词模板',
    category: existing?.category || 'mine',
    tag: existing?.tag || '自定义',
    desc: existing?.desc || '自定义提示词模板',
    positive: existing?.positive || '',
    negative: existing?.negative || '',
    editing: true,
    createdAt: existing?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  const index = state.promptPresets.findIndex(preset => preset.id === item.id);
  if (index >= 0) state.promptPresets.splice(index, 1, item);
  else state.promptPresets.unshift(item);
  state.selectedPromptPresetId = item.id;
  state.promptPresetFilter = 'mine';
  savePromptPresets();
  renderMaterialBoard();
  setStatus(`已新增可编辑模板：${item.title}`);
}

function deletePromptPreset(id) {
  const item = state.promptPresets.find(preset => preset.id === id);
  if (!item || !confirm(`删除模板「${item.title}」？`)) return;
  if (DEFAULT_PROMPT_PRESETS.some(base => base.id === id)) hideDefaultPromptPreset(id);
  state.promptPresets = state.promptPresets.filter(preset => preset.id !== id);
  state.selectedPromptPresetId = filteredPromptPresets()[0]?.id || state.promptPresets[0]?.id || '';
  savePromptPresets();
  renderMaterialBoard();
  setStatus('提示词模板已删除');
}

function savePromptPresetFromEditor(id) {
  const item = state.promptPresets.find(preset => preset.id === id);
  if (!item) return;
  const editor = [...els.materialBoard.querySelectorAll('[data-preset-editor]')]
    .find(el => el.dataset.presetEditor === id);
  if (!editor) return;
  const titleInput = editor.querySelector('[data-preset-field="title"]');
  if (!titleInput) return;
  const title = titleInput.value?.trim();
  const positive = editor.parentElement.querySelector('[data-preset-field="positive"]')?.value || '';
  const negative = editor.parentElement.querySelector('[data-preset-field="negative"]')?.value || '';
  if (title) item.title = title;
  item.positive = positive;
  item.negative = negative;
  item.editing = false;
  item.updatedAt = Date.now();
  savePromptPresets();
  renderMaterialBoard();
  setStatus(`模板已保存：${item.title}`);
}

async function copyPromptPreset(id) {
  const item = state.promptPresets.find(preset => preset.id === id);
  if (!item) return;
  const text = [item.positive, item.negative ? `\n负向提示词：\n${item.negative}` : ''].join('').trim();
  try {
    await navigator.clipboard.writeText(text);
    setStatus('提示词已复制');
  } catch {
    setStatus('浏览器不允许自动复制，请手动选中文本复制');
  }
}

function insertPromptPresetToCanvas(id) {
  const item = state.promptPresets.find(preset => preset.id === id);
  if (!item) return;
  hideMaterialBoard();
  activateCanvasMode('i2i');
  const p = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
  addNode('text', p.x, p.y, {
    title: item.title,
    text: item.positive,
    w: 360,
    h: 220,
  });
  setStatus(`已插入提示词：${item.title}`);
}

function saveCurrentPromptAsPreset() {
  const selectedText = selectedNode()?.text || els.prompt?.value || '';
  upsertPromptPreset({
    id: uid('preset'),
    title: '当前提示词',
    category: 'mine',
    tag: '自定义',
    desc: '从当前输入保存',
    positive: selectedText,
    negative: '',
  });
}

function renderProjectBoard() {
  if (!els.projectBoard) return;
  const cards = (state.projects || []).map(project => `
    <button type="button" class="project-card ${project.id === state.currentProjectId ? 'active' : ''}" data-open-project="${project.id}">
      <div class="project-cover">
        ${project.cover ? `<img src="${escapeAttr(project.cover)}" alt="">` : '<span>空画布</span>'}
        <em>节点数：${project.count || 0}</em>
      </div>
      <div class="project-name">${escapeHtml(project.name)}</div>
      <div class="project-meta">${project.id === state.currentProjectId ? '正在编辑' : '点击进入'}</div>
      <span class="project-more" data-project-menu="${project.id}" title="项目操作">☰</span>
    </button>
  `).join('');
  els.projectBoard.innerHTML = `
    <div class="project-board-head">
      <div>
        <h2>我的项目 <span>(${state.projects.length})</span></h2>
        <p>点击项目进入对应画布，点 + 创建新的空白画布。</p>
      </div>
      <button type="button" data-new-project>+ 新建项目</button>
    </div>
    <div class="project-grid">
      <button type="button" class="project-card new-project" data-new-project>
        <strong>+</strong>
        <span>新建项目</span>
      </button>
      ${cards}
    </div>
  `;
}

function showProjectMenu(projectId, x, y) {
  const existing = document.querySelector('.project-action-menu');
  existing?.remove();
  const menu = document.createElement('div');
  menu.className = 'project-action-menu';
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.innerHTML = `
    <button data-project-action="detail" data-project-id="${projectId}">ⓘ 查看详情</button>
    <button data-project-action="rename" data-project-id="${projectId}">✎ 重命名</button>
    <button data-project-action="move" data-project-id="${projectId}">▣ 移动至</button>
    <button data-project-action="delete" data-project-id="${projectId}">⌫ 删除</button>
  `;
  document.body.appendChild(menu);
}

function hideProjectMenu() {
  document.querySelector('.project-action-menu')?.remove();
}

function showMaterialContextMenu(assetId, x, y) {
  document.querySelector('.material-action-menu')?.remove();
  const menu = document.createElement('div');
  menu.className = 'material-action-menu';
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.innerHTML = `<button type="button" data-material-action="import" data-material-id="${escapeAttr(assetId)}">导入画布</button>`;
  document.body.appendChild(menu);
}

function hideMaterialContextMenu() {
  document.querySelector('.material-action-menu')?.remove();
}

function renameProject(projectId) {
  const project = state.projects.find(item => item.id === projectId);
  if (!project) return;
  const name = prompt('请输入项目名称', project.name || '未命名项目');
  if (!name?.trim()) return;
  project.name = name.trim();
  project.updatedAt = Date.now();
  saveProjectStore();
  renderProjectBoard();
  setStatus(`项目已重命名：${project.name}`);
}

function deleteProject(projectId) {
  if (state.projects.length <= 1) {
    setStatus('至少保留一个项目');
    return;
  }
  const project = state.projects.find(item => item.id === projectId);
  if (!project || !confirm(`确认删除项目「${project.name}」？`)) return;
  state.projects = state.projects.filter(item => item.id !== projectId);
  if (state.currentProjectId === projectId) {
    state.currentProjectId = state.projects[0].id;
    restoreSnapshot(state.projects[0].snapshot || blankCanvasSnapshot());
  }
  saveProjectStore();
  renderProjectBoard();
  setStatus('项目已删除');
}

function projectDetail(projectId) {
  const project = state.projects.find(item => item.id === projectId);
  if (!project) return;
  setStatus(`${project.name}：${project.count || 0} 个节点`);
}

function openProject(projectId) {
  persistCurrentProjectSnapshot();
  const project = state.projects.find(item => item.id === projectId);
  if (!project) return;
  state.currentProjectId = project.id;
  hideProjectBoard();
  activateCanvasMode(state.mode);
  state.restoring = true;
  restoreSnapshot(project.snapshot || blankCanvasSnapshot());
  state.restoring = false;
  saveProjectStore();
  setStatus(`已进入项目：${project.name}`);
}

function createNewProject() {
  persistCurrentProjectSnapshot();
  const index = state.projects.length + 1;
  const project = {
    id: uid('project'),
    name: `新项目 ${index}`,
    snapshot: blankCanvasSnapshot(),
    cover: '',
    count: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  state.projects.unshift(project);
  state.currentProjectId = project.id;
  hideProjectBoard();
  activateCanvasMode('i2i');
  state.restoring = true;
  restoreSnapshot(project.snapshot);
  state.restoring = false;
  saveProjectStore();
  setStatus(`已进入空白画布：${project.name}`);
}

function nodeAssetPayload(node, overrides = {}) {
  const url = node?.resultUrl || node?.url || '';
  if (!node || !url) return null;
  const type = ['video', 'audio'].includes(node.type) ? node.type : 'image';
  return {
    id: uid('asset'),
    sourceNodeId: node.id,
    type,
    url,
    mime: node.mime || (type === 'image' ? 'image/png' : type === 'video' ? 'video/mp4' : ''),
    name: overrides.name || node.title || '我的资产',
    title: overrides.name || node.title || '我的资产',
    category: overrides.category || 'person',
    role: node.role || roleForType(type),
    imageRatio: node.imageRatio || node.naturalRatio || 0,
    naturalWidth: node.naturalWidth || 0,
    naturalHeight: node.naturalHeight || 0,
    createdAt: Date.now(),
  };
}

function addAssetFromNode(nodeId, options = {}) {
  const node = state.nodes.find(n => n.id === nodeId);
  const asset = nodeAssetPayload(node, options);
  if (!asset) {
    setStatus('这个节点没有可加入资产的图片');
    return null;
  }
  state.assets = [
    asset,
    ...(state.assets || []).filter(item => item.url !== asset.url),
  ].slice(0, 200);
  renderAssets();
  saveCanvas();
  setStatus(`已加入资产：${asset.name}`);
  return asset;
}

function addAssetNodeToCanvas(asset, point = screenToWorld(window.innerWidth / 2, window.innerHeight / 2)) {
  if (!asset) return null;
  const node = addNode(asset.type, point.x, point.y, {
    title: asset.name || asset.title,
    url: asset.url,
    mime: asset.mime,
    kind: asset.kind,
    role: asset.role,
    imageRatio: asset.imageRatio,
    naturalWidth: asset.naturalWidth,
    naturalHeight: asset.naturalHeight,
  });
  setStatus(`已添加到画布：${asset.name || asset.title || '素材'}`);
  return node;
}

function openAssetDialog(nodeId, category = '') {
  const node = state.nodes.find(n => n.id === nodeId);
  const url = node?.resultUrl || node?.url || '';
  if (!node || !url || !els.assetDialog) return;
  state.assetDraftNodeId = nodeId;
  els.assetName.value = node.title || '我的资产';
  els.assetCategory.value = category || assetCategory(node);
  els.assetDialogPreview.innerHTML = `<img src="${escapeAttr(url)}" alt="">`;
  els.assetDialog.classList.remove('hidden');
}

function closeAssetDialog() {
  state.assetDraftNodeId = null;
  els.assetDialog?.classList.add('hidden');
}

function assetNodeIdFromDrop(event) {
  const direct = event.dataTransfer.getData('application/x-ai-canvas-asset-node');
  if (direct) return direct;
  const text = event.dataTransfer.getData('text/plain') || '';
  try {
    const data = JSON.parse(text);
    if (data?.type === 'asset-node' && data.nodeId) return data.nodeId;
  } catch {
    // Plain text drops are ignored unless they contain our JSON payload.
  }
  return '';
}

function renderHistory() {
  if (!els.historyList) return;
  const items = state.generationHistory.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 200);
  els.historyList.innerHTML = items.length
    ? items.map(historyItemHTML).join('')
    : '<div class="history-item empty">暂无生成历史</div>';
}

function historyItemHTML(item) {
  const url = item.url || '';
  const isVideo = String(item.mime || '').startsWith('video/');
  const isImage = String(item.mime || '').startsWith('image/') || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url);
  const thumb = url
    ? `<div class="history-thumb">
        ${isVideo
          ? `<video src="${escapeAttr(url)}" muted preload="metadata"></video><span class="history-media-badge">视频</span>`
          : isImage
            ? `<img src="${escapeAttr(url)}" alt="" loading="lazy">`
            : '<span class="history-file">文件</span>'}
      </div>`
    : '<div class="history-thumb empty-thumb">无预览</div>';
  return `<div class="history-item" data-history-result="${item.id}">
    ${thumb}
    <div class="history-meta">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.kind)}${item.status ? ` · ${escapeHtml(item.status)}` : ''}</span>
    </div>
  </div>`;
}

function addGenerationHistory(item) {
  state.generationHistory.unshift({
    id: uid('history'),
    title: item.title || '生成结果',
    kind: item.kind || '生成',
    url: item.url || '',
    mime: item.mime || '',
    createdAt: Date.now(),
  });
  state.generationHistory = state.generationHistory.slice(0, 80);
  renderHistory();
  saveCanvas();
}

function canOutput(type) {
  return ['text', 'prompt', 'image', 'video', 'audio', 'script', 'result', 'world', 't2i', 'i2i', 't2v', 'i2v', 'director', 'compare'].includes(type);
}

function canInput(type) {
  return ['image', 'video', 'audio', 't2i', 'i2i', 'i2v', 't2v', 'script', 'result', 'world', 'director', 'compare'].includes(type);
}

function eventNodeElement(target) {
  return target?.closest?.('.node, .param-panel') || null;
}

function linkHandleFromPointer(event) {
  const directPort = event.target?.closest?.('.port');
  if (directPort) {
    return {
      nodeEl: directPort.closest('.node'),
      portKind: directPort.dataset.port,
    };
  }
  for (const el of document.elementsFromPoint(event.clientX, event.clientY)) {
    const port = el.closest?.('.port');
    if (port) {
      return {
        nodeEl: port.closest('.node'),
        portKind: port.dataset.port,
      };
    }
  }
  if (event.target.closest('textarea,input,select,button,audio,video,.resize-handle')) return null;
  const nodeEl = event.target.closest('.node');
  if (!nodeEl) return null;
  const rect = nodeEl.getBoundingClientRect();
  const hotZone = 28;
  if (event.clientX >= rect.right - hotZone && event.clientX <= rect.right + hotZone) {
    return { nodeEl, portKind: 'out' };
  }
  if (event.clientX >= rect.left - hotZone && event.clientX <= rect.left + hotZone) {
    return { nodeEl, portKind: 'in' };
  }
  return null;
}

function renderLinks() {
  els.links.innerHTML = `
    <defs>
      <filter id="linkGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="3" result="blur"></feGaussianBlur>
        <feMerge>
          <feMergeNode in="blur"></feMergeNode>
          <feMergeNode in="SourceGraphic"></feMergeNode>
        </feMerge>
      </filter>
    </defs>
  `;
  for (const link of state.links) {
    if (!link.id) link.id = uid('link');
    const a = state.nodes.find(n => n.id === link.from);
    const b = state.nodes.find(n => n.id === link.to);
    if (!a || !b) continue;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const x1 = a.x + a.w;
    const y1 = a.y + 53;
    const x2 = b.x;
    const y2 = b.y + 53;
    const dx = Math.max(80, Math.abs(x2 - x1) * 0.35);
    path.setAttribute('d', `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-width', String(state.grid.linkWidth || 3));
    const videoLinkClass = ['t2v', 'i2v'].includes(b.type) ? ' video-link' : '';
    path.setAttribute('class', `link-path${videoLinkClass}${link.id === state.selectedLinkId ? ' selected' : ''}`);
    path.dataset.id = link.id;
    els.links.appendChild(path);
  }
  if (state.linking) {
    const sourceIds = state.linking.sourceIds || [state.linking.sourceId];
    if (state.linking.port === 'in') {
      const target = state.nodes.find(n => n.id === state.linking.targetId);
      drawTempLink(state.linking.to, state.linking.from, ['t2v', 'i2v'].includes(target?.type));
    } else {
      for (const sourceId of sourceIds) {
        const source = state.nodes.find(n => n.id === sourceId);
        if (!source) continue;
        const from = sourceId === state.linking.sourceId && state.linking.from
          ? state.linking.from
          : { x: source.x + source.w, y: source.y + 53 };
        drawTempLink(from, state.linking.to, ['t2v', 'i2v'].includes(source.type));
      }
    }
  }
  if (!state.linking && state.pendingLink?.point && pendingFromIds().length) {
    for (const fromId of pendingFromIds()) {
      const source = state.nodes.find(n => n.id === fromId);
      if (!source) continue;
      drawTempLink({ x: source.x + source.w, y: source.y + 53 }, state.pendingLink.point, ['t2v', 'i2v'].includes(source.type));
    }
  }
}

let linkRenderFrame = 0;

function scheduleRenderLinks() {
  if (linkRenderFrame) return;
  linkRenderFrame = requestAnimationFrame(() => {
    linkRenderFrame = 0;
    renderLinks();
  });
}

function drawTempLink(from, to, video = false) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const dx = Math.max(80, Math.abs(to.x - from.x) * 0.35);
  path.setAttribute('d', `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-width', String(Math.max(2, Number(state.grid.linkWidth || 3))));
  path.setAttribute('class', `link-path temp-link${video ? ' video-link' : ''}`);
  els.links.appendChild(path);
}

function linkNearPoint(link, point, threshold = 10) {
  const a = state.nodes.find(n => n.id === link.from);
  const b = state.nodes.find(n => n.id === link.to);
  if (!a || !b) return false;
  const x1 = a.x + a.w;
  const y1 = a.y + 53;
  const x2 = b.x;
  const y2 = b.y + 53;
  const dx = Math.max(80, Math.abs(x2 - x1) * 0.35);
  let prev = { x: x1, y: y1 };
  for (let i = 1; i <= 36; i++) {
    const t = i / 36;
    const p = cubicPoint(
      { x: x1, y: y1 },
      { x: x1 + dx, y: y1 },
      { x: x2 - dx, y: y2 },
      { x: x2, y: y2 },
      t,
    );
    if (distanceToSegment(point, prev, p) <= threshold / state.scale) return true;
    prev = p;
  }
  return false;
}

function cubicPoint(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return {
    x: mt ** 3 * p0.x + 3 * mt ** 2 * t * p1.x + 3 * mt * t ** 2 * p2.x + t ** 3 * p3.x,
    y: mt ** 3 * p0.y + 3 * mt ** 2 * t * p1.y + 3 * mt * t ** 2 * p2.y + t ** 3 * p3.y,
  };
}

function distanceToSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function cutLinkAt(clientX, clientY) {
  const point = screenToWorld(clientX, clientY);
  const link = state.links.find(l => linkNearPoint(l, point));
  if (!link) return false;
  deleteLink(link.id);
  setStatus('关系线已剪断');
  return true;
}

function updateNodeInfo() {
  if (!els.nodeInfo) return;
  const node = state.nodes.find(n => n.id === state.selectedId);
  const link = state.links.find(l => l.id === state.selectedLinkId);
  if (!node) {
    if (link) {
      const from = state.nodes.find(n => n.id === link.from);
      const to = state.nodes.find(n => n.id === link.to);
      els.nodeInfo.innerHTML = `
        <strong>鍏崇郴绾?/strong><br>
        从：${escapeHtml(from?.title || link.from)}<br>
        鍒帮細${escapeHtml(to?.title || link.to)}<br>
        鎸?Delete 鍙垹闄よ繖鏉＄嚎
      `;
      return;
    }
    els.nodeInfo.textContent = '未选中';
    return;
  }
  els.nodeInfo.innerHTML = `
    <strong>${escapeHtml(node.title)}</strong><br>
    类型：${typeNames[node.type] || node.type}<br>
    位置：${Math.round(node.x)}, ${Math.round(node.y)}<br>
    ${node.url ? `文件：<a href="${node.url}" target="_blank">${escapeHtml(node.url)}</a><br>` : ''}
    ${node.role ? `角色：${escapeHtml(node.role)}` : ''}
  `;
}


async function readJsonResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    const plain = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return {
      ok: false,
      error: `HTTP ${res.status} 返回的不是 JSON：${plain.slice(0, 220) || text.slice(0, 220)}`,
      raw: text,
    };
  }
}
function escapeHtml(text) {
  return String(text || '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function escapeAttr(text) {
  return escapeHtml(text);
}

function hideMenu() {
  els.menu.classList.add('hidden');
}

function isAssetCandidateNode(node) {
  return !!(node && ['image', 't2i', 'i2i'].includes(node.type) && (node.url || node.resultUrl));
}

function showMenu(x, y, options = {}) {
  els.menu.style.left = `${x}px`;
  els.menu.style.top = `${y}px`;
  if (!options.keepPendingLink) state.pendingLink = null;
  const hasMultiSelection = state.selectedIds.length > 1;
  if (els.menuTitle) els.menuTitle.textContent = hasMultiSelection ? '选区操作' : options.keepPendingLink ? '连接到' : '添加节点';
  els.menu.querySelectorAll('.selected-menu').forEach(el => {
    el.classList.toggle('hidden', !hasMultiSelection);
  });
  const menuNode = state.nodes.find(n => n.id === state.menuNodeId);
  els.menu.querySelectorAll('.image-node-menu').forEach(el => {
    el.classList.toggle('hidden', !isAssetCandidateNode(menuNode));
  });
  els.menu.classList.remove('hidden');
  renderLinks();
}

function imageMetaForFile(file) {
  if (!file?.type?.startsWith('image/')) return Promise.resolve({});
  return new Promise(resolve => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    const finish = meta => {
      URL.revokeObjectURL(objectUrl);
      resolve(meta);
    };
    img.onload = () => {
      const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 0;
      finish({
        imageRatio: ratio,
        naturalWidth: img.naturalWidth || 0,
        naturalHeight: img.naturalHeight || 0,
      });
    };
    img.onerror = () => finish({});
    img.src = objectUrl;
  });
}

async function uploadFiles(files, point) {
  if (!files.length) return;
  const sourceFiles = [...files];
  const metas = await Promise.all(sourceFiles.map(file => imageMetaForFile(file)));
  const form = new FormData();
  for (const file of sourceFiles) form.append('files', file);
  setStatus('上传中...');
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  const data = await readJsonResponse(res);
  let x = point.x;
  let y = point.y;
  const created = [];
  for (const [index, file] of (data.files || []).entries()) {
    const node = addNode(file.kind === 'file' ? 'text' : file.kind, x, y, {
      title: file.name,
      url: file.url,
      mime: file.mime,
      kind: file.kind,
      ...(metas[index] || {}),
    });
    created.push(node);
    x += Math.max(250, (node.w || 220) + 28);
  }
  if (state.pendingLink && created[0]) {
    connectPendingTo(created[0].id);
  }
  renderAssets();
  renderHistory();
  if (state.projectView) renderProjectBoard();
  setStatus('上传完成');
}

async function uploadFilesToAssets(files, category = 'object') {
  if (!files.length) return;
  const sourceFiles = [...files];
  const metas = await Promise.all(sourceFiles.map(file => imageMetaForFile(file)));
  const form = new FormData();
  for (const file of sourceFiles) form.append('files', file);
  setStatus('素材上传中...');
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  const data = await readJsonResponse(res);
  const uploaded = (data.files || []).map((file, index) => ({
    id: uid('asset'),
    sourceNodeId: '',
    type: file.kind === 'file' ? 'audio' : file.kind,
    url: file.url,
    mime: file.mime || '',
    name: file.name,
    title: file.name,
    category: category === 'auto' ? assetCategory({ title: file.name, type: file.kind }) : category,
    role: roleForType(file.kind),
    ...(metas[index] || {}),
    createdAt: Date.now(),
  }));
  state.assets = [...uploaded, ...(state.assets || [])].slice(0, 300);
  renderAssets();
  if (state.materialView) renderMaterialBoard();
  saveCanvas();
  setStatus(`已上传 ${uploaded.length} 个素材`);
}

function readEntryFile(entry) {
  return new Promise(resolve => entry.file(file => resolve(file), () => resolve(null)));
}

function readDirectoryEntries(reader) {
  return new Promise(resolve => reader.readEntries(entries => resolve(entries), () => resolve([])));
}

async function filesFromEntry(entry) {
  if (!entry) return [];
  if (entry.isFile) {
    const file = await readEntryFile(entry);
    return file ? [file] : [];
  }
  if (!entry.isDirectory) return [];
  const reader = entry.createReader();
  const result = [];
  while (true) {
    const entries = await readDirectoryEntries(reader);
    if (!entries.length) break;
    for (const child of entries) result.push(...await filesFromEntry(child));
  }
  return result;
}

async function filesFromDataTransfer(dataTransfer) {
  const items = [...(dataTransfer?.items || [])];
  if (!items.length) return [...(dataTransfer?.files || [])];
  const files = [];
  for (const item of items) {
    const entry = item.webkitGetAsEntry?.();
    if (entry) files.push(...await filesFromEntry(entry));
    else {
      const file = item.getAsFile?.();
      if (file) files.push(file);
    }
  }
  return files.filter(file => /^(image|video|audio)\//.test(file.type || ''));
}

function connectPendingTo(targetId) {
  if (!state.pendingLink) return;
  if (state.pendingLink.to) {
    if (state.pendingLink.to === targetId) return;
    state.links.push({
      id: uid('link'),
      from: targetId,
      to: state.pendingLink.to,
    });
    state.selectedLinkId = state.links[state.links.length - 1].id;
    const targetNode = state.nodes.find(n => n.id === state.pendingLink.to);
    if (targetNode && ['i2i', 'i2v'].includes(targetNode.type)) {
      targetNode.refOrder = [...(targetNode.refOrder || []).filter(id => id !== targetId), targetId];
    }
    state.selectedId = null;
    state.pendingLink = null;
    render();
    saveCanvas();
    return;
  }
  if (state.pendingLink.from === targetId) return;
  const target = state.nodes.find(n => n.id === targetId);
  if (!target || !canInput(target.type)) return;
  linkManyToTarget(pendingFromIds(), targetId);
  state.selectedLinkId = state.links[state.links.length - 1]?.id || null;
  state.selectedId = null;
  state.pendingLink = null;
  render();
  saveCanvas();
}

function pendingFromIds() {
  if (!state.pendingLink) return [];
  return (state.pendingLink.fromIds?.length ? state.pendingLink.fromIds : [state.pendingLink.from]).filter(Boolean);
}

function linkManyToTarget(sourceIds, targetId) {
  const targetNode = state.nodes.find(n => n.id === targetId);
  if (!targetNode) return;
  const linkedIds = [];
  for (const sourceId of sourceIds) {
    if (!sourceId || sourceId === targetId) continue;
    if (state.links.some(link => link.from === sourceId && link.to === targetId)) continue;
    state.links.push({
      id: uid('link'),
      from: sourceId,
      to: targetId,
    });
    linkedIds.push(sourceId);
  }
  if (linkedIds.length && ['i2i', 'i2v'].includes(targetNode.type)) {
    targetNode.refOrder = [
      ...(targetNode.refOrder || []).filter(id => !linkedIds.includes(id)),
      ...linkedIds,
    ];
  }
}

function imageModelForUtility(source) {
  return source?.model && ['banana', 'image2'].includes(source.model) ? source.model : 'image2';
}

function sourceAndInheritedImageIds(source) {
  const ids = source?.url || source?.resultUrl ? [source.id] : [];
  for (const ref of referencesForNode(source.id).filter(r => r.kind === 'image')) {
    if (ref.nodeId && !ids.includes(ref.nodeId)) ids.push(ref.nodeId);
  }
  return ids;
}

function imageUrlForNode(node) {
  if (!node) return '';
  if (node.resultUrl || node.url) return node.resultUrl || node.url;
  return referencesForNode(node.id).find(ref => ref.kind === 'image')?.url || '';
}

function loadImageForCanvas(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败，无法裁切'));
    img.src = url;
  });
}

async function cropImageGrid(nodeId, grid = 9) {
  const source = state.nodes.find(n => n.id === nodeId);
  const url = imageUrlForNode(source);
  if (!source || !url) {
    setStatus('请先选择一张图片再裁切');
    return;
  }
  const side = Math.sqrt(Number(grid || 9));
  if (!Number.isInteger(side)) return;
  try {
    setStatus(`正在裁切 ${grid} 宫格...`);
    const img = await loadImageForCanvas(url);
    const cropW = Math.floor(img.naturalWidth / side);
    const cropH = Math.floor(img.naturalHeight / side);
    const nodeW = Math.max(120, Math.min(220, Math.round((source.w || 240) / Math.max(1.4, side / 2))));
    const gap = 18;
    const startX = source.x + (source.w || 240) + 80;
    const startY = source.y;
    const created = [];
    for (let row = 0; row < side; row += 1) {
      for (let col = 0; col < side; col += 1) {
        const canvas = document.createElement('canvas');
        canvas.width = cropW;
        canvas.height = cropH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, col * cropW, row * cropH, cropW, cropH, 0, 0, cropW, cropH);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const node = addNode('image', startX + col * (nodeW + gap), startY + row * (Math.round(nodeW * cropH / cropW) + 56), {
          title: `${source.title || '图片'}_${row + 1}-${col + 1}`,
          url: dataUrl,
          mime: 'image/jpeg',
          role: 'grid_crop',
          w: nodeW,
          imageRatio: cropW / cropH,
          naturalWidth: cropW,
          naturalHeight: cropH,
        });
        created.push(node.id);
      }
    }
    state.selectedIds = created;
    state.selectedId = created[0] || source.id;
    render();
    saveCanvas();
    setStatus(`已裁切 ${grid} 宫格`);
  } catch (err) {
    setStatus(`裁切失败：${err.message}`);
  }
}

function toggleAnnotationMode(nodeId, enabled = true) {
  const node = state.nodes.find(n => n.id === nodeId);
  if (!node || !imageUrlForNode(node)) {
    setStatus('请先选择一张图片再标注');
    return;
  }
  node.annotationMode = enabled;
  node.annotationTool ||= 'brush';
  state.selectedId = node.id;
  render();
  saveCanvas();
  setStatus(enabled ? '已打开绘画注释：可画圈或添加文字' : '绘画注释已完成');
}

function annotationPoint(event, layer) {
  const rect = layer.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
    y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
  };
}

function createImageUtilityNode(sourceId, tool, options = {}) {
  const source = state.nodes.find(n => n.id === sourceId);
  if (!source) return;
  let prompt = IMAGE_UTILITY_PROMPTS[tool];
  if (tool === 'gridCrop') {
    const grid = options.grid || 9;
    const side = Math.sqrt(grid);
    prompt = `保持原图主体人物面部、服装特征、场景细节和光影不变，将原图按照${grid}宫格裁切方式重新排版成${side}×${side}网格，每一格展示不同裁切区域和局部细节，整体画面规整干净，高清画质，保留原图身份一致性`;
  }
  if (!prompt) return;
  const title = tool === 'characterSheet'
    ? '人物三视图'
    : tool === 'nineGrid'
      ? '九宫格'
      : tool === 'paintNote'
        ? '绘画注释'
        : `${options.grid || 9}宫格裁切`;
  const refIds = sourceAndInheritedImageIds(source);
  if (!refIds.length) {
    setStatus('请先生成图片，或连接参考图后再使用这个工具');
    return;
  }
  const node = addNode('i2i', source.x + (source.w || 360) + 80, source.y, {
    title,
    text: prompt,
    model: imageModelForUtility(source),
    aspect: tool === 'nineGrid' || tool === 'gridCrop' ? '1:1' : '16:9',
    quality: '2k',
    imageCount: 1,
    refOrder: refIds,
    panelW: 720,
    panelH: 220,
  });
  for (const refId of refIds) {
    state.links.push({
      id: uid('link'),
      from: refId,
      to: node.id,
    });
  }
  state.activeParamNodeId = node.id;
  state.selectedId = node.id;
  render();
  saveCanvas();
  setStatus(`已创建${title}图生图节点`);
}

function selectedReferences() {
  const selected = state.nodes.find(n => n.id === state.selectedId);
  const linkedSourceIds = selected
    ? state.links.filter(l => l.to === selected.id).map(l => l.from)
    : [];
  const sourcePool = linkedSourceIds.length
    ? state.nodes.filter(n => linkedSourceIds.includes(n.id))
    : state.nodes;
  const refs = sourcePool
    .filter(n => ['image', 'video', 'audio'].includes(n.type) && n.url)
    .map(n => ({ kind: n.type, url: absoluteUrl(n.url), role: n.role }));
  if (selected && ['image', 'video', 'audio'].includes(selected.type) && selected.url) {
    const first = { kind: selected.type, url: absoluteUrl(selected.url), role: selected.role };
    return [first, ...refs.filter(r => r.url !== first.url)];
  }
  return refs;
}

function absoluteUrl(url) {
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  return `${location.origin}${url}`;
}

async function generate() {
  const selectedNode = state.nodes.find(n => n.id === state.selectedId);
  if (selectedNode && ['t2v', 'i2v'].includes(selectedNode.type)) {
    await generateFromNode(selectedNode.id);
    return;
  }
  const effectiveMode = ['t2i', 'i2i', 't2v', 'i2v'].includes(selectedNode?.type)
    ? selectedNode.type
    : state.mode;
  const promptFromNode = state.nodes.find(n => n.id === state.selectedId && ['prompt', 'text'].includes(n.type))?.text;
  const prompt = els.prompt?.value?.trim() || promptFromNode || '';
  if (!prompt) {
    setStatus('请先填写提示词');
    return;
  }
  if (isVideoMode(effectiveMode)) {
    selectVideoModel();
  }
  const payload = {
    mode: effectiveMode,
    prompt,
    model: isVideoMode(effectiveMode) ? videoModelName() : (els.model?.value || 'banana'),
    videoProvider: isVideoMode(effectiveMode) ? 'ark' : '',
    ratio: els.ratio.value,
    duration: Number(els.duration.value || 8),
    generateAudio: els.generateAudio.checked,
    watermark: els.watermark.checked,
    references: selectedReferences(),
    clientConfig: state.config,
  };
  setStatus('正在提交生成任务...');
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await readJsonResponse(res);
    if (!res.ok || data.unsupported) {
      const pretty = JSON.stringify(data.payload || data, null, 2);
      const p = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
      addNode('script', p.x, p.y, {
        title: `${typeNames[state.mode]} 请求草稿`,
        text: pretty,
        w: 300,
      });
      setStatus('该生图接口未接入，已生成请求草稿节点');
      return;
    }
    setStatus(`任务已提交：${data.taskId}`);
    pollTasks();
  } catch (err) {
    setStatus(`生成失败：${err.message}`);
  }
}

async function generateFromNode(nodeId) {
  const node = state.nodes.find(n => n.id === nodeId);
  if (!node || !['t2v', 'i2v'].includes(node.type)) return;
  const linkedPrompt = linkedPromptText(node.id);
  const prompt = node.type === 'i2v' ? ((node.text || '').trim() || linkedPrompt) : linkedPrompt;
  if (!prompt) {
    node.taskStatus = 'failed';
    node.progressText = '请在节点里填写提示词，或连接一个提示词节点';
    render();
    saveCanvas();
    return;
  }

  node.videoProvider ||= 'ark';
  node.model = node.videoProvider === 'multimodal'
    ? (state.config?.apis?.multimodal?.submitModel || videoModelName())
    : videoModelName();
  node.taskStatus = 'queued';
  node.progressText = '正在提交生成任务...';
  node.progressPercent = 12;
  node.resultUrl = '';
  render();
  saveCanvas();

  const payload = {
    mode: node.type,
    prompt,
    model: node.model,
    videoProvider: node.videoProvider || 'ark',
    ratio: node.ratio || '16:9',
    duration: Number(node.duration || 5),
    resolution: node.resolution || '4K',
    generateAudio: !!node.generateAudio,
    watermark: !!node.watermark,
    references: referencesForNode(node.id),
    clientConfig: state.config,
  };

  let progressTimer = null;
  try {
    await new Promise(resolve => requestAnimationFrame(resolve));
    node.taskStatus = 'running';
    node.progressText = '正在创建视频任务...';
    node.progressPercent = 28;
    render();
    saveCanvas();
    progressTimer = startSoftProgress(node.id, 28, 90);
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error || JSON.stringify(data));
    node.taskId = data.taskId;
    node.taskStatus = 'running';
    node.progressText = `生成中：${data.taskId}`;
    node.progressPercent = Math.max(35, Number(node.progressPercent || 0));
    render();
    saveCanvas();
    pollNodeTask(node.id, data.taskId);
  } catch (err) {
    if (progressTimer) window.clearInterval(progressTimer);
    node.taskStatus = 'failed';
    node.progressPercent = 100;
    node.progressText = `提交失败：${err.message}`;
    render();
    saveCanvas();
  }
}

async function generateImageFromNode(nodeId) {
  const node = state.nodes.find(n => n.id === nodeId);
  if (!node || !['t2i', 'i2i'].includes(node.type)) return;
  const linkedPrompt = linkedPromptText(node.id);
  const prompt = node.type === 'i2i' ? ((node.text || '').trim() || linkedPrompt) : linkedPrompt;
  if (!prompt) {
    node.taskStatus = 'failed';
    node.progressText = '请填写提示词，或连接提示词节点';
    render();
    saveCanvas();
    return;
  }
  const allRefs = node.type === 'i2i' ? referencesForNode(node.id).filter(ref => ref.kind === 'image' && ref.url) : [];
  const refs = node.type === 'i2i' ? referencesMentionedInPrompt(prompt, allRefs) : [];
  if (node.type === 'i2i' && !refs.length) {
    node.taskStatus = 'failed';
    node.progressText = allRefs.length
      ? '提示词里的 @编号 没有匹配到参考图，请使用 @1、@2 这样的编号，或删掉 @ 使用全部参考图'
      : '图生图必须连接至少一张原图参考';
    render();
    saveCanvas();
    return;
  }
  node.taskStatus = 'queued';
  node.progressText = '正在提交生图任务...';
  node.progressPercent = 12;
  node.resultUrl = '';
  render();
  saveCanvas();
  const payload = {
    mode: node.type,
    prompt,
    model: node.model || 'image2',
    ratio: node.aspect || '16:9',
    quality: node.quality || '2k',
    imageCount: Number(node.imageCount || 1),
    references: refs,
    clientConfig: state.config,
  };
  let progressTimer = null;
  try {
    await new Promise(resolve => requestAnimationFrame(resolve));
    node.taskStatus = 'running';
    node.progressText = '正在生成图片...';
    node.progressPercent = 35;
    render();
    saveCanvas();
    progressTimer = startSoftProgress(node.id, 35, 88);
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await readJsonResponse(res);
    if (progressTimer) window.clearInterval(progressTimer);
    if (!res.ok || data.unsupported) {
      node.taskStatus = 'failed';
      node.progressPercent = 100;
      node.progressText = data.error || '生图失败，请检查 API Key、网站地址或模型名称';
      render();
      saveCanvas();
      return;
    }
    if (data.taskId) {
      node.taskId = data.taskId;
      node.taskStatus = 'running';
      node.progressText = '云端后台生成中...';
      node.progressPercent = 45;
      render();
      saveCanvas();
      pollNodeTask(node.id, data.taskId);
      return;
    }
    if (data.url) {
      node.resultUrl = data.url;
      node.url = data.url;
      node.mime = 'image/png';
      node.taskStatus = '';
      node.progressPercent = 0;
      node.progressText = '';
      addGenerationHistory({
        title: `${node.model || 'image2'} 输出`,
        kind: node.type === 'i2i' ? '图生图' : '文生图',
        url: data.url,
        mime: 'image/png',
      });
      render();
      saveCanvas();
      setStatus('图片生成成功');
    }
  } catch (err) {
    node.taskStatus = 'failed';
    node.progressText = `提交失败：${err.message}`;
    render();
    saveCanvas();
  }
}

async function downloadImageForNode(nodeId) {
  const node = state.nodes.find(n => n.id === nodeId);
  const url = node?.resultUrl || node?.url;
  if (!url) return;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `${node.title || 'ai-canvas-image'}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
    setStatus('图片已下载');
  } catch (err) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${node.title || 'ai-canvas-image'}.png`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatus(`下载已打开：${err.message}`);
  }
}

function linkedPromptText(nodeId) {
  const sourceIds = state.links.filter(l => l.to === nodeId).map(l => l.from);
  const promptNode = state.nodes.find(n => sourceIds.includes(n.id) && ['prompt', 'text'].includes(n.type));
  return promptNode?.text?.trim() || '';
}

function referencesForNode(nodeId) {
  const sourceIds = state.links.filter(l => l.to === nodeId).map(l => l.from);
  if (!sourceIds.length) return [];
  const pool = state.nodes.filter(n => sourceIds.includes(n.id));
  const node = state.nodes.find(n => n.id === nodeId);
  const sorted = [...pool].sort((a, b) => {
    const ai = node?.refOrder?.indexOf(a.id) ?? -1;
    const bi = node?.refOrder?.indexOf(b.id) ?? -1;
    if (ai === -1 && bi === -1) return sourceIds.indexOf(a.id) - sourceIds.indexOf(b.id);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return sorted
    .map(referenceFromNode)
    .filter(Boolean);
}

function referenceFromNode(node) {
  const url = node.resultUrl || node.url || '';
  if (!url) return null;
  if (['image', 't2i', 'i2i'].includes(node.type)) {
    return { kind: 'image', url: absoluteUrl(url), role: node.role || 'reference_image', nodeId: node.id };
  }
  if (['video', 't2v', 'i2v'].includes(node.type)) {
    return { kind: 'video', url: absoluteUrl(url), role: node.role || 'reference_video', nodeId: node.id };
  }
  if (node.type === 'audio') {
    return { kind: 'audio', url: absoluteUrl(url), role: node.role || 'reference_audio', nodeId: node.id };
  }
  return null;
}

async function pollNodeTask(nodeId, taskId) {
  const node = state.nodes.find(n => n.id === nodeId);
  if (!node) return;
  try {
    const res = await fetch(`/api/task/${taskId}`);
    const task = await res.json();
    node.taskStatus = task.status || 'running';
    node.progressText = progressText(task);
    if (task.status === 'succeeded' && task.url) {
      node.resultUrl = task.url;
      node.url = task.url;
      const isImageNode = ['t2i', 'i2i'].includes(node.type);
      node.mime = isImageNode ? 'image/png' : 'video/mp4';
      node.title = `${node.model || (isImageNode ? 'image2' : 'doubao-seedance-2.0')} 输出`;
      node.taskStatus = isImageNode ? '' : 'succeeded';
      node.progressPercent = isImageNode ? 0 : 100;
      node.progressText = isImageNode ? '' : '生成成功';
      addGenerationHistory({
        title: node.title,
        kind: node.type === 'i2i' ? '图生图' : node.type === 't2i' ? '文生图' : node.type === 'i2v' ? '图生视频' : '文生视频',
        url: task.url,
        mime: node.mime,
      });
      render();
      saveCanvas();
      if (isImageNode) setStatus('图片生成成功');
      return;
    }
    if (task.status === 'failed') {
      node.progressText = task.error || '生成失败';
      render();
      saveCanvas();
      return;
    }
    updateNodeProgressDom(node);
    setTimeout(() => pollNodeTask(nodeId, taskId), 5000);
  } catch (err) {
    node.taskStatus = 'failed';
    node.progressText = `查询失败：${err.message}`;
    render();
    saveCanvas();
  }
}

function progressText(task) {
  if (!task) return '等待中';
  if (task.status === 'queued') return '排队中';
  if (task.status === 'creating') return '正在创建任务';
  if (task.status === 'running') return '生成中';
  if (task.status === 'succeeded') return '生成成功';
  if (task.status === 'failed') return task.error || '生成失败';
  return `状态：${task.status}`;
}

async function pollTasks() {
  try {
    const res = await fetch('/api/tasks');
    const data = await readJsonResponse(res);
    const tasks = Object.values(data.tasks || {}).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (els.tasks) els.tasks.innerHTML = tasks.map(task => taskHTML(task)).join('') || '暂无任务';
  } catch {
    // keep quiet during background polling
  }
}

function resumeNodeTasks() {
  for (const node of state.nodes) {
    if (!node.taskId || !['queued', 'running', 'creating'].includes(node.taskStatus)) continue;
    pollNodeTask(node.id, node.taskId);
  }
}

function taskHTML(task) {
  const url = task.url ? `<br><a href="${task.url}" target="_blank">打开结果</a>` : '';
  const err = task.error ? `<br><span style="color:#ef9aa0">${escapeHtml(task.error).slice(0, 160)}</span>` : '';
  return `<div class="task">
    <strong>${escapeHtml(task.model || '')}</strong><br>
    ${escapeHtml(task.id)}<br>
    状态：${escapeHtml(task.status || '')}${url}${err}
  </div>`;
}

async function loadConfig() {
  const res = await fetch('/api/config');
  const remoteConfig = await res.json();
  state.config = normalizeConfigShape(mergeConfig(remoteConfig, localUserConfig()));
  applyConfigToUI();
  refreshBalances();
}

function formatBalanceValue(info) {
  if (!info) return '¥ --';
  if (info.ok && info.balance !== null && info.balance !== undefined && info.balance !== '') {
    const value = Number(info.balance);
    if (Number.isFinite(value)) return `¥ ${value.toFixed(value >= 100 ? 2 : 3)}`;
    return `¥ ${info.balance}`;
  }
  if (info.error === 'missing_key') return '未配置';
  return '查询失败';
}

async function refreshBalances() {
  try {
    if (els.imageBalance) els.imageBalance.textContent = '查询中';
    if (els.videoBalance) els.videoBalance.textContent = '查询中';
    const res = await fetch('/api/balances', { cache: 'no-store' });
    const data = await readJsonResponse(res);
    if (els.imageBalance) {
      els.imageBalance.textContent = formatBalanceValue(data.image);
      els.imageBalance.title = data.image?.source || data.image?.message || '';
    }
    if (els.videoBalance) {
      els.videoBalance.textContent = formatBalanceValue(data.video);
      els.videoBalance.title = data.video?.source || data.video?.message || '';
    }
  } catch (err) {
    if (els.imageBalance) els.imageBalance.textContent = '查询失败';
    if (els.videoBalance) els.videoBalance.textContent = '查询失败';
  }
}

function referencesMentionedInPrompt(prompt, refs) {
  const matches = [...String(prompt || '').matchAll(/@(\d+)/g)]
    .map(match => Number(match[1]))
    .filter(num => Number.isInteger(num) && num > 0);
  if (!matches.length) return refs;
  const unique = [...new Set(matches)];
  return unique.map(num => refs[num - 1]).filter(Boolean);
}

function applyConfigToUI() {
  const cfg = state.config;
  if (els.ratio) els.ratio.value = cfg.defaults.ratio;
  if (els.duration) els.duration.value = cfg.defaults.duration;
  if (els.generateAudio) els.generateAudio.checked = !!cfg.defaults.generateAudio;
  if (els.watermark) els.watermark.checked = !!cfg.defaults.watermark;
  fillModelSelect();

  cfg.defaults.videoProvider = 'ark';
  document.querySelector('#providerArk').checked = true;
  document.querySelector('#imageModeStandard').checked = (cfg.defaults.imageSettingsMode || 'standard') === 'standard';
  document.querySelector('#imageModeI2i').checked = cfg.defaults.imageSettingsMode === 'i2i';
  document.querySelector('#arkBaseUrl').value = cfg.apis.ark.baseUrl || '';
  document.querySelector('#arkApiKey').value = cfg.apis.ark.apiKey || '';
  document.querySelector('#arkModel').value = cfg.apis.ark.modelName || 'doubao-seedance-2-0-260';
  document.querySelector('#bananaApiKey').value = cfg.apis.banana.apiKey || '';
  document.querySelector('#bananaWebsite').value = cfg.apis.banana.website || '';
  document.querySelector('#image2ApiKey').value = cfg.apis.image2.apiKey || '';
  document.querySelector('#image2Website').value = cfg.apis.image2.website || '';
  document.querySelector('#image2ModelName').value = cfg.apis.image2.modelName || 'gpt-image-2';
  document.querySelector('#i2iBaseUrl').value = cfg.apis.i2i.baseUrl || '';
  document.querySelector('#i2iApiKey').value = cfg.apis.i2i.apiKey || '';
  document.querySelector('#i2iWebsite').value = cfg.apis.i2i.website || 'https://www.dmxapi.cn';
  document.querySelector('#i2iModelName').value = cfg.apis.i2i.modelName || '';
  document.querySelector('#i2iEndpointType').value = cfg.apis.i2i.endpointType || 'custom-edits';
  document.querySelector('#i2iReferenceField').value = cfg.apis.i2i.referenceField || 'image';
  document.querySelector('#i2iIdentityPrompt').value = cfg.apis.i2i.identityPrompt || '';
  document.querySelector('#multiBaseUrl').value = cfg.apis.multimodal.baseUrl || 'https://www.dmxapi.cn/v1/responses';
  document.querySelector('#multiApiKey').value = cfg.apis.multimodal.apiKey || '';
  document.querySelector('#multiSubmitModel').value = cfg.apis.multimodal.submitModel || 'doubao-seedance-2-0-260128';
  document.querySelector('#multiQueryModel').value = cfg.apis.multimodal.queryModel || 'seedance-2-0-get';
  document.querySelector('#multiRequestFormat').value = cfg.apis.multimodal.requestFormat || 'responses-json';
  document.querySelector('#multiResolution').value = cfg.apis.multimodal.resolution || '4K';
  document.querySelector('#multiRatio').value = cfg.apis.multimodal.ratio || '16:9';
  document.querySelector('#multiDuration').value = String(cfg.apis.multimodal.duration || 8);
  document.querySelector('#multiWatermark').checked = !!cfg.apis.multimodal.watermark;
  document.querySelector('#multiReturnLastFrame').checked = !!cfg.apis.multimodal.returnLastFrame;
  document.querySelector('#multiWebSearch').checked = !!cfg.apis.multimodal.webSearch;
  document.querySelector('#imageModels').value = (cfg.models.image || []).join(', ');
  updateVideoProviderUI();
  updateImageSettingsModeUI();
}

function updateVideoProviderUI() {
  const provider = 'ark';
  const ark = document.querySelector('.settings-video-ark');
  [
    [ark, provider !== 'ark'],
  ].forEach(([panel, disabled]) => {
    if (!panel) return;
    panel.classList.toggle('settings-panel-disabled', disabled);
    panel.querySelectorAll('input, select, textarea').forEach(input => {
      if (input.name === 'videoProvider') return;
      input.disabled = disabled;
    });
  });
}

function updateImageSettingsModeUI() {
  const mode = document.querySelector('input[name="imageSettingsMode"]:checked')?.value || 'standard';
  const standard = document.querySelector('.settings-image-standard');
  const i2i = document.querySelector('.settings-i2i');
  [
    [standard, mode !== 'standard'],
    [i2i, mode !== 'i2i'],
  ].forEach(([panel, disabled]) => {
    if (!panel) return;
    panel.classList.toggle('settings-panel-disabled', disabled);
    panel.querySelectorAll('input, select, textarea').forEach(input => {
      if (input.name === 'imageSettingsMode') return;
      input.disabled = disabled;
    });
  });
}

function fillModelSelect() {
  const cfg = state.config;
  const list = isVideoMode(state.mode) ? cfg.models.video : cfg.models.image;
  const current = isVideoMode(state.mode) ? videoModelName() : cfg.defaults.imageModel;
  if (!els.model) return;
  els.model.innerHTML = (list || []).map(m => `<option>${escapeHtml(m)}</option>`).join('');
  els.model.value = current;
}

function isVideoMode(mode) {
  return mode === 't2v' || mode === 'i2v';
}

function videoModelName() {
  const cfg = state.config || {};
  return cfg.apis?.ark?.modelName || 'doubao-seedance-2-0-260';
}

function selectVideoModel() {
  if (!els.model) return;
  const model = videoModelName();
  if (![...els.model.options].some(option => option.value === model)) {
    const option = document.createElement('option');
    option.value = model;
    option.textContent = model;
    els.model.appendChild(option);
  }
  els.model.value = model;
}

function collectSettingsFromUI() {
  const cfg = normalizeConfigShape(state.config);
  cfg.defaults.videoProvider = 'ark';
  cfg.defaults.imageSettingsMode = document.querySelector('input[name="imageSettingsMode"]:checked')?.value || 'standard';
  cfg.apis.ark.baseUrl = document.querySelector('#arkBaseUrl').value.trim();
  cfg.apis.ark.apiKey = document.querySelector('#arkApiKey').value.trim();
  cfg.apis.ark.website = cfg.apis.ark.baseUrl.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '');
  cfg.apis.ark.modelName = document.querySelector('#arkModel').value.trim() || 'doubao-seedance-2-0-260';
  cfg.apis.banana.apiKey = document.querySelector('#bananaApiKey').value.trim();
  cfg.apis.banana.website = document.querySelector('#bananaWebsite').value.trim();
  cfg.apis.image2.apiKey = document.querySelector('#image2ApiKey').value.trim();
  cfg.apis.image2.website = document.querySelector('#image2Website').value.trim();
  cfg.apis.image2.modelName = document.querySelector('#image2ModelName').value.trim() || 'gpt-image-2';
  cfg.apis.i2i.baseUrl = document.querySelector('#i2iBaseUrl').value.trim();
  cfg.apis.i2i.apiKey = document.querySelector('#i2iApiKey').value.trim();
  cfg.apis.i2i.website = document.querySelector('#i2iWebsite').value.trim() || 'https://www.dmxapi.cn';
  cfg.apis.i2i.modelName = document.querySelector('#i2iModelName').value.trim();
  cfg.apis.i2i.endpointType = document.querySelector('#i2iEndpointType').value || 'custom-edits';
  cfg.apis.i2i.referenceField = 'image';
  cfg.apis.i2i.identityPrompt = document.querySelector('#i2iIdentityPrompt').value.trim();
  cfg.apis.multimodal.baseUrl = document.querySelector('#multiBaseUrl').value.trim() || 'https://www.dmxapi.cn/v1/responses';
  cfg.apis.multimodal.apiKey = document.querySelector('#multiApiKey').value.trim();
  cfg.apis.multimodal.website = 'https://www.dmxapi.cn';
  cfg.apis.multimodal.submitModel = document.querySelector('#multiSubmitModel').value.trim() || 'doubao-seedance-2-0-260128';
  cfg.apis.multimodal.queryModel = document.querySelector('#multiQueryModel').value.trim() || 'seedance-2-0-get';
  cfg.apis.multimodal.requestFormat = document.querySelector('#multiRequestFormat').value || 'responses-json';
  cfg.apis.multimodal.authMode = 'bearer';
  cfg.apis.multimodal.resolution = document.querySelector('#multiResolution').value || '4K';
  cfg.apis.multimodal.ratio = document.querySelector('#multiRatio').value || '16:9';
  cfg.apis.multimodal.duration = Number(document.querySelector('#multiDuration').value || 8);
  cfg.apis.multimodal.watermark = document.querySelector('#multiWatermark').checked;
  cfg.apis.multimodal.returnLastFrame = document.querySelector('#multiReturnLastFrame').checked;
  cfg.apis.multimodal.webSearch = document.querySelector('#multiWebSearch').checked;
  cfg.models.video = [cfg.apis.ark.modelName].filter(Boolean);
  cfg.models.image = document.querySelector('#imageModels').value.split(',').map(s => s.trim()).filter(Boolean);
  cfg.defaults.videoModel = cfg.apis.ark.modelName;
  cfg.defaults.imageModel = cfg.models.image[0] || 'banana';
  return cfg;
}

async function persistSettingsConfig(cfg) {
  persistUserConfig(cfg);
  await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cfg),
  }).catch(() => {});
  state.config = cfg;
  fillModelSelect();
}

async function saveSettings() {
  const cfg = collectSettingsFromUI();
  await persistSettingsConfig(cfg);
  els.settings.classList.add('hidden');
  refreshBalances();
  setStatus('设置已保存');
}

let settingsAutoSaveTimer = 0;

function autoSaveSettings() {
  if (els.settings?.classList.contains('hidden')) return;
  window.clearTimeout(settingsAutoSaveTimer);
  settingsAutoSaveTimer = window.setTimeout(async () => {
    try {
      const cfg = collectSettingsFromUI();
      await persistSettingsConfig(cfg);
      setStatus('设置已自动保存');
    } catch (err) {
      setStatus(`自动保存失败：${err.message}`);
    }
  }, 600);
}

function bindEvents() {
  let draggingStage = false;
  let draggingNode = null;
  let draggingGroup = null;
  let resizingNode = null;
  let resizingPanel = null;
  let draggingAssetNode = null;
  let drawingAnnotation = null;
  let draggingCompare = null;
  let last = { x: 0, y: 0 };

  els.gridSettingsToggle?.addEventListener('click', event => {
    event.stopPropagation();
    els.gridSettingsPanel?.classList.toggle('hidden');
  });

  els.agentFloat?.addEventListener('click', () => {
    els.agentDock?.classList.remove('hidden');
    els.agentFloat?.classList.add('hidden');
  });

  els.closeAgentDock?.addEventListener('click', () => {
    els.agentDock?.classList.add('hidden');
    els.agentFloat?.classList.remove('hidden');
  });

  els.agentUploadButton?.addEventListener('click', () => els.agentRefInput?.click());
  els.agentRefInput?.addEventListener('change', () => {
    addAgentRefFiles(els.agentRefInput.files || []);
    els.agentRefInput.value = '';
  });
  els.agentRefs?.addEventListener('click', event => {
    const btn = event.target.closest('[data-agent-ref-remove]');
    if (!btn) return;
    state.agentRefs.splice(Number(btn.dataset.agentRefRemove), 1);
    renderAgentRefs();
  });

  [els.gridSpacing, els.gridDot, els.linkWidth].forEach(input => {
    input?.addEventListener('input', () => {
      state.grid.spacing = Number(els.gridSpacing?.value || state.grid.spacing);
      state.grid.dot = Number(els.gridDot?.value || state.grid.dot);
      state.grid.linkWidth = Number(els.linkWidth?.value || state.grid.linkWidth);
      applyGridSettings();
      saveGridSettings();
    });
  });

  els.stage.addEventListener('contextmenu', event => {
    if (event.target.closest('#projectBoard, #materialBoard')) return;
    event.preventDefault();
    const nodeEl = event.target.closest('.node');
    state.menuNodeId = nodeEl?.dataset.id || null;
    if (nodeEl) {
      state.selectedId = nodeEl.dataset.id;
      state.selectedIds = [nodeEl.dataset.id];
      state.selectedLinkId = null;
    }
    state.menuPoint = screenToWorld(event.clientX, event.clientY);
    showMenu(event.clientX, event.clientY);
  });

  document.addEventListener('click', event => {
    if (!els.menu.contains(event.target)) hideMenu();
    if (!event.target.closest('#gridSettingsPanel') && !event.target.closest('#gridSettingsToggle')) {
      els.gridSettingsPanel?.classList.add('hidden');
    }
  });

  els.world.addEventListener('dblclick', event => {
    const nodeEl = event.target.closest('.node');
    if (!nodeEl) return;
    event.preventDefault();
    event.stopPropagation();
    state.selectedId = nodeEl.dataset.id;
    state.selectedIds = [nodeEl.dataset.id];
    state.selectedLinkId = null;
    toggleMaximizeSelectedNode();
  });

  els.stage.addEventListener('mousedown', event => {
    if (event.target.closest('#projectBoard, #materialBoard')) return;
    hideMenu();
    last = { x: event.clientX, y: event.clientY };
    if (event.target.closest('.annotation-toolbar')) return;
    const compareStage = event.target.closest('[data-compare-stage]');
    if (compareStage) {
      event.preventDefault();
      event.stopPropagation();
      const nodeEl = eventNodeElement(event.target);
      const node = state.nodes.find(n => n.id === nodeEl?.dataset.id);
      if (!node) return;
      draggingCompare = { nodeId: node.id, el: compareStage };
      const rect = compareStage.getBoundingClientRect();
      node.compareSplit = Math.max(3, Math.min(97, ((event.clientX - rect.left) / rect.width) * 100));
      compareStage.style.setProperty('--split', `${node.compareSplit}%`);
      return;
    }
    const annotationLayer = event.target.closest('[data-annotation-layer].active');
    if (annotationLayer) {
      event.preventDefault();
      event.stopPropagation();
      const nodeEl = eventNodeElement(event.target);
      const node = state.nodes.find(n => n.id === nodeEl?.dataset.id);
      if (!node) return;
      const point = annotationPoint(event, annotationLayer);
      if (node.annotationTool === 'text') {
        const text = prompt('输入标注文字');
        if (text?.trim()) {
          node.annotations = [...(node.annotations || []), { type: 'text', text: text.trim(), x: point.x, y: point.y, color: '#ccff00' }];
          render();
          saveCanvas();
        }
      } else {
        node.annotations = [...(node.annotations || []), { type: 'path', points: [point], color: '#ccff00' }];
        drawingAnnotation = { nodeId: node.id };
      }
      return;
    }
    if (state.scissors || event.shiftKey) {
      state.scissors = true;
      els.stage.classList.add('scissors');
      cutLinkAt(event.clientX, event.clientY);
      return;
    }
    const shouldPan = state.spacePan || event.button === 1;
    const panelEl = event.target.closest('.param-panel');
    if (panelEl) {
      event.stopPropagation();
      const node = state.nodes.find(n => n.id === panelEl.dataset.id);
      if (!node) return;
      state.selectedId = node.id;
      state.activeParamNodeId = node.id;
      state.selectedLinkId = null;
      const panelHandle = event.target.closest('.panel-resize-handle');
      if (panelHandle) {
        resizingPanel = {
          id: node.id,
          el: panelEl,
          startW: node.panelW || panelEl.offsetWidth,
          startH: node.panelH || panelEl.offsetHeight,
        };
      }
      updateNodeInfo();
      return;
    }
    const del = event.target.closest('[data-delete-node]');
    if (del) {
      event.stopPropagation();
      const nodeEl = event.target.closest('.node');
      deleteNode(nodeEl.dataset.id);
      return;
    }
    const resizeHandle = event.target.closest('.resize-handle');
    if (resizeHandle) {
      event.stopPropagation();
      const nodeEl = event.target.closest('.node');
      const node = state.nodes.find(n => n.id === nodeEl.dataset.id);
      state.selectedId = node.id;
      state.selectedIds = [];
      resizingNode = {
        id: node.id,
        el: nodeEl,
        startW: node.w || nodeEl.offsetWidth,
        startH: node.h || nodeEl.offsetHeight,
      };
      node.h = resizingNode.startH;
      document.querySelectorAll('.node.selected').forEach(el => el.classList.remove('selected'));
      nodeEl.classList.add('selected');
      updateNodeInfo();
      return;
    }
    const linkHandle = linkHandleFromPointer(event);
    if (linkHandle) {
      event.preventDefault();
      event.stopPropagation();
      const nodeEl = linkHandle.nodeEl;
      if (!nodeEl) return;
      const node = state.nodes.find(n => n.id === nodeEl.dataset.id);
      if (!node) return;
      state.selectedId = node.id;
      state.selectedLinkId = null;
      const portKind = linkHandle.portKind;
      const canStartFromPort = portKind === 'in' ? canInput(node.type) : canOutput(node.type);
      if (!canStartFromPort) return;
      const sourceIds = portKind === 'out' && state.selectedIds.includes(node.id) && state.selectedIds.length > 1
        ? state.selectedIds.filter(id => canOutput(state.nodes.find(n => n.id === id)?.type))
        : [node.id];
      const fromPoint = portKind === 'in'
        ? { x: node.x, y: node.y + 53 }
        : { x: node.x + node.w, y: node.y + 53 };
      state.linking = {
        sourceId: node.id,
        sourceIds,
        targetId: portKind === 'in' ? node.id : '',
        port: portKind,
        from: fromPoint,
        to: screenToWorld(event.clientX, event.clientY),
      };
      render();
      return;
    }
    const nodeEl = event.target.closest('.node');
    if (nodeEl) {
      const id = nodeEl.dataset.id;
      const clickedNode = state.nodes.find(n => n.id === id);
      const assetPreview = event.target.closest('[data-drag-asset-node]');
      if (assetPreview && isAssetCandidateNode(clickedNode) && event.ctrlKey) {
        draggingAssetNode = {
          id,
          startedAt: { x: event.clientX, y: event.clientY },
        };
        state.selectedId = id;
        state.selectedIds = [id];
        state.selectedLinkId = null;
        document.querySelectorAll('.node.selected').forEach(el => el.classList.remove('selected'));
        nodeEl.classList.add('selected');
        setStatus('拖到左侧资产分类，松手即可加入资产');
        event.preventDefault();
        return;
      }
      if (clickedNode && isGeneratorType(clickedNode.type)) {
        state.activeParamNodeId = clickedNode.id;
        clickedNode.expanded = true;
      }
      state.selectedId = id;
      if (!state.selectedIds.includes(id)) state.selectedIds = [];
      state.selectedLinkId = null;
      if (event.target.closest('textarea,input,select,button,audio,video')) {
        document.querySelectorAll('.node.selected').forEach(el => el.classList.remove('selected'));
        nodeEl.classList.add('selected');
        updateNodeInfo();
        return;
      }
      if (event.altKey) {
        const idsToClone = state.selectedIds.includes(id) && state.selectedIds.length > 1 ? state.selectedIds : [id];
        const clonedIds = cloneNodesWithLinks(idsToClone);
        draggingGroup = clonedIds.length > 1
          ? {
              ids: [...clonedIds],
              els: [...document.querySelectorAll('.node')].filter(el => clonedIds.includes(el.dataset.id)),
            }
          : null;
        if (!draggingGroup && clonedIds[0]) {
          draggingNode = {
            id: clonedIds[0],
            el: document.querySelector(`.node[data-id="${clonedIds[0]}"]`),
          };
        }
        return;
      }
      if (clickedNode?.type === 'group') {
        const members = clickedNode.members || [];
        state.selectedIds = [clickedNode.id, ...members];
        draggingGroup = {
          ids: [...state.selectedIds],
          els: [...document.querySelectorAll('.node')].filter(el => state.selectedIds.includes(el.dataset.id)),
        };
        document.querySelectorAll('.node.selected').forEach(el => el.classList.remove('selected'));
        nodeEl.classList.add('selected');
        updateNodeInfo();
        return;
      }
      if (state.selectedIds.includes(id) && state.selectedIds.length > 1) {
        draggingGroup = {
          ids: [...state.selectedIds],
          els: [...document.querySelectorAll('.node')].filter(el => state.selectedIds.includes(el.dataset.id)),
        };
      } else {
        draggingNode = {
          id,
          el: nodeEl,
        };
      }
      document.querySelectorAll('.node.selected').forEach(el => el.classList.remove('selected'));
      nodeEl.classList.add('selected');
      updateNodeInfo();
      return;
    }
    const linkPath = event.target.closest('.link-path');
    if (linkPath) {
      state.selectedLinkId = linkPath.dataset.id;
      state.selectedId = null;
      render();
      return;
    }
    state.selectedId = null;
    state.selectedIds = [];
    state.selectedLinkId = null;
    state.activeParamNodeId = null;
    if (shouldPan) {
      draggingStage = true;
      els.stage.classList.add('dragging');
    } else {
      state.selecting = {
        startScreen: { x: event.clientX, y: event.clientY },
        startWorld: screenToWorld(event.clientX, event.clientY),
      };
      updateSelectionBox(event.clientX, event.clientY);
    }
  });

  document.addEventListener('mousemove', event => {
    const dx = (event.clientX - last.x);
    const dy = (event.clientY - last.y);
    last = { x: event.clientX, y: event.clientY };
    if (draggingAssetNode) {
      document.querySelectorAll('[data-asset-filter]').forEach(btn => btn.classList.remove('drop-target'));
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('[data-asset-filter]');
      if (target) target.classList.add('drop-target');
      return;
    }
    if (resizingNode) {
      const node = state.nodes.find(n => n.id === resizingNode.id);
      node.w = Math.max(180, (node.w || resizingNode.startW) + dx / state.scale);
      node.h = node.fullscreenPreview
        ? Math.max(220, (node.h || resizingNode.startH) + dy / state.scale)
        : isGeneratorType(node.type)
        ? previewHeightForNode(node)
        : shouldKeepImageRatio(node)
          ? imageNodeHeight(node)
        : Math.max(110, (node.h || resizingNode.startH) + dy / state.scale);
      resizingNode.el.style.width = `${node.w}px`;
      resizingNode.el.style.height = `${node.h}px`;
      const panel = document.querySelector(`.param-panel[data-id="${node.id}"]`);
      if (panel) {
        panel.style.left = `${node.x}px`;
        panel.style.top = `${node.y + (node.h || previewHeightForNode(node)) + 12}px`;
      }
      scheduleRenderLinks();
      return;
    }
    if (resizingPanel) {
      const node = state.nodes.find(n => n.id === resizingPanel.id);
      node.panelW = Math.max(320, (node.panelW || resizingPanel.startW) + dx / state.scale);
      node.panelH = Math.max(120, (node.panelH || resizingPanel.startH) + dy / state.scale);
      resizingPanel.el.style.width = `${node.panelW}px`;
      resizingPanel.el.style.minHeight = `${node.panelH}px`;
      return;
    }
    if (state.selecting) {
      updateSelectionBox(event.clientX, event.clientY);
      return;
    }
    if (state.scissors || event.shiftKey) {
      if (cutLinkAt(event.clientX, event.clientY)) return;
    }
    if (state.linking) {
      state.linking.to = screenToWorld(event.clientX, event.clientY);
      scheduleRenderLinks();
    } else if (draggingCompare) {
      const node = state.nodes.find(n => n.id === draggingCompare.nodeId);
      const rect = draggingCompare.el.getBoundingClientRect();
      if (node) {
        node.compareSplit = Math.max(3, Math.min(97, ((event.clientX - rect.left) / rect.width) * 100));
        draggingCompare.el.style.setProperty('--split', `${node.compareSplit}%`);
      }
    } else if (drawingAnnotation) {
      const node = state.nodes.find(n => n.id === drawingAnnotation.nodeId);
      const layer = document.querySelector(`.node[data-id="${drawingAnnotation.nodeId}"] [data-annotation-layer]`);
      const lastAnnotation = node?.annotations?.[node.annotations.length - 1];
      if (node && layer && lastAnnotation?.type === 'path') {
        lastAnnotation.points.push(annotationPoint(event, layer));
        render();
      }
    } else if (draggingNode) {
      const node = state.nodes.find(n => n.id === draggingNode.id);
      node.x += dx / state.scale;
      node.y += dy / state.scale;
      updateGroupsForMembers([node.id]);
      draggingNode.el.style.left = `${node.x}px`;
      draggingNode.el.style.top = `${node.y}px`;
      const panel = document.querySelector(`.param-panel[data-id="${node.id}"]`);
      if (panel) {
        panel.style.left = `${node.x}px`;
        panel.style.top = `${node.y + (node.h || previewHeightForNode(node)) + 12}px`;
      }
      scheduleRenderLinks();
    } else if (draggingGroup) {
      for (const id of draggingGroup.ids) {
        const node = state.nodes.find(n => n.id === id);
        if (!node) continue;
        node.x += dx / state.scale;
        node.y += dy / state.scale;
      }
      updateGroupsForMembers(draggingGroup.ids);
      for (const el of draggingGroup.els) {
        const node = state.nodes.find(n => n.id === el.dataset.id);
        if (!node) continue;
        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;
      }
      scheduleRenderLinks();
    } else if (draggingStage) {
      state.pan.x += dx;
      state.pan.y += dy;
      applyTransform();
    }
  });

  document.addEventListener('mouseup', event => {
    if (draggingAssetNode) {
      const targetFilter = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('[data-asset-filter]');
      const leftbar = document.querySelector('.leftbar');
      const overLeftbar = !!document.elementFromPoint(event.clientX, event.clientY)?.closest?.('.leftbar');
      const activeFilter = document.querySelector('[data-asset-filter].active');
      const filter = targetFilter || (overLeftbar ? activeFilter : null);
      document.querySelectorAll('[data-asset-filter]').forEach(btn => btn.classList.remove('drop-target'));
      if (filter) {
        const category = filter.dataset.assetFilter === 'all' ? 'other' : filter.dataset.assetFilter;
        addAssetFromNode(draggingAssetNode.id, { category });
        document.querySelectorAll('[data-asset-filter]').forEach(btn => btn.classList.remove('active'));
        filter.classList.add('active');
        state.assetFilter = filter.dataset.assetFilter;
        renderAssets();
      } else {
        setStatus('未放到资产分类，已取消加入资产');
      }
      draggingAssetNode = null;
      return;
    }
    if (state.selecting) {
      finishSelection(event.clientX, event.clientY);
      state.selecting = null;
      els.selectionBox.classList.add('hidden');
      render();
      saveCanvas();
      return;
    }
    if (state.linking) {
      const target = eventNodeElement(document.elementFromPoint(event.clientX, event.clientY));
      const targetNode = target ? state.nodes.find(n => n.id === target.dataset.id) : null;
      if (state.linking.port === 'in' && targetNode && targetNode.id !== state.linking.targetId && canOutput(targetNode.type)) {
        linkManyToTarget([targetNode.id], state.linking.targetId);
        state.selectedLinkId = state.links[state.links.length - 1]?.id || null;
        state.selectedId = null;
        state.pendingLink = null;
      } else if (state.linking.port !== 'in' && targetNode && targetNode.id !== state.linking.sourceId && canInput(targetNode.type)) {
        linkManyToTarget(state.linking.sourceIds || [state.linking.sourceId], targetNode.id);
        state.selectedLinkId = state.links[state.links.length - 1]?.id || null;
        state.selectedId = null;
        state.pendingLink = null;
      } else {
        if (state.linking.port === 'in') {
          setStatus('请把线拖到可输出的节点上');
        } else {
          state.pendingLink = {
            from: state.linking.sourceId,
            fromIds: state.linking.sourceIds || [state.linking.sourceId],
            point: screenToWorld(event.clientX, event.clientY),
          };
          state.menuPoint = state.pendingLink.point;
          showMenu(event.clientX, event.clientY, { keepPendingLink: true });
        }
      }
      state.linking = null;
      render();
      saveCanvas();
      return;
    }
    if (resizingNode) {
      render();
      saveCanvas();
    }
    if (resizingPanel) {
      render();
      saveCanvas();
    }
    if (draggingNode || draggingGroup || draggingStage) saveCanvas();
    if (draggingNode) render();
    if (draggingGroup) render();
    resizingNode = null;
    resizingPanel = null;
    draggingNode = null;
    draggingGroup = null;
    draggingStage = false;
    els.stage.classList.remove('dragging');
  });

  document.addEventListener('keydown', event => {
    const tag = document.activeElement?.tagName;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      undoLast();
      return;
    }
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
    if (state.projectView || state.materialView) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      selectAllNodes();
      return;
    }
    if (drawingAnnotation) {
      drawingAnnotation = null;
      saveCanvas();
      return;
    }
    if (draggingCompare) {
      draggingCompare = null;
      saveCanvas();
      return;
    }
    if (event.code === 'Space') {
      const shell = activeVideoShell();
      if (shell?.querySelector('video')) {
        event.preventDefault();
        toggleVideoInShell(shell);
        return;
      }
      event.preventDefault();
      state.spacePan = true;
      setStatus('按住空格拖动画布');
      return;
    }
    if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      toggleMaximizeSelectedNode();
      return;
    }
    if (!event.ctrlKey && !event.metaKey && !event.altKey && event.code === 'Backquote') {
      event.preventDefault();
      toggleMaximizeSelectedNode();
      return;
    }
    if (event.key === 'Shift') {
      state.scissors = true;
      els.stage.classList.add('scissors');
      setStatus('按住 Shift 划过关系线即可删除');
      return;
    }
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    if (state.selectedIds.length > 1) {
      for (const id of [...state.selectedIds]) deleteNode(id, { silent: true });
      state.selectedIds = [];
      render();
      saveCanvas();
      setStatus('已删除选中节点');
    } else if (state.selectedId) {
      deleteNode(state.selectedId);
    } else if (state.selectedLinkId) {
      deleteLink(state.selectedLinkId);
    }
  });

  document.addEventListener('keyup', event => {
    if (event.code === 'Space') {
      state.spacePan = false;
      if (!state.selecting) setStatus('就绪');
    }
    if (event.key === 'Shift') {
      state.scissors = false;
      els.stage.classList.remove('scissors');
      setStatus('就绪');
    }
  });

  document.addEventListener('paste', event => {
    const tag = document.activeElement?.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
    const files = [...(event.clipboardData?.items || [])]
      .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter(Boolean);
    if (!files.length) return;
    event.preventDefault();
    const rect = els.stage.getBoundingClientRect();
    const point = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
    uploadFiles(files, point);
  });

  els.stage.addEventListener('wheel', event => {
    if (event.target.closest('#projectBoard, #materialBoard')) return;
    event.preventDefault();
    const before = screenToWorld(event.clientX, event.clientY);
    const factor = event.deltaY > 0 ? 0.9 : 1.1;
    state.scale = Math.min(2.2, Math.max(0.25, state.scale * factor));
    const rect = els.stage.getBoundingClientRect();
    state.pan.x = event.clientX - rect.left - before.x * state.scale;
    state.pan.y = event.clientY - rect.top - before.y * state.scale;
    applyTransform();
    saveCanvas();
  }, { passive: false });

  els.world.addEventListener('input', event => {
    const nodeEl = eventNodeElement(event.target);
    const field = event.target.dataset.field;
    if (!nodeEl || !field) return;
    const node = state.nodes.find(n => n.id === nodeEl.dataset.id);
    if (event.target.type === 'checkbox') {
      node[field] = event.target.checked;
    } else if (event.target.type === 'number' || field === 'duration') {
      node[field] = Number(event.target.value);
    } else {
      node[field] = event.target.value;
    }
    if (field === 'quality') node.qualityMigrated = true;
      if (els.prompt && (node.type === 'prompt' || node.type === 't2v' || node.type === 'i2v')) {
        els.prompt.value = node.text || '';
      }
    scheduleCanvasSave();
  });

  els.world.addEventListener('keydown', event => {
    const textarea = event.target.closest?.('textarea.param-prompt');
    if (!textarea) return;
    if (event.key === '@' || (event.shiftKey && event.code === 'Digit2')) {
      const panel = textarea.closest('.image-params, .node-body');
      const menu = panel?.querySelector('.ref-mention-menu');
      if (menu) {
        menu.classList.remove('hidden');
        setStatus('选择参考图编号：@1、@2...');
      }
    }
    if (event.key === 'Escape') {
      textarea.closest('.image-params, .node-body')?.querySelector('.ref-mention-menu')?.classList.add('hidden');
    }
  });

  els.world.addEventListener('click', event => {
    const mention = event.target.closest('[data-insert-ref-mention]');
    if (!mention) return;
    event.preventDefault();
    event.stopPropagation();
    const panel = mention.closest('.image-params, .node-body');
    const textarea = panel?.querySelector('textarea.param-prompt');
    if (!textarea) return;
    const value = mention.dataset.insertRefMention;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? start;
    const prefix = start > 0 && !/\s/.test(textarea.value[start - 1] || '') ? ' ' : '';
    const suffix = textarea.value[end] && !/\s/.test(textarea.value[end]) ? ' ' : '';
    textarea.setRangeText(`${prefix}${value}${suffix}`, start, end, 'end');
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    panel.querySelector('.ref-mention-menu')?.classList.add('hidden');
    textarea.focus();
  });

  els.world.addEventListener('change', event => {
    const nodeEl = eventNodeElement(event.target);
    const field = event.target.dataset.field;
    if (!nodeEl || !field) return;
    const node = state.nodes.find(n => n.id === nodeEl.dataset.id);
    if (event.target.type === 'checkbox') {
      node[field] = event.target.checked;
    } else if (event.target.type === 'number' || field === 'duration') {
      node[field] = Number(event.target.value);
    } else {
      node[field] = event.target.value;
    }
    if (field === 'quality') node.qualityMigrated = true;
    saveCanvas();
  });

  els.world.addEventListener('click', event => {
    const btn = event.target.closest('[data-generate-node]');
    if (!btn) return;
    event.stopPropagation();
    const nodeEl = eventNodeElement(event.target);
    state.selectedId = nodeEl.dataset.id;
    state.selectedLinkId = null;
    generateFromNode(state.selectedId);
  });

  els.world.addEventListener('click', event => {
    const btn = event.target.closest('[data-video-toggle]');
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    toggleVideoInShell(btn.closest('.node-preview-shell'));
  });

  els.world.addEventListener('input', event => {
    const scrubber = event.target.closest('[data-video-scrubber]');
    if (!scrubber) return;
    const shell = scrubber.closest('.node-preview-shell');
    const video = shell?.querySelector('video');
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    video.currentTime = (Number(scrubber.value) / 1000) * video.duration;
    syncVideoControls(shell);
  });

  els.world.addEventListener('timeupdate', event => {
    if (!event.target.matches('video.node-video-output')) return;
    syncVideoControls(event.target.closest('.node-preview-shell'));
  }, true);

  els.world.addEventListener('loadedmetadata', event => {
    if (!event.target.matches('video.node-video-output')) return;
    syncVideoControls(event.target.closest('.node-preview-shell'));
  }, true);

  els.world.addEventListener('play', event => {
    if (!event.target.matches('video.node-video-output')) return;
    syncVideoControls(event.target.closest('.node-preview-shell'));
  }, true);

  els.world.addEventListener('pause', event => {
    if (!event.target.matches('video.node-video-output')) return;
    syncVideoControls(event.target.closest('.node-preview-shell'));
  }, true);

  els.world.addEventListener('mouseenter', event => {
    const nodeEl = event.target.closest('.node');
    if (!nodeEl?.querySelector('video.node-video-output')) return;
    state.hoverVideoNodeId = nodeEl.dataset.id;
  }, true);

  els.world.addEventListener('mouseleave', event => {
    const nodeEl = event.target.closest('.node');
    if (nodeEl?.dataset.id === state.hoverVideoNodeId) state.hoverVideoNodeId = null;
  }, true);

  els.world.addEventListener('click', event => {
    const btn = event.target.closest('[data-download-video]');
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    const nodeEl = eventNodeElement(event.target);
    const node = state.nodes.find(n => n.id === nodeEl?.dataset.id);
    if (!node?.resultUrl && !node?.url) return;
    const a = document.createElement('a');
    a.href = node.resultUrl || node.url;
    a.download = `${node.title || 'ai-canvas-video'}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  els.world.addEventListener('dragstart', event => {
    const assetDrag = event.target.closest('[data-drag-asset-node]');
    if (assetDrag) {
      const payload = JSON.stringify({ type: 'asset-node', nodeId: assetDrag.dataset.dragAssetNode });
      event.dataTransfer.setData('application/x-ai-canvas-asset-node', assetDrag.dataset.dragAssetNode);
      event.dataTransfer.setData('text/plain', payload);
      event.dataTransfer.effectAllowed = 'copy';
      setStatus('拖到左侧分类即可加入资产');
      return;
    }
    const card = event.target.closest('[data-ref-index]');
    if (!card) {
      event.preventDefault();
      return;
    }
    const nodeEl = eventNodeElement(event.target);
    event.dataTransfer.setData('text/plain', JSON.stringify({
      nodeId: nodeEl.dataset.id,
      index: Number(card.dataset.refIndex),
    }));
  });

  els.world.addEventListener('dragover', event => {
    if (event.target.closest('[data-ref-index]')) event.preventDefault();
  });

  els.world.addEventListener('drop', event => {
    const card = event.target.closest('[data-ref-index]');
    if (!card) return;
    event.preventDefault();
    const nodeEl = eventNodeElement(event.target);
    const targetNode = state.nodes.find(n => n.id === nodeEl.dataset.id);
    if (!targetNode) return;
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
    } catch {
      return;
    }
    if (data.nodeId !== targetNode.id) return;
    const refs = referencesForNode(targetNode.id).filter(r => r.kind === 'image');
    const ids = refs.map(r => r.nodeId);
    const from = data.index;
    const to = Number(card.dataset.refIndex);
    if (from === to || from < 0 || to < 0) return;
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    targetNode.refOrder = ids;
    render();
    saveCanvas();
  });

  els.world.addEventListener('click', event => {
    const deleteRef = event.target.closest('[data-delete-ref]');
    if (!deleteRef) return;
    event.preventDefault();
    event.stopPropagation();
    const nodeEl = eventNodeElement(event.target);
    const node = state.nodes.find(n => n.id === nodeEl?.dataset.id);
    const card = event.target.closest('[data-ref-node-id]');
    const refId = card?.dataset.refNodeId;
    if (!node || !refId) return;
    state.links = state.links.filter(link => !(link.from === refId && link.to === node.id));
    node.refOrder = (node.refOrder || []).filter(id => id !== refId);
    render();
    saveCanvas();
    setStatus('参考图已移除');
  });

  els.world.addEventListener('click', event => {
    const download = event.target.closest('[data-download-image]');
    if (!download) return;
    event.stopPropagation();
    const nodeEl = eventNodeElement(event.target);
    downloadImageForNode(nodeEl.dataset.id);
  });

  els.world.addEventListener('click', async event => {
    const toolBtn = event.target.closest('[data-image-tool]');
    if (!toolBtn) return;
    event.preventDefault();
    event.stopPropagation();
    const nodeEl = eventNodeElement(event.target);
    const tool = toolBtn.dataset.imageTool;
    if (tool === 'paintNote') {
      toggleAnnotationMode(nodeEl.dataset.id, true);
      return;
    }
    createImageUtilityNode(nodeEl.dataset.id, tool);
  });

  els.world.addEventListener('click', event => {
    const gridBtn = event.target.closest('[data-image-grid]');
    if (!gridBtn) return;
    event.preventDefault();
    event.stopPropagation();
    const nodeEl = eventNodeElement(event.target);
    cropImageGrid(nodeEl.dataset.id, Number(gridBtn.dataset.imageGrid || 9));
  });

  els.world.addEventListener('click', event => {
    const tool = event.target.closest('[data-annotation-tool]');
    if (tool) {
      event.preventDefault();
      event.stopPropagation();
      const nodeEl = eventNodeElement(event.target);
      const node = state.nodes.find(n => n.id === nodeEl?.dataset.id);
      if (!node) return;
      node.annotationTool = tool.dataset.annotationTool;
      render();
      saveCanvas();
      return;
    }
    const clear = event.target.closest('[data-annotation-clear]');
    if (clear) {
      event.preventDefault();
      event.stopPropagation();
      const nodeEl = eventNodeElement(event.target);
      const node = state.nodes.find(n => n.id === nodeEl?.dataset.id);
      if (!node) return;
      node.annotations = [];
      render();
      saveCanvas();
      return;
    }
    const done = event.target.closest('[data-annotation-done]');
    if (done) {
      event.preventDefault();
      event.stopPropagation();
      const nodeEl = eventNodeElement(event.target);
      toggleAnnotationMode(nodeEl?.dataset.id, false);
    }
  });

  els.world.addEventListener('click', event => {
    const btn = event.target.closest('[data-generate-image]');
    if (!btn) return;
    event.stopPropagation();
    const nodeEl = eventNodeElement(event.target);
    state.selectedId = nodeEl.dataset.id;
    state.selectedLinkId = null;
    generateImageFromNode(state.selectedId);
  });

  els.world.addEventListener('click', event => {
    const addRef = event.target.closest('[data-add-ref]');
    if (!addRef) return;
    event.stopPropagation();
    const nodeEl = eventNodeElement(event.target);
    const node = state.nodes.find(n => n.id === nodeEl.dataset.id);
    state.pendingLink = {
      from: null,
      to: node.id,
      point: { x: node.x + 20, y: node.y + 20 },
    };
    state.menuPoint = { x: node.x + 20, y: node.y + 20 };
    els.imageInput.click();
  });

  els.world.addEventListener('click', event => {
    const openDirector = event.target.closest('[data-open-director-stage]');
    if (openDirector) {
      event.preventDefault();
      event.stopPropagation();
      els.directorStage?.classList.remove('hidden');
      return;
    }
    const addDirector = event.target.closest('[data-director-add]');
    if (!addDirector) return;
    event.preventDefault();
    event.stopPropagation();
    const nodeEl = eventNodeElement(event.target);
    const node = state.nodes.find(n => n.id === nodeEl.dataset.id);
    if (!node) return;
    const name = prompt('角色名称', `角色${(node.directors?.length || 0) + 1}`);
    if (!name?.trim()) return;
    node.directors = [...(node.directors || []), name.trim()];
    render();
    saveCanvas();
    setStatus(`已添加角色：${name.trim()}`);
  });

  els.closeDirectorStage?.addEventListener('click', () => {
    els.directorStage?.classList.add('hidden');
  });

  document.querySelectorAll('.segmented button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.segmented button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.mode === 't2i') {
        hideMaterialBoard();
        showProjectBoard();
        setStatus('项目入口已打开，点击卡片进入画布');
        return;
      }
      if (btn.dataset.mode === 'i2i') {
        showMaterialBoard('materials');
        setStatus('已打开本地素材库');
        return;
      }
      if (btn.dataset.mode === 't2v') {
        showMaterialBoard('prompts');
        setStatus('已打开提示词预设');
        return;
      }
      if (btn.dataset.mode === 'i2v') {
        showMaterialBoard('clone');
        setStatus('已打开爆款克隆');
      }
    });
  });

  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
      const action = btn.dataset.action;
      if (action === 'addText') addNode('text', p.x, p.y, { text: '新文本' });
      if (action === 'uploadImage') {
        state.menuPoint = p;
        els.imageInput.click();
      }
      if (action === 'uploadVideo') {
        state.menuPoint = p;
        els.videoInput.click();
      }
      if (action === 'uploadAudio') {
        state.menuPoint = p;
        els.audioInput.click();
      }
      if (action === 'addPrompt') addNode('prompt', p.x, p.y, { text: els.prompt?.value || '写一个提示词...' });
      if (action === 'addT2V') addNode('t2v', p.x, p.y, { title: '视频生成', text: els.prompt?.value || '' });
      if (action === 'fit') {
        fitAllNodes();
      }
      if (action === 'save') saveCanvas();
      if (action === 'clear' && confirm('确认清空画布？')) {
        state.nodes = [];
        state.links = [];
        state.selectedId = null;
        render();
        saveCanvas();
      }
    });
  });

  els.menu.addEventListener('click', event => {
    const item = event.target.closest('[data-menu]');
    if (!item) return;
    const type = item.dataset.menu;
    const p = state.menuPoint;
    els.menu.classList.add('hidden');
    let created = null;
    if (type === 'arrange') {
      arrangeSelectedNodes();
      return;
    } else if (type === 'group') {
      groupSelectedNodes();
      return;
    } else if (type === 'add-asset') {
      openAssetDialog(state.menuNodeId || state.selectedId);
      return;
    } else if (type === 'upload') {
      els.fileInput.click();
    } else if (type === 'upload-image') {
      els.imageInput.click();
    } else if (type === 'upload-video') {
      els.videoInput.click();
    } else if (type === 'upload-audio') {
      els.audioInput.click();
    } else {
      created = addNode(type, p.x, p.y, { text: type.includes('2') ? '生成节点' : '' });
      if (state.pendingLink) connectPendingTo(created.id);
    }
  });

  els.fileInput.addEventListener('change', () => {
    if (state.materialUploadType) uploadFilesToAssets([...els.fileInput.files], 'auto');
    else uploadFiles([...els.fileInput.files], state.menuPoint);
    state.materialUploadType = '';
    els.fileInput.value = '';
  });

  els.imageInput.addEventListener('change', () => {
    if (state.materialUploadType) uploadFilesToAssets([...els.imageInput.files], 'auto');
    else uploadFiles([...els.imageInput.files], state.menuPoint);
    state.materialUploadType = '';
    els.imageInput.value = '';
  });

  els.videoInput.addEventListener('change', () => {
    if (state.materialUploadType) uploadFilesToAssets([...els.videoInput.files], 'auto');
    else uploadFiles([...els.videoInput.files], state.menuPoint);
    state.materialUploadType = '';
    els.videoInput.value = '';
  });

  els.audioInput.addEventListener('change', () => {
    if (state.materialUploadType) uploadFilesToAssets([...els.audioInput.files], 'auto');
    else uploadFiles([...els.audioInput.files], state.menuPoint);
    state.materialUploadType = '';
    els.audioInput.value = '';
  });

  document.querySelectorAll('.rail-item').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!btn.dataset.tab) return;
      els.agentDock?.classList.add('hidden');
      els.agentFloat?.classList.remove('hidden');
      hideProjectBoard();
      const leftbar = document.querySelector('.leftbar');
      const isOpen = leftbar?.classList.contains('open');
      const isSame = btn.classList.contains('active');
      if (isOpen && isSame) {
        leftbar.classList.remove('open');
        btn.classList.remove('active');
        return;
      }
      document.querySelectorAll('.rail-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.side-tab').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector(`[data-panel="${btn.dataset.tab}"]`)?.classList.add('active');
      leftbar?.classList.add('open');
    });
  });

  els.assetList?.addEventListener('click', event => {
    const item = event.target.closest('[data-asset]');
    if (!item) return;
    const asset = (state.assets || []).find(n => n.id === item.dataset.asset);
    if (!asset) return;
    addAssetNodeToCanvas(asset);
  });

  els.projectBoard?.addEventListener('click', event => {
    const menuBtn = event.target.closest('[data-project-menu]');
    if (menuBtn) {
      event.preventDefault();
      event.stopPropagation();
      const rect = menuBtn.getBoundingClientRect();
      showProjectMenu(menuBtn.dataset.projectMenu, rect.left, rect.bottom + 6);
      return;
    }
    const newProject = event.target.closest('[data-new-project]');
    if (newProject) {
      hideProjectMenu();
      createNewProject();
      return;
    }
    const projectCard = event.target.closest('[data-open-project]');
    if (projectCard) {
      hideProjectMenu();
      openProject(projectCard.dataset.openProject);
    }
  });

  els.projectBoard?.addEventListener('mousedown', event => {
    event.stopPropagation();
  });

  els.projectTitleBar?.addEventListener('click', event => {
    event.preventDefault();
    showProjectBoard();
    setStatus('已返回项目管理');
  });

  els.projectTitleBar?.addEventListener('contextmenu', event => {
    event.preventDefault();
    const project = state.projects.find(item => item.id === state.currentProjectId);
    if (!project) return;
    const name = prompt('请输入项目名称', project.name || '默认项目');
    if (!name?.trim()) return;
    project.name = name.trim();
    project.updatedAt = Date.now();
    saveProjectStore();
    updateProjectTitleBar();
    setStatus(`项目已重命名：${project.name}`);
  });

  els.materialBoard?.addEventListener('mousedown', event => {
    event.stopPropagation();
  });

  els.materialBoard?.addEventListener('click', event => {
    const rename = event.target.closest('[data-material-rename]');
    if (rename) {
      event.preventDefault();
      event.stopPropagation();
      const asset = state.assets.find(item => item.id === rename.dataset.materialRename);
      if (!asset) return;
      const name = prompt('素材名称', asset.name || asset.title || '未命名素材');
      if (!name?.trim()) return;
      asset.name = name.trim();
      asset.title = name.trim();
      renderAssets();
      renderMaterialBoard();
      saveCanvas();
      setStatus(`素材已改名：${asset.name}`);
      return;
    }
    const deleteBtn = event.target.closest('[data-material-delete]');
    if (deleteBtn) {
      event.preventDefault();
      event.stopPropagation();
      const asset = state.assets.find(item => item.id === deleteBtn.dataset.materialDelete);
      if (!asset) return;
      if (!confirm(`删除素材「${asset.name || asset.title || '未命名素材'}」？`)) return;
      state.assets = (state.assets || []).filter(item => item.id !== asset.id);
      renderAssets();
      renderMaterialBoard();
      saveCanvas();
      setStatus('素材已删除');
      return;
    }
    const upload = event.target.closest('[data-material-upload]');
    if (upload) {
      state.materialUploadType = upload.dataset.materialUpload;
      if (state.materialUploadType === 'image') els.imageInput.click();
      if (state.materialUploadType === 'video') els.videoInput.click();
      if (state.materialUploadType === 'audio') els.audioInput.click();
      return;
    }
    const materialFilter = event.target.closest('[data-material-filter]');
    if (materialFilter) {
      state.materialFilter = materialFilter.dataset.materialFilter;
      renderMaterialBoard();
      return;
    }
    const presetFilter = event.target.closest('[data-preset-filter]');
    if (presetFilter) {
      state.promptPresetFilter = presetFilter.dataset.presetFilter;
      state.selectedPromptPresetId = '';
      renderMaterialBoard();
      return;
    }
    const cardDelete = event.target.closest('[data-preset-card-delete]');
    if (cardDelete) {
      event.preventDefault();
      event.stopPropagation();
      deletePromptPreset(cardDelete.dataset.presetCardDelete);
      return;
    }
    const presetCard = event.target.closest('[data-preset-id]');
    if (presetCard) {
      state.selectedPromptPresetId = presetCard.dataset.presetId;
      renderMaterialBoard();
      return;
    }
    if (event.target.closest('[data-preset-new]')) {
      upsertPromptPreset();
      return;
    }
    const savePreset = event.target.closest('[data-preset-save]');
    if (savePreset) {
      savePromptPresetFromEditor(savePreset.dataset.presetSave);
      return;
    }
    const copy = event.target.closest('[data-preset-copy]');
    if (copy) {
      copyPromptPreset(copy.dataset.presetCopy);
      return;
    }
    const insert = event.target.closest('[data-preset-insert]');
    if (insert) {
      insertPromptPresetToCanvas(insert.dataset.presetInsert);
    }
  });

  els.materialBoard?.addEventListener('contextmenu', event => {
    if (state.materialView !== 'materials') return;
    const card = event.target.closest('[data-asset]');
    if (!card) return;
    event.preventDefault();
    event.stopPropagation();
    showMaterialContextMenu(card.dataset.asset, event.clientX, event.clientY);
  });

  els.materialBoard?.addEventListener('dragstart', event => {
    if (state.materialView !== 'materials') return;
    const card = event.target.closest('[data-asset]');
    if (!card) return;
    event.dataTransfer.setData('application/x-ai-material-id', card.dataset.asset);
    event.dataTransfer.effectAllowed = 'move';
  });

  els.materialBoard?.addEventListener('dragover', event => {
    if (state.materialView !== 'materials') return;
    event.preventDefault();
    const types = Array.from(event.dataTransfer.types || []);
    event.dataTransfer.dropEffect = types.includes('application/x-ai-material-id') ? 'move' : 'copy';
    els.materialBoard.classList.add('drop-active');
  });

  els.materialBoard?.addEventListener('dragleave', event => {
    if (!els.materialBoard.contains(event.relatedTarget)) {
      els.materialBoard.classList.remove('drop-active');
    }
  });

  els.materialBoard?.addEventListener('drop', async event => {
    if (state.materialView !== 'materials') return;
    event.preventDefault();
    els.materialBoard.classList.remove('drop-active');
    const draggedAssetId = event.dataTransfer.getData('application/x-ai-material-id');
    if (draggedAssetId) {
      const targetId = event.target.closest('[data-asset]')?.dataset.asset;
      if (targetId && targetId !== draggedAssetId) {
        const assets = [...(state.assets || [])];
        const from = assets.findIndex(item => item.id === draggedAssetId);
        const to = assets.findIndex(item => item.id === targetId);
        if (from >= 0 && to >= 0) {
          const [moved] = assets.splice(from, 1);
          assets.splice(to, 0, moved);
          state.assets = assets;
          renderAssets();
          renderMaterialBoard();
          saveCanvas();
          setStatus('素材顺序已调整');
        }
      }
      return;
    }
    const files = await filesFromDataTransfer(event.dataTransfer);
    if (!files.length) {
      setStatus('没有识别到图片、视频或音频文件');
      return;
    }
    uploadFilesToAssets(files, 'auto');
  });

  document.addEventListener('click', event => {
    const materialAction = event.target.closest('[data-material-action]');
    if (materialAction) {
      event.preventDefault();
      const asset = (state.assets || []).find(item => item.id === materialAction.dataset.materialId);
      hideMaterialContextMenu();
      if (!asset) return;
      activateCanvasMode(state.mode);
      addAssetNodeToCanvas(asset);
      render();
      saveCanvas();
      return;
    }
    if (!event.target.closest('.material-action-menu')) hideMaterialContextMenu();
    const actionBtn = event.target.closest('[data-project-action]');
    if (!actionBtn) {
      if (!event.target.closest('.project-action-menu') && !event.target.closest('[data-project-menu]')) hideProjectMenu();
      return;
    }
    event.preventDefault();
    const projectId = actionBtn.dataset.projectId;
    const action = actionBtn.dataset.projectAction;
    hideProjectMenu();
    if (action === 'detail') projectDetail(projectId);
    if (action === 'rename') renameProject(projectId);
    if (action === 'move') setStatus('移动至文件夹功能稍后接入');
    if (action === 'delete') deleteProject(projectId);
  });

  document.querySelectorAll('[data-close-asset-dialog]').forEach(btn => {
    btn.addEventListener('click', closeAssetDialog);
  });

  document.querySelector('[data-confirm-asset]')?.addEventListener('click', () => {
    if (!state.assetDraftNodeId) return closeAssetDialog();
    addAssetFromNode(state.assetDraftNodeId, {
      name: els.assetName?.value?.trim() || '我的资产',
      category: els.assetCategory?.value || 'person',
    });
    closeAssetDialog();
  });

  document.querySelectorAll('[data-asset-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-asset-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.assetFilter = btn.dataset.assetFilter;
      renderAssets();
    });
    btn.addEventListener('dragover', event => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      btn.classList.add('drop-target');
    });
    btn.addEventListener('dragleave', () => btn.classList.remove('drop-target'));
    btn.addEventListener('drop', event => {
      const nodeId = assetNodeIdFromDrop(event);
      if (!nodeId) return;
      event.preventDefault();
      event.stopPropagation();
      btn.classList.remove('drop-target');
      const category = btn.dataset.assetFilter === 'all' ? 'other' : btn.dataset.assetFilter;
      addAssetFromNode(nodeId, { category });
      document.querySelectorAll('[data-asset-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.assetFilter = btn.dataset.assetFilter;
      renderAssets();
    });
  });

  document.querySelector('.asset-tabs')?.addEventListener('dragover', event => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  });

  document.querySelector('.asset-tabs')?.addEventListener('drop', event => {
    const nodeId = assetNodeIdFromDrop(event);
    if (!nodeId) return;
    event.preventDefault();
    const targetBtn = event.target.closest('[data-asset-filter]') || document.querySelector(`[data-asset-filter="${state.assetFilter}"]`);
    const category = targetBtn?.dataset.assetFilter && targetBtn.dataset.assetFilter !== 'all'
      ? targetBtn.dataset.assetFilter
      : 'other';
    addAssetFromNode(nodeId, { category });
    document.querySelectorAll('[data-asset-filter]').forEach(b => b.classList.remove('active', 'drop-target'));
    targetBtn?.classList.add('active');
    state.assetFilter = targetBtn?.dataset.assetFilter || category;
    renderAssets();
  });

  els.historyList?.addEventListener('click', event => {
    const item = event.target.closest('[data-history-result]');
    if (!item) return;
    const history = state.generationHistory.find(h => h.id === item.dataset.historyResult);
    if (!history?.url) return;
    const p = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    const type = history.mime.startsWith('video/') ? 'video' : history.mime.startsWith('image/') ? 'image' : 'text';
    addNode(type, p.x, p.y, {
      title: history.title,
      url: history.url,
      mime: history.mime,
      kind: type,
    });
  });

  document.querySelector('#generate')?.addEventListener('click', generate);
  document.querySelector('#settingsToggle').addEventListener('click', () => els.settings.classList.remove('hidden'));
  document.querySelector('#closeSettings').addEventListener('click', () => els.settings.classList.add('hidden'));
  document.querySelector('#saveSettings').addEventListener('click', saveSettings);
  els.settings?.addEventListener('input', event => {
    if (!event.target.matches('input, textarea, select')) return;
    autoSaveSettings();
  });
  els.settings?.addEventListener('change', event => {
    if (!event.target.matches('input, textarea, select')) return;
    autoSaveSettings();
  });
  document.querySelectorAll('input[name="videoProvider"]').forEach(input => {
    input.addEventListener('change', updateVideoProviderUI);
  });
  document.querySelectorAll('input[name="imageSettingsMode"]').forEach(input => {
    input.addEventListener('change', updateImageSettingsModeUI);
  });
  document.querySelectorAll('[data-toggle-secret]').forEach(button => {
    button.addEventListener('click', () => {
      const input = document.querySelector(button.dataset.toggleSecret);
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.textContent = show ? '隐藏' : '显示';
    });
  });
}

function deleteNode(id, options = {}) {
  state.nodes = state.nodes.filter(n => n.id !== id);
  state.links = state.links.filter(l => l.from !== id && l.to !== id);
  for (const node of state.nodes) {
    if (node.refOrder) node.refOrder = node.refOrder.filter(refId => refId !== id);
  }
  if (state.selectedId === id) state.selectedId = null;
  state.selectedIds = state.selectedIds.filter(selectedId => selectedId !== id);
  if (!options.silent) {
    render();
    saveCanvas();
    setStatus('节点已删除');
  }
}

function deleteLink(id) {
  state.links = state.links.filter(l => l.id !== id);
  if (state.selectedLinkId === id) state.selectedLinkId = null;
  render();
  saveCanvas();
  setStatus('连线已删除');
}

function focusNode(id) {
  const node = state.nodes.find(n => n.id === id);
  if (!node) return;
  const rect = els.stage.getBoundingClientRect();
  state.pan.x = rect.width / 2 - (node.x + node.w / 2) * state.scale;
  state.pan.y = rect.height / 2 - (node.y + (node.h || 120) / 2) * state.scale;
  applyTransform();
}

function selectedNode() {
  return state.nodes.find(n => n.id === state.selectedId);
}

function toggleMaximizeSelectedNode() {
  const node = selectedNode();
  if (!node) {
    setStatus('请先选中一个节点');
    return;
  }
  if (node.maximizedFrom) {
    const previous = node.maximizedFrom;
    Object.assign(node, {
      x: previous.x,
      y: previous.y,
      w: previous.w,
      h: previous.h,
      fullscreenPreview: previous.fullscreenPreview,
    });
    if (previous.view) {
      state.scale = previous.view.scale;
      state.pan = { ...previous.view.pan };
    }
    delete node.maximizedFrom;
    render();
    applyTransform();
    saveCanvas();
    setStatus('节点已还原');
    return;
  }
  const rect = els.stage.getBoundingClientRect();
  const targetW = Math.max(640, Math.round(rect.width * 0.94));
  const targetH = Math.max(420, Math.round(rect.height * 0.9));
  node.maximizedFrom = {
    x: node.x,
    y: node.y,
    w: node.w,
    h: node.h,
    fullscreenPreview: !!node.fullscreenPreview,
    view: {
      scale: state.scale,
      pan: { ...state.pan },
    },
  };
  state.scale = 1;
  node.w = targetW;
  node.h = targetH;
  node.fullscreenPreview = true;
  node.x = Math.round((rect.width - node.w) / 2);
  node.y = Math.round((rect.height - node.h) / 2);
  updateGroupsForMembers([node.id]);
  render();
  focusNode(node.id);
  saveCanvas();
  setStatus('节点已全屏最大化');
}

function focusSelectedNode() {
  const node = selectedNode();
  if (!node) {
    setStatus('请先选中一个节点');
    return;
  }
  state.scale = Math.min(2.2, Math.max(1.15, state.scale * 1.08));
  focusNode(node.id);
  saveCanvas();
  setStatus('节点已放到中心');
}

function fitAllNodes() {
  const nodes = state.nodes.filter(node => node.type !== 'group');
  if (!nodes.length) {
    state.scale = 1;
    state.pan = { x: -49800, y: -49800 };
    applyTransform();
    setStatus('画布已回到中心');
    return;
  }
  const rect = els.stage.getBoundingClientRect();
  const bounds = boundsForNodes(nodes);
  const margin = 80;
  const contentW = Math.max(1, bounds.maxX - bounds.minX);
  const contentH = Math.max(1, bounds.maxY - bounds.minY);
  const scaleX = (rect.width - margin * 2) / contentW;
  const scaleY = (rect.height - margin * 2) / contentH;
  state.scale = Math.max(0.12, Math.min(1.6, scaleX, scaleY));
  const centerX = bounds.minX + contentW / 2;
  const centerY = bounds.minY + contentH / 2;
  state.pan = {
    x: rect.width / 2 - centerX * state.scale,
    y: rect.height / 2 - centerY * state.scale,
  };
  applyTransform();
  renderLinks();
  saveCanvas();
  setStatus(`已展示全部 ${nodes.length} 个节点`);
}

function selectAllNodes() {
  state.selectedIds = state.nodes.filter(node => node.type !== 'group').map(node => node.id);
  state.selectedId = state.selectedIds[0] || null;
  state.selectedLinkId = null;
  render();
  setStatus(state.selectedIds.length ? `已全选 ${state.selectedIds.length} 个节点` : '没有可选节点');
}

function nodeBottom(node) {
  return node.y + (node.h || 120);
}

function selectedRealNodes() {
  return state.nodes.filter(n => state.selectedIds.includes(n.id) && n.type !== 'group');
}

function boundsForNodes(nodes) {
  const minX = Math.min(...nodes.map(n => n.x));
  const minY = Math.min(...nodes.map(n => n.y));
  const maxX = Math.max(...nodes.map(n => n.x + (n.w || 220)));
  const maxY = Math.max(...nodes.map(nodeBottom));
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

function arrangeSelectedNodes() {
  const selected = selectedRealNodes();
  const nodes = selected.length > 1
    ? selected
    : state.nodes.filter(n => n.type !== 'group');
  if (nodes.length < 2) return;
  const bounds = boundsForNodes(nodes);
  const gap = 34;
  const columns = Math.ceil(Math.sqrt(nodes.length));
  const cellW = Math.max(...nodes.map(n => n.w || 220)) + gap;
  const cellH = Math.max(...nodes.map(n => n.h || 120)) + gap;
  nodes
    .sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y)
    .forEach((node, index) => {
      node.x = bounds.minX + (index % columns) * cellW;
      node.y = bounds.minY + Math.floor(index / columns) * cellH;
    });
  updateGroupsForMembers(nodes.map(n => n.id));
  render();
  saveCanvas();
  fitAllNodes();
  setStatus(`已整理 ${nodes.length} 个节点`);
}

function groupSelectedNodes() {
  const nodes = selectedRealNodes();
  if (nodes.length < 2) return;
  const bounds = boundsForNodes(nodes);
  const padding = 22;
  const group = {
    id: uid('group'),
    type: 'group',
    title: 'Group',
    x: bounds.minX - padding,
    y: bounds.minY - padding,
    w: bounds.w + padding * 2,
    h: bounds.h + padding * 2,
    members: nodes.map(n => n.id),
  };
  state.nodes.push(group);
  state.selectedId = group.id;
  state.selectedIds = [group.id];
  render();
  saveCanvas();
  setStatus(`Grouped ${nodes.length} nodes`);
}

function updateGroupsForMembers(memberIds = []) {
  for (const group of state.nodes.filter(n => n.type === 'group')) {
    if (memberIds.length && !group.members?.some(id => memberIds.includes(id))) continue;
    const members = state.nodes.filter(n => group.members?.includes(n.id));
    if (!members.length) continue;
    const bounds = boundsForNodes(members);
    const padding = 22;
    group.x = bounds.minX - padding;
    group.y = bounds.minY - padding;
    group.w = bounds.w + padding * 2;
    group.h = bounds.h + padding * 2;
  }
}

function expandGroupIds(ids) {
  const expanded = new Set(ids);
  for (const id of ids) {
    const group = state.nodes.find(n => n.id === id && n.type === 'group');
    for (const memberId of group?.members || []) expanded.add(memberId);
  }
  return [...expanded];
}

function cloneNodesWithLinks(ids, offset = { x: 34, y: 34 }) {
  const sourceIds = expandGroupIds(ids);
  const idMap = new Map();
  const cloned = [];
  for (const node of state.nodes.filter(n => sourceIds.includes(n.id))) {
    const copy = JSON.parse(JSON.stringify(node));
    copy.id = uid(node.type);
    copy.x = (copy.x || 0) + offset.x;
    copy.y = (copy.y || 0) + offset.y;
    copy.title = `${copy.title || typeNames[copy.type] || '节点'} 副本`;
    if (copy.members) copy.members = copy.members.map(memberId => idMap.get(memberId) || memberId);
    idMap.set(node.id, copy.id);
    cloned.push(copy);
  }
  for (const copy of cloned) {
    if (copy.members) copy.members = copy.members.map(memberId => idMap.get(memberId) || memberId);
  }
  const newLinks = [];
  for (const link of state.links) {
    const fromCloned = idMap.has(link.from);
    const toCloned = idMap.has(link.to);
    if (!fromCloned && !toCloned) continue;
    newLinks.push({
      ...link,
      id: uid('link'),
      from: fromCloned ? idMap.get(link.from) : link.from,
      to: toCloned ? idMap.get(link.to) : link.to,
    });
  }
  state.nodes.push(...cloned);
  state.links.push(...newLinks);
  state.selectedIds = cloned.filter(n => n.type !== 'group').map(n => n.id);
  state.selectedId = state.selectedIds[0] || cloned[0]?.id || null;
  render();
  saveCanvas();
  setStatus(`已复制 ${cloned.length} 个节点`);
  return state.selectedIds;
}

function updateSelectionBox(clientX, clientY) {
  const start = state.selecting.startScreen;
  const rect = els.stage.getBoundingClientRect();
  const x1 = Math.min(start.x, clientX) - rect.left;
  const y1 = Math.min(start.y, clientY) - rect.top;
  const x2 = Math.max(start.x, clientX) - rect.left;
  const y2 = Math.max(start.y, clientY) - rect.top;
  els.selectionBox.classList.remove('hidden');
  els.selectionBox.style.left = `${x1}px`;
  els.selectionBox.style.top = `${y1}px`;
  els.selectionBox.style.width = `${x2 - x1}px`;
  els.selectionBox.style.height = `${y2 - y1}px`;
}

function finishSelection(clientX, clientY) {
  const a = state.selecting.startWorld;
  const b = screenToWorld(clientX, clientY);
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  state.selectedIds = state.nodes
    .filter(n => n.x < maxX && n.x + (n.w || 220) > minX && n.y < maxY && nodeBottom(n) > minY)
    .map(n => n.id);
  state.selectedId = state.selectedIds[0] || null;
  state.selectedLinkId = null;
  setStatus(state.selectedIds.length ? `已框选 ${state.selectedIds.length} 个节点` : '未选中节点');
}

async function init() {
  await loadConfig();
  loadGridSettings();
  loadPromptPresets();
  applyTransform();
  bindEvents();
  loadCanvas();
  resumeNodeTasks();
  render();
  setInterval(pollTasks, 5000);
  setInterval(refreshBalances, 60000);
  pollTasks();
}

init();









