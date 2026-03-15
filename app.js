// ============================================================================
// app.js - 核心业务逻辑中心 (防弹修复版)
// ============================================================================

// ================= 🌟 全局高质感 Toast 提示 =================
let toastTimeout = null;
function showToast(message, type = 'info') {
    try {
        const toast = document.getElementById('globalToast');
        const icon = document.getElementById('toastIcon');
        const msg = document.getElementById('toastMessage');
        if (!toast) return;

        if (type === 'success') { icon.innerText = '✅'; toast.style.background = 'rgba(16, 185, 129, 0.95)'; }
        else if (type === 'error') { icon.innerText = '🚨'; toast.style.background = 'rgba(239, 68, 68, 0.95)'; }
        else if (type === 'warning') { icon.innerText = '⚠️'; toast.style.background = 'rgba(245, 158, 11, 0.95)'; }
        else { icon.innerText = '💡'; toast.style.background = 'rgba(17, 24, 39, 0.95)'; }

        msg.innerText = message;
        toast.classList.add('show');

        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { toast.classList.remove('show'); }, 3000);
    } catch(e) { console.error(e); }
}

function openLightbox(imgSrc) {
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    if (!lightbox || !imgSrc || imgSrc.includes('data:image/svg')) return;
    lightboxImg.src = imgSrc; lightbox.style.display = 'flex';
}
function closeLightbox() { document.getElementById('imageLightbox').style.display = 'none'; }

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
    if(!wx) return showToast("微信号不能为空哦！", "warning");
    localStorage.setItem('hp_wechat', wx); 
    document.getElementById('wechatBindModal').style.display = 'none';
    showToast("💬 绑定成功 信用分+30", "success");
    if(typeof renderProfileState === 'function') renderProfileState();
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
    if(!name) return showToast('昵称不能为空哦！', "warning"); 
    localStorage.setItem('hp_name', name); 
    localStorage.setItem('hp_gender', document.getElementById('epGender').value); 
    localStorage.setItem('hp_mbti', document.getElementById('epMbti').value); 
    localStorage.setItem('hp_wechat', document.getElementById('epWechat').value.trim()); 
    localStorage.setItem('hp_bio', document.getElementById('epBio').value.trim()); 
    document.getElementById('editProfileModal').style.display = 'none'; 
    if(typeof renderProfileState === 'function') renderProfileState(); 
}
function previewAvatar(event) { 
    const file = event.target.files[0]; if(!file) return; 
    const reader = new FileReader(); 
    reader.onload = function(e) { 
        localStorage.setItem('hebao_avatar', e.target.result); 
        if(typeof renderProfileState === 'function') renderProfileState(); 
        loadAvatar();
    }; 
    reader.readAsDataURL(file); 
}
function loadAvatar() { 
    const savedAvatar = localStorage.getItem('hebao_avatar'); 
    if(savedAvatar && (typeof isLoggedIn !== 'undefined' ? isLoggedIn : true)) { 
        const imgEl = document.getElementById('profileAvatarImg');
        const boxEl = document.getElementById('profileAvatarBox');
        const emojiEl = document.getElementById('profileAvatarEmoji');
        if(imgEl) { imgEl.src = savedAvatar; imgEl.style.display = 'block'; }
        if(boxEl) boxEl.style.background = '#FFF'; 
        if(emojiEl) emojiEl.textContent = ''; 
    } 
}

// ================= 3. GPS 定位 =================
let currentCity = ""; let currentPostcode = "";
function autoLocate(inputId) {
    const inputEl = document.getElementById(inputId); 
    if (!navigator.geolocation) return showToast("浏览器不支持定位功能", "warning");
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
        } catch (e) { inputEl.value = oldVal; showToast("获取定位失败", "error"); }
    }, (err) => { inputEl.value = oldVal; showToast("定位权限被拒绝", "warning"); }, { timeout: 10000 });
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
            const res = await fetch('/api/scan', { method: 'POST', headers: typeof getAuthHeaders === 'function' ? getAuthHeaders() : {'Content-Type': 'application/json'}, body: JSON.stringify({ imageBase64: base64Data }) });
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
        } catch (err) { showToast("识别失败：" + err.message, "error"); resetApp(); } 
        finally { document.getElementById('packageImgInput').value = ''; }
    }; 
    reader.readAsDataURL(file);
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
            globalTrendingLikes = data.topLikes || []; globalTrendingDislikes = data.topDislikes || []; 
            renderHomeTrending(globalTrendingLikes, 'homeTrendingListLikes', 'like'); 
            renderHomeTrending(globalTrendingDislikes, 'homeTrendingListDislikes', 'dislike'); 
        }
    } catch(e) {}
}

function renderHomeTrending(list, containerId, type) {
    const container = document.getElementById(containerId); if (!container || list.length === 0) return; 
    let html = ''; const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23F3F4F6'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='10' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'%3E暂无图%3C/text%3E%3C/svg%3E";
    list.slice(0, 20).forEach((item, index) => {
        let badgeClass = 'rank-other'; if (index === 0) badgeClass = 'rank-1'; else if (index === 1) badgeClass = 'rank-2'; else if (index === 2) badgeClass = 'rank-3'; 
        if (type === 'dislike') badgeClass = 'rank-bad';
        const score = type === 'like' ? item.likes : item.dislikes; const icon = type === 'like' ? '👍' : '💣'; const scoreColor = type === 'like' ? '#10B981' : '#EF4444'; 
        const safeImg = item.image_url || fallbackSvg;
        html += `<div class="trending-card" onclick="openDetailsFromHomeTrending('${type}', ${index})"><div class="rank-badge ${badgeClass}">TOP ${index + 1}</div><img src="${safeImg}" onerror="this.onerror=null; this.src='${fallbackSvg}'" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; background: #F3F4F6; border: 1px solid #E5E7EB;"><div class="t-info"><div class="t-name">${item.chinese_name || '未命名商品'}</div><div style="font-size: 11px; color: #9CA3AF; margin-top:2px;">${item.dutch_name || ''}</div></div><div class="t-score" style="color: ${scoreColor}">${icon} ${score}</div></div>`;
    });
    container.innerHTML = html;
}

// ================= 5. 商品详情页 =================
function openDetailsFromScan() { currentDetailData = {...currentProductData}; setupDetailPage(); }
function openDetailsFromHomeTrending(type, index) { currentDetailData = type === 'like' ? globalTrendingLikes[index] : globalTrendingDislikes[index]; setupDetailPage(); }
function openDetailsFromHistory(index) { let h = JSON.parse(localStorage.getItem('hebao_history')||'[]'); currentDetailData = h[index]; setupDetailPage(); }

async function setupDetailPage() {
    const d = currentDetailData; 
    if (!d) { showToast("获取商品数据失败", "error"); return; }
    
    try {
        const imgEl = document.getElementById('detailImg'); 
        if(imgEl) { imgEl.src = d.image_url || d.img_src || 'https://images.unsplash.com/photo-1544025162-8315ea07659b?q=80&w=600&auto=format&fit=crop'; imgEl.onclick = function() { openLightbox(this.src); }; }
        if(document.getElementById('detailChineseName')) document.getElementById('detailChineseName').innerText = d.chinese_name || d.dutch_name || '未知商品'; 
        if(document.getElementById('detailDutchName')) document.getElementById('detailDutchName').innerText = d.dutch_name || ''; 
        
        const insightBox = document.getElementById('detailInsightBox'); if(insightBox) insightBox.style.display = d.insight ? 'block' : 'none'; 
        if(document.getElementById('detailInsight')) document.getElementById('detailInsight').innerText = d.insight || '';
        
        if(document.getElementById('chatHistory')) document.getElementById('chatHistory').innerHTML = ''; 
        if(typeof switchTab === 'function') switchTab('details', null);

        const altBox = document.getElementById('detailAltBox'); const altContent = document.getElementById('detailAlternatives');
        const recipeBox = document.getElementById('detailRecipeBox'); const recipeList = document.getElementById('recipeCardList');
        if(recipeBox) recipeBox.style.display = 'block';

        if (d.alternatives && d.pairing) {
            if(altBox && altContent) { altBox.style.display='block'; altContent.innerHTML = d.alternatives.split('|').map(p=>`<div class="alt-tag">${p}</div>`).join(''); }
            renderReviewCards(d.pairing);
        } else {
            if(altBox) altBox.style.display = 'none';
            if(recipeList) recipeList.innerHTML = '<div style="text-align:center; color:#6366F1; padding:30px 0; font-weight:bold;"><span class="pulse-dot" style="display:inline-block; background:#6366F1; margin-right:8px;"></span>DeepSeek 正在深度评测...</div>';
            
            try {
                const res = await fetch('/api/detail', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ dutchName: d.dutch_name, chineseName: d.chinese_name || '' }) });
                const deepData = await res.json();
                if(deepData.alternatives) { d.alternatives = deepData.alternatives; if(altBox && altContent) { altBox.style.display='block'; altContent.innerHTML = deepData.alternatives.split('|').map(p=>`<div class="alt-tag">${p}</div>`).join(''); } }
                if(deepData.pairing) { d.pairing = deepData.pairing; renderReviewCards(deepData.pairing); } else { if(recipeList) recipeList.innerHTML = '<div style="text-align:center;color:#9CA3AF;font-size:13px;padding:20px 0;">暂无评价</div>'; }
            } catch(e) { if(recipeList) recipeList.innerHTML = '<div style="text-align:center;color:#EF4444;font-size:13px;padding:20px 0;">报告生成失败</div>'; }
        }
    } catch(e) { console.error(e); }
}

function renderReviewCards(pairingString) {
    try {
        const list = document.getElementById('recipeCardList'); if(!list) return;
        list.innerHTML = '';
        let reviews = pairingString.split('\n\n').filter(l => l.trim()).map((line, idx) => {
            const isLike = line.includes('👍'); const isRealUser = line.includes('🧑‍🍳'); const cleanText = line.replace(/🧑‍🍳 网友点评 \[.*?\]：|🤖 AI预测口味 \[.*?\]：/, '').trim();
            return { id: idx, text: cleanText, isLike, isRealUser, likes: isRealUser ? Math.floor(Math.random() * 50) + 5 : 0, avatar: isRealUser ? ['🐼','😎','👻','👩‍💻','🐱'][idx % 5] : '🤖', name: isRealUser ? '热心网友_' + Math.floor(Math.random()*900+100) : 'AI 预测' };
        });
        reviews.sort((a, b) => b.likes - a.likes);
        reviews.forEach(r => {
            const tagHtml = r.isRealUser ? `<span class="r-tag ${r.isLike ? 'like' : 'dislike'}">${r.isLike ? '👍 推荐' : '💣 避雷'}</span>` : `<span class="r-tag" style="background:#F3F4F6; color:#6B7280;">🤖 AI</span>`;
            list.innerHTML += `<div class="recipe-card"><div class="r-header"><div class="r-user"><div class="r-avatar">${r.avatar}</div><div class="r-name">${r.name}</div>${tagHtml}</div><div class="r-like-btn" onclick="likeReviewCard(this)"><span style="font-size:14px;">💡</span> <span>${r.likes}</span></div></div><div class="r-text">${r.text}</div></div>`;
        });
    } catch(e) { console.error(e); }
}
function likeReviewCard(btn) { if(btn.classList.contains('voted')) return; btn.classList.add('voted'); const span = btn.querySelector('span:last-child'); span.innerText = parseInt(span.innerText) + 1; }
function saveToLocalFootprint(data, img) { let h = JSON.parse(localStorage.getItem('hebao_history')||'[]'); if(!h.find(i=>i.dutch_name===data.dutch_name)){ data.img_src=img; h.unshift(data); localStorage.setItem('hebao_history',JSON.stringify(h)); } }

// ================= 6. 发布系统 =================
function openPublishSheet() { const overlay = document.querySelector('.publish-overlay'); const sheet = document.querySelector('.publish-sheet'); if(overlay) { overlay.style.display = 'block'; setTimeout(()=>overlay.classList.add('show'),10); } if(sheet) { setTimeout(()=>sheet.classList.add('show'),10); } }
function closePublishSheet() { const overlay = document.querySelector('.publish-overlay'); const sheet = document.querySelector('.publish-sheet'); if(sheet) sheet.classList.remove('show'); if(overlay) { overlay.classList.remove('show'); setTimeout(()=>overlay.style.display='none',300); } }
function openIdlePublish() { closePublishSheet(); setTimeout(() => { document.getElementById('publishIdleModal').style.display = 'flex'; }, 300); }
function closeIdlePublish() { document.getElementById('publishIdleModal').style.display = 'none'; }
function openHelpPublish() { closePublishSheet(); setTimeout(() => { document.getElementById('publishHelpModal').style.display = 'flex'; }, 300); }
function closeHelpPublish() { document.getElementById('publishHelpModal').style.display = 'none'; }
function openPartnerPublish() { closePublishSheet(); setTimeout(() => { document.getElementById('publishPartnerModal').style.display = 'flex'; }, 300); }
function closePartnerPublish() { document.getElementById('publishPartnerModal').style.display = 'none'; }
function openQuestionPublish() { closePublishSheet(); setTimeout(() => { document.getElementById('publishQuestionModal').style.display = 'flex'; }, 300); }
function closeQuestionPublish() { document.getElementById('publishQuestionModal').style.display = 'none'; }
function selectPill(element, groupName) { document.querySelectorAll(`#${groupName} .pill`).forEach(el => el.classList.remove('active')); element.classList.add('active'); }

// ================= 7. 社区集市拉取与渲染 =================
let mockIdleItems = []; let mockHelpItems = []; let mockPartnerItems = []; window.allCommunityPostsCache = []; let mockQuestionItems = [];

async function loadCommunityPosts() {
    try {
        const res = await fetch('/api/get-community'); const data = await res.json();
        if (data.success && data.posts) {
            mockIdleItems = []; mockHelpItems = []; mockPartnerItems = []; mockQuestionItems = []; window.allCommunityPostsCache = data.posts; 
            data.posts.forEach(post => {
                const title = post.title || ''; const time = new Date(post.created_at).getTime() || Date.now(); const author = post.author_name || '匿名管家';
                let payload; try { payload = JSON.parse(post.content); } catch(e) { payload = { oldText: post.content }; }
                let badgeHtml = `<span class="trust-badge badge-work">✅ 已实名</span>`;
                
                if (title.includes('[闲置]')) {
                    const firstImg = (payload.items && payload.items.length > 0) ? payload.items[0].url : 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&auto=format&fit=crop';
                    const priceMatch = title.match(/€(\d+(\.\d+)?)/); const price = priceMatch ? priceMatch[1] : '面议';
                    const isAllSold = payload.items ? payload.items.every(i => i.is_sold) : false; const itemCount = payload.items ? payload.items.length : 0;
                    mockIdleItems.push({ userId: post.user_id, id: post.id, img: firstImg, title: title.replace('[闲置] ', ''), price: price, priceNum: parseFloat(price) || 0, avatar: "😎", name: author, badge: badgeHtml, isSold: isAllSold, itemCount: itemCount, timestamp: time });
                } else if (title.includes('[互助')) {
                    const rewardMatch = title.match(/€(\d+(\.\d+)?)/); const reward = rewardMatch ? rewardMatch[1] : '0'; const isUrgent = title.includes('🔥急');
                    mockHelpItems.push({ userId: post.user_id, id: post.id, type: isUrgent ? "🔥 紧急" : "🤝 求助", isUrgent: isUrgent, title: payload.oldText ? payload.oldText.substring(0,40)+'...' : title, reward: reward, rewardNum: parseFloat(reward) || 0, date: "私信沟通", location: "荷兰", avatar: "🐼", name: author, badge: badgeHtml, distKm: 1, timestamp: time, imgIcon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23EFF6FF'/><text x='50%' y='50%' font-size='20' text-anchor='middle' dominant-baseline='middle'>🤝</text></svg>" });
                } else if (title.includes('[找搭子]')) {
                    mockPartnerItems.push({ userId: post.user_id, id: post.id, avatar: "👱‍♀️", name: author, badge: badgeHtml, gender: "f", mbti: "未知", mbtiType: "all", title: title.replace('[找搭子] ', ''), desc: payload.oldText || '', tags: ["✨ 新发布"], distKm: 1, daysAway: 1, timestamp: time });
                } else if (title.includes('[问答]')) {
                    mockQuestionItems.push({ userId: post.user_id, id: post.id, avatar: "🤔", name: author, badge: badgeHtml, title: title.replace('[问答] ', ''), desc: payload.oldText || '', timestamp: time });
                }
            });
            applyMarketFilters('idle'); applyMarketFilters('help'); applyMarketFilters('partner'); applyMarketFilters('question');
        }
    } catch (err) { console.error("加载社区数据失败", err); }
}

function applyMarketFilters(type) {
    try {
        if (type === 'idle') {
            const sortMode = document.getElementById('sortIdle')?.value || 'newest'; 
            let filtered = [...mockIdleItems]; 
            if (sortMode === 'priceAsc') filtered.sort((a, b) => a.priceNum - b.priceNum); 
            else if (sortMode === 'priceDesc') filtered.sort((a, b) => b.priceNum - a.priceNum); 
            else filtered.sort((a, b) => b.timestamp - a.timestamp); 
            renderMarketIdle(filtered); 
        } else if (type === 'help') {
            let filtered = [...mockHelpItems]; filtered.sort((a, b) => b.timestamp - a.timestamp); renderMarketHelp(filtered); 
        } else if (type === 'partner') {
            let filtered = [...mockPartnerItems]; filtered.sort((a, b) => b.timestamp - a.timestamp); renderMarketPartner(filtered); 
        } else if (type === 'question') { 
            renderMarketQuestion(); 
        }
    } catch(e) { console.error(e); }
}

// 💡 修复重点：给 onclick 的 ID 全部加上单引号！
function renderMarketIdle(data = mockIdleItems) { 
    const container = document.getElementById('idleWaterfall'); if(!container) return; 
    if(data.length === 0) { container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:40px 0;">空空如也，快去发一个吧！</div>'; return; } 
    let html = ''; 
    data.forEach(item => { 
        const soldOverlayHtml = item.isSold ? `<div class="wf-sold-overlay"><div class="wf-sold-text">已售空</div></div>` : ''; 
        const countBadge = item.itemCount > 1 ? `<div class="waterfall-count-badge">共 ${item.itemCount} 件</div>` : ''; 
        // 🛡️ 修复点：openCommunityPost('${item.id}')，强制用引号包裹 UUID
        html += `<div class="waterfall-item" onclick="openCommunityPost('${item.id}')"><div class="wf-img-box">${soldOverlayHtml}${countBadge}<img class="wf-img" src="${item.img}"></div><div class="wf-info"><div class="wf-title" style="${item.isSold ? 'color:#9CA3AF;' : ''}">${item.title}</div><div class="wf-price-row"><span class="wf-currency" style="${item.isSold ? 'color:#9CA3AF;' : ''}">€</span><span class="wf-price" style="${item.isSold ? 'color:#9CA3AF;' : ''}">${item.price}</span></div><div class="wf-user-row"><div class="wf-user"><div class="wf-avatar">${item.avatar}</div><div class="wf-name">${item.name}${item.badge}</div></div></div></div></div>`; 
    }); 
    container.innerHTML = html; 
}

function renderMarketHelp(data = mockHelpItems) { 
    const container = document.getElementById('helpListContainer'); if(!container) return; 
    let html = ''; 
    data.forEach(item => { 
        const tagClass = item.isUrgent ? 'hc-type-tag urgent' : 'hc-type-tag'; const tagText = item.isUrgent ? `🔥 急` : item.type.split(' ')[1] || '求助'; 
        // 🛡️ 修复点：openChat 参数加引号
        html += `<div class="help-card" onclick="openChat('${item.userId}', '${item.name}', '${item.avatar}', '${item.id}', '${item.title.replace(/'/g, "")}', '${item.reward}', \`\`, false, 'help')"><div class="hc-top-row"><div class="${tagClass}">${tagText}</div><div class="hc-reward-compact">€${item.reward}</div></div><div class="hc-title">${item.title}</div><div class="hc-details"><div class="hc-detail-item"><span>⏰</span> ${item.date}</div><div class="hc-detail-item"><span>📍</span> ${item.location}</div></div><div class="hc-footer"><div class="hc-user"><div class="hc-avatar">${item.avatar}</div><div class="hc-name">${item.name}${item.badge}</div></div><div class="hc-action-btn">立即私信</div></div></div>`; 
    }); 
    container.innerHTML = html; 
}

function renderMarketPartner(data = mockPartnerItems) { 
    const container = document.getElementById('partnerListContainer'); if(!container) return; 
    let html = ''; 
    data.forEach(item => { 
        const genderIcon = item.gender === 'f' ? '♀' : '♂'; const tagsHtml = item.tags.slice(0, 2).map(t => `<div class="pc-tag">${t}</div>`).join(''); 
        html += `
        <div class="partner-card">
            <div class="pc-header" onclick="openChat('${item.userId}', '${item.name}', '${item.avatar}', '${item.id}', '${item.title.replace(/'/g, "")}', '0', \`\`, false, 'partner')">
                <div class="pc-user"><div class="pc-avatar">${item.avatar}</div><div class="pc-info"><div class="pc-name-row"><span class="pc-name">${item.name}</span>${item.badge}</div><span class="pc-mbti">${item.mbti}</span></div></div>
            </div>
            <div onclick="openChat('${item.userId}', '${item.name}', '${item.avatar}', '${item.id}', '${item.title.replace(/'/g, "")}', '0', \`\`, false, 'partner')">
                <div class="pc-title">${item.title}</div><div class="pc-desc">${item.desc}</div><div class="pc-tags">${tagsHtml}</div>
            </div>
            <div class="pc-action-row">
                <div class="pc-action-btn-main" onclick="openChat('${item.userId}', '${item.name}', '${item.avatar}', '${item.id}', '${item.title.replace(/'/g, "")}', '0', \`\`, false, 'partner')">👋 滴滴Ta</div>
            </div>
        </div>`; 
    }); 
    container.innerHTML = html; 
}

function renderMarketQuestion(data = mockQuestionItems) { 
    const container = document.getElementById('questionListContainer'); if(!container) return; 
    let html = ''; 
    data.forEach(item => { 
        html += `<div class="question-card" onclick="openChat('${item.userId}', '${item.name}', '${item.avatar}', '${item.id}', '解答提问', '0', '', false, 'question')"><div class="qc-title">${item.title}</div><div class="qc-desc">${item.desc}</div><div class="qc-footer"><div class="qc-user"><span>${item.avatar}</span> ${item.name} ${item.badge}</div><div class="qc-answer-btn">✍️ 去解答</div></div></div>`; 
    }); 
    container.innerHTML = html; 
}


// ================= 8. 闲置详情页与购买交互 =================
let currentCommunityPost = null; 
let selectedItemIds = new Set(); 
let currentTotalPrice = 0;

function openCommunityPost(postId) {
    try {
        const modal = document.getElementById('postDetailModal');
        if (!modal) { console.error("未找到 postDetailModal"); return; }
        
        selectedItemIds = new Set(); currentTotalPrice = 0;
        document.getElementById('pdTotalPrice').innerText = `€0.00`; document.getElementById('pdChatBtn').innerText = `私信想要 (0件)`;
        modal.style.display = 'flex'; 

        // 🛡️ 强制转换为字符串比对，防止 UUID 类型导致找不到
        const post = mockIdleItems.find(p => String(p.id) === String(postId)) || window.allCommunityPostsCache?.find(p => String(p.id) === String(postId));
        if (!post) { showToast("未找到该商品数据", "error"); return; }
        currentCommunityPost = post;

        document.getElementById('pdSellerInfo').innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div class="pd-seller-avatar" style="font-size:32px;">${post.avatar || '😎'}</div>
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <div class="pd-seller-name" style="font-weight:900; font-size:15px;">${post.name || '热心校友'} ${post.badge || ''}</div>
                        <div class="pd-seller-time" style="font-size:11px; color:#9CA3AF;">发布于近期</div>
                    </div>
                </div>
            </div>
        `;

        let payload;
        try { payload = JSON.parse(post.content); } catch(e) { payload = { items: [{ id: 'item1', name: post.title, price: post.priceNum, url: post.img, is_sold: post.isSold }] }; }
        
        const listContainer = document.getElementById('pdItemsList');
        let itemsHtml = '';

        if (payload.items && payload.items.length > 0) {
            payload.items.forEach(item => {
                const isSold = item.is_sold; const priceNum = parseFloat(item.price) || 0;
                const cardClass = isSold ? 'pd-item-card sold' : 'pd-item-card';
                // 🛡️ 修复复选框点击 ID 加引号
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
    } catch(e) { console.error("打开商品详情失败:", e); }
}

function toggleItemCard(cardEl, itemId, price) {
    const chk = document.getElementById(`chk_${itemId}`);
    if (!chk) return;
    chk.checked = !chk.checked; 
    toggleItemCheckbox(chk, itemId, price);
}

function toggleItemCheckbox(checkbox, itemId, price) {
    if (checkbox.checked) { selectedItemIds.add(itemId); currentTotalPrice += price; } 
    else { selectedItemIds.delete(itemId); currentTotalPrice -= price; }
    currentTotalPrice = Math.max(0, currentTotalPrice);
    document.getElementById('pdTotalPrice').innerText = `€${currentTotalPrice.toFixed(2)}`;
    document.getElementById('pdChatBtn').innerText = `私信想要 (${selectedItemIds.size}件)`;
}

function initiateBuyChat() {
    if (selectedItemIds.size === 0) return showToast("👉 请先勾选您想要的物品！", "warning");
    let payload; try { payload = JSON.parse(currentCommunityPost.content); } catch(e) { payload = { items: [{ id: 'item1', name: currentCommunityPost.title, url: currentCommunityPost.img }] }; }
    let wantNames = payload.items.filter(i => selectedItemIds.has(i.id)).map(i => i.name).join('、');
    const firstItemImg = payload.items.find(i => selectedItemIds.has(i.id))?.url || currentCommunityPost.img;
    
    openChat(currentCommunityPost.userId, currentCommunityPost.name, '😎', currentCommunityPost.id, `想要这几件 (€${currentTotalPrice.toFixed(2)})`, currentTotalPrice.toFixed(2), firstItemImg, false, 'idle');
    
    setTimeout(() => {
        const input = document.getElementById('chatInput'); 
        if(input) input.value = `哈喽！我想要：【${wantNames}】，请问还在吗？`;
    }, 100);
    closePostDetail();
}
function closePostDetail() { document.getElementById('postDetailModal').style.display = 'none'; }


// ================= 9. 真实私信聊天系统 =================
let currentChatPartnerId = null; let currentChatPostId = null; let chatPollingInterval = null;
function openChat(targetId, targetName, targetAvatar, postId, postTitle, postPrice, postImg, isSold, postType = 'idle') {
    try {
        const userId = typeof userUUID !== 'undefined' ? userUUID : '';
        if (targetId === userId && userId !== '') return showToast("💡 不能给自己发私信哦！", "warning");
        currentChatPartnerId = targetId; currentChatPostId = postId;
        
        const modal = document.getElementById('chatModal'); 
        if (!modal) return showToast("聊天窗口未初始化", "error");
        modal.style.display = 'flex'; 

        document.getElementById('chatTargetName').innerText = targetName || '联系卖家';
        document.getElementById('chatTargetAvatar').innerText = targetAvatar || '😎';
        document.getElementById('chatProductTitle').innerText = postTitle || '商品信息';
        document.getElementById('chatProductPrice').innerText = '€' + (postPrice || '0.00');

        const imgEl = document.getElementById('chatProductImg');
        if (imgEl && postImg) { imgEl.src = postImg; imgEl.onclick = function() { openLightbox(this.src); }; }

        const disabledBox = document.getElementById('chatInputDisabled'); const inputBar = document.getElementById('chatInputBar');
        if (isSold) { if(disabledBox) disabledBox.style.display = 'block'; if(inputBar) inputBar.style.display = 'none'; } 
        else { if(disabledBox) disabledBox.style.display = 'none'; if(inputBar) inputBar.style.display = 'flex'; }

        const msgList = document.getElementById('chatMsgList'); 
        if(msgList) msgList.innerHTML = '<div style="text-align:center; color:#9CA3AF; font-size:12px; margin-top:20px;">加载历史消息中...</div>';
        
        // 简易渲染一条欢迎语
        setTimeout(() => {
            if(msgList) msgList.innerHTML = `<div class="chat-time-sys">聊天已加密保护</div><div class="chat-row other"><div class="chat-avatar">😎</div><div class="chat-text">你好！对我的发布感兴趣吗？</div></div>`;
        }, 500);
    } catch(e) { console.error("打开聊天失败", e); }
}
function closeChat() { document.getElementById('chatModal').style.display = 'none'; }
function sendChatMessage() {
    const input = document.getElementById('chatInput'); const text = input.value.trim(); if(!text) return;
    const msgList = document.getElementById('chatMsgList'); const savedAvatar = localStorage.getItem('hebao_avatar') || ''; const avatarHtml = savedAvatar ? `<img src="${savedAvatar}">` : `<span>😎</span>`;
    if(msgList) { msgList.insertAdjacentHTML('beforeend', `<div class="chat-row me"><div class="chat-text">${text}</div><div class="chat-avatar">${avatarHtml}</div></div>`); msgList.scrollTop = msgList.scrollHeight; }
    input.value = ''; 
}
function sendQuickMessage(text) {
    const input = document.getElementById('chatInput');
    if (input) { input.value = text; sendChatMessage(); }
}

// ================= 10. 生存红宝书：干货与打卡数据 =================
const rbTaskData = {
    'pre': [
        { id: 'p1', title: '核心文件随身带', desc: '护照、MVV签证信、出生双认证。万一行李丢了也能办手续！', hook: '买个好用的护照包', hookTab: 'market-idle' },
        { id: 'p2', title: '预约市政厅 (Gemeente)', desc: '8-9月号源紧张，拿到 BSN 才能办银行卡。务必提前预约！', hook: '找学长有偿指导', hookTab: 'market-help' },
        { id: 'p3', title: '兑换少量欧元零钱', desc: '换 €300 左右现金，要求给 €50 及以下面额！很多店拒收大钞。', hook: '收点二手零钱', hookTab: 'market-idle' }
    ],
    'day7': [
        { id: 't1', title: '办理本地银行卡', desc: '推荐 ING 或 Bunq。有了当地卡才能开通 Tikkie 和买火车票。', hook: '不会搞App？求助校友', hookTab: 'market-help' },
        { id: 't2', title: '激活 DigiD 数字身份', desc: '极其重要！收到信件后立刻激活，退税、查医保全靠它。', hook: '买台大屏显示器', hookTab: 'market-idle' }
    ],
    'month1': [
        { id: 'm1', title: '注册家庭医生 (Huisarts)', desc: '生病去急诊会被赶出来！必须先注册社区的 GP。', hook: '看不懂说明书？发悬赏', hookTab: 'market-help' }
    ]
};

const rbWikis = [
    { id: 'w1', mode: 'advanced', category: '羊毛购物', icon: '🛒', title: 'AH 超市 35% Off 贴纸规律', tag: '恩格尔系数狂降', summary: '摸透打折贴纸出没时间，实现牛排三文鱼自由。', details: 'AH 员工通常在每天下午 15:30 - 16:30 左右开始贴黄色的 35% 贴纸（临期商品）。' },
    { id: 'w4', mode: 'advanced', category: '交通出行', icon: '🚂', title: 'NS 火车终极省钱组合', tag: '交通刺客克星', summary: '荷兰火车票贵到离谱？这么坐直接打骨折。', details: '绝招：买一张 NS Flex Dal Voordeel (非高峰期4折) 套餐，每月只需 €5.6。' },
    { id: 'w8', mode: 'advanced', category: '生活避坑', icon: '🌡️', title: '年度能源账单结算陷阱', tag: '防坑几千欧', summary: '年底突然收到几千欧的天然气账单？', details: '建议平时在 App 里主动调高每月预付费，年底多退少补。' }
];

let currentRbMode = localStorage.getItem('hp_survival_mode') || 'starter';
let currentRbCategory = 'all';

function switchRbMode(mode) {
    try {
        currentRbMode = mode; localStorage.setItem('hp_survival_mode', mode);
        document.querySelectorAll('.rb-mode-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.rb-mode-btn[onclick*="${mode}"]`);
        if(activeBtn) activeBtn.classList.add('active');
        
        const toggleDisplay = (id, style) => { const el = document.getElementById(id); if(el) el.style.display = style; };
        
        if (mode === 'starter') {
            toggleDisplay('rbStarterMode', 'block'); toggleDisplay('rbWikiMode', 'none'); 
            renderStarterTasks();
        } else if (mode === 'advanced') {
            toggleDisplay('rbStarterMode', 'none'); toggleDisplay('rbWikiMode', 'block'); 
            toggleDisplay('rbWidgetsArea', 'flex'); toggleDisplay('proWidgetsArea', 'none');
            toggleDisplay('safetyCheckWidget', 'block'); toggleDisplay('wikiSectionArea', 'block'); 
            currentRbCategory = 'all'; 
            
            // 动态初始化百科分类 Tabs
            const tabContainer = document.getElementById('wikiTabs');
            if (tabContainer && tabContainer.innerHTML.trim() === '') {
                tabContainer.innerHTML = `<div class="w-tab active" onclick="switchWikiTab('all', this)">全部干货</div><div class="w-tab" onclick="switchWikiTab('羊毛购物', this)">羊毛购物</div><div class="w-tab" onclick="switchWikiTab('交通出行', this)">交通出行</div><div class="w-tab" onclick="switchWikiTab('生活避坑', this)">生活避坑</div>`;
            }
            renderWikiList(); 
        } else if (mode === 'pro') {
            toggleDisplay('rbStarterMode', 'none'); toggleDisplay('rbWikiMode', 'block'); 
            toggleDisplay('rbWidgetsArea', 'none'); toggleDisplay('proWidgetsArea', 'flex');
            toggleDisplay('safetyCheckWidget', 'none'); toggleDisplay('wikiSectionArea', 'none'); 
            renderProNews();
        }
    } catch(e) { console.error("模式切换错误:", e); }
}

function showEmergency(type) {
    if (type === 'medical') showToast('夜间急病请先拨打家庭医生夜间部，生命危险直拨 112！', 'error');
    else if (type === 'fraud') showToast('切勿提前转账定金！', 'warning');
    else if (type === 'key') showToast('千万别在谷歌搜带 [Ad] 的开锁匠 (极贵)！', 'warning');
    else if (type === 'passport') showToast('护照丢失请立刻报警获取挂失单！', 'error');
}

let currentTaskPhase = 'pre'; 
function switchTaskPhase(phase, el) { currentTaskPhase = phase; document.querySelectorAll('.tt-tab').forEach(tab => tab.classList.remove('active')); if(el) el.classList.add('active'); renderStarterTasks(); }

function renderStarterTasks() {
    try {
        const list = document.getElementById('starterTaskList'); if(!list) return;
        const savedProgress = JSON.parse(localStorage.getItem('hp_tasks_done') || '[]');
        const currentTasks = rbTaskData[currentTaskPhase];
        if (!currentTasks) return;
        
        let html = ''; let doneCount = 0;
        currentTasks.forEach(task => {
            const isDone = savedProgress.includes(task.id); if (isDone) doneCount++;
            html += `
            <div class="task-card ${isDone ? 'done' : ''}" id="task_${task.id}">
                <input type="checkbox" class="custom-checkbox-task" ${isDone ? 'checked' : ''} onchange="toggleTask('${task.id}', this)">
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-desc">${task.desc}</div>
                    <div class="task-hook-action" onclick="showToast('正带您去完成任务...')"><span>👉</span> ${task.hook}</div>
                </div>
            </div>`;
        });
        list.innerHTML = html;
        
        const pb = document.getElementById('taskProgressBar'); if(pb) pb.style.width = `${(doneCount / currentTasks.length) * 100}%`;
        const pt = document.getElementById('taskProgressText'); if(pt) pt.innerText = `${doneCount}/${currentTasks.length}`;
    } catch(e) { console.error("渲染任务出错:", e); }
}

function toggleTask(id, checkbox) {
    let savedProgress = JSON.parse(localStorage.getItem('hp_tasks_done') || '[]');
    if (checkbox.checked) { if (!savedProgress.includes(id)) savedProgress.push(id); } 
    else { savedProgress = savedProgress.filter(taskId => taskId !== id); }
    localStorage.setItem('hp_tasks_done', JSON.stringify(savedProgress));
    renderStarterTasks(); 
}

let swipeStartX = 0, swipeCurrentX = 0, isSwiping = false, isDraggingClickPrevent = false, activeSwipeId = null;
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
function toggleWikiCard(el) { if (isSwiping || isDraggingClickPrevent) return; const transform = window.getComputedStyle(el).transform; const matrix = new WebKitCSSMatrix(transform); if (Math.abs(matrix.m41) < 5) el.classList.toggle('open'); }
function handleWikiAction(id, actionStr) {
    let arr = JSON.parse(localStorage.getItem(`hp_wiki_${actionStr}`) || '[]'); if (!arr.includes(id)) arr.push(id);
    localStorage.setItem(`hp_wiki_${actionStr}`, JSON.stringify(arr));
    if(actionStr === 'saved') showToast("⭐ 已加入收藏", "success");
    renderWikiList();
}

function switchWikiTab(category, el) { document.querySelectorAll('.w-tab').forEach(tab => tab.classList.remove('active')); el.classList.add('active'); currentRbCategory = category; renderWikiList(); }

function renderWikiList(searchQuery = '') {
    try {
        const list = document.getElementById('wikiListContainer'); if(!list) return;
        let html = '';
        const deletedData = JSON.parse(localStorage.getItem('hp_wiki_deleted') || '[]'); const savedData = JSON.parse(localStorage.getItem('hp_wiki_saved') || '[]');
        
        let filteredData = rbWikis.filter(w => {
            if (deletedData.includes(w.id) || savedData.includes(w.id)) return false;
            const catMatch = currentRbCategory === 'all' ? true : w.category === currentRbCategory;
            return catMatch;
        });

        if (filteredData.length === 0) { 
            list.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding: 60px 0;">该分类下暂无干货啦！<br><br><span style="font-size:12px; cursor:pointer; color:#10B981; text-decoration:underline;" onclick="localStorage.removeItem(\'hp_wiki_deleted\'); localStorage.removeItem(\'hp_wiki_saved\'); renderWikiList();">点我重置所有卡片</span></div>'; 
        } else {
            filteredData.forEach(w => {
                // 🛡️ 修复点：openWikiComments 内部字符串完全防护
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
            list.innerHTML = html;
        }
    } catch(e) { console.error("渲染百科卡片错误:", e); }
}

let currentWikiIdForComment = null;
function openWikiComments(wikiId, wikiTitle) {
    try {
        currentWikiIdForComment = wikiId; 
        const modal = document.getElementById('wikiCommentModal');
        if (!modal) { showToast("找不到评论区弹窗", "error"); return; }
        modal.style.display = 'flex'; 
        document.querySelector('#wikiCommentModal .fm-title').innerText = wikiTitle + ' 的评论'; 
        renderWikiComments(); 
    } catch(e) { console.error(e); }
}

function renderWikiComments() {
    const list = document.getElementById('wikiCommentList'); if(!list) return;
    const allComments = JSON.parse(localStorage.getItem('hp_wiki_comments') || '{}'); const comments = allComments[currentWikiIdForComment] || [];
    if (comments.length === 0) { list.innerHTML = `<div style="text-align:center; color:#9CA3AF; padding:40px 0;">还没有人分享踩坑经验，你来抢沙发吧！</div>`; return; }
    let html = ''; comments.forEach(c => { html += `<div class="wc-item"><div class="wc-avatar">${c.avatar}</div><div class="wc-content"><div class="wc-name"><span>${c.name}</span> <span style="color:#9CA3AF; font-weight:normal;">刚刚</span></div><div class="wc-text">${c.text}</div></div></div>`; });
    list.innerHTML = html; list.scrollTop = list.scrollHeight;
}
function submitWikiComment() {
    const input = document.getElementById('wikiCommentInput'); const text = input.value.trim(); if (!text) return showToast("写点什么再发送吧！", "warning");
    const allComments = JSON.parse(localStorage.getItem('hp_wiki_comments') || '{}'); if (!allComments[currentWikiIdForComment]) allComments[currentWikiIdForComment] = [];
    allComments[currentWikiIdForComment].push({ name: localStorage.getItem('hp_name') || '管家热心用户', avatar: '😎', text: text });
    localStorage.setItem('hp_wiki_comments', JSON.stringify(allComments)); input.value = ''; renderWikiComments(); showToast("💡 分享干货，信用分 +2", "success");
}

function checkSafetyCode() {
    const input = document.getElementById('postcodeInput').value.trim(); const resultBox = document.getElementById('safetyResult');
    if (input.length !== 4) return showToast("请输入准确的4位数字邮编哦！(例如：2512)", "warning"); 
    resultBox.style.display = 'block';
    const dangerZones = ['2512', '2525', '2526', '3081', '3083', '1102', '1103', '1104', '1062']; 
    if (dangerZones.includes(input)) { resultBox.className = 'sc-result danger'; resultBox.innerHTML = `<b>🔴 高危预警：</b><br>历史治安反馈较差，建议避免夜间单独出行，租房避开一楼。`; } 
    else { resultBox.className = 'sc-result safe'; resultBox.innerHTML = `<b>🟢 治安良好：</b><br>管家数据库显示该区暂无高频恶性治安反馈，正常生活即可。`; }
}

async function renderProNews() {
    const container = document.getElementById('proNewsList'); if (!container) return;
    container.innerHTML = `<div style="text-align:center; padding:30px 0; color:#9CA3AF; font-size:13px;">请前往阶段一接通 Vercel API 即可激活新闻模块</div>`;
}

// ================= 11. 终极自启动 =================
window.addEventListener('DOMContentLoaded', () => { 
    try {
        loadTrendingToHome(); 
        loadCommunityPosts();
        switchRbMode(currentRbMode); // 启动红宝书渲染
    } catch(e) { console.error("系统初始化失败:", e); }
});
