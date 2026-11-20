import {amsterdamInput, cities, eventPlace} from './city-events.js';

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
})[char]);
const esc = escapeHtml;
const weekdays = new Intl.DateTimeFormat('zh-CN', {timeZone:'Europe/Amsterdam', weekday:'short'});
const fullDate = new Intl.DateTimeFormat('zh-CN', {
  timeZone:'Europe/Amsterdam', year:'numeric', month:'long', day:'numeric', weekday:'long',
});

function timeRange(event) {
  const start = amsterdamInput(event.startsAt);
  if (!event.endsAt) return start.slice(11);
  const end = amsterdamInput(event.endsAt);
  const dayDifference = (Date.parse(end.slice(0, 10)) - Date.parse(start.slice(0, 10))) / 86400000;
  let endTime = end.slice(11);
  if (dayDifference === 1) endTime = `次日 ${endTime}`;
  else if (dayDifference > 1) endTime = `${Number(end.slice(5, 7))} 月 ${Number(end.slice(8, 10))} 日 ${endTime}`;
  return `${start.slice(11)}–${endTime}`;
}

function imageUrl(event) {
  try {
    const url = new URL(event.imageUrl);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

export function activityCard(event, {includeCity, href, eager = false}) {
  const local = amsterdamInput(event.startsAt), image = imageUrl(event);
  const month = Number(local.slice(5, 7)), day = local.slice(8, 10);
  return `<article class="pick-card">
    <time class="pick-date" datetime="${esc(event.startsAt)}" aria-label="${month} 月 ${Number(day)} 日">
      <span>${month} 月</span><strong>${day}</strong>
    </time>
    <div class="pick-body">
      <div class="pick-meta"><span>${esc(weekdays.format(new Date(event.startsAt)))} ${esc(timeRange(event))}</span><span>${esc(includeCity ? cities[event.city] : event.category)}</span></div>
      <h3><a data-activity-link="${esc(event.id)}" href="${esc(href)}">${esc(event.title)}</a></h3>
      <p class="pick-place">${esc(eventPlace(event, includeCity))}</p>
      <p class="pick-fee">${esc(event.fee || event.price)}</p>
    </div>
    ${image ? `<div class="pick-photo" data-activity-photo><img src="${esc(image)}" alt="${esc(event.imageAlt || '')}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" referrerpolicy="no-referrer" width="360" height="240"></div>` : ''}
    <div class="pick-actions"><button type="button" class="text-btn" data-share-activity="${esc(event.id)}" aria-label="分享「${esc(event.title)}」">分享</button><button type="button" class="outline-btn" data-city-meetup="${esc(event.id)}">约同行</button></div>
  </article>`;
}

function activityDetails(event, started) {
  const image = imageUrl(event);
  return `<article class="activity-detail">
    <div class="detail-lead"><p class="activity-kicker">${esc(cities[event.city])} · ${esc(event.category)}</p>
      <h1 id="activityTitle" tabindex="-1">${esc(event.title)}</h1>
      ${event.originalTitle && event.originalTitle !== event.title ? `<p class="original-title">${esc(event.originalTitle)}</p>` : ''}
    </div>
    ${image ? `<figure class="detail-photo" data-activity-photo><img src="${esc(image)}" alt="${esc(event.imageAlt || '')}" referrerpolicy="no-referrer"><figcaption>图片来自 ${esc(event.imageCredit || event.sourceName)}</figcaption></figure>` : ''}
    <dl class="activity-facts">
      <div><dt>荷兰时间</dt><dd>${esc(fullDate.format(new Date(event.startsAt)))} · ${esc(timeRange(event))}${started ? '（已开始）' : ''}</dd></div>
      <div><dt>地点</dt><dd>${esc(eventPlace(event))}</dd></div>
      <div><dt>费用</dt><dd>${esc(event.price || event.fee)}</dd></div>
    </dl>
    ${event.description || event.summary ? `<p class="activity-description">${esc(event.description || event.summary)}</p>` : ''}
    <div class="activity-buttons"><a class="primary-btn" href="${esc(event.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看官方详情 ↗</a>
      ${started ? '' : `<button class="outline-btn" type="button" data-city-meetup="${esc(event.id)}">约同行</button>`}
      <button class="text-btn" type="button" data-share-activity="${esc(event.id)}">分享给朋友</button>
    </div>
    <p class="source-byline">${esc(event.sourceName)} · ${esc(event.checkedOn)} 核对</p>
  </article>`;
}

export function activityDetailContent(event, {ready, failed, now}) {
  if (!ready) return '<h1 id="activityTitle" tabindex="-1">正在加载活动…</h1>';
  if (!event) {
    if (failed) return '<h1 id="activityTitle" tabindex="-1">活动暂时未能加载</h1><button type="button" class="outline-btn" data-retry-feed>重新加载</button>';
    return '<h1 id="activityTitle" tabindex="-1">这场活动已移出精选或链接有误</h1><p>可以返回列表，看看近期还有什么活动。</p>';
  }
  const content = activityDetails(event, Date.parse(event.startsAt) <= now.getTime());
  const warning = failed ? '<p class="feed-status" role="status">暂未取得最新数据。 <button type="button" class="text-btn" data-retry-feed>重试</button></p>' : '';
  return content + warning;
}
