import type { Metadata } from 'next';
import { Open_Sans, Poppins } from 'next/font/google';
import './globals.css';

// Open Sans pour le corps de texte
const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open',
  display: 'swap',
});

// Poppins comme alternative à PP Nikkei Maru pour les titres
// Note: PP Nikkei Maru n'est pas disponible sur Google Fonts
// Poppins est une police arrondie moderne qui peut servir d'alternative
// TODO: Pour utiliser PP Nikkei Maru, importer la police localement dans /public/fonts
const nikkeiMaru = Poppins({
  subsets: ['latin'],
  variable: '--font-nikkei',
  weight: ['600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Simulateur de Remboursement Mutuelle',
  description: 'Estimez en quelques clics votre reste à charge après remboursement de l\'Assurance Maladie et de votre mutuelle.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${openSans.variable} ${nikkeiMaru.variable}`}>
        {children}
      </body>
    </html>
  );
}

