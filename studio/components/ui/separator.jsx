import { forwardRef } from "react";
import { Separator as SeparatorPrimitive } from "radix-ui";
import { cn } from "../../lib/utils";

export const Separator = forwardRef(function Separator({ className, orientation = "horizontal", decorative = true, ...props }, ref) {
  return <SeparatorPrimitive.Root ref={ref} decorative={decorative} orientation={orientation} className={cn("ui-separator", className)} {...props} />;
});
