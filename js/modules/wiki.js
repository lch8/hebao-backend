// ============================================================================
// js/modules/wiki.js - 红宝书与生存百科引擎 (深度解读抽屉弹窗版)
// ============================================================================
import { ModalManager } from '../components/modals.js';
import { showToast } from '../core/toast.js';
import { safeDOM } from '../core/dom.js'; 

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
            
            if (mode === 'starter') {
                safeDOM.execute('rbStarterMode', el => el.style.display = 'block'); 
                safeDOM.execute('rbWikiMode', el => el.style.display = 'none'); 
                safeDOM.execute('fabGridBtn', el => el.style.display = 'none');
                safeDOM.execute('redbookContainer', el => el.classList.remove('rb-pro-theme')); 
                this.renderStarterTasks();
            } else {
                safeDOM.execute('rbStarterMode', el => el.style.display = 'none'); 
                safeDOM.execute('rbWikiMode', el => el.style.display = 'block'); 
                
                if (mode === 'advanced') {
                    safeDOM.execute('rbWidgetsArea', el => el.style.display = 'flex'); 
                    safeDOM.execute('proWidgetsArea', el => el.style.display = 'none');
                    safeDOM.execute('safetyCheckWidget', el => el.style.display = 'block'); 
                    safeDOM.execute('wikiSectionArea', el => el.style.display = 'block'); 
                    safeDOM.execute('fabGridBtn', el => el.style.display = 'flex');
                    
                    currentRbCategory = 'all'; 
                    safeDOM.execute('wikiTabs', el => {
                        el.innerHTML = `<div class="w-tab active" onclick="window.App.switchWikiTab('all', this)">全部干货</div>
                        <div class="w-tab" onclick="window.App.switchWikiTab('羊毛购物', this)">羊毛购物</div>
                        <div class="w-tab" onclick="window.App.switchWikiTab('交通出行', this)">交通出行</div>
                        <div class="w-tab" onclick="window.App.switchWikiTab('生活避坑', this)">生活避坑</div>`;
                    });
                    this.renderWikiList(); 
                } else if (mode === 'pro') {
                    safeDOM.execute('rbWidgetsArea', el => el.style.display = 'none'); 
                    safeDOM.execute('proWidgetsArea', el => el.style.display = 'flex');
                    safeDOM.execute('safetyCheckWidget', el => el.style.display = 'none'); 
                    safeDOM.execute('wikiSectionArea', el => el.style.display = 'none'); 
                    safeDOM.execute('fabGridBtn', el => el.style.display = 'none');
                    safeDOM.execute('redbookContainer', el => el.classList.add('rb-pro-theme')); 
                    
                    this.renderProNews();
                }
            }
        } catch (error) { console.error("🚨 [Wiki] 模式切换崩溃:", error); }
    },

    // ============================================================================
    // 🗞️ 架构师高定：Pro 玩家 24h AI 新闻速报渲染引擎 (内部弹窗版)
    // ============================================================================
    async renderProNews() {
        const container = document.getElementById('proNewsList');
        if (!container) return;

        try {
            container.innerHTML = '<div style="text-align:center; padding: 40px 20px; color: #9CA3AF; font-size: 13px;">📡 正在连接全网情报中心...</div>';

            const res = await fetch('/api/get-news');
            const data = await res.json();

            if (!data.success || !data.data || data.data.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding: 40px 20px; color: #9CA3AF; font-size: 13px;">暂无速报，情报官正在快马加鞭赶来~</div>';
                return;
            }

            const newsData = data.data;
            
            // 🌟 修复 Bug：只声明一次 html
            // ================= ☕️ 新增：今日 Small Talk 话题榜 =================
            const top3 = newsData.slice(0, 3);
            let html = `
            <div style="background: linear-gradient(135deg, #E0E7FF 0%, #DBEAFE 100%); border-radius: 16px; padding: 16px; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1);">
                <div style="display:flex; align-items:center; margin-bottom: 8px;">
                    <span style="font-size: 22px; margin-right: 8px;">☕️</span>
                    <span style="font-size: 16px; font-weight: 900; color: #1E3A8A;">今日 Small Talk 破冰榜</span>
                </div>
                <div style="font-size: 12px; color: #60A5FA; margin-bottom: 14px; line-height: 1.5;">荷兰人最怕空气突然安静，快拿这 3 个话题去和同事/同学开口闲聊！</div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
            `;
            
            top3.forEach((item, i) => {
                const safeTitle = encodeURIComponent(item.title || '情报详情').replace(/'/g, "%27");
                const safeDetail = encodeURIComponent(item.detailContent || '').replace(/'/g, "%27");
                html += `
                    <div onclick="window.App.openNewsDetail(decodeURIComponent('${safeTitle}'), decodeURIComponent('${safeDetail}'))" style="background: rgba(255,255,255,0.8); border-radius: 10px; padding: 12px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: background 0.2s;">
                        <div style="font-size: 13px; font-weight: 900; color: #1E3A8A; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; max-width: 75%;">
                            <span style="color: #93C5FD; margin-right: 4px;">#${i+1}</span> ${item.title.replace(/\[.*?\]\s*/g, '')}
                        </div>
                        <span style="background: #3B82F6; color: white; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: bold; white-space: nowrap;">Get 金句 👋</span>
                    </div>
                `;
            });
            html += `</div></div>`;
            
            newsData.forEach((item, index) => {
                const isHot = item.tagColor === '#EF4444' || item.hot === true;
                const hotBadge = isHot ? `<span style="background:#FEE2E2; color:#DC2626; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold; margin-right:6px;">🔥 爆</span>` : '';

                let cleanSummary = item.content || '';
                if (item.title && cleanSummary.includes(`【${item.title}】`)) {
                    cleanSummary = cleanSummary.replace(`【${item.title}】`, '').trim();
                }

                const isLast = index === newsData.length - 1;

                // 🌟 安全编码：防止标题或内容里的特殊字符搞坏了 onclick 结构
               // 💡 终极安全编码：不仅 encode，还要把单引号强制替换为 %27，彻底杜绝语法冲突！
const safeTitle = encodeURIComponent(item.title || '情报详情').replace(/'/g, "%27");
const safeDetail = encodeURIComponent(item.detailContent || '').replace(/'/g, "%27");

                html += `
                <div class="news-item" style="display:flex; margin-bottom: 20px; position:relative; break-inside: avoid;">
                    
                    <div style="width: 55px; flex-shrink: 0; text-align: right; padding-right: 15px; position: relative;">
                        <div style="font-size: 13px; font-weight: 900; color: ${isHot ? '#111827' : '#9CA3AF'}; margin-top: 2px;">${item.time}</div>
                        <div style="position: absolute; right: -4px; top: 6px; width: 8px; height: 8px; background: ${isHot ? '#EF4444' : '#E5E7EB'}; border-radius: 50%; z-index: 2; border: 2px solid #FFF;"></div>
                        ${!isLast ? `<div style="position: absolute; right: -1px; top: 14px; bottom: -28px; width: 2px; background: #F3F4F6; z-index: 1;"></div>` : ''}
                    </div>

                    <div style="flex: 1; padding-bottom: 5px;">
                        <div style="margin-bottom: 8px; display: flex; align-items: center; flex-wrap: wrap;">
                            ${hotBadge}
                            <span style="color: ${item.tagColor || '#3B82F6'}; font-size: 11px; font-weight: 900; background: ${item.tagColor ? item.tagColor+'1A' : '#EFF6FF'}; padding: 3px 8px; border-radius: 6px;">${item.tag}</span>
                        </div>
                        
                        <div style="font-size: 15px; font-weight: 900; color: #111827; margin-bottom: 6px; line-height: 1.4;">
                            ${item.title || item.content.split('】')[0].replace('【', '')}
                        </div>
                        
                        <div style="font-size: 13px; color: #4B5563; line-height: 1.6; margin-bottom: 12px;">
                            ${cleanSummary}
                        </div>

                        <div style="text-align: right;">
                            <span onclick="window.App.openNewsDetail(decodeURIComponent('${safeTitle}'), decodeURIComponent('${safeDetail}'))" style="background: #F9FAFB; border: 1px solid #E5E7EB; color: #374151; padding: 5px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; cursor: pointer; display: inline-block; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                                ${item.actionText || '查看解读'} ⚡️
                            </span>
                        </div>
                    </div>
                </div>`;
            });

            container.innerHTML = html;
            
        } catch (error) {
            console.error("渲染新闻失败:", error);
            container.innerHTML = '<div style="text-align:center; padding: 40px; color: #EF4444; font-size: 13px;">情报中心暂时失联了，请刷新重试...</div>';
        }
    },

    checkSafetyCode() {
        const input = safeDOM.getValue('postcodeInput').trim(); 
        if (input.length !== 4) return showToast("请输入准确的4位数字邮编哦！(例如：2512)", "warning"); 
        
        const dangerZones = ['2512', '2525', '2526', '3081', '3083', '1102', '1103', '1104', '1062']; 
        const warnZones = ['2521', '2522', '3024', '3025', '1055', '1056'];

        safeDOM.execute('safetyResult', el => {
            el.style.display = 'block';
            if (dangerZones.includes(input)) { 
                el.className = 'sc-result danger'; 
                el.innerHTML = `<b>🔴 高危预警：</b><br>历史治安反馈较差，建议避免夜间单独出行，租房避开一楼。`; 
            } else if (warnZones.includes(input)) { 
                el.className = 'sc-result warn'; 
                el.innerHTML = `<b>🟡 谨慎区域：</b><br>人员流动较复杂。自行车极其容易被盗，请务必使用粗链条锁！`; 
            } else { 
                el.className = 'sc-result safe'; 
                el.innerHTML = `<b>🟢 治安良好：</b><br>管家数据库显示该区暂无高频恶性治安反馈，正常生活即可。`; 
            }
        });
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
        safeDOM.execute('starterTaskList', list => {
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
                        <div class="task-hook-action" onclick="window.App.showToast('正在前往集市...')"><span>👉</span> ${task.hook}</div>
                    </div>
                </div>`;
            });
            list.innerHTML = html;
            
            safeDOM.execute('taskProgressBar', pb => pb.style.width = `${currentTasks.length ? (doneCount / currentTasks.length) * 100 : 0}%`);
            safeDOM.execute('taskProgressText', pt => pt.innerText = `${doneCount}/${currentTasks.length}`);
        });
    },

    toggleTask(id, checkbox) {
        let savedProgress = JSON.parse(localStorage.getItem('hp_tasks_done') || '[]');
        if (checkbox.checked) { playDingSound(); if (!savedProgress.includes(id)) savedProgress.push(id); } 
        else { savedProgress = savedProgress.filter(taskId => taskId !== id); }
        localStorage.setItem('hp_tasks_done', JSON.stringify(savedProgress));
        this.renderStarterTasks(); 
    },

    hSwipeStart(e, id) { swipeStartX = e.touches[0].clientX; isSwiping = true; isDraggingClickPrevent = false; activeSwipeId = id; safeDOM.execute(`front_${id}`, frontCard => frontCard.style.transition = 'none'); },
    hSwipeMove(e, id) {
        if (!isSwiping || activeSwipeId !== id) return;
        swipeCurrentX = e.touches[0].clientX; const diffX = swipeCurrentX - swipeStartX;
        if (Math.abs(diffX) > 10) isDraggingClickPrevent = true; 
        safeDOM.execute(`front_${id}`, frontCard => frontCard.style.transform = `translateX(${diffX}px)`);
        
        const saveBg = document.querySelector(`#swipe_${id} .save-bg`); const deleteBg = document.querySelector(`#swipe_${id} .delete-bg`);
        if (diffX > 0) { if(saveBg) saveBg.style.opacity = Math.min(diffX / 80, 1); if(deleteBg) deleteBg.style.opacity = 0; } 
        else { if(saveBg) saveBg.style.opacity = 0; if(deleteBg) deleteBg.style.opacity = Math.min(Math.abs(diffX) / 80, 1); }
    },
    hSwipeEnd(e, id) {
        if (!isSwiping || activeSwipeId !== id) return;
        isSwiping = false; const diffX = swipeCurrentX - swipeStartX; 
        safeDOM.execute(`front_${id}`, frontCard => {
            frontCard.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
            const threshold = window.innerWidth * 0.35;
            if (Math.abs(diffX) > 10) {
                if (diffX > threshold) { frontCard.style.transform = `translateX(${window.innerWidth}px)`; setTimeout(() => this.handleWikiAction(id, 'saved'), 300); } 
                else if (diffX < -threshold) { frontCard.style.transform = `translateX(-${window.innerWidth}px)`; setTimeout(() => this.handleWikiAction(id, 'deleted'), 300); } 
                else { frontCard.style.transform = `translateX(0px)`; this.resetSwipeBg(id); }
            } else { frontCard.style.transform = `translateX(0px)`; this.resetSwipeBg(id); }
        });
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
    filterWiki() { this.renderWikiList(safeDOM.getValue('wikiSearchInput').toLowerCase()); },

    renderWikiList(searchQuery = '') {
        safeDOM.execute('wikiListContainer', list => {
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
        });
    },

    openWikiComments(wikiId, wikiTitle) {
        ModalManager.injectIfNeeded('wikiCommentModal');
        currentWikiIdForComment = wikiId;
        const titleEl = document.querySelector('#wikiCommentModal .fm-title'); if (titleEl) titleEl.innerText = wikiTitle + ' 的评论';
        this.renderWikiComments(); ModalManager.open('wikiCommentModal');
    },

    renderWikiComments() {
        safeDOM.execute('wikiCommentList', list => {
            const allComments = JSON.parse(localStorage.getItem('hp_wiki_comments') || '{}'); const comments = allComments[currentWikiIdForComment] || [];
            if (comments.length === 0) { list.innerHTML = `<div style="text-align:center; color:#9CA3AF; padding:40px 0;">还没有人分享踩坑经验，你来抢沙发吧！</div>`; return; }
            let html = ''; comments.forEach(c => { html += `<div class="wc-item"><div class="wc-avatar">${c.avatar}</div><div class="wc-content"><div class="wc-name"><span>${c.name}</span> <span style="color:#9CA3AF; font-weight:normal;">刚刚</span></div><div class="wc-text">${c.text}</div></div></div>`; });
            list.innerHTML = html; list.scrollTop = list.scrollHeight;
        });
    },

    submitWikiComment() {
        const text = safeDOM.getValue('wikiCommentInput').trim(); 
        if (!text) return showToast("写点什么再发送吧！", "warning");
        
        const allComments = JSON.parse(localStorage.getItem('hp_wiki_comments') || '{}'); 
        if (!allComments[currentWikiIdForComment]) allComments[currentWikiIdForComment] = [];
        allComments[currentWikiIdForComment].push({ name: localStorage.getItem('hp_name') || '管家热心用户', avatar: '😎', text: text });
        
        localStorage.setItem('hp_wiki_comments', JSON.stringify(allComments)); 
        safeDOM.execute('wikiCommentInput', el => el.value = ''); 
        this.renderWikiComments(); 
        showToast("💡 分享干货，信用分 +2", "success");
    }
};

// 💥 暴力绑定机制 + 注入详情抽屉弹窗引擎
if (typeof window !== 'undefined') {
    window.App = window.App || {};
    
    // 批量绑定 WikiEngine 的所有函数
    Object.keys(WikiEngine).forEach(key => {
        if (typeof WikiEngine[key] === 'function') {
            window.App[key] = WikiEngine[key].bind(WikiEngine);
        }
    });

    // 🌟 原生发音引擎 (Text-to-Speech)
    window.App.speak = function(text, lang) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // 停止上一句
            const msg = new SpeechSynthesisUtterance(text);
            msg.lang = lang; // 'nl-NL' 或 'en-US'
            msg.rate = 0.85; // 放慢语速，方便留学生跟读
            window.speechSynthesis.speak(msg);
        } else {
            alert('抱歉，您的浏览器不支持语音播报哦~');
        }
    };

    // 🌟 全新挂载弹窗唤起函数 (无视框架，原生 JS 构建)
    window.App.openNewsDetail = function(title, htmlContent) {
        // 1. 如果有旧的，先清理掉，防止叠罗汉
        const existing = document.getElementById('hebaoNewsOverlay');
        if (existing) existing.remove();

        // 2. 创建黑色半透明遮罩
        const overlay = document.createElement('div');
        overlay.id = 'hebaoNewsOverlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:99999; display:flex; justify-content:center; align-items:flex-end; backdrop-filter:blur(2px); transition: opacity 0.3s; opacity: 0;';
        
        // 3. 创建白色底部卡片 (带圆角和小灰条，支持滚动)
        const card = document.createElement('div');
        card.style.cssText = 'width:100%; max-width:500px; background:#FFF; border-radius:24px 24px 0 0; padding:24px 20px 40px 20px; box-sizing:border-box; max-height:85vh; overflow-y:auto; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative;';

        // 4. 将 AI 生成的深度情报内容塞入卡片
        card.innerHTML = `
            <div style="width:40px; height:4px; background:#E5E7EB; border-radius:2px; margin:0 auto 20px auto;"></div>
            <div style="font-size:18px; font-weight:900; color:#111827; margin-bottom:16px; line-height:1.4;">${title}</div>
            
            <div style="font-size:14px; color:#374151; line-height:1.7;">
                ${htmlContent}
            </div>
            
            <div style="margin-top:30px; text-align:center;">
                <button id="closeNewsModalBtn" style="background:#F3F4F6; color:#4B5563; border:none; padding:12px 40px; border-radius:20px; font-weight:bold; font-size:14px; cursor:pointer;">关 闭</button>
            </div>
        `;

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        // 5. 极度丝滑的动画入场
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
        
        // 6. 关闭逻辑 (点击背景或关闭按钮)
        const closeModals = () => {
            overlay.style.opacity = '0';
            card.style.transform = 'translateY(100%)';
            setTimeout(() => overlay.remove(), 300); // 等待动画结束销毁 DOM
        };

        document.getElementById('closeNewsModalBtn').addEventListener('click', closeModals);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModals(); });
    };
}
