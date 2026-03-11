export const config = {
    runtime: 'edge', // 开启边缘计算，让 AI 响应极速拉满
};

export default async function handler(req) {
    // 1. 处理跨域请求 (CORS)
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: '只允许 POST 请求' }), { status: 405 });
    }

    try {
        // 从前端接收传过来的参数（包含 base64 图片和类型：生食材/熟菜品）
        const { imageBase64, type, userId } = await req.json();
        
        // 读取 Vercel 环境变量里的 Gemini 密钥
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            return new Response(JSON.stringify({ error: '后台找不到 Gemini 密钥，管家罢工了' }), { status: 500 });
        }

        // 2. 🎯 核心逻辑：根据用户点击的按钮，切换大厨的“人格”和“任务”
        let conditionPrompt = "";
        if (type === 'ingredient') {
            conditionPrompt = `用户上传了一张【未经烹饪的生食材】。请你认出这是什么，并教我怎么用最懒、最中式的方法把它做熟（首选空气炸锅、微波炉、电饭煲或一锅乱炖，千万别搞复杂的法餐）。`;
        } else {
            conditionPrompt = `用户上传了一张【做好的熟食/美食网图】。请帮我逆向破解它的做法，教我在留学生宿舍怎么用最平价的超市食材把它复刻出来。`;
        }

        // 3. 🪄 瞒天过海的 JSON 模板：强行适配前端 UI
        const fullPrompt = `你是一个极具幽默感、专为荷兰华人留学生服务的“糊弄学AI厨神”。
        ${conditionPrompt}

        ⚠️ 警告：为了兼容前端系统，你【必须严格】返回以下纯 JSON 格式（不要包含任何 Markdown 代码块标记如 \`\`\`json）：
        {
          "dutch_name": "核心食材的荷兰文或英文名 (如: Varkensbuik / Bloemkool)",
          "chinese_name": "给这道菜起个霸气带梗的中文名 (如: 宿舍销魂爆烤五花肉 / 穷鬼救星番茄意面)",
          "category": "AI神仙菜谱",
          "is_recommended": true,
          "features": "🌟 限15字 (如: 空气炸锅10分钟 | 有手就行)",
          "insight": "一句毒舌又诱人的厨神锐评，限30字 (如: 这玩意儿看着丑，烤出来能香迷糊整个楼层！)",
          "warning": "避坑提示 (如: 记得垫一层锡纸，不然洗锅洗到你哭)，如果没有可留空",
          "pairing": "🧑‍🍳 网友点评 [👍 推荐]：\\n【所需厨具/调料】写几句必备品... \\n\\n【极简步骤】\\n1. XX \\n2. XX \\n3. XX \\n（注意：必须严格以这句'网友点评'开头，并且使用 \\\\n 进行换行排版，语气要像室友强力安利一样狂热！）"
        }`;

        // 4. 发送给强大的视觉多模态大模型
        // 这里推荐使用 gemini-2.5-flash，速度极快且视觉极其精准
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: fullPrompt },
                        { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
                    ]
                }],
                generationConfig: {
                    temperature: 0.7, // 稍微高一点，让起名和锐评更有趣
                    responseMimeType: "application/json" // 强迫大模型输出 JSON
                }
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'Gemini 视觉 API 请求失败');
        }

        // 5. 数据清洗与返回
        let textStr = data.candidates[0].content.parts[0].text;
        textStr = textStr.replace(/```json/gi, '').replace(/```/g, '').trim();

        return new Response(textStr, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Magic Recipe Error:', error);
        return new Response(JSON.stringify({ error: error.message || '厨神大脑短路了' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
