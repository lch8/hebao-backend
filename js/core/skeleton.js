// ============================================================================
// js/core/skeleton.js - 骨架屏生成工具
// ============================================================================

const SHIMMER_ID = 'hebao-skeleton-shimmer';

function injectShimmerCSS() {
    if (document.getElementById(SHIMMER_ID)) return;
    const style = document.createElement('style');
    style.id = SHIMMER_ID;
    style.textContent = `
        @keyframes hb-shimmer {
            0%   { background-position: -400px 0; }
            100% { background-position:  400px 0; }
        }
        .hb-skel {
            background: linear-gradient(90deg, #F1F5F9 25%, #E8EDF3 50%, #F1F5F9 75%);
            background-size: 800px 100%;
            animation: hb-shimmer 1.4s ease-in-out infinite;
            border-radius: 6px;
        }
        .hb-skel-card {
            background: #FFF;
            border-radius: 14px;
            border: 1px solid rgba(229,231,235,0.6);
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(17,24,39,0.03);
        }
    `;
    document.head.appendChild(style);
}

// --- 瀑布流闲置卡片骨架（2列） ---
function skeletonWaterfall(count = 6) {
    injectShimmerCSS();
    let html = '';
    for (let i = 0; i < count; i++) {
        const h = i % 3 === 0 ? 160 : i % 3 === 1 ? 130 : 145;
        html += `
        <div class="hb-skel-card" style="break-inside:avoid; margin-bottom:12px;">
            <div class="hb-skel" style="width:100%; height:${h}px; border-radius:0;"></div>
            <div style="padding:10px 12px 12px;">
                <div class="hb-skel" style="height:12px; width:90%; margin-bottom:8px;"></div>
                <div class="hb-skel" style="height:12px; width:60%; margin-bottom:12px;"></div>
                <div class="hb-skel" style="height:18px; width:40%;"></div>
            </div>
        </div>`;
    }
    return `<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:0;">${html}</div>`;
}

// --- 悬赏/搭子列表卡片骨架（2列） ---
function skeletonHelpCards(count = 6) {
    injectShimmerCSS();
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
        <div class="hb-skel-card" style="break-inside:avoid; margin-bottom:10px; padding:11px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <div class="hb-skel" style="height:18px; width:38%; border-radius:6px;"></div>
                <div class="hb-skel" style="height:18px; width:28%; border-radius:6px;"></div>
            </div>
            <div class="hb-skel" style="height:13px; width:95%; margin-bottom:6px;"></div>
            <div class="hb-skel" style="height:13px; width:75%; margin-bottom:10px;"></div>
            <div style="background:#F8FAFC; border-radius:6px; padding:8px; margin-bottom:10px;">
                <div class="hb-skel" style="height:10px; width:80%; margin-bottom:5px;"></div>
                <div class="hb-skel" style="height:10px; width:60%;"></div>
            </div>
            <div style="border-top:1px solid #F3F4F6; padding-top:9px; display:flex; align-items:center; justify-content:space-between;">
                <div style="display:flex; align-items:center; gap:6px;">
                    <div class="hb-skel" style="width:22px; height:22px; border-radius:50%;"></div>
                    <div class="hb-skel" style="height:10px; width:50px;"></div>
                </div>
                <div class="hb-skel" style="height:30px; width:60px; border-radius:10px;"></div>
            </div>
        </div>`;
    }
    return `<div style="column-count:2; column-gap:12px;">${html}</div>`;
}

// --- 消息列表骨架 ---
function skeletonMessages(count = 5) {
    injectShimmerCSS();
    let html = '';
    for (let i = 0; i < count; i++) {
        const w = [55, 70, 45, 65, 50][i % 5];
        html += `
        <div class="hb-skel-card" style="display:flex; align-items:center; gap:14px; padding:14px; margin-bottom:10px;">
            <div class="hb-skel" style="width:50px; height:50px; border-radius:50%; flex-shrink:0;"></div>
            <div style="flex:1;">
                <div style="display:flex; justify-content:space-between; margin-bottom:7px;">
                    <div class="hb-skel" style="height:14px; width:35%;"></div>
                    <div class="hb-skel" style="height:11px; width:18%;"></div>
                </div>
                <div class="hb-skel" style="height:12px; width:${w}%;"></div>
            </div>
        </div>`;
    }
    return html;
}

// --- 我的发布列表骨架 ---
function skeletonMyPosts(count = 3) {
    injectShimmerCSS();
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
        <div class="hb-skel-card" style="margin-bottom:12px; padding:14px;">
            <div style="display:flex; gap:12px; align-items:flex-start;">
                <div class="hb-skel" style="width:64px; height:64px; border-radius:10px; flex-shrink:0;"></div>
                <div style="flex:1;">
                    <div class="hb-skel" style="height:14px; width:80%; margin-bottom:8px;"></div>
                    <div class="hb-skel" style="height:12px; width:55%; margin-bottom:8px;"></div>
                    <div class="hb-skel" style="height:11px; width:35%;"></div>
                </div>
            </div>
            <div style="display:flex; gap:8px; margin-top:12px; padding-top:10px; border-top:1px solid #F3F4F6;">
                <div class="hb-skel" style="height:28px; width:60px; border-radius:10px;"></div>
                <div class="hb-skel" style="height:28px; width:60px; border-radius:10px;"></div>
            </div>
        </div>`;
    }
    return html;
}

// --- 红宝书卡片骨架 ---
function skeletonWikiCards(count = 5) {
    injectShimmerCSS();
    let html = '';
    for (let i = 0; i < count; i++) {
        const sw = [70, 85, 60, 75, 80][i % 5];
        html += `
        <div style="margin-bottom:6px;">
            <div class="hb-skel-card" style="padding:12px 14px;">
                <div style="display:flex; gap:12px; align-items:flex-start;">
                    <div class="hb-skel" style="width:44px; height:44px; border-radius:13px; flex-shrink:0;"></div>
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <div class="hb-skel" style="height:14px; width:55%;"></div>
                            <div class="hb-skel" style="height:16px; width:16%; border-radius:6px;"></div>
                        </div>
                        <div class="hb-skel" style="height:11px; width:${sw}%; margin-bottom:5px;"></div>
                        <div class="hb-skel" style="height:11px; width:${sw - 15}%;"></div>
                    </div>
                </div>
            </div>
        </div>`;
    }
    return html;
}

export const Skeleton = {
    waterfall:  skeletonWaterfall,
    helpCards:  skeletonHelpCards,
    messages:   skeletonMessages,
    myPosts:    skeletonMyPosts,
    wikiCards:  skeletonWikiCards,
};
