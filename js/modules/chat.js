// ============================================================================
// js/modules/chat.js - 私信聊天引擎 (小红书级 UI + 用户自定义头像支持)
// ============================================================================
import { showToast } from '../core/toast.js';
import { safeDOM } from '../core/dom.js';
import { ModalManager } from '../components/modals.js';

let currentChatPartnerId = null; 
let currentChatPostId = null; 
let currentChatPartnerAvatar = '😎'; // 暂存对方头像
let chatPollingInterval = null;    
let globalPollingInterval = null;  
let lastMessageCount = 0; 
let latestConversationTime = null; 

export const ChatEngine = {
    // ------------------------------------------------------------------------
    // 🌟 1. 全局雷达启动器
    // ------------------------------------------------------------------------
    startGlobalPolling() {
        if (globalPollingInterval) return; 
        const uid = window.userUUID || localStorage.getItem('hebao_uuid');
        if (!uid) return;

        this.loadConversations(true);
        globalPollingInterval = setInterval(() => { this.loadConversations(true); }, 5000);
    },

    // ------------------------------------------------------------------------
    // 🌟 2. UGC 头像处理引擎 (极速压缩 + 本地化存储)
    // ------------------------------------------------------------------------
    async uploadCustomAvatar(event) {
        const file = event.target.files[0];
        if (!file) return;

        showToast("正在生成高清头像...", "info");

        try {
            // 利用 Canvas 极速压缩到 200px (极其轻量，不会塞爆 LocalStorage)
            const compressedAvatar = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (e) => {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const size = 200;
                        canvas.width = size; canvas.height = size;
                        const ctx = canvas.getContext('2d');
                        // 居中裁剪
                        const minDim = Math.min(img.width, img.height);
                        const startX = (img.width - minDim) / 2;
                        const startY = (img.height - minDim) / 2;
                        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
                        resolve(canvas.toDataURL('image/jpeg', 0.8));
                    };
                    img.onerror = error => reject(error);
                };
                reader.onerror = error => reject(error);
            });
            
            localStorage.setItem('hp_real_avatar', compressedAvatar);
            this.renderGlobalAvatar(); // 立刻更新全站 UI
            showToast("🎉 头像更新成功，太好看啦！", "success");
        } catch (error) {
            showToast("头像更新失败，请重试", "error");
        } finally {
            event.target.value = '';
        }
    },

    // 🌟 全局头像刷新器
    renderGlobalAvatar() {
        const realAvatarData = localStorage.getItem('hp_real_avatar');
        if (realAvatarData) {
            safeDOM.execute('profileEmojiAvatar', el => el.style.display = 'none');
            safeDOM.execute('profileRealAvatar', el => { el.src = realAvatarData; el.style.display = 'block'; });
        } else {
            safeDOM.execute('profileEmojiAvatar', el => el.style.display = 'flex');
            safeDOM.execute('profileRealAvatar', el => el.style.display = 'none');
        }
    },

    // ------------------------------------------------------------------------
    // 3. 获取消息列表
    // ------------------------------------------------------------------------
    async loadConversations(isSilent = false) {
        const uid = window.userUUID || localStorage.getItem('hebao_uuid');
        if (!uid) {
            if (!isSilent) safeDOM.execute('conversationList', el => el.innerHTML = '<div style="text-align:center; padding: 40px; color:#9CA3AF;">请先登录查看消息</div>');
            return;
        }

        if (!isSilent) safeDOM.execute('conversationList', el => el.innerHTML = '<div style="text-align:center; padding: 40px; color:#9CA3AF; font-size: 13px;">📡 正在同步消息队列...</div>');

        try {
            const res = await fetch(`/api/get-conversations?userId=${uid}`);
            const data = await res.json();
            if (!data.success) {
                if(!isSilent) safeDOM.execute('conversationList', el => el.innerHTML = `<div style="text-align:center; padding: 40px; color:#EF4444;">${data.error}</div>`);
                return;
            }

            const conversations = data.conversations || [];
            
            if (conversations.length > 0) {
                const topConvTime = conversations[0].last_time;
                if (latestConversationTime !== null && topConvTime !== latestConversationTime) {
                    if (currentChatPartnerId !== conversations[0].partner_id) {
                        showToast("📩 您收到了一条新私信，快去看看吧！", "info");
                    }
                }
                latestConversationTime = topConvTime;
            }

            safeDOM.execute('conversationList', list => {
                if (conversations.length === 0) {
                    list.innerHTML = '';
                    safeDOM.execute('msgEmptyState', el => el.style.display = 'flex');
                    return;
                }

                safeDOM.execute('msgEmptyState', el => el.style.display = 'none');
                let html = '';
                
                conversations.forEach(conv => {
                    const date = new Date(conv.last_time + 'Z');
                    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                    const partnerEmail = conv.partner_email || '';
                    const partnerCredit = conv.partner_credit !== undefined ? conv.partner_credit : 100;
                    const partnerName = conv.partner_name || `校友_${conv.partner_id.substring(0, 4)}`;
                    const partnerAvatar = conv.partner_avatar || '😎';

                    // 渲染对方真实头像或 Emoji
                    const avatarHtml = partnerAvatar.length > 10 // 如果长度大于10，说明是Base64真实图片
                        ? `<img src="${partnerAvatar}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; margin-right: 12px; border: 1px solid #F1F5F9;">`
                        : `<div style="font-size:26px; margin-right:12px; background: #F3F4F6; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">${partnerAvatar}</div>`;

                    html += `
                    <div style="display:flex; align-items:center; background:#FFF; padding:15px; border-radius: 16px; margin-bottom: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.02); border: 1px solid #E5E7EB; cursor:pointer;" 
                         onclick="window.App.openChat('${conv.partner_id}', '${partnerName}', '${partnerAvatar}', null, null, null, null, null, '${partnerEmail}', ${partnerCredit})">
                        ${avatarHtml}
                        <div style="flex:1; overflow:hidden;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:6px; align-items: center;">
                                <div style="display:flex; align-items:center;">
                                    <span style="font-weight:900; font-size:15px; color:#111827;">${partnerName}</span>
                                </div>
                                <span style="font-size:11px; color:#9CA3AF; margin-left:6px; flex-shrink:0;">${timeStr}</span>
                            </div>
                            <div style="font-size:13px; color:#6B7280; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${conv.last_message}</div>
                        </div>
                    </div>`;
                });
                list.innerHTML = html;
            });
        } catch(e) { console.error("🚨 拉取会话失败:", e); }
    },

    openChat(targetId, targetName, targetAvatar, postId, postTitle, postPrice, postImg, isSold, targetEmail, targetCredit) {
        if(window.App && typeof window.App.requireAuth === 'function') {
            window.App.requireAuth(() => this._initChatWindow(targetId, targetName, targetAvatar, postId, postTitle, postPrice, postImg, isSold, targetEmail, targetCredit));
        } else {
            this._initChatWindow(targetId, targetName, targetAvatar, postId, postTitle, postPrice, postImg, isSold, targetEmail, targetCredit);
        }
    },

    _initChatWindow(targetId, targetName, targetAvatar, postId, postTitle, postPrice, postImg, isSold, targetEmail, targetCredit) {
        const uid = window.userUUID || localStorage.getItem('hebao_uuid');
        if (targetId === String(uid)) return showToast("不能跟自己聊天哦~", "warning");

        currentChatPartnerId = targetId;
        currentChatPostId = postId;
        currentChatPartnerAvatar = targetAvatar || '😎'; // 全局暂存对方头像
        lastMessageCount = 0;

        ModalManager.injectIfNeeded('chatModal');

        safeDOM.execute('chatPartnerName', el => el.innerText = targetName || '校友');
        
        safeDOM.execute('chatPostCard', card => {
            if (postId) {
                card.style.display = 'flex';
                safeDOM.execute('chatPostImg', img => { img.src = postImg || ''; img.style.display = postImg ? 'block' : 'none'; });
                safeDOM.execute('chatPostTitle', title => title.innerText = postTitle || '闲置好物');
                safeDOM.execute('chatPostPrice', price => price.innerText = postPrice ? `€${postPrice}` : '');
            } else {
                card.style.display = 'none';
            }
        });

        safeDOM.execute('chatInput', el => el.value = '');
        safeDOM.execute('chatMsgList', el => el.innerHTML = '');

        ModalManager.open('chatModal');
        this.loadChatHistory();

        if (chatPollingInterval) clearInterval(chatPollingInterval);
        chatPollingInterval = setInterval(() => { this.loadChatHistory(true); }, 3000);
    },

    closeChat() {
        if (chatPollingInterval) { clearInterval(chatPollingInterval); chatPollingInterval = null; }
        currentChatPartnerId = null;
        safeDOM.execute('chatModal', el => el.style.display = 'none');
        this.loadConversations(true); 
    },

    // ------------------------------------------------------------------------
    // 🌟 4. 小红书气泡渲染引擎
    // ------------------------------------------------------------------------
    async loadChatHistory(isPolling = false) {
        if (!currentChatPartnerId) return;
        const uid = window.userUUID || localStorage.getItem('hebao_uuid');
        
        // 抓取我的真实头像
        const myAvatar = localStorage.getItem('hp_real_avatar') || '😎';

        try {
            const res = await fetch(`/api/get-messages?userId1=${uid}&userId2=${currentChatPartnerId}`);
            if (!res.ok) throw new Error("拉取请求失败");
            
            const data = await res.json();
            if (data.success) {
                const messages = data.messages || [];
                if (isPolling && messages.length === lastMessageCount) return;
                lastMessageCount = messages.length;

                safeDOM.execute('chatMsgList', list => {
                    if (messages.length === 0) {
                        list.innerHTML = `<div style="text-align:center; padding: 40px; color:#9CA3AF; font-size: 12px;">你们还没有聊过天，发句“哈喽”破个冰吧！🧊</div>`;
                        return;
                    }

                    let html = '';
                    messages.forEach(msg => {
                        const isMe = String(msg.sender_id) === String(uid);
                        const date = new Date(msg.created_at + 'Z');
                        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                        
                        // 🌟 动态生成对方和我的头像 HTML
                        const themAvatarHtml = currentChatPartnerAvatar.length > 10 
                            ? `<img src="${currentChatPartnerAvatar}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; flex-shrink:0; border:1px solid #E2E8F0;">`
                            : `<div style="font-size:20px; width:36px; height:36px; border-radius:50%; background:#F1F5F9; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${currentChatPartnerAvatar}</div>`;
                            
                        const myAvatarHtml = myAvatar.length > 10 
                            ? `<img src="${myAvatar}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; flex-shrink:0; border:1px solid #E2E8F0;">`
                            : `<div style="font-size:20px; width:36px; height:36px; border-radius:50%; background:#F1F5F9; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${myAvatar}</div>`;

                        if (isMe) {
                            html += `
                            <div style="display:flex; justify-content:flex-end; align-items:flex-start; gap:8px;">
                                <div style="display:flex; flex-direction:column; align-items:flex-end; max-width:75%;">
                                    <div style="background:#2563EB; color:#FFF; padding:12px 16px; border-radius:20px 4px 20px 20px; font-size:15px; line-height:1.5; word-break:break-all; box-shadow:0 4px 12px rgba(37,99,235,0.15);">${msg.content}</div>
                                    <div style="font-size:11px; color:#9CA3AF; margin-top:4px;">${timeStr}</div>
                                </div>
                                ${myAvatarHtml}
                            </div>`;
                        } else {
                            html += `
                            <div style="display:flex; justify-content:flex-start; align-items:flex-start; gap:8px;">
                                ${themAvatarHtml}
                                <div style="display:flex; flex-direction:column; align-items:flex-start; max-width:75%;">
                                    <div style="background:#FFF; color:#111827; padding:12px 16px; border-radius:4px 20px 20px 20px; font-size:15px; line-height:1.5; word-break:break-all; box-shadow:0 2px 10px rgba(0,0,0,0.03); border:1px solid #F1F5F9;">${msg.content}</div>
                                    <div style="font-size:11px; color:#9CA3AF; margin-top:4px;">${timeStr}</div>
                                </div>
                            </div>`;
                        }
                    });
                    
                    list.innerHTML = html;
                    list.scrollTop = list.scrollHeight; 
                });
            }
        } catch (error) { console.error("🚨 拉取消息失败:", error); }
    },

    // ------------------------------------------------------------------------
    // 5. 发送消息
    // ------------------------------------------------------------------------
    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        if (!input) return;
        
        const text = input.value.trim();
        if (!text) return;
        
        const uid = window.userUUID || localStorage.getItem('hebao_uuid');
        if (!uid || !currentChatPartnerId) return;

        // 小红书乐观更新
        const myAvatar = localStorage.getItem('hp_real_avatar') || '😎';
        const myAvatarHtml = myAvatar.length > 10 
            ? `<img src="${myAvatar}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; flex-shrink:0; border:1px solid #E2E8F0;">`
            : `<div style="font-size:20px; width:36px; height:36px; border-radius:50%; background:#F1F5F9; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${myAvatar}</div>`;

        safeDOM.execute('chatMsgList', list => {
            if (lastMessageCount === 0) list.innerHTML = '';
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            list.insertAdjacentHTML('beforeend', `
                <div style="display:flex; justify-content:flex-end; align-items:flex-start; gap:8px; opacity:0.6;">
                    <div style="display:flex; flex-direction:column; align-items:flex-end; max-width:75%;">
                        <div style="background:#2563EB; color:#FFF; padding:12px 16px; border-radius:20px 4px 20px 20px; font-size:15px; line-height:1.5; word-break:break-all; box-shadow:0 4px 12px rgba(37,99,235,0.15);">${text}</div>
                        <div style="font-size:11px; color:#9CA3AF; margin-top:4px;">${timeStr}</div>
                    </div>
                    ${myAvatarHtml}
                </div>
            `);
            list.scrollTop = list.scrollHeight;
        });
        
        input.value = '';
        lastMessageCount++;

        try {
            const headers = window.App && window.App.getAuthHeaders ? window.App.getAuthHeaders() : { 'Content-Type': 'application/json' };
            const res = await fetch('/api/send-message', { 
                method: 'POST', 
                headers: headers, 
                body: JSON.stringify({ senderId: uid, receiverId: currentChatPartnerId, postId: currentChatPostId, content: text }) 
            });
            if (!res.ok) throw new Error("接口返回报错");
            this.loadChatHistory();
        } catch(e) { 
            console.error("🚨 消息发送失败:", e);
            showToast("发送失败，请检查网络", "error"); 
        }
    },

    sendQuickMessage(text) {
        safeDOM.execute('chatInput', el => { el.value = text; this.sendChatMessage(); });
    }
};

// 🌟 挂载与全局头像初始化
if (typeof window !== 'undefined') {
    window.App = window.App || {};
    Object.keys(ChatEngine).forEach(key => {
        if (typeof ChatEngine[key] === 'function') {
            window.App[key] = ChatEngine[key].bind(ChatEngine);
        }
    });

    // App 启动时，自动渲染本地保存的真实头像！
    document.addEventListener('DOMContentLoaded', () => {
        window.App.renderGlobalAvatar();
    });
}
