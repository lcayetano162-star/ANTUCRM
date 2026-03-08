import * as React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e)
      onCheckedChange?.(e.target.checked)
    }

    return (
      <input
        type="checkbox"
        ref={ref}
        onChange={handleChange}
        className={cn(
          "h-4 w-4 shrink-0 rounded border border-gray-300 bg-white",
          "checked:bg-primary checked:border-primary",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "cursor-pointer transition-colors",
          className
        )}
        {...props}
      />
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
