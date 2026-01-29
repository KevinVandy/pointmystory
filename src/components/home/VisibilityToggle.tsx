import { useState } from "react";
import { Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VisibilityToggle() {
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  return (
    <div className="flex gap-2 justify-center p-1 bg-muted rounded-full">
      <Button
        type="button"
        variant={visibility === "private" ? "default" : "ghost"}
        size="sm"
        onClick={() => setVisibility("private")}
        className={`flex-1 max-w-[100px] rounded-full transition-all duration-300 ${
          visibility === "private" ? "shadow-md" : ""
        }`}
      >
        <Lock className="w-4 h-4 mr-1" />
        Private
      </Button>
      <Button
        type="button"
        variant={visibility === "public" ? "default" : "ghost"}
        size="sm"
        onClick={() => setVisibility("public")}
        className={`flex-1 max-w-[100px] rounded-full transition-all duration-300 ${
          visibility === "public" ? "shadow-md" : ""
        }`}
      >
        <Globe className="w-4 h-4 mr-1" />
        Public
      </Button>
    </div>
  );
}
