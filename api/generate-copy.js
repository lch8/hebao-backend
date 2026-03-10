// api/generate-copy.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: '只允许 POST' }), { status: 405 });

    try {
        const { keyword, type } = await req.json();
        const deepseekKey = process.env.DEEPSEEK_API_KEY;
        const today = new Date().toISOString().split('T')[0];
        let prompt = "";

        if (type === 'idle') {
            const format = {
                "items": [
                    { "name": "物品1名称", "price": "价格数字" }
                ],
                "location": "阿姆斯特丹/鹿特丹/代尔夫特/海牙/乌特勒支",
                "bargain": "一口价/可小刀/买多可刀",
                "payment": "Tikkie/仅限现金/均可",
                "deadline": "YYYY-MM-DD",
                "remark": "提取其他要求"
            };
            prompt = `你是一个智能闲置分拣助手。今天是${today}。\n用户输入："${keyword}"\n请提取物品清单，必须返回纯JSON格式：\n${JSON.stringify(format, null, 2)}`;
        } else if (type === 'help') {
            const format = { "reward": "赏金纯数字", "time": "期待时间", "location": "任务地点", "urgent": "普通 或 十万火急", "copy": "求助正文" };
            prompt = `你是一个悬赏任务助手。\n用户需求："${keyword}"\n必须返回纯JSON：\n${JSON.stringify(format, null, 2)}`;
        } else if (type === 'partner') {
            const format = { "title": "吸引人的标题", "date": "YYYY-MM-DD", "location": "目标地点", "mbti": "all 或 e 或 i", "copy": "找搭子正文" };
            prompt = `你是找搭子社交达人。\n用户需求："${keyword}"\n必须返回纯JSON：\n${JSON.stringify(format, null, 2)}`;
        }

        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
            body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], temperature: 0.1, response_format: { type: "json_object" } })
        });
        const dsData = await dsRes.json();
        if (dsData.error) throw new Error(dsData.error.message);

        let aiText = dsData.choices[0].message.content.replace(/```json/gi, '').replace(/```/g, '').trim();
        return new Response(aiText, { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }); }
}
