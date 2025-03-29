import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-slate-100 hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary",
  {
    variants: {
      variant: {
        default: "bg-gray-400",
        outline: "border border-input bg-slate-100 hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-8 px-3 text-sm",
        sm: "h-7 px-2 text-xs",
        lg: "h-9 px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
