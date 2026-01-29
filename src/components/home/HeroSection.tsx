import { Zap } from "lucide-react";

export function HeroSection() {
  return (
    <div className="text-center mb-10 pt-8">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
        <Zap className="w-4 h-4" />
        Real-time Agile Estimation
      </div>
      <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight pb-1 bg-linear-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
        Point My Story
      </h1>
      <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
        Real-time sprint story pointing for agile teams. Estimate stories
        together, reveal votes instantly, and reach consensus faster.
      </p>
    </div>
  );
}
