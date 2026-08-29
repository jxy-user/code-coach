// DOM 渲染 + 轻量 markdown 渲染（无外部依赖）

// ---------- 工具 ----------
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inline(s) {
  let out = escapeHtml(s);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return out;
}

// 轻量 markdown：代码块 / 标题 / 列表 / 段落 / 行内样式
export function renderMarkdown(md) {
  if (!md) return '';
  const parts = String(md).split(/(```[\s\S]*?```)/g);
  let out = '';
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('```')) {
      const inner = part.replace(/^```[^\n]*\n?/, '').replace(/```\s*$/, '');
      out += `<pre><code>${escapeHtml(inner)}</code></pre>`;
    } else {
      out += renderBlocks(part);
    }
  }
  return out;
}

function renderBlocks(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let out = '';
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { i++; continue; }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) { out += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`; i++; continue; }
    const ul = line.match(/^\s*[-*+]\s+(.*)$/);
    if (ul) {
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(/^\s*[-*+]\s+(.*)$/);
        if (!m) break;
        items.push(`<li>${inline(m[1])}</li>`);
        i++;
      }
      out += `<ul>${items.join('')}</ul>`;
      continue;
    }
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ol) {
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(/^\s*\d+[.)]\s+(.*)$/);
        if (!m) break;
        items.push(`<li>${inline(m[1])}</li>`);
        i++;
      }
      out += `<ol>${items.join('')}</ol>`;
      continue;
    }
    const para = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) &&
      !/^#{1,4}\s/.test(lines[i]) && !/^\s*[-*+]\s/.test(lines[i]) && !/^\s*\d+[.)]\s/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    out += `<p>${inline(para.join(' '))}</p>`;
  }
  return out;
}

// ---------- 区段开关 ----------
export function hideOnboarding() {
  const el = document.getElementById('onboarding');
  if (el) el.hidden = true;
}
export function showFooter() {
  const el = document.getElementById('footer');
  if (el) el.hidden = false;
}

// ---------- 进度 / 配置 ----------
export function renderProgress(progress, totalExercises) {
  const done = progress?.totalCompleted ?? 0;
  const fill = document.getElementById('progress-fill');
  const label = document.getElementById('progress-label');
  const pct = totalExercises > 0 ? Math.round((done / totalExercises) * 100) : 0;
  if (fill) fill.style.width = pct + '%';
  if (label) label.textContent = `${done} / ${totalExercises} 题`;
  const streak = document.getElementById('streak-badge');
  if (streak) {
    const s = progress?.streak ?? 0;
    streak.hidden = s <= 0;
    streak.textContent = '🔥 ' + s;
  }
  const level = document.getElementById('level-badge');
  if (level) level.textContent = 'Lv.' + (1 + Math.floor(done / 3));
}

export function renderConfigHint(config) {
  const el = document.getElementById('config-hint');
  if (!el) return;
  if (config?.hasApiKey) {
    el.textContent = `已连接：${config.model}${config.baseURL ? ' @ ' + config.baseURL : ''}`;
  } else {
    el.textContent = '尚未配置 API Key（点「配置」或命令面板 CodeCoach: 设置 API Key）';
  }
}

// ---------- 讲解 / 题卡 / 提示 ----------
export function renderLesson(topic) {
  const el = document.getElementById('lesson');
  el.hidden = false;
  el.innerHTML = `<h2>📖 ${escapeHtml(topic)}</h2><div class="md" id="lesson-md"></div>`;
}

export function renderExercise(exercise) {
  const el = document.getElementById('exercise');
  el.hidden = false;
  const diffCls = 'difficulty-' + exercise.difficulty;
  const tags = (exercise.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join(' ');
  el.innerHTML = `
    <div class="exercise-head">
      <h2>${escapeHtml(exercise.title)}</h2>
      <span class="difficulty ${diffCls}">${escapeHtml(exercise.difficulty)}</span>
      ${tags}
    </div>
    <div class="md">${renderMarkdown(exercise.description)}</div>
    <div class="row">
      <button class="btn btn-secondary" data-cmd="openExerciseFile">打开练习文件</button>
    </div>
    <div class="md" id="instant-md"></div>
  `;
}

export function renderHints(hints) {
  const el = document.getElementById('hints');
  if (!hints || hints.length === 0) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = '<h2>💡 提示</h2>' + hints.map((h, i) => `
    <div class="hint-item">
      <button class="hint-toggle" data-hint="${i}">提示 ${i + 1}</button>
      <div class="hint-body" id="hint-body-${i}">${renderMarkdown(h)}</div>
    </div>
  `).join('');
}

// ---------- 评测结果 ----------
export function renderTestResult(result) {
  const el = document.getElementById('feedback');
  el.hidden = false;
  let html = '<div class="card feedback-bubble test-summary">';
  if (!result.compile.ok) {
    html += `<div class="verdict fail">✗ 编译失败</div>`;
    html += `<div class="compile-errors">${escapeHtml((result.compile.errors || []).join('\n'))}</div>`;
  } else {
    const cls = result.allPass ? 'pass' : 'fail';
    const txt = result.allPass ? '✓ 全部通过' : '✗ 未全部通过';
    html += `<div class="verdict ${cls}">${txt}（${result.passed}/${result.total}，${result.elapsedMs}ms）</div>`;
    html += '<div class="case-list">';
    for (const c of result.cases) {
      html += `<span class="case-pill ${c.status}" data-case="${c.index}">#${c.index + 1} ${statusLabel(c.status)}</span>`;
    }
    html += '</div><div id="case-details"></div>';
  }
  html += '</div>';
  el.insertAdjacentHTML('beforeend', html);
}

function statusLabel(s) {
  return { pass: '通过', fail: '失败', runtimeError: '异常', timeout: '超时', oom: '内存溢出' }[s] || s;
}

export function renderCaseDetail(result, index) {
  const c = result?.cases?.[index];
  const container = document.getElementById('case-details');
  if (!c || !container) return;
  container.innerHTML = `<div class="case-detail">
    <div><strong>输入</strong><pre>${escapeHtml(c.input)}</pre></div>
    <div><strong>期望输出</strong><pre>${escapeHtml(c.expected)}</pre></div>
    <div><strong>实际输出</strong><pre>${escapeHtml(c.actual || c.error || '')}</pre></div>
  </div>`;
}

// ---------- 反馈 / 错误 ----------
export function renderFeedback(markdown) {
  const el = document.getElementById('feedback');
  el.hidden = false;
  const bubble = document.createElement('div');
  bubble.className = 'card feedback-bubble';
  bubble.innerHTML = `<div class="md">${renderMarkdown(markdown)}</div>`;
  el.appendChild(bubble);
}

export function renderError(message) {
  const el = document.getElementById('feedback');
  if (el) el.hidden = false;
  const box = document.createElement('div');
  box.className = 'error-box';
  box.textContent = message;
  if (el) el.appendChild(box);
}

// ---------- 流式容器 ----------
const STREAM_CONTAINER = { lesson: 'lesson-md', instant: 'instant-md', feedback: 'feedback-md', help: 'help-md' };

export function ensureStreamContainer(id) {
  const cid = STREAM_CONTAINER[id] || id + '-md';
  let el = document.getElementById(cid);
  if (!el) {
    if (id === 'feedback' || id === 'help') {
      const parent = document.getElementById('feedback');
      if (parent) {
        const bubble = document.createElement('div');
        bubble.className = 'card feedback-bubble';
        bubble.innerHTML = `<div class="md" id="${cid}"></div>`;
        parent.appendChild(bubble);
        el = document.getElementById(cid);
      }
    } else if (id === 'instant') {
      const ex = document.getElementById('exercise');
      if (ex) {
        const d = document.createElement('div');
        d.className = 'md';
        d.id = cid;
        ex.appendChild(d);
        el = d;
      }
    }
  }
  return el;
}
