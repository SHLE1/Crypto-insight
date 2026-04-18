"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CheckCircle,
  CircleNotch,
  Info,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CheckCircle size={16} weight="fill" />,
        info: <Info size={16} weight="regular" />,
        warning: <WarningCircle size={16} weight="fill" />,
        error: <XCircle size={16} weight="fill" />,
        loading: <CircleNotch size={16} weight="regular" className="animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "16px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !border-border !bg-popover",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
