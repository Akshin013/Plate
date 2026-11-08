// Источник данных: Google Таблица (опубликованная как CSV) + Cloudinary для фото и видео.
// Если SHEET_CSV_URL не задан, показываются тестовые профили (удобно для разработки).

// Тестовые профили (только когда таблица не подключена)
const SAMPLE = [
  { username: 'alex', name: 'Алекс Мамедов', car: { brand: 'Nissan', model: '370Z' }, plate: '77-AB-777',
    avatar: '/img/alex.jpg', video: '/video/alex.mp4', instagram: 'alex_drift', telegram: 'alex_drift', tiktok: '', youtube: '' },
  { username: 'rauf', name: 'Рауф Алиев', car: { brand: 'BMW', model: 'M3' }, plate: '10-XY-001',
    avatar: '/img/rauf.jpg', video: '/video/rauf.mp4', instagram: 'rauf.m3', telegram: '', tiktok: 'rauf.m3', youtube: '' },
  { username: 'rauf', name: 'Рауф Алиев', car: { brand: 'BMW', model: 'M3' }, plate: '77-NO-176 ',
    avatar: '/img/rauf.jpg', video: '/video/rauf.mp4', instagram: 'rauf.m3', telegram: '', tiktok: 'rauf.m3', youtube: '' },
];

// Что лежит в ячейке avatar / video:
//  - полная ссылка (https://...)  -> берём как есть
//  - просто имя файла в Cloudinary (public ID) -> строим ссылку и сжимаем автоматически
function media(value, kind) {
  const v = (value || '').trim();
  if (!v) return '';
  const t = kind === 'video'
    ? 'f_auto,q_auto,w_720'
    : 'f_auto,q_auto,w_300,h_300,c_fill,g_auto';
  // Полная ссылка из Cloudinary: добавляем сжатие и подгонку размера
  if (/^https?:\/\/res\.cloudinary\.com\//.test(v) && v.includes('/upload/')) {
    return v.replace('/upload/', `/upload/${t}/`);
  }
  // Любая другая ссылка или локальный файл: берём как есть
  if (/^(https?:)?\/\//.test(v) || v.startsWith('/')) return v;
  // Просто имя файла (public ID)
  const cloud = process.env.CLOUDINARY_CLOUD;
  if (!cloud) return '';
  return `https://res.cloudinary.com/${cloud}/${kind === 'video' ? 'video' : 'image'}/upload/${t}/${v}`;
}


// Ник соцсети: убираем @ и пробелы
const handle = (v) => (v || '').trim().replace(/^@/, '');

// Небольшой разбор CSV (понимает кавычки и запятые внутри ячеек)
function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function toProfiles(rows) {
  if (rows.length < 2) return [];
  const head = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => {
    const o = {};
    head.forEach((h, i) => (o[h] = (r[i] || '').trim()));
    return o;
  })
  .filter((o) => o.username && !['no', 'нет', 'false', '0'].includes((o.active || '').toLowerCase()))
  .map((o) => ({
    username: o.username.toLowerCase(),
    name: o.name,
    car: { brand: o.car_brand, model: o.car_model },
    plate: o.plate,
    avatar: media(o.avatar, 'image'),
    video: media(o.video, 'video'),
    instagram: handle(o.instagram),
    telegram: handle(o.telegram),
    tiktok: handle(o.tiktok),
    youtube: handle(o.youtube),
  }));
}

export async function getProfiles() {
  const url = process.env.SHEET_CSV_URL;
  if (!url) return SAMPLE;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return toProfiles(parseCSV(await res.text()));
  } catch (e) {
    console.error('Не удалось прочитать таблицу:', e);
    return [];
  }
}

export async function getProfile(username) {
  const list = await getProfiles();
  return list.find((p) => p.username === String(username).toLowerCase()) || null;
}
