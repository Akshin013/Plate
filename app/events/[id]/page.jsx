
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getEvents } from '../../../lib/google-apps-script';

export const dynamic = 'force-dynamic';

function formatDate(date) {
  if (!date) return '';

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat('az-AZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const events = await getEvents();
  const event = events.find((item) => String(item.id) === String(id));

  return {
    title: event
      ? `${event.title} | Plate`
      : 'Tədbir | Plate',
  };
}

export default async function EventDetailsPage({ params }) {
  const { id } = await params;

  let events = [];

  try {
    events = await getEvents();
  } catch (error) {
    console.error('Event details error:', error);
  }

  const event = events.find(
    (item) => String(item.id) === String(id)
  );

  if (!event) notFound();

  const mapUrl =
    event.latitude && event.longitude
      ? `https://www.google.com/maps?q=${event.latitude},${event.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          [event.city, event.address].filter(Boolean).join(', ')
        )}`;

  return (
    <main className="events-page">
      <div className="events-container">

        <header className="events-topbar">
          <Link href="/" className="events-brand">
            PLATE<span>.</span>
          </Link>

          <Link href="/events" className="events-back">
            ← Bütün tədbirlər
          </Link>
        </header>

        <article className="event-detail">

          <div className="event-detail-cover">
            {event.image ? (
              <img src={event.image} alt={event.title} />
            ) : (
              <div className="event-detail-placeholder">🏎️</div>
            )}

            <span className="event-card-category">
              {event.type || 'Avtomobil tədbiri'}
            </span>
          </div>

          <div className="event-detail-content">

            <div className="event-card-date">
              ◷ {formatDate(event.event_date)}
              {event.event_time && ` · ${event.event_time}`}
            </div>

            <h1>{event.title}</h1>

            <div className="event-detail-location">
              <span>⌖</span>
              {event.city}
              {event.address && ` · ${event.address}`}
            </div>

            {event.description && (
              <section className="event-detail-section">
                <span className="events-overline">TƏDBİR HAQQINDA</span>
                <h2>Tədbir haqqında</h2>
                <p>{event.description}</p>
              </section>
            )}

            <div className="event-detail-info">
              {event.organizer && (
                <div>
                  <span>Təşkilatçı</span>
                  <strong>{event.organizer}</strong>
                </div>
              )}

              {event.contact && (
                <div>
                  <span>Əlaqə</span>
                  <strong>{event.contact}</strong>
                </div>
              )}
            </div>

            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="events-hero-button"
            >
              Xəritədə göstər <span>↗</span>
            </a>

          </div>
        </article>

        <footer className="events-footer">
          <Link href="/" className="events-brand">
            PLATE<span>.</span>
          </Link>
          <p>DRIVE · MEET · CONNECT</p>
          <span>© {new Date().getFullYear()} Plate. Bütün hüquqlar qorunur.</span>
        </footer>

      </div>
    </main>
  );
}
