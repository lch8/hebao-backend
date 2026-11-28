import { escapeHtml as esc } from './activity-view.js';
import { openPrepLedger } from './a2-progress.js';

function dayLabel(dayStr, index) {
  const m = String(dayStr || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return dayStr;
  const base = `${Number(m[2])}月${Number(m[3])}日`;
  return index === 0 ? `${base} · 最新` : base;
}

function amsterdamDayOf(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function formatFreshTime(iso) {
  if (!iso) return '';
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return '';
  try {
    const dt = new Date(ms);
    const now = new Date();
    const today = amsterdamDayOf(now);
    const yesterday = amsterdamDayOf(new Date(now.getTime() - 86400000));
    const itemDay = amsterdamDayOf(dt);
    const hm = new Intl.DateTimeFormat('nl-NL', {
      timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(dt);
    if (itemDay === today) return `今天 ${hm}`;
    if (itemDay === yesterday) return `昨天 ${hm}`;
    const md = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Europe/Amsterdam', month: 'numeric', day: 'numeric',
    }).format(dt);
    return `${md} ${hm}`;
  } catch {
    return '';
  }
}

const escapeRe = s => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function shortGlossZh(zh) {
  return String(zh || '')
    .split(/[\/（(、，,]/)[0]
    .trim()
    .slice(0, 7);
}

/**
 * Finds non-overlapping occurrences of difficult vocab words inside `bodyNl`
 * and wraps them in tappable tokens (with inline <ruby> Chinese glosses when `showGloss` is on).
 */
export function annotateDutchBody(bodyNl, vocab = [], itemId = '', showGloss = false, activeIdx = -1) {
  const text = String(bodyNl || '');
  if (!text || !Array.isArray(vocab) || !vocab.length) return esc(text);

  const candidates = [];
  vocab.forEach((v, idx) => {
    const terms = [];
    const exactMatch = String(v?.match || '').trim();
    if (exactMatch.length >= 2) terms.push({ raw: exactMatch, prefix: false });
    const bare = String(v?.nl || '').replace(/^(?:de|het|een)\s+/i, '').trim();
    if (bare.length >= 3) {
      terms.push({ raw: bare, prefix: false });
      // Gentle stem fallback for common Dutch inflections (e.g. vertraging -> vertragingen, zelfstandig -> zelfstandige).
      const singleWord = bare.split(/\s+/)[0];
      if (!bare.includes(' ') && singleWord.length >= 5) {
        const stem = singleWord.replace(/(?:en|e|s)$/i, '');
        if (stem.length >= 4) terms.push({ raw: stem, prefix: true });
      }
    }
    for (const t of terms) candidates.push({ ...t, idx, v });
  });

  // Longest exact matches first so multi-word phrases win over sub-words.
  candidates.sort((a, b) => (a.prefix !== b.prefix ? (a.prefix ? 1 : -1) : b.raw.length - a.raw.length));

  const occupied = [];
  const usedVocab = new Set();
  const spans = [];
  const overlaps = (start, end) => occupied.some(([s, e]) => start < e && end > s);

  for (const cand of candidates) {
    if (usedVocab.has(cand.idx)) continue;
    const pat = cand.prefix
      ? `(?<![\\p{L}-])${escapeRe(cand.raw)}[\\p{L}-]{0,6}(?![\\p{L}-])`
      : `(?<![\\p{L}-])${escapeRe(cand.raw)}(?![\\p{L}-])`;
    let re;
    try { re = new RegExp(pat, 'giu'); } catch { continue; }
    let m;
    while ((m = re.exec(text)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      if (!overlaps(start, end)) {
        occupied.push([start, end]);
        spans.push({ start, end, surface: m[0], idx: cand.idx, v: cand.v });
        usedVocab.add(cand.idx);
        break;
      }
    }
  }

  if (!spans.length) return esc(text);
  spans.sort((a, b) => a.start - b.start);

  let html = '';
  let cursor = 0;
  for (const sp of spans) {
    if (sp.start > cursor) html += esc(text.slice(cursor, sp.start));
    const selected = sp.idx === activeIdx;
    const gloss = shortGlossZh(sp.v.zh);
    const inner = showGloss && gloss
      ? `<ruby>${esc(sp.surface)}<rt>${esc(gloss)}</rt></ruby>`
      : esc(sp.surface);
    html += `<button type="button" class="nl-tok ${showGloss ? 'has-gloss' : ''} ${selected ? 'selected' : ''}" data-news-inspect="${esc(itemId)}" data-vocab-idx="${sp.idx}" aria-expanded="${selected}" title="${esc(sp.v.zh)}">${inner}</button>`;
    cursor = sp.end;
  }
  if (cursor < text.length) html += esc(text.slice(cursor));
  return html;
}

export function mountDailyNews(root, storage, hooks = {}) {
  const ledger = openPrepLedger(storage);
  let editions = [];
  let selectedDay = '';
  let viewMode = 'feed'; // 'feed' | 'city' | 'vocab'
  let cityCount = 0;
  let loading = false;
  let loadError = '';
  let speakingKey = '';
  const quizAnswers = new Map(); // itemId -> { choice, correct }
  const flippedItems = new Set(); // itemIds currently flipped to Chinese
  const glossedItems = new Map(); // itemId -> boolean
  const inspectedWord = new Map(); // itemId -> vocabIndex

  let defaultGloss = false;
  try { defaultGloss = storage?.getItem('hebao_news_gloss') === '1'; } catch {}

  function isGlossed(itemId) {
    return glossedItems.has(itemId) ? glossedItems.get(itemId) : defaultGloss;
  }

  function stopSpeech() {
    speakingKey = '';
    window.speechSynthesis?.cancel();
  }

  function speakDutch(text, rate = 0.92, key = '') {
    const synth = window.speechSynthesis;
    if (!synth || !window.SpeechSynthesisUtterance) return false;
    const voice = synth.getVoices().find(v => /^nl(?:[-_]|$)/i.test(v.lang));
    if (!voice) return false;
    if (key && speakingKey === key) {
      stopSpeech();
      render();
      return true;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = rate;
    speakingKey = key;
    u.onend = () => { if (speakingKey === key) { speakingKey = ''; render(); } };
    u.onerror = () => { if (speakingKey === key) { speakingKey = ''; render(); } };
    synth.speak(u);
    if (key) render();
    return true;
  }

  async function ensureLoaded(force = false) {
    if (editions.length && !force) { render(); return; }
    if (loading && !force) return;
    loading = true;
    loadError = '';
    render();
    try {
      const list = await hooks.loadEditions?.();
      editions = Array.isArray(list) ? list : [];
      if (editions.length && !editions.some(e => e.day === selectedDay)) {
        selectedDay = editions[0].day;
      }
    } catch (error) {
      loadError = error?.message || '简报暂时未能加载，请稍后重试';
    } finally {
      loading = false;
      render();
    }
  }

  function currentEdition() {
    return editions.find(e => e.day === selectedDay) || editions[0] || null;
  }

  function setMode(next) {
    const target = ['feed', 'city', 'vocab'].includes(next) ? next : 'feed';
    if (target !== 'feed') stopSpeech();
    viewMode = target;
    render();
    hooks.onModeChange?.(viewMode);
  }

  function renderVocabView(data) {
    const words = data.newsWords || [];
    if (!words.length) {
      return `<div class="empty-state"><h3>还没有收藏新闻生词</h3><p>点正文高亮词或词汇卡右侧「☆」即可收藏。</p><button type="button" class="outline-btn" data-news-mode="feed">回到今日新闻</button></div>`;
    }
    return `<div class="news-edition-bar">
      <span>共 ${words.length} 个生词</span>
      <button type="button" class="outline-btn" data-news-copy-vocab>复制生词清单</button>
    </div>
    <dl class="a2-words news-vocab-list">${words.map(w => `<div>
      <dt lang="nl">${esc(w.nl)}</dt>
      <dd><strong>${esc(w.zh)}</strong>${w.note ? `<p>${esc(w.note)}</p>` : ''}</dd>
      <div class="word-row-actions">
        <button type="button" class="word-icon-btn" data-news-speak="${esc(w.nl)}" data-news-rate="0.9" title="朗读荷语" aria-label="朗读 ${esc(w.nl)}">🔊</button>
        <button type="button" class="word-icon-btn saved" data-news-word="${esc(w.nl)}" data-news-zh="${esc(w.zh)}" data-news-note="${esc(w.note || '')}" aria-pressed="true" title="移出生词本" aria-label="移出生词本 ${esc(w.nl)}">★</button>
      </div>
    </div>`).join('')}</dl><p id="newsSpeakStatus" class="a2-meta" role="status" hidden></p>`;
  }

  function renderFeedView(data) {
    if (loading) {
      return `<div class="skeleton-card" aria-hidden="true"><div class="skeleton-line short"></div><div class="skeleton-line tall"></div><div class="skeleton-line medium"></div></div>`;
    }
    if (loadError) {
      return `<div class="empty-state error-state"><h3>${esc(loadError)}</h3><button type="button" class="outline-btn" data-news-retry>重新加载</button></div>`;
    }
    const edition = currentEdition();
    if (!edition || !edition.items?.length) {
      return `<div class="empty-state"><h3>今日简报准备中</h3><p>每日荷兰时间早 7:00 更新。</p></div>`;
    }

    const savedSet = new Set((data.newsWords || []).map(w => w.nl.toLowerCase()));
    const readSet = new Set(data.newsRead || []);

    const dateChips = editions.length > 1
      ? `<div class="category-filters news-day-chips" role="group" aria-label="选择简报日期">${editions.map((ed, idx) =>
          `<button type="button" class="category-chip ${ed.day === edition.day ? 'active' : ''}" data-news-day="${esc(ed.day)}" aria-pressed="${ed.day === edition.day}">${esc(dayLabel(ed.day, idx))}</button>`
        ).join('')}</div>`
      : '';

    const starterBanner = edition.isStarter
      ? `<div class="news-starter-note"><strong>入门样刊</strong> · 每日早 7:00 自动更新 NOS / NU.nl 最新资讯</div>`
      : '';

    const cards = edition.items.map((item, idx) => {
      const isRead = readSet.has(item.id);
      const answered = quizAnswers.get(item.id);
      const isFlipped = flippedItems.has(item.id);
      const showGloss = isGlossed(item.id);
      const activeIdx = inspectedWord.has(item.id) ? inspectedWord.get(item.id) : -1;
      const activeVocab = activeIdx >= 0 ? (item.vocab || [])[activeIdx] : null;
      const slowKey = `${item.id}:slow`;
      const normKey = `${item.id}:norm`;
      const freshStamp = formatFreshTime(item.publishedAt);
      const metaRight = freshStamp ? `${freshStamp} · ${item.sourceName || ''}` : `#${idx + 1}`;

      const popHtml = activeVocab && !isFlipped ? (() => {
        const saved = savedSet.has(activeVocab.nl.toLowerCase());
        return `<div class="news-word-pop" role="region" aria-label="词汇注释">
          <div class="news-word-pop-copy">
            <strong lang="nl">${esc(activeVocab.nl)}</strong>
            <span>${esc(activeVocab.zh)}</span>
            ${activeVocab.note ? `<small>${esc(activeVocab.note)}</small>` : ''}
          </div>
          <div class="news-vocab-btns">
            <button type="button" class="word-icon-btn" data-news-speak="${esc(activeVocab.nl)}" data-news-rate="0.9" title="朗读" aria-label="朗读 ${esc(activeVocab.nl)}">🔊</button>
            <button type="button" class="word-icon-btn ${saved ? 'saved' : ''}" data-news-word="${esc(activeVocab.nl)}" data-news-zh="${esc(activeVocab.zh)}" data-news-note="${esc(activeVocab.note || '')}" aria-pressed="${saved}" title="${saved ? '移出生词本' : '加入生词本'}" aria-label="${saved ? '移出生词本' : '加入生词本'} ${esc(activeVocab.nl)}">${saved ? '★' : '☆'}</button>
            <button type="button" class="word-icon-btn" data-news-pop-close="${esc(item.id)}" title="关闭" aria-label="关闭词汇提示">✕</button>
          </div>
        </div>`;
      })() : '';

      const vocabHtml = (item.vocab || []).map(v => {
        const saved = savedSet.has(v.nl.toLowerCase());
        return `<div class="news-vocab-chip">
          <div class="news-vocab-main"><strong lang="nl">${esc(v.nl)}</strong><span>${esc(v.zh)}</span>${v.note ? `<small>${esc(v.note)}</small>` : ''}</div>
          <div class="news-vocab-btns">
            <button type="button" class="word-icon-btn" data-news-speak="${esc(v.nl)}" data-news-rate="0.9" title="朗读词汇" aria-label="朗读 ${esc(v.nl)}">🔊</button>
            <button type="button" class="word-icon-btn ${saved ? 'saved' : ''}" data-news-word="${esc(v.nl)}" data-news-zh="${esc(v.zh)}" data-news-note="${esc(v.note || '')}" aria-pressed="${saved}" title="${saved ? '移出生词本' : '加入新闻生词本'}" aria-label="${saved ? '移出生词本' : '加入新闻生词本'} ${esc(v.nl)}">${saved ? '★' : '☆'}</button>
          </div>
        </div>`;
      }).join('');

      const q = item.question;
      const quizHtml = q ? `<div class="news-quiz">
        <p class="news-quiz-q"><span class="pill">快测</span> <span lang="nl">${esc(q.promptNl)}</span></p>
        <div class="news-quiz-opts">${q.options.map((opt, oi) => {
          const picked = answered?.choice === oi;
          const isRight = answered && oi === q.answer;
          const isWrong = answered && picked && oi !== q.answer;
          return `<button type="button" class="news-opt-btn ${isRight ? 'correct' : isWrong ? 'wrong' : ''}" data-news-quiz="${esc(item.id)}" data-news-opt="${oi}" ${answered ? 'disabled' : ''} lang="nl">${esc(opt)}</button>`;
        }).join('')}</div>
        ${answered ? `<p class="news-quiz-fb ${answered.correct ? 'ok' : 'miss'}"><strong>${answered.correct ? '✓ 理解准确' : '再看关键句'}</strong> · ${esc(q.whyZh)}</p>` : ''}
      </div>` : '';

      const readerBody = isFlipped
        ? `<p class="news-body-zh">${esc(item.bodyZh || item.summaryZh)}</p>`
        : `<p class="news-body-nl" lang="nl">${annotateDutchBody(item.bodyNl, item.vocab, item.id, showGloss, activeIdx)}</p>`;

      return `<article class="news-card ${isRead ? 'is-read' : ''}">
        <div class="news-card-head">
          <div class="news-tags">
            <span class="pill">${esc(item.category || '荷兰社会')}</span>
            <span class="pill gray">${esc(item.level || 'A2+')}</span>
            ${isRead ? '<span class="pill news-read-pill">✓ 已精读</span>' : ''}
          </div>
          <span class="a2-meta news-fresh-meta">${esc(metaRight)}</span>
        </div>
        <h3 lang="nl">${esc(item.titleNl)}</h3>
        <p class="news-title-zh">${esc(item.titleZh)}</p>
        <div class="news-reader ${isFlipped ? 'is-flipped' : ''} ${showGloss && !isFlipped ? 'is-glossed' : ''}">
          <div class="news-reader-tools" role="group" aria-label="阅读辅助开关">
            <button type="button" class="reader-pill ${showGloss && !isFlipped ? 'active' : ''}" data-news-gloss="${esc(item.id)}" aria-pressed="${showGloss && !isFlipped}" ${isFlipped ? 'disabled' : ''}>词注</button>
            <button type="button" class="reader-pill ${isFlipped ? 'active' : ''}" data-news-flip="${esc(item.id)}" aria-pressed="${isFlipped}">${isFlipped ? '还原荷语' : '译文'}</button>
          </div>
          <div class="news-reader-face">${readerBody}</div>
        </div>
        ${popHtml}
        <div class="news-audio-bar">
          <button type="button" class="soft-btn news-tts-btn ${speakingKey === slowKey ? 'is-playing' : ''}" data-news-speak="${esc(item.bodyNl)}" data-news-rate="0.82" data-news-speak-key="${esc(slowKey)}">${speakingKey === slowKey ? '⏹ 停止' : '🔊 慢速'}</button>
          <button type="button" class="outline-btn news-tts-btn ${speakingKey === normKey ? 'is-playing' : ''}" data-news-speak="${esc(item.bodyNl)}" data-news-rate="0.98" data-news-speak-key="${esc(normKey)}">${speakingKey === normKey ? '⏹ 停止' : '🔊 原速'}</button>
          <a class="text-btn news-source-link" href="${esc(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(item.sourceName || '原文')} ↗</a>
        </div>
        <div class="news-vocab-section"><h4>核心词汇</h4><div class="news-vocab-grid">${vocabHtml}</div></div>
        ${quizHtml}
      </article>`;
    }).join('');

    return `${dateChips}${starterBanner}
      <p id="newsSpeakStatus" class="a2-meta" role="status" hidden></p>
      <div class="news-list">${cards}</div>`;
  }

  function render() {
    const data = ledger.read();
    const vocabCount = (data.newsWords || []).length;
    const edition = currentEdition();
    const readSet = new Set(data.newsRead || []);
    const readInEdition = edition?.items ? edition.items.filter(it => readSet.has(it.id)).length : 0;
    const feedActions = viewMode === 'feed' && edition?.items?.length
      ? `<div class="news-edition-actions">
          <span class="news-read-count">已读 ${readInEdition}/${edition.items.length}</span>
          <button type="button" class="text-btn" data-news-copy-link>分享</button>
          <button type="button" class="outline-btn news-poster-btn" data-news-poster>打卡图</button>
        </div>`
      : '';
    root.innerHTML = `<div class="a2-content news-shell">
      <div class="news-toolbar">
        <div class="word-mode-switch" role="group" aria-label="资讯内容切换">
          <button type="button" class="${viewMode === 'feed' ? 'active' : ''}" data-news-mode="feed" aria-pressed="${viewMode === 'feed'}">今日新闻</button>
          <button type="button" class="${viewMode === 'city' ? 'active' : ''}" data-news-mode="city" aria-pressed="${viewMode === 'city'}">城市活动${cityCount ? ` (${cityCount})` : ''}</button>
          <button type="button" class="${viewMode === 'vocab' ? 'active' : ''}" data-news-mode="vocab" aria-pressed="${viewMode === 'vocab'}">★ 新闻生词 (${vocabCount})</button>
        </div>
        ${feedActions}
      </div>
      ${viewMode === 'city' ? '' : viewMode === 'vocab' ? renderVocabView(data) : renderFeedView(data)}
    </div>`;
  }

  root.addEventListener('click', e => {
    const modeBtn = e.target.closest('[data-news-mode]');
    if (modeBtn) {
      setMode(modeBtn.dataset.newsMode);
      return;
    }
    const dayBtn = e.target.closest('[data-news-day]');
    if (dayBtn) {
      stopSpeech();
      selectedDay = dayBtn.dataset.newsDay;
      render();
      return;
    }
    if (e.target.closest('[data-news-retry]')) {
      ensureLoaded(true);
      return;
    }
    const flipBtn = e.target.closest('[data-news-flip]');
    if (flipBtn) {
      const id = flipBtn.dataset.newsFlip;
      if (flippedItems.has(id)) flippedItems.delete(id);
      else { flippedItems.add(id); inspectedWord.delete(id); }
      render();
      return;
    }
    const glossBtn = e.target.closest('[data-news-gloss]');
    if (glossBtn && !glossBtn.disabled) {
      const id = glossBtn.dataset.newsGloss;
      const next = !isGlossed(id);
      glossedItems.set(id, next);
      defaultGloss = next;
      try { storage?.setItem('hebao_news_gloss', next ? '1' : '0'); } catch {}
      render();
      return;
    }
    const inspectBtn = e.target.closest('[data-news-inspect]');
    if (inspectBtn) {
      const id = inspectBtn.dataset.newsInspect;
      const idx = Number(inspectBtn.dataset.vocabIdx);
      if (inspectedWord.get(id) === idx) inspectedWord.delete(id);
      else inspectedWord.set(id, idx);
      render();
      return;
    }
    const closePop = e.target.closest('[data-news-pop-close]');
    if (closePop) {
      inspectedWord.delete(closePop.dataset.newsPopClose);
      render();
      return;
    }
    const speakBtn = e.target.closest('[data-news-speak]');
    if (speakBtn) {
      const ok = speakDutch(speakBtn.dataset.newsSpeak, Number(speakBtn.dataset.newsRate) || 0.92, speakBtn.dataset.newsSpeakKey || '');
      const status = root.querySelector('#newsSpeakStatus');
      if (status && !ok) { status.hidden = false; status.textContent = '当前浏览器未检测到荷兰语语音包，可点右上角「词注」或「译文」精读。'; }
      return;
    }
    const wordBtn = e.target.closest('[data-news-word]');
    if (wordBtn) {
      ledger.toggleNewsWord({
        nl: wordBtn.dataset.newsWord,
        zh: wordBtn.dataset.newsZh,
        note: wordBtn.dataset.newsNote,
      });
      hooks.onChange?.();
      render();
      return;
    }
    if (e.target.closest('[data-news-copy-vocab]')) {
      const words = ledger.read().newsWords || [];
      if (!words.length) return;
      const text = words.map(w => `${w.nl}\t${w.zh}${w.note ? `（${w.note}）` : ''}`).join('\n');
      hooks.onCopyText?.(text, `已复制 ${words.length} 个荷语生词，可直接粘贴到笔记或 Anki`);
      return;
    }
    if (e.target.closest('[data-news-copy-link]')) {
      const edition = currentEdition();
      const headline = edition?.items?.[0]?.titleZh ? `「${edition.items[0].titleZh}」` : '';
      const text = `🇳🇱 每日荷语简报（A2+/B1 精读）${headline}\nhttps://hebaogj.xyz/news?from=news_share`;
      hooks.onCopyText?.(text, '简报分享链接已复制，发到微信群自带蓝陶预览卡片');
      return;
    }
    const optBtn = e.target.closest('[data-news-quiz]');
    if (optBtn) {
      const itemId = optBtn.dataset.newsQuiz;
      const choice = Number(optBtn.dataset.newsOpt);
      const edition = currentEdition();
      const item = edition?.items?.find(it => it.id === itemId);
      if (!item?.question) return;
      const correct = choice === item.question.answer;
      quizAnswers.set(itemId, { choice, correct });
      ledger.markNewsRead(itemId);
      hooks.onChange?.();
      hooks.onNewsRead?.();
      render();
      return;
    }
    if (e.target.closest('[data-news-poster]')) {
      const edition = currentEdition();
      if (!edition || !hooks.onSharePoster) return;
      const readSet = new Set(ledger.read().newsRead || []);
      const readCount = edition.items.filter(it => readSet.has(it.id)).length;
      const sampleVocab = edition.items
        .flatMap(it => (it.vocab || []).slice(0, 1))
        .slice(0, 3)
        .map(v => `${v.nl} — ${v.zh}`);
      hooks.onSharePoster({
        badge: `荷包 · 每日荷语简报打卡 (${edition.day})`,
        title: `今日荷兰本地资讯精读`,
        subtitle: `A2+/B1 原创分级改写 · 每天 2 分钟积累地道荷语`,
        stat: readCount > 0 ? `今日已完成 ${readCount}/${edition.items.length} 篇精读自测` : `本期精选 ${edition.items.length} 条在荷实用荷语简报`,
        highlights: [
          ...edition.items.slice(0, 2).map(it => `📰 ${it.titleZh}`),
          ...sampleVocab.map(v => `✦ ${v}`),
        ].slice(0, 5),
        footerHint: '扫码免费看每日荷语简报、刷 DUO A2 模拟卷与 AI 写作批改',
        targetPath: '/news?from=news_card',
        fileName: `荷包-每日荷语简报-${edition.day}.jpg`,
        shareCopy: `🇳🇱 今日荷语精读打卡（${edition.day}）\n${edition.items.map(it => `• ${it.titleZh}`).join('\n')}\n\n免费每日荷语简报 + A2 AI 写作批改：https://hebaogj.xyz/news?from=news_card`,
      });
    }
  });

  return {
    open: (mode) => {
      if (mode && ['feed', 'city', 'vocab'].includes(mode)) viewMode = mode;
      hooks.onModeChange?.(viewMode);
      if (viewMode === 'city') { render(); return; }
      ensureLoaded(false);
    },
    setMode,
    getMode: () => viewMode,
    setCityCount: count => {
      const next = Number(count) || 0;
      if (next !== cityCount) { cityCount = next; render(); }
    },
    refresh: () => render(),
    pause: stopSpeech,
  };
}
