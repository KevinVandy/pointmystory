import { Link } from "@tanstack/react-router";
import { Github, Heart, MessageCircle, Twitter, X } from "lucide-react";

const GITHUB_REPO = "https://github.com/KevinVandy/pointmystory";
const GITHUB_SPONSORS = "https://github.com/sponsors/KevinVandy";
const X_PROFILE = "https://x.com/KevinVanCott";
const BLUESKY_PROFILE = "https://bsky.app/profile/kevinvancott.dev";

const socialLinkClass =
  "flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors [&_svg]:size-4 [&_svg]:shrink-0";

export default function Footer() {
  return (
    <footer className="border-t bg-muted py-4">
      <div className="container mx-auto px-4 flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Point My Story</span>
          <Link to="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link
            to="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className={socialLinkClass}
            aria-label="GitHub repository"
          >
            <Github />
            <span className="text-sm">GitHub</span>
          </a>
          <a
            href={GITHUB_SPONSORS}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-[#ea4aaa] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#c93a8f] transition-colors [&_svg]:size-4 [&_svg]:shrink-0"
            aria-label="Sponsor on GitHub"
          >
            <Heart className="fill-current" />
            <span>Sponsor</span>
          </a>
          <a
            href={X_PROFILE}
            target="_blank"
            rel="noopener noreferrer"
            className={socialLinkClass}
            aria-label="X (Twitter)"
          >
            <Twitter />/<X />
            <span className="text-sm">@kevinvancott</span>
          </a>
          <a
            href={BLUESKY_PROFILE}
            target="_blank"
            rel="noopener noreferrer"
            className={socialLinkClass}
            aria-label="Bluesky"
          >
            <MessageCircle />
            <span className="text-sm">@kevinvancott.dev</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
