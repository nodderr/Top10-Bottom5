import type { Metadata } from 'next';
import './globals.css';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
