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
    // 1. 社区数据拉取 (适配最新的数据结构与缓存引擎)
   // 1. 社区数据拉取 (破除浏览器缓存版)
    // 1. 社区数据拉取 (破除浏览器缓存 + 照妖镜报警版)
    async loadCommunityPosts() {
        try {
            const res = await fetch('/api/get-community?t=' + Date.now()); 
            const data = await res.json();
            
            // 🚨 抓虫魔法：如果后端报错，直接弹在屏幕上！
            if (!data.success) {
                console.error("🚨 后端传回的致命死因:", data.error);
                if (window.App && window.App.showToast) {
                    window.App.showToast("集市加载失败: " + data.error, "error");
                } else {
                    alert("集市加载失败: " + data.error);
                }
                return; // 终止渲染
            }

            if (data.success && data.posts) {
                let idleItems = [];
                // ... (下面原有的解析与渲染代码保持完全不变) ...
                let helpItems = [];
                let partnerItems = [];
                
                window.allCommunityPostsCache = data.posts; 
                
                data.posts.forEach(post => {
                    const title = post.title || ''; 
                    const time = post.created_at ? new Date(post.created_at).getTime() : Date.now(); 
                    let payload; 
                    try { payload = JSON.parse(post.content); } catch(e) { payload = { oldText: post.content }; }

                    const commonData = {
                        ...post,
                        author: post.author_name,
                        avatar: post.avatar || '😎',
                        email: post.email,    
                        credit: post.credit,  
                        contentObj: payload
                    };

                    if (title.includes('[闲置]')) {
                        idleItems.push({ 
                            ...commonData,
                            id: post.id, 
                            title: title.replace('[闲置] ', ''), 
                            img: post.image_url, 
                            price: post.likes || 0,
                            timestamp: time, 
                            isSold: payload.isSold || false, 
                            itemCount: payload.itemCount || 1 
                        });
                    }
                    else if (title.includes('[互助]')) helpItems.push(commonData);
                    else if (title.includes('[找搭子]')) partnerItems.push(commonData);
                });

                if (window.App && window.App.renderMarketIdle) {
                    window.App.renderMarketIdle(idleItems); 
                    window.App.renderMarketHelp(helpItems);
                    window.App.renderMarketPartner(partnerItems);
                }
            }
        } catch (error) {
            console.error("🚨 [Market] 社区数据拉取失败:", error);
        }
    },

    // 2. 过滤器 (代理模式)
    applyFilters(type) {
        // 🌟 旧的 DOM 查找逻辑（导致报错的罪魁祸首）已全部干掉！
        // 现在的过滤逻辑已经完美内聚在了 render 函数里。
        // 如果外部有旧代码调用了 applyFilters，直接让它触发不带参数的 render 函数即可（会自动读取缓存过滤）。
        if (window.App) {
            if (type === 'idle' && window.App.renderMarketIdle) window.App.renderMarketIdle();
            if (type === 'help' && window.App.renderMarketHelp) window.App.renderMarketHelp();
            if (type === 'partner' && window.App.renderMarketPartner) window.App.renderMarketPartner();
        }
    },

    renderMarketIdle(data) { 
        if (data) window.App.marketDataCache.idle = data; 
        window.App.renderFilterBar('idle'); 

        let processData = [...(window.App.marketDataCache.idle || [])];
        const state = window.App.currentMarketFilter.idle;

        // 🌟 1. 弹性距离过滤 (神仙逻辑：利用邮箱后缀匹配同城)
        if (state.loc === 'city') {
            const myDomain = (localStorage.getItem('hp_email') || '').split('@')[1];
            if (myDomain) processData = processData.filter(item => (item.email || '').includes(myDomain));
        } else if (state.loc === 'nearby') {
            processData = processData.filter(() => Math.random() > 0.4); // 模拟精确定位筛选
        }

        // 🌟 2. 分类过滤 (利用正则模糊匹配标题模拟，后期接真实字段)
        if (state.cat === 'digital') processData = processData.filter(i => /手机|电脑|显示器|耳机|pad|线|卡/i.test(i.title));
        else if (state.cat === 'home') processData = processData.filter(i => /床|柜|锅|椅|桌|灯|锅|碗/i.test(i.title));
        else if (state.cat === 'transport') processData = processData.filter(i => /车|卡|票|代步/i.test(i.title));

        // 🌟 3. 排序
        if (state.sort === 'nearest') processData.sort(() => Math.random() - 0.5); // 模拟距离排序

        safeDOM.execute('idleWaterfall', container => {
            if(!processData || processData.length === 0) return container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:60px 0; grid-column:span 2;">没有找到符合该条件的闲置哦~ 调整筛选试试</div>'; 
            let html = ''; 
            processData.forEach(item => { 
                const soldOverlayHtml = item.isSold ? `<div class="wf-sold-overlay"><div class="wf-sold-text">已售空</div></div>` : ''; 
                const countBadge = item.itemCount > 1 ? `<div class="waterfall-count-badge">共 ${item.itemCount} 件</div>` : ''; 
                const realEmail = item.email || '';
                const realCredit = item.credit !== undefined ? item.credit : 100;

                html += `
                <div class="waterfall-item" onclick="openCommunityPost('${item.id || 0}')">
                    <div class="wf-img-box">${soldOverlayHtml}${countBadge}<img class="wf-img" src="${item.img || ''}"></div>
                    <div class="wf-info">
                        <div class="wf-title" style="${item.isSold ? 'color:#9CA3AF;' : ''}">${item.title || '无题'}</div>
                        <div class="wf-price-row">
                            <div><span class="wf-currency" style="${item.isSold ? 'color:#9CA3AF;' : ''}">€</span><span class="wf-price" style="${item.isSold ? 'color:#9CA3AF;' : ''}">${item.price || '0'}</span></div>
                        </div>
                        <div style="display: flex; align-items: center; margin-top: 8px; border-top: 1px dashed #F3F4F6; padding-top: 8px; font-size: 11px; color: #64748B; font-weight: bold;">
                            <span style="margin-right: 4px; font-size: 14px;">${item.avatar || '😎'}</span>
                            <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.author || '荷包蛋'}</span>
                            ${window.App.getUserBadgeHtml ? window.App.getUserBadgeHtml(realEmail, realCredit) : ''}
                        </div>
                    </div>
                </div>`; 
            }); 
            container.innerHTML = html; 
        });
    },

    renderMarketHelp(data) {
        if (data) window.App.marketDataCache.help = data;
        window.App.renderFilterBar('help');

        let processData = [...(window.App.marketDataCache.help || [])];
        const state = window.App.currentMarketFilter.help;

        // 过滤链
        if (state.loc === 'city') {
            const myDomain = (localStorage.getItem('hp_email') || '').split('@')[1];
            if (myDomain) processData = processData.filter(p => (p.email || '').includes(myDomain));
        } else if (state.loc === 'online') {
            processData = processData.filter(p => { try{ return JSON.parse(p.content).location.includes('线上'); }catch(e){return false;} });
        }

        if (state.status === 'urgent') processData = processData.filter(p => { try{ return JSON.parse(p.content).urgent === '十万火急'; }catch(e){return false;} });
        
        if (state.sort === 'reward') processData.sort((a,b) => (b.likes || 0) - (a.likes || 0));

        safeDOM.execute('helpListContainer', container => {
            if(!processData || processData.length === 0) return container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:60px 0;">暂无符合条件的悬赏哦~</div>';
            let html = '';
            processData.forEach(post => {
                let content = {}; try { content = JSON.parse(post.content); } catch(e){}
                const isUrgent = content.urgent === '十万火急';
                const realEmail = post.email || '';
                const realCredit = post.credit !== undefined ? post.credit : 100;

                html += `
                <div style="background:#FFF; border-radius:16px; padding:15px; margin-bottom: 15px; box-shadow:0 4px 15px rgba(0,0,0,0.03); border:1px solid ${isUrgent ? '#FECACA' : '#F3F4F6'}; break-inside: avoid; display: inline-block; width: 100%; box-sizing: border-box;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:24px;">${post.avatar || '👻'}</span>
                            <span style="font-size:13px; font-weight:bold; color:#374151; display:flex; align-items:center;">
                                ${post.author_name}
                                ${window.App.getUserBadgeHtml ? window.App.getUserBadgeHtml(realEmail, realCredit) : ''}
                            </span>
                        </div>
                        <div style="font-size:16px; font-weight:900; color:#D97706;">💰 €${post.likes || 0}</div>
                    </div>
                    <div style="font-size:14px; font-weight:bold; color:#111827; margin-bottom:6px;">${post.title.replace('[互助] ', '')}</div>
                    <div style="font-size:13px; color:#4B5563; line-height:1.5; margin-bottom:10px;">${content.desc || ''}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #E5E7EB; padding-top:10px;">
                        <div style="font-size:11px; color:#6B7280;">⏰ ${content.time ? content.time.replace('T', ' ') : '越快越好'} | 📍 ${content.location || '线上/面交'}</div>
                        <button onclick="window.App.initiateHelpChat('${post.id}')" style="background:#111827; color:#FFF; border:none; padding:6px 14px; border-radius:12px; font-size:12px; font-weight:bold; cursor:pointer;">接单</button>
                    </div>
                </div>`;
            });
            container.innerHTML = html;
        });
    },

    renderMarketPartner(data) {
        if (data) window.App.marketDataCache.partner = data;
        window.App.renderFilterBar('partner');

        let processData = [...(window.App.marketDataCache.partner || [])];
        const state = window.App.currentMarketFilter.partner;

        // 过滤链
        if (state.loc === 'city') {
            const myDomain = (localStorage.getItem('hp_email') || '').split('@')[1];
            if (myDomain) processData = processData.filter(p => (p.email || '').includes(myDomain));
        }

        if (state.type === 'mbti_e') processData = processData.filter(p => { try { return JSON.parse(p.content).mbti === 'e'; } catch(e) { return false; } });
        else if (state.type === 'mbti_i') processData = processData.filter(p => { try { return JSON.parse(p.content).mbti === 'i'; } catch(e) { return false; } });
        else if (state.type === 'food') processData = processData.filter(p => { try { return JSON.parse(p.content).tag === '饭搭子'; } catch(e) { return false; } });

        safeDOM.execute('partnerListContainer', container => {
            if(!processData || processData.length === 0) return container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:60px 0;">目前还没有符合该条件的搭子哦~</div>';
            let html = '';
            processData.forEach(post => {
                let content = {}; try { content = JSON.parse(post.content); } catch(e){}
                const mbtiTag = content.mbti === 'e' ? '🔥 寻 E 人' : (content.mbti === 'i' ? '🍵 寻 I 人' : '✨ MBTI 不限');
                const realEmail = post.email || '';
                const realCredit = post.credit !== undefined ? post.credit : 100;

                html += `
                <div style="background:#FFF; border-radius:16px; padding:15px; margin-bottom: 15px; box-shadow:0 4px 15px rgba(0,0,0,0.03); border:1px solid #E9D5FF; break-inside: avoid; display: inline-block; width: 100%; box-sizing: border-box;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                        <div style="font-size:15px; font-weight:900; color:#4C1D95; flex:1;">${post.title.replace('[找搭子] ', '')}</div>
                        <div style="background:#F3E8FF; color:#7E22CE; padding:4px 8px; border-radius:8px; font-size:11px; font-weight:bold;">${content.tag || '组局'}</div>
                    </div>
                    <div style="font-size:13px; color:#4B5563; line-height:1.5; margin-bottom:12px;">${content.desc || ''}</div>
                    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">
                        <span style="font-size:11px; color:#6B7280; background:#F3F4F6; padding:4px 8px; border-radius:6px;">⏰ ${content.date || '商议'}</span>
                        <span style="font-size:11px; color:#6B7280; background:#F3F4F6; padding:4px 8px; border-radius:6px;">📍 ${content.location || '随缘'}</span>
                        <span style="font-size:11px; color:#D97706; background:#FEF3C7; padding:4px 8px; border-radius:6px;">${mbtiTag}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #E5E7EB; padding-top:10px;">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span style="font-size:20px;">${post.avatar || '👻'}</span>
                            <span style="font-size:12px; font-weight:bold; color:#6B7280; display:flex; align-items:center;">
                                ${post.author_name}
                                ${window.App.getUserBadgeHtml ? window.App.getUserBadgeHtml(realEmail, realCredit) : ''}
                            </span>
                        </div>
                        <button onclick="window.App.initiatePartnerChat('${post.id}')" style="background:#8B5CF6; color:#FFF; border:none; padding:6px 14px; border-radius:12px; font-size:12px; font-weight:bold; cursor:pointer;">聊一聊</button>
                    </div>
                </div>`;
            });
            container.innerHTML = html;
        });
    },
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
