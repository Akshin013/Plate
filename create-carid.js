#!/usr/bin/env node
// Скрипт создаёт проект CarId (Next.js + Google Таблицы + Cloudinary) и ставит зависимости.
// Запуск:  node create-carid.js [имя-папки]
// Нужен Node.js 18+ (https://nodejs.org)

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = process.argv[2] || 'carid-site';
const root = path.resolve(process.cwd(), dir);

if (fs.existsSync(root) && fs.readdirSync(root).length) {
  console.error('Папка "' + dir + '" уже существует и не пуста. Укажи другое имя: node create-carid.js моя-папка');
  process.exit(1);
}

const files = {
".env.local.example": `# Скопируй этот файл в .env.local и впиши свои значения.
# Ссылка на опубликованную Google Таблицу (Файл -> Поделиться -> Опубликовать в интернете -> формат CSV)
SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/e/XXXXXXXX/pub?output=csv
# Имя твоего аккаунта в Cloudinary (Dashboard -> Cloud name)
CLOUDINARY_CLOUD=your-cloud-name
`,

"README.md": `# CarId: профили автолюбителей

Данные берутся из Google Таблицы, фото и видео лежат в Cloudinary, сайт работает на Vercel.
Новая строка в таблице = новая страница (появляется в течение минуты, пересобирать ничего не нужно).

## 1. Google Таблица
1. Создай таблицу и импортируй \`sheet-template.csv\` (Файл → Импорт) или перепиши заголовки как в нём.
2. Столбцы: username, name, car_brand, car_model, plate, avatar, video, instagram, telegram, tiktok, youtube, active
   - username: ник в ссылке (латиницей, без пробелов): carid.az/alex
   - avatar / video: имя файла из Cloudinary (public ID) или полная ссылка
   - active: yes или no. No скрывает страницу (например, когда клиент не продлил оплату)
3. Файл → Поделиться → Опубликовать в интернете → выбери нужный лист и формат CSV → Опубликовать. Скопируй ссылку.
   (Опубликованный CSV может прочитать любой, у кого есть ссылка, поэтому не храни в таблице телефоны и другие личные данные.)

## 2. Cloudinary
1. Зарегистрируйся на cloudinary.com, на Dashboard скопируй Cloud name.
2. Media Library → Upload: загрузи аватар и видео клиента.
3. Имя файла без расширения (public ID) впиши в таблицу в столбцы avatar и video.
   Видео и фото автоматически сжимаются и подгоняются под размер.

## 3. Запуск у себя
    cp .env.local.example .env.local     (впиши ссылку на таблицу и Cloud name)
    npm install
    npm run dev                          → http://localhost:3000
Без .env.local показываются тестовые профили.

## 4. Выкладка (Vercel, бесплатно)
1. Залей проект на GitHub.
2. vercel.com → Add New Project → выбери репозиторий.
3. В Environment Variables добавь SHEET_CSV_URL и CLOUDINARY_CLOUD. Нажми Deploy.
4. Settings → Domains: подключи свой домен.
`,

"app/[username]/page.js": `import { notFound } from 'next/navigation';
import Profile from '../../components/Profile';
import { getProfile } from '../../lib/profiles';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { username } = await params;
  const p = await getProfile(username);
  return p ? { title: \`\${p.name} · \${p.car.brand} \${p.car.model}\` } : {};
}

export default async function Page({ params }) {
  const { username } = await params;
  const p = await getProfile(username);
  if (!p) notFound();
  return <Profile p={p} />;
}
`,

"app/globals.css": `:root{color-scheme:dark;--bg:#06070b;--text:#f4f6fa;--accent:#ff3b30;--accent2:#ff9500;--glass:rgba(255,255,255,.08);--line:rgba(255,255,255,.16)}
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--text);font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:inherit;text-decoration:none}

.amb{position:fixed;inset:0;z-index:0;overflow:hidden;background:radial-gradient(ellipse at 50% 20%,#1d2233 0,#06070b 70%)}
.amb video{width:100%;height:100%;object-fit:cover;filter:blur(40px) saturate(1.5) brightness(.55);transform:scale(1.3)}

.profile{position:relative;z-index:1;min-height:100vh;min-height:100dvh;max-width:420px;margin:0 auto;padding:calc(14px + env(safe-area-inset-top,0px)) 14px calc(18px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;align-items:center}
.stage{position:relative;width:100%;flex:1;min-height:38vh;border-radius:28px;overflow:hidden;background:#0d1018;border:1px solid var(--line);box-shadow:0 24px 60px rgba(0,0,0,.6),0 0 70px rgba(255,59,48,.22)}
.stage video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.stage .fb{position:absolute;left:50%;top:50%;width:140%;transform:translate(-50%,-50%)}
.stage::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.25) 0,rgba(0,0,0,0) 25%,rgba(0,0,0,0) 70%,rgba(6,7,11,.55) 100%)}

.ava{position:relative;z-index:2;width:92px;height:92px;margin-top:-48px;border-radius:50%;padding:3px;flex:none;background:conic-gradient(from 200deg,var(--accent),var(--accent2),var(--accent));box-shadow:0 0 0 5px var(--bg),0 0 30px rgba(255,59,48,.6)}
.ava>div{width:100%;height:100%;border-radius:50%;overflow:hidden;background:#14161d;display:grid;place-items:center;font-size:34px;font-weight:700}
.ava img{width:100%;height:100%;object-fit:cover;display:block}

.name{margin:12px 0 4px;font-size:25px;font-weight:700;letter-spacing:.02em;text-align:center}
.car{display:flex;align-items:center;gap:8px;margin:0 0 12px;font-size:16px;color:#d5d9e3}
.car svg{width:20px;height:20px;color:var(--accent);flex:none}
.car b{color:var(--text)}

.plate{display:flex;align-items:stretch;height:36px;margin:0 0 16px;border-radius:7px;overflow:hidden;background:#fff;color:#111;border:2px solid #111;box-shadow:0 0 22px rgba(255,200,80,.5)}
.plate i{display:flex;flex-direction:column;align-items:center;justify-content:center;width:30px;background:#0b3d91;color:#fff;font-style:normal;font-size:10px;font-weight:800;line-height:1.1}
.plate i::before{content:"";width:14px;height:9px;margin-bottom:2px;border-radius:1px;background:linear-gradient(#00b5e2 33%,#ef3340 33% 66%,#509e2f 66%)}
.plate b{display:flex;align-items:center;padding:0 14px;font-family:"Arial Black",Impact,Arial,sans-serif;font-size:19px;letter-spacing:.1em;white-space:nowrap}

.icons{display:grid;gap:10px;width:100%}
.ico{display:grid;place-items:center;height:54px;border-radius:16px;background:var(--glass);border:1px solid var(--line);transition:transform .2s,background .2s,border-color .2s}
.ico:hover{transform:translateY(-3px);background:rgba(255,59,48,.22);border-color:var(--accent)}
.ico svg{width:24px;height:24px}

.qrb{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:50px;margin-top:10px;border:0;border-radius:16px;cursor:pointer;color:#fff;font:inherit;font-weight:700;font-size:15px;background:linear-gradient(135deg,var(--accent),var(--accent2));box-shadow:0 8px 24px rgba(255,59,48,.4);transition:filter .2s}
.qrb:hover{filter:brightness(1.1)}
.qrb svg{width:20px;height:20px}

.rise{opacity:0;transform:translateY(14px);animation:rise .6s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes rise{to{opacity:1;transform:none}}

.modal{position:fixed;inset:0;z-index:10;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:20px}
.box{background:#fff;color:#111;border-radius:24px;padding:24px;text-align:center;max-width:320px;width:100%}
.qrwrap{display:flex;justify-content:center;margin:14px 0}
.box p{margin:4px 0;font-size:12px;color:#555;word-break:break-all}
.box button{width:100%;margin-top:12px;font:inherit;font-weight:600;background:#111;color:#fff;border:0;border-radius:14px;padding:13px;cursor:pointer}

/* Главная: поиск по номеру */
.home{position:relative;z-index:1;min-height:100dvh;max-width:420px;margin:0 auto;padding:18vh 18px 30px;text-align:center}
.logo{margin:0;font-size:56px;font-weight:800;letter-spacing:.04em;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;background-clip:text;color:transparent}
.slogan{margin:6px 0 28px;color:#aab1c2}
.search input{width:100%;height:56px;padding:0 18px;border-radius:16px;border:1px solid var(--line);background:rgba(255,255,255,.08);color:var(--text);font:inherit;font-size:18px;font-weight:700;letter-spacing:.1em;text-align:center;text-transform:uppercase;outline:none}
.search input::placeholder{text-transform:none;letter-spacing:0;font-weight:400;color:#7f8799}
.search input:focus{border-color:var(--accent)}
.results{margin-top:14px;display:grid;gap:8px}
.res{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:16px;background:var(--glass);border:1px solid var(--line);text-align:left}
.res:hover{border-color:var(--accent)}
.res span:nth-child(2){display:flex;flex-direction:column;flex:1}
.res small{color:#9aa3b5}
.res em{opacity:.5;font-style:normal}
.mini{background:#fff;color:#111;border:2px solid #111;border-radius:6px;padding:4px 8px;font-family:"Arial Black",Arial,sans-serif;font-size:13px;letter-spacing:.06em;white-space:nowrap}
.none{color:#9aa3b5}
`,

"app/layout.js": `import './globals.css';

export const metadata = { title: 'CarId', description: 'Профиль автолюбителя: машина, номер, соцсети' };
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
`,

"app/page.js": `import Search from '../components/Search';
import { getProfiles } from '../lib/profiles';

export const revalidate = 60;

export default async function Home() {
  const all = await getProfiles();
  // В браузер отдаём только то, что нужно для поиска
  const list = all.map((p) => ({ username: p.username, name: p.name, car: p.car, plate: p.plate }));
  return (
    <>
      <div className="amb" />
      <main className="home">
        <h1 className="logo">CarId</h1>
        <p className="slogan">Твоя машина — твой профиль</p>
        <Search profiles={list} />
      </main>
    </>
  );
}
`,

"components/Profile.js": `'use client';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const ICONS = {
  instagram: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>,
  telegram: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 3.6 2.8 10.8c-.8.3-.8 1.4 0 1.6l4.6 1.5 1.8 5.6c.2.6 1 .8 1.4.3l2.6-2.5 4.6 3.4c.5.4 1.3.1 1.4-.5L23 5c.2-.8-.7-1.7-1.5-1.4zM9.8 14l8-6.5-6.3 7.2-.3 3z"/></svg>,
  tiktok: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 3c.3 2.3 1.7 3.8 4 4v3.1c-1.5 0-2.9-.4-4-1.2v6.2c0 3.2-2.4 5.4-5.4 5.4s-5.4-2.3-5.4-5.3c0-3.3 2.8-5.6 6.1-5.2v3.2c-1.6-.4-2.9.5-2.9 2 0 1.2 1 2.2 2.2 2.2 1.4 0 2.3-.9 2.3-2.4V3z"/></svg>,
  youtube: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 8.2c-.2-1.5-1-2.3-2.5-2.5C17.8 5.4 12 5.4 12 5.4s-5.8 0-7.5.3C3 6 2.200 6.700 2 8.200 1.800 9.700 1.800 12 1.800 12s0 2.300.2 3.800c.2 1.500 1 2.300 2.500 2.500 1.700.3 7.500.3 7.500.3s5.800 0 7.500-.3c1.500-.2 2.300-1 2.500-2.500.2-1.500.2-3.800.2-3.800s0-2.300-.2-3.800zM10 15V9l5 3z"/></svg>,
};
const LINKS = {
  instagram: (v) => \`https://instagram.com/\${v}\`,
  telegram: (v) => \`https://t.me/\${v}\`,
  tiktok: (v) => \`https://tiktok.com/@\${v}\`,
  youtube: (v) => \`https://youtube.com/@\${v}\`,
};

function FallbackCar() {
  return (
    <svg className="fb" viewBox="0 0 800 420" aria-hidden="true">
      <defs>
        <linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d12a22"/><stop offset="1" stopColor="#5a0d0a"/></linearGradient>
        <radialGradient id="glow"><stop offset="0" stopColor="#fff" stopOpacity=".95"/><stop offset="1" stopColor="#ffd9a0" stopOpacity="0"/></radialGradient>
      </defs>
      <rect x="120" y="318" width="90" height="70" rx="14" fill="#0b0b0e"/>
      <rect x="590" y="318" width="90" height="70" rx="14" fill="#0b0b0e"/>
      <path d="M130 300 Q130 210 215 150 L300 70 Q400 40 500 70 L585 150 Q670 210 670 300 L670 345 Q400 372 130 345 Z" fill="url(#body)"/>
      <path d="M232 150 L305 85 Q400 62 495 85 L568 150 Q400 128 232 150Z" fill="#0d1018" stroke="#2a2f3d" strokeWidth="3"/>
      <circle cx="205" cy="228" r="60" fill="url(#glow)"/>
      <circle cx="595" cy="228" r="60" fill="url(#glow)"/>
      <path d="M290 245 L510 245 L535 300 L265 300Z" fill="#090a0f"/>
      <rect x="340" y="318" width="120" height="28" rx="4" fill="#f2f4f8"/>
    </svg>
  );
}

export default function Profile({ p }) {
  const [videoOk, setVideoOk] = useState(Boolean(p.video));
  const [avaOk, setAvaOk] = useState(Boolean(p.avatar));
  const [qr, setQr] = useState(null); // ссылка для QR, null = окно закрыто

  const socials = ['instagram', 'telegram', 'tiktok', 'youtube'].filter((k) => p[k]);

  return (
    <>
      <div className="amb">{videoOk && <video src={p.video} autoPlay muted loop playsInline />}</div>

      <main className="profile">
        <section className="stage rise">
          {videoOk ? (
            <video src={p.video} autoPlay muted loop playsInline preload="auto" onError={() => setVideoOk(false)} />
          ) : (
            <FallbackCar />
          )}
        </section>

        <div className="ava rise" style={{ animationDelay: '.1s' }}>
          <div>
            {avaOk ? <img src={p.avatar} alt="" onError={() => setAvaOk(false)} /> : p.name.charAt(0)}
          </div>
        </div>

        <h1 className="name rise" style={{ animationDelay: '.16s' }}>{p.name}</h1>

        <div className="car rise" style={{ animationDelay: '.18s' }}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11h.5A1.5 1.5 0 0 1 21 12.5V17h-2v1.5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V17H8v1.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V17H3v-4.5A1.5 1.5 0 0 1 4.5 11zm3.4-4-1 3h9.2l-1-3zM6.5 13.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm11 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>
          <span><b>{p.car.brand}</b> {p.car.model}</span>
        </div>

        <div className="plate rise" style={{ animationDelay: '.2s' }}>
          <i>AZ</i><b>{p.plate.replace(/-/g, ' · ')}</b>
        </div>

        {socials.length > 0 && (
          <nav className="icons" style={{ gridTemplateColumns: \`repeat(\${socials.length}, 1fr)\` }}>
            {socials.map((k, i) => (
              <a key={k} className="ico rise" style={{ animationDelay: \`\${0.26 + i * 0.05}s\` }}
                 href={LINKS[k](p[k])} target="_blank" rel="noopener noreferrer" aria-label={k} title={k}>
                {ICONS[k]}
              </a>
            ))}
          </nav>
        )}

        <button className="qrb rise" style={{ animationDelay: '.46s' }} onClick={() => setQr(window.location.href)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v1M14 20h1M18 18h3v3h-3z"/></svg>
          QR-код профиля
        </button>
      </main>

      {qr && (
        <div className="modal" onClick={() => setQr(null)}>
          <div className="box" onClick={(e) => e.stopPropagation()}>
            <strong>Сканируй и знакомься</strong>
            <div className="qrwrap"><QRCodeSVG value={qr} size={220} /></div>
            <p>{qr}</p>
            <button onClick={() => setQr(null)}>Закрыть</button>
          </div>
        </div>
      )}
    </>
  );
}
`,

"components/Search.js": `'use client';
import { useState } from 'react';
import { normalizePlate } from '../lib/normalize';

export default function Search({ profiles }) {
  const [q, setQ] = useState('');
  const n = normalizePlate(q);
  const found = n.length >= 2 ? profiles.filter((p) => normalizePlate(p.plate).includes(n)) : [];

  return (
    <div className="search">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Введи номер: 77AB777"
        maxLength={12}
        autoComplete="off"
        spellCheck={false}
      />
      <div className="results">
        {found.map((p) => (
          <a key={p.username} href={\`/\${p.username}\`} className="res">
            <span className="mini">{p.plate.replace(/-/g, ' · ')}</span>
            <span><b>{p.name}</b><small>{p.car.brand} {p.car.model}</small></span>
            <em>›</em>
          </a>
        ))}
        {n.length >= 2 && found.length === 0 && <p className="none">Такой номер пока не найден</p>}
      </div>
    </div>
  );
}
`,

"lib/normalize.js": `// Приводит номер к единому виду, чтобы поиск находил и "77ab777", и "77-AB-777"
export const normalizePlate = (s) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
`,

"lib/profiles.js": `// Источник данных: Google Таблица (опубликованная как CSV) + Cloudinary для фото и видео.
// Если SHEET_CSV_URL не задан, показываются тестовые профили (удобно для разработки).

// Тестовые профили (только когда таблица не подключена)
const SAMPLE = [
  { username: 'alex', name: 'Алекс Мамедов', car: { brand: 'Nissan', model: '370Z' }, plate: '77-AB-777',
    avatar: '/img/alex.jpg', video: '/video/alex.mp4', instagram: 'alex_drift', telegram: 'alex_drift', tiktok: '', youtube: '' },
  { username: 'rauf', name: 'Рауф Алиев', car: { brand: 'BMW', model: 'M3' }, plate: '10-XY-001',
    avatar: '/img/rauf.jpg', video: '/video/rauf.mp4', instagram: 'rauf.m3', telegram: '', tiktok: 'rauf.m3', youtube: '' },
];

// Что лежит в ячейке avatar / video:
//  - полная ссылка (https://...)  -> берём как есть
//  - просто имя файла в Cloudinary (public ID) -> строим ссылку и сжимаем автоматически
function media(value, kind) {
  const v = (value || '').trim();
  if (!v) return '';
  if (/^(https?:)?\\/\\//.test(v) || v.startsWith('/')) return v;
  const cloud = process.env.CLOUDINARY_CLOUD;
  if (!cloud) return '';
  const t = kind === 'video'
    ? 'video/upload/f_auto,q_auto,w_720'
    : 'image/upload/f_auto,q_auto,w_300,h_300,c_fill,g_auto';
  return \`https://res.cloudinary.com/\${cloud}/\${t}/\${v}\`;
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
    else if (c === '\\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\\r') cell += c;
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
    const res = await fetch(url, { next: { revalidate: 60 } }); // таблица перечитывается раз в минуту
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
`,

"next.config.js": `module.exports = {};
`,

"package.json": `{
  "name": "carid-site",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "npx serve out"
  },
  "dependencies": {
    "next": "14.2.15",
    "qrcode.react": "3.1.0",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  }
}
`,

"sheet-template.csv": `username,name,car_brand,car_model,plate,avatar,video,instagram,telegram,tiktok,youtube,active
alex,Алекс Мамедов,Nissan,370Z,77-AB-777,alex_avatar,alex_car,alex_drift,alex_drift,,,yes
rauf,Рауф Алиев,BMW,M3,10-XY-001,rauf_avatar,rauf_car,rauf.m3,,rauf.m3,,yes
`,

};

for (const [file, content] of Object.entries(files)) {
  const full = path.join(root, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}
for (const d of ['public/video', 'public/img']) {
  fs.mkdirSync(path.join(root, d), { recursive: true });
  fs.writeFileSync(path.join(root, d, '.gitkeep'), '');
}
console.log('Файлы созданы в: ' + root);

console.log('Ставлю зависимости (npm install)...');
try {
  execSync('npm install --no-audit --no-fund', { cwd: root, stdio: 'inherit' });
} catch (e) {
  console.error('npm install не удался. Зайди в папку и запусти его вручную.');
  process.exit(1);
}

console.log('\nГотово! Дальше:\n  cd ' + dir + '\n  cp .env.local.example .env.local   (впиши ссылку на таблицу и Cloud name)\n  npm run dev\nи открой http://localhost:3000');
