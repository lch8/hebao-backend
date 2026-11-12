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


const {marketProducts, itemPrice} = await import('../delft/market-view.js');
test('search presents the matched item and price, excluding unrelated cheaper items in the same bundle', () => {
  const listings=[{id:'bundle',title:'搬家',pickup:'Delft',updatedAt:'2026-11-11',items:[{id:'bike',name:'自行车',price:80,category:'自行车',status:'available'},{id:'desk',name:'书桌',price:20,category:'家具',status:'available'},{id:'sold-bike',name:'自行车',price:5,status:'sold'}]}];
  const found=marketProducts(listings,{query:'自行车'});
  assert.deepEqual(found.map(x=>[x.item.id,x.price]),[['bike',80]]);
  assert.equal(marketProducts(listings,{query:'自行车',category:'家具'}).length,0);
  assert.equal(marketProducts([{...listings[0],stale:true}]).length,0);
});
test('price sorting treats free items as zero and unknown prices as unknown, without mutating listings',()=>{
  const listings=[{id:'a',updatedAt:'2026-11-11',items:[{id:'unknown',price:'',status:'available'},{id:'paid',price:'10',status:'available'},{id:'free',price:0,status:'available'},{id:'null',price:null,status:'available'}]}];
  const before=JSON.stringify(listings);
  assert.deepEqual(marketProducts(listings,{sort:'price'}).map(x=>x.item.id),['free','paid','unknown','null']);
  assert.equal(itemPrice({price:''}),null);assert.equal(itemPrice({price:0}),0);assert.equal(itemPrice({price:'invalid'}),null);
  assert.equal(JSON.stringify(listings),before);
});
test('recent sorting uses listing confirmation times and preserves keyword matching in pickup and condition',()=>{
  const listings=[{id:'old',updatedAt:'2026-11-01',pickup:'TU 校园',items:[{id:'a',name:'椅子',condition:'九成新',status:'available'}]},{id:'new',updatedAt:'2026-11-11',pickup:'TU 校园',items:[{id:'b',name:'桌子',status:'available'}]}];
  assert.deepEqual(marketProducts(listings,{query:'tu'}).map(x=>x.item.id),['b','a']);
  assert.deepEqual(marketProducts(listings,{query:'九成新'}).map(x=>x.item.id),['a']);
});
