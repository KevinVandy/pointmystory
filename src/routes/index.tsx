import { createFileRoute } from "@tanstack/react-router";
import { ComponentExample } from "@/components/component-example";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  SignUpButton,
  UserButton,
} from "@clerk/tanstack-react-start";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div>
      <h1>Index Route</h1>
      <SignedIn>
        <ComponentExample />
        <UserButton />
        <SignOutButton />
      </SignedIn>
      <SignedOut>
        <p>You are signed out</p>
        <SignInButton />
        <SignUpButton />
      </SignedOut>
    </div>
  );
}
