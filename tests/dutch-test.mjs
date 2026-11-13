import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS,TASKS,QUIZ,SKILLS,SOURCES,EXAMS} from '../delft/dutch-content.js';
import {STUDY_KEY,freshStudy,normalizeStudy,loadStudy,saveStudy,recordTask,completeLesson,dueTasks,recommendedLesson,dayKey,targetWindow} from '../delft/dutch-store.js';

test('the twelve original scenes cover five skills and keep the self-test separate',()=>{
  assert.equal(LESSONS.length,12);assert.equal(TASKS.length,36);
  assert.equal(new Set([...TASKS,...QUIZ].map(task=>task.id)).size,42);
  assert.deepEqual([...new Set(TASKS.map(task=>task.skill))].sort(),Object.keys(SKILLS).sort());
  for(const task of [...TASKS,...QUIZ]){
    assert.ok(task.prompt);
    if(task.kind==='choice'){
      assert.equal(task.options.length,3);assert.ok(Number.isInteger(task.answer)&&task.answer>=0&&task.answer<3);assert.ok(task.explanation);
      if(task.skill==='knm')assert.ok(SOURCES[task.source]);
    }else{assert.equal(task.checks.length,3);assert.ok(task.example&&task.tip);}
  }
  for(const source of Object.values(SOURCES)){assert.equal(new URL(source.url).protocol,'https:');}
});

test('hints and self-assessment never become an independently correct objective answer',()=>{
  const time=new Date('2026-11-13T12:00:00Z'),initial=freshStudy();
  const independent=recordTask(initial,'coffee-1',{correct:true},time);
  assert.equal(independent.answers['coffee-1'].independent,true);
  assert.equal(Object.keys(initial.answers).length,0);
  const hinted=recordTask(independent,'coffee-1',{correct:true,assisted:true},time);
  assert.equal(hinted.answers['coffee-1'].independent,false);assert.equal(hinted.answers['coffee-1'].needsReview,true);
  const self=recordTask(hinted,'coffee-3',{correct:true,selfRated:true},time);
  assert.equal(self.answers['coffee-3'].independent,false);
});

test('practice schedules use Amsterdam dates and retain at most the requested review batch',()=>{
  const time=new Date('2026-11-13T23:30:00Z');assert.equal(dayKey(time),'2026-11-14');
  let state=freshStudy();
  state=recordTask(state,'coffee-1',{correct:true},time);
  assert.equal(state.answers['coffee-1'].reviewAt,'2026-11-17');
  assert.deepEqual(dueTasks(state,new Date('2026-11-16T10:00:00Z')),[]);
  assert.equal(dueTasks(state,new Date('2026-11-17T10:00:00Z'))[0].id,'coffee-1');
  for(const task of LESSONS[1].tasks)state=recordTask(state,task.id,{correct:false},time);
  assert.equal(dueTasks(state,time,1).length,1);assert.equal(dueTasks(state,time).length,3);
  assert.ok(dueTasks(state,time).every(task=>task.id.startsWith('leave-')));
});

test('visiting or partly answering a scene cannot mark it as completed',()=>{
  let state=freshStudy();assert.equal(recommendedLesson(state).id,'coffee');
  state=completeLesson(state,'coffee');assert.deepEqual(state.completed,[]);
  state=recordTask(state,'coffee-1',{correct:true});state=completeLesson(state,'coffee');assert.deepEqual(state.completed,[]);
  state=recordTask(state,'coffee-2',{correct:false});state=recordTask(state,'coffee-3',{correct:true,selfRated:true});
  state=completeLesson(state,'coffee');state=completeLesson(state,'coffee');
  assert.deepEqual(state.completed,['coffee']);assert.equal(recommendedLesson(state).id,'leave');
  assert.throws(()=>recordTask(state,'nonexistent',{correct:true}));
});

test('local records round-trip, reject invalid exam entries and tolerate corrupt or blocked storage',()=>{
  const values=new Map(),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
  let state=recordTask(freshStudy(),'doctor-1',{correct:true});
  state.exams={read:{status:'passed',date:'2026-11-13'},listen:{status:'injected',date:'2026-11-13'},write:{status:'booked',date:'2026-02-30'}};
  assert.equal(saveStudy(storage,state),true);
  const loaded=loadStudy(storage);assert.equal(loaded.available,true);assert.equal(loaded.state.answers['doctor-1'].correct,true);
  assert.equal(loaded.state.exams.read.status,'passed');assert.equal(loaded.state.exams.listen,undefined);assert.equal(loaded.state.exams.write.date,'');
  values.set(STUDY_KEY,'{invalid');assert.equal(loadStudy(storage).available,false);
  const blocked={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}};
  assert.equal(loadStudy(blocked).available,false);assert.equal(saveStudy(blocked,state),false);
});

test('untrusted saved fields cannot create completed scenes or arbitrary content',()=>{
  const state=normalizeStudy({version:1,answers:{unknown:{attempts:1},'coffee-1':{attempts:1,lastDay:'bad',reviewAt:'bad'}},completed:['coffee','fake'],targetDate:'<img>',exams:{read:{status:'<img>'}},quizHistory:[{day:'2026-11-13',correct:99}]});
  assert.deepEqual(state,freshStudy());assert.deepEqual(normalizeStudy({version:999}),freshStudy());
});

test('target dates include the current sixteen-week results buffer across DST changes',()=>{
  assert.equal(targetWindow('2027-04-17',new Date('2026-12-26T12:00:00Z')).days,112);
  assert.equal(targetWindow('2027-04-17',new Date('2026-12-26T12:00:00Z')).tight,false);
  assert.equal(targetWindow('2026-11-14',new Date('2026-11-13T12:00:00Z')).tight,true);
  assert.equal(targetWindow('',new Date()),null);assert.equal(targetWindow('2026-02-30'),null);
  assert.equal(EXAMS.find(exam=>exam.id==='write').duration,'40 分钟');
});
