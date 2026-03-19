import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'AfriFlix Terms of Service — the rules governing your use of the platform.',
  robots: { index: true, follow: false },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-mono text-gold uppercase tracking-wider mb-2">Legal</p>
        <h1 className="font-syne font-bold text-4xl text-ivory mb-2">Terms of Service</h1>
        <p className="text-ivory-dim mb-10">Last updated: March 2026 · Governed by the laws of the Republic of South Africa</p>

        <div className="prose prose-invert max-w-none text-ivory-dim leading-relaxed space-y-8">

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">1. Who We Are</h2>
            <p>AfriFlix is operated by <strong className="text-ivory">Mirembe Muse (Pty) Ltd</strong>, a company incorporated in South Africa (East London). These Terms of Service ("Terms") constitute a legally binding agreement between you and Mirembe Muse (Pty) Ltd regarding your use of the AfriFlix platform accessible at afriflix.co.za ("Platform").</p>
            <p className="mt-3">By accessing or using the Platform, you confirm that you have read, understood, and agree to be bound by these Terms, our <Link href="/legal/privacy" className="text-gold hover:text-gold-light">Privacy Policy</Link>, and our <Link href="/legal/content-policy" className="text-gold hover:text-gold-light">Content Policy</Link>.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">2. Eligibility</h2>
            <p>You must be at least 13 years old to use AfriFlix. If you are under 18, you confirm that you have parental or guardian consent. The Platform is designed for African creators and audiences — creators must be African nationals, African diaspora, or have significant cultural connection to Africa.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">3. Account Registration</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorised use. You may not create multiple accounts or transfer your account without our consent.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">4. Creator Accounts</h2>
            <p>Creator accounts are subject to our <Link href="/legal/creator-agreement" className="text-gold hover:text-gold-light">Creator Agreement</Link> in addition to these Terms. Creators warrant that they are the rightful owner of, or have full rights to distribute, all content they upload.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">5. Intellectual Property</h2>
            <p>You retain all intellectual property rights in content you upload. By uploading to AfriFlix, you grant Mirembe Muse (Pty) Ltd a non-exclusive, royalty-free, worldwide licence to host, display, and distribute your content on the Platform for the purpose of operating the service.</p>
            <p className="mt-3">AfriFlix's brand, design, software, and all non-user-generated content are the exclusive property of Mirembe Muse (Pty) Ltd. You may not copy, modify, or distribute them without express written permission.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">6. Payments and Subscriptions</h2>
            <p>Subscription payments are processed through PayFast for South African and pan-African users. By subscribing, you authorise PayFast to charge your payment method on a recurring monthly basis. Subscriptions renew automatically until cancelled.</p>
            <p className="mt-3">Tips to creators are processed through PayFast or Flutterwave. All payments are subject to the payment processor's own terms. AfriFlix retains a 10% platform fee on creator tips. Subscription fees are non-refundable except as required by the Consumer Protection Act, 68 of 2008.</p>
            <p className="mt-3">You may cancel your subscription at any time through your dashboard. Access continues until the end of the paid billing period.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">7. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Upload content that infringes any third-party intellectual property rights</li>
              <li>Upload content that is illegal under South African law or the laws of the content's country of origin</li>
              <li>Harass, abuse, or harm other users or creators</li>
              <li>Attempt to reverse engineer, scrape, or circumvent the Platform's security</li>
              <li>Use automated bots to access, view, or interact with content</li>
              <li>Upload malware, viruses, or any malicious code</li>
              <li>Misrepresent your identity or African heritage for verification purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">8. Content Moderation</h2>
            <p>We reserve the right to remove any content that violates these Terms or our Content Policy, at our sole discretion. We will make reasonable efforts to notify you of removals. Repeat violations may result in account suspension or termination.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Mirembe Muse (Pty) Ltd shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform. Our total aggregate liability shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">10. Termination</h2>
            <p>You may delete your account at any time from your settings. We may terminate or suspend accounts that violate these Terms. Upon termination, your licence to use the Platform ceases, but these Terms survive to the extent necessary to address prior conduct.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">11. Governing Law and Disputes</h2>
            <p>These Terms are governed by the laws of the Republic of South Africa. Any dispute shall first be referred to mediation. If unresolved, disputes shall be subject to the exclusive jurisdiction of the courts of South Africa. Nothing in these Terms limits your statutory rights under the Consumer Protection Act or the Electronic Communications and Transactions Act.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">12. Changes to These Terms</h2>
            <p>We may update these Terms from time to time. Material changes will be notified via email or a prominent notice on the Platform. Continued use after the effective date of changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">13. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:legal@afriflix.co.za" className="text-gold hover:text-gold-light">legal@afriflix.co.za</a> or write to: Mirembe Muse (Pty) Ltd, East London, Eastern Cape, South Africa.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-sm text-ivory-dim">
          <Link href="/legal/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link>
          <Link href="/legal/creator-agreement" className="hover:text-gold transition-colors">Creator Agreement</Link>
          <Link href="/legal/content-policy" className="hover:text-gold transition-colors">Content Policy</Link>
          <Link href="/" className="hover:text-gold transition-colors">Back to AfriFlix</Link>
        </div>
      </div>
    </div>
  )
}
