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
const modulesToBind = [ScannerEngine, MarketEngine, WikiEngine, ChatEngine, AuthEngine, TrendingEngine, UIEngine];

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
            
            console.log("🚢 [Hebao Core] 所有后台数据引擎已启动！");
        } catch(e) { 
            console.error("🚨 启动时发生错误:", e); 
        }
    }, 100); // 延迟 0.1 秒，等待 DOM 完全渲染
});
