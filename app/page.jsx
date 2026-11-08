import Search from '../components/Search';
import { getProfiles } from '../lib/profiles';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const all = await getProfiles();
  // В браузер отдаём только то, что нужно для поиска
  const list = all.map((p) => ({ username: p.username, name: p.name, car: p.car, plate: p.plate }));
  return (
    <>
      <div className="amb" />
      <main className="home">
        <h1 className="logo">CarId</h1>
        <p className="slogan">Твоя машина — твой профиль</p>
        <Search profiles={list} />
      </main>
    </>
  );
}