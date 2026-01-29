import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { SignInButton, SignUpButton } from "@clerk/tanstack-react-start";
import { Play } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "../../../convex/_generated/api";
import { setDemoSessionId } from "@/lib/demoSession";

export function GetStartedCard() {
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
    <div className="w-full max-w-md mx-auto relative group">
      {/* Gradient border glow effect */}
      <div className="absolute -inset-0.5 bg-linear-to-r from-primary via-primary/50 to-primary rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />

      <Card className="relative bg-card border shadow-2xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">Get Started</CardTitle>
          <CardDescription className="text-base">
            Sign in to create or join a story pointing room
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <SignInButton mode="modal">
            <Button className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button
              variant="outline"
              className="w-full h-11 text-base font-semibold"
            >
              Create Account
            </Button>
          </SignUpButton>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted-foreground/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full h-11 text-base hover:bg-primary/10"
            onClick={handleTryDemo}
            disabled={isCreating}
          >
            <Play className="w-4 h-4 mr-2" />
            {isCreating ? "Creating Demo..." : "Try Demo Without Account"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
