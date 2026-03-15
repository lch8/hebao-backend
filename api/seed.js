export const config = { runtime: 'edge' };

export default async function handler(req) {
    // 🛡️ 防御升级：使用环境变量密钥，只有你自己或者 Vercel 知道
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('🚨 闲人免进！暗号不对！', { status: 401 });
    }

    try {
        let dbUrl = process.env.TURSO_DATABASE_URL;
        const authToken = process.env.TURSO_AUTH_TOKEN;

        if (!dbUrl || !authToken) {
            return new Response('服务器缺 Turso 钥匙！', { status: 500 });
        }
        dbUrl = dbUrl.replace('libsql://', 'https://');

        // 这里是咱们的种子数据
        const seedData = [
            { dutch_name: "Varkensbuik", chinese_name: "AH神仙五花肉", category: "肉类生鲜", is_recommended: 1, insight: "这玩意儿看着肥，烤出来能香迷糊整个楼层！", pairing: "🧑‍🍳 网友点评 [👍 推荐]：\n【必备调料】烧烤料、孜然、生抽\n\n【极简步骤】\n1. 切成厚片，用生抽腌制15分钟。\n2. 空气炸锅垫锡纸，200度烤15分钟。\n3. 中途翻面撒烧烤料，肥油全被烤出来了，绝杀！", warning: "记得垫一层锡纸，不然洗锅洗到你哭。", alternatives: "Lidl的五花肉更便宜但带皮，容易崩。", features: "空气炸锅必备 | 宿舍销魂", image_url: "https://images.unsplash.com/photo-1606850780554-b55ea40f0ebb?w=600&auto=format&fit=crop", likes: 185, dislikes: 2 },
            // ... (其余种子数据保持原样)
            { dutch_name: "Verse Zuurkool", chinese_name: "荷兰袋装酸菜", category: "蔬菜", is_recommended: 1, insight: "东北留学生狂喜，完美平替翠花酸菜！", pairing: "🧑‍🍳 网友点评 [👍 推荐]：\n谁懂啊！在AH冷鲜区找到了这种袋装酸菜，切点超市的五花肉片，加点粉条一锅炖，酸爽开胃，冬天吃简直续命！", warning: "下锅前记得多洗两遍，不然真的太酸了。", alternatives: "无，这是全荷兰最像东北酸菜的东西", features: "东北之光 | 炖肉绝配", image_url: "https://images.unsplash.com/photo-1610444391690-3490710fc9ba?w=600&auto=format&fit=crop", likes: 168, dislikes: 12 }
        ];

        const requests = seedData.map(item => ({
            type: "execute",
            stmt: {
                sql: `INSERT OR REPLACE INTO products (dutch_name, chinese_name, category, is_recommended, insight, pairing, warning, alternatives, features, image_url, likes, dislikes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    { type: "text", value: String(item.dutch_name) }, { type: "text", value: String(item.chinese_name) },
                    { type: "text", value: String(item.category) }, { type: "integer", value: item.is_recommended ? "1" : "0" },
                    { type: "text", value: String(item.insight) }, { type: "text", value: String(item.pairing) },
                    { type: "text", value: String(item.warning) }, { type: "text", value: String(item.alternatives) },
                    { type: "text", value: String(item.features) }, { type: "text", value: String(item.image_url) },
                    { type: "integer", value: parseInt(item.likes) }, { type: "integer", value: parseInt(item.dislikes) }
                ]
            }
        }));
        requests.push({ type: "close" });

        const response = await fetch(`${dbUrl}/v2/pipeline`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ requests })
        });

        const result = await response.json();
        if (result.results[0].type === 'error') throw new Error(result.results[0].error.message);

        return new Response(JSON.stringify({ success: true, message: '🎉 成功！种子数据已注入！去看看榜单吧！' }), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }});
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }
}
