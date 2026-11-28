// Hebao frontend: zero framework bloat, GDPR-friendly first-party funnel, WeChat WebView ready.
import { readDraft, writeDraft, deleteDraft } from './draft-store.js';
import { createPoster, createEventPoster } from './poster.js';
import { downloadCalendarIcs } from './ics.js';
import { marketProducts, itemPrice } from './market-view.js';
import {
  cities, cityLabels, cityEvents, CITY_EVENTS_CHECKED, CITY_AGENDA_URL,
  upcomingCityEvents, amsterdamInput, amsterdamInstant, cityEventDraft,
  eventPlace, discoveryFilters, citySelection, weekendLabel
} from './city-events.js';
import { escapeHtml as esc, activityCard, activityDetailContent } from './activity-view.js';
import {
  activityLink, eventShareLink, listingShareLink, pageFromLocation, legalModalFromLocation,
  tabPath, SITE_TABS
} from './site-config.js';

const $ = id => document.getElementById(id);
const isWeChat = /MicroMessenger/i.test(navigator.userAgent || '');

const state = {
  photos: [], listings: [], myListings: [], events: [], myEvents: [],
  currentListing: null, currentProduct: null, currentEvent: null, coordEvent: null,
  editingEventId: null, reportTarget: null,
  publishedId: null, editingId: null, editVersion: null,
  dirty: false, activeTab: null, category: '', eventCategory: '', marketCity: 'all',
  saving: false, unreadCount: 0,
};

const itemCategories = ['家具', '自行车', '数码', '生活用品', '书籍', '其他'];
const statusNames = { available: '在售', reserved: '已预订', sold: '已售出' };
const siteTitle = document.title;
const uuid = () => crypto.randomUUID();
const token = () => localStorage.getItem('hebao_token') || '';
const nickname = () => localStorage.getItem('delft_nickname') || localStorage.getItem('hp_name') || '';
const savedCity = () => {
  const c = localStorage.getItem('hebao_city') || '';
  return c === 'all' || c === 'zuid-holland' || Object.hasOwn(cities, c) ? c : '';
};
const rememberCity = city => {
  if (city === 'all' || city === 'zuid-holland' || Object.hasOwn(cities, city)) {
    try { localStorage.setItem('hebao_city', city); } catch {}
  }
};

function trackEvent(eventName) {
  try {
    const payload = JSON.stringify({ event: eventName });
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon('/api/delft?action=track', blob)) return;
    }
    fetch('/api/delft?action=track', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true
    }).catch(() => {});
  } catch {}
}

const api = async (action, method = 'GET', body, authorized = true, params = {}) => {
  const response = await fetch(`/api/delft?${new URLSearchParams({ action, ...params })}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authorized && token() ? { Authorization: `Bearer ${token()}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({ error: '服务器返回异常' }));
  if (response.status === 401 && authorized) {
    ['hebao_token', 'hebao_logged_in', 'hebao_email'].forEach(key => localStorage.removeItem(key));
    refreshLoginUI();
  }
  if (!response.ok || data.error) {
    const error = new Error(data.error || `请求失败 ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
};

let toastTimer;
function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 4500);
}

function setBusy(button, busy, label) {
  button.disabled = busy;
  if (busy) {
    button.dataset.oldLabel = button.textContent;
    button.textContent = label || '处理中…';
  } else if (button.dataset.oldLabel) {
    button.textContent = button.dataset.oldLabel;
    delete button.dataset.oldLabel;
  }
}

let resumeAfterLogin = null;
function requireAuth(resume) {
  if (token()) return true;
  resumeAfterLogin = resume || null;
  showModal('loginModal');
  return false;
}

const modalFocus = new Map();
let modalLayer = 1000;
let dutchView, dutchLoading;

let dialogResolver = null, dialogHasInput = false;

function showModal(id) {
  modalFocus.set(id, document.activeElement);
  $(id).hidden = false;
  $(id).style.zIndex = ++modalLayer;
  document.body.style.overflow = 'hidden';
  $(id).querySelector('input:not([hidden]),textarea:not([hidden]),select:not([hidden]),button:not(.modal-x)')?.focus();
}

function hideModal(id, { updateUrl = true } = {}) {
  const modal = $(id);
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  document.body.style.overflow = document.querySelector('.overlay:not([hidden])') ? 'hidden' : '';
  modalFocus.get(id)?.focus?.();
  if (id === 'loginModal') resumeAfterLogin = null;
  if (id === 'createEventBox') state.editingEventId = null;
  if (id === 'actionDialogModal' && dialogResolver) {
    const resolve = dialogResolver;
    dialogResolver = null;
    resolve(dialogHasInput ? null : false);
  }
  if (id === 'detailModal' && updateUrl && new URL(location.href).searchParams.has('item')) {
    if (history.state?.listingModal) history.back();
    else {
      const url = new URL('/market', location.origin);
      history.replaceState(null, '', url);
    }
  }
  if ((id === 'privacyModal' || id === 'termsModal') && updateUrl) {
    const clean = location.pathname.replace(/\/+$/, '');
    if (clean === '/privacy' || clean === '/terms') {
      history.replaceState(null, '', tabPath(state.activeTab || 'events'));
    }
  }
}

function askDialog({
  title = '请确认',
  message = '',
  confirmText = '确认',
  cancelText = '取消',
  danger = false,
  inputLabel = '',
  inputPlaceholder = '',
  inputValue = '',
} = {}) {
  if (dialogResolver) {
    const prev = dialogResolver;
    dialogResolver = null;
    prev(dialogHasInput ? null : false);
  }
  dialogHasInput = Boolean(inputLabel);
  $('dialogHeading').textContent = title;
  $('dialogMessage').textContent = message;
  $('dialogConfirmBtn').textContent = confirmText;
  $('dialogCancelBtn').textContent = cancelText;
  $('dialogConfirmBtn').classList.toggle('danger-solid', Boolean(danger));
  $('dialogInputWrap').hidden = !dialogHasInput;
  if (dialogHasInput) {
    $('dialogInputLabel').textContent = inputLabel;
    $('dialogInput').placeholder = inputPlaceholder;
    $('dialogInput').value = inputValue;
  } else {
    $('dialogInput').value = '';
  }
  return new Promise(resolve => {
    dialogResolver = resolve;
    showModal('actionDialogModal');
    if (dialogHasInput) $('dialogInput').focus();
    else $('dialogConfirmBtn').focus();
  });
}

$('dialogCancelBtn').addEventListener('click', () => hideModal('actionDialogModal'));
$('dialogForm').addEventListener('submit', e => {
  e.preventDefault();
  const resolve = dialogResolver;
  const val = dialogHasInput ? $('dialogInput').value : true;
  dialogResolver = null;
  hideModal('actionDialogModal');
  resolve?.(val);
});

function renderSkeletonEvents() {
  return `<div class="skeleton-card" aria-hidden="true"><div class="skeleton-line short"></div><div class="skeleton-line tall"></div><div class="skeleton-line medium"></div><div class="skeleton-line short"></div></div>
    <div class="skeleton-card" aria-hidden="true"><div class="skeleton-line short"></div><div class="skeleton-line tall"></div><div class="skeleton-line medium"></div><div class="skeleton-line short"></div></div>`;
}

function renderSkeletonMarket() {
  return Array.from({ length: 4 }, () => `<div class="skeleton-card" aria-hidden="true"><div class="skeleton-photo"></div><div class="skeleton-line short"></div><div class="skeleton-line medium"></div></div>`).join('');
}

function updateUnreadBadges(count) {
  state.unreadCount = Math.max(0, Number(count) || 0);
  const navBadge = $('mineTabBadge');
  const inboxBadge = $('inboxCountBadge');
  if (navBadge) {
    navBadge.hidden = !token() || state.unreadCount === 0;
    navBadge.textContent = state.unreadCount > 99 ? '99+' : String(state.unreadCount);
  }
  if (inboxBadge) {
    inboxBadge.hidden = state.unreadCount === 0;
    inboxBadge.textContent = String(state.unreadCount);
  }
}

async function refreshUnreadBadge() {
  if (!token()) { updateUnreadBadges(0); return; }
  try {
    const res = await api('unread');
    updateUnreadBadges(res.unreadCount);
  } catch {}
}

function updateWeChatBanner() {
  const banner = $('wechatDraftBanner');
  if (!banner) return;
  if (!isWeChat) { banner.hidden = true; return; }
  banner.hidden = false;
  const btn = $('wechatCloudSaveBtn');
  if (token()) {
    banner.querySelector('span').textContent = '当前在微信内置浏览器中打开：已开启登录账号云端草稿备份，换系统浏览器登录同一邮箱即可继续编辑。';
    if (btn) btn.hidden = true;
  } else {
    banner.querySelector('span').textContent = '微信内置浏览器缓存易被系统回收。建议先登录邮箱开启云端备份，或点右上角「⋯」在系统浏览器打开编辑。';
    if (btn) btn.hidden = false;
  }
}

async function tab(name, { updateUrl = true } = {}) {
  if (!SITE_TABS.includes(name)) return;
  if (name !== 'dutch') dutchView?.pauseMedia();
  state.activeTab = name;
  document.title = siteTitle;
  const navTab = name === 'sell' ? 'market' : name;
  for (const button of document.querySelectorAll('.tabs .tab')) {
    const selected = button.dataset.tab === navTab;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  }
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === `panel-${name}`));
  if (name === 'sell') updateWeChatBanner();
  if (updateUrl) {
    activeActivity = '';
    const url = name === 'events' ? discoveryUrl() : new URL(tabPath(name), location.origin);
    if (name === 'market' && state.marketCity && state.marketCity !== 'all') {
      url.searchParams.set('city', state.marketCity);
    }
    if (url.href !== location.href) history.pushState(null, '', url);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (name === 'market') await loadListings();
  if (name === 'events') { renderCityEvents(); await Promise.all([loadEvents(), loadCityFeed()]); }
  if (name === 'mine') await loadMine();
  if (name === 'dutch') {
    try {
      if (!dutchView) {
        dutchLoading ??= import('./dutch.js').then(({ mountDutch }) => {
          dutchView = mountDutch($('dutchApp'), {
            isSignedIn: () => Boolean(token()),
            requestLogin: resume => requireAuth(resume),
            loadCloudProgress: async () => (await api('studyProgress')).progress,
            saveCloudProgress: async payload => api('saveStudyProgress', 'POST', payload),
            onPractice: () => trackEvent('a2_practice'),
          });
        });
        await dutchLoading;
      } else {
        dutchView.syncCloud?.();
      }
    } catch {
      dutchLoading = null;
      $('dutchApp').innerHTML = '<div class="empty-state error-state"><p>练习暂未载入，请刷新页面重试。</p><a href="https://www.inburgeren.nl/examen-doen/oefenen.jsp" target="_blank" rel="noopener noreferrer">先做 DUO 官方练习 ↗</a></div>';
    }
  }
}

document.addEventListener('click', e => {
  const brand = e.target.closest('[data-brand-home]');
  if (brand && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
    e.preventDefault();
    tab('events');
    return;
  }
  const nav = e.target.closest('[data-tab]');
  if (nav) tab(nav.dataset.tab);
  const close = e.target.closest('[data-close]');
  if (close) hideModal(close.dataset.close);
  const legal = e.target.closest('[data-open-legal]');
  if (legal) {
    const kind = legal.dataset.openLegal;
    showModal(kind === 'privacy' ? 'privacyModal' : 'termsModal');
  }
  const invite = e.target.closest('[data-create-event]');
  if (invite) openEventForm(null, meetupIdeas[invite.dataset.createEvent]);
  if (e.target.closest('[data-retry-events]')) loadEvents();
  if (e.target.closest('[data-retry-market]')) loadListings();
  if (e.target.closest('[data-clear-market]')) {
    $('marketSearch').value = '';
    state.marketCity = 'all';
    $('marketCity').value = 'all';
    updateMarketHeading();
    $('marketCategories').querySelector('[data-category=""]').click();
  }
  if (e.target.classList.contains('overlay')) hideModal(e.target.id);
});

document.addEventListener('keydown', e => {
  const top = [...document.querySelectorAll('.overlay:not([hidden])')].sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex))[0];
  if (!top) return;
  if (e.key === 'Escape') { hideModal(top.id); return; }
  if (e.key === 'Tab') {
    const items = [...top.querySelectorAll('button,input,textarea,select,a[href],summary')].filter(el => !el.disabled && el.getClientRects().length);
    const first = items[0], last = items.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }
});

// ---- User sign-in (compatible with existing email OTP and JWT). ----
function refreshLoginUI() {
  const signedIn = Boolean(token());
  const email = localStorage.getItem('hebao_email') || '';
  const shortLabel = nickname() || (email ? email.split('@')[0] : '已登录');
  const triggerBtn = $('loginTrigger');
  triggerBtn.classList.toggle('signed-in', signedIn);
  triggerBtn.textContent = signedIn ? shortLabel : '登录';
  const profile = $('profileArea');
  profile.classList.toggle('signed-in', signedIn);
  $('mineSwitch').hidden = !signedIn;
  $('accountDataBox').hidden = !signedIn;
  updateWeChatBanner();
  if (!signedIn) updateUnreadBadges(0);
  if (signedIn) {
    const emailHint = email ? `（${esc(email)}）` : '';
    const initial = esc((nickname() || email || '荷').trim().charAt(0).toUpperCase());
    profile.innerHTML = `<span class="profile-avatar" aria-hidden="true">${initial}</span><p><strong>${esc(nickname() || '你好')}</strong> ${emailHint} <span class="hint">· 新私信与活动变动会自动发邮件提醒</span></p><button id="logout" class="text-btn" type="button">退出登录</button>`;
  } else {
    profile.innerHTML = `<img class="profile-art" src="/delft/mine-hello.webp" alt="" width="278" height="280" loading="lazy" /><div class="profile-copy"><h2>把自己的事，放在一处</h2><p>邮箱验证码登录，无需密码，首次登录自动创建账号。</p><ul class="profile-perks"><li><strong>闲置管理</strong>改价、标记已售</li><li><strong>买家私信</strong>咨询即时邮件提醒</li><li><strong>邀约报名</strong>解锁集合联络方式</li><li><strong>荷语错题</strong>云端备份不丢失</li></ul><button id="mineLogin" class="primary-btn" type="button">邮箱登录</button></div>`;
  }
  const trigger = $('mineLogin');
  if (trigger) trigger.onclick = openLogin;
  $('logout')?.addEventListener('click', async () => {
    if (state.saving) { toast('正在保存商品，请稍后退出'); return; }
    if (state.photos.length && state.dirty) {
      const ok = await askDialog({
        title: '退出登录？',
        message: '当前有未发布的闲置草稿，退出登录会清除本机草稿。',
        confirmText: '退出登录',
        danger: true,
      });
      if (!ok) return;
    }
    ['hebao_token', 'hebao_logged_in', 'hebao_email'].forEach(k => localStorage.removeItem(k));
    resetDraft();
    refreshLoginUI();
    dutchView?.syncCloud?.();
    loadMine();
    toast('已退出登录');
  });
}

function openLogin() { resumeAfterLogin = null; showModal('loginModal'); $('authEmail').focus(); }
$('loginTrigger').addEventListener('click', () => token() ? tab('mine') : openLogin());
$('wechatCloudSaveBtn')?.addEventListener('click', () => requireAuth(() => { syncCloudDraft(); toast('已登录，草稿将自动云端备份'); }));

let codeCountdown;
$('sendCode').addEventListener('click', async () => {
  const email = $('authEmail').value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { toast('请输入正确的邮箱地址'); return; }
  const button = $('sendCode');
  setBusy(button, true, '发送中…');
  let sent = false;
  trackEvent('auth_request');
  try {
    const r = await fetch('/api/send-auth-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
    });
    const data = await r.json();
    if (!r.ok || !data.success) throw new Error(data.error || '发送失败');
    sent = true;
    $('authStatus').textContent = '验证码已发送！若 1 分钟内未收到，请检查垃圾邮件/广告邮件箱。';
    $('authCode').focus();
  } catch (error) {
    $('authStatus').textContent = error.message;
  } finally {
    setBusy(button, false);
  }
  if (sent) {
    let seconds = 60;
    button.disabled = true;
    button.textContent = `${seconds} 秒后重发`;
    clearInterval(codeCountdown);
    codeCountdown = setInterval(() => {
      seconds--;
      button.textContent = seconds ? `${seconds} 秒后重发` : '重新发送';
      button.disabled = seconds > 0;
      if (!seconds) clearInterval(codeCountdown);
    }, 1000);
  }
});

$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('authEmail').value.trim().toLowerCase(), code = $('authCode').value.trim();
  if (!email || !/^[0-9]{6}$/.test(code)) { toast('请填写邮箱和 6 位数字验证码'); return; }
  const button = $('verifyCode');
  setBusy(button, true, '验证中…');
  try {
    let userId = localStorage.getItem('hebao_uuid');
    if (!userId) { userId = uuid(); localStorage.setItem('hebao_uuid', userId); }
    const r = await fetch('/api/verify-auth-code', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code, userId })
    });
    const data = await r.json();
    if (!r.ok || !data.success) throw new Error(data.error || '验证失败');
    localStorage.setItem('hebao_token', data.token);
    localStorage.setItem('hebao_logged_in', 'true');
    localStorage.setItem('hebao_uuid', data.userId);
    localStorage.setItem('hebao_email', email);
    trackEvent('auth_success');
    const resume = resumeAfterLogin;
    refreshLoginUI();
    refreshUnreadBadge();
    dutchView?.syncCloud?.();
    restoreOrSyncCloudDraft();
    hideModal('loginModal');
    toast('已成功登录');
    if (state.activeTab === 'mine') loadMine();
    if (state.activeTab === 'events') loadEvents();
    resume?.();
  } catch (error) {
    $('authStatus').textContent = error.message;
  } finally {
    setBusy(button, false);
  }
});

// ---- Image compression (memory-safe for 12 iPhone photos in mobile WebView) & listing draft ----
const draftFields = ['listingTitle', 'listingCity', 'sellerName', 'pickup', 'listingNote'];
let draftTimer, cloudDraftTimer, draftQueue = Promise.resolve(), draftRevision = 0;

const draftSnapshot = () => ({
  version: 1,
  photos: state.photos.map(item => ({ ...item })),
  fields: Object.fromEntries(draftFields.map(id => [id, $(id).value])),
  editingId: state.editingId,
  editVersion: state.editVersion,
  publishedId: state.publishedId,
  dirty: state.dirty,
  owner: token() ? localStorage.getItem('hebao_uuid') : null,
});

const cloudDraftPayload = () => ({
  version: 1,
  photos: state.photos.map(item => ({ ...item, dataUrl: '' })),
  fields: Object.fromEntries(draftFields.map(id => [id, $(id).value])),
  editingId: state.editingId,
  editVersion: state.editVersion,
  publishedId: state.publishedId,
  dirty: state.dirty,
});

function syncCloudDraft() {
  if (!token()) return;
  clearTimeout(cloudDraftTimer);
  cloudDraftTimer = setTimeout(() => {
    if (!token()) return;
    if (!state.photos.length && !state.editingId) {
      api('deleteCloudDraft', 'POST', {}).catch(() => {});
      return;
    }
    api('saveCloudDraft', 'POST', { draft: cloudDraftPayload() }).catch(() => {});
  }, 900);
}

async function restoreOrSyncCloudDraft() {
  if (!token()) return;
  if (state.photos.length) { syncCloudDraft(); return; }
  try {
    const res = await api('cloudDraft');
    const saved = res.draft;
    if (saved?.version === 1 && Array.isArray(saved.photos) && saved.photos.length) {
      state.photos = saved.photos.slice(0, 12).map(item => ({ ...item, dataUrl: '' }));
      state.editingId = saved.editingId || null;
      state.editVersion = saved.editVersion || null;
      state.publishedId = saved.publishedId || null;
      state.dirty = Boolean(saved.dirty);
      draftFields.forEach(id => { if (typeof saved.fields?.[id] === 'string') $(id).value = saved.fields[id]; });
      renderItems();
      renderDraftMode();
      $('draftStatus').textContent = '已恢复云端备份草稿';
    }
  } catch {}
}

function renderDraftMode() {
  $('editBanner').hidden = !state.editingId;
  $('btnPublish').textContent = state.editingId ? '保存修改' : '发布到集市';
  $('newDraft').hidden = !state.photos.length && !state.editingId;
  $('newDraft').textContent = state.editingId ? '退出编辑' : '清空草稿';
  const isPublishedClean = Boolean(state.publishedId && !state.dirty);
  const shareBox = $('wechatShareDisclosure');
  if (shareBox) {
    shareBox.open = isPublishedClean;
    $('shareDisclosureTag').textContent = isPublishedClean ? '二维码已绑定实时库存' : '可选 · 发布后解锁实时库存二维码';
    $('shareDisclosureHint').textContent = isPublishedClean
      ? '生成海报图片或复制文案发到微信群，群友扫码即可看实时在售与已售状态。'
      : '建议先点上方「发布到集市」：生成的海报二维码会自动指向实时在售状态。';
  }
}

function persistDraft() {
  clearTimeout(draftTimer);
  const snapshot = draftSnapshot(), revision = draftRevision;
  draftQueue = draftQueue.catch(() => {}).then(() => writeDraft(snapshot)).then(() => {
    if (revision === draftRevision) $('draftStatus').textContent = state.dirty ? (token() ? '草稿已保存（含云端备份）' : '草稿已保存在本机') : '已保存到集市';
  }).catch(() => {
    if (revision === draftRevision) $('draftStatus').textContent = token() ? '本机存储受限，已备份文字草稿到云端' : '此浏览器无法保存照片草稿，建议直接发布';
  });
  syncCloudDraft();
  return draftQueue;
}

function markDraftChanged() {
  state.dirty = true;
  draftRevision++;
  $('shareResult').hidden = true;
  renderDraftMode();
  renderListPreview();
  $('draftStatus').textContent = '保存中…';
  $('sellValidation').hidden = true;
  clearTimeout(draftTimer);
  draftTimer = setTimeout(persistDraft, 350);
}

function resetDraft() {
  clearTimeout(draftTimer);
  draftRevision++;
  state.photos = []; state.editingId = null; state.editVersion = null; state.publishedId = null; state.dirty = false;
  $('listingTitle').value = '';
  $('listingCity').value = cities[selectedCity] ? selectedCity : 'delft';
  $('sellerName').value = nickname();
  $('pickup').value = '';
  $('listingNote').value = '';
  $('shareResult').hidden = true;
  $('draftStatus').textContent = '草稿自动保存';
  renderItems(); renderDraftMode(); setSellStep(1);
  draftQueue = draftQueue.catch(() => {}).then(deleteDraft).catch(() => {});
  if (token()) api('deleteCloudDraft', 'POST', {}).catch(() => {});
}

$('newDraft').addEventListener('click', async () => {
  if (state.photos.length || state.editingId) {
    const ok = await askDialog({
      title: state.editingId ? '退出编辑并新建？' : '清空当前草稿？',
      message: state.editingId
        ? '退出编辑后将回到空白发布页（已发布的闲置清单本身不受影响）。'
        : '清空后当前未发布的照片与文字将被移除。',
      confirmText: state.editingId ? '退出编辑' : '清空草稿',
      danger: !state.editingId,
    });
    if (!ok) return;
  }
  resetDraft();
});

let sellStep = 1;
function setSellStep(step) {
  if (step === 2) {
    try { validateDraft(); }
    catch (error) {
      $('sellValidation').textContent = error.message;
      $('sellValidation').hidden = false;
      $('itemEditor').querySelector('[aria-invalid=true]')?.focus();
      return;
    }
  }
  sellStep = step;
  $('sellItemsPanel').hidden = step !== 1;
  $('sellSharePanel').hidden = step !== 2;
  for (const [id, active] of [['sellItemsStep', step === 1], ['sellShareStep', step === 2]]) {
    $(id).classList.toggle('active', active);
    $(id).setAttribute('aria-pressed', String(active));
  }
  $('sellValidation').hidden = true;
  if (step === 2) $('listingTitle').focus({ preventScroll: true });
}

$('sellItemsStep').addEventListener('click', () => setSellStep(1));
$('sellShareStep').addEventListener('click', () => setSellStep(2));
$('sellNext').addEventListener('click', () => { setSellStep(2); if (sellStep === 2) $('panel-sell').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
$('sellBack').addEventListener('click', () => setSellStep(1));
$('choosePhotos').addEventListener('click', () => $('photoInput').click());
window.addEventListener('pagehide', () => { if (state.photos.length) persistDraft(); });

function drawScaledJpeg(source, srcWidth, srcHeight, maxEdge, quality) {
  const scale = Math.min(1, maxEdge / Math.max(srcWidth, srcHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(srcWidth * scale));
  canvas.height = Math.max(1, Math.round(srcHeight * scale));
  try {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    // Release WebKit/WeChat GPU canvas memory immediately so 12 consecutive iPhone photos never OOM.
    canvas.width = 0;
    canvas.height = 0;
  }
}

async function asJpeg(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      try {
        let dataUrl = drawScaledJpeg(bitmap, bitmap.width, bitmap.height, 1200, 0.75);
        if (dataUrl.length > 720000) dataUrl = drawScaledJpeg(bitmap, bitmap.width, bitmap.height, 960, 0.58);
        if (dataUrl.length > 1000000) dataUrl = drawScaledJpeg(bitmap, bitmap.width, bitmap.height, 800, 0.5);
        return dataUrl;
      } finally {
        bitmap.close?.();
      }
    } catch {}
  }
  return new Promise((resolve, reject) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        let dataUrl = drawScaledJpeg(img, img.naturalWidth, img.naturalHeight, 1200, 0.75);
        if (dataUrl.length > 720000) dataUrl = drawScaledJpeg(img, img.naturalWidth, img.naturalHeight, 960, 0.58);
        if (dataUrl.length > 1000000) dataUrl = drawScaledJpeg(img, img.naturalWidth, img.naturalHeight, 800, 0.5);
        resolve(dataUrl);
      } catch (e) { reject(e); }
      finally { URL.revokeObjectURL(url); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('无法读取图片（如为 HEIC 原图请在相册转为兼容格式）')); };
    img.src = url;
  });
}

$('photoInput').addEventListener('change', async e => {
  const files = [...e.target.files].filter(f => !f.type || f.type.startsWith('image/'));
  if (!files.length) return;
  if (files.length + state.photos.length > 12) { toast(`一次最多发布 12 件商品，还能再加 ${Math.max(0, 12 - state.photos.length)} 件`); e.target.value = ''; return; }
  $('btnPublish').disabled = true;
  $('choosePhotos').disabled = true;
  try {
    let failed = 0, lastError = '';
    for (let idx = 0; idx < files.length; idx++) {
      $('uploadLabel').textContent = `正在压缩照片 ${idx + 1} / ${files.length}…`;
      try {
        const dataUrl = await asJpeg(files[idx]);
        state.photos.push({ id: uuid(), name: '', price: '', condition: '', category: '其他', dataUrl, photo: '', status: 'available' });
      } catch (error) { failed++; lastError = error.message; }
    }
    if (failed) toast(`${failed} 张照片无法读取：${lastError}`);
  } finally {
    e.target.value = '';
    $('choosePhotos').disabled = false;
    renderItems();
    markDraftChanged();
    $('btnPublish').disabled = false;
  }
});

$('addManualItem').addEventListener('click', () => {
  if (state.photos.length >= 12) { toast('最多 12 件商品'); return; }
  state.photos.push({ id: uuid(), name: '', price: '', condition: '', category: '其他', dataUrl: '', photo: '', status: 'available' });
  renderItems();
  markDraftChanged();
});

function renderItems() {
  const count = state.photos.length;
  $('photoCount').textContent = `${count} / 12 件`;
  $('photoTools').hidden = !count;
  $('sellNext').disabled = !count;
  $('sellShareStep').disabled = !count;
  $('uploadLabel').textContent = count ? '继续添加照片' : '添加商品照片';
  document.querySelector('.upload-card').classList.toggle('has-items', Boolean(count));
  $('itemEditor').innerHTML = state.photos.map((item, i) => `<div class="item-card" data-id="${esc(item.id)}">
    ${item.dataUrl || item.photo ? `<img class="item-thumb" src="${esc(item.dataUrl || item.photo)}" alt="商品 ${i + 1}" />` : '<div class="item-thumb image-fallback" aria-hidden="true">＋</div>'}
    <div class="item-fields">${item.uploadFailed ? '<span class="upload-failed">照片未上传成功，下次保存时会自动重试</span>' : ''}<div class="item-main-fields"><label>商品名称<input aria-label="第 ${i + 1} 件商品名称" data-field="name" maxlength="70" placeholder="这是什么？" value="${esc(item.name)}" /></label><label>价格 €<input aria-label="第 ${i + 1} 件商品价格" type="number" min="0" max="10000" step="0.01" data-field="price" value="${esc(item.price)}" placeholder="留空=待议" /></label><button type="button" class="remove-btn" data-remove="${esc(item.id)}" aria-label="删除第 ${i + 1} 件商品" title="删除商品">×</button></div>
    <details class="item-more"><summary>分类与成色<span>${esc(item.category || '其他')}${item.condition ? ' · 已填写成色' : ''}</span>${item.status !== 'available' ? ` <span class="pill gray">${statusNames[item.status] || ''}</span>` : ''}</summary><div class="field-grid"><label>分类<select data-field="category" aria-label="第 ${i + 1} 件商品分类">${itemCategories.map(c => `<option ${c === item.category ? 'selected' : ''}>${c}</option>`).join('')}</select></label><label>成色或说明<input data-field="condition" aria-label="第 ${i + 1} 件商品成色" maxlength="140" value="${esc(item.condition)}" placeholder="例如：九成新，送车锁" /></label></div></details></div></div>`).join('');
  renderListPreview();
}

function renderListPreview() {
  const items = state.photos;
  const cityName = cities[$('listingCity')?.value] || 'Delft';
  $('listPreview').innerHTML = `<div class="preview-cover"><span>${esc($('sellerName').value.trim() || '我的')} · ${esc(cityName)}</span><h3>${esc($('listingTitle').value.trim() || autoTitle() || `${cityName} 闲置`)}</h3><p>${esc($('pickup').value.trim() || '自取区域待填写')}</p></div><div class="preview-items">${items.length ? items.slice(0, 4).map(item => `<div class="preview-item">${item.dataUrl || item.photo ? `<img src="${esc(item.dataUrl || item.photo)}" alt="" />` : '<span class="preview-placeholder" aria-hidden="true">＋</span>'}<span>${esc(item.name || '待填写商品名')}<small>${item.status === 'available' ? '在售' : statusNames[item.status] || '在售'}</small></span><strong>${item.price === '' || item.price == null ? '待议' : Number(item.price) === 0 ? '免费' : '€' + esc(Number(item.price))}</strong></div>`).join('') : '<div class="preview-empty"><svg viewBox="0 0 80 80" aria-hidden="true"><path d="m15 22 25-12 25 12v35L40 70 15 57Z M15 22l25 13 25-13 M40 35v35 M28 16l25 13v15"/></svg>添加商品后，这里实时预览你的闲置清单</div>'}${items.length > 4 ? `<p class="hint">还有 ${items.length - 4} 件 · 生成的海报将包含全部商品</p>` : ''}</div><div class="preview-signature"><strong>荷包 · ${esc(cityName)}</strong><span>扫码看实时库存状态</span></div>`;
}

$('itemEditor').addEventListener('input', e => {
  const card = e.target.closest('[data-id]'), field = e.target.dataset.field;
  if (!card || !field) return;
  const item = state.photos.find(i => i.id === card.dataset.id);
  if (item) { item[field] = e.target.value; e.target.removeAttribute('aria-invalid'); markDraftChanged(); }
});
$('itemEditor').addEventListener('click', e => {
  const id = e.target.closest('[data-remove]')?.dataset.remove;
  if (!id) return;
  state.photos = state.photos.filter(i => i.id !== id);
  markDraftChanged();
  renderItems();
});
draftFields.forEach(id => {
  const el = $(id);
  el.addEventListener('input', e => { e.target.removeAttribute('aria-invalid'); markDraftChanged(); });
  el.addEventListener('change', e => { e.target.removeAttribute('aria-invalid'); markDraftChanged(); });
});

$('btnAnalyze').addEventListener('click', async () => {
  const photos = state.photos.filter(p => p.dataUrl && !p.name.trim());
  if (!photos.length) { toast('所有已传照片都已有名称；新增照片后可一键识别'); return; }
  if (!requireAuth(() => $('btnAnalyze').click())) return;
  const button = $('btnAnalyze');
  setBusy(button, true, 'AI 识别中…');
  $('btnPublish').disabled = true;
  try {
    // Batch in groups of 4 to stay well below Vercel's 4.5MB serverless body ceiling.
    for (let start = 0; start < photos.length; start += 4) {
      const batch = photos.slice(start, start + 4);
      button.textContent = `识别中 (${Math.min(start + batch.length, photos.length)}/${photos.length})…`;
      const resp = await fetch('/api/delft-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ photos: batch.map(x => x.dataUrl.split(',')[1]) }),
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.status === 401) {
        ['hebao_token', 'hebao_logged_in', 'hebao_email'].forEach(k => localStorage.removeItem(k));
        refreshLoginUI();
        throw new Error('登录已过期，请重新登录后使用 AI 识图');
      }
      if (!resp.ok) throw new Error(data.error || '识别暂时不可用，可继续手动填写');
      data.items?.forEach(result => {
        const item = batch[result.index];
        if (!item) return;
        if (!item.name.trim()) item.name = result.name;
        if (!item.condition) item.condition = result.condition;
      });
    }
    toast('已自动补全名称和成色，请核对价格');
  } catch (error) {
    toast(error.message);
  } finally {
    renderItems();
    markDraftChanged();
    setBusy(button, false);
    $('btnPublish').disabled = false;
  }
});

function validateDraft() {
  if (!state.photos.length) throw new Error('请先添加至少一件商品');
  let firstError = '';
  for (const [index, item] of state.photos.entries()) {
    const card = $('itemEditor').querySelector(`[data-id="${CSS.escape(item.id)}"]`);
    const missing = !item.name.trim();
    const invalid = item.price !== '' && item.price !== null && (!Number.isFinite(Number(item.price)) || Number(item.price) < 0 || Number(item.price) > 10000);
    card?.querySelector('[data-field="name"]')?.setAttribute('aria-invalid', String(missing));
    card?.querySelector('[data-field="price"]')?.setAttribute('aria-invalid', String(invalid));
    if (!firstError && missing) firstError = `第 ${index + 1} 件商品还没有填写名称`;
    if (!firstError && invalid) firstError = `第 ${index + 1} 件商品的价格须在 €0–10,000 之间`;
  }
  if (firstError) throw new Error(firstError);
}

function listingCopy() {
  validateDraft();
  const city = $('listingCity').value || 'delft';
  const cityName = cities[city] || 'Delft';
  const title = $('listingTitle').value.trim() || autoTitle() || `${cityName} 二手闲置`;
  const pickup = $('pickup').value.trim() || `${cityName}（具体地点私聊）`;
  const lines = [
    `📦 ${title}`,
    '',
    ...state.photos.map(i => `• ${i.name} ${i.price === '' || i.price == null ? '价格私聊' : Number(i.price) === 0 ? '免费赠送' : `€${Number(i.price)}`}${i.status !== 'available' ? `【${statusNames[i.status]}】` : ''}${i.condition ? `｜${i.condition}` : ''}`),
    '',
    `📍 自取：${cityName} · ${pickup}`,
  ];
  const note = $('listingNote').value.trim();
  if (note) lines.push(`💬 ${note}`);
  if (state.publishedId && !state.dirty) {
    lines.push('', `🔗 实时在售状态与高清大图：${listingShareLink(state.publishedId)}`);
    lines.push('售出商品会在链接内实时标为「已售出」，可直接点链接询问或微信私聊。');
  } else {
    lines.push('欢迎私信确认商品状态与自取时间。');
  }
  return lines.join('\n');
}

async function copyTextWithFallback(value, okMsg) {
  try {
    await navigator.clipboard.writeText(value);
    toast(okMsg);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = value;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.focus();
    area.select();
    const ok = document.execCommand?.('copy');
    area.remove();
    if (ok) { toast(okMsg); return true; }
    toast('浏览器限制自动复制，请手动长按选择复制');
    return false;
  }
}

$('btnCopy').addEventListener('click', () => {
  try { copyTextWithFallback(listingCopy(), '已复制微信群文案，打开微信粘贴即可'); }
  catch (error) { toast(error.message); }
});
$('copyPosterCopy')?.addEventListener('click', () => {
  try { copyTextWithFallback(listingCopy(), '已复制配套群发文案，回微信直接粘贴'); }
  catch (error) { toast(error.message); }
});

let posterUrl = '', posterFile;
function presentPosterModal(canvas, { fileName, altText, isListingPoster, hintText }) {
  // In WeChat WebView, data:image/jpeg guarantees native long-press "Save Image / Forward to Chat",
  // whereas blob: URLs and <a download> are frequently blocked by XWeb/WKWebView.
  if (isWeChat) {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.91);
    $('posterImage').src = dataUrl;
    $('posterImage').alt = altText;
    $('downloadPoster').hidden = true;
    $('sharePoster').hidden = true;
    $('copyPosterCopy').hidden = !isListingPoster;
    $('posterHint').textContent = '微信内请直接「长按上方海报图片」保存到手机或转发给朋友' + (isListingPoster ? '，再点下方复制配套群文案。' : '。');
    showModal('posterModal');
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) { reject(new Error('图片生成失败，请重试')); return; }
      if (posterUrl) URL.revokeObjectURL(posterUrl);
      posterUrl = URL.createObjectURL(blob);
      posterFile = new File([blob], fileName, { type: 'image/jpeg' });
      $('posterImage').src = posterUrl;
      $('posterImage').alt = altText;
      $('downloadPoster').href = posterUrl;
      $('downloadPoster').download = fileName;
      $('downloadPoster').hidden = false;
      $('copyPosterCopy').hidden = !isListingPoster;
      $('sharePoster').hidden = !navigator.canShare?.({ files: [posterFile] });
      $('posterHint').textContent = hintText;
      showModal('posterModal');
      resolve();
    }, 'image/jpeg', 0.92);
  });
}

$('btnPoster').addEventListener('click', async () => {
  const button = $('btnPoster');
  const city = $('listingCity').value || 'delft';
  const cityName = cities[city] || 'Delft';
  $('posterHeading').textContent = '微信分享海报';
  $('eventShareText').hidden = true;
  $('copyEventShare').hidden = true;
  try {
    validateDraft();
    setBusy(button, true, '海报生成中…');
    const draft = {
      city,
      title: $('listingTitle').value.trim(),
      pickup: $('pickup').value.trim(),
      seller: $('sellerName').value.trim(),
      items: state.photos.map(item => ({ ...item })),
      publishedId: state.publishedId,
      dirty: state.dirty,
    };
    const { canvas, missingPhotos, destination } = await createPoster(draft);
    trackEvent('poster_generate');
    const hint = (missingPhotos ? `${missingPhotos} 张照片暂未载入，可关闭后重试。` : '下载图片发到微信群，手机也可直接长按图片保存。') +
      (destination.published ? ' 海报二维码已绑定这份清单的实时库存状态。' : ' 提示：先点「发布到集市」再生成海报，二维码才能实时同步已售状态。');
    await presentPosterModal(canvas, {
      fileName: `荷包-${cityName}-闲置海报.jpg`,
      altText: '闲置分享海报',
      isListingPoster: true,
      hintText: hint,
    });
  } catch (error) {
    toast(error.message);
  } finally {
    setBusy(button, false);
  }
});

$('sharePoster').addEventListener('click', async () => {
  if (!posterFile) return;
  try { await navigator.share({ files: [posterFile], title: '荷包 · 分享海报' }); }
  catch (error) { if (error.name !== 'AbortError') toast('当前环境不支持直接拉起分享，请长按图片或下载保存'); }
});

function autoTitle() {
  const named = state.photos.map(item => item.name.trim()).filter(Boolean);
  if (!named.length) return '';
  return named.length === 1 ? named[0].slice(0, 100) : `${named[0].slice(0, 60)} 等 ${named.length} 件闲置`;
}

class UploadError extends Error {
  constructor(message, { auth = false, status = 0 } = {}) { super(message); this.auth = auth; this.status = status; }
}

async function uploadPhoto(item) {
  let resp;
  try {
    resp = await fetch('/api/delft-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ imageBase64: item.dataUrl.split(',')[1] }),
    });
  } catch { throw new UploadError('网络连接中断'); }
  // Vercel timeouts / 413s return HTML, so never assume a JSON body.
  const data = await resp.json().catch(() => ({}));
  if (resp.status === 401) {
    ['hebao_token', 'hebao_logged_in', 'hebao_email'].forEach(k => localStorage.removeItem(k));
    refreshLoginUI();
    throw new UploadError('登录已过期，请重新登录后再发布', { auth: true, status: 401 });
  }
  if (!resp.ok || !data.url) {
    throw new UploadError(data.error || (resp.status === 413 ? '照片太大' : resp.status >= 500 ? '图片服务暂时不可用' : '图片上传失败'), { status: resp.status });
  }
  return data.url;
}

/** Uploads pending photos (3 at a time). Returns the failures instead of aborting the whole publish. */
async function uploadPendingPhotos(onProgress) {
  const pending = state.photos.filter(it => it.dataUrl && !it.photo);
  const failures = [];
  let done = 0, cursor = 0;
  const worker = async () => {
    while (cursor < pending.length) {
      const item = pending[cursor++];
      try { item.photo = await uploadPhoto(item); item.uploadFailed = false; }
      catch (error) {
        if (error.auth) throw error;
        item.uploadFailed = true;
        failures.push({ item, error });
      }
      onProgress(++done, pending.length);
    }
  };
  if (pending.length) await Promise.all(Array.from({ length: Math.min(3, pending.length) }, worker));
  return failures;
}

$('btnPublish').addEventListener('click', async () => {
  if (state.saving) return;
  let controls = [];
  try {
    validateDraft();
    const city = $('listingCity').value || 'delft';
    if (!$('listingTitle').value.trim()) $('listingTitle').value = autoTitle();
    const seller = $('sellerName').value.trim(), pickup = $('pickup').value.trim(), title = $('listingTitle').value.trim();
    if (!seller || !pickup || !title) {
      const missing = !title ? 'listingTitle' : !seller ? 'sellerName' : 'pickup';
      $(missing).setAttribute('aria-invalid', 'true');
      $(missing).focus();
      toast(!seller ? '请填写昵称，方便买家称呼你' : !pickup ? '请填写自取区域（街区或地标即可）' : '请填写标题');
      return;
    }
    if (!requireAuth(() => $('btnPublish').click())) return;
    const button = $('btnPublish');
    setBusy(button, true, '发布中…');
    state.saving = true;
    controls = [...document.querySelectorAll('#panel-sell button,#panel-sell input,#panel-sell textarea,#panel-sell select')].map(el => ({ el, disabled: el.disabled }));
    controls.forEach(({ el }) => { el.disabled = true; });
    const failures = await uploadPendingPhotos((done, total) => { button.textContent = `上传照片 ${done}/${total}…`; });
    if (failures.length) {
      renderItems();
      const reason = failures[0].error.message;
      const proceed = await askDialog({
        title: `${failures.length} 张照片暂时未能上传`,
        message: `原因：${reason}。\n\n可以先发布商品文字信息（未成功的照片保存在草稿中，之后点「保存修改」会自动重传），或留在本页稍后重试。`,
        confirmText: '先不带失败照片发布',
        cancelText: '留在本页稍后再试',
      });
      if (!proceed) { toast('照片已保留在草稿中，稍后可再次点击发布'); return; }
    }
    button.textContent = '保存清单…';
    const items = state.photos.map(it => ({ id: it.id, name: it.name, price: it.price, condition: it.condition, category: it.category, photo: it.photo || '', status: it.status }));
    const published = await api(state.editingId ? 'updateListing' : 'createListing', 'POST', {
      city, seller, title, pickup, note: $('listingNote').value, items,
      ...(state.editingId ? { listingId: state.editingId, expectedUpdatedAt: state.editVersion } : {}),
    });
    const wasEditing = Boolean(state.editingId);
    state.publishedId = published.id;
    state.editingId = published.id;
    state.editVersion = published.updatedAt;
    // Keep failed photos marked dirty so the next save retries them.
    state.dirty = failures.length > 0;
    draftRevision++;
    await persistDraft();
    trackEvent('listing_publish');
    const shareLink = listingShareLink(published.id);
    const localHref = `/market?item=${encodeURIComponent(published.id)}`;
    $('shareResult').hidden = false;
    $('shareResult').innerHTML = `<strong>${wasEditing ? '修改已保存' : '已发布到集市！'}</strong>${failures.length ? `（${failures.length} 张照片未上传，可稍后再点「保存修改」重试）` : ''}<br>买家咨询会邮件通知你。现在可以直接点下方「生成微信海报」或「复制群文案」，二维码已绑定实时在售状态。<div class="result-actions"><a class="text-btn" href="${esc(localHref)}" target="_blank" rel="noopener">查看发布页 ↗</a><button type="button" class="text-btn" data-copy-share="${esc(shareLink)}">复制链接</button><button type="button" class="text-btn" data-tab="mine">去「我的」管理</button></div>`;
    localStorage.setItem('delft_nickname', seller);
    toast(wasEditing ? '修改已保存' : '发布成功！买家发消息会邮件通知你');
    if (state.activeTab === 'market' || state.listings.length) loadListings();
  } catch (error) {
    if (error.auth) { requireAuth(() => $('btnPublish').click()); }
    toast(error.message);
  } finally {
    controls.forEach(({ el, disabled }) => { el.disabled = disabled; });
    state.saving = false;
    setBusy($('btnPublish'), false);
    renderDraftMode();
  }
});
$('shareResult').addEventListener('click', e => {
  const link = e.target.closest('[data-copy-share]')?.dataset.copyShare;
  if (link) copyTextWithFallback(link, '链接已复制，发到微信会自动显示预览卡片');
});

// ---- Marketplace ----
let marketRequest = 0, searchTimer;
function updateMarketHeading() {
  const c = state.marketCity;
  $('marketHeading').textContent = !c || c === 'all'
    ? '在荷闲置'
    : c === 'zuid-holland'
      ? '南荷兰省闲置'
      : `${cities[c] || '在荷'} 闲置`;
}

$('marketCategories').innerHTML = ['', ...itemCategories].map(category =>
  `<button type="button" class="category-chip ${category ? '' : 'active'}" data-category="${category}" aria-pressed="${!category}">${category || '全部'}</button>`
).join('');

$('marketCategories').addEventListener('click', e => {
  const button = e.target.closest('[data-category]');
  if (!button) return;
  state.category = button.dataset.category;
  $('marketCategories').querySelectorAll('button').forEach(el => {
    const active = el.dataset.category === state.category;
    el.classList.toggle('active', active);
    el.setAttribute('aria-pressed', String(active));
  });
  clearTimeout(searchTimer);
  loadListings();
});

$('marketCity').addEventListener('change', () => {
  state.marketCity = $('marketCity').value;
  rememberCity(state.marketCity);
  updateMarketHeading();
  const url = new URL('/market', location.origin);
  if (state.marketCity !== 'all') url.searchParams.set('city', state.marketCity);
  history.replaceState(null, '', url);
  loadListings();
});

async function loadListings() {
  const request = ++marketRequest;
  $('marketSummary').textContent = '正在同步在售库存…';
  $('marketGrid').setAttribute('aria-busy', 'true');
  if (!state.listings.length) $('marketGrid').innerHTML = renderSkeletonMarket();
  try {
    const result = await api('listings', 'GET', null, false, {
      q: $('marketSearch').value.trim(),
      category: state.category,
      city: state.marketCity,
    });
    if (request !== marketRequest) return;
    state.listings = result.listings || [];
    renderMarket();
  } catch {
    if (request === marketRequest) {
      $('marketSummary').textContent = '商品加载失败';
      $('marketGrid').innerHTML = '<div class="empty-state error-state"><h2>暂时没能加载商品</h2><p>请检查网络后重试。</p><button type="button" class="outline-btn" data-retry-market>重新加载</button></div>';
    }
  } finally {
    if (request === marketRequest) $('marketGrid').setAttribute('aria-busy', 'false');
  }
}

const priceLabel = item => {
  const price = itemPrice(item);
  return price === null ? '价格待议' : price === 0 ? '免费赠送' : `€${price}`;
};

function renderMarket() {
  const sortMode = $('marketSort').value;
  const products = marketProducts(state.listings, {
    query: $('marketSearch').value,
    category: state.category,
    city: state.marketCity,
    sort: sortMode,
  });
  const root = $('marketGrid');
  const hasNegotiable = products.some(p => p.price === null);
  $('marketSummary').textContent = `${products.length} 件在售闲置${sortMode === 'price' && hasNegotiable ? ' · 待议商品已排在最后' : ''}`;
  const showCityTag = !state.marketCity || state.marketCity === 'all' || state.marketCity === 'zuid-holland';
  const hasFilter = Boolean(state.category || $('marketSearch').value.trim() || (state.marketCity && state.marketCity !== 'all'));

  root.innerHTML = products.length ? products.map(({ listing: l, item, price }) => {
    const cityTag = cities[l.city || 'delft'] || 'Delft';
    return `<article class="listing-card" role="button" tabindex="0" data-listing="${esc(l.id)}" data-product="${esc(item.id)}" aria-label="${esc(item.name)}，${esc(priceLabel(item))}，${esc(cityTag)} ${esc(l.pickup)}">
      ${item.photo ? `<img loading="lazy" class="listing-photo" src="${esc(item.photo)}" alt="${esc(item.name)}" />` : '<div class="listing-photo image-fallback" aria-hidden="true"><svg viewBox="0 0 80 80"><path d="m15 22 25-12 25 12v35L40 70 15 57Z M15 22l25 13 25-13 M40 35v35 M28 16l25 13v15"/></svg></div>'}
      <div class="listing-details"><div class="product-price ${price === null ? 'negotiable' : ''}">${esc(priceLabel(item))}</div><h2>${esc(item.name)}</h2><p class="product-condition">${esc(item.condition || item.category || '其他')}</p><div class="listing-bottom"><span>${showCityTag ? `<b class="city-badge">${esc(cityTag)}</b>` : ''}${esc(l.pickup)}</span><span>${esc(l.seller)}</span></div></div></article>`;
  }).join('') : `<div class="empty-state"><h2>${hasFilter ? '没有找到匹配的在售闲置' : '这一带闲置正在陆续上架'}</h2><p>${hasFilter ? '试试切换「全部城市」、清除分类筛选，或换个关键词。' : '有用不上的东西？拍张照 1 分钟就能发布，搬家清仓还能一键生成微信群海报。'}</p>${hasFilter ? '<button type="button" class="outline-btn" data-clear-market>查看全部在荷闲置</button>' : '<button type="button" class="primary-btn" data-tab="sell">＋ 发布闲置</button>'}</div>`;
}

$('marketGrid').addEventListener('click', e => {
  const card = e.target.closest('[data-listing]');
  if (card) openListing(card.dataset.listing, { itemId: card.dataset.product });
});
$('marketGrid').addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-listing]')) {
    e.preventDefault();
    openListing(e.target.dataset.listing, { itemId: e.target.dataset.product });
  }
});
$('marketGrid').addEventListener('error', e => {
  if (!e.target.matches('img.listing-photo')) return;
  const fallback = document.createElement('div');
  fallback.className = 'listing-photo image-fallback';
  fallback.setAttribute('aria-hidden', 'true');
  fallback.innerHTML = '<svg viewBox="0 0 80 80"><path d="m15 22 25-12 25 12v35L40 70 15 57Z M15 22l25 13 25-13 M40 35v35 M28 16l25 13v15"/></svg>';
  e.target.replaceWith(fallback);
}, true);
$('detailContent').addEventListener('error', e => {
  const btn = e.target.matches('img') && e.target.closest('.detail-photo-zoom');
  if (!btn) return;
  const fallback = document.createElement('div');
  fallback.className = 'item-thumb image-fallback';
  fallback.setAttribute('aria-hidden', 'true');
  fallback.textContent = '＋';
  btn.replaceWith(fallback);
}, true);
$('marketSort').addEventListener('change', renderMarket);
$('marketSearch').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadListings, 250); });

async function openListing(id, { itemId = null, updateUrl = true } = {}) {
  let listing;
  try { listing = (await api('listing', 'GET', null, false, { id })).listing; }
  catch (error) { toast(error.message); return; }
  state.currentListing = listing;
  state.currentProduct = itemId;
  const cityTag = cities[listing.city || 'delft'] || 'Delft';
  const selected = listing.items.find(item => item.id === itemId);
  const items = selected ? [selected, ...listing.items.filter(item => item.id !== itemId)] : listing.items;
  $('inquirySentNote').hidden = true;
  $('inquirySentNote').innerHTML = '';
  $('copyListingLink').textContent = selected ? '复制此商品链接' : '复制清单链接';
  $('detailContent').innerHTML = `<h2 id="detailHeading">${esc(listing.title)}</h2><p class="hint">${esc(listing.seller)} · 自取：${esc(cityTag)} · ${esc(listing.pickup)}</p>${listing.note ? `<p class="preserve-lines hint">${esc(listing.note)}</p>` : ''}<p class="hint">${listing.stale ? '超过 14 天未确认，请先发消息询问卖家是否仍在售' : '卖家最近确认：' + esc(dateText(listing.updatedAt))}</p>
    ${items.map(item => `<div class="detail-item ${item.id === itemId ? 'selected' : ''} ${item.status === 'sold' ? 'sold' : ''}">${item.photo ? `<button type="button" class="detail-photo-zoom" data-zoom-photo="${esc(item.photo)}" data-zoom-caption="${esc(item.name)} · ${esc(priceLabel(item))}" aria-label="点击放大查看「${esc(item.name)}」照片"><img src="${esc(item.photo)}" alt="${esc(item.name)}" /><span class="zoom-badge" aria-hidden="true">放大</span></button>` : '<div class="item-thumb image-fallback" aria-hidden="true">＋</div>'}
      <div><h3>${esc(item.name)}</h3><strong class="detail-price">${esc(priceLabel(item))}</strong>${item.condition ? `<p class="preserve-lines">${esc(item.condition)}</p>` : ''}${item.status === 'available' ? `<button type="button" class="text-btn" data-inquire="${esc(item.name)}">问问这件商品</button>` : ''}</div><span class="pill ${item.status === 'sold' ? 'gray' : ''}">${item.id === itemId ? '当前查看 · ' : ''}${statusNames[item.status] || '在售'}</span></div>`).join('')}`;
  $('inquiryText').value = selected?.status === 'available' ? `你好，请问「${selected.name}」还在吗？什么时候方便在 ${cityTag} 自取？` : '';
  document.title = `${selected ? selected.name + ' · ' : ''}${listing.title} · 荷包`;
  if (updateUrl) {
    const url = new URL('/market', location.origin);
    url.searchParams.set('item', id);
    if (itemId) url.searchParams.set('product', itemId);
    if (url.href !== location.href) history.pushState({ listingModal: true }, '', url);
  }
  showModal('detailModal');
}

$('detailContent').addEventListener('click', e => {
  const zoom = e.target.closest('[data-zoom-photo]');
  if (zoom) {
    $('lightboxImage').src = zoom.dataset.zoomPhoto;
    $('lightboxImage').alt = zoom.dataset.zoomCaption || '商品照片';
    $('lightboxCaption').textContent = zoom.dataset.zoomCaption || '';
    showModal('photoLightboxModal');
    return;
  }
  const button = e.target.closest('[data-inquire]');
  if (!button) return;
  $('inquirySentNote').hidden = true;
  $('inquiryText').value = `你好，请问「${button.dataset.inquire}」还在吗？什么时候方便自取？`;
  $('inquiryText').focus();
});
$('copyListingLink').addEventListener('click', () => {
  if (!state.currentListing) return;
  copyTextWithFallback(
    listingShareLink(state.currentListing.id, undefined, state.currentProduct || ''),
    '链接已复制（发到微信自带预览卡片）'
  );
});
$('reportListingBtn').addEventListener('click', () => {
  if (!state.currentListing) return;
  openReportModal({ targetType: 'listing', targetId: state.currentListing.id, label: `闲置清单「${state.currentListing.title}」` });
});
$('sendInquiry').addEventListener('click', async () => {
  if (!state.currentListing || !requireAuth(() => $('sendInquiry').click())) return;
  const content = $('inquiryText').value.trim();
  if (!content) { toast('请先输入想问卖家的内容'); return; }
  const button = $('sendInquiry');
  setBusy(button, true, '发送并通知卖家中…');
  try {
    await api('sendMessage', 'POST', { listingId: state.currentListing.id, content });
    trackEvent('inquiry_send');
    $('inquiryText').value = '';
    $('inquirySentNote').hidden = false;
    $('inquirySentNote').innerHTML = `<span><strong>✓ 已发送并邮件通知卖家</strong> · 卖家回复时也会邮件提醒你</span><button type="button" class="text-btn" id="gotoSentInbox">去「我的 → 私信」查看 →</button>`;
    $('gotoSentInbox').onclick = () => {
      hideModal('detailModal');
      mineView = 'messages';
      tab('mine');
    };
    toast('已发送并邮件通知卖家！');
  } catch (error) {
    toast(error.message);
  } finally {
    setBusy(button, false);
  }
});

// ---- Events & "Last-Mile" Coordination ----
const dateText = iso => new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Europe/Amsterdam', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit'
}).format(new Date(iso));

let selectedCity = 'zuid-holland', cityPeriod = 'fortnight', eventSource = 'community', activeActivity = '';
let feedEvents = cityEvents, feedUpdated = CITY_EVENTS_CHECKED, feedFailed = false, feedReady = false, feedRequest = 0;
let eventsRequest = 0, eventDraftTouched = false, eventsFailed = false, eventsReady = false;
const periodNames = { weekend: '本周末', fortnight: '未来两周', all: '近期' };

async function loadCityFeed() {
  const request = ++feedRequest;
  try {
    const feedUrl = new URL('./events-feed.json', import.meta.url).pathname;
    const response = await fetch(feedUrl, { cache: 'no-cache' });
    if (!response.ok) throw new Error();
    const data = await response.json(), ids = new Set();
    if (!Array.isArray(data.events) || !/^\d{4}-\d{2}-\d{2}$/.test(data.updatedAt)) throw new Error();
    for (const ev of data.events) {
      if (!Object.hasOwn(cities, ev.city) || !ev.id || ids.has(ev.id) || !ev.title || !Number.isFinite(Date.parse(ev.startsAt)) ||
        (ev.endsAt && !Number.isFinite(Date.parse(ev.endsAt))) || !/^https:\/\//.test(ev.sourceUrl)) throw new Error();
      ids.add(ev.id);
    }
    if (request !== feedRequest) return;
    feedEvents = data.events; feedUpdated = data.updatedAt; feedFailed = false;
  } catch {
    if (request !== feedRequest) return;
    feedFailed = true;
  }
  feedReady = true;
  renderCityEvents();
}

function discoveryUrl({ city = selectedCity, period = cityPeriod, source = eventSource, activity = '' } = {}) {
  const url = new URL('/events', location.origin);
  url.searchParams.set('city', city);
  url.searchParams.set('period', period);
  url.searchParams.set('source', source);
  if (activity) url.searchParams.set('activity', activity);
  return url;
}

function syncDiscoveryControls() {
  $('citySelect').value = selectedCity;
  for (const [group, key, value] of [['cityEventFilters', 'period', cityPeriod], ['eventSourceSwitch', 'source', eventSource]]) {
    for (const button of $(group).querySelectorAll('button')) {
      const active = button.dataset[key] === value;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
  }
  const catGroup = $('eventCategoryFilters');
  if (catGroup) {
    catGroup.hidden = eventSource !== 'community';
    for (const button of catGroup.querySelectorAll('button')) {
      const active = button.dataset.eventCat === state.eventCategory;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
  }
  $('communitySection').hidden = eventSource !== 'community';
  $('citySection').classList.toggle('companion-picks', eventSource === 'community');
}

function changeDiscovery(updates) {
  if (updates.city) rememberCity(updates.city);
  const url = discoveryUrl(updates);
  if (url.href !== location.href) history.pushState(null, '', url);
  const filters = discoveryFilters(url.searchParams);
  selectedCity = filters.city; cityPeriod = filters.period; eventSource = filters.source; activeActivity = '';
  syncDiscoveryControls(); renderCityEvents(); renderEvents();
}

function pickList(events, includeCity) {
  return `<div class="pick-list">${events.map((event, index) => activityCard(event, {
    includeCity, eager: index === 0, href: discoveryUrl({ activity: event.id }).href,
  })).join('')}</div>`;
}

function filterLink(text, updates) {
  return `<a class="text-btn" data-discovery-link href="${esc(discoveryUrl(updates).href)}">${esc(text)} →</a>`;
}

function renderCityEvents() {
  const detail = $('officialActivity'), browse = $('eventBrowse');
  browse.hidden = Boolean(activeActivity); detail.hidden = !activeActivity;
  $('panel-events').setAttribute('aria-labelledby', activeActivity ? 'activityTitle' : 'eventsHeading');
  const now = new Date();
  if (activeActivity) {
    const event = feedEvents.find(ev => ev.id === activeActivity);
    const query = new URLSearchParams(location.search);
    const hasListContext = history.state?.fromActivityList || query.has('city') || query.has('period');
    const returnUrl = hasListContext ? discoveryUrl() : discoveryUrl({ city: event?.city || selectedCity, period: 'all', source: 'city' });
    const content = activityDetailContent(event, { ready: feedReady, failed: feedFailed, now });
    if (state.activeTab === 'events') document.title = feedReady && event ? `${event.title} · 荷包` : siteTitle;
    const returnLabel = hasListContext && eventSource === 'community' ? '返回找搭子' : '返回城市活动';
    detail.innerHTML = `<a class="back-to-picks" data-activity-back href="${esc(returnUrl.href)}">← ${returnLabel}</a>${content}`;
    return;
  }
  if (state.activeTab === 'events') document.title = siteTitle;
  $('cityCheckedNote').textContent = eventSource === 'city' && feedReady ? `荷兰时间 · ${feedUpdated.slice(5).replace('-', '/')} 核对` : '荷兰当地时间';
  if (!feedReady) {
    $('cityCount').textContent = '';
    $('cityEvents').innerHTML = renderSkeletonEvents();
    return;
  }
  const { local, nearby, inPeriod } = citySelection(feedEvents, cityPeriod, now, selectedCity);
  const cityName = cityLabels[selectedCity] || '全部荷兰城市', scope = periodNames[cityPeriod];
  const multiCity = selectedCity === 'all' || selectedCity === 'zuid-holland';
  const dates = cityPeriod === 'weekend' ? `<span class="list-dates">${esc(weekendLabel(now))}</span>` : '';
  const status = feedFailed ? '<p class="feed-status" role="status">更新暂不可用，当前显示上次载入的活动。 <button type="button" class="text-btn" data-retry-feed>重试</button></p>' : '';
  $('cityCount').textContent = String(local.length);

  if (eventSource === 'community') {
    let picks = local, context = `${cityName} · ${scope}场馆与市政公开日历`, more = { source: 'city' };
    if (!picks.length && nearby.length) {
      picks = nearby; context = `周边城市 · ${scope}`; more = { source: 'city', city: 'all' };
    } else if (!picks.length && cityPeriod !== 'all') {
      picks = upcomingCityEvents(feedEvents, 'all', now, selectedCity);
      context = `${cityName} · 其他近期日期`; more = { source: 'city', period: 'all' };
    }
    if (!picks.length) {
      $('cityEvents').innerHTML = status + filterLink('查看全荷六城近期官方活动', { source: 'city', city: 'all', period: 'all' });
      return;
    }
    $('cityEvents').innerHTML = status +
      `<div class="companion-picks-box"><div class="companion-picks-head"><div><span class="picks-eyebrow">出游灵感 · 官方城市日历</span><h2>挑一场本地活动，一键发起同行小局</h2><p>${esc(context)}</p></div>${filterLink(`切到「城市活动」看全部 ${local.length || picks.length} 场`, more)}</div>` +
      pickList(picks.slice(0, 3), multiCity || more.city === 'all') + '</div>';
    return;
  }

  if (local.length) {
    $('cityEvents').innerHTML = status + `<div class="picks-heading"><h2>${esc(cityName)} · ${scope}</h2>${dates}</div>` + pickList(local, multiCity);
    return;
  }
  const links = [];
  if (cityPeriod !== 'all' && upcomingCityEvents(feedEvents, 'all', now, selectedCity).length) {
    links.push(filterLink(multiCity ? '看全部日期' : `看 ${cityName} 近期活动`, { period: 'all' }));
  }
  if (selectedCity !== 'all' && inPeriod.length) links.push(filterLink('看全部荷兰城市', { city: 'all' }));
  if (selectedCity === 'delft' && !links.length) links.push(`<a class="text-btn" href="${esc(CITY_AGENDA_URL)}" target="_blank" rel="noopener noreferrer">Delft 官方日历 ↗</a>`);
  if (!links.length) links.push('<button type="button" class="text-btn" data-create-event="coffee">自己发个邀约</button>');
  const empty = `<div class="pick-empty"><div class="picks-heading"><h2>${esc(cityName)} ${scope}暂无精选场次</h2>${dates}</div><div class="empty-actions">${links.join('')}</div></div>`;
  const suggestions = nearby.length ? `<section class="nearby-picks"><div class="picks-heading"><h2>周边城市推荐</h2><span class="list-dates">${nearby.length} 场</span></div>${pickList(nearby, true)}</section>` : '';
  $('cityEvents').innerHTML = status + empty + suggestions;
}

$('eventSourceSwitch').addEventListener('click', e => {
  const button = e.target.closest('[data-source]');
  if (button) changeDiscovery({ source: button.dataset.source });
});
$('cityEventFilters').addEventListener('click', e => {
  const button = e.target.closest('[data-period]');
  if (button) changeDiscovery({ period: button.dataset.period });
});
$('eventCategoryFilters')?.addEventListener('click', e => {
  const button = e.target.closest('[data-event-cat]');
  if (!button) return;
  state.eventCategory = button.dataset.eventCat;
  syncDiscoveryControls();
  renderEvents();
});
$('citySelect').addEventListener('change', () => changeDiscovery({ city: $('citySelect').value }));
$('panel-events').addEventListener('error', e => {
  if (e.target.matches('img')) e.target.closest('[data-activity-photo]')?.remove();
}, true);
$('panel-events').addEventListener('click', e => {
  const link = e.target.closest('a');
  if (link && (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return;
  if (link?.matches('[data-activity-link]')) {
    e.preventDefault();
    history.pushState({ fromActivityList: true }, '', link.href);
    activeActivity = link.dataset.activityLink;
    renderCityEvents();
    $('activityTitle')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    return;
  }
  if (link?.matches('[data-activity-back]')) {
    e.preventDefault();
    if (history.state?.fromActivityList) history.back();
    else { history.replaceState(null, '', link.href); applyRoute(); }
    return;
  }
  if (link?.matches('[data-discovery-link]')) {
    e.preventDefault();
    changeDiscovery(discoveryFilters(new URL(link.href).searchParams));
    $('citySelect').focus({ preventScroll: true });
    return;
  }
  if (e.target.closest('[data-clear-event-cat]')) {
    state.eventCategory = '';
    syncDiscoveryControls();
    renderEvents();
    return;
  }
  if (e.target.closest('[data-retry-feed]')) { loadCityFeed(); return; }
  const calBtn = e.target.closest('[data-calendar-activity]');
  if (calBtn) {
    const actEv = feedEvents.find(ev => ev.id === calBtn.dataset.calendarActivity);
    if (actEv) {
      downloadCalendarIcs({
        uid: `city-${actEv.id}`,
        title: actEv.title,
        startsAt: actEv.startsAt,
        endsAt: actEv.endsAt,
        location: eventPlace(actEv, true),
        description: `${actEv.price || actEv.fee || ''}\n官方详情：${actEv.sourceUrl}`.trim(),
        url: activityLink(actEv.id),
      }, `荷包-${actEv.id}.ics`);
      toast('已生成日历文件 (.ics)，打开即可加入手机日历');
    }
    return;
  }
  const button = e.target.closest('[data-share-activity],[data-city-meetup]');
  if (!button) return;
  const event = feedEvents.find(ev => ev.id === (button.dataset.shareActivity || button.dataset.cityMeetup));
  if (!event) return;
  if (button.hasAttribute('data-share-activity')) {
    $('activityShareTitle').textContent = event.title;
    $('activityShareUrl').value = activityLink(event.id);
    $('activityShareStatus').textContent = '';
    $('nativeActivityShare').hidden = isWeChat || typeof navigator.share !== 'function';
    showModal('activityShare');
    $('copyActivity').focus();
  } else if (Date.parse(event.startsAt) > Date.now()) {
    openEventForm(event);
  } else {
    renderCityEvents();
    toast('这场活动已经开始');
  }
});

function selectActivityLink() {
  const input = $('activityShareUrl');
  input.focus(); input.select(); input.setSelectionRange(0, input.value.length);
}
$('copyActivity').addEventListener('click', async () => {
  const ok = await copyTextWithFallback($('activityShareUrl').value, '活动链接已复制');
  $('activityShareStatus').textContent = ok ? '链接已复制，发到微信自带预览卡片。' : '链接已选中，请长按复制。';
  if (!ok) selectActivityLink();
});
$('nativeActivityShare').addEventListener('click', async () => {
  try { await navigator.share({ title: $('activityShareTitle').textContent, url: $('activityShareUrl').value }); }
  catch (error) { if (error.name !== 'AbortError') { selectActivityLink(); $('activityShareStatus').textContent = '可复制上方链接分享。'; } }
});

const meetupIdeas = {
  walk: { title: '周末老城散步聊聊天', category: '散步' },
  coffee: { title: '找人喝杯咖啡 / 练口语', category: '咖啡' },
};

async function openEventForm(officialEvent = null, idea = null, existingUserEvent = null) {
  const form = $('createEventForm');
  state.editingEventId = existingUserEvent ? existingUserEvent.id : null;
  $('createEventHeading').textContent = existingUserEvent ? '修改邀约集合安排' : '发个邀约';
  $('submitEventBtn').textContent = existingUserEvent ? '保存修改并邮件通知报名者' : '发布邀约';
  $('eventRulesCheckline').hidden = Boolean(existingUserEvent);
  form.elements.rules.required = !existingUserEvent;

  if (existingUserEvent) {
    form.reset();
    form.elements.title.value = existingUserEvent.title;
    form.elements.title.readOnly = true;
    form.elements.startsAt.value = amsterdamInput(existingUserEvent.startsAt);
    form.elements.capacity.value = String(existingUserEvent.capacity);
    form.elements.city.value = existingUserEvent.city || 'delft';
    form.elements.city.disabled = true;
    form.elements.place.value = existingUserEvent.place;
    form.elements.host.value = existingUserEvent.host;
    form.elements.host.readOnly = true;
    form.elements.category.value = existingUserEvent.category;
    form.elements.category.disabled = true;
    form.elements.contactHint.value = existingUserEvent.contactHint || '';
    form.elements.description.value = existingUserEvent.description || '';
    $('sourceEventNote').hidden = false;
    $('sourceEventNote').textContent = '修改集合时间、地点或联络方式后，系统会自动向所有已报名成员发送邮件提醒。';
    showModal('createEventBox');
    form.elements.place.focus({ preventScroll: true });
    return;
  }

  form.elements.title.readOnly = false;
  form.elements.city.disabled = false;
  form.elements.host.readOnly = false;
  form.elements.category.disabled = false;

  if ((officialEvent || idea) && eventDraftTouched) {
    const ok = await askDialog({
      title: '替换正在填写的草稿？',
      message: '套用新活动模板会覆盖你刚才在表单里填写的邀约内容。',
      confirmText: '替换草稿',
    });
    if (!ok) return;
  }
  if (idea) {
    form.reset();
    form.elements.title.value = idea.title;
    form.elements.category.value = idea.category;
    $('sourceEventNote').hidden = true;
  }
  if (!officialEvent && (!eventDraftTouched || idea)) {
    form.elements.city.value = Object.hasOwn(cities, selectedCity) ? selectedCity : 'delft';
  }
  if (idea) eventDraftTouched = true;
  if (officialEvent) {
    const draft = cityEventDraft(officialEvent);
    form.reset();
    Object.entries(draft).forEach(([key, value]) => { form.elements[key].value = value; });
    $('sourceEventNote').hidden = false;
    $('sourceEventNote').innerHTML = `可自由修改集合时间与碰头地点。 <a href="${esc(officialEvent.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看官方票务与安排 ↗</a>`;
    eventDraftTouched = true;
  }
  $('hostName').value = $('hostName').value || nickname();
  showModal('createEventBox');
  form.elements.title.focus({ preventScroll: true });
}

async function loadEvents() {
  const request = ++eventsRequest;
  $('eventsList').setAttribute('aria-busy', 'true');
  if (!eventsReady) $('eventsList').innerHTML = renderSkeletonEvents();
  try {
    const result = await api('events');
    if (request !== eventsRequest) return;
    state.events = result.events || [];
    eventsFailed = false;
    eventsReady = true;
    renderEvents();
  } catch {
    if (request === eventsRequest) { eventsFailed = true; renderEvents(); }
  } finally {
    if (request === eventsRequest) $('eventsList').setAttribute('aria-busy', 'false');
  }
}

function renderEvents() {
  $('meetupHelp').hidden = true;
  if (eventsFailed) {
    $('communityCount').textContent = '';
    $('eventsList').innerHTML = '<div class="invites-empty"><h2>邀约暂时没能加载</h2><button type="button" class="text-btn" data-retry-events>重新加载邀约</button></div>';
    return;
  }
  if (!eventsReady) {
    $('communityCount').textContent = '';
    $('eventsList').innerHTML = renderSkeletonEvents();
    return;
  }
  const now = new Date();
  const inScope = upcomingCityEvents(state.events, cityPeriod, now, selectedCity);
  const events = state.eventCategory ? inScope.filter(ev => ev.category === state.eventCategory) : inScope;
  const showCity = selectedCity === 'all' || selectedCity === 'zuid-holland';
  $('communityCount').textContent = String(inScope.length);

  if (!events.length) {
    if (state.eventCategory && inScope.length) {
      $('eventsList').innerHTML = `<div class="invites-empty"><div><h2>当前范围没有「${esc(state.eventCategory)}」类邀约</h2><p>还有 ${inScope.length} 场其他类别的同城邀约正在找人，或者你也可以直接发一个。</p></div><div class="invite-options"><button type="button" class="outline-btn" data-clear-event-cat>查看全部类别 (${inScope.length})</button><button type="button" class="primary-btn" id="emptyCreateCatBtn">＋ 发个${esc(state.eventCategory)}邀约</button></div></div>`;
      $('emptyCreateCatBtn')?.addEventListener('click', () => openEventForm(null, { title: '', category: state.eventCategory }));
      return;
    }
    const scope = cityLabels[selectedCity] || '当前范围', alternatives = [];
    if (cityPeriod !== 'all' && upcomingCityEvents(state.events, 'all', now, selectedCity).length) {
      alternatives.push(filterLink('看其他日期的邀约', { period: 'all', source: 'community' }));
    }
    if (selectedCity !== 'zuid-holland' && upcomingCityEvents(state.events, 'all', now, 'zuid-holland').length) {
      alternatives.push(filterLink('看南荷兰省活跃邀约', { city: 'zuid-holland', period: 'all', source: 'community' }));
    } else if (selectedCity !== 'all' && upcomingCityEvents(state.events, cityPeriod, now, 'all').length) {
      alternatives.push(filterLink('看全部荷兰城市邀约', { city: 'all', source: 'community' }));
    }
    const prompts = '<button type="button" class="outline-btn" data-create-event="walk">约人散步</button><button type="button" class="outline-btn" data-create-event="coffee">约杯咖啡</button>';
    $('eventsList').innerHTML = `<div class="invites-empty"><div><h2>${esc(scope)} · ${periodNames[cityPeriod]}暂无网友邀约</h2><p>${alternatives.length ? '可以切换范围查看已有邀约，或直接挑下方官方活动约伴。' : '下方已为你整理核对过的本地城市活动，点「约人一起去」即可一键成局。'}</p></div><div class="invite-options">${alternatives.length ? alternatives.join('') : prompts}</div></div>`;
    return;
  }

  $('meetupHelp').hidden = false;
  const metaIcon = {
    time: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    place: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/></svg>',
    host: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>',
  };
  $('eventsList').innerHTML = events.map(ev => `<article class="event-card">
    <div class="event-top"><span class="pill">${esc(ev.category)}</span><span class="pill ${ev.count >= ev.capacity ? 'gray' : ''}">${ev.count >= ev.capacity ? '已满员' : `差 ${ev.capacity - ev.count} 人（${ev.count}/${ev.capacity}）`}</span></div>
    <h2>${esc(ev.title)}</h2>
    <div class="event-capacity" aria-hidden="true"><i style="width:${Math.min(100, Math.round((ev.count / Math.max(1, ev.capacity)) * 100))}%"></i></div>
    <div class="event-meta"><span>${metaIcon.time}${esc(dateText(ev.startsAt))}（荷兰时间）</span><span>${metaIcon.place}${esc(eventPlace(ev, showCity))}</span><span>${metaIcon.host}${esc(ev.host)} 发起${ev.hasContactHint ? ' · 报名可见联络暗号' : ''}</span></div>
    ${ev.description ? `<details class="event-description"><summary>活动说明</summary><p class="preserve-lines">${esc(ev.description)}</p></details>` : ''}
    <div class="event-footer">
      <div class="line-actions" style="margin:0;gap:12px">
        <button type="button" class="text-btn" data-share-event="${esc(ev.id)}">生成邀请卡</button>
        ${ev.joined || ev.hostIsMe ? `<button type="button" class="text-btn" data-coord-event="${esc(ev.id)}">集合沟通${ev.messageCount ? ` (${ev.messageCount})` : ''}</button>` : `<button type="button" class="text-btn" data-report-event="${esc(ev.id)}" data-report-title="${esc(ev.title)}">举报</button>`}
      </div>
      <button type="button" class="${ev.joined ? 'outline-btn' : 'primary-btn'}" data-event="${esc(ev.id)}" ${ev.hostIsMe || (!ev.joined && ev.count >= ev.capacity) ? 'disabled' : ''}>${ev.hostIsMe ? '我发起的' : ev.joined ? '取消报名' : ev.count >= ev.capacity ? '已满员' : '报名参加'}</button>
    </div>
    ${ev.hostIsMe ? `<div class="event-footer"><button class="text-btn" type="button" data-attendees="${esc(ev.id)}">报名名单 (${ev.count - 1})</button><button class="text-btn" type="button" data-edit-event="${esc(ev.id)}">修改安排</button><button class="text-btn danger" type="button" data-cancel-event="${esc(ev.id)}">取消活动</button></div>` : ''}
  </article>`).join('');
}

function beginRsvp(id) {
  if (!requireAuth(() => beginRsvp(id))) return;
  const event = state.events.find(ev => ev.id === id);
  if (!event) return;
  state.currentEvent = event;
  $('rsvpName').value = nickname();
  showModal('rsvpModal');
}

async function openEventCoord(eventOrId) {
  if (!requireAuth(() => openEventCoord(eventOrId))) return;
  const id = typeof eventOrId === 'string' ? eventOrId : eventOrId.id;
  let ev = typeof eventOrId === 'object' ? eventOrId : state.events.find(x => x.id === id) || state.myEvents.find(x => x.id === id);
  try {
    if (!ev) ev = (await api('event', 'GET', null, true, { id })).event;
    const coord = await api('eventMessages', 'GET', null, true, { eventId: id });
    state.coordEvent = { ...ev, contactHint: coord.contactHint || '' };
    $('coordHeading').textContent = ev.title;
    $('coordMeta').textContent = `${dateText(ev.startsAt)}（荷兰时间） · ${eventPlace(ev, true)}${coord.cancelled ? ' · 【已取消】' : ''}`;
    $('coordCalendarBtn').hidden = Boolean(coord.cancelled);
    const contactBox = $('coordContactBox');
    if (coord.cancelled) {
      contactBox.hidden = false;
      contactBox.innerHTML = `<strong>本次活动已取消</strong><span>${esc(coord.cancelReason || '发起人已取消本次活动，请勿前往集合地点。')}</span>`;
    } else if (coord.contactHint) {
      contactBox.hidden = false;
      contactBox.innerHTML = `<strong>发起人预留的集合联络方式（仅报名成员可见）</strong><span class="preserve-lines">${esc(coord.contactHint)}</span>`;
    } else {
      contactBox.hidden = false;
      contactBox.innerHTML = `<strong>集合方式</strong><span>请按上方时间地点碰头，也可在下方行前留言区直接联系发起人和同行伙伴。</span>`;
    }
    const attendeesBox = $('coordAttendeesBox');
    if (Array.isArray(coord.attendees)) {
      attendeesBox.hidden = false;
      attendeesBox.innerHTML = `<strong>已报名成员（${coord.attendees.length} / ${Math.max(0, ev.capacity - 1)} 位名额）</strong><div class="attendee-pills">${coord.attendees.length ? coord.attendees.map(a => `<span class="pill">${esc(a.nickname)}</span>`).join('') : '<span class="hint">暂时还没有人报名，可生成邀请卡发到群里约伴</span>'}</div>`;
    } else {
      attendeesBox.hidden = true;
      attendeesBox.innerHTML = '';
    }
    const hostTools = $('coordHostTools');
    if (ev.hostIsMe && !coord.cancelled) {
      hostTools.hidden = false;
      hostTools.innerHTML = `<button type="button" class="outline-btn" id="coordEditBtn">修改时间/地点/联络暗号</button><button type="button" class="text-btn danger" id="coordCancelBtn">取消活动并邮件通知</button>`;
      $('coordEditBtn').onclick = () => { hideModal('eventCoordModal'); openEventForm(null, null, { ...ev, contactHint: coord.contactHint }); };
      $('coordCancelBtn').onclick = () => promptCancelEvent(ev.id);
    } else {
      hostTools.hidden = true;
      hostTools.innerHTML = '';
    }
    $('coordReplyForm').hidden = Boolean(coord.cancelled);
    renderCoordMessages(coord.messages || []);
    showModal('eventCoordModal');
  } catch (error) {
    toast(error.message);
  }
}

$('coordCalendarBtn').addEventListener('click', () => {
  const ev = state.coordEvent;
  if (!ev) return;
  downloadCalendarIcs({
    uid: `meetup-${ev.id}`,
    title: ev.title,
    startsAt: ev.startsAt,
    location: eventPlace(ev, true),
    description: [
      `发起人：${ev.host}`,
      ev.contactHint ? `集合联络：${ev.contactHint}` : '',
      ev.description || '',
    ].filter(Boolean).join('\n'),
    url: eventShareLink(ev.id),
  }, `荷包邀约-${ev.title.slice(0, 20)}.ics`);
  toast('已生成日历文件 (.ics)，打开即可加入手机日历');
});

function renderCoordMessages(messages) {
  const box = $('coordMessages');
  if (!messages.length) {
    box.innerHTML = '<p class="coord-empty">还没有行前留言。到了集合点、临时晚到几分钟或天气变化，都可以在这里说一声。</p>';
    return;
  }
  box.innerHTML = messages.map(m => `<div class="message-bubble ${m.fromMe ? 'mine' : ''}"><strong>${esc(m.nickname)}${m.isHost ? '（发起人）' : ''}</strong> · ${esc(dateText(m.createdAt))}<div class="preserve-lines">${esc(m.content)}</div></div>`).join('');
  box.scrollTop = box.scrollHeight;
}

$('coordReplyForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (!state.coordEvent) return;
  const input = $('coordMessageInput');
  const content = input.value.trim();
  if (!content) return;
  const btn = e.target.querySelector('[type=submit]');
  setBusy(btn, true, '发送中…');
  try {
    await api('sendEventMessage', 'POST', { eventId: state.coordEvent.id, content });
    input.value = '';
    const coord = await api('eventMessages', 'GET', null, true, { eventId: state.coordEvent.id });
    renderCoordMessages(coord.messages || []);
    loadEvents();
  } catch (error) {
    toast(error.message);
  } finally {
    setBusy(btn, false);
  }
});

async function promptCancelEvent(eventId) {
  if (!requireAuth()) return;
  const reason = await askDialog({
    title: '取消这场活动？',
    message: '取消后系统会自动向所有已报名成员发送邮件通知，请勿再前往集合点。',
    inputLabel: '取消原因（会附在通知邮件中）',
    inputPlaceholder: '例如：暴雨改下周 / 临时有事抱歉',
    inputValue: '因天气或临时安排调整取消，抱歉！',
    confirmText: '确认取消活动',
    danger: true,
  });
  if (reason === null) return;
  try {
    await api('cancelEvent', 'POST', { eventId, reason });
    hideModal('eventCoordModal');
    toast('活动已取消，已邮件通知报名成员');
    loadEvents();
    if (state.activeTab === 'mine') loadMine();
  } catch (error) {
    toast(error.message);
  }
}

$('eventsList').addEventListener('click', async e => {
  const share = e.target.closest('[data-share-event]');
  if (share) {
    const ev = state.events.find(x => x.id === share.dataset.shareEvent);
    if (!ev) return;
    try {
      const { canvas, url } = await createEventPoster(ev);
      trackEvent('poster_generate');
      $('eventShareText').value = `${ev.title}\n🕒 ${dateText(ev.startsAt)}（荷兰时间）\n📍 ${eventPlace(ev)}\n查看详情与报名：${url}`;
      $('eventShareText').hidden = true;
      $('copyEventShare').hidden = false;
      $('posterHeading').textContent = '分享同行邀请';
      await presentPosterModal(canvas, {
        fileName: '荷包-同行邀请.jpg',
        altText: '同行邀请海报与报名二维码',
        isListingPoster: false,
        hintText: '保存海报图片或点「复制邀请文案」，发到微信群即可约伴。',
      });
    } catch (error) { toast(error.message); }
    return;
  }
  const coordBtn = e.target.closest('[data-coord-event],[data-attendees]');
  if (coordBtn) {
    openEventCoord(coordBtn.dataset.coordEvent || coordBtn.dataset.attendees);
    return;
  }
  const editBtn = e.target.closest('[data-edit-event]');
  if (editBtn) {
    const ev = state.events.find(x => x.id === editBtn.dataset.editEvent);
    if (ev) openEventForm(null, null, ev);
    return;
  }
  const reportBtn = e.target.closest('[data-report-event]');
  if (reportBtn) {
    openReportModal({ targetType: 'event', targetId: reportBtn.dataset.reportEvent, label: `同城邀约「${reportBtn.dataset.reportTitle || ''}」` });
    return;
  }
  const cancel = e.target.closest('[data-cancel-event]');
  if (cancel) { promptCancelEvent(cancel.dataset.cancelEvent); return; }
  const button = e.target.closest('[data-event]');
  if (!button) return;
  const event = state.events.find(ev => ev.id === button.dataset.event);
  if (!event) return;
  if (event.joined) {
    if (!requireAuth()) return;
    const ok = await askDialog({
      title: '取消报名？',
      message: `取消「${event.title}」的报名后，空位将重新开放，并邮件告知发起人。`,
      confirmText: '确认取消报名',
      danger: true,
    });
    if (!ok) return;
    try { await api('cancelRsvp', 'POST', { eventId: event.id }); toast('已取消报名'); loadEvents(); }
    catch (error) { toast(error.message); }
    return;
  }
  beginRsvp(event.id);
});

$('confirmRsvp').addEventListener('click', async () => {
  const name = $('rsvpName').value.trim();
  if (!state.currentEvent || !name) { toast('请输入你在活动中的称呼'); return; }
  const button = $('confirmRsvp');
  setBusy(button, true, '报名中…');
  try {
    const targetId = state.currentEvent.id;
    await api('rsvp', 'POST', { eventId: targetId, nickname: name });
    localStorage.setItem('delft_nickname', name);
    trackEvent('event_rsvp');
    hideModal('rsvpModal');
    toast('报名成功！已解锁集合联络说明与行前沟通');
    await loadEvents();
    openEventCoord(targetId);
  } catch (error) {
    toast(error.message);
  } finally {
    setBusy(button, false);
  }
});

$('openCreateEvent').addEventListener('click', () => openEventForm());
$('createEventForm').addEventListener('input', () => { if (!state.editingEventId) eventDraftTouched = true; });
$('closeCreateEvent').addEventListener('click', () => hideModal('createEventBox'));
$('createEventForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (!requireAuth(() => $('createEventForm').requestSubmit())) return;
  const form = e.target;
  let startsAt;
  try { startsAt = amsterdamInstant(form.elements.startsAt.value); }
  catch (error) { toast(error.message); return; }
  const button = $('submitEventBtn');
  setBusy(button, true, state.editingEventId ? '保存中…' : '发布中…');
  try {
    if (state.editingEventId) {
      await api('updateEvent', 'POST', {
        eventId: state.editingEventId,
        startsAt: startsAt.toISOString(),
        capacity: Number(form.elements.capacity.value),
        place: form.elements.place.value,
        contactHint: form.elements.contactHint.value,
        description: form.elements.description.value,
      });
      hideModal('createEventBox');
      toast('活动安排已更新，已发邮件提醒报名成员');
      loadEvents();
      if (state.activeTab === 'mine') loadMine();
      return;
    }
    const cityVal = form.elements.city.value;
    const hostVal = form.elements.host.value;
    await api('createEvent', 'POST', {
      city: cityVal,
      title: form.elements.title.value,
      host: hostVal,
      category: form.elements.category.value,
      startsAt: startsAt.toISOString(),
      capacity: Number(form.elements.capacity.value),
      place: form.elements.place.value,
      contactHint: form.elements.contactHint.value,
      description: form.elements.description.value,
    });
    trackEvent('event_create');
    localStorage.setItem('delft_nickname', hostVal);
    hideModal('createEventBox');
    form.reset();
    eventDraftTouched = false;
    $('sourceEventNote').hidden = true;
    toast('邀约已发布！可点「生成邀请卡」发到微信群');
    changeDiscovery({ source: 'community', city: cityVal, period: 'all' });
    loadEvents();
  } catch (error) {
    toast(error.message);
  } finally {
    setBusy(button, false);
  }
});

// ---- My inventory, RSVPs + buyer/seller messages ----
let mineView = 'listings';
function renderMineView() {
  for (const [view, id] of [['listings', 'myListings'], ['events', 'myEvents'], ['messages', 'myMessages']]) {
    $(id).hidden = view !== mineView;
  }
  $('mineSwitch').querySelectorAll('button').forEach(button => {
    const active = button.dataset.mineView === mineView;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  if (mineView === 'messages' && state.unreadCount > 0 && token()) {
    api('markRead', 'POST', {}).then(res => updateUnreadBadges(res.unreadCount)).catch(() => {});
  }
}

$('mineSwitch').addEventListener('click', e => {
  const button = e.target.closest('[data-mine-view]');
  if (button) { mineView = button.dataset.mineView; renderMineView(); }
});

const mineError = '<div class="empty-state error-state"><h2>暂时没能加载</h2><p>请检查网络后重试。</p><button type="button" class="outline-btn" data-retry-mine>重新加载</button></div>';
async function loadMine() {
  refreshLoginUI();
  if (!token()) {
    state.myListings = [];
    for (const id of ['myListings', 'myEvents', 'myMessages']) $(id).innerHTML = '';
    return;
  }
  const session = token();
  const [mine, inbox] = await Promise.allSettled([api('mine'), api('messages')]);
  if (session !== token()) { loadMine(); return; }

  if (mine.status === 'fulfilled') {
    state.myListings = mine.value.listings || [];
    state.myEvents = mine.value.myEvents || [];
    updateUnreadBadges(mine.value.unreadCount);
    $('myListings').innerHTML = state.myListings.length ? state.myListings.map(l => `<div class="my-listing"><h2>${esc(l.title)}</h2><p class="hint">${esc(cities[l.city || 'delft'] || 'Delft')} · ${esc(l.pickup)}</p>
      ${l.items.map(item => `<div class="my-item"><span>${esc(item.name)}</span><select data-listing-id="${esc(l.id)}" data-item-id="${esc(item.id)}" aria-label="${esc(item.name)}的状态">${Object.entries(statusNames).map(([value, label]) => `<option value="${value}" ${item.status === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div>`).join('')}
      <div class="inventory-meta">${l.stale ? '超过 14 天未确认，已自动从集市隐藏（原分享链接仍可访问）' : '最近确认：' + esc(dateText(l.updatedAt))}</div><div class="inventory-actions"><button class="outline-btn" type="button" data-edit-listing="${esc(l.id)}">编辑 / 生成海报</button><button class="outline-btn" type="button" data-refresh-listing="${esc(l.id)}">确认仍在售</button><a href="/market?item=${encodeURIComponent(l.id)}">分享清单 ↗</a><button class="text-btn danger" type="button" data-delete-listing="${esc(l.id)}">删除</button></div></div>`).join('')
      : '<div class="empty-state"><h2>还没有发布闲置</h2><p>拍张照 1 分钟就能发布；卖出后在这里改状态，多件还能生成微信群海报。</p><button class="primary-btn" type="button" data-tab="sell">＋ 发布闲置</button></div>';

    $('myEvents').innerHTML = state.myEvents.length ? state.myEvents.map(event => `<div class="my-event">
      <div class="event-top">
        <span class="pill ${event.cancelled ? 'cancelled' : ''}">${event.cancelled ? '已取消' : event.hostIsMe ? '我发起的' : '已报名'}</span>
        <span class="hint">${event.count}/${event.capacity} 人</span>
      </div>
      <h2>${esc(event.title)}</h2>
      <p>${esc(dateText(event.startsAt))} · ${esc(eventPlace(event, true))}</p>
      ${event.cancelled && event.cancelReason ? `<p class="hint">取消说明：${esc(event.cancelReason)}</p>` : ''}
      <div class="inventory-actions" style="margin-top:12px">
        <button type="button" class="outline-btn" data-open-my-coord="${esc(event.id)}">查看集合联络与留言${event.messageCount ? ` (${event.messageCount})` : ''}</button>
        ${!event.cancelled ? `<a href="/events?event=${encodeURIComponent(event.id)}">活动主页 ↗</a>` : ''}
      </div>
    </div>`).join('')
      : '<div class="empty-state"><h2>还没有参加邀约</h2><p>报名或发起同城小局后，集合联络方式与行前留言会显示在这里。</p><button type="button" class="outline-btn" data-tab="events">去找搭子</button></div>';
  } else {
    $('myListings').innerHTML = mineError;
    $('myEvents').innerHTML = mineError;
  }

  if (inbox.status === 'fulfilled') {
    updateUnreadBadges(inbox.value.unreadCount);
    const threads = new Map();
    for (const m of inbox.value.messages) {
      const key = `${m.listingId}|${m.otherId}`;
      if (!threads.has(key)) threads.set(key, []);
      threads.get(key).push(m);
    }
    $('myMessages').innerHTML = threads.size ? [...threads.values()].map(thread => {
      const latest = thread[0];
      const peer = latest.otherLabel || '对方';
      const hasUnread = thread.some(m => m.unread);
      const ordered = [...thread].reverse();
      return `<div class="thread" data-thread-listing="${esc(latest.listingId)}" data-thread-user="${esc(latest.otherId)}">
        <div class="event-top"><div class="thread-title-group"><h2><button type="button" class="thread-listing-btn" data-open-thread-listing="${esc(latest.listingId)}">${esc(latest.listingTitle)} ↗</button>${hasUnread ? '<span class="pill unread-pill">新消息</span>' : ''}</h2><span class="pill gray">${esc(peer)}</span></div><button type="button" class="text-btn danger" data-report-thread="${esc(latest.id)}" data-report-title="${esc(latest.listingTitle)}">举报</button></div>
        ${ordered.map(m => `<div class="message-bubble ${m.fromMe ? 'mine' : ''}"><strong>${m.fromMe ? '我' : esc(m.otherLabel || peer)}</strong> · ${esc(dateText(m.createdAt))}<div class="preserve-lines">${esc(m.content)}</div></div>`).join('')}
        <form class="message-reply"><input name="message" maxlength="500" required aria-label="回复 ${esc(peer)}" placeholder="回复 ${esc(peer)}（系统会发邮件提醒）…" /><button type="submit" class="outline-btn">发送</button></form></div>`;
    }).join('')
      : '<div class="empty-state"><h2>还没有私信</h2><p>买家咨询或你的问询记录会显示在这里，并同步发送到你的邮箱。</p><button type="button" class="outline-btn" data-tab="market">逛逛闲置</button></div>';
  } else {
    $('myMessages').innerHTML = mineError;
  }
  renderMineView();
}

$('panel-mine').addEventListener('click', e => {
  if (e.target.closest('[data-retry-mine]')) loadMine();
});

$('myEvents').addEventListener('click', e => {
  const coord = e.target.closest('[data-open-my-coord]');
  if (coord) openEventCoord(coord.dataset.openMyCoord);
});

$('myListings').addEventListener('click', async e => {
  const edit = e.target.closest('[data-edit-listing]');
  if (edit) {
    if (state.photos.length && state.dirty) {
      const ok = await askDialog({
        title: '替换未保存的草稿？',
        message: '打开编辑这份闲置会替换你当前尚未发布的草稿。',
        confirmText: '继续编辑',
      });
      if (!ok) return;
    }
    try {
      const listing = (await api('listing', 'GET', null, true, { id: edit.dataset.editListing })).listing;
      state.photos = listing.items.map(item => ({ ...item, price: item.price == null ? '' : item.price, dataUrl: '' }));
      state.editingId = listing.id; state.editVersion = listing.updatedAt; state.publishedId = listing.id; state.dirty = false; draftRevision++;
      $('listingTitle').value = listing.title;
      $('listingCity').value = listing.city || 'delft';
      $('sellerName').value = listing.seller;
      $('pickup').value = listing.pickup;
      $('listingNote').value = listing.note;
      $('shareResult').hidden = true;
      renderItems(); renderDraftMode(); setSellStep(1); persistDraft(); tab('sell');
      toast('已载入清单，修改商品或到第 2 步生成最新海报');
    } catch (error) { toast(error.message); }
    return;
  }
  const refresh = e.target.closest('[data-refresh-listing]');
  if (refresh) {
    setBusy(refresh, true, '确认中…');
    try { await api('refreshListing', 'POST', { listingId: refresh.dataset.refreshListing }); toast('已确认仍在售，继续在集市展示 14 天'); loadMine(); }
    catch (error) { toast(error.message); }
    finally { setBusy(refresh, false); }
    return;
  }
  const id = e.target.closest('[data-delete-listing]')?.dataset.deleteListing;
  if (!id) return;
  const ok = await askDialog({
    title: '永久删除这份闲置？',
    message: '删除后该闲置清单、分享链接及关联私信将永久移除，无法恢复。',
    confirmText: '永久删除',
    danger: true,
  });
  if (!ok) return;
  try { await api('deleteListing', 'POST', { listingId: id }); if (state.editingId === id) resetDraft(); toast('已删除'); loadMine(); }
  catch (error) { toast(error.message); }
});

$('myListings').addEventListener('change', async e => {
  const select = e.target.closest('[data-item-id]');
  if (!select) return;
  select.disabled = true;
  try {
    const result = await api('updateStatus', 'POST', { listingId: select.dataset.listingId, itemId: select.dataset.itemId, status: select.value });
    if (state.editingId === select.dataset.listingId && !state.dirty) {
      const item = state.photos.find(it => it.id === select.dataset.itemId);
      if (item) item.status = select.value;
      state.editVersion = result.updatedAt; draftRevision++; renderItems(); persistDraft();
    }
    toast('商品状态已实时同步到分享链接');
    await loadMine();
  } catch (error) {
    toast(error.message); loadMine();
  } finally {
    select.disabled = false;
  }
});

$('myMessages').addEventListener('click', e => {
  const openBtn = e.target.closest('[data-open-thread-listing]');
  if (openBtn) {
    openListing(openBtn.dataset.openThreadListing, { updateUrl: false });
    return;
  }
  const rep = e.target.closest('[data-report-thread]');
  if (rep) openReportModal({ targetType: 'message', targetId: rep.dataset.reportThread, label: `私信对话「${rep.dataset.reportTitle || ''}」` });
});

$('myMessages').addEventListener('submit', async e => {
  const form = e.target.closest('.message-reply');
  if (!form) return;
  e.preventDefault();
  const thread = form.closest('[data-thread-listing]');
  const content = form.elements.message.value.trim();
  if (!content) return;
  const button = form.querySelector('[type=submit]');
  setBusy(button, true, '发送中…');
  try {
    await api('sendMessage', 'POST', { listingId: thread.dataset.threadListing, receiverId: thread.dataset.threadUser, content });
    toast('回复已发送并邮件提醒对方');
    loadMine();
  } catch (error) {
    toast(error.message);
  } finally {
    setBusy(button, false);
  }
});

// ---- Abuse Reporting, Feedback & GDPR Account Rights ----
function openReportModal({ targetType, targetId, label }) {
  state.reportTarget = { targetType, targetId };
  $('reportTargetLabel').textContent = `举报对象：${label}。核实违规后我们将立即下架处理。`;
  $('reportDetail').value = '';
  showModal('reportModal');
}

$('reportForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (!state.reportTarget) return;
  const btn = $('submitReportBtn');
  setBusy(btn, true, '提交中…');
  try {
    await api('reportContent', 'POST', {
      targetType: state.reportTarget.targetType,
      targetId: state.reportTarget.targetId,
      reason: $('reportReason').value,
      detail: $('reportDetail').value.trim(),
    }, Boolean(token()));
    hideModal('reportModal');
    toast('举报已收到，感谢你一起维护社区安全');
  } catch (error) {
    toast(error.message);
  } finally {
    setBusy(btn, false);
  }
});

$('openFeedbackBtn').addEventListener('click', () => {
  $('feedbackContact').value = $('feedbackContact').value || localStorage.getItem('hebao_email') || '';
  showModal('feedbackModal');
});

$('feedbackForm').addEventListener('submit', async e => {
  e.preventDefault();
  const content = $('feedbackContent').value.trim();
  if (!content) return;
  const btn = $('submitFeedbackBtn');
  setBusy(btn, true, '发送中…');
  try {
    await api('submitFeedback', 'POST', {
      category: $('feedbackCategory').value,
      content,
      contact: $('feedbackContact').value.trim(),
      page: location.pathname + location.search,
    }, Boolean(token()));
    $('feedbackContent').value = '';
    hideModal('feedbackModal');
    toast('已收到你的反馈，非常感谢！');
  } catch (error) {
    toast(error.message);
  } finally {
    setBusy(btn, false);
  }
});

$('exportDataBtn').addEventListener('click', async () => {
  if (!requireAuth()) return;
  const btn = $('exportDataBtn');
  setBusy(btn, true, '打包导出中…');
  try {
    const data = await api('exportMyData');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hebao-gdpr-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast('个人数据 JSON 已导出');
  } catch (error) {
    toast(error.message);
  } finally {
    setBusy(btn, false);
  }
});

$('deleteAccountBtn').addEventListener('click', async () => {
  if (!requireAuth()) return;
  const typed = await askDialog({
    title: '永久注销账号并删除数据',
    message: '警告：注销账号将立即永久删除你的全部闲置清单、邀约、私信记录及荷语云端进度，无法恢复。',
    inputLabel: '请输入大写 DELETE 确认删除：',
    inputPlaceholder: 'DELETE',
    confirmText: '永久注销并删除',
    danger: true,
  });
  if (typed !== 'DELETE') {
    if (typed !== null) toast('未输入大写 DELETE，已取消注销操作');
    return;
  }
  const btn = $('deleteAccountBtn');
  setBusy(btn, true, '正在清除数据…');
  try {
    await api('deleteAccount', 'POST', { confirm: 'DELETE' });
    ['hebao_token', 'hebao_logged_in', 'hebao_email', 'hebao_uuid', 'delft_nickname'].forEach(k => localStorage.removeItem(k));
    resetDraft();
    refreshLoginUI();
    loadMine();
    toast('账号及关联个人数据已全部永久删除');
  } catch (error) {
    toast(error.message);
  } finally {
    setBusy(btn, false);
  }
});

// ---- Startup & Route Synchronization ----
async function restoreDraft() {
  const revision = draftRevision;
  try {
    const saved = await readDraft();
    if (revision !== draftRevision) return;
    if (!saved || saved.version !== 1 || !Array.isArray(saved.photos)) {
      $('sellerName').value = nickname();
      renderListPreview();
      if (token()) restoreOrSyncCloudDraft();
      return;
    }
    if (saved.owner && saved.owner !== localStorage.getItem('hebao_uuid')) { resetDraft(); return; }
    state.photos = saved.photos.slice(0, 12);
    state.editingId = saved.editingId || null;
    state.editVersion = saved.editVersion || null;
    state.publishedId = saved.publishedId || null;
    state.dirty = Boolean(saved.dirty);
    draftFields.forEach(id => { if (typeof saved.fields?.[id] === 'string' && $(id)) $(id).value = saved.fields[id]; });
    renderItems(); renderDraftMode();
    $('draftStatus').textContent = state.dirty ? '已恢复上次草稿' : '已恢复已发布清单';
  } catch {
    $('draftStatus').textContent = '浏览器草稿暂不可用，仍可正常发布';
  }
}

refreshLoginUI();
renderItems();
restoreDraft();
refreshUnreadBadge();
if (!sessionStorage.getItem('hb_pv')) {
  sessionStorage.setItem('hb_pv', '1');
  trackEvent('page_view');
}

async function applyRoute() {
  const previousActivity = activeActivity, current = location.href, query = new URL(current).searchParams;
  if (!$('activityShare').hidden) hideModal('activityShare');
  const item = query.get('item'), event = query.get('event');
  const name = pageFromLocation(location);
  const prefCity = savedCity();

  if (name === 'mine' && ['listings', 'events', 'messages'].includes(query.get('view'))) {
    mineView = query.get('view');
  }
  if (name === 'market') {
    const qCity = query.get('city');
    if (qCity && (qCity === 'all' || qCity === 'zuid-holland' || Object.hasOwn(cities, qCity))) {
      state.marketCity = qCity;
      rememberCity(qCity);
    } else if (!qCity && prefCity) {
      state.marketCity = prefCity;
    }
    $('marketCity').value = state.marketCity;
    updateMarketHeading();
  }

  const filters = discoveryFilters(query);
  if (!query.has('city') && !event && !query.get('activity') && prefCity) {
    filters.city = prefCity;
  }
  selectedCity = filters.city; cityPeriod = filters.period; eventSource = filters.source;
  activeActivity = item || event ? '' : query.get('activity') || '';
  syncDiscoveryControls();
  if (!item && !$('detailModal').hidden) hideModal('detailModal', { updateUrl: false });
  await tab(name, { updateUrl: false });
  if (location.href !== current || state.activeTab !== name) return;

  const legal = legalModalFromLocation(location);
  if (legal) showModal(legal === 'privacy' ? 'privacyModal' : 'termsModal');

  if (item) await openListing(item, { itemId: query.get('product'), updateUrl: false });
  if (previousActivity && name === 'events' && !item && !event && !activeActivity) {
    $('cityEvents').querySelector(`[data-activity-link="${CSS.escape(previousActivity)}"]`)?.focus({ preventScroll: true });
  }
  if (event && !item && !eventsFailed) {
    const card = $('eventsList').querySelector(`[data-event="${CSS.escape(event)}"]`);
    if (card) {
      card.closest('.event-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      try {
        const single = (await api('event', 'GET', null, Boolean(token()), { id: event })).event;
        if (single?.cancelled) {
          toast(`活动「${single.title}」已取消${single.cancelReason ? '：' + single.cancelReason : ''}`);
        } else {
          toast('这场邀约已经结束，看看其他近期活动吧');
        }
      } catch {
        toast('这条邀约已结束或取消，可以看看其他邀约');
      }
    }
  }
}

window.addEventListener('popstate', applyRoute);
applyRoute();

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    refreshUnreadBadge();
    if (state.activeTab === 'events') { loadCityFeed(); renderEvents(); }
  }
});

$('copyEventShare').addEventListener('click', () => {
  copyTextWithFallback($('eventShareText').value, '同行邀请文案已复制，打开微信粘贴即可');
});

// Topbar elevation only after the page has scrolled, so the first screen stays calm.
let scrollTick = false;
const syncScrolled = () => { document.body.classList.toggle('is-scrolled', window.scrollY > 8); scrollTick = false; };
window.addEventListener('scroll', () => { if (!scrollTick) { scrollTick = true; requestAnimationFrame(syncScrolled); } }, { passive: true });
syncScrolled();
