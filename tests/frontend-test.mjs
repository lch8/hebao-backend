import test from 'node:test';
import assert from 'node:assert/strict';
import {cityEvents, upcomingCityEvents, amsterdamInput, amsterdamInstant, cityEventDraft} from '../delft/city-events.js';
import {posterLayout, makeQr} from '../delft/poster.js';
import {PUBLIC_SITE_URL, posterDestination} from '../delft/site-config.js';

test('curated events have attributable sources and are chronologically current at verification', () => {
  const picks = upcomingCityEvents(cityEvents, 'all', new Date('2026-11-11T12:00:00Z'));
  assert.equal(picks.length, 5);
  assert.equal(new Set(picks.map(event => event.id)).size, picks.length);
  for (const event of picks) {
    assert.equal(new URL(event.sourceUrl).protocol, 'https:');
    assert.ok(event.checkedOn && event.sourceName && event.price && event.place);
    assert.ok(Date.parse(event.checkedOn) < Date.parse(event.startsAt));
  }
  assert.deepEqual(picks.map(event => Date.parse(event.startsAt)), picks.map(event => Date.parse(event.startsAt)).sort((a,b) => a-b));
  assert.deepEqual(upcomingCityEvents(cityEvents, 'all', new Date('2026-12-09T00:00:00Z')), []);
});

test('weekend filter respects Amsterdam midnight and keeps the current Sunday', () => {
  const saturday = {id:'sat',startsAt:'2026-11-14T21:00:00+01:00'};
  const sunday = {id:'sun',startsAt:'2026-11-15T11:30:00+01:00'};
  const nextWeek = {id:'next',startsAt:'2026-11-21T11:30:00+01:00'};
  assert.deepEqual(upcomingCityEvents([nextWeek,sunday,saturday],'weekend',new Date('2026-11-11T12:00:00Z')).map(e=>e.id), ['sat','sun']);
  assert.deepEqual(upcomingCityEvents([nextWeek,sunday,saturday],'weekend',new Date('2026-11-14T23:05:00Z')).map(e=>e.id), ['sun']);
  assert.deepEqual(upcomingCityEvents([sunday],'weekend',new Date(sunday.startsAt)), []);
});

test('two-week filter includes fourteen local dates, without leaking into day fifteen', () => {
  const events = ['2026-11-24T23:30:00+01:00','2026-11-25T00:00:00+01:00'].map(startsAt=>({startsAt}));
  assert.equal(upcomingCityEvents(events,'fortnight',new Date('2026-11-11T08:00:00Z')).length,1);
});

test('meetup times stay in Amsterdam across device zones and DST transitions', () => {
  assert.equal(amsterdamInstant('2026-11-14T21:00').toISOString(),'2026-11-14T20:00:00.000Z');
  assert.equal(amsterdamInstant('2027-07-10T21:00').toISOString(),'2027-07-10T19:00:00.000Z');
  assert.equal(amsterdamInput('2026-11-14T23:30:00Z'),'2026-11-15T00:30');
  assert.throws(()=>amsterdamInstant('2027-03-28T02:30'));
  assert.throws(()=>amsterdamInstant('2027-02-30T12:00'));
  assert.throws(()=>amsterdamInstant(''));
  assert.equal(amsterdamInstant('2027-10-31T02:30').toISOString(),'2027-10-31T00:30:00.000Z');
});

test('official activity prefill retains the source, admission information and local time', () => {
  for (const event of cityEvents) {
    const draft = cityEventDraft(event);
    assert.ok(draft.description.includes(event.sourceUrl));
    assert.ok(draft.description.includes(event.price));
    assert.equal(amsterdamInstant(draft.startsAt).getTime(),Date.parse(event.startsAt));
    assert.ok(draft.title.length<=75 && draft.description.length<=450);
    assert.equal(draft.place,event.place);
  }
});

test('all 1–12 poster items fit above the attribution, including the old 10–12 cutoff', () => {
  for(let count=1;count<=12;count++) {
    const layout=posterLayout(count);
    for(let item=0;item<count;item++) {
      const bottom=layout.top+Math.floor(item/layout.columns)*(layout.cardHeight+layout.gap)+layout.cardHeight;
      assert.ok(bottom<layout.footerTop);
    }
    assert.ok(layout.height>layout.footerTop+160);
  }
  assert.throws(()=>posterLayout(0)); assert.throws(()=>posterLayout(13));
});

test('QR promotion uses the production site and only promises saved published inventory', () => {
  const draft=posterDestination();assert.equal(draft.url,PUBLIC_SITE_URL);assert.equal(draft.published,false);
  const saved=posterDestination({publishedId:'test/listing?a=1',dirty:false});
  assert.equal(new URL(saved.url).searchParams.get('item'),'test/listing?a=1');assert.equal(saved.published,true);
  const unsaved=posterDestination({publishedId:'test',dirty:true});
  assert.equal(unsaved.url,PUBLIC_SITE_URL);assert.equal(unsaved.published,false);
  assert.equal(new URL(saved.url).hostname,'hebao-backend.vercel.app');
  // Exercise the bundled encoder at the longest normal URL, without network requests.
  assert.doesNotThrow(()=>makeQr(posterDestination({publishedId:'12345678-1234-1234-1234-123456789012',dirty:false}).url));
});
