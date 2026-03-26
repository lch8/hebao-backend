// ==========================================
// 📂 文件路径: js/data/daily-cards.js
// 荷兰日历档案：节日彩蛋 + 宝藏小镇双引擎版
// ==========================================
window.App = window.App || {};

// 🎁 1. 节日彩蛋库 (带 date 触发器，MM-DD 格式)
window.App.holidayCardsData = [
    {
        date: '01-01',
        id: 'h01',
        tag: '#新年传统',
        title: '跨年炸球 (Oliebollen)',
        imgUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🎆 新年快乐！荷兰人的“年夜饭”必吃</b><br><br>今天如果不吃上几个油炸面团球 Oliebollen，在荷兰人眼里这个年就算白过了！快去街头的餐车买一份，祝你在荷兰新的一年万事胜意！'
    },
    {
        date: '04-27',
        id: 'h02',
        tag: '#今日限定',
        title: '国王节 (King\'s Day) 狂欢',
        imgUrl: 'https://images.unsplash.com/photo-1533222481259-ce20eda1e20b?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center 30%',
        desc: '<b>👑 穿上橙色衣服，出门蹦迪！</b><br><br>今天是国王威廉·亚历山大的生日！全荷兰已经化作橙色的癫狂海洋。别待在家里了，去街头的跳蚤市场捡漏，去运河边看游船电音派对！'
    },
    {
        date: '05-05',
        id: 'h03',
        tag: '#国家记忆',
        title: '荷兰解放日 (Bevrijdingsdag)',
        imgUrl: 'https://images.unsplash.com/photo-1555505019-8c3f1c4aba5f?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🇳🇱 自由的重量</b><br><br>今天是纪念荷兰从二战纳粹占领中解放的日子。各大城市都会举办免费的露天音乐节 (Bevrijdingsfestivals)，去感受一下荷兰人对和平与自由的热爱吧！'
    },
    {
        date: '12-05',
        id: 'h04',
        tag: '#荷兰特供',
        title: '圣尼古拉斯节 (Sinterklaas)',
        imgUrl: 'https://images.unsplash.com/photo-1543883192-383792cbcc26?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🎁 荷兰人自己的“圣诞节”</b><br><br>在荷兰，今天比 12 月 25 日更重要！Sinterklaas 会骑着白马，带着助手给好孩子发礼物和 Pepernoten（小姜饼）。今晚是拆礼物的“惊奇之夜”！'
    },
    {
        date: '12-25',
        id: 'h05',
        tag: '#温馨冬日',
        title: '圣诞节 (Kerstmis)',
        imgUrl: 'https://images.unsplash.com/photo-1545622783-b3e0214ee4f3?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🎄 荷村的冬日童话</b><br><br>外面的妖风再大，也吹不灭荷兰人客厅里的蜡烛和温馨。点亮圣诞树，和朋友们聚在一起吃一顿丰盛的晚餐，感受最纯粹的 Gezellig 吧！'
    }
];

// 🗺️ 2. 宝藏小镇轮播库 (平时无节日时，每天循环一张)
window.App.townCardsData = [
    {
        id: 't01', tag: '#仙境村落', title: '羊角村 (Giethoorn)',
        imgUrl: 'https://images.unsplash.com/photo-1600215754990-6e7946d1e37a?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center 30%',
        desc: '<b>🇳🇱 荷兰威尼斯，无路之城</b><br><br>全村没有一条汽车公路，出行全靠纵横交错的运河与小木船。茅草屋配上绣球花，完美复刻了格林童话里的世界。'
    },
    {
        id: 't02', tag: '#世界遗产', title: '小孩堤防 (Kinderdijk)',
        imgUrl: 'https://images.unsplash.com/photo-1464692805480-a69dfaafdb0d?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center 30%',
        desc: '<b>🌬️ 19座古老风车的史诗</b><br><br>去鹿特丹旁边，看看这片保留了几个世纪的抽水风车群。黄昏时分，微风拂过芦苇荡，你能感受到荷兰人与水共生的历史厚重感。'
    },
    {
        id: 't03', tag: '#皇家静谧', title: '代尔夫特 (Delft)',
        imgUrl: 'https://images.unsplash.com/photo-1605634563815-564ec5a66bf1?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🏺 蓝陶与名画的故乡</b><br><br>这里有全欧洲顶尖的代尔夫特理工，也是名画《戴珍珠耳环的少女》的诞生地。古老的运河房倒映在水中，比阿姆斯特丹多了一份宁静与皇家的高贵。'
    },
    {
        id: 't04', tag: '#大学之城', title: '乌得勒支 (Utrecht)',
        imgUrl: 'https://images.unsplash.com/photo-1554426549-d04bcf1b2e15?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🏰 拥有下沉式运河的古城</b><br><br>荷兰最古老、最活力的大学城之一。这里的运河 (Oudegracht) 极其特殊，水面低于街道，沿河全是下沉式的地窖咖啡馆，抬头就能看见宏伟的主教塔。'
    },
    {
        id: 't05', tag: '#未来之城', title: '鹿特丹 (Rotterdam)',
        imgUrl: 'https://images.unsplash.com/photo-1582296495861-5db0d60ecf6c?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center 20%',
        desc: '<b>🏗️ 赛博朋克般的建筑实验场</b><br><br>二战被夷为平地后，这里重生为狂野建筑师的天堂：倾斜 45 度的立体方块屋、巨大马蹄形的拱廊市场，这里充满了现代感十足的魔幻气息。'
    },
    {
        id: 't06', tag: '#政治中心', title: '海牙 (Den Haag)',
        imgUrl: 'https://images.unsplash.com/photo-1597401309854-47702fdf0db4?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center 40%',
        desc: '<b>⚖️ 庄严的国际法庭与海滩</b><br><br>虽然首都阿姆，但荷兰政府、王室和国际法庭都在海牙。除了庄严的国会大厦 (Binnenhof)，这里还有荷兰最美的席凡宁根 (Scheveningen) 黄金沙滩。'
    },
    {
        id: 't07', tag: '#最美老城', title: '哈勒姆 (Haarlem)',
        imgUrl: 'https://images.unsplash.com/photo-1596236940027-f4e918c50a50?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🌸 阿姆的绝美后花园</b><br><br>距离阿姆仅 15 分钟车程，却避开了拥挤的游客。这里有极具中世纪风情的广场、风车和隐秘的庭院，是荷兰本地人最爱周末闲逛的宝藏城市。'
    },
    {
        id: 't08', tag: '#学术圣地', title: '莱顿 (Leiden)',
        imgUrl: 'https://images.unsplash.com/photo-1605300185160-b80c102a9263?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>📚 爱因斯坦教过书的地方</b><br><br>这里坐落着荷兰最古老的莱顿大学。漫步在纵横交错的运河边，你会不经意在斑驳的墙壁上发现各种语言的诗歌涂鸦，学术底蕴极其深厚。'
    },
    {
        id: 't09', tag: '#风车遗珠', title: '桑斯安斯 (Zaanse Schans)',
        imgUrl: 'https://images.unsplash.com/photo-1509355694291-766b26c04fbc?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🍃 穿越回 18 世纪的荷兰工业</b><br><br>除了绝美的绿木风车，这里还保留了传统木鞋制造厂和奶酪作坊。空气中混合着青草和巧克力的香气（附近有可可厂），是极致的感官体验。'
    },
    {
        id: 't10', tag: '#欧洲阳台', title: '马斯特里赫特 (Maastricht)',
        imgUrl: 'https://images.unsplash.com/photo-1627999812497-6a45fc48bfa3?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🍷 最不“荷兰”的浪漫边境小镇</b><br><br>位于荷兰最南端，被比利时和德国包围。这里的建筑更偏向法式和罗马风格，有由古老教堂改造的绝美书店，整座城市散发着慵懒的红酒气息。'
    },
    {
        id: 't11', tag: '#奶酪之城', title: '豪达 (Gouda)',
        imgUrl: 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🧀 闻名世界的巨型奶酪</b><br><br>你一定在超市见过 Gouda 奶酪。这座古城在春夏会举办盛大的传统奶酪交易市场，穿着传统服饰的人们抬着巨大的奶酪轮在广场上奔跑飞驰。'
    },
    {
        id: 't12', tag: '#水城迷宫', title: '多德雷赫特 (Dordrecht)',
        imgUrl: 'https://images.unsplash.com/photo-1548171092-2bd33e506689?auto=format&fit=crop&w=800&q=80', // 借用高质量运河图
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🚢 漂浮在水上的荷兰最古老城市</b><br><br>作为荷兰被授予城市权利最古老的地方，这里被纵横的河流包围。老城区的港口和隐秘庭院，藏着最浓郁的中世纪航海记忆。'
    },
    {
        id: 't13', tag: '#渔村风情', title: '福伦丹 (Volendam)',
        imgUrl: 'https://images.unsplash.com/photo-1534057308991-b9b3a578f1b1?auto=format&fit=crop&w=800&q=80', // 借用高质量渔业/海鲜图
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🎣 北海边的传统渔村</b><br><br>五颜六色的木制房屋排在海港边，这里保留了最淳朴的荷兰渔业传统。漫步海边，吃一份刚炸好的生猛海鲜 Kibbeling，海风会带走所有的烦恼。'
    },
    {
        id: 't14', tag: '#北方之都', title: '格罗宁根 (Groningen)',
        imgUrl: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=800&q=80', // 借用高质量单车道图代表年轻活力
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🎓 最年轻、最狂野的不夜城</b><br><br>地处遥远的北方，因为拥有庞大的学生群体，这里的酒吧完全没有打烊时间！它是欧洲的自行车之都，充满了叛逆、先锋和年轻的荷尔蒙。'
    },
    {
        id: 't15', tag: '#历史壁垒', title: '阿默斯福特 (Amersfoort)',
        imgUrl: 'https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=800&q=80', // 借用古典街景
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🧱 完美保留的双重护城河</b><br><br>一座将中世纪城墙、水门和双重护城河保留得极其完美的老城。沿着护城河散步，触摸着百年红砖墙，仿佛走进了一部欧洲古典电影。'
    },
    // ... 前面是你已有的 t01 到 t15 的代码 ...

    // ----------------- 全新扩充：奇葩日常与舌尖荷村 -----------------
    {
        id: 't16', tag: '#社交法则', title: '荷兰式直白 (Dutch Directness)',
        imgUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🗣️ 没礼貌还是真性情？</b><br><br>荷兰人说话以“直接”著称。如果你问同学你的衣服好看吗，他觉得丑会直接说：“这件衣服让你看起来像个土豆”。<br><br>💡 <b>管家Tips：</b>千万别玻璃心！他们对事不对人，这在他们看来是最高效、最真诚的沟通方式。'
    },
    {
        id: 't17', tag: '#街头解馋', title: '炸鱼块 (Kibbeling)',
        imgUrl: 'https://images.unsplash.com/photo-1599084990807-75050f5fa245?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🐟 海鲜市场的快乐源泉</b><br><br>不敢吃生吞鲱鱼？那就试试 Kibbeling！将新鲜的鳕鱼切块，裹上特制面糊炸至金黄，外酥里嫩。<br><br>💡 <b>管家Tips：</b>去露天集市买一份，必须蘸满浓郁的大蒜酱 (Knoflooksaus)，边走边吃，简直是碳水与脂肪的双重狂欢！'
    },
    {
        id: 't18', tag: '#硬核带娃', title: '货运自行车 (Bakfiets)',
        imgUrl: 'https://images.unsplash.com/photo-1516886635086-2b3c423c0947?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center 40%',
        desc: '<b>🛒 荷兰人的“皮卡车”</b><br><br>在荷兰街头，你经常会看到前面带个巨大木箱的自行车。这叫 Bakfiets。里面可能装着三个刚放学的孩子、一条金毛犬，外加一周的超市采购。<br><br>💡 <b>管家科普：</b>不管刮风下雨，荷兰主妇都能蹬着这种“巨无霸”在街上狂飙，战斗力极其惊人。'
    },
    {
        id: 't19', tag: '#国民超市', title: '神圣的 Bonus 卡',
        imgUrl: 'https://images.unsplash.com/photo-1588887955513-b54199fc9641?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>💳 没这张卡，你会被超市反撸</b><br><br>Albert Heijn (AH) 是荷兰最大的连锁超市。这里的所有打折商品（标签上写着蓝色的 Bonus），只有刷会员卡才能享受优惠！<br><br>💡 <b>管家避雷：</b>落地第一天就去柜台免费拿一张实体的 Bonuskaart，或者在 App 里注册，能帮你省下一半的饭钱！'
    },
    {
        id: 't20', tag: '#暗黑料理', title: '土豆泥大乱炖 (Stamppot)',
        imgUrl: 'https://images.unsplash.com/photo-1606851682837-29369eb07bf7?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🥔 荷兰人过冬的终极武器</b><br><br>把土豆、羽衣甘蓝煮熟捣成泥，中间挖个坑倒进浓肉汁，再配上一根硕大的烟熏香肠 (Rookworst)。<br><br>💡 <b>管家吃法：</b>这道菜毫无摆盘可言，看起来像猪食，但在妖风肆虐的冬夜吃上一大口，热量瞬间充斥全身。'
    },
    {
        id: 't21', tag: '#社交礼仪', title: '左右左，贴面吻',
        imgUrl: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>💋 让人社恐发作的打招呼方式</b><br><br>在荷兰，朋友见面或告别时，标准礼仪是贴面亲吻脸颊。而且次数极其严格：必须是三次！（右脸-左脸-右脸）。<br><br>💡 <b>管家避雷：</b>只亲一次或两次都会让场面极其尴尬。如果不习惯，在对方凑过来之前，果断伸出手大声说“Hoi”并用力握手！'
    },
    {
        id: 't22', tag: '#奇葩文化', title: '见缝插针的预约 (Agenda)',
        imgUrl: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>📅 连去爸妈家吃晚饭都要预约</b><br><br>荷兰人是时间管理的重度强迫症患者，每个人的生活都被 Agenda（日程本）安排得明明白白。<br><br>💡 <b>管家科普：</b>如果想约荷兰同学喝咖啡，千万别问“今晚有空吗”，他们通常会翻开日历说：“让我看看...下周四下午 3 点到 4 点我有 60 分钟的空档”。'
    },
    {
        id: 't23', tag: '#租房内卷', title: '看房面试 (Hospiteren)',
        imgUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🏠 找个房间比找工作还难</b><br><br>在荷兰租学生合租房，不是有钱就能住！室友们会举办一场选拔会，邀请十几个候选人来聊天喝酒。<br><br>💡 <b>管家Tips：</b>这就是著名的 Hospiteren。他们要在几十分钟内判断你的性格、卫生习惯，最后全体投票决定谁能搬进来。社牛在这里极具优势！'
    },
    {
        id: 't24', tag: '#魔幻铁路', title: '树叶导致火车停运',
        imgUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🚆 NS 铁路局的千层借口</b><br><br>荷兰火车极其准时，但也极其脆弱。秋天铁轨上有落叶、冬天下了一厘米的雪、春天轨道上有只迷路的羊，火车都会立刻延误甚至停运。<br><br>💡 <b>管家避雷：</b>出门赶飞机或重要考试，务必提前在 NS App 上查看车次状态，绝不能卡点出门！'
    },
    {
        id: 't25', tag: '#冬日限定', title: '运河滑冰大赏',
        imgUrl: 'https://images.unsplash.com/photo-1518306352932-d1fb7d0b8108?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center 40%',
        desc: '<b>⛸️ 全民冰上狂欢</b><br><br>当气温连续几天低于零下，整个荷兰都会沸腾！人们会拿出储藏室里的冰鞋，直接在冻结的阿姆斯特丹运河上滑冰通勤。<br><br>💡 <b>管家科普：</b>这是刻在荷兰人 DNA 里的热爱。如果冰层够厚，还会举办传说中的“十一城冰上马拉松 (Elfstedentocht)”。'
    },
    {
        id: 't26', tag: '#碳水炸弹', title: '战争薯条 (Patatje Oorlog)',
        imgUrl: 'https://images.unsplash.com/photo-1598679253544-2c97992403ea?auto=format&fit=crop&w=800&q=80', // 共用优质薯条图
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🍟 名字极其暴力的街头美食</b><br><br>为什么叫“战争”？因为这份薯条上混合了浓郁的沙爹花生酱、蛋黄酱，最后撒上一把生洋葱碎。<br><br>💡 <b>管家吃法：</b>这三种酱料在纸盒里混战，看起来一塌糊涂，但吃进嘴里，花生酱的香浓和洋葱的辛辣碰撞，绝对让你欲罢不能！'
    },
    {
        id: 't27', tag: '#自然奇迹', title: '阿夫鲁戴克大堤 (Afsluitdijk)',
        imgUrl: 'https://images.unsplash.com/photo-1464692805480-a69dfaafdb0d?auto=format&fit=crop&w=800&q=80', // 共用震撼水景图
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🌊 上帝创造世界，荷兰人创造荷兰</b><br><br>一条长达 32 公里的人工大堤，生生将咆哮的北海一分为二，把内海变成了淡水湖。<br><br>💡 <b>管家科普：</b>这是人类治水史上的究极奇迹。行驶在这条一眼望不到头的大堤上，两边都是海水，你才能真正体会“精卫填海”的震撼。'
    },
    {
        id: 't28', tag: '#夏日狂欢', title: '席凡宁根沙滩 (Scheveningen)',
        imgUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🏖️ 海牙的黄金海岸线</b><br><br>只要一出太阳，荷兰人就会像向日葵一样全长在沙滩上。这里有巨大的摩天轮、蹦极塔，和吃不完的海鲜餐厅。<br><br>💡 <b>管家Tips：</b>这里的海鸥极其凶残！在海边吃炸鱼或薯条时，必须时刻盯着天空，否则你的食物会被它们瞬间俯冲抢走！'
    },
    {
        id: 't29', tag: '#超市迷惑', title: '不带刺的黄瓜',
        imgUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80', // 占位图
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🥒 塑料味还是高科技？</b><br><br>荷兰的农产品极度发达，但你在超市买到的蔬菜水果，往往长得极其标致完美，却没有“本来的味道”。<br><br>💡 <b>管家科普：</b>这里的黄瓜巨大且表面光滑，西红柿红得发亮，因为它们大多是在极其先进的温室无土栽培环境里工业化生产出来的。'
    },
    {
        id: 't30', tag: '#二手文化', title: '万物皆可 Marktplaats',
        imgUrl: 'https://images.unsplash.com/photo-1555505019-8c3f1c4aba5f?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🛒 荷兰版“闲鱼”的诱惑</b><br><br>荷兰人极度务实且提倡环保，买卖二手物品是全民爱好。从沙发、自行车到锅碗瓢盆，都可以在 Marktplaats 上交易。<br><br>💡 <b>管家Tips：</b>作为新生，别急着买宜家的新家具，去上面淘一淘，经常能遇到毕业学长学姐免费送家具，只要你自己上门搬走就行！'
    },
    // ==========================================
    // 🚀 第三期：365天计划暴走扩充 (t31 - t90)
    // 涵盖：地道美食、奇葩脑回路、留学生存铁拳、隐秘秘境
    // ==========================================

    // --- 🍟 脂肪与碳水：荷兰街头觅食指南 ---
    {
        id: 't31', tag: '#国民早餐', title: '巧克力碎 (Hagelslag)',
        imgUrl: 'https://images.unsplash.com/photo-1511381939415-e1652359fae5?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🍫 把蛋糕装饰当饭吃</b><br><br>荷兰人每年消耗 1400 万公斤巧克力碎！他们的标准早餐就是：一片白面包，抹上厚厚的黄油，然后撒满巧克力碎。<br><br>💡 <b>管家Tips：</b>去超市买一盒 De Ruijter 牌的 Hagelslag，开启你地道的荷式早晨！'
    },
    {
        id: 't32', tag: '#暗黑夜宵', title: '理发店薯条 (Kapsalon)',
        imgUrl: 'https://images.unsplash.com/photo-1598679253544-2c97992403ea?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>💣 1800卡路里的究极热量炸弹</b><br><br>底铺薯条，盖上烤土耳其烤肉 (Shoarma)，铺满高达奶酪烤化，最后淋上大蒜酱和辣酱。<br><br>💡 <b>管家科普：</b>这道菜由鹿特丹的一位理发师发明。深夜蹦完迪后来一份，能让你原地升天。'
    },
    {
        id: 't33', tag: '#街头盲盒', title: '墙上小吃 (FEBO)',
        imgUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🧱 自动贩卖机里的热腾腾美食</b><br><br>荷兰街头独有的 Automatiek。一整面玻璃墙，里面放着炸肉卷、汉堡。投币或刷卡，打开小门就能直接拿走吃。<br><br>💡 <b>管家Tips：</b>赶火车来不及吃饭？去 FEBO 墙里掏一个 Kaassoufflé（炸奶酪派），极其酥脆解馋！'
    },
    {
        id: 't34', tag: '#粉色诱惑', title: '国王节限定 (Tompouce)',
        imgUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🍰 吃相最难看的国民甜点</b><br><br>两片硬邦邦的酥皮，夹着极厚的香草卡仕达酱，顶层是粉红色的糖霜（国王节会变成橙色）。<br><br>💡 <b>管家挑战：</b>吃它绝对会弄得满脸都是奶油！优雅吃法的秘诀是：把顶层酥皮掀下来，贴在底部一起咬。'
    },
    {
        id: 't35', tag: '#养生饮品', title: '新鲜薄荷茶 (Verse Muntthee)',
        imgUrl: 'https://images.unsplash.com/photo-1576092762791-dd9e2220afa1?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🌿 最朴素的“高档饮品”</b><br><br>去荷兰的咖啡馆，你以为会有什么复杂的茶饮？他们只会抓一大把没切碎的新鲜薄荷叶，直接塞进玻璃杯，倒上开水。<br><br>💡 <b>管家Tips：</b>虽然简单粗暴，但配上一小勺蜂蜜，在阴冷的雨天喝一口，从胃里暖到心里。'
    },
    {
        id: 't36', tag: '#超市必买', title: '液体布丁 (Vla)',
        imgUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🥛 像喝酸奶一样喝布丁</b><br><br>这是荷兰独有的一种粘稠乳制品，介于酸奶和布丁之间，装在纸盒里。有香草、巧克力、焦糖等各种口味。<br><br>💡 <b>管家吃法：</b>荷兰人喜欢把香草和巧克力 Vla 混在一个碗里吃，叫做 Dubbelvla，极其顺滑香甜。'
    },
    {
        id: 't37', tag: '#微醺时刻', title: '荷兰琴酒 (Jenever)',
        imgUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🍸 英国金酒 (Gin) 的老祖宗</b><br><br>由杜松子酿造的荷兰传统烈酒。传统的倒酒方式是倒满整个郁金香形小杯，直到表面张力让酒液鼓起。<br><br>💡 <b>管家礼仪：</b>第一口绝对不能用手端杯子，必须把手背在身后，弯下腰去把酒“啜”一小口！'
    },
    {
        id: 't38', tag: '#国民饮料', title: '黄色魔力 (Chocomel)',
        imgUrl: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🍫 荷兰唯一的真神饮料</b><br><br>极其醒目的亮黄色包装，这是荷兰人从小喝到大的巧克力奶。口感极其浓郁丝滑。<br><br>💡 <b>管家Tips：</b>冬天去露天滑冰场，必须点一杯热的 Chocomel（上面还要挤一大坨鲜奶油 Slagroom），这就是荷兰的冬天！'
    },
    {
        id: 't39', tag: '#社交日常', title: '周五下班酒 (Vrijmibo)',
        imgUrl: 'https://images.unsplash.com/photo-1575037614876-c38db0ce2c26?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🍻 摸鱼的最高境界</b><br><br>Vrijmibo 是“周五下午喝一杯 (Vrijdagmiddagborrel)”的缩写。到了周五下午 4 点，荷兰公司的电脑就会准时合上，老板带头开啤酒。<br><br>💡 <b>管家科普：</b>桌上一定会配有 Bittergarnituur（综合炸物拼盘），这是打入老外圈子的最佳时机。'
    },
    {
        id: 't40', tag: '#新生宝宝', title: '老鼠屎饼干 (Muisjes)',
        imgUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>👶 庆祝新生命的硬核点心</b><br><br>荷兰人生了小孩，会在极其干硬的烤圆面包片 (Beschuit) 上，涂满黄油，撒上粉白（生女孩）或蓝白（生男孩）的茴香籽糖果。<br><br>💡 <b>管家科普：</b>如果荷兰同事带这个来学校或公司分发，赶紧恭喜他当爸爸/妈妈了！'
    },

    // --- 🧠 奇葩脑回路：理解荷兰人的精神状态 ---
    {
        id: 't41', tag: '#处世哲学', title: '装正常点 (Doe Normaal)',
        imgUrl: 'https://images.unsplash.com/photo-1529156069898-49953eb1f55f?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🗿 荷兰社会的终极潜规则</b><br><br>“Doe normaal, dan doe je al gek genoeg” (表现得正常点，这就已经够疯狂了)。荷兰人极其反感炫富、特立独行和过度情绪化。<br><br>💡 <b>管家解读：</b>在这里，首相也会骑自行车上下班。低调、务实、不装X，是这里的生存王道。'
    },
    {
        id: 't42', tag: '#诡异爱好', title: '去风中凌乱 (Uitwaaien)',
        imgUrl: 'https://images.unsplash.com/photo-1505672678657-cc7037095e60?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>💨 荷兰人的顶级精神内耗疗法</b><br><br>Uitwaaien 的字面意思是“在风中走”。当荷兰人心情烦躁时，他们会特意跑到海边或旷野，迎着能把人吹面瘫的 8 级狂风散步。<br><br>💡 <b>管家科普：</b>他们坚信强劲的狂风能把脑子里的杂念和压力全部“吹走”，极其硬核。'
    },
    {
        id: 't43', tag: '#全民吐槽', title: '抱怨天气 (Klagen)',
        imgUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>💬 打开话匣子的万能钥匙</b><br><br>荷兰人热爱抱怨，特别是抱怨天气 (Klagen over het weer)。“这风太大了”、“雨怎么下个不停”、“今天太热了受不了”。<br><br>💡 <b>管家Tips：</b>和荷兰人同乘电梯不知道说什么？叹口气说一句“Wat een weer hè?” (什么鬼天气啊！)，你们瞬间就能成为朋友。'
    },
    {
        id: 't44', tag: '#硬核生日', title: '圆圈生日派对 (Kringverjaardag)',
        imgUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🪑 世界上最无聊的生日派对</b><br><br>去荷兰人家里过生日，你会惊恐地发现：所有人拉着椅子围成一个大圆圈坐着。不仅要祝寿星生日快乐，还要跟圆圈里的每一个亲戚握手说“恭喜你的哥哥/侄子生日快乐”。<br><br>💡 <b>管家避雷：</b>全程只能喝咖啡、吃一块小蛋糕，干巴巴地聊天，简直是对社恐的公开处刑！'
    },
    {
        id: 't45', tag: '#奇葩萌物', title: '国民兔子 (Nijntje)',
        imgUrl: 'https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🐰 别叫她米菲，她叫 Nijntje！</b><br><br>这只嘴巴是个“X”的白色小兔子，是荷兰插画师 Dick Bruna 的国宝级杰作。在荷兰，没人叫她 Miffy，她的荷兰真名 Nijntje 是“小兔子”的缩写。<br><br>💡 <b>管家推荐：</b>乌得勒支有红绿灯都是米菲形状的！这也是给国内小朋友带礼物的首选。'
    },

    // --- 🥊 生存铁拳：税务、交通、租房避雷 ---
    {
        id: 't46', tag: '#交通神器', title: '小蓝胎自行车 (Swapfiets)',
        imgUrl: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🚲 留学生人手一辆的月租神车</b><br><br>前轮是极其醒目的蓝色轮胎。在荷兰买二手车怕被偷？坏了修车太贵？Swapfiets 每个月付十几欧租金，车坏了直接在 App 上呼叫，小哥上门免费给你换辆新的！<br><br>💡 <b>管家避雷：</b>一定要买一把巨型链条锁把它锁在铁柱子上，连人带车被偷了是要赔几百欧的！'
    },
    {
        id: 't47', tag: '#交通礼仪', title: '静音车厢 (Stiltecoupé)',
        imgUrl: 'https://images.unsplash.com/photo-1541887308731-97b5f1afbf60?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🤫 呼吸声太大都会被鄙视</b><br><br>荷兰 NS 火车上，窗户上贴着“Silence”或“S”标志的车厢是绝对静音区。在这里不能说话、不能打电话、连耳机漏音都会被对面大妈疯狂瞪眼。<br><br>💡 <b>管家警告：</b>新生结伴出游极易踩坑！上车前抬头看看标志，想聊天一定要去普通车厢。'
    },
    {
        id: 't48', tag: '#单车礼仪', title: '转向请伸手',
        imgUrl: 'https://images.unsplash.com/photo-1471506480208-91b3a4cc78be?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>👋 人肉转向灯</b><br><br>在密集的荷兰自行车流中，突然转弯是极其致命的。荷兰人骑车转弯前，一定会笔直地伸出左手或右手，示意后方车辆。<br><br>💡 <b>管家避雷：</b>入乡随俗！如果你不伸手就突然拐弯，绝对会引发连环追尾，并收获一顿纯正的荷兰国骂。'
    },
    {
        id: 't49', tag: '#最后一块拼图', title: '公共交通自行车 (OV-fiets)',
        imgUrl: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🟡 黄蓝相间的共享单车</b><br><br>坐火车到了另一个城市，怎么去市中心？用你的实名 OV 卡，在火车站能以每天 4.5 欧的白菜价租到这辆极速单车！<br><br>💡 <b>管家科普：</b>这车是倒刹车（往后踩脚踏板刹车），没有手刹！刚上手时请在空地上先练习一下，以免冲进河里！'
    },
    {
        id: 't50', tag: '#命脉号码', title: '全民唯一的 BSN',
        imgUrl: 'https://images.unsplash.com/photo-1633265486064-086b219458ce?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🆔 没有这串数字，你在荷兰寸步难行</b><br><br>Burger Service Nummer (公民服务号)。你在荷兰开银行卡、买保险、租房、拿工资，全靠它！<br><br>💡 <b>管家警告：</b>落地第一件事就是去市政厅 (Gemeente) 注册拿 BSN。预约极其火爆，在国内就要提前抢号！'
    },
    {
        id: 't51', tag: '#数字政府', title: '万能的 DigiD',
        imgUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>📱 你的数字身份证</b><br><br>有了 BSN 后，立刻去申请 DigiD。这是一个 App，无论是报税、查医疗记录、还是交学费，扫描一下二维码就能登录所有政府网站。<br><br>💡 <b>管家科普：</b>荷兰政府的数字化程度极高，装好这个 App，你几乎再也不用去线下跑办事大厅了。'
    },
    {
        id: 't52', tag: '#心脏骤停', title: '恐怖的蓝色信封',
        imgUrl: 'https://images.unsplash.com/photo-1579362749448-6a312baea4e0?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>✉️ 荷兰税务局 (Belastingdienst) 的索命信</b><br><br>在荷兰，只要你的邮箱里出现一封“亮蓝色”的信封，所有人的心率都会加快。这是税务局寄来的信，通常意味着你要交税了。<br><br>💡 <b>管家安慰：</b>别怕！如果你是穷学生，蓝信封里装的往往是退税单或者各种补贴 (Toeslag) 的好消息！'
    },
    {
        id: 't53', tag: '#生存福利', title: '薅羊毛之医疗补贴 (Zorgtoeslag)',
        imgUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>💰 政府帮你交高昂的保费</b><br><br>荷兰强制必须买医疗保险，每月高达 130 欧。但如果你是没有收入的学生，政府每个月会倒贴给你 100 多欧的补贴！<br><br>💡 <b>管家秘籍：</b>安顿好后立刻去税务局官网申请 Zorgtoeslag，这简直是留学生最大的合法羊毛，不薅血亏！'
    },
    {
        id: 't54', tag: '#看病指南', title: '佛系家庭医生 (Huisarts)',
        imgUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🩺 喝水、睡觉、扑热息痛</b><br><br>在荷兰不能直接去医院挂号！必须先去你注册的家庭医生那里看。但他们崇尚人类自身免疫力，发烧 39 度以下，医生通常只会让你回家吃 Paracetamol。<br><br>💡 <b>管家避雷：</b>如果你真的觉得很难受，必须在电话里极其夸张地描述病情，否则连医生的面都见不到！'
    },
    {
        id: 't55', tag: '#居住内卷', title: '神秘组织 DUWO 与 SSH',
        imgUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🏢 留学生的庇护所</b><br><br>荷兰的大学通常不提供免费宿舍！DUWO 和 SSH 是最大的两家学生住房机构。房子条件好、价格受政府保护。<br><br>💡 <b>管家警告：</b>房源极其紧张！一旦收到大学的注册链接，请在 1 分钟内交钱排队，手慢的话你只能去天价私人市场流浪了。'
    },

    // --- 🛍️ 荷村血拼：留学生花钱图鉴 ---
    {
        id: 't56', tag: '#国民百货', title: '永远的 HEMA',
        imgUrl: 'https://images.unsplash.com/photo-1555529771-835f59fc5efe?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🛒 荷兰版的高配无印良品</b><br><br>从文具、毛巾、锅碗瓢盆到极具设计感的小零食，HEMA 几乎包揽了荷兰人的一生。设计极简且价格亲民。<br><br>💡 <b>管家Tips：</b>去 HEMA 必须买一根他们最著名的烟熏香肠 (Rookworst)！夹在面包里吃，极其多汁。'
    },
    {
        id: 't57', tag: '#破烂王天堂', title: '神仙两元店 (Action)',
        imgUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>💸 留学生的省钱根据地</b><br><br>只要你想买不值钱但必需的小东西（垃圾袋、衣架、收纳盒、充电线、零食），千万别去大超市！<br><br>💡 <b>管家安利：</b>直奔 Action！这里的东西便宜到让人怀疑人生，拿着 20 欧进去，能推着满满一整车东西出来！'
    },
    {
        id: 't58', tag: '#药妆巨头', title: '红十字标志 (Kruidvat)',
        imgUrl: 'https://images.unsplash.com/photo-1563223771-5fe4038fbfc9?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>💊 街头最密集的日用品店</b><br><br>红底白字的 Kruidvat 是荷兰最大的平价药妆店。买洗发水、护肤品、保健品、卫生纸的首选地。<br><br>💡 <b>管家Tips：</b>他们常年搞“1+1 Gratis (买一送一)”的疯狂打折，认准这个标志再囤货，能省下巨额开销！'
    },
    {
        id: 't59', tag: '#拯救胃口', title: '橙色大军 (Thuisbezorgd)',
        imgUrl: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🛵 荷兰本土版“美团外卖”</b><br><br>风雨交加不想出门做饭？街上那些骑着电动车、背着巨大橙色保温箱的送餐员就是你的救星。<br><br>💡 <b>管家避雷：</b>荷兰外卖费和包装费极贵，随便点一份盖饭都要 20 多欧。建议少点外卖，早日修炼成中华小当家！'
    },
    {
        id: 't60', tag: '#二手市集', title: '国王节跳蚤市场',
        imgUrl: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🧸 属于全民的地摊经济</b><br><br>在 4 月 27 日这一天，荷兰免除了所有的摆摊税。所有人都把家里的闲置物品搬到街上卖。小朋友卖旧玩具，甚至在街上拉小提琴赚钱。<br><br>💡 <b>管家Tips：</b>带足现金硬币！你能用 5 欧买到几乎全新的微波炉或者正版黑胶唱片！'
    },

    // --- 🗺️ 隐秘秘境：跳出阿姆，玩转全境 ---
    {
        id: 't61', tag: '#童话世界', title: '艾夫特琳乐园 (Efteling)',
        imgUrl: 'https://images.unsplash.com/photo-1513622470522-26cb3ea453fc?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🎢 迪士尼也要叫一声前辈</b><br><br>比迪士尼历史更悠久、更暗黑、更有欧洲古典童话氛围的顶级主题乐园！这里的过山车穿梭在茂密的森林中。<br><br>💡 <b>管家Tips：</b>冬天去可以体验冬日限定的满地篝火和热红酒，沉浸感无敌！'
    },
    {
        id: 't62', tag: '#自然旷野', title: '高费吕韦国家公园 (De Hoge Veluwe)',
        imgUrl: 'https://images.unsplash.com/photo-1470071131384-001b85755536?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🌲 骑着白车看野生鹿群</b><br><br>荷兰最大的国家公园，内部地貌奇特，有森林、荒原甚至沙丘。公园提供免费的白色自行车供你骑行探索。<br><br>💡 <b>管家科普：</b>公园深处藏着大名鼎鼎的“库勒-慕勒美术馆”，里面收藏了全世界第二多的梵高真迹！'
    },
    {
        id: 't63', tag: '#离岛风光', title: '特塞尔岛 (Texel)',
        imgUrl: 'https://images.unsplash.com/photo-1544473244-f6895e69ce8d?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🐑 羊比人多的隔世孤岛</b><br><br>位于荷兰最北部的瓦登海群岛。坐 20 分钟轮渡就能抵达。这里有极长的白色沙滩、标志性的红灯塔、以及满地奔跑的绵羊。<br><br>💡 <b>管家Tips：</b>一定要去岛上的海豹救助中心 (Ecomare) 看看圆滚滚的海豹幼崽，极其治愈！'
    },
    {
        id: 't64', tag: '#极速狂飙', title: '赞德福特赛道 (Zandvoort)',
        imgUrl: 'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🏎️ 海滩边的 F1 橙色风暴</b><br><br>距离阿姆半小时车程的绝美沙滩，这里也是 F1 荷兰大奖赛的举办地。独特的倾斜弯道极其考验车手。<br><br>💡 <b>管家科普：</b>当荷兰籍车手维斯塔潘 (Max Verstappen) 比赛时，整个赛场会被疯狂的车迷点燃橙色的拉烟，极度震撼。'
    },
    {
        id: 't65', tag: '#古典奢华', title: '德哈尔城堡 (Kasteel de Haar)',
        imgUrl: 'https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🏰 荷兰最大最奢华的古堡</b><br><br>位于乌得勒支郊外，尖塔、吊桥、护城河和华丽的玫瑰花园，满足你对中世纪贵族城堡的所有幻想。<br><br>💡 <b>管家Tips：</b>每年这里还会举办盛大的“精灵奇幻节 (Elfia)”，无数人穿着极其精美的 Cosplay 服装在古堡里狂欢。'
    },
    {
        id: 't66', tag: '#信仰之巅', title: '乌得勒支主教堂塔 (Domtoren)',
        imgUrl: 'https://images.unsplash.com/photo-1554426549-d04bcf1b2e15?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>⛪️ 被风暴劈开的地标</b><br><br>荷兰最高、最古老的教堂塔楼。奇特的是，它和教堂的主体是分离的！因为在 1674 年的一场恐怖飓风中，教堂中殿被彻底摧毁了。<br><br>💡 <b>管家挑战：</b>爬上 465 级极窄的旋转楼梯登顶，天气好时，甚至能一眼望到阿姆斯特丹！'
    },
    {
        id: 't67', tag: '#工业巨兽', title: '伊拉斯谟桥 (Erasmusbrug)',
        imgUrl: 'https://images.unsplash.com/photo-1582296495861-5db0d60ecf6c?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🦢 鹿特丹的白色天鹅</b><br><br>跨越马斯河的极其优美的斜拉桥，因为其不对称的塔柱设计，被当地人亲切地称为“天鹅桥”。<br><br>💡 <b>管家Tips：</b>这座桥极其庞大，底下还能开启让巨轮通过。夜晚亮起灯光时，是鹿特丹最硬核的赛博朋克夜景。'
    },
    {
        id: 't68', tag: '#都市绿洲', title: '冯德尔公园 (Vondelpark)',
        imgUrl: 'https://images.unsplash.com/photo-1518204642931-15545faab1dd?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🌳 阿姆斯特丹的心脏</b><br><br>这是阿姆斯特丹最大、最著名的城市公园。只要出太阳，这里就会长满野餐、烤肉、看书、滑旱冰的荷兰人。<br><br>💡 <b>管家Tips：</b>带上超市买的啤酒和薯片，和朋友在草地上躺一下午，这是最便宜也最惬意的周末消遣。'
    },
    {
        id: 't69', tag: '#神圣阅读', title: '多米尼加书店 (Boekhandel Dominicanen)',
        imgUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>📖 全球最美书店之一</b><br><br>位于马斯特里赫特。这家书店极其硬核，它是由一座拥有 700 年历史的哥特式大教堂改造而成的！<br><br>💡 <b>管家打卡：</b>巨大的穹顶、古老的壁画与现代的黑色钢制书架完美融合。去原来教堂的祭坛位置喝杯咖啡吧！'
    },
    {
        id: 't70', tag: '#未来建筑', title: '格罗宁根论坛 (Forum Groningen)',
        imgUrl: 'https://images.unsplash.com/photo-1588079685603-9ec88136e053?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🏢 像外星飞船降落老城</b><br><br>这座斥巨资打造的文化中心大楼，造型极其前卫。里面包含了图书馆、电影院、顶层全景露台甚至国家漫画博物馆。<br><br>💡 <b>管家Tips：</b>坐着超长的错层电梯一路到顶楼，能 360 度俯瞰这座充满活力的北方不夜城！'
    },
    {
        id: 't71', tag: '#文化殿堂', title: '国家博物馆 (Rijksmuseum)',
        imgUrl: 'https://images.unsplash.com/photo-1558000143-a6111f185b1a?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🖼️ 荷兰黄金时代的缩影</b><br><br>阿姆斯特丹的镇馆之宝，里面藏着伦勃朗极其巨大的名画《夜巡》以及维米尔的《倒牛奶的女仆》。<br><br>💡 <b>管家科普：</b>博物馆中间有一条极其开阔的自行车隧道穿过！你可以骑着单车，听着街头艺人的琴声穿越这座艺术圣殿。'
    },
    {
        id: 't72', tag: '#艺术朝圣', title: '梵高博物馆 (Van Gogh Museum)',
        imgUrl: 'https://images.unsplash.com/photo-1563603417616-1f635ffc272a?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🌻 疯子与天才的向日葵</b><br><br>全世界收藏梵高作品最多的一家博物馆。从《吃土豆的人》到《向日葵》再到《杏花》，按时间轴展示了他短暂且灿烂的一生。<br><br>💡 <b>管家警告：</b>极其火爆！必须提前数周在线上抢票，绝对不要指望当天能在门口买到票！'
    },
    {
        id: 't73', tag: '#沉重记忆', title: '安妮·弗兰克之家 (Anne Frank Huis)',
        imgUrl: 'https://images.unsplash.com/photo-1579717148113-d096d27b952a?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>📓 藏在书架后的密室</b><br><br>二战期间，犹太女孩安妮为了躲避纳粹，和家人藏在运河房密室里写下了著名的《安妮日记》。<br><br>💡 <b>管家Tips：</b>推开那个伪装成书柜的暗门走上极其陡峭的楼梯，你能真切感受到当时那种压抑与绝望。'
    },
    {
        id: 't74', tag: '#全民狂欢', title: '南方狂欢节 (Carnaval)',
        imgUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🎭 颠覆三观的三天三夜</b><br><br>通常在 2 月。在这几天，荷兰南部的城市（如马城、布雷达）会集体陷入疯狂。所有人都穿着极其浮夸搞笑的 Cosplay 服装在大街上喝酒跳舞。<br><br>💡 <b>管家科普：</b>如果你穿着普通人的衣服走在街上，反而会被当成异类！'
    },
    {
        id: 't75', tag: '#魔幻传统', title: '黑彼得争论 (Zwarte Piet)',
        imgUrl: 'https://images.unsplash.com/photo-1499244571948-7ccddb3583f1?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🧑🏿‍🦱 荷兰每年的大辩论</b><br><br>Sinterklaas 的助手叫黑彼得，传统形象是黑脸红唇。这几年因为涉嫌种族歧视，在荷兰引发了极其激烈的全国大辩论和抗议。<br><br>💡 <b>管家避雷：</b>现在很多城市已经把黑彼得改成了脸上只有灰尘的“烟囱彼得 (Roetveegpiet)”。这是一个敏感话题，谨慎站队！'
    },
    {
        id: 't76', tag: '#孩童之光', title: '圣马丁节 (Sint Maarten)',
        imgUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🏮 荷兰版的不给糖就捣蛋</b><br><br>每年 11 月 11 日晚上，小朋友们会提着自己手工制作的彩色灯笼，挨家挨户敲门，唱着专属的圣马丁歌。<br><br>💡 <b>管家Tips：</b>如果你住在底楼，这一晚记得去超市买一大袋糖果备着！看着那些提着小灯笼的萌娃，极其治愈。'
    },
    {
        id: 't77', tag: '#动物至上', title: '世界动物日 (Dierendag)',
        imgUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🐶 宠物也要过大年</b><br><br>10 月 4 日。在荷兰，动物拥有极高的社会地位。在这一天，主人会给宠物准备极其丰盛的晚餐，很多小学甚至允许孩子们把宠物带到教室里一起上课！<br><br>💡 <b>管家科普：</b>荷兰是世界上第一个消灭了流浪狗的国家！'
    },
    {
        id: 't78', tag: '#皇家排面', title: '王子日 (Prinsjesdag)',
        imgUrl: 'https://images.unsplash.com/photo-1505672678657-cc7037095e60?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>👑 金马车与夸张帽子大赏</b><br><br>9 月的第三个星期二。荷兰国王会乘坐奢华的玻璃马车（以前是金马车）前往国会宣读预算案。<br><br>💡 <b>管家科普：</b>这一天的最大看点不仅是国王，更是国会里那些女政客们戴着的极其夸张、争奇斗艳的帽子！'
    },
    {
        id: 't79', tag: '#夏日游乐', title: '荷兰巡回游乐场 (Kermis)',
        imgUrl: 'https://images.unsplash.com/photo-1513622470522-26cb3ea453fc?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🎡 突然出现在市中心的嘉年华</b><br><br>不需要去远郊的主题公园。在春夏时节，巨大的摩天轮、跳楼机、大摆锤会像变魔术一样，在一夜之间搭建在城市的最中心广场上！<br><br>💡 <b>管家Tips：</b>一定要去嘉年华的小摊上买一份裹满糖粉的炸油条 (Churros)！'
    },
    {
        id: 't80', tag: '#死神降临', title: '全荷哀悼日 (Dodenherdenking)',
        imgUrl: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🕊️ 让整个国家静止的两分钟</b><br><br>5 月 4 日晚 8 点，用来纪念二战及所有战争中的遇难者。这一刻，火车会停驶，电视会静音，马路上的汽车会停下。<br><br>💡 <b>管家警告：</b>在这两分钟内，绝对不能发出任何声音！这是荷兰极其严肃的神圣时刻。'
    },
    {
        id: 't81', tag: '#水网密布', title: '迷之渡轮 (GVB Pont)',
        imgUrl: 'https://images.unsplash.com/photo-1548171092-2bd33e506689?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>⛴️ 阿姆斯特丹的免费过江龙</b><br><br>在阿姆斯特丹中央火车站背后，想要去对面的北区 (Noord)，你不能坐车，而是直接推着自行车走上一艘巨大的蓝白渡轮。<br><br>💡 <b>管家福利：</b>这艘渡轮 24 小时狂开，且永远免费！站在船头吹海风，是极佳的穷游体验。'
    },
    {
        id: 't82', tag: '#冰上马拉松', title: '十一城之战 (Elfstedentocht)',
        imgUrl: 'https://images.unsplash.com/photo-1518306352932-d1fb7d0b8108?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🥶 气候变暖让它成为了传说</b><br><br>这是一项长达 200 公里的天然冰面滑冰比赛，需要穿过 11 座弗里斯兰省的城市。只有在极端严寒下，冰层达到 15 厘米厚才能举办。<br><br>💡 <b>管家科普：</b>因为暖冬，上一次举办已经是 1997 年的事了。荷兰人每年冬天都在疯狂祈祷严寒降临！'
    },
    {
        id: 't83', tag: '#室内游戏', title: '荷兰沙壶球 (Sjoelen)',
        imgUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🎯 家庭聚会的终极消遣</b><br><br>几乎每个荷兰家庭的车库里都有这么一块长长的木板。游戏规则是用力把几十个木制圆盘沿着长板滑出去，滑进尽头的 4 个小洞里计分。<br><br>💡 <b>管家体验：</b>极度容易上头！在过年过节时，这往往是引发家庭竞技胜负欲的罪魁祸首。'
    },
    {
        id: 't84', tag: '#小众运动', title: '男女混打合球 (Korfbal)',
        imgUrl: 'https://images.unsplash.com/photo-1529156069898-49953eb1f55f?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>⛹️‍♀️ 荷兰人自己发明的篮球变种</b><br><br>这是世界上极少数规定必须由 4 男 4 女组成混合队伍的球类运动。没有篮板，只有一个高高的、没有网的黄色篮筐。<br><br>💡 <b>管家科普：</b>在这里不允许运球，拿到球只能传球或投篮，极其考验团队配合和平权精神。'
    },
    {
        id: 't85', tag: '#童年回忆', title: '国王游戏日 (Koningsspelen)',
        imgUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🏅 全国小学生的运动狂欢</b><br><br>在国王节的前一个周五。全荷兰的小学生都会穿上橙色衣服，先吃一顿丰盛的国王早餐，然后进行一整天的户外运动和舞蹈。<br><br>💡 <b>管家科普：</b>每年为了这一天，还会专门发布一首极其洗脑的主题儿歌，全荷兰的小孩都会跳一样的舞蹈！'
    },
    {
        id: 't86', tag: '#音乐信仰', title: '硬派电音 (Hardstyle)',
        imgUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🎛️ 世界百大 DJ 的摇篮</b><br><br>为什么荷兰那么小，却输出了 Martin Garrix, Tiësto 等一堆世界级 DJ？因为电音就是荷兰人的流行乐。<br><br>💡 <b>管家警告：</b>荷兰极其盛行 BPM 150 以上的硬派电音 (Hardstyle)。去他们的音乐节，那种心脏被重低音疯狂轰炸的感觉，不戴耳塞真的会聋！'
    },
    {
        id: 't87', tag: '#极简生活', title: '自带午餐盒 (Broodtrommel)',
        imgUrl: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🥪 世界上最无聊的午餐</b><br><br>中午去大学微波炉热个香喷喷的红烧肉？荷兰同学会用惊奇的眼光看着你。他们中午永远只拿出一个塑料盒，里面装着两片冷冰冰的面包夹一片火腿和奶酪。<br><br>💡 <b>管家科普：</b>对荷兰人来说，午饭只是为了补充能量维持生命，晚上那顿热饭 (AVM: 土豆肉蔬菜) 才是正餐。'
    },
    {
        id: 't88', tag: '#灵魂辅料', title: '万物皆可大蒜酱 (Knoflooksaus)',
        imgUrl: 'https://images.unsplash.com/photo-1599084990807-75050f5fa245?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🧄 荷兰胃的终极伴侣</b><br><br>吃土耳其烤肉条包 (Turkse Pizza)？加点大蒜酱！吃炸鱼块 (Kibbeling)？加点大蒜酱！吃烧烤？必须有大蒜酱！<br><br>💡 <b>管家警告：</b>极其浓郁、上头、且好吃！但吃完之后，请务必嚼两粒口香糖再和别人社交！'
    },
    {
        id: 't89', tag: '#省钱之魂', title: '只看小票末位',
        imgUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>💶 消失的 1 分和 2 分硬币</b><br><br>在荷兰超市现金结账，如果总价是 10.02 欧，收银员会只收你 10 欧；如果是 10.03 欧，会按 10.05 欧收你。<br><br>💡 <b>管家科普：</b>荷兰为了省事，现金结算全面采用“二舍三入”和“七舍八入”抹零法，1分和2分的硬币在荷兰几乎绝迹了！'
    },
    {
        id: 't90', tag: '#毕业仪式', title: '门外的国旗与书包',
        imgUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', crop: 'center',
        desc: '<b>🎒 最骄傲的炫耀方式</b><br><br>每年 6 月，走在荷兰的住宅区，你会发现很多房子的外墙上挂着荷兰国旗，国旗的旗杆尖端，还赫然挂着一个破旧的书包！<br><br>💡 <b>管家科普：</b>这是荷兰家庭庆祝自家小孩中学毕业 (Geslaagd) 的最高调仪式。路过看到时，别忘了在心里恭喜他们！'
    }
];
