// ============================================================================
// js/modules/auth.js - 用户鉴权与登录引擎 (支持多设备同步 + 成交数闭环)
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

    // 🌟 发送验证码 (Spam 垃圾箱强提醒)
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

    // 🌟 验证验证码 (获取后端真实 UUID + 成交数 + 多设备同步)
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
                // 1. 基础状态写入
                isLoggedIn = true;
                localStorage.setItem('hebao_logged_in', 'true');
                localStorage.setItem('hebao_token', data.token);
                localStorage.setItem('hebao_email', email); // 存入完整邮箱，供徽章引擎使用
                
                // 🌟 2. 核心大厂逻辑：用后端返回的真实老 UUID，强行覆盖当前设备的临时 UUID！
                if (data.userId) {
                    localStorage.setItem('hebao_uuid', data.userId);
                    userUUID = data.userId; // 更新内存里的 UUID
                    window.userUUID = data.userId; // 确保全局变量也更新
                }
                
                // 3. 同步后端的成交数
                if (data.deal_count !== undefined) {
                    localStorage.setItem('hebao_deal_count', data.deal_count);
                } else {
                    localStorage.setItem('hebao_deal_count', 0);
                }

                // 给新用户随机发个名字
                if (!localStorage.getItem('hp_name')) {
                    localStorage.setItem('hp_name', '荷包蛋_' + Math.floor(Math.random() * 1000));
                }

                // 4. 邮箱前端脱敏存储 (留作发帖/评论显示用，保护隐私)
                const [namePart, domainPart] = email.split('@');
                let maskedName = '';
                if (namePart && namePart.length <= 2) {
                    maskedName = `${namePart[0]}***`;
                } else if (namePart) {
                    maskedName = `${namePart[0]}***${namePart[namePart.length - 1]}`;
                }
                localStorage.setItem('hp_email', `${maskedName}@${domainPart}`);
                
                // 5. 关掉弹窗，弹出提示
                safeDOM.execute('loginModal', el => el.style.display = 'none');
                showToast(data.isNewUser ? "🎉 注册成功，欢迎来到荷包管家！" : "👋 欢迎回来！您的账号数据已同步。", "success");
                
                // 🚀 6. 立刻呼叫 UI 刷新引擎，徽章瞬间亮起！
                if (window.App && window.App.refreshProfileUI) {
                    window.App.refreshProfileUI();
                } else if (window.App && window.App.renderProfileState) {
                    window.App.renderProfileState(); // 兼容旧版本的备用调用
                }
                
                // 恢复中断的操作 (比如他刚才是点“发布”弹出的登录，现在直接让他继续发布)
                if (currentPendingAction) { 
                    currentPendingAction(); 
                    currentPendingAction = null; 
                }
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

// 挂载到全局
if (typeof window !== 'undefined') {
    window.App = window.App || {};
    window.App.requireAuth = AuthEngine.requireAuth.bind(AuthEngine);
    window.App.getAuthHeaders = AuthEngine.getAuthHeaders.bind(AuthEngine);
}
