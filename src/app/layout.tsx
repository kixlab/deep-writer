import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CoWriThink',
  description: 'AI-assisted writing tool for writer autonomy',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
