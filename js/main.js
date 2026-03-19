// ============================================================================
// js/main.js - 荷包管家核心调度引擎 (霸道修正版)
// ============================================================================
import { ScannerEngine } from './modules/scanner.js';
import { MarketEngine } from './modules/market.js';
import { WikiEngine } from './modules/wiki.js';
import { ChatEngine } from './modules/chat.js';
import { AuthEngine } from './modules/auth.js';
import { TrendingEngine } from './modules/trending.js'; // 🌟 引入刚建好的榜单引擎
import { showToast } from './core/toast.js';
import { ModalManager } from './components/modals.js';
import { safeDOM } from './core/dom.js';
import { ProfileEngine } from './modules/profile.js';
// ============================================================================
// 🎨 UI 界面与强制发布菜单引擎
// ============================================================================
const UIEngine = {
    openModal(modalId, displayStyle = 'flex') {
        ModalManager.injectIfNeeded(modalId);
        safeDOM.execute(modalId, el => {
            // 延迟一帧触发，保证 CSS 动画能正常播出来
            setTimeout(() => el.style.display = displayStyle, 10);
        });
    },
    closeModal(modalId) {
        safeDOM.execute(modalId, el => el.style.display = 'none');
    },
    openPublishSheet() {
        ModalManager.injectIfNeeded('publishSheet');
        // 🌟 终极强制 CSS 注入：无视任何原本的错误，强制将其以最高层级显示！
        safeDOM.execute('publishOverlay', el => {
            el.style.cssText = 'display: block; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 999998;';
        });
        safeDOM.execute('publishSheet', el => {
            el.style.cssText = 'display: block; position: fixed; bottom: 0; left: 0; right: 0; z-index: 999999; background: #fff; padding: 25px 20px; border-radius: 24px 24px 0 0; transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1);';
            // 延迟一帧强制重绘滑出
            setTimeout(() => el.style.transform = 'translateY(0)', 10);
        });
    },
    closePublishSheet() {
        safeDOM.execute('publishOverlay', el => el.style.display = 'none');
        safeDOM.execute('publishSheet', el => {
            el.style.transform = 'translateY(100%)';
            setTimeout(() => el.style.display = 'none', 300);
        });
    },
    openIdlePublish() {
        this.closePublishSheet();
        ModalManager.injectIfNeeded('publishIdleModal');
        safeDOM.execute('publishIdleModal', el => el.style.display = 'flex');
    },
    closeIdlePublish() {
        safeDOM.execute('publishIdleModal', el => el.style.display = 'none');
    },
    goBack() {
        if (window.switchTab) window.switchTab('tips');
    },
    resetApp() {
        if (window.switchTab) window.switchTab('tips');
    },
    handleLogout() {
        localStorage.removeItem('hebao_token');
        localStorage.removeItem('hebao_logged_in');
        localStorage.removeItem('hp_name');
        localStorage.removeItem('hp_email_verified');
        window.location.reload();
    }
};

// ============================================================================
// 🛡️ 极度防御：全局入口挂载 (统领所有引擎)
// ============================================================================
window.App = window.App || {};
window.App.showToast = showToast;
window.App.injectIfNeeded = ModalManager.injectIfNeeded.bind(ModalManager);
window.App.safeDOM = safeDOM;

// 💡 将所有模块不仅挂载到 window.App，还强制挂载到顶级 window 上！
const modulesToBind = [ScannerEngine, MarketEngine, WikiEngine, ChatEngine, AuthEngine, TrendingEngine, UIEngine, ProfileEngine];
modulesToBind.forEach(module => {
    Object.keys(module).forEach(key => {
        if (typeof module[key] === 'function') {
            const boundFunc = module[key].bind(module);
            window.App[key] = boundFunc;
            window[key] = boundFunc; 
        }
    });
});

console.log("🚢 [Hebao Core] 主引擎满血复活，榜单与发布系统就绪！");
// ============================================================================
// 📸 架构师补丁：大总管的扫码/拍照唤起技能
// ============================================================================
window.App.openScanner = function() {
    try {
        // 1. 寻找我们在 index.html 里埋好的隐藏相机输入框
        const fileInput = document.getElementById('packageImgInput');
        
        if (fileInput) {
            // 2. 模拟物理点击，直接唤起原生手机系统相机/相册
            fileInput.click();
            
            // 3. (可选) 如果你希望点开相机时，底层页面直接切到“解析页”，可以加上这句
            // 这样拍完照返回时，直接就能看到扫描动画
            const scanPage = document.getElementById('page-scan');
            if (scanPage) {
                // 隐藏其他所有页面，独显扫描页
                document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
                scanPage.classList.add('active');
            }
        } else {
            // 备用降级方案：如果你用的是二维码插件的弹窗
            if (window.App.openModal) {
                window.App.openModal('scannerModal');
            }
        }
    } catch (error) {
        console.error("🚨 唤起相机失败:", error);
        if (window.App.showToast) window.App.showToast("无法调用相机，请检查权限设置");
    }
};
const originalSwitchRbMode = window.App.switchRbMode; // 保存模块里原有的业务逻辑

window.App.switchRbMode = function(mode) {
    // 1. 先让原系统去老老实实执行业务逻辑（比如渲染任务、加载百科等）
    if (originalSwitchRbMode) {
        originalSwitchRbMode(mode); 
    }
    
    // 2. ✨ 执行完后，强行追加“换衣服”魔法！
    const pageTips = document.getElementById('page-tips');
    if (pageTips) {
        pageTips.classList.remove('theme-starter', 'theme-advanced', 'theme-pro');
        pageTips.classList.add(`theme-${mode}`);
    }
};
// 同步更新给全局变量，防止 HTML 里找不到
window.switchRbMode = window.App.switchRbMode;

// ============================================================================
// 📈 架构师高定补丁：Pro 玩家数据图表渲染引擎
// ============================================================================
let currentProChart = null; // 记录当前的图表实例，防止重叠污染

window.App.showProChart = async function(type) {
    // 1. 先唤起弹窗，并显示加载状态
    window.App.openModal('proChartModal');
    const titleEl = document.getElementById('chartModalTitle');
    const subEl = document.getElementById('chartModalSub');
    
    // 假设你的 canvas ID 叫 proChartCanvas (如果不是，请根据你的 HTML 修改)
    const ctx = document.getElementById('proTrendCanvas'); 
    if (!ctx) return console.error("找不到图表 Canvas 容器！");

    if (titleEl) titleEl.innerText = '📡 正在连接大盘数据...';

    try {
        // 2. 拉取我们刚写好的真实数据 API
        const res = await fetch('/api/get-market');
        const result = await res.json();
        
        if (!result.success) throw new Error("接口返回错误");
        
        const data = result.data;
        let targetLabels, targetData, targetTitle, targetSub, lineColor, bgColor;

        // 3. 根据点击的不同卡片，分配不同的数据和主题色
        if (type === 'exchange') {
            targetLabels = data.exchange.chartLabels;
            targetData = data.exchange.chartData;
            targetTitle = '💶 欧元/人民币 (近14天走势)';
            targetSub = '数据仅供参考，不构成投资建议';
            lineColor = '#EF4444'; // 红色系 (涨跌幅大)
            bgColor = 'rgba(239, 68, 68, 0.1)';
        } else if (type === 'energy') {
            targetLabels = data.energy.chartLabels;
            targetData = data.energy.chartData;
            targetTitle = '⚡️ 荷兰今日电价走势';
            targetSub = '24小时动态电价 (€/kWh)，负数可薅羊毛！';
            lineColor = '#10B981'; // 绿色系 (环保能源)
            bgColor = 'rgba(16, 185, 129, 0.1)';
        } else if (type === 'mortgage') {
            targetLabels = data.mortgage.chartLabels;
            targetData = data.mortgage.chartData;
            targetTitle = '🏠 10年期房贷利率走势';
            targetSub = '近6个月模拟趋势 (%)';
            lineColor = '#F59E0B'; // 橙色系 (稳健)
            bgColor = 'rgba(245, 158, 11, 0.1)';
        }

        // 4. 更新弹窗里的文字标题
        if (titleEl) titleEl.innerText = targetTitle;
        if (subEl) subEl.innerText = targetSub;

        // 5. 销毁旧图表 (极其重要！否则鼠标放上去会疯狂闪烁闪现旧数据)
        if (currentProChart) {
            currentProChart.destroy();
        }

        // 6. 用 Chart.js 画出极其平滑且带底色渐变的绝美曲线
        currentProChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: targetLabels,
                datasets: [{
                    label: '数值',
                    data: targetData,
                    borderColor: lineColor,
                    backgroundColor: bgColor,
                    borderWidth: 3,
                    pointBackgroundColor: '#FFF',
                    pointBorderColor: lineColor,
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true, // 开启下方底色填充，对标你截图里的效果
                    tension: 0.4 // 0.4 是神仙参数，让折线变成丝滑的波浪线
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }, // 隐藏多余的图例
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)', // 黑色高级提示框
                        padding: 10,
                        titleFont: { size: 13 },
                        bodyFont: { size: 14, weight: 'bold' },
                        displayColors: false
                    }
                },
                scales: {
                    x: { grid: { display: false } }, // 隐藏竖向网格线，更清爽
                    y: { 
                        grid: { borderDash: [5, 5] }, // 横向网格线做成虚线
                        ticks: { maxTicksLimit: 6 } 
                    }
                }
            }
        });

    } catch (error) {
        console.error("图表数据加载失败", error);
        if (titleEl) titleEl.innerText = '❌ 数据加载失败，请重试';
    }
};

// js/main.js 里的 market 初始化部分
window.App.initMarketCards = async function() {
    try {
        const res = await fetch('/api/get-market');
        const result = await res.json();
        
        if (result.success && result.data) {
            const data = result.data;
            
            // 🌟 核心修复：使用最新的 HTML ID
            const exEl = document.getElementById('market-exchange');
            if (exEl) {
                const color = data.exchange.change >= 0 ? '#EF4444' : '#10B981';
                const sign = data.exchange.change >= 0 ? '↑' : '↓';
                exEl.innerHTML = `${data.exchange.current} <span style="font-size:12px; color:${color}; margin-left:2px;">${sign}${Math.abs(data.exchange.change)}</span>`;
                exEl.style.color = color;
            }
            
            const enEl = document.getElementById('market-energy');
            if (enEl) enEl.innerText = `€${data.energy.current}`;
            
            const moEl = document.getElementById('market-mortgage');
            if (moEl) moEl.innerText = `${data.mortgage.current}%`;
        }
    } catch (e) {
        console.warn("大盘数据加载跳过（可能不在Pro页面）:", e.message);
    }
};

// ==========================================
// 🌟 自动唤醒大盘卡片：拉取真实数据并渲染外显数字
// ==========================================
window.App.initMarketCards = async function() {
    try {
        const res = await fetch('/api/get-market');
        const result = await res.json();
        
        if (result.success) {
            const data = result.data;
            
            // 1. 自动更新汇率卡片
            const exEl = document.getElementById('market-exchange');
            if (exEl) {
                const sign = data.exchange.change >= 0 ? '↑' : '↓';
                const color = data.exchange.change >= 0 ? '#EF4444' : '#10B981';
                // 拼接当前汇率和涨跌幅 (例如: 7.92 ↑0.02)
                exEl.innerHTML = `${data.exchange.current} <span style="font-size:12px; color:${color}; margin-left:2px;">${sign}${Math.abs(data.exchange.change)}</span>`;
                // 根据涨跌改变主数字颜色
                exEl.style.color = color;
            }
            
            // 2. 自动更新电价卡片
            const enEl = document.getElementById('market-energy');
            if (enEl) enEl.innerText = `€${data.energy.current}`;
            
            // 3. 自动更新房贷卡片
            const moEl = document.getElementById('market-mortgage');
            if (moEl) moEl.innerText = `${data.mortgage.current}%`;
        }
    } catch (e) {
        console.error("加载卡片真实数据失败", e);
    }
};

// ==========================================
// 🌟 纯正荷兰血统：Buienradar 动态天气雷达引擎
// ==========================================
window.App.initWeatherRadar = async function() {
    try {
        const root = document.getElementById('weatherWidgetRoot');
        const icon = document.getElementById('weatherIcon');
        const title = document.getElementById('weatherTitle');
        const status = document.getElementById('weatherStatus');
        if (!root) return;

        // 1. 无感获取城市定位 (通过 IP 静默获取，不弹窗打扰用户)
        let lat = 52.3676, lon = 4.9041, city = '阿姆斯特丹'; 
        try {
            const locRes = await fetch('https://ipapi.co/json/');
            const locData = await locRes.json();
            if (locData.latitude) {
                lat = locData.latitude;
                lon = locData.longitude;
                city = locData.city ? locData.city.substring(0, 4) : '本地'; 
            }
        } catch(e) { console.log('IP定位跳过，使用默认坐标'); }

        title.innerText = `${city} 雷达`;

        // 2. 召唤我们刚才写好的 Buienradar Vercel 接口！
        const weatherRes = await fetch(`/api/get-weather?lat=${lat}&lon=${lon}`);
        const weatherData = await weatherRes.json();
        
        if (weatherData.success && weatherData.isRainingSoon) {
            // 🌧️ 坏天气警报模式：带精确到分钟的 Buienradar 预测
            root.style.background = '#EFF6FF'; 
            root.style.borderColor = '#BFDBFE';
            // 如果是大雨，图标变电闪雷鸣
            icon.innerText = weatherData.rainLevel >= 3 ? '⛈️' : '🌧️';
            
            status.innerText = `🔴 ${weatherData.rainMsg}`;
            status.style.color = '#DC2626';
            status.style.background = '#FEE2E2';
        } else {
            // 🌤️ 放心骑模式
            root.style.background = '#FFF';
            root.style.borderColor = '#F3F4F6';
            icon.innerText = '🌤️';
            status.innerText = '🟢 放心骑 (未来2h无雨)';
            status.style.color = '#10B981';
            status.style.background = '#ECFDF5';
        }

    } catch (error) {
        console.error("雷达连接失败", error);
        const title = document.getElementById('weatherTitle');
        if(title) title.innerText = 'Buienradar (连接中)';
    }
};

setTimeout(() => {
    if (window.App.initWeatherRadar) window.App.initWeatherRadar();
}, 800);

// 页面加载完毕后，延迟 300 毫秒静默获取数据，不卡顿页面
setTimeout(() => {
    if (window.App.initMarketCards) {
        window.App.initMarketCards();
    }
}, 300);

// ==========================================
// 🛡️ 治安避雷针：Politie警察局直连 + 云端定位 + 实时投票
// ==========================================
window.App.currentCheckCode = '';

// 📍 新增功能：GPS 无感逆向解析荷兰邮编
window.App.locatePostcode = function() {
    const input = document.getElementById('postcodeInput');
    if (!("geolocation" in navigator)) return alert("当前设备不支持定位功能");
    
    input.placeholder = "📡 正在请求卫星定位...";
    input.value = "";
    
    navigator.geolocation.getCurrentPosition(async position => {
        try {
            const { latitude, longitude } = position.coords;
            // 使用开源地图接口逆向解析 GPS 坐标
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
            const data = await res.json();
            if (data && data.address && data.address.postcode) {
                // 荷兰邮编通常为 "1234 AB"，截取前四位
                const code = data.address.postcode.substring(0, 4);
                input.value = code;
                input.placeholder = "输入荷兰4位邮编 (如: 2512)";
                window.App.checkSafetyCode(); // 自动执行查询
            } else {
                alert("位置解析失败，请手动输入邮编");
                input.placeholder = "输入荷兰4位邮编 (如: 2512)";
            }
        } catch(e) { 
            alert("定位服务连接失败"); 
            input.placeholder = "输入荷兰4位邮编 (如: 2512)";
        }
    }, () => { 
        alert("请允许浏览器获取位置权限"); 
        input.placeholder = "输入荷兰4位邮编 (如: 2512)";
    });
};

// 🔍 查询功能：直连 Vercel 后端获取警局与投票双重数据
window.App.checkSafetyCode = async function() {
    const input = document.getElementById('postcodeInput');
    const code = input.value.trim();
    if(!code || code.length !== 4 || isNaN(code)) return window.App.showToast ? window.App.showToast("请输入 4 位数字邮编", "warning") : alert("请输入4位数字邮编");

    window.App.currentCheckCode = code;
    const resultArea = document.getElementById('safetyResultArea');
    const content = document.getElementById('safetyResultContent');
    
    // 显示加载状态
    content.innerHTML = `<div style="text-align:center; font-size:12px; padding:15px; color:#6B7280; display:flex; flex-direction:column; align-items:center; gap:8px;"><span style="font-size:24px; animation: pulse 1s infinite;">📡</span>正在连接荷兰警局 Politie.nl <br> 与全网留学生评价库...</div>`;
    resultArea.style.display = 'block';

    try {
        const res = await fetch(`/api/safety?code=${code}`);
        const data = await res.json();
        
        if (!data.success) throw new Error("API返回错误");

        // 1. 处理官方警情通报
        let policeHtml = '';
        if (data.policeIncidents > 0) {
            let newsList = data.policeNews.map(n => `<div style="margin-top:6px; font-weight:normal; font-size:12px;">🚨 ${n}</div>`).join('');
            policeHtml = `
            <div style="padding: 12px 14px; background: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 4px 8px 8px 4px; color: #B91C1C; margin-bottom:12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="font-size: 14px; font-weight: 900; margin-bottom:4px;">👮‍♂️ Politie 警局案底警告</div>
                <div style="font-size: 12px;">近期该区域有 <b>${data.policeIncidents}</b> 起严重警情通报：</div>
                ${newsList}
            </div>`;
        } else {
            policeHtml = `
            <div style="padding: 12px 14px; background: #F0FDF4; border-left: 4px solid #10B981; border-radius: 4px 8px 8px 4px; color: #065F46; font-size:14px; font-weight:900; margin-bottom:12px;">
                🟢 警局档案清白：近期无恶性案件通报
            </div>`;
        }

        // 2. 处理 UGC 全网投票数据
        let ugcHtml = '';
        // 🌟 核心修复：强制转换为数字 (Number)，彻底消灭 '0'+'2'+'0'='020' 的字符串拼接 Bug！
        const safeCount = Number(data.votes.safe) || 0;
        const warningCount = Number(data.votes.warning) || 0;
        const dangerCount = Number(data.votes.danger) || 0;
        const totalVotes = safeCount + warningCount + dangerCount;
        if (totalVotes > 0) {
            const safePct = Math.round((data.votes.safe / totalVotes) * 100);
            const dangerPct = Math.round((data.votes.danger / totalVotes) * 100);
            ugcHtml = `
                <div style="font-size: 12px; color: #4B5563; background: #F8FAFC; padding: 10px 12px; border-radius: 8px; display: flex; align-items: center; gap: 8px; border: 1px solid #E5E7EB;">
                    <span style="font-size: 16px;">📊</span>
                    <div>全网 <b>${totalVotes}</b> 位荷包蛋打分，<b style="color:#10B981;">${safePct}%</b> 认为安全，<b style="color:#EF4444;">${dangerPct}%</b> 提示危险。</div>
                </div>`;
        } else {
            ugcHtml = `<div style="font-size: 11px; color: #9CA3AF; text-align: right;">* 暂无荷包蛋评价，快来投下第一票！</div>`;
        }

        content.innerHTML = policeHtml + ugcHtml;

    } catch (error) {
        content.innerHTML = `<div style="color:#EF4444; font-size:12px; text-align:center;">数据加载失败，请检查网络或刷新重试。</div>`;
    }
};

// 🙋‍♂️ 投票功能：同步到云端数据库，实现多设备共享
window.App.voteSafety = async function(type) {
    const code = window.App.currentCheckCode;
    if(!code) return;

    // 前端防刷机制
    const votedObj = JSON.parse(localStorage.getItem('hp_voted_codes') || '{}');
    if (votedObj[code]) {
        return window.App.showToast ? window.App.showToast("你已经为该街区投过票啦！", "warning") : alert("已经投过票啦");
    }

    try {
        // 向 Vercel 接口发送全局投票
        await fetch('/api/safety', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'vote', code: code, type: type })
        });

        // 记录本地，防止重复投
        votedObj[code] = true; 
        localStorage.setItem('hp_voted_codes', JSON.stringify(votedObj));

        if(window.App.showToast) window.App.showToast("✅ 投票成功！已同步至云端数据库", "success");
        
        // 自动刷新数据，让用户立刻看到自己投的那一票
        window.App.checkSafetyCode(); 
    } catch(e) {
        console.error("投票失败", e);
    }
};
// ==========================================
// 🚀 一键发帖联动引擎 (从攻略卡片直达社区集市)
// ==========================================
window.App.quickPost = function(tab, encodedTitle, encodedContent) {
    // 1. 调用底部的发布按钮事件，展开你的发布界面
    if (window.App.openPublishSheet) {
        window.App.openPublishSheet();
    } else {
        alert("发布模块正在加载中...");
        return;
    }

    // 2. 解密文本 (防止回车符、引号把代码搞崩溃)
    const title = decodeURIComponent(encodedTitle);
    const content = decodeURIComponent(encodedContent);

    // 3. 延迟 400 毫秒，等待发布弹窗的 HTML 彻底渲染完毕
    setTimeout(() => {
        // 💡 注意：这里的 ID (publishType, publishTitle) 需要和你真实发布弹窗里的 input/select ID 一致！
        // 如果你的 ID 叫别的名字，请在这里改一下。
        
        const typeSelect = document.getElementById('publishType'); // 分类下拉框
        if (typeSelect) {
            typeSelect.value = tab; 
            typeSelect.dispatchEvent(new Event('change')); // 触发切换事件
        }

        const titleInput = document.getElementById('publishTitle'); // 标题输入框
        if (titleInput) {
            titleInput.value = title;
            titleInput.dispatchEvent(new Event('input'));
        }

        const contentInput = document.getElementById('publishContent'); // 正文文本域
        if (contentInput) {
            contentInput.value = content;
            contentInput.dispatchEvent(new Event('input'));
        }

        // 弹出一个极其舒服的用户提示
        if (window.App.showToast) {
            window.App.showToast("✨ 模板已加载，请补充【括号】里的时间地点！", "success");
        }
    }, 400);
};
// ==========================================
// 🗺️ 新手村主线任务引擎 (iOS 极简风)
// ==========================================

window.App.currentTaskPhase = 'pre'; 

// 1. 丝滑切换 Tab 效果
window.App.switchTaskPhase = function(phase) {
    window.App.currentTaskPhase = phase;
    ['pre', 'day7', 'month1'].forEach(p => {
        const el = document.getElementById('tab_' + p);
        if(el) {
            if(p === phase) {
                el.style.background = '#FFF';
                el.style.color = '#0F172A';
                el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            } else {
                el.style.background = 'transparent';
                el.style.color = '#64748B';
                el.style.boxShadow = 'none';
            }
        }
    });
    window.App.renderStarterTasks();
};

// 2. 核心任务数据与绝美渲染
window.App.renderStarterTasks = function() {
    const list = document.getElementById('starterTaskList');
    if(!list) return;

    // 🏆 留学生真实避雷通关数据
    const tasksData = {
        pre: [
            { id: 't1', title: '核心文件随身带', desc: '护照、MVV签证信、录取通知书、出生双认证。放随身包，万一行李丢了也能办手续！', actionBtn: '👉 护照包推荐', actionLink: '#' },
            { id: 't2', title: '提前预约市政厅 (Gemeente)', desc: '落地再约可能要等一个月！没有 BSN 号不能办银行卡，在国内就要提前抢号。', actionBtn: '🔗 直达市政厅', actionLink: '#' },
            { id: 't3', title: '下载并注册 NS App', desc: '荷兰火车必备，提前注册好账号，落地就能买电子票。' }
        ],
        day7: [
            { id: 't4', title: '办理个人 OV-chipkaart', desc: '去官网传照片办黄色的实名卡，配合 NS Flex 才能享受非高峰期 6 折。', actionBtn: '🔗 去办卡', actionLink: '#' },
            { id: 't5', title: '市政厅注册拿 BSN', desc: '带齐租房合同和双认证，注册后 1-2 周内会把 BSN 号码邮寄到你家信箱。' },
            { id: 't6', title: '开通荷兰银行卡 (ABN / ING)', desc: '拿到 BSN 后立刻去开卡。平时付钱认准 iDEAL 标志。' }
        ],
        month1: [
            { id: 't7', title: '注册家庭医生 (Huisarts)', desc: '荷兰看病必须先找家庭医生，诊所名额极其有限，必须就近立刻抢注！' },
            { id: 't8', title: '买医疗保险 (Zorgverzekering)', desc: '法律规定落地 4 个月内必须买医保，打工同学买 Basic，全职学生买 AON。' },
            { id: 't9', title: '申请各类补贴 (Toeslag)', desc: '符合条件即可每月白领大几百欧的租房补贴和医疗补贴！' }
        ]
    };

    const tasks = tasksData[window.App.currentTaskPhase] || [];
    const completedTasks = JSON.parse(localStorage.getItem('hp_completed_tasks') || '[]');
    
    let html = '';
    let completedCount = 0;

    tasks.forEach(t => {
        const isDone = completedTasks.includes(t.id);
        if(isDone) completedCount++;

        // 状态变色龙逻辑
        const circleColor = isDone ? '#10B981' : '#CBD5E1';
        const circleFill = isDone ? '#10B981' : 'transparent';
        const checkMark = isDone ? `<span style="color:white; font-size:14px; margin-top:2px;">✓</span>` : '';
        const titleColor = isDone ? '#9CA3AF' : '#111827';
        const titleStrike = isDone ? 'line-through' : 'none';

        // 精致的内嵌 Tag (取代原来的大笨按钮)
        let actionHtml = '';
        if(t.actionBtn && !isDone) {
            actionHtml = `
            <div style="margin-top: 10px;">
                <span onclick="event.stopPropagation(); window.App.showToast('链接跳转即将开放...')" style="background: #EFF6FF; color: #2563EB; font-size: 11px; font-weight: 900; padding: 4px 10px; border-radius: 6px; border: 1px solid #BFDBFE;">${t.actionBtn}</span>
            </div>`;
        }

        html += `
        <div onclick="window.App.toggleTask('${t.id}')" style="background: #FFF; border-radius: 16px; padding: 16px; margin-bottom: 12px; display: flex; gap: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.02); border: 1px solid #F3F4F6; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; ${isDone ? 'opacity: 0.6;' : ''}">
            
            <div style="flex-shrink: 0; padding-top: 2px;">
                <div style="width: 22px; height: 22px; border-radius: 50%; border: 2px solid ${circleColor}; background: ${circleFill}; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                    ${checkMark}
                </div>
            </div>
            
            <div style="flex: 1;">
                <div style="font-size: 15px; font-weight: 900; color: ${titleColor}; margin-bottom: 4px; text-decoration: ${titleStrike}; transition: all 0.2s;">${t.title}</div>
                <div style="font-size: 13px; color: #64748B; line-height: 1.5;">${t.desc}</div>
                ${actionHtml}
            </div>
        </div>`;
    });

    list.innerHTML = html;

    // 酷炫的进度条动画连动
    const progressPct = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);
    const pb = document.getElementById('taskProgressBar');
    const pt = document.getElementById('taskProgressText');
    if(pb) pb.style.width = progressPct + '%';
    if(pt) {
        pt.innerText = `${completedCount}/${tasks.length}`;
        pt.style.color = completedCount === tasks.length ? '#10B981' : '#111827';
    }
};

// 3. 丝滑的打勾音效与反馈
window.App.toggleTask = function(id) {
    let completedTasks = JSON.parse(localStorage.getItem('hp_completed_tasks') || '[]');
    if(completedTasks.includes(id)) {
        completedTasks = completedTasks.filter(item => item !== id); // 取消勾选
    } else {
        completedTasks.push(id); // 勾选
        if(window.App.showToast) window.App.showToast('🎉 阶段任务 +1', 'success');
    }
    localStorage.setItem('hp_completed_tasks', JSON.stringify(completedTasks));
    window.App.renderStarterTasks(); // 重新渲染触发动画
};

// 延迟 500ms 自动渲染首页任务
setTimeout(() => { if(window.App.renderStarterTasks) window.App.renderStarterTasks(); }, 500);


// ============================================================================
// 🚀 全局启动器 (确保所有页面一打开就有数据！)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        try {
            if (window.App.switchRbMode) window.App.switchRbMode(localStorage.getItem('hp_survival_mode') || 'starter');
            
            // 🌟 强制拉取四大金刚的数据！
            if (window.App.loadTrendingData) window.App.loadTrendingData(); 
            if (window.App.loadCommunityPosts) window.App.loadCommunityPosts(); 
            if (window.App.loadConversations) window.App.loadConversations();
            // 在你的 DOMContentLoaded 或各种 Engine 绑定完毕之后，加上这句：
if (window.App && window.App.startGlobalPolling) {
    window.App.startGlobalPolling();
}
            
            console.log("🚢 [Hebao Core] 所有后台数据引擎已启动！");
        } catch(e) { 
            console.error("🚨 启动时发生错误:", e); 
        }
    }, 100); // 延迟 0.1 秒，等待 DOM 完全渲染
});
