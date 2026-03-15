// ============================================================================
// js/modules/chat.js - 私信聊天引擎 (心跳轮询 + 乐观更新版)
// ============================================================================
import { showToast } from '../core/toast.js';
import { safeDOM } from '../core/dom.js';
import { ModalManager } from '../components/modals.js';

let currentChatPartnerId = null; 
let currentChatPostId = null; 
let chatPollingInterval = null;
let lastMessageCount = 0; // 记录上次的消息数量，防止重绘闪烁

export const ChatEngine = {
    // ------------------------------------------------------------------------
    // 1. 安全唤起聊天室
    // ------------------------------------------------------------------------
    openChat(targetId, targetName, targetAvatar, postId, postTitle, postPrice, postImg, isSold, postType = 'idle') {
        try {
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
        const uid = window.userUUID || localStorage.getItem('hebao_uuid');
        if (targetId === String(uid)) {
            return showToast("💡 管家提示：这是你自己的帖子哦，不能跟自己聊天~", "warning");
        }

        currentChatPartnerId = targetId;
        currentChatPostId = postId;
        lastMessageCount = 0;

        // 注入聊天弹窗
        ModalManager.injectIfNeeded('chatModal');

        // 更新头部信息
        safeDOM.execute('chatPartnerName', el => el.innerText = targetName || '校友');
        
        // 渲染正在交易的商品卡片
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

        // 初始化加载状态
        safeDOM.execute('chatInput', el => el.value = '');
        safeDOM.execute('chatMsgList', el => el.innerHTML = '<div style="text-align:center; padding: 40px; color:#9CA3AF; font-size: 13px;">📡 正在拉取历史消息...</div>');

        // 打开弹窗
        ModalManager.open('chatModal');

        // 立即拉取一次真实数据
        this.loadChatHistory();

        // 🚀 开启心跳轮询！(每 3 秒找服务器要一次新消息)
        if (chatPollingInterval) clearInterval(chatPollingInterval);
        chatPollingInterval = setInterval(() => {
            this.loadChatHistory(true);
        }, 3000);
    },

    // ------------------------------------------------------------------------
    // 2. 关闭聊天室并销毁心跳
    // ------------------------------------------------------------------------
    closeChat() {
        if (chatPollingInterval) {
            clearInterval(chatPollingInterval);
            chatPollingInterval = null;
            console.log("🛑 聊天心跳已断开，节省性能");
        }
        currentChatPartnerId = null;
        safeDOM.execute('chatModal', el => el.style.display = 'none');
    },

    // ------------------------------------------------------------------------
    // 3. 拉取历史消息
    // ------------------------------------------------------------------------
    async loadChatHistory(isPolling = false) {
        if (!currentChatPartnerId) return;
        const uid = window.userUUID || localStorage.getItem('hebao_uuid');

        try {
            const res = await fetch(`/api/get-messages?userId1=${uid}&userId2=${currentChatPartnerId}`);
            if (!res.ok) throw new Error("拉取请求失败");
            
            const data = await res.json();
            if (data.success) {
                const messages = data.messages || [];
                
                // 如果是后台轮询，且消息数量没变，直接 return 避免屏幕闪烁
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
                        // 处理时区时间显示
                        const date = new Date(msg.created_at + 'Z');
                        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                        
                        if (isMe) {
                            html += `<div class="chat-row me" style="display:flex; justify-content:flex-end; margin-bottom: 15px;">
                                <div style="font-size: 10px; color: #9CA3AF; margin-right: 8px; margin-top: auto;">${timeStr}</div>
                                <div style="background: #111827; color: #FFF; padding: 10px 14px; border-radius: 16px 16px 4px 16px; font-size: 14px; max-width: 70%; word-break: break-all;">${msg.content}</div>
                                <div style="font-size:24px; margin-left:8px;">😎</div>
                            </div>`;
                        } else {
                            html += `<div class="chat-row them" style="display:flex; justify-content:flex-start; margin-bottom: 15px;">
                                <div style="font-size:24px; margin-right:8px;">🤖</div>
                                <div style="background: #F3F4F6; color: #111827; padding: 10px 14px; border-radius: 16px 16px 16px 4px; font-size: 14px; max-width: 70%; word-break: break-all;">${msg.content}</div>
                                <div style="font-size: 10px; color: #9CA3AF; margin-left: 8px; margin-top: auto;">${timeStr}</div>
                            </div>`;
                        }
                    });
                    
                    list.innerHTML = html;
                    list.scrollTop = list.scrollHeight; // 滚动到最底部
                });
            }
        } catch (error) {
            console.error("🚨 拉取消息失败:", error);
        }
    },

    // ------------------------------------------------------------------------
    // 4. 发送消息 (乐观更新策略)
    // ------------------------------------------------------------------------
    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        if (!input) return;
        
        const text = input.value.trim();
        if (!text) return;
        
        const uid = window.userUUID || localStorage.getItem('hebao_uuid');
        if (!uid || !currentChatPartnerId) return;

        // 🌟 1. 乐观更新：自己发的消息瞬间上屏，不等服务器！(给用户极速的体验)
        safeDOM.execute('chatMsgList', list => {
            if (lastMessageCount === 0) list.innerHTML = ''; // 清空空提示
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            list.insertAdjacentHTML('beforeend', `
                <div class="chat-row me" style="display:flex; justify-content:flex-end; margin-bottom: 15px; opacity: 0.6; transition: opacity 0.3s;">
                    <div style="font-size: 10px; color: #9CA3AF; margin-right: 8px; margin-top: auto;">${timeStr}</div>
                    <div style="background: #111827; color: #FFF; padding: 10px 14px; border-radius: 16px 16px 4px 16px; font-size: 14px; max-width: 70%; word-break: break-all;">${text}</div>
                    <div style="font-size:24px; margin-left:8px;">😎</div>
                </div>
            `);
            list.scrollTop = list.scrollHeight;
        });
        
        input.value = '';
        lastMessageCount++; // 手动模拟增加，防止轮询马上把它刷掉

        // 🌟 2. 异步将消息发射给服务器
        try {
            const headers = window.App && window.App.getAuthHeaders ? window.App.getAuthHeaders() : { 'Content-Type': 'application/json' };
            
            const res = await fetch('/api/send-message', { 
                method: 'POST', 
                headers: headers, 
                body: JSON.stringify({ 
                    senderId: uid, 
                    receiverId: currentChatPartnerId, 
                    postId: currentChatPostId, 
                    content: text 
                }) 
            });
            
            if (!res.ok) throw new Error("接口返回报错");
            
            // 发送成功后立刻向服务器拉取一次真实记录，替换掉刚才半透明的“假消息”
            this.loadChatHistory();
            
        } catch(e) { 
            console.error("🚨 消息发送失败:", e);
            showToast("发送失败，请检查网络", "error"); 
        }
    },

    sendQuickMessage(text) {
        safeDOM.execute('chatInput', el => {
            el.value = text;
            this.sendChatMessage();
        });
    }
};
