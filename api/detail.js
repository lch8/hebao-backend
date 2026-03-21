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
        const typeInstruction = isNonFood 
            ? "这是一个【非食品/日化类】商品。methods写具体使用方法（如：戴手套擦拭），recipe_desc写使用避坑指南（如：不要接触食物）。reviews模拟留学生做家务/生活的评价。" 
            : "这是一个【食品】。methods写烹饪方法（如：空气炸锅），recipe_desc写神仙搭配。reviews模拟留学生对口味的评价。";
    
        const dsSystemPrompt = `你是专为荷兰华人留学生服务的“超市排雷管家”。用户在首页看了极简评测，现在进入详情页，需要你提供深度内容。

        ⚠️ 【绝对铁律】：
        你必须严格返回以下 JSON 格式的数据，不要包含任何 Markdown 标记，严格使用对应的类型（数组、对象）。

        {
          "methods": ["♨️ 用法1", "🔥 用法2"], 
          "recipe_desc": "一段100字内的进阶使用/食用指南...", 
          "alternatives": ["平替商品1", "升级商品2"], 
          "reviews": [ 
            {
              "avatar": "🐼", 
              "author": "荷村小能手", 
              "content": "点评内容...", 
              "likes": 128, 
              "date": "2天前" 
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
