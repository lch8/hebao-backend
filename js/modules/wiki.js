// ============================================================================
// js/modules/wiki.js - 红宝书与生存百科引擎 (极度防御全量版)
// ============================================================================
import { ModalManager } from '../components/modals.js';
import { showToast } from '../core/toast.js';

// ================= 📦 内置核心数据 =================
const rbTaskData = {
    'pre': [
        { id: 'p1', title: '核心文件随身带', desc: '护照、MVV签证信、录取通知书、出生双认证。放随身包，万一行李丢了也能办手续！', hook: '买个好用的防盗护照包', hookTab: 'market-idle' },
        { id: 'p2', title: '预约市政厅 (Gemeente)', desc: '8-9月号源极度紧张，拿到 BSN 才能办银行卡。务必在国内提前预约落地后的号！', hook: '找学长有偿指导预约', hookTab: 'market-help' },
        { id: 'p3', title: '办理双币信用卡', desc: '办父母名下的 Visa/Mastercard 副卡。落地没办出当地卡时，全靠它吃饭买票。', hook: '发悬赏问哪家银行汇率好', hookTab: 'market-help' },
        { id: 'p4', title: '兑换少量欧元零钱', desc: '换 €300 左右现金，要求必须给 €50 及以下面额！荷兰很多店拒收 €100 以上大钞。', hook: '去集市收点学长的二手零钱', hookTab: 'market-idle' }
    ],
    'day7': [
        { id: 't1', title: '去市政厅 (Gemeente) 注册', desc: '带着租房合同和双认证出生证明，去市政厅注册并获取 BSN 号码。', hook: '找个搭子一起去排队', hookTab: 'market-partner' },
        { id: 't2', title: '办理本地银行卡', desc: '推荐 ING 或 Bunq。有了当地卡才能开通 Tikkie (荷兰版微信支付) 和买火车票。', hook: '不会搞App？求助校友', hookTab: 'market-help' },
        { id: 't3', title: '激活 DigiD 数字身份', desc: '极其重要！收到信件后立刻激活，以后的政府网站、退税、查医保全靠它扫码登录。', hook: '买台二手显示器大屏查政策', hookTab: 'market-idle' },
        { id: 't4', title: '买基础医保 (Zorgverzekering)', desc: '法律规定落地4个月内必须买，否则面临巨额罚款。', hook: '发悬赏找学长推荐靠谱保险', hookTab: 'market-help' },
        { id: 't5', title: '办理实名黄卡 (OV-chipkaart)', desc: '别用匿名蓝卡坐火车！上 NS 官网绑一个“周末免费”套餐。', hook: '嫌火车贵？去收一辆二手自行车', hookTab: 'market-idle' }
    ],
    'month1': [
        { id: 'm1', title: '注册家庭医生 (Huisarts)', desc: '在荷兰生病去医院急诊会被赶出来！必须先注册社区的 GP。', hook: '看不懂荷兰语说明书？发悬赏', hookTab: 'market-help' },
        { id: 'm2', title: '申请医疗补贴 (Zorgtoeslag)', desc: '只要你没收入或收入很低，政府每月白送你 €120+ 帮你交保费！', hook: '省下的钱去集市淘个好物', hookTab: 'market-idle' },
        { id: 'm3', title: '办理各大超市会员卡', desc: 'Albert Heijn 的 Bonus 卡、Jumbo 的积分卡。没有卡买东西是不打折的！', hook: '求个群友分享AH打折条码', hookTab: 'market-help' }
    ]
};

const rbWikis = [
    { id: 'w1', mode: 'advanced', category: '羊毛购物', icon: '🛒', title: 'AH 超市 35% Off 贴纸规律', tag: '恩格尔系数狂降', summary: '摸透打折贴纸出没时间，实现牛排三文鱼自由。', details: 'AH 员工通常在每天下午 15:30 - 16:30 左右开始贴黄色的 35% 贴纸（临期商品）。重点盯肉类区，肉类买回来直接扔冷冻室，至少能放一个月！' },
    { id: 'w2', mode: 'advanced', category: '羊毛购物', icon: '📦', title: 'Too Good To Go 盲盒抢购', tag: '€4吃三天', summary: '剩菜盲盒？不，这是留学生的生存之光。', details: '下载 TGTG App，每天留意面包店 (Bakkerij) 和大超市的魔法盒。通常花 €4.99 能拿走原价 €15+ 的羊角包和果蔬，拼手速抢到就是赚到。' },
    { id: 'w4', mode: 'advanced', category: '交通出行', icon: '🚂', title: 'NS 火车终极省钱组合', tag: '交通刺客克星', summary: '荷兰火车票贵到离谱？这么坐直接打骨折。', details: '绝招：买一张 NS Flex Dal Voordeel (非高峰期4折) 套餐，每月只需 €5.6。如果偶尔全价出行，记得在车站找人同行打折，直接享受 40% off！' },
    { id: 'w8', mode: 'advanced', category: '生活避坑', icon: '🌡️', title: '年度能源账单结算陷阱', tag: '防坑几千欧', summary: '年底突然收到几千欧的补缴天然气账单？', details: '荷兰的能源是“先预估扣费，年底多退少补”。如果你冬天狂开暖气，年底的 Eindafrekening 会让你破产。建议平时主动调高每月预付费。' }
];

// ================= ⚙️ 核心引擎 =================
let currentRbMode = localStorage.getItem('hp_survival_mode') || 'starter';
let currentRbCategory = 'all';
let currentTaskPhase = 'pre';
let swipeStartX = 0, swipeCurrentX = 0, isSwiping = false;
let isDraggingClickPrevent = false, activeSwipeId = null;
let currentWikiIdForComment = null;

let audioCtx;
function playDingSound() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); 
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(880, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); 
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime); gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.02); gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.connect(gainNode); gainNode.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } catch(e) {}
}

export const WikiEngine = {
    switchRbMode(mode) {
        try {
            currentRbMode = mode; 
            localStorage.setItem('hp_survival_mode', mode);

            document.querySelectorAll('.rb-mode-btn').forEach(btn => btn.classList.remove('active'));
            const activeBtn = document.querySelector(`.rb-mode-btn[onclick*="${mode}"]`);
            if(activeBtn) activeBtn.classList.add('active');
            
            const toggleDisplay = (id, style) => { const el = document.getElementById(id); if(el) el.style.display = style; };
            const mainContainer = document.getElementById('redbookContainer');

            if (mode === 'starter') {
                toggleDisplay('rbStarterMode', 'block'); toggleDisplay('rbWikiMode', 'none'); toggleDisplay('fabGridBtn', 'none');
                if(mainContainer) mainContainer.classList.remove('rb-pro-theme'); 
                this.renderStarterTasks();
            } else {
                toggleDisplay('rbStarterMode', 'none'); toggleDisplay('rbWikiMode', 'block'); 
                if (mode === 'advanced') {
                    toggleDisplay('rbWidgetsArea', 'flex'); toggleDisplay('proWidgetsArea', 'none');
                    toggleDisplay('safetyCheckWidget', 'block'); toggleDisplay('wikiSectionArea', 'block'); toggleDisplay('fabGridBtn', 'flex');
                    currentRbCategory = 'all'; 
                    const tabContainer = document.getElementById('wikiTabs');
                    if (tabContainer) {
                        tabContainer.innerHTML = `<div class="w-tab active" onclick="window.App.switchWikiTab('all', this)">全部干货</div>
                        <div class="w-tab" onclick="window.App.switchWikiTab('羊毛购物', this)">羊毛购物</div>
                        <div class="w-tab" onclick="window.App.switchWikiTab('交通出行', this)">交通出行</div>
                        <div class="w-tab" onclick="window.App.switchWikiTab('生活避坑', this)">生活避坑</div>`;
                    }
                    this.renderWikiList(); 
                } else if (mode === 'pro') {
                    toggleDisplay('rbWidgetsArea', 'none'); toggleDisplay('proWidgetsArea', 'flex');
                    toggleDisplay('safetyCheckWidget', 'none'); toggleDisplay('wikiSectionArea', 'none'); toggleDisplay('fabGridBtn', 'none');
                }
                if(mainContainer) { if(mode === 'pro') mainContainer.classList.add('rb-pro-theme'); else mainContainer.classList.remove('rb-pro-theme'); }
            }
        } catch (error) { console.error("🚨 [Wiki] 模式切换崩溃:", error); }
    },

    showEmergency(type) {
        if (type === 'medical') showToast('夜间急病请先拨打 Huisartsenpost，生命危险直拨 112！', 'error');
        else if (type === 'fraud') showToast('切勿提前转账定金！请核实房东 KVK。', 'warning');
        else if (type === 'key') showToast('千万别在谷歌搜带 [Ad] 的开锁匠 (极贵)！请找本地正规店铺。', 'warning');
        else if (type === 'passport') showToast('护照丢失请立刻报警获取挂失单，并联系中国驻荷大使馆！', 'error');
    },

    switchTaskPhase(phase, el) { 
        currentTaskPhase = phase; 
        document.querySelectorAll('.tt-tab').forEach(tab => tab.classList.remove('active')); 
        if(el) el.classList.add('active'); 
        this.renderStarterTasks(); 
    },

    renderStarterTasks() {
        try {
            const list = document.getElementById('starterTaskList'); if(!list) return;
            const savedProgress = JSON.parse(localStorage.getItem('hp_tasks_done') || '[]');
            const currentTasks = rbTaskData[currentTaskPhase] || [];
            
            let html = ''; let doneCount = 0;
            currentTasks.forEach(task => {
                const isDone = savedProgress.includes(task.id); if (isDone) doneCount++;
                html += `
                <div class="task-card ${isDone ? 'done' : ''}" id="task_${task.id}">
                    <input type="checkbox" class="custom-checkbox-task" ${isDone ? 'checked' : ''} onchange="window.App.toggleTask('${task.id}', this)">
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        <div class="task-desc">${task.desc}</div>
                        <div class="task-hook-action" onclick="showToast('正在前往集市...')"><span>👉</span> ${task.hook}</div>
                    </div>
                </div>`;
            });
            list.innerHTML = html;
            
            const pb = document.getElementById('taskProgressBar'); if(pb) pb.style.width = `${currentTasks.length ? (doneCount / currentTasks.length) * 100 : 0}%`;
            const pt = document.getElementById('taskProgressText'); if(pt) pt.innerText = `${doneCount}/${currentTasks.length}`;
        } catch(e) { console.error("🚨 [Wiki] 任务渲染崩溃:", e); }
    },

    toggleTask(id, checkbox) {
        let savedProgress = JSON.parse(localStorage.getItem('hp_tasks_done') || '[]');
        if (checkbox.checked) { playDingSound(); if (!savedProgress.includes(id)) savedProgress.push(id); } 
        else { savedProgress = savedProgress.filter(taskId => taskId !== id); }
        localStorage.setItem('hp_tasks_done', JSON.stringify(savedProgress));
        this.renderStarterTasks(); 
    },

    hSwipeStart(e, id) { swipeStartX = e.touches[0].clientX; isSwiping = true; isDraggingClickPrevent = false; activeSwipeId = id; const frontCard = document.getElementById(`front_${id}`); if(frontCard) frontCard.style.transition = 'none'; },
    hSwipeMove(e, id) {
        if (!isSwiping || activeSwipeId !== id) return;
        swipeCurrentX = e.touches[0].clientX; const diffX = swipeCurrentX - swipeStartX;
        if (Math.abs(diffX) > 10) isDraggingClickPrevent = true; 
        const frontCard = document.getElementById(`front_${id}`); if(frontCard) frontCard.style.transform = `translateX(${diffX}px)`;
        const saveBg = document.querySelector(`#swipe_${id} .save-bg`); const deleteBg = document.querySelector(`#swipe_${id} .delete-bg`);
        if (diffX > 0) { if(saveBg) saveBg.style.opacity = Math.min(diffX / 80, 1); if(deleteBg) deleteBg.style.opacity = 0; } 
        else { if(saveBg) saveBg.style.opacity = 0; if(deleteBg) deleteBg.style.opacity = Math.min(Math.abs(diffX) / 80, 1); }
    },
    hSwipeEnd(e, id) {
        if (!isSwiping || activeSwipeId !== id) return;
        isSwiping = false; const diffX = swipeCurrentX - swipeStartX; const frontCard = document.getElementById(`front_${id}`); if(!frontCard) return;
        frontCard.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
        const threshold = window.innerWidth * 0.35;
        if (Math.abs(diffX) > 10) {
            if (diffX > threshold) { frontCard.style.transform = `translateX(${window.innerWidth}px)`; setTimeout(() => this.handleWikiAction(id, 'saved'), 300); } 
            else if (diffX < -threshold) { frontCard.style.transform = `translateX(-${window.innerWidth}px)`; setTimeout(() => this.handleWikiAction(id, 'deleted'), 300); } 
            else { frontCard.style.transform = `translateX(0px)`; this.resetSwipeBg(id); }
        } else { frontCard.style.transform = `translateX(0px)`; this.resetSwipeBg(id); }
        setTimeout(() => { isDraggingClickPrevent = false; activeSwipeId = null; }, 100);
    },
    resetSwipeBg(id) { const sBg = document.querySelector(`#swipe_${id} .save-bg`); const dBg = document.querySelector(`#swipe_${id} .delete-bg`); if(sBg) sBg.style.opacity = 0; if(dBg) dBg.style.opacity = 0; },
    toggleWikiCard(el) { if (isSwiping || isDraggingClickPrevent) return; const transform = window.getComputedStyle(el).transform; const matrix = new WebKitCSSMatrix(transform); if (Math.abs(matrix.m41) < 5) el.classList.toggle('open'); },
    
    handleWikiAction(id, actionStr) {
        let arr = JSON.parse(localStorage.getItem(`hp_wiki_${actionStr}`) || '[]'); if (!arr.includes(id)) arr.push(id);
        localStorage.setItem(`hp_wiki_${actionStr}`, JSON.stringify(arr));
        if(actionStr === 'saved') showToast("⭐ 已加入收藏", "success");
        this.renderWikiList();
    },

    switchWikiTab(category, el) { document.querySelectorAll('.w-tab').forEach(tab => tab.classList.remove('active')); el.classList.add('active'); currentRbCategory = category; this.renderWikiList(); },
    filterWiki() { this.renderWikiList(document.getElementById('wikiSearchInput').value.toLowerCase()); },

    renderWikiList(searchQuery = '') {
        const list = document.getElementById('wikiListContainer'); if(!list) return;
        let html = '';
        const deletedData = JSON.parse(localStorage.getItem('hp_wiki_deleted') || '[]'); const savedData = JSON.parse(localStorage.getItem('hp_wiki_saved') || '[]');
        const customWikis = JSON.parse(localStorage.getItem('hp_custom_wikis') || '[]'); 
        const allWikis = [...rbWikis, ...customWikis];

        let filteredData = allWikis.filter(w => {
            if (w.mode !== currentRbMode) return false;
            if (deletedData.includes(w.id) || savedData.includes(w.id)) return false;
            const catMatch = currentRbCategory === 'all' ? true : w.category === currentRbCategory;
            const searchMatch = w.title.toLowerCase().includes(searchQuery) || w.summary.toLowerCase().includes(searchQuery);
            return catMatch && searchMatch;
        });

        if (filteredData.length === 0) { 
            list.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding: 60px 0;">该分类下暂无干货啦！<br><br><span style="font-size:12px; cursor:pointer; color:#10B981; text-decoration:underline;" onclick="localStorage.removeItem(\'hp_wiki_deleted\'); localStorage.removeItem(\'hp_wiki_saved\'); window.App.renderWikiList();">点我重置所有卡片</span></div>'; 
        } else {
            filteredData.forEach(w => {
                html += `
                <div class="swipe-wrapper" id="swipe_${w.id}">
                    <div class="swipe-bg save-bg">⭐ 收藏</div><div class="swipe-bg delete-bg">🗑️ 懂了</div>
                    <div class="wiki-card swipe-front" id="front_${w.id}" onclick="window.App.toggleWikiCard(this)" ontouchstart="window.App.hSwipeStart(event, '${w.id}')" ontouchmove="window.App.hSwipeMove(event, '${w.id}')" ontouchend="window.App.hSwipeEnd(event, '${w.id}')">
                        <div class="wk-header"><div class="wk-icon">${w.icon}</div><div class="wk-info"><div class="wk-title">${w.title} <span class="wk-tag">${w.tag}</span></div><div class="wk-summary">${w.summary}</div></div></div>
                        <div class="wk-detail" onclick="event.stopPropagation()">
                            <div class="wk-step">${w.details}</div>
                            <div class="wk-ugc-btn" onclick="window.App.openWikiComments('${w.id}', '${w.title}')">💬 查看网友补充 & 踩坑情报</div>
                        </div>
                    </div>
                </div>`;
            });
        }
        html += `<button class="btn-ai-create" onclick="window.App.injectIfNeeded('aiWikiModal'); document.getElementById('aiWikiModal').style.display='flex'">✨ AI 自动提取长文并录入</button>`;
        list.innerHTML = html;
    },

    checkSafetyCode() {
        const input = document.getElementById('postcodeInput').value.trim(); const resultBox = document.getElementById('safetyResult');
        if (input.length !== 4) return showToast("请输入准确的4位数字邮编哦！(例如：2512)", "warning"); 
        resultBox.style.display = 'block';
        const dangerZones = ['2512', '2525', '2526', '3081', '3083', '1102', '1103', '1104', '1062']; 
        const warnZones = ['2521', '2522', '3024', '3025', '1055', '1056'];
        if (dangerZones.includes(input)) { resultBox.className = 'sc-result danger'; resultBox.innerHTML = `<b>🔴 高危预警：</b><br>历史治安反馈较差，建议避免夜间单独出行，租房避开一楼。`; } 
        else if (warnZones.includes(input)) { resultBox.className = 'sc-result warn'; resultBox.innerHTML = `<b>🟡 谨慎区域：</b><br>人员流动较复杂。自行车极其容易被盗，请务必使用粗链条锁！`; } 
        else { resultBox.className = 'sc-result safe'; resultBox.innerHTML = `<b>🟢 治安良好：</b><br>管家数据库显示该区暂无高频恶性治安反馈，正常生活即可。`; }
    },
    
    openWikiComments(wikiId, wikiTitle) {
        ModalManager.injectIfNeeded('wikiCommentModal');
        currentWikiIdForComment = wikiId;
        const titleEl = document.querySelector('#wikiCommentModal .fm-title'); if (titleEl) titleEl.innerText = wikiTitle + ' 的评论';
        this.renderWikiComments(); ModalManager.open('wikiCommentModal');
    },

    renderWikiComments() {
        const list = document.getElementById('wikiCommentList'); if (!list) return;
        const allComments = JSON.parse(localStorage.getItem('hp_wiki_comments') || '{}'); const comments = allComments[currentWikiIdForComment] || [];
        if (comments.length === 0) { list.innerHTML = `<div style="text-align:center; color:#9CA3AF; padding:40px 0;">还没有人分享踩坑经验，你来抢沙发吧！</div>`; return; }
        let html = ''; comments.forEach(c => { html += `<div class="wc-item"><div class="wc-avatar">${c.avatar}</div><div class="wc-content"><div class="wc-name"><span>${c.name}</span> <span style="color:#9CA3AF; font-weight:normal;">刚刚</span></div><div class="wc-text">${c.text}</div></div></div>`; });
        list.innerHTML = html; list.scrollTop = list.scrollHeight;
    },

    submitWikiComment() {
        const input = document.getElementById('wikiCommentInput'); if (!input) return;
        const text = input.value.trim(); if (!text) return showToast("写点什么再发送吧！", "warning");
        const allComments = JSON.parse(localStorage.getItem('hp_wiki_comments') || '{}'); if (!allComments[currentWikiIdForComment]) allComments[currentWikiIdForComment] = [];
        allComments[currentWikiIdForComment].push({ name: localStorage.getItem('hp_name') || '管家热心用户', avatar: '😎', text: text });
        localStorage.setItem('hp_wiki_comments', JSON.stringify(allComments)); input.value = ''; this.renderWikiComments(); showToast("💡 分享干货，信用分 +2", "success");
    }
};

// 💥 暴力绑定机制：直接塞进全局，彻底解决 HTML onclick 报 undefined 的问题！
if (typeof window !== 'undefined') {
    Object.keys(WikiEngine).forEach(key => {
        if (typeof WikiEngine[key] === 'function') {
            window.App = window.App || {};
            window.App[key] = WikiEngine[key].bind(WikiEngine);
        }
    });
}
