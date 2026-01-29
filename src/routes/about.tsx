import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
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
            <CardTitle className="text-2xl">About Point My Story</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <p className="text-muted-foreground">
              Point My Story is a real-time sprint story pointing app for agile
              teams. You get live collaboration—see when teammates join and
              vote—plus simultaneous vote reveal to avoid anchoring bias.
              Features include multiple point scales (Fibonacci, T-shirt sizes,
              powers of 2, hybrid, linear, or custom), configurable voting
              timers, observer mode, public and private rooms, round history
              with averages and medians, admin controls for final scores and
              settings, optional Jira integration for ticket details, and
              participant roles (voters, observers, admins).
            </p>

            <p className="text-muted-foreground">
              The app is built with TanStack Start (React, Router, Query) for
              the front end and SSR, Convex for the real-time backend and
              database, and Clerk for authentication and organizations. The UI
              uses Tailwind CSS, shadcn/ui, and Lucide icons, with Vite and
              TypeScript for development and Vitest for tests. It’s deployed on
              Netlify.
            </p>

            <p className="text-muted-foreground">
              I’m Kevin, the creator of Point My Story. I built it to make
              sprint planning and story pointing smoother for teams. You can
              find me on{" "}
              <a
                href="https://github.com/KevinVandy/pointmystory"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                GitHub
              </a>
              ,{" "}
              <a
                href="https://x.com/KevinVanCott"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                X
              </a>
              , and{" "}
              <a
                href="https://bsky.app/profile/kevinvancott.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                Bluesky
              </a>
              , or support the project via{" "}
              <a
                href="https://github.com/sponsors/KevinVandy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                GitHub Sponsors
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
