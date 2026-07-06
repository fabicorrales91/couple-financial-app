import * as React from "react";
import { cn } from "../../lib/utils";

export const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(
      "rounded-md border p-3 text-sm",
      variant === "destructive"
        ? "border-destructive/50 bg-destructive/10 text-destructive"
        : "border-border bg-muted text-foreground",
      className
    )}
    {...props}
  />
));
Alert.displayName = "Alert";
