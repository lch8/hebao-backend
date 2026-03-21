// ============================================================================
// js/modules/scanner.js - 极速扫码穿透与足迹点评引擎
// ============================================================================
import { showToast } from '../core/toast.js';
import { safeDOM } from '../core/dom.js'; 
import { ModalManager } from '../components/modals.js'; 

let currentProductData = null;
let currentDetailData = null;
let currentScanSession = 0; 

export const ScannerEngine = {
    
    openScanner() {
        safeDOM.execute('packageImgInput', el => el.click());
    },

    // ------------------------------------------------------------------------
    // 1. 扫码极速穿透引擎
    // ------------------------------------------------------------------------
    async handlePackageImage(event) {
        const file = event.target.files[0]; 
        if (!file) return;

        const sessionId = ++currentScanSession;

        safeDOM.execute('homeActionBox', el => el.style.display = 'none');
        safeDOM.execute('previewContainer', el => el.style.display = 'block');
        safeDOM.execute('scanOverlay', el => el.style.display = 'flex');
        safeDOM.execute('scanText', el => el.innerText = "📡 大脑飞速解析中...");

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                safeDOM.execute('previewImg', el => { el.src = e.target.result; el.style.display = 'block'; });
                const base64Data = e.target.result.split(',')[1];
                
                const res = await fetch('/api/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64Data })
                });

                if (sessionId !== currentScanSession) return; 
                if (!res.ok) throw new Error("AI 解析失败，请重试");
                
                const data = await res.json();
                data.scanned_img = e.target.result; 
                
                // 保存足迹
                this._addToHistory(data);
                
                // 🌟 核心改动：隐藏扫描界面，直接穿透到详情页！不用再多点一次！
                safeDOM.execute('scanOverlay', el => el.style.display = 'none'); 
                safeDOM.execute('previewContainer', el => el.style.display = 'none');
                safeDOM.execute('homeActionBox', el => el.style.display = 'flex');
                
                this._renderAndOpenDetail(data);

            } catch (error) {
                if (sessionId === currentScanSession) {
                    safeDOM.execute('scanText', el => el.innerText = "❌ 解析失败: " + error.message);
                    setTimeout(() => {
                        safeDOM.execute('scanOverlay', el => el.style.display = 'none'); 
                        safeDOM.execute('previewContainer', el => el.style.display = 'none');
                        safeDOM.execute('homeActionBox', el => el.style.display = 'flex');
                    }, 2000);
                }
            }
        };
        reader.readAsDataURL(file);
    },

    // ------------------------------------------------------------------------
    // 2. 足迹卡片渲染引擎 (带互动打分)
    // ------------------------------------------------------------------------
    renderFootprints() {
        safeDOM.execute('footprintList', container => {
            const history = JSON.parse(localStorage.getItem('hp_scan_history') || '[]');
            if (history.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:60px 20px; color:#9CA3AF; font-size:14px;">暂无扫码足迹哦~ 快去超市扫一扫吧！</div>';
                return;
            }
            
            let html = '';
            history.forEach((item, index) => {
                const img = item.scanned_img || item.image_url || 'https://via.placeholder.com/100';
                html += `
                <div style="background:#FFF; border-radius:20px; padding:16px; margin-bottom:16px; box-shadow:0 4px 15px rgba(0,0,0,0.03); border:1px solid #F1F5F9; display:flex; flex-direction:column; gap:16px;">
                    
                    <div style="display:flex; gap:16px; cursor:pointer;" onclick="window.App.openDetailsFromHistory(${index})">
                        <img src="${img}" style="width:80px; height:80px; border-radius:14px; object-fit:cover; border:1px solid #F1F5F9; flex-shrink:0;">
                        <div style="flex:1; overflow:hidden;">
                            <div style="font-size:16px; font-weight:900; color:#111827; margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.chinese_name || item.dutch_name}</div>
                            <div style="font-size:12px; color:#64748B; font-weight:bold; margin-bottom:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.category || '超市好物'}</div>
                            <div style="font-size:12px; color:#475569; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; line-height:1.4;">${item.insight || '暂无评测'}</div>
                        </div>
                    </div>
                    
                    <div style="display:flex; gap:10px; border-top:1px dashed #E5E7EB; padding-top:16px;">
                        <button onclick="window.App.voteFromFootprint('${item.dutch_name}', 'like', this)" style="flex:1; background:#FEF2F2; color:#EF4444; border:1px solid #FECACA; padding:10px 0; border-radius:12px; font-size:13px; font-weight:900; cursor:pointer; transition:0.2s;">🔥 狂赞</button>
                        <button onclick="window.App.voteFromFootprint('${item.dutch_name}', 'dislike', this)" style="flex:1; background:#F8FAFC; color:#475569; border:1px solid #E2E8F0; padding:10px 0; border-radius:12px; font-size:13px; font-weight:900; cursor:pointer; transition:0.2s;">💣 避雷</button>
                        <button onclick="window.App.reviewFromFootprint(${index})" style="flex:1; background:#F0FDF4; color:#10B981; border:1px solid #A7F3D0; padding:10px 0; border-radius:12px; font-size:13px; font-weight:900; cursor:pointer;">💬 点评</button>
                    </div>
                </div>`;
            });
            container.innerHTML = html;
        });
    },

    // ------------------------------------------------------------------------
    // 3. 足迹专属交互
    // ------------------------------------------------------------------------
    openDetailsFromHistory(index) {
        try {
            const history = JSON.parse(localStorage.getItem('hp_scan_history') || '[]');
            if (history[index]) this._renderAndOpenDetail(history[index]);
        } catch (e) { console.error("历史读取失败:", e); }
    },

    async voteFromFootprint(dutchName, action, btnElement) {
        // UI 提前给反馈
        const originalText = btnElement.innerText;
        btnElement.innerText = "已记录 ✔";
        btnElement.style.opacity = "0.6";
        btnElement.style.pointerEvents = "none";
        
        showToast(action === 'like' ? "🔥 已为您推送至红榜！" : "💣 已记录，帮助他人避雷！", "success");

        try {
            const token = localStorage.getItem('hebao_token') || '';
            await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ dutch_name: dutchName, action: action })
            });
            // 刷新全网排行榜
            if (window.App && window.App.loadTrendingData) window.App.loadTrendingData();
        } catch (e) {
            console.error("足迹投票失败:", e);
        }
    },

    reviewFromFootprint(index) {
        try {
            const history = JSON.parse(localStorage.getItem('hp_scan_history') || '[]');
            if (history[index]) {
                currentProductData = history[index];
                ModalManager.injectIfNeeded('addReviewModal');
            }
        } catch (e) { console.error(e); }
    },

    // 🌟 详情页渲染 (加入非食品动态判断)
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

            // 🌟 动态判断：如果是日化/非食品，切换 UI 标题
            const isNonFood = data.category && (data.category.includes('日化') || data.category.includes('非食品') || data.category.includes('清洁'));
            safeDOM.execute('recipeTitleIcon', el => el.innerText = isNonFood ? '🧼' : '🍳');
            safeDOM.execute('recipeTitleText', el => el.innerText = isNonFood ? '使用指南 & 注意事项' : '食用指南 & 神仙吃法');

            // 隐藏深度盒子，开启骨架呼吸灯
            safeDOM.execute('detailRecipeBox', el => el.style.display = 'none');
            safeDOM.execute('detailAltBox', el => el.style.display = 'none');
            safeDOM.execute('detailReviewsBox', el => el.style.display = 'none');
            safeDOM.execute('detailAiLoading', el => el.style.display = 'block'); 

            // 异步请求深度数据
            const res = await fetch('/api/detail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dutchName: data.dutch_name, chineseName: data.chinese_name, isNonFood: isNonFood })
            });

            if (res.ok) {
                const deepData = await res.json();
                currentDetailData = deepData;
                safeDOM.execute('detailAiLoading', el => el.style.display = 'none');
                
                // 渲染指南
                if (deepData.methods || deepData.recipe_desc) {
                    safeDOM.execute('detailRecipeBox', el => el.style.display = 'block');
                    if (deepData.methods && Array.isArray(deepData.methods)) {
                        safeDOM.execute('recipeMethodTags', el => {
                            el.innerHTML = deepData.methods.map(m => `<span style="background:#F0FDF4; color:#047857; padding:4px 10px; border-radius:8px; font-size:12px; font-weight:bold; border:1px solid #A7F3D0;">${m}</span>`).join('');
                        });
                    }
                    safeDOM.execute('recipeDetails', el => el.innerText = deepData.recipe_desc || '暂无具体步骤~');
                }

                // 渲染平替
                if (deepData.alternatives && Array.isArray(deepData.alternatives) && deepData.alternatives.length > 0) {
                    safeDOM.execute('detailAltBox', el => el.style.display = 'block');
                    safeDOM.execute('detailAlternatives', el => {
                        el.innerHTML = deepData.alternatives.map(alt => `<span style="background:#F8FAFC; color:#475569; padding:6px 12px; border-radius:8px; font-size:13px; font-weight:bold; border:1px solid #E2E8F0;">${alt}</span>`).join('');
                    });
                }

                // 渲染高赞评论
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
                                        <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3\"></path></svg>
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

    // 🌟 修复：加入历史后立即重绘足迹列表！
    _addToHistory(data) {
        try {
            let history = JSON.parse(localStorage.getItem('hp_scan_history') || '[]');
            
            // 严谨去重：防止名字为空时的误删
            const key = data.dutch_name || data.chinese_name || String(Date.now());
            history = history.filter(item => (item.dutch_name || item.chinese_name) !== key);
            
            history.unshift(data);
            if (history.length > 20) history.pop(); 
            localStorage.setItem('hp_scan_history', JSON.stringify(history));

            // 🌟 核心：存完之后立刻刷新 UI，保证切到“我的足迹”时 100% 有数据！
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
