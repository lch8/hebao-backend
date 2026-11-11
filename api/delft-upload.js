import { authId, json, sql } from './_delft-db.js';
export const config={runtime:'edge'};
const bytesToHex = bytes => [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
const sha1 = async text => bytesToHex(await crypto.subtle.digest('SHA-1',new TextEncoder().encode(text)));
const hmac = async (key,text) => {
  const cryptoKey=await crypto.subtle.importKey('raw',new TextEncoder().encode(key),{name:'HMAC',hash:'SHA-1'},false,['sign']);
  return bytesToHex(await crypto.subtle.sign('HMAC',cryptoKey,new TextEncoder().encode(text)));
};
export default async function handler(request){
  if(request.method!=='POST')return json({error:'不支持的方法'},405);
  const user=await authId(request);
  if(!user)return json({error:'请先登录'},401);
  try{
    const {imageBase64}=await request.json();
    if(typeof imageBase64!=='string'||imageBase64.length<100||imageBase64.length>1200000||!/^[A-Za-z0-9+/=]+$/.test(imageBase64))
      return json({error:'照片格式或大小有误（最多约 900KB）'},400);
    const binary=atob(imageBase64);
    const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    // JPEG starts with FFD8FF; this API only accepts browser-compressed JPEGs.
    if(bytes.length<128||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)return json({error:'仅接受 JPG 格式'},400);
    // Hard upload quota per verified user/day to limit storage abuse.
    await sql('CREATE TABLE IF NOT EXISTS delft_upload_quota (id TEXT PRIMARY KEY, hits INTEGER NOT NULL)');
    const quota=await sql(`INSERT INTO delft_upload_quota(id,hits) VALUES(?,1)
       ON CONFLICT(id) DO UPDATE SET hits=hits+1 WHERE hits<60 RETURNING hits`,
      [`${new Date().toISOString().slice(0,10)}:${user}`]);
    if(!quota.rows.length)return json({error:'今天上传次数已达上限，请明天再试'},429);
    const {COS_SECRET_ID:id,COS_SECRET_KEY:secret,COS_BUCKET:bucket,COS_REGION:region}=process.env;
    if(!id||!secret||!bucket||!region)return json({error:'云图片服务尚未配置'},503);
    const host=`${bucket}.cos.${region}.myqcloud.com`;
    if(!/^[a-zA-Z0-9.-]+$/.test(host))throw new Error('COS configuration invalid');
    const path=`/delft/${crypto.randomUUID()}.jpg`;
    const now=Math.floor(Date.now()/1000), keyTime=`${now};${now+600}`;
    const signKey=await hmac(secret,keyTime);
    const headerKeys='content-type;host';
    const headers=`content-type=image%2Fjpeg&host=${encodeURIComponent(host)}`;
    const reqHash=await sha1(`put\n${path}\n\n${headers}\n`);
    const signature=await hmac(signKey,`sha1\n${keyTime}\n${reqHash}\n`);
    const authorization=`q-sign-algorithm=sha1&q-ak=${id}&q-sign-time=${keyTime}&q-key-time=${keyTime}&q-header-list=${headerKeys}&q-url-param-list=&q-signature=${signature}`;
    const upload=await fetch(`https://${host}${path}`,{
      method:'PUT',headers:{Host:host,'Content-Type':'image/jpeg',Authorization:authorization},body:bytes
    });
    if(!upload.ok)throw new Error('云存储上传失败');
    return json({ok:true,url:`https://${host}${path}`});
  }catch(error){console.error('delft upload',error);return json({error:'图片暂时无法上传，请检查图片存储配置'},500);}
}
