import { cities, eventPlace, eventPosterNote } from './city-events.js';
import qrcode from './vendor/qrcode.mjs';
import { eventShareLink, posterDestination, resolveSiteOrigin } from './site-config.js';

const statusNames = { reserved: '已预订', sold: '已售出' };
const font = '"Plus Jakarta Sans", "PingFang SC", "Noto Sans SC", system-ui, sans-serif';
const serif = '"Newsreader", "Noto Serif SC", "Songti SC", Georgia, serif';

function drawDelftHeader(ctx, width, height) {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#091E3C');
  grad.addColorStop(0.55, '#13376B');
  grad.addColorStop(1, '#1C4B8F');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  // Refined porcelain-gold architectural accent hairline
  ctx.strokeStyle = 'rgba(235, 208, 146, 0.34)';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, width - 48, height - 48);
  // Gold bottom trim bar
  ctx.fillStyle = '#D9B566';
  ctx.fillRect(0, height - 5, width, 5);
}

export function posterLayout(count) {
  if (!Number.isInteger(count) || count < 1 || count > 12) throw new Error('海报需要 1–12 件商品');
  const columns = count === 1 ? 1 : count <= 4 ? 2 : 3;
  const gap = 20, left = 48, width = (1000 - left * 2 - (columns - 1) * gap) / columns;
  const photoHeight = columns === 1 ? 500 : columns === 2 ? 300 : 220;
  const cardHeight = photoHeight + 130, top = 226;
  const rows = Math.ceil(count / columns);
  const footerTop = top + rows * cardHeight + (rows - 1) * gap + 36;
  return { columns, gap, left, width, photoHeight, cardHeight, top, footerTop, height: footerTop + 210 };
}

function lines(ctx, value, maxWidth, maxLines = 1) {
  const result = []; let line = '';
  for (const character of String(value || '').replace(/\s+/g, ' ')) {
    if (ctx.measureText(line + character).width > maxWidth && line) {
      result.push(line); line = '';
      if (result.length === maxLines) {
        let last = result.pop();
        while (last && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
        result.push(last + '…'); return result;
      }
    }
    line += character;
  }
  if (line) result.push(line);
  return result;
}

function text(ctx, value, x, y, width, maxLines = 1, lineHeight = 34) {
  lines(ctx, value, width, maxLines).forEach((line, i) => ctx.fillText(line, x, y + i * lineHeight));
}

function loadImage(src) {
  return new Promise(resolve => {
    if (!src) return resolve(null);
    const image = new Image();
    if (!src.startsWith('data:')) image.crossOrigin = 'anonymous';
    let settled = false;
    const finish = value => { if (!settled) { settled = true; clearTimeout(timer); resolve(value); } };
    const timer = setTimeout(() => finish(null), 8000);
    image.onload = () => finish(image); image.onerror = () => finish(null); image.src = src;
  });
}

function cover(ctx, image, x, y, w, h) {
  const scale = Math.max(w / image.width, h / image.height);
  const dw = image.width * scale, dh = image.height * scale;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); ctx.restore();
}

export function makeQr(value) {
  const code = qrcode(0, 'M'); code.addData(value); code.make(); return code;
}

export async function createPoster({ city = 'delft', title, pickup, seller, items, publishedId, dirty }) {
  const cityName = cities[city] || 'Delft';
  const layout = posterLayout(items.length), destination = posterDestination({ publishedId, dirty });
  const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = layout.height;
  const ctx = canvas.getContext('2d');
  await document.fonts.ready;
  ctx.fillStyle = '#F8F7F4'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawDelftHeader(ctx, 1000, 192);
  ctx.fillStyle = '#F1D99B'; ctx.font = `600 21px ${font}`;
  text(ctx, `${seller || `${cityName} 卖家`}的闲置清单 · ${items.length} 件商品`, 54, 62, 892);
  ctx.fillStyle = '#FFFFFF'; ctx.font = `700 41px ${serif}`;
  text(ctx, title || `${cityName} 闲置出清`, 54, 115, 892);
  ctx.fillStyle = '#D3E2F7'; ctx.font = `500 22px ${font}`;
  text(ctx, `自取 · ${cityName} · ${pickup || '具体地点私聊'}`, 54, 158, 892);

  const images = await Promise.all(items.map(item => loadImage(item.dataUrl || item.photo)));
  let missingPhotos = 0;
  items.forEach((item, index) => {
    const { columns, gap, left, width, cardHeight, photoHeight, top } = layout;
    const x = left + (index % columns) * (width + gap), y = top + Math.floor(index / columns) * (cardHeight + gap);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x, y, width, cardHeight);
    ctx.strokeStyle = '#DCE4F0'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, width, cardHeight);
    if (images[index]) cover(ctx, images[index], x, y, width, photoHeight);
    else {
      if (item.dataUrl || item.photo) missingPhotos++;
      ctx.fillStyle = '#EDF2F9'; ctx.fillRect(x, y, width, photoHeight);
      ctx.fillStyle = '#6E82A0'; ctx.font = `500 22px ${font}`; ctx.textAlign = 'center';
      ctx.fillText(item.dataUrl || item.photo ? '图片暂未载入' : '好物待认领', x + width / 2, y + photoHeight / 2);
      ctx.textAlign = 'left';
    }
    ctx.fillStyle = '#111E33'; ctx.font = `600 25px ${font}`;
    text(ctx, item.name, x + 16, y + photoHeight + 36, width - 32, 2, 32);
    ctx.fillStyle = '#1C4B8F'; ctx.font = `700 32px ${font}`;
    text(ctx, item.price === '' || item.price == null ? '价格私聊' : Number(item.price) === 0 ? '免费赠送' : `€${Number(item.price)}`, x + 16, y + cardHeight - 21, width - 32);
    if (statusNames[item.status]) {
      ctx.fillStyle = 'rgba(15, 39, 77, 0.88)'; ctx.fillRect(x, y, width, 43);
      ctx.fillStyle = '#F7E7BE'; ctx.font = `600 22px ${font}`;
      ctx.fillText(statusNames[item.status], x + 16, y + 30);
    }
  });

  const y = layout.footerTop, qr = makeQr(destination.url), cell = 3, margin = 4;
  const size = (qr.getModuleCount() + margin * 2) * cell, qx = 952 - size, qy = y + 24;
  ctx.strokeStyle = '#D9E1EE'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(48, y); ctx.lineTo(952, y); ctx.stroke();
  ctx.fillStyle = '#14386E'; ctx.font = `700 25px ${serif}`;
  ctx.fillText(`荷包 · ${cityName} 闲置`, 48, y + 48);
  ctx.fillStyle = '#334560'; ctx.font = `500 21px ${font}`; ctx.fillText(destination.label, 48, y + 84);
  ctx.fillStyle = '#617087'; ctx.font = `500 18px ${font}`;
  text(ctx, destination.website, 48, y + 116, qx - 66);
  ctx.font = `17px ${font}`;
  text(ctx, destination.published ? '售出后卖家在网页一键改状态，扫码即看最新库存。' : '在荷包免费生成清仓海报 · 支持实时更新已出状态', 48, y + 153, qx - 66);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(qx, qy, size, size);
  ctx.strokeStyle = '#DCE4F0'; ctx.strokeRect(qx, qy, size, size);
  ctx.fillStyle = '#10284D';
  for (let row = 0; row < qr.getModuleCount(); row++) for (let col = 0; col < qr.getModuleCount(); col++) {
    if (qr.isDark(row, col)) ctx.fillRect(qx + (col + margin) * cell, qy + (row + margin) * cell, cell, cell);
  }
  return { canvas, missingPhotos, destination };
}

export async function createEventPoster(event) {
  const shareUrl = eventShareLink(event.id);
  const hostLabel = new URL(resolveSiteOrigin()).hostname;
  const isOnline = event.mode === 'online' || event.city === 'online';
  const isFlex = event.scheduleType === 'flexible';
  const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = 1100;
  await document.fonts.ready; const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#F8F7F4'; ctx.fillRect(0, 0, 1000, 1100);
  drawDelftHeader(ctx, 1000, 332);
  ctx.fillStyle = '#F1D99B'; ctx.font = `600 24px ${font}`;
  ctx.fillText(isOnline ? '荷包 · 全荷线上找搭子' : '荷包 · 同城找搭子邀请卡', 64, 84);
  ctx.fillStyle = '#FFFFFF'; ctx.font = `700 48px ${serif}`; text(ctx, event.title, 64, 158, 872, 3, 64);
  const dateLine = isFlex
    ? `灵活约伴 · ${event.scheduleNote || '时间可商量'}`
    : `${new Intl.DateTimeFormat('zh-CN', { timeZone: 'Europe/Amsterdam', month: 'long', day: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(event.startsAt))}（荷兰时间）`;
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(60, 378, 880, 166);
  ctx.strokeStyle = '#DCE4F0'; ctx.lineWidth = 1.5; ctx.strokeRect(60, 378, 880, 166);
  ctx.fillStyle = isOnline ? '#0E7490' : '#1C4B8F'; ctx.fillRect(60, 378, 8, 166);
  ctx.fillStyle = '#111E33'; ctx.font = `700 31px ${font}`; text(ctx, dateLine, 92, 438, 824, 2, 42);
  ctx.fillStyle = '#334560'; ctx.font = `500 28px ${font}`; text(ctx, eventPlace(event), 92, 504, 824, 2, 40);
  const tagsSuffix = Array.isArray(event.tags) && event.tags.length ? ` · ${event.tags.slice(0, 3).join(' / ')}` : '';
  ctx.fillStyle = '#1C4B8F'; ctx.font = `600 26px ${font}`; text(ctx, `${event.host} 发起 · 当前 ${event.count}/${event.capacity} 人${tagsSuffix}`, 64, 608, 872);
  ctx.fillStyle = '#4B5E78'; ctx.font = `500 24px ${font}`; text(ctx, eventPosterNote(event), 64, 668, 872, 3, 40);
  const qr = makeQr(shareUrl), cell = 4, margin = 4, size = (qr.getModuleCount() + 8) * cell, qx = 940 - size, qy = 848;
  ctx.strokeStyle = '#D9E1EE'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(60, 818); ctx.lineTo(940, 818); ctx.stroke();
  ctx.fillStyle = '#14386E'; ctx.font = `700 28px ${serif}`; ctx.fillText(isOnline ? '长按识别二维码加入组队' : '长按识别二维码报名同行', 60, 885);
  ctx.fillStyle = '#334560'; ctx.font = `600 22px ${font}`; ctx.fillText(`荷包 · ${hostLabel}`, 60, 934);
  ctx.fillStyle = '#617087'; ctx.font = `500 18px ${font}`; ctx.fillText('实时人数、联络方式与动态以网页为准', 60, 978);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(qx, qy, size, size);
  ctx.strokeStyle = '#DCE4F0'; ctx.strokeRect(qx, qy, size, size);
  ctx.fillStyle = '#10284D';
  for (let r = 0; r < qr.getModuleCount(); r++) for (let c = 0; c < qr.getModuleCount(); c++) {
    if (qr.isDark(r, c)) ctx.fillRect(qx + (c + margin) * cell, qy + (r + margin) * cell, cell, cell);
  }
  return { canvas, url: shareUrl };
}

export async function createStudyPoster({
  badge = '荷包 · 荷兰语备考打卡',
  title = '荷兰语 A2 练习完成',
  subtitle = '',
  stat = '',
  highlights = [],
  footerHint = '扫码免费刷 DUO A2 模拟卷、AI 批改写作与每日荷语简报',
  targetPath = '/dutch-a2?from=study_card',
} = {}) {
  const origin = resolveSiteOrigin();
  const shareUrl = `${origin}${targetPath.startsWith('/') ? targetPath : `/${targetPath}`}`;
  const hostLabel = new URL(origin).hostname;
  const rows = (Array.isArray(highlights) ? highlights : []).filter(Boolean).slice(0, 5);
  const qr = makeQr(shareUrl);
  const cell = 4, margin = 4;
  const size = (qr.getModuleCount() + margin * 2) * cell;
  const contentEndY = 390 + (stat ? 130 : 0) + (rows.length ? (rows.length - 1) * 82 + 78 : 0);
  const footerY = Math.max(820, contentEndY + 42);
  const totalHeight = Math.max(1140, footerY + Math.max(size + 76, 260));

  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = totalHeight;
  await document.fonts.ready;
  const ctx = canvas.getContext('2d');

  // Warm porcelain base + Delft cobalt header with fine gold frame
  ctx.fillStyle = '#F8F7F4';
  ctx.fillRect(0, 0, 1000, totalHeight);
  drawDelftHeader(ctx, 1000, 340);

  ctx.fillStyle = '#F1D99B';
  ctx.font = `600 23px ${font}`;
  ctx.fillText(badge, 64, 80);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 46px ${serif}`;
  text(ctx, title, 64, 152, 872, 2, 60);

  if (subtitle) {
    ctx.fillStyle = '#D5E4F7';
    ctx.font = `500 25px ${font}`;
    text(ctx, subtitle, 64, 278, 872, 1, 36);
  }

  // Highlight stat banner
  let y = 390;
  if (stat) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(60, y, 880, 102);
    ctx.strokeStyle = '#DCE4F0';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, y, 880, 102);
    ctx.fillStyle = '#D9B566';
    ctx.fillRect(60, y, 880, 4);
    ctx.fillStyle = '#14386E';
    ctx.font = `700 33px ${font}`;
    text(ctx, stat, 92, y + 64, 816, 1, 40);
    y += 130;
  }

  // Key highlights / vocab / breakdown rows
  rows.forEach((line, idx) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(60, y, 880, 68);
    ctx.strokeStyle = '#E4EAF3';
    ctx.lineWidth = 1;
    ctx.strokeRect(60, y, 880, 68);
    ctx.fillStyle = '#1C4B8F';
    ctx.fillRect(60, y, 7, 68);
    ctx.fillStyle = '#111E33';
    ctx.font = `500 25px ${font}`;
    text(ctx, line, 90, y + 43, 826, 1, 32);
    y += idx < rows.length - 1 ? 82 : 78;
  });

  // Footer + QR
  const qx = 940 - size, qy = footerY + 28;
  ctx.strokeStyle = '#D9E1EE';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, footerY);
  ctx.lineTo(940, footerY);
  ctx.stroke();

  ctx.fillStyle = '#14386E';
  ctx.font = `700 28px ${serif}`;
  ctx.fillText(`荷包 · ${hostLabel}`, 60, footerY + 62);
  ctx.fillStyle = '#3B4F6B';
  ctx.font = `500 22px ${font}`;
  text(ctx, footerHint, 60, footerY + 108, qx - 90, 2, 34);
  ctx.fillStyle = '#6B7D96';
  ctx.font = `500 18px ${font}`;
  ctx.fillText('长按识别右侧二维码立即免费体验', 60, footerY + 194);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qx, qy, size, size);
  ctx.strokeStyle = '#DCE4F0';
  ctx.strokeRect(qx, qy, size, size);
  ctx.fillStyle = '#10284D';
  for (let r = 0; r < qr.getModuleCount(); r++) for (let c = 0; c < qr.getModuleCount(); c++) {
    if (qr.isDark(r, c)) ctx.fillRect(qx + (c + margin) * cell, qy + (r + margin) * cell, cell, cell);
  }
  return { canvas, url: shareUrl };
}
