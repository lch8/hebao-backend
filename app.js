// Delft pilot: no frontend framework, no third-party analytics, no automatic WeChat group posting.
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state = {photos:[],listings:[],events:[],currentListing:null,currentEvent:null,publishedId:null,activeTab:'sell'};
const statusNames = {available:'在售',reserved:'已预订',sold:'已售出'};
const uuid = () => crypto.randomUUID();
const token = () => localStorage.getItem('hebao_token') || '';
const nickname = () => localStorage.getItem('delft_nickname') || localStorage.getItem('hp_name') || '';
const api = async (action,method='GET',body,authorized=true) => {
  const response=await fetch(`/api/delft?action=${encodeURIComponent(action)}`,{
    method,headers:{'Content-Type':'application/json',...(authorized && token()?{Authorization:`Bearer ${token()}`}:{})},
    ...(body?{body:JSON.stringify(body)}:{})
  });
  const data=await response.json().catch(()=>({error:'服务器返回异常'}));
  if(!response.ok || data.error)throw new Error(data.error||`请求失败 ${response.status}`);
  return data;
};
let toastTimer;
function toast(message){const el=$('toast');el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,4500);}
function setBusy(button,busy,label){button.disabled=busy;if(busy){button.dataset.oldLabel=button.textContent;button.textContent=label||'处理中…';}else if(button.dataset.oldLabel){button.textContent=button.dataset.oldLabel;delete button.dataset.oldLabel;}}
function requireAuth(){if(token())return true;showModal('loginModal');toast('该功能需要邮箱登录；生成文案和海报不需要登录');return false;}
function showModal(id){$(id).hidden=false;document.body.style.overflow='hidden';}
function hideModal(id){$(id).hidden=true;document.body.style.overflow='';}
function tab(name){
  state.activeTab=name;
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===`panel-${name}`));
  if(name==='market')loadListings();if(name==='events')loadEvents();if(name==='mine')loadMine();
  window.scrollTo({top:0,behavior:'smooth'});
}
document.addEventListener('click',e=>{
  const nav=e.target.closest('[data-tab]');if(nav)tab(nav.dataset.tab);
  const close=e.target.closest('[data-close]');if(close)hideModal(close.dataset.close);
  if(e.target.classList.contains('overlay'))hideModal(e.target.id);
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.overlay:not([hidden])').forEach(x=>hideModal(x.id));});

// ---- User sign-in (compatible with existing email OTP and JWT). ----
function refreshLoginUI(){
  $('loginTrigger').textContent=token()?'已登录 · 我的':'邮箱登录';
  const profile=$('profileArea');
  if(token())profile.innerHTML=`<p>邮箱登录已完成，发布和报名将使用同一账号。</p><button id="logout" class="outline-btn" type="button">退出登录</button>`;
  else profile.innerHTML=`<p>登录后查看自己的商品、报名和私信。</p><button id="mineLogin" class="outline-btn" type="button">邮箱登录</button>`;
  const trigger=$('mineLogin');if(trigger)trigger.onclick=()=>showModal('loginModal');
  $('logout')?.addEventListener('click',()=>{['hebao_token','hebao_logged_in','hebao_email'].forEach(k=>localStorage.removeItem(k));refreshLoginUI();loadMine();});
}
$('loginTrigger').addEventListener('click',()=>token()?tab('mine'):showModal('loginModal'));
$('sendCode').addEventListener('click',async()=>{
  const email=$('authEmail').value.trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){toast('请输入正确的邮箱地址');return;}
  const button=$('sendCode');setBusy(button,true,'发送中…');
  try{
    const r=await fetch('/api/send-auth-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
    const data=await r.json();if(!r.ok || !data.success)throw new Error(data.error||'发送失败');
    toast('验证码已发送，也请检查垃圾邮件');
  }catch(error){toast(error.message);}finally{setBusy(button,false);}
});
$('verifyCode').addEventListener('click',async()=>{
  const email=$('authEmail').value.trim(),code=$('authCode').value.trim();
  if(!email||!/^[0-9]{6}$/.test(code)){toast('请填写邮箱和6位数字验证码');return;}
  const button=$('verifyCode');setBusy(button,true,'验证中…');
  try{
    let userId=localStorage.getItem('hebao_uuid');if(!userId){userId=uuid();localStorage.setItem('hebao_uuid',userId);}
    const r=await fetch('/api/verify-auth-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,code,userId})});
    const data=await r.json();if(!r.ok||!data.success)throw new Error(data.error||'验证失败');
    localStorage.setItem('hebao_token',data.token);localStorage.setItem('hebao_logged_in','true');
    localStorage.setItem('hebao_uuid',data.userId);localStorage.setItem('hebao_email',email);
    refreshLoginUI();hideModal('loginModal');toast('登录成功，可以继续发布、报名或聊天');
    if(state.activeTab==='mine')loadMine();if(state.activeTab==='events')loadEvents();
  }catch(error){toast(error.message);}finally{setBusy(button,false);}
});

// ---- Image compression and listing draft ----
const asJpeg = file => new Promise((resolve,reject)=>{
  const img=new Image(),url=URL.createObjectURL(file);
  img.onload=()=>{
    try{
      const scale=Math.min(1,1100/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
      const dataUrl=canvas.toDataURL('image/jpeg',0.73);resolve(dataUrl);
    }catch(e){reject(e);}finally{URL.revokeObjectURL(url);}
  };img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('无法读取图片'));};img.src=url;
});
$('photoInput').addEventListener('change',async e=>{
  const files=[...e.target.files].filter(f=>f.type.startsWith('image/'));
  if(files.length+state.photos.length>12){toast('最多允许12件商品');e.target.value='';return;}
  try{state.publishedId=null;$('shareResult').hidden=true;for(const file of files){const dataUrl=await asJpeg(file);state.photos.push({id:uuid(),name:'',price:'',condition:'',dataUrl,photo:'',status:'available'});}}
  catch(error){toast('部分图片读取失败：'+error.message);}finally{e.target.value='';renderItems();}
});
$('addManualItem').addEventListener('click',()=>{
  if(state.photos.length>=12){toast('最多12件商品');return;}
  state.publishedId=null;$('shareResult').hidden=true;state.photos.push({id:uuid(),name:'',price:'',condition:'',dataUrl:'',photo:'',status:'available'});renderItems();
});
function renderItems(){
  $('photoCount').textContent=state.photos.length?`已添加 ${state.photos.length} 件商品。请确认每件商品的名称、价格和成色。`:'';
  $('itemEditor').classList.toggle('empty-state',!state.photos.length);
  $('itemEditor').innerHTML=state.photos.length?state.photos.map((item,i)=>`<div class="item-card" data-id="${item.id}">
    ${item.dataUrl?`<img class="item-thumb" src="${item.dataUrl}" alt="商品 ${i+1}" />`:'<div class="item-thumb image-fallback">📦</div>'}
    <div class="item-fields"><div class="item-name-row"><input aria-label="商品名称" data-field="name" maxlength="70" placeholder="商品名称" value="${esc(item.name)}" /><button type="button" class="remove-btn" data-remove="${item.id}">删除</button></div>
    <div class="pair"><label>价格（€）<input type="number" min="0" max="10000" step="0.5" data-field="price" value="${esc(item.price)}" placeholder="待定" /></label><label>成色或说明<input data-field="condition" maxlength="140" value="${esc(item.condition)}" placeholder="例如：八成新 / 自取" /></label></div></div></div>`).join(''):'还没有商品，先上传照片或手动添加一件。';
}
$('itemEditor').addEventListener('input',e=>{const card=e.target.closest('[data-id]'),field=e.target.dataset.field;if(!card||!field)return;const item=state.photos.find(i=>i.id===card.dataset.id);if(item){item[field]=e.target.value;state.publishedId=null;$('shareResult').hidden=true;}});
$('itemEditor').addEventListener('click',e=>{const id=e.target.closest('[data-remove]')?.dataset.remove;if(!id)return;state.photos=state.photos.filter(i=>i.id!==id);state.publishedId=null;$('shareResult').hidden=true;renderItems();});
['listingTitle','sellerName','pickup','listingNote'].forEach(id=>$(id).addEventListener('input',()=>{state.publishedId=null;$('shareResult').hidden=true;}));
$('btnAnalyze').addEventListener('click',async()=>{
  const photos=state.photos.filter(p=>p.dataUrl).slice(0,8);if(!photos.length){toast('请先添加至少一张照片');return;}
  const button=$('btnAnalyze');setBusy(button,true,'正在识别…');
  try{
    const resp=await fetch('/api/delft-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({photos:photos.map(x=>x.dataUrl.split(',')[1])})});
    const data=await resp.json();if(!resp.ok)throw new Error(data.error||'AI 暂时不可用');
    data.items?.forEach(result=>{const item=photos[result.index];if(!item)return;
      if(!item.name)item.name=result.name;
      if(!item.condition)item.condition=result.condition;});
    renderItems();toast('识别完成，请检查商品名称和成色');
  }catch(error){toast(error.message);}finally{setBusy(button,false);}
});
function validateDraft(){
  if(!state.photos.length)throw new Error('至少添加一件商品');
  if(state.photos.some(i=>!i.name.trim()))throw new Error('请给每件商品填写名称');
  if(state.photos.some(i=>i.price!==''&&(!Number.isFinite(Number(i.price))||Number(i.price)<0||Number(i.price)>10000)))throw new Error('商品价格须在0–10000欧元之间');
}
function listingCopy(){
  validateDraft();const title=$('listingTitle').value.trim()||'Delft 二手闲置';const pickup=$('pickup').value.trim()||'Delft（具体地点私聊）';
  const lines=[`📦 ${title}`,'',...state.photos.map(i=>`• ${i.name} ${i.price===''?'价格私聊':`€${Number(i.price)}`}${i.condition?`｜${i.condition}`:''}`),'',`📍 自取：${pickup}`];
  const note=$('listingNote').value.trim();if(note)lines.push(`💬 ${note}`);
  if(state.publishedId)lines.push('',`🔗 最新商品状态：${new URL(`/delft/?item=${encodeURIComponent(state.publishedId)}`,location.origin).href}`);
  lines.push('已售商品以链接内最新状态为准，欢迎私信交流。');return lines.join('\n');
}
$('btnCopy').addEventListener('click',async()=>{
  try{const text=listingCopy();await navigator.clipboard.writeText(text);toast('已复制微信群文案，打开微信粘贴即可');}
  catch(error){toast(error.message||'复制失败，请通过安全 HTTPS 页面访问');}
});
const drawCover = (ctx,img,x,y,w,h) => {
  const scale=Math.max(w/img.width,h/img.height), dw=img.width*scale,dh=img.height*scale;
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);ctx.restore();
};
const loadImg = src => new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;});
$('btnPoster').addEventListener('click',async()=>{
  try{
    validateDraft();const button=$('btnPoster');setBusy(button,true,'海报生成中…');
    const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1390;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#f8f7f3';ctx.fillRect(0,0,1000,1390);
    ctx.fillStyle='#204f3d';ctx.fillRect(0,0,1000,225);ctx.fillStyle='#fff';ctx.font='bold 52px sans-serif';ctx.fillText(($('listingTitle').value.trim()||'Delft 闲置出清').slice(0,17),55,110);
    ctx.font='26px sans-serif';ctx.fillText(`📍 ${$('pickup').value.trim()||'Delft 自取'}`.slice(0,28),55,170);
    const items=state.photos.slice(0,9);const cols=3,w=282,h=320,g=22,left=55,top=260;
    for(let k=0;k<items.length;k++){
      const it=items[k],x=left+(k%cols)*(w+g),y=top+Math.floor(k/cols)*(h+g);
      ctx.fillStyle='#fff';ctx.fillRect(x,y,w,h);
      if(it.dataUrl){const img=await loadImg(it.dataUrl);if(img)drawCover(ctx,img,x,y,w,230);}
      else{ctx.fillStyle='#e4ede7';ctx.fillRect(x,y,w,230);ctx.font='64px sans-serif';ctx.fillStyle='#446e5a';ctx.fillText('📦',x+105,y+145);}
      ctx.fillStyle='#203c2d';ctx.font='bold 23px sans-serif';ctx.fillText(it.name.slice(0,11),x+12,y+265);
      ctx.fillStyle='#217256';ctx.font='bold 27px sans-serif';ctx.fillText(it.price===''?'价格私聊':`€${Number(it.price)}`,x+12,y+300);
    }
    ctx.fillStyle='#517562';ctx.font='22px sans-serif';ctx.fillText('荷包 · Delft   |   最新状态请查看分享链接',55,1350);
    const a=document.createElement('a');a.download='Delft-毕业清仓海报.jpg';a.href=canvas.toDataURL('image/jpeg',0.88);a.click();toast('海报已生成，可保存后发送到微信群');
    setBusy(button,false);
  }catch(error){toast(error.message);setBusy($('btnPoster'),false);}
});
$('btnPublish').addEventListener('click',async()=>{
  try{
    validateDraft();if(!requireAuth())return;
    const seller=$('sellerName').value.trim(),pickup=$('pickup').value.trim(),title=$('listingTitle').value.trim();
    if(!seller||!pickup||!title){toast('请填写昵称、清仓标题和自取位置');return;}
    const button=$('btnPublish');setBusy(button,true,'上传并发布中…');
    const items=[];
    for(const it of state.photos){
      let photo=it.photo||'';
      if(it.dataUrl&&!photo){
        const resp=await fetch('/api/delft-upload',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token()}`},body:JSON.stringify({imageBase64:it.dataUrl.split(',')[1]})});
        const data=await resp.json();if(!resp.ok)throw new Error(data.error||'图片上传失败');
        photo=data.url;it.photo=photo;
      }
      items.push({id:it.id,name:it.name,price:it.price,condition:it.condition,photo,status:'available'});
    }
    const published=await api('createListing','POST',{seller,title,pickup,note:$('listingNote').value,items});
    state.publishedId=published.id;
    const link=new URL(`/delft/?item=${encodeURIComponent(published.id)}`,location.origin).href;
    $('shareResult').hidden=false;$('shareResult').innerHTML=`✅ 已公开上架！把更新状态的页面发给微信群：<br /><a href="${esc(link)}" target="_blank" rel="noopener">${esc(link)}</a>`;
    localStorage.setItem('delft_nickname',seller);toast('发布成功！现在可以复制带动态链接的群文案');
  }catch(error){toast(error.message);}finally{setBusy($('btnPublish'),false);}
});

// ---- Marketplace ----
async function loadListings(){
  try{const result=await api('listings','GET',null,false);state.listings=result.listings||[];renderMarket();}
  catch(error){$('marketGrid').innerHTML=`<div class="empty-state">${esc(error.message)}</div>`;}
}
function listingSearchResults(){
  const term=$('marketSearch').value.trim().toLowerCase();
  return state.listings.filter(l=>!l.stale&&l.items.some(i=>i.status==='available')&&
    (!term || [l.title,l.pickup,...l.items.map(i=>i.name)].some(s=>String(s).toLowerCase().includes(term))));
}
function renderMarket(){
  const items=listingSearchResults();const root=$('marketGrid');
  root.innerHTML=items.length?items.map(l=>{
    const selling=l.items.filter(i=>i.status==='available');const cover=selling.find(i=>i.photo)?.photo;
    const min=Math.min(...selling.map(i=>i.price===null?Infinity:Number(i.price)));const price=Number.isFinite(min)?`€${min} 起`:'价格私聊';
    return `<article class="listing-card" role="button" tabindex="0" data-listing="${esc(l.id)}">${cover?`<img loading="lazy" class="listing-photo" src="${esc(cover)}" alt="商品照片" />`:'<div class="listing-photo image-fallback">📦</div>'}
    <div class="listing-details"><span class="pill">${selling.length} 件在售</span><h3>${esc(l.title)}</h3><div class="price">${esc(price)}</div><p>${esc(l.pickup)} · ${esc(l.seller)}</p></div></article>`;
  }).join(''):'<div class="empty-state">暂无匹配的有效商品。你可以先用「闲置发布助手」生成广告，并邀请卖家公开上架。</div>';
}
$('marketGrid').addEventListener('click',e=>{const card=e.target.closest('[data-listing]');if(card)openListing(card.dataset.listing);});
$('marketGrid').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-listing]')){e.preventDefault();openListing(e.target.dataset.listing);}});
$('marketSearch').addEventListener('input',renderMarket);
$('refreshMarket').addEventListener('click',loadListings);
async function openListing(id){
  let listing=state.listings.find(l=>l.id===id);
  if(!listing){
    try{const r=await fetch(`/api/delft?action=listing&id=${encodeURIComponent(id)}`);const data=await r.json();if(!r.ok)throw new Error(data.error||'商品不存在');listing=data.listing;}
    catch(error){toast(error.message);return;}
  }
  state.currentListing=listing;
  $('detailContent').innerHTML=`<div class="eyebrow">Delft · 闲置</div><h2 id="detailHeading">${esc(listing.title)}</h2>
    <p>${esc(listing.seller)} · 自取：${esc(listing.pickup)}</p><p>${esc(listing.note)}</p>
    ${listing.stale?'<div class="safety-note">此商品信息超过14天未更新，请与卖家核实。</div>':''}
    ${listing.items.map(item=>`<div class="detail-item">${item.photo?`<img src="${esc(item.photo)}" alt="${esc(item.name)}" />`:'<div class="item-thumb image-fallback">📦</div>'}
      <div><h4>${esc(item.name)} · ${item.price==null?'价格私聊':`€${Number(item.price)}`}</h4><p>${esc(item.condition)}</p></div><span class="pill ${item.status==='sold'?'gray':''}">${statusNames[item.status]||'在售'}</span></div>`).join('')}`;
  $('inquiryText').value='';showModal('detailModal');
}
$('sendInquiry').addEventListener('click',async()=>{
  if(!state.currentListing||!requireAuth())return;
  const content=$('inquiryText').value.trim();if(!content){toast('请先输入咨询内容');return;}
  const button=$('sendInquiry');setBusy(button,true,'发送中…');
  try{await api('sendMessage','POST',{listingId:state.currentListing.id,content});toast('消息已发送，请在「我的」中查看回复');hideModal('detailModal');}
  catch(error){toast(error.message);}finally{setBusy(button,false);}
});

// ---- Events ----
const dateText = iso => new Intl.DateTimeFormat('zh-CN',{timeZone:'Europe/Amsterdam',month:'long',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
async function loadEvents(){
  try{const result=await api('events');state.events=result.events||[];renderEvents();}
  catch(error){$('eventsList').innerHTML=`<div class="empty-state">${esc(error.message)}</div>`;}
}
function renderEvents(){
  $('eventsList').innerHTML=state.events.length?state.events.map(ev=>`<article class="event-card"><div class="event-top"><span class="pill">${esc(ev.category)}</span><span class="pill ${ev.count>=ev.capacity?'gray':''}">${ev.count}/${ev.capacity} 人</span></div>
    <h3>${esc(ev.title)}</h3><p>${esc(ev.description)||'轻松认识新朋友，一起度过周末。'}</p><div class="event-meta"><span>🗓️ ${esc(dateText(ev.startsAt))}</span><span>📍 ${esc(ev.place)}</span><span>🙋 ${esc(ev.host)} 发起</span></div>
    <div class="event-footer"><button type="button" class="text-btn" data-share-event="${esc(ev.id)}">复制分享链接</button><button type="button" class="${ev.joined?'outline-btn':'primary-btn'}" data-event="${esc(ev.id)}" ${ev.hostIsMe||(!ev.joined&&ev.count>=ev.capacity)?'disabled':''}>${ev.hostIsMe?'我发起的':ev.joined?'取消报名':ev.count>=ev.capacity?'已满员':'报名参加'}</button></div>${ev.hostIsMe?`<div class="event-footer"><button class="text-btn" type="button" data-attendees="${esc(ev.id)}">查看报名昵称</button><button class="text-btn" type="button" data-cancel-event="${esc(ev.id)}">取消活动</button></div>`:''}</article>`).join(''):'<div class="empty-state">还没有公开活动。你可以成为第一个发起周末小聚的人。</div>';
}
$('eventsList').addEventListener('click',async e=>{
  const share=e.target.closest('[data-share-event]');
  if(share){const link=new URL(`/delft/?event=${encodeURIComponent(share.dataset.shareEvent)}`,location.origin).href;try{await navigator.clipboard.writeText(link);toast('活动链接已复制，可分享到微信群');}catch{toast('复制失败：请使用 HTTPS 页面');}return;}
  const cancel=e.target.closest('[data-cancel-event]');
  if(cancel){if(!requireAuth()||!confirm('取消后报名者将无法再看到此活动，确定吗？'))return;try{await api('cancelEvent','POST',{eventId:cancel.dataset.cancelEvent});toast('活动已取消');loadEvents();}catch(error){toast(error.message);}return;}
  const attendees=e.target.closest('[data-attendees]');
  if(attendees){if(!requireAuth())return;try{const r=await fetch(`/api/delft?action=attendees&id=${encodeURIComponent(attendees.dataset.attendees)}`,{headers:{Authorization:`Bearer ${token()}`}});const data=await r.json();if(!r.ok)throw new Error(data.error);alert(data.attendees.length?`报名用户：\n${data.attendees.map(x=>x.nickname).join('\n')}`:'暂时还没有报名者');}catch(error){toast(error.message);}return;}
  const button=e.target.closest('[data-event]');if(!button||!requireAuth())return;
  const event=state.events.find(ev=>ev.id===button.dataset.event);if(!event)return;
  if(event.joined){if(!confirm('确定取消报名吗？'))return;
    try{await api('cancelRsvp','POST',{eventId:event.id});toast('已取消报名');loadEvents();}catch(error){toast(error.message);}
    return;
  }
  state.currentEvent=event;$('rsvpName').value=nickname();showModal('rsvpModal');
});
$('confirmRsvp').addEventListener('click',async()=>{
  const name=$('rsvpName').value.trim();if(!state.currentEvent||!name){toast('请输入活动昵称');return;}
  const button=$('confirmRsvp');setBusy(button,true,'报名中…');
  try{await api('rsvp','POST',{eventId:state.currentEvent.id,nickname:name});localStorage.setItem('delft_nickname',name);hideModal('rsvpModal');toast('报名成功！请留意活动详情并自行安排到场');loadEvents();}
  catch(error){toast(error.message);}finally{setBusy(button,false);}
});
$('openCreateEvent').addEventListener('click',()=>{if(!requireAuth())return;$('createEventBox').hidden=false;$('hostName').value=nickname();$('createEventBox').scrollIntoView({behavior:'smooth'});});
$('closeCreateEvent').addEventListener('click',()=>$('createEventBox').hidden=true);
$('createEventForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!requireAuth())return;
  const form=e.target,values=Object.fromEntries(new FormData(form));
  const startsAt=new Date(values.startsAt);if(Number.isNaN(startsAt.getTime())){toast('日期无效');return;}
  const button=form.querySelector('[type=submit]');setBusy(button,true,'发布中…');
  try{await api('createEvent','POST',{title:values.title,host:values.host,category:values.category,startsAt:startsAt.toISOString(),capacity:Number(values.capacity),place:values.place,description:values.description});
    localStorage.setItem('delft_nickname',values.host);$('createEventBox').hidden=true;form.reset();toast('活动发布成功！可邀请朋友来报名');loadEvents();}
  catch(error){toast(error.message);}finally{setBusy(button,false);}
});

// ---- My inventory + buyer/seller messages ----
async function loadMine(){
  refreshLoginUI();if(!token()){$('myListings').innerHTML='';$('myMessages').innerHTML='';return;}
  try{
    const [mine,inbox]=await Promise.all([api('mine'),api('messages')]);
    $('myListings').innerHTML=mine.listings.length?`<h2>我的清仓页</h2>`+mine.listings.map(l=>`<div class="my-listing"><h3>${esc(l.title)} <small class="hint">${esc(l.pickup)}</small></h3>
      ${l.items.map(item=>`<div class="my-item"><span>${esc(item.name)}</span><select data-listing-id="${esc(l.id)}" data-item-id="${esc(item.id)}" aria-label="更新商品状态">${Object.entries(statusNames).map(([value,label])=>`<option value="${value}" ${item.status===value?'selected':''}>${label}</option>`).join('')}</select></div>`).join('')}
      <p class="fineprint"><a href="/delft/?item=${encodeURIComponent(l.id)}">查看并分享商品链接</a> · <button class="text-btn" type="button" data-delete-listing="${esc(l.id)}">删除清仓页</button></p></div>`).join(''):'<div class="empty-state">还没有发布过清仓页。</div>';
    const threads=new Map();for(const m of inbox.messages){const key=`${m.listingId}|${m.otherId}`;if(!threads.has(key))threads.set(key,[]);threads.get(key).push(m);}
    $('myMessages').innerHTML=`<h2>我的私信</h2>`+(threads.size?[...threads.values()].map(thread=>{
      const latest=thread[0];return `<div class="thread" data-thread-listing="${esc(latest.listingId)}" data-thread-user="${esc(latest.otherId)}"><h3>${esc(latest.listingTitle)}</h3>
      ${thread.reverse().map(m=>`<div class="message-bubble ${m.fromMe?'mine':''}"><strong>${m.fromMe?'我':'对方'}</strong> · ${esc(new Date(m.createdAt).toLocaleString('zh-CN'))}<div>${esc(m.content)}</div></div>`).join('')}
      <form class="message-reply"><input name="message" maxlength="500" required placeholder="回复消息…" /><button type="submit" class="outline-btn">发送</button></form></div>`;
    }).join(''):'<div class="empty-state">暂无消息。买卖双方的咨询记录会出现在这里。</div>');
  }catch(error){if(/登录|Token|401/.test(error.message)){localStorage.removeItem('hebao_token');refreshLoginUI();}
    $('myListings').innerHTML=`<div class="empty-state">${esc(error.message)}</div>`;}
}
$('myListings').addEventListener('click',async e=>{
  const id=e.target.closest('[data-delete-listing]')?.dataset.deleteListing;
  if(!id||!confirm('确认永久删除这个清仓页及相关私信？'))return;
  try{await api('deleteListing','POST',{listingId:id});toast('清仓页已删除');loadMine();}
  catch(error){toast(error.message);}
});
$('myListings').addEventListener('change',async e=>{
  const select=e.target.closest('[data-item-id]');if(!select)return;
  try{await api('updateStatus','POST',{listingId:select.dataset.listingId,itemId:select.dataset.itemId,status:select.value});toast('商品状态已更新');}
  catch(error){toast(error.message);loadMine();}
});
$('myMessages').addEventListener('submit',async e=>{
  const form=e.target.closest('.message-reply');if(!form)return;e.preventDefault();
  const thread=form.closest('[data-thread-listing]');const content=form.elements.message.value.trim();if(!content)return;
  const button=form.querySelector('[type=submit]');setBusy(button,true,'发送中…');
  try{await api('sendMessage','POST',{listingId:thread.dataset.threadListing,receiverId:thread.dataset.threadUser,content});toast('消息已发送');loadMine();}
  catch(error){toast(error.message);}finally{setBusy(button,false);}
});

// ---- Startup ----
refreshLoginUI();loadListings();loadEvents();
const itemQuery=new URLSearchParams(location.search).get('item');
if(itemQuery){tab('market');openListing(itemQuery);}
const eventQuery=new URLSearchParams(location.search).get('event');
if(eventQuery&&!itemQuery){tab('events');loadEvents().then(()=>{const card=$('eventsList').querySelector(`[data-event="${CSS.escape(eventQuery)}"]`);card?.closest('.event-card')?.scrollIntoView({behavior:'smooth',block:'center'});});}
