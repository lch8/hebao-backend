// ============================================================================
// js/modules/scanner.js - 扫码与商品详情引擎 (极度防御版)
// ============================================================================
import { showToast } from '../core/toast.js';

let currentProductData = null;
let currentDetailData = null;
let html5Scanner = null;

export const ScannerEngine = {
    // ------------------------------------------------------------------------
    // 1. 图片上传解析 (AI 扫包装)
    // ------------------------------------------------------------------------
    async handlePackageImage(event) {
        try {
            const file = event.target.files[0]; 
            if (!file) return;

            // 🛡️ 防御性 DOM 状态切换
            if (document.getElementById('homeActionBox')) document.getElementById('homeActionBox').style.display = 'none'; 
            if (document.getElementById('previewContainer')) document.getElementById('previewContainer').style.display = 'block'; 
            if (document.getElementById('scanOverlay')) document.getElementById('scanOverlay').style.display = 'flex'; 
            if (document.getElementById('scanText')) document.getElementById('scanText').innerText = "📡 正在解析包装..."; 
            if (document.getElementById('miniResultCard')) document.getElementById('miniResultCard').style.display = 'none';

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const base64Data = e.target.result.split(',')[1]; 
                    if (document.getElementById('previewImg')) document.getElementById('previewImg').src = e.target.result;

                    // 获取 Auth Headers (假设 auth.js 已挂载到 window.App)
                    const headers = window.App && window.App.getAuthHeaders ? window.App.getAuthHeaders() : { 'Content-Type': 'application/json' };

                    const res = await fetch('/api/scan', { 
                        method: 'POST', 
                        headers: headers, 
                        body: JSON.stringify({ imageBase64: base64Data }) 
                    });
                    
                    const data = await res.json(); 
                    if (!res.ok || data.error) throw new Error(data.error || "识别失败");

                    currentProductData = data; 
                    currentProductData.image_url = e.target.result; 

                    // 🛡️ 防御性 UI 恢复与渲染
                    if (document.getElementById('scanOverlay')) document.getElementById('scanOverlay').style.display = 'none'; 
                    if (document.getElementById('previewContainer')) document.getElementById('previewContainer').style.display = 'none'; 
                    if (document.getElementById('miniResultCard')) document.getElementById('miniResultCard').style.display = 'block'; 
                    
                    const emoji = data.is_recommended === 1 ? '👍' : '💣'; 
                    if (document.getElementById('miniChineseName')) {
                        document.getElementById('miniChineseName').innerText = `${emoji} ${data.chinese_name || data.dutch_name || '未知商品'}`; 
                    }
                    if (document.getElementById('miniInsight')) {
                        document.getElementById('miniInsight').innerText = data.insight || '管家觉得不错~'; 
                    }

                    this.saveToLocalFootprint(data, data.image_url);
                } catch (err) {
                    showToast("识别失败：" + err.message, "error"); 
                    this.resetApp();
                } finally { 
                    if (document.getElementById('packageImgInput')) document.getElementById('packageImgInput').value = ''; 
                }
            }; 
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("🚨 [Scanner] handlePackageImage 严重崩溃拦截:", error);
            showToast("系统异常，图片读取失败", "error");
            this.resetApp();
        }
    },

    // ------------------------------------------------------------------------
    // 2. 摄像头扫码 (条形码)
    // ------------------------------------------------------------------------
    startBarcodeScan() {
        try {
            if (!window.Html5Qrcode) {
                showToast("扫码引擎尚未加载完毕，请稍后再试", "warning");
                return;
            }
            if (document.getElementById('scannerModal')) document.getElementById('scannerModal').style.display = 'flex'; 
            
            html5Scanner = new window.Html5Qrcode("reader");
            const config = { 
                fps: 10, 
                qrbox: { width: 250, height: 150 }, 
                aspectRatio: 1.0, 
                formatsToSupport: [ window.Html5QrcodeSupportedFormats.EAN_13, window.Html5QrcodeSupportedFormats.EAN_8, window.Html5QrcodeSupportedFormats.UPC_A ] 
            };
            
            html5Scanner.start({ facingMode: "environment" }, config, (decodedText) => { 
                if (navigator.vibrate) navigator.vibrate(100); 
                this.closeScanner(); 
                if (document.getElementById('mainSearchInput')) {
                    document.getElementById('mainSearchInput').value = decodedText; 
                    this.executeSearch(); 
                }
            }).catch(err => { 
                console.warn("调用摄像头失败/被拒绝:", err);
                showToast("调用摄像头失败，请检查权限"); 
                this.closeScanner(); 
            });
        } catch (error) {
            console.error("🚨 [Scanner] startBarcodeScan 崩溃拦截:", error);
            this.closeScanner();
        }
    },

    closeScanner() { 
        try {
            if(html5Scanner) { 
                html5Scanner.stop().catch(e => console.warn("停止扫描器警告:", e)); 
                html5Scanner = null; 
            } 
            if (document.getElementById('scannerModal')) document.getElementById('scannerModal').style.display = 'none'; 
        } catch (error) {
            console.error("🚨 [Scanner] closeScanner 崩溃拦截:", error);
        }
    },

    executeSearch() {
        try {
            const inputEl = document.getElementById('mainSearchInput');
            const query = inputEl ? inputEl.value.trim() : ''; 
            if (!query) return;

            // UI 切换
            if (document.getElementById('homeActionBox')) document.getElementById('homeActionBox').style.display='none'; 
            if (document.getElementById('previewContainer')) document.getElementById('previewContainer').style.display='block'; 
            if (document.getElementById('scanOverlay')) document.getElementById('scanOverlay').style.display='flex'; 
            if (document.getElementById('scanText')) document.getElementById('scanText').innerText = "📡 全网检索中..."; 
            if (document.getElementById('miniResultCard')) document.getElementById('miniResultCard').style.display='none';

            const headers = window.App && window.App.getAuthHeaders ? window.App.getAuthHeaders() : { 'Content-Type': 'application/json' };
            const uid = window.userUUID || '';

            fetch('/api/scan-barcode', { 
                method: 'POST', 
                headers: headers, 
                body: JSON.stringify({ barcode: query, userId: uid }) 
            })
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                currentProductData = data; 
                
                if (document.getElementById('scanOverlay')) document.getElementById('scanOverlay').style.display='none'; 
                if (document.getElementById('previewContainer')) document.getElementById('previewContainer').style.display='none'; 
                if (document.getElementById('miniResultCard')) document.getElementById('miniResultCard').style.display='block'; 
                if (document.getElementById('miniChineseName')) document.getElementById('miniChineseName').innerText = data.chinese_name || '未知商品'; 
                if (document.getElementById('miniInsight')) document.getElementById('miniInsight').innerText = data.insight || '暂无评价'; 
                
                this.saveToLocalFootprint(data, data.image_url);
            }).catch(err => { 
                showToast("未找到该商品", "warning"); 
                this.resetApp(); 
            });
        } catch (error) {
            console.error("🚨 [Scanner] executeSearch 崩溃拦截:", error);
            this.resetApp();
        }
    },

    resetApp() { 
        try {
            if (document.getElementById('previewContainer')) document.getElementById('previewContainer').style.display='none'; 
            if (document.getElementById('scanOverlay')) document.getElementById('scanOverlay').style.display='none'; 
            if (document.getElementById('miniResultCard')) document.getElementById('miniResultCard').style.display='none'; 
            if (document.getElementById('homeActionBox')) document.getElementById('homeActionBox').style.display='flex'; 
            if (document.getElementById('mainSearchInput')) document.getElementById('mainSearchInput').value = ''; 
        } catch (error) {
            console.error("🚨 [Scanner] resetApp 失败:", error);
        }
    },

    // ------------------------------------------------------------------------
    // 3. 详情页深度渲染 (DeepSeek 呼吸灯保护)
    // ------------------------------------------------------------------------
    openDetailsFromScan() { 
        currentDetailData = {...currentProductData}; 
        this.setupDetailPage(); 
    },
    
    openDetailsFromHistory(index) { 
        try {
            let h = JSON.parse(localStorage.getItem('hebao_history')||'[]'); 
            currentDetailData = h[index]; 
            this.setupDetailPage(); 
        } catch(e) {
            showToast("足迹数据已损坏", "error");
        }
    },

    async setupDetailPage() {
        const d = currentDetailData; 
        if (!d) {
            showToast("获取商品数据失败", "error");
            return;
        }
        
        try {
            // [防崩溃 1] 瞬间渲染大图与基础信息
            const imgEl = document.getElementById('detailImg'); 
            if(imgEl) {
                imgEl.src = d.image_url || d.img_src || 'https://images.unsplash.com/photo-1544025162-8315ea07659b?q=80&w=600&auto=format&fit=crop'; 
                // 注意：openLightbox 需确保在全局或通过 window.App 引用
                imgEl.onclick = function() { if(window.App && window.App.openLightbox) window.App.openLightbox(this.src); }; 
            }
            
            if(document.getElementById('detailChineseName')) document.getElementById('detailChineseName').innerText = d.chinese_name || d.dutch_name || '未知商品'; 
            if(document.getElementById('detailDutchName')) document.getElementById('detailDutchName').innerText = d.dutch_name || ''; 
            
            const insightBox = document.getElementById('detailInsightBox');
            if(insightBox) insightBox.style.display = d.insight ? 'block' : 'none'; 
            if(document.getElementById('detailInsight')) document.getElementById('detailInsight').innerText = d.insight || '';
            
            const warningBox = document.getElementById('detailWarningBox');
            if(warningBox) warningBox.style.display = d.warning ? 'block' : 'none'; 
            if(document.getElementById('detailWarning')) document.getElementById('detailWarning').innerText = d.warning || '';
            
            if(document.getElementById('chatHistory')) document.getElementById('chatHistory').innerHTML = ''; 
            if(document.getElementById('askInput')) document.getElementById('askInput').value = ''; 
            
            // 切换到详情页面 Tab (依赖外部 ui.js，做安全调用)
            if(window.switchTab) window.switchTab('details', null);

            // [防崩溃 2] 异步深度加载模块
            const altBox = document.getElementById('detailAltBox');
            const altContent = document.getElementById('detailAlternatives');
            const recipeBox = document.getElementById('detailRecipeBox');
            const recipeList = document.getElementById('recipeCardList');
            
            if(recipeBox) recipeBox.style.display = 'block';

            // 命中本地缓存：秒开
            if (d.alternatives && d.pairing) {
                if(altBox && altContent) { 
                    altBox.style.display='block'; 
                    altContent.innerHTML = d.alternatives.split('|').map(p=>`<div class="alt-tag">${p}</div>`).join(''); 
                }
                this.renderReviewCards(d.pairing);
            } else {
                // 未命中缓存：渲染 AI 呼吸灯
                if(altBox) altBox.style.display = 'none';
                if(recipeList) recipeList.innerHTML = '<div style="text-align:center; color:#6366F1; padding:30px 0; font-weight:bold;"><span class="pulse-dot" style="display:inline-block; background:#6366F1; margin-right:8px;"></span>DeepSeek 正在深度评测平替与口味...</div>';
                
                try {
                    const headers = window.App && window.App.getAuthHeaders ? window.App.getAuthHeaders() : { 'Content-Type': 'application/json' };
                    const res = await fetch('/api/detail', {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({ dutchName: d.dutch_name, chineseName: d.chinese_name || '' })
                    });
                    const deepData = await res.json();
                    
                    // 渲染 API 返回平替
                    if(deepData.alternatives) { 
                        d.alternatives = deepData.alternatives;
                        if(altBox && altContent) { 
                            altBox.style.display='block'; 
                            altContent.innerHTML = deepData.alternatives.split('|').map(p=>`<div class="alt-tag">${p}</div>`).join(''); 
                        }
                    }
                    
                    // 渲染 API 返回点评
                    if(deepData.pairing) {
                        d.pairing = deepData.pairing; 
                        this.renderReviewCards(deepData.pairing);
                    } else {
                        if(recipeList) recipeList.innerHTML = '<div style="text-align:center;color:#9CA3AF;font-size:13px;padding:20px 0;">暂无评价</div>';
                    }

                    // 写入本地缓存，下次秒出
                    let history = JSON.parse(localStorage.getItem('hebao_history') || '[]'); 
                    let index = history.findIndex(i => i.dutch_name === d.dutch_name);
                    if(index !== -1) { 
                        history[index].alternatives = d.alternatives;
                        history[index].pairing = d.pairing; 
                        localStorage.setItem('hebao_history', JSON.stringify(history)); 
                    }
                } catch(e) {
                    console.error("🚨 DeepSeek 获取失败:", e);
                    if(recipeList) recipeList.innerHTML = '<div style="text-align:center;color:#EF4444;font-size:13px;padding:20px 0;">深度报告生成网络拥堵，请重试</div>';
                }
            }
        } catch(e) {
            console.error("🚨 [Scanner] setupDetailPage 全局崩溃拦截:", e);
            showToast("页面结构缺失，渲染详情失败", "error");
        }
    },

    // ------------------------------------------------------------------------
    // 4. 用户点评与足迹子功能
    // ------------------------------------------------------------------------
    renderReviewCards(pairingString) {
        try {
            const list = document.getElementById('recipeCardList'); 
            if(!list) return;
            
            list.innerHTML = '';
            let reviews = pairingString.split('\n\n').filter(l => l.trim()).map((line, idx) => {
                const isLike = line.includes('👍'); 
                const isRealUser = line.includes('🧑‍🍳'); 
                const cleanText = line.replace(/🧑‍🍳 网友点评 \[.*?\]：|🤖 AI预测口味 \[.*?\]：/, '').trim();
                return { 
                    id: idx, text: cleanText, isLike, isRealUser, 
                    likes: isRealUser ? Math.floor(Math.random() * 50) + 5 : 0, 
                    avatar: isRealUser ? ['🐼','😎','👻','👩‍💻','🐱'][idx % 5] : '🤖', 
                    name: isRealUser ? '热心网友_' + Math.floor(Math.random()*900+100) : 'AI 预测' 
                };
            });
            reviews.sort((a, b) => b.likes - a.likes);
            
            let html = '';
            reviews.forEach(r => {
                const tagHtml = r.isRealUser ? `<span class="r-tag ${r.isLike ? 'like' : 'dislike'}">${r.isLike ? '👍 推荐' : '💣 避雷'}</span>` : `<span class="r-tag" style="background:#F3F4F6; color:#6B7280;">🤖 AI</span>`;
                html += `<div class="recipe-card"><div class="r-header"><div class="r-user"><div class="r-avatar">${r.avatar}</div><div class="r-name">${r.name}</div>${tagHtml}</div><div class="r-like-btn" onclick="window.App.likeReviewCard(this)"><span style="font-size:14px;">💡</span> <span>${r.likes}</span></div></div><div class="r-text">${r.text}</div></div>`;
            });
            list.innerHTML = html;
        } catch (error) {
            console.error("🚨 [Scanner] renderReviewCards 失败:", error);
        }
    },

    likeReviewCard(btn) { 
        try {
            if(btn.classList.contains('voted')) return; 
            btn.classList.add('voted'); 
            const span = btn.querySelector('span:last-child'); 
            if(span) span.innerText = parseInt(span.innerText) + 1; 
        } catch (error) { /* 忽略轻微UI错位 */ }
    },

    async submitDetailReview() {
        try {
            const textEl = document.getElementById('reviewText');
            const attEl = document.getElementById('reviewAttitude');
            if(!textEl || !attEl) return;
            
            const text = textEl.value.trim(); 
            if(!text) return showToast("写点内容吧！");
            
            const attitude = attEl.value; 
            const finalUgcText = `🧑‍🍳 网友点评 [${attitude}]：${text}`;
            
            const btn = document.getElementById('btnSubmitReview'); 
            if(btn) { btn.innerText = "提交中..."; btn.disabled = true; }

            // 乐观更新本地
            if(currentDetailData) {
                currentDetailData.pairing = currentDetailData.pairing ? currentDetailData.pairing + '\n\n' + finalUgcText : finalUgcText;
                let history = JSON.parse(localStorage.getItem('hebao_history') || '[]'); 
                let index = history.findIndex(i => i.dutch_name === currentDetailData.dutch_name);
                if(index !== -1) { 
                    history[index].pairing = currentDetailData.pairing; 
                    localStorage.setItem('hebao_history', JSON.stringify(history)); 
                }
            }

            const headers = window.App && window.App.getAuthHeaders ? window.App.getAuthHeaders() : { 'Content-Type': 'application/json' };
            await fetch('/api/vote', { 
                method: 'POST', 
                headers: headers, 
                body: JSON.stringify({ dutch_name: currentDetailData.dutch_name, action: attitude.includes('推荐') ? 'like' : 'dislike' }) 
            });

            showToast("🎉 发布成功！", "success"); 
            if(document.getElementById('addReviewModal')) document.getElementById('addReviewModal').style.display = 'none'; 
            this.setupDetailPage();
        } catch(e) { 
            showToast("网络连接异常", "warning"); 
        } finally { 
            const btn = document.getElementById('btnSubmitReview');
            if(btn) { btn.innerText = "🚀 提交评价"; btn.disabled = false; }
        }
    },

    saveToLocalFootprint(data, img) { 
        try {
            let h = JSON.parse(localStorage.getItem('hebao_history')||'[]'); 
            if(!h.find(i=>i.dutch_name === data.dutch_name)){ 
                data.img_src = img; 
                h.unshift(data); 
                localStorage.setItem('hebao_history', JSON.stringify(h)); 
            } 
        } catch (error) {
            console.error("🚨 足迹写入失败，可能是无痕模式:", error);
        }
    },

    renderFootprints() { 
        try {
            const listDiv = document.getElementById('footprintList'); 
            if(!listDiv) return;

            let h = JSON.parse(localStorage.getItem('hebao_history') || '[]'); 
            if (h.length === 0) { 
                listDiv.innerHTML = '<div style="text-align:center; color:#9CA3AF; margin-top:20px; font-size:13px; border: 1px dashed #E5E7EB; padding: 30px; border-radius: 16px;">暂无足迹</div>'; 
                return; 
            } 
            
            let html = ''; 
            const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23F3F4F6'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='10' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'%3E暂无图%3C/text%3E%3C/svg%3E";
            h.forEach((item, index) => { 
                const safeImg = item.img_src || item.image_url || fallbackSvg;
                html += `<div style="background:#FFF; border-radius:16px; margin-bottom:12px; border:1px solid #E5E7EB; overflow:hidden; display:flex; align-items:center; padding:12px; box-shadow:0 2px 8px rgba(0,0,0,0.02); cursor:pointer;" onclick="window.App.openDetailsFromHistory(${index})">
                            <img src="${safeImg}" onerror="this.onerror=null; this.src='${fallbackSvg}'" style="width:50px; height:50px; object-fit:cover; border-radius:10px; flex-shrink:0; background:#F3F4F6;">
                            <div style="flex:1; margin-left:12px;">
                                <div style="font-weight:900; font-size:15px; color:#111827; margin-bottom:2px;">${item.chinese_name || '未命名'}</div>
                                <div style="font-size:12px; color:#9CA3AF; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;">${item.insight || ''}</div>
                            </div>
                        </div>`; 
            }); 
            listDiv.innerHTML = html; 
        } catch (error) {
            console.error("🚨 [Scanner] renderFootprints 渲染失败:", error);
        }
    }
};
