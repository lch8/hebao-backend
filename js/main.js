
// ============================================================================
// js/main.js - 荷包管家核心调度引擎 (霸道修正版)
// ============================================================================
import { ScannerEngine } from './modules/scanner.js';
import { MarketEngine } from './modules/market.js';
import { WikiEngine } from './modules/wiki.js';
import { ChatEngine } from './modules/chat.js';
import { AuthEngine } from './modules/auth.js';
import { TrendingEngine } from './modules/trending.js'; // 🌟 引入刚建好的榜单引擎
import { showToast } from './core/toast.js';
import { ModalManager } from './components/modals.js';
import { safeDOM } from './core/dom.js';
import { ProfileEngine } from './modules/profile.js';
import { sgQuestions } from './data/sgQuestions.js';
window.App = window.App || {};

// ============================================================================
// 💅 荷包管家 Pro 级 UI 提效补丁 (小红书同款双列 Grid 版)
// ============================================================================
if (!document.getElementById('proUiPatchSafe')) {
    const style = document.createElement('style');
    style.id = 'proUiPatchSafe'; // 沿用 ID 以防止冲突
    style.innerHTML = `
        /* 1. 顶部雷达和避雷针：改为左右并排，更紧凑 */
        .tools-compact-container {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
        }
        .tools-compact-container > div {
            flex: 1;
            padding: 12px 14px !important; /* 缩小过大的留白 */
            border-radius: 12px !important; /* 去除夸张的大圆角 */
            margin: 0 !important;
        }
        /* 分类和搜索栏紧凑化 */
        .compact-search { padding: 8px 16px !important; border-radius: 10px !important; margin-bottom: 12px !important; }
        .compact-tabs { gap: 8px !important; margin-bottom: 16px !important; overflow-x: auto; }
        .compact-tabs button { padding: 6px 14px !important; border-radius: 8px !important; font-size: 13px !important; }
        
        /* 🌟 2. 核心大招：攻略列表强制变为真正的“双列瀑布流 Grid” (小红书风) */
        .wiki-grid-container {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
            align-items: start;
        }

        /* 3. 重塑滑动组件：使其完美适配双列，绝不卡死 */
        .pro-swipe-wrapper {
            position: relative !important;
            overflow: hidden !important;
            border-radius: 12px !important;
            width: 100% !important;
            height: 100% !important;
            margin-bottom: 0 !important;
        }
        /* 防止滑动时底座的文字错位 */
        .save-bg, .delete-bg { font-size: 11px !important; }
        
        /* 核心：现代化卡片质感 (去油，提升信息密度) */
        .pro-wiki-card {
            border-radius: 12px !important; padding: 12px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.04) !important;
            border: 1px solid #F1F5F9 !important; background: #FFF !important; min-height: 110px;
            display: flex; flex-direction: column;
            /* 仅给背景色加动画，坚决不碰 transform，保护滑动逻辑 */
            transition: background 0.2s;
            cursor: pointer;
        }
        .pro-wiki-card:active { background: #F8FAFC !important; }

        /* 🌟 4. 重塑头部排版：图标和标题同行，适配窄卡片 */
        .pro-wk-header { display: flex !important; flex-direction: column !important; align-items: flex-start !important; }
        .pro-wk-icon { margin: 0 !important; font-size: 18px !important; background: none !important; width: auto !important; height: auto !important; }
        .pro-wk-tag { font-size: 10px !important; padding: 2px 6px !important; border-radius: 4px !important; font-weight: bold !important; margin: 0 !important; white-space: nowrap; }
        .pro-wk-info { width: 100% !important; margin: 0 !important; }
        
        /* 紧凑型标题和正文截断 */
        .pro-wk-title { font-size: 14px !important; font-weight: 900 !important; line-height: 1.4 !important; margin-bottom: 6px !important; color: #111827 !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .pro-wk-summary { font-size: 12px !important; color: #64748B !important; line-height: 1.5 !important; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        
        /* 🌟 5. 细节层与评论按钮优化 (CSS 驱动的折叠) */
        .pro-wk-detail { margin-top: 12px !important; padding-top: 12px !important; border-top: 1px solid #F1F5F9 !important; display: none; }
        /* 利用 CSS class 控制展开/收起 */
        .pro-wiki-card.expanded .pro-wk-detail, 
        .pro-wiki-card.open .pro-wk-detail,
        .pro-wiki-card.active .pro-wk-detail { display: flex !important; flex-direction: column !important; }
        
        .pro-wk-step { font-size: 12px !important; color: #475569 !important; line-height: 1.6 !important; margin-bottom: 12px !important; }
        .pro-wk-btn { background: #F8FAFC !important; color: #475569 !important; padding: 8px 0 !important; border-radius: 8px !important; font-size: 12px !important; font-weight: bold !important; text-align: center !important; border: 1px solid #E2E8F0 !important; margin-top: 0 !important; cursor: pointer; }
    `;
    document.head.appendChild(style);
}


// ==========================================
// 🇳🇱 荷包管家：文化探索引擎 (Culture Engine)
// ==========================================

let currentRandomItem = null; // 首页当前展示的随机卡片
let currentViewedItem = null; // 详情页当前查看的档案

// 1. 引擎初始化
window.App.initCultureEngine = function() {
    window.App.loadRandomItem();
    window.App.renderGrid();
};

// 2. 🎲 首页左侧点击：加载随机图片 (带淡入淡出动画)
window.App.loadRandomItem = function() {
    const data = window.App.cultureData;
    if (!data || data.length === 0) return;

    let randomIdx;
    // 确保随机出的下一张和当前这张不一样
    do { 
        randomIdx = Math.floor(Math.random() * data.length); 
    } while (data.length > 1 && currentRandomItem && data[randomIdx].id === currentRandomItem.id);
    
    currentRandomItem = data[randomIdx];

    const cardEl = document.getElementById('homeRandomCard');
    if (cardEl) cardEl.style.opacity = '0'; // 隐去当前卡片
    
    setTimeout(() => {
        // 更新封面与文字
        document.getElementById('randomCover').style.backgroundImage = `url('${currentRandomItem.imgUrl}')`;
        document.getElementById('randomTitle').innerText = currentRandomItem.title;
        document.getElementById('randomHook').innerText = currentRandomItem.hook;
        
        // 自动匹配并更新左上角的分类名称 (如：🏛️ 建筑艺术)
        const catName = window.App.categories.find(c => c.id === currentRandomItem.categoryId)?.title || '探索';
        const tagEl = document.getElementById('randomCategory');
        if (tagEl) tagEl.innerText = catName;

        if (cardEl) cardEl.style.opacity = '1'; // 展现新卡片
    }, 200);
};

// 3. 📖 首页右侧点击：展开当前随机卡片的详情
window.App.expandRandomItem = function() {
    if (!currentRandomItem) return;
    window.App.openDetail(currentRandomItem.id);
};

// ==========================================
// 🗂️ 导航与模态框控制系统
// ==========================================

// 4. 打开/关闭全局分类网格
window.App.openCategoryGrid = function() {
    document.getElementById('categoryGridModal').style.transform = 'translateY(0)';
};
window.App.closeCategoryGrid = function() {
    document.getElementById('categoryGridModal').style.transform = 'translateY(100%)';
};

// 5. 渲染全局分类网格 (7大类)
window.App.renderGrid = function() {
    const grid = document.getElementById('categoryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    window.App.categories.forEach(cat => {
        // 动态计算该分类下有几篇文章
        const count = window.App.cultureData.filter(item => item.categoryId === cat.id).length;
        const cardHTML = `
            <div onclick="window.App.openCategoryList('${cat.id}', '${cat.title}')" style="background: ${cat.bg}; border-radius: 16px; padding: 20px 16px; color: #fff; box-shadow: 0 6px 16px rgba(0,0,0,0.15); cursor: pointer; display: flex; flex-direction: column; justify-content: flex-end; height: 120px;">
                <div style="font-size: 26px; margin-bottom: auto;">${cat.emoji}</div>
                <h3 style="font-size: 16px; font-weight: bold; margin: 0 0 4px 0;">${cat.title}</h3>
                <p style="font-size: 11px; margin: 0; opacity: 0.8;">${count} 张档案</p>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', cardHTML);
    });
};

// 6. 打开/关闭某个分类下的具体列表 (如：建筑艺术 -> 列表)
window.App.openCategoryList = function(categoryId, title) {
    document.getElementById('listTitle').innerText = title;
    const container = document.getElementById('itemListContainer');
    container.innerHTML = '';
    
    const items = window.App.cultureData.filter(item => item.categoryId === categoryId);
    
    if (items.length === 0) {
        container.innerHTML = '<p style="color:#888; text-align:center; margin-top:40px;">更多绝美内容，正在紧急制图中...</p>';
    } else {
        items.forEach(item => {
            const card = `
                <div onclick="window.App.openDetail('${item.id}')" style="background: #1E1E1E; border-radius: 12px; overflow: hidden; display: flex; align-items: center; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                    <div style="width: 100px; height: 100px; background-image: url('${item.imgUrl}'); background-size: cover; background-position: center;"></div>
                    <div style="padding: 16px; flex: 1;">
                        <h4 style="color: #fff; font-size: 16px; margin: 0 0 6px 0;">${item.title}</h4>
                        <p style="color: #aaa; font-size: 12px; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${item.hook}</p>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', card);
        });
    }
    
    document.getElementById('categoryListView').style.transform = 'translateX(0)';
};

window.App.closeCategoryList = function() {
    document.getElementById('categoryListView').style.transform = 'translateX(100%)';
};

// 7. 打开/关闭深度阅读详情页
window.App.openDetail = function(itemId) {
    const item = window.App.cultureData.find(i => i.id === itemId);
    if (!item) return;
    
    currentViewedItem = item;
    
    // 渲染长文与锦囊数据
    document.getElementById('detailCover').style.backgroundImage = `url('${item.imgUrl}')`;
    document.getElementById('detailTitle').innerText = item.title;
    document.getElementById('detailHook').innerText = item.hook;
    document.getElementById('detailLore').innerHTML = item.lore;
    document.getElementById('detailTip').innerHTML = item.tip;
    
    // 重置收藏按钮的默认状态
    const btn = document.getElementById('btnAddToPlan');
    if (btn) {
        btn.innerHTML = '➕ 收藏进未来访问计划';
        btn.style.background = '#0A192F';
    }
    
    // 弹起模态框
    document.getElementById('detailModal').style.transform = 'translateY(0)';
};

window.App.closeDetail = function() {
    document.getElementById('detailModal').style.transform = 'translateY(100%)';
    currentViewedItem = null;
};

// 8. 🚀 一键退回主界面 (清除所有弹出的图层)
window.App.returnToHome = function() {
    const detailModal = document.getElementById('detailModal');
    if (detailModal) detailModal.style.transform = 'translateY(100%)';
    
    const listView = document.getElementById('categoryListView');
    if (listView) listView.style.transform = 'translateX(100%)';
    
    const gridModal = document.getElementById('categoryGridModal');
    if (gridModal) gridModal.style.transform = 'translateY(100%)';
    
    currentViewedItem = null;
};

// 9. 💖 收藏进计划功能
window.App.addToPlan = function() {
    if (!currentViewedItem) return;
    const btn = document.getElementById('btnAddToPlan');
    if (btn) {
        btn.innerHTML = '✅ 已加入行程计划';
        btn.style.background = '#1E4D2B';
    }
    // 这里的 alert 可以换成你 App 内部的 Toast 提示组件
    alert(`成功！[${currentViewedItem.title}] 已加入你的专属探索清单！`);
};

// ==========================================
// 自动触发点
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if(window.App.initCultureEngine) {
        window.App.initCultureEngine();
    }
});
window.App.showRewardModal = function() {
    const modal = document.getElementById('rewardGroupModal');
    if (modal) {
        modal.style.display = 'flex';
        // 手机端给个震撼的震动反馈
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
    }
};
// ============================================================================
// 🎨 UI 界面与强制发布菜单引擎
// ============================================================================
const UIEngine = {
    openModal(modalId, displayStyle = 'flex') {
        ModalManager.injectIfNeeded(modalId);
        safeDOM.execute(modalId, el => {
            // 延迟一帧触发，保证 CSS 动画能正常播出来
            setTimeout(() => el.style.display = displayStyle, 10);
        });
    },
    closeModal(modalId) {
        safeDOM.execute(modalId, el => el.style.display = 'none');
    },
    openPublishSheet() {
        ModalManager.injectIfNeeded('publishSheet');
        // 🌟 终极强制 CSS 注入：无视任何原本的错误，强制将其以最高层级显示！
        safeDOM.execute('publishOverlay', el => {
            el.style.cssText = 'display: block; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 999998;';
        });
        safeDOM.execute('publishSheet', el => {
            el.style.cssText = 'display: block; position: fixed; bottom: 0; left: 0; right: 0; z-index: 999999; background: #fff; padding: 25px 20px; border-radius: 24px 24px 0 0; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1);';
            // 延迟一帧强制重绘滑出
            setTimeout(() => el.style.transform = 'translateY(0)', 10);
        });
    },
    closePublishSheet() {
        safeDOM.execute('publishOverlay', el => el.style.display = 'none');
        safeDOM.execute('publishSheet', el => {
            el.style.transform = 'translateY(100%)';
            setTimeout(() => el.style.display = 'none', 300);
        });
    },
    openIdlePublish() {
        this.closePublishSheet();
        ModalManager.injectIfNeeded('publishIdleModal');
        safeDOM.execute('publishIdleModal', el => el.style.display = 'flex');
    },
    closeIdlePublish() {
        safeDOM.execute('publishIdleModal', el => el.style.display = 'none');
    },
    goBack() {
        if (window.switchTab) window.switchTab('tips');
    },
    resetApp() {
        if (window.switchTab) window.switchTab('tips');
    },
    handleLogout() {
        localStorage.removeItem('hebao_token');
        localStorage.removeItem('hebao_logged_in');
        localStorage.removeItem('hp_name');
        localStorage.removeItem('hp_email_verified');
        window.location.reload();
    }
};

// ============================================================================
// 🛡️ 极度防御：全局入口挂载 (统领所有引擎)
// ============================================================================
window.App = window.App || {};
window.App.showToast = showToast;
window.App.injectIfNeeded = ModalManager.injectIfNeeded.bind(ModalManager);
window.App.safeDOM = safeDOM;

// 💡 将所有模块不仅挂载到 window.App，还强制挂载到顶级 window 上！
const modulesToBind = [ScannerEngine, MarketEngine, WikiEngine, ChatEngine, AuthEngine, TrendingEngine, UIEngine, ProfileEngine];
modulesToBind.forEach(module => {
    Object.keys(module).forEach(key => {
        if (typeof module[key] === 'function') {
            const boundFunc = module[key].bind(module);
            window.App[key] = boundFunc;
            window[key] = boundFunc; 
        }
    });
});

console.log("🚢 [Hebao Core] 主引擎满血复活，榜单与发布系统就绪！");
// ============================================================================
// 📸 架构师补丁：大总管的扫码/拍照唤起技能
// ============================================================================
window.App.openScanner = function() {
    try {
        // 1. 寻找我们在 index.html 里埋好的隐藏相机输入框
        const fileInput = document.getElementById('packageImgInput');
        
        if (fileInput) {
            // 2. 模拟物理点击，直接唤起原生手机系统相机/相册
            fileInput.click();
            
            // 3. (可选) 如果你希望点开相机时，底层页面直接切到“解析页”，可以加上这句
            // 这样拍完照返回时，直接就能看到扫描动画
            const scanPage = document.getElementById('page-scan');
            if (scanPage) {
                // 隐藏其他所有页面，独显扫描页
                document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
                scanPage.classList.add('active');
            }
        } else {
            // 备用降级方案：如果你用的是二维码插件的弹窗
            if (window.App.openModal) {
                window.App.openModal('scannerModal');
            }
        }
    } catch (error) {
        console.error("🚨 唤起相机失败:", error);
        if (window.App.showToast) window.App.showToast("无法调用相机，请检查权限设置");
    }
};
const originalSwitchRbMode = window.App.switchRbMode; // 保存模块里原有的业务逻辑

window.App.switchRbMode = function(mode) {
    // 1. 先让原系统去老老实实执行业务逻辑（比如渲染任务、加载百科等）
    if (originalSwitchRbMode) {
        originalSwitchRbMode(mode); 
    }
    
    // 2. ✨ 执行完后，强行追加“换衣服”魔法！
    const pageTips = document.getElementById('page-tips');
    if (pageTips) {
        pageTips.classList.remove('theme-starter', 'theme-advanced', 'theme-pro');
        pageTips.classList.add(`theme-${mode}`);
    }
};
// 同步更新给全局变量，防止 HTML 里找不到
window.switchRbMode = window.App.switchRbMode;

// ============================================================================
// 📈 架构师高定补丁：Pro 玩家数据图表渲染引擎
// ============================================================================
let currentProChart = null; // 记录当前的图表实例，防止重叠污染

window.App.showProChart = async function(type) {
    // 1. 先唤起弹窗，并显示加载状态
    window.App.openModal('proChartModal');
    const titleEl = document.getElementById('chartModalTitle');
    const subEl = document.getElementById('chartModalSub');
    
    // 假设你的 canvas ID 叫 proChartCanvas (如果不是，请根据你的 HTML 修改)
    const ctx = document.getElementById('proTrendCanvas'); 
    if (!ctx) return console.error("找不到图表 Canvas 容器！");

    if (titleEl) titleEl.innerText = '📡 正在连接大盘数据...';

    try {
        // 2. 拉取我们刚写好的真实数据 API
        const res = await fetch('/api/get-market');
        const result = await res.json();
        
        if (!result.success) throw new Error("接口返回错误");
        
        const data = result.data;
        let targetLabels, targetData, targetTitle, targetSub, lineColor, bgColor;

        // 3. 根据点击的不同卡片，分配不同的数据和主题色
        if (type === 'exchange') {
            targetLabels = data.exchange.chartLabels;
            targetData = data.exchange.chartData;
            targetTitle = '💶 欧元/人民币 (近14天走势)';
            targetSub = '数据仅供参考，不构成投资建议';
            lineColor = '#EF4444'; // 红色系 (涨跌幅大)
            bgColor = 'rgba(239, 68, 68, 0.1)';
        } else if (type === 'energy') {
            targetLabels = data.energy.chartLabels;
            targetData = data.energy.chartData;
            targetTitle = '⚡️ 荷兰今日电价走势';
            targetSub = '24小时动态电价 (€/kWh)，负数可薅羊毛！';
            lineColor = '#10B981'; // 绿色系 (环保能源)
            bgColor = 'rgba(16, 185, 129, 0.1)';
        } else if (type === 'mortgage') {
            targetLabels = data.mortgage.chartLabels;
            targetData = data.mortgage.chartData;
            targetTitle = '🏠 10年期房贷利率走势';
            targetSub = '近6个月模拟趋势 (%)';
            lineColor = '#F59E0B'; // 橙色系 (稳健)
            bgColor = 'rgba(245, 158, 11, 0.1)';
        }

        // 4. 更新弹窗里的文字标题
        if (titleEl) titleEl.innerText = targetTitle;
        if (subEl) subEl.innerText = targetSub;

        // 5. 销毁旧图表 (极其重要！否则鼠标放上去会疯狂闪烁闪现旧数据)
        if (currentProChart) {
            currentProChart.destroy();
        }

        // 6. 用 Chart.js 画出极其平滑且带底色渐变的绝美曲线
        currentProChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: targetLabels,
                datasets: [{
                    label: '数值',
                    data: targetData,
                    borderColor: lineColor,
                    backgroundColor: bgColor,
                    borderWidth: 3,
                    pointBackgroundColor: '#FFF',
                    pointBorderColor: lineColor,
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true, // 开启下方底色填充，对标你截图里的效果
                    tension: 0.4 // 0.4 是神仙参数，让折线变成丝滑的波浪线
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }, // 隐藏多余的图例
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)', // 黑色高级提示框
                        padding: 10,
                        titleFont: { size: 13 },
                        bodyFont: { size: 14, weight: 'bold' },
                        displayColors: false
                    }
                },
                scales: {
                    x: { grid: { display: false } }, // 隐藏竖向网格线，更清爽
                    y: { 
                        grid: { borderDash: [5, 5] }, // 横向网格线做成虚线
                        ticks: { maxTicksLimit: 6 } 
                    }
                }
            }
        });

    } catch (error) {
        console.error("图表数据加载失败", error);
        if (titleEl) titleEl.innerText = '❌ 数据加载失败，请重试';
    }
};

// ==========================================
// 🌟 自动唤醒大盘卡片：带断网兜底的强力渲染引擎
// ==========================================
// ==========================================
// 📈 修复版：大盘数据卡片 (防崩溃兜底)
// ==========================================
window.App.initMarketCards = async function() {
    // 🛡️ 强制兜底数据：网络不通时显示这个
    const fallback = {
        exchange: { current: 7.82, change: 0.02 },
        energy: { current: 0.24 },
        mortgage: { current: 3.85 }
    };

    const render = (data) => {
        try {
            const exEl = document.getElementById('market-exchange');
            if (exEl) {
                const color = (data.exchange && data.exchange.change >= 0) ? '#EF4444' : '#10B981';
                const sign = (data.exchange && data.exchange.change >= 0) ? '↑' : '↓';
                const current = data.exchange ? data.exchange.current : '--';
                const change = data.exchange ? Math.abs(data.exchange.change) : '0';
                exEl.innerHTML = `${current} <span style="font-size:12px; color:${color}; margin-left:2px;">${sign}${change}</span>`;
                exEl.style.color = color;
            }
            const enEl = document.getElementById('market-energy');
            if (enEl) enEl.innerText = data.energy ? `€${data.energy.current}` : '--';
            const moEl = document.getElementById('market-mortgage');
            if (moEl) moEl.innerText = data.mortgage ? `${data.mortgage.current}%` : '--';
        } catch (err) { console.error("渲染卡片失败:", err); }
    };

    try {
        const res = await fetch('/api/get-market');
        const result = await res.json();
        render(result.success && result.data ? result.data : fallback);
    } catch (e) {
        console.warn("API 504/超时，启动本地兜底");
        render(fallback);
    }
};

// ==========================================
// 🌟 纯正荷兰血统：Buienradar 动态天气雷达引擎
// ==========================================
window.App.initWeatherRadar = async function() {
    try {
        const root = document.getElementById('weatherWidgetRoot');
        const icon = document.getElementById('weatherIcon');
        const title = document.getElementById('weatherTitle');
        const status = document.getElementById('weatherStatus');
        if (!root) return;

        // 1. 无感获取城市定位 (通过 IP 静默获取，不弹窗打扰用户)
        let lat = 52.3676, lon = 4.9041, city = '阿姆斯特丹'; 
        try {
            const locRes = await fetch('https://ipapi.co/json/');
            const locData = await locRes.json();
            if (locData.latitude) {
                lat = locData.latitude;
                lon = locData.longitude;
                city = locData.city ? locData.city.substring(0, 4) : '本地'; 
            }
        } catch(e) { console.log('IP定位跳过，使用默认坐标'); }

        title.innerText = `${city} 雷达`;

        // 2. 召唤我们刚才写好的 Buienradar Vercel 接口！
        const weatherRes = await fetch(`/api/get-weather?lat=${lat}&lon=${lon}`);
        const weatherData = await weatherRes.json();
        
        if (weatherData.success && weatherData.isRainingSoon) {
            // 🌧️ 坏天气警报模式：带精确到分钟的 Buienradar 预测
            root.style.background = '#EFF6FF'; 
            root.style.borderColor = '#BFDBFE';
            // 如果是大雨，图标变电闪雷鸣
            icon.innerText = weatherData.rainLevel >= 3 ? '⛈️' : '🌧️';
            
            status.innerText = `🔴 ${weatherData.rainMsg}`;
            status.style.color = '#DC2626';
            status.style.background = '#FEE2E2';
        } else {
            // 🌤️ 放心骑模式
            root.style.background = '#FFF';
            root.style.borderColor = '#F3F4F6';
            icon.innerText = '🌤️';
            status.innerText = '🟢 放心骑 (未来2h无雨)';
            status.style.color = '#10B981';
            status.style.background = '#ECFDF5';
        }

    } catch (error) {
        console.error("雷达连接失败", error);
        const title = document.getElementById('weatherTitle');
        if(title) title.innerText = 'Buienradar (连接中)';
    }
};

setTimeout(() => {
    if (window.App.initWeatherRadar) window.App.initWeatherRadar();
}, 800);

// 页面加载完毕后，延迟 300 毫秒静默获取数据，不卡顿页面
setTimeout(() => {
    if (window.App.initMarketCards) {
        window.App.initMarketCards();
    }
}, 300);

// ==========================================
// 🛡️ 治安避雷针：Politie警察局直连 + 云端定位 + 实时投票
// ==========================================
window.App.currentCheckCode = '';

// 📍 新增功能：GPS 无感逆向解析荷兰邮编
window.App.locatePostcode = function() {
    const input = document.getElementById('postcodeInput');
    if (!("geolocation" in navigator)) return alert("当前设备不支持定位功能");
    
    input.placeholder = "📡 正在请求卫星定位...";
    input.value = "";
    
    navigator.geolocation.getCurrentPosition(async position => {
        try {
            const { latitude, longitude } = position.coords;
            // 使用开源地图接口逆向解析 GPS 坐标
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
            const data = await res.json();
            if (data && data.address && data.address.postcode) {
                // 荷兰邮编通常为 "1234 AB"，截取前四位
                const code = data.address.postcode.substring(0, 4);
                input.value = code;
                input.placeholder = "输入荷兰4位邮编 (如: 2512)";
                window.App.checkSafetyCode(); // 自动执行查询
            } else {
                alert("位置解析失败，请手动输入邮编");
                input.placeholder = "输入荷兰4位邮编 (如: 2512)";
            }
        } catch(e) { 
            alert("定位服务连接失败"); 
            input.placeholder = "输入荷兰4位邮编 (如: 2512)";
        }
    }, () => { 
        alert("请允许浏览器获取位置权限"); 
        input.placeholder = "输入荷兰4位邮编 (如: 2512)";
    });
};

// 🔍 查询功能：直连 Vercel 后端获取警局与投票双重数据
window.App.checkSafetyCode = async function() {
    const input = document.getElementById('postcodeInput');
    const code = input.value.trim();
    if(!code || code.length !== 4 || isNaN(code)) return window.App.showToast ? window.App.showToast("请输入 4 位数字邮编", "warning") : alert("请输入4位数字邮编");

    window.App.currentCheckCode = code;
    const resultArea = document.getElementById('safetyResultArea');
    const content = document.getElementById('safetyResultContent');
    
    // 显示加载状态
    content.innerHTML = `<div style="text-align:center; font-size:12px; padding:15px; color:#6B7280; display:flex; flex-direction:column; align-items:center; gap:8px;"><span style="font-size:24px; animation: pulse 1s infinite;">📡</span>正在连接荷兰警局 Politie.nl <br> 与全网留学生评价库...</div>`;
    resultArea.style.display = 'block';

    try {
        const res = await fetch(`/api/safety?code=${code}`);
        const data = await res.json();
        
        if (!data.success) throw new Error("API返回错误");

        // 1. 处理官方警情通报
        let policeHtml = '';
        if (data.policeIncidents > 0) {
            let newsList = data.policeNews.map(n => `<div style="margin-top:6px; font-weight:normal; font-size:12px;">🚨 ${n}</div>`).join('');
            policeHtml = `
            <div style="padding: 12px 14px; background: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 4px 8px 8px 4px; color: #B91C1C; margin-bottom:12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="font-size: 14px; font-weight: 900; margin-bottom:4px;">👮‍♂️ Politie 警局案底警告</div>
                <div style="font-size: 12px;">近期该区域有 <b>${data.policeIncidents}</b> 起严重警情通报：</div>
                ${newsList}
            </div>`;
        } else {
            policeHtml = `
            <div style="padding: 12px 14px; background: #F0FDF4; border-left: 4px solid #10B981; border-radius: 4px 8px 8px 4px; color: #065F46; font-size:14px; font-weight:900; margin-bottom:12px;">
                🟢 警局档案清白：近期无恶性案件通报
            </div>`;
        }

        // 2. 处理 UGC 全网投票数据
        let ugcHtml = '';
        // 🌟 核心修复：强制转换为数字 (Number)，彻底消灭 '0'+'2'+'0'='020' 的字符串拼接 Bug！
        const safeCount = Number(data.votes.safe) || 0;
        const warningCount = Number(data.votes.warning) || 0;
        const dangerCount = Number(data.votes.danger) || 0;
        const totalVotes = safeCount + warningCount + dangerCount;
        if (totalVotes > 0) {
            const safePct = Math.round((data.votes.safe / totalVotes) * 100);
            const dangerPct = Math.round((data.votes.danger / totalVotes) * 100);
            ugcHtml = `
                <div style="font-size: 12px; color: #4B5563; background: #F8FAFC; padding: 10px 12px; border-radius: 8px; display: flex; align-items: center; gap: 8px; border: 1px solid #E5E7EB;">
                    <span style="font-size: 16px;">📊</span>
                    <div>全网 <b>${totalVotes}</b> 位荷包蛋打分，<b style="color:#10B981;">${safePct}%</b> 认为安全，<b style="color:#EF4444;">${dangerPct}%</b> 提示危险。</div>
                </div>`;
        } else {
            ugcHtml = `<div style="font-size: 11px; color: #9CA3AF; text-align: right;">* 暂无荷包蛋评价，快来投下第一票！</div>`;
        }

        content.innerHTML = policeHtml + ugcHtml;

    } catch (error) {
        content.innerHTML = `<div style="color:#EF4444; font-size:12px; text-align:center;">数据加载失败，请检查网络或刷新重试。</div>`;
    }
};

// 🙋‍♂️ 投票功能：同步到云端数据库，实现多设备共享
window.App.voteSafety = async function(type) {
    const code = window.App.currentCheckCode;
    if(!code) return;

    // 前端防刷机制
    const votedObj = JSON.parse(localStorage.getItem('hp_voted_codes') || '{}');
    if (votedObj[code]) {
        return window.App.showToast ? window.App.showToast("你已经为该街区投过票啦！", "warning") : alert("已经投过票啦");
    }

    try {
        // 向 Vercel 接口发送全局投票
        await fetch('/api/safety', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'vote', code: code, type: type })
        });

        // 记录本地，防止重复投
        votedObj[code] = true; 
        localStorage.setItem('hp_voted_codes', JSON.stringify(votedObj));

        if(window.App.showToast) window.App.showToast("✅ 投票成功！已同步至云端数据库", "success");
        
        // 自动刷新数据，让用户立刻看到自己投的那一票
        window.App.checkSafetyCode(); 
    } catch(e) {
        console.error("投票失败", e);
    }
};
// ==========================================
// 🚀 一键发帖联动引擎 (从攻略卡片直达社区集市)
// ==========================================
window.App.quickPost = function(tab, encodedTitle, encodedContent) {
    // 1. 调用底部的发布按钮事件，展开你的发布界面
    if (window.App.openPublishSheet) {
        window.App.openPublishSheet();
    } else {
        alert("发布模块正在加载中...");
        return;
    }

    // 2. 解密文本 (防止回车符、引号把代码搞崩溃)
    const title = decodeURIComponent(encodedTitle);
    const content = decodeURIComponent(encodedContent);

    // 3. 延迟 400 毫秒，等待发布弹窗的 HTML 彻底渲染完毕
    setTimeout(() => {
        // 💡 注意：这里的 ID (publishType, publishTitle) 需要和你真实发布弹窗里的 input/select ID 一致！
        // 如果你的 ID 叫别的名字，请在这里改一下。
        
        const typeSelect = document.getElementById('publishType'); // 分类下拉框
        if (typeSelect) {
            typeSelect.value = tab; 
            typeSelect.dispatchEvent(new Event('change')); // 触发切换事件
        }

        const titleInput = document.getElementById('publishTitle'); // 标题输入框
        if (titleInput) {
            titleInput.value = title;
            titleInput.dispatchEvent(new Event('input'));
        }

        const contentInput = document.getElementById('publishContent'); // 正文文本域
        if (contentInput) {
            contentInput.value = content;
            contentInput.dispatchEvent(new Event('input'));
        }

        // 弹出一个极其舒服的用户提示
        if (window.App.showToast) {
            window.App.showToast("✨ 模板已加载，请补充【括号】里的时间地点！", "success");
        }
    }, 400);
};
// ==========================================
// 🗺️ 新手村主线任务引擎 (iOS 极简风)
// ==========================================

window.App.currentTaskPhase = 'pre'; 

// 1. 丝滑切换 Tab 效果
window.App.switchTaskPhase = function(phase) {
    window.App.currentTaskPhase = phase;
    ['pre', 'day7', 'month1'].forEach(p => {
        const el = document.getElementById('tab_' + p);
        if(el) {
            if(p === phase) {
                el.style.background = '#FFF';
                el.style.color = '#0F172A';
                el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            } else {
                el.style.background = 'transparent';
                el.style.color = '#64748B';
                el.style.boxShadow = 'none';
            }
        }
    });
    window.App.renderStarterTasks();
};

// 2. 核心任务数据与绝美渲染
window.App.renderStarterTasks = function() {
    const list = document.getElementById('starterTaskList');
    if(!list) return;

    // 🏆 留学生真实避雷通关数据
    const tasksData = {
        pre: [
            { id: 't1', title: '核心文件随身带', desc: '护照、MVV签证信、录取通知书、出生双认证。放随身包，万一行李丢了也能办手续！', actionBtn: '👉 护照包推荐', actionLink: '#' },
            { id: 't2', title: '提前预约市政厅 (Gemeente)', desc: '落地再约可能要等一个月！没有 BSN 号不能办银行卡，在国内就要提前抢号。', actionBtn: '🔗 直达市政厅', actionLink: '#' },
            { id: 't3', title: '下载并注册 NS App', desc: '荷兰火车必备，提前注册好账号，落地就能买电子票。' }
        ],
        day7: [
            { id: 't4', title: '办理个人 OV-chipkaart', desc: '去官网传照片办黄色的实名卡，配合 NS Flex 才能享受非高峰期 6 折。', actionBtn: '🔗 去办卡', actionLink: '#' },
            { id: 't5', title: '市政厅注册拿 BSN', desc: '带齐租房合同和双认证，注册后 1-2 周内会把 BSN 号码邮寄到你家信箱。' },
            { id: 't6', title: '开通荷兰银行卡 (ABN / ING)', desc: '拿到 BSN 后立刻去开卡。平时付钱认准 iDEAL 标志。' }
        ],
        month1: [
            { id: 't7', title: '注册家庭医生 (Huisarts)', desc: '荷兰看病必须先找家庭医生，诊所名额极其有限，必须就近立刻抢注！' },
            { id: 't8', title: '买医疗保险 (Zorgverzekering)', desc: '法律规定落地 4 个月内必须买医保，打工同学买 Basic，全职学生买 AON。' },
            { id: 't9', title: '申请各类补贴 (Toeslag)', desc: '符合条件即可每月白领大几百欧的租房补贴和医疗补贴！' }
        ]
    };

    const tasks = tasksData[window.App.currentTaskPhase] || [];
    const completedTasks = JSON.parse(localStorage.getItem('hp_completed_tasks') || '[]');
    
    let html = '';
    let completedCount = 0;

    tasks.forEach(t => {
        const isDone = completedTasks.includes(t.id);
        if(isDone) completedCount++;

        // 状态变色龙逻辑
        const circleColor = isDone ? '#10B981' : '#CBD5E1';
        const circleFill = isDone ? '#10B981' : 'transparent';
        const checkMark = isDone ? `<span style="color:white; font-size:14px; margin-top:2px;">✓</span>` : '';
        const titleColor = isDone ? '#9CA3AF' : '#111827';
        const titleStrike = isDone ? 'line-through' : 'none';

        // 精致的内嵌 Tag (取代原来的大笨按钮)
        let actionHtml = '';
        if(t.actionBtn && !isDone) {
            actionHtml = `
            <div style="margin-top: 10px;">
                <span onclick="event.stopPropagation(); window.App.showToast('链接跳转即将开放...')" style="background: #EFF6FF; color: #2563EB; font-size: 11px; font-weight: 900; padding: 4px 10px; border-radius: 6px; border: 1px solid #BFDBFE;">${t.actionBtn}</span>
            </div>`;
        }

        html += `
        <div onclick="window.App.toggleTask('${t.id}')" style="background: #FFF; border-radius: 16px; padding: 16px; margin-bottom: 12px; display: flex; gap: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.02); border: 1px solid #F3F4F6; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; ${isDone ? 'opacity: 0.6;' : ''}">
            
            <div style="flex-shrink: 0; padding-top: 2px;">
                <div style="width: 22px; height: 22px; border-radius: 50%; border: 2px solid ${circleColor}; background: ${circleFill}; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                    ${checkMark}
                </div>
            </div>
            
            <div style="flex: 1;">
                <div style="font-size: 15px; font-weight: 900; color: ${titleColor}; margin-bottom: 4px; text-decoration: ${titleStrike}; transition: all 0.2s;">${t.title}</div>
                <div style="font-size: 13px; color: #64748B; line-height: 1.5;">${t.desc}</div>
                ${actionHtml}
            </div>
        </div>`;
    });

    list.innerHTML = html;

    // 酷炫的进度条动画连动
    const progressPct = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);
    const pb = document.getElementById('taskProgressBar');
    const pt = document.getElementById('taskProgressText');
    if(pb) pb.style.width = progressPct + '%';
    if(pt) {
        pt.innerText = `${completedCount}/${tasks.length}`;
        pt.style.color = completedCount === tasks.length ? '#10B981' : '#111827';
    }
};

// 3. 丝滑的打勾音效与反馈 (带通关奖励检测)
window.App.toggleTask = function(id) {
    let completedTasks = JSON.parse(localStorage.getItem('hp_completed_tasks') || '[]');
    let isNewlyCompleted = false;

    if(completedTasks.includes(id)) {
        completedTasks = completedTasks.filter(item => item !== id); // 取消勾选
    } else {
        completedTasks.push(id); // 勾选
        isNewlyCompleted = true;
        if(window.App.showToast) window.App.showToast('🎉 阶段任务 +1', 'success');
    }
    
    localStorage.setItem('hp_completed_tasks', JSON.stringify(completedTasks));
    window.App.renderStarterTasks(); // 重新渲染触发动画

    // 🌟 门禁检测：总共 9 个任务，如果刚刚完成了最后一个
    if (isNewlyCompleted && completedTasks.length >= 9) {
        setTimeout(() => {
            window.App.showRewardModal();
        }, 800); // 延迟 0.8 秒，等那个绿色的打勾动画飞完再弹窗，体验绝佳！
    }
};

// 延迟 500ms 自动渲染首页任务
setTimeout(() => { if(window.App.renderStarterTasks) window.App.renderStarterTasks(); }, 500);

// ==========================================
// 🎮 荷村生存模拟器 (亮色质感 + 动态战绩卡片)
// ==========================================


window.App.sgEngine = {
    balance: 500,
    currentIndex: 0,
    wrongTags: [], 
    activeQuestions: [],

    playTone(type) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            if (type === 'wrong') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4);
                gain.gain.setValueAtTime(0.5, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            } else {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            }
            osc.start(); osc.stop(ctx.currentTime + 0.4);
        } catch(e) {}
    }
};

// 🌟 核心：动态渲染首页 Banner (战绩 / 初始状态)
window.App.renderSurvivalBanner = function() {
    const container = document.getElementById('survivalBannerContainer');
    if (!container) return;

    // 从本地存储读取上次的战绩
    const record = JSON.parse(localStorage.getItem('hp_sg_record'));

    if (!record) {
        // 状态一：从未玩过 (清爽的橘黄色引诱卡片)
        container.innerHTML = `
        <div onclick="window.App.startSurvivalGame()" style="background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); border-radius: 20px; padding: 20px; position: relative; overflow: hidden; cursor: pointer; box-shadow: 0 4px 15px rgba(245,158,11,0.1); border: 1px solid #FDE68A; transition: transform 0.1s;" onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'">
            <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1;">
                <div style="flex: 1; padding-right: 15px;">
                    <div style="font-size: 16px; font-weight: 900; color: #B45309; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 20px;">🚨</span> 落地荷兰，你的钱包保得住吗？
                    </div>
                    <div style="font-size: 11px; color: #78350F; line-height: 1.5; margin-bottom: 12px; opacity: 0.8;">已有 5,231 位新生完成挑战，平均因为不懂规矩损失 <span style="color: #EF4444; font-weight: bold;">€150</span>。</div>
                    <div style="display: inline-block; background: #F59E0B; color: #FFF; font-size: 12px; font-weight: 900; padding: 6px 14px; border-radius: 12px; box-shadow: 0 2px 8px rgba(245,158,11,0.3);">🕹️ 启动生存模拟</div>
                </div>
                <div style="font-size: 45px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); transform: rotate(-10deg);">🦆</div>
            </div>
        </div>`;
    } else {
        // 状态二：已通关战绩卡片 (炫耀 + 再次挑战)
        const isGood = record.balance >= 100;
        const bgColor = isGood ? 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)' : 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)';
        const borderColor = isGood ? '#BBF7D0' : '#FECACA';
        const textColor = isGood ? '#065F46' : '#991B1B';
        
        container.innerHTML = `
        <div style="background: ${bgColor}; border-radius: 20px; padding: 16px 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid ${borderColor};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="font-size: 12px; font-weight: bold; color: ${textColor}; opacity: 0.7;">🎮 荷村生存摸底考战绩</div>
                <div onclick="window.App.startSurvivalGame()" style="background: #FFF; color: ${textColor}; font-size: 11px; font-weight: 900; padding: 4px 10px; border-radius: 10px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">↻ 再玩一次</div>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 40px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">${record.icon}</div>
                <div>
                    <div style="font-size: 16px; font-weight: 900; color: ${textColor}; margin-bottom: 2px;">${record.title}</div>
                    <div style="font-size: 12px; color: ${textColor}; opacity: 0.8; font-family: monospace;">最终钱包余额: 💶 ${record.balance}</div>
                </div>
            </div>
        </div>`;
    }
};

window.App.startSurvivalGame = function() {
    document.getElementById('survivalGameModal').style.display = 'flex';
    document.getElementById('sgQuestionArea').style.display = 'flex';
    document.getElementById('sgResultArea').style.display = 'none';
    
    window.App.sgEngine.balance = 500;
    window.App.sgEngine.currentIndex = 0;
    window.App.sgEngine.wrongTags = [];
    
    const shuffled = [...sgQuestions].sort(() => 0.5 - Math.random());
    window.App.sgEngine.activeQuestions = shuffled.slice(0, 5);

    window.App.renderSgQuestion();
};

window.App.renderSgQuestion = function() {
    const engine = window.App.sgEngine;
    const q = engine.activeQuestions[engine.currentIndex]; 
    
    document.getElementById('sgProgress').innerText = `关卡 ${engine.currentIndex + 1}/${engine.activeQuestions.length}`;
    document.getElementById('sgWalletBalance').innerText = engine.balance;
    document.getElementById('sgWalletBox').className = ''; 
    
    document.getElementById('sgTag').innerText = `#${q.tag}`;
    document.getElementById('sgScene').innerHTML = `<div style="font-weight:900; font-size:18px; color:#111827; margin-bottom:10px;">${q.title}</div>${q.scene}`;
    
    document.getElementById('sgAnalysis').style.display = 'none';
    document.getElementById('sgNextBtn').style.display = 'none';

    const optionsBox = document.getElementById('sgOptions');
    optionsBox.innerHTML = '';
    
    q.options.forEach((opt, index) => {
        const btn = document.createElement('div');
        // 🌟 选项改版：明亮、干净的苹果风白卡
        btn.style.cssText = "background: #FFF; border: 2px solid #E2E8F0; color: #334155; padding: 16px; border-radius: 16px; font-weight: bold; cursor: pointer; transition: 0.2s; line-height: 1.5; box-shadow: 0 2px 4px rgba(0,0,0,0.02);";
        btn.innerText = opt.text;
        btn.onclick = () => window.App.handleSgAnswer(index, btn);
        optionsBox.appendChild(btn);
    });
};

window.App.handleSgAnswer = function(selectedIndex, btnElement) {
    const engine = window.App.sgEngine;
    const q = engine.activeQuestions[engine.currentIndex];
    const selectedOpt = q.options[selectedIndex]; 
    
    const allBtns = document.getElementById('sgOptions').children;
    for(let b of allBtns) b.onclick = null;

    const analysisBox = document.getElementById('sgAnalysis');
    analysisBox.style.display = 'block';

    if (!selectedOpt.isCorrect) {
        // ❌ 答错状态 (柔和的红色预警)
        engine.balance -= selectedOpt.cost;
        if (!engine.wrongTags.includes(q.tag)) engine.wrongTags.push(q.tag);
        
        btnElement.style.background = '#FEF2F2'; 
        btnElement.style.borderColor = '#FCA5A5';
        btnElement.style.color = '#991B1B';
        
        const walletBox = document.getElementById('sgWalletBox');
        document.getElementById('sgWalletBalance').innerText = engine.balance;
        walletBox.classList.add('shake-hard-light');
        
        analysisBox.innerHTML = `<div style="color: #EF4444; font-size: 18px; font-weight: 900; margin-bottom: 8px;">🩸 扣款 -€${selectedOpt.cost}</div><div style="color: #475569; font-size: 14px; line-height: 1.6;">${selectedOpt.result}</div>`;
        engine.playTone('wrong');
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]); 
    } else {
        // ✅ 答对状态 (护眼的薄荷绿)
        btnElement.style.background = '#F0FDF4'; 
        btnElement.style.borderColor = '#6EE7B7';
        btnElement.style.color = '#065F46';
        
        analysisBox.innerHTML = `<div style="color: #10B981; font-size: 18px; font-weight: 900; margin-bottom: 8px;">✨ 完美闪避 +€0</div><div style="color: #475569; font-size: 14px; line-height: 1.6;">${selectedOpt.result}</div>`;
        engine.playTone('correct');
        if (navigator.vibrate) navigator.vibrate(50);
    }

    document.getElementById('sgNextBtn').style.display = 'block';
};

window.App.nextSgQuestion = function() {
    window.App.sgEngine.currentIndex++;
    if (window.App.sgEngine.currentIndex >= window.App.sgEngine.activeQuestions.length) {
        window.App.showSgResult();
    } else {
        window.App.renderSgQuestion();
    }
};

window.App.showSgResult = function() {
    document.getElementById('sgQuestionArea').style.display = 'none';
    document.getElementById('sgResultArea').style.display = 'flex';
    
    const balance = window.App.sgEngine.balance;
    let icon, title, desc;

    if (balance >= 400) {
        icon = '🛡️'; title = '零损耗生存大师';
        desc = '太强了！荷兰的妖风吹不倒你，杀猪盘骗不到你。你不是来历劫的，你是来给NPC上课的。这波操作安全感拉满！';
    } else if (balance >= 100) {
        icon = '🩹'; title = '交过学费的进阶留子';
        desc = '有惊无险！虽然因为没搞懂规矩交了一点“学费”，但在致命的杀猪盘前踩住了刹车。含泪多看《荷包管家》补课吧！';
    } else {
        icon = '💸'; title = '荷村行走的提款机';
        desc = '警报拉响！落地 24 小时，底裤都要被骗光了！听管家一句劝，千万别自己瞎闯了，先把下面推荐的干货背诵再出门吧！';
    }

    // 🌟 将战绩存入本地，实现闭环展示！
    localStorage.setItem('hp_sg_record', JSON.stringify({ balance, icon, title }));

    document.getElementById('sgResIcon').innerText = icon;
    document.getElementById('sgResTitle').innerText = title;
    document.getElementById('sgResBalance').innerText = balance;
    document.getElementById('sgResDesc').innerText = desc;

    let recHtml = `<div style="font-size: 16px; font-weight: 900; color: #111827; margin-bottom: 15px;">🎁 你的专属查漏补缺包</div>`;
    if (window.App.sgEngine.wrongTags.length === 0) {
        recHtml += `<div onclick="window.App.switchRbMode('pro'); document.getElementById('survivalGameModal').style.display='none'; window.App.renderSurvivalBanner();" style="background: #FFF; padding: 16px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 12px; cursor:pointer;"><span style="font-size: 24px;">🏆</span><div><div style="font-weight: 900; color: #111827;">满级玩家解锁</div><div style="font-size: 12px; color: #64748B;">去看看大盘与房贷利率吧</div></div></div>`;
    } else {
        window.App.sgEngine.wrongTags.forEach(tag => {
            recHtml += `<div onclick="window.App.switchRbMode('advanced'); document.getElementById('survivalGameModal').style.display='none'; window.App.renderSurvivalBanner();" style="background: #FFF; padding: 16px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 10px; display: flex; align-items: center; gap: 12px; cursor:pointer;"><span style="font-size: 24px;">🚨</span><div><div style="font-weight: 900; color: #EF4444;">${tag} 补考指南</div><div style="font-size: 12px; color: #64748B;">点击前往进阶篇查看防坑详解</div></div></div>`;
        });
    }
    document.getElementById('sgRecommendation').innerHTML = recHtml;

    setTimeout(() => {
        const posterDOM = document.getElementById('sgPosterContent');
        if (window.html2canvas) {
            html2canvas(posterDOM, { scale: 2, backgroundColor: null }).then(canvas => {
                const img = document.createElement('img');
                img.src = canvas.toDataURL("image/jpeg");
                img.style.width = '100%';
                img.style.display = 'block';
                document.getElementById('sgPosterDisplay').innerHTML = '';
                document.getElementById('sgPosterDisplay').appendChild(img);
            });
        }
    }, 100);
    // 🌟 门禁检测：如果生存摸底考成绩 >= 100 分 (及格线)
    if (balance >= 100) {
        setTimeout(() => {
            window.App.showRewardModal();
        }, 1500); // 延迟 1.5 秒，先让新生看一眼自己的牛逼战绩，再用通关弹窗给他一个暴击惊喜！
    }
};

// 页面加载完毕后自动渲染首页的战绩Banner
setTimeout(() => { if(window.App.renderSurvivalBanner) window.App.renderSurvivalBanner(); }, 300);
// ==========================================
// ✏️ 编辑个人资料引擎
// ==========================================

// 1. 唤起编辑弹窗并回填数据
window.App.openEditProfile = function() {
    // 关掉设置弹窗
    document.getElementById('settingsModal').style.display = 'none'; 
    
    // 获取当前数据并填充
    const currentName = localStorage.getItem('hp_name') || '新晋荷包蛋';
    const currentAvatar = localStorage.getItem('hp_avatar') || '😎';
    const currentEmail = localStorage.getItem('hp_email') || '未绑定邮箱';

    document.getElementById('editNameInput').value = currentName;
    document.getElementById('editAvatarInput').value = currentAvatar;
    document.getElementById('editEmailDisplay').innerText = currentEmail;

    // 显示编辑弹窗
    document.getElementById('editProfileModal').style.display = 'flex';
};

// 2. 保存资料并触发全局刷新
window.App.saveProfile = function() {
    const newName = document.getElementById('editNameInput').value.trim();
    const newAvatar = document.getElementById('editAvatarInput').value.trim();

    if (!newName) {
        return window.App.showToast ? window.App.showToast("昵称不能为空哦！", "warning") : alert("昵称不能为空");
    }

    // 存入本地缓存
    localStorage.setItem('hp_name', newName);
    if (newAvatar) {
        localStorage.setItem('hp_avatar', newAvatar);
    }

    // 关闭弹窗并提示
    document.getElementById('editProfileModal').style.display = 'none';
    if (window.App.showToast) window.App.showToast("✨ 资料修改成功！", "success");

    // 🚀 核心：立刻调用状态渲染函数，让外面的页面瞬间更新！
    if (window.App.renderProfileState) window.App.renderProfileState();
};


// ==========================================
// 👤 个人中心：状态渲染引擎与安全退出
// ==========================================

// 1. 动态渲染个人中心状态
window.App.renderProfileState = function() {
    const isLoggedIn = localStorage.getItem('hebao_logged_in') === 'true';
    const guestBlock = document.querySelector('.guest-login-block');
    const statsPanel = document.getElementById('userStatsPanel');
    const nameEl = document.getElementById('profileName');
    const subInfoEl = document.getElementById('profileSubInfo');
    const avatarEl = document.querySelector('.p-avatar');
    const vipBanner = document.querySelector('.vip-banner'); 

    if (isLoggedIn) {
        if (guestBlock) guestBlock.style.display = 'none';
        if (statsPanel) statsPanel.style.display = 'flex';
        
        const userName = localStorage.getItem('hp_name') || '荷包蛋';
        const userEmail = localStorage.getItem('hp_email') || '未知邮箱';
        const isVerified = localStorage.getItem('hp_email_verified') === 'true';
        
        if (vipBanner) vipBanner.style.display = isVerified ? 'none' : 'flex'; 

        const savedIds = JSON.parse(localStorage.getItem('hp_wiki_saved') || '[]');
        const dealCount = parseInt(localStorage.getItem('hebao_deal_count')) || 0;

        if (statsPanel) {
            statsPanel.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                    <span style="font-size:22px; font-weight:900; color:#111827;">${dealCount}</span>
                    <span style="font-size:11px; color:#9CA3AF; font-weight:bold;">🤝 成交</span>
                </div>
                <div style="width:1px; background:#F1F5F9; height:36px;"></div>
                <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
                    <span id="statSaved" style="font-size:22px; font-weight:900; color:#111827;">${savedIds.length}</span>
                    <span style="font-size:11px; color:#9CA3AF; font-weight:bold;">&#x1F496; 收藏</span>
                </div>
            `;
        }

        // 🌟 百变身份引擎：根据邮箱后缀自动匹配专属 UI
        const domain = (userEmail.split('@')[1] || '').toLowerCase();
        
        // 默认兜底：金色普通认证
        let badge = { 
            color: '#F59E0B', 
            grad: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)', 
            icon: '🎓', 
            text: '实名校友',
            textColor: '#78350F'
        };

        if (isVerified) {
            if (domain.includes('tudelft.nl')) {
                badge = { color: '#0EA5E9', grad: 'linear-gradient(135deg, #E0F2FE 0%, #0EA5E9 100%)', icon: '🏛️', text: 'TUD 认证', textColor: '#FFF' };
            } else if (domain.includes('uva.nl')) {
                badge = { color: '#DC2626', grad: 'linear-gradient(135deg, #FEE2E2 0%, #DC2626 100%)', icon: '❌', text: 'UvA 认证', textColor: '#FFF' };
            } else if (domain.includes('vu.nl')) {
                badge = { color: '#2563EB', grad: 'linear-gradient(135deg, #DBEAFE 0%, #2563EB 100%)', icon: '🦅', text: 'VU 认证', textColor: '#FFF' };
            } else if (domain.includes('eur.nl')) {
                badge = { color: '#10B981', grad: 'linear-gradient(135deg, #D1FAE5 0%, #10B981 100%)', icon: '📈', text: 'EUR 认证', textColor: '#FFF' };
            } else if (domain.includes('leidenuniv.nl')) {
                badge = { color: '#4F46E5', grad: 'linear-gradient(135deg, #E0E7FF 0%, #4F46E5 100%)', icon: '📜', text: 'Leiden 认证', textColor: '#FFF' };
            } else if (domain.includes('wur.nl')) {
                badge = { color: '#65A30D', grad: 'linear-gradient(135deg, #ECFCCB 0%, #65A30D 100%)', icon: '🌱', text: 'WUR 认证', textColor: '#FFF' };
            } else if (domain.includes('asml.com')) {
                badge = { color: '#0F172A', grad: 'linear-gradient(135deg, #475569 0%, #0F172A 100%)', icon: '⚙️', text: 'ASML 认证', textColor: '#FFF' };
            } else if (domain.includes('ing.com') || domain.includes('ing.nl')) {
                badge = { color: '#EA580C', grad: 'linear-gradient(135deg, #FFEDD5 0%, #EA580C 100%)', icon: '🦁', text: 'ING 认证', textColor: '#FFF' };
            } else if (domain.includes('booking.com')) {
                badge = { color: '#003B95', grad: 'linear-gradient(135deg, #93C5FD 0%, #003B95 100%)', icon: '🧳', text: 'Booking', textColor: '#FFF' };
            } else if (!domain.includes('gmail.com') && !domain.includes('hotmail.com') && !domain.includes('outlook.com') && !domain.includes('qq.com') && !domain.includes('163.com')) {
                // 如果不是常见个人邮箱，统归为名企/机构
                badge = { color: '#4B5563', grad: 'linear-gradient(135deg, #F3F4F6 0%, #4B5563 100%)', icon: '💼', text: '名企认证', textColor: '#FFF' };
            }
        }

        // 渲染名字旁的彩色对勾
        if (nameEl) {
            nameEl.innerHTML = `${userName} ${isVerified ? `<span style="color:${badge.color}; font-size:14px;">✔</span>` : ''}`;
        }
        
        // 渲染下方的专属徽章
        if (subInfoEl) {
            let badgeHtml = '<span style="background: #E2E8F0; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; color: #475569;">Lv.1</span>';
            if (isVerified) {
                badgeHtml = `<span style="background: ${badge.grad}; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 900; color: ${badge.textColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">${badge.icon} ${badge.text}</span>`;
            }
            subInfoEl.innerHTML = `<span>ID: ${userEmail.split('@')[0] || Math.floor(Math.random()*10000)}</span>${badgeHtml}`;
        }
        
        const customAvatar = localStorage.getItem('hp_avatar') || '😎';

        // 渲染头像框的发光颜色与角标
        if (avatarEl && isVerified) {
            avatarEl.innerText = customAvatar; 
            avatarEl.style.border = `3px solid ${badge.color}`;
            avatarEl.style.boxShadow = `0 0 20px ${badge.color}40`; // 40代表25%的透明度

            if (!document.getElementById('vipBadge')) {
                const vBadge = document.createElement('div');
                vBadge.id = 'vipBadge';
                vBadge.style.cssText = `position: absolute; bottom: -5px; right: -5px; background: #111827; border: 2px solid #FFF; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px;`;
                avatarEl.appendChild(vBadge);
            }
            document.getElementById('vipBadge').innerHTML = badge.icon;
        } else if (avatarEl) {
            avatarEl.innerText = customAvatar; 
            avatarEl.style.border = '3px solid #FFF'; 
            avatarEl.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
            const oldV = document.getElementById('vipBadge');
            if (oldV) oldV.remove();
        }
        
    } else {
        if (guestBlock) guestBlock.style.display = 'flex';
        if (statsPanel) statsPanel.style.display = 'none';
        if (vipBanner) vipBanner.style.display = 'flex'; 

        if (nameEl) nameEl.innerHTML = '新晋荷包蛋';
        if (subInfoEl) subInfoEl.innerHTML = `<span>ID: 未登录</span><span style="background: #E2E8F0; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; color: #475569;">Lv.0</span>`;
        if (avatarEl) {
            avatarEl.innerText = '👻';
            avatarEl.style.border = '3px solid #FFF';
            avatarEl.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
            const oldV = document.getElementById('vipBadge');
            if (oldV) oldV.remove();
        }
    }
};


// 2. 带有二次确认的安全退出功能
window.App.handleLogout = function() {
    if (confirm('确定要退出当前账号吗？退出后部分功能将受限。')) {
        // 清除核心登录态 (保留基础浏览缓存)
        localStorage.removeItem('hebao_logged_in');
        localStorage.removeItem('hebao_token');
        localStorage.removeItem('hp_email');
        localStorage.removeItem('hp_email_verified');
        
        document.getElementById('settingsModal').style.display = 'none';
        
        if (window.App.showToast) {
            window.App.showToast('已安全退出登录', 'success');
        }
        
        // 重新渲染页面状态
        window.App.renderProfileState();
    }
};

// 页面加载完毕时自动执行一次状态渲染
setTimeout(() => { if(window.App.renderProfileState) window.App.renderProfileState(); }, 500);

// ==========================================
// 🎓 尊贵校友认证：视觉蜕变引擎
// ==========================================
window.App.upgradeToVerifiedAlumni = function(email) {
    // 1. 关闭验证弹窗
    const modal = document.getElementById('emailVerifyModal') || document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';

    // 2. 播放全屏撒花特效 (极其提升爽感)
    if (window.App.showToast) {
        window.App.showToast("🎉 认证成功！尊贵校友特权已激活", "success");
    }

    // 3. 升级头像区域：镶金边 + 专属 V 标志
    const avatarBox = document.querySelector('.p-avatar');
    if (avatarBox) {
        avatarBox.style.border = '3px solid #F59E0B'; // 黄金边框
        avatarBox.style.boxShadow = '0 0 20px rgba(245,158,11,0.4)'; // 黄金发光
        avatarBox.style.position = 'relative';
        
        // 移除旧的 V 标（如果有）
        const oldV = document.getElementById('vipBadge');
        if (oldV) oldV.remove();

        // 加上右下角的 🎓 认证角标
        const vBadge = document.createElement('div');
        vBadge.id = 'vipBadge';
        vBadge.innerHTML = '🎓';
        vBadge.style.cssText = 'position: absolute; bottom: -5px; right: -5px; background: #111827; border: 2px solid #FFF; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);';
        avatarBox.appendChild(vBadge);
    }

    // 4. 升级用户名与等级标签
    const infoBox = document.querySelector('.p-info');
    if (infoBox) {
        const nameEl = infoBox.querySelector('div:first-child');
        const levelBox = infoBox.querySelector('div:last-child');
        
        if (nameEl) {
            nameEl.innerHTML = `荷包蛋东家 <span style="color:#F59E0B; font-size:14px;">✔</span>`;
            nameEl.style.color = '#111827';
        }
        if (levelBox) {
            levelBox.innerHTML = `
                <span>ID: ${email.split('@')[0]}</span>
                <span style="background: linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%); padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 900; color: #78350F; box-shadow: 0 2px 4px rgba(245,158,11,0.2);">🎓 实名校友</span>
            `;
        }
    }

    // 5. 改造未登录横幅 (彻底隐藏)
    const guestBlock = document.querySelector('.guest-login-block');
    if (guestBlock) guestBlock.style.display = 'none';

    // 6. 改造 VIP 认证 Banner：从“去点亮”变成“已点亮的数字名片”
    const vipBanner = document.querySelector('.vip-banner');
    if (vipBanner) {
        vipBanner.onclick = null; // 取消点击弹窗事件
        vipBanner.style.background = 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)';
        vipBanner.style.border = '1px solid #A7F3D0';
        vipBanner.style.boxShadow = '0 4px 15px rgba(16,185,129,0.1)';
        
        vipBanner.innerHTML = `
            <div style="position: relative; z-index: 1;">
                <div style="font-size: 15px; font-weight: 900; color: #065F46; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">🎓 荷兰高校校友认证</div>
                <div style="font-size: 11px; color: #047857; font-weight: bold;">已绑定：${email}</div>
            </div>
            <div style="background: #059669; color: #FFF; font-size: 12px; font-weight: 900; padding: 6px 14px; border-radius: 20px; z-index: 1; box-shadow: 0 2px 8px rgba(5,150,105,0.3);">✅ 特权已生效</div>
        `;
    }

    // 记录到本地缓存，下次打开 App 自动保持认证状态
    localStorage.setItem('hp_verified_email', email);
};

// 🌟 加入一段 CSS 动画
if (!document.getElementById('vipStyles')) {
    const style = document.createElement('style');
    style.id = 'vipStyles';
    style.innerHTML = `@keyframes popIn { 0% { transform: scale(0); } 80% { transform: scale(1.2); } 100% { transform: scale(1); } }`;
    document.head.appendChild(style);
}

// ==========================================
// 🛡️ 全局身份标识引擎 (纯净版)
// ==========================================
window.App.getUserBadgeHtml = function(email) {
    if (!email || email === '未绑定邮箱') {
        return `<span style="background: #F1F5F9; color: #64748B; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-left: 6px; border: 1px solid #E2E8F0;">👤 游客</span>`;
    }
    
    const domain = email.toLowerCase().split('@')[1] || '';
    let badge = null; 

    // --- 🎓 荷兰核心大学 ---
    if (domain.includes('tudelft.nl')) badge = { grad: 'linear-gradient(135deg, #E0F2FE 0%, #0EA5E9 100%)', icon: '🏛️', text: 'TUD', textColor: '#FFF' };
    else if (domain.includes('uva.nl')) badge = { grad: 'linear-gradient(135deg, #FEE2E2 0%, #DC2626 100%)', icon: '❌', text: 'UvA', textColor: '#FFF' };
    else if (domain.includes('vu.nl')) badge = { grad: 'linear-gradient(135deg, #DBEAFE 0%, #2563EB 100%)', icon: '🦅', text: 'VU', textColor: '#FFF' };
    else if (domain.includes('eur.nl')) badge = { grad: 'linear-gradient(135deg, #D1FAE5 0%, #10B981 100%)', icon: '📈', text: 'EUR', textColor: '#FFF' };
    else if (domain.includes('leidenuniv.nl')) badge = { grad: 'linear-gradient(135deg, #E0E7FF 0%, #4F46E5 100%)', icon: '📜', text: 'Leiden', textColor: '#FFF' };
    else if (domain.includes('wur.nl')) badge = { grad: 'linear-gradient(135deg, #ECFCCB 0%, #65A30D 100%)', icon: '🌱', text: 'WUR', textColor: '#FFF' };
    
    // --- 💼 荷兰核心名企 ---
    else if (domain.includes('asml.com')) badge = { grad: 'linear-gradient(135deg, #475569 0%, #0F172A 100%)', icon: '⚙️', text: 'ASML', textColor: '#FFF' };
    else if (domain.includes('ing.com') || domain.includes('ing.nl')) badge = { grad: 'linear-gradient(135deg, #FFEDD5 0%, #EA580C 100%)', icon: '🦁', text: 'ING', textColor: '#FFF' };
    
    else if (domain.endsWith('.edu') || domain.includes('student.')) {
        badge = { grad: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)', icon: '🎓', text: '实名校友', textColor: '#78350F' };
    }

    if (badge) {
        return `<span style="background: ${badge.grad}; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 900; color: ${badge.textColor}; margin-left: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">${badge.icon} ${badge.text}</span>`;
    }
    return ''; // 如果没有徽章，直接返回空，不再返回 NaN！
};
// ============================================================================
// App 核心启动引擎 (统一调度中心)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 延迟 100ms，确保所有 DOM 节点和 CSS 动画都已挂载完毕
    setTimeout(() => {
        try {
            const App = window.App || {};

            // 1. 恢复用户上次选择的“红宝书模式” (新手村/进阶篇)
            if (App.switchRbMode) App.switchRbMode(localStorage.getItem('hp_survival_mode') || 'starter');

            // 2. 渲染全站用户自定义头像 (如果用户上传过真实照片)
            if (App.renderGlobalAvatar) App.renderGlobalAvatar();

            // 3. 强制拉取两大核心板块的数据
            if (App.loadTrendingData) App.loadTrendingData();     // 拉取超市红黑榜
            if (App.loadCommunityPosts) App.loadCommunityPosts(); // 拉取集市二手帖

            // 4. 启动聊天全局雷达 (会自动拉取消息列表，并实时更新底部未读红点)
            if (App.startGlobalPolling) App.startGlobalPolling();

            // 5. 🌟 唤起大厂级新手引导 (内部会判断是否已经看过了)
            if (App.initGuide) App.initGuide();

            console.log("🚢 [Hebao Core] 所有后台数据引擎与 UI 渲染已成功启动！");
        } catch(e) { 
            console.error("🚨 引擎启动时发生错误:", e); 
        }
    }, 100); 
});
// ============================================================================
// 🚨 终极雷达探针版：搭子入队申请引擎 (用于精准定位静默失败)
// ============================================================================
const diagnosticInitiateChat = function(postId) {
    // 探针 1：测试按钮是否真的连上了这个函数！
    alert("🟢 探针 1: 按钮点击成功！接收到的 PostID 是: " + postId);

    let allPosts = window.allCommunityPostsCache || [];
    if (window.App && window.App.marketDataCache && window.App.marketDataCache.partner) {
        allPosts = [...allPosts, ...window.App.marketDataCache.partner];
    }

    const post = allPosts.find(p => String(p.id) === String(postId));
    
    // 探针 2：测试有没有在缓存里找到帖子
    if (!post) {
        alert(`🔴 探针 2 死亡: 找不到帖子！\n当前内存里共有 ${allPosts.length} 个帖子。\n你的 PostID ${postId} 不在里面！`);
        return;
    }

    alert("🟢 探针 3: 成功找到帖子！标题是: " + post.title);

    const currentUserId = localStorage.getItem('hebao_uuid');
    
    // 探针 4：测试登录态
    if (!currentUserId) {
        alert("🔴 探针 4 死亡: 系统认为你没登录 (找不到 hebao_uuid)！");
        return;
    }

    const isHost = String(currentUserId) === String(post.user_id);
    const cleanTitle = (post.title || '搭子局').replace(/\[找搭子\]\s*/, '').replace(/\[搭子\]\s*/, '');
    
    if (isHost) {
        alert("🟢 探针 5: 你是局长本人，准备拉起群聊...");
        if (window.App.openChat) window.App.openChat(`group_${post.id}`, '👥 ' + cleanTitle, '🏕️', post.id, `你的队伍`, 0, '', true, 'group_chat');
        else if (window.ChatEngine && window.ChatEngine.openChat) window.ChatEngine.openChat(`group_${post.id}`, '👥 ' + cleanTitle, '🏕️', post.id, `你的队伍`, 0, '', true, 'group_chat');
    } else {
        // 探针 6：呼叫 Confirm 弹窗！
        if (confirm(`【探针 6: 弹窗测试】\n确定要申请加入【${cleanTitle}】吗？`)) {
            
            alert("🟢 探针 7: 弹窗确认完毕，准备发射云端请求！");
            
            const token = localStorage.getItem('hebao_token') || '';
            const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

            // 1. 发送私信
            fetch('/api/send-message', {
                method: 'POST', headers: headers,
                body: JSON.stringify({ senderId: currentUserId, receiverId: post.user_id, postId: post.id, content: `【系统提示】我想申请加入你的搭子局【${cleanTitle}】，请前往消息列表审批！🙋` })
            }).catch(e => console.log(e));

            // 2. 发送云端申请
            fetch('/api/apply-partner', {
                method: 'POST', headers: headers,
                body: JSON.stringify({
                    postId: post.id, postTitle: cleanTitle, hostId: String(post.user_id), applicantId: currentUserId,
                    applicantName: localStorage.getItem('hp_name') || '热心管家', applicantAvatar: localStorage.getItem('hp_real_avatar') || localStorage.getItem('hp_avatar') || '😎'
                })
            }).then(res => res.json()).then(data => {
                if (data.success) alert("✅ 探针 8: 云端数据库写入成功！全链路跑通！");
                else alert("🔴 探针 8 死亡: API 返回报错: " + data.error);
            }).catch(err => alert("🔴 探针 8 死亡: 网络请求直接崩溃！" + err));
        }
    }
};

// 在 main.js 中，确保 window.App 已初始化
window.App.loadCommunityPosts = MarketEngine.loadPosts || MarketEngine.init;
// 🌟 关键改造：强制暴露给全局，让 ui.js 能呼叫到它！
window.App.loadCommunityPosts = async function() {
    try {
        // 1. 显示加载中动画
        const idleContainer = document.getElementById('idleWaterfall');
        if (idleContainer) idleContainer.innerHTML = '<div style="text-align:center; grid-column: 1 / -1; padding:20px; color:#9CA3AF;">⏳ 正在从云端拉取帖子...</div>';

        // 2. 呼叫你的 Vercel Serverless API
        // 注意：本地调试时这里可能会跨域，部署到 Vercel 后就好了
        const token = localStorage.getItem('hebao_token') || '';
        const response = await fetch('/api/get-community', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        // 3. 如果请求成功，开始渲染真实的 HTML
        if (data.success && data.posts && data.posts.length > 0) {
            // 把数据缓存起来，供资料卡等其他地方快速读取
            window.allCommunityPostsCache = data.posts; 
            
            // 🌟 核心：写一个专门渲染的函数（或者直接在这里拼装 HTML）
            renderPostsToUI(data.posts); 
        } else {
            if (idleContainer) idleContainer.innerHTML = '<div style="text-align:center; grid-column: 1 / -1; padding:20px; color:#9CA3AF;">这里还空空如也哦 📦</div>';
        }

    } catch (error) {
        console.error("拉取帖子失败:", error);
        const idleContainer = document.getElementById('idleWaterfall');
        if (idleContainer) idleContainer.innerHTML = '<div style="text-align:center; grid-column: 1 / -1; padding:20px; color:#EF4444;">🚨 网络拥堵，拉取失败</div>';
    }
};

// 🌟 核心：智能分类渲染引擎 (恢复 UI 风格与点击事件)
function renderPostsToUI(posts) {
    const idleContainer = document.getElementById('idleWaterfall');
    const helpContainer = document.getElementById('helpListContainer');
    const partnerContainer = document.getElementById('partnerListContainer');

    if (!idleContainer || !helpContainer || !partnerContainer) return;

    let idleHtml = '', helpHtml = '', partnerHtml = '';
    let idleCount = 0, helpCount = 0, partnerCount = 0;

    posts.forEach(post => {
        // 安全解析数据库里存的 JSON 内容
        let contentObj = {};
        try { contentObj = typeof post.content === 'string' ? JSON.parse(post.content) : post.content; } catch(e) {}
        
        const price = post.likes || 0; 
        const author = post.authorName || '荷包蛋';
        const avatar = post.avatar || '😎';
        const safeId = post.id;

        // ==========================================
        // 1. 闲置分类 (瀑布流双列卡片)
        // ==========================================
        if (post.title.includes('[闲置]')) {
            idleCount++;
            const imgUrl = (contentObj.items && contentObj.items[0] && contentObj.items[0].url) ? contentObj.items[0].url : 'https://via.placeholder.com/300?text=暂无图片';
            
            idleHtml += `
            <div onclick="if(window.App.openDetails) window.App.openDetails('${safeId}')" style="background:#FFF; border-radius:16px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.04); border:1px solid #F1F5F9; cursor:pointer; transition: transform 0.2s;" onmousedown="this.style.transform='scale(0.96)'" onmouseup="this.style.transform='scale(1)'">
                <img src="${imgUrl}" style="width:100%; height:160px; object-fit:cover; background:#F8FAFC;">
                <div style="padding:12px;">
                    <div style="font-weight:900; font-size:14px; color:#111827; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${post.title.replace('[闲置]', '').trim()}</div>
                    <div style="font-size:18px; font-weight:900; color:#EF4444;">€ ${price}</div>
                    <div style="display:flex; align-items:center; gap:6px; margin-top:8px;">
                        <span style="font-size:16px;">${avatar}</span>
                        <span style="font-size:11px; color:#64748B; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${author}</span>
                    </div>
                </div>
            </div>`;
        }
        // ==========================================
        // 2. 悬赏/互助分类 (横向宽卡片)
        // ==========================================
        else if (post.title.includes('[互助]') || post.title.includes('[悬赏]')) {
            helpCount++;
            helpHtml += `
            <div onclick="if(window.App.openDetails) window.App.openDetails('${safeId}')" style="background:#FFF; border-radius:16px; padding:16px; margin-bottom:12px; box-shadow:0 4px 15px rgba(0,0,0,0.04); border:1px solid #F1F5F9; cursor:pointer; display:flex; gap:12px; transition: transform 0.2s;" onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'">
                <div style="font-size:32px; background:#F8FAFC; width:48px; height:48px; border-radius:24px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">🤝</div>
                <div style="flex:1; overflow:hidden;">
                    <div style="font-weight:900; font-size:15px; color:#111827; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${post.title.replace(/\[.*?\]/, '').trim()}</div>
                    <div style="font-size:13px; color:#64748B; margin-bottom:10px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${contentObj.desc || '点开查看悬赏详情...'}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="font-size:16px; font-weight:900; color:#F59E0B;">${price > 0 ? '€ ' + price : '面议'}</div>
                        <div style="font-size:11px; color:#9CA3AF; font-weight:bold; background:#F1F5F9; padding:2px 6px; border-radius:6px;">📍 ${contentObj.location || contentObj.city || '线上/未知'}</div>
                    </div>
                </div>
            </div>`;
        }
        // ==========================================
        // 3. 搭子分类 (带缺人标识的组局卡片)
        // ==========================================
        else if (post.title.includes('[搭子]')) {
            partnerCount++;
            const maxP = contentObj.maxPeople || 2;
            const joined = contentObj.joinedCount || 1;
            const lacking = Math.max(0, maxP - joined);
            
            partnerHtml += `
            <div onclick="if(window.App.openDetails) window.App.openDetails('${safeId}')" style="background:#FFF; border-radius:16px; padding:16px; margin-bottom:12px; box-shadow:0 4px 15px rgba(0,0,0,0.04); border:1px solid #F1F5F9; cursor:pointer; transition: transform 0.2s;" onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="font-weight:900; font-size:15px; color:#111827; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${post.title.replace('[搭子]', '').trim()}</div>
                    <div style="background:#FEF2F2; color:#DC2626; padding:4px 8px; border-radius:8px; font-size:11px; font-weight:900; border:1px solid #FECACA; flex-shrink:0;">缺 ${lacking} 人</div>
                </div>
                <div style="font-size:13px; color:#64748B; margin-bottom:12px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${contentObj.desc || '一起来组局吧！'}</div>
                <div style="display:flex; align-items:center; justify-content:space-between;">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span style="font-size:16px;">${avatar}</span>
                        <span style="font-size:11px; color:#9CA3AF; font-weight:bold;">${author} 发起</span>
                    </div>
                    <span style="font-size:11px; color:#6366F1; font-weight:900; background:#EEF2FF; padding:2px 6px; border-radius:6px;">⏱️ ${contentObj.time || '时间随意'}</span>
                </div>
            </div>`;
        }
    });

    // 将生成的专属 HTML 注入到各自的容器中 (带空状态保护)
    idleContainer.innerHTML = idleCount > 0 ? idleHtml : '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#9CA3AF; font-size:13px; font-weight:bold;">📦 暂无闲置信息</div>';
    helpContainer.innerHTML = helpCount > 0 ? helpHtml : '<div style="text-align:center; padding:40px; color:#9CA3AF; font-size:13px; font-weight:bold;">🤝 暂无悬赏信息</div>';
    partnerContainer.innerHTML = partnerCount > 0 ? partnerHtml : '<div style="text-align:center; padding:40px; color:#9CA3AF; font-size:13px; font-weight:bold;">🏕️ 暂无搭子信息</div>';
}

// ============================================================================
// 🛡️ 荷包管家：最高权限社交引擎 (真·全网联通版)
// ============================================================================

window.App = window.App || {};

// 强制接管所有搭子申请逻辑
window.App.initiatePartnerChat = window.initiatePartnerChat = async function(postId) {
    console.log("🚀 社交引擎启动，目标帖子:", postId);

    // 1. 寻找帖子数据
    let allPosts = window.allCommunityPostsCache || [];
    if (window.App.marketDataCache && window.App.marketDataCache.partner) {
        allPosts = [...allPosts, ...window.App.marketDataCache.partner];
    }
    const post = allPosts.find(p => String(p.id) === String(postId));

    if (!post) {
        console.error("找不到帖子:", postId);
        return window.App.showToast ? window.App.showToast("帖子数据加载中，请稍后", "info") : null;
    }

    const currentUserId = localStorage.getItem('hebao_uuid');
    if (!currentUserId) return window.App.showToast("请先登录哦", "warning");

    // 如果是自己发的帖子，直接进群
    if (String(currentUserId) === String(post.user_id)) {
        const cleanTitle = post.title.replace(/\[.*?\]\s*/, '');
        if (window.App.openChat) {
            window.App.openChat(`group_${post.id}`, '👥 ' + cleanTitle, '🏕️', post.id, `你的队伍`, 0, '', true, 'group_chat');
        }
        return;
    }

    // 🌟 核心改进：不再使用 confirm()，直接进入申请流程并提示用户
    if (window.App.showToast) window.App.showToast("⌛ 正在发送申请...", "info");

    const token = localStorage.getItem('hebao_token') || '';
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    const cleanTitle = post.title.replace(/\[.*?\]\s*/, '');

    try {
        // A. 给局长发私信 (红点通知)
        fetch('/api/send-message', {
            method: 'POST', headers: headers,
            body: JSON.stringify({ 
                senderId: currentUserId, 
                receiverId: post.user_id, 
                postId: post.id, 
                content: `【系统提示】我想申请加入你的搭子局【${cleanTitle}】，请前往消息列表审批！🙋` 
            })
        });

        // B. 写入 Turso 数据库 (真实申请记录)
        const res = await fetch('/api/apply-partner', {
            method: 'POST', headers: headers,
            body: JSON.stringify({
                postId: post.id,
                postTitle: cleanTitle,
                hostId: String(post.user_id),
                applicantId: currentUserId,
                applicantName: localStorage.getItem('hp_name') || '热心管家',
                applicantAvatar: localStorage.getItem('hp_real_avatar') || localStorage.getItem('hp_avatar') || '😎'
            })
        });

        const data = await res.json();
        
        if (data.success) {
            console.log("✅ 申请成功写入数据库");
            // 🌟 终极反馈：不弹窗，直接在屏幕中央显示漂亮的绿色成功提示
            if (window.App.showToast) {
                window.App.showToast("✅ 申请已发送！请等待局长审批", "success");
            } else {
                alert("✅ 申请已发送！");
            }
        } else {
            throw new Error(data.error);
        }
    } catch (err) {
        console.error("申请失败:", err);
        if (window.App.showToast) window.App.showToast("发送失败，请稍后重试", "error");
    }
};

// 确保 ChatEngine 也用这个函数
if (window.ChatEngine) {
    window.ChatEngine.initiatePartnerChat = window.App.initiatePartnerChat;
}

// ============================================================================
// 🚑 核心页面切换与导航引擎 (修复底部菜单不显示的问题)
// ============================================================================

// 1. 全局主页面切换 (底导栏)
window.switchTab = function(pageId, tabElement) {
    // 隐藏所有主页面
    document.querySelectorAll('.page-section').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    // 显示目标页面
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.style.display = 'block';
    }
    
    // 底部高亮状态切换 (排除中间的发布按钮)
    if (tabElement) {
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.remove('active');
        });
        tabElement.classList.add('active');
    }
};

// 2. 管家集市 Tab 切换 (闲置 / 悬赏 / 搭子)
window.switchMarketTab = function(tabId, element) {
    // 隐藏所有集市列表
    const idle = document.getElementById('idleWaterfall');
    const help = document.getElementById('helpListContainer');
    const partner = document.getElementById('partnerListContainer');
    
    if (idle) idle.style.display = 'none';
    if (help) help.style.display = 'none';
    if (partner) partner.style.display = 'none';
    
    // 显示选中的列表
    if (tabId === 'idle' && idle) idle.style.display = 'grid';
    if (tabId === 'help' && help) help.style.display = 'block';
    if (tabId === 'partner' && partner) partner.style.display = 'block';
    
    // 高亮选中状态
    document.querySelectorAll('.m-tab').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');
    
    // 触发数据加载
    if (window.App && window.App.loadCommunityPosts) {
        window.App.loadCommunityPosts(tabId);
    }
};

// 3. 个人中心资产 Tab 切换 (发布 / 收藏 / 足迹 / 评价)
window.switchAssetTab = function(tabId, element) {
    // 隐藏所有资产内容
    document.querySelectorAll('.asset-content').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });
    
    // 显示目标资产内容
    const targetContent = document.getElementById('asset-' + tabId);
    if (targetContent) {
        targetContent.style.display = 'block';
        targetContent.classList.add('active');
    }
    
    // 高亮文字与下划线
    document.querySelectorAll('.a-tab').forEach(el => {
        el.classList.remove('active');
        el.style.color = '#64748B';
        el.style.fontWeight = 'bold';
        const underline = el.querySelector('.tab-underline');
        if (underline) underline.remove();
    });
    
    if (element) {
        element.classList.add('active');
        element.style.color = '#111827';
        element.style.fontWeight = '900';
        element.innerHTML += '<div class="tab-underline" style="position: absolute; bottom: -13px; left: 50%; transform: translateX(-50%); width: 20px; height: 3px; background: #111827; border-radius: 2px;"></div>';
    }
};

// 4. 返回上一页全局函数
window.goBack = function() {
    window.switchTab('tips', document.querySelector('.tab-item[onclick*="tips"]'));
};
