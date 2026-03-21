// ============================================================================
// js/modules/chat.js - 私信聊天引擎 (带未读消息角标 + 小红书级 UI)
// ============================================================================
import { showToast } from '../core/toast.js';
import { safeDOM } from '../core/dom.js';
import { ModalManager } from '../components/modals.js';

let currentChatPartnerId = null; 
let currentChatPostId = null; 
let currentChatPartnerAvatar = '😎'; 
let chatPollingInterval = null;    
let globalPollingInterval = null;  
let lastMessageCount = 0; 
let latestConversationTime = null; 

export const ChatEngine = {
    // ------------------------------------------------------------------------
    // 1. 全局雷达启动器
    // ------------------------------------------------------------------------
    startGlobalPolling() {
        if (globalPollingInterval) return; 
        const uid = window.userUUID || localStorage.getItem('hebao_uuid');
        if (!uid) return;

        this.loadConversations(true);
        globalPollingInterval = setInterval(() => { this.loadConversations(true); }, 5000);
    },

    // ------------------------------------------------------------------------
    // 🌟 新增：全局未读红点渲染器
    // ------------------------------------------------------------------------
    updateGlobalBadge(count) {
        safeDOM.execute('navMsgBadge', badge => {
            if (count > 0) {
                badge.innerText = count > 99 ? '99+' : count;
                badge.style.display = 'block';
                // 让小红点产生一个“Q弹”的动画效果，吸引注意力
                badge.style.transform = 'scale(1.2)';
                setTimeout(() => badge.style.transform = 'scale(1)', 200);
            } else {
                badge.style.display = 'none';
            }
        });
    },

    // ------------------------------------------------------------------------
    // 2. UGC 头像处理引擎
    // ------------------------------------------------------------------------
    async uploadCustomAvatar(event) {
        const file = event.target.files[0];
        if (!file) return;

        showToast("正在生成高清头像...", "info");

        try {
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
            this.renderGlobalAvatar(); 
            showToast("🎉 头像更新成功，太好看啦！", "success");
        } catch (error) {
            showToast("头像更新失败，请重试", "error");
        } finally {
            event.target.value = '';
        }
    },

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
    // 3. 获取消息列表 (🌟 加入未读状态计算)
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
            
            // 🌟 核心：拉取本地阅读记录
            const readTimestamps = JSON.parse(localStorage.getItem('hp_chat_reads') || '{}');
            let totalUnreadCount = 0;

            if (conversations.length > 0) {
                const topConvTime = conversations[0].last_time;
                if (latestConversationTime !== null && topConvTime !== latestConversationTime) {
                    if (currentChatPartnerId !== conversations[0].partner_id) {
                        showToast("📩 您收到了一条新私信！", "info");
                    }
                }
                latestConversationTime = topConvTime;
            }

            safeDOM.execute('conversationList', list => {
                if (conversations.length === 0) {
                    list.innerHTML = '';
                    safeDOM.execute('msgEmptyState', el => el.style.display = 'flex');
                    this.updateGlobalBadge(0); // 清空角标
                    return;
                }

                safeDOM.execute('msgEmptyState', el => el.style.display = 'none');
                let html = '';
                
                conversations.forEach(conv => {
                    const date = new Date(conv.last_time + 'Z');
                    const msgTimeMs = date.getTime();
                    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                    
                    const partnerEmail = conv.partner_email || '';
                    const partnerCredit = conv.partner_credit !== undefined ? conv.partner_credit : 100;
                    const partnerName = conv.partner_name || `校友_${conv.partner_id.substring(0, 4)}`;
                    const partnerAvatar = conv.partner_avatar || '😎';

                    // 🌟 核心算法：如果这条消息的时间，晚于该用户的本地已读时间，且当前没打开他的聊天框，就是未读！
                    const lastReadTime = readTimestamps[conv.partner_id] || 0;
                    let isUnread = false;
                    if (msgTimeMs > lastReadTime && currentChatPartnerId !== conv.partner_id) {
                        isUnread = true;
                        totalUnreadCount++;
                    }

                    // 如果未读，在列表右侧加个醒目的红点
                    const unreadDotHtml = isUnread ? `<div style="width: 10px; height: 10px; background: #EF4444; border-radius: 50%; box-shadow: 0 0 0 2px #FFF; margin-left: 8px; flex-shrink: 0;"></div>` : '';

                    const avatarHtml = partnerAvatar.length > 10 
                        ? `<img src="${partnerAvatar}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; margin-right: 12px; border: 1px solid #F1F5F9;">`
                        : `<div style="font-size:26px; margin-right:12px; background: #F3F4F6; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">${partnerAvatar}</div>`;

                    html += `
                    <div style="display:flex; align-items:center; background:#FFF; padding:15px; border-radius: 16px; margin-bottom: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.02); border: 1px solid ${isUnread ? '#BFDBFE' : '#E5E7EB'}; cursor:pointer;" 
                         onclick="window.App.openChat('${conv.partner_id}', '${partnerName}', '${partnerAvatar}', null, null, null, null, null, '${partnerEmail}', ${partnerCredit})">
                        ${avatarHtml}
                        <div style="flex:1; overflow:hidden;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:6px; align-items: center;">
                                <div style="display:flex; align-items:center;">
                                    <span style="font-weight:900; font-size:15px; color:#111827;">${partnerName}</span>
                                </div>
                                <div style="display:flex; align-items:center;">
                                    <span style="font-size:11px; color:#9CA3AF; margin-left:6px; flex-shrink:0;">${timeStr}</span>
                                    ${unreadDotHtml}
                                </div>
                            </div>
                            <div style="font-size:13px; color:${isUnread ? '#111827' : '#6B7280'}; font-weight:${isUnread ? '900' : 'normal'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${conv.last_message}</div>
                        </div>
                    </div>`;
                });
                list.innerHTML = html;
                
                // 🌟 更新底部导航栏的总角标
                this.updateGlobalBadge(totalUnreadCount);
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
        currentChatPartnerAvatar = targetAvatar || '😎'; 
        lastMessageCount = 0;

        // 🌟 核心：用户点开聊天框，立刻更新他的“已读时间戳”，清空红点！
        const readTimestamps = JSON.parse(localStorage.getItem('hp_chat_reads') || '{}');
        readTimestamps[targetId] = Date.now();
        localStorage.setItem('hp_chat_reads', JSON.stringify(readTimestamps));
        this.loadConversations(true); // 顺便静默刷新一次外面的列表和底部的总角标

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
    // 4. 小红书气泡渲染引擎
    // ------------------------------------------------------------------------
    async loadChatHistory(isPolling = false) {
        if (!currentChatPartnerId) return;
        const uid = window.userUUID || localStorage.getItem('hebao_uuid');
        const myAvatar = localStorage.getItem('hp_real_avatar') || '😎';

        try {
            const res = await fetch(`/api/get-messages?userId1=${uid}&userId2=${currentChatPartnerId}`);
            if (!res.ok) throw new Error("拉取请求失败");
            
            const data = await res.json();
            if (data.success) {
                const messages = data.messages || [];

                // 🌟 收到新消息时，如果是当前打开的聊天框，自动更新已读时间戳！
                if (messages.length > lastMessageCount && isPolling) {
                    const readTimestamps = JSON.parse(localStorage.getItem('hp_chat_reads') || '{}');
                    readTimestamps[currentChatPartnerId] = Date.now();
                    localStorage.setItem('hp_chat_reads', JSON.stringify(readTimestamps));
                }

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

if (typeof window !== 'undefined') {
    window.App = window.App || {};
    Object.keys(ChatEngine).forEach(key => {
        if (typeof ChatEngine[key] === 'function') {
            window.App[key] = ChatEngine[key].bind(ChatEngine);
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        window.App.renderGlobalAvatar();
    });
}
