import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[1.05rem] border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/45 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-[inset_0_1px_0_color-mix(in_oklch,white_26%,transparent),0_14px_28px_color-mix(in_oklch,var(--primary)_18%,transparent)] hover:bg-[color-mix(in_oklch,var(--primary)_92%,black_8%)]",
        outline:
          "border-[color:var(--surface-outline)] bg-[color:var(--surface-input)] text-foreground shadow-[inset_0_1px_0_color-mix(in_oklch,white_16%,transparent)] hover:bg-[color:var(--surface-subtle)] aria-expanded:bg-[color:var(--surface-subtle)] aria-expanded:text-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-[color:color-mix(in_oklch,var(--secondary)_86%,var(--foreground)_8%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-[color:color-mix(in_oklch,var(--muted)_72%,transparent)] hover:text-foreground aria-expanded:bg-[color:color-mix(in_oklch,var(--muted)_72%,transparent)] aria-expanded:text-foreground",
        destructive:
          "border-transparent bg-[color:color-mix(in_oklch,var(--destructive)_14%,transparent)] text-destructive hover:bg-[color:color-mix(in_oklch,var(--destructive)_22%,transparent)] focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        link: "h-auto rounded-none px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        xs: "h-7 gap-1 rounded-[0.8rem] px-2.5 text-xs in-data-[slot=button-group]:rounded-[0.8rem] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-[0.95rem] px-3.5 text-[0.82rem] in-data-[slot=button-group]:rounded-[0.95rem] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 rounded-[1.15rem] px-5 text-[0.95rem] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs":
          "size-7 rounded-[0.8rem] in-data-[slot=button-group]:rounded-[0.8rem] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9 rounded-[0.95rem] in-data-[slot=button-group]:rounded-[0.95rem]",
        "icon-lg": "size-11 rounded-[1.15rem]",
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
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
