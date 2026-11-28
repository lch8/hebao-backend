import {escapeHtml as esc} from './activity-view.js';
import {A2_GUIDE as GUIDE} from './a2-guide.js';
import {BANK, MOCK_MINUTES, attempted, productive, readiness, summarize} from './a2-progress.js';

const act = (key,text,style='outline-btn') => `<button type="button" class="${style}" data-a2-act="${key}">${esc(text)}</button>`;
const textLink = (url,label) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
const nl = text => `<span lang="nl">${esc(text)}</span>`;
const clock = seconds => Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
const typeName = (subject,type) => GUIDE[subject].types.find(t=>t.id===type).label;

const SESSION_DRAFT_KEY = 'hebao_a2_session_v1';

export function createExamSession(root, ledger, hooks, storage) {
  let run=null, timer=null, epoch=0, recording=null, saveDraftTimer=null;
  const by = id => root.querySelector('#'+id);
  const current = () => run.items[run.index];
  const entry = () => run.answers[current().id] ||= {};
  const mock = () => run.form !== 'practice';
  const left = () => Math.max(0, Math.ceil((run.deadline-Date.now())/1000));

  function clearRunDraft() {
    clearTimeout(saveDraftTimer);
    try { storage?.setItem(SESSION_DRAFT_KEY, ''); } catch {}
  }
  function saveRunDraft() {
    if (!storage || !run || run.finished) return;
    try {
      const cleanAnswers = {};
      for (const [qid, val] of Object.entries(run.answers || {})) {
        if (!val || typeof val !== 'object') continue;
        const { clip: _clip, ...rest } = val;
        cleanAnswers[qid] = rest;
      }
      storage.setItem(SESSION_DRAFT_KEY, JSON.stringify({
        version: 1,
        subject: run.subject,
        form: run.form,
        type: run.type || null,
        token: run.token,
        index: run.index,
        answers: cleanAnswers,
        began: run.began,
        deadline: run.deadline,
        fresh: Boolean(run.fresh),
      }));
    } catch {}
  }
  function saveRunDraftSoon() {
    clearTimeout(saveDraftTimer);
    saveDraftTimer = setTimeout(saveRunDraft, 250);
  }
  function restoreRunDraft() {
    if (!storage) return;
    try {
      const raw = storage.getItem(SESSION_DRAFT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.version !== 1 || !Object.hasOwn(GUIDE, saved.subject)) { clearRunDraft(); return; }
      const isPractice = saved.form === 'practice';
      if (!isPractice && !['a', 'b'].includes(saved.form)) { clearRunDraft(); return; }
      if (isPractice && !GUIDE[saved.subject].types.some(t => t.id === saved.type)) { clearRunDraft(); return; }
      const now = Date.now();
      if (!isPractice && (!Number.isFinite(saved.deadline) || saved.deadline <= now)) { clearRunDraft(); return; }
      if (isPractice && (!Number.isFinite(saved.began) || now - saved.began > 86400000)) { clearRunDraft(); return; }
      const pool = BANK[saved.subject][saved.form];
      const items = isPractice ? pool.filter(item => item.type === saved.type) : pool;
      if (!items.length) { clearRunDraft(); return; }
      const index = Math.min(items.length - 1, Math.max(0, Number(saved.index) || 0));
      run = {
        subject: saved.subject,
        form: saved.form,
        type: saved.type,
        token: String(saved.token || ''),
        items,
        index,
        answers: saved.answers && typeof saved.answers === 'object' ? saved.answers : {},
        began: Number(saved.began) || now,
        deadline: Number(saved.deadline) || (now + MOCK_MINUTES[saved.subject] * 60000),
        finished: false,
        fresh: Boolean(saved.fresh),
        title: isPractice ? typeName(saved.subject, saved.type) : '模拟 ' + saved.form.toUpperCase() + ' 卷',
      };
      if (!isPractice) timer = setInterval(tick, 500);
    } catch { clearRunDraft(); }
  }

  function stopMic() {
    epoch++;
    const button=root.querySelector('[data-a2-act="record"]');
    if(button?.disabled)button.disabled=false;
    if(recording) {
      clearTimeout(recording.limit);
      if(recording.media.state!=='inactive') recording.media.stop();
      recording.stream.getTracks().forEach(track=>track.stop());
      recording=null;
    }
  }
  function pauseMedia() {
    stopMic();
    root.querySelectorAll('audio').forEach(audio=>audio.pause());
  }
  function clear() {
    pauseMedia(); clearInterval(timer); clearRunDraft();
    for(const e of Object.values(run?.answers||{})) if(e.clip) URL.revokeObjectURL(e.clip);
    run=null;
  }
  function start(subject, form, type) {
    clear();
    const practice=form==='practice';
    const pool=BANK[subject][form];
    const items=practice?pool.filter(item=>item.type===type):pool;
    const token=globalThis.crypto?.randomUUID?.() || Date.now()+'-'+Math.random();
    const began=Date.now();
    run={subject,form,type,token,items,index:0,answers:{},began,deadline:began+MOCK_MINUTES[subject]*60000,finished:false,
      fresh:!practice&&ledger.start(subject,form,token),title:practice?typeName(subject,type):'模拟 '+form.toUpperCase()+' 卷'};
    if(!practice) timer=setInterval(tick,500);
    saveRunDraft();
    render();
  }
  function tick() {
    if(!run||run.finished||!mock())return false;
    const remaining=left();
    if(!remaining){finish(true);return true;}
    if(hooks.isVisible()&&by('a2Clock'))by('a2Clock').textContent=clock(remaining);
    return false;
  }
  function audio(item, response) {
    const audioSrc = new URL(`./a2-audio/${encodeURIComponent(item.id)}.mp3`, import.meta.url).pathname;
    return `<div class="a2-listening"><span>听力材料 · 荷兰语合成录音</span>
      <audio id="a2Audio" controls preload="metadata" aria-label="播放本题荷兰语录音" src="${audioSrc}"></audio>
      <p class="a2-meta" id="a2AudioState" role="status">${response.heard?'已听完，可作答。':'先听完整段录音，再选择答案。'}</p>
      ${!mock()?`<details id="a2Transcript" ${response.transcript?'open':''}><summary>借助原文练习</summary><p lang="nl">${esc(item.text)}</p></details>`:''}</div>`;
  }
  function responseFields(item, response) {
    if(item.options) {
      const allowed=run.subject!=='listen'||response.heard||response.transcript;
      return `<fieldset id="a2Choices" class="study-options" ${!allowed||response.locked?'disabled':''}><legend class="sr-only">选择一个荷语答案</legend>${item.options.map((option,i)=>`<label class="study-option"><input type="radio" name="a2Choice" value="${i}" ${response.choice===i?'checked':''}>${nl(option)}</label>`).join('')}</fieldset>`;
    }
    if(run.subject==='write'){
      return (item.fields||['你的荷语答复']).map((field,i)=>`<label class="a2-response" for="a2Field${i}"><span${item.fields?' lang="nl"':''}>${esc(field)}</span><textarea id="a2Field${i}" data-a2-field="${i}" rows="${item.fields?2:5}" lang="nl" maxlength="1800" ${response.locked?'readonly':''}>${esc(response.text?.[i]||'')}</textarea></label>`).join('');
    }
    return `<div class="a2-speaking">${response.locked?'':act('record','录音并回听')}<span id="a2RecordingStatus" role="status">录音仅在当前页面回放，也可以直接开口作答。</span>
      <audio id="a2MyClip" controls ${response.clip?`src="${esc(response.clip)}"`:'hidden'} aria-label="回听我的作答"></audio>
      <label class="a2-check"><input type="checkbox" id="a2Spoken" ${response.spoken?'checked':''} ${response.locked?'disabled':''}>我已用荷兰语口头作答</label></div>`;
  }
  function selfChecks(item, response) {
    return `<fieldset class="a2-rubric"><legend>对照要点自查</legend>${item.checks.map((check,i)=>`<label><input type="checkbox" data-a2-rubric="${i}" data-qid="${esc(item.id)}" ${response.checks?.[i]?'checked':''}>${esc(check)}</label>`).join('')}</fieldset>`;
  }
  function explanation(item,response) {
    if(item.options) {
      return `<p><strong>参考答案</strong> ${nl(item.options[item.answer])}</p><p>${esc(item.why)}</p>
      ${item.source?textLink(item.source,'核对这项社会知识'):''}`;
    }
    return `<p><strong>参考表达</strong></p><p lang="nl" class="a2-model">${esc(item.model)}</p>${selfChecks(item,response)}`;
  }
  function refreshControls() {
    if(!run||run.finished||!hooks.isVisible())return;
    const item=current(), r=entry();
    if(by('a2Advance'))by('a2Advance').disabled=!attempted(run.subject,item,r);
    if(by('a2Choices'))by('a2Choices').disabled=Boolean(r.locked)||(run.subject==='listen'&&!r.heard&&!r.transcript);
  }
  function render(message='') {
    if(!run)return;
    if(run.finished){renderResult();return;}
    if(tick())return;
    pauseMedia();
    const item=current(),r=entry(),last=run.index===run.items.length-1;
    const prompt=run.subject==='listen'?audio(item,r):`<div class="a2-passage" lang="nl">${esc(item.text)}</div>`;
    const btn=mock()?(last?'交卷并看解析':'下一题'):(r.locked?(last?'查看本轮结果':'下一题'):'核对本题');
    const source=mock()?(run.fresh?'初见卷':'复做卷'):'专项练习';
    root.innerHTML=`<div class="a2-content a2-task"><div class="a2-session-head"><span>${GUIDE[run.subject].zh} · ${esc(run.title)} · ${source}</span>
      ${mock()?`<strong id="a2Clock" aria-label="剩余时间">${clock(left())}</strong>`:''}</div>
      <p class="a2-meta">第 ${run.index+1} / ${run.items.length} 题 · ${esc(typeName(run.subject,item.type))} · 本站原创</p>${prompt}
      <h2 lang="nl">${esc(item.prompt)}</h2>${responseFields(item,r)}
      ${!mock()&&r.locked?`<div class="a2-answer">${item.options?'<h3>'+(r.transcript?'已借助原文练习':r.choice===item.answer?'答对了':'再看一眼这条线索')+'</h3>':''}${explanation(item,r)}</div>`:''}
      <div class="a2-actions">${mock()&&run.index?act('prev','上一题'):''}<button class="primary-btn" type="button" id="a2Advance" data-a2-act="next">${btn}</button>
      ${!r.locked?act('skip',last?'跳过本题并交卷':'跳过本题','text-btn'):''}</div>
      <p id="a2TaskNotice" class="a2-meta" role="status">${esc(message)}</p>
      <div class="a2-taskfoot">${act('leave',mock()?'返回科目页，计时继续':'返回科目页','text-btn') }${!mock()?act('end-practice','结束本轮专项','text-btn'):''}${mock()?act('submit-now','提前交卷','text-btn'):''}</div></div>`;
    if(run.subject==='listen') {
      const session=run, audioElement=by('a2Audio');
      audioElement.addEventListener('ended',()=>{
        if(run!==session||run.finished||current()!==item||!audioElement.isConnected||tick())return;
        r.heard=true;saveRunDraft();by('a2AudioState').textContent='已听完，可作答。';refreshControls();
      });
      audioElement.addEventListener('error',()=>{
        if(!audioElement.isConnected)return;
        by('a2AudioState').textContent=mock()?'录音暂时无法播放，可重试或跳过。本题未作听力作答。':'录音暂时无法播放，可重试或展开原文练习。';
      });
      by('a2Transcript')?.addEventListener('toggle',event=>{
        if(event.target.open&&!run?.finished&&run===session&&current()===item&&event.target.isConnected){r.transcript=true;saveRunDraft();refreshControls();}
      });
    }
    refreshControls();
  }
  function changeItem(index) {pauseMedia();run.index=index;saveRunDraft();render();root.scrollIntoView({block:'start'});}
  function advance(skip=false) {
    if(!run||run.finished||tick())return;
    const item=current(),r=entry();
    if(!skip&&!attempted(run.subject,item,r))return;
    if(!skip&&!mock()&&!r.locked){r.locked=true;saveRunDraft();render();return;}
    if(run.index+1<run.items.length)changeItem(run.index+1);
    else finish(false);
  }
  function finish(expired) {
    if(!run||run.finished)return;
    pauseMedia();clearInterval(timer);clearRunDraft();run.finished=true;run.expired=expired;
    run.stats=summarize(run.subject,run.items,run.answers);
    if(mock())ledger.finish(run.subject,run.form,run.token,run.stats);
    else if(run.type)ledger.recordDrill(run.subject,run.type,run.stats);
    hooks.onFinish?.(run);
    if(hooks.isVisible())renderResult();
  }
  function resultItem(item,i) {
    const r=run.answers[item.id]||{}, output=productive(run.subject), ok=attempted(run.subject,item,r);
    let status=ok?'已作答':'未作答';
    if(!output&&ok)status=r.transcript?'借助原文':r.choice===item.answer?'答对':'答错';
    const mine=output?(run.subject==='write'?(r.text||[]).map((v,n)=>(item.fields?item.fields[n]+' · ':'')+v).join('\n'):''):item.options[r.choice];
    return `<details class="a2-review" ${output&&i===0?'open':''}><summary>${i+1}. ${esc(typeName(run.subject,item.type))} · ${status}</summary>
      <p lang="nl">${esc(item.text)}</p><p lang="nl"><strong>${esc(item.prompt)}</strong></p>
      ${mine?`<p>你的作答</p><p class="a2-model" lang="nl">${esc(mine)}</p>`:''}
      ${r.clip?`<audio controls src="${esc(r.clip)}" aria-label="回听第 ${i+1} 题"></audio>`:''}${explanation(item,r)}</details>`;
  }
  function resultActions(data, weakest) {
    const {subject,stats}=run, output=productive(subject), zh=GUIDE[subject].zh;
    if(!mock()) {
      const nextUnpracticed=GUIDE[subject].types.find(t=>t.id!==run.type&&!data.drills?.[subject+'/'+t.id]);
      const missed=!output&&stats.correct<stats.total;
      if(missed) {
        return `<button class="primary-btn" type="button" data-a2-act="practice-type" data-type="${esc(run.type)}">再练一次「${esc(run.title)}」</button>${nextUnpracticed?`<button class="outline-btn" type="button" data-a2-act="practice-type" data-type="${esc(nextUnpracticed.id)}">下一题型：${esc(nextUnpracticed.label)} →</button>${act('leave','返回'+zh+'备考','text-btn')}`:act('leave','返回'+zh+'备考')}`;
      }
      if(nextUnpracticed) {
        return `<button class="primary-btn" type="button" data-a2-act="practice-type" data-type="${esc(nextUnpracticed.id)}">继续练：${esc(nextUnpracticed.label)} →</button>${act('leave','返回'+zh+'备考')}`;
      }
      const nextForm=['a','b'].find(f=>!data.forms[subject+'/'+f]?.first);
      if(nextForm) {
        return `<button class="primary-btn" type="button" data-a2-act="start-mock" data-form="${nextForm}">专项已全通 · 开始 ${nextForm.toUpperCase()} 卷限时自测 →</button>${act('leave','返回'+zh+'备考')}`;
      }
      return `${act('leave','返回'+zh+'备考','primary-btn')}${act('subject','查看 DUO 官方样卷')}`;
    }
    const otherForm=run.form==='a'?'b':'a', otherDone=Boolean(data.forms[subject+'/'+otherForm]?.first);
    if(weakest) {
      return `<button class="primary-btn" type="button" data-a2-act="practice-type" data-type="${esc(weakest)}">补强薄弱题型：${esc(typeName(subject,weakest))} →</button>${!otherDone?`<button class="outline-btn" type="button" data-a2-act="start-mock" data-form="${otherForm}">挑战 ${otherForm.toUpperCase()} 卷</button>`:act('subject','查看 DUO 官方样卷')}${act('leave','返回'+zh+'备考','text-btn')}`;
    }
    if(!otherDone) {
      return `<button class="primary-btn" type="button" data-a2-act="start-mock" data-form="${otherForm}">挑战 ${otherForm.toUpperCase()} 卷确认稳定度 →</button>${act('subject','查看 DUO 官方样卷')}${act('leave','返回'+zh+'备考','text-btn')}`;
    }
    return `${act('subject','前往 DUO 官方整套样卷 →','primary-btn')}${act('leave','返回'+zh+'备考')}`;
  }
  function renderResult() {
    const {subject,stats}=run,output=productive(subject),data=ledger.read(),signal=readiness(subject,data);
    const groups=Object.entries(stats.byType);
    const weakest=groups.filter(([,g])=>(output?g.attempted:g.correct)<g.total).sort(([,a],[,b])=>(output?a.attempted:a.correct)/a.total-(output?b.attempted:b.correct)/b.total)[0]?.[0];
    const split=groups.map(([type,g])=>`<li><span>${esc(typeName(subject,type))}</span><strong>${output?g.attempted:g.correct} / ${g.total} ${output?'已作答':'独立答对'}${g.attempted<g.total?' · '+(g.total-g.attempted)+' 未答':''}</strong></li>`).join('');
    root.innerHTML=`<div class="a2-content a2-task"><p class="a2-meta">${GUIDE[subject].zh} · ${esc(run.title)}${mock()?' · '+(run.fresh?'首次作答':'复做') : ''}${run.expired?' · 时间已到':''}</p>
      <h2>${output?'完成 '+stats.attempted+' / '+stats.total+' 项表达任务':'独立答对 '+stats.correct+' / '+stats.total+' 题'}</h2>
      <p>${output?'逐题对照内容要点。词汇、语法和口语清晰度请另行复核。':(stats.total===stats.attempted?'全部题目已作答。':(stats.total-stats.attempted)+' 题未作答。')+'展开题目可查看答案依据。'}</p>
      <ul class="a2-breakdown">${split}</ul>
      ${mock()?`<div class="a2-assess-note"><h3>${esc(signal.title)}</h3><p>${esc(signal.detail)}</p>${!run.fresh?'<p>本次为复做，备考建议保留初见卷表现。</p>':''}</div>`:''}
      <div class="a2-actions">${resultActions(data,weakest)}</div>
      <h3 class="a2-review-title">逐题解析</h3>${run.items.map(resultItem).join('')}</div>`;
  }
  async function record() {
    const button=root.querySelector('[data-a2-act="record"]');
    if(recording){stopMic();return;}
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){by('a2RecordingStatus').textContent='设备不支持录音。可直接开口，完成后勾选已作答。';return;}
    const captured=run, item=current(), r=entry(), token=++epoch;
    button.disabled=true;
    let input;
    try {
      input=await navigator.mediaDevices.getUserMedia({audio:true});
      if(token!==epoch || run!==captured || run.finished || current()!==item || !button.isConnected){
        input.getTracks().forEach(track=>track.stop());return;
      }
      const chunks=[],media=new MediaRecorder(input);
      const slot={media,stream:input,limit:null};
      media.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      media.onstop=()=>{
        clearTimeout(slot.limit);input.getTracks().forEach(track=>track.stop());
        if(recording===slot)recording=null;
        if(run===captured&&chunks.length) {
          if(r.clip)URL.revokeObjectURL(r.clip);
          r.clip=URL.createObjectURL(new Blob(chunks,{type:media.mimeType}));
          if(!run.finished)r.spoken=true;
          if(button.isConnected){
            const audio=by('a2MyClip'); audio.src=r.clip;audio.hidden=false;
            by('a2Spoken').checked=r.spoken;by('a2RecordingStatus').textContent='可回听本次录音。';refreshControls();
          }
        }
        if(button.isConnected){button.disabled=false;button.textContent='重新录音';}
      };
      media.start();recording=slot;slot.limit=setTimeout(stopMic,90000);
      button.disabled=false;button.textContent='停止录音';by('a2RecordingStatus').textContent='正在录音…';
    } catch {
      input?.getTracks().forEach(track=>track.stop());
      if(token===epoch&&button.isConnected){button.disabled=false;by('a2RecordingStatus').textContent='未能使用麦克风。可直接开口作答并勾选完成。';}
    }
  }
  root.addEventListener('input',event=>{
    if(!run||run.finished||tick())return;
    const field=event.target.dataset.a2Field;
    if(field!==undefined&&!entry().locked){
      const r=entry();r.text||=[];r.text[Number(field)]=event.target.value;saveRunDraftSoon();refreshControls();
    }
  });
  root.addEventListener('change',event=>{
    if(!run)return;
    const input=event.target;
    if(input.dataset.a2Rubric!==undefined){
      const id=input.dataset.qid,r=run.answers[id]||={};
      r.checks||=[];r.checks[Number(input.dataset.a2Rubric)]=input.checked;saveRunDraft();return;
    }
    if(run.finished||tick())return;
    const r=entry();if(r.locked)return;
    if(input.name==='a2Choice')r.choice=Number(input.value);
    if(input.id==='a2Spoken')r.spoken=input.checked;
    saveRunDraft();
    refreshControls();
  });
  root.addEventListener('click',event=>{
    const b=event.target.closest('button[data-a2-act]');
    if(!b||b.disabled||!run)return;
    const a=b.dataset.a2Act;
    if(!run.finished&&tick())return;
    if(a==='record')record();
    if(a==='prev'&&run.index>0)changeItem(run.index-1);
    if(a==='next')advance();
    if(a==='skip')advance(true);
    if(a==='end-practice'||a==='submit-confirm')finish(false);
    if(a==='submit-now'){
      by('a2TaskNotice').innerHTML='交卷后可以查看解析。未作答题目会标出。 '+act('submit-confirm','确认现在交卷');
    }
    if(a==='leave'||a==='subject'){pauseMedia();saveRunDraft();hooks.subjectHome(run.subject,a==='subject');}
    if(a==='practice-type'&&run.finished)hooks.drill(run.subject,b.dataset.type);
    if(a==='start-mock'&&run.finished)hooks.mock(run.subject,b.dataset.form);
  });
  restoreRunDraft();
  return {current:()=>run,start,render,pauseMedia,clear};
}
