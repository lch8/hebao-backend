// ================= 全局状态与鉴权拦截 =================
let userUUID = localStorage.getItem('hebao_uuid');
if (!userUUID) { 
    userUUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) { 
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); 
        return v.toString(16); 
    }); 
    localStorage.setItem('hebao_uuid', userUUID); 
}

let isLoggedIn = localStorage.getItem('hebao_logged_in') === 'true';
let currentPendingAction = null; 

function requireAuth(actionFunction) {
    if (!isLoggedIn) {
        currentPendingAction = actionFunction;
        const modal = document.getElementById('loginModal');
        if (modal) modal.style.display = 'flex';
        else alert("⚠️ 演示模式：请先登录！");
    } else { 
        actionFunction(); 
    }
}

function openLoginModal() { 
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'flex'; 
}

function mockLoginProcess() {
    const btn = document.querySelector('.btn-huge-login');
    if(btn) btn.innerText = '登录中...';
    setTimeout(() => {
        isLoggedIn = true;
        localStorage.setItem('hebao_logged_in', 'true');
        if(!localStorage.getItem('hp_name')) localStorage.setItem('hp_name', '管家新人_' + Math.floor(Math.random()*1000));
        const modal = document.getElementById('loginModal');
        if(modal) modal.style.display = 'none';
        
        if (typeof renderProfileState === 'function') renderProfileState(); 
        
        if (currentPendingAction) { 
            currentPendingAction(); 
            currentPendingAction = null; 
        } else { 
            alert('🎉 登录成功！欢迎来到荷包管家。'); 
        }
    }, 800);
}

// ================= 基础导航与 Tab 切换 =================
function switchTab(tabId, element) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('page-' + tabId);
    if(target) target.classList.add('active');

    document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
    if(element) element.classList.add('active');
}

function switchMarketTab(type, element) {
    document.querySelectorAll('.market-content').forEach(el => el.classList.remove('active'));
    document.getElementById('market-' + type).classList.add('active');

    document.querySelectorAll('.m-tab').forEach(el => el.classList.remove('active'));
    if(element) element.classList.add('active');
}

function openPublishSheet() {
    const overlay = document.querySelector('.publish-overlay');
    const sheet = document.querySelector('.publish-sheet');
    if(overlay) { overlay.style.display = 'block'; setTimeout(()=>overlay.classList.add('show'),10); }
    if(sheet) { setTimeout(()=>sheet.classList.add('show'),10); }
}

function closePublishSheet() {
    const overlay = document.querySelector('.publish-overlay');
    const sheet = document.querySelector('.publish-sheet');
    if(sheet) sheet.classList.remove('show');
    if(overlay) { overlay.classList.remove('show'); setTimeout(()=>overlay.style.display='none',300); }
}

function toggleTipsContent(element) {
    element.classList.toggle('active');
}

// ================= 占位函数 (防止控制台报错) =================
if (typeof loadTrendingToHome !== 'function') { window.loadTrendingToHome = function() {}; }
if (typeof renderProfileState !== 'function') { window.renderProfileState = function() {}; }

// ================= 省钱秘籍渲染 =================
function renderTipsPage() {
    if (typeof quickLinksData !== 'undefined') { 
        let qlHtml = ''; 
        quickLinksData.forEach(link => { 
            qlHtml += `<a href="${link.url}" target="_blank" class="ql-card"><div class="ql-icon">${link.icon}</div><div class="ql-title">${link.title}</div><div class="ql-sub">${link.sub}</div></a>`; 
        }); 
        if(document.getElementById('quickLinksContainer')) document.getElementById('quickLinksContainer').innerHTML = qlHtml; 
    }
    
    if (typeof tipsData !== 'undefined') {
        let accHtml = '';
        tipsData.forEach(cat => {
            const highlightHtml = cat.highlight ? `<span style="background: #FEF2F2; color: #EF4444; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-left: 5px;">${cat.highlight}</span>` : '';
            let storesHtml = '';
            
            cat.stores.forEach(store => {
                let itemsHtml = '';
                store.tips.forEach(tip => {
                    const formattedDesc = tip.desc.replace(/\*\*(.*?)\*\*/g, '<span style="color:#D97706; font-weight:bold; background:#FFFBEB; padding:1px 5px; border-radius:6px; margin:0 2px;">$1</span>');
                    itemsHtml += `<div class="tip-item"><div class="tip-title">${tip.title}</div><div class="tip-desc">${formattedDesc}</div></div>`;
                });
                storesHtml += `<div class="store-card"><div class="store-header" onclick="toggleTipsContent(this)"><div class="s-icon-name"><span class="s-logo">${store.storeLogo}</span>${store.storeName}</div><span class="store-arrow">▼</span></div><div class="store-content"><div class="store-inner">${itemsHtml}</div></div></div>`;
            });
            accHtml += `<div class="tips-accordion"><div class="tips-header" onclick="toggleTipsContent(this)"><div class="tips-title-wrap"><span class="tips-icon">${cat.categoryIcon}</span> <span>${cat.categoryName}</span> ${highlightHtml}</div><span class="tips-arrow">▼</span></div><div class="tips-content"><div class="tips-inner">${storesHtml}</div></div></div>`;
        });
        if(document.getElementById('tipsAccordionContainer')) document.getElementById('tipsAccordionContainer').innerHTML = accHtml;
    }
    
    if (typeof tipsMetaData !== 'undefined' && document.getElementById('tipsDisclaimerContainer')) { 
        document.getElementById('tipsDisclaimerContainer').innerHTML = `<div class="tips-disclaimer"><div style="font-weight:bold; margin-bottom:6px; color:#D97706;"><span>⏳</span> 最后更新于：${tipsMetaData.lastUpdated}</div>⚠️ <b>防杠声明：</b> ${tipsMetaData.disclaimer}</div>`; 
    }
}

// ================= AI 发布闲置逻辑 =================
function openIdlePublish() {
    closePublishSheet();
    setTimeout(() => {
        document.getElementById('publishIdleModal').style.display = 'flex';
        const d = new Date(); d.setDate(d.getDate() + 7);
        document.getElementById('idleDeadline').value = d.toISOString().split('T')[0];
    }, 300);
}

function closeIdlePublish() {
    document.getElementById('publishIdleModal').style.display = 'none';
}

function selectPill(element, groupName) {
    document.querySelectorAll(`#${groupName} .pill`).forEach(el => el.classList.remove('active'));
    element.classList.add('active');
}

function generateAICopy() {
    const keyword = document.getElementById('aiKeywords').value.trim();
    if (!keyword) return alert("请先输入一些闲置关键词哦，比如：大书桌30欧，明天搬家...");
    
    const btn = document.getElementById('btnAiMagic');
    btn.innerText = "⏳ 魔法施展中，管家正在码字...";
    btn.disabled = true;

    const loc = document.getElementById('idleLocation').value;
    const deadline = document.getElementById('idleDeadline').value;
    const bargain = document.querySelector('#bargainGroup .active').innerText;
    const payment = document.querySelector('#paymentGroup .active').innerText;

    setTimeout(() => {
        const aiText = `🌟 【${loc}出】留学生搬家狂甩，骨折价带走！
哈喽家人们！因为临近搬家/回国，实在带不走啦，忍痛割爱出一批超实用的闲置😭！

🛒 【出物清单与价格】
根据您的输入：“${keyword}”
(请在此处补充或修改具体物品状态哦～)

✅ 状态：自用非常爱惜，功能全部完好！
💰 价格：详见清单，多件打包可骨折！
📍 坐标：${loc} (可上门自提)
⏰ 截止日期：务必在 ${deadline} 之前拿走！
💶 交易方式：支持 ${payment}
⚠️ 注意：目前是 ${bargain} 的状态，先到先得，手慢无！

带图私信我，看到了就会秒回！
#荷兰二手 #${loc}闲置 #留学生搬家 #闲置转让 #好物低价出`;

        document.getElementById('idleDesc').value = aiText;
        document.getElementById('aiKeywords').value = '';
        btn.innerText = "✅ 生成成功！快去下方修改细节吧";
        
        setTimeout(() => {
            btn.innerText = "🪄 重新生成";
            btn.disabled = false;
        }, 3000);
    }, 1500);
}

function submitIdlePost() {
    const desc = document.getElementById('idleDesc').value.trim();
    if(!desc) return alert("文案还没写呢！快试试 AI 一键生成吧！");
    alert("🎉 发布成功！你的闲置已经进入集市，等待有缘人。");
    closeIdlePublish();
}

// ================= 私信聊天系统 =================
function openChat(sellerName, sellerAvatar, itemTitle, itemPrice, itemImg, isSold, postType = 'idle') {
    requireAuth(() => {
        document.getElementById('chatTargetName').innerText = sellerName;
        document.getElementById('chatTargetAvatar').innerText = sellerAvatar;
        document.getElementById('chatProductTitle').innerText = itemTitle;
        document.getElementById('chatProductPrice').innerText = '€' + itemPrice;
        document.getElementById('chatProductImg').src = itemImg;
        
        const now = new Date();
        document.getElementById('chatTimeSys').innerText = `今天 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // 动态打招呼内容
        const greetingBox = document.getElementById('chatDefaultGreeting');
        if (postType === 'help') {
            greetingBox.innerText = "哈喽！你是来接悬赏单的吗？看下详情里的时间和地点合适不？";
        } else if (postType === 'partner') {
            greetingBox.innerText = "滴滴！找搭子吗？看我主页MBTI合不合拍~";
        } else {
            greetingBox.innerText = "你好，请问你是想看这个闲置吗？还在的哦！";
        }

        // 已售出状态拦截
        if (isSold) {
            document.getElementById('cpsActionBtn').style.display = 'none';
            document.getElementById('cpsSoldStamp').style.display = 'block';
            document.getElementById('chatInputBar').style.display = 'none';
            document.getElementById('chatInputDisabled').style.display = 'block';
        } else {
            document.getElementById('cpsActionBtn').style.display = 'block';
            document.getElementById('cpsSoldStamp').style.display = 'none';
            document.getElementById('chatInputBar').style.display = 'flex';
            document.getElementById('chatInputDisabled').style.display = 'none';
        }

        document.getElementById('chatModal').style.display = 'flex';
        const msgList = document.getElementById('chatMsgList');
        msgList.scrollTop = msgList.scrollHeight;
    });
}

function closeChat() {
    document.getElementById('chatModal').style.display = 'none';
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if(!text) return;
    
    const msgList = document.getElementById('chatMsgList');
    const savedAvatar = localStorage.getItem('hebao_avatar') || '';
    const avatarHtml = savedAvatar ? `<img src="${savedAvatar}">` : `<span>👻</span>`;
    
    const html = `
    <div class="chat-row me">
        <div class="chat-text">${text}</div>
        <div class="chat-avatar">${avatarHtml}</div>
    </div>`;
    
    msgList.insertAdjacentHTML('beforeend', html);
    input.value = ''; 
    msgList.scrollTop = msgList.scrollHeight; 
    
    setTimeout(() => {
        const replyHtml = `
        <div class="chat-row other">
            <div class="chat-avatar">${document.getElementById('chatTargetAvatar').innerText}</div>
            <div class="chat-text">系统提示：对方可能正在骑车或上课🚴。如果迟迟未回复，可以点击顶部【发送链接】引起对方注意哦。</div>
        </div>`;
        msgList.insertAdjacentHTML('beforeend', replyHtml);
        msgList.scrollTop = msgList.scrollHeight;
    }, 1200);
}


// ================= 集市模块：数据源 =================
const mockIdleItems = [
    { img: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&auto=format&fit=crop", title: "九成新空气炸锅，回国急出", price: "25", priceNum: 25, originalPrice: "€69", avatar: "😎", name: "代村阿强", credit: "极佳", creditClass: "excellent", isSold: false, isBargain: true, timestamp: 1690000000 },
    { img: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=400&auto=format&fit=crop", title: "宜家升降桌，有点小划痕", price: "40", priceNum: 40, originalPrice: "€129", avatar: "👩‍💻", name: "鹿特丹土豆", credit: "良好", creditClass: "good", isSold: true, isBargain: false, timestamp: 1680000000 },
    { img: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&auto=format&fit=crop", title: "RSM 鹿特丹商学院必修课教材", price: "15", priceNum: 15, originalPrice: "€80", avatar: "👻", name: "商科牛马", credit: "极佳", creditClass: "excellent", isSold: false, isBargain: false, timestamp: 1695000000 },
    { img: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400&auto=format&fit=crop", title: "只穿过一次的雪地靴，尺码 38", price: "30", priceNum: 30, originalPrice: "€95", avatar: "🐼", name: "海牙小丸子", credit: "新人", creditClass: "new", isSold: false, isBargain: true, timestamp: 1698000000 }
];

const mockHelpItems = [
    { type: "🚗 史基浦接机", isUrgent: true, title: "明天早上 7点 史基浦接机", reward: "45", rewardNum: 45, date: "明天 (周三) 07:00", location: "Schiphol", avatar: "🐼", name: "海牙小丸子", credit: "新人", creditClass: "new", distKm: 15, timestamp: 1690000000, imgIcon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23EFF6FF'/><text x='50%' y='50%' font-size='20' text-anchor='middle' dominant-baseline='middle'>🚗</text></svg>" },
    { type: "💪 搬家帮手", isUrgent: false, title: "同城搬家，求一位壮汉帮搬两个大箱子", reward: "20", rewardNum: 20, date: "本周六 14:00", location: "Delft (2628CD)", avatar: "😎", name: "代村阿强", credit: "极佳", creditClass: "excellent", distKm: 2.5, timestamp: 1680000000, imgIcon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23FFFBEB'/><text x='50%' y='50%' font-size='20' text-anchor='middle' dominant-baseline='middle'>📦</text></svg>" },
    { type: "🐱 上门喂宠", isUrgent: false, title: "国庆回国一周，求帮忙上门喂两只布偶", reward: "70", rewardNum: 70, date: "10月1日 - 10月7日", location: "Amsterdam Zuid", avatar: "👩‍💻", name: "鹿特丹土豆", credit: "良好", creditClass: "good", distKm: 60, timestamp: 1695000000, imgIcon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23F3F4F6'/><text x='50%' y='50%' font-size='20' text-anchor='middle' dominant-baseline='middle'>🐱</text></svg>" }
];

const mockPartnerItems = [
    { avatar: "👱‍♀️", name: "Esther", gender: "f", mbti: "ENFP", mbtiType: "e", title: "周末有人一起去打卡梵高博物馆吗？", desc: "刚买的博物馆卡，想找个小姐姐周末一起去阿姆看展，看完可以顺便去吃那家很火的日料！", tags: ["🎨 看展", "🍣 约饭", "📸 互拍"], distKm: 12, daysAway: 3, timestamp: 1698000000 },
    { avatar: "👨‍🎓", name: "Jason", gender: "m", mbti: "INTJ", mbtiType: "i", title: "找个TUD图书馆固搭，期末周冲刺", desc: "我是CS研一的，平时比较安静。想找个能在图书馆互卷的搭子，不闲聊，到饭点一起去吃个食堂就行。", tags: ["📚 自习", "🤫 安静", "💻 码农"], distKm: 0.5, daysAway: 1, timestamp: 1699000000 },
    { avatar: "💃", name: "莉莉安", gender: "f", mbti: "ESFP", mbtiType: "e", title: "国王节蹦迪搭子来啦！！", desc: "准备去鹿特丹那个户外音乐节，本人气氛组，找几个放得开的姐妹一起去嗨！男生也可以如果你们也是气氛组的话哈哈！", tags: ["🪩 蹦迪", "👑 国王节", "🍻 喝酒"], distKm: 18, daysAway: 14, timestamp: 1690000000 }
];

// ================= 集市模块：排序与过滤 =================
function toggleFilterPill(element, type) {
    element.classList.toggle('active');
    applyMarketFilters(type);
}

function applyMarketFilters(type) {
    if (type === 'idle') {
        const sortMode = document.getElementById('sortIdle') ? document.getElementById('sortIdle').value : 'newest';
        const onlyBargain = document.getElementById('pillIdleBargain') && document.getElementById('pillIdleBargain').classList.contains('active');
        
        let filtered = [...mockIdleItems];
        if (onlyBargain) filtered = filtered.filter(item => item.isBargain);
        
        if (sortMode === 'priceAsc') filtered.sort((a, b) => a.priceNum - b.priceNum);
        else if (sortMode === 'priceDesc') filtered.sort((a, b) => b.priceNum - a.priceNum);
        else filtered.sort((a, b) => b.timestamp - a.timestamp);
        
        renderMarketIdle(filtered);
    } 
    else if (type === 'help') {
        const sortMode = document.getElementById('sortHelp') ? document.getElementById('sortHelp').value : 'newest';
        const onlyUrgent = document.getElementById('pillHelpUrgent') && document.getElementById('pillHelpUrgent').classList.contains('active');
        
        let filtered = [...mockHelpItems];
        if (onlyUrgent) filtered = filtered.filter(item => item.isUrgent);
        
        if (sortMode === 'rewardDesc') filtered.sort((a, b) => b.rewardNum - a.rewardNum);
        else if (sortMode === 'distAsc') filtered.sort((a, b) => a.distKm - b.distKm);
        else filtered.sort((a, b) => b.timestamp - a.timestamp);
        
        renderMarketHelp(filtered);
    }
    else if (type === 'partner') {
        const sortMode = document.getElementById('sortPartner') ? document.getElementById('sortPartner').value : 'newest';
        const mbtiMode = document.getElementById('filterMBTI') ? document.getElementById('filterMBTI').value : 'all';
        
        let filtered = [...mockPartnerItems];
        if (mbtiMode !== 'all') filtered = filtered.filter(item => item.mbtiType === mbtiMode);
        
        if (sortMode === 'timeAsc') filtered.sort((a, b) => a.daysAway - b.daysAway);
        else if (sortMode === 'distAsc') filtered.sort((a, b) => a.distKm - b.distKm);
        else filtered.sort((a, b) => b.timestamp - a.timestamp);
        
        renderMarketPartner(filtered);
    }
}

// ================= 集市模块：列表渲染 =================
function renderMarketIdle(data = mockIdleItems) {
    const container = document.getElementById('idleWaterfall');
    if(!container) return;
    if(data.length === 0) { container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:40px 0; grid-column:span 2;">没有找到符合条件的闲置~</div>'; return; }
    
    let html = '';
    data.forEach(item => {
        const soldOverlayHtml = item.isSold ? `<div class="wf-sold-overlay"><div class="wf-sold-text">已售出</div></div>` : '';
        html += `
        <div class="waterfall-item" onclick="openChat('${item.name}', '${item.avatar}', '${item.title}', '${item.price}', '${item.img}', ${item.isSold}, 'idle')">
            <div class="wf-img-box">${soldOverlayHtml}<img class="wf-img" src="${item.img}"></div>
            <div class="wf-info">
                <div class="wf-title" style="${item.isSold ? 'color:#9CA3AF;' : ''}">${item.title}</div>
                <div class="wf-price-row">
                    <span class="wf-currency" style="${item.isSold ? 'color:#9CA3AF;' : ''}">€</span><span class="wf-price" style="${item.isSold ? 'color:#9CA3AF;' : ''}">${item.price}</span>
                    ${item.originalPrice ? `<span class="wf-original-price">${item.originalPrice}</span>` : ''}
                </div>
                <div class="wf-user-row">
                    <div class="wf-user"><div class="wf-avatar">${item.avatar}</div><div class="wf-name">${item.name}</div></div>
                    <div class="wf-credit ${item.creditClass}" style="${item.isSold ? 'background:#F3F4F6; color:#9CA3AF;' : ''}">${item.credit}</div>
                </div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function renderMarketHelp(data = mockHelpItems) {
    const container = document.getElementById('helpListContainer');
    if(!container) return;
    if(data.length === 0) { container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:40px 0;">暂时没有符合条件的悬赏单~</div>'; return; }
    
    let html = '';
    data.forEach(item => {
        const tagClass = item.isUrgent ? 'hc-type-tag urgent' : 'hc-type-tag';
        const tagText = item.isUrgent ? `🔥 急 · ${item.type}` : item.type;
        html += `
        <div class="help-card" onclick="openChat('${item.name}', '${item.avatar}', '${item.title}', '${item.reward}', \`${item.imgIcon}\`, false, 'help')">
            <div class="hc-header">
                <div class="hc-title-box"><div class="${tagClass}">${tagText}</div><div class="hc-title">${item.title}</div></div>
                <div class="hc-reward-box"><span class="hc-reward-currency">€</span><span class="hc-reward-num">${item.reward}</span><div class="hc-reward-label">悬赏金</div></div>
            </div>
            <div class="hc-details">
                <div class="hc-detail-item"><span>⏰</span> ${item.date}</div>
                <div class="hc-detail-item"><span>📍</span> ${item.location} (${item.distKm} km)</div>
            </div>
            <div class="hc-footer">
                <div class="hc-user"><div class="hc-avatar">${item.avatar}</div><div class="hc-name">${item.name}</div><div class="wf-credit ${item.creditClass}">${item.credit}</div></div>
                <div class="hc-action-btn">立即私信</div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function renderMarketPartner(data = mockPartnerItems) {
    const container = document.getElementById('partnerListContainer');
    if(!container) return;
    if(data.length === 0) { container.innerHTML = '<div style="text-align:center; color:#9CA3AF; padding:40px 0;">没有找到合适的搭子，自己发一个吧！</div>'; return; }
    
    let html = '';
    data.forEach(item => {
        const genderIcon = item.gender === 'f' ? '♀' : '♂';
        const tagsHtml = item.tags.map(t => `<div class="pc-tag">${t}</div>`).join('');
        const iconSvg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23F3E8FF'/><text x='50%' y='50%' font-size='20' text-anchor='middle' dominant-baseline='middle'>🥂</text></svg>`;
        
        html += `
        <div class="partner-card" onclick="openChat('${item.name}', '${item.avatar}', '${item.title}', '0', \`${iconSvg}\`, false, 'partner')">
            <div class="pc-header">
                <div class="pc-user">
                    <div class="pc-avatar">${item.avatar}</div>
                    <div class="pc-info">
                        <div class="pc-name-row">
                            <span class="pc-name">${item.name}</span>
                            <span class="pc-gender ${item.gender}">${genderIcon}</span>
                        </div>
                        <span class="pc-mbti">${item.mbti}</span>
                    </div>
                </div>
            </div>
            <div class="pc-title">${item.title}</div>
            <div class="pc-desc">${item.desc}</div>
            <div class="pc-tags">${tagsHtml}</div>
            <div class="pc-footer">
                <div class="pc-dist"><span>📍</span> 距你 ${item.distKm} km · ${item.daysAway}天后</div>
                <div class="pc-action">打招呼</div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

// ================= 页面初始化启动器 =================
window.addEventListener('DOMContentLoaded', () => { 
    renderTipsPage(); 
    loadTrendingToHome(); 
    renderProfileState(); 
    
    // 初始化渲染集市三大板块
    renderMarketIdle(); 
    renderMarketHelp();
    renderMarketPartner(); 
});
