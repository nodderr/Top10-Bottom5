import type { Metadata } from 'next';
import { Bricolage_Grotesque, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { RoomProvider } from '@/context/RoomContext';
import { AuthProvider } from '@/context/AuthContext';
import { SiteHeader } from '@/components/header/SiteHeader';
import { getCurrentUser } from '@/lib/auth/current-user';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Top 10 Bottom 5 — Guess What Made the List',
  description:
    'A multiplayer social party game. Guess what the AI ranked. Debate, laugh, argue. Play with friends.',
  keywords: ['party game', 'multiplayer', 'trivia', 'Indian', 'family feud', 'kahoot'],
  openGraph: {
    title: 'Top 10 Bottom 5',
    description: 'Guess what the AI ranked. Play with friends.',
    type: 'website',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // SSR the current user so there's no logged-in flash on first paint.
  const initialUser = await getCurrentUser();

  return (
    <html lang="en" className={`${bricolage.variable} ${geist.variable} ${geistMono.variable}`}>
      <body className="antialiased font-body bg-[var(--bg)] text-[var(--text)]">
        <AuthProvider initialUser={initialUser}>
          <SiteHeader />
          <RoomProvider>{children}</RoomProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
