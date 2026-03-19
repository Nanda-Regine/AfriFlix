import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'AfriFlix Privacy Policy — how we collect, use, and protect your personal information under POPIA.',
  robots: { index: true, follow: false },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-mono text-gold uppercase tracking-wider mb-2">Legal</p>
        <h1 className="font-syne font-bold text-4xl text-ivory mb-2">Privacy Policy</h1>
        <p className="text-ivory-dim mb-10">Last updated: March 2026 · Compliant with the Protection of Personal Information Act (POPIA), Act 4 of 2013</p>

        <div className="prose prose-invert max-w-none text-ivory-dim leading-relaxed space-y-8">

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">1. Responsible Party</h2>
            <p><strong className="text-ivory">Mirembe Muse (Pty) Ltd</strong> ("we", "us", "our") is the Responsible Party as defined under POPIA. We are responsible for the lawful processing of your personal information.</p>
            <p className="mt-2">Contact: <a href="mailto:privacy@afriflix.co.za" className="text-gold hover:text-gold-light">privacy@afriflix.co.za</a> · East London, Eastern Cape, South Africa</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">2. Information We Collect</h2>
            <p>We collect the following categories of personal information:</p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li><strong className="text-ivory">Account data:</strong> email address, display name, username, country, profile photo</li>
              <li><strong className="text-ivory">Creative identity:</strong> categories, languages, cultural roots, diaspora status (provided voluntarily)</li>
              <li><strong className="text-ivory">Content data:</strong> works you upload, metadata, AI-generated summaries, mood/theme tags</li>
              <li><strong className="text-ivory">Usage data:</strong> pages viewed, content watched, search queries, view history, hearts, follows, comments</li>
              <li><strong className="text-ivory">Payment data:</strong> transaction references, amounts, currency. We do not store full card numbers — payments are processed by PayFast and Flutterwave.</li>
              <li><strong className="text-ivory">Technical data:</strong> IP address, browser type, device information, service worker activity</li>
              <li><strong className="text-ivory">AI interaction data:</strong> messages sent to AfriFlix AI features (not stored beyond your session)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">3. Why We Process Your Information (Lawful Basis)</h2>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-ivory">Contract performance:</p>
                <p>To provide the Platform, process payments, and deliver creator and fan services you have signed up for.</p>
              </div>
              <div>
                <p className="font-semibold text-ivory">Legitimate interests:</p>
                <p>To improve discovery, personalise your experience, operate AI features, and prevent fraud and abuse.</p>
              </div>
              <div>
                <p className="font-semibold text-ivory">Consent:</p>
                <p>For non-essential cookies, marketing communications, and push notifications — where you have given explicit consent.</p>
              </div>
              <div>
                <p className="font-semibold text-ivory">Legal obligation:</p>
                <p>To comply with South African law, including the ECT Act and financial regulations.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">4. How We Share Your Information</h2>
            <p>We share personal information only in the following circumstances:</p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li><strong className="text-ivory">Service providers:</strong> Supabase (database hosting), Cloudflare (video/audio storage and delivery), PayFast and Flutterwave (payment processing), Upstash (rate limiting), Anthropic (AI features — no personal data sent to Claude, only content metadata)</li>
              <li><strong className="text-ivory">Other users:</strong> Your public profile information (display name, username, bio, works) is visible to all users of the Platform</li>
              <li><strong className="text-ivory">Legal requirements:</strong> Where required by court order, law enforcement, or other legal process</li>
              <li><strong className="text-ivory">Business transfer:</strong> In the event of a merger or acquisition, with appropriate protections</li>
            </ul>
            <p className="mt-3">We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">5. Cross-Border Transfers</h2>
            <p>Some service providers (Supabase, Cloudflare, Anthropic) are based outside South Africa. We ensure that any cross-border transfer of personal information is subject to appropriate safeguards consistent with POPIA and international best practice.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">6. Retention</h2>
            <p>We retain your personal information for as long as your account is active or as needed to provide services, comply with legal obligations, and resolve disputes. Account data is deleted within 90 days of account deletion. Payment records are retained for 5 years as required by financial regulations. Usage analytics may be retained in anonymised form indefinitely.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">7. Your Rights Under POPIA</h2>
            <p>As a data subject, you have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Know what personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information (subject to legal retention requirements)</li>
              <li>Object to processing based on legitimate interests</li>
              <li>Withdraw consent where processing is based on consent</li>
              <li>Lodge a complaint with the Information Regulator of South Africa</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact <a href="mailto:privacy@afriflix.co.za" className="text-gold hover:text-gold-light">privacy@afriflix.co.za</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">8. Security</h2>
            <p>We implement industry-standard technical and organisational measures to protect your information, including: row-level security on all database tables, HTTPS/TLS encryption in transit, encrypted storage, rate limiting, IP-based access controls on payment webhooks, and regular security audits.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">9. Cookies and Tracking</h2>
            <p>We use essential cookies for authentication and session management (via Supabase). We do not use third-party advertising or tracking cookies. The service worker caches content for offline access — this data remains on your device and is not transmitted to us.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">10. Children's Privacy</h2>
            <p>AfriFlix is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">11. Information Regulator</h2>
            <p>If you are not satisfied with our response to a privacy complaint, you may contact the Information Regulator of South Africa: <a href="https://inforegulator.org.za" className="text-gold hover:text-gold-light" target="_blank" rel="noopener noreferrer">inforegulator.org.za</a> · complaints.IR@justice.gov.za</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">12. Changes</h2>
            <p>We will notify you of material changes to this policy via email or a prominent notice on the Platform at least 30 days before they take effect.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-sm text-ivory-dim">
          <Link href="/legal/terms" className="hover:text-gold transition-colors">Terms of Service</Link>
          <Link href="/legal/creator-agreement" className="hover:text-gold transition-colors">Creator Agreement</Link>
          <Link href="/legal/content-policy" className="hover:text-gold transition-colors">Content Policy</Link>
          <Link href="/" className="hover:text-gold transition-colors">Back to AfriFlix</Link>
        </div>
      </div>
    </div>
  )
}
