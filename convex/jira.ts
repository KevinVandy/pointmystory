import { v } from "convex/values";
import { action } from "./_generated/server";

// Types for Jira API responses
interface AccessibleResource {
  id: string; // Cloud ID
  name: string;
  url: string;
  scopes: string[];
  avatarUrl?: string;
}

interface JiraIssue {
  id: string;
  key: string; // e.g., "PROJ-123"
  fields: {
    summary: string;
    description?: string;
    status?: {
      name: string;
    };
    assignee?: {
      displayName: string;
    };
    project?: {
      key: string;
      name: string;
    };
  };
}

interface JiraSearchResponse {
  issues: JiraIssue[];
  maxResults: number;
  startAt: number;
  total: number;
}

/**
 * Helper function to get OAuth access token from Clerk Management API
 * for a user's connected Atlassian account.
 */
async function getClerkOAuthToken(userId: string): Promise<string> {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    throw new Error(
      "CLERK_SECRET_KEY environment variable is not set. Please add it to your Convex dashboard."
    );
  }

  try {
    const response = await fetch(
      `https://api.clerk.com/v1/users/${userId}/oauth_access_tokens/oauth_atlassian`,
      {
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          "No Atlassian account connected. Please connect your Atlassian account in your profile settings."
        );
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "Failed to authenticate with Clerk. Please check your CLERK_SECRET_KEY."
        );
      }
      const errorText = await response.text();
      throw new Error(
        `Failed to get OAuth token from Clerk: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();
    
    // Clerk returns an array of OAuth access tokens
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(
        "No OAuth access token found. Please reconnect your Atlassian account."
      );
    }

    // Get the most recent token (first one in the array)
    const token = data[0];
    if (!token?.token) {
      throw new Error("Invalid OAuth token format from Clerk.");
    }

    return token.token;
  } catch (error: any) {
    if (error.message) {
      throw error;
    }
    throw new Error(
      `Failed to retrieve OAuth token: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Get accessible Jira resources (sites) for the authenticated user.
 * Returns a list of Jira sites the user has access to, along with their Cloud IDs.
 */
export const getAccessibleResources = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    try {
      // Get OAuth token from Clerk
      const oauthToken = await getClerkOAuthToken(identity.subject);

      // Call Jira API to get accessible resources
      const response = await fetch(
        "https://api.atlassian.com/oauth/token/accessible-resources",
        {
          headers: {
            Authorization: `Bearer ${oauthToken}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "OAuth token expired or invalid. Please reconnect your Atlassian account."
          );
        }
        const errorText = await response.text();
        throw new Error(
          `Failed to get accessible resources: ${response.status} ${errorText}`
        );
      }

      const resources: AccessibleResource[] = await response.json();

      // Filter to only Jira sites (those with write:jira-work or read:jira-work scope)
      const jiraResources = resources.filter(
        (resource) =>
          resource.scopes.some(
            (scope) =>
              scope.includes("jira-work") ||
              scope.includes("jira-user") ||
              scope.includes("jira-configuration")
          )
      );

      if (jiraResources.length === 0) {
        throw new Error(
          "No Jira sites found. Make sure you have access to at least one Jira site."
        );
      }

      return {
        success: true,
        resources: jiraResources.map((r) => ({
          cloudId: r.id,
          name: r.name,
          url: r.url,
          scopes: r.scopes,
          avatarUrl: r.avatarUrl,
        })),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to get accessible resources",
      };
    }
  },
});

/**
 * Search for Jira issues using JQL (Jira Query Language).
 * Returns a list of issues matching the query.
 */
export const searchIssues = action({
  args: {
    cloudId: v.string(),
    jql: v.optional(v.string()),
    maxResults: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    try {
      // Get OAuth token from Clerk
      const oauthToken = await getClerkOAuthToken(identity.subject);

      // Build JQL query - default to showing unresolved issues if no JQL provided
      const jqlQuery =
        args.jql || "resolution = Unresolved ORDER BY updated DESC";

      // Build search URL using the new /search/jql endpoint
      const searchUrl = new URL(
        `https://api.atlassian.com/ex/jira/${args.cloudId}/rest/api/3/search/jql`
      );
      searchUrl.searchParams.set("jql", jqlQuery);
      searchUrl.searchParams.set("maxResults", String(args.maxResults || 50));
      searchUrl.searchParams.set("fields", "summary,status,assignee,project");

      const response = await fetch(searchUrl.toString(), {
        headers: {
          Authorization: `Bearer ${oauthToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "OAuth token expired or invalid. Please reconnect your Atlassian account."
          );
        }
        if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Invalid JQL query: ${errorData.errorMessages?.[0] || "Invalid query"}`
          );
        }
        if (response.status === 410) {
          throw new Error(
            "The Jira API endpoint has been deprecated. Please update the application."
          );
        }
        const errorText = await response.text();
        throw new Error(
          `Failed to search issues: ${response.status} ${errorText}`
        );
      }

      const data: JiraSearchResponse = await response.json();

      return {
        success: true,
        issues: data.issues.map((issue) => ({
          key: issue.key,
          summary: issue.fields.summary,
          status: issue.fields.status?.name,
          assignee: issue.fields.assignee?.displayName,
          project: issue.fields.project?.key,
        })),
        total: data.total,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to search issues",
      };
    }
  },
});

/**
 * Get a specific Jira issue by its key (e.g., "PROJ-123").
 * Returns full issue details.
 */
export const getIssue = action({
  args: {
    cloudId: v.string(),
    issueKey: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    try {
      // Get OAuth token from Clerk
      const oauthToken = await getClerkOAuthToken(identity.subject);

      // Call Jira API to get issue details
      const response = await fetch(
        `https://api.atlassian.com/ex/jira/${args.cloudId}/rest/api/3/issue/${args.issueKey}`,
        {
          headers: {
            Authorization: `Bearer ${oauthToken}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "OAuth token expired or invalid. Please reconnect your Atlassian account."
          );
        }
        if (response.status === 404) {
          throw new Error(`Issue ${args.issueKey} not found.`);
        }
        const errorText = await response.text();
        throw new Error(
          `Failed to get issue: ${response.status} ${errorText}`
        );
      }

      const issue: JiraIssue = await response.json();

      return {
        success: true,
        issue: {
          key: issue.key,
          summary: issue.fields.summary,
          description: issue.fields.description,
          status: issue.fields.status?.name,
          assignee: issue.fields.assignee?.displayName,
          project: issue.fields.project?.key,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to get issue",
      };
    }
  },
});
