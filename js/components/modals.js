import { showToast } from '../core/toast.js';

export const ModalManager = {
    /**
     * 🛡️ 核心防御：安全地注入 HTML
     * @param {string} modalId - 弹窗 ID
     * @param {string} htmlString - 弹窗的 HTML 字符串
     */
    safeInject(modalId, htmlString) {
        try {
            // 防御：如果 DOM 中已经存在该弹窗，绝对不重复注入，防止内存泄漏和 ID 冲突
            if (document.getElementById(modalId)) {
                return;
            }
            // 安全注入到 body 末尾
            document.body.insertAdjacentHTML('beforeend', htmlString);
        } catch (error) {
            console.error(`🚨 [Modal Injection Error] 注入 ${modalId} 失败:`, error);
        }
    },

    /**
     * 安全地打开弹窗
     */
    open(modalId) {
        try {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'flex';
            } else {
                console.warn(`🛡️ 试图打开不存在的弹窗: #${modalId}`);
                showToast("模块加载中，请稍后再试");
            }
        } catch (error) {
            console.error("🚨 [Modal Open Error]:", error);
        }
    },

    /**
     * 📦 模板 1：全局登录/验证弹窗
     */
    initLoginModal() {
        const loginHtml = `
        <div class="modal-overlay" id="loginModal" style="display: none; z-index: 4000;">
            <div class="modal-content" style="text-align: center;">
                <div class="modal-close" onclick="document.getElementById('loginModal').style.display='none'">✕</div>
                <h3 style="margin-top:0;">🔐 身份认证</h3>
                <p style="font-size: 13px; color: #6B7280; margin-bottom: 20px;">为了保证社区真实互助，发布前需验证邮箱。</p>
                <input type="email" id="hebaoAuthEmail" class="search-input" placeholder="输入您的邮箱地址">
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <input type="text" id="authCode" class="search-input" placeholder="6位验证码" style="width: 60%;">
                    <button id="btnSendCode" class="action-btn" style="width: 40%;" onclick="window.App.sendAuthCode()">获取</button>
                </div>
                <button id="btnVerifyLogin" class="action-btn" style="width: 100%;" onclick="window.App.verifyEmailCode()">立即验证</button>
            </div>
        </div>`;
        this.safeInject('loginModal', loginHtml);
    },

    /**
     * 📦 模板 2：评论与锐评弹窗
     */
    initReviewModal() {
        const reviewHtml = `
        <div class="modal-overlay" id="addReviewModal" style="display:none;" onclick="this.style.display='none'">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-close" onclick="document.getElementById('addReviewModal').style.display='none'">✕</div>
                <h3 style="margin-top:0; color: #111827;">发表你的锐评</h3>
                <select id="reviewAttitude" class="modal-input" style="margin-bottom:10px;">
                    <option value="👍 推荐">👍 疯狂安利 (种草)</option>
                    <option value="💣 拔草">💣 难吃/巨坑 (避雷)</option>
                </select>
                <textarea id="reviewText" class="modal-textarea" placeholder="写下你的真实评价！"></textarea>
                <button id="btnSubmitReview" style="width: 100%; padding: 14px; background: #10B981; color: #FFF; border: none; border-radius: 12px; font-weight: bold; margin-top: 15px; cursor:pointer;" onclick="window.App.submitDetailReview()">🚀 提交评价</button>
            </div>
        </div>`;
        this.safeInject('addReviewModal', reviewHtml);
    },

    // ... 未来将 publishIdleModal, chatModal 等一个个搬进来 ...
    
    /**
     * 🚀 启动器：在页面首屏渲染完成后，惰性加载弹窗，提升渲染速度
     */
    lazyLoadAll() {
        setTimeout(() => {
            this.initLoginModal();
            this.initReviewModal();
            // this.initPublishModals();
            // this.initChatModal();
        }, 800); // 延迟 800ms，确保让出主线程给核心 UI 渲染
    }
};
