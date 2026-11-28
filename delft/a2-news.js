import { escapeHtml as esc } from './activity-view.js';
import { openPrepLedger } from './a2-progress.js';

function speakDutch(text, rate = 0.92) {
  const synth = window.speechSynthesis;
  if (!synth || !window.SpeechSynthesisUtterance) return false;
  const voice = synth.getVoices().find(v => /^nl(?:[-_]|$)/i.test(v.lang));
  if (!voice) return false;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = rate;
  synth.speak(u);
  return true;
}

function dayLabel(dayStr, index) {
  const m = String(dayStr || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return dayStr;
  const base = `${Number(m[2])}月${Number(m[3])}日`;
  return index === 0 ? `${base} · 最新` : base;
}

export function mountDailyNews(root, storage, hooks = {}) {
  const ledger = openPrepLedger(storage);
  let editions = [];
  let selectedDay = '';
  let viewMode = 'feed'; // 'feed' | 'vocab'
  let loading = false;
  let loadError = '';
  const quizAnswers = new Map(); // itemId -> { choice, correct }

  async function ensureLoaded(force = false) {
    if (editions.length && !force) { render(); return; }
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

  function renderVocabView(data) {
    const words = data.newsWords || [];
    if (!words.length) {
      return `<div class="empty-state"><h3>新闻生词本还是空的</h3><p>阅读每日简报时，点击词汇右侧的「☆」即可收藏到这里，登录邮箱自动跨设备同步。</p><button type="button" class="outline-btn" data-news-mode="feed">回到今日简报</button></div>`;
    }
    return `<dl class="a2-words news-vocab-list">${words.map(w => `<div>
      <dt lang="nl">${esc(w.nl)}</dt>
      <dd><strong>${esc(w.zh)}</strong>${w.note ? `<p>${esc(w.note)}</p>` : ''}</dd>
      <div class="word-row-actions">
        <button type="button" class="word-icon-btn" data-news-speak="${esc(w.nl)}" data-news-rate="0.9" title="朗读荷语" aria-label="朗读 ${esc(w.nl)}">🔊</button>
        <button type="button" class="word-icon-btn saved" data-news-word="${esc(w.nl)}" data-news-zh="${esc(w.zh)}" data-news-note="${esc(w.note || '')}" aria-pressed="true" title="移出生词本" aria-label="移出生词本 ${esc(w.nl)}">★</button>
      </div>
    </div>`).join('')}</dl><p id="newsSpeakStatus" class="a2-meta" role="status"></p>`;
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
      return `<div class="empty-state"><h3>今日荷语简报正在准备中</h3><p>每日荷兰时间早上 7:00 自动更新 3 条在荷实用资讯。</p></div>`;
    }

    const savedSet = new Set((data.newsWords || []).map(w => w.nl.toLowerCase()));
    const readSet = new Set(data.newsRead || []);
    const readInEdition = edition.items.filter(it => readSet.has(it.id)).length;

    const dateChips = editions.length > 1
      ? `<div class="category-filters news-day-chips" role="group" aria-label="选择简报日期">${editions.map((ed, idx) =>
          `<button type="button" class="category-chip ${ed.day === edition.day ? 'active' : ''}" data-news-day="${esc(ed.day)}" aria-pressed="${ed.day === edition.day}">${esc(dayLabel(ed.day, idx))}</button>`
        ).join('')}</div>`
      : '';

    const starterBanner = edition.isStarter
      ? `<div class="news-starter-note"><strong>精选入门样刊</strong> · 每日荷兰时间早 7:00 自动拉取 NOS / Rijksoverheid 最新资讯并改写为 A2+/B1 精读简报。</div>`
      : '';

    const cards = edition.items.map((item, idx) => {
      const isRead = readSet.has(item.id);
      const answered = quizAnswers.get(item.id);
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
        <p class="news-quiz-q"><span class="pill">理解快测</span> <span lang="nl">${esc(q.promptNl)}</span></p>
        <div class="news-quiz-opts">${q.options.map((opt, oi) => {
          const picked = answered?.choice === oi;
          const isRight = answered && oi === q.answer;
          const isWrong = answered && picked && oi !== q.answer;
          return `<button type="button" class="news-opt-btn ${isRight ? 'correct' : isWrong ? 'wrong' : ''}" data-news-quiz="${esc(item.id)}" data-news-opt="${oi}" ${answered ? 'disabled' : ''} lang="nl">${esc(opt)}</button>`;
        }).join('')}</div>
        ${answered ? `<p class="news-quiz-fb ${answered.correct ? 'ok' : 'miss'}"><strong>${answered.correct ? '✓ 理解准确！已记为已读' : '再看一眼关键句'}</strong> · ${esc(q.whyZh)}</p>` : ''}
      </div>` : '';

      return `<article class="news-card ${isRead ? 'is-read' : ''}">
        <div class="news-card-head">
          <div class="news-tags">
            <span class="pill">${esc(item.category || '荷兰社会')}</span>
            <span class="pill gray">${esc(item.level || 'A2+')}</span>
            ${isRead ? '<span class="pill news-read-pill">✓ 已精读</span>' : ''}
          </div>
          <span class="a2-meta">#${idx + 1}</span>
        </div>
        <h3 lang="nl">${esc(item.titleNl)}</h3>
        <p class="news-title-zh">${esc(item.titleZh)}</p>
        <p class="news-body-nl" lang="nl">${esc(item.bodyNl)}</p>
        <div class="news-audio-bar">
          <button type="button" class="soft-btn news-tts-btn" data-news-speak="${esc(item.bodyNl)}" data-news-rate="0.82">🔊 慢速朗读 (0.82x)</button>
          <button type="button" class="outline-btn news-tts-btn" data-news-speak="${esc(item.bodyNl)}" data-news-rate="0.98">🔊 原速朗读</button>
          <a class="text-btn news-source-link" href="${esc(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(item.sourceName || '官方原文')} ↗</a>
        </div>
        <details class="news-zh-details"><summary>查看中文要点对照</summary><p>${esc(item.summaryZh)}</p></details>
        <div class="news-vocab-section"><h4>实用荷语词汇（点 ☆ 收进生词本）</h4><div class="news-vocab-grid">${vocabHtml}</div></div>
        ${quizHtml}
      </article>`;
    }).join('');

    return `${dateChips}${starterBanner}
      <div class="news-edition-bar">
        <span>本期刊共 ${edition.items.length} 条 · 已精读 ${readInEdition}/${edition.items.length} 条</span>
        <button type="button" class="outline-btn" data-news-poster>生成今日荷语打卡图</button>
      </div>
      <p id="newsSpeakStatus" class="a2-meta" role="status"></p>
      <div class="news-list">${cards}</div>`;
  }

  function render() {
    const data = ledger.read();
    const vocabCount = (data.newsWords || []).length;
    root.innerHTML = `<div class="a2-content news-shell">
      <div class="a2-overhead">
        <div>
          <h2>每日荷语简报 · A2+/B1 精读</h2>
          <p>面向已有基础的在荷华人：每日 2 分钟读懂荷兰交通、租房、政策与社会热点的简易荷语改写版，原文外链直达。</p>
        </div>
        <div class="word-mode-switch" role="group" aria-label="简报与生词本切换">
          <button type="button" class="${viewMode === 'feed' ? 'active' : ''}" data-news-mode="feed" aria-pressed="${viewMode === 'feed'}">今日简报</button>
          <button type="button" class="${viewMode === 'vocab' ? 'active' : ''}" data-news-mode="vocab" aria-pressed="${viewMode === 'vocab'}">★ 新闻生词 (${vocabCount})</button>
        </div>
      </div>
      ${viewMode === 'vocab' ? renderVocabView(data) : renderFeedView(data)}
    </div>`;
  }

  root.addEventListener('click', e => {
    const modeBtn = e.target.closest('[data-news-mode]');
    if (modeBtn) {
      viewMode = modeBtn.dataset.newsMode === 'vocab' ? 'vocab' : 'feed';
      render();
      return;
    }
    const dayBtn = e.target.closest('[data-news-day]');
    if (dayBtn) {
      selectedDay = dayBtn.dataset.newsDay;
      render();
      return;
    }
    if (e.target.closest('[data-news-retry]')) {
      ensureLoaded(true);
      return;
    }
    const speakBtn = e.target.closest('[data-news-speak]');
    if (speakBtn) {
      const ok = speakDutch(speakBtn.dataset.newsSpeak, Number(speakBtn.dataset.newsRate) || 0.92);
      const status = root.querySelector('#newsSpeakStatus');
      if (status) status.textContent = ok ? '正在用荷兰语朗读…' : '当前浏览器未检测到荷兰语语音包，可直接对照中文大意精读。';
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
        targetPath: '/dutch-a2?view=news&from=news_card',
        fileName: `荷包-每日荷语简报-${edition.day}.jpg`,
        shareCopy: `🇳🇱 今日荷语精读打卡（${edition.day}）\n${edition.items.map(it => `• ${it.titleZh}`).join('\n')}\n\n免费每日荷语简报 + A2 AI 写作批改：https://hebaogj.xyz/dutch-a2?view=news&from=news_card`,
      });
    }
  });

  return {
    open: () => ensureLoaded(false),
    refresh: () => render(),
    pause: () => window.speechSynthesis?.cancel(),
  };
}
