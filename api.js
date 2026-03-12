// api.js - 全局网络请求与配置中心
const API_BASE = ''; // 如果后端和前端部署在一起，留空即可

// 获取存储的 JWT token
function getAuthHeaders() {
    const token = localStorage.getItem('hebao_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

// 统一封装的 fetch 函数 (方便后期做全局 Loading 或错误拦截)
async function apiFetch(endpoint, options = {}) {
    if (!options.headers) {
        options.headers = getAuthHeaders();
    }
    try {
        const response = await fetch(API_BASE + endpoint, options);
        return response;
    } catch (error) {
        console.error("API 请求异常:", error);
        throw error;
    }
}
