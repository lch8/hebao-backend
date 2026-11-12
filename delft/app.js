// Delft pilot: no frontend framework, no third-party analytics, no automatic WeChat group posting.
import {readDraft,writeDraft,deleteDraft} from './draft-store.js';
import {createPoster,createEventPoster} from './poster.js';
import {marketProducts, itemPrice} from './market-view.js';
import {cities,cityEvents, CITY_EVENTS_CHECKED, CITY_AGENDA_URL, upcomingCityEvents, amsterdamInput, amsterdamInstant, cityEventDraft} from './city-events.js';
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state = {photos:[],listings:[],myListings:[],events:[],currentListing:null,currentEvent:null,publishedId:null,editingId:null,editVersion:null,dirty:false,activeTab:null,category:'',saving:false};
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
let resumeAfterLogin=null;
function requireAuth(resume){if(token())return true;resumeAfterLogin=resume||null;showModal('loginModal');return false;}
const modalFocus=new Map();
let modalLayer=1000;
function showModal(id){modalFocus.set(id,document.activeElement);$(id).hidden=false;$(id).style.zIndex=++modalLayer;document.body.style.overflow='hidden';$(id).querySelector('input,textarea,button')?.focus();}
function hideModal(id,{updateUrl=true}={}){
  $(id).hidden=true;document.body.style.overflow=document.querySelector('.overlay:not([hidden])')?'hidden':'';modalFocus.get(id)?.focus();
  if(id==='loginModal')resumeAfterLogin=null;
  if(id==='detailModal'&&updateUrl&&new URL(location.href).searchParams.has('item')){
    if(history.state?.listingModal)history.back();
    else{const url=new URL(location.href);url.searchParams.delete('item');url.searchParams.delete('product');history.replaceState(null,'',url);}
  }
}
async function tab(name,{updateUrl=true}={}){
  if(!['sell','market','events','mine'].includes(name))return;
  state.activeTab=name;
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
  document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===name)));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===`panel-${name}`));
  if(updateUrl){const url=new URL(location.href);url.searchParams.delete('item');url.searchParams.delete('event');url.searchParams.delete('product');url.searchParams.set('tab',name);if(url.href!==location.href)history.pushState(null,'',url);}
  window.scrollTo({top:0,behavior:'smooth'});
  if(name==='market')await loadListings();if(name==='events'){renderCityEvents();await Promise.all([loadEvents(),loadCityFeed()]);}if(name==='mine')await loadMine();
}
document.addEventListener('click',e=>{
  const nav=e.target.closest('[data-tab]');if(nav)tab(nav.dataset.tab);
  const close=e.target.closest('[data-close]');if(close)hideModal(close.dataset.close);
  if(e.target.closest('[data-create-event]'))openEventForm();
  if(e.target.closest('[data-retry-events]'))loadEvents();
  if(e.target.closest('[data-retry-market]'))loadListings();
  if(e.target.closest('[data-clear-market]')){$('marketSearch').value='';$('marketCategories').querySelector('[data-category=""]').click();}
  if(e.target.classList.contains('overlay'))hideModal(e.target.id);
});
document.addEventListener('keydown',e=>{
  const top=[...document.querySelectorAll('.overlay:not([hidden])')].sort((a,b)=>Number(b.style.zIndex)-Number(a.style.zIndex))[0];
  if(!top)return;
  if(e.key==='Escape'){hideModal(top.id);return;}
  if(e.key==='Tab'){
    const items=[...top.querySelectorAll('button,input,textarea,select,a[href],summary')].filter(el=>!el.disabled&&el.getClientRects().length);
    const first=items[0],last=items.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  }
});

// ---- User sign-in (compatible with existing email OTP and JWT). ----
function refreshLoginUI(){
  $('loginTrigger').textContent=token()?'我的账号':'登录';
  const profile=$('profileArea');
  profile.classList.toggle('signed-in',Boolean(token()));
  $('mineSwitch').hidden=!token();$('refreshMine').hidden=!token();
  if(token())profile.innerHTML=`<p>${esc(nickname()||'你好')} <span class="hint">· 消息请在「私信」中查看</span></p><button id="logout" class="text-btn" type="button">退出登录</button>`;
  else profile.innerHTML=`<h2>把自己的事，放在一处</h2><p>登录后管理闲置、查看报名和回复消息。</p><button id="mineLogin" class="primary-btn" type="button">登录</button>`;
  const trigger=$('mineLogin');if(trigger)trigger.onclick=openLogin;
  $('logout')?.addEventListener('click',()=>{if(state.saving){toast('正在保存商品，请稍后退出');return;}['hebao_token','hebao_logged_in','hebao_email'].forEach(k=>localStorage.removeItem(k));resetDraft();refreshLoginUI();loadMine();toast('已退出，当前浏览器草稿已清除');});
}
function openLogin(){resumeAfterLogin=null;showModal('loginModal');$('authEmail').focus();}
$('loginTrigger').addEventListener('click',()=>token()?tab('mine'):openLogin());
let codeCountdown;
$('sendCode').addEventListener('click',async()=>{
  const email=$('authEmail').value.trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){toast('请输入正确的邮箱地址');return;}
  const button=$('sendCode');setBusy(button,true,'发送中…');let sent=false;
  try{
    const r=await fetch('/api/send-auth-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
    const data=await r.json();if(!r.ok || !data.success)throw new Error(data.error||'发送失败');
    sent=true;$('authStatus').textContent='验证码已发送，请检查收件箱或垃圾邮件。';$('authCode').focus();
  }catch(error){$('authStatus').textContent=error.message;}finally{setBusy(button,false);}
  if(sent){let seconds=60;button.disabled=true;button.textContent=`${seconds} 秒后重发`;clearInterval(codeCountdown);codeCountdown=setInterval(()=>{seconds--;button.textContent=seconds?`${seconds} 秒后重发`:'重新发送';button.disabled=seconds>0;if(!seconds)clearInterval(codeCountdown);},1000);}
});
$('loginForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const email=$('authEmail').value.trim(),code=$('authCode').value.trim();
  if(!email||!/^[0-9]{6}$/.test(code)){toast('请填写邮箱和6位数字验证码');return;}
  const button=$('verifyCode');setBusy(button,true,'验证中…');
  try{
    let userId=localStorage.getItem('hebao_uuid');if(!userId){userId=uuid();localStorage.setItem('hebao_uuid',userId);}
    const r=await fetch('/api/verify-auth-code',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,code,userId})});
    const data=await r.json();if(!r.ok||!data.success)throw new Error(data.error||'验证失败');
    localStorage.setItem('hebao_token',data.token);localStorage.setItem('hebao_logged_in','true');
    localStorage.setItem('hebao_uuid',data.userId);localStorage.setItem('hebao_email',email);
    const resume=resumeAfterLogin;refreshLoginUI();hideModal('loginModal');toast('已登录');
    if(state.activeTab==='mine')loadMine();if(state.activeTab==='events')loadEvents();
    resume?.();
  }catch(error){$('authStatus').textContent=error.message;}finally{setBusy(button,false);}
});

// ---- Image compression and listing draft ----
const draftFields=['listingTitle','sellerName','pickup','listingNote'];
let draftTimer,draftQueue=Promise.resolve(),draftRevision=0;
const draftSnapshot=()=>({version:1,photos:state.photos.map(item=>({...item})),fields:Object.fromEntries(draftFields.map(id=>[id,$(id).value])),editingId:state.editingId,editVersion:state.editVersion,publishedId:state.publishedId,dirty:state.dirty,owner:token()?localStorage.getItem('hebao_uuid'):null});
function renderDraftMode(){
  $('editBanner').hidden=!state.editingId;
  $('btnPublish').textContent=state.editingId?'保存到集市':'发布到集市';
}
function persistDraft(){
  clearTimeout(draftTimer);
  const snapshot=draftSnapshot(),revision=draftRevision;
  draftQueue=draftQueue.catch(()=>{}).then(()=>writeDraft(snapshot)).then(()=>{
    if(revision===draftRevision)$('draftStatus').textContent=state.dirty?'草稿已保存':'已保存到集市';
  }).catch(()=>{if(revision===draftRevision)$('draftStatus').textContent='此浏览器暂时无法保存草稿，请先完成发布';});
  return draftQueue;
}
function markDraftChanged(){
  state.dirty=true;draftRevision++;$('shareResult').hidden=true;
  renderListPreview();
  $('draftStatus').textContent='保存中…';
  $('sellValidation').hidden=true;
  clearTimeout(draftTimer);draftTimer=setTimeout(persistDraft,350);
}
function resetDraft(){
  clearTimeout(draftTimer);draftRevision++;
  state.photos=[];state.editingId=null;state.editVersion=null;state.publishedId=null;state.dirty=false;
  $('listingTitle').value='我的闲置清单';$('sellerName').value=nickname();$('pickup').value='';$('listingNote').value='';
  $('shareResult').hidden=true;$('draftStatus').textContent='草稿自动保存';renderItems();renderDraftMode();setSellStep(1);
  draftQueue=draftQueue.catch(()=>{}).then(deleteDraft).catch(()=>{$('draftStatus').textContent='草稿清除失败，请检查浏览器存储设置';});
}
$('newDraft').addEventListener('click',()=>{if(state.photos.length&& !confirm('新建会清除当前浏览器草稿。已发布的清仓页仍然保留，是否继续？'))return;resetDraft();});
let sellStep=1;
function setSellStep(step){
  if(step===2){try{validateDraft();}catch(error){$('sellValidation').textContent=error.message;$('sellValidation').hidden=false;$('itemEditor').querySelector('[aria-invalid=true]')?.focus();return;}}
  sellStep=step;$('sellItemsPanel').hidden=step!==1;$('sellSharePanel').hidden=step!==2;
  for(const [id,active] of [['sellItemsStep',step===1],['sellShareStep',step===2]]){$(id).classList.toggle('active',active);$(id).setAttribute('aria-pressed',String(active));}
  $('sellValidation').hidden=true;if(step===2)$('listingTitle').focus({preventScroll:true});
}
$('sellItemsStep').addEventListener('click',()=>setSellStep(1));
$('sellShareStep').addEventListener('click',()=>setSellStep(2));
$('sellNext').addEventListener('click',()=>{setSellStep(2);if(sellStep===2)$('panel-sell').scrollIntoView({behavior:'smooth',block:'start'});});
$('sellBack').addEventListener('click',()=>setSellStep(1));
$('choosePhotos').addEventListener('click',()=>$('photoInput').click());
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
  const count=state.photos.length;
  $('photoCount').textContent=`${count} / 12 件`;$('photoTools').hidden=!count;
  $('sellNext').disabled=!count;$('sellShareStep').disabled=!count;
  $('uploadLabel').textContent=count?'继续添加照片':'添加商品照片';
  document.querySelector('.upload-card').classList.toggle('has-items',Boolean(count));
  $('itemEditor').innerHTML=state.photos.map((item,i)=>`<div class="item-card" data-id="${esc(item.id)}">
    ${item.dataUrl||item.photo?`<img class="item-thumb" src="${esc(item.dataUrl||item.photo)}" alt="商品 ${i+1}" />`:'<div class="item-thumb image-fallback" aria-hidden="true">＋</div>'}
    <div class="item-fields"><div class="item-main-fields"><label>商品名称<input aria-label="第 ${i+1} 件商品名称" data-field="name" maxlength="70" placeholder="这是什么？" value="${esc(item.name)}" /></label><label>价格 €<input aria-label="第 ${i+1} 件商品价格" type="number" min="0" max="10000" step="0.01" data-field="price" value="${esc(item.price)}" placeholder="待议" /></label><button type="button" class="remove-btn" data-remove="${esc(item.id)}" aria-label="删除第 ${i+1} 件商品" title="删除商品">×</button></div>
    <details class="item-more"><summary>分类与成色<span>${esc(item.category||'其他')}${item.condition?' · 已填写成色':''}</span>${item.status!=='available'?` <span class="pill gray">${statusNames[item.status]||''}</span>`:''}</summary><div class="field-grid"><label>分类<select data-field="category" aria-label="第 ${i+1} 件商品分类">${itemCategories.map(c=>`<option ${c===item.category?'selected':''}>${c}</option>`).join('')}</select></label><label>成色或说明<input data-field="condition" aria-label="第 ${i+1} 件商品成色" maxlength="140" value="${esc(item.condition)}" placeholder="例如：八成新" /></label></div></details></div></div>`).join('');
  renderListPreview();
}
function renderListPreview(){
  const items=state.photos;
  $('listPreview').innerHTML=`<div class="preview-cover"><span>${esc($('sellerName').value.trim()||'我的')} · Delft</span><h3>${esc($('listingTitle').value.trim()||'Delft 闲置出清')}</h3><p>${esc($('pickup').value.trim()||'自取区域待填写')}</p></div><div class="preview-items">${items.length?items.slice(0,4).map(item=>`<div class="preview-item">${item.dataUrl||item.photo?`<img src="${esc(item.dataUrl||item.photo)}" alt="" />`:'<span class="preview-placeholder" aria-hidden="true">＋</span>'}<span>${esc(item.name||'待填写商品名')}<small>${item.status==='available'?'在售':statusNames[item.status]||'在售'}</small></span><strong>${item.price===''||item.price==null?'待定':'€'+esc(Number(item.price))}</strong></div>`).join(''):'<div class="preview-empty"><svg viewBox="0 0 80 80" aria-hidden="true"><path d="m15 22 25-12 25 12v35L40 70 15 57Z M15 22l25 13 25-13 M40 35v35 M28 16l25 13v15"/></svg>添加商品后，这里显示你的清单</div>'}${items.length>4?`<p class="hint">还有 ${items.length-4} 件 · 海报会包含全部商品</p>`:''}</div><div class="preview-signature"><strong>荷包 · Delft</strong><span>附近的闲置与周末</span></div>`;
}
$('itemEditor').addEventListener('input',e=>{const card=e.target.closest('[data-id]'),field=e.target.dataset.field;if(!card||!field)return;const item=state.photos.find(i=>i.id===card.dataset.id);if(item){item[field]=e.target.value;e.target.removeAttribute('aria-invalid');markDraftChanged();}});
$('itemEditor').addEventListener('click',e=>{const id=e.target.closest('[data-remove]')?.dataset.remove;if(!id)return;state.photos=state.photos.filter(i=>i.id!==id);markDraftChanged();renderItems();});
draftFields.forEach(id=>$(id).addEventListener('input',e=>{e.target.removeAttribute('aria-invalid');markDraftChanged();}));
$('btnAnalyze').addEventListener('click',async()=>{
  const photos=state.photos.filter(p=>p.dataUrl&&!p.name.trim());if(!photos.length){toast('添加照片后，可以补全尚未填写的商品名');return;}
  const button=$('btnAnalyze');setBusy(button,true,'识别中…');$('btnPublish').disabled=true;
  try{
    // Process every uploaded item, in the backend's batches of at most eight.
    for(let start=0;start<photos.length;start+=8){
      const batch=photos.slice(start,start+8);
      const resp=await fetch('/api/delft-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({photos:batch.map(x=>x.dataUrl.split(',')[1])})});
      const data=await resp.json();if(!resp.ok)throw new Error(data.error||'识别暂时不可用，可继续手动填写');
      data.items?.forEach(result=>{const item=batch[result.index];if(!item)return;if(!item.name.trim())item.name=result.name;if(!item.condition)item.condition=result.condition;});
    }
    toast('已补全，请确认名称和成色');
  }catch(error){toast(error.message);}finally{renderItems();markDraftChanged();setBusy(button,false);$('btnPublish').disabled=false;}
});
function validateDraft(){
  if(!state.photos.length)throw new Error('先添加至少一件商品');
  let firstError='';
  for(const [index,item] of state.photos.entries()){
    const card=$('itemEditor').querySelector(`[data-id="${CSS.escape(item.id)}"]`);
    const missing=!item.name.trim(),invalid=item.price!==''&&item.price!==null&&(!Number.isFinite(Number(item.price))||Number(item.price)<0||Number(item.price)>10000);
    card?.querySelector('[data-field="name"]')?.setAttribute('aria-invalid',String(missing));
    card?.querySelector('[data-field="price"]')?.setAttribute('aria-invalid',String(invalid));
    if(!firstError&&missing)firstError=`第 ${index+1} 件商品还没有名称`;
    if(!firstError&&invalid)firstError=`第 ${index+1} 件商品的价格须在 €0–10,000 之间`;
  }
  if(firstError)throw new Error(firstError);
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
  const button=$('btnPoster');$('eventShareText').hidden=true;$('copyEventShare').hidden=true;$('downloadPoster').download='Delft-闲置分享海报.jpg';$('posterImage').alt='闲置分享海报';
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
  try{await navigator.share({files:[posterFile],title:'荷包 · 分享邀请'});}
  catch(error){if(error.name!=='AbortError')toast('暂时无法直接分享，请下载海报后发送');}
});
$('btnPublish').addEventListener('click',async()=>{
  if(state.saving)return;
  let controls=[];
  try{
    validateDraft();
    const seller=$('sellerName').value.trim(),pickup=$('pickup').value.trim(),title=$('listingTitle').value.trim();
    if(!seller||!pickup||!title){const missing=!title?'listingTitle':!seller?'sellerName':'pickup';$(missing).setAttribute('aria-invalid','true');$(missing).focus();toast('发布到集市前，请填写标题、昵称和自取区域');return;}
    if(!requireAuth(()=>$('btnPublish').click()))return;
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
    $('shareResult').hidden=false;$('shareResult').innerHTML=`已发布到集市，二维码将链接到这份清单。<a href="${esc(link)}" target="_blank" rel="noopener">打开分享清单 ↗</a>`;
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
  const request=++marketRequest;$('marketSummary').textContent='正在更新…';$('marketGrid').setAttribute('aria-busy','true');
  try{const result=await api('listings','GET',null,false,{q:$('marketSearch').value.trim(),category:state.category});if(request!==marketRequest)return;state.listings=result.listings||[];renderMarket();}
  catch(error){if(request===marketRequest){$('marketSummary').textContent='商品加载失败';$('marketGrid').innerHTML='<div class="empty-state error-state"><h2>暂时没能加载商品</h2><p>请检查网络，然后重试。</p><button type="button" class="outline-btn" data-retry-market>重新加载</button></div>';}}
  finally{if(request===marketRequest)$('marketGrid').setAttribute('aria-busy','false');}
}
const priceLabel=item=>{const price=itemPrice(item);return price===null?'价格待议':price===0?'免费':`€${price}`;};
function renderMarket(){
  const products=marketProducts(state.listings,{query:$('marketSearch').value,category:state.category,sort:$('marketSort').value});
  const root=$('marketGrid');
  $('marketSummary').textContent=`${products.length} 件在售闲置`;
  root.innerHTML=products.length?products.map(({listing:l,item})=>`<article class="listing-card" role="button" tabindex="0" data-listing="${esc(l.id)}" data-product="${esc(item.id)}" aria-label="${esc(item.name)}，${esc(priceLabel(item))}，${esc(l.pickup)}">
    ${item.photo?`<img loading="lazy" class="listing-photo" src="${esc(item.photo)}" alt="${esc(item.name)}" />`:'<div class="listing-photo image-fallback" aria-hidden="true"><svg viewBox="0 0 80 80"><path d="m15 22 25-12 25 12v35L40 70 15 57Z M15 22l25 13 25-13 M40 35v35 M28 16l25 13v15"/></svg></div>'}
    <div class="listing-details"><div class="product-price">${esc(priceLabel(item))}</div><h2>${esc(item.name)}</h2><p class="product-condition">${esc(item.condition||item.category||'其他')}</p><div class="listing-bottom"><span>${esc(l.pickup)}</span><span>${esc(l.seller)}</span></div></div></article>`
  ).join(''):`<div class="empty-state"><h2>${state.category||$('marketSearch').value?'没有找到匹配的闲置':'附近的闲置，还在陆续上架'}</h2><p>${state.category||$('marketSearch').value?'换个关键词，或看看其他分类。':'你可以先发一份清单，或去看看近期活动。'}</p>${state.category||$('marketSearch').value?'<button type="button" class="outline-btn" data-clear-market>清除筛选</button>':'<button type="button" class="primary-btn" data-tab="sell">发布闲置</button>'}</div>`;
}
$('marketGrid').addEventListener('click',e=>{const card=e.target.closest('[data-listing]');if(card)openListing(card.dataset.listing,{itemId:card.dataset.product});});
$('marketGrid').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-listing]')){e.preventDefault();openListing(e.target.dataset.listing,{itemId:e.target.dataset.product});}});
$('marketSort').addEventListener('change',renderMarket);
$('marketSearch').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(loadListings,250);});
$('refreshMarket').addEventListener('click',loadListings);
async function openListing(id,{itemId=null,updateUrl=true}={}){
  let listing;
  try{listing=(await api('listing','GET',null,false,{id})).listing;}
  catch(error){toast(error.message);return;}
  state.currentListing=listing;state.currentProduct=itemId;
  const selected=listing.items.find(item=>item.id===itemId);
  const items=selected?[selected,...listing.items.filter(item=>item.id!==itemId)]:listing.items;
  $('detailContent').innerHTML=`<h2 id="detailHeading">${esc(listing.title)}</h2><p class="hint">${esc(listing.seller)} · 自取：${esc(listing.pickup)}</p>${listing.note?`<p class="preserve-lines hint">${esc(listing.note)}</p>`:''}<p class="hint">${listing.stale?'超过 14 天未确认，请先询问卖家':'最近确认：'+esc(dateText(listing.updatedAt))}</p>
    ${items.map(item=>`<div class="detail-item ${item.id===itemId?'selected':''} ${item.status==='sold'?'sold':''}">${item.photo?`<img src="${esc(item.photo)}" alt="${esc(item.name)}" />`:'<div class="item-thumb image-fallback" aria-hidden="true">＋</div>'}
      <div><h3>${esc(item.name)}</h3><strong class="detail-price">${esc(priceLabel(item))}</strong>${item.condition?`<p class="preserve-lines">${esc(item.condition)}</p>`:''}${item.status==='available'?`<button type="button" class="text-btn" data-inquire="${esc(item.name)}">问问这件商品</button>`:''}</div><span class="pill ${item.status==='sold'?'gray':''}">${item.id===itemId?'已选 · ':''}${statusNames[item.status]||'在售'}</span></div>`).join('')}`;
  $('inquiryText').value=selected?.status==='available'?`你好，请问「${selected.name}」还在吗？什么时候方便自取？`:'';
  if(updateUrl){const url=new URL(location.href);url.searchParams.set('tab','market');url.searchParams.set('item',id);url.searchParams.delete('event');if(itemId)url.searchParams.set('product',itemId);else url.searchParams.delete('product');if(url.href!==location.href)history.pushState({listingModal:true},'',url);}
  showModal('detailModal');
}
$('detailContent').addEventListener('click',e=>{const button=e.target.closest('[data-inquire]');if(!button)return;$('inquiryText').value=`你好，请问「${button.dataset.inquire}」还在吗？什么时候方便自取？`;$('inquiryText').focus();});
$('copyListingLink').addEventListener('click',async()=>{if(!state.currentListing)return;try{await navigator.clipboard.writeText(listingLink(state.currentListing.id));toast('清仓页链接已复制');}catch{toast('复制失败，可从地址栏复制当前清单链接');}});
$('refreshListingDetail').addEventListener('click',()=>{if(state.currentListing)openListing(state.currentListing.id,{itemId:state.currentProduct,updateUrl:false});});
$('sendInquiry').addEventListener('click',async()=>{
  if(!state.currentListing||!requireAuth(()=>$('sendInquiry').click()))return;
  const content=$('inquiryText').value.trim();if(!content){toast('请先输入咨询内容');return;}
  const button=$('sendInquiry');setBusy(button,true,'发送中…');
  try{await api('sendMessage','POST',{listingId:state.currentListing.id,content});toast('消息已发送，请在「我的」中查看回复');hideModal('detailModal');}
  catch(error){toast(error.message);}finally{setBusy(button,false);}
});

// ---- Events ----
const dateText = iso => new Intl.DateTimeFormat('zh-CN',{timeZone:'Europe/Amsterdam',month:'long',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
let selectedCity='delft',feedEvents=cityEvents,feedUpdated=CITY_EVENTS_CHECKED,feedFailed=false;
async function loadCityFeed(){try{const r=await fetch('./events-feed.json',{cache:'no-cache'});if(!r.ok)throw new Error();const data=await r.json();if(!Array.isArray(data.events)||!/^\d{4}-\d{2}-\d{2}$/.test(data.updatedAt))throw new Error();const ids=new Set();for(const ev of data.events){if(!cities[ev.city]||!ev.id||ids.has(ev.id)||!ev.title||!Number.isFinite(Date.parse(ev.startsAt))||!/^https:\/\//.test(ev.sourceUrl))throw new Error();ids.add(ev.id);}feedEvents=data.events;feedUpdated=data.updatedAt;feedFailed=false;}catch{feedFailed=true;}renderCityEvents();}
let cityPeriod='all',eventSource='city',eventsRequest=0,eventDraftTouched=false,eventsFailed=false;
const eventClock=iso=>new Intl.DateTimeFormat('zh-CN',{timeZone:'Europe/Amsterdam',weekday:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));
function renderCityEvents(){
  const picks=upcomingCityEvents(feedEvents,cityPeriod,new Date(),selectedCity);
  $('cityCount').textContent=upcomingCityEvents(feedEvents,'all',new Date(),selectedCity).length;
  $('cityCheckedNote').textContent=eventSource==='city'?`荷兰时间 · ${feedUpdated.slice(5).replace('-','/')} 更新${feedFailed?' · 更新暂不可用':''}`:'荷兰当地时间';
  $('cityEvents').innerHTML=picks.length?picks.map(ev=>{
    const local=amsterdamInput(ev.startsAt),month=Number(local.slice(5,7)),day=local.slice(8,10);
    return `<article class="city-card ${esc(ev.tone)}"><div class="city-card-main"><div class="city-date-block" aria-label="${month} 月 ${Number(day)} 日"><span>${month} 月</span><strong>${day}</strong></div><div class="city-content"><div class="city-topline"><span>${esc(eventClock(ev.startsAt))}${ev.endsAt?' – '+amsterdamInput(ev.endsAt).slice(11):''}</span><span class="city-kind">${esc(ev.category)}</span></div><h2>${esc(ev.title)}</h2><p class="city-teaser">${esc(ev.summary)}</p><p class="city-place" title="${esc(ev.place)}">${esc(cities[ev.city||'delft'])} · ${esc(ev.place)}</p></div></div><div class="city-card-footer"><strong class="city-fee">${esc(ev.fee)}</strong><div class="city-actions"><button class="text-btn" type="button" data-city-meetup="${esc(ev.id)}">约人同行 ＋</button><a href="${esc(ev.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="outline-btn">${ev.category==='节日'?'官方安排':'查看票务'} ↗</a></div></div><details class="city-disclosure"><summary>详情与来源</summary><div><p><strong>${esc(ev.originalTitle)}</strong><br>${esc(ev.description)}</p><p>${esc(ev.price)}</p><a href="${esc(ev.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(ev.sourceName)} ↗</a><span> · ${esc(ev.checkedOn)} 核对</span></div></details></article>`;
  }).join(''):`<div class="empty-state"><h2>${cityPeriod==='all'?'这个城市暂无近期精选活动':'这个时间段暂无精选活动'}</h2><p>可以查看官方日历，或换一个时间范围。</p><a class="outline-btn" href="${CITY_AGENDA_URL}" target="_blank" rel="noopener noreferrer">浏览官方活动日历 ↗</a></div>`;
}
$('eventSourceSwitch').addEventListener('click',e=>{
  const button=e.target.closest('[data-source]');if(!button)return;eventSource=button.dataset.source;
  $('eventSourceSwitch').querySelectorAll('button').forEach(el=>{const active=el===button;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
  $('citySection').hidden=eventSource!=='city';$('communitySection').hidden=eventSource!=='community';$('refreshEvents').hidden=eventSource!=='community';renderCityEvents();renderEvents();
});
$('cityEventFilters').addEventListener('click',e=>{
  const button=e.target.closest('[data-period]');if(!button)return;cityPeriod=button.dataset.period;
  $('cityEventFilters').querySelectorAll('button').forEach(el=>{const selected=el===button;el.classList.toggle('active',selected);el.setAttribute('aria-pressed',String(selected));});
  renderCityEvents();renderEvents();
});
$('cityEvents').addEventListener('click',e=>{
  const id=e.target.closest('[data-city-meetup]')?.dataset.cityMeetup;
  const event=feedEvents.find(event=>event.id===id);
  if(event){if(Date.parse(event.startsAt)<=Date.now()){renderCityEvents();toast('这场活动已经开始，看看其他活动吧');return;}openEventForm(event);}
});
function openEventForm(event){
  if(event&&eventDraftTouched&&!confirm('用这场活动替换正在填写的组局草稿？'))return;
  const form=$('createEventForm');
  if(!event&&!eventDraftTouched)form.elements.city.value=selectedCity==='all'?'delft':selectedCity;
  if(event){
    const draft=cityEventDraft(event);form.reset();
    Object.entries(draft).forEach(([key,value])=>form.elements[key].value=value);
    $('sourceEventNote').hidden=false;
    $('sourceEventNote').innerHTML=`约同行 · 门票请各自办理。可调整集合时间与地点。 <a href="${esc(event.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看主办方安排 ↗</a>`;
    eventDraftTouched=true;
  }
  $('hostName').value=$('hostName').value||nickname();showModal('createEventBox');form.elements.title.focus({preventScroll:true});
}
async function loadEvents(){
  const request=++eventsRequest;$('eventsList').setAttribute('aria-busy','true');
  try{const result=await api('events');if(request!==eventsRequest)return;state.events=result.events||[];eventsFailed=false;renderEvents();}
  catch(error){if(request===eventsRequest){eventsFailed=true;renderEvents();}}
  finally{if(request===eventsRequest)$('eventsList').setAttribute('aria-busy','false');}
}
function renderEvents(){
  if(eventsFailed){$('communityCount').textContent='';$('eventsList').innerHTML='<div class="empty-state error-state"><h2>组局暂时没能加载</h2><p>可以先看看城市活动，或稍后重试。</p><button type="button" class="outline-btn" data-retry-events>重新加载</button></div>';return;}
  const events=upcomingCityEvents(state.events,cityPeriod,new Date(),selectedCity);
  $('communityCount').textContent=upcomingCityEvents(state.events,'all',new Date(),selectedCity).length;
  $('eventsList').innerHTML=events.length?events.map(ev=>`<article class="event-card"><div class="event-top"><span class="pill">${esc(ev.category)}</span><span class="pill ${ev.count>=ev.capacity?'gray':''}">${ev.count>=ev.capacity?'已满员':`还差 ${ev.capacity-ev.count} 人`}</span></div>
    <h2>${esc(ev.title)}</h2><div class="event-meta"><span>${esc(dateText(ev.startsAt))}</span><span>${esc(cities[ev.city||'delft'])} · ${esc(ev.place)}</span><span>${esc(ev.host)} 发起 · ${ev.count}/${ev.capacity} 人</span></div>${ev.description?`<details class="event-description"><summary>活动说明</summary><p class="preserve-lines">${esc(ev.description)}</p></details>`:''}
    <div class="event-footer"><button type="button" class="text-btn" data-share-event="${esc(ev.id)}">分享到微信</button><button type="button" class="${ev.joined?'outline-btn':'primary-btn'}" data-event="${esc(ev.id)}" ${ev.hostIsMe||(!ev.joined&&ev.count>=ev.capacity)?'disabled':''}>${ev.hostIsMe?'我发起的':ev.joined?'取消报名':ev.count>=ev.capacity?'已满员':'报名参加'}</button></div>${ev.hostIsMe?`<div class="event-footer"><button class="text-btn" type="button" data-attendees="${esc(ev.id)}">查看报名昵称</button><button class="text-btn danger" type="button" data-cancel-event="${esc(ev.id)}">取消活动</button></div>`:''}</article>`).join(''):`<div class="empty-state"><h2>${state.events.length?'这个时间段暂无组局':'还没有人发起组局'}</h2><p>约两三个人喝咖啡，或一起去看场演出。</p><button type="button" class="outline-btn" data-create-event>发起组局</button></div>`;
}
function beginRsvp(id){
  if(!requireAuth(()=>beginRsvp(id)))return;
  const event=state.events.find(ev=>ev.id===id);if(!event)return;
  state.currentEvent=event;$('rsvpName').value=nickname();showModal('rsvpModal');
}
$('eventsList').addEventListener('click',async e=>{
  const share=e.target.closest('[data-share-event]');
  if(share){
    const ev=state.events.find(x=>x.id===share.dataset.shareEvent);if(!ev)return;
    try{
      const {canvas,url}=await createEventPoster(ev);
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('海报生成失败')),'image/jpeg',0.92));
      if(posterUrl)URL.revokeObjectURL(posterUrl);posterUrl=URL.createObjectURL(blob);
      posterFile=new File([blob],'荷包-同行邀请.jpg',{type:'image/jpeg'});
      $('posterImage').src=posterUrl;$('posterImage').alt='同行邀请海报与报名二维码';$('downloadPoster').href=posterUrl;$('downloadPoster').download=posterFile.name;
      $('sharePoster').hidden=!navigator.canShare?.({files:[posterFile]});
      $('eventShareText').value=`${ev.title}\n${dateText(ev.startsAt)}\n${cities[ev.city||'delft']} · ${ev.place}\n查看详情与报名：${url}`;
      $('eventShareText').hidden=false;$('copyEventShare').hidden=false;
      $('posterHint').textContent='保存海报发到微信群或朋友圈；朋友长按识别二维码即可查看报名。人数与安排以网页为准。';showModal('posterModal');
    }catch(error){toast(error.message);}return;
  }
  const cancel=e.target.closest('[data-cancel-event]');
  if(cancel){if(!requireAuth()||!confirm('取消后报名者将无法再看到此活动，确定吗？'))return;try{await api('cancelEvent','POST',{eventId:cancel.dataset.cancelEvent});toast('活动已取消');loadEvents();}catch(error){toast(error.message);}return;}
  const attendees=e.target.closest('[data-attendees]');
  if(attendees){if(!requireAuth())return;try{const r=await fetch(`/api/delft?action=attendees&id=${encodeURIComponent(attendees.dataset.attendees)}`,{headers:{Authorization:`Bearer ${token()}`}});const data=await r.json();if(!r.ok)throw new Error(data.error);alert(data.attendees.length?`报名用户：\n${data.attendees.map(x=>x.nickname).join('\n')}`:'暂时还没有报名者');}catch(error){toast(error.message);}return;}
  const button=e.target.closest('[data-event]');if(!button)return;
  const event=state.events.find(ev=>ev.id===button.dataset.event);if(!event)return;
  if(event.joined){if(!requireAuth()||!confirm('确定取消报名吗？'))return;
    try{await api('cancelRsvp','POST',{eventId:event.id});toast('已取消报名');loadEvents();}catch(error){toast(error.message);}
    return;
  }
  beginRsvp(event.id);
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
$('closeCreateEvent').addEventListener('click',()=>hideModal('createEventBox'));
$('createEventForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!requireAuth(()=>$('createEventForm').requestSubmit()))return;
  const form=e.target,values=Object.fromEntries(new FormData(form));
  let startsAt;try{startsAt=amsterdamInstant(values.startsAt);}catch(error){toast(error.message);return;}
  const button=form.querySelector('[type=submit]');setBusy(button,true,'发布中…');
  try{await api('createEvent','POST',{city:values.city,title:values.title,host:values.host,category:values.category,startsAt:startsAt.toISOString(),capacity:Number(values.capacity),place:values.place,description:values.description});
    localStorage.setItem('delft_nickname',values.host);hideModal('createEventBox');form.reset();eventDraftTouched=false;$('sourceEventNote').hidden=true;toast('活动发布成功！可邀请朋友来报名');loadEvents();}
  catch(error){toast(error.message);}finally{setBusy(button,false);}
});

// ---- My inventory + buyer/seller messages ----
let mineView='listings';
function renderMineView(){
  for(const [view,id] of [['listings','myListings'],['events','myEvents'],['messages','myMessages']])$(id).hidden=view!==mineView;
  $('mineSwitch').querySelectorAll('button').forEach(button=>{const active=button.dataset.mineView===mineView;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
}
$('mineSwitch').addEventListener('click',e=>{const button=e.target.closest('[data-mine-view]');if(button){mineView=button.dataset.mineView;renderMineView();}});
const mineError='<div class="empty-state error-state"><h2>暂时没能加载</h2><p>请用右上角的刷新按钮重试。</p></div>';
async function loadMine(){
  refreshLoginUI();if(!token()){state.myListings=[];for(const id of ['myListings','myEvents','myMessages'])$(id).innerHTML='';return;}
  const session=token();
  const [mine,inbox,events]=await Promise.allSettled([api('mine'),api('messages'),api('events')]);
  if(session!==token()){loadMine();return;}
  if(mine.status==='fulfilled'){
    state.myListings=mine.value.listings;
    $('myListings').innerHTML=mine.value.listings.length?mine.value.listings.map(l=>`<div class="my-listing"><h2>${esc(l.title)}</h2><p class="hint">${esc(l.pickup)}</p>
      ${l.items.map(item=>`<div class="my-item"><span>${esc(item.name)}</span><select data-listing-id="${esc(l.id)}" data-item-id="${esc(item.id)}" aria-label="${esc(item.name)}的状态">${Object.entries(statusNames).map(([value,label])=>`<option value="${value}" ${item.status===value?'selected':''}>${label}</option>`).join('')}</select></div>`).join('')}
      <div class="inventory-meta">${l.stale?'超过 14 天未确认，暂时下架':'最近确认：'+esc(dateText(l.updatedAt))}</div><div class="inventory-actions"><button class="outline-btn" type="button" data-edit-listing="${esc(l.id)}">编辑</button><button class="outline-btn" type="button" data-refresh-listing="${esc(l.id)}">确认在售</button><a href="/delft/?item=${encodeURIComponent(l.id)}">分享清单 ↗</a><button class="text-btn danger" type="button" data-delete-listing="${esc(l.id)}">删除</button></div></div>`).join(''):'<div class="empty-state"><h2>还没有发布闲置</h2><p>生成海报不需要发布，可以先整理清单。</p><button class="primary-btn" type="button" data-tab="sell">添加商品</button></div>';
  }else $('myListings').innerHTML=mineError;
  if(inbox.status==='fulfilled'){
    const threads=new Map();for(const m of inbox.value.messages){const key=`${m.listingId}|${m.otherId}`;if(!threads.has(key))threads.set(key,[]);threads.get(key).push(m);}
    $('myMessages').innerHTML=threads.size?[...threads.values()].map(thread=>{
      const latest=thread[0];return `<div class="thread" data-thread-listing="${esc(latest.listingId)}" data-thread-user="${esc(latest.otherId)}"><h2>${esc(latest.listingTitle)}</h2>
      ${thread.reverse().map(m=>`<div class="message-bubble ${m.fromMe?'mine':''}"><strong>${m.fromMe?'我':'对方'}</strong> · ${esc(dateText(m.createdAt))}<div class="preserve-lines">${esc(m.content)}</div></div>`).join('')}
      <form class="message-reply"><input name="message" maxlength="500" required aria-label="回复消息" placeholder="回复消息…" /><button type="submit" class="outline-btn">发送</button></form></div>`;
    }).join(''):'<div class="empty-state"><h2>还没有私信</h2><p>商品咨询和回复会显示在这里。</p><button type="button" class="outline-btn" data-tab="market">逛逛闲置</button></div>';
  }else $('myMessages').innerHTML=mineError;
  if(events.status==='fulfilled'){
    const mine=events.value.events.filter(event=>event.joined||event.hostIsMe);
    $('myEvents').innerHTML=mine.length?mine.map(event=>`<a class="my-event" href="/delft/?event=${encodeURIComponent(event.id)}"><span class="pill">${event.hostIsMe?'我发起的':'已报名'}</span><h2>${esc(event.title)}</h2><p>${esc(dateText(event.startsAt))} · ${esc(event.place)}</p></a>`).join(''):'<div class="empty-state"><h2>还没有参加组局</h2><p>报名后，集合时间和地点会显示在这里。</p><button type="button" class="outline-btn" data-tab="events">找个活动</button></div>';
  }else $('myEvents').innerHTML=mineError;
  renderMineView();
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
      $('shareResult').hidden=true;renderItems();renderDraftMode();setSellStep(1);persistDraft();tab('sell');toast('已载入清仓页，修改后点击保存');
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
    $('draftStatus').textContent=state.dirty?'已恢复草稿':'已恢复已发布清单';
  }catch{$('draftStatus').textContent='浏览器草稿暂不可用，仍可正常发布';}
}
refreshLoginUI();renderItems();restoreDraft();
async function applyRoute(){
  const query=new URLSearchParams(location.search),item=query.get('item'),event=query.get('event');
  selectedCity=cities[query.get('city')]?query.get('city'):query.get('city')==='all'?'all':'delft';$('citySelect').value=selectedCity;
  const requested=item?'market':event?'events':query.get('tab')||'events';
  const name=['sell','market','events','mine'].includes(requested)?requested:'events';
  if(!item&&!$('detailModal').hidden)hideModal('detailModal',{updateUrl:false});
  await tab(name,{updateUrl:false});
  if(item)await openListing(item,{itemId:query.get('product'),updateUrl:false});
  if(event&&!item){
    selectedCity='all';$('citySelect').value='all';eventSource='community';$('eventSourceSwitch').querySelector('[data-source="community"]').click();
    // A shared event must remain reachable even if a prior filter excluded it.
    cityPeriod='all';$('cityEventFilters').querySelector('[data-period="all"]').click();
    const card=$('eventsList').querySelector(`[data-event="${CSS.escape(event)}"]`);card?.closest('.event-card')?.scrollIntoView({behavior:'smooth',block:'center'});
    if(!card)toast('这场组局已结束或取消，可以看看其他活动');
  }
}
window.addEventListener('popstate',applyRoute);
applyRoute();
// Re-evaluate dates when a visitor returns to an open tab, including after midnight.
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&state.activeTab==='events'){loadCityFeed();renderEvents();}});

$('citySelect').addEventListener('change',()=>{selectedCity=$('citySelect').value;const url=new URL(location.href);url.searchParams.set('city',selectedCity);history.pushState(null,'',url);renderCityEvents();renderEvents();});
$('copyEventShare').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('eventShareText').value);toast('邀请已复制，粘贴到微信即可');}catch{$('eventShareText').focus();$('eventShareText').select();toast('请长按或按 Ctrl+C 复制邀请');}});
