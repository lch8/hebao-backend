export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: '只允许 POST 请求' }), { status: 405, headers: { 'Access-Control-Allow-Origin': '*' } });

    try {
        const { dutchName, chineseName, isNonFood } = await req.json();
        
        const deepseekKey = process.env.DEEPSEEK_API_KEY;
        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;

        if (!deepseekKey) return new Response(JSON.stringify({ error: 'DeepSeek 环境变量未配置！' }), { status: 500 });
        
        dbUrl = dbUrl?.replace('libsql://', 'https://');

        // ==========================================
        // 💬 任务 A：去数据库拉取【真实的高赞点评】
        // ==========================================
        let realReviews = [];
        if (dbUrl && authToken) {
            try {
                const tursoRes = await fetch(`${dbUrl}/v2/pipeline`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requests: [
                            { type: "execute", stmt: { 
                                sql: "SELECT author, avatar, content, likes, created_at FROM reviews WHERE dutch_name = ? ORDER BY likes DESC, created_at DESC LIMIT 10", 
                                args: [{ type: "text", value: dutchName }] 
                            }},
                            { type: "close" }
                        ]
                    })
                });
                
                const tursoData = await tursoRes.json();
                const resultSet = tursoData.results?.[0]?.response?.result;
                
                if (resultSet && resultSet.rows) {
                    const cols = resultSet.cols.map(c => c.name);
                    realReviews = resultSet.rows.map(row => {
                        const getVal = (cName) => row[cols.indexOf(cName)]?.value;
                        const dateStr = getVal('created_at');
                        return {
                            author: getVal('author'),
                            avatar: getVal('avatar'),
                            content: getVal('content'),
                            likes: getVal('likes') || 0,
                            date: dateStr ? dateStr.split(' ')[0] : '刚刚' // 截取日期部分
                        };
                    });
                }
            } catch(e) { console.error("拉取真实评论失败:", e); }
        }

        // ==========================================
        // 🧠 任务 B：让 DeepSeek 专心生成【神仙吃法/平替】
        // ==========================================
        const typeInstruction = isNonFood 
            ? "这是一个【非食品/日化类】商品。methods写具体使用方法（如：戴手套擦拭），recipe_desc写使用避坑指南（如：不要接触食物）。" 
            : "这是一个【食品】。methods写烹饪方法（如：空气炸锅），recipe_desc写神仙搭配。";

        // ⚠️ 移除了幻觉评论字段，强制 DeepSeek 只做客观分析
        const dsSystemPrompt = `你是专为荷兰华人留学生服务的超市排雷管家。
        ${typeInstruction}

        ⚠️ 必须严格返回如下 JSON 格式：
        {
          "methods": ["♨️ 用法1", "🔥 用法2"], 
          "recipe_desc": "一段100字内的进阶使用/食用指南...", 
          "alternatives": ["平替商品1", "升级商品2"]
        }`;

        const dsUserPrompt = `荷兰语名：${dutchName}（中文：${chineseName}）。请输出 JSON 报告。`;

        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: dsSystemPrompt }, 
                    { role: 'user', content: dsUserPrompt }
                ],
                temperature: 0.3, // 降低温度，确保 JSON 稳定性
                response_format: { type: "json_object" } 
            })
        });

        const dsData = await dsRes.json();
        if (!dsRes.ok) throw new Error("DeepSeek 深度报告罢工：" + (dsData.error?.message || '未知错误'));

        let aiText = dsData.choices[0].message.content;
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const match = aiText.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("AI 格式错误，未能生成标准 JSON");

        // ==========================================
        // 🧩 终极拼图：AI 骨架 + 真实血肉
        // ==========================================
        const finalResult = JSON.parse(match[0]);
        // 将数据库拉取的真实评论强行注入到 AI 结果中！
        finalResult.reviews = realReviews;

        return new Response(JSON.stringify(finalResult), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
