// ============================================================================
// js/modules/profile.js - 用户个人中心与发布管理引擎 (带引流海报)
// ============================================================================
import { safeDOM } from '../core/dom.js';
import { showToast } from '../core/toast.js';

window.myPostsCache = []; // 本地缓存我的发布

export const ProfileEngine = {
    // 1. 拉取我的发布列表
    async loadMyPosts() {
        const uuid = localStorage.getItem('hebao_uuid');
        if (!uuid) return;

        try {
            safeDOM.execute('myPostsList', el => el.innerHTML = '<div style="text-align:center; padding:40px 0; color:#9CA3AF;"><span class="pulse-dot" style="background:#10B981;"></span> 拉取数据中...</div>');
            
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

    // 2. 渲染 UI 面板
    renderMyPosts() {
        safeDOM.execute('myPostsList', container => {
            const emptyState = document.getElementById('postsEmptyState');
            if (window.myPostsCache.length === 0) {
                if (emptyState) emptyState.style.display = 'block';
                container.innerHTML = '';
                return;
            }
            
            if (emptyState) emptyState.style.display = 'none';
            let html = '';
            
            window.myPostsCache.forEach(post => {
                let contentObj = { items: [] };
                try { contentObj = typeof post.content === 'string' ? JSON.parse(post.content) : post.content; } catch(e) {}
                
                let itemsHtml = '';
                // 抓取第一件物品的信息，用来生成海报
                let firstItemPrice = '面议';
                let firstItemImg = post.image_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800';

                if (contentObj && contentObj.items && contentObj.items.length > 0) {
                    firstItemPrice = contentObj.items[0].price || '面议';
                    firstItemImg = contentObj.items[0].url || post.image_url;

                    contentObj.items.forEach(item => {
                        const isSold = item.is_sold;
                        itemsHtml += `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px 0; border-top: 1px dashed #E5E7EB; margin-top: 8px;">
                                <div style="display:flex; align-items:center; gap: 10px; flex: 1;">
                                    <img src="${item.url || post.image_url}" style="width:40px; height:40px; border-radius:8px; object-fit:cover; ${isSold ? 'opacity:0.3; filter: grayscale(100%);' : ''}">
                                    <div style="display:flex; flex-direction:column;">
                                        <span style="font-size:14px; font-weight:700; color:${isSold ? '#9CA3AF' : '#111827'}; ${isSold ? 'text-decoration:line-through;' : ''}">${item.name || '物品'}</span>
                                        <span style="font-size:12px; font-weight:900; color:${isSold ? '#9CA3AF' : '#D97706'};">€${item.price || 0}</span>
                                    </div>
                                </div>
                                ${isSold 
                                    ? `<div style="font-size:11px; color:#9CA3AF; font-weight:900; background:#F3F4F6; padding:4px 10px; border-radius:12px;">已出</div>` 
                                    : `<button onclick="window.App.markItemSold(${post.id}, '${item.id}')" style="background:#10B981; border:none; padding:6px 14px; border-radius:14px; font-size:12px; font-weight:bold; color:#FFF; cursor:pointer; box-shadow: 0 2px 6px rgba(16,185,129,0.2);">卖掉了</button>`
                                }
                            </div>`;
                    });
                }

                // 提取卡片类型前缀
                const typeTag = post.title.includes('[闲置]') ? '📦 闲置' : (post.title.includes('[互助]') ? '🤝 悬赏' : '🏕️ 搭子');
                const cleanTitle = post.title.replace(/\[.*?\]\s*/, ''); // 去掉方括号前缀
                
                // 处理标题里可能有单引号导致 JS 报错的问题
                const safeTitleForJS = cleanTitle.replace(/'/g, "\\'");

                html += `
                    <div class="my-post-card" id="myPost_${post.id}" style="background:#FFF; border-radius:16px; padding:16px; margin-bottom:15px; box-shadow:0 4px 15px rgba(0,0,0,0.03); border:1px solid #F3F4F6;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                            <div style="font-size:15px; font-weight:900; color:#111827; flex:1; padding-right:10px; line-height: 1.4;">${typeTag} | ${cleanTitle}</div>
                            <button onclick="window.App.deleteMyPost(${post.id})" style="background:#FEF2F2; color:#DC2626; border:1px solid #FECACA; padding:4px 12px; border-radius:14px; font-size:12px; font-weight:bold; cursor:pointer;">删除</button>
                        </div>
                        <div style="font-size:11px; color:#9CA3AF; margin-bottom:10px; font-weight:bold;">发布于: ${new Date(post.created_at).toLocaleString()}</div>
                        
                        <div>${itemsHtml}</div>

                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #E5E7EB; display: flex; justify-content: flex-end;">
                            <button onclick="window.App.generateAndSharePoster('${safeTitleForJS}', '${firstItemPrice}', '${firstItemImg}', '${typeTag}')" style="background:#E0F2FE; color:#0284C7; border:1px solid #BAE6FD; padding:8px 16px; border-radius:12px; font-size:13px; font-weight:900; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow: 0 2px 4px rgba(2,132,199,0.1); transition: 0.1s;" onmousedown="this.style.transform='scale(0.96)'" onmouseup="this.style.transform='scale(1)'">
                                <span style="font-size:16px;">📤</span> 生成海报，发微信群引流！
                            </button>
                        </div>
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

    // 4. 精准修改某件物品为“已售出”
    async markItemSold(postId, itemId) {
        if(!confirm("🛍️ 确认将该物品标为「已售出」吗？(标为已出后，集市里的商品也会变灰哦)")) return;
        try {
            const token = localStorage.getItem('hebao_token');
            if (!token) return showToast("请先登录", "warning");

            const post = window.myPostsCache.find(p => p.id === postId);
            if(!post) return;
            
            let contentObj = typeof post.content === 'string' ? JSON.parse(post.content) : post.content;
            const itemIndex = contentObj.items.findIndex(i => i.id === itemId);
            if(itemIndex > -1) {
                contentObj.items[itemIndex].is_sold = true; 
            }
            
            const newContentStr = JSON.stringify(contentObj);

            const res = await fetch('/api/update-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ postId, content: newContentStr })
            });
            const data = await res.json();
            
            if(data.success) {
                showToast("✅ 已成功标记为售出！", "success");
                post.content = newContentStr; 
                this.renderMyPosts(); 
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
