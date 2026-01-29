import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FeaturedCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  footer?: React.ReactNode;
  gradient?: string;
}

export function FeaturedCard({
  icon,
  title,
  description,
  footer,
  gradient = "from-primary/20 via-primary/10 to-primary/20",
}: FeaturedCardProps) {
  return (
    <div className="group relative h-full">
      {/* Gradient border effect */}
      <div
        className={`absolute -inset-0.5 bg-linear-to-br ${gradient} rounded-2xl blur-sm opacity-50 group-hover:opacity-100 transition duration-500`}
      />

      <Card className="relative h-full flex flex-col bg-card border shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1">
        <CardHeader className="text-center">
          <div
            className={`w-16 h-16 rounded-2xl bg-linear-to-br ${gradient} flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300`}
          >
            <div className="text-foreground">{icon}</div>
          </div>
          <CardTitle className="text-xl mb-2 font-bold">{title}</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            {description}
          </CardDescription>
        </CardHeader>
        {footer && (
          <CardContent className="mt-auto pt-0 pb-6">
            <div className="text-center">{footer}</div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
