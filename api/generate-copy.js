// api/generate-copy.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: '只允许 POST' }), { status: 405 });

    try {
        const { keyword } = await req.json();
        const deepseekKey = process.env.DEEPSEEK_API_KEY;
        if (!deepseekKey) return new Response(JSON.stringify({ error: '缺少 DeepSeek 钥匙' }), { status: 500 });

        // 获取荷兰当地的当前日期，供 AI 推算截止日
        const today = new Date().toISOString().split('T')[0];

        // 💡 极品 Prompt：强制 AI 进行字段映射
        const prompt = `你是一个深谙小红书爆款规则的荷兰二手管家。
当前日期是：${today}。
用户用很随意的口语输入了他的发帖需求："${keyword}"

请帮他生成一篇排版精美的转让文案，同时提取出关键的交易条件用于【前端自动填表】。
⚠️ 必须返回纯 JSON 格式（直接以大括号起手，绝不允许带 \`\`\`json 标记）：
{
    "price": "提取总价数字，纯数字（如 40）。没提到则留空",
    "location": "从（阿姆斯特丹/鹿特丹/代尔夫特/海牙/乌特勒支/其他地区）中匹配一个最符合的",
    "bargain": "从（一口价/可小刀/买多可刀）中匹配一个",
    "payment": "从（Tikkie/银行转账 / 仅限现金 / 均可）中匹配一个",
    "deadline": "根据用户的描述推算必须拿走的具体日期(YYYY-MM-DD)。如用户没提，留空",
    "copy": "带有Emoji、分段清晰、包含具体物品状态的小红书体文案正文"
}`;

        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2, // 降低温度以保证枚举项映射的准确性
                response_format: { type: "json_object" }
            })
        });

        const dsData = await dsRes.json();
        if (dsData.error) throw new Error(dsData.error.message);

        let aiText = dsData.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
        return new Response(aiText, { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    } catch(e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
