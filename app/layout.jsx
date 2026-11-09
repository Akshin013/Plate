import './globals.css';
import AutoRefresh from '../components/AutoRefresh';

export const metadata = {
  title: 'Plate',
  description: 'Plate',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <AutoRefresh /> BYD 
        {children}
      </body>
    </html>
  );
}