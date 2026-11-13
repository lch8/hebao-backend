import {LESSONS,TASKS,QUIZ,SKILLS,SOURCES,CONTENT_CHECKED,EXAMS} from './dutch-content.js';
import {freshStudy,loadStudy,saveStudy,recordTask,completeLesson,dueTasks,recommendedLesson,targetWindow,dayKey,EXAM_STATUSES} from './dutch-store.js';

const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceLink = key => {const source=SOURCES[key];return source?`<a href="${source.url}" target="_blank" rel="noopener noreferrer">${esc(source.name)} ↗</a>`:'';};
const skillTags = tasks => [...new Set(tasks.map(task=>task.skill))].map(skill=>`<span>${SKILLS[skill]}</span>`).join('');

export function mountDutch(root){
  let storage;try{storage=window.localStorage;}catch{}
  const loaded=loadStudy(storage);
  let study=loaded.state,storageOK=loaded.available,view='today',session=null,quiz=null,quizTimer,recorder,stream,recordingUrl='',recordingTimeout,mediaRequest=0,resetPending=false;
  const el=id=>root.querySelector(`#${id}`);
  root.innerHTML=`<nav class="study-nav" aria-label="荷语学习"><button type="button" data-study-view="today">今日练习</button><button type="button" data-study-view="lessons">场景练习</button><button type="button" data-study-view="quiz">考前自测</button><button type="button" data-study-view="exam">考试安排</button></nav><div id="studyBody"></div><div class="study-foot"><span id="studySaveStatus" role="status" aria-live="polite"></span><details><summary>关于内容与学习记录</summary><p>本站原创 A2 练习，覆盖部分典型生活场景。考试要求与知识题的来源可在相关页面查看；内容核对：${CONTENT_CHECKED}。</p><p>学习进度和考试安排仅保存在当前浏览器，不随登录同步。录音只在本次页面中回放，离开页面后不保留。</p><button type="button" class="text-btn" data-study-action="reset">清除本机学习记录</button></details></div>`;

  function save(){storageOK=saveStudy(storage,study);saveStatus();}
  function saveStatus(){el('studySaveStatus').textContent=storageOK?'进度保存在本机 · 无需登录':'浏览器暂不能保存进度，本次仍可练习';}
  function pauseMedia(){
    mediaRequest++;
    window.speechSynthesis?.cancel();
    if(recorder&&recorder.state!=='inactive')recorder.stop();
    stream?.getTracks().forEach(track=>track.stop());stream=null;
    clearTimeout(recordingTimeout);
    root.querySelectorAll('audio').forEach(audio=>audio.pause());
    const recordButton=root.querySelector('[data-study-action="record"]');if(recordButton){recordButton.disabled=false;recordButton.textContent='录音练习';}
  }
  function releaseRecording(){pauseMedia();recorder=null;if(recordingUrl)URL.revokeObjectURL(recordingUrl);recordingUrl='';}
  function setView(next){
    pauseMedia();view=next;
    root.querySelectorAll('[data-study-view]').forEach(button=>{const active=button.dataset.studyView===view;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    if(view==='today')renderToday();if(view==='lessons')renderLessons();if(view==='quiz')renderQuiz();if(view==='exam')renderExam();
    saveStatus();
  }
  function renderToday(){
    const next=recommendedLesson(study)||LESSONS[0],review=dueTasks(study),completed=study.completed.length;
    const current=session&&session.index<session.tasks.length?session:null;
    const currentLesson=current&&LESSONS.find(lesson=>lesson.id===current.lessonId);
    el('studyBody').innerHTML=`<div class="study-home"><article class="study-hero"><div class="study-eyebrow">${current?'继续上次的小练习':'今天，练会一件小事'}</div><h2>${esc(current?(currentLesson?.title||'复习容易忘的表达'):next.title)}</h2><p>${esc(currentLesson?.subtitle||next.subtitle)}</p><div class="study-phrase" lang="nl">${esc(currentLesson?.phrase||next.phrase)}</div><div class="study-task-path">${(current?.tasks||next.tasks).map((task,index)=>`<span><i>${index+1}</i>${SKILLS[task.skill]}</span>`).join('<b aria-hidden="true">→</b>')}</div><button class="primary-btn" type="button" ${current?'data-study-action="resume"':`data-study-lesson="${next.id}"`}>${current?'继续练习':'开始今天的练习'} <span aria-hidden="true">→</span></button><span class="study-small">每节 3 个小练习 · 约 10–15 分钟</span></article><aside class="study-overview" aria-label="学习进度"><div class="study-overview-head"><span>已经走过</span><strong>${completed}<small> / ${LESSONS.length} 个场景</small></strong></div><div class="study-meter" role="progressbar" aria-label="场景完成进度" aria-valuenow="${completed}" aria-valuemin="0" aria-valuemax="${LESSONS.length}"><span style="width:${completed/LESSONS.length*100}%"></span></div><p>完成一节，就多会一件生活里的小事。</p><div class="study-skill-counts">${Object.entries(SKILLS).map(([id,name])=>`<span>${name}<strong>${TASKS.filter(task=>task.skill===id&&study.answers[task.id]).length}</strong><small>题</small></span>`).join('')}</div>${review.length?`<button class="outline-btn wide" type="button" data-study-action="review">复习 ${review.length} 道容易忘的题</button>`:'<button class="outline-btn wide" type="button" data-study-action="short">今天只练 1 题</button>'}<button class="text-btn" type="button" data-study-view="exam">先看看自己需要考什么 ↗</button></aside></div><div class="study-scene-heading"><h2>把熟悉的生活，变成练习</h2><button class="text-btn" type="button" data-study-view="lessons">全部 ${LESSONS.length} 个场景 →</button></div><div class="study-scene-grid">${LESSONS.slice(0,3).map(lessonCard).join('')}</div>`;
  }
  function lessonCard(lesson){
    const completed=study.completed.includes(lesson.id),index=LESSONS.indexOf(lesson)+1;
    return `<button type="button" class="study-scene" data-study-lesson="${lesson.id}"><span class="study-scene-number">${String(index).padStart(2,'0')}${completed?' · 已完成':''}</span><strong>${esc(lesson.title)}</strong><span class="study-scene-copy">${esc(lesson.subtitle)}</span><span class="study-skill-tags">${skillTags(lesson.tasks)}</span><span class="study-scene-arrow" aria-hidden="true">↗</span></button>`;
  }
  function renderLessons(){
    el('studyBody').innerHTML=`<div class="study-page-heading"><h2>从你用得上的场景开始</h2><p>每节三小步；学过的内容会换时间、人物和情境再出现。</p></div><div class="study-scene-grid">${LESSONS.map(lessonCard).join('')}</div>`;
  }
  function startSession(tasks,lessonId=null){
    releaseRecording();session={tasks,lessonId,index:0,checked:false,assisted:false,heard:0,results:[],drafts:{},done:false};renderTask();scrollPractice();
  }
  function scrollPractice(){root.querySelector('.study-practice,.study-finish')?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  function currentTask(){return session?.tasks[session.index];}
  function practiceTop(){
    return `<div class="study-practice-top"><button class="text-btn" type="button" data-study-action="home">← 今日练习</button><span>${session.index+1} / ${session.tasks.length} <span class="study-dot">·</span> ${SKILLS[currentTask().skill]}</span></div><div class="study-meter study-session-meter" role="progressbar" aria-label="本轮练习进度" aria-valuenow="${session.index}" aria-valuemin="0" aria-valuemax="${session.tasks.length}"><span style="width:${session.index/session.tasks.length*100}%"></span></div>`;
  }
  function renderTask(){
    if(!session)return;
    if(session.index>=session.tasks.length){renderSessionResult();return;}
    const task=currentTask();view='practice';
    const output=task.kind==='output';
    el('studyBody').innerHTML=`<div class="study-practice">${practiceTop()}<div class="study-task-label">${output?'自己表达一次':task.skill==='knm'?'生活里的社会知识':task.skill==='listen'?'先听，再抓住重点':'读懂一条生活消息'}<span>本站自编</span></div>${task.skill==='listen'?`<div class="study-listen"><button class="soft-btn" type="button" data-study-action="listen">▶ 播放荷兰语</button><span>设备荷兰语语音 · 可重听</span><p id="studyAudioStatus" role="status" aria-live="polite"></p><button class="text-btn" type="button" data-study-action="transcript">查看原文</button><p id="studyTranscript" lang="nl" hidden>${esc(task.text)}</p></div>`:task.text?`<div class="study-message" lang="nl">${esc(task.text)}</div>`:''}<h2 class="study-question" lang="nl">${esc(task.prompt)}</h2>${output?renderOutput(task):renderChoices(task)}<p id="studyTaskNotice" class="study-task-notice" role="status" aria-live="polite"></p><div id="studyFeedback" class="study-feedback" role="status" aria-live="polite" hidden></div></div>`;
    if(session.checked)renderSavedFeedback();
  }
  function renderChoices(task){
    return `<fieldset class="study-options"><legend class="sr-only">选择一个答案</legend>${task.options.map((option,index)=>`<label class="study-option"><input type="radio" name="studyAnswer" value="${index}" ${session.choice===index?'checked':''}><span lang="nl">${esc(option)}</span></label>`).join('')}</fieldset><div class="study-question-actions"><button class="primary-btn" type="button" data-study-action="check" ${Number.isInteger(session.choice)?'':'disabled'}>确认答案</button>${task.translation?'<button class="text-btn" type="button" data-study-action="hint">中文提示</button>':''}</div><p id="studyTranslation" class="study-hint" hidden>${esc(task.translation)}</p>`;
  }
  function renderOutput(task){
    return `<ul class="study-requirements">${task.checks.map(check=>`<li>${esc(check)}</li>`).join('')}</ul>${task.skill==='write'?`<label class="study-response-label" for="studyResponse">试着写两三句<textarea id="studyResponse" maxlength="1500" rows="4" placeholder="先自己写，再对照示例。" lang="nl">${esc(session.drafts[task.id]||'')}</textarea></label>`:`<div class="study-record"><button class="outline-btn" type="button" data-study-action="record">录音练习</button><span id="studyRecordStatus" role="status" aria-live="polite">也可以直接开口练习 · 每段最多 60 秒</span><audio id="studyRecording" controls hidden aria-label="回听自己的荷兰语录音"></audio></div>`}<button class="primary-btn" type="button" data-study-action="model">对照示例，自查表达</button><p class="study-small">${task.skill==='write'?'先完成任务，再检查是否容易理解。':'说清任务要点，再回听是否容易听懂。'}本题由你自查。</p><div id="studyModel" class="study-model" hidden><h3>一种简单的表达</h3><p class="study-example" lang="nl">${esc(task.example)}</p><p>${esc(task.tip)}</p><fieldset class="study-self-check"><legend>我已经做到</legend>${task.checks.map((check,index)=>`<label><input type="checkbox" data-self-check="${index}"><span>${esc(check)}</span></label>`).join('')}</fieldset><div class="study-question-actions"><button class="primary-btn" type="button" data-study-action="self-done" disabled>完成自查，继续 →</button><button class="outline-btn" type="button" data-study-action="self-review">记为待复习，继续</button></div></div>`;
  }
  function checkAnswer(){
    const task=currentTask();if(!task||session.checked)return;
    const input=root.querySelector('input[name="studyAnswer"]:checked');if(!input)return;
    if(task.skill==='listen'&&!session.heard&&!session.assisted){el('studyTaskNotice').textContent='先播放荷兰语；设备不支持时，可以查看原文辅助练习。';return;}
    const correct=Number(input.value)===task.answer;
    session.checked=true;session.choice=Number(input.value);
    session.results.push({id:task.id,correct,independent:correct&&!session.assisted});
    study=recordTask(study,task.id,{correct,assisted:session.assisted});save();
    renderSavedFeedback();
  }
  function renderSavedFeedback(){
    const task=currentTask(),correct=session.results.at(-1)?.correct;
    root.querySelectorAll('input[name="studyAnswer"]').forEach(input=>input.disabled=true);
    root.querySelector('[data-study-action="check"]').hidden=true;
    const feedback=el('studyFeedback');feedback.hidden=false;
    feedback.innerHTML=`<h3>${correct?'答对了，抓住了关键信息。':'看看哪一句给出了答案。'}</h3><p class="study-answer" lang="nl">${esc(task.options[task.answer])}</p><p>${esc(task.explanation)}</p>${task.source?`<p class="study-small">${sourceLink(task.source)} · 核对 ${CONTENT_CHECKED}</p>`:''}${session.assisted?'<p class="study-small">本题使用过提示或重听，之后再独立试一次。</p>':''}<button class="primary-btn" type="button" data-study-action="next">${session.index===session.tasks.length-1?'完成本轮练习':'下一小步'} →</button>`;
    feedback.scrollIntoView({block:'nearest'});
  }
  function nextTask(){
    releaseRecording();session.index++;session.checked=false;session.assisted=false;session.heard=0;delete session.choice;renderTask();scrollPractice();
  }
  function selfRate(correct){
    const task=currentTask();if(!task||task.kind!=='output')return;
    study=recordTask(study,task.id,{correct,selfRated:true});session.results.push({id:task.id,correct,selfRated:true});save();nextTask();
  }
  function renderSessionResult(){
    if(!session.done){if(session.lessonId)study=completeLesson(study,session.lessonId);session.done=true;save();}
    const total=session.tasks.length,objective=session.results.filter(result=>!result.selfRated),self=session.results.filter(result=>result.selfRated),independent=objective.filter(result=>result.independent).length;
    el('studyBody').innerHTML=`<div class="study-finish"><span class="study-finish-mark" aria-hidden="true">✓</span><p class="study-eyebrow">这一步，完成了</p><h2>${session.lessonId?esc(LESSONS.find(lesson=>lesson.id===session.lessonId).title):'给记忆加深了一点印象。'}</h2><p>完成 ${total} 个小练习${objective.length?`，其中 ${independent} 道选择题独立答对`:''}${self.length?`；${self.length} 道表达题已自查`:''}。</p><p class="study-small">需要再练的内容会回到复习中；顺利完成的题会隔几天再出现。</p><div class="study-question-actions"><button class="primary-btn" type="button" data-study-action="finish">今天先到这里</button><button class="text-btn" type="button" data-study-view="lessons">再选一个场景 →</button></div></div>`;
  }
  async function listen(){
    const task=currentTask(),synth=window.speechSynthesis;
    if(!task||task.skill!=='listen')return;
    const voice=synth?.getVoices().find(voice=>/^nl(?:[-_]|$)/i.test(voice.lang));
    if(!voice||!window.SpeechSynthesisUtterance){el('studyAudioStatus').textContent='这台设备暂没有可用的荷兰语语音。可稍后重试，或查看原文先练理解；原文辅助不计作独立听力。';return;}
    synth.cancel();const request=mediaRequest,taskId=task.id,utterance=new SpeechSynthesisUtterance(task.text);utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=.92;
    utterance.onstart=()=>{if(request!==mediaRequest||currentTask()?.id!==taskId)return;session.heard++;if(session.heard>1)session.assisted=true;el('studyAudioStatus').textContent='正在播放…';};
    utterance.onend=()=>{if(request===mediaRequest&&currentTask()?.id===taskId)el('studyAudioStatus').textContent='播放完成，试着选出答案。';};
    utterance.onerror=()=>{if(request===mediaRequest&&currentTask()?.id===taskId)el('studyAudioStatus').textContent='语音未能播放，可重试或查看原文。';};
    synth.speak(utterance);
  }
  async function record(){
    if(recorder&&recorder.state!=='inactive'){pauseMedia();return;}
    const task=currentTask();if(!task||task.skill!=='speak')return;
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){el('studyRecordStatus').textContent='当前浏览器不支持录音。你仍可开口练习，再对照示例自查。';return;}
    releaseRecording();const request=mediaRequest,taskId=task.id,button=root.querySelector('[data-study-action="record"]');button.disabled=true;
    try{
      const input=await navigator.mediaDevices.getUserMedia({audio:true});
      if(request!==mediaRequest||currentTask()?.id!==taskId){input.getTracks().forEach(track=>track.stop());return;}
      stream=input;const chunks=[],currentRecorder=new MediaRecorder(input);recorder=currentRecorder;
      currentRecorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
      currentRecorder.onstop=()=>{
        input.getTracks().forEach(track=>track.stop());clearTimeout(recordingTimeout);
        if(recorder===currentRecorder&&currentTask()?.id===taskId&&chunks.length){if(recordingUrl)URL.revokeObjectURL(recordingUrl);recordingUrl=URL.createObjectURL(new Blob(chunks,{type:currentRecorder.mimeType}));const audio=el('studyRecording');if(audio){audio.src=recordingUrl;audio.hidden=false;}if(el('studyRecordStatus'))el('studyRecordStatus').textContent='录音留在本次页面，可回听并对照要点。';}
        if(button.isConnected){button.disabled=false;button.textContent='重新录音';}
      };
      currentRecorder.start();button.disabled=false;button.textContent='停止录音';el('studyRecordStatus').textContent='正在录音，仅本机回放…';
      recordingTimeout=setTimeout(()=>{if(currentRecorder.state!=='inactive')pauseMedia();},60000);
    }catch{stream?.getTracks().forEach(track=>track.stop());stream=null;if(button.isConnected){button.disabled=false;el('studyRecordStatus').textContent='未能开启麦克风。你仍可开口练习，再对照示例自查。';}}
  }
  function renderQuiz(){
    if(quiz?.finished){renderQuizResult();return;}
    if(quiz){renderQuizTask();return;}
    const last=study.quizHistory.at(-1);
    el('studyBody').innerHTML=`<div class="study-page-heading"><h2>关掉提示，独立试一次。</h2><p>阅读 + KNM · 6 道本站自编题 · 10 分钟</p></div><div class="study-quiz-intro"><h3>这一轮，检验自己能否找准信息。</h3><ul><li>作答时不展示中文与答案，提交后统一解析。</li><li>这里是专项小测；完整考试形式请做 DUO 官方练习。</li><li>题组固定，再次练习会遇到相同题目。</li></ul><button class="primary-btn" type="button" data-study-action="start-quiz">开始 6 题自测 →</button>${last?`<p class="study-small">上次练习：${last.day} · ${last.correct} / 6 题答对</p>`:''}</div><div class="study-resource-line"><span>口语、听力、写作及完整练习</span>${sourceLink('practice')}</div>`;
  }
  function startQuiz(){quiz={index:0,answers:{},expires:Date.now()+600000,finished:false};clearInterval(quizTimer);quizTimer=setInterval(tickQuiz,1000);renderQuizTask();}
  function tickQuiz(){
    if(!quiz||quiz.finished)return;
    const left=Math.max(0,Math.ceil((quiz.expires-Date.now())/1000));
    if(el('studyQuizTime'))el('studyQuizTime').textContent=`${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`;
    if(!left)finishQuiz();
  }
  function renderQuizTask(){
    const task=QUIZ[quiz.index];
    el('studyBody').innerHTML=`<div class="study-practice"><div class="study-practice-top"><span>${quiz.index+1} / ${QUIZ.length} · ${SKILLS[task.skill]}</span><span class="study-timer" aria-label="自测剩余时间" id="studyQuizTime"></span></div>${task.text?`<div class="study-message" lang="nl">${esc(task.text)}</div>`:''}<h2 class="study-question" lang="nl">${esc(task.prompt)}</h2><fieldset class="study-options"><legend class="sr-only">选择一个答案</legend>${task.options.map((option,index)=>`<label class="study-option"><input type="radio" name="quizAnswer" value="${index}" ${quiz.answers[task.id]===index?'checked':''}><span lang="nl">${esc(option)}</span></label>`).join('')}</fieldset><div class="study-question-actions">${quiz.index?'<button class="outline-btn" type="button" data-study-action="quiz-back">上一题</button>':''}<button class="primary-btn" type="button" data-study-action="quiz-next" ${Number.isInteger(quiz.answers[task.id])?'':'disabled'}>${quiz.index===QUIZ.length-1?'提交本轮自测':'下一题 →'}</button></div></div>`;tickQuiz();
  }
  function finishQuiz(){
    if(!quiz||quiz.finished)return;quiz.finished=true;clearInterval(quizTimer);
    quiz.correct=QUIZ.filter(task=>quiz.answers[task.id]===task.answer).length;
    study.quizHistory=[...study.quizHistory,{day:dayKey(),correct:quiz.correct}].slice(-5);save();
    if(view==='quiz')renderQuizResult();
  }
  function renderQuizResult(){
    el('studyBody').innerHTML=`<div class="study-page-heading"><p class="study-eyebrow">本轮自测完成</p><h2>答对了 ${quiz.correct} / ${QUIZ.length} 题。</h2><p>这是本站练习结果。接下来回看依据，再用 DUO 官方练习熟悉考试。</p></div><div class="study-quiz-results">${QUIZ.map((task,index)=>`<details><summary><span>${quiz.answers[task.id]===task.answer?'✓':'待复习'} · 第 ${index+1} 题</span><span>${SKILLS[task.skill]}</span></summary><p lang="nl">${esc(task.text)} ${esc(task.prompt)}</p><p>你的答案：<span lang="nl">${esc(task.options[quiz.answers[task.id]]||'未作答')}</span></p><p>参考答案：<span lang="nl">${esc(task.options[task.answer])}</span></p><p>${esc(task.explanation)}</p>${task.source?sourceLink(task.source):''}</details>`).join('')}</div><div class="study-question-actions"><button class="primary-btn" type="button" data-study-action="close-quiz">回到练习</button>${sourceLink('practice')}</div>`;
  }
  function targetNotice(){
    const target=targetWindow(study.targetDate);
    return !target?'口语、写作成绩目前约需 16 周，安排时也请预留考位和补考时间。':target.days<0?'目标日期已过，可以调整日期后重新安排。':target.tight?`距离目标还有 ${target.days} 天，少于当前口语、写作约 16 周的出分时间。请先核对考位和已考科目，再调整安排。`:`距离目标还有 ${target.days} 天。口语、写作目前约需 16 周出分，还需预留预约和可能的补考时间。`;
  }
  function renderExam(){
    el('studyBody').innerHTML=`<div class="study-page-heading"><h2>先确认要考什么，再安排时间。</h2><p>到 Mijn Inburgering 确认个人科目与等级；以下状态由你记录。</p></div><div class="study-exam-layout"><div><div class="study-exam-list">${EXAMS.map(exam=>{const saved=study.exams[exam.id]||{};return `<article class="study-exam-row"><div><h3>${exam.name}</h3><span>${exam.duration}</span><p>${exam.format}</p></div><div class="study-exam-fields"><label for="exam-${exam.id}">我的状态<select id="exam-${exam.id}" data-exam-status="${exam.id}">${Object.entries(EXAM_STATUSES).map(([id,name])=>`<option value="${id}" ${saved.status===id?'selected':''}>${name}</option>`).join('')}</select></label><label for="exam-date-${exam.id}">考试日期<input id="exam-date-${exam.id}" type="date" data-exam-date="${exam.id}" value="${saved.date||''}"></label></div></article>`;}).join('')}</div><p class="study-small">形式与时长：${sourceLink('exams')} · KNM 为 45 分钟</p></div><aside class="study-exam-aside"><div class="paper-card"><h3>给出分留出缓冲</h3><label for="studyTargetDate">希望取得成绩的日期<input type="date" id="studyTargetDate" value="${study.targetDate}"></label><p id="studyTargetNotice">${esc(targetNotice())}</p>${sourceLink('results')}</div><div class="study-official-links">${sourceLink('account')}${sourceLink('practice')}${sourceLink('ona')}</div></aside></div><details class="study-guide"><summary>A2、B1 和 ONA，怎样确认自己的路线？</summary><p>IND 当前对永居相关融入要求写明 A2；个人如已有 DUO 或市政府指定的融入路线，请先核对自己的规定。居留满五年之外，还需要满足相应居留、收入等条件。</p><p>${sourceLink('integration')}</p><p>ONA 不是所有人都要考。过去 12 个月内，在荷兰受雇至少 6 个月、这些月份每月工作至少 48 小时，可能可以申请工作豁免；需要自行申请，由 DUO 决定。</p><p>${sourceLink('ona')}</p><p>KNM 自 2025 年 7 月起调整过内容，请使用 DUO 当前提供的练习。上方五科是本模块的核心练习，实际需考科目以个人官方记录为准。</p><p>要求核对：${CONTENT_CHECKED}。${sourceLink('practice')}</p></details>`;
  }
  root.addEventListener('input',event=>{if(event.target.id==='studyResponse'&&session)session.drafts[currentTask().id]=event.target.value;});
  root.addEventListener('change',event=>{
    const input=event.target;
    if(input.name==='studyAnswer'&&session&&!session.checked){session.choice=Number(input.value);root.querySelector('[data-study-action="check"]').disabled=false;}
    if(input.hasAttribute('data-self-check'))root.querySelector('[data-study-action="self-done"]').disabled=[...root.querySelectorAll('[data-self-check]')].some(box=>!box.checked);
    if(input.name==='quizAnswer'&&quiz&&!quiz.finished){quiz.answers[QUIZ[quiz.index].id]=Number(input.value);root.querySelector('[data-study-action="quiz-next"]').disabled=false;}
    const examId=input.dataset.examStatus||input.dataset.examDate;
    if(examId){const previous=study.exams[examId]||{status:'',date:''};study.exams[examId]={...previous,...(input.dataset.examStatus?{status:input.value}:{date:input.value})};save();}
    if(input.id==='studyTargetDate'){study.targetDate=input.value;save();el('studyTargetNotice').textContent=targetNotice();}
  });
  root.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||button.disabled)return;
    if(button.dataset.studyView){setView(button.dataset.studyView);return;}
    if(button.dataset.studyLesson){const lesson=LESSONS.find(lesson=>lesson.id===button.dataset.studyLesson);if(lesson)startSession(lesson.tasks,lesson.id);return;}
    const action=button.dataset.studyAction;
    if(action==='home')setView('today');
    if(action==='resume')renderTask();
    if(action==='short')startSession(dueTasks(study,new Date(),1).length?dueTasks(study,new Date(),1):[(recommendedLesson(study)||LESSONS[0]).tasks[0]]);
    if(action==='review')startSession(dueTasks(study));
    if(action==='check')checkAnswer();
    if(action==='next')nextTask();
    if(action==='hint'){session.assisted=true;el('studyTranslation').hidden=!el('studyTranslation').hidden;}
    if(action==='listen')listen();
    if(action==='transcript'){session.assisted=true;el('studyTranscript').hidden=false;el('studyAudioStatus').textContent='已展开原文，本题记为辅助理解练习。';}
    if(action==='record')record();
    if(action==='model'){
      if(currentTask().skill==='write'&&!el('studyResponse').value.trim()){el('studyTaskNotice').textContent='先试着写一句，再看示例。';el('studyResponse').focus();return;}
      pauseMedia();el('studyModel').hidden=false;button.hidden=true;el('studyModel').scrollIntoView({block:'nearest'});
    }
    if(action==='self-done')selfRate(true);
    if(action==='self-review')selfRate(false);
    if(action==='finish'){session=null;setView('today');}
    if(action==='start-quiz')startQuiz();
    if(action==='quiz-back'){quiz.index--;renderQuizTask();}
    if(action==='quiz-next'){if(quiz.index===QUIZ.length-1)finishQuiz();else{quiz.index++;renderQuizTask();}}
    if(action==='close-quiz'){quiz=null;setView('today');}
    if(action==='reset'){
      if(!resetPending){resetPending=true;button.textContent='再次点击，确认清除学习记录';return;}
      releaseRecording();clearInterval(quizTimer);study=freshStudy();session=null;quiz=null;resetPending=false;button.textContent='清除本机学习记录';save();setView('today');
    }
  });
  window.addEventListener('pagehide',releaseRecording);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')pauseMedia();else if(quiz&&!quiz.finished)tickQuiz();});
  setView('today');return {pauseMedia};
}
