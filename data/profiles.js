// ВСЕ КЛИЕНТЫ ЗДЕСЬ. Чтобы добавить нового, скопируй блок { ... } и поменяй данные.
// Файлы клиента кладёшь так:  public/img/<username>.jpg  (аватар)
//                             public/video/<username>.mp4 (видео)
// Пустые соцсети оставь '' , они не покажутся на странице.

export const profiles = [
  {
    username: 'alex',               // ссылка будет carid.az/alex
    name: 'Алекс Мамедов',
    car: { brand: 'Nissan', model: '370Z' },
    plate: '77-AB-777',
    avatar: '/img/alex.jpg',
    video: '/video/alex.mp4',
    instagram: 'alex_drift',
    telegram: 'alex_drift',
    tiktok: '',
    youtube: '',
  },
  {
    username: 'rauf',
    name: 'Рауф Алиев',
    car: { brand: 'BMW', model: 'M3' },
    plate: '10-XY-001',
    avatar: '/img/rauf.jpg',
    video: '/video/rauf.mp4',
    instagram: 'rauf.m3',
    telegram: '',
    tiktok: 'rauf.m3',
    youtube: '',
  },
];

// Приводит номер к единому виду, чтобы поиск находил и "77ab777", и "77-AB-777"
export const normalizePlate = (s) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
