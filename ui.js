// ui.js - 视图层控制，包含 Tab 切换和弹窗逻辑

let lastTab = 'tips'; 

function toggleScanMenu() {
    const fab = document.getElementById('mainScanFab');
    fab.classList.toggle('active');
}

function switchTab(tabId, element) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('page-' + tabId); 
    if(target) target.classList.add('active');
    
    // 如果是点击了底部的真实 Tab 按钮，记录下来方便 goBack 返回
    if (element) { 
        document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active')); 
        element.classList.add('active'); 
        if (tabId !== 'details' && tabId !== 'trending') lastTab = tabId; 
    }
    
    const tabBar = document.querySelector('.tab-bar');
    const chatBar = document.getElementById('stickyChatBar');
    
    // 🌟 核心优化：进入详情页或红黑榜时，隐藏底部导航栏！
    if (tabId === 'details' || tabId === 'trending') { 
        if(tabBar) tabBar.style.display = 'none'; 
    } else { 
        if(tabBar) tabBar.style.display = 'flex'; 
    }

    if (tabId === 'details') {
        if(chatBar) chatBar.style.display = 'flex';
    } else {
        if(chatBar) chatBar.style.display = 'none';
    }
    
    if (tabId === 'profile') { renderFootprints(); renderProfileState(); }
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
