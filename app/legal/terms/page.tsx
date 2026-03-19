import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — AfriFlix',
  description: 'The terms and conditions governing your use of AfriFlix. Applies globally.',
  robots: { index: true, follow: false },
}

const EFFECTIVE_DATE = 'March 2026'
const COMPANY = 'Mirembe Muse (Pty) Ltd'
const EMAIL = 'legal@afriflix.co.za'

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-mono text-gold uppercase tracking-wider mb-2">Legal</p>
        <h1 className="font-syne font-bold text-4xl text-ivory mb-2">Terms of Service</h1>
        <p className="text-ivory-dim text-sm mb-10">
          Effective: {EFFECTIVE_DATE} &middot; Governing law: Republic of South Africa &middot; Applies globally
        </p>

        <div className="space-y-10 text-ivory-dim leading-relaxed">

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using AfriFlix (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;).
              If you do not agree, do not use the Platform. These Terms form a legally binding agreement between you and{' '}
              <strong className="text-ivory">{COMPANY}</strong>, the company that owns and operates AfriFlix.
            </p>
            <p className="mt-2">
              If you are using AfriFlix on behalf of an organisation, you represent that you have authority to bind that organisation to these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">2. Eligibility</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>You must be at least 13 years of age to use AfriFlix (16 in the EU/UK)</li>
              <li>You must provide accurate registration information</li>
              <li>One account per person; shared or automated accounts are prohibited</li>
              <li>You must not be prohibited from receiving services under applicable law</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">3. Your Account</h2>
            <p>You are responsible for:</p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>Keeping your password secure and not sharing your account</li>
              <li>All activity that occurs under your account</li>
              <li>Notifying us immediately at <a href={`mailto:${EMAIL}`} className="text-gold hover:underline">{EMAIL}</a> of any unauthorised access</li>
              <li>Ensuring your account information remains accurate and up to date</li>
            </ul>
            <p className="mt-3">
              We reserve the right to terminate accounts that violate these Terms, impersonate others, or are found to be fraudulent.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">4. Permitted Use</h2>
            <p>AfriFlix is a platform for African creative content. You may use it to:</p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>Discover, watch, and engage with African film, music, dance, poetry, writing, comedy, theatre, and visual art</li>
              <li>Upload and publish your own original creative works (as a creator)</li>
              <li>Interact with other users through comments, hearts, and follows</li>
              <li>Send tips to creators whose work you appreciate</li>
              <li>Collaborate with other creators via the Collab Board</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">5. Prohibited Conduct</h2>
            <p className="mb-3">You may not:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Upload content you do not own or have rights to distribute</li>
              <li>Harass, threaten, or abuse other users or creators</li>
              <li>Upload or share illegal content, including child sexual abuse material (CSAM), which will result in immediate termination and reporting to authorities</li>
              <li>Circumvent age-rating restrictions or content access controls</li>
              <li>Scrape, crawl, or systematically extract data from the Platform without written permission</li>
              <li>Attempt to reverse engineer, decompile, or hack the Platform</li>
              <li>Use the Platform to send spam, phishing messages, or unsolicited communications</li>
              <li>Create accounts to evade bans or restrictions</li>
              <li>Manipulate engagement metrics (view count fraud, coordinated inauthentic behaviour)</li>
              <li>Infringe intellectual property rights of any third party</li>
              <li>Use the Platform in any way that violates applicable law in your jurisdiction</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">6. Content Ownership &amp; Licence</h2>
            <div className="space-y-4">
              <div>
                <p className="text-ivory font-medium">You own your content</p>
                <p>You retain full ownership of all original content you upload to AfriFlix. We do not claim ownership of your creative works.</p>
              </div>
              <div>
                <p className="text-ivory font-medium">Licence to AfriFlix</p>
                <p>By uploading content, you grant AfriFlix a worldwide, non-exclusive, royalty-free licence to host, store, display, stream, transcode, and distribute your content on the Platform and in promotional materials for AfriFlix. This licence ends when you delete your content or close your account, except where content has been shared or embedded by other users.</p>
              </div>
              <div>
                <p className="text-ivory font-medium">Licence to other users</p>
                <p>Public content you post may be viewed, shared within the Platform, and embedded by other users in accordance with the sharing options you have set.</p>
              </div>
              <div>
                <p className="text-ivory font-medium">Your responsibilities</p>
                <p>You warrant that you have all necessary rights, licences, and permissions to upload your content and to grant the licences above. You are solely responsible for your content and any claims arising from it.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">7. Payments &amp; Tips</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Tips are voluntary payments from fans to creators and are non-refundable once processed</li>
              <li>AfriFlix charges a platform fee on tips and subscriptions as detailed in the Creator Agreement</li>
              <li>Payment processing is handled by third-party processors (PayFast, Flutterwave, Stripe) subject to their terms</li>
              <li>Subscription payments are recurring until cancelled; cancellation stops future billing but does not refund current period</li>
              <li>All prices are displayed in the applicable currency at checkout; you are responsible for any taxes due in your jurisdiction</li>
              <li>We reserve the right to adjust pricing with 30 days&rsquo; notice to existing subscribers</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">8. Intellectual Property</h2>
            <p>
              The AfriFlix name, logo, user interface design, platform code, and all AfriFlix-owned content are the intellectual property of {COMPANY} and may not be copied, reproduced, or used without written permission.
            </p>
            <p className="mt-2">
              If you believe your copyright has been infringed, please submit a DMCA takedown notice as described in our Content Policy.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">9. AI Features</h2>
            <p>
              AfriFlix uses artificial intelligence to generate content summaries, mood tags, recommendations, and creative profiles. AI outputs are provided for discovery and inspiration purposes only. We make no warranties about the accuracy of AI-generated content. You should not rely on AI outputs for professional, legal, medical, or financial decisions.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">10. Disclaimers &amp; Limitation of Liability</h2>
            <p>
              THE PLATFORM IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND. TO THE FULLEST EXTENT PERMITTED BY LAW, AFRIFLIX DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="mt-3">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, AFRIFLIX&rsquo;S TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM THESE TERMS OR YOUR USE OF THE PLATFORM SHALL NOT EXCEED THE GREATER OF (A) ZAR 500 OR (B) THE AMOUNT YOU PAID TO AFRIFLIX IN THE 12 MONTHS PRECEDING THE CLAIM.
            </p>
            <p className="mt-3">
              <strong className="text-ivory">Consumer law note:</strong> Some jurisdictions do not allow limitation of liability for certain consumer claims. In those jurisdictions, our liability is limited to the minimum extent permitted by law.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">11. Indemnity</h2>
            <p>
              You agree to indemnify and hold harmless {COMPANY}, its officers, directors, employees, and agents from any claims, damages, losses, and expenses (including legal fees) arising from: (a) your use of the Platform, (b) your content, (c) your violation of these Terms, or (d) your violation of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">12. Termination</h2>
            <p>
              We may suspend or terminate your account at any time for violation of these Terms, with or without notice. You may close your account at any time via your account settings or by contacting us. Upon termination, your right to use the Platform ceases immediately. Provisions that by their nature should survive termination will do so, including Sections 6, 8, 10, 11, and 13.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">13. Governing Law &amp; Dispute Resolution</h2>
            <p>
              These Terms are governed by the laws of the Republic of South Africa. Disputes will first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to the courts of the Eastern Cape High Court, South Africa, which you irrevocably accept as having non-exclusive jurisdiction.
            </p>
            <p className="mt-3">
              <strong className="text-ivory">EU/UK residents:</strong> Nothing in these Terms affects your statutory rights under EU/UK consumer protection law, including the right to bring claims in your local courts.
            </p>
            <p className="mt-2">
              <strong className="text-ivory">US residents:</strong> You may pursue claims in small claims court in your county or municipality for disputes within that court&rsquo;s jurisdictional limits.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">14. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms. Material changes will be notified at least 30 days in advance via email or in-app notification. Continued use after the effective date constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">15. Contact</h2>
            <p>
              <strong className="text-ivory">{COMPANY}</strong><br />
              <a href={`mailto:${EMAIL}`} className="text-gold hover:underline">{EMAIL}</a><br />
              East London, Eastern Cape, South Africa
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
