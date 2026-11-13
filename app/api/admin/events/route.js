
import { NextResponse } from 'next/server';
import { hasAdminAccess } from '../../../../lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_LENGTHS = {
  title: 120,
  type: 50,
  city: 60,
  address: 200,
  description: 2000,
  organizer: 100,
  contact: 150,
};

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function sendAction(action, data = {}) {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  const token = process.env.GOOGLE_APPS_SCRIPT_TOKEN;

  if (!url || !token) {
    throw new Error('Не настроено подключение к Google Apps Script.');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      token,
      action,
      ...data,
    }),
    redirect: 'follow',
    cache: 'no-store',
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.error || 'Ошибка Google Apps Script.');
  }

  return result;
}

function validateEvent(body) {
  const event = {};

  for (const [field, maxLength] of Object.entries(MAX_LENGTHS)) {
    event[field] = clean(body[field]);

    if (event[field].length > maxLength) {
      throw new Error(`Поле ${field} слишком длинное.`);
    }
  }

  event.id = clean(body.id);
  event.event_date = clean(body.event_date);
  event.event_time = clean(body.event_time);
  event.image = clean(body.image);
  event.latitude = Number(body.latitude);
  event.longitude = Number(body.longitude);

  if (!event.title || !event.city || !event.event_date) {
    throw new Error('Заполните название, город и дату мероприятия.');
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(event.event_date) ||
    Number.isNaN(Date.parse(`${event.event_date}T00:00:00`))
  ) {
    throw new Error('Укажите корректную дату.');
  }

  if (
    !Number.isFinite(event.latitude) ||
    !Number.isFinite(event.longitude) ||
    event.latitude < -90 ||
    event.latitude > 90 ||
    event.longitude < -180 ||
    event.longitude > 180
  ) {
    throw new Error('Укажите корректные координаты.');
  }

  if (
    event.image &&
    !isCloudinaryImage(event.image)
  ) {
    throw new Error('Фото должно быть загружено в Cloudinary.');
  }

  if (event.event_time && !/^\d{2}:\d{2}$/.test(event.event_time)) {
    throw new Error('Укажите корректное время.');
  }

  return event;
}

function isCloudinaryImage(value) {
  try {
    const url = new URL(value);

    return (
      url.protocol === 'https:' &&
      url.hostname === 'res.cloudinary.com' &&
      url.pathname.startsWith(
        `/${process.env.CLOUDINARY_CLOUD}/image/upload/`
      )
    );
  } catch {
    return false;
  }
}

export async function GET(request) {
  if (!hasAdminAccess(request)) {
    return NextResponse.json(
      { error: 'Сессия истекла. Войдите снова.' },
      { status: 401 }
    );
  }

  try {
    const result = await sendAction('events_admin_list');

    return NextResponse.json({
      events: result.events || [],
    });
  } catch (error) {
    console.error('Ошибка загрузки мероприятий:', error);

    return NextResponse.json(
      { error: error.message },
      { status: 502 }
    );
  }
}

export async function POST(request) {
  if (!hasAdminAccess(request)) {
    return NextResponse.json(
      { error: 'Сессия истекла. Войдите снова.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Некорректный запрос.' },
        { status: 400 }
      );
    }

    const action = clean(body.action);

    if (action === 'create') {
      const event = validateEvent(body);

      const result = await sendAction('event_create', {
        event: {
          ...event,
          status: 'approved',
        },
      });

      return NextResponse.json(result);
    }

    if (action === 'update') {
      const id = clean(body.id);

      if (!id) {
        return NextResponse.json(
          { error: 'Не указан ID мероприятия.' },
          { status: 400 }
        );
      }

      const event = validateEvent(body);

      const result = await sendAction('event_update', {
        event: {
          ...event,
          id,
          status: body.status === 'rejected'
            ? 'rejected'
            : body.status === 'pending'
              ? 'pending'
              : 'approved',
        },
      });

      return NextResponse.json(result);
    }

    if (action === 'delete') {
      const id = clean(body.id);

      if (!id) {
        return NextResponse.json(
          { error: 'Не указан ID мероприятия.' },
          { status: 400 }
        );
      }

      const result = await sendAction('event_delete', { id });

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Неизвестное действие.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Ошибка управления мероприятием:', error);

    const message = error.message || 'Не удалось выполнить действие.';

    return NextResponse.json(
      { error: message },
      {
        status: message.includes('слишком длинное') ||
          message.includes('корректную') ||
          message.includes('Заполните') ||
          message.includes('Cloudinary') ||
          message.includes('координаты')
          ? 400
          : 502,
      }
    );
  }
}
