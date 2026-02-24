export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    // 🛡️ 1. 身份验证：防止别人恶意调用你的清洗接口
    const authHeader = req.headers.get('authorization');
    // 在 Vercel 环境变量里配一个 CRON_SECRET（随便写一串密码，比如 MySuperSecret2026）
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('🚨 闲人免进！只有 Vercel 扫地僧才能触发！', { status: 401 });
    }

    try {
        const deepseekKey = process.env.DEEPSEEK_API_KEY;
        let dbUrl = process.env.TURSO_DATABASE_URL.replace('libsql://', 'https://');
        const authToken = process.env.TURSO_AUTH_TOKEN;

        // 🗄️ 2. 把金库里所有的商品名字拉出来
        const fetchRes = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    { type: "execute", stmt: { sql: "SELECT dutch_name FROM products" } },
                    { type: "close" }
                ]
            })
        });
        const tursoData = await fetchRes.json();
        const rows = tursoData.results[0]?.response?.result?.rows || [];
        const allNames = rows.map(r => r[0].value); // 拿到所有名字的数组

        if (allNames.length < 2) {
             return new Response('商品太少，不需要打扫。', { status: 200 });
        }

        // 🧠 3. 唤醒 DeepSeek 大脑，寻找“多胞胎”
        const dsPrompt = `你是一个严谨的荷兰超市数据清洗员。
        下面是一堆商品名字：${JSON.stringify(allNames)}
        请找出里面明显是同一个东西，但因为拍摄角度不同导致名字不同的重复项（例如 'AH Pindakaas' 和 'Albert Heijn Pindakaas 500g'）。
        选出一个最标准的作为 keep，其他的作为 remove。
        必须严格返回纯 JSON 格式的数组：
        [
          { "keep": "标准名字", "remove": "要被删掉的重复名字" }
        ]
        如果没有重复项，返回空数组 []。`;

        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: dsPrompt }],
                temperature: 0.1, // 温度调低，严谨为主
                response_format: { type: "json_object" } 
            })
        });

        const dsData = await dsRes.json();
        let aiText = dsData.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
        const duplicates = JSON.parse(aiText);

        if (!duplicates || duplicates.length === 0) {
            return new Response('数据库很干净，没有重复项！', { status: 200 });
        }

        // ⚔️ 4. 执行吸星大法与抹杀（自动合并）
        let sqlRequests = [];
        for (let item of duplicates) {
            // 将要删除的 likes 加到标准项上
            sqlRequests.push({ 
                type: "execute", 
                stmt: { 
                    sql: `UPDATE products SET likes = likes + COALESCE((SELECT likes FROM products WHERE dutch_name = ?), 0) WHERE dutch_name = ?`, 
                    args: [{ type: "text", value: item.remove }, { type: "text", value: item.keep }] 
                } 
            });
            // 抹杀重复项
            sqlRequests.push({ 
                type: "execute", 
                stmt: { sql: `DELETE FROM products WHERE dutch_name = ?`, args: [{ type: "text", value: item.remove }] } 
            });
        }
        sqlRequests.push({ type: "close" });

        // 发送给 Turso 批量执行
        await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests: sqlRequests })
        });

        return new Response(JSON.stringify({ success: true, message: `扫地僧已清理 ${duplicates.length} 个重复垃圾！`, details: duplicates }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
