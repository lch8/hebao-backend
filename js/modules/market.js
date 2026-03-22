// ============================================================================
// js/modules/market.js - 集市与发布引擎 (高级全面屏 UI 精调版)
// ============================================================================
import { showToast } from '../core/toast.js';
import { safeDOM } from '../core/dom.js'; 
import { ModalManager } from '../components/modals.js';
import { ChatEngine } from './chat.js'; 

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
// 🎯 筛选引擎全局状态 (重构为符合真实业务场景的维度)
// ============================================================================
window.App.currentMarketFilter = {
    idle: { cat: 'all', sort: 'newest' },     // 闲置：分类 + 价格排序
    help: { cat: 'all', sort: 'newest' },     // 悬赏：分类 + 赏金排序/加急
    partner: { cat: 'all', size: 'all' }      // 搭子：分类 + 人数规模过滤
};

window.App.renderFilterBar = function(tab) {
    if (tab !== window.App.currentMarketTab) return;
    const container = document.getElementById('dynamicFilterBar');
    if (!container) return;

    // 支持横向丝滑滑动，防止小屏手机被挤压
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

    if (tab === 'idle') {
        html += makeSelect('cat', [{val:'all', label:'📦 全部分类'}, {val:'数码', label:'📱 数码电器'}, {val:'家居', label:'🛏️ 家具日用'}, {val:'服饰', label:'👗 美妆衣物'}, {val:'交通', label:'🚲 交通出行'}, {val:'其他', label:'📦 其他闲置'}], state.cat);
        html += makeSelect('sort', [{val:'newest', label:'✨ 最新发布'}, {val:'price_asc', label:'💸 价格最低'}, {val:'price_desc', label:'💎 价格最高'}], state.sort);
    } else if (tab === 'help') {
        html += makeSelect('cat', [{val:'all', label:'🤝 全部互助'}, {val:'接送', label:'🚗 接送机'}, {val:'搬家', label:'🪑 搬家装配'}, {val:'宠物', label:'🐱 代喂宠物'}, {val:'辅导', label:'💻 辅导解题'}, {val:'其他', label:'🛠️ 其他'}], state.cat);
        html += makeSelect('sort', [{val:'newest', label:'✨ 最新发布'}, {val:'urgent', label:'🚨 十万火急'}, {val:'reward', label:'💰 赏金最高'}], state.sort);
    } else if (tab === 'partner') {
        html += makeSelect('cat', [{val:'all', label:'🏕️ 全部组局'}, {val:'饭搭子', label:'🍔 探店饭搭子'}, {val:'旅游', label:'✈️ 旅游看展'}, {val:'运动', label:'🏋️ 运动健身'}, {val:'自习', label:'📚 考前自习'}, {val:'游戏', label:'🎮 游戏开黑'}, {val:'KTV', label:'🎤 KTV/蹦迪'}], state.cat);
        html += makeSelect('size', [{val:'all', label:'👥 规模不限'}, {val:'2', label:'👯 两人局 (1v1)'}, {val:'3-5', label:'👨‍👩‍👧‍👦 3-5人小队'}, {val:'6+', label:'🎉 6人以上大群'}], state.size);
    }

    container.innerHTML = html;
};

window.App.onFilterChange = function(tab, key, value) {
    window.App.currentMarketFilter[tab][key] = value;
    window.App.renderFilterBar(tab); 
    if (tab === 'idle') window.App.renderMarketIdle();
    if (tab === 'help') window.App.renderMarketHelp();
    if (tab === 'partner') window.App.renderMarketPartner();
    
    // 🌟 兜底魔法：筛选结束后，强行唤醒当前版块的显示状态，拒绝隐身！
    if (typeof window.switchMarketTab === 'function') {
        window.switchMarketTab(tab);
    }
};
// 🌟 核心魔法：无视新老数据结构的“全局模糊扫描器”
const fuzzyMatch = (post, keyword) => {
    if (keyword === 'all') return true;
    // 把帖子的标题、和深层的 JSON 内容全部转成字符串，然后强行扫关键字！
    const haystack = (post.title + ' ' + JSON.stringify(post.contentObj)).toLowerCase();
    return haystack.includes(keyword.toLowerCase());
};

export const MarketEngine = {
    async loadCommunityPosts() {
        try {
            const res = await fetch('/api/get-community?t=' + Date.now()); 
            const data = await res.json();
            
            if (!data.success) {
                if(window.App.showToast) window.App.showToast("集市加载失败: " + data.error, "error");
                return;
            }

            let idleItems = [], helpItems = [], partnerItems = [];
            
            (data.posts || []).forEach(post => {
                const title = post.title || ''; 
                let payload = {}; 
                try {
                    payload = JSON.parse(post.content || '{}');
                    if (typeof payload === 'string') payload = JSON.parse(payload); 
                } catch(e) { payload = { desc: post.content }; }

                const commonData = {
                    ...post,
                    author: post.author_name || '匿名荷包蛋',
                    avatar: post.avatar || '😎',
                    email: post.email || '',    
                    credit: post.credit || 100,  
                    contentObj: payload
                };

                if (title.includes('[闲置]')) {
                    commonData.title = title.replace('[闲置] ', '');
                    commonData.img = post.image_url || '';

                    let currentTotalPrice = 0;
                    let allSold = true;

                    if (payload && payload.items && payload.items.length > 0) {
                        payload.items.forEach(i => {
                            if (!i.is_sold) {
                                currentTotalPrice += parseFloat(i.price) || 0;
                                allSold = false; 
                            }
                        });
                        commonData.price = currentTotalPrice;
                        commonData.isAllSold = allSold;
                    } else {
                        commonData.price = post.likes || 0;
                        commonData.isAllSold = false;
                    }
                    idleItems.push(commonData);
                }
                else if (title.includes('[互助]')) {
                    helpItems.push(commonData);
                }
                else if (title.includes('[搭子]') || title.includes('[找搭子]')) {
                    partnerItems.push(commonData);
                }
            });

            window.App.marketDataCache = { idle: idleItems, help: helpItems, partner: partnerItems };
            window.allCommunityPostsCache = data.posts || []; 

            this.renderMarketIdle(); 
            this.renderMarketHelp();
            this.renderMarketPartner();

            const currentTab = window.App.currentMarketTab || 'idle';
            if (window.switchMarketTab) window.switchMarketTab(currentTab);
        } catch (error) { console.error("🚨 致命加载失败:", error); }
    },

    getContainer(id, isGrid = false) {
        let el = document.getElementById(id);
        if (!el) {
            const parent = document.getElementById('page-market');
            if (parent) { el = document.createElement('div'); el.id = id; parent.appendChild(el); }
            el.style.display = 'none'; // 仅在初次创建时隐藏
        }
        
        el.style.padding = '0 12px 100px'; 
        if (isGrid) { 
            el.style.display = 'grid'; 
            el.style.gridTemplateColumns = '1fr 1fr'; 
            el.style.gap = '8px'; 
            el.style.alignItems = 'start'; 
        } else {
            // 🌟 致命 Bug 修复处：
            // 如果面板本来就是显示状态（比如你正在看悬赏版块），绝对不能强行把它改成 none！
            if (el.style.display !== 'none') {
                el.style.display = 'block';
            }
        }
        return el;
    },

    // ==========================================
    // 📦 渲染器：闲置 
    // ==========================================
    renderMarketIdle() {
        const container = this.getContainer('idleWaterfall', true);
        if (!container) return;

        let processData = [...(window.App.marketDataCache?.idle || [])];
        const state = window.App.currentMarketFilter?.idle || { cat: 'all', sort: 'newest' };

        // 🔍 1. 全局模糊扫描分类 (0 漏报，完美兼容新老数据)
        if (state.cat !== 'all') {
            processData = processData.filter(post => fuzzyMatch(post, state.cat));
        }

        // 🔢 2. 价格排序
        if (state.sort === 'price_asc') {
            processData.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
        } else if (state.sort === 'price_desc') {
            processData.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
        }

        if (processData.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:60px 0; grid-column:span 2;">该分类下暂无闲置~</div>';
            return;
        }

        let html = '';
        const defaultImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23F3F4F6'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'%3E暂无图%3C/text%3E%3C/svg%3E";

        processData.forEach(item => {
            let itemsList = item.contentObj?.items;
            if (!itemsList || itemsList.length === 0) itemsList = [{ url: item.img || defaultImg }];

            const itemCount = itemsList.length;
            const multiBadge = itemCount > 1 ? `<div style="position:absolute; top:6px; right:6px; background:rgba(0,0,0,0.5); color:#FFF; font-size:9px; padding:2px 6px; border-radius:10px; font-weight:bold; backdrop-filter:blur(4px); pointer-events:none; z-index:10;">📸 ${itemCount}</div>` : '';
            
            let city = item.contentObj?.city || '';
            if (!city) {
                const locStr = (item.contentObj?.location || '').replace('📍', '').trim();
                city = locStr.includes('同城') ? '荷兰' : locStr;
            }
            const creditStr = item.credit ? `${item.credit}` : '100';

            let imagesHtml = '';
            itemsList.forEach(subItem => {
                imagesHtml += `
                <div style="flex-shrink:0; width:100%; aspect-ratio: 1 / 1.05; scroll-snap-align:start; position:relative;">
                    <img src="${subItem.url || defaultImg}" style="width:100%; height:100%; object-fit:cover; display:block;">
                    ${subItem.is_sold ? `<div style="position:absolute; top:6px; left:6px; background:rgba(0,0,0,0.6); color:white; padding:2px 6px; border-radius:4px; font-size:9px;">已售出</div>` : ''}
                </div>`;
            });

            const isAllSold = item.isAllSold;
            const priceDisplay = isAllSold ? '已售罄' : `€ ${item.price}`;
            const priceColor = isAllSold ? '#9CA3AF' : '#EF4444';
            const cardOpacity = isAllSold ? '0.6' : '1';

            html += `
            <div class="waterfall-item" style="background:#FFF; border-radius:10px; border: 0.5px solid rgba(0,0,0,0.04); overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.03); margin-bottom:8px; cursor:pointer; opacity: ${cardOpacity}; transition: opacity 0.3s;" onclick="window.App.openCommunityPost('${item.id}')">
                <div style="position:relative; width:100%;">
                    <div style="display:flex; overflow-x:auto; scroll-snap-type:x mandatory; scrollbar-width:none; -webkit-overflow-scrolling:touch; width:100%;">
                        ${imagesHtml}
                    </div>
                    ${multiBadge}
                </div>
                <div style="padding:8px;">
                    <div style="display:flex; align-items:center; justify-content:space-between;">
                        <div style="color:${priceColor}; font-size:15px; font-weight:900; letter-spacing: -0.5px;">${priceDisplay}</div>
                        <div style="font-size:9px; color:#D97706; font-weight:bold; background:#FFFBEB; border:0.5px solid #FDE68A; padding:1px 4px; border-radius:4px;">⭐ ${creditStr}</div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; border-top:0.5px dashed #F3F4F6; padding-top:8px;">
                        <div style="display:flex; align-items:center; gap:4px; overflow:hidden;">
                            <span style="font-size:12px; background:#F8FAFC; width:18px; height:18px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${item.avatar}</span>
                            <span style="font-size:10px; font-weight:bold; color:#64748B; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:55px;">${item.author}</span>
                        </div>
                        <div style="font-size:9px; color:#64748B; font-weight:bold; background:#F1F5F9; padding:2px 6px; border-radius:8px; flex-shrink:0;">📍 ${city}</div>
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    },

    // ==========================================
    // 🤝 渲染器：悬赏 (重构：高薪诱惑 + 极简卡片流)
    // ==========================================
    renderMarketHelp() {
        const container = this.getContainer('helpListContainer', false);
        if (!container) return;

        let processData = [...(window.App.marketDataCache?.help || [])];
        const state = window.App.currentMarketFilter?.help || { cat: 'all', sort: 'newest' };

        if (state.cat !== 'all') processData = processData.filter(post => fuzzyMatch(post, state.cat));
        if (state.sort === 'urgent') processData = processData.filter(post => post.contentObj?.urgent === '十万火急');
        else if (state.sort === 'reward') processData.sort((a, b) => (parseFloat(b.likes) || 0) - (parseFloat(a.likes) || 0));

        if (processData.length === 0) { container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:60px 0;">暂无符合条件的悬赏哦~</div>'; return; }

        let html = '';
        processData.forEach(post => {
            const isUrgent = post.contentObj?.urgent === '十万火急';
            const titleStr = post.title.replace('[互助] ', '');
            const descStr = post.contentObj?.desc || post.contentObj?.text || '点击查看详情...';
            const city = post.contentObj?.city || '荷兰';
            const creditStr = post.credit ? `${post.credit}` : '100';

            // 🌟 视觉重构：头部用户信息 -> 中部醒目悬赏 -> 底部操作
            html += `
            <div style="background:#FFF; border-radius:16px; padding:16px; margin-bottom:12px; box-shadow:0 2px 12px rgba(0,0,0,0.03); border:1px solid ${isUrgent ? '#FECACA' : '#F8FAFC'}; cursor:pointer; transition: transform 0.2s;" onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'" onclick="window.App.initiateHelpChat('${post.id}')">
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:20px; background:#F1F5F9; width:32px; height:32px; border-radius:16px; display:flex; align-items:center; justify-content:center;">${post.avatar}</span>
                        <div style="display:flex; flex-direction:column;">
                            <span style="font-size:13px; font-weight:900; color:#111827;">${post.author}</span>
                            <span style="font-size:10px; color:#D97706; font-weight:bold; display:flex; align-items:center; gap:2px;">⭐ ${creditStr} 信用分</span>
                        </div>
                    </div>
                    ${isUrgent ? `<div style="background:#FEF2F2; color:#DC2626; padding:4px 8px; border-radius:6px; font-size:10px; font-weight:900; letter-spacing:1px;">🚨 十万火急</div>` : ''}
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; gap: 10px;">
                    <div style="font-size:16px; font-weight:900; color:#111827; line-height:1.4; flex:1;">${titleStr}</div>
                    <div style="font-size:18px; font-weight:900; color:#EF4444; flex-shrink:0; background: #FEF2F2; padding: 4px 10px; border-radius: 8px;">€${post.likes || 0}</div>
                </div>
                
                <div style="font-size:13px; color:#64748B; line-height:1.6; margin-bottom:16px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${descStr}</div>
                
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:11px; font-weight:bold; color:#64748B; background:#F8FAFC; padding:4px 8px; border-radius:6px;">📍 ${city}</span>
                    <button style="background:#111827; color:#FFF; border:none; padding:8px 20px; border-radius:12px; font-size:13px; font-weight:900; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.1);">立即接单</button>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    },

    // ==========================================
    // 🏕️ 渲染器：找搭子 (重构：消除重复文本，突出进度条)
    // ==========================================
    renderMarketPartner() {
        const container = this.getContainer('partnerListContainer', false);
        if (!container) return;

        let processData = [...(window.App.marketDataCache?.partner || [])];
        const state = window.App.currentMarketFilter?.partner || { cat: 'all', size: 'all' };

        processData = processData.filter(post => {
            const max = parseInt(post.contentObj?.maxPeople) || 2;
            const joined = parseInt(post.contentObj?.joinedCount) || 1;
            return joined < max; 
        });

        if (state.cat !== 'all') processData = processData.filter(post => fuzzyMatch(post, state.cat));
        if (state.size !== 'all') {
            processData = processData.filter(post => {
                const max = parseInt(post.contentObj?.maxPeople) || 2;
                if (state.size === '2') return max === 2;
                if (state.size === '3-5') return max >= 3 && max <= 5;
                if (state.size === '6+') return max >= 6;
                return true;
            });
        }

        if (processData.length === 0) { 
            container.innerHTML = `
                <div style="text-align:center; padding:60px 0; color:#9CA3AF;">
                    <div style="font-size:40px; margin-bottom:10px;">🏕️</div>
                    <div style="font-size:14px; font-weight:bold; color:#64748B;">没有找到符合要求的组局哦</div>
                    <div style="font-size:12px; margin-top:6px;">(满员的车队已为您自动隐藏)</div>
                </div>`; 
            return; 
        }

        let html = '';
        const currentUserId = localStorage.getItem('hebao_uuid');

        processData.forEach(post => {
            const titleStr = post.title.replace('[找搭子] ', '').replace('[搭子] ', '');
            let rawDesc = post.contentObj?.desc || post.contentObj?.text || '';
            
            // 🌟 核心修复：自动清洗我们在发帖时拼接的垃圾冗余文本 (⏱️ 时间... 👥 队伍...)
            // 只提取用户自己输入的纯净文案！
            let cleanDesc = rawDesc;
            if (rawDesc.includes('\\n\\n')) cleanDesc = rawDesc.split('\\n\\n').pop();
            else if (rawDesc.includes('\n\n')) cleanDesc = rawDesc.split('\n\n').pop();

            const city = post.contentObj?.city || '荷兰';
            const date = post.contentObj?.time || post.contentObj?.date || '待定'; 
            const creditStr = post.credit ? `${post.credit}` : '100';

            const joined = parseInt(post.contentObj?.joinedCount) || 1; 
            const max = parseInt(post.contentObj?.maxPeople) || 2;      
            const remain = max - joined > 0 ? max - joined : 0;
            const percent = Math.min(100, (joined / max) * 100);
            const isHost = currentUserId === post.user_id;              
            const safeTitle = titleStr.replace(/'/g, "\\'");
            const safeDesc = cleanDesc.replace(/\n/g, ' ').replace(/'/g, "\\'").substring(0, 30);

            // 🌟 视觉重构：超清爽卡片，社交感拉满
            html += `
            <div style="background:#FFF; border-radius:16px; padding:16px; margin-bottom:12px; box-shadow:0 2px 12px rgba(0,0,0,0.03); border:1px solid #F3F4F6;">
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:20px; background:#F5F3FF; width:32px; height:32px; border-radius:16px; display:flex; align-items:center; justify-content:center;">${post.avatar}</span>
                        <div style="display:flex; flex-direction:column;">
                            <span style="font-size:13px; font-weight:900; color:#111827;">${post.author}</span>
                            <span style="font-size:10px; color:#D97706; font-weight:bold;">⭐ ${creditStr} 信用分</span>
                        </div>
                    </div>
                    <div style="background:#F5F3FF; color:#7C3AED; padding:4px 8px; border-radius:6px; font-size:10px; font-weight:900;">${post.contentObj?.tag || '组局'}</div>
                </div>

                <div style="font-size:16px; font-weight:900; color:#111827; margin-bottom:6px;">${titleStr}</div>
                <div style="display:flex; gap:6px; margin-bottom:10px;">
                    <span style="font-size:11px; color:#475569; background:#F8FAFC; padding:4px 8px; border-radius:6px; font-weight:bold;">⏰ ${date}</span>
                    <span style="font-size:11px; color:#475569; background:#F8FAFC; padding:4px 8px; border-radius:6px; font-weight:bold;">📍 ${city}</span>
                </div>
                
                <div style="font-size:13px; color:#64748B; line-height:1.6; margin-bottom:16px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${cleanDesc || '快来和我一起吧！'}</div>
                
                <div style="background: #F8FAFC; border-radius: 12px; padding: 12px; border: 1px solid #E2E8F0;">
                    <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 900; color: #111827; margin-bottom: 8px;">
                        <span>🏃 队伍进度 (${joined}/${max}人)</span>
                        <span style="color: #10B981;">缺 ${remain} 人</span>
                    </div>
                    <div style="width: 100%; height: 6px; background: #E2E8F0; border-radius: 3px; overflow: hidden; margin-bottom: 12px;">
                        <div style="width: ${percent}%; height: 100%; background: #10B981; border-radius: 3px; transition: width 0.5s ease;"></div>
                    </div>
                    
                    <div style="display:flex; gap: 8px;">
                        <button style="background:#F1F5F9; color:#475569; border:none; width: 40px; border-radius:10px; font-size:14px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:0.2s;" onmousedown="this.style.transform='scale(0.9)'" onmouseup="this.style.transform='scale(1)'" onclick="event.stopPropagation(); window.App.generateAndSharePoster('${safeTitle}', '0', '', '🏕️ 搭子', '${safeDesc}...')">📤</button>
                        
                        ${isHost ? 
                            `<button onclick="window.App.showToast('你是局长，请前往消息列表审核申请哦', 'info')" style="flex:1; background: #E2E8F0; color: #64748B; border: none; padding: 10px; border-radius: 10px; font-weight: 900; font-size: 13px; cursor: not-allowed;">👑 管理我的队伍</button>` 
                            : 
                            `<button onclick="window.App.applyToJoinGroup('${post.user_id}', '${post.id}', '${safeTitle}', '${post.author}', '${post.avatar}')" style="flex:1; background: #111827; color: white; border: none; padding: 10px; border-radius: 10px; font-weight: 900; font-size: 13px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.1); transition: 0.2s;" onmousedown="this.style.transform='scale(0.97)'" onmouseup="this.style.transform='scale(1)'">✋ 申请加入并私聊</button>`
                        }
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
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
                    <img src="${img.preview}" style="width: 100%; height: 110px; object-fit: cover; display: block; border-bottom: 1px solid #F3F4F6;">
                    <div style="padding: 10px; display: flex; flex-direction: column; gap: 8px; background: #FFF;">
                        <input type="text" placeholder="品名" value="${img.name}" onchange="window.App.updateItemData(${img.id}, 'name', this.value)" style="width: 100%; box-sizing: border-box; padding: 6px 8px; border: 1px solid #E2E8F0; border-radius: 6px; font-size: 12px; font-weight: bold; outline: none; background: #F8FAFC;">
                        <div style="display: flex; align-items: center; border: 1px solid #E2E8F0; border-radius: 6px; padding: 0 8px; background: #F8FAFC;">
                            <span style="font-size: 11px; color: #64748B; font-weight: 900;">€</span>
                            <input type="number" placeholder="价格" value="${img.price}" onchange="window.App.updateItemData(${img.id}, 'price', this.value)" style="width: 100%; box-sizing: border-box; padding: 6px 4px; border: none; background: transparent; font-size: 13px; font-weight: bold; color: #EF4444; outline: none;">
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
                            <div class="pd-seller-avatar" style="font-size:32px;">${post.avatar || '😎'}</div>
                            <div style="display:flex; flex-direction:column; gap:2px;">
                                <div class="pd-seller-name" style="font-weight:900; font-size:15px;">${post.author_name || post.name || '热心校友'}</div>
                                <div class="pd-seller-time" style="font-size:11px; color:#D97706; font-weight:bold;">⭐ 信用分: ${post.credit || 100}分</div>
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
                        <div class="${cardClass}" style="position:relative; margin-bottom:12px; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.05);" onclick="${isSold ? '' : `window.App.toggleItemCard(this, '${item.id}', ${priceNum})`}">
                            <img class="pd-item-img" src="${item.url || 'https://via.placeholder.com/400'}" style="height: 240px; width: 100%; object-fit: cover; display:block;">
                            
                            <div onclick="event.stopPropagation(); window.App.viewImageFull('${item.url || 'https://via.placeholder.com/400'}')" style="position:absolute; top:12px; left:12px; background:rgba(255,255,255,0.9); color:#111827; width:36px; height:36px; border-radius:18px; display:flex; justify-content:center; align-items:center; box-shadow:0 4px 12px rgba(0,0,0,0.15); cursor:pointer; font-size:18px; z-index:10;">
                                🔍
                            </div>

                            <div class="pd-item-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; padding: 15px; background: linear-gradient(transparent, rgba(0,0,0,0.8)); color: white; display: flex; justify-content: space-between; align-items: flex-end;">
                                <div style="flex:1; overflow:hidden; padding-right:10px;">
                                    <div class="pd-item-name" style="font-weight:bold; font-size:15px; text-shadow:0 1px 2px rgba(0,0,0,0.5);">${item.name || '闲置好物'}</div>
                                    <div class="pd-item-price" style="font-weight:900; font-size:20px; color:#FCD34D; text-shadow:0 1px 2px rgba(0,0,0,0.5);">€${item.price}</div>
                                </div>
                                ${isSold ? '<div class="pd-sold-badge" style="background:rgba(0,0,0,0.6); padding:4px 8px; border-radius:6px; font-size:12px;">已售出</div>' : `<input type="checkbox" class="custom-checkbox" id="chk_${item.id}" onclick="event.stopPropagation(); window.App.toggleItemCheckbox(this, '${item.id}', ${priceNum})" style="transform:scale(1.5); margin:0 5px 5px 0;">`}
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
        overlay.innerHTML = `<img src="${url}" style="max-width:95vw; max-height:85vh; object-fit:contain; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.5);"><div style="color:rgba(255,255,255,0.7); margin-top:20px; font-size:13px; font-weight:bold; letter-spacing:1px;">点击任意处关闭</div>`;
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

    initiateHelpChat(postId) {
        const post = mockHelpItems.find(p => String(p.id) === String(postId));
        if (!post) return showToast("哎呀，帖子似乎走丢了", "error");
        const cleanTitle = post.title.replace('[互助] ', '');
        ChatEngine.openChat(post.user_id || 'test_id', post.author_name || '悬赏主', post.avatar || '👻', post.id, `悬赏: ${cleanTitle}`, post.likes || 0, '', false, 'help');
        safeDOM.execute('chatInput', input => input.value = `哈喽！我看到你的悬赏【${cleanTitle}】，我可以接单哦，请问还需要吗？`);
    },

    initiatePartnerChat(postId) {
        const post = mockPartnerItems.find(p => String(p.id) === String(postId));
        if (!post) return showToast("哎呀，帖子似乎走丢了", "error");
        const cleanTitle = post.title.replace('[找搭子] ', '');
        ChatEngine.openChat(post.user_id || 'test_id', post.author_name || '发起人', post.avatar || '👻', post.id, `搭子局: ${cleanTitle}`, 0, '', false, 'partner');
        safeDOM.execute('chatInput', input => input.value = `哈喽！我对你的搭子局【${cleanTitle}】很感兴趣，能加我一个吗？🙋`);
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
