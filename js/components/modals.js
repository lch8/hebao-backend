// ============================================================================
// js/components/modals.js - 极致防御的 JIT 动态弹窗引擎
// ============================================================================
import { showToast } from '../core/toast.js';

// 📦 模板库：存放所有被从 index.html 抽离的巨无霸弹窗
const ModalTemplates = {
    // --- 1. 发布底部菜单 ---
    publishSheet: `
        <div class="publish-overlay" id="publishOverlay" onclick="window.App ? window.App.closePublishSheet() : closePublishSheet()"></div>
        <div class="publish-sheet" id="publishSheet">
            <div class="ps-close" onclick="window.App ? window.App.closePublishSheet() : closePublishSheet()">✕</div>
            <div class="ps-title">你想发点什么？</div>
            <div class="ps-options" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="ps-opt ps-opt-1" onclick="openIdlePublish()">
                    <div class="ps-icon">📦</div>
                    <div class="ps-text">卖闲置</div><div class="ps-sub">回血清仓</div>
                </div>
                <div class="ps-opt ps-opt-2" onclick="openHelpPublish()">
                    <div class="ps-icon">🤝</div>
                    <div class="ps-text">发悬赏</div><div class="ps-sub">花钱求助</div>
                </div>
                <div class="ps-opt ps-opt-3" onclick="openPartnerPublish()">
                    <div class="ps-icon">🥂</div>
                    <div class="ps-text">找搭子</div><div class="ps-sub">灵魂共鸣</div>
                </div>
                <div class="ps-opt" onclick="openQuestionPublish()" style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 16px; padding: 15px; text-align: center; cursor: pointer;">
                    <div class="ps-icon" style="font-size: 32px; margin-bottom: 5px;">🙋</div>
                    <div class="ps-text" style="font-size: 15px; font-weight: 900; color: #16A34A;">提个问题</div><div class="ps-sub" style="font-size: 11px; color: #22C55E;">校友热心解答</div>
                </div>
            </div>
        </div>
    `,

    // --- 2. 登录/注册弹窗 ---
    loginModal: `
        <div class="modal-overlay" id="loginModal" style="display: none; z-index: 4000;">
            <div class="modal-content" style="text-align: center;">
                <div class="modal-close" onclick="document.getElementById('loginModal').style.display='none'">✕</div>
                <h3 style="margin-top:0;">🔐 身份认证</h3>
                <p style="font-size: 13px; color: #6B7280; margin-bottom: 20px;">为了保证社区真实互助，发布前需验证邮箱。</p>
                <input type="email" id="hebaoAuthEmail" class="search-input" placeholder="输入您的邮箱地址 (推荐校园或工作邮箱)" style="width: 100%; box-sizing: border-box; margin-bottom: 15px; text-align: center;">
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <input type="text" id="authCode" class="search-input" placeholder="6位验证码" style="width: 60%; text-align: center; letter-spacing: 2px;">
                    <button id="btnSendCode" class="action-btn" style="width: 40%; background: #F3F4F6; color: #374151; font-size: 13px; border: 1px solid #E5E7EB;" onclick="sendAuthCode()">获取验证码</button>
                </div>
                <button id="btnVerifyLogin" class="action-btn" style="width: 100%;" onclick="verifyEmailCode()">立即验证</button>
            </div>
        </div>
    `,

    // --- 3. 编辑资料弹窗 ---
    editProfileModal: `
        <div class="modal-overlay" id="editProfileModal" onclick="this.style.display='none'">
            <div class="modal-content" onclick="event.stopPropagation()" style="max-height: 85vh; overflow-y: auto;">
                <div class="modal-close" onclick="document.getElementById('editProfileModal').style.display='none'">✕</div>
                <h3 style="margin-top:0; color: #111827; margin-bottom: 20px;">✏️ 完善你的数字名片</h3>
                <div class="edit-form-row"><div class="edit-label">管家昵称</div><input type="text" id="epName" class="modal-input" placeholder="给别人留下深刻印象~"></div>
                <div style="display: flex; gap: 10px;">
                    <div class="edit-form-row" style="flex:1;"><div class="edit-label">性别</div><select id="epGender" class="modal-input"><option value="保密">保密</option><option value="男 ♂">男 ♂</option><option value="女 ♀">女 ♀</option></select></div>
                    <div class="edit-form-row" style="flex:1;"><div class="edit-label">MBTI <span class="edit-score-tag">+30 分</span></div><select id="epMbti" class="modal-input"><option value="">未填写</option><option value="INTJ">INTJ 建筑师</option><option value="INFP">INFP 调停者</option><option value="ENTJ">ENTJ 指挥官</option><option value="ENFP">ENFP 竞选者</option><option value="ISFJ">ISFJ 守卫者</option><option value="ESFJ">ESFJ 执政官</option></select></div>
                </div>
                <div class="edit-form-row"><div class="edit-label">微信号 (安全) <span class="edit-score-tag">必填</span></div><input type="text" id="epWechat" class="modal-input" placeholder="仅在交易/搭子确认后对Ta可见"></div>
                <div class="edit-form-row"><div class="edit-label">一句话签名 / 自我介绍</div><textarea id="epBio" class="modal-textarea" style="height: 80px;" placeholder="你是什么样的人？找什么样的搭子？"></textarea></div>
                <button style="width: 100%; padding: 14px; background: #111827; color: #FFF; border: none; border-radius: 12px; font-weight: bold; margin-top: 10px; cursor:pointer;" onclick="saveProfileData()">💾 保存并计算信用分</button>
            </div>
        </div>
    `,

    // --- 4. 信用分说明弹窗 ---
    creditInfoModal: `
        <div class="modal-overlay" id="creditInfoModal" onclick="this.style.display='none'">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-close" onclick="document.getElementById('creditInfoModal').style.display='none'">✕</div>
                <h3 style="margin-top:0; color: #111827; display:flex; align-items:center; gap:8px;">🛡️ 什么是管家信用分？</h3>
                <div style="font-size: 14px; color: #4B5563; line-height: 1.7;">
                    <p>为了打造<b>荷兰最安全的留学生互助社区</b>，我们引入了严格的信用体系。</p>
                    <p><b>✨ 信用分有什么用？</b><br>• 分数越高，曝光率越高！<br>• 信用极佳的用户将拥有专属徽章，买家更敢先款购买。</p>
                    <p><b>📈 如何获取分数？</b><br>初始 500 分。通过设置头像 (+20)、完善 MBTI (+30)、验证大学邮箱 (+50) 自动上涨。</p>
                </div>
                <button style="width: 100%; padding: 14px; background: #111827; color: #FFF; border: none; border-radius: 14px; font-weight: bold; margin-top: 15px; cursor:pointer;" onclick="document.getElementById('creditInfoModal').style.display='none'">我明白了</button>
            </div>
        </div>
    `,

    // --- 5. 添加评价弹窗 ---
    addReviewModal: `
        <div class="modal-overlay" id="addReviewModal" onclick="this.style.display='none'">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-close" onclick="document.getElementById('addReviewModal').style.display='none'">✕</div>
                <h3 style="margin-top:0; color: #111827;">发表你的锐评</h3>
                <select id="reviewAttitude" class="modal-input" style="background:#F9FAFB; margin-bottom:10px;"><option value="👍 推荐">👍 疯狂安利 (种草)</option><option value="💣 拔草">💣 难吃/巨坑 (避雷)</option></select>
                <textarea id="reviewText" class="modal-textarea" placeholder="这玩意到底好不好用？写下你的真实评价，帮大家避坑！"></textarea>
                <button id="btnSubmitReview" style="width: 100%; padding: 14px; background: #10B981; color: #FFF; border: none; border-radius: 12px; font-weight: bold; margin-top: 15px; cursor:pointer;" onclick="submitDetailReview()">🚀 提交评价</button>
            </div>
        </div>
    `,

    // --- 6. 扫码摄像头容器 ---
    scannerModal: `
        <div id="scannerModal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:#000; z-index:9999; flex-direction:column;">
            <div style="padding: 15px 20px; display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.8); color:#FFF; z-index: 10;">
                <span style="font-weight:900; font-size:16px;">对准商品条形码</span>
                <button onclick="closeScanner()" style="background:none; border:none; color:#FFF; font-size:24px; cursor:pointer;">✕</button>
            </div>
            <div id="reader" style="width:100%; flex:1; background:#000;"></div>
        </div>
    `,

    // --- 7. 邮箱验证弹窗 ---
    emailVerifyModal: `
        <div class="modal-overlay" id="emailVerifyModal">
            <div class="modal-content">
                <div class="modal-close" onclick="document.getElementById('emailVerifyModal').style.display='none'">✕</div>
                <div style="font-size:18px; font-weight:900; margin-bottom:10px;">🎓 邮箱认证</div>
                <div style="font-size:12px; color:#6B7280; margin-bottom:15px; line-height: 1.5;">如果需要认证大学标签，请在“一键登录/注册”弹窗中使用 .edu/.nl 邮箱登录哦。</div>
                <button class="btn-huge-login" style="width:100%; margin-top:20px; padding:12px;" onclick="document.getElementById('emailVerifyModal').style.display='none'; document.getElementById('loginModal').style.display='flex'">去登录/重新绑定</button>
            </div>
        </div>
    `,

    // --- 8. 微信绑定弹窗 ---
    wechatBindModal: `
        <div class="modal-overlay" id="wechatBindModal">
            <div class="modal-content">
                <div class="modal-close" onclick="document.getElementById('wechatBindModal').style.display='none'">✕</div>
                <div style="font-size:18px; font-weight:900; margin-bottom:10px;">💬 绑定微信</div>
                <div style="font-size:12px; color:#6B7280; margin-bottom:15px; line-height: 1.5;">绑定后，买家在与您私信时可以一键复制微信号，大幅提高沟通效率！</div>
                <input type="text" id="authWechatInput" class="modal-input" placeholder="请输入准确的微信号">
                <button class="btn-huge-login" style="width:100%; margin-top:20px; padding:12px; background:#10B981;" onclick="saveWechatBind()">✅ 安全绑定</button>
            </div>
        </div>
    `,

    // --- 9. 闲置发布巨物弹窗 ---
    publishIdleModal: `
        <div class="full-modal" id="publishIdleModal" style="display: none;">
            <div class="fm-header">
                <div class="fm-close" onclick="closeIdlePublish()">✕</div>
                <div class="fm-title">发布闲置</div>
                <div class="fm-submit" onclick="submitIdlePost()">发布</div>
            </div>
            <div class="fm-content">
                <div class="upload-img-box" style="flex-direction: column; align-items: flex-start; gap: 8px; background: transparent; border: none; padding: 0; margin-top: 5px;">
                    <input type="file" id="idleImgInput" accept="image/*" multiple style="display: none;" onchange="handleMultiImageSelect(event)">
                    <div class="multi-img-container-vertical" id="idleImgPreviewContainer">
                        <div class="upload-btn" onclick="document.getElementById('idleImgInput').click()" style="width: 100%; background: #FFF; border: 1px dashed #D1D5DB;">
                            <span style="font-size: 24px;">📷</span>
                            <span style="font-size: 13px; font-weight: bold; margin-left: 8px; color: #374151;">添加闲置物品照片</span>
                        </div>
                    </div>
                    <div style="font-size: 11px; color: #9CA3AF; margin-bottom: 5px;">*可上传多图并分别标价，管家会自动打上价格水印哦</div>
                </div>
                <input type="hidden" id="idlePrice" value="">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; margin-bottom: 15px; border-top: 1px dashed #E5E7EB; padding-top: 20px;">
                    <div class="fm-section-title" style="margin: 0;">核心交易条件</div>
                    <div class="ai-magic-micro">
                        <input type="text" id="aiKeywords_idle" placeholder="语音填表..." onkeypress="if(event.key==='Enter') generateAICopy('idle')">
                        <button class="voice-btn-micro" id="btnVoiceInput_idle" onclick="toggleVoiceInput('idle')">🎙️</button>
                        <button class="voice-btn-micro" style="color:#D1D5DB; margin-left: 4px;" onclick="clearAIInput('idle')">✖</button>
                    </div>
                </div>
                <div class="fm-row" style="align-items: flex-start;">
                    <div class="fm-label" style="margin-top: 6px;">📍 交易地点</div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; flex: 1;">
                        <div class="location-input-wrapper">
                            <input type="text" id="idleLocation" placeholder="手动输入或点击定位">
                            <div class="location-icon-btn" onclick="autoLocate('idleLocation')">🧭</div>
                        </div>
                        <div id="postcodeToggleWrapper" style="display: none; align-items: center; gap: 4px; font-size: 11px; color: #6B7280; margin-top: 8px;">
                            <input type="checkbox" id="showPostcodeCheck" onchange="togglePostcode()"> 显示大概邮编 (<span id="detectedPostcode"></span>)
                        </div>
                    </div>
                </div>
                <div class="fm-row">
                    <div class="fm-label">⏰ 截止日期</div>
                    <input type="date" id="idleDeadline" class="fm-select" style="width: auto;">
                </div>
                <div class="fm-row">
                    <div class="fm-label">🔪 议价空间</div>
                    <div class="pill-group" id="bargainGroup">
                        <div class="pill active" onclick="selectPill(this, 'bargainGroup')">一口价</div>
                        <div class="pill" onclick="selectPill(this, 'bargainGroup')">可小刀</div>
                        <div class="pill" onclick="selectPill(this, 'bargainGroup')">买多可刀</div>
                    </div>
                </div>
                <div class="fm-row" style="border-bottom: none;">
                    <div class="fm-label">💶 收款方式</div>
                    <div class="pill-group" id="paymentGroup">
                        <div class="pill active" onclick="selectPill(this, 'paymentGroup')">Tikkie/银行转账</div>
                        <div class="pill" onclick="selectPill(this, 'paymentGroup')">仅限现金</div>
                        <div class="pill" onclick="selectPill(this, 'paymentGroup')">均可</div>
                    </div>
                </div>
                <div style="height: 50px;"></div>
            </div>
        </div>
    `,

    // --- 10. 悬赏发布弹窗 ---
    publishHelpModal: `
        <div class="full-modal" id="publishHelpModal" style="display: none;">
            <div class="fm-header">
                <div class="fm-close" onclick="closeHelpPublish()">✕</div>
                <div class="fm-title">发布悬赏</div>
                <div class="fm-submit" onclick="submitHelpPost()">发布</div>
            </div>
            <div class="fm-content">
                <div class="ai-magic-box" style="margin-bottom: 20px;">
                    <div class="ai-header"><span>✨ 一句话发悬赏</span></div>
                    <div class="ai-input-wrapper">
                        <input type="text" id="aiKeywords_help" class="ai-input" style="margin-bottom: 0;" placeholder="明天早7点史基浦接机，赏金50欧...">
                        <button class="voice-btn" style="width: 32px; font-size: 12px; border-color: #E5E7EB; color: #9CA3AF;" onclick="clearAIInput('help')">✖️</button>
                        <button class="voice-btn" id="btnVoiceInput_help" onclick="toggleVoiceInput('help')">🎙️</button>
                    </div>
                    <div style="font-size: 11px; color: #B45309; margin-top: 8px;">💡 <b>连招公式：</b>任务 + 时间地点 + 赏金 (可喊十万火急)</div>
                    <button class="ai-btn" id="btnAiMagic_help" style="margin-top: 10px;" onclick="generateAICopy('help')">🪄 自动填表</button>
                </div>
                <div class="fm-section-title" style="margin-top: 5px;">帮我做点什么？</div>
                <div class="fm-row" style="border-bottom:none;">
                    <div class="pill-group" style="justify-content: flex-start; gap: 10px;" id="helpTypeGroup">
                        <div class="pill active" onclick="selectPill(this, 'helpTypeGroup')">🚗 接送机</div>
                        <div class="pill" onclick="selectPill(this, 'helpTypeGroup')">💪 搬家/装家具</div>
                        <div class="pill" onclick="selectPill(this, 'helpTypeGroup')">🐱 代喂宠物</div>
                        <div class="pill" onclick="selectPill(this, 'helpTypeGroup')">🛠️ 其他求助</div>
                    </div>
                </div>
                <textarea id="helpDesc" class="fm-textarea" style="height: 120px;" placeholder="具体需要帮什么忙？比如：明天早上7点，从海牙带两个大箱子去史基浦机场..."></textarea>
                <div class="fm-section-title">悬赏与时间</div>
                <div class="fm-row">
                    <div class="fm-label">💰 赏金 (€)</div>
                    <input type="number" id="helpReward" class="fm-input-small" style="color: #D97706;" placeholder="0.00">
                </div>
                <div class="fm-row">
                    <div class="fm-label">⏰ 期待时间</div>
                    <input type="datetime-local" id="helpTime" class="fm-select">
                </div>
                <div class="fm-row">
                    <div class="fm-label">📍 地点</div>
                    <input type="text" id="helpLocation" class="fm-select" style="text-align: right; background: transparent;" placeholder="例如: Delft (可留空)">
                </div>
                <div class="fm-row" style="border-bottom:none;">
                    <div class="fm-label">🔥 是否十万火急？</div>
                    <div class="pill-group" id="helpUrgentGroup">
                        <div class="pill active" onclick="selectPill(this, 'helpUrgentGroup')">普通</div>
                        <div class="pill" onclick="selectPill(this, 'helpUrgentGroup')" style="color:#DC2626;">十万火急</div>
                    </div>
                </div>
                <div style="height: 50px;"></div>
            </div>
        </div>
    `,

    // --- 11. 找搭子发布弹窗 ---
    publishPartnerModal: `
        <div class="full-modal" id="publishPartnerModal" style="display: none;">
            <div class="fm-header">
                <div class="fm-close" onclick="closePartnerPublish()">✕</div>
                <div class="fm-title">找搭子</div>
                <div class="fm-submit" style="background:#8B5CF6;" onclick="submitPartnerPost()">发布</div>
            </div>
            <div class="fm-content">
                <div class="ai-magic-box" style="margin-bottom: 20px; background: linear-gradient(135deg, #F3E8FF, #E9D5FF); border-color: #D8B4FE;">
                    <div class="ai-header" style="color: #6B21A8;"><span>🥂 灵魂搭子召唤术</span></div>
                    <div class="ai-input-wrapper">
                        <input type="text" id="aiKeywords_partner" class="ai-input" style="margin-bottom: 0; border-color: #C084FC;" placeholder="这周末阿姆逛展，只找E人姐妹...">
                        <button class="voice-btn" style="width: 32px; font-size: 12px; border-color: #D8B4FE; color: #A855F7; background: #FAF5FF;" onclick="clearAIInput('partner')">✖️</button>
                        <button class="voice-btn" id="btnVoiceInput_partner" style="border-color: #C084FC;" onclick="toggleVoiceInput('partner')">🎙️</button>
                    </div>
                    <div style="font-size: 11px; color: #7E22CE; margin-top: 8px;">💡 <b>连招公式：</b>活动 + 时间地点 + MBTI要求</div>
                    <button class="ai-btn" id="btnAiMagic_partner" style="margin-top: 10px; background: #6B21A8; color: #FFF;" onclick="generateAICopy('partner')">🪄 自动填表</button>
                </div>
                <input type="text" id="partnerTitle" class="ai-input" style="font-size:16px; font-weight:bold; border-color:#E5E7EB; margin-top:5px;" placeholder="一句话标题 (例如: 周末有人去国王节吗)">
                <textarea id="partnerDesc" class="fm-textarea" style="height: 120px; border-color:#E5E7EB; margin-bottom:10px;" placeholder="介绍一下你的计划，或者希望找个什么样的搭子..."></textarea>
                <div class="fm-row" style="padding: 5px 0 15px; border-bottom:none;">
                    <div class="pill-group" style="justify-content: flex-start;" id="partnerTagGroup">
                        <div class="pill active" onclick="selectPill(this, 'partnerTagGroup')">🎨 看展/旅游</div>
                        <div class="pill" onclick="selectPill(this, 'partnerTagGroup')">🍽️ 约饭探店</div>
                        <div class="pill" onclick="selectPill(this, 'partnerTagGroup')">📚 图书馆自习</div>
                        <div class="pill" onclick="selectPill(this, 'partnerTagGroup')" style="color: #4F46E5; border-color: #C7D2FE; background: #EEF2FF;">🌙 夜归结伴</div>
                        <div class="pill" onclick="selectPill(this, 'partnerTagGroup')">🪩 蹦迪/音乐节</div>
                    </div>
                </div>
                <div class="fm-section-title">匹配条件</div>
                <div class="fm-row">
                    <div class="fm-label">⏰ 计划日期</div>
                    <input type="date" id="partnerDate" class="fm-select">
                </div>
                <div class="fm-row">
                    <div class="fm-label">📍 目标地点</div>
                    <input type="text" id="partnerLocation" class="fm-select" style="text-align: right; background: transparent;" placeholder="阿姆 / 鹿特丹 等">
                </div>
                <div class="fm-row" style="border-bottom:none;">
                    <div class="fm-label">🔮 MBTI 偏好</div>
                    <select id="partnerMbti" class="fm-select">
                        <option value="all">不限</option>
                        <option value="e">只找 E 人 (外向)</option>
                        <option value="i">只找 I 人 (内向)</option>
                    </select>
                </div>
                <div style="height: 50px;"></div>
            </div>
        </div>
    `,

    // --- 12. 提问发布弹窗 ---
    publishQuestionModal: `
        <div class="full-modal" id="publishQuestionModal" style="display: none;">
            <div class="fm-header">
                <div class="fm-close" onclick="closeQuestionPublish()">✕</div>
                <div class="fm-title">提个问题</div>
                <div class="fm-submit" style="background:#10B981;" onclick="submitQuestionPost()">发布</div>
            </div>
            <div class="fm-content">
                <input type="text" id="questionTitle" class="ai-input" style="font-size:16px; font-weight:bold; border-color:#E5E7EB; margin-top:15px;" placeholder="一句话描述你的问题 (如: NS火车晚点怎么退款?)">
                <textarea id="questionDesc" class="fm-textarea" style="height: 150px; border-color:#E5E7EB; margin-bottom:10px;" placeholder="详细描述一下你遇到的背景或困惑，大家才好帮你解答哦..."></textarea>
                <div class="fm-section-title">问题分类</div>
                <div class="fm-row" style="border-bottom:none;">
                    <div class="pill-group" style="justify-content: flex-start;" id="questionTagGroup">
                        <div class="pill active" onclick="selectPill(this, 'questionTagGroup')">🏠 租房/生活</div>
                        <div class="pill" onclick="selectPill(this, 'questionTagGroup')">🎓 学习/选课</div>
                        <div class="pill" onclick="selectPill(this, 'questionTagGroup')">🛂 签证/居留</div>
                        <div class="pill" onclick="selectPill(this, 'questionTagGroup')">🛒 羊毛/购物</div>
                    </div>
                </div>
            </div>
        </div>
    `,

    // --- 13. 闲置商品瀑布流点击详情 ---
    postDetailModal: `
        <div class="full-modal" id="postDetailModal" style="display: none; background: #F9FAFB; position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99999;">
            <div class="fm-header" style="background: #FFF; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center; padding: 15px;">
                <div class="fm-close" onclick="document.getElementById('postDetailModal').style.display='none'" style="font-size: 20px; cursor: pointer;">✕</div>
                <div class="fm-title" style="font-weight: bold; font-size: 16px;">闲置详情</div>
                <div style="width: 24px;"></div>
            </div>
            
            <div style="padding: 15px; overflow-y: auto; height: calc(100vh - 130px); padding-bottom: 80px;" id="pdContentArea">
                <div id="pdSellerInfo" style="background: #FFF; padding: 15px; border-radius: 16px; margin-bottom: 15px; border: 1px solid #E5E7EB;"></div>
                <div style="font-size: 14px; font-weight: 900; margin-bottom: 10px; color: #111827;">物品清单</div>
                <div id="pdItemsList"></div>
            </div>
            
            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: #FFF; padding: 15px 20px; padding-bottom: calc(15px + env(safe-area-inset-bottom)); border-top: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: center; z-index: 100;">
                <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 11px; color: #6B7280;">已选总计</span>
                    <span id="pdTotalPrice" style="font-size: 20px; font-weight: 900; color: #D97706;">€0.00</span>
                </div>
                <button id="pdChatBtn" onclick="window.App.initiateBuyChat()" style="background: #111827; color: #FFF; padding: 10px 24px; border-radius: 14px; font-size: 14px; font-weight: bold; border: none; cursor: pointer;">私信想要 (0件)</button>
            </div>
        </div>
    `,

    // --- 14. 聊天室系统 ---
    chatModal: `
        <div class="full-modal" id="chatModal" style="display: none; z-index: 3000; background: #F3F4F6;">
            <div class="chat-header">
                <div class="ch-back" onclick="closeChat()">‹ 返回</div>
                <div class="ch-title-box">
                    <div class="ch-title" id="chatTargetName">联系卖家</div>
                    <div class="ch-status">🟢 在线</div>
                </div>
                <div class="ch-more">···</div>
                <div id="chatTargetAvatar" style="display:none;"></div> 
            </div>
            <div class="chat-product-snippet">
                <img id="chatProductImg" class="cps-img" src="" alt="商品">
                <div class="cps-info">
                    <div class="cps-title" id="chatProductTitle">商品信息</div>
                    <div class="cps-price" id="chatProductPrice">€0.00</div>
                </div>
                <button class="cps-btn" id="cpsActionBtn" onclick="alert('已发送购买意向')">我想要</button>
                <div id="cpsSoldStamp" style="display:none; position:absolute; right:15px; top:15px; border:2px solid #9CA3AF; color:#9CA3AF; font-size:12px; font-weight:900; padding:2px 8px; border-radius:4px; transform:rotate(-15deg); letter-spacing:2px;">已售出</div>
            </div>
            <div class="chat-msg-container" id="chatMsgList"></div>
            <div class="chat-quick-replies" id="chatQuickReplies">
                <div class="qr-pill" onclick="sendQuickMessage('🔪 你好，我很想要！请问价格还能稍微便宜一点点吗？')">🔪 屠龙刀砍价</div>
                <div class="qr-pill" onclick="sendQuickMessage('📍 请问平时可以在哪个火车站面交呢？')">📍 问面交地</div>
                <div class="qr-pill" onclick="sendQuickMessage('📦 请问支持邮寄吗？邮费买家自理。')">📦 问邮寄</div>
                <div class="qr-pill" onclick="sendQuickMessage('👀 东西还在吗？有没有什么明显的瑕疵呀？')">👀 问成色</div>
            </div>
            <div class="chat-input-bar" id="chatInputBar">
                <div class="c-action-btn">⊕</div>
                <div class="c-input-wrapper">
                    <input type="text" id="chatInput" class="c-input" placeholder="发消息..." onkeypress="if(event.key==='Enter') sendChatMessage()">
                </div>
                <button class="c-send-btn" onclick="sendChatMessage()">⬆</button>
            </div>
            <div class="chat-input-disabled" id="chatInputDisabled" style="display:none;">🚫 物品已售出，交易关闭</div>
        </div>
    `,

    // --- 15. 我的收藏 ---
    collectionsModal: `
        <div class="full-modal" id="collectionsModal" style="display: none; background: #F7F8FA; z-index: 3000;">
            <div class="fm-header">
                <div class="fm-close" onclick="document.getElementById('collectionsModal').style.display='none'">✕</div>
                <div class="fm-title">我的收藏库 ⭐</div>
                <div style="width: 24px;"></div>
            </div>
            <div class="fm-content" id="collectionsList" style="padding: 15px; padding-bottom: 80px;"></div>
        </div>
    `,

    // --- 16. AI 洗稿提炼录入 ---
    aiWikiModal: `
        <div class="modal-overlay" id="aiWikiModal" style="z-index: 3100;">
            <div class="modal-content">
                <div class="modal-close" onclick="document.getElementById('aiWikiModal').style.display='none'">✕</div>
                <h3 style="margin-top:0; color: #111827;">✨ AI 自动洗稿录入</h3>
                <div style="font-size:12px; color:#6B7280; margin-bottom:15px;">在小红书或微信群看到超长攻略？直接复制粘贴到下面，AI会自动提炼成卡片！</div>
                <textarea id="aiWikiInput" class="modal-textarea" style="height: 140px; border-color: #FCD34D;" placeholder="粘贴长篇大论的攻略原文..."></textarea>
                <button id="btnGenerateWiki" style="width: 100%; padding: 14px; background: #111827; color: #FDE68A; border: none; border-radius: 12px; font-weight: bold; margin-top: 15px; cursor:pointer;" onclick="generateAICard()">🪄 一键提取为红宝书</button>
            </div>
        </div>
    `,

    // --- 17. 红宝书攻略网友补充 ---
    wikiCommentModal: `
        <div class="full-modal" id="wikiCommentModal" style="display: none; background: #F9FAFB; z-index: 3500;">
            <div class="fm-header" style="background: #FFF; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div class="fm-close" onclick="document.getElementById('wikiCommentModal').style.display='none'">‹ 返回</div>
                <div class="fm-title">网友补充 & 踩坑</div>
                <div style="width: 40px;"></div>
            </div>
            <div style="padding: 15px; overflow-y: auto; height: calc(100vh - 130px);" id="wikiCommentList"></div>
            <div style="position: fixed; bottom: 0; left: 0; right: 0; background: #FFF; padding: 10px 15px; padding-bottom: calc(10px + env(safe-area-inset-bottom)); border-top: 1px solid #E5E7EB; display: flex; gap: 10px; align-items: center; z-index: 100;">
                <input type="text" id="wikiCommentInput" style="flex: 1; background: #F3F4F6; border: none; border-radius: 20px; padding: 10px 15px; font-size: 14px; outline: none;" placeholder="说点你的经验...">
                <button onclick="submitWikiComment()" style="background: #111827; color: #FFF; padding: 10px 18px; border-radius: 20px; font-weight: bold; border: none;">发送</button>
            </div>
        </div>
    `
};

export const ModalManager = {
    /**
     * 🛡️ JIT 惰性注入引擎核心：只在需要时将模板渲染入 DOM
     * @param {string} modalId - 对应 ModalTemplates 中的 key
     */
    injectIfNeeded(modalId) {
        try {
            // 如果 DOM 中已经有这个弹窗了，直接放行 (防止重复注入内存泄漏)
            if (document.getElementById(modalId)) {
                return true;
            }
            
            // 如果在模板库里找到了它，安全注入到 body 尾部
            if (ModalTemplates[modalId]) {
                document.body.insertAdjacentHTML('beforeend', ModalTemplates[modalId]);
                console.log(`🛡️ [ModalManager] JIT 惰性注入成功: #${modalId}`);
                return true;
            } else {
                console.warn(`🚨 [ModalManager] 找不到对应模板: ${modalId}`);
                return false;
            }
        } catch (error) {
            console.error(`🚨 [ModalManager] 注入崩溃拦截: ${modalId}`, error);
            return false;
        }
    },

    /**
     * 安全地唤起弹窗
     */
    open(modalId, displayStyle = 'flex') {
        if (this.injectIfNeeded(modalId)) {
            const el = document.getElementById(modalId);
            if(el) {
                // 做一个小延迟，确保 DOM 已经被浏览器重绘，从而让 CSS 动画生效
                setTimeout(() => { el.style.display = displayStyle; }, 10);
            }
        } else {
            showToast("模块还在加载中，请稍后再试", "warning");
        }
    },

    /**
     * 安全地关闭弹窗
     */
    close(modalId) {
        const el = document.getElementById(modalId);
        if(el) el.style.display = 'none';
    }
};
