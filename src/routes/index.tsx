import { createFileRoute } from "@tanstack/react-router";
import { CreateRoomForm } from "@/components/CreateRoomForm";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from "@clerk/tanstack-react-start";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Zap, Eye } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Point My Story
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time sprint planning poker for agile teams. Estimate stories
            together, reveal votes instantly, and reach consensus faster.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Real-time Collaboration"
            description="See when teammates join and vote in real-time"
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Instant Reveal"
            description="Reveal all votes simultaneously to avoid anchoring bias"
          />
          <FeatureCard
            icon={<Eye className="w-6 h-6" />}
            title="Fibonacci Points"
            description="Use industry-standard Fibonacci sequence for estimation"
          />
        </div>

        {/* Main Action Area */}
        <SignedIn>
          <CreateRoomForm />
        </SignedIn>

        <SignedOut>
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                Sign in to create or join a planning poker room
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <SignInButton mode="modal">
                <Button className="w-full">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button variant="outline" className="w-full">
                  Create Account
                </Button>
              </SignUpButton>
            </CardContent>
          </Card>
        </SignedOut>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6">
      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
