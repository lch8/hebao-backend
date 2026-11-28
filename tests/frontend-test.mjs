import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cityEvents, upcomingCityEvents, amsterdamInput, amsterdamInstant, cityEventDraft, citySelection, discoveryFilters, weekendLabel} from '../delft/city-events.js';
import {activityCard, activityDetailContent} from '../delft/activity-view.js';
import {posterLayout, makeQr} from '../delft/poster.js';
import {DEFAULT_SITE_ORIGIN, PUBLIC_SITE_URL, resolveSiteOrigin, posterDestination, activityLink, pageFromQuery, pageFromLocation, legalModalFromLocation} from '../delft/site-config.js';
import {mergeStudy, freshStudy, recordTask, completeLesson} from '../delft/dutch-store.js';
import {mergePrep, openPrepLedger} from '../delft/a2-progress.js';
import {resolveShareMeta, renderShareHtml} from '../api/share-page.js';

test('the homepage and clean channel paths route accurately while preserving /delft/ compatibility', () => {
  const page = query => pageFromQuery(new URLSearchParams(query));
  assert.equal(page(''), 'events');
  assert.equal(page('utm_source=wechat&source=poster'), 'events');
  assert.equal(page('tab=unknown'), 'events');
  for (const tab of ['dutch','events','market','mine','sell']) assert.equal(page('tab='+tab), tab);

  assert.equal(pageFromLocation({pathname:'/', search:''}), 'events');
  assert.equal(pageFromLocation({pathname:'/events', search:''}), 'events');
  assert.equal(pageFromLocation({pathname:'/market', search:''}), 'market');
  assert.equal(pageFromLocation({pathname:'/dutch-a2', search:''}), 'dutch');
  assert.equal(pageFromLocation({pathname:'/mine', search:'?view=messages'}), 'mine');
  assert.equal(pageFromLocation({pathname:'/sell', search:''}), 'sell');
  assert.equal(pageFromLocation({pathname:'/delft/', search:'?tab=market'}), 'market');
  assert.equal(legalModalFromLocation({pathname:'/privacy', search:''}), 'privacy');
  assert.equal(legalModalFromLocation({pathname:'/terms', search:''}), 'terms');
});

test('the first paint and the primary navigation match the homepage route', () => {
  const html = readFileSync(new URL('../delft/index.html',import.meta.url),'utf8');
  const nav = html.match(/<nav class="tabs"[^>]*>([\s\S]*?)<\/nav>/)[1];
  assert.deepEqual([...nav.matchAll(/data-tab="([^"]+)"/g)].map(match=>match[1]), ['events','dutch','market','mine']);
  const home = pageFromQuery(new URLSearchParams());
  assert.match(nav,new RegExp('class="tab active" data-tab="'+home+'"[^>]*aria-pressed="true"'));
  assert.deepEqual([...html.matchAll(/<section id="panel-([^"]+)" class="panel active"/g)].map(match=>match[1]),[home]);
});

test('market, official activities, group invitations and event filters can still deep-link past the homepage', () => {
  const page = query => pageFromQuery(new URLSearchParams(query));
  assert.equal(page('item=listing-id&product=bike'), 'market');
  assert.equal(page('tab=dutch&item=listing-id&activity=city-id'), 'market');
  assert.equal(page('activity=city-id'), 'events');
  assert.equal(page('event=group-id'), 'events');
  assert.equal(page('city=rotterdam&period=fortnight'), 'events');
  assert.equal(page('source=community'), 'events');
  assert.equal(page('tab=dutch&city=delft'), 'dutch');
});

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

test('QR promotion never prints .vercel.app, adapts to custom domains, and only promises saved published inventory', () => {
  assert.equal(resolveSiteOrigin({protocol:'https:', hostname:'hebao-backend.vercel.app', origin:'https://hebao-backend.vercel.app'}), DEFAULT_SITE_ORIGIN);
  assert.equal(resolveSiteOrigin({protocol:'http:', hostname:'localhost', origin:'http://localhost:3000'}), DEFAULT_SITE_ORIGIN);
  assert.equal(resolveSiteOrigin({protocol:'https:', hostname:'hebaogj.xyz', origin:'https://hebaogj.xyz'}), 'https://hebaogj.xyz');
  assert.equal(resolveSiteOrigin({protocol:'https:', hostname:'nl.hebaogj.xyz', origin:'https://nl.hebaogj.xyz'}), 'https://nl.hebaogj.xyz');

  const draft=posterDestination();assert.equal(draft.url,PUBLIC_SITE_URL);assert.equal(draft.published,false);
  const saved=posterDestination({publishedId:'test/listing?a=1',dirty:false});
  assert.equal(new URL(saved.url).searchParams.get('item'),'test/listing?a=1');assert.equal(saved.published,true);
  assert.equal(new URL(saved.url).pathname,'/market');
  const unsaved=posterDestination({publishedId:'test',dirty:true});
  assert.equal(unsaved.url,PUBLIC_SITE_URL);assert.equal(unsaved.published,false);
  assert.equal(new URL(saved.url).hostname,'hebaogj.xyz');
  assert.doesNotThrow(()=>makeQr(posterDestination({publishedId:'12345678-1234-1234-1234-123456789012',dirty:false}).url));
});

const {marketProducts, itemPrice} = await import('../delft/market-view.js');
test('search presents the matched item and price, excluding unrelated cheaper items in the same bundle', () => {
  const listings=[{id:'bundle',city:'delft',title:'搬家',pickup:'Delft',updatedAt:'2026-11-11',items:[{id:'bike',name:'自行车',price:80,category:'自行车',status:'available'},{id:'desk',name:'书桌',price:20,category:'家具',status:'available'},{id:'sold-bike',name:'自行车',price:5,status:'sold'}]}];
  const found=marketProducts(listings,{query:'自行车'});
  assert.deepEqual(found.map(x=>[x.item.id,x.price]),[['bike',80]]);
  assert.equal(marketProducts(listings,{query:'自行车',category:'家具'}).length,0);
  assert.equal(marketProducts(listings,{city:'zuid-holland'}).length,2);
  assert.equal(marketProducts(listings,{city:'amsterdam'}).length,0);
  assert.equal(marketProducts([{...listings[0],stale:true}]).length,0);
});

test('price sorting treats free items as zero and strictly places unpriced negotiable items at the end',()=>{
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

test('city selection separates official and legacy community events and supports South Holland scope',()=>{
  const now=new Date('2026-11-12T00:00:00Z');
  const events=[{id:'a',city:'utrecht',startsAt:'2026-11-14T12:00:00+01:00'},{id:'b',startsAt:'2026-11-14T13:00:00+01:00'},{id:'c',city:'rotterdam',startsAt:'2026-11-14T14:00:00+01:00'}];
  assert.deepEqual(upcomingCityEvents(events,'all',now,'utrecht').map(e=>e.id),['a']);
  assert.deepEqual(upcomingCityEvents(events,'all',now,'delft').map(e=>e.id),['b']);
  assert.deepEqual(upcomingCityEvents(events,'all',now,'zuid-holland').map(e=>e.id),['b','c']);
});

test('discovery defaults community invitations to South Holland fortnight and curated city picks to Delft weekend', () => {
  const filters = query => discoveryFilters(new URLSearchParams(query));
  const communityDefaults = {city:'zuid-holland', period:'fortnight', source:'community'};
  const cityDefaults = {city:'delft', period:'weekend', source:'city'};
  assert.deepEqual(filters(''), communityDefaults);
  assert.deepEqual(filters('utm_source=wechat&source=poster'), communityDefaults);
  assert.deepEqual(filters('tab=events'), communityDefaults);
  assert.deepEqual(filters('tab=events&source=city'), cityDefaults);
  assert.deepEqual(filters('activity=old-official-id'), cityDefaults);
  assert.deepEqual(filters('city=constructor&period=invalid&source=unknown'), cityDefaults);
  const choice = {city:'utrecht', period:'fortnight', source:'community'};
  assert.deepEqual(filters(new URLSearchParams(choice)), choice);
  assert.deepEqual(filters('city=all&period=weekend'), {...cityDefaults, city:'all'});
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

test('official sharing uses a clean production /events URL, independent of discovery and group links', () => {
  const id='event/123?city=all&item=x';
  const link=new URL(activityLink(id));
  assert.equal(link.origin+link.pathname,`${DEFAULT_SITE_ORIGIN}/events`);
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

test('dynamic Open Graph metadata injects accurate listing, meetup, activity and route cards without XSS', async () => {
  const template = readFileSync(new URL('../delft/index.html',import.meta.url),'utf8');
  const listingMeta = await resolveShareMeta({
    pathname: '/market',
    searchParams: new URLSearchParams('item=list-1&product=p2'),
    origin: 'https://hebaogj.xyz',
    getListing: async () => ({
      id: 'list-1', city: 'rotterdam', seller: '小林', title: '毕业整屋清仓 <script>', pickup: 'Blaak',
      items: [
        { id: 'p1', name: '台灯', price: 10, status: 'sold', photo: 'https://bucket.cos.eu-frankfurt.myqcloud.com/1.jpg' },
        { id: 'p2', name: '人体工学椅', price: 65, status: 'available', photo: 'https://bucket.cos.eu-frankfurt.myqcloud.com/2.jpg' },
      ],
    }),
  });
  assert.match(listingMeta.title, /人体工学椅（€65）· Rotterdam 闲置/);
  assert.equal(listingMeta.image, 'https://bucket.cos.eu-frankfurt.myqcloud.com/2.jpg');
  const rendered = renderShareHtml(template, listingMeta);
  assert.match(rendered, /<meta property="og:image" content="https:\/\/bucket\.cos\.eu-frankfurt\.myqcloud\.com\/2\.jpg" \/>/);
  assert.doesNotMatch(rendered, /<script>.*毕业/);

  const eventMeta = await resolveShareMeta({
    pathname: '/events',
    searchParams: new URLSearchParams('event=ev-9'),
    origin: 'https://hebaogj.xyz',
    getEvent: async () => ({
      id: 'ev-9', city: 'delft', host: '阿泽', title: '周六桌游局',
      startsAt: '2026-11-28T14:00:00+01:00', place: 'TU 图书馆', capacity: 5, count: 3, cancelled: false,
    }),
  });
  assert.match(eventMeta.title, /周六桌游局 · Delft 同城约伴/);
  assert.match(eventMeta.description, /3\/5 人/);
});

test('A2 cloud sync merges local pre-login answers and mock papers without losing progress', () => {
  let local = freshStudy();
  for (const id of ['coffee-1','coffee-2']) local = recordTask(local, id, {correct:true}, new Date('2026-11-20T12:00:00Z'));
  local = recordTask(local, 'coffee-3', {correct:true, selfRated:true}, new Date('2026-11-20T12:00:00Z'));
  local = completeLesson(local, 'coffee');

  let remote = freshStudy();
  remote = recordTask(remote, 'doctor-1', {correct:false}, new Date('2026-11-19T12:00:00Z'));
  const merged = mergeStudy(local, remote);
  assert.deepEqual(merged.completed, ['coffee']);
  assert.equal(merged.answers['doctor-1'].needsReview, true);

  const s1 = new Map(), s2 = new Map();
  const l1 = openPrepLedger({getItem:k=>s1.get(k), setItem:(k,v)=>s1.set(k,v)});
  const l2 = openPrepLedger({getItem:k=>s2.get(k), setItem:(k,v)=>s2.set(k,v)});
  l1.start('read','a','tok-a'); l1.finish('read','a','tok-a',{attempted:6,correct:5});
  l1.recordDrill('read','notice',{attempted:2,correct:1});
  l2.start('listen','b','tok-b'); l2.finish('listen','b','tok-b',{attempted:6,correct:4});
  l2.recordDrill('read','notice',{attempted:2,correct:2});
  const mp = mergePrep(l1.read(), l2.read());
  assert.equal(mp.forms['read/a'].first.correct, 5);
  assert.equal(mp.forms['listen/b'].first.correct, 4);
  assert.equal(mp.drills['read/notice'].best, 2);
});

test('calendar .ics export, product share links, and SEO/PWA assets are valid and clutter-free', async () => {
  const {buildCalendarIcs} = await import('../delft/ics.js');
  const {listingShareLink} = await import('../delft/site-config.js');

  const ics = buildCalendarIcs({
    uid: 'ev-123',
    title: '周六桌游, 阿瓦隆; 狼人杀',
    startsAt: '2026-11-28T14:00:00+01:00',
    location: 'Delft, TU Library',
    description: '带伞\n迟到群里说',
    url: 'https://hebaogj.xyz/events?event=ev-123',
    now: new Date('2026-11-28T10:00:00Z'),
  });
  assert.match(ics, /BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART:20261128T130000Z\r\n/);
  assert.match(ics, /DTEND:20261128T150000Z\r\n/);
  assert.match(ics, /SUMMARY:周六桌游\\, 阿瓦隆\\; 狼人杀\r\n/);
  assert.match(ics, /DESCRIPTION:带伞\\n迟到群里说\r\n/);

  assert.equal(listingShareLink('list-9'), 'https://hebaogj.xyz/market?item=list-9');
  assert.equal(listingShareLink('list-9', undefined, 'chair-2'), 'https://hebaogj.xyz/market?item=list-9&product=chair-2');

  const html = readFileSync(new URL('../delft/index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /class="poster-tool-card"/);
  assert.doesNotMatch(html, /id="refresh(Market|Events|Mine|ListingDetail)"/);
  assert.match(html, /rel="manifest" href="\/delft\/manifest\.webmanifest"/);
  assert.match(html, /id="photoLightboxModal"/);
  assert.match(html, /id="actionDialogModal"/);

  const manifest = JSON.parse(readFileSync(new URL('../delft/manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(manifest.short_name, '荷包');
  const robots = readFileSync(new URL('../robots.txt', import.meta.url), 'utf8');
  assert.match(robots, /Sitemap: https:\/\/hebaogj\.xyz\/sitemap\.xml/);
  const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
  assert.match(sitemap, /https:\/\/hebaogj\.xyz\/dutch-a2/);
});

test('marketProducts filters free items, price ceilings, and buyer favorites without leaking unpriced items', async () => {
  const {marketProducts, favoriteKey} = await import('../delft/market-view.js');
  const listings = [{
    id: 'list-a', city: 'delft', title: '搬家清仓', pickup: 'TU Delft', updatedAt: '2026-11-28T10:00:00Z', stale: false,
    items: [
      {id: 'free-1', name: '衣架', price: 0, category: '生活用品', status: 'available'},
      {id: 'mid-1', name: '台灯', price: 15, category: '生活用品', status: 'available'},
      {id: 'high-1', name: '显示器', price: 85, category: '数码', status: 'available'},
      {id: 'neg-1', name: '沙发', price: null, category: '家具', status: 'available'},
      {id: 'sold-1', name: '已出单车', price: 10, category: '自行车', status: 'sold'},
    ],
  }];

  assert.deepEqual(marketProducts(listings, {freeOnly: true}).map(p => p.item.id), ['free-1']);
  assert.deepEqual(marketProducts(listings, {maxPrice: 20}).map(p => p.item.id), ['free-1', 'mid-1']);
  assert.deepEqual(marketProducts(listings, {maxPrice: 50}).map(p => p.item.id), ['free-1', 'mid-1']);
  const favs = new Set([favoriteKey('list-a', 'high-1'), favoriteKey('list-a', 'sold-1')]);
  assert.deepEqual(marketProducts(listings, {favoritesOnly: true, favoriteKeys: favs}).map(p => p.item.id), ['high-1']);

  const html = readFileSync(new URL('../delft/index.html', import.meta.url), 'utf8');
  assert.match(html, /id="marketQuickFilters"/);
  assert.match(html, /id="extraPhotoInput"/);
  assert.match(html, /id="posterAvailableOnly"/);
  assert.match(html, /id="lightboxPrev"/);
  assert.match(html, /id="lightboxNext"/);
  assert.match(html, /id="mineAdminTab"/);
  assert.match(html, /id="myAdmin"/);
  assert.match(html, /id="eventsNewsShortcut"/);
  assert.match(html, /og-cover\.jpg\?v=20261128e/);
  assert.match(html, /application\/ld\+json/);

  assert.equal(pageFromLocation({ pathname: '/news', search: '' }), 'dutch');
  assert.equal(pageFromLocation({ pathname: '/dutch/', search: '' }), 'dutch');

  const newsMeta = await resolveShareMeta({
    pathname: '/dutch-a2',
    searchParams: new URLSearchParams('view=news'),
    origin: 'https://hebaogj.xyz',
  });
  assert.match(newsMeta.title, /每日荷语新闻简报/);
  assert.equal(newsMeta.url, 'https://hebaogj.xyz/dutch-a2?view=news');
  assert.match(newsMeta.image, /og-cover\.jpg\?v=20261128e/);

  const shortNewsMeta = await resolveShareMeta({
    pathname: '/news',
    searchParams: new URLSearchParams(''),
    origin: 'https://hebaogj.xyz',
  });
  assert.match(shortNewsMeta.title, /每日荷语新闻简报/);
  assert.equal(shortNewsMeta.url, 'https://hebaogj.xyz/news');

  const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
  assert.match(sitemap, /https:\/\/hebaogj\.xyz\/news/);

  const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.ok(vercel.crons?.some(c => c.path === '/api/daily-news-cron'));
  assert.ok(vercel.rewrites?.some(r => r.source === '/news'));
  assert.ok(vercel.headers?.some(h => h.headers?.some(x => x.key === 'Strict-Transport-Security')));
});
