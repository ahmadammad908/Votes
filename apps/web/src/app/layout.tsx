import type { Metadata } from 'next';
import '../app/globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Superior Connection — University Student Beauty Voting Platform',
  description: 'A fast, modern, consenting university student beauty voting platform. Compare contestants, vote, and explore the Superior Connection leaderboard.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-white">
      <body className="bg-white text-gray-100 flex flex-col min-h-screen selection:bg-brand-pink selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-grow flex flex-col">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
