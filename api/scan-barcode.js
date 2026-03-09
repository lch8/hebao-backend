export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' }});
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: '只允许 POST' }), { status: 405 });

    try {
        const { barcode, userId } = await req.json();
        if (!barcode) throw new Error("条形码去哪了？");

        // 1. 去 Open Food Facts 查荷兰本土商品数据
        const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const offData = await offRes.json();

        if (offData.status !== 1) {
            throw new Error("全球条码库里没找到这玩意，建议直接使用【📸 扫包装排雷】");
        }

        const product = offData.product;
        // 优先取荷兰语名字，没有就取通用名字
        const originName = product.product_name_nl || product.product_name || "未知商品";
        const brand = product.brands || "未知品牌";
        const imageUrl = product.image_url || "https://images.unsplash.com/photo-1544025162-8315ea07659b?q=80&w=600&auto=format&fit=crop";

        // 2. 拿到原始名字后，呼叫 DeepSeek 进行“荷包管家化”翻译
        const deepseekKey = process.env.DEEPSEEK_API_KEY;
        const dsPrompt = `你是一个极度幽默的荷兰华人超市管家。
        用户扫了一个条形码，我们在全网查到了这个商品的基本信息：
        【商品外文名】：${originName}
        【品牌】：${brand}
        【条形码】：${barcode}
        
        请你凭借庞大的知识库，给出符合中国留学生口味的锐评。
        ⚠️ 必须返回纯 JSON 格式：
        {
            "dutch_name": "${originName}",
            "chinese_name": "中文通俗叫法(要接地气，尽量短)",
            "category": "分类(如: 零食/肉类/奶制品)",
            "is_recommended": 1或者0,
            "insight": "一句话锐评(50字内，带emoji)",
            "warning": "避雷警告(如果没有雷就留空)",
            "features": "标签1 | 标签2"
        }`;

        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: dsPrompt }],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        const dsData = await dsRes.json();
        let aiText = dsData.choices[0].message.content;
        aiText = aiText.replace(/```json/gi, '').replace(/```/g, '').trim();
        let finalData = JSON.parse(aiText);

        // 把图和条码塞回去
        finalData.image_url = imageUrl;
        finalData.barcode = barcode;
        finalData.item_type = 'product';

        // 3. 返回给前端
        return new Response(JSON.stringify(finalData), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }});
    }
}
