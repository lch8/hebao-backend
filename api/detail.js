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

        let realReviews = [];
        let cachedDetails = null;

        // ==========================================
        // ⚡️ 任务 A：极速并发拉取 (拉取真实评论 + 拉取商品深度缓存)
        // ==========================================
        if (dbUrl && authToken) {
            try {
                const tursoRes = await fetch(`${dbUrl}/v2/pipeline`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requests: [
                            // 1. 查高赞真实评论
                            { type: "execute", stmt: { 
                                sql: "SELECT author, avatar, content, likes, created_at FROM reviews WHERE dutch_name = ? ORDER BY likes DESC, created_at DESC LIMIT 10", 
                                args: [{ type: "text", value: dutchName }] 
                            }},
                            // 2. 查该商品是否已经被 DeepSeek 分析过并缓存了！
                            { type: "execute", stmt: {
                                sql: "SELECT methods, recipe_desc, alternatives FROM products WHERE dutch_name = ? LIMIT 1",
                                args: [{ type: "text", value: dutchName }]
                            }},
                            { type: "close" }
                        ]
                    })
                });
                
                const tursoData = await tursoRes.json();
                
                // 解析评论 (Result 0)
                const reviewsSet = tursoData.results?.[0]?.response?.result;
                if (reviewsSet && reviewsSet.rows) {
                    const cols = reviewsSet.cols.map(c => c.name);
                    realReviews = reviewsSet.rows.map(row => {
                        const getVal = (cName) => row[cols.indexOf(cName)]?.value;
                        const dateStr = getVal('created_at');
                        return {
                            author: getVal('author'), avatar: getVal('avatar'), content: getVal('content'),
                            likes: getVal('likes') || 0, date: dateStr ? dateStr.split(' ')[0] : '刚刚'
                        };
                    });
                }

                // 解析商品深度缓存 (Result 1)
                const productSet = tursoData.results?.[1]?.response?.result;
                if (productSet && productSet.rows && productSet.rows.length > 0) {
                    const cols = productSet.cols.map(c => c.name);
                    const rowData = productSet.rows[0];
                    const getVal = (colName) => {
                        const idx = cols.indexOf(colName);
                        return idx !== -1 && rowData[idx] ? rowData[idx].value : null;
                    };
                    
                    const methodsStr = getVal('methods');
                    const recipeDesc = getVal('recipe_desc');
                    const altsStr = getVal('alternatives');

                    // 💡 如果之前有人扫过，这里就一定有数据，直接装填进缓存对象！
                    if (methodsStr || recipeDesc || altsStr) {
                        cachedDetails = {
                            methods: methodsStr ? JSON.parse(methodsStr) : [],
                            recipe_desc: recipeDesc || "",
                            alternatives: altsStr ? JSON.parse(altsStr) : []
                        };
                    }
                }
            } catch(e) { console.error("拉取数据库失败:", e); }
        }

        // ==========================================
        // 🎯 核心提速拦截：如果有缓存，拼接评论后直接秒回！(跳过 DeepSeek)
        // ==========================================
        if (cachedDetails) {
            cachedDetails.reviews = realReviews;
            return new Response(JSON.stringify(cachedDetails), {
                status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // ==========================================
        // 🧠 任务 B：没有缓存，苦力 DeepSeek 开始干活
        // ==========================================
        const typeInstruction = isNonFood 
            ? "这是一个【非食品/日化类】商品。methods写具体使用方法（如：戴手套擦拭），recipe_desc写使用避坑指南（如：不要接触食物）。" 
            : "这是一个【食品】。methods写烹饪方法（如：空气炸锅），recipe_desc写神仙搭配。";

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
                messages: [{ role: 'system', content: dsSystemPrompt }, { role: 'user', content: dsUserPrompt }],
                temperature: 0.3,
                response_format: { type: "json_object" } 
            })
        });

        const dsData = await dsRes.json();
        if (!dsRes.ok) throw new Error("DeepSeek 深度报告罢工：" + (dsData.error?.message || '未知错误'));

        let aiText = dsData.choices[0].message.content;
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const match = aiText.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("AI 格式错误，未能生成标准 JSON");

        const finalResult = JSON.parse(match[0]);

        // ==========================================
        // 🗄️ 任务 C：将 DeepSeek 结果写入数据库缓存 (造福全网后续用户)
        // ==========================================
        if (dbUrl && authToken) {
            try {
                // ⚠️ 这里必须保留 await，防止 Vercel Edge 拔电源断杀
                await fetch(`${dbUrl}/v2/pipeline`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requests: [
                            { type: "execute", stmt: { 
                                sql: "UPDATE products SET methods = ?, recipe_desc = ?, alternatives = ? WHERE dutch_name = ?", 
                                args: [
                                    { type: "text", value: JSON.stringify(finalResult.methods || []) },
                                    { type: "text", value: String(finalResult.recipe_desc || "") },
                                    { type: "text", value: JSON.stringify(finalResult.alternatives || []) },
                                    { type: "text", value: String(dutchName) }
                                ] 
                            }},
                            { type: "close" }
                        ]
                    })
                });
            } catch (e) { console.error("更新深度缓存失败:", e); }
        }

        // 把真实评论挂载上去，最终返回
        finalResult.reviews = realReviews;

        return new Response(JSON.stringify(finalResult), {
            status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
