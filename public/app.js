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
  promptCategories: [],
  promptPresetFilter: 'all',
  promptPresetQuery: '',
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
  replaceImageNodeId: '',
  undoStack: [],
  lastSnapshot: '',
  restoring: false,
  hoverVideoNodeId: null,
  grid: { spacing: 20, dot: 1, linkWidth: 3 },
  themeMode: 'dark',
  agentRefs: [],
  agentHistory: [],
  agentMode: 'agent',
  agentRunMode: 'ask',
  agentSkill: 'auto',
  customSkills: [],
  cloneStudio: {
    sourceUrl: '',
    videoUrl: '',
    videoName: '',
    frameUrl: '',
    frameRatio: 16 / 9,
    extracted: false,
  },
  talkingAgent: {
    sourceUrl: '',
    originalText: '',
    rewrittenText: '',
    title: '',
    topics: '',
    audioUrl: '',
    audioName: '',
    presetAudio: '',
    avatarUrl: '',
    avatarName: '',
    presetAvatar: '',
    tone: 'normal',
    speed: '1.0',
  },
  directorStage: {
    view: 'third',
    tool: 'move',
    selected: '商务男',
    scene: '摄影棚',
    pose: '站立',
  },
};

const els = {
  stage: document.querySelector('#stage'),
  world: document.querySelector('#world'),
  links: document.querySelector('#links'),
  menu: document.querySelector('#menu'),
  hotbox: document.querySelector('#hotbox'),
  fileInput: document.querySelector('#fileInput'),
  imageInput: document.querySelector('#imageInput'),
  videoInput: document.querySelector('#videoInput'),
  audioInput: document.querySelector('#audioInput'),
  replaceImageInput: document.querySelector('#replaceImageInput'),
  selectionBox: document.querySelector('#selectionBox'),
  assetList: document.querySelector('#assetList'),
  historyList: document.querySelector('#historyList'),
  projectBoard: document.querySelector('#projectBoard'),
  materialBoard: document.querySelector('#materialBoard'),
  projectTitleBar: document.querySelector('#projectTitleBar'),
  themeModeToggle: document.querySelector('#themeModeToggle'),
  themeModeMenu: document.querySelector('#themeModeMenu'),
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
  agentHistoryToggle: document.querySelector('#agentHistoryToggle'),
  agentClearLog: document.querySelector('#agentClearLog'),
  agentHistoryPanel: document.querySelector('#agentHistoryPanel'),
  agentLog: document.querySelector('#agentLog'),
  agentFloat: document.querySelector('#agentFloat'),
  directorStage: document.querySelector('#directorStage'),
  closeDirectorStage: document.querySelector('#closeDirectorStage'),
  directorViewLabel: document.querySelector('#directorViewLabel'),
  directorObjectList: document.querySelector('#directorObjectList'),
  directorObjectName: document.querySelector('#directorObjectName'),
  directorActiveName: document.querySelector('#directorActiveName'),
  directorPose: document.querySelector('#directorPose'),
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
  agentModel: document.querySelector('#agentModel'),
  agentInput: document.querySelector('#agentInput'),
  agentRefMention: document.querySelector('#agentRefMention'),
  agentActiveMode: document.querySelector('#agentActiveMode'),
  agentModeToggle: document.querySelector('#agentModeToggle'),
  agentModeMenu: document.querySelector('#agentModeMenu'),
  agentSkillToggle: document.querySelector('#agentSkillToggle'),
  agentSkillMenu: document.querySelector('#agentSkillMenu'),
  agentSkillFileInput: document.querySelector('#agentSkillFileInput'),
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
  browser: '浏览器',
  loop: '循环节点',
  grid: '分镜格子',
};

const DETAIL_PAGE_LOOP_PROMPT = '电商详情页高转化商业图，严格保留参考主体的核心身份、产品外观、材质、颜色、比例和关键卖点；生成适合详情页使用的高质感视觉模块，主体清晰居中，背景干净高级，棚拍柔光，真实材质纹理，轻微反射，构图稳定，有留白空间，可用于产品介绍、卖点展示、场景化海报和详情页长图。不要乱改品牌、文字、logo、人物五官或产品结构，不要水印，不要多余杂物。';
const GLOBAL_ASSETS_KEY = 'ai_canvas_global_assets';
const CUSTOM_SKILLS_KEY = 'ai_canvas_custom_agent_skills';

const AGENT_BUILTIN_SKILLS = [
  ['seedance2-15s-prompt', 'Seedance2 提示词', '15秒视频分镜和电影镜头'],
  ['imagegen', '图像生成 / 改图', '生成图像、编辑图像、风格化'],
  ['xyq-skill', '小云雀创作', '图片、视频、短片创作'],
  ['browser', '页面分析', '网页资料整理和页面理解'],
];

const LLM_VENDOR_DEFAULTS = {
  doubao: {
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    apiKey: '',
    modelName: 'doubao-1-5-pro-32k',
    note: 'https://console.volcengine.com/ark',
  },
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: '',
    modelName: 'qwen-plus',
    note: 'https://bailian.console.aliyun.com',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    modelName: 'deepseek-chat',
    note: 'https://platform.deepseek.com',
  },
  kimi: {
    baseUrl: 'https://api.moonshot.cn/v1',
    apiKey: '',
    modelName: 'moonshot-v1-8k',
    note: 'https://platform.moonshot.cn',
  },
  zhipu: {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: '',
    modelName: 'glm-4-flash',
    note: 'https://open.bigmodel.cn',
  },
};

const TALKING_PRESET_AUDIOS = [
  ['zhenhuan-mp3', '甄嬛.MP3'],
  ['sweet-female-flac', '甜美女声.flac'],
  ['mature-female-flac', '成熟女性.flac'],
  ['sister-flac', '御姐音.flac'],
  ['bright-female-flac', '开朗女性.flac'],
  ['young-news-male-flac', '年轻新闻男.flac'],
];

const TALKING_PRESET_AVATARS = [
  ['slot-1', '预设数字人 1（待上传）'],
  ['slot-2', '预设数字人 2（待上传）'],
  ['business-male', '商务男口播（待上传）'],
  ['business-female', '商务女口播（待上传）'],
];

const IMAGE_UTILITY_PROMPTS = {
  characterSheet: '提取原图角色，制作标准角色设定图，画面分区排版，完整呈现人物正面、侧面、背面三视图、脸部高清特写、服饰细节特写；人体结构标准精准，五官清晰，服饰纹理、版型、配饰细节完整，构图工整规整，高清画质，专业角色原画，画面干净无杂物',
  nineGrid: '分镜创作逻辑：1. 若提供文案主题，将【文案主题】作为叙事核心，结合【图像核心内容】与以参考图为主体，还原环境空间布局，保持人物与所有物品相对位置，多角度连贯叙事，符合剧情逻辑设计3x3分镜；2. 若未提供文案主题，仅以【图像核心内容】为主体，遵循以参考图为主体，还原环境空间布局，保持人物与所有物品相对位置，多角度连贯叙事，符合剧情逻辑设计分镜。AI自动规划9个差异化视角，覆盖全景（环境空间布局）、中景（主体关系呈现）、特写（细节质感突出）、仰拍（视觉冲击强化）、俯拍（空间层次展示）、动态镜头（运动轨迹捕捉）、侧拍（侧面细节呈现）、近景（主体状态聚焦）、远景（整体氛围烘托）共9类最优构图，严格还原物体相对位置，保持分镜叙事连贯性与视觉统一性，4K极致超高清分辨率，原生细节拉满，电影级工业级光影，物理级光线反射与折射，自然明暗渐变过渡，超写实级材质纹理（金属/织物/植被/岩石/皮肤）清晰无失真，无磨皮过度锐化，符合人眼真实视觉逻辑，浅景深虚化过渡自然，专业影视级布光，单反相机85mm/35mm黄金焦段拍摄，动态范围拉满，暗部亮部细节保留完整，严格对齐参考图核心美术风格（写实/二次元/赛博朋克/古风/废土/极简等），严格保持统一美术风格，横屏16:9黄金比例构图，分镜间无缝拼接无割裂感，画面无文字水印/时间码/字幕，色彩体系统一（色调/饱和度/色温一致），无时间码无字幕',
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
    <div class="agent-ref-item" draggable="true" data-agent-ref-index="${index}" title="Shift+@ 后可用 @${index + 1} 引用">
      <img class="agent-ref-thumb" src="${escapeAttr(ref.url)}" alt="参考图${index + 1}">
      <span>@${index + 1}</span>
      <button type="button" data-agent-ref-remove="${index}" title="移除参考图">×</button>
    </div>
  `).join('');
  renderAgentMentionPanel();
}

function addAgentRefFiles(files) {
  const imageFiles = [...files].filter(file => file.type?.startsWith('image/'));
  if (!imageFiles.length) return;
  imageFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      state.agentRefs.push({ name: file.name, url: String(reader.result || '') });
      renderAgentRefs();
      recordAgentHistory('添加参考图', file.name || `参考图${state.agentRefs.length}`);
    };
    reader.readAsDataURL(file);
  });
}

function addAgentRef(ref, label = '添加参考图') {
  if (!ref?.url) return false;
  const exists = state.agentRefs.some(item => item.url === ref.url);
  if (!exists) state.agentRefs.push({ name: ref.name || ref.title || `参考图${state.agentRefs.length + 1}`, url: ref.url });
  renderAgentRefs();
  recordAgentHistory(label, ref.name || ref.title || '');
  return true;
}

function addAgentRefFromNode(nodeId) {
  const node = state.nodes.find(item => item.id === nodeId);
  const url = node?.url || node?.resultUrl;
  if (!node || !url) return false;
  const typeLabel = node.type === 'video' || ['t2v', 'i2v'].includes(node.type) ? '视频帧参考' : '画布参考图';
  return addAgentRef({ name: node.title || typeNames[node.type] || typeLabel, url }, `拖入${typeLabel}`);
}

function isAgentDropTargetAt(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  return !!el?.closest?.('#agentRefs, .agent-upload-strip, #agentInput, #agentDock');
}

function agentHistorySnapshot(label, detail = '') {
  return {
    id: uid('agent_history'),
    label,
    detail,
    createdAt: Date.now(),
    input: els.agentInput?.value || '',
    refs: state.agentRefs.map(ref => ({ ...ref })),
    skill: state.agentSkill,
    runMode: state.agentRunMode,
    model: els.agentModel?.value || '',
  };
}

function recordAgentHistory(label, detail = '') {
  if (!label) return;
  state.agentHistory.unshift(agentHistorySnapshot(label, detail));
  state.agentHistory = state.agentHistory.slice(0, 40);
  renderAgentHistoryPanel();
}

function formatAgentHistoryTime(ts) {
  const date = new Date(ts || Date.now());
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function renderAgentHistoryPanel() {
  if (!els.agentHistoryPanel) return;
  if (!state.agentHistory.length) {
    els.agentHistoryPanel.innerHTML = '<div class="agent-history-empty">暂无历史步骤</div>';
    return;
  }
  els.agentHistoryPanel.innerHTML = state.agentHistory.map((item, index) => `
    <button type="button" data-agent-history-restore="${index}">
      <b>${escapeHtml(item.label)}</b>
      <span>${escapeHtml(item.detail || `${item.refs.length} 张参考图`)}</span>
      <em>${formatAgentHistoryTime(item.createdAt)}</em>
    </button>
  `).join('');
}

function restoreAgentHistory(index) {
  const item = state.agentHistory[Number(index)];
  if (!item) return;
  state.agentRefs = item.refs.map(ref => ({ ...ref }));
  if (els.agentInput) els.agentInput.value = item.input || '';
  if (els.agentModel && item.model) els.agentModel.value = item.model;
  setAgentSkill(item.skill || 'auto');
  setAgentRunMode(item.runMode || 'ask');
  renderAgentRefs();
  els.agentHistoryPanel?.classList.add('hidden');
  setStatus(`已回退到：${item.label}`);
}

function agentLogBodyHtml(body = '') {
  return escapeHtml(body).replace(/\n/g, '<br>');
}

function appendAgentLog(title, body = '', options = {}) {
  if (!els.agentLog) return;
  const empty = els.agentLog.querySelector('.agent-log-empty');
  if (empty) empty.remove();
  const item = document.createElement('article');
  item.className = `agent-log-item ${options.role ? `agent-log-${options.role}` : ''}`.trim();
  item.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    ${body ? `<p>${agentLogBodyHtml(body)}</p>` : ''}
    ${body ? '<button type="button" class="agent-log-copy" data-agent-log-copy title="复制输出">⧉</button>' : ''}
    <time>${formatAgentHistoryTime(Date.now())}</time>
  `;
  els.agentLog.appendChild(item);
  els.agentLog.scrollTop = els.agentLog.scrollHeight;
  return item;
}

function renderAgentMentionPanel() {
  if (!els.agentRefMention) return;
  if (!state.agentRefs.length) {
    els.agentRefMention.innerHTML = '';
    els.agentRefMention.classList.add('hidden');
    return;
  }
  els.agentRefMention.innerHTML = state.agentRefs.map((ref, index) => `
    <button type="button" data-agent-mention-index="${index}">
      <img src="${escapeAttr(ref.url)}" alt="@${index + 1}">
      <span>@${index + 1}</span>
      <b>${escapeHtml(ref.name || `参考图${index + 1}`)}</b>
    </button>
  `).join('');
}

function showAgentMentionPanel() {
  renderAgentMentionPanel();
  if (!state.agentRefs.length) {
    setStatus('先拖入或上传参考图，再用 Shift+@ 引用');
    return;
  }
  els.agentRefMention?.classList.remove('hidden');
}

function insertAgentMention(index) {
  const i = Number(index);
  if (!state.agentRefs[i]) return;
  insertIntoAgentInput(`@${i + 1}`);
  els.agentRefMention?.classList.add('hidden');
}

function agentModeLabel(mode = state.agentMode) {
  return {
    agent: '✣ Agent',
    image: '▧ 图片生成',
    video: '▰ 视频生成',
    mimic: '⌁ 动作模仿',
    skill: '✦ Skill 调用',
  }[mode] || '✣ Agent';
}

function normalizeCustomSkills(list = []) {
  const seen = new Set();
  return (Array.isArray(list) ? list : [])
    .filter(item => item?.id && item?.name && item?.content)
    .map(item => ({
      id: String(item.id),
      name: String(item.name),
      desc: String(item.desc || '本地导入的自定义 Skill'),
      content: String(item.content),
      createdAt: Number(item.createdAt || Date.now()),
    }))
    .filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .slice(0, 40);
}

function loadCustomSkills() {
  try {
    state.customSkills = normalizeCustomSkills(JSON.parse(localStorage.getItem(CUSTOM_SKILLS_KEY) || '[]'));
  } catch {
    state.customSkills = [];
  }
}

function saveCustomSkills() {
  localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(normalizeCustomSkills(state.customSkills)));
}

function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`${file.name} 读取失败`));
    reader.readAsText(file, 'utf-8');
  });
}

function customSkillNameFromContent(file, content) {
  try {
    if (/\.json$/i.test(file.name)) {
      const data = JSON.parse(content);
      if (data.name || data.title) return String(file.name || data.name || data.title).trim();
    }
  } catch {
    // JSON 解析失败时退回文件名。
  }
  return (file.name || '自定义 Skill').trim();
}

function customSkillDescFromContent(content) {
  const lines = String(content || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
  return (lines[0] || '本地导入的自定义 Skill').slice(0, 42);
}

async function importCustomSkillFiles(files = []) {
  const sourceFiles = [...files].filter(file => file && /\.(md|markdown|txt|json|ya?ml)$/i.test(file.name));
  if (!sourceFiles.length) {
    setStatus('请选择 .md / .txt / .json / .yaml 格式的 Skill 文件');
    return;
  }
  const imported = [];
  for (const file of sourceFiles) {
    const content = await readTextFile(file);
    const name = customSkillNameFromContent(file, content);
    const item = {
      id: `custom-skill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      desc: customSkillDescFromContent(content),
      content,
      createdAt: Date.now(),
    };
    imported.push(item);
  }
  state.customSkills = normalizeCustomSkills([...imported, ...state.customSkills]);
  saveCustomSkills();
  renderAgentSkillMenu();
  if (imported[0]) {
    setAgentSkill(imported[0].id, { keepOpen: true });
    insertIntoAgentInput(agentSkillPrompt(imported[0].id));
  }
  setStatus(`已加载 ${imported.length} 个自定义 Skill`);
}

function customSkillById(id) {
  return state.customSkills.find(item => item.id === id);
}

function agentSkillMeta(value = state.agentSkill) {
  const builtin = AGENT_BUILTIN_SKILLS.find(([id]) => id === value);
  if (builtin) return { id: builtin[0], name: builtin[1], desc: builtin[2], builtin: true };
  const custom = customSkillById(value);
  if (custom) return { id: custom.id, name: custom.name, desc: custom.desc, content: custom.content, custom: true };
  return { id: value || 'auto', name: value || '自动选择', desc: '根据任务自动挑选能力' };
}

function agentSkillLabel(value = state.agentSkill) {
  return agentSkillMeta(value).name || '自动选择合适 Skill';
}

function renderAgentSkillMenu() {
  if (!els.agentSkillMenu) return;
  const builtinHTML = AGENT_BUILTIN_SKILLS.map(([id, name, desc]) => `
    <button type="button" draggable="true" data-agent-skill="${escapeAttr(id)}">
      <b>${escapeHtml(name)}</b><span>${escapeHtml(desc)}</span>
    </button>
  `).join('');
  const customHTML = state.customSkills.map(item => `
    <button type="button" draggable="true" data-agent-skill="${escapeAttr(item.id)}">
      <b>${escapeHtml(item.name)}</b><span>${escapeHtml(item.desc)}</span>
    </button>
  `).join('');
  els.agentSkillMenu.innerHTML = `
    ${builtinHTML}
    ${customHTML ? '<div class="agent-skill-divider"></div>' : ''}
    ${customHTML}
    <button type="button" class="agent-skill-load" data-agent-skill-load>
      <b>自定义 Skill</b><span>从本地选择 .md / .txt / .json 等 Skill 文件</span>
    </button>
  `;
  document.querySelectorAll('[data-agent-skill]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.agentSkill === state.agentSkill);
  });
}

function setAgentMode(mode) {
  state.agentMode = mode || 'agent';
  document.querySelectorAll('[data-agent-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.agentMode === state.agentMode);
  });
  if (els.agentActiveMode) els.agentActiveMode.textContent = agentModeLabel();
  els.agentModeMenu?.classList.add('hidden');
}

function setAgentRunMode(mode) {
  state.agentRunMode = mode || 'ask';
  document.querySelectorAll('[data-agent-run]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.agentRun === state.agentRunMode);
  });
}

function setAgentSkill(skill = 'auto', options = {}) {
  state.agentSkill = skill || 'auto';
  if (!agentSkillMeta(state.agentSkill).name) state.agentSkill = 'auto';
  document.querySelectorAll('[data-agent-skill]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.agentSkill === state.agentSkill);
  });
  if (els.agentSkillToggle) {
    els.agentSkillToggle.textContent = '✦ 加载 Skill';
    els.agentSkillToggle.title = agentSkillLabel();
  }
  if (!options.keepOpen) els.agentSkillMenu?.classList.add('hidden');
  setStatus(`Skill 模块：${agentSkillLabel()}`);
}

function agentSkillPrompt(skill = state.agentSkill) {
  const meta = agentSkillMeta(skill);
  if (meta.custom && meta.content) {
    return `调用自定义 Skill：${meta.name}\n\n${meta.content}\n\n目标：`;
  }
  return `调用 Skill：${meta.name}\n目标：`;
}

function insertIntoAgentInput(text) {
  if (!els.agentInput) return;
  const value = String(text || '');
  const start = els.agentInput.selectionStart ?? els.agentInput.value.length;
  const end = els.agentInput.selectionEnd ?? start;
  const prefix = start > 0 && !els.agentInput.value.endsWith('\n') ? '\n' : '';
  els.agentInput.setRangeText(`${prefix}${value}`, start, end, 'end');
  els.agentInput.focus();
}

function agentCanvasAnchor() {
  const rect = els.stage.getBoundingClientRect();
  return screenToWorld(rect.left + rect.width * 0.42, rect.top + rect.height * 0.42);
}

function addAgentReferenceNodes(start) {
  const nodes = [];
  state.agentRefs.forEach((ref, index) => {
    const node = addNode('image', start.x, start.y + index * 150, {
      title: ref.name || `参考图${index + 1}`,
      url: ref.url,
      role: 'reference_image',
      w: 220,
    });
    nodes.push(node);
  });
  return nodes;
}

function agentVendorForSelection(value = '') {
  const key = String(value || '').toLowerCase();
  if (['doubao', 'qwen', 'deepseek', 'kimi', 'zhipu'].includes(key)) return key;
  if (key.includes('doubao') || key.includes('ark')) return 'doubao';
  if (key.includes('qwen') || key.includes('tongyi')) return 'qwen';
  if (key.includes('deepseek')) return 'deepseek';
  if (key.includes('kimi') || key.includes('moonshot')) return 'kimi';
  if (key.includes('zhipu') || key.includes('glm')) return 'zhipu';
  return '';
}

function settingsInputValue(selector, fallback = '') {
  const input = document.querySelector(selector);
  const value = input?.value?.trim?.();
  return value || fallback || '';
}

function activeAgentConfig() {
  const selected = els.agentModel?.value || state.config?.apis?.agent?.modelName || 'gpt-4.1-mini';
  const vendor = agentVendorForSelection(selected);
  if (vendor) {
    const item = state.config?.apis?.llmVendors?.[vendor] || LLM_VENDOR_DEFAULTS[vendor] || {};
    return {
      provider: vendor,
      baseUrl: settingsInputValue(vendorInputId(vendor, 'baseUrl'), item.baseUrl),
      apiKey: settingsInputValue(vendorInputId(vendor, 'apiKey'), item.apiKey),
      modelName: settingsInputValue(vendorInputId(vendor, 'modelName'), item.modelName || selected),
    };
  }
  const agent = state.config?.apis?.agent || {};
  const direct = {
    provider: 'agent',
    baseUrl: settingsInputValue('#agentBaseUrl', agent.baseUrl || 'https://api.openai.com/v1'),
    apiKey: settingsInputValue('#agentApiKey', agent.apiKey),
    modelName: selected || settingsInputValue('#agentModelName', agent.modelName || 'gpt-4.1-mini'),
  };
  if ((direct.apiKey || '').trim()) return direct;
  for (const key of ['deepseek', 'doubao', 'qwen', 'kimi', 'zhipu']) {
    const item = state.config?.apis?.llmVendors?.[key] || LLM_VENDOR_DEFAULTS[key] || {};
    const fallback = {
      provider: key,
      baseUrl: settingsInputValue(vendorInputId(key, 'baseUrl'), item.baseUrl),
      apiKey: settingsInputValue(vendorInputId(key, 'apiKey'), item.apiKey),
      modelName: settingsInputValue(vendorInputId(key, 'modelName'), item.modelName),
    };
    if ((fallback.apiKey || '').trim()) return fallback;
  }
  return direct;
}

function agentApiConfigured() {
  return !!(activeAgentConfig().apiKey || '').trim();
}

async function callAgentModel(prompt) {
  const active = activeAgentConfig();
  const res = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      model: active.modelName,
      agentProvider: active.provider,
      agentOverride: {
        baseUrl: active.baseUrl,
        apiKey: active.apiKey,
        modelName: active.modelName,
      },
      runMode: state.agentRunMode,
      skill: agentSkillMeta(state.agentSkill),
      references: state.agentRefs.map((ref, index) => ({
        index: index + 1,
        name: ref.name || `参考图${index + 1}`,
        url: ref.url,
      })),
      clientConfig: state.config,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function executeAgentCommand() {
  const prompt = (els.agentInput?.value || '').trim();
  if (!prompt) {
    setStatus('先输入你要智能体完成的任务');
    return;
  }
  const sendButton = document.querySelector('.agent-send');
  appendAgentLog('你', prompt, { role: 'user' });
  recordAgentHistory('询问智能体', prompt.slice(0, 42));
  if (agentApiConfigured()) {
    try {
      sendButton?.classList.add('is-running');
      const data = await callAgentModel(prompt);
      appendAgentLog('智能体', data.text || '智能体没有返回文本', { role: 'assistant' });
      setStatus('智能体已回复');
      return;
    } catch (err) {
      const active = activeAgentConfig();
      appendAgentLog('智能体调用失败', `${err.message}\n\n当前使用：${active.provider} / ${active.modelName}\n请检查该厂家设置里的 API 地址、API Key 和模型名。`, { role: 'error' });
      setStatus(`智能体调用失败：${err.message}`);
      return;
    } finally {
      sendButton?.classList.remove('is-running');
    }
  }
  appendAgentLog('智能体未配置', '当前下拉框选择的模型没有可用 API Key。GPT 请填“大模型厂家”里的 ChatGPT 卡片；豆包、千问、DeepSeek、Kimi、智谱请填对应厂家卡片。', { role: 'error' });
  setStatus('智能体 API Key 未填写');
}

function setDirectorView(view = 'third') {
  state.directorStage.view = view;
  const label = view === 'camera' ? '相机视角' : '第三视角';
  document.querySelectorAll('[data-director-view]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.directorView === view);
  });
  if (els.directorViewLabel) els.directorViewLabel.textContent = label;
  els.directorStage?.classList.toggle('camera-view', view === 'camera');
  window.Director3D?.setView?.(view);
  setStatus(`导演台已切换：${label}`);
}

function setDirectorTool(tool = 'select') {
  state.directorStage.tool = tool;
  document.querySelectorAll('[data-director-tool]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.directorTool === tool);
  });
  const names = { select: '选择', move: '移动', rotate: '旋转', scale: '缩放' };
  window.Director3D?.setTool?.(tool);
  setStatus(`导演台工具：${names[tool] || tool}`);
}

function addDirectorObject(name, meta = '预设') {
  if (!els.directorObjectList) return;
  const exists = [...els.directorObjectList.querySelectorAll('[data-director-object]')]
    .some(btn => btn.dataset.directorObject === name);
  if (exists) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.directorObject = name;
  button.innerHTML = `${meta === '场景' ? '▤' : meta === '模型' ? '▣' : '♙'} ${escapeHtml(name)} <span>${escapeHtml(meta)}</span>`;
  els.directorObjectList.appendChild(button);
}

function selectDirectorObject(name) {
  state.directorStage.selected = name || '角色A';
  document.querySelectorAll('[data-director-object]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.directorObject === state.directorStage.selected);
  });
  if (els.directorObjectName) els.directorObjectName.value = state.directorStage.selected;
  const avatar = document.querySelector('#directorAvatar strong');
  if (avatar) avatar.textContent = state.directorStage.selected;
}

function applyDirectorPose(pose) {
  state.directorStage.pose = pose || '站立';
  if (els.directorPose) els.directorPose.value = state.directorStage.pose;
  const avatar = document.querySelector('#directorAvatar');
  if (avatar) avatar.dataset.pose = state.directorStage.pose;
  window.Director3D?.setPose?.(state.directorStage.pose);
  setStatus(`导演台动作预设：${state.directorStage.pose}`);
}

function setDirectorInspectorTab(tab = 'attr') {
  document.querySelectorAll('[data-director-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.directorTab === tab);
  });
  document.querySelectorAll('[data-director-panel]').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.directorPanel === tab);
  });
}

function setDirectorPresetLibraryTab(tab = 'actor') {
  document.querySelectorAll('[data-director-library-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.directorLibraryTab === tab);
  });
  document.querySelectorAll('[data-director-library-panel]').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.directorLibraryPanel === tab);
  });
}

function applyDirectorLibraryPreset(value = '') {
  const [kind, name] = value.split(':');
  if (!kind || !name) return;
  if (kind === 'actor') {
    addDirectorObject(name, '角色预设');
    selectDirectorObject(name);
    window.Director3D?.loadPreset?.(name);
    setStatus(`已加载三维角色：${name}`);
  } else if (kind === 'scene') {
    state.directorStage.scene = name;
    addDirectorObject(name, '场景');
    selectDirectorObject(name);
    window.Director3D?.createScene?.(name);
    setStatus(`已加载三维场景：${name}`);
  } else if (kind === 'prop') {
    addDirectorObject(name, '模型');
    selectDirectorObject(name);
    window.Director3D?.addModel?.(name);
    setStatus(`已加载服化道模型：${name}`);
  }
}

function directorSnapshotDataUrl() {
  const selected = escapeHtml(state.directorStage.selected || '角色A');
  const scene = escapeHtml(state.directorStage.scene || '摄影棚');
  const pose = escapeHtml(state.directorStage.pose || '站立');
  const view = state.directorStage.view === 'camera' ? 'Camera View' : 'Third Person View';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#05070b"/>
          <stop offset=".46" stop-color="#101722"/>
          <stop offset="1" stop-color="#171d25"/>
        </linearGradient>
        <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M64 0H0V64" fill="none" stroke="#119bd8" stroke-opacity=".34" stroke-width="2"/>
        </pattern>
        <filter id="glow"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="1280" height="720" fill="url(#sky)"/>
      <path d="M0 378H1280V720H0Z" fill="#131820"/>
      <path d="M-180 720 420 378H860L1460 720Z" fill="url(#grid)" opacity=".85"/>
      <path d="M470 236H810L930 596H350Z" fill="none" stroke="#46d8ff" stroke-opacity=".62" stroke-width="4"/>
      <circle cx="352" cy="260" r="72" fill="#3df6a3" opacity=".12" filter="url(#glow)"/>
      <circle cx="932" cy="250" r="86" fill="#4f8ef7" opacity=".13" filter="url(#glow)"/>
      <g transform="translate(640 330)">
        <text x="0" y="-104" text-anchor="middle" fill="#fff" font-size="28" font-family="Arial" font-weight="700">${selected}</text>
        <circle cx="0" cy="-68" r="34" fill="#73a8ff"/>
        <rect x="-42" y="-34" width="84" height="128" rx="42" fill="#4f8ef7"/>
        <rect x="-78" y="-10" width="32" height="104" rx="16" fill="#386dcb"/>
        <rect x="46" y="-10" width="32" height="104" rx="16" fill="#386dcb"/>
        <rect x="-35" y="86" width="28" height="126" rx="14" fill="#2f5baa"/>
        <rect x="7" y="86" width="28" height="126" rx="14" fill="#2f5baa"/>
        <line x1="0" y1="98" x2="150" y2="98" stroke="#ff3346" stroke-width="6"/>
        <line x1="0" y1="98" x2="0" y2="-62" stroke="#2eff6f" stroke-width="6"/>
        <line x1="0" y1="98" x2="-92" y2="172" stroke="#3d68ff" stroke-width="6"/>
      </g>
      <rect x="34" y="34" width="350" height="104" rx="18" fill="#05070b" opacity=".72"/>
      <text x="58" y="74" fill="#ccff00" font-size="24" font-family="Arial" font-weight="700">Director Snapshot</text>
      <text x="58" y="108" fill="#d9e4ef" font-size="22" font-family="Arial">Scene: ${scene} / Pose: ${pose}</text>
      <text x="1014" y="676" fill="#d9e4ef" font-size="22" font-family="Arial">${view}</text>
    </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function sendDirectorSnapshotToCanvas() {
  const rect = els.stage.getBoundingClientRect();
  const point = screenToWorld(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5);
  const snapshotUrl = window.Director3D?.snapshotDataUrl?.() || directorSnapshotDataUrl();
  const node = addNode('image', point.x - 240, point.y - 135, {
    title: `导演台截图_${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.png`,
    url: snapshotUrl,
    role: 'reference_image',
    w: 480,
    imageRatio: 16 / 9,
  });
  node.h = imageNodeHeight(node);
  state.activeParamNodeId = null;
  render();
  saveCanvas();
  setStatus('导演台截图已发送到画布，可作为参考图使用');
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

function configWithoutSecrets(config) {
  const clean = JSON.parse(JSON.stringify(config || {}));
  const apis = clean.apis || {};
  Object.values(apis).forEach(value => {
    if (value && typeof value === 'object' && !Array.isArray(value) && 'apiKey' in value) value.apiKey = '';
  });
  Object.values(apis.llmVendors || {}).forEach(value => {
    if (value && typeof value === 'object') value.apiKey = '';
  });
  return clean;
}

function persistUserConfig(config) {
  localStorage.setItem('ai_canvas_user_config', JSON.stringify(configWithoutSecrets(config)));
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
  cfg.apis.agent ||= {};
  cfg.apis.llmVendors ||= {};
  for (const [key, defaults] of Object.entries(LLM_VENDOR_DEFAULTS)) {
    cfg.apis.llmVendors[key] = {
      ...defaults,
      ...(cfg.apis.llmVendors[key] || {}),
    };
  }
  cfg.models ||= {};
  cfg.models.video ||= ['doubao-seedance-2-0-260'];
  cfg.models.image ||= ['banana', 'image2'];
  cfg.defaults ||= {};
  cfg.defaults.videoProvider = 'ark';
  cfg.defaults.agentProvider ||= 'doubao';
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
  cfg.apis.agent.baseUrl ||= 'https://api.openai.com/v1';
  cfg.apis.agent.apiKey ||= '';
  cfg.apis.agent.modelName ||= 'gpt-4.1-mini';
  cfg.apis.agent.visionModel ||= 'gpt-4.1-mini';
  cfg.apis.agent.promptModel ||= 'deepseek-chat';
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
  });
}

function blankCanvasSnapshot() {
  return JSON.stringify({
    nodes: [],
    links: [],
    pan: { x: -49800, y: -49800 },
    scale: 1,
    generationHistory: [],
  });
}

function normalizeAssetList(list = []) {
  const seen = new Set();
  const normalized = [];
  for (const item of Array.isArray(list) ? list : []) {
    if (!item?.url) continue;
    const key = item.url || item.id;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({
      ...item,
      id: item.id || uid('asset'),
      name: item.name || item.title || '未命名资产',
      title: item.title || item.name || '未命名资产',
      category: item.category || 'other',
      type: item.type || (String(item.mime || '').startsWith('video/') ? 'video' : String(item.mime || '').startsWith('audio/') ? 'audio' : 'image'),
      createdAt: item.createdAt || Date.now(),
    });
  }
  return normalized.slice(0, 300);
}

function saveAssetsStore() {
  try {
    localStorage.setItem(GLOBAL_ASSETS_KEY, JSON.stringify(normalizeAssetList(state.assets)));
  } catch {
    setStatus('资产库太大，本次资产保存被跳过');
  }
}

function mergeAssetStore(list = []) {
  const merged = normalizeAssetList([...(Array.isArray(list) ? list : []), ...(state.assets || [])]);
  state.assets = merged;
  saveAssetsStore();
  return merged;
}

function loadAssetsStore() {
  try {
    state.assets = normalizeAssetList(JSON.parse(localStorage.getItem(GLOBAL_ASSETS_KEY) || '[]'));
  } catch {
    state.assets = [];
  }
}

function mergeLegacyAssetsFromSnapshot(snapshot) {
  try {
    const data = typeof snapshot === 'string' ? JSON.parse(snapshot || '{}') : snapshot;
    if (Array.isArray(data?.assets) && data.assets.length) mergeAssetStore(data.assets);
  } catch {
    // 老项目可能没有资产字段，忽略即可。
  }
}

function mergeLegacyAssetsFromProjects(projects = state.projects) {
  for (const project of Array.isArray(projects) ? projects : []) {
    mergeLegacyAssetsFromSnapshot(project?.snapshot);
  }
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
  loadPromptCategories();
  try {
    const saved = JSON.parse(localStorage.getItem('ai_canvas_prompt_presets') || '[]');
    const hiddenDefaults = JSON.parse(localStorage.getItem('ai_canvas_hidden_default_presets') || '[]');
    const order = JSON.parse(localStorage.getItem('ai_canvas_prompt_preset_order') || '[]');
    const merged = [...DEFAULT_PROMPT_PRESETS];
    for (let i = merged.length - 1; i >= 0; i -= 1) {
      if (hiddenDefaults.includes(merged[i].id)) merged.splice(i, 1);
    }
    for (const item of Array.isArray(saved) ? saved : []) {
      if (!merged.some(base => base.id === item.id)) merged.push(item);
    }
    if (Array.isArray(order) && order.length) {
      const rank = new Map(order.map((id, index) => [id, index]));
      merged.sort((a, b) => (rank.get(a.id) ?? 9999) - (rank.get(b.id) ?? 9999));
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
  localStorage.setItem('ai_canvas_prompt_preset_order', JSON.stringify(state.promptPresets.map(item => item.id)));
}

function loadPromptCategories() {
  const defaults = PROMPT_PRESET_CATEGORIES.map(([id, label]) => ({ id, label }));
  try {
    const saved = JSON.parse(localStorage.getItem('ai_canvas_prompt_categories') || '[]');
    const merged = [];
    const addCategory = item => {
      const id = String(item?.id || '').trim();
      const label = String(item?.label || '').trim();
      if (!id || !label || merged.some(existing => existing.id === id)) return;
      merged.push({ id, label });
    };
    if (Array.isArray(saved)) saved.forEach(addCategory);
    defaults.forEach(addCategory);
    const all = merged.find(item => item.id === 'all') || defaults[0];
    state.promptCategories = [all, ...merged.filter(item => item.id !== 'all')];
  } catch {
    state.promptCategories = defaults;
  }
}

function promptCategoryList() {
  if (!state.promptCategories.length) loadPromptCategories();
  return state.promptCategories;
}

function savePromptCategories() {
  localStorage.setItem('ai_canvas_prompt_categories', JSON.stringify(promptCategoryList()));
}

function renamePromptCategory(categoryId = state.promptPresetFilter) {
  if (!categoryId || categoryId === 'all') {
    setStatus('“全部”是总入口，不能改名');
    return;
  }
  const category = promptCategoryList().find(item => item.id === categoryId);
  if (!category) return;
  const label = prompt('分类名称', category.label || '新分类');
  if (!label?.trim()) return;
  category.label = label.trim();
  savePromptCategories();
  renderMaterialBoard();
  setStatus(`分类已重命名：${category.label}`);
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

function isLegacyStarterNode(node) {
  if (!node) return false;
  const title = String(node.title || '').trim();
  const text = String(node.text || '').trim();
  const emptyMedia = !node.url && !node.resultUrl && !node.taskId;
  return emptyMedia && (
    (node.type === 'prompt' && title === '主提示词' && text === '在这里写提示词，也可以连接到生成节点。')
    || (node.type === 'image' && title === '常用参考图' && text === '右键上传图片后，可作为图生图/图生视频参考。')
  );
}

function pruneLegacyStarterNodes() {
  const removeIds = new Set(state.nodes.filter(isLegacyStarterNode).map(node => node.id));
  if (!removeIds.size) return false;
  state.nodes = state.nodes.filter(node => !removeIds.has(node.id));
  state.links = state.links.filter(link => !removeIds.has(link.from) && !removeIds.has(link.to));
  if (removeIds.has(state.selectedId)) state.selectedId = null;
  state.selectedIds = state.selectedIds.filter(id => !removeIds.has(id));
  return true;
}

function applyThemeMode(mode = state.themeMode) {
  const next = ['dark', 'light', 'purple'].includes(mode) ? mode : 'dark';
  state.themeMode = next;
  document.body.dataset.theme = next;
  localStorage.setItem('ai_canvas_theme_mode', next);
  els.themeModeMenu?.querySelectorAll('[data-theme-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeMode === next);
  });
}

function loadThemeMode() {
  applyThemeMode(localStorage.getItem('ai_canvas_theme_mode') || 'dark');
}

function restoreSnapshot(snapshot) {
  const data = JSON.parse(snapshot);
  mergeLegacyAssetsFromSnapshot(data);
  state.nodes = (data.nodes || []).map(normalizeNode);
  state.links = data.links || [];
  pruneLegacyStarterNodes();
  state.pan = data.pan || state.pan;
  state.scale = data.scale || state.scale;
  state.generationHistory = data.generationHistory || [];
  state.selectedId = null;
  state.selectedIds = [];
  state.selectedLinkId = null;
  state.activeParamNodeId = null;
  state.lastSnapshot = canvasSnapshot();
  localStorage.setItem('ai-canvas-studio', state.lastSnapshot);
  persistCurrentProjectSnapshot(state.lastSnapshot);
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
  saveAssetsStore();
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
  loadAssetsStore();
  const store = loadProjectStore();
  if (Array.isArray(store.projects) && store.projects.length) {
    state.projects = store.projects;
    state.currentProjectId = store.currentProjectId || store.projects[0].id;
    mergeLegacyAssetsFromProjects(state.projects);
    const project = currentProject();
    if (project?.snapshot) {
      const data = JSON.parse(project.snapshot);
      mergeLegacyAssetsFromSnapshot(data);
      state.nodes = (data.nodes || []).map(normalizeNode);
      state.links = data.links || [];
      const prunedStarterNodes = pruneLegacyStarterNodes();
      state.pan = data.pan || state.pan;
      state.scale = data.scale || state.scale;
      state.generationHistory = data.generationHistory || [];
      state.lastSnapshot = canvasSnapshot();
      if (prunedStarterNodes) {
        localStorage.setItem('ai-canvas-studio', state.lastSnapshot);
        persistCurrentProjectSnapshot(state.lastSnapshot);
      }
      render();
      applyTransform();
      return;
    }
  }
  const saved = localStorage.getItem('ai-canvas-studio');
  if (!saved) {
    ensureProjectStoreFromCurrent(canvasSnapshot());
    render();
    applyTransform();
    return;
  }
  try {
    const data = JSON.parse(saved);
    mergeLegacyAssetsFromSnapshot(data);
    state.nodes = (data.nodes || []).map(normalizeNode);
    state.links = data.links || [];
    const prunedStarterNodes = pruneLegacyStarterNodes();
    state.pan = data.pan || state.pan;
    state.scale = data.scale || state.scale;
    state.generationHistory = data.generationHistory || [];
    state.lastSnapshot = canvasSnapshot();
    ensureProjectStoreFromCurrent(state.lastSnapshot);
    if (prunedStarterNodes) localStorage.setItem('ai-canvas-studio', state.lastSnapshot);
    render();
    applyTransform();
  } catch {
    localStorage.removeItem('ai-canvas-studio');
  }
}

function defaultModelForType(type) {
  return ['t2i', 'i2i', 'loop'].includes(type) ? 'image2' : 'doubao-seedance-2.0';
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
  return ['image', 'video', 'grid'].includes(node?.type) && Number(node.imageRatio || node.naturalRatio || 0) > 0;
}

function imageNodeHeight(node) {
  const headerH = ['image', 'video', 'grid'].includes(node?.type) ? 28 : 32;
  const mediaW = Math.max(80, node.w || 220);
  return headerH + Math.max(70, Math.round(mediaW / imageRatioForNode(node)));
}

function imageDimensionsLabel(node) {
  const w = Number(node?.naturalWidth || 0);
  const h = Number(node?.naturalHeight || 0);
  if (!w || !h) return '';
  return `${Math.round(w)} × ${Math.round(h)}`;
}

function imageFlipStyle(node) {
  const x = node?.flipX ? -1 : 1;
  const y = node?.flipY ? -1 : 1;
  const yaw = Number(node?.angleYaw || 0);
  const pitch = Number(node?.anglePitch || 0);
  const zoom = Math.max(.55, Math.min(1.85, Number(node?.angleZoom || 1)));
  const intensity = Math.max(0, Math.min(100, Number(node?.lightIntensity || 0)));
  const transform = `transform: perspective(900px) rotateX(${pitch}deg) rotateY(${yaw}deg) scale(${x * zoom}, ${y * zoom});`;
  const filter = intensity ? `filter: brightness(${(1 + intensity / 220).toFixed(2)}) contrast(${(1 + intensity / 550).toFixed(2)}) drop-shadow(${Math.round(Math.cos((Number(node.lightAzimuth || 270) * Math.PI) / 180) * 8)}px ${Math.round(Math.sin((Number(node.lightAzimuth || 270) * Math.PI) / 180) * 8)}px ${Math.round(8 + intensity / 8)}px ${hexToRgba(node.lightColor || '#ffffff', Math.min(.55, .18 + intensity / 160))});` : '';
  return x === 1 && y === 1 && !yaw && !pitch && zoom === 1 && !filter ? '' : `${transform}${filter}`;
}

function hexToRgba(hex = '#ffffff', alpha = .45) {
  const clean = String(hex || '#ffffff').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(ch => ch + ch).join('') : clean.padEnd(6, 'f').slice(0, 6);
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function normalizeNode(node) {
  if (!node) return node;
  if (!Array.isArray(node.annotations)) node.annotations = [];
  if (!Array.isArray(node.inlineReferences)) node.inlineReferences = [];
  node.disabled = !!node.disabled;
  node.annotationMode = !!node.annotationMode;
  node.annotationTool ||= 'brush';
  node.annotationColor ||= '#ccff00';
  if (['image', 'video'].includes(node.type) && node.imageRatio) {
    node.imageRatio = imageRatioForNode(node);
  }
  if (node.type === 't2i' && !['banana', 'image2'].includes(node.model)) {
    node.model = 'image2';
  }
  if (node.type === 'i2i' && !['banana', 'image2'].includes(node.model)) {
    node.model = 'image2';
  }
  if (node.type === 'loop') {
    if (!['banana', 'image2'].includes(node.model)) node.model = 'image2';
    node.loopCount = Math.max(1, Math.min(16, Number(node.loopCount || 8)));
    node.aspect ||= '16:9';
    node.quality ||= '2k';
    node.text ||= DETAIL_PAGE_LOOP_PROMPT;
    node.panelW ||= 680;
    node.panelH ||= 220;
  }
  if (node.type === 'grid') {
    node.gridItems = Array.isArray(node.gridItems) ? node.gridItems : [];
    node.gridLayout ||= 'grid';
    node.gridColumns = Math.max(1, Number(node.gridColumns || 3));
    node.gridEditing = !!node.gridEditing;
    node.gridCellRatio = Number(node.gridCellRatio || 0) || (node.gridItems[0]?.naturalWidth && node.gridItems[0]?.naturalHeight ? node.gridItems[0].naturalWidth / node.gridItems[0].naturalHeight : imageRatioForNode(node));
    node.imageRatio = gridRatioForNode(node);
  }
  if (['t2i', 'i2i'].includes(node.type) && (!node.quality || (node.quality === '4k' && !node.qualityMigrated))) {
    node.quality = '2k';
    node.qualityMigrated = true;
  }
  if (['t2v', 'i2v'].includes(node.type)) {
    node.videoProvider ||= 'ark';
    node.videoModelPreset ||= 'seedance2';
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
    w: data.w || (type === 'director' ? 720 : type === 'browser' ? 680 : type === 'loop' ? 620 : type === 'grid' ? 680 : type === 'compare' ? 520 : type === 'script' ? 360 : ['text', 'prompt'].includes(type) ? 320 : ['t2v', 'i2v'].includes(type) ? 380 : ['t2i', 'i2i'].includes(type) ? 520 : 220),
    h: data.h || (type === 'director' ? 420 : type === 'browser' ? 430 : type === 'loop' ? 380 : type === 'grid' ? 410 : type === 'compare' ? 300 : type === 'script' ? 220 : ['text', 'prompt'].includes(type) ? 180 : 120),
    title: data.title || typeNames[type] || '节点',
    text: data.text || (type === 'loop' ? DETAIL_PAGE_LOOP_PROMPT : ''),
    url: data.url || '',
    mime: data.mime || '',
    kind: data.kind || type,
    role: data.role || roleForType(type),
    ratio: data.ratio || '16:9',
    duration: data.duration || 5,
    model: data.model || defaultModelForType(type),
    videoProvider: data.videoProvider || 'ark',
    videoModelPreset: data.videoModelPreset || 'seedance2',
    generateAudio: data.generateAudio || false,
    watermark: data.watermark || false,
    aspect: data.aspect || '16:9',
    quality: data.quality || '2k',
    resolution: data.resolution || '4K',
    imageCount: data.imageCount || 1,
    loopCount: data.loopCount || 8,
    gridItems: Array.isArray(data.gridItems) ? data.gridItems : [],
    gridLayout: data.gridLayout || 'grid',
    gridColumns: data.gridColumns || 3,
    gridEditing: !!data.gridEditing,
    gridCellRatio: data.gridCellRatio || 0,
    inlineReferences: Array.isArray(data.inlineReferences) ? data.inlineReferences : [],
    directors: data.directors || [],
    annotations: Array.isArray(data.annotations) ? data.annotations : [],
    annotationMode: data.annotationMode || false,
    annotationTool: data.annotationTool || 'brush',
    annotationColor: data.annotationColor || '#ccff00',
    disabled: !!data.disabled,
    flipX: !!data.flipX,
    flipY: !!data.flipY,
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
  if (['image', 'video', 'grid'].includes(node.type) && node.imageRatio) {
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
    const disabledClass = node.disabled ? ' disabled' : '';
    div.className = `node ${node.type}${selectedClass}${fullscreenClass}${disabledClass}`;
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
    attachVideoRatioCapture(div, node);
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
    const sameRatio = Math.abs(Number(node.imageRatio || 0) - ratio) < 0.01;
    const sameSize = Number(node.naturalWidth || 0) === img.naturalWidth && Number(node.naturalHeight || 0) === img.naturalHeight;
    if (sameRatio && sameSize) return;
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

function attachVideoRatioCapture(div, node) {
  if (node.type !== 'video') return;
  const video = div.querySelector('video[data-capture-ratio]');
  if (!video) return;
  const capture = () => {
    if (!video.videoWidth || !video.videoHeight) return;
    const ratio = video.videoWidth / video.videoHeight;
    if (!Number.isFinite(ratio) || ratio <= 0) return;
    const sameRatio = Math.abs(Number(node.imageRatio || 0) - ratio) < 0.01;
    const sameSize = Number(node.naturalWidth || 0) === video.videoWidth && Number(node.naturalHeight || 0) === video.videoHeight;
    if (sameRatio && sameSize) return;
    node.imageRatio = ratio;
    node.naturalWidth = video.videoWidth;
    node.naturalHeight = video.videoHeight;
    node.h = imageNodeHeight(node);
    div.style.height = `${node.h}px`;
    scheduleRenderLinks();
    saveCanvas();
  };
  if (video.readyState >= 1) {
    capture();
  } else {
    video.addEventListener('loadedmetadata', capture, { once: true });
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
    const dims = imageDimensionsLabel(node);
    const flipStyle = imageFlipStyle(node);
    body = `
      <div class="image-node-preview" data-drag-asset-node="${node.id}">
        <img class="image-output" src="${node.url}" alt="" draggable="false" data-capture-ratio ${flipStyle ? `style="${flipStyle}"` : ''}>
        <button type="button" class="image-replace-btn" data-replace-image title="替换照片">替换</button>
        ${dims ? `<span class="image-dim-badge">${escapeHtml(dims)}</span>` : ''}
        ${annotationOverlayHTML(node)}
      </div>
      <div class="pill">${escapeHtml(node.role || 'reference_image')}</div>
    `;
  } else if (node.type === 'grid') {
    floatingTools = gridToolbarHTML(node);
    body = gridNodeHTML(node);
  } else if (node.type === 'video' && node.url) {
    const dims = imageDimensionsLabel(node);
    body = `
      <div class="video-node-preview" data-drag-asset-node="${node.id}">
        <video src="${node.url}" controls preload="metadata" data-capture-ratio></video>
        ${dims ? `<span class="image-dim-badge">${escapeHtml(dims)}</span>` : ''}
      </div>
      <div class="pill">${escapeHtml(node.role || 'reference_video')}</div>
    `;
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
  } else if (node.type === 'loop') {
    body = loopNodeHTML(node);
  } else if (node.type === 'compare') {
    body = compareNodeHTML(node);
  } else if (node.type === 'director') {
    body = directorNodeHTML(node);
  } else if (node.type === 'browser') {
    body = browserNodeHTML(node);
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
  const center = (actors.length - 1) / 2;
  return `
    <div class="director-node">
      <div class="director-top">
        <button type="button" data-open-director-stage>打开3D导演台</button>
      </div>
      <div class="director-space">
        <div class="director-horizon"></div>
        <div class="director-grid"></div>
        <div class="director-mini-light">灯光</div>
        ${actors.map((actor, index) => `
          <div class="director-actor" style="left:${50 + (index - center) * 12}%; top:${62 + (Math.abs(index - center) * 2)}%">
            <i title="${escapeAttr(actor)}"></i>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function bilibiliEmbedUrl(rawUrl = '') {
  const url = String(rawUrl || '').trim();
  const bv = url.match(/BV[0-9A-Za-z]+/)?.[0];
  if (!bv) return '';
  return `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(bv)}&page=1&high_quality=1&autoplay=0`;
}

function normalizeBrowserUrl(rawUrl = '') {
  const url = String(rawUrl || '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(url)) return `https://${url}`;
  return url;
}

function browserBlockedHTML(url = '') {
  const host = (() => {
    try { return new URL(url).hostname; } catch { return url || '该网站'; }
  })();
  return `
    <div class="browser-empty browser-blocked">
      <b>该网站禁止被嵌入节点</b>
      <span>${escapeHtml(host)} 拒绝 iframe 连接，这是网站安全策略，不是画布请求失败。B站 BV 视频链接仍会自动用播放器打开。</span>
      <div class="browser-shortcuts">
        <button type="button" data-browser-quick="https://www.douyin.com/user/self?from_tab_name=main">♪<span>抖音主页</span></button>
        <button type="button" data-browser-quick="https://space.bilibili.com/520302223?spm_id_from=333.1007.0.0">B<span>B站主页</span></button>
      </div>
    </div>
  `;
}

function browserNodeHTML(node) {
  const rawUrl = normalizeBrowserUrl(node.url || node.text || '');
  const embed = bilibiliEmbedUrl(rawUrl);
  const likelyBlocked = /(^https?:\/\/)?([^/]+\.)?(douyin\.com|iesdouyin\.com|v\.douyin\.com|bilibili\.com\/(?!video\/BV))/i.test(rawUrl);
  const canFrame = embed || (/^https?:\/\//.test(rawUrl) && !likelyBlocked);
  return `
    <div class="browser-node">
      <div class="browser-tabs">
        <button type="button" class="active">新标签页</button>
        <button type="button" data-browser-add-tab>+</button>
      </div>
      <div class="browser-address">
        <input data-field="url" value="${escapeAttr(rawUrl)}" placeholder="输入网址，支持 B站 / 抖音 / 普通网页链接">
        <button type="button" data-browser-open>打开</button>
      </div>
      <div class="browser-viewport">
        ${embed ? `<iframe src="${escapeAttr(embed)}" allowfullscreen></iframe>` : canFrame ? `<iframe src="${escapeAttr(rawUrl)}" referrerpolicy="no-referrer"></iframe>` : rawUrl && likelyBlocked ? browserBlockedHTML(rawUrl) : `
          <div class="browser-empty">
            <b>浏览器</b>
            <span>输入网址后按 Enter 在节点内访问。B站 BV 链接会自动嵌入播放器。</span>
            <div class="browser-shortcuts">
              <button type="button" data-browser-quick="https://www.douyin.com/user/self?from_tab_name=main">♪<span>抖音主页</span></button>
              <button type="button" data-browser-quick="https://space.bilibili.com/520302223?spm_id_from=333.1007.0.0">B<span>B站主页</span></button>
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}

function createReversePromptNode(kind = 'image') {
  const source = state.nodes.find(n => n.id === (state.menuNodeId || state.selectedId));
  const isVideo = kind === 'video';
  const title = isVideo ? '视频反推提示词' : '图像反推提示词';
  const sourceLabel = source ? `来源节点：${source.title || typeNames[source.type] || source.type}` : '来源节点：请连接或选择素材';
  const hookText = isVideo
    ? '【视频反推提示词入口】\n这里后续接入你内置的视频反推规则：分析画面主体、镜头运动、时长节奏、景别、光影、色彩、动作、转场、声音事件，并输出可直接用于文生视频/图生视频的提示词。'
    : '【图像反推提示词入口】\n这里后续接入你内置的图像反推规则：分析主体、场景、构图、镜头、光影、色彩、材质、风格和负面词，并输出可直接用于文生图/图生图的提示词。';
  const p = state.menuPoint || screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
  const node = addNode('text', p.x, p.y, {
    title,
    text: `${sourceLabel}\n\n${hookText}`,
    w: 360,
    h: 230,
  });
  if (source && canOutput(source.type)) {
    state.links.push({ id: uid('link'), from: source.id, to: node.id });
    render();
    saveCanvas();
  }
  setStatus(`${title}入口已创建，后续可直接嫁接内置反推提示词/接口`);
}

function imageGeneratorHTML(node) {
  const flipStyle = imageFlipStyle(node);
  const output = node.resultUrl
    ? `<img class="image-output" src="${node.resultUrl}" alt="" draggable="false" ${flipStyle ? `style="${flipStyle}"` : ''}>`
    : '<div class="image-output-empty">Image</div>';
  const download = node.resultUrl ? `<button class="node-download" data-download-image title="下载图片">下载</button>` : '';
  const status = node.taskStatus && node.taskStatus !== 'succeeded'
    ? `<div class="preview-status ${node.taskStatus}">${escapeHtml(node.progressText || node.taskStatus)}${progressBarHTML(node)}</div>`
    : '';
  return `<div class="image-node-preview" data-drag-asset-node="${node.id}">${output}${download}${status}${annotationOverlayHTML(node)}</div>`;
}

function imageUtilityToolbarHTML(node) {
  const annotationColor = node.annotationColor || '#ccff00';
  return `
    <div class="image-tool-strip">
      <button data-image-tool="characterSheet" title="生成人物三视图">人物三视图</button>
      <button data-image-tool="nineGrid" title="生成九宫格">九宫格</button>
      <button data-image-assist="angle" title="角度编辑器">角度</button>
      <button data-image-assist="light" title="打光编辑器">打光</button>
      <div class="image-tool-menu">
        <button type="button" class="${node.annotationMode ? 'active' : ''}" title="编辑标注">编辑</button>
        <div class="image-tool-dropdown annotation-edit-menu">
          <label class="annotation-color-picker annotation-color-row" style="--annotation-color: ${escapeAttr(annotationColor)}" title="选择画笔和文字颜色">
            <input type="color" data-annotation-color value="${escapeAttr(annotationColor)}">
            <span>颜色</span>
          </label>
          <button class="annotation-inline ${node.annotationMode && node.annotationTool !== 'text' ? 'active' : ''}" data-annotation-tool="brush" title="画笔标注">画笔<span>按下鼠标绘制，松开停止</span></button>
          <button class="annotation-inline ${node.annotationMode && node.annotationTool === 'text' ? 'active' : ''}" data-annotation-tool="text" title="文字标注">文字<span>拖出文字框后直接输入</span></button>
          <button class="annotation-inline" data-annotation-save title="保存并退出编辑">保存<span>退出画笔/文字编辑状态</span></button>
          <button class="annotation-inline" data-annotation-clear title="清空标注">清空<span>删除当前图片全部标注</span></button>
        </div>
      </div>
      <div class="image-tool-menu">
        <button type="button" title="图片反转">反转</button>
        <div class="image-tool-dropdown">
          <button type="button" data-image-flip="horizontal">水平翻转<span>Shift H</span></button>
          <button type="button" data-image-flip="vertical">垂直翻转<span>Shift V</span></button>
        </div>
      </div>
      <div class="image-tool-menu">
        <button type="button" title="宫格裁切">宫格裁切</button>
        <div class="image-tool-dropdown">
          <button type="button" data-image-grid="9">9宫格裁切<span>3×3 网格</span></button>
          <button type="button" data-image-grid="16">16宫格裁切<span>4×4 网格</span></button>
          <button type="button" data-image-grid="25">25宫格裁切<span>5×5 网格</span></button>
        </div>
      </div>
    </div>
  `;
}

function gridLayoutColumns(node) {
  const count = Math.max(1, node.gridItems?.length || 1);
  if (node.gridLayout === 'horizontal') return count;
  if (node.gridLayout === 'vertical') return 1;
  return Math.max(1, Number(node.gridColumns || Math.round(Math.sqrt(count)) || 3));
}

function gridRatioForNode(node) {
  const count = Math.max(1, node?.gridItems?.length || 1);
  const cols = gridLayoutColumns(node);
  const rows = Math.max(1, Math.ceil(count / cols));
  const cellRatio = Number(node?.gridCellRatio || 0)
    || (node?.gridItems?.[0]?.naturalWidth && node?.gridItems?.[0]?.naturalHeight ? node.gridItems[0].naturalWidth / node.gridItems[0].naturalHeight : 16 / 9);
  return Math.max(0.2, Math.min(8, (cols / rows) * cellRatio));
}

function gridToolbarHTML(node) {
  const activeLayout = node.gridLayout || 'grid';
  return `
    <div class="image-tool-strip grid-tool-strip">
      <button type="button" data-grid-download>批量下载</button>
      <div class="image-tool-menu">
        <button type="button">布局</button>
        <div class="image-tool-dropdown">
          <button type="button" data-grid-layout="grid" class="${activeLayout === 'grid' ? 'active' : ''}">宫格布局<span>紧密镶嵌网格</span></button>
          <button type="button" data-grid-layout="horizontal" class="${activeLayout === 'horizontal' ? 'active' : ''}">水平布局<span>横向连续排列</span></button>
          <button type="button" data-grid-layout="vertical" class="${activeLayout === 'vertical' ? 'active' : ''}">垂直布局<span>竖向连续排列</span></button>
        </div>
      </div>
      <button type="button" data-grid-edit class="${node.gridEditing ? 'active' : ''}">编辑</button>
      <button type="button" data-grid-split>拆分</button>
      <button type="button" data-grid-clear>清空</button>
    </div>
  `;
}

function gridNodeHTML(node) {
  const items = Array.isArray(node.gridItems) ? node.gridItems : [];
  const cols = gridLayoutColumns(node);
  const layout = node.gridLayout || 'grid';
  return `
    <div class="grid-node-preview ${node.gridEditing ? 'editing' : ''}" data-grid-node>
      <div class="grid-mosaic layout-${escapeAttr(layout)}" style="--grid-cols:${cols}">
        ${items.length ? items.map((item, index) => `
          <div class="grid-cell" data-grid-cell="${index}" draggable="${node.gridEditing ? 'true' : 'false'}" title="${node.gridEditing ? '拖拽排序，或拖出到画布' : '双击或点编辑进入排序'}">
            <img src="${escapeAttr(item.url)}" alt="${escapeAttr(item.title || `分镜${index + 1}`)}" draggable="false">
          </div>
        `).join('') : '<div class="grid-empty">暂无分镜</div>'}
      </div>
      <div class="grid-caption">${node.gridEditing ? '编辑中：拖动格子排序，拖到画布可拆出单图，外部图片拖入可替换' : '双击或点击编辑进入分镜编辑排序'}</div>
    </div>
  `;
}

function annotationOverlayHTML(node) {
  const annotations = Array.isArray(node.annotations) ? node.annotations : [];
  const shapes = annotations.map((item, index) => {
    const color = escapeAttr(item.color || node.annotationColor || '#ccff00');
    if (item.type === 'text') {
      return `<text class="annotation-item annotation-text" data-annotation-index="${index}" x="${Number(item.x || 0)}" y="${Number(item.y || 0)}" fill="${color}" font-size="4.5" font-weight="800">${escapeHtml(item.text || '')}</text>`;
    }
    if (item.type === 'textBox') return '';
    const d = (item.points || []).map((point, index) => `${index ? 'L' : 'M'} ${Number(point.x || 0).toFixed(2)} ${Number(point.y || 0).toFixed(2)}`).join(' ');
    return `<path class="annotation-item annotation-path" data-annotation-index="${index}" d="${d}" fill="none" stroke="${color}" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"></path>`;
  }).join('');
  const textBoxes = annotations.map((item, index) => {
    if (item.type !== 'textBox') return '';
    const color = escapeAttr(item.color || node.annotationColor || '#ccff00');
    const x = Math.max(0, Math.min(100, Number(item.x || 0)));
    const y = Math.max(0, Math.min(100, Number(item.y || 0)));
    const w = Math.max(4, Math.min(100 - x, Number(item.w || 18)));
    const h = Math.max(4, Math.min(100 - y, Number(item.h || 8)));
    return `<div class="annotation-box annotation-item" data-annotation-index="${index}" data-annotation-textbox-index="${index}" contenteditable="${node.annotationMode}" spellcheck="false" style="left:${x}%;top:${y}%;min-width:${w}%;min-height:${h}%;color:${color};--annotation-color:${color};">${escapeHtml(item.text || '输入文字')}</div>`;
  }).join('');
  return `
    <svg class="annotation-layer ${node.annotationMode ? 'active' : ''}" viewBox="0 0 100 100" preserveAspectRatio="none" data-annotation-layer>
      ${shapes}
    </svg>
    <div class="annotation-text-layer ${node.annotationMode ? 'active' : ''}" data-annotation-text-layer>
      ${textBoxes}
    </div>
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

function loopNodeHTML(node) {
  const count = Math.max(1, Math.min(16, Number(node.loopCount || 8)));
  const status = node.taskStatus
    ? `<div class="node-progress ${node.taskStatus}">
        <div>${escapeHtml(node.progressText || node.taskStatus)}</div>
        ${progressBarHTML(node, true)}
      </div>`
    : '';
  return `
    <div class="loop-node">
      ${referenceImageStripHTML(node)}
      <label class="node-label">详情页内置提示词</label>
      <textarea class="loop-prompt" data-field="text">${escapeHtml(node.text || DETAIL_PAGE_LOOP_PROMPT)}</textarea>
      <div class="loop-param-row">
        <select data-field="model" title="生图模型">
          ${['image2', 'banana'].map(v => `<option value="${v}" ${node.model === v ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
        <select data-field="aspect" title="比例">
          ${['16:9', '9:16', '1:1', '4:3', '3:4'].map(v => `<option ${node.aspect === v ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
        <select data-field="quality" title="清晰度">
          ${['1k', '2k', '4k'].map(v => `<option ${node.quality === v ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
        <select data-field="loopCount" title="数量">
          ${[1, 2, 4, 6, 8, 10, 12, 16].map(v => `<option value="${v}" ${count === v ? 'selected' : ''}>${v} 张</option>`).join('')}
        </select>
        <button type="button" class="loop-run" data-run-loop>开始生成</button>
      </div>
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
  const modelOptions = [
    { value: 'seedance2', label: 'Seedance 2.0' },
    { value: 'seedance-mini', label: 'Seedance mini' },
    { value: 'kling', label: '可灵备用' },
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
        <select data-field="videoModelPreset">
          ${modelOptions.map(item => `<option value="${item.value}" ${(node.videoModelPreset || 'seedance2') === item.value ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}
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
          ${['480p', '720p', '1080p', '4K'].map(v => `<option value="${v}" ${String(node.resolution || '4K').toLowerCase() === v.toLowerCase() ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </div>
    </div>
    <button class="node-generate" data-generate-node>开始生成</button>
    ${status}
  `;
}

function renderParamPanel() {
  const node = state.nodes.find(n => n.id === state.activeParamNodeId && isGeneratorType(n.type));
  if (!node) return;
  const panel = document.createElement('div');
  const panelW = paramPanelWidth(node);
  panel.className = `param-panel ${node.type}`;
  panel.dataset.id = node.id;
  panel.style.left = `${paramPanelLeft(node, panelW)}px`;
  panel.style.top = `${paramPanelTop(node)}px`;
  panel.style.width = `${panelW}px`;
  panel.style.minHeight = `${node.panelH || 180}px`;
  panel.innerHTML = `
    <div class="param-panel-body">
      ${['t2i', 'i2i'].includes(node.type) ? imageParamPanelHTML(node) : videoParamPanelHTML(node)}
    </div>
    <div class="panel-resize-handle" title="拖动调整参数面板"></div>
  `;
  els.world.appendChild(panel);
}

function paramPanelWidth(node) {
  const nodeW = Number(node?.w || 0);
  const preferredW = Number(node?.panelW || (['t2v', 'i2v'].includes(node?.type) ? 560 : 520));
  return Math.max(nodeW, preferredW);
}

function paramPanelLeft(node, panelW = paramPanelWidth(node)) {
  return node.x + (node.w || panelW) / 2 - panelW / 2;
}

function paramPanelTop(node) {
  return node.y + (node.h || previewHeightForNode(node)) + 12;
}

function syncParamPanelPosition(node) {
  if (!node) return;
  const panel = document.querySelector(`.param-panel[data-id="${node.id}"]`);
  if (!panel) return;
  const panelW = Math.max(paramPanelWidth(node), panel.offsetWidth || 0);
  panel.style.width = `${panelW}px`;
  panel.style.left = `${paramPanelLeft(node, panelW)}px`;
  panel.style.top = `${paramPanelTop(node)}px`;
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
    <div class="asset-card" data-asset="${asset.id}" draggable="true">
      <div class="asset-thumb">${media}</div>
      <button type="button" class="asset-rename" data-asset-rename="${asset.id}" title="改名">✎</button>
      <button type="button" class="asset-delete" data-asset-delete="${asset.id}" title="删除">×</button>
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
  els.materialBoard?.classList.toggle('asset-floating', kind === 'assets');
  if (kind !== 'assets') {
    document.querySelectorAll('.rail-item[data-tab="assets"]').forEach(btn => btn.classList.remove('active'));
  }
  updateProjectTitleBar();
  renderMaterialBoard();
}

function hideMaterialBoard() {
  state.materialView = false;
  els.materialBoard?.classList.add('hidden');
  els.materialBoard?.classList.remove('asset-floating', 'drop-active');
  document.querySelectorAll('.rail-item[data-tab="assets"]').forEach(btn => btn.classList.remove('active'));
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
  els.materialBoard?.classList.remove('asset-floating', 'drop-active');
  document.querySelectorAll('.rail-item[data-tab="assets"]').forEach(btn => btn.classList.remove('active'));
  markTopSection('t2i');
  fillModelSelect();
}

function renderMaterialBoard() {
  if (!els.materialBoard || !state.materialView) return;
  if (state.materialView === 'assets') {
    renderAssetLibraryBoard();
    return;
  }
  if (state.materialView === 'prompts') {
    renderPromptPresetBoard();
    return;
  }
  if (state.materialView === 'clone') {
    renderCloneBoard();
    return;
  }
  if (state.materialView === 'talking') {
    renderTalkingAgentBoard();
    return;
  }
  if (state.materialView === 'commonTools') {
    renderCommonToolsBoard();
    return;
  }
  renderLocalMaterialBoard();
}

function assetCategoryTabsHTML() {
  const tabs = [
    ['all', '全部'],
    ['person', '人物'],
    ['scene', '场景'],
    ['object', '物品'],
    ['style', '风格'],
    ['other', '其他'],
  ];
  return tabs.map(([id, label]) => `<button type="button" class="${state.assetFilter === id ? 'active' : ''}" data-asset-filter="${id}">${label}</button>`).join('');
}

function renderAssetLibraryBoard() {
  const assets = (state.assets || [])
    .filter(asset => state.assetFilter === 'all' || asset.category === state.assetFilter);
  els.materialBoard.innerHTML = `
    <div class="workspace-board asset-library-board" data-asset-library-drop>
      <div class="workspace-head">
        <div>
          <h2>资产库 <span>(${state.assets.length})</span></h2>
          <p>拖画布图片/视频到分类或面板内即可入库。</p>
        </div>
        <button type="button" class="asset-panel-close" data-close-asset-panel>关闭</button>
      </div>
      <div class="asset-tabs asset-tabs-large">
        ${assetCategoryTabsHTML()}
      </div>
      <div class="asset-library-grid">
        ${assets.length ? assets.map(assetCardHTML).join('') : '<button type="button" class="asset-library-empty" data-asset-empty-upload>暂无资产，点击上传，或把画布图片/视频拖到分类按钮上。</button>'}
      </div>
    </div>
  `;
}

function renderCommonToolsBoard() {
  els.materialBoard.innerHTML = `
    <div class="workspace-board common-tools-board">
      <div class="workspace-head">
        <div>
          <h2>常用工具</h2>
        </div>
      </div>
      <div class="common-tools-empty"></div>
    </div>
  `;
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

function openMaterialUploadForCurrentFilter() {
  const filter = state.materialFilter || 'all';
  state.materialUploadType = filter === 'all' ? 'auto' : filter;
  if (filter === 'image') els.imageInput.click();
  else if (filter === 'video') els.videoInput.click();
  else if (filter === 'audio') els.audioInput.click();
  else els.fileInput.click();
  setStatus(filter === 'all' ? '选择图片、视频或音频素材' : `选择${filter === 'image' ? '图片' : filter === 'video' ? '视频' : '音频'}素材`);
}

function shouldMaterialUploadFromEvent(event) {
  if (!state.materialView || state.materialView !== 'materials') return false;
  if (event.target.closest('.material-card, button, input, textarea, select, a')) {
    return !!event.target.closest('[data-material-empty-upload]');
  }
  return !!event.target.closest('.workspace-board, .material-grid, .material-drop-zone');
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
        `).join('') : '<button type="button" class="material-upload-empty" data-material-empty-upload>暂无素材，<br>双击或右键上传，<br>也可把本地文件/文件夹拖进来。</button>'}
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
  const query = (state.promptPresetQuery || '').trim().toLowerCase();
  return state.promptPresets.filter(item => {
    const matchCategory = state.promptPresetFilter === 'all' || item.category === state.promptPresetFilter;
    if (!matchCategory) return false;
    if (!query) return true;
    const haystack = [item.title, item.desc, item.positive, item.negative, item.tag, categoryNameForPreset(item.category)]
      .join('\n')
      .toLowerCase();
    return haystack.includes(query);
  });
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
        ${promptCategoryList().map(({ id, label }) => `<button type="button" draggable="${id === 'all' ? 'false' : 'true'}" class="${state.promptPresetFilter === id ? 'active' : ''}" data-preset-filter="${id}" data-preset-category-id="${id}" title="${id === 'all' ? '全部分类' : '双击或右键可重命名'}">${escapeHtml(label)}</button>`).join('')}
        <div class="preset-category-actions">
          <button type="button" class="manage-btn" data-preset-category-new>新增</button>
          <button type="button" class="manage-btn" data-preset-category-rename>重命名</button>
          <button type="button" class="danger-btn" data-preset-category-delete>删除</button>
        </div>
        <div class="preset-search">
          <input data-preset-search value="${escapeAttr(state.promptPresetQuery || '')}" placeholder="查询提示词关键字">
          <button type="button" data-preset-search-run>查询</button>
        </div>
      </div>
      <div class="prompt-layout">
        <aside class="prompt-list">
          <div class="prompt-list-actions">
            <button type="button" data-preset-new>新增</button>
          </div>
          ${list.length ? list.map(item => `
            <button type="button" draggable="true" class="prompt-card ${item.id === selected?.id ? 'active' : ''}" data-preset-id="${item.id}">
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
  return promptCategoryList().find(item => item.id === category)?.label || '我的';
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
    <div class="workspace-board clone-board">
      <div class="workspace-head">
        <div>
          <h2>爆款克隆</h2>
        </div>
      </div>
      <div class="clone-clean-grid">
        <section class="clone-clean-card">
          <div class="talking-step clone-step"><b>01</b><strong>短视频参考与动作模仿</strong><em>VIDEO</em></div>
          <div class="clone-link-row">
            <input data-clone-url value="${escapeAttr(state.cloneStudio?.sourceUrl || '')}" placeholder="粘贴抖音 / B站 / 视频链接，用于后续解析爆款结构">
            <button type="button" data-clone-action="extract">记录链接</button>
          </div>
          <div class="clone-video-zone clone-mimic-video" data-clone-drop>
            ${state.cloneStudio?.videoUrl ? `
              <video data-clone-video src="${escapeAttr(state.cloneStudio.videoUrl)}" controls crossorigin="anonymous"></video>
              <span>${escapeHtml(state.cloneStudio.videoName || '已加载短视频')}</span>
            ` : '<div class="clone-drop-empty"><b>拖入短视频或点击加载</b><span>播放到任意一帧后截图，作为图生图 / 图生视频参考。</span></div>'}
          </div>
          <div class="clone-actions-row">
            <button type="button" data-clone-action="load-video">加载短视频</button>
            <button type="button" data-clone-action="capture-frame">截取当前帧</button>
            <button type="button" data-clone-action="import-frame" ${state.cloneStudio?.frameUrl ? '' : 'disabled'}>截图导入画布</button>
            <button type="button" class="primary" data-clone-action="mimic">动作模仿生成</button>
          </div>
          <div class="clone-frame-panel">
            <div class="clone-frame-preview">
              ${state.cloneStudio?.frameUrl ? `<img src="${escapeAttr(state.cloneStudio.frameUrl)}" alt="截取帧">` : '<span>截取帧预览</span>'}
            </div>
            <div class="clone-prompt-note">
              <b>内置提示词预设</b>
              <p>参考原视频人物动作、表情节奏、口播停顿、镜头距离、推拉摇移和构图；替换为新模特或新背景；严格保持新生成模特的面部特征、年龄、发型、服装身份，不要变脸；最终用 Seedance2 图生视频重新生成。</p>
            </div>
          </div>
          <input type="file" accept="video/*" hidden data-clone-video-input>
        </section>
      </div>
    </div>
  `;
}

function renderTalkingAgentBoard() {
  const talk = state.talkingAgent || {};
  const audioOptions = TALKING_PRESET_AUDIOS.map(([value, label]) => `<option value="${escapeAttr(value)}" ${talk.presetAudio === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
  const avatarOptions = TALKING_PRESET_AVATARS.map(([value, label]) => `<option value="${escapeAttr(value)}" ${talk.presetAvatar === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
  els.materialBoard.innerHTML = `
    <div class="workspace-board clone-board talking-agent-board">
      <div class="workspace-head">
        <div>
          <h2>自动化视频生成智能体</h2>
        </div>
      </div>
      <div class="talking-grid">
        <section class="talking-panel">
          <div class="talking-step"><b>01</b><strong>文案提取与改写</strong><em>INPUT</em></div>
          <div class="clone-link-row">
            <input data-talking-field="sourceUrl" value="${escapeAttr(talk.sourceUrl || '')}" placeholder="粘贴短视频链接">
            <button type="button" data-talking-action="extract-link">提取链接</button>
          </div>
          <textarea class="talking-textarea" data-talking-field="originalText" placeholder="提取到的文案会显示在这里，也可以手动输入">${escapeHtml(talk.originalText || '')}</textarea>
          <div class="talking-mini-row">
            <button type="button" data-talking-action="extract-script">提取视频文案</button>
            <button type="button" data-talking-action="rewrite-script">文案改写</button>
          </div>
          <textarea class="talking-textarea large" data-talking-field="rewrittenText" placeholder="改写后的口播文案会同步到这里，用于生成配音和视频提示词">${escapeHtml(talk.rewrittenText || '')}</textarea>
          <input class="talking-input" data-talking-field="title" value="${escapeAttr(talk.title || '')}" placeholder="标题：自动生成或手动填写标题">
          <input class="talking-input" data-talking-field="topics" value="${escapeAttr(talk.topics || '')}" placeholder="话题：#实体获客 #同城短视频 #口播视频">
          <button type="button" class="talking-primary" data-talking-action="run-all">一键执行</button>
        </section>
        <section class="talking-panel">
          <div class="talking-step"><b>02</b><strong>声音与数字人</strong><em>VOICE</em></div>
          <div class="talking-module">
            <h3>声音克隆</h3>
            <div class="talking-switch-row">
              <button type="button" class="active" data-talking-action="upload-audio">上传音频</button>
              <button type="button" data-talking-action="preset-audio">预设音频</button>
            </div>
            <label class="talking-preset-select">预设音频
              <select data-talking-field="presetAudio">
                <option value="">选择一个预设音频</option>
                ${audioOptions}
              </select>
            </label>
            <div class="talking-file-box">
              <button type="button" data-talking-action="upload-audio">选择文件</button>
              <span>${escapeHtml(talk.audioName || '未选择文件')}</span>
            </div>
            <small>推荐 wav，兼容 mp3 / m4a / aac / flac / ogg。</small>
            <audio controls src="${escapeAttr(talk.audioUrl || '')}"></audio>
            <div class="talking-inline-fields">
              <label>情感
                <select data-talking-field="tone">
                  <option value="normal" ${talk.tone === 'normal' ? 'selected' : ''}>正常</option>
                  <option value="warm" ${talk.tone === 'warm' ? 'selected' : ''}>温暖</option>
                  <option value="excited" ${talk.tone === 'excited' ? 'selected' : ''}>兴奋</option>
                  <option value="serious" ${talk.tone === 'serious' ? 'selected' : ''}>沉稳</option>
                </select>
              </label>
              <label>语速调节
                <input data-talking-field="speed" value="${escapeAttr(talk.speed || '1.0')}" placeholder="1.0">
              </label>
            </div>
            <button type="button" class="talking-primary" data-talking-action="generate-audio">生成音频</button>
          </div>
          <div class="talking-module">
            <h3>数字人素材</h3>
            <div class="talking-switch-row">
              <button type="button" class="active" data-talking-action="upload-avatar">上传视频</button>
              <button type="button" data-talking-action="preset-avatar">预设形象</button>
            </div>
            <label class="talking-preset-select">预设形象
              <select data-talking-field="presetAvatar">
                <option value="">选择一个预设形象</option>
                ${avatarOptions}
              </select>
            </label>
            <div class="talking-file-box">
              <button type="button" data-talking-action="upload-avatar">选择文件</button>
              <span>${escapeHtml(talk.avatarName || '等待数字人素材')}</span>
            </div>
            <div class="talking-avatar-preview">
              ${talk.avatarUrl ? `<video src="${escapeAttr(talk.avatarUrl)}" controls muted></video>` : '<span>数字人视频预览</span>'}
            </div>
            <button type="button" class="talking-primary" data-talking-action="create-speaking-video">生成口播视频节点</button>
          </div>
          <input type="file" accept="audio/*" hidden data-talking-audio-input>
          <input type="file" accept="video/*" hidden data-talking-avatar-input>
        </section>
      </div>
    </div>
  `;
}

function createCloneWorkflow(kind = 'talking') {
  const p = agentCanvasAnchor();
  hideMaterialBoard();
  markTopSection('t2i');
  const title = '口播智能体';
  const text = '口播智能体任务：\n1. 输入爆款视频链接或口播主题\n2. 拆解开头钩子、情绪冲突、故事结构、金句密度和结尾转化\n3. 生成口播脚本、分镜提示词、标题和封面提示词\n4. 输出可连接文生视频节点的执行方案';
  const node = addNode('script', p.x, p.y, {
    title,
    text,
    w: 420,
    h: 270,
  });
  state.selectedId = node.id;
  setStatus(`已创建${title}任务节点`);
}

function setCloneVideoFile(file) {
  if (!file || !file.type?.startsWith('video/')) {
    setStatus('请加载短视频文件');
    return;
  }
  if (state.cloneStudio.videoUrl?.startsWith('blob:')) URL.revokeObjectURL(state.cloneStudio.videoUrl);
  state.cloneStudio.videoUrl = URL.createObjectURL(file);
  state.cloneStudio.videoName = file.name || '本地短视频';
  state.cloneStudio.frameUrl = '';
  renderMaterialBoard();
  setStatus(`已加载短视频：${state.cloneStudio.videoName}`);
}

function extractCloneLink() {
  const input = els.materialBoard?.querySelector('[data-clone-url]');
  const url = input?.value?.trim() || '';
  state.cloneStudio.sourceUrl = url;
  state.cloneStudio.extracted = !!url;
  renderMaterialBoard();
  setStatus(url ? '已记录短视频链接，后续可接平台解析接口' : '请先粘贴短视频链接');
}

function captureCloneFrame() {
  const video = els.materialBoard?.querySelector('[data-clone-video]');
  if (!video) {
    setStatus('先加载短视频，再截取当前帧');
    return;
  }
  if (video.readyState < 2) {
    setStatus('视频画面还没加载出来，先播放或等待一下再截图');
    return;
  }
  const w = video.videoWidth || 1280;
  const h = video.videoHeight || 720;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, w, h);
  state.cloneStudio.frameUrl = canvas.toDataURL('image/png');
  state.cloneStudio.frameRatio = w / h;
  renderMaterialBoard();
  setStatus('当前帧已截图，可导入画布作为参考图');
}

function importCloneFrameToCanvas() {
  if (!state.cloneStudio.frameUrl) {
    setStatus('还没有截取帧');
    return null;
  }
  const p = agentCanvasAnchor();
  hideMaterialBoard();
  markTopSection('t2i');
  const node = addNode('image', p.x, p.y, {
    title: '口播截帧参考',
    url: state.cloneStudio.frameUrl,
    role: 'reference_image',
    imageRatio: state.cloneStudio.frameRatio || 16 / 9,
    w: 360,
  });
  setStatus('截取帧已导入画布');
  return node;
}

function createCloneMimicWorkflow() {
  const p = agentCanvasAnchor();
  hideMaterialBoard();
  markTopSection('t2i');
  const prompt = '动作模仿生成：参考原视频人物的口播动作、表情节奏、手势、身体重心、镜头运动、景别变化和构图关系；可以替换模特或替换背景；严格保持新生成模特的面部特征、年龄、发型、服装身份和核心视觉特征，不要变脸，不要换人；使用 Seedance2 图生视频重新生成，画面真实自然，动作连贯。';
  const textNode = addNode('text', p.x, p.y, {
    title: '动作模仿提示词',
    text: prompt,
    w: 420,
    h: 220,
  });
  let imageNode = null;
  if (state.cloneStudio.frameUrl) {
    imageNode = addNode('image', p.x - 300, p.y, {
      title: '原视频截帧',
      url: state.cloneStudio.frameUrl,
      role: 'reference_image',
      imageRatio: state.cloneStudio.frameRatio || 16 / 9,
      w: 240,
    });
  }
  const videoNode = addNode(imageNode ? 'i2v' : 't2v', p.x + 470, p.y, {
    title: 'Seedance2 动作模仿',
    text: prompt,
    videoModelPreset: 'seedance2',
    model: 'doubao-seedance-2-0-260128',
    duration: 8,
    resolution: '4K',
    w: 420,
  });
  state.links.push({ id: uid('link'), from: textNode.id, to: videoNode.id });
  if (imageNode) state.links.push({ id: uid('link'), from: imageNode.id, to: videoNode.id });
  render();
  saveCanvas();
  setStatus('已创建 Seedance2 动作模仿工作流');
}

function syncTalkingAgentFromBoard() {
  const talk = state.talkingAgent;
  els.materialBoard?.querySelectorAll('[data-talking-field]').forEach(field => {
    const key = field.dataset.talkingField;
    if (!key) return;
    talk[key] = field.value || '';
  });
}

function presetLabel(list, value, fallback = '') {
  return list.find(([id]) => id === value)?.[1] || fallback;
}

function setTalkingAudioFile(file) {
  if (!file || !file.type?.startsWith('audio/')) {
    setStatus('请选择音频文件');
    return;
  }
  if (state.talkingAgent.audioUrl?.startsWith('blob:')) URL.revokeObjectURL(state.talkingAgent.audioUrl);
  state.talkingAgent.audioUrl = URL.createObjectURL(file);
  state.talkingAgent.audioName = file.name || '参考音频';
  renderMaterialBoard();
  setStatus(`已加载声音参考：${state.talkingAgent.audioName}`);
}

function setTalkingAvatarFile(file) {
  if (!file || !file.type?.startsWith('video/')) {
    setStatus('请选择数字人视频文件');
    return;
  }
  if (state.talkingAgent.avatarUrl?.startsWith('blob:')) URL.revokeObjectURL(state.talkingAgent.avatarUrl);
  state.talkingAgent.avatarUrl = URL.createObjectURL(file);
  state.talkingAgent.avatarName = file.name || '数字人素材';
  renderMaterialBoard();
  setStatus(`已加载数字人素材：${state.talkingAgent.avatarName}`);
}

function extractTalkingLink() {
  syncTalkingAgentFromBoard();
  const url = state.talkingAgent.sourceUrl.trim();
  if (!url) {
    setStatus('请先粘贴短视频链接');
    return;
  }
  state.talkingAgent.originalText = state.talkingAgent.originalText || `已记录视频链接：${url}\n\n这里后续可接入平台解析接口，自动提取字幕、口播文案、镜头节奏和爆点结构。`;
  renderMaterialBoard();
  setStatus('链接已记录到口播智能体');
}

function extractTalkingScript() {
  syncTalkingAgentFromBoard();
  const source = state.talkingAgent.sourceUrl.trim();
  const current = state.talkingAgent.originalText.trim();
  state.talkingAgent.originalText = current || `从链接提取文案：${source || '未填写链接'}\n\n开头钩子：用一句强冲突问题抓注意力。\n主体段落：用真实案例解释痛点、结果和转化路径。\n结尾行动：给出明确下一步，引导私信或下单。`;
  renderMaterialBoard();
  setStatus('已生成可编辑的文案提取草稿');
}

function rewriteTalkingScript() {
  syncTalkingAgentFromBoard();
  const source = state.talkingAgent.originalText.trim();
  if (!source) {
    setStatus('先提取或输入原始文案');
    return;
  }
  state.talkingAgent.rewrittenText = `改写版口播文案：\n${source}\n\n优化规则：开头更短、更有钩子；中段补充可落地案例；结尾加入明确转化动作。`;
  state.talkingAgent.title = state.talkingAgent.title || '自动生成口播短视频';
  state.talkingAgent.topics = state.talkingAgent.topics || '#实体获客 #同城短视频 #口播视频';
  renderMaterialBoard();
  setStatus('文案已改写，可继续生成音频或视频节点');
}

function usePresetTalkingAudio(value = '') {
  const preset = value || state.talkingAgent.presetAudio || TALKING_PRESET_AUDIOS[0]?.[0] || '';
  state.talkingAgent.presetAudio = preset;
  const label = presetLabel(TALKING_PRESET_AUDIOS, preset, '稳重男声');
  state.talkingAgent.audioName = `预设音频：${label}`;
  state.talkingAgent.audioUrl = '';
  renderMaterialBoard();
  setStatus(`已选择预设音频：${label}`);
}

function usePresetTalkingAvatar(value = '') {
  const preset = value || state.talkingAgent.presetAvatar || TALKING_PRESET_AVATARS[0]?.[0] || '';
  state.talkingAgent.presetAvatar = preset;
  const label = presetLabel(TALKING_PRESET_AVATARS, preset, '商务口播');
  state.talkingAgent.avatarName = `预设数字人：${label}`;
  state.talkingAgent.avatarUrl = '';
  renderMaterialBoard();
  setStatus(`已选择预设数字人：${label}`);
}

function createTalkingAudioTaskNode() {
  syncTalkingAgentFromBoard();
  const p = agentCanvasAnchor();
  hideMaterialBoard();
  markTopSection('t2i');
  const script = state.talkingAgent.rewrittenText || state.talkingAgent.originalText || '请先填写口播文案';
  const textNode = addNode('text', p.x, p.y, {
    title: '口播文案',
    text: script,
    w: 420,
    h: 240,
  });
  const audioTask = addNode('script', p.x + 470, p.y, {
    title: '声音克隆 / 配音任务',
    text: `声音配置：${state.talkingAgent.audioName || '未选择声音'}\n情感：${state.talkingAgent.tone || 'normal'}\n语速：${state.talkingAgent.speed || '1.0'}\n\n生成口播音频：\n${script}`,
    w: 390,
    h: 250,
  });
  state.links.push({ id: uid('link'), from: textNode.id, to: audioTask.id });
  render();
  saveCanvas();
  setStatus('已创建声音生成任务节点');
}

function createTalkingSpeakingVideoNode() {
  syncTalkingAgentFromBoard();
  const p = agentCanvasAnchor();
  hideMaterialBoard();
  markTopSection('t2i');
  const script = state.talkingAgent.rewrittenText || state.talkingAgent.originalText || '请先填写口播文案';
  const promptNode = addNode('text', p.x, p.y, {
    title: '数字人口播提示词',
    text: `使用数字人素材：${state.talkingAgent.avatarName || '未选择'}\n声音：${state.talkingAgent.audioName || '未选择'}\n标题：${state.talkingAgent.title || '未填写'}\n话题：${state.talkingAgent.topics || '未填写'}\n\n口播文案：\n${script}`,
    w: 460,
    h: 280,
  });
  const videoNode = addNode('t2v', p.x + 520, p.y, {
    title: '数字人口播视频',
    text: script,
    videoModelPreset: 'seedance2',
    model: 'doubao-seedance-2-0-260128',
    duration: 8,
    resolution: '4K',
    w: 420,
  });
  state.links.push({ id: uid('link'), from: promptNode.id, to: videoNode.id });
  render();
  saveCanvas();
  setStatus('已创建数字人口播视频节点');
}

function runTalkingAgentWorkflow() {
  syncTalkingAgentFromBoard();
  if (!state.talkingAgent.rewrittenText && state.talkingAgent.originalText) rewriteTalkingScript();
  createTalkingSpeakingVideoNode();
}

function upsertPromptPreset(existing = null) {
  const category = existing?.category || (state.promptPresetFilter && state.promptPresetFilter !== 'all' ? state.promptPresetFilter : 'mine');
  const item = {
    id: existing?.id || uid('preset'),
    title: existing?.title || '新提示词模板',
    category,
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
  state.promptPresetFilter = category;
  savePromptPresets();
  renderMaterialBoard();
  setStatus(`已新增可编辑模板：${item.title}`);
}

function createPromptCategory() {
  const label = prompt('新增提示词板块名称', '新分类');
  if (!label?.trim()) return;
  const id = uid('cat');
  state.promptCategories = [...promptCategoryList(), { id, label: label.trim() }];
  state.promptPresetFilter = id;
  state.selectedPromptPresetId = '';
  savePromptCategories();
  renderMaterialBoard();
  setStatus(`已新增提示词板块：${label.trim()}`);
}

function movePromptCategory(fromId, toId) {
  if (!fromId || !toId || fromId === toId || fromId === 'all' || toId === 'all') return;
  const categories = [...promptCategoryList()];
  const from = categories.findIndex(item => item.id === fromId);
  const to = categories.findIndex(item => item.id === toId);
  if (from < 0 || to < 0) return;
  const [moved] = categories.splice(from, 1);
  categories.splice(to, 0, moved);
  const all = categories.find(item => item.id === 'all');
  state.promptCategories = all ? [all, ...categories.filter(item => item.id !== 'all')] : categories;
  savePromptCategories();
  renderMaterialBoard();
  setStatus('提示词板块顺序已调整');
}

function movePromptPreset(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return;
  const presets = [...state.promptPresets];
  const from = presets.findIndex(item => item.id === fromId);
  const to = presets.findIndex(item => item.id === toId);
  if (from < 0 || to < 0) return;
  const [moved] = presets.splice(from, 1);
  presets.splice(to, 0, moved);
  state.promptPresets = presets;
  savePromptPresets();
  renderMaterialBoard();
  setStatus('提示词模板顺序已调整');
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

function deletePromptCategory() {
  const categoryId = state.promptPresetFilter;
  if (!categoryId || categoryId === 'all') {
    setStatus('请先选中一个具体分类，再删除');
    return;
  }
  const category = promptCategoryList().find(item => item.id === categoryId);
  if (!category) return;
  const fallback = categoryId === 'mine'
    ? (promptCategoryList().find(item => !['all', categoryId].includes(item.id))?.id || 'all')
    : 'mine';
  const count = state.promptPresets.filter(item => item.category === categoryId).length;
  const message = count
    ? `删除分类「${category.label}」？该分类下 ${count} 条提示词会移动到「${categoryNameForPreset(fallback)}」。`
    : `删除分类「${category.label}」？`;
  if (!confirm(message)) return;
  state.promptCategories = promptCategoryList().filter(item => item.id !== categoryId);
  state.promptPresets.forEach(item => {
    if (item.category === categoryId) item.category = fallback === 'all' ? 'mine' : fallback;
  });
  state.promptPresetFilter = fallback === 'all' ? 'all' : fallback;
  state.selectedPromptPresetId = '';
  savePromptCategories();
  savePromptPresets();
  renderMaterialBoard();
  setStatus(`已删除提示词分类：${category.label}`);
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

function renameAsset(assetId) {
  const asset = state.assets.find(item => item.id === assetId);
  if (!asset) return false;
  const name = prompt('素材名称', asset.name || asset.title || '未命名素材');
  if (!name?.trim()) return false;
  asset.name = name.trim();
  asset.title = name.trim();
  renderAssets();
  if (['materials', 'assets'].includes(state.materialView)) renderMaterialBoard();
  saveCanvas();
  setStatus(`素材已改名：${asset.name}`);
  return true;
}

function deleteAsset(assetId) {
  const asset = state.assets.find(item => item.id === assetId);
  if (!asset) return false;
  if (!confirm(`删除素材「${asset.name || asset.title || '未命名素材'}」？`)) return false;
  state.assets = (state.assets || []).filter(item => item.id !== asset.id);
  renderAssets();
  if (['materials', 'assets'].includes(state.materialView)) renderMaterialBoard();
  saveCanvas();
  setStatus('素材已删除');
  return true;
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
  const mime = node.mime || (['video', 't2v', 'i2v'].includes(node.type) ? 'video/mp4' : ['audio'].includes(node.type) ? 'audio/mpeg' : 'image/png');
  const type = mime.startsWith('video/') || ['video', 't2v', 'i2v'].includes(node.type)
    ? 'video'
    : mime.startsWith('audio/') || node.type === 'audio'
      ? 'audio'
      : 'image';
  return {
    id: uid('asset'),
    sourceNodeId: node.id,
    type,
    url,
    mime,
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
  if (['materials', 'assets'].includes(state.materialView)) renderMaterialBoard();
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

function clearAssetDropHighlights() {
  document.querySelectorAll('[data-asset-filter]').forEach(btn => btn.classList.remove('drop-target'));
}

function assetFilterFromPoint(clientX, clientY) {
  const pointEl = document.elementFromPoint(clientX, clientY);
  const targetFilter = pointEl?.closest?.('[data-asset-filter]');
  if (targetFilter) return targetFilter;
  const library = pointEl?.closest?.('.asset-library-board');
  if (library) return library.querySelector('[data-asset-filter].active');
  if (pointEl?.closest?.('.leftbar')) return document.querySelector('[data-asset-filter].active');
  return null;
}

function highlightAssetFilterAt(clientX, clientY) {
  clearAssetDropHighlights();
  const filter = assetFilterFromPoint(clientX, clientY);
  if (filter) filter.classList.add('drop-target');
  return filter;
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
  return ['text', 'prompt', 'image', 'video', 'audio', 'script', 'result', 'world', 't2i', 'i2i', 't2v', 'i2v', 'director', 'compare', 'browser', 'loop', 'grid'].includes(type);
}

function canInput(type) {
  return ['image', 'video', 'audio', 't2i', 'i2i', 'i2v', 't2v', 'script', 'result', 'world', 'director', 'compare', 'browser', 'loop', 'grid'].includes(type);
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
  if (!state.linking && state.pendingLink?.point && state.pendingLink?.to) {
    const target = state.nodes.find(n => n.id === state.pendingLink.to);
    if (target) {
      drawTempLink(state.pendingLink.point, { x: target.x, y: target.y + 53 }, ['t2v', 'i2v'].includes(target.type));
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
        <strong>关系线</strong><br>
        从：${escapeHtml(from?.title || link.from)}<br>
        到：${escapeHtml(to?.title || link.to)}<br>
        按 Delete 可删除这条线
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

function clearPendingLink() {
  if (!state.pendingLink) return;
  state.pendingLink = null;
  renderLinks();
}

function hideMenu(options = {}) {
  els.menu.classList.add('hidden');
  if (!options.keepPendingLink) clearPendingLink();
}

function isAssetCandidateNode(node) {
  return !!(node && ['image', 'video', 't2i', 'i2i', 't2v', 'i2v'].includes(node.type) && (node.url || node.resultUrl));
}

function showMenu(x, y, options = {}) {
  els.menu.style.left = `${x}px`;
  els.menu.style.top = `${y}px`;
  if (!options.keepPendingLink) clearPendingLink();
  const selectedGroups = selectedGroupNodes();
  const hasGroupSelection = selectedGroups.length > 0;
  const hasLayoutSelection = selectedRealNodes().length > 1;
  const hasMultiSelection = state.selectedIds.length > 1 || hasGroupSelection;
  if (els.menuTitle) els.menuTitle.textContent = hasMultiSelection ? '选区操作' : options.keepPendingLink ? '连接到' : '添加节点';
  els.menu.querySelectorAll('.selected-menu').forEach(el => {
    el.classList.toggle('hidden', !hasMultiSelection);
  });
  els.menu.querySelectorAll('[data-menu^="layout-"]').forEach(el => {
    el.classList.toggle('disabled', !hasLayoutSelection);
  });
  const groupButton = els.menu.querySelector('[data-menu="group"]');
  if (groupButton) groupButton.textContent = hasGroupSelection ? '解组' : '打组';
  const menuNode = state.nodes.find(n => n.id === state.menuNodeId);
  els.menu.querySelectorAll('.image-node-menu').forEach(el => {
    el.classList.toggle('hidden', !isAssetCandidateNode(menuNode));
  });
  els.menu.classList.remove('hidden');
  renderLinks();
}

function hotboxPoint() {
  const rect = els.stage.getBoundingClientRect();
  return screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

function showHotbox() {
  if (!els.hotbox) return;
  els.hotbox.classList.remove('hidden');
  setStatus('空格热键盘：松开空格关闭，点击可快速创建节点');
}

function hideHotbox() {
  els.hotbox?.classList.add('hidden');
}

function executeMenuAction(type, point = state.menuPoint) {
  let created = null;
  if (type === 'arrange') {
    arrangeSelectedNodes();
    return null;
  }
  if (type === 'layout-grid' || type === 'layout-horizontal' || type === 'layout-vertical') {
    layoutSelectedNodes(type.replace('layout-', ''));
    return null;
  }
  if (type === 'group') {
    toggleGroupSelection();
    return null;
  }
  if (type === 'add-asset') {
    openAssetDialog(state.menuNodeId || state.selectedId);
    return null;
  }
  if (type === 'reverse-image') {
    createReversePromptNode('image');
    return null;
  }
  if (type === 'reverse-video') {
    createReversePromptNode('video');
    return null;
  }
  if (type === 'upload') {
    state.menuPoint = point;
    els.fileInput.click();
    return null;
  }
  if (type === 'upload-image') {
    state.menuPoint = point;
    els.imageInput.click();
    return null;
  }
  if (type === 'upload-video') {
    state.menuPoint = point;
    els.videoInput.click();
    return null;
  }
  if (type === 'upload-audio') {
    state.menuPoint = point;
    els.audioInput.click();
    return null;
  }
  created = addNode(type, point.x, point.y, { text: type === 'loop' ? DETAIL_PAGE_LOOP_PROMPT : type.includes('2') ? '生成节点' : '' });
  if (state.pendingLink) connectPendingTo(created.id);
  return created;
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

function videoMetaForFile(file) {
  if (!file?.type?.startsWith('video/')) return Promise.resolve({});
  return new Promise(resolve => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    const finish = meta => {
      URL.revokeObjectURL(objectUrl);
      resolve(meta);
    };
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const ratio = video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : 0;
      finish({
        imageRatio: ratio,
        naturalWidth: video.videoWidth || 0,
        naturalHeight: video.videoHeight || 0,
      });
    };
    video.onerror = () => finish({});
    video.src = objectUrl;
  });
}

function mediaMetaForFile(file) {
  if (file?.type?.startsWith('image/')) return imageMetaForFile(file);
  if (file?.type?.startsWith('video/')) return videoMetaForFile(file);
  return Promise.resolve({});
}

async function uploadFiles(files, point) {
  if (!files.length) return;
  const sourceFiles = [...files];
  const metas = await Promise.all(sourceFiles.map(file => mediaMetaForFile(file)));
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

async function replaceImageForNode(nodeId, file) {
  const node = state.nodes.find(n => n.id === nodeId);
  if (!node || node.type !== 'image') {
    setStatus('请选择一个图片节点再替换');
    return;
  }
  if (!file?.type?.startsWith('image/')) {
    setStatus('请选择图片文件');
    return;
  }
  const meta = await imageMetaForFile(file);
  const form = new FormData();
  form.append('files', file);
  setStatus('正在替换照片...');
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  const data = await readJsonResponse(res);
  const uploaded = data.files?.[0];
  if (!uploaded?.url) {
    setStatus(data.error || '替换失败：没有拿到上传地址');
    return;
  }
  node.url = uploaded.url;
  node.mime = uploaded.mime || file.type || node.mime || '';
  node.title = uploaded.name || file.name || node.title;
  node.imageRatio = meta.imageRatio || node.imageRatio || 0;
  node.naturalWidth = meta.naturalWidth || 0;
  node.naturalHeight = meta.naturalHeight || 0;
  if (node.imageRatio) node.h = imageNodeHeight(node);
  state.replaceImageNodeId = '';
  render();
  saveCanvas();
  setStatus('照片已替换');
}

async function uploadFilesToAssets(files, category = 'object') {
  if (!files.length) return;
  const sourceFiles = [...files];
  const metas = await Promise.all(sourceFiles.map(file => mediaMetaForFile(file)));
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
    const source = state.nodes.find(n => n.id === targetId);
    if (!source || !canOutput(source.type)) return;
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
  if (node.type === 'grid') return node.gridItems?.[0]?.url || '';
  if (node.resultUrl || node.url) return node.resultUrl || node.url;
  return referencesForNode(node.id).find(ref => ref.kind === 'image')?.url || '';
}

function flipImageNode(nodeId, direction = 'horizontal') {
  const node = state.nodes.find(n => n.id === nodeId);
  if (!node || !['image', 't2i', 'i2i', 'result'].includes(node.type) || !imageUrlForNode(node)) {
    setStatus('请先选择有图片的节点再反转');
    return;
  }
  if (direction === 'vertical') {
    node.flipY = !node.flipY;
  } else {
    node.flipX = !node.flipX;
  }
  state.selectedId = node.id;
  state.selectedIds = [node.id];
  render();
  saveCanvas();
  setStatus(direction === 'vertical' ? '已垂直翻转图片' : '已水平翻转图片');
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
    const startX = source.x + (source.w || 240) + 80;
    const startY = source.y;
    const items = [];
    for (let row = 0; row < side; row += 1) {
      for (let col = 0; col < side; col += 1) {
        const canvas = document.createElement('canvas');
        canvas.width = cropW;
        canvas.height = cropH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, col * cropW, row * cropH, cropW, cropH, 0, 0, cropW, cropH);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        items.push({
          id: uid('grid_item'),
          title: `${source.title || '图片'}_${row + 1}-${col + 1}`,
          url: dataUrl,
          mime: 'image/jpeg',
          naturalWidth: cropW,
          naturalHeight: cropH,
        });
      }
    }
    const gridW = Math.max(520, Math.min(860, Math.round((source.w || 420) * 1.35)));
    const ratio = cropW / cropH;
    const gridNode = addNode('grid', startX, startY, {
      title: '分镜格子',
      gridItems: items,
      gridLayout: 'grid',
      gridColumns: side,
      gridCellRatio: ratio,
      imageRatio: ratio,
      naturalWidth: cropW * side,
      naturalHeight: cropH * side,
      w: gridW,
      h: 28 + Math.round(gridW / ratio),
    });
    state.selectedIds = [gridNode.id];
    state.selectedId = gridNode.id;
    render();
    saveCanvas();
    setStatus(`已生成 ${grid} 宫格分镜，可编辑排序或批量下载`);
  } catch (err) {
    setStatus(`裁切失败：${err.message}`);
  }
}

function setGridLayout(nodeId, layout = 'grid') {
  const node = state.nodes.find(n => n.id === nodeId);
  if (!node || node.type !== 'grid') return;
  node.gridLayout = layout;
  const count = Math.max(1, node.gridItems?.length || 1);
  node.gridColumns = layout === 'horizontal' ? count : layout === 'vertical' ? 1 : Math.max(1, Math.round(Math.sqrt(count)));
  node.imageRatio = gridRatioForNode(node);
  node.h = imageNodeHeight(node);
  render();
  saveCanvas();
  setStatus(layout === 'horizontal' ? '已切换水平布局' : layout === 'vertical' ? '已切换垂直布局' : '已切换宫格布局');
}

function toggleGridEditing(nodeId) {
  const node = state.nodes.find(n => n.id === nodeId);
  if (!node || node.type !== 'grid') return;
  node.gridEditing = !node.gridEditing;
  state.selectedId = node.id;
  state.selectedIds = [node.id];
  render();
  saveCanvas();
  setStatus(node.gridEditing ? '分镜编辑已开启：可拖拽排序、拖出或替换格子' : '分镜编辑已关闭');
}

function downloadGridItems(nodeId) {
  const node = state.nodes.find(n => n.id === nodeId);
  if (!node || node.type !== 'grid' || !node.gridItems?.length) return;
  node.gridItems.forEach((item, index) => {
    window.setTimeout(() => {
      const a = document.createElement('a');
      a.href = item.url;
      a.download = `${node.title || 'grid'}_${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }, index * 120);
  });
  setStatus(`正在批量下载 ${node.gridItems.length} 张分镜`);
}

function splitGridNode(nodeId) {
  const node = state.nodes.find(n => n.id === nodeId);
  if (!node || node.type !== 'grid' || !node.gridItems?.length) return;
  const cols = gridLayoutColumns(node);
  const cellRatio = Number(node.gridItems[0]?.naturalWidth || 16) / Math.max(1, Number(node.gridItems[0]?.naturalHeight || 9));
  const nodeW = Math.max(140, Math.min(240, Math.round((node.w || 680) / Math.max(1, cols))));
  const gap = 18;
  const created = [];
  node.gridItems.forEach((item, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const image = addNode('image', node.x + col * (nodeW + gap), node.y + row * (Math.round(nodeW / cellRatio) + 48), {
      title: item.title || `${node.title || '分镜'}_${index + 1}`,
      url: item.url,
      mime: item.mime || 'image/jpeg',
      role: 'grid_crop',
      w: nodeW,
      imageRatio: cellRatio,
      naturalWidth: item.naturalWidth || 0,
      naturalHeight: item.naturalHeight || 0,
    });
    created.push(image.id);
  });
  state.selectedIds = created;
  state.selectedId = created[0] || node.id;
  render();
  saveCanvas();
  setStatus(`已拆分 ${created.length} 张分镜到画布`);
}

function clearGridNode(nodeId) {
  const node = state.nodes.find(n => n.id === nodeId);
  if (!node || node.type !== 'grid') return;
  node.gridItems = [];
  render();
  saveCanvas();
  setStatus('分镜格子已清空');
}

function replaceGridCellFromNode(gridId, cellIndex, sourceNodeId) {
  const grid = state.nodes.find(n => n.id === gridId);
  const source = state.nodes.find(n => n.id === sourceNodeId);
  const url = imageUrlForNode(source);
  if (!grid || grid.type !== 'grid' || !url || cellIndex < 0) return false;
  grid.gridItems[cellIndex] = {
    id: uid('grid_item'),
    title: source.title || `图片${cellIndex + 1}`,
    url,
    mime: source.mime || 'image/png',
    naturalWidth: source.naturalWidth || 0,
    naturalHeight: source.naturalHeight || 0,
  };
  render();
  saveCanvas();
  setStatus(`已替换第 ${cellIndex + 1} 格`);
  return true;
}

function gridCellFromPoint(clientX, clientY, ignoreEl = null) {
  const previousPointerEvents = ignoreEl?.style?.pointerEvents;
  if (ignoreEl) ignoreEl.style.pointerEvents = 'none';
  const cell = document.elementFromPoint(clientX, clientY)?.closest?.('[data-grid-cell]');
  if (ignoreEl) ignoreEl.style.pointerEvents = previousPointerEvents || '';
  if (!cell) return null;
  const nodeEl = cell.closest('.node');
  const node = state.nodes.find(n => n.id === nodeEl?.dataset.id);
  if (!node || node.type !== 'grid') return null;
  return { nodeId: node.id, index: Number(cell.dataset.gridCell) };
}

function createImageNodeFromGridCell(gridId, cellIndex, point) {
  const grid = state.nodes.find(n => n.id === gridId);
  const item = grid?.gridItems?.[cellIndex];
  if (!grid || !item?.url) return;
  const ratio = item.naturalWidth && item.naturalHeight ? item.naturalWidth / item.naturalHeight : imageRatioForNode(grid);
  addNode('image', point.x, point.y, {
    title: item.title || `${grid.title || '分镜'}_${cellIndex + 1}`,
    url: item.url,
    mime: item.mime || 'image/jpeg',
    role: 'grid_crop',
    w: 220,
    imageRatio: ratio,
    naturalWidth: item.naturalWidth || 0,
    naturalHeight: item.naturalHeight || 0,
  });
  setStatus('已把分镜拖出为图片节点');
}

function createGridFromSelectedImages(layout = 'grid') {
  const images = state.nodes
    .filter(n => state.selectedIds.includes(n.id) && imageUrlForNode(n))
    .map(n => ({
      id: uid('grid_item'),
      title: n.title || typeNames[n.type] || '图片',
      url: imageUrlForNode(n),
      mime: n.mime || 'image/png',
      naturalWidth: n.naturalWidth || 0,
      naturalHeight: n.naturalHeight || 0,
    }));
  if (images.length < 2) {
    setStatus('请先框选至少两张图片再布局');
    return;
  }
  const bounds = boundsForNodes(state.nodes.filter(n => state.selectedIds.includes(n.id)));
  const firstRatio = images[0].naturalWidth && images[0].naturalHeight ? images[0].naturalWidth / images[0].naturalHeight : 16 / 9;
  const cols = layout === 'horizontal' ? images.length : layout === 'vertical' ? 1 : Math.ceil(Math.sqrt(images.length));
  const rows = Math.ceil(images.length / cols);
  const ratio = layout === 'horizontal' ? firstRatio * images.length : layout === 'vertical' ? firstRatio / images.length : (cols / rows) * firstRatio;
  const grid = addNode('grid', bounds.minX, bounds.maxY + 46, {
    title: '布局合成',
    gridItems: images,
    gridLayout: layout,
    gridColumns: cols,
    imageRatio: ratio,
    w: Math.max(520, Math.min(900, bounds.w)),
  });
  grid.h = imageNodeHeight(grid);
  state.selectedIds = [grid.id];
  state.selectedId = grid.id;
  render();
  saveCanvas();
  setStatus(`已把 ${images.length} 张图片合成布局节点`);
}

function openImageAssistPanel(nodeId, mode = 'angle') {
  const node = state.nodes.find(n => n.id === nodeId);
  if (!node || !imageUrlForNode(node)) {
    setStatus('请先选择有图片的节点');
    return;
  }
  document.querySelector('.image-assist-panel')?.remove();
  const isLight = mode === 'light';
  const panel = document.createElement('div');
  panel.className = 'image-assist-panel';
  panel.dataset.nodeId = node.id;
  panel.dataset.assistMode = mode;
  panel.innerHTML = isLight ? `
    <div class="assist-head"><strong>打光编辑器</strong><button type="button" data-close-assist>×</button></div>
    <div class="assist-body light">
      <div class="assist-preview light-preview" data-assist-preview><img data-assist-image src="${escapeAttr(imageUrlForNode(node))}" alt=""><span data-assist-light-dot></span></div>
      <div class="assist-controls">
        <label>主光源</label>
        <div class="assist-button-grid">
          ${[
            ['左侧', 180, 0], ['顶部', 270, 65], ['右侧', 0, 0],
            ['前方', 270, 0], ['底部', 90, -55], ['后方', 90, 0],
          ].map(([label, azimuth, height]) => `<button type="button" data-light-preset="${label}" data-azimuth="${azimuth}" data-height="${height}">${label}</button>`).join('')}
        </div>
        <label>水平环绕 <input data-assist-control="lightAzimuth" type="range" min="0" max="360" value="${Number(node.lightAzimuth ?? 270)}"><b data-assist-output="lightAzimuth">0°</b></label>
        <label>高度 <input data-assist-control="lightHeight" type="range" min="-90" max="90" value="${Number(node.lightHeight ?? 0)}"><b data-assist-output="lightHeight">0°</b></label>
        <label>强度 <input data-assist-control="lightIntensity" type="range" min="0" max="100" value="${Number(node.lightIntensity ?? 30)}"><b data-assist-output="lightIntensity">30%</b></label>
        <label>灯光颜色 <input data-assist-control="lightColor" type="color" value="${escapeAttr(node.lightColor || '#ffffff')}"><b data-assist-output="lightColor">${escapeHtml(node.lightColor || '#ffffff')}</b></label>
      </div>
      <button type="button" class="assist-apply" data-assist-apply>执行</button>
    </div>
  ` : `
    <div class="assist-head"><strong>多角度编辑器</strong><button type="button" data-close-assist>×</button></div>
    <div class="assist-body angle">
      <div class="assist-presets">
        ${[
          ['自定义', 0, 0, 1], ['鱼眼视角', -24, 8, 1.18], ['倾斜视角', -18, -12, 1.05],
          ['正面俯拍', 0, 28, .92], ['正面仰拍', 0, -24, 1.08], ['全景俯拍', 0, 42, .72], ['背面视角', 180, 0, 1],
        ].map(([label, yaw, pitch, zoom]) => `<button type="button" data-angle-preset="${label}" data-yaw="${yaw}" data-pitch="${pitch}" data-zoom="${zoom}">${label}</button>`).join('')}
      </div>
      <div class="assist-orbit" data-assist-preview><img data-assist-image src="${escapeAttr(imageUrlForNode(node))}" alt=""><i></i></div>
      <div class="assist-controls">
        <label>水平环绕 <input data-assist-control="angleYaw" type="range" min="-180" max="180" value="${Number(node.angleYaw || 0)}"><b data-assist-output="angleYaw">0°</b></label>
        <label>垂直俯仰 <input data-assist-control="anglePitch" type="range" min="-90" max="90" value="${Number(node.anglePitch || 0)}"><b data-assist-output="anglePitch">0°</b></label>
        <label>景别缩放 <input data-assist-control="angleZoom" type="range" min="55" max="185" value="${Math.round(Number(node.angleZoom || 1) * 100)}"><b data-assist-output="angleZoom">中景</b></label>
      </div>
      <button type="button" class="assist-apply" data-assist-apply>执行</button>
    </div>
  `;
  document.body.appendChild(panel);
  panel.querySelector('[data-close-assist]')?.addEventListener('click', () => panel.remove());
  const update = () => updateAssistPreview(panel);
  panel.querySelectorAll('[data-assist-control]').forEach(input => input.addEventListener('input', update));
  panel.querySelectorAll('[data-angle-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      panel.querySelector('[data-assist-control="angleYaw"]').value = btn.dataset.yaw;
      panel.querySelector('[data-assist-control="anglePitch"]').value = btn.dataset.pitch;
      panel.querySelector('[data-assist-control="angleZoom"]').value = Math.round(Number(btn.dataset.zoom || 1) * 100);
      panel.querySelectorAll('[data-angle-preset]').forEach(item => item.classList.remove('active'));
      btn.classList.add('active');
      update();
    });
  });
  panel.querySelectorAll('[data-light-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      panel.querySelector('[data-assist-control="lightAzimuth"]').value = btn.dataset.azimuth;
      panel.querySelector('[data-assist-control="lightHeight"]').value = btn.dataset.height;
      panel.querySelectorAll('[data-light-preset]').forEach(item => item.classList.remove('active'));
      btn.classList.add('active');
      update();
    });
  });
  panel.querySelector('[data-assist-apply]')?.addEventListener('click', () => {
    const target = state.nodes.find(n => n.id === panel.dataset.nodeId);
    if (!target) return;
    if (panel.dataset.assistMode === 'light') {
      target.lightAzimuth = Number(panel.querySelector('[data-assist-control="lightAzimuth"]')?.value || 270);
      target.lightHeight = Number(panel.querySelector('[data-assist-control="lightHeight"]')?.value || 0);
      target.lightIntensity = Number(panel.querySelector('[data-assist-control="lightIntensity"]')?.value || 30);
      target.lightColor = panel.querySelector('[data-assist-control="lightColor"]')?.value || '#ffffff';
    } else {
      target.angleYaw = Number(panel.querySelector('[data-assist-control="angleYaw"]')?.value || 0);
      target.anglePitch = Number(panel.querySelector('[data-assist-control="anglePitch"]')?.value || 0);
      target.angleZoom = Number(panel.querySelector('[data-assist-control="angleZoom"]')?.value || 100) / 100;
    }
    render();
    saveCanvas();
    panel.remove();
    setStatus(panel.dataset.assistMode === 'light' ? '打光参数已应用到图片节点' : '角度参数已应用到图片节点');
  });
  update();
}

function updateAssistPreview(panel) {
  const image = panel.querySelector('[data-assist-image]');
  const preview = panel.querySelector('[data-assist-preview]');
  if (!image || !preview) return;
  if (panel.dataset.assistMode === 'light') {
    const azimuth = Number(panel.querySelector('[data-assist-control="lightAzimuth"]')?.value || 270);
    const height = Number(panel.querySelector('[data-assist-control="lightHeight"]')?.value || 0);
    const intensity = Number(panel.querySelector('[data-assist-control="lightIntensity"]')?.value || 30);
    const color = panel.querySelector('[data-assist-control="lightColor"]')?.value || '#ffffff';
    const rad = (azimuth * Math.PI) / 180;
    const lightX = 50 + Math.cos(rad) * 42;
    const lightY = 50 + Math.sin(rad) * 42 - height * .28;
    preview.style.setProperty('--light-x', `${Math.max(0, Math.min(100, lightX))}%`);
    preview.style.setProperty('--light-y', `${Math.max(0, Math.min(100, lightY))}%`);
    preview.style.setProperty('--light-color', hexToRgba(color, Math.min(.82, .22 + intensity / 120)));
    preview.style.setProperty('--light-opacity', String(Math.min(.9, .18 + intensity / 110)));
    image.style.filter = `brightness(${(0.72 + intensity / 120).toFixed(2)}) contrast(${(1 + intensity / 420).toFixed(2)})`;
    image.style.boxShadow = `${Math.round(Math.cos(rad) * 12)}px ${Math.round(Math.sin(rad) * 12)}px ${Math.round(12 + intensity / 3)}px ${hexToRgba(color, Math.min(.65, .18 + intensity / 130))}`;
    const dot = panel.querySelector('[data-assist-light-dot]');
    if (dot) {
      dot.style.left = `${Math.max(0, Math.min(100, lightX))}%`;
      dot.style.top = `${Math.max(0, Math.min(100, lightY))}%`;
      dot.style.background = color;
    }
    panel.querySelector('[data-assist-output="lightAzimuth"]').textContent = `${azimuth}°`;
    panel.querySelector('[data-assist-output="lightHeight"]').textContent = `${height}°`;
    panel.querySelector('[data-assist-output="lightIntensity"]').textContent = `${intensity}%`;
    panel.querySelector('[data-assist-output="lightColor"]').textContent = color.toUpperCase();
    return;
  }
  const yaw = Number(panel.querySelector('[data-assist-control="angleYaw"]')?.value || 0);
  const pitch = Number(panel.querySelector('[data-assist-control="anglePitch"]')?.value || 0);
  const zoom = Number(panel.querySelector('[data-assist-control="angleZoom"]')?.value || 100) / 100;
  image.style.transform = `perspective(680px) rotateX(${pitch}deg) rotateY(${yaw}deg) scale(${zoom})`;
  preview.style.setProperty('--orbit-yaw', `${yaw}deg`);
  preview.style.setProperty('--orbit-pitch', `${pitch}deg`);
  panel.querySelector('[data-assist-output="angleYaw"]').textContent = `${yaw}°`;
  panel.querySelector('[data-assist-output="anglePitch"]').textContent = `${pitch}°`;
  panel.querySelector('[data-assist-output="angleZoom"]').textContent = zoom < .85 ? '远景' : zoom > 1.18 ? '近景' : '中景';
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

function moveAnnotationItem(item, dx, dy) {
  if (!item) return;
  if (item.type === 'text') {
    item.x = Math.max(0, Math.min(100, Number(item.x || 0) + dx));
    item.y = Math.max(0, Math.min(100, Number(item.y || 0) + dy));
    return;
  }
  if (item.type === 'textBox') {
    const width = Math.max(1, Number(item.w || 10));
    const height = Math.max(1, Number(item.h || 6));
    item.x = Math.max(0, Math.min(100 - width, Number(item.x || 0) + dx));
    item.y = Math.max(0, Math.min(100 - height, Number(item.y || 0) + dy));
    return;
  }
  if (Array.isArray(item.points)) {
    item.points = item.points.map(point => ({
      x: Math.max(0, Math.min(100, Number(point.x || 0) + dx)),
      y: Math.max(0, Math.min(100, Number(point.y || 0) + dy)),
    }));
  }
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
    ? state.nodes.filter(n => linkedSourceIds.includes(n.id) && !n.disabled)
    : state.nodes;
  const refs = sourcePool
    .filter(n => !n.disabled && ['image', 'video', 'audio'].includes(n.type) && n.url)
    .map(n => ({ kind: n.type, url: absoluteUrl(n.url), role: n.role }));
  if (selected && !selected.disabled && ['image', 'video', 'audio'].includes(selected.type) && selected.url) {
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
  if ((node.videoModelPreset || 'seedance2') !== 'seedance2') {
    node.taskStatus = 'failed';
    node.progressPercent = 100;
    node.progressText = `${node.videoModelPreset === 'kling' ? '可灵备用' : 'Seedance mini'} 接口尚未配置，请先在设置里补对应 API。`;
    render();
    saveCanvas();
    return;
  }
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
    generateAudio: false,
    watermark: false,
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
  const ownPrompt = (node.text || '').trim();
  const prompt = node.type === 'i2i' ? (ownPrompt || linkedPrompt) : (linkedPrompt || ownPrompt);
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

function loopPromptForIndex(basePrompt, index, total) {
  const modules = [
    '详情页首屏主视觉，主体完整清晰，背景干净高级，适合做商品或人物展示开头图。',
    '核心卖点近景图，突出材质、五官、服装或产品结构细节，真实微距质感。',
    '场景化使用图，把主体放到真实生活或商业使用环境中，保持主体特征不变。',
    '质感细节特写图，强调纹理、边缘、反光、手感和高级光影。',
    '横幅氛围图，主体与环境形成空间层次，留出详情页排版空间，不生成文字。',
    '竖版海报图，主体稳定居中，适合移动端详情页长图模块。',
    '45度商业摄影图，画面有轻微透视和真实阴影，适合展示体积和结构。',
    '组合展示图，保持主体一致，呈现不同角度或不同使用状态，画面干净规整。',
  ];
  const modulePrompt = modules[index % modules.length];
  return `${basePrompt.trim()}\n\n第 ${index + 1}/${total} 张详情页分图：${modulePrompt}`;
}

async function runLoopNode(nodeId) {
  const loop = state.nodes.find(n => n.id === nodeId);
  if (!loop || loop.type !== 'loop') return;
  const refs = referencesForNode(loop.id).filter(ref => ref.kind === 'image' && ref.url);
  const linkedPrompt = linkedPromptText(loop.id);
  const basePrompt = (linkedPrompt || loop.text || DETAIL_PAGE_LOOP_PROMPT).trim();
  const count = Math.max(1, Math.min(16, Number(loop.loopCount || 8)));
  const targetType = refs.length ? 'i2i' : 't2i';
  loop.taskStatus = 'running';
  loop.progressText = `正在创建 ${count} 个并发任务...`;
  loop.progressPercent = 8;
  render();
  saveCanvas();

  const cols = Math.min(4, count);
  const nodeW = 360;
  const nodeGapX = 36;
  const nodeGapY = 330;
  const startX = loop.x + (loop.w || 620) + 54;
  const startY = loop.y;
  const created = [];

  for (let index = 0; index < count; index += 1) {
    const x = startX + (index % cols) * (nodeW + nodeGapX);
    const y = startY + Math.floor(index / cols) * nodeGapY;
    const node = addNode(targetType, x, y, {
      title: `详情页图 ${index + 1}`,
      text: loopPromptForIndex(basePrompt, index, count),
      model: loop.model || 'image2',
      aspect: loop.aspect || '16:9',
      quality: loop.quality || '2k',
      imageCount: 1,
      inlineReferences: refs,
      w: nodeW,
      h: 250,
      panelW: 420,
      panelH: 180,
    });
    node.refOrder = refs.map(ref => ref.nodeId).filter(Boolean);
    created.push(node);
  }

  state.selectedId = loop.id;
  state.selectedIds = [loop.id];
  loop.progressText = `已创建 ${created.length} 个任务，正在并发生成...`;
  loop.progressPercent = 18;
  render();
  saveCanvas();

  let finished = 0;
  const tasks = created.map(async node => {
    await generateImageFromNode(node.id);
    finished += 1;
    const latestLoop = state.nodes.find(n => n.id === loop.id);
    if (latestLoop) {
      latestLoop.progressPercent = Math.round(18 + (finished / created.length) * 82);
      latestLoop.progressText = `并发生成中：${finished}/${created.length}`;
      updateNodeProgressDom(latestLoop);
    }
  });
  const results = await Promise.allSettled(tasks);
  const failed = results.filter(item => item.status === 'rejected').length;
  const latestLoop = state.nodes.find(n => n.id === loop.id);
  if (latestLoop) {
    latestLoop.taskStatus = failed ? 'failed' : 'succeeded';
    latestLoop.progressPercent = 100;
    latestLoop.progressText = failed ? `完成，但有 ${failed} 个任务异常` : `已完成 ${created.length} 张详情页图`;
  }
  render();
  saveCanvas();
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
  return sourceIds
    .map(id => state.nodes.find(n => n.id === id && !n.disabled && ['prompt', 'text'].includes(n.type)))
    .filter(Boolean)
    .map(node => String(node.text || '').trim())
    .filter(Boolean)
    .join('\n\n');
}

function referencesForNode(nodeId) {
  const node = state.nodes.find(n => n.id === nodeId);
  const inlineRefs = (Array.isArray(node?.inlineReferences) ? node.inlineReferences : [])
    .filter(ref => ref?.url)
    .map(ref => ({
      kind: ref.kind || 'image',
      url: absoluteUrl(ref.url),
      role: ref.role || 'reference_image',
      nodeId: ref.nodeId || '',
    }));
  const sourceIds = state.links.filter(l => l.to === nodeId).map(l => l.from);
  if (!sourceIds.length) return inlineRefs;
  const pool = state.nodes.filter(n => sourceIds.includes(n.id) && !n.disabled);
  const sorted = [...pool].sort((a, b) => {
    const ai = node?.refOrder?.indexOf(a.id) ?? -1;
    const bi = node?.refOrder?.indexOf(b.id) ?? -1;
    if (ai === -1 && bi === -1) return sourceIds.indexOf(a.id) - sourceIds.indexOf(b.id);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  const linkedRefs = sorted
    .map(referenceFromNode)
    .filter(Boolean);
  const refs = [...inlineRefs, ...linkedRefs];
  const seen = new Set();
  return refs.filter(ref => {
    const key = ref.nodeId || ref.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  if (info.error === 'query_failed') return '需余额接口';
  return '不可查';
}

async function refreshBalances() {
  if (!els.imageBalance && !els.videoBalance) return;
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
  const multiResolution = document.querySelector('#multiResolution');
  const multiRatio = document.querySelector('#multiRatio');
  const multiDuration = document.querySelector('#multiDuration');
  const multiWatermark = document.querySelector('#multiWatermark');
  const multiReturnLastFrame = document.querySelector('#multiReturnLastFrame');
  const multiWebSearch = document.querySelector('#multiWebSearch');
  if (multiResolution) multiResolution.value = cfg.apis.multimodal.resolution || '4K';
  if (multiRatio) multiRatio.value = cfg.apis.multimodal.ratio || '16:9';
  if (multiDuration) multiDuration.value = String(cfg.apis.multimodal.duration || 8);
  if (multiWatermark) multiWatermark.checked = !!cfg.apis.multimodal.watermark;
  if (multiReturnLastFrame) multiReturnLastFrame.checked = !!cfg.apis.multimodal.returnLastFrame;
  if (multiWebSearch) multiWebSearch.checked = !!cfg.apis.multimodal.webSearch;
  document.querySelector('#agentBaseUrl').value = cfg.apis.agent.baseUrl || 'https://api.openai.com/v1';
  document.querySelector('#agentApiKey').value = cfg.apis.agent.apiKey || '';
  document.querySelector('#agentModelName').value = cfg.apis.agent.modelName || 'gpt-4.1-mini';
  document.querySelector('#agentVisionModel').value = cfg.apis.agent.visionModel || 'gpt-4.1-mini';
  document.querySelector('#agentPromptModel').value = cfg.apis.agent.promptModel || 'deepseek-chat';
  if (els.agentModel) els.agentModel.value = cfg.defaults.agentProvider || 'doubao';
  applyVendorSettingsToUI(cfg);
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

function vendorInputId(vendor, field) {
  const name = vendor === 'deepseek' ? 'Deepseek' : vendor.charAt(0).toUpperCase() + vendor.slice(1);
  const suffix = field === 'modelName' ? 'Model' : field.charAt(0).toUpperCase() + field.slice(1);
  return `#vendor${name}${suffix}`;
}

function applyVendorSettingsToUI(cfg) {
  for (const [vendor, defaults] of Object.entries(LLM_VENDOR_DEFAULTS)) {
    const item = cfg.apis.llmVendors?.[vendor] || defaults;
    for (const field of ['baseUrl', 'apiKey', 'modelName', 'note']) {
      const input = document.querySelector(vendorInputId(vendor, field));
      if (input) input.value = item[field] || '';
    }
  }
}

function collectVendorSettingsFromUI(cfg) {
  cfg.apis.llmVendors ||= {};
  for (const [vendor, defaults] of Object.entries(LLM_VENDOR_DEFAULTS)) {
    const item = { ...defaults };
    for (const field of ['baseUrl', 'apiKey', 'modelName', 'note']) {
      const input = document.querySelector(vendorInputId(vendor, field));
      item[field] = input?.value?.trim?.() || (field === 'apiKey' ? '' : defaults[field]);
    }
    cfg.apis.llmVendors[vendor] = item;
  }
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
  cfg.apis.multimodal.resolution = document.querySelector('#multiResolution')?.value || cfg.apis.multimodal.resolution || '4K';
  cfg.apis.multimodal.ratio = document.querySelector('#multiRatio')?.value || cfg.apis.multimodal.ratio || '16:9';
  cfg.apis.multimodal.duration = Number(document.querySelector('#multiDuration')?.value || cfg.apis.multimodal.duration || 8);
  cfg.apis.multimodal.watermark = false;
  cfg.apis.multimodal.returnLastFrame = false;
  cfg.apis.multimodal.webSearch = false;
  cfg.apis.agent.baseUrl = document.querySelector('#agentBaseUrl').value.trim() || 'https://api.openai.com/v1';
  cfg.apis.agent.apiKey = document.querySelector('#agentApiKey').value.trim();
  cfg.apis.agent.modelName = document.querySelector('#agentModelName').value.trim() || 'gpt-4.1-mini';
  cfg.apis.agent.visionModel = document.querySelector('#agentVisionModel').value.trim() || cfg.apis.agent.modelName;
  cfg.apis.agent.promptModel = document.querySelector('#agentPromptModel').value.trim() || 'deepseek-chat';
  collectVendorSettingsFromUI(cfg);
  cfg.defaults.agentProvider = els.agentModel?.value || 'doubao';
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
    body: JSON.stringify(configWithoutSecrets(cfg)),
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
  let draggingAnnotation = null;
  let draggingCompare = null;
  let last = { x: 0, y: 0 };

  els.gridSettingsToggle?.addEventListener('click', event => {
    event.stopPropagation();
    els.gridSettingsPanel?.classList.toggle('hidden');
  });
  els.themeModeToggle?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    els.themeModeMenu?.classList.toggle('hidden');
    els.themeModeToggle.classList.toggle('active', !els.themeModeMenu?.classList.contains('hidden'));
  });
  els.themeModeMenu?.addEventListener('click', event => {
    const btn = event.target.closest('[data-theme-mode]');
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    applyThemeMode(btn.dataset.themeMode);
    els.themeModeMenu.classList.add('hidden');
    els.themeModeToggle?.classList.remove('active');
    setStatus(`已切换${btn.textContent.trim()}`);
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
  els.agentHistoryToggle?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    renderAgentHistoryPanel();
    els.agentHistoryPanel?.classList.toggle('hidden');
  });
  els.agentClearLog?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    if (els.agentLog) els.agentLog.innerHTML = '';
    els.agentHistoryPanel?.classList.add('hidden');
    setStatus('智能体输出已清空');
  });
  els.agentLog?.addEventListener('click', async event => {
    const btn = event.target.closest('[data-agent-log-copy]');
    if (!btn) return;
    const text = btn.closest('.agent-log-item')?.querySelector('p')?.innerText || '';
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setStatus('已复制智能体输出');
    } catch (err) {
      setStatus(`复制失败：${err.message}`);
    }
  });
  els.agentHistoryPanel?.addEventListener('click', event => {
    const restore = event.target.closest('[data-agent-history-restore]');
    if (!restore) return;
    restoreAgentHistory(restore.dataset.agentHistoryRestore);
  });
  els.agentRefs?.addEventListener('click', event => {
    const btn = event.target.closest('[data-agent-ref-remove]');
    if (!btn) return;
    state.agentRefs.splice(Number(btn.dataset.agentRefRemove), 1);
    renderAgentRefs();
    recordAgentHistory('移除参考图');
  });
  els.agentRefs?.addEventListener('dragstart', event => {
    const item = event.target.closest('[data-agent-ref-index]');
    if (!item) return;
    event.dataTransfer.setData('application/x-agent-ref-index', item.dataset.agentRefIndex);
    event.dataTransfer.effectAllowed = 'move';
  });
  els.agentRefs?.addEventListener('dragover', event => {
    const types = [...(event.dataTransfer?.types || [])];
    if (!types.includes('application/x-agent-ref-index') && !types.includes('application/x-ai-canvas-node')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = types.includes('application/x-ai-canvas-node') ? 'copy' : 'move';
  });
  els.agentRefs?.addEventListener('drop', event => {
    const nodeId = event.dataTransfer?.getData('application/x-ai-canvas-node');
    if (nodeId) {
      event.preventDefault();
      addAgentRefFromNode(nodeId);
      return;
    }
    const from = Number(event.dataTransfer?.getData('application/x-agent-ref-index'));
    const target = event.target.closest('[data-agent-ref-index]');
    if (!Number.isFinite(from) || !target) return;
    event.preventDefault();
    const to = Number(target.dataset.agentRefIndex);
    if (from === to) return;
    const refs = [...state.agentRefs];
    const [moved] = refs.splice(from, 1);
    refs.splice(to, 0, moved);
    state.agentRefs = refs;
    renderAgentRefs();
    recordAgentHistory('调整参考图顺序');
  });
  els.agentDock?.addEventListener('dragover', event => {
    const types = [...(event.dataTransfer?.types || [])];
    if (!types.includes('application/x-ai-canvas-node') && !types.includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  });
  els.agentDock?.addEventListener('drop', event => {
    const nodeId = event.dataTransfer?.getData('application/x-ai-canvas-node');
    if (nodeId) {
      event.preventDefault();
      addAgentRefFromNode(nodeId);
      return;
    }
    const files = [...(event.dataTransfer?.files || [])].filter(file => file.type?.startsWith('image/'));
    if (!files.length) return;
    event.preventDefault();
    addAgentRefFiles(files);
  });
  document.querySelectorAll('[data-agent-mode]').forEach(btn => {
    btn.addEventListener('click', () => setAgentMode(btn.dataset.agentMode));
  });
  els.agentModeToggle?.addEventListener('click', event => {
    event.preventDefault();
    els.agentModeMenu?.classList.toggle('hidden');
  });
  els.agentSkillToggle?.addEventListener('click', event => {
    event.preventDefault();
    renderAgentSkillMenu();
    els.agentSkillMenu?.classList.toggle('hidden');
  });
  els.agentSkillMenu?.addEventListener('click', event => {
    const load = event.target.closest('[data-agent-skill-load]');
    if (load) {
      event.preventDefault();
      els.agentSkillFileInput?.click();
      return;
    }
    const item = event.target.closest('[data-agent-skill]');
    if (!item) return;
    event.preventDefault();
    setAgentSkill(item.dataset.agentSkill);
    insertIntoAgentInput(agentSkillPrompt(item.dataset.agentSkill));
  });
  els.agentSkillFileInput?.addEventListener('change', async () => {
    try {
      await importCustomSkillFiles(els.agentSkillFileInput.files || []);
    } catch (err) {
      setStatus(`Skill 加载失败：${err.message}`);
    }
    els.agentSkillFileInput.value = '';
  });
  els.agentSkillMenu?.addEventListener('dragstart', event => {
    const item = event.target.closest('[data-agent-skill]');
    if (!item) return;
    const text = agentSkillPrompt(item.dataset.agentSkill);
    event.dataTransfer.setData('text/plain', text);
    event.dataTransfer.setData('application/x-agent-skill', item.dataset.agentSkill);
    event.dataTransfer.effectAllowed = 'copy';
  });
  els.agentInput?.addEventListener('dragover', event => {
    const types = [...(event.dataTransfer?.types || [])];
    if (!types.includes('application/x-agent-skill') && !types.includes('application/x-ai-canvas-node')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  });
  els.agentInput?.addEventListener('drop', event => {
    const nodeId = event.dataTransfer?.getData('application/x-ai-canvas-node');
    if (nodeId) {
      event.preventDefault();
      addAgentRefFromNode(nodeId);
      return;
    }
    const skill = event.dataTransfer?.getData('application/x-agent-skill');
    if (!skill) return;
    event.preventDefault();
    setAgentSkill(skill);
    insertIntoAgentInput(agentSkillPrompt(skill));
  });
  els.agentInput?.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      executeAgentCommand();
      return;
    }
    if (event.shiftKey && (event.key === '@' || event.key === '＠' || event.code === 'Digit2')) {
      event.preventDefault();
      showAgentMentionPanel();
    }
    if (event.key === 'Escape') {
      els.agentRefMention?.classList.add('hidden');
      els.agentHistoryPanel?.classList.add('hidden');
    }
  });
  els.agentInput?.addEventListener('beforeinput', event => {
    if (event.data !== '@' && event.data !== '＠') return;
    event.preventDefault();
    showAgentMentionPanel();
  });
  els.agentRefMention?.addEventListener('click', event => {
    const item = event.target.closest('[data-agent-mention-index]');
    if (!item) return;
    event.preventDefault();
    insertAgentMention(item.dataset.agentMentionIndex);
  });
  document.querySelectorAll('[data-agent-run]').forEach(btn => {
    btn.addEventListener('click', () => setAgentRunMode(btn.dataset.agentRun));
  });
  document.querySelector('.agent-send')?.addEventListener('click', executeAgentCommand);
  setAgentMode(state.agentMode);
  setAgentRunMode(state.agentRunMode);
  setAgentSkill(state.agentSkill, { keepOpen: false });

  document.querySelectorAll('[data-settings-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.settingsTab;
      document.querySelectorAll('[data-settings-tab]').forEach(item => item.classList.toggle('active', item === btn));
      document.querySelectorAll('[data-settings-panel]').forEach(panel => {
        panel.classList.toggle('active', panel.dataset.settingsPanel === tab);
      });
    });
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

  window.addEventListener('blur', () => {
    if (draggingNode || draggingGroup || draggingStage || resizingNode || resizingPanel || draggingCompare || drawingAnnotation || draggingAnnotation || state.linking) {
      state.linking = null;
      draggingNode = null;
      draggingGroup = null;
      draggingStage = false;
      resizingNode = null;
      resizingPanel = null;
      draggingCompare = null;
      drawingAnnotation = null;
      draggingAnnotation = null;
      clearAssetDropHighlights();
      els.stage.classList.remove('dragging');
      render();
      saveCanvas();
    }
  });

  els.stage.addEventListener('contextmenu', event => {
    if (event.target.closest('#projectBoard, #materialBoard')) return;
    event.preventDefault();
    const nodeEl = event.target.closest('.node');
    state.menuNodeId = nodeEl?.dataset.id || null;
    if (nodeEl) {
      const id = nodeEl.dataset.id;
      state.selectedId = id;
      if (!state.selectedIds.includes(id)) state.selectedIds = [id];
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
    if (!event.target.closest('#themeModeMenu') && !event.target.closest('#themeModeToggle')) {
      els.themeModeMenu?.classList.add('hidden');
      els.themeModeToggle?.classList.remove('active');
    }
  });

  els.world.addEventListener('dblclick', event => {
    const nodeEl = event.target.closest('.node');
    if (!nodeEl) {
      if (event.target.closest('#projectBoard, #materialBoard')) return;
      event.preventDefault();
      event.stopPropagation();
      state.menuPoint = screenToWorld(event.clientX, event.clientY);
      els.fileInput.click();
      setStatus('选择图片、视频或音频，上传后会放到双击位置');
      return;
    }
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
    const annotationTextLayer = event.target.closest('[data-annotation-text-layer].active');
    if (annotationTextLayer) {
      const nodeEl = eventNodeElement(event.target);
      const node = state.nodes.find(n => n.id === nodeEl?.dataset.id);
      if (!node) return;
      const annotationItem = event.target.closest('[data-annotation-textbox-index]');
      if (annotationItem) {
        if (event.detail >= 2) return;
        event.preventDefault();
        event.stopPropagation();
        draggingAnnotation = {
          nodeId: node.id,
          index: Number(annotationItem.dataset.annotationTextboxIndex),
          last: annotationPoint(event, annotationTextLayer),
        };
        return;
      }
    }
    const annotationLayer = event.target.closest('[data-annotation-layer].active');
    if (annotationLayer) {
      event.preventDefault();
      event.stopPropagation();
      const nodeEl = eventNodeElement(event.target);
      const node = state.nodes.find(n => n.id === nodeEl?.dataset.id);
      if (!node) return;
      const point = annotationPoint(event, annotationLayer);
      const annotationItem = event.target.closest('[data-annotation-index]');
      if (annotationItem) {
        draggingAnnotation = {
          nodeId: node.id,
          index: Number(annotationItem.dataset.annotationIndex),
          last: point,
        };
        return;
      }
      if (node.annotationTool === 'text') {
        node.annotations = [...(node.annotations || []), {
          type: 'textBox',
          text: '输入文字',
          x: point.x,
          y: point.y,
          w: 16,
          h: 7,
          color: node.annotationColor || '#ccff00',
        }];
        drawingAnnotation = { nodeId: node.id, type: 'textBox', index: node.annotations.length - 1, start: point };
        render();
      } else {
        node.annotations = [...(node.annotations || []), { type: 'path', points: [point], color: node.annotationColor || '#ccff00' }];
        drawingAnnotation = { nodeId: node.id, type: 'path' };
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
      const mediaPreviewTarget = event.target.closest('.image-node-preview, .video-node-preview');
      const interactiveTarget = event.target.closest('textarea,input,select,button,audio');
      if (interactiveTarget) {
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
          const clonedNode = state.nodes.find(n => n.id === clonedIds[0]);
          draggingNode = {
            id: clonedIds[0],
            el: document.querySelector(`.node[data-id="${clonedIds[0]}"]`),
            startX: clonedNode?.x || 0,
            startY: clonedNode?.y || 0,
            startedOnAssetPreview: false,
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
          startX: clickedNode?.x || 0,
          startY: clickedNode?.y || 0,
          startedOnAssetPreview: !!assetPreview,
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
    if (event.buttons === 0 && (draggingNode || draggingGroup || draggingStage || resizingNode || resizingPanel || draggingCompare || drawingAnnotation || draggingAnnotation || state.linking)) {
      if (state.linking) {
        state.linking = null;
        render();
      }
      clearAssetDropHighlights();
      draggingNode = null;
      draggingGroup = null;
      draggingStage = false;
      resizingNode = null;
      resizingPanel = null;
      draggingCompare = null;
      drawingAnnotation = null;
      draggingAnnotation = null;
      els.stage.classList.remove('dragging');
      saveCanvas();
      return;
    }
    const editableGridCell = event.target.closest('.grid-node-preview.editing [data-grid-cell]');
    if (editableGridCell) {
      const nodeEl = event.target.closest('.node');
      if (nodeEl) {
        state.selectedId = nodeEl.dataset.id;
        state.selectedIds = [nodeEl.dataset.id];
        state.selectedLinkId = null;
        document.querySelectorAll('.node.selected').forEach(el => el.classList.remove('selected'));
        nodeEl.classList.add('selected');
        updateNodeInfo();
      }
      return;
    }
    if (draggingAssetNode) {
      highlightAssetFilterAt(event.clientX, event.clientY);
      return;
    }
    if (resizingNode) {
      const node = state.nodes.find(n => n.id === resizingNode.id);
      if (shouldKeepImageRatio(node) && !node.fullscreenPreview && !isGeneratorType(node.type)) {
        const dominantDelta = Math.abs(dx) >= Math.abs(dy) ? dx / state.scale : (dy / state.scale) * imageRatioForNode(node);
        node.w = Math.max(160, (node.w || resizingNode.startW) + dominantDelta);
        node.h = imageNodeHeight(node);
      } else {
        node.w = Math.max(180, (node.w || resizingNode.startW) + dx / state.scale);
        node.h = node.fullscreenPreview
          ? Math.max(220, (node.h || resizingNode.startH) + dy / state.scale)
          : isGeneratorType(node.type)
          ? previewHeightForNode(node)
          : Math.max(110, (node.h || resizingNode.startH) + dy / state.scale);
      }
      resizingNode.el.style.width = `${node.w}px`;
      resizingNode.el.style.height = `${node.h}px`;
      syncParamPanelPosition(node);
      if (isAssetCandidateNode(node)) highlightAssetFilterAt(event.clientX, event.clientY);
      scheduleRenderLinks();
      return;
    }
    if (resizingPanel) {
      const node = state.nodes.find(n => n.id === resizingPanel.id);
      node.panelW = Math.max(Number(node.w || 0), 320, (node.panelW || resizingPanel.startW) + dx / state.scale);
      node.panelH = Math.max(120, (node.panelH || resizingPanel.startH) + dy / state.scale);
      resizingPanel.el.style.width = `${node.panelW}px`;
      resizingPanel.el.style.minHeight = `${node.panelH}px`;
      syncParamPanelPosition(node);
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
      } else if (node && drawingAnnotation.type === 'textBox') {
        const textLayer = document.querySelector(`.node[data-id="${drawingAnnotation.nodeId}"] [data-annotation-text-layer]`);
        const item = node.annotations?.[drawingAnnotation.index];
        if (textLayer && item) {
          const point = annotationPoint(event, textLayer);
          item.x = Math.min(drawingAnnotation.start.x, point.x);
          item.y = Math.min(drawingAnnotation.start.y, point.y);
          item.w = Math.max(5, Math.abs(point.x - drawingAnnotation.start.x));
          item.h = Math.max(5, Math.abs(point.y - drawingAnnotation.start.y));
          render();
        }
      }
    } else if (draggingAnnotation) {
      const node = state.nodes.find(n => n.id === draggingAnnotation.nodeId);
      const layer = document.querySelector(`.node[data-id="${draggingAnnotation.nodeId}"] [data-annotation-layer]`);
      const item = node?.annotations?.[draggingAnnotation.index];
      if (node && layer && item) {
        const point = annotationPoint(event, layer);
        const adx = point.x - draggingAnnotation.last.x;
        const ady = point.y - draggingAnnotation.last.y;
        moveAnnotationItem(item, adx, ady);
        draggingAnnotation.last = point;
        render();
      }
    } else if (draggingNode) {
      const node = state.nodes.find(n => n.id === draggingNode.id);
      node.x += dx / state.scale;
      node.y += dy / state.scale;
      updateGroupsForMembers([node.id]);
      draggingNode.el.style.left = `${node.x}px`;
      draggingNode.el.style.top = `${node.y}px`;
      syncParamPanelPosition(node);
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
    if (drawingAnnotation || draggingAnnotation) {
      const focusTextBox = drawingAnnotation?.type === 'textBox'
        ? { nodeId: drawingAnnotation.nodeId, index: drawingAnnotation.index }
        : null;
      drawingAnnotation = null;
      draggingAnnotation = null;
      render();
      if (focusTextBox) {
        window.setTimeout(() => {
          const box = document.querySelector(`.node[data-id="${focusTextBox.nodeId}"] [data-annotation-textbox-index="${focusTextBox.index}"]`);
          if (!box) return;
          box.focus();
          const range = document.createRange();
          range.selectNodeContents(box);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }, 0);
      }
      saveCanvas();
      return;
    }
    if (draggingAssetNode) {
      const filter = assetFilterFromPoint(event.clientX, event.clientY);
      clearAssetDropHighlights();
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
          state.pendingLink = {
            to: state.linking.targetId,
            point: screenToWorld(event.clientX, event.clientY),
          };
          state.menuPoint = state.pendingLink.point;
          showMenu(event.clientX, event.clientY, { keepPendingLink: true });
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
    if (draggingNode) {
      const node = state.nodes.find(n => n.id === draggingNode.id);
      const gridCell = gridCellFromPoint(event.clientX, event.clientY, draggingNode.el);
      if (node && gridCell && gridCell.nodeId !== node.id && imageUrlForNode(node)) {
        replaceGridCellFromNode(gridCell.nodeId, gridCell.index, node.id);
        draggingNode = null;
        draggingGroup = null;
        draggingStage = false;
        els.stage.classList.remove('dragging');
        return;
      }
      const filter = assetFilterFromPoint(event.clientX, event.clientY);
      if (node && filter && isAssetCandidateNode(node)) {
        const category = filter.dataset.assetFilter === 'all' ? 'other' : filter.dataset.assetFilter;
        node.x = draggingNode.startX;
        node.y = draggingNode.startY;
        addAssetFromNode(node.id, { category });
        document.querySelectorAll('[data-asset-filter]').forEach(btn => btn.classList.remove('active'));
        filter.classList.add('active');
        state.assetFilter = filter.dataset.assetFilter;
        clearAssetDropHighlights();
        draggingNode = null;
        draggingGroup = null;
        draggingStage = false;
        els.stage.classList.remove('dragging');
        render();
        saveCanvas();
        setStatus(`已加入资产分类：${assetCategoryName(category)}`);
        return;
      }
      clearAssetDropHighlights();
    }
    if (draggingNode && isAgentDropTargetAt(event.clientX, event.clientY)) {
      const added = addAgentRefFromNode(draggingNode.id);
      const node = state.nodes.find(n => n.id === draggingNode.id);
      if (added && draggingNode.startedOnAssetPreview && node) {
        node.x = draggingNode.startX;
        node.y = draggingNode.startY;
      }
      draggingNode = null;
      draggingGroup = null;
      draggingStage = false;
      els.stage.classList.remove('dragging');
      render();
      saveCanvas();
      setStatus(added ? '已把画布图片加入智能体参考区' : '这个节点没有可用图片');
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
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'g') {
      event.preventDefault();
      if (event.shiftKey) ungroupSelectedNodes();
      else groupSelectedNodes();
      return;
    }
    if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      toggleDisableSelectedNodes();
      return;
    }
    if (event.shiftKey && !event.ctrlKey && !event.metaKey && ['h', 'v'].includes(event.key.toLowerCase())) {
      const id = state.selectedId || state.selectedIds.find(item => imageUrlForNode(state.nodes.find(n => n.id === item)));
      if (id) {
        event.preventDefault();
        flipImageNode(id, event.key.toLowerCase() === 'v' ? 'vertical' : 'horizontal');
        return;
      }
    }
    if (!els.directorStage?.classList.contains('hidden')) {
      const key = event.key.toLowerCase();
      if (['w', 'e', 'r'].includes(key)) {
        event.preventDefault();
        const tool = { w: 'move', e: 'rotate', r: 'scale' }[key];
        setDirectorTool(tool);
        return;
      }
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      selectAllNodes();
      return;
    }
    if (drawingAnnotation) {
      drawingAnnotation = null;
      draggingAnnotation = null;
      saveCanvas();
      return;
    }
    if (draggingAnnotation) {
      draggingAnnotation = null;
      saveCanvas();
      return;
    }
    if (draggingCompare) {
      draggingCompare = null;
      saveCanvas();
      return;
    }
    if (event.code === 'Space') {
      event.preventDefault();
      state.spacePan = false;
      showHotbox();
      return;
    }
    if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      toggleMaximizeSelectedNode();
      return;
    }
    if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 't') {
      event.preventDefault();
      const p = hotboxPoint();
      addNode('text', p.x, p.y, { text: '' });
      setStatus('已创建文本节点');
      return;
    }
    if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      const p = hotboxPoint();
      addNode('compare', p.x, p.y, {});
      setStatus('已创建对比节点');
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
      hideHotbox();
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
    const textBox = event.target.closest('[data-annotation-textbox-index]');
    if (nodeEl && textBox) {
      const node = state.nodes.find(n => n.id === nodeEl.dataset.id);
      const item = node?.annotations?.[Number(textBox.dataset.annotationTextboxIndex)];
      if (item?.type === 'textBox') {
        item.text = textBox.textContent || '';
        scheduleCanvasSave();
      }
      return;
    }
    const annotationColor = event.target.closest('[data-annotation-color]');
    if (nodeEl && annotationColor) {
      const node = state.nodes.find(n => n.id === nodeEl.dataset.id);
      if (!node) return;
      node.annotationColor = annotationColor.value || '#ccff00';
      scheduleCanvasSave();
      return;
    }
    const field = event.target.dataset.field;
    if (!nodeEl || !field) return;
    const node = state.nodes.find(n => n.id === nodeEl.dataset.id);
    if (event.target.type === 'checkbox') {
      node[field] = event.target.checked;
    } else if (event.target.type === 'number' || ['duration', 'loopCount', 'imageCount'].includes(field)) {
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
    const menuToggle = event.target.closest('.image-tool-menu > button');
    if (!menuToggle) return;
    event.preventDefault();
    event.stopPropagation();
    const menu = menuToggle.closest('.image-tool-menu');
    const wasOpen = menu.classList.contains('open');
    document.querySelectorAll('.image-tool-menu.open').forEach(item => {
      if (item !== menu) item.classList.remove('open');
    });
    menu.classList.toggle('open', !wasOpen);
  });

  document.addEventListener('click', event => {
    if (event.target.closest('.image-tool-menu')) return;
    document.querySelectorAll('.image-tool-menu.open').forEach(item => item.classList.remove('open'));
  });

  document.addEventListener('mousemove', event => {
    document.querySelectorAll('.node.selected, .node.multi-selected').forEach(nodeEl => {
      const tool = nodeEl.querySelector('.image-tool-strip');
      if (!tool) return;
      const nodeRect = nodeEl.getBoundingClientRect();
      const toolRect = tool.getBoundingClientRect();
      const pad = tool.querySelector('.image-tool-menu.open') ? 260 : 180;
      const left = Math.min(nodeRect.left, toolRect.left) - pad;
      const right = Math.max(nodeRect.right, toolRect.right) + pad;
      const top = Math.min(nodeRect.top, toolRect.top) - pad;
      const bottom = Math.max(nodeRect.bottom, toolRect.bottom) + pad;
      const far = event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom;
      nodeEl.classList.toggle('tool-far', far);
    });
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
    const annotationColor = event.target.closest('[data-annotation-color]');
    if (nodeEl && annotationColor) {
      const node = state.nodes.find(n => n.id === nodeEl.dataset.id);
      if (!node) return;
      node.annotationColor = annotationColor.value || '#ccff00';
      saveCanvas();
      return;
    }
    const field = event.target.dataset.field;
    if (!nodeEl || !field) return;
    const node = state.nodes.find(n => n.id === nodeEl.dataset.id);
    if (event.target.type === 'checkbox') {
      node[field] = event.target.checked;
    } else if (event.target.type === 'number' || ['duration', 'loopCount', 'imageCount'].includes(field)) {
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
    const btn = event.target.closest('[data-replace-image]');
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    const nodeEl = eventNodeElement(event.target);
    const node = nodeEl ? state.nodes.find(n => n.id === nodeEl.dataset.id) : null;
    if (!node || node.type !== 'image') return;
    state.replaceImageNodeId = node.id;
    els.replaceImageInput?.click();
  });

  els.world.addEventListener('click', event => {
    const btn = event.target.closest('[data-video-toggle]');
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    toggleVideoInShell(btn.closest('.node-preview-shell'));
  });

  els.world.addEventListener('click', event => {
    const nodeEl = eventNodeElement(event.target);
    const node = nodeEl ? state.nodes.find(n => n.id === nodeEl.dataset.id) : null;
    if (!node || node.type !== 'browser') return;
    const quick = event.target.closest('[data-browser-quick]');
    if (quick) {
      event.preventDefault();
      node.url = normalizeBrowserUrl(quick.dataset.browserQuick);
      render();
      saveCanvas();
      return;
    }
    const open = event.target.closest('[data-browser-open]');
    if (open) {
      event.preventDefault();
      const input = nodeEl.querySelector('.browser-address input');
      node.url = normalizeBrowserUrl(input?.value || node.url || '');
      render();
      saveCanvas();
      return;
    }
  });

  els.world.addEventListener('keydown', event => {
    const input = event.target.closest?.('.browser-address input');
    if (!input || event.key !== 'Enter') return;
    const nodeEl = eventNodeElement(event.target);
    const node = nodeEl ? state.nodes.find(n => n.id === nodeEl.dataset.id) : null;
    if (!node || node.type !== 'browser') return;
    event.preventDefault();
    node.url = normalizeBrowserUrl(input.value);
    render();
    saveCanvas();
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
    const gridCell = event.target.closest('[data-grid-cell]');
    if (gridCell) {
      const nodeEl = eventNodeElement(event.target);
      const node = state.nodes.find(n => n.id === nodeEl?.dataset.id);
      if (!node?.gridEditing) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.setData('application/x-ai-canvas-grid-cell', JSON.stringify({
        nodeId: node.id,
        index: Number(gridCell.dataset.gridCell),
      }));
      event.dataTransfer.effectAllowed = 'copyMove';
      return;
    }
    const assetDrag = event.target.closest('[data-drag-asset-node]');
    if (assetDrag) {
      const payload = JSON.stringify({ type: 'asset-node', nodeId: assetDrag.dataset.dragAssetNode });
      event.dataTransfer.setData('application/x-ai-canvas-asset-node', assetDrag.dataset.dragAssetNode);
      event.dataTransfer.setData('application/x-ai-canvas-node', assetDrag.dataset.dragAssetNode);
      event.dataTransfer.setData('text/plain', payload);
      event.dataTransfer.effectAllowed = 'copy';
      setStatus('可拖到资产库或智能体参考区');
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
    if (event.target.closest('[data-ref-index], [data-grid-cell]')) event.preventDefault();
    if ([...(event.dataTransfer?.types || [])].includes('application/x-ai-canvas-grid-cell')) event.preventDefault();
  });

  els.world.addEventListener('drop', event => {
    const gridCell = event.target.closest('[data-grid-cell]');
    if (gridCell) {
      event.preventDefault();
      const nodeEl = eventNodeElement(event.target);
      const targetNode = state.nodes.find(n => n.id === nodeEl?.dataset.id);
      if (!targetNode || targetNode.type !== 'grid') return;
      const targetIndex = Number(gridCell.dataset.gridCell);
      const gridPayload = event.dataTransfer.getData('application/x-ai-canvas-grid-cell');
      if (gridPayload) {
        try {
          const data = JSON.parse(gridPayload);
          const sourceNode = state.nodes.find(n => n.id === data.nodeId);
          const sourceItems = sourceNode?.gridItems;
          if (!sourceItems?.[data.index]) return;
          const [moved] = sourceItems.splice(data.index, 1);
          if (sourceNode.id === targetNode.id) {
            sourceItems.splice(targetIndex, 0, moved);
          } else {
            targetNode.gridItems[targetIndex] = moved;
          }
          render();
          saveCanvas();
          setStatus('分镜顺序已更新');
        } catch {
          // ignore malformed drags
        }
        return;
      }
      const sourceNodeId = assetNodeIdFromDrop(event);
      if (sourceNodeId) replaceGridCellFromNode(targetNode.id, targetIndex, sourceNodeId);
      return;
    }
    const gridPayload = event.dataTransfer.getData('application/x-ai-canvas-grid-cell');
    if (gridPayload) {
      event.preventDefault();
      try {
        const data = JSON.parse(gridPayload);
        createImageNodeFromGridCell(data.nodeId, data.index, screenToWorld(event.clientX, event.clientY));
      } catch {
        // ignore malformed drags
      }
      return;
    }
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
    node.inlineReferences = (node.inlineReferences || []).filter(ref => (ref.nodeId || ref.url) !== refId);
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
    const assistBtn = event.target.closest('[data-image-assist]');
    if (!assistBtn) return;
    event.preventDefault();
    event.stopPropagation();
    const nodeEl = eventNodeElement(event.target);
    if (!nodeEl?.dataset.id) return;
    openImageAssistPanel(nodeEl.dataset.id, assistBtn.dataset.imageAssist);
  });

  els.world.addEventListener('click', event => {
    const layoutBtn = event.target.closest('[data-selection-layout]');
    if (!layoutBtn) return;
    event.preventDefault();
    event.stopPropagation();
    createGridFromSelectedImages(layoutBtn.dataset.selectionLayout);
  });

  els.world.addEventListener('click', event => {
    const gridBtn = event.target.closest('[data-image-grid]');
    if (!gridBtn) return;
    event.preventDefault();
    event.stopPropagation();
    const nodeEl = eventNodeElement(gridBtn);
    if (!nodeEl?.dataset.id) return;
    cropImageGrid(nodeEl.dataset.id, Number(gridBtn.dataset.imageGrid || 9));
  });

  els.world.addEventListener('click', event => {
    const nodeEl = eventNodeElement(event.target);
    if (!nodeEl?.dataset.id) return;
    const gridNode = state.nodes.find(n => n.id === nodeEl.dataset.id);
    if (gridNode?.type !== 'grid') return;
    const layout = event.target.closest('[data-grid-layout]');
    if (layout) {
      event.preventDefault();
      event.stopPropagation();
      setGridLayout(gridNode.id, layout.dataset.gridLayout);
      return;
    }
    if (event.target.closest('[data-grid-download]')) {
      event.preventDefault();
      event.stopPropagation();
      downloadGridItems(gridNode.id);
      return;
    }
    if (event.target.closest('[data-grid-edit]')) {
      event.preventDefault();
      event.stopPropagation();
      toggleGridEditing(gridNode.id);
      return;
    }
    if (event.target.closest('[data-grid-split]')) {
      event.preventDefault();
      event.stopPropagation();
      splitGridNode(gridNode.id);
      return;
    }
    if (event.target.closest('[data-grid-clear]')) {
      event.preventDefault();
      event.stopPropagation();
      clearGridNode(gridNode.id);
    }
  });

  els.world.addEventListener('click', event => {
    const flipBtn = event.target.closest('[data-image-flip]');
    if (!flipBtn) return;
    event.preventDefault();
    event.stopPropagation();
    const nodeEl = eventNodeElement(flipBtn);
    if (!nodeEl?.dataset.id) return;
    flipImageNode(nodeEl.dataset.id, flipBtn.dataset.imageFlip);
  });

  els.world.addEventListener('click', event => {
    const tool = event.target.closest('[data-annotation-tool]');
    if (tool) {
      event.preventDefault();
      event.stopPropagation();
      const nodeEl = eventNodeElement(event.target);
      const node = state.nodes.find(n => n.id === nodeEl?.dataset.id);
      if (!node) return;
      node.annotationMode = true;
      node.annotationTool = tool.dataset.annotationTool;
      render();
      saveCanvas();
      return;
    }
    const save = event.target.closest('[data-annotation-save]');
    if (save) {
      event.preventDefault();
      event.stopPropagation();
      const nodeEl = eventNodeElement(event.target);
      const node = state.nodes.find(n => n.id === nodeEl?.dataset.id);
      if (!node) return;
      drawingAnnotation = null;
      draggingAnnotation = null;
      node.annotationMode = false;
      node.annotationTool = 'brush';
      document.querySelectorAll('.image-tool-menu.open').forEach(item => item.classList.remove('open'));
      render();
      saveCanvas();
      setStatus('标注已保存，已退出画笔/文字编辑');
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
    const btn = event.target.closest('[data-run-loop]');
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    const nodeEl = eventNodeElement(event.target);
    if (!nodeEl?.dataset.id) return;
    state.selectedId = nodeEl.dataset.id;
    state.selectedIds = [nodeEl.dataset.id];
    state.selectedLinkId = null;
    runLoopNode(nodeEl.dataset.id);
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
      setDirectorView(state.directorStage.view || 'third');
      setDirectorTool(state.directorStage.tool || 'select');
      els.directorStage?.classList.remove('hidden');
      window.Director3D?.open?.();
      return;
    }
    const snapshot = event.target.closest('[data-director-node-snapshot]');
    if (snapshot) {
      event.preventDefault();
      event.stopPropagation();
      sendDirectorSnapshotToCanvas();
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

  els.directorStage?.addEventListener('click', event => {
    const tabBtn = event.target.closest('[data-director-tab]');
    if (tabBtn) {
      setDirectorInspectorTab(tabBtn.dataset.directorTab);
      return;
    }
    const openLibrary = event.target.closest('[data-director-open-library]');
    if (openLibrary) {
      document.querySelector('#directorPresetPanel')?.classList.remove('hidden');
      return;
    }
    const closeLibrary = event.target.closest('[data-director-close-library]');
    if (closeLibrary) {
      document.querySelector('#directorPresetPanel')?.classList.add('hidden');
      return;
    }
    const libraryTab = event.target.closest('[data-director-library-tab]');
    if (libraryTab) {
      setDirectorPresetLibraryTab(libraryTab.dataset.directorLibraryTab);
      return;
    }
    const libraryPreset = event.target.closest('[data-director-library-preset]');
    if (libraryPreset) {
      applyDirectorLibraryPreset(libraryPreset.dataset.directorLibraryPreset);
      return;
    }
    const viewBtn = event.target.closest('[data-director-view]');
    if (viewBtn) {
      setDirectorView(viewBtn.dataset.directorView);
      return;
    }
    const toolBtn = event.target.closest('[data-director-tool]');
    if (toolBtn) {
      setDirectorTool(toolBtn.dataset.directorTool);
      return;
    }
    const snapshotBtn = event.target.closest('[data-director-snapshot]');
    if (snapshotBtn) {
      sendDirectorSnapshotToCanvas();
      return;
    }
    const resetBtn = event.target.closest('[data-director-reset]');
    if (resetBtn) {
      setDirectorView('third');
      setDirectorTool('select');
      applyDirectorPose('站立');
      selectDirectorObject('角色A');
      setStatus('导演台视图已复位');
      return;
    }
    const createBtn = event.target.closest('[data-director-create]');
    if (createBtn) {
      const type = createBtn.dataset.directorCreate;
      const labels = { actor: '角色', scene: '场景', model: '模型' };
      const name = `${labels[type] || '对象'}${(els.directorObjectList?.children.length || 0) + 1}`;
      addDirectorObject(name, labels[type] || '对象');
      selectDirectorObject(name);
      if (type === 'actor') window.Director3D?.addActor?.(name);
      if (type === 'scene') window.Director3D?.createScene?.(name);
      if (type === 'model') window.Director3D?.addModel?.(name);
      setStatus(`导演台已创建：${name}`);
      return;
    }
    const presetBtn = event.target.closest('[data-director-preset]');
    if (presetBtn) {
      const name = presetBtn.dataset.directorPreset;
      addDirectorObject(name, '角色预设');
      selectDirectorObject(name);
      window.Director3D?.loadPreset?.(name);
      setStatus(`已调用人物预设：${name}`);
      return;
    }
    const sceneBtn = event.target.closest('[data-director-scene]');
    if (sceneBtn) {
      state.directorStage.scene = sceneBtn.dataset.directorScene;
      addDirectorObject(state.directorStage.scene, '场景');
      selectDirectorObject(state.directorStage.scene);
      window.Director3D?.createScene?.(state.directorStage.scene);
      setStatus(`已切换场景：${state.directorStage.scene}`);
      return;
    }
    const actionBtn = event.target.closest('[data-director-action]');
    if (actionBtn) {
      applyDirectorPose(actionBtn.dataset.directorAction);
      return;
    }
    const posePreset = event.target.closest('[data-director-pose-preset]');
    if (posePreset) {
      applyDirectorPose(posePreset.dataset.directorPosePreset);
      return;
    }
    const objectBtn = event.target.closest('[data-director-object]');
    if (objectBtn) {
      selectDirectorObject(objectBtn.dataset.directorObject);
      window.Director3D?.select?.(objectBtn.dataset.directorObject);
    }
  });

  els.directorObjectName?.addEventListener('input', () => {
    const name = els.directorObjectName.value.trim();
    if (!name) return;
    const active = els.directorObjectList?.querySelector('.active[data-director-object]');
    if (active) {
      active.dataset.directorObject = name;
      active.firstChild.textContent = `${active.textContent.trim().slice(0, 1)} ${name} `;
    }
    state.directorStage.selected = name;
    const avatar = document.querySelector('#directorAvatar strong');
    if (avatar) avatar.textContent = name;
  });

  els.directorPose?.addEventListener('change', () => applyDirectorPose(els.directorPose.value));

  els.directorStage?.addEventListener('input', event => {
    const transformField = event.target.closest('[data-director-transform]');
    if (transformField) {
      window.Director3D?.setObjectTransform?.(transformField.dataset.directorTransform, transformField.value);
      return;
    }
    const scaleField = event.target.closest('[data-director-uniform-scale]');
    if (scaleField) {
      const output = scaleField.closest('.director-slider-row')?.querySelector('output');
      if (output) output.textContent = Number(scaleField.value).toFixed(1);
      window.Director3D?.setUniformScale?.(scaleField.value);
      return;
    }
    const colorField = event.target.closest('[data-director-color]');
    if (colorField) {
      window.Director3D?.setObjectColor?.(colorField.value);
      return;
    }
    const poseControl = event.target.closest('[data-director-pose-control]');
    if (poseControl) {
      const output = poseControl.closest('div')?.querySelector('output');
      if (output) output.textContent = poseControl.value;
      window.Director3D?.setPoseControl?.(poseControl.dataset.directorPoseControl, poseControl.value);
    }
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
        return;
      }
      if (btn.dataset.mode === 'talking') {
        showMaterialBoard('talking');
        setStatus('已打开口播智能体');
        return;
      }
      if (btn.dataset.mode === 'commonTools') {
        showMaterialBoard('commonTools');
        setStatus('已打开常用工具');
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
    executeMenuAction(type, p);
  });

  els.hotbox?.addEventListener('click', event => {
    const item = event.target.closest('[data-hotbox-menu]');
    if (!item) return;
    event.preventDefault();
    const p = hotboxPoint();
    state.menuPoint = p;
    hideHotbox();
    executeMenuAction(item.dataset.hotboxMenu, p);
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

  els.replaceImageInput?.addEventListener('change', () => {
    const file = els.replaceImageInput.files?.[0];
    if (state.replaceImageNodeId && file) replaceImageForNode(state.replaceImageNodeId, file);
    els.replaceImageInput.value = '';
  });

  document.querySelectorAll('.rail-item').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!btn.dataset.tab) return;
      els.agentDock?.classList.add('hidden');
      els.agentFloat?.classList.remove('hidden');
      if (btn.dataset.tab === 'assets') {
        const alreadyOpen = state.materialView === 'assets' && !els.materialBoard?.classList.contains('hidden');
        if (alreadyOpen) {
          hideMaterialBoard();
          return;
        }
        document.querySelectorAll('.rail-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelector('.leftbar')?.classList.remove('open');
        showMaterialBoard('assets');
        setStatus('已打开悬浮资产库，画布图片/视频可拖入对应分类');
        return;
      }
      hideMaterialBoard();
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
    const rename = event.target.closest('[data-asset-rename]');
    if (rename) {
      event.preventDefault();
      event.stopPropagation();
      renameAsset(rename.dataset.assetRename);
      return;
    }
    const deleteBtn = event.target.closest('[data-asset-delete]');
    if (deleteBtn) {
      event.preventDefault();
      event.stopPropagation();
      deleteAsset(deleteBtn.dataset.assetDelete);
      return;
    }
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
    if (event.target.closest('[data-close-asset-panel]')) {
      event.preventDefault();
      hideMaterialBoard();
      return;
    }
    const talkingAction = event.target.closest('[data-talking-action]');
    if (talkingAction) {
      event.preventDefault();
      const action = talkingAction.dataset.talkingAction;
      if (action === 'extract-link') extractTalkingLink();
      if (action === 'extract-script') extractTalkingScript();
      if (action === 'rewrite-script') rewriteTalkingScript();
      if (action === 'upload-audio') els.materialBoard.querySelector('[data-talking-audio-input]')?.click();
      if (action === 'preset-audio') {
        syncTalkingAgentFromBoard();
        usePresetTalkingAudio();
      }
      if (action === 'generate-audio') createTalkingAudioTaskNode();
      if (action === 'upload-avatar') els.materialBoard.querySelector('[data-talking-avatar-input]')?.click();
      if (action === 'preset-avatar') {
        syncTalkingAgentFromBoard();
        usePresetTalkingAvatar();
      }
      if (action === 'create-speaking-video') createTalkingSpeakingVideoNode();
      if (action === 'run-all') runTalkingAgentWorkflow();
      return;
    }
    const cloneAction = event.target.closest('[data-clone-action]');
    if (cloneAction) {
      event.preventDefault();
      const action = cloneAction.dataset.cloneAction;
      if (action === 'extract') extractCloneLink();
      if (action === 'load-video') els.materialBoard.querySelector('[data-clone-video-input]')?.click();
      if (action === 'capture-frame') captureCloneFrame();
      if (action === 'import-frame') importCloneFrameToCanvas();
      if (action === 'mimic') createCloneMimicWorkflow();
      return;
    }
    const cloneWorkflow = event.target.closest('[data-clone-workflow]');
    if (cloneWorkflow) {
      event.preventDefault();
      createCloneWorkflow(cloneWorkflow.dataset.cloneWorkflow);
      return;
    }
    const emptyUpload = event.target.closest('[data-material-empty-upload]');
    if (emptyUpload) {
      event.preventDefault();
      openMaterialUploadForCurrentFilter();
      return;
    }
    const assetEmptyUpload = event.target.closest('[data-asset-empty-upload]');
    if (assetEmptyUpload) {
      event.preventDefault();
      state.materialUploadType = 'auto';
      els.fileInput.click();
      return;
    }
    const assetRename = event.target.closest('[data-asset-rename]');
    if (assetRename) {
      event.preventDefault();
      event.stopPropagation();
      renameAsset(assetRename.dataset.assetRename);
      return;
    }
    const assetDelete = event.target.closest('[data-asset-delete]');
    if (assetDelete) {
      event.preventDefault();
      event.stopPropagation();
      deleteAsset(assetDelete.dataset.assetDelete);
      return;
    }
    const assetFilter = event.target.closest('[data-asset-filter]');
    if (assetFilter && state.materialView === 'assets') {
      state.assetFilter = assetFilter.dataset.assetFilter;
      renderAssets();
      renderMaterialBoard();
      return;
    }
    const assetCard = event.target.closest('[data-asset]');
    if (assetCard && state.materialView === 'assets') {
      const asset = (state.assets || []).find(item => item.id === assetCard.dataset.asset);
      if (!asset) return;
      activateCanvasMode(state.mode);
      addAssetNodeToCanvas(asset);
      render();
      saveCanvas();
      return;
    }
    const rename = event.target.closest('[data-material-rename]');
    if (rename) {
      event.preventDefault();
      event.stopPropagation();
      renameAsset(rename.dataset.materialRename);
      return;
    }
    const deleteBtn = event.target.closest('[data-material-delete]');
    if (deleteBtn) {
      event.preventDefault();
      event.stopPropagation();
      deleteAsset(deleteBtn.dataset.materialDelete);
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
    if (event.target.closest('[data-preset-category-new]')) {
      createPromptCategory();
      return;
    }
    if (event.target.closest('[data-preset-category-rename]')) {
      renamePromptCategory();
      return;
    }
    if (event.target.closest('[data-preset-category-delete]')) {
      deletePromptCategory();
      return;
    }
    if (event.target.closest('[data-preset-new]')) {
      upsertPromptPreset();
      return;
    }
    const searchPreset = event.target.closest('[data-preset-search-run]');
    if (searchPreset) {
      state.promptPresetQuery = els.materialBoard.querySelector('[data-preset-search]')?.value || '';
      state.selectedPromptPresetId = '';
      renderMaterialBoard();
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

  els.materialBoard?.addEventListener('change', event => {
    const audioInput = event.target.closest('[data-talking-audio-input]');
    if (audioInput) {
      const file = audioInput.files?.[0];
      setTalkingAudioFile(file);
      audioInput.value = '';
      return;
    }
    const avatarInput = event.target.closest('[data-talking-avatar-input]');
    if (avatarInput) {
      const file = avatarInput.files?.[0];
      setTalkingAvatarFile(file);
      avatarInput.value = '';
      return;
    }
    const talkingField = event.target.closest('[data-talking-field]');
    if (talkingField) {
      syncTalkingAgentFromBoard();
      if (talkingField.dataset.talkingField === 'presetAudio') {
        if (talkingField.value) usePresetTalkingAudio(talkingField.value);
        else renderMaterialBoard();
        return;
      }
      if (talkingField.dataset.talkingField === 'presetAvatar') {
        if (talkingField.value) usePresetTalkingAvatar(talkingField.value);
        else renderMaterialBoard();
        return;
      }
      return;
    }
    const input = event.target.closest('[data-clone-video-input]');
    if (!input) return;
    const file = input.files?.[0];
    setCloneVideoFile(file);
    input.value = '';
  });

  els.materialBoard?.addEventListener('keydown', event => {
    if (event.target.closest('[data-talking-field]')) {
      window.clearTimeout(event.target._talkingSyncTimer);
      event.target._talkingSyncTimer = window.setTimeout(syncTalkingAgentFromBoard, 120);
    }
    if (event.target.matches('[data-preset-search]') && event.key === 'Enter') {
      event.preventDefault();
      state.promptPresetQuery = event.target.value || '';
      state.selectedPromptPresetId = '';
      renderMaterialBoard();
    }
  });

  els.materialBoard?.addEventListener('dblclick', event => {
    const presetCategory = event.target.closest('[data-preset-category-id]');
    if (presetCategory && state.materialView === 'prompts') {
      event.preventDefault();
      event.stopPropagation();
      renamePromptCategory(presetCategory.dataset.presetCategoryId);
      return;
    }
    if (!shouldMaterialUploadFromEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();
    openMaterialUploadForCurrentFilter();
  });

  els.materialBoard?.addEventListener('contextmenu', event => {
    const presetCategory = event.target.closest('[data-preset-category-id]');
    if (presetCategory && state.materialView === 'prompts') {
      event.preventDefault();
      event.stopPropagation();
      renamePromptCategory(presetCategory.dataset.presetCategoryId);
      return;
    }
    if (!['materials', 'assets'].includes(state.materialView)) return;
    const card = event.target.closest('[data-asset]');
    if (!card) {
      if (!shouldMaterialUploadFromEvent(event)) return;
      event.preventDefault();
      event.stopPropagation();
      openMaterialUploadForCurrentFilter();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    showMaterialContextMenu(card.dataset.asset, event.clientX, event.clientY);
  });

  els.materialBoard?.addEventListener('dragstart', event => {
    if (state.materialView === 'prompts') {
      const categoryBtn = event.target.closest('[data-preset-category-id]');
      if (categoryBtn && categoryBtn.dataset.presetCategoryId !== 'all') {
        event.dataTransfer.setData('application/x-prompt-category-id', categoryBtn.dataset.presetCategoryId);
        event.dataTransfer.effectAllowed = 'move';
        return;
      }
      const presetCard = event.target.closest('[data-preset-id]');
      if (presetCard) {
        event.dataTransfer.setData('application/x-prompt-preset-id', presetCard.dataset.presetId);
        event.dataTransfer.effectAllowed = 'move';
      }
      return;
    }
    if (!['materials', 'assets'].includes(state.materialView)) return;
    const card = event.target.closest('[data-asset]');
    if (!card) return;
    event.dataTransfer.setData('application/x-ai-material-id', card.dataset.asset);
    event.dataTransfer.effectAllowed = 'move';
  });

  els.materialBoard?.addEventListener('dragover', event => {
    if (state.materialView === 'prompts') {
      const types = Array.from(event.dataTransfer?.types || []);
      if (!types.includes('application/x-prompt-category-id') && !types.includes('application/x-prompt-preset-id')) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      return;
    }
    if (state.materialView === 'clone' || state.materialView === 'talking') {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      els.materialBoard.classList.add('drop-active');
      return;
    }
    if (!['materials', 'assets'].includes(state.materialView)) return;
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
    if (state.materialView === 'prompts') {
      const categoryId = event.dataTransfer.getData('application/x-prompt-category-id');
      if (categoryId) {
        const target = event.target.closest('[data-preset-category-id]');
        if (target) {
          event.preventDefault();
          movePromptCategory(categoryId, target.dataset.presetCategoryId);
        }
        return;
      }
      const presetId = event.dataTransfer.getData('application/x-prompt-preset-id');
      if (presetId) {
        const target = event.target.closest('[data-preset-id]');
        if (target) {
          event.preventDefault();
          movePromptPreset(presetId, target.dataset.presetId);
        }
        return;
      }
    }
    if (state.materialView === 'clone') {
      event.preventDefault();
      els.materialBoard.classList.remove('drop-active');
      const files = await filesFromDataTransfer(event.dataTransfer);
      const video = files.find(file => file.type?.startsWith('video/'));
      if (!video) {
        setStatus('请拖入短视频文件');
        return;
      }
      setCloneVideoFile(video);
      return;
    }
    if (state.materialView === 'talking') {
      event.preventDefault();
      els.materialBoard.classList.remove('drop-active');
      const files = await filesFromDataTransfer(event.dataTransfer);
      const audio = files.find(file => file.type?.startsWith('audio/'));
      const video = files.find(file => file.type?.startsWith('video/'));
      if (audio) {
        setTalkingAudioFile(audio);
        return;
      }
      if (video) {
        setTalkingAvatarFile(video);
        return;
      }
      setStatus('请拖入音频或数字人视频文件');
      return;
    }
    if (!['materials', 'assets'].includes(state.materialView)) return;
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
    const canvasNodeId = assetNodeIdFromDrop(event);
    if (canvasNodeId) {
      const filter = event.target.closest('[data-asset-filter]')
        || event.target.closest('.asset-library-board')?.querySelector('[data-asset-filter].active')
        || document.querySelector('[data-asset-filter].active');
      const category = filter?.dataset.assetFilter === 'all' ? 'other' : (filter?.dataset.assetFilter || 'other');
      addAssetFromNode(canvasNodeId, { category });
      if (filter?.dataset.assetFilter) state.assetFilter = filter.dataset.assetFilter;
      renderAssets();
      renderMaterialBoard();
      setStatus(`已加入资产分类：${assetCategoryName(category)}`);
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

function selectedGroupNodes() {
  const ids = new Set([...(state.selectedIds || []), state.selectedId].filter(Boolean));
  return state.nodes.filter(n => ids.has(n.id) && n.type === 'group');
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

function layoutSelectedNodes(layout = 'grid') {
  const nodes = selectedRealNodes().filter(node => node.type !== 'group');
  if (nodes.length < 2) {
    setStatus('请先框选两个以上节点再使用布局');
    return;
  }
  const sorted = [...nodes].sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y);
  const bounds = boundsForNodes(sorted);
  const gap = 28;
  if (layout === 'horizontal') {
    let x = bounds.minX;
    sorted.forEach(node => {
      node.x = Math.round(x);
      node.y = Math.round(bounds.minY);
      x += (node.w || 220) + gap;
    });
  } else if (layout === 'vertical') {
    let y = bounds.minY;
    sorted.forEach(node => {
      node.x = Math.round(bounds.minX);
      node.y = Math.round(y);
      y += (node.h || 120) + gap;
    });
  } else {
    const columns = Math.ceil(Math.sqrt(sorted.length));
    const maxW = Math.max(...sorted.map(node => node.w || 220));
    const maxH = Math.max(...sorted.map(node => node.h || 120));
    const cell = Math.max(maxW, maxH) + gap;
    sorted.forEach((node, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      node.x = Math.round(bounds.minX + col * cell);
      node.y = Math.round(bounds.minY + row * cell);
    });
  }
  updateGroupsForMembers(sorted.map(node => node.id));
  render();
  saveCanvas();
  const label = layout === 'horizontal' ? '水平一排' : layout === 'vertical' ? '垂直一列' : '宫格网格';
  setStatus(`已按${label}排列 ${sorted.length} 个节点`);
}

function groupSelectedNodes() {
  const nodes = selectedRealNodes();
  if (nodes.length < 2) {
    setStatus('请先选择两个以上节点再打组');
    return;
  }
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
  setStatus(`已打组 ${nodes.length} 个节点`);
}

function ungroupSelectedNodes() {
  const groups = selectedGroupNodes();
  if (!groups.length) {
    setStatus('请先选择一个分组再解组');
    return;
  }
  const memberIds = [...new Set(groups.flatMap(group => group.members || []))];
  state.nodes = state.nodes.filter(node => !groups.some(group => group.id === node.id));
  state.links = state.links.filter(link => state.nodes.some(node => node.id === link.from) && state.nodes.some(node => node.id === link.to));
  state.selectedIds = memberIds.filter(id => state.nodes.some(node => node.id === id));
  state.selectedId = state.selectedIds[0] || null;
  state.selectedLinkId = null;
  render();
  saveCanvas();
  setStatus(`已解组 ${groups.length} 个分组`);
}

function toggleGroupSelection() {
  if (selectedGroupNodes().length) {
    ungroupSelectedNodes();
  } else {
    groupSelectedNodes();
  }
}

function disableTargetIdsForSelection() {
  const ids = new Set([...(state.selectedIds || []), state.selectedId].filter(Boolean));
  for (const group of selectedGroupNodes()) {
    ids.add(group.id);
    for (const memberId of group.members || []) ids.add(memberId);
  }
  return [...ids].filter(id => state.nodes.some(node => node.id === id));
}

function toggleDisableSelectedNodes() {
  const ids = disableTargetIdsForSelection();
  if (!ids.length) {
    setStatus('请先选中一个节点或分组');
    return;
  }
  const nodes = state.nodes.filter(node => ids.includes(node.id));
  const shouldDisable = nodes.some(node => !node.disabled);
  for (const node of nodes) node.disabled = shouldDisable;
  render();
  saveCanvas();
  setStatus(shouldDisable ? `已临时隐藏 ${nodes.length} 个节点` : `已恢复 ${nodes.length} 个节点`);
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
  loadThemeMode();
  await loadConfig();
  loadGridSettings();
  loadPromptPresets();
  loadCustomSkills();
  renderAgentSkillMenu();
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









