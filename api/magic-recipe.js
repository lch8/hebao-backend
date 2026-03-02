export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST' }});
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: '只允许 POST' }), { status: 405 });

    try {
        const { imageBase64, type } = await req.json();
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) return new Response(JSON.stringify({ error: '缺少 Gemini 钥匙' }), { status: 500 });

        // 🎯 灵魂级 Prompt：兼顾“生食材”和“熟菜品”双模式
        const prompt = `你是一个极具幽默感、专为荷兰华人留学生服务的“糊弄学AI厨神”。
        用户刚刚上传了一张【${type === 'ingredient' ? '未经烹饪的生食材' : '做好的熟食/网图'}】。
        
        你的任务：
        1. 如果是生食材：教我怎么用最懒、最中式的方法把它做熟（首选空气炸锅、微波炉或一锅乱炖）。
        2. 如果是熟美食：帮我逆向破解它的做法，教我在宿舍怎么低成本复刻。

        ⚠️ 为了兼容现有系统，请【必须严格】返回以下纯 JSON 格式（不要Markdown标记）：
        {
          "dutch_name": "核心食材的荷兰文或英文名 (如: Varkensbuik / Pasta)",
          "chinese_name": "给这道菜起个霸气带梗的中文名 (如: 宿舍销魂爆烤五花肉)",
          "category": "AI神仙菜谱",
          "is_recommended": true,
          "features": "🌟 限15字 (如: 空气炸锅10分钟 | 有手就行)",
          "insight": "一句毒舌又诱人的锐评，限30字 (如: 这玩意儿看着丑，烤出来能香迷糊整个宿舍！)",
          "warning": "",
          "pairing": "🧑‍🍳 网友点评 [👍 推荐]：【所需厨具/调料】写几句必备品... \\n【极简步骤】1. XX \\n2. XX \\n3. XX \\n（必须用换行符 \\\\n 排版，语气要像网友安利一样狂热！）"
        }`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [ { text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } } ] }],
                generationConfig: { temperature: 0.7, responseMimeType: "application/json" }
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || '大厨罢工了');

        let textStr = data.candidates[0].content.parts[0].text;
        textStr = textStr.replace(/```json/g, '').replace(/```/g, '').trim();

        return new Response(textStr, { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    }
}
