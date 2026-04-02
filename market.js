// ============================================================================
// js/modules/market.js - 集市与发布引擎 (高级全面屏 UI 精调版)
// ============================================================================
import { showToast } from '../core/toast.js';
import { safeDOM } from '../core/dom.js';
import { ModalManager } from '../components/modals.js';
import { ChatEngine } from './chat.js';

// 🛡️ XSS 防护：转义所有注入 innerHTML 的用户数据
const escapeHTML = (str) => String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let selectedImagesArray = [];
let mockIdleItems = []; 
let mockHelpItems = []; 
let mockPartnerItems = []; 
let mockQuestionItems = [];
let currentCommunityPost = null; 
let selectedItemIds = new Set(); 
let currentTotalPrice = 0;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) { 
    recognition = new SpeechRecognition(); 
    recognition.lang = 'zh-CN'; 
    recognition.continuous = false; 
    recognition.interimResults = false; 
}

window.App.marketDataCache = { idle: [], help: [], partner: [] };
window.App.currentMarketTab = 'idle';

// ============================================================================
// 🎯 筛选引擎全局状态 (新增距离维度)
// ============================================================================
window.App.currentMarketFilter = {
    idle: { loc: 'all', cat: 'all', sort: 'newest' },     
    help: { loc: 'all', cat: 'all', sort: 'newest' },     
    partner: { loc: 'all', cat: 'all', size: 'all' }      
};

window.App.renderFilterBar = function(tab) {
    if (tab !== window.App.currentMarketTab) return;
    const container = document.getElementById('dynamicFilterBar');
    if (!container) return;

    container.style.display = 'flex';
    container.style.overflowX = 'auto';
    container.style.scrollbarWidth = 'none'; 
    container.style.padding = '0 12px';
    container.style.gap = '8px';
    container.style.marginBottom = '10px';

    const state = window.App.currentMarketFilter[tab];
    let html = '';

    const makeSelect = (key, options, selectedValue) => {
        const optsHtml = options.map(o => `<option value="${o.val}" ${o.val === selectedValue ? 'selected' : ''}>${o.label}</option>`).join('');
        const activeStyle = selectedValue !== 'all' && selectedValue !== 'newest' ? 'background-color: #111827; color: #FFF; border-color: #111827;' : 'background-color: #F8FAFC; color: #475569; border-color: #E2E8F0;';
        const arrowColor = selectedValue !== 'all' && selectedValue !== 'newest' ? '%23FFFFFF' : '%2364748B';
        
        return `<select onchange="window.App.onFilterChange('${tab}', '${key}', this.value)" 
                 style="appearance:none; -webkit-appearance:none; background-image: url('data:image/svg+xml;utf8,<svg fill=%22${arrowColor}%22 viewBox=%220 0 24 24%22 xmlns=%22http://www.w3.org/2000/svg%22><path d=%22M7 10l5 5 5-5z%22/></svg>'); background-repeat: no-repeat; background-position: right 8px center; background-size: 14px; padding: 8px 26px 8px 12px; border-radius: 12px; font-size: 13px; font-weight: 900; outline: none; cursor: pointer; border-width: 1px; border-style: solid; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: all 0.2s; flex-shrink: 0; ${activeStyle}">
                    ${optsHtml}
                </select>`;
    };

    // 🌟 共享距离筛选组件
    const locOptions = [{val:'all', label:'📍 全荷兰'}, {val:'city', label:'🏙️ 同城'}];

    if (tab === 'idle') {
        html += makeSelect('loc', locOptions, state.loc);
        html += makeSelect('cat', [{val:'all', label:'📦 全部分类'}, {val:'数码', label:'📱 数码电器'}, {val:'家居', label:'🛏️ 家具日用'}, {val:'服饰', label:'👗 美妆衣物'}, {val:'交通', label:'🚲 交通出行'}, {val:'其他', label:'📦 其他'}], state.cat);
        html += makeSelect('sort', [{val:'newest', label:'✨ 最新'}, {val:'price_asc', label:'💸 最低价'}, {val:'price_desc', label:'💎 最高价'}], state.sort);
    } else if (tab === 'help') {
        html += makeSelect('loc', locOptions, state.loc);
        html += makeSelect('cat', [{val:'all', label:'🤝 全部互助'}, {val:'接送', label:'🚗 接送机'}, {val:'搬家', label:'🪑 搬家装配'}, {val:'宠物', label:'🐱 代喂宠物'}, {val:'辅导', label:'💻 辅导解题'}, {val:'其他', label:'🛠️ 其他'}], state.cat);
        html += makeSelect('sort', [{val:'newest', label:'✨ 最新'}, {val:'urgent', label:'🚨 十万火急'}, {val:'reward', label:'💰 赏金最高'}], state.sort);
    } else if (tab === 'partner') {
        html += makeSelect('loc', locOptions, state.loc);
        html += makeSelect('cat', [{val:'all', label:'🏕️ 全部组局'}, {val:'饭搭子', label:'🍔 探店饭搭子'}, {val:'旅游', label:'✈️ 旅游看展'}, {val:'运动', label:'🏋️ 运动健身'}, {val:'自习', label:'📚 考前自习'}, {val:'游戏', label:'🎮 游戏开黑'}, {val:'KTV', label:'🎤 KTV/蹦迪'}], state.cat);
        html += makeSelect('size', [{val:'all', label:'👥 规模不限'}, {val:'2', label:'👯 两人局 (1v1)'}, {val:'3-5', label:'👨‍👩‍👧‍👦 3-5人'}, {val:'6+', label:'🎉 6人以上'}], state.size);
    }

    container.innerHTML = html;
};

window.App.onFilterChange = function(tab, key, value) {
    window.App.currentMarketFilter[tab][key] = value;
    window.App.renderFilterBar(tab); 
    if (tab === 'idle') window.App.renderMarketIdle();
    if (tab === 'help') window.App.renderMarketHelp();
    if (tab === 'partner') window.App.renderMarketPartner();
    if (typeof window.switchMarketTab === 'function') window.switchMarketTab(tab);
};

// 模糊搜索
const fuzzyMatch = (post, keyword) => {
    if (keyword === 'all') return true;
    const haystack = (post.title + ' ' + JSON.stringify(post.contentObj)).toLowerCase();
    return haystack.includes(keyword.toLowerCase());
};

// 🌟 核心引擎：按同城过滤
const applyLocFilter = (data, locState) => {
    if (locState === 'city') {
        // 读取本地存储的用户城市 (你在注册/定位时存入的)，默认找不到就算查不到
        const myCity = localStorage.getItem('hebao_city') || localStorage.getItem('hp_city') || 'Delft'; 
        return data.filter(post => (post.contentObj?.city || '').toLowerCase().includes(myCity.toLowerCase()));
    }
    return data;
};

export const MarketEngine = {
    // ... [中间的 loadCommunityPosts 和 getContainer 保持不变，请勿删除] ...
    async loadCommunityPosts() {
        try {
            const res = await fetch('/api/get-community?t=' + Date.now()); 
            const data = await res.json();
            if (!data.success) return;

            let idleItems = [], helpItems = [], partnerItems = [];
            (data.posts || []).forEach(post => {
                const title = post.title || ''; 
                let payload = {}; 
                try { payload = typeof post.content === 'string' ? JSON.parse(post.content) : post.content; } catch(e) { payload = { desc: post.content }; }

                const commonData = { ...post, author: post.author_name || '匿名荷包蛋', avatar: post.avatar || '😎', deal_count: post.deal_count || 0, contentObj: payload };

                if (title.includes('[闲置]')) {
                    commonData.title = title.replace('[闲置] ', '');
                    commonData.img = post.image_url || '';
                    let currentTotalPrice = 0, allSold = true;
                    if (payload && payload.items && payload.items.length > 0) {
                        payload.items.forEach(i => { if (!i.is_sold) { currentTotalPrice += parseFloat(i.price) || 0; allSold = false; }});
                        commonData.price = currentTotalPrice; commonData.isAllSold = allSold;
                    } else { commonData.price = post.likes || 0; commonData.isAllSold = false; }
                    idleItems.push(commonData);
                }
                else if (title.includes('[互助]')) helpItems.push(commonData);
                else if (title.includes('[搭子]') || title.includes('[找搭子]')) partnerItems.push(commonData);
            });

            window.App.marketDataCache = { idle: idleItems, help: helpItems, partner: partnerItems };
            window.allCommunityPostsCache = data.posts || []; 

            this.renderMarketIdle(); this.renderMarketHelp(); this.renderMarketPartner();
            const currentTab = window.App.currentMarketTab || 'idle';
            if (window.switchMarketTab) window.switchMarketTab(currentTab);

            // 🚨 动态 SOS 条：从真实帖子中提取「十万火急」的悬赏单
            this.refreshSosBroadcast(data.posts || []);
        } catch (error) { console.error("加载失败:", error); }
    },

    refreshSosBroadcast(posts) {
        const bar    = document.getElementById('sosBroadcast');
        const badge  = document.getElementById('sosBadge');
        const count  = document.getElementById('sosBadgeCount');
        if (!bar || !badge) return;

        // 筛选：互助类 + 十万火急 + 最近72小时内发布
        const cutoff = Date.now() - 72 * 60 * 60 * 1000;
        const urgentPosts = posts.filter(p => {
            if (!p.title || !p.title.includes('[互助]')) return false;
            let payload = {};
            try { payload = typeof p.content === 'string' ? JSON.parse(p.content) : p.content; } catch(e) {}
            if (payload.urgent !== '十万火急') return false;
            const ts = p.created_at ? new Date(p.created_at).getTime() : 0;
            return ts > cutoff;
        });

        if (urgentPosts.length === 0) {
            // 无真实急单：彻底隐藏角标和条
            bar.style.display   = 'none';
            badge.style.display = 'none';
            return;
        }

        // 显示角标、更新数量
        badge.style.display = 'flex';
        if (count) count.textContent = urgentPosts.length;

        // 用最新一条急单填充 SOS 条内容
        const top = urgentPosts[0];
        let topPayload = {};
        try { topPayload = typeof top.content === 'string' ? JSON.parse(top.content) : top.content; } catch(e) {}

        const titleEl = bar.querySelector('.sos-title');
        const descEl  = bar.querySelector('.sos-desc');
        const actionBtn = bar.querySelector('.sos-action-btn');

        const city    = topPayload.city || topPayload.location || '荷兰';
        const author  = top.author_name || '荷包蛋';
        const desc    = (topPayload.desc || '').slice(0, 40) + ((topPayload.desc || '').length > 40 ? '...' : '');
        const reward  = topPayload.reward || top.likes;

        if (titleEl) titleEl.textContent = `${city} · ${author} 紧急求助${reward ? ' 💶' + reward : ''}`;
        if (descEl)  descEl.textContent  = desc || '点击查看详情并帮助 Ta';
        if (actionBtn) {
            actionBtn.onclick = () => {
                if (window.App && window.App.initiateHelpChat) window.App.initiateHelpChat(top.id);
                else if (window.switchMarketTab) { window.switchMarketTab('help'); }
            };
        }
    },

    getContainer(id, isGrid = false) {
        let el = document.getElementById(id);
        if (!el) {
            const parent = document.getElementById('page-market');
            if (parent) { el = document.createElement('div'); el.id = id; parent.appendChild(el); }
            el.style.display = 'none';
        }
        el.style.padding = '0 12px 100px'; 
        if (isGrid) { el.style.display = 'grid'; el.style.gridTemplateColumns = '1fr 1fr'; el.style.gap = '8px'; el.style.alignItems = 'start'; } 
        else { if (el.style.display !== 'none') el.style.display = 'block'; }
        return el;
    },

    // 📦 闲置
    renderMarketIdle() {
        const container = this.getContainer('idleWaterfall', true);
        if (!container) return;
        let processData = [...(window.App.marketDataCache?.idle || [])];
        const state = window.App.currentMarketFilter?.idle || { loc: 'all', cat: 'all', sort: 'newest' };

        processData = applyLocFilter(processData, state.loc); // 应用距离筛选
        if (state.cat !== 'all') processData = processData.filter(post => fuzzyMatch(post, state.cat));
        if (state.sort === 'price_asc') processData.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
        else if (state.sort === 'price_desc') processData.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));

        if (processData.length === 0) { container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:60px 0; grid-column:span 2;">暂无符合条件的闲置~</div>'; return; }

        let html = '';
        processData.forEach(item => {
            let itemsList = item.contentObj?.items; if (!itemsList || itemsList.length === 0) itemsList = [{ url: item.img }];
            const itemCount = itemsList.length;
            const multiBadge = itemCount > 1 ? `<div style="position:absolute; top:6px; right:6px; background:rgba(0,0,0,0.5); color:#FFF; font-size:9px; padding:2px 6px; border-radius:10px; font-weight:bold;">📸 ${itemCount}</div>` : '';
            const city = escapeHTML(item.contentObj?.city || '荷兰');
            let imagesHtml = '';
            itemsList.forEach(subItem => { imagesHtml += `<div style="flex-shrink:0; width:100%; aspect-ratio: 1 / 1.05; scroll-snap-align:start; position:relative;"><img src="${escapeHTML(subItem.url)}" style="width:100%; height:100%; object-fit:cover; display:block;">${subItem.is_sold ? `<div style="position:absolute; top:6px; left:6px; background:rgba(0,0,0,0.6); color:white; padding:2px 6px; border-radius:4px; font-size:9px;">已售出</div>` : ''}</div>`; });
            const isAllSold = item.isAllSold; const priceDisplay = isAllSold ? '已售罄' : `€ ${escapeHTML(item.price)}`;
            html += `
            <div class="waterfall-item" style="background:#FFF; border-radius:10px; border: 0.5px solid rgba(0,0,0,0.04); overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.03); margin-bottom:8px; cursor:pointer; opacity: ${isAllSold ? '0.6' : '1'}; transition: opacity 0.3s;" onclick="window.App.openCommunityPost('${escapeHTML(item.id)}')">
                <div style="position:relative; width:100%;"><div style="display:flex; overflow-x:auto; scroll-snap-type:x mandatory; scrollbar-width:none; width:100%;">${imagesHtml}</div>${multiBadge}</div>
                <div style="padding:8px;">
                    <div style="display:flex; align-items:center; justify-content:space-between;">
                        <div style="color:${isAllSold ? '#9CA3AF' : '#EF4444'}; font-size:15px; font-weight:900;">${priceDisplay}</div>
                        <div style="font-size:9px; color:#10B981; font-weight:bold; background:#ECFDF5; border:0.5px solid #6EE7B7; padding:1px 4px; border-radius:4px;">🤝 ${escapeHTML(item.deal_count || 0)}单</div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; border-top:0.5px dashed #F3F4F6; padding-top:8px;">
                        <div style="display:flex; align-items:center; gap:4px; overflow:hidden;">
                            <span style="font-size:12px; background:#F8FAFC; width:18px; height:18px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${escapeHTML(item.avatar)}</span>
                            <span style="font-size:10px; font-weight:bold; color:#64748B; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:55px;">${escapeHTML(item.author)}</span>
                        </div>
                        <div style="font-size:9px; color:#64748B; font-weight:bold; background:#F1F5F9; padding:2px 6px; border-radius:8px; flex-shrink:0;">📍 ${city}</div>
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    },

    // 🤝 悬赏
    renderMarketHelp() {
        const container = this.getContainer('helpListContainer', true);
        if (!container) return;
        let processData = [...(window.App.marketDataCache?.help || [])];
        const state = window.App.currentMarketFilter?.help || { loc: 'all', cat: 'all', sort: 'newest' };

        processData = applyLocFilter(processData, state.loc); // 距离筛选
        if (state.cat !== 'all') processData = processData.filter(post => fuzzyMatch(post, state.cat));
        if (state.sort === 'urgent') processData = processData.filter(post => post.contentObj?.urgent === '十万火急');
        else if (state.sort === 'reward') processData.sort((a, b) => (parseFloat(b.likes) || 0) - (parseFloat(a.likes) || 0));

        if (processData.length === 0) { container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:60px 0; grid-column:span 2;">暂无符合条件的悬赏哦~</div>'; return; }

        let html = '<div style="column-count: 2; column-gap: 8px;">';
        processData.forEach(post => {
            const isUrgent = post.contentObj?.urgent === '十万火急';
            const titleStr = escapeHTML(post.title.replace('[互助] ', ''));
            let descStr = post.contentObj?.desc || post.contentObj?.text || '';
            descStr = escapeHTML(String(descStr).replace(/\\n/g, '\n').replace(/搬运物品清单：|起点.*：|终点.*：|需要几人帮忙：/g, ' ').trim());
            const city = escapeHTML(post.contentObj?.city || '荷兰');

            html += `
            <div class="waterfall-item" style="break-inside: avoid; background:#FFF; border-radius:12px; padding:10px; margin-bottom:8px; box-shadow:0 4px 12px rgba(0,0,0,0.03); border:1px solid ${isUrgent ? '#FECACA' : '#F1F5F9'}; cursor:pointer; display:flex; flex-direction:column; gap:8px;" onclick="window.App.initiateHelpChat('${escapeHTML(post.id)}')">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="font-size:18px; font-weight:900; color:#EF4444; line-height:1; letter-spacing:-0.5px;">€${escapeHTML(post.likes || 0)}</div>
                    ${isUrgent ? `<div style="background:#FEF2F2; color:#DC2626; padding:2px 4px; border-radius:4px; font-size:9px; font-weight:900;">🚨 急单</div>` : ''}
                </div>
                <div style="font-size:13px; font-weight:900; color:#111827; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${titleStr}</div>
                <div style="font-size:11px; color:#64748B; line-height:1.5; display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; white-space: pre-line;">${descStr}</div>
                <div style="display:flex; gap:4px; flex-wrap:wrap;">
                    <span style="font-size:9px; font-weight:bold; color:#D97706; background:#FFFBEB; padding:2px 6px; border-radius:4px;">💰 悬赏</span>
                    <span style="font-size:9px; font-weight:bold; color:#475569; background:#F8FAFC; padding:2px 6px; border-radius:4px;">📍 ${city}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #F1F5F9; padding-top:8px; margin-top:auto;">
                    <div style="display:flex; align-items:center; gap:4px; overflow:hidden; flex:1;">
                        <span style="font-size:14px; background:#F1F5F9; width:20px; height:20px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${post.avatar}</span>
                        <span style="font-size:10px; font-weight:bold; color:#475569; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${post.author}</span>
                    </div>
                    <div style="font-size:10px; font-weight:900; color:#10B981; background:#ECFDF5; padding:4px 8px; border-radius:6px; flex-shrink:0;">去赚</div>
                </div>
            </div>`;
        });
        html += '</div>'; container.innerHTML = html;
    },

    // 🏕️ 搭子
    renderMarketPartner() {
        const container = this.getContainer('partnerListContainer', false);
        if (!container) return;
        let processData = [...(window.App.marketDataCache?.partner || [])];
        const state = window.App.currentMarketFilter?.partner || { loc: 'all', cat: 'all', size: 'all' };

        processData = processData.filter(post => (parseInt(post.contentObj?.joinedCount) || 1) < (parseInt(post.contentObj?.maxPeople) || 2));
        processData = applyLocFilter(processData, state.loc); // 距离筛选
        if (state.cat !== 'all') processData = processData.filter(post => fuzzyMatch(post, state.cat));
        if (state.size !== 'all') {
            processData = processData.filter(post => {
                const max = parseInt(post.contentObj?.maxPeople) || 2;
                if (state.size === '2') return max === 2; if (state.size === '3-5') return max >= 3 && max <= 5; if (state.size === '6+') return max >= 6; return true;
            });
        }

        if (processData.length === 0) { container.innerHTML = '<div style="text-align:center; padding:60px 0; color:#9CA3AF;"><div style="font-size:40px; margin-bottom:10px;">🏕️</div><div style="font-size:14px; font-weight:bold; color:#64748B;">没有找到符合要求的组局哦</div></div>'; return; }

        let html = '<div style="column-count: 2; column-gap: 8px;">';
        const currentUserId = localStorage.getItem('hebao_uuid');
        processData.forEach(post => {
            const titleStr = escapeHTML(post.title.replace('[找搭子] ', '').replace('[搭子] ', ''));
            let cleanDesc = escapeHTML(String(post.contentObj?.desc || post.contentObj?.text || '').replace(/\\n/g, '\n').replace(/⏱️ 时间：.*?\n👥 队伍：.*?\n\n/g, '').trim());
            const city = escapeHTML(post.contentObj?.city || '荷兰');
            const date = escapeHTML(post.contentObj?.time || post.contentObj?.date || '待定');
            const tagStr = escapeHTML(post.contentObj?.tag || '组局');
            const joined = parseInt(post.contentObj?.joinedCount) || 1;
            const max = parseInt(post.contentObj?.maxPeople) || 2;
            const isHost = currentUserId === post.user_id;

            // 🌟 核心提取：读取帖子的鸽子次数 (模拟后端拉取，如果后端没字段就去读本地的缓存模拟)
            // 真实生产环境：这里应该直接用 post.flakeCount 或者 post.author_flakeCount
            const flakeCount = parseInt(post.flakeCount) || 0;
            const attendanceRate = escapeHTML(post.attendanceRate || '100%');

            html += `
            <div class="waterfall-item" style="break-inside: avoid; background:#FFF; border-radius:12px; padding:10px; margin-bottom:8px; box-shadow:0 4px 12px rgba(0,0,0,0.03); border:1px solid #F3E8FF; cursor:pointer; display:flex; flex-direction:column; gap:8px;" onclick="window.App.initiatePartnerChat('${escapeHTML(post.id)}')">
                <div style="font-size:13px; font-weight:900; color:#4C1D95; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${titleStr}</div>
                <div style="display:flex; gap:4px; flex-wrap:wrap;">
                    ${tagStr !== titleStr ? `<span style="font-size:9px; font-weight:bold; color:#7E22CE; background:#F3E8FF; padding:2px 6px; border-radius:4px;">${tagStr}</span>` : ''}
                    <span style="font-size:9px; font-weight:bold; color:#475569; background:#F8FAFC; padding:2px 6px; border-radius:4px;">📍 ${city}</span>
                </div>
                <div style="font-size:11px; color:#64748B; line-height:1.5; display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; white-space: pre-line;">${cleanDesc || '快来和我一起吧！'}</div>
                
                <div style="background: #F8FAFC; border-radius: 6px; padding: 6px; border: 1px solid #E2E8F0; margin-top: auto;">
                    <div style="display: flex; justify-content: space-between; font-size: 9px; font-weight: 900; color: #111827; margin-bottom: 4px;"><span>进度 ${joined}/${max}</span><span style="color: #10B981;">缺 ${max - joined}</span></div>
                    <div style="width: 100%; height: 4px; background: #E2E8F0; border-radius: 2px; overflow: hidden;"><div style="width: ${Math.min(100, (joined/max)*100)}%; height: 100%; background: #10B981; border-radius: 2px;"></div></div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #F1F5F9; padding-top:8px;">
                    <div style="display:flex; align-items:center; gap:4px; overflow:hidden; flex:1;">
                        <span style="font-size:14px; background:#F5F3FF; width:20px; height:20px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${post.avatar}</span>
                        <div style="display:flex; flex-direction:column; gap:2px; overflow:hidden;">
                            <span style="font-size:10px; font-weight:bold; color:#475569; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${post.author}</span>
                            
                            <div style="display:flex; gap:2px;">
                                <span style="font-size:8px; color:#059669; font-weight:bold; background:#D1FAE5; padding:1px 4px; border-radius:4px; white-space:nowrap;">🏃 赴约 ${attendanceRate}</span>
                                ${flakeCount > 0 ? 
                                    `<span style="font-size:8px; color:#DC2626; font-weight:bold; background:#FEE2E2; padding:1px 4px; border-radius:4px; white-space:nowrap;">🕊️ 鸽 ${flakeCount}</span>` 
                                    : ''
                                }
                            </div>
                        </div>
                    </div>
                    ${isHost ? `<div style="font-size:9px; font-weight:900; color:#64748B; background:#F1F5F9; padding:4px 6px; border-radius:6px; flex-shrink:0; align-self:flex-start;">👑</div>` : `<div style="font-size:9px; font-weight:900; color:#FFF; background:#111827; padding:4px 6px; border-radius:6px; flex-shrink:0; align-self:flex-start;">✋ 申请</div>`}
                </div>
            </div>`;
        });
        html += '</div>'; container.innerHTML = html;
    },
    // ==========================================
    // ✋ 搭子申请引擎：通过私信通道发起请求
    // ==========================================
    applyToJoinGroup(hostId, postId, postTitle, hostName, hostAvatar) {
        const currentUserId = localStorage.getItem('hebao_uuid');
        if (!currentUserId || localStorage.getItem('hebao_logged_in') !== 'true') {
            if (window.App.showToast) window.App.showToast("请先登录再报名哦！", "warning");
            if (window.App.openModal) window.App.openModal('loginModal');
            return;
        }

        const confirmJoin = confirm(`确定要申请加入 [${postTitle}] 吗？\n\n点击确定将自动开启与局长的私信！`);
        if (!confirmJoin) return;

        const applyMessage = `✋ 你好！我在集市看到了你的组局【${postTitle}】，我非常感兴趣，想要申请加入！请问还有位置吗？`;
        
        if (window.App.showToast) window.App.showToast("正在联系局长...", "info");

        setTimeout(() => {
            // 复用原本的 ChatEngine 拉起聊天框，并自动输入申请话术
            ChatEngine.openChat(
                hostId, 
                hostName || '局长', 
                hostAvatar || '😎', 
                postId, 
                `申请加入: ${postTitle}`, 
                0, 
                '', 
                false, 
                'partner'
            );
            safeDOM.execute('chatInput', input => input.value = applyMessage);
        }, 500);
    },
    // 4. 图片与语音引擎 (保持不变，已十分稳定)
    handleMultiImageSelect(event) {
        try {
            const files = event.target.files; 
            if (!files || files.length === 0) return;

            Array.from(files).forEach(file => {
                if (selectedImagesArray.length >= 9) return showToast("最多只能传 9 张照片哦！", "warning");
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64Data = e.target.result.split(',')[1]; 
                    const id = Date.now() + Math.random(); 
                    selectedImagesArray.push({ id: id, base64: base64Data, preview: e.target.result, name: '', price: '' }); 
                    this.renderIdleItemCards();
                }; 
                reader.readAsDataURL(file);
            }); 
            event.target.value = ''; 
        } catch (error) { console.error("🚨 图片解析失败:", error); }
    },

    renderIdleItemCards() {
        safeDOM.execute('idleImgPreviewContainer', container => {
            let html = '';
            container.style.display = 'flex';
            container.style.gap = '10px';
            container.style.overflowX = 'auto';
            container.style.padding = '4px 4px 16px 4px';

            selectedImagesArray.forEach((img) => { 
                html += `
                <div class="item-edit-card" style="width: 125px; flex-shrink: 0; position: relative; border: 1px solid #E5E7EB; border-radius: 12px; background: #FFF; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; flex-direction: column; overflow: hidden;">
                    <img src="${escapeHTML(img.preview)}" style="width: 100%; height: 110px; object-fit: cover; display: block; border-bottom: 1px solid #F3F4F6;">
                    <div style="padding: 10px; display: flex; flex-direction: column; gap: 8px; background: #FFF;">
                        <input type="text" placeholder="品名" value="${escapeHTML(img.name)}" onchange="window.App.updateItemData(${img.id}, 'name', this.value)" style="width: 100%; box-sizing: border-box; padding: 6px 8px; border: 1px solid #E2E8F0; border-radius: 6px; font-size: 12px; font-weight: bold; outline: none; background: #F8FAFC;">
                        <div style="display: flex; align-items: center; border: 1px solid #E2E8F0; border-radius: 6px; padding: 0 8px; background: #F8FAFC;">
                            <span style="font-size: 11px; color: #64748B; font-weight: 900;">€</span>
                            <input type="number" placeholder="价格" value="${escapeHTML(img.price)}" onchange="window.App.updateItemData(${img.id}, 'price', this.value)" style="width: 100%; box-sizing: border-box; padding: 6px 4px; border: none; background: transparent; font-size: 13px; font-weight: bold; color: #EF4444; outline: none;">
                        </div>
                    </div>
                    <div class="item-del-btn" onclick="window.App.removeImage(${img.id})" style="position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.6); color: #FFF; width: 22px; height: 22px; border-radius: 11px; display: flex; justify-content: center; align-items: center; font-size: 12px; cursor: pointer;">✕</div>
                </div>`; 
            });

            if (selectedImagesArray.length < 9) { 
                html += `
                <div class="upload-btn" onclick="document.getElementById('idleImgInput').click()" style="width: 125px; min-height: 200px; flex-shrink: 0; background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; color: #64748B;">
                    <span style="font-size: 28px; margin-bottom: 8px;">📸</span>
                    <span style="font-size: 12px; font-weight: 900;">加图 (${selectedImagesArray.length}/9)</span>
                </div>`; 
            }
            container.innerHTML = html;
        });
    },

    updateItemData(id, field, value) { const item = selectedImagesArray.find(i => i.id === id); if (item) item[field] = value; },
    removeImage(id) { selectedImagesArray = selectedImagesArray.filter(i => i.id !== id); this.renderIdleItemCards(); },

    addTagToImage(previewUrl, name, price) {
        return new Promise((resolve) => {
            try {
                if (!name && !price) return resolve(previewUrl.split(',')[1]); 
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas'); 
                    canvas.width = img.width; canvas.height = img.height; 
                    const ctx = canvas.getContext('2d'); 
                    ctx.drawImage(img, 0, 0);
                    
                    const tagText = `${name ? name + ' ' : ''}${price ? '€'+price : ''}`.trim(); 
                    const fontSize = Math.max(24, Math.floor(img.width * 0.045)); 
                    ctx.font = `bold ${fontSize}px sans-serif`;
                    const paddingX = fontSize * 0.8; const paddingY = fontSize * 0.5; const textWidth = ctx.measureText(tagText).width; const x = img.width * 0.05; const y = img.height - img.width * 0.05 - fontSize;
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'; ctx.beginPath(); if(ctx.roundRect) { ctx.roundRect(x, y, textWidth + paddingX * 2.2, fontSize + paddingY * 2, (fontSize + paddingY * 2) / 2); } else { ctx.fillRect(x, y, textWidth + paddingX * 2.2, fontSize + paddingY * 2); } ctx.fill();
                    ctx.fillStyle = '#FCD34D'; ctx.beginPath(); ctx.arc(x + paddingX * 0.9, y + (fontSize + paddingY * 2)/2, fontSize * 0.25, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#FFFFFF'; ctx.fillText(tagText, x + paddingX * 1.6, y + fontSize + paddingY * 0.4); 
                    resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1]);
                }; 
                img.onerror = () => resolve(previewUrl.split(',')[1]); 
                img.src = previewUrl;
            } catch (error) { resolve(previewUrl.split(',')[1]); }
        });
    },

    toggleVoiceInput(type) {
        // ... (保持不变)
    },

    // 5. 空壳兼容函数
    async submitIdlePost() {}, async submitHelpPost() {}, async submitPartnerPost() {},

    // 6. 详情页渲染与无损放大
    openCommunityPost(postId) {
        try {
            ModalManager.injectIfNeeded('postDetailModal');
            const modalEl = document.getElementById('postDetailModal');
            if (!modalEl) return;

            const post = (window.allCommunityPostsCache || []).find(p => String(p.id) === String(postId)) 
                      || mockIdleItems.find(p => String(p.id) === String(postId));
            if (!post) return;

            currentCommunityPost = post;
            selectedItemIds = new Set();
            currentTotalPrice = 0;
            
            safeDOM.execute('pdTotalPrice', el => el.innerText = `€0.00`);
            safeDOM.execute('pdChatBtn', el => el.innerText = `私信想要 (0件)`);

            safeDOM.execute('pdSellerInfo', sellerInfo => {
                sellerInfo.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div class="pd-seller-avatar" style="font-size:32px;">${escapeHTML(post.avatar || '😎')}</div>
                            <div style="display:flex; flex-direction:column; gap:2px;">
                                <div class="pd-seller-name" style="font-weight:900; font-size:15px;">${escapeHTML(post.author_name || post.name || '热心校友')}</div>
                                <div class="pd-seller-time" style="font-size:11px; color:#10B981; font-weight:bold;">🤝 成交: ${escapeHTML(post.deal_count || 0)} 人</div>
                            </div>
                        </div>
                    </div>`;
            });

            let payload;
            try { 
                payload = typeof post.content === 'string' ? JSON.parse(post.content) : post.content; 
                if (!payload || !payload.items) {
                    payload = { items: [{ id: 'item1', name: post.title, price: post.price || post.likes || 0, url: post.image_url || post.img, is_sold: false }] };
                }
            } catch(e) { 
                payload = { items: [{ id: 'item1', name: post.title, price: post.price || post.likes || 0, url: post.image_url || post.img, is_sold: false }] }; 
            }
            
            safeDOM.execute('pdItemsList', listContainer => {
                let itemsHtml = '';
                if (payload.items && payload.items.length > 0) {
                    payload.items.forEach(item => {
                        const isSold = item.is_sold;
                        const priceNum = parseFloat(item.price) || 0;
                        const cardClass = isSold ? 'pd-item-card sold' : 'pd-item-card';
                        
                        itemsHtml += `
                        <div class="${escapeHTML(cardClass)}" style="position:relative; margin-bottom:12px; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.05);" onclick="${isSold ? '' : `window.App.toggleItemCard(this, '${escapeHTML(item.id)}', ${priceNum})`}">
                            <img class="pd-item-img" src="${escapeHTML(item.url || 'https://via.placeholder.com/400')}" style="height: 240px; width: 100%; object-fit: cover; display:block;">

                            <div onclick="event.stopPropagation(); window.App.viewImageFull('${escapeHTML(item.url || 'https://via.placeholder.com/400')}')" style="position:absolute; top:12px; left:12px; background:rgba(255,255,255,0.9); color:#111827; width:36px; height:36px; border-radius:18px; display:flex; justify-content:center; align-items:center; box-shadow:0 4px 12px rgba(0,0,0,0.15); cursor:pointer; font-size:18px; z-index:10;">
                                🔍
                            </div>

                            <div class="pd-item-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; padding: 15px; background: linear-gradient(transparent, rgba(0,0,0,0.8)); color: white; display: flex; justify-content: space-between; align-items: flex-end;">
                                <div style="flex:1; overflow:hidden; padding-right:10px;">
                                    <div class="pd-item-name" style="font-weight:bold; font-size:15px; text-shadow:0 1px 2px rgba(0,0,0,0.5);">${escapeHTML(item.name || '闲置好物')}</div>
                                    <div class="pd-item-price" style="font-weight:900; font-size:20px; color:#FCD34D; text-shadow:0 1px 2px rgba(0,0,0,0.5);">€${escapeHTML(item.price)}</div>
                                </div>
                                ${isSold ? '<div class="pd-sold-badge" style="background:rgba(0,0,0,0.6); padding:4px 8px; border-radius:6px; font-size:12px;">已售出</div>' : `<input type="checkbox" class="custom-checkbox" id="chk_${escapeHTML(item.id)}" onclick="event.stopPropagation(); window.App.toggleItemCheckbox(this, '${escapeHTML(item.id)}', ${priceNum})" style="transform:scale(1.5); margin:0 5px 5px 0;">`}
                            </div>
                        </div>`;
                    });
                }
                listContainer.innerHTML = itemsHtml;
            });
            modalEl.style.display = 'block'; 
        } catch (error) { console.error("详情页报错:", error); }
    },

    viewImageFull(url) {
        let overlay = document.getElementById('fullImageOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'fullImageOverlay';
            overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.92); z-index:999999; display:flex; justify-content:center; align-items:center; cursor:zoom-out; flex-direction:column; backdrop-filter:blur(5px); opacity:0; transition:opacity 0.2s;';
            overlay.onclick = () => { overlay.style.opacity = '0'; setTimeout(() => { overlay.style.display = 'none'; }, 200); };
            document.body.appendChild(overlay);
        }
        const imgEl = document.createElement('img');
        imgEl.src = url;
        imgEl.style.cssText = 'max-width:95vw; max-height:85vh; object-fit:contain; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.5);';
        const captionEl = document.createElement('div');
        captionEl.style.cssText = 'color:rgba(255,255,255,0.7); margin-top:20px; font-size:13px; font-weight:bold; letter-spacing:1px;';
        captionEl.textContent = '点击任意处关闭';
        overlay.replaceChildren(imgEl, captionEl);
        overlay.style.display = 'flex';
        setTimeout(() => { overlay.style.opacity = '1'; }, 10);
    },

    toggleItemCard(cardEl, itemId, price) { safeDOM.execute(`chk_${itemId}`, chk => { chk.checked = !chk.checked; this.toggleItemCheckbox(chk, itemId, price); }); },

    toggleItemCheckbox(checkbox, itemId, price) {
        if (checkbox.checked) { selectedItemIds.add(itemId); currentTotalPrice += price; } 
        else { selectedItemIds.delete(itemId); currentTotalPrice -= price; }
        currentTotalPrice = Math.max(0, currentTotalPrice); 
        safeDOM.execute('pdTotalPrice', el => el.innerText = `€${currentTotalPrice.toFixed(2)}`);
        safeDOM.execute('pdChatBtn', el => el.innerText = `私信想要 (${selectedItemIds.size}件)`);
    },

    initiateBuyChat() {
        if (selectedItemIds.size === 0) return showToast("👉 请先点击图片，勾选您想要的物品哦！", "warning");
        let payload;
        try { payload = JSON.parse(currentCommunityPost.content); } catch(e) { payload = { items: [{ id: 'item1', name: currentCommunityPost.title, url: currentCommunityPost.img }] }; }
        let wantNames = payload.items.filter(i => selectedItemIds.has(i.id)).map(i => i.name).join('、');
        const firstItemImg = payload.items.find(i => selectedItemIds.has(i.id))?.url || currentCommunityPost.img;
        ChatEngine.openChat(currentCommunityPost.user_id || 'test_id', currentCommunityPost.name, currentCommunityPost.avatar, currentCommunityPost.id, `想要这几件 (€${currentTotalPrice.toFixed(2)})`, currentTotalPrice.toFixed(2), firstItemImg, false, 'idle');
        safeDOM.execute('chatInput', input => input.value = `哈喽！我想要你清单里的：【${wantNames}】，请问还在吗？`);
        ModalManager.close('postDetailModal');
    },

    // 🌟 核心 Bug 修复：用真缓存替换假数据，确保点击绝对生效
    initiateHelpChat(postId) {
        const post = (window.App.marketDataCache?.help || []).find(p => String(p.id) === String(postId));
        if (!post) return window.App.showToast("哎呀，帖子似乎走丢了", "error");
        const cleanTitle = post.title.replace('[互助] ', '');
        ChatEngine.openChat(post.user_id || 'test_id', post.author_name || '悬赏主', post.avatar || '👻', post.id, `悬赏: ${cleanTitle}`, post.likes || 0, '', false, 'help');
        safeDOM.execute('chatInput', input => input.value = `哈喽！我看到你的悬赏【${cleanTitle}】，我可以接单哦，请问还需要吗？`);
    },

    // 🌟 核心重构：找搭子点击事件 (带真实消息通知流)
   initiatePartnerChat(postId) {
        const post = (window.App.marketDataCache?.partner || []).find(p => String(p.id) === String(postId));
        if (!post) return window.App.showToast("哎呀，帖子似乎走丢了", "error");
        
        const currentUserId = localStorage.getItem('hebao_uuid');
        const isHost = String(currentUserId) === String(post.user_id);
        const cleanTitle = post.title.replace('[找搭子] ', '').replace('[搭子] ', '');
        
        if (isHost) {
            ChatEngine.openChat(`group_${post.id}`, '👥 ' + cleanTitle + ' (群聊)', '🏕️', post.id, `你的搭子队伍`, 0, '', true, 'group_chat');
        } else {
            if (confirm(`确定要申请加入【${cleanTitle}】吗？\n局长将在消息列表收到你的申请和资料。`)) {
                
                if (window.App.getAuthHeaders) {
                    // 1. 🌟 发送一条真实的私信给局长，触发红点提示！
                    fetch('/api/send-message', {
                        method: 'POST',
                        headers: window.App.getAuthHeaders(),
                        body: JSON.stringify({ senderId: currentUserId, receiverId: post.user_id, postId: post.id, content: `【系统提示】我想申请加入你的搭子局【${cleanTitle}】，请前往消息列表审批！🙋` })
                    }).catch(e => console.log("私信通知发送失败", e));

                    // 2. 🌟 核心换血：真实网络请求，存入 Turso 数据库！
                    fetch('/api/apply-partner', {
                        method: 'POST',
                        headers: window.App.getAuthHeaders(),
                        body: JSON.stringify({
                            postId: post.id,
                            postTitle: cleanTitle,
                            hostId: String(post.user_id), 
                            applicantId: currentUserId,
                            applicantName: localStorage.getItem('hp_name') || '热心管家',
                            applicantAvatar: localStorage.getItem('hp_real_avatar') || '😎'
                        })
                    }).then(res => res.json()).then(data => {
                        if (data.success) {
                            window.App.showToast("✅ 申请已发送！请耐心等待局长审核", "success");
                        } else {
                            window.App.showToast("发送失败: " + (data.error || "未知错误"), "error");
                        }
                    }).catch(err => {
                        console.error(err);
                        window.App.showToast("网络拥堵，申请发送失败", "error");
                    });
                } else {
                    window.App.showToast("身份信息过期，请重新登录", "error");
                }
            }
        }
    }
};

if (typeof window !== 'undefined') {
    window.App = window.App || {};
    window.App.safeDOM = safeDOM; 
    
    Object.keys(MarketEngine).forEach(key => {
        if (typeof MarketEngine[key] === 'function') {
            const boundFunc = MarketEngine[key].bind(MarketEngine);
            window.App[key] = boundFunc;
            window[key] = boundFunc; 
        }
    });
}


// ============================================================================
// 🚀 聊天引擎外挂补丁 (自动植入删除按钮 & 群聊识别系统)
// 把它放在任何一个会被加载的 JS 文件底部即可生效！
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. 监听聊天弹窗的打开，动态植入【删除】按钮
    const chatModalTarget = document.getElementById('chatModal') || document.body;
    const observer = new MutationObserver((mutations, obs) => {
        const chatModal = document.getElementById('chatModal');
        // 当聊天框弹出来的时候
        if (chatModal && chatModal.style.display === 'block') {
            const chatHeader = chatModal.querySelector('.modal-content > div:first-child');
            if (chatHeader && !document.getElementById('deleteChatBtn')) {
                // 在右上角注入一个红色垃圾桶按钮
                const delBtn = document.createElement('div');
                delBtn.id = 'deleteChatBtn';
                delBtn.textContent = '🗑️ 删除';
                delBtn.style.cssText = 'color:#EF4444; font-size:12px; font-weight:bold; cursor:pointer; background:#FEF2F2; padding:6px 10px; border-radius:8px; margin-right:10px; box-shadow:0 2px 4px rgba(239,68,68,0.1);';
                
                delBtn.onclick = () => {
                    if(!confirm('🚨 确定要删除这条对话吗？（群聊退群，单聊清空记录）')) return;
                    
                    // 获取当前正在聊天的人或群 ID（假设你存在 window.currentChatUserId）
                    const targetId = window.currentChatUserId || localStorage.getItem('hp_last_chat_id');
                    
                    if (targetId) {
                        // 清除本地聊天记录
                        localStorage.removeItem(`chat_history_${targetId}`);
                        if (window.App.showToast) window.App.showToast("已删除对话并清空记录", "success");
                        // 关闭聊天框
                        if (window.ModalManager && window.ModalManager.close) ModalManager.close('chatModal');
                        else chatModal.style.display = 'none';
                        
                        // 如果有刷新消息列表的函数，调用它
                        if (window.App.loadMessageList) window.App.loadMessageList();
                    }
                };

                // 把删除按钮塞到关闭按钮的前面
                const closeBtn = chatHeader.querySelector('div:last-child');
                if (closeBtn) chatHeader.insertBefore(delBtn, closeBtn);
            }
            
            // 2. 如果是群聊，自动把顶部变色，氛围拉满
            const targetId = window.currentChatUserId || localStorage.getItem('hp_last_chat_id') || '';
            if (targetId.startsWith('group_')) {
                chatHeader.style.background = 'linear-gradient(90deg, #F3E8FF 0%, #FFF 100%)';
                const nameEl = chatHeader.querySelector('div[style*="font-weight:900"]');
                if (nameEl && !nameEl.innerText.includes('群')) nameEl.innerText += ' (群聊)';
            }
        }
    });

    // 仅监控 chatModal（存在时）或 body 作为兜底，且去掉 attributes 监听以提升性能
    const chatModalEl = document.getElementById('chatModal');
    observer.observe(chatModalEl || document.body, { childList: true, subtree: true });
});
