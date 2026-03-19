// ============================================================================
// js/modules/chat.js - 私信聊天引擎 (带全局雷达轮询 + 新消息提醒)
// ============================================================================
import { showToast } from '../core/toast.js';
import { safeDOM } from '../core/dom.js';
import { ModalManager } from '../components/modals.js';

let currentChatPartnerId = null; 
let currentChatPostId = null; 
let chatPollingInterval = null;    // 聊天室内的心跳
let globalPollingInterval = null;  // 全局的后台心跳（雷达）
let lastMessageCount = 0; 
let latestConversationTime = null; // 记录最新一条消息的时间，用来触发红点/弹窗

export const ChatEngine = {
    // ------------------------------------------------------------------------
    // 🌟 新增：全局雷达启动器 (在 main.js 登录后调用)
    // ------------------------------------------------------------------------
    startGlobalPolling() {
        if (globalPollingInterval) return; // 防止重复启动
        const uid = window.userUUID || localStorage.getItem('hebao_uuid');
        if (!uid) return;

        console.log("📡 聊天全局雷达已启动...");
        // 刚启动时静默拉取一次
        this.loadConversations(true);

        // 每 5 秒静默拉取一次消息列表
        globalPollingInterval = setInterval(() => {
            this.loadConversations(true);
        }, 5000);
    },

    // ------------------------------------------------------------------------
    // 1. 获取消息列表 (支持静默拉取)
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
            
            // 💡 核心逻辑：检测是否有“新消息”到达！
            if (conversations.length > 0) {
                const topConvTime = conversations[0].last_time;
                if (latestConversationTime !== null && topConvTime !== latestConversationTime) {
                    // 时间戳变了，说明有新消息！(且发送人不是自己)
                    // 如果你正打开着那个人的聊天框，就不弹通知了，避免打扰
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
                    const shortId = conv.partner_id.substring(0, 4); 
                    
                    // 🌟 模拟大厂/名校邮箱与高信用分
                    const mockEmail = (Math.random() > 0.5 ? 'hr@asml.com' : 'alumni@eur.nl');
                    const mockCredit = Math.floor(Math.random() * 10 + 90);

                    html += `
                    <div style="display:flex; align-items:center; background:#FFF; padding:15px; border-radius: 16px; margin-bottom: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.02); border: 1px solid #E5E7EB; cursor:pointer; transition: transform 0.1s;" 
                         onclick="window.App.openChat('${conv.partner_id}', '校友_${shortId}', '😎')">
                        <div style="font-size:40px; margin-right:12px; background: #F3F4F6; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">😎</div>
                        <div style="flex:1; overflow:hidden;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:6px; align-items: center;">
                                <div style="display:flex; align-items:center;">
                                    <span style="font-weight:900; font-size:15px; color:#111827;">校友_${shortId}</span>
                                    ${window.App.getUserBadgeHtml ? window.App.getUserBadgeHtml(mockEmail, mockCredit) : ''}
                                </div>
                                <span style="font-size:11px; color:#9CA3AF; margin-left:6px; flex-shrink:0;">${timeStr}</span>
                            </div>
                            <div style="font-size:13px; color:#6B7280; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${conv.last_message}</div>
                        </div>
                    </div>`;
                });
                    list.innerHTML = html;
            });
        } catch(e) {
            console.error("🚨 拉取会话列表失败:", e);
        }
    },

    // ------------------------------------------------------------------------
    // 2. 安全唤起聊天室
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
        if (targetId === String(uid)) return showToast("💡 管家提示：这是你自己的帖子哦，不能跟自己聊天~", "warning");

        currentChatPartnerId = targetId;
        currentChatPostId = postId;
        lastMessageCount = 0;

        ModalManager.injectIfNeeded('chatModal');

        safeDOM.execute('chatPartnerName', el => {
            // 用传入的 targetId 生成固定的假邮箱（后期接后端传真实email）
            const isAsml = targetId.charCodeAt(0) % 2 === 0;
            const mockEmail = isAsml ? 'tech@asml.com' : 'student@tudelft.nl';
            const mockCredit = 98;
            
            el.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
                    <span>${targetName || '校友'}</span>
                    ${window.App.getUserBadgeHtml ? window.App.getUserBadgeHtml(mockEmail, mockCredit) : ''}
                </div>
            `;
        });
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
        safeDOM.execute('chatMsgList', el => el.innerHTML = '<div style="text-align:center; padding: 40px; color:#9CA3AF; font-size: 13px;">📡 正在拉取历史消息...</div>');

        ModalManager.open('chatModal');

        this.loadChatHistory();

        if (chatPollingInterval) clearInterval(chatPollingInterval);
        chatPollingInterval = setInterval(() => { this.loadChatHistory(true); }, 3000);
    },

    // ------------------------------------------------------------------------
    // 3. 关闭聊天室并销毁心跳
    // ------------------------------------------------------------------------
    closeChat() {
        if (chatPollingInterval) {
            clearInterval(chatPollingInterval);
            chatPollingInterval = null;
        }
        currentChatPartnerId = null;
        safeDOM.execute('chatModal', el => el.style.display = 'none');
        // 关掉聊天框后，立刻静默刷新一次外面的消息列表
        this.loadConversations(true); 
    },

    // ------------------------------------------------------------------------
    // 4. 拉取历史消息
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
                    list.scrollTop = list.scrollHeight; 
                });
            }
        } catch (error) {
            console.error("🚨 拉取消息失败:", error);
        }
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

        // 乐观更新
        safeDOM.execute('chatMsgList', list => {
            if (lastMessageCount === 0) list.innerHTML = '';
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
