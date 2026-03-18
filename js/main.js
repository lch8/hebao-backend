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

// js/main.js 里的 market 初始化部分
window.App.initMarketCards = async function() {
    try {
        const res = await fetch('/api/get-market');
        const result = await res.json();
        
        if (result.success && result.data) {
            const data = result.data;
            
            // 🌟 核心修复：使用最新的 HTML ID
            const exEl = document.getElementById('market-exchange');
            if (exEl) {
                const color = data.exchange.change >= 0 ? '#EF4444' : '#10B981';
                const sign = data.exchange.change >= 0 ? '↑' : '↓';
                exEl.innerHTML = `${data.exchange.current} <span style="font-size:12px; color:${color}; margin-left:2px;">${sign}${Math.abs(data.exchange.change)}</span>`;
                exEl.style.color = color;
            }
            
            const enEl = document.getElementById('market-energy');
            if (enEl) enEl.innerText = `€${data.energy.current}`;
            
            const moEl = document.getElementById('market-mortgage');
            if (moEl) moEl.innerText = `${data.mortgage.current}%`;
        }
    } catch (e) {
        console.warn("大盘数据加载跳过（可能不在Pro页面）:", e.message);
    }
};

// ==========================================
// 🌟 自动唤醒大盘卡片：拉取真实数据并渲染外显数字
// ==========================================
window.App.initMarketCards = async function() {
    try {
        const res = await fetch('/api/get-market');
        const result = await res.json();
        
        if (result.success) {
            const data = result.data;
            
            // 1. 自动更新汇率卡片
            const exEl = document.getElementById('market-exchange');
            if (exEl) {
                const sign = data.exchange.change >= 0 ? '↑' : '↓';
                const color = data.exchange.change >= 0 ? '#EF4444' : '#10B981';
                // 拼接当前汇率和涨跌幅 (例如: 7.92 ↑0.02)
                exEl.innerHTML = `${data.exchange.current} <span style="font-size:12px; color:${color}; margin-left:2px;">${sign}${Math.abs(data.exchange.change)}</span>`;
                // 根据涨跌改变主数字颜色
                exEl.style.color = color;
            }
            
            // 2. 自动更新电价卡片
            const enEl = document.getElementById('market-energy');
            if (enEl) enEl.innerText = `€${data.energy.current}`;
            
            // 3. 自动更新房贷卡片
            const moEl = document.getElementById('market-mortgage');
            if (moEl) moEl.innerText = `${data.mortgage.current}%`;
        }
    } catch (e) {
        console.error("加载卡片真实数据失败", e);
    }
};

// 页面加载完毕后，延迟 300 毫秒静默获取数据，不卡顿页面
setTimeout(() => {
    if (window.App.initMarketCards) {
        window.App.initMarketCards();
    }
}, 300);
// ============================================================================
// 🚀 全局启动器 (页面加载完毕后自动拉取数据)
// ============================================================================
// 🚀 全局启动器 (确保所有页面一打开就有数据！)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        try {
            if (window.App.switchRbMode) window.App.switchRbMode(localStorage.getItem('hp_survival_mode') || 'starter');
            
            // 🌟 强制拉取四大金刚的数据！
            if (window.App.loadTrendingData) window.App.loadTrendingData(); 
            if (window.App.loadCommunityPosts) window.App.loadCommunityPosts(); 
            if (window.App.loadConversations) window.App.loadConversations();
            // 在你的 DOMContentLoaded 或各种 Engine 绑定完毕之后，加上这句：
if (window.App && window.App.startGlobalPolling) {
    window.App.startGlobalPolling();
}
            
            console.log("🚢 [Hebao Core] 所有后台数据引擎已启动！");
        } catch(e) { 
            console.error("🚨 启动时发生错误:", e); 
        }
    }, 100); // 延迟 0.1 秒，等待 DOM 完全渲染
});
