
import Search from '../components/Search';
import { getProfiles } from '../lib/profiles';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const all = await getProfiles();

  const list = all.map((p) => ({
    username: p.username,
    name: p.name,
    car: p.car,
    plate: p.plate,
  }));

  return (
    <>
      <div className="amb" />

      <main className="home plate-home">
        <header className="plate-header">
          <a href="/" className="plate-brand">
            <span className="plate-brand-icon">P</span>
            <span>plate<span className="plate-dot">.az</span></span>
          </a>

          <span className="plate-header-label">
            AVTOMOBİLİNİN RƏQƏMSAL PROFİLİ
          </span>
        </header>

        <section className="plate-hero">
          <div className="plate-badge">
            <span className="plate-badge-dot" />
            SƏNİN AVTOMOBİLİN. SƏNİN PROFİLİN.
          </div>

          <h1 className="plate-title">
            Avtomobilin.
            <br />
            <span>Sənin kimliyin.</span>
          </h1>

          <p className="plate-description">
            Avtomobilin üçün şəxsi rəqəmsal profil yarat.
            QR kod vasitəsilə profilini hər kəslə asanlıqla paylaş.
          </p>

          <div className="plate-search">
            <Search profiles={list} />
          </div>

          <div className="plate-hint">
            Avtomobili ad, model və ya dövlət nömrə nişanı ilə axtar
          </div>
        </section>

        <footer className="plate-footer">
          <span>plate. © 2026</span>
          <span>AVTOMOBİL SEVGİSİ İLƏ</span>
        </footer>
      </main>
    </>
  );
}
