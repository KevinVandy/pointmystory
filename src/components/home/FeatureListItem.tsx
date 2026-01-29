interface FeatureListItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureListItem({
  icon,
  title,
  description,
}: FeatureListItemProps) {
  return (
    <div className="group flex items-start gap-4 p-4 rounded-xl bg-card border hover:border-primary/30 hover:bg-muted hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <div className="w-11 h-11 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div>
        <h3 className="font-bold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
