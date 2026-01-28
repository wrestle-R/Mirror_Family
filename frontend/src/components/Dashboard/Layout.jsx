import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { AppBreadcrumb } from "./AppBreadcrumb"
import { CopilotSidebar } from "./CopilotSidebar"
import { Separator } from "@/components/ui/separator"

export function Layout({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="xl:mr-[380px]">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <AppBreadcrumb />
        </header>
        <div className="flex-1 overflow-y-auto">
            <div className="min-h-full p-4">
                {children}
            </div>
        </div>
      </SidebarInset>
      <CopilotSidebar />
    </SidebarProvider>
  )
}

