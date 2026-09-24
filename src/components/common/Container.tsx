import type { HTMLAttributes, ForwardRefExoticComponent, RefAttributes, Ref } from "react";
import { cn } from "../../lib/utils";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizes: Record<string, string> = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  xl: "max-w-[90rem]",
  full: "max-w-full",
};

const Container = (({ className, size = "lg", children, ...props }: ContainerProps, ref: Ref<HTMLDivElement>) => {
  return (
    <div
      ref={ref}
      className={cn("mx-auto px-4 sm:px-6 lg:px-8", sizes[size], className)}
      {...props}
    >
      {children}
    </div>
  );
}) as ForwardRefExoticComponent<ContainerProps & RefAttributes<HTMLDivElement>>;

Container.displayName = "Container";

export { Container };