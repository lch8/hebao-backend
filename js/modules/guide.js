// ============================================================================
// js/modules/guide.js - 大厂级新手引导引擎 (Powered by Driver.js)
// ============================================================================

export const GuideEngine = {
    // 初始化并检查是否需要播放引导
    initGuide() {
        // 检查 localStorage，如果已经看过了，就不再打扰用户
        if (localStorage.getItem('hebao_has_toured') === 'true') {
            return;
        }

        // 稍微延迟 1 秒触发，等页面的数据和动画都加载完毕，体验更好
        setTimeout(() => {
            this.startTour();
        }, 1000);
    },

    // 🌟 核心：编排引导剧本
    startTour() {
        // 获取 Driver.js 实例
        const driver = window.driver.js.driver;

        const driverObj = driver({
            showProgress: true,       // 显示顶部进度条
            allowClose: false,        // 强制看完，点击遮罩不关闭（你也可以改为 true）
            nextBtnText: '下一步 ›',
            prevBtnText: '‹ 上一步',
            doneBtnText: '🚀 开启探索',
            // 🌟 关键：自定义高亮框和弹窗的颜色风格，贴合我们的小红书极简风
            popoverClass: 'hebao-driver-theme', 
            
            steps: [
                { 
                    // 不绑定元素，在屏幕中央欢迎
                    popover: { 
                        title: '🎉 欢迎来到荷包管家', 
                        description: '留学生在荷兰的避雷与生存神器！花 1 分钟了解一下怎么用吧~' 
                    } 
                },
                { 
                    // 绑定到你底部导航栏中间的发布/扫码大按钮
                    element: '.tab-item-publish', 
                    popover: { 
                        title: '📸 核心魔法：扫一扫', 
                        description: '在荷兰超市遇到不认识的商品？点这里拍张照，管家秒出中文评测和避雷指南！',
                        side: "top", align: 'center'
                    } 
                },
                { 
                    // 绑定到你首页顶部的横向分类导航
                    element: '#trendingCategoryNav', 
                    popover: { 
                        title: '🏆 超市红黑榜', 
                        description: '左右滑动查看不同分类，大家都在买什么、踩了什么坑，一目了然。',
                        side: "bottom", align: 'start'
                    } 
                },
                { 
                    // 绑定到红黑榜切换 Tab
                    element: '.t-tab.active', 
                    popover: { 
                        title: '🔥 种草 vs 💣 避雷', 
                        description: '点击这里可以切换查看红榜（推荐）和黑榜（踩雷千万别买）。',
                        side: "bottom", align: 'center'
                    } 
                },
                { 
                    // 绑定到底部导航栏第 4 个按钮 (消息)
                    element: '.tab-bar > div:nth-child(4)', 
                    popover: { 
                        title: '💬 破冰与私信', 
                        description: '这里不仅能和校友私聊二手交易，还能获取每天最新的 Small Talk 破冰金句哦！',
                        side: "top", align: 'center'
                    } 
                }
            ],
            
            // 当引导全部结束时触发
            onDestroyed: () => {
                // 打上烙印，以后再也不弹了
                localStorage.setItem('hebao_has_toured', 'true');
                console.log("✅ 新手引导完成！");
            }
        });

        // 启动！
        driverObj.drive();
    }
};

// 挂载到全局
if (typeof window !== 'undefined') {
    window.App = window.App || {};
    window.App.startTour = GuideEngine.startTour.bind(GuideEngine);
    window.App.initGuide = GuideEngine.initGuide.bind(GuideEngine);
}
