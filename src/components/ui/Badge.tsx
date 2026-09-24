import type { HTMLAttributes, ForwardRefExoticComponent, RefAttributes, Ref } from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "new" | "trending" | "pro" | "4k" | "1min";
  size?: "sm" | "md";
}

const variants: Record<string, string> = {
  default: "bg-border text-text-secondary",
  new: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  trending: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  pro: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  "4k": "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  "1min": "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
};

const sizes: Record<string, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

const Badge = (({ className, variant = "default", size = "md", children, ...props }: BadgeProps, ref: Ref<HTMLSpanElement>) => {
  const baseStyles = "inline-flex items-center font-medium rounded-full";

  return (
    <span ref={ref} className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}) as ForwardRefExoticComponent<BadgeProps & RefAttributes<HTMLSpanElement>>;

Badge.displayName = "Badge";

export { Badge };