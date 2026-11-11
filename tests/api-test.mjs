import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {test,after} from 'node:test';
import handler from '../api/delft.js';
import {mockTurso} from './helpers/mock-turso.mjs';

process.env.TURSO_DATABASE_URL='libsql://mock';
process.env.TURSO_AUTH_TOKEN='test-token';
process.env.JWT_SECRET='test-only-secret';
const mock=mockTurso();
after(()=>mock.restore());
const jwt=(user,exp=Math.floor(Date.now()/1000)+3600)=>{
  const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
  const payload=Buffer.from(JSON.stringify({userId:user,exp})).toString('base64url');
  const input=`${header}.${payload}`;
  return `${input}.${createHmac('sha256',process.env.JWT_SECRET).update(input).digest('base64url')}`;
};
async function ask(action,method='GET',body,user,params={}){
  const request=new Request(`https://example.test/api/delft?${new URLSearchParams({action,...params})}`,{
    method,headers:{'Content-Type':'application/json',...(user?{Authorization:`Bearer ${jwt(user)}`}:{})},
    ...(body!==undefined?{body:JSON.stringify(body)}:{})
  });
  const response=await handler(request);
  return {status:response.status,data:await response.json()};
}
const draft=(overrides={})=>({seller:'小李',title:'毕业清仓',pickup:'TU Delft',note:'自取',items:[{id:'desk-12345',name:'书桌',price:20,category:'家具',status:'available',photo:'https://evil.example/image.jpg'}],...overrides});
let listingId,eventId;

test('guests can browse; writing and private reads require valid JWT',async()=>{
  assert.deepEqual((await ask('listings')).data.listings,[]);
  assert.deepEqual((await ask('events')).data.events,[]);
  for(const action of ['createListing','updateListing','refreshListing','sendMessage','rsvp'])assert.equal((await ask(action,'POST',{},undefined)).status,401);
  for(const action of ['mine','messages','attendees'])assert.equal((await ask(action)).status,401);
  for(const token of ['invalid',jwt('alice',1),jwt({id:'alice'})]){
    const response=await handler(new Request('https://example.test/api/delft?action=mine',{headers:{Authorization:`Bearer ${token}`}}));
    assert.equal(response.status,401);
  }
});

test('invalid JSON and malformed listing inputs return 400',async()=>{
  const response=await handler(new Request('https://example.test/api/delft?action=createListing',{method:'POST',headers:{Authorization:`Bearer ${jwt('alice')}`},body:'{broken'}));
  assert.equal(response.status,400);
  for(const body of [null,[],draft({items:[]}),draft({items:[null]}),draft({items:[{name:'桌子',price:-1}]}),draft({items:[{name:'桌子',price:true}]}),draft({items:[{name:'桌子',category:'未知'}]}),draft({items:[{id:'same-id',name:'a'},{id:'same-id',name:'b'}]})])assert.equal((await ask('createListing','POST',body,'alice')).status,400);
});

test('create returns a stable share ID and removes unsafe photo URLs',async()=>{
  const created=await ask('createListing','POST',draft(),'alice');
  assert.equal(created.status,200);listingId=created.data.id;assert.ok(listingId);assert.ok(created.data.updatedAt);
  const listing=(await ask('listing','GET',undefined,undefined,{id:listingId})).data.listing;
  assert.equal(listing.items[0].photo,'');assert.equal(listing.items[0].category,'家具');
  assert.equal('owner_id' in listing,false);assert.equal('email' in listing,false);
});

test('edits preserve the share ID and require the owner plus the latest version',async()=>{
  const previous=(await ask('listing','GET',undefined,'alice',{id:listingId})).data.listing;
  const body={...draft({title:'书桌降价',items:[{id:'desk-12345',name:'书桌',price:15,category:'家具',status:'reserved'}]}),listingId,expectedUpdatedAt:previous.updatedAt};
  assert.equal((await ask('updateListing','POST',body,'bob')).status,403);
  const result=await ask('updateListing','POST',body,'alice');assert.equal(result.status,200);assert.equal(result.data.id,listingId);
  assert.notEqual(result.data.updatedAt,previous.updatedAt);
  assert.equal((await ask('updateListing','POST',body,'alice')).status,409);
  assert.equal((await ask('updateListing','POST',{...body,expectedUpdatedAt:undefined},'alice')).status,409);
  const listing=(await ask('listing','GET',undefined,undefined,{id:listingId})).data.listing;
  assert.equal(listing.title,'书桌降价');assert.equal(listing.items[0].status,'reserved');assert.equal(listing.items[0].price,15);
});

test('all sold/reserved listings leave discovery but remain visible at share links',async()=>{
  assert.equal((await ask('listings')).data.listings.length,0);
  assert.equal((await ask('updateStatus','POST',{listingId,itemId:'desk-12345',status:'sold'},'bob')).status,403);
  assert.equal((await ask('updateStatus','POST',{listingId,itemId:'desk-12345',status:'unknown'},'alice')).status,400);
  assert.equal((await ask('updateStatus','POST',{listingId,itemId:'desk-12345',status:'sold'},'alice')).status,200);
  assert.equal((await ask('listing','GET',undefined,undefined,{id:listingId})).data.listing.items[0].status,'sold');
  assert.equal((await ask('listings')).data.listings.length,0);
});

test('category and search match the same available item, including legacy items',async()=>{
  await ask('createListing','POST',draft({title:'搬家杂物',items:[{id:'chair-123',name:'椅子',category:'家具',price:0,status:'available'},{id:'bike-1234',name:'自行车',category:'自行车',status:'sold'},{id:'book-1234',name:'算法书',price:'',status:'available'}]}),'bob');
  assert.equal((await ask('listings','GET',undefined,undefined,{q:'自行车'})).data.listings.length,0);
  assert.equal((await ask('listings','GET',undefined,undefined,{q:'椅子',category:'家具'})).data.listings.length,1);
  assert.equal((await ask('listings','GET',undefined,undefined,{q:'算法书',category:'家具'})).data.listings.length,0);
  assert.equal((await ask('listings','GET',undefined,undefined,{q:'算法书',category:'其他'})).data.listings.length,1);
  assert.equal((await ask('listings','GET',undefined,undefined,{category:'invalid'})).status,400);
  assert.equal((await ask('listings','GET',undefined,undefined,{q:"' OR 1=1 --"})).data.listings.length,0);
  mock.db.prepare('UPDATE delft_listings SET items_json=? WHERE owner_id=?').run(JSON.stringify([{id:'old-12345',name:'旧台灯',status:'available',price:null}]),'bob');
  const legacy=(await ask('listings','GET',undefined,undefined,{category:'其他'})).data.listings;
  assert.equal(legacy.length,1);assert.equal(legacy[0].items[0].category,'其他');
});

test('14-day expiry applies on the server and owner can reconfirm inventory',async()=>{
  const oldDate=new Date(Date.now()-15*86400000).toISOString();
  mock.db.prepare('UPDATE delft_listings SET updated_at=? WHERE owner_id=?').run(oldDate,'bob');
  assert.equal((await ask('listings')).data.listings.length,0);
  const mine=(await ask('mine','GET',undefined,'bob')).data.listings[0];assert.equal(mine.stale,true);
  assert.equal((await ask('refreshListing','POST',{listingId:mine.id},'alice')).status,403);
  assert.equal((await ask('refreshListing','POST',{listingId:mine.id},'bob')).status,200);
  assert.equal((await ask('listings')).data.listings.length,1);
});

test('concurrent status changes cannot silently overwrite another item update',async()=>{
  let injected=false;
  mock.intercept((sql)=>{
    if(!injected&&sql.startsWith('UPDATE delft_listings SET items_json=')){
      injected=true;mock.db.prepare('UPDATE delft_listings SET items_json=? WHERE id=?').run(JSON.stringify([{id:'desk-12345',name:'别人更新的书桌',status:'sold'}]),listingId);
    }
  });
  const result=await ask('updateStatus','POST',{listingId,itemId:'desk-12345',status:'available'},'alice');mock.intercept(null);
  assert.equal(result.status,409);
  assert.equal((await ask('listing','GET',undefined,undefined,{id:listingId})).data.listing.items[0].name,'别人更新的书桌');
});

test('private messages isolate buyers and reject forged recipients',async()=>{
  assert.equal((await ask('sendMessage','POST',{listingId,content:'hello'},'alice')).status,403);
  assert.equal((await ask('sendMessage','POST',{listingId,receiverId:'mallory',content:'hello'},'bob')).status,403);
  assert.equal((await ask('sendMessage','POST',{listingId,content:'hello'},'bob')).status,200);
  assert.equal((await ask('messages','GET',undefined,'mallory')).data.messages.length,0);
  assert.equal((await ask('messages','GET',undefined,'alice')).data.messages.length,1);
  assert.equal((await ask('sendMessage','POST',{listingId,receiverId:'mallory',content:'伪造回复'},'alice')).status,403);
  assert.equal((await ask('sendMessage','POST',{listingId,receiverId:'bob',content:'好的'},'alice')).status,200);
});

test('event RSVP enforces capacity atomically and cancellation frees the seat',async()=>{
  const event=await ask('createEvent','POST',{title:'周末桌游',host:'小李',startsAt:new Date(Date.now()+86400000).toISOString(),category:'桌游',place:'Delft station',capacity:2,description:''},'alice');
  assert.equal(event.status,200);eventId=event.data.id;
  assert.equal((await ask('rsvp','POST',{eventId,nickname:'小张'},'bob')).status,200);
  assert.equal((await ask('rsvp','POST',{eventId,nickname:'小王'},'charlie')).status,409);
  assert.equal((await ask('rsvp','POST',{eventId,nickname:'小李'},'alice')).status,409);
  assert.equal((await ask('events','GET',undefined,'bob')).data.events[0].joined,true);
  assert.equal((await ask('attendees','GET',undefined,'bob',{id:eventId})).status,403);
  assert.equal((await ask('attendees','GET',undefined,'alice',{id:eventId})).data.attendees[0].nickname,'小张');
  assert.equal((await ask('cancelRsvp','POST',{eventId},'bob')).status,200);
  assert.equal((await ask('rsvp','POST',{eventId,nickname:'小王'},'charlie')).status,200);
  await ask('cancelEvent','POST',{eventId},'bob');assert.equal((await ask('events')).data.events.length,1);
  await ask('cancelEvent','POST',{eventId},'alice');assert.equal((await ask('events')).data.events.length,0);
});

test('only the seller can delete a listing and its associated messages',async()=>{
  assert.equal((await ask('deleteListing','POST',{listingId},'bob')).status,403);
  assert.equal((await ask('deleteListing','POST',{listingId},'alice')).status,200);
  assert.equal((await ask('listing','GET',undefined,undefined,{id:listingId})).status,404);
  assert.equal((await ask('messages','GET',undefined,'bob')).data.messages.length,0);
});
