// ============================================================================
// js/modules/scanner.js - 极速扫码、足迹单选锁定、原生点评与 UGC 图片引擎
// ============================================================================
import { showToast } from '../core/toast.js';
import { safeDOM } from '../core/dom.js'; 

let currentProductData = null;
let currentDetailData = null;
let currentScanSession = 0; 

export const ScannerEngine = {
    
    // 🌟 新增：在 App 启动时，初始化一次 UGC 图片上传的监听
    initDetailsUgcHandler() {
        safeDOM.execute('detailUgcImgInput', el => {
            el.onchange = this.handleDetailUgcImage.bind(this);
        });
    },

    openScanner() {
        safeDOM.execute('packageImgInput', el => el.click());
    },

    // 🌟 前端 Canvas 极速图片压缩
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

                    if (width > maxWidth) {
                        height = Math.round((height *= maxWidth / width));
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
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

        safeDOM.execute('homeActionBox', el => el.style.display = 'none');
        safeDOM.execute('previewContainer', el => el.style.display = 'block');
        safeDOM.execute('scanOverlay', el => el.style.display = 'flex');
        safeDOM.execute('scanText', el => el.innerText = "📡 正在压缩图片...");

        try {
            const compressedImage = await this.compressImage(file, 800, 0.6);
            safeDOM.execute('previewImg', el => { el.src = compressedImage; el.style.display = 'block'; });
            safeDOM.execute('scanText', el => el.innerText = "🧠 大脑飞速解析中...");

            const base64Data = compressedImage.split(',')[1];
            
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64Data })
            });

            if (sessionId !== currentScanSession) return; 
            if (!res.ok) throw new Error("AI 解析失败，请重试");
            
            const data = await res.json();
            data.scanned_img = compressedImage; 
            
            this._addToHistory(data);
            
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
            event.target.value = '';
        }
    },

    // ------------------------------------------------------------------------
    // 🌟 新增：UGC 图片上传引擎 (详情页用户上传闭环)
    // ------------------------------------------------------------------------
    async handleDetailUgcImage(event) {
        const file = event.target.files[0]; 
        if (!file || !currentProductData) return;

        // 绑定 upload 按钮的 Loading 状态
        safeDOM.execute('uploadFirstPhotoBtn', el => {
            el.innerHTML = '<span style="display:inline-block; animation:spin 1s linear infinite;">⏳</span> 正在上传...';
            el.style.opacity = '0.7';
            el.style.pointerEvents = 'none';
        });

        try {
            // 用户上传也进行极速 Canvas 压缩
            const compressedImage = await this.compressImage(file, 800, 0.6);
            
            // 1. 更新当前内存数据
            currentProductData.scanned_img = compressedImage;
            // 如果后端拉取过来的也有 image_url，强制覆盖为新传的
            currentProductData.image_url = compressedImage; 
            
            // 2. 更新 localStorage 足迹中的图片 (确保刷新后不丢失)
            let history = JSON.parse(localStorage.getItem('hp_scan_history') || '[]');
            history = history.map(item => {
                if((item.dutch_name || item.chinese_name) === (currentProductData.dutch_name || currentProductData.chinese_name)) {
                    item.scanned_img = compressedImage;
                    item.image_url = compressedImage;
                }
                return item;
            });
            localStorage.setItem('hp_scan_history', JSON.stringify(history));

            showToast("📸 感谢上传！商品图片已更新为您的杰作！", "success");
            
            // 3. 核心：重新渲染详情页，由于有图了，会自动切换为大图模式
            this._renderAndOpenDetail(currentProductData);

        } catch (error) {
            showToast("❌ 上传失败: " + error.message, "error");
        } finally {
            safeDOM.execute('uploadFirstPhotoBtn', el => {
                el.innerHTML = '📸 我来上传';
                el.style.opacity = '1';
                el.style.pointerEvents = 'auto';
            });
            // 清空 input 保证下次可传同名图片
            event.target.value = '';
        }
    },

    // ------------------------------------------------------------------------
    // 2. 足迹卡片渲染引擎 (保留投票互斥锁定)
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
                
                const voteStatus = item.vote_status || null; 

                let likeStyle = "flex:1; background:#FEF2F2; color:#EF4444; border:1px solid #FECACA; padding:10px 0; border-radius:12px; font-size:13px; font-weight:900; cursor:pointer; transition:0.2s;";
                let dislikeStyle = "flex:1; background:#F8FAFC; color:#475569; border:1px solid #E2E8F0; padding:10px 0; border-radius:12px; font-size:13px; font-weight:900; cursor:pointer; transition:0.2s;";
                let likeText = "🔥 狂赞";
                let dislikeText = "💣 避雷";

                if (voteStatus === 'like') {
                    likeStyle = "flex:1; background:#EF4444; color:#FFF; border:none; padding:10px 0; border-radius:12px; font-size:13px; font-weight:900; cursor:default; box-shadow:0 4px 10px rgba(239,68,68,0.2);";
                    dislikeStyle = "flex:1; background:#F8FAFC; color:#94A3B8; border:1px solid #E2E8F0; padding:10px 0; border-radius:12px; font-size:13px; font-weight:900; cursor:not-allowed; opacity:0.4;";
                    likeText = "🔥 已种草";
                } else if (voteStatus === 'dislike') {
                    likeStyle = "flex:1; background:#FEF2F2; color:#FCA5A5; border:1px solid #FECACA; padding:10px 0; border-radius:12px; font-size:13px; font-weight:900; cursor:not-allowed; opacity:0.4;";
                    dislikeStyle = "flex:1; background:#111827; color:#FFF; border:none; padding:10px 0; border-radius:12px; font-size:13px; font-weight:900; cursor:default; box-shadow:0 4px 10px rgba(17,24,39,0.2);";
                    dislikeText = "💣 已避雷";
                }

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
                        <button onclick="window.App.voteFromFootprint(${index}, 'like')" style="${likeStyle}">${likeText}</button>
                        <button onclick="window.App.voteFromFootprint(${index}, 'dislike')" style="${dislikeStyle}">${dislikeText}</button>
                        <button onclick="window.App.reviewFromFootprint(${index})" style="flex:1; background:#F0FDF4; color:#10B981; border:1px solid #A7F3D0; padding:10px 0; border-radius:12px; font-size:13px; font-weight:900; cursor:pointer;">💬 点评</button>
                    </div>
                </div>`;
            });
            container.innerHTML = html;
        });
    },

    // ------------------------------------------------------------------------
    // 3. 足迹操作 (保留所有逻辑)
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

    async voteFromFootprint(index, action) {
        let history = JSON.parse(localStorage.getItem('hp_scan_history') || '[]');
        const targetItem = history[index];
        if (!targetItem || !targetItem.dutch_name) return showToast("商品信息有误", "error");

        if (targetItem.vote_status) return showToast("您已经表过态啦！", "warning");

        targetItem.vote_status = action;
        localStorage.setItem('hp_scan_history', JSON.stringify(history));
        this.renderFootprints(); 
        
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
            if (!history[index]) return;
            currentProductData = history[index];

            let modal = document.getElementById('customCleanReviewModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'customCleanReviewModal';
                modal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.6); z-index:999999; justify-content:center; align-items:center; backdrop-filter:blur(4px); opacity:0; transition:opacity 0.2s;';
                modal.innerHTML = `
                    <div style="background:#FFF; width:85%; max-width:340px; border-radius:24px; padding:24px; box-shadow:0 10px 40px rgba(0,0,0,0.2); transform:scale(0.9); transition:0.2s;" id="ccReviewContent">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                            <div style="font-size:18px; font-weight:900; color:#111827;">发表真实点评 ✍️</div>
                            <div onclick="document.getElementById('customCleanReviewModal').style.opacity=0; setTimeout(()=>document.getElementById('customCleanReviewModal').style.display='none', 200);" style="width:30px; height:30px; background:#F1F5F9; border-radius:15px; display:flex; align-items:center; justify-content:center; color:#64748B; font-weight:bold; cursor:pointer;">✕</div>
                        </div>
                        <textarea id="ccReviewInput" placeholder="这玩意儿味道怎么样？怎么做最好吃？(畅所欲言)..." style="width:100%; box-sizing:border-box; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:16px; padding:16px; font-size:14px; color:#334155; height:120px; outline:none; resize:none; margin-bottom:20px; font-weight:bold; line-height:1.5;"></textarea>
                        <button onclick="window.App.submitCustomReview()" style="width:100%; background:#10B981; color:#FFF; border:none; padding:14px; border-radius:16px; font-size:16px; font-weight:900; cursor:pointer; box-shadow:0 4px 15px rgba(16,185,129,0.3); transition:0.1s;" onmousedown="this.style.transform='scale(0.96)'" onmouseup="this.style.transform='scale(1)'">🚀 提交评价</button>
                    </div>
                `;
                document.body.appendChild(modal);
            }

            document.getElementById('ccReviewInput').value = '';
            modal.style.display = 'flex';
            void modal.offsetWidth; 
            modal.style.opacity = '1';
            document.getElementById('ccReviewContent').style.transform = 'scale(1)';
        } catch (e) { console.error(e); }
    },

    async submitCustomReview() {
        const text = document.getElementById('ccReviewInput').value.trim();
        if (!text || !currentProductData) return showToast("写点什么再提交吧~", "warning");
        
        try {
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
            
            const modal = document.getElementById('customCleanReviewModal');
            if (modal) {
                modal.style.opacity = '0';
                setTimeout(() => modal.style.display = 'none', 200);
            }

            showToast("🎉 评价发布成功！感谢为村友排雷！", "success");
            
            const detailsPage = document.getElementById('page-details');
            if(detailsPage && detailsPage.style.display !== 'none') {
                 this._renderAndOpenDetail(currentProductData);
            }

        } catch (e) {
            showToast(e.message, "error");
        }
    },

    // ------------------------------------------------------------------------
    // 4. 详情页极速与深度分层渲染引擎 (🌟 加入双模无图切换逻辑)
    // ------------------------------------------------------------------------
    async _renderAndOpenDetail(data) {
        try {
            if (window.switchTab) window.switchTab('details');
            currentProductData = data; 

            // 🌟 核心升级：判断是否有图片，动态切换顶部 UI 模式
            const productImage = data.image_url || data.scanned_img;
            const contentPanel = document.getElementById('detailContentPanel');

            if (productImage) {
                // 有图模式
                safeDOM.execute('headerImgMode', el => el.style.display = 'block');
                safeDOM.execute('headerNoImgMode', el => el.style.display = 'none');
                safeDOM.execute('detailImg', el => el.src = productImage);
                if(contentPanel) contentPanel.style.marginTop = '-30px';
            } else {
                // 无图模式：显示占位引导并绑定上传事件
                safeDOM.execute('headerImgMode', el => el.style.display = 'none');
                safeDOM.execute('headerNoImgMode', el => el.style.display = 'block');
                if(contentPanel) contentPanel.style.marginTop = '-5px';

                safeDOM.execute('uploadFirstPhotoBtn', el => {
                    el.onclick = () => safeDOM.execute('detailUgcImgInput', input => input.click());
                });

                // 动态 Emoji 占位背景
                let fallbackBg = "linear-gradient(135deg, #F8FAFC, #E2E8F0)";
                let fallbackEmoji = "🛍️";
                if (data.category === '懒人速食') { fallbackBg = "linear-gradient(135deg, #FFF7ED, #FFEDD5)"; fallbackEmoji = "🥡"; }
                else if (data.category === '厨房生鲜') { fallbackBg = "linear-gradient(135deg, #FEF2F2, #FEE2E2)"; fallbackEmoji = "🥩"; }
                else if (data.category === '追剧零食') { fallbackBg = "linear-gradient(135deg, #FEFCE8, #FEF08A)"; fallbackEmoji = "🍪"; }
                else if (data.category === '租房日用') { fallbackBg = "linear-gradient(135deg, #F0FDF4, #DCFCE7)"; fallbackEmoji = "🧼"; }
                else if (data.category === '萌宠好物') { fallbackBg = "linear-gradient(135deg, #FAF5FF, #F3E8FF)"; fallbackEmoji = "🐾"; }
                
                safeDOM.execute('fallbackNoImgBlock', el => {
                    el.style.background = fallbackBg;
                    el.innerHTML = fallbackEmoji;
                });
            }

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

// 🌟 确保 App 启动时，初始化 UGC 文件监听器
if (typeof window !== 'undefined') {
    window.App = window.App || {};
    Object.keys(ScannerEngine).forEach(key => {
        if (typeof ScannerEngine[key] === 'function') {
            window.App[key] = ScannerEngine[key].bind(ScannerEngine);
        }
    });
    
    document.addEventListener('DOMContentLoaded', () => {
        window.App.initDetailsUgcHandler();
    });
}
