// ============================================================================
// js/modules/chat.js - 私信聊天引擎 (极度防御版)
// ============================================================================
import { showToast } from '../core/toast.js';

let currentChatPartnerId = null; 
let currentChatPostId = null; 
let chatPollingInterval = null;

export const ChatEngine = {
    // ------------------------------------------------------------------------
    // 1. 安全唤起聊天室
    // ------------------------------------------------------------------------
    openChat(targetId, targetName, targetAvatar, postId, postTitle, postPrice, postImg, isSold, postType = 'idle') {
        try {
            // 假设 requireAuth 已绑定在全局
            if(window.App && typeof window.App.requireAuth === 'function') {
                window.App.requireAuth(() => this._initChatWindow(targetId, targetName, targetAvatar, postId, postTitle, postPrice, postImg, isSold));
            } else {
                this._initChatWindow(targetId, targetName, targetAvatar, postId, postTitle, postPrice, postImg, isSold);
            }
        } catch (error) {
            console.error("🚨 [Chat] 聊天室唤起失败:", error);
            showToast("通讯模块加载异常", "error");
        }
    },

    _initChatWindow(targetId, targetName, targetAvatar, postId, postTitle, postPrice, postImg, isSold) {
        const uid = window.userUUID || localStorage.getItem('hp_uid');
        if (targetId === uid) {
            return showToast("💡 管家提示：不能给自己发私信哦！");
        }
        
        currentChatPartnerId = targetId; 
        currentChatPostId = postId;
        
        const modal = document.getElementById('chatModal'); 
        if (!modal) return showToast("聊天窗口丢失", "error");
        
        modal.style.display = 'flex'; 

        // 安全填充 UI
        const safeSetText = (id, text) => { const el = document.getElementById(id); if(el) el.innerText = text; };
        
        safeSetText('chatTargetName', targetName || '联系卖家');
        safeSetText('chatTargetAvatar', targetAvatar || '😎');
        safeSetText('chatProductTitle', postTitle || '商品信息');
        safeSetText('chatProductPrice', '€' + (postPrice || '0.00'));

        const imgEl = document.getElementById('chatProductImg');
        if (imgEl) {
            if (postImg && (postImg.startsWith('http') || postImg.startsWith('data:image'))) { 
                imgEl.src = postImg; 
            } else { 
                imgEl.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23F3F4F6'/><text x='50%' y='50%' font-size='12' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'>暂无</text></svg>"; 
            }
        }

        // 商品已售出的状态切换防御
        const toggleDisplay = (id, display) => { const el = document.getElementById(id); if(el) el.style.display = display; };
        
        if (isSold) {
            toggleDisplay('cpsActionBtn', 'none'); 
            toggleDisplay('cpsSoldStamp', 'block'); 
            toggleDisplay('chatInputDisabled', 'block'); 
            toggleDisplay('chatInputBar', 'none'); 
            toggleDisplay('chatQuickReplies', 'none');
        } else {
            toggleDisplay('cpsActionBtn', 'block'); 
            toggleDisplay('cpsSoldStamp', 'none'); 
            toggleDisplay('chatInputDisabled', 'none'); 
            toggleDisplay('chatInputBar', 'flex'); 
            toggleDisplay('chatQuickReplies', 'flex');
        }

        const msgList = document.getElementById('chatMsgList'); 
        if(msgList) msgList.innerHTML = '<div style="text-align:center; color:#9CA3AF; font-size:12px; margin-top:20px;">加载历史消息中...</div>';
        
        this.loadChatHistory(); 
        if(chatPollingInterval) clearInterval(chatPollingInterval); 
        chatPollingInterval = setInterval(() => this.loadChatHistory(), 3000);
    },

    closeChat() { 
        try {
            const modal = document.getElementById('chatModal');
            if(modal) modal.style.display = 'none'; 
            if(chatPollingInterval) clearInterval(chatPollingInterval); 
        } catch(e) {}
    },

    // ------------------------------------------------------------------------
    // 2. 消息收发核心逻辑
    // ------------------------------------------------------------------------
    async sendChatMessage() {
        try {
            const input = document.getElementById('chatInput'); 
            if(!input) return;
            const text = input.value.trim(); 
            if(!text) return;
            
            const msgList = document.getElementById('chatMsgList'); 
            const savedAvatar = localStorage.getItem('hebao_avatar') || ''; 
            const avatarHtml = savedAvatar ? `<img src="${savedAvatar}">` : `<span>😎</span>`;
            
            // 乐观更新 UI
            if(msgList) {
                msgList.insertAdjacentHTML('beforeend', `<div class="chat-row me"><div class="chat-text">${text}</div><div class="chat-avatar">${avatarHtml}</div></div>`); 
                input.value = ''; 
                // 安全滚动
                setTimeout(() => { msgList.scrollTop = msgList.scrollHeight; }, 50);
            }

            const uid = window.userUUID || localStorage.getItem('hp_uid');
            const headers = window.App && window.App.getAuthHeaders ? window.App.getAuthHeaders() : { 'Content-Type': 'application/json' };
            
            await fetch('/api/send-message', { 
                method: 'POST', 
                headers: headers, 
                body: JSON.stringify({ senderId: uid, receiverId: currentChatPartnerId, postId: currentChatPostId, content: text }) 
            }); 
        } catch(e) { 
            console.error("🚨 消息发送失败:", e);
            showToast("消息发送失败，请重试", "warning"); 
        }
    },

    sendQuickMessage(text) {
        try {
            const input = document.getElementById('chatInput');
            if (input) {
                input.value = text;
                this.sendChatMessage();
            }
        } catch(e) {}
    },

    // ... loadChatHistory 轮询逻辑同理加壳 ...
};
