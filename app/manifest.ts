import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AfriFlix',
    short_name: 'AfriFlix',
    description: 'African Stories. Global Stage. — African film, music, dance, poetry, writing, comedy, theatre and art.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0A',
    theme_color: '#C9A84C',
    orientation: 'portrait-primary',
    categories: ['entertainment', 'music', 'video'],
    lang: 'en',
    dir: 'ltr',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    shortcuts: [
      { name: 'Browse', url: '/explore', description: 'Discover African content' },
      { name: 'Collabs', url: '/collabs', description: 'Find creative collaborators' },
      { name: 'Dashboard', url: '/dashboard', description: 'Creator dashboard' },
    ],
    screenshots: [],
  }
}
