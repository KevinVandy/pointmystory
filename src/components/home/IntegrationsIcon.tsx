import { Github } from "lucide-react";

export function IntegrationsIcon() {
  return (
    <div className="flex items-center justify-center gap-3">
      {/* Jira Icon - Blue circle with "J" */}
      <div className="w-10 h-10 rounded-xl bg-[#0052CC] flex items-center justify-center shadow-lg shadow-[#0052CC]/30 hover:scale-110 transition-transform duration-300 cursor-default">
        <span className="text-white text-sm font-bold">J</span>
      </div>
      {/* Linear Icon - Purple gradient circle */}
      <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#5E6AD2] to-[#9B59B6] flex items-center justify-center shadow-lg shadow-[#5E6AD2]/30 hover:scale-110 transition-transform duration-300 cursor-default">
        <div className="w-4 h-4 rounded-full bg-white/40"></div>
      </div>
      {/* GitHub Icon */}
      <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center shadow-lg shadow-foreground/20 hover:scale-110 transition-transform duration-300 cursor-default">
        <Github className="w-5 h-5 text-background" />
      </div>
    </div>
  );
}
