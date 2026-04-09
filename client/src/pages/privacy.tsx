import { DetailFlowLogo } from "@/components/DetailFlowLogo";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <a
            href="#/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-privacy-back"
          >
            <ArrowLeft size={16} />
          </a>
          <div className="flex items-center gap-2">
            <DetailFlowLogo className="w-6 h-6" />
            <span className="font-display font-bold text-sm">DetailFlow</span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight" data-testid="text-privacy-title">
          Privacy Policy
        </h1>
        <p className="text-xs text-muted-foreground mt-2 mb-10">Last updated: April 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. Introduction</h2>
            <p>
              DetailFlow ("we," "our," or "us") operates the DetailFlow platform, a business management tool for
              professional auto detailers and detail shops. This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. Information We Collect</h2>
            <p className="mb-2">We collect the following types of information:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-foreground">Account Information:</strong> Name, email address, phone number, and business name when you create an account.</li>
              <li><strong className="text-foreground">Business Data:</strong> Service menus, pricing, scheduling preferences, and operational settings you configure.</li>
              <li><strong className="text-foreground">Client Data:</strong> Names, phone numbers, email addresses, vehicle information, and appointment history for your clients.</li>
              <li><strong className="text-foreground">Vehicle Information:</strong> Make, model, year, and size category of vehicles associated with appointments.</li>
              <li><strong className="text-foreground">Communication Data:</strong> SMS messages and email content sent through our platform.</li>
              <li><strong className="text-foreground">Usage Data:</strong> Log data, device information, and analytics about how you interact with our service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Provide, operate, and maintain the DetailFlow platform</li>
              <li>Process appointments, quotes, and client management functions</li>
              <li>Send automated SMS and email communications on your behalf</li>
              <li>Provide AI-powered features including auto-replies and scheduling suggestions</li>
              <li>Improve, personalize, and expand our service</li>
              <li>Communicate with you about updates, support, and marketing (with your consent)</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Third-Party Services</h2>
            <p className="mb-2">We use trusted third-party services to operate our platform:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-foreground">Twilio:</strong> For SMS messaging and phone number management</li>
              <li><strong className="text-foreground">SendGrid:</strong> For transactional and marketing emails</li>
              <li><strong className="text-foreground">Stripe:</strong> For subscription billing and payment processing</li>
            </ul>
            <p className="mt-2">
              These services have their own privacy policies governing how they handle your data. We only share the
              minimum data necessary for each service to function.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. Data Storage & Security</h2>
            <p>
              Your data is stored securely using industry-standard encryption both in transit (TLS 1.2+) and at rest.
              We implement appropriate technical and organizational measures to protect your personal information against
              unauthorized access, alteration, disclosure, or destruction. Access to personal data is restricted to
              authorized personnel only.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-foreground">Access:</strong> Request a copy of all personal data we hold about you</li>
              <li><strong className="text-foreground">Correction:</strong> Request correction of inaccurate personal data</li>
              <li><strong className="text-foreground">Deletion:</strong> Request deletion of your personal data and account</li>
              <li><strong className="text-foreground">Export:</strong> Receive your data in a portable, machine-readable format</li>
              <li><strong className="text-foreground">Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:support@detailflowapp.com" className="text-primary hover:underline">
                support@detailflowapp.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active or as needed to provide you services.
              When you delete your account, we will delete or anonymize your personal data within 30 days, except where
              we are required to retain data for legal or regulatory purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">8. Children's Privacy</h2>
            <p>
              DetailFlow is not directed to individuals under the age of 18. We do not knowingly collect personal
              information from children. If we become aware that a child has provided us with personal data, we will
              take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by
              posting the new policy on this page and updating the "Last updated" date. Your continued use of the
              service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">10. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, contact us at:{" "}
              <a href="mailto:support@detailflowapp.com" className="text-primary hover:underline">
                support@detailflowapp.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <DetailFlowLogo className="w-5 h-5" />
            <span className="font-display font-semibold text-foreground">DetailFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <span>&copy; 2026 detailflowapp.com</span>
            <span className="text-foreground font-medium">Privacy</span>
            <a href="#/terms" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
