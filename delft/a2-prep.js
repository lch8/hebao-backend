import {escapeHtml as esc} from './activity-view.js';
import {A2_GUIDE as GUIDE} from './a2-guide.js';
import {BANK, MOCK_MINUTES, activeMistakes, openPrepLedger, productive, readiness} from './a2-progress.js';
import {createExamSession} from './a2-session.js';

const practiceHub = 'https://www.inburgeren.nl/examen-doen/oefenen.jsp';
const lookup = (id, type) => GUIDE[id].types.find(t => t.id === type);
const link = (url, label) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
const command = (action, label, value = '', css = 'outline-btn') => `<button type="button" class="${css}" data-prep="${action}" data-value="${esc(value)}">${esc(label)}</button>`;
const statusNames = {pending:'待核对',met:'核对达标',review:'仍需复习'};

function speakDutch(text) {
  const synth = window.speechSynthesis;
  if (!synth || !window.SpeechSynthesisUtterance) return false;
  const voice = synth.getVoices().find(v => /^nl(?:[-_]|$)/i.test(v.lang));
  if (!voice) return false;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.92;
  synth.speak(u);
  return true;
}

export function mountExamPrep(root, storage, callbacks = {}) {
  const ledger = openPrepLedger(storage);
  const totalWords = Object.values(GUIDE).reduce((sum, g) => sum + g.words.length, 0);
  let subject = 'read', page = 'subject', wordScope = 'all', wordQuery = '', wordMode = 'list', flashDeck = [], flashIndex = 0, flashRevealed = false;
  let active = false;
  const notifySession = () => callbacks.onSessionChange?.(active && page === 'session');
  const setPage = next => { page = next; notifySession(); };

  const session = createExamSession(root, ledger, {
    isVisible:() => active && page === 'session',
    subjectHome:(id, official=false) => {
      subject=Object.hasOwn(GUIDE, id) ? id : subject; showSubject();
      focusSection(official ? '#a2Official h3' : '#a2SubjectTitle', official);
    },
    drill:(id,type) => {subject=id; launch('practice',type);},
    mock:(id,form) => {subject=id; launch(form,null);},
    mistakes:(scope='all') => startMistakes(scope),
    gradeWriting: callbacks.gradeWriting,
    onSharePoster: callbacks.onSharePoster,
    onLedgerChange:() => callbacks.onChange?.(),
    onFinish:() => { callbacks.onChange?.(); callbacks.onPractice?.(); }
  }, storage);
  const byId = id => root.querySelector('#'+id);

  function focusSection(selector='h2', align=false) {
    const heading=root.querySelector(selector);
    if(!heading)return;
    heading.setAttribute('tabindex','-1');
    heading.focus({preventScroll:true});
    const top=heading.getBoundingClientRect().top;
    if(align||top<76||top>window.innerHeight-60)heading.scrollIntoView({block:'start'});
  }
  function layout(body) {
    root.innerHTML = `<div class="a2-content">${body}</div>`;
  }
  function resumeBanner() {
    const run = session.current();
    if (!run) return '';
    return `<div class="a2-resume"><span><strong>${run.finished?'上次练习结果：':'未结束练习：'}</strong>${GUIDE[run.subject]?.zh || '分科'} · ${esc(run.title)}</span><div class="a2-resume-actions">${!run.finished?command('discard-run','放弃本轮','','text-btn danger'):''}${command('resume',run.finished?'查看刚才的结果':'继续当前作答 →','','primary-btn a2-resume-btn')}</div></div>`;
  }
  function mistakeBanner(data) {
    const allM = activeMistakes(data);
    if (!allM.length) return '';
    const curM = activeMistakes(data, subject);
    const label = curM.length
      ? `<strong>${GUIDE[subject].zh}错题本：${curM.length} 道待攻克</strong>${allM.length > curM.length ? `（全科共 ${allM.length} 道）` : ''} · 独立答对后自动移出`
      : `<strong>全科错题本：${allM.length} 道待攻克</strong> · 独立答对后自动移出`;
    return `<div class="a2-mistakes-bar"><span>${label}</span><div class="a2-resume-actions">${curM.length?command('mistakes',`重练${GUIDE[subject].zh}错题（${curM.length}）→`,subject,'soft-btn'):''}${allM.length>curM.length||!curM.length?command('mistakes',`重练全科错题（${allM.length}）→`,'all',curM.length?'text-btn':'soft-btn'):''}</div></div>`;
  }
  function subjectPicker(data) {
    const buttons=Object.entries(GUIDE).map(([id,g])=>{
      const name=id==='knm'?'KNM':g.nl;
      const drillsDone=g.types.filter(t=>data.drills?.[id+'/'+t.id]).length;
      const mocksDone=['a','b'].filter(f=>data.forms[id+'/'+f]?.first||data.forms[id+'/'+f]?.last).length;
      const done=drillsDone+mocksDone;
      return `<button type="button" class="a2-subject-choice" data-prep="subject" data-value="${id}" aria-pressed="${id===subject}">
        <span class="a2-subject-top"><strong>${esc(g.zh)}</strong>${done?`<i>${done}/5</i>`:''}</span><span lang="nl">${esc(name)}</span></button>`;
    });
    const savedN = data.savedWords?.length || 0;
    return `<div class="a2-picker-head"><h2 id="a2PickerTitle">选择科目</h2><div class="a2-picker-links">${command('words',`词库 / 闪卡（${totalWords}）${savedN?` · ★${savedN}`:''}`,subject,'text-btn')}</div></div>
      <div class="a2-picker" role="group" aria-labelledby="a2PickerTitle">${buttons.join('')}</div>`;
  }
  function typeCards(g, data) {
    const output = productive(subject);
    return g.types.map(t=>{
      const count=BANK[subject].practice.filter(item=>item.type===t.id).length;
      const d=data.drills?.[subject+'/'+t.id];
      let badge=`<span class="a2-drill-pill">${count} 题</span>`;
      if(d) {
        if(output) badge=`<span class="a2-drill-pill done">✓ 已练 ${d.attempted}/${count}</span>`;
        else if(d.correct===count) badge=`<span class="a2-drill-pill done">✓ 满分 ${d.correct}/${count}</span>`;
        else badge=`<span class="a2-drill-pill retry">上次 ${d.correct}/${count} 对</span>`;
      }
      const btnLabel=d?'再练一次':'开始练习';
      const btnClass=d&&(output||d.correct===count)?'outline-btn':'soft-btn';
      return `<article class="a2-type ${d?'is-practiced':''}">
        <div class="a2-type-head"><h4>${esc(t.label)}</h4>${badge}</div>
        <p>${esc(t.focus)}</p>
        <details><summary>答题技巧</summary><p class="a2-tip">${esc(t.tip)}</p></details>
        ${command('drill',btnLabel,t.id,btnClass)}</article>`;
    }).join('');
  }
  function officialSection(g, data) {
    const output = productive(subject);
    const papers = g.official.map(p => {
      const mark=data.official[p.url];
      return `<li>${link(p.url,p.label)}${mark?`<small>${statusNames[mark.result]} · ${mark.timed?'限时':'练习'}</small>`:''}</li>`;
    }).join('');
    return `<section class="a2-section a2-official-card" id="a2Official"><div class="a2-official-head"><h3>DUO 官方模拟卷</h3>${link(practiceHub,'全部样题 ↗')}</div>${subject==='speak'?'<p class="a2-meta">官方口语样卷请使用 Safari 以外的浏览器。</p>':''}
      <ul class="a2-official-links">${papers}</ul>
      <details class="a2-disclosure"><summary>记录官方卷成绩</summary>
      <form id="a2OfficialForm"><label>样卷<select name="paper">${g.official.map((p,i)=>`<option value="${i}">${esc(p.label)}</option>`).join('')}</select></label>
      <label>结果<select name="result"><option value="pending">已做，待核对</option><option value="review">仍需练习</option><option value="met">${output?'教师复核达标':'核对达标'}</option></select></label>
      <label class="a2-check"><input type="checkbox" name="timed">在 ${g.minutes} 分钟内独立完成</label><button type="submit" class="outline-btn">保存结果</button></form></details></section>`;
  }
  function showSubject(notice = '') {
    setPage('subject');
    const g=GUIDE[subject], data=ledger.read(), signal=readiness(subject,data);
    const hasMockHistory = Boolean(data.forms[subject+'/a']?.first || data.forms[subject+'/b']?.first || g.official.some(p => data.official[p.url]));
    const forms=['a','b'].map(form=>{
      const record=data.forms[subject+'/'+form], s=record?.first;
      let status='未做过';
      if(record) status=s?(productive(subject)?'首次完成 '+s.attempted+'/'+BANK[subject][form].length:'首次 '+s.correct+'/'+BANK[subject][form].length):'已打开';
      return command('mock',form.toUpperCase()+' 卷 · '+status,form,s?'outline-btn':'primary-btn');
    }).join('');
    layout(`${resumeBanner()}${mistakeBanner(data)}${subjectPicker(data)}
      <section class="a2-subject-brief" aria-labelledby="a2SubjectTitle">
        <div class="a2-brief-top">
          <div class="a2-brief-title"><h2 id="a2SubjectTitle">${esc(g.zh)}</h2><span class="a2-dutch-pill"><span lang="nl">${esc(g.nl)}</span> · ${g.minutes} 分钟</span></div>
          ${link(g.formatUrl,'DUO 说明 ↗')}
        </div>
        <p>${esc(g.format)}</p>
        <details class="a2-brief-more"><summary>常见难点</summary><p>${esc(g.challenge)}</p></details>
      </section>
      <section class="a2-section" aria-labelledby="a2PracticeTitle"><div class="a2-section-row"><h3 id="a2PracticeTitle">专项练习</h3>${subject==='write'?'<span class="pill">✦ 支持 AI 批改</span>':''}</div><div class="a2-types">${typeCards(g, data)}</div></section>
      <section class="a2-assess ${hasMockHistory?'':'is-compact'}" aria-labelledby="a2MockTitle"><div><div class="a2-section-row"><h3 id="a2MockTitle">限时模拟卷</h3><span class="a2-meta">每卷 ${BANK[subject].a.length} 题 · ${MOCK_MINUTES[subject]} 分钟</span></div><div class="a2-actions">${forms}</div>${subject==='speak'?'<p class="a2-meta">本站为文字情境，完整视频题见官方样卷。</p>':''}</div>
      ${hasMockHistory?`<div class="a2-signal"><h4>${esc(signal.title)}</h4><p>${esc(signal.detail)}</p></div>`:''}</section>
      ${officialSection(g,data)}
      <p role="status" class="a2-notice" id="a2Notice">${esc(notice)}</p>`);
  }
  function filteredWords() {
    const query=wordQuery.trim().toLocaleLowerCase();
    const savedSet = new Set(ledger.read().savedWords || []);
    return Object.entries(GUIDE)
      .filter(([id]) => wordScope === 'all' || wordScope === 'saved' || wordScope === id)
      .flatMap(([, g]) => g.words
        .filter(w => (wordScope !== 'saved' || savedSet.has(w.nl)) && (w.nl + ' ' + w.zh + ' ' + w.example).toLocaleLowerCase().includes(query))
        .map(w => ({ g, w, saved: savedSet.has(w.nl) }))
      );
  }
  function syncWordToolbar() {
    const savedCount = (ledger.read().savedWords || []).length;
    const savedChip = root.querySelector('[data-prep="word-scope"][data-value="saved"]');
    if (savedChip) savedChip.textContent = `★ 生词本 (${savedCount})`;
    root.querySelectorAll('[data-prep="word-scope"]').forEach(chip => {
      const selected = chip.dataset.value === wordScope;
      chip.classList.toggle('active', selected);
      chip.setAttribute('aria-pressed', String(selected));
    });
    root.querySelectorAll('[data-prep="word-mode"]').forEach(btn => {
      const selected = btn.dataset.value === wordMode;
      btn.classList.toggle('active', selected);
      btn.setAttribute('aria-pressed', String(selected));
    });
    const searchWrap = root.querySelector('.a2-word-search');
    if (searchWrap) searchWrap.hidden = wordMode === 'flash';
  }
  function rebuildFlashDeck(shuffle = false) {
    flashDeck = filteredWords();
    if (shuffle) {
      for (let i = flashDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flashDeck[i], flashDeck[j]] = [flashDeck[j], flashDeck[i]];
      }
    }
    flashIndex = 0;
    flashRevealed = false;
  }
  function drawWords() {
    syncWordToolbar();
    const host = byId('a2WordsStage');
    const countEl = byId('a2WordsCount');
    if (!host || !countEl) return;
    if (wordMode === 'flash') {
      const savedSet = new Set(ledger.read().savedWords || []);
      if (!flashDeck.length) {
        countEl.textContent = wordScope === 'saved' ? '生词本还是空的' : '当前筛选下没有词条';
        host.innerHTML = `<div class="empty-state"><h3>${wordScope==='saved'?'还没有收藏生词':'没有可抽背的词条'}</h3><p>${wordScope==='saved'?'在列表里点「☆ 收藏」或在闪卡中标为不熟，就能自动收进生词本。':'切换其他科目再试试。'}</p>${wordScope==='saved'?command('word-scope','看全科高频词','all','outline-btn'):''}</div>`;
        return;
      }
      if (flashIndex >= flashDeck.length) {
        countEl.textContent = `本轮 ${flashDeck.length} 张闪卡已完成`;
        host.innerHTML = `<div class="flash-done"><h3>✓ 本轮 ${flashDeck.length} 个词已过完一轮！</h3><p>已收藏 ${savedSet.size} 个生词，可切到「★ 生词本」专项复盘。</p><div class="a2-actions">${command('flash-shuffle','打乱再来一轮','','primary-btn')}${savedSet.size?command('word-scope',`复习生词本 (${savedSet.size})`,'saved','outline-btn'):''}${command('word-mode','切回词表','list','text-btn')}</div></div>`;
        return;
      }
      const cur = flashDeck[flashIndex];
      const isSaved = savedSet.has(cur.w.nl);
      countEl.textContent = `第 ${flashIndex + 1} / ${flashDeck.length} 张 · ${cur.g.zh}`;
      host.innerHTML = `<div class="flash-card">
        <div class="flash-card-top"><span class="pill">${esc(cur.g.zh)}</span><div class="flash-top-tools"><button type="button" class="text-btn flash-speak" data-prep="speak-word" data-value="${esc(cur.w.nl)}">🔊 听发音</button><button type="button" class="text-btn" data-prep="toggle-word" data-value="${esc(cur.w.nl)}">${isSaved?'★ 已收藏':'☆ 收藏'}</button></div></div>
        <div class="flash-front" lang="nl">${esc(cur.w.nl)}</div>
        ${flashRevealed
          ? `<div class="flash-back"><strong>${esc(cur.w.zh)}</strong><p lang="nl">${esc(cur.w.example)}</p></div>
             <div class="flash-actions">${command('flash-save-next','不熟 · 进生词本并下一张','','outline-btn')}${command('flash-next','记住了 · 下一张 →','','primary-btn')}</div>`
          : `<div class="flash-actions">${command('flash-reveal','翻看释义与例句','','primary-btn')}</div>`}
        <div class="flash-foot">${command('flash-shuffle','随机打乱顺序','','text-btn')}<span id="a2SpeakNote" class="a2-meta" role="status"></span></div>
      </div>`;
      return;
    }

    const words = filteredWords();
    countEl.textContent = '共 ' + words.length + ' 条高频词';
    host.innerHTML = words.length
      ? `<dl class="a2-words">${words.map(({g,w,saved})=>`<div><dt lang="nl">${esc(w.nl)}</dt><dd><strong>${esc(w.zh)}</strong><p lang="nl">${esc(w.example)}</p></dd><div class="word-row-actions">${wordScope==='all'||wordScope==='saved'?`<small>${esc(g.zh)}</small>`:''}<button type="button" class="word-icon-btn" data-prep="speak-word" data-value="${esc(w.nl)}" title="朗读荷语" aria-label="朗读 ${esc(w.nl)}">🔊</button><button type="button" class="word-icon-btn ${saved?'saved':''}" data-prep="toggle-word" data-value="${esc(w.nl)}" aria-pressed="${saved}" title="${saved?'移出生词本':'加入生词本'}" aria-label="${saved?'移出生词本':'加入生词本'} ${esc(w.nl)}">${saved?'★':'☆'}</button></div></div>`).join('')}</dl><p id="a2SpeakNote" class="a2-meta" role="status"></p>`
      : `<p class="a2-meta">${wordScope==='saved'?'生词本里还没有词。在列表中点 ☆ 即可收藏，登录后自动云同步。':'没有匹配的词。试试更短的荷语词根或中文关键词。'}</p>`;
  }
  function showWords(scope) {
    setPage('words');wordScope=scope||'all';wordQuery='';wordMode='list';
    const savedCount = (ledger.read().savedWords || []).length;
    const chips = [
      ['all', `全科 (${totalWords})`],
      ['saved', `★ 生词本 (${savedCount})`],
      ...Object.entries(GUIDE).map(([id, g]) => [id, `${g.zh} (${g.words.length})`])
    ].map(([id, label]) => `<button type="button" class="category-chip ${id===wordScope?'active':''}" data-prep="word-scope" data-value="${id}" aria-pressed="${id===wordScope}">${esc(label)}</button>`).join('');
    layout(`${command('words-back','返回'+GUIDE[subject].zh+'备考','','text-btn a2-back')}
      <div class="a2-overhead"><div><h2>备考高频词与闪卡</h2><p>按考试任务选编，支持生词本云同步与通勤闪卡自测。</p></div>
        <div class="word-mode-switch" role="group" aria-label="学习方式">
          <button type="button" class="active" data-prep="word-mode" data-value="list" aria-pressed="true">列表浏览</button>
          <button type="button" data-prep="word-mode" data-value="flash" aria-pressed="false">闪卡自测</button>
        </div>
      </div>
      <div class="a2-word-toolbar"><div class="category-filters" role="group" aria-label="按科目筛选词汇">${chips}</div><label class="a2-word-search"><span class="sr-only">搜索词或释义</span><input id="a2WordSearch" type="search" placeholder="搜索荷语词或中文释义（如 afspraak / 预约）"></label></div>
      <p class="a2-meta" id="a2WordsCount" role="status"></p><div id="a2WordsStage"></div>`);
    drawWords();
  }
  function startMistakes(scope = 'all') {
    const old = session.current();
    if (old && !old.finished) { setPage('session'); session.render('你有一轮尚未结束的作答，请先完成或放弃后再重练错题。'); return true; }
    setPage('session');
    if (!session.start(scope, 'mistakes', null)) {
      showSubject('当前没有待攻克的分科错题，太棒了！');
      return false;
    }
    focusSection('.a2-session-head');
    return true;
  }
  function launch(form, type) {
    const old=session.current();
    if (old && !old.finished) {setPage('session');session.render('你有一轮尚未结束的作答，可继续或交卷。');return;}
    setPage('session');session.start(subject,form,type);focusSection('.a2-session-head');
  }
  root.addEventListener('click',event=>{
    const b=event.target.closest('button[data-prep]');
    if(!b||b.disabled)return;
    const action=b.dataset.prep, value=b.dataset.value;
    if(action==='subject' && Object.hasOwn(GUIDE,value)){
      subject=value;showSubject();
      root.querySelector(`[data-prep="subject"][data-value="${value}"]`)?.focus({preventScroll:true});
    }
    if(action==='drill' && lookup(subject,value))launch('practice',value);
    if(action==='mock' && ['a','b'].includes(value))launch(value,null);
    if(action==='mistakes')startMistakes(value||'all');
    if(action==='words'){showWords(value||subject);focusSection();}
    if(action==='word-scope' && (value==='all'||value==='saved'||Object.hasOwn(GUIDE,value))){
      wordScope=value;
      if (wordMode === 'flash') rebuildFlashDeck(false);
      drawWords();
    }
    if(action==='word-mode' && ['list','flash'].includes(value)){
      wordMode=value;
      if (wordMode === 'flash') rebuildFlashDeck(false);
      drawWords();
    }
    if(action==='toggle-word'){
      ledger.toggleWord(value);
      callbacks.onChange?.();
      drawWords();
    }
    if(action==='speak-word'){
      const ok = speakDutch(value);
      const note = byId('a2SpeakNote');
      if (note) note.textContent = ok ? '' : '当前浏览器未安装荷兰语语音包，可直接看例句跟读。';
    }
    if(action==='flash-reveal'){flashRevealed=true;drawWords();}
    if(action==='flash-next'){flashIndex++;flashRevealed=false;drawWords();}
    if(action==='flash-save-next'){
      const cur = flashDeck[flashIndex];
      if (cur && !(ledger.read().savedWords || []).includes(cur.w.nl)) {
        ledger.toggleWord(cur.w.nl);
        callbacks.onChange?.();
      }
      flashIndex++;flashRevealed=false;drawWords();
    }
    if(action==='flash-shuffle'){rebuildFlashDeck(true);drawWords();}
    if(action==='words-back'){showSubject();focusSection('#a2SubjectTitle');}
    if(action==='resume'){setPage('session');session.render();focusSection('.a2-session-head');}
    if(action==='discard-run'){session.clear();showSubject('已放弃未结束作答，可重新选卷练习。');}
  });
  root.addEventListener('input',event=>{if(event.target.id==='a2WordSearch'){wordQuery=event.target.value;drawWords();}});
  root.addEventListener('submit',event=>{
    if(event.target.id!=='a2OfficialForm')return;
    event.preventDefault();
    const f=event.target.elements, paper=GUIDE[subject].official[Number(f.paper.value)];
    if(!paper)return;
    ledger.markOfficial(subject,paper.url,f.result.value,f.timed.checked);
    callbacks.onChange?.();
    showSubject(ledger.available()?'已保存这份官方模拟卷的记录。':'本次记录仅在当前页面有效。');
    root.querySelector('#a2Official')?.scrollIntoView({block:'nearest'});
  });
  return {
    open(){active=true;if(page==='session'&&session.current()){notifySession();session.render();}else showSubject();},
    startMistakes(scope='all'){active=true;return startMistakes(scope);},
    pause(){session.pauseMedia();},
    hide(){active=false;notifySession();session.pauseMedia();},
    inSession:() => active && page === 'session',
    reset(){session.clear();ledger.reset();if(active)showSubject();}
  };
}
