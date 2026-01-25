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
import { ClerkProvider, useAuth, useUser } from "@clerk/tanstack-react-start";
import { auth } from "@clerk/tanstack-react-start/server";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexQueryClient } from "@convex-dev/react-query";

// devtools
// import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
// import { TanStackDevtools } from "@tanstack/react-devtools";

import Header from "../components/Header";
import { ThemeProvider } from "../components/ThemeProvider";
import { Toaster } from "sonner";
import { RejoinRoomAlert } from "../components/RejoinRoomAlert";

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

  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={context.convexClient} useAuth={useAuth}>
        <ThemeWrapper>
          <RootDocument>
            <Outlet />
          </RootDocument>
        </ThemeWrapper>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

// Wrapper to get Clerk user state and pass to ThemeProvider
function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser();
  return <ThemeProvider isSignedIn={!!isSignedIn}>{children}</ThemeProvider>;
}

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
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
    <>
      <Header />
      <RejoinRoomAlert />
      <main className="pb-64">
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
      <Toaster position="bottom-right" />
      {/* <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      /> */}
    </>
  );
}
