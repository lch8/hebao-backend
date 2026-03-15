import { showToast } from '../core/toast.js';

let currentProductData = null;

export const ScannerEngine = {
    async handlePackageImage(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;

            if (document.getElementById('homeActionBox')) document.getElementById('homeActionBox').style.display = 'none';
            if (document.getElementById('previewContainer')) document.getElementById('previewContainer').style.display = 'block';
            if (document.getElementById('scanOverlay')) document.getElementById('scanOverlay').style.display = 'flex';
            if (document.getElementById('scanText')) document.getElementById('scanText').innerText = "📡 正在解析包装...";
            
            const reader = new FileReader();
            reader.onload = async function(e) {
                if (document.getElementById('previewImg')) document.getElementById('previewImg').src = e.target.result;
                // ... fetch 逻辑 ...
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("🚨 [Scanner Engine Error]:", error);
            showToast("图片读取失败，系统已拦截崩溃", "error");
        }
    },

    async setupDetailPage(detailData) {
        try {
            if (!detailData) throw new Error("缺少详情数据");

            if (document.getElementById('detailImg')) {
                document.getElementById('detailImg').src = detailData.image_url || 'fallback.jpg';
            }
            if (document.getElementById('detailChineseName')) {
                document.getElementById('detailChineseName').innerText = detailData.chinese_name || '未知商品';
            }
            
            // 异步加载 DeepSeek 呼吸灯保护
            const recipeList = document.getElementById('recipeCardList');
            if (recipeList) {
                recipeList.innerHTML = '<div style="text-align:center; color:#6366F1;"><span class="pulse-dot"></span>DeepSeek 正在深度评测...</div>';
            }
            // ... 后续异步 API 请求 ...

        } catch (error) {
            console.error("🚨 [Detail Render Error]:", error);
            showToast("详情页渲染异常", "error");
        }
    }
};
