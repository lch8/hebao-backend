// ==========================================
// 📂 文件路径: js/data/daily-cards.js
// 荷兰风情图鉴：包含绝美风景、硬核文化、生存避雷
// ==========================================
window.App = window.App || {};

window.App.dailyCardsData = [
    // ----------------- 第一期：初见荷村 -----------------
    {
        id: 'c001',
        tag: '#宝藏小镇',
        title: '羊角村 (Giethoorn)',
        imgUrl: 'https://images.unsplash.com/photo-1517480112102-127e7f7ce19b?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', 
        crop: 'center 20%',
        desc: '<b>🇳🇱 被称为「荷兰威尼斯」的无路之城</b><br><br>这里真的连一条汽车公路都没有！出行全靠纵横交错的运河和 176 座古老的木桥。在这里，连邮差都是开着小船送信的。<br><br>💡 <b>管家Tips：</b>等安顿好了，一定要选个非周末的清晨去。租一艘小木船（Punter），在芦苇荡和茅草屋之间穿梭，去吸一次纯度 100% 的负氧离子！'
    },
    {
        id: 'c002',
        tag: '#生存必修',
        title: 'Tikkie：荷兰人的AA制神话',
        imgUrl: 'https://images.unsplash.com/photo-1580519542036-ed47f3e42214?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center',
        desc: '<b>💸 哪怕是 0.5 欧，也要给你发个收款链接</b><br><br>“Going Dutch (AA制)” 在荷兰绝对不是一句玩笑话。在这里，朋友聚餐、买杯咖啡、甚至借一张打印纸，对方都可能在事后给你发来一个名为 <b>Tikkie</b> 的收款链接。<br><br>💡 <b>管家解读：</b>不要觉得他们抠门！这其实是极度实用的契约精神。收到 Tikkie 爽快付掉，是融入荷兰社交圈的第一步。'
    },
    {
        id: 'c003',
        tag: '#硬核日常',
        title: '自行车拥有绝对路权',
        imgUrl: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center 60%',
        desc: '<b>🚲 撞倒你的绝不是汽车，而是飞驰的单车</b><br><br>荷兰人均拥有 1.3 辆自行车。在这里，红色铺装的自行车道神圣不可侵犯！荷兰人的骑车速度极快，且极度厌恶行人在自行车道上逗留。<br><br>💡 <b>管家警告：</b>过马路时，如果没看红绿灯，汽车绝对会让你，但自行车骑手绝对会按着清脆的车铃，并从你身边呼啸而过（可能还伴随一句荷兰国骂）。'
    },
    {
        id: 'c004',
        tag: '#狂欢节日',
        title: '国王节 (King\'s Day)',
        imgUrl: 'https://images.unsplash.com/photo-1533222481259-ce20eda1e20b?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center 30%',
        desc: '<b>👑 全民陷入橙色癫狂的一天</b><br><br>每年 4 月 27 日，是为了庆祝国王威廉·亚历山大的生日。这一天，整个荷兰会化身为极度癫狂的「橙色海洋」。<br><br>运河里塞满了放着震耳欲聋电音的游船，所有人都在街上狂舞。最棒的是，这也是全年中唯一一天可以<b>合法无证摆摊 (Vrijmarkt)</b> 的日子，全城都在卖二手货，堪称终极跳蚤市场！'
    },
    {
        id: 'c005',
        tag: '#魔幻天气',
        title: '一天经历四季的「妖风」',
        imgUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center',
        desc: '<b>🌧️ 为什么荷兰人从不打伞？</b><br><br>因为伞在这里活不过三天。由于靠海地势低平，荷兰的阵雨和强风是随机掉落的。你可能前一秒还在享受阳光，下一秒就被冰冷的斜风细雨糊了一脸。<br><br>💡 <b>管家Tips：</b>来荷兰不要买昂贵的雨伞！去买一件超级防风防水的<b>冲锋衣 (Raincoat)</b>，并永远在手机里装好降雨雷达 App (Buienradar)。'
    },
    {
        id: 'c006',
        tag: '#学制揭秘',
        title: '永远拿不到的 10 分',
        imgUrl: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', 
        crop: 'center',
        desc: '<b>🎓 5.5分万岁，多一分浪费</b><br><br>荷兰的考试实行 10 分制，但在学术界有一句古老的魔咒：「10分是给上帝的，9分是给教授的，8分是天才，而我们只要拿到及格的 5.5分 (Voldoende) 就行了」。<br><br>💡 <b>管家安慰：</b>在国内习惯了科科 90 分以上的卷王们，来荷兰看到 7 分千万别哭，这已经是班里的顶级学霸了！'
    },
    {
        id: 'c007',
        tag: '#灵魂词汇',
        title: 'Gezellig：无法翻译的惬意',
        imgUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center 40%',
        desc: '<b>🕯️ 它是荷兰人生活的最高奥义</b><br><br>英语里没有一个词能完美翻译 <b>Gezellig</b>。它不仅仅是 Cozy (舒适)。<br><br>下雨天在昏暗的棕色咖啡馆 (Bruin Café) 点起蜡烛喝热可可是 Gezellig；和老友窝在沙发上分享一包薯片也是 Gezellig。它代表了一种<b>温暖、亲密、让人彻底放松的社交氛围</b>。'
    },
    {
        id: 'c008',
        tag: '#暗黑料理',
        title: 'Drop：荷兰的国民毒药',
        imgUrl: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center',
        desc: '<b>🍬 考验友情的终极武器</b><br><br>这是一种黑黑的、看着像橡皮糖的东西，叫甘草糖 (Drop)。荷兰人一年要吃掉 3200 万公斤！<br><br>它的味道是：<b>浓烈的八角大料味 + 齁咸的海盐味</b>。当热情的荷兰同学递给你一颗黑色糖果时，请深呼吸再放进嘴里。当然，它也是你回国整蛊朋友的绝佳伴手礼！'
    },

    // ----------------- 第二期：进阶探索扩充 -----------------
    {
        id: 'c009',
        tag: '#生猛海鲜',
        title: '生吞鲱鱼 (Haring)',
        imgUrl: 'https://images.unsplash.com/photo-1534057308991-b9b3a578f1b1?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center',
        desc: '<b>🐟 刺身届的泥石流，荷兰街头一霸</b><br><br>每年六月新鲱鱼上市，你会在街头看到极其魔幻的一幕：西装革履的荷兰人仰起头，拎着一条鱼的尾巴，蘸着生洋葱，一整条生鱼直接滑入喉咙！<br><br>💡 <b>管家Tips：</b>口感极其滑嫩，富含 Omega-3。如果你受不了腥味，可以买夹在面包里的鲱鱼三明治 (Broodje haring) 试试水。'
    },
    {
        id: 'c010',
        tag: '#硬核日常',
        title: '进击的巨人国',
        imgUrl: 'https://images.unsplash.com/photo-1524047934617-cb782c24e5f3?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center 10%',
        desc: '<b>🦒 平均身高世界第一的烦恼</b><br><br>荷兰男性的平均身高超过 183cm，女性超过 170cm。据说这是因为他们常年把牛奶当水喝，加上基因选择的结果。<br><br>💡 <b>管家避雷：</b>在荷兰租房，你可能会发现卫生间的镜子只能照到你的头顶；坐在马桶上，双脚可能是悬空的；去超市买顶层的麦片，大概率需要找人帮忙……'
    },
    {
        id: 'c011',
        tag: '#生存必修',
        title: '万能的扑热息痛',
        imgUrl: 'https://images.unsplash.com/photo-1584308666744-24d5e4a169b1?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center',
        desc: '<b>💊 荷兰家庭医生的“包治百病神药”</b><br><br>在荷兰看病，必须先预约家庭医生 (Huisarts/GP)。但无论你是发烧、重感冒还是头痛欲裂，医生永远只会给你开一个处方：<br><br><b>“回家喝水，吃扑热息痛 (Paracetamol)，休息三天”</b>。<br><br>💡 <b>管家Tips：</b>国内带来的消炎药千万别扔，在荷兰不到万不得已，医生是绝对不会给你开抗生素的。'
    },
    {
        id: 'c012',
        tag: '#防吓指南',
        title: '每月一次的防空警报',
        imgUrl: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center 40%',
        desc: '<b>🚨 别慌，不是战争爆发了！</b><br><br>每个月的<b>第一个星期一中午 12:00</b>，全荷兰的室外大喇叭会准时拉响凄厉的警报声 (Luchtalarm)。<br><br>💡 <b>管家科普：</b>这只是国家安全系统的例行测试。如果你在那一天中午 12 点听到警报，淡定喝咖啡就好；但如果是其他时间听到，请立刻关紧门窗，打开电视看新闻！'
    },
    {
        id: 'c013',
        tag: '#艺术瑰宝',
        title: '一卡在手，看遍梵高',
        imgUrl: 'https://images.unsplash.com/photo-1558000143-a6111f185b1a?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center 10%',
        desc: '<b>🎨 全世界博物馆迷的天堂</b><br><br>荷兰面积不大，却拥有极其惊人的博物馆密度。国家博物馆的《夜巡》、梵高博物馆的《向日葵》全在这里。<br><br>💡 <b>管家Tips：</b>刚落地一定要去办一张 <b>博物馆卡 (Museumkaart)</b>！只需 70 多欧，一年内全荷兰近 500 家顶级博物馆随便进，去三次就回本！'
    },
    {
        id: 'c014',
        tag: '#神仙甜点',
        title: '焦糖煎饼 (Stroopwafel)',
        imgUrl: 'https://images.unsplash.com/photo-1621236894086-6ba12c755dd3?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center',
        desc: '<b>☕️ 荷兰少有的正经神仙美食！</b><br><br>两片薄薄的格子华夫饼，中间夹着浓郁拉丝的糖浆。各大超市都能买到，街头现烤的更是灵魂升天。<br><br>💡 <b>管家正宗吃法：</b>泡一杯热茶或热咖啡，把饼干盖在杯口，利用热气把里面的焦糖微微融化，一口咬下去，外酥里软，满嘴生香。'
    },
    {
        id: 'c015',
        tag: '#灵魂风俗',
        title: '厕所里的生日日历',
        imgUrl: 'https://images.unsplash.com/photo-1506784951209-243c490cc5f0?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center',
        desc: '<b>🗓️ 奇特的社交记忆管理法</b><br><br>去荷兰人家里做客，你可能会发现一个极其神秘的现象——他们把亲友的“生日日历”挂在马桶对面的墙上！<br><br>💡 <b>管家解读：</b>据说是因为每天上厕所时都会在这面墙上发呆，所以把日历挂在这里，就绝对不会忘记任何一个亲朋好友的生日。如果你的名字被写上了，说明他们真的把你当自己人了。'
    },
    {
        id: 'c016',
        tag: '#未来之城',
        title: '鹿特丹的赛博朋克',
        imgUrl: 'https://images.unsplash.com/photo-1582296495861-5db0d60ecf6c?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center 20%',
        desc: '<b>🏗️ 二战废墟上建立的建筑实验场</b><br><br>如果你看腻了阿姆斯特丹古老的运河房，一定要去鹿特丹 (Rotterdam) 看看。<br><br>这座城市在二战中被夷为平地，战后反而成了狂野建筑师的天堂：倾斜 45 度的立体方块屋 (Kijk-Kubus)、巨大马蹄形的拱廊市场 (Markthal)，这里充满了赛博朋克般的未来感。'
    },
    {
        id: 'c017',
        tag: '#生存必修',
        title: '空塑料瓶能换钱！',
        imgUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center',
        desc: '<b>♻️ 千万别扔！这是白花花的银子</b><br><br>荷兰实行极其严格的空瓶回收制度 (Statiegeld)。你在超市买带押金标志的塑料瓶水或易拉罐时，结账时会被多扣 0.15 欧的押金。<br><br>💡 <b>管家Tips：</b>喝完千万别扔垃圾桶！拿到超市门口的机器上回收，机器吐出来的票条，能直接抵扣你下一次买菜的钱！'
    },
    {
        id: 'c018',
        tag: '#灵魂风俗',
        title: '荷兰人为什么不拉窗帘？',
        imgUrl: 'https://images.unsplash.com/photo-1549463901-7fa762955e69?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center 10%',
        desc: '<b>🪟 走在街上像在看真人秀楚门的世界</b><br><br>晚上走在荷兰的住宅区，你会发现一楼人家的超大落地窗大敞四开，完全没有拉窗帘。屋里人在看电视、吃饭、甚至辅导作业，你在街上看的一清二楚。<br><br>💡 <b>管家解读：</b>这种文化源于早期的加尔文教派思想：“我为人正直，光明磊落，家里没有什么见不得人的事需要向外界隐藏”。'
    },
    {
        id: 'c019',
        tag: '#交通出行',
        title: '忘了 Check-out 的惨痛代价',
        imgUrl: 'https://images.unsplash.com/photo-1520658428317-0630ea872412?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center',
        desc: '<b>💳 全荷通用的超级黄卡 (OV-chipkaart)</b><br><br>在荷兰，一张小黄卡可以坐遍全境的火车、电车和公交。但它的计费逻辑很特殊：上车刷卡 (Check-in) 时，会直接从卡里扣除 20 欧的乘车押金。<br><br>💡 <b>管家避雷：</b>下车时<b>必须、一定要记得再刷一次卡 (Check-out)</b>！系统才会按实际路程把剩余的钱退给你。如果你忘了刷，那这 20 欧就直接被系统无情吞没了！'
    },
    {
        id: 'c020',
        tag: '#宝藏小镇',
        title: '代尔夫特 (Delft)：蓝陶与名画',
        imgUrl: 'https://images.unsplash.com/photo-1605634563815-564ec5a66bf1?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center',
        desc: '<b>👑 宁静致远的皇家古镇</b><br><br>除了拥有全欧洲顶尖的代尔夫特理工大学 (TU Delft)，这座小镇也是举世闻名的画作《戴珍珠耳环的少女》的作者维米尔的故乡。<br><br>💡 <b>管家科普：</b>这里的特产是“代尔夫特蓝陶 (Delfts Blauw)”。你如果觉得它长得很像中国的青花瓷，没错，它本来就是 17 世纪荷兰东印度公司为了仿制中国瓷器而意外诞生的绝美工艺品！'
    }
];
