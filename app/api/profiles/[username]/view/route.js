
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function POST(request, { params }) {
  try {
    const { username } = await params;

    const url = process.env.GOOGLE_APPS_SCRIPT_URL;
    const token = process.env.GOOGLE_APPS_SCRIPT_TOKEN;

    if (!url || !token) {
      return NextResponse.json(
        { error: 'Google Apps Script environment variables are missing' },
        { status: 500 }
      );
    }

    const normalizedUsername = decodeURIComponent(username)
      .trim()
      .toLowerCase();

    let visitorId = request.cookies.get('carid_visitor')?.value;

    if (!visitorId || !/^[a-f0-9-]{36}$/i.test(visitorId)) {
      visitorId = randomUUID();
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        action: 'view',
        username: normalizedUsername,
        visitorId,
      }),
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      console.error('Apps Script returned non-JSON:', text.slice(0, 500));

      return NextResponse.json(
        { error: 'Google Apps Script returned invalid response' },
        { status: 502 }
      );
    }

    if (!response.ok || !data.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to update views' },
        { status: 400 }
      );
    }

    const result = NextResponse.json({
      success: true,
      username: normalizedUsername,
      views: data.views,
      counted: data.counted,
    });

    result.cookies.set('carid_visitor', visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return result;
  } catch (error) {
    console.error('View counter error:', error);

    return NextResponse.json(
      { error: 'Failed to record profile view' },
      { status: 500 }
    );
  }
}
