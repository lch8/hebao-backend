// ================= 1. 全局状态与鉴权中心 =================
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
        else alert("⚠️ 请先登录！"); 
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
            alert('🎉 登录成功！'); 
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

// ================= 2. 基础导航控制 =================
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
    
    const tabBar = document.querySelector('.tab-bar');
    const chatBar = document.getElementById('stickyChatBar');
    if (tabId === 'details') { 
        if(tabBar) tabBar.style.display = 'none'; 
        if(chatBar) chatBar.style.display = 'flex'; 
    } else { 
        if(tabBar) tabBar.style.display = 'flex'; 
        if(chatBar) chatBar.style.display = 'none'; 
    }
    
    if (tabId === 'profile') { renderFootprints(); renderProfileState(); }
}

function goBack() { 
    const targetTab = document.querySelector(`.tab-item[onclick*="${lastTab}"]`);
    switchTab(lastTab, targetTab); 
}

function switchMarketTab(type, element) { 
    document.querySelectorAll('.market-content').forEach(el => el.classList.remove('active')); 
    const mCont = document.getElementById('market-' + type);
    if(mCont) mCont.classList.add('active'); 
    document.querySelectorAll('.m-tab').forEach(el => el.classList.remove('active')); 
    if(element) element.classList.add('active'); 
}

function switchAssetTab(tabId, element) { 
    document.querySelectorAll('.a-tab').forEach(el => el.classList.remove('active')); 
    if(element) element.classList.add('active'); 
    document.querySelectorAll('.asset-content').forEach(el => el.classList.remove('active')); 
    const aCont = document.getElementById('asset-' + tabId);
    if(aCont) aCont.classList.add('active'); 
}

function switchHomeTrendingTab(type, element) { 
    document.querySelectorAll('#page-scan .t-tab').forEach(el => el.classList.remove('active')); 
    if(element) element.classList.add('active'); 
    const lList = document.getElementById('homeTrendingListLikes');
    const dList = document.getElementById('homeTrendingListDislikes');
    if(lList) lList.style.display = type === 'likes' ? 'block' : 'none'; 
    if(dList) dList.style.display = type === 'dislikes' ? 'block' : 'none'; 
}

// ================= 3. 个人主页与深度认证逻辑 =================
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
        if(uidText) uidText.innerText = 'ID: ' + userUUID.substring(0,8).toUpperCase();
        
        const savedName = localStorage.getItem('hp_name') || '管家新人';
        const isEmailVerified = localStorage.getItem('hp_email_verified') === 'true';
        const isEdu = localStorage.getItem('hp_is_edu') === 'true';
        const savedWechat = localStorage.getItem('hp_wechat') || '';
        const savedBio = localStorage.getItem('hp_bio') || '这个人很懒，还没写自我介绍~';

        // 渲染动态名字栏
        let nameHtml = savedName;
        if(isEmailVerified) {
            if(isEdu) nameHtml += `<span class="verified-badge">🎓 校友</span>`;
            else nameHtml += `<span class="verified-badge" style="background:#6B7280;">✔️ 实名</span>`;
        }
        if(savedWechat) nameHtml += `<span class="verified-badge wechat">💬 微信</span>`;
        if(nameText) nameText.innerHTML = nameHtml;
        if(bioText) bioText.innerText = savedBio; bioText.style.display = 'block';

        // 信用分计算
        let score = 500;
        if(localStorage.getItem('hebao_avatar')) score += 20; 
        if(localStorage.getItem('hp_mbti')) score += 20;
        if(isEmailVerified) score += 50; 
        if(savedWechat) score += 30;     
        
        if(creditBadge) {
            let badgeText = score >= 600 ? '极品守信' : (score >= 550 ? '极佳' : '良好');
            let badgeColor = score >= 600 ? '#059669' : (score >= 550 ? '#10B981' : '#D97706');
            creditBadge.innerText = `${badgeText} ${score}`; 
            creditBadge.style.background = badgeColor; 
            creditBadge.style.display = 'inline-block';
        }

        // 认证同步
        const emailAuthStatus = document.getElementById('emailAuthStatusText');
        const emailBtn = document.getElementById('emailAuthBtn');
        if(emailAuthStatus && emailBtn) {
            if(isEmailVerified) {
                emailAuthStatus.innerText = "已认证: " + (localStorage.getItem('hp_email') || "");
                emailBtn.innerText = "已达成"; emailBtn.classList.add('done');
            } else {
                emailAuthStatus.innerText = "点亮校友身份 (信用分+50)";
                emailBtn.innerText = "去认证"; emailBtn.classList.remove('done');
            }
        }

        const wechatAuthStatus = document.getElementById('wechatAuthStatusText');
        const wechatBtn = document.getElementById('wechatAuthBtn');
        if(wechatAuthStatus && wechatBtn) {
            if(savedWechat) {
                wechatAuthStatus.innerText = `已绑定: ${savedWechat.substring(0,2)}***`;
                wechatBtn.innerText = "已绑定"; wechatBtn.classList.add('done');
            } else {
                wechatAuthStatus.innerText = "买家可一键复制添加";
                wechatBtn.innerText = "去绑定"; wechatBtn.classList.remove('done');
            }
        }
        loadAvatar(); loadMyPosts(); 
    } else {
        guestBlock.style.display = 'block'; actionsBlock.style.display = 'none';
        if(authCenter) authCenter.style.display = 'none';
        if(nameText) nameText.innerText = '管家游客';
    }
}

// ================= 4. 核心功能：邮箱真实校验 =================
async function sendAuthCode() {
    const emailInput = document.getElementById('authEmailInput');
    const email = emailInput.value.trim();
    if(!email || !email.includes('@')) return alert("请输入正确的邮箱格式！");
    const btn = document.getElementById('btnSendCode');
    btn.disabled = true; btn.innerText = "发送中...";
    try {
        const res = await fetch('/api/send-auth-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        if (res.ok) {
            alert("✅ 验证码已发出！请检查收件箱。");
            let timeLeft = 60;
            const timer = setInterval(() => {
                timeLeft--; btn.innerText = `${timeLeft}s`;
                if(timeLeft <= 0) { clearInterval(timer); btn.disabled = false; btn.innerText = "获取验证码"; }
            }, 1000);
        } else throw new Error();
    } catch (e) { alert("❌ 邮件系统繁忙"); btn.disabled = false; btn.innerText = "获取验证码"; }
}

async function verifyEmailCode() {
    const email = document.getElementById('authEmailInput').value.trim().toLowerCase();
    const code = document.getElementById('authCodeInput').value.trim();
    if(!code) return alert("请输入验证码");
    try {
        const res = await fetch('/api/verify-auth-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code, userId: userUUID }) });
        const data = await res.json();
        if (data.success) {
            const domain = email.split('@')[1];
            const isEdu = domain.includes('.edu') || domain.includes('tudelft.nl') || domain.includes('uva.nl') || domain.includes('eur.nl');
            localStorage.setItem('hp_email_verified', 'true');
            localStorage.setItem('hp_is_edu', isEdu ? 'true' : 'false');
            localStorage.setItem('hp_email', email);
            document.getElementById('emailVerifyModal').style.display = 'none';
            alert(isEdu ? `🎊 校友认证成功！` : "✅ 验证成功！普通私人邮箱无法点亮校友勋章哦。");
            renderProfileState();
        } else alert("❌ " + data.error);
    } catch (e) { alert("❌ 网络连接异常"); }
}

// ================= 5. GPS 与扫码逻辑 =================
function autoLocate(inputId) {
    const inputEl = document.getElementById(inputId); if (!navigator.geolocation) return alert("不支持定位");
    const oldVal = inputEl.value; inputEl.value = "定位中...";
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=zh`);
            const data = await res.json();
            const city = data.address.city || data.address.town || "荷兰";
            inputEl.value = city;
        } catch (e) { inputEl.value = oldVal; }
    }, () => { inputEl.value = oldVal; }, { timeout: 10000 });
}

// ================= 6. 集市数据加载与渲染 =================
let mockIdleItems = []; let mockHelpItems = []; let mockPartnerItems = []; window.allCommunityPostsCache = [];
async function loadCommunityPosts() {
    try {
        const res = await fetch('/api/get-community'); const data = await res.json();
        if (data.success && data.posts) {
            mockIdleItems = []; mockHelpItems = []; mockPartnerItems = []; window.allCommunityPostsCache = data.posts; 
            data.posts.forEach(post => {
                const title = post.title || ''; 
                let payload; try { payload = JSON.parse(post.content); } catch(e) { payload = { oldText: post.content }; }
                if (title.includes('[闲置]')) {
                    const priceMatch = title.match(/€(\d+(\.\d+)?)/);
                    mockIdleItems.push({ userId: post.user_id, id: post.id, img: payload.items?.[0]?.url || "", title: title.replace('[闲置] ', ''), price: priceMatch ? priceMatch[1] : '面议', priceNum: parseFloat(priceMatch?.[1]) || 0, name: post.author_name, timestamp: new Date(post.created_at).getTime() });
                }
            });
            renderMarketIdle(mockIdleItems);
        }
    } catch (err) {}
}

function renderMarketIdle(data) {
    const container = document.getElementById('idleWaterfall'); if(!container) return;
    container.innerHTML = data.map(item => `
        <div class="waterfall-item" onclick="openCommunityPost(${item.id})">
            <div class="wf-img-box"><img class="wf-img" src="${item.img}"></div>
            <div class="wf-info">
                <div class="wf-title">${item.title}</div>
                <div class="wf-price-row"><span class="wf-currency">€</span><span class="wf-price">${item.price}</span></div>
                <div class="wf-user-row"><div class="wf-name">${item.name}</div></div>
            </div>
        </div>
    `).join('');
}

// ================= 7. 红宝书滑动引擎 =================
const rbWikis = [
    { id: 'w1', mode: 'advanced', category: '羊毛购物', icon: '🛒', title: 'AH 35% Off 贴纸规律', tag: '省钱', summary: '每天下午16:00开始贴。', details: '买肉类最划算，回家直接冷冻。' },
    { id: 'w2', mode: 'pro', category: '买房定居', icon: '🏠', title: 'Funda 竞价潜规则', tag: '实操', summary: '加价10%是常态。', details: '必须写财务保留条款。' }
];

let swipeStartX = 0; let swipeCurrentX = 0; let isSwiping = false; let activeSwipeId = null; let isDraggingClickPrevent = false;

function hSwipeStart(e, id) { swipeStartX = e.touches[0].clientX; isSwiping = true; isDraggingClickPrevent = false; activeSwipeId = id; }
function hSwipeMove(e, id) {
    if (!isSwiping || activeSwipeId !== id) return;
    swipeCurrentX = e.touches[0].clientX; const diffX = swipeCurrentX - swipeStartX;
    if (Math.abs(diffX) > 10) isDraggingClickPrevent = true;
    const frontCard = document.getElementById(`front_${id}`);
    if(frontCard) frontCard.style.transform = `translateX(${diffX}px)`;
    const sBg = document.querySelector(`#swipe_${id} .save-bg`);
    const dBg = document.querySelector(`#swipe_${id} .delete-bg`);
    if (diffX > 0) { if(sBg) sBg.style.opacity = Math.min(diffX/80, 1); if(dBg) dBg.style.opacity = 0; }
    else { if(dBg) dBg.style.opacity = Math.min(Math.abs(diffX)/80, 1); if(sBg) sBg.style.opacity = 0; }
}

function hSwipeEnd(e, id) {
    if (!isSwiping) return; isSwiping = false; const diffX = swipeCurrentX - swipeStartX;
    const frontCard = document.getElementById(`front_${id}`); if(!frontCard) return;
    frontCard.style.transition = 'transform 0.3s ease';
    if (Math.abs(diffX) > window.innerWidth * 0.35) {
        frontCard.style.transform = `translateX(${diffX > 0 ? 1 : -1}00%)`;
        setTimeout(() => handleWikiAction(id, diffX > 0 ? 'saved' : 'deleted'), 300);
    } else { 
        frontCard.style.transform = 'translateX(0px)';
        const sBg = document.querySelector(`#swipe_${id} .save-bg`);
        const dBg = document.querySelector(`#swipe_${id} .delete-bg`);
        if(sBg) sBg.style.opacity = 0; if(dBg) dBg.style.opacity = 0;
    }
    setTimeout(() => { isDraggingClickPrevent = false; activeSwipeId = null; }, 100);
}

function toggleWikiCard(el) { if (isSwiping || isDraggingClickPrevent) return; el.classList.toggle('open'); }

function handleWikiAction(id, action) {
    let arr = JSON.parse(localStorage.getItem(`hp_wiki_${action}`) || '[]');
    if(!arr.includes(id)) arr.push(id);
    localStorage.setItem(`hp_wiki_${action}`, JSON.stringify(arr));
    renderWikiList();
}

let currentRbMode = localStorage.getItem('hp_survival_mode') || 'starter';
let currentRbCategory = 'all';

function initRedBook() {
    if(!localStorage.getItem('hp_disclaimer_agreed')) { 
        const m = document.getElementById('disclaimerModal'); if(m) m.style.display = 'flex'; 
    }
    switchRbMode(currentRbMode);
}

function switchRbMode(mode) {
    currentRbMode = mode; localStorage.setItem('hp_survival_mode', mode);
    document.querySelectorAll('.rb-mode-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.rb-mode-btn[onclick*="${mode}"]`); if(btn) btn.classList.add('active');
    renderWikiList();
}

function renderWikiList(searchQuery = '') {
    const list = document.getElementById('wikiListContainer'); if(!list) return;
    const deleted = JSON.parse(localStorage.getItem('hp_wiki_deleted') || '[]');
    const saved = JSON.parse(localStorage.getItem('hp_wiki_saved') || '[]');
    const custom = JSON.parse(localStorage.getItem('hp_custom_wikis') || '[]');
    const filtered = [...rbWikis, ...custom].filter(w => w.mode === currentRbMode && !deleted.includes(w.id) && !saved.includes(w.id));
    
    list.innerHTML = filtered.map(w => `
        <div class="swipe-wrapper" id="swipe_${w.id}">
            <div class="swipe-bg save-bg">⭐ 收藏</div><div class="swipe-bg delete-bg">🗑️ 懂了</div>
            <div class="wiki-card swipe-front" id="front_${w.id}" onclick="toggleWikiCard(this)" ontouchstart="hSwipeStart(event, '${w.id}')" ontouchmove="hSwipeMove(event, '${w.id}')" ontouchend="hSwipeEnd(event, '${w.id}')">
                <div class="wk-header"><div class="wk-icon">${w.icon}</div><div class="wk-info"><div class="wk-title">${w.title}</div><div class="wk-summary">${w.summary}</div></div></div>
                <div class="wk-detail">${w.details}</div>
            </div>
        </div>
    `).join('') + `<button class="btn-ai-create" onclick="document.getElementById('aiWikiModal').style.display='flex'">✨ AI 自动录入</button>`;
}

// ================= 8. 初始化启动 =================
window.addEventListener('DOMContentLoaded', () => { 
    const emailInput = document.getElementById('authEmailInput');
    if(emailInput) {
        emailInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            let hint = document.getElementById('emailSchoolHint');
            if(!hint) { hint = document.createElement('div'); hint.id="emailSchoolHint"; hint.className="email-hint"; e.target.parentNode.appendChild(hint); }
            hint.innerText = val.includes('tudelft.nl') ? "✨ 检测到 TUDelft 校友！" : (val.includes('.edu') ? "✨ 教育邮箱识别成功" : "");
        });
    }
    renderProfileState(); 
    loadCommunityPosts(); 
    initRedBook();
});

// [防报错容错函数组]
function renderTipsPage() {}
function loadTrendingToHome() {}
function renderFootprints() {}
function loadAvatar() {}
function loadMyPosts() {}
function openCollectionsModal() {}
function generateAICard() {}
function agreeDisclaimer() { localStorage.setItem('hp_disclaimer_agreed', 'true'); document.getElementById('disclaimerModal').style.display='none'; }
