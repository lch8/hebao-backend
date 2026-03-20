// ============================================================================
// js/modules/market.js - 集市与发布引擎 (全栖满血完整版 - 修复JSON与补齐多图)
// ============================================================================
import { showToast } from '../core/toast.js';
import { safeDOM } from '../core/dom.js'; 
import { ModalManager } from '../components/modals.js';
import { ChatEngine } from './chat.js'; 

// 🌟 全局核心变量区
let selectedImagesArray = [];
let mockIdleItems = []; 
let mockHelpItems = []; 
let mockPartnerItems = []; 
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

window.App.currentMarketFilter = {
    idle: { loc: 'all', cat: 'all', sort: 'newest' },
    help: { loc: 'all', status: 'all', sort: 'newest' },
    partner: { loc: 'all', type: 'all', sort: 'newest' }
};

// ==========================================
// 1. 动态下拉筛选矩阵 (原生 UI)
// ==========================================
window.App.renderFilterBar = function(tab) {
    if (tab !== window.App.currentMarketTab) return;
    const container = document.getElementById('dynamicFilterBar');
    if (!container) return;

    const state = window.App.currentMarketFilter[tab];
    let html = '';

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

window.App.onFilterChange = function(tab, key, value) {
    window.App.currentMarketFilter[tab][key] = value;
    if (value === 'nearby' || value === 'nearest') {
        if(window.App.showToast) window.App.showToast("📍 正在请求高精度定位权限...", "info");
    }
    window.App.renderFilterBar(tab); 
    if (tab === 'idle') window.App.renderMarketIdle();
    if (tab === 'help') window.App.renderMarketHelp();
    if (tab === 'partner') window.App.renderMarketPartner();
};

export const MarketEngine = {
    // ==========================================
    // 2. 🛡️ 防弹级数据拉取与解析引擎 (修复 JSON 乱码)
    // ==========================================
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
                
                // 🌟 强力解析：防止双重 Stringify 导致的 JSON 乱码外溢
                try {
                    payload = JSON.parse(post.content || '{}');
                    if (typeof payload === 'string') payload = JSON.parse(payload); 
                } catch(e) {
                    payload = { desc: post.content }; // 实在解不开，就当做纯文本
                }

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

            window.App.marketDataCache = { idle: idleItems, help: helpItems, partner: partnerItems };
            window.allCommunityPostsCache = data.posts || []; // 给详情页用的全局备份

            this.renderMarketIdle(); 
            this.renderMarketHelp();
            this.renderMarketPartner();

            const currentTab = window.App.currentMarketTab || 'idle';
            if (window.switchMarketTab) window.switchMarketTab(currentTab);

        } catch (error) {
            console.error("🚨 致命加载失败:", error);
        }
    },

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
            }
        }
        return el;
    },

    // ==========================================
    // 3. 🎨 三大版块纯净渲染器
    // ==========================================
   // ==========================================
    // 📦 渲染器：闲置 (带城市、实名徽章、多图角标)
    // ==========================================
    renderMarketIdle() {
        const container = this.getContainer('idleWaterfall', true);
        if (!container) return;

        let processData = [...(window.App.marketDataCache?.idle || [])];
        const state = window.App.currentMarketFilter?.idle || { loc: 'all', cat: 'all', sort: 'newest' };

        if (state.cat === 'digital') processData = processData.filter(i => /手机|电脑|显示器|耳机|pad|线|卡/i.test(i.title));
        else if (state.cat === 'home') processData = processData.filter(i => /床|柜|桌|椅|灯|锅/i.test(i.title));

        if (processData.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:60px 0; grid-column:span 2;">该分类下暂无闲置，快去发布第一个吧！</div>';
            return;
        }

        let html = '';
        const defaultImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23F3F4F6'/%3E%3Ctext x='50%25' y='50%25' font-size='12' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'%3E暂无图%3C/text%3E%3C/svg%3E";

        processData.forEach(item => {
            const itemCount = item.contentObj?.items?.length || 1;
            const multiBadge = itemCount > 1 ? `<div style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.65); color:#FFF; font-size:10px; padding:3px 8px; border-radius:12px; font-weight:bold; backdrop-filter:blur(4px);">📸 ${itemCount}件</div>` : '';
            
            // 🌟 提取新增的城市与邮编
            const loc = (item.contentObj?.location || '同城自提').replace('📍', '').trim();
            const city = item.contentObj?.city || '荷兰';
            const creditStr = item.credit ? `${item.credit}分` : '100分';
            
            // 🌟 提取用户实名徽章
            const badges = window.App.getUserBadgeHtml ? window.App.getUserBadgeHtml(item.email, item.credit) : '';

            html += `
            <div class="waterfall-item" onclick="window.App.openCommunityPost('${item.id}')" style="background:#FFF; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04); margin-bottom:12px; cursor:pointer;">
                <div style="height:150px; background:#F3F4F6; position:relative;">
                    <img src="${item.img || defaultImg}" style="width:100%; height:100%; object-fit:cover;">
                    ${multiBadge}
                </div>
                <div style="padding:10px;">
                    <div style="font-size:13px; font-weight:900; color:#111827; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${item.title}</div>
                    <div style="color:#EF4444; font-size:14px; font-weight:bold; margin-top:6px;">€ ${item.price}</div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:10px; border-top:1px dashed #F3F4F6; padding-top:8px;">
                        
                        <div style="display:flex; align-items:center; gap:6px; flex:1; min-width:0;">
                            <span style="font-size:18px;">${item.avatar}</span>
                            <div style="display:flex; flex-direction:column; gap:2px; overflow:hidden;">
                                <div style="display:flex; align-items:center; gap:4px;">
                                    <span style="font-size:11px; font-weight:bold; color:#374151; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:60px;">${item.author}</span>
                                    ${badges}
                                </div>
                                <span style="font-size:10px; color:#D97706; font-weight:bold; background:#FEF3C7; padding:1px 4px; border-radius:4px; width:fit-content;">⭐ ${creditStr}</span>
                            </div>
                        </div>

                        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:2px; flex-shrink:0;">
                            <span style="font-size:11px; font-weight:900; color:#4B5563;">🏙️ ${city}</span>
                            <span style="font-size:9px; color:#9CA3AF;">📍 ${loc}</span>
                        </div>
                    </div>
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
            // 🌟 精准提取正文：确保不会把 JSON 暴漏给用户
            const descStr = post.contentObj?.desc || post.contentObj?.text || '点击查看详情...';
            
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
                <div style="font-size:13px; color:#4B5563; line-height:1.5; margin-bottom:10px; white-space: pre-wrap;">${descStr}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #E5E7EB; padding-top:10px;">
                    <div style="font-size:11px; color:#6B7280;">📍 ${post.contentObj?.location || '线上/面交'}</div>
                    <button style="background:#111827; color:#FFF; border:none; padding:6px 14px; border-radius:12px; font-size:12px; font-weight:bold; cursor:pointer;" onclick="window.App.initiateHelpChat('${post.id}')">接单</button>
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
            // 🌟 精准提取正文：确保不会把 JSON 暴漏给用户
            const descStr = post.contentObj?.desc || post.contentObj?.text || '点击查看计划详情...';

            html += `
            <div style="background:#FFF; border-radius:16px; padding:15px; margin-bottom: 15px; box-shadow:0 4px 15px rgba(0,0,0,0.03); border:1px solid #E9D5FF;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                    <div style="font-size:15px; font-weight:900; color:#4C1D95; flex:1;">${titleStr}</div>
                    <div style="background:#F3E8FF; color:#7E22CE; padding:4px 8px; border-radius:8px; font-size:11px; font-weight:bold;">${post.contentObj?.tag || '组局'}</div>
                </div>
                <div style="font-size:13px; color:#4B5563; line-height:1.5; margin-bottom:12px; white-space: pre-wrap;">${descStr}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #E5E7EB; padding-top:10px;">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span style="font-size:20px;">${post.avatar}</span>
                        <span style="font-size:12px; font-weight:bold; color:#6B7280;">${post.author}</span>
                    </div>
                    <button style="background:#8B5CF6; color:#FFF; border:none; padding:6px 14px; border-radius:12px; font-size:12px; font-weight:bold; cursor:pointer;" onclick="window.App.initiatePartnerChat('${post.id}')">聊一聊</button>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    },

    // ==========================================
    // 4. 📸 满血补齐：多图上传、预览与高级 Canvas 标签
    // ==========================================
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
            
            // 🌟 强制赋予容器横向滚动与间距样式，防止被外部 CSS 干扰
            container.style.display = 'flex';
            container.style.gap = '14px';
            container.style.overflowX = 'auto';
            container.style.padding = '4px 4px 16px 4px';

            selectedImagesArray.forEach((img) => { 
                html += `
                <div class="item-edit-card" style="width: 135px; flex-shrink: 0; position: relative; border: 1px solid #E5E7EB; border-radius: 12px; background: #FFF; box-shadow: 0 4px 12px rgba(0,0,0,0.05); display: flex; flex-direction: column; overflow: hidden;">
                    
                    <img src="${img.preview}" style="width: 100%; height: 120px; object-fit: cover; display: block; border-bottom: 1px solid #F3F4F6;">
                    
                    <div style="padding: 12px 10px; display: flex; flex-direction: column; gap: 10px; background: #FFF;">
                        <input type="text" placeholder="物品名称 (如: 书桌)" value="${img.name}" onchange="window.App.updateItemData(${img.id}, 'name', this.value)" style="width: 100%; box-sizing: border-box; padding: 8px 10px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 13px; font-weight: bold; color: #111827; outline: none; background: #F8FAFC; transition: all 0.2s;">
                        
                        <div style="display: flex; align-items: center; border: 1px solid #D1D5DB; border-radius: 8px; padding: 0 10px; background: #F8FAFC; transition: all 0.2s;">
                            <span style="font-size: 13px; color: #64748B; font-weight: 900;">€</span>
                            <input type="number" placeholder="价格" value="${img.price}" onchange="window.App.updateItemData(${img.id}, 'price', this.value)" style="width: 100%; box-sizing: border-box; padding: 8px 6px; border: none; background: transparent; font-size: 14px; font-weight: bold; color: #EF4444; outline: none;">
                        </div>
                    </div>
                    
                    <div class="item-del-btn" onclick="window.App.removeImage(${img.id})" style="position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.65); color: #FFF; width: 26px; height: 26px; border-radius: 13px; display: flex; justify-content: center; align-items: center; font-size: 14px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.2); backdrop-filter: blur(4px);">✕</div>
                </div>`; 
            });

            if (selectedImagesArray.length < 9) { 
                html += `
                <div class="upload-btn" onclick="document.getElementById('idleImgInput').click()" style="width: 135px; min-height: 235px; flex-shrink: 0; background: #F8FAFC; border: 2px dashed #CBD5E1; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; color: #64748B; transition: all 0.2s;">
                    <span style="font-size: 32px; margin-bottom: 8px;">📸</span>
                    <span style="font-size: 14px; font-weight: 900; color: #334155;">继续加图</span>
                    <span style="font-size: 11px; margin-top: 4px; font-weight: bold; color: #94A3B8;">(${selectedImagesArray.length}/9)</span>
                </div>`; 
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

    // Canvas 高级黑科技：将文字和价格动态合成到图片左下角，生成带标签的水印大图
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
                    
                    // 画个带圆角的黑色半透明背景框
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'; ctx.beginPath(); if(ctx.roundRect) { ctx.roundRect(x, y, textWidth + paddingX * 2.2, fontSize + paddingY * 2, (fontSize + paddingY * 2) / 2); } else { ctx.fillRect(x, y, textWidth + paddingX * 2.2, fontSize + paddingY * 2); } ctx.fill();
                    // 画个小黄点装饰
                    ctx.fillStyle = '#FCD34D'; ctx.beginPath(); ctx.arc(x + paddingX * 0.9, y + (fontSize + paddingY * 2)/2, fontSize * 0.25, 0, Math.PI * 2); ctx.fill();
                    // 写白字
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

    // 🎙️ 语音智能录入接口
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

    // 兼容原版的旧发帖函数占位 (新架构在 ui-3.js 中通过抽屉提交，保留防止报错)
    async submitIdlePost() {},
    async submitHelpPost() {},
    async submitPartnerPost() {},

    // ==========================================
    // 5. 🛍️ 详情页与交易连线引擎
    // ==========================================
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
                                <div class="pd-seller-time" style="font-size:11px; color:#9CA3AF;">⭐ 信用分: ${post.credit || 100}分</div>
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
        } catch (error) {
            console.error("详情页报错:", error);
        }
    },

    // 🌟 新增：全屏大图预览引擎 (自带黑色磨砂沉浸背景)
    viewImageFull(url) {
        let overlay = document.getElementById('fullImageOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'fullImageOverlay';
            overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.92); z-index:999999; display:flex; justify-content:center; align-items:center; cursor:zoom-out; flex-direction:column; backdrop-filter:blur(5px); opacity:0; transition:opacity 0.2s;';
            overlay.onclick = () => {
                overlay.style.opacity = '0';
                setTimeout(() => { overlay.style.display = 'none'; }, 200);
            };
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = `<img src="${url}" style="max-width:95vw; max-height:85vh; object-fit:contain; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.5);"><div style="color:rgba(255,255,255,0.7); margin-top:20px; font-size:13px; font-weight:bold; letter-spacing:1px;">点击任意处关闭</div>`;
        
        overlay.style.display = 'flex';
        setTimeout(() => { overlay.style.opacity = '1'; }, 10);
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
    },

    initiateHelpChat(postId) {
        const post = (window.allCommunityPostsCache || []).find(p => String(p.id) === String(postId));
        if (!post) return showToast("哎呀，帖子似乎走丢了", "error");
        const cleanTitle = post.title.replace('[互助] ', '');
        ChatEngine.openChat(post.user_id || 'test_id', post.author_name || '悬赏主', post.avatar || '👻', post.id, `悬赏: ${cleanTitle}`, post.likes || 0, '', false, 'help');
        safeDOM.execute('chatInput', input => input.value = `哈喽！我看到你的悬赏【${cleanTitle}】，我可以接单哦，请问还需要吗？`);
    },

    initiatePartnerChat(postId) {
        const post = (window.allCommunityPostsCache || []).find(p => String(p.id) === String(postId));
        if (!post) return showToast("哎呀，帖子似乎走丢了", "error");
        const cleanTitle = post.title.replace('[找搭子] ', '');
        ChatEngine.openChat(post.user_id || 'test_id', post.author_name || '发起人', post.avatar || '👻', post.id, `搭子局: ${cleanTitle}`, 0, '', false, 'partner');
        safeDOM.execute('chatInput', input => input.value = `哈喽！我对你的搭子局【${cleanTitle}】很感兴趣，能加我一个吗？🙋`);
    }
};

// ==========================================
// 🌟 终极暴力防爆：全面覆盖挂载 window.App
// ==========================================
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
