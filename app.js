// ================= 1. 全局状态与鉴权拦截 =================
let userUUID = localStorage.getItem('hebao_uuid');
if (!userUUID) { 
    userUUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) { 
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); 
        return v.toString(16); 
    }); 
    localStorage.setItem('hebao_uuid', userUUID); 
}

let isLoggedIn = localStorage.getItem('hebao_logged_in') === 'true';
let currentPendingAction = null; 

function requireAuth(actionFunction) {
    if (!isLoggedIn) {
        currentPendingAction = actionFunction;
        const modal = document.getElementById('loginModal');
        if (modal) modal.style.display = 'flex';
        else alert("⚠️ 演示模式：请先登录！");
    } else { 
        actionFunction(); 
    }
}

function openLoginModal() { 
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'flex'; 
}

function mockLoginProcess() {
    const btn = document.querySelector('.btn-huge-login');
    if(btn) btn.innerText = '登录中...';
    setTimeout(() => {
        isLoggedIn = true;
        localStorage.setItem('hebao_logged_in', 'true');
        if(!localStorage.getItem('hp_name')) localStorage.setItem('hp_name', '管家新人_' + Math.floor(Math.random()*1000));
        const modal = document.getElementById('loginModal');
        if(modal) modal.style.display = 'none';
        if(btn) btn.innerText = '一键登录 / 注册';
        
        renderProfileState(); 
        
        if (currentPendingAction) { 
            currentPendingAction(); 
            currentPendingAction = null; 
        } else { 
            alert('🎉 登录成功！欢迎来到荷包管家。'); 
        }
    }, 800);
}

function handleLogout() {
    if(confirm('确定要退出登录吗？')) {
        isLoggedIn = false;
        localStorage.setItem('hebao_logged_in', 'false');
        renderProfileState();
    }
}

// ================= 2. 基础导航与 Tab 切换 =================
let lastTab = 'scan'; 

function switchTab(tabId, element) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('page-' + tabId);
    if(target) target.classList.add('active');

    if (element) { 
        document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active')); 
        element.classList.add('active'); 
        if (tabId !== 'details') lastTab = tabId; 
    }

    if (tabId === 'details') { 
        const tabBar = document.querySelector('.tab-bar');
        if(tabBar) tabBar.style.display = 'none'; 
        const chatBar = document.getElementById('stickyChatBar');
        if(chatBar) chatBar.style.display = 'flex'; 
    } else { 
        const tabBar = document.querySelector('.tab-bar');
        if(tabBar) tabBar.style.display = 'flex'; 
        const chatBar = document.getElementById('stickyChatBar');
        if(chatBar) chatBar.style.display = 'none'; 
    }

    if (tabId === 'profile') { renderFootprints(); renderProfileState(); }
}

function goBack() { switchTab(lastTab, document.querySelector(`.tab-item[onclick*="${lastTab}"]`)); }

function switchMarketTab(type, element) {
    document.querySelectorAll('.market-content').forEach(el => el.classList.remove('active'));
    document.getElementById('market-' + type).classList.add('active');

    document.querySelectorAll('.m-tab').forEach(el => el.classList.remove('active'));
    if(element) element.classList.add('active');
}

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

// ================= 3. 个人主页逻辑 =================
function renderProfileState() {
    const guestBlock = document.getElementById('guestLoginBlock');
    const actionsBlock = document.getElementById('profileActions');
    const uidText = document.getElementById('profileUid');
    const nameText = document.getElementById('profileName');
    const creditBadge = document.getElementById('profileCreditBadge');
    const bioText = document.getElementById('profileBio');
    const tagsBox = document.getElementById('profileTags');
    
    const postsEmptyState = document.getElementById('postsEmptyState');
    const reviewsEmptyState = document.getElementById('reviewsEmptyState');
    if(!guestBlock) return;

    if (isLoggedIn) {
        guestBlock.style.display = 'none'; actionsBlock.style.display = 'flex';
        uidText.innerText = 'ID: ' + userUUID.substring(0,8).toUpperCase();
        
        const savedName = localStorage.getItem('hp_name') || '管家新人';
        const savedGender = localStorage.getItem('hp_gender') || '';
        const savedMbti = localStorage.getItem('hp_mbti') || '';
        const savedBio = localStorage.getItem('hp_bio') || '这个人很懒，还没写自我介绍~';
        
        nameText.innerText = savedName; bioText.innerText = savedBio; bioText.style.display = 'block';

        let score = 500;
        if(localStorage.getItem('hebao_avatar')) score += 20;
        if(savedMbti) score += 30;
        
        let badgeText = '良好'; let badgeColor = '#D97706';
        if(score > 530) { badgeText = '极佳'; badgeColor = '#10B981'; }
        creditBadge.innerText = `${badgeText} ${score}`; creditBadge.style.background = badgeColor; creditBadge.style.display = 'inline-block';

        tagsBox.style.display = 'flex';
        document.getElementById('profileGenderTag').innerText = savedGender || '保密';
        document.getElementById('profileMbtiTag').innerText = savedMbti || 'MBTI未知';

        if(reviewsEmptyState) reviewsEmptyState.innerHTML = '<div class="empty-state-icon">📭</div>暂无收到的评价';
        loadAvatar();
        loadMyPosts(); // 自动拉取我的帖子
    } else {
        guestBlock.style.display = 'block'; actionsBlock.style.display = 'none';
        uidText.innerText = 'ID: 未登录'; nameText.innerText = '管家游客';
        creditBadge.style.display = 'none'; bioText.style.display = 'none'; tagsBox.style.display = 'none';
        document.getElementById('profileAvatarImg').style.display = 'none';
        document.getElementById('profileAvatarBox').style.background = '#E5E7EB';
        document.getElementById('profileAvatarEmoji').textContent = '👻';
        if(postsEmptyState) postsEmptyState.innerHTML = '<div class="empty-state-icon">🔒</div>请先登录查看你的发布记录';
        if(reviewsEmptyState) reviewsEmptyState.innerHTML = '<div class="empty-state-icon">🔒</div>请先登录查看收到的评价';
        const listDiv = document.getElementById('myPostsList');
        if(listDiv) listDiv.innerHTML = '';
    }
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
    if(!name) return alert('昵称不能为空哦！');
    localStorage.setItem('hp_name', name); localStorage.setItem('hp_gender', document.getElementById('epGender').value);
    localStorage.setItem('hp_mbti', document.getElementById('epMbti').value); localStorage.setItem('hp_wechat', document.getElementById('epWechat').value.trim());
    localStorage.setItem('hp_bio', document.getElementById('epBio').value.trim());
    document.getElementById('editProfileModal').style.display = 'none';
    renderProfileState(); 
    const plus = document.createElement('div'); plus.className = 'float-plus'; plus.innerText = '✨ 资料完善，信用分暴涨！'; plus.style.color = '#10B981';
    plus.style.left = '50%'; plus.style.top = '50%'; plus.style.transform = 'translate(-50%, -50%)'; document.body.appendChild(plus); setTimeout(() => plus.remove(), 1500);
}

function previewAvatar(event) {
    const file = event.target.files[0]; if(!file) return; const reader = new FileReader();
    reader.onload = function(e) { localStorage.setItem('hebao_avatar', e.target.result); renderProfileState(); }; reader.readAsDataURL(file);
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

// ================= 4. 首页双扫码引擎与榜单 =================
let currentProductData = null; 
let currentDetailData = null; 
let globalTrendingLikes = []; 
let globalTrendingDislikes = [];

// [引擎A：AI 拍包装排雷]
async function handlePackageImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('homeActionBox').style.display = 'none';
    document.getElementById('previewContainer').style.display = 'block';
    document.getElementById('scanOverlay').style.display = 'flex';
    document.getElementById('scanText').innerText = "📡 管家双眼发光，正在解析包装...";
    document.getElementById('miniResultCard').style.display = 'none';

    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Data = e.target.result.split(',')[1];
        const previewImg = document.getElementById('previewImg');
        if (previewImg) previewImg.src = e.target.result;

        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64Data })
            });
            const data = await res.json();
            if(!res.ok || data.error) throw new Error(data.error || "识别失败");

            currentProductData = data; 
            currentProductData.image_url = e.target.result; 

            document.getElementById('scanOverlay').style.display = 'none'; 
            document.getElementById('previewContainer').style.display = 'none'; 
            document.getElementById('miniResultCard').style.display = 'block'; 
            
            const isGood = data.is_recommended === 1;
            const emoji = isGood ? '👍' : '💣';
            document.getElementById('miniChineseName').innerText = `${emoji} ${data.chinese_name || data.dutch_name || '未知商品'}`; 
            document.getElementById('miniInsight').innerText = data.insight || '管家觉得这个还不错~'; 
            
            saveToLocalFootprint(data, data.image_url);
        } catch (err) {
            alert("识别失败：" + err.message);
            resetApp();
        } finally {
            document.getElementById('packageImgInput').value = '';
        }
    };
    reader.readAsDataURL(file);
}

// [引擎B：扫条形码精确匹配]
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
    }).catch(err => { 
        alert("调用摄像头失败！请确保您允许了网页使用相机权限。"); 
        closeScanner();
    });
}

function closeScanner() { 
    if(html5Scanner) { html5Scanner.stop().catch(e => console.log("停止相机失败", e)); html5Scanner = null; }
    document.getElementById('scannerModal').style.display = 'none'; 
}

function executeSearch() {
    const query = document.getElementById('mainSearchInput').value.trim(); if (!query) return;
    document.getElementById('homeActionBox').style.display='none'; document.getElementById('previewContainer').style.display='block'; document.getElementById('scanOverlay').style.display='flex'; document.getElementById('scanText').innerText = "📡 正在全网检索..."; document.getElementById('miniResultCard').style.display='none';
    
    fetch('/api/scan-barcode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ barcode: query, userId: userUUID }) })
    .then(res => res.json())
    .then(data => {
        currentProductData = data; 
        document.getElementById('scanOverlay').style.display='none'; 
        document.getElementById('previewContainer').style.display='none'; 
        document.getElementById('miniResultCard').style.display='block'; 
        document.getElementById('miniChineseName').innerText=data.chinese_name||'未知商品'; 
        document.getElementById('miniInsight').innerText=data.insight||'暂无评价'; 
        saveToLocalFootprint(data, data.image_url);
    }).catch(err => { alert("未找到商品信息！"); resetApp(); });
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
        const res = await fetch('/api/trending'); 
        const data = await res.json();
        if(data.success) { 
            globalTrendingLikes = data.topLikes || []; 
            globalTrendingDislikes = data.topDislikes || []; 
            renderHomeTrending(globalTrendingLikes, 'homeTrendingListLikes', 'like'); 
            renderHomeTrending(globalTrendingDislikes, 'homeTrendingListDislikes', 'dislike'); 
        }
    } catch(e) { document.getElementById('homeTrendingListLikes').innerHTML = '<div style="text-align:center; color:#9CA3AF; font-size: 12px; margin-top:20px;">榜单加载中...</div>'; }
}

function renderHomeTrending(list, containerId, type) {
    const container = document.getElementById(containerId); if (!container || !list || list.length === 0) return; 
    let html = '';
    const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23F3F4F6'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='10' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'%3E暂无图%3C/text%3E%3C/svg%3E";

    list.slice(0, 20).forEach((item, index) => {
        let badgeClass = 'rank-other'; 
        if (index === 0) badgeClass = 'rank-1'; else if (index === 1) badgeClass = 'rank-2'; else if (index === 2) badgeClass = 'rank-3'; 
        if (type === 'dislike') badgeClass = 'rank-bad';
        const score = type === 'like' ? item.likes : item.dislikes; const icon = type === 'like' ? '👍' : '💣'; const scoreColor = type === 'like' ? '#10B981' : '#EF4444';
        const safeImg = item.image_url || fallbackSvg;
        html += `<div class="trending-card" onclick="openDetailsFromHomeTrending('${type}', ${index})"><div class="rank-badge ${badgeClass}">TOP ${index + 1}</div><img src="${safeImg}" onerror="this.onerror=null; this.src='${fallbackSvg}'" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; background: #F3F4F6; border: 1px solid #E5E7EB;"><div class="t-info"><div class="t-name">${item.chinese_name || '未命名商品'}</div><div style="font-size: 11px; color: #9CA3AF; margin-top:2px;">${item.dutch_name || ''}</div></div><div class="t-score" style="color: ${scoreColor}">${icon} ${score}</div></div>`;
    });
    container.innerHTML = html;
}

// ================= 5. 详情页与足迹逻辑 =================
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
    else { document.getElementById('detailRecipeBox').style.display = 'block'; document.getElementById('recipeCardList').innerHTML = '<div style="text-align:center;color:#9CA3AF;font-size:13px;padding:20px 0;">暂无评价，快来抢沙发！</div>'; }
    document.getElementById('chatHistory').innerHTML = ''; document.getElementById('askInput').value = '';
    switchTab('details', null);
}

function renderReviewCards(pairingString) {
    const list = document.getElementById('recipeCardList'); list.innerHTML = '';
    let reviews = pairingString.split('\n\n').filter(l => l.trim()).map((line, idx) => {
        const isLike = line.includes('👍'); const isRealUser = line.includes('🧑‍🍳');
        const cleanText = line.replace(/🧑‍🍳 网友点评 \[.*?\]：|🤖 AI预测口味 \[.*?\]：/, '').trim();
        const mockLikes = isRealUser ? Math.floor(Math.random() * 50) + 5 : 0; 
        const avatar = isRealUser ? ['🐼','😎','👻','👩‍💻','🐱'][idx % 5] : '🤖';
        const name = isRealUser ? '热心网友_' + Math.floor(Math.random()*900+100) : 'AI 预测口味';
        return { id: idx, text: cleanText, isLike, isRealUser, likes: mockLikes, avatar, name };
    });
    reviews.sort((a, b) => b.likes - a.likes);
    reviews.forEach(r => {
        const tagHtml = r.isRealUser ? `<span class="r-tag ${r.isLike ? 'like' : 'dislike'}">${r.isLike ? '👍 推荐' : '💣 避雷'}</span>` : `<span class="r-tag" style="background:#F3F4F6; color:#6B7280;">🤖 AI</span>`;
        list.innerHTML += `<div class="recipe-card"><div class="r-header"><div class="r-user" onclick="alert('即将开放 [${r.name}] 的主页')"><div class="r-avatar">${r.avatar}</div><div class="r-name">${r.name}</div>${tagHtml}</div><div class="r-like-btn" id="reviewLike_${r.id}" onclick="likeReviewCard(${r.id}, event)"><span style="font-size:14px;">💡</span> <span id="rLikeCount_${r.id}">${r.likes}</span></div></div><div class="r-text">${r.text}</div></div>`;
    });
}

function likeReviewCard(id, event) {
    const btn = event.currentTarget; if(btn.classList.contains('voted')) return;
    btn.classList.add('voted');
    const countSpan = document.getElementById('rLikeCount_' + id); countSpan.innerText = parseInt(countSpan.innerText) + 1;
    const rect = btn.getBoundingClientRect(); const plus = document.createElement('div'); plus.className = 'float-plus'; plus.innerText = '+1'; plus.style.color = '#D97706';
    plus.style.left = rect.left + 'px'; plus.style.top = (rect.top - 10) + 'px'; document.body.appendChild(plus); setTimeout(() => plus.remove(), 800);
}

function openAddReviewModal() { document.getElementById('reviewText').value = ''; document.getElementById('addReviewModal').style.display = 'flex'; }

async function submitDetailReview() {
    const text = document.getElementById('reviewText').value.trim(); if(!text) return alert("写点内容再提交哦！");
    const attitude = document.getElementById('reviewAttitude').value; const finalUgcText = `🧑‍🍳 网友点评 [${attitude}]：${text}`;
    const btn = document.getElementById('btnSubmitReview'); btn.innerText = "提交中..."; btn.disabled = true;
    try {
        currentDetailData.pairing = currentDetailData.pairing ? currentDetailData.pairing + '\n\n' + finalUgcText : finalUgcText;
        let history = JSON.parse(localStorage.getItem('hebao_history') || '[]');
        let index = history.findIndex(i => i.dutch_name === currentDetailData.dutch_name);
        if(index !== -1) { history[index].pairing = currentDetailData.pairing; localStorage.setItem('hebao_history', JSON.stringify(history)); }
        
        const actionType = attitude.includes('推荐') ? 'like' : 'dislike';
        await fetch('/api/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dutch_name: currentDetailData.dutch_name, action: actionType }) });

        alert("🎉 评价发布成功！"); document.getElementById('addReviewModal').style.display = 'none'; setupDetailPage();
    } catch(e) { alert("网络错误..."); } finally { btn.innerText = "🚀 提交评价"; btn.disabled = false; }
}

async function sendQuestion() {
    const input = document.getElementById('askInput'); const question = input.value.trim(); if(!question) return;
    const chatBox = document.getElementById('chatHistory');
    const dName = currentDetailData.dutch_name || currentDetailData.chinese_name || "未知商品"; const dInsight = currentDetailData.insight || "";
    
    chatBox.innerHTML += `<div class="chat-bubble bubble-user">${question}</div>`; input.value = ''; window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    const loadingId = 'loading-' + Date.now(); chatBox.innerHTML += `<div class="chat-bubble bubble-ai" id="${loadingId}">管家正在查阅资料...</div>`;
    
    try {
        const response = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productName: dName, insight: dInsight, question: question, userId: userUUID }) });
        const data = await response.json(); document.getElementById(loadingId).remove();
        if (response.ok) { chatBox.innerHTML += `<div class="chat-bubble bubble-ai">🤖 ${data.reply}</div>`; } else { chatBox.innerHTML += `<div class="chat-bubble bubble-ai" style="color:red;">哎呀卡住了：${data.error}</div>`; }
    } catch (err) { document.getElementById(loadingId).remove(); chatBox.innerHTML += `<div class="chat-bubble bubble-ai" style="color:red;">网络断了...</div>`; }
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function saveToLocalFootprint(data, img) { 
    let h = JSON.parse(localStorage.getItem('hebao_history')||'[]'); 
    if(!h.find(i=>i.dutch_name===data.dutch_name)){ data.img_src=img; h.unshift(data); localStorage.setItem('hebao_history',JSON.stringify(h)); } 
}

function renderFootprints() { 
    const listDiv = document.getElementById('footprintList'); let h = JSON.parse(localStorage.getItem('hebao_history') || '[]'); 
    if (h.length === 0) { listDiv.innerHTML = '<div style="text-align:center; color:#9CA3AF; margin-top:20px; font-size:13px; border: 1px dashed #E5E7EB; padding: 30px; border-radius: 16px;">暂无足迹，快去首页扫码吧</div>'; return; } 
    let html = ''; const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23F3F4F6'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='10' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'%3E暂无图%3C/text%3E%3C/svg%3E";
    h.forEach((item, index) => { 
        const safeImg = item.img_src || item.image_url || fallbackSvg;
        html += `<div style="background:#FFF; border-radius:16px; margin-bottom:12px; border:1px solid #E5E7EB; overflow:hidden; display:flex; align-items:center; padding:12px; box-shadow:0 2px 8px rgba(0,0,0,0.02); cursor:pointer;" onclick="openDetailsFromHistory(${index})"><img src="${safeImg}" onerror="this.onerror=null; this.src='${fallbackSvg}'" style="width:50px; height:50px; object-fit:cover; border-radius:10px; flex-shrink:0; background:#F3F4F6;"><div style="flex:1; margin-left:12px;"><div style="font-weight:900; font-size:15px; color:#111827; margin-bottom:2px;">${item.chinese_name || '未命名'}</div><div style="font-size:12px; color:#9CA3AF; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;">${item.insight || ''}</div></div></div>`; 
    }); 
    listDiv.innerHTML = html; 
}

// ================= 6. 省钱秘籍渲染 =================
function renderTipsPage() {
    if (typeof quickLinksData !== 'undefined') { 
        let qlHtml = ''; 
        quickLinksData.forEach(link => { qlHtml += `<a href="${link.url}" target="_blank" class="ql-card"><div class="ql-icon">${link.icon}</div><div class="ql-title">${link.title}</div><div class="ql-sub">${link.sub}</div></a>`; }); 
        if(document.getElementById('quickLinksContainer')) document.getElementById('quickLinksContainer').innerHTML = qlHtml; 
    }
    
    if (typeof tipsData !== 'undefined') {
        let accHtml = '';
        tipsData.forEach(cat => {
            const highlightHtml = cat.highlight ? `<span style="background: #FEF2F2; color: #EF4444; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-left: 5px;">${cat.highlight}</span>` : '';
            let storesHtml = '';
            cat.stores.forEach(store => {
                let itemsHtml = '';
                store.tips.forEach(tip => {
                    const formattedDesc = tip.desc.replace(/\*\*(.*?)\*\*/g, '<span style="color:#D97706; font-weight:bold; background:#FFFBEB; padding:1px 5px; border-radius:6px; margin:0 2px;">$1</span>');
                    itemsHtml += `<div class="tip-item"><div class="tip-title">${tip.title}</div><div class="tip-desc">${formattedDesc}</div></div>`;
                });
                storesHtml += `<div class="store-card"><div class="store-header" onclick="toggleTipsContent(this)"><div class="s-icon-name"><span class="s-logo">${store.storeLogo}</span>${store.storeName}</div><span class="store-arrow">▼</span></div><div class="store-content"><div class="store-inner">${itemsHtml}</div></div></div>`;
            });
            accHtml += `<div class="tips-accordion"><div class="tips-header" onclick="toggleTipsContent(this)"><div class="tips-title-wrap"><span class="tips-icon">${cat.categoryIcon}</span> <span>${cat.categoryName}</span> ${highlightHtml}</div><span class="tips-arrow">▼</span></div><div class="tips-content"><div class="tips-inner">${storesHtml}</div></div></div>`;
        });
        if(document.getElementById('tipsAccordionContainer')) document.getElementById('tipsAccordionContainer').innerHTML = accHtml;
    }
}

function toggleTipsContent(element) { element.classList.toggle('active'); }

// ================= 7. 语音识别、多图上传与发帖引擎 =================

// 【1】新增：一键清空输入框逻辑
function clearAIInput(type) {
    const input = document.getElementById(`aiKeywords_${type}`);
    if (input) {
        input.value = '';
        input.focus(); // 清空后自动拉起键盘，体验更丝滑
    }
}

// 【2】Web Speech API 兼容强化版
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN'; 
    recognition.continuous = false; // ⚠️ 修复安卓：必须设为false，录完一句马上停，否则会卡死
    recognition.interimResults = false; 
}

function toggleVoiceInput(type) {
    const btn = document.getElementById(`btnVoiceInput_${type}`);
    const input = document.getElementById(`aiKeywords_${type}`);
    
    if (!recognition) {
        alert('💡 管家提示：您的浏览器暂不支持网页语音。请直接点击输入框，使用【输入法自带的语音麦克风】说话，效果更好哦！');
        return;
    }
    
    if (btn.classList.contains('recording')) { 
        recognition.stop(); 
        return; 
    }

    btn.classList.add('recording'); 
    btn.innerText = '🔴'; 
    const oldPlaceholder = input.placeholder;
    input.placeholder = '请说话，管家正在听...';
    
    try { 
        recognition.start(); 
    } catch(e) {
        console.warn("语音引擎已在运行中", e);
    }

    // 每次开始录音，重新绑定事件防抽风
    recognition.onresult = (event) => { 
        input.value += event.results[0][0].transcript; 
    };
    
    recognition.onend = () => {
        btn.classList.remove('recording'); 
        btn.innerText = '🎙️'; 
        input.placeholder = oldPlaceholder;
        // 如果录到了内容，自动呼叫大模型填表
        if(input.value.trim() !== '') generateAICopy(type); 
    };
    
    recognition.onerror = (event) => {
        btn.classList.remove('recording'); 
        btn.innerText = '🎙️'; 
        input.placeholder = oldPlaceholder;
        
        console.error("语音识别错误:", event.error);
        if (event.error === 'not-allowed') {
            alert('🎤 麦克风权限被拒绝。请在浏览器设置中允许本站使用麦克风。');
        } else if (event.error === 'network') {
            alert('🌐 安卓手机连接谷歌语音服务器失败。建议直接点击输入框，使用【输入法自带的语音按键】！');
        } else {
            alert('没听清哦，可以点 ✖️ 清空重说，或者直接打字。');
        }
    };
}

// DeepSeek 自动填表引擎
async function generateAICopy(type) {
    const inputEl = document.getElementById(`aiKeywords_${type}`);
    const btnEl = document.getElementById(`btnAiMagic_${type}`);
    const keyword = inputEl.value.trim();
    if (!keyword) return alert("请先输入一些文字或使用语音哦！");
    
    btnEl.innerText = "⏳ DeepSeek 疯狂码字并填表中..."; 
    btnEl.disabled = true;

    try {
        let payload = { keyword, type };
        
        // 🔮 闲置特权：如果表单里已经有内容了，把旧内容发给AI，让它合并计算总价！
        if (type === 'idle') {
            payload.currentDesc = document.getElementById('idleDesc').value.trim();
            payload.currentPrice = document.getElementById('idlePrice').value.trim() || 0;
        }

        const res = await fetch('/api/generate-copy', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });
        const data = await res.json();
        if(data.error) throw new Error(data.error);

        // 动态将 AI 的返回结果填入不同的 DOM
        if (type === 'idle') {
            if(data.copy) document.getElementById('idleDesc').value = data.copy;
            if(data.price) document.getElementById('idlePrice').value = data.price;
            if(data.deadline) document.getElementById('idleDeadline').value = data.deadline;
            if(data.location) matchSelect('idleLocation', data.location);
            if(data.bargain) matchPills('bargainGroup', data.bargain);
            if(data.payment) matchPills('paymentGroup', data.payment);
        } 
        else if (type === 'help') {
            if(data.copy) document.getElementById('helpDesc').value = data.copy;
            if(data.reward) document.getElementById('helpReward').value = data.reward;
            if(data.time) document.getElementById('helpTime').value = data.time;
            if(data.location) document.getElementById('helpLocation').value = data.location;
            if(data.urgent) matchPills('helpUrgentGroup', data.urgent);
        }
        else if (type === 'partner') {
            if(data.title) document.getElementById('partnerTitle').value = data.title;
            if(data.copy) document.getElementById('partnerDesc').value = data.copy;
            if(data.date) document.getElementById('partnerDate').value = data.date;
            if(data.location) document.getElementById('partnerLocation').value = data.location;
            if(data.mbti) matchSelect('partnerMbti', data.mbti);
        }

        inputEl.value = '';
        btnEl.innerText = "✨ 魔法完成！已自动填表！";
    } catch (err) {
        alert("AI生成失败：" + err.message);
        btnEl.innerText = "🪄 自动填表";
    } finally { 
        setTimeout(() => { btnEl.innerText = "🪄 自动填表"; btnEl.disabled = false; }, 3000); 
    }
}

// 辅助函数：模糊匹配下拉框
function matchSelect(selectId, text) {
    const sel = document.getElementById(selectId);
    if(!sel || !text) return;
    for(let i=0; i<sel.options.length; i++) {
        if(sel.options[i].value === text || sel.options[i].text.includes(text) || text.includes(sel.options[i].text)) { 
            sel.selectedIndex = i; break; 
        }
    }
}

// 辅助函数：模糊匹配胶囊按钮
function matchPills(groupId, text) {
    if(!text) return;
    document.querySelectorAll(`#${groupId} .pill`).forEach(el => { 
        if(el.innerText.includes(text.split('/')[0]) || text.includes(el.innerText)) {
            selectPill(el, groupId);
        }
    });
}

async function submitIdlePost() {
    const desc = document.getElementById('idleDesc').value.trim();
    const price = document.getElementById('idlePrice').value.trim();
    const loc = document.getElementById('idleLocation').value;
    if(!desc) return alert("文案还没写呢！快试试语音一句话发帖吧！");
    
    const btn = document.querySelector('#publishIdleModal .fm-submit');
    btn.innerText = "上传中..."; btn.style.pointerEvents = 'none';

    try {
        let finalImageUrls = await uploadImagesToCOS();
        const finalTitle = `[闲置] €${price || '面议'} · ${loc}`;
        const authorName = localStorage.getItem('hp_name') || '管家新人';
        
        const res = await fetch('/api/publish-community', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: userUUID, authorName: authorName, title: finalTitle, text: desc, imageUrl: finalImageUrls }) });
        const data = await res.json();
        if(!data.success) throw new Error(data.error);

        alert("🎉 发布成功！支持多图的闲置帖已上架！");
        closeIdlePublish();
        
        selectedImagesArray = []; renderThumbnails(); document.getElementById('idleDesc').value = '';
        loadCommunityPosts(); 
    } catch(e) { alert("发布失败：" + e.message); } 
    finally { btn.innerText = "发布"; btn.style.pointerEvents = 'auto'; }
}

async function submitHelpPost() {
    const desc = document.getElementById('helpDesc').value.trim();
    const reward = document.getElementById('helpReward').value.trim();
    const urgentGroup = document.querySelector('#helpUrgentGroup .active');
    const urgent = urgentGroup && urgentGroup.innerText.includes('十万火急') ? '🔥急' : '普通';
    
    if(!desc) return alert("请简单描述一下你需要什么帮助哦！");
    const btn = document.querySelector('#publishHelpModal .fm-submit'); btn.innerText = "发送中..."; btn.style.pointerEvents = 'none';

    try {
        const finalTitle = `[互助-${urgent}] 赏金 €${reward || '0'}`;
        const authorName = localStorage.getItem('hp_name') || '管家新人';
        
        const res = await fetch('/api/publish-community', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: userUUID, authorName: authorName, title: finalTitle, text: desc, imageUrl: '' }) });
        if(!res.ok) throw new Error("保存到数据库失败");

        alert("🎉 悬赏发布成功！已永久写入数据库！");
        closeHelpPublish(); document.getElementById('helpDesc').value = ''; loadCommunityPosts(); 
    } catch(e) { alert("发布失败：" + e.message); } 
    finally { btn.innerText = "发布"; btn.style.pointerEvents = 'auto'; }
}

async function submitPartnerPost() {
    const title = document.getElementById('partnerTitle').value.trim();
    const desc = document.getElementById('partnerDesc').value.trim();
    if(!title) return alert("写个吸引人的标题吧！");
    const btn = document.querySelector('#publishPartnerModal .fm-submit'); btn.innerText = "发送中..."; btn.style.pointerEvents = 'none';

    try {
        const finalTitle = `[找搭子] ${title}`;
        const authorName = localStorage.getItem('hp_name') || '管家新人';
        const res = await fetch('/api/publish-community', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: userUUID, authorName: authorName, title: finalTitle, text: desc, imageUrl: '' }) });
        if(!res.ok) throw new Error("保存到数据库失败");

        alert("🎉 找搭子发布成功！缘分正在赶来的路上...");
        closePartnerPublish(); document.getElementById('partnerTitle').value = ''; document.getElementById('partnerDesc').value = ''; loadCommunityPosts(); 
    } catch(e) { alert("发布失败：" + e.message); } 
    finally { btn.innerText = "发布"; btn.style.pointerEvents = 'auto'; }
}

// ================= 8. 集市模块：从数据库拉取与渲染 =================
let mockIdleItems = []; let mockHelpItems = []; let mockPartnerItems = [];

async function loadCommunityPosts() {
    try {
        const res = await fetch('/api/get-community'); const data = await res.json();
        if (data.success && data.posts) {
            mockIdleItems = []; mockHelpItems = []; mockPartnerItems = [];
            data.posts.forEach(post => {
                const title = post.title || ''; const content = post.content || ''; const time = new Date(post.created_at).getTime() || Date.now(); const author = post.author_name || '匿名管家';
                // 支持多图：只取逗号分割后的第一张图做封面
                const img = (post.image_url ? post.image_url.split(',')[0] : 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&auto=format&fit=crop');

                if (title.includes('[闲置]')) {
                    const priceMatch = title.match(/€(\d+(\.\d+)?)/); const price = priceMatch ? priceMatch[1] : '面议';
                    mockIdleItems.push({ id: post.id, img: img, title: content.substring(0, 40) + (content.length > 40 ? '...' : ''), price: price, priceNum: parseFloat(price) || 0, originalPrice: '', avatar: "😎", name: author, credit: "极佳", creditClass: "excellent", isSold: false, isBargain: content.includes('刀'), timestamp: time });
                } else if (title.includes('[互助')) {
                    const rewardMatch = title.match(/€(\d+(\.\d+)?)/); const reward = rewardMatch ? rewardMatch[1] : '0'; const isUrgent = title.includes('🔥急');
                    mockHelpItems.push({ id: post.id, type: isUrgent ? "🔥 紧急" : "🤝 求助", isUrgent: isUrgent, title: content.substring(0, 40) + '...', reward: reward, rewardNum: parseFloat(reward) || 0, date: "私信确认", location: "荷兰", avatar: "🐼", name: author, credit: "新人", creditClass: "new", distKm: Math.floor(Math.random() * 15) + 1, timestamp: time, imgIcon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23EFF6FF'/><text x='50%' y='50%' font-size='20' text-anchor='middle' dominant-baseline='middle'>🤝</text></svg>" });
                } else if (title.includes('[找搭子]')) {
                    const cleanTitle = title.replace('[找搭子] ', '');
                    mockPartnerItems.push({ id: post.id, avatar: "👱‍♀️", name: author, gender: Math.random() > 0.5 ? "f" : "m", mbti: "未知", mbtiType: "all", title: cleanTitle, desc: content, tags: ["✨ 新发布"], distKm: Math.floor(Math.random() * 15) + 1, daysAway: 1, timestamp: time });
                }
            });
            applyMarketFilters('idle'); applyMarketFilters('help'); applyMarketFilters('partner');
        }
    } catch (err) {}
}

function openChat(sellerName, sellerAvatar, itemTitle, itemPrice, itemImg, isSold, postType = 'idle') {
    requireAuth(() => {
        document.getElementById('chatTargetName').innerText = sellerName;
        document.getElementById('chatTargetAvatar').innerText = sellerAvatar;
        document.getElementById('chatProductTitle').innerText = itemTitle;
        document.getElementById('chatProductPrice').innerText = '€' + itemPrice;
        document.getElementById('chatProductImg').src = itemImg;
        
        const now = new Date(); document.getElementById('chatTimeSys').innerText = `今天 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const greetingBox = document.getElementById('chatDefaultGreeting');
        if (postType === 'help') { if(greetingBox) greetingBox.innerText = "哈喽！你是来接悬赏单的吗？"; } 
        else if (postType === 'partner') { if(greetingBox) greetingBox.innerText = "滴滴！找搭子吗？"; } 
        else { if(greetingBox) greetingBox.innerText = "你好，请问你是想看这个闲置吗？还在的哦！"; }

        if (isSold) {
            document.getElementById('cpsActionBtn').style.display = 'none'; document.getElementById('cpsSoldStamp').style.display = 'block';
            document.getElementById('chatInputBar').style.display = 'none'; document.getElementById('chatInputDisabled').style.display = 'block';
        } else {
            document.getElementById('cpsActionBtn').style.display = 'block'; document.getElementById('cpsSoldStamp').style.display = 'none';
            document.getElementById('chatInputBar').style.display = 'flex'; document.getElementById('chatInputDisabled').style.display = 'none';
        }
        document.getElementById('chatModal').style.display = 'flex';
        const msgList = document.getElementById('chatMsgList'); if(msgList) msgList.scrollTop = msgList.scrollHeight;
    });
}
function closeChat() { document.getElementById('chatModal').style.display = 'none'; }
function sendChatMessage() {
    const input = document.getElementById('chatInput'); const text = input.value.trim(); if(!text) return;
    const msgList = document.getElementById('chatMsgList'); const savedAvatar = localStorage.getItem('hebao_avatar') || '';
    const avatarHtml = savedAvatar ? `<img src="${savedAvatar}">` : `<span>👻</span>`;
    msgList.insertAdjacentHTML('beforeend', `<div class="chat-row me"><div class="chat-text">${text}</div><div class="chat-avatar">${avatarHtml}</div></div>`);
    input.value = ''; msgList.scrollTop = msgList.scrollHeight; 
    setTimeout(() => {
        msgList.insertAdjacentHTML('beforeend', `<div class="chat-row other"><div class="chat-avatar">${document.getElementById('chatTargetAvatar').innerText}</div><div class="chat-text">系统提示：对方可能正在骑车🚴。</div></div>`);
        msgList.scrollTop = msgList.scrollHeight;
    }, 1200);
}

function toggleFilterPill(element, type) { element.classList.toggle('active'); applyMarketFilters(type); }
function applyMarketFilters(type) {
    if (type === 'idle') {
        const sortMode = document.getElementById('sortIdle') ? document.getElementById('sortIdle').value : 'newest';
        const onlyBargain = document.getElementById('pillIdleBargain') && document.getElementById('pillIdleBargain').classList.contains('active');
        let filtered = [...mockIdleItems];
        if (onlyBargain) filtered = filtered.filter(item => item.isBargain);
        if (sortMode === 'priceAsc') filtered.sort((a, b) => a.priceNum - b.priceNum); else if (sortMode === 'priceDesc') filtered.sort((a, b) => b.priceNum - a.priceNum); else filtered.sort((a, b) => b.timestamp - a.timestamp);
        renderMarketIdle(filtered);
    } 
    else if (type === 'help') {
        const sortMode = document.getElementById('sortHelp') ? document.getElementById('sortHelp').value : 'newest';
        const onlyUrgent = document.getElementById('pillHelpUrgent') && document.getElementById('pillHelpUrgent').classList.contains('active');
        let filtered = [...mockHelpItems];
        if (onlyUrgent) filtered = filtered.filter(item => item.isUrgent);
        if (sortMode === 'rewardDesc') filtered.sort((a, b) => b.rewardNum - a.rewardNum); else if (sortMode === 'distAsc') filtered.sort((a, b) => a.distKm - b.distKm); else filtered.sort((a, b) => b.timestamp - a.timestamp);
        renderMarketHelp(filtered);
    }
    else if (type === 'partner') {
        const sortMode = document.getElementById('sortPartner') ? document.getElementById('sortPartner').value : 'newest';
        const mbtiMode = document.getElementById('filterMBTI') ? document.getElementById('filterMBTI').value : 'all';
        let filtered = [...mockPartnerItems];
        if (mbtiMode !== 'all') filtered = filtered.filter(item => item.mbtiType === mbtiMode);
        if (sortMode === 'timeAsc') filtered.sort((a, b) => a.daysAway - b.daysAway); else if (sortMode === 'distAsc') filtered.sort((a, b) => a.distKm - b.distKm); else filtered.sort((a, b) => b.timestamp - a.timestamp);
        renderMarketPartner(filtered);
    }
}

function renderMarketIdle(data = mockIdleItems) {
    const container = document.getElementById('idleWaterfall'); if(!container) return;
    if(data.length === 0) { container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:40px 0; grid-column:span 2;">集市空空如也，快去发一个吧！</div>'; return; }
    let html = '';
    data.forEach(item => {
        const soldOverlayHtml = item.isSold ? `<div class="wf-sold-overlay"><div class="wf-sold-text">已售出</div></div>` : '';
        html += `<div class="waterfall-item" onclick="openChat('${item.name}', '${item.avatar}', '${item.title}', '${item.price}', '${item.img}', ${item.isSold}, 'idle')"><div class="wf-img-box">${soldOverlayHtml}<img class="wf-img" src="${item.img}"></div><div class="wf-info"><div class="wf-title" style="${item.isSold ? 'color:#9CA3AF;' : ''}">${item.title}</div><div class="wf-price-row"><span class="wf-currency" style="${item.isSold ? 'color:#9CA3AF;' : ''}">€</span><span class="wf-price" style="${item.isSold ? 'color:#9CA3AF;' : ''}">${item.price}</span>${item.originalPrice ? `<span class="wf-original-price">${item.originalPrice}</span>` : ''}</div><div class="wf-user-row"><div class="wf-user"><div class="wf-avatar">${item.avatar}</div><div class="wf-name">${item.name}</div></div><div class="wf-credit ${item.creditClass}" style="${item.isSold ? 'background:#F3F4F6; color:#9CA3AF;' : ''}">${item.credit}</div></div></div></div>`;
    });
    container.innerHTML = html;
}

function renderMarketHelp(data = mockHelpItems) {
    const container = document.getElementById('helpListContainer'); if(!container) return;
    if(data.length === 0) { container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:40px 0; grid-column:span 2;">暂时没有符合条件的悬赏单~</div>'; return; }
    let html = '';
    data.forEach(item => {
        const tagClass = item.isUrgent ? 'hc-type-tag urgent' : 'hc-type-tag'; const tagText = item.isUrgent ? `🔥 急·${item.type.split(' ')[1]}` : item.type.split(' ')[1];
        html += `<div class="help-card" onclick="openChat('${item.name}', '${item.avatar}', '${item.title}', '${item.reward}', \`${item.imgIcon}\`, false, 'help')"><div class="hc-top-row"><div class="${tagClass}">${tagText}</div><div class="hc-reward-compact">€${item.reward}</div></div><div class="hc-title">${item.title}</div><div class="hc-details"><div class="hc-detail-item"><span>⏰</span> ${item.date}</div><div class="hc-detail-item"><span>📍</span> ${item.location}</div></div><div class="hc-footer"><div class="hc-user"><div class="hc-avatar">${item.avatar}</div><div class="hc-name">${item.name}</div><div class="wf-credit ${item.creditClass}" style="margin-left:auto; transform:scale(0.9);">${item.credit}</div></div><div class="hc-action-btn">立即私信</div></div></div>`;
    });
    container.innerHTML = html;
}

function renderMarketPartner(data = mockPartnerItems) {
    const container = document.getElementById('partnerListContainer'); if(!container) return;
    if(data.length === 0) { container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:40px 0; grid-column:span 2;">没有找到合适的搭子，自己发一个吧！</div>'; return; }
    let html = '';
    data.forEach(item => {
        const genderIcon = item.gender === 'f' ? '♀' : '♂'; const tagsHtml = item.tags.slice(0, 2).map(t => `<div class="pc-tag">${t}</div>`).join(''); 
        const iconSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23F3E8FF'/><text x='50%' y='50%' font-size='20' text-anchor='middle' dominant-baseline='middle'>🥂</text></svg>`;
        html += `<div class="partner-card" onclick="openChat('${item.name}', '${item.avatar}', '${item.title}', '0', \`${iconSvg}\`, false, 'partner')"><div class="pc-header"><div class="pc-user"><div class="pc-avatar">${item.avatar}</div><div class="pc-info"><div class="pc-name-row"><span class="pc-name">${item.name}</span><span class="pc-gender ${item.gender}">${genderIcon}</span></div><span class="pc-mbti">${item.mbti}</span></div></div></div><div class="pc-title">${item.title}</div><div class="pc-desc">${item.desc}</div><div class="pc-tags">${tagsHtml}</div><div class="pc-footer"><div class="pc-dist"><span>📍</span> 距你 ${item.distKm} km</div><div class="pc-action">打招呼</div></div></div>`;
    });
    container.innerHTML = html;
}

// ================= 10. 个人主页资产：我的发布与下架 =================
async function loadMyPosts() {
    if (!isLoggedIn) return;
    const listDiv = document.getElementById('myPostsList'); const emptyState = document.getElementById('postsEmptyState');
    try {
        const res = await fetch(`/api/get-my-posts?userId=${userUUID}`); const data = await res.json();
        if (data.success && data.posts && data.posts.length > 0) {
            if(emptyState) emptyState.style.display = 'none'; 
            let html = '';
            data.posts.forEach(post => {
                const img = post.image_url ? post.image_url.split(',')[0] : '';
                const imgHtml = img ? `<img src="${img}" style="width:64px; height:64px; object-fit:cover; border-radius:12px; flex-shrink:0; border: 1px solid #E5E7EB;">` : `<div style="width:64px; height:64px; background:#F9FAFB; border-radius:12px; display:flex; justify-content:center; align-items:center; font-size:24px; flex-shrink:0; border: 1px solid #E5E7EB;">📄</div>`;
                html += `<div style="background:#FFF; border-radius:16px; padding:12px; margin-bottom:12px; border:1px solid #E5E7EB; box-shadow: 0 2px 8px rgba(0,0,0,0.02); display:flex; gap:12px; align-items:center;">${imgHtml}<div style="flex:1; overflow:hidden;"><div style="font-size:14px; font-weight:900; color:#111827; margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${post.title}</div><div style="font-size:12px; color:#6B7280; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; line-height: 1.4;">${post.content}</div></div><div style="background:#FEF2F2; color:#EF4444; padding:6px 14px; border-radius:14px; font-size:12px; font-weight:bold; cursor:pointer; transition: 0.2s;" onclick="deleteMyPost(${post.id}, this)">下架</div></div>`;
            });
            if(listDiv) listDiv.innerHTML = html;
        } else {
            if(emptyState) emptyState.style.display = 'block';
            if(listDiv) listDiv.innerHTML = '';
        }
    } catch (e) {}
}

async function deleteMyPost(postId, btnElement) {
    if(!confirm('确定要下架这条发布吗？下架后大厅里也看不到了哦！')) return;
    const originalText = btnElement.innerText; btnElement.innerText = "处理中..."; btnElement.style.pointerEvents = "none";
    try {
        const res = await fetch('/api/delete-post', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: postId, userId: userUUID }) });
        const data = await res.json();
        if(data.success) {
            loadMyPosts(); loadCommunityPosts(); 
            const plus = document.createElement('div'); plus.className = 'float-plus'; plus.innerText = '✅ 帖子已下架'; plus.style.color = '#EF4444'; plus.style.left = '50%'; plus.style.top = '50%'; plus.style.transform = 'translate(-50%, -50%)'; document.body.appendChild(plus); setTimeout(() => plus.remove(), 1500);
        } else { alert('删除失败：' + data.error); btnElement.innerText = originalText; btnElement.style.pointerEvents = "auto"; }
    } catch(e) { alert('网络错误，无法下架'); btnElement.innerText = originalText; btnElement.style.pointerEvents = "auto"; }
}

// ================= 9. 页面初始化启动器 =================
window.addEventListener('DOMContentLoaded', () => { 
    renderTipsPage(); 
    loadTrendingToHome(); 
    renderProfileState(); 
    renderMarketIdle(); renderMarketHelp(); renderMarketPartner(); 
    loadCommunityPosts();
});
