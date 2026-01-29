import { Users, Globe, Plug2 } from "lucide-react";
import { FeaturedCard } from "./FeaturedCard";
import { CollaborationAvatars } from "./CollaborationAvatars";
import { VisibilityToggle } from "./VisibilityToggle";
import { IntegrationsIcon } from "./IntegrationsIcon";

export function FeaturedFeatures() {
  return (
    <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-20">
      <FeaturedCard
        icon={<Users className="w-8 h-8" />}
        title="Real-time Collaboration"
        description="See when teammates join and vote in real-time with live updates. Everyone stays in sync with instant notifications and live participant status."
        footer={<CollaborationAvatars />}
        gradient="from-emerald-500/20 via-teal-500/20 to-cyan-500/20"
      />
      <FeaturedCard
        icon={<Globe className="w-8 h-8" />}
        title="Public & Private Rooms"
        description="Create private rooms for your team or public rooms for broader collaboration. Control access and manage permissions with ease."
        footer={<VisibilityToggle />}
        gradient="from-blue-500/20 via-indigo-500/20 to-violet-500/20"
      />
      <FeaturedCard
        icon={<Plug2 className="w-8 h-8" />}
        title="Integrations"
        description="Connect with Jira, Linear, GitHub, and more. Fetch tickets directly, link stories, and sync your workflow seamlessly."
        footer={<IntegrationsIcon />}
        gradient="from-amber-500/20 via-orange-500/20 to-rose-500/20"
      />
    </div>
  );
}
