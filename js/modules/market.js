import { showToast } from '../core/toast.js';

export const MarketEngine = {
    renderIdleItems(data) {
        try {
            const container = document.getElementById('idleWaterfall');
            if (!container) return;

            if (data.length === 0) {
                container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:40px 0;">空空如也</div>';
                return;
            }

            let html = '';
            data.forEach(item => {
                // 安全拼装 HTML
                html += `<div class="waterfall-item" onclick="window.App.openCommunityPost(${item.id})">...</div>`;
            });
            container.innerHTML = html;
        } catch (error) {
            console.error("🚨 [Market Render Error]:", error);
        }
    },

    updateTotalIdlePrice(selectedImagesArray) {
        try {
            let total = 0;
            selectedImagesArray.forEach(i => { 
                if (i.price && !isNaN(i.price)) total += parseFloat(i.price); 
            });
            
            if (document.getElementById('idlePrice')) {
                document.getElementById('idlePrice').value = total > 0 ? total : '';
            }
        } catch (error) {
            console.error("🚨 [Price Calc Error]:", error);
        }
    }
};
