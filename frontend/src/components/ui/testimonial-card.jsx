import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const TestimonialCard = ({
  author,
  text,
  href,
}) => {
  return (
    <div className={cn(
      "relative flex flex-col justify-between p-6 rounded-2xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md min-w-[300px] max-w-[300px]",
    )}>
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
            "{text}"
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
            <img className="aspect-square h-full w-full" src={author.avatar} alt={author.name} />
          </span>
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-foreground">{author.name}</p>
            <p className="text-xs text-muted-foreground">{author.handle}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
