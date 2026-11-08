"use client";
import { QRCodeSVG } from "qrcode.react";
import { useState, useEffect } from "react";

const ICONS = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.5 3.6 2.8 10.8c-.8.3-.8 1.4 0 1.6l4.6 1.5 1.8 5.6c.2.6 1 .8 1.4.3l2.6-2.5 4.6 3.4c.5.4 1.3.1 1.4-.5L23 5c.2-.8-.7-1.7-1.5-1.4zM9.8 14l8-6.5-6.3 7.2-.3 3z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.6 3c.3 2.3 1.7 3.8 4 4v3.1c-1.5 0-2.9-.4-4-1.2v6.2c0 3.2-2.4 5.4-5.4 5.4s-5.4-2.3-5.4-5.3c0-3.3 2.8-5.6 6.1-5.2v3.2c-1.6-.4-2.9.5-2.9 2 0 1.2 1 2.2 2.2 2.2 1.4 0 2.3-.9 2.3-2.4V3z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 8.2c-.2-1.5-1-2.3-2.5-2.5C17.8 5.4 12 5.4 12 5.4s-5.8 0-7.5.3C3 6 2.2 6.7 2 8.2 1.8 9.7 1.8 12 1.8 12s0 2.3.2 3.8c.2 1.5 1 2.3 2.5 2.5 1.7.3 7.5.3 7.5.3s5.8 0 7.5-.3c1.5-.2 2.3-1 2.5-2.5.2-1.5.2-3.8.2-3.8s0-2.3-.2-3.8zM10 15V9l5 3z" />
    </svg>
  ),
};
const LINKS = {
  instagram: (v) => `https://instagram.com/${v}`,
  telegram: (v) => `https://t.me/${v}`,
  tiktok: (v) => `https://tiktok.com/@${v}`,
  youtube: (v) => `https://youtube.com/@${v}`,
};

function FallbackCar() {
  return (
    <svg className="fb" viewBox="0 0 800 420" aria-hidden="true">
      <defs>
        <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d12a22" />
          <stop offset="1" stopColor="#5a0d0a" />
        </linearGradient>
        <radialGradient id="glow">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="120" y="318" width="90" height="70" rx="14" fill="#0b0b0e" />
      <rect x="590" y="318" width="90" height="70" rx="14" fill="#0b0b0e" />
      <path
        d="M130 300 Q130 210 215 150 L300 70 Q400 40 500 70 L585 150 Q670 210 670 300 L670 345 Q400 372 130 345 Z"
        fill="url(#body)"
      />
      <path
        d="M232 150 L305 85 Q400 62 495 85 L568 150 Q400 128 232 150Z"
        fill="#0d1018"
        stroke="#2a2f3d"
        strokeWidth="3"
      />
      <circle cx="205" cy="228" r="60" fill="url(#glow)" />
      <circle cx="595" cy="228" r="60" fill="url(#glow)" />
      <path d="M290 245 L510 245 L535 300 L265 300Z" fill="#090a0f" />
      <rect x="340" y="318" width="120" height="28" rx="4" fill="#f2f4f8" />
    </svg>
  );
}

export default function Profile({ p }) {
  const [videoOk, setVideoOk] = useState(Boolean(p.video));
  const [avaOk, setAvaOk] = useState(Boolean(p.avatar));
  const [qr, setQr] = useState(null); // ссылка для QR, null = окно закрыто
  const [views, setViews] = useState(Number(p?.views) || 0);

  useEffect(() => {
    setViews(Number(p?.views) || 0);

    if (!p?.username) return;

    const key = `carid_view_${p.username}`;
    const lastView = Number(localStorage.getItem(key) || 0);
    const now = Date.now();

    // Один просмотр с одного браузера раз в 30 минут
    if (now - lastView < 30 * 60 * 1000) return;

    localStorage.setItem(key, String(now));

    fetch(`/api/profiles/${encodeURIComponent(p.username)}/view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Не удалось записать просмотр");
        }

        // Обновляем число без перезагрузки страницы
        setViews(Number(data.views) || 0);
      })
      .catch((error) => {
        localStorage.removeItem(key);
        console.error("Ошибка счётчика просмотров:", error);
      });
  }, [p?.username, p?.views]);
  const socials = ["instagram", "telegram", "tiktok", "youtube"].filter(
    (k) => p[k],
  );

  return (
    <>
      <div className="amb">
        {videoOk && (
          <video
            src={p.video}
            autoPlay
            muted
            loop
            playsInline
            onCanPlay={(e) => {
              e.currentTarget.muted = true;
              e.currentTarget.play().catch(console.warn);
            }}
          />
        )}
      </div>

      <main className="profile">
        <section className="stage rise">
          {videoOk ? (
            <video
              src={p.video}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onCanPlay={(e) => {
                e.currentTarget.muted = true;
                e.currentTarget.play().catch(console.warn);
              }}
              onError={() => setVideoOk(false)}
            />
          ) : (
            <FallbackCar />
          )}
        </section>

        <div className="ava rise" style={{ animationDelay: ".1s" }}>
          <div>
            {avaOk ? (
              <img src={p.avatar} alt="" onError={() => setAvaOk(false)} />
            ) : (
              p.name.charAt(0)
            )}
          </div>
        </div>

        <h1 className="name rise" style={{ animationDelay: ".16s" }}>
          {p.name}
        </h1>

        <div className="car rise" style={{ animationDelay: ".18s" }}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11h.5A1.5 1.5 0 0 1 21 12.5V17h-2v1.5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V17H8v1.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V17H3v-4.5A1.5 1.5 0 0 1 4.5 11zm3.4-4-1 3h9.2l-1-3zM6.5 13.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm11 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
          </svg>
          <span>
            <b>{p.car.brand}</b> {p.car.model}
          </span>
        </div>

        <div className="plate rise" style={{ animationDelay: ".2s" }}>
          <i>AZ</i>
          <b>{p.plate.replace(/-/g, " · ")}</b>
        </div>

        <div className="views rise" style={{ animationDelay: ".23s" }}>
          <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>

          <span>{views.toLocaleString("ru-RU")}</span>
          <span>просмотров</span>
        </div>

        {socials.length > 0 && (
          <nav
            className="icons"
            style={{ gridTemplateColumns: `repeat(${socials.length}, 1fr)` }}
          >
            {socials.map((k, i) => (
              <a
                key={k}
                className="ico rise"
                style={{ animationDelay: `${0.26 + i * 0.05}s` }}
                href={LINKS[k](p[k])}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={k}
                title={k}
              >
                {ICONS[k]}
              </a>
            ))}
          </nav>
        )}

        <button
          className="qrb rise"
          style={{ animationDelay: ".46s" }}
          onClick={() => setQr(window.location.href)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h3v3h-3zM20 14v1M14 20h1M18 18h3v3h-3z" />
          </svg>
          QR-код профиля
        </button>
      </main>

      {qr && (
        <div className="modal" onClick={() => setQr(null)}>
          <div className="box" onClick={(e) => e.stopPropagation()}>
            <strong>Сканируй и знакомься</strong>
            <div className="qrwrap">
              <QRCodeSVG value={qr} size={220} />
            </div>
            <p>{qr}</p>
            <button onClick={() => setQr(null)}>Закрыть</button>
          </div>
        </div>
      )}
    </>
  );
}
