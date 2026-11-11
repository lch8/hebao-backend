// Delft pilot: no frontend framework, no third-party analytics, no automatic WeChat group posting.
import {readDraft,writeDraft,deleteDraft} from './draft-store.js';
import {createPoster} from './poster.js';
import {cityEvents, CITY_EVENTS_CHECKED, CITY_AGENDA_URL, upcomingCityEvents, amsterdamInput, amsterdamInstant, cityEventDraft} from './city-events.js';
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state = {photos:[],listings:[],myListings:[],events:[],currentListing:null,currentEvent:null,publishedId:null,editingId:null,editVersion:null,dirty:false,activeTab:'sell',category:'',saving:false};
const itemCategories=['家具','自行车','数码','生活用品','书籍','其他'];
const statusNames = {available:'在售',reserved:'已预订',sold:'已售出'};
const uuid = () => crypto.randomUUID();
const token = () => localStorage.getItem('hebao_token') || '';
const nickname = () => localStorage.getItem('delft_nickname') || localStorage.getItem('hp_name') || '';
const api = async (action,method='GET',body,authorized=true,params={}) => {
  const response=await fetch(`/api/delft?${new URLSearchParams({action,...params})}`,{
    method,headers:{'Content-Type':'application/json',...(authorized && token()?{Authorization:`Bearer ${token()}`}:{})},
    ...(body?{body:JSON.stringify(body)}:{})
  });
  const data=await response.json().catch(()=>({error:'服务器返回异常'}));
  if(response.status===401 && authorized){['hebao_token','hebao_logged_in','hebao_email'].forEach(key=>localStorage.removeItem(key));refreshLoginUI();}
  if(!response.ok || data.error){const error=new Error(data.error||`请求失败 ${response.status}`);error.status=response.status;throw error;}
  return data;
};
let toastTimer;
function toast(message){const el=$('toast');el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,4500);}
function setBusy(button,busy,label){button.disabled=busy;if(busy){button.dataset.oldLabel=button.textContent;button.textContent=label||'处理中…';}else if(button.dataset.oldLabel){button.textContent=button.dataset.oldLabel;delete button.dataset.oldLabel;}}
function requireAuth(){if(token())return true;showModal('loginModal');toast('该功能需要邮箱登录；生成文案和海报不需要登录');return false;}
const modalFocus=new Map();
let modalLayer=1000;
function showModal(id){modalFocus.set(id,document.activeElement);$(id).hidden=false;$(id).style.zIndex=++modalLayer;document.body.style.overflow='hidden';$(id).querySelector('input,textarea,button')?.focus();}
function hideModal(id){$(id).hidden=true;document.body.style.overflow=document.querySelector('.overlay:not([hidden])')?'hidden':'';modalFocus.get(id)?.focus();}
async function tab(name,{updateUrl=true}={}){
  if(!['sell','market','events','mine'].includes(name))return;
  state.activeTab=name;
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
  document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===name)));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===`panel-${name}`));
  $('welcomeHero').hidden=name!=='sell';
  if(updateUrl){const url=new URL(location.href);url.searchParams.delete('item');url.searchParams.delete('event');url.searchParams.set('tab',name);history.replaceState(null,'',url);}
  window.scrollTo({top:0,behavior:'smooth'});
  if(name==='market')await loadListings();if(name==='events'){renderCityEvents();await loadEvents();}if(name==='mine')await loadMine();
}
document.addEventListener('click',e=>{
  const nav=e.target.closest('[data-tab]');if(nav)tab(nav.dataset.tab);
  const close=e.target.closest('[data-close]');if(close)hideModal(close.dataset.close);
  if(e.target.closest('[data-create-event]'))openEventForm();
  if(e.target.closest('[data-retry-events]'))loadEvents();
  if(e.target.closest('[data-clear-market]')){$('marketSearch').value='';$('marketCategories').querySelector('[data-category=""]').click();}
  if(e.target.classList.contains('overlay'))hideModal(e.target.id);
});
document.addEventListener('keydown',e=>{
  const top=[...document.querySelectorAll('.overlay:not([hidden])')].sort((a,b)=>Number(b.style.zIndex)-Number(a.style.zIndex))[0];
  if(!top)return;
  if(e.key==='Escape'){hideModal(top.id);return;}
  if(e.key==='Tab'){
    const items=[...top.querySelectorAll('button,input,textarea,select,a[href]')].filter(el=>!el.disabled&&!el.hidden);
    const first=items[0],last=items.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  }
});

// ---- User sign-in (compatible with existing email OTP and JWT). ----
function refreshLoginUI(){
  $('loginTrigger').textContent=token()?'已登录 · 我的':'邮箱登录';
  const profile=$('profileArea');
  if(token())profile.innerHTML=`<p>邮箱登录已完成，发布和报名将使用同一账号。</p><button id="logout" class="outline-btn" type="button">退出登录</button>`;
  else profile.innerHTML=`<p>登录后查看自己的商品、报名和私信。</p><button id="mineLogin" class="outline-btn" type="button">邮箱登录</button>`;
  const trigger=$('mineLogin');if(trigger)trigger.onclick=()=>showModal('loginModal');
  $('logout')?.addEventListener('click',()=>{if(state.saving){toast('正在保存商品，请稍后退出');return;}['hebao_token','hebao_logged_in','hebao_email'].forEach(k=>localStorage.removeItem(k));resetDraft();refreshLoginUI();loadMine();toast('已退出，当前浏览器草稿已清除');});
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
const draftFields=['listingTitle','sellerName','pickup','listingNote'];
let draftTimer,draftQueue=Promise.resolve(),draftRevision=0;
const draftSnapshot=()=>({version:1,photos:state.photos.map(item=>({...item})),fields:Object.fromEntries(draftFields.map(id=>[id,$(id).value])),editingId:state.editingId,editVersion:state.editVersion,publishedId:state.publishedId,dirty:state.dirty,owner:token()?localStorage.getItem('hebao_uuid'):null});
function renderDraftMode(){
  $('editBanner').hidden=!state.editingId;
  $('btnPublish').textContent=state.editingId?'保存修改 · 保持分享链接':'发布到 Delft 集市 · 需要登录';
}
function persistDraft(){
  clearTimeout(draftTimer);
  const snapshot=draftSnapshot(),revision=draftRevision;
  draftQueue=draftQueue.catch(()=>{}).then(()=>writeDraft(snapshot)).then(()=>{
    if(revision===draftRevision)$('draftStatus').textContent=state.dirty?'草稿已保存到此浏览器':'已保存 · 分享链接显示最新内容';
  }).catch(()=>{if(revision===draftRevision)$('draftStatus').textContent='此浏览器暂时无法保存草稿，请先完成发布';});
  return draftQueue;
}
function markDraftChanged(){
  state.dirty=true;draftRevision++;$('shareResult').hidden=true;
  renderListPreview();
  $('draftStatus').textContent=state.editingId?'有未保存的修改 · 正在保存浏览器草稿…':'正在保存浏览器草稿…';
  clearTimeout(draftTimer);draftTimer=setTimeout(persistDraft,350);
}
function resetDraft(){
  clearTimeout(draftTimer);draftRevision++;
  state.photos=[];state.editingId=null;state.editVersion=null;state.publishedId=null;state.dirty=false;
  $('listingTitle').value='Delft 毕业清仓';$('sellerName').value=nickname();$('pickup').value='';$('listingNote').value='';
  $('shareResult').hidden=true;$('draftStatus').textContent='草稿自动保存在此浏览器';renderItems();renderDraftMode();
  draftQueue=draftQueue.catch(()=>{}).then(deleteDraft).catch(()=>{$('draftStatus').textContent='草稿清除失败，请检查浏览器存储设置';});
}
$('newDraft').addEventListener('click',()=>{if(state.photos.length&& !confirm('新建会清除当前浏览器草稿。已发布的清仓页仍然保留，是否继续？'))return;resetDraft();});
window.addEventListener('pagehide',()=>{if(state.photos.length)persistDraft();});
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
  $('btnPublish').disabled=true;
  try{for(const file of files){const dataUrl=await asJpeg(file);state.photos.push({id:uuid(),name:'',price:'',condition:'',category:'其他',dataUrl,photo:'',status:'available'});}}
  catch(error){toast('部分图片读取失败：'+error.message);}finally{e.target.value='';renderItems();markDraftChanged();$('btnPublish').disabled=false;}
});
$('addManualItem').addEventListener('click',()=>{
  if(state.photos.length>=12){toast('最多12件商品');return;}
  state.photos.push({id:uuid(),name:'',price:'',condition:'',category:'其他',dataUrl:'',photo:'',status:'available'});renderItems();markDraftChanged();
});
function renderItems(){
  $('photoCount').textContent=state.photos.length?`已添加 ${state.photos.length} 件商品。请确认每件商品的名称、价格和成色。`:'';
  $('itemEditor').classList.toggle('empty-state',!state.photos.length);
  $('itemEditor').innerHTML=state.photos.length?state.photos.map((item,i)=>`<div class="item-card" data-id="${item.id}">
    ${item.dataUrl||item.photo?`<img class="item-thumb" src="${esc(item.dataUrl||item.photo)}" alt="商品 ${i+1}" />`:'<div class="item-thumb image-fallback">📦</div>'}
    <div class="item-fields"><div class="item-name-row"><input aria-label="商品名称" data-field="name" maxlength="70" placeholder="商品名称" value="${esc(item.name)}" /><button type="button" class="remove-btn" data-remove="${item.id}">删除</button></div>
    <div class="pair"><label>价格（€）<input type="number" min="0" max="10000" step="0.01" data-field="price" value="${esc(item.price)}" placeholder="待定" /></label><label>分类<select data-field="category" aria-label="商品分类">${itemCategories.map(c=>`<option ${c===item.category?'selected':''}>${c}</option>`).join('')}</select></label></div><label>成色或说明<input data-field="condition" maxlength="140" value="${esc(item.condition)}" placeholder="例如：八成新 / 自取" /></label><span class="hint">${statusNames[item.status]||'在售'} · 状态可在「我的」中更新</span></div></div>`).join(''):'先上传照片，或手动添加第一件商品。';
  renderListPreview();
}
function renderListPreview(){
  const items=state.photos;
  $('listPreview').innerHTML=`<div class="preview-cover"><span>${esc($('sellerName').value.trim()||'你的')}闲置清单</span><h3>${esc($('listingTitle').value.trim()||'Delft 闲置出清')}</h3><p>${esc($('pickup').value.trim()||'填写大致自取区域')}</p></div><div class="preview-items">${items.length?items.slice(0,4).map(item=>`<div class="preview-item">${item.dataUrl||item.photo?`<img src="${esc(item.dataUrl||item.photo)}" alt="" />`:'<span class="preview-placeholder" aria-hidden="true">＋</span>'}<span>${esc(item.name||'待填写商品名')}<small>${item.status==='available'?'在售':statusNames[item.status]||'在售'}</small></span><strong>${item.price===''||item.price==null?'待定':'€'+esc(Number(item.price))}</strong></div>`).join(''):'<div class="preview-empty">每一件闲置，<br>都值得一个新去处。</div>'}${items.length>4?`<p class="hint">还有 ${items.length-4} 件 · 海报会包含全部商品</p>`:''}</div><div class="preview-signature"><strong>荷包 · Delft</strong><span>闲置与周末，都在这里。</span></div>`;
}
$('itemEditor').addEventListener('input',e=>{const card=e.target.closest('[data-id]'),field=e.target.dataset.field;if(!card||!field)return;const item=state.photos.find(i=>i.id===card.dataset.id);if(item){item[field]=e.target.value;markDraftChanged();}});
$('itemEditor').addEventListener('click',e=>{const id=e.target.closest('[data-remove]')?.dataset.remove;if(!id)return;state.photos=state.photos.filter(i=>i.id!==id);markDraftChanged();renderItems();});
draftFields.forEach(id=>$(id).addEventListener('input',markDraftChanged));
$('btnAnalyze').addEventListener('click',async()=>{
  const photos=state.photos.filter(p=>p.dataUrl).slice(0,8);if(!photos.length){toast('请先添加至少一张照片');return;}
  const button=$('btnAnalyze');setBusy(button,true,'正在识别…');$('btnPublish').disabled=true;
  try{
    const resp=await fetch('/api/delft-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({photos:photos.map(x=>x.dataUrl.split(',')[1])})});
    const data=await resp.json();if(!resp.ok)throw new Error(data.error||'AI 暂时不可用');
    data.items?.forEach(result=>{const item=photos[result.index];if(!item)return;
      if(!item.name)item.name=result.name;
      if(!item.condition)item.condition=result.condition;});
    renderItems();markDraftChanged();toast('识别完成，请检查商品名称和成色');
  }catch(error){toast(error.message);}finally{setBusy(button,false);$('btnPublish').disabled=false;}
});
function validateDraft(){
  if(!state.photos.length)throw new Error('至少添加一件商品');
  if(state.photos.some(i=>!i.name.trim()))throw new Error('请给每件商品填写名称');
  if(state.photos.some(i=>i.price!==''&&(!Number.isFinite(Number(i.price))||Number(i.price)<0||Number(i.price)>10000)))throw new Error('商品价格须在0–10000欧元之间');
}
function listingCopy(){
  validateDraft();const title=$('listingTitle').value.trim()||'Delft 二手闲置';const pickup=$('pickup').value.trim()||'Delft（具体地点私聊）';
  const lines=[`📦 ${title}`,'',...state.photos.map(i=>`• ${i.name} ${i.price===''?'价格私聊':`€${Number(i.price)}`}${i.status!=='available'?`【${statusNames[i.status]}】`:''}${i.condition?`｜${i.condition}`:''}`),'',`📍 自取：${pickup}`];
  const note=$('listingNote').value.trim();if(note)lines.push(`💬 ${note}`);
  if(state.publishedId&&!state.dirty)lines.push('',`🔗 最新商品状态：${listingLink(state.publishedId)}`);
  lines.push(state.publishedId&&!state.dirty?'已售商品以链接内最新状态为准，欢迎私信交流。':'欢迎私信确认商品状态与自取时间。');return lines.join('\n');
}
$('btnCopy').addEventListener('click',async()=>{
  try{const text=listingCopy();await navigator.clipboard.writeText(text);toast('已复制微信群文案，打开微信粘贴即可');}
  catch(error){toast(error.message||'复制失败，请通过安全 HTTPS 页面访问');}
});
let posterUrl = '', posterFile;
$('btnPoster').addEventListener('click',async()=>{
  const button=$('btnPoster');
  try{
    validateDraft();setBusy(button,true,'海报生成中…');
    // Snapshot before awaiting images so edits cannot mix different revisions.
    const draft={title:$('listingTitle').value.trim(),pickup:$('pickup').value.trim(),seller:$('sellerName').value.trim(),items:state.photos.map(item=>({...item})),publishedId:state.publishedId,dirty:state.dirty};
    const {canvas,missingPhotos,destination}=await createPoster(draft);
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('图片生成失败，请重试')),'image/jpeg',0.92));
    if(posterUrl)URL.revokeObjectURL(posterUrl);posterUrl=URL.createObjectURL(blob);
    posterFile=new File([blob],'Delft-闲置分享海报.jpg',{type:'image/jpeg'});
    $('posterImage').src=posterUrl;$('downloadPoster').href=posterUrl;
    $('sharePoster').hidden=!navigator.canShare?.({files:[posterFile]});
    $('posterHint').textContent=(missingPhotos?`${missingPhotos} 张照片暂未载入，可关闭后重试。`:'下载后发到微信群；手机也可以长按图片保存。')+(destination.published?' 二维码通向这份清单的最新状态。':' 二维码通向荷包 Delft 首页。');
    showModal('posterModal');
  }catch(error){toast(error.message);}finally{setBusy(button,false);}
});
$('sharePoster').addEventListener('click',async()=>{
  if(!posterFile)return;
  try{await navigator.share({files:[posterFile],title:'荷包 · Delft 闲置清单'});}
  catch(error){if(error.name!=='AbortError')toast('暂时无法直接分享，请下载海报后发送');}
});
$('btnPublish').addEventListener('click',async()=>{
  if(state.saving)return;
  let controls=[];
  try{
    validateDraft();if(!requireAuth())return;
    const seller=$('sellerName').value.trim(),pickup=$('pickup').value.trim(),title=$('listingTitle').value.trim();
    if(!seller||!pickup||!title){toast('请填写昵称、清仓标题和自取位置');return;}
    const button=$('btnPublish');setBusy(button,true,'上传并发布中…');
    state.saving=true;controls=[...document.querySelectorAll('#panel-sell button,#panel-sell input,#panel-sell textarea,#panel-sell select')].map(el=>({el,disabled:el.disabled}));controls.forEach(({el})=>el.disabled=true);
    const items=[];
    for(const it of state.photos){
      let photo=it.photo||'';
      if(it.dataUrl&&!photo){
        const resp=await fetch('/api/delft-upload',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token()}`},body:JSON.stringify({imageBase64:it.dataUrl.split(',')[1]})});
        const data=await resp.json();if(!resp.ok)throw new Error(data.error||'图片上传失败');
        photo=data.url;it.photo=photo;
      }
      items.push({id:it.id,name:it.name,price:it.price,condition:it.condition,category:it.category,photo,status:it.status});
    }
    const published=await api(state.editingId?'updateListing':'createListing','POST',{seller,title,pickup,note:$('listingNote').value,items,...(state.editingId?{listingId:state.editingId,expectedUpdatedAt:state.editVersion}:{})});
    state.publishedId=published.id;state.editingId=published.id;state.editVersion=published.updatedAt;state.dirty=false;draftRevision++;await persistDraft();
    const link=listingLink(published.id);
    $('shareResult').hidden=false;$('shareResult').innerHTML=`✅ 已保存到集市！同一链接会持续显示最新商品状态：<br /><a href="${esc(link)}" target="_blank" rel="noopener">${esc(link)}</a>`;
    localStorage.setItem('delft_nickname',seller);toast('发布成功！现在可以复制带动态链接的群文案');
  }catch(error){toast(error.message);}finally{controls.forEach(({el,disabled})=>el.disabled=disabled);state.saving=false;setBusy($('btnPublish'),false);renderDraftMode();}
});

// ---- Marketplace ----
const listingLink=id=>new URL(`/delft/?item=${encodeURIComponent(id)}`,location.origin).href;
let marketRequest=0,searchTimer;
$('marketCategories').innerHTML=['',...itemCategories].map(category=>`<button type="button" class="category-chip ${category?'':'active'}" data-category="${category}" aria-pressed="${!category}">${category||'全部'}</button>`).join('');
$('marketCategories').addEventListener('click',e=>{
  const button=e.target.closest('[data-category]');if(!button)return;
  state.category=button.dataset.category;
  $('marketCategories').querySelectorAll('button').forEach(el=>{const active=el.dataset.category===state.category;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
  clearTimeout(searchTimer);loadListings();
});
async function loadListings(){
  const request=++marketRequest;$('marketSummary').textContent='正在查找最新在售商品…';$('marketGrid').setAttribute('aria-busy','true');
  try{const result=await api('listings','GET',null,false,{q:$('marketSearch').value.trim(),category:state.category});if(request!==marketRequest)return;state.listings=result.listings||[];renderMarket();}
  catch(error){if(request===marketRequest){$('marketSummary').textContent='加载失败，请点击刷新重试';$('marketGrid').innerHTML=`<div class="empty-state">${esc(error.message)}</div>`;}}
  finally{if(request===marketRequest)$('marketGrid').setAttribute('aria-busy','false');}
}
function listingSearchResults(){
  const term=$('marketSearch').value.trim().toLowerCase();
  return state.listings.filter(l=>!l.stale&&l.items.some(i=>i.status==='available')&&
    l.items.some(i=>i.status==='available'&&(!state.category||(i.category||'其他')===state.category)&&
    (!term || [l.title,l.pickup,i.name,i.condition].some(s=>String(s||'').toLowerCase().includes(term)))));
}
function renderMarket(){
  const items=listingSearchResults();const root=$('marketGrid');
  $('marketSummary').textContent=`${items.length===100?'最近 100':items.length} 个有效清仓页 · 仅展示 14 天内确认的在售商品`;
  root.innerHTML=items.length?items.map(l=>{
    const selling=l.items.filter(i=>i.status==='available'&&(!state.category||(i.category||'其他')===state.category));const cover=selling.find(i=>i.photo)?.photo;
    const min=Math.min(...selling.map(i=>i.price===null?Infinity:Number(i.price)));const price=Number.isFinite(min)?`€${min} 起`:'价格私聊';
    return `<article class="listing-card" role="button" tabindex="0" data-listing="${esc(l.id)}">${cover?`<img loading="lazy" class="listing-photo" src="${esc(cover)}" alt="商品照片" />`:'<div class="listing-photo image-fallback">📦</div>'}
    <div class="listing-details"><div class="listing-topline"><span class="pill">${selling.length} 件在售</span><span class="price">${esc(price)}</span></div><h3>${esc(l.title)}</h3><p class="listing-item-names">${esc(selling.slice(0,3).map(item=>item.name).join(' · '))}${selling.length>3?'…':''}</p><div class="listing-bottom"><span>${esc(l.pickup)}</span><span>${esc(l.seller)}</span></div></div></article>`;
  }).join(''):`<div class="empty-state action-empty"><span class="empty-symbol" aria-hidden="true">↗</span><h3>${state.category||$('marketSearch').value?'暂时没找到匹配的好物':'集市正在等第一份清单'}</h3><p>${state.category||$('marketSearch').value?'换个关键词，或看看其他分类。':'把闲置整理出来，让附近需要的人看见。'}</p>${state.category||$('marketSearch').value?'<button type="button" class="outline-btn" data-clear-market>查看全部商品</button>':'<button type="button" class="primary-btn" data-tab="sell">发布我的闲置</button>'}</div>`;
}
$('marketGrid').addEventListener('click',e=>{const card=e.target.closest('[data-listing]');if(card)openListing(card.dataset.listing);});
$('marketGrid').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-listing]')){e.preventDefault();openListing(e.target.dataset.listing);}});
$('marketSearch').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(loadListings,250);});
$('refreshMarket').addEventListener('click',loadListings);
async function openListing(id){
  // Sharing always reads the server, including sold/stale pages outside market results.
  let listing;
  try{listing=(await api('listing','GET',null,false,{id})).listing;}
  catch(error){toast(error.message);return;}
  state.currentListing=listing;
  $('detailContent').innerHTML=`<div class="eyebrow">Delft · 闲置</div><h2 id="detailHeading">${esc(listing.title)}</h2>
    <p>${esc(listing.seller)} · 自取：${esc(listing.pickup)}</p><p class="preserve-lines">${esc(listing.note)}</p><p class="hint">最近确认：${esc(dateText(listing.updatedAt))}</p>
    ${listing.stale?'<div class="safety-note">此商品信息超过14天未更新，请与卖家核实。</div>':''}
    ${listing.items.map(item=>`<div class="detail-item">${item.photo?`<img src="${esc(item.photo)}" alt="${esc(item.name)}" />`:'<div class="item-thumb image-fallback">📦</div>'}
      <div><h4>${esc(item.name)} · ${item.price==null?'价格私聊':`€${Number(item.price)}`}</h4><p class="preserve-lines">${esc(item.condition)}</p>${item.status==='available'?`<button type="button" class="text-btn" data-inquire="${esc(item.name)}">咨询这件商品</button>`:''}</div><span class="pill ${item.status==='sold'?'gray':''}">${statusNames[item.status]||'在售'}</span></div>`).join('')}`;
  $('inquiryText').value='';showModal('detailModal');
}
$('detailContent').addEventListener('click',e=>{const button=e.target.closest('[data-inquire]');if(!button)return;$('inquiryText').value=`你好，请问「${button.dataset.inquire}」还在吗？什么时候方便自取？`;$('inquiryText').focus();});
$('copyListingLink').addEventListener('click',async()=>{if(!state.currentListing)return;try{await navigator.clipboard.writeText(listingLink(state.currentListing.id));toast('清仓页链接已复制');}catch{toast('复制失败，请从地址栏复制链接');}});
$('refreshListingDetail').addEventListener('click',()=>{if(state.currentListing)openListing(state.currentListing.id);});
$('sendInquiry').addEventListener('click',async()=>{
  if(!state.currentListing||!requireAuth())return;
  const content=$('inquiryText').value.trim();if(!content){toast('请先输入咨询内容');return;}
  const button=$('sendInquiry');setBusy(button,true,'发送中…');
  try{await api('sendMessage','POST',{listingId:state.currentListing.id,content});toast('消息已发送，请在「我的」中查看回复');hideModal('detailModal');}
  catch(error){toast(error.message);}finally{setBusy(button,false);}
});

// ---- Events ----
const dateText = iso => new Intl.DateTimeFormat('zh-CN',{timeZone:'Europe/Amsterdam',month:'long',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
let cityPeriod='all',eventsRequest=0,eventDraftTouched=false;
function renderCityEvents(){
  const picks=upcomingCityEvents(cityEvents,cityPeriod);
  $('cityCheckedNote').textContent=`${CITY_EVENTS_CHECKED.replaceAll('-',' / ')} 核对 · 按时间排序`;
  $('cityEvents').innerHTML=picks.length?picks.map((ev,i)=>{
    const local=amsterdamInput(ev.startsAt),month=Number(local.slice(5,7)),day=local.slice(8,10);
    const motif={音乐:'LIVE MUSIC',舞台:'ON STAGE',户外:'INTO THE WOODS',节日:'CITY LIGHTS'}[ev.category];
    return `<article class="city-card ${i===0&&picks.length>2?'featured':''}"><div class="city-cover ${ev.tone}" aria-hidden="true"><div class="date-stamp"><span>${month} 月</span><strong>${day}</strong></div><span class="cover-word">${motif}</span><span class="cover-category">${ev.category}</span></div><div class="city-content"><div class="city-date">${esc(dateText(ev.startsAt))}${ev.endsAt?' – '+amsterdamInput(ev.endsAt).slice(11):''}</div><h4>${esc(ev.title)}</h4><p class="city-original">${esc(ev.originalTitle)}</p><p class="city-description">${esc(ev.description)}</p><div class="city-facts"><span>${esc(ev.place)}</span><strong>${esc(ev.price)}</strong></div><div class="city-actions"><a href="${esc(ev.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="outline-btn">详情与票务 ↗</a><button class="text-btn" type="button" data-city-meetup="${ev.id}">约人一起去 ＋</button></div><p class="city-source">来源：<a href="${esc(ev.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(ev.sourceName)}</a> · ${ev.checkedOn.slice(5).replace('-','/')} 核对</p></div></article>`;
  }).join(''):`<div class="empty-state action-empty"><h3>${cityPeriod==='all'?'新一轮活动正在整理中':'这个时间段还没有新的精选活动'}</h3><p>也可以浏览 Delft 官方日历，或发起自己的小聚。</p><a class="outline-btn" href="${CITY_AGENDA_URL}" target="_blank" rel="noopener noreferrer">浏览官方活动日历 ↗</a></div>`;
}
$('cityEventFilters').addEventListener('click',e=>{
  const button=e.target.closest('[data-period]');if(!button)return;cityPeriod=button.dataset.period;
  $('cityEventFilters').querySelectorAll('button').forEach(el=>{const selected=el===button;el.classList.toggle('active',selected);el.setAttribute('aria-pressed',String(selected));});
  renderCityEvents();
});
$('cityEvents').addEventListener('click',e=>{
  const id=e.target.closest('[data-city-meetup]')?.dataset.cityMeetup;
  const event=cityEvents.find(event=>event.id===id);
  if(event){if(Date.parse(event.startsAt)<=Date.now()){renderCityEvents();toast('这场活动已经开始，看看其他活动吧');return;}openEventForm(event);}
});
function openEventForm(event){
  if(event&&eventDraftTouched&&!confirm('用这场活动替换正在填写的组局草稿？'))return;
  const form=$('createEventForm');
  if(event){
    const draft=cityEventDraft(event);form.reset();
    Object.entries(draft).forEach(([key,value])=>form.elements[key].value=value);
    $('sourceEventNote').hidden=false;
    $('sourceEventNote').innerHTML=`已带入「${esc(event.title)}」。可以调整集合时间与地点；报名只用于约同行，门票需各自办理。 <a href="${esc(event.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看主办方安排 ↗</a>`;
    eventDraftTouched=true;
  }
  $('hostName').value=$('hostName').value||nickname();$('createEventBox').hidden=false;
  $('createEventBox').scrollIntoView({behavior:'smooth',block:'start'});form.elements.title.focus({preventScroll:true});
}
async function loadEvents(){
  const request=++eventsRequest;$('eventsList').setAttribute('aria-busy','true');
  try{const result=await api('events');if(request!==eventsRequest)return;state.events=result.events||[];renderEvents();}
  catch(error){if(request===eventsRequest)$('eventsList').innerHTML=`<div class="empty-state"><p>社区组局暂时未能加载，Delft 活动精选仍可浏览。</p><button type="button" class="outline-btn" data-retry-events>重新加载组局</button></div>`;}
  finally{if(request===eventsRequest)$('eventsList').setAttribute('aria-busy','false');}
}
function renderEvents(){
  $('eventsList').innerHTML=state.events.length?state.events.map(ev=>`<article class="event-card"><div class="event-top"><span class="pill">${esc(ev.category)}</span><span class="pill ${ev.count>=ev.capacity?'gray':''}">${ev.count}/${ev.capacity} 人</span></div>
    <h3>${esc(ev.title)}</h3><p class="preserve-lines">${esc(ev.description)||'轻松认识新朋友，一起度过周末。'}</p><div class="event-meta"><span>🗓️ ${esc(dateText(ev.startsAt))}</span><span>📍 ${esc(ev.place)}</span><span>🙋 ${esc(ev.host)} 发起</span></div>
    <div class="event-footer"><button type="button" class="text-btn" data-share-event="${esc(ev.id)}">复制分享链接</button><button type="button" class="${ev.joined?'outline-btn':'primary-btn'}" data-event="${esc(ev.id)}" ${ev.hostIsMe||(!ev.joined&&ev.count>=ev.capacity)?'disabled':''}>${ev.hostIsMe?'我发起的':ev.joined?'取消报名':ev.count>=ev.capacity?'已满员':'报名参加'}</button></div>${ev.hostIsMe?`<div class="event-footer"><button class="text-btn" type="button" data-attendees="${esc(ev.id)}">查看报名昵称</button><button class="text-btn" type="button" data-cancel-event="${esc(ev.id)}">取消活动</button></div>`:''}</article>`).join(''):'<div class="empty-state action-empty"><span class="empty-symbol" aria-hidden="true">＋</span><h3>下一场小聚，由你发起。</h3><p>找两三个人喝杯咖啡，或者一起去看场演出。</p><button type="button" class="outline-btn" data-create-event>发起第一场组局</button></div>';
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
$('openCreateEvent').addEventListener('click',()=>openEventForm());
$('refreshEvents').addEventListener('click',loadEvents);
$('createEventForm').addEventListener('input',()=>eventDraftTouched=true);
$('closeCreateEvent').addEventListener('click',()=>$('createEventBox').hidden=true);
$('createEventForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!requireAuth())return;
  const form=e.target,values=Object.fromEntries(new FormData(form));
  let startsAt;try{startsAt=amsterdamInstant(values.startsAt);}catch(error){toast(error.message);return;}
  const button=form.querySelector('[type=submit]');setBusy(button,true,'发布中…');
  try{await api('createEvent','POST',{title:values.title,host:values.host,category:values.category,startsAt:startsAt.toISOString(),capacity:Number(values.capacity),place:values.place,description:values.description});
    localStorage.setItem('delft_nickname',values.host);$('createEventBox').hidden=true;form.reset();eventDraftTouched=false;$('sourceEventNote').hidden=true;toast('活动发布成功！可邀请朋友来报名');loadEvents();}
  catch(error){toast(error.message);}finally{setBusy(button,false);}
});

// ---- My inventory + buyer/seller messages ----
async function loadMine(){
  refreshLoginUI();if(!token()){state.myListings=[];$('myListings').innerHTML='';$('myMessages').innerHTML='';return;}
  const session=token();
  try{
    const [mine,inbox]=await Promise.all([api('mine'),api('messages')]);
    if(session!==token())return;
    state.myListings=mine.listings;
    $('myListings').innerHTML=mine.listings.length?`<h2>我的清仓页</h2>`+mine.listings.map(l=>`<div class="my-listing"><h3>${esc(l.title)} <small class="hint">${esc(l.pickup)}</small></h3>
      ${l.items.map(item=>`<div class="my-item"><span>${esc(item.name)}</span><select data-listing-id="${esc(l.id)}" data-item-id="${esc(item.id)}" aria-label="更新商品状态">${Object.entries(statusNames).map(([value,label])=>`<option value="${value}" ${item.status===value?'selected':''}>${label}</option>`).join('')}</select></div>`).join('')}
      <div class="inventory-meta"><span>${l.stale?'超过 14 天未确认，暂不展示在集市':'最近确认：'+esc(dateText(l.updatedAt))}</span></div><div class="inventory-actions"><button class="outline-btn" type="button" data-edit-listing="${esc(l.id)}">编辑清仓页</button><button class="outline-btn" type="button" data-refresh-listing="${esc(l.id)}">确认仍在售</button><a href="/delft/?item=${encodeURIComponent(l.id)}">查看分享页</a><button class="text-btn danger" type="button" data-delete-listing="${esc(l.id)}">删除</button></div></div>`).join(''):'<div class="empty-state">还没有发布过清仓页。</div>';
    const threads=new Map();for(const m of inbox.messages){const key=`${m.listingId}|${m.otherId}`;if(!threads.has(key))threads.set(key,[]);threads.get(key).push(m);}
    $('myMessages').innerHTML=`<h2>我的私信</h2>`+(threads.size?[...threads.values()].map(thread=>{
      const latest=thread[0];return `<div class="thread" data-thread-listing="${esc(latest.listingId)}" data-thread-user="${esc(latest.otherId)}"><h3>${esc(latest.listingTitle)}</h3>
      ${thread.reverse().map(m=>`<div class="message-bubble ${m.fromMe?'mine':''}"><strong>${m.fromMe?'我':'对方'}</strong> · ${esc(new Date(m.createdAt).toLocaleString('zh-CN'))}<div>${esc(m.content)}</div></div>`).join('')}
      <form class="message-reply"><input name="message" maxlength="500" required placeholder="回复消息…" /><button type="submit" class="outline-btn">发送</button></form></div>`;
    }).join(''):'<div class="empty-state">暂无消息。买卖双方的咨询记录会出现在这里。</div>');
  }catch(error){if(session!==token()&&!error.status)return;
    if(error.status===401){refreshLoginUI();$('myMessages').innerHTML='';}
    else if(session!==token())return;
    $('myListings').innerHTML=`<div class="empty-state">${esc(error.message)}</div>`;}
}
$('myListings').addEventListener('click',async e=>{
  const edit=e.target.closest('[data-edit-listing]');
  if(edit){
    if(state.photos.length&&state.dirty&&!confirm('打开其他清仓页将替换当前浏览器草稿，是否继续？'))return;
    try{
      const listing=(await api('listing','GET',null,true,{id:edit.dataset.editListing})).listing;
      state.photos=listing.items.map(item=>({...item,price:item.price==null?'':item.price,dataUrl:''}));
      state.editingId=listing.id;state.editVersion=listing.updatedAt;state.publishedId=listing.id;state.dirty=false;draftRevision++;
      $('listingTitle').value=listing.title;$('sellerName').value=listing.seller;$('pickup').value=listing.pickup;$('listingNote').value=listing.note;
      $('shareResult').hidden=true;renderItems();renderDraftMode();persistDraft();tab('sell');toast('已载入清仓页，修改后点击保存');
    }catch(error){toast(error.message);}return;
  }
  const refresh=e.target.closest('[data-refresh-listing]');
  if(refresh){setBusy(refresh,true,'确认中…');try{await api('refreshListing','POST',{listingId:refresh.dataset.refreshListing});toast('已确认最新库存，可继续在集市展示');loadMine();}catch(error){toast(error.message);}finally{setBusy(refresh,false);}return;}
  const id=e.target.closest('[data-delete-listing]')?.dataset.deleteListing;
  if(!id||!confirm('确认永久删除这个清仓页及相关私信？'))return;
  try{await api('deleteListing','POST',{listingId:id});if(state.editingId===id)resetDraft();toast('清仓页已删除');loadMine();}
  catch(error){toast(error.message);}
});
$('myListings').addEventListener('change',async e=>{
  const select=e.target.closest('[data-item-id]');if(!select)return;
  select.disabled=true;
  try{
    const result=await api('updateStatus','POST',{listingId:select.dataset.listingId,itemId:select.dataset.itemId,status:select.value});
    if(state.editingId===select.dataset.listingId&&!state.dirty){const item=state.photos.find(item=>item.id===select.dataset.itemId);if(item)item.status=select.value;state.editVersion=result.updatedAt;draftRevision++;renderItems();persistDraft();}
    toast('商品状态已更新');await loadMine();
  }
  catch(error){toast(error.message);loadMine();}finally{select.disabled=false;}
});
$('refreshMine').addEventListener('click',loadMine);
$('myMessages').addEventListener('submit',async e=>{
  const form=e.target.closest('.message-reply');if(!form)return;e.preventDefault();
  const thread=form.closest('[data-thread-listing]');const content=form.elements.message.value.trim();if(!content)return;
  const button=form.querySelector('[type=submit]');setBusy(button,true,'发送中…');
  try{await api('sendMessage','POST',{listingId:thread.dataset.threadListing,receiverId:thread.dataset.threadUser,content});toast('消息已发送');loadMine();}
  catch(error){toast(error.message);}finally{setBusy(button,false);}
});

// ---- Startup ----
async function restoreDraft(){
  const revision=draftRevision;
  try{
    const saved=await readDraft();if(revision!==draftRevision)return;
    if(!saved||saved.version!==1||!Array.isArray(saved.photos)){$('sellerName').value=nickname();renderListPreview();return;}
    if(saved.owner&&saved.owner!==localStorage.getItem('hebao_uuid')){resetDraft();return;}
    state.photos=saved.photos.slice(0,12);state.editingId=saved.editingId||null;state.editVersion=saved.editVersion||null;state.publishedId=saved.publishedId||null;state.dirty=Boolean(saved.dirty);
    draftFields.forEach(id=>{if(typeof saved.fields?.[id]==='string')$(id).value=saved.fields[id];});renderItems();renderDraftMode();
    $('draftStatus').textContent=state.dirty?'已恢复上次草稿 · 修改尚未发布':'已恢复上次清仓页';
  }catch{$('draftStatus').textContent='浏览器草稿暂不可用，仍可正常发布';}
}
refreshLoginUI();renderListPreview();restoreDraft();
const query=new URLSearchParams(location.search),itemQuery=query.get('item'),eventQuery=query.get('event');
const initialTab=itemQuery?'market':eventQuery?'events':query.get('tab')||'sell';
tab(initialTab,{updateUrl:false}).then(()=>{
  if(itemQuery)openListing(itemQuery);
  if(eventQuery&&!itemQuery){const card=$('eventsList').querySelector(`[data-event="${CSS.escape(eventQuery)}"]`);card?.closest('.event-card')?.scrollIntoView({behavior:'smooth',block:'center'});}
});
// Re-evaluate dates when a visitor returns to an open tab, including after midnight.
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&state.activeTab==='events')renderCityEvents();});
