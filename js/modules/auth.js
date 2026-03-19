// ============================================================================
// js/modules/auth.js - 用户鉴权与登录引擎 (防弹升级版)
// ============================================================================
import { showToast } from '../core/toast.js';
import { safeDOM } from '../core/dom.js';

let userUUID = localStorage.getItem('hebao_uuid');
if (!userUUID) { 
    userUUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) { 
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); 
        return v.toString(16); 
    }); 
    localStorage.setItem('hebao_uuid', userUUID); 
}

let isLoggedIn = localStorage.getItem('hebao_logged_in') === 'true';
let currentPendingAction = null;

export const AuthEngine = {
    // 拦截操作，要求登录
    requireAuth(actionFunction) { 
        if (!isLoggedIn) { 
            currentPendingAction = actionFunction; 
            if (window.App && window.App.openModal) {
                window.App.openModal('loginModal');
            } else {
                safeDOM.execute('loginModal', el => el.style.display = 'flex'); 
            }
        } else { 
            if (actionFunction) actionFunction(); 
        } 
    },

    // 🌟 发送验证码 (新增 Spam 垃圾箱强提醒)
    async sendAuthCode() {
        const email = safeDOM.getValue('hebaoAuthEmail').trim();
        if (!email || !email.includes('@')) return showToast("请输入有效的邮箱！", "warning");

        safeDOM.execute('btnSendCode', btn => { btn.innerText = '发送中...'; btn.disabled = true; });

        try {
            const res = await fetch('/api/send-auth-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            
            if (data.success) {
                // 💥 核心修复 1：强力阻断式提示，解决用户干等的问题！
                alert("✉️ 验证码已发送！\n\n⚠️ 重要提示：由于是系统自动发信，邮件极大概率会被误判进【垃圾邮件(Spam / Junk)】文件夹，请务必前往垃圾箱查看！");
                showToast("请前往垃圾箱(Spam)查找验证码！", "success");

                let countdown = 60;
                const timer = setInterval(() => {
                    countdown--;
                    safeDOM.execute('btnSendCode', btn => {
                        btn.innerText = `${countdown}s 后重试`;
                        if (countdown <= 0) {
                            clearInterval(timer);
                            btn.innerText = '获取验证码';
                            btn.disabled = false;
                        }
                    });
                }, 1000);
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            showToast("发送失败: " + e.message, "error");
            safeDOM.execute('btnSendCode', btn => { btn.innerText = '获取验证码'; btn.disabled = false; });
        }
    },

    // 🌟 验证验证码 (新增 VIP 视觉蜕变引擎)
    async verifyCode() {
        const email = safeDOM.getValue('hebaoAuthEmail').trim();
        const code = safeDOM.getValue('hebaoAuthCode').trim();
        if (!email || !code) return showToast("请填写邮箱和验证码", "warning");

        safeDOM.execute('btnLogin', btn => { btn.innerText = '验证中...'; btn.disabled = true; });

        try {
            const res = await fetch('/api/verify-auth-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, userId: userUUID })
            });
            const data = await res.json();
            
           if (data.success) {
                localStorage.setItem('hebao_token', data.token);
                isLoggedIn = true;
                localStorage.setItem('hebao_logged_in', 'true');
                
                // 统一社区称呼
                if (!localStorage.getItem('hp_name')) {
                    localStorage.setItem('hp_name', '荷包蛋_' + Math.floor(Math.random() * 1000));
                }

                const domain = email.split('@')[1] || '';
                const isEdu = domain.includes('.edu') || domain.includes('tudelft.nl') || domain.includes('uva.nl') || domain.includes('eur.nl') || domain.includes('leidenuniv.nl');

                localStorage.setItem('hp_email_verified', 'true');
                localStorage.setItem('hp_is_edu', isEdu ? 'true' : 'false');
                localStorage.setItem('hp_email', email);
                
                // 💥 核心修复：关掉旧的硬编码特效，直接依赖我们强大的全局引擎！
                safeDOM.execute('loginModal', el => el.style.display = 'none');
                
                // 弹窗提示
                showToast(isEdu ? "🎊 认证成功！专属校友勋章已点亮！" : "✅ 验证成功！已为您点亮【实名认证】勋章。", "success");
                
                // 🚀 让百变厂牌引擎接管页面渲染！
                if (window.App && window.App.renderProfileState) {
                    window.App.renderProfileState();
                }
                
                if (currentPendingAction) { currentPendingAction(); currentPendingAction = null; }
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            showToast("❌ 验证失败: " + e.message, "error");
        } finally {
            safeDOM.execute('btnLogin', btn => { btn.innerText = '立即验证'; btn.disabled = false; });
        }
    },

    // 获取请求头 (供其他 API 调用)
    getAuthHeaders() {
        const token = localStorage.getItem('hebao_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }
};
