// js/core/toast.js
let toastTimeout = null;

export function showToast(message, type = 'info') {
    try {
        const toast = document.getElementById('globalToast');
        const icon = document.getElementById('toastIcon');
        const msg = document.getElementById('toastMessage');
        
        // 铁律：DOM判空
        if (!toast || !icon || !msg) {
            console.warn("🛡️ Toast DOM missing, fallback to console:", message);
            return;
        }

        if (type === 'success') { 
            icon.innerText = '✅'; 
            toast.style.background = 'rgba(16, 185, 129, 0.95)'; 
        } else if (type === 'error') { 
            icon.innerText = '🚨'; 
            toast.style.background = 'rgba(239, 68, 68, 0.95)'; 
        } else if (type === 'warning') { 
            icon.innerText = '⚠️'; 
            toast.style.background = 'rgba(245, 158, 11, 0.95)'; 
        } else { 
            icon.innerText = '💡'; 
            toast.style.background = 'rgba(17, 24, 39, 0.95)'; 
        }

        msg.innerText = message;
        toast.classList.add('show');

        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            if (document.getElementById('globalToast')) {
                document.getElementById('globalToast').classList.remove('show');
            }
        }, 3000);
    } catch (error) {
        console.error("🚨 [Toast Engine Error]:", error);
    }
}
