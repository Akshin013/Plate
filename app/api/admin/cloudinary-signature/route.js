
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { hasAdminAccess } from '../../../../lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    if (!hasAdminAccess(request)) {
      return NextResponse.json(
        { error: 'Требуется авторизация.' },
        { status: 401 }
      );
    }

    const {
      CLOUDINARY_CLOUD: cloudName,
      CLOUDINARY_API_KEY: apiKey,
      CLOUDINARY_API_SECRET: apiSecret,
    } = process.env;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Не настроена загрузка Cloudinary.' },
        { status: 503 }
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    // Генерируем актуальное время при каждом запросе
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'carid';

    // Подписываем параметры официальным методом Cloudinary
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      apiSecret
    );

    return NextResponse.json({
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
    });
  } catch (error) {
    console.error('Cloudinary signature error:', error);

    return NextResponse.json(
      { error: 'Не удалось создать подпись Cloudinary.' },
      { status: 500 }
    );
  }
}
