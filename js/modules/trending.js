// ============================================================================
// js/modules/trending.js - 超市红黑榜引擎 (单点内存渲染架构：彻底杜绝重叠Bug)
// ============================================================================
import { safeDOM } from '../core/dom.js';

export const TrendingEngine = {
    // 🌟 核心状态机 (内存管理)
    currentCategory: '全部',
    currentTab: 'likes', // 当前所在的 Tab ('likes' 或 'dislikes')
    cachedLikes: [],     // 内存缓存红榜数据
    cachedDislikes: [],  // 内存缓存黑榜数据

    async loadTrendingData() {
        try {
            safeDOM.execute('homeTrendingList', el => el.innerHTML = '<div style="text-align:center; padding: 40px; color:#9CA3AF; font-size:14px; font-weight:bold;"><span style="display:inline-block; animation:spin 1s linear infinite;">⏳</span> 正在拉取新鲜榜单...</div>');

            const res = await fetch(`/api/trending?category=${encodeURIComponent(this.currentCategory)}`);
            const data = await res.json();
            
            if (data.success) {
                // 🌟 将数据存入内存缓存
                this.cachedLikes = data.topLikes || [];
                this.cachedDislikes = data.topDislikes || [];
                
                // 🌟 直接呼叫渲染器，渲染当前的 Tab
                this.renderCurrentList();
            } else {
                throw new Error(data.error || '未知接口错误');
            }
        } catch (error) {
            console.error("🚨 榜单拉取失败:", error);
            const errorMsg = `<div style="text-align:center; padding: 40px; color:#EF4444; font-size:13px; font-weight:bold;">💥 拉取失败<br><br><span style="color:#B91C1C;">原因: ${error.message}</span></div>`;
            safeDOM.execute('homeTrendingList', el => el.innerHTML = errorMsg);
        }
    },

    changeTrendingCategory(category, element) {
        if (this.currentCategory === category) return; 
        this.currentCategory = category;
        
        document.querySelectorAll('.cat-btn').forEach(btn => {
            btn.style.background = '#FFF';
            btn.style.color = '#475569';
            btn.style.border = '1px solid #E2E8F0';
        });
        
        if (element) {
            element.style.background = '#111827';
            element.style.color = '#FFF';
            element.style.border = 'none';
        }

        this.loadTrendingData();
    },

    // 🌟 全新的 Tab 切换逻辑 (瞬间完成内存数据替换)
    switchHomeTrendingTab(tabType, element) {
        if (this.currentTab === tabType) return; // 避免重复点击
        this.currentTab = tabType;

        // 1. 改变顶部 Tab 颜色
        document.querySelectorAll('.t-tab').forEach(tab => {
            tab.style.background = '#F8FAFC';
            tab.style.color = '#475569';
            tab.style.borderColor = '#E2E8F0';
        });
        
        if (element) {
            if (tabType === 'likes') {
                element.style.background = '#FEF2F2';
                element.style.color = '#EF4444';
                element.style.borderColor = '#FECACA';
            } else {
                element.style.background = '#111827';
                element.style.color = '#FFF';
                element.style.borderColor = '#111827';
            }
        }
        
        // 2. 重新渲染唯一的容器 (极速)
        this.renderCurrentList();
    },

    // 🌟 核心引擎：从内存中抓取对应数据，塞入唯一容器
    renderCurrentList() {
        // 判断当前该拿红榜数据还是黑榜数据
        const items = this.currentTab === 'likes' ? this.cachedLikes : this.cachedDislikes;
        const type = this.currentTab;

        safeDOM.execute('homeTrendingList', container => {
            if (!items || items.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding: 40px; color:#9CA3AF; font-size:14px; font-weight:bold;">暂无该分类数据，快去扫码当排雷先锋！</div>';
                return;
            }
            let html = '';
            items.forEach((item, index) => {
                let rankStyle = "background:#F1F5F9; color:#94A3B8;"; 
                if (index === 0) rankStyle = "background: linear-gradient(135deg, #FDE68A, #F59E0B); color:#FFF; box-shadow: 0 2px 8px rgba(245,158,11,0.3);"; 
                else if (index === 1) rankStyle = "background: linear-gradient(135deg, #E2E8F0, #94A3B8); color:#FFF; box-shadow: 0 2px 8px rgba(148,163,184,0.3);"; 
                else if (index === 2) rankStyle = "background: linear-gradient(135deg, #FED7AA, #D97706); color:#FFF; box-shadow: 0 2px 8px rgba(217,119,6,0.3);"; 

                const icon = type === 'likes' ? '🔥' : '💣';
                const count = type === 'likes' ? item.likes : item.dislikes;
                const scoreColor = type === 'likes' ? '#EF4444' : '#111827';
                
                let fallbackBg = "linear-gradient(135deg, #F8FAFC, #E2E8F0)";
                let fallbackEmoji = "🛍️";
                if (item.category === '懒人速食') { fallbackBg = "linear-gradient(135deg, #FFF7ED, #FFEDD5)"; fallbackEmoji = "🥡"; }
                else if (item.category === '厨房生鲜') { fallbackBg = "linear-gradient(135deg, #FEF2F2, #FEE2E2)"; fallbackEmoji = "🥩"; }
                else if (item.category === '追剧零食') { fallbackBg = "linear-gradient(135deg, #FEFCE8, #FEF08A)"; fallbackEmoji = "🍪"; }
                else if (item.category === '租房日用') { fallbackBg = "linear-gradient(135deg, #F0FDF4, #DCFCE7)"; fallbackEmoji = "🧼"; }
                else if (item.category === '萌宠好物') { fallbackBg = "linear-gradient(135deg, #FAF5FF, #F3E8FF)"; fallbackEmoji = "🐾"; }

                const imgSrc = item.image_url || item.scanned_img;
                
                const imageHtml = imgSrc 
                    ? `<img src="${imgSrc}" style="width:55px; height:55px; border-radius:12px; object-fit:cover; margin:0 12px; border: 1px solid #F1F5F9;">`
                    : `<div style="width:55px; height:55px; border-radius:12px; margin:0 12px; display:flex; align-items:center; justify-content:center; font-size:26px; background:${fallbackBg}; border: 1px solid rgba(0,0,0,0.05); flex-shrink:0;">${fallbackEmoji}</div>`;

                const safeItemStr = encodeURIComponent(JSON.stringify(item));

                html += `
                <div class="trending-item" style="display:flex; align-items:center; background:#FFF; border-radius:16px; margin-bottom:12px; padding:12px; box-shadow:0 4px 15px rgba(0,0,0,0.02); border:1px solid #F1F5F9; cursor:pointer;" onclick="window.App.openTrendingDetail(decodeURIComponent('${safeItemStr}'))">
                    <div style="width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 900; flex-shrink: 0; ${rankStyle}">${index + 1}</div>
                    
                    ${imageHtml}
                    
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

if (typeof window !== 'undefined') {
    window.App = window.App || {};
    Object.keys(TrendingEngine).forEach(key => {
        if (typeof TrendingEngine[key] === 'function') {
            window.App[key] = TrendingEngine[key].bind(TrendingEngine);
            window[key] = window.App[key]; 
        }
    });
}
