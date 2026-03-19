import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Creator Agreement',
  description: 'AfriFlix Creator Agreement — the terms governing creators who publish content on the platform.',
  robots: { index: true, follow: false },
}

export default function CreatorAgreementPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-mono text-gold uppercase tracking-wider mb-2">Legal</p>
        <h1 className="font-syne font-bold text-4xl text-ivory mb-2">Creator Agreement</h1>
        <p className="text-ivory-dim mb-10">Last updated: March 2026 · This agreement supplements the <Link href="/legal/terms" className="text-gold hover:text-gold-light">Terms of Service</Link></p>

        <div className="prose prose-invert max-w-none text-ivory-dim leading-relaxed space-y-8">

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">1. Who Is a Creator?</h2>
            <p>A "Creator" is any user who establishes a creator profile and publishes content on AfriFlix. By creating a profile and uploading content, you agree to this Creator Agreement in addition to our Terms of Service.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">2. Your Content, Your Rights</h2>
            <p>You own your content. AfriFlix will never claim ownership of works you upload. The licence you grant us is limited to what is necessary to operate the platform:</p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>Hosting, encoding, and delivering your content to users</li>
              <li>Generating AI-powered summaries, mood tags, and theme tags to improve discoverability</li>
              <li>Displaying your content in search results, browse rows, and recommendations</li>
              <li>Creating thumbnails and preview clips for promotional purposes within AfriFlix</li>
            </ul>
            <p className="mt-3">This licence is non-exclusive. You may distribute your content anywhere else simultaneously. You may remove your content at any time — deletion takes effect within 48 hours from Cloudflare infrastructure.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">3. Content Standards</h2>
            <p>All content must comply with our <Link href="/legal/content-policy" className="text-gold hover:text-gold-light">Content Policy</Link>. As a creator, you specifically warrant that:</p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>You hold all necessary rights, licences, and permissions for every element of your uploaded content (including music, clips, images, and written text)</li>
              <li>Your content does not violate any third-party intellectual property rights</li>
              <li>Explicit content (if any) is accurately age-rated and does not involve minors</li>
              <li>Content described as factual is truthful and not deliberately misleading</li>
              <li>You have obtained consent from individuals who appear in your content</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">4. Earnings and Payments</h2>

            <h3 className="font-syne font-semibold text-ivory mt-4 mb-2">4.1 Tips</h3>
            <p>Fans may send tips to creators via PayFast or Flutterwave. AfriFlix retains a platform fee of <strong className="text-ivory">10%</strong> of each tip. The remaining 90% is attributed to your earnings. Payouts are processed monthly for balances above R100 (or equivalent). You are responsible for declaring tip income for tax purposes.</p>

            <h3 className="font-syne font-semibold text-ivory mt-4 mb-2">4.2 Subscriptions</h3>
            <p>Creator Pro (R99/month) and Label/Brand (R499/month) plans unlock enhanced features including tips, priority discovery, unlimited AI assistance, and advanced analytics. Subscription fees are non-refundable. You may cancel at any time — access continues until the end of the paid period.</p>

            <h3 className="font-syne font-semibold text-ivory mt-4 mb-2">4.3 Collab Board</h3>
            <p>Compensation agreed through the Collab Board is directly between creators. AfriFlix does not facilitate or guarantee payment for collab arrangements. We are not party to collab agreements.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">5. African Identity</h2>
            <p>AfriFlix is built for African creators. You warrant that you are an African national, African diaspora, or have a genuine and significant creative or cultural connection to Africa. We may request verification at any time. Misrepresentation of African identity to access the platform or verification badges constitutes a material breach of this agreement.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">6. AI Features</h2>
            <p>AfriFlix uses Claude (by Anthropic) to enrich your content metadata and assist your creative strategy. By uploading content, you consent to its title, description, genre, and metadata being processed by Claude to generate AI summaries and tags. No actual audio, video, or written content is sent to Anthropic — only descriptive metadata.</p>
            <p className="mt-3">AI-generated summaries and tags remain your property. You may edit or delete them at any time.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">7. Content Removal and Account Suspension</h2>
            <p>We may remove content or suspend your account if:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>It violates these terms or our Content Policy</li>
              <li>We receive a valid copyright takedown notice (DMCA or equivalent)</li>
              <li>We receive a valid court order</li>
              <li>It poses risk of harm to users or third parties</li>
            </ul>
            <p className="mt-3">We will provide notice and an opportunity to appeal, except where prohibited by law or where immediate removal is required to prevent harm.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">8. Copyright Infringement (DMCA / South African Copyright Act)</h2>
            <p>If you believe your copyright-protected work has been infringed on AfriFlix, please send a takedown notice to <a href="mailto:legal@afriflix.co.za" className="text-gold hover:text-gold-light">legal@afriflix.co.za</a> with:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Identification of the copyrighted work claimed to be infringed</li>
              <li>The URL of the allegedly infringing content</li>
              <li>Your contact information and a statement that the complaint is made in good faith</li>
              <li>Your signature (physical or electronic)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">9. Independence</h2>
            <p>Creators are independent contributors, not employees, agents, or partners of Mirembe Muse (Pty) Ltd. Nothing in this agreement creates an employment or agency relationship.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">10. Contact</h2>
            <p>For creator support: <a href="mailto:creators@afriflix.co.za" className="text-gold hover:text-gold-light">creators@afriflix.co.za</a></p>
            <p className="mt-1">For copyright or legal matters: <a href="mailto:legal@afriflix.co.za" className="text-gold hover:text-gold-light">legal@afriflix.co.za</a></p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-sm text-ivory-dim">
          <Link href="/legal/terms" className="hover:text-gold transition-colors">Terms of Service</Link>
          <Link href="/legal/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link>
          <Link href="/legal/content-policy" className="hover:text-gold transition-colors">Content Policy</Link>
          <Link href="/" className="hover:text-gold transition-colors">Back to AfriFlix</Link>
        </div>
      </div>
    </div>
  )
}
