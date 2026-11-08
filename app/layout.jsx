import './globals.css';
import AutoRefresh from '../components/AutoRefresh';

export const metadata = { title: 'CarId', description: 'Профиль автолюбителя: машина, номер, соцсети' };
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <AutoRefresh />
        {children}
      </body>
    </html>
  );
}
