window.App = window.App || {};

// 1. 分类元数据 (完美复刻你截图中的高级渐变与卡片质感)
window.App.categories = [
    { id: 'city', emoji: '🏙️', title: '城市探索', desc: '从羊角村到鹿特丹', bg: 'linear-gradient(135deg, #1A2942, #0A192F)' },
    { id: 'food', emoji: '🍟', title: '饮食文化', desc: '风味与传统的碰撞', bg: 'linear-gradient(135deg, #6B3E14, #3E2006)' },
    { id: 'habits', emoji: '🌷', title: '生活习俗', desc: '融入本地人的日常', bg: 'linear-gradient(135deg, #1E4D2B, #0F2E18)' },
    { id: 'transport', emoji: '🚲', title: '交通出行', desc: '两轮上的国家', bg: 'linear-gradient(135deg, #4A1C82, #2B0D54)' },
    { id: 'fest', emoji: '🎉', title: '节日庆典', desc: '克制与狂欢的交织', bg: 'linear-gradient(135deg, #8B1C1C, #4A0E0E)' },
    { id: 'nature', emoji: '🌊', title: '自然景观', desc: '与海争地的奇迹', bg: 'linear-gradient(135deg, #144D53, #092E33)' },
    { id: 'arch', emoji: '🏛️', title: '建筑艺术', desc: '空间利用的极致', bg: 'linear-gradient(135deg, #1E3A8A, #11204C)' }
];

// 2. 深度档案库 (所有数据都在这里，按分类 ID 归属)
window.App.cultureData = [
    // --- 城市探索分类 ---
    {
        id: 'delft_01',
        categoryId: 'city',
        title: '代尔夫特 (Delft)',
        hook: '黄金时代的古镇，现代工程学的发源地。',
        // 👉 这里的路径，请替换为你自己在 Freepik 找好的精美代尔夫特风景图
        imgUrl: './images/freepik/delft-canal.jpg', 
        lore: `
            <p>代尔夫特建城于11世纪。作为荷兰东印度公司（VOC）在国内的六大分部之一，它在17世纪的黄金时代积累了巨额财富。</p>
            <h3>一、 皇室与独立的血脉</h3>
            <p>1584年，领导荷兰反抗西班牙统治的国父“沉默者威廉”在代尔夫特的亲王王宫（Prinsenhof）被暗杀。自此，绝大多数荷兰王室成员均安葬于代尔夫特新教堂的皇家地下室。</p>
            <h3>二、 光学与微观宇宙的起点</h3>
            <p>17世纪孕育了两位改变人类视野的巨匠。画家维米尔通过《代尔夫特风景》，以前所未有的暗箱技术定格了城市特有的漫射光线。同时期的列文虎克（Antonie van Leeuwenhoek）则在这里磨制出了高倍显微镜，推开了微观世界的大门。</p>
            <h3>三、 欧洲科创硅谷</h3>
            <p>如今，代尔夫特理工大学（TU Delft）是欧洲顶尖的工科院校，拥有微软与荷兰政府合作建立的量子计算机构 QuTech。</p>
        `,
        tip: '💡 <b>本地防坑：</b>代尔夫特火车站周边的自行车停放极为严苛，务必停入地下免费车库（fietsenstalling），违停将被市政厅强制拖走并罚款。'
    },
    // --- 饮食文化分类 ---
    {
        id: 'food_stroopwafel',
        categoryId: 'food',
        title: '焦糖华夫饼 (Stroopwafel)',
        hook: '源自豪达 (Gouda) 的国民甜品。',
        // 👉 替换为你下载的极具食欲的华夫饼特写图
        imgUrl: './images/freepik/stroopwafel.jpg',
        lore: `
            <p>对于荷兰人而言，Stroopwafel 不是零食，而是融入血液的安慰剂。它起源于18世纪末至19世纪初的豪达（Gouda）。</p>
            <h3>一、 穷人的甜点</h3>
            <p>最初，面包师利用制作面包剩下的碎屑和面团，加入便宜的糖浆（Stroop）烤制而成，因此被称为“穷人的华夫饼”。</p>
            <h3>二、 严苛的几何工艺</h3>
            <p>一块正宗的 Stroopwafel 必须在刚烤出炉、面饼还未完全变硬的极短时间内，被锋利的刀片从侧面精准剖为两半，并均匀涂抹温热的焦糖浆。</p>
        `,
        tip: '💡 <b>最佳吃法：</b>绝对不要直接干啃！将它像盖子一样平放在刚泡好的热红茶或黑咖啡杯口上，等待两分钟。让水蒸气将内部的焦糖微微融化，此时口感达到绝对巅峰。'
    }
];
