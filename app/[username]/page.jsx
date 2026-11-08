import { notFound } from 'next/navigation';
import Profile from '../../components/Profile';
import { getProfile } from '../../lib/profiles';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { username } = await params;
  const p = await getProfile(username);
  return p ? { title: `${p.name} · ${p.car.brand} ${p.car.model}` } : {};
}

export default async function Page({ params }) {
  const { username } = await params;
  const p = await getProfile(username);
  if (!p) notFound();
  return <Profile p={p} />;
}