import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — AfriFlix',
  description: 'How AfriFlix collects, uses, and protects your personal information. Compliant with GDPR, POPIA, CCPA, LGPD, and global privacy frameworks.',
  robots: { index: true, follow: false },
}

const EFFECTIVE_DATE = 'March 2026'
const CONTROLLER = 'Mirembe Muse (Pty) Ltd'
const EMAIL = 'privacy@afriflix.co.za'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-mono text-gold uppercase tracking-wider mb-2">Legal</p>
        <h1 className="font-syne font-bold text-4xl text-ivory mb-2">Privacy Policy</h1>
        <p className="text-ivory-dim text-sm mb-10">
          Effective: {EFFECTIVE_DATE} &middot; Applies globally &middot; Compliant with POPIA, GDPR, CCPA, LGPD, PIPL
        </p>

        <div className="space-y-10 text-ivory-dim leading-relaxed">

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">1. Who We Are</h2>
            <p>
              <strong className="text-ivory">{CONTROLLER}</strong> (&ldquo;AfriFlix&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates afriflix.co.za and related services. We are
              the data controller / responsible party for all personal information we process.
            </p>
            <p className="mt-2">
              <strong className="text-ivory">Privacy contact:</strong>{' '}
              <a href={`mailto:${EMAIL}`} className="text-gold hover:underline">{EMAIL}</a>
              &nbsp;&middot; East London, Eastern Cape, South Africa
            </p>
            <p className="mt-2">
              <strong className="text-ivory">EU / UK Representative:</strong> For EU/UK residents, our GDPR representative can be contacted at {EMAIL} with subject line &ldquo;GDPR Representative Request&rdquo;.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <p className="text-ivory font-medium mb-1">Account &amp; Profile Data</p>
                <p>Email address, display name, username, country of residence, profile photo, bio, and creative categories you select during onboarding.</p>
              </div>
              <div>
                <p className="text-ivory font-medium mb-1">Content &amp; Creative Data</p>
                <p>Files you upload (video, audio, images, written works), metadata you provide (titles, descriptions, tags, genre, language), and AI-generated summaries created from your content.</p>
              </div>
              <div>
                <p className="text-ivory font-medium mb-1">Usage &amp; Engagement Data</p>
                <p>Content you watch, hearts, comments, saves, collection activity, Canvas swipe signals, watch progress, search queries, and taste profile preferences.</p>
              </div>
              <div>
                <p className="text-ivory font-medium mb-1">Payment &amp; Financial Data</p>
                <p>When you tip creators or subscribe, payment processors (PayFast, Flutterwave, Stripe) collect your card or banking details directly — we do not store raw card numbers. We retain transaction records (amount, reference, currency, status) for accounting and payout processing.</p>
              </div>
              <div>
                <p className="text-ivory font-medium mb-1">Technical &amp; Device Data</p>
                <p>IP address, browser type, operating system, device identifiers, referring URLs, and Cloudflare connection metadata. This data is used for security, rate limiting, and fraud prevention.</p>
              </div>
              <div>
                <p className="text-ivory font-medium mb-1">Communications</p>
                <p>Messages you send us via email or support forms, and notification preferences.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">3. Legal Bases for Processing</h2>
            <p className="mb-3">We process your data only where we have a valid legal basis:</p>
            <div className="space-y-3">
              <div>
                <p className="text-ivory font-medium">Contract Performance</p>
                <p>Processing necessary to provide the service you have signed up for — account creation, content delivery, payments, and notifications.</p>
              </div>
              <div>
                <p className="text-ivory font-medium">Legitimate Interests</p>
                <p>Security monitoring, fraud prevention, platform analytics, improving AI recommendations, and sending transactional notifications. We balance these interests against your rights and will not override them.</p>
              </div>
              <div>
                <p className="text-ivory font-medium">Legal Obligation</p>
                <p>Compliance with South African POPIA, tax laws, DMCA/copyright obligations, and court orders.</p>
              </div>
              <div>
                <p className="text-ivory font-medium">Consent</p>
                <p>Where we rely on consent (e.g. optional marketing emails), you may withdraw it at any time without affecting prior processing.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">4. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Provide, operate, and improve the AfriFlix platform</li>
              <li>Personalise content recommendations via your taste profile and Canvas impressions</li>
              <li>Process creator payouts via Flutterwave and PayFast</li>
              <li>Send transactional notifications (new followers, tips received, payout status)</li>
              <li>Detect and prevent fraud, abuse, and security threats</li>
              <li>Enforce our Terms of Service and Content Policy</li>
              <li>Comply with legal obligations and respond to lawful requests</li>
              <li>Generate aggregated, anonymised analytics (no individual re-identification)</li>
            </ul>
            <p className="mt-3">We do <strong className="text-ivory">not</strong> sell your personal information to third parties for their own marketing.</p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">5. AI Processing</h2>
            <p>
              AfriFlix uses Claude (Anthropic) and other AI services to generate content summaries, mood tags, creative DNA profiles, and content recommendations. When your content or messages are processed by AI:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>Content sent to AI APIs is processed under data processing agreements with those providers</li>
              <li>We do not use your personal content to train third-party AI models</li>
              <li>AI-generated outputs about you (Creative DNA) are stored on our servers and visible to you in your dashboard</li>
              <li>You may request deletion of AI-generated profiles by contacting us</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">6. Data Sharing &amp; Third Parties</h2>
            <p className="mb-3">We share data only as necessary:</p>
            <div className="space-y-3">
              <div>
                <p className="text-ivory font-medium">Infrastructure Partners</p>
                <p>Supabase (database, authentication &mdash; EU/US servers), Cloudflare (CDN, stream, DDoS protection &mdash; global), Vercel (hosting &mdash; US/EU). All operate under data processing agreements.</p>
              </div>
              <div>
                <p className="text-ivory font-medium">Payment Processors</p>
                <p>PayFast (South Africa), Flutterwave (pan-Africa), Stripe (global). Each processor has their own privacy policy and handles payment data directly.</p>
              </div>
              <div>
                <p className="text-ivory font-medium">AI Service Providers</p>
                <p>Anthropic (Claude AI) for content intelligence features. Upstash (Redis caching). These providers act as data processors under our instructions.</p>
              </div>
              <div>
                <p className="text-ivory font-medium">Legal Disclosures</p>
                <p>We may disclose information to law enforcement or regulators when legally required, or to protect the rights, property, or safety of AfriFlix, our users, or the public.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">7. International Data Transfers</h2>
            <p>
              AfriFlix is based in South Africa. Your data may be transferred to and processed in countries outside your country of residence, including the United States and European Union. Where required by law (e.g. GDPR, LGPD), we ensure appropriate safeguards are in place such as Standard Contractual Clauses (SCCs) or adequacy decisions.
            </p>
            <p className="mt-2">
              South African data is processed in compliance with the <strong className="text-ivory">Protection of Personal Information Act (POPIA), Act 4 of 2013</strong>, and overseen by the Information Regulator of South Africa.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">8. Your Rights</h2>
            <p className="mb-3">Depending on your location, you have the following rights:</p>
            <div className="space-y-3">
              <div>
                <p className="text-ivory font-medium">All Users (POPIA &amp; General)</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion (&ldquo;right to be forgotten&rdquo;)</li>
                  <li>Object to direct marketing</li>
                  <li>Lodge a complaint with the Information Regulator (South Africa)</li>
                </ul>
              </div>
              <div>
                <p className="text-ivory font-medium">EU / UK Residents (GDPR / UK GDPR)</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Data portability — receive your data in a machine-readable format</li>
                  <li>Restrict processing in certain circumstances</li>
                  <li>Not be subject to solely automated decisions with legal effects</li>
                  <li>Lodge a complaint with your local Data Protection Authority</li>
                </ul>
              </div>
              <div>
                <p className="text-ivory font-medium">California Residents (CCPA / CPRA)</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Know what personal information we collect and how it is used</li>
                  <li>Delete your personal information</li>
                  <li>Opt out of sale or sharing of personal information (we do not sell data)</li>
                  <li>Non-discrimination for exercising your rights</li>
                  <li>Correct inaccurate personal information</li>
                </ul>
              </div>
              <div>
                <p className="text-ivory font-medium">Brazilian Residents (LGPD)</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Confirmation of processing, access, and correction</li>
                  <li>Anonymisation, blocking, or deletion of unnecessary data</li>
                  <li>Data portability and information about third-party sharing</li>
                  <li>Revocation of consent and opposition to processing</li>
                </ul>
              </div>
            </div>
            <p className="mt-4">
              To exercise any right, email <a href={`mailto:${EMAIL}`} className="text-gold hover:underline">{EMAIL}</a> with &ldquo;Privacy Request&rdquo; in the subject. We will respond within 30 days (or shorter where required by law).
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">9. Data Retention</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-ivory">Account data:</strong> retained while your account is active; deleted within 30 days of account deletion request</li>
              <li><strong className="text-ivory">Content:</strong> retained until you delete it or close your account</li>
              <li><strong className="text-ivory">Transaction records:</strong> retained for 7 years for tax and accounting compliance</li>
              <li><strong className="text-ivory">Watch history &amp; analytics:</strong> retained for 24 months then anonymised</li>
              <li><strong className="text-ivory">Security logs:</strong> retained for 90 days</li>
              <li><strong className="text-ivory">Support communications:</strong> retained for 3 years</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">10. Security</h2>
            <p>
              We implement industry-standard security measures including TLS encryption in transit, at-rest encryption via Supabase, row-level security on all database tables, Content Security Policy headers, rate limiting, and regular security reviews. We use Cloudflare for DDoS protection and edge security.
            </p>
            <p className="mt-2">
              Despite these measures, no system is completely secure. In the event of a data breach affecting your rights and freedoms, we will notify affected users and relevant authorities as required by applicable law (within 72 hours under GDPR).
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">11. Cookies &amp; Tracking</h2>
            <p>
              We use session cookies (via Supabase Auth) that are strictly necessary for authentication. We do not use third-party advertising cookies or cross-site tracking technologies. Analytics are aggregated and anonymised — we do not use Google Analytics or similar tracking services.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">12. Children&apos;s Privacy</h2>
            <p>
              AfriFlix is not directed at children under 13 (or under 16 in the EU). We do not knowingly collect personal information from children. If you believe a child has created an account, contact us at {EMAIL} and we will delete the account promptly.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">13. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be notified via email or a prominent notice on the platform at least 30 days before taking effect. Continued use after the effective date constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">14. Contact &amp; Complaints</h2>
            <p>For any privacy questions or requests:</p>
            <p className="mt-2">
              <strong className="text-ivory">{CONTROLLER}</strong><br />
              <a href={`mailto:${EMAIL}`} className="text-gold hover:underline">{EMAIL}</a><br />
              East London, Eastern Cape, South Africa
            </p>
            <p className="mt-3">
              <strong className="text-ivory">South Africa — Information Regulator:</strong>{' '}
              <span className="text-ivory-mid">inforeg.org.za &middot; complaints@inforeg.org.za</span>
            </p>
            <p className="mt-1">
              <strong className="text-ivory">EU/EEA — your local DPA:</strong>{' '}
              <span className="text-ivory-mid">edpb.europa.eu/about-edpb/board/members</span>
            </p>
            <p className="mt-1">
              <strong className="text-ivory">California — CPPA:</strong>{' '}
              <span className="text-ivory-mid">cppa.ca.gov</span>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
