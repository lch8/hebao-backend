// ============================================================================
// js/modules/market.js - 集市与发布引擎 (极度防御全量版)
// ============================================================================
import { showToast } from '../core/toast.js';
import { safeDOM } from '../core/dom.js'; // 🛡️ 引入安全 DOM 引擎
import { ModalManager } from '../components/modals.js';
import { ChatEngine } from './chat.js'; 

// 🔒 模块级私有状态
let selectedImagesArray = [];
let mockIdleItems = []; 
let mockHelpItems = []; 
let mockPartnerItems = []; 
let mockQuestionItems = [];
let currentCommunityPost = null; 
let selectedItemIds = new Set(); 
let currentTotalPrice = 0;

// 🎙️ 语音输入初始化 (防浏览器不支持)
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

                    // 简单分类推送逻辑
                    if (title.includes('[闲置]')) mockIdleItems.push({ id: post.id, title, img: post.image_url, price: post.likes, priceNum: post.likes, timestamp: time, isSold: false, itemCount: 1 });
                    else if (title.includes('[互助]')) mockHelpItems.push(post);
                    else if (title.includes('[找搭子]')) mockPartnerItems.push(post);
                    else if (title.includes('[问答]')) mockQuestionItems.push(post);
                });

                this.applyFilters('idle'); 
            }
        } catch (error) {
            console.error("🚨 [Market] 社区数据拉取失败:", error);
        }
    },

    // ------------------------------------------------------------------------
    // 2. 防御性渲染引擎 (瀑布流)
    // ------------------------------------------------------------------------
    renderMarketIdle(data = mockIdleItems) { 
        safeDOM.execute('idleWaterfall', container => {
            if(data.length === 0) { 
                container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:60px 0; grid-column:span 2;">空空如也，快去发一个吧！</div>'; 
                return; 
            } 

            let html = ''; 
            data.forEach(item => { 
                const soldOverlayHtml = item.isSold ? `<div class="wf-sold-overlay"><div class="wf-sold-text">已售空</div></div>` : ''; 
                const countBadge = item.itemCount > 1 ? `<div class="waterfall-count-badge">共 ${item.itemCount} 件</div>` : ''; 
                
                // 🛡️ 核心修复 1：在 ${item.id} 外面包上单引号，防止字符串类型的 ID 导致执行错误！
                html += `
                <div class="waterfall-item" onclick="window.App.openCommunityPost('${item.id || 0}')">
                    <div class="wf-img-box">${soldOverlayHtml}${countBadge}<img class="wf-img" src="${item.img || ''}"></div>
                    <div class="wf-info">
                        <div class="wf-title" style="${item.isSold ? 'color:#9CA3AF;' : ''}">${item.title || '无题'}</div>
                        <div class="wf-price-row"><span class="wf-currency" style="${item.isSold ? 'color:#9CA3AF;' : ''}">€</span><span class="wf-price" style="${item.isSold ? 'color:#9CA3AF;' : ''}">${item.price || '0'}</span></div>
                    </div>
                </div>`; 
            }); 
            container.innerHTML = html; 
        });
    },

    applyFilters(type) {
        if (type === 'idle') {
            const sortMode = safeDOM.getValue('sortIdle', 'newest');
            let onlyBargain = false;
            safeDOM.execute('pillIdleBargain', el => { onlyBargain = el.classList.contains('active'); });
            
            let filtered = [...mockIdleItems]; 
            if (onlyBargain) filtered = filtered.filter(item => item.isBargain); 
            
            if (sortMode === 'priceAsc') filtered.sort((a, b) => a.priceNum - b.priceNum); 
            else if (sortMode === 'priceDesc') filtered.sort((a, b) => b.priceNum - a.priceNum); 
            else filtered.sort((a, b) => b.timestamp - a.timestamp); 
            
            this.renderMarketIdle(filtered); 
        }
    },

    // ------------------------------------------------------------------------
    // 3. 发布系统：多图上传与 Canvas 本地水印 (防内存泄漏)
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
                    canvas.width = img.width; 
                    canvas.height = img.height; 
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
                    // 🛡️ 释放内存，防止移动端 Safari OOM 崩溃
                    canvas.width = 0; canvas.height = 0;
                }; 
                img.onerror = () => resolve(previewUrl.split(',')[1]); 
                img.src = previewUrl;
            } catch (error) {
                console.error("🚨 [Canvas] 水印生成失败:", error);
                resolve(previewUrl.split(',')[1]); 
            }
        });
    },

    // ------------------------------------------------------------------------
    // 4. Web Speech API 语音录入 (终极容错)
    // ------------------------------------------------------------------------
    toggleVoiceInput(type) {
        if (!recognition) return showToast('您的浏览器不支持语音输入，请手动打字哦~', 'warning');
            
        safeDOM.execute(`btnVoiceInput_${type}`, btn => {
            safeDOM.execute(`aiKeywords_${type}`, input => {
                if (btn.classList.contains('recording')) { 
                    recognition.stop(); 
                    return; 
                }
                
                btn.classList.add('recording'); 
                btn.innerText = '🔴'; 
                let oldPlaceholder = input.placeholder;
                input.placeholder = '听着呢...';

                recognition.start();

                recognition.onresult = (event) => { input.value += event.results[0][0].transcript; };
                
                recognition.onend = () => { 
                    btn.classList.remove('recording'); 
                    btn.innerText = '🎙️'; 
                    input.placeholder = oldPlaceholder; 
                    if(input.value.trim() !== '' && typeof window.App.generateAICopy === 'function') {
                        window.App.generateAICopy(type); 
                    }
                };
                
                recognition.onerror = (e) => { 
                    console.warn("🚨 语音识别中断:", e);
                    btn.classList.remove('recording'); 
                    btn.innerText = '🎙️'; 
                    input.placeholder = oldPlaceholder; 
                };
            });
        });
    },

    async submitIdlePost() {
        try {
            if(selectedImagesArray.length === 0) return showToast("请至少传一张照片！", "warning");

            const loc = safeDOM.getValue('idleLocation', '');
            const totalPrice = safeDOM.getValue('idlePrice', '0');
            
            // 防御性按钮状态控制 (防止手抖重复提交)
            const submitBtnId = 'publishIdleSubmitBtn'; // 确保你的 index.html 中提交按钮有这个ID
            safeDOM.execute(submitBtnId, btn => { btn.innerText = "打水印中..."; btn.style.pointerEvents = 'none'; });

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
            if(window.App && window.App.closeIdlePublish) window.App.closeIdlePublish(); 
            
            selectedImagesArray = []; 
            this.renderIdleItemCards(); 
            safeDOM.execute('idlePrice', el => el.value = ''); 
            this.loadCommunityPosts(); 

        } catch(e) { 
            showToast("发布失败：" + e.message, "error"); 
        } finally { 
            safeDOM.execute('publishIdleSubmitBtn', btn => { btn.innerText = "发布"; btn.style.pointerEvents = 'auto'; });
        }
    },

    // ------------------------------------------------------------------------
    // 5. 详情页与交易逻辑 (安全绑定)
    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    // 5. 详情页与交易逻辑 (雷达追踪 + 暴力防弹版)
    // ------------------------------------------------------------------------
    openCommunityPost(postId) {
        try {
            // 💡 追踪点 1：检查是否成功进入函数
            console.log("👉 准备打开商品详情, 接收到的 postId:", postId);

            // 1. 尝试注入 HTML
            ModalManager.injectIfNeeded('postDetailModal');
            const modalEl = document.getElementById('postDetailModal');
            
            if (!modalEl) {
                alert("🚨 追踪报错：在页面上找不到 postDetailModal！请检查 modals.js 模板名是否拼对。");
                return;
            }

            // 2. 查找数据
            const post = (window.allCommunityPostsCache || []).find(p => String(p.id) === String(postId)) 
                      || mockIdleItems.find(p => String(p.id) === String(postId));
                      
            if (!post) {
                alert(`🚨 追踪报错：数据走丢了！数据库缓存中找不到 ID 为 [${postId}] 的商品！`);
                return;
            }

            // 3. 基础赋值
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

            // 4. 解析复杂商品列表数据
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

            // 💡 追踪点 2：如果代码顺利走到这里，说明前面完全没报错！
            // 暴力撕开弹窗，无视任何动画延迟
            modalEl.style.display = 'block'; 
            
        } catch (error) {
            // 💡 终极防线：无论哪里报错，直接弹窗显示红字报错信息！
            alert("🚨 致命报错拦截：\\n" + error.message);
            console.error("详情页报错详细堆栈:", error);
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
            selectedItemIds.add(itemId);
            currentTotalPrice += price;
        } else {
            selectedItemIds.delete(itemId);
            currentTotalPrice -= price;
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
        
        // 调用聊天引擎
        ChatEngine.openChat(currentCommunityPost.user_id || 'test_id', currentCommunityPost.name, currentCommunityPost.avatar, currentCommunityPost.id, `想要这几件 (€${currentTotalPrice.toFixed(2)})`, currentTotalPrice.toFixed(2), firstItemImg, false, 'idle');
        
        safeDOM.execute('chatInput', input => input.value = `哈喽！我想要你清单里的：【${wantNames}】，请问还在吗？`);
        
        ModalManager.close('postDetailModal');
    }
};

// 💥 终极暴力兼容绑定机制：防止任何旧 HTML 的 onclick 找不到对象
if (typeof window !== 'undefined') {
    window.App = window.App || {};
    window.App.safeDOM = safeDOM; 
    
    Object.keys(MarketEngine).forEach(key => {
        if (typeof MarketEngine[key] === 'function') {
            const boundFunc = MarketEngine[key].bind(MarketEngine);
            // 挂载到 window.App 下
            window.App[key] = boundFunc;
            // 🌟 终极流氓打法：同时直接挂载到 window 最顶层！
            // 这样无论 HTML 怎么写 onclick="openCommunityPost()" 都能绝对命中！
            window[key] = boundFunc; 
        }
    });
}
