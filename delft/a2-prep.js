import {escapeHtml as esc} from './activity-view.js';
import {A2_GUIDE as GUIDE} from './a2-guide.js';
import {BANK, MOCK_MINUTES, openPrepLedger, productive, readiness} from './a2-progress.js';
import {createExamSession} from './a2-session.js';

const practiceHub = 'https://www.inburgeren.nl/examen-doen/oefenen.jsp';
const lookup = (id, type) => GUIDE[id].types.find(t => t.id === type);
const link = (url, label) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
const command = (action, label, value = '', css = 'outline-btn') => `<button type="button" class="${css}" data-prep="${action}" data-value="${esc(value)}">${esc(label)}</button>`;
const statusNames = {pending:'待核对',met:'核对达标',review:'仍需复习'};

export function mountExamPrep(root, storage, callbacks = {}) {
  const ledger = openPrepLedger(storage);
  const totalWords = Object.values(GUIDE).reduce((sum, g) => sum + g.words.length, 0);
  let subject = 'read', page = 'subject', wordScope = 'all', wordQuery = '';
  let active = false;
  const notifySession = () => callbacks.onSessionChange?.(active && page === 'session');
  const setPage = next => { page = next; notifySession(); };

  const session = createExamSession(root, ledger, {
    isVisible:() => active && page === 'session',
    subjectHome:(id, official=false) => {
      subject=id; showSubject();
      focusSection(official ? '#a2Official h3' : '#a2SubjectTitle', official);
    },
    drill:(id,type) => {subject=id; launch('practice',type);},
    mock:(id,form) => {subject=id; launch(form,null);},
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
    return `<div class="a2-resume"><span><strong>${run.finished?'上次练习结果：':'未结束练习：'}</strong>${GUIDE[run.subject].zh} · ${esc(run.title)}</span><div class="a2-resume-actions">${!run.finished?command('discard-run','放弃本轮','','text-btn danger'):''}${command('resume',run.finished?'查看刚才的结果':'继续当前作答 →','','primary-btn a2-resume-btn')}</div></div>`;
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
    return `<div class="a2-picker-head"><h2 id="a2PickerTitle">选择考试科目</h2>${command('words',GUIDE[subject].zh+'与全科高频词（'+totalWords+'）',subject,'text-btn')}</div>
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
      const btnLabel=d?'再练一次':`开始练习（${count} 题）`;
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
      return `<li>${link(p.url,p.label)}${mark?`<small>${statusNames[mark.result]} · ${mark.timed?'限时独立':'练习记录'}</small>`:''}</li>`;
    }).join('');
    return `<section class="a2-section a2-official-card" id="a2Official"><h3>DUO 官方模拟卷</h3><p>${output?'按正式时长完成整套。口语、写作的表达质量建议请熟悉 A2 标准的教师复核。':'按正式时长独立完成整套，再按官方练习给出的反馈核对。'}${subject==='speak'?' 官方口语样卷请使用 Safari 以外的浏览器。':''}</p>
      <ul class="a2-official-links">${papers}</ul>
      <details class="a2-disclosure"><summary>记录一份官方模拟卷的结果</summary>
      <form id="a2OfficialForm"><label>哪一份样卷<select name="paper">${g.official.map((p,i)=>`<option value="${i}">${esc(p.label)}</option>`).join('')}</select></label>
      <label>核对情况<select name="result"><option value="pending">已做，待核对</option><option value="review">核对后仍需练习</option><option value="met">${output?'经教师复核达标':'按官方练习反馈核对达标'}</option></select></label>
      <label class="a2-check"><input type="checkbox" name="timed">在 ${g.minutes} 分钟内独立完成整套</label><button type="submit" class="outline-btn">保存这次结果</button></form></details></section>`;
  }
  function showSubject(notice = '') {
    setPage('subject');
    const g=GUIDE[subject], data=ledger.read(), signal=readiness(subject,data);
    const forms=['a','b'].map(form=>{
      const record=data.forms[subject+'/'+form], s=record?.first;
      let status='未做过';
      if(record) status=s?(productive(subject)?'首次完成 '+s.attempted+'/'+BANK[subject][form].length:'首次 '+s.correct+'/'+BANK[subject][form].length):'已打开';
      return command('mock',form.toUpperCase()+' 卷 · '+status,form,s?'outline-btn':'primary-btn');
    }).join('');
    layout(`${resumeBanner()}${subjectPicker(data)}
      <section class="a2-subject-brief" aria-labelledby="a2SubjectTitle">
        <div class="a2-brief-copy">
          <div class="a2-brief-top"><h2 id="a2SubjectTitle">${esc(g.zh)}怎么考</h2><span class="a2-dutch-pill"><span lang="nl">${esc(g.nl)}</span> · 正式考试 ${g.minutes} 分钟</span></div>
          <p>${esc(g.format)} <span class="a2-challenge-inline"><strong>常见难点：</strong>${esc(g.challenge)}</span></p>
        </div>
        <div class="a2-brief-side">${link(g.formatUrl,'DUO 考试说明 ↗')}</div>
      </section>
      <section class="a2-section" aria-labelledby="a2PracticeTitle"><div class="a2-overhead"><div><h3 id="a2PracticeTitle">专项练习</h3><p>按题型逐题核对解析，不限时</p></div></div><div class="a2-types">${typeCards(g, data)}</div></section>
      <section class="a2-assess" aria-labelledby="a2MockTitle"><div><h3 id="a2MockTitle">限时自测</h3><p>本站模拟卷 · 每卷 ${BANK[subject].a.length} 题，${MOCK_MINUTES[subject]} 分钟</p><div class="a2-actions">${forms}</div><p class="a2-meta">选卷即开始计时，交卷后看各题型对错与解析；未交卷答案会自动暂存，切出页面不丢失。${subject==='speak'?' 本站用文字给出情境，完整视频题见官方样卷。':''}</p></div>
      <div class="a2-signal"><h4>${esc(signal.title)}</h4><p>${esc(signal.detail)}</p></div></section>
      ${officialSection(g,data)}
      <div class="a2-bottom"><span>个人应考科目请查 Mijn Inburgering。</span>${link(practiceHub,'DUO 官方样题总目录 ↗')}</div>
      <p role="status" class="a2-notice" id="a2Notice">${esc(notice)}</p>`);
  }
  function filteredWords() {
    const query=wordQuery.trim().toLocaleLowerCase();
    return Object.entries(GUIDE).filter(([id])=>wordScope==='all'||wordScope===id)
      .flatMap(([,g])=>g.words.filter(w=>(w.nl+' '+w.zh+' '+w.example).toLocaleLowerCase().includes(query)).map(w=>({g,w})));
  }
  function syncWordChips() {
    root.querySelectorAll('[data-prep="word-scope"]').forEach(chip => {
      const selected = chip.dataset.value === wordScope;
      chip.classList.toggle('active', selected);
      chip.setAttribute('aria-pressed', String(selected));
    });
  }
  function drawWords() {
    const words=filteredWords();
    syncWordChips();
    byId('a2WordsCount').textContent='共 '+words.length+' 条高频词';
    byId('a2WordsList').innerHTML=words.length?words.map(({g,w})=>`<div><dt lang="nl">${esc(w.nl)}</dt><dd><strong>${esc(w.zh)}</strong><p lang="nl">${esc(w.example)}</p></dd>${wordScope==='all'?`<small>${esc(g.zh)}</small>`:''}</div>`).join(''):'<p class="a2-meta">没有匹配的词。试试更短的荷语词根或中文关键词。</p>';
  }
  function showWords(scope) {
    setPage('words');wordScope=scope||'all';wordQuery='';
    const chips = [['all', `全科 (${totalWords})`], ...Object.entries(GUIDE).map(([id, g]) => [id, `${g.zh} (${g.words.length})`])]
      .map(([id, label]) => `<button type="button" class="category-chip ${id===wordScope?'active':''}" data-prep="word-scope" data-value="${id}" aria-pressed="${id===wordScope}">${esc(label)}</button>`).join('');
    layout(`${command('words-back','返回'+GUIDE[subject].zh+'备考','','text-btn a2-back')}<h2>备考高频词与搭配</h2><p>按常见考试任务选编，每条配中文释义和荷语例句。</p>
      <div class="a2-word-toolbar"><div class="category-filters" role="group" aria-label="按科目筛选词汇">${chips}</div><label class="a2-word-search"><span class="sr-only">搜索词或释义</span><input id="a2WordSearch" type="search" placeholder="搜索荷语词或中文释义（如 afspraak / 预约）"></label></div>
      <p class="a2-meta" id="a2WordsCount" role="status"></p><dl class="a2-words" id="a2WordsList"></dl>`);
    drawWords();
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
    if(action==='words'){showWords(value||subject);focusSection();}
    if(action==='word-scope' && (value==='all'||Object.hasOwn(GUIDE,value))){wordScope=value;drawWords();}
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
    pause(){session.pauseMedia();},
    hide(){active=false;notifySession();session.pauseMedia();},
    inSession:() => active && page === 'session',
    reset(){session.clear();ledger.reset();if(active)showSubject();}
  };
}
