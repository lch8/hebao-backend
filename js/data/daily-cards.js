// js/data/daily-cards.js
window.App = window.App || {};

// 节日彩蛋库
window.App.holidayCardsData = [
    {
        date: '01-01', id: 'h01', tag: '#新年传统',
        title: '跨年炸球 (Oliebollen)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/2/23/Oliebollen.jpg/960px-Oliebollen.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🎆 荷兰人的"年夜饭"必吃',
        body: '不吃 Oliebollen，在荷兰人眼里这个年就算白过了。这种裹着葡萄干的油炸面团球，每年年底会在街头餐车大量出现，撒上糖粉趁热吃，外酥里软。',
        tip: '跨年夜去大城市广场，餐车长龙从下午就开始排，提早去或者提前在 Thuisbezorgd 预订。'
    },
    {
        date: '04-27', id: 'h02', tag: '#今日限定',
        title: '国王节 (Koningsdag)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/4/43/Koningsdag_Amsterdam_2019_%2833786624178%29.jpg/1280px-Koningsdag_Amsterdam_2019_%2833786624178%29.jpg',
        copyright: '© Wikimedia Commons', crop: 'center 30%',
        hook: '👑 橙色淹没全国的一天',
        body: '4 月 27 日，国王威廉·亚历山大的生日。全荷兰穿橙色衣服、在街头卖二手东西、喝酒跳舞——连运河里都停满了音乐游船。阿姆斯特丹这天人口会暴增 100 万。',
        tip: '提前买好橙色配饰，现场买贵三倍。去跳蚤市场时带好零钱，五欧能淘到惊喜。'
    },
    {
        date: '05-05', id: 'h03', tag: '#国家记忆',
        title: '荷兰解放日 (Bevrijdingsdag)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Bevrijdingsfestival_Wageningen_2012.jpg/1280px-Bevrijdingsfestival_Wageningen_2012.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🕊️ 自由不是理所当然的',
        body: '纪念 1945 年荷兰从纳粹占领中解放。全国 14 座城市同步举办免费的 Bevrijdingsfestival 露天音乐节，有大牌演出、街头表演和各种展览，彻底免费向公众开放。',
        tip: '前一天（5月4日）是哀悼日，晚上 8 点全国默哀两分钟，任何场合都必须严肃对待。'
    },
    {
        date: '12-05', id: 'h04', tag: '#荷兰特供',
        title: '圣尼古拉斯节 (Sinterklaas)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Sinterklaas_2009.jpg/800px-Sinterklaas_2009.jpg',
        copyright: '© Wikimedia Commons', crop: 'center 20%',
        hook: '🎁 比圣诞更重要的荷兰节日',
        body: '12 月 5 日才是荷兰小孩最盼望的节日。白胡子老人 Sinterklaas 骑白马而来，助手们爬烟囱往屋里丢 Pepernoten 姜饼。这晚叫"惊奇之夜 (Pakjesavond)"，家人互送诗意幽默的礼物。',
        tip: '礼物传统叫 Surprises，要把礼物藏进搞笑的包装里并附上讽刺诗，越幽默越好。'
    },
    {
        date: '12-25', id: 'h05', tag: '#温馨冬日',
        title: '圣诞节 (Kerstmis)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/4/42/Kerstmarkt_in_Valkenburg.jpg/1280px-Kerstmarkt_in_Valkenburg.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🎄 Gezellig 的终极体现',
        body: '荷兰圣诞更注重家庭聚会而非购物狂欢。点上蜡烛、开瓶红酒、在餐桌上摆上热腾腾的 Gourmetten（一种多人共用的桌上小烤炉），每个人自己煎肉，边吃边聊几个小时。',
        tip: 'Valkenburg 的地下洞穴圣诞市集是荷兰最独特的节日景点，需要提前买票。'
    }
];

// 日常轮播卡片库
window.App.townCardsData = [
    {
        id: 't01', tag: '#仙境村落', title: '羊角村 (Giethoorn)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/9/90/Giethoorn_-_t_Olde_Maat_Uus.jpg/1280px-Giethoorn_-_t_Olde_Maat_Uus.jpg',
        copyright: '© Wikimedia Commons', crop: 'center 30%',
        hook: '🚤 荷兰威尼斯，无路之城',
        body: '全村没有一条汽车公路，出行全靠纵横交错的运河与小木船。茅草屋配上绣球花，完美复刻了格林童话里的世界。村子很小，走完核心区只需两小时。',
        tip: '租一条无需驾照的小电动船自己开，比跟团便宜一半，还能按自己节奏停靠拍照。旺季提前网上预约。'
    },
    {
        id: 't02', tag: '#世界遗产', title: '小孩堤防 (Kinderdijk)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Windmills_Kinderdijk.jpg/1280px-Windmills_Kinderdijk.jpg',
        copyright: '© Wikimedia Commons', crop: 'center 35%',
        hook: '🌬️ 19 座古老风车的史诗',
        body: '世界文化遗产，保留了 18 世纪建造的 19 座抽水风车群，黄昏时金光打在旋转的风车上，芦苇荡随风起伏。距鹿特丹仅 30 分钟，是荷兰最值得去的一日游目的地之一。',
        tip: '7 月下旬会有风车节，所有风车同时运转，还有传统服装表演。平日周六下午风车也会运转，记得提前查日历。'
    },
    {
        id: 't03', tag: '#皇家静谧', title: '代尔夫特 (Delft)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Delft_-_Nieuwe_Kerk.jpg/800px-Delft_-_Nieuwe_Kerk.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🏺 蓝陶与维米尔的故乡',
        body: '《戴珍珠耳环的少女》的诞生地，也是荷兰王室陵寝所在地。古老的运河房倒映在水中，比阿姆斯特丹多了一份宁静。代尔夫特蓝陶是最正宗的荷兰伴手礼。',
        tip: '皇家代尔夫特工厂 (Royal Delft) 可以参观手工彩绘过程，比景区卖的蓝陶更便宜，还能定制。'
    },
    {
        id: 't04', tag: '#大学之城', title: '乌得勒支 (Utrecht)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/0/04/Oudegracht_Utrecht.jpg/1280px-Oudegracht_Utrecht.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🏰 下沉式运河酒吧的古城',
        body: '荷兰最古老、最活力的大学城之一。这里的运河 Oudegracht 极其特殊——水面低于街道，沿河全是下沉式的地窖咖啡馆，抬头就能看见宏伟的主教塔 Domtoren。',
        tip: '爬 Domtoren 需要提前预约，共 465 级楼梯，但登顶后能 360° 俯瞰，天气好能望到阿姆斯特丹。'
    },
    {
        id: 't05', tag: '#未来之城', title: '鹿特丹 (Rotterdam)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/5/57/Rotterdam_Erasmusbrug_bij_avond.jpg/1280px-Rotterdam_Erasmusbrug_bij_avond.jpg',
        copyright: '© Wikimedia Commons', crop: 'center 20%',
        hook: '🏗️ 二战废墟上的建筑实验场',
        body: '二战被夷为平地后，这里重生为狂野建筑师的天堂：倾斜 45 度的立体方块屋 (Kubuswoningen)、巨大马蹄形的 Markthal 拱廊市场、天鹅般的伊拉斯谟桥——现代感十足。',
        tip: 'Markthal 内部天花板壁画面积达 11000 平方米，免费参观，里面还有各种美食摊位，强烈推荐午饭在这里解决。'
    },
    {
        id: 't06', tag: '#政治中心', title: '海牙 (Den Haag)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Binnenhof_from_hofvijver_with_reflection.jpg/1280px-Binnenhof_from_hofvijver_with_reflection.jpg',
        copyright: '© Wikimedia Commons', crop: 'center 40%',
        hook: '⚖️ 国会、王室与黄金沙滩',
        body: '虽然首都是阿姆斯特丹，但荷兰政府、王室和多个国际法庭都在海牙。除了庄严的 Binnenhof 国会大厦，这里还有荷兰最美的席凡宁根 (Scheveningen) 黄金海滩。',
        tip: '去 Mauritshuis 皇家美术馆看维米尔的《戴珍珠耳环的少女》原作，建议提前 30 分钟到，避开人群。'
    },
    {
        id: 't07', tag: '#最美老城', title: '哈勒姆 (Haarlem)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Haarlem_Grote_Markt_%26_Grote_Kerk.jpg/1280px-Haarlem_Grote_Markt_%26_Grote_Kerk.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🌸 阿姆的绝美后花园',
        body: '距离阿姆仅 15 分钟车程，却完全避开了拥挤的游客。哈勒姆有极具中世纪风情的大广场、隐秘的庭院和风车，是荷兰本地人最爱周末闲逛的城市之一。',
        tip: '周六广场有全荷兰历史最悠久的露天集市，当地特产奶酪种类比超市多三倍，价格也更实惠。'
    },
    {
        id: 't08', tag: '#学术圣地', title: '莱顿 (Leiden)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Leiden_Universiteit_Academiegebouw.jpg/1280px-Leiden_Universiteit_Academiegebouw.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '📚 爱因斯坦教过书的地方',
        body: '荷兰最古老的莱顿大学所在地。漫步在纵横运河边，会在斑驳的墙壁上发现各种语言的诗歌涂鸦 (Muurgedichten)——全城有 100 多首，寻找它们就像城市寻宝。',
        tip: '莱顿国家博物馆 (Rijksmuseum van Oudheden) 收藏了大量埃及木乃伊，门票仅 15 欧，人少且极有深度。'
    },
    {
        id: 't09', tag: '#风车遗珠', title: '桑斯安斯 (Zaanse Schans)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/a/a3/ZaanseSchans2016-0146.jpg/1280px-ZaanseSchans2016-0146.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🍃 穿越回 18 世纪的荷兰工业',
        body: '除了绿木风车，这里还保留了传统木鞋制造厂和奶酪作坊。附近有可可加工厂，空气中混合着青草和巧克力的香气，是极致的感官体验。',
        tip: '入园免费，但风车内部参观单独收费。直接在村内的商店买奶酪和木鞋，价格比阿姆斯特丹便宜很多。'
    },
    {
        id: 't10', tag: '#欧洲阳台', title: '马斯特里赫特 (Maastricht)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/d/de/Maastricht_-_Vrijthof_%28Augustijnerkapel_en_Sint-Servaasbrug%29.jpg/1280px-Maastricht_-_Vrijthof_%28Augustijnerkapel_en_Sint-Servaasbrug%29.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🍷 最不"荷兰"的浪漫边境小镇',
        body: '位于荷兰最南端，被比利时和德国包围。建筑更偏法式和罗马风格，有由哥特式教堂改造的绝美书店 (Boekhandel Dominicanen)，整座城市散发着慵懒的红酒气息。',
        tip: 'Boekhandel Dominicanen 书店内可以在原来的祭坛位置喝咖啡，拍照完全免费，是欧洲最上镜的书店之一。'
    },
    {
        id: 't11', tag: '#奶酪之城', title: '豪达 (Gouda)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Gouda_kaasmarkt.jpg/1280px-Gouda_kaasmarkt.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🧀 那块你吃过的奶酪就来自这里',
        body: '春夏季节会举办盛大的传统奶酪交易市场 (Kaasmarkt)，穿着传统服饰的人们用木制担架抬着巨大的奶酪轮奔跑。整个广场弥漫着奶酪的香气，画面极度震撼。',
        tip: '奶酪市场通常在周四上午 10 点举行（4月至8月），来早比来巧，人最少的时候在 10:30 前。'
    },
    {
        id: 't12', tag: '#水城迷宫', title: '多德雷赫特 (Dordrecht)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Grote_Kerk_Dordrecht.jpg/800px-Grote_Kerk_Dordrecht.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🚢 漂浮在水上的最古老城市',
        body: '荷兰第一座被授予城市权利的地方，被纵横的河流包围。老城区的港口和隐秘庭院藏着最浓郁的中世纪航海记忆，游客极少，是真正的本地人城市。',
        tip: '从鹿特丹坐船去多德雷赫特比坐火车更有趣，沿途经过大量运河风光，票价相差不大。'
    },
    {
        id: 't13', tag: '#渔村风情', title: '福伦丹 (Volendam)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Volendam_haven.jpg/1280px-Volendam_haven.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🎣 北海边的传统渔村',
        body: '五颜六色的木制房屋排在海港边，保留了最淳朴的荷兰渔业传统。镇上有穿传统服饰的摄影店，还能吃到现炸的烟熏鳗鱼 (Gerookte paling)——这里是最正宗的产地。',
        tip: '穿传统荷兰服装拍照是这里的百年老店项目，一套戏服+全家福大概 20 欧，非常有纪念意义。'
    },
    {
        id: 't14', tag: '#北方之都', title: '格罗宁根 (Groningen)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/0/08/Groningen_Martinikerkhof.jpg/1280px-Groningen_Martinikerkhof.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🎓 最年轻、最狂野的不夜城',
        body: '地处遥远的北方，因为拥有庞大的学生群体，酒吧没有打烊时间。它是欧洲的自行车之都，充满叛逆和先锋气息。格罗宁根论坛 (Forum) 是最前卫的文化地标。',
        tip: 'Forum Groningen 顶层有免费的 360° 露台，可以俯瞰全城，天气好时甚至能看到远处的风车。'
    },
    {
        id: 't15', tag: '#历史壁垒', title: '阿默斯福特 (Amersfoort)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/7/72/Amersfoort-koppelpoort.jpg/800px-Amersfoort-koppelpoort.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🧱 完美保留的双重护城河',
        body: '一座将中世纪城墙、水门和双重护城河保留得极其完美的老城。Koppelpoort 是荷兰最漂亮的古代水陆城门之一，沿着护城河散步，仿佛走进欧洲古典电影。',
        tip: '阿默斯福特离乌得勒支只有 15 分钟火车，可以串联成一日游，两座城市风格截然不同，对比强烈。'
    },
    {
        id: 't16', tag: '#社交法则', title: '荷兰式直白 (Dutch Directness)',
        imgUrl: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '🗣️ 没礼貌还是真性情？',
        body: '荷兰人以"直接"著称。如果你问同学衣服好不好看，他觉得丑会直接说"这件衣服让你看起来像个土豆"。这不是没礼貌，而是他们认为最高效、最真诚的沟通方式。',
        tip: '被直接评价时别玻璃心。反过来，你也可以直接拒绝或提意见，荷兰人反而会更尊重你。'
    },
    {
        id: 't17', tag: '#街头解馋', title: '炸鱼块 (Kibbeling)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Kibbeling.jpg/1280px-Kibbeling.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🐟 海鲜市场的快乐源泉',
        body: '将新鲜鳕鱼切块，裹上特制面糊炸至金黄，外酥里嫩。这是荷兰露天集市最受欢迎的街头小吃，吃的时候必须蘸满浓郁的大蒜酱 (Knoflooksaus)，边走边吃才是正确打开方式。',
        tip: '在海边小镇买比城市超市里的便宜一半，Scheveningen 和 Volendam 的鱼市是最正宗的选择。'
    },
    {
        id: 't18', tag: '#硬核带娃', title: '货运自行车 (Bakfiets)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Cargobike_amsterdam.jpg/1280px-Cargobike_amsterdam.jpg',
        copyright: '© Wikimedia Commons', crop: 'center 40%',
        hook: '🛒 荷兰人的"家庭皮卡"',
        body: '前面带个巨大木箱的自行车，里面可能装着三个刚放学的孩子、一条金毛犬，外加一周的超市采购。荷兰主妇在任何天气都能蹬着这种"巨无霸"在街上狂飙。',
        tip: '如果你有小孩或需要搬运大件物品，Bakfiets 可以在 Swapfiets 等平台月租，不需要驾照。'
    },
    {
        id: 't19', tag: '#国民超市', title: '神圣的 Bonus 卡',
        imgUrl: 'https://images.pexels.com/photos/1055382/pexels-photo-1055382.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '💳 没这张卡，你会被超市反撸',
        body: 'Albert Heijn (AH) 是荷兰最大的连锁超市。所有打折商品（蓝色 Bonus 标签）只有刷会员卡才能享受优惠，不刷卡就是原价，差价高达 40%。',
        tip: '落地第一天就去柜台免费拿实体 Bonuskaart，或在 App 里注册。每周五在 App 里手动选 5 个专属折扣，经常有惊喜。'
    },
    {
        id: 't20', tag: '#暗黑料理', title: '土豆泥大乱炖 (Stamppot)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Boerenkoolstamppot.jpg/1280px-Boerenkoolstamppot.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🥔 荷兰人过冬的终极武器',
        body: '把土豆、羽衣甘蓝 (Boerenkool) 煮熟一起捣成泥，中间挖个坑倒进浓肉汁，配一根硕大的烟熏香肠 (Rookworst)。毫无摆盘，但在妖风肆虐的冬夜吃一大口，热量瞬间充斥全身。',
        tip: '超市的即食 Stamppot 套装很便宜，加一根 HEMA 的 Rookworst 就完整了。也可以自己买材料，做一大锅能吃三天。'
    },
    {
        id: 't21', tag: '#社交礼仪', title: '左右左，贴面吻',
        imgUrl: 'https://images.pexels.com/photos/1024967/pexels-photo-1024967.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '💋 让社恐发作的打招呼方式',
        body: '荷兰朋友见面的标准礼仪是贴面亲吻脸颊，而且次数极其严格：必须是三次（右脸-左脸-右脸）。只亲一次或两次都会让场面极其尴尬，双方都不知道结束没有。',
        tip: '如果真的不习惯，在对方凑过来之前果断伸出手大声说"Hoi！"并用力握手，荷兰人完全可以接受。'
    },
    {
        id: 't22', tag: '#奇葩文化', title: '见缝插针的预约 (Agenda)',
        imgUrl: 'https://images.pexels.com/photos/1552617/pexels-photo-1552617.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '📅 连去爸妈家吃饭都要提前预约',
        body: '荷兰人是时间管理的重度强迫症患者，每个人的生活都被 Agenda（日程本）安排得明明白白。临时起意约人喝咖啡基本不可能，他们会翻开日历认真查询最近的空档。',
        tip: '约荷兰同学或同事，永远提前一两周发日历邀请 (calendar invite)，这是最受欢迎的方式，比发微信靠谱。'
    },
    {
        id: 't23', tag: '#租房内卷', title: '看房面试 (Hospiteren)',
        imgUrl: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '🏠 找房子比找工作还难',
        body: '在荷兰租学生合租房，不是有钱就能住！室友们会举办选拔会，邀请十几个候选人来聊天喝酒，全体投票决定谁能搬进来。这就是著名的 Hospiteren。',
        tip: '穿着整洁，聊天时展示你的整洁习惯和生活规律，比展示你的成绩单更管用。会说几句荷兰语加分巨大。'
    },
    {
        id: 't24', tag: '#魔幻铁路', title: '树叶导致火车停运',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/c/c3/NS_Intercity_Direct_at_Rotterdam_Centraal.jpg/1280px-NS_Intercity_Direct_at_Rotterdam_Centraal.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🚆 NS 铁路局的千层借口',
        body: '荷兰火车极其准时，但也极其脆弱。秋天铁轨上有落叶、冬天下了一厘米的雪、春天有只迷路的羊，火车都会立刻延误甚至停运。官方把这些全称为"外部原因"。',
        tip: '赶飞机或重要考试，务必提前在 NS App 上查看车次状态。预留至少 30 分钟的冗余时间，绝不能卡点出门。'
    },
    {
        id: 't25', tag: '#冬日限定', title: '运河滑冰大赏',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Skating_on_the_canals_of_Amsterdam_1963.jpg/1280px-Skating_on_the_canals_of_Amsterdam_1963.jpg',
        copyright: '© Wikimedia Commons', crop: 'center 40%',
        hook: '⛸️ 刻在荷兰人 DNA 里的热爱',
        body: '气温连续几天低于零下，整个荷兰都会沸腾——人们拿出储藏室里的冰鞋，直接在冻结的阿姆斯特丹运河上滑冰通勤。孩子们从学校提前放学去冰上玩耍。',
        tip: '冰层必须达到 15 厘米才安全。不会判断？看当地荷兰人敢不敢上去，他们的本能比任何厚度计更准。'
    },
    {
        id: 't26', tag: '#碳水炸弹', title: '战争薯条 (Patatje Oorlog)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/7/73/Patatje_oorlog.jpg/1280px-Patatje_oorlog.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🍟 名字暴力，口味惊艳',
        body: '薯条上浇沙爹花生酱、蛋黄酱，再撒一把生洋葱碎——三种酱料在纸盒里"开战"，看起来一塌糊涂，但花生酱的香浓和洋葱的辛辣碰撞，让人欲罢不能。',
        tip: '一定要去 FEBO 这种正宗荷兰炸物店买，不要在土耳其烤肉店凑合。让他们帮你放"三种酱 (alle drie)"。'
    },
    {
        id: 't27', tag: '#自然奇迹', title: '阿夫鲁戴克大堤 (Afsluitdijk)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Afsluitdijk_vanuit_de_lucht.jpg/1280px-Afsluitdijk_vanuit_de_lucht.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🌊 上帝造世界，荷兰人造荷兰',
        body: '长达 32 公里的人工大堤，生生将咆哮的北海一分为二，把内海变成了淡水湖。行驶在一眼望不到头的大堤上，两边都是海水，才能真正体会这项工程的震撼。',
        tip: '大堤中间有一个观景台可以停车拍照，两端分别有小型博物馆，西侧的 Wieringen 端有更好的日落角度。'
    },
    {
        id: 't28', tag: '#夏日狂欢', title: '席凡宁根沙滩 (Scheveningen)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/0/09/Scheveningen_2009.jpg/1280px-Scheveningen_2009.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🏖️ 海牙的黄金海岸线',
        body: '只要一出太阳，荷兰人就全长在沙滩上。这里有摩天轮、蹦极塔、海鲜餐厅和无数露台酒吧。夏天的日落在晚上 10 点，整个海滩变成巨型露天聚会现场。',
        tip: '海鸥在这里极度凶残！在海边吃炸鱼或薯条时，必须时刻盯着天空，否则食物会被瞬间俯冲抢走。'
    },
    {
        id: 't29', tag: '#超市迷惑', title: '温室里的荷兰蔬菜',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Westland_greenhouse.jpg/1280px-Westland_greenhouse.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🥒 完美外形，但味道去哪了？',
        body: '荷兰农产品极度发达，但超市里的蔬果往往长得极其标致完美，却没有"本来的味道"。这是因为大多数在极其先进的温室无土栽培环境里工业化生产。',
        tip: '去露天集市 (markt) 买蔬果，通常是农民直销，比超市贵一点但味道好很多。周六早市是最好的时机。'
    },
    {
        id: 't30', tag: '#二手文化', title: '万物皆可 Marktplaats',
        imgUrl: 'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '🛒 荷兰版闲鱼的诱惑',
        body: '荷兰人极度务实且提倡环保，买卖二手物品是全民爱好。Marktplaats.nl 上从沙发、自行车到锅碗瓢盆，什么都能买到，甚至有人免费送房屋全套家具。',
        tip: '新生必做第一件事：注册 Marktplaats 账号。毕业学长学姐经常免费送家具，只要你自己上门搬走就行！'
    },
    {
        id: 't31', tag: '#国民早餐', title: '巧克力碎 (Hagelslag)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/8/84/Hagelslag.jpg/1280px-Hagelslag.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🍫 把蛋糕装饰当早饭吃',
        body: '荷兰人每年消耗 1400 万公斤巧克力碎！标准早餐就是：一片白面包，抹上厚厚的黄油，撒满巧克力碎。这不是零食，而是全民认真的正餐。',
        tip: '买 De Ruijter 牌的纯黑巧克力碎 (puur)，比牛奶味的更浓郁。白面包用 Waldkorn 杂粮面包替代，更有层次感。'
    },
    {
        id: 't32', tag: '#暗黑夜宵', title: '理发店薯条 (Kapsalon)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Kapsalon.jpg/1280px-Kapsalon.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '💣 1800 卡路里的究极热量炸弹',
        body: '底铺薯条，盖土耳其烤肉 (Shoarma)，铺满高达奶酪烤化，最后淋大蒜酱和辣酱。这道菜由鹿特丹的一位理发师发明，深夜蹦完迪后来一份，能让你原地升天。',
        tip: '几乎所有土耳其烤肉店 (Shoarmazaak) 都有卖。选大份 (groot)，价格比小份多 2 欧但量是两倍。'
    },
    {
        id: 't33', tag: '#街头盲盒', title: '墙上小吃 (FEBO)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/0/0f/FEBO_Amsterdam.jpg/800px-FEBO_Amsterdam.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🧱 自动贩卖机里的热腾腾美食',
        body: '荷兰街头独有的 Automatiek。一整面玻璃墙，里面放着炸肉卷、汉堡。投币或刷卡，打开小门直接拿走吃。店员在幕后不断补货，24 小时运转。',
        tip: '必点 Kaassoufflé（炸奶酪派），外皮极其酥脆，里面的奶酪会拉丝。小心烫嘴，咬第一口要留缝隙散热。'
    },
    {
        id: 't34', tag: '#粉色诱惑', title: '国王节限定 (Tompouce)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/9/94/Tompouce.jpg/1280px-Tompouce.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🍰 吃相最难看的国民甜点',
        body: '两片硬邦邦的酥皮，夹着极厚的香草卡仕达酱，顶层是粉红色糖霜。国王节当天会变成橙色。吃的时候必然弄得满脸奶油，是荷兰人的骄傲和快乐。',
        tip: '优雅吃法的秘诀：把顶层酥皮掀下来，贴在底部一起咬，可以避免奶油从四面喷出来。'
    },
    {
        id: 't35', tag: '#养生饮品', title: '新鲜薄荷茶 (Verse Muntthee)',
        imgUrl: 'https://images.pexels.com/photos/1793035/pexels-photo-1793035.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '🌿 最朴素的"高档饮品"',
        body: '去荷兰的咖啡馆，点薄荷茶会发现：服务员直接抓一大把没切碎的新鲜薄荷叶，塞进玻璃杯，倒上开水。简单粗暴，但配一小勺蜂蜜，在阴冷雨天喝一口，暖到心里。',
        tip: '超市一把新鲜薄荷 0.99 欧，自己在宿舍泡比咖啡馆便宜 4 欧。买一盆薄荷植物更划算，能用整个学期。'
    },
    {
        id: 't36', tag: '#超市必买', title: '液体布丁 (Vla)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/7/75/Vla.jpg/800px-Vla.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🥛 介于酸奶和布丁之间的神秘存在',
        body: '荷兰独有的一种粘稠乳制品，装在纸盒里，有香草、巧克力、焦糖等口味。口感比酸奶厚，比布丁稀，极其顺滑，是荷兰人每天餐后必备甜点。',
        tip: '荷兰人喜欢把香草和巧克力 Vla 混在一个碗里吃，叫 Dubbelvla（双色）。超市里甚至有专门的双色包装版本。'
    },
    {
        id: 't37', tag: '#微醺时刻', title: '荷兰琴酒 (Jenever)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/7/76/Jenever_in_glas.jpg/800px-Jenever_in_glas.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🍸 英国 Gin 的老祖宗',
        body: '由杜松子酿造的荷兰传统烈酒。传统倒酒方式是倒满整个郁金香形小杯，直到表面张力让酒液微微鼓起。第一口的规矩是：双手背在身后，弯腰去"啜"一口。',
        tip: '阿姆斯特丹的 Wynand Fockink 品酒室是 1679 年开业的老店，有几十种口味可以试喝，进去后告诉服务员你想 proeven（试喝）。'
    },
    {
        id: 't38', tag: '#国民饮料', title: '黄色魔力 (Chocomel)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/7/77/Chocomel_in_glas.jpg/800px-Chocomel_in_glas.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🍫 荷兰唯一的真神饮料',
        body: '极其醒目的亮黄色包装，荷兰人从小喝到大的浓郁巧克力奶。口感比普通牛奶厚很多，甜而不腻，是冬天滑冰场的标配热饮。',
        tip: '冬天去露天滑冰场，必须点一杯热的 Chocomel（上面挤一大坨鲜奶油 Slagroom），配合冰冷的空气喝，这就是荷兰的冬天。'
    },
    {
        id: 't39', tag: '#社交日常', title: '周五下班酒 (Vrijmibo)',
        imgUrl: 'https://images.pexels.com/photos/1267321/pexels-photo-1267321.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '🍻 摸鱼的最高境界',
        body: 'Vrijmibo 是"周五下午喝一杯 (Vrijdagmiddagborrel)"的缩写。到了周五下午 4 点，荷兰公司的电脑会准时合上，老板带头开啤酒，桌上配 Bittergarnituur（综合炸物拼盘）。',
        tip: '这是打入荷兰同事圈子的最佳时机。带着认真态度去聊工作以外的事，荷兰人在 borrel 上比平时亲切一百倍。'
    },
    {
        id: 't40', tag: '#新生宝宝', title: '老鼠屎饼干 (Muisjes)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Beschuit_met_muisjes.jpg/1280px-Beschuit_met_muisjes.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '👶 庆祝新生命的硬核点心',
        body: '荷兰人生了小孩，会在极干硬的烤圆面包片 (Beschuit) 上，涂满黄油，撒上粉白（生女孩）或蓝白（生男孩）的茴香籽糖果 Muisjes。在学校或公司分发给所有人。',
        tip: '如果荷兰同事带这个来，赶紧恭喜他当爸爸/妈妈了！第一片必须给新生儿的父母，表示祝福。'
    },
    {
        id: 't41', tag: '#处世哲学', title: '装正常点 (Doe Normaal)',
        imgUrl: 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '🗿 荷兰社会的终极潜规则',
        body: '"Doe normaal, dan doe je al gek genoeg"（表现得正常点，这就已经够疯狂了）。荷兰人极其反感炫富、特立独行和过度情绪化。首相也骑自行车上下班。',
        tip: '低调、务实、不装X，是在荷兰的生存王道。无论你多成功，和荷兰人聊天时，谦虚比炫耀更受欢迎。'
    },
    {
        id: 't42', tag: '#诡异爱好', title: '去风中凌乱 (Uitwaaien)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Noordzee_strand_Scheveningen.jpg/1280px-Noordzee_strand_Scheveningen.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '💨 荷兰人的顶级精神疗法',
        body: 'Uitwaaien 的字面意思是"在风中走"。当荷兰人心情烦躁时，会特意跑到海边或旷野，迎着能把人吹面瘫的 8 级狂风散步。他们坚信强风能把脑子里的杂念和压力全部"吹走"。',
        tip: '下次在荷兰心情不好，别窝在宿舍刷手机——骑车去最近的海边或旷野站 20 分钟，效果真的有。'
    },
    {
        id: 't43', tag: '#全民吐槽', title: '抱怨天气 (Klagen)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/2/27/Amsterdam_in_rain.jpg/1280px-Amsterdam_in_rain.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '💬 打开话匣子的万能钥匙',
        body: '荷兰人热爱抱怨天气，"这风太大了"、"雨怎么下个不停"、"今天太热了受不了"——这三句话覆盖了荷兰一年四季的所有天气。',
        tip: '和荷兰人同乘电梯不知道说什么？叹口气说一句"Wat een weer hè?"（什么鬼天气啊！），你们瞬间成为朋友。'
    },
    {
        id: 't44', tag: '#硬核生日', title: '圆圈生日派对 (Kringverjaardag)',
        imgUrl: 'https://images.pexels.com/photos/5875902/pexels-photo-5875902.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '🪑 世界上最特别的生日方式',
        body: '去荷兰人家里过生日，所有人拉着椅子围成大圆圈坐着，不仅祝寿星生日快乐，还要跟圆圈里每一个亲戚握手说"恭喜你的哥哥生日快乐"。全程喝咖啡、吃一块小蛋糕。',
        tip: '被邀请去荷兰人家的生日聚会时，带一盒好巧克力或一束花当礼物是最通用的选择。比现金更受欢迎。'
    },
    {
        id: 't45', tag: '#奇葩萌物', title: '国民兔子 (Nijntje)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Nijntje_Pleintje_Utrecht_2019.jpg/800px-Nijntje_Pleintje_Utrecht_2019.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🐰 别叫她 Miffy，她叫 Nijntje！',
        body: '这只嘴巴是个"X"的白色小兔子，是荷兰插画师 Dick Bruna 的国宝级杰作。在荷兰，没人叫她 Miffy，荷兰真名 Nijntje 是"小兔子"的缩写。她的博物馆在乌得勒支。',
        tip: '乌得勒支有红绿灯都是米菲形状的！这也是给国内小朋友带礼物的首选——比景区便宜的版本在 HEMA 有卖。'
    },
    {
        id: 't46', tag: '#交通神器', title: '小蓝胎自行车 (Swapfiets)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/0/07/Swapfiets_blue_tire_bike.jpg/800px-Swapfiets_blue_tire_bike.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🚲 留学生人手一辆的月租神车',
        body: '前轮是极其醒目的蓝色轮胎。每月十几欧租金，车坏了在 App 上一键呼叫，小哥上门免费换辆新的。在荷兰买二手车怕被偷，坏了修车贵，Swapfiets 是最省心的选择。',
        tip: '一定要买一把巨型链条锁把它锁在铁柱子上，连人带车被偷了是要赔几百欧的，这个不是开玩笑。'
    },
    {
        id: 't47', tag: '#交通礼仪', title: '静音车厢 (Stiltecoupé)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/0/06/Stiltecoup%C3%A9_NS_bord.jpg/800px-Stiltecoup%C3%A9_NS_bord.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🤫 呼吸声太大都会被鄙视',
        body: '荷兰 NS 火车上，窗户贴"Silence"或"S"标志的车厢是绝对静音区。在这里不能说话、不能打电话、连耳机漏音都会被对面大妈疯狂瞪眼，没有任何情面可讲。',
        tip: '新生结伴出游极易踩坑。上车前抬头看看车门标志，想聊天一定要去没有标志的普通车厢。'
    },
    {
        id: 't48', tag: '#单车礼仪', title: '转向请伸手',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/4/41/Amsterdam_fietsen.jpg/1280px-Amsterdam_fietsen.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '👋 人肉转向灯',
        body: '在密集的荷兰自行车流中，突然转弯是极其危险的。荷兰人骑车转弯前，一定会笔直地伸出左手或右手示意后方车辆，这是不成文的铁律，不遵守会引发连环追尾。',
        tip: '入乡随俗！如果你不伸手就突然拐弯，绝对会收获一顿纯正的荷兰国骂，声音大、词汇丰富。'
    },
    {
        id: 't49', tag: '#最后拼图', title: '公共交通单车 (OV-fiets)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/a/a4/OV-fiets.jpg/1280px-OV-fiets.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🟡 黄蓝相间的共享单车',
        body: '坐火车到了另一个城市，从车站去市中心怎么办？用实名 OV 卡，在各大火车站租到这辆极速单车，每天仅 4.5 欧，遍布全国 300+ 个租赁点。',
        tip: '这车是倒刹车（往后踩脚踏板刹车），没有手刹！刚上手时请先在空地练习一下，以免冲进运河。'
    },
    {
        id: 't50', tag: '#命脉号码', title: '全民唯一的 BSN',
        imgUrl: 'https://images.pexels.com/photos/6863183/pexels-photo-6863183.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '🆔 没有这串数字，寸步难行',
        body: 'Burger Service Nummer（公民服务号）。在荷兰开银行卡、买保险、租房、拿工资、交税，全靠它！这是你在荷兰存在的证明。',
        tip: '落地第一件事去市政厅 (Gemeente) 注册拿 BSN。预约极其火爆，在国内就要通过学校或大使馆提前安排。'
    },
    {
        id: 't51', tag: '#数字政府', title: '万能的 DigiD',
        imgUrl: 'https://images.pexels.com/photos/6347707/pexels-photo-6347707.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '📱 你在荷兰的数字身份证',
        body: '有了 BSN 后，立刻申请 DigiD。这是一个 App，无论是报税、查医疗记录、还是申请补贴，扫描二维码就能登录所有政府网站。荷兰政府的数字化程度让你不用再跑任何窗口。',
        tip: '申请 DigiD 需要一个荷兰手机号，激活码会通过荷兰邮政寄信来，大概等 5 个工作日，一定不要扔掉那封信。'
    },
    {
        id: 't52', tag: '#心脏骤停', title: '恐怖的蓝色信封',
        imgUrl: 'https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '✉️ 荷兰税务局的索命信',
        body: '在荷兰，只要邮箱出现一封亮蓝色信封，所有人的心率都会加快。这是税务局 (Belastingdienst) 寄来的信，可能是账单，也可能是退税或补贴的好消息。',
        tip: '别怕！如果你是没有收入的学生，蓝信封里装的往往是退税单或各种 Toeslag 补贴的好消息，有时会退给你几百欧。'
    },
    {
        id: 't53', tag: '#生存福利', title: '医疗补贴 (Zorgtoeslag)',
        imgUrl: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '💰 政府帮你交高昂的保费',
        body: '荷兰强制要求买医疗保险，每月约 130 欧。但如果你是没有收入的学生，政府每个月会倒贴 100 多欧的补贴抵扣保费！这是最大的合法留学生福利。',
        tip: '安顿好后立刻去税务局官网 (belastingdienst.nl) 申请 Zorgtoeslag，不申请是真正的血亏，每月白白损失 100+ 欧。'
    },
    {
        id: 't54', tag: '#看病指南', title: '佛系家庭医生 (Huisarts)',
        imgUrl: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '🩺 喝水、睡觉、扑热息痛',
        body: '在荷兰不能直接去医院挂号！必须先看已注册的家庭医生。他们崇尚人类自身免疫力，发烧 39 度以下，医生通常只会让你回家吃 Paracetamol（退烧药）。',
        tip: '如果真的很难受，必须在电话里极其夸张地描述病情，否则连医生面都见不到。关键词：已经持续好几天、无法正常上课。'
    },
    {
        id: 't55', tag: '#居住内卷', title: '学生住房机构 DUWO/SSH',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/4/45/DUWO_woning_Delft.jpg/800px-DUWO_woning_Delft.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🏢 留学生的庇护所',
        body: '荷兰大学通常不提供免费宿舍！DUWO 和 SSH 是最大的两家学生住房机构，房子价格受政府保护，条件也不错。但房源极其紧张，需要极早排队。',
        tip: '一旦收到大学的注册链接，请在 1 分钟内交钱排队，手慢的话只能去天价私人市场（经常是 DUWO 价格的两三倍）流浪。'
    },
    {
        id: 't56', tag: '#国民百货', title: '永远的 HEMA',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/5/59/HEMA_in_Utrecht.jpg/1280px-HEMA_in_Utrecht.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🛒 荷兰版高配无印良品',
        body: '从文具、毛巾、锅碗瓢盆到极具设计感的小零食，HEMA 几乎包揽了荷兰人的一生。设计极简且价格亲民，是留学生初到荷兰置办家当的首选。',
        tip: '必须买一根 HEMA 最著名的烟熏香肠 (Rookworst)！夹在面包里吃，极其多汁，一整根才 2 欧。'
    },
    {
        id: 't57', tag: '#省钱之地', title: '神仙两元店 (Action)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Action_filiaal_in_Zoetermeer.jpg/1280px-Action_filiaal_in_Zoetermeer.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '💸 留学生的省钱根据地',
        body: '垃圾袋、衣架、收纳盒、充电线、零食、蜡烛——这些东西千万别去大超市买！直奔 Action。便宜到让人怀疑人生，拿着 20 欧进去，能推着满满一整车东西出来。',
        tip: 'Action 的商品每周更新，新奇玩意很多。最值得买的是厨房收纳用品和季节性装饰品，质量超出价格预期。'
    },
    {
        id: 't58', tag: '#药妆巨头', title: '红十字标志 (Kruidvat)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/2/28/Kruidvat_winkelpand_in_Zaandam.jpg/1280px-Kruidvat_winkelpand_in_Zaandam.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '💊 街头最密集的日用品店',
        body: '红底白字的 Kruidvat 是荷兰最大的平价药妆店。买洗发水、护肤品、保健品、卫生纸的首选地，价格比超市便宜 20-30%。',
        tip: '认准"1+1 Gratis"（买一送一）的标志再囤货，能省大量开销。App 里有专属折扣，下载注册后第一周有迎新大礼包。'
    },
    {
        id: 't59', tag: '#拯救胃口', title: '橙色大军 (Thuisbezorgd)',
        imgUrl: 'https://images.pexels.com/photos/4393426/pexels-photo-4393426.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '🛵 荷兰本土版"美团外卖"',
        body: '背着巨大橙色保温箱的骑手就是你的救星。Thuisbezorgd 和 Uber Eats 覆盖了绝大多数荷兰城市。中餐馆、印尼菜、土耳其烤肉应有尽有。',
        tip: '荷兰外卖费和包装费极贵，随便点一份盖饭都要 20+ 欧。建议把外卖作为偶尔奖励，早日修炼成厨房高手。'
    },
    {
        id: 't60', tag: '#二手市集', title: '国王节跳蚤市场',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/4/44/Koningsdag_Vrijmarkt_Amsterdam_2014.jpg/1280px-Koningsdag_Vrijmarkt_Amsterdam_2014.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🧸 属于全民的地摊经济',
        body: '4 月 27 日国王节，荷兰免除所有摆摊税。所有人把家里闲置物品搬到街上卖。小朋友卖旧玩具，大人卖家具二手书，甚至在街上拉小提琴赚钱。',
        tip: '带足现金硬币！你能用 5 欧买到几乎全新的微波炉或者正版黑胶唱片。在阿姆斯特丹 Vondelpark 附近是最优质的摊位区。'
    },
    {
        id: 't61', tag: '#童话世界', title: '艾夫特琳乐园 (Efteling)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Efteling_-_Droomvlucht.jpg/1280px-Efteling_-_Droomvlucht.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🎢 迪士尼也要叫一声前辈',
        body: '比迪士尼历史更悠久、更暗黑、更有欧洲古典童话氛围的顶级主题乐园！过山车穿梭在茂密森林中，每一个区域都是一个完整的童话世界，细节极其讲究。',
        tip: '冬天去可以体验"Efteling Winter"限定主题，满地篝火和热红酒，沉浸感无敌。门票提前两周以上在官网买，有折扣。'
    },
    {
        id: 't62', tag: '#自然旷野', title: '高费吕韦国家公园 (De Hoge Veluwe)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/7/72/De_Hoge_Veluwe_National_Park.jpg/1280px-De_Hoge_Veluwe_National_Park.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🌲 骑着白车看野生鹿群',
        body: '荷兰最大的国家公园，地貌奇特，有森林、荒原甚至沙丘。公园内提供免费的白色自行车供骑行探索，深处藏着收藏了全世界第二多梵高真迹的库勒-慕勒美术馆。',
        tip: '白色自行车数量有限，早上开园就去取，下午经常没车了。美术馆门票含在公园门票里，不用额外付费。'
    },
    {
        id: 't63', tag: '#离岛风光', title: '特塞尔岛 (Texel)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Texel_-_De_Cocksdorp_-_vuurtoren.jpg/800px-Texel_-_De_Cocksdorp_-_vuurtoren.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🐑 羊比人多的隔世孤岛',
        body: '位于荷兰最北部的瓦登海群岛，坐 20 分钟轮渡就能抵达。极长的白色沙滩、标志性的红灯塔、满地奔跑的绵羊，和世界自然遗产级别的候鸟栖息地。',
        tip: '一定要去岛上的海豹救助中心 (Ecomare) 看圆滚滚的海豹幼崽——极其治愈，每天有固定喂食时间，提前查好。'
    },
    {
        id: 't64', tag: '#极速狂飙', title: '赞德福特赛道 (Zandvoort)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Circuit_Zandvoort_2022.jpg/1280px-Circuit_Zandvoort_2022.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🏎️ 海滩边的 F1 橙色风暴',
        body: '距离阿姆半小时车程的绝美沙滩，也是 F1 荷兰大奖赛举办地。独特的倾斜弯道极考验车手。当荷兰籍车手维斯塔潘比赛时，整个赛场被疯狂橙色拉烟点燃，场面震撼。',
        tip: 'F1 比赛期间阿姆斯特丹至 Zandvoort 的火车爆满，提前抢票且要有心理准备站票。非比赛日去沙滩人很少，非常惬意。'
    },
    {
        id: 't65', tag: '#古典奢华', title: '德哈尔城堡 (Kasteel de Haar)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/4/42/Kasteel_De_Haar_2.jpg/1280px-Kasteel_De_Haar_2.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🏰 荷兰最大最奢华的古堡',
        body: '位于乌得勒支郊外，尖塔、吊桥、护城河和华丽的玫瑰花园，满足你对中世纪贵族城堡的所有幻想。每年还会举办"精灵奇幻节 (Elfia)"，无数人穿着精美 Cosplay 服装在古堡狂欢。',
        tip: '城堡内部有导览参观，需提前预约。花园比城堡本身更值得花时间，春天玫瑰盛开时最漂亮。'
    },
    {
        id: 't66', tag: '#信仰之巅', title: '乌得勒支主教塔 (Domtoren)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Domtoren_Utrecht.jpg/800px-Domtoren_Utrecht.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '⛪ 被风暴劈开的地标',
        body: '荷兰最高、最古老的教堂塔楼，高 112 米。奇特的是它和教堂主体是分离的——1674 年一场恐怖飓风摧毁了连接两者的中殿，从此形成了这个独一无二的历史断层。',
        tip: '爬上 465 级极窄旋转楼梯登顶，天气好时能一眼望到阿姆斯特丹。必须预约，导览全程约 75 分钟。'
    },
    {
        id: 't67', tag: '#工业巨兽', title: '伊拉斯谟桥 (Erasmusbrug)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/d/de/Erasmusbrug.jpg/1280px-Erasmusbrug.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🦢 鹿特丹的白色天鹅',
        body: '跨越马斯河的极其优美的斜拉桥，不对称的塔柱设计被当地人亲切地称为"天鹅桥"。桥体能升起让巨轮通过，夜晚亮起灯光时，是鹿特丹最硬核的赛博朋克夜景。',
        tip: '站在对岸的北岸 (Noordoever) 拍全景最好看，也可以坐水上出租车 (Watertaxi) 从水面仰拍桥身。'
    },
    {
        id: 't68', tag: '#都市绿洲', title: '冯德尔公园 (Vondelpark)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/2/27/Vondelpark_Amsterdam.jpg/1280px-Vondelpark_Amsterdam.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🌳 阿姆斯特丹的心脏',
        body: '只要出太阳，这里就会长满野餐、烤肉、看书、滑旱冰的荷兰人。夏天还有免费的露天剧场，表演从爵士乐到古典音乐，全年无休。',
        tip: '带上超市买的啤酒和薯片，和朋友在草地躺一下午，这是最便宜也最惬意的阿姆周末消遣。不需要消费一分钱。'
    },
    {
        id: 't69', tag: '#神圣阅读', title: '多米尼加书店 (Dominicanen)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Boekhandel_Dominicanen_%28Maastricht%29_-_interior.jpg/800px-Boekhandel_Dominicanen_%28Maastricht%29_-_interior.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '📖 哥特式教堂变身世界最美书店',
        body: '由一座拥有 700 年历史的哥特式大教堂改造。巨大穹顶、古老壁画与现代黑色钢制书架完美融合。在原来教堂祭坛的位置开了一家咖啡馆。',
        tip: '去原来祭坛位置的咖啡馆喝杯咖啡，坐在这里看书，俯瞰整个书店，视角极其震撼，是不可错过的体验。'
    },
    {
        id: 't70', tag: '#未来建筑', title: '格罗宁根论坛 (Forum)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Forum_Groningen_2019.jpg/1280px-Forum_Groningen_2019.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🏢 像外星飞船降落老城的文化中心',
        body: '这座极其前卫的文化中心大楼内含图书馆、电影院、国家漫画博物馆和顶层全景露台。里面有一部超长的错层电梯贯穿全楼，本身就是一件艺术装置。',
        tip: '顶楼露台免费开放，能 360° 俯瞰格罗宁根全城，也是看日落的最佳地点。图书馆对公众免费开放，可以进去感受氛围。'
    },
    {
        id: 't71', tag: '#文化殿堂', title: '国家博物馆 (Rijksmuseum)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Rijksmuseum_Amsterdam_%28cropped%29.jpg/1280px-Rijksmuseum_Amsterdam_%28cropped%29.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🖼️ 荷兰黄金时代的缩影',
        body: '馆藏伦勃朗极其巨大的《夜巡》和维米尔的《倒牛奶的女仆》。博物馆中间有一条极其开阔的自行车隧道穿过，你可以骑着单车，听着街头艺人的琴声穿越这座艺术圣殿。',
        tip: '博物馆极其火爆，必须提前数天在线购票。一楼大厅对外免费开放，不买票也能进来看看建筑本身就值了。'
    },
    {
        id: 't72', tag: '#艺术朝圣', title: '梵高博物馆',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Van_Gogh_Museum_facade.jpg/800px-Van_Gogh_Museum_facade.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🌻 疯子与天才的向日葵',
        body: '全世界收藏梵高作品最多的一家博物馆。从《吃土豆的人》到《向日葵》再到《杏花》，按时间轴展示了他短暂且灿烂的一生，是来荷兰必打卡的殿堂级场所。',
        tip: '极其火爆！必须提前数周在线抢票，绝对不要指望当天在门口买到票，门口几乎永远是排到转角的长龙。'
    },
    {
        id: 't73', tag: '#沉重记忆', title: '安妮·弗兰克之家',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/2/27/Anne_Frank_House_Amsterdam.jpg/800px-Anne_Frank_House_Amsterdam.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '📓 藏在书架后的密室',
        body: '二战期间，犹太女孩安妮和家人藏在运河房密室里写下了著名的《安妮日记》。推开那个伪装成书柜的暗门，爬上极其陡峭的楼梯，能真切感受到当时那种压抑与绝望。',
        tip: '门票必须提前数周在官网抢购，几乎每天都会售罄。馆内禁止拍照，这里需要用心去感受，而不是打卡。'
    },
    {
        id: 't74', tag: '#全民狂欢', title: '南方狂欢节 (Carnaval)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Carnaval_2020_in_Den_Bosch.jpg/1280px-Carnaval_2020_in_Den_Bosch.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🎭 颠覆三观的三天三夜',
        body: '通常在 2 月。荷兰南部（马城、布雷达、Den Bosch）陷入疯狂：所有人穿着极其浮夸搞笑的 Cosplay 服装在大街上喝酒跳舞。如果你穿着普通衣服走在街上，反而会被当成异类。',
        tip: '提前几个月定好南部城市的住宿，狂欢节期间价格会暴涨三倍且极难订到。衣服越夸张越好。'
    },
    {
        id: 't75', tag: '#文化争议', title: '黑彼得的争论 (Zwarte Piet)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/4/44/Zwarte_piet_2011.jpg/800px-Zwarte_piet_2011.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🧑‍🦱 荷兰每年的年度大辩论',
        body: 'Sinterklaas 的助手黑彼得，传统形象是黑脸红唇，近年因涉嫌种族歧视在荷兰引发极其激烈的全国大辩论和抗议。很多城市已改成脸上只有灰尘的"烟囱彼得"。',
        tip: '这是荷兰极其敏感的政治文化话题，在荷兰人面前谨慎站队，无论哪边都有人会非常不高兴。'
    },
    {
        id: 't76', tag: '#孩童之光', title: '圣马丁节 (Sint Maarten)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/8/86/Sint_Maarten_lantaarn.jpg/800px-Sint_Maarten_lantaarn.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🏮 荷兰版"不给糖就捣蛋"',
        body: '每年 11 月 11 日晚上，小朋友们提着自己手工制作的彩色灯笼，挨家挨户敲门唱圣马丁歌，换取糖果。整个街区灯笼点点，极其温馨治愈。',
        tip: '如果你住在底楼，这一晚记得提前买一大袋糖果备着！通常从日落开始到晚上 7 点半结束。'
    },
    {
        id: 't77', tag: '#动物至上', title: '世界动物日 (Dierendag)',
        imgUrl: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '🐶 宠物也要过大年',
        body: '10 月 4 日。荷兰是世界上第一个消灭了流浪狗的国家，动物在这里拥有极高的社会地位。这一天主人为宠物准备丰盛晚餐，部分小学允许孩子把宠物带去教室。',
        tip: '荷兰的宠物咖啡馆非常普遍，很多咖啡馆欢迎你带狗进去。街上见到萌宠，问主人"Mag ik je hond aaien?"（我可以摸你的狗吗？）是正确礼仪。'
    },
    {
        id: 't78', tag: '#皇家排面', title: '王子日 (Prinsjesdag)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Prinsjesdag_2017_%2838155651296%29.jpg/1280px-Prinsjesdag_2017_%2838155651296%29.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '👑 金马车与夸张帽子大赏',
        body: '9 月第三个星期二，荷兰国王乘坐奢华的玻璃马车（原金马车）前往国会宣读年度预算案。这一天最大的看点是女政客们争奇斗艳的极其夸张的帽子。',
        tip: '海牙 Binnenhof 附近这天人山人海，提前一小时到才能占到好位置。下午 3 点左右马车会从原路返回，那时人少很多。'
    },
    {
        id: 't79', tag: '#夏日游乐', title: '荷兰巡回游乐场 (Kermis)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/6/64/Kermis_Eindhoven.jpg/1280px-Kermis_Eindhoven.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🎡 突然出现在市中心的嘉年华',
        body: '春夏时节，巨大的摩天轮、跳楼机、大摆锤会像变魔术一样，在一夜之间搭建在城市的最中心广场上！每个城市都有自己的 Kermis 传统，规模和时间不同。',
        tip: '嘉年华小摊上买一份裹满糖粉的炸油条 (Churros) 是标配。射击摊和娃娃机的荷兰语版本都是极好的语言练习场景。'
    },
    {
        id: 't80', tag: '#肃穆时刻', title: '全荷哀悼日 (Dodenherdenking)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Dodenherdenking_2010_Dam.jpg/1280px-Dodenherdenking_2010_Dam.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🕊️ 让整个国家静止的两分钟',
        body: '5 月 4 日晚 8 点，纪念二战及所有战争遇难者。这一刻，火车停驶，电视静音，马路上的汽车停下，数百万荷兰人同时屏气凝神，站立默哀。',
        tip: '在这两分钟内，无论你在哪里，都应该停下来保持安静。这是荷兰极其神圣庄重的时刻，不遵守会引发强烈反应。'
    },
    {
        id: 't81', tag: '#水网密布', title: '阿姆斯特丹免费渡轮 (GVB Pont)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/8/87/GVB_pont_Amsterdam.jpg/1280px-GVB_pont_Amsterdam.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '⛴️ 24 小时永远免费的过江渡轮',
        body: '从阿姆斯特丹中央火车站背后，直接推着自行车走上一艘巨大的蓝白渡轮，几分钟就能抵达对岸的北区 (Noord)，那里有阿姆斯特丹最时髦的仓库文化区 NDSM。',
        tip: '渡轮 24 小时运行，免费，不需要 OV 卡。站在船头吹海风，看城市天际线，是极佳的穷游体验，强烈推荐傍晚去。'
    },
    {
        id: 't82', tag: '#冰上传说', title: '十一城之战 (Elfstedentocht)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Elfstedentocht_1985_%28cropped%29.jpg/1280px-Elfstedentocht_1985_%28cropped%29.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🥶 气候变暖让它成为了传说',
        body: '长达 200 公里的天然冰面滑冰比赛，需要穿过弗里斯兰省 11 座城市。只有在极端严寒下冰层达到 15 厘米才能举办。上一次举办是 1997 年，荷兰人每年冬天祈祷严寒降临。',
        tip: '即使比赛不能举办，弗里斯兰省的城市每年冬天也有小型纪念活动。参加当地冰鞋俱乐部是体验这种荷兰精神的最好方式。'
    },
    {
        id: 't83', tag: '#室内游戏', title: '荷兰沙壶球 (Sjoelen)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Sjoelbak.jpg/1280px-Sjoelbak.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🎯 每个家庭车库里的木制神器',
        body: '几乎每个荷兰家庭都有一块长长的木板。规则是用力把几十个木制圆盘沿长板滑出去，滑进尽头 4 个小洞里计分。极度容易上头，是家庭聚会里引发竞技胜负欲的罪魁祸首。',
        tip: '二手市场经常能以 5-10 欧买到一套，新品要 30+ 欧。规则学起来五分钟，精通需要终身修炼。'
    },
    {
        id: 't84', tag: '#小众运动', title: '男女混打合球 (Korfbal)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Korfbal-wedstrijd.jpg/1280px-Korfbal-wedstrijd.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '⛹️ 荷兰人自己发明的篮球变种',
        body: '世界上极少数规定必须由 4 男 4 女组成混合队伍的球类运动。没有篮板，只有一个没有网的黄色高筒篮筐。不允许运球，只能传球或投篮，极其考验团队配合。',
        tip: '各大城市都有 Korfbal 俱乐部，欢迎外国留学生加入，是融入本地社交圈最快的运动之一，比足球接待外国人更热情。'
    },
    {
        id: 't85', tag: '#童年记忆', title: '国王游戏日 (Koningsspelen)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/6/64/Koningsspelen_2014.jpg/1280px-Koningsspelen_2014.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🏅 全国小学生的橙色运动狂欢',
        body: '国王节前一个周五，全荷兰小学生穿橙色衣服，先吃一顿丰盛的国王早餐，然后进行一整天的户外运动和舞蹈。每年还专门发布一首极其洗脑的主题儿歌。',
        tip: '如果你在学校旁边住，这天早上你会被极其欢快的儿童音乐准时唤醒，这是荷兰春天最活力四射的画面之一。'
    },
    {
        id: 't86', tag: '#音乐信仰', title: '硬派电音 (Hardstyle)',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/3/35/Defqon.1_Festival.jpg/1280px-Defqon.1_Festival.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🎛️ 世界百大 DJ 的摇篮',
        body: '荷兰那么小，却输出了 Martin Garrix、Tiësto、Armin van Buuren 等一批世界级 DJ，因为电音就是荷兰人的流行乐。每年夏天有数十个大型电音节。',
        tip: '去荷兰电音节（如 Defqon.1、A State of Trance）不戴耳塞会真的损伤听力。当地药店卖的专业音乐耳塞 (gehoorbescherming) 约 15 欧，值得买。'
    },
    {
        id: 't87', tag: '#极简生活', title: '自带午餐盒 (Broodtrommel)',
        imgUrl: 'https://images.pexels.com/photos/5257544/pexels-photo-5257544.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '🥪 世界上最无聊的荷兰午餐',
        body: '中午去大学微波炉热红烧肉？荷兰同学会用惊奇的眼光看着你。他们的午餐永远是：一个塑料盒，装着两片冷面包夹一片火腿和奶酪，用不超过三分钟吃完。',
        tip: '别笑！自带午餐的荷兰人一年省下的伙食费可以多去三次度假。宿舍提前做好 meal prep 是和他们相处最快拉近感情的话题。'
    },
    {
        id: 't88', tag: '#灵魂辅料', title: '万物皆可大蒜酱 (Knoflooksaus)',
        imgUrl: 'https://images.pexels.com/photos/4553111/pexels-photo-4553111.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '🧄 荷兰胃的终极伴侣',
        body: '吃土耳其烤肉包 (Turkse Pizza)？加大蒜酱！吃炸鱼块 (Kibbeling)？加大蒜酱！吃薯条？必须加大蒜酱！极其浓郁、上头，是荷兰街头小吃的灵魂。',
        tip: '吃完之后，请务必嚼两粒口香糖再和别人社交，这不是建议，这是生存必需。'
    },
    {
        id: 't89', tag: '#省钱算术', title: '荷兰四舍五入',
        imgUrl: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=800',
        copyright: '© Pexels', crop: 'center',
        hook: '💶 消失的 1 分和 2 分硬币',
        body: '荷兰超市现金结账，如果总价是 10.02 欧，收你 10 欧；如果是 10.03 欧，按 10.05 欧收。荷兰采用"二舍三入、七舍八入"抹零法，1 分和 2 分硬币几乎绝迹。',
        tip: '用银行卡付款不受此影响，会精确到分。但在某些只收现金的集市或停车场，带足整数零钱会让你和摊主都轻松很多。'
    },
    {
        id: 't90', tag: '#毕业仪式', title: '门外的国旗与书包',
        imgUrl: 'https://wsrv.nl/?url=upload.wikimedia.org/wikipedia/commons/thumb/1/12/Geslaagd_vlag_en_tas.jpg/800px-Geslaagd_vlag_en_tas.jpg',
        copyright: '© Wikimedia Commons', crop: 'center',
        hook: '🎒 荷兰最骄傲的庆祝方式',
        body: '每年 6 月，走在住宅区会发现很多房子外墙挂着荷兰国旗，旗杆尖端还赫然挂着一个破旧的书包！这是荷兰家庭庆祝自家小孩中学毕业 (Geslaagd) 的最高调仪式。',
        tip: '路过看到时，大声说一句"Gefeliciteerd！"（恭喜！）朝门里喊，出来的荷兰家长一定会满脸笑容地跟你道谢。'
    }
];
