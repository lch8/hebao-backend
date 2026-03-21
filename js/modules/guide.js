// ============================================================================
// js/modules/guide.js - 大厂级新手引导引擎 (完美对齐核心玩法)
// ============================================================================

export const GuideEngine = {
    initGuide() {
        if (localStorage.getItem('hebao_has_toured') === 'true') {
            return;
        }
        // 延迟 1.5 秒，等页面的数据、头像、UI 全部渲染稳妥后再闪亮登场
        setTimeout(() => {
            this.startTour();
        }, 1500);
    },

    startTour() {
        const driver = window.driver.js.driver;

        const driverObj = driver({
            showProgress: true,       
            allowClose: false,        
            nextBtnText: '下一步 ›',
            prevBtnText: '‹ 上一步',
            doneBtnText: '🚀 开启探索',
            popoverClass: 'hebao-driver-theme', 
            
            steps: [
                { 
                    // 1. 屏幕中央震撼开场
                    popover: { 
                        title: '🎉 欢迎来到荷包管家', 
                        description: '荷兰留学生的避雷与生存神器！花 1 分钟了解核心玩法，保住你的钱包！' 
                    } 
                },
                { 
                    // 2. 锁定右上角的相机扫码 Icon
                    element: '[onclick*="openScanner"]', 
                    popover: { 
                        title: '📸 核心魔法：万物皆可扫', 
                        description: '逛超市遇到看不懂的荷兰语商品？点右上角拍张照，AI 管家秒出中文评测、神仙吃法和致命避雷！',
                        side: "bottom", align: 'end'
                    } 
                },
                { 
                    // 3. 锁定第一个 Tab (红宝书) 介绍首页双模式
                    element: '.tab-bar > div:nth-child(1)', 
                    popover: { 
                        title: '📖 荷村生存主线', 
                        description: '刚落地？玩一局「生存模拟器」刷主线任务！老司机？切到「Pro玩家」看每日吃瓜新闻和 Small Talk 破冰金句！',
                        side: "top", align: 'start'
                    } 
                },
                { 
                    // 4. 锁定第二个 Tab (集市/红黑榜)
                    element: '.tab-bar > div:nth-child(2)', 
                    popover: { 
                        title: '🛒 避雷指南 & 二手集市', 
                        description: '这里汇聚了留学生一口口吃出来的「好物/踩雷榜单」，还能捡漏超低价的学长学姐二手闲置哦！',
                        side: "top", align: 'center'
                    } 
                },
                { 
                    // 5. 锁定中间的大加号
                    element: '.tab-item-publish', 
                    popover: { 
                        title: '✍️ 一键发布', 
                        description: '想出二手闲置？发现了神仙零食？或者踩了大坑想吐槽？点这个大大的加号，分享给全村！',
                        side: "top", align: 'center'
                    } 
                },
                { 
                    // 6. 锁定最后一个 Tab (我的)
                    element: '.tab-bar > div:nth-child(5)', 
                    popover: { 
                        title: '👤 你的专属档案', 
                        description: '去「我的」解锁全部特权！别忘了点一下默认头像，换上一张你的绝美照片哦 ✨',
                        side: "top", align: 'end'
                    } 
                }
            ],
            
            onDestroyed: () => {
                localStorage.setItem('hebao_has_toured', 'true');
                console.log("✅ 新手引导完成！");
            }
        });

        driverObj.drive();
    }
};

if (typeof window !== 'undefined') {
    window.App = window.App || {};
    window.App.startTour = GuideEngine.startTour.bind(GuideEngine);
    window.App.initGuide = GuideEngine.initGuide.bind(GuideEngine);
}
