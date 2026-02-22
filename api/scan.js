export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: '只允许 POST 请求' }), { status: 405 });
    }

    try {
        const { imageBase64 } = await req.json();
        
        // 拿钥匙
        const geminiKey = process.env.GEMINI_API_KEY; 
        const deepseekKey = process.env.DEEPSEEK_API_KEY;

        if (!geminiKey || !deepseekKey) {
            return new Response(JSON.stringify({ error: 'Vercel 环境变量里缺少 API Key！' }), { status: 500 });
        }

        // ==========================================
        // 🏃‍♂️ 第一棒：Gemini 充当“眼睛”（看图提取荷兰语）
        // ==========================================
        const geminiPrompt = "请提取图片中商品的准确荷兰语名称，并用一句话简述它是什么东西。不要编造，如果看不清请回答'未识别'。";
        
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    parts: [
                        { text: geminiPrompt },
                        { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } } 
                    ] 
                }],
                generationConfig: { temperature: 0.1 } 
            })
        });

        const geminiData = await geminiRes.json();
        if (!geminiRes.ok) throw new Error("Gemini 视觉罢工：" + (geminiData.error?.message || '未知错误'));
        
        const productInfo = geminiData.candidates[0].content.parts[0].text;
        if (productInfo.includes('未识别')) throw new Error("图片太模糊，管家看不清包装上的字！");

        // ==========================================
        // 🏃‍♂️ 第二棒：DeepSeek 充当“大脑”（写段子和排雷）
        // ==========================================
        const dsSystemPrompt = `你是一个极度幽默的荷兰华人超市排雷专家“荷包管家”。
        请根据以下商品信息，严格返回纯 JSON 格式数据（不要带 markdown 标记，直接大括号起手）：
        {
          "dutch_name": "荷兰语商品名",
          "chinese_name": "接地气、好记的中文商品名",
          "category": "商品分类",
          "is_recommended": true或false,
          "insight": "一段幽默且干货满满的评价（口感如何，有没有雷点）",
          "pairing": "神仙吃法或搭配建议",
          "warning": "如果有过敏源、或极度奇怪的荷兰口味（如八角甘草糖），在这里高亮预警，没有则留空"
        }`;

        const dsUserPrompt = `Gemini识别到的商品信息是：${productInfo}。请输出JSON点评。`;

        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deepseekKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: dsSystemPrompt },
                    { role: 'user', content: dsUserPrompt }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" } 
            })
        });

        const dsData = await dsRes.json();
        if (!dsRes.ok) throw new Error("DeepSeek 大脑罢工：" + (dsData.error?.message || '未知错误'));

        // 提取最终 JSON
        let aiText = dsData.choices[0].message.content;
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const match = aiText.match(/\{[\s\S]*\}/);
        
        if (!match) throw new Error("DeepSeek 返回的格式不对");

        // 加入 CORS 头，防止以后微信小程序或其他前端跨域拦截
        return new Response(match[0], {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' 
            }
        });

    } catch (error) {
        console.error("后端崩溃:", error);
        return new Response(JSON.stringify({ error: error.message || '后端处理崩溃了' }), { 
            status: 500,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    }
}
