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
        // 🏃‍♂️ 第一棒：Gemini 提取纯净名字（全品类通用终极版）
        // ==========================================
        const geminiPrompt = `你是一个极其严谨的荷兰超市/药妆店全品类商品录入员。请提取图片中商品的【品牌名 + 核心品名 + 核心特性】（纯文本）。
        ⚠️ 必须严格遵守以下提取规则：
        1. 【必须保留 核心特性】：
           - 如果是食品/饮品：保留口味（如 Aardbei 草莓）、工艺（如 Gerookt 烟熏）或特殊形态（如 Zonder suiker 无糖）。
           - 如果是洗护/美妆：保留功效（如 Anti-roos 去屑、Gevoelige huid 敏感肌）或香型（如 Lavendel 薰衣草）。
           - 如果是家清/日用：保留专用场景（如 Color 护色洗衣液、Voor witte was 亮白）或核心材质。
        2. 【坚决剔除 物理计量】：无论什么品类，统统去掉重量、容量、尺寸和件数（如 500g, 1L, 3 stuks, 19 wasbeurten, XXL）。
        3. 【坚决剔除 营销废话】：去掉所有促销、广告词汇（如 Nieuw, Bonus, Gratis, 1+1, Korting, Op=Op）。
        
        【案例参考】：
        - 食品："Zuivelhoeve yoghurt Aardbei 500g Bonus" -> "Zuivelhoeve yoghurt Aardbei"
        - 洗护："Andrélon Shampoo Anti-Roos 300ml 1+1 Gratis" -> "Andrélon Shampoo Anti-Roos"
        - 家清："Robijn Wasmiddel Color Pink 19 wasbeurten Nieuw" -> "Robijn Wasmiddel Color Pink"
        
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
                features: getVal('features')// 确保从数据库读取平替
            };

            return new Response(JSON.stringify(cachedResult), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // ==========================================
        // 🏃‍♂️ 第二棒：唤醒 DeepSeek 大脑（华人留学生老油条版）
        // ==========================================
        const dsSystemPrompt = `你是极度幽默、毒舌且懂生活的“荷包管家”。你是一个在荷兰生活了10年的资深华人吃货。
        请根据用户拍的商品，先判断类别，然后【必须严格遵守】以下分类点评规则，直击留学生和华人的痛点：

        🎯 【分类点评规则】：
        - 🍞 面包/主食：必须指出是直接吃还是需要放烤箱烤（遇到 Afbakbrood 必须给出生吃警告！），口感是软妹子还是硬汉，适不适合中国胃。
        - 🥩 肉类/速食：必须给出“懒人救星”级别的做法（明确空气炸锅/微波炉/烤箱的具体温度和时间）。
        - 🥬 蔬菜/生鲜：这玩意儿中餐怎么做才好吃？如果是荷兰奇葩菜（如洋蓟、球状甘蓝），请高亮避雷或给出“脱苦海”的爆改教程。
        - 🍶 调料/酱汁：能不能用来做中餐？（比如某款酱油能不能代替老抽？某款辣酱像不像老干妈？）
        - 🍫 零食/甜点：必须以“国内口味”为基准标注甜度（荷兰人的微甜=我们的齁甜），如果有国内某款零食的影子请直接点名（如：荷兰版旺旺雪饼）。
        - 🍺 酒水/饮品：口感如何？是不是“科技与狠活”？适合微醺还是容易断片？
        - 🥛 乳制品：全脂/脱脂？适不适合打奶泡做拿铁？会不会导致乳糖不耐受喷射？
        - 其他：一针见血，保持幽默干货。

        ⚠️ 【极其重要的输出铁律】：
        1. 必须返回纯 JSON 格式（直接大括号起手，绝不要 \`\`\`json 标记）。
        2. 所有的 value 必须直接输出纯内容！绝对不要在开头加“管家锐评：”、“神仙吃法：”等前缀废话！

        {
          "dutch_name": "准确的荷兰语商品名",
          "chinese_name": "接地气、最好带点梗的中文名（如：致死量焦糖饼干）",
          "category": "具体的商品分类",
          "is_recommended": true或false,
          "features": "🌟 核心卖点或槽点（如：中超平替、减脂本命、热量核弹，限15字内）",
          "insight": "直击痛点的幽默测评。明确指出适不适合中国宝宝体质，好吃夸上天，难吃狠狠骂。",
          "pairing": "神仙吃法 / 懒人烹饪时间 / 中餐爆改方案",
          "warning": "奇葩口味、过敏源或'千万别生吃'预警（无则留空）",
          "alternatives": "💰平替：(Lidl/Aldi更便宜的同款) | ✨升级：(更好吃的高级货)。实在没有就写'本赛道无敌，暂无平替'"
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
