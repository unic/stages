import { cn } from "../../lib/utils";

export function Alert({ className, variant = "default", ...props }) {
  return <div role={variant === "destructive" ? "alert" : "status"} className={cn("ui-alert", `ui-alert--${variant}`, className)} {...props} />;
}

export function AlertDescription({ className, ...props }) {
  return <div className={cn("ui-alert__description", className)} {...props} />;
}
