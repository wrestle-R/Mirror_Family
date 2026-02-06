import { useMemo, useState } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { AppBreadcrumb } from "./AppBreadcrumb"
import { CopilotSidebar } from "./CopilotSidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export function Layout({ children }) {
  const [copilotOpen, setCopilotOpen] = useState(false)
  const rightInsetClassName = useMemo(() => {
    if (!copilotOpen) return "transition-[margin] duration-300 ease-in-out"
    return "xl:mr-[380px] transition-[margin] duration-300 ease-in-out"
  }, [copilotOpen])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className={rightInsetClassName}>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <AppBreadcrumb />

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCopilotOpen((v) => !v)}
              className="gap-2 hidden xl:inline-flex"
            >
              <Sparkles className="w-4 h-4" />
              Copilot
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
            <div className="min-h-full p-4">
                {children}
            </div>
        </div>
      </SidebarInset>
      <CopilotSidebar open={copilotOpen} onOpenChange={setCopilotOpen} />
    </SidebarProvider>
  )
}

