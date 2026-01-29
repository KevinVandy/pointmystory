import { createFileRoute } from "@tanstack/react-router";
import { CreateRoomForm } from "@/components/CreateRoomForm";
import { SignedIn, SignedOut } from "@clerk/tanstack-react-start";
import { RoomMembershipTable } from "@/components/RoomMembershipTable";
import { HomePageSkeleton } from "@/components/HomePageSkeleton";
import { RejoinRoomAlert } from "@/components/RejoinRoomAlert";
import { HeroSection } from "@/components/home/HeroSection";
import { VotingPreview } from "@/components/home/VotingPreview";
import { FeaturedFeatures } from "@/components/home/FeaturedFeatures";
import { FeatureList } from "@/components/home/FeatureList";
import { GetStartedCard } from "@/components/home/GetStartedCard";

export const Route = createFileRoute("/")({
  component: Home,
  pendingComponent: HomePageSkeleton,
});

function HomePageContent() {
  return (
    <>
      <HeroSection />
      <VotingPreview />
      <FeaturedFeatures />
      <FeatureList />
      <GetStartedCard />
    </>
  );
}

function Home() {
  return (
    <div className="min-h-[calc(100vh-80px)] relative overflow-hidden">
      {/* Animated gradient background - uses fixed positioning to cover full viewport */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-primary/10" />

        {/* Animated gradient orbs */}
        <div className="absolute top-0 -left-40 w-80 h-80 bg-primary/30 rounded-full blur-[100px] animate-float" />
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-float-delayed" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-primary/25 rounded-full blur-[80px] animate-float-slow" />

        {/* Additional accent orb */}
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] animate-float-delayed" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <RejoinRoomAlert />
      <div className="container mx-auto px-4 py-12 relative">
        {/* Signed In Users - Just show functional content */}
        <SignedIn>
          <RoomMembershipTable />
          <div className="mt-8">
            <CreateRoomForm />
          </div>
        </SignedIn>

        {/* Signed Out Users - Show marketing content */}
        <SignedOut>
          <HomePageContent />
        </SignedOut>
      </div>
    </div>
  );
}
