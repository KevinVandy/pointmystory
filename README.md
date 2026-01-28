# Point My Story

A real-time sprint story pointing application for agile teams. Estimate stories together, reveal votes instantly, and reach consensus faster.

## Features

- **Real-time Collaboration** - See when teammates join and vote in real-time with live updates
- **Instant Reveal** - Reveal all votes simultaneously to avoid anchoring bias
- **Multiple Point Scales** - Choose from Fibonacci, T-shirt sizes, Powers of 2, Hybrid, Linear, or create custom scales
- **Voting Timer** - Set configurable timers (15 seconds to 10 minutes) to keep sessions on track
- **Observer Mode** - Join as an observer to watch sessions without voting
- **Public & Private Rooms** - Create private rooms for your team or public rooms for broader collaboration
- **Round History & Statistics** - Track all rounds with average, median, and vote breakdowns
- **Admin Controls** - Manage participants, set final scores, and control room settings
- **Jira Integration** - Fetch and link Jira tickets directly in your planning sessions
- **Participant Management** - Promote team members to admin, track voting status, and manage roles

## Tech Stack

### Frontend & Framework

- **[TanStack Start](https://tanstack.com/start/latest)** - Full-stack React framework providing:
  - File-based routing with TanStack Router
  - Server-side rendering (SSR) support
  - Built-in data loading with loaders
  - Type-safe routing and navigation
- **[React](https://react.dev/)** - UI library
- **[TanStack Query](https://tanstack.com/query/latest)** - Powerful data synchronization for React
- **[TanStack Router](https://tanstack.com/router/latest)** - Type-safe routing with file-based route generation

### Backend & Database

- **[Convex](https://www.convex.dev/)** - Backend-as-a-Service providing:
  - Real-time database with automatic reactivity
  - Serverless functions (queries, mutations, actions)
  - Built-in authentication integration
  - Automatic API generation with TypeScript types
  - Real-time subscriptions for live updates

### Authentication & User Management

- **[Clerk](https://clerk.com/)** - Complete authentication solution:
  - User authentication and session management
  - OAuth provider integration (including Atlassian for Jira)
  - Organization support for team management
  - User profiles and avatars

### UI & Styling

- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React component library
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library

### Development Tools

- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Vitest](https://vitest.dev/)** - Fast unit test framework
- **[Prettier](https://prettier.io/)** - Code formatter

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (or npm/yarn)
- Convex account and project
- Clerk account and application

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd pointmystory
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add your Convex deployment URL and Clerk keys:

   ```
   VITE_CONVEX_URL=your-convex-deployment-url
   VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
   ```

4. Set up Convex:
   - Install Convex CLI: `pnpm add -g convex`
   - Run `npx convex dev` to start Convex development server
   - Configure your Convex environment variables in the Convex dashboard

5. Set up Clerk:
   - Create a Clerk application
   - Configure OAuth providers (especially Atlassian if using Jira integration)
   - Add your Clerk keys to environment variables

6. Start the development server:

```bash
pnpm dev
```

The app will be available at `http://localhost:3456`

## Building For Production

To build this application for production:

```bash
pnpm build
```

The production build will be output to the `dist` directory.

## Project Structure

```
pointmystory/
├── convex/              # Convex backend functions
│   ├── rooms.ts        # Room management
│   ├── rounds.ts       # Voting round logic
│   ├── votes.ts        # Vote handling
│   ├── participants.ts # Participant management
│   ├── jira.ts         # Jira integration
│   └── schema.ts       # Database schema
├── src/
│   ├── components/     # React components
│   ├── routes/         # TanStack Router file-based routes
│   ├── lib/           # Utility functions
│   └── styles.css     # Global styles
└── public/            # Static assets
```

## Key Concepts

### Rooms

A room represents a story pointing session. Rooms can be public or private, and have configurable point scales, timers, and settings.

### Rounds

Each round represents a single story/ticket being estimated. Participants vote, votes are revealed simultaneously, and admins can set final scores.

### Participants

Users who join a room can be:

- **Voters** - Can cast votes on stories
- **Observers** - Can watch but not vote
- **Admins** - Can manage room settings, participants, and set final scores

### Point Scales

Multiple preset scales are available:

- Fibonacci (1, 2, 3, 5, 8, 13, 21, ...)
- T-shirt sizes (XS, S, M, L, XL, XXL)
- Powers of 2 (1, 2, 4, 8, 16, ...)
- Hybrid (combines multiple scales)
- Linear (1, 2, 3, 4, 5, ...)
- Custom (user-defined)

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
pnpm test
```

## Deployment

This project is configured for deployment on Netlify with the `@netlify/vite-plugin-tanstack-start` plugin. The `netlify.toml` file contains the deployment configuration.

## Learn More

- [TanStack Start Documentation](https://tanstack.com/start/latest)
- [Convex Documentation](https://docs.convex.dev/)
- [Clerk Documentation](https://clerk.com/docs)
- [TanStack Router Documentation](https://tanstack.com/router/latest)
- [TanStack Query Documentation](https://tanstack.com/query/latest)

<!-- Use the FORCE LUKE! -->
