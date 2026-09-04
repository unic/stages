import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva("ui-button", {
  variants: {
    variant: {
      default: "ui-button--default",
      destructive: "ui-button--destructive",
      outline: "ui-button--outline",
      secondary: "ui-button--secondary",
      ghost: "ui-button--ghost",
      link: "ui-button--link",
    },
    size: {
      default: "ui-button--default-size",
      sm: "ui-button--sm",
      lg: "ui-button--lg",
      icon: "ui-button--icon",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps
  extends ComponentPropsWithoutRef<"button">,
    VariantProps<typeof buttonVariants> {
  readonly asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...(!asChild && type === undefined ? { type: "button" as const } : { type })}
      {...props}
    />
  );
});
