// js/main.js
import { ScannerEngine } from './modules/scanner.js';
import { MarketEngine } from './modules/market.js';
import { WikiEngine } from './modules/wiki.js';
import { ChatEngine } from './modules/chat.js';
import { showToast } from './core/toast.js';
// 假设未来的 auth 和 profile 逻辑
// import { AuthEngine } from './modules/auth.js'; 

// 🛡️ 极度防御：全局入口挂载
if (!window.App) {
    window.App = {
        showToast,
        
        // --- 1. Scanner ---
        handlePackageImage: ScannerEngine.handlePackageImage.bind(ScannerEngine),
        startBarcodeScan: ScannerEngine.startBarcodeScan.bind(ScannerEngine),
        closeScanner: ScannerEngine.closeScanner.bind(ScannerEngine),
        openDetailsFromScan: ScannerEngine.openDetailsFromScan.bind(ScannerEngine),
        openDetailsFromHistory: ScannerEngine.openDetailsFromHistory.bind(ScannerEngine),
        submitDetailReview: ScannerEngine.submitDetailReview.bind(ScannerEngine),
        likeReviewCard: ScannerEngine.likeReviewCard.bind(ScannerEngine),
        
        // --- 2. Market ---
        applyMarketFilters: MarketEngine.applyFilters.bind(MarketEngine),
        handleMultiImageSelect: MarketEngine.handleMultiImageSelect.bind(MarketEngine),
        toggleVoiceInput: MarketEngine.toggleVoiceInput.bind(MarketEngine),
        submitIdlePost: MarketEngine.submitIdlePost.bind(MarketEngine),
        
        // --- 3. Wiki ---
        switchRbMode: WikiEngine.switchRbMode.bind(WikiEngine),
        hSwipeStart: WikiEngine.hSwipeStart.bind(WikiEngine),
        hSwipeMove: WikiEngine.hSwipeMove.bind(WikiEngine),
        hSwipeEnd: WikiEngine.hSwipeEnd.bind(WikiEngine),
        toggleWikiCard: WikiEngine.toggleWikiCard.bind(WikiEngine),
        checkSafetyCode: WikiEngine.checkSafetyCode.bind(WikiEngine),

        // --- 4. Chat ---
        openChat: ChatEngine.openChat.bind(ChatEngine),
        closeChat: ChatEngine.closeChat.bind(ChatEngine),
        sendChatMessage: ChatEngine.sendChatMessage.bind(ChatEngine),
        sendQuickMessage: ChatEngine.sendQuickMessage.bind(ChatEngine),

        // 占位 Auth (待抽离)
        getAuthHeaders: () => { return { 'Content-Type': 'application/json' }; },
        requireAuth: (callback) => { if (callback) callback(); } // 假设已登录
    };

    // 🔗 暴力兼容旧代码中 HTML 直接写的 onclick="switchRbMode(...)"
    Object.keys(window.App).forEach(key => {
        window[key] = window.App[key];
    });

    console.log("🚢 [Hebao Core] 四大模块引擎已成功模块化并挂载，旧版 app.js 可以彻底删除了！");
}

// 全局启动器
document.addEventListener('DOMContentLoaded', () => {
    try {
        WikiEngine.switchRbMode(localStorage.getItem('hp_survival_mode') || 'starter');
        MarketEngine.loadCommunityPosts();
        ScannerEngine.renderFootprints();
    } catch (e) {
        console.error("🚨 [App Init Error]:", e);
    }
});
