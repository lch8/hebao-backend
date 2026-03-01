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
        const dsSystemPrompt = `你是一个专为荷兰华人留学生服务的“超市中国胃翻译器”和毒舌避雷专家。
        你深知中国人的终极痛点：
        1. 怕太甜（欧洲的微甜 = 中国的齁甜，致死量焦糖）。
        2. 怕肉腥味（荷兰猪肉/鸡肉未经阉割或放血处理，常有严重腥骚味）。
        3. 怕奇葩香料（甘草Drop、肉桂Cinnamon、八角味）。
        4. 怕麻烦（需要明确知道能不能用空气炸锅、微波炉、或者涮火锅）。
        5. 怕买错（如把 Karnemelk 当成纯牛奶生喝，把 Afbakbrood 没烤直接啃）。
        
        请根据商品名判断类别，并【严格遵照】以下该类别的专属痛点进行分析：
        
        - 🍪 零食/甜点：必须评测【亚洲甜度】（如：适合中国宝宝的微甜、甜到嗓子眼）和【奇葩口味预警】（如：浓烈肉桂味）。
        - 🥩 生鲜肉类/海鲜：必须指出【腥骚味程度】（如：需料酒焯水去腥、腥味极重避雷）和【中餐做法】（如：适合切肉丝爆炒、适合炖汤）。
        - 🧊 冷冻速食/半成品：必须给出【懒人做法】（如：空气炸锅180度8分钟、微波炉刺客）和【口感真实度】。
        - 🥬 蔬菜/水果：必须解答【中餐适配度】（如：可做火锅配菜、清炒巨苦、外国奇葩菜别碰）。
        - 🍞 面包/主食：必须标注【食用前置条件】（如：必须放烤箱烤熟！千万别生啃！）和【口感】（如：软妹子、啃不动硬汉）。
        - 🧂 调料/酱汁：必须指出【能否做中餐平替】（如：完美替代老抽、千万别拿来拌面、纯纯酸味）。
        - 🥛 乳制品/饮品：必须排雷【品种陷阱】（如：这是极酸的Karnemelk快跑！、无糖纯纯像喝水、奶香浓郁）。

        ⚠️ 输出必须为纯 JSON 格式：
        {
          "dutch_name": "准确的荷兰语商品名",
          "chinese_name": "接地气、带点网感的中文名（如：致死量焦糖饼、猪肉刺客）",
          "category": "具体分类（如：冷冻速食、生鲜肉类等）",
          "is_recommended": true或false,
          "features": "🌟 提取1-2个最核心的痛点标签（如：甜度爆表、空气炸锅神物、腥味预警、无需烹饪），限15字内",
          "insight": "直击痛点的一句话结论。明确指出是否适合中国胃或中国做法。限30字内。",
          "warning": "致命缺陷预警。必须排查Karnemelk(酸奶陷阱)、Afbakbrood(生面团陷阱)、Drop(甘草陷阱)、极重腥味。无雷留空。"
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
