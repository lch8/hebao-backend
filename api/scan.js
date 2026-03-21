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
        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;

        if (!geminiKey || !dbUrl || !authToken) {
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
        // 🛡️ 记忆拦截系统 (数据库秒回)
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
                dutch_name: getVal('dutch_name'), chinese_name: getVal('chinese_name'), category: getVal('category'),
                is_recommended: getVal('is_recommended') === "1" || getVal('is_recommended') === 1,
                insight: getVal('insight') + " ⚡️(由数据库秒回)", warning: getVal('warning'), features: getVal('features')
            };

            return new Response(JSON.stringify(cachedResult), {
                status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // ==========================================
        // 🏃‍♂️ 第二棒：唤醒 Gemini Flash 大脑 (继承毒舌 Prompt，速度起飞)
        // ==========================================
        const aiSystemPrompt = `你是一个专为荷兰华人留学生服务的“超市管家”和毒舌避雷专家。
        你深知中国人的终极痛点：
        1. 怕太甜（欧洲的微甜 = 中国的齁甜，致死量焦糖）。
        2. 怕肉腥味（荷兰猪肉/鸡肉未经放血处理，常有严重腥骚味）。
        3. 怕奇葩香料（甘草Drop、肉桂Cinnamon、八角味）。
        4. 怕买错（如把 Karnemelk 当成纯牛奶生喝，把 Afbakbrood 没烤直接啃）。
        
        请根据商品名判断是【食品】还是【非食品/日用品】，并严格遵照以下痛点进行分析：
        
        - 🍪 零食/甜点：必须评测【亚洲甜度】和【奇葩口味预警】。
        - 🥩 生鲜肉类/海鲜：必须指出【腥骚味程度】和【中餐做法】。
        - 🧊 冷冻速食/半成品：必须给出【懒人做法】（如：空气炸锅神物）。
        - 🍞 面包/主食：必须标注【食用前置条件】（如：必须烤熟！别生啃！）。
        - 🥛 乳制品/饮品：必须排雷【品种陷阱】（如：极酸的Karnemelk快跑）。
        - 🧼 日化/非食品：必须指出【具体用途】、【是否伤手】、【能否接触食品】（如：这是消毒湿巾，非食品，切勿擦嘴）。

        ⚠️ 必须输出纯 JSON 格式：
        {
          "dutch_name": "准确的荷兰文原名",
          "chinese_name": "接地气、带点网感的中文名（如：致死量焦糖饼、猪肉刺客、洁厕神器）",
          "category": "具体分类（如：冷冻速食、乳制品、日化清洁 等）",
          "is_recommended": true或false,
          "features": "🌟 1个最核心的痛点标签（如：甜度爆表、空气炸锅神物、腥味预警、非食品），限10字内",
          "insight": "直击痛点的一句话结论。明确用途或是否适合中国胃。限30字内。",
          "warning": "致命缺陷预警。必须排查Karnemelk, Afbakbrood, Drop, 极重腥味，或日化用品的误食警告。无雷留空。"
        }`;

        const jsonRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: aiSystemPrompt }] },
                contents: [{ parts: [{ text: `商品名是：${productInfo}。请输出JSON骨架点评。` }] }],
                // 🌟 核心提速魔法：强制要求模型直接返回 JSON，免去了解析报错的风险！
                generationConfig: { responseMimeType: "application/json", temperature: 0.3 } 
            })
        });

        const jsonData = await jsonRes.json();
        if (!jsonRes.ok) throw new Error("AI 骨架生成失败：" + (jsonData.error?.message || '未知错误'));
        
        const finalJsonText = jsonData.candidates[0].content.parts[0].text;

        // ==========================================
        // 🗄️ 异步写入数据库 (不阻塞前端响应)
        // ==========================================
        try {
            const aiResult = JSON.parse(finalJsonText);
            fetch(`${dbUrl}/v2/pipeline`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requests: [
                        {
                            type: "execute",
                            stmt: {
                                sql: "INSERT OR IGNORE INTO products (dutch_name, chinese_name, category, is_recommended, insight, warning, features) VALUES (?, ?, ?, ?, ?, ?, ?)",
                                args: [
                                    { type: "text", value: String(aiResult.dutch_name || productInfo) },
                                    { type: "text", value: String(aiResult.chinese_name || '') },
                                    { type: "text", value: String(aiResult.category || '') },
                                    { type: "integer", value: aiResult.is_recommended ? "1" : "0" },
                                    { type: "text", value: String(aiResult.insight || '') },
                                    { type: "text", value: String(aiResult.warning || '') },
                                    { type: "text", value: String(aiResult.features || '') }
                                ]
                            }
                        },
                        { type: "close" }
                    ]
                })
            });
        } catch (_) { /* 异步错误不影响主流程 */ }

        return new Response(finalJsonText, {
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
