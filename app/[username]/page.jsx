
import { notFound } from 'next/navigation';
import Profile from '../../components/Profile';
import { getProfile } from '../../lib/profiles';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { username } = await params;
  const p = await getProfile(username);

  if (!p) return {};

  const title = `${p.name} · ${p.car.brand} ${p.car.model}`;
  const description = `Avtomobil profili: ${p.car.brand} ${p.car.model}. ${p.plate ? `Dövlət nömrəsi: ${p.plate}.` : ''} CarId — avtomobilinin rəqəmsal profili.`;

  const image = p.avatar || '/og-image.jpg';
  const url = `https://carid.az/${p.username}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'CarId',
      type: 'profile',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function Page({ params }) {
  const { username } = await params;
  const p = await getProfile(username);

  if (!p) notFound();

  return <Profile p={p} />;
}
