import {escapeHtml as esc} from './activity-view.js';
import {A2_GUIDE as GUIDE} from './a2-guide.js';
import {BANK, MOCK_MINUTES, openPrepLedger, productive, readiness} from './a2-progress.js';
import {createExamSession} from './a2-session.js';

const practiceHub = 'https://www.inburgeren.nl/examen-doen/oefenen.jsp';
const lookup = (id, type) => GUIDE[id].types.find(t => t.id === type);
const link = (url, label) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
const command = (action, label, value = '', css = 'outline-btn') => `<button type="button" class="${css}" data-prep="${action}" data-value="${esc(value)}">${esc(label)}</button>`;
const statusNames = {pending:'待核对',met:'核对达标',review:'仍需复习'};

export function mountExamPrep(root, storage) {
  const ledger = openPrepLedger(storage);
  let subject = 'read', page = 'overview', wordScope = 'all', wordQuery = '', wordBack = 'overview';
  let active = false;
  const session = createExamSession(root, ledger, {
    isVisible:() => active && page === 'session',
    subjectHome:(id, official=false) => {
      subject=id; showSubject();
      focusSection(official ? '#a2Official h3' : '.a2-subhead h2');
    },
    drill:(id,type) => {subject=id; launch('practice',type);}
  });
  const byId = id => root.querySelector('#'+id);

  function focusSection(selector='h2') {
    const heading=root.querySelector(selector);
    if(!heading)return;
    heading.setAttribute('tabindex','-1');
    heading.focus({preventScroll:true});
    const top=heading.getBoundingClientRect().top;
    if(top<76||top>window.innerHeight-60)heading.scrollIntoView({block:'start'});
  }
  function layout(body) {
    root.innerHTML = `<div class="a2-content">${body}</div>`;
  }
  function resumeBanner() {
    const run = session.current();
    if (!run) return '';
    return `<div class="a2-resume"><span>${GUIDE[run.subject].zh} · ${esc(run.title)}</span>${command('resume',run.finished?'查看刚才的结果':'继续当前作答','','text-btn')}</div>`;
  }
  function showOverview() {
    page='overview';
    const rows = Object.entries(GUIDE).map(([id,g]) => `<button class="a2-exam-row" type="button" data-prep="subject" data-value="${id}">
      <span class="a2-name"><strong>${g.zh}</strong><span lang="nl">${g.nl}</span></span>
      <span class="a2-time">${g.minutes} 分钟</span>
      <span class="a2-summary"><span>${esc(g.format)}</span><small>${esc(g.challenge)}</small></span>
      <span class="a2-open">选这科</span></button>`).join('');
    layout(`${resumeBanner()}<div class="a2-overhead"><div><h2>五科怎么考</h2><p>选一科看题型、常用词和解题技巧，再用限时模拟找出最需要练的部分。</p></div>${command('all-words','查看备考词库')}</div>
      <div class="a2-exams">${rows}</div>
      <div class="a2-bottom"><span>考试形式和时长来自 DUO。个人应考科目请查 Mijn Inburgering。</span>${link(practiceHub,'DUO 官方样题总目录')}</div>`);
  }
  function typeCards(g) {
    return g.types.map(t => `<article class="a2-type"><h4>${esc(t.label)}</h4><p>${esc(t.focus)}</p><p class="a2-tip"><strong>答题技巧</strong> ${esc(t.tip)}</p>${command('drill','练这一题型',t.id,'outline-btn')}</article>`).join('');
  }
  function officialSection(g, data) {
    const output = productive(subject);
    const papers = g.official.map(p => {
      const mark=data.official[p.url];
      return `<li>${link(p.url,p.label)}${mark?`<small>${statusNames[mark.result]} · ${mark.timed?'限时独立':'练习记录'}</small>`:''}</li>`;
    }).join('');
    return `<section class="a2-section" id="a2Official"><h3>DUO 官方模拟卷</h3><p>${output?'按正式时长完成整套。口语、写作的表达质量建议请熟悉 A2 标准的教师复核。':'按正式时长独立完成整套，再按官方练习给出的反馈核对。'}${subject==='speak'?' 官方口语样卷请使用 Safari 以外的浏览器。':''}</p>
      <ul class="a2-official-links">${papers}</ul>${link(practiceHub,'官方样题目录')}
      <details class="a2-disclosure"><summary>记录一份官方模拟卷的结果</summary>
      <form id="a2OfficialForm"><label>哪一份样卷<select name="paper">${g.official.map((p,i)=>`<option value="${i}">${esc(p.label)}</option>`).join('')}</select></label>
      <label>核对情况<select name="result"><option value="pending">已做，待核对</option><option value="review">核对后仍需练习</option><option value="met">${output?'经教师复核达标':'按官方练习反馈核对达标'}</option></select></label>
      <label class="a2-check"><input type="checkbox" name="timed">在 ${g.minutes} 分钟内独立完成整套</label><button type="submit" class="outline-btn">保存这次结果</button></form></details></section>`;
  }
  function showSubject(notice = '') {
    page='subject';
    const g=GUIDE[subject], data=ledger.read(), signal=readiness(subject,data);
    const forms=['a','b'].map(form=>{
      const record=data.forms[subject+'/'+form], s=record?.first;
      let status='未做过';
      if(record) status=s?(productive(subject)?'首次完成 '+s.attempted+'/'+BANK[subject][form].length:'首次 '+s.correct+'/'+BANK[subject][form].length):'已打开';
      return command('mock',form.toUpperCase()+' 卷 · '+status,form);
    }).join('');
    layout(`${resumeBanner()}${command('overview','全部科目','','text-btn a2-back')}<div class="a2-subhead"><div><h2>${g.zh} <small lang="nl">${g.nl}</small></h2><p>${esc(g.format)}</p></div><span class="a2-time">正式考试 ${g.minutes} 分钟</span></div>
      <p class="a2-challenge"><strong>常见难点</strong> ${esc(g.challenge)} ${link(g.formatUrl,'DUO 考试说明')}</p>
      <section class="a2-section"><div class="a2-overhead"><h3>按题型练习</h3>${command('subject-words',g.zh+'词库 · '+g.words.length+' 条','','text-btn')}</div><div class="a2-types">${typeCards(g)}</div><p class="a2-meta">题型按本站练习任务归类。</p></section>
      <section class="a2-assess"><div><h3>限时模拟</h3><p>${BANK[subject].a.length} 题 / 卷 · ${MOCK_MINUTES[subject]} 分钟 · 本站原创 · 交卷后看解析</p><div class="a2-actions">${forms}</div><p class="a2-meta">打开过的卷会标为复做。刷新会清除未交卷的答案。${subject==='speak'?' 本站用文字给出情境，完整视频题见下方官方样卷。':''}</p></div>
      <div class="a2-signal"><h4>${esc(signal.title)}</h4><p>${esc(signal.detail)}</p></div></section>
      ${officialSection(g,data)}<p role="status" class="a2-notice" id="a2Notice">${esc(notice)}</p>`);
  }
  function filteredWords() {
    const query=wordQuery.trim().toLocaleLowerCase();
    return Object.entries(GUIDE).filter(([id])=>wordScope==='all'||wordScope===id)
      .flatMap(([,g])=>g.words.filter(w=>(w.nl+' '+w.zh+' '+w.example).toLocaleLowerCase().includes(query)).map(w=>({g,w})));
  }
  function drawWords() {
    const words=filteredWords();
    byId('a2WordsCount').textContent='共 '+words.length+' 条';
    byId('a2WordsList').innerHTML=words.length?words.map(({g,w})=>`<div><dt lang="nl">${esc(w.nl)}</dt><dd><strong>${esc(w.zh)}</strong><p lang="nl">${esc(w.example)}</p></dd>${wordScope==='all'?`<small>${esc(g.zh)}</small>`:''}</div>`).join(''):'<p>没有匹配的词。试试更短的荷语词根或中文关键词。</p>';
  }
  function showWords(scope, back) {
    page='words';wordScope=scope;wordQuery='';wordBack=back;
    layout(`${command('words-back',back==='overview'?'全部科目':'返回'+GUIDE[subject].zh,'','text-btn a2-back')}<h2>备考高频词与搭配</h2><p>按常见考试任务选编，每条配中文释义和荷语例句。</p>
      <div class="a2-filters"><label>科目<select id="a2WordScope"><option value="all">全部科目</option>${Object.entries(GUIDE).map(([id,g])=>`<option value="${id}" ${id===scope?'selected':''}>${g.zh}</option>`).join('')}</select></label><label>搜索词或释义<input id="a2WordSearch" type="search" placeholder="例如 afspraak 或 预约"></label></div>
      <p class="a2-meta" id="a2WordsCount" role="status"></p><dl class="a2-words" id="a2WordsList"></dl>`);
    drawWords();
  }
  function launch(form, type) {
    const old=session.current();
    if (old && !old.finished) {page='session';session.render('你有一轮尚未结束的作答，可继续或交卷。');return;}
    page='session';session.start(subject,form,type);focusSection('.a2-session-head');
  }
  root.addEventListener('click',event=>{
    const b=event.target.closest('button[data-prep]');
    if(!b||b.disabled)return;
    const action=b.dataset.prep, value=b.dataset.value;
    if(action==='overview')showOverview();
    if(action==='subject' && Object.hasOwn(GUIDE,value)){subject=value;showSubject();}
    if(action==='drill' && lookup(subject,value))launch('practice',value);
    if(action==='mock' && ['a','b'].includes(value))launch(value,null);
    if(action==='all-words')showWords('all','overview');
    if(action==='subject-words')showWords(subject,'subject');
    if(action==='words-back'){if(wordBack==='overview')showOverview();else showSubject();}
    if(action==='resume'){page='session';session.render();}
    if(!['drill','mock','resume'].includes(action))focusSection();
  });
  root.addEventListener('input',event=>{if(event.target.id==='a2WordSearch'){wordQuery=event.target.value;drawWords();}});
  root.addEventListener('change',event=>{if(event.target.id==='a2WordScope'){wordScope=event.target.value;drawWords();}});
  root.addEventListener('submit',event=>{
    if(event.target.id!=='a2OfficialForm')return;
    event.preventDefault();
    const f=event.target.elements, paper=GUIDE[subject].official[Number(f.paper.value)];
    if(!paper)return;
    ledger.markOfficial(subject,paper.url,f.result.value,f.timed.checked);
    showSubject(ledger.available()?'已保存这份官方模拟卷的记录。':'本次记录仅在当前页面有效。');
    root.querySelector('#a2Official')?.scrollIntoView({block:'nearest'});
  });
  return {
    open(){active=true;showOverview();},
    pause(){session.pauseMedia();},
    hide(){active=false;session.pauseMedia();},
    reset(){session.clear();ledger.reset();if(active)showOverview();}
  };
}
