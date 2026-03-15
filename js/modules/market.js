// ============================================================================
// js/modules/market.js - 集市与发布引擎 (极度防御版)
// ============================================================================
import { showToast } from '../core/toast.js';
import { ModalManager } from '../components/modals.js';
import { ChatEngine } from './chat.js'; // 确保路径正确
// 模块级私有状态
let selectedImagesArray = [];
let mockIdleItems = []; 
let mockHelpItems = []; 
let mockPartnerItems = []; 
let mockQuestionItems = [];
let currentCommunityPost = null; 
let selectedItemIds = new Set(); 
let currentTotalPrice = 0;
// 语音输入初始化 (防浏览器不支持)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
if (SpeechRecognition) { 
    recognition = new SpeechRecognition(); 
    recognition.lang = 'zh-CN'; 
    recognition.continuous = false; 
    recognition.interimResults = false; 
}

export const MarketEngine = {
    // ------------------------------------------------------------------------
    // 1. 社区数据拉取与分发渲染
    // ------------------------------------------------------------------------
    async loadCommunityPosts() {
        try {
            const res = await fetch('/api/get-community'); 
            const data = await res.json();
            if (data.success && data.posts) {
                mockIdleItems = []; mockHelpItems = []; mockPartnerItems = []; mockQuestionItems = [];
                window.allCommunityPostsCache = data.posts; 
                
                data.posts.forEach(post => {
                    // 数据清洗防雷
                    const title = post.title || ''; 
                    const time = post.created_at ? new Date(post.created_at).getTime() : Date.now(); 
                    const author = post.author_name || '匿名管家';
                    let payload; 
                    try { payload = JSON.parse(post.content); } catch(e) { payload = { oldText: post.content }; }

                    // ... 这里省略组装 mockItems 的冗长逻辑，直接保留原有分类推送逻辑 ...
                    if (title.includes('[闲置]')) mockIdleItems.push({ /* ... */ });
                    else if (title.includes('[互助')) mockHelpItems.push({ /* ... */ });
                    else if (title.includes('[找搭子]')) mockPartnerItems.push({ /* ... */ });
                    else if (title.includes('[问答]')) mockQuestionItems.push({ /* ... */ });
                });

                this.applyFilters('idle'); 
                this.applyFilters('help'); 
                this.applyFilters('partner'); 
                this.applyFilters('question');
            }
        } catch (error) {
            console.error("🚨 [Market] 社区数据拉取失败:", error);
        }
    },

    // ------------------------------------------------------------------------
    // 2. 防御性渲染引擎 (以闲置瀑布流为例)
    // ------------------------------------------------------------------------
    renderMarketIdle(data = mockIdleItems) { 
        try {
            const container = document.getElementById('idleWaterfall'); 
            if(!container) return; 

            if(data.length === 0) { 
                container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:40px 0; grid-column:span 2;">空空如也，快去发一个吧！</div>'; 
                return; 
            } 

            let html = ''; 
            data.forEach(item => { 
                const soldOverlayHtml = item.isSold ? `<div class="wf-sold-overlay"><div class="wf-sold-text">已售空</div></div>` : ''; 
                const countBadge = item.itemCount > 1 ? `<div class="waterfall-count-badge">共 ${item.itemCount} 件</div>` : ''; 
                // 安全拼接 HTML，点击事件指向全局 window.App
                html += `
                <div class="waterfall-item" onclick="window.App.openCommunityPost(${item.id || 0})">
                    <div class="wf-img-box">${soldOverlayHtml}${countBadge}<img class="wf-img" src="${item.img || ''}"></div>
                    <div class="wf-info">
                        <div class="wf-title" style="${item.isSold ? 'color:#9CA3AF;' : ''}">${item.title || '无题'}</div>
                        <div class="wf-price-row"><span class="wf-currency" style="${item.isSold ? 'color:#9CA3AF;' : ''}">€</span><span class="wf-price" style="${item.isSold ? 'color:#9CA3AF;' : ''}">${item.price || '0'}</span></div>
                    </div>
                </div>`; 
            }); 
            container.innerHTML = html; 
        } catch (error) {
            console.error("🚨 [Market] 闲置瀑布流渲染崩溃拦截:", error);
        }
    },

    applyFilters(type) {
        try {
            if (type === 'idle') {
                const sortEl = document.getElementById('sortIdle');
                const sortMode = sortEl ? sortEl.value : 'newest'; 
                const pillEl = document.getElementById('pillIdleBargain');
                const onlyBargain = pillEl ? pillEl.classList.contains('active') : false; 
                
                let filtered = [...mockIdleItems]; 
                if (onlyBargain) filtered = filtered.filter(item => item.isBargain); 
                
                if (sortMode === 'priceAsc') filtered.sort((a, b) => a.priceNum - b.priceNum); 
                else if (sortMode === 'priceDesc') filtered.sort((a, b) => b.priceNum - a.priceNum); 
                else filtered.sort((a, b) => b.timestamp - a.timestamp); 
                
                this.renderMarketIdle(filtered); 
            }
            // ... 其他类型的过滤逻辑同理防御 ...
        } catch (error) {
            console.error(`🚨 [Market] ${type} 过滤器异常:`, error);
        }
    },

    // ------------------------------------------------------------------------
    // 3. 发布系统：多图上传与 Canvas 本地水印 (性能怪兽防御)
    // ------------------------------------------------------------------------
    handleMultiImageSelect(event) {
        try {
            const files = event.target.files; 
            if (!files || files.length === 0) return;

            Array.from(files).forEach(file => {
                if (selectedImagesArray.length >= 9) {
                    showToast("最多只能传 9 张照片哦！", "warning");
                    return; 
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64Data = e.target.result.split(',')[1]; 
                    const id = Date.now() + Math.random(); 
                    selectedImagesArray.push({ id: id, base64: base64Data, preview: e.target.result, name: '', price: '' }); 
                    this.renderIdleItemCards();
                }; 
                reader.readAsDataURL(file);
            }); 
            event.target.value = ''; // 清空 input 允许重复选同一张图
        } catch (error) {
            console.error("🚨 [Market] 图片解析失败:", error);
            showToast("图片读取失败");
        }
    },

    renderIdleItemCards() {
        try {
            const container = document.getElementById('idleImgPreviewContainer'); 
            if (!container) return;

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
                html += `<div class="upload-btn" onclick="if(document.getElementById('idleImgInput')) document.getElementById('idleImgInput').click()" style="width: 100%; background: #FFF; border: 1px dashed #D1D5DB; margin-top: 5px;"><span style="font-size: 24px;">📷</span><span style="font-size: 13px; font-weight: bold; margin-left: 8px; color: #374151;">继续添加物品</span></div>`; 
            }
            container.innerHTML = html;
        } catch (error) {
            console.error("🚨 [Market] 物品卡片渲染失败:", error);
        }
    },

    // 核心：防内存泄漏的 Canvas 绘制
    addTagToImage(previewUrl, name, price) {
        return new Promise((resolve) => {
            try {
                if (!name && !price) return resolve(previewUrl.split(',')[1]); 
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas'); 
                    canvas.width = img.width; 
                    canvas.height = img.height; 
                    const ctx = canvas.getContext('2d'); 
                    ctx.drawImage(img, 0, 0);
                    
                    const tagText = `${name ? name + ' ' : ''}${price ? '€'+price : ''}`.trim(); 
                    const fontSize = Math.max(24, Math.floor(img.width * 0.045)); 
                    ctx.font = `bold ${fontSize}px sans-serif`;
                    
                    // ... Canvas 绘制黑框黄字逻辑 ...
                    const paddingX = fontSize * 0.8; const paddingY = fontSize * 0.5; const textWidth = ctx.measureText(tagText).width; const x = img.width * 0.05; const y = img.height - img.width * 0.05 - fontSize;
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'; ctx.beginPath(); if(ctx.roundRect) { ctx.roundRect(x, y, textWidth + paddingX * 2.2, fontSize + paddingY * 2, (fontSize + paddingY * 2) / 2); } else { ctx.fillRect(x, y, textWidth + paddingX * 2.2, fontSize + paddingY * 2); } ctx.fill();
                    ctx.fillStyle = '#FCD34D'; ctx.beginPath(); ctx.arc(x + paddingX * 0.9, y + (fontSize + paddingY * 2)/2, fontSize * 0.25, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#FFFFFF'; ctx.fillText(tagText, x + paddingX * 1.6, y + fontSize + paddingY * 0.4); 

                    resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1]);
                    // 释放内存
                    canvas.width = 0; canvas.height = 0;
                }; 
                img.onerror = () => resolve(previewUrl.split(',')[1]); // 图片加载失败时回退原图
                img.src = previewUrl;
            } catch (error) {
                console.error("🚨 [Canvas] 水印生成失败:", error);
                resolve(previewUrl.split(',')[1]); // 报错也回退原图，绝不卡死主流程
            }
        });
    },

    // ------------------------------------------------------------------------
    // 4. Web Speech API 与 AI 一键填表 (终极容错)
    // ------------------------------------------------------------------------
    toggleVoiceInput(type) {
        try {
            const btn = document.getElementById(`btnVoiceInput_${type}`); 
            const input = document.getElementById(`aiKeywords_${type}`);
            
            if (!recognition) {
                showToast('您的浏览器不支持语音输入，请手动打字哦~', 'warning');
                return;
            }
            
            if (btn && btn.classList.contains('recording')) { 
                recognition.stop(); 
                return; 
            }
            
            if(btn) { btn.classList.add('recording'); btn.innerText = '🔴'; }
            let oldPlaceholder = '';
            if(input) { oldPlaceholder = input.placeholder; input.placeholder = '听着呢...'; }

            recognition.start();

            recognition.onresult = (event) => { 
                if(input) input.value += event.results[0][0].transcript; 
            };
            
            recognition.onend = () => { 
                if(btn) { btn.classList.remove('recording'); btn.innerText = '🎙️'; }
                if(input) input.placeholder = oldPlaceholder; 
                if(input && input.value.trim() !== '') this.generateAICopy(type); 
            };
            
            recognition.onerror = (e) => { 
                console.warn("语音识别中断:", e);
                if(btn) { btn.classList.remove('recording'); btn.innerText = '🎙️'; }
                if(input) input.placeholder = oldPlaceholder; 
            };
        } catch (error) {
            console.error("🚨 [Speech API] 引擎崩溃:", error);
        }
    },

    async submitIdlePost() {
        try {
            if(selectedImagesArray.length === 0) return showToast("请至少传一张照片！", "warning");

            // 安全获取各种信息
            const locEl = document.getElementById('idleLocation');
            const loc = locEl ? locEl.value : ''; 
            const priceEl = document.getElementById('idlePrice');
            const totalPrice = priceEl ? priceEl.value.trim() || '0' : '0';
            
            const btn = document.querySelector('#publishIdleModal .fm-submit'); 
            if(btn) { btn.innerText = "打水印中..."; btn.style.pointerEvents = 'none'; }

            let finalItemsData = [];
            for (let img of selectedImagesArray) { 
                const taggedBase64 = await this.addTagToImage(img.preview, img.name, img.price); 
                
                const headers = window.App && window.App.getAuthHeaders ? window.App.getAuthHeaders() : { 'Content-Type': 'application/json' };
                const res = await fetch('/api/upload', { 
                    method: 'POST', 
                    headers: headers, 
                    body: JSON.stringify({ imageBase64: taggedBase64 }) 
                }); 
                const data = await res.json(); 
                if(data.success) { 
                    finalItemsData.push({ id: img.id, url: data.url, name: img.name, price: img.price, is_sold: false }); 
                } 
            }
            
            // ... 提交到数据库逻辑 ...
            
            showToast("🎉 发布成功！", "success"); 
            // 依赖全局方法关闭弹窗
            if(window.App && window.App.closeIdlePublish) window.App.closeIdlePublish(); 
            
            selectedImagesArray = []; 
            this.renderIdleItemCards(); 
            if(priceEl) priceEl.value = ''; 
            this.loadCommunityPosts(); 

        } catch(e) { 
            showToast("发布失败：" + e.message, "error"); 
        } finally { 
            const btn = document.querySelector('#publishIdleModal .fm-submit'); 
            if(btn) { btn.innerText = "发布"; btn.style.pointerEvents = 'auto'; }
        }
    }
    // 🌟 新增：注入 JIT 逻辑的闲置详情页打开方法
    openCommunityPost(postId) {
        try {
            // 1. 🛡️ 核心修复：先让系统把弹窗 HTML 动态注入到页面中！
            ModalManager.injectIfNeeded('postDetailModal');

            // 2. 初始化重置状态
            selectedItemIds = new Set();
            currentTotalPrice = 0;
            const priceEl = document.getElementById('pdTotalPrice');
            const chatBtn = document.getElementById('pdChatBtn');
            if (priceEl) priceEl.innerText = `€0.00`;
            if (chatBtn) chatBtn.innerText = `私信想要 (0件)`;

            // 3. 查找数据 (假设 window.allCommunityPostsCache 已经存了数据)
            const post = (window.allCommunityPostsCache || []).find(p => p.id === postId) || mockIdleItems.find(p => p.id === postId);
            if (!post) return;
            currentCommunityPost = post;

            // 4. 渲染卖家信息
            const sellerInfo = document.getElementById('pdSellerInfo');
            if (sellerInfo) {
                sellerInfo.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div class="pd-seller-avatar" style="font-size:32px;">${post.avatar || '😎'}</div>
                            <div style="display:flex; flex-direction:column; gap:2px;">
                                <div class="pd-seller-name" style="font-weight:900; font-size:15px;">${post.name || '热心校友'} ${post.badge || ''}</div>
                                <div class="pd-seller-time" style="font-size:11px; color:#9CA3AF;">发布于近期</div>
                            </div>
                        </div>
                        <div style="background:#F3F4F6; color:#6B7280; padding:6px 12px; border-radius:14px; font-size:12px; font-weight:bold;">
                            信用 ${post.credit || '良好'}
                        </div>
                    </div>`;
            }

            // 5. 渲染物品瀑布流
            let payload;
            try { payload = JSON.parse(post.content); } catch(e) { payload = { items: [{ id: 'item1', name: post.title, price: post.priceNum, url: post.img, is_sold: post.isSold }] }; }
            
            const listContainer = document.getElementById('pdItemsList');
            if (listContainer) {
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
            }

            // 6. 最后，安全地打开弹窗
            ModalManager.open('postDetailModal');
        } catch (error) {
            console.error("🚨 [Market] 详情页渲染失败:", error);
        }
    },

    toggleItemCard(cardEl, itemId, price) {
        const chk = document.getElementById(`chk_${itemId}`);
        if (!chk) return;
        chk.checked = !chk.checked; 
        this.toggleItemCheckbox(chk, itemId, price);
    },

    toggleItemCheckbox(checkbox, itemId, price) {
        if (checkbox.checked) {
            selectedItemIds.add(itemId);
            currentTotalPrice += price;
        } else {
            selectedItemIds.delete(itemId);
            currentTotalPrice -= price;
        }
        currentTotalPrice = Math.max(0, currentTotalPrice); // 防止浮点数精度变负数
        document.getElementById('pdTotalPrice').innerText = `€${currentTotalPrice.toFixed(2)}`;
        document.getElementById('pdChatBtn').innerText = `私信想要 (${selectedItemIds.size}件)`;
    },

    initiateBuyChat() {
        if (selectedItemIds.size === 0) return showToast("👉 请先点击图片，勾选您想要的物品哦！", "warning");
        
        let payload;
        try { payload = JSON.parse(currentCommunityPost.content); } catch(e) { payload = { items: [{ id: 'item1', name: currentCommunityPost.title, url: currentCommunityPost.img }] }; }
        
        let wantNames = payload.items.filter(i => selectedItemIds.has(i.id)).map(i => i.name).join('、');
        const firstItemImg = payload.items.find(i => selectedItemIds.has(i.id))?.url || currentCommunityPost.img;
        
        // 调用聊天引擎
        ChatEngine.openChat(currentCommunityPost.user_id || 'test_id', currentCommunityPost.name, currentCommunityPost.avatar, currentCommunityPost.id, `想要这几件 (€${currentTotalPrice.toFixed(2)})`, currentTotalPrice.toFixed(2), firstItemImg, false, 'idle');
        
        const input = document.getElementById('chatInput'); 
        if(input) input.value = `哈喽！我想要你清单里的：【${wantNames}】，请问还在吗？`;
        
        ModalManager.close('postDetailModal');
    }
};
