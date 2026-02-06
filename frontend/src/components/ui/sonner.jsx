"use client"

import { useTheme } from "@/context/ThemeContext"
import { Toaster as Sonner } from "sonner"

function Toaster({ ...props }) {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toaster]:bg-destructive group-[.toaster]:text-white",
          success: "group-[.toaster]:bg-chart-2/10 group-[.toaster]:text-chart-2 group-[.toaster]:border-chart-2/30",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
