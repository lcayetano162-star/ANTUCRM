"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const HorizontalDialog = DialogPrimitive.Root

const HorizontalDialogTrigger = DialogPrimitive.Trigger

const HorizontalDialogPortal = DialogPrimitive.Portal

const HorizontalDialogClose = DialogPrimitive.Close

const HorizontalDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
HorizontalDialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const HorizontalDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <HorizontalDialogPortal>
    <HorizontalDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
        "w-[95%] max-w-4xl", // Más ancho que el dialog estándar
        "bg-gradient-to-br from-slate-50 to-white",
        "border border-slate-200/60",
        "rounded-2xl shadow-2xl shadow-slate-200/50",
        "duration-200",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full w-8 h-8 flex items-center justify-center opacity-60 ring-offset-background transition-all hover:opacity-100 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4 text-slate-500" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </HorizontalDialogPortal>
))
HorizontalDialogContent.displayName = DialogPrimitive.Content.displayName

const HorizontalDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white",
      className
    )}
    {...props}
  />
)
HorizontalDialogHeader.displayName = "HorizontalDialogHeader"

const HorizontalDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl",
      className
    )}
    {...props}
  />
)
HorizontalDialogFooter.displayName = "HorizontalDialogFooter"

const HorizontalDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-slate-800",
      className
    )}
    {...props}
  />
))
HorizontalDialogTitle.displayName = DialogPrimitive.Title.displayName

const HorizontalDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-slate-500 mt-1.5", className)}
    {...props}
  />
))
HorizontalDialogDescription.displayName = DialogPrimitive.Description.displayName

// Componente para el cuerpo con layout horizontal
const HorizontalDialogBody = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "px-6 py-5",
      className
    )}
    {...props}
  >
    {children}
  </div>
)
HorizontalDialogBody.displayName = "HorizontalDialogBody"

// Componente para layout de dos columnas
const HorizontalDialogTwoColumn = ({
  className,
  left,
  right,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { left: React.ReactNode; right: React.ReactNode }) => (
  <div
    className={cn(
      "grid grid-cols-1 md:grid-cols-2 gap-6",
      className
    )}
    {...props}
  >
    <div className="space-y-4">{left}</div>
    <div className="space-y-4">{right}</div>
  </div>
)
HorizontalDialogTwoColumn.displayName = "HorizontalDialogTwoColumn"

// Componente para layout de tres columnas
const HorizontalDialogThreeColumn = ({
  className,
  left,
  center,
  right,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { 
  left: React.ReactNode; 
  center: React.ReactNode; 
  right: React.ReactNode 
}) => (
  <div
    className={cn(
      "grid grid-cols-1 md:grid-cols-3 gap-6",
      className
    )}
    {...props}
  >
    <div className="space-y-4">{left}</div>
    <div className="space-y-4">{center}</div>
    <div className="space-y-4">{right}</div>
  </div>
)
HorizontalDialogThreeColumn.displayName = "HorizontalDialogThreeColumn"

export {
  HorizontalDialog,
  HorizontalDialogPortal,
  HorizontalDialogOverlay,
  HorizontalDialogClose,
  HorizontalDialogTrigger,
  HorizontalDialogContent,
  HorizontalDialogHeader,
  HorizontalDialogFooter,
  HorizontalDialogTitle,
  HorizontalDialogDescription,
  HorizontalDialogBody,
  HorizontalDialogTwoColumn,
  HorizontalDialogThreeColumn,
}
