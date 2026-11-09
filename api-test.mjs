import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import handler from '../api/delft.js';
const db = new DatabaseSync(':memory:');
process.env.TURSO_DATABASE_URL='libsql://mock';process.env.TURSO_AUTH_TOKEN='test-token';process.env.JWT_SECRET='test';
const toValue = a => a.type==='null'?null:a.type==='integer'||a.type==='float'?Number(a.value):String(a.value);
const toArg = v => v==null?{type:'null',value:null}:typeof v==='number'?{type: Number.isInteger(v)?'integer':'float',value:String(v)}:{type:'text',value:String(v)};
const origFetch=globalThis.fetch;
globalThis.fetch=async (url,init) => {
 if(!String(url).endsWith('/v2/pipeline'))throw new Error('Unexpected request '+url);
 const {requests}=JSON.parse(init.body),{sql,args}=requests[0].stmt;
 try{
  const stmt=db.prepare(sql), values=(args||[]).map(toValue);
  if(/\bRETURNING\b|^\s*SELECT\b/i.test(sql)){
   const rows=stmt.all(...values), cols=rows.length?Object.keys(rows[0]):stmt.columns().map(c=>c.name);
   return Response.json({results:[{type:'ok',response:{result:{cols:cols.map(name=>({name})),rows:rows.map(r=>cols.map(c=>toArg(r[c]))),affected_row_count:rows.length}}}]});
  }
  const result=stmt.run(...values);
  return Response.json({results:[{type:'ok',response:{result:{cols:[],rows:[],affected_row_count:Number(result.changes)}}}]});
 }catch(error){return Response.json({results:[{type:'error',error:{message:error.message}}]});}
};
const jwt=user=>{const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');const payload=Buffer.from(JSON.stringify({userId:user,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');const data=`${header}.${payload}`;const sig=createHmac('sha256','test').update(data).digest('base64url');return `${data}.${sig}`;};
const ask=async(action,method='GET',body,user) => {
 const req=new Request(`https://example.com/api/delft?action=${action}`,{method,headers:user?{Authorization:`Bearer ${jwt(user)}`}: {},body:body?JSON.stringify(body):undefined});
 const res=await handler(req);return {status:res.status, data:await res.json()};
};
assert.deepEqual((await ask('listings')).data.listings,[]);
assert.deepEqual((await ask('events')).data.events,[]);
assert.equal((await ask('createListing','POST',{items:[]},undefined)).status,401);
const created=await ask('createListing','POST',{seller:'小李',title:'毕业清仓',pickup:'TU Delft',note:'自取',items:[{id:'item-123456',name:'桌子',price:20,status:'available',photo:'https://evil.com/x'}]},'alice');
assert.equal(created.status,200);assert.ok(created.data.id);
const lid=created.data.id;
let listings=(await ask('listings')).data.listings;
assert.equal(listings.length,1);assert.equal(listings[0].items[0].photo,'');
assert.equal((await ask('updateStatus','POST',{listingId:lid,itemId:'item-123456',status:'sold'},'bob')).status,403);
assert.equal((await ask('updateStatus','POST',{listingId:lid,itemId:'item-123456',status:'sold'},'alice')).status,200);
listings=(await ask('listings')).data.listings;assert.equal(listings[0].items[0].status,'sold');
assert.equal((await ask('sendMessage','POST',{listingId:lid,content:'hello'},'alice')).status,403);
assert.equal((await ask('sendMessage','POST',{listingId:lid,content:'hello'},'bob')).status,200);
assert.equal((await ask('messages','GET',null,'mallory')).data.messages.length,0);
assert.equal((await ask('messages','GET',null,'alice')).data.messages.length,1);
assert.equal((await ask('sendMessage','POST',{listingId:lid,receiverId:'bob',content:'好的'},'alice')).status,200);
const start=new Date(Date.now()+86400000).toISOString();
const event=await ask('createEvent','POST',{title:'周末桌游',host:'小李',startsAt:start,category:'桌游',place:'Delft station',capacity:2,description:''},'alice');
assert.equal(event.status,200);assert.ok(event.data.id);
assert.equal((await ask('rsvp','POST',{eventId:event.data.id,nickname:'小张'},'bob')).status,200);
assert.equal((await ask('rsvp','POST',{eventId:event.data.id,nickname:'小王'},'charlie')).status,409);
assert.equal((await ask('rsvp','POST',{eventId:event.data.id,nickname:'小李'},'alice')).status,409);
assert.equal((await ask('events','GET',undefined,'bob')).data.events[0].joined,true);
assert.equal((await ask('cancelRsvp','POST',{eventId:event.data.id},'bob')).status,200);
assert.equal((await ask('rsvp','POST',{eventId:event.data.id,nickname:'小王'},'charlie')).status,200);
assert.equal((await ask('cancelEvent','POST',{eventId:event.data.id},'bob')).status,200); // only owner affected
assert.equal((await ask('events')).data.events.length,1);
assert.equal((await ask('cancelEvent','POST',{eventId:event.data.id},'alice')).status,200);
assert.equal((await ask('events')).data.events.length,0);
console.log('PASS API: guest access, auth, listing, ownership, statuses, messages, RSVP capacity, cancellation');
globalThis.fetch=origFetch;
