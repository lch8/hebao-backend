// seed.js - 荷包管家初始数据“造物主”脚本
// ⚠️ 运行前请确保你的 Node.js 版本在 18 以上（原生支持 fetch）

// 1. 替换成你真实的 Turso 凭证
const DB_URL = 'https://hebao-db-lch8.aws-eu-west-1.turso.io'; // 注意：把 libsql:// 换成 https://
const AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzI2NjAyNzgsImlkIjoiN2JlNjA1NzctOGIxZC00MDRiLWI4NGItZTVjNDdhOTI4MzNjIiwicmlkIjoiZDQ0YThjMWEtODU5Ny00ZTMzLTljNGMtNWFiYjNmNjg0OWI1In0.7DuXzQrxWJFO3fmuyTsi1KKrNjCbLg2lw2N2J2ST_Dx9w6NDlJXJYy9fSOVxkidbqosMkt126dPBXeQ-bRTrCA';

// 2. 准备种子数据 (这里我先帮你写好了 6 个最经典的“神级/魔鬼”单品)
const seedData = [
    {
        dutch_name: "Varkensbuik",
        chinese_name: "AH神仙五花肉",
        category: "肉类生鲜",
        is_recommended: 1,
        insight: "这玩意儿看着肥，烤出来能香迷糊整个楼层！",
        pairing: "🧑‍🍳 网友点评 [👍 推荐]：\n【必备调料】烧烤料、孜然、生抽\n\n【极简步骤】\n1. 切成厚片，用生抽腌制15分钟。\n2. 空气炸锅垫锡纸，200度烤15分钟。\n3. 中途翻面撒烧烤料，肥油全被烤出来了，绝杀！",
        warning: "记得垫一层锡纸，不然洗锅洗到你哭。",
        alternatives: "Lidl的五花肉更便宜但带皮，容易崩。",
        features: "空气炸锅必备 | 宿舍销魂",
        image_url: "https://images.unsplash.com/photo-1606850780554-b55ea40f0ebb?w=600&auto=format&fit=crop", // 假装是烤肉网图
        likes: 185,    // 💥 重点：直接制造出几百人点赞的假象！
        dislikes: 2
    },
    {
        dutch_name: "Drop",
        chinese_name: "荷兰甘草糖",
        category: "零食",
        is_recommended: 0,
        insight: "纯纯大冤种，买来整蛊室友必备。",
        pairing: "🧑‍🍳 网友点评 [💣 避雷]：\n超市结账时顺手拿了一包，回宿舍吃第一口以为自己嚼了一块泡过八角大料的废旧汽车轮胎。当场吐了，千万别碰！",
        warning: "极度危险，吃一口想退学。",
        alternatives: "Haribo正常小熊软糖",
        features: "暗黑料理 | 轮胎味",
        image_url: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop", 
        likes: 5,
        dislikes: 298  // 💥 踩的数量极高，稳居冥场面榜首
    },
    {
        dutch_name: "Karnemelk",
        chinese_name: "脱脂酪乳 (假酸奶/牛奶)",
        category: "饮品",
        is_recommended: 0,
        insight: "不要看它长得像牛奶，那是馊水！",
        pairing: "🧑‍🍳 网友点评 [💣 避雷]：\n刚来荷兰不懂荷兰语，以为是全脂牛奶买回去大喝一口，酸倒牙了！味道就像是在常温下放了三天馊掉的洗碗水。",
        warning: "认准包装上的'Karnemelk'，看到快跑。",
        alternatives: "Volle Melk (全脂牛奶) 或 Yoghurt (正常酸奶)",
        features: "新手杀手 | 极致酸爽",
        image_url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop",
        likes: 2,
        dislikes: 215
    },
    {
        dutch_name: "Verse Pesto",
        chinese_name: "冷鲜区青酱",
        category: "调料/酱料",
        is_recommended: 1,
        insight: "别买玻璃瓶装的，买冷鲜区的，味道天差地别！",
        pairing: "🧑‍🍳 网友点评 [👍 推荐]：\n【极简步骤】\n1. 煮一把意面捞出。\n2. 直接挖两勺这个新鲜青酱拌匀。\n3. 撒点小番茄，三分钟搞定一顿米其林级别的糊弄学午餐！",
        warning: "保质期很短，开盖后几天内吃完。",
        alternatives: "本赛道无敌，千万别买常温货架的罐装青酱。",
        features: "有手就行 | 意面灵魂",
        image_url: "https://images.unsplash.com/photo-1596796960163-f018e7c2e365?w=600&auto=format&fit=crop",
        likes: 142,
        dislikes: 1
    },
    {
        dutch_name: "Kibbeling",
        chinese_name: "荷兰炸鱼块",
        category: "熟食/海鲜",
        is_recommended: 1,
        insight: "荷兰少有的符合中国胃的神仙小吃！",
        pairing: "🧑‍🍳 网友点评 [👍 推荐]：\n外酥里嫩，超市鱼摊或者外面早市都有卖。买的时候一定要跟老板说加蒜蓉酱（Knoflooksaus）！趁热吃，一口一个停不下来。",
        warning: "买超市冷藏的回家用空气炸锅复热，微波炉热会软趴趴。",
        alternatives: "Lekkerbekje (整条炸鱼，但有刺)",
        features: "国民小吃 | 外酥里嫩",
        image_url: "https://images.unsplash.com/photo-1599084942896-67b1bf0525d8?w=600&auto=format&fit=crop",
        likes: 201,
        dislikes: 4
    },
    {
        dutch_name: "Verse Zuurkool",
        chinese_name: "荷兰袋装酸菜",
        category: "蔬菜",
        is_recommended: 1,
        insight: "东北留学生狂喜，完美平替翠花酸菜！",
        pairing: "🧑‍🍳 网友点评 [👍 推荐]：\n谁懂啊！在AH冷鲜区找到了这种袋装酸菜，切点超市的五花肉片，加点粉条一锅炖，酸爽开胃，冬天吃简直续命！",
        warning: "下锅前记得多洗两遍，不然真的太酸了。",
        alternatives: "无，这是全荷兰最像东北酸菜的东西",
        features: "东北之光 | 炖肉绝配",
        image_url: "https://images.unsplash.com/photo-1610444391690-3490710fc9ba?w=600&auto=format&fit=crop",
        likes: 168,
        dislikes: 12
    }
];

async function injectData() {
    console.log("🚀 开始向 Turso 数据库批量注入种子数据...");

    // 构造 Turso 批量请求语句
    const requests = seedData.map(item => ({
        type: "execute",
        stmt: {
            sql: `INSERT OR REPLACE INTO products 
                  (dutch_name, chinese_name, category, is_recommended, insight, pairing, warning, alternatives, features, image_url, likes, dislikes) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                { type: "text", value: String(item.dutch_name) },
                { type: "text", value: String(item.chinese_name) },
                { type: "text", value: String(item.category) },
                { type: "integer", value: item.is_recommended ? "1" : "0" },
                { type: "text", value: String(item.insight) },
                { type: "text", value: String(item.pairing) },
                { type: "text", value: String(item.warning) },
                { type: "text", value: String(item.alternatives) },
                { type: "text", value: String(item.features) },
                { type: "text", value: String(item.image_url) },
                { type: "integer", value: String(item.likes) },
                { type: "integer", value: String(item.dislikes) }
            ]
        }
    }));

    // 别忘了告诉 Turso 关门
    requests.push({ type: "close" });

    try {
        const response = await fetch(`${DB_URL}/v2/pipeline`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ requests })
        });

        const result = await response.json();

        if (response.ok && (!result.results[0] || result.results[0].type !== 'error')) {
            console.log(`✅ 成功！已强制注入 ${seedData.length} 条爆款数据到榜单！`);
            console.log("🔥 快打开你的网页，去【榜单】页面看看吧！");
        } else {
            console.error("❌ 注入失败，Turso 报错了：", result.results[0]?.error?.message || result);
        }
    } catch (error) {
        console.error("❌ 网络请求崩溃了：", error.message);
    }
}

injectData();
