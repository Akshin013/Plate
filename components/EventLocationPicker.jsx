
'use client';

import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = new L.DivIcon({
  className: 'event-location-marker',
  html: `
    <div style="
      width: 22px;
      height: 22px;
      background: #ff9500;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 15px rgba(255,149,0,.8);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function MapClick({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: event.latlng.lat.toFixed(6),
        longitude: event.latlng.lng.toFixed(6),
      });
    },
  });

  return null;
}

function MapSizeFix() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

export default function EventLocationPicker({
  latitude,
  longitude,
  onSelect,
}) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  const hasCoordinates =
    latitude !== '' &&
    longitude !== '' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180;

  const center = hasCoordinates
    ? [lat, lng]
    : [40.4093, 49.8671];

  return (
    <div className="event-location-picker">
      <div className="event-location-info">
        <strong>Место проведения</strong>
        <span>Нажми на карту, чтобы выбрать точку</span>
      </div>

      <div className="event-location-map">
        <MapContainer
          center={center}
          zoom={hasCoordinates ? 15 : 7}
          scrollWheelZoom
          style={{ width: '100%', height: '100%' }}
        >
          <MapSizeFix />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClick onSelect={onSelect} />

          {hasCoordinates && (
            <Marker
              position={[lat, lng]}
              icon={markerIcon}
            />
          )}
        </MapContainer>
      </div>

      <p className="event-location-coordinates">
        {hasCoordinates
          ? `Выбрано: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
          : 'Место ещё не выбрано'}
      </p>
    </div>
  );
}
