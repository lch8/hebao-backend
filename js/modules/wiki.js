// ============================================================================
// js/modules/wiki.js - 红宝书与生存百科引擎 (极度防御版)
// ============================================================================
import { ModalManager } from '../components/modals.js';
import { showToast } from '../core/toast.js';

// 模块级私有变量
let currentRbMode = localStorage.getItem('hp_survival_mode') || 'starter';
let currentRbCategory = 'all';
let currentTaskPhase = 'pre';
let swipeStartX = 0, swipeCurrentX = 0, isSwiping = false;
let isDraggingClickPrevent = false, activeSwipeId = null;
let currentWikiIdForComment = null;
export const WikiEngine = {
    // ------------------------------------------------------------------------
    // 1. 核心模式切换逻辑
    // ------------------------------------------------------------------------
    switchRbMode(mode) {
        try {
            currentRbMode = mode; 
            localStorage.setItem('hp_survival_mode', mode);

            // 防御性移除和添加 active 类
            document.querySelectorAll('.rb-mode-btn').forEach(btn => btn.classList.remove('active'));
            const activeBtn = document.querySelector(`.rb-mode-btn[onclick*="${mode}"]`);
            if(activeBtn) activeBtn.classList.add('active');
            
            // 安全切换各个区块的显示状态
            const toggleDisplay = (id, displayStyle) => {
                const el = document.getElementById(id);
                if(el) el.style.display = displayStyle;
            };

            const mainContainer = document.getElementById('redbookContainer');

            if (mode === 'starter') {
                toggleDisplay('rbStarterMode', 'block'); 
                toggleDisplay('rbWikiMode', 'none'); 
                toggleDisplay('fabGridBtn', 'none');
                if(mainContainer) mainContainer.classList.remove('rb-pro-theme'); 
                this.renderStarterTasks();
            } else {
                toggleDisplay('rbStarterMode', 'none'); 
                toggleDisplay('rbWikiMode', 'block'); 
                
                if (mode === 'advanced') {
                    toggleDisplay('rbWidgetsArea', 'flex');
                    toggleDisplay('proWidgetsArea', 'none');
                    toggleDisplay('safetyCheckWidget', 'block');
                    toggleDisplay('wikiSectionArea', 'block');
                    toggleDisplay('fabGridBtn', 'flex');

                    currentRbCategory = 'all'; 
                    const searchInput = document.getElementById('wikiSearchInput');
                    if(searchInput) searchInput.value = '';
                    this.renderWikiList(); 
                } else if (mode === 'pro') {
                    toggleDisplay('rbWidgetsArea', 'none');
                    toggleDisplay('proWidgetsArea', 'flex');
                    toggleDisplay('safetyCheckWidget', 'none');
                    toggleDisplay('wikiSectionArea', 'none');
                    toggleDisplay('fabGridBtn', 'none');
                }
                
                if(mainContainer) {
                    if(mode === 'pro') mainContainer.classList.add('rb-pro-theme'); 
                    else mainContainer.classList.remove('rb-pro-theme');
                }
            }
        } catch (error) {
            console.error("🚨 [Wiki] 模式切换崩溃拦截:", error);
        }
    },

    // ------------------------------------------------------------------------
    // 2. Tinder 级滑动卡片交互 (极度防误触版)
    // ------------------------------------------------------------------------
    hSwipeStart(e, id) { 
        try {
            swipeStartX = e.touches[0].clientX; 
            isSwiping = true; 
            isDraggingClickPrevent = false; 
            activeSwipeId = id; 
            const frontCard = document.getElementById(`front_${id}`); 
            if(frontCard) frontCard.style.transition = 'none'; 
        } catch(err) {}
    },
    
    hSwipeMove(e, id) {
        try {
            if (!isSwiping || activeSwipeId !== id) return;
            swipeCurrentX = e.touches[0].clientX; 
            const diffX = swipeCurrentX - swipeStartX;
            if (Math.abs(diffX) > 10) isDraggingClickPrevent = true; 
            
            const frontCard = document.getElementById(`front_${id}`); 
            if(frontCard) frontCard.style.transform = `translateX(${diffX}px)`;
            
            const saveBg = document.querySelector(`#swipe_${id} .save-bg`); 
            const deleteBg = document.querySelector(`#swipe_${id} .delete-bg`);
            if (diffX > 0) { 
                if(saveBg) saveBg.style.opacity = Math.min(diffX / 80, 1); 
                if(deleteBg) deleteBg.style.opacity = 0; 
            } else { 
                if(saveBg) saveBg.style.opacity = 0; 
                if(deleteBg) deleteBg.style.opacity = Math.min(Math.abs(diffX) / 80, 1); 
            }
        } catch(err) {}
    },
    
    hSwipeEnd(e, id) {
        try {
            if (!isSwiping || activeSwipeId !== id) return;
            isSwiping = false; 
            const diffX = swipeCurrentX - swipeStartX; 
            const frontCard = document.getElementById(`front_${id}`); 
            if(!frontCard) return;
            
            frontCard.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
            const threshold = window.innerWidth * 0.35;

            if (Math.abs(diffX) > 10) {
                if (diffX > threshold) { 
                    frontCard.style.transform = `translateX(${window.innerWidth}px)`; 
                    setTimeout(() => this.handleWikiAction(id, 'saved'), 300); 
                } else if (diffX < -threshold) { 
                    frontCard.style.transform = `translateX(-${window.innerWidth}px)`; 
                    setTimeout(() => this.handleWikiAction(id, 'deleted'), 300); 
                } else { 
                    frontCard.style.transform = `translateX(0px)`; 
                    this.resetSwipeBg(id); 
                }
            } else { 
                frontCard.style.transform = `translateX(0px)`; 
                this.resetSwipeBg(id); 
            }
            setTimeout(() => { isDraggingClickPrevent = false; activeSwipeId = null; }, 100);
        } catch(err) {}
    },

    resetSwipeBg(id) { 
        const sBg = document.querySelector(`#swipe_${id} .save-bg`); 
        const dBg = document.querySelector(`#swipe_${id} .delete-bg`); 
        if(sBg) sBg.style.opacity = 0; 
        if(dBg) dBg.style.opacity = 0; 
    },

    toggleWikiCard(el) {
        try {
            if (isSwiping || isDraggingClickPrevent) return;
            const transform = window.getComputedStyle(el).transform; 
            const matrix = new WebKitCSSMatrix(transform);
            if (Math.abs(matrix.m41) < 5) el.classList.toggle('open');
        } catch(err) {}
    },

    // ------------------------------------------------------------------------
    // 3. 管家安全盾查询逻辑
    // ------------------------------------------------------------------------
    checkSafetyCode() {
        try {
            const inputEl = document.getElementById('postcodeInput');
            const resultBox = document.getElementById('safetyResult');
            if(!inputEl || !resultBox) return;

            const input = inputEl.value.trim(); 
            if (input.length !== 4) { 
                showToast("请输入准确的4位数字邮编哦！(例如：2512)", "warning"); 
                return; 
            }
            resultBox.style.display = 'block';
            
            const dangerZones = ['2512', '2525', '2526', '3081', '3083', '1102', '1103', '1104', '1062']; 
            const warnZones = ['2521', '2522', '3024', '3025', '1055', '1056'];

            let contentHtml = '';
            if (dangerZones.includes(input)) {
                resultBox.className = 'sc-result danger'; 
                contentHtml = `<b>🔴 高危预警 (复杂街区)：</b><br>该区域历史治安反馈较差，强烈建议避免夜间单独出行，租房避开一楼。`;
            } else if (warnZones.includes(input)) {
                resultBox.className = 'sc-result warn'; 
                contentHtml = `<b>🟡 谨慎区域 (黄灯)：</b><br>人员流动较复杂。自行车极其容易被盗，请务必使用粗链条锁！`;
            } else {
                resultBox.className = 'sc-result safe'; 
                contentHtml = `<b>🟢 治安良好 (绿灯)：</b><br>管家数据库显示该区暂无高频恶性治安反馈，正常生活即可。`;
            }

            resultBox.innerHTML = contentHtml;
        } catch (error) {
            console.error("🚨 [Wiki] 安全盾查询失败:", error);
        }
    },
    
    // 🌟 新增：注入 JIT 逻辑的红宝书评论弹窗
    openWikiComments(wikiId, wikiTitle) {
        try {
            // 1. 🛡️ 核心修复：注入弹窗 HTML
            ModalManager.injectIfNeeded('wikiCommentModal');

            // 2. 填充标题和数据
            currentWikiIdForComment = wikiId;
            const titleEl = document.querySelector('#wikiCommentModal .fm-title');
            if (titleEl) {
                titleEl.innerText = wikiTitle + ' 的评论';
            }
            
            this.renderWikiComments();

            // 3. 打开弹窗
            ModalManager.open('wikiCommentModal');
        } catch (error) {
            console.error("🚨 [Wiki] 评论弹窗渲染失败:", error);
        }
    },

    renderWikiComments() {
        try {
            const list = document.getElementById('wikiCommentList'); 
            if (!list) return;

            const allComments = JSON.parse(localStorage.getItem('hp_wiki_comments') || '{}'); 
            const comments = allComments[currentWikiIdForComment] || [];
            
            if (comments.length === 0) { 
                list.innerHTML = `<div style="text-align:center; color:#9CA3AF; padding:40px 0;">还没有人分享踩坑经验，你来抢沙发吧！</div>`; 
                return; 
            }
            
            let html = '';
            comments.forEach(c => { 
                html += `
                <div class="wc-item">
                    <div class="wc-avatar">${c.avatar}</div>
                    <div class="wc-content">
                        <div class="wc-name"><span>${c.name}</span> <span style="color:#9CA3AF; font-weight:normal;">刚刚</span></div>
                        <div class="wc-text">${c.text}</div>
                    </div>
                </div>`; 
            });
            list.innerHTML = html; 
            list.scrollTop = list.scrollHeight;
        } catch (error) {
            console.error("🚨 [Wiki] 评论渲染失败:", error);
        }
    },

    submitWikiComment() {
        try {
            const input = document.getElementById('wikiCommentInput'); 
            if (!input) return;
            const text = input.value.trim(); 
            if (!text) return showToast("写点什么再发送吧！", "warning");

            const allComments = JSON.parse(localStorage.getItem('hp_wiki_comments') || '{}'); 
            if (!allComments[currentWikiIdForComment]) allComments[currentWikiIdForComment] = [];
            
            // 这里假设头像存在 localStorage 中，没有则用 😎 占位
            allComments[currentWikiIdForComment].push({ 
                name: localStorage.getItem('hp_name') || '管家热心用户', 
                avatar: '😎', 
                text: text 
            });
            
            localStorage.setItem('hp_wiki_comments', JSON.stringify(allComments)); 
            input.value = ''; 
            this.renderWikiComments();
            
            showToast("💡 分享干货，信用分 +2", "success");
        } catch (error) {
            console.error("🚨 [Wiki] 评论提交失败:", error);
        }
    }
};
