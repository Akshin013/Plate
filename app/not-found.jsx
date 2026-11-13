
import Link from 'next/link';

export const metadata = {
  title: 'Səhifə tapılmadı | Plate',
  description: 'Axtardığınız səhifə tapılmadı.',
};

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-container">

        <Link href="/" className="not-found-logo">
          PLATE<span>.</span>
        </Link>

        <div className="not-found-content">
          <div className="not-found-label">
            <span />
            ROUTE NOT FOUND
          </div>

          <h1>
            4<span>0</span>4
          </h1>

          <h2>Bu yol heç yerə aparmır.</h2>

          <p>
            Axtardığın səhifə mövcud deyil və ya artıq köçürülüb.
            Gəlin səni yenidən düzgün istiqamətə yönləndirək.
          </p>

          <Link href="/" className="not-found-button">
            Ana səhifəyə qayıt
            <span>↗</span>
          </Link>
        </div>

        <div className="not-found-bottom">
          <span>PLATE AUTOMOTIVE COMMUNITY</span>
          <span>DRIVE · MEET · CONNECT</span>
        </div>

      </div>
    </main>
  );
}
