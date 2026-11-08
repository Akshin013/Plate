'use client';
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
          <a key={p.username} href={`/${p.username}`} className="res">
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