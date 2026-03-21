// ============================================================================
// js/modules/trending.js - 超市红黑榜引擎 (全量功能保留 + 横向分类过滤支持)
// ============================================================================
import { safeDOM } from '../core/dom.js';

// 🌟 新增：记录当前激活的分类状态，默认为"全部"
let currentCategory = '全部';

export const TrendingEngine = {
    // 1. 🌟 升级版：带分类过滤的榜单拉取
    // 1. 🌟 升级版：带分类过滤和真实错误追踪的榜单拉取
    async loadTrendingData() {
        try {
            safeDOM.execute('homeTrendingListLikes', el => el.innerHTML = '<div style="text-align:center; padding: 40px; color:#9CA3AF; font-size:14px; font-weight:bold;"><span style="display:inline-block; animation:spin 1s linear infinite;">⏳</span> 正在拉取新鲜榜单...</div>');
            safeDOM.execute('homeTrendingListDislikes', el => el.innerHTML = '<div style="text-align:center; padding: 40px; color:#9CA3AF; font-size:14px; font-weight:bold;"><span style="display:inline-block; animation:spin 1s linear infinite;">⏳</span> 正在拉取新鲜榜单...</div>');

            const res = await fetch(`/api/trending?category=${encodeURIComponent(currentCategory)}`);
            const data = await res.json();
            
            if (data.success) {
                this.renderTrendingList(data.topLikes, 'homeTrendingListLikes', 'likes');
                this.renderTrendingList(data.topDislikes, 'homeTrendingListDislikes', 'dislikes');
            } else {
                // 🌟 如果后端返回报错，直接抛出！
                throw new Error(data.error || '未知接口错误');
            }
        } catch (error) {
            console.error("🚨 榜单拉取失败:", error);
            // 🌟 直接把错误信息打在屏幕上！
            const errorMsg = `<div style="text-align:center; padding: 40px; color:#EF4444; font-size:13px; font-weight:bold;">
                                💥 拉取失败<br><br>
                                <span style="color:#B91C1C;">原因: ${error.message}</span>
                              </div>`;
            safeDOM.execute('homeTrendingListLikes', el => el.innerHTML = errorMsg);
            safeDOM.execute('homeTrendingListDislikes', el => el.innerHTML = errorMsg);
        }
    },

    // 2. 🌟 新增：处理横向分类导航的点击事件
    changeTrendingCategory(category, element) {
        if (currentCategory === category) return; // 如果点的就是当前分类，直接忽略
        currentCategory = category;
        
        // 重置所有分类按钮的默认样式 (灰字白底)
        document.querySelectorAll('.cat-btn').forEach(btn => {
            btn.style.background = '#FFF';
            btn.style.color = '#475569';
            btn.style.border = '1px solid #E2E8F0';
        });
        
        // 激活当前被点击的按钮样式 (白字黑底)
        if (element) {
            element.style.background = '#111827';
            element.style.color = '#FFF';
            element.style.border = 'none';
        }

        // 重新拉取该分类下的数据
        this.loadTrendingData();
    },

    // 3. 渲染榜单列表 (完全保留你的金银铜牌 UI)
    renderTrendingList(items, containerId, type) {
        safeDOM.execute(containerId, container => {
            if (!items || items.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding: 40px; color:#9CA3AF; font-size:14px; font-weight:bold;">暂无该分类数据，快去扫码当排雷先锋！</div>';
                return;
            }
            let html = '';
            items.forEach((item, index) => {
                // 动态生成金银铜牌样式
                let rankStyle = "background:#F1F5F9; color:#94A3B8;"; 
                if (index === 0) rankStyle = "background: linear-gradient(135deg, #FDE68A, #F59E0B); color:#FFF; box-shadow: 0 2px 8px rgba(245,158,11,0.3);"; 
                else if (index === 1) rankStyle = "background: linear-gradient(135deg, #E2E8F0, #94A3B8); color:#FFF; box-shadow: 0 2px 8px rgba(148,163,184,0.3);"; 
                else if (index === 2) rankStyle = "background: linear-gradient(135deg, #FED7AA, #D97706); color:#FFF; box-shadow: 0 2px 8px rgba(217,119,6,0.3);"; 

                const icon = type === 'likes' ? '🔥' : '💣';
                const count = type === 'likes' ? item.likes : item.dislikes;
                const scoreColor = type === 'likes' ? '#EF4444' : '#111827';
                
                // 确保点击能跳到详情页
                const safeItemStr = encodeURIComponent(JSON.stringify(item));

                html += `
                <div class="trending-item" style="display:flex; align-items:center; background:#FFF; border-radius:16px; margin-bottom:12px; padding:12px; box-shadow:0 4px 15px rgba(0,0,0,0.02); border:1px solid #F1F5F9; cursor:pointer;" onclick="window.App.openTrendingDetail(decodeURIComponent('${safeItemStr}'))">
                    
                    <div style="width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 900; flex-shrink: 0; ${rankStyle}">${index + 1}</div>
                    
                    <img src="${item.image_url || 'https://via.placeholder.com/60'}" onerror="this.src='https://via.placeholder.com/60'" style="width:55px; height:55px; border-radius:12px; object-fit:cover; margin:0 12px; background:#F8FAFC; border: 1px solid #F1F5F9;">
                    
                    <div style="flex:1; overflow:hidden;">
                        <div style="font-weight:900; font-size:16px; color:#111827; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px;">${item.chinese_name || item.dutch_name}</div>
                        <div style="font-size:12px; color:#94A3B8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.dutch_name}</div>
                    </div>
                    
                    <div style="font-weight:900; font-size: 16px; color:${scoreColor}; flex-shrink:0; display:flex; align-items:center; gap:4px;">
                        <span style="font-size:14px;">${icon}</span> ${count || 0}
                    </div>
                </div>`;
            });
            container.innerHTML = html;
        });
    },

    // 4. 核心修复：切换红榜 / 黑榜 (完全保留)
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
    },

    // 5. 点击榜单直接跳转详情页 (完全保留)
    openTrendingDetail(itemJsonStr) {
        try {
            const data = JSON.parse(itemJsonStr);
            if (window.App && window.App._renderAndOpenDetail) {
                window.App._renderAndOpenDetail(data);
            }
        } catch (e) {
            console.error("解析详情失败", e);
        }
    }
};

// 🌟 极其关键：将函数暴露给全局 window，否则 HTML 里的 onclick 找不到！
if (typeof window !== 'undefined') {
    window.App = window.App || {};
    Object.keys(TrendingEngine).forEach(key => {
        if (typeof TrendingEngine[key] === 'function') {
            window.App[key] = TrendingEngine[key].bind(TrendingEngine);
            // 兼容你旧版 HTML 直接写的 onclick="switchHomeTrendingTab"
            window[key] = window.App[key]; 
        }
    });
}
