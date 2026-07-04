const state = {
  nodes: [],
  links: [],
  selectedId: null,
  selectedIds: [],
  generationHistory: [],
  assetFilter: 'all',
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
  config: null,
  undoStack: [],
  lastSnapshot: '',
  restoring: false,
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
  menuTitle: document.querySelector('#menuTitle'),
  status: document.querySelector('#status'),
  prompt: document.querySelector('#prompt'),
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
};

function uid(prefix = 'node') {
  return `${prefix}_${Math.random().toString(16).slice(2, 10)}`;
}

function setStatus(text) {
  els.status.textContent = text;
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
  return JSON.stringify({
    nodes: state.nodes,
    links: state.links,
    pan: state.pan,
    scale: state.scale,
    generationHistory: state.generationHistory,
  });
}

function restoreSnapshot(snapshot) {
  const data = JSON.parse(snapshot);
  state.nodes = (data.nodes || []).map(normalizeNode);
  state.links = data.links || [];
  state.pan = data.pan || state.pan;
  state.scale = data.scale || state.scale;
  state.generationHistory = data.generationHistory || [];
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
  localStorage.setItem('ai-canvas-studio', snapshot);
  setStatus('画布已保存');
}

function loadCanvas() {
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
    return;
  }
  try {
    const data = JSON.parse(saved);
    state.nodes = (data.nodes || []).map(normalizeNode);
    state.links = data.links || [];
    state.pan = data.pan || state.pan;
    state.scale = data.scale || state.scale;
    state.generationHistory = data.generationHistory || [];
    state.lastSnapshot = canvasSnapshot();
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

function normalizeNode(node) {
  if (!node) return node;
  if (['t2i', 'i2i'].includes(node.type) && !['banana', 'image2'].includes(node.model)) {
    node.model = 'image2';
  }
  if (['t2i', 'i2i'].includes(node.type) && (!node.quality || (node.quality === '4k' && !node.qualityMigrated))) {
    node.quality = '2k';
    node.qualityMigrated = true;
  }
  if (['t2v', 'i2v'].includes(node.type)) {
    node.model = 'doubao-seedance-2.0';
  }
  return node;
}

function addNode(type, x, y, data = {}) {
  const node = {
    id: uid(type),
    type,
    x,
    y,
    w: data.w || (['t2v', 'i2v'].includes(type) ? 300 : ['t2i', 'i2i'].includes(type) ? 520 : 220),
    h: data.h || 120,
    title: data.title || typeNames[type] || '节点',
    text: data.text || '',
    url: data.url || '',
    mime: data.mime || '',
    kind: data.kind || type,
    role: data.role || roleForType(type),
    ratio: data.ratio || '16:9',
    duration: data.duration || 5,
    model: data.model || defaultModelForType(type),
    generateAudio: data.generateAudio || false,
    watermark: data.watermark || false,
    aspect: data.aspect || '16:9',
    quality: data.quality || '2k',
    resolution: data.resolution || '720p',
    imageCount: data.imageCount || 1,
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
    createdAt: Date.now(),
  };
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
    div.className = `node ${node.type}${selectedClass}`;
    div.style.left = `${node.x}px`;
    div.style.top = `${node.y}px`;
    div.style.width = `${node.w}px`;
    div.style.setProperty('--preview-ratio', previewRatioForNode(node));
    if (isGeneratorType(node.type)) {
      node.h = previewHeightForNode(node);
      div.style.height = `${node.h}px`;
    } else if (node.h) {
      div.style.height = `${node.h}px`;
    }
    div.dataset.id = node.id;
    div.innerHTML = nodeHTML(node);
    els.world.appendChild(div);
  }
  renderParamPanel();
  renderLinks();
  updateNodeInfo();
  renderAssets();
  renderHistory();
}

function nodeHTML(node) {
  const title = escapeHtml(node.title || typeNames[node.type] || '节点');
  const head = `<div class="node-head"><span>${title}</span><button class="node-delete" data-delete-node title="删除">脳</button></div>`;
  let body = '';
  if (node.type === 'group') {
    body = `<div class="group-label">${escapeHtml(node.members?.length || 0)} nodes</div>`;
  } else if (node.type === 'image' && node.url) {
    body = `<img src="${node.url}" alt="" draggable="false"><div class="pill">${escapeHtml(node.role || 'reference_image')}</div>`;
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
    body = imageGeneratorHTML(node);
  } else if (node.type === 'text' || node.type === 'script') {
    const placeholder = node.type === 'script' ? '写脚本或请求草稿...' : '输入提示词或文本...';
    body = `<textarea data-field="text" placeholder="${placeholder}">${escapeHtml(node.text)}</textarea>`;
  } else {
    body = `<div>${escapeHtml(node.text || '空节点')}</div>`;
  }
  const input = canInput(node.type) ? '<div class="port in" data-port="in" title="输入"></div>' : '';
  const output = canOutput(node.type) ? '<div class="port out" data-port="out" title="输出"></div>' : '';
  return `${input}${output}${head}<div class="node-body">${body}</div><div class="resize-handle" title="拖动调整大小"></div>`;
}

function imageGeneratorHTML(node) {
  const output = node.resultUrl
    ? `<img class="image-output" src="${node.resultUrl}" alt="" draggable="false">`
    : '<div class="image-output-empty">Image</div>';
  const download = node.resultUrl ? `<a class="node-download" href="${node.resultUrl}" download title="下载图片">下载</a>` : '';
  const status = node.taskStatus ? `<div class="preview-status ${node.taskStatus}">${escapeHtml(node.progressText || node.taskStatus)}${progressBarHTML(node)}</div>` : '';
  return `<div class="image-node-preview">${output}${download}${status}</div>`;
}

function imageParamPanelHTML(node) {
  const status = node.taskStatus ? `<div class="node-progress ${node.taskStatus}">${escapeHtml(node.progressText || node.taskStatus)}${progressBarHTML(node, true)}</div>` : '';
  return `
    <div class="image-params">
      ${node.type === 'i2i' ? referenceImageStripHTML(node) : ''}
      ${node.type === 'i2i' ? `
        <label class="node-label">提示词</label>
        <textarea class="param-prompt" data-field="text" placeholder="描述这组参考图要怎么变化...">${escapeHtml(node.text || '')}</textarea>
      ` : ''}
      <div class="image-param-row">
        <select data-field="model">
          ${['banana', 'image2'].map(v => `<option ${node.model === v ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
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
    render();
    saveCanvas();
  }, 1200);
}

function videoGeneratorHTML(node) {
  const src = node.resultUrl || '';
  const preview = src
    ? `<video class="node-video-output" src="${src}" controls></video>`
    : '<div class="node-video-empty">视频预览</div>';
  const status = node.taskStatus ? `<div class="preview-status ${node.taskStatus}">${escapeHtml(node.progressText || node.taskStatus)}</div>` : '';
  return `<div class="node-preview-shell">${preview}${status}</div>`;
}

function videoParamPanelHTML(node) {
  const status = node.taskStatus ? `<div class="node-progress ${node.taskStatus}">${escapeHtml(node.progressText || node.taskStatus)}</div>` : '';
  return `
    ${node.type === 'i2v' ? referenceImageStripHTML(node) : ''}
    ${node.type === 'i2v' ? `
      <label class="node-label">提示词</label>
      <textarea class="param-prompt" data-field="text" placeholder="描述参考图如何运动、镜头和动作...">${escapeHtml(node.text || '')}</textarea>
    ` : ''}
    <div class="node-grid">
      <div>
        <label class="node-label">姣斾緥</label>
        <select data-field="ratio">
          ${['16:9', '9:16', '1:1', '4:3', '3:4'].map(v => `<option ${node.ratio === v ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="node-label">鏃堕暱</label>
        <input data-field="duration" type="number" min="1" max="15" value="${escapeHtml(node.duration)}">
      </div>
      <div>
        <label class="node-label">Resolution</label>
        <select data-field="resolution">
          ${['480p', '720p', '1080p', '2k'].map(v => `<option ${node.resolution === v ? 'selected' : ''}>${v}</option>`).join('')}
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
  panel.style.top = `${node.y + previewHeightForNode(node) + 12}px`;
  panel.style.width = `${node.panelW || Math.max(520, node.w)}px`;
  panel.style.minHeight = `${node.panelH || 180}px`;
  panel.innerHTML = `
    <div class="param-panel-body">
      ${['t2i', 'i2i'].includes(node.type) ? imageParamPanelHTML(node) : videoParamPanelHTML(node)}
    </div>
    <div class="panel-resize-handle" title="鎷栧姩璋冩暣鍙傛暟闈㈡澘"></div>
  `;
  els.world.appendChild(panel);
}
function referenceImageStripHTML(node) {
  const refs = referencesForNode(node.id).filter(r => r.kind === 'image');
  const refStrip = refs.map((ref, index) => `
    <div class="image-ref-card" draggable="true" data-ref-index="${index}">
      <img class="image-ref-thumb" src="${ref.url}" alt="">
      <span>图片${index + 1}</span>
    </div>
  `).join('');
  return `
    <div class="image-ref-row">
      ${refStrip}
      <button class="image-add-ref" data-add-ref>+<span>添加</span></button>
    </div>
  `;
}

function renderAssets() {
  if (!els.assetList) return;
  const assets = state.nodes
    .filter(n => ['image', 'video', 'audio'].includes(n.type) && n.url)
    .map(n => ({ ...n, category: assetCategory(n) }))
    .filter(n => state.assetFilter === 'all' || n.category === state.assetFilter);
  els.assetList.innerHTML = assets.length
    ? assets.map(n => assetCardHTML(n)).join('')
    : '<div class="asset-item">暂无资产，右键上传素材</div>';
}

function assetCardHTML(n) {
  const media = n.type === 'image'
    ? `<img src="${n.url}" alt="">`
    : n.type === 'video'
      ? `<video src="${n.url}" muted></video>`
      : '<div class="asset-audio">音频</div>';
  return `
    <div class="asset-card" data-asset="${n.id}">
      <div class="asset-thumb">${media}</div>
      <div class="asset-name">${escapeHtml(n.title)}</div>
      <div class="asset-kind">${assetCategoryName(n.category)}</div>
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
  return { person: '浜虹墿', scene: '鍦烘櫙', object: '鐗╁搧', style: '椋庢牸', other: '鍏朵粬' }[category] || '鍏朵粬';
}

function renderHistory() {
  if (!els.historyList) return;
  const items = state.generationHistory.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 200);
  els.historyList.innerHTML = items.length
    ? items.map(item => `<div class="history-item" data-history-result="${item.id}">${escapeHtml(item.title)}<br>${escapeHtml(item.kind)}${item.status ? ` 路 ${escapeHtml(item.status)}` : ''}</div>`).join('')
    : '<div class="history-item">鏆傛棤生成鍘嗗彶</div>';
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
  return ['text', 'prompt', 'image', 'video', 'audio', 'script', 'result', 'world', 't2i', 'i2i', 't2v', 'i2v'].includes(type);
}

function canInput(type) {
  return ['image', 'video', 'audio', 'i2i', 'i2v', 't2v', 't2i', 'script', 'result', 'world'].includes(type);
}

function eventNodeElement(target) {
  return target.closest('.node, .param-panel');
}

function renderLinks() {
  els.links.innerHTML = '';
  for (const link of state.links) {
    if (!link.id) link.id = uid('link');
    const a = state.nodes.find(n => n.id === link.from);
    const b = state.nodes.find(n => n.id === link.to);
    if (!a || !b) continue;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const x1 = a.x + a.w;
    const y1 = a.y + 48;
    const x2 = b.x;
    const y2 = b.y + 48;
    const dx = Math.max(80, Math.abs(x2 - x1) * 0.35);
    path.setAttribute('d', `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'rgba(128,150,178,.55)');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('class', `link-path${link.id === state.selectedLinkId ? ' selected' : ''}`);
    path.dataset.id = link.id;
    els.links.appendChild(path);
  }
  if (state.linking) {
    const sourceIds = state.linking.sourceIds || [state.linking.sourceId];
    for (const sourceId of sourceIds) {
      const source = state.nodes.find(n => n.id === sourceId);
      if (!source) continue;
      drawTempLink({ x: source.x + source.w, y: source.y + 53 }, state.linking.to);
    }
  }
  if (!state.linking && state.pendingLink?.point) {
    for (const fromId of pendingFromIds()) {
      const source = state.nodes.find(n => n.id === fromId);
      if (!source) continue;
      drawTempLink({ x: source.x + source.w, y: source.y + 53 }, state.pendingLink.point);
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

function drawTempLink(from, to) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const dx = Math.max(80, Math.abs(to.x - from.x) * 0.35);
  path.setAttribute('d', `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-width', '3');
  path.setAttribute('class', 'temp-link');
  els.links.appendChild(path);
}

function linkNearPoint(link, point, threshold = 10) {
  const a = state.nodes.find(n => n.id === link.from);
  const b = state.nodes.find(n => n.id === link.to);
  if (!a || !b) return false;
  const x1 = a.x + a.w;
  const y1 = a.y + 48;
  const x2 = b.x;
  const y2 = b.y + 48;
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

function hideMenu() {
  els.menu.classList.add('hidden');
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
  els.menu.classList.remove('hidden');
  renderLinks();
}

async function uploadFiles(files, point) {
  if (!files.length) return;
  const form = new FormData();
  for (const file of files) form.append('files', file);
  setStatus('上传中...');
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  const data = await readJsonResponse(res);
  let x = point.x;
  let y = point.y;
  const created = [];
  for (const file of data.files || []) {
    const node = addNode(file.kind === 'file' ? 'text' : file.kind, x, y, {
      title: file.name,
      url: file.url,
      mime: file.mime,
      kind: file.kind,
    });
    created.push(node);
    x += 250;
  }
  if (state.pendingLink && created[0]) {
    connectPendingTo(created[0].id);
  }
  renderAssets();
  renderHistory();
  setStatus('上传完成');
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
    if (targetNode && ['t2i', 'i2i', 'i2v'].includes(targetNode.type)) {
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
  if (linkedIds.length && ['t2i', 'i2i', 'i2v'].includes(targetNode.type)) {
    targetNode.refOrder = [
      ...(targetNode.refOrder || []).filter(id => !linkedIds.includes(id)),
      ...linkedIds,
    ];
  }
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
  if (/^https?:\/\//.test(url)) return url;
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

  node.model = 'doubao-seedance-2.0';
  node.taskStatus = 'queued';
  node.progressText = '正在提交生成任务...';
  node.resultUrl = '';
  render();
  saveCanvas();

  const payload = {
    mode: node.type,
    prompt,
    model: 'doubao-seedance-2.0',
    ratio: node.ratio || '16:9',
    duration: Number(node.duration || 5),
    resolution: node.resolution || '720p',
    generateAudio: !!node.generateAudio,
    watermark: !!node.watermark,
    references: referencesForNode(node.id),
    clientConfig: state.config,
  };

  let progressTimer = null;
  try {
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
  node.taskStatus = 'queued';
  node.progressText = '正在提交生图任务...';
  node.progressPercent = 12;
  node.resultUrl = '';
  render();
  saveCanvas();
  const payload = {
    mode: node.type,
    prompt,
    model: node.model || 'banana',
    ratio: node.aspect || '16:9',
    quality: node.quality || '2k',
    imageCount: Number(node.imageCount || 1),
    references: node.type === 'i2i' ? referencesForNode(node.id) : [],
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
    if (data.url) {
      node.resultUrl = data.url;
      node.url = data.url;
      node.mime = 'image/png';
      node.taskStatus = 'succeeded';
      node.progressPercent = 100;
      node.progressText = '生成成功';
      addGenerationHistory({
        title: `${node.model || 'image2'} 输出`,
        kind: node.type === 'i2i' ? '图生图' : '文生图',
        url: data.url,
        mime: 'image/png',
      });
      render();
      saveCanvas();
    }
  } catch (err) {
    node.taskStatus = 'failed';
    node.progressText = `提交失败：${err.message}`;
    render();
    saveCanvas();
  }
}

function linkedPromptText(nodeId) {
  const sourceIds = state.links.filter(l => l.to === nodeId).map(l => l.from);
  const promptNode = state.nodes.find(n => sourceIds.includes(n.id) && ['prompt', 'text'].includes(n.type));
  return promptNode?.text?.trim() || '';
}

function referencesForNode(nodeId) {
  const sourceIds = state.links.filter(l => l.to === nodeId).map(l => l.from);
  const pool = sourceIds.length ? state.nodes.filter(n => sourceIds.includes(n.id)) : state.nodes;
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
      node.mime = 'video/mp4';
      node.title = `${node.model || 'doubao-seedance-2.0'} 输出`;
      node.progressText = '生成成功';
      addGenerationHistory({
        title: node.title,
        kind: node.type === 'i2v' ? '图生视频' : '文生视频',
        url: task.url,
        mime: 'video/mp4',
      });
      render();
      saveCanvas();
      return;
    }
    if (task.status === 'failed') {
      node.progressText = task.error || '生成失败';
      render();
      saveCanvas();
      return;
    }
    render();
    saveCanvas();
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
  if (task.status === 'succeeded') return '生成鎴愬姛';
  if (task.status === 'failed') return task.error || '生成失败';
  return `鐘舵€侊細${task.status}`;
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

function taskHTML(task) {
  const url = task.url ? `<br><a href="${task.url}" target="_blank">鎵撳紑缁撴灉</a>` : '';
  const err = task.error ? `<br><span style="color:#ef9aa0">${escapeHtml(task.error).slice(0, 160)}</span>` : '';
  return `<div class="task">
    <strong>${escapeHtml(task.model || '')}</strong><br>
    ${escapeHtml(task.id)}<br>
    鐘舵€侊細${escapeHtml(task.status || '')}${url}${err}
  </div>`;
}

async function loadConfig() {
  const res = await fetch('/api/config');
  const remoteConfig = await res.json();
  state.config = mergeConfig(remoteConfig, localUserConfig());
  applyConfigToUI();
}

function applyConfigToUI() {
  const cfg = state.config;
  if (els.ratio) els.ratio.value = cfg.defaults.ratio;
  if (els.duration) els.duration.value = cfg.defaults.duration;
  if (els.generateAudio) els.generateAudio.checked = !!cfg.defaults.generateAudio;
  if (els.watermark) els.watermark.checked = !!cfg.defaults.watermark;
  fillModelSelect();

  document.querySelector('#maasBaseUrl').value = cfg.apis.maas.baseUrl || '';
  document.querySelector('#maasApiKey').value = cfg.apis.maas.apiKey || '';
  document.querySelector('#maasWebsite').value = cfg.apis.maas.website || '';
  document.querySelector('#bananaApiKey').value = cfg.apis.banana.apiKey || '';
  document.querySelector('#bananaWebsite').value = cfg.apis.banana.website || '';
  document.querySelector('#image2ApiKey').value = cfg.apis.image2.apiKey || '';
  document.querySelector('#image2Website').value = cfg.apis.image2.website || '';
  document.querySelector('#image2ModelName').value = cfg.apis.image2.modelName || 'gpt-image-2';
  document.querySelector('#videoModels').value = (cfg.models.video || []).join(', ');
  document.querySelector('#imageModels').value = (cfg.models.image || []).join(', ');
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
  return cfg.defaults?.videoModel || cfg.models?.video?.[0] || 'doubao-seedance-2.0';
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

async function saveSettings() {
  const cfg = state.config;
  cfg.apis.maas.baseUrl = document.querySelector('#maasBaseUrl').value.trim();
  cfg.apis.maas.apiKey = document.querySelector('#maasApiKey').value.trim();
  cfg.apis.maas.website = document.querySelector('#maasWebsite').value.trim();
  cfg.apis.banana.apiKey = document.querySelector('#bananaApiKey').value.trim();
  cfg.apis.banana.website = document.querySelector('#bananaWebsite').value.trim();
  cfg.apis.image2.apiKey = document.querySelector('#image2ApiKey').value.trim();
  cfg.apis.image2.website = document.querySelector('#image2Website').value.trim();
  cfg.apis.image2.modelName = document.querySelector('#image2ModelName').value.trim() || 'gpt-image-2';
  cfg.models.video = document.querySelector('#videoModels').value.split(',').map(s => s.trim()).filter(Boolean);
  cfg.models.image = document.querySelector('#imageModels').value.split(',').map(s => s.trim()).filter(Boolean);
  if (!cfg.models.video.includes('doubao-seedance-2.0')) {
    cfg.models.video.unshift('doubao-seedance-2.0');
  }
  cfg.defaults.videoModel = 'doubao-seedance-2.0';
  cfg.defaults.imageModel = cfg.models.image[0] || 'banana';
  persistUserConfig(cfg);
  await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cfg),
  }).catch(() => {});
  state.config = cfg;
  fillModelSelect();
  els.settings.classList.add('hidden');
  setStatus('设置已保存');
}

function bindEvents() {
  let draggingStage = false;
  let draggingNode = null;
  let draggingGroup = null;
  let resizingNode = null;
  let resizingPanel = null;
  let last = { x: 0, y: 0 };

  els.stage.addEventListener('contextmenu', event => {
    event.preventDefault();
    state.menuPoint = screenToWorld(event.clientX, event.clientY);
    showMenu(event.clientX, event.clientY);
  });

  document.addEventListener('click', event => {
    if (!els.menu.contains(event.target)) hideMenu();
  });

  els.stage.addEventListener('mousedown', event => {
    hideMenu();
    last = { x: event.clientX, y: event.clientY };
    if (state.scissors) {
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
    const port = event.target.closest('.port');
    if (port) {
      event.stopPropagation();
      const nodeEl = event.target.closest('.node');
      const node = state.nodes.find(n => n.id === nodeEl.dataset.id);
      if (!node || port.dataset.port !== 'out') return;
      state.selectedId = node.id;
      state.selectedLinkId = null;
      const sourceIds = state.selectedIds.includes(node.id) && state.selectedIds.length > 1
        ? state.selectedIds.filter(id => canOutput(state.nodes.find(n => n.id === id)?.type))
        : [node.id];
      state.linking = {
        sourceId: node.id,
        sourceIds,
        from: { x: node.x + node.w, y: node.y + 53 },
        to: screenToWorld(event.clientX, event.clientY),
      };
      render();
      return;
    }
    const nodeEl = event.target.closest('.node');
    if (nodeEl) {
      const id = nodeEl.dataset.id;
      const clickedNode = state.nodes.find(n => n.id === id);
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
    if (resizingNode) {
      const node = state.nodes.find(n => n.id === resizingNode.id);
      node.w = Math.max(180, (node.w || resizingNode.startW) + dx / state.scale);
      node.h = isGeneratorType(node.type)
        ? previewHeightForNode(node)
        : Math.max(110, (node.h || resizingNode.startH) + dy / state.scale);
      resizingNode.el.style.width = `${node.w}px`;
      resizingNode.el.style.height = `${node.h}px`;
      const panel = document.querySelector(`.param-panel[data-id="${node.id}"]`);
      if (panel) {
        panel.style.left = `${node.x}px`;
        panel.style.top = `${node.y + previewHeightForNode(node) + 12}px`;
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
    if (state.scissors) {
      if (cutLinkAt(event.clientX, event.clientY)) return;
    }
    if (state.linking) {
      state.linking.to = screenToWorld(event.clientX, event.clientY);
      scheduleRenderLinks();
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
        panel.style.top = `${node.y + previewHeightForNode(node) + 12}px`;
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
    if (state.selecting) {
      finishSelection(event.clientX, event.clientY);
      state.selecting = null;
      els.selectionBox.classList.add('hidden');
      render();
      saveCanvas();
      return;
    }
    if (state.linking) {
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest?.('.node');
      const targetNode = target ? state.nodes.find(n => n.id === target.dataset.id) : null;
      if (targetNode && targetNode.id !== state.linking.sourceId && canInput(targetNode.type)) {
        linkManyToTarget(state.linking.sourceIds || [state.linking.sourceId], targetNode.id);
        state.selectedLinkId = state.links[state.links.length - 1]?.id || null;
        state.selectedId = null;
        state.pendingLink = null;
      } else {
        state.pendingLink = {
          from: state.linking.sourceId,
          fromIds: state.linking.sourceIds || [state.linking.sourceId],
          point: screenToWorld(event.clientX, event.clientY),
        };
        state.menuPoint = state.pendingLink.point;
        showMenu(event.clientX, event.clientY, { keepPendingLink: true });
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
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      selectAllNodes();
      return;
    }
    if (event.code === 'Space') {
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
    if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      focusSelectedNode();
      return;
    }
    if (event.key.toLowerCase() === 'y') {
      state.scissors = true;
      els.stage.classList.add('scissors');
      setStatus('剪刀模式：划过关系线即可删除');
      return;
    }
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    if (state.selectedIds.length > 1) {
      for (const id of [...state.selectedIds]) deleteNode(id, { silent: true });
      state.selectedIds = [];
      render();
      saveCanvas();
      setStatus('宸插垹闄ら€変腑节点');
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
    if (event.key.toLowerCase() === 'y') {
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
    } else if (event.target.type === 'number') {
      node[field] = Number(event.target.value);
    } else {
      node[field] = event.target.value;
    }
    if (field === 'quality') node.qualityMigrated = true;
      if (els.prompt && (node.type === 'prompt' || node.type === 't2v' || node.type === 'i2v')) {
        els.prompt.value = node.text || '';
      }
    saveCanvas();
  });

  els.world.addEventListener('change', event => {
    const nodeEl = eventNodeElement(event.target);
    const field = event.target.dataset.field;
    if (!nodeEl || !field) return;
    const node = state.nodes.find(n => n.id === nodeEl.dataset.id);
    if (event.target.type === 'checkbox') {
      node[field] = event.target.checked;
    } else if (event.target.type === 'number') {
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

  els.world.addEventListener('dragstart', event => {
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

  document.querySelectorAll('.segmented button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.segmented button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.mode = btn.dataset.mode;
      fillModelSelect();
      if (isVideoMode(state.mode)) {
        selectVideoModel();
        setStatus(`已切换为视频模型：${videoModelName()}`);
      } else {
        setStatus('已切换为生图模型');
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
        state.scale = 1;
        state.pan = { x: -49800, y: -49800 };
        applyTransform();
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
    uploadFiles([...els.fileInput.files], state.menuPoint);
    els.fileInput.value = '';
  });

  els.imageInput.addEventListener('change', () => {
    uploadFiles([...els.imageInput.files], state.menuPoint);
    els.imageInput.value = '';
  });

  els.videoInput.addEventListener('change', () => {
    uploadFiles([...els.videoInput.files], state.menuPoint);
    els.videoInput.value = '';
  });

  els.audioInput.addEventListener('change', () => {
    uploadFiles([...els.audioInput.files], state.menuPoint);
    els.audioInput.value = '';
  });

  document.querySelectorAll('.rail-item').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!btn.dataset.tab) return;
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
    const asset = state.nodes.find(n => n.id === item.dataset.asset);
    if (!asset) return;
    const p = screenToWorld(window.innerWidth / 2, window.innerHeight / 2);
    addNode(asset.type, p.x, p.y, {
      title: asset.title,
      url: asset.url,
      mime: asset.mime,
      kind: asset.kind,
      role: asset.role,
    });
  });

  document.querySelectorAll('[data-asset-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-asset-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.assetFilter = btn.dataset.assetFilter;
      renderAssets();
    });
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
    setStatus('Select a node first');
    return;
  }
  if (node.maximizedFrom) {
    Object.assign(node, node.maximizedFrom);
    delete node.maximizedFrom;
    render();
    saveCanvas();
    setStatus('Node restored');
    return;
  }
  const rect = els.stage.getBoundingClientRect();
  const center = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
  const targetW = Math.min(920, Math.max(520, Math.round((rect.width / state.scale) * 0.72)));
  const targetH = Math.min(680, Math.max(340, Math.round((rect.height / state.scale) * 0.72)));
  node.maximizedFrom = {
    x: node.x,
    y: node.y,
    w: node.w,
    h: node.h,
  };
  node.w = targetW;
  node.h = isGeneratorType(node.type) ? previewHeightForNode(node) : targetH;
  node.x = center.x - node.w / 2;
  node.y = center.y - node.h / 2;
  updateGroupsForMembers([node.id]);
  render();
  saveCanvas();
  setStatus('Node maximized');
}

function focusSelectedNode() {
  const node = selectedNode();
  if (!node) {
    setStatus('Select a node first');
    return;
  }
  state.scale = Math.min(2.2, Math.max(1.15, state.scale * 1.08));
  focusNode(node.id);
  saveCanvas();
  setStatus('Node centered');
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
  const nodes = selectedRealNodes();
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
  setStatus(`Arranged ${nodes.length} nodes`);
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
    copy.title = `${copy.title || typeNames[copy.type] || '节点'} 鍓湰`;
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
  applyTransform();
  bindEvents();
  loadCanvas();
  render();
  setInterval(pollTasks, 5000);
  pollTasks();
}

init();







