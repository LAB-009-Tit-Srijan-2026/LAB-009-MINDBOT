import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next.js App',
  description: 'A minimal Next.js app scaffolded in the app folder.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="app-wrapper">
          {/* ── CINEMATIC BACKGROUND VIDEO ── */}
          <video autoPlay loop muted playsInline className="background-video">
            <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
          </video>
          <div className="video-overlay"></div>
          
          <div className="app-container">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
