// api/generate-copy.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: '只允许 POST' }), { status: 405 });

    try {
        const { keyword, type, currentDesc, currentPrice } = await req.json();
        const deepseekKey = process.env.DEEPSEEK_API_KEY;
        if (!deepseekKey) return new Response(JSON.stringify({ error: '缺少 DeepSeek 钥匙' }), { status: 500 });

        const today = new Date().toISOString().split('T')[0];
        let prompt = "";

        // 🧠 闲置跳蚤：支持多物品智能追加与总价计算
        if (type === 'idle') {
            prompt = `你是一个小红书闲置转让文案大师。当前日期：${today}。
            用户刚说了一句话："${keyword}"。
            ${currentDesc ? `注意！用户之前已经添加了这些物品：\n"""${currentDesc}"""\n之前的总价是：${currentPrice}欧。\n请把新物品**追加合并**进去，并计算出【最新的总价】！` : '这是用户第一次输入。'}
            
            必须返回纯 JSON：
            {
                "price": "提取并计算总价(纯数字)。比如之前30，这次15，就填45",
                "location": "从(阿姆斯特丹/鹿特丹/代尔夫特/海牙/乌特勒支/其他地区)中匹配",
                "bargain": "从(一口价/可小刀/买多可刀)中匹配",
                "payment": "从(Tikkie/仅限现金/均可)中匹配",
                "deadline": "推算必须拿走的具体日期YYYY-MM-DD",
                "copy": "生成带有Emoji、分段清晰、呈【清单体】的转让文案正文"
            }`;
        } 
        // 🧠 互助悬赏
        else if (type === 'help') {
            prompt = `你是一个悬赏任务发布助手。当前日期：${today}。
            用户需求："${keyword}"
            必须返回纯 JSON：
            {
                "reward": "提取赏金纯数字，没提到填0",
                "time": "提取期待的执行时间，格式: YYYY-MM-DDTHH:mm (例如 2026-03-12T08:00)",
                "location": "提取任务地点(越具体越好)",
                "urgent": "判断是否十万火急，返回 '普通' 或 '十万火急'",
                "copy": "生成一段诚恳的求助描述正文"
            }`;
        } 
        // 🧠 找搭子
        else if (type === 'partner') {
            prompt = `你是一个找搭子社交达人。当前日期：${today}。
            用户需求："${keyword}"
            必须返回纯 JSON：
            {
                "title": "生成一句极其吸引人的标题(15字内)",
                "date": "提取计划日期，格式: YYYY-MM-DD",
                "location": "提取目标地点",
                "mbti": "返回 'all' (不限), 'e' (只找E人), 或 'i' (只找I人)",
                "copy": "生成一段充满感情、让人想立刻私信你的找搭子文案"
            }`;
        }

        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2, 
                response_format: { type: "json_object" }
            })
        });

        const dsData = await dsRes.json();
        let aiText = dsData.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
        return new Response(aiText, { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    } catch(e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }
}                messages: [{ role: 'user', content: prompt }],
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
