// ============================================================================
// js/modules/profile.js - 用户个人中心与发布管理引擎 (带引流海报)
// ============================================================================
import { safeDOM } from '../core/dom.js';
import { showToast } from '../core/toast.js';
import { Skeleton } from '../core/skeleton.js';

window.myPostsCache = []; // 本地缓存我的发布

export const ProfileEngine = {
    // 1. 拉取我的发布列表
    async loadMyPosts() {
        const uuid = localStorage.getItem('hebao_uuid');
        if (!uuid) return;

        try {
            safeDOM.execute('myPostsList', el => el.innerHTML = Skeleton.myPosts(3));
            
            const res = await fetch(`/api/get-my-posts?userId=${uuid}`);
            const data = await res.json();
            
            if (data.success) {
                window.myPostsCache = data.posts || [];
                this.renderMyPosts();
            } else {
                showToast("加载失败: " + data.error, "error");
            }
        } catch (error) {
            console.error("加载我的发布失败:", error);
        }
    },

    renderMyPosts() {
        safeDOM.execute('myPostsList', container => {
            const emptyState = document.getElementById('postsEmptyState');
            if (window.myPostsCache.length === 0) {
                if (emptyState) emptyState.style.display = 'block';
                container.innerHTML = '';
                return;
            }
            if (emptyState) emptyState.style.display = 'none';

            // 日期格式化：3月24日 · 20:06
            const fmtDate = (str) => {
                if (!str) return '';
                const d = new Date(str);
                if (isNaN(d)) return str;
                const mo = d.getMonth() + 1, dy = d.getDate();
                const hh = String(d.getHours()).padStart(2,'0');
                const mm = String(d.getMinutes()).padStart(2,'0');
                return `${mo}月${dy}日 · ${hh}:${mm}`;
            };

            // 圆环 SVG（joined/max）
            const ringProgress = (joined, max) => {
                const r = 18, C = 2 * Math.PI * r;
                const pct = Math.min(joined / max, 1);
                const dash = (C * pct).toFixed(1);
                const gap  = (C - dash).toFixed(1);
                const isFull = joined >= max;
                const ringColor = isFull ? '#10B981' : '#7C3AED';
                return `
                <svg width="48" height="48" viewBox="0 0 48 48" style="flex-shrink:0;">
                  <circle cx="24" cy="24" r="${r}" fill="none" stroke="#F1F5F9" stroke-width="4"/>
                  <circle cx="24" cy="24" r="${r}" fill="none" stroke="${ringColor}" stroke-width="4"
                    stroke-dasharray="${dash} ${gap}"
                    stroke-linecap="round"
                    transform="rotate(-90 24 24)"
                    style="transition:stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1);"/>
                  <text x="24" y="28" text-anchor="middle"
                    style="font-size:11px; font-weight:900; fill:${ringColor}; font-family:monospace;">
                    ${joined}/${max}
                  </text>
                </svg>`;
            };

            let html = '';

            window.myPostsCache.forEach(post => {
                let contentObj = {};
                try { contentObj = typeof post.content === 'string' ? JSON.parse(post.content) : post.content; } catch(e) {}

                const typeMap = {
                    '[闲置]': { icon: '📦', label: '闲置', color: '#92400E', bg: '#FFFBEB', border: '#FDE68A', accentColor: '#D97706' },
                    '[互助]': { icon: '🤝', label: '悬赏', color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE', accentColor: '#2563EB' },
                    '[搭子]': { icon: '🏕️', label: '搭子', color: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE', accentColor: '#7C3AED' },
                };
                const typeEntry = Object.entries(typeMap).find(([k]) => post.title.includes(k));
                const { icon, label, color, bg, border, accentColor } = typeEntry
                    ? typeEntry[1]
                    : { icon:'📝', label:'帖子', color:'#374151', bg:'#F8FAFC', border:'#E2E8F0', accentColor:'#6B7280' };
                const cleanTitle = post.title.replace(/\[.*?\]\s*/, '');
                const safeTitleForJS = cleanTitle.replace(/'/g, "\\'");

                // ── 闲置：封面图横向滚动 + 物品行 ───────────────────────────
                let coverHtml = '';
                let itemRowsHtml = '';
                let firstItemPrice = '面议';
                let firstItemImg = post.image_url || '';
                let totalPrice = 0;
                let soldCount = 0;

                if (contentObj.items && contentObj.items.length > 0) {
                    firstItemPrice = contentObj.items[0].price || '面议';
                    firstItemImg   = contentObj.items[0].url || post.image_url || '';

                    // 封面横滚图区
                    const imgs = contentObj.items.map(item => {
                        const sold = item.is_sold;
                        if (!sold) totalPrice += parseFloat(item.price) || 0;
                        else soldCount++;
                        return `
                        <div style="flex-shrink:0; width:90px; height:90px; border-radius:10px; overflow:hidden;
                                    position:relative; scroll-snap-align:start;">
                          <img src="${item.url || post.image_url}" loading="lazy"
                               style="width:100%;height:100%;object-fit:cover;display:block;
                                      ${sold ? 'filter:grayscale(1);opacity:0.45;' : ''}">
                          ${sold ? `<div style="position:absolute;inset:0;display:flex;align-items:center;
                                                justify-content:center;">
                              <span style="background:rgba(0,0,0,0.55);color:#FFF;font-size:9px;font-weight:800;
                                           padding:2px 7px;border-radius:8px;letter-spacing:0.5px;">已出</span>
                            </div>` : ''}
                        </div>`;
                    }).join('');

                    const allSold = soldCount === contentObj.items.length;
                    const priceLabel = allSold
                        ? `<span style="color:#9CA3AF;font-size:14px;font-weight:700;">全部已售出</span>`
                        : `<span style="color:#EF4444;font-size:18px;font-weight:900;font-family:monospace;">€${totalPrice.toFixed(2)}</span>
                           ${soldCount > 0 ? `<span style="font-size:11px;color:#9CA3AF;font-weight:600;">· ${soldCount}件已出</span>` : ''}`;

                    coverHtml = `
                    <div style="margin-bottom:12px;">
                      <div style="display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x mandatory;
                                  scrollbar-width:none;padding-bottom:2px;margin-bottom:10px;">
                        ${imgs}
                      </div>
                      <div style="display:flex;align-items:baseline;gap:6px;">
                        ${priceLabel}
                      </div>
                    </div>`;

                    // 物品操作行（改为紧凑列表）
                    contentObj.items.forEach(item => {
                        const sold = item.is_sold;
                        itemRowsHtml += `
                        <div style="display:flex;align-items:center;gap:10px;
                                    padding:9px 0;border-top:1px solid #F3F4F6;">
                          <div style="font-size:13px;font-weight:700;color:${sold ? '#9CA3AF' : '#111827'};
                                      flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;
                                      white-space:nowrap;${sold ? 'text-decoration:line-through;' : ''}">
                            ${item.name || '物品'}
                          </div>
                          <div style="font-size:13px;font-weight:900;color:${sold ? '#9CA3AF' : '#D97706'};
                                      flex-shrink:0;">
                            €${item.price || 0}
                          </div>
                          ${sold
                            ? `<div style="font-size:11px;color:#9CA3AF;font-weight:700;background:#F3F4F6;
                                           padding:3px 9px;border-radius:20px;flex-shrink:0;">已出</div>`
                            : `<button onclick="window.App.markItemSold(${post.id},'${item.id}')"
                                 style="flex-shrink:0;background:#ECFDF5;color:#059669;border:1px solid #6EE7B7;
                                        padding:4px 10px;border-radius:20px;font-size:11px;font-weight:800;
                                        cursor:pointer;white-space:nowrap;">卖掉了</button>`
                          }
                        </div>`;
                    });
                }

                // ── 搭子专属管理面板 ─────────────────────────────────────────
                let partnerPanel = '';
                if (label === '搭子' && contentObj.maxPeople) {
                    const joined = parseInt(contentObj.joinedCount) || 1;
                    const max    = parseInt(contentObj.maxPeople)   || 2;
                    const isFull = joined >= max;

                    partnerPanel = `
                    <div style="margin-top:12px;background:#FAFBFF;border:1px solid #EDE9FF;
                                border-radius:14px;overflow:hidden;">
                      <div style="display:flex;align-items:center;gap:14px;padding:14px 16px;
                                  border-bottom:1px solid #F0EDFF;">
                        ${ringProgress(joined, max)}
                        <div style="flex:1;min-width:0;">
                          <div style="font-size:14px;font-weight:900;color:#111827;margin-bottom:5px;">
                            ${isFull ? '🎉 队伍已满员！' : `还差 <span style="color:#7C3AED;">${max - joined}</span> 人加入`}
                          </div>
                          <div style="display:flex;flex-wrap:wrap;gap:5px;">
                            ${contentObj.tag ? `<span style="font-size:10px;font-weight:700;color:#5B21B6;background:#EDE9FF;padding:2px 7px;border-radius:10px;">${contentObj.tag}</span>` : ''}
                            ${contentObj.city ? `<span style="font-size:10px;font-weight:700;color:#374151;background:#F3F4F6;padding:2px 7px;border-radius:10px;">📍${contentObj.city}</span>` : ''}
                            ${contentObj.time ? `<span style="font-size:10px;font-weight:700;color:#374151;background:#F3F4F6;padding:2px 7px;border-radius:10px;">🗓️${contentObj.time}</span>` : ''}
                          </div>
                        </div>
                        ${isFull
                          ? `<span style="font-size:11px;color:#059669;background:#ECFDF5;border:1px solid #A7F3D0;padding:4px 10px;border-radius:20px;font-weight:800;flex-shrink:0;">已满</span>`
                          : `<span style="font-size:11px;color:#DC2626;background:#FEF2F2;border:1px solid #FECACA;padding:4px 10px;border-radius:20px;font-weight:800;flex-shrink:0;">招募中</span>`
                        }
                      </div>
                      <div style="display:flex;gap:8px;padding:10px 12px;">
                        <button onclick="window.App.openInviteModal && window.App.openInviteModal('${post.id}')"
                                style="flex:1;background:#FFF;color:#7C3AED;border:1px solid #DDD6FE;
                                       padding:9px 0;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;"
                                onmousedown="this.style.background='#F5F3FF'" onmouseup="this.style.background='#FFF'">
                          🙋 邀请入队
                        </button>
                        <button onclick="window.App.generateAndSharePoster && window.App.generateAndSharePoster('${safeTitleForJS}','${firstItemPrice}','${firstItemImg}','${label}')"
                                style="flex:2;background:#7C3AED;color:#FFF;border:none;
                                       padding:9px 0;border-radius:10px;font-size:12px;font-weight:900;cursor:pointer;"
                                onmousedown="this.style.opacity='0.85'" onmouseup="this.style.opacity='1'">
                          🚀 生成引流海报
                        </button>
                      </div>
                    </div>`;
                }

                // ── 底部操作栏（闲置 & 悬赏）────────────────────────────────
                const footerBar = label !== '搭子' ? `
                <div style="margin-top:12px;padding-top:11px;border-top:1px solid #F3F4F6;
                            display:flex;align-items:center;justify-content:flex-end;gap:8px;">
                  <button onclick="window.App.generateAndSharePoster && window.App.generateAndSharePoster('${safeTitleForJS}','${firstItemPrice}','${firstItemImg}','${label}')"
                          style="background:#F1F5F9;color:#374151;border:none;padding:8px 16px;
                                 border-radius:20px;font-size:12px;font-weight:800;cursor:pointer;
                                 display:flex;align-items:center;gap:5px;"
                          onmousedown="this.style.background='#E2E8F0'" onmouseup="this.style.background='#F1F5F9'">
                    📤 生成引流海报
                  </button>
                </div>` : '';

                // ── 卡片外壳 ─────────────────────────────────────────────────
                html += `
                <div class="my-post-card" id="myPost_${post.id}"
                     style="background:#FFF;border-radius:16px;padding:16px;
                            margin-bottom:10px;box-shadow:0 2px 12px rgba(17,24,39,0.05);
                            border:1px solid #F0F0F0;">

                  <!-- 头部：类型标签 + 标题 + 时间 + 删除 -->
                  <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:12px;">
                    <span style="flex-shrink:0;font-size:10px;font-weight:800;color:${color};
                                 background:${bg};border:1px solid ${border};
                                 padding:3px 8px;border-radius:20px;margin-top:2px;">
                      ${icon} ${label}
                    </span>
                    <div style="flex:1;min-width:0;">
                      <div style="font-size:15px;font-weight:800;color:#111827;line-height:1.4;
                                  overflow:hidden;text-overflow:ellipsis;display:-webkit-box;
                                  -webkit-line-clamp:2;-webkit-box-orient:vertical;">
                        ${cleanTitle}
                      </div>
                      <div style="font-size:11px;color:#9CA3AF;font-weight:500;margin-top:3px;">
                        ${fmtDate(post.created_at)}
                      </div>
                    </div>
                    <button onclick="window.App.deleteMyPost(${post.id})"
                            style="flex-shrink:0;background:none;color:#CBD5E1;border:none;
                                   font-size:18px;cursor:pointer;padding:0 2px;line-height:1;
                                   transition:color 0.15s;"
                            onmouseenter="this.style.color='#EF4444'" onmouseleave="this.style.color='#CBD5E1'">
                      ×
                    </button>
                  </div>

                  ${coverHtml}
                  ${itemRowsHtml}
                  ${partnerPanel}
                  ${footerBar}
                </div>`;
            });

            container.innerHTML = html;
        });
    },

        // 3. 彻底删除帖子 (联动云端)
    async deleteMyPost(postId) {
        if(!confirm("⚠️ 确定要彻底删除这条发布吗？删除后无法恢复！")) return;
        try {
            const token = localStorage.getItem('hebao_token');
            if (!token) return showToast("登录已过期，请重新登录", "warning");

            const res = await fetch('/api/delete-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ postId })
            });
            const data = await res.json();
            
            if(data.success) {
                showToast("✅ 已成功删除", "success");
                window.myPostsCache = window.myPostsCache.filter(p => p.id !== postId);
                this.renderMyPosts();
                if(window.App.loadCommunityPosts) window.App.loadCommunityPosts(); // 同步刷新大集市
            } else {
                throw new Error(data.error);
            }
        } catch(e) {
            showToast("删除失败: " + e.message, "error");
        }
    },

   // ============================================================================
    // 🌟 核心引擎：将修改瞬间同步到集市大厅内存 (绝杀数据库延迟！)
    // ============================================================================
    syncToMarket(postId, newContentObj, newContentStr, type) {
        // 1. 同步到底层全局缓存
        if (window.allCommunityPostsCache) {
            const globalPost = window.allCommunityPostsCache.find(p => String(p.id) === String(postId));
            if (globalPost) globalPost.content = newContentStr;
        }

        // 2. 瞬间劫持并修改大厅视图缓存
        if (window.App.marketDataCache) {
            if (type === 'idle' && window.App.marketDataCache.idle) {
                const marketItem = window.App.marketDataCache.idle.find(p => String(p.id) === String(postId));
                if (marketItem) {
                    marketItem.contentObj = newContentObj;
                    // 🔥 重新计算大厅卡片的总价和变灰状态！
                    let currentTotalPrice = 0;
                    let allSold = true;
                    if (newContentObj.items && newContentObj.items.length > 0) {
                        newContentObj.items.forEach(i => {
                            if (!i.is_sold) {
                                currentTotalPrice += parseFloat(i.price) || 0;
                                allSold = false; 
                            }
                        });
                    }
                    marketItem.price = currentTotalPrice;
                    marketItem.isAllSold = allSold;
                    
                    // 瞬间强制重绘大厅，不需要发网络请求！
                    if (window.App.renderMarketIdle) window.App.renderMarketIdle();
                }
            } 
            else if (type === 'partner' && window.App.marketDataCache.partner) {
                const marketItem = window.App.marketDataCache.partner.find(p => String(p.id) === String(postId));
                if (marketItem) {
                    marketItem.contentObj = newContentObj;
                    if (window.App.renderMarketPartner) window.App.renderMarketPartner();
                }
            }
        }
    },

    // ==========================================
    // 🛍️ 修改某件物品为“已售出” (0延迟版)
    // ==========================================
    async markItemSold(postId, itemId) {
        if(!confirm("🛍️ 确认将该物品标为「已售出」吗？")) return;
        
        const token = localStorage.getItem('hebao_token');
        if (!token) return window.App.showToast ? window.App.showToast("请先登录", "warning") : null;

        const post = window.myPostsCache.find(p => String(p.id) === String(postId));
        if(!post) return;
        
        let contentObj = typeof post.content === 'string' ? JSON.parse(post.content) : post.content;
        const itemIndex = contentObj.items.findIndex(i => String(i.id) === String(itemId));
        if(itemIndex > -1) {
            contentObj.items[itemIndex].is_sold = true; 
        }
        const newContentStr = JSON.stringify(contentObj);

        // 🚀 乐观更新：不等后端返回，前端本地直接秒切状态！
        post.content = newContentStr; 
        this.renderMyPosts(); 
        this.syncToMarket(postId, contentObj, newContentStr, 'idle'); 
        
        if (window.App.showToast) window.App.showToast("✅ 已成功标记为售出！", "success");

        // 偷偷在后台发给数据库
        try {
            fetch('/api/update-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ postId, content: newContentStr })
            });
        } catch(e) { console.warn("后台同步失败", e); }
    },

    // ==========================================
    // 💶 修改单个物品的价格 (0延迟版)
    // ==========================================
    async updateItemPrice(postId, itemId, oldPrice) {
        const newPriceStr = prompt(`请输入该物品的新价格 (€):\n\n(当前价格为 €${oldPrice})`, oldPrice);
        if (newPriceStr === null || newPriceStr.trim() === '') return; 
        
        const newPrice = parseFloat(newPriceStr);
        if (isNaN(newPrice) || newPrice < 0) {
            return window.App.showToast ? window.App.showToast("⚠️ 请输入有效的数字哦！", "warning") : alert("价格无效");
        }
        if (newPrice === parseFloat(oldPrice)) return;

        const token = localStorage.getItem('hebao_token');
        if (!token) return;

        const post = window.myPostsCache.find(p => String(p.id) === String(postId));
        if(!post) return;
        
        let contentObj = typeof post.content === 'string' ? JSON.parse(post.content) : post.content;
        const itemIndex = contentObj.items.findIndex(i => String(i.id) === String(itemId));
        
        if(itemIndex > -1) {
            contentObj.items[itemIndex].price = newPrice; 
        }
        const newContentStr = JSON.stringify(contentObj);

        // 🚀 乐观更新：瞬间生效
        post.content = newContentStr; 
        this.renderMyPosts(); 
        this.syncToMarket(postId, contentObj, newContentStr, 'idle');
        
        if (window.App.showToast) window.App.showToast(`✅ 已成功降价为 €${newPrice}！`, "success");

        try {
            fetch('/api/update-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ postId, content: newContentStr })
            });
        } catch(e) { console.warn(e); }
    },

    // ==========================================
    // 🌟 5. 局长专属：通过搭子入局申请 (+1 逻辑)
    // ==========================================
    async approvePartner(postId) {
        if(!confirm("🎉 确认同意这位小伙伴入局吗？\n\n(确认后队伍人数将 +1，一旦满员大厅的进度条将自动关闭报名通道！)")) return;
        
        try {
            const token = localStorage.getItem('hebao_token');
            if (!token) return showToast("登录状态已过期，请重新登录", "warning");

            // 从本地缓存里捞出这个帖子
            const post = window.myPostsCache.find(p => p.id === postId);
            if(!post) return;
            
            // 解析配置 JSON
            let contentObj = typeof post.content === 'string' ? JSON.parse(post.content) : post.content;
            
            const currentJoined = parseInt(contentObj.joinedCount) || 1;
            const max = parseInt(contentObj.maxPeople) || 2;
            
            if (currentJoined >= max) {
                return showToast("⚠️ 哎呀，队伍已经满员啦！", "warning");
            }
            
            // 🌟 核心：人数进度 +1
            contentObj.joinedCount = currentJoined + 1;
            const newContentStr = JSON.stringify(contentObj);

            // 通知后端更新数据库
            const res = await fetch('/api/update-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ postId, content: newContentStr })
            });
            const data = await res.json();
            
            if(data.success) {
                showToast(`✅ 迎新成功！当前队伍 ${contentObj.joinedCount}/${max} 人`, "success");
                
                // 1. 更新本地缓存
                post.content = newContentStr; 
                
                // 2. 重新渲染“我的发布”面板，按钮可能会变成“已满员”
                this.renderMyPosts(); 
                
                // 3. 通知大厅集市重新拉取数据，让所有人的进度条同步往前走！
                if(window.App.loadCommunityPosts) window.App.loadCommunityPosts(); 
            } else {
                throw new Error(data.error);
            }
        } catch(e) {
            showToast("更新失败: " + e.message, "error");
        }
    }
};

// 挂载到全局
if (typeof window !== 'undefined') {
    window.App = window.App || {};
    Object.keys(ProfileEngine).forEach(key => {
        if (typeof ProfileEngine[key] === 'function') {
            window.App[key] = ProfileEngine[key].bind(ProfileEngine);
        }
    });
}
