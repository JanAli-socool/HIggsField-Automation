import { cn } from "../../lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = "text", width, height, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-border/50 rounded",
        variant === "text" && "h-4 w-full",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-lg",
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="group relative bg-surface rounded-xl overflow-hidden border border-border">
      <Skeleton variant="rectangular" className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
        <div className="flex gap-2">
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="circular" width={24} height={24} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonEffectCard() {
  return (
    <div className="group relative bg-surface rounded-xl overflow-hidden border border-border">
      <Skeleton variant="rectangular" className="aspect-[9/16] w-full" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" width="80%" />
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="text" width="50%" height={12} />
        </div>
        <Skeleton variant="rectangular" width="100%" height={40} className="rounded-lg" />
      </div>
    </div>
  );
}