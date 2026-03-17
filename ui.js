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
function switchMarketTab(type, element) { 
    document.querySelectorAll('.market-content').forEach(el => el.classList.remove('active')); 
    document.getElementById('market-' + type).classList.add('active'); 
    document.querySelectorAll('.m-tab').forEach(el => el.classList.remove('active')); 
    if(element) element.classList.add('active'); 
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
// 🚀 架构师补丁：集市四大金刚发布引擎 (闲置、悬赏、搭子、问答)
// ============================================================================

// ============================================================================
// 📸 架构师高定：小红书级图文发布与交互闭环系统
// ============================================================================

window.questionImages = []; 
window.tempPostStore = window.tempPostStore || {}; // 全局暂存刚刚发布的帖子数据

window.handleQuestionImageSelect = function(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const container = document.getElementById('questionImgPreviewContainer');
    const uploadBtn = document.getElementById('questionUploadBtn');
    
    for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = function(e) {
            window.questionImages.push(e.target.result); 
            const imgDiv = document.createElement('div');
            imgDiv.style.cssText = 'width: 90px; height: 90px; border-radius: 12px; overflow: hidden; position: relative; border: 1px solid #E5E7EB;';
            imgDiv.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">
                <div style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.5); color: #FFF; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer;" onclick="this.parentElement.remove(); window.questionImages.splice(${window.questionImages.length - 1}, 1);">✕</div>`;
            container.insertBefore(imgDiv, uploadBtn);
        };
        reader.readAsDataURL(files[i]);
    }
};

window.submitQuestionPost = function() {
    try {
        const title = document.getElementById('questionTitle') ? document.getElementById('questionTitle').value.trim() : '';
        const desc = document.getElementById('questionDesc') ? document.getElementById('questionDesc').value.trim() : '';
        if (!title || !desc) return window.App.showToast("标题和正文都不能为空哦！", "warning");

        const listContainer = document.getElementById('questionListContainer');
        if (listContainer) {
            const myName = localStorage.getItem('hp_name') || '管家新人';
            const postId = 'post_' + Date.now(); // 生成唯一帖子 ID
            
            // 🌟 核心：将帖子数据存入临时大脑
            window.tempPostStore[postId] = { title, desc, author: myName, avatar: '👻', images: [...window.questionImages] };

            let imgHtml = '';
            if (window.questionImages.length > 0) {
                imgHtml = `<div style="display:flex; gap:8px; margin-top:12px; margin-bottom:8px; overflow-x:auto; padding-bottom:5px;">`;
                window.questionImages.forEach(img => { imgHtml += `<img src="${img}" style="width: 110px; height: 110px; border-radius: 8px; object-fit: cover; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">`; });
                imgHtml += `</div>`;
            }

            // 🌟 核心：给卡片加上 onclick 跳转详情页的指令
            const newCardHtml = `
            <div class="question-card" onclick="window.openQuestionDetail('${postId}')" style="cursor: pointer; border: 2px solid #10B981; background: #FFF; border-radius: 16px; padding: 15px; margin-bottom: 15px; box-shadow: 0 6px 15px rgba(16, 185, 129, 0.1);">
                <div class="qc-title" style="font-size: 16px; font-weight: 900; color: #111827; margin-bottom: 8px;">${title} <span style="background: linear-gradient(135deg, #34D399, #10B981); color: #FFF; font-size: 10px; padding: 2px 6px; border-radius: 6px; margin-left: 4px;">🆕 刚发布</span></div>
                <div class="qc-desc" style="font-size: 14px; color: #475569; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${desc}</div>
                ${imgHtml}
                <div class="qc-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 12px; border-top: 1px solid #F1F5F9;">
                    <div class="qc-user" style="font-size: 12px; color: #64748B; display:flex; align-items:center; gap:6px; font-weight: bold;"><span style="font-size:20px;">👻</span> <span>${myName}</span></div>
                    <div class="qc-answer-btn" style="color: #10B981; font-weight: 900; font-size: 13px; background: #ECFDF5; padding: 6px 12px; border-radius: 20px;">✍️ 抢首答</div>
                </div>
            </div>`;
            listContainer.insertAdjacentHTML('afterbegin', newCardHtml);
        }

        window.App.showToast("✅ 发布成功！", "success");
        window.App.closeModal('publishQuestionModal');
        if (document.getElementById('questionTitle')) document.getElementById('questionTitle').value = '';
        if (document.getElementById('questionDesc')) document.getElementById('questionDesc').value = '';
        window.questionImages = []; 
        const previewContainer = document.getElementById('questionImgPreviewContainer');
        if(previewContainer) { Array.from(previewContainer.children).forEach(child => { if(child.id !== 'questionUploadBtn' && child.tagName !== 'INPUT') child.remove(); }); }
        if (window.switchTab) window.switchTab('market');
        if (window.switchMarketTab) { const tabs = document.querySelectorAll('.m-tab'); if (tabs.length >= 4) window.switchMarketTab('question', tabs[3]); }
    } catch (e) { console.error("发布问题出错:", e); }
};

// ============================================================================
// 📖 帖子详情页渲染与评论引擎
// ============================================================================

window.openQuestionDetail = function(postId) {
    const post = window.tempPostStore[postId];
    if (!post) return window.App.showToast('帖子数据走丢了', 'error');
    
    window.App.injectIfNeeded('questionDetailModal');
    
    // 渲染文案
    document.getElementById('qdTitle').innerText = post.title;
    document.getElementById('qdDesc').innerText = post.desc;
    document.getElementById('qdAuthor').innerText = post.author;
    document.getElementById('qdAvatar').innerText = post.avatar;
    
    // 渲染大图画廊 (支持横向滑动)
    const imgContainer = document.getElementById('qdImageContainer');
    if (post.images && post.images.length > 0) {
        let imgHtml = '';
        post.images.forEach(img => {
            imgHtml += `<img src="${img}" style="width: 100%; max-height: 400px; object-fit: contain; flex: 0 0 100%; scroll-snap-align: start; background: #F8FAFC;">`;
        });
        imgContainer.innerHTML = imgHtml;
        imgContainer.style.display = 'flex';
    } else {
        imgContainer.style.display = 'none';
    }
    
    // 重置评论区
    document.getElementById('qdCommentList').innerHTML = '<div style="text-align:center; color:#9CA3AF; padding: 40px 0; font-size:13px;" id="qdEmptyState">暂无回复，快来抢沙发！</div>';
    document.getElementById('qdCommentCount').innerText = '0';
    document.getElementById('qdCommentInput').value = '';
    
    // 弹出
    window.App.openModal('questionDetailModal');
};

window.submitQuestionComment = function() {
    const input = document.getElementById('qdCommentInput');
    const text = input.value.trim();
    if (!text) return window.App.showToast('写点什么再发送吧', 'warning');
    
    const list = document.getElementById('qdCommentList');
    const empty = document.getElementById('qdEmptyState');
    if (empty) empty.remove();
    
    const myName = localStorage.getItem('hp_name') || '管家热心网友';
    const html = `
    <div style="display: flex; gap: 12px; margin-bottom: 24px; animation: pageFadeIn 0.3s;">
        <div style="font-size: 24px; width: 36px; height: 36px; background: #F1F5F9; border-radius: 50%; display: flex; justify-content: center; align-items: center;">😎</div>
        <div style="flex: 1;">
            <div style="font-size: 13px; color: #64748B; font-weight: 900; margin-bottom: 4px;">${myName}</div>
            <div style="font-size: 14px; color: #1E293B; line-height: 1.6;">${text}</div>
            <div style="font-size: 11px; color: #94A3B8; margin-top: 8px;">刚刚回复</div>
        </div>
        <div style="font-size: 16px; color: #CBD5E1; cursor: pointer;" onclick="this.style.color='#F43F5E'; this.innerText='♥️'">♡</div>
    </div>`;
    
    list.insertAdjacentHTML('afterbegin', html);
    input.value = '';
    
    const countEl = document.getElementById('qdCommentCount');
    countEl.innerText = parseInt(countEl.innerText) + 1;
    
    window.App.showToast('回复成功！', 'success');
};
window.submitIdlePost = function() {
    window.App.showToast("✅ 闲置发布成功！信用分 +5", "success");
    window.App.closeModal('publishIdleModal');
    if (window.switchTab) window.switchTab('market');
    if (window.switchMarketTab) window.switchMarketTab('idle', document.querySelectorAll('.m-tab')[0]);
};

window.submitHelpPost = function() {
    window.App.showToast("✅ 悬赏发布成功！已向周围校友发送广播", "success");
    window.App.closeModal('publishHelpModal');
    if (window.switchTab) window.switchTab('market');
    if (window.switchMarketTab) window.switchMarketTab('help', document.querySelectorAll('.m-tab')[1]);
};

window.submitPartnerPost = function() {
    window.App.showToast("✅ 找搭子发布成功！祝你早日找到灵魂伴侣🥂", "success");
    window.App.closeModal('publishPartnerModal');
    if (window.switchTab) window.switchTab('market');
    if (window.switchMarketTab) window.switchMarketTab('partner', document.querySelectorAll('.m-tab')[2]);
};
