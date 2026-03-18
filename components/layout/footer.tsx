import Link from 'next/link'

const LINKS = {
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Press', href: '/press' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
  ],
  Platform: [
    { label: 'Browse', href: '/explore' },
    { label: 'For Creators', href: '/signup' },
    { label: 'Partnerships', href: '/partners' },
    { label: 'Collab Board', href: '/collabs' },
  ],
  Contact: [
    { label: 'hello@mirembemuse.co.za', href: 'mailto:hello@mirembemuse.co.za' },
    { label: 'creativelynanda.co.za', href: 'https://creativelynanda.co.za' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-black-mid border-t border-white/5 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="font-syne font-bold text-2xl mb-3">
              <span className="text-ivory">Afri</span>
              <span className="text-gold">Flix</span>
            </div>
            <p className="text-ivory-dim text-sm leading-relaxed mb-4">
              African Stories. Global Stage.
            </p>
            <p className="text-ivory-dim text-xs">
              Representing all 54 African nations.
            </p>
          </div>

          {/* Link groups */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <h3 className="font-syne font-semibold text-ivory-mid text-sm uppercase tracking-wider mb-4">
                {group}
              </h3>
              <ul className="flex flex-col gap-3">
                {links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-ivory-dim text-sm hover:text-ivory transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-ivory-dim text-xs">
            &copy; {new Date().getFullYear()} Mirembe Muse (Pty) Ltd. All rights reserved.
          </p>
          <p className="text-ivory-dim text-xs">
            Built by{' '}
            <Link href="https://creativelynanda.co.za" className="text-gold hover:text-gold-light transition-colors">
              Nanda Regine
            </Link>
            {' '}— AI Engineer & Creative Technologist
          </p>
        </div>
      </div>
    </footer>
  )
}
