import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import {
  Users,
  Zap,
  Eye,
  Timer,
  BarChart3,
  Settings,
  Globe,
  History,
  Play,
} from "lucide-react";
import { RoomMembershipTable } from "@/components/RoomMembershipTable";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { setDemoSessionId } from "@/lib/demoSession";
import { HomePageSkeleton } from "@/components/HomePageSkeleton";

export const Route = createFileRoute("/")({
  component: Home,
  pendingComponent: HomePageSkeleton,
});

function Home() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Signed In Users - Just show functional content */}
        <SignedIn>
          <RoomMembershipTable />
          <div className="mt-8">
            <CreateRoomForm />
          </div>
        </SignedIn>

        {/* Signed Out Users - Show marketing content */}
        <SignedOut>
          {/* Hero Section */}
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Real-time Collaboration"
              description="See when teammates join and vote in real-time with live updates"
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Instant Reveal"
              description="Reveal all votes simultaneously to avoid anchoring bias"
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Multiple Point Scales"
              description="Choose from Fibonacci, T-shirt sizes, Powers of 2, Hybrid, Linear, or create custom scales"
            />
            <FeatureCard
              icon={<Timer className="w-6 h-6" />}
              title="Voting Timer"
              description="Set configurable timers (15 seconds to 10 minutes) to keep sessions on track"
            />
            <FeatureCard
              icon={<Eye className="w-6 h-6" />}
              title="Observer Mode"
              description="Join as an observer to watch sessions without voting"
            />
            <FeatureCard
              icon={<Globe className="w-6 h-6" />}
              title="Public & Private Rooms"
              description="Create private rooms for your team or public rooms for broader collaboration"
            />
            <FeatureCard
              icon={<History className="w-6 h-6" />}
              title="Round History & Statistics"
              description="Track all rounds with average, median, and vote breakdowns"
            />
            <FeatureCard
              icon={<Settings className="w-6 h-6" />}
              title="Admin Controls"
              description="Manage participants, set final scores, and control room settings"
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Participant Management"
              description="Promote team members to admin, track voting status, and manage roles"
            />
          </div>

          {/* Sign In Card */}
          <GetStartedCard />
        </SignedOut>
      </div>
    </div>
  );
}

function GetStartedCard() {
  const navigate = useNavigate();
  const createDemo = useMutation(api.rooms.createDemo);
  const [isCreating, setIsCreating] = useState(false);

  const handleTryDemo = async () => {
    setIsCreating(true);
    try {
      const result = await createDemo({});
      // Store demoSessionId in localStorage
      if (result.demoSessionId) {
        setDemoSessionId(result.roomId, result.demoSessionId);
      }
      navigate({ to: "/room/$roomId", params: { roomId: result.roomId } });
    } catch (error: any) {
      console.error("Failed to create demo room:", error);
      toast.error(error.message || "Failed to create demo room");
      setIsCreating(false);
    }
  };

  return (
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
        <Button
          variant="ghost"
          className="w-full"
          onClick={handleTryDemo}
          disabled={isCreating}
        >
          <Play className="w-4 h-4 mr-2" />
          {isCreating ? "Creating Demo..." : "Try Demo"}
        </Button>
      </CardContent>
    </Card>
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
