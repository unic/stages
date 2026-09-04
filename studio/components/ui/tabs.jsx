import { forwardRef } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "../../lib/utils";

export const Tabs = TabsPrimitive.Root;
export const TabsList = forwardRef(function TabsList({ className, ...props }, ref) {
  return <TabsPrimitive.List ref={ref} className={cn("ui-tabs-list", className)} {...props} />;
});
export const TabsTrigger = forwardRef(function TabsTrigger({ className, ...props }, ref) {
  return <TabsPrimitive.Trigger ref={ref} className={cn("ui-tabs-trigger", className)} {...props} />;
});
