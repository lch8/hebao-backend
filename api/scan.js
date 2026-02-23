export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: '只允许 POST 请求' }), { status: 405 });
    }

    try {
        const { imageBase64 } = await req.json();
        
        const geminiKey = process.env.GEMINI_API_KEY; 
        const deepseekKey = process.env.DEEPSEEK_API_KEY;
        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;

        if (!geminiKey || !deepseekKey || !dbUrl || !authToken) {
            return new Response(JSON.stringify({ error: 'Vercel 环境变量钥匙不全！' }), { status: 500 });
        }

        dbUrl = dbUrl.replace('libsql://', 'https://');

        // ==========================================
        // 🏃‍♂️ 第一棒：Gemini 提取纯净名字
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
        // 🛡️ 记忆拦截系统（带 alternatives 字段）
        // ==========================================
        const tursoRes = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { 
                        type: "execute", 
                        stmt: { 
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
                insight: getVal('insight') + " ⚡️(由数据库秒回)", 
                pairing: getVal('pairing'),
                warning: getVal('warning'),
                alternatives: getVal('alternatives'),
                features: getVal('features'),// 确保从数据库读取平替
            };

            return new Response(JSON.stringify(cachedResult), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // ==========================================
        // 🏃‍♂️ 第二棒：唤醒 DeepSeek 大脑（强制输出 alternatives）
        // ==========================================
        const dsSystemPrompt = `你是极度幽默的荷兰华人超市排雷专家“荷包管家”。
        请根据用户拍的商品，先判断类别，然后【必须严格遵守】以下分类点评规则：
        - 🍺 酒水饮料：点评酒精度/风味，推荐下酒菜。
        - 🥦 生鲜蔬果：给出留学生续命做法，奇葩蔬菜必须高亮避雷。
        - 🍫 零食甜点：给出甜度指数和口感。
        - 🍗 速食半成品：必须给出具体的“空气炸锅/烤箱的温度和时间”！
        - 🥛 乳制品：点明全脂/脱脂及浓郁度。

        你必须严格返回纯 JSON 格式（直接大括号起手，不要 \`\`\`json 标记），且必须包含以下所有字段：
        {
  "dutch_name": "荷兰语商品名",
  "chinese_name": "接地气中文名",
  "category": "具体的商品分类",
  "is_recommended": true或false,
  "features": "🌟 产品核心卖点提炼（如：百年老牌、无糖低卡、高蛋白等，控制在 15 个字以内！）",
  "insight": "幽默干货测评",
  "pairing": "神仙吃法/烹饪时间",
  "warning": "奇葩口味或过敏源预警（无则留空）",
  "alternatives": "💰平替推荐：xxx | ✨升级版本：xxx"
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
