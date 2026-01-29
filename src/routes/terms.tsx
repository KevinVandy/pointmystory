import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
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
            <CardTitle className="text-2xl">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: January 28, 2025
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-lg font-semibold mt-4 mb-2">
                1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground">
                By accessing or using Point My Story (“the Service”), you agree
                to be bound by these Terms of Service. If you do not agree to
                these terms, please do not use the Service. The Service provides
                real-time sprint story pointing and estimation tools for agile
                teams.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mt-4 mb-2">
                2. Description of Service
              </h2>
              <p className="text-muted-foreground">
                Point My Story allows you to create and join pointing rooms, run
                voting rounds on stories or tickets, use configurable point
                scales and timers, and optionally connect to Jira for ticket
                details. The Service may offer demo or trial modes. We reserve
                the right to modify, suspend, or discontinue any part of the
                Service with reasonable notice where practicable.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mt-4 mb-2">
                3. Your Account and Conduct
              </h2>
              <p className="text-muted-foreground">
                You are responsible for maintaining the security of your account
                and for all activity that occurs under it. You agree to use the
                Service only for lawful purposes and in a way that does not
                infringe the rights of others or restrict their use of the
                Service. You must not use the Service to harass others, share
                illegal or harmful content, or attempt to gain unauthorized
                access to any systems or data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mt-4 mb-2">
                4. Rooms, Content, and Data
              </h2>
              <p className="text-muted-foreground">
                You may create rooms, invite participants, and store content
                (e.g., round names, ticket references, votes) necessary for the
                Service. You retain ownership of your content. By using the
                Service, you grant us the rights necessary to operate the
                Service (e.g., storing and displaying your data, syncing in real
                time). We do not claim ownership of your content. You are
                responsible for ensuring you have the right to use any content
                you provide, including data pulled from third-party tools like
                Jira.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mt-4 mb-2">
                5. Third-Party Services
              </h2>
              <p className="text-muted-foreground">
                The Service may integrate with third-party services (e.g.,
                authentication providers, Jira). Your use of those services is
                subject to their respective terms and policies. We are not
                responsible for the availability, accuracy, or conduct of
                third-party services.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mt-4 mb-2">
                6. Disclaimers
              </h2>
              <p className="text-muted-foreground">
                The Service is provided “as is” and “as available” without
                warranties of any kind, either express or implied. We do not
                warrant that the Service will be uninterrupted, error-free, or
                free of harmful components. Use of the Service is at your own
                risk.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mt-4 mb-2">
                7. Limitation of Liability
              </h2>
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, Point My Story and its
                operators shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages, or any loss of
                profits, data, or business opportunities, arising from your use
                of or inability to use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mt-4 mb-2">
                8. Changes to Terms
              </h2>
              <p className="text-muted-foreground">
                We may update these Terms from time to time. We will post the
                updated terms on this page and update the “Last updated” date.
                Continued use of the Service after changes constitutes
                acceptance of the revised Terms. If you do not agree, you should
                stop using the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mt-4 mb-2">9. Contact</h2>
              <p className="text-muted-foreground">
                If you have questions about these Terms, please contact us
                through the contact method provided on the Point My Story
                website or in the app.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
