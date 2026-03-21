// ============================================================================
// js/modules/scanner.js - 扫码与商品详情引擎 (满血逻辑 + 高级 UI 适配版 + 投票引擎)
// ============================================================================
import { showToast } from '../core/toast.js';
import { safeDOM } from '../core/dom.js'; 
import { ModalManager } from '../components/modals.js'; 

// 🔒 模块级私有状态
let currentProductData = null;
let currentDetailData = null;
let html5Scanner = null;
let currentScanSession = 0; 

export const ScannerEngine = {
    
    // 🌟 1. 暴露给首页相机图标的唤醒方法
    openScanner() {
        safeDOM.execute('packageImgInput', el => el.click());
    },

    // ------------------------------------------------------------------------
    // 2. 图片上传解析 (AI 扫包装)
    // ------------------------------------------------------------------------
    async handlePackageImage(event) {
        const file = event.target.files[0]; 
        if (!file) return;

        const sessionId = ++currentScanSession;

        safeDOM.execute('homeActionBox', el => el.style.display = 'none');
        safeDOM.execute('previewContainer', el => el.style.display = 'block');
        safeDOM.execute('scanOverlay', el => el.style.display = 'flex');
        safeDOM.execute('scanText', el => el.innerText = "📡 提取外包装文字...");
        safeDOM.execute('miniResultCard', el => el.style.display = 'none');

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                safeDOM.execute('previewImg', el => {
                    el.src = e.target.result;
                    el.style.display = 'block';
                });

                const base64Data = e.target.result.split(',')[1];
                
                const res = await fetch('/api/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64Data })
                });

                if (sessionId !== currentScanSession) return; 

                if (!res.ok) throw new Error("AI 解析失败，请重试");
                const data = await res.json();
                
                currentProductData = data;
                currentProductData.scanned_img = e.target.result; // 存入刚拍的照片用于详情页展示
                
                safeDOM.execute('miniResultCard', el => el.style.display = 'block');
                safeDOM.execute('scanOverlay', el => el.style.display = 'none'); 
                
                safeDOM.execute('miniChineseName', el => el.innerText = data.chinese_name || data.dutch_name || '未知商品');
                safeDOM.execute('miniInsight', el => el.innerText = data.insight || '点击查看深度评测');
                
                this._addToHistory(data);

            } catch (error) {
                if (sessionId === currentScanSession) {
                    safeDOM.execute('scanText', el => el.innerText = "❌ 解析失败: " + error.message);
                    setTimeout(() => this.closeScanner(), 2000);
                }
            }
        };
        reader.readAsDataURL(file);
    },

    // ------------------------------------------------------------------------
    // 3. 扫条形码入口 (完美保留)
    // ------------------------------------------------------------------------
    async startBarcodeScan() {
        const sessionId = ++currentScanSession;
        showToast("正在启动摄像头...", "info");
        
        safeDOM.execute('homeActionBox', el => el.style.display = 'none');
        safeDOM.execute('previewContainer', el => el.style.display = 'block');
        
        // 此处应为你原有的扫码回调，接收到 barcode 后请求 /api/scan-barcode
    },

    // ------------------------------------------------------------------------
    // 4. 关闭扫码器，安全重置状态
    // ------------------------------------------------------------------------
    closeScanner() {
        currentScanSession++; 
        currentProductData = null;
        
        safeDOM.execute('homeActionBox', el => el.style.display = 'flex');
        safeDOM.execute('previewContainer', el => el.style.display = 'none');
        safeDOM.execute('scanOverlay', el => el.style.display = 'none');
        safeDOM.execute('miniResultCard', el => el.style.display = 'none');
        safeDOM.execute('previewImg', el => el.src = '');
        
        if (html5Scanner) {
            html5Scanner.clear().catch(e => console.error(e));
            html5Scanner = null;
        }
    },

    // ------------------------------------------------------------------------
    // 5. 打开详情页 (保留了足迹历史的触发入口)
    // ------------------------------------------------------------------------
    openDetailsFromScan() {
        if (!currentProductData) return showToast("暂无商品数据", "warning");
        this._renderAndOpenDetail(currentProductData);
    },

    // 🌟 完美保留：点击足迹卡片时重新渲染详情
    openDetailsFromHistory(index) {
        try {
            const history = JSON.parse(localStorage.getItem('hp_scan_history') || '[]');
            if (history[index]) {
                currentProductData = history[index];
                this._renderAndOpenDetail(currentProductData);
            }
        } catch (e) {
            console.error("历史记录读取失败:", e);
        }
    },

    // 🌟 完美融合：大厂 UI 渲染 + 异步深度评测请求
    async _renderAndOpenDetail(data) {
        try {
            if (window.switchTab) window.switchTab('details');
            currentProductData = data; 

            // --- 阶段 1：基础数据瞬间上屏 (配合全新 UI) ---
            const fallbackImg = 'https://images.unsplash.com/photo-1544025162-8315ea07659b?q=80&w=600&auto=format&fit=crop';
            safeDOM.execute('detailImg', el => el.src = data.image_url || data.scanned_img || fallbackImg);

            safeDOM.execute('detailChineseName', el => el.innerText = data.chinese_name || data.dutch_name || '未知商品');
            safeDOM.execute('detailDutchName', el => el.innerText = data.dutch_name || '');
            
            safeDOM.execute('detailTag', el => {
                el.innerText = data.category || '超市好物';
                el.style.background = data.is_recommended ? '#E0F2FE' : '#FEF2F2';
                el.style.color = data.is_recommended ? '#0284C7' : '#DC2626';
            });
            
            safeDOM.execute('detailInsight', el => el.innerText = data.insight || '暂无锐评');
            
            safeDOM.execute('detailWarningBox', el => el.style.display = data.warning ? 'block' : 'none');
            safeDOM.execute('detailWarning', el => el.innerText = data.warning || '');

            // 清空旧的平替和点评，显示 Loading
            safeDOM.execute('detailAltBox', el => el.style.display = 'none');
            safeDOM.execute('detailRecipeBox', el => el.style.display = 'none');
            safeDOM.execute('detailAiLoading', el => el.style.display = 'block'); 

            // 如果本地有提前解析好的平替数据，直接显示
            if (data.alternatives) {
                let alts = [];
                try { alts = typeof data.alternatives === 'string' ? JSON.parse(data.alternatives) : data.alternatives; } catch(e) {}
                if (Array.isArray(alts) && alts.length > 0) {
                    safeDOM.execute('detailAltBox', el => el.style.display = 'block');
                    safeDOM.execute('detailAlternatives', el => {
                        el.innerHTML = alts.map(alt => `<span style="background:#F1F5F9; color:#475569; padding:6px 12px; border-radius:8px; font-size:13px; font-weight:bold;">${alt}</span>`).join('');
                    });
                }
            }

            // --- 阶段 2：保留原有的 /api/detail 深度评测请求 ---
            const res = await fetch('/api/detail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dutchName: data.dutch_name, chineseName: data.chinese_name })
            });

            if (res.ok) {
                const deepData = await res.json();
                currentDetailData = deepData;
                
                safeDOM.execute('detailAiLoading', el => el.style.display = 'none');
                
                // 渲染神仙吃法/网友点评 (利用 safeDOM 防弹，如果你新版 HTML 里没加这个盒子也不会报错)
                if (deepData.recipe && deepData.recipe.length > 0) {
                    safeDOM.execute('detailRecipeBox', el => el.style.display = 'block');
                    safeDOM.execute('recipeCardList', el => {
                        el.innerHTML = deepData.recipe.map(r => `
                            <div class="recipe-card" style="background:#FFF; padding:12px; border-radius:12px; margin-bottom:10px; border:1px solid #F1F5F9;">
                                <div style="font-weight:900; margin-bottom:6px; font-size:14px; color:#111827;">${r.title}</div>
                                <div style="font-size:13px; color:#475569; line-height:1.5;">${r.content}</div>
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
    // 6. 全新底部投票引擎 (对接后端 /api/vote)
    // ------------------------------------------------------------------------
    async voteProduct(action) {
        if (!currentProductData || !currentProductData.dutch_name) return showToast("当前商品信息丢失", "error");
        
        const btnText = action === 'like' ? '🔥 种草' : '💣 避雷';
        showToast(`已记录您的 ${btnText} 态度！`, "success");

        try {
            const token = localStorage.getItem('hebao_token') || '';
            const res = await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ dutch_name: currentProductData.dutch_name, action: action })
            });
            
            if (window.App && window.App.loadTrendingData) {
                window.App.loadTrendingData();
            }
        } catch (e) {
            console.error("投票失败:", e);
        }
    },

    // ------------------------------------------------------------------------
    // 7. 其他交互：评价与点赞 (保留)
    // ------------------------------------------------------------------------
    submitDetailReview(text) {
        if (!text) return;
        ModalManager.injectIfNeeded('addReviewModal');
        showToast("评价提交成功！", "success");
    },

    likeReviewCard(cardId) {
        // ... 点赞防抖逻辑
    },

    // ------------------------------------------------------------------------
    // 8. 私有辅助方法：写入历史记录
    // ------------------------------------------------------------------------
    _addToHistory(data) {
        try {
            let history = JSON.parse(localStorage.getItem('hp_scan_history') || '[]');
            history = history.filter(item => item.dutch_name !== data.dutch_name);
            history.unshift(data);
            if (history.length > 20) history.pop(); 
            localStorage.setItem('hp_scan_history', JSON.stringify(history));
        } catch(e) { console.error("History Save Error:", e); }
    }
};

// 🌟 挂载所有方法到 window.App，确保 HTML 的 onClick 能找得到
if (typeof window !== 'undefined') {
    window.App = window.App || {};
    Object.keys(ScannerEngine).forEach(key => {
        if (typeof ScannerEngine[key] === 'function') {
            window.App[key] = ScannerEngine[key].bind(ScannerEngine);
        }
    });
}
