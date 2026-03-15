// js/main.js
import { ScannerEngine } from './modules/scanner.js';
import { MarketEngine } from './modules/market.js';
import { WikiEngine } from './modules/wiki.js';
import { ChatEngine } from './modules/chat.js';
import { showToast } from './core/toast.js';

// 🛡️ 极度防御：确保全局只初始化一次
if (!window.App) {
    window.App = {
        // --- 路由/全局 ---
        showToast,
        
        // --- 扫码与详情 ---
        handlePackageImage: ScannerEngine.handlePackageImage,
        setupDetailPage: ScannerEngine.setupDetailPage,
        
        // --- 集市 ---
        renderIdleItems: MarketEngine.renderIdleItems,
        
        // --- 红宝书 ---
        switchRbMode: WikiEngine.switchRbMode,
        
        // --- 聊天 ---
        openChat: ChatEngine.openChat

        likeReviewCard: ScannerEngine.likeReviewCard.bind(ScannerEngine),
        openDetailsFromHistory: ScannerEngine.openDetailsFromHistory.bind(ScannerEngine),
        submitDetailReview: ScannerEngine.submitDetailReview.bind(ScannerEngine),
        getAuthHeaders: () => { return { 'Content-Type': 'application/json' }; } // 假设 auth.js 没接好前先提供基础 Header
    };

    // 绑定旧版 index.html 中裸露的全局函数，防止白屏报错
    window.switchRbMode = window.App.switchRbMode;
    window.handlePackageImage = window.App.handlePackageImage;
    window.openChat = window.App.openChat;
    window.showToast = window.App.showToast;

// 绑定给原生 HTML onClick 使用
    window.handlePackageImage = ScannerEngine.handlePackageImage.bind(ScannerEngine);
    window.startBarcodeScan = ScannerEngine.startBarcodeScan.bind(ScannerEngine);
    window.closeScanner = ScannerEngine.closeScanner.bind(ScannerEngine);
    window.resetApp = ScannerEngine.resetApp.bind(ScannerEngine);
    window.openDetailsFromScan = ScannerEngine.openDetailsFromScan.bind(ScannerEngine);
    
    console.log("🚢 荷包管家核心引擎模块化加载完毕，防御装甲已上线。");
}

// 启动入口
document.addEventListener('DOMContentLoaded', () => {
    try {
        // 初始化应用状态
        WikiEngine.switchRbMode(localStorage.getItem('hp_survival_mode') || 'starter');
        // ... 其他初始化逻辑
    } catch (e) {
        console.error("🚨 [App Init Error]:", e);
    }
});
