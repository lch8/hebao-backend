// ============================================================================
// js/modules/wiki.js - 红宝书与生存百科引擎 (深度解读抽屉弹窗版)
// ============================================================================
import { ModalManager } from '../components/modals.js';
import { showToast } from '../core/toast.js';
import { safeDOM } from '../core/dom.js'; 
// 引入分离的卡片数据
import { wikiData } from '../data/wikiData.js';

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
   // ============================================================================
    // 🗞️ 架构师高定：Pro 玩家 24h AI 新闻速报渲染引擎 (修复崩溃 & 去重版)
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
            
            // 🌟 修复崩溃：这里只声明一次 let html，彻底消灭报错！
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
            
            // 🌟 修复重复：使用 remainingNews 截取掉前 3 条，底下不再展示
            const remainingNews = newsData.slice(3);

            remainingNews.forEach((item, index) => {
                const isHot = item.tagColor === '#EF4444' || item.hot === true;
                const hotBadge = isHot ? `<span style="background:#FEE2E2; color:#DC2626; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold; margin-right:6px;">🔥 爆</span>` : '';

                let cleanSummary = item.content || '';
                if (item.title && cleanSummary.includes(`【${item.title}】`)) {
                    cleanSummary = cleanSummary.replace(`【${item.title}】`, '').trim();
                }

                const isLast = index === remainingNews.length - 1;

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

    // ==========================================
    // 🛡️ 智能防误触：探探滑动引擎
    // ==========================================
    swipeState: {}, // 记录每张卡片的滑动状态

    hSwipeStart(e, id) {
        this.swipeState[id] = {
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            isScrolling: undefined // undefined 表示还不确定用户的意图
        };
        const card = document.getElementById(`front_${id}`);
        if(card) card.style.transition = 'none'; // 移除动画，让拖拽更跟手
    },

    hSwipeMove(e, id) {
        const state = this.swipeState[id];
        if (!state) return;

        const deltaX = e.touches[0].clientX - state.startX;
        const deltaY = e.touches[0].clientY - state.startY;

        // 🌟 核心防误触逻辑：判断用户的真实意图
        if (typeof state.isScrolling === 'undefined') {
            state.isScrolling = Math.abs(deltaY) > Math.abs(deltaX);
        }

        if (state.isScrolling) return;

        if (e.cancelable) e.preventDefault();
        
        const card = document.getElementById(`front_${id}`);
        if (card) {
            // 加入阻尼效果，最大拖动 150px
            const moveX = deltaX > 0 ? Math.min(deltaX, 150) : Math.max(deltaX, -150);
            card.style.transform = `translateX(${moveX}px)`;

            // 🌟 修复1：滑动时，动态改变底层背景文字的透明度 (呈现渐显效果)
            const saveBg = document.querySelector(`#swipe_${id} .save-bg`);
            const deleteBg = document.querySelector(`#swipe_${id} .delete-bg`);
            if (deltaX > 0) {
                // 右滑：显示收藏，隐藏懂了
                if (saveBg) saveBg.style.opacity = Math.min(deltaX / 80, 1);
                if (deleteBg) deleteBg.style.opacity = 0;
            } else {
                // 左滑：显示懂了，隐藏收藏
                if (saveBg) saveBg.style.opacity = 0;
                if (deleteBg) deleteBg.style.opacity = Math.min(Math.abs(deltaX) / 80, 1);
            }
        }
    },

    hSwipeEnd(e, id) {
        const state = this.swipeState[id];
        if (!state) return;
        
        const card = document.getElementById(`front_${id}`);
        if (!card) return;
        
        card.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'; // 恢复丝滑弹簧动画

        // 如果之前是上下滚动，直接回弹归位并退出
        if (state.isScrolling) {
            card.style.transform = `translateX(0px)`;
            this.swipeState[id] = null;
            return;
        }

        const deltaX = e.changedTouches[0].clientX - state.startX;
        
        if (deltaX > 80) {
            // 右滑收藏：卡片直接飞出屏幕右侧
            card.style.transform = `translateX(150%)`;
            // 🌟 修复2：调用正确的 handleWikiAction 函数，并且传参必须是 'saved'
            setTimeout(() => { if(window.App.handleWikiAction) window.App.handleWikiAction(id, 'saved'); }, 300);
        } else if (deltaX < -80) {
            // 左滑懂了：卡片直接飞出屏幕左侧
            card.style.transform = `translateX(-150%)`;
            // 🌟 修复2：调用正确的 handleWikiAction 函数，并且传参必须是 'deleted'
            setTimeout(() => { if(window.App.handleWikiAction) window.App.handleWikiAction(id, 'deleted'); }, 300);
        } else {
            // 没滑够距离，弹回原位
            card.style.transform = `translateX(0px)`;
            // 🌟 修复3：如果没有滑出去，要把背景文字的透明度重置为0
            if(this.resetSwipeBg) this.resetSwipeBg(id);
        }
        this.swipeState[id] = null;
    },
    // ==========================================
    // 💖 渲染我的收藏 (Tab 内嵌版 - 对象内部写法)
    // ==========================================
    showMyCollections() {
        // 1. 直接锁定我们在 HTML 里写好的那个容器
        const container = document.getElementById('myCollectionsList');
        if (!container) return;

        // 2. 读取本地收藏的数据 ID
        const savedIds = JSON.parse(localStorage.getItem('hp_wiki_saved') || '[]');

        // 3. 如果没有收藏，直接渲染极简空状态
        if (savedIds.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px 0; color: #94A3B8;">
                    <div style="font-size: 32px; margin-bottom: 10px;">📭</div>
                    <div style="font-size: 14px; font-weight: bold; color: #64748B;">还没有收藏干货哦</div>
                    <div style="font-size: 11px; margin-top: 6px;">去红宝书进阶篇 👉向右滑动卡片收藏</div>
                </div>
            `;
            return;
        }

        // 4. 防错：确保全局变量 wikiData 存在
        if (typeof wikiData === 'undefined' || !wikiData.length) {
            container.innerHTML = '<div style="text-align:center; padding:40px 0; color:#EF4444;">干货数据加载失败，请刷新重试</div>';
            return;
        }

        // 5. 匹配数据并生成高颜值卡片列表
        const mySavedItems = wikiData.filter(w => savedIds.includes(w.id));
        let listHtml = '';
        
        mySavedItems.forEach(w => {
            const displayDesc = w.desc || w.summary || '';
            listHtml += `
            <div style="background:#FFF; padding:16px; border-radius:16px; margin-bottom:12px; box-shadow:0 2px 8px rgba(0,0,0,0.02); border: 1px solid #F3F4F6;">
                <div style="display:flex; align-items:center; margin-bottom:10px;">
                    <span style="font-size:24px; margin-right:10px;">${w.icon}</span>
                    <div style="font-weight:900; color:#111827; flex:1; font-size:15px;">${w.title}</div>
                    <span style="font-size:10px; color:${w.tagColor || '#3B82F6'}; background:${w.tagColor ? w.tagColor+'1A' : '#EFF6FF'}; padding:4px 8px; border-radius:6px; font-weight:bold;">${w.tag}</span>
                </div>
                <div style="font-size:13px; color:#4B5563; line-height:1.6; margin-bottom:12px;">${displayDesc}</div>
                <div style="font-size:12px; color:#10B981; background:#ECFDF5; padding:10px 12px; border-radius:8px; font-weight:bold;">💡 详细攻略：${w.detailContent || w.details || ''}</div>
            </div>`;
        });

        // 6. 瞬间将 HTML 塞进容器！
        container.innerHTML = listHtml;
    }, // <--- ⚠️ 架构师提醒：注意这个结尾的逗号！如果你这个函数下面还有别的函数，必须保留这个逗号。
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

// ==========================================
// 💅 Pro 级极致紧凑版：强行压缩间距，强制图标标题同行
// ==========================================
renderWikiList(searchQuery = '') {
    // 🌟 1. 全局缝隙压缩器 & 紧凑 UI 补丁
    if (!document.getElementById('proUiPatchSafe')) {
        const style = document.createElement('style');
        style.id = 'proUiPatchSafe'; 
        style.innerHTML = `
            /* 🚀 暴力压缩全局多余的留白 (针对上半部分的雷达、搜索框等) */
            div[style*="margin-bottom: 15px"], 
            div[style*="margin-bottom: 16px"], 
            div[style*="margin-bottom: 20px"],
            div[style*="margin-bottom: 24px"] {
                margin-bottom: 8px !important;
            }
            .search-container, .search-box, .category-tabs { margin-bottom: 8px !important; }

            /* 列表容器极致紧凑 */
            .wiki-grid-container { display: flex !important; flex-direction: column !important; gap: 8px !important; padding: 0 4px !important; }
            .swipe-wrapper { margin-bottom: 0 !important; border-radius: 12px !important; width: 100% !important; position: relative !important; overflow: hidden !important; }
            .swipe-bg { font-size: 12px !important; }
            
            /* 🌟 卡片本体去油瘦身 */
            .pro-wiki-card {
                border-radius: 12px !important; padding: 12px 14px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.03) !important;
                border: 1px solid #F1F5F9 !important; background: #FFF !important; min-height: auto;
                display: flex; flex-direction: column; gap: 6px;
                transition: background 0.2s; cursor: pointer;
            }
            .pro-wiki-card:active { background: #F8FAFC !important; }

            /* 去掉原有的多余边距 */
            .pro-wk-header { display: flex !important; flex-direction: column !important; width: 100% !important; margin: 0 !important; }
            .pro-wk-summary { font-size: 13px !important; color: #64748B !important; line-height: 1.5 !important; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 4px !important;}
            
            /* CSS 折叠引擎 */
            .pro-wk-detail { margin-top: 8px !important; padding-top: 10px !important; border-top: 1px solid #F1F5F9 !important; display: none; }
            .pro-wiki-card.expanded .pro-wk-detail, 
            .pro-wiki-card.open .pro-wk-detail,
            .pro-wiki-card.active .pro-wk-detail { display: flex !important; flex-direction: column !important; }
            
            .pro-wk-step { font-size: 12px !important; color: #475569 !important; line-height: 1.6 !important; margin-bottom: 10px !important; }
            .pro-wk-btn { background: #F8FAFC !important; color: #475569 !important; padding: 8px 0 !important; border-radius: 8px !important; font-size: 12px !important; font-weight: bold !important; text-align: center !important; border: 1px solid #E2E8F0 !important; margin-top: 0 !important; cursor: pointer; }
        `;
        document.head.appendChild(style);
    }

    safeDOM.execute('wikiListContainer', list => {
        list.className = 'wiki-grid-container';
        let html = '';
        
        const deletedData = JSON.parse(localStorage.getItem('hp_wiki_deleted') || '[]'); 
        const savedData = JSON.parse(localStorage.getItem('hp_wiki_saved') || '[]');
        const customWikis = JSON.parse(localStorage.getItem('hp_custom_wikis') || '[]'); 
        
        let rawWikiData = [];
        try { rawWikiData = typeof wikiData !== 'undefined' ? wikiData : []; } catch(e) {}
        const allWikis = [...rawWikiData, ...customWikis];

        let filteredData = allWikis.filter(w => {
            if (!w) return false;
            const cardMode = w.mode || 'advanced';
            const sysMode = typeof currentRbMode !== 'undefined' ? currentRbMode : 'advanced';
            if (cardMode !== sysMode) return false;
            
            if (deletedData.includes(w.id) || savedData.includes(w.id)) return false;
            
            const sysCat = typeof currentRbCategory !== 'undefined' ? currentRbCategory : 'all';
            const catMatch = (sysCat === 'all') ? true : w.category === sysCat;
            
            const sQ = (searchQuery || '').toLowerCase();
            const titleStr = (w.title || '').toLowerCase();
            const descStr = (w.desc || w.summary || '').toLowerCase();
            const searchMatch = titleStr.includes(sQ) || descStr.includes(sQ);
            
            return catMatch && searchMatch;
        });

        if (filteredData.length === 0) { 
            list.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding: 60px 0;">该分类下暂无干货啦！<br><br><span style="font-size:12px; cursor:pointer; color:#10B981; text-decoration:underline;" onclick="localStorage.removeItem(\'hp_wiki_deleted\'); localStorage.removeItem(\'hp_wiki_saved\'); if(window.App && window.App.renderWikiList) window.App.renderWikiList(); else if(typeof renderWikiList === \'function\') renderWikiList();">点我重置所有卡片</span></div>'; 
            return;
        }

        filteredData.forEach(w => {
            let actionHtml = '';
            if (w.postTemplate) {
                const safeTitle = encodeURIComponent(w.postTemplate.title || '').replace(/'/g, "%27");
                const safeContent = encodeURIComponent(w.postTemplate.content || '').replace(/'/g, "%27");
                actionHtml = `
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #E2E8F0;">
                    <button onclick="if(window.App && window.App.quickPost) window.App.quickPost('${w.postTemplate.tab}', '${safeTitle}', '${safeContent}'); event.stopPropagation();" 
                        style="width: 100%; background: linear-gradient(135deg, #111827 0%, #374151 100%); color: #FFF; border: none; padding: 10px; border-radius: 10px; font-size: 12px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(17,24,39,0.15);">
                        🚀 ${w.postTemplate.btnText}
                    </button>
                </div>`;
            }

            const displayDesc = w.desc || w.summary || '';
            const displayDetail = w.detailContent || w.details || '';
            const tagBg = w.tagColor ? `${w.tagColor}1A` : '#FEF3C7';
            const tagColor = w.tagColor ? w.tagColor : '#D97706';
            const safeWikiTitle = (w.title || '').replace(/'/g, "\\'");

            html += `
            <div class="swipe-wrapper" id="swipe_${w.id}">
                <div class="swipe-bg save-bg" style="border-radius: 12px 0 0 12px;">⭐ 收藏</div>
                <div class="swipe-bg delete-bg" style="border-radius: 0 12px 12px 0;">🗑️ 懂了</div>
                
                <div class="wiki-card swipe-front pro-wiki-card" id="front_${w.id}" onclick="if(window.App && window.App.toggleWikiCard) window.App.toggleWikiCard(this); else if(typeof toggleWikiCard === 'function') toggleWikiCard(this);" ontouchstart="if(window.App && window.App.hSwipeStart) window.App.hSwipeStart(event, '${w.id}')" ontouchmove="if(window.App && window.App.hSwipeMove) window.App.hSwipeMove(event, '${w.id}')" ontouchend="if(window.App && window.App.hSwipeEnd) window.App.hSwipeEnd(event, '${w.id}')">
                    
                    <div class="wk-header pro-wk-header">
                        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; width: 100%;">
                            <div style="display: flex; align-items: flex-start; gap: 6px; flex: 1; min-width: 0;">
                                <span style="font-size: 18px; line-height: 1.2; flex-shrink: 0; margin-top: 1px;">${w.icon || '📌'}</span>
                                <span style="font-size: 15px; font-weight: 900; color: #111827; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${w.title}</span>
                            </div>
                            <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; flex-shrink: 0; color:${tagColor}; background:${tagBg}; margin-top: 2px;">${w.tag || '干货'}</span>
                        </div>
                        
                        <div class="wk-summary pro-wk-summary">${displayDesc}</div>
                    </div>
                    
                    <div class="wk-detail pro-wk-detail" onclick="event.stopPropagation()">
                        <div class="wk-step pro-wk-step">${displayDetail}</div>
                        <div class="wk-ugc-btn pro-wk-btn" onclick="if(window.App && window.App.openWikiComments) window.App.openWikiComments('${w.id}', '${safeWikiTitle}'); else if (window.openWikiComments) window.openWikiComments('${w.id}', '${safeWikiTitle}')">💬 查看踩坑情报</div>
                        ${actionHtml}
                    </div>
                    
                </div>
            </div>`;
        });

        html += `<button class="btn-ai-create" onclick="if(window.App && window.App.injectIfNeeded) window.App.injectIfNeeded('aiWikiModal'); document.getElementById('aiWikiModal').style.display='flex'" style="margin-top: 10px; border-radius: 12px;">✨ AI 自动提取长文并录入</button>`;
        
        list.innerHTML = html;
    });
},

    // ==========================================
    // 🌟 原生防弹版：干货区网友评论抽屉弹窗引擎
    // ==========================================
    openWikiComments(wikiId, wikiTitle) {
        window.currentWikiIdForComment = wikiId; 
    currentWikiIdForComment = wikiId;
        
        // 1. 清理旧弹窗防重叠
        const existing = document.getElementById('wikiCommentOverlay');
        if (existing) existing.remove();

        // 2. 创建半透明遮罩
        const overlay = document.createElement('div');
        overlay.id = 'wikiCommentOverlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:99999; display:flex; justify-content:center; align-items:flex-end; backdrop-filter:blur(2px); transition: opacity 0.3s; opacity: 0;';

        // 3. 创建极简风评论抽屉
        const card = document.createElement('div');
        card.style.cssText = 'width:100%; max-width:500px; background:#F9FAFB; border-radius:24px 24px 0 0; display:flex; flex-direction:column; height: 75vh; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);';

        card.innerHTML = `
            <div style="padding: 20px 20px 15px 20px; background:#FFF; border-radius:24px 24px 0 0; border-bottom:1px solid #F3F4F6;">
                <div style="width:40px; height:4px; background:#E5E7EB; border-radius:2px; margin:0 auto 15px auto;"></div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:16px; font-weight:900; color:#111827;">${wikiTitle} 的排雷经验</div>
                    <div id="closeCommentBtn" style="color:#9CA3AF; cursor:pointer; font-size:20px; font-weight:bold; padding:0 10px;">✕</div>
                </div>
            </div>
            <div id="wikiCommentList" style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:20px;">
                </div>
            <div style="padding: 15px 20px; background:#FFF; border-top:1px solid #F3F4F6; display:flex; gap:10px; padding-bottom: max(15px, env(safe-area-inset-bottom));">
                <input type="text" id="wikiCommentInput" placeholder="分享你的避坑或省钱经验..." style="flex:1; padding:12px 16px; border-radius:24px; border:1px solid #E5E7EB; background:#F9FAFB; outline:none; font-size:14px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
                <button onclick="window.App.submitWikiComment()" style="background:#111827; color:#FFF; border:none; padding:0 24px; border-radius:24px; font-weight:bold; cursor:pointer; font-size:14px; box-shadow: 0 4px 10px rgba(17,24,39,0.2);">发送</button>
            </div>
        `;

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        // 4. 动画入场
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });

        // 5. 渲染历史评论
        this.renderWikiComments();

        // 6. 绑定关闭事件
        const close = () => {
            overlay.style.opacity = '0';
            card.style.transform = 'translateY(100%)';
            setTimeout(() => overlay.remove(), 300);
        };
        document.getElementById('closeCommentBtn').addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        
        // 支持回车发送
        document.getElementById('wikiCommentInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitWikiComment();
        });
        if (window.renderWikiComments) {
        window.renderWikiComments(); // 打开弹窗时立刻去云端拉取评论！
    }
    },

  // ==========================================
    // ☁️ 1. 提交评论到 Turso 边缘数据库
    // ==========================================
    async submitWikiComment() {
        const input = document.getElementById('wikiCommentInput');
        if (!input) return;
        const text = input.value.trim();
        
        if (!text) return window.App.showToast ? window.App.showToast("写点什么再发送吧！", "warning") : alert("写点什么吧");

        // 从全局变量读取当前卡片 ID
        const targetId = window.currentWikiIdForComment || (typeof currentWikiIdForComment !== 'undefined' ? currentWikiIdForComment : 'unknown_wiki');
        const userId = localStorage.getItem('hebao_uuid');

        if (!userId) return window.App.showToast ? window.App.showToast("请先登录才能发布情报哦", "warning") : alert("请先登录");

        const btn = event.currentTarget || document.querySelector('#wikiCommentModal button');
        const originalText = btn.innerText;
        btn.innerText = "发送中...";
        btn.style.pointerEvents = 'none';

        try {
            const res = await fetch('/api/add-comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetId: targetId,
                    userId: userId,
                    userName: localStorage.getItem('hp_name') || '热心荷包蛋',
                    userAvatar: localStorage.getItem('hp_real_avatar') || localStorage.getItem('hp_avatar') || '😎',
                    userEmail: localStorage.getItem('hp_email') || '',
                    content: text
                })
            });

            const data = await res.json();
            if (data.success) {
                input.value = ''; // 清空输入框
                if (window.App.showToast) window.App.showToast("✅ 情报发布成功！", "success");
                
                // 🌟 发送成功后，调用当前对象里的方法刷新列表
                if (this.renderWikiComments) this.renderWikiComments();
                else if (window.renderWikiComments) window.renderWikiComments();
            } else {
                throw new Error(data.error);
            }
        } catch(e) {
            console.error(e);
            if (window.App.showToast) window.App.showToast("网络拥堵，发送失败", "error");
        } finally {
            if (btn) {
                btn.innerText = originalText;
                btn.style.pointerEvents = 'auto';
            }
        }
    }, // 👈 注意这里有一个逗号，因为这是对象里的一个方法

    // ==========================================
    // ☁️ 2. 从 Turso 拉取全网真实评论
    // ==========================================
    async renderWikiComments() {
        const listContainer = document.getElementById('wikiCommentList');
        if (!listContainer) return;

        const targetId = window.currentWikiIdForComment || (typeof currentWikiIdForComment !== 'undefined' ? currentWikiIdForComment : null);
        if (!targetId) return;

        // 显示高级的加载动画
        listContainer.innerHTML = '<div style="text-align:center; padding:40px 0; color:#9CA3AF; font-size:12px;">📡 正在连接云端情报局...</div>';

        try {
            const res = await fetch(`/api/get-comments?targetId=${targetId}`);
            const data = await res.json();

            if (data.success) {
                const comments = data.comments;
                if (comments.length === 0) {
                    listContainer.innerHTML = `
                        <div style="text-align:center; padding:60px 0; color:#9CA3AF; font-size:13px;">
                            <div style="font-size:32px; margin-bottom:10px; opacity:0.5;">🛋️</div>
                            沙发空缺中<br>快来分享你的真实踩坑经验吧！
                        </div>`;
                    return;
                }

                let html = '';
                comments.forEach(cmt => {
                    // 动态生成校友徽章
                    const badgeHtml = (window.App && window.App.getUserBadgeHtml) ? window.App.getUserBadgeHtml(cmt.userEmail) : '';
                    
                    const d = new Date(cmt.createdAt + 'Z');
                    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit' });
                    
                    const avatarHtml = cmt.userAvatar.length > 10 
                        ? `<img src="${cmt.userAvatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`
                        : cmt.userAvatar;

                    html += `
                    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                        <div onclick="if(window.App.SocialEngine) window.App.SocialEngine.openUserProfile('${cmt.userId}')" style="width: 36px; height: 36px; border-radius: 18px; background: #F8FAFC; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; cursor: pointer; border: 1px solid #E2E8F0; overflow: hidden;">
                            ${avatarHtml}
                        </div>
                        <div style="flex: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                                <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
                                    <span style="font-size: 14px; font-weight: 900; color: #111827;">${cmt.userName}</span>
                                    ${badgeHtml}
                                </div>
                                <span style="font-size: 11px; color: #9CA3AF; flex-shrink: 0;">${timeStr}</span>
                            </div>
                            <div style="background: #F8FAFC; padding: 10px 14px; border-radius: 4px 16px 16px 16px; font-size: 13px; color: #334155; line-height: 1.6; display: inline-block; border: 1px solid #F1F5F9;">
                                ${cmt.content}
                            </div>
                        </div>
                    </div>`;
                });
                listContainer.innerHTML = html;
                
                // 让滚动条优雅地滚到最底部
                setTimeout(() => {
                    listContainer.scrollTop = listContainer.scrollHeight;
                }, 150);
            }
        } catch (e) {
            console.error(e);
            listContainer.innerHTML = '<div style="text-align:center; padding:30px; color:#EF4444; font-size:12px;">🚨 情报拉取失败，请刷新重试</div>';
        }
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
    // 🌟 原生发音引擎 (Text-to-Speech) - 修复 Chrome 哑巴 Bug 满血版
    window.App.speak = function(text, lang) {
        if ('speechSynthesis' in window) {
            // 1. 暴力唤醒 Chrome 的休眠语音引擎
            window.speechSynthesis.resume();
            
            // 2. 清除队列中的旧语音
            window.speechSynthesis.cancel(); 

            // 3. 用 setTimeout 缓冲 50 毫秒！极其关键！防止 Chrome 误杀新句子
            setTimeout(() => {
                const msg = new SpeechSynthesisUtterance(text);
                msg.lang = lang; // 'nl-NL' 或 'en-US'
                msg.rate = 0.85; // 放慢语速，方便留学生跟读
                
                // 4. 强制为 Chrome 匹配发音人 (解决部分安卓 Chrome 找不到声卡的问题)
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    // 寻找包含 nl 或是 en 的系统发音人
                    const targetVoice = voices.find(v => v.lang.includes(lang) || v.lang.includes(lang.split('-')[0]));
                    if (targetVoice) {
                        msg.voice = targetVoice;
                    }
                }

                // 为了防止安卓 Chrome 偶尔的长句子自动中断 Bug，绑定一个空事件维持存活
                msg.onresume = () => {}; 
                msg.onend = () => {};

                window.speechSynthesis.speak(msg);
            }, 50);
            
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
