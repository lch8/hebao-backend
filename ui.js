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

// 🌟 真实后端对接：发布帖子
window.submitQuestionPost = async function() {
    try {
        const title = document.getElementById('questionTitle') ? document.getElementById('questionTitle').value.trim() : '';
        const desc = document.getElementById('questionDesc') ? document.getElementById('questionDesc').value.trim() : '';
        if (!title || !desc) return window.App.showToast("标题和正文都不能为空哦！", "warning");

        // 变成加载状态，防止用户重复点击
        window.App.showToast("⏳ 正在上传发送中...", "info");
        
        const myName = localStorage.getItem('hp_name') || '管家新人';
        const myAvatar = '👻';

        // ⚠️ 第一步：如果你有真正的图床 API，在这里先上传 window.questionImages
        // 假设上传后返回了真实的 URL 数组：
        let uploadedImageUrls = []; 
        /* if (window.questionImages.length > 0) {
            uploadedImageUrls = await uploadImagesToVercelBlob(window.questionImages);
        }
        */
        // (测试阶段，如果还没图床，我们暂时传空数组，或者强行传 base64 测一下)
        uploadedImageUrls = window.questionImages; 

        // 🌟 第二步：组装要发给 Turso API 的数据
        const postPayload = {
            title: title,
            desc: desc,
            author: myName,
            avatar: myAvatar,
            images: JSON.stringify(uploadedImageUrls), // 把数组转成字符串存入 Turso
            type: 'question' // 告诉后端这是个问答帖
        };

        // 🚀 第三步：调用你的 Vercel + Turso API
        const response = await fetch('/api/create-post', { // 👉 换成你实际的 API 路由
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postPayload)
        });

        const result = await response.json();
        
        if (result.success) {
            window.App.showToast("✅ 发布成功！", "success");
            window.App.closeModal('publishQuestionModal');
            
            // 打扫战场
            document.getElementById('questionTitle').value = '';
            document.getElementById('questionDesc').value = '';
            window.questionImages = []; 
            document.getElementById('questionImgPreviewContainer').innerHTML = `
                <input type="file" id="questionImgInput" accept="image/*" multiple style="display: none;" onchange="window.handleQuestionImageSelect(event)">
                <div id="questionUploadBtn" style="width: 90px; height: 90px; background: #F8FAFC; border-radius: 12px; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #94A3B8; cursor: pointer; border: 1px dashed #CBD5E1; transition: all 0.2s;" onclick="document.getElementById('questionImgInput').click()"><span style="font-size: 32px; margin-bottom: 2px; font-weight: 300;">+</span><span style="font-size: 11px;">照片/截图</span></div>
            `;
            
            // 触发重新从服务器拉取最新列表
            if (window.fetchMarketQuestions) window.fetchMarketQuestions();
        } else {
            throw new Error(result.error || "服务器错误");
        }

    } catch (e) { 
        console.error("发布问题出错:", e); 
        window.App.showToast("🚨 发布失败: " + e.message, "error");
    }
};

// ============================================================================
// 📖 帖子详情页渲染与评论引擎
// ============================================================================

// 🌟 真实后端对接：从 Turso 拉取帖子列表
window.fetchMarketQuestions = async function() {
    const container = document.getElementById('questionListContainer');
    if (!container) return;
    
    // 显示高级加载骨架屏
    container.innerHTML = '<div style="text-align:center; padding: 40px 0; color: #9CA3AF;"><span class="pulse-dot" style="background:#10B981;"></span> 正在从服务器拉取最新帖子...</div>';

    try {
        // 🚀 调用你的 Vercel + Turso API (查询帖子)
        const response = await fetch('/api/get-posts?type=question'); // 👉 换成你的 API
        const result = await response.json();

        if (result.success && result.data) {
            let html = '';
            
            // 假设后端返回的数据按照时间倒序排列
            result.data.forEach(post => {
                // 还原存入 Turso 的图片 JSON 字符串
                let images = [];
                try { images = JSON.parse(post.images || '[]'); } catch(e) {}

                let imgHtml = '';
                if (images.length > 0) {
                    imgHtml = `<div style="display:flex; gap:8px; margin-top:12px; margin-bottom:8px; overflow-x:auto; padding-bottom:5px;">`;
                    images.forEach(img => { imgHtml += `<img src="${img}" style="width: 110px; height: 110px; border-radius: 8px; object-fit: cover; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">`; });
                    imgHtml += `</div>`;
                }

                // 🌟 注意：这里把帖子的整块数据转成 JSON 存入 onClick，方便详情页直接读取，不用再发一次网络请求！
                const postDataStr = encodeURIComponent(JSON.stringify({...post, images}));

                html += `
                <div class="question-card" onclick="window.openQuestionDetailFromAPI('${postDataStr}')" style="cursor: pointer; border: 1px solid #E5E7EB; background: #FFF; border-radius: 16px; padding: 15px; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.03);">
                    <div class="qc-title" style="font-size: 16px; font-weight: 900; color: #111827; margin-bottom: 8px;">${post.title}</div>
                    <div class="qc-desc" style="font-size: 14px; color: #475569; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${post.desc}</div>
                    ${imgHtml}
                    <div class="qc-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 12px; border-top: 1px solid #F1F5F9;">
                        <div class="qc-user" style="font-size: 12px; color: #64748B; display:flex; align-items:center; gap:6px; font-weight: bold;"><span style="font-size:20px;">${post.avatar || '👻'}</span> <span>${post.author}</span></div>
                        <div class="qc-answer-btn" style="color: #64748B; font-weight: 900; font-size: 13px; background: #F1F5F9; padding: 6px 12px; border-radius: 20px;">💬 评论</div>
                    </div>
                </div>`;
            });
            
            container.innerHTML = html || '<div style="text-align:center; padding: 40px 0; color: #9CA3AF;">暂无帖子，快来发布第一条吧！</div>';
        }
    } catch (error) {
        console.error("拉取帖子失败:", error);
        container.innerHTML = '<div style="text-align:center; padding: 40px 0; color: #EF4444;">🚨 网络信号不佳，拉取失败</div>';
    }
};

// 3. 打开真实详情页
window.openQuestionDetailFromAPI = function(encodedPostData) {
    const post = JSON.parse(decodeURIComponent(encodedPostData));
    window.currentDetailPostId = post.id;
    window.currentReplyTarget = null;
    
    window.App.injectIfNeeded('questionDetailModal');
    document.getElementById('qdTitle').innerText = post.title;
    document.getElementById('qdDesc').innerText = post.desc;
    document.getElementById('qdAuthor').innerText = post.author;
    document.getElementById('qdAvatar').innerText = post.avatar || '👻';
    
    const imgContainer = document.getElementById('qdImageContainer');
    if (post.images && post.images.length > 0) {
        let imgHtml = '';
        post.images.forEach(img => { imgHtml += `<img src="${img}" style="width: 100%; max-height: 400px; object-fit: contain; flex: 0 0 100%; scroll-snap-align: start; background: #F8FAFC;">`; });
        imgContainer.innerHTML = imgHtml;
        imgContainer.style.display = 'flex';
    } else { imgContainer.style.display = 'none'; }
    
    // 这里未来也要改成从 API 拉取评论: fetch('/api/get-comments?postId=' + post.id)
    window.renderQuestionComments(); 
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
