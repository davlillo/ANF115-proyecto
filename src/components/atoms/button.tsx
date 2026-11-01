import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill text-sm font-medium transition-colors disabled:pointer-events-none disabled:border-transparent disabled:bg-superficie-tenue disabled:text-texto-suave [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primario text-white hover:bg-primario-hover",
        secondary:
          "border border-borde-fuerte bg-superficie text-texto hover:bg-superficie-tenue",
        ghost: "text-texto-2 hover:bg-superficie-tenue",
        danger: "bg-peligro-tinte text-peligro hover:bg-peligro/15",
        "danger-solid": "bg-peligro text-white hover:bg-peligro/90",
        link: "text-acento underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3.5 text-[13px]",
        md: "h-10 px-[18px]",
        lg: "h-12 px-6 text-[15px]",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      type={asChild ? undefined : (type ?? "button")}
      {...props}
    />
  );
}

export { buttonVariants };
