// ============================================================================
// js/modules/scanner.js - 扫码与商品详情引擎 (极度防御版 + 状态锁)
// ============================================================================
import { showToast } from '../core/toast.js';
import { safeDOM } from '../core/dom.js'; // 🛡️ 引入安全 DOM 引擎
import { ModalManager } from '../components/modals.js'; // 引入弹窗引擎

// 🔒 模块级私有状态 (使用 let，但增加 Session 锁防止异步覆盖)
let currentProductData = null;
let currentDetailData = null;
let html5Scanner = null;
let currentScanSession = 0; // 🌟 核心防串车锁：每次扫码递增

export const ScannerEngine = {
    // ------------------------------------------------------------------------
    // 1. 图片上传解析 (AI 扫包装)
    // ------------------------------------------------------------------------
    async handlePackageImage(event) {
        const file = event.target.files[0]; 
        if (!file) return;

        // 🌟 开启全新会话锁
        const sessionId = ++currentScanSession;

        // 🛡️ 全面使用 safeDOM 替代危险的直接操作
        safeDOM.execute('homeActionBox', el => el.style.display = 'none');
        safeDOM.execute('previewContainer', el => el.style.display = 'block');
        safeDOM.execute('scanOverlay', el => el.style.display = 'flex');
        safeDOM.execute('scanText', el => el.innerText = "📡 正在解析包装...");
        safeDOM.execute('miniResultCard', el => el.style.display = 'none');

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                // 渲染预览图
                safeDOM.execute('previewImg', el => {
                    el.src = e.target.result;
                    el.style.display = 'block';
                });

                const base64Data = e.target.result.split(',')[1];
                
                // 模拟网络请求 (调用你后端的 /api/scan)
                const res = await fetch('/api/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64Data })
                });

                // 🚦 异步返回后，检查锁是否被篡改（用户是不是中途取消了？）
                if (sessionId !== currentScanSession) {
                    console.warn(`🛡️ [Scanner] 拦截到过期的异步回调 (Session: ${sessionId})`);
                    return; 
                }

                if (!res.ok) throw new Error("AI 解析失败，请重试");
                const data = await res.json();
                
                // 保存到当前状态
                currentProductData = data;
                
                // 安全渲染结果卡片
                safeDOM.execute('miniResultCard', el => el.style.display = 'block');
                safeDOM.execute('scanOverlay', el => el.style.display = 'none'); // 隐藏 Loading
                
                safeDOM.execute('resEmoji', el => el.innerText = data.is_recommended ? '✅' : '🚨');
                safeDOM.execute('resTitle', el => el.innerText = data.chinese_name || data.dutch_name || '未知商品');
                safeDOM.execute('resDesc', el => el.innerText = data.insight || 'AI 还没看懂这是啥...');
                
                // 加入本地浏览历史
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
    // 2. 扫条形码入口 (对接 /api/scan-barcode)
    // ------------------------------------------------------------------------
    async startBarcodeScan() {
        const sessionId = ++currentScanSession;
        showToast("正在启动摄像头...", "info");
        
        // 假设这里调用了 Html5QrcodeScanner 逻辑... 
        // 简化展示防御性调用
        safeDOM.execute('homeActionBox', el => el.style.display = 'none');
        safeDOM.execute('previewContainer', el => el.style.display = 'block');
        
        // 此处应为你原有的扫码回调，接收到 barcode 后请求 /api/scan-barcode
        // 记得在 fetch 返回后同样做 if (sessionId !== currentScanSession) return; 的拦截！
    },

    // ------------------------------------------------------------------------
    // 3. 关闭扫码器，安全重置状态
    // ------------------------------------------------------------------------
    closeScanner() {
        currentScanSession++; // 强制过期正在进行的请求
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
    // 4. 打开详情页 (惰性注入 + 异步打底)
    // ------------------------------------------------------------------------
    openDetailsFromScan() {
        if (!currentProductData) return showToast("暂无商品数据", "warning");
        this._renderAndOpenDetail(currentProductData);
    },

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

    async _renderAndOpenDetail(data) {
        try {
            // 1. 切换 Tab UI
            if (window.switchTab) window.switchTab('details');

            // 2. 基础数据瞬间上屏 (不等待深度评测)
            safeDOM.execute('detailTitle', el => el.innerText = data.chinese_name || data.dutch_name);
            safeDOM.execute('detailSubtitle', el => el.innerText = data.dutch_name || '');
            safeDOM.execute('detailTag', el => {
                el.innerText = data.category || '未分类';
                el.style.background = data.is_recommended ? 'var(--brand-primary-light)' : '#FEE2E2';
                el.style.color = data.is_recommended ? 'var(--brand-primary-hover)' : '#B91C1C';
            });
            safeDOM.execute('detailInsight', el => el.innerText = data.insight || '暂无锐评');

            // 3. 处理避雷警告的显隐
            safeDOM.execute('detailWarningBox', el => el.style.display = data.warning ? 'flex' : 'none');
            safeDOM.execute('detailWarning', el => el.innerText = data.warning || '');

            // 4. 清空并显示 AI Loading 呼吸灯
            safeDOM.execute('detailAltBox', el => el.style.display = 'none');
            safeDOM.execute('detailRecipeBox', el => el.style.display = 'none');
            safeDOM.execute('detailAiLoading', el => el.style.display = 'flex'); // 假设你在 index.html 加了这个骨架屏

            // 5. 异步请求 DeepSeek 深度评测
            const res = await fetch('/api/detail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dutchName: data.dutch_name, chineseName: data.chinese_name })
            });

            if (res.ok) {
                const deepData = await res.json();
                currentDetailData = deepData;
                
                // 隐藏 Loading，渲染深度数据
                safeDOM.execute('detailAiLoading', el => el.style.display = 'none');
                
                // 渲染平替
                if (deepData.alternatives && deepData.alternatives.length > 0) {
                    safeDOM.execute('detailAltBox', el => el.style.display = 'block');
                    safeDOM.execute('detailAlternatives', el => {
                        el.innerHTML = deepData.alternatives.map(alt => `<span class="alt-tag">${alt}</span>`).join('');
                    });
                }

                // 渲染神仙吃法/网友点评
                if (deepData.recipe && deepData.recipe.length > 0) {
                    safeDOM.execute('detailRecipeBox', el => el.style.display = 'block');
                    safeDOM.execute('recipeCardList', el => {
                        el.innerHTML = deepData.recipe.map(r => `
                            <div class="recipe-card">
                                <div style="font-weight:bold; margin-bottom:5px;">${r.title}</div>
                                <div style="font-size:13px; color:var(--text-secondary);">${r.content}</div>
                            </div>
                        `).join('');
                    });
                }
            }

        } catch (error) {
            console.error("渲染详情页报错:", error);
            safeDOM.execute('detailAiLoading', el => el.style.display = 'none');
            showToast("深度评测加载失败", "warning");
        }
    },

    // ------------------------------------------------------------------------
    // 5. 其他交互：评价与点赞 (防爆处理)
    // ------------------------------------------------------------------------
    submitDetailReview(text) {
        if (!text) return;
        // JIT 弹窗渲染校验
        ModalManager.injectIfNeeded('addReviewModal');
        // ... 原有逻辑，注意用 safeDOM 替换 getElementById
        showToast("评价提交成功！", "success");
    },

    likeReviewCard(cardId) {
        // ... 点赞防抖逻辑
    },

    // 私有辅助方法：写入历史记录
    _addToHistory(data) {
        try {
            let history = JSON.parse(localStorage.getItem('hp_scan_history') || '[]');
            // 去重：如果扫过一样的，先删掉旧的
            history = history.filter(item => item.dutch_name !== data.dutch_name);
            history.unshift(data);
            if (history.length > 20) history.pop(); // 只存最近 20 条
            localStorage.setItem('hp_scan_history', JSON.stringify(history));
        } catch(e) { console.error("History Save Error:", e); }
    }
};
