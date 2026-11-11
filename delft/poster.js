import qrcode from './vendor/qrcode.mjs';
import { posterDestination } from './site-config.js';

const statusNames = { reserved: '已预订', sold: '已售出' };
const font = '"Noto Sans SC", system-ui, sans-serif';

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

export async function createPoster({ title, pickup, seller, items, publishedId, dirty }) {
  const layout = posterLayout(items.length), destination = posterDestination({ publishedId, dirty });
  const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = layout.height;
  const ctx = canvas.getContext('2d');
  await document.fonts.ready;
  ctx.fillStyle = '#f8f7f3'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#204f3d'; ctx.fillRect(0, 0, 1000, 190);
  ctx.fillStyle = '#c5d8cb'; ctx.font = `22px ${font}`;
  text(ctx, `${seller || 'Delft 邻居'}的闲置清单 · ${items.length} 件商品`, 48, 44, 900);
  ctx.fillStyle = '#fff'; ctx.font = `700 42px ${font}`;
  text(ctx, title || 'Delft 闲置出清', 48, 100, 904);
  ctx.fillStyle = '#deebe0'; ctx.font = `24px ${font}`;
  text(ctx, `自取 · ${pickup || 'Delft，具体地点私聊'}`, 48, 151, 904);

  const images = await Promise.all(items.map(item => loadImage(item.dataUrl || item.photo)));
  let missingPhotos = 0;
  items.forEach((item, index) => {
    const { columns, gap, left, width, cardHeight, photoHeight, top } = layout;
    const x = left + (index % columns) * (width + gap), y = top + Math.floor(index / columns) * (cardHeight + gap);
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y, width, cardHeight);
    if (images[index]) cover(ctx, images[index], x, y, width, photoHeight);
    else {
      if (item.dataUrl || item.photo) missingPhotos++;
      ctx.fillStyle = '#e5ebe2'; ctx.fillRect(x, y, width, photoHeight);
      ctx.fillStyle = '#778d7a'; ctx.font = `500 22px ${font}`; ctx.textAlign = 'center';
      ctx.fillText(item.dataUrl || item.photo ? '图片暂未载入' : '好物待认领', x + width / 2, y + photoHeight / 2);
      ctx.textAlign = 'left';
    }
    ctx.fillStyle = '#203c2d'; ctx.font = `600 25px ${font}`;
    text(ctx, item.name, x + 16, y + photoHeight + 36, width - 32, 2, 32);
    ctx.fillStyle = '#276b53'; ctx.font = `700 32px ${font}`;
    text(ctx, item.price === '' || item.price == null ? '价格私聊' : `€${Number(item.price)}`, x + 16, y + cardHeight - 21, width - 32);
    if (statusNames[item.status]) {
      ctx.fillStyle = '#204f3de8'; ctx.fillRect(x, y, width, 43);
      ctx.fillStyle = '#fff'; ctx.font = `600 23px ${font}`;
      ctx.fillText(statusNames[item.status], x + 16, y + 30);
    }
  });

  // Quiet, useful attribution: no watermark over the seller's photos.
  const y = layout.footerTop, qr = makeQr(destination.url), cell = 3, margin = 4;
  const size = (qr.getModuleCount() + margin * 2) * cell, qx = 952 - size, qy = y + 24;
  ctx.strokeStyle = '#d8e1d7'; ctx.beginPath(); ctx.moveTo(48, y); ctx.lineTo(952, y); ctx.stroke();
  ctx.fillStyle = '#526c5e'; ctx.font = `600 25px ${font}`;
  ctx.fillText('荷包 · Delft', 48, y + 47);
  ctx.font = `22px ${font}`; ctx.fillText(destination.label, 48, y + 83);
  ctx.fillStyle = '#697d70'; ctx.font = `18px ${font}`;
  text(ctx, destination.website, 48, y + 115, qx - 66);
  ctx.font = `17px ${font}`;
  text(ctx, destination.published ? '图片为发布时快照，最新库存请查看链接。' : '用荷包整理闲置 · 商品状态与卖家确认', 48, y + 153, qx - 66);
  ctx.fillStyle = '#fff'; ctx.fillRect(qx, qy, size, size);
  ctx.fillStyle = '#263d32';
  for (let row = 0; row < qr.getModuleCount(); row++) for (let col = 0; col < qr.getModuleCount(); col++) {
    if (qr.isDark(row, col)) ctx.fillRect(qx + (col + margin) * cell, qy + (row + margin) * cell, cell, cell);
  }
  return { canvas, missingPhotos, destination };
}
