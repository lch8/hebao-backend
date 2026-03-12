// auth.js - 用户身份、登录注册与权限校验

// 初始化设备 UUID
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

function requireAuth(actionFunction) { 
    if (!isLoggedIn) { 
        currentPendingAction = actionFunction; 
        document.getElementById('loginModal').style.display = 'flex'; 
    } else { 
        actionFunction(); 
    } 
}

// 🌟 修复后的发送验证码 (清理了冲突的冗余代码，并统一使用 hebaoAuthEmail)
async function sendAuthCode() {
    const emailInputEl = document.getElementById('hebaoAuthEmail');
    const email = emailInputEl ? emailInputEl.value.trim().toLowerCase() : '';
    const btn = document.getElementById('btnSendCode');

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) return alert("⚠️ 请输入正确的邮箱格式！");
    
    btn.disabled = true;
    btn.innerText = "发送中...";
    
    try {
        const res = await apiFetch('/api/send-auth-email', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        
        if (res.ok) {
            alert("✅ 验证码已发出！请检查收件箱（包括垃圾箱）。");
            let timeLeft = 60;
            const timer = setInterval(() => {
                timeLeft--;
                btn.innerText = `${timeLeft}s`;
                if(timeLeft <= 0) { clearInterval(timer); btn.disabled = false; btn.innerText = "获取验证码"; }
            }, 1000);
        } else {
            const errData = await res.json();
            throw new Error(errData.error || "发送失败");
        }
    } catch (e) {
        alert("❌ 发送失败: " + e.message);
        btn.disabled = false;
        btn.innerText = "获取验证码";
    }
}

// 🌟 修复后的校验验证码 (保留了您的校园邮箱判定逻辑)
async function verifyEmailCode() {
    const email = document.getElementById('hebaoAuthEmail').value.trim().toLowerCase();
    const code = document.getElementById('authCode').value.trim();
    const btnLogin = document.getElementById('btnVerifyLogin');
    
    if(!code || !email) return alert("邮箱和验证码不能为空！");

    btnLogin.innerText = '验证中...';
    btnLogin.disabled = true;

    try {
        const res = await apiFetch('/api/verify-auth-code', {
            method: 'POST',
            body: JSON.stringify({ email, code, userId: userUUID })
        });
        const data = await res.json();
        
        if (data.success) {
            if (data.token) localStorage.setItem('hebao_token', data.token);
            isLoggedIn = true;
            localStorage.setItem('hebao_logged_in', 'true');
            if (!localStorage.getItem('hp_name')) localStorage.setItem('hp_name', '管家新人_' + Math.floor(Math.random() * 1000));

            // 校友判定逻辑
            const domain = email.split('@')[1];
            const isEdu = domain.includes('.edu') || domain.includes('tudelft.nl') || domain.includes('uva.nl') || domain.includes('eur.nl') || domain.includes('leidenuniv.nl');

            localStorage.setItem('hp_email_verified', 'true');
            localStorage.setItem('hp_is_edu', isEdu ? 'true' : 'false');
            localStorage.setItem('hp_email', email);
            
            if (isEdu) {
                alert(`🎊 认证成功！检测到校友身份：${domain.split('.')[0].toUpperCase()}\n专属勋章已点亮！`);
            } else {
                alert("✅ 验证成功！已为您点亮【实名认证】勋章。");
            }

            document.getElementById('loginModal').style.display = 'none';
            renderProfileState(); // 调用 ui.js 中的方法刷新头像和名字
            
            if (currentPendingAction) { currentPendingAction(); currentPendingAction = null; }
        } else {
            throw new Error(data.error);
        }
    } catch (e) {
        alert("❌ 验证失败: " + e.message);
    } finally {
        btnLogin.innerText = '立即验证';
        btnLogin.disabled = false;
    }
}

function handleLogout() {
    if(confirm('确定要退出登录吗？')) {
        isLoggedIn = false;
        localStorage.setItem('hebao_logged_in', 'false');
        renderProfileState();
    }
}
