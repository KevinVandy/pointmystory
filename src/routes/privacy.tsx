import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: January 28, 2025
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-lg font-semibold mt-4 mb-2">
                1. Introduction
              </h2>
              <p className="text-muted-foreground">
                Point My Story (“we,” “our,” or “the Service”) is committed to
                protecting your privacy. This Privacy Policy explains what
                information we collect, how we use it, and your choices
                regarding your data when you use our story pointing and
                estimation service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mt-4 mb-2">
                2. Information We Collect
              </h2>
              <p className="text-muted-foreground mb-2">
                We collect information necessary to provide and improve the
                Service:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>
                  <strong>Account information:</strong> When you sign in (e.g.,
                  via our authentication provider), we receive identifiers such
                  as your user ID, email (if provided), name, and profile
                  picture so we can display your identity in rooms and manage
                  access.
                </li>
                <li>
                  <strong>Room and session data:</strong> Room names, round
                  names, ticket references, votes, participant lists, and
                  settings (e.g., point scales, timers) so we can run pointing
                  sessions and show results.
                </li>
                <li>
                  <strong>Usage data:</strong> We may collect technical and
                  usage information such as device type, browser, and how you
                  interact with the Service to operate and improve it.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mt-4 mb-2">
                3. How We Use Your Information
              </h2>
              <p className="text-muted-foreground">
                We use the information we collect to: provide, maintain, and
                improve the Service; authenticate you and manage your account;
                sync and display rooms, rounds, and votes in real time; support
                integrations (e.g., Jira) when you choose to use them; respond
                to your requests and enforce our terms; and, where applicable,
                send you service-related communications. We do not sell your
                personal information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mt-4 mb-2">
                4. Data Sharing and Third Parties
              </h2>
              <p className="text-muted-foreground">
                We work with trusted service providers (e.g., hosting,
                authentication, real-time database) to operate the Service.
                These providers process data on our behalf under contractual
                obligations to protect your information. When you use
                integrations such as Jira, data you choose to link (e.g., ticket
                IDs) may be sent to those third parties according to their
                policies. We may disclose information if required by law or to
                protect our rights, safety, or property.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mt-4 mb-2">
                5. Data Retention
              </h2>
              <p className="text-muted-foreground">
                We retain your account and room data for as long as your account
                is active or as needed to provide the Service. You may request
                deletion of your data; we will honor such requests subject to
                legal and operational requirements (e.g., backup retention).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mt-4 mb-2">6. Security</h2>
              <p className="text-muted-foreground">
                We use industry-standard measures to protect your data,
                including encryption in transit and access controls. No method
                of transmission or storage is 100% secure; we cannot guarantee
                absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mt-4 mb-2">
                7. Your Rights and Choices
              </h2>
              <p className="text-muted-foreground">
                Depending on your location, you may have rights to access,
                correct, delete, or port your personal data, or to object to or
                restrict certain processing. You can often manage your account
                and preferences through the Service or our authentication
                provider. To exercise your rights or ask questions, contact us
                using the details provided on the Point My Story website or in
                the app.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mt-4 mb-2">
                8. Children’s Privacy
              </h2>
              <p className="text-muted-foreground">
                The Service is not directed at children under 13. We do not
                knowingly collect personal information from children under 13.
                If you believe we have collected such information, please
                contact us so we can delete it.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mt-4 mb-2">
                9. Changes to This Policy
              </h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will
                post the updated policy on this page and update the “Last
                updated” date. Continued use of the Service after changes
                constitutes acceptance of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mt-4 mb-2">
                10. Contact Us
              </h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy or our data
                practices, please contact us through the contact method provided
                on the Point My Story website or in the app.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
