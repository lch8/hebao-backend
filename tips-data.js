// ==========================================
// 💰 荷包管家 - 省钱秘籍专属数据仓库
// 💡 魔法提示：在文字两边加上 **双星号**，网页会自动把它变成【高亮标注】！比如：**免费**
// ==========================================

// 1. 顶部横向滑动的【快捷直达】
const quickLinksData = [
    { url: "https://www.ah.nl/bonus", icon: "🛒", title: "AH Bonus", sub: "本周特价全在这里" },
    { url: "https://www.jumbo.com/aanbiedingen", icon: "🐘", title: "Jumbo 特价", sub: "打折专区官方直达" },
    { url: "https://www.dirk.nl/aanbiedingen", icon: "💙", title: "Dirk 电子报", sub: "平价战神每周上新" }
];

// 2. 核心省钱手风琴卡片数据
const tipsData = [
    {
        categoryIcon: "🛒",
        categoryName: "超市盲盒与羊毛",
        highlight: "必看", // 如果不需要红色高亮，删掉这行即可
        stores: [
            {
                storeLogo: "🟦",
                storeName: "Albert Heijn (AH)",
                tips: [
                    { title: "📈 Koopzegels 电子邮票理财", desc: "去 App 里开启，买单时每消费 1 欧会自动买 0.1 欧的邮票。集满 49 欧可提现 52 欧，**年化收益率高达 6%**，比存在 ABN 银行划算 10 倍！" },
                    { title: "🎁 Mijn Bonus Box 自选特价", desc: "务必每周五打开 App，系统会根据你的购买习惯生成几十个商品，你可以**手动勾选 5 个**作为下周的专属打折款，经常能刷出高频刚需肉奶。" },
                    { title: "🏷️ 35% 临期动态贴纸", desc: "每天**晚上 19:00 后**去逛冷鲜肉区和烘焙区，认准黄底黑字的 35% 贴纸。买高档牛排和三文鱼的最佳时机，买回去直接扔冷冻室。" },
                    { title: "📦 Overblijvers 剩菜盲盒", desc: "每天下午在 App 里拼手速抢，**4.95欧买15欧**的面包或冷鲜肉盲盒。拿回家第二天吃或者分装冷冻，绝对吃不坏肚子。" }
                ]
            },
            {
                storeLogo: "🟨",
                storeName: "Jumbo 隐藏规则",
                tips: [
                    { title: "✨ 新鲜度霸王条款", desc: "如果在货架上发现了**今天到期 (Vandaag Datum)** 的商品，拿给店员，有极大概率免费换同款新鲜的（注：部分门店可能已不执行，可大胆尝试）。" },
                    { title: "❌ 排队免单已成历史", desc: "以前著名的“排队第四个全单免费”条款，**目前已在绝大部分 Jumbo 门店取消**，大家千万别再去傻傻排队等免单了，容易社死！" },
                    { title: "💳 Extra's 积分换大件", desc: "结账必扫码。攒够积分直接在 App 里兑换**免费洗衣液、卫生纸**，或者一大盒高档冷鲜鱼。" }
                ]
            },
            {
                storeLogo: "🛒",
                storeName: "平价战神 & 亚超",
                tips: [
                    { title: "🐼 东方行 (Amazing Oriental)", desc: "办张会员卡。平时别去买生鲜，认准**每周三的新鲜蔬菜日**，这时候买空心菜、上海青等绿叶菜最新鲜且打折。" },
                    { title: "💙 Dirk 穷鬼面包盲盒", desc: "在 Too Good To Go App 上抢 Dirk 的魔法盲盒。只要 **2.99 欧**，给你塞满两大塑料袋面包，切片放冰箱够吃半个月。" },
                    { title: "🍩 Lidl Plus 每周白嫖", desc: "必须下 App。除了基础菜价极低，每周系统会派发“免费送蓝莓/小零食”券，结账前**务必手动点击激活**才有效。" }
                ]
            }
        ]
    },
    {
        categoryIcon: "👗",
        categoryName: "服饰鞋包神技",
        stores: [
            {
                storeLogo: "👠",
                storeName: "Zalando & Lounge",
                tips: [
                    { title: "⚡ Lounge 黄金截胡法", desc: "每天早 7 点抢名牌 2 折。如果心仪款显示无货，**定个 20 分钟闹钟**。因为购物车保护期是 20 分钟，别人没付款超时释放的瞬间狂刷，就能抢到弃单！" },
                    { title: "📦 Zalando 100天白嫖退货", desc: "主站支持 **100 天内无理由退货**（只要没剪吊牌）。遇到换季打折，可以先把不确定尺码的款全买回来试，不合适的免费退回。" }
                ]
            },
            {
                storeLogo: "♻️",
                storeName: "Vinted 欧洲闲鱼",
                tips: [
                    { title: "🔪 屠龙刀砍价与筛选", desc: "过滤只选**“全新带吊牌”**。看到喜欢的千万别直接买，用“出价(Bod)”功能按标价 **7-8折砍**，大部分法国西班牙卖家都会爽快同意。" },
                    { title: "🚚 避开邮费刺客", desc: "结账时绝对不要选送货上门(DHL Thuis)。手动选择送到离你最近的包裹驿站（Mondial Relay 等），邮费会从 6 欧直降到 **2.99 欧**。" }
                ]
            },
            {
                storeLogo: "🏬",
                storeName: "线下商场与特卖",
                tips: [
                    { title: "🛍️ TK Maxx 认准金标", desc: "杂牌没法看，进门直奔二楼找 **Gold Label (金标区)**。这里全是大牌和设计师品牌的 3-4 折。最佳扫货时间是周三/周四上午刚补货时。" },
                    { title: "👜 Roermond 打折村 VIP", desc: "去之前务必在官网免费注册 Fashion Club。到了服务中心凭二维码能领一张 **额外 10% 优惠卡**，在买单时折上折极其暴力。" },
                    { title: "🎓 学生外挂双雄", desc: "用大学邮箱注册 **UNiDAYS** 或 **StudentBeans**。买 Nike、Levi's 结账前去搜折扣码，经常能叠加出额外 20% 的逆天神价。" }
                ]
            }
        ]
    },
    {
        categoryIcon: "🚄",
        categoryName: "出行玩乐必备",
        stores: [
            {
                storeLogo: "🚆",
                storeName: "NS 火车 & 交通",
                tips: [
                    { title: "🎫 Flex Dal Voordeel 打折卡", desc: "每月约 5.6 欧，换来周末全天和工作日非高峰期**全部 6 折**！没这张卡在荷兰出行会原地破产。" },
                    { title: "🤝 Groepsticket 组团神票", desc: "凑够 4-7 人出行，在 NS 官网买团队票，无论去荷兰哪里，单程**平均只需 8 欧**，去远门必用。" },
                    { title: "☕ Spoordeelwinkel 特价商城", desc: "NS 官方活动商城。经常有 **往返车票 + 热咖啡 + 三明治 = 19欧** 的神仙套餐，比单买车票便宜一半。" }
                ]
            },
            {
                storeLogo: "🎉",
                storeName: "吃喝玩乐平台",
                tips: [
                    { title: "🎟️ Social Deal 荷兰美团", desc: "吃饭、卡丁车、理发全都有 **3-5 折特价券**，去餐厅或者游乐场之前先搜有没有团购，切忌直接进店当冤大头。" },
                    { title: "🍴 TheFork 订座半价", desc: "高端餐厅订座神器。筛选带有 **“50% off”** 的餐厅，只要按时去吃，所有食物（不含酒水）直接半价，请客首选。" },
                    { title: "🏛️ Museumkaart 博物馆卡", desc: "75欧一年，全荷兰 **400 多家博物馆随便进**。去两三次国家博物馆就直接回本，还能免费上洗手间。" }
                ]
            }
        ]
    },
    {
        categoryIcon: "🧴",
        categoryName: "日化生活捡漏",
        stores: [
            {
                storeLogo: "🧼",
                storeName: "药妆保健双雄",
                tips: [
                    { title: "🧴 Kruidvat 1+1 铁律", desc: "洗发水、牙膏、洗衣凝珠**绝不在超市买**。死等每月的 **1+1 Gratis (买一送一)** 或 2+2 活动时再疯狂囤货。" },
                    { title: "💊 花园店 Penny Sale", desc: "买鱼油去 Holland & Barrett。等一年几次的 **Penny Sale** 狂欢节，只要多加 1 分钱，就能拿走第二件同款！" }
                ]
            },
            {
                storeLogo: "🛠️",
                storeName: "家居家装二手",
                tips: [
                    { title: "🛒 Action 穷鬼快乐屋", desc: "需要锅碗瓢盆、收纳盒、充电线？无脑直奔 Action。价格通常是别处的 **三分之一** 甚至更低。" },
                    { title: "🛋️ Kringloopwinkel 二手探宝", desc: "刚租房的新生必去，全网最便宜！**2欧的高级骨瓷盘**、10欧的实木书桌全靠在这里淘。" },
                    { title: "☕ IKEA Family 免费咖啡", desc: "注册免费的宜家家庭会员，周一到周五去餐厅吃饭，能凭会员码 **免费喝一杯热茶或咖啡**。" }
                ]
            }
        ]
    }
];
