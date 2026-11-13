
'use client';

import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const eventIcon = new L.DivIcon({
  className: 'event-map-marker',
  html: '<div style="width:16px;height:16px;background:#ff9500;border:3px solid white;border-radius:50%;box-shadow:0 0 12px #ff9500"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function MapSizeFix() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

export default function EventsMap({ events = [] }) {
  const validEvents = events.filter((event) => {
    const lat = Number(event.latitude);
    const lng = Number(event.longitude);

    return (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  });

  return (
    <div
      style={{
        width: '100%',
        height: '500px',
        borderRadius: '18px',
        overflow: 'hidden',
      }}
    >
      <MapContainer
        center={[40.4093, 49.8671]}
        zoom={7}
        scrollWheelZoom
        style={{ width: '100%', height: '100%' }}
      >
        <MapSizeFix />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {validEvents.map((event) => (
          <Marker
            key={event.id}
            position={[
              Number(event.latitude),
              Number(event.longitude),
            ]}
            icon={eventIcon}
          >
            <Popup>
              <strong>{event.title}</strong>
              <br />
              {event.city}
              <br />
              {event.event_date} {event.event_time}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
