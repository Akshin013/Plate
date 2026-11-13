import { getEvents } from "../../lib/google-apps-script";
import EventsMap from "../../components/EventsMap";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Avtomobil Tədbirləri | Plate",
  description:
    "Azərbaycanda avtomobil görüşləri, sərgilər, drift yarışları və digər avtomobil tədbirləri.",
};

function formatDate(date) {
  if (!date) return "";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat("az-AZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export default async function EventsPage() {
  let events = [];
  let error = null;

  try {
    events = await getEvents();
  } catch (err) {
    console.error("Events page error:", err);
    error = "Tədbirləri yükləmək mümkün olmadı.";
  }

  return (
    <main className="events-page">
      <div className="events-container">
        <header className="events-topbar">
          <a href="/" className="events-brand">
            PLATE<span>.az</span>
          </a>
          <a href="/" className="events-back">
            ← Ana səhifə
          </a>
        </header>

        <section className="events-hero">
          <div className="events-hero-content">
            <span className="events-label">
              <span className="events-label-dot" />
              PLATE AVTO İCMA
            </span>

            <h1>
              Azərbaycanın
              <br />
              <span>Avtomobil Dünyası</span>
            </h1>

            <p>
              Avtomobil görüşləri, sərgilər, drift yarışları və digər maraqlı
              tədbirləri kəşf et. Avtomobil həvəskarları ilə bir araya gəl!
            </p>

            <a href="#events-list" className="events-hero-button">
              Tədbirləri kəşf et
              <span>↗</span>
            </a>
          </div>

          <div className="events-hero-decoration">
            <span>01</span>
            <div />
            <small>AZƏRBAYCAN / 2026</small>
          </div>
        </section>

        {error && <p className="events-error">{error}</p>}

        <section className="events-section">
          <div className="events-heading">
            <div>
              <span className="events-overline">KƏŞF ET</span>
              <h2>Tədbirlər xəritəsi</h2>
              <p>Azərbaycandakı bütün avtomobil tədbirləri bir xəritədə</p>
            </div>

            <div className="events-count">
              <strong>{events.length}</strong>
              <span>tədbir</span>
            </div>
          </div>

          <div className="events-map-wrapper">
            <EventsMap events={events} />
            <div className="events-map-caption">
              <span className="events-map-dot" />
              Tədbirin yerini xəritədə gör
            </div>
          </div>
        </section>

        <section className="events-section" id="events-list">
          <div className="events-heading">
            <div>
              <span className="events-overline">PLATE COMMUNITY</span>
              <h2>Qarşıdan gələn tədbirlər</h2>
              <p>Sevdiyin avtomobil tədbirlərini qaçırma</p>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="events-empty">
              <span className="events-empty-icon">🏁</span>
              <h3>Hələlik tədbir yoxdur</h3>
              <p>
                Yeni avtomobil tədbirləri əlavə olunduqda burada görə
                biləcəksən.
              </p>
            </div>
          ) : (
            <div className="events-grid">
              {events.map((event) => (
                <Link
                  href={`/events/${event.id}`}
                  className="event-card"
                  key={event.id}
                >
                  <div className="event-card-image">
                    {event.image ? (
                      <img src={event.image} alt={event.title} />
                    ) : (
                      <div className="event-card-placeholder">🏎️</div>
                    )}

                    <span className="event-card-category">
                      {event.type || "Avtomobil tədbiri"}
                    </span>
                  </div>

                  <div className="event-card-content">
                    <div className="event-card-date">
                      <span>◷</span>
                      {formatDate(event.event_date)}
                      {event.event_time && ` · ${event.event_time}`}
                    </div>

                    <h3>{event.title}</h3>

                    <div className="event-card-location">
                      <span>⌖</span>
                      {event.city}
                      {event.address ? ` · ${event.address}` : ""}
                    </div>

                    {event.description && (
                      <p className="event-card-description">
                        {event.description}
                      </p>
                    )}

                    {event.organizer && (
                      <div className="event-card-organizer">
                        Təşkilatçı: {event.organizer}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <footer className="events-footer">
          <a href="/" className="events-brand">
            PLATE<span>.</span>
          </a>
          <p>DRIVE · MEET · CONNECT</p>
          <span>
            © {new Date().getFullYear()} Plate. Bütün hüquqlar qorunur.
          </span>
        </footer>
      </div>
    </main>
  );
}
