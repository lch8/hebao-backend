export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    // 允许跨域请求
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
        });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: '只允许 POST 请求' }), { status: 405, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    try {
        // 从前端接收基础商品名
        const { dutchName, chineseName } = await req.json();
        
        const deepseekKey = process.env.DEEPSEEK_API_KEY;
        if (!deepseekKey) {
            return new Response(JSON.stringify({ error: 'DeepSeek 环境变量未配置！' }), { status: 500 });
        }

        // ==========================================
        // 🧠 深度报告大脑：强制输出结构化 JSON 适配大厂 UI
        // ==========================================
    
        const dsSystemPrompt = `你是专为荷兰华人留学生服务的“超市排雷管家”。用户在首页看了极简评测，现在进入详情页，需要你提供深度内容。

        ⚠️ 【绝对铁律】：
        你必须严格返回以下 JSON 格式的数据，不要包含任何 Markdown 标记，严格使用对应的类型（数组、对象）。

        {
          "methods": ["♨️ 烤箱 200度 10分钟", "🔥 空气炸锅 180度 8分钟"], // 字符串数组：提取最完美的烹饪或食用方法，带emoji，没有就写["直接开吃"]
          "recipe_desc": "千万不要用微波炉加热，会完全软趴趴！建议中间切开夹生菜和火腿...", // 字符串：一段100字内的神仙吃法或避坑指南
          "alternatives": ["Lidl 同款炸鱼块 €3.99", "AH Excellent 优质版"], // 字符串数组：给出1-3个平替或升级版商品，没有就返回空数组 []
          "reviews": [ // 对象数组：模拟2-3条极具真实留学生语气的点评
            {
              "avatar": "🐼", // 1个符合人设的emoji
              "author": "阿姆干饭王", // 极具小红书风格的网名
              "content": "这个绝对是荷兰超市的巅峰之作！一定要配那个绿色的蒜香酱！", // 真实点评，带点主观感情，字数50字内
              "likes": 245, // 随机生成一个 10 - 999 的点赞数 (整数)
              "date": "1天前" // 如：刚刚、1天前、3天前
            },
            {
              "avatar": "🐷",
              "author": "鹿村打工人",
              "content": "避雷！超级咸，吃了一口感觉肾脏在悲鸣...",
              "likes": 128,
              "date": "3天前"
            }
          ]
        }`;

        const dsUserPrompt = `当前商品荷兰语名：${dutchName}（中文俗称：${chineseName}）。请立即输出结构化 JSON 深度报告。`;

        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${deepseekKey}` 
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: dsSystemPrompt }, 
                    { role: 'user', content: dsUserPrompt }
                ],
                // 提高 temperature，让网友点评更有创意、更像真人
                temperature: 0.85,
                response_format: { type: "json_object" } 
            })
        });

        const dsData = await dsRes.json();
        if (!dsRes.ok) throw new Error("DeepSeek 深度报告罢工：" + (dsData.error?.message || '未知错误'));

        // 清理可能存在的 Markdown 标记，确保纯净的 JSON
        let aiText = dsData.choices[0].message.content;
        aiText = aiText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const match = aiText.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("AI 格式错误，未能生成标准 JSON");

        // 直接把结构化 JSON 吐给前端
        return new Response(match[0], {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, 
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } 
        });
    }
}
