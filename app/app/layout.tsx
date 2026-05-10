import './globals.css';
import type { Metadata } from 'next';
import AuthGuard from './components/AuthGuard';

export const metadata: Metadata = {
  title: 'Athex — Intelligent Learning Platform',
  description: 'Transform any lecture or video into interactive notes, quizzes, and flashcards with AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Outfit:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthGuard>
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}
