import type { ButtonHTMLAttributes, ForwardRefExoticComponent, RefAttributes, Ref } from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  asChild?: boolean;
}

const variants: Record<string, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover/80 shadow-lg shadow-primary/25",
  secondary: "bg-secondary text-white hover:bg-secondary/90 active:bg-secondary/80 shadow-lg shadow-secondary/25",
  ghost: "text-text-secondary hover:bg-surface hover:text-text-primary active:bg-border",
  outline: "border border-border text-text-primary hover:bg-surface hover:border-primary/50 active:bg-border",
};

const sizes: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-5 py-2.5 text-base gap-2",
  lg: "px-7 py-3.5 text-lg gap-2.5",
};

const Button = (({ className, variant = "primary", size = "md", loading, disabled, children, asChild, ...props }: ButtonProps, ref: Ref<HTMLButtonElement>) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed";

  const Comp = asChild ? "span" : "button";

  return (
    <Comp
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </Comp>
  );
}) as ForwardRefExoticComponent<ButtonProps & RefAttributes<HTMLButtonElement>>;

Button.displayName = "Button";

export { Button };