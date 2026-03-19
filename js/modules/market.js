// ============================================================================
// js/modules/market.js - 集市与发布引擎 (全栖满血完整版 - 修复标点)
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

// 🌟 新增：记住当前所在的是哪个 Tab（默认是闲置）
window.App.currentMarketTab = 'idle';

window.App.currentMarketFilter = {
    idle: { loc: 'all', cat: 'all', sort: 'newest' },
    help: { loc: 'all', status: 'all', sort: 'newest' },
    partner: { loc: 'all', type: 'all', sort: 'newest' }
};

// 渲染原生下拉胶囊 UI
window.App.renderFilterBar = function(tab) {
    // 🌟 核心修复：如果传进来的 tab 不是当前正在看的 tab，直接拦截！防止互相覆盖！
    if (tab !== window.App.currentMarketTab) return;

    const container = document.getElementById('dynamicFilterBar');
    if (!container) return;

    const state = window.App.currentMarketFilter[tab];
    let html = '';

    // 生产带 SVG 小箭头的精美 Select 胶囊
    const makeSelect = (key, options, selectedValue) => {
        const optsHtml = options.map(o => `<option value="${o.val}" ${o.val === selectedValue ? 'selected' : ''}>${o.label}</option>`).join('');
        const activeStyle = selectedValue !== 'all' && selectedValue !== 'newest' ? 'background-color: #111827; color: #FFF; border-color: #111827;' : 'background-color: #F8FAFC; color: #475569; border-color: #E2E8F0;';
        const arrowColor = selectedValue !== 'all' && selectedValue !== 'newest' ? '%23FFFFFF' : '%2364748B';
        
        return `<select onchange="window.App.onFilterChange('${tab}', '${key}', this.value)" 
                 style="appearance:none; -webkit-appearance:none; background-image: url('data:image/svg+xml;utf8,<svg fill=%22${arrowColor}%22 viewBox=%220 0 24 24%22 xmlns=%22http://www.w3.org/2000/svg%22><path d=%22M7 10l5 5 5-5z%22/></svg>'); background-repeat: no-repeat; background-position: right 8px center; background-size: 16px; padding: 6px 26px 6px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; outline: none; cursor: pointer; border-width: 1px; border-style: solid; box-shadow: 0 2px 6px rgba(0,0,0,0.02); transition: all 0.2s; flex-shrink: 0; ${activeStyle}">
                    ${optsHtml}
                </select>`;
    };

    if (tab === 'idle') {
        html += makeSelect('loc', [{val:'all', label:'📍 全荷兰'}, {val:'city', label:'📍 同城自提'}, {val:'nearby', label:'📍 离我最近'}], state.loc);
        html += makeSelect('cat', [{val:'all', label:'🏷️ 全部分类'}, {val:'digital', label:'📱 电子数码'}, {val:'home', label:'🛏️ 家具家电'}, {val:'transport', label:'🚲 交通出行'}], state.cat);
        html += makeSelect('sort', [{val:'newest', label:'✨ 最新发布'}, {val:'nearest', label:'🏃 距离优先'}], state.sort);
    } else if (tab === 'help') {
        html += makeSelect('loc', [{val:'all', label:'📍 互助范围'}, {val:'online', label:'💻 线上求助'}, {val:'city', label:'📍 同城线下'}], state.loc);
        html += makeSelect('status', [{val:'all', label:'🏷️ 任务状态'}, {val:'urgent', label:'🚨 十万火急'}, {val:'unresolved', label:'🟢 仅看未解决'}], state.status);
        html += makeSelect('sort', [{val:'newest', label:'✨ 最新发布'}, {val:'reward', label:'💰 赏金最高'}], state.sort);
    } else if (tab === 'partner') {
        html += makeSelect('loc', [{val:'all', label:'📍 活动区域'}, {val:'city', label:'📍 同城组局'}, {val:'travel', label:'✈️ 跨城/跨国'}], state.loc);
        html += makeSelect('type', [{val:'all', label:'🏷️ 全部类型'}, {val:'food', label:'🍔 饭搭子'}, {val:'mbti_e', label:'🔥 寻 E 人'}, {val:'mbti_i', label:'🍵 寻 I 人'}], state.type);
        html += makeSelect('sort', [{val:'newest', label:'✨ 最新发布'}, {val:'date', label:'⏰ 出发最近'}], state.sort);
    }

    container.innerHTML = html;
};

// 触发筛选重绘
window.App.onFilterChange = function(tab, key, value) {
    window.App.currentMarketFilter[tab][key] = value;
    
    // 弹性隐私定位的交互引导
    if (value === 'nearby' || value === 'nearest') {
        if(window.App.showToast) window.App.showToast("📍 正在请求高精度定位权限...", "info");
    }

    window.App.renderFilterBar(tab); 
    
    // 利用内存缓存实现0延迟重绘
    if (tab === 'idle') window.App.renderMarketIdle();
    if (tab === 'help') window.App.renderMarketHelp();
    if (tab === 'partner') window.App.renderMarketPartner();
};

export const MarketEngine = {
    // 🚀 上帝模式：防弹级拉取引擎
    async loadCommunityPosts() {
        try {
            const res = await fetch('/api/get-community?t=' + Date.now()); 
            const data = await res.json();
            
            if (!data.success) {
                if(window.App.showToast) window.App.showToast("集市加载失败: " + data.error, "error");
                return;
            }

            let idleItems = [], helpItems = [], partnerItems = [];
            
            // 🛡️ 百毒不侵的数据分拣
            (data.posts || []).forEach(post => {
                const title = post.title || ''; 
                let payload = {}; 
                try { payload = JSON.parse(post.content || '{}'); } catch(e) {}
                if (!payload) payload = {};

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
                    commonData.price = post.likes || 0;
                    idleItems.push(commonData);
                }
                else if (title.includes('[互助]')) helpItems.push(commonData);
                else if (title.includes('[找搭子]')) partnerItems.push(commonData);
            });

            // 存入全局缓存
            window.App.marketDataCache = { idle: idleItems, help: helpItems, partner: partnerItems };

            // 强制渲染三大版块
            this.renderMarketIdle(); 
            this.renderMarketHelp();
            this.renderMarketPartner();

            // 🌟 强行激活当前 Tab，防止 display:none 导致不可见
            const currentTab = window.App.currentMarketTab || 'idle';
            if (window.switchMarketTab) window.switchMarketTab(currentTab);

        } catch (error) {
            console.error("🚨 致命加载失败:", error);
        }
    },

    // ==========================================
    // 🛠️ 自愈型容器生成器 (防止 DOM 丢失导致白屏)
    // ==========================================
    getContainer(id, isGrid = false) {
        let el = document.getElementById(id);
        if (!el) {
            const parent = document.getElementById('page-market');
            if (parent) {
                el = document.createElement('div');
                el.id = id;
                el.style.display = isGrid ? 'grid' : 'none';
                el.style.padding = '0 20px 100px';
                if (isGrid) {
                    el.style.gridTemplateColumns = '1fr 1fr';
                    el.style.gap = '12px';
                }
                parent.appendChild(el);
                console.log(`[上帝模式] 自动为您补齐了丢失的容器: #${id}`);
            }
        }
        return el;
    },

    // ==========================================
    // 📦 渲染器
    // ==========================================
    // ==========================================
    // 📦 渲染器：闲置 (修复了 SVG 引号报错)
    // ==========================================
    renderMarketIdle() {
        const container = this.getContainer('idleWaterfall', true);
        if (!container) return;

        let processData = [...(window.App.marketDataCache?.idle || [])];
        const state = window.App.currentMarketFilter?.idle || { loc: 'all', cat: 'all', sort: 'newest' };

        // 简化版安全过滤
        if (state.cat === 'digital') processData = processData.filter(i => /手机|电脑|显示器|耳机|pad|线|卡/i.test(i.title));
        else if (state.cat === 'home') processData = processData.filter(i => /床|柜|桌|椅|灯|锅/i.test(i.title));

        if (processData.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:60px 0; grid-column:span 2;">该分类下暂无闲置，快去发布第一个吧！</div>';
            return;
        }

        let html = '';
        // 🌟 修复：使用纯净的 Base64 或者安全的内外层引号隔离兜底图，彻底告别语法报错
        const defaultImg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="%23F3F4F6"/><text x="50%" y="50%" font-size="12" fill="%239CA3AF" text-anchor="middle">暂无图</text></svg>';

        processData.forEach(item => {
            html += `
            <div class="waterfall-item" style="background:#FFF; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04); margin-bottom:12px;">
                <div style="height:150px; background:#F3F4F6; position:relative;">
                    <img src="${item.img || defaultImg}" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <div style="padding:10px;">
                    <div style="font-size:13px; font-weight:900; color:#111827; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${item.title}</div>
                    <div style="color:#EF4444; font-size:14px; font-weight:bold; margin-top:6px;">€ ${item.price}</div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    },

    renderMarketHelp() {
        const container = this.getContainer('helpListContainer', false);
        if (!container) return;

        let processData = [...(window.App.marketDataCache?.help || [])];
        const state = window.App.currentMarketFilter?.help || { loc: 'all', status: 'all', sort: 'newest' };

        if (state.status === 'urgent') processData = processData.filter(p => p.contentObj?.urgent === '十万火急');

        if (processData.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:60px 0;">暂无符合条件的悬赏哦~</div>';
            return;
        }

        let html = '';
        processData.forEach(post => {
            const isUrgent = post.contentObj?.urgent === '十万火急';
            const titleStr = post.title.replace('[互助] ', '');
            
            html += `
            <div style="background:#FFF; border-radius:16px; padding:15px; margin-bottom: 15px; box-shadow:0 4px 15px rgba(0,0,0,0.03); border:1px solid ${isUrgent ? '#FECACA' : '#F3F4F6'};">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:24px;">${post.avatar}</span>
                        <span style="font-size:13px; font-weight:bold; color:#374151; display:flex; align-items:center;">
                            ${post.author}
                            ${window.App.getUserBadgeHtml ? window.App.getUserBadgeHtml(post.email, post.credit) : ''}
                        </span>
                    </div>
                    <div style="font-size:16px; font-weight:900; color:#D97706;">💰 €${post.likes || 0}</div>
                </div>
                <div style="font-size:14px; font-weight:bold; color:#111827; margin-bottom:6px;">${isUrgent ? '🚨 ' : ''}${titleStr}</div>
                <div style="font-size:13px; color:#4B5563; line-height:1.5; margin-bottom:10px;">${post.contentObj?.desc || ''}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #E5E7EB; padding-top:10px;">
                    <div style="font-size:11px; color:#6B7280;">📍 ${post.contentObj?.location || '线上/面交'}</div>
                    <button style="background:#111827; color:#FFF; border:none; padding:6px 14px; border-radius:12px; font-size:12px; font-weight:bold;">接单</button>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    },

    renderMarketPartner() {
        const container = this.getContainer('partnerListContainer', false);
        if (!container) return;

        let processData = [...(window.App.marketDataCache?.partner || [])];
        
        if (processData.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:60px 0;">目前还没有搭子哦~</div>';
            return;
        }

        let html = '';
        processData.forEach(post => {
            const titleStr = post.title.replace('[找搭子] ', '');
            html += `
            <div style="background:#FFF; border-radius:16px; padding:15px; margin-bottom: 15px; box-shadow:0 4px 15px rgba(0,0,0,0.03); border:1px solid #E9D5FF;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                    <div style="font-size:15px; font-weight:900; color:#4C1D95; flex:1;">${titleStr}</div>
                    <div style="background:#F3E8FF; color:#7E22CE; padding:4px 8px; border-radius:8px; font-size:11px; font-weight:bold;">${post.contentObj?.tag || '组局'}</div>
                </div>
                <div style="font-size:13px; color:#4B5563; line-height:1.5; margin-bottom:12px;">${post.contentObj?.desc || ''}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #E5E7EB; padding-top:10px;">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span style="font-size:20px;">${post.avatar}</span>
                        <span style="font-size:12px; font-weight:bold; color:#6B7280;">${post.author}</span>
                    </div>
                    <button style="background:#8B5CF6; color:#FFF; border:none; padding:6px 14px; border-radius:12px; font-size:12px; font-weight:bold;">聊一聊</button>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    }
};
    // 4. 图片与语音引擎
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
        } catch (error) {
            console.error("🚨 图片解析失败:", error);
        }
    },

    renderIdleItemCards() {
        safeDOM.execute('idleImgPreviewContainer', container => {
            let html = '';
            selectedImagesArray.forEach((img) => { 
                html += `
                <div class="item-edit-card">
                    <img src="${img.preview}">
                    <div class="item-edit-inputs">
                        <input type="text" placeholder="物品名称 (如: 书桌)" value="${img.name}" onchange="window.App.updateItemData(${img.id}, 'name', this.value)">
                        <div class="price-input-row">
                            <span>€</span><input type="number" placeholder="价格" value="${img.price}" onchange="window.App.updateItemData(${img.id}, 'price', this.value)">
                        </div>
                    </div>
                    <div class="item-del-btn" onclick="window.App.removeImage(${img.id})">✕</div>
                </div>`; 
            });
            if (selectedImagesArray.length < 9) { 
                html += `<div class="upload-btn" onclick="window.App.safeDOM.execute('idleImgInput', el => el.click())" style="width: 100%; background: #FFF; border: 1px dashed #D1D5DB; margin-top: 5px;"><span style="font-size: 24px;">📷</span><span style="font-size: 13px; font-weight: bold; margin-left: 8px; color: #374151;">继续添加物品</span></div>`; 
            }
            container.innerHTML = html;
        });
    },

    updateItemData(id, field, value) {
        const item = selectedImagesArray.find(i => i.id === id);
        if (item) item[field] = value;
    },

    removeImage(id) {
        selectedImagesArray = selectedImagesArray.filter(i => i.id !== id);
        this.renderIdleItemCards();
    },

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
                    canvas.width = 0; canvas.height = 0;
                }; 
                img.onerror = () => resolve(previewUrl.split(',')[1]); 
                img.src = previewUrl;
            } catch (error) {
                resolve(previewUrl.split(',')[1]); 
            }
        });
    },

    toggleVoiceInput(type) {
        if (!recognition) return showToast('您的浏览器不支持语音输入，请手动打字哦~', 'warning');
        safeDOM.execute(`btnVoiceInput_${type}`, btn => {
            safeDOM.execute(`aiKeywords_${type}`, input => {
                if (btn.classList.contains('recording')) { recognition.stop(); return; }
                btn.classList.add('recording'); btn.innerText = '🔴'; 
                let oldPlaceholder = input.placeholder; input.placeholder = '听着呢...';
                recognition.start();
                recognition.onresult = (event) => { input.value += event.results[0][0].transcript; };
                recognition.onend = () => { 
                    btn.classList.remove('recording'); btn.innerText = '🎙️'; input.placeholder = oldPlaceholder; 
                    if(input.value.trim() !== '' && typeof window.App.generateAICopy === 'function') window.App.generateAICopy(type); 
                };
                recognition.onerror = () => { btn.classList.remove('recording'); btn.innerText = '🎙️'; input.placeholder = oldPlaceholder; };
            });
        });
    },

    // 5. 三大发布引擎
    async submitIdlePost() {
        try {
            const token = localStorage.getItem('hebao_token');
            if (!token) return showToast("请先前往「我的」页面登录哦！", "warning");
            if(selectedImagesArray.length === 0) return showToast("请至少传一张照片！", "warning");

            const loc = safeDOM.getValue('idleLocation', '');
            const aiDesc = safeDOM.getValue('aiKeywords_idle', '').trim(); 
            
            let calculatedTotalPrice = 0;
            selectedImagesArray.forEach(img => {
                const p = parseFloat(img.price);
                if (!isNaN(p)) calculatedTotalPrice += p;
            });

            safeDOM.execute('publishIdleSubmitBtn', btn => { btn.innerText = "上传云端..."; btn.style.pointerEvents = 'none'; });

            const myHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

            let finalItemsData = [];
            for (let img of selectedImagesArray) { 
                const taggedBase64 = await this.addTagToImage(img.preview, img.name, img.price); 
                const res = await fetch('/api/upload', { method: 'POST', headers: myHeaders, body: JSON.stringify({ imageBase64: taggedBase64 }) }); 
                const data = await res.json(); 
                if(data.success) finalItemsData.push({ id: img.id, url: data.url, name: img.name, price: img.price, is_sold: false }); 
                else throw new Error(data.error || "图片传到腾讯云失败");
            }
            
            safeDOM.execute('publishIdleSubmitBtn', btn => { btn.innerText = "写入数据库..."; });

            const myName = localStorage.getItem('hp_name') || '匿名管家';
            let firstItemName = finalItemsData.length > 0 && finalItemsData[0].name ? finalItemsData[0].name : '';
            let safeTitle = aiDesc || firstItemName || '闲置好物出清，看中私聊~';
            const postTitle = `[闲置] ${safeTitle}`;
            
            const dbPayload = {
                title: postTitle, name: postTitle, desc: safeTitle,
                content: JSON.stringify({ items: finalItemsData, location: loc, desc: safeTitle }),
                image_url: finalItemsData.length > 0 ? finalItemsData[0].url : '',
                author_name: myName, likes: calculatedTotalPrice, type: 'idle'
            };

            const dbRes = await fetch('/api/publish-community', { method: 'POST', headers: myHeaders, body: JSON.stringify(dbPayload) });
            const dbResult = await dbRes.json();
            if (!dbResult.success) throw new Error(dbResult.error || "被服务器拒绝，标题或内容不合规");
            
            showToast("🎉 发布成功！", "success"); 
            if(window.App && window.App.closeIdlePublish) window.App.closeIdlePublish(); 
            
            selectedImagesArray = []; 
            this.renderIdleItemCards(); 
            safeDOM.execute('aiKeywords_idle', el => el.value = ''); 
            this.loadCommunityPosts(); 
        } catch(e) { 
            showToast("发布失败：" + e.message, "error"); 
        } finally { 
            safeDOM.execute('publishIdleSubmitBtn', btn => { btn.innerText = "发布"; btn.style.pointerEvents = 'auto'; });
        }
    },

    async submitHelpPost() {
        try {
            const token = localStorage.getItem('hebao_token');
            if (!token) return showToast("请先登录哦！", "warning");

            const desc = safeDOM.getValue('helpDesc', '').trim();
            const reward = safeDOM.getValue('helpReward', '0');
            const time = safeDOM.getValue('helpTime', '');
            const loc = safeDOM.getValue('helpLocation', '');

            let type = '其他求助';
            const activeType = document.querySelector('#helpTypeGroup .pill.active');
            if (activeType) type = activeType.innerText;

            let urgent = '普通';
            const activeUrgent = document.querySelector('#helpUrgentGroup .pill.active');
            if (activeUrgent) urgent = activeUrgent.innerText;

            if (!desc) return showToast("请详细填写你需要什么帮助！", "warning");

            const submitBtn = document.querySelector('#publishHelpModal .fm-submit');
            if(submitBtn) { submitBtn.innerText = "发布中..."; submitBtn.style.pointerEvents = 'none'; }

            const myName = localStorage.getItem('hp_name') || '匿名管家';
            const postTitle = `[互助] ${type} - ${urgent}`;

            const dbPayload = {
                title: postTitle,
                content: JSON.stringify({ desc, time, location: loc, urgent, type }),
                image_url: '', author_name: myName, likes: parseFloat(reward) || 0, type: 'help'
            };

            const dbRes = await fetch('/api/publish-community', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(dbPayload) });
            const dbResult = await dbRes.json();
            if (!dbResult.success) throw new Error(dbResult.error || "发布失败");

            showToast("🎉 悬赏发布成功！", "success");
            if(window.App && window.App.closeModal) window.App.closeModal('publishHelpModal');
            safeDOM.execute('helpDesc', el => el.value = '');
            this.loadCommunityPosts(); 
        } catch(e) {
            showToast("发布失败：" + e.message, "error");
        } finally {
            const submitBtn = document.querySelector('#publishHelpModal .fm-submit');
            if(submitBtn) { submitBtn.innerText = "发布"; submitBtn.style.pointerEvents = 'auto'; }
        }
    },

    async submitPartnerPost() {
        try {
            const token = localStorage.getItem('hebao_token');
            if (!token) return showToast("请先登录哦！", "warning");

            const title = safeDOM.getValue('partnerTitle', '').trim();
            const desc = safeDOM.getValue('partnerDesc', '').trim();
            const date = safeDOM.getValue('partnerDate', '');
            const loc = safeDOM.getValue('partnerLocation', '');
            const mbti = safeDOM.getValue('partnerMbti', 'all');

            let tag = '周末组局';
            const activeTag = document.querySelector('#partnerTagGroup .pill.active');
            if (activeTag) tag = activeTag.innerText;

            if (!title || !desc) return showToast("标题和计划详情不能为空哦！", "warning");

            const submitBtn = document.querySelector('#publishPartnerModal .fm-submit');
            if(submitBtn) { submitBtn.innerText = "召唤中..."; submitBtn.style.pointerEvents = 'none'; }

            const myName = localStorage.getItem('hp_name') || '匿名管家';
            const postTitle = `[找搭子] ${title}`;

            const dbPayload = {
                title: postTitle,
                content: JSON.stringify({ desc, date, location: loc, mbti, tag }),
                image_url: '', author_name: myName, likes: 0, type: 'partner'
            };

            const dbRes = await fetch('/api/publish-community', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(dbPayload) });
            const dbResult = await dbRes.json();
            if (!dbResult.success) throw new Error(dbResult.error || "发布失败");

            showToast("🎉 搭子信号已发出！", "success");
            if(window.App && window.App.closeModal) window.App.closeModal('publishPartnerModal');
            safeDOM.execute('partnerTitle', el => el.value = '');
            safeDOM.execute('partnerDesc', el => el.value = '');
            this.loadCommunityPosts(); 
        } catch(e) {
            showToast("发布失败：" + e.message, "error");
        } finally {
            const submitBtn = document.querySelector('#publishPartnerModal .fm-submit');
            if(submitBtn) { submitBtn.innerText = "发布"; submitBtn.style.pointerEvents = 'auto'; }
        }
    },

    // 6. 详情与聊天路由引擎 (带完美逗号)
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
                                <div class="pd-seller-time" style="font-size:11px; color:#9CA3AF;">发布于近期</div>
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
                        <div class="${cardClass}" onclick="${isSold ? '' : `window.App.toggleItemCard(this, '${item.id}', ${priceNum})`}">
                            <img class="pd-item-img" src="${item.url || 'https://via.placeholder.com/400'}" style="height: 220px;">
                            <div class="pd-item-overlay">
                                <div style="display:flex; justify-content:space-between; align-items:flex-end; width:100%;">
                                    <div style="flex:1; overflow:hidden; padding-right:10px;">
                                        <div class="pd-item-name">${item.name || '闲置好物'}</div>
                                        <div class="pd-item-price">€${item.price}</div>
                                    </div>
                                    ${isSold ? '<div class="pd-sold-badge">已售出</div>' : `<input type="checkbox" class="custom-checkbox" id="chk_${item.id}" onclick="event.stopPropagation(); window.App.toggleItemCheckbox(this, '${item.id}', ${priceNum})">`}
                                </div>
                            </div>
                        </div>`;
                    });
                }
                listContainer.innerHTML = itemsHtml;
            });
            modalEl.style.display = 'block'; 
        } catch (error) {
            console.error("详情页报错:", error);
        }
    },

    toggleItemCard(cardEl, itemId, price) {
        safeDOM.execute(`chk_${itemId}`, chk => {
            chk.checked = !chk.checked; 
            this.toggleItemCheckbox(chk, itemId, price);
        });
    },

    toggleItemCheckbox(checkbox, itemId, price) {
        if (checkbox.checked) {
            selectedItemIds.add(itemId); currentTotalPrice += price;
        } else {
            selectedItemIds.delete(itemId); currentTotalPrice -= price;
        }
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
    }, // 👈 就是这个救命的逗号！

    initiateHelpChat(postId) {
        const post = mockHelpItems.find(p => String(p.id) === String(postId));
        if (!post) return showToast("哎呀，帖子似乎走丢了", "error");
        const cleanTitle = post.title.replace('[互助] ', '');
        ChatEngine.openChat(post.user_id || 'test_id', post.author_name || '悬赏主', post.avatar || '👻', post.id, `悬赏: ${cleanTitle}`, post.likes || 0, '', false, 'help');
        safeDOM.execute('chatInput', input => input.value = `哈喽！我看到你的悬赏【${cleanTitle}】，我可以接单哦，请问还需要吗？`);
    }, // 👈 这个逗号也很重要！

    initiatePartnerChat(postId) {
        const post = mockPartnerItems.find(p => String(p.id) === String(postId));
        if (!post) return showToast("哎呀，帖子似乎走丢了", "error");
        const cleanTitle = post.title.replace('[找搭子] ', '');
        ChatEngine.openChat(post.user_id || 'test_id', post.author_name || '发起人', post.avatar || '👻', post.id, `搭子局: ${cleanTitle}`, 0, '', false, 'partner');
        safeDOM.execute('chatInput', input => input.value = `哈喽！我对你的搭子局【${cleanTitle}】很感兴趣，能加我一个吗？🙋`);
    } // 最后一个可以不加逗号
};

// 💥 终极暴力兼容绑定机制
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
