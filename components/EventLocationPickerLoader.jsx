
'use client';

import dynamic from 'next/dynamic';

const EventLocationPicker = dynamic(
  () => import('./EventLocationPicker'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        height: 400,
        display: 'grid',
        placeItems: 'center',
        background: '#151519',
        borderRadius: 14,
        color: '#999',
      }}>
        Загрузка карты...
      </div>
    ),
  }
);

export default EventLocationPicker;
