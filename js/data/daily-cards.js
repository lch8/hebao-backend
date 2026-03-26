// ==========================================
// 📂 文件路径: js/data/daily-cards.js
// 荷村风情图鉴 (一眼着迷版)
// 规则：图片必须一眼能认出是荷兰，视觉冲击力强
// ==========================================
window.App = window.App || {};

window.App.dailyCardsData = [
    // ----------------- 第一期：地域图腾 (一眼着迷) -----------------
    {
        id: 'c001',
        tag: '#宝藏小镇',
        title: '羊角村 (Giethoorn)',
        // 🌟 升级：选用最具代表性的茅草屋、运河、木桥、绣球花组合，绿意盎然，童话感拉满
        imgUrl: 'https://images.unsplash.com/photo-1600215754990-6e7946d1e37a?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', 
        crop: 'center 30%', // 露出茅草屋顶和下方的河水
        desc: '<b>🇳🇱 童话走进现实：无路之城</b><br><br>这里真的连一条汽车公路都没有！出行全靠纵横交错的运河和 176 座古老的木桥。<br><br>💡 <b>管家Tips：</b>等安顿好了，一定要选个非周末的清晨去。租一艘小木船（Punter），在芦苇荡和茅草屋之间穿梭，吸一次纯度 100% 的负氧离子！'
    },
    {
        id: 'c002',
        tag: '#地域图腾',
        title: '小孩堤防 (Kinderdijk)',
        // 🌟 升级：绝非 generic 的风车，而是 19 座世界遗产风车齐聚的壮观画面
        imgUrl: 'https://images.unsplash.com/photo-1647895744884-638062534575?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center 20%', // 确保风车扇叶完整且不压抑
        desc: '<b>🌬️ 19座古老风车：人与水的史诗</b><br><br>这不是景区的装饰，而是百年前真正的抽水系统。19座雄伟的古老风车排列在河堤两岸，这画面，就是荷兰精神的缩影。<br><br>💡 <b>管家科普：</b>这里是世界文化遗产。在这里骑车穿过风车群，夕阳西下时，你懂什么是真正的旷野。'
    },
    {
        id: 'c003',
        tag: '#硬核日常',
        title: '红色单车神圣不可侵犯',
        // 🌟 升级：特写荷兰独有的、带车筐、带儿童座椅、车铃、锁链的硬核 Omafiets，且必须行驶在红色单车道上！
        imgUrl: 'https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center 60%', // 特写红色车道上的单车军团
        desc: '<b>🚲 撞倒你的绝不是汽车，而是飞驰的单车</b><br><br>荷兰人均拥有 1.3 辆自行车。这里的红色铺装自行车道是神圣不可侵犯的！荷兰人的骑车速度极快。<br><br>💡 <b>管家警告：</b>过马路时，如果没看红绿灯，汽车绝对会让你，但自行车骑手绝对会按着清脆的车铃，并从你身边呼啸而过（可能还伴随一句荷兰国骂）。'
    },
    {
        id: 'c004',
        tag: '#地域图腾',
        title: '阿姆斯特丹运河夜景',
        // 🌟 升级：选用最具标志性的倒U型运河，古老的水上天鹅房，和昏黄灯光下的运河船，静谧而高级
        imgUrl: 'https://images.unsplash.com/photo-1548171092-2bd33e506689?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center 40%', // 确保古老建筑和运河倒影的黄金比例
        desc: '<b>🕯️ 在运河房前，你会忘了时间</b><br><br>这不仅仅是一条河，她是这座城市的灵魂。17世纪的黄金时代，富商们在这里建造了这些又窄又高的运河房。<br><br>💡 <b>管家Tips：</b>夜晚是阿姆斯特丹最迷人的时刻。随便在一条桥边坐下，看着昏黄灯光倒映在水面上，不需要任何言语，你就会彻底爱上这里。'
    },
    {
        id: 'c005',
        tag: '#狂欢节日',
        title: '国王节 (King\'s Day)',
        // 🌟 升级：不再是抽象的狂欢图，而是特写运河上塞满了橙色气球、橙色人海、橙色游船的震撼画面
        imgUrl: 'https://images.unsplash.com/photo-1533222481259-ce20eda1e20b?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center 30%', // 露出橙色船队和运河房
        desc: '<b>👑 全民陷入橙色癫狂的一天</b><br><br>每年 4 月 27 日，是为了庆祝国王威廉·亚历山大的生日。这一天，整个荷兰会化身为极度癫狂的「橙色海洋」。<br><br>运河里塞满了放着震耳欲聋电音的游船，所有人都在街上狂舞。最棒的是，这也是全年中唯一一天可以<b>合法无证摆摊 (Vrijmarkt)</b> 的日子，堪称终极跳蚤市场！'
    },
    {
        id: 'c006',
        tag: '#学制揭秘',
        title: '永遠拿不到的 10 分',
        // 🌟 升级：绝不再使用 general 图书馆！选用最具代表性的荷兰大学 historic academy 建筑大门或独特的 Handelingenkamert 圖書館 (一张图就知道是荷兰)
        imgUrl: 'https://images.unsplash.com/photo-1579717148113-d096d27b952a?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash', 
        crop: 'center', // 确保这个令人窒息的荷兰式螺旋书架完整
        desc: '<b>🎓 5.5分万岁，多一分浪费</b><br><br>荷兰的考试实行 10 分制，但在学术界有一句古老的魔咒：「10分是给上帝的，9分是给教授的，8分是天才，而我们只要拿到及格的 5.5分 (Voldoende) 就行了」。<br><br>💡 <b>管家安慰：</b>在国内习惯了科科 90 分以上的卷王们，来荷兰看到 7 分千万别哭，这已经是班里的顶级学霸了！'
    },
    {
        id: 'c007',
        tag: '#地域图腾',
        title: '郁金香花海 (Keukenhof)',
        // 🌟 升级：拒绝 genernic 的花田！选用库肯霍夫公园里，花海中矗立着一台古老风车的震撼画面。
        imgUrl: 'https://images.unsplash.com/photo-1499981832049-f4b75a440954?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center 20%', // 风车和彩虹花海的终极融合
        desc: '<b>🌷 春天的最高仪式感</b><br><br>如果你问我四月应该去哪？我的答案只有一个：Keukenhof！这是全世界最大的郁金香公园。<br><br>💡 <b>管家Tips：</b>花期极短（仅开 8 周）。你必须提前在 App 里抢票，然后置身于 700 万朵鲜花组成的彩色海洋中，这真的是你行前最该憧憬的画面！'
    },
    {
        id: 'c008',
        tag: '#魔幻天气',
        title: '一天经历四季的妖风',
        // 🌟 升级：特写在运河房前，一个荷兰人正顶着几乎将人吹倒的狂风和斜风细雨，硬核骑单车的画面。
        imgUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center', // 确保雨滴和人物动作的神还原
        desc: '<b>🌧️ 为什么荷兰人从不打伞？</b><br><br>因为伞在这里活不过三天。由于靠海地势低平，荷兰的阵雨和强风是随机掉落的。你可能前一秒还在享受阳光，下一秒就被冰冷的斜风细雨糊了一脸。<br><br>💡 <b>管家Tips：</b>来荷兰不要买昂贵的雨伞！去买一件超级防风防水的<b>冲锋衣 (Raincoat)</b>，并永远在手机里装好 Buienradar App。'
    },

    // ----------------- 第二期：地域偏执 (一眼着迷)扩充 -----------------
    {
        id: 'c009',
        tag: '#生猛海鲜',
        title: '生吞鲱鱼 (Broodje Haring)',
        // 🌟 升级：拒绝泛滥的美食大图。特写在运河边、蓝白相间的 Vismarkt 小摊前，一个荷包蛋正在硬核生吞鲱鱼的画面
        imgUrl: 'https://images.unsplash.com/photo-1534057308991-b9b3a578f1b1?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center', // 确保洋葱、鱼和人物动作的神还原
        desc: '<b>🐟 刺身届的泥石流，荷兰街头一霸</b><br><br>在荷兰街头Vismarkt，你会在极其魔幻的一幕：拎着一条鱼的尾巴，蘸着生洋葱，一整条生鱼直接滑入喉咙！<br><br>💡 <b>管家Tips：</b>如果你受不了腥味，可以买夹在面包里的鲱鱼三明治 (Broodje haring) 试试水。'
    },
    {
        id: 'c010',
        tag: '#魂系风俗',
        title: '代尔夫特蓝陶 (Delfts Blauw)',
        // 🌟 升级：选用在代尔夫特老城运河边，一个精美橱窗里摆满蓝陶的特写图，地域感满格。
        imgUrl: 'https://images.unsplash.com/photo-1628183145417-640f0c083651?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center', // 确保蓝陶橱窗和后面虚化的古老建筑
        desc: '<b>👑 宁静致远的皇家古镇魂</b><br><br>你可能会觉得代尔夫特蓝陶和中国的青花瓷长得很像，没错，它本来就是 17 世纪荷兰东印度公司为了仿制中国瓷器而诞生的绝美工艺品！'
    },
    {
        id: 'c011',
        tag: '#暗黑料理',
        title: 'Drop：荷兰的国民毒药',
        // 🌟 升级：拒绝 general 糖果图。选用在 Albert Heijn 超市货架上，一整面墙、各种奇葩 Drop 包装的特写图！
        imgUrl: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center',
        desc: '<b>🍬 考验友情的终极武器</b><br><br>它的味道是：<b>浓烈的八角大料味 + 齁咸的海盐味</b>。当热情的荷兰同学递给你一颗黑色糖果时，请深呼吸再放进嘴里。当然，它也是你回国整蛊朋友的绝佳伴手礼！'
    },
    {
        id: 'c012',
        tag: '#防吓指南',
        title: '每月一次的防空警报',
        // 🌟 升级：在古老运河房顶上，特写一个灰色的 Luchtalarm 大喇叭。
        imgUrl: 'https://images.unsplash.com/photo-1520658428317-0630ea872412?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center 20%', // 确保这个 Luchtalarm 警报喇叭位于 C位
        desc: '<b>🚨 每个月第一个星期一中午 12:00</b>，全荷兰的室外大喇叭会准时拉响凄厉的警报声。<br><br>💡 <b>管家科普：</b>这只是国家安全系统的例行测试。如果你在那一天中午听到，淡定喝咖啡就好；但如果是其他时间听到，请立刻关紧门窗，打开电视看新闻！'
    },
    {
        id: 'c013',
        tag: '#地域图腾',
        title: '代尔夫特老城运河',
        // 🌟 升级：选用在 Delft 老城中，一张绝美的运河桥、倾斜的老教堂、和水面泛着蓝光的画面
        imgUrl: 'https://images.unsplash.com/photo-1605634563815-564ec5a66bf1?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center', // 确保老教堂和运河倒影的地域偏执
        desc: '<b>🏰 皇家小镇：沉淀黄金时代的静谧</b><br><br>这里是《戴珍珠耳环的少女》的故乡。古老的运河房、宏伟的新老教堂，这里有着不输阿姆斯特丹的风景，却多了一份皇家的高贵与静谧。'
    },
    {
        id: 'c014',
        tag: '#神仙甜点',
        title: '焦糖煎饼 (Stroopwafel)',
        // 🌟 升级：拒绝 general 的饼干图。选用在荷兰市集上，现烤的、焦糖正拉丝、用牛皮纸袋装着的特写图！
        imgUrl: 'https://images.unsplash.com/photo-1621236894086-6ba12c755dd3?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center',
        desc: '<b>☕️ 泡在热茶上的荷兰国民零食</b><br><br>💡 <b>管家吃法：</b>泡一杯热茶或热咖啡，把饼干盖在杯口，利用热气把里面的焦糖微微融化，一口咬下去，外酥里软，满嘴生香。'
    },
    {
        id: 'c015',
        tag: '#魂系风俗',
        title: '厕所里的生日日历',
        // 🌟 升级：特写在昏暗、窄小的荷兰古老马桶上，正对着马桶墙上挂着的、写满名字的日历！
        imgUrl: 'https://images.unsplash.com/photo-1506784951209-243c490cc5f0?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center 10%', // 特写日历本身
        desc: '<b>🗓️ 为什么把日历挂马桶对面？</b><br><br>如果你去荷兰人家里做客，可能会发现一个极其神秘的现象——他们把亲友的“生日日历”挂在马桶对面的墙上！<br><br>据说是因为每天上厕所时都会在这面墙上发呆，所以把日历挂在这里，就绝对不会忘记亲朋好友的生日。'
    },
    {
        id: 'c016',
        tag: '#硬核日常',
        title: '进击的巨人国',
        // 🌟 升级：选用在 AH 超市货架上，一个 1米6 的亚洲荷包蛋正在尴尬得抬头看向 1米9 的荷兰巨人的画面。
        imgUrl: 'https://images.unsplash.com/photo-1524047934617-cb782c24e5f3?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center 20%', // 特写身高差的地域偏执
        desc: '<b>🦒 平均身高世界第一的烦恼</b><br><br>💡 <b>管家避雷：</b>在荷兰租房，你可能会发现卫生间的镜子只能照到你的头顶；坐在马桶上，双脚可能是悬空的；去超市买顶层的麦片，大概率需要找人帮忙……'
    },
    {
        id: 'c017',
        tag: '#生存必修',
        title: '空瓶回收 (Statiegeld)',
        // 🌟 升级：特写在AH超市门口，一台印着「Statiegeld」黄色标志的回收机，正吞进一个可乐瓶的画面
        imgUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center',
        desc: '<b>♻️ 千万别扔！这是白花花的银子</b><br><br>💡 <b>管家Tips：</b>你在超市买带押金标志的塑料瓶水或易拉罐时，结账时会被多扣 0.15 欧。喝完千万别扔垃圾桶！拿到超市门口的机器上回收，机器吐出来的票条，能直接抵扣你下一次买菜的钱！'
    },
    {
        id: 'c018',
        tag: '#魂系风俗',
        title: '荷兰人为什么不拉窗帘？',
        // 🌟 升级：选用一张夜景图，特写一楼运河房窗户，屋里灯火通明、一家人正在吃饭，你在外面看得一清二楚。
        imgUrl: 'https://images.unsplash.com/photo-1549463901-7fa762955e69?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center 10%', // 特写窗户里的一家人
        desc: '<b>🪟 走在街上像在看楚门的世界真人秀</b><br><br>由于历史和教派原因，荷兰人喜欢把家里的一举一动都展示给世界看：我为人正直，光明磊落，家里没有什么见不得人的事。'
    },
    {
        id: 'c019',
        tag: '#交通出行',
        title: '忘了 Check-out 的代价',
        // 🌟 升级：特写在NS火车站上，一张 OV-chipkaart 正在 Check-out 刷卡处闪着红灯或黄灯的特写图。
        imgUrl: 'https://images.unsplash.com/photo-1506198642738-34f780287af4?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center',
        desc: '<b>💳 全荷通用的超级黄卡</b><br><br>💡 <b>管家避雷：</b>在荷兰坐火车/公交，上车Check-in时会扣除20欧押金。下车时<b>必须记得 Check-out</b>！如果你忘了，这 20 欧就被系统无情吞没了！'
    },
    {
        id: 'c020',
        tag: '#宝藏小镇',
        title: '小孩堤防风车群',
        // 🌟 升级：选用在小孩堤防，水面完全静止、19座风车和彩虹倒影、极致震撼的地域冲击图。
        imgUrl: 'https://images.unsplash.com/photo-1464692805480-a69dfaafdb0d?auto=format&fit=crop&w=800&q=80',
        copyright: '© Photo by Unsplash',
        crop: 'center 30%', // 风车和彩虹倒影的神融合
        desc: '<b>🌬️ 人与水的史诗 (II)</b><br><br>这里是荷村精髓中的精髓。骑车穿过风车群，夕阳西下时，这画面，就是荷兰精神的缩影，也是你行前最该憧憬的绝美风景。'
    }
];
