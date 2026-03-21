// ============================================================================
// js/modules/scanner.js - 极速扫码穿透与足迹引擎 (内置大厂级 Canvas 图片极速压缩)
// ============================================================================
import { showToast } from '../core/toast.js';
import { safeDOM } from '../core/dom.js'; 

let currentProductData = null;
let currentDetailData = null;
let currentScanSession = 0; 

export const ScannerEngine = {
    
    openScanner() {
        safeDOM.execute('packageImgInput', el => el.click());
    },

    // 🌟 核心急救包：前端 Canvas 图片极速压缩引擎
    // 把 5MB 的原图压缩到 50KB，拯救 Vercel 接口和 LocalStorage！
    compressImage(file, maxWidth = 800, quality = 0.6) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // 按比例缩放
                    if (width > maxWidth) {
                        height = Math.round((height *= maxWidth / width));
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    
                    // 绘制并压缩为 JPEG
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedBase64);
                };
                img.onerror = error => reject(error);
            };
            reader.onerror = error => reject(error);
        });
    },

    // ------------------------------------------------------------------------
    // 1. 扫码极速穿透引擎
    // ------------------------------------------------------------------------
    async handlePackageImage(event) {
        const file = event.target.files[0]; 
        if (!file) return;

        const sessionId = ++currentScanSession;

        // 切换到 Loading UI
        safeDOM.execute('homeActionBox', el => el.style.display = 'none');
        safeDOM.execute('previewContainer', el => el.style.display = 'block');
        safeDOM.execute('scanOverlay', el => el.style.display = 'flex');
        safeDOM.execute('scanText', el => el.innerText = "📡 正在压缩图片...");

        try {
            // 🌟 1. 执行极速压缩 (手机端只需几十毫秒)
            const compressedImage = await this.compressImage(file, 800, 0.6);
            
            safeDOM.execute('previewImg', el => { 
                el.src = compressedImage; 
                el.style.display = 'block'; 
            });
            safeDOM.execute('scanText', el => el.innerText = "🧠 大脑飞速解析中...");

            // 提取纯 Base64 数据发给后端
            const base64Data = compressedImage.split(',')[1];
            
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64Data })
            });

            if (sessionId !== currentScanSession) return; 
            if (!res.ok) throw new Error("AI 解析失败，请重试");
            
            const data = await res.json();
            
            // 🌟 2. 存入本地的图片也是压缩后的，彻底告别 LocalStorage 爆存！
            data.scanned_img = compressedImage; 
            
            // 保存足迹
            this._addToHistory(data);
            
            // 隐藏扫描界面，直接穿透到详情页
            safeDOM.execute('scanOverlay', el => el.style.display = 'none'); 
            safeDOM.execute('previewContainer', el => el.style.display = 'none');
            safeDOM.execute('homeActionBox', el => el.style.display = 'flex');
            
            this._renderAndOpenDetail(data);

        } catch (error) {
            if (sessionId === currentScanSession) {
                safeDOM.execute('scanText', el => el.innerText = "❌ 解析失败: " + (error.message || "请重试"));
                setTimeout(() => {
                    safeDOM.execute('scanOverlay', el => el.style.display = 'none'); 
                    safeDOM.execute('previewContainer', el => el.style.display = 'none');
                    safeDOM.execute('homeActionBox', el => el.style.display = 'flex');
                }, 2000);
            }
        } finally {
            // 清空 input 使得再次扫同一张图也能触发 change 事件
            event.target.value = '';
        }
    },

    // ------------------------------------------------------------------------
    // 2. 足迹卡片渲染引擎 (带一键清空与单条删除)
    // ------------------------------------------------------------------------
    renderFootprints() {
        safeDOM.execute('footprintList', container => {
            const history = JSON.parse(localStorage.getItem('hp_scan_history') || '[]');
            if (history.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:60px 20px; color:#9CA3AF; font-size:14px;">暂无扫码足迹哦~ 快去超市扫一扫吧！</div>';
                return;
            }
            
            let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
                <div style="font-size:14px; font-weight:900; color:#111827;">共 ${history.length} 条足迹</div>
                <div onclick="window.App.clearAllFootprints()" style="font-size:12px; color:#EF4444; font-weight:bold; cursor:pointer; background:#FEF2F2; padding:6px 12px; border-radius:12px; border:1px solid #FECACA;">🗑️ 清空全部</div>
            </div>`;

            history.forEach((item, index) => {
                const img = item.scanned_img || item.image_url || 'https://via.placeholder.com/100';
                html += `
                <div style="background:#FFF; border-radius:20px; padding:16px; margin-bottom:16px; box-shadow:0 4px 15px rgba(0,0,0,0.03); border:1px solid #F1F5F9; display:flex; flex-direction:column; gap:16px; position:relative;">
                    
                    <div onclick="window.App.deleteFootprint(${index})" style="position:absolute; top:12px; right:12px; width:28px; height:28px; background:#F8FAFC; border-radius:14px; display:flex; align-items:center; justify-content:center; color:#94A3B8; font-size:12px; cursor:pointer; z-index:10; border:1px solid #E2E8F0;">✕</div>

                    <div style="display:flex; gap:16px; cursor:pointer; padding-right:24px;" onclick="window.App.openDetailsFromHistory(${index})">
                        <img src="${img}" style="width:80px; height:80px; border-radius:14px; object-fit:cover; border:1px solid #F1F5F9; flex-shrink:0;">
                        <div style="flex:1; overflow:hidden;">
                            <div style="font-size:16px; font-weight:900; color:#111827; margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.chinese_name || item.dutch_name}</div>
                            <div style="font-size:12px; color:#64748B; font-weight:bold; margin-bottom:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.category || '超市好物'}</div>
                            <div style="font-size:12px; color:#475569; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; line-height:1.4;">${item.insight || '暂无评测'}</div>
                        </div>
                    </div>
                    
                    <div style="display:flex; gap:10px; border-top:1px dashed #E5E7EB; padding-top:16px;">
                        <button onclick="window.App.voteFromFootprint(${index}, 'like', this)" style="flex:1; background:#FEF2F2; color:#EF4444; border:1px solid #FECACA; padding:10px 0; border-radius:12px; font-size:13px; font-weight:900; cursor:pointer; transition:0.2s;">🔥 狂赞</button>
                        <button onclick="window.App.voteFromFootprint(${index}, 'dislike', this)" style="flex:1; background:#F8FAFC; color:#475569; border:1px solid #E2E8F0; padding:10px 0; border-radius:12px; font-size:13px; font-weight:900; cursor:pointer; transition:0.2s;">💣 避雷</button>
                        <button onclick="window.App.reviewFromFootprint(${index})" style="flex:1; background:#F0FDF4; color:#10B981; border:1px solid #A7F3D0; padding:10px 0; border-radius:12px; font-size:13px; font-weight:900; cursor:pointer;">💬 点评</button>
                    </div>
                </div>`;
            });
            container.innerHTML = html;
        });
    },

    // ------------------------------------------------------------------------
    // 3. 足迹操作 (清空、删除、投票、评价)
    // ------------------------------------------------------------------------
    clearAllFootprints() {
        if(confirm("确定要清空所有本地足迹吗？")) {
            localStorage.setItem('hp_scan_history', '[]');
            this.renderFootprints();
            showToast("🧹 足迹已清空", "success");
        }
    },

    deleteFootprint(index) {
        let history = JSON.parse(localStorage.getItem('hp_scan_history') || '[]');
        history.splice(index, 1);
        localStorage.setItem('hp_scan_history', JSON.stringify(history));
        this.renderFootprints();
    },

    openDetailsFromHistory(index) {
        try {
            const history = JSON.parse(localStorage.getItem('hp_scan_history') || '[]');
            if (history[index]) this._renderAndOpenDetail(history[index]);
        } catch (e) { console.error("历史读取失败:", e); }
    },

    async voteFromFootprint(index, action, btnElement) {
        const history = JSON.parse(localStorage.getItem('hp_scan_history') || '[]');
        const targetItem = history[index];
        if (!targetItem || !targetItem.dutch_name) return showToast("商品信息有误", "error");

        btnElement.innerText = "已记录 ✔";
        btnElement.style.opacity = "0.6";
        btnElement.style.pointerEvents = "none";
        
        showToast(action === 'like' ? "🔥 已为您推送至红榜！" : "💣 已记录，帮助他人避雷！", "success");

        try {
            const token = localStorage.getItem('hebao_token') || '';
            await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ dutch_name: targetItem.dutch_name, action: action })
            });
            if (window.App && window.App.loadTrendingData) window.App.loadTrendingData();
        } catch (e) { console.error("足迹投票失败:", e); }
    },

    reviewFromFootprint(index) {
        try {
            const history = JSON.parse(localStorage.getItem('hp_scan_history') || '[]');
            if (history[index]) {
                currentProductData = history[index];
                if (window.App && typeof window.App.openModal === 'function') {
                    window.App.openModal('addReviewModal');
                } else {
                    showToast("💬 评价模块已唤醒，请编写您的评价！", "success");
                }
            }
        } catch (e) { console.error(e); }
    },

    // ------------------------------------------------------------------------
    // 4. 详情页极速与深度分层渲染引擎
    // ------------------------------------------------------------------------
    async _renderAndOpenDetail(data) {
        try {
            if (window.switchTab) window.switchTab('details');
            currentProductData = data; 

            const fallbackImg = 'https://images.unsplash.com/photo-1544025162-8315ea07659b?q=80&w=600&auto=format&fit=crop';
            safeDOM.execute('detailImg', el => el.src = data.image_url || data.scanned_img || fallbackImg);

            safeDOM.execute('detailChineseName', el => el.innerText = data.chinese_name || data.dutch_name || '未知商品');
            safeDOM.execute('detailDutchName', el => el.innerText = data.dutch_name || '');
            
            safeDOM.execute('detailTag', el => {
                el.innerText = data.category || '超市好物';
                el.style.background = data.is_recommended ? '#E0F2FE' : '#FEF2F2';
                el.style.color = data.is_recommended ? '#0284C7' : '#DC2626';
                el.style.borderColor = data.is_recommended ? '#BAE6FD' : '#FECACA';
            });
            
            safeDOM.execute('detailInsight', el => el.innerText = data.insight || '暂无锐评');
            safeDOM.execute('detailWarningBox', el => el.style.display = data.warning ? 'block' : 'none');
            safeDOM.execute('detailWarning', el => el.innerText = data.warning || '');

            const isNonFood = data.category && (data.category.includes('日化') || data.category.includes('非食品') || data.category.includes('清洁'));
            safeDOM.execute('recipeTitleIcon', el => el.innerText = isNonFood ? '🧼' : '🍳');
            safeDOM.execute('recipeTitleText', el => el.innerText = isNonFood ? '使用指南 & 注意事项' : '食用指南 & 神仙吃法');

            safeDOM.execute('detailRecipeBox', el => el.style.display = 'none');
            safeDOM.execute('detailAltBox', el => el.style.display = 'none');
            safeDOM.execute('detailReviewsBox', el => el.style.display = 'none');
            safeDOM.execute('detailAiLoading', el => el.style.display = 'block'); 

            const res = await fetch('/api/detail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dutchName: data.dutch_name, chineseName: data.chinese_name, isNonFood: isNonFood })
            });

            if (res.ok) {
                const deepData = await res.json();
                currentDetailData = deepData;
                safeDOM.execute('detailAiLoading', el => el.style.display = 'none');
                
                if (deepData.methods || deepData.recipe_desc) {
                    safeDOM.execute('detailRecipeBox', el => el.style.display = 'block');
                    if (deepData.methods && Array.isArray(deepData.methods)) {
                        safeDOM.execute('recipeMethodTags', el => {
                            el.innerHTML = deepData.methods.map(m => `<span style="background:#F0FDF4; color:#047857; padding:4px 10px; border-radius:8px; font-size:12px; font-weight:bold; border:1px solid #A7F3D0;">${m}</span>`).join('');
                        });
                    }
                    safeDOM.execute('recipeDetails', el => el.innerText = deepData.recipe_desc || '暂无具体步骤~');
                }

                if (deepData.alternatives && Array.isArray(deepData.alternatives) && deepData.alternatives.length > 0) {
                    safeDOM.execute('detailAltBox', el => el.style.display = 'block');
                    safeDOM.execute('detailAlternatives', el => {
                        el.innerHTML = deepData.alternatives.map(alt => `<span style="background:#F8FAFC; color:#475569; padding:6px 12px; border-radius:8px; font-size:13px; font-weight:bold; border:1px solid #E2E8F0;">${alt}</span>`).join('');
                    });
                }

                if (deepData.reviews && Array.isArray(deepData.reviews) && deepData.reviews.length > 0) {
                    safeDOM.execute('detailReviewsBox', el => el.style.display = 'block');
                    safeDOM.execute('reviewsList', el => {
                        el.innerHTML = deepData.reviews.map(rev => `
                            <div style="background:#FFF; padding:16px; border-radius:16px; margin-bottom:12px; box-shadow:0 2px 10px rgba(0,0,0,0.02); border:1px solid #F1F5F9;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <div style="width:28px; height:28px; border-radius:14px; background:#F1F5F9; display:flex; align-items:center; justify-content:center; font-size:16px;">${rev.avatar || '😎'}</div>
                                        <div style="font-size:13px; font-weight:bold; color:#475569;">${rev.author || '匿名荷包蛋'}</div>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:4px; color:#9CA3AF; font-size:12px; cursor:pointer;" onclick="this.style.color='#EF4444'; this.querySelector('span').innerText = parseInt(this.querySelector('span').innerText) + 1;">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                                        <span>${rev.likes || 0}</span>
                                    </div>
                                </div>
                                <div style="font-size:13px; color:#111827; line-height:1.6;">${rev.content}</div>
                                <div style="font-size:11px; color:#94A3B8; margin-top:8px;">${rev.date || '刚刚'}</div>
                            </div>
                        `).join('');
                    });
                }
            } else {
                safeDOM.execute('detailAiLoading', el => el.style.display = 'none');
            }
        } catch (error) {
            console.error("渲染详情页报错:", error);
            safeDOM.execute('detailAiLoading', el => el.style.display = 'none');
        }
    },
    // ------------------------------------------------------------------------
    // 5. 真实点评提交引擎 (取代虚假数据)
    // ------------------------------------------------------------------------
    async submitDetailReview(text) {
        if (!text || !currentProductData) return;
        
        try {
            // 获取当前用户的登录状态和头像
            const token = localStorage.getItem('hebao_token');
            if (!token) return showToast("请先在「我的」页面登录后再点评哦！", "warning");

            const author = localStorage.getItem('hp_name') || '热心荷包蛋';
            const avatar = localStorage.getItem('hp_avatar') || '😎';

            showToast("正在提交您的真实点评...", "info");
            
            const res = await fetch('/api/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    dutch_name: currentProductData.dutch_name, 
                    content: text,
                    author: author,
                    avatar: avatar
                })
            });

            const data = await res.json();
            if(!res.ok) throw new Error(data.error || "提交失败");
            
            // 关闭弹窗
            if(window.App.closeModal) window.App.closeModal('addReviewModal');
            showToast("🎉 评价发布成功！感谢为村友排雷！", "success");
            
            // 🌟 核心细节：如果当前正停留在详情页，立即重新拉取数据，让用户看到自己的评论！
            const detailsPage = document.getElementById('page-details');
            if(detailsPage && detailsPage.style.display !== 'none') {
                 this._renderAndOpenDetail(currentProductData);
            }

        } catch (e) {
            showToast(e.message, "error");
        }
    },

    _addToHistory(data) {
        try {
            let history = JSON.parse(localStorage.getItem('hp_scan_history') || '[]');
            const key = data.dutch_name || data.chinese_name || String(Date.now());
            history = history.filter(item => (item.dutch_name || item.chinese_name) !== key);
            
            history.unshift(data);
            if (history.length > 20) history.pop(); 
            localStorage.setItem('hp_scan_history', JSON.stringify(history));

            if (typeof this.renderFootprints === 'function') {
                this.renderFootprints();
            }
        } catch(e) { console.error("History Save Error:", e); }
    }
};

// 挂载到 window.App
if (typeof window !== 'undefined') {
    window.App = window.App || {};
    Object.keys(ScannerEngine).forEach(key => {
        if (typeof ScannerEngine[key] === 'function') {
            window.App[key] = ScannerEngine[key].bind(ScannerEngine);
        }
    });
}
