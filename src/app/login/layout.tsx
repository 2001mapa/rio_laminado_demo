import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://riolaminadodemo.vercel.app'),
  title: 'RIO | Catálogo exclusivo para mayoristas',
  description: 'Descubre el catálogo exclusivo para mayoristas RIO y realiza tus pedidos en un solo lugar.',
  openGraph: {
    title: 'RIO | Catálogo exclusivo para mayoristas',
    description: 'Descubre el catálogo exclusivo para mayoristas RIO y realiza tus pedidos en un solo lugar.',
    type: 'website',
    locale: 'es_CO',
  },
};

export default function LoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
