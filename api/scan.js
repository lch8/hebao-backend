export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    // 允许跨域
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
        // 🏃‍♂️ 第一棒：Gemini 提取纯净名字 (极速版)
        // ==========================================
        const geminiPrompt = `你是一个极其严谨的荷兰超市/药妆店全品类商品录入员。请提取图片中商品的【品牌名 + 核心品名 + 核心特性】（纯文本）。
        ⚠️ 必须严格遵守以下提取规则：
        1. 【必须保留 核心特性】：如口味、功效、场景。
        2. 【坚决剔除 物理计量】：去掉重量、容量、尺寸和件数（如 500g, 1L, XXL）。
        3. 【坚决剔除 营销废话】：去掉如 Nieuw, Bonus, Gratis, 1+1 等词。
        只输出最终的纯文本名字，不要任何标点。看不清请回复'未识别'。`;
        
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
        // 🛡️ 记忆拦截系统
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
                features: getVal('features')
            };

            return new Response(JSON.stringify(cachedResult), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // ==========================================
        // 🏃‍♂️ 第二棒：唤醒 DeepSeek 大脑 (首页骨架极速减负版)
        // ==========================================
        const dsSystemPrompt = `你是极度幽默、毒舌且懂生活的“荷包管家”。你是一个在荷兰生活了10年的资深华人吃货。
        请根据商品名进行锐评。

        ⚠️ 【极其重要的输出铁律】：
        1. 必须返回纯 JSON 格式（直接大括号起手）。
        2. 为了保证极速响应，**绝不允许**生成平替、升级版、以及长篇大论的网友点评！只生成首页需要的骨架字段！

        请严格输出以下 JSON 结构：
        {
          "dutch_name": "准确的荷兰语商品名",
          "chinese_name": "接地气、最好带点梗的中文名（如：致死量焦糖饼干）",
          "category": "具体的商品分类",
          "is_recommended": true或false,
          "features": "🌟 核心卖点或槽点（限15字内）",
          "insight": "直击痛点的幽默测评。明确指出适不适合中国宝宝体质，限30字内。",
          "warning": "奇葩口味、过敏源或'千万别生吃'预警（无则留空）"
        }`;

        const dsUserPrompt = `商品名是：${productInfo}。请输出JSON骨架点评。`;

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
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, 
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } 
        });
    }
}
