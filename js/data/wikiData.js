// 文件路径：js/data/wikiData.js

export const wikiData = [
    // ================== 【交通出行】 ==================
    {
        id: "w_ns_flex",
        category: "交通出行", icon: "🚆",
        title: "NS Flex 周末免费卡 (Weekend Vrij)",
        tag: "特种兵必开", tagColor: "#10B981",
        desc: "每月仅需约 €35，周五晚 18:30 到周一凌晨 04:00 全荷兰火车无限次免费坐！随便去趟阿姆就回本。",
        detailContent: "如果你周末喜欢去其他城市玩，或者去周边国家（到边境段免费），这个卡是绝对的神器。注意：记得在 NS App 里手动开启生效！"
    },
    {
        id: "w_ns_samen",
        category: "交通出行", icon: "🎫",
        title: "没打折卡？找人蹭 40% 优惠！",
        tag: "立省几十欧", tagColor: "#10B981",
        desc: "非高峰期坐火车，只要同行的朋友有 NS 折扣卡，就可以享受 6 折！",
        detailContent: "操作步骤：在 NS App 输入行程 -> 购买电子票 -> 选择带有 Samenreiskorting 的选项。查票时，你必须和有打折卡的朋友坐在一起。",
        
        // 🌟 新增：一键发帖模板引擎数据
        postTemplate: {
            tab: "partner", // 对应集市里的“搭子”分类
            btnText: "🤝 一键发帖找火车搭子",
            title: "蹲一个 NS 火车同行搭子 (凑6折)",
            content: "【出发地】\n【目的地】\n【出发日期/时间】\n\n【补充说明】我没有打折卡，求一个有 NS Flex 的搭子带带，我请喝咖啡！"
        }
    },
    {
        id: "w_ov_refund",
        category: "交通出行", icon: "💳",
        title: "忘刷卡被扣 €20？找客服秒退",
        tag: "挽回损失", tagColor: "#10B981",
        desc: "坐火车忘了 Check-out，导致卡里直接被扣了 €20 乘车押金？别慌，去 uitcheckgemist.nl 填个表就能退回来！",
        detailContent: "这个“忘刷卡退款”每年都有几次免费额度，只要证明你那天确实是在哪站下的车，几天内钱就会回到你的银行账户。"
    },
    {
        id: "w_9292",
        category: "交通出行", icon: "📱",
        title: "放弃 Google Maps，请用 9292",
        tag: "不走冤枉路", tagColor: "#3B82F6",
        desc: "在荷兰坐公交和电车，Google Maps 的实时信息极不准。必须下载本地神器 9292 App，晚点、罢工、换乘台一目了然。",
        detailContent: "9292 还可以精确计算整趟行程的票价，并告诉你换乘时需要步行几分钟。买一张匿名的 OV-chipkaart 配合 9292 走天下。"
    },
    {
        id: "w_swapfiets",
        category: "交通出行", icon: "🚲",
        title: "修车太贵？直接租 Swapfiets",
        tag: "懒人福音", tagColor: "#3B82F6",
        desc: "荷兰修自行车动辄几十欧。不如每个月花十几欧租一辆“蓝轮胎”的 Swapfiets，车坏了（爆胎/掉链）App一键呼叫，免费上门换新车！",
        detailContent: "对于不会修车、又怕买的二手车三天两头坏的同学来说，订阅制单车是极具性价比的选择。不过离开荷兰前千万记得提前一个月取消！"
    },
    {
        id: "w_bike_light",
        category: "生活避坑", icon: "🔦",
        title: "晚上骑车没灯？直接罚 €60",
        tag: "警察最爱抓", tagColor: "#EF4444",
        desc: "荷兰冬天下午 4 点天就黑了。骑车必须开前后灯（前白后红），如果在没路灯的地方或者被警察蹲点抓到没亮灯，直接开出 €60+ 罚单！",
        detailContent: "别存在侥幸心理，警察最喜欢在火车站或者学校门口“钓鱼执法”。去 Action 花 €2 买几个备用纽扣电池灯塞包里，能省大钱。"
    },

    // ================== 【羊毛购物】 ==================
    {
        id: "w_kruidvat",
        category: "羊毛购物", icon: "🧴",
        title: "Kruidvat 永远只买 1+1 Gratis",
        tag: "日化骨折价", tagColor: "#F59E0B",
        desc: "荷兰最火药妆店，没打折绝对不要买洗发水和沐浴露！每隔两周必有 1+1 免费（相当于半价），甚至 1+2 免费！",
        detailContent: "认准红色标签 1+1 Gratis。如果是 2e Halve Prijs (第二件半价)，忍住别买，等下周大概率就会变成 1+1！"
    },
    {
        id: "w_ah_bonus",
        category: "羊毛购物", icon: "🛒",
        title: "买菜不刷 Bonus 卡 = 纯做大冤种",
        tag: "超市必备", tagColor: "#F59E0B",
        desc: "去 Albert Heijn (AH) 必须扫蓝色的 Bonus 卡！所有黄牌打折商品，不扫卡就按原价结账，直接血亏。",
        detailContent: "下载 AH App 注册账号，App 里还有每周的 Personal Bonus（专属打折）。如果不小心忘带了，去结账机找旁边的荷兰人借一下扫，他们通常很乐意。"
    },
    {
        id: "w_tgtg",
        category: "羊毛购物", icon: "🥡",
        title: "Too Good To Go 盲盒抢购",
        tag: "€4吃三天", tagColor: "#10B981",
        desc: "剩菜盲盒？不，这是留学生的生存之光。下载 TGTG App，每天抢面包店或超市的魔法盒，花 €4.99 拿走原价 €15+ 的羊角包和果蔬。",
        detailContent: "Dirk 和 Vomar 的超市盲盒最划算，往往能开出整只烤鸡或大量肉类。Bakkerij (面包店) 的盲盒能让你未来一周的早餐都不用愁。拼手速抢！"
    },
    {
        id: "w_action",
        category: "羊毛购物", icon: "🧹",
        title: "Action —— 荷兰版拼多多/义乌",
        tag: "挂壁首选", tagColor: "#8B5CF6",
        desc: "刚搬家需要买锅碗瓢盆、清洁刷、垃圾袋、收纳盒？别去 HEMA，直奔 Action！价格只有三分之一，留学生搬家天堂。",
        detailContent: "强烈推荐 Action 的去污喷雾和厨房纸，极其便宜大碗。不过电器类（如吹风机）质量较差，建议电器去 Blokker 或 Coolblue 买。"
    },
    {
        id: "w_statiegeld",
        category: "羊毛购物", icon: "🍼",
        title: "塑料瓶别扔！每个价值 €0.15",
        tag: "环保搞钱", tagColor: "#10B981",
        desc: "荷兰实行押金制 (Statiegeld)。买带特殊 Logo 的塑料瓶和易拉罐，结账时会被多收 15 欧分。喝完拿去超市门口的机器退，机器会吐代金券！",
        detailContent: "不要把瓶子捏扁，否则机器扫不出条码！拿着退出来的纸条去收银台，可以直接抵扣买菜钱，攒多了也是一笔巨款。"
    },
    {
        id: "w_dirk_aldi",
        category: "羊毛购物", icon: "🥔",
        title: "基础食材去 Dirk 或 Aldi 买",
        tag: "恩格尔暴降", tagColor: "#F59E0B",
        desc: "买土豆、洋葱、鸡蛋、牛奶这些基础食材，别去 Jumbo 和 AH，直接去 Dirk 或 Aldi/Lidl，同样的东西便宜 20%-30%！",
        detailContent: "穷鬼生存法则：Dirk 买肉蛋奶，AH 买特色半成品和零食，东方行 (Amazing Oriental) 买调料和速冻水饺。"
    },
    {
        id: "w_museumkaart",
        category: "羊毛购物", icon: "🏛️",
        title: "文艺青年必办的博物馆卡",
        tag: "无脑冲", tagColor: "#8B5CF6",
        desc: "€75 买一张 Museumkaart，全荷兰 400 多家博物馆一年内无限次免费进！去两趟国立博物馆 (Rijksmuseum) 和梵高博物馆就回本了。",
        detailContent: "如果你要在荷兰待一年以上，闭眼办。很多城市冷门的小型博物馆极其精致，拿这张卡平时当公园一样免费去逛，极其惬意。"
    },

    // ================== 【生活避坑 / 医疗 / 税务】 ==================
    {
        id: "w_blue_letter",
        category: "生活避坑", icon: "✉️",
        title: "看到蓝信封 (Blauwe envelop) 马上拆",
        tag: "税务局警告", tagColor: "#EF4444",
        desc: "荷兰税务局专用信封！里面可能是退税福利，但也可能是催缴罚款，绝对不能积灰，超时会有巨额滞纳金！",
        detailContent: "留学生最常收到的是水费税、垃圾税的单子。如果看不懂荷兰语，直接用 Google Translate 拍照翻译，千万别无视。"
    },
    {
        id: "w_zorgtoeslag",
        category: "羊毛购物", icon: "🏥",
        title: "每个月白领 €120+ 医疗补贴",
        tag: "政府撒钱", tagColor: "#F59E0B",
        desc: "只要你买了荷兰本地的 Basic 医保（约 €140/月），政府每个月会退给你大部分保费，相当于免费上医保！",
        detailContent: "搜索 Zorgtoeslag 申请。注意：AON 学生险不能申请补贴，必须是买本地国民医保 (如 Zilveren Kruis) 且【兼职打工】的同学才适用。"
    },
    {
        id: "w_gp_huisarts",
        category: "生活避坑", icon: "🩺",
        title: "落地第一件事：注册家庭医生",
        tag: "保命必备", tagColor: "#EF4444",
        desc: "在荷兰生病了，直接去医院急诊会被赶出来！必须先找你的家庭医生 (Huisarts) 看病，且很多诊所名额爆满，落地必须立刻就近注册！",
        detailContent: "搜你家邮编附近的 Huisarts。注册不用钱。生小病他们只会让你吃 Paracetamol（扑热息痛）并多喝水，大病才会给你开转诊单去大医院。"
    },
    {
        id: "w_waternet",
        category: "生活避坑", icon: "🚰",
        title: "自来水不免费！年底的水费账单刺客",
        tag: "巨额补缴", tagColor: "#EF4444",
        desc: "很多人以为荷兰房租包水（或者水费很便宜），结果年底收到 Waternet 几百欧的补缴账单直接破防！",
        detailContent: "荷兰除了水费，还有昂贵的“水资源净化税”。如果你是自己整租，记得定期关注水表用量，平时洗澡不要洗太久。"
    },
    {
        id: "w_bike_fine",
        category: "生活避坑", icon: "🚲",
        title: "千万别买火车站旁 €10 的黑车",
        tag: "违法销赃", tagColor: "#EF4444",
        desc: "火车站半夜有人偷偷问你要不要自行车，一律拒绝！那是赃车，警察如果在车架上扫出原主人的防盗码，你会背上刑事案底！",
        detailContent: "买二手自行车请去正规二手车行或 Facebook 校友群。买完一定要花 €30 买个极粗的链条锁，不然明晚你的车就是别人的了。"
    },
    {
        id: "w_trash_fine",
        category: "生活避坑", icon: "🗑️",
        title: "把纸箱丢在垃圾桶外？罚款 €100+",
        tag: "血泪教训", tagColor: "#EF4444",
        desc: "市政厅查垃圾极其变态！如果你把带有你快递面单（有姓名地址）的纸箱丢在垃圾桶外面，市政执法人员会直接把罚单寄到你家。",
        detailContent: "必须撕碎塞进纸类垃圾桶 (Papier)，或者把姓名贴撕掉烧掉再丢！如果不幸被抓现行或被翻出名字，几乎无法申诉。"
    },
    {
        id: "w_coffeeshop",
        category: "生活避坑", icon: "☕",
        title: "别去 Coffeeshop 喝拿铁！",
        tag: "走错片场", tagColor: "#EF4444",
        desc: "在荷兰，Cafe / Koffiehuis 是喝咖啡吃蛋糕的地方；而 Coffeeshop 是合法吸食大麻的场所！",
        detailContent: "推门进去如果闻到一股浓烈的“草味”，请立刻退出来。千万不要带国内来探亲的长辈走错门，场面会极其尴尬。"
    },
    {
        id: "w_tikkie",
        category: "生活避坑", icon: "💸",
        title: "AA制神器 Tikkie，欠债别过夜",
        tag: "社交潜规则", tagColor: "#3B82F6",
        desc: "荷兰人极其看重“亲兄弟明算账”。吃完饭对方发来一个 Tikkie 链接（收款码），千万别拖，立刻点开用 iDEAL 支付！",
        detailContent: "有时候连 €0.5 的打印费对方都会发 Tikkie。这在荷兰不叫小气，叫边界感清晰。入乡随俗，你也大胆地给别人发 Tikkie 吧。"
    },
    {
        id: "w_tax_return",
        category: "羊毛购物", icon: "💰",
        title: "打工人必看：M-Biljet 报税表退税",
        tag: "搞钱必看", tagColor: "#3B82F6",
        desc: "第一年来荷兰、有兼职打工或者实习工资的同学，次年 3 月一定要报税 (M-Form)！大概率能退回大几百欧的税金。",
        detailContent: "因为第一年没有住满 12 个月，税务局默认扣的税通常偏高。填写 M-Form 比较复杂，建议找懂荷兰语的学长学姐指导。"
    },
    {
        id: "w_bsn",
        category: "生活避坑", icon: "🆔",
        title: "BSN 号码就是你在荷兰的命脉",
        tag: "抓紧办理", tagColor: "#EF4444",
        desc: "没有 BSN (公民服务号)，你不能开银行卡、不能买医保、不能签网线！来荷前或落地当天，必须立刻在市政厅 (Gemeente) 预约注册！",
        detailContent: "开学季 Gemeente 的预约可能排到一个月后！所以拿到租房合同后，在国内就应该提前在市政厅官网把预约抢好。"
    },

    // ================== 【租房防坑】 ==================
    {
        id: "w_fb_housing",
        category: "租房防坑", icon: "🏠",
        title: "没看房前绝对别付定金",
        tag: "诈骗重灾区", tagColor: "#EF4444",
        desc: "“我现在不在荷兰，钥匙在朋友那，你先交 500 欧押金我就把钥匙寄给你。”—— 100% 经典杀猪盘！",
        detailContent: "Facebook 和微信群骗子极多，甚至会盗用真房东的 ID。看房必须实地看，合同必须查验房东信息，付款必须通过银行转账 (留底)。"
    },
    {
        id: "w_huurtoeslag",
        category: "租房防坑", icon: "💰",
        title: "神仙羊毛：房屋补贴 (Huurtoeslag)",
        tag: "爆省几百欧", tagColor: "#F59E0B",
        desc: "如果你年满 23 岁，租的是独立套房 (Studio, 有独立厨卫门锁)，且基础租金低于阈值(约€879)，政府每月最高补贴你 €400！",
        detailContent: "合租 (Share) 通常无法申请，因为没有独立门牌号。找 Studio 的时候一定要问中介能不能注册地址并申请 Toeslag。"
    },
    {
        id: "w_buy_address",
        category: "租房防坑", icon: "🚨",
        title: "“买地址”是严重的违法行为",
        tag: "遣返警告", tagColor: "#EF4444",
        desc: "租了不让注册地址 (Inschrijven) 的黑房，然后花钱去别处“买”个地址挂靠？一旦被市政厅查出，轻则巨额罚款，重则吊销居留卡遣返！",
        detailContent: "不给注册地址的房子大多是非法分租或者房东为了逃税。宁可住远一点，也绝对不要沾染这种高风险的黑产。"
    },
    {
        id: "w_antikraak",
        category: "租房防坑", icon: "🏚️",
        title: "神仙低价？小心 Anti-kraak 盲盒",
        tag: "防空洞警告", tagColor: "#8B5CF6",
        desc: "在租房网看到只要 €200/月的房子？这叫“防空置房 (Anti-kraak)”。虽然极度便宜，但你随时可能被要求在 28 天内无条件搬走！",
        detailContent: "这类房子可能是废弃的学校、办公室甚至大教堂。如果你极度缺钱且随时能卷铺盖走人，可以尝试；如果追求稳定，千万别碰。"
    },
    {
        id: "w_energy_bill",
        category: "租房防坑", icon: "⚡",
        title: "Excl. 的房子小心能源账单刺客",
        tag: "防坑几千欧", tagColor: "#EF4444",
        desc: "租房看到租金很低，但标着 Excl. (不包水电网)？小心了！荷兰冬天天然气极贵，老房子保温差的话，一个冬天能烧掉你上千欧暖气费！",
        detailContent: "签合同前一定要看房子的能源标签 (Energy Label)。A级最省气，G级漏风能让你破产。最好租 Incl. (全包) 的房子省心。"
    },
    {
        id: "w_deposit",
        category: "租房防坑", icon: "💸",
        title: "退租时墙上有一个洞？押金全没",
        tag: "入住必做", tagColor: "#3B82F6",
        desc: "荷兰房东/中介扣押金极其狠。退房时如果没有打扫得像新的一样，或者墙上有你钉的钉子，几百欧押金瞬间扣光！",
        detailContent: "极其重要：拿到钥匙入住的第一天，拿着手机拍个长视频，把墙上的划痕、坏掉的把手全部拍下来并邮件发给房东留作底！"
    },
    {
        id: "w_inclusive_scam",
        category: "租房防坑", icon: "📝",
        title: "包水电 (Incl.) 也有年底结算单",
        tag: "仔细看合同", tagColor: "#F59E0B",
        desc: "有些合同写着 Incl.，但其实是“预交费 (Advance payment)”。如果年底结算发现你用了太多暖气，房东依然会让你补差价！",
        detailContent: "签合同必须认准到底是 Fixed price（固定死不补差价），还是 Advance（多退少补）。如果是后者，冬天出门一定要记得关暖气。"
    }
];
