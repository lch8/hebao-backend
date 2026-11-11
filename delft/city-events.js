// Editorial picks, checked against the linked official sources on 2026-11-11.
// All timestamps include Amsterdam's UTC offset. Update dates, prices and source
// together; the UI hides past starts rather than recycling old events.
export const CITY_EVENTS_CHECKED = '2026-11-11';
export const CITY_AGENDA_URL = 'https://www.indelft.nl/nl/uitagenda/uitagenda-delft';
export const cityEvents = [
  {
    id: 'mirror-2026-11-12', category: '舞台', tone: 'clay',
    title: 'The Mirror · 当代杂技与舞蹈', originalTitle: 'Gravity & Other Myths',
    startsAt: '2026-11-12T20:15:00+01:00',
    place: 'Theater de Veste · Vesteplein 1', price: '普通票 €34.50 · 学生票 €32.50',
    description: '澳大利亚团队把高空杂技、舞蹈与现场音乐搬上舞台。想看一场视觉感强的演出，可以从这里开始。',
    sourceName: 'Theater de Veste',
    sourceUrl: 'https://www.theaterdeveste.nl/programma/the-mirror-13dy',
    checkedOn: CITY_EVENTS_CHECKED,
  },
  {
    id: 'bonavox-2026-11-14', category: '音乐', tone: 'blue',
    title: 'Bonavox · U2 致敬现场', originalTitle: 'U2 Tribute by Bonavox',
    startsAt: '2026-11-14T21:00:00+01:00',
    place: 'Cultuurlab · Brabantse Turfmarkt 9', price: '€15',
    description: '在市中心听一晚熟悉的摇滚旋律。Bonavox 用 U2 的经典曲目，庆祝这支乐队成立 50 周年。',
    sourceName: 'Delft 官方活动日历',
    sourceUrl: 'https://www.indelft.nl/nl/uitagenda/uitagenda-delft/3553766753/u2-tribute-by-bonavox',
    checkedOn: CITY_EVENTS_CHECKED,
  },
  {
    id: 'cello-2026-11-15', category: '音乐', tone: 'sage',
    title: '周日早场 · 大提琴音乐会', originalTitle: 'Jurre Koopmans · Zondagochtendconcert',
    startsAt: '2026-11-15T11:30:00+01:00',
    place: 'Theater de Veste · Vesteplein 1', price: '普通票 €23.50 · 学生票 €15',
    description: '听 Cello Biënnale 比赛获奖者 Jurre Koopmans 演奏。适合给周日留一段安静的时间，票价含一杯咖啡或茶。',
    sourceName: 'Theater de Veste',
    sourceUrl: 'https://www.theaterdeveste.nl/programma/zondagochtendconcert-5ywd',
    checkedOn: CITY_EVENTS_CHECKED,
  },
  {
    id: 'forest-2026-11-20', category: '户外', tone: 'sage',
    title: '跟着护林员走进 Abtswoudse Bos', originalTitle: 'Met de boswachter door het Abtswoudse bos',
    startsAt: '2026-11-20T13:30:00+01:00', endsAt: '2026-11-20T15:30:00+01:00',
    place: 'Tanthofdreef 停车场 · Delft', price: '€15.50 · 需预约',
    description: '两小时森林导览，了解树木和生物多样性。路线会离开步道，请穿适合户外的衣物，并在报名页确认导览语言。',
    sourceName: 'Staatsbosbeheer',
    sourceUrl: 'https://www.staatsbosbeheer.nl/uit-in-de-natuur/met-de-boswachter-door-het-abtswoudse-bos',
    locationSourceUrl: 'https://www.indelft.nl/nl/uitagenda/uitagenda-delft/4069505649/met-de-boswachter-door-het-abtswoudse-bos',
    checkedOn: CITY_EVENTS_CHECKED,
  },
  {
    id: 'lichtjesavond-2026-12-08', category: '节日', tone: 'gold',
    title: 'Lichtjesavond · Delft 灯光之夜', originalTitle: '29e Lichtjesavond Delft',
    startsAt: '2026-12-08T16:00:00+01:00', endsAt: '2026-12-08T22:00:00+01:00',
    place: 'Delft 老城 · Markt 及周边', price: '各项活动安排见官方页面',
    description: '沿着运河看灯光，逛冬日摊位，听街头演出。老城的圣诞树、音乐与灯光活动，会把这个周二变得特别。',
    sourceName: 'Delft 官方活动日历',
    sourceUrl: 'https://www.indelft.nl/nl/uitagenda/delft-verlicht/lichtjesavond',
    checkedOn: CITY_EVENTS_CHECKED,
  },
];

const partsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function amsterdamInput(value) {
  const p = Object.fromEntries(partsFormatter.formatToParts(new Date(value)).map(p => [p.type, p.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

// datetime-local has no timezone. Resolve explicitly, independent of the device.
// A nonexistent spring-forward time is rejected; an ambiguous autumn time uses
// its first occurrence, matching the first local wall-clock reading.
export function amsterdamInstant(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('请选择有效日期和时间');
  const wall = Date.parse(value + 'Z');
  for (const hours of [2, 1]) {
    const candidate = new Date(wall - hours * 3600000);
    if (Number.isFinite(candidate.getTime()) && amsterdamInput(candidate) === value) return candidate;
  }
  throw new Error('这个荷兰当地时间不存在，请重新选择（夏令时切换）');
}

export function upcomingCityEvents(events = cityEvents, period = 'all', now = new Date()) {
  const today = amsterdamInput(now).slice(0, 10);
  const dayNumber = iso => Date.parse(iso.slice(0, 10) + 'T00:00:00Z') / 86400000;
  const day = dayNumber(today), weekday = new Date(day * 86400000).getUTCDay();
  const saturday = day + (weekday === 0 ? -1 : (6 - weekday));
  return events.filter(event => {
    if (Date.parse(event.startsAt) <= now.getTime()) return false;
    const eventDay = dayNumber(amsterdamInput(event.startsAt));
    if (period === 'weekend') return eventDay >= saturday && eventDay <= saturday + 1;
    if (period === 'fortnight') return eventDay >= day && eventDay < day + 14;
    return true;
  }).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

export function cityEventDraft(event) {
  return {
    title: `一起去：${event.title}`.slice(0, 75),
    category: event.category === '户外' ? '散步' : '其他',
    startsAt: amsterdamInput(event.startsAt), place: event.place,
    description: `一起参加 ${event.originalTitle}。\n${event.price}；票务和预约请各自通过官方页面完成。\n活动详情：${event.sourceUrl}`.slice(0, 450),
  };
}
