// ==========================================
// 📂 文件路径: js/data/daily-cards.js
// 专门用于管理每日探索卡片的数据中心
// ==========================================
window.App = window.App || {};

window.App.dailyCardsData = [
    {
        id: 'c001',
        tag: '🏛️ 宝藏小镇',
        title: '羊角村 (Giethoorn)',
        // 图片版权方案：使用无版权图库 Unsplash 的高清压缩链接
        imgUrl: 'https://images.unsplash.com/photo-1600215754990-6e7946d1e37a?auto=format&fit=crop&w=600&q=80',
        copyright: '© Photo by Unsplash', 
        desc: '被称为「荷兰威尼斯」，这里真的连一条汽车公路都没有！出行全靠纵横交错的运河和 176 座木桥。在这里，连邮差都是开着小船送信的。等安顿好了，一定要带上相机去吸一次纯氧！'
    },
    {
        id: 'c002',
        tag: '🎉 狂欢节日',
        title: '国王节全民橙色癫狂',
        img: 'https://images.unsplash.com/photo-1555505019-8c3f1c4aba5f?auto=format&fit=crop&w=600&q=80',
        copyright: '© Photo by Unsplash',
        desc: '每年 4 月 27 日，整个荷兰会陷入极度癫狂的「橙色海洋」。运河游船派对、全民街头蹦迪，而且这是你全年中唯一一天可以在街上「合法无证摆摊」卖二手货的日子！'
    },
    {
        id: 'c003',
        tag: '📚 学制揭秘',
        title: '永远拿不到的 10 分',
        img: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=80',
        copyright: '© AI Generated', // 也可以标注由 AI 生成
        desc: '荷兰实行 10 分制，但在学术界有一句魔咒：「10分给上帝，9分给教授，8分是天才，6分万岁」。在国内习惯了拿 90 分的你，来这里拿个 7.5 分就完全可以去开香槟庆祝了！'
    },
    // 你可以在这里无限往下加...
];
