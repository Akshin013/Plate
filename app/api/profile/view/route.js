import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Invalid username' },
        { status: 400 }
      );
    }

    const url = process.env.GOOGLE_APPS_SCRIPT_URL;
    const token = process.env.GOOGLE_APPS_SCRIPT_TOKEN;

    if (!url || !token) {
      throw new Error('Google Apps Script environment variables are missing.');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'view',
        username,
        token,
      }),
      cache: 'no-store',
      redirect: 'follow',
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      console.error('Apps Script returned non-JSON:', text.slice(0, 500));
      throw new Error('Google Apps Script returned non-JSON response.');
    }

    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Failed to count profile view.');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Profile view error:', error);

    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}