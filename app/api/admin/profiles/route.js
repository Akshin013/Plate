import { NextResponse } from 'next/server';
import { hasAdminAccess } from '../../../../lib/admin-auth';
import { appendProfile } from '../../../../lib/google-apps-script';
import { getAllProfiles } from '../../../../lib/profiles';

export const runtime = 'nodejs';

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

function isCloudinaryUrl(value, resourceType) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && url.hostname === `res.cloudinary.com`
      && url.pathname.startsWith(`/${process.env.CLOUDINARY_CLOUD}/${resourceType}/upload/`);
  } catch {
    return false;
  }
}

export async function POST(request) {
  if (!hasAdminAccess(request)) {
    return NextResponse.json({ error: 'Сессия истекла. Войдите снова.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Некорректный запрос.' }, { status: 400 });
  }

  const profile = Object.fromEntries(
    Object.keys(MAX_LENGTHS).map((field) => [field, clean(body[field])]),
  );
  profile.username = profile.username.toLowerCase();
  for (const [field, maxLength] of Object.entries(MAX_LENGTHS)) {
    if (profile[field].length > maxLength) {
      return NextResponse.json({ error: `Поле ${field} слишком длинное.` }, { status: 400 });
    }
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(profile.username)) {
    return NextResponse.json({ error: 'Ник должен содержать только латинские буквы, цифры и дефисы.' }, { status: 400 });
  }
  for (const field of ['name', 'car_brand', 'car_model', 'plate']) {
    if (!profile[field]) {
      return NextResponse.json({ error: 'Заполните имя, марку, модель и номер автомобиля.' }, { status: 400 });
    }
  }

  profile.avatar = clean(body.avatar);
  profile.video = clean(body.video);
  if (profile.avatar && !isCloudinaryUrl(profile.avatar, 'image')) {
    return NextResponse.json({ error: 'Аватар должен быть загружен в Cloudinary.' }, { status: 400 });
  }
  if (profile.video && !isCloudinaryUrl(profile.video, 'video')) {
    return NextResponse.json({ error: 'Видео должно быть загружено в Cloudinary.' }, { status: 400 });
  }

  try {
    const created = await appendProfile(profile);
    if (!created) {
      return NextResponse.json({ error: 'Профиль с таким ником уже существует.' }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Не удалось создать профиль:', error);
    const message = error.message.startsWith('Google Sheet header row')
      ? 'Проверьте названия столбцов в первой строке Google Таблицы.'
      : error.message;
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!hasAdminAccess(request)) {
    return NextResponse.json({ error: 'Сессия истекла. Войдите снова.' }, { status: 401 });
  }
  try {
    const profiles = await getAllProfiles();
    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Не удалось прочитать профили:', error);
    return NextResponse.json({ error: 'Не удалось прочитать таблицу.' }, { status: 502 });
  }
}