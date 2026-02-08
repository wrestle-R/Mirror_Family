import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap overflow-hidden select-none rounded-[var(--radius)] transition-all duration-200 ease-in-out disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border border-primary/30 bg-gradient-to-b from-primary/90 via-primary to-primary/95 text-primary-foreground shadow-[var(--shadow-xl)] " +
          "hover:from-primary/85 hover:via-primary hover:to-primary/90 hover:shadow-[var(--shadow-2xl)] " +
          "active:translate-y-[1px] active:shadow-[var(--shadow-lg)] " +
          // Sheen stays top-to-bottom, just slightly less on hover
          "before:content-[''] before:absolute before:inset-[1px] before:rounded-[calc(var(--radius)-1px)] before:pointer-events-none " +
          "before:bg-gradient-to-b before:from-primary-foreground/14 before:via-primary-foreground/4 before:to-transparent before:transition-all before:duration-200 before:ease-in-out " +
          "hover:before:from-primary-foreground/10 hover:before:via-primary-foreground/2 hover:before:to-transparent",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 transition-all duration-200 ease-in-out",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 transition-all duration-200 ease-in-out",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all duration-200 ease-in-out",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 transition-all duration-200 ease-in-out",
        link: "text-primary underline-offset-4 hover:underline transition-all duration-200 ease-in-out",
      },
      size: {
        default: "h-10 px-6 text-base has-[>svg]:px-4",
        xs: "h-7 gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 rounded-[var(--radius)] gap-1.5 px-4 text-sm has-[>svg]:px-3",
        lg: "h-12 rounded-[var(--radius)] px-8 text-lg has-[>svg]:px-6",
        icon: "size-10",
        "icon-xs": "size-7 rounded-[var(--radius)] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }