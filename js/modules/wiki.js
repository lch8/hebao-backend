export const WikiEngine = {
    switchRbMode(mode) {
        try {
            localStorage.setItem('hp_survival_mode', mode);
            
            if (document.getElementById('rbStarterMode')) {
                document.getElementById('rbStarterMode').style.display = mode === 'starter' ? 'block' : 'none';
            }
            if (document.getElementById('rbWikiMode')) {
                document.getElementById('rbWikiMode').style.display = mode !== 'starter' ? 'block' : 'none';
            }
            
            // 切换主题 class 防护
            const mainContainer = document.getElementById('redbookContainer');
            if (mainContainer) {
                if (mode === 'pro') mainContainer.classList.add('rb-pro-theme'); 
                else mainContainer.classList.remove('rb-pro-theme');
            }
        } catch (error) {
            console.error("🚨 [Wiki Mode Switch Error]:", error);
        }
    },

    renderStarterTasks(currentTaskPhase, rbTaskData) {
        try {
            const list = document.getElementById('starterTaskList');
            if (!list) return;
            // ... 渲染逻辑 ...
            if (document.getElementById('taskProgressBar')) {
                document.getElementById('taskProgressBar').style.width = `...`; // 进度条逻辑
            }
        } catch (error) {
            console.error("🚨 [Task Render Error]:", error);
        }
    }
};
