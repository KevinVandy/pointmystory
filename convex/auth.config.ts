export default {
  providers: [
    {
      // The domain for your Clerk application
      // You can find this in your Clerk Dashboard under "API Keys"
      // It should look like: https://your-app.clerk.accounts.dev
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
