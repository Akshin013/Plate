
import { NextResponse } from 'next/server';

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

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        action: 'view',
        username: decodeURIComponent(username).trim().toLowerCase(),
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

    return NextResponse.json({
      success: true,
      username,
      views: data.views,
    });

  } catch (error) {
    console.error('View counter error:', error);

    return NextResponse.json(
      { error: 'Failed to record profile view' },
      { status: 500 }
    );
  }
}
