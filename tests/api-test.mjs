import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {test,after} from 'node:test';
import handler from '../api/delft.js';
import aiHandler from '../api/delft-ai.js';
import sendAuthHandler from '../api/send-auth-email.js';
import verifyAuthHandler from '../api/verify-auth-code.js';
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
  for(const action of ['mine','messages','attendees','exportMyData'])assert.equal((await ask(action)).status,401);
  for(const token of ['invalid',jwt('alice',1),jwt({id:'alice'})]){
    const response=await handler(new Request('https://example.test/api/delft?action=mine',{headers:{Authorization:`Bearer ${token}`}}));
    assert.equal(response.status,401);
  }
});

test('invalid JSON and malformed listing inputs return 400',async()=>{
  const response=await handler(new Request('https://example.test/api/delft?action=createListing',{method:'POST',headers:{Authorization:`Bearer ${jwt('alice')}`},body:'{broken'}));
  assert.equal(response.status,400);
  for(const body of [null,[],draft({items:[]}),draft({items:[null]}),draft({items:[{name:'桌子',price:-1}]}),draft({items:[{name:'桌子',price:true}]}),draft({items:[{name:'桌子',category:'未知'}]}),draft({city:'mars'}),draft({items:[{id:'same-id',name:'a'},{id:'same-id',name:'b'}]})])assert.equal((await ask('createListing','POST',body,'alice')).status,400);
});

test('create returns a stable share ID, stores city, and removes unsafe photo URLs',async()=>{
  const created=await ask('createListing','POST',draft({city:'rotterdam'}),'alice');
  assert.equal(created.status,200);listingId=created.data.id;assert.ok(listingId);assert.ok(created.data.updatedAt);
  const listing=(await ask('listing','GET',undefined,undefined,{id:listingId})).data.listing;
  assert.equal(listing.items[0].photo,'');assert.equal(listing.items[0].category,'家具');
  assert.equal(listing.city,'rotterdam');
  assert.equal((await ask('listings','GET',undefined,undefined,{city:'zuid-holland'})).data.listings.length,1);
  assert.equal((await ask('listings','GET',undefined,undefined,{city:'amsterdam'})).data.listings.length,0);
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

test('private messages isolate buyers, track unread counts, and send throttled Resend email alerts',async()=>{
  mock.db.prepare('INSERT OR REPLACE INTO users(id,verified_email,email_verified) VALUES(?,?,1)').run('alice','alice@tudelft.nl');
  mock.db.prepare('INSERT OR REPLACE INTO users(id,verified_email,email_verified) VALUES(?,?,1)').run('bob','bob@gmail.com');
  const sentEmails=[];
  process.env.RESEND_API_KEY='re_test_key';
  mock.mockExternal(async(url,init)=>{
    if(url==='https://api.resend.com/emails'){
      sentEmails.push(JSON.parse(init.body));
      return Response.json({id:'email-1'});
    }
    throw new Error('Unexpected URL '+url);
  });

  assert.equal((await ask('sendMessage','POST',{listingId,content:'hello'},'alice')).status,403);
  assert.equal((await ask('sendMessage','POST',{listingId,receiverId:'mallory',content:'hello'},'bob')).status,403);
  assert.equal((await ask('sendMessage','POST',{listingId,content:'还在吗？'},'bob')).status,200);
  assert.equal(sentEmails.length,1);
  assert.equal(sentEmails[0].to,'alice@tudelft.nl');
  assert.ok(sentEmails[0].text.includes('还在吗？') && sentEmails[0].html.includes('hebaogj.xyz'));

  // Rapid second message in same thread within 5 min cooldown does not spam another email
  assert.equal((await ask('sendMessage','POST',{listingId,content:'今晚能自取'},'bob')).status,200);
  assert.equal(sentEmails.length,1);

  assert.equal((await ask('unread','GET',undefined,'alice')).data.unreadCount,2);
  assert.equal((await ask('messages','GET',undefined,'mallory')).data.messages.length,0);
  const aliceInbox=(await ask('messages','GET',undefined,'alice')).data.messages;
  assert.equal(aliceInbox.length,2);
  assert.equal(aliceInbox[0].otherLabel,'买家 bo***@gmail.com');
  assert.equal((await ask('markRead','POST',{listingId,otherId:'bob'},'alice')).data.unreadCount,0);

  assert.equal((await ask('sendMessage','POST',{listingId,receiverId:'mallory',content:'伪造回复'},'alice')).status,403);
  assert.equal((await ask('sendMessage','POST',{listingId,receiverId:'bob',content:'好的，今晚七点见'},'alice')).status,200);
  const bobInbox=(await ask('messages','GET',undefined,'bob')).data.messages;
  assert.equal(bobInbox[0].otherLabel,'卖家 小李');
  assert.equal(sentEmails.length,2);
  assert.equal(sentEmails[1].to,'bob@gmail.com');

  delete process.env.RESEND_API_KEY;
  mock.mockExternal(null);
});

test('event RSVP, private contactHint unlock, coordination messages, schedule updates, and cancellation notifications work end-to-end',async()=>{
  const sentEmails=[];
  process.env.RESEND_API_KEY='re_test_key';
  mock.mockExternal(async(url,init)=>{
    if(url==='https://api.resend.com/emails'){sentEmails.push(JSON.parse(init.body));return Response.json({id:'ev-mail'});}
    throw new Error('Unexpected URL '+url);
  });

  const event=await ask('createEvent','POST',{
    title:'周末桌游',host:'小李',startsAt:new Date(Date.now()+86400000).toISOString(),
    category:'桌游',place:'Delft station',capacity:2,description:'',contactHint:'微信号 xiaoli_nl'
  },'alice');
  assert.equal(event.status,200);eventId=event.data.id;

  // Non-participants cannot see contactHint or eventMessages
  const publicView=(await ask('events','GET',undefined,'charlie')).data.events[0];
  assert.equal('contactHint' in publicView,false);
  assert.equal(publicView.hasContactHint,true);
  assert.equal((await ask('eventMessages','GET',undefined,'charlie',{eventId})).status,403);

  // RSVP unlocks contactHint and notifies host
  const rsvpRes=await ask('rsvp','POST',{eventId,nickname:'小张'},'bob');
  assert.equal(rsvpRes.status,200);
  assert.equal(rsvpRes.data.contactHint,'微信号 xiaoli_nl');
  assert.equal(sentEmails.at(-1).to,'alice@tudelft.nl');

  // Capacity enforced atomically
  assert.equal((await ask('rsvp','POST',{eventId,nickname:'小王'},'charlie')).status,409);
  assert.equal((await ask('rsvp','POST',{eventId,nickname:'小李'},'alice')).status,409);

  // Participant & host can exchange coordination messages; host gets inline attendees
  assert.equal((await ask('sendEventMessage','POST',{eventId,content:'我会带阿瓦隆桌游'},'bob')).status,200);
  const coord=(await ask('eventMessages','GET',undefined,'alice',{eventId})).data;
  assert.equal(coord.messages.length,1);
  assert.equal(coord.messages[0].content,'我会带阿瓦隆桌游');
  assert.deepEqual(coord.attendees.map(a=>a.nickname),['小张']);
  const guestCoord=(await ask('eventMessages','GET',undefined,'bob',{eventId})).data;
  assert.equal('attendees' in guestCoord,false);

  // Cancelling RSVP notifies host and reopens capacity, then re-RSVP succeeds
  const beforeCancelRsvp=sentEmails.length;
  assert.equal((await ask('cancelRsvp','POST',{eventId},'bob')).status,200);
  assert.equal(sentEmails.length,beforeCancelRsvp+1);
  assert.equal(sentEmails.at(-1).to,'alice@tudelft.nl');
  assert.ok(sentEmails.at(-1).subject.includes('取消了'));
  assert.equal((await ask('rsvp','POST',{eventId,nickname:'小张'},'bob')).status,200);

  // Host updates venue -> notifies RSVPed attendee bob@gmail.com
  const countBeforeUpdate=sentEmails.length;
  assert.equal((await ask('updateEvent','POST',{eventId,place:'Delft 图书馆咖啡厅室内桌'},'alice')).status,200);
  assert.equal(sentEmails.length,countBeforeUpdate+1);
  assert.equal(sentEmails.at(-1).to,'bob@gmail.com');
  assert.ok(sentEmails.at(-1).subject.includes('活动变更'));

  // Host cancels event with reason -> notifies attendee & keeps cancelled record in mine.myEvents
  const countBeforeCancel=sentEmails.length;
  assert.equal((await ask('cancelEvent','POST',{eventId,reason:'暴雨改下周'},'alice')).status,200);
  assert.equal(sentEmails.length,countBeforeCancel+1);
  assert.equal(sentEmails.at(-1).to,'bob@gmail.com');
  assert.ok(sentEmails.at(-1).text.includes('暴雨改下周'));
  assert.equal((await ask('events')).data.events.length,0);
  const bobMine=(await ask('mine','GET',undefined,'bob')).data;
  assert.equal(bobMine.myEvents[0].cancelled,true);
  assert.equal(bobMine.myEvents[0].cancelReason,'暴雨改下周');

  delete process.env.RESEND_API_KEY;
  mock.mockExternal(null);
});

test('AI endpoint requires JWT auth and enforces daily budget circuit breaker',async()=>{
  process.env.GEMINI_API_KEY='test-gemini-key';
  process.env.GEMINI_DAILY_LIMIT='10';
  const unauth=await aiHandler(new Request('https://example.test/api/delft-ai',{method:'POST',body:JSON.stringify({photos:['/9j/4AAQSkZJRg==']})}));
  assert.equal(unauth.status,401);

  mock.mockExternal(async(url)=>{
    if(url.startsWith('https://generativelanguage.googleapis.com/')){
      return Response.json({candidates:[{content:{parts:[{text:JSON.stringify({items:[{index:0,name:'台灯',condition:'白色'}]})}]}}]});
    }
    throw new Error('Unexpected URL '+url);
  });

  const okRes=await aiHandler(new Request('https://example.test/api/delft-ai',{
    method:'POST',
    headers:{'Content-Type':'application/json',Authorization:`Bearer ${jwt('alice')}`},
    body:JSON.stringify({photos:['/9j/4AAQSkZJRg==']})
  }));
  assert.equal(okRes.status,200);
  assert.equal((await okRes.json()).items[0].name,'台灯');

  // Trip the global daily budget cap
  const today=new Date().toISOString().slice(0,10);
  mock.db.prepare('UPDATE delft_ai_quota SET hits=10 WHERE id=?').run(`${today}:global`);
  const capped=await aiHandler(new Request('https://example.test/api/delft-ai',{
    method:'POST',
    headers:{'Content-Type':'application/json',Authorization:`Bearer ${jwt('bob')}`},
    body:JSON.stringify({photos:['/9j/4AAQSkZJRg==']})
  }));
  assert.equal(capped.status,429);

  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_DAILY_LIMIT;
  mock.mockExternal(null);
});

test('OTP email normalizes case, enforces 55s cooldown, locks out 5 wrong attempts, and issues 30-day server-UUID JWT',async()=>{
  process.env.RESEND_API_KEY='re_test_key';
  let lastMail=null;
  mock.mockExternal(async(url,init)=>{
    if(url==='https://api.resend.com/emails'){lastMail=JSON.parse(init.body);return Response.json({id:'otp-1'});}
    throw new Error('Unexpected URL '+url);
  });

  const first=await sendAuthHandler(new Request('https://example.test/api/send-auth-email',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'  Student@TUDelft.NL '})
  }));
  assert.equal(first.status,200);
  assert.equal(lastMail.to,'student@tudelft.nl');
  assert.ok(lastMail.text && lastMail.html);

  // Immediate duplicate send hits 55s cooldown
  const cooldown=await sendAuthHandler(new Request('https://example.test/api/send-auth-email',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'student@tudelft.nl'})
  }));
  assert.equal(cooldown.status,429);

  // 5 wrong guesses destroy the OTP
  for(let i=0;i<4;i++){
    const bad=await verifyAuthHandler(new Request('https://example.test/api/verify-auth-code',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'student@tudelft.nl',code:'000000',userId:'admin'})
    }));
    assert.equal(bad.status,400);
  }
  const locked=await verifyAuthHandler(new Request('https://example.test/api/verify-auth-code',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'student@tudelft.nl',code:'000000',userId:'admin'})
  }));
  assert.equal(locked.status,429);

  // Fresh OTP succeeds, ignores spoofed client userId, and sets 30-day exp
  await sendAuthHandler(new Request('https://example.test/api/send-auth-email',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'newcomer@tudelft.nl'})
  }));
  const realCode=lastMail.subject.match(/(\d{6})/)[1];
  const verified=await verifyAuthHandler(new Request('https://example.test/api/verify-auth-code',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'newcomer@tudelft.nl',code:realCode,userId:'admin'})
  }));
  assert.equal(verified.status,200);
  const vData=await verified.json();
  assert.notEqual(vData.userId,'admin');
  assert.match(vData.userId,/^[0-9a-f-]{36}$/);
  const jwtPayload=JSON.parse(Buffer.from(vData.token.split('.')[1],'base64url').toString());
  assert.ok(jwtPayload.exp - jwtPayload.iat >= 29 * 86400);

  delete process.env.RESEND_API_KEY;
  mock.mockExternal(null);
});

test('reporting, feedback, funnel tracking, A2 cloud sync, and GDPR export/account deletion work cleanly',async()=>{
  assert.equal((await ask('track','POST',{event:'page_view'},undefined)).status,200);
  assert.equal((await ask('track','POST',{event:'invalid_event'},undefined)).status,400);
  assert.equal((await ask('submitFeedback','POST',{category:'功能建议',content:'希望能搜鹿特丹闲置',contact:'test@qq.com',page:'/market'},undefined)).status,200);
  assert.equal((await ask('reportContent','POST',{targetType:'listing',targetId:listingId,reason:'疑似诈骗或定金诱导',detail:'要求先转定金'},undefined)).status,200);

  assert.equal((await ask('saveStudyProgress','POST',{study:{completed:['coffee']},prep:{version:1}},'bob')).status,200);
  const progress=(await ask('studyProgress','GET',undefined,'bob')).data.progress;
  assert.deepEqual(progress.study,{completed:['coffee']});

  const exported=(await ask('exportMyData','GET',undefined,'bob')).data;
  assert.equal(exported.account.verified_email,'bob@gmail.com');
  assert.equal(exported.listings.length,1);

  assert.equal((await ask('deleteAccount','POST',{confirm:'wrong'},'bob')).status,400);
  assert.equal((await ask('deleteAccount','POST',{confirm:'DELETE'},'bob')).status,200);
  assert.equal((await ask('mine','GET',undefined,'bob')).data.listings.length,0);
  assert.equal(mock.db.prepare('SELECT COUNT(*) AS n FROM users WHERE id=?').get('bob').n,0);
});

test('only the seller can delete a listing and its associated messages',async()=>{
  assert.equal((await ask('deleteListing','POST',{listingId},'charlie')).status,403);
  assert.equal((await ask('deleteListing','POST',{listingId},'alice')).status,200);
  assert.equal((await ask('listing','GET',undefined,undefined,{id:listingId})).status,404);
});
