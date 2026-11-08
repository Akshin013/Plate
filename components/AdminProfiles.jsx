'use client';
import { useEffect, useState } from 'react';

export default function AdminProfiles() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  async function load() {
    setError('');
    setList(null);
    try {
      const res = await fetch('/api/admin/profiles', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      setList(data.profiles);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => { load(); }, []);

  const s = q.trim().toLowerCase().replace(/[^a-z0-9а-яё]/g, '');
  const shown = (list || []).filter((p) =>
    !s || `${p.username}${p.name}${p.car}${p.plate}`.toLowerCase().replace(/[^a-z0-9а-яё]/g, '').includes(s));

  return (
    <section className="adm">
      <div className="adm-top">
        <h2>Все профили {list && <span>({list.length})</span>}</h2>
        <button onClick={load}>Обновить</button>
      </div>
      <input className="adm-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск: имя, ник, машина, номер" />

      {error && <p className="adm-err">{error}</p>}
      {!list && !error && <p className="adm-muted">Загрузка...</p>}
      {list && shown.length === 0 && <p className="adm-muted">Ничего не найдено</p>}

      <div className="adm-list">
        {shown.map((p) => (
          <a key={p.username} href={`/${p.username}`} target="_blank" rel="noopener noreferrer" className={`adm-row${p.active ? '' : ' off'}`}>
            <span className="adm-plate">{p.plate.replace(/-/g, ' · ')}</span>
            <span className="adm-info">
              <b>{p.name}</b>
              <small>@{p.username} · {p.car}</small>
            </span>
            <span className="adm-tags">
              {!p.active && <i className="bad">скрыт</i>}
              {!p.hasVideo && <i>нет видео</i>}
              {!p.hasAvatar && <i>нет фото</i>}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}