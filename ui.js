// ui.js - 视图层控制，包含 Tab 切换和弹窗逻辑

let lastTab = 'scan'; 

function toggleScanMenu() {
    const fab = document.getElementById('mainScanFab');
    fab.classList.toggle('active');
}

function switchTab(tabId, element) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('page-' + tabId);
    if(target) target.classList.add('active');

    // 🌟 逻辑优化：如果是首页（红宝书）或集市，显示悬浮按钮；在个人中心隐藏它
    const fab = document.getElementById('mainScanFab');
    if (tabId === 'profile' || tabId === 'details') {
        fab.style.display = 'none';
    } else {
        fab.style.display = 'flex';
    }
    
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

function goBack() { switchTab(lastTab, document.querySelector(`.tab-item[onclick*="${lastTab}"]`)); }

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
