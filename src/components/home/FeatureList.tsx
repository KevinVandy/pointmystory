import { Zap, Timer, BarChart3, History, Eye, Settings } from "lucide-react";
import { FeatureListItem } from "./FeatureListItem";

export function FeatureList() {
  return (
    <div className="max-w-4xl mx-auto mb-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-3">Everything You Need</h2>
        <p className="text-muted-foreground">
          Powerful features to streamline your estimation process
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
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
  );
}
