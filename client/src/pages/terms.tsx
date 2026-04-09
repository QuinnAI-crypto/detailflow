import { DetailFlowLogo } from "@/components/DetailFlowLogo";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <a
            href="#/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-terms-back"
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
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight" data-testid="text-terms-title">
          Terms of Service
        </h1>
        <p className="text-xs text-muted-foreground mt-2 mb-10">Last updated: April 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. Service Description</h2>
            <p>
              DetailFlow provides a cloud-based business management platform designed for professional auto detailers
              and detail shops. Our service includes appointment scheduling, quote generation, client relationship
              management (CRM), automated messaging, and AI-powered business tools. By creating an account and using
              DetailFlow, you agree to these Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. Eligibility</h2>
            <p>
              You must be at least 18 years old and have the legal authority to enter into these terms. If you are
              using DetailFlow on behalf of a business, you represent that you have the authority to bind that business
              to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. Account Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>You must provide accurate and complete information when creating your account.</li>
              <li>You must promptly notify us of any unauthorized access to your account.</li>
              <li>You are responsible for the data you enter, including client information, and must have appropriate consent to store and use such data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Acceptable Use</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Use DetailFlow for any unlawful purpose or in violation of any applicable laws</li>
              <li>Send unsolicited or spam messages through our messaging features</li>
              <li>Attempt to interfere with, compromise, or disrupt the service</li>
              <li>Reverse engineer, decompile, or disassemble any part of the service</li>
              <li>Use automated tools to access the service without our written permission</li>
              <li>Resell or redistribute access to DetailFlow without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. Payment Terms</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>DetailFlow offers both free and paid subscription plans.</li>
              <li>Paid subscriptions are billed monthly or annually, as selected at the time of purchase.</li>
              <li>Subscription fees are non-refundable except as required by law or as outlined in our refund policy.</li>
              <li>We may change pricing with 30 days' advance notice. Existing subscriptions will honor current pricing until the end of the billing period.</li>
              <li>You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period.</li>
              <li>If payment fails, we may suspend access to paid features after a reasonable grace period.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Intellectual Property</h2>
            <p>
              DetailFlow and its original content, features, and functionality are owned by DetailFlow and are
              protected by copyright, trademark, and other intellectual property laws. You retain ownership of all
              data you input into the platform, including client information, business data, and customizations.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7. AI Features</h2>
            <p>
              DetailFlow includes AI-powered features such as auto-replies, scheduling suggestions, and quote
              assistance. While we strive for accuracy, AI-generated content may not always be perfect. You are
              responsible for reviewing and approving AI-generated communications before they are sent to your clients,
              or for configuring appropriate automation rules.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, DetailFlow and its officers, directors, employees, and agents
              shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including
              loss of profits, data, or business opportunities, arising out of or in connection with your use of the
              service. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">9. Disclaimer of Warranties</h2>
            <p>
              DetailFlow is provided on an "as is" and "as available" basis without warranties of any kind, either
              express or implied, including but not limited to implied warranties of merchantability, fitness for a
              particular purpose, and non-infringement. We do not warrant that the service will be uninterrupted,
              secure, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">10. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice, if you breach these Terms.
              Upon termination, your right to use the service will cease immediately. You may request export of your
              data within 30 days of termination. After that period, we may delete your data permanently.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware,
              without regard to its conflict of law provisions. Any disputes arising from these terms shall be resolved
              through binding arbitration in accordance with the rules of the American Arbitration Association.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">12. Changes to These Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will provide notice of material changes by
              posting the updated terms and changing the "Last updated" date. Your continued use of DetailFlow after
              changes are posted constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">13. Contact Us</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:{" "}
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
            <a href="#/privacy" className="hover:text-foreground transition-colors">Privacy</a>
            <span className="text-foreground font-medium">Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
