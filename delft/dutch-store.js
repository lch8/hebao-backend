import {LESSONS,TASKS,EXAMS} from './dutch-content.js';

export const STUDY_KEY = 'hebao_dutch_v1';
export const EXAM_STATUSES = {'':'待确认',needed:'待预约',booked:'已预约',waiting:'等成绩',passed:'已通过',exempt:'已获豁免'};
const taskIds = new Set(TASKS.map(task=>task.id));
const validDate = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0,10)===value;
export const dayKey = (now=new Date()) => new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
const afterDays = (day,days) => {const date=new Date(`${day}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+days);return date.toISOString().slice(0,10);};
export function freshStudy(){return {version:1,answers:{},completed:[],exams:{},targetDate:'',quizHistory:[]};}
export function normalizeStudy(value){
  const result=freshStudy();
  if(!value||value.version!==1||typeof value!=='object')return result;
  for(const id of taskIds){
    const answer=value.answers?.[id];
    if(!answer||!Number.isInteger(answer.attempts)||answer.attempts<1||!validDate(answer.lastDay)||!validDate(answer.reviewAt))continue;
    result.answers[id]={attempts:Math.min(answer.attempts,10000),correct:answer.correct===true,independent:answer.independent===true,needsReview:answer.needsReview===true,lastDay:answer.lastDay,reviewAt:answer.reviewAt};
  }
  result.completed=LESSONS.filter(lesson=>Array.isArray(value.completed)&&value.completed.includes(lesson.id)&&lesson.tasks.every(task=>result.answers[task.id])).map(lesson=>lesson.id);
  for(const exam of EXAMS){
    const entry=value.exams?.[exam.id];
    if(entry&&Object.hasOwn(EXAM_STATUSES,entry.status))result.exams[exam.id]={status:entry.status,date:validDate(entry.date)?entry.date:''};
  }
  if(validDate(value.targetDate))result.targetDate=value.targetDate;
  if(Array.isArray(value.quizHistory))result.quizHistory=value.quizHistory.filter(item=>item&&validDate(item.day)&&Number.isInteger(item.correct)&&item.correct>=0&&item.correct<=6).slice(-5).map(item=>({day:item.day,correct:item.correct}));
  return result;
}
export function loadStudy(storage){
  try{return {state:normalizeStudy(JSON.parse(storage.getItem(STUDY_KEY)||'null')),available:true};}
  catch{return {state:freshStudy(),available:false};}
}
export function saveStudy(storage,state){try{storage.setItem(STUDY_KEY,JSON.stringify(normalizeStudy(state)));return true;}catch{return false;}}
export function recordTask(state,id,{correct=false,assisted=false,selfRated=false}={},now=new Date()){
  if(!taskIds.has(id))throw new Error('Unknown practice task');
  const next=normalizeStudy(state),day=dayKey(now);
  const independent=correct&&!assisted&&!selfRated;
  next.answers[id]={attempts:Math.min((next.answers[id]?.attempts||0)+1,10000),correct:Boolean(correct),independent,needsReview:!correct||assisted,lastDay:day,reviewAt:afterDays(day,correct&&!assisted?3:1)};
  return next;
}
export function completeLesson(state,id){
  const next=normalizeStudy(state),lesson=LESSONS.find(lesson=>lesson.id===id);
  if(lesson&&lesson.tasks.every(task=>next.answers[task.id])&&!next.completed.includes(id))next.completed.push(id);
  return next;
}
export function dueTasks(state,now=new Date(),limit=3){
  const today=dayKey(now),answers=normalizeStudy(state).answers;
  return TASKS.filter(task=>answers[task.id]&&(answers[task.id].needsReview||answers[task.id].reviewAt<=today)).sort((a,b)=>Number(answers[b.id].needsReview)-Number(answers[a.id].needsReview)||answers[a.id].reviewAt.localeCompare(answers[b.id].reviewAt)).slice(0,limit);
}
export function recommendedLesson(state){return LESSONS.find(lesson=>!state.completed.includes(lesson.id))||null;}
export function targetWindow(targetDate,now=new Date()){
  if(!validDate(targetDate))return null;
  const days=Math.round((Date.parse(`${targetDate}T12:00:00Z`)-Date.parse(`${dayKey(now)}T12:00:00Z`))/86400000);
  return {days,tight:days<112};
}
