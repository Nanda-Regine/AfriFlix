import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Creator Agreement — AfriFlix',
  description: 'The legal agreement governing creators who publish, monetise, and earn on AfriFlix.',
  robots: { index: true, follow: false },
}

const EFFECTIVE_DATE = 'March 2026'
const COMPANY = 'Mirembe Muse (Pty) Ltd'
const EMAIL = 'creators@afriflix.co.za'

export default function CreatorAgreementPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-mono text-gold uppercase tracking-wider mb-2">Legal</p>
        <h1 className="font-syne font-bold text-4xl text-ivory mb-2">Creator Agreement</h1>
        <p className="text-ivory-dim text-sm mb-10">
          Effective: {EFFECTIVE_DATE} &middot; Applies to all creators who publish content on AfriFlix
        </p>

        <div className="bg-gold/5 border border-gold/20 rounded-xl p-5 mb-10">
          <p className="text-ivory font-medium mb-1">Built for African Creators</p>
          <p className="text-ivory-dim text-sm leading-relaxed">
            This agreement governs your rights and responsibilities as an AfriFlix creator. We designed it to be fair,
            transparent, and creator-first. You keep ownership of your work. You earn from every transaction.
            You choose your audience. Questions? Email{' '}
            <a href={`mailto:${EMAIL}`} className="text-gold hover:underline">{EMAIL}</a>
          </p>
        </div>

        <div className="space-y-10 text-ivory-dim leading-relaxed">

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">1. Who This Agreement Applies To</h2>
            <p>
              This Creator Agreement applies to all users who create a creator profile on AfriFlix and upload or publish content for others to discover and engage with. By creating a creator profile, you agree to this Agreement in addition to the general{' '}
              <Link href="/legal/terms" className="text-gold hover:underline">Terms of Service</Link>.
            </p>
            <p className="mt-2">
              This Agreement is between you and <strong className="text-ivory">{COMPANY}</strong>, trading as AfriFlix.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">2. Your Content &amp; Intellectual Property</h2>
            <div className="space-y-4">
              <div>
                <p className="text-ivory font-medium">You own your work</p>
                <p>
                  All creative works you upload — films, music, poetry, visual art, dance, writing, comedy, theatre — remain your intellectual property. AfriFlix never claims ownership of your content.
                </p>
              </div>
              <div>
                <p className="text-ivory font-medium">Licence to host and distribute</p>
                <p>
                  By publishing content on AfriFlix, you grant us a worldwide, non-exclusive, royalty-free licence to:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Host, store, and transcode your content for delivery</li>
                  <li>Stream your content to users on the Platform</li>
                  <li>Generate thumbnails and previews</li>
                  <li>Feature your work in editorial selections and promotional materials for AfriFlix</li>
                  <li>Use your name, username, and likeness solely to identify you as the creator</li>
                </ul>
                <p className="mt-2">
                  This licence is limited to operating and promoting the AfriFlix platform. We will not sublicence your work to third parties for commercial use without your written consent.
                </p>
              </div>
              <div>
                <p className="text-ivory font-medium">Your warranties</p>
                <p>
                  You warrant that: (a) you own or have the right to grant the above licences, (b) your content does not infringe any third-party copyright, trademark, or other intellectual property right, and (c) you have obtained consent from all identifiable individuals featured in your content.
                </p>
              </div>
              <div>
                <p className="text-ivory font-medium">Removing your content</p>
                <p>
                  You may remove or unpublish any of your content at any time through your dashboard. Deletion does not affect copies already saved or shared by other users within the Platform before deletion.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">3. Monetisation &amp; Revenue</h2>

            <div className="space-y-6">
              <div>
                <p className="text-ivory font-medium text-lg mb-2">Tips</p>
                <div className="bg-black-card border border-white/5 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-ivory-mid">You receive</span>
                    <span className="text-gold font-bold text-xl">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-ivory-mid">Platform fee</span>
                    <span className="text-ivory">15%</span>
                  </div>
                </div>
                <p className="mt-2 text-sm">
                  Tips are one-time voluntary payments from fans. The platform fee covers payment processing, infrastructure, and fraud prevention. Payment processor fees (approx. 2–3.5%) are deducted from the gross amount before the split.
                </p>
              </div>

              <div>
                <p className="text-ivory font-medium text-lg mb-2">Creator Pro Subscription Revenue Share</p>
                <div className="bg-black-card border border-white/5 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-ivory-mid">You receive</span>
                    <span className="text-gold font-bold text-xl">70%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-ivory-mid">Platform fee</span>
                    <span className="text-ivory">30%</span>
                  </div>
                </div>
                <p className="mt-2 text-sm">
                  Where subscriber revenue is distributed to creators, each creator&apos;s share is proportional to their content&apos;s share of total watch time during the subscription period.
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm bg-black-card border border-white/5 rounded-lg p-3">
              <strong className="text-ivory">Founding Creator Benefit:</strong> Creators who join the founding programme (first 1,000 creators) receive a reduced platform fee of <strong className="text-gold">10% on tips</strong> for their first 24 months.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">4. Payouts</h2>
            <div className="space-y-4">
              <div>
                <p className="text-ivory font-medium">Payout schedule</p>
                <p>Payouts are processed on the <strong className="text-ivory">1st of each month</strong> for earnings from the prior month. The minimum payout threshold is <strong className="text-ivory">ZAR 100 / USD 5 / equivalent</strong>. Earnings below the threshold roll over to the following month.</p>
              </div>
              <div>
                <p className="text-ivory font-medium">Payout methods</p>
                <p>We support the following payout methods:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong className="text-ivory">South Africa:</strong> Bank transfer (FNB, Standard Bank, Absa, Nedbank, Capitec, TymeBank) via Flutterwave</li>
                  <li><strong className="text-ivory">Pan-Africa:</strong> Mobile money (M-Pesa, MTN MoMo, Airtel Money, Orange Money, Vodacom M-Pesa) via Flutterwave</li>
                  <li><strong className="text-ivory">Global diaspora:</strong> Bank transfer in supported countries via Flutterwave</li>
                </ul>
              </div>
              <div>
                <p className="text-ivory font-medium">Requirements</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>You must add a verified payout account in your dashboard before payouts can be processed</li>
                  <li>We may require identity verification (KYC) before processing payouts above certain thresholds, in compliance with financial regulations</li>
                  <li>You are responsible for reporting and paying any income tax due in your jurisdiction</li>
                  <li>We will issue annual earnings statements to creators with cumulative earnings above applicable reporting thresholds</li>
                </ul>
              </div>
              <div>
                <p className="text-ivory font-medium">Failed payouts</p>
                <p>If a payout fails due to incorrect banking details, funds are held for up to 90 days while you update your details. After 90 days, funds may be subject to forfeiture under applicable unclaimed funds laws.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">5. Creator Plans</h2>
            <div className="space-y-3">
              {[
                {
                  plan: 'Free',
                  desc: 'Upload up to 10 works, access basic analytics, enable tip jar.',
                },
                {
                  plan: 'Creator Pro',
                  desc: 'Unlimited uploads, advanced analytics, priority in discovery, early access to new features, reduced platform fee. Billed monthly or annually.',
                },
                {
                  plan: 'Label',
                  desc: 'Multi-creator management, bulk upload, white-label embedding, dedicated support. Contact us for pricing.',
                },
                {
                  plan: 'Brand',
                  desc: 'Brand partnerships, sponsored discovery, promotional content tools. Contact us for pricing.',
                },
              ].map(p => (
                <div key={p.plan} className="flex gap-4 bg-black-card border border-white/5 rounded-xl p-4">
                  <p className="font-syne font-bold text-gold w-20 shrink-0">{p.plan}</p>
                  <p className="text-sm">{p.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm">
              Plan pricing is listed on the platform and may change with 30 days&rsquo; notice. Existing subscribers are grandfathered at their current rate until their subscription renews or they change plans.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">6. Content Standards</h2>
            <p>
              All content you publish must comply with our{' '}
              <Link href="/legal/content-policy" className="text-gold hover:underline">Content Policy</Link>.
              You are solely responsible for ensuring your content is legal in the jurisdictions you target.
            </p>
            <p className="mt-2">
              By publishing content on AfriFlix, you confirm that:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>You have the right to publish and monetise this content</li>
              <li>The content does not violate any law in South Africa or your country of residence</li>
              <li>You have obtained all necessary clearances (music rights, location permits, talent releases)</li>
              <li>The content is accurately age-rated and labelled</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">7. African Creator Verification</h2>
            <p>
              Creators who complete African identity verification receive the <strong className="text-ivory">African Verified</strong> badge, which increases discoverability and unlocks additional features. Verification methods include:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Government-issued ID from any of 54 African nations</li>
              <li>Verified African social media profile or professional website</li>
              <li>Vouching by an existing verified creator</li>
            </ul>
            <p className="mt-2 text-sm">
              Diaspora creators (African heritage, living outside Africa) are eligible for verification with documentation of African origin. Verification does not guarantee any particular level of promotional support.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">8. AI &amp; Creative DNA</h2>
            <p>
              AfriFlix uses AI to generate a &ldquo;Creative DNA&rdquo; profile from your published works — a description of your creative style, themes, and cultural influences. This profile is displayed on your creator page to help fans discover you.
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>You may regenerate or request deletion of your Creative DNA at any time</li>
              <li>We do not use your content to train AI models for third-party use</li>
              <li>AI-generated work summaries and tags are used to improve discoverability; you can edit them</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">9. Prohibited Monetisation</h2>
            <p>The following are prohibited and may result in withheld earnings and account termination:</p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>Artificially inflating tips, views, or engagement through bots or coordinated fraud</li>
              <li>Creating content specifically designed to mislead fans into tipping</li>
              <li>Using the platform to launder money or conduct financial fraud</li>
              <li>Monetising content you do not own the rights to</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">10. Account Suspension &amp; Earnings</h2>
            <p>
              If your account is suspended for a Terms or Content Policy violation, payouts will be paused during investigation. If the violation is confirmed:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Earnings from legitimate, compliant content will be paid out after investigation</li>
              <li>Earnings from content that violated our policies may be forfeited</li>
              <li>Fraudulent earnings will be reversed and may be subject to clawback</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">11. Changes to This Agreement</h2>
            <p>
              We may update this agreement with 30 days&rsquo; notice via email and in-platform notification. If you do not agree with material changes, you may close your creator account before the effective date. Continued use of creator features after the effective date constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">12. Contact</h2>
            <p>For all creator-related queries:</p>
            <p className="mt-2">
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
