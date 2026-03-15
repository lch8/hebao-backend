// js/core/dom.js
export const safeDOM = {
    /**
     * 极度防御性 DOM 执行器
     * @param {string} id - DOM 元素的 ID
     * @param {Function} callback - 找到元素后执行的回调函数
     */
    execute: (id, callback) => {
        try {
            const el = document.getElementById(id);
            if (el) {
                callback(el);
            } else {
                console.warn(`🛡️ [Defensive Check] DOM Element missing: #${id}. Action skipped to prevent crash.`);
            }
        } catch (error) {
            console.error(`🚨 [Core Engine Error] Failed while executing action on #${id}:`, error);
        }
    },

    /**
     * 安全获取值
     */
    getValue: (id, fallback = '') => {
        try {
            const el = document.getElementById(id);
            if (el) return el.value;
            return fallback;
        } catch (error) {
            return fallback;
        }
    }
};
