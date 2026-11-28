import {A2_GUIDE} from './a2-guide.js';
import {A2_OBJECTIVE} from './a2-objective.js';
import {A2_OUTPUT} from './a2-output.js';

export const BANK = {...A2_OBJECTIVE, ...A2_OUTPUT};
export const MOCK_MINUTES = {read:10, listen:9, write:40, speak:8, knm:8};
export const PREP_KEY = 'hebao_a2_prep_v1';
export const productive = subject => subject === 'write' || subject === 'speak';
const empty = () => ({version:1, forms:{}, official:{}, drills:{}});
const modes = ['a', 'b'];
const officialResults = ['pending', 'met', 'review'];
const integer = (n, max) => Number.isInteger(n) && n >= 0 && n <= max;

function summaryValue(value, subject, form) {
  if (!value || !Number.isFinite(value.at)) return null;
  const total = BANK[subject][form].length;
  if (!integer(value.attempted,total) || !integer(value.correct,value.attempted)) return null;
  return {at:value.at, attempted:value.attempted, correct:value.correct};
}

function drillValue(value, subject, type) {
  if (!value || !Number.isFinite(value.at)) return null;
  const total = BANK[subject].practice.filter(q => q.type === type).length;
  if (!total || !integer(value.attempted, total) || !integer(value.correct, value.attempted)) return null;
  const best = integer(value.best, total) ? Math.max(value.correct, value.best) : value.correct;
  return {at:value.at, attempted:value.attempted, correct:value.correct, best, total};
}

function normalize(data) {
  const clean = empty();
  if (data?.version !== 1) return clean;
  for (const [subject, guide] of Object.entries(A2_GUIDE)) {
    for (const form of modes) {
      const key = subject + '/' + form;
      const entry = data.forms?.[key];
      if (typeof entry?.token === 'string' && entry.token.length > 0 && entry.token.length < 100) {
        clean.forms[key] = {token:entry.token, first:summaryValue(entry.first,subject,form), last:summaryValue(entry.last,subject,form)};
      }
    }
    for (const {url} of guide.official) {
      const entry = data.official?.[url];
      if (entry && officialResults.includes(entry.result) && Number.isFinite(entry.at)) {
        clean.official[url] = {result:entry.result, timed:entry.timed === true, at:entry.at};
      }
    }
    for (const t of guide.types) {
      const key = subject + '/' + t.id;
      const drill = drillValue(data.drills?.[key], subject, t.id);
      if (drill) clean.drills[key] = drill;
    }
  }
  return clean;
}

export function mergePrep(localRaw, remoteRaw) {
  const a = normalize(localRaw), b = normalize(remoteRaw), out = empty();
  for (const key of new Set([...Object.keys(a.forms), ...Object.keys(b.forms)])) {
    const fa = a.forms[key], fb = b.forms[key];
    if (!fa || !fb) { out.forms[key] = fa || fb; continue; }
    const first = fa.first && fb.first ? (fa.first.at <= fb.first.at ? fa.first : fb.first) : (fa.first || fb.first);
    const last = fa.last && fb.last ? (fa.last.at >= fb.last.at ? fa.last : fb.last) : (fa.last || fb.last);
    out.forms[key] = { token: fa.token || fb.token, first, last };
  }
  for (const url of new Set([...Object.keys(a.official), ...Object.keys(b.official)])) {
    const oa = a.official[url], ob = b.official[url];
    out.official[url] = oa && ob ? (oa.at >= ob.at ? oa : ob) : (oa || ob);
  }
  for (const key of new Set([...Object.keys(a.drills), ...Object.keys(b.drills)])) {
    const da = a.drills[key], db = b.drills[key];
    if (!da || !db) { out.drills[key] = da || db; continue; }
    const latest = da.at >= db.at ? da : db;
    out.drills[key] = { ...latest, best: Math.max(da.best, db.best) };
  }
  return out;
}

export function prepCounts(raw) {
  const data = normalize(raw);
  const subjects = Object.keys(A2_GUIDE);
  const drillsTotal = subjects.reduce((sum, s) => sum + A2_GUIDE[s].types.length, 0);
  const drillsDone = Object.keys(data.drills).length;
  const mocksTotal = subjects.length * modes.length;
  const mocksDone = Object.values(data.forms).filter(f => f?.first || f?.last).length;
  const officialDone = Object.keys(data.official).length;
  return { drillsDone, drillsTotal, mocksDone, mocksTotal, officialDone };
}

// Store outcomes, never typed answers or microphone data. Re-read before editing
// so that saves in another tab do not overwrite results for another paper.
export function openPrepLedger(storage) {
  let cached = empty(), durable = true;
  function read() {
    if (durable) {
      try { cached = normalize(JSON.parse(storage.getItem(PREP_KEY) || 'null')); }
      catch { durable = false; }
    }
    return cached;
  }
  function update(edit) {
    const data = read();
    edit(data);
    cached = data;
    try { storage.setItem(PREP_KEY,JSON.stringify(data)); durable = true; }
    catch { durable = false; }
    return data;
  }
  return {
    read, available:() => durable,
    start(subject, form, token) {
      let fresh = false;
      update(data => {
        const key = subject + '/' + form;
        if (!data.forms[key]) { data.forms[key] = {token,first:null,last:null}; fresh = true; }
      });
      return fresh;
    },
    finish(subject, form, token, stats) {
      const result = summaryValue({...stats,at:Date.now()},subject,form);
      if (!result) return;
      update(data => {
        const entry = data.forms[subject + '/' + form];
        if (!entry) return;
        entry.last = result;
        if (entry.token === token && !entry.first) entry.first = result;
      });
    },
    recordDrill(subject, type, stats) {
      if (!A2_GUIDE[subject]?.types.some(t => t.id === type)) return;
      update(data => {
        const key = subject + '/' + type;
        const prev = data.drills[key];
        const next = drillValue({...stats, best:Math.max(prev?.best || 0, stats?.correct || 0), at:Date.now()}, subject, type);
        if (next) data.drills[key] = next;
      });
    },
    markOfficial(subject, url, result, timed) {
      if (!A2_GUIDE[subject]?.official.some(paper => paper.url === url) || !officialResults.includes(result)) return;
      update(data => {data.official[url] = {result, timed:timed === true, at:Date.now()};});
    },
    reset() {update(data => Object.assign(data,empty()));}
  };
}

export function attempted(subject, item, response = {}) {
  if (subject === 'write') return (item.fields || ['']).every((_,i) => Boolean(response.text?.[i]?.trim()));
  if (subject === 'speak') return response.spoken === true;
  return integer(response.choice,item.options.length-1) && (subject !== 'listen' || response.heard === true || response.transcript === true);
}

export function summarize(subject, items, responses) {
  const byType = {};
  let completed = 0, correct = 0;
  for (const item of items) {
    const response = responses[item.id] || {};
    const group = byType[item.type] ||= {total:0,attempted:0,correct:0};
    group.total++;
    if (!attempted(subject,item,response)) continue;
    completed++; group.attempted++;
    if (!productive(subject) && response.choice === item.answer && !response.transcript) { correct++; group.correct++; }
  }
  return {total:items.length, attempted:completed, correct, byType};
}

export function readiness(subject, data) {
  const guide = A2_GUIDE[subject];
  const records = guide.official.map(paper => data.official[paper.url]).filter(Boolean).sort((a,b)=>b.at-a.at);
  const strong = entry => entry.result === 'met' && entry.timed;
  const officialNote = productive(subject) ? '教师按样题要求复核' : '按官方练习反馈核对';
  if (records.length >= 2 && records.slice(0,2).every(strong)) {
    return {title:'可考虑报考这科',detail:'你记录的最近两份不同官方样卷都在规定时间内独立完成，并经' + officialNote + '达到要求。正式结果由 DUO 评定。'};
  }
  if (records[0]?.result === 'review') return {title:'先补官方样卷暴露的弱项',detail:'最近一份官方样卷记录为仍需练习。选对应题型补练，再换一份官方样卷检验。'};
  if (records[0] && strong(records[0])) return {title:'再用一份官方样卷确认',detail:'已有一份限时独立达标的记录。换一份未做过的官方样卷，检验发挥是否稳定。'};
  const first = modes.map(form=>data.forms[subject+'/'+form]?.first).filter(Boolean).sort((a,b)=>a.at-b.at);
  if (productive(subject) && (first.length || records.length)) return {title:'表达质量需要复核',detail:'自查能发现漏答。请熟悉 A2 标准的教师复核完整官方样卷的切题程度、语言和可理解性，再记录结果。'};
  const latest=first.at(-1);
  if (latest && latest.attempted < BANK[subject].a.length) {
    const detail='最近一份初见短测只作答了 '+latest.attempted+'/'+BANK[subject].a.length+' 题。未答的题型还缺少判断依据。';
    return {title:'先完整做一套短测',detail:detail+(first.length===2?' 两份短测均已做过，可换官方样卷计时练习。':' 试试另一份未见卷，给每道题留出时间。')};
  }
  if (first.some(item=>item.correct < 5 || item.attempted < BANK[subject].a.length)) {
    if (first.length === 2 && first.at(-1).correct >= 5)
      return {title:'用官方整卷确认进步',detail:'最近一套初见短测已答对至少 5 道。两次表现有差异，建议再用官方整卷检验。'};
    return {title:'先补错题对应的题型',detail:'最近的初见短测还有薄弱项。看交卷解析，按出错类型练习，再换一套题。'};
  }
  if (first.length === 2) return {title:'可以做 DUO 整套样卷',detail:'两套初见短测都至少答对 5/6。该分数是本站的复习建议，正式考试就绪度还需用整套官方样卷核对。'};
  if (first.length) return {title:'再做一套未见卷',detail:'一套短测覆盖的材料有限。先核对错项，再用另一套独立作答。'};
  return {title:'先测一次这科的水平',detail:productive(subject)?'按题意独立作答，交卷后对照要点，再用官方样卷请人复核。':'先做一套限时短测。交卷后查看各题型答对几道，决定先补哪一项。'};
}
