
import { NextResponse } from 'next/server';
import { randomUUID, createHash } from 'crypto';

export const runtime = 'nodejs';

const COOKIE_NAME = 'carid_visitor';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

async function handleLike(request, context, action) {
  try {
    const { username } = await context.params;
    const normalizedUsername = String(username || '')
      .trim()
      .toLowerCase();

    if (!normalizedUsername) {
      return NextResponse.json(
        { ok: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    let visitorId = request.cookies.get(COOKIE_NAME)?.value;

    if (!visitorId || !/^[a-f0-9-]{36}$/i.test(visitorId)) {
      visitorId = randomUUID();
    }

    const visitorHash = createHash('sha256')
      .update(visitorId)
      .digest('hex');

    const url = process.env.GOOGLE_APPS_SCRIPT_URL;
    const token = process.env.GOOGLE_APPS_SCRIPT_TOKEN;

    if (!url || !token) {
      return NextResponse.json(
        { ok: false, error: 'Google Apps Script is not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        action,
        username: normalizedUsername,
        visitorHash,
      }),
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });

    const data = await response.json();

    const result = NextResponse.json(data, {
      status: response.ok ? 200 : response.status,
    });

    result.cookies.set(COOKIE_NAME, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });

    return result;
  } catch (error) {
    console.error('Like API error:', error);

    return NextResponse.json(
      { ok: false, error: 'Failed to process like' },
      { status: 500 }
    );
  }
}

export async function GET(request, context) {
  return handleLike(request, context, 'like_status');
}

export async function POST(request, context) {
  return handleLike(request, context, 'like');
}
