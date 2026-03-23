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
                let html = ''; // 原本的代码
                
                // ==========================================
                // 🌟 新增：在消息列表最顶部注入【搭子入队申请】卡片
                // ==========================================
                const mockApps = JSON.parse(localStorage.getItem('hp_mock_applications') || '[]');
                
                // 🚨 修复：只能看到别人发给我的申请！(过滤 hostId === uid)
                let pendingApps = mockApps.filter(app => app.status === 'pending' && String(app.hostId) === String(uid));

                // 🎯 上帝模式测试：为了方便老板你单机测试审批流，
                // 如果你发布了搭子局，且没人申请，系统自动生成一个“熬夜冠军”的虚拟申请供你测试通过！
                if (pendingApps.length === 0) {
                    const myPartnerPosts = (window.allCommunityPostsCache || []).filter(p => String(p.user_id) === String(uid) && p.title.includes('[搭子]'));
                    if (myPartnerPosts.length > 0) {
                        const randomPost = myPartnerPosts[0];
                        pendingApps.push({
                            id: 'test_app_123',
                            postId: randomPost.id,
                            postTitle: randomPost.title.replace('[找搭子] ', '').replace('[搭子] ', ''),
                            hostId: String(uid),
                            applicantId: 'test_fan_001',
                            applicantName: '熬夜冠军',
                            applicantAvatar: '🐼',
                            status: 'pending'
                        });
                    }
                }

                // 将待审批数量加到全局底部的总红点里！
                totalUnreadCount += pendingApps.length;
                
                pendingApps.forEach(app => {
                    html += `
                    <div style="background: #FFF; border-radius: 16px; padding: 16px; border: 1px solid #F1F5F9; box-shadow: 0 4px 15px rgba(0,0,0,0.03); margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 36px; height: 36px; border-radius: 18px; background: #FEF2F2; display: flex; align-items: center; justify-content: center; font-size: 16px;">🔔</div>
                                <div>
                                    <div style="font-size: 14px; font-weight: 900; color: #EF4444;">搭子入队申请</div>
                                    <div style="font-size: 11px; color: #64748B;">待审批</div>
                                </div>
                            </div>
                        </div>
                        <div style="font-size: 13px; color: #475569; line-height: 1.6; margin-bottom: 16px;">
                            <span onclick="if(window.App.SocialEngine) window.App.SocialEngine.openUserProfile('${app.applicantId}')" style="font-weight: 900; color: #3B82F6; cursor: pointer;">@${app.applicantName}</span> 
                            申请加入你的组局 <span style="font-weight: 900; color: #111827;">【${app.postTitle}】</span>。
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="if(window.App.SocialEngine) window.App.SocialEngine.openUserProfile('${app.applicantId}')" style="flex: 1; background: #F8FAFC; color: #475569; border: none; padding: 10px; border-radius: 10px; font-weight: 900; font-size: 13px; cursor: pointer;">👀 看主页</button>
                            <button onclick="window.App.approveApplication(this, '${app.id}', '${app.postId}', '${app.applicantName}')" style="flex: 1.5; background: #10B981; color: #FFF; border: none; padding: 10px; border-radius: 10px; font-weight: 900; font-size: 13px; cursor: pointer; box-shadow: 0 2px 8px rgba(16,185,129,0.2);">✅ 通过申请</button>
                            <button onclick="window.App.rejectApplication(this, '${app.id}')" style="flex: 1; background: #F1F5F9; color: #64748B; border: none; padding: 10px; border-radius: 10px; font-weight: 900; font-size: 13px; cursor: pointer;">婉拒</button>
                        </div>
                    </div>`;
                });

                // 修复空状态判断逻辑
                if (conversations.length === 0 && pendingApps.length === 0) {
                    list.innerHTML = '';
                    safeDOM.execute('msgEmptyState', el => el.style.display = 'flex');
                    this.updateGlobalBadge(0);
                    return;
                }
                safeDOM.execute('msgEmptyState', el => el.style.display = 'none');
                
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
    // 4. 小红书/抖音级 气泡渲染引擎 (水滴非对称圆角 + 重力对齐)
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

                if (messages.length > lastMessageCount && isPolling) {
                    const readTimestamps = JSON.parse(localStorage.getItem('hp_chat_reads') || '{}');
                    readTimestamps[currentChatPartnerId] = Date.now();
                    localStorage.setItem('hp_chat_reads', JSON.stringify(readTimestamps));
                }

                if (isPolling && messages.length === lastMessageCount) return;
                lastMessageCount = messages.length;

                safeDOM.execute('chatMsgList', list => {
                    if (messages.length === 0) {
                        list.innerHTML = `<div style="text-align:center; padding: 60px 20px; color:#94A3B8; font-size: 13px; font-weight: bold;">你们还没有聊过天<br><span style="font-size:24px; display:block; margin-top:10px;">👋</span></div>`;
                        return;
                    }

                    let html = '';
                    messages.forEach(msg => {
                        const isMe = String(msg.sender_id) === String(uid);
                        const date = new Date(msg.created_at + 'Z');
                        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                        
                        const themAvatarHtml = currentChatPartnerAvatar.length > 10 
                            ? `<img src="${currentChatPartnerAvatar}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; flex-shrink:0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #F8FAFC;">`
                            : `<div style="font-size:20px; width:38px; height:38px; border-radius:50%; background:#FFF; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #F1F5F9;">${currentChatPartnerAvatar}</div>`;
                            
                        const myAvatarHtml = myAvatar.length > 10 
                            ? `<img src="${myAvatar}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; flex-shrink:0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #F8FAFC;">`
                            : `<div style="font-size:20px; width:38px; height:38px; border-radius:50%; background:#FFF; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #F1F5F9;">${myAvatar}</div>`;

                        if (isMe) {
                            html += `
                            <div style="display:flex; justify-content:flex-end; align-items:flex-end; gap:10px; margin-bottom: 6px;">
                                <div style="display:flex; flex-direction:column; align-items:flex-end; max-width:72%;">
                                    <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: #FFF; padding: 12px 18px; border-radius: 22px 22px 4px 22px; font-size: 15px; line-height: 1.5; word-break: break-all; box-shadow: 0 4px 15px rgba(37,99,235,0.2); letter-spacing: 0.3px;">${msg.content}</div>
                                    <div style="font-size:11px; color:#94A3B8; margin-top:6px; margin-right:4px; font-weight: 500;">${timeStr}</div>
                                </div>
                                ${myAvatarHtml}
                            </div>`;
                        } else {
                            html += `
                            <div style="display:flex; justify-content:flex-start; align-items:flex-end; gap:10px; margin-bottom: 6px;">
                                ${themAvatarHtml}
                                <div style="display:flex; flex-direction:column; align-items:flex-start; max-width:72%;">
                                    <div style="background: #FFF; color: #111827; padding: 12px 18px; border-radius: 22px 22px 22px 4px; font-size: 15px; line-height: 1.5; word-break: break-all; box-shadow: 0 4px 15px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.02); letter-spacing: 0.3px;">${msg.content}</div>
                                    <div style="font-size:11px; color:#94A3B8; margin-top:6px; margin-left:4px; font-weight: 500;">${timeStr}</div>
                                </div>
                            </div>`;
                        }
                    });
                    
                    list.innerHTML = html;
                    // 平滑滚动到底部
                    list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
                });
            }
        } catch (error) { console.error("🚨 拉取消息失败:", error); }
    },

    // ------------------------------------------------------------------------
    // 5. 发送消息 (UI 同步升级)
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
            ? `<img src="${myAvatar}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; flex-shrink:0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #F8FAFC;">`
            : `<div style="font-size:20px; width:38px; height:38px; border-radius:50%; background:#FFF; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #F1F5F9;">${myAvatar}</div>`;

        safeDOM.execute('chatMsgList', list => {
            if (lastMessageCount === 0) list.innerHTML = '';
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // 插入一条半透明的“发送中”气泡
            list.insertAdjacentHTML('beforeend', `
                <div style="display:flex; justify-content:flex-end; align-items:flex-end; gap:10px; margin-bottom: 6px; opacity:0.7; transform: translateY(10px); transition: all 0.3s ease-out;" id="tempMsg_${lastMessageCount}">
                    <div style="display:flex; flex-direction:column; align-items:flex-end; max-width:72%;">
                        <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: #FFF; padding: 12px 18px; border-radius: 22px 22px 4px 22px; font-size: 15px; line-height: 1.5; word-break: break-all; box-shadow: 0 4px 15px rgba(37,99,235,0.2); letter-spacing: 0.3px;">${text}</div>
                        <div style="font-size:11px; color:#94A3B8; margin-top:6px; margin-right:4px; font-weight: 500;">${timeStr}</div>
                    </div>
                    ${myAvatarHtml}
                </div>
            `);
            
            // 触发动画帧
            setTimeout(() => {
                const tempMsg = document.getElementById(`tempMsg_${lastMessageCount - 1}`);
                if (tempMsg) tempMsg.style.transform = 'translateY(0)';
            }, 10);

            list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
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
            if (window.App && window.App.showToast) window.App.showToast("发送失败，请检查网络", "error"); 
        }
    },

    sendQuickMessage(text) {
        safeDOM.execute('chatInput', el => { el.value = text; this.sendChatMessage(); });
    }
};


// ============================================================================
// 🚀 全局审批引擎：通过与婉拒 (继承了原 approvePartner 的真实数据库逻辑)
// ============================================================================
window.App = window.App || {};

window.App.approveApplication = async function(btnElement, appId, postId, applicantName) {
    if(!confirm(`🎉 确认同意 @${applicantName} 加入队伍吗？\n\n(确认后队伍人数将 +1，大厅进度条同步更新！)`)) return;
    
    // UI 立即反馈，防连击
    const originalText = btnElement.innerText;
    btnElement.innerText = "⏳ 处理中...";
    btnElement.style.pointerEvents = "none";

    try {
        const token = localStorage.getItem('hebao_token');
        if (!token) return showToast("登录状态已过期，请重新登录", "warning");

        // 1. 从前端所有帖子的缓存里找到这个帖子
        const allPosts = window.allCommunityPostsCache || [];
        const post = allPosts.find(p => p.id === postId);
        if(!post) throw new Error("帖子数据不存在");
        
        let contentObj = typeof post.content === 'string' ? JSON.parse(post.content) : post.content;
        const currentJoined = parseInt(contentObj.joinedCount) || 1;
        const max = parseInt(contentObj.maxPeople) || 2;
        
        if (currentJoined >= max) throw new Error("⚠️ 哎呀，队伍已经满员啦！");
        
        // 2. 人数进度 +1 (使用你原本的逻辑)
        contentObj.joinedCount = currentJoined + 1;
        const newContentStr = JSON.stringify(contentObj);

        // 3. 通知后端更新数据库
        const res = await fetch('/api/update-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ postId, content: newContentStr })
        });
        const data = await res.json();
        
        if(data.success) {
            // 4. 将本地 mock 的申请记录标记为已处理
            let mockApps = JSON.parse(localStorage.getItem('hp_mock_applications') || '[]');
            mockApps = mockApps.filter(app => app.id !== appId);
            localStorage.setItem('hp_mock_applications', JSON.stringify(mockApps));

            // 5. 更新本地缓存
            post.content = newContentStr;
            
            // 6. UI 变化：把卡片变成已通过状态
            const card = btnElement.closest('div[style*="background: #FFF"]');
            card.innerHTML = `<div style="text-align: center; padding: 10px; color: #10B981; font-weight: 900; font-size: 13px;">✅ 已同意 @${applicantName} 入队！进度：${contentObj.joinedCount}/${max}</div>`;
            
            if (window.App.showToast) window.App.showToast(`✅ 迎新成功！当前队伍 ${contentObj.joinedCount}/${max} 人`, "success");
            
            // 7. 同步大厅数据
            if(window.App.loadCommunityPosts) window.App.loadCommunityPosts(); 
        } else {
            throw new Error(data.error);
        }
    } catch(e) {
        if (window.App.showToast) window.App.showToast("审批失败: " + e.message, "error");
        btnElement.innerText = originalText;
        btnElement.style.pointerEvents = "auto";
    }
};

window.App.rejectApplication = function(btnElement, appId) {
    if(!confirm('婉拒后对方不会收到强提醒，确定婉拒吗？')) return;
    
    // 清理本地 mock 记录
    let mockApps = JSON.parse(localStorage.getItem('hp_mock_applications') || '[]');
    mockApps = mockApps.filter(app => app.id !== appId);
    localStorage.setItem('hp_mock_applications', JSON.stringify(mockApps));

    // UI 变化：卡片消失
    const card = btnElement.closest('div[style*="background: #FFF"]');
    card.style.opacity = '0';
    setTimeout(() => card.remove(), 300);
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
