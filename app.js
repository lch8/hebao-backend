let userUUID = localStorage.getItem('hebao_uuid');
if (!userUUID) { userUUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) { var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }); localStorage.setItem('hebao_uuid', userUUID); }

let isLoggedIn = localStorage.getItem('hebao_logged_in') === 'true';
let currentPendingAction = null; 

function requireAuth(actionFunction) {
    if (!isLoggedIn) {
        currentPendingAction = actionFunction;
        document.getElementById('loginModal').style.display = 'flex';
    } else { actionFunction(); }
}

function openLoginModal() { document.getElementById('loginModal').style.display = 'flex'; }

function mockLoginProcess() {
    const btn = document.querySelector('.btn-huge-login');
    if(btn) btn.innerText = '登录中...';
    setTimeout(() => {
        isLoggedIn = true;
        localStorage.setItem('hebao_logged_in', 'true');
        if(!localStorage.getItem('hp_name')) localStorage.setItem('hp_name', '管家新人_' + Math.floor(Math.random()*1000));
        document.getElementById('loginModal').style.display = 'none';
        renderProfileState(); 
        if (currentPendingAction) { currentPendingAction(); currentPendingAction = null; } 
        else { alert('🎉 登录成功！欢迎来到荷包管家。'); }
    }, 800);
}

function handleLogout() {
    if(confirm('确定要退出登录吗？')) {
        isLoggedIn = false;
        localStorage.setItem('hebao_logged_in', 'false');
        renderProfileState();
    }
}

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

        postsEmptyState.innerHTML = '<div class="empty-state-icon">📭</div>你还没有发布过闲置/互助哦';
        reviewsEmptyState.innerHTML = '<div class="empty-state-icon">📭</div>暂无收到的评价';
        loadAvatar();
    } else {
        guestBlock.style.display = 'block'; actionsBlock.style.display = 'none';
        uidText.innerText = 'ID: 未登录'; nameText.innerText = '管家游客';
        creditBadge.style.display = 'none'; bioText.style.display = 'none'; tagsBox.style.display = 'none';
        document.getElementById('profileAvatarImg').style.display = 'none';
        document.getElementById('profileAvatarBox').style.background = '#E5E7EB';
        document.getElementById('profileAvatarEmoji').textContent = '👻';
        postsEmptyState.innerHTML = '<div class="empty-state-icon">🔒</div>请先登录查看你的发布记录';
        reviewsEmptyState.innerHTML = '<div class="empty-state-icon">🔒</div>请先登录查看收到的评价';
    }
}

function switchAssetTab(tabId, element) {
    document.querySelectorAll('.a-tab').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    document.querySelectorAll('.asset-content').forEach(el => el.classList.remove('active'));
    document.getElementById('asset-' + tabId).classList.add('active');
}

function switchMarketTab(tabId, element) {
    document.querySelectorAll('.m-tab').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    document.querySelectorAll('.market-content').forEach(el => el.classList.remove('active'));
    document.getElementById('market-' + tabId).classList.add('active');
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

let currentProductData = null; let currentDetailData = null; let lastTab = 'scan'; 
let globalTrendingLikes = []; let globalTrendingDislikes = [];

function switchTab(pageId, element) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    if (element) { document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active')); element.classList.add('active'); if (pageId !== 'details') lastTab = pageId; }
    document.getElementById('page-' + pageId).classList.add('active');
    if (pageId === 'details') { document.querySelector('.tab-bar').style.display = 'none'; document.getElementById('stickyChatBar').style.display = 'flex'; } 
    else { document.querySelector('.tab-bar').style.display = 'flex'; document.getElementById('stickyChatBar').style.display = 'none'; }
    if (pageId === 'profile') { renderFootprints(); renderProfileState(); }
}
function goBack() { switchTab(lastTab, document.querySelector(`.tab-item[onclick*="${lastTab}"]`)); }

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
        const name = isRealUser ? '热心校友_' + Math.floor(Math.random()*900+100) : 'AI 预测口味';
        return { id: idx, text: cleanText, isLike, isRealUser, likes: mockLikes, avatar, name };
    });
    reviews.sort((a, b) => b.likes - a.likes);

    reviews.forEach(r => {
        const tagHtml = r.isRealUser ? `<span class="r-tag ${r.isLike ? 'like' : 'dislike'}">${r.isLike ? '👍 推荐' : '💣 避雷'}</span>` : `<span class="r-tag" style="background:#F3F4F6; color:#6B7280;">🤖 AI</span>`;
        list.innerHTML += `<div class="recipe-card"><div class="r-header"><div class="r-user" onclick="alert('主页功能开发中！即将可以访问 [${r.name}] 的主页')"><div class="r-avatar">${r.avatar}</div><div class="r-name">${r.name}</div>${tagHtml}</div><div class="r-like-btn" id="reviewLike_${r.id}" onclick="likeReviewCard(${r.id}, event)"><span style="font-size:14px;">💡</span> <span id="rLikeCount_${r.id}">${r.likes}</span></div></div><div class="r-text">${r.text}</div></div>`;
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
        alert("🎉 评价发布成功！快看看你的评价排在第几名！");
        document.getElementById('addReviewModal').style.display = 'none'; setupDetailPage();
    } catch(e) { alert("网络开小差了..."); } finally { btn.innerText = "🚀 提交评价"; btn.disabled = false; }
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

function openPublishSheet() { document.getElementById('publishOverlay').classList.add('show'); setTimeout(() => { document.getElementById('publishSheet').classList.add('show'); }, 10); }
function closePublishSheet() { document.getElementById('publishSheet').classList.remove('show'); setTimeout(() => { document.getElementById('publishOverlay').classList.remove('show'); }, 300); }

function startBarcodeScan() {
    document.getElementById('scannerModal').style.display = 'flex'; let html5QrcodeScanner = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0, formatsToSupport: [ Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, Html5QrcodeSupportedFormats.UPC_A ] };
    html5QrcodeScanner.start({ facingMode: "environment" }, config, (decodedText) => {
        if (navigator.vibrate) navigator.vibrate(100); document.getElementById('scannerModal').style.display = 'none'; html5QrcodeScanner.stop(); document.getElementById('mainSearchInput').value = decodedText; executeSearch();
    }).catch(err => { alert("调用摄像头失败！"); document.getElementById('scannerModal').style.display = 'none'; });
}
function closeScanner() { document.getElementById('scannerModal').style.display = 'none'; }

function executeSearch() {
    const query = document.getElementById('mainSearchInput').value.trim(); if (!query) return;
    document.getElementById('homeActionBox').style.display='none'; document.getElementById('previewContainer').style.display='block'; document.getElementById('scanOverlay').style.display='flex'; document.getElementById('scanText').innerText = "📡 正在全网检索..."; document.getElementById('miniResultCard').style.display='none';
    fetch('/api/scan-barcode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ barcode: query, userId: userUUID }) })
    .then(res => res.json()).then(data => {
        currentProductData = data; document.getElementById('scanOverlay').style.display='none'; document.getElementById('previewContainer').style.display='none'; document.getElementById('miniResultCard').style.display='block'; document.getElementById('miniChineseName').innerText=data.chinese_name||'未知商品'; document.getElementById('miniInsight').innerText=data.insight||'暂无评价'; saveToLocalFootprint(data, data.image_url);
    }).catch(err => { alert("未找到商品信息！"); resetApp(); });
}
function resetApp() { document.getElementById('previewContainer').style.display='none'; document.getElementById('scanOverlay').style.display='none'; document.getElementById('miniResultCard').style.display='none'; document.getElementById('homeActionBox').style.display='flex'; }

async function loadTrendingToHome() {
    try {
        const res = await fetch('/api/trending'); const data = await res.json();
        if(data.success) { globalTrendingLikes = data.topLikes || []; globalTrendingDislikes = data.topDislikes || []; renderHomeTrending(globalTrendingLikes, 'homeTrendingListLikes', 'like'); renderHomeTrending(globalTrendingDislikes, 'homeTrendingListDislikes', 'dislike'); }
    } catch(e) { document.getElementById('homeTrendingListLikes').innerHTML = '<div style="text-align:center; color:#9CA3AF; font-size: 12px; margin-top:20px;">榜单加载休息中...</div>'; }
}

function renderHomeTrending(list, containerId, type) {
    const container = document.getElementById(containerId); if (!list || list.length === 0) return; 
    let html = '';
    
    // 安全防爆破的 Fallback SVG (纯 URL 编码)
    const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23F3F4F6'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='10' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'%3E暂无图%3C/text%3E%3C/svg%3E";

    list.slice(0, 20).forEach((item, index) => {
        let badgeClass = 'rank-other'; if (index === 0) badgeClass = 'rank-1'; else if (index === 1) badgeClass = 'rank-2'; else if (index === 2) badgeClass = 'rank-3'; if (type === 'dislike') badgeClass = 'rank-bad';
        const score = type === 'like' ? item.likes : item.dislikes; const icon = type === 'like' ? '👍' : '💣'; const scoreColor = type === 'like' ? '#10B981' : '#EF4444';
        const safeImg = item.image_url || fallbackSvg;
        html += `<div class="trending-card" onclick="openDetailsFromHomeTrending('${type}', ${index})"><div class="rank-badge ${badgeClass}">TOP ${index + 1}</div><img src="${safeImg}" onerror="this.onerror=null; this.src='${fallbackSvg}'" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; background: #F3F4F6; border: 1px solid #E5E7EB;"><div class="t-info"><div class="t-name">${item.chinese_name || '未命名商品'}</div><div style="font-size: 11px; color: #9CA3AF; margin-top:2px;">${item.dutch_name || ''}</div></div><div class="t-score" style="color: ${scoreColor}">${icon} ${score}</div></div>`;
    });
    container.innerHTML = html;
}

// ================= 集市模块模拟数据与渲染 =================
const mockIdleItems = [
    { img: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&auto=format&fit=crop", title: "九成新空气炸锅，回国急出带原包装", price: "25", originalPrice: "€69", avatar: "😎", name: "代村阿强", credit: "极佳", creditClass: "excellent", isSold: false },
    { img: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=400&auto=format&fit=crop", title: "宜家升降桌，有点小划痕不影响使用", price: "40", originalPrice: "€129", avatar: "👩‍💻", name: "鹿特丹土豆", credit: "良好", creditClass: "good", isSold: true }, // 👈 这个已售出
    { img: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&auto=format&fit=crop", title: "RSM 鹿特丹商学院大一必修课纸质教材全套", price: "15", originalPrice: "€80", avatar: "👻", name: "商科牛马", credit: "极佳", creditClass: "excellent", isSold: false },
    { img: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400&auto=format&fit=crop", title: "只穿过一次的雪地靴，尺码 38 偏小", price: "30", originalPrice: "€95", avatar: "🐼", name: "海牙小丸子", credit: "新人", creditClass: "new", isSold: false },
    { img: "https://images.unsplash.com/photo-1610444391690-3490710fc9ba?w=400&auto=format&fit=crop", title: "搬家清仓！各种锅碗瓢盆和调料打包带走", price: "10", originalPrice: "", avatar: "🐱", name: "阿姆食神", credit: "良好", creditClass: "good", isSold: false }
];

function renderMarketIdle() {
    const container = document.getElementById('idleWaterfall');
    if(!container) return;
    let html = '';
    mockIdleItems.forEach(item => {
        // 判断是否已售出，添加图层
        const soldOverlayHtml = item.isSold ? `<div class="wf-sold-overlay"><div class="wf-sold-text">已售出</div></div>` : '';
        
        // 注意 openChat 多传了一个参数 item.isSold
        html += `
        <div class="waterfall-item" onclick="openChat('${item.name}', '${item.avatar}', '${item.title}', '${item.price}', '${item.img}', ${item.isSold})">
            <div class="wf-img-box">
                ${soldOverlayHtml}
                <img class="wf-img" src="${item.img}">
            </div>
            <div class="wf-info">
                <div class="wf-title" style="${item.isSold ? 'color:#9CA3AF;' : ''}">${item.title}</div>
                <div class="wf-price-row">
                    <span class="wf-currency" style="${item.isSold ? 'color:#9CA3AF;' : ''}">€</span><span class="wf-price" style="${item.isSold ? 'color:#9CA3AF;' : ''}">${item.price}</span>
                    ${item.originalPrice ? `<span class="wf-original-price">${item.originalPrice}</span>` : ''}
                </div>
                <div class="wf-user-row">
                    <div class="wf-user"><div class="wf-avatar">${item.avatar}</div><div class="wf-name">${item.name}</div></div>
                    <div class="wf-credit ${item.creditClass}" style="${item.isSold ? 'background:#F3F4F6; color:#9CA3AF;' : ''}">${item.credit}</div>
                </div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

// 覆写 openChat，加入状态拦截
function openChat(sellerName, sellerAvatar, itemTitle, itemPrice, itemImg, isSold) {
    requireAuth(() => {
        document.getElementById('chatTargetName').innerText = sellerName;
        document.getElementById('chatTargetAvatar').innerText = sellerAvatar;
        document.getElementById('chatProductTitle').innerText = itemTitle;
        document.getElementById('chatProductPrice').innerText = '€' + itemPrice;
        document.getElementById('chatProductImg').src = itemImg;
        
        const now = new Date();
        document.getElementById('chatTimeSys').innerText = `今天 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // 核心：处理已售出状态的 UI 冻结
        if (isSold) {
            document.getElementById('cpsActionBtn').style.display = 'none';
            document.getElementById('cpsSoldStamp').style.display = 'block';
            document.getElementById('chatInputBar').style.display = 'none';
            document.getElementById('chatInputDisabled').style.display = 'block';
        } else {
            document.getElementById('cpsActionBtn').style.display = 'block';
            document.getElementById('cpsSoldStamp').style.display = 'none';
            document.getElementById('chatInputBar').style.display = 'flex';
            document.getElementById('chatInputDisabled').style.display = 'none';
        }

        document.getElementById('chatModal').style.display = 'flex';
        const msgList = document.getElementById('chatMsgList');
        msgList.scrollTop = msgList.scrollHeight;
    });
}

// ================= 集市模块 - 互助悬赏模拟数据 =================
const mockHelpItems = [
    { type: "🚗 史基浦接机", isUrgent: true, title: "明天早上 7点 史基浦机场接机到海牙", reward: "45", date: "明天 (周三) 07:00", location: "Schiphol -> Den Haag", avatar: "🐼", name: "海牙小丸子", credit: "新人", creditClass: "new", imgIcon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23EFF6FF'/><text x='50%' y='50%' font-size='20' text-anchor='middle' dominant-baseline='middle'>🚗</text></svg>" },
    { type: "💪 搬家帮手", isUrgent: false, title: "代尔夫特同城搬家，需要一位壮汉帮忙搬两个大箱子上三楼", reward: "20", date: "本周六 14:00", location: "Delft (2628CD附近)", avatar: "😎", name: "代村阿强", credit: "极佳", creditClass: "excellent", imgIcon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23FFFBEB'/><text x='50%' y='50%' font-size='20' text-anchor='middle' dominant-baseline='middle'>📦</text></svg>" },
    { type: "🐱 上门喂宠", isUrgent: false, title: "国庆回国一周，求阿姆南区附近的姐妹帮忙上门喂两只布偶", reward: "70", date: "10月1日 - 10月7日", location: "Amsterdam Zuid", avatar: "👩‍💻", name: "鹿特丹土豆", credit: "良好", creditClass: "good", imgIcon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23F3F4F6'/><text x='50%' y='50%' font-size='20' text-anchor='middle' dominant-baseline='middle'>🐱</text></svg>" },
    { type: "🛠️ 宜家代装", isUrgent: false, title: "手残党求助！拼一个宜家的三门大衣柜 PAX", reward: "35", date: "时间可议", location: "Rotterdam (Blaak)", avatar: "👻", name: "商科牛马", credit: "极佳", creditClass: "excellent", imgIcon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23ECFDF5'/><text x='50%' y='50%' font-size='20' text-anchor='middle' dominant-baseline='middle'>🛠️</text></svg>" }
];

function renderMarketHelp() {
    const container = document.getElementById('helpListContainer');
    if(!container) return;
    let html = '';
    mockHelpItems.forEach(item => {
        const tagClass = item.isUrgent ? 'hc-type-tag urgent' : 'hc-type-tag';
        const tagText = item.isUrgent ? `🔥 急 · ${item.type}` : item.type;
        
        // 点击直接复用 openChat，并将 imgIcon 传进去作为左上角的小卡片图
        html += `
        <div class="help-card" onclick="openChat('${item.name}', '${item.avatar}', '${item.title}', '${item.reward}', \`${item.imgIcon}\`, false)">
            <div class="hc-header">
                <div class="hc-title-box">
                    <div class="${tagClass}">${tagText}</div>
                    <div class="hc-title">${item.title}</div>
                </div>
                <div class="hc-reward-box">
                    <span class="hc-reward-currency">€</span><span class="hc-reward-num">${item.reward}</span>
                    <div class="hc-reward-label">悬赏金</div>
                </div>
            </div>
            
            <div class="hc-details">
                <div class="hc-detail-item"><span>⏰</span> ${item.date}</div>
                <div class="hc-detail-item"><span>📍</span> ${item.location}</div>
            </div>
            
            <div class="hc-footer">
                <div class="hc-user">
                    <div class="hc-avatar">${item.avatar}</div>
                    <div class="hc-name">${item.name}</div>
                    <div class="wf-credit ${item.creditClass}">${item.credit}</div>
                </div>
                <div class="hc-action-btn">立即私信</div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

// ⚠️ 别忘了在你的 DOMContentLoaded 事件里把 renderMarketHelp() 加上
window.addEventListener('DOMContentLoaded', () => { 
    renderTipsPage(); 
    loadTrendingToHome(); 
    renderProfileState(); 
    renderMarketIdle(); 
    renderMarketHelp(); // <-- 新增渲染悬赏大厅
});

function switchHomeTrendingTab(type, element) {
    document.querySelectorAll('#page-scan .t-tab').forEach(el => el.classList.remove('active')); element.classList.add('active');
    document.getElementById('homeTrendingListLikes').style.display = type === 'likes' ? 'block' : 'none'; document.getElementById('homeTrendingListDislikes').style.display = type === 'dislikes' ? 'block' : 'none';
}

function renderTipsPage() {
    if (typeof quickLinksData !== 'undefined') { 
        let qlHtml = ''; 
        quickLinksData.forEach(link => { 
            qlHtml += `<a href="${link.url}" target="_blank" class="ql-card"><div class="ql-icon">${link.icon}</div><div class="ql-title">${link.title}</div><div class="ql-sub">${link.sub}</div></a>`; 
        }); 
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
                    // 这里换成了你写好的 tip-item 类名
                    itemsHtml += `<div class="tip-item"><div class="tip-title">${tip.title}</div><div class="tip-desc">${formattedDesc}</div></div>`;
                });
                // 这里换成了你写好的 store-card 体系类名
                storesHtml += `<div class="store-card"><div class="store-header" onclick="toggleTipsContent(this)"><div class="s-icon-name"><span class="s-logo">${store.storeLogo}</span>${store.storeName}</div><span class="store-arrow">▼</span></div><div class="store-content"><div class="store-inner">${itemsHtml}</div></div></div>`;
            });
            // 这里换成了你写好的 tips-accordion 体系类名
            accHtml += `<div class="tips-accordion"><div class="tips-header" onclick="toggleTipsContent(this)"><div class="tips-title-wrap"><span class="tips-icon">${cat.categoryIcon}</span> <span>${cat.categoryName}</span> ${highlightHtml}</div><span class="tips-arrow">▼</span></div><div class="tips-content"><div class="tips-inner">${storesHtml}</div></div></div>`;
        });
        
        if(document.getElementById('tipsAccordionContainer')) document.getElementById('tipsAccordionContainer').innerHTML = accHtml;
    }
    
    if (typeof tipsMetaData !== 'undefined' && document.getElementById('tipsDisclaimerContainer')) { 
        document.getElementById('tipsDisclaimerContainer').innerHTML = `<div class="tips-disclaimer"><div style="font-weight:bold; margin-bottom:6px; color:#D97706;"><span>⏳</span> 最后更新于：${tipsMetaData.lastUpdated}</div>⚠️ <b>防杠声明：</b> ${tipsMetaData.disclaimer}</div>`; 
    }
}

function toggleTipsContent(element) { 
    element.classList.toggle('active');
}

function saveToLocalFootprint(data, img) { let h = JSON.parse(localStorage.getItem('hebao_history')||'[]'); if(!h.find(i=>i.dutch_name===data.dutch_name)){data.img_src=img; h.unshift(data); localStorage.setItem('hebao_history',JSON.stringify(h));} }
function renderFootprints() { 
    const listDiv = document.getElementById('footprintList'); let h = JSON.parse(localStorage.getItem('hebao_history') || '[]'); 
    if (h.length === 0) { listDiv.innerHTML = '<div style="text-align:center; color:#9CA3AF; margin-top:20px; font-size:13px; border: 1px dashed #E5E7EB; padding: 30px; border-radius: 16px;">暂无足迹，快去首页扫码吧</div>'; return; } 
    let html = ''; const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23F3F4F6'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='10' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'%3E暂无图%3C/text%3E%3C/svg%3E";
    h.forEach((item, index) => { 
        const safeImg = item.img_src || fallbackSvg;
        html += `<div style="background:#FFF; border-radius:16px; margin-bottom:12px; border:1px solid #E5E7EB; overflow:hidden; display:flex; align-items:center; padding:12px; box-shadow:0 2px 8px rgba(0,0,0,0.02); cursor:pointer;" onclick="openDetailsFromHistory(${index})"><img src="${safeImg}" onerror="this.onerror=null; this.src='${fallbackSvg}'" style="width:50px; height:50px; object-fit:cover; border-radius:10px; flex-shrink:0; background:#F3F4F6;"><div style="flex:1; margin-left:12px;"><div style="font-weight:900; font-size:15px; color:#111827; margin-bottom:2px;">${item.chinese_name || '未命名'}</div><div style="font-size:12px; color:#9CA3AF; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;">${item.insight || ''}</div></div></div>`; 
    }); 
    listDiv.innerHTML = html; 
}
// ================= 发布闲置逻辑与 AI 模拟 =================

function openIdlePublish() {
    closePublishSheet(); // 先关掉底部的半屏菜单
    setTimeout(() => {
        document.getElementById('publishIdleModal').style.display = 'flex';
        // 自动填入当前日期+7天作为默认截止日
        const d = new Date(); d.setDate(d.getDate() + 7);
        document.getElementById('idleDeadline').value = d.toISOString().split('T')[0];
    }, 300);
}

function closeIdlePublish() {
    document.getElementById('publishIdleModal').style.display = 'none';
}

// 通用的胶囊按钮单选切换逻辑
function selectPill(element, groupName) {
    document.querySelectorAll(`#${groupName} .pill`).forEach(el => el.classList.remove('active'));
    element.classList.add('active');
}

// 模拟请求大模型生成小红书文案
function generateAICopy() {
    const keyword = document.getElementById('aiKeywords').value.trim();
    if (!keyword) return alert("请先输入一些闲置关键词哦，比如：大书桌30欧，明天搬家...");
    
    const btn = document.getElementById('btnAiMagic');
    btn.innerText = "⏳ 魔法施展中，管家正在码字...";
    btn.disabled = true;

    // 提取当前选择的条件
    const loc = document.getElementById('idleLocation').value;
    const deadline = document.getElementById('idleDeadline').value;
    const bargain = document.querySelector('#bargainGroup .active').innerText;
    const payment = document.querySelector('#paymentGroup .active').innerText;

    setTimeout(() => {
        // 模拟 AI 处理后的惊艳结果
        const aiText = `🌟 【${loc}出】留学生搬家狂甩，骨折价带走！
哈喽家人们！因为临近搬家/回国，实在带不走啦，忍痛割爱出一批超实用的闲置😭！

🛒 【出物清单与价格】
根据您的输入：“${keyword}”
(请在此处补充或修改具体物品状态哦～)

✅ 状态：自用非常爱惜，功能全部完好！
💰 价格：详见清单，多件打包可骨折！
📍 坐标：${loc} (可上门自提)
⏰ 截止日期：务必在 ${deadline} 之前拿走！
💶 交易方式：支持 ${payment}
⚠️ 注意：目前是 ${bargain} 的状态，先到先得，手慢无！

带图私信我，看到了就会秒回！
#荷兰二手 #${loc}闲置 #留学生搬家 #闲置转让 #好物低价出`;

        document.getElementById('idleDesc').value = aiText;
        document.getElementById('aiKeywords').value = '';
        btn.innerText = "✅ 生成成功！快去下方修改细节吧";
        
        setTimeout(() => {
            btn.innerText = "🪄 重新生成";
            btn.disabled = false;
        }, 3000);
    }, 1500);
}

function submitIdlePost() {
    const desc = document.getElementById('idleDesc').value.trim();
    if(!desc) return alert("文案还没写呢！快试试 AI 一键生成吧！");
    
    alert("🎉 发布成功！你的闲置已经进入集市，等待有缘人。");
    closeIdlePublish();
}
// ================= 私信系统交互逻辑 =================

function openChat(sellerName, sellerAvatar, itemTitle, itemPrice, itemImg) {
    // 强制鉴权：必须登录才能和卖家私聊
    requireAuth(() => {
        // 渲染顶部商品信息
        document.getElementById('chatTargetName').innerText = sellerName;
        document.getElementById('chatTargetAvatar').innerText = sellerAvatar;
        document.getElementById('chatProductTitle').innerText = itemTitle;
        document.getElementById('chatProductPrice').innerText = '€' + itemPrice;
        document.getElementById('chatProductImg').src = itemImg;
        
        // 更新聊天时间
        const now = new Date();
        document.getElementById('chatTimeSys').innerText = `今天 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // 显示全屏聊天框
        document.getElementById('chatModal').style.display = 'flex';
        
        // 自动滚动到底部
        const msgList = document.getElementById('chatMsgList');
        msgList.scrollTop = msgList.scrollHeight;
    });
}

function closeChat() {
    document.getElementById('chatModal').style.display = 'none';
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if(!text) return;
    
    const msgList = document.getElementById('chatMsgList');
    
    // 获取当前登录用户自己的头像
    const savedAvatar = localStorage.getItem('hebao_avatar') || '';
    const avatarHtml = savedAvatar ? `<img src="${savedAvatar}">` : `<span>👻</span>`;
    
    // 渲染我发出的消息
    const html = `
    <div class="chat-row me">
        <div class="chat-text">${text}</div>
        <div class="chat-avatar">${avatarHtml}</div>
    </div>`;
    
    msgList.insertAdjacentHTML('beforeend', html);
    input.value = ''; // 清空输入框
    msgList.scrollTop = msgList.scrollHeight; // 滚动到底部
    
    // 模拟卖家自动回复 (假装对方很忙)
    setTimeout(() => {
        const replyHtml = `
        <div class="chat-row other">
            <div class="chat-avatar">${document.getElementById('chatTargetAvatar').innerText}</div>
            <div class="chat-text">系统提示：对方可能正在骑车或上课🚴。如果迟迟未回复，可以点击顶部【发送链接】引起对方注意哦。</div>
        </div>`;
        msgList.insertAdjacentHTML('beforeend', replyHtml);
        msgList.scrollTop = msgList.scrollHeight;
    }, 1200);
}


// ⚠️ 注意：修改你现有的 DOMContentLoaded 监听器，把 renderMarketIdle() 加进去
window.addEventListener('DOMContentLoaded', () => { 
    renderTipsPage(); 
    loadTrendingToHome(); 
    renderProfileState(); 
    renderMarketIdle(); // 新增：页面加载时渲染集市瀑布流
});
