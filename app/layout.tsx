import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Providers } from '@/components/layout/providers'
import { ChatAssistant } from '@/components/ai/chat-assistant'

export const metadata: Metadata = {
  title: { default: 'AfriFlix — African Stories. Global Stage.', template: '%s | AfriFlix' },
  description: 'Africa\'s multi-format creative streaming platform. Film, music, dance, poetry, writing, comedy, theatre and visual art from all 54 African nations.',
  keywords: ['African film', 'African music', 'African stories', 'African creators', 'streaming', 'Nollywood', 'amapiano', 'afrobeats'],
  authors: [{ name: 'Nanda Regine', url: 'https://creativelynanda.co.za' }],
  creator: 'Mirembe Muse (Pty) Ltd',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://afriflix.co.za'),
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://afriflix.co.za',
    siteName: 'AfriFlix',
    title: 'AfriFlix — African Stories. Global Stage.',
    description: 'The home of African creative content. Film, music, poetry and more from all 54 African nations.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AfriFlix — African Stories. Global Stage.',
    description: 'The home of African creative content.',
    images: ['/og-image.jpg'],
  },
  manifest: '/manifest.json',
  themeColor: '#D85A30',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" suppressHydrationWarning>
      <body>
        <Providers>
          <Header />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <ChatAssistant />
        </Providers>
      </body>
    </html>
  )
}
