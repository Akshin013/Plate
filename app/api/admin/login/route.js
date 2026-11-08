import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, createAdminSession } from '../../../../lib/admin-auth';

export async function POST(request) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return NextResponse.json({ error: 'Админка не настроена: задайте ADMIN_PASSWORD.' }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Введите пароль.' }, { status: 400 });
  }

  const supplied = Buffer.from(body.password);
  const expected = Buffer.from(password);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ error: 'Неверный пароль.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminSession(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 12 * 60 * 60,
  });
  return response;
}
