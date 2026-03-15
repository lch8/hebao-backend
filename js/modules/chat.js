import { showToast } from '../core/toast.js';

export const ChatEngine = {
    openChat(targetId, targetName, targetAvatar, postId) {
        try {
            const modal = document.getElementById('chatModal');
            if (!modal) {
                showToast("聊天窗口未初始化", "error");
                return;
            }
            
            modal.style.display = 'flex';

            if (document.getElementById('chatTargetName')) {
                document.getElementById('chatTargetName').innerText = targetName || '联系卖家';
            }
            
            const msgList = document.getElementById('chatMsgList');
            if (msgList) {
                msgList.innerHTML = '<div style="text-align:center; color:#9CA3AF; font-size:12px;">加载历史消息中...</div>';
            }
        } catch (error) {
            console.error("🚨 [Chat Engine Error]:", error);
            showToast("打开对话失败", "error");
        }
    },

    sendQuickMessage(text) {
        try {
            const input = document.getElementById('chatInput');
            if (input) {
                input.value = text;
                // 调用发送逻辑
            }
        } catch (error) {
            console.error("🚨 [Quick Reply Error]:", error);
        }
    }
};
