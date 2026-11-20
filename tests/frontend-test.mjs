import test from 'node:test';
import assert from 'node:assert/strict';
import {cityEvents, upcomingCityEvents, amsterdamInput, amsterdamInstant, cityEventDraft, citySelection, discoveryFilters, weekendLabel} from '../delft/city-events.js';
import {activityCard, activityDetailContent} from '../delft/activity-view.js';
import {posterLayout, makeQr} from '../delft/poster.js';
import {PUBLIC_SITE_URL, posterDestination, activityLink} from '../delft/site-config.js';

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

test('city selection separates official and legacy community events',()=>{
 const now=new Date('2026-11-12T00:00:00Z');
 const events=[{id:'a',city:'utrecht',startsAt:'2026-11-14T12:00:00+01:00'},{id:'b',startsAt:'2026-11-14T13:00:00+01:00'}];
 assert.deepEqual(upcomingCityEvents(events,'all',now,'utrecht').map(e=>e.id),['a']);
 assert.deepEqual(upcomingCityEvents(events,'all',now,'delft').map(e=>e.id),['b']);
});

test('discovery restores city, dates and source, including old group invitations', () => {
  const filters = query => discoveryFilters(new URLSearchParams(query));
  const defaults = {city:'delft', period:'weekend', source:'city'};
  assert.deepEqual(filters(''), defaults);
  assert.deepEqual(filters('city=constructor&period=invalid&source=unknown'), defaults);
  const choice = {city:'utrecht', period:'fortnight', source:'community'};
  assert.deepEqual(filters(new URLSearchParams(choice)), choice);
  assert.deepEqual(filters('city=all&period=weekend'), {...defaults, city:'all'});
  assert.deepEqual(filters('event=group&city=delft&period=weekend'), {city:'all', period:'all', source:'community'});
});

test('weekend city counts exclude nearby suggestions, past starts and weekdays', () => {
  const now=new Date('2026-11-20T11:00:00Z');
  const event=(id,city,day)=>({id,city,startsAt:'2026-11-'+day+'T12:00:00+01:00'});
  const events=[event('local-later','delft',27),event('sunday','den-haag',22),event('out-of-area','utrecht',21),event('saturday','rotterdam',21),event('past','delft',15)];
  const picks=citySelection(events,'weekend',now,'delft');
  assert.equal(picks.local.length,0);
  assert.deepEqual(picks.nearby.map(e=>e.id),['saturday','sunday']);
  assert.equal(picks.inPeriod.length,3);
  assert.equal(citySelection(events,'weekend',now,'all').local.length,3);
  assert.equal(citySelection(events,'all',now,'delft').local[0].id,'local-later');
  assert.deepEqual(citySelection(events,'all',now,'delft').nearby,[]);
  assert.deepEqual(citySelection(events,'weekend',now,'eindhoven').nearby,[]);
  assert.equal(weekendLabel(now),'11 月 21 日–22 日');
  assert.equal(weekendLabel(new Date('2026-10-31T23:10:00Z')),'10 月 31 日–11 月 1 日');
});

test('official sharing uses a standalone production URL, independent of discovery and group links', () => {
  const id='event/123?city=all&item=x';
  const link=new URL(activityLink(id));
  assert.equal(link.origin+link.pathname,PUBLIC_SITE_URL);
  assert.deepEqual([...link.searchParams],[['activity',id]]);
});

test('cards use optional official images and detail pages retain the original venue, fee and check date', () => {
  const event={...cityEvents[0],title:'Titel <test>',imageUrl:'',imageAlt:'Programma',fee:'免费',price:'市集免费，演出另售票'};
  const opts={includeCity:true,href:'?activity=test'};
  assert.doesNotMatch(activityCard(event,opts),/<img/);
  assert.doesNotMatch(activityCard({...event,imageUrl:'data:text/plain,invalid'},opts),/<img/);
  assert.match(activityCard({...event,imageUrl:'https://example.org/photo.jpg'},opts),/data-activity-photo/);
  assert.match(activityCard(event,opts),/Titel &lt;test&gt;/);
  assert.match(activityCard({...event,startsAt:'2026-11-21T22:00:00+01:00',endsAt:'2026-11-22T00:30:00+01:00'},opts),/22:00–次日 00:30/);
  const before=activityDetailContent(event,{ready:true,failed:false,now:new Date(Date.parse(event.startsAt)-1)});
  for(const key of ['place','price','checkedOn','sourceUrl'])assert.ok(before.includes(event[key]));
  assert.match(before,/data-city-meetup/);
  const started=activityDetailContent(event,{ready:true,failed:false,now:new Date(event.startsAt)});
  assert.ok(started.includes('已开始'));
  assert.doesNotMatch(started,/data-city-meetup/);
  assert.match(started,/data-share-activity/);
});

test('a missing link, a loading feed and a failed refresh produce distinct detail states', () => {
  const now=new Date('2026-11-20T00:00:00Z');
  const message=(ready,failed)=>activityDetailContent(undefined,{ready,failed,now});
  assert.match(message(false,false),/正在加载/);
  assert.match(message(true,false),/已移出精选或链接有误/);
  assert.doesNotMatch(message(true,true),/已移出/);
  assert.match(message(true,true),/data-retry-feed/);
  const cached=activityDetailContent(cityEvents[0],{ready:true,failed:true,now});
  assert.ok(cached.includes(cityEvents[0].checkedOn));
  assert.match(cached,/data-retry-feed/);
});

test('meetup categories follow the activity and admission comes from the original listing', () => {
  const event={...cityEvents[0],category:'户外',title:'溜冰场开季',originalTitle:'Schaatsbaan Opening',price:'免费，自由入场'};
  assert.equal(cityEventDraft(event).category,'运动');
  assert.equal(cityEventDraft({...event,title:'森林徒步',originalTitle:''}).category,'散步');
  assert.equal(cityEventDraft({...event,title:'露天放映',originalTitle:''}).category,'其他');
  assert.doesNotMatch(cityEventDraft(event).description,/预约/);
});
