import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {A2_GUIDE as guide} from '../delft/a2-guide.js';
import {BANK, MOCK_MINUTES, PREP_KEY, attempted, openPrepLedger, productive, readiness, summarize} from '../delft/a2-progress.js';

const subjects = ['read','listen','write','speak','knm'];
const forms = ['practice','a','b'];
function memoryStorage() {
  const values = new Map();
  return {getItem:key=>values.get(key), setItem:(key,value)=>values.set(key,value)};
}

test('five exam guides link to the official practice sets and give searchable words, examples and concrete advice',()=>{
  assert.deepEqual(Object.keys(guide), subjects);
  assert.deepEqual(subjects.map(id=>guide[id].minutes), [65,45,40,35,45]);
  assert.deepEqual(subjects.map(id=>guide[id].official.length), [4,3,3,3,2]);
  const urls = new Set();
  for (const [subject,g] of Object.entries(guide)) {
    assert.ok(g.format && g.challenge && g.nl && g.formatUrl.startsWith('https://www.inburgeren.nl/'));
    assert.equal(g.types.length,3);
    assert.equal(new Set(g.types.map(t=>t.id)).size,3);
    for (const t of g.types) assert.ok(t.label && t.focus && t.tip);
    assert.ok(g.words.length >= 20);
    for (const word of g.words) assert.ok(word.nl && word.zh && word.example);
    for (const p of g.official) {
      const url=new URL(p.url);
      assert.equal(url.protocol,'https:');
      assert.equal(url.hostname,subject==='write'?'www.inburgeren.nl':'oefenexamensduo.optimumassessment.com');
      assert.ok(!urls.has(p.url) && p.label);
      urls.add(p.url);
    }
  }
  assert.equal(subjects.reduce((sum,s)=>sum+guide[s].words.length,0),104);
});

test('drills and both mock papers have distinct materials and cover all the listed task types',()=>{
  const ids=new Set(), prompts=new Set();
  for (const subject of subjects) {
    const types=guide[subject].types.map(t=>t.id).sort();
    for (const form of forms) {
      const items=BANK[subject][form];
      assert.deepEqual([...new Set(items.map(q=>q.type))].sort(),types);
      assert.equal(items.length,form==='practice'?18:!productive(subject)?6:4);
      for (const q of items) {
        assert.match(q.id,/^[a-z0-9-]+$/);
        assert.ok(!ids.has(q.id) && !prompts.has(q.text),'reused ID or source text '+q.id);
        ids.add(q.id); prompts.add(q.text);
        assert.ok(q.text && q.prompt);
        if (productive(subject)) {
          assert.equal(q.checks.length,3);
          assert.ok(q.model && !q.options);
          if (q.type==='form') assert.ok(q.fields.length>=2);
        } else {
          assert.equal(new Set(q.options).size,3);
          assert.ok(Number.isInteger(q.answer) && q.answer>=0 && q.answer<q.options.length && q.why);
          if(subject==='knm')assert.match(q.source,/^https:\/\//);
        }
      }
    }
    assert.ok(MOCK_MINUTES[subject]<=guide[subject].minutes);
  }
  assert.equal(ids.size,142);
});

test('every listening task has a matching local MP3 and the directory has no orphan recordings',()=>{
  const directory=new URL('../delft/a2-audio/',import.meta.url);
  const names=Object.values(BANK.listen).flat().map(q=>q.id+'.mp3').sort();
  assert.deepEqual(readdirSync(directory).sort(),names);
  for (const name of names) {
    const bytes=readFileSync(new URL(name,directory));
    assert.ok(bytes.length>10000);
    assert.ok(bytes.subarray(0,3).toString()==='ID3' || bytes[0]===255);
  }
});

test('listening requires hearing the passage and assisted practice is counted separately',()=>{
  const items=BANK.listen.practice, [one,two,three]=items;
  const responses={
    [one.id]:{choice:one.answer,heard:true},
    [two.id]:{choice:two.answer,transcript:true},
    [three.id]:{choice:three.answer}
  };
  const stats=summarize('listen',items,responses);
  assert.deepEqual([stats.total,stats.attempted,stats.correct],[18,2,1]);
  assert.deepEqual(stats.byType[one.type],{total:6,attempted:2,correct:1});
});

test('writing needs every requested field, speaking needs a response and neither gets an automatic quality score',()=>{
  const item=BANK.write.practice.find(q=>q.fields);
  const incomplete={text:item.fields.map((_,i)=>i===0?'   ':'antwoord')};
  assert.equal(attempted('write',item,incomplete),false);
  const writing=summarize('write',[item],{[item.id]:{text:item.fields.map(()=>'antwoord')}});
  assert.equal(writing.attempted,1);assert.equal(writing.correct,0);
  const oral=BANK.speak.b[0];
  assert.equal(attempted('speak',oral,{checks:[true,true,true]}),false);
  const speaking=summarize('speak',[oral],{[oral.id]:{spoken:true}});
  assert.equal(speaking.attempted,1);assert.equal(speaking.correct,0);
});

test('reopening, abandoning and repeating a paper cannot replace a first attempt; reload can read the result',()=>{
  const storage=memoryStorage(), ledger=openPrepLedger(storage);
  assert.equal(ledger.start('read','a','initial'),true);
  assert.equal(ledger.start('read','a','repeated'),false);
  ledger.finish('read','a','repeated',{attempted:6,correct:6});
  assert.equal(ledger.read().forms['read/a'].first,null);
  ledger.finish('read','a','initial',{attempted:3,correct:2});
  ledger.finish('read','a','initial',{attempted:6,correct:6});
  const saved=openPrepLedger(storage).read().forms['read/a'];
  assert.equal(saved.first.correct,2);assert.equal(saved.last.correct,6);
  assert.match(readiness('read',ledger.read()).title,/先完整/);
  assert.equal(ledger.start('read','b','another'),true);
  assert.equal(ledger.start('listen','a','listen'),true);
});

test('great original mock scores recommend the official paper, including when the papers are taken B then A',()=>{
  const ledger=openPrepLedger(memoryStorage());
  for(const [form,correct] of [['b',4],['a',5]]) {
    ledger.start('read',form,form);
    ledger.finish('read',form,form,{attempted:6,correct});
  }
  const data=ledger.read();
  data.forms['read/b'].first.at=100;data.forms['read/a'].first.at=200;
  assert.match(readiness('read',data).title,/官方整卷/);
  data.forms['read/b'].first.correct=6;
  assert.match(readiness('read',data).title,/DUO 整套样卷/);
  ledger.start('write','a','write');
  ledger.finish('write','a','write',{attempted:4,correct:0});
  assert.match(readiness('write',ledger.read()).title,/复核/);
});

test('readiness needs two distinct official papers recorded as timed and checked, and respects a later poor result',()=>{
  const ledger=openPrepLedger(memoryStorage());
  const [a,b,c]=guide.read.official.map(p=>p.url);
  ledger.markOfficial('read',a,'met',true);
  ledger.markOfficial('read',a,'met',true);
  assert.match(readiness('read',ledger.read()).title,/再用一份/);
  ledger.markOfficial('read',b,'met',false);
  assert.doesNotMatch(readiness('read',ledger.read()).title,/可考虑报考/);
  ledger.markOfficial('read',b,'met',true);
  assert.match(readiness('read',ledger.read()).title,/可考虑报考/);
  ledger.markOfficial('read',c,'review',true);
  const records=ledger.read();records.official[c].at+=5;
  assert.match(readiness('read',records).title,/弱项/);
  ledger.markOfficial('listen',a,'pending',false);
  assert.equal(ledger.read().official[a].result,'met');
});

test('invalid saved data, blocked storage, and a reset leave the module usable',()=>{
  const storage=memoryStorage();
  storage.setItem(PREP_KEY,'{broken');
  const ledger=openPrepLedger(storage);
  assert.deepEqual(ledger.read().forms,{});
  ledger.start('knm','a','saved');assert.equal(ledger.available(),true);
  const data=JSON.parse(storage.getItem(PREP_KEY));
  data.forms['knm/a'].first={at:10,attempted:2,correct:99};
  storage.setItem(PREP_KEY,JSON.stringify(data));
  assert.equal(ledger.read().forms['knm/a'].first,null);
  const blocked=openPrepLedger(undefined);
  assert.equal(blocked.start('knm','b','memory'),true);
  blocked.finish('knm','b','memory',{attempted:4,correct:3});
  assert.equal(blocked.available(),false);
  assert.equal(blocked.read().forms['knm/b'].first.correct,3);
  blocked.reset();assert.deepEqual(blocked.read().forms,{});
});

test('drill completions record best scores and prepCounts summarizes drills and mocks', async () => {
  const {prepCounts} = await import('../delft/a2-progress.js');
  const storage = memoryStorage(), ledger = openPrepLedger(storage);
  ledger.recordDrill('read', 'notice', {attempted:2, correct:2});
  ledger.recordDrill('read', 'notice', {attempted:2, correct:1});
  ledger.recordDrill('read', 'unknown-type', {attempted:2, correct:2});
  ledger.start('read', 'a', 't1');
  ledger.finish('read', 'a', 't1', {attempted:6, correct:5});
  const saved = ledger.read();
  assert.equal(saved.drills['read/notice'].correct, 1);
  assert.equal(saved.drills['read/notice'].best, 2);
  assert.equal(saved.drills['read/unknown-type'], undefined);
  const counts = prepCounts(saved);
  assert.equal(counts.drillsDone, 1);
  assert.equal(counts.drillsTotal, 15);
  assert.equal(counts.mocksDone, 1);
  assert.equal(counts.mocksTotal, 10);
});

test('mistake notebook records missed and transcript-assisted items, clears on independent right answer, and syncs with savedWords', async () => {
  const {activeMistakes, mergePrep, prepCounts} = await import('../delft/a2-progress.js');
  const s1 = memoryStorage(), l1 = openPrepLedger(s1);
  const readQ = BANK.read.practice[0];
  const listenQ = BANK.listen.practice[0];
  const wrongRead = (readQ.answer + 1) % readQ.options.length;

  l1.recordMistakes([readQ, listenQ], {
    [readQ.id]: {choice: wrongRead},
    [listenQ.id]: {choice: listenQ.answer, transcript: true},
  });
  assert.equal(activeMistakes(l1.read()).length, 2);
  assert.equal(activeMistakes(l1.read(), 'read').length, 1);
  assert.equal(activeMistakes(l1.read(), 'listen').length, 1);
  assert.equal(prepCounts(l1.read()).mistakesCount, 2);

  // Independent correct answer clears readQ; transcript-assisted listenQ stays in mistakes
  l1.recordMistakes([readQ, listenQ], {
    [readQ.id]: {choice: readQ.answer},
    [listenQ.id]: {choice: listenQ.answer, transcript: true},
  });
  assert.equal(activeMistakes(l1.read(), 'read').length, 0);
  assert.equal(activeMistakes(l1.read(), 'listen').length, 1);

  // Independent listening correct answer clears listenQ
  l1.recordMistakes([listenQ], {[listenQ.id]: {choice: listenQ.answer, heard: true}});
  assert.equal(activeMistakes(l1.read()).length, 0);

  // Saved wordbook validates against official guide words and toggles cleanly
  const wordA = guide.read.words[0].nl;
  const wordB = guide.knm.words[0].nl;
  assert.equal(l1.toggleWord(wordA), true);
  assert.equal(l1.toggleWord('not-in-a2-word-bank'), false);
  assert.deepEqual(l1.read().savedWords, [wordA]);
  assert.equal(prepCounts(l1.read()).savedWordsCount, 1);

  // Cloud merge unions savedWords and respects newer mistake timestamps
  const s2 = memoryStorage(), l2 = openPrepLedger(s2);
  l2.toggleWord(wordB);
  const olderMiss = {...l2.read(), mistakes: {[readQ.id]: {at: 100, misses: 1, clearedAt: 0}}};
  const merged = mergePrep(l1.read(), olderMiss);
  assert.equal(activeMistakes(merged, 'read').length, 0);
  assert.deepEqual(merged.savedWords.sort(), [wordA, wordB].sort());

  assert.equal(l1.toggleWord(wordA), false);
  assert.deepEqual(l1.read().savedWords, []);

  // Daily news vocab & read progress persist and merge cleanly across devices
  assert.equal(l1.toggleNewsWord({nl: 'de spits', zh: '高峰时段', note: 'NS 高峰'}), true);
  l1.markNewsRead('2026-11-28-1');
  assert.equal(prepCounts(l1.read()).newsReadCount, 1);
  assert.equal(prepCounts(l1.read()).savedWordsCount, 1);
  l2.toggleNewsWord({nl: 'de huurtoeslag', zh: '租房补贴', note: ''});
  l2.markNewsRead('2026-11-28-2');
  const mergedNews = mergePrep(l1.read(), l2.read());
  assert.equal(mergedNews.newsWords.length, 2);
  assert.deepEqual(mergedNews.newsRead.sort(), ['2026-11-28-1', '2026-11-28-2']);
  assert.equal(l1.toggleNewsWord({nl: 'DE SPITS', zh: '高峰时段'}), false);
  assert.equal(l1.read().newsWords.length, 0);
});
