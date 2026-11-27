import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {test,after} from 'node:test';
import {mockTurso} from './helpers/mock-turso.mjs';

process.env.TURSO_DATABASE_URL='libsql://mock';
process.env.TURSO_AUTH_TOKEN='test-token';
process.env.JWT_SECRET='test-only-secret';
const mock=mockTurso();
after(()=>mock.restore());
const {cosConfig}=await import('../api/_image-store.js');
const uploadHandler=(await import('../api/delft-upload.js')).default;
const imageHandler=(await import('../api/delft-image.js')).default;
const delftHandler=(await import('../api/delft.js')).default;

const jwt=user=>{
  const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
  const payload=Buffer.from(JSON.stringify({userId:user,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');
  return `${header}.${payload}.${createHmac('sha256',process.env.JWT_SECRET).update(`${header}.${payload}`).digest('base64url')}`;
};
const jpeg=Buffer.concat([Buffer.from([0xff,0xd8,0xff,0xe0]),Buffer.alloc(300,7)]).toString('base64');
const upload=(body,user='alice')=>uploadHandler(new Request('https://example.test/api/delft-upload',{method:'POST',headers:{'Content-Type':'application/json',...(user?{Authorization:`Bearer ${jwt(user)}`}:{})},body:JSON.stringify(body)}));

test('COS env values are trimmed and a pasted bucket domain is accepted',()=>{
  const cfg=cosConfig({COS_SECRET_ID:' id\n',COS_SECRET_KEY:'key ',COS_BUCKET:'https://hebao-1250000000.cos.eu-frankfurt.myqcloud.com/',COS_REGION:''});
  assert.equal(cfg.valid,true);
  assert.equal(cfg.host,'hebao-1250000000.cos.eu-frankfurt.myqcloud.com');
  assert.equal(cosConfig({COS_SECRET_ID:'a',COS_SECRET_KEY:'b',COS_BUCKET:'hebao',COS_REGION:'ap-beijing'}).valid,false);
  assert.deepEqual(cosConfig({}).missing,['COS_SECRET_ID','COS_SECRET_KEY','COS_BUCKET','COS_REGION']);
});

test('upload rejects guests and non-JPEG data with clear messages',async()=>{
  assert.equal((await upload({imageBase64:jpeg},null)).status,401);
  assert.equal((await upload({imageBase64:Buffer.alloc(300,1).toString('base64')})).status,400);
  assert.equal((await upload({imageBase64:'A'.repeat(1300000)})).status,413);
});

test('a deleted COS bucket falls back to database storage and the photo can be published and served',async()=>{
  Object.assign(process.env,{COS_SECRET_ID:'id',COS_SECRET_KEY:'key',COS_BUCKET:'hebao-12345678-1406051963',COS_REGION:'ap-beijing'});
  let cosCalls=0;
  mock.mockExternal(async url=>{cosCalls++;assert.match(url,/myqcloud\.com/);return new Response('<Error><Code>NoSuchBucket</Code></Error>',{status:404});});
  const response=await upload({imageBase64:jpeg});
  const data=await response.json();
  assert.equal(response.status,200);
  assert.equal(data.storage,'db');
  assert.match(data.url,/^\/api\/delft-image\?id=[0-9a-f-]{36}$/);
  assert.equal(cosCalls,1);
  // A second upload in the cooldown window skips the failing COS entirely.
  assert.equal((await (await upload({imageBase64:jpeg})).json()).storage,'db');
  assert.equal(cosCalls,1);

  const served=await imageHandler(new Request(`https://example.test${data.url}`));
  assert.equal(served.status,200);
  assert.equal(served.headers.get('content-type'),'image/jpeg');
  assert.deepEqual(Buffer.from(await served.arrayBuffer()),Buffer.from(jpeg,'base64'));

  const create=await delftHandler(new Request('https://example.test/api/delft?action=createListing',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${jwt('alice')}`},body:JSON.stringify({seller:'A',title:'书桌',pickup:'TU',note:'',items:[{id:'desk-1',name:'书桌',price:10,photo:data.url},{id:'lamp-1',name:'台灯',photo:'/api/delft-image?id=../../etc'}]})}));
  const {id}=await create.json();
  const listing=(await (await delftHandler(new Request(`https://example.test/api/delft?action=listing&id=${id}`))).json()).listing;
  assert.equal(listing.items[0].photo,data.url);
  assert.equal(listing.items[1].photo,'');

  await delftHandler(new Request('https://example.test/api/delft?action=deleteListing',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${jwt('alice')}`},body:JSON.stringify({listingId:id})}));
  assert.equal((await imageHandler(new Request(`https://example.test${data.url}`))).status,404);
});

test('storage self-check reports the COS error code without leaking secrets',async()=>{
  const response=await uploadHandler(new Request('https://example.test/api/delft-upload?check=1'));
  const text=await response.text();
  const report=JSON.parse(text);
  assert.equal(report.cos.configured,true);
  assert.equal(report.cos.error,'NoSuchBucket');
  assert.equal(report.uploadsWork,true);
  assert.doesNotMatch(text,/"key"|COS_SECRET_KEY":"/);
});
