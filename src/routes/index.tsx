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
  Timer,
  BarChart3,
  Globe,
  History,
  Play,
  Eye,
  Settings,
  Github,
  Plug2,
  Lock,
} from "lucide-react";
import { RoomMembershipTable } from "@/components/RoomMembershipTable";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { setDemoSessionId } from "@/lib/demoSession";
import { HomePageSkeleton } from "@/components/HomePageSkeleton";
import { RejoinRoomAlert } from "@/components/RejoinRoomAlert";
import {
  Avatar,
  AvatarGroup,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
} from "@/components/ui/avatar";

export const Route = createFileRoute("/")({
  component: Home,
  pendingComponent: HomePageSkeleton,
});

function IntegrationsIcon() {
  return (
    <div className="flex items-center justify-center gap-2">
      {/* Jira Icon - Blue circle with "J" */}
      <div className="w-6 h-6 rounded bg-[#0052CC] flex items-center justify-center">
        <span className="text-white text-xs font-bold">J</span>
      </div>
      {/* Linear Icon - Purple gradient circle */}
      <div className="w-6 h-6 rounded-full bg-linear-to-br from-[#5E6AD2] to-[#9B59B6] flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-white/30"></div>
      </div>
      {/* GitHub Icon */}
      <Github className="w-6 h-6" />
    </div>
  );
}

function CollaborationAvatars() {
  // Demo avatars with status dots using local stock avatars
  const avatars = [
    {
      name: "Alex",
      initial: "A",
      online: true,
      image: "/stock-avatars/avatar1.png",
    },
    {
      name: "Sam",
      initial: "S",
      online: true,
      image: "/stock-avatars/avatar2.png",
    },
    {
      name: "Jordan",
      initial: "J",
      online: false,
      image: "/stock-avatars/avatar3.png",
    },
    {
      name: "Taylor",
      initial: "T",
      online: true,
      image: "/stock-avatars/avatar4.png",
    },
    {
      name: "Morgan",
      initial: "M",
      online: true,
      image: "/stock-avatars/avatar5.png",
    },
  ];

  return (
    <AvatarGroup className="justify-center">
      {avatars.map((avatar, index) => (
        <Avatar key={index} size="lg">
          <AvatarImage src={avatar.image} alt={avatar.name} />
          <AvatarFallback>{avatar.initial}</AvatarFallback>
          <AvatarBadge
            className={
              avatar.online
                ? "bg-green-500 border-green-500"
                : "bg-gray-400 border-gray-400"
            }
          />
        </Avatar>
      ))}
    </AvatarGroup>
  );
}

function VisibilityToggle() {
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  return (
    <div className="flex gap-2 justify-center">
      <Button
        type="button"
        variant={visibility === "private" ? "default" : "outline"}
        size="sm"
        onClick={() => setVisibility("private")}
        className="flex-1 max-w-[100px]"
      >
        <Lock className="w-4 h-4 mr-1" />
        Private
      </Button>
      <Button
        type="button"
        variant={visibility === "public" ? "default" : "outline"}
        size="sm"
        onClick={() => setVisibility("public")}
        className="flex-1 max-w-[100px]"
      >
        <Globe className="w-4 h-4 mr-1" />
        Public
      </Button>
    </div>
  );
}

function Home() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-linear-to-b from-background to-muted/20">
      <RejoinRoomAlert />
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
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Point My Story
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real-time sprint story pointing for agile teams. Estimate stories
              together, reveal votes instantly, and reach consensus faster.
            </p>
          </div>

          {/* Top 3 Featured Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            <FeaturedCard
              icon={<Users className="w-8 h-8" />}
              title="Real-time Collaboration"
              description="See when teammates join and vote in real-time with live updates. Everyone stays in sync with instant notifications and live participant status."
              footer={<CollaborationAvatars />}
            />
            <FeaturedCard
              icon={<Globe className="w-8 h-8" />}
              title="Public & Private Rooms"
              description="Create private rooms for your team or public rooms for broader collaboration. Control access and manage permissions with ease."
              footer={<VisibilityToggle />}
            />
            <FeaturedCard
              icon={<Plug2 className="w-8 h-8" />}
              title="Integrations"
              description="Connect with Jira, Linear, GitHub, and more. Fetch tickets directly, link stories, and sync your workflow seamlessly."
              footer={<IntegrationsIcon />}
            />
          </div>

          {/* All Other Features */}
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-2xl font-semibold text-center mb-8">
              Everything You Need
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <FeatureListItem
                icon={<Zap className="w-5 h-5" />}
                title="Instant Reveal"
                description="Reveal all votes simultaneously to avoid anchoring bias"
              />
              <FeatureListItem
                icon={<BarChart3 className="w-5 h-5" />}
                title="Multiple Point Scales"
                description="Fibonacci, T-shirt sizes, Powers of 2, Hybrid, Linear, or custom scales"
              />
              <FeatureListItem
                icon={<Timer className="w-5 h-5" />}
                title="Voting Timer"
                description="Configurable timers from 15 seconds to 10 minutes"
              />
              <FeatureListItem
                icon={<History className="w-5 h-5" />}
                title="Round History & Statistics"
                description="Track rounds with average, median, and vote breakdowns"
              />
              <FeatureListItem
                icon={<Eye className="w-5 h-5" />}
                title="Observer Mode"
                description="Join as an observer to watch sessions without voting"
              />
              <FeatureListItem
                icon={<Settings className="w-5 h-5" />}
                title="Admin Controls"
                description="Manage participants, set final scores, and control room settings"
              />
            </div>
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
          Sign in to create or join a story pointing room
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

function FeaturedCard({
  icon,
  title,
  description,
  footer,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary mx-auto">
          {icon}
        </div>
        <CardTitle className="text-xl mb-2">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      {footer && (
        <CardContent className="mt-auto pt-0 pb-6">
          <div className="text-center">{footer}</div>
        </CardContent>
      )}
    </Card>
  );
}

function FeatureListItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
