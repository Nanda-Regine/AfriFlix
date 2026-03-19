import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Content Policy — AfriFlix',
  description: 'AfriFlix community standards, content guidelines, and DMCA takedown process.',
  robots: { index: true, follow: false },
}

const EFFECTIVE_DATE = 'March 2026'
const DMCA_EMAIL = 'dmca@afriflix.co.za'
const TRUST_EMAIL = 'trust@afriflix.co.za'

export default function ContentPolicyPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-mono text-gold uppercase tracking-wider mb-2">Legal</p>
        <h1 className="font-syne font-bold text-4xl text-ivory mb-2">Content Policy</h1>
        <p className="text-ivory-dim text-sm mb-10">
          Effective: {EFFECTIVE_DATE} &middot; Community standards for all content on AfriFlix
        </p>

        <div className="bg-gold/5 border border-gold/20 rounded-xl p-5 mb-10">
          <p className="text-ivory font-medium mb-1">Our Commitment</p>
          <p className="text-ivory-dim text-sm leading-relaxed">
            AfriFlix celebrates African creativity in all its forms. We are committed to maintaining a platform that is safe,
            inclusive, and respectful — one where every African creator can share their voice freely while protecting the
            dignity of all people.
          </p>
        </div>

        <div className="space-y-10 text-ivory-dim leading-relaxed">

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">1. What Is Allowed</h2>
            <p className="mb-3">AfriFlix welcomes a wide range of African creative expression, including:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Films, web series, short films, and documentaries</li>
              <li>Music, afrobeats, amapiano, highlife, traditional music, and all African genres</li>
              <li>Dance, choreography, and cultural dance forms</li>
              <li>Spoken word, slam poetry, and written poetry</li>
              <li>Stand-up comedy, sketches, and satirical content</li>
              <li>Theatre, stage performances, and spoken arts</li>
              <li>Visual art, digital art, photography, and creative process videos</li>
              <li>Mature content (16+, 18+) where properly age-rated and not otherwise prohibited</li>
              <li>Challenging or provocative art that explores difficult themes with artistic intent and appropriate labelling</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">2. Absolute Prohibitions</h2>
            <p className="mb-3">
              The following content is <strong className="text-ivory">never permitted</strong> regardless of artistic intent, and will result in immediate removal, permanent account ban, and reporting to law enforcement where required:
            </p>
            <div className="space-y-4">
              <div className="border-l-2 border-red-500/50 pl-4">
                <p className="text-ivory font-medium">Child Sexual Abuse Material (CSAM)</p>
                <p className="text-sm">Any sexual content involving minors. We report all CSAM to the South African Film and Publication Board, NCMEC (US), and local authorities globally. Zero tolerance.</p>
              </div>
              <div className="border-l-2 border-red-500/50 pl-4">
                <p className="text-ivory font-medium">Terrorism &amp; Violent Extremism</p>
                <p className="text-sm">Content that promotes, glorifies, or facilitates acts of terrorism, genocide, or mass violence. Factual reporting and artistic commentary on these events is permitted.</p>
              </div>
              <div className="border-l-2 border-red-500/50 pl-4">
                <p className="text-ivory font-medium">Non-Consensual Intimate Imagery</p>
                <p className="text-sm">Sharing sexual images or videos of individuals without their consent, including deepfakes or AI-generated intimate imagery.</p>
              </div>
              <div className="border-l-2 border-red-500/50 pl-4">
                <p className="text-ivory font-medium">Doxxing &amp; Real-World Harm</p>
                <p className="text-sm">Publishing private personal information (home addresses, ID numbers, financial details) with intent to harass or cause harm.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">3. Hate Speech &amp; Discrimination</h2>
            <p className="mb-3">
              AfriFlix prohibits content that promotes hatred against people based on race, ethnicity, national origin, religion, gender, gender identity, sexual orientation, disability, or other protected characteristics.
            </p>
            <p className="mb-3">
              We recognise the distinction between artistic work that <em>explores</em> these themes critically (permitted, with appropriate labelling) versus content that <em>promotes</em> hatred (prohibited).
            </p>
            <p>
              African satire, social commentary, and cultural critique — including commentary that challenges colonial legacies, expresses cultural pride, or critiques systems of oppression — is protected expression on this platform.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">4. Violence &amp; Graphic Content</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Gratuitous, real-world graphic violence with no artistic or documentary context is prohibited</li>
              <li>Fictional violence in films, theatre, and art is permitted when age-rated appropriately</li>
              <li>Documentary or journalistic content depicting violence for educational purposes is permitted</li>
              <li>Content that promotes, glorifies, or provides instructions for real-world violence is prohibited</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">5. Mature &amp; Adult Content</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Sexually suggestive content must be rated 16+ and will not appear in default discovery feeds</li>
              <li>Explicit sexual content (18+) must comply with all applicable laws and must only feature adults</li>
              <li>All performers in sexual content must have consented; we require documentation upon request</li>
              <li>Content must be accurately age-rated; mislabelling is a violation of this policy</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">6. Intellectual Property</h2>
            <p className="mb-3">You must have the rights to everything you upload. This includes:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Music — you must own or license all tracks used in videos, including background music</li>
              <li>Film clips — you must have rights to any third-party footage</li>
              <li>Visual art — you must not upload others&rsquo; artwork without permission</li>
              <li>Written works — plagiarism is a violation of this policy and our Terms</li>
            </ul>
            <p className="mt-3">
              Repeated intellectual property violations will result in permanent account termination.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">7. Spam &amp; Inauthentic Behaviour</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Purchasing fake views, hearts, followers, or comments is prohibited</li>
              <li>Coordinated inauthentic behaviour to manipulate trending or recommendation algorithms is prohibited</li>
              <li>Spam comments, mass identical comments, or comment flooding is prohibited</li>
              <li>Misleading titles, thumbnails, or descriptions that do not represent the actual content are prohibited</li>
            </ul>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">8. Misinformation</h2>
            <p>
              Content that presents demonstrably false information as factual in ways that could cause real-world harm — particularly regarding public health, elections, or identity fraud — is prohibited. Satire and clearly labelled fiction are permitted.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">9. Content Labels &amp; Age Ratings</h2>
            <p className="mb-3">Creators must accurately label their content:</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { rating: 'G', desc: 'All audiences' },
                { rating: 'PG', desc: 'Parental guidance' },
                { rating: '13+', desc: 'Teens and up' },
                { rating: '16+', desc: 'Mature themes' },
                { rating: '18+', desc: 'Adult only' },
              ].map(r => (
                <div key={r.rating} className="bg-black-card border border-white/5 rounded-lg p-3 text-center">
                  <p className="font-syne font-bold text-gold">{r.rating}</p>
                  <p className="text-xs text-ivory-dim mt-1">{r.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm">
              Trigger warnings must be added for content depicting suicide, self-harm, sexual violence, or severe trauma.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">10. Reporting Content</h2>
            <p>
              Every piece of content on AfriFlix has a &ldquo;Report&rdquo; button. Use it to flag content that violates this policy. Our Trust &amp; Safety team reviews all reports typically within 48–72 hours.
            </p>
            <p className="mt-2">
              For urgent matters (CSAM, immediate threats of violence), contact us directly:{' '}
              <a href={`mailto:${TRUST_EMAIL}`} className="text-gold hover:underline">{TRUST_EMAIL}</a>
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">11. Enforcement Actions</h2>
            <p className="mb-3">Depending on severity, we may take the following actions:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-ivory">Warning</strong> — first-time minor violations with a notice to correct</li>
              <li><strong className="text-ivory">Content removal</strong> — specific content removed; account remains active</li>
              <li><strong className="text-ivory">Feature restriction</strong> — temporary restriction on uploads or comments</li>
              <li><strong className="text-ivory">Temporary suspension</strong> — account suspended for a defined period</li>
              <li><strong className="text-ivory">Permanent ban</strong> — account permanently removed for severe or repeated violations</li>
              <li><strong className="text-ivory">Law enforcement referral</strong> — for CSAM and violent extremism, always</li>
            </ul>
            <p className="mt-3">
              You may appeal enforcement decisions within 14 days by contacting {TRUST_EMAIL}. We will review all appeals within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">12. DMCA Copyright Takedown Process</h2>
            <p className="mb-3">
              If you believe your copyrighted work has been posted on AfriFlix without authorisation, submit a DMCA Notice to:
            </p>
            <p className="mb-3">
              <strong className="text-ivory">DMCA Agent:</strong>{' '}
              <a href={`mailto:${DMCA_EMAIL}`} className="text-gold hover:underline">{DMCA_EMAIL}</a>
            </p>
            <p className="mb-2 text-ivory font-medium">Your notice must include:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>A physical or electronic signature of the copyright owner or authorised agent</li>
              <li>Identification of the copyrighted work claimed to be infringed</li>
              <li>The URL of the infringing content on AfriFlix</li>
              <li>Your contact information (address, phone, email)</li>
              <li>A good-faith statement that the use is not authorised</li>
              <li>A statement, under penalty of perjury, that the information is accurate and you are authorised to act</li>
            </ol>
            <p className="mt-3">
              We will process valid notices within 5 business days and notify the uploader. The uploader may file a counter-notice if they believe the takedown was in error.
            </p>
            <p className="mt-3 text-sm">
              <strong className="text-ivory">Abuse of DMCA:</strong> Submitting false DMCA notices is a legal violation. Repeat abusers of the DMCA process will be banned from the Platform.
            </p>
          </section>

          <section>
            <h2 className="font-syne font-semibold text-xl text-ivory mb-3">13. Changes to This Policy</h2>
            <p>
              We will update this policy as the platform evolves. Material changes will be communicated via in-app notifications and email. The current effective date is always shown at the top of this page.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
