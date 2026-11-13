
import { NextResponse } from 'next/server';
import { getEvents } from '../../../lib/google-apps-script';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const events = await getEvents();

    return NextResponse.json({
      ok: true,
      events,
    });
  } catch (error) {
    console.error('Events API error:', error);

    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
