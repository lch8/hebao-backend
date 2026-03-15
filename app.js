// ============================================================================
// app.js - 仅保留系统级轻量 API (终极清爽版)
// ============================================================================

// ================= 🌟 1. 全局 JIT 弹窗桥接器 =================
window.safeGetModal = function(modalId) {
    if (!document.getElementById(modalId)) {
        if (window.App && window.App.injectIfNeeded) window.App.injectIfNeeded(modalId);
    }
    return document.getElementById(modalId);
};
function showToast(msg, type) { if(window.App && window.App.showToast) window.App.showToast(msg, type); }
function openLightbox(imgSrc) {
    const lightbox = document.getElementById('imageLightbox'); const lightboxImg = document.getElementById('lightboxImg');
    if (!lightbox || !imgSrc || imgSrc.includes('data:image/svg')) return;
    lightboxImg.src = imgSrc; lightbox.style.display = 'flex';
}
function closeLightbox() { document.getElementById('imageLightbox').style.display = 'none'; }

// ================= 🌟 2. 榜单页逻辑 (巧妙借用历史记录接口) =================
let globalTrendingLikes = []; let globalTrendingDislikes = [];
async function loadTrendingToHome() {
    try {
        const res = await fetch('/api/trending'); const data = await res.json();
        if(data.success) { 
            globalTrendingLikes = data.topLikes || []; globalTrendingDislikes = data.topDislikes || []; 
            renderHomeTrending(globalTrendingLikes, 'homeTrendingListLikes', 'like'); renderHomeTrending(globalTrendingDislikes, 'homeTrendingListDislikes', 'dislike'); 
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
        html += `<div class="trending-card" onclick="openDetailsFromHomeTrending('${type}', ${index})"><div class="rank-badge ${badgeClass}">TOP ${index + 1}</div><img src="${safeImg}" onerror="this.onerror=null; this.src='${fallbackSvg}'" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; background: #F3F4F6; border: 1px solid #E5E7EB;"><div class="t-info"><div class="t-name">${item.chinese_name || '未命名'}</div><div style="font-size: 11px; color: #9CA3AF; margin-top:2px;">${item.dutch_name || ''}</div></div><div class="t-score" style="color: ${scoreColor}">${icon} ${score}</div></div>`;
    });
    container.innerHTML = html;
}
// 🎯 极其巧妙的修复：点击卡片时，悄悄把它塞进历史足迹，然后唤起无敌防崩的 ScannerEngine！
window.openDetailsFromHomeTrending = function(type, index) {
    const data = type === 'like' ? globalTrendingLikes[index] : globalTrendingDislikes[index];
    if (!data) return;
    let h = JSON.parse(localStorage.getItem('hebao_history') || '[]');
    if (!h.find(i => i.dutch_name === data.dutch_name)) { h.unshift(data); localStorage.setItem('hebao_history', JSON.stringify(h)); }
    const newIndex = h.findIndex(i => i.dutch_name === data.dutch_name);
    if (window.App && window.App.openDetailsFromHistory) window.App.openDetailsFromHistory(newIndex);
};

// ================= 🌟 3. Pro 新闻引擎 =================
async function renderProNews() {
    const newsContainer = document.getElementById('proNewsList'); if (!newsContainer) return;
    newsContainer.innerHTML = `<div style="text-align:center; padding: 30px 0; color:#9CA3AF; font-size: 13px;"><span class="pulse-dot" style="display:inline-block; background:#6366F1;"></span> 全自动 AI 爬虫正在提炼今日大事件...</div>`;
    try {
        const res = await fetch('/api/get-news'); const data = await res.json();
        if (!data.success || !data.news || data.news.length === 0) throw new Error("暂无新闻");
        let html = ''; data.news.forEach(item => {
            html += `<div class="news-item" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 18px 16px; margin-bottom: 15px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: transform 0.2s;"><div style="display:flex; justify-content:space-between; align-items:center;"><div style="display:flex; gap:8px; align-items:center;"><span style="font-size:11px; background:${item.tagColor}25; color:${item.tagColor}; padding:3px 8px; border-radius:6px; border:1px solid ${item.tagColor}50; font-weight:900;">${item.tag}</span><span style="font-size:12px; color:#9CA3AF; font-weight:bold;">${item.time}</span></div><span style="font-size:11px; color:#6B7280; font-weight:bold;">源自 ${item.source}</span></div><div style="font-size:15px; font-weight:900; color:#F9FAFB; line-height:1.5;">${item.title}</div><div style="background: rgba(0,0,0,0.3); padding:12px 14px; border-radius:10px; border-left:4px solid #6366F1; font-size:13px; color:#D1D5DB; line-height:1.6;"><span style="font-weight:900; color:#818CF8;">🤖 AI省流：</span>${item.aiSummary}</div></div>`;
        });
        newsContainer.innerHTML = html;
    } catch (error) {
        newsContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#9CA3AF; font-size:13px;">请前往阶段一开启 Vercel Cron 定时爬虫抓取新闻</div>`;
    }
}

// ================= 🌟 4. UI 简单切换指令 (供 HTML 调用) =================
window.switchAssetTab = function(tabId, element) { document.querySelectorAll('.a-tab').forEach(el => el.classList.remove('active')); element.classList.add('active'); document.querySelectorAll('.asset-content').forEach(el => el.classList.remove('active')); document.getElementById('asset-' + tabId).classList.add('active'); };
window.switchHomeTrendingTab = function(type, element) { document.querySelectorAll('#page-scan .t-tab').forEach(el => el.classList.remove('active')); if(element) element.classList.add('active'); document.getElementById('homeTrendingListLikes').style.display = type === 'likes' ? 'block' : 'none'; document.getElementById('homeTrendingListDislikes').style.display = type === 'dislikes' ? 'block' : 'none'; };
window.switchMarketTab = function(tabId, element) { document.querySelectorAll('.m-tab').forEach(el => el.classList.remove('active')); if(element) element.classList.add('active'); document.querySelectorAll('.market-content').forEach(el => el.classList.remove('active')); const target = document.getElementById('market-' + tabId); if(target) target.classList.add('active'); };

window.openPublishSheet = function() { safeGetModal('publishSheet'); const overlay = document.querySelector('.publish-overlay'); const sheet = document.querySelector('.publish-sheet'); if(overlay) { overlay.style.display = 'block'; setTimeout(()=>overlay.classList.add('show'),10); } if(sheet) { setTimeout(()=>sheet.classList.add('show'),10); } };
window.closePublishSheet = function() { const overlay = document.querySelector('.publish-overlay'); const sheet = document.querySelector('.publish-sheet'); if(sheet) sheet.classList.remove('show'); if(overlay) { overlay.classList.remove('show'); setTimeout(()=>overlay.style.display='none',300); } };
window.openIdlePublish = function() { closePublishSheet(); setTimeout(() => { safeGetModal('publishIdleModal').style.display = 'flex'; }, 300); };
window.closeIdlePublish = function() { document.getElementById('publishIdleModal').style.display = 'none'; };
window.openHelpPublish = function() { closePublishSheet(); setTimeout(() => { safeGetModal('publishHelpModal').style.display = 'flex'; }, 300); };
window.closeHelpPublish = function() { document.getElementById('publishHelpModal').style.display = 'none'; };
window.openPartnerPublish = function() { closePublishSheet(); setTimeout(() => { safeGetModal('publishPartnerModal').style.display = 'flex'; }, 300); };
window.closePartnerPublish = function() { document.getElementById('publishPartnerModal').style.display = 'none'; };
window.openQuestionPublish = function() { closePublishSheet(); setTimeout(() => { safeGetModal('publishQuestionModal').style.display = 'flex'; }, 300); };
window.closeQuestionPublish = function() { document.getElementById('publishQuestionModal').style.display = 'none'; };
window.clearAIInput = function(type) { const input = document.getElementById(`aiKeywords_${type}`); if (input) { input.value = ''; input.focus(); } };

// ================= 🌟 5. Profile 与 其他杂项 =================
window.openEmailVerifyModal = function() { safeGetModal('loginModal').style.display = 'flex'; };
window.openWechatBindModal = function() { safeGetModal('wechatBindModal').style.display = 'flex'; };
window.openEditProfileModal = function() { safeGetModal('editProfileModal').style.display = 'flex'; };
let currentCity = ""; let currentPostcode = "";
window.autoLocate = function(inputId) {
    const inputEl = document.getElementById(inputId); if (!navigator.geolocation) return showToast("不支持定位");
    inputEl.value = "定位中..."; 
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const { latitude, longitude } = pos.coords; const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=zh`);
            const data = await res.json(); currentCity = data.address.city || data.address.town || "荷兰"; currentPostcode = (data.address.postcode || "").replace(/\s+/g, '').substring(0, 4); 
            inputEl.value = currentCity;
        } catch (e) { inputEl.value = "获取失败"; }
    }, (err) => { inputEl.value = "权限拒绝"; }, { timeout: 10000 });
};

// ================= 全局系统启动 =================
window.addEventListener('DOMContentLoaded', () => { 
    if(typeof renderTipsPage === 'function') renderTipsPage(); 
    loadTrendingToHome(); 
    if(typeof renderProfileState === 'function') renderProfileState(); 
    renderProNews();
});
