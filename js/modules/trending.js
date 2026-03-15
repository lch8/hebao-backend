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

    // 渲染榜单列表 (自带防弹 UI 样式)
    renderTrendingList(items, containerId, type) {
        safeDOM.execute(containerId, container => {
            if (!items || items.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding: 40px; color:#9CA3AF;">暂无数据</div>';
                return;
            }
            let html = '';
            items.forEach((item, index) => {
                const rankClass = index < 3 ? `rank-${index + 1}` : 'rank-other';
                const icon = type === 'likes' ? '🔥' : '💣';
                const count = type === 'likes' ? item.likes : item.dislikes;
                
                html += `
                <div class="trending-item" style="display:flex; align-items:center; background:#FFF; border-radius:16px; margin-bottom:12px; padding:12px; box-shadow:0 2px 8px rgba(0,0,0,0.02); border:1px solid #E5E7EB; cursor:pointer;" onclick="window.App._renderAndOpenDetail({dutch_name: '${item.dutch_name}', chinese_name: '${item.chinese_name}', category: '${item.category}', insight: '${item.insight || ''}', warning: '${item.warning || ''}'})">
                    <div class="t-rank ${rankClass}" style="font-size:18px; font-weight:900; color:#9CA3AF; width:30px; text-align:center;">${index + 1}</div>
                    <img class="t-img" src="${item.image_url || 'https://via.placeholder.com/60'}" onerror="this.src='https://via.placeholder.com/60'" style="width:50px; height:50px; border-radius:10px; object-fit:cover; margin:0 12px; background:#F3F4F6;">
                    <div class="t-info" style="flex:1;">
                        <div class="t-name" style="font-weight:900; font-size:15px; color:#111827;">${item.chinese_name || item.dutch_name}</div>
                        <div class="t-dutch" style="font-size:12px; color:#9CA3AF;">${item.dutch_name}</div>
                    </div>
                    <div class="t-score" style="font-weight:bold; color:${type === 'likes' ? '#EF4444' : '#111827'};">${icon} ${count}</div>
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
