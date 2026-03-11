export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: '只允许 POST 请求' }), { status: 405 });
    }

    try {
        const { productName, insight, question } = await req.json();
        const deepseekKey = process.env.DEEPSEEK_API_KEY;

        if (!deepseekKey) {
            return new Response(JSON.stringify({ error: '缺少 DeepSeek 钥匙' }), { status: 500 });
        }

        // 💡 极品 Prompt 设计：给 AI 设定死上下文，并且限制废话！
        const systemPrompt = `你是一个极度幽默的荷兰华人超市导购"荷包管家"。
        用户正在看商品：【${productName}】。你之前的评价是：【${insight}】。
        请简短、一针见血地回答用户的追加提问。
        要求：
        1. 必须带 emoji，态度极其热情。
        2. 如果用户问了和购物完全无关的奇葩问题（比如算数学题、写代码），请幽默地拒绝并拉回超市话题。
        3. 答案控制在 50 个字以内，绝不啰嗦！`;

        const userPrompt = `用户的追问是：${question}`;

        // 唤醒 DeepSeek
        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deepseekKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7
            })
        });

        const dsData = await dsRes.json();
        if (!dsRes.ok) throw new Error("聊天大脑罢工：" + (dsData.error?.message || '未知错误'));

        // 返回 AI 的精简回答
        const reply = dsData.choices[0].message.content;

        return new Response(JSON.stringify({ reply: reply }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}
