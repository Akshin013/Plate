import { cookies } from 'next/headers';
import AdminPanel from '../../components/AdminPanel';
import { ADMIN_COOKIE, isValidAdminSession } from '../../lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const password = process.env.ADMIN_PASSWORD;
  const cookieStore = await cookies();
  const authenticated = isValidAdminSession(cookieStore.get(ADMIN_COOKIE)?.value, password);
  const requiredConfiguration = [
    'GOOGLE_APPS_SCRIPT_URL',
    'GOOGLE_APPS_SCRIPT_TOKEN',
    'CLOUDINARY_CLOUD',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];
  const missingConfiguration = requiredConfiguration.filter((key) => !process.env[key]);

  return (
    <AdminPanel
      authenticated={authenticated}
      missingConfiguration={missingConfiguration}
      passwordConfigured={Boolean(password)}
    />
  );
}
