import { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouteContext,
} from "@tanstack/react-router";
import { Suspense } from "react";
import { createServerFn } from "@tanstack/react-start";
import { ClerkProvider, useAuth } from "@clerk/tanstack-react-start";
import { auth } from "@clerk/tanstack-react-start/server";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexQueryClient } from "@convex-dev/react-query";

// devtools
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { ThemeProvider } from "../components/ThemeProvider";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";

// Server function to fetch Clerk auth and token for Convex
const fetchClerkAuth = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const authState = await auth();

    // Only try to get token if user is authenticated
    let token = null;
    let organizationId = null;
    if (authState.userId) {
      try {
        // Get organization ID from auth state if available
        organizationId = authState.orgId || null;
        token = await authState.getToken({ template: "convex" });
      } catch (e) {
        // Token template might not exist yet - that's ok
        console.warn("Could not get Convex token:", e);
      }
    }

    return {
      userId: authState.userId,
      organizationId,
      token,
    };
  } catch (e) {
    // Auth might fail during SSR or if not configured
    console.warn("Auth check failed:", e);
    return {
      userId: null,
      organizationId: null,
      token: null,
    };
  }
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Point My Story",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon.png",
      },
      {
        rel: "apple-touch-icon",
        href: "/logo192.png",
      },
    ],
  }),

  beforeLoad: async (ctx) => {
    const authResult = await fetchClerkAuth();
    const { userId, organizationId, token } = authResult;

    // During SSR only (the only time serverHttpClient exists),
    // set the Clerk auth token to make HTTP queries with.
    if (token && ctx.context.convexQueryClient?.serverHttpClient) {
      ctx.context.convexQueryClient.serverHttpClient.setAuth(token);
    }

    return {
      userId,
      organizationId,
      token,
    };
  },

  component: RootComponent,
  shellComponent: RootShell,
});

function RootComponent() {
  const context = useRouteContext({ from: Route.id });

  // Get publishable key from environment variable
  const publishableKey = (import.meta as any).env.VITE_CLERK_PUBLISHABLE_KEY;

  // Explicitly set frontendApi to override custom domain configuration if needed
  // Set VITE_CLERK_FRONTEND_API in Netlify to your Clerk instance domain to override
  const frontendApi = (import.meta as any).env.VITE_CLERK_FRONTEND_API;

  return (
    <ThemeProvider>
      <ClerkProviderWrapper
        publishableKey={publishableKey}
        frontendApi={frontendApi}
        convexClient={context.convexClient}
      >
        <RootDocument>
          <Outlet />
        </RootDocument>
      </ClerkProviderWrapper>
    </ThemeProvider>
  );
}

// Wrapper that configures ClerkProvider with theme
function ClerkProviderWrapper({
  publishableKey,
  frontendApi,
  convexClient,
  children,
}: {
  publishableKey: string;
  frontendApi?: string;
  convexClient: ConvexReactClient;
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      {...(frontendApi && { frontendApi })}
      appearance={{
        variables: {
          // Use CSS variables that automatically respect dark mode via .dark class
          // Use lighter grey backgrounds in dark mode for better visibility
          colorBackground: "var(--clerk-background-color, var(--background))",
          colorInputBackground:
            "var(--clerk-card-background-color, var(--card))",
          // Use lighter greys in dark mode for better icon visibility
          colorText: "var(--clerk-text-color, var(--foreground))",
          colorForeground: "var(--clerk-text-color, var(--foreground))",
          colorTextSecondary:
            "var(--clerk-text-secondary-color, var(--muted-foreground))",
          colorPrimary: "var(--primary)",
          colorInputText: "var(--clerk-text-color, var(--foreground))",
          colorInputForeground: "var(--clerk-text-color, var(--foreground))",
          colorTextOnPrimaryBackground: "var(--primary-foreground)",
          colorShimmer: "var(--muted)",
          colorBorder: "var(--border)",
          colorNeutral:
            "var(--clerk-text-secondary-color, var(--muted-foreground))",
          colorDanger: "var(--destructive)",
          colorSuccess: "var(--primary)",
          borderRadius: "var(--radius)",
        },
        elements: {
          // Ensure text colors are applied to common elements with lighter greys for icons
          formButtonPrimary: "text-[var(--primary-foreground)]",
          formFieldLabel: "text-[var(--clerk-text-color, var(--foreground))]",
          formFieldInput: "text-[var(--clerk-text-color, var(--foreground))]",
          card: "text-[var(--clerk-text-color, var(--foreground))]",
          headerTitle: "text-[var(--clerk-text-color, var(--foreground))]",
          headerSubtitle:
            "text-[var(--clerk-text-secondary-color, var(--muted-foreground))]",
          socialButtonsBlockButton:
            "text-[var(--clerk-text-color, var(--foreground))]",
          formButtonReset: "text-[var(--clerk-text-color, var(--foreground))]",
          identityPreviewText:
            "text-[var(--clerk-text-color, var(--foreground))]",
          identityPreviewEditButton:
            "text-[var(--clerk-text-color, var(--foreground))]",
          // Icon-specific styling
          "formButtonPrimary svg": "text-[var(--primary-foreground)]",
          "formButtonReset svg":
            "text-[var(--clerk-text-color, var(--foreground))]",
          "socialButtonsBlockButton svg":
            "text-[var(--clerk-text-color, var(--foreground))]",
        },
      }}
    >
      <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          defer
          src="https://assets.onedollarstats.com/stonks.js"
        ></script>
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
      <Footer />
      <Toaster position="bottom-right" />
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </div>
  );
}
