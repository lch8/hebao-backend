// ============================================================================
// js/modules/trending.js - 超市红黑榜引擎
// ============================================================================
import { safeDOM } from '../core/dom.js';

export const TrendingEngine = {
    // 拉取榜单数据
    async loadTrendingData() {
        try {
            const res = await fetch('/api/trending');
            const data = await res.json();
            if (data.success) {
                this.renderTrendingList(data.topLikes, 'homeTrendingListLikes', 'likes');
                this.renderTrendingList(data.topDislikes, 'homeTrendingListDislikes', 'dislikes');
            }
        } catch (error) {
            console.error("🚨 榜单拉取失败:", error);
        }
    },

    // 渲染榜单列表 (自带大厂防弹 UI 与金银铜牌样式)
    renderTrendingList(items, containerId, type) {
        safeDOM.execute(containerId, container => {
            if (!items || items.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding: 40px; color:#9CA3AF;">暂无数据</div>';
                return;
            }
            let html = '';
            items.forEach((item, index) => {
                // 🌟 核心升级：前3名给予金、银、铜专属颜色与底色！
                let rankStyle = "background:#F3F4F6; color:#9CA3AF;"; // 默认样式 (第4名及以后)
                if (index === 0) rankStyle = "background: linear-gradient(135deg, #FDE68A, #F59E0B); color:#FFF; box-shadow: 0 2px 6px rgba(245,158,11,0.3);"; // 金
                else if (index === 1) rankStyle = "background: linear-gradient(135deg, #E2E8F0, #94A3B8); color:#FFF; box-shadow: 0 2px 6px rgba(148,163,184,0.3);"; // 银
                else if (index === 2) rankStyle = "background: linear-gradient(135deg, #FED7AA, #D97706); color:#FFF; box-shadow: 0 2px 6px rgba(217,119,6,0.3);"; // 铜

                const icon = type === 'likes' ? '🔥' : '💣';
                const count = type === 'likes' ? item.likes : item.dislikes;
                const scoreColor = type === 'likes' ? '#EF4444' : '#111827';
                
                html += `
                <div class="trending-item" style="display:flex; align-items:center; background:#FFF; border-radius:16px; margin-bottom:12px; padding:12px; box-shadow:0 2px 8px rgba(0,0,0,0.02); border:1px solid #F1F5F9; cursor:pointer; transition: transform 0.1s;" onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'" onclick="window.App._renderAndOpenDetail({dutch_name: '${item.dutch_name}', chinese_name: '${item.chinese_name}', category: '${item.category}', insight: '${item.insight || ''}', warning: '${item.warning || ''}'})">
                    
                    <div style="width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; font-family: monospace; flex-shrink: 0; ${rankStyle}">${index + 1}</div>
                    
                    <img src="${item.image_url || 'https://via.placeholder.com/60'}" onerror="this.src='https://via.placeholder.com/60'" style="width:50px; height:50px; border-radius:10px; object-fit:cover; margin:0 12px; background:#F8FAFC; border: 1px solid #F1F5F9;">
                    
                    <div style="flex:1; overflow:hidden;">
                        <div style="font-weight:900; font-size:15px; color:#111827; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.chinese_name || item.dutch_name}</div>
                        <div style="font-size:11px; color:#94A3B8; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.dutch_name}</div>
                    </div>
                    
                    <div style="font-weight:900; font-size: 15px; color:${scoreColor}; flex-shrink:0; display:flex; align-items:center; gap:4px;">
                        <span style="font-size:14px;">${icon}</span> ${count || 0}
                    </div>
                </div>`;
            });
            container.innerHTML = html;
        });
    },

    // 切换红榜 / 黑榜
    switchHomeTrendingTab(tabType, element) {
        document.querySelectorAll('.t-tab').forEach(el => el.classList.remove('active'));
        if (element) element.classList.add('active');
        
        if (tabType === 'likes') {
            safeDOM.execute('homeTrendingListLikes', el => el.style.display = 'block');
            safeDOM.execute('homeTrendingListDislikes', el => el.style.display = 'none');
        } else {
            safeDOM.execute('homeTrendingListLikes', el => el.style.display = 'none');
            safeDOM.execute('homeTrendingListDislikes', el => el.style.display = 'block');
        }
    }
};
