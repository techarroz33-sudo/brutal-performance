import type { Metadata } from 'next';
import { JetBrains_Mono, Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-outfit',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: 'Brutal Performance — Condicionamento Físico & Telemetria',
  description:
    'Plataforma de condicionamento físico Brutal Performance com análise biométrica, treinos personalizados para academia ou peso corporal, alimentos recomendados e cálculo calórico.',
  openGraph: {
    title: 'Brutal Performance — Condicionamento Físico & Telemetria',
    description:
      'Plataforma de condicionamento físico Brutal Performance com análise biométrica, treinos personalizados para academia ou peso corporal, alimentos recomendados e cálculo calórico.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${outfit.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-[#0B0F0D] text-[#F1F5F3] antialiased selection:bg-[#A3E635]/30 selection:text-[#D9F99D]">
        {children}
      </body>
    </html>
  );
}
