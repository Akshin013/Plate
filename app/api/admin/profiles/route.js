
import { NextResponse } from 'next/server';
import { hasAdminAccess } from '../../../../lib/admin-auth';
import { appendProfile } from '../../../../lib/google-apps-script';
import { getAllProfiles } from '../../../../lib/profiles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_LENGTHS = {
  username: 40,
  name: 100,
  car_brand: 60,
  car_model: 60,
  plate: 30,
  instagram: 100,
  telegram: 100,
  tiktok: 100,
  youtube: 100,
};

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateProfile(body) {
  const profile = Object.fromEntries(
    Object.keys(MAX_LENGTHS).map(field => [
      field,
      clean(body[field]),
    ])
  );

  profile.username = profile.username.toLowerCase();

  for (const [field, maxLength] of Object.entries(MAX_LENGTHS)) {
    if (profile[field].length > maxLength) {
      throw new Error(`Поле ${field} слишком длинное.`);
    }
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(profile.username)) {
    throw new Error('Некорректный ник профиля.');
  }

  for (const field of ['name', 'car_brand', 'car_model', 'plate']) {
    if (!profile[field]) {
      throw new Error('Заполните имя, марку, модель и номер автомобиля.');
    }
  }

  profile.avatar = clean(body.avatar);
  profile.video = clean(body.video);

  if (profile.avatar && !isCloudinaryUrl(profile.avatar, 'image')) {
    throw new Error('Аватар должен быть загружен в Cloudinary.');
  }

  if (profile.video && !isCloudinaryUrl(profile.video, 'video')) {
    throw new Error('Видео должно быть загружено в Cloudinary.');
  }

  return profile;
}

function isCloudinaryUrl(value, resourceType) {
  try {
    const url = new URL(value);

    return url.protocol === 'https:'
      && url.hostname === 'res.cloudinary.com'
      && url.pathname.startsWith(
        `/${process.env.CLOUDINARY_CLOUD}/${resourceType}/upload/`
      );
  } catch {
    return false;
  }
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

export async function GET(request) {
  if (!hasAdminAccess(request)) {
    return NextResponse.json(
      { error: 'Сессия истекла. Войдите снова.' },
      { status: 401 }
    );
  }

  try {
    const profiles = await getAllProfiles();
    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Не удалось прочитать профили:', error);

    return NextResponse.json(
      { error: 'Не удалось прочитать таблицу.' },
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

  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Некорректный запрос.' },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json(
      { error: 'Некорректный запрос.' },
      { status: 400 }
    );
  }

  try {
    // Создание профиля — старый формат запроса сохраняется
    if (!body.action || body.action === 'create') {
      const profile = validateProfile(body);
      const created = await appendProfile(profile);

      if (!created) {
        return NextResponse.json(
          { error: 'Профиль с таким ником уже существует.' },
          { status: 409 }
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Редактирование
    if (body.action === 'update') {
      const username = clean(body.username).toLowerCase();

      if (!username) {
        return NextResponse.json(
          { error: 'Не указан ник профиля.' },
          { status: 400 }
        );
      }

      const profile = validateProfile({
        ...body.profile,
        username,
      });

      const result = await sendAction('update', {
        username,
        profile,
      });

      return NextResponse.json(result);
    }

    // Скрыть / показать
    if (body.action === 'toggle') {
      const username = clean(body.username).toLowerCase();

      if (!username || typeof body.active !== 'boolean') {
        return NextResponse.json(
          { error: 'Некорректные данные.' },
          { status: 400 }
        );
      }

      const result = await sendAction('toggle', {
        username,
        active: body.active,
      });

      return NextResponse.json(result);
    }

    // Удаление
    if (body.action === 'delete') {
      const username = clean(body.username).toLowerCase();

      if (!username) {
        return NextResponse.json(
          { error: 'Не указан ник профиля.' },
          { status: 400 }
        );
      }

      const result = await sendAction('delete', { username });

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Неизвестное действие.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Ошибка управления профилем:', error);

    const message = error.message || 'Не удалось выполнить действие.';

    return NextResponse.json(
      { error: message },
      { status: message.includes('слишком длинное') ? 400 : 502 }
    );
  }
}
