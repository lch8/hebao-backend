export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: '只允许 POST 请求' }), { status: 405 });
    }

    try {
        const { imageBase64 } = await req.json();
        
        // 拿满 3 把钥匙（加入 Turso 的钥匙，用于读取）
        const geminiKey = process.env.GEMINI_API_KEY; 
        const deepseekKey = process.env.DEEPSEEK_API_KEY;
        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;

        if (!geminiKey || !deepseekKey || !dbUrl || !authToken) {
            return new Response(JSON.stringify({ error: 'Vercel 环境变量钥匙不全！' }), { status: 500 });
        }

        dbUrl = dbUrl.replace('libsql://', 'https://');

        // ==========================================
        // 🏃‍♂️ 第一棒：Gemini（纯净版，只提取名字用于数据库匹配）
        // ==========================================
        const geminiPrompt = "你是一个极简提取器。请仅提取图片中商品最核心的准确荷兰语名称（纯文本，不要任何标点、翻译或解释）。看不清请回复'未识别'。";
        
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [ { text: geminiPrompt }, { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } } ] }],
                generationConfig: { temperature: 0.1 } 
            })
        });

        const geminiData = await geminiRes.json();
        if (!geminiRes.ok) throw new Error("Gemini 视觉罢工：" + (geminiData.error?.message || '未知错误'));
        
        let productInfo = geminiData.candidates[0].content.parts[0].text.trim();
        if (productInfo.includes('未识别')) throw new Error("图片太模糊，管家看不清包装上的字！");

        // ==========================================
        // 🛡️ 记忆拦截系统：去 Turso 金库查有没有人拍过！
        // ==========================================
        const tursoRes = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { 
                        type: "execute", 
                        stmt: { 
                            // 用 LIKE 模糊匹配，防止大小写或一点点偏差导致找不到
                            sql: "SELECT * FROM products WHERE dutch_name LIKE ? LIMIT 1", 
                            args: [{ type: "text", value: `%${productInfo}%` }] 
                        } 
                    },
                    { type: "close" }
                ]
            })
        });

        const tursoData = await tursoRes.json();
        const resultSet = tursoData.results[0]?.response?.result;

        // 💡 如果在数据库里找到了，直接秒回！狠狠省下 DeepSeek 的钱！
        if (resultSet && resultSet.rows && resultSet.rows.length > 0) {
            const cols = resultSet.cols.map(c => c.name);
            const rowData = resultSet.rows[0];

            const getVal = (colName) => {
                const idx = cols.indexOf(colName);
                return idx !== -1 && rowData[idx] ? rowData[idx].value : "";
            };

            const cachedResult = {
                dutch_name: getVal('dutch_name'),
                chinese_name: getVal('chinese_name'),
                category: getVal('category'),
                is_recommended: getVal('is_recommended') === "1" || getVal('is_recommended') === 1,
                insight: getVal('insight') + " ⚡️(由数据库秒回)", // 加个小尾巴，让你知道这是白嫖的数据！
                pairing: getVal('pairing'),
                warning: getVal('warning')
            };

            return new Response(JSON.stringify(cachedResult), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // ==========================================
        // 🏃‍♂️ 第二棒：如果在库里没找到，唤醒 DeepSeek 现编一段
        // ==========================================
        const dsSystemPrompt = `你是极度幽默的荷兰华人超市排雷专家“荷包管家”。
        返回纯 JSON 格式（直接大括号起手）：
        {
          "dutch_name": "荷兰语商品名", "chinese_name": "接地气中文名", "category": "商品分类",
          "is_recommended": true或false, "insight": "幽默干货评价", "pairing": "神仙吃法", "warning": "过敏源或奇葩口味预警，无则留空"
        }`;

        const dsUserPrompt = `Gemini识别到的商品名是：${productInfo}。请输出JSON点评。`;

        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'system', content: dsSystemPrompt }, { role: 'user', content: dsUserPrompt }],
                temperature: 0.7,
                response_format: { type: "json_object" } 
            })
        });

        const dsData = await dsRes.json();
        if (!dsRes.ok) throw new Error("DeepSeek 罢工：" + (dsData.error?.message || '未知错误'));

        let aiText = dsData.choices[0].message.content;
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const match = aiText.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("格式错误");

        return new Response(match[0], {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
