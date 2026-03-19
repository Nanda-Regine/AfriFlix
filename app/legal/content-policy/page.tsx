import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Content Policy',
  description: 'AfriFlix Content Policy — community guidelines and content standards.',
  robots: { index: true, follow: false },
}

export default function ContentPolicyPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-mono text-gold uppercase tracking-wider mb-2">Legal</p>
        <h1 className="font-syne font-bold text-4xl text-ivory mb-2">Content Policy</h1>
        <p className="text-ivory-dim mb-10">Last updated: March 2026 · These guidelines apply to all content on AfriFlix</p>

        <div className="bg-gold/10 border border-gold/20 rounded-xl p-5 mb-10">
          <p className="font-syne font-semibold text-ivory mb-1">Our principle</p>
          <p className="text-ivory-dim text-sm">AfriFlix celebrates African creativity in all its forms — including work that is challenging, provocative, and politically charged. We protect creative freedom while maintaining a space that is safe, legal, and centred on genuine African expression.</p>
        </div>

        <div className="prose prose-invert max-w-none text-ivory-dim leading-relaxed space-y-8">

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">What We Welcome</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Original African film, music, dance, poetry, writing, comedy, theatre, and visual art</li>
              <li>Content that explores African history, politics, culture, identity, and diaspora experience</li>
              <li>Content in any African language or dialect</li>
              <li>Adult content (age-rated 18) that is legal, consensual, and does not involve minors</li>
              <li>Satire and comedy — including political satire</li>
              <li>Traditional and ceremonial content, with appropriate cultural context</li>
              <li>Content that challenges — including content critical of AfriFlix or African governments</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">What Is Never Allowed</h2>
            <p>The following content will be removed immediately and may result in permanent account termination:</p>

            <h3 className="font-syne font-semibold text-ivory mt-4 mb-2">Child Safety</h3>
            <p>Any content that sexually exploits or endangers minors. This includes child sexual abuse material (CSAM), grooming material, or any sexual content depicting individuals under 18. We report such content to law enforcement without notice.</p>

            <h3 className="font-syne font-semibold text-ivory mt-4 mb-2">Incitement to Violence</h3>
            <p>Content that explicitly calls for violence against specific individuals or groups, including content promoting terrorism, genocide, or ethnic cleansing.</p>

            <h3 className="font-syne font-semibold text-ivory mt-4 mb-2">Non-Consensual Intimate Imagery</h3>
            <p>Sharing or distributing intimate images or video of individuals without their consent ("revenge porn").</p>

            <h3 className="font-syne font-semibold text-ivory mt-4 mb-2">Human Trafficking</h3>
            <p>Content that facilitates, promotes, or recruits for human trafficking or sexual exploitation.</p>

            <h3 className="font-syne font-semibold text-ivory mt-4 mb-2">Copyright Infringement</h3>
            <p>Uploading content you do not have the rights to distribute. This includes unlicensed use of music, film clips, or written works belonging to third parties.</p>

            <h3 className="font-syne font-semibold text-ivory mt-4 mb-2">Malware and Fraud</h3>
            <p>Any content designed to deceive users, steal credentials, or distribute malicious software.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">Age Ratings</h2>
            <p>All content must be accurately age-rated at upload. Our rating system:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {[
                { rating: 'G', desc: 'All ages — no mature themes' },
                { rating: 'PG', desc: 'Parental guidance — mild themes' },
                { rating: '13', desc: 'Ages 13+ — moderate themes, mild language' },
                { rating: '16', desc: 'Ages 16+ — strong themes, language, violence' },
                { rating: '18', desc: 'Adults only — explicit sexual content, graphic violence' },
              ].map(r => (
                <div key={r.rating} className="flex items-center gap-3 bg-black-card border border-white/5 rounded-lg px-4 py-3">
                  <span className="font-mono font-bold text-gold text-sm w-8">{r.rating}</span>
                  <span className="text-sm">{r.desc}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">Sensitive Content</h2>
            <p>The following content is allowed but must be clearly labelled with trigger warnings at upload:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Graphic depictions of violence, war, or trauma</li>
              <li>Content involving death, grief, or suicide (treated sensitively)</li>
              <li>Strong drug or alcohol use depictions</li>
              <li>Content that may be culturally sensitive to specific communities</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">Reporting Content</h2>
            <p>If you see content that violates this policy, use the report button on any work. You can also email <a href="mailto:safety@afriflix.co.za" className="text-gold hover:text-gold-light">safety@afriflix.co.za</a>. We review all reports within 48 hours. Reports are anonymous — the person who reported you will never be identified to the creator.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">Appeals</h2>
            <p>If your content is removed and you believe this was a mistake, email <a href="mailto:appeals@afriflix.co.za" className="text-gold hover:text-gold-light">appeals@afriflix.co.za</a> within 30 days. We will review your appeal and respond within 7 business days.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">Enforcement</h2>
            <p>Depending on severity:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong className="text-ivory">Warning:</strong> for first-time, non-severe violations</li>
              <li><strong className="text-ivory">Content removal:</strong> for policy-violating content</li>
              <li><strong className="text-ivory">Temporary suspension:</strong> for repeated or moderate violations</li>
              <li><strong className="text-ivory">Permanent ban:</strong> for severe violations (CSAM, terrorism, etc.)</li>
            </ul>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-sm text-ivory-dim">
          <Link href="/legal/terms" className="hover:text-gold transition-colors">Terms of Service</Link>
          <Link href="/legal/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link>
          <Link href="/legal/creator-agreement" className="hover:text-gold transition-colors">Creator Agreement</Link>
          <Link href="/" className="hover:text-gold transition-colors">Back to AfriFlix</Link>
        </div>
      </div>
    </div>
  )
}
