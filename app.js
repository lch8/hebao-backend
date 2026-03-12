// ================= 1. 全局状态与鉴权 =================
let userUUID = localStorage.getItem('hebao_uuid');
if (!userUUID) { userUUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) { var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }); localStorage.setItem('hebao_uuid', userUUID); }
let isLoggedIn = localStorage.getItem('hebao_logged_in') === 'true';
let currentPendingAction = null;

// 获取存储的 JWT token，用于所有需鉴权的 API 请求
function getAuthHeaders() {
    const token = localStorage.getItem('hebao_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

function requireAuth(actionFunction) { if (!isLoggedIn) { currentPendingAction = actionFunction; const modal = document.getElementById('loginModal'); if (modal) modal.style.display = 'flex'; else alert("⚠️ 请先登录！"); } else { actionFunction(); } }
function openLoginModal() { const modal = document.getElementById('loginModal'); if (modal) modal.style.display = 'flex'; }
// ================= 1. 全局状态与鉴权 =================
// (保留原本的 userUUID 和 getAuthHeaders 逻辑...)

// 🌟 新增：请求发送验证码
async function sendAuthCode() {
    const emailInput = document.getElementById('authEmail').value.trim();
    const btnSend = document.getElementById('btnSendCode');

    if (!emailInput || !emailInput.includes('@')) {
        alert('⚠️ 请输入有效的邮箱地址！');
        return;
    }

    btnSend.disabled = true;
    btnSend.innerText = '发送中...';

    try {
        const res = await fetch('/api/send-auth-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailInput })
        });

        const data = await res.json();
        
        // 兼容后端的各种返回格式
        if (res.ok && (data.success || !data.error)) { 
            alert('✅ 验证码已发送至您的邮箱，请注意查收（包括垃圾箱）。');
            
            // 简单的 60 秒倒计时防刷
            let countdown = 60;
            const timer = setInterval(() => {
                btnSend.innerText = `${countdown}s 后重试`;
                countdown--;
                if (countdown < 0) {
                    clearInterval(timer);
                    btnSend.innerText = '获取验证码';
                    btnSend.disabled = false;
                }
            }, 1000);
        } else {
            throw new Error(data.error || '发送失败，请检查后端配置');
        }
    } catch (err) {
        alert('❌ ' + err.message);
        btnSend.innerText = '获取验证码';
        btnSend.disabled = false;
    }
}

// 🌟 新增：校验验证码并正式登录
async function verifyAndLogin() {
    const emailInput = document.getElementById('authEmail').value.trim();
    const codeInput = document.getElementById('authCode').value.trim();
    const btnLogin = document.getElementById('btnVerifyLogin');

    if (!emailInput || !codeInput) {
        alert('⚠️ 邮箱和验证码不能为空！');
        return;
    }

    btnLogin.innerText = '验证中...';
    btnLogin.disabled = true;

    try {
        const res = await fetch('/api/verify-auth-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: emailInput,
                code: codeInput,
                userId: userUUID // 直接使用 app.js 最顶部生成的设备 UUID
            })
        });

        const data = await res.json();

        if (res.ok && data.success && data.token) {
            // 🎉 验证成功！将后端的 JWT 存入本地
            localStorage.setItem('hebao_token', data.token);
            localStorage.setItem('hebao_logged_in', 'true');
            isLoggedIn = true;

            document.getElementById('loginModal').style.display = 'none';
            alert('🎉 认证成功！欢迎来到荷包社区。');

            // 如果用户是点击“发布”按钮触发的登录，登录成功后直接弹出发布表单
            if (currentPendingAction) {
                currentPendingAction();
                currentPendingAction = null;
            }
        } else {
            throw new Error(data.error || '验证码错误或已过期');
        }
    } catch (err) {
        alert('❌ ' + err.message);
    } finally {
        btnLogin.innerText = '立即验证';
        btnLogin.disabled = false;
    }
}
function handleLogout() {
    if(confirm('确定要退出登录吗？')) {
        isLoggedIn = false;
        localStorage.setItem('hebao_logged_in', 'false');
        // 保留 hebao_token 和 hp_email_verified，下次点登录可以一键恢复
        renderProfileState();
    }
}

// ================= 2. 基础导航 =================
let lastTab = 'scan'; 
function switchTab(tabId, element) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('page-' + tabId); if(target) target.classList.add('active');
    if (element) { document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active')); element.classList.add('active'); if (tabId !== 'details') lastTab = tabId; }
    if (tabId === 'details') { const tabBar = document.querySelector('.tab-bar'); if(tabBar) tabBar.style.display = 'none'; const chatBar = document.getElementById('stickyChatBar'); if(chatBar) chatBar.style.display = 'flex'; } 
    else { const tabBar = document.querySelector('.tab-bar'); if(tabBar) tabBar.style.display = 'flex'; const chatBar = document.getElementById('stickyChatBar'); if(chatBar) chatBar.style.display = 'none'; }
    if (tabId === 'profile') { renderFootprints(); renderProfileState(); }
}
function goBack() { switchTab(lastTab, document.querySelector(`.tab-item[onclick*="${lastTab}"]`)); }
function switchMarketTab(type, element) { document.querySelectorAll('.market-content').forEach(el => el.classList.remove('active')); document.getElementById('market-' + type).classList.add('active'); document.querySelectorAll('.m-tab').forEach(el => el.classList.remove('active')); if(element) element.classList.add('active'); }
function switchAssetTab(tabId, element) { document.querySelectorAll('.a-tab').forEach(el => el.classList.remove('active')); element.classList.add('active'); document.querySelectorAll('.asset-content').forEach(el => el.classList.remove('active')); document.getElementById('asset-' + tabId).classList.add('active'); }
function switchHomeTrendingTab(type, element) { document.querySelectorAll('#page-scan .t-tab').forEach(el => el.classList.remove('active')); if(element) element.classList.add('active'); document.getElementById('homeTrendingListLikes').style.display = type === 'likes' ? 'block' : 'none'; document.getElementById('homeTrendingListDislikes').style.display = type === 'dislikes' ? 'block' : 'none'; }

// ================= 3. 个人主页与安全认证 =================
function renderProfileState() {
    const guestBlock = document.getElementById('guestLoginBlock');
    const actionsBlock = document.getElementById('profileActions');
    const uidText = document.getElementById('profileUid');
    const nameText = document.getElementById('profileName');
    const creditBadge = document.getElementById('profileCreditBadge');
    const bioText = document.getElementById('profileBio');
    const tagsBox = document.getElementById('profileTags');
    const authCenter = document.getElementById('authCenterBlock');
    
    if(!guestBlock) return;

    if (isLoggedIn) {
        guestBlock.style.display = 'none'; actionsBlock.style.display = 'flex';
        if(authCenter) authCenter.style.display = 'block';
        uidText.innerText = 'ID: ' + userUUID.substring(0,8).toUpperCase();
        
        const savedName = localStorage.getItem('hp_name') || '管家新人';
        const savedGender = localStorage.getItem('hp_gender') || '';
        const savedMbti = localStorage.getItem('hp_mbti') || '';
        const savedBio = localStorage.getItem('hp_bio') || '这个人很懒，还没写自我介绍~';
        const isEmailVerified = localStorage.getItem('hp_email_verified') === 'true';
        const savedWechat = localStorage.getItem('hp_wechat') || '';

        nameText.innerText = savedName; bioText.innerText = savedBio; bioText.style.display = 'block';

        let score = 500;
        if(localStorage.getItem('hebao_avatar')) score += 20; 
        if(savedMbti) score += 20;
        if(savedBio && savedBio !== '这个人很懒，还没写自我介绍~') score += 10;
        if(isEmailVerified) score += 50; 
        if(savedWechat) score += 30;     
        
        let badgeText = '良好'; let badgeColor = '#D97706'; 
        if(score >= 600) { badgeText = '极品守信'; badgeColor = '#059669'; }
        else if(score >= 550) { badgeText = '极佳'; badgeColor = '#10B981'; }
        
        creditBadge.innerText = `${badgeText} ${score}`; 
        creditBadge.style.background = badgeColor; 
        creditBadge.style.display = 'inline-block';

        tagsBox.style.display = 'flex'; tagsBox.innerHTML = '';
        if(savedGender) tagsBox.innerHTML += `<div class="p-tag">${savedGender}</div>`;
        if(savedMbti) tagsBox.innerHTML += `<div class="p-tag">${savedMbti}</div>`;
        if(isEmailVerified) {
            const emailDomain = localStorage.getItem('hp_email').split('@')[1];
            const schoolName = emailDomain.includes('tudelft') ? 'TUDelft' : (emailDomain.includes('uva') ? 'UvA' : '校园');
            tagsBox.innerHTML += `<div class="p-tag verified-edu">🎓 ${schoolName} 认证</div>`;
        }
        if(savedWechat) tagsBox.innerHTML += `<div class="p-tag verified-wechat">💬 微信已绑</div>`;
        if(tagsBox.innerHTML === '') tagsBox.innerHTML = `<div class="p-tag">萌新小白</div>`;

        if(isEmailVerified) {
            document.getElementById('emailAuthStatusText').innerText = localStorage.getItem('hp_email');
            const btn = document.getElementById('emailAuthBtn'); btn.innerText = "已认证"; btn.classList.add('done');
        }
        if(savedWechat) {
            document.getElementById('wechatAuthStatusText').innerText = `已绑定: ${savedWechat.substring(0,2)}***`;
            const btn = document.getElementById('wechatAuthBtn'); btn.innerText = "已绑定"; btn.classList.add('done');
        }
        loadAvatar(); loadMyPosts(); 
    } else {
        guestBlock.style.display = 'block'; actionsBlock.style.display = 'none';
        if(authCenter) authCenter.style.display = 'none';
        uidText.innerText = 'ID: 未登录'; nameText.innerText = '管家游客'; 
        creditBadge.style.display = 'none'; bioText.style.display = 'none'; tagsBox.style.display = 'none';
        document.getElementById('profileAvatarImg').style.display = 'none';
        document.getElementById('profileAvatarBox').style.background = '#E5E7EB';
        document.getElementById('profileAvatarEmoji').textContent = '👻';
        const listDiv = document.getElementById('myPostsList'); if(listDiv) listDiv.innerHTML = '';
    }
}

function openEmailVerifyModal() {
    // 如果已经认证过邮箱且已登录，不需要再认证
    if(localStorage.getItem('hp_email_verified') === 'true' && isLoggedIn) return alert("您的邮箱已经认证通过啦！");
    // 如果已认证过邮箱但未登录（登出后重新登录），预填邮箱
    const savedEmail = localStorage.getItem('hp_email');
    if(savedEmail) {
        const emailInput = document.getElementById('authEmailInput');
        if(emailInput) emailInput.value = savedEmail;
    }
    document.getElementById('emailVerifyModal').style.display = 'flex';
}
// 修改后的：发送真实邮件验证码
async function sendAuthCode() {
    const emailInput = document.getElementById('authEmailInput');
    const email = emailInput.value.trim();
    if(!email || !email.includes('@')) return alert("请输入正确的邮箱格式！");
    
    const btn = document.getElementById('btnSendCode');
    btn.disabled = true;
    btn.innerText = "发送中...";
    
    try {
        const res = await fetch('/api/send-auth-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        if (res.ok) {
            alert("✅ 验证码已发出！请检查收件箱。如果是学校邮箱，有时会在垃圾箱哦。");
            let timeLeft = 60;
            const timer = setInterval(() => {
                timeLeft--;
                btn.innerText = `${timeLeft}s`;
                if(timeLeft <= 0) { clearInterval(timer); btn.disabled = false; btn.innerText = "获取验证码"; }
            }, 1000);
        } else {
            throw new Error();
        }
    } catch (e) {
        alert("❌ 邮件系统繁忙，请稍后再试");
        btn.disabled = false;
        btn.innerText = "获取验证码";
    }
}

// 修改后的真实校验函数：加入后缀识别与分级认证
async function verifyEmailCode() {
    const email = document.getElementById('authEmailInput').value.trim().toLowerCase();
    const code = document.getElementById('authCodeInput').value.trim();
    
    if(!code) return alert("请输入验证码");

    try {
        const res = await fetch('/api/verify-auth-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code, userId: userUUID })
        });
        const data = await res.json();
        
        if (data.success) {
            // 保存 JWT token，后续所有需鉴权 API 请求使用
            if (data.token) {
                localStorage.setItem('hebao_token', data.token);
            }
            isLoggedIn = true;
            localStorage.setItem('hebao_logged_in', 'true');
            if (!localStorage.getItem('hp_name')) localStorage.setItem('hp_name', '管家新人_' + Math.floor(Math.random() * 1000));

            const domain = email.split('@')[1];
            
            // 🚨 核心逻辑：判断是否属于“校园/机构”后缀
            // 你可以根据需要扩充这个白名单，或者用正则匹配 .edu / .nl
            const isEdu = domain.includes('.edu') || 
                          domain.includes('tudelft.nl') || 
                          domain.includes('uva.nl') || 
                          domain.includes('eur.nl') ||
                          domain.includes('leidenuniv.nl');

            if (isEdu) {
                // 🎓 真正的校友认证
                localStorage.setItem('hp_email_verified', 'true');
                localStorage.setItem('hp_is_edu', 'true'); // 标记为教育认证
                localStorage.setItem('hp_email', email);
                
                alert(`🎊 认证成功！检测到校友身份：${domain.split('.')[0].toUpperCase()}\n\n专属勋章已点亮，信用分+50`);
            } else {
                // 👤 仅作为“普通身份验证”，不给校友勋章
                localStorage.setItem('hp_email_verified', 'true');
                localStorage.setItem('hp_is_edu', 'false'); // 非教育认证
                localStorage.setItem('hp_email', email);
                
                alert("✅ 邮箱验证成功！\n\n由于您使用的是普通私人邮箱，已为您点亮【实名认证】勋章，但无法点亮【校友勋章】哦。");
            }

            document.getElementById('emailVerifyModal').style.display = 'none';
            renderProfileState();
            if (currentPendingAction) { currentPendingAction(); currentPendingAction = null; } else { alert('🎉 登录成功！'); }
        } else {
            alert("❌ " + data.error);
        }
    } catch (e) {
        alert("❌ 网络连接异常");
    }
}
function openWechatBindModal() { document.getElementById('authWechatInput').value = localStorage.getItem('hp_wechat') || ''; document.getElementById('wechatBindModal').style.display = 'flex'; }
function saveWechatBind() {
    const wx = document.getElementById('authWechatInput').value.trim(); if(!wx) return alert("微信号不能为空哦！");
    localStorage.setItem('hp_wechat', wx); document.getElementById('wechatBindModal').style.display = 'none';
    const plus = document.createElement('div'); plus.className = 'float-plus'; plus.innerText = '💬 绑定成功 信用分+30'; plus.style.color = '#10B981';
    plus.style.left = '50%'; plus.style.top = '40%'; plus.style.transform = 'translate(-50%, -50%)'; document.body.appendChild(plus); setTimeout(() => plus.remove(), 2000);
    renderProfileState();
}
function openEditProfileModal() { document.getElementById('epName').value = localStorage.getItem('hp_name') || ''; document.getElementById('epGender').value = localStorage.getItem('hp_gender') || '保密'; document.getElementById('epMbti').value = localStorage.getItem('hp_mbti') || ''; document.getElementById('epWechat').value = localStorage.getItem('hp_wechat') || ''; document.getElementById('epBio').value = localStorage.getItem('hp_bio') || ''; document.getElementById('editProfileModal').style.display = 'flex'; }
function saveProfileData() { const name = document.getElementById('epName').value.trim(); if(!name) return alert('昵称不能为空哦！'); localStorage.setItem('hp_name', name); localStorage.setItem('hp_gender', document.getElementById('epGender').value); localStorage.setItem('hp_mbti', document.getElementById('epMbti').value); localStorage.setItem('hp_wechat', document.getElementById('epWechat').value.trim()); localStorage.setItem('hp_bio', document.getElementById('epBio').value.trim()); document.getElementById('editProfileModal').style.display = 'none'; renderProfileState(); }
function previewAvatar(event) { const file = event.target.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = function(e) { localStorage.setItem('hebao_avatar', e.target.result); renderProfileState(); }; reader.readAsDataURL(file); }
function loadAvatar() { const savedAvatar = localStorage.getItem('hebao_avatar'); if(savedAvatar && isLoggedIn) { document.getElementById('profileAvatarImg').src = savedAvatar; document.getElementById('profileAvatarImg').style.display = 'block'; document.getElementById('profileAvatarBox').style.background = '#FFF'; document.getElementById('profileAvatarEmoji').textContent = ''; } }

// ================= 4. GPS 自动定位 =================
let currentCity = ""; let currentPostcode = "";
function autoLocate(inputId) {
    const inputEl = document.getElementById(inputId); if (!navigator.geolocation) return alert("浏览器不支持定位功能");
    const oldVal = inputEl.value; inputEl.value = "定位中..."; const toggleWrapper = document.getElementById('postcodeToggleWrapper'); if(toggleWrapper) toggleWrapper.style.display = 'none';
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const { latitude, longitude } = pos.coords; const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=zh`);
            const data = await res.json(); currentCity = data.address.city || data.address.town || data.address.village || data.address.state || "荷兰";
            let fullPostcode = data.address.postcode || ""; currentPostcode = fullPostcode.replace(/\s+/g, '').substring(0, 4); 
            inputEl.value = currentCity;
            if (currentPostcode && toggleWrapper) { document.getElementById('detectedPostcode').innerText = currentPostcode; toggleWrapper.style.display = 'flex'; document.getElementById('showPostcodeCheck').checked = false; }
        } catch (e) { inputEl.value = oldVal; alert("获取定位失败"); }
    }, (err) => { inputEl.value = oldVal; alert("定位权限被拒绝"); }, { timeout: 10000 });
}
function togglePostcode() { const inputEl = document.getElementById('idleLocation'); const isChecked = document.getElementById('showPostcodeCheck').checked; if (isChecked) { inputEl.value = `${currentCity} (${currentPostcode})`; } else { inputEl.value = currentCity; } }

// ================= 5. 首页扫码引擎与榜单 =================
let currentProductData = null; let currentDetailData = null; let globalTrendingLikes = []; let globalTrendingDislikes = [];

async function handlePackageImage(event) {
    const file = event.target.files[0]; if (!file) return;
    document.getElementById('homeActionBox').style.display = 'none'; document.getElementById('previewContainer').style.display = 'block'; document.getElementById('scanOverlay').style.display = 'flex'; document.getElementById('scanText').innerText = "📡 正在解析包装..."; document.getElementById('miniResultCard').style.display = 'none';
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Data = e.target.result.split(',')[1]; const previewImg = document.getElementById('previewImg'); if (previewImg) previewImg.src = e.target.result;
        try {
            const res = await fetch('/api/scan', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ imageBase64: base64Data }) });
            const data = await res.json(); if(!res.ok || data.error) throw new Error(data.error || "识别失败");
            currentProductData = data; currentProductData.image_url = e.target.result; 
            document.getElementById('scanOverlay').style.display = 'none'; document.getElementById('previewContainer').style.display = 'none'; document.getElementById('miniResultCard').style.display = 'block'; 
            const emoji = data.is_recommended === 1 ? '👍' : '💣'; document.getElementById('miniChineseName').innerText = `${emoji} ${data.chinese_name || data.dutch_name || '未知商品'}`; document.getElementById('miniInsight').innerText = data.insight || '管家觉得不错~'; 
            saveToLocalFootprint(data, data.image_url);
        } catch (err) { alert("识别失败：" + err.message); resetApp(); } finally { document.getElementById('packageImgInput').value = ''; }
    }; reader.readAsDataURL(file);
}

let html5Scanner = null;
function startBarcodeScan() {
    document.getElementById('scannerModal').style.display = 'flex'; html5Scanner = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0, formatsToSupport: [ Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, Html5QrcodeSupportedFormats.UPC_A ] };
    html5Scanner.start({ facingMode: "environment" }, config, (decodedText) => { if (navigator.vibrate) navigator.vibrate(100); closeScanner(); document.getElementById('mainSearchInput').value = decodedText; executeSearch(); }).catch(err => { alert("调用摄像头失败"); closeScanner(); });
}
function closeScanner() { if(html5Scanner) { html5Scanner.stop().catch(e=>console.log(e)); html5Scanner = null; } document.getElementById('scannerModal').style.display = 'none'; }
function executeSearch() {
    const query = document.getElementById('mainSearchInput').value.trim(); if (!query) return;
    document.getElementById('homeActionBox').style.display='none'; document.getElementById('previewContainer').style.display='block'; document.getElementById('scanOverlay').style.display='flex'; document.getElementById('scanText').innerText = "📡 全网检索中..."; document.getElementById('miniResultCard').style.display='none';
    fetch('/api/scan-barcode', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ barcode: query, userId: userUUID }) })
    .then(res => res.json()).then(data => {
        currentProductData = data; document.getElementById('scanOverlay').style.display='none'; document.getElementById('previewContainer').style.display='none'; document.getElementById('miniResultCard').style.display='block'; 
        document.getElementById('miniChineseName').innerText=data.chinese_name||'未知商品'; document.getElementById('miniInsight').innerText=data.insight||'暂无评价'; saveToLocalFootprint(data, data.image_url);
    }).catch(err => { alert("未找到"); resetApp(); });
}
function resetApp() { document.getElementById('previewContainer').style.display='none'; document.getElementById('scanOverlay').style.display='none'; document.getElementById('miniResultCard').style.display='none'; document.getElementById('homeActionBox').style.display='flex'; document.getElementById('mainSearchInput').value = ''; }

async function loadTrendingToHome() {
    try {
        const res = await fetch('/api/trending'); const data = await res.json();
        if(data.success) { globalTrendingLikes = data.topLikes || []; globalTrendingDislikes = data.topDislikes || []; renderHomeTrending(globalTrendingLikes, 'homeTrendingListLikes', 'like'); renderHomeTrending(globalTrendingDislikes, 'homeTrendingListDislikes', 'dislike'); }
    } catch(e) {}
}
function renderHomeTrending(list, containerId, type) {
    const container = document.getElementById(containerId); if (!container || !list || list.length === 0) return; 
    let html = ''; const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23F3F4F6'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='10' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'%3E暂无图%3C/text%3E%3C/svg%3E";
    list.slice(0, 20).forEach((item, index) => {
        let badgeClass = 'rank-other'; if (index === 0) badgeClass = 'rank-1'; else if (index === 1) badgeClass = 'rank-2'; else if (index === 2) badgeClass = 'rank-3'; if (type === 'dislike') badgeClass = 'rank-bad';
        const score = type === 'like' ? item.likes : item.dislikes; const icon = type === 'like' ? '👍' : '💣'; const scoreColor = type === 'like' ? '#10B981' : '#EF4444'; const safeImg = item.image_url || fallbackSvg;
        html += `<div class="trending-card" onclick="openDetailsFromHomeTrending('${type}', ${index})"><div class="rank-badge ${badgeClass}">TOP ${index + 1}</div><img src="${safeImg}" onerror="this.onerror=null; this.src='${fallbackSvg}'" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; background: #F3F4F6; border: 1px solid #E5E7EB;"><div class="t-info"><div class="t-name">${item.chinese_name || '未命名商品'}</div><div style="font-size: 11px; color: #9CA3AF; margin-top:2px;">${item.dutch_name || ''}</div></div><div class="t-score" style="color: ${scoreColor}">${icon} ${score}</div></div>`;
    });
    container.innerHTML = html;
}

// ================= 6. 详情页与足迹 =================
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
    const text = document.getElementById('reviewText').value.trim(); if(!text) return alert("写点内容吧！");
    const attitude = document.getElementById('reviewAttitude').value; const finalUgcText = `🧑‍🍳 网友点评 [${attitude}]：${text}`;
    const btn = document.getElementById('btnSubmitReview'); btn.innerText = "提交中..."; btn.disabled = true;
    try {
        currentDetailData.pairing = currentDetailData.pairing ? currentDetailData.pairing + '\n\n' + finalUgcText : finalUgcText;
        let history = JSON.parse(localStorage.getItem('hebao_history') || '[]'); let index = history.findIndex(i => i.dutch_name === currentDetailData.dutch_name);
        if(index !== -1) { history[index].pairing = currentDetailData.pairing; localStorage.setItem('hebao_history', JSON.stringify(history)); }
        await fetch('/api/vote', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ dutch_name: currentDetailData.dutch_name, action: attitude.includes('推荐') ? 'like' : 'dislike' }) });
        alert("🎉 发布成功！"); document.getElementById('addReviewModal').style.display = 'none'; setupDetailPage();
    } catch(e) { alert("网络错误"); } finally { btn.innerText = "🚀 提交评价"; btn.disabled = false; }
}
async function sendQuestion() {
    const input = document.getElementById('askInput'); const question = input.value.trim(); if(!question) return;
    const chatBox = document.getElementById('chatHistory'); const dName = currentDetailData.dutch_name || currentDetailData.chinese_name || "未知商品"; const dInsight = currentDetailData.insight || "";
    chatBox.innerHTML += `<div class="chat-bubble bubble-user">${question}</div>`; input.value = ''; window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    const loadingId = 'loading-' + Date.now(); chatBox.innerHTML += `<div class="chat-bubble bubble-ai" id="${loadingId}">管家查阅中...</div>`;
    try {
        const response = await fetch('/api/ask', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ productName: dName, insight: dInsight, question: question, userId: userUUID }) });
        const data = await response.json(); document.getElementById(loadingId).remove();
        if (response.ok) { chatBox.innerHTML += `<div class="chat-bubble bubble-ai">🤖 ${data.reply}</div>`; } else { chatBox.innerHTML += `<div class="chat-bubble bubble-ai" style="color:red;">卡住了：${data.error}</div>`; }
    } catch (err) { document.getElementById(loadingId).remove(); chatBox.innerHTML += `<div class="chat-bubble bubble-ai" style="color:red;">网络断了</div>`; }
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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

// 防崩溃空函数：屏蔽老版 HTML 遗留报错
function renderTipsPage() {
    const qlContainer = document.getElementById('quickLinksContainer');
    if (qlContainer && typeof quickLinksData !== 'undefined') { 
        let qlHtml = ''; quickLinksData.forEach(link => { qlHtml += `<a href="${link.url}" target="_blank" class="ql-card"><div class="ql-icon">${link.icon}</div><div class="ql-title">${link.title}</div><div class="ql-sub">${link.sub}</div></a>`; }); 
        qlContainer.innerHTML = qlHtml; 
    }
}
function toggleTipsContent(element) { element.classList.toggle('active'); }

// ================= 7. 发布功能与 AI =================
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
    if (!recognition) return alert('请使用自带语音输入法');
    if (btn.classList.contains('recording')) { recognition.stop(); return; }
    btn.classList.add('recording'); btn.innerText = '🔴'; const oldPlaceholder = input.placeholder; input.placeholder = '听着呢...';
    try { recognition.start(); } catch(e) {}
    recognition.onresult = (event) => { input.value += event.results[0][0].transcript; };
    recognition.onend = () => { btn.classList.remove('recording'); btn.innerText = '🎙️'; input.placeholder = oldPlaceholder; if(input.value.trim() !== '') generateAICopy(type); };
    recognition.onerror = () => { btn.classList.remove('recording'); btn.innerText = '🎙️'; input.placeholder = oldPlaceholder; };
}

async function generateAICopy(type) {
    const inputEl = document.getElementById(`aiKeywords_${type}`); const keyword = inputEl.value.trim(); if (!keyword && type !== 'idle') return alert("说点什么吧！");
    const oldVal = inputEl.value; inputEl.value = "⏳ AI提取中..."; inputEl.disabled = true;
    try {
        const payload = { keyword, type };
        if (type === 'idle') { let itemsStr = selectedImagesArray.map((i, idx) => `图${idx+1}: ${i.name||''} - €${i.price||''}`).join('\n'); payload.currentDesc = itemsStr; payload.currentPrice = document.getElementById('idlePrice') ? document.getElementById('idlePrice').value.trim() : 0; }
        const res = await fetch('/api/generate-copy', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
        const data = await res.json(); if(data.error) throw new Error(data.error);
        if (type === 'idle') { if(data.deadline && document.getElementById('idleDeadline')) document.getElementById('idleDeadline').value = data.deadline; if(data.location && document.getElementById('idleLocation')) document.getElementById('idleLocation').value = data.location; if(data.bargain) matchPills('bargainGroup', data.bargain); if(data.payment) matchPills('paymentGroup', data.payment); } else if (type === 'help') { if(data.copy && document.getElementById('helpDesc')) document.getElementById('helpDesc').value = data.copy; if(data.reward && document.getElementById('helpReward')) document.getElementById('helpReward').value = data.reward; if(data.location && document.getElementById('helpLocation')) document.getElementById('helpLocation').value = data.location; if(data.urgent) matchPills('helpUrgentGroup', data.urgent); } else if (type === 'partner') { if(data.title && document.getElementById('partnerTitle')) document.getElementById('partnerTitle').value = data.title; if(data.copy && document.getElementById('partnerDesc')) document.getElementById('partnerDesc').value = data.copy; if(data.location && document.getElementById('partnerLocation')) document.getElementById('partnerLocation').value = data.location; if(data.mbti) matchSelect('partnerMbti', data.mbti); }
        inputEl.value = "✨ 提取成功！";
    } catch (err) { alert("失败：" + err.message); inputEl.value = oldVal; } finally { setTimeout(() => { inputEl.value = ''; inputEl.disabled = false; inputEl.placeholder="按住说：代村自提，明天拿走..."; }, 2000); }
}

async function submitIdlePost() {
    const loc = document.getElementById('idleLocation') ? document.getElementById('idleLocation').value : ''; const deadline = document.getElementById('idleDeadline') ? document.getElementById('idleDeadline').value : ''; const bargain = document.querySelector('#bargainGroup .active') ? document.querySelector('#bargainGroup .active').innerText : ''; const payment = document.querySelector('#paymentGroup .active') ? document.querySelector('#paymentGroup .active').innerText : ''; const totalPriceBox = document.getElementById('idlePrice'); const totalPrice = totalPriceBox ? totalPriceBox.value.trim() || '0' : '0';
    if(selectedImagesArray.length === 0) return alert("请至少传一张照片！");
    const btn = document.querySelector('#publishIdleModal .fm-submit'); btn.innerText = "打水印中..."; btn.style.pointerEvents = 'none';
    try {
        let finalItemsData = [];
        for (let img of selectedImagesArray) { const taggedBase64 = await addTagToImage(img.preview, img.name, img.price); const res = await fetch('/api/upload', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ imageBase64: taggedBase64 }) }); const data = await res.json(); if(data.success) { finalItemsData.push({ id: img.id, url: data.url, name: img.name, price: img.price, is_sold: false }); } }
        const contentJson = JSON.stringify({ items: finalItemsData, conditions: { loc, deadline, bargain, payment } }); const finalTitle = `[闲置] €${totalPrice} · ${loc.split(' (')[0]}`; const authorName = localStorage.getItem('hp_name') || '管家新人';
        const resDb = await fetch('/api/publish-community', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ userId: userUUID, authorName: authorName, title: finalTitle, text: contentJson, imageUrl: '' }) }); const resData = await resDb.json(); if(!resData.success) throw new Error(resData.error);
        alert("🎉 发布成功！"); closeIdlePublish(); selectedImagesArray = []; renderIdleItemCards(); if(totalPriceBox) totalPriceBox.value = ''; loadCommunityPosts(); 
    } catch(e) { alert("失败：" + e.message); } finally { btn.innerText = "发布"; btn.style.pointerEvents = 'auto'; }
}
async function submitHelpPost() {
    const desc = document.getElementById('helpDesc') ? document.getElementById('helpDesc').value.trim() : ''; const reward = document.getElementById('helpReward') ? document.getElementById('helpReward').value.trim() : '0'; const urgentGroup = document.querySelector('#helpUrgentGroup .active'); const urgent = urgentGroup && urgentGroup.innerText.includes('十万火急') ? '🔥急' : '普通';
    if(!desc) return alert("写点什么哦！"); const btn = document.querySelector('#publishHelpModal .fm-submit'); btn.innerText = "发送中..."; btn.style.pointerEvents = 'none';
    try { const finalTitle = `[互助-${urgent}] 赏金 €${reward || '0'}`; const authorName = localStorage.getItem('hp_name') || '管家新人'; const res = await fetch('/api/publish-community', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ userId: userUUID, authorName: authorName, title: finalTitle, text: desc, imageUrl: '' }) }); if(!res.ok) throw new Error("失败"); alert("🎉 发布成功！"); closeHelpPublish(); if(document.getElementById('helpDesc')) document.getElementById('helpDesc').value = ''; loadCommunityPosts(); } catch(e) { alert(e.message); } finally { btn.innerText = "发布"; btn.style.pointerEvents = 'auto'; }
}
async function submitPartnerPost() {
    const title = document.getElementById('partnerTitle') ? document.getElementById('partnerTitle').value.trim() : ''; const desc = document.getElementById('partnerDesc') ? document.getElementById('partnerDesc').value.trim() : '';
    if(!title) return alert("写个标题吧！"); const btn = document.querySelector('#publishPartnerModal .fm-submit'); btn.innerText = "发送中..."; btn.style.pointerEvents = 'none';
    try { const finalTitle = `[找搭子] ${title}`; const authorName = localStorage.getItem('hp_name') || '管家新人'; const res = await fetch('/api/publish-community', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ userId: userUUID, authorName: authorName, title: finalTitle, text: desc, imageUrl: '' }) }); if(!res.ok) throw new Error("失败"); alert("🎉 发布成功！"); closePartnerPublish(); if(document.getElementById('partnerTitle')) document.getElementById('partnerTitle').value = ''; if(document.getElementById('partnerDesc')) document.getElementById('partnerDesc').value = ''; loadCommunityPosts(); } catch(e) { alert(e.message); } finally { btn.innerText = "发布"; btn.style.pointerEvents = 'auto'; }
}

// ================= 8. 详情页与集市大厅 =================
let mockIdleItems = []; let mockHelpItems = []; let mockPartnerItems = []; window.allCommunityPostsCache = [];
let currentCommunityPost = null; let selectedItemIds = new Set(); 

function openCommunityPost(postId) {
    const post = window.allCommunityPostsCache.find(p => p.id === postId); if(!post) return; currentCommunityPost = post; selectedItemIds.clear();
    let payload; try { payload = JSON.parse(post.content); } catch(e) { payload = { items: [], conditions: {}, oldText: post.content }; }
    const isMe = (post.user_id === userUUID); 
    const sellerInfoHtml = `
        <div style="display:flex; align-items:center; gap:10px; margin-bottom: 10px;">
            <div style="width:36px; height:36px; border-radius:50%; background:#E5E7EB; display:flex; justify-content:center; align-items:center; font-size:18px;">😎</div>
            <div>
                <div style="font-weight:900; font-size:14px;">${post.author_name}</div>
                <div style="font-size:11px; color:#9CA3AF;">发布于 ${new Date(post.created_at).toLocaleDateString()}</div>
            </div>
        </div>
        ${payload.conditions ? `
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top: 10px;">
            <span class="sold-badge" style="position:static;">📍 ${payload.conditions.loc || '未填'}</span>
            <span class="sold-badge" style="position:static;">⏳ 截止: ${payload.conditions.deadline || '未填'}</span>
            <span class="sold-badge" style="position:static;">💶 ${payload.conditions.payment || '未填'}</span>
            <span class="sold-badge" style="position:static;">🔪 ${payload.conditions.bargain || '未填'}</span>
        </div>` : `<div style="font-size:13px; color:#4B5563; line-height:1.5;">${payload.oldText}</div>`}
    `; document.getElementById('pdSellerInfo').innerHTML = sellerInfoHtml;

    let itemsHtml = '';
    if(payload.items && payload.items.length > 0) {
        payload.items.forEach(item => {
            const soldClass = item.is_sold ? 'sold' : ''; let actionHtml = ''; let clickAction = '';
            if (isMe) {
                if (item.is_sold) actionHtml = `<div class="pd-sold-badge" style="position:absolute; top:8px; right:8px; z-index:10;">已出</div>`;
                else actionHtml = `<button class="mark-sold-btn" style="position:absolute; top:8px; right:8px; z-index:10; font-size:10px; padding:4px 8px; box-shadow:0 2px 4px rgba(0,0,0,0.2); border:none;" onclick="markItemSold(${post.id}, ${item.id}, event)">标为售出</button>`;
            } else {
                if (item.is_sold) actionHtml = `<div class="pd-sold-badge" style="position:absolute; top:8px; right:8px; z-index:10;">被抢了</div>`;
                else {
                    actionHtml = `<input type="checkbox" class="custom-checkbox" id="chk_${item.id}" style="position:absolute; top:8px; right:8px; z-index:10;" onclick="event.stopPropagation()" onchange="toggleItemSelect(${item.price}, ${item.id}, this)">`;
                    clickAction = `onclick="document.getElementById('chk_${item.id}').click()"`;
                }
            }
            itemsHtml += `<div class="pd-item-card ${soldClass}" ${clickAction}><img src="${item.url}" class="pd-item-img">${actionHtml}<div class="pd-item-overlay"><div class="pd-item-name">${item.name || '某物品'}</div><div class="pd-item-price">€${item.price || '0'}</div></div></div>`;
        });
    } else { itemsHtml = `<div style="text-align:center; color:#9CA3AF; padding:20px;">这是一个老版本的纯文字帖子</div>`; }
    document.getElementById('pdItemsList').innerHTML = itemsHtml; document.getElementById('pdTotalPrice').innerText = '€0.00';
    const chatBtn = document.getElementById('pdChatBtn');
    if (isMe) { chatBtn.innerText = "这是你发布的清单"; chatBtn.style.background = "#E5E7EB"; chatBtn.style.color = "#9CA3AF"; chatBtn.onclick = null; } 
    else { chatBtn.innerText = "私信想要 (0件)"; chatBtn.style.background = "#111827"; chatBtn.style.color = "#FFF"; chatBtn.onclick = initiateBuyChat; }
    document.getElementById('postDetailModal').style.display = 'block';
}
function closePostDetail() { document.getElementById('postDetailModal').style.display = 'none'; }
let currentTotalPrice = 0;
function toggleItemSelect(price, itemId, checkbox) {
    price = parseFloat(price) || 0; if (checkbox.checked) { selectedItemIds.add(itemId); currentTotalPrice += price; } else { selectedItemIds.delete(itemId); currentTotalPrice -= price; }
    document.getElementById('pdTotalPrice').innerText = `€${currentTotalPrice.toFixed(2)}`; document.getElementById('pdChatBtn').innerText = `私信想要 (${selectedItemIds.size}件)`;
}
function initiateBuyChat() {
    if (selectedItemIds.size === 0) return alert("请先勾选物品！");
    let payload = JSON.parse(currentCommunityPost.content); let wantNames = payload.items.filter(i => selectedItemIds.has(i.id)).map(i => i.name).join('、');
    const firstItemImg = payload.items[0].url;
    openChat(currentCommunityPost.user_id, currentCommunityPost.author_name, '😎', currentCommunityPost.id, `想要这几件 (€${currentTotalPrice})`, currentTotalPrice, firstItemImg, false, 'idle');
    const input = document.getElementById('chatInput'); if(input) input.value = `哈喽！我想要你清单里的：${wantNames}，请问还在吗？`;
    closePostDetail();
}
async function markItemSold(postId, itemId, event) {
    if(!confirm("标记售出后无法恢复，确定吗？")) return;
    const btn = event.target; btn.innerText = "更新中..."; btn.style.pointerEvents = "none";
    let payload = JSON.parse(currentCommunityPost.content); payload.items.forEach(i => { if(i.id === itemId) i.is_sold = true; });
    try {
        const res = await fetch('/api/update-post', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ postId: postId, userId: userUUID, newContent: JSON.stringify(payload) }) });
        const data = await res.json(); if(!data.success) throw new Error(data.error); loadCommunityPosts(); openCommunityPost(postId);
    } catch(e) { alert("更新失败"); btn.innerText = "标为售出"; btn.style.pointerEvents = "auto"; }
}

async function loadCommunityPosts() {
    try {
        const res = await fetch('/api/get-community'); const data = await res.json();
        if (data.success && data.posts) {
            mockIdleItems = []; mockHelpItems = []; mockPartnerItems = []; window.allCommunityPostsCache = data.posts; 
            data.posts.forEach(post => {
                const title = post.title || ''; const time = new Date(post.created_at).getTime() || Date.now(); const author = post.author_name || '匿名管家';
                let payload; try { payload = JSON.parse(post.content); } catch(e) { payload = { oldText: post.content }; }

                if (title.includes('[闲置]')) {
                    const firstImg = (payload.items && payload.items.length > 0) ? payload.items[0].url : 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&auto=format&fit=crop';
                    const priceMatch = title.match(/€(\d+(\.\d+)?)/); const price = priceMatch ? priceMatch[1] : '面议';
                    const isAllSold = payload.items ? payload.items.every(i => i.is_sold) : false; const itemCount = payload.items ? payload.items.length : 0;
                    mockIdleItems.push({ userId: post.user_id, id: post.id, img: firstImg, title: title.replace('[闲置] ', ''), price: price, priceNum: parseFloat(price) || 0, avatar: "😎", name: author, credit: "极佳", creditClass: "excellent", isSold: isAllSold, itemCount: itemCount, timestamp: time });
                } else if (title.includes('[互助')) {
                    const rewardMatch = title.match(/€(\d+(\.\d+)?)/); const reward = rewardMatch ? rewardMatch[1] : '0'; const isUrgent = title.includes('🔥急');
                    mockHelpItems.push({ userId: post.user_id, id: post.id, type: isUrgent ? "🔥 紧急" : "🤝 求助", isUrgent: isUrgent, title: payload.oldText ? payload.oldText.substring(0,40)+'...' : title, reward: reward, rewardNum: parseFloat(reward) || 0, date: "私信沟通", location: "荷兰", avatar: "🐼", name: author, credit: "新人", creditClass: "new", distKm: 1, timestamp: time, imgIcon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23EFF6FF'/><text x='50%' y='50%' font-size='20' text-anchor='middle' dominant-baseline='middle'>🤝</text></svg>" });
                } else if (title.includes('[找搭子]')) {
                    mockPartnerItems.push({ userId: post.user_id, id: post.id, avatar: "👱‍♀️", name: author, gender: "f", mbti: "未知", mbtiType: "all", title: title.replace('[找搭子] ', ''), desc: payload.oldText || '', tags: ["✨ 新发布"], distKm: 1, daysAway: 1, timestamp: time });
                }
            });
            applyMarketFilters('idle'); applyMarketFilters('help'); applyMarketFilters('partner');
        }
    } catch (err) {}
}

function toggleFilterPill(element, type) { element.classList.toggle('active'); applyMarketFilters(type); }
function applyMarketFilters(type) {
    if (type === 'idle') { const sortMode = document.getElementById('sortIdle') ? document.getElementById('sortIdle').value : 'newest'; const onlyBargain = document.getElementById('pillIdleBargain') && document.getElementById('pillIdleBargain').classList.contains('active'); let filtered = [...mockIdleItems]; if (onlyBargain) filtered = filtered.filter(item => item.isBargain); if (sortMode === 'priceAsc') filtered.sort((a, b) => a.priceNum - b.priceNum); else if (sortMode === 'priceDesc') filtered.sort((a, b) => b.priceNum - a.priceNum); else filtered.sort((a, b) => b.timestamp - a.timestamp); renderMarketIdle(filtered); } 
    else if (type === 'help') { const sortMode = document.getElementById('sortHelp') ? document.getElementById('sortHelp').value : 'newest'; const onlyUrgent = document.getElementById('pillHelpUrgent') && document.getElementById('pillHelpUrgent').classList.contains('active'); let filtered = [...mockHelpItems]; if (onlyUrgent) filtered = filtered.filter(item => item.isUrgent); if (sortMode === 'rewardDesc') filtered.sort((a, b) => b.rewardNum - a.rewardNum); else if (sortMode === 'distAsc') filtered.sort((a, b) => a.distKm - b.distKm); else filtered.sort((a, b) => b.timestamp - a.timestamp); renderMarketHelp(filtered); } 
    else if (type === 'partner') { const sortMode = document.getElementById('sortPartner') ? document.getElementById('sortPartner').value : 'newest'; const mbtiMode = document.getElementById('filterMBTI') ? document.getElementById('filterMBTI').value : 'all'; let filtered = [...mockPartnerItems]; if (mbtiMode !== 'all') filtered = filtered.filter(item => item.mbtiType === mbtiMode); if (sortMode === 'timeAsc') filtered.sort((a, b) => a.daysAway - b.daysAway); else if (sortMode === 'distAsc') filtered.sort((a, b) => a.distKm - b.distKm); else filtered.sort((a, b) => b.timestamp - a.timestamp); renderMarketPartner(filtered); }
}
function renderMarketIdle(data = mockIdleItems) { const container = document.getElementById('idleWaterfall'); if(!container) return; if(data.length === 0) { container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:40px 0; grid-column:span 2;">空空如也，快去发一个吧！</div>'; return; } let html = ''; data.forEach(item => { const soldOverlayHtml = item.isSold ? `<div class="wf-sold-overlay"><div class="wf-sold-text">已售空</div></div>` : ''; const countBadge = item.itemCount > 1 ? `<div class="waterfall-count-badge">共 ${item.itemCount} 件</div>` : ''; html += `<div class="waterfall-item" onclick="openCommunityPost(${item.id})"><div class="wf-img-box">${soldOverlayHtml}${countBadge}<img class="wf-img" src="${item.img}"></div><div class="wf-info"><div class="wf-title" style="${item.isSold ? 'color:#9CA3AF;' : ''}">${item.title}</div><div class="wf-price-row"><span class="wf-currency" style="${item.isSold ? 'color:#9CA3AF;' : ''}">€</span><span class="wf-price" style="${item.isSold ? 'color:#9CA3AF;' : ''}">${item.price}</span></div><div class="wf-user-row"><div class="wf-user"><div class="wf-avatar">${item.avatar}</div><div class="wf-name">${item.name}</div></div><div class="wf-credit ${item.creditClass}">${item.credit}</div></div></div></div>`; }); container.innerHTML = html; }
function renderMarketHelp(data = mockHelpItems) { const container = document.getElementById('helpListContainer'); if(!container) return; if(data.length === 0) { container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:40px 0; grid-column:span 2;">暂时没有符合条件的悬赏单~</div>'; return; } let html = ''; data.forEach(item => { const tagClass = item.isUrgent ? 'hc-type-tag urgent' : 'hc-type-tag'; const tagText = item.isUrgent ? `🔥 急·${item.type.split(' ')[1]}` : item.type.split(' ')[1]; html += `<div class="help-card" onclick="openChat('${item.userId}', '${item.name}', '${item.avatar}', ${item.id}, '${item.title}', '${item.reward}', \`${item.imgIcon}\`, false, 'help')"><div class="hc-top-row"><div class="${tagClass}">${tagText}</div><div class="hc-reward-compact">€${item.reward}</div></div><div class="hc-title">${item.title}</div><div class="hc-details"><div class="hc-detail-item"><span>⏰</span> ${item.date}</div><div class="hc-detail-item"><span>📍</span> ${item.location}</div></div><div class="hc-footer"><div class="hc-user"><div class="hc-avatar">${item.avatar}</div><div class="hc-name">${item.name}</div><div class="wf-credit ${item.creditClass}" style="margin-left:auto; transform:scale(0.9);">${item.credit}</div></div><div class="hc-action-btn">立即私信</div></div></div>`; }); container.innerHTML = html; }
function renderMarketPartner(data = mockPartnerItems) { const container = document.getElementById('partnerListContainer'); if(!container) return; if(data.length === 0) { container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:40px 0; grid-column:span 2;">没有找到合适的搭子，自己发一个吧！</div>'; return; } let html = ''; data.forEach(item => { const genderIcon = item.gender === 'f' ? '♀' : '♂'; const tagsHtml = item.tags.slice(0, 2).map(t => `<div class="pc-tag">${t}</div>`).join(''); const iconSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23F3E8FF'/><text x='50%' y='50%' font-size='20' text-anchor='middle' dominant-baseline='middle'>🥂</text></svg>`; html += `<div class="partner-card" onclick="openChat('${item.userId}', '${item.name}', '${item.avatar}', ${item.id}, '${item.title}', '0', \`${iconSvg}\`, false, 'partner')"><div class="pc-header"><div class="pc-user"><div class="pc-avatar">${item.avatar}</div><div class="pc-info"><div class="pc-name-row"><span class="pc-name">${item.name}</span><span class="pc-gender ${item.gender}">${genderIcon}</span></div><span class="pc-mbti">${item.mbti}</span></div></div></div><div class="pc-title">${item.title}</div><div class="pc-desc">${item.desc}</div><div class="pc-tags">${tagsHtml}</div><div class="pc-footer"><div class="pc-dist"><span>📍</span> 距你 ${item.distKm} km</div><div class="pc-action">打招呼</div></div></div>`; }); container.innerHTML = html; }

// ================= 9. 真实私信聊天系统 =================
let currentChatPartnerId = null; let currentChatPostId = null; let chatPollingInterval = null;

function openChat(sellerId, sellerName, sellerAvatar, postId, itemTitle, itemPrice, itemImg, isSold, postType = 'idle') {
    requireAuth(() => {
        if (sellerId === userUUID) return alert("💡 管家提示：不能给自己发私信哦！");
        currentChatPartnerId = sellerId; currentChatPostId = postId;
        document.getElementById('chatTargetName').innerText = sellerName; document.getElementById('chatTargetAvatar').innerText = sellerAvatar; document.getElementById('chatProductTitle').innerText = itemTitle; document.getElementById('chatProductPrice').innerText = '€' + itemPrice; document.getElementById('chatProductImg').src = itemImg;
        if (isSold) { document.getElementById('cpsActionBtn').style.display = 'none'; document.getElementById('cpsSoldStamp').style.display = 'block'; document.getElementById('chatInputBar').style.display = 'none'; document.getElementById('chatInputDisabled').style.display = 'block'; } 
        else { document.getElementById('cpsActionBtn').style.display = 'block'; document.getElementById('cpsSoldStamp').style.display = 'none'; document.getElementById('chatInputBar').style.display = 'flex'; document.getElementById('chatInputDisabled').style.display = 'none'; }
        document.getElementById('chatModal').style.display = 'flex'; const msgList = document.getElementById('chatMsgList'); msgList.innerHTML = '<div style="text-align:center; color:#9CA3AF; font-size:12px; margin-top:20px;">加载历史消息中...</div>';
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
    try { await fetch('/api/send-message', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ senderId: userUUID, receiverId: currentChatPartnerId, postId: currentChatPostId, content: text }) }); } catch(e) { alert("消息发送失败"); }
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
        if(data.success) { loadMyPosts(); loadCommunityPosts(); } else { alert('删除失败'); btnElement.innerText = originalText; btnElement.style.pointerEvents = "auto"; }
    } catch(e) { alert('网络错误'); btnElement.innerText = originalText; btnElement.style.pointerEvents = "auto"; }
}

// ============================================================================
// ================= 14. 生存红宝书：三模动态系统与硬核干货 =================
// ============================================================================
const rbTasks = [
    { id: 't1', title: '去市政厅 (Gemeente) 注册 BSN', desc: '荷兰的“身份证号”，没它办不了银行卡和网网。落地必须立刻预约！', hook: '刚来没被子？去集市低价收一套', hookTab: 'market-idle' },
    { id: 't2', title: '办理本地银行卡 (ING/ABN)', desc: '推荐 ING (App最好用) 或 Bunq。有了卡才能开通 Tikkie (荷兰版微信支付)。', hook: '找个搭子一起去银行排队', hookTab: 'market-partner' },
    { id: 't3', title: '激活 DigiD 数字身份', desc: '极其重要！所有的政府网站、退税、查医保全靠它扫码登录。', hook: '买台二手显示器大屏查政策', hookTab: 'market-idle' },
    { id: 't4', title: '买基础医保 (Zorgverzekering)', desc: '法律规定落地4个月内必须买，否则面临巨额罚款。平时不生病的推荐把 Eigen risico (自付额) 拉到最高 €885 以降低保费。', hook: '发个悬赏找学长推荐靠谱保险', hookTab: 'market-help' },
    { id: 't5', title: '申请医疗补贴 (Zorgtoeslag)', desc: '只要你没收入或收入很低，政府每月白送你 €120+ 帮你交保费！几乎等于免费看病。', hook: '省下的钱去集市淘个好物', hookTab: 'market-idle' },
    { id: 't6', title: '办理实名黄卡 (OV-chipkaart)', desc: '别用匿名蓝卡坐火车！上 NS 官网绑一个“周末免费”或“非高峰期打折”套餐。', hook: '嫌火车贵？去收一辆二手自行车', hookTab: 'market-idle' },
    { id: 't7', title: '注册家庭医生 (Huisarts)', desc: '在荷兰生病去医院急诊会被赶出来！必须先注册社区的 GP。务必找离家最近的。', hook: '看不懂荷兰语说明书？发悬赏求助', hookTab: 'market-help' }
];

const rbWikis = [
    // ================= 进阶模式 (已扩充海量数据) =================
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

    // ================= Pro 模式 =================
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

// --- 音效与剪贴板 ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function playDingSound() {
    if (!audioCtx) audioCtx = new AudioContext(); if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(880, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); 
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime); gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.02); gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gainNode); gainNode.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.3);
}
function copyText(text) { navigator.clipboard.writeText(text); alert(`已复制: ${text}`); }

// --- 模式控制器 ---
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
    
    const starterView = document.getElementById('rbStarterMode'); const wikiView = document.getElementById('rbWikiMode');
    const mainContainer = document.getElementById('redbookContainer'); const fabBtn = document.getElementById('fabGridBtn');

    if (mode === 'starter') {
        starterView.style.display = 'block'; wikiView.style.display = 'none'; fabBtn.style.display = 'none';
        mainContainer.classList.remove('rb-pro-theme'); renderStarterTasks();
    } else {
        starterView.style.display = 'none'; wikiView.style.display = 'block'; fabBtn.style.display = 'flex';
        
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

// --- 打卡系统 ---
function renderStarterTasks() {
    const list = document.getElementById('starterTaskList'); if(!list) return;
    const savedProgress = JSON.parse(localStorage.getItem('hp_tasks_done') || '[]');
    let html = ''; let doneCount = 0;

    rbTasks.forEach(task => {
        const isDone = savedProgress.includes(task.id); if (isDone) doneCount++;
        html += `<div class="task-card glass-card ${isDone ? 'done' : ''}" id="task_${task.id}"><input type="checkbox" class="task-checkbox" ${isDone ? 'checked' : ''} onchange="toggleTask('${task.id}', this)"><div class="task-content"><div class="task-title">${task.title}</div><div class="task-desc">${task.desc}</div><div class="task-hook" onclick="goBack(); setTimeout(()=>switchTab('scan', document.querySelectorAll('.tab-item')[1]), 100); setTimeout(()=>switchMarketTab('${task.hookTab.split('-')[1]}', document.querySelector('.m-tab')), 200);">👉 ${task.hook}</div></div></div>`;
    });
    list.innerHTML = html;
    
    document.getElementById('taskProgressBar').style.width = `${(doneCount / rbTasks.length) * 100}%`;
    document.getElementById('taskProgressText').innerText = `${doneCount}/${rbTasks.length}`;

    if (doneCount === rbTasks.length && !localStorage.getItem('hp_starter_cleared')) {
        setTimeout(() => {
            const plus = document.createElement('div'); plus.className = 'float-plus'; plus.innerText = '🎉 任务全清！'; plus.style.color = '#10B981';
            plus.style.left = '50%'; plus.style.top = '40%'; plus.style.transform = 'translate(-50%, -50%)'; document.body.appendChild(plus); 
            setTimeout(() => plus.remove(), 2500); localStorage.setItem('hp_starter_cleared', 'true');
            setTimeout(() => { alert("已为您开启【进阶模式】！"); switchRbMode('advanced'); }, 1500);
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

// --- 物理左/右滑动引擎与透明度渐变 ---
let swipeStartX = 0; let swipeCurrentX = 0; let isSwiping = false; 
let isDraggingClickPrevent = false; let activeSwipeId = null;

function hSwipeStart(e, id) {
    swipeStartX = e.touches[0].clientX; isSwiping = true; isDraggingClickPrevent = false; activeSwipeId = id;
    const frontCard = document.getElementById(`front_${id}`);
    if(frontCard) frontCard.style.transition = 'none';
}

function hSwipeMove(e, id) {
    if (!isSwiping || activeSwipeId !== id) return;
    swipeCurrentX = e.touches[0].clientX; const diffX = swipeCurrentX - swipeStartX;
    if (Math.abs(diffX) > 10) isDraggingClickPrevent = true; 
    
    const frontCard = document.getElementById(`front_${id}`);
    if(frontCard) frontCard.style.transform = `translateX(${diffX}px)`;

    // 动态透明度渐变：右滑显现绿色(保存)，左滑显现红色(删除)
    const saveBg = document.querySelector(`#swipe_${id} .save-bg`);
    const deleteBg = document.querySelector(`#swipe_${id} .delete-bg`);
    if (diffX > 0) {
        if(saveBg) saveBg.style.opacity = Math.min(diffX / 80, 1);
        if(deleteBg) deleteBg.style.opacity = 0;
    } else {
        if(saveBg) saveBg.style.opacity = 0;
        if(deleteBg) deleteBg.style.opacity = Math.min(Math.abs(diffX) / 80, 1);
    }
}

function hSwipeEnd(e, id) {
    if (!isSwiping || activeSwipeId !== id) return;
    isSwiping = false;
    
    // 获取最终位移
    const diffX = swipeCurrentX - swipeStartX;
    const frontCard = document.getElementById(`front_${id}`);
    if(!frontCard) return;

    frontCard.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
    const threshold = window.innerWidth * 0.35; // 触发阈值

    // 关键修正：只有当位移绝对值大于 10px 时，才判定为“意图滑动”
    if (Math.abs(diffX) > 10) {
        if (diffX > threshold) {
            // 右滑成功 -> 飞出并收藏
            frontCard.style.transform = `translateX(${window.innerWidth}px)`;
            setTimeout(() => handleWikiAction(id, 'saved'), 300);
        } else if (diffX < -threshold) {
            // 左滑成功 -> 飞出并删除
            frontCard.style.transform = `translateX(-${window.innerWidth}px)`;
            setTimeout(() => handleWikiAction(id, 'deleted'), 300);
        } else {
            // 滑动距离不足 -> 弹回
            frontCard.style.transform = `translateX(0px)`;
            resetSwipeBg(id);
        }
    } else {
        // 位移极小（属于点击行为）-> 强制弹回，确保不消失
        frontCard.style.transform = `translateX(0px)`;
        resetSwipeBg(id);
    }
    
    // 延迟 100ms 释放锁，确保 click 事件能被正确触发
    setTimeout(() => { isDraggingClickPrevent = false; activeSwipeId = null; }, 100);
}

// 新增一个重置背景透明度的辅助函数
function resetSwipeBg(id) {
    const sBg = document.querySelector(`#swipe_${id} .save-bg`);
    const dBg = document.querySelector(`#swipe_${id} .delete-bg`);
    if(sBg) sBg.style.opacity = 0;
    if(dBg) dBg.style.opacity = 0;
}

function toggleWikiCard(el) {
    // 如果正在滑动或者位移锁开启，直接拦截点击
    if (isSwiping || isDraggingClickPrevent) {
        return;
    }
    
    // 只有在卡片完全归位（transform 为 0 或为空）时才允许展开
    const transform = window.getComputedStyle(el).transform;
    const matrix = new WebKitCSSMatrix(transform);
    if (Math.abs(matrix.m41) < 5) { // 允许 5px 以内的误差
        el.classList.toggle('open');
    }
}
function handleWikiAction(id, actionStr) {
    let arr = JSON.parse(localStorage.getItem(`hp_wiki_${actionStr}`) || '[]');
    if (!arr.includes(id)) arr.push(id);
    localStorage.setItem(`hp_wiki_${actionStr}`, JSON.stringify(arr));
    
    // 如果是收藏，给出视觉反馈
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
    
    const deletedData = JSON.parse(localStorage.getItem('hp_wiki_deleted') || '[]');
    const savedData = JSON.parse(localStorage.getItem('hp_wiki_saved') || '[]');
    const customWikis = JSON.parse(localStorage.getItem('hp_custom_wikis') || '[]'); // 获取 AI 生成的自定义内容
    
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
                <div class="swipe-bg save-bg">⭐ 收藏</div>
                <div class="swipe-bg delete-bg">🗑️ 懂了</div>
                <div class="wiki-card swipe-front" id="front_${w.id}" onclick="toggleWikiCard(this)" ontouchstart="hSwipeStart(event, '${w.id}')" ontouchmove="hSwipeMove(event, '${w.id}')" ontouchend="hSwipeEnd(event, '${w.id}')">
                    <div class="wk-header">
                        <div class="wk-icon">${w.icon}</div>
                        <div class="wk-info"><div class="wk-title">${w.title} <span class="wk-tag">${w.tag}</span></div><div class="wk-summary">${w.summary}</div></div>
                    </div>
                    <div class="wk-detail" onclick="event.stopPropagation()">
                        <div class="wk-step">${w.details}</div>
                        <div class="wk-ugc-btn" onclick="alert('政策有变？请加客服反馈，核实后将为您增加 50 信用分。')">🚨 政策变了？点我疯狂打脸纠错！</div>
                    </div>
                </div>
            </div>`;
        });
    }
    
    // 列表底部永远挂载一个“AI 录入”按钮，允许用户自己扩充数据库
    html += `<button class="btn-ai-create" onclick="document.getElementById('aiWikiModal').style.display='flex'">✨ AI 自动提取长文并录入</button>`;
    list.innerHTML = html;
}

// --- 我的收藏渲染逻辑 ---
function openCollectionsModal() {
    requireAuth(() => {
        document.getElementById('collectionsModal').style.display = 'flex';
        renderCollections();
    });
}

function renderCollections() {
    const list = document.getElementById('collectionsList');
    const savedIds = JSON.parse(localStorage.getItem('hp_wiki_saved') || '[]');
    if(savedIds.length === 0) { list.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:40px 0;">收藏夹空空如也，快去红宝书里右滑卡片吧！</div>'; return; }

    const allWikis = [...rbWikis, ...JSON.parse(localStorage.getItem('hp_custom_wikis') || '[]')];
    let html = '';
    savedIds.forEach(id => {
        const w = allWikis.find(x => x.id === id);
        if(w) {
            html += `
            <div class="wiki-card" style="margin-bottom:12px; background:#FFF; border:1px solid #E5E7EB; border-radius:16px;" onclick="this.classList.toggle('open')">
                <div class="wk-header">
                    <div class="wk-icon">${w.icon}</div>
                    <div class="wk-info"><div class="wk-title">${w.title} <span class="wk-tag">${w.tag}</span></div><div class="wk-summary">${w.summary}</div></div>
                </div>
                <div class="wk-detail" onclick="event.stopPropagation()">
                    <div class="wk-step">${w.details}</div>
                    <button class="wk-ugc-btn" style="color:#EF4444; border-color:#FECACA;" onclick="removeCollection('${w.id}', event)">❌ 取消收藏</button>
                </div>
            </div>`;
        }
    });
    list.innerHTML = html;
}

function removeCollection(id, e) {
    e.stopPropagation();
    let savedIds = JSON.parse(localStorage.getItem('hp_wiki_saved') || '[]');
    savedIds = savedIds.filter(x => x !== id);
    localStorage.setItem('hp_wiki_saved', JSON.stringify(savedIds));
    renderCollections();
    renderWikiList(document.getElementById('wikiSearchInput') ? document.getElementById('wikiSearchInput').value.toLowerCase() : '');
}

// --- AI 自动洗稿录入卡片引擎 ---
async function generateAICard() {
    const inputEl = document.getElementById('aiWikiInput');
    const btnEl = document.getElementById('btnGenerateWiki');
    const keyword = inputEl.value.trim();
    if (!keyword) return alert("请先粘贴你要提取的内容！");
    
    btnEl.innerText = "⏳ DeepSeek 正在疯狂提炼..."; btnEl.disabled = true;

    try {
        const res = await fetch('/api/generate-copy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword, type: 'wiki' }) });
        const data = await res.json(); if(data.error) throw new Error(data.error);

        // 组装新卡片
        const newCard = {
            id: 'cw_' + Date.now(), // 自定义前缀
            mode: currentRbMode,
            category: currentRbCategory === 'all' ? '专属干货' : currentRbCategory,
            icon: data.icon || '📌',
            title: data.title || '无标题攻略',
            tag: data.tag || 'AI生成',
            summary: data.summary || '这是一条自动提取的干货总结。',
            details: data.details || keyword
        };

        // 存入本地自定义题库
        let customWikis = JSON.parse(localStorage.getItem('hp_custom_wikis') || '[]');
        customWikis.unshift(newCard); // 放在最前面
        localStorage.setItem('hp_custom_wikis', JSON.stringify(customWikis));

        alert("🎉 录入成功！卡片已生成！");
        document.getElementById('aiWikiModal').style.display = 'none';
        inputEl.value = '';
        renderWikiList(); 

    } catch (err) {
        alert("提取失败：" + err.message);
    } finally { 
        btnEl.innerText = "🪄 一键提取为红宝书"; btnEl.disabled = false; 
    }
}

function toggleFabModal() { alert("您可以点击底部的『✨ AI 自动提取长文』来自己制作卡片哦！"); }
function checkWidgets() {
    const now = new Date(); const day = now.getDay(); const hours = now.getHours();
    const supermarketWg = document.getElementById('supermarketWidget');
    if ((day === 0 || day === 6) && hours >= 16 && hours < 22) {
        if(supermarketWg) { supermarketWg.style.display = 'flex'; document.getElementById('supermarketAlertText').innerText = `🚨 距提早关门仅剩 ${22 - hours} 小时！`; }
    } else { if(supermarketWg) supermarketWg.style.display = 'none'; }
}

// ================= 最后，初始化引擎 =================
window.addEventListener('DOMContentLoaded', () => { 
    renderTipsPage(); 
    loadTrendingToHome(); 
    renderProfileState(); 
    loadCommunityPosts();
    initRedBook(); 
});
