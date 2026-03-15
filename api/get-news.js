// api/get-news.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    
    try {
        // 🔮 这里是 AI 翻译引擎的占位符。
        // 未来你可以用 fetch() 去拉取 nu.nl 的 RSS，然后传给 DeepSeek 翻译。
        // 现在为了打通前后台，我们先返回一组高质量的“留学生息息相关”的硬核模拟数据：
        
        const aiTranslatedNews = [
            { id: 1, time: '10:30', tag: '交通', content: 'NS (荷兰铁路) 宣布下月起非高峰期火车票价下调 3%，以鼓励留学生与通勤者错峰出行。', hot: true },
            { id: 2, time: '09:15', tag: '政策', content: 'IND (移民局) 最新草案提议：非欧盟留学生的兼职打工时长限制，每周有望从 16 小时放宽至 20 小时。', hot: true },
            { id: 3, time: '08:00', tag: '生活', content: 'Albert Heijn 推出全新积分系统，Premium 会员本周末购买指定日用品可享双倍返现。', hot: false },
            { id: 4, time: '昨夜', tag: '天气', content: 'KNMI 发布黄色预警：今晚全国大部分地区将迎强风与降雨，部分地区风力达 8 级，请注意骑行安全。', hot: false }
        ];

        // 模拟 AI 处理的延迟感 (0.8秒)
        await new Promise(resolve => setTimeout(resolve, 800));

        return new Response(JSON.stringify({ success: true, data: aiTranslatedNews }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, 
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    }
}
