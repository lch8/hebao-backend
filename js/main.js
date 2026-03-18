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

window.App.showProChart = function(type) {
    // 1. 调起我们刚写好的画板弹窗
    window.App.openModal('proChartModal');
    
    // 2. 延迟 100ms 渲染图表（必须等弹窗完全显示，Canvas 才有宽高）
    setTimeout(() => {
        const ctx = document.getElementById('proTrendCanvas').getContext('2d');
        
        // 如果之前画过图，必须先销毁，否则鼠标放上去会疯狂闪烁
        if (currentProChart) {
            currentProChart.destroy();
        }

        let title = '', labels = [], dataPoints = [], lineColor = '', bgColor = '';

        // 3. 根据点击的不同卡片，装载不同的模拟数据和情绪配色
        if (type === 'exchange') {
            title = '💶 欧元/人民币 (近7天走势)';
            labels = ['周一', '周二', '周三', '周四', '周五', '周六', '今日'];
            dataPoints = [7.75, 7.78, 7.81, 7.79, 7.80, 7.82, 7.82];
            lineColor = '#EF4444'; // 红色代表上涨
            bgColor = 'rgba(239, 68, 68, 0.1)';
        } else if (type === 'power') {
            title = '⚡ 荷兰日均电价走势 (€/kWh)';
            labels = ['10-01', '10-02', '10-03', '10-04', '10-05', '10-06', '今日'];
            dataPoints = [0.15, 0.16, 0.14, 0.12, 0.11, 0.13, 0.12];
            lineColor = '#10B981'; // 绿色代表电价下降
            bgColor = 'rgba(16, 185, 129, 0.1)';
        } else if (type === 'mortgage') {
            title = '🏠 荷兰10年期房贷利率 (%)';
            labels = ['4月', '5月', '6月', '7月', '8月', '9月', '本月'];
            dataPoints = [4.12, 4.05, 3.98, 3.95, 3.90, 3.88, 3.85];
            lineColor = '#3B82F6'; // 稳重的金融蓝
            bgColor = 'rgba(59, 130, 246, 0.1)';
        }

        document.getElementById('chartModalTitle').innerText = title;

        // 4. 调用 Chart.js 绘制丝滑的高级曲线
        currentProChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data: dataPoints,
                    borderColor: lineColor,
                    backgroundColor: bgColor,
                    borderWidth: 3,
                    pointBackgroundColor: '#FFF',
                    pointBorderColor: lineColor,
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    fill: true, // 开启下方渐变填充
                    tension: 0.4 // 贝塞尔曲线，让线条极其圆润丝滑
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10, family: 'sans-serif' }, color: '#9CA3AF' } },
                    y: { grid: { color: '#F3F4F6', drawBorder: false }, ticks: { font: { size: 10 }, color: '#9CA3AF' } }
                },
                interaction: { mode: 'nearest', axis: 'x', intersect: false }
            }
        });
    }, 150); // 留出充足时间让 Modal 动画播放完
};

async function loadRealMarketData() {
    try {
        const res = await fetch('/api/get-market');
        const { data } = await res.json();
        
        if (data) {
            // 1. 渲染【汇率卡片】外显数字
            document.querySelector('#exchange-rate-value').innerText = data.exchange.current;
            const exChangeEl = document.querySelector('#exchange-rate-change');
            if (data.exchange.change >= 0) {
                exChangeEl.innerText = `↑${data.exchange.change}`;
                exChangeEl.style.color = '#EF4444'; // 涨是红色
            } else {
                exChangeEl.innerText = `↓${Math.abs(data.exchange.change)}`;
                exChangeEl.style.color = '#10B981'; // 跌是绿色
            }

            // 2. 渲染【电价卡片】外显数字
            document.querySelector('#energy-price-value').innerText = `€${data.energy.current}`;

            // 3. 渲染【房贷卡片】外显数字
            document.querySelector('#mortgage-rate-value').innerText = data.mortgage.current;

            // ========================================================
            // ⚠️ 重点：当你用户点击卡片，弹窗显示曲线图时，把对应的数组传给图表库！
            // ========================================================
            
            // 假设用户点击了汇率卡片：
            // 图表横坐标 (X轴) 使用： data.exchange.chartLabels  (如: ["03-01", "03-02", ...])
            // 图表纵坐标 (Y轴) 使用： data.exchange.chartData    (如: [7.81, 7.82, ...])

            // 假设用户点击了电价卡片：
            // 图表横坐标 (X轴) 使用： data.energy.chartLabels  (如: ["0:00", "1:00", ...])
            // 图表纵坐标 (Y轴) 使用： data.energy.chartData    (如: [0.12, 0.10, -0.01, ...]) 
            // （注：荷兰电价有时会出现负数，留学生超爱看这个薅羊毛！）
        }
    } catch (error) {
        console.error("加载真实大盘数据失败", error);
    }
}

// 页面加载时调用
loadRealMarketData();
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
