// ============================================================================
// js/main.js - 荷包管家核心调度引擎 (终极防弹版)
// ============================================================================
import { ScannerEngine } from './modules/scanner.js';
import { MarketEngine } from './modules/market.js';
import { WikiEngine } from './modules/wiki.js';
import { ChatEngine } from './modules/chat.js';
import { showToast } from './core/toast.js';
import { ModalManager } from './components/modals.js';
import { safeDOM } from './core/dom.js';

// ============================================================================
// 🎨 UI 界面与发布菜单引擎 (专门接管底部的加号发布与弹窗开关)
// ============================================================================
const UIEngine = {
    openPublishSheet() {
        ModalManager.injectIfNeeded('publishSheet');
        safeDOM.execute('publishOverlay', el => el.style.display = 'block');
        safeDOM.execute('publishSheet', el => {
            el.style.display = 'block';
            // 延迟一帧强制重绘，触发 CSS 从下往上滑出的动画
            setTimeout(() => el.style.transform = 'translateY(0)', 10);
        });
    },
    closePublishSheet() {
        safeDOM.execute('publishOverlay', el => el.style.display = 'none');
        safeDOM.execute('publishSheet', el => {
            el.style.transform = 'translateY(100%)';
            // 等待动画结束再将其隐藏
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
    openHelpPublish() {
        this.closePublishSheet();
        // 确保你的 modals.js 里有 publishHelpModal 这个模板
        ModalManager.injectIfNeeded('publishHelpModal'); 
        safeDOM.execute('publishHelpModal', el => el.style.display = 'flex');
    },
    openPartnerPublish() {
        this.closePublishSheet();
        // 确保你的 modals.js 里有 publishPartnerModal 这个模板
        ModalManager.injectIfNeeded('publishPartnerModal'); 
        safeDOM.execute('publishPartnerModal', el => el.style.display = 'flex');
    }
};

// ============================================================================
// 🛡️ 极度防御：全局入口挂载 (统领所有引擎)
// ============================================================================
window.App = window.App || {};
window.App.showToast = showToast;
window.App.injectIfNeeded = ModalManager.injectIfNeeded.bind(ModalManager);
window.App.safeDOM = safeDOM;

// 💡 暴力兼容引擎：把所有模块的方法不仅挂载到 window.App，还直接挂载到顶级 window 上！
// 这样无论 HTML 怎么写（onclick="xxx()" 或 onclick="window.App.xxx()"）都能绝对命中！
const modulesToBind = [ScannerEngine, MarketEngine, WikiEngine, ChatEngine, UIEngine];

modulesToBind.forEach(module => {
    Object.keys(module).forEach(key => {
        if (typeof module[key] === 'function') {
            const boundFunc = module[key].bind(module);
            window.App[key] = boundFunc;
            window[key] = boundFunc; 
        }
    });
});

// --- 占位 Auth (应对代码中随时可能调用的鉴权检查) ---
window.App.getAuthHeaders = () => {
    const token = localStorage.getItem('hebao_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

window.App.requireAuth = (callback) => { 
    const isLoggedIn = localStorage.getItem('hebao_logged_in') === 'true';
    if (!isLoggedIn) {
        safeDOM.execute('loginModal', el => el.style.display = 'flex');
    } else {
        if (callback) callback(); 
    }
};
window.requireAuth = window.App.requireAuth;

console.log("🚢 [Hebao Core] 主引擎加载完毕，所有模块已挂载，发布系统就绪！");

// ============================================================================
// 🚀 全局启动器 (页面加载完毕后执行)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    try {
        if (window.App.switchRbMode) {
            window.App.switchRbMode(localStorage.getItem('hp_survival_mode') || 'starter');
        }
    } catch(e) { 
        console.error("🚨 启动时发生错误:", e); 
    }
});
