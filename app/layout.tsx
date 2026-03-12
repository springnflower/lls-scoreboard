import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LLS Scoreboard',
  description: 'LLS sales scoreboard web dashboard'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
