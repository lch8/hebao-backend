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
        // 🧠 深度报告大脑：专门生成平替和长文点评
        // ==========================================
    
        const dsSystemPrompt = `你是专为荷兰华人留学生服务的“超市排雷管家”。用户在首页已经看到了极简结论，现在进入详情页，需要你给出最硬核的细节。

        ⚠️ 【极其重要的输出铁律】：
        1. 必须返回纯 JSON 格式（直接大括号起手，绝不允许带 \`\`\`json 这样的Markdown标记）。
        2. 只需生成以下两个字段，不要废话：
        {
          "alternatives": "💰平替：(Lidl/Aldi更便宜的同款) | ✨升级：(更好吃的高级货)。实在没有平替就写'本赛道无敌，暂无平替'。",
          "pairing": "模拟2条极其真实的留学生网友点评。\\n【关键要求】：\\n1. 如果是食品，必须在点评里详细描述【味道细节】（酸甜苦辣咸的程度）或【详细菜谱】（如加什么调料、微波炉叮几分钟）。\\n2. 如果是日用品，描述具体的使用感受。\\n格式必须为：\\n'管家点评 [👍 推荐]：详细味道/做法细节...' \\n或 \\n'管家点评 [💣 避雷]：拔草吐槽细节...'。\\n两条点评之间必须用两个换行符 (\\\\n\\\\n) 分隔！"
        }`;

        const dsUserPrompt = `当前商品荷兰语名：${dutchName}（中文名：${chineseName}）。请立即输出JSON格式的深度报告。`;

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
                // 稍微提高一点temperature，让网友点评更有创意和感情
                temperature: 0.8,
                response_format: { type: "json_object" } 
            })
        });

        const dsData = await dsRes.json();
        if (!dsRes.ok) throw new Error("DeepSeek 深度报告罢工：" + (dsData.error?.message || '未知错误'));

        // 清理可能存在的 Markdown 标记，确保纯净的 JSON
        let aiText = dsData.choices[0].message.content;
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const match = aiText.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("AI 格式错误，未能生成标准 JSON");

        // 返回给前端
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
