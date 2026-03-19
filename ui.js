// ui.js - 视图层控制，包含 Tab 切换和弹窗逻辑

// 🛡️ 架构师补丁：注入全局防伪装变量，防止 UI 引擎崩溃
window.isLoggedIn = localStorage.getItem('hebao_logged_in') === 'true';
window.userUUID = localStorage.getItem('hebao_uuid') || '';

let lastTab = 'tips'; 

function toggleScanMenu() {
    const fab = document.getElementById('mainScanFab');
    if(fab) fab.classList.toggle('active');
}

// ... 下面保留你原有的 switchTab, renderProfileState 等函数不变 ...

// ui.js
function switchTab(tabId, element) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('page-' + tabId); 
    if(target) target.classList.add('active');

    if (element) { 
        document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active')); 
        element.classList.add('active'); 
    }

    // 🌟 架构师加装：如果切换到了“消息”页，立刻拉取最新的聊天列表！
    if (tabId === 'messages' && window.App && window.App.loadConversations) {
        window.App.loadConversations();
    }

    const tabBar = document.querySelector('.tab-bar');
    if (tabId === 'details' || tabId === 'trending') { 
        if(tabBar) tabBar.style.display = 'none'; 
    } else { 
        if(tabBar) tabBar.style.display = 'flex'; 
    }
}

function goBack() { 
    // 防坑机制：如果历史记录是隐藏的 scan，强制退回 tips 首页
    if (lastTab === 'scan' || !document.getElementById('page-' + lastTab)) {
        lastTab = 'tips';
    }
    switchTab(lastTab, document.querySelector(`.tab-item[onclick*="${lastTab}"]`)); 
}
// ==========================================
// 🔄 满血版 Tab 切换引擎 (高容错自愈)
// ==========================================
function switchMarketTab(type) {
    // 1. 同步全局状态（告诉过滤引擎我们切到哪个版块了）
    if (window.App) window.App.currentMarketTab = type;

    // 2. 切换 Tab 按钮的视觉高亮
    ['idle', 'help', 'partner'].forEach(t => {
        const btn = document.getElementById('tab-' + t) || document.getElementById('tabBtn' + t.charAt(0).toUpperCase() + t.slice(1));
        if (btn) {
            if (t === type) btn.classList.add('active'); // 或者你的高亮 class
            else btn.classList.remove('active');
        }
    });

    // 3. 切换内容容器的显示/隐藏（带自动纠错机制）
    ['idle', 'help', 'partner'].forEach(t => {
        // 尝试寻找你报错的旧 ID 容器
        let container = document.getElementById('market-' + t);
        
        // 🌟 如果找不到旧 ID（可能被误删），自动降级寻找内层的列表容器！
        if (!container) {
            if (t === 'idle') container = document.getElementById('idleWaterfall');
            if (t === 'help') container = document.getElementById('helpListContainer');
            if (t === 'partner') container = document.getElementById('partnerListContainer');
        }

        if (container) {
            if (t === type) {
                // 显示当前容器 (闲置瀑布流需要 grid，其他用 block)
                container.style.display = (t === 'idle') ? 'grid' : 'block';
                // 容错：如果有 hidden 类则移除
                if (container.classList && container.classList.contains('hidden')) {
                    container.classList.remove('hidden');
                }
            } else {
                // 隐藏非当前容器
                container.style.display = 'none';
            }
        }
    });

    // 4. 🌟 核心联动：切换完页面后，立刻呼叫引擎生成对应版块的高级筛选菜单！
    if (window.App && window.App.renderFilterBar) {
        window.App.renderFilterBar(type);
    }
}

// 确保挂载到全局，供 HTML 的 onclick 调用
if (typeof window !== 'undefined') {
    window.switchMarketTab = switchMarketTab;
    if (window.App) window.App.switchMarketTab = switchMarketTab;
}

// 渲染个人主页状态 (登录前/登录后)
function renderProfileState() {
    const guestBlock = document.getElementById('guestLoginBlock');
    const actionsBlock = document.getElementById('profileActions');
    const uidText = document.getElementById('profileUid');
    const nameText = document.getElementById('profileName');
    const creditBadge = document.getElementById('profileCreditBadge');
    
    if(!guestBlock) return;

    if (isLoggedIn) {
        guestBlock.style.display = 'none'; 
        actionsBlock.style.display = 'flex';
        uidText.innerText = 'ID: ' + userUUID.substring(0,8).toUpperCase();
        nameText.innerText = localStorage.getItem('hp_name') || '管家新人';
        
        let score = 500;
        if(localStorage.getItem('hp_email_verified') === 'true') score += 50; 
        
        creditBadge.innerText = score >= 550 ? `极佳 ${score}` : `良好 ${score}`; 
        creditBadge.style.display = 'inline-block';
        
        // 此处可补全您的详细标签渲染逻辑 (Mbti, 微信号等)
    } else {
        guestBlock.style.display = 'block'; 
        actionsBlock.style.display = 'none';
        uidText.innerText = 'ID: 未登录'; 
        nameText.innerText = '管家游客'; 
        creditBadge.style.display = 'none'; 
    }
}

// ============================================================================
// 🛡️ 架构师补丁：补齐丢失的 Profile (我的) 页面渲染函数
// ============================================================================

// 1. 渲染避雷足迹 (读取本地扫码历史)
window.renderFootprints = function() {
    const list = document.getElementById('footprintList');
    if (!list) return;
    
    try {
        const history = JSON.parse(localStorage.getItem('hp_scan_history') || '[]');
        if (history.length === 0) {
            list.innerHTML = '<div class="empty-state" style="text-align:center; padding: 40px 0; color: #9CA3AF;"><div style="font-size:32px; margin-bottom:10px;">👣</div>还没有扫码记录哦，快去扫一扫吧！</div>';
            return;
        }
        
        let html = '';
        history.forEach((item, index) => {
            // 兼容各种图片字段和兜底图
            const safeImg = item.image_url || item.img_src || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="%23F3F4F6"/><text x="50%" y="50%" font-family="sans-serif" font-size="10" fill="%239CA3AF" text-anchor="middle" dominant-baseline="middle">暂无图</text></svg>';
            
            html += `
            <div style="background:#FFF; border-radius:12px; margin-bottom:12px; display:flex; align-items:center; padding:12px; border:1px solid #E5E7EB; cursor:pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.02);" onclick="window.App ? window.App.openDetailsFromHistory(${index}) : null">
                <img src="${safeImg}" style="width:50px; height:50px; border-radius:8px; object-fit:cover; flex-shrink:0; background:#F3F4F6;" onerror="this.style.display='none'">
                <div style="margin-left:12px; flex:1;">
                    <div style="font-weight:900; font-size:14px; color:#111827;">${item.chinese_name || item.dutch_name || '未知商品'}</div>
                    <div style="font-size:12px; color:#9CA3AF; margin-top:4px;">${item.category || '未分类'}</div>
                </div>
            </div>`;
        });
        list.innerHTML = html;
    } catch (error) {
        console.error("渲染足迹失败:", error);
    }
};

// 2. 占位：防止点击“我的发布”和“收到评价”时也报错
window.renderMyPosts = window.renderMyPosts || function() { 
    const list = document.getElementById('myPostsList');
    if (list) list.innerHTML = '<div style="text-align:center; padding:40px 0; color:#9CA3AF;">这里将展示你发布的闲置，功能接入中...</div>';
};
// ============================================================================
// 🛡️ 架构师补丁：补齐“我的”页面底部 Asset Tabs 的切换逻辑
// ============================================================================
window.switchAssetTab = function(tabId, element) {
    try {
        // 1. 移除所有 Tab 的高亮状态
        document.querySelectorAll('.a-tab').forEach(el => el.classList.remove('active'));
        // 2. 隐藏所有的内容面板
        document.querySelectorAll('.asset-content').forEach(el => {
            el.style.display = 'none';
            el.classList.remove('active');
        });

        // 3. 激活当前点击的 Tab
        if (element) {
            element.classList.add('active');
        }
        
        // 4. 显示对应的目标内容面板
        const targetContent = document.getElementById('asset-' + tabId);
        if (targetContent) {
            targetContent.style.display = 'block';
            targetContent.classList.add('active');
        }

        // 5. 智能按需加载数据 (利用我们之前写好的占位函数)
        if (tabId === 'footprint' && typeof window.renderFootprints === 'function') {
            window.renderFootprints();
        } else if (tabId === 'posts' && typeof window.renderMyPosts === 'function') {
            window.renderMyPosts();
        } else if (tabId === 'reviews' && typeof window.renderMyReviews === 'function') {
            window.renderMyReviews();
        }
    } catch (error) {
        console.error("🚨 切换 Asset Tab 失败:", error);
    }
};
window.renderMyReviews = window.renderMyReviews || function() { 
    const list = document.getElementById('asset-reviews');
    if (list) list.innerHTML = '<div style="text-align:center; padding:40px 0; color:#9CA3AF;">这里将展示你收到的评价，功能接入中...</div>';
};

// ============================================================================
// 🗞️ 架构师高定：Pro 玩家 24h AI 新闻速报渲染引擎
// ============================================================================
window.renderProNews = async function() {
    const container = document.getElementById('proNewsList'); 
    if (!container) return;

    // 1. 极客感拉满的 AI 抓取骨架屏 (加载状态)
    container.innerHTML = `
        <div style="padding: 30px 0; text-align: center; color: #64748B; font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 10px;">
            <div style="display: flex; gap: 4px;">
                <span class="pulse-dot" style="background: #3B82F6; animation-delay: 0s;"></span>
                <span class="pulse-dot" style="background: #3B82F6; animation-delay: 0.2s;"></span>
                <span class="pulse-dot" style="background: #3B82F6; animation-delay: 0.4s;"></span>
            </div>
            <span>DeepSeek 正在从荷兰媒体抓取并翻译...</span>
        </div>
    `;

    try {
        // 2. 呼叫我们刚才在 Vercel 部署的后端 API
        const res = await fetch('/api/get-news');
        const result = await res.json();

        if (result.success && result.data && result.data.length > 0) {
            let html = '';
            
            // 3. 渲染精致的时间轴 (TimeLine)
            result.data.forEach((news, index) => {
                const isLast = index === result.data.length - 1;
                // 🔥 热点标签
                const hotBadge = news.hot ? `<span style="background: linear-gradient(135deg, #FEF2F2, #FEE2E2); color: #DC2626; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-right: 6px; font-weight: 900; border: 1px solid #FECACA;">🔥 爆</span>` : '';
                
                html += `
                <div style="display: flex; gap: 15px; align-items: flex-start; position: relative; margin-bottom: ${isLast ? '0' : '16px'};">
                    <div style="display: flex; flex-direction: column; align-items: center; min-width: 40px;">
                        <div style="font-size: 12px; color: #64748B; font-weight: 900; margin-bottom: 4px;">${news.time}</div>
                        ${!isLast ? `<div style="width: 2px; height: 100%; background: #E2E8F0; position: absolute; top: 22px; left: 19px; z-index: 1;"></div>` : ''}
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: ${news.hot ? '#EF4444' : '#CBD5E1'}; position: relative; z-index: 2; box-shadow: 0 0 0 3px #FFF;"></div>
                    </div>
                    
                    <div style="flex: 1; padding-bottom: ${isLast ? '0' : '10px'};">
                        <div style="font-size: 13px; color: #1E293B; line-height: 1.6; font-weight: 500;">
                            ${hotBadge}<span style="color: #3B82F6; font-weight: 900; margin-right: 4px;">[${news.tag}]</span>${news.content}
                        </div>
                    </div>
                </div>`;
            });
            container.innerHTML = `<div style="padding: 15px 0 5px 0;">${html}</div>`;
        } else {
            throw new Error("No data returned");
        }
    } catch (e) {
        console.error("新闻拉取失败:", e);
        container.innerHTML = `<div style="text-align:center; padding:30px 0; color:#EF4444; font-size:13px;">📡 信号中断，未能连接到荷兰新闻塔</div>`;
    }
};

// ============================================================================
// 📦 架构师高定：闲置交易发布引擎 (多图压缩 + 结构化数据打包)
// ============================================================================

window.idleImages = []; // 闲置图片暂存区
window.isPublishingIdle = false; // 防连击锁

// 1. 黑科技：前端极限压缩引擎 (必加，防止 17 秒卡顿重演)
window.compressImage = function(file, maxWidth, maxHeight, quality) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = function() {
                let width = img.width, height = img.height;
                if (width > height && width > maxWidth) { height = Math.round(height * maxWidth / width); width = maxWidth; }
                else if (height > width && height > maxHeight) { width = Math.round(width * maxHeight / height); height = maxHeight; }
                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality)); 
            };
        };
    });
};

// 2. 丝滑的多图选择与预览
window.handleMultiImageSelect = async function(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const container = document.getElementById('idleImgPreviewContainer');
    const uploadBtn = container.querySelector('.upload-btn');
    
    // 强行把预览区改为横向滑动 (小红书风格)
    container.style.display = 'flex';
    container.style.gap = '10px';
    container.style.overflowX = 'auto';
    container.style.paddingBottom = '5px';

    if (window.App && window.App.showToast) window.App.showToast("⏳ 正在处理高清照片...", "info");

    for (let i = 0; i < files.length; i++) {
        try {
            const compressedBase64 = await window.compressImage(files[i], 800, 800, 0.8);
            window.idleImages.push(compressedBase64);

            const imgDiv = document.createElement('div');
            imgDiv.style.cssText = 'width: 90px; height: 90px; border-radius: 8px; overflow: hidden; position: relative; border: 1px solid #E5E7EB; flex-shrink: 0;';
            imgDiv.innerHTML = `
                <img src="${compressedBase64}" style="width: 100%; height: 100%; object-fit: cover;">
                <div style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.5); color: #FFF; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer;" 
                     onclick="this.parentElement.remove(); window.idleImages.splice(${window.idleImages.length - 1}, 1);">✕</div>
            `;
            container.insertBefore(imgDiv, uploadBtn);
        } catch(e) { console.error("图片处理失败", e); }
    }
};

// ============================================================================
// 🔐 架构师补丁：修复登录状态不同步与 UI 渲染问题
// ============================================================================

// 1. 实时读取本地存储，不再依赖死板的全局变量
window.renderProfileState = function() {
    const guestBlock = document.querySelector('.guest-login-block'); // 未登录横幅
    const nameText = document.querySelector('.p-info div:nth-child(1)'); // 昵称
    const uidText = document.querySelector('.p-info div:nth-child(2) span:nth-child(1)'); // ID
    const avatar = document.querySelector('.p-avatar'); // 头像
    const levelBadge = document.querySelector('.p-info div:nth-child(2) span:nth-child(2)'); // 等级标签
    
    if(!nameText) return;

    // 🌟 核心：每次都实时从浏览器的记忆库里掏数据！
    const isRealLoggedIn = localStorage.getItem('hebao_logged_in') === 'true';
    const realUUID = localStorage.getItem('hebao_uuid') || '';
    const realName = localStorage.getItem('hp_name') || '荷包蛋';

    if (isRealLoggedIn) {
        if (guestBlock) guestBlock.style.display = 'none'; 
        nameText.innerText = realName;
        if (uidText) uidText.innerText = 'ID: ' + realUUID.substring(0,8).toUpperCase();
        if (avatar) avatar.innerText = '😎'; 
        if (avatar) avatar.style.border = '3px solid #10B981'; // 登录后给个绿色光环
        if (levelBadge) levelBadge.innerText = 'Lv.1';
    } else {
        if (guestBlock) guestBlock.style.display = 'flex'; 
        nameText.innerText = '荷包蛋'; 
        if (uidText) uidText.innerText = 'ID: 未登录'; 
        if (avatar) avatar.innerText = '👻';
        if (avatar) avatar.style.border = '3px solid #FFF';
        if (levelBadge) levelBadge.innerText = 'Lv.0';
    }
};

// 2. 拦截并重写验证引擎：验证成功后直接硬刷新！
window.App = window.App || {};
window.App.verifyCode = async function() {
    const email = document.getElementById('hebaoAuthEmail').value.trim();
    const code = document.getElementById('hebaoAuthCode').value.trim();
    if(!email || !code) return window.App.showToast("邮箱和验证码不能为空哦！", "warning");
    
    window.App.showToast("⏳ 正在验证您的身份...", "info");
    const btn = document.getElementById('btnLogin');
    if(btn) { btn.innerText = "验证中..."; btn.style.pointerEvents = 'none'; }
    
    try {
        // 呼叫你的 Vercel 后端接口
        const res = await fetch('/api/verify-auth-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
        });
        const data = await res.json();
        
        if(data.success) {
            // 🌟 核心：把 VIP 身份牌死死钉进本地存储里
            localStorage.setItem('hebao_token', data.token);
            localStorage.setItem('hebao_logged_in', 'true');
            localStorage.setItem('hebao_uuid', data.user ? data.user.id : Date.now().toString());
            localStorage.setItem('hp_name', (data.user && data.user.name) ? data.user.name : email.split('@')[0]);
            
            if(email.endsWith('.edu') || email.endsWith('.nl')) {
                localStorage.setItem('hp_email_verified', 'true');
            }
            
            window.App.showToast("✅ 登录成功！正在为您生成专属身份...", "success");
            window.App.closeModal('loginModal');
            
            // 💥 终极大招：硬刷新！让整个 App 带上 Token 重新开机！
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            window.App.showToast(data.error || "验证码可能过期或错误哦", "error");
        }
    } catch (e) {
        console.error("验证失败:", e);
        window.App.showToast("🚨 网络拥堵，请稍后再试", "error");
    } finally {
        if(btn) { btn.innerText = "立即验证"; btn.style.pointerEvents = 'auto'; }
    }
};

// 胶囊单选切换逻辑
function togglePublishCapsule(clickedEl) {
    // 找到同一组内的所有胶囊
    const parent = clickedEl.parentElement;
    const allCapsules = parent.querySelectorAll('.publish-capsule');
    
    // 移除其他人的 active
    allCapsules.forEach(el => el.classList.remove('active'));
    
    // 给自己加上 active
    clickedEl.classList.add('active');
}

// 商业化：十万火急卡片切换逻辑
function selectUrgentLevel(level) {
    const cardNormal = document.getElementById('cardNormal');
    const cardUrgent = document.getElementById('cardUrgent');
    const urgentCheck = document.getElementById('urgentCheck');

    if (level === 'normal') {
        cardNormal.classList.add('active-normal');
        cardUrgent.classList.remove('active-urgent');
        cardNormal.querySelector('div:last-child').innerText = '✅';
        urgentCheck.innerText = '⭕️';
        urgentCheck.style.opacity = '0.3';
    } else {
        cardNormal.classList.remove('active-normal');
        cardUrgent.classList.add('active-urgent');
        cardNormal.querySelector('div:last-child').innerText = '⭕️';
        urgentCheck.innerText = '✅';
        urgentCheck.style.opacity = '1';
    }
}

// 3. 每次切换到“我的”页面，主动唤醒一次渲染
const originalSwitchTabAuth = window.switchTab;
window.switchTab = function(tabId, element) {
    if (originalSwitchTabAuth) originalSwitchTabAuth(tabId, element);
    if (tabId === 'profile') {
        window.renderProfileState();
    }
};

// 4. 开机自启：页面刚加载时立刻渲染一次
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.renderProfileState();
    }, 200);
});

// ============================================================================
// 📦 拦截并接管 Profile 页面的 Tab 切换逻辑
// ============================================================================
window.switchAssetTab = function(tabId, element) {
    // 1. 切换高亮 UI
    document.querySelectorAll('.a-tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.asset-content').forEach(el => el.style.display = 'none');
    element.classList.add('active');
    
    const targetContent = document.getElementById('asset-' + tabId);
    if(targetContent) targetContent.style.display = 'block';

    // 2. 🌟 如果点的是“我的发布”，自动触发我们刚写的拉取引擎！
    if (tabId === 'posts' && window.App && window.App.loadMyPosts) {
        window.App.loadMyPosts();
    }
    
    // 3. 避雷足迹的占位提示
    if (tabId === 'footprint') {
        const fp = document.getElementById('footprintList');
        if(fp && !fp.innerHTML.includes('暂无')) fp.innerHTML = '<div style="text-align:center; padding:40px 0; color:#9CA3AF;">暂无扫码避雷记录</div>';
    }
};

// ============================================================================
// 🚀 发布抽屉 (Publish Sheet) 内部控制逻辑
// ============================================================================

window.App = window.App || {};

// 1. 版块切换逻辑
window.App.switchPublishTab = function(type) {
    // 切换 Tab 视觉
    document.querySelectorAll('.pub-tab').forEach(el => {
        el.style.background = 'transparent';
        el.style.color = '#64748B';
        el.style.boxShadow = 'none';
        el.classList.remove('active');
    });
    
    const activeTab = document.getElementById('pubTab' + type.charAt(0).toUpperCase() + type.slice(1));
    if (activeTab) {
        activeTab.style.background = '#FFF';
        activeTab.style.color = '#111827';
        activeTab.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        activeTab.classList.add('active');
    }

    // 动态修改标题
    const titleEl = document.getElementById('publishModalTitle');
    if (type === 'idle') titleEl.innerText = '发布闲置物品';
    if (type === 'help') titleEl.innerText = '发布求助悬赏';
    if (type === 'partner') titleEl.innerText = '发起搭子组局';

    // (后续可以在这里写逻辑：如果是 idle，就隐藏 help 的表单，显示 idle 的表单)
};

// 2. 胶囊单选切换逻辑
window.App.togglePublishCapsule = function(clickedEl) {
    const parent = clickedEl.parentElement;
    const allCapsules = parent.querySelectorAll('.publish-capsule');
    allCapsules.forEach(el => el.classList.remove('active'));
    clickedEl.classList.add('active');
};

// 3. 商业化：十万火急卡片切换逻辑
window.App.selectUrgentLevel = function(level) {
    const cardNormal = document.getElementById('cardNormal');
    const cardUrgent = document.getElementById('cardUrgent');
    const urgentCheck = document.getElementById('urgentCheck');

    if (level === 'normal') {
        cardNormal.classList.add('active-normal');
        cardUrgent.classList.remove('active-urgent');
        cardNormal.querySelector('div:last-child').innerText = '✅';
        urgentCheck.innerText = '⭕️';
        urgentCheck.style.opacity = '0.3';
    } else {
        cardNormal.classList.remove('active-normal');
        cardUrgent.classList.add('active-urgent');
        cardNormal.querySelector('div:last-child').innerText = '⭕️';
        urgentCheck.innerText = '✅';
        urgentCheck.style.opacity = '1';
    }
};

// 4. 重写唤起逻辑，确保每次打开默认切到“悬赏”并且鉴权
const originalOpenPublishSheet = window.App.openPublishSheet;
window.App.openPublishSheet = function() {
    // 强制鉴权
    if (localStorage.getItem('hebao_logged_in') !== 'true') {
        if(window.App.showToast) window.App.showToast("发帖前需要先登录并完成实名认证哦！", "warning");
        setTimeout(() => { window.App.openModal('loginModal'); }, 500);
        return;
    }
    
    // 调用 main-4.js 里原生的炫酷滑出动画
    if (originalOpenPublishSheet) {
        originalOpenPublishSheet();
        // 默认激活悬赏 Tab
        window.App.switchPublishTab('help');
    }
};
