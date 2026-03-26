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
    }
];
