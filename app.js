// ============================================================================
// app.js - 核心业务逻辑中心 (净化去重终极版)
// ============================================================================
// ================= 🌟 全局高质感 Toast 提示 =================
let toastTimeout = null;
function showToast(message, type = 'info') {
    const toast = document.getElementById('globalToast');
    const icon = document.getElementById('toastIcon');
    const msg = document.getElementById('toastMessage');
    if (!toast) return showToast(message); // 防崩溃后备

    // 设定图标和背景色
    if (type === 'success') { icon.innerText = '✅'; toast.style.background = 'rgba(16, 185, 129, 0.95)'; }
    else if (type === 'error') { icon.innerText = '🚨'; toast.style.background = 'rgba(239, 68, 68, 0.95)'; }
    else if (type === 'warning') { icon.innerText = '⚠️'; toast.style.background = 'rgba(245, 158, 11, 0.95)'; }
    else { icon.innerText = '💡'; toast.style.background = 'rgba(17, 24, 39, 0.95)'; }

    msg.innerText = message;
    toast.classList.add('show');

    // 清除上一次的定时器，防止连续点击导致闪烁
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ================= 🌟 全局朋友圈级大图预览 =================
function openLightbox(imgSrc) {
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    if (!lightbox || !imgSrc) return;
    
    // 如果没有图片（比如是用 SVG 占位的），不放大
    if(imgSrc.includes('data:image/svg')) return;
    
    lightboxImg.src = imgSrc;
    lightbox.style.display = 'flex';
}
function closeLightbox() {
    document.getElementById('imageLightbox').style.display = 'none';
}

// ================= 1. 导航与 Tab =================
function switchAssetTab(tabId, element) { 
    document.querySelectorAll('.a-tab').forEach(el => el.classList.remove('active')); 
    element.classList.add('active'); 
    document.querySelectorAll('.asset-content').forEach(el => el.classList.remove('active')); 
    document.getElementById('asset-' + tabId).classList.add('active'); 
}
function switchHomeTrendingTab(type, element) { 
    document.querySelectorAll('#page-scan .t-tab').forEach(el => el.classList.remove('active')); 
    if(element) element.classList.add('active'); 
    document.getElementById('homeTrendingListLikes').style.display = type === 'likes' ? 'block' : 'none'; 
    document.getElementById('homeTrendingListDislikes').style.display = type === 'dislikes' ? 'block' : 'none'; 
}

// ================= 2. 个人资料编辑与认证 =================
function openEmailVerifyModal() { document.getElementById('loginModal').style.display = 'flex'; }
function openWechatBindModal() { 
    document.getElementById('authWechatInput').value = localStorage.getItem('hp_wechat') || ''; 
    document.getElementById('wechatBindModal').style.display = 'flex'; 
}
function saveWechatBind() {
    const wx = document.getElementById('authWechatInput').value.trim(); 
    if(!wx) return showToast("微信号不能为空哦！");
    localStorage.setItem('hp_wechat', wx); 
    document.getElementById('wechatBindModal').style.display = 'none';
    const plus = document.createElement('div'); 
    plus.className = 'float-plus'; plus.innerText = '💬 绑定成功 信用分+30'; plus.style.color = '#10B981';
    plus.style.left = '50%'; plus.style.top = '40%'; plus.style.transform = 'translate(-50%, -50%)'; 
    document.body.appendChild(plus); 
    setTimeout(() => plus.remove(), 2000);
    renderProfileState();
}
function openEditProfileModal() { 
    document.getElementById('epName').value = localStorage.getItem('hp_name') || ''; 
    document.getElementById('epGender').value = localStorage.getItem('hp_gender') || '保密'; 
    document.getElementById('epMbti').value = localStorage.getItem('hp_mbti') || ''; 
    document.getElementById('epWechat').value = localStorage.getItem('hp_wechat') || ''; 
    document.getElementById('epBio').value = localStorage.getItem('hp_bio') || ''; 
    document.getElementById('editProfileModal').style.display = 'flex'; 
}
function saveProfileData() { 
    const name = document.getElementById('epName').value.trim(); 
    if(!name) return showToast('昵称不能为空哦！'); 
    localStorage.setItem('hp_name', name); 
    localStorage.setItem('hp_gender', document.getElementById('epGender').value); 
    localStorage.setItem('hp_mbti', document.getElementById('epMbti').value); 
    localStorage.setItem('hp_wechat', document.getElementById('epWechat').value.trim()); 
    localStorage.setItem('hp_bio', document.getElementById('epBio').value.trim()); 
    document.getElementById('editProfileModal').style.display = 'none'; 
    renderProfileState(); 
}
function previewAvatar(event) { 
    const file = event.target.files[0]; if(!file) return; 
    const reader = new FileReader(); 
    reader.onload = function(e) { 
        localStorage.setItem('hebao_avatar', e.target.result); 
        renderProfileState(); 
        loadAvatar();
    }; 
    reader.readAsDataURL(file); 
}
function loadAvatar() { 
    const savedAvatar = localStorage.getItem('hebao_avatar'); 
    if(savedAvatar && isLoggedIn) { 
        document.getElementById('profileAvatarImg').src = savedAvatar; 
        document.getElementById('profileAvatarImg').style.display = 'block'; 
        document.getElementById('profileAvatarBox').style.background = '#FFF'; 
        document.getElementById('profileAvatarEmoji').textContent = ''; 
    } 
}

// ================= 3. GPS 定位 =================
let currentCity = ""; let currentPostcode = "";
function autoLocate(inputId) {
    const inputEl = document.getElementById(inputId); 
    if (!navigator.geolocation) return showToast("浏览器不支持定位功能");
    const oldVal = inputEl.value; inputEl.value = "定位中..."; 
    const toggleWrapper = document.getElementById('postcodeToggleWrapper'); 
    if(toggleWrapper) toggleWrapper.style.display = 'none';
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const { latitude, longitude } = pos.coords; 
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=zh`);
            const data = await res.json(); 
            currentCity = data.address.city || data.address.town || data.address.village || data.address.state || "荷兰";
            let fullPostcode = data.address.postcode || ""; 
            currentPostcode = fullPostcode.replace(/\s+/g, '').substring(0, 4); 
            inputEl.value = currentCity;
            if (currentPostcode && toggleWrapper) { 
                document.getElementById('detectedPostcode').innerText = currentPostcode; 
                toggleWrapper.style.display = 'flex'; 
                document.getElementById('showPostcodeCheck').checked = false; 
            }
        } catch (e) { inputEl.value = oldVal; showToast("获取定位失败"); }
    }, (err) => { inputEl.value = oldVal; showToast("定位权限被拒绝"); }, { timeout: 10000 });
}
function togglePostcode() { 
    const inputEl = document.getElementById('idleLocation'); 
    const isChecked = document.getElementById('showPostcodeCheck').checked; 
    if (isChecked) { inputEl.value = `${currentCity} (${currentPostcode})`; } 
    else { inputEl.value = currentCity; } 
}

// ================= 4. 扫码与榜单 =================
let currentProductData = null; let currentDetailData = null; 
let globalTrendingLikes = []; let globalTrendingDislikes = [];

async function handlePackageImage(event) {
    const file = event.target.files[0]; if (!file) return;
    document.getElementById('homeActionBox').style.display = 'none'; 
    document.getElementById('previewContainer').style.display = 'block'; 
    document.getElementById('scanOverlay').style.display = 'flex'; 
    document.getElementById('scanText').innerText = "📡 正在解析包装..."; 
    document.getElementById('miniResultCard').style.display = 'none';
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Data = e.target.result.split(',')[1]; 
        const previewImg = document.getElementById('previewImg'); 
        if (previewImg) previewImg.src = e.target.result;
        try {
            const res = await fetch('/api/scan', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ imageBase64: base64Data }) });
            const data = await res.json(); 
            if(!res.ok || data.error) throw new Error(data.error || "识别失败");
            currentProductData = data; currentProductData.image_url = e.target.result; 
            document.getElementById('scanOverlay').style.display = 'none'; 
            document.getElementById('previewContainer').style.display = 'none'; 
            document.getElementById('miniResultCard').style.display = 'block'; 
            const emoji = data.is_recommended === 1 ? '👍' : '💣'; 
            document.getElementById('miniChineseName').innerText = `${emoji} ${data.chinese_name || data.dutch_name || '未知商品'}`; 
            document.getElementById('miniInsight').innerText = data.insight || '管家觉得不错~'; 
            saveToLocalFootprint(data, data.image_url);
        } catch (err) { showToast("识别失败：" + err.message); resetApp(); } 
        finally { document.getElementById('packageImgInput').value = ''; }
    }; 
    reader.readAsDataURL(file);
}

let html5Scanner = null;
function startBarcodeScan() {
    document.getElementById('scannerModal').style.display = 'flex'; 
    html5Scanner = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0, formatsToSupport: [ Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, Html5QrcodeSupportedFormats.UPC_A ] };
    html5Scanner.start({ facingMode: "environment" }, config, (decodedText) => { 
        if (navigator.vibrate) navigator.vibrate(100); 
        closeScanner(); 
        document.getElementById('mainSearchInput').value = decodedText; 
        executeSearch(); 
    }).catch(err => { showToast("调用摄像头失败"); closeScanner(); });
}
function closeScanner() { 
    if(html5Scanner) { html5Scanner.stop().catch(e=>console.log(e)); html5Scanner = null; } 
    document.getElementById('scannerModal').style.display = 'none'; 
}
function executeSearch() {
    const query = document.getElementById('mainSearchInput').value.trim(); if (!query) return;
    document.getElementById('homeActionBox').style.display='none'; 
    document.getElementById('previewContainer').style.display='block'; 
    document.getElementById('scanOverlay').style.display='flex'; 
    document.getElementById('scanText').innerText = "📡 全网检索中..."; 
    document.getElementById('miniResultCard').style.display='none';
    fetch('/api/scan-barcode', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ barcode: query, userId: userUUID }) })
    .then(res => res.json()).then(data => {
        currentProductData = data; 
        document.getElementById('scanOverlay').style.display='none'; 
        document.getElementById('previewContainer').style.display='none'; 
        document.getElementById('miniResultCard').style.display='block'; 
        document.getElementById('miniChineseName').innerText=data.chinese_name||'未知商品'; 
        document.getElementById('miniInsight').innerText=data.insight||'暂无评价'; 
        saveToLocalFootprint(data, data.image_url);
    }).catch(err => { showToast("未找到"); resetApp(); });
}
function resetApp() { 
    document.getElementById('previewContainer').style.display='none'; 
    document.getElementById('scanOverlay').style.display='none'; 
    document.getElementById('miniResultCard').style.display='none'; 
    document.getElementById('homeActionBox').style.display='flex'; 
    document.getElementById('mainSearchInput').value = ''; 
}

async function loadTrendingToHome() {
    try {
        const res = await fetch('/api/trending'); const data = await res.json();
        if(data.success) { 
            globalTrendingLikes = data.topLikes || []; 
            globalTrendingDislikes = data.topDislikes || []; 
            renderHomeTrending(globalTrendingLikes, 'homeTrendingListLikes', 'like'); 
            renderHomeTrending(globalTrendingDislikes, 'homeTrendingListDislikes', 'dislike'); 
        }
    } catch(e) {}
}
function renderHomeTrending(list, containerId, type) {
    const container = document.getElementById(containerId); 
    if (!container || !list || list.length === 0) return; 
    let html = ''; 
    const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23F3F4F6'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='10' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'%3E暂无图%3C/text%3E%3C/svg%3E";
    list.slice(0, 20).forEach((item, index) => {
        let badgeClass = 'rank-other'; 
        if (index === 0) badgeClass = 'rank-1'; else if (index === 1) badgeClass = 'rank-2'; else if (index === 2) badgeClass = 'rank-3'; 
        if (type === 'dislike') badgeClass = 'rank-bad';
        const score = type === 'like' ? item.likes : item.dislikes; 
        const icon = type === 'like' ? '👍' : '💣'; 
        const scoreColor = type === 'like' ? '#10B981' : '#EF4444'; 
        const safeImg = item.image_url || fallbackSvg;
        html += `<div class="trending-card" onclick="openDetailsFromHomeTrending('${type}', ${index})"><div class="rank-badge ${badgeClass}">TOP ${index + 1}</div><img src="${safeImg}" onerror="this.onerror=null; this.src='${fallbackSvg}'" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; background: #F3F4F6; border: 1px solid #E5E7EB;"><div class="t-info"><div class="t-name">${item.chinese_name || '未命名商品'}</div><div style="font-size: 11px; color: #9CA3AF; margin-top:2px;">${item.dutch_name || ''}</div></div><div class="t-score" style="color: ${scoreColor}">${icon} ${score}</div></div>`;
    });
    container.innerHTML = html;
}

// ================= 5. 商品详情页与评价 =================
function openDetailsFromScan() { currentDetailData = {...currentProductData}; setupDetailPage(); }
function openDetailsFromHomeTrending(type, index) { currentDetailData = type === 'like' ? globalTrendingLikes[index] : globalTrendingDislikes[index]; setupDetailPage(); }
function openDetailsFromHistory(index) { let h = JSON.parse(localStorage.getItem('hebao_history')||'[]'); currentDetailData = h[index]; setupDetailPage(); }
function setupDetailPage() {
    const d = currentDetailData; if (!d) return;
    const imgEl = document.getElementById('detailImg'); imgEl.src = d.image_url || d.img_src || ''; 
    document.getElementById('detailChineseName').innerText = d.chinese_name || '未命名商品'; document.getElementById('detailDutchName').innerText = d.dutch_name || ''; 
    document.getElementById('detailInsightBox').style.display = d.insight ? 'block' : 'none'; document.getElementById('detailInsight').innerText = d.insight || '';
    document.getElementById('detailWarningBox').style.display = d.warning ? 'block' : 'none'; document.getElementById('detailWarning').innerText = d.warning || '';
    document.getElementById('detailAltBox').style.display = 'none';
    if(d.alternatives) { document.getElementById('detailAltBox').style.display='block'; document.getElementById('detailAlternatives').innerHTML = d.alternatives.split('|').map(p=>`<div class="alt-tag">${p}</div>`).join(''); }
    if (d.pairing) { document.getElementById('detailRecipeBox').style.display = 'block'; renderReviewCards(d.pairing); } 
    else { document.getElementById('detailRecipeBox').style.display = 'block'; document.getElementById('recipeCardList').innerHTML = '<div style="text-align:center;color:#9CA3AF;font-size:13px;padding:20px 0;">暂无评价</div>'; }
    document.getElementById('chatHistory').innerHTML = ''; document.getElementById('askInput').value = ''; switchTab('details', null);
}
function renderReviewCards(pairingString) {
    const list = document.getElementById('recipeCardList'); list.innerHTML = '';
    let reviews = pairingString.split('\n\n').filter(l => l.trim()).map((line, idx) => {
        const isLike = line.includes('👍'); const isRealUser = line.includes('🧑‍🍳'); const cleanText = line.replace(/🧑‍🍳 网友点评 \[.*?\]：|🤖 AI预测口味 \[.*?\]：/, '').trim();
        return { id: idx, text: cleanText, isLike, isRealUser, likes: isRealUser ? Math.floor(Math.random() * 50) + 5 : 0, avatar: isRealUser ? ['🐼','😎','👻','👩‍💻','🐱'][idx % 5] : '🤖', name: isRealUser ? '热心网友_' + Math.floor(Math.random()*900+100) : 'AI 预测' };
    });
    reviews.sort((a, b) => b.likes - a.likes);
    reviews.forEach(r => {
        const tagHtml = r.isRealUser ? `<span class="r-tag ${r.isLike ? 'like' : 'dislike'}">${r.isLike ? '👍 推荐' : '💣 避雷'}</span>` : `<span class="r-tag" style="background:#F3F4F6; color:#6B7280;">🤖 AI</span>`;
        list.innerHTML += `<div class="recipe-card"><div class="r-header"><div class="r-user"><div class="r-avatar">${r.avatar}</div><div class="r-name">${r.name}</div>${tagHtml}</div><div class="r-like-btn" onclick="likeReviewCard(this)"><span style="font-size:14px;">💡</span> <span>${r.likes}</span></div></div><div class="r-text">${r.text}</div></div>`;
    });
}
function likeReviewCard(btn) { if(btn.classList.contains('voted')) return; btn.classList.add('voted'); const span = btn.querySelector('span:last-child'); span.innerText = parseInt(span.innerText) + 1; }
function openAddReviewModal() { document.getElementById('reviewText').value = ''; document.getElementById('addReviewModal').style.display = 'flex'; }
async function submitDetailReview() {
    const text = document.getElementById('reviewText').value.trim(); if(!text) return showToast("写点内容吧！");
    const attitude = document.getElementById('reviewAttitude').value; const finalUgcText = `🧑‍🍳 网友点评 [${attitude}]：${text}`;
    const btn = document.getElementById('btnSubmitReview'); btn.innerText = "提交中..."; btn.disabled = true;
    try {
        currentDetailData.pairing = currentDetailData.pairing ? currentDetailData.pairing + '\n\n' + finalUgcText : finalUgcText;
        let history = JSON.parse(localStorage.getItem('hebao_history') || '[]'); let index = history.findIndex(i => i.dutch_name === currentDetailData.dutch_name);
        if(index !== -1) { history[index].pairing = currentDetailData.pairing; localStorage.setItem('hebao_history', JSON.stringify(history)); }
        await fetch('/api/vote', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ dutch_name: currentDetailData.dutch_name, action: attitude.includes('推荐') ? 'like' : 'dislike' }) });
        showToast("🎉 发布成功！"); document.getElementById('addReviewModal').style.display = 'none'; setupDetailPage();
    } catch(e) { showToast("网络错误"); } finally { btn.innerText = "🚀 提交评价"; btn.disabled = false; }
}
function saveToLocalFootprint(data, img) { let h = JSON.parse(localStorage.getItem('hebao_history')||'[]'); if(!h.find(i=>i.dutch_name===data.dutch_name)){ data.img_src=img; h.unshift(data); localStorage.setItem('hebao_history',JSON.stringify(h)); } }
function renderFootprints() { 
    const listDiv = document.getElementById('footprintList'); let h = JSON.parse(localStorage.getItem('hebao_history') || '[]'); 
    if (h.length === 0) { listDiv.innerHTML = '<div style="text-align:center; color:#9CA3AF; margin-top:20px; font-size:13px; border: 1px dashed #E5E7EB; padding: 30px; border-radius: 16px;">暂无足迹</div>'; return; } 
    let html = ''; const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23F3F4F6'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='10' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'%3E暂无图%3C/text%3E%3C/svg%3E";
    h.forEach((item, index) => { 
        const safeImg = item.img_src || item.image_url || fallbackSvg;
        html += `<div style="background:#FFF; border-radius:16px; margin-bottom:12px; border:1px solid #E5E7EB; overflow:hidden; display:flex; align-items:center; padding:12px; box-shadow:0 2px 8px rgba(0,0,0,0.02); cursor:pointer;" onclick="openDetailsFromHistory(${index})"><img src="${safeImg}" onerror="this.onerror=null; this.src='${fallbackSvg}'" style="width:50px; height:50px; object-fit:cover; border-radius:10px; flex-shrink:0; background:#F3F4F6;"><div style="flex:1; margin-left:12px;"><div style="font-weight:900; font-size:15px; color:#111827; margin-bottom:2px;">${item.chinese_name || '未命名'}</div><div style="font-size:12px; color:#9CA3AF; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;">${item.insight || ''}</div></div></div>`; 
    }); 
    listDiv.innerHTML = html; 
}


// ================= 6. 发布系统与 AI 提取 =================
function openPublishSheet() { const overlay = document.querySelector('.publish-overlay'); const sheet = document.querySelector('.publish-sheet'); if(overlay) { overlay.style.display = 'block'; setTimeout(()=>overlay.classList.add('show'),10); } if(sheet) { setTimeout(()=>sheet.classList.add('show'),10); } }
function closePublishSheet() { const overlay = document.querySelector('.publish-overlay'); const sheet = document.querySelector('.publish-sheet'); if(sheet) sheet.classList.remove('show'); if(overlay) { overlay.classList.remove('show'); setTimeout(()=>overlay.style.display='none',300); } }
function openIdlePublish() { closePublishSheet(); setTimeout(() => { document.getElementById('publishIdleModal').style.display = 'flex'; const d = new Date(); d.setDate(d.getDate() + 7); if(document.getElementById('idleDeadline')) document.getElementById('idleDeadline').value = d.toISOString().split('T')[0]; }, 300); }
function closeIdlePublish() { document.getElementById('publishIdleModal').style.display = 'none'; }
function openHelpPublish() { closePublishSheet(); setTimeout(() => { document.getElementById('publishHelpModal').style.display = 'flex'; }, 300); }
function closeHelpPublish() { document.getElementById('publishHelpModal').style.display = 'none'; }
function openPartnerPublish() { closePublishSheet(); setTimeout(() => { document.getElementById('publishPartnerModal').style.display = 'flex'; }, 300); }
function closePartnerPublish() { document.getElementById('publishPartnerModal').style.display = 'none'; }
function selectPill(element, groupName) { document.querySelectorAll(`#${groupName} .pill`).forEach(el => el.classList.remove('active')); element.classList.add('active'); }

let selectedImagesArray = []; 
function handleMultiImageSelect(event) {
    const files = event.target.files; if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
        if (selectedImagesArray.length >= 9) return; 
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Data = e.target.result.split(',')[1]; const id = Date.now() + Math.random(); 
            selectedImagesArray.push({ id: id, base64: base64Data, preview: e.target.result, name: '', price: '' }); renderIdleItemCards();
        }; reader.readAsDataURL(file);
    }); event.target.value = ''; 
}
function removeImage(id) { selectedImagesArray = selectedImagesArray.filter(img => img.id !== id); renderIdleItemCards(); updateTotalIdlePrice(); }
function updateItemData(id, field, value) { const item = selectedImagesArray.find(i => i.id === id); if (item) item[field] = value; if (field === 'price') updateTotalIdlePrice(); }
function updateTotalIdlePrice() { let total = 0; selectedImagesArray.forEach(i => { if (i.price && !isNaN(i.price)) total += parseFloat(i.price); }); const priceBox = document.getElementById('idlePrice'); if(priceBox) priceBox.value = total > 0 ? total : ''; }
function renderIdleItemCards() {
    const container = document.getElementById('idleImgPreviewContainer'); let html = '';
    selectedImagesArray.forEach((img) => { html += `<div class="item-edit-card"><img src="${img.preview}"><div class="item-edit-inputs"><input type="text" placeholder="物品名称 (如: 书桌)" value="${img.name}" onchange="updateItemData(${img.id}, 'name', this.value)"><div class="price-input-row"><span>€</span><input type="number" placeholder="价格" value="${img.price}" onchange="updateItemData(${img.id}, 'price', this.value)"></div></div><div class="item-del-btn" onclick="removeImage(${img.id})">✕</div></div>`; });
    if (selectedImagesArray.length < 9) { html += `<div class="upload-btn" onclick="document.getElementById('idleImgInput').click()" style="width: 100%; background: #FFF; border: 1px dashed #D1D5DB; margin-top: 5px;"><span style="font-size: 24px;">📷</span><span style="font-size: 13px; font-weight: bold; margin-left: 8px; color: #374151;">继续添加物品</span></div>`; }
    container.innerHTML = html;
}
function addTagToImage(previewUrl, name, price) {
    return new Promise((resolve) => {
        if (!name && !price) return resolve(previewUrl.split(',')[1]); 
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
            const tagText = `${name ? name + ' ' : ''}${price ? '€'+price : ''}`.trim(); const fontSize = Math.max(24, Math.floor(img.width * 0.045)); ctx.font = `bold ${fontSize}px sans-serif`;
            const paddingX = fontSize * 0.8; const paddingY = fontSize * 0.5; const textWidth = ctx.measureText(tagText).width; const x = img.width * 0.05; const y = img.height - img.width * 0.05 - fontSize;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'; ctx.beginPath(); if(ctx.roundRect) { ctx.roundRect(x, y, textWidth + paddingX * 2.2, fontSize + paddingY * 2, (fontSize + paddingY * 2) / 2); } else { ctx.fillRect(x, y, textWidth + paddingX * 2.2, fontSize + paddingY * 2); } ctx.fill();
            ctx.fillStyle = '#FCD34D'; ctx.beginPath(); ctx.arc(x + paddingX * 0.9, y + (fontSize + paddingY * 2)/2, fontSize * 0.25, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFFFFF'; ctx.fillText(tagText, x + paddingX * 1.6, y + fontSize + paddingY * 0.4); resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1]);
        }; img.src = previewUrl;
    });
}

function clearAIInput(type) { const input = document.getElementById(`aiKeywords_${type}`); if (input) { input.value = ''; input.focus(); } }
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; let recognition = null;
if (SpeechRecognition) { recognition = new SpeechRecognition(); recognition.lang = 'zh-CN'; recognition.continuous = false; recognition.interimResults = false; }
function toggleVoiceInput(type) {
    const btn = document.getElementById(`btnVoiceInput_${type}`); const input = document.getElementById(`aiKeywords_${type}`);
    if (!recognition) return showToast('请使用自带语音输入法');
    if (btn.classList.contains('recording')) { recognition.stop(); return; }
    btn.classList.add('recording'); btn.innerText = '🔴'; const oldPlaceholder = input.placeholder; input.placeholder = '听着呢...';
    try { recognition.start(); } catch(e) {}
    recognition.onresult = (event) => { input.value += event.results[0][0].transcript; };
    recognition.onend = () => { btn.classList.remove('recording'); btn.innerText = '🎙️'; input.placeholder = oldPlaceholder; if(input.value.trim() !== '') generateAICopy(type); };
    recognition.onerror = () => { btn.classList.remove('recording'); btn.innerText = '🎙️'; input.placeholder = oldPlaceholder; };
}

async function generateAICopy(type) {
    const inputEl = document.getElementById(`aiKeywords_${type}`); const keyword = inputEl.value.trim(); if (!keyword && type !== 'idle') return showToast("说点什么吧！");
    const oldVal = inputEl.value; inputEl.value = "⏳ AI提取中..."; inputEl.disabled = true;
    try {
        const payload = { keyword, type };
        if (type === 'idle') { let itemsStr = selectedImagesArray.map((i, idx) => `图${idx+1}: ${i.name||''} - €${i.price||''}`).join('\n'); payload.currentDesc = itemsStr; payload.currentPrice = document.getElementById('idlePrice') ? document.getElementById('idlePrice').value.trim() : 0; }
        const res = await fetch('/api/generate-copy', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
        const data = await res.json(); if(data.error) throw new Error(data.error);
        if (type === 'idle') { if(data.deadline && document.getElementById('idleDeadline')) document.getElementById('idleDeadline').value = data.deadline; if(data.location && document.getElementById('idleLocation')) document.getElementById('idleLocation').value = data.location; if(data.bargain) matchPills('bargainGroup', data.bargain); if(data.payment) matchPills('paymentGroup', data.payment); } else if (type === 'help') { if(data.copy && document.getElementById('helpDesc')) document.getElementById('helpDesc').value = data.copy; if(data.reward && document.getElementById('helpReward')) document.getElementById('helpReward').value = data.reward; if(data.location && document.getElementById('helpLocation')) document.getElementById('helpLocation').value = data.location; if(data.urgent) matchPills('helpUrgentGroup', data.urgent); } else if (type === 'partner') { if(data.title && document.getElementById('partnerTitle')) document.getElementById('partnerTitle').value = data.title; if(data.copy && document.getElementById('partnerDesc')) document.getElementById('partnerDesc').value = data.copy; if(data.location && document.getElementById('partnerLocation')) document.getElementById('partnerLocation').value = data.location; if(data.mbti) matchSelect('partnerMbti', data.mbti); }
        inputEl.value = "✨ 提取成功！";
    } catch (err) { showToast("失败：" + err.message); inputEl.value = oldVal; } finally { setTimeout(() => { inputEl.value = ''; inputEl.disabled = false; inputEl.placeholder="按住说：代村自提，明天拿走..."; }, 2000); }
}

async function submitIdlePost() {
    const loc = document.getElementById('idleLocation') ? document.getElementById('idleLocation').value : ''; const deadline = document.getElementById('idleDeadline') ? document.getElementById('idleDeadline').value : ''; const bargain = document.querySelector('#bargainGroup .active') ? document.querySelector('#bargainGroup .active').innerText : ''; const payment = document.querySelector('#paymentGroup .active') ? document.querySelector('#paymentGroup .active').innerText : ''; const totalPriceBox = document.getElementById('idlePrice'); const totalPrice = totalPriceBox ? totalPriceBox.value.trim() || '0' : '0';
    if(selectedImagesArray.length === 0) return showToast("请至少传一张照片！");
    const btn = document.querySelector('#publishIdleModal .fm-submit'); btn.innerText = "打水印中..."; btn.style.pointerEvents = 'none';
    try {
        let finalItemsData = [];
        for (let img of selectedImagesArray) { const taggedBase64 = await addTagToImage(img.preview, img.name, img.price); const res = await fetch('/api/upload', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ imageBase64: taggedBase64 }) }); const data = await res.json(); if(data.success) { finalItemsData.push({ id: img.id, url: data.url, name: img.name, price: img.price, is_sold: false }); } }
        const contentJson = JSON.stringify({ items: finalItemsData, conditions: { loc, deadline, bargain, payment } }); const finalTitle = `[闲置] €${totalPrice} · ${loc.split(' (')[0]}`; const authorName = localStorage.getItem('hp_name') || '管家新人';
        const resDb = await fetch('/api/publish-community', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ userId: userUUID, authorName: authorName, title: finalTitle, text: contentJson, imageUrl: '' }) }); const resData = await resDb.json(); if(!resData.success) throw new Error(resData.error);
        showToast("🎉 发布成功！"); closeIdlePublish(); selectedImagesArray = []; renderIdleItemCards(); if(totalPriceBox) totalPriceBox.value = ''; loadCommunityPosts(); 
    } catch(e) { showToast("失败：" + e.message); } finally { btn.innerText = "发布"; btn.style.pointerEvents = 'auto'; }
}
async function submitHelpPost() {
    const desc = document.getElementById('helpDesc') ? document.getElementById('helpDesc').value.trim() : ''; const reward = document.getElementById('helpReward') ? document.getElementById('helpReward').value.trim() : '0'; const urgentGroup = document.querySelector('#helpUrgentGroup .active'); const urgent = urgentGroup && urgentGroup.innerText.includes('十万火急') ? '🔥急' : '普通';
    if(!desc) return showToast("写点什么哦！"); const btn = document.querySelector('#publishHelpModal .fm-submit'); btn.innerText = "发送中..."; btn.style.pointerEvents = 'none';
    try { const finalTitle = `[互助-${urgent}] 赏金 €${reward || '0'}`; const authorName = localStorage.getItem('hp_name') || '管家新人'; const res = await fetch('/api/publish-community', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ userId: userUUID, authorName: authorName, title: finalTitle, text: desc, imageUrl: '' }) }); if(!res.ok) throw new Error("失败"); showToast("🎉 发布成功！"); closeHelpPublish(); if(document.getElementById('helpDesc')) document.getElementById('helpDesc').value = ''; loadCommunityPosts(); } catch(e) { showToast(e.message); } finally { btn.innerText = "发布"; btn.style.pointerEvents = 'auto'; }
}
async function submitPartnerPost() {
    const title = document.getElementById('partnerTitle') ? document.getElementById('partnerTitle').value.trim() : ''; const desc = document.getElementById('partnerDesc') ? document.getElementById('partnerDesc').value.trim() : '';
    if(!title) return showToast("写个标题吧！"); const btn = document.querySelector('#publishPartnerModal .fm-submit'); btn.innerText = "发送中..."; btn.style.pointerEvents = 'none';
    try { const finalTitle = `[找搭子] ${title}`; const authorName = localStorage.getItem('hp_name') || '管家新人'; const res = await fetch('/api/publish-community', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ userId: userUUID, authorName: authorName, title: finalTitle, text: desc, imageUrl: '' }) }); if(!res.ok) throw new Error("失败"); showToast("🎉 发布成功！"); closePartnerPublish(); if(document.getElementById('partnerTitle')) document.getElementById('partnerTitle').value = ''; if(document.getElementById('partnerDesc')) document.getElementById('partnerDesc').value = ''; loadCommunityPosts(); } catch(e) { showToast(e.message); } finally { btn.innerText = "发布"; btn.style.pointerEvents = 'auto'; }
}


// ================= 7. 社区数据拉取与渲染 =================
let mockIdleItems = []; let mockHelpItems = []; let mockPartnerItems = []; window.allCommunityPostsCache = [];
let mockQuestionItems = [];

async function loadCommunityPosts() {
    try {
        const res = await fetch('/api/get-community'); const data = await res.json();
        if (data.success && data.posts) {
            mockIdleItems = []; mockHelpItems = []; mockPartnerItems = []; mockQuestionItems = []; window.allCommunityPostsCache = data.posts; 
            data.posts.forEach(post => {
                const title = post.title || ''; const time = new Date(post.created_at).getTime() || Date.now(); const author = post.author_name || '匿名管家';
                let payload; try { payload = JSON.parse(post.content); } catch(e) { payload = { oldText: post.content }; }

                let badgeHtml = `<span class="trust-badge badge-none">游客</span>`;
                if (post.verified_email) {
                    const domain = post.verified_email.split('@')[1] || '';
                    const isEdu = domain.includes('.edu') || domain.includes('tudelft.nl') || domain.includes('uva.nl') || domain.includes('eur.nl') || domain.includes('leidenuniv.nl');
                    if (isEdu) {
                        const uniName = domain.split('.')[0].toUpperCase();
                        badgeHtml = `<span class="trust-badge badge-edu">🎓 ${uniName}校友</span>`;
                    } else {
                        badgeHtml = `<span class="trust-badge badge-work">✅ 已实名</span>`;
                    }
                }

                if (title.includes('[闲置]')) {
                    const firstImg = (payload.items && payload.items.length > 0) ? payload.items[0].url : 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&auto=format&fit=crop';
                    const priceMatch = title.match(/€(\d+(\.\d+)?)/); const price = priceMatch ? priceMatch[1] : '面议';
                    const isAllSold = payload.items ? payload.items.every(i => i.is_sold) : false; const itemCount = payload.items ? payload.items.length : 0;
                    mockIdleItems.push({ userId: post.user_id, id: post.id, img: firstImg, title: title.replace('[闲置] ', ''), price: price, priceNum: parseFloat(price) || 0, avatar: "😎", name: author, badge: badgeHtml, credit: "极佳", creditClass: "excellent", isSold: isAllSold, itemCount: itemCount, timestamp: time });
                } else if (title.includes('[互助')) {
                    const rewardMatch = title.match(/€(\d+(\.\d+)?)/); const reward = rewardMatch ? rewardMatch[1] : '0'; const isUrgent = title.includes('🔥急');
                    mockHelpItems.push({ userId: post.user_id, id: post.id, type: isUrgent ? "🔥 紧急" : "🤝 求助", isUrgent: isUrgent, title: payload.oldText ? payload.oldText.substring(0,40)+'...' : title, reward: reward, rewardNum: parseFloat(reward) || 0, date: "私信沟通", location: "荷兰", avatar: "🐼", name: author, badge: badgeHtml, credit: "新人", creditClass: "new", distKm: 1, timestamp: time, imgIcon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23EFF6FF'/><text x='50%' y='50%' font-size='20' text-anchor='middle' dominant-baseline='middle'>🤝</text></svg>" });
                } else if (title.includes('[找搭子]')) {
                    mockPartnerItems.push({ userId: post.user_id, id: post.id, avatar: "👱‍♀️", name: author, badge: badgeHtml, gender: "f", mbti: "未知", mbtiType: "all", title: title.replace('[找搭子] ', ''), desc: payload.oldText || '', tags: ["✨ 新发布"], distKm: 1, daysAway: 1, timestamp: time });
                }else if (title.includes('[问答]')) {
                    mockQuestionItems.push({ userId: post.user_id, id: post.id, avatar: "🤔", name: author, badge: badgeHtml, title: title.replace('[问答] ', ''), desc: payload.oldText || '', timestamp: time });
                }
            });
            applyMarketFilters('idle'); applyMarketFilters('help'); applyMarketFilters('partner'); applyMarketFilters('question');
        }
    } catch (err) {}
}

// ================= 📰 Pro 模式新闻渲染引擎 =================
function renderProNews() {
    const newsContainer = document.getElementById('proNewsList');
    if (!newsContainer) return;

    // 模拟来自 Nu.nl 或 NOS 的最新重大新闻
    const newsData = [
        { time: "10:30", title: "NS 宣布周五早高峰全线停运，工会要求加薪8%", source: "源自 NU.nl", views: "1.2k" },
        { time: "09:15", title: "荷兰议会通过新规：Box 3 财富税计算方式将于明年大改", source: "源自 RTL Nieuws", views: "3.5k" },
        { time: "昨夜", title: "鹿特丹 Zuid 区域发生汽车焚烧事件，警方已介入调查", source: "源自 AD.nl", views: "980" },
    ];

    let html = '';
    newsData.forEach(item => {
        html += `
        <div class="news-item" onclick="showToast('正文翻译页即将上线！', 'success')">
            <div class="news-time">${item.time}</div>
            <div class="news-content">
                <div class="news-title">${item.title}</div>
                <div class="news-source"><span>🔗 ${item.source}</span> <span>👀 ${item.views} 阅</span></div>
            </div>
        </div>`;
    });
    newsContainer.innerHTML = html;
}

// 找到现有的 window.addEventListener('DOMContentLoaded', ...)
// 确保在里面加上 renderProNews(); 以便网页一加载就准备好新闻。


function renderMarketIdle(data = mockIdleItems) { 
    const container = document.getElementById('idleWaterfall'); if(!container) return; 
    if(data.length === 0) { container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:40px 0; grid-column:span 2;">空空如也，快去发一个吧！</div>'; return; } 
    let html = ''; 
    data.forEach(item => { 
        const soldOverlayHtml = item.isSold ? `<div class="wf-sold-overlay"><div class="wf-sold-text">已售空</div></div>` : ''; 
        const countBadge = item.itemCount > 1 ? `<div class="waterfall-count-badge">共 ${item.itemCount} 件</div>` : ''; 
        html += `<div class="waterfall-item" onclick="openCommunityPost(${item.id})"><div class="wf-img-box">${soldOverlayHtml}${countBadge}<img class="wf-img" src="${item.img}"></div><div class="wf-info"><div class="wf-title" style="${item.isSold ? 'color:#9CA3AF;' : ''}">${item.title}</div><div class="wf-price-row"><span class="wf-currency" style="${item.isSold ? 'color:#9CA3AF;' : ''}">€</span><span class="wf-price" style="${item.isSold ? 'color:#9CA3AF;' : ''}">${item.price}</span></div><div class="wf-user-row"><div class="wf-user"><div class="wf-avatar">${item.avatar}</div><div class="wf-name">${item.name}${item.badge}</div></div></div></div></div>`; 
    }); 
    container.innerHTML = html; 
}

function renderMarketHelp(data = mockHelpItems) { 
    const container = document.getElementById('helpListContainer'); if(!container) return; 
    if(data.length === 0) { container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:40px 0; grid-column:span 2;">暂时没有符合条件的悬赏单~</div>'; return; } 
    let html = ''; 
    data.forEach(item => { 
        const tagClass = item.isUrgent ? 'hc-type-tag urgent' : 'hc-type-tag'; const tagText = item.isUrgent ? `🔥 急·${item.type.split(' ')[1]}` : item.type.split(' ')[1]; 
        html += `<div class="help-card" onclick="openChat('${item.userId}', '${item.name}', '${item.avatar}', ${item.id}, '${item.title}', '${item.reward}', \`${item.imgIcon}\`, false, 'help')"><div class="hc-top-row"><div class="${tagClass}">${tagText}</div><div class="hc-reward-compact">€${item.reward}</div></div><div class="hc-title">${item.title}</div><div class="hc-details"><div class="hc-detail-item"><span>⏰</span> ${item.date}</div><div class="hc-detail-item"><span>📍</span> ${item.location}</div></div><div class="hc-footer"><div class="hc-user"><div class="hc-avatar">${item.avatar}</div><div class="hc-name">${item.name}${item.badge}</div></div><div class="hc-action-btn">立即私信</div></div></div>`; 
    }); 
    container.innerHTML = html; 
}

function renderMarketPartner(data = mockPartnerItems) { 
    const container = document.getElementById('partnerListContainer'); if(!container) return; 
    if(data.length === 0) { container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:40px 0; grid-column:span 2;">没有找到合适的搭子，自己发一个吧！</div>'; return; } 
    let html = ''; 
    data.forEach(item => { 
        let themeClass = ''; const titleStr = item.title + item.desc;
        if (titleStr.includes('蹦迪') || titleStr.includes('酒吧') || titleStr.includes('音乐节')) themeClass = 'theme-party';
        else if (titleStr.includes('看展') || titleStr.includes('旅游') || titleStr.includes('摄影')) themeClass = 'theme-art';
        else if (titleStr.includes('饭') || titleStr.includes('探店') || titleStr.includes('火锅')) themeClass = 'theme-food';
        else if (titleStr.includes('自习') || titleStr.includes('图书馆') || titleStr.includes('雅思')) themeClass = 'theme-study';

        const interestedCount = Math.floor(Math.random() * 5) + 2; 
        const emojis = ['👱‍♀️', '😎', '🐼', '👻', '🐶']; const randomEmojis = emojis.sort(() => 0.5 - Math.random()).slice(0, 3);
        const avatarsHtml = randomEmojis.map(e => `<div class="pc-mini-avatar">${e}</div>`).join('');
        const genderIcon = item.gender === 'f' ? '♀' : '♂'; 
        const tagsHtml = item.tags.slice(0, 2).map(t => `<div class="pc-tag">${t}</div>`).join(''); 
        const iconSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23F3E8FF'/><text x='50%' y='50%' font-size='20' text-anchor='middle' dominant-baseline='middle'>🥂</text></svg>`; 
        
        html += `
        <div class="partner-card ${themeClass}">
            <div class="pc-header" onclick="openChat('${item.userId}', '${item.name}', '${item.avatar}', ${item.id}, '${item.title}', '0', \`${iconSvg}\`, false, 'partner')">
                <div class="pc-user"><div class="pc-avatar">${item.avatar}</div><div class="pc-info"><div class="pc-name-row"><span class="pc-name">${item.name}</span>${item.badge}<span class="pc-gender ${item.gender}" style="margin-left:4px;">${genderIcon}</span></div><span class="pc-mbti">${item.mbti}</span></div></div>
            </div>
            <div onclick="openChat('${item.userId}', '${item.name}', '${item.avatar}', ${item.id}, '${item.title}', '0', \`${iconSvg}\`, false, 'partner')">
                <div class="pc-title">${item.title}</div><div class="pc-desc">${item.desc}</div><div class="pc-tags">${tagsHtml}</div>
                <div class="pc-social-proof"><div class="pc-social-avatars">${avatarsHtml}</div><span>等 ${interestedCount} 人很感兴趣...</span></div>
                <div class="pc-footer" style="padding-bottom: 5px;"><div class="pc-dist"><span>🚲</span> 骑车约 ${Math.ceil(item.distKm * 3.5)} 分钟</div></div>
            </div>
            <div class="pc-action-row">
                <div class="pc-action-btn-main" onclick="openChat('${item.userId}', '${item.name}', '${item.avatar}', ${item.id}, '${item.title}', '0', \`${iconSvg}\`, false, 'partner')">👋 滴滴Ta</div>
                <div class="pc-action-btn-share" onclick="sharePartnerPost('${item.title}')"><span style="font-size: 16px;">💬</span> 捞人</div>
            </div>
        </div>`; 
    }); 
    container.innerHTML = html; 
}

function sharePartnerPost(title) {
    const textToCopy = `✨ 捞个搭子！\n\n【${title}】\n\n有 ${Math.floor(Math.random()*5)+2} 个校友已经感兴趣啦，快来上车！\n👉 点击链接看详情直接私信：\nhttps://hebao.nl/p/${Math.floor(Math.random()*10000)}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
        const plus = document.createElement('div'); plus.className = 'float-plus'; plus.innerHTML = '✅ <b>复制成功！</b><br><span style="font-size:12px; font-weight:normal;">快去丢到微信群里捞人吧~</span>'; 
        plus.style.color = '#10B981'; plus.style.background = '#FFF'; plus.style.border = '1px solid #A7F3D0'; plus.style.textAlign = 'center'; plus.style.left = '50%'; plus.style.top = '40%'; plus.style.transform = 'translate(-50%, -50%)'; 
        document.body.appendChild(plus); setTimeout(() => plus.remove(), 2500);
    }).catch(err => { showToast("复制失败，请手动转发哦~"); });
}

function renderMarketQuestion(data = mockQuestionItems) { 
    const container = document.getElementById('questionListContainer'); if(!container) return; 
    if(data.length === 0) { container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:40px 0;">目前还没有问题，来做第一个提问者吧！</div>'; return; } 
    let html = ''; 
    data.forEach(item => { 
        const tagMatch = item.title.match(/^(.*?)\s-/); const tag = tagMatch ? tagMatch[1] : '🙋 综合问答'; const cleanTitle = item.title.replace(/^(.*?)\s-\s/, '');
        html += `<div class="question-card" onclick="openChat('${item.userId}', '${item.name}', '${item.avatar}', ${item.id}, '解答你的提问: ${cleanTitle}', '0', '', false, 'question')"><div class="qc-header"><div class="qc-tag">${tag}</div></div><div class="qc-title">${cleanTitle}</div><div class="qc-desc">${item.desc}</div><div class="qc-footer"><div class="qc-user"><span>${item.avatar}</span> ${item.name} ${item.badge}</div><div class="qc-answer-btn">✍️ 去解答</div></div></div>`; 
    }); 
    container.innerHTML = html; 
}

function toggleFilterPill(element, type) { element.classList.toggle('active'); applyMarketFilters(type); }
function applyMarketFilters(type) {
    if (type === 'idle') {
        const sortMode = document.getElementById('sortIdle')?.value || 'newest'; const onlyBargain = document.getElementById('pillIdleBargain')?.classList.contains('active'); 
        let filtered = [...mockIdleItems]; 
        if (onlyBargain) filtered = filtered.filter(item => item.isBargain); 
        if (sortMode === 'priceAsc') filtered.sort((a, b) => a.priceNum - b.priceNum); 
        else if (sortMode === 'priceDesc') filtered.sort((a, b) => b.priceNum - a.priceNum); 
        else filtered.sort((a, b) => b.timestamp - a.timestamp); 
        renderMarketIdle(filtered); 
    } else if (type === 'help') {
        const sortMode = document.getElementById('sortHelp')?.value || 'newest'; const onlyUrgent = document.getElementById('pillHelpUrgent')?.classList.contains('active'); 
        let filtered = [...mockHelpItems]; 
        if (onlyUrgent) filtered = filtered.filter(item => item.isUrgent); 
        if (sortMode === 'rewardDesc') filtered.sort((a, b) => b.rewardNum - a.rewardNum); 
        else if (sortMode === 'distAsc') filtered.sort((a, b) => a.distKm - b.distKm); 
        else filtered.sort((a, b) => b.timestamp - a.timestamp); 
        renderMarketHelp(filtered); 
    } else if (type === 'partner') {
        const sortMode = document.getElementById('sortPartner')?.value || 'newest'; const mbtiMode = document.getElementById('filterMBTI')?.value || 'all'; 
        let filtered = [...mockPartnerItems]; 
        if (mbtiMode !== 'all') filtered = filtered.filter(item => item.mbtiType === mbtiMode); 
        if (sortMode === 'timeAsc') filtered.sort((a, b) => a.daysAway - b.daysAway); 
        else if (sortMode === 'distAsc') filtered.sort((a, b) => a.distKm - b.distKm); 
        else filtered.sort((a, b) => b.timestamp - a.timestamp); 
        renderMarketPartner(filtered); 
    } else if (type === 'question') { renderMarketQuestion(); }
}


// ================= 8. 集市详情页与操作 =================
// ================= 8. 闲置详情页与交互 (高级重构版) =================
let currentCommunityPost = null; 
let selectedItemIds = new Set(); 
let currentTotalPrice = 0;

function openCommunityPost(postId) {
    const modal = document.getElementById('postDetailModal');
    if (!modal) return;
    
    // 1. 初始化重置状态
    selectedItemIds = new Set();
    currentTotalPrice = 0;
    document.getElementById('pdTotalPrice').innerText = `€0.00`;
    document.getElementById('pdChatBtn').innerText = `私信想要 (0件)`;
    modal.style.display = 'flex'; 

    // 2. 查找数据
    const post = mockIdleItems.find(p => p.id === postId) || window.allCommunityPostsCache?.find(p => p.id === postId);
    if (!post) return;
    currentCommunityPost = post;

    // 3. 渲染顶部卖家信息 (高级微拟物排版)
    document.getElementById('pdSellerInfo').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="display:flex; align-items:center; gap:12px;">
                <div class="pd-seller-avatar">${post.avatar || '😎'}</div>
                <div style="display:flex; flex-direction:column; gap:2px;">
                    <div class="pd-seller-name">${post.name || '热心校友'} ${post.badge || ''}</div>
                    <div class="pd-seller-time">发布于近期</div>
                </div>
            </div>
            <div style="background:#F3F4F6; color:#6B7280; padding:6px 12px; border-radius:14px; font-size:12px; font-weight:bold;">
                信用 ${post.credit || '良好'}
            </div>
        </div>
    `;

    // 4. 核心：解析多物品数据并渲染沉浸式瀑布流
    let payload;
    try { payload = JSON.parse(post.content); } catch(e) { payload = { items: [{ id: 'item1', name: post.title, price: post.priceNum, url: post.img, is_sold: post.isSold }] }; }
    
    const listContainer = document.getElementById('pdItemsList');
    let itemsHtml = '';

    if (payload.items && payload.items.length > 0) {
        payload.items.forEach(item => {
            const isSold = item.is_sold;
            const priceNum = parseFloat(item.price) || 0;
            const cardClass = isSold ? 'pd-item-card sold' : 'pd-item-card';
            
            // 🌟 高级卡片：背景图 + 底部暗黑渐变蒙层 + 文字与勾选框
            itemsHtml += `
            <div class="${cardClass}" onclick="${isSold ? '' : `toggleItemCard(this, '${item.id}', ${priceNum})`}">
            <img class="pd-item-img" src="${item.url || 'https://via.placeholder.com/400'}" style="height: 220px;" onclick="event.stopPropagation(); openLightbox(this.src)">
                <div class="pd-item-overlay">
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; width:100%;">
                        <div style="flex:1; overflow:hidden; padding-right:10px;">
                            <div class="pd-item-name">${item.name || '闲置好物'}</div>
                            <div class="pd-item-price">€${item.price}</div>
                        </div>
                        ${isSold ? '<div class="pd-sold-badge">已售出</div>' : `<input type="checkbox" class="custom-checkbox" id="chk_${item.id}" onclick="event.stopPropagation(); toggleItemCheckbox(this, '${item.id}', ${priceNum})">`}
                    </div>
                </div>
            </div>`;
        });
    }
    listContainer.innerHTML = itemsHtml;
}

// 5. 卡片点击穿透选择逻辑
function toggleItemCard(cardEl, itemId, price) {
    const chk = document.getElementById(`chk_${itemId}`);
    if (!chk) return;
    chk.checked = !chk.checked; // 切换复选框
    toggleItemCheckbox(chk, itemId, price);
}

// 6. 核心价格与数量计算
function toggleItemCheckbox(checkbox, itemId, price) {
    if (checkbox.checked) {
        selectedItemIds.add(itemId);
        currentTotalPrice += price;
    } else {
        selectedItemIds.delete(itemId);
        currentTotalPrice -= price;
    }
    // 防止浮点数精度问题 (如 0.300000000004)
    currentTotalPrice = Math.max(0, currentTotalPrice);
    document.getElementById('pdTotalPrice').innerText = `€${currentTotalPrice.toFixed(2)}`;
    document.getElementById('pdChatBtn').innerText = `私信想要 (${selectedItemIds.size}件)`;
}

// 7. 发起聊天闭环
function initiateBuyChat() {
    if (selectedItemIds.size === 0) return showToast("👉 请先点击图片，勾选您想要的物品哦！");
    
    let payload;
    try { payload = JSON.parse(currentCommunityPost.content); } catch(e) { payload = { items: [{ id: 'item1', name: currentCommunityPost.title, url: currentCommunityPost.img }] }; }
    
    // 找出买家选中的所有商品名称
    let wantNames = payload.items.filter(i => selectedItemIds.has(i.id)).map(i => i.name).join('、');
    const firstItemImg = payload.items.find(i => selectedItemIds.has(i.id))?.url || currentCommunityPost.img;
    
    openChat(currentCommunityPost.user_id, currentCommunityPost.author_name, '😎', currentCommunityPost.id, `想要这几件 (€${currentTotalPrice.toFixed(2)})`, currentTotalPrice.toFixed(2), firstItemImg, false, 'idle');
    
    // 自动在输入框里填入打招呼话术
    const input = document.getElementById('chatInput'); 
    if(input) input.value = `哈喽！我想要你清单里的：【${wantNames}】，请问还在吗？`;
    
    closePostDetail();
}

function closePostDetail() { 
    document.getElementById('postDetailModal').style.display = 'none'; 
}

async function markItemSold(postId, itemId, event) {
    if(!confirm("标记售出后无法恢复，确定吗？")) return;
    const btn = event.target; btn.innerText = "更新中..."; btn.style.pointerEvents = "none";
    let payload = JSON.parse(currentCommunityPost.content); payload.items.forEach(i => { if(i.id === itemId) i.is_sold = true; });
    try {
        const res = await fetch('/api/update-post', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ postId: postId, userId: userUUID, newContent: JSON.stringify(payload) }) });
        const data = await res.json(); if(!data.success) throw new Error(data.error); loadCommunityPosts(); openCommunityPost(postId);
    } catch(e) { showToast("更新失败"); btn.innerText = "标为售出"; btn.style.pointerEvents = "auto"; }
}

// ================= 💬 全局消息会话列表逻辑 =================

// 当用户点击底部的“消息”Tab时，拉取会话列表
function loadConversations() {
    // 每次进入消息页面，先显示加载中
    const container = document.getElementById('conversationList');
    const emptyState = document.getElementById('msgEmptyState');
    if (!container) return;

    if (!userUUID) {
        if(emptyState) emptyState.style.display = 'block';
        container.innerHTML = '<div style="text-align:center; color:#9CA3AF; font-size:12px; padding:20px;">请先登录查看消息</div>';
        return;
    }

    // 尝试从后端拉取真实会话列表 (需要你后端提供 /api/get-conversations 接口)
    fetch(`/api/get-conversations?userId=${userUUID}`, { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.conversations && data.conversations.length > 0) {
                renderConversationList(data.conversations);
            } else {
                // 如果后端没数据，尝试渲染本地缓存，或者显示空状态
                renderFallbackConversations();
            }
        })
        .catch(err => {
            console.log("拉取会话列表失败，使用本地回退方案");
            renderFallbackConversations();
        });
}

// 渲染列表的 UI 函数
function renderConversationList(conversations) {
    const container = document.getElementById('conversationList');
    const emptyState = document.getElementById('msgEmptyState');
    
    if (conversations.length === 0) {
        if(emptyState) emptyState.style.display = 'block';
        container.innerHTML = '';
        return;
    }

    if(emptyState) emptyState.style.display = 'none';
    let html = '';
    
    conversations.forEach(conv => {
        // 格式化时间 (例如：10:30 或 昨天)
        const timeStr = new Date(conv.last_time || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // 🌟 点击某一行，直接把参数传给 openChat 恢复聊天！
        html += `
        <div class="msg-list-item" onclick="openChat('${conv.partner_id}', '${conv.partner_name}', '${conv.partner_avatar}', '${conv.post_id}', '${conv.post_title}', '${conv.post_price || '0'}', '${conv.post_img}', false)">
            <div class="msg-avatar">${conv.partner_avatar || '😎'}</div>
            <div class="msg-content">
                <div class="msg-header">
                    <div class="msg-name">${conv.partner_name || '热心校友'}</div>
                    <div class="msg-time">${timeStr}</div>
                </div>
                <div class="msg-text">${conv.last_message || '[图片/商品链接]'}</div>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

// （测试用）当你后端没写好时，让你能看到效果的假数据
function renderFallbackConversations() {
    // 假设你刚才给一个叫“张三”的人发了消息
    const mockData = [
        {
            partner_id: "mock_user_001",
            partner_name: "代村卖车学长",
            partner_avatar: "🚲",
            post_id: "1",
            post_title: "九成新自行车",
            post_price: "45",
            post_img: "https://via.placeholder.com/100",
            last_message: "你好，请问自行车还能再便宜点吗？",
            last_time: Date.now()
        },
        {
            partner_id: "mock_user_002",
            partner_name: "阿姆拼车群主",
            partner_avatar: "🚗",
            post_id: "2",
            post_title: "周末去鲁尔蒙德看展",
            post_price: "0",
            post_img: "",
            last_message: "我刚才发了我的微信给你，你加我一下~",
            last_time: Date.now() - 3600000 // 一小时前
        }
    ];
    renderConversationList(mockData);
}
// ================= 9. 真实私信聊天系统 (终极净化版) =================
let currentChatPartnerId = null; let currentChatPostId = null; let chatPollingInterval = null;

function openChat(targetId, targetName, targetAvatar, postId, postTitle, postPrice, postImg, isSold, postType = 'idle') {
    requireAuth(() => {
        if (targetId === userUUID) return showToast("💡 管家提示：不能给自己发私信哦！");
        currentChatPartnerId = targetId; currentChatPostId = postId;
        const modal = document.getElementById('chatModal'); if (!modal) return showToast("聊天窗口未初始化");
        
        modal.style.display = 'flex'; // ⚠️ 保证排版绝对稳定

        document.getElementById('chatTargetName').innerText = targetName || '联系卖家';
        document.getElementById('chatTargetAvatar').innerText = targetAvatar || '😎';
        document.getElementById('chatProductTitle').innerText = postTitle || '商品信息';
        document.getElementById('chatProductPrice').innerText = '€' + (postPrice || '0.00');

        const imgEl = document.getElementById('chatProductImg');
        if (imgEl) {
            if (postImg && (postImg.startsWith('http') || postImg.startsWith('data:image'))) { imgEl.src = postImg; } 
            else { imgEl.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23F3F4F6'/><text x='50%' y='50%' font-size='12' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'>暂无图片</text></svg>"; }
        }
        imgEl.onclick = function() { openLightbox(this.src); };

        const disabledBox = document.getElementById('chatInputDisabled'); const inputBar = document.getElementById('chatInputBar');
        const quickReplies = document.getElementById('chatQuickReplies'); const actionBtn = document.getElementById('cpsActionBtn'); const soldStamp = document.getElementById('cpsSoldStamp');

        if (isSold) {
            if(actionBtn) actionBtn.style.display = 'none'; if(soldStamp) soldStamp.style.display = 'block'; if(disabledBox) disabledBox.style.display = 'block'; if(inputBar) inputBar.style.display = 'none'; if(quickReplies) quickReplies.style.display = 'none';
        } else {
            if(actionBtn) actionBtn.style.display = 'block'; if(soldStamp) soldStamp.style.display = 'none'; if(disabledBox) disabledBox.style.display = 'none'; if(inputBar) inputBar.style.display = 'flex'; if(quickReplies) quickReplies.style.display = 'flex';
        }

        const msgList = document.getElementById('chatMsgList'); msgList.innerHTML = '<div style="text-align:center; color:#9CA3AF; font-size:12px; margin-top:20px;">加载历史消息中...</div>';
        loadChatHistory(); if(chatPollingInterval) clearInterval(chatPollingInterval); chatPollingInterval = setInterval(loadChatHistory, 3000);
    });
}

function closeChat() { document.getElementById('chatModal').style.display = 'none'; if(chatPollingInterval) clearInterval(chatPollingInterval); }

async function loadChatHistory() {
    if (!currentChatPartnerId || !currentChatPostId) return;
    try {
        const res = await fetch(`/api/get-messages?u1=${userUUID}&u2=${currentChatPartnerId}&postId=${currentChatPostId}`);
        const data = await res.json();
        if (data.success) {
            const msgList = document.getElementById('chatMsgList');
            const savedAvatar = localStorage.getItem('hebao_avatar') || ''; const myAvatarHtml = savedAvatar ? `<img src="${savedAvatar}">` : `<span>😎</span>`;
            const otherAvatarHtml = document.getElementById('chatTargetAvatar').innerText;
            let html = `<div class="chat-time-sys">聊天已加密端到端保护</div>`;
            data.messages.forEach(msg => {
                const isMe = msg.sender_id === userUUID; const avatar = isMe ? myAvatarHtml : `<span>${otherAvatarHtml}</span>`; const rowClass = isMe ? 'me' : 'other';
                html += `<div class="chat-row ${rowClass}"><div class="chat-text">${msg.content}</div><div class="chat-avatar">${avatar}</div></div>`;
            });
            const shouldScroll = msgList.innerHTML.length !== html.length; msgList.innerHTML = html; if (shouldScroll) msgList.scrollTop = msgList.scrollHeight;
        }
    } catch(e) {}
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput'); const text = input.value.trim(); if(!text) return;
    const msgList = document.getElementById('chatMsgList'); const savedAvatar = localStorage.getItem('hebao_avatar') || ''; const avatarHtml = savedAvatar ? `<img src="${savedAvatar}">` : `<span>😎</span>`;
    msgList.insertAdjacentHTML('beforeend', `<div class="chat-row me"><div class="chat-text">${text}</div><div class="chat-avatar">${avatarHtml}</div></div>`); input.value = ''; msgList.scrollTop = msgList.scrollHeight; 
    try { await fetch('/api/send-message', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ senderId: userUUID, receiverId: currentChatPartnerId, postId: currentChatPostId, content: text }) }); } catch(e) { showToast("消息发送失败"); }
}

function sendQuickMessage(text) {
    const input = document.getElementById('chatInput');
    if (input) {
        input.value = text;
        if (typeof sendChatMessage === 'function') sendChatMessage();
    }
}

// ================= 10. 我的发布拉取与删除 =================
async function loadMyPosts() {
    if (!isLoggedIn) return;
    const listDiv = document.getElementById('myPostsList'); const emptyState = document.getElementById('postsEmptyState');
    try {
        const res = await fetch(`/api/get-my-posts?userId=${userUUID}`, { headers: getAuthHeaders() }); const data = await res.json();
        if (data.success && data.posts && data.posts.length > 0) {
            if(emptyState) emptyState.style.display = 'none'; let html = '';
            data.posts.forEach(post => {
                let imgUrl = ''; try { const payload = JSON.parse(post.content); if(payload.items && payload.items.length > 0) imgUrl = payload.items[0].url; } catch(e) { imgUrl = post.image_url ? post.image_url.split(',')[0] : ''; }
                const imgHtml = imgUrl ? `<img src="${imgUrl}" style="width:64px; height:64px; object-fit:cover; border-radius:12px; flex-shrink:0; border: 1px solid #E5E7EB;">` : `<div style="width:64px; height:64px; background:#F9FAFB; border-radius:12px; display:flex; justify-content:center; align-items:center; font-size:24px; flex-shrink:0; border: 1px solid #E5E7EB;">📄</div>`;
                html += `<div style="background:#FFF; border-radius:16px; padding:12px; margin-bottom:12px; border:1px solid #E5E7EB; box-shadow: 0 2px 8px rgba(0,0,0,0.02); display:flex; gap:12px; align-items:center;">${imgHtml}<div style="flex:1; overflow:hidden;"><div style="font-size:14px; font-weight:900; color:#111827; margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${post.title}</div><div style="font-size:12px; color:#6B7280;">发布于 ${new Date(post.created_at).toLocaleDateString()}</div></div><div style="background:#FEF2F2; color:#EF4444; padding:6px 14px; border-radius:14px; font-size:12px; font-weight:bold; cursor:pointer;" onclick="deleteMyPost(${post.id}, this)">下架</div></div>`;
            });
            if(listDiv) listDiv.innerHTML = html;
        } else { if(emptyState) emptyState.style.display = 'block'; if(listDiv) listDiv.innerHTML = ''; }
    } catch (e) {}
}
async function deleteMyPost(postId, btnElement) {
    if(!confirm('确定要下架这条发布吗？')) return;
    const originalText = btnElement.innerText; btnElement.innerText = "处理中..."; btnElement.style.pointerEvents = "none";
    try {
        const res = await fetch('/api/delete-post', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ postId: postId, userId: userUUID }) });
        const data = await res.json();
        if(data.success) { loadMyPosts(); loadCommunityPosts(); } else { showToast('删除失败'); btnElement.innerText = originalText; btnElement.style.pointerEvents = "auto"; }
    } catch(e) { showToast('网络错误'); btnElement.innerText = originalText; btnElement.style.pointerEvents = "auto"; }
}


// ================= 11. 生存红宝书：干货与打卡数据 =================
const rbTaskData = {
    'pre': [
        { id: 'p1', title: '核心文件随身带', desc: '护照、MVV签证信、录取通知书、出生双认证。放随身包，万一行李丢了也能办手续！', hook: '买个好用的防盗护照包', hookTab: 'market-idle' },
        { id: 'p2', title: '预约市政厅 (Gemeente)', desc: '8-9月号源极度紧张，拿到 BSN 才能办银行卡。务必在国内提前预约落地后的号！', hook: '找学长有偿指导预约', hookTab: 'market-help' },
        { id: 'p3', title: '办理双币信用卡', desc: '办父母名下的 Visa/Mastercard 副卡。落地没办出当地卡时，全靠它吃饭买票。', hook: '发悬赏问哪家银行汇率好', hookTab: 'market-help' },
        { id: 'p4', title: '兑换少量欧元零钱', desc: '换 €300 左右现金，要求必须给 €50 及以下面额！荷兰很多店拒收 €100 以上大钞。', hook: '去集市收点学长的二手零钱', hookTab: 'market-idle' }
    ],
    'day7': [
        { id: 't1', title: '去市政厅 (Gemeente) 注册', desc: '带着租房合同和双认证出生证明，去市政厅注册并获取 BSN 号码。', hook: '找个搭子一起去排队', hookTab: 'market-partner' },
        { id: 't2', title: '办理本地银行卡', desc: '推荐 ING 或 Bunq。有了当地卡才能开通 Tikkie (荷兰版微信支付) 和买火车票。', hook: '不会搞App？求助校友', hookTab: 'market-help' },
        { id: 't3', title: '激活 DigiD 数字身份', desc: '极其重要！收到信件后立刻激活，以后的政府网站、退税、查医保全靠它扫码登录。', hook: '买台二手显示器大屏查政策', hookTab: 'market-idle' },
        { id: 't4', title: '买基础医保 (Zorgverzekering)', desc: '法律规定落地4个月内必须买，否则面临巨额罚款。平时不生病的推荐把 Eigen risico (自付额) 拉到最高以降低保费。', hook: '发悬赏找学长推荐靠谱保险', hookTab: 'market-help' },
        { id: 't5', title: '办理实名黄卡 (OV-chipkaart)', desc: '别用匿名蓝卡坐火车！上 NS 官网绑一个“周末免费”或“非高峰期打折”套餐。', hook: '嫌火车贵？去收一辆二手自行车', hookTab: 'market-idle' }
    ],
    'month1': [
        { id: 'm1', title: '注册家庭医生 (Huisarts)', desc: '在荷兰生病去医院急诊会被赶出来！必须先注册社区的 GP。务必找离家最近的。', hook: '看不懂荷兰语说明书？发悬赏', hookTab: 'market-help' },
        { id: 'm2', title: '申请医疗补贴 (Zorgtoeslag)', desc: '只要你没收入或收入很低，政府每月白送你 €120+ 帮你交保费！几乎等于免费看病。', hook: '省下的钱去集市淘个好物', hookTab: 'market-idle' },
        { id: 'm3', title: '办理各大超市会员卡', desc: 'Albert Heijn 的 Bonus 卡、Jumbo 的积分卡。没有卡买东西是不打折的！', hook: '求个群友分享AH打折条码', hookTab: 'market-help' }
    ]
};

const rbWikis = [
    { id: 'w1', mode: 'advanced', category: '羊毛购物', icon: '🛒', title: 'AH 超市 35% Off 贴纸规律', tag: '恩格尔系数狂降', summary: '摸透打折贴纸出没时间，实现牛排三文鱼自由。', details: 'AH 员工通常在每天下午 15:30 - 16:30 左右开始贴黄色的 35% 贴纸（临期商品）。重点盯肉类区，肉类买回来直接扔冷冻室，至少能放一个月！' },
    { id: 'w2', mode: 'advanced', category: '羊毛购物', icon: '📦', title: 'Too Good To Go 盲盒抢购', tag: '€4吃三天', summary: '剩菜盲盒？不，这是留学生的生存之光。', details: '下载 TGTG App，每天留意面包店 (Bakkerij) 和大超市的魔法盒。通常花 €4.99 能拿走原价 €15+ 的羊角包和果蔬，拼手速抢到就是赚到。' },
    { id: 'w3', mode: 'advanced', category: '羊毛购物', icon: '🛍️', title: '荷兰日用品穷鬼平替店', tag: '别去市中心买', summary: '不要在 Albert Heijn 买洗发水和锅碗瓢盆！', details: '厨具、收纳、五金：无脑去 Action (荷兰拼多多)；洗护用品、保健品：去 Kruidvat 或 Trekpleister，永远在搞 1+1 免费。买廉价家居去 Xenos。' },
    { id: 'w_new1', mode: 'advanced', category: '羊毛购物', icon: '🧺', title: 'Dirk 与 HEMA 的宝藏家居', tag: '省钱布置', summary: '刚租完房怎么低成本布置出温馨感？', details: '千万别全靠宜家！Dirk 超市的清洁用品极其便宜；HEMA 则是平价无印良品，买毛巾、床品、文具性价比最高。' },
    
    { id: 'w4', mode: 'advanced', category: '交通出行', icon: '🚂', title: 'NS 火车终极省钱组合', tag: '交通刺客克星', summary: '荷兰火车票贵到离谱？这么坐直接打骨折。', details: '绝招：买一张 NS Flex Dal Voordeel (非高峰期4折) 套餐，每月只需 €5.6。如果偶尔全价出行，记得在车站找人同行打折，直接享受 40% off！荷兰语词汇：<span class="wk-nl-word" onclick="copyText(\'Samenreiskorting\')">Samenreiskorting</span>' },
    { id: 'w5', mode: 'advanced', category: '交通出行', icon: '🚲', title: '自行车防盗与购买指南', tag: '必修课', summary: '在荷兰，没人没丢过自行车。如何打破魔咒？', details: '代步不要买超过 €100 的二手车！必须买两把锁：一把后轮环形锁 (Ringslot)，一把粗铁链锁 (Kettingslot)。锁车时，铁链**必须**绕过车架和固定柱子。' },
    { id: 'w6', mode: 'advanced', category: '交通出行', icon: '🚌', title: 'OV-pay 直接刷银行卡进站', tag: '防丢卡神器', summary: '忘带 OV 卡怎么办？现在可以直接刷手机/银行卡。', details: '全荷公交系统已支持 OV-pay。直接用绑了 Apple Pay 的手机或荷兰银行卡碰闸机进出站。计费等同于无折扣的原价票，极度适合救急！' },
    { id: 'w_new2', mode: 'advanced', category: '交通出行', icon: '✈️', title: '史基浦机场廉航避坑', tag: 'Ryanair警告', summary: '买欧洲廉航机票，最后反而花了双倍钱？', details: '乘坐 Ryanair 或 EasyJet 务必提前 24 小时在线 Check-in，去柜台值机会被罚款 €50+！随身行李极严，哪怕多 1 厘米也会被罚款，推荐买个标准尺寸的双肩包。' },

    { id: 'w7', mode: 'advanced', category: '生活避坑', icon: '🦷', title: '看牙医与附加险计算', tag: '看牙极贵', summary: '基础医保不包看牙，洗牙补牙怎么搞最划算？', details: '如果你今年预感要拔智齿或多次补牙，年底时务必把明年的保险加上 Tandarts 附加险 (约 +€15/月)。如果是普通的洗牙(约 €70)，直接自费比买附加险更省钱。' },
    { id: 'w8', mode: 'advanced', category: '生活避坑', icon: '🌡️', title: '年度能源账单结算陷阱', tag: '防坑几千欧', summary: '年底突然收到几千欧的补缴天然气账单？', details: '荷兰的能源是“先预估扣费，年底多退少补”。如果你冬天狂开暖气，年底的 Eindafrekening 会让你破产。建议平时在 App 里主动调高每月的预付费，年底拿退款当压岁钱。' },
    { id: 'w_new3', mode: 'advanced', category: '生活避坑', icon: '🔑', title: '锁匠诈骗与忘带钥匙', tag: '血泪教训', summary: '被锁在门外，千万别乱搜谷歌找开锁！', details: '谷歌搜索 Slotenmaker，前排带【Ad/广告】标志的很多是黑帮跨国诈骗。他们会暴力拆锁并漫天要价 €500+。正确做法：白天找正规本地店铺，夜间价格需电话确认封顶。' },

    { id: 'w9', mode: 'advanced', category: '税务补贴', icon: '🗑️', title: '穷学生如何豁免垃圾/水税', tag: '省€300+', summary: '水务局寄来的天价账单？用学生身份合法免除。', details: '收到 RbG 或 Waternet 的信后，登录 DigiD 申请 Kwijtschelding (豁免)。需上传：近三个月银行流水、租房合同。只要卡里余额低于约 €1500，就能全免！荷兰语词汇：<span class="wk-nl-word" onclick="copyText(\'Kwijtschelding\')">Kwijtschelding</span>' },
    { id: 'w10', mode: 'advanced', category: '税务补贴', icon: '🏠', title: '租房补贴 (Huurtoeslag) 申请', tag: '每月白领€200+', summary: '住独立 Studio 的同学必看，政府帮你交房租。', details: '要求：满18岁，独立地址 (有自己的大门、厨卫)，基础房租低于当年上限 (2024年为 €879)，个人存款低于 3.4 万欧。去 Toeslagen 官网申请。荷兰语词汇：<span class="wk-nl-word" onclick="copyText(\'Huurtoeslag\')">Huurtoeslag</span>' },

    { id: 'w11', mode: 'pro', category: '职场签证', icon: '🎓', title: 'Search Year 找工作签', tag: '续命一年', summary: '毕业后想留荷？获得一年无限制打工权。', details: '全球 Top 200 或荷兰本地大学毕业即可申请 1 年的 Search Year。期间可无条件打工。最强 Buff：用此签证转 KM 时，薪资门槛极低！' },
    { id: 'w12', mode: 'pro', category: '职场签证', icon: '📈', title: 'KM 高技术移民薪资门槛', tag: '永居入场券', summary: '留在荷兰的终极目标，由雇主提供担保。', details: '30岁以下门槛：约 €3,909/月；30岁以上：约 €5,331/月。如果是从 Search Year 签证转过来的，门槛直降至：约 €2,801/月！(注：每年1月1日上调，请查阅 IND 官网)' },
    { id: 'w13', mode: 'pro', category: '职场签证', icon: '🏢', title: 'ZZP 自由职业者避税', tag: '搞钱必看', summary: '不想打工想自己接单？注册 ZZP 享受高额免税。', details: '去 KVK (商会) 注册 Eenmanszaak。如果你一年花在业务上的时间超过 1225 小时，就能享受 Starteraftrek 和 Zelfstandigenaftrek，前三年几乎不用交所得税！' },
    { id: 'w_new4', mode: 'pro', category: '职场签证', icon: '💼', title: '如何优雅地谈薪与假期', tag: '反卷指南', summary: '荷兰职场不加班，拿到Offer后该怎么谈判？', details: '荷兰默认全职是 36-40 小时/周，法定最低假期为 20 天，但多数公司给 25-30 天。拿到 Offer 别急着接，可尝试争取 8% 的 Holiday Allowance 以外的 Bonus 或交通报销。' },

    { id: 'w14', mode: 'pro', category: '买房定居', icon: '🏠', title: 'Funda 看房与竞价潜规则', tag: '实操指南', summary: 'Overbidding (溢价) 是常态，如何保护自己？', details: '在兰斯塔德地区，好房子需加价 10%-20%。出价时除了写金额，务必附带两个保命条款：财务保留条款（贷款批不下来可无责毁约）和建筑检测条款。荷兰语词汇：<span class="wk-nl-word" onclick="copyText(\'Voorbehoud van financiering\')">Voorbehoud van financiering</span>' },
    { id: 'w15', mode: 'pro', category: '买房定居', icon: '⚡', title: '房屋能源标签 (Energielabel)', tag: '防接盘', summary: '买老房子便宜？后续加装保温层的钱够买新房了。', details: '荷兰贷款额度严格与能源标签挂钩！买 A 标及以上能比 D 标多贷几万欧。而且 F/G 标的房子冬天天然气费可能高达 €400/月，买房时千万别只看总价！' },
    { id: 'w_new5', mode: 'pro', category: '买房定居', icon: '📝', title: '买房三剑客：中介/评估/公证', tag: '流程扫盲', summary: '买房不要裸奔，必须花钱找专业团队。', details: '买房至少需要三笔硬性额外支出：Aankoopmakelaar (买方中介，约 €3000，帮你抢房)；Taxateur (估价师，约 €500，出具银行认可的报告)；Notaris (公证处，约 €1500，完成过户)。' },

    { id: 'w16', mode: 'pro', category: '财富税务', icon: '📉', title: '30% Ruling 免税法案深度解析', tag: '高薪特权', summary: '满足条件，你的工资有 30% 是免税的纯收入。', details: '核心条件：必须是从海外被招募进荷兰 (本地毕业找工作不适用)，且满足特定薪资门槛。最长适用 5 年，期间不仅免税，还直接豁免 Box 3 财富税！' },
    { id: 'w17', mode: 'pro', category: '财富税务', icon: '💰', title: 'Box 3 财富税防坑指南', tag: '中产必看', summary: '在荷兰存款太多也要交税？了解免税额度。', details: '荷兰不仅收所得税 (Box 1)，还收财富税 (Box 3)。单身免税额度约为 €57,000，伴侣约为 €114,000。超过部分哪怕只是放在银行吃利息，也会被狠狠收税。有余钱尽早考虑理财！' }
];

// --- 音效与辅助 ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function playDingSound() {
    if (!audioCtx) audioCtx = new AudioContext(); if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(880, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); 
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime); gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.02); gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gainNode); gainNode.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.3);
}
function copyText(text) { navigator.clipboard.writeText(text); showToast(`已复制: ${text}`); }

// ================= 12. 红宝书：渲染与滑动逻辑 =================
let currentRbMode = localStorage.getItem('hp_survival_mode') || 'starter';
let currentRbCategory = 'all';
const advancedTabs = ['羊毛购物', '交通出行', '生活避坑', '税务补贴'];
const proTabs = ['职场签证', '买房定居', '财富税务'];

function initRedBook() {
    if(!localStorage.getItem('hp_disclaimer_agreed')) { 
        const modal = document.getElementById('disclaimerModal');
        if(modal) modal.style.display = 'flex'; 
    }
    switchRbMode(currentRbMode); checkWidgets();
}
function agreeDisclaimer() { localStorage.setItem('hp_disclaimer_agreed', 'true'); document.getElementById('disclaimerModal').style.display = 'none'; }

function switchRbMode(mode) {
    currentRbMode = mode; localStorage.setItem('hp_survival_mode', mode);
    document.querySelectorAll('.rb-mode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.rb-mode-btn[onclick*="${mode}"]`).classList.add('active');
    
    const starterView = document.getElementById('rbStarterMode'); 
    const wikiView = document.getElementById('rbWikiMode');
    const mainContainer = document.getElementById('redbookContainer'); 
    const fabBtn = document.getElementById('fabGridBtn');

    // 🌟 控制不同模式的专属小组件
    const advWidgets = document.getElementById('rbWidgetsArea');
    const proWidgets = document.getElementById('proWidgetsArea');
    const safetyWidget = document.getElementById('safetyCheckWidget');

    if (mode === 'starter') {
        starterView.style.display = 'block'; wikiView.style.display = 'none'; fabBtn.style.display = 'none';
        mainContainer.classList.remove('rb-pro-theme'); renderStarterTasks();
    } else {
        starterView.style.display = 'none'; wikiView.style.display = 'block'; fabBtn.style.display = 'flex';
        
        // 组件显隐逻辑
        if (mode === 'advanced') {
            if(advWidgets) advWidgets.style.display = 'flex';
            if(proWidgets) proWidgets.style.display = 'none';
            if(safetyWidget) safetyWidget.style.display = 'block';
        } else if (mode === 'pro') {
            if(advWidgets) advWidgets.style.display = 'none';
            if(proWidgets) proWidgets.style.display = 'flex'; // 显示 Pro 专属面板
            if(safetyWidget) safetyWidget.style.display = 'none'; // Pro 玩家不需要查治安
        }

        const tabContainer = document.getElementById('wikiTabs');
        if (tabContainer) {
            const targetTabsArray = mode === 'pro' ? proTabs : advancedTabs;
            let tabHtml = `<div class="w-tab active" onclick="switchWikiTab('all', this)">全部干货</div>`;
            targetTabsArray.forEach(cat => { tabHtml += `<div class="w-tab" onclick="switchWikiTab('${cat}', this)">${cat}</div>`; });
            tabContainer.innerHTML = tabHtml;
        }
        if(mode === 'pro') mainContainer.classList.add('rb-pro-theme'); else mainContainer.classList.remove('rb-pro-theme');
        
        currentRbCategory = 'all'; const searchInput = document.getElementById('wikiSearchInput'); if(searchInput) searchInput.value = '';
        renderWikiList(); 
    }
}

// ================= 🚨 紧急避难所响应逻辑 =================
function showEmergency(type) {
    if (type === 'medical') {
        showToast('夜间急病请先拨打 Huisartsenpost (家庭医生夜间部)，生命危险直拨 112！', 'error');
    } else if (type === 'fraud') {
        showToast('切勿提前转账定金！请通过官方途径核实房东 KVK 或房产证。', 'warning');
    } else if (type === 'key') {
        showToast('千万别在谷歌搜带 [Ad] 的开锁匠 (极贵)！请找本地正规店铺。', 'warning');
    } else if (type === 'passport') {
        showToast('护照丢失请立刻报警获取挂失单，并联系中国驻荷大使馆补办！', 'error');
    }
}

// --- 打卡任务渲染 ---
let currentTaskPhase = 'pre'; 
function switchTaskPhase(phase, el) { currentTaskPhase = phase; document.querySelectorAll('.tt-tab').forEach(tab => tab.classList.remove('active')); if(el) el.classList.add('active'); renderStarterTasks(); }

function renderStarterTasks() {
    const list = document.getElementById('starterTaskList'); if(!list) return;
    const savedProgress = JSON.parse(localStorage.getItem('hp_tasks_done') || '[]');
    const currentTasks = rbTaskData[currentTaskPhase];
    
    let html = ''; let doneCount = 0;
    // 在 renderStarterTasks() 函数内部，替换 html 拼接部分：
    currentTasks.forEach(task => {
        const isDone = savedProgress.includes(task.id); if (isDone) doneCount++;
        
        // 🌟 全新高级卡片结构
        html += `
        <div class="task-card ${isDone ? 'done' : ''}" id="task_${task.id}">
            <input type="checkbox" class="custom-checkbox-task" ${isDone ? 'checked' : ''} onchange="toggleTask('${task.id}', this)">
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-desc">${task.desc}</div>
                <div class="task-hook-action" onclick="goBack(); setTimeout(()=>switchTab('market', document.querySelectorAll('.tab-item')[1]), 100); setTimeout(()=>switchMarketTab('${task.hookTab.split('-')[1]}', document.querySelector('.m-tab')), 200);">
                    <span>👉</span> ${task.hook}
                </div>
            </div>
        </div>`;
    });
    list.innerHTML = html;
    
    document.getElementById('taskProgressBar').style.width = `${(doneCount / currentTasks.length) * 100}%`;
    document.getElementById('taskProgressText').innerText = `${doneCount}/${currentTasks.length}`;

    const totalTasksCount = Object.values(rbTaskData).flat().length;
    if (savedProgress.length === totalTasksCount && !localStorage.getItem('hp_starter_cleared')) {
        setTimeout(() => {
            const plus = document.createElement('div'); plus.className = 'float-plus'; plus.innerText = '🎉 史诗成就：主线全通关！'; plus.style.color = '#10B981';
            plus.style.left = '50%'; plus.style.top = '40%'; plus.style.transform = 'translate(-50%, -50%)'; document.body.appendChild(plus); 
            setTimeout(() => plus.remove(), 2500); localStorage.setItem('hp_starter_cleared', 'true');
            setTimeout(() => { showToast("你已做好在荷兰生存的全部准备！已为您自动开启【进阶模式】！"); switchRbMode('advanced'); }, 1500);
        }, 500);
    }
}

function toggleTask(id, checkbox) {
    let savedProgress = JSON.parse(localStorage.getItem('hp_tasks_done') || '[]');
    if (checkbox.checked) { playDingSound(); if (!savedProgress.includes(id)) savedProgress.push(id); } 
    else { savedProgress = savedProgress.filter(taskId => taskId !== id); }
    localStorage.setItem('hp_tasks_done', JSON.stringify(savedProgress));
    
    const card = document.getElementById(`task_${id}`);
    if(checkbox.checked) card.classList.add('done'); else card.classList.remove('done');
    renderStarterTasks(); 
}

// --- 卡片滑动交互 ---
let swipeStartX = 0; let swipeCurrentX = 0; let isSwiping = false; 
let isDraggingClickPrevent = false; let activeSwipeId = null;

function hSwipeStart(e, id) { swipeStartX = e.touches[0].clientX; isSwiping = true; isDraggingClickPrevent = false; activeSwipeId = id; const frontCard = document.getElementById(`front_${id}`); if(frontCard) frontCard.style.transition = 'none'; }
function hSwipeMove(e, id) {
    if (!isSwiping || activeSwipeId !== id) return;
    swipeCurrentX = e.touches[0].clientX; const diffX = swipeCurrentX - swipeStartX;
    if (Math.abs(diffX) > 10) isDraggingClickPrevent = true; 
    
    const frontCard = document.getElementById(`front_${id}`); if(frontCard) frontCard.style.transform = `translateX(${diffX}px)`;
    const saveBg = document.querySelector(`#swipe_${id} .save-bg`); const deleteBg = document.querySelector(`#swipe_${id} .delete-bg`);
    if (diffX > 0) { if(saveBg) saveBg.style.opacity = Math.min(diffX / 80, 1); if(deleteBg) deleteBg.style.opacity = 0; } 
    else { if(saveBg) saveBg.style.opacity = 0; if(deleteBg) deleteBg.style.opacity = Math.min(Math.abs(diffX) / 80, 1); }
}
function hSwipeEnd(e, id) {
    if (!isSwiping || activeSwipeId !== id) return;
    isSwiping = false; const diffX = swipeCurrentX - swipeStartX; const frontCard = document.getElementById(`front_${id}`); if(!frontCard) return;
    frontCard.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
    const threshold = window.innerWidth * 0.35;

    if (Math.abs(diffX) > 10) {
        if (diffX > threshold) { frontCard.style.transform = `translateX(${window.innerWidth}px)`; setTimeout(() => handleWikiAction(id, 'saved'), 300); } 
        else if (diffX < -threshold) { frontCard.style.transform = `translateX(-${window.innerWidth}px)`; setTimeout(() => handleWikiAction(id, 'deleted'), 300); } 
        else { frontCard.style.transform = `translateX(0px)`; resetSwipeBg(id); }
    } else { frontCard.style.transform = `translateX(0px)`; resetSwipeBg(id); }
    setTimeout(() => { isDraggingClickPrevent = false; activeSwipeId = null; }, 100);
}
function resetSwipeBg(id) { const sBg = document.querySelector(`#swipe_${id} .save-bg`); const dBg = document.querySelector(`#swipe_${id} .delete-bg`); if(sBg) sBg.style.opacity = 0; if(dBg) dBg.style.opacity = 0; }
function toggleWikiCard(el) {
    if (isSwiping || isDraggingClickPrevent) return;
    const transform = window.getComputedStyle(el).transform; const matrix = new WebKitCSSMatrix(transform);
    if (Math.abs(matrix.m41) < 5) el.classList.toggle('open');
}
function handleWikiAction(id, actionStr) {
    let arr = JSON.parse(localStorage.getItem(`hp_wiki_${actionStr}`) || '[]'); if (!arr.includes(id)) arr.push(id);
    localStorage.setItem(`hp_wiki_${actionStr}`, JSON.stringify(arr));
    
    if(actionStr === 'saved') {
        const plus = document.createElement('div'); plus.className = 'float-plus'; plus.innerText = '⭐ 已加入收藏'; plus.style.color = '#10B981';
        plus.style.left = '50%'; plus.style.top = '40%'; plus.style.transform = 'translate(-50%, -50%)'; document.body.appendChild(plus); 
        setTimeout(() => plus.remove(), 1500);
    }
    renderWikiList(document.getElementById('wikiSearchInput') ? document.getElementById('wikiSearchInput').value.toLowerCase() : '');
}

function switchWikiTab(category, el) { document.querySelectorAll('.w-tab').forEach(tab => tab.classList.remove('active')); el.classList.add('active'); currentRbCategory = category; renderWikiList(); }
function filterWiki() { const query = document.getElementById('wikiSearchInput').value.toLowerCase(); renderWikiList(query); }

function renderWikiList(searchQuery = '') {
    const list = document.getElementById('wikiListContainer'); if(!list) return;
    let html = '';
    
    const deletedData = JSON.parse(localStorage.getItem('hp_wiki_deleted') || '[]'); const savedData = JSON.parse(localStorage.getItem('hp_wiki_saved') || '[]');
    const customWikis = JSON.parse(localStorage.getItem('hp_custom_wikis') || '[]'); 
    const allWikis = [...rbWikis, ...customWikis];

    let filteredData = allWikis.filter(w => {
        if (w.mode !== currentRbMode) return false;
        if (deletedData.includes(w.id) || savedData.includes(w.id)) return false;
        const catMatch = currentRbCategory === 'all' ? true : w.category === currentRbCategory;
        const searchMatch = w.title.toLowerCase().includes(searchQuery) || w.summary.toLowerCase().includes(searchQuery);
        return catMatch && searchMatch;
    });

    if (filteredData.length === 0) { 
        list.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding: 60px 0;">该分类下暂无干货啦！<br><br><span style="font-size:12px; cursor:pointer; color:#10B981; text-decoration:underline;" onclick="localStorage.removeItem(\'hp_wiki_deleted\'); localStorage.removeItem(\'hp_wiki_saved\'); renderWikiList();">点我重置所有卡片状态</span></div>'; 
    } else {
        filteredData.forEach(w => {
            html += `
            <div class="swipe-wrapper" id="swipe_${w.id}">
                <div class="swipe-bg save-bg">⭐ 收藏</div><div class="swipe-bg delete-bg">🗑️ 懂了</div>
                <div class="wiki-card swipe-front" id="front_${w.id}" onclick="toggleWikiCard(this)" ontouchstart="hSwipeStart(event, '${w.id}')" ontouchmove="hSwipeMove(event, '${w.id}')" ontouchend="hSwipeEnd(event, '${w.id}')">
                    <div class="wk-header"><div class="wk-icon">${w.icon}</div><div class="wk-info"><div class="wk-title">${w.title} <span class="wk-tag">${w.tag}</span></div><div class="wk-summary">${w.summary}</div></div></div>
                    <div class="wk-detail" onclick="event.stopPropagation()">
                        <div class="wk-step">${w.details}</div>
                        <div class="wk-ugc-btn" onclick="openWikiComments('${w.id}', '${w.title}')">💬 查看网友补充 & 踩坑情报</div>
                    </div>
                </div>
            </div>`;
        });
    }
    html += `<button class="btn-ai-create" onclick="document.getElementById('aiWikiModal').style.display='flex'">✨ AI 自动提取长文并录入</button>`;
    list.innerHTML = html;
}

// --- 我的收藏渲染逻辑 ---
function openCollectionsModal() { requireAuth(() => { document.getElementById('collectionsModal').style.display = 'flex'; renderCollections(); }); }
function renderCollections() {
    const list = document.getElementById('collectionsList'); const savedIds = JSON.parse(localStorage.getItem('hp_wiki_saved') || '[]');
    if(savedIds.length === 0) { list.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:40px 0;">收藏夹空空如也，快去红宝书里右滑卡片吧！</div>'; return; }

    const allWikis = [...rbWikis, ...JSON.parse(localStorage.getItem('hp_custom_wikis') || '[]')]; let html = '';
    savedIds.forEach(id => {
        const w = allWikis.find(x => x.id === id);
        if(w) {
            html += `<div class="wiki-card" style="margin-bottom:12px; background:#FFF; border:1px solid #E5E7EB; border-radius:16px;" onclick="this.classList.toggle('open')">
                <div class="wk-header"><div class="wk-icon">${w.icon}</div><div class="wk-info"><div class="wk-title">${w.title} <span class="wk-tag">${w.tag}</span></div><div class="wk-summary">${w.summary}</div></div></div>
                <div class="wk-detail" onclick="event.stopPropagation()"><div class="wk-step">${w.details}</div><button class="wk-ugc-btn" style="color:#EF4444; border-color:#FECACA;" onclick="removeCollection('${w.id}', event)">❌ 取消收藏</button></div>
            </div>`;
        }
    }); list.innerHTML = html;
}
function removeCollection(id, e) {
    e.stopPropagation(); let savedIds = JSON.parse(localStorage.getItem('hp_wiki_saved') || '[]');
    savedIds = savedIds.filter(x => x !== id); localStorage.setItem('hp_wiki_saved', JSON.stringify(savedIds));
    renderCollections(); renderWikiList(document.getElementById('wikiSearchInput') ? document.getElementById('wikiSearchInput').value.toLowerCase() : '');
}

// --- AI 自动提炼攻略 ---
async function generateAICard() {
    const inputEl = document.getElementById('aiWikiInput'); const btnEl = document.getElementById('btnGenerateWiki'); const keyword = inputEl.value.trim();
    if (!keyword) return showToast("请先粘贴你要提取的内容！");
    btnEl.innerText = "⏳ DeepSeek 正在疯狂提炼..."; btnEl.disabled = true;
    try {
        const res = await fetch('/api/generate-copy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword, type: 'wiki' }) });
        const data = await res.json(); if(data.error) throw new Error(data.error);

        const newCard = { id: 'cw_' + Date.now(), mode: currentRbMode, category: currentRbCategory === 'all' ? '专属干货' : currentRbCategory, icon: data.icon || '📌', title: data.title || '无标题攻略', tag: data.tag || 'AI生成', summary: data.summary || '这是一条自动提取的干货总结。', details: data.details || keyword };
        let customWikis = JSON.parse(localStorage.getItem('hp_custom_wikis') || '[]'); customWikis.unshift(newCard); 
        localStorage.setItem('hp_custom_wikis', JSON.stringify(customWikis));

        showToast("🎉 录入成功！卡片已生成！"); document.getElementById('aiWikiModal').style.display = 'none'; inputEl.value = ''; renderWikiList(); 
    } catch (err) { showToast("提取失败：" + err.message); } finally { btnEl.innerText = "🪄 一键提取为红宝书"; btnEl.disabled = false; }
}

function toggleFabModal() { showToast("您可以点击底部的『✨ AI 自动提取长文』来自己制作卡片哦！"); }
function checkWidgets() {
    const now = new Date(); const day = now.getDay(); const hours = now.getHours();
    const supermarketWg = document.getElementById('supermarketWidget');
    if ((day === 0 || day === 6) && hours >= 16 && hours < 22) {
        if(supermarketWg) { supermarketWg.style.display = 'flex'; document.getElementById('supermarketAlertText').innerText = `🚨 距提早关门仅剩 ${22 - hours} 小时！`; }
    } else { if(supermarketWg) supermarketWg.style.display = 'none'; }
}

// ================= 13. 问答发布与红宝书评论 =================
function openQuestionPublish() { closePublishSheet(); setTimeout(() => { document.getElementById('publishQuestionModal').style.display = 'flex'; }, 300); }
function closeQuestionPublish() { document.getElementById('publishQuestionModal').style.display = 'none'; }
async function submitQuestionPost() {
    const title = document.getElementById('questionTitle').value.trim(); const desc = document.getElementById('questionDesc').value.trim(); const tag = document.querySelector('#questionTagGroup .active').innerText;
    if(!title) return showToast("写个标题吧！"); 
    const btn = document.querySelector('#publishQuestionModal .fm-submit'); btn.innerText = "发送中..."; btn.style.pointerEvents = 'none';
    try { 
        const finalTitle = `[问答] ${tag} - ${title}`; const authorName = localStorage.getItem('hp_name') || '管家新人'; 
        const res = await fetch('/api/publish-community', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ userId: userUUID, authorName: authorName, title: finalTitle, text: desc, imageUrl: '' }) }); 
        if(!res.ok) throw new Error("失败"); 
        showToast("🎉 提问成功！大家很快就会来解答的。"); 
        closeQuestionPublish(); document.getElementById('questionTitle').value = ''; document.getElementById('questionDesc').value = ''; 
        loadCommunityPosts(); 
    } catch(e) { showToast(e.message); } finally { btn.innerText = "发布"; btn.style.pointerEvents = 'auto'; }
}

let currentWikiIdForComment = null;
function openWikiComments(wikiId, wikiTitle) { currentWikiIdForComment = wikiId; document.getElementById('wikiCommentModal').style.display = 'flex'; document.querySelector('#wikiCommentModal .fm-title').innerText = wikiTitle + ' 的评论'; renderWikiComments(); }
function renderWikiComments() {
    const list = document.getElementById('wikiCommentList'); const allComments = JSON.parse(localStorage.getItem('hp_wiki_comments') || '{}'); const comments = allComments[currentWikiIdForComment] || [];
    if (comments.length === 0) { list.innerHTML = `<div style="text-align:center; color:#9CA3AF; padding:40px 0;">还没有人分享踩坑经验，你来抢沙发吧！</div>`; return; }
    let html = '';
    comments.forEach(c => { html += `<div class="wc-item"><div class="wc-avatar">${c.avatar}</div><div class="wc-content"><div class="wc-name"><span>${c.name}</span> <span style="color:#9CA3AF; font-weight:normal;">刚刚</span></div><div class="wc-text">${c.text}</div></div></div>`; });
    list.innerHTML = html; list.scrollTop = list.scrollHeight;
}
function submitWikiComment() {
    requireAuth(() => {
        const input = document.getElementById('wikiCommentInput'); const text = input.value.trim(); if (!text) return;
        const allComments = JSON.parse(localStorage.getItem('hp_wiki_comments') || '{}'); if (!allComments[currentWikiIdForComment]) allComments[currentWikiIdForComment] = [];
        allComments[currentWikiIdForComment].push({ name: localStorage.getItem('hp_name') || '管家热心用户', avatar: document.getElementById('profileAvatarEmoji')?.innerText || '😎', text: text });
        localStorage.setItem('hp_wiki_comments', JSON.stringify(allComments)); input.value = ''; renderWikiComments();
        const plus = document.createElement('div'); plus.className = 'float-plus'; plus.innerText = '💡 分享干货，信用分 +2'; plus.style.color = '#10B981'; plus.style.left = '50%'; plus.style.top = '40%'; plus.style.transform = 'translate(-50%, -50%)'; document.body.appendChild(plus); 
        setTimeout(() => plus.remove(), 2000);
    });
}

// ================= 14. 🛡️ 街区治安查询 (管家安全盾) =================
function checkSafetyCode() {
    const input = document.getElementById('postcodeInput').value.trim(); const resultBox = document.getElementById('safetyResult');
    if (input.length !== 4) { showToast("请输入准确的4位数字邮编哦！(例如：2512)"); return; }
    resultBox.style.display = 'block';
    
    const dangerZones = ['2512', '2525', '2526', '3081', '3083', '1102', '1103', '1104', '1062']; 
    const warnZones = ['2521', '2522', '3024', '3025', '1055', '1056'];

    let contentHtml = '';
    if (dangerZones.includes(input)) {
        resultBox.className = 'sc-result danger'; contentHtml = `<b>🔴 高危预警 (复杂街区)：</b><br>该区域历史治安反馈较差，飞车抢夺或寻衅滋事偶有发生。<b>强烈建议：</b><br>1. 夜晚绝对不要单独佩戴耳机步行。<br>2. 租房尽量避开一楼，注意门窗锁好。`;
    } else if (warnZones.includes(input)) {
        resultBox.className = 'sc-result warn'; contentHtml = `<b>🟡 谨慎区域 (黄灯)：</b><br>该区域人员流动较复杂。日常生活无大碍，但<b>自行车极其容易被盗</b>，请务必使用粗链条锁！夜晚尽量结伴而行。`;
    } else {
        resultBox.className = 'sc-result safe'; contentHtml = `<b>🟢 治安良好 (绿灯)：</b><br>管家数据库显示该区暂无高频恶性治安反馈（多为学生区或家庭住宅区）。正常生活即可，但出门仍需锁好自行车哦！`;
    }

    contentHtml += `
        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed rgba(0,0,0,0.15); font-size: 11px; opacity: 0.85; line-height: 1.5;">
            <b>💡 管家免责声明：</b><br>本评级基于历年留学生真实踩坑反馈及社区印象汇总。街区治安状况会随时间动态变化，<b>查询结果仅供参考，不代表荷兰官方统计数据，亦不能作为租房或出行的唯一绝对依据。</b>遇到紧急危险请立刻拨打 112！
        </div>
    `;
    resultBox.innerHTML = contentHtml;
}

// ================= 15. 初始化引擎 =================
window.addEventListener('DOMContentLoaded', () => { 
    // 防报错空函数占位
    if(typeof renderTipsPage === 'function') renderTipsPage(); 
    loadTrendingToHome(); 
    if(typeof renderProfileState === 'function') renderProfileState(); 
    loadCommunityPosts();
    initRedBook(); 
    renderProNews();
});
